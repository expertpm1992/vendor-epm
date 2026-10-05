/* Response helpers shared by every route. */

/* House style (John, 2026-09-15, carried over from the CRM): em dashes are
   banned in everything we publish. html() scrubs every page on the way out. */
export function deDash(s) {
  return String(s == null ? "" : s).replace(/\s*&mdash;\s*/g, " - ").replace(/\s*—\s*/g, " - ");
}

export const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Robots-Tag": "noindex, nofollow",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "same-origin",
  "X-Frame-Options": "DENY",
};

export function json(obj, status = 200, extra = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { "Content-Type": "application/json", ...BASE_HEADERS, ...extra },
  });
}

export function html(body, status = 200, extra = {}) {
  return new Response(deDash(body), {
    status,
    headers: { "Content-Type": "text/html; charset=UTF-8", ...BASE_HEADERS, ...extra },
  });
}

export function redirect(location, extra = {}) {
  return new Response(null, { status: 302, headers: { Location: location, ...BASE_HEADERS, ...extra } });
}

/* A stored file (invoice, photo). Only ever called after the caller has
   checked the viewer may see it. Private, never cached by shared caches. */
export function fileResponse(body, type, name, extra = {}) {
  const h = { ...BASE_HEADERS, "Content-Type": type || "application/octet-stream", "Cache-Control": "private, no-store", ...extra };
  if (name) h["Content-Disposition"] = "inline; filename=\"" + String(name).replace(/["\\\r\n]/g, "") + "\"";
  return new Response(body, { headers: h });
}

export function notFound(text = "Not found") {
  return new Response(text, { status: 404, headers: { "Content-Type": "text/plain; charset=UTF-8", ...BASE_HEADERS } });
}

export function getCookie(req, name) {
  const c = req.headers.get("Cookie") || "";
  const m = c.match(new RegExp("(?:^|;\\s*)" + name + "=([^;]+)"));
  return m ? m[1] : null;
}

export function escHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

export function bufToHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}
