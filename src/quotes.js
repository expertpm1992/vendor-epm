/* Quote requests, vendor side. Ported from expertpm-crm/worker.js
   (apiVendorQuotesList, apiVendorQuotesSubmit, quotePhotoGet).

   The office asks a vendor to price a service across a list of properties
   (service-epm, and the CRM until launch). The vendor prices each line (or
   marks it can't-service) here; the office accepts, rejects or asks for a
   revision per line. Lines the office has decided are locked.

   Shared-table writes made here (exactly the CRM's vendor-side writes):
   - quote_prices: upsert of this vendor's price per open line
   - quote_request_vendors: this vendor's status + submitted_at
   - quote_requests: status 'sent' -> 'submitted' on first prices back */

import { json, fileResponse } from "./http.js";
import { ensureQuoteTables } from "./db.js";
import { sendText } from "./outbound.js";

export async function apiVendorQuotesList(env, v) {
  await ensureQuoteTables(env);
  const reqs = (await env.DB.prepare(
    "SELECT q.*, rv.status AS my_status, rv.submitted_at FROM quote_requests q JOIN quote_request_vendors rv ON rv.request_id = q.id WHERE rv.vendor_id = ?1 AND q.status != 'closed' ORDER BY q.id DESC LIMIT 50"
  ).bind(v.id).all()).results || [];
  const out = [];
  for (const q of reqs) {
    const lines = ((await env.DB.prepare(
      "SELECT l.id, l.property_name, l.note, l.photo_keys, p.price, p.cant_service, p.status AS price_status, p.revise_note FROM quote_request_lines l LEFT JOIN quote_prices p ON p.line_id = l.id AND p.vendor_id = ?2 WHERE l.request_id = ?1 ORDER BY l.property_name"
    ).bind(q.id, v.id).all()).results || []).map((l) => ({ ...l, photo_keys: parseKeys(l.photo_keys) }));
    out.push({ id: q.id, service: q.service, price_basis: q.price_basis, notes: q.notes, due_date: q.due_date, my_status: q.my_status, submitted_at: q.submitted_at, lines });
  }
  return json({ quotes: out });
}

function parseKeys(s) { try { const a = JSON.parse(s || "[]"); return Array.isArray(a) ? a : []; } catch (e) { return []; } }

/* Requests still waiting on this vendor (tab badge). */
export async function openQuoteCount(env, v) {
  await ensureQuoteTables(env);
  const r = await env.DB.prepare(
    "SELECT COUNT(*) AS n FROM quote_requests q JOIN quote_request_vendors rv ON rv.request_id = q.id WHERE rv.vendor_id = ?1 AND rv.status = 'sent' AND q.status != 'closed'"
  ).bind(v.id).first();
  return (r && r.n) || 0;
}

export async function apiVendorQuotesSubmit(req, env, v) {
  await ensureQuoteTables(env);
  const b = await req.json().catch(() => ({}));
  const reqId = Number(b.request_id);
  const prices = Array.isArray(b.prices) ? b.prices : [];
  const mine = await env.DB.prepare("SELECT * FROM quote_request_vendors WHERE request_id = ?1 AND vendor_id = ?2").bind(reqId, v.id).first();
  if (!mine) return json({ error: "not found" }, 404);
  const q = await env.DB.prepare("SELECT * FROM quote_requests WHERE id = ?1 AND status != 'closed'").bind(reqId).first();
  if (!q) return json({ error: "This request was closed by ExpertPM" }, 400);
  const lines = (await env.DB.prepare("SELECT l.id, p.status AS price_status FROM quote_request_lines l LEFT JOIN quote_prices p ON p.line_id = l.id AND p.vendor_id = ?2 WHERE l.request_id = ?1").bind(reqId, v.id).all()).results || [];
  const openIds = new Set(lines.filter((l) => !l.price_status || l.price_status === "revise").map((l) => l.id));
  const stmts = [];
  let filled = 0;
  for (const pr of prices) {
    const lineId = Number(pr && pr.line_id);
    if (!openIds.has(lineId)) continue; // decided lines (and other requests' lines) are locked
    const cant = pr.cant_service ? 1 : 0;
    const price = cant ? null : Math.round(Number(pr.price) * 100) / 100;
    if (!cant && !(isFinite(price) && price > 0)) continue; // untouched line
    filled++;
    stmts.push(env.DB.prepare(
      "INSERT INTO quote_prices (request_id, vendor_id, line_id, price, cant_service, status, revise_note, updated_at) VALUES (?1, ?2, ?3, ?4, ?5, 'submitted', NULL, datetime('now')) ON CONFLICT(vendor_id, line_id) DO UPDATE SET price = ?4, cant_service = ?5, status = 'submitted', revise_note = NULL, updated_at = datetime('now')"
    ).bind(reqId, v.id, lineId, price, cant));
  }
  if (!filled) return json({ error: "Add a price (or mark can't-service) on at least one property" }, 400);
  const allDone = filled >= openIds.size;
  stmts.push(env.DB.prepare("UPDATE quote_request_vendors SET status = ?1, submitted_at = datetime('now') WHERE request_id = ?2 AND vendor_id = ?3").bind(allDone ? "submitted" : "sent", reqId, v.id));
  stmts.push(env.DB.prepare("UPDATE quote_requests SET status = 'submitted' WHERE id = ?1 AND status = 'sent'").bind(reqId));
  await env.DB.batch(stmts);
  // heads-up to whoever sent the request
  const creator = await env.DB.prepare("SELECT phone FROM users WHERE id = ?1").bind(q.created_by || 0).first();
  if (creator && creator.phone) {
    await sendText(env, creator.phone, "Quote back: " + v.name + " priced " + filled + " of " + lines.length + " properties on “" + q.service + "” - review it in the CRM Vendors tab.", "quotes:submit");
  }
  return json({ ok: true, remaining: openIds.size - filled });
}

/* A quote photo, only on requests assigned to this vendor. */
export async function quotePhotoGet(env, key, vendorId) {
  const m = String(key).match(/^qr\/(\d+)\/\d+\/[\w.-]+$/);
  if (!m) return json({ error: "bad key" }, 400);
  await ensureQuoteTables(env);
  const row = await env.DB.prepare("SELECT id FROM quote_request_vendors WHERE request_id = ?1 AND vendor_id = ?2").bind(Number(m[1]), vendorId).first();
  if (!row) return json({ error: "forbidden" }, 403);
  if (!env.VENDOR_FILES) return json({ error: "file storage not configured" }, 500);
  const got = await env.VENDOR_FILES.getWithMetadata(key, "arrayBuffer");
  if (!got || !got.value) return json({ error: "photo missing" }, 404);
  return fileResponse(got.value, (got.metadata || {}).type || "image/jpeg");
}
