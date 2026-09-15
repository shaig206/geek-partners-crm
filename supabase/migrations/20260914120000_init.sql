-- Geek Partners CRM schema
-- Apply in the Supabase SQL editor (or: supabase db push).

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website text,
  category text,
  city text not null default 'פרדס חנה-כרכור',
  business_type text check (business_type is null or business_type in ('B2C', 'B2B', 'B2B2C')),
  size_signal text,
  lag_score integer check (lag_score is null or (lag_score between 1 and 5)),
  why_lagging text,
  peer_gap text,
  phone text,
  email text,
  contact_name text,
  status text not null default 'חדש' check (status in (
    'חדש',
    'נמצא מייל',
    'טיוטה ממתינה',
    'נשלח',
    'נענה',
    'אין מענה',
    'לא רלוונטי'
  )),
  warming_notes text,
  source_url text,
  priority boolean not null default false,
  found_at date,
  last_contacted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.email_drafts (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  to_email text not null,
  to_name text,
  subject text not null,
  body text not null,
  status text not null default 'draft' check (status in (
    'draft',
    'pending_approval',
    'approved',
    'rejected',
    'sent',
    'failed'
  )),
  reject_reason text,
  approved_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sends (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.leads (id) on delete cascade,
  draft_id uuid references public.email_drafts (id) on delete set null,
  from_email text not null,
  to_email text not null,
  subject text not null,
  body text not null,
  provider text not null default 'resend',
  provider_message_id text,
  status text not null default 'queued' check (status in ('queued', 'sent', 'bounced', 'failed')),
  error text,
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Inbound webhook log (chat/Slack notify is intentionally external).
create table if not exists public.inbound_events (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null default '{}'::jsonb,
  from_email text,
  matched_lead_id uuid references public.leads (id) on delete set null,
  previous_status text,
  new_status text,
  note text,
  created_at timestamptz not null default now()
);

create index if not exists leads_status_idx on public.leads (status);
create index if not exists leads_lag_score_idx on public.leads (lag_score);
create index if not exists leads_business_type_idx on public.leads (business_type);
create index if not exists leads_email_lower_idx on public.leads (lower(email));
create index if not exists leads_priority_idx on public.leads (priority);
create index if not exists email_drafts_lead_id_idx on public.email_drafts (lead_id);
create index if not exists email_drafts_status_idx on public.email_drafts (status);
create index if not exists sends_lead_id_idx on public.sends (lead_id);
create index if not exists inbound_events_from_email_idx on public.inbound_events (from_email);

drop trigger if exists leads_set_updated_at on public.leads;
create trigger leads_set_updated_at
before update on public.leads
for each row execute function public.set_updated_at();

drop trigger if exists email_drafts_set_updated_at on public.email_drafts;
create trigger email_drafts_set_updated_at
before update on public.email_drafts
for each row execute function public.set_updated_at();

alter table public.leads enable row level security;
alter table public.email_drafts enable row level security;
alter table public.sends enable row level security;
alter table public.inbound_events enable row level security;

drop policy if exists "authenticated_crud_leads" on public.leads;
create policy "authenticated_crud_leads"
on public.leads for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated_crud_email_drafts" on public.email_drafts;
create policy "authenticated_crud_email_drafts"
on public.email_drafts for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated_crud_sends" on public.sends;
create policy "authenticated_crud_sends"
on public.sends for all to authenticated
using (true) with check (true);

drop policy if exists "authenticated_read_inbound_events" on public.inbound_events;
create policy "authenticated_read_inbound_events"
on public.inbound_events for select to authenticated
using (true);

grant usage on schema public to authenticated, service_role;

grant select, insert, update, delete on public.leads to authenticated;
grant select, insert, update, delete on public.email_drafts to authenticated;
grant select, insert, update, delete on public.sends to authenticated;
grant select on public.inbound_events to authenticated;

grant all on public.leads to service_role;
grant all on public.email_drafts to service_role;
grant all on public.sends to service_role;
grant all on public.inbound_events to service_role;

comment on table public.leads is 'Outreach leads for Geek Partners, primarily Pardes Hanna-Karkur.';
comment on table public.email_drafts is 'Hebrew outreach drafts. Mail is sent only after pending_approval is approved server-side.';
comment on table public.sends is 'Resend send log. Written by service-role server actions only.';
comment on table public.inbound_events is 'Resend inbound webhook log. Chat notification is handled outside this app.';
