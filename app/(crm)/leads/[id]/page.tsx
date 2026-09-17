import Link from "next/link";
import { notFound } from "next/navigation";
import { ComposeDraftForm } from "@/components/compose-draft-form";
import { DraftList } from "@/components/draft-list";
import { BusinessTypeBadge, LagBadge, NeedsFollowUpBadge, StatusBadge } from "@/components/badges";
import { LeadContactForm } from "@/components/lead-contact-form";
import { MarkLeadSentButton } from "@/components/mark-lead-sent-button";
import { WhatsAppSection } from "@/components/whatsapp-section";
import { requireUser } from "@/lib/auth";
import { FOLLOW_UP_DAYS_AFTER_SEND } from "@/lib/constants";
import { needsFollowUp } from "@/lib/follow-up";
import type { EmailDraft, Lead, Send } from "@/lib/types";
import { formatDate, formatDateTime } from "@/lib/utils";

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

  const [{ data: drafts }, { data: sends }] = await Promise.all([
    supabase.from("email_drafts").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
    supabase.from("sends").select("*").eq("lead_id", id).order("created_at", { ascending: false }),
  ]);

  const typedLead = lead as Lead;
  const typedDrafts = (drafts ?? []) as EmailDraft[];
  const typedSends = (sends ?? []) as Send[];

  return (
    <div className="space-y-6">
      <div>
        <Link href="/leads" className="text-sm text-muted hover:text-foreground">
          ← כל הלידים
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">
            {typedLead.priority ? "★ " : ""}
            {typedLead.name}
          </h1>
          <StatusBadge status={typedLead.status} />
          <BusinessTypeBadge type={typedLead.business_type} />
          <LagBadge score={typedLead.lag_score} />
          {needsFollowUp(typedLead) ? <NeedsFollowUpBadge /> : null}
        </div>
        <p className="mt-1 text-sm text-muted">{typedLead.city}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-sm font-semibold">כרטיס ליד</h2>
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <Row label="קטגוריה" value={typedLead.category} />
            <Row label="אתר" value={typedLead.website} href={typedLead.website} />
            <Row label="גודל" value={typedLead.size_signal} />
            <Row label="למה מפגר" value={typedLead.why_lagging} />
            <Row label="פער מול מתחרים" value={typedLead.peer_gap} />
            <Row label="טלפון" value={typedLead.phone} />
            <Row label="מייל" value={typedLead.email} />
            <Row label="איש קשר" value={typedLead.contact_name} />
            <Row label="מקור" value={typedLead.source_url} href={typedLead.source_url} />
            <Row label="נמצא" value={formatDate(typedLead.found_at)} />
            <Row label="יצירת קשר אחרונה" value={formatDateTime(typedLead.last_contacted_at)} />
            <dt className="text-muted">מעקב הבא</dt>
            <dd className="flex flex-wrap items-center gap-2">
              <span>{formatDateTime(typedLead.follow_up_at)}</span>
              {needsFollowUp(typedLead) ? <NeedsFollowUpBadge /> : null}
            </dd>
            <Row label="הערות חימום" value={typedLead.warming_notes} />
          </dl>
          <div className="border-t border-border pt-4" id="lead-contact">
            <LeadContactForm lead={typedLead} />
          </div>
        </section>

        <section className="space-y-4 rounded-xl border border-border bg-card p-5">
          <ComposeDraftForm lead={typedLead} />
          <div className="border-t border-border pt-4">
            <p className="mb-2 text-xs text-muted">
              אחרי שליחת מייל (גם מחוץ למערכת) — סמנו כאן. הסטטוס יהיה נשלח והמעקב הראשון ייקבע לעוד{" "}
              {FOLLOW_UP_DAYS_AFTER_SEND} ימים.
            </p>
            <MarkLeadSentButton leadId={typedLead.id} channel="email" label="סימנתי שנשלח במייל" />
          </div>
        </section>
      </div>

      <WhatsAppSection lead={typedLead} />

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
          <a className="text-brand hover:underline" href={href} target="_blank" rel="noreferrer">
            {display}
          </a>
        ) : (
          display
        )}
      </dd>
    </>
  );
}
