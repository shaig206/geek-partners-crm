import assert from "node:assert/strict";
import { test } from "node:test";
import type { OutreachTemplate } from "./types.ts";
import {
  AI_REVOLUTION_PARAGRAPH,
  buildOutreachPlaceholders,
  composeCategoryBit,
  composePinpoints,
  composeTemplatedOutreach,
  overlappingTemplateChannels,
  pickDefaultTemplate,
  renderOutreachTemplate,
  templateAppliesTo,
} from "./templates.ts";
import { composeOutreach } from "./utils.ts";
import { composeWhatsAppMessage } from "./whatsapp.ts";

const lead = {
  name: "מאפיית הלחם של יובל",
  category: "מאפייה",
  city: "פרדס חנה-כרכור",
  website: "https://example.test",
  contact_name: "יובל כהן",
  why_lagging: "אין הזמנות אונליין והאתר נראה כמו כרטיס ביקור מ-2014",
  peer_gap: "מאפיות באזור מציגות תפריט, שעות ומבצעים באתר ובאינסטגרם",
};

function template(partial: Partial<OutreachTemplate> & Pick<OutreachTemplate, "id" | "channel" | "body">): OutreachTemplate {
  return {
    name: "t",
    subject: null,
    is_default: false,
    sort_order: 0,
    created_at: "2026-09-17T00:00:00.000Z",
    updated_at: "2026-09-17T00:00:00.000Z",
    ...partial,
  };
}

test("greeting placeholder is the existing שלום + first name form", () => {
  const values = buildOutreachPlaceholders(lead);
  assert.equal(values.greeting, "שלום יובל,");
  assert.equal(values.first_name, "יובל");
  assert.equal(values.business_name, lead.name);
  assert.equal(values.owner_name, "שי גלבוע");
  assert.equal(values.owner_role, "מפתח תוכנה");
  assert.equal(values.company, "Geek Partners");
  assert.equal(values.ai_revolution, AI_REVOLUTION_PARAGRAPH);
});

test("category_bit is a parenthetical or empty", () => {
  assert.equal(composeCategoryBit("מאפייה"), " (מאפייה)");
  assert.equal(composeCategoryBit("  "), "");
  assert.equal(composeCategoryBit(null), "");
  assert.equal(buildOutreachPlaceholders({ ...lead, category: null }).category_bit, "");
});

test("pinpoints are why_lagging then soft peer_gap, without extra critique framing", () => {
  assert.equal(
    composePinpoints(lead),
    "אין הזמנות אונליין והאתר נראה כמו כרטיס ביקור מ-2014. מאפיות באזור מציגות תפריט, שעות ומבצעים באתר ובאינסטגרם.",
  );
  assert.equal(
    composePinpoints({ why_lagging: "חסר וואטסאפ עסקי.", peer_gap: null }),
    "חסר וואטסאפ עסקי.",
  );
  assert.match(
    composePinpoints({ why_lagging: null, peer_gap: null }),
    /נוכחות הדיגיטלית/,
  );
});

test("renderOutreachTemplate fills known placeholders and leaves unknown ones", () => {
  const values = buildOutreachPlaceholders(lead);
  const rendered = renderOutreachTemplate(
    "{{greeting}} עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{unknown}}",
    values,
  );
  assert.equal(
    rendered,
    "שלום יובל, עברתי על מאפיית הלחם של יובל (מאפייה) בפרדס חנה-כרכור. {{unknown}}",
  );
});

test("seed-style WhatsApp body uses greeting without doubling שלום", () => {
  const body = `{{greeting}} שמי {{owner_name}}, {{owner_role}}.

עברתי על {{business_name}}{{category_bit}} ב{{city}}. {{pinpoints}}

{{ai_revolution}}

{{owner_name}}
Geek Partners`;
  const message = composeWhatsAppMessage(lead, body);
  assert.match(message, /^שלום יובל, שמי שי גלבוע, מפתח תוכנה\./);
  assert.doesNotMatch(message, /שלום שלום/);
  assert.match(message, /מאפיית הלחם של יובל \(מאפייה\) בפרדס חנה-כרכור/);
  assert.match(message, /מהפכת ה-AI/);
  assert.match(message, /Geek Partners/);
});

test("composeWhatsAppMessage falls back to the hardcoded opener when no template", () => {
  const message = composeWhatsAppMessage(lead);
  assert.match(message, /^שלום יובל, שמי שי גלבוע, מפתח תוכנה\./);
  assert.doesNotMatch(message, /מהפכת ה-AI/);
  assert.match(message, /נראית הזדמנות קטנה/);
});

test("composeTemplatedOutreach uses template subject + body, else hardcoded email", () => {
  const templated = composeTemplatedOutreach(lead, {
    body: "{{greeting}}\n\n{{pinpoints}}\n\n{{owner_name}}",
    subject: "רעיון קטן ל{{business_name}}",
  });
  assert.equal(templated.subject, "רעיון קטן למאפיית הלחם של יובל");
  assert.match(templated.body, /^שלום יובל,/);
  assert.match(templated.body, /אין הזמנות אונליין/);

  const fallback = composeTemplatedOutreach(lead, null);
  const hardcoded = composeOutreach(lead);
  assert.deepEqual(fallback, hardcoded);
  assert.match(fallback.body, /מה שבלט:/);
});

test("empty template subject falls back to the default subject template", () => {
  const { subject } = composeTemplatedOutreach(lead, { body: "שלום", subject: "  " });
  assert.equal(subject, "רעיון קטן לאתר של מאפיית הלחם של יובל");
});

test("pickDefaultTemplate prefers exact channel over both", () => {
  const rows = [
    template({
      id: "1",
      channel: "both",
      body: "both",
      is_default: true,
      sort_order: 1,
    }),
    template({
      id: "2",
      channel: "whatsapp",
      body: "wa",
      is_default: true,
      sort_order: 5,
    }),
    template({
      id: "3",
      channel: "email",
      body: "mail",
      is_default: true,
      sort_order: 2,
    }),
  ];
  assert.equal(pickDefaultTemplate(rows, "whatsapp")?.id, "2");
  assert.equal(pickDefaultTemplate(rows, "email")?.id, "3");
  assert.equal(pickDefaultTemplate(rows.filter((row) => row.id !== "3"), "email")?.id, "1");
  assert.equal(pickDefaultTemplate(rows.map((row) => ({ ...row, is_default: false })), "whatsapp"), null);
});

test("overlappingTemplateChannels covers both when setting a shared default", () => {
  assert.deepEqual(overlappingTemplateChannels("whatsapp"), ["whatsapp", "both"]);
  assert.deepEqual(overlappingTemplateChannels("email"), ["email", "both"]);
  assert.deepEqual(overlappingTemplateChannels("both"), ["whatsapp", "email", "both"]);
  assert.equal(templateAppliesTo("both", "whatsapp"), true);
  assert.equal(templateAppliesTo("email", "whatsapp"), false);
});
