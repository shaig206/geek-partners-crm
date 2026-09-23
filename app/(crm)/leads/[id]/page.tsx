import Link from "next/link";
import { notFound } from "next/navigation";
import { ComposeDraftForm } from "@/components/compose-draft-form";
import { DraftList } from "@/components/draft-list";
import {
  BusinessStatusBadge,
  BusinessTypeBadge,
  ChannelBadges,
  LagBadge,
  NeedsFollowUpBadge,
} from "@/components/badges";
import { LeadContactForm } from "@/components/lead-contact-form";
import { LeadNotesPanel } from "@/components/lead-notes-panel";
import { LeadStatusRow } from "@/components/lead-status-row";
import { LeadTemplatesPanel } from "@/components/lead-templates-panel";
import { requireUser } from "@/lib/auth";
import { formatIsraeliMobile, israeliMobileDigits } from "@/lib/channels";
import { isResendConfigured } from "@/lib/env";
import { needsFollowUp } from "@/lib/follow-up";
import { leadStatusLabel, notRelevantReasonLabel } from "@/lib/lead-status";
import { resolveLeadDrafts } from "@/lib/starter-outreach";
import { composeTemplatedOutreach, pickDefaultTemplate } from "@/lib/templates";
import type { EmailDraft, Lead, LeadMessageDraft, LeadNote, OutreachTemplate, Send } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";
import { buildWhatsAppWebUrl, normalizePhoneForWaMe } from "@/lib/whatsapp";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { supabase } = await requireUser();

  const { data: lead, error } = await supabase.from("leads").select("*").eq("id", id).maybeSingle();
  if (error) {
    return <p className="text-sm text-red-700">{error.message}</p>;
  }
  if (!lead) notFound();

  const [
    { data: drafts },
    { data: sends },
    templatesResult,
    notesResult,
    overridesResult,
  ] = await Promise.all([
    supabase.from("email_drafts").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("sends").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("outreach_templates").select("*").eq("is_default", true),
    supabase.from("lead_notes").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("lead_message_drafts").select("*").eq("lead_id", id),
  ]);

  const typedLead = lead as Lead;
  const typedDrafts = (drafts ?? []) as EmailDraft[];
  const typedSends = (sends ?? []) as Send[];
  const templates = (templatesResult.error ? [] : templatesResult.data ?? []) as OutreachTemplate[];
  const notes = (notesResult.error ? [] : notesResult.data ?? []) as LeadNote[];
  const overrides = (overridesResult.error ? [] : overridesResult.data ?? []) as LeadMessageDraft[];
  const emailDraft = composeTemplatedOutreach(typedLead, pickDefaultTemplate(templates, "email"));
  const resolvedDrafts = resolveLeadDrafts(typedLead, overrides);
  const mobile = israeliMobileDigits(typedLead.phone);
  const mobileLabel = formatIsraeliMobile(typedLead.phone);
  const waDigits = mobile ? normalizePhoneForWaMe(typedLead.phone) : null;
  const headerWhatsApp = waDigits
    ? buildWhatsAppWebUrl(waDigits, resolvedDrafts.first_touch.whatsapp)
    : null;
  const place = [typedLead.category, typedLead.city].filter((part) => part?.trim()).join(" · ");

  return (
    <div className="space-y-6">
      <header className="space-y-3">
        <Link href="/leads" className="text-sm text-muted hover:text-foreground">
          ← כל הלידים
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {typedLead.priority ? "★ " : ""}
              {typedLead.name}
            </h1>
            <p className="text-sm text-muted">{place || "—"}</p>
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs text-muted">ציון ליד</span>
              <LagBadge score={typedLead.lag_score} />
              <BusinessTypeBadge type={typedLead.business_type} />
              <ChannelBadges phone={typedLead.phone} email={typedLead.email} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {headerWhatsApp ? (
              <a
                href={headerWhatsApp}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark"
              >
                וואטסאפ
              </a>
            ) : (
              <span
                className="inline-flex items-center justify-center rounded-lg border border-border px-4 py-2 text-sm text-muted"
                title="וואטסאפ נפתח רק לנייד ישראלי שמתחיל ב־05"
              >
                וואטסאפ
              </span>
            )}
            {mobile && mobileLabel ? (
              <a
                href={`tel:${mobile}`}
                className="inline-flex items-center justify-center rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
              >
                חיוג <span dir="ltr">{mobileLabel}</span>
              </a>
            ) : null}
          </div>
        </div>
        {!mobile ? (
          <p className="text-xs text-muted">
            {typedLead.phone?.trim()
              ? "המספר השמור אינו נייד 05, ולכן אין חיוג ישיר או וואטסאפ. קווים (02/03/04/08/09) נשארים בכרטיס בלבד."
              : "אין נייד 05 בכרטיס. חיוג ווואטסאפ ייפתחו אחרי שיוסיפו מספר למטה."}
          </p>
        ) : null}
      </header>

      <LeadStatusRow
        leadId={typedLead.id}
        status={typedLead.status}
        reason={typedLead.not_relevant_reason}
        followUpAt={typedLead.follow_up_at}
      />

      <section className="rounded-xl border border-border bg-card px-5 py-4">
        <h2 className="text-sm font-semibold">נגיעה אחרונה</h2>
        <p className="mt-1 text-sm">
          <time dateTime={typedLead.last_touched_at ?? undefined}>
            {formatDateTime(typedLead.last_touched_at)}
          </time>
        </p>
        <p className="mt-1 text-xs text-muted">מתעדכן בשינוי סטטוס או בהוספת הערה.</p>
        {needsFollowUp(typedLead) ? (
          <div className="mt-2">
            <NeedsFollowUpBadge />
          </div>
        ) : null}
      </section>

      <LeadNotesPanel
        leadId={typedLead.id}
        notes={notes}
        loadError={notesResult.error?.message ?? null}
      />

      <LeadTemplatesPanel
        leadId={typedLead.id}
        drafts={resolvedDrafts}
        digits={waDigits}
        mobileLabel={mobileLabel}
        toEmail={typedLead.email}
        toName={typedLead.contact_name ?? typedLead.name}
        resendConfigured={isResendConfigured()}
        loadError={overridesResult.error?.message ?? null}
      />

      <section className="space-y-4 rounded-xl border border-border bg-card p-5" id="lead-contact">
        <h2 className="text-sm font-semibold">כרטיס ליד</h2>
        <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
          <Row label="קטגוריה" value={typedLead.category} />
          <Row label="מיקום" value={typedLead.city} />
          <Row label="אתר" value={typedLead.website} href={typedLead.website} />
          <Row label="גודל" value={typedLead.size_signal} />
          <Row label="למה מפגר" value={typedLead.why_lagging} />
          <Row label="פער מול מתחרים" value={typedLead.peer_gap} />
          <Row label="סטטוס" value={leadStatusLabel(typedLead.status)} />
          <Row label="סיבת אי-רלוונטיות" value={notRelevantReasonLabel(typedLead.not_relevant_reason)} />
          <dt className="text-muted">סטטוס עסקי</dt>
          <dd>
            <BusinessStatusBadge status={typedLead.business_status} />
          </dd>
          <Row label="טלפון" value={typedLead.phone} />
          <Row label="מייל" value={typedLead.email} />
          <Row label="איש קשר" value={typedLead.contact_name} />
          <Row label="מקור" value={typedLead.source_url} href={typedLead.source_url} />
          <Row label="נמצא" value={formatDate(typedLead.found_at)} />
          <Row label="יצירת קשר אחרונה" value={formatDateTime(typedLead.last_contacted_at)} />
          <Row label="הערות חימום" value={typedLead.warming_notes} />
        </dl>
        <div className="border-t border-border pt-4">
          <LeadContactForm lead={typedLead} />
        </div>
      </section>

      <section className="space-y-4 rounded-xl border border-border bg-card p-5">
        <ComposeDraftForm lead={typedLead} subject={emailDraft.subject} body={emailDraft.body} />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">טיוטות ואישור</h2>
        <DraftList drafts={typedDrafts} />
      </section>

      <section className="space-y-3 rounded-xl border border-border bg-card p-5">
        <h2 className="text-sm font-semibold">יומן שליחות</h2>
        {typedSends.length === 0 ? (
          <p className="text-sm text-muted">עדיין לא נשלח מייל לליד הזה.</p>
        ) : (
          <ul className="space-y-3 text-sm">
            {typedSends.map((send) => (
              <li key={send.id} className="rounded-lg border border-border bg-background p-3">
                <div className="flex flex-wrap justify-between gap-2">
                  <span>{send.subject}</span>
                  <span className="text-muted">
                    {send.status} · {formatDateTime(send.sent_at ?? send.created_at)}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted">
                  {send.from_email} → {send.to_email}
                  {send.provider_message_id ? ` · ${send.provider_message_id}` : ""}
                </p>
                {send.error ? <p className="mt-1 text-red-700">{send.error}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Row({
  label,
  value,
  href,
}: {
  label: string;
  value: string | null | undefined;
  href?: string | null;
}) {
  const display = value?.trim() ? value : "—";
  return (
    <>
      <dt className="text-muted">{label}</dt>
      <dd className="whitespace-pre-wrap">
        {href && value ? (
          <a className="text-link hover:underline" href={href} target="_blank" rel="noreferrer">
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </>
  );
}
