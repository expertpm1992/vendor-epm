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
