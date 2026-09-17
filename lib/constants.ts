export const APP_NAME = "Geek Partners CRM";
export const OWNER_NAME = "שי גלבוע";
export const OWNER_NAME_EN = "Shai Gilboa";
export const OWNER_ROLE = "מפתח תוכנה";
export const COMPANY = "Geek Partners";
export const COMPANY_DOMAIN = "geek.partners";
export const DEFAULT_CITY = "פרדס חנה-כרכור";
/** Default country calling code for wa.me when a local 0… number is stored. */
export const IL_COUNTRY_CODE = "972";

export const LEAD_STATUSES = [
  "חדש",
  "נמצא מייל",
  "טיוטה ממתינה",
  "נשלח",
  "נענה",
  "אין מענה",
  "לא רלוונטי",
] as const;

export type LeadStatus = (typeof LEAD_STATUSES)[number];

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
