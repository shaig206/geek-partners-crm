import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  NOT_RELEVANT_REASON_LABELS,
  isLeadStatus,
  isNotRelevantReason,
  type LeadStatus,
  type NotRelevantReason,
} from "@/lib/constants";

const LEGACY_CONTACTED = new Set([
  "נשלח",
  "נשלחה הודעה",
  "נענה",
  "אין מענה",
  "אין מענה פעם אחת",
]);

const LEGACY_UNREACHABLE = new Set(["אין מענה", "אין מענה פעם אחת", "אין מענה פעמיים"]);

/**
 * Map a pre-pipeline communication status (and optional business status)
 * onto the stable pipeline keys. Already-stable rows are left as-is.
 * Keep this in sync with supabase/migrations/20260923140000_lead_detail_pipeline.sql.
 */
export function pipelineStatusFromLegacy(input: {
  status: string;
  businessStatus?: string | null;
  reason?: string | null;
}): { status: LeadStatus; reason: NotRelevantReason | null } {
  if (isLeadStatus(input.status)) {
    const reason =
      input.status === "not_relevant" && input.reason && isNotRelevantReason(input.reason)
        ? input.reason
        : null;
    return { status: input.status, reason };
  }

  const communication = input.status;
  const business = input.businessStatus ?? "";

  let status: LeadStatus = "new";
  if (business === "זכייה") status = "converted";
  else if (
    business === "לא רלוונטי" ||
    communication === "לא רלוונטי" ||
    communication === "אין מענה פעמיים"
  ) {
    status = "not_relevant";
  } else if (business === "בפגישה או שיחה" || business === "הצעה נשלחה") {
    status = "in_conversation";
  } else if (LEGACY_CONTACTED.has(communication)) {
    status = "contacted";
  }

  const reason: NotRelevantReason | null =
    status === "not_relevant" && LEGACY_UNREACHABLE.has(communication) ? "unreachable" : null;

  return { status, reason };
}

/**
 * Match a leads-list search string to a pipeline status.
 * Accepts the stable key (`in_conversation`) or the Hebrew label (`בשיחה`),
 * including a unique fragment such as `קשר` → נוצר קשר.
 */
export function leadStatusFromQuery(query: string): LeadStatus | null {
  const value = query.trim();
  if (!value) return null;
  if (isLeadStatus(value)) return value;

  const exact = LEAD_STATUSES.find((status) => LEAD_STATUS_LABELS[status] === value);
  if (exact) return exact;

  if (value.length < 2) return null;
  const hits = LEAD_STATUSES.filter((status) => LEAD_STATUS_LABELS[status].includes(value));
  return hits.length === 1 ? hits[0] : null;
}

export function leadStatusLabel(status: string): string {
  if (isLeadStatus(status)) return LEAD_STATUS_LABELS[status];
  return LEAD_STATUS_LABELS[pipelineStatusFromLegacy({ status }).status];
}

export function notRelevantReasonLabel(reason: string | null | undefined): string | null {
  if (!reason) return null;
  if (isNotRelevantReason(reason)) return NOT_RELEVANT_REASON_LABELS[reason];
  return reason;
}

export function formatStatusChangeNote(input: {
  fromStatus: string;
  toStatus: LeadStatus;
  toReason: NotRelevantReason | null;
}): string {
  const from = leadStatusLabel(input.fromStatus);
  const to = LEAD_STATUS_LABELS[input.toStatus];
  const reason = input.toReason ? notRelevantReasonLabel(input.toReason) : null;
  if (reason) return `הסטטוס השתנה מ«${from}» ל«${to}» (${reason}).`;
  return `הסטטוס השתנה מ«${from}» ל«${to}».`;
}
