import {
  COMPANY,
  DEFAULT_CITY,
  OWNER_NAME,
  OWNER_ROLE,
  type TemplateChannel,
} from "@/lib/constants";
import type { Lead, OutreachTemplate } from "@/lib/types";
import { firstNameFromContact, greetingFromContact, composeOutreach } from "@/lib/utils";

export const DEFAULT_EMAIL_SUBJECT_TEMPLATE = "רעיון קטן לאתר של {{business_name}}";

/** AI-revolution paragraph. Used when a template includes {{ai_revolution}}. */
export const AI_REVOLUTION_PARAGRAPH =
  "אנחנו בעיצומה של מהפכת ה-AI: עסקים עושים דברים מטורפים במהירות, מותאם אישית, ובלי מחלקת הייטק — בשיווק ובמכירות, במעקב אחרי לקוחות, בארגון, בכספים, וגם בהבאת פניות והפיכתן לתורים ולתשלומים אונליין. אפשר לחבר את מה שכבר עובד אצלך לכלים האלה בצורה שקטה ומותאמת.";

export const TEMPLATE_PLACEHOLDERS = [
  "greeting",
  "first_name",
  "business_name",
  "category",
  "category_bit",
  "city",
  "why_lagging",
  "peer_gap",
  "pinpoints",
  "owner_name",
  "owner_role",
  "company",
  "ai_revolution",
] as const;

export type TemplatePlaceholder = (typeof TEMPLATE_PLACEHOLDERS)[number];

export type OutreachLeadFields = Pick<
  Lead,
  "name" | "category" | "city" | "website" | "contact_name" | "why_lagging" | "peer_gap"
>;

export type OutreachTemplateContent = Pick<OutreachTemplate, "body"> & {
  subject?: string | null;
};

const PLACEHOLDER_RE = /\{\{\s*([a-z0-9_]+)\s*\}\}/gi;

function ensureSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  if (/[.!?…]$/u.test(trimmed)) return trimmed;
  return `${trimmed}.`;
}

export function composeCategoryBit(category: string | null | undefined): string {
  const value = category?.trim();
  return value ? ` (${value})` : "";
}

/**
 * Soft pinpoints from the lead card: exact why_lagging first, then peer_gap
 * as its own sentence. No extra critique framing.
 */
export function composePinpoints(
  lead: Pick<OutreachLeadFields, "why_lagging" | "peer_gap">,
): string {
  const why =
    lead.why_lagging?.trim() ||
    "יש מקום לחזק את הנוכחות הדיגיטלית כך שתשקף את איכות העסק בפועל";
  const peer = lead.peer_gap?.trim();
  if (!peer) return ensureSentence(why);
  return `${ensureSentence(why)} ${ensureSentence(peer)}`;
}

export function buildOutreachPlaceholders(
  lead: OutreachLeadFields,
): Record<TemplatePlaceholder, string> {
  const firstName = firstNameFromContact(lead.contact_name) ?? "";
  const why =
    lead.why_lagging?.trim() ||
    "יש מקום לחזק את הנוכחות הדיגיטלית כך שתשקף את איכות העסק בפועל";
  const peer = lead.peer_gap?.trim() ?? "";

  return {
    greeting: greetingFromContact(lead.contact_name),
    first_name: firstName,
    business_name: lead.name,
    category: lead.category?.trim() ?? "",
    category_bit: composeCategoryBit(lead.category),
    city: lead.city?.trim() || DEFAULT_CITY,
    why_lagging: why,
    peer_gap: peer,
    pinpoints: composePinpoints(lead),
    owner_name: OWNER_NAME,
    owner_role: OWNER_ROLE,
    company: COMPANY,
    ai_revolution: AI_REVOLUTION_PARAGRAPH,
  };
}

export function renderOutreachTemplate(
  text: string,
  values: Record<string, string>,
): string {
  return text.replace(PLACEHOLDER_RE, (match, key: string) => {
    const normalized = key.toLowerCase();
    if (Object.prototype.hasOwnProperty.call(values, normalized)) {
      return values[normalized] ?? "";
    }
    return match;
  });
}

export function templateAppliesTo(
  templateChannel: TemplateChannel,
  target: "whatsapp" | "email",
): boolean {
  return templateChannel === "both" || templateChannel === target;
}

/** Channels whose default this template would replace. */
export function overlappingTemplateChannels(
  channel: TemplateChannel,
): TemplateChannel[] {
  if (channel === "whatsapp") return ["whatsapp", "both"];
  if (channel === "email") return ["email", "both"];
  return ["whatsapp", "email", "both"];
}

export function pickDefaultTemplate(
  templates: OutreachTemplate[],
  channel: "whatsapp" | "email",
): OutreachTemplate | null {
  const matches = templates
    .filter((template) => template.is_default && templateAppliesTo(template.channel, channel))
    .sort((a, b) => a.sort_order - b.sort_order || a.created_at.localeCompare(b.created_at));
  return matches.find((template) => template.channel === channel) ?? matches[0] ?? null;
}

/**
 * Email subject + body from the default template, or the hardcoded composer
 * when no template body is available.
 */
export function composeTemplatedOutreach(
  lead: OutreachLeadFields,
  template?: OutreachTemplateContent | null,
): { subject: string; body: string } {
  if (!template?.body?.trim()) {
    return composeOutreach(lead);
  }

  const values = buildOutreachPlaceholders(lead);
  const subjectSource = template.subject?.trim() || DEFAULT_EMAIL_SUBJECT_TEMPLATE;
  return {
    subject: renderOutreachTemplate(subjectSource, values),
    body: renderOutreachTemplate(template.body, values),
  };
}
