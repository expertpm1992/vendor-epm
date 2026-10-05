# vendor-epm: notes for Claude

The vendor-facing portal of the ExpertPM CRM, being moved out of
`expertpm-crm/worker.js`. Read README.md first.

## Who owns what

- **vendor-epm (here):** what a vendor sees and does. Sign-in, the
  `/work/<token>` job pages, quote prices, bill submission, the public
  application.
- **service-epm:** the office side of the same records. Approving vendors,
  sending work orders, requesting quotes, reviewing and approving bills,
  paying in DoorLoop.
- On shared tables (`work_orders`, `vendor_accounts`, `vendor_bills`, the quote
  tables) this app makes **only the writes the CRM's vendor-facing code makes
  today** (README "Shared-table writes"). Anything office-side goes to
  service-epm. If unsure which side something is, ask; don't guess.

## Rules that protect the live CRM

- The D1 database is the CRM's live production database. Changes must be
  additive (new tables or columns, `CREATE TABLE IF NOT EXISTS`,
  `ALTER TABLE ... ADD COLUMN` in try/catch). Never rename, drop, or
  repurpose anything the CRM reads.
- Never write to `users`. Staff accounts belong to the CRM.
- Vendor accounts and passwords stay exactly as the CRM stores them (same
  table, same PBKDF2). Vendors never use login-epm.
- Sessions are this app's own: cookie `vendor_portal_sess`, signed with
  `VENDOR_PORTAL_SESSION_SECRET`, payload `{ vid, aud: "vendor" }`. Never use
  the CRM's secret; a CRM token must not work here and vice versa.
- Token links (`/work/<token>`) keep working with the same tokens the CRM
  issues.
- Never add a cron trigger for a job the CRM still runs.
- Side effects stay OFF in preview (`SIDE_EFFECTS = "0"`): every text goes
  through `src/outbound.js`, which records it in `vendor_portal_held` instead
  of sending. No other code may call `CONTACT` or `fetch` an outside service
  except DoorLoop reads in `src/dl.js`.
- Vendors are untrusted outsiders. Every query is scoped to the signed-in
  vendor's own records (or to the work order the token grants). Files are
  served only to their owner or through the token that grants them. Every new
  vendor-facing route needs a test that vendor A can't see or change vendor
  B's data.
- Port behavior faithfully (statuses, validations, file limits, text wording),
  and keep the CRM version working until launch.

## House style

- No em dashes anywhere user-facing (pages, texts). `html()` scrubs pages, but
  don't write them in the first place.
- Keep pages noindex.
- View files are browser code inside a `String.raw` template: no backticks
  and no dollar-brace in them.
- Mobile first: vendors use this on their phones.

## Before pushing

- `npm test` must pass (CI blocks the deploy otherwise).
- `npx --yes wrangler@4 deploy --dry-run --outdir /tmp/vendor-dist` must bundle.
- Every inline `<script>` must parse; the page tests check it.
