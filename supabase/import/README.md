# Importing more leads later

Three supported paths, from simplest to most repeatable:

## 1. Table Editor (fastest)

1. Open the Supabase project → **Table Editor** → `leads`.
2. **Insert** → **Import data from CSV**.
3. Use a file shaped like [`leads.example.csv`](./leads.example.csv).
4. Map columns 1:1. Leave `id`, `created_at`, and `updated_at` unmapped so they default.

## 2. SQL editor

Paste rows into `insert into public.leads (...) values (...);` using the same columns as [`../seed.sql`](../seed.sql). Skip names that already exist:

```sql
insert into public.leads (name, city, business_type, lag_score, status, business_status, email)
select * from (values
  ('עסק חדש', 'פרדס חנה-כרכור', 'B2C', 4, 'new', 'חדש', 'new@example.com')
) as incoming(name, city, business_type, lag_score, status, business_status, email)
where not exists (
  select 1 from public.leads l where l.name = incoming.name
);
```

## 3. psql `\copy` (CLI)

From a machine that can reach the database:

```bash
psql "$DATABASE_URL" -c "\copy public.leads(name,website,category,city,business_type,size_signal,lag_score,why_lagging,peer_gap,phone,email,contact_name,status,business_status,warming_notes,source_url,priority,found_at) from 'supabase/import/leads.example.csv' csv header"
```

`status` (pipeline, stable keys) must be one of: `new` | `contacted` | `in_conversation` | `follow_up_scheduled` | `not_relevant` | `converted`  
Hebrew labels in the app: חדש · נוצר קשר · בשיחה · נקבע מעקב · לא רלוונטי · הומר.  
`not_relevant_reason`, when set, must be `closed` | `no_fit` | `wrong_area` | `unreachable` and only with status `not_relevant`.  

`business_status` (סטטוס עסקי) must be one of: חדש | רלוונטי | בפגישה או שיחה | הצעה נשלחה | זכייה | לא רלוונטי  

`business_type` must be `B2C`, `B2B`, or `B2B2C`.  
`lag_score` is 1–5.

WhatsApp as a channel is **not** a CSV column. The app treats a lead as having WhatsApp only when `phone` normalizes to an Israeli **mobile starting with 05** (spaces, dashes, and `+972` are stripped). Landlines (02/03/04/07/08/09…) are not WhatsApp. Email channel = non-empty `email`.
