/**
 * Load (or reload) the FAKE "Demo data" responses through the admin API, the same path the
 * dashboard's "Reload demo data" button uses.
 *
 *   ADMIN_PASSCODE=... node scripts/seed-demo.mts [baseUrl]
 *   e.g. node scripts/seed-demo.mts https://sleep-smart-mru.vercel.app
 */
const base = process.argv[2] ?? "http://localhost:3000";
const passcode = process.env.ADMIN_PASSCODE;
if (!passcode) {
  console.error("Set ADMIN_PASSCODE in your environment first.");
  process.exit(1);
}
const res = await fetch(`${base}/api/admin`, {
  method: "POST",
  headers: { "Content-Type": "application/json", "x-admin-passcode": passcode },
  body: JSON.stringify({ action: "reseed_demo" }),
});
const body = await res.json().catch(() => ({}));
console.log(res.status, body);
process.exit(res.ok ? 0 : 1);
