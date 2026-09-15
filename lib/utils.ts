import type { Lead } from "@/lib/types";
import { COMPANY, COMPANY_DOMAIN, OWNER_NAME } from "@/lib/constants";

export function composeOutreach(lead: Pick<
  Lead,
  "name" | "city" | "contact_name" | "why_lagging" | "peer_gap" | "category"
>) {
  const greeting = lead.contact_name?.trim()
    ? `שלום ${lead.contact_name.trim()},`
    : "שלום רב,";
  const why =
    lead.why_lagging?.trim() ||
    "הנוכחות הדיגיטלית לא משקפת את איכות העסק בפועל";
  const peer = lead.peer_gap?.trim();
  const city = lead.city?.trim() || "פרדס חנה-כרכור";
  const categoryLine = lead.category?.trim()
    ? ` (${lead.category.trim()})`
    : "";

  const subject = `רעיון קטן לאתר של ${lead.name}`;

  const body = `${greeting}

שמי ${OWNER_NAME}, מ-${COMPANY} (${COMPANY_DOMAIN}). עברתי על הנוכחות הדיגיטלית של ${lead.name}${categoryLine} ב${city}.

מה שבלט: ${why}.${peer ? `\n\nעסקים דומים באזור כבר ${peer}.` : ""}

אם זה רלוונטי לכם, אשמח לשלוח הצעה קצרה ומדויקת — בלי התחייבות ובלי לחץ.

בהצלחה,
${OWNER_NAME}
${COMPANY}
${COMPANY_DOMAIN}
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
