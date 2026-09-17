-- Post-send follow-up on leads.
-- Apply with: supabase db push
-- (or paste this file into the Supabase SQL editor after the init migration.)
--
-- Adds nullable follow_up_at. last_contacted_at is unchanged.
-- The app sets follow_up_at to now + 3 calendar days when outreach is marked sent
-- (see FOLLOW_UP_DAYS_AFTER_SEND in lib/constants.ts). Due/overdue in the UI is
-- "follow_up_at on or before today" in Asia/Jerusalem while status is נשלח.

alter table public.leads
  add column if not exists follow_up_at timestamptz;

comment on column public.leads.follow_up_at is
  'Scheduled first follow-up. Set to last_contacted_at + 3 calendar days when outreach is marked sent. Null until then.';

comment on column public.leads.last_contacted_at is
  'Timestamp of the latest outreach (WhatsApp/email/other). Kept when follow_up_at is set.';

create index if not exists leads_follow_up_at_idx
  on public.leads (follow_up_at)
  where follow_up_at is not null;
