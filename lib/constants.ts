export const APP_NAME = "Geek Partners CRM";
export const OWNER_NAME = "שי גלבוע";
export const OWNER_NAME_EN = "Shai Gilboa";
export const OWNER_ROLE = "מפתח תוכנה";
export const COMPANY = "Geek Partners";
export const COMPANY_DOMAIN = "geek.partners";
export const DEFAULT_CITY = "פרדס חנה-כרכור";
/** Default country calling code for wa.me when a local 0… number is stored. */
export const IL_COUNTRY_CODE = "972";

/**
 * Pipeline status stored on leads.status.
 * Stable English keys in the database; Hebrew labels in the UI.
 */
export const LEAD_STATUSES = [
  "new",
  "contacted",
  "in_conversation",
  "follow_up_scheduled",
  "not_relevant",
  "converted",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "חדש",
  contacted: "נוצר קשר",
  in_conversation: "בשיחה",
  follow_up_scheduled: "נקבע מעקב",
  not_relevant: "לא רלוונטי",
  converted: "הומר",
};

/** Stored on leads.not_relevant_reason when status is not_relevant. */
export const NOT_RELEVANT_REASONS = ["closed", "no_fit", "wrong_area", "unreachable"] as const;

export type NotRelevantReason = (typeof NOT_RELEVANT_REASONS)[number];

export const NOT_RELEVANT_REASON_LABELS: Record<NotRelevantReason, string> = {
  closed: "נסגר",
  no_fit: "לא מתאים",
  wrong_area: "אזור לא נכון",
  unreachable: "אין מענה",
};

/** Mark-sent / approve-and-send moves the pipeline to נוצר קשר. */
export const MARK_SENT_STATUS: LeadStatus = "contacted";

/** Business status (סטטוס עסקי) — stored on leads.business_status. */
export const BUSINESS_STATUSES = [
  "חדש",
  "רלוונטי",
  "בפגישה או שיחה",
  "הצעה נשלחה",
  "זכייה",
  "לא רלוונטי",
] as const;

export type BusinessStatus = (typeof BUSINESS_STATUSES)[number];

/** Calendar days after marking outreach as sent before the first follow-up. */
export const FOLLOW_UP_DAYS_AFTER_SEND = 3;

/** Civil day used for “today / overdue” follow-up (Israel). */
export const CRM_TIMEZONE = "Asia/Jerusalem";

/**
 * Open waiting communication statuses that can show צריך מעקב
 * when follow_up_at is due.
 */
export const FOLLOW_UP_WAITING_STATUSES = ["contacted", "follow_up_scheduled"] as const;

/** Per-lead outreach drafts on the lead card (overrides of the starter copy). */
export const LEAD_DRAFT_KINDS = ["first_touch", "follow_up", "soft_close"] as const;
export type LeadDraftKind = (typeof LEAD_DRAFT_KINDS)[number];

export const LEAD_DRAFT_KIND_LABELS: Record<LeadDraftKind, string> = {
  first_touch: "פנייה ראשונה",
  follow_up: "מעקב",
  soft_close: "סגירה רכה",
};

export const OUTREACH_CHANNELS = ["whatsapp", "email", "other"] as const;
export type OutreachChannel = (typeof OUTREACH_CHANNELS)[number];

/** Stored on outreach_templates.channel. Distinct from mark-sent OUTREACH_CHANNELS. */
export const TEMPLATE_CHANNELS = ["whatsapp", "email", "both"] as const;
export type TemplateChannel = (typeof TEMPLATE_CHANNELS)[number];

export const TEMPLATE_CHANNEL_LABELS: Record<TemplateChannel, string> = {
  whatsapp: "וואטסאפ",
  email: "מייל",
  both: "שניהם",
};

export const BUSINESS_TYPES = ["B2C", "B2B", "B2B2C"] as const;
export type BusinessType = (typeof BUSINESS_TYPES)[number];

export const DRAFT_STATUSES = [
  "draft",
  "pending_approval",
  "approved",
  "rejected",
  "sent",
  "failed",
] as const;

export type DraftStatus = (typeof DRAFT_STATUSES)[number];

export const SEND_STATUSES = ["queued", "sent", "bounced", "failed"] as const;
export type SendStatus = (typeof SEND_STATUSES)[number];

export const LAG_SCORES = [1, 2, 3, 4, 5] as const;

/**
 * `sort` query param: `{key}_{asc|desc}`.
 * Header clicks and the filters dropdown share this list.
 *
 * Default directions on first click of a new column:
 * - פיגור (`lag`): desc (high lag first — existing default UX)
 * - נמצא / נוצר / עדיפות: desc
 * - מעקב: asc (soonest first — existing default)
 * - text / enum / channel: asc (Hebrew א–ת, workflow order, or channel buckets)
 */
export const SORT_OPTIONS = [
  { value: "lag_desc", label: "פיגור גבוה תחילה" },
  { value: "lag_asc", label: "פיגור נמוך תחילה" },
  { value: "name_asc", label: "שם א–ת" },
  { value: "name_desc", label: "שם ת–א" },
  { value: "category_asc", label: "קטגוריה א–ת" },
  { value: "category_desc", label: "קטגוריה ת–א" },
  { value: "type_asc", label: "סוג B2C → B2B → B2B2C" },
  { value: "type_desc", label: "סוג B2B2C → B2B → B2C" },
  { value: "status_asc", label: "סטטוס לפי סדר העבודה" },
  { value: "status_desc", label: "סטטוס בסדר הפוך" },
  { value: "business_status_asc", label: "סטטוס עסקי לפי סדר העבודה" },
  { value: "business_status_desc", label: "סטטוס עסקי בסדר הפוך" },
  { value: "channel_asc", label: "ערוץ וואטסאפ → מייל → שניהם → כלום" },
  { value: "channel_desc", label: "ערוץ כלום → שניהם → מייל → וואטסאפ" },
  { value: "follow_up_asc", label: "מעקב מוקדם תחילה" },
  { value: "follow_up_desc", label: "מעקב מאוחר תחילה" },
  { value: "email_asc", label: "מייל א–ת" },
  { value: "email_desc", label: "מייל ת–א" },
  { value: "found_desc", label: "נמצא לאחרונה" },
  { value: "found_asc", label: "נמצא קודם" },
  { value: "created_desc", label: "נוצר לאחרונה" },
  { value: "created_asc", label: "נוצר קודם" },
  { value: "priority_desc", label: "עדיפות" },
  { value: "priority_asc", label: "בלי עדיפות תחילה" },
] as const;

export type SortValue = (typeof SORT_OPTIONS)[number]["value"];

export const DRAFT_STATUS_LABELS: Record<DraftStatus, string> = {
  draft: "טיוטה",
  pending_approval: "ממתין לאישור",
  approved: "אושר",
  rejected: "נדחה",
  sent: "נשלח",
  failed: "נכשל",
};

export function isLeadStatus(value: string): value is LeadStatus {
  return (LEAD_STATUSES as readonly string[]).includes(value);
}

export function isNotRelevantReason(value: string): value is NotRelevantReason {
  return (NOT_RELEVANT_REASONS as readonly string[]).includes(value);
}

export function isLeadDraftKind(value: string): value is LeadDraftKind {
  return (LEAD_DRAFT_KINDS as readonly string[]).includes(value);
}

export function isBusinessStatus(value: string): value is BusinessStatus {
  return (BUSINESS_STATUSES as readonly string[]).includes(value);
}

export function isTemplateChannel(value: string): value is TemplateChannel {
  return (TEMPLATE_CHANNELS as readonly string[]).includes(value);
}
