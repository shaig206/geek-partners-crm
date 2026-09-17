-- Split communication status vs business status on leads.
-- Apply with: supabase db push
-- (or paste this file into the Supabase SQL editor after prior migrations.)
--
-- 1) Adds business_status (סטטוס עסקי) with default 'חדש'.
-- 2) Migrates old leads.status values, then tightens the communication-status check
--    to: חדש | נשלחה הודעה | אין מענה פעם אחת | אין מענה פעמיים
-- 3) Indexes + comments.
--
-- Mapping (best effort):
--   נשלח            → communication נשלחה הודעה
--   אין מענה        → communication אין מענה פעם אחת
--   לא רלוונטי      → business_status לא רלוונטי, communication חדש
--   everything else → communication חדש (נמצא מייל, טיוטה ממתינה, נענה, unknown)

alter table public.leads
  add column if not exists business_status text not null default 'חדש';

-- Drop old / current check constraints on status and business_status so we can
-- rewrite values, then re-add named checks.
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
      and att.attname in ('status', 'business_status')
  loop
    execute format('alter table public.leads drop constraint if exists %I', r.conname);
  end loop;
end $$;

update public.leads
set
  business_status = case
    when status = 'לא רלוונטי' then 'לא רלוונטי'
    when business_status in (
      'חדש',
      'רלוונטי',
      'בפגישה או שיחה',
      'הצעה נשלחה',
      'זכייה',
      'לא רלוונטי'
    ) then business_status
    else 'חדש'
  end,
  status = case
    when status in ('נשלח', 'נשלחה הודעה') then 'נשלחה הודעה'
    when status in ('אין מענה', 'אין מענה פעם אחת') then 'אין מענה פעם אחת'
    when status = 'אין מענה פעמיים' then 'אין מענה פעמיים'
    when status = 'חדש' then 'חדש'
    else 'חדש'
  end;

alter table public.leads drop constraint if exists leads_status_check;
alter table public.leads drop constraint if exists leads_business_status_check;

alter table public.leads
  add constraint leads_status_check
  check (status in (
    'חדש',
    'נשלחה הודעה',
    'אין מענה פעם אחת',
    'אין מענה פעמיים'
  ));

alter table public.leads
  add constraint leads_business_status_check
  check (business_status in (
    'חדש',
    'רלוונטי',
    'בפגישה או שיחה',
    'הצעה נשלחה',
    'זכייה',
    'לא רלוונטי'
  ));

create index if not exists leads_business_status_idx
  on public.leads (business_status);

comment on column public.leads.status is
  'Communication status (סטטוס תקשורת): חדש | נשלחה הודעה | אין מענה פעם אחת | אין מענה פעמיים.';

comment on column public.leads.business_status is
  'Business status (סטטוס עסקי): חדש | רלוונטי | בפגישה או שיחה | הצעה נשלחה | זכייה | לא רלוונטי.';

comment on column public.leads.follow_up_at is
  'Scheduled first follow-up. Set to last_contacted_at + 3 calendar days when outreach is marked sent (communication status נשלחה הודעה). Null until then.';
