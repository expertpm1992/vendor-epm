/* Vendor work orders, vendor side. Ported from expertpm-crm/worker.js
   (apiVendorWorkList, workByToken, workRoster, workShell, workPage,
   workInspPhoto, workRespond).

   The office (service-epm, and the CRM until launch) sends a vendor work; the
   vendor gets a text with a private /work/<token> link (no login) where they
   price it, accept it, decline it, mark it done, or send their charge. The
   signed-in portal's Jobs tab lists the same orders and links to the same
   pages, so the portal and the texted links never diverge.

   Shared-table writes made here (exactly the CRM's vendor-side writes):
   - work_orders: status/cost/cost_note/responded_at/decline_reason
     (accept, accept_batch, decline), status/promised_by/chase_sent_at
     (accept_ba), status/cost/cost_note/completed_at/office_note (done_ba),
     promised_by/delay_reason/chase_sent_at (delay_ba), status/completed_at
     (done)
   - work_order_events: one row per vendor action
   The office's own actions (send, approve, send back, end, edit, the chase
   text) live in service-epm. */

import { json, html, notFound, escHtml, BASE_HEADERS } from "./http.js";
import { workEnsure } from "./db.js";
import { sendText } from "./outbound.js";
import { LOGO, OFFICE_FOOT } from "./pages.js";

export const TOKEN_RE = "[a-f0-9]{40,64}";

async function workEvent(env, id, actor, action, detail) {
  try {
    await env.DB.prepare("INSERT INTO work_order_events (work_id, actor, action, detail) VALUES (?1,?2,?3,?4)")
      .bind(id, actor || null, action, detail || null).run();
  } catch (e) {}
}
// "Wed, Oct 1" for a YYYY-MM-DD
export function workDay(iso) {
  try { return new Date(String(iso).slice(0, 10) + "T12:00:00Z").toLocaleDateString("en-US", { timeZone: "UTC", weekday: "short", month: "short", day: "numeric" }); } catch (e) { return String(iso || ""); }
}
export function workNum(v) { const t = String(v ?? "").replace(/[$,\s]/g, ""); if (!t) return null; const n = Number(t); return Number.isFinite(n) && n >= 0 ? n : null; }
export function workMoney(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

/* ---- the signed-in portal's Jobs tab ---- */

/* Everything ExpertPM has sent this vendor, matched by account id (and phone,
   for orders that predate the account link), as the CRM does. */
export async function apiVendorWorkList(env, v) {
  await workEnsure(env);
  const rows = (await env.DB.prepare(
    "SELECT id, token, property, service, recurring, frequency, bill_after, promised_by, status, cost, office_note, target_date, earliest_start, created_at FROM work_orders " +
    "WHERE vendor_account_id = ?1 OR (vendor_phone IS NOT NULL AND vendor_phone != '' AND vendor_phone = ?2) " +
    "ORDER BY CASE status WHEN 'sent' THEN 0 WHEN 'quoted' THEN 1 WHEN 'active' THEN 2 ELSE 3 END, created_at DESC LIMIT 100"
  ).bind(v.id, v.phone || "").all()).results || [];
  return json({ rows });
}

/* ---- the public /work/<token> pages ---- */

async function workByToken(env, token) {
  await workEnsure(env);
  return await env.DB.prepare("SELECT * FROM work_orders WHERE token = ?1").bind(token).first();
}
async function workRoster(env, w) {
  const digits = String(w.vendor_phone || "").replace(/[^0-9]/g, "").slice(-10);
  const rows = (await env.DB.prepare("SELECT * FROM work_orders WHERE status = 'active' ORDER BY property").all()).results || [];
  return rows.filter((r) =>
    (w.vendor_account_id && r.vendor_account_id === w.vendor_account_id) ||
    (digits && String(r.vendor_phone || "").replace(/[^0-9]/g, "").slice(-10) === digits));
}

export function workShell(inner) {
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Work Order | ExpertPM</title><meta name="robots" content="noindex, nofollow">
<link rel="icon" href="${LOGO}" type="image/png">
<style>
  :root{ --navy:hsl(230 85% 15%); --gold:hsl(45 95% 55%); --gold-dark:hsl(42 90% 45%); --gold-text:hsl(38 90% 38%); --muted:hsl(220 25% 45%); --line:hsl(220 30% 88%); --good:hsl(140 50% 32%); --bad:hsl(0 60% 40%); }
  *{ box-sizing:border-box; margin:0; padding:0; }
  body{ font-family:'Inter','Helvetica Neue',Arial,sans-serif; background:var(--navy); min-height:100svh; display:flex; align-items:flex-start; justify-content:center; padding:26px 16px; }
  .card{ background:#fff; border-radius:20px; max-width:460px; width:100%; padding:26px 22px; box-shadow:0 24px 70px hsl(230 60% 8% / .5); }
  .brand{ display:flex; align-items:center; gap:10px; margin-bottom:14px; }
  .brand img{ height:40px; display:block; }
  h1{ font-size:1.15rem; font-weight:900; color:var(--navy); letter-spacing:-.015em; margin-bottom:4px; }
  .sub{ font-size:13.5px; font-weight:600; color:var(--muted); line-height:1.55; }
  .box{ background:hsl(220 30% 97%); border:1.5px solid var(--line); border-radius:14px; padding:14px 16px; margin:14px 0; }
  .box b{ color:var(--navy); }
  .banner{ background:hsl(45 95% 92%); border:1px solid hsl(45 85% 70%); color:hsl(38 80% 25%); border-radius:12px; padding:9px 12px; font-size:12.5px; font-weight:600; line-height:1.45; margin-bottom:12px; }
  label{ display:block; font:800 11px Inter,sans-serif; letter-spacing:.07em; text-transform:uppercase; color:var(--muted); margin:12px 0 5px; }
  input, textarea{ width:100%; font:600 16px Inter,sans-serif; border:1.5px solid var(--line); border-radius:11px; padding:12px 13px; }
  .btn{ display:block; width:100%; text-align:center; border:none; cursor:pointer; font:800 15px Inter,sans-serif; padding:14px; border-radius:999px; margin-top:12px; text-decoration:none; }
  .btn.gold{ background:linear-gradient(135deg,var(--gold),var(--gold-dark)); color:var(--navy); }
  .btn.ghost{ background:#fff; border:1.5px solid var(--line); color:var(--muted); }
  .roster{ margin-top:22px; border-top:1.5px solid var(--line); padding-top:16px; }
  .roster h2{ font-size:12px; font-weight:800; letter-spacing:.06em; text-transform:uppercase; color:var(--muted); margin-bottom:8px; }
  .rrow{ display:flex; justify-content:space-between; align-items:center; gap:10px; padding:9px 2px; border-bottom:1px solid var(--line); font-size:13.5px; font-weight:600; }
  .rrow b{ color:var(--navy); font-weight:800; }
  .foot{ margin-top:18px; padding-top:14px; border-top:1.5px solid var(--line); text-align:center; font-size:12px; color:var(--muted); font-weight:600; line-height:1.8; }
  .foot a{ color:var(--gold-text); font-weight:800; text-decoration:none; }
</style></head><body><div class="card"><div class="brand"><img src="${LOGO}" alt="ExpertPM"></div><!--PREVIEW-->${inner}
<div class="foot">${OFFICE_FOOT}</div></div></body></html>`;
}

const PREVIEW_NOTE = '<div class="banner">Preview copy of this page. Your answer here saves to ExpertPM\'s real records, but no texts go out from the preview.</div>';

function page(env, inner, status = 200) {
  const preview = String(env.PREVIEW ?? "1") !== "0";
  return html(workShell(inner).replace("<!--PREVIEW-->", preview ? PREVIEW_NOTE : ""), status);
}
function back(env, token, title, sub) {
  return page(env, `<h1>${title}</h1><p class="sub">${sub}</p><a class="btn gold" href="/work/${escHtml(token)}">&larr; Back</a>`);
}

function photoBlockHtml(token, photos) {
  if (!photos.length) return "";
  return `<div class="box"><b>${photos.length} photo${photos.length === 1 ? "" : "s"} of the job</b>
    <div class="sub" style="margin-top:2px;">From our walkthrough. Tap any photo to view it full screen.</div>
    <div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(84px, 1fr)); gap:6px; margin-top:10px;">${photos.map((ph, i) =>
      `<a href="/work/${escHtml(token)}/photo/${escHtml(ph.id)}" class="wlbT" data-i="${i}" target="_blank" rel="noopener"><img src="/work/${escHtml(token)}/photo/${escHtml(ph.id)}?thumb=1" alt="job photo ${i + 1}" loading="lazy" style="width:100%; aspect-ratio:1; object-fit:cover; border-radius:9px; border:1.5px solid var(--line); display:block;"></a>`).join("")}</div></div>
  <style>
    #wlb{ position:fixed; inset:0; z-index:60; background:hsl(230 60% 6% / .96); display:none; }
    #wlb.on{ display:block; }
    #wlbImg{ position:absolute; inset:0; margin:auto; max-width:100vw; max-height:100svh; object-fit:contain; }
    .wlbBtn{ position:absolute; z-index:2; border:none; cursor:pointer; background:hsl(0 0% 100% / .16); color:#fff; border-radius:999px; font:800 15px Inter,sans-serif; display:flex; align-items:center; justify-content:center; }
    .wlbBtn:active{ background:hsl(0 0% 100% / .3); }
    #wlbX{ top:14px; right:14px; padding:12px 20px; gap:8px; }
    #wlbP, #wlbN{ top:50%; transform:translateY(-50%); width:48px; height:48px; font-size:22px; }
    #wlbP{ left:10px; } #wlbN{ right:10px; }
    #wlbC{ position:absolute; top:27px; left:18px; color:hsl(0 0% 100% / .85); font:800 13px Inter,sans-serif; letter-spacing:.04em; }
  </style>
  <div id="wlb" role="dialog" aria-modal="true" aria-label="Job photos">
    <img id="wlbImg" alt="job photo full size">
    <span id="wlbC"></span>
    <button type="button" class="wlbBtn" id="wlbX" aria-label="Close the photo viewer">&#10005; Close</button>
    ${photos.length > 1 ? `<button type="button" class="wlbBtn" id="wlbP" aria-label="Previous photo">&#10094;</button>
    <button type="button" class="wlbBtn" id="wlbN" aria-label="Next photo">&#10095;</button>` : ""}
  </div>
  <script>
  (function(){
    var T = Array.prototype.slice.call(document.querySelectorAll('.wlbT'));
    if(!T.length) return;
    var full = T.map(function(a){ return a.getAttribute('href'); });
    var box = document.getElementById('wlb'), img = document.getElementById('wlbImg'),
        cnt = document.getElementById('wlbC'), bx = document.getElementById('wlbX'),
        bp = document.getElementById('wlbP'), bn = document.getElementById('wlbN'),
        cur = 0, lastFocus = null, tx = null;
    function show(i){
      cur = (i + full.length) % full.length;
      img.src = full[cur];
      cnt.textContent = (cur + 1) + ' / ' + full.length;
      if(full.length > 1){ var pre = new Image(); pre.src = full[(cur + 1) % full.length]; }
    }
    function open(i){ lastFocus = document.activeElement; show(i); box.classList.add('on'); document.body.style.overflow = 'hidden'; bx.focus(); }
    function close(){ box.classList.remove('on'); img.removeAttribute('src'); document.body.style.overflow = ''; if(lastFocus && lastFocus.focus) lastFocus.focus(); }
    T.forEach(function(a, i){ a.addEventListener('click', function(e){ e.preventDefault(); open(i); }); });
    bx.addEventListener('click', close);
    if(bp) bp.addEventListener('click', function(){ show(cur - 1); });
    if(bn) bn.addEventListener('click', function(){ show(cur + 1); });
    box.addEventListener('click', function(e){ if(e.target === box) close(); });
    document.addEventListener('keydown', function(e){
      if(!box.classList.contains('on')) return;
      if(e.key === 'Escape') close();
      else if(e.key === 'ArrowLeft') show(cur - 1);
      else if(e.key === 'ArrowRight') show(cur + 1);
    });
    box.addEventListener('touchstart', function(e){ tx = e.changedTouches[0].clientX; }, { passive: true });
    box.addEventListener('touchend', function(e){
      if(tx === null) return;
      var dx = e.changedTouches[0].clientX - tx; tx = null;
      if(Math.abs(dx) > 40 && full.length > 1) show(cur + (dx < 0 ? 1 : -1));
    }, { passive: true });
  })();
  </script>`;
}

export async function workPage(token, env) {
  const w = await workByToken(env, token);
  if (!w) return page(env, "<h1>This link isn't active.</h1><p class='sub'>It may have been replaced. Check your latest text from ExpertPM.</p>", 404);
  const first = escHtml((w.vendor_name || "").split(" ")[0]);
  const svc = escHtml(w.service || "work");
  // the photo packet: shots from the office's inspection walkthrough, served
  // through this work token so the image store stays private
  let photos = [];
  if (w.inspection_id) {
    try { photos = (await env.DB.prepare("SELECT id FROM inspection_photos WHERE inspection_id = ?1 ORDER BY seq, created_at LIMIT 150").bind(w.inspection_id).all()).results || []; } catch (e) {}
  }
  const photoBlock = photoBlockHtml(token, photos);
  const details = `<div class="box"><b>${escHtml(w.property)}</b>
    <div class="sub" style="margin-top:4px;">${svc}${w.recurring ? " &middot; recurring" + (w.frequency ? " &middot; " + escHtml(w.frequency).toLowerCase() : "") : " &middot; one-time"}${w.promised_by ? " &middot; promised by " + escHtml(w.promised_by) : ""}</div>
    ${w.earliest_start || w.target_date ? `<div class="sub" style="margin-top:6px;">${[w.earliest_start ? "Start no sooner than <b>" + escHtml(workDay(w.earliest_start)) + "</b>" : "", w.target_date ? "Needed done by <b>" + escHtml(workDay(w.target_date)) + "</b>" : ""].filter(Boolean).join(" &middot; ")}</div>` : ""}
    ${w.instructions ? `<div class="sub" style="margin-top:8px; white-space:pre-line;">${escHtml(w.instructions)}</div>` : ""}</div>` + photoBlock;
  const officeNote = w.office_note ? `<div class="box" style="border-color:hsl(38 80% 70%); background:hsl(45 95% 55% / .1);"><b>Note from the office:</b><div class="sub" style="margin-top:4px;">${escHtml(w.office_note)}</div></div>` : "";
  const declineForm = `<form method="POST" action="/work/${escHtml(token)}" style="margin-top:6px;">
        <input type="hidden" name="action" value="decline">
        <input name="reason" placeholder="No thanks: reason (optional)" style="margin-top:8px;">
        <button class="btn ghost" type="submit">Decline this work</button>
      </form>`;
  const pending = (await env.DB.prepare(
    "SELECT id, token, property, service, recurring, frequency, bill_after, earliest_start, target_date FROM work_orders WHERE vendor_phone = ?1 AND status = 'sent' AND id != ?2 ORDER BY created_at LIMIT 15"
  ).bind(w.vendor_phone, w.id).all()).results || [];
  let inner = "";
  if (w.status === "sent" && w.bill_after) {
    inner = `<h1>One-time ${svc.toLowerCase()} job, ${first}</h1>
      <p class="sub">No quote needed on this one. Do the job, then bill us your charge when it's finished. Just tell us when you can have it done.</p>${details}
      ${officeNote}
      <form method="POST" action="/work/${escHtml(token)}">
        <input type="hidden" name="action" value="accept_ba">
        <label>I can have it done by</label>
        <input type="date" name="promised" required${w.earliest_start ? ` min="${escHtml(w.earliest_start)}"` : ""}>
        <button class="btn gold" type="submit">Accept this job</button>
      </form>
      ${declineForm}`;
  } else if (w.status === "active" && w.bill_after) {
    const late = w.promised_by && Date.now() > Date.parse(w.promised_by + "T20:00:00Z");
    inner = `<h1>${late ? "Is the " + svc.toLowerCase() + " at " + escHtml(w.property) + " done?" : "You're on, " + first + "."}</h1>
      <p class="sub">${w.promised_by ? "Promised by <b>" + escHtml(w.promised_by) + "</b>. " : ""}When it's finished, send your charge below. The office reviews it, then you invoice through the portal as usual.</p>${details}
      <form method="POST" action="/work/${escHtml(token)}">
        <input type="hidden" name="action" value="done_ba">
        <label>${late ? "Yes, it's done. My charge for the job ($)" : "It's done. My charge for the job ($)"}</label>
        <input name="cost" inputmode="decimal" placeholder="350" required>
        <label>Anything the office should know? (optional)</label>
        <textarea name="note" rows="2" placeholder="e.g. extra haul-away, unit was rough"></textarea>
        <button class="btn gold" type="submit">Mark complete &amp; send my charge</button>
      </form>
      <form method="POST" action="/work/${escHtml(token)}" style="margin-top:6px;">
        <input type="hidden" name="action" value="delay_ba">
        <label>${late ? "Not done yet? Tell us why and pick a new date" : "Need more time? Tell us why and pick a new date"}</label>
        <input name="reason" placeholder="e.g. tenant hasn't moved out yet" required>
        <input type="date" name="promised" required${w.earliest_start ? ` min="${escHtml(w.earliest_start)}"` : ""} style="margin-top:8px;">
        <button class="btn ghost" type="submit">Update my finish date</button>
      </form>`;
  } else if (w.status === "done_review") {
    inner = `<h1>Charge sent. Nice work, ${first}.</h1><p class="sub">Your charge of <b style="color:var(--gold-text);">${workMoney(w.cost)}</b> is with the office. You'll get a text the moment it's approved, then submit your invoice through the portal as usual.</p>${details}`;
  } else if (w.status === "sent" && pending.some((o) => !o.bill_after)) {
    // batch quote sheet: this property + every other pending one, priced on
    // ONE page (no-quote jobs never join the price sheet)
    const rows = [{ id: w.id, property: w.property, recurring: w.recurring, frequency: w.frequency, earliest_start: w.earliest_start, target_date: w.target_date }].concat(pending.filter((o) => !o.bill_after));
    inner = `<h1>${rows.length} properties need your price, ${first}</h1>
      <p class="sub">${svc} work. Put a price on each. The office reviews and confirms before anything starts. <b>Leave one blank to skip it for now.</b></p>
      ${w.instructions ? `<div class="box"><div class="sub" style="white-space:pre-line;">${escHtml(w.instructions)}</div></div>` : ""}${photoBlock ? photoBlock.replace(" of the job</b>", " of the job at " + escHtml(w.property) + "</b>") : ""}
      <form method="POST" action="/work/${escHtml(token)}">
        <input type="hidden" name="action" value="accept_batch">` +
      rows.map((r) => `<div class="box" style="display:flex; align-items:center; gap:12px;">
        <span style="flex:1;"><b>${escHtml(r.property)}</b><span class="sub" style="display:block; font-size:11.5px;">${r.recurring ? "recurring" + (r.frequency ? " &middot; " + escHtml(r.frequency).toLowerCase() : "") + " &middot; price per visit" : "one-time &middot; price for the job"}${r.earliest_start ? " &middot; start " + escHtml(workDay(r.earliest_start)) + " or later" : ""}${r.target_date ? " &middot; done by " + escHtml(workDay(r.target_date)) : ""}</span></span>
        <span style="flex:0 0 110px; display:flex; align-items:center; gap:4px;"><b>$</b><input name="cost_${r.id}" inputmode="decimal" placeholder="0" style="margin:0;"></span>
      </div>`).join("") +
      `<label>Anything the office should know? (optional)</label>
        <textarea name="note" rows="2" placeholder="e.g. can start next week"></textarea>
        <button class="btn gold" type="submit">Send all my prices</button>
      </form>
      <p class="sub" style="font-size:12px;">Don't want one of them? Open it and decline: ` +
      rows.map((r) => `<a href="/work/${escHtml(r.id === w.id ? token : r.token)}" style="color:var(--gold-text);">${escHtml(r.property)}</a>`).join(" &middot; ") + `</p>`;
  } else if (w.status === "sent") {
    inner = `<h1>New ${svc.toLowerCase()} work, ${first}</h1><p class="sub">Take a look. If you want it, add your price and send it in. The office confirms before any work starts.</p>${details}
      ${officeNote}
      <form method="POST" action="/work/${escHtml(token)}">
        <input type="hidden" name="action" value="accept">
        <label>Your price ${w.recurring ? "(per visit" + (w.frequency ? ", " + escHtml(w.frequency).toLowerCase() : "") + ")" : "(for the job)"}</label>
        <input name="cost" inputmode="decimal" placeholder="65" required>
        <label>Anything the office should know? (optional)</label>
        <textarea name="note" rows="2" placeholder="e.g. can start next week"></textarea>
        <button class="btn gold" type="submit">Accept &amp; send my price</button>
      </form>
      ${declineForm}`;
  } else if (w.status === "quoted") {
    inner = `<h1>Quote sent. Nice, ${first}.</h1><p class="sub">Your price of <b style="color:var(--gold-text);">${workMoney(w.cost)}${w.recurring ? "/visit" : ""}</b> is with the office. You'll get a text the moment it's approved.</p>${details}`;
  } else if (w.status === "active") {
    inner = `<h1>${w.recurring ? "This one's yours." : "Approved. Good to go."}</h1>
      <p class="sub">${w.recurring ? `${svc} at ${workMoney(w.cost)} per visit.` : `${svc} at ${workMoney(w.cost)}. When the job's finished, tap below.`}</p>${details}
      ${w.recurring ? "" : `<form method="POST" action="/work/${escHtml(token)}"><input type="hidden" name="action" value="done"><button class="btn gold" type="submit">Mark this job done</button></form>`}`;
  } else if (w.status === "declined") {
    inner = `<h1>You passed on this one.</h1><p class="sub">No problem. The office has been notified.</p>${details}`;
  } else if (w.status === "completed") {
    inner = `<h1>Done and dusted. &#10003;</h1><p class="sub">Marked complete${w.completed_at ? " " + escHtml(String(w.completed_at).slice(0, 10)) : ""}. Send your invoice through the vendor portal as usual.</p>${details}`;
  } else {
    inner = `<h1>This work is closed.</h1><p class="sub">${w.status === "ended" ? "Service here has ended." : "The office withdrew this request."}</p>${details}`;
  }
  const others = w.status === "sent" ? [] : pending;
  if (others.length) {
    inner += `<div class="roster"><h2>Also waiting for your price</h2>` + others.map((o) =>
      `<div class="rrow"><span>${escHtml(o.property)}<span class="sub" style="display:block; font-size:11.5px;">${escHtml(o.service)}${o.recurring ? " &middot; recurring" : ""}</span></span><a class="btn gold" style="width:auto; padding:9px 16px; font-size:13px; text-decoration:none; margin:0;" href="/work/${escHtml(o.token)}">Quote &rarr;</a></div>`).join("") + `</div>`;
  }
  const roster = await workRoster(env, w);
  if (roster.length) {
    inner += `<div class="roster"><h2>Your active ExpertPM work</h2>` + roster.map((r) =>
      `<div class="rrow"><span>${escHtml(r.property)}<span class="sub" style="display:block; font-size:11.5px;">${escHtml(r.service)}${r.recurring ? " &middot; recurring" : ""}</span></span><b>${r.cost !== null ? workMoney(r.cost) + (r.recurring ? "/visit" : "") : ""}</b></div>`).join("") + `</div>`;
  }
  return page(env, inner);
}

/* Inspection photos on the job page ride the work token: the image only
   serves when the photo belongs to THIS work order's attached inspection, so
   one vendor's link never opens another property's walkthrough. */
export async function workInspPhoto(token, photoId, url, env) {
  const w = await workByToken(env, token);
  if (!w || !w.inspection_id) return notFound();
  let ph = null;
  try {
    ph = await env.DB.prepare("SELECT r2_key, thumb_key, content_type FROM inspection_photos WHERE id = ?1 AND inspection_id = ?2")
      .bind(String(photoId), w.inspection_id).first();
  } catch (e) {}
  if (!ph || !env.VENDOR_FILES) return notFound();
  const wantThumb = url.searchParams.get("thumb") === "1";
  const key = wantThumb && ph.thumb_key ? ph.thumb_key : ph.r2_key;
  const got = await env.VENDOR_FILES.getWithMetadata(key, "arrayBuffer");
  if (!got || !got.value) return notFound();
  const type = wantThumb && ph.thumb_key ? "image/webp" : (ph.content_type || "image/jpeg");
  return new Response(got.value, { headers: { ...BASE_HEADERS, "Content-Type": type, "Cache-Control": "private, max-age=86400" } });
}

async function staffPhone(env, userId) {
  if (!userId) return null;
  const u = await env.DB.prepare("SELECT phone FROM users WHERE id = ?1").bind(userId).first();
  return u && u.phone ? u.phone : null;
}

export async function workRespond(token, req, env) {
  const w = await workByToken(env, token);
  if (!w) return notFound();
  const fields = {};
  const fd = await req.formData().catch(() => null);
  if (fd) for (const [k, v] of fd) fields[k] = String(v);
  const action = fields.action || "";
  const startErr = () => back(env, token, "That's before the job can start.", `The soonest start is ${escHtml(workDay(w.earliest_start))}. Go back and pick a finish date on or after it.`);
  if (action === "accept" && w.status === "sent") {
    const cost = workNum(fields.cost);
    if (cost === null) return back(env, token, "We need a price first.", `Go back and enter what you'd charge${w.recurring ? " per visit" : ""}.`);
    await env.DB.prepare("UPDATE work_orders SET status='quoted', cost=?1, cost_note=?2, responded_at=datetime('now'), decline_reason=NULL WHERE id=?3")
      .bind(cost, String(fields.note || "").trim().slice(0, 400) || null, w.id).run();
    await workEvent(env, w.id, w.vendor_name, "quoted", workMoney(cost) + (fields.note ? " - " + String(fields.note).slice(0, 200) : ""));
  } else if (action === "accept_ba" && w.status === "sent" && w.bill_after) {
    const pd = String(fields.promised || "");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(pd)) return back(env, token, "Pick a finish date first.", "Tell us when you can have it done.");
    if (w.earliest_start && pd < w.earliest_start) return startErr();
    await env.DB.prepare("UPDATE work_orders SET status='active', promised_by=?1, chase_sent_at=NULL, responded_at=datetime('now'), decline_reason=NULL WHERE id=?2").bind(pd, w.id).run();
    await workEvent(env, w.id, w.vendor_name, "accepted", "promised by " + pd);
    try {
      const phone = await staffPhone(env, w.created_by);
      if (phone) await sendText(env, phone, w.vendor_name + " accepted the one-time " + String(w.service || "").toLowerCase() + " at " + w.property + " - promised by " + pd + "." + (w.target_date && pd > w.target_date ? " That's after the needed-by date of " + w.target_date + "." : "") + " They'll bill their charge when it's done.", "work:accept_ba");
    } catch (e) {}
  } else if (action === "done_ba" && w.status === "active" && w.bill_after) {
    const cost = workNum(fields.cost);
    if (cost === null) return back(env, token, "We need your charge first.", "Go back and enter what you're billing for the job.");
    await env.DB.prepare("UPDATE work_orders SET status='done_review', cost=?1, cost_note=?2, completed_at=datetime('now'), office_note=NULL WHERE id=?3")
      .bind(cost, String(fields.note || "").trim().slice(0, 400) || null, w.id).run();
    await workEvent(env, w.id, w.vendor_name, "charge_submitted", workMoney(cost) + (fields.note ? " - " + String(fields.note).slice(0, 200) : ""));
    try {
      const admins = (await env.DB.prepare("SELECT phone FROM users WHERE role IN ('super_admin','admin') AND phone IS NOT NULL AND phone != ''").all()).results || [];
      for (const a of admins) await sendText(env, a.phone, w.service + " done at " + w.property + " - " + w.vendor_name + " billed " + workMoney(cost) + ". Review the charge under Vendors in the CRM.", "work:done_ba");
    } catch (e) {}
  } else if (action === "delay_ba" && w.status === "active" && w.bill_after) {
    const reason = String(fields.reason || "").trim().slice(0, 300);
    const pd = String(fields.promised || "");
    if (!reason || !/^\d{4}-\d{2}-\d{2}$/.test(pd)) return back(env, token, "We need both.", "Tell us why it's delayed and pick the new finish date.");
    if (w.earliest_start && pd < w.earliest_start) return startErr();
    await env.DB.prepare("UPDATE work_orders SET promised_by=?1, delay_reason=?2, chase_sent_at=NULL WHERE id=?3").bind(pd, reason, w.id).run();
    await workEvent(env, w.id, w.vendor_name, "delayed", reason + " - new date " + pd);
    try {
      const phone = await staffPhone(env, w.created_by);
      if (phone) await sendText(env, phone, w.vendor_name + " pushed the " + String(w.service || "").toLowerCase() + " at " + w.property + ": “" + reason + "” - new finish date " + pd + ".", "work:delay_ba");
    } catch (e) {}
  } else if (action === "accept_batch" && w.status === "sent") {
    // the batch is exactly the CRM's: every order still waiting on THIS
    // vendor phone; prices for any other order id are ignored
    const batch = (await env.DB.prepare(
      "SELECT id, property, recurring FROM work_orders WHERE vendor_phone = ?1 AND status = 'sent' ORDER BY created_at LIMIT 16"
    ).bind(w.vendor_phone).all()).results || [];
    const note = String(fields.note || "").trim().slice(0, 400) || null;
    let quoted = 0;
    for (const o of batch) {
      const cost = workNum(fields["cost_" + o.id]);
      if (cost === null || !String(fields["cost_" + o.id] || "").trim()) continue;
      await env.DB.prepare("UPDATE work_orders SET status='quoted', cost=?1, cost_note=?2, responded_at=datetime('now'), decline_reason=NULL WHERE id=?3")
        .bind(cost, note, o.id).run();
      await workEvent(env, o.id, w.vendor_name, "quoted", workMoney(cost) + (note ? " - " + note.slice(0, 200) : ""));
      quoted++;
    }
    if (!quoted) return back(env, token, "We need at least one price.", "Go back and put a number on the properties you want. Leave the rest blank.");
  } else if (action === "decline" && w.status === "sent") {
    await env.DB.prepare("UPDATE work_orders SET status='declined', decline_reason=?1, responded_at=datetime('now') WHERE id=?2")
      .bind(String(fields.reason || "").trim().slice(0, 400) || null, w.id).run();
    await workEvent(env, w.id, w.vendor_name, "declined", String(fields.reason || "").slice(0, 200) || null);
  } else if (action === "done" && w.status === "active" && !w.recurring) {
    await env.DB.prepare("UPDATE work_orders SET status='completed', completed_at=datetime('now') WHERE id=?1").bind(w.id).run();
    await workEvent(env, w.id, w.vendor_name, "completed", "marked done by vendor");
  }
  return new Response(null, { status: 302, headers: { ...BASE_HEADERS, Location: "/work/" + token } });
}
