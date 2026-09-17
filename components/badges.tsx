import {
  BUSINESS_STATUSES,
  BUSINESS_TYPES,
  LEAD_STATUSES,
  type BusinessStatus,
  type LeadStatus,
} from "@/lib/constants";
import { CHANNEL_BUCKET_LABELS, hasEmail, hasWhatsApp } from "@/lib/channels";
import { cn } from "@/lib/utils";

const COMMUNICATION_STYLES: Record<LeadStatus, string> = {
  חדש: "bg-stone-100 text-stone-700",
  "נשלחה הודעה": "bg-brand-soft text-brand-dark",
  "אין מענה פעם אחת": "bg-orange-50 text-orange-800",
  "אין מענה פעמיים": "bg-orange-100 text-orange-900",
};

const BUSINESS_STYLES: Record<BusinessStatus, string> = {
  חדש: "bg-stone-100 text-stone-700",
  רלוונטי: "bg-sky-50 text-sky-800",
  "בפגישה או שיחה": "bg-violet-50 text-violet-800",
  "הצעה נשלחה": "bg-amber-50 text-amber-800",
  זכייה: "bg-emerald-100 text-emerald-800",
  "לא רלוונטי": "bg-stone-200 text-stone-500",
};

export function StatusBadge({ status }: { status: string }) {
  const known = (LEAD_STATUSES as readonly string[]).includes(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        known ? COMMUNICATION_STYLES[status as LeadStatus] : "bg-stone-100 text-stone-700",
      )}
      title="סטטוס תקשורת"
    >
      {status}
    </span>
  );
}

export function BusinessStatusBadge({ status }: { status: string }) {
  const known = (BUSINESS_STATUSES as readonly string[]).includes(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        known ? BUSINESS_STYLES[status as BusinessStatus] : "bg-stone-100 text-stone-700",
      )}
      title="סטטוס עסקי"
    >
      {status}
    </span>
  );
}

export function ChannelBadges({
  phone,
  email,
}: {
  phone: string | null | undefined;
  email: string | null | undefined;
}) {
  const wa = hasWhatsApp(phone);
  const em = hasEmail(email);
  if (!wa && !em) {
    return <span className="text-xs text-muted">{CHANNEL_BUCKET_LABELS.none}</span>;
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {wa ? (
        <span className="inline-flex rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-800">
          {CHANNEL_BUCKET_LABELS.whatsapp}
        </span>
      ) : null}
      {em ? (
        <span className="inline-flex rounded-full bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-800">
          {CHANNEL_BUCKET_LABELS.email}
        </span>
      ) : null}
    </span>
  );
}

export function BusinessTypeBadge({ type }: { type: string | null }) {
  if (!type) return <span className="text-muted">—</span>;
  const isB2C = type === "B2C";
  const isKnown = (BUSINESS_TYPES as readonly string[]).includes(type);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        isB2C && "bg-brand-soft text-brand-dark",
        type === "B2B" && "bg-slate-100 text-slate-700",
        type === "B2B2C" && "bg-teal-50 text-teal-800",
        !isKnown && "bg-stone-100 text-stone-700",
      )}
    >
      {type}
      {isB2C ? " · קצה" : ""}
    </span>
  );
}

export function NeedsFollowUpBadge() {
  return (
    <span className="inline-flex rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-900">
      צריך מעקב
    </span>
  );
}

export function LagBadge({ score }: { score: number | null }) {
  if (score == null) return <span className="text-muted">—</span>;
  const high = score >= 4;
  const mid = score === 3;
  return (
    <span
      className={cn(
        "inline-flex min-w-7 items-center justify-center rounded-md px-1.5 py-0.5 text-xs font-semibold",
        high && "bg-red-100 text-lag-high",
        mid && "bg-amber-100 text-lag-mid",
        !high && !mid && "bg-stone-100 text-stone-600",
      )}
      title={`ציון פיגור ${score} מתוך 5`}
    >
      {score}
    </span>
  );
}
