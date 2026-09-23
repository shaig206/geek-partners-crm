-- Lead detail pipeline: stable status keys, attributed notes, last touch, per-lead drafts.
-- Apply with: supabase db push
-- or paste this file into the Supabase SQL editor (free project → SQL → New query → Run)
-- after the earlier migrations. Safe to re-run.
--
-- Mapping (communication status, then business status when it is further along):
--   already-stable key                         → unchanged (reason kept)
--   business זכייה                             → converted
--   business לא רלוונטי / status לא רלוונטי    → not_relevant
--   אין מענה פעמיים                            → not_relevant + reason unreachable
--   business בפגישה או שיחה / הצעה נשלחה       → in_conversation
--   נשלח / נשלחה הודעה / נענה /
--   אין מענה / אין מענה פעם אחת                → contacted
--   חדש / נמצא מייל / טיוטה ממתינה / other     → new
--   לא רלוונטי that came from אין מענה*        → reason unreachable
-- Previous Hebrew statuses and warming_notes are copied into lead_notes
-- (author מיגרציה) so nothing is dropped.

alter table public.leads
  add column if not exists not_relevant_reason text;

alter table public.leads
  add column if not exists last_touched_at timestamptz;

-- Allow the rewrite, then put the new checks back at the end.
do $$
declare
  r record;
begin
  for r in
    select con.conname
    from pg_constraint con
    join pg_attribute att
      on att.attrelid = con.conrelid
     and att.attnum = any (con.conkey)
    where con.conrelid = 'public.leads'::regclass
      and con.contype = 'c'
      and att.attname in ('status', 'not_relevant_reason')
  loop
    execute format('alter table public.leads drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.leads disable trigger leads_set_updated_at;

do $$
begin
  create temp table _lead_status_migration on commit drop as
  select
    id,
    status as old_status,
    business_status as old_business,
    not_relevant_reason as old_reason,
    warming_notes,
    updated_at,
    created_at,
    null::text as new_status,
    null::text as new_reason
  from public.leads;

  update _lead_status_migration
  set new_status = case
    when old_status in (
      'new',
      'contacted',
      'in_conversation',
      'follow_up_scheduled',
      'not_relevant',
      'converted'
    ) then old_status
    when old_business = 'זכייה' then 'converted'
    when old_business = 'לא רלוונטי'
      or old_status in ('לא רלוונטי', 'אין מענה פעמיים') then 'not_relevant'
    when old_business in ('בפגישה או שיחה', 'הצעה נשלחה') then 'in_conversation'
    when old_status in (
      'נשלח',
      'נשלחה הודעה',
      'נענה',
      'אין מענה',
      'אין מענה פעם אחת'
    ) then 'contacted'
    else 'new'
  end;

  update _lead_status_migration
  set new_reason = case
    when old_status in (
      'new',
      'contacted',
      'in_conversation',
      'follow_up_scheduled',
      'not_relevant',
      'converted'
    ) then case when new_status = 'not_relevant' then old_reason else null end
    when new_status = 'not_relevant'
      and old_status in ('אין מענה', 'אין מענה פעם אחת', 'אין מענה פעמיים')
      then 'unreachable'
    else null
  end;

  update public.leads as lead
  set
    status = mig.new_status,
    not_relevant_reason = mig.new_reason
  from _lead_status_migration as mig
  where lead.id = mig.id
    and (
      lead.status is distinct from mig.new_status
      or lead.not_relevant_reason is distinct from mig.new_reason
    );

  -- Keep a snapshot for the note insert after lead_notes exists.
  -- A temp table would disappear at commit; this staging table is dropped later.
  create table if not exists public._lead_status_migration_stage (
    id uuid primary key,
    old_status text,
    old_business text,
    warming_notes text,
    new_status text,
    new_reason text,
    note_at timestamptz
  );

  truncate public._lead_status_migration_stage;

  insert into public._lead_status_migration_stage (
    id, old_status, old_business, warming_notes, new_status, new_reason, note_at
  )
  select
    id,
    old_status,
    old_business,
    warming_notes,
    new_status,
    new_reason,
    coalesce(updated_at, created_at, now())
  from _lead_status_migration;
end $$;

alter table public.leads enable trigger leads_set_updated_at;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads drop constraint if exists leads_not_relevant_reason_check;

alter table public.leads
  add constraint leads_status_check
  check (status in (
    'new',
    'contacted',
    'in_conversation',
    'follow_up_scheduled',
    'not_relevant',
    'converted'
  ));

alter table public.leads
  add constraint leads_not_relevant_reason_check
  check (
    not_relevant_reason is null
    or (
      status = 'not_relevant'
      and not_relevant_reason in ('closed', 'no_fit', 'wrong_area', 'unreachable')
    )
  );

alter table public.leads alter column status set default 'new';
alter table public.leads alter column last_touched_at set default now();

update public.leads
set last_touched_at = coalesce(last_contacted_at, updated_at, created_at)
where last_touched_at is null;

create table if not exists public.lead_notes (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  body text not null check (char_length(trim(body)) > 0),
  author_email text not null,
  author_name text not null,
  created_at timestamptz not null default now()
);

create index if not exists lead_notes_lead_created_idx
  on public.lead_notes (lead_id, created_at desc);

insert into public.lead_notes (lead_id, body, author_email, author_name, created_at)
select
  stage.id,
  'מיגרציה מכרטיס קודם. סטטוס תקשורת: ' || stage.old_status
    || '. סטטוס עסקי: ' || coalesce(stage.old_business, '—')
    || '. מופה ל«' || case stage.new_status
      when 'new' then 'חדש'
      when 'contacted' then 'נוצר קשר'
      when 'in_conversation' then 'בשיחה'
      when 'follow_up_scheduled' then 'נקבע מעקב'
      when 'not_relevant' then 'לא רלוונטי'
      when 'converted' then 'הומר'
      else stage.new_status
    end || '»'
    || case
      when stage.new_reason = 'closed' then ' (נסגר)'
      when stage.new_reason = 'no_fit' then ' (לא מתאים)'
      when stage.new_reason = 'wrong_area' then ' (אזור לא נכון)'
      when stage.new_reason = 'unreachable' then ' (אין מענה)'
      else ''
    end
    || '.'
    || case
      when stage.warming_notes is not null and char_length(trim(stage.warming_notes)) > 0
        then E'\nהערות חימום:\n' || stage.warming_notes
      else ''
    end,
  'migration@localhost',
  'מיגרציה',
  stage.note_at
from public._lead_status_migration_stage as stage
where (
  stage.old_status not in (
    'new',
    'contacted',
    'in_conversation',
    'follow_up_scheduled',
    'not_relevant',
    'converted'
  )
  or (
    stage.warming_notes is not null
    and char_length(trim(stage.warming_notes)) > 0
  )
)
and not exists (
  select 1
  from public.lead_notes existing
  where existing.lead_id = stage.id
    and existing.author_email = 'migration@localhost'
);

drop table if exists public._lead_status_migration_stage;

create table if not exists public.lead_message_drafts (
  lead_id uuid not null references public.leads (id) on delete cascade,
  kind text not null check (kind in ('first_touch', 'follow_up', 'soft_close')),
  channel text not null check (channel in ('whatsapp', 'email')),
  subject text,
  body text not null check (char_length(trim(body)) > 0),
  updated_at timestamptz not null default now(),
  primary key (lead_id, kind, channel)
);

create index if not exists lead_message_drafts_lead_idx
  on public.lead_message_drafts (lead_id);

drop trigger if exists lead_message_drafts_set_updated_at on public.lead_message_drafts;
create trigger lead_message_drafts_set_updated_at
before update on public.lead_message_drafts
for each row execute function public.set_updated_at();

create or replace function public.touch_lead_on_pipeline_change()
returns trigger
language plpgsql
as $$
begin
  if new.status is distinct from old.status
     or new.not_relevant_reason is distinct from old.not_relevant_reason then
    new.last_touched_at = now();
  end if;
  return new;
end;
$$;

drop trigger if exists leads_touch_on_pipeline on public.leads;
create trigger leads_touch_on_pipeline
before update on public.leads
for each row execute function public.touch_lead_on_pipeline_change();

create or replace function public.touch_lead_from_note()
returns trigger
language plpgsql
as $$
begin
  update public.leads
  set last_touched_at = now()
  where id = new.lead_id;
  return new;
end;
$$;

drop trigger if exists lead_notes_touch_lead on public.lead_notes;
create trigger lead_notes_touch_lead
after insert on public.lead_notes
for each row execute function public.touch_lead_from_note();

alter table public.lead_notes enable row level security;
alter table public.lead_message_drafts enable row level security;

drop policy if exists "authenticated_crud_lead_notes" on public.lead_notes;
create policy "authenticated_crud_lead_notes"
on public.lead_notes for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated_crud_lead_message_drafts" on public.lead_message_drafts;
create policy "authenticated_crud_lead_message_drafts"
on public.lead_message_drafts for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.lead_notes to authenticated;
grant select, insert, update, delete on public.lead_message_drafts to authenticated;
grant all on public.lead_notes to service_role;
grant all on public.lead_message_drafts to service_role;

create index if not exists leads_last_touched_at_idx
  on public.leads (last_touched_at desc);

comment on column public.leads.status is
  'Pipeline status (stable keys): new | contacted | in_conversation | follow_up_scheduled | not_relevant | converted. Hebrew labels live in the app.';

comment on column public.leads.not_relevant_reason is
  'Set only when status = not_relevant: closed | no_fit | wrong_area | unreachable.';

comment on column public.leads.last_touched_at is
  'Last status change or note. Maintained by triggers on pipeline updates and lead_notes inserts.';

comment on table public.lead_notes is
  'Timestamped notes on a lead. author_name + author_email record who wrote each line.';

comment on table public.lead_message_drafts is
  'Per-lead overrides of the starter WhatsApp and email drafts (first touch, follow-up, soft close).';
