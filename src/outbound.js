/* Every outbound side effect this app can cause goes through this file.
   Vendor-facing actions text people the same way the CRM does (Staff
   Automation line, via the expertpm-contact Worker): the office when a vendor
   accepts, delays, finishes or quotes; staff and the applicant when someone
   applies. This app sends no emails, makes no DoorLoop writes and no Google
   Drive uploads (DoorLoop is only read, for the property list).

   SIDE_EFFECTS (wrangler.toml [vars]) is "0" in preview: nothing leaves the
   app. Each would-be text is recorded in this app's own table,
   vendor_portal_held, and logged, so you can see exactly what would have
   gone out. The CRM's copy of these pages keeps sending until launch day,
   when this flips to "1" in the same release that points vendors here. */

import { deDash } from "./http.js";
import { heldEnsure } from "./db.js";

export function sideEffectsOn(env) { return String(env.SIDE_EFFECTS ?? "0") === "1"; }

/* Copied from expertpm-crm/worker.js (STAFF_LINE_FOOTER / staffLineText);
   keep the footer identical so texts read the same whichever app sent them. */
export const STAFF_LINE_FOOTER = "Do not respond to this message as it's not monitored. Text ExpertPM at 272.203.5550.";

export function staffLineText(text) {
  let t = deDash(String(text == null ? "" : text)).replace(/\s*\(Automated message[^)]*\)/gi, "");
  t = t.split(STAFF_LINE_FOOTER).join("").trim();
  return t ? t + "\n\n" + STAFF_LINE_FOOTER : STAFF_LINE_FOOTER;
}

/* Text someone. Returns true only when the text really went out (the CRM's
   sendStaffText contract). `source` names the action, for the held log. */
export async function sendText(env, phone, text, source = "") {
  if (!phone) return false;
  const body = staffLineText(text);
  if (!sideEffectsOn(env)) {
    try {
      await heldEnsure(env);
      await env.DB.prepare("INSERT INTO vendor_portal_held (kind, to_addr, body, source) VALUES ('text', ?1, ?2, ?3)").bind(String(phone), body, source || null).run();
    } catch (e) { console.log("held log failed:", e.message); }
    console.log("side effects off, text held:", JSON.stringify({ to: String(phone), source, text: body }).slice(0, 500));
    return false;
  }
  if (!env.CONTACT || !env.DATA_PASSWORD) return false;
  try {
    const r = await env.CONTACT.fetch("https://expertpm-contact.john-a73.workers.dev/notify-text", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: env.DATA_PASSWORD, phone, text: body }),
    });
    const rd = await r.json().catch(() => ({}));
    if (!rd.ok) console.log("staff text not-ok", r.status, JSON.stringify(rd).slice(0, 300), "to", phone);
    return !!rd.ok;
  } catch (e) { console.log("staff text failed:", e.message); return false; }
}
