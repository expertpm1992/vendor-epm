// Work orders, vendor side: the Jobs tab and the /work/<token> pages.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seededEnv, call, as, writes, assertScriptsParse, assertHouseStyle } from "./helpers.mjs";

const tok = (s) => s.repeat(48 / s.length);
const T = { A1: tok("a1"), A2: tok("a2"), A3: tok("a3"), A4: tok("a4"), A5: tok("a5"), B1: tok("b1"), B2: tok("b2") };

async function setup(extra = {}) {
  const env = await seededEnv(extra);
  const ins = env.DB.raw.prepare(`INSERT INTO work_orders (vendor_account_id, vendor_name, vendor_phone, service, recurring, frequency, bill_after, property, instructions, status, cost, token, created_by, inspection_id, earliest_start, target_date)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const id = {};
  const add = (k, ...a) => { id[k] = Number(ins.run(...a).lastInsertRowid); };
  add("A1", 1, "Vic Vendor", "5705551111", "Mowing", 1, "Weekly", 0, "12 Elm St", "Front and back", "sent", null, T.A1, 1, null, null, null);
  add("A2", 1, "Vic Vendor", "5705551111", "Mowing", 0, null, 0, "34 Oak Ave", null, "sent", null, T.A2, 1, null, null, "2026-10-20");
  add("A3", 1, "Vic Vendor", "5705551111", "Mowing", 1, "Weekly", 0, "56 Pine Rd", null, "active", 40, T.A3, 1, null, null, null);
  add("A4", 1, "Vic Vendor", "5705551111", "Cleaning", 0, null, 1, "78 Birch Ln", "Move-out clean", "sent", null, T.A4, 2, "insp1", "2026-10-10", "2026-10-20");
  add("A5", 1, "Vic Vendor", "5705551111", "Cleanout", 0, null, 0, "90 Maple Dr", null, "active", 300, T.A5, 1, null, null, null);
  add("B1", 2, "Wanda Wash", "5705552222", "Mowing", 1, "Weekly", 0, "99 Wanda Way", null, "sent", null, T.B1, 1, null, null, null);
  add("B2", 2, "Wanda Wash", "5705552222", "Mowing", 1, "Weekly", 0, "88 Wanda Ct", null, "active", 55, T.B2, 1, "insp2", null, null);
  env.DB.raw.exec(`INSERT INTO inspections VALUES ('insp1', 'p-birch'), ('insp2', 'p-wanda');
    INSERT INTO inspection_photos (id, inspection_id, r2_key, thumb_key, content_type, seq) VALUES
      ('ph1', 'insp1', 'insp/1/a.jpg', 'insp/1/a.webp', 'image/jpeg', 1), ('ph2', 'insp1', 'insp/1/b.jpg', NULL, 'image/png', 2), ('ph9', 'insp2', 'insp/2/z.jpg', NULL, 'image/jpeg', 1);`);
  await env.VENDOR_FILES.put("insp/1/a.jpg", new Uint8Array([1, 1]));
  await env.VENDOR_FILES.put("insp/1/a.webp", new Uint8Array([2]));
  await env.VENDOR_FILES.put("insp/1/b.jpg", new Uint8Array([3, 3, 3]));
  await env.VENDOR_FILES.put("insp/2/z.jpg", new Uint8Array([9]));
  env.DB.log.length = 0;
  const row = (k) => env.DB.raw.prepare("SELECT * FROM work_orders WHERE id = ?").get(id[k]);
  const events = (k) => env.DB.raw.prepare("SELECT actor, action, detail FROM work_order_events WHERE work_id = ? ORDER BY id").all(id[k]).map((e) => ({ ...e }));
  const held = () => env.DB.raw.prepare("SELECT to_addr, body, source FROM vendor_portal_held ORDER BY id").all().map((h) => ({ ...h }));
  const post = (token, fields) => { const fd = new FormData(); for (const [k, v] of Object.entries(fields)) fd.append(k, v); return call(env, "/work/" + token, { method: "POST", body: fd }); };
  return { env, id, row, events, held, post, get: (token) => call(env, "/work/" + token) };
}

test("the Jobs tab lists only the signed-in vendor's work, with a waiting count", async () => {
  const { env } = await setup();
  const vic = await as(env, "vic@mow.com");
  const rows = (await vic("/api/vendor/work")).body.rows;
  assert.deepEqual(rows.map((r) => r.property).sort(), ["12 Elm St", "34 Oak Ave", "56 Pine Rd", "78 Birch Ln", "90 Maple Dr"]);
  assert.equal(rows[0].status, "sent"); // waiting-on-you first
  assert.deepEqual((await vic("/api/vendor/me")).body.counts, { jobs: 3, quotes: 0 });
  const wanda = await as(env, "wanda@clean.com");
  assert.deepEqual((await wanda("/api/vendor/work")).body.rows.map((r) => r.property).sort(), ["88 Wanda Ct", "99 Wanda Way"]);
  assert.deepEqual(writes(env).filter((w) => !/vendor_accounts/.test(w)), []); // reads only (plus the login stamp)
});

test("orders that predate the account link still show by phone, as in the CRM", async () => {
  const { env } = await setup();
  env.DB.raw.exec("INSERT INTO work_orders (vendor_account_id, vendor_name, vendor_phone, service, property, status, token) VALUES (NULL, 'Vic', '5705551111', 'Gutters', 'Old Order St', 'completed', '" + tok("c1") + "')");
  const vic = await as(env, "vic@mow.com");
  assert.ok((await vic("/api/vendor/work")).body.rows.some((r) => r.property === "Old Order St"));
  const wanda = await as(env, "wanda@clean.com");
  assert.ok(!(await wanda("/api/vendor/work")).body.rows.some((r) => r.property === "Old Order St"));
});

test("a sent job with others pending opens the batch price sheet; the roster is only this vendor's", async () => {
  const { get } = await setup();
  const page = (await get(T.A1)).body;
  assert.match(page, /2 properties need your price, Vic/);
  assert.match(page, /name="cost_\d+"/);
  assert.match(page, /12 Elm St/); assert.match(page, /34 Oak Ave/);
  assert.doesNotMatch(page, /78 Birch Ln.*cost_/); // bill-after jobs never join the price sheet
  assert.doesNotMatch(page, /Wanda/);
  // the active roster shows on non-sent pages
  const p3 = (await get(T.A3)).body;
  assert.match(p3, /This one's yours/);
  assert.match(p3, /Your active ExpertPM work/);
  assert.match(p3, /56 Pine Rd/); assert.match(p3, /90 Maple Dr/);
  assert.doesNotMatch(p3, /88 Wanda Ct/);
  assert.match(p3, /Also waiting for your price/);
});

test("batch pricing quotes only this vendor's waiting orders; another vendor's order id is ignored", async () => {
  const { id, row, events, post } = await setup();
  const res = await post(T.A1, { action: "accept_batch", ["cost_" + id.A1]: "$45", ["cost_" + id.A2]: " ", ["cost_" + id.B1]: "99", note: "Can start Monday" });
  assert.equal(res.status, 302);
  assert.equal(res.headers.get("Location"), "/work/" + T.A1);
  assert.deepEqual([row("A1").status, row("A1").cost, row("A1").cost_note], ["quoted", 45, "Can start Monday"]);
  assert.equal(row("A2").status, "sent");
  assert.deepEqual([row("B1").status, row("B1").cost], ["sent", null]);
  assert.deepEqual(events("A1"), [{ actor: "Vic Vendor", action: "quoted", detail: "$45 - Can start Monday" }]);
  assert.deepEqual(events("B1"), []);
  // all blank: asked to go back
  const blank = await post(T.A2, { action: "accept_batch", ["cost_" + id.A2]: "" });
  assert.match(blank.body, /We need at least one price/);
});

test("single job: price required, then quoted; decline with a reason; mark a one-time job done", async () => {
  const { row, events, post, get } = await setup();
  assert.match((await post(T.A2, { action: "accept", cost: "" })).body, /We need a price first/);
  assert.match((await post(T.A2, { action: "accept", cost: "abc" })).body, /We need a price first/);
  await post(T.A2, { action: "accept", cost: "1,250", note: "includes haul-away" });
  assert.deepEqual([row("A2").status, row("A2").cost, row("A2").cost_note], ["quoted", 1250, "includes haul-away"]);
  assert.match((await get(T.A2)).body, /Quote sent\. Nice, Vic\./);
  // a quoted job can't be declined or re-priced from the link
  await post(T.A2, { action: "decline", reason: "nah" });
  assert.equal(row("A2").status, "quoted");

  await post(T.A1, { action: "decline", reason: "Too far out" });
  assert.deepEqual([row("A1").status, row("A1").decline_reason], ["declined", "Too far out"]);
  assert.deepEqual(events("A1").map((e) => e.action), ["declined"]);
  assert.match((await get(T.A1)).body, /You passed on this one/);

  await post(T.A3, { action: "done" }); // recurring: no mark-done
  assert.equal(row("A3").status, "active");
  await post(T.A5, { action: "done" });
  assert.equal(row("A5").status, "completed");
  assert.ok(row("A5").completed_at);
  assert.deepEqual(events("A5"), [{ actor: "Vic Vendor", action: "completed", detail: "marked done by vendor" }]);
});

test("bill-after job: accept with a finish date, push it back, then send the charge; office texts are held in preview", async () => {
  const { env, row, events, held, post, get } = await setup();
  let page = (await get(T.A4)).body;
  assert.match(page, /One-time cleaning job, Vic/);
  assert.match(page, /min="2026-10-10"/);
  assert.match(page, /2 photos of the job/);
  assert.match((await post(T.A4, { action: "accept_ba", promised: "" })).body, /Pick a finish date first/);
  assert.match((await post(T.A4, { action: "accept_ba", promised: "2026-10-05" })).body, /before the job can start/);
  await post(T.A4, { action: "accept_ba", promised: "2026-10-22" });
  assert.deepEqual([row("A4").status, row("A4").promised_by], ["active", "2026-10-22"]);
  // the order's creator (user 2) gets the heads-up, held instead of sent
  let h = held();
  assert.equal(h.length, 1);
  assert.equal(h[0].to_addr, "5705550002");
  assert.equal(h[0].source, "work:accept_ba");
  assert.match(h[0].body, /^Vic Vendor accepted the one-time cleaning at 78 Birch Ln - promised by 2026-10-22\. That's after the needed-by date of 2026-10-20\. They'll bill their charge when it's done\.\n\nDo not respond/);

  assert.match((await post(T.A4, { action: "delay_ba", reason: "", promised: "2026-10-25" })).body, /We need both/);
  await post(T.A4, { action: "delay_ba", reason: "Tenant still in", promised: "2026-10-25" });
  assert.deepEqual([row("A4").promised_by, row("A4").delay_reason, row("A4").chase_sent_at], ["2026-10-25", "Tenant still in", null]);
  assert.match(held()[1].body, /pushed the cleaning at 78 Birch Ln: “Tenant still in” - new finish date 2026-10-25\./);

  await post(T.A4, { action: "done_ba", cost: "350", note: "extra trash" });
  assert.deepEqual([row("A4").status, row("A4").cost, row("A4").cost_note], ["done_review", 350, "extra trash"]);
  // every admin with a phone hears about the charge
  h = held().slice(2);
  assert.deepEqual(h.map((x) => x.to_addr).sort(), ["5705550001", "5705550002", "5705550004", "5705550005"]);
  assert.match(h[0].body, /^Cleaning done at 78 Birch Ln - Vic Vendor billed \$350\. Review the charge under Vendors in the CRM\./);
  assert.match((await get(T.A4)).body, /Charge sent\. Nice work, Vic\./);
  assert.deepEqual(events("A4").map((e) => e.action), ["accepted", "delayed", "charge_submitted"]);
  // nothing actually went out
  assert.equal(env.CONTACT.sent.length, 0);
  // and the only shared tables touched are the work order tables
  assert.deepEqual([...new Set(writes(env))].sort(), ["CREATE vendor_portal_held", "INSERT vendor_portal_held", "INSERT work_order_events", "UPDATE work_orders"]);
});

test("with SIDE_EFFECTS=1 the same texts really go out through the contact Worker", async () => {
  const { env, post, held } = await setup({ SIDE_EFFECTS: "1" });
  await post(T.A4, { action: "accept_ba", promised: "2026-10-15" });
  assert.equal(env.CONTACT.sent.length, 1);
  assert.equal(env.CONTACT.sent[0].phone, "5705550002");
  assert.equal(env.CONTACT.sent[0].password, "pw");
  assert.match(env.CONTACT.sent[0].text, /Do not respond to this message as it's not monitored\. Text ExpertPM at 272\.203\.5550\.$/);
  assert.throws(() => held()); // no held table: nothing was held
});

test("job photos serve only through the token of the order they're attached to", async () => {
  const { env } = await setup();
  const full = await call(env, "/work/" + T.A4 + "/photo/ph1");
  assert.equal(full.status, 200);
  assert.equal(full.headers.get("Content-Type"), "image/jpeg");
  assert.deepEqual([...full.body], [1, 1]);
  const thumb = await call(env, "/work/" + T.A4 + "/photo/ph1?thumb=1");
  assert.deepEqual([thumb.headers.get("Content-Type"), [...thumb.body]], ["image/webp", [2]]);
  assert.equal((await call(env, "/work/" + T.A4 + "/photo/ph9")).status, 404); // another inspection's photo
  assert.equal((await call(env, "/work/" + T.B2 + "/photo/ph1")).status, 404); // Wanda's token, Vic's photo
  assert.equal((await call(env, "/work/" + T.A1 + "/photo/ph1")).status, 404); // no inspection attached
  assert.equal((await call(env, "/work/" + tok("ff") + "/photo/ph1")).status, 404);
});

test("unknown or malformed tokens get the inactive-link page, never someone's job", async () => {
  const { env, post } = await setup();
  const r = await call(env, "/work/" + tok("ee"));
  assert.equal(r.status, 404);
  assert.match(r.body, /This link isn't active/);
  assert.equal((await call(env, "/work/xyz")).status, 404);
  assert.equal((await post(tok("ee"), { action: "decline" })).status, 404);
});

test("every job page state renders clean: scripts parse, no em dashes, noindex", async () => {
  const { env, get } = await setup();
  const states = ["sent", "quoted", "active", "declined", "completed", "ended", "canceled", "done_review"];
  for (const st of states) {
    env.DB.raw.prepare("UPDATE work_orders SET status = ?, cost = 120 WHERE token = ?").run(st, T.A4);
    const page = (await get(T.A4)).body;
    assertHouseStyle("work " + st, page);
    assertScriptsParse("work " + st, page); // the photo viewer
  }
  env.DB.raw.prepare("UPDATE work_orders SET status = 'active' WHERE token = ?").run(T.A4);
  assert.match((await get(T.A4)).body, /Need more time\?/);
  assert.match((await get(T.A1)).body, /Preview copy of this page/);
  env.PREVIEW = "0";
  assert.doesNotMatch((await get(T.A1)).body, /Preview copy/);
});
