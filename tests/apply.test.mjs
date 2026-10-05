// The public vendors page and the application form.
import { test } from "node:test";
import assert from "node:assert/strict";
import { seededEnv, call, writes, assertScriptsParse, assertHouseStyle } from "./helpers.mjs";
import { vappParsePrices, calPhone } from "../src/apply.js";

function form(over = {}, files = {}) {
  const base = {
    business_name: "Green Cuts LLC", contact_name: "Gina Green", phone: "(570) 555-7777", email: "Gina@GreenCuts.com",
    trades: ["Lawn mowing", "Bogus trade"], towns: ["Bloomsburg", "Danville", "Atlantis"],
    price__lawn_mowing__qtr: "$45", price__lawn_mowing__one: "", scope: "Mowing and trimming, weekly routes.", years: "6",
    crew: "2-3", emergency: "Sometimes", gl: "1", consent: "1", coi_expires: "2027-05-01", wc: "Yes", elapsed: "60000", ...over,
  };
  const fd = new FormData();
  for (const [k, v] of Object.entries(base)) for (const x of [].concat(v)) if (x !== undefined) fd.append(k, x);
  const coi = "coi" in files ? files.coi : new File([new Uint8Array(20)], "COI.pdf", { type: "application/pdf" });
  if (coi) fd.append("coi", coi);
  if (files.ratecard) fd.append("ratecard", files.ratecard);
  return fd;
}
const apply = (env, fd, ip = "203.0.113.9") => call(env, "/vendors/apply", { method: "POST", body: fd, headers: { "CF-Connecting-IP": ip } });

test("the vendors page renders with its price grid, clean scripts, no em dashes, noindex in preview", async () => {
  const env = await seededEnv();
  const r = await call(env, "/vendors/");
  assert.equal(r.status, 200);
  const page = r.body;
  assert.match(page, /id="vnPricesF"/);
  assert.doesNotMatch(page, /<!--VN_PRICES-->/);
  assert.match(page, /name="price__snow_removal__lot_s"/);
  assert.match(page, /fetch\('\/vendors\/apply'/);
  assert.match(page, /src="https:\/\/expertpm\.com\/blog-img\//);
  assert.doesNotMatch(page, /src="\/blog-img\//);
  assert.match(page, /Vendor sign in/);
  assertScriptsParse("vendors", page);
  assertHouseStyle("vendors", page);
  const ld = JSON.parse(page.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.ok(ld["@graph"].some((g) => g["@type"] === "FAQPage" && g.mainEntity.length >= 2));
  assert.equal((await call(env, "/vendors")).status, 200);
  const other = await call(env, "/vendors/whatever");
  assert.equal(other.status, 302);
  assert.equal(other.headers.get("Location"), "/vendors/");
});

test("bots get a quiet ok and nothing is saved", async () => {
  const env = await seededEnv();
  assert.deepEqual((await apply(env, form({ company_site: "spam.biz" }))).body, { ok: true });
  assert.deepEqual((await apply(env, form({ elapsed: "900" }))).body, { ok: true });
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM vendor_applications").get().n, 0);
  assert.equal(env.VENDOR_FILES.map.size, 0);
});

test("validation matches the CRM's, field by field", async () => {
  const env = await seededEnv();
  const err = async (over, files) => (await apply(env, form(over, files))).body.error;
  assert.match(await err({ business_name: " " }), /business name/);
  assert.match(await err({ contact_name: "" }), /your name/);
  assert.match(await err({ phone: "555-1234" }), /10-digit cell/);
  assert.match(await err({ email: "nope" }), /valid email/);
  assert.match(await err({ trades: ["Bogus"] }), /at least one service/);
  assert.match(await err({ towns: ["Atlantis"] }), /at least one town/);
  assert.match(await err({ price__lawn_mowing__qtr: "" }), /at least one price for Lawn mowing/);
  assert.match(await err({ price__lawn_mowing__qtr: "abc" }), /plain numbers/);
  assert.match(await err({ scope: "short" }), /a little about/);
  assert.match(await err({ years: "" }), /years/);
  assert.match(await err({ gl: "0" }), /1,000,000/);
  assert.match(await err({ consent: "" }), /OK to text/);
  assert.match(await err({}, { coi: null }), /certificate of insurance/);
  assert.match(await err({}, { coi: new File([new Uint8Array(10 * 1024 * 1024 + 1)], "big.pdf", { type: "application/pdf" }) }), /over 10 MB/);
  assert.match(await err({}, { coi: new File(["<html>"], "coi.html", { type: "text/html" }) }), /PDF or a photo/);
  assert.match(await err({}, { ratecard: new File(["x"], "rates.exe", { type: "application/x-msdownload" }) }), /rate card as a PDF/);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM vendor_applications").get().n, 0);
  assert.equal(env.VENDOR_FILES.map.size, 0);
  assert.equal(calPhone("+1 (570) 555-7777"), "5705557777");
  assert.deepEqual(vappParsePrices(new FormData(), ["Cleanouts"]), { prices: [] }); // optional trade
});

test("an application saves with its prices and certificate; texts to the applicant and staff are held", async () => {
  const env = await seededEnv();
  const rc = new File(["a,b"], "rates.csv", { type: "" }); // type from the extension
  const coi = new File([new Uint8Array(30)], "coi.heic", { type: "" });
  const r = await apply(env, form({}, { coi, ratecard: rc }));
  assert.deepEqual(r.body, { ok: true, texted: false });
  const a = env.DB.raw.prepare("SELECT * FROM vendor_applications").get();
  assert.deepEqual([a.business_name, a.contact_name, a.phone, a.email, a.trades, a.towns, a.years, a.crew, a.emergency, a.gl_1m, a.coi_type, a.coi_expires, a.wc, a.ip, a.status, a.texted, a.ratecard_type],
    ["Green Cuts LLC", "Gina Green", "5705557777", "gina@greencuts.com", '["Lawn mowing"]', '["Bloomsburg","Danville"]', 6, "2-3", "Sometimes", 1, "image/heic", "2027-05-01", "Yes", "203.0.113.9", "new", 0, "text/csv"]);
  assert.match(a.coi_key, /^vapp\/[0-9a-f]{32}\.heic$/);
  assert.match(a.ratecard_key, /^vapp\/[0-9a-f]{32}\.csv$/);
  assert.deepEqual(env.VENDOR_FILES.map.get(a.coi_key).metadata, { contentType: "image/heic", name: "coi.heic" });
  assert.deepEqual(env.DB.raw.prepare("SELECT trade, item, amount_cents FROM vendor_app_prices").all().map((x) => ({ ...x })), [{ trade: "Lawn mowing", item: "qtr", amount_cents: 4500 }]);
  const held = env.DB.raw.prepare("SELECT to_addr, body, source FROM vendor_portal_held ORDER BY id").all();
  // the applicant, plus John, Felicia and Destiny (Scott has no account here)
  assert.deepEqual(held.map((h) => h.to_addr).sort(), ["5705550001", "5705550004", "5705550005", "5705557777"]);
  assert.match(held.find((h) => h.source === "apply:confirm").body, /^Hi Gina, thanks for applying to work with ExpertPM\./);
  assert.equal(held.find((h) => h.source === "apply:confirm").to_addr, "5705557777");
  assert.match(held.find((h) => h.source === "apply:staff").body, /^New vendor application: Green Cuts LLC \(Gina Green, \(570\) 555-7777\)\. Lawn mowing\. Covers Bloomsburg, Danville\. 6 yrs in business, \$1M GL certificate attached, 1 price entered, rate card attached\./);
  assert.equal(env.CONTACT.sent.length, 0);
  assert.deepEqual([...new Set(writes(env))].sort(), ["CREATE vendor_portal_held", "INSERT vendor_app_prices", "INSERT vendor_applications", "INSERT vendor_portal_held", "UPDATE vendor_applications"]);
  // this app never serves application files back
  for (const path of ["/" + a.coi_key, "/vendors/" + a.coi_key, "/api/vapps/1/coi"]) assert.notEqual((await call(env, path)).status, 200);
});

test("a double-tapped submit is one application; five from one connection in an hour is the cap", async () => {
  const env = await seededEnv();
  await apply(env, form());
  assert.deepEqual((await apply(env, form())).body, { ok: true, duplicate: true });
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM vendor_applications").get().n, 1);
  for (let i = 0; i < 4; i++) await apply(env, form({ phone: "57055500" + (10 + i) }));
  const r = await apply(env, form({ phone: "5705550099" }));
  assert.equal(r.status, 429);
  assert.equal((await apply(env, form({ phone: "5705550099" }), "198.51.100.1")).body.ok, true);
});

test("with SIDE_EFFECTS=1 the confirmation and staff texts really go out", async () => {
  const env = await seededEnv({ SIDE_EFFECTS: "1" });
  assert.deepEqual((await apply(env, form())).body, { ok: true, texted: true });
  assert.equal(env.CONTACT.sent.length, 4);
  assert.equal(env.DB.raw.prepare("SELECT texted FROM vendor_applications").get().texted, 1);
});
