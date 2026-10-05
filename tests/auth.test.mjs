// Sign-in, sessions, first-time password, lockout. Run: npm test
import { test } from "node:test";
import assert from "node:assert/strict";
import { handle } from "../src/index.js";
import { signSession, pbkdf2Hex } from "../src/auth.js";
import { seededEnv, req, cookieFrom, call, as, writes, PASSWORD, TEMP } from "./helpers.mjs";

const login = (env, email, password = PASSWORD) => handle(req("/api/vendor/login", { method: "POST", body: { email, password } }), env);

test("a vendor signs in with their CRM vendor password and gets this app's own cookie", async () => {
  const env = await seededEnv();
  const res = await login(env, " Vic@Mow.com ");
  assert.equal(res.status, 200);
  assert.match(res.headers.get("Set-Cookie"), /^vendor_portal_sess=[^;]+; HttpOnly; Secure; SameSite=Lax; Path=\/; Max-Age=2592000$/);
  const me = await call(env, "/api/vendor/me", { cookie: cookieFrom(res) });
  assert.equal(me.status, 200);
  assert.deepEqual(me.body.vendor, { name: "Vic Vendor", email: "vic@mow.com" });
  assert.equal(me.body.mustChange, false);
  assert.equal(me.body.preview, true);
  // the CRM's login stamps last_login; that's the only write
  assert.deepEqual(writes(env), ["UPDATE vendor_accounts"]);
  assert.ok(env.DB.raw.prepare("SELECT last_login FROM vendor_accounts WHERE id = 1").get().last_login);
});

test("the sign-in page and app shell route signed-in vendors, and the CRM paths work too", async () => {
  const env = await seededEnv();
  assert.equal((await call(env, "/")).status, 200);
  assert.equal((await call(env, "/vendor")).status, 200);
  const anon = await call(env, "/app");
  assert.equal(anon.status, 302);
  assert.equal(anon.headers.get("Location"), "/");
  const vic = await as(env, "vic@mow.com");
  for (const path of ["/", "/vendor"]) {
    const r = await call(env, path, { cookie: vic.cookie });
    assert.equal(r.status, 302);
    assert.equal(r.headers.get("Location"), "/app");
  }
  assert.equal((await call(env, "/app", { cookie: vic.cookie })).status, 200);
  assert.equal((await call(env, "/vendor/app", { cookie: vic.cookie })).status, 200);
  assert.equal((await call(env, "/api/vendor/me")).status, 401);
});

test("wrong passwords, unknown and inactive accounts are refused; five misses lock the email out", async () => {
  const env = await seededEnv();
  assert.equal((await login(env, "old@gone.com")).status, 401);
  assert.equal((await login(env, "nobody@x.com")).status, 401);
  assert.equal((await login(env, "", "")).status, 400);
  for (let i = 0; i < 5; i++) assert.equal((await login(env, "vic@mow.com", "nope")).status, 401);
  const locked = await login(env, "vic@mow.com");
  assert.equal(locked.status, 429);
  assert.equal(locked.headers.get("Set-Cookie"), null);
  // other vendors are unaffected
  assert.equal((await login(env, "wanda@clean.com")).status, 200);
});

test("deactivating a vendor in the office signs them out on their next click", async () => {
  const env = await seededEnv();
  const vic = await as(env, "vic@mow.com");
  assert.equal((await vic("/api/vendor/me")).status, 200);
  env.DB.raw.exec("UPDATE vendor_accounts SET active = 0 WHERE id = 1");
  assert.equal((await vic("/api/vendor/me")).status, 401);
  assert.equal((await call(env, "/app", { cookie: vic.cookie })).status, 302);
});

test("first sign-in on the temporary password: must pick their own, stored the CRM's way", async () => {
  const env = await seededEnv();
  const nate = await as(env, "nate@new.com", TEMP);
  assert.equal((await nate("/api/vendor/me")).body.mustChange, true);
  assert.match((await nate("/api/vendor/password/first", { next: "short" })).body.error, /10 characters/);
  assert.match((await nate("/api/vendor/password/first", { next: "#ExpertPM#" })).body.error, /at least 10|temporary/);
  env.DB.log.length = 0;
  assert.deepEqual((await nate("/api/vendor/password/first", { next: "my own long password" })).body, { ok: true });
  assert.deepEqual(writes(env).filter((w) => w !== "SELECT"), ["UPDATE vendor_accounts"]);
  const row = env.DB.raw.prepare("SELECT pw_salt, pw_hash, must_change_password FROM vendor_accounts WHERE id = 3").get();
  assert.equal(row.must_change_password, 0);
  assert.equal(row.pw_salt.length, 32);
  assert.equal(await pbkdf2Hex("my own long password", row.pw_salt), row.pw_hash); // same PBKDF2 as the CRM
  assert.match((await nate("/api/vendor/password/first", { next: "another long password" })).body.error, /already set/);
  assert.equal((await login(env, "nate@new.com", TEMP)).status, 401);
  assert.equal((await login(env, "nate@new.com", "my own long password")).status, 200);
});

test("a staff login linked to a vendor account gets that vendor's portal, and only while linked", async () => {
  const env = await seededEnv();
  // Max is staff user 3, linked to vendor account 5
  const max = await as(env, "maint@expertpm.com");
  const me = await max("/api/vendor/me");
  assert.equal(me.body.vendor.name, "Max Handy");
  assert.equal(me.body.via, "staff");
  assert.equal(me.body.mustChange, false); // the vendor account's temp password isn't theirs to change
  assert.equal((await max("/api/vendor/password/first", { next: "a long new password" })).status, 403);
  // staff without a link are turned away like anyone else
  assert.equal((await login(env, "office@expertpm.com")).status, 401);
  // unlinking (or relinking elsewhere) ends the session right away
  env.DB.raw.exec("UPDATE vendor_accounts SET crm_user_id = NULL WHERE id = 5");
  assert.equal((await max("/api/vendor/me")).status, 401);
  // this app never writes to users
  assert.ok(!writes(env).some((w) => /users/.test(w)));
});

test("tokens from anywhere else never unlock the portal", async () => {
  const env = await seededEnv();
  const me = (cookie) => call(env, "/api/vendor/me", { cookie });
  const enc = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const hmac = async (secret, payload) => {
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    return Buffer.from(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))).toString("base64url");
  };
  // a CRM vendor token ({uid, vt:1}), even signed with this app's secret by mistake
  const crm = enc({ uid: 1, vt: 1, exp: Date.now() + 1e6 });
  assert.equal((await me("vendor_portal_sess=" + crm + "." + await hmac(env.VENDOR_PORTAL_SESSION_SECRET, crm))).status, 401);
  // ...or under the CRM's cookie name
  const good = await signSession(env, { vid: 1, exp: Date.now() + 1e6 });
  assert.equal((await me("vendor_sess=" + good)).status, 401);
  assert.equal((await me("vendor_portal_sess=" + good)).status, 200);
  // signed with another secret (the CRM's, or the agent app's)
  const other = await signSession({ VENDOR_PORTAL_SESSION_SECRET: "the-crm-secret" }, { vid: 1, exp: Date.now() + 1e6 });
  assert.equal((await me("vendor_portal_sess=" + other)).status, 401);
  // an agent-app token (aud agent)
  const ag = enc({ uid: 1, vid: 1, aud: "agent", exp: Date.now() + 1e6 });
  assert.equal((await me("vendor_portal_sess=" + ag + "." + await hmac(env.VENDOR_PORTAL_SESSION_SECRET, ag))).status, 401);
  // expired, tampered, garbage
  assert.equal((await me("vendor_portal_sess=" + await signSession(env, { vid: 1, exp: Date.now() - 1 }))).status, 401);
  assert.equal((await me("vendor_portal_sess=" + enc({ vid: 2, exp: Date.now() + 1e6, aud: "vendor" }) + "." + good.split(".")[1])).status, 401);
  assert.equal((await me("vendor_portal_sess=not.a-token")).status, 401);
  assert.equal((await me("vendor_portal_sess=%%%")).status, 401);
  // and a token from here carries no `uid`, which the CRM requires
  const payload = JSON.parse(Buffer.from(good.split(".")[0], "base64url").toString());
  assert.equal(payload.uid, undefined);
  assert.equal(payload.aud, "vendor");
});

test("without VENDOR_PORTAL_SESSION_SECRET sign-in is refused, not silently weak", async () => {
  const env = await seededEnv({ VENDOR_PORTAL_SESSION_SECRET: undefined });
  assert.equal((await login(env, "vic@mow.com")).status, 503);
  const health = (await call(env, "/api/health")).body;
  assert.equal(health.sessionSecret, false);
  assert.equal(health.dbOk, true);
  assert.equal(health.sideEffects, false);
});

test("logout clears the cookie", async () => {
  const env = await seededEnv();
  const res = await handle(req("/api/vendor/logout", { method: "POST" }), env);
  assert.match(res.headers.get("Set-Cookie"), /^vendor_portal_sess=gone;.*Max-Age=0/);
});
