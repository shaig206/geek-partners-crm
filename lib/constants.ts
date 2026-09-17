export const APP_NAME = "Geek Partners CRM";
export const OWNER_NAME = "שי גלבוע";
export const OWNER_NAME_EN = "Shai Gilboa";
export const OWNER_ROLE = "מפתח תוכנה";
export const COMPANY = "Geek Partners";
export const COMPANY_DOMAIN = "geek.partners";
export const DEFAULT_CITY = "פרדס חנה-כרכור";
/** Default country calling code for wa.me when a local 0… number is stored. */
export const IL_COUNTRY_CODE = "972";

/** Communication status (סטטוס תקשורת) — stored on leads.status. */
export const LEAD_STATUSES = [
  "חדש",
  "נשלחה הודעה",
  "אין מענה פעם אחת",
  "אין מענה פעמיים",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const MARK_SENT_STATUS: LeadStatus = "נשלחה הודעה";

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
export const FOLLOW_UP_WAITING_STATUSES = [
  "נשלחה הודעה",
  "אין מענה פעם אחת",
  "אין מענה פעמיים",
] as const;

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

export const SORT_OPTIONS = [
  { value: "lag_desc", label: "פיגור גבוה תחילה" },
  { value: "lag_asc", label: "פיגור נמוך תחילה" },
  { value: "name_asc", label: "שם א–ת" },
  { value: "found_desc", label: "נמצא לאחרונה" },
  { value: "created_desc", label: "נוצר לאחרונה" },
  { value: "priority_desc", label: "עדיפות" },
  { value: "follow_up_asc", label: "מעקב מוקדם תחילה" },
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

export function isBusinessStatus(value: string): value is BusinessStatus {
  return (BUSINESS_STATUSES as readonly string[]).includes(value);
}

export function isTemplateChannel(value: string): value is TemplateChannel {
  return (TEMPLATE_CHANNELS as readonly string[]).includes(value);
}
