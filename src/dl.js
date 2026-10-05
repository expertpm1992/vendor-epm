/* DoorLoop READS, copied from expertpm-crm/worker.js (dlGet and
   apiVendorProperties' cache). This app never writes to DoorLoop. Without
   DOORLOOP_API_KEY the property list is simply empty. */

export async function dlGet(env, path) {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch("https://app.doorloop.com/api" + path, {
      headers: { Authorization: "Bearer " + env.DOORLOOP_API_KEY, Accept: "application/json" },
    });
    if (res.status === 429 && attempt < 2) { await new Promise((r) => setTimeout(r, 1200 * (attempt + 1))); continue; }
    if (!res.ok) throw new Error("DoorLoop " + res.status + " on " + path);
    return res.json();
  }
}

/* Every DoorLoop property, id + name, cached 10 minutes per isolate (the
   CRM's VPROPS_CACHE). */
let VPROPS_CACHE = { ts: 0, props: [] };
export function resetPropertyCache() { VPROPS_CACHE = { ts: 0, props: [] }; }
export async function dlProperties(env) {
  if (!env.DOORLOOP_API_KEY) return [];
  if (Date.now() - VPROPS_CACHE.ts > 10 * 60 * 1000) {
    try {
      const rows = (await dlGet(env, "/properties?page_size=200")).data || [];
      VPROPS_CACHE = { ts: Date.now(), props: rows.map((p) => ({ id: p.id, name: p.name || "" })).sort((a, b) => a.name.localeCompare(b.name)) };
    } catch (e) {}
  }
  return VPROPS_CACHE.props;
}
