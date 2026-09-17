import type { Lead } from "@/lib/types";
import { COMPANY, DEFAULT_CITY, OWNER_NAME, OWNER_ROLE } from "@/lib/constants";

/** First token of a contact name ("מיכל לוי" → "מיכל"). Missing / blank → null. */
export function firstNameFromContact(contactName: string | null | undefined): string | null {
  const first = contactName?.trim().split(/\s+/).find(Boolean);
  return first || null;
}

export function greetingFromContact(contactName: string | null | undefined): string {
  const first = firstNameFromContact(contactName);
  return first ? `שלום ${first},` : "שלום רב,";
}

export function composeOutreach(lead: Pick<
  Lead,
  "name" | "city" | "contact_name" | "why_lagging" | "peer_gap" | "category"
>) {
  const greeting = greetingFromContact(lead.contact_name);
  const why =
    lead.why_lagging?.trim() ||
    "הנוכחות הדיגיטלית לא משקפת את איכות העסק בפועל";
  const peer = lead.peer_gap?.trim();
  const city = lead.city?.trim() || DEFAULT_CITY;
  const categoryLine = lead.category?.trim()
    ? ` (${lead.category.trim()})`
    : "";

  const subject = `רעיון קטן לאתר של ${lead.name}`;

  const body = `${greeting}

שמי ${OWNER_NAME}, ${OWNER_ROLE}, עברתי על הנוכחות הדיגיטלית של ${lead.name}${categoryLine} ב${city}.

מה שבלט: ${why}.${peer ? `\n\nעסקים דומים באזור כבר ${peer}.` : ""}

אם זה רלוונטי לכם, אשמח לשלוח הצעה קצרה ומדויקת — בלי התחייבות ובלי לחץ.

בהצלחה,
${OWNER_NAME}
${COMPANY}
`;

  return { subject, body };
}

export function extractEmail(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const match = value.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match ? match[0].toLowerCase() : null;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("he-IL", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}
