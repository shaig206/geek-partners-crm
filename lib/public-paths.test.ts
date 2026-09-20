import assert from "node:assert/strict";
import { test } from "node:test";
import { isPublicPath } from "./public-paths.ts";

test("login, auth, inbound webhooks, and /workshop are public", () => {
  assert.equal(isPublicPath("/login"), true);
  assert.equal(isPublicPath("/auth/callback"), true);
  assert.equal(isPublicPath("/api/webhooks/resend-inbound"), true);
  assert.equal(isPublicPath("/workshop"), true);
  assert.equal(isPublicPath("/workshop/"), true);
});

test("CRM routes stay behind login", () => {
  assert.equal(isPublicPath("/"), false);
  assert.equal(isPublicPath("/leads"), false);
  assert.equal(isPublicPath("/leads/new"), false);
  assert.equal(isPublicPath("/templates"), false);
  assert.equal(isPublicPath("/workshops"), false);
});
