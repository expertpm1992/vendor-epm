// Test harness: a real SQLite database (node:sqlite) wrapped in the slice of
// the D1 API the app uses (prepare/bind/first/all/run/batch), seeded with the
// CRM's users + vendor tables. Every SQL statement is recorded so tests can
// prove which shared tables the app writes to. A fake KV and a fake CONTACT
// service record files and texts.
import { DatabaseSync } from "node:sqlite";
import assert from "node:assert/strict";
import { pbkdf2Hex, resetLoginFails } from "../src/auth.js";
import { handle } from "../src/index.js";
import { ensureVendorTables, ensureQuoteTables, workEnsure, vappEnsure } from "../src/db.js";

export function fakeD1() {
  const db = new DatabaseSync(":memory:");
  const log = [];
  const stmt = (sql, args = []) => ({
    sql, args,
    bind: (...a) => stmt(sql, a),
    first: async () => { log.push(sql); return db.prepare(sql).get(...args) ?? null; },
    all: async () => { log.push(sql); return { results: db.prepare(sql).all(...args) }; },
    run: async () => { log.push(sql); const r = db.prepare(sql).run(...args); return { success: true, meta: { changes: Number(r.changes), last_row_id: Number(r.lastInsertRowid) } }; },
  });
  const d1 = {
    prepare: (sql) => stmt(sql), raw: db, log,
    batch: async (stmts) => {
      db.exec("BEGIN");
      try { const out = []; for (const s of stmts) out.push(await s.run()); db.exec("COMMIT"); return out; }
      catch (e) { db.exec("ROLLBACK"); throw e; }
    },
  };
  return d1;
}

export const SALT = "00112233445566778899aabbccddeeff";
export const PASSWORD = "correct horse battery";
export const TEMP = "#ExpertPM#";

// The slice of Workers KV the app uses.
export function fakeKV() {
  const m = new Map();
  return {
    map: m,
    put: async (key, value, opts = {}) => { m.set(key, { value: value instanceof ArrayBuffer ? value.slice(0) : new Uint8Array(value).slice().buffer, metadata: opts.metadata || null }); },
    getWithMetadata: async (key) => m.get(key) || { value: null, metadata: null },
    get: async (key) => (m.get(key) || { value: null }).value,
    delete: async (key) => { m.delete(key); },
  };
}

// The expertpm-contact Worker: records every text that really goes out.
export function fakeContact() {
  const sent = [];
  return { sent, fetch: async (url, init) => { sent.push(JSON.parse(init.body)); return new Response(JSON.stringify({ ok: true })); } };
}

/* Two vendors (Vic and Wanda), a third on the temp password, an inactive one,
   staff users (one linked to a vendor account), the CRM's other vendor
   tables, and an inspection with photos. */
export async function seededEnv(extra = {}) {
  resetLoginFails();
  const DB = fakeD1();
  const CONTACT = fakeContact();
  const env = { DB, VENDOR_FILES: fakeKV(), CONTACT, DATA_PASSWORD: "pw", VENDOR_PORTAL_SESSION_SECRET: "test-secret-0123456789-0123456789-0123456789", ...extra };
  DB.raw.exec(`
    CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'member', pw_salt TEXT NOT NULL, pw_hash TEXT NOT NULL, agent_slug TEXT, phone TEXT,
      must_change_password INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL DEFAULT (datetime('now')));
    CREATE TABLE app_settings (key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE inspections (id TEXT PRIMARY KEY, property_id TEXT);
    CREATE TABLE inspection_photos (id TEXT PRIMARY KEY, inspection_id TEXT, r2_key TEXT, thumb_key TEXT, content_type TEXT, seq INTEGER, created_at TEXT DEFAULT (datetime('now')));
  `);
  await ensureVendorTables(env); await ensureQuoteTables(env); await workEnsure(env); await vappEnsure(env);
  const hash = await pbkdf2Hex(PASSWORD, SALT);
  const temp = await pbkdf2Hex(TEMP, SALT);
  const u = DB.raw.prepare("INSERT INTO users (email, name, role, pw_salt, pw_hash, phone, must_change_password) VALUES (?, ?, ?, ?, ?, ?, ?)");
  u.run("john@expertpm.com", "John Owner", "super_admin", SALT, hash, "5705550001", 0);      // 1
  u.run("office@expertpm.com", "Olive Office", "admin", SALT, hash, "5705550002", 0);        // 2
  u.run("maint@expertpm.com", "Max Maint", "property_manager", SALT, hash, null, 0);         // 3
  u.run("felicia@expertpm.com", "Felicia", "admin", SALT, hash, "5705550004", 0);            // 4
  u.run("destiny@expertpm.com", "Destiny", "admin", SALT, hash, "5705550005", 0);            // 5
  const a = DB.raw.prepare("INSERT INTO vendor_accounts (dl_vendor_id, name, email, phone, pw_salt, pw_hash, must_change_password, active, crm_user_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)");
  a.run("dl-v1", "Vic Vendor", "vic@mow.com", "5705551111", SALT, hash, 0, 1, null);         // 1
  a.run("dl-v2", "Wanda Wash", "wanda@clean.com", "5705552222", SALT, hash, 0, 1, null);     // 2
  a.run("dl-v3", "Nate New", "nate@new.com", "5705553333", SALT, temp, 1, 1, null);          // 3
  a.run("dl-v4", "Olden Gone", "old@gone.com", "5705554444", SALT, hash, 0, 0, null);        // 4
  a.run("dl-v5", "Max Handy", "maxhandy@x.com", "5705555555", SALT, temp, 1, 1, 3);          // 5, linked to staff user 3
  DB.log.length = 0;
  return env;
}

export function req(path, { method = "GET", body, cookie, headers = {} } = {}) {
  const h = { ...headers };
  let b;
  if (body instanceof FormData || body instanceof URLSearchParams) b = body;
  else if (body) { h["Content-Type"] = "application/json"; b = JSON.stringify(body); }
  if (cookie) h["Cookie"] = cookie;
  return new Request("https://vendor-epm.example.workers.dev" + path, { method, headers: h, body: b, redirect: "manual" });
}

export function cookieFrom(res) {
  const sc = res.headers.get("Set-Cookie") || "";
  return sc.split(";")[0];
}

export async function call(env, path, opts) {
  const res = await handle(req(path, opts), env);
  const type = res.headers.get("Content-Type") || "";
  const body = type.includes("json") ? await res.json() : type.startsWith("text/") ? await res.text() : new Uint8Array(await res.arrayBuffer());
  return { status: res.status, headers: res.headers, body };
}

/* A signed-in caller: as(env, email)(path, body?, method?) */
export async function as(env, email, password = PASSWORD) {
  const login = await handle(req("/api/vendor/login", { method: "POST", body: { email, password } }), env);
  if (login.status !== 200) throw new Error("login failed for " + email + ": " + login.status);
  const cookie = cookieFrom(login);
  const fn = (path, body, method) => call(env, path, { method: method || (body ? "POST" : "GET"), body, cookie });
  fn.cookie = cookie;
  return fn;
}

/* Every SQL statement that changed something, as "VERB table". */
export function writes(env) {
  return env.DB.log.map((s) => s.trim()).filter((s) => !/^SELECT\b/i.test(s))
    .map((s) => { const m = s.match(/^(INSERT(?:\s+OR\s+\w+)?\s+INTO|UPDATE|DELETE\s+FROM|CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS|ALTER\s+TABLE)\s+(\w+)/i); return m ? m[1].split(/\s+/)[0].toUpperCase() + " " + m[2] : s.slice(0, 40); });
}

/* Page checks shared by every page test. */
export function assertScriptsParse(name, page) {
  const re = /<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g;
  let m, n = 0;
  while ((m = re.exec(page))) { n++; assert.doesNotThrow(() => new Function(m[1]), name + " script " + n); }
  assert.ok(n > 0, "no inline scripts found in " + name);
}
export function assertHouseStyle(name, page) {
  assert.ok(!page.includes("—") && !page.includes("&mdash;"), name + " has an em dash");
  assert.match(page, /<meta name="robots" content="noindex, nofollow">/, name + " is not noindex");
}

