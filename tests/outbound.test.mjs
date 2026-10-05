// Side effects: off by default; when off, nothing is sent and the would-be
// text is recorded. The footer matches the CRM's Staff Automation line.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { sendText, sideEffectsOn, staffLineText, STAFF_LINE_FOOTER } from "../src/outbound.js";
import { seededEnv } from "./helpers.mjs";

test("side effects are off unless SIDE_EFFECTS is exactly \"1\"", () => {
  assert.equal(sideEffectsOn({}), false);
  assert.equal(sideEffectsOn({ SIDE_EFFECTS: "0" }), false);
  assert.equal(sideEffectsOn({ SIDE_EFFECTS: "true" }), false);
  assert.equal(sideEffectsOn({ SIDE_EFFECTS: "1" }), true);
  const toml = readFileSync(new URL("../wrangler.toml", import.meta.url), "utf8");
  assert.match(toml, /^SIDE_EFFECTS = "0"$/m);
  assert.doesNotMatch(toml, /^\[triggers\]/m); // and no cron jobs
});

test("off: nothing reaches the contact Worker; the text is recorded instead", async () => {
  const env = await seededEnv();
  assert.equal(await sendText(env, "5705550001", "Hello — there (Automated message, replies aren't monitored.)", "test"), false);
  assert.equal(env.CONTACT.sent.length, 0);
  const h = env.DB.raw.prepare("SELECT kind, to_addr, body, source FROM vendor_portal_held").all().map((r) => ({ ...r }));
  assert.deepEqual(h, [{ kind: "text", to_addr: "5705550001", body: "Hello - there\n\n" + STAFF_LINE_FOOTER, source: "test" }]);
  assert.equal(await sendText(env, "", "no phone"), false);
  assert.equal(env.DB.raw.prepare("SELECT COUNT(*) n FROM vendor_portal_held").get().n, 1);
});

test("on: sends through the contact Worker, exactly as the CRM does", async () => {
  const env = await seededEnv({ SIDE_EFFECTS: "1" });
  assert.equal(await sendText(env, "5705550001", "Hi"), true);
  assert.deepEqual(env.CONTACT.sent, [{ password: "pw", phone: "5705550001", text: "Hi\n\n" + STAFF_LINE_FOOTER }]);
  const bare = await seededEnv({ SIDE_EFFECTS: "1", DATA_PASSWORD: undefined });
  assert.equal(await sendText(bare, "5705550001", "Hi"), false);
  assert.equal(bare.CONTACT.sent.length, 0);
  assert.equal(staffLineText(""), STAFF_LINE_FOOTER);
});

test("only outbound.js talks to the contact Worker, and only dl.js fetches an outside service", () => {
  const dir = new URL("../src/", import.meta.url);
  const files = readdirSync(dir, { recursive: true }).filter((f) => f.endsWith(".js") && !f.startsWith("views") && f !== "pages.js"); // views + pages.js are browser code (same-origin calls)
  for (const f of files) {
    const src = readFileSync(new URL(f, dir), "utf8");
    if (f !== "outbound.js") assert.doesNotMatch(src, /CONTACT\.fetch|DATA_PASSWORD/, f);
    if (f !== "dl.js") assert.doesNotMatch(src, /(?<!async )(?<![.\w])fetch\(/, f);
  }
});
