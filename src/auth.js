/* Sign-in for the vendor portal.

   Accounts and passwords are the CRM's own: vendors sign in against the
   shared D1 `vendor_accounts` table (PBKDF2-SHA256, 100k iterations, hex salt
   + hash, exactly as the CRM writes them), so every vendor keeps the password
   they already use at crm.expertpm.com/vendor. Vendors never use login-epm
   (that's for staff).

   Sessions are this app's own. The cookie is `vendor_portal_sess`, signed
   with VENDOR_PORTAL_SESSION_SECRET (never the CRM's SESSION_SECRET), and the
   payload carries aud:"vendor" and `vid` (not the CRM's `uid`), so:
   - a CRM vendor_sess token is rejected here (other key, no aud, no vid);
   - a token from here is rejected by the CRM even if the secrets ever
     matched by mistake (the CRM requires `uid`).

   A staff member linked to a vendor account (vendor_accounts.crm_user_id,
   the CRM's "My Vendor Billing") may also sign in with their CRM email and
   password; they get that one vendor account's portal and nothing else. The
   link is re-checked on every request, so unlinking in the office locks
   them out right away. This app only READS users. */

import { json, getCookie, bufToHex } from "./http.js";
import { ensureVendorTables } from "./db.js";

export const COOKIE = "vendor_portal_sess";
export const AUD = "vendor";
export const TEMP_PASSWORD = "#ExpertPM#"; // the CRM's temporary password for new vendor accounts
const PBKDF2_ITERS = 100000;
const SESSION_DAYS = 30; // the CRM's vendor session length

const enc = new TextEncoder();

function hexToBuf(hex) {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) out[i] = parseInt(hex.substr(i * 2, 2), 16);
  return out;
}
function b64url(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(str) {
  str = str.replace(/-/g, "+").replace(/_/g, "/");
  while (str.length % 4) str += "=";
  return Uint8Array.from(atob(str), (c) => c.charCodeAt(0));
}

export async function pbkdf2Hex(password, saltHex) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: hexToBuf(saltHex), iterations: PBKDF2_ITERS },
    key, 256
  );
  return bufToHex(bits);
}

function timingSafeEqual(a, b) {
  a = String(a || ""); b = String(b || "");
  if (a.length !== b.length) return false;
  let out = 0;
  for (let i = 0; i < a.length; i++) out |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return out === 0;
}

async function passwordOk(row, password) {
  if (!row || !row.pw_salt || !row.pw_hash) return false;
  return timingSafeEqual(await pbkdf2Hex(password, row.pw_salt), row.pw_hash);
}

async function hmacKey(env) {
  return crypto.subtle.importKey("raw", enc.encode(env.VENDOR_PORTAL_SESSION_SECRET), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

export async function signSession(env, payloadObj) {
  const payload = b64url(enc.encode(JSON.stringify({ ...payloadObj, aud: AUD })));
  const sig = b64url(await crypto.subtle.sign("HMAC", await hmacKey(env), enc.encode(payload)));
  return payload + "." + sig;
}

export async function verifySession(env, token) {
  if (!env.VENDOR_PORTAL_SESSION_SECRET || !token || !token.includes(".")) return null;
  const [payload, sig] = token.split(".");
  try {
    const ok = await crypto.subtle.verify("HMAC", await hmacKey(env), b64urlDecode(sig), enc.encode(payload));
    if (!ok) return null;
    const data = JSON.parse(new TextDecoder().decode(b64urlDecode(payload)));
    if (data.aud !== AUD || !data.vid || !data.exp || Date.now() > data.exp) return null;
    return data;
  } catch { return null; }
}

export function sessionCookie(token, maxAgeSec) {
  return `${COOKIE}=${token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAgeSec}`;
}

/* The signed-in vendor account, or null. Inactive accounts are out at once
   (the CRM's currentVendor). `via` is "vendor" or "staff". */
export async function currentVendor(req, env) {
  const sess = await verifySession(env, getCookie(req, COOKIE));
  if (!sess) return null;
  let v;
  try {
    v = await env.DB.prepare(
      "SELECT id, dl_vendor_id, name, email, phone, active, must_change_password, crm_user_id FROM vendor_accounts WHERE id = ?1"
    ).bind(Number(sess.vid)).first();
  } catch (e) { return null; } // table not created yet
  if (!v || !v.active) return null;
  if (sess.staff) {
    // a staff login wearing the vendor hat: the link must still stand
    if (Number(v.crm_user_id) !== Number(sess.staff)) return null;
    const u = await env.DB.prepare("SELECT id FROM users WHERE id = ?1").bind(Number(sess.staff)).first();
    if (!u) return null;
    return { ...v, via: "staff", staffUserId: u.id, must_change_password: 0 };
  }
  return { ...v, via: "vendor" };
}

/* Best-effort, per-isolate, same thresholds and key as the CRM's vendor
   login: 5 misses locks an email out for 10 minutes. */
const loginFails = new Map();
function tooManyFails(key) {
  const rec = loginFails.get(key);
  return rec && rec.count >= 5 && Date.now() - rec.ts < 10 * 60 * 1000;
}
function recordFail(key) {
  const rec = loginFails.get(key) || { count: 0, ts: Date.now() };
  if (Date.now() - rec.ts > 10 * 60 * 1000) { rec.count = 0; rec.ts = Date.now(); }
  rec.count++;
  loginFails.set(key, rec);
}
export function resetLoginFails() { loginFails.clear(); }

export async function apiLogin(req, env) {
  if (!env.VENDOR_PORTAL_SESSION_SECRET) return json({ error: "Sign-in is not configured yet (VENDOR_PORTAL_SESSION_SECRET is missing)." }, 503);
  const body = await req.json().catch(() => ({}));
  const email = String(body.email || "").trim().toLowerCase();
  const password = String(body.password || "");
  if (!email || !password) return json({ error: "Email and password required" }, 400);
  const key = "vendor:" + email;
  if (tooManyFails(key)) return json({ error: "Too many attempts. Try again in a few minutes." }, 429);
  await ensureVendorTables(env);

  const v = await env.DB.prepare("SELECT * FROM vendor_accounts WHERE email = ?1").bind(email).first();
  if (v && v.active && (await passwordOk(v, password))) {
    loginFails.delete(key);
    await env.DB.prepare("UPDATE vendor_accounts SET last_login = datetime('now') WHERE id = ?1").bind(v.id).run();
    const token = await signSession(env, { vid: v.id, exp: Date.now() + SESSION_DAYS * 864e5 });
    return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, SESSION_DAYS * 86400) });
  }

  // a staff login linked to a vendor account (the CRM's My Vendor Billing)
  const u = await env.DB.prepare("SELECT id, pw_salt, pw_hash, must_change_password FROM users WHERE email = ?1").bind(email).first();
  if (u && (await passwordOk(u, password))) {
    const mv = await env.DB.prepare("SELECT id FROM vendor_accounts WHERE crm_user_id = ?1 AND active = 1").bind(u.id).first();
    if (mv) {
      loginFails.delete(key);
      if (u.must_change_password) return json({ error: "Please sign in to the CRM once to set your own password, then come back here." }, 403);
      const token = await signSession(env, { vid: mv.id, staff: u.id, exp: Date.now() + SESSION_DAYS * 864e5 });
      return json({ ok: true }, 200, { "Set-Cookie": sessionCookie(token, SESSION_DAYS * 86400) });
    }
  }
  recordFail(key);
  return json({ error: "Invalid email or password" }, 401);
}

/* The CRM's forced first-password change (apiVendorFirstPassword): only
   while the account is still on the temporary password. */
export async function apiFirstPassword(req, env, v) {
  if (v.via === "staff") return json({ error: "You signed in with your staff account. Its password is managed in the CRM." }, 403);
  const body = await req.json().catch(() => ({}));
  const next = String(body.next || "");
  if (next.length < 10) return json({ error: "New password must be at least 10 characters" }, 400);
  if (next === TEMP_PASSWORD) return json({ error: "Pick your own password, not the temporary one" }, 400);
  if (!v.must_change_password) return json({ error: "Your password is already set" }, 400);
  const salt = bufToHex(crypto.getRandomValues(new Uint8Array(16)));
  const hash = await pbkdf2Hex(next, salt);
  await env.DB.prepare("UPDATE vendor_accounts SET pw_salt = ?1, pw_hash = ?2, must_change_password = 0 WHERE id = ?3").bind(salt, hash, v.id).run();
  return json({ ok: true });
}
