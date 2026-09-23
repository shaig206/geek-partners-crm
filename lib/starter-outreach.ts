import {
  LEAD_DRAFT_KINDS,
  type LeadDraftKind,
} from "@/lib/constants";
import { buildOutreachPlaceholders, renderOutreachTemplate } from "@/lib/templates";
import type { LeadMessageDraft } from "@/lib/types";
import type { OutreachLeadFields } from "@/lib/templates";

export type ResolvedLeadDrafts = Record<
  LeadDraftKind,
  { whatsapp: string; emailSubject: string; emailBody: string }
>;

const STARTERS: Record<LeadDraftKind, { whatsapp: string; emailSubject: string; emailBody: string }> = {
  first_touch: {
    whatsapp: `{{greeting}} שמי {{owner_name}}, {{owner_role}} מ-{{company}}.

עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{pinpoints}}

אם זה רלוונטי, אשמח לשלוח הצעה קצרה. בלי התחייבות ובלי לחץ.

{{owner_name}}`,
    emailSubject: "רעיון קטן ל{{business_name}}",
    emailBody: `{{greeting}}

שמי {{owner_name}}, {{owner_role}}. אני עובד עם עסקים בינוניים על שיפור כל השכבה הטכנולוגית שלהם — מהאתר והנוכחות הדיגיטלית ועד כלים שמסדרים מכירות, מעקב ותפעול.

עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{pinpoints}}

{{ai_revolution}}

אם זה רלוונטי, אשמח לשלוח הצעה קצרה. בלי התחייבות ובלי לחץ.

{{owner_name}}
{{company}}`,
  },
  follow_up: {
    whatsapp: `{{greeting}} רציתי לחזור אליך לגבי {{business_name}}.

שלחתי הודעה לפני כמה ימים. אם זה לא הזמן — אין בעיה. אם כן, אשמח לשיחה קצרה על מה שאפשר לשפר בנוכחות ובכלים.

{{owner_name}}
{{company}}`,
    emailSubject: "מעקב קצר — {{business_name}}",
    emailBody: `{{greeting}}

רציתי לחזור אליך לגבי {{business_name}}{{category_bit}} ב{{city}}.

שלחתי הודעה לפני כמה ימים. אם זה לא הזמן, אפשר פשוט להתעלם. אם כן, אשמח לשיחה קצרה — בלי התחייבות ובלי לחץ.

{{owner_name}}
{{company}}`,
  },
  soft_close: {
    whatsapp: `{{greeting}} לא אמשיך להציק לגבי {{business_name}}.

אם זה לא מתאים עכשיו, מספיקה מילה ואחזור רק כשיהיה רלוונטי. אם כן — אני כאן להצעה קצרה בלי התחייבות.

תודה,
{{owner_name}}`,
    emailSubject: "נסגור את הפינה? {{business_name}}",
    emailBody: `{{greeting}}

לא אמשיך לפנות לגבי {{business_name}} אם זה לא הזמן.

אם זה לא מתאים, אשמח לתשובה קצרה ואעצור. אם כן, אפשר להמשיך מההצעה הקצרה — בלי התחייבות.

תודה,
{{owner_name}}
{{company}}`,
  },
};

function overrideFor(
  overrides: LeadMessageDraft[],
  kind: LeadDraftKind,
  channel: "whatsapp" | "email",
): LeadMessageDraft | undefined {
  return overrides.find((row) => row.kind === kind && row.channel === channel);
}

/** Starter copy, then any per-lead override, with placeholders filled from the lead. */
export function resolveLeadDrafts(
  lead: OutreachLeadFields,
  overrides: LeadMessageDraft[],
): ResolvedLeadDrafts {
  const values = buildOutreachPlaceholders(lead);
  const resolved = {} as ResolvedLeadDrafts;

  for (const kind of LEAD_DRAFT_KINDS) {
    const starter = STARTERS[kind];
    const whatsapp = overrideFor(overrides, kind, "whatsapp");
    const email = overrideFor(overrides, kind, "email");
    resolved[kind] = {
      whatsapp: renderOutreachTemplate(whatsapp?.body?.trim() || starter.whatsapp, values),
      emailSubject: renderOutreachTemplate(
        email?.subject?.trim() || starter.emailSubject,
        values,
      ),
      emailBody: renderOutreachTemplate(email?.body?.trim() || starter.emailBody, values),
    };
  }

  return resolved;
}
