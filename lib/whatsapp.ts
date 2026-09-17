import { DEFAULT_CITY, IL_COUNTRY_CODE, OWNER_NAME, OWNER_ROLE } from "@/lib/constants";
import type { Lead } from "@/lib/types";
import { greetingFromContact } from "@/lib/utils";

const E164_MIN = 10;
const E164_MAX = 15;

export type WhatsAppLeadFields = Pick<Lead, "name" | "category" | "city" | "website" | "contact_name">;

/**
 * Normalize a stored phone into international digits for https://wa.me/<digits>.
 * Israeli local numbers that start with 0 get country code 972.
 */
export function normalizePhoneForWaMe(phone: string | null | undefined): string | null {
  if (!phone) return null;

  let digits = phone.trim().replace(/[^\d+]/g, "");
  if (!digits) return null;

  if (digits.startsWith("+")) digits = digits.slice(1);
  if (digits.startsWith("00")) digits = digits.slice(2);
  if (!digits) return null;

  if (digits.startsWith("0")) {
    digits = IL_COUNTRY_CODE + digits.slice(1);
  } else if (!digits.startsWith(IL_COUNTRY_CODE)) {
    if (/^5\d{8}$/.test(digits) || /^[2-9]\d{7,8}$/.test(digits)) {
      digits = IL_COUNTRY_CODE + digits;
    }
  }

  // 9720… is a local 0 left after an explicit country code
  if (digits.startsWith(`${IL_COUNTRY_CODE}0`)) {
    digits = IL_COUNTRY_CODE + digits.slice(IL_COUNTRY_CODE.length + 1);
  }

  if (!/^\d+$/.test(digits)) return null;
  if (digits.length < E164_MIN || digits.length > E164_MAX) return null;

  return digits;
}

/** Short Hebrew WhatsApp opener — same first-name + developer intro as email, without critique. */
export function composeWhatsAppMessage(lead: WhatsAppLeadFields): string {
  const greeting = greetingFromContact(lead.contact_name);
  const city = lead.city?.trim() || DEFAULT_CITY;
  const category = lead.category?.trim();
  const categoryBit = category ? ` (${category})` : "";
  const siteBit = lead.website?.trim() ? ", כולל האתר" : "";

  return `${greeting} שמי ${OWNER_NAME}, ${OWNER_ROLE}.

עברתי על ${lead.name}${categoryBit} ב${city}${siteBit} — נראית הזדמנות קטנה לחזק את הנוכחות הדיגיטלית.

אם זה רלוונטי, אשמח לשלוח הצעה קצרה. בלי התחייבות ובלי לחץ.`;
}

export function buildWhatsAppWebUrl(digits: string, text: string): string {
  const encoded = encodeURIComponent(text);
  return encoded ? `https://wa.me/${digits}?text=${encoded}` : `https://wa.me/${digits}`;
}
