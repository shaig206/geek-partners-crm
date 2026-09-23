import assert from "node:assert/strict";
import { test } from "node:test";
import type { Lead } from "./types.ts";
import {
  DEFAULT_SORT,
  DEFAULT_SORT_DIR,
  nextSortValue,
  parseSort,
  sortHeaderHref,
  sortLeadsList,
} from "./sort.ts";

function lead(partial: Partial<Lead> & Pick<Lead, "id" | "name">): Lead {
  return {
    website: null,
    category: null,
    city: "פרדס חנה-כרכור",
    business_type: "B2C",
    size_signal: null,
    lag_score: 3,
    why_lagging: null,
    peer_gap: null,
    phone: null,
    email: null,
    contact_name: null,
    status: "new",
    not_relevant_reason: null,
    business_status: "חדש",
    warming_notes: null,
    source_url: null,
    priority: false,
    found_at: "2026-01-01T00:00:00.000Z",
    last_contacted_at: null,
    follow_up_at: null,
    last_touched_at: null,
    created_at: "2026-01-01T00:00:00.000Z",
    updated_at: "2026-01-01T00:00:00.000Z",
    ...partial,
  };
}

test("parseSort defaults to lag_desc", () => {
  assert.deepEqual(parseSort(undefined), { key: "lag", dir: "desc", value: DEFAULT_SORT });
  assert.deepEqual(parseSort(""), { key: "lag", dir: "desc", value: DEFAULT_SORT });
  assert.deepEqual(parseSort("nope"), { key: "lag", dir: "desc", value: DEFAULT_SORT });
});

test("parseSort accepts existing and new header keys", () => {
  assert.deepEqual(parseSort("name_asc"), { key: "name", dir: "asc", value: "name_asc" });
  assert.deepEqual(parseSort("business_status_desc"), {
    key: "business_status",
    dir: "desc",
    value: "business_status_desc",
  });
  assert.deepEqual(parseSort("channel_asc"), { key: "channel", dir: "asc", value: "channel_asc" });
});

test("first click on a new column uses its default direction", () => {
  assert.equal(nextSortValue("name_asc", "lag"), "lag_desc");
  assert.equal(nextSortValue("lag_desc", "name"), "name_asc");
  assert.equal(nextSortValue("lag_desc", "found"), "found_desc");
  assert.equal(nextSortValue(undefined, "follow_up"), "follow_up_asc");
  assert.equal(nextSortValue("lag_desc", "channel"), "channel_asc");
  assert.equal(nextSortValue("lag_desc", "status"), "status_asc");
});

test("repeated click on the same column toggles asc/desc", () => {
  assert.equal(nextSortValue(undefined, "lag"), "lag_asc");
  assert.equal(nextSortValue("lag_desc", "lag"), "lag_asc");
  assert.equal(nextSortValue("lag_asc", "lag"), "lag_desc");
  assert.equal(nextSortValue("name_asc", "name"), "name_desc");
  assert.equal(nextSortValue("name_desc", "name"), "name_asc");
});

test("sortHeaderHref preserves other filters and replaces sort", () => {
  const href = sortHeaderHref(
    {
      q: "מאפייה",
      status: "new",
      business_status: "רלוונטי",
      channel: "whatsapp",
      type: "B2C",
      lag: "4",
      follow_up: "1",
      sort: "lag_desc",
    },
    "name",
  );
  const params = new URLSearchParams(href.replace("/leads?", ""));
  assert.equal(href.startsWith("/leads?"), true);
  assert.equal(params.get("q"), "מאפייה");
  assert.equal(params.get("status"), "new");
  assert.equal(params.get("business_status"), "רלוונטי");
  assert.equal(params.get("channel"), "whatsapp");
  assert.equal(params.get("type"), "B2C");
  assert.equal(params.get("lag"), "4");
  assert.equal(params.get("follow_up"), "1");
  assert.equal(params.get("sort"), "name_asc");
});

test("name sort is Hebrew locale, both directions", () => {
  const aleph = lead({ id: "1", name: "אבג" });
  const tav = lead({ id: "2", name: "תלם" });
  assert.deepEqual(
    sortLeadsList([tav, aleph], "name_asc").map((row) => row.id),
    ["1", "2"],
  );
  assert.deepEqual(
    sortLeadsList([aleph, tav], "name_desc").map((row) => row.id),
    ["2", "1"],
  );
});

test("lag sort is numeric and keeps nulls last in both directions", () => {
  const low = lead({ id: "low", name: "a", lag_score: 1 });
  const high = lead({ id: "high", name: "b", lag_score: 5 });
  const missing = lead({ id: "missing", name: "c", lag_score: null });
  assert.deepEqual(
    sortLeadsList([missing, low, high], "lag_desc").map((row) => row.id),
    ["high", "low", "missing"],
  );
  assert.deepEqual(
    sortLeadsList([missing, high, low], "lag_asc").map((row) => row.id),
    ["low", "high", "missing"],
  );
});

test("channel sort uses filter bucket order whatsapp / email / both / none", () => {
  const wa = lead({ id: "wa", name: "wa", phone: "0521112233", email: null });
  const em = lead({ id: "em", name: "em", phone: "04-1234567", email: "a@b.com" });
  const both = lead({ id: "both", name: "both", phone: "0521112233", email: "a@b.com" });
  const none = lead({ id: "none", name: "none", phone: "04-1234567", email: null });
  assert.deepEqual(
    sortLeadsList([none, both, em, wa], "channel_asc").map((row) => row.id),
    ["wa", "em", "both", "none"],
  );
  assert.deepEqual(
    sortLeadsList([wa, em, both, none], "channel_desc").map((row) => row.id),
    ["none", "both", "em", "wa"],
  );
});

test("status and business_status sort follow workflow order, not alphabet", () => {
  const fresh = lead({ id: "fresh", name: "a", status: "new" });
  const closed = lead({ id: "closed", name: "b", status: "not_relevant" });
  const sent = lead({ id: "sent", name: "c", status: "contacted" });
  assert.deepEqual(
    sortLeadsList([closed, sent, fresh], "status_asc").map((row) => row.id),
    ["fresh", "sent", "closed"],
  );

  const win = lead({ id: "win", name: "d", business_status: "זכייה" });
  const relevant = lead({ id: "rel", name: "e", business_status: "רלוונטי" });
  const bizNew = lead({ id: "new", name: "f", business_status: "חדש" });
  assert.deepEqual(
    sortLeadsList([win, relevant, bizNew], "business_status_asc").map((row) => row.id),
    ["new", "rel", "win"],
  );
});

test("business type sort follows B2C → B2B → B2B2C", () => {
  const b2c = lead({ id: "c", name: "c", business_type: "B2C" });
  const b2b = lead({ id: "b", name: "b", business_type: "B2B" });
  const b2b2c = lead({ id: "x", name: "x", business_type: "B2B2C" });
  assert.deepEqual(
    sortLeadsList([b2b2c, b2b, b2c], "type_asc").map((row) => row.id),
    ["c", "b", "x"],
  );
});

test("SORT_OPTIONS covers every key in both directions", () => {
  for (const key of Object.keys(DEFAULT_SORT_DIR)) {
    for (const dir of ["asc", "desc"] as const) {
      const value = `${key}_${dir}`;
      const parsed = parseSort(value);
      assert.equal(parsed.key, key);
      assert.equal(parsed.dir, dir);
      assert.equal(parsed.value, value);
    }
  }
});

test("category and email sort are locale-aware with blanks last", () => {
  const bakery = lead({ id: "bakery", name: "a", category: "מאפייה", email: "b@x.com" });
  const salon = lead({ id: "salon", name: "b", category: "מספרה", email: "a@x.com" });
  const blank = lead({ id: "blank", name: "c", category: null, email: "  " });
  assert.deepEqual(
    sortLeadsList([salon, blank, bakery], "category_asc").map((row) => row.id),
    ["bakery", "salon", "blank"],
  );
  assert.deepEqual(
    sortLeadsList([bakery, blank, salon], "email_asc").map((row) => row.id),
    ["salon", "bakery", "blank"],
  );
});

test("follow_up and found sort by date with nulls last", () => {
  const early = lead({
    id: "early",
    name: "early",
    follow_up_at: "2026-01-01T00:00:00.000Z",
    found_at: "2026-01-01T00:00:00.000Z",
  });
  const late = lead({
    id: "late",
    name: "late",
    follow_up_at: "2026-06-01T00:00:00.000Z",
    found_at: "2026-06-01T00:00:00.000Z",
  });
  const missing = lead({
    id: "missing",
    name: "missing",
    follow_up_at: null,
    found_at: null,
  });
  assert.deepEqual(
    sortLeadsList([late, missing, early], "follow_up_asc").map((row) => row.id),
    ["early", "late", "missing"],
  );
  assert.deepEqual(
    sortLeadsList([early, missing, late], "found_desc").map((row) => row.id),
    ["late", "early", "missing"],
  );
});
