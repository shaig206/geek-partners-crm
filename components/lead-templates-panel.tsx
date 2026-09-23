"use client";

import { useActionState, useState } from "react";
import { queueLeadTemplateEmail, saveLeadMessageDraft } from "@/app/actions/lead-detail";
import { MarkLeadSentButton } from "@/components/mark-lead-sent-button";
import { copyTextToClipboard } from "@/components/copy-text";
import {
  FOLLOW_UP_DAYS_AFTER_SEND,
  LEAD_DRAFT_KINDS,
  LEAD_DRAFT_KIND_LABELS,
  LEAD_STATUS_LABELS,
  type LeadDraftKind,
} from "@/lib/constants";
import type { ResolvedLeadDrafts } from "@/lib/starter-outreach";
import type { ActionResult } from "@/lib/types";
import { buildWhatsAppWebUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";

const initial: ActionResult | null = null;

const inputClass =
  "mt-1 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none ring-brand focus:ring-2";

export function LeadTemplatesPanel({
  leadId,
  drafts,
  digits,
  mobileLabel,
  toEmail,
  toName,
  resendConfigured,
  loadError,
}: {
  leadId: string;
  drafts: ResolvedLeadDrafts;
  digits: string | null;
  mobileLabel: string | null;
  toEmail: string | null;
  toName: string | null;
  resendConfigured: boolean;
  loadError?: string | null;
}) {
  const [kind, setKind] = useState<LeadDraftKind>("first_touch");
  const [texts, setTexts] = useState(drafts);
  const current = texts[kind];

  function patch(partial: Partial<(typeof texts)[LeadDraftKind]>) {
    setTexts((prev) => ({ ...prev, [kind]: { ...prev[kind], ...partial } }));
  }

  return (
    <section className="space-y-4 rounded-xl border border-border bg-card p-5">
      <div>
        <h2 className="text-sm font-semibold">תבניות</h2>
        <p className="mt-1 text-xs text-muted">
          פנייה ראשונה, מעקב וסגירה רכה. עריכה נשמרת לליד הזה בלבד, מתחת להערות.
          וואטסאפ נפתח ב־WhatsApp Web (נייד 05 בלבד). מייל מועתק
          {resendConfigured ? ", או נשמר לאישור ושליחה דרך Resend." : "."}
        </p>
      </div>
      {loadError ? <p className="text-sm text-red-700">{loadError}</p> : null}
      <div className="flex flex-wrap gap-2" role="tablist" aria-label="סוג נוסח">
        {LEAD_DRAFT_KINDS.map((value) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={kind === value}
            onClick={() => setKind(value)}
            className={cn(
              "rounded-full border px-3 py-1.5 text-sm font-medium",
              kind === value
                ? "border-brand bg-brand text-white"
                : "border-border bg-background hover:bg-brand-soft",
            )}
          >
            {LEAD_DRAFT_KIND_LABELS[value]}
          </button>
        ))}
      </div>

      <DraftChannel
        key={`${kind}:whatsapp`}
        leadId={leadId}
        kind={kind}
        channel="whatsapp"
        title="וואטסאפ"
        body={current.whatsapp}
        onBodyChange={(body) => patch({ whatsapp: body })}
        digits={digits}
        mobileLabel={mobileLabel}
      />

      <DraftChannel
        key={`${kind}:email`}
        leadId={leadId}
        kind={kind}
        channel="email"
        title="מייל"
        body={current.emailBody}
        subject={current.emailSubject}
        onBodyChange={(emailBody) => patch({ emailBody })}
        onSubjectChange={(emailSubject) => patch({ emailSubject })}
        toEmail={toEmail}
        toName={toName}
        resendConfigured={resendConfigured}
      />

      <div className="space-y-2 border-t border-border pt-4">
        <p className="text-xs text-muted">
          אחרי שליחה בפועל — סמנו כאן. הסטטוס יהיה {LEAD_STATUS_LABELS.contacted} והמעקב הראשון
          ייקבע לעוד {FOLLOW_UP_DAYS_AFTER_SEND} ימים.
        </p>
        <div className="flex flex-wrap gap-3">
          <MarkLeadSentButton leadId={leadId} channel="whatsapp" label="סימנתי שנשלח בוואטסאפ" />
          <MarkLeadSentButton leadId={leadId} channel="email" label="סימנתי שנשלח במייל" />
        </div>
      </div>
    </section>
  );
}

function DraftChannel({
  leadId,
  kind,
  channel,
  title,
  body,
  subject,
  onBodyChange,
  onSubjectChange,
  digits,
  mobileLabel,
  toEmail,
  toName,
  resendConfigured,
}: {
  leadId: string;
  kind: LeadDraftKind;
  channel: "whatsapp" | "email";
  title: string;
  body: string;
  subject?: string;
  onBodyChange: (value: string) => void;
  onSubjectChange?: (value: string) => void;
  digits?: string | null;
  mobileLabel?: string | null;
  toEmail?: string | null;
  toName?: string | null;
  resendConfigured?: boolean;
}) {
  const [saveState, saveAction, savePending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => saveLeadMessageDraft(leadId, formData),
    initial,
  );
  const [queueState, queueAction, queuePending] = useActionState(
    async (_prev: ActionResult | null, formData: FormData) => queueLeadTemplateEmail(leadId, formData),
    initial,
  );
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const pending = savePending || queuePending;
  const webUrl = channel === "whatsapp" && digits ? buildWhatsAppWebUrl(digits, body) : null;

  async function copy() {
    setCopyError(false);
    const text = channel === "email" ? `${subject ?? ""}\n\n${body}` : body;
    try {
      await copyTextToClipboard(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopyError(true);
    }
  }

  return (
    <form action={saveAction} className="space-y-3 rounded-lg border border-border bg-background p-4">
      <h3 className="text-sm font-semibold">{title}</h3>
      <input type="hidden" name="kind" value={kind} />
      <input type="hidden" name="channel" value={channel} />
      {channel === "email" ? (
        <>
          <input type="hidden" name="to_email" value={toEmail ?? ""} />
          <input type="hidden" name="to_name" value={toName ?? ""} />
          <label className="block text-sm">
            נושא
            <input
              name="subject"
              required
              value={subject ?? ""}
              onChange={(event) => onSubjectChange?.(event.target.value)}
              className={inputClass}
            />
          </label>
        </>
      ) : null}
      <label className="block text-sm">
        נוסח
        <textarea
          name="body"
          required
          rows={channel === "email" ? 10 : 8}
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          className={inputClass}
        />
      </label>
      {channel === "whatsapp" && digits ? (
        <p className="text-xs text-muted">
          ייפתח לנייד <span dir="ltr">{mobileLabel ?? digits}</span>
        </p>
      ) : null}
      {channel === "whatsapp" && !digits ? (
        <p className="text-sm text-muted">
          פתיחת וואטסאפ דורשת נייד ישראלי שמתחיל ב־05. קווי 02/03/04/08/09 לא נפתחים.
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={copy} className={secondaryButtonClass}>
          {copied ? "הועתק" : "העתקה"}
        </button>
        {webUrl ? (
          <a href={webUrl} target="_blank" rel="noopener noreferrer" className={primaryLinkClass}>
            פתיחה ב-WhatsApp
          </a>
        ) : null}
        <button type="submit" disabled={pending} className={secondaryButtonClass}>
          {savePending ? "שומר…" : "שמירת נוסח לליד"}
        </button>
        {channel === "email" && resendConfigured ? (
          <button type="submit" formAction={queueAction} disabled={pending} className={primaryButtonClass}>
            {queuePending ? "שומר…" : "שמירה לאישור"}
          </button>
        ) : null}
      </div>
      {copyError ? <p className="text-sm text-red-700">ההעתקה נכשלה. אפשר לסמן את הטקסט ידנית.</p> : null}
      {saveState?.ok === true ? <p className="text-sm text-brand-dark">{saveState.message}</p> : null}
      {saveState?.ok === false ? <p className="text-sm text-red-700">{saveState.error}</p> : null}
      {queueState?.ok === true ? <p className="text-sm text-brand-dark">{queueState.message}</p> : null}
      {queueState?.ok === false ? <p className="text-sm text-red-700">{queueState.error}</p> : null}
    </form>
  );
}

const secondaryButtonClass =
  "rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium hover:bg-brand-soft disabled:opacity-60";

const primaryButtonClass =
  "rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60";

const primaryLinkClass =
  "inline-flex items-center justify-center rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-dark";
