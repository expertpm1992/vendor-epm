# ExpertPM Vendors (vendor-epm)

The vendor-facing portal, split out of the ExpertPM CRM
([expertpm-crm](https://github.com/expertpm1992/expertpm-crm)): what
ExpertPM's outside vendors (landscapers, cleaners, contractors) see and do.
The office side of vendor management lives in
[service-epm](https://github.com/expertpm1992/service-epm).

**Status: preview.** Nothing here is on expertpm.com yet, vendors keep using
crm.expertpm.com/vendor and the links ExpertPM texts them until launch day,
and **no texts leave this app** (`SIDE_EFFECTS = "0"`).

## How it fits with the CRM

| | CRM (`expertpm-crm`) | Vendor portal (`vendor-epm`) |
| --- | --- | --- |
| Address | crm.expertpm.com/vendor | `vendor-epm.john-a73.workers.dev` now; e.g. vendors.expertpm.com at launch |
| Database | D1 `expertpm-crm` | **the same** D1 database |
| Vendor accounts and passwords | `vendor_accounts` | **the same** table and hashing (vendors sign in with the password they have) |
| Sessions | `vendor_sess` cookie, `SESSION_SECRET` | `vendor_portal_sess` cookie, `VENDOR_PORTAL_SESSION_SECRET` (separate on purpose) |
| File storage | KV `VENDOR_FILES` | the same KV namespace, same keys |
| Texts | live | **off** in preview: recorded in `vendor_portal_held` instead |
| Cron jobs | all of them | none |

Vendors do **not** use login-epm (that's the staff sign-in).

## Inventory: every vendor-related feature in the CRM, and who owns it

| CRM feature | Routes / tables / files | Owner |
| --- | --- | --- |
| Vendor portal sign-in, sign-out, forced first-password change | `/vendor`, `/vendor/app`, `/api/vendor/login,logout,me,password/first`; `vendor_accounts` | **vendor-epm** (ported) |
| Jobs list in the portal | `/api/vendor/work`; `work_orders` | **vendor-epm** (ported) |
| Job pages texted to vendors (price one or many, accept a bill-after job, push the date, send the charge, decline, mark done, active roster, inspection photos) | `/work/<token>`, `/work/<token>/photo/<id>`; `work_orders`, `work_order_events`, `inspection_photos` (read) | **vendor-epm** (ported) |
| Quote requests, vendor side (price lines, can't-service, revise, photos) | `/api/vendor/quotes`, `/quotes/submit`, `/qphoto`; quote tables; KV `qr/` | **vendor-epm** (ported) |
| Bills, vendor side (submit with invoice, status list, open own invoice) | `/api/vendor/properties`, `/bills`, `/file/<id>`; `vendor_bills`; KV `vb/` | **vendor-epm** (ported) |
| "My Vendor Billing" (a staff login linked to a vendor account) | `/api/myvendor/*`; `vendor_accounts.crm_user_id` | **vendor-epm** (ported as: sign in here with the staff email and CRM password, get that vendor account's portal) |
| Public recruiting page "ExpertPM Official Vendors Platform" + application | `expertpm.com/vendors`, `POST /vendors/apply`; `vendor_applications`, `vendor_app_prices`; KV `vapp/` | **vendor-epm** (ported; see launch note) |
| Vendor accounts (create, temp password text, trade tags, activate, link to staff) | `/api/vendors/meta,create,toggle,linkuser` | service-epm |
| Sending work orders, approve, send back, complete, end, withdraw, edit (and their texts) | `/api/work*` | service-epm |
| Quote requests, office side (create, photos, accept / reject / revise, bulk accept, close) | `/api/vendors/quotes*`, `/api/vendors/qphoto` | service-epm |
| Bill review (approve, book to DoorLoop, reject, un-approve, paid check, office-entered bills) | `/api/vendors/bills,addbill,decide,unapprove,dlpaid,file` | service-epm |
| Vendor Email (vendors@ inbox ledger), Vendor Applications review, Vendor Leads | `/api/vendors/inbox*`, `/api/vapps*`, `/api/vendorleads*` | service-epm |
| Home-page "join our vendor network" block on expertpm.com | `vendorsHomeBlock()` | CRM (marketing site) |
| Turn Board's vendor picker | `/api/turn/vendors` | CRM (leasing) |

## What's ported

- [x] Foundation: sign-in with CRM vendor passwords, lockout, forced first password, own sessions, app shell, CI
- [x] Jobs tab and the `/work/<token>` pages
- [x] Quotes tab
- [x] Bills tab
- [x] Public vendors page and application
- [x] Staff login linked to a vendor account (the CRM's My Vendor Billing)

Coming soon (the CRM doesn't offer these to vendors either; today the office
handles them): change a password after the first one, a forgot-password
link, editing your own phone, email or trade. They show as "Coming soon" on
the Help tab.

## Shared-table writes this app makes

Exactly the writes the CRM's vendor-facing code makes today, so the office
side (service-epm, and the CRM until launch) sees the same records either way:

| Table | Write | When |
| --- | --- | --- |
| `vendor_accounts` | `last_login` | vendor signs in |
| `vendor_accounts` | `pw_salt`, `pw_hash`, `must_change_password = 0` | first-password change, only while `must_change_password = 1` |
| `work_orders` | `status 'sent' -> 'quoted'`, `cost`, `cost_note`, `responded_at`, `decline_reason = NULL` | vendor prices one job, or several on the batch sheet (only orders still `sent` on the same vendor phone) |
| `work_orders` | `status 'sent' -> 'declined'`, `decline_reason`, `responded_at` | vendor declines |
| `work_orders` | `status 'sent' -> 'active'`, `promised_by`, `chase_sent_at = NULL`, `responded_at` | vendor accepts a bill-after job |
| `work_orders` | `promised_by`, `delay_reason`, `chase_sent_at = NULL` | vendor pushes a bill-after finish date |
| `work_orders` | `status 'active' -> 'done_review'`, `cost`, `cost_note`, `completed_at`, `office_note = NULL` | vendor sends a bill-after charge |
| `work_orders` | `status 'active' -> 'completed'`, `completed_at` | vendor marks a one-time job done |
| `work_order_events` | INSERT (`quoted`, `declined`, `accepted`, `delayed`, `charge_submitted`, `completed`) | each of the above |
| `quote_prices` | upsert this vendor's line (`price`, `cant_service`, `status 'submitted'`, `revise_note = NULL`) | only lines with no price yet or marked `revise` |
| `quote_request_vendors` | `status` (`submitted` when every open line is answered, else `sent`), `submitted_at` | vendor sends prices |
| `quote_requests` | `status 'sent' -> 'submitted'` | first prices back |
| `vendor_bills` | INSERT (`status 'submitted'`) | vendor submits a bill |
| `vendor_applications`, `vendor_app_prices` | INSERT, then `texted` | someone applies |
| `vendor_portal_held` | INSERT (this app's own table) | a text is held in preview |

KV writes, same keys as the CRM: `vb/<vendor id>/<ms>-<file name>` (invoices)
and `vapp/<random>.<ext>` (certificates, rate cards). Reads: `qr/...`
(quote photos), inspection photos by the keys in `inspection_photos`.

## Texts

Vendor actions text staff, not vendors (the vendor-facing texts all come from
the office side). With `SIDE_EFFECTS = "0"` none of these leave the app; each
is recorded in `vendor_portal_held` with its `source`:

| Source | To | When |
| --- | --- | --- |
| `work:accept_ba` | the staff member who sent the job | vendor accepts a bill-after job |
| `work:delay_ba` | the staff member who sent the job | vendor pushes the finish date |
| `work:done_ba` | every super admin and office manager with a phone | vendor sends a charge |
| `quotes:submit` | the staff member who sent the request | vendor sends prices |
| `apply:confirm` | the applicant | application received |
| `apply:staff` | John, Destiny, Felicia, Scott (users 1, 5, 4, 10) | application received |

The wording is the CRM's; staff texts still say "in the CRM" because that's
where the office reviews until service-epm launches. This app sends no emails,
makes no DoorLoop writes (it only reads the property list) and no Google
Drive uploads.

## Crons

None here. These vendor-related jobs run in the CRM's 2-minute chain today
and would move at launch (service-epm's README lists the same two; they are
office-side record keeping, so service-epm is the natural owner, but only one
app may run each):

| CRM job | What it does |
| --- | --- |
| `workChaseSweep` | After 4 PM Eastern on a bill-after job's promised date, texts the vendor once to finish or give a new date. Its link is hard-coded to `https://crm.expertpm.com/work/`; point it here at launch. |
| `vendorDriveSweep` | Files every vendor bill's invoice in Google Drive (Vendor Bills / month / property) |

## Setup (one time)

**Deploy token.** GitHub → this repo → Settings → Secrets and variables →
Actions → New repository secret `CLOUDFLARE_API_TOKEN`: a Cloudflare API
token with Workers Scripts edit and D1 edit (the CRM repo uses the same kind).
Until it's added, CI runs the tests and skips the deploy.

Optional keys, each added the same way (same names and values as the CRM
Worker's secrets). Each deploy copies whichever ones exist to the Worker:

| Secret | Turns on |
| --- | --- |
| `DOORLOOP_API_KEY` | The property list on the bill form (a read; without it the list is empty and bills go in without a property) |
| `DATA_PASSWORD` | Texts, once `SIDE_EFFECTS = "1"` at launch |

The first deploy creates the Worker's `VENDOR_PORTAL_SESSION_SECRET` itself
(a random value no one sees), and later deploys leave it alone. After that,
every merge to `main` deploys automatically, and `/api/health` on the preview
address should show `dbOk: true` and `sessionSecret: true`.

## Database rules (shared with the live CRM)

- **Additive only.** New tables and new columns are fine. Never rename, drop,
  or change the meaning of anything the CRM reads. This app's only new table
  is `vendor_portal_held`.
- **Staff accounts are CRM-owned.** This app never writes to `users`.
- **One owner per cron job.** A scheduled job moves only together with its
  tool, and is removed from the CRM in the same release, so nothing runs twice.
- Preview testing uses real data. Use a dummy vendor account and dummy work
  orders when trying anything that saves.

## Development

```sh
npm test                          # unit + page tests (real SQLite stands in for D1)
npx wrangler dev                  # local run; put VENDOR_PORTAL_SESSION_SECRET in .dev.vars
npx wrangler deploy --dry-run     # check the bundle
```

`wrangler dev` uses a local, empty database by default. Seed it with a
`vendor_accounts` row to sign in; it never touches the live database unless
you pass `--remote`.

## Launch day checklist

1. Add the custom domain in `wrangler.toml`
   (`routes = [{ pattern = "vendors.expertpm.com", custom_domain = true }]`)
   and set `PREVIEW = "0"`, `APP_URL` to the new address, and
   `SIDE_EFFECTS = "1"`, in the same release that turns off the CRM's vendor
   pages, so no text is ever sent twice.
2. In service-epm, set `VENDOR_PORTAL_URL` to this app's address, so every
   new text's `/vendor` and `/work/<token>` links point here. Tokens are the
   CRM's own, so the links work unchanged.
3. Links already texted point at `crm.expertpm.com/vendor` and
   `crm.expertpm.com/work/<token>`: keep the CRM answering them, or redirect
   both paths here (same path, same token).
4. `expertpm.com/vendors` is a public, indexed page served by the CRM inside
   the live site's header and footer. Here it is a noindex preview copy.
   Decide whether expertpm.com keeps serving it (and only the form's POST
   moves) or routes `/vendors*` here; if it moves, drop the noindex on this
   page only.
5. Move `workChaseSweep` and `vendorDriveSweep` (see Crons) to whichever app
   owns them, and remove them from the CRM in the same release.
6. Tell vendors nothing: their email and password are unchanged.

## What's here

| Path | Purpose |
| --- | --- |
| `src/index.js` | Router: sign-in, app shell, job pages, vendors page, JSON API |
| `src/auth.js` | Password check against `vendor_accounts` (and linked staff logins), signed session cookies, lockout |
| `src/work.js` | Jobs list and the `/work/<token>` pages |
| `src/quotes.js` | Quote requests, vendor side |
| `src/bills.js` | Bills, vendor side |
| `src/apply.js` | Public vendors page and application |
| `src/outbound.js` | Every text, held while `SIDE_EFFECTS = "0"` |
| `src/dl.js` | DoorLoop reads (property list) |
| `src/db.js` | The CRM's vendor tables (no-ops on the live database) and this app's `vendor_portal_held` |
| `src/pages.js`, `src/views/` | Sign-in page, app shell, each tab's screen (browser code); `views/landing.js` is the CRM's vendors page, copied verbatim |
| `src/http.js` | Response helpers (security + noindex headers, em-dash scrub) |
| `tests/` | `npm test` (Node 22+, no install needed) |
| `.github/workflows/deploy.yml` | Tests on every push and PR; deploys on push to `main` |

## Behavior carried over from the CRM on purpose

- The Jobs list matches a vendor's orders by account **or** by the exact
  phone number on the order (orders sent before accounts existed), and the
  job pages' "waiting for your price" and batch pricing work by the order's
  phone number, as in the CRM. Two vendor accounts sharing one phone number
  would see each other's jobs; the office should keep phones unique.
- Bills the office has approved but not yet booked to DoorLoop (`accepted`)
  still show "Under review" to the vendor; only `approved` (booked) shows
  "Approved". Paid status (`dl_paid_at`) isn't shown to vendors.
- After the office sends a bill-after charge back with a question, the job
  page doesn't show the office's note (the text does).
- Vendor sessions last 30 days, no "remember me".
- There is no vendor password reset; the office creates accounts with the
  temporary password `#ExpertPM#` and vendors must replace it on first sign-in.
