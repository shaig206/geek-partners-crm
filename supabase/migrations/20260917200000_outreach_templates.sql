-- Durable outreach message templates (WhatsApp / email).
-- Apply with: supabase db push
-- (or paste this file into the Supabase SQL editor after prior migrations.)
--
-- Stores named Hebrew templates used by lead WhatsApp + email composers.
-- Seeds one default WhatsApp template and one default email template.

create table if not exists public.outreach_templates (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(trim(name)) > 0),
  channel text not null check (channel in ('whatsapp', 'email', 'both')),
  body text not null check (char_length(trim(body)) > 0),
  subject text,
  is_default boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists outreach_templates_channel_idx
  on public.outreach_templates (channel);

create index if not exists outreach_templates_sort_idx
  on public.outreach_templates (sort_order, created_at);

create index if not exists outreach_templates_default_idx
  on public.outreach_templates (is_default)
  where is_default;

drop trigger if exists outreach_templates_set_updated_at on public.outreach_templates;
create trigger outreach_templates_set_updated_at
before update on public.outreach_templates
for each row execute function public.set_updated_at();

alter table public.outreach_templates enable row level security;

drop policy if exists "authenticated_crud_outreach_templates" on public.outreach_templates;
create policy "authenticated_crud_outreach_templates"
on public.outreach_templates for all to authenticated
using (true) with check (true);

grant select, insert, update, delete on public.outreach_templates to authenticated;
grant all on public.outreach_templates to service_role;

comment on table public.outreach_templates is
  'Hebrew outreach templates. Lead composers fill placeholders from the default template for that channel.';
comment on column public.outreach_templates.channel is
  'whatsapp | email | both. Default lookup prefers an exact channel match over both.';
comment on column public.outreach_templates.subject is
  'Email subject template. Null for WhatsApp-only rows.';
comment on column public.outreach_templates.is_default is
  'When true, used by lead WhatsApp/email composers for this channel. App keeps one default per channel.';

-- Seed defaults (idempotent). Do not overwrite if Shai already edited these rows.
insert into public.outreach_templates (
  id, name, channel, subject, body, is_default, sort_order
)
values
(
  'c0a1e001-0001-4000-8000-000000000001',
  'וואטסאפ — ברירת מחדל',
  'whatsapp',
  null,
  $wa_body${{greeting}} שמי {{owner_name}}, {{owner_role}}. אני עובד עם עסקים בינוניים על שיפור כל השכבה הטכנולוגית שלהם — מהאתר והנוכחות הדיגיטלית ועד כלים שמסדרים מכירות, מעקב ותפעול.

עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{pinpoints}}

אנחנו בעיצומה של מהפכת ה-AI: עסקים עושים דברים מטורפים במהירות, מותאם אישית, ובלי מחלקת הייטק — בשיווק ובמכירות, במעקב אחרי לקוחות, בארגון, בכספים, וגם בהבאת פניות והפיכתן לתורים ולתשלומים אונליין. אפשר לחבר את מה שכבר עובד אצלך לכלים האלה בצורה שקטה ומותאמת.

אם זה רלוונטי, אשמח לשלוח הצעה קצרה. בלי התחייבות ובלי לחץ.

{{owner_name}}
Geek Partners$wa_body$,
  true,
  10
),
(
  'c0a1e001-0001-4000-8000-000000000002',
  'מייל — ברירת מחדל',
  'email',
  'רעיון קטן ל{{business_name}}',
  $email_body${{greeting}}

שמי {{owner_name}}, {{owner_role}}. אני עובד עם עסקים בינוניים על שיפור כל השכבה הטכנולוגית שלהם — מהאתר והנוכחות הדיגיטלית ועד כלים שמסדרים מכירות, מעקב ותפעול.

עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{pinpoints}}

{{ai_revolution}}

אם זה רלוונטי, אשמח לשלוח הצעה קצרה. בלי התחייבות ובלי לחץ.

{{owner_name}}
Geek Partners$email_body$,
  true,
  20
)
on conflict (id) do nothing;
