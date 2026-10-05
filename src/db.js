/* The CRM's vendor tables, created exactly as expertpm-crm/worker.js creates
   them (ensureVendorTables, ensureQuoteTables, workEnsure, vappEnsure). They
   already exist in the live database, so these are no-ops there; they keep a
   fresh database (tests, wrangler dev) in the same shape. Additive only:
   CREATE TABLE IF NOT EXISTS and ADD COLUMN in try/catch, the CRM's pattern.

   Plus this app's one table of its own, vendor_portal_held (what preview
   would have sent; see src/outbound.js). The CRM never reads it. */

const done = new WeakMap();
async function once(env, name, fn) {
  let set = done.get(env.DB);
  if (!set) { set = new Set(); done.set(env.DB, set); }
  if (set.has(name)) return;
  await fn();
  set.add(name);
}

async function tryAll(env, sqls) {
  for (const sql of sqls) { try { await env.DB.prepare(sql).run(); } catch (e) { /* column exists */ } }
}

export function ensureVendorTables(env) {
  return once(env, "vendor", async () => {
    await env.DB.batch([
      env.DB.prepare("CREATE TABLE IF NOT EXISTS vendor_accounts (id INTEGER PRIMARY KEY AUTOINCREMENT, dl_vendor_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, phone TEXT, pw_salt TEXT NOT NULL, pw_hash TEXT NOT NULL, must_change_password INTEGER NOT NULL DEFAULT 1, active INTEGER NOT NULL DEFAULT 1, last_login TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))"),
      env.DB.prepare("CREATE TABLE IF NOT EXISTS vendor_bills (id INTEGER PRIMARY KEY AUTOINCREMENT, vendor_id INTEGER NOT NULL, invoice_no TEXT, amount REAL NOT NULL, work_date TEXT, property TEXT, property_name TEXT, description TEXT, file_key TEXT, file_name TEXT, file_type TEXT, status TEXT NOT NULL DEFAULT 'submitted', reject_reason TEXT, dl_bill_id TEXT, account TEXT, account_name TEXT, reviewed_by INTEGER, reviewed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))"),
    ]);
    await tryAll(env, [
      "ALTER TABLE vendor_accounts ADD COLUMN trade TEXT",
      "ALTER TABLE vendor_accounts ADD COLUMN crm_user_id INTEGER",
      "ALTER TABLE vendor_bills ADD COLUMN drive_file_id TEXT",
      "ALTER TABLE vendor_bills ADD COLUMN drive_parent_id TEXT",
      "ALTER TABLE vendor_bills ADD COLUMN drive_name TEXT",
      "ALTER TABLE vendor_bills ADD COLUMN entered_by INTEGER",
      "ALTER TABLE vendor_bills ADD COLUMN adm_dl_vendor_id TEXT",
      "ALTER TABLE vendor_bills ADD COLUMN adm_dl_vendor_name TEXT",
      "ALTER TABLE vendor_bills ADD COLUMN dl_paid_at TEXT",
    ]);
  });
}

export function ensureQuoteTables(env) {
  return once(env, "quote", () => env.DB.batch([
    env.DB.prepare("CREATE TABLE IF NOT EXISTS quote_requests (id INTEGER PRIMARY KEY AUTOINCREMENT, service TEXT NOT NULL, price_basis TEXT NOT NULL, notes TEXT, due_date TEXT, status TEXT NOT NULL DEFAULT 'sent', created_by INTEGER, closed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS quote_request_vendors (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, vendor_id INTEGER NOT NULL, status TEXT NOT NULL DEFAULT 'sent', texted INTEGER NOT NULL DEFAULT 0, submitted_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS quote_request_lines (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, dl_property_id TEXT NOT NULL, property_name TEXT NOT NULL, note TEXT, photo_keys TEXT)"),
    env.DB.prepare("CREATE TABLE IF NOT EXISTS quote_prices (id INTEGER PRIMARY KEY AUTOINCREMENT, request_id INTEGER NOT NULL, vendor_id INTEGER NOT NULL, line_id INTEGER NOT NULL, price REAL, cant_service INTEGER NOT NULL DEFAULT 0, status TEXT NOT NULL DEFAULT 'submitted', revise_note TEXT, prior_price REAL, updated_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(vendor_id, line_id))"),
  ]));
}

export function workEnsure(env) {
  return once(env, "work", async () => {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS work_orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      vendor_account_id INTEGER,
      vendor_name TEXT, vendor_phone TEXT,
      service TEXT, recurring INTEGER DEFAULT 0,
      property_id TEXT, property TEXT,
      instructions TEXT, target_date TEXT,
      status TEXT NOT NULL DEFAULT 'sent',
      cost REAL, cost_note TEXT,
      decline_reason TEXT, office_note TEXT,
      token TEXT UNIQUE,
      created_by INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      responded_at TEXT, approved_at TEXT, approved_by INTEGER, completed_at TEXT, ended_at TEXT
    )`).run();
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS work_order_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      work_id INTEGER NOT NULL,
      actor TEXT, action TEXT NOT NULL, detail TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await tryAll(env, [
      "ALTER TABLE work_orders ADD COLUMN frequency TEXT",
      "ALTER TABLE work_orders ADD COLUMN bill_after INTEGER DEFAULT 0",
      "ALTER TABLE work_orders ADD COLUMN promised_by TEXT",
      "ALTER TABLE work_orders ADD COLUMN chase_sent_at TEXT",
      "ALTER TABLE work_orders ADD COLUMN delay_reason TEXT",
      "ALTER TABLE work_orders ADD COLUMN unit_id TEXT",
      "ALTER TABLE work_orders ADD COLUMN unit_name TEXT",
      "ALTER TABLE work_orders ADD COLUMN turn_id INTEGER",
      "ALTER TABLE work_orders ADD COLUMN inspection_id TEXT",
      "ALTER TABLE work_orders ADD COLUMN earliest_start TEXT",
    ]);
  });
}

export function vappEnsure(env) {
  return once(env, "vapp", async () => {
    await env.DB.prepare(`CREATE TABLE IF NOT EXISTS vendor_applications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      business_name TEXT NOT NULL, contact_name TEXT NOT NULL,
      phone TEXT NOT NULL, email TEXT NOT NULL, website TEXT,
      trades TEXT, trade_other TEXT, towns TEXT, scope TEXT,
      years INTEGER, crew TEXT, emergency TEXT, pricing TEXT,
      gl_1m INTEGER NOT NULL DEFAULT 0,
      coi_key TEXT, coi_name TEXT, coi_type TEXT, coi_expires TEXT,
      wc TEXT, hic TEXT, heard TEXT,
      status TEXT NOT NULL DEFAULT 'new',
      review_note TEXT, reviewed_by INTEGER, reviewed_at TEXT,
      ip TEXT, texted INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`).run();
    await tryAll(env, ["ALTER TABLE vendor_applications ADD COLUMN ratecard_key TEXT", "ALTER TABLE vendor_applications ADD COLUMN ratecard_name TEXT", "ALTER TABLE vendor_applications ADD COLUMN ratecard_type TEXT"]);
    await env.DB.prepare("CREATE TABLE IF NOT EXISTS vendor_app_prices (app_id INTEGER NOT NULL, trade TEXT NOT NULL, item TEXT NOT NULL, amount_cents INTEGER NOT NULL, PRIMARY KEY (app_id, trade, item))").run();
  });
}

/* This app's own table: every text preview held back instead of sending. */
export function heldEnsure(env) {
  return once(env, "held", () => env.DB.prepare(
    "CREATE TABLE IF NOT EXISTS vendor_portal_held (id INTEGER PRIMARY KEY AUTOINCREMENT, kind TEXT NOT NULL, to_addr TEXT, body TEXT, source TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')))"
  ).run());
}
