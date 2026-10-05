/**
 * ExpertPM Vendor Portal - Cloudflare Worker
 * ------------------------------------------
 * The vendor-facing side of the CRM (expertpm-crm), split out on its own:
 * vendor sign-in, the /work/<token> job pages texted to vendors, quote
 * requests, bills, and the public vendor application. It shares the CRM's D1
 * database, vendor accounts and file storage, has its own sessions, and runs
 * no cron jobs. The office side of vendor management lives in service-epm.
 * See README.md.
 */

import { json, html, redirect, notFound } from "./http.js";
import { apiLogin, apiFirstPassword, currentVendor, sessionCookie } from "./auth.js";
import { LOGIN_HTML, APP_HTML, PREVIEW_LOGIN_NOTE } from "./pages.js";
import { apiVendorWorkList, workPage, workRespond, workInspPhoto, TOKEN_RE } from "./work.js";
import { workEnsure } from "./db.js";

/* The app's tabs, in order. A tab appears once its screen is ported. */
const TABS = [
  { key: "jobs", label: "Jobs" },
  { key: "help", label: "Help" },
];

/* Until launch, every page says "preview". Set PREVIEW to "0" on launch day. */
export function isPreview(env) { return String(env.PREVIEW ?? "1") !== "0"; }

function loginPage(env) {
  return LOGIN_HTML.replace("<!--PREVIEW-->", isPreview(env) ? PREVIEW_LOGIN_NOTE : "");
}

/* Tab badges: how many things are waiting on this vendor. */
async function waitingCounts(env, v) {
  await workEnsure(env);
  const w = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM work_orders WHERE status = 'sent' AND (vendor_account_id = ?1 OR (vendor_phone IS NOT NULL AND vendor_phone != '' AND vendor_phone = ?2))"
  ).bind(v.id, v.phone || "").first();
  return { jobs: (w && w.n) || 0 };
}

export async function handle(req, env, ctx) {
  const url = new URL(req.url);
  const p = url.pathname;

  if (p === "/api/health" && req.method === "GET") {
    let dbOk = false;
    try { if (env.DB) { await env.DB.prepare("SELECT 1 FROM vendor_accounts LIMIT 1").first(); dbOk = true; } }
    catch (e) { dbOk = "error: " + e.message; }
    return json({ app: "vendor-epm", dbBound: !!env.DB, dbOk, sessionSecret: !!env.VENDOR_PORTAL_SESSION_SECRET, preview: isPreview(env), sideEffects: String(env.SIDE_EFFECTS ?? "0") === "1" });
  }
  if (p === "/robots.txt") return new Response("User-agent: *\nDisallow: /\n", { headers: { "Content-Type": "text/plain" } });

  if (!env.DB) return json({ error: "Database not bound (DB)" }, 500);

  // ---- job pages texted to vendors: no sign-in, the token is the key ----
  let m;
  if ((m = p.match(new RegExp("^/work/(" + TOKEN_RE + ")/photo/([A-Za-z0-9._-]+)$"))) && req.method === "GET") return workInspPhoto(m[1], m[2], url, env);
  if ((m = p.match(new RegExp("^/work/(" + TOKEN_RE + ")$")))) {
    if (req.method === "GET") return workPage(m[1], env);
    if (req.method === "POST") return workRespond(m[1], req, env);
  }

  // ---- the portal (the CRM serves it at /vendor and /vendor/app) ----
  if ((p === "/" || p === "/vendor" || p === "/vendor/") && req.method === "GET") {
    return (await currentVendor(req, env)) ? redirect("/app") : html(loginPage(env));
  }
  if ((p === "/app" || p === "/vendor/app") && req.method === "GET") {
    return (await currentVendor(req, env)) ? html(APP_HTML) : redirect("/");
  }
  if (p === "/api/vendor/login" && req.method === "POST") return apiLogin(req, env);
  if (p === "/api/vendor/logout" && req.method === "POST") return json({ ok: true }, 200, { "Set-Cookie": sessionCookie("gone", 0) });

  if (p.startsWith("/api/vendor/")) {
    const v = await currentVendor(req, env);
    if (!v) return json({ error: "unauthorized" }, 401);
    if (p === "/api/vendor/me" && req.method === "GET") {
      return json({ vendor: { name: v.name, email: v.email }, mustChange: !!v.must_change_password, via: v.via, tabs: TABS, counts: await waitingCounts(env, v), preview: isPreview(env) });
    }
    if (p === "/api/vendor/work" && req.method === "GET") return apiVendorWorkList(env, v);
    if (p === "/api/vendor/password/first" && req.method === "POST") return apiFirstPassword(req, env, v);
    return json({ error: "not found" }, 404);
  }

  return notFound("Page not found.");
}

export default {
  async fetch(req, env, ctx) {
    try { return await handle(req, env, ctx); }
    catch (e) {
      console.log("unhandled:", e && e.stack || e);
      return json({ error: "Something went wrong" }, 500);
    }
  },
  // No scheduled() handler: every vendor-related cron still runs on the CRM.
};
