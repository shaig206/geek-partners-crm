# Geek Partners CRM

Simple Hebrew RTL CRM for **Geek Partners** (`geek.partners`), owned by **Shai Gilboa (שי גלבוע)**.

Stack: Next.js App Router, TypeScript, Tailwind CSS, Supabase, Resend. Deploy target: Vercel.

v1 is single-user. Magic-link auth protects every app page. Outreach mail is **never** sent until a draft is approved, and the server re-checks `email_drafts.status = pending_approval` in the database immediately before calling Resend.

## Features

- Magic-link login (Supabase Auth)
- Leads list: search, filter by **סטטוס תקשורת** / **סטטוס עסקי** / channel (וואטסאפ · מייל · שניהם · כלום) / B2C|B2B / lag score / **צריך מעקב**, sort (including follow-up soonest)
- Lead detail card with all fields; edit phone, email, notes, both statuses
- After sending WhatsApp or email, **סימנתי שנשלח** sets communication status `נשלחה הודעה`, stamps `last_contacted_at`, and schedules `follow_up_at` 3 calendar days later
- Compose a Hebrew outreach draft from the lead (default **תבניות** row + lead pinpoints)
- **תבניות** at `/templates`: create / edit / duplicate / set default / delete Hebrew WhatsApp and email templates (saved in Supabase)
- WhatsApp Web helper on lead detail (and a light list link): copy a message from the default WhatsApp template and open `wa.me` — no auto-send, needs a usable phone number
- Approval flow: `draft` → `pending_approval` → **Approve** sends via Resend (server-only) → log send → communication status `נשלחה הודעה` + follow-up in 3 days. Reject with a reason.
- SQL migration + Hebrew sample leads for Pardes Hanna-Karkur, plus a later import path
- `POST /api/webhooks/resend-inbound` stub for inbound mail (chat notify is external)

## Local setup

```bash
cp .env.example .env.local
# fill in the keys from Supabase + Resend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) or [http://127.0.0.1:3000](http://127.0.0.1:3000). Both work in local development (`allowedDevOrigins` in `next.config.ts` so Next 16 HMR hydrates either hostname). You will be sent to `/login`.

To skip magic-link login on your computer, add `LOCAL_NO_AUTH=true` to `.env.local` and restart `npm run dev`. Root `/` and `/leads` then load without email auth. Leave the flag unset (or `false`) for the normal login flow — do not set it on Vercel.

Required env (also listed in `.env.example`):

| Variable | Where |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | same (anon / publishable key) |
| `SUPABASE_SERVICE_ROLE_KEY` | same (service role — **server only**) |
| `RESEND_API_KEY` | [Resend API keys](https://resend.com/api-keys) |
| `RESEND_FROM_EMAIL` | verified sender, e.g. `Geek Partners <hello@geek.partners>` |
| `LOCAL_NO_AUTH` | optional, local only. Set to `true` to skip magic-link login |

Never commit `.env.local`. The service role key and Resend key must not appear in client code.

```bash
npm run build    # production build
npm run lint
npm run typecheck
```

## Supabase

1. Create a project.
2. **Authentication → Providers → Email**: enable magic link / OTP. Turn off confirmations if you want the first login to just work for a single user.
3. **Authentication → URL configuration**
   - Site URL: `http://localhost:3000` locally, then your Vercel URL in production.
   - Redirect URLs: `http://localhost:3000/auth/callback` and `https://YOUR_DOMAIN/auth/callback`.
4. Apply schema migrations (SQL editor or `supabase db push`):
   1. [`supabase/migrations/20260914120000_init.sql`](supabase/migrations/20260914120000_init.sql) — tables, RLS, indexes
   2. [`supabase/migrations/20260917120000_leads_follow_up_at.sql`](supabase/migrations/20260917120000_leads_follow_up_at.sql) — adds `leads.follow_up_at` (nullable `timestamptz`). Safe to re-run (`IF NOT EXISTS`). Does not change `last_contacted_at`.
   3. [`supabase/migrations/20260917180000_leads_status_redesign.sql`](supabase/migrations/20260917180000_leads_status_redesign.sql) — adds `business_status`, migrates old `status` values, tightens communication-status check. **Existing local/dev databases must apply this after pull** (`supabase db push` or paste the SQL).
   4. [`supabase/migrations/20260917200000_outreach_templates.sql`](supabase/migrations/20260917200000_outreach_templates.sql) — `outreach_templates` table, RLS, and one default WhatsApp + one default email template. **After this PR is merged, run `supabase db push`** (or paste the SQL) so templates persist in the product.
5. Run [`supabase/seed.sql`](supabase/seed.sql) for the sample Pardes Hanna-Karkur leads.
6. Invite / send a magic link to Shai’s email.

RLS: authenticated users have CRUD on `leads`, `email_drafts`, `sends`, and `outreach_templates`. The service role is used only in server code for Resend send + inbound logging (it bypasses RLS). `LOCAL_NO_AUTH=true` uses the service-role client for these tables as well.

### Import more leads later

See [`supabase/import/README.md`](supabase/import/README.md). Start from [`supabase/import/leads.example.csv`](supabase/import/leads.example.csv).

## Vercel

1. Import this GitHub repo into Vercel.
2. Set the same env vars as `.env.example` in **Project Settings → Environment Variables**.
3. After the first deploy, add the production URL to Supabase Auth redirect URLs and Site URL.
4. Optional: point `geek.partners` (or a subdomain) at the Vercel project.
5. After changing Production env vars (especially `NEXT_PUBLIC_*`), trigger a new Production git deploy so Next.js rebakes them into the client bundle.

## Approve-and-send flow

Nothing in the browser talks to Resend.

1. Open a lead → compose Hebrew subject + body (prefilled from the **default email template** plus the lead’s pinpoints; falls back to the built-in composer if no default exists).
2. Save as **draft**, or check **שלח לאישור** so the row becomes `pending_approval`. Communication status on the lead is unchanged until mark-sent / approve-and-send.
3. **דחייה** stores `rejected` plus `reject_reason`. No mail is sent.
4. **אישור ושליחה** is a server action that:
   1. Confirms the caller is logged in.
   2. Loads the draft with the **service role**.
   3. **Aborts unless `status` is still `pending_approval`.**
   4. Atomically claims the row (`pending_approval` → `approved`). If zero rows update, it does not send.
   5. Calls Resend with `RESEND_API_KEY` / `RESEND_FROM_EMAIL`.
   6. Inserts a `sends` row, sets the draft to `sent` or `failed`, and moves the lead communication status to `נשלחה הודעה` with `last_contacted_at` and `follow_up_at` (now + 3 calendar days).

If the Resend key is missing, approval returns a Hebrew error and does not pretend to send.

## WhatsApp Web (manual)

On a lead with a phone number, the CRM suggests a Hebrew WhatsApp message from the **default WhatsApp template** on `/templates` (placeholders such as `{{greeting}}`, `{{pinpoints}}`, `{{ai_revolution}}` are filled from the lead). If no default template exists, it falls back to the built-in short opener. **העתקה** copies it (clipboard API, with an `execCommand` fallback if the context is not secure). **פתיחה ב-WhatsApp Web** is a real `wa.me` link (`target="_blank"`) so it does not depend on `window.open` / popup blockers. Local Israeli `0…` numbers are normalized to country code `972`. Nothing is sent server-side — use WhatsApp Web on the same computer.

If the phone is missing, cannot be normalized, or is a landline (not Israeli mobile `05…`), the block explains that a mobile number is needed and links to the contact editor. The leads list shows a small וואטסאפ link only when the number is a 05-mobile.

After you actually send in WhatsApp Web, click **סימנתי שנשלח בוואטסאפ**. That is the CRM write — nothing is posted to WhatsApp from the server.

## Outreach templates

`/templates` (**תבניות** in the CRM nav, next to לידים) stores Hebrew WhatsApp and email templates in `outreach_templates`.

- Channels: `whatsapp` | `email` | `both`. Subject is required for email / both.
- Placeholders filled on the lead card: `{{greeting}}`, `{{first_name}}`, `{{business_name}}`, `{{category}}`, `{{category_bit}}`, `{{city}}`, `{{why_lagging}}`, `{{peer_gap}}`, `{{pinpoints}}`, `{{owner_name}}`, `{{owner_role}}`, `{{company}}`, `{{ai_revolution}}`. `{{greeting}}` is the existing first-name form (`שלום אלי,`). `{{pinpoints}}` is why_lagging + peer_gap.
- One default per channel (setting default unsets overlapping defaults). The last remaining default cannot be deleted until another template is set as default.
- Seeded defaults follow the approved Geek Partners structure: soft greeting + intro (medium businesses / full tech stack) → their pinpoints → AI revolution → soft invite → שי גלבוע / Geek Partners.

After merge, apply the migration with `supabase db push` so the table exists in the hosted project.

## Mark sent and 3-day follow-up

WhatsApp and email are sent outside the “mark sent” click (WhatsApp Web, Resend approval, or a mail client). Then:

1. On the lead, click **סימנתי שנשלח בוואטסאפ** or **סימנתי שנשלח במייל**.
2. Server action `markLeadSent` (also used after Resend approve-and-send):
   - `status` (סטטוס תקשורת) → `נשלחה הודעה`
   - `last_contacted_at` → now
   - `follow_up_at` → now + **3 calendar days** (`FOLLOW_UP_DAYS_AFTER_SEND` in `lib/constants.ts`). Calendar days here means the UTC date is advanced by 3, keeping the same clock time. This is not business-day skipping.
   - `warming_notes` gets a short Hebrew line such as `סומן כנשלח בוואטסאפ (17.09.2026)`.
3. The lead card shows **מעקב הבא** when `follow_up_at` is set.
4. Later, edit **סטטוס תקשורת** (`אין מענה פעם אחת` / `אין מענה פעמיים`) and **סטטוס עסקי** (`רלוונטי` / `בפגישה או שיחה` / `הצעה נשלחה` / `זכייה` / `לא רלוונטי`) in the contact form.

**צריך מעקב** on the list (badge + filter) when `follow_up_at` is today or earlier in `Asia/Jerusalem` and communication status is still `נשלחה הודעה`, `אין מענה פעם אחת`, or `אין מענה פעמיים`. Sort option **מעקב מוקדם תחילה** orders by `follow_up_at` ascending (nulls last).

`LOCAL_NO_AUTH=true` still works for this flow; `markLeadSent` goes through `requireUser()`.

## Inbound webhook

`POST /api/webhooks/resend-inbound` is a **stub** (no chat/Slack/WhatsApp). Point a Resend `email.received` webhook at:

```
https://YOUR_DOMAIN/api/webhooks/resend-inbound
```

It accepts a JSON payload, matches a lead by `from` email when possible, nudges **סטטוס עסקי** toward `רלוונטי` if it is still `חדש` and communication status is `נשלחה הודעה` / `אין מענה פעם אחת` / `אין מענה פעמיים`, and logs to `inbound_events`.

**Chat notify is external.** Hook Slack, WhatsApp, or a Cursor/chat bot on `inbound_events` (or a database webhook) outside this app.

Optional production hardening: verify Svix signatures with `RESEND_WEBHOOK_SECRET` (not required for the v1 stub).

## Lead statuses

Two independent fields:

**סטטוס תקשורת** (`leads.status`): `חדש` · `נשלחה הודעה` · `אין מענה פעם אחת` · `אין מענה פעמיים`

**סטטוס עסקי** (`leads.business_status`): `חדש` · `רלוונטי` · `בפגישה או שיחה` · `הצעה נשלחה` · `זכייה` · `לא רלוונטי`

**ערוץ** is computed, not stored: WhatsApp iff phone normalizes to Israeli mobile `05…`; email iff non-empty email. List filters: וואטסאפ / מייל / שניהם / כלום.

UI: Hebrew RTL throughout. B2C rows get an indigo start-border; lag scores 4–5 are amber/red. Colors follow the geek.partners light-mode indigo/slate palette (`#4F46E5` CTAs, `#F8FAFC` page, Heebo).
