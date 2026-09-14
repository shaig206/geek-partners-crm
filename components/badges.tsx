import { BUSINESS_TYPES, LEAD_STATUSES } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { LeadStatus } from "@/lib/constants";

const STATUS_STYLES: Record<LeadStatus, string> = {
  חדש: "bg-stone-100 text-stone-700",
  "נמצא מייל": "bg-sky-50 text-sky-800",
  "טיוטה ממתינה": "bg-amber-50 text-amber-800",
  נשלח: "bg-brand-soft text-brand-dark",
  נענה: "bg-emerald-100 text-emerald-800",
  "אין מענה": "bg-orange-50 text-orange-800",
  "לא רלוונטי": "bg-stone-200 text-stone-500",
};

export function StatusBadge({ status }: { status: string }) {
  const known = (LEAD_STATUSES as readonly string[]).includes(status);
  return (
    <span
      className={cn(
        "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
        known ? STATUS_STYLES[status as LeadStatus] : "bg-stone-100 text-stone-700",
      )}
    >
      {status}
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
