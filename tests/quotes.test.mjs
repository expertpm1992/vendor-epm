// Quote requests, vendor side: list, price, can't-service, revise, photos.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seededEnv, call, as, writes } from "./helpers.mjs";

async function setup(extra = {}) {
  const env = await seededEnv(extra);
  env.DB.raw.exec(`
    INSERT INTO quote_requests (id, service, price_basis, notes, due_date, status, created_by) VALUES
      (1, 'Snow removal', 'per visit', 'Lots and walks', '2026-11-01', 'sent', 1),
      (2, 'Mowing', 'per month', NULL, NULL, 'sent', 1),
      (3, 'Gutters', 'flat', NULL, NULL, 'closed', 1);
    INSERT INTO quote_request_vendors (request_id, vendor_id) VALUES (1, 1), (2, 2), (3, 1);
    INSERT INTO quote_request_lines (id, request_id, dl_property_id, property_name, note, photo_keys) VALUES
      (1, 1, 'p1', 'A House', NULL, NULL),
      (2, 1, 'p2', 'B House', 'Long driveway', '["qr/1/2/111.jpg"]'),
      (3, 1, 'p3', 'C House', NULL, NULL),
      (4, 2, 'p4', 'Wanda Place', NULL, '["qr/2/4/222.jpg"]'),
      (5, 3, 'p5', 'Closed Place', NULL, NULL);`);
  await env.VENDOR_FILES.put("qr/1/2/111.jpg", new Uint8Array([7, 7]), { metadata: { type: "image/png" } });
  await env.VENDOR_FILES.put("qr/2/4/222.jpg", new Uint8Array([8]), { metadata: { type: "image/jpeg" } });
  env.DB.log.length = 0;
  const prices = () => env.DB.raw.prepare("SELECT vendor_id, line_id, price, cant_service, status, revise_note FROM quote_prices ORDER BY line_id").all().map((r) => ({ ...r }));
  const myStatus = (rid, vid) => env.DB.raw.prepare("SELECT status FROM quote_request_vendors WHERE request_id = ? AND vendor_id = ?").get(rid, vid).status;
  return { env, prices, myStatus, vic: await as(env, "vic@mow.com"), wanda: await as(env, "wanda@clean.com") };
}

test("each vendor sees only their own open requests, with their own prices", async () => {
  const { vic, wanda, env } = await setup();
  const q = (await vic("/api/vendor/quotes")).body.quotes;
  assert.deepEqual(q.map((x) => x.id), [1]); // not Wanda's, not the closed one
  assert.deepEqual(q[0].lines.map((l) => l.property_name), ["A House", "B House", "C House"]);
  assert.deepEqual(q[0].lines[1].photo_keys, ["qr/1/2/111.jpg"]);
  assert.deepEqual((await wanda("/api/vendor/quotes")).body.quotes.map((x) => x.id), [2]);
  // Wanda's price on her line never shows to Vic, even on a shared line id
  env.DB.raw.exec("INSERT INTO quote_prices (request_id, vendor_id, line_id, price) VALUES (1, 2, 1, 999)");
  assert.equal((await vic("/api/vendor/quotes")).body.quotes[0].lines[0].price, null);
  assert.deepEqual((await vic("/api/vendor/me")).body.counts.quotes, 1);
});

test("pricing: some lines priced, one can't-service, a blank skipped; another vendor's line ignored", async () => {
  const { env, vic, prices, myStatus } = await setup();
  const r = await vic("/api/vendor/quotes/submit", { request_id: 1, prices: [
    { line_id: 1, price: 100.555 }, { line_id: 2, cant_service: true }, { line_id: 3, price: 0 }, { line_id: 4, price: 5 },
  ] });
  assert.deepEqual(r.body, { ok: true, remaining: 1 });
  assert.deepEqual(prices(), [
    { vendor_id: 1, line_id: 1, price: 100.56, cant_service: 0, status: "submitted", revise_note: null },
    { vendor_id: 1, line_id: 2, price: null, cant_service: 1, status: "submitted", revise_note: null },
  ]);
  assert.equal(myStatus(1, 1), "sent"); // still a line to go
  assert.equal(env.DB.raw.prepare("SELECT status FROM quote_requests WHERE id = 1").get().status, "submitted");
  // the requester hears about it (held in preview)
  const h = env.DB.raw.prepare("SELECT to_addr, body FROM vendor_portal_held").all();
  assert.equal(h.length, 1);
  assert.equal(h[0].to_addr, "5705550001");
  assert.match(h[0].body, /^Quote back: Vic Vendor priced 2 of 3 properties on “Snow removal” - review it in the CRM Vendors tab\./);
  assert.equal(env.CONTACT.sent.length, 0);
  assert.deepEqual([...new Set(writes(env).filter((w) => !/vendor_accounts/.test(w)))].sort(),
    ["CREATE vendor_portal_held", "INSERT quote_prices", "INSERT vendor_portal_held", "UPDATE quote_request_vendors", "UPDATE quote_requests"]);
});

test("decided lines are locked; a revise request reopens just that line", async () => {
  const { env, vic, prices, myStatus } = await setup();
  await vic("/api/vendor/quotes/submit", { request_id: 1, prices: [{ line_id: 1, price: 100 }, { line_id: 2, price: 50 }, { line_id: 3, price: 60 }] });
  assert.equal(myStatus(1, 1), "submitted");
  // the office accepts line 1 and asks for a revision on line 2
  env.DB.raw.exec("UPDATE quote_prices SET status = 'accepted' WHERE line_id = 1; UPDATE quote_prices SET status = 'revise', revise_note = 'Too high', prior_price = price WHERE line_id = 2; UPDATE quote_request_vendors SET status = 'sent'");
  const lines = (await vic("/api/vendor/quotes")).body.quotes[0].lines;
  assert.deepEqual(lines.map((l) => l.price_status), ["accepted", "revise", "submitted"]);
  assert.equal(lines[1].revise_note, "Too high");
  assert.match((await vic("/api/vendor/quotes/submit", { request_id: 1, prices: [{ line_id: 1, price: 1 }, { line_id: 3, price: 1 }] })).body.error, /at least one property/);
  const r = await vic("/api/vendor/quotes/submit", { request_id: 1, prices: [{ line_id: 1, price: 1 }, { line_id: 2, price: 45 }] });
  assert.deepEqual(r.body, { ok: true, remaining: 0 });
  const p = prices();
  assert.deepEqual([p[0].price, p[0].status], [100, "accepted"]);
  assert.deepEqual([p[1].price, p[1].status, p[1].revise_note], [45, "submitted", null]);
  assert.equal(myStatus(1, 1), "submitted");
});

test("another vendor's request, a closed request, or no prices are refused", async () => {
  const { vic, wanda, prices } = await setup();
  assert.equal((await vic("/api/vendor/quotes/submit", { request_id: 2, prices: [{ line_id: 4, price: 5 }] })).status, 404);
  assert.equal((await wanda("/api/vendor/quotes/submit", { request_id: 1, prices: [{ line_id: 1, price: 5 }] })).status, 404);
  assert.match((await vic("/api/vendor/quotes/submit", { request_id: 3, prices: [{ line_id: 5, price: 5 }] })).body.error, /closed/);
  assert.equal((await vic("/api/vendor/quotes/submit", { request_id: 1, prices: [] })).status, 400);
  assert.equal((await vic("/api/vendor/quotes/submit", { request_id: 1, prices: "nope" })).status, 400);
  assert.deepEqual(prices(), []);
});

test("quote photos open only for the vendor the request was sent to", async () => {
  const { env, vic, wanda } = await setup();
  const ok = await vic("/api/vendor/qphoto?key=" + encodeURIComponent("qr/1/2/111.jpg"));
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Content-Type"), "image/png");
  assert.equal(ok.headers.get("X-Content-Type-Options"), "nosniff");
  assert.deepEqual([...ok.body], [7, 7]);
  assert.equal((await vic("/api/vendor/qphoto?key=" + encodeURIComponent("qr/2/4/222.jpg"))).status, 403);
  assert.equal((await wanda("/api/vendor/qphoto?key=" + encodeURIComponent("qr/1/2/111.jpg"))).status, 403);
  assert.equal((await vic("/api/vendor/qphoto?key=" + encodeURIComponent("vb/2/secret.pdf"))).status, 400);
  assert.equal((await vic("/api/vendor/qphoto?key=" + encodeURIComponent("qr/1/2/../../vb/x"))).status, 400);
  assert.equal((await call(env, "/api/vendor/qphoto?key=" + encodeURIComponent("qr/1/2/111.jpg"))).status, 401);
});
