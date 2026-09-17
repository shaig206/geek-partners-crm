import assert from "node:assert/strict";
import { test } from "node:test";
import {
  channelBucket,
  hasEmail,
  hasWhatsApp,
  normalizeIsraeliPhone,
} from "./channels.ts";

test("normalizeIsraeliPhone strips spaces, dashes, and +972", () => {
  assert.equal(normalizeIsraeliPhone("052-1112233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("052 111 2233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("+972521112233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("+972-52-111-2233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("972521112233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("00972521112233"), "0521112233");
  assert.equal(normalizeIsraeliPhone("04-6230011"), "046230011");
  assert.equal(normalizeIsraeliPhone("+9724-6230011"), "046230011");
  assert.equal(normalizeIsraeliPhone(""), null);
  assert.equal(normalizeIsraeliPhone(null), null);
  assert.equal(normalizeIsraeliPhone("   "), null);
});

test("hasWhatsApp is 05-mobile only — landlines are not WhatsApp", () => {
  assert.equal(hasWhatsApp("052-1112233"), true);
  assert.equal(hasWhatsApp("0501234567"), true);
  assert.equal(hasWhatsApp("058-9988776"), true);
  assert.equal(hasWhatsApp("+97252-1112233"), true);
  assert.equal(hasWhatsApp("04-1234567"), false);
  assert.equal(hasWhatsApp("03-1234567"), false);
  assert.equal(hasWhatsApp("02-1234567"), false);
  assert.equal(hasWhatsApp("08-1234567"), false);
  assert.equal(hasWhatsApp("09-1234567"), false);
  assert.equal(hasWhatsApp("07-1234567"), false);
  assert.equal(hasWhatsApp("+9724-6230011"), false);
  assert.equal(hasWhatsApp(null), false);
  assert.equal(hasWhatsApp(""), false);
  assert.equal(hasWhatsApp("052"), false);
});

test("hasEmail is non-empty trimmed email", () => {
  assert.equal(hasEmail("lead@example.com"), true);
  assert.equal(hasEmail("  a@b.co  "), true);
  assert.equal(hasEmail(""), false);
  assert.equal(hasEmail("   "), false);
  assert.equal(hasEmail(null), false);
  assert.equal(hasEmail(undefined), false);
});

test("channelBucket covers the 2x2 matrix", () => {
  assert.equal(channelBucket({ phone: "052-1112233", email: "a@b.com" }), "both");
  assert.equal(channelBucket({ phone: "0521112233", email: null }), "whatsapp");
  assert.equal(channelBucket({ phone: "04-1234567", email: "a@b.com" }), "email");
  assert.equal(channelBucket({ phone: "04-1234567", email: null }), "none");
  assert.equal(channelBucket({ phone: null, email: null }), "none");
  assert.equal(channelBucket({ phone: "03-5555555", email: "  " }), "none");
});
