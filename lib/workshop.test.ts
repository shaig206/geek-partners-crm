import assert from "node:assert/strict";
import { test } from "node:test";
import { civilDateInTimeZone } from "./follow-up.ts";
import {
  WORKSHOP_CATEGORY,
  WORKSHOP_CITY,
  WORKSHOP_PATH,
  WORKSHOP_SOURCE_NOTE,
  WORKSHOP_SOURCE_URL,
  buildWorkshopLead,
  parseWorkshopEmail,
  parseWorkshopPhone,
  workshopFieldsFromForm,
} from "./workshop.ts";

test("parseWorkshopEmail accepts a simple address and rejects junk", () => {
  assert.equal(parseWorkshopEmail("  Ada@Geek.partners "), "ada@geek.partners");
  assert.equal(parseWorkshopEmail(""), null);
  assert.equal(parseWorkshopEmail("   "), null);
  assert.equal(parseWorkshopEmail("not-an-email"), "invalid");
});

test("parseWorkshopPhone normalizes Israeli mobiles and rejects short values", () => {
  assert.equal(parseWorkshopPhone("052-1112233"), "0521112233");
  assert.equal(parseWorkshopPhone("+972521112233"), "0521112233");
  assert.equal(parseWorkshopPhone(""), null);
  assert.equal(parseWorkshopPhone("123"), "invalid");
});

test("buildWorkshopLead prefers business name and tags the row as a workshop signup", () => {
  const now = new Date("2026-09-20T08:00:00.000Z");
  const result = buildWorkshopLead(
    {
      contactName: "  נועה לוי  ",
      businessName: "  מאפיית הלחם  ",
      email: "noea@example.com",
      phone: "052-1112233",
    },
    now,
  );
  assert.equal(result.ok, true);
  if (!result.ok) return;

  assert.deepEqual(result.payload, {
    name: "מאפיית הלחם",
    contact_name: "נועה לוי",
    email: "noea@example.com",
    phone: "0521112233",
    city: WORKSHOP_CITY,
    status: "new",
    business_status: "חדש",
    business_type: null,
    category: WORKSHOP_CATEGORY,
    warming_notes: WORKSHOP_SOURCE_NOTE,
    source_url: WORKSHOP_SOURCE_URL,
    priority: true,
    found_at: civilDateInTimeZone(now),
  });
  assert.equal(result.payload.source_url, WORKSHOP_PATH);
  assert.match(result.payload.warming_notes, /סדנה/);
});

test("buildWorkshopLead uses the person name when business is blank", () => {
  const result = buildWorkshopLead({
    contactName: "דני כהן",
    businessName: "   ",
    email: "",
    phone: "0501234567",
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.payload.name, "דני כהן");
  assert.equal(result.payload.contact_name, "דני כהן");
  assert.equal(result.payload.email, null);
  assert.equal(result.payload.phone, "0501234567");
});

test("buildWorkshopLead requires a name and at least one contact method", () => {
  assert.equal(
    buildWorkshopLead({
      contactName: " ",
      businessName: "עסק",
      email: "a@b.com",
      phone: "",
    }).ok,
    false,
  );
  assert.equal(
    buildWorkshopLead({
      contactName: "נועה",
      businessName: "עסק",
      email: "",
      phone: "",
    }).ok,
    false,
  );
  assert.equal(
    buildWorkshopLead({
      contactName: "נועה",
      businessName: "עסק",
      email: "a@b.com",
      phone: "",
    }).ok,
    true,
  );
  assert.equal(
    buildWorkshopLead({
      contactName: "נועה",
      businessName: "עסק",
      email: "",
      phone: "0521112233",
    }).ok,
    true,
  );
});

test("workshopFieldsFromForm reads the public form keys", () => {
  const form = new FormData();
  form.set("contact_name", "נועה");
  form.set("business_name", "עסק");
  form.set("email", "a@b.com");
  form.set("phone", "0521112233");
  assert.deepEqual(workshopFieldsFromForm(form), {
    contactName: "נועה",
    businessName: "עסק",
    email: "a@b.com",
    phone: "0521112233",
  });
});
