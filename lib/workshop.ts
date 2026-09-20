import { normalizeIsraeliPhone } from "@/lib/channels";
import { COMPANY, DEFAULT_CITY } from "@/lib/constants";
import { civilDateInTimeZone } from "@/lib/follow-up";

/** Public route. Listed in `isPublicPath` and the proxy matcher. */
export const WORKSHOP_PATH = "/workshop";

/**
 * Event details — edit these before sharing an invite.
 * Date, time, and the Regus address live here so copy stays in one place.
 */
export const WORKSHOP_DATE = "תאריך יפורסם בקרוב";
export const WORKSHOP_TIME = "שעה תפורסם בקרוב";
export const WORKSHOP_ADDRESS = "Regus — כתובת תפורסם בקרוב";

export const WORKSHOP_CITY = DEFAULT_CITY;
export const WORKSHOP_CATEGORY = "סדנה";
export const WORKSHOP_SOURCE_NOTE = "מקור: הרשמה לסדנה";
export const WORKSHOP_SOURCE_URL = WORKSHOP_PATH;

export const WORKSHOP_HEADLINE = "סדנה לעסקים בינוניים: טכנולוגיה ו-AI שעובדים אצלכם";
export const WORKSHOP_LEDE = `מפגש קצר של ${COMPANY} על כלים דיגיטליים ובינה מלאכותית שמתאימים לעסק בגודל בינוני — בלי באזז, ובלי לחץ מכירה.`;

export const WORKSHOP_AGENDA = [
  "איפה עסקים בינוניים באמת מאבדים זמן וכסף בטכנולוגיה היומיומית",
  "איך AI נכנס לשיווק, מכירות ותפעול בלי מחלקת הייטק",
  "שיחה פתוחה ושאלות — מה כדאי לקחת הביתה כבר השבוע",
] as const;

export const WORKSHOP_THANKS_TITLE = "נרשמתם בהצלחה";
export const WORKSHOP_THANKS_BODY =
  "קיבלנו את הפרטים ונחזור אליכם עם אישור ופרטי הגעה. אין צורך לעשות דבר נוסף כרגע.";

export type WorkshopRegistrationFields = {
  contactName: string;
  businessName: string;
  email: string;
  phone: string;
};

export type WorkshopLeadPayload = {
  name: string;
  contact_name: string;
  email: string | null;
  phone: string | null;
  city: string;
  status: "חדש";
  business_status: "חדש";
  business_type: null;
  category: string;
  warming_notes: string;
  source_url: string;
  priority: true;
  found_at: string;
};

export type WorkshopBuildResult =
  | { ok: true; payload: WorkshopLeadPayload }
  | { ok: false; error: string };

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function parseWorkshopEmail(value: string): string | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!EMAIL_RE.test(trimmed)) return "invalid";
  return trimmed.toLowerCase();
}

export function parseWorkshopPhone(value: string): string | null | "invalid" {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = normalizeIsraeliPhone(trimmed);
  if (normalized && /\d{7,}/.test(normalized)) return normalized;
  const digits = trimmed.replace(/\D/g, "");
  if (digits.length < 7) return "invalid";
  return trimmed;
}

export function workshopFieldsFromForm(formData: FormData): WorkshopRegistrationFields {
  const asString = (key: string) => {
    const value = formData.get(key);
    return typeof value === "string" ? value : "";
  };
  return {
    contactName: asString("contact_name"),
    businessName: asString("business_name"),
    email: asString("email"),
    phone: asString("phone"),
  };
}

export function buildWorkshopLead(
  fields: WorkshopRegistrationFields,
  now = new Date(),
): WorkshopBuildResult {
  const contactName = fields.contactName.trim();
  if (!contactName) {
    return { ok: false, error: "יש להזין שם." };
  }

  const email = parseWorkshopEmail(fields.email);
  if (email === "invalid") {
    return { ok: false, error: "כתובת המייל אינה תקינה." };
  }

  const phone = parseWorkshopPhone(fields.phone);
  if (phone === "invalid") {
    return { ok: false, error: "מספר הוואטסאפ או הטלפון אינו תקין." };
  }

  if (!email && !phone) {
    return { ok: false, error: "יש להזין מייל או וואטסאפ/טלפון." };
  }

  const businessName = fields.businessName.trim();
  const name = businessName || contactName;

  return {
    ok: true,
    payload: {
      name,
      contact_name: contactName,
      email,
      phone,
      city: WORKSHOP_CITY,
      status: "חדש",
      business_status: "חדש",
      business_type: null,
      category: WORKSHOP_CATEGORY,
      warming_notes: WORKSHOP_SOURCE_NOTE,
      source_url: WORKSHOP_SOURCE_URL,
      priority: true,
      found_at: civilDateInTimeZone(now),
    },
  };
}
