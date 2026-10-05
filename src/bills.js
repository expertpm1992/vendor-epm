/* Vendor bills, vendor side. Ported from expertpm-crm/worker.js
   (apiVendorProperties, apiVendorBillsList, apiVendorBillSubmit,
   vendorFileGet).

   A vendor submits a bill (invoice #, amount, work date, optional property,
   description, and the invoice file) and watches its status. The office
   reviews, approves (books it in DoorLoop) or rejects with a reason, in
   service-epm (the CRM until launch). The Google Drive archive of invoices
   is the CRM's vendorDriveSweep cron, not this app.

   Shared-table writes made here (exactly the CRM's vendor-side write):
   - vendor_bills: INSERT of a new bill for the signed-in vendor
   - KV VENDOR_FILES: the invoice file at vb/<vendor id>/<ts>-<name> */

import { json, fileResponse } from "./http.js";
import { ensureVendorTables } from "./db.js";
import { dlProperties } from "./dl.js";

export const VENDOR_FILE_MAX = 8 * 1024 * 1024; // 8 MB per invoice attachment
export const VENDOR_FILE_TYPES = { "application/pdf": "pdf", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/heic": "heic" };

export async function apiVendorProperties(env) {
  return json({ properties: await dlProperties(env) });
}

export async function apiVendorBillsList(env, v) {
  await ensureVendorTables(env);
  const rows = await env.DB.prepare(
    "SELECT id, invoice_no, amount, work_date, property_name, description, file_name, status, reject_reason, created_at, reviewed_at FROM vendor_bills WHERE vendor_id = ?1 ORDER BY id DESC LIMIT 100"
  ).bind(v.id).all();
  return json({ bills: rows.results || [] });
}

export async function apiVendorBillSubmit(req, env, v) {
  await ensureVendorTables(env);
  let fd;
  try { fd = await req.formData(); } catch (e) { return json({ error: "Bad upload" }, 400); }
  const amount = Math.round(Number(fd.get("amount")) * 100) / 100;
  const invoiceNo = String(fd.get("invoice_no") || "").trim().slice(0, 60);
  const workDate = String(fd.get("work_date") || "").trim().slice(0, 10);
  const description = String(fd.get("description") || "").trim().slice(0, 500);
  const propId = String(fd.get("property") || "").trim();
  if (!isFinite(amount) || amount <= 0) return json({ error: "Enter the bill amount" }, 400);
  if (!description && !invoiceNo) return json({ error: "Add an invoice number or a short description of the work" }, 400);
  let propName = "";
  if (propId) {
    const pr = (await dlProperties(env)).find((x) => x.id === propId);
    if (!pr) return json({ error: "Pick a property from the list" }, 400);
    propName = pr.name;
  }
  let fileKey = null, fileName = null, fileType = null;
  const file = fd.get("file");
  if (file && typeof file === "object" && typeof file.arrayBuffer === "function" && file.size > 0) {
    if (!VENDOR_FILE_TYPES[file.type]) return json({ error: "Attach a PDF or photo (PDF, JPG, PNG, WEBP, HEIC)" }, 400);
    if (file.size > VENDOR_FILE_MAX) return json({ error: "That file is over 8 MB. Export a smaller PDF or photo." }, 400);
    if (!env.VENDOR_FILES) return json({ error: "File storage isn't configured. Submit without the attachment and tell ExpertPM." }, 400);
    fileName = String(file.name || "invoice").slice(0, 120);
    fileType = file.type;
    fileKey = "vb/" + v.id + "/" + Date.now() + "-" + fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
    await env.VENDOR_FILES.put(fileKey, await file.arrayBuffer(), { metadata: { type: fileType, name: fileName } });
  }
  const ins = await env.DB.prepare(
    "INSERT INTO vendor_bills (vendor_id, invoice_no, amount, work_date, property, property_name, description, file_key, file_name, file_type) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)"
  ).bind(v.id, invoiceNo || null, amount, /^\d{4}-\d{2}-\d{2}$/.test(workDate) ? workDate : null, propId || null, propName || null, description || null, fileKey, fileName, fileType).run();
  return json({ ok: true, id: ins.meta.last_row_id });
}

/* Streams a bill's invoice file. Vendors may only open their own. */
export async function vendorFileGet(env, billId, vendorId) {
  await ensureVendorTables(env);
  const bill = await env.DB.prepare("SELECT vendor_id, file_key, file_name, file_type FROM vendor_bills WHERE id = ?1").bind(billId).first();
  if (!bill || !bill.file_key) return json({ error: "no file" }, 404);
  if (bill.vendor_id !== vendorId) return json({ error: "forbidden" }, 403);
  if (!env.VENDOR_FILES) return json({ error: "file storage not configured" }, 500);
  const got = await env.VENDOR_FILES.getWithMetadata(bill.file_key, "arrayBuffer");
  if (!got || !got.value) return json({ error: "file missing" }, 404);
  return fileResponse(got.value, bill.file_type || "application/octet-stream", bill.file_name || "invoice");
}
