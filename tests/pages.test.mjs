// Page checks: every inline <script> parses (one stray quote kills the whole
// page, and the bundler can't see inside template strings), no em dashes
// (house style), nothing gets indexed, and security headers on every response.
import { test } from "node:test";
import assert from "node:assert/strict";
import { LOGIN_HTML, APP_HTML } from "../src/pages.js";
import { seededEnv, call, assertScriptsParse, assertHouseStyle } from "./helpers.mjs";

for (const [name, page] of [["sign-in", LOGIN_HTML], ["app", APP_HTML]]) {
  test(name + " page scripts parse", () => assertScriptsParse(name, page));
  test(name + " page has no em dashes and is noindex", () => assertHouseStyle(name, page));
}

test("every response carries the security headers; robots.txt disallows all", async () => {
  const env = await seededEnv();
  for (const path of ["/", "/api/health", "/nope", "/api/vendor/me"]) {
    const h = (await call(env, path)).headers;
    assert.equal(h.get("X-Robots-Tag"), "noindex, nofollow", path);
    assert.equal(h.get("X-Content-Type-Options"), "nosniff", path);
    assert.equal(h.get("X-Frame-Options"), "DENY", path);
    assert.equal(h.get("Cache-Control"), "no-store", path);
  }
  assert.equal((await call(env, "/robots.txt")).body, "User-agent: *\nDisallow: /\n");
});

test("unknown pages are a 404, not the app", async () => {
  const env = await seededEnv();
  assert.equal((await call(env, "/nope")).status, 404);
  assert.equal((await call(env, "/api/nope")).status, 404);
});

test("the preview banner shows until PREVIEW=0", async () => {
  let env = await seededEnv();
  assert.match((await call(env, "/")).body, /Preview: this portal is still being built/);
  env = await seededEnv({ PREVIEW: "0" });
  assert.doesNotMatch((await call(env, "/")).body, /Preview: this portal/);
  assert.equal((await call(env, "/api/health")).body.preview, false);
});
