import assert from "node:assert/strict";
import { test } from "node:test";
import { LEAD_STATUS_LABELS } from "./constants.ts";
import { markSentPayload } from "./follow-up.ts";
import {
  formatStatusChangeNote,
  leadStatusFromQuery,
  leadStatusLabel,
  pipelineStatusFromLegacy,
} from "./lead-status.ts";

test("נשלחה הודעה maps to נוצר קשר without a reason", () => {
  assert.deepEqual(pipelineStatusFromLegacy({ status: "נשלחה הודעה", businessStatus: "חדש" }), {
    status: "contacted",
    reason: null,
  });
  assert.equal(leadStatusLabel("נשלחה הודעה"), "נוצר קשר");
});

test("אין מענה פעם אחת stays contacted; twice becomes unreachable", () => {
  assert.deepEqual(
    pipelineStatusFromLegacy({ status: "אין מענה פעם אחת", businessStatus: "רלוונטי" }),
    { status: "contacted", reason: null },
  );
  assert.deepEqual(
    pipelineStatusFromLegacy({ status: "אין מענה פעמיים", businessStatus: "רלוונטי" }),
    { status: "not_relevant", reason: "unreachable" },
  );
});

test("business status upgrades a fresh communication status", () => {
  assert.equal(
    pipelineStatusFromLegacy({ status: "חדש", businessStatus: "זכייה" }).status,
    "converted",
  );
  assert.equal(
    pipelineStatusFromLegacy({ status: "חדש", businessStatus: "בפגישה או שיחה" }).status,
    "in_conversation",
  );
  assert.deepEqual(pipelineStatusFromLegacy({ status: "חדש", businessStatus: "לא רלוונטי" }), {
    status: "not_relevant",
    reason: null,
  });
});

test("stable keys and an existing reason are preserved", () => {
  assert.deepEqual(
    pipelineStatusFromLegacy({
      status: "not_relevant",
      businessStatus: "זכייה",
      reason: "no_fit",
    }),
    { status: "not_relevant", reason: "no_fit" },
  );
  assert.equal(LEAD_STATUS_LABELS.contacted, "נוצר קשר");
});

test("status change note is Hebrew and includes the reason", () => {
  assert.equal(
    formatStatusChangeNote({
      fromStatus: "contacted",
      toStatus: "not_relevant",
      toReason: "wrong_area",
    }),
    "הסטטוס השתנה מ«נוצר קשר» ל«לא רלוונטי» (אזור לא נכון).",
  );
});

test("list search matches the new Hebrew statuses and stable keys", () => {
  assert.equal(leadStatusFromQuery("חדש"), "new");
  assert.equal(leadStatusFromQuery("נוצר קשר"), "contacted");
  assert.equal(leadStatusFromQuery("בשיחה"), "in_conversation");
  assert.equal(leadStatusFromQuery("נקבע מעקב"), "follow_up_scheduled");
  assert.equal(leadStatusFromQuery("לא רלוונטי"), "not_relevant");
  assert.equal(leadStatusFromQuery("הומר"), "converted");
  assert.equal(leadStatusFromQuery("in_conversation"), "in_conversation");
  assert.equal(leadStatusFromQuery("קשר"), "contacted");
  assert.equal(leadStatusFromQuery("מאפייה"), null);
  assert.equal(leadStatusFromQuery(""), null);
});

test("mark sent clears a not-relevant reason and stamps last touch", () => {
  const payload = markSentPayload({
    channel: "whatsapp",
    warmingNotes: null,
    now: new Date("2026-09-23T10:00:00.000Z"),
  });
  assert.equal(payload.status, "contacted");
  assert.equal(payload.not_relevant_reason, null);
  assert.equal(payload.last_touched_at, "2026-09-23T10:00:00.000Z");
  assert.match(payload.warming_notes, /וואטסאפ/);
});
