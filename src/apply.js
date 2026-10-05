/* The public vendor recruiting page and its application form. Ported from
   expertpm-crm/worker.js (VAPP_* constants, vappPriceHtml, vappParsePrices,
   vendorsFaqPairs, vendorsPage, vendorApplySubmit).

   The page (src/views/landing.js) shows contractors our scale and how work
   and pay run, then a three-step application. Submissions land in
   vendor_applications with the certificate of insurance (and an optional
   rate card) in VENDOR_FILES under vapp/, structured prices in
   vendor_app_prices. Staff get a text and the applicant gets a confirmation
   (both held while SIDE_EFFECTS=0). Reviewing applications is office side
   (service-epm); this app never serves the uploaded files back.

   Shared-table writes made here (exactly the CRM's):
   - vendor_applications: INSERT, then UPDATE texted
   - vendor_app_prices: INSERT OR REPLACE per price
   - KV VENDOR_FILES: vapp/<random>.<ext> */

import { json, html, escHtml, bufToHex } from "./http.js";
import { vappEnsure } from "./db.js";
import { sendText } from "./outbound.js";
import { VENDORS_PAGE_BODY } from "./views/landing.js";
import { LOGO, OFFICE_FOOT } from "./pages.js";

export const VAPP_NOTIFY_IDS = [1, 5, 4, 10]; // John, Destiny, Felicia, Scott
export const VAPP_TRADES = ["Cleanouts", "Turnover cleaning", "Lawn mowing", "Power washing", "Pest control", "Snow removal", "Painting", "Flooring & carpet", "Plumbing", "Electrical", "HVAC", "Handyman repairs", "Appliance repair", "Roofing & gutters", "Landscaping", "Tree work", "Locksmith"];
export const VAPP_TOWNS = ["Bloomsburg", "Berwick", "Danville", "Williamsport", "Catawissa", "Elysburg", "Hughesville", "Jersey Shore", "Loyalsock", "Millville", "Milton", "Montoursville", "Muncy", "Riverside"];

/* Structured vendor prices: for each trade the form asks for a price in ONE
   standard unit, so the office can rank vendors who offer the same service.
   Core trades need at least one price; blank = "don't do that size". */
const VAPP_SIZES = [["br1", "1 bedroom"], ["br2", "2 bedroom"], ["br3", "3 bedroom"], ["br4", "4 bedroom"], ["br5", "5 bedroom"], ["sfh", "Single-family (3 BR house)"]];
const VAPP_LABOR = [["hour", "Hourly rate"], ["trip", "Trip / service-call fee"]];
export const VAPP_PRICE_SPEC = {
  "Cleanouts": { unit: "per full truckload", items: [["load", "Per truckload"]] },
  "Turnover cleaning": { unit: "move-out clean, per unit", core: true, items: VAPP_SIZES },
  "Lawn mowing": { unit: "per cut", core: true, items: [["qtr", "Up to 1/4 acre"], ["one", "1/4 to 1 acre"], ["acre", "Over 1 acre, per acre"]] },
  "Power washing": { unit: "exterior wash", items: [["sfh", "Single-family house"]] },
  "Pest control": { unit: "per treatment", items: VAPP_SIZES },
  "Snow removal": { unit: "per visit", core: true, items: [["lot_s", "Lot plow, small (up to 10 spaces), per push"], ["lot_m", "Lot plow, medium (11 to 30 spaces), per push"], ["lot_l", "Lot plow, large (30+ spaces), per push"], ["walk", "Sidewalk clearing, per 100 ft"], ["salt_lot", "Salt, parking lot, per application"], ["salt_walk", "Salt, sidewalks, per 100 ft"], ["drive", "Single-family driveway, per push"]] },
  "Painting": { unit: "full repaint, walls", core: true, items: VAPP_SIZES },
  "Flooring & carpet": { unit: "installed", items: [["lvp", "LVP, per sq ft"], ["carpet", "Carpet, per sq ft"]] },
  "Plumbing": { unit: "labor", items: VAPP_LABOR },
  "Electrical": { unit: "labor", items: VAPP_LABOR },
  "HVAC": { unit: "labor", items: VAPP_LABOR },
  "Handyman repairs": { unit: "labor", items: VAPP_LABOR },
  "Appliance repair": { unit: "labor", items: [["trip", "Service-call fee"], ["hour", "Hourly rate"]] },
  "Roofing & gutters": { unit: "installed / per visit", items: [["square", "Shingle roof, per square (100 sq ft)"], ["gutter", "Gutter cleaning, single-family house"]] },
  "Landscaping": { unit: "labor", items: [["hour", "Hourly rate (crew)"]] },
  "Tree work": { unit: "labor", items: [["hour", "Hourly rate (crew)"]] },
  "Locksmith": { unit: "per call", items: [["lockout", "Lockout"], ["rekey", "Rekey, per lock"]] },
};
function vappSlug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }

// the price grid on the page (one hidden card per trade; the page's script shows the checked ones)
export function vappPriceHtml() {
  const e = (x) => String(x).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
  return '<div class="vn-f vn-prices" id="vnPricesF" hidden><span class="vn-lb">Your prices</span>' +
    '<p class="vn-prhint">We compare vendors on the same units, so price each service the way it is listed. Leave blank anything you don&rsquo;t do. Turnover cleaning, mowing, snow and painting need at least one price.</p>' +
    Object.entries(VAPP_PRICE_SPEC).map(([t, sp]) =>
      '<div class="vn-pr" data-trade="' + e(t) + '" data-core="' + (sp.core ? 1 : 0) + '" hidden><div class="vn-prh"><b>' + e(t) + '</b><span>' + e(sp.unit) + (sp.core ? ' &middot; at least one required' : ' &middot; optional') + '</span></div><div class="vn-prg">' +
      sp.items.map(([k, lb]) => '<label><span>' + e(lb) + '</span><em><i>$</i><input type="text" inputmode="decimal" autocomplete="off" name="price__' + vappSlug(t) + '__' + k + '" placeholder="0"></em></label>').join("") +
      '</div></div>').join("") +
    '<span class="vn-err" id="vnPriceErr">Add at least one price for each required service.</span></div>';
}

// prices for the trades the vendor picked; { prices:[{trade,item,cents}] } or { error }
export function vappParsePrices(fd, trades) {
  const out = [];
  for (const t of trades) {
    const sp = VAPP_PRICE_SPEC[t];
    if (!sp) continue;
    let n = 0;
    for (const [k, lb] of sp.items) {
      const raw = String(fd.get("price__" + vappSlug(t) + "__" + k) || "").trim();
      if (!raw) continue;
      const num = Number(raw.replace(/[$,\s]/g, ""));
      if (!Number.isFinite(num) || num <= 0 || num > 100000) return { error: "Enter prices as plain numbers, like 45 or 45.50 (" + t + ": " + lb + ")." };
      out.push({ trade: t, item: k, cents: Math.round(num * 100) });
      n++;
    }
    if (sp.core && !n) return { error: "Add at least one price for " + t + ". Leave sizes you don't do blank." };
  }
  return { prices: out };
}

export const VAPP_FILE_MAX = 10 * 1024 * 1024;
const VAPP_FILE_TYPES = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif" };
// a rate card can also be a spreadsheet or Word doc (the certificate can't)
const VAPP_RC_TYPES = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic", "image/heif": "heif", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx", "application/vnd.ms-excel": "xls", "text/csv": "csv", "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx", "application/msword": "doc" };
const VAPP_RC_EXT = { xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", xls: "application/vnd.ms-excel", csv: "text/csv", docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", doc: "application/msword" };
const VAPP_EXT_TYPES = { pdf: "application/pdf", jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp", heic: "image/heic", heif: "image/heif" };
const VAPP_OG_IMG = "https://expertpm.com/blog-img/bab0b08bce6e4d1459bd";

// the CRM's calPhone: 10 digits, or 11 starting with 1
export function calPhone(v) {
  const d = String(v || "").replace(/\D/g, "");
  if (d.length === 10) return d;
  if (d.length === 11 && d[0] === "1") return d.slice(1);
  return null;
}

// FAQ pairs straight from the page's <details>, so the schema can't drift from the copy
function vendorsFaqPairs(body) {
  const txt = (h) => String(h).replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#39;/g, "'").replace(/&rsquo;/g, "’").replace(/&ldquo;|&rdquo;/g, '"').replace(/\s+/g, " ").trim();
  return [...String(body).matchAll(/<details><summary>([\s\S]*?)<i><\/i><\/summary><p>([\s\S]*?)<\/p><\/details>/g)].map((m) => ({ q: txt(m[1]), a: txt(m[2]) }));
}

const TITLE = "Work With ExpertPM | Vendor & Contractor Opportunities in Central PA";
const DESC = "Steady work across 650+ rental doors in 14 Central PA communities. Clear scopes with photos, set windows, one-tap accept, and payment on the 10th. Now booking spring mowing in Williamsport, Danville, Bloomsburg and Berwick.";

/* The CRM wraps the page in expertpm.com's live header and footer (harvested
   from the site at request time). Here it gets a small fixed header of its
   own, with a sign-in link for vendors who already work with us. */
export function vendorsPageHtml(env) {
  const canonical = "https://expertpm.com/vendors/";
  const faq = vendorsFaqPairs(VENDORS_PAGE_BODY);
  const graph = [{ "@type": "WebPage", "@id": canonical, url: canonical, name: TITLE, description: DESC, isPartOf: { "@type": "WebSite", name: "ExpertPM", url: "https://expertpm.com/" }, primaryImageOfPage: VAPP_OG_IMG }];
  if (faq.length >= 2) graph.push({ "@type": "FAQPage", mainEntity: faq.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) });
  const jsonld = JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c");
  const preview = String(env.PREVIEW ?? "1") !== "0";
  const ogTitle = "ExpertPM Official Vendors Platform", ogDesc = "Provide Services to ExpertPM";
  return `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${escHtml(TITLE)}</title><meta name="description" content="${escHtml(DESC)}">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${canonical}">
<link rel="icon" href="${LOGO}" type="image/png">
<meta property="og:type" content="website"><meta property="og:title" content="${escHtml(ogTitle)}"><meta property="og:description" content="${escHtml(ogDesc)}">
<meta property="og:url" content="${canonical}"><meta property="og:image" content="${VAPP_OG_IMG}"><meta property="og:image:type" content="image/jpeg"><meta property="og:image:width" content="2400"><meta property="og:image:height" content="1260"><meta property="og:image:alt" content="The ExpertPM Vendor Network: cleaning, clean-outs, mowing, snowplowing, painting, power washing and handyman work. Apply at expertpm.com/vendors"><meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${escHtml(ogTitle)}"><meta name="twitter:description" content="${escHtml(ogDesc)}">
<meta name="theme-color" content="#061147">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
<script type="application/ld+json">${jsonld}</script>
<style>
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ font-family:'Inter',sans-serif; background:#f3f4f7; }
  .vh{ position:absolute; top:0; left:0; right:0; z-index:20; display:flex; align-items:center; justify-content:space-between; gap:12px; padding:16px clamp(16px,4vw,32px); }
  .vh a.logo{ display:inline-flex; align-items:center; gap:10px; color:#fff; font-weight:900; font-size:18px; letter-spacing:-.01em; text-decoration:none; }
  .vh a.logo img{ width:38px; height:38px; border-radius:10px; background:#fff; padding:3px; }
  .vh a.logo span{ color:hsl(45 95% 55%); }
  .vh a.in{ color:#fff; font-weight:800; font-size:14px; text-decoration:none; border:1.5px solid hsl(0 0% 100% / .35); padding:9px 16px; border-radius:999px; white-space:nowrap; }
  .vh a.in:hover{ border-color:hsl(45 95% 55%); color:hsl(45 95% 55%); }
  .vpre{ position:relative; z-index:21; background:hsl(45 95% 92%); color:hsl(38 80% 25%); font:600 13px/1.45 Inter,sans-serif; text-align:center; padding:8px 16px; }
  .vf{ text-align:center; color:#5b6478; font-size:12.5px; line-height:1.8; padding:34px 16px 44px; }
  .vf a{ color:hsl(38 90% 34%); font-weight:800; text-decoration:none; }
</style></head><body>
${preview ? '<div class="vpre">Preview copy of expertpm.com/vendors. Applications sent here save to ExpertPM\'s real records, but no texts go out from the preview.</div>' : ""}
<div style="position:relative;">
<header class="vh"><a class="logo" href="https://expertpm.com"><img src="${LOGO}" alt="">Expert<span>PM</span></a><a class="in" href="/">Vendor sign in</a></header>
${VENDORS_PAGE_BODY.replace("<!--VN_PRICES-->", () => vappPriceHtml())}
</div>
<footer class="vf">${OFFICE_FOOT}</footer>
</body></html>`;
}

export function vendorsPage(env) { return html(vendorsPageHtml(env)); }

export async function vendorApplySubmit(req, env) {
  await vappEnsure(env);
  const fd = await req.formData().catch(() => null);
  if (!fd) return json({ error: "We couldn't read your application. Please try again." }, 400);
  const s = (k, n) => String(fd.get(k) == null ? "" : fd.get(k)).trim().slice(0, n);
  if (s("company_site", 200)) return json({ ok: true }); // honeypot: bots think they won
  if (!(Number(fd.get("elapsed")) >= 3000)) return json({ ok: true }); // faster than a person can fill three steps
  const business = s("business_name", 120), contact = s("contact_name", 80), phone = calPhone(fd.get("phone")), email = s("email", 120).toLowerCase();
  if (!business) return json({ error: "Enter your business name." }, 400);
  if (!contact) return json({ error: "Enter your name." }, 400);
  if (!phone) return json({ error: "Enter a 10-digit cell number. We send jobs by text." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Enter a valid email address." }, 400);
  const trades = [...new Set(fd.getAll("trades").map(String))].filter((t) => VAPP_TRADES.includes(t));
  const tradeOther = s("trade_other", 120);
  if (!trades.length && !tradeOther) return json({ error: "Pick at least one service you offer." }, 400);
  const towns = [...new Set(fd.getAll("towns").map(String))].filter((t) => VAPP_TOWNS.includes(t));
  if (!towns.length) return json({ error: "Pick at least one town you cover." }, 400);
  const pr = vappParsePrices(fd, trades);
  if (pr.error) return json({ error: pr.error }, 400);
  const scope = s("scope", 2000);
  if (scope.length < 10) return json({ error: "Tell us a little about the services you offer." }, 400);
  const yearsRaw = s("years", 6), years = Math.round(Number(yearsRaw));
  if (yearsRaw === "" || !Number.isFinite(years) || years < 0 || years > 99) return json({ error: "Enter how many years you've been in business." }, 400);
  if (s("gl", 2) !== "1") return json({ error: "ExpertPM requires at least $1,000,000 in general liability coverage." }, 400);
  if (s("consent", 2) !== "1") return json({ error: "We need your OK to text you about your application." }, 400);
  const file = fd.get("coi");
  if (!file || typeof file === "string" || !file.size) return json({ error: "Upload your certificate of insurance." }, 400);
  if (file.size > VAPP_FILE_MAX) return json({ error: "That certificate is over 10 MB. Try a smaller PDF or a photo." }, 400);
  let type = String(file.type || "").toLowerCase();
  if (!VAPP_FILE_TYPES[type]) type = VAPP_EXT_TYPES[String(file.name || "").split(".").pop().toLowerCase()] || "";
  if (!VAPP_FILE_TYPES[type]) return json({ error: "Upload the certificate as a PDF or a photo (JPG, PNG or HEIC)." }, 400);
  const ip = req.headers.get("CF-Connecting-IP") || "";
  if (ip) {
    const recent = await env.DB.prepare("SELECT COUNT(*) AS n FROM vendor_applications WHERE ip = ?1 AND created_at > datetime('now', '-1 hour')").bind(ip).first();
    if (recent && recent.n >= 5) return json({ error: "We've received several applications from this connection. Please try again in an hour." }, 429);
  }
  // a double-tapped submit is the same application, not a second one
  const dup = await env.DB.prepare("SELECT id FROM vendor_applications WHERE phone = ?1 AND created_at > datetime('now', '-10 minutes') LIMIT 1").bind(phone).first();
  if (dup) return json({ ok: true, duplicate: true });
  // optional rate card: same size cap; PDF, photo, Excel or Word; never blocks the application
  const rc = fd.get("ratecard");
  let rcType = "", rcFile = null;
  if (rc && typeof rc !== "string" && rc.size) {
    if (rc.size > VAPP_FILE_MAX) return json({ error: "That rate card is over 10 MB. Try a smaller PDF or a photo." }, 400);
    rcType = String(rc.type || "").toLowerCase();
    const ext = String(rc.name || "").split(".").pop().toLowerCase();
    if (!VAPP_RC_TYPES[rcType]) rcType = VAPP_EXT_TYPES[ext] || VAPP_RC_EXT[ext] || "";
    if (!VAPP_RC_TYPES[rcType]) return json({ error: "Upload the rate card as a PDF, photo, Excel or Word file." }, 400);
    rcFile = rc;
  }
  if (!env.VENDOR_FILES) return json({ error: "File storage isn't configured. Please call the office." }, 500);
  const key = "vapp/" + bufToHex(crypto.getRandomValues(new Uint8Array(16)).buffer) + "." + VAPP_FILE_TYPES[type];
  await env.VENDOR_FILES.put(key, await file.arrayBuffer(), { metadata: { contentType: type, name: String(file.name || "").slice(0, 120) } });
  let rcKey = null;
  if (rcFile) {
    rcKey = "vapp/" + bufToHex(crypto.getRandomValues(new Uint8Array(16)).buffer) + "." + VAPP_RC_TYPES[rcType];
    await env.VENDOR_FILES.put(rcKey, await rcFile.arrayBuffer(), { metadata: { contentType: rcType, name: String(rcFile.name || "").slice(0, 120) } });
  }
  const pick = (v, ok) => (ok.includes(v) ? v : null);
  const exp = /^\d{4}-\d{2}-\d{2}$/.test(s("coi_expires", 10)) ? s("coi_expires", 10) : null;
  const r = await env.DB.prepare(
    `INSERT INTO vendor_applications (business_name, contact_name, phone, email, website, trades, trade_other, towns, scope, years, crew, emergency, pricing, gl_1m, coi_key, coi_name, coi_type, coi_expires, wc, hic, heard, ip, ratecard_key, ratecard_name, ratecard_type)
     VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12,?13,1,?14,?15,?16,?17,?18,?19,?20,?21,?22,?23,?24)`
  ).bind(business, contact, phone, email, s("website", 200) || null, JSON.stringify(trades), tradeOther || null, JSON.stringify(towns), scope, years,
    pick(s("crew", 10), ["Just me", "2-3", "4-10", "10+"]), pick(s("emergency", 20), ["No", "Sometimes", "Yes, 24/7"]), s("pricing", 2000).replace(/\r\n?/g, "\n") || null,
    key, String(file.name || "").slice(0, 120) || null, type, exp, pick(s("wc", 10), ["Yes", "No", "Exempt"]), s("hic", 40) || null, s("heard", 60) || null, ip || null,
    rcKey, rcFile ? String(rcFile.name || "").slice(0, 120) || null : null, rcKey ? rcType : null).run();
  const id = r.meta && r.meta.last_row_id;
  if (id && pr.prices.length) {
    try {
      await env.DB.batch(pr.prices.map((x) => env.DB.prepare("INSERT OR REPLACE INTO vendor_app_prices (app_id, trade, item, amount_cents) VALUES (?1, ?2, ?3, ?4)").bind(id, x.trade, x.item, x.cents)));
    } catch (e) { /* the application itself is saved; prices can be re-entered */ }
  }
  const pretty = "(" + phone.slice(0, 3) + ") " + phone.slice(3, 6) + "-" + phone.slice(6);
  const staffMsg = "New vendor application: " + business + " (" + contact + ", " + pretty + "). " +
    trades.concat(tradeOther ? [tradeOther] : []).join(", ") + ". Covers " + towns.join(", ") + ". " +
    years + " yr" + (years === 1 ? "" : "s") + " in business, $1M GL certificate attached" + (pr.prices.length ? ", " + pr.prices.length + " price" + (pr.prices.length === 1 ? "" : "s") + " entered" : "") + (rcKey ? ", rate card attached" : "") + ". Compare it in the CRM under Vendors > Vendor Leads.";
  const confirm = "Hi " + contact.split(/\s+/)[0] + ", thanks for applying to work with ExpertPM. We received your information and your insurance certificate. " +
    "Our team reviews every application, and if it's a good fit we'll reach out to get you set up.";
  let staff = [];
  try {
    staff = (await env.DB.prepare("SELECT id, phone FROM users WHERE id IN (" + VAPP_NOTIFY_IDS.map((_, i) => "?" + (i + 1)).join(",") + ") AND phone IS NOT NULL AND phone != ''")
      .bind(...VAPP_NOTIFY_IDS).all()).results || [];
  } catch (e) {}
  const sent = await Promise.all([sendText(env, phone, confirm, "apply:confirm")].concat(staff.map((u) => sendText(env, u.phone, staffMsg, "apply:staff"))));
  try { await env.DB.prepare("UPDATE vendor_applications SET texted = ?1 WHERE id = ?2").bind(sent[0] ? 1 : 0, id).run(); } catch (e) {}
  return json({ ok: true, texted: !!sent[0] });
}
