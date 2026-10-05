// Vendor bills: submit with a file, see status, files only for their owner.
import { test, beforeEach, afterEach } from "node:test";
import assert from "node:assert/strict";
import { seededEnv, call, as, writes } from "./helpers.mjs";
import { resetPropertyCache } from "../src/dl.js";

const realFetch = globalThis.fetch;
let dlCalls = [];
beforeEach(() => {
  resetPropertyCache(); dlCalls = [];
  globalThis.fetch = async (url, init) => {
    dlCalls.push({ url: String(url), method: (init && init.method) || "GET" });
    if (String(url).startsWith("https://app.doorloop.com/api/properties")) return new Response(JSON.stringify({ data: [{ id: "p2", name: "Zeta Apts" }, { id: "p1", name: "Alpha House" }] }));
    throw new Error("unexpected fetch " + url);
  };
});
afterEach(() => { globalThis.fetch = realFetch; });

const bill = (fields, file) => {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  if (file) fd.append("file", file);
  return fd;
};
const pdf = (n = 10, name = "inv 81.pdf", type = "application/pdf") => new File([new Uint8Array(n).fill(37)], name, { type });

test("the property list comes from DoorLoop (read only), and is empty without a key", async () => {
  let env = await seededEnv({ DOORLOOP_API_KEY: "k" });
  const vic = await as(env, "vic@mow.com");
  assert.deepEqual((await vic("/api/vendor/properties")).body.properties, [{ id: "p1", name: "Alpha House" }, { id: "p2", name: "Zeta Apts" }]);
  assert.ok(dlCalls.every((c) => c.method === "GET"));
  resetPropertyCache();
  env = await seededEnv();
  assert.deepEqual((await (await as(env, "vic@mow.com"))("/api/vendor/properties")).body.properties, []);
});

test("submitting a bill: validations, then saved for the signed-in vendor with the file in KV", async () => {
  const env = await seededEnv({ DOORLOOP_API_KEY: "k" });
  const vic = await as(env, "vic@mow.com");
  assert.match((await vic("/api/vendor/bills", bill({ amount: "0", invoice_no: "1" }))).body.error, /amount/);
  assert.match((await vic("/api/vendor/bills", bill({ amount: "45" }))).body.error, /invoice number or a short description/);
  assert.match((await vic("/api/vendor/bills", bill({ amount: "45", invoice_no: "1", property: "nope" }))).body.error, /Pick a property/);
  assert.match((await vic("/api/vendor/bills", bill({ amount: "45", invoice_no: "1" }, pdf(10, "x.html", "text/html")))).body.error, /PDF or photo/);
  assert.match((await vic("/api/vendor/bills", bill({ amount: "45", invoice_no: "1" }, pdf(8 * 1024 * 1024 + 1)))).body.error, /over 8 MB/);
  assert.equal(env.VENDOR_FILES.map.size, 0);

  // a vendor_id in the form is ignored: the bill is always the signed-in vendor's
  const r = await vic("/api/vendor/bills", bill({ amount: "450.555", invoice_no: " 2026-081 ", work_date: "2026-09-30", property: "p2", description: "July mowing", vendor_id: "2" }, pdf(12)));
  assert.equal(r.body.ok, true);
  const row = env.DB.raw.prepare("SELECT * FROM vendor_bills WHERE id = ?").get(r.body.id);
  assert.deepEqual([row.vendor_id, row.invoice_no, row.amount, row.work_date, row.property, row.property_name, row.description, row.status, row.file_name, row.file_type],
    [1, "2026-081", 450.56, "2026-09-30", "p2", "Zeta Apts", "July mowing", "submitted", "inv 81.pdf", "application/pdf"]);
  assert.match(row.file_key, /^vb\/1\/\d+-inv_81\.pdf$/);
  const stored = env.VENDOR_FILES.map.get(row.file_key);
  assert.equal(stored.value.byteLength, 12);
  assert.deepEqual(stored.metadata, { type: "application/pdf", name: "inv 81.pdf" });
  // a bad work date is dropped, a bill without a file is fine
  const r2 = await vic("/api/vendor/bills", bill({ amount: "20", description: "Trip fee", work_date: "Sept 3" }));
  assert.equal(env.DB.raw.prepare("SELECT work_date, file_key FROM vendor_bills WHERE id = ?").get(r2.body.id).work_date, null);
  assert.deepEqual([...new Set(writes(env).filter((w) => !/vendor_accounts/.test(w)))], ["INSERT vendor_bills"]);
  assert.ok(dlCalls.every((c) => c.method === "GET"));
  assert.equal(env.CONTACT.sent.length, 0);
});

test("each vendor sees only their own bills, with the office's status and reason", async () => {
  const env = await seededEnv();
  const vic = await as(env, "vic@mow.com"), wanda = await as(env, "wanda@clean.com");
  await vic("/api/vendor/bills", bill({ amount: "100", invoice_no: "V1" }, pdf()));
  await wanda("/api/vendor/bills", bill({ amount: "200", invoice_no: "W1" }, pdf()));
  env.DB.raw.exec("UPDATE vendor_bills SET status = 'rejected', reject_reason = 'Wrong property' WHERE invoice_no = 'V1'");
  // an office-entered bill (vendor_id 0) never shows to a vendor
  env.DB.raw.exec("INSERT INTO vendor_bills (vendor_id, invoice_no, amount, adm_dl_vendor_name) VALUES (0, 'OFFICE', 5, 'Someone')");
  const vb = (await vic("/api/vendor/bills")).body.bills;
  assert.deepEqual(vb.map((b) => [b.invoice_no, b.status, b.reject_reason]), [["V1", "rejected", "Wrong property"]]);
  assert.equal(vb[0].file_key, undefined); // storage keys never leave the server
  assert.deepEqual((await wanda("/api/vendor/bills")).body.bills.map((b) => b.invoice_no), ["W1"]);
});

test("invoice files open only for the vendor who submitted them", async () => {
  const env = await seededEnv();
  const vic = await as(env, "vic@mow.com"), wanda = await as(env, "wanda@clean.com");
  const id = (await vic("/api/vendor/bills", bill({ amount: "100", invoice_no: "V1" }, pdf(5, 'my "inv".pdf')))).body.id;
  const noFile = (await vic("/api/vendor/bills", bill({ amount: "100", invoice_no: "V2" }))).body.id;
  const ok = await vic("/api/vendor/file/" + id);
  assert.equal(ok.status, 200);
  assert.equal(ok.headers.get("Content-Type"), "application/pdf");
  assert.equal(ok.headers.get("Content-Disposition"), 'inline; filename="my inv.pdf"');
  assert.equal(ok.headers.get("X-Content-Type-Options"), "nosniff");
  assert.equal(ok.body.length, 5);
  assert.equal((await wanda("/api/vendor/file/" + id)).status, 403);
  assert.equal((await vic("/api/vendor/file/" + noFile)).status, 404);
  assert.equal((await vic("/api/vendor/file/99999")).status, 404);
  assert.equal((await call(env, "/api/vendor/file/" + id)).status, 401);
});

test("a staff login wearing the vendor hat files bills as that vendor account", async () => {
  const env = await seededEnv();
  const max = await as(env, "maint@expertpm.com");
  const id = (await max("/api/vendor/bills", bill({ amount: "75", invoice_no: "M1" }))).body.id;
  assert.equal(env.DB.raw.prepare("SELECT vendor_id FROM vendor_bills WHERE id = ?").get(id).vendor_id, 5);
  assert.deepEqual((await max("/api/vendor/bills")).body.bills.map((b) => b.invoice_no), ["M1"]);
});
