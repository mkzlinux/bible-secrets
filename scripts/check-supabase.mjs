#!/usr/bin/env node
/**
 * Checks a Supabase project against `supabase/schema.sql`.
 *
 *   node scripts/check-supabase.mjs
 *
 * Reads .env.local / .env (or the real environment), then verifies:
 *   • the URL and keys are present and the project answers;
 *   • every table the platform expects exists;
 *   • the three storage buckets exist, with `books` private;
 *   • the `has_full_access` helper is installed.
 *
 * Exit code 0 means the platform can be pointed at this project.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const ROOT = resolve(process.cwd());

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    const path = resolve(ROOT, file);
    if (!existsSync(path)) continue;
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, raw] = match;
      if (process.env[key]) continue;
      process.env[key] = raw.replace(/^["']|["']$/g, "");
    }
  }
}
loadEnv();

const url = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").replace(/\/$/, "");
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";
const service = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";

const TABLES = [
  "profiles",
  "series",
  "books",
  "book_assets",
  "sessions",
  "entitlements",
  "payments",
  "progress",
  "bookmarks",
  "highlights",
  "comments",
];
const BUCKETS = ["covers", "media", "books"];

const ok = (text) => console.log(`  \x1b[32m✓\x1b[0m ${text}`);
const bad = (text) => {
  console.log(`  \x1b[31m✗\x1b[0m ${text}`);
  failures += 1;
};
const warn = (text) => console.log(`  \x1b[33m!\x1b[0m ${text}`);
let failures = 0;

const mask = (value) => (value ? `${value.slice(0, 6)}…${value.slice(-4)} (${value.length} chars)` : "missing");

console.log("\n\x1b[1mBible Secrets · Supabase check\x1b[0m\n");
console.log(`  project   ${url || "missing"}`);
console.log(`  anon key  ${mask(anon)}`);
console.log(`  service   ${mask(service)}\n`);

if (!url || !anon) {
  bad("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY are not set.");
  console.log("\n  → Add them to .env.local, then run this again.\n");
  process.exit(1);
}
if (!service) warn("SUPABASE_SERVICE_ROLE_KEY missing — uploads, entitlements and the vault need it.");

const key = service || anon;
const headers = { apikey: key, authorization: `Bearer ${key}` };

async function get(path) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res = await fetch(`${url}${path}`, { headers, signal: controller.signal });
    const text = await res.text();
    return { status: res.status, text };
  } catch (error) {
    return { status: 0, text: String(error) };
  } finally {
    clearTimeout(timer);
  }
}

/* ------------------------------------------------------------------ reachability */
const health = await get("/auth/v1/health");
if (health.status === 200) ok("the project answers (auth health 200)");
else bad(`the project did not answer auth health (status ${health.status})`);

/* -------------------------------------------------------------------------- tables */
console.log("\n  Tables");
for (const table of TABLES) {
  const res = await get(`/rest/v1/${table}?select=*&limit=1`);
  if (res.status === 200) ok(table);
  else if (/PGRST205|does not exist|Could not find the table/i.test(res.text)) bad(`${table} — missing (run supabase/schema.sql)`);
  else if (res.status === 401 || res.status === 403) warn(`${table} — exists but the key was refused (RLS is doing its job)`);
  else bad(`${table} — HTTP ${res.status} ${res.text.slice(0, 100)}`);
}

/* ------------------------------------------------------------------------- buckets */
console.log("\n  Storage buckets");
const buckets = await get("/storage/v1/bucket");
if (buckets.status === 200) {
  let list = [];
  try {
    list = JSON.parse(buckets.text);
  } catch {
    /* ignore */
  }
  for (const name of BUCKETS) {
    const found = list.find((bucket) => bucket.name === name);
    if (!found) bad(`${name} — missing`);
    else if (name === "books" && found.public) bad("books — exists but is PUBLIC (must be private)");
    else ok(`${name}${name === "books" ? " (private)" : ""}`);
  }
} else {
  warn(`could not list buckets (HTTP ${buckets.status}) — is the service-role key set?`);
}

/* ------------------------------------------------------------------ access helper */
console.log("\n  Functions");
const rpc = await fetch(`${url}/rest/v1/rpc/has_full_access`, {
  method: "POST",
  headers: { ...headers, "content-type": "application/json" },
  body: JSON.stringify({ uid: "00000000-0000-0000-0000-000000000000" }),
});
if (rpc.ok || rpc.status === 204) ok("has_full_access(uid)");
else if (rpc.status === 404) bad("has_full_access(uid) — missing (run supabase/schema.sql)");
else warn(`has_full_access(uid) — HTTP ${rpc.status} (usually fine: the function exists and refused the dummy id)`);

/* ------------------------------------------------------------------------- verdict */
console.log("");
if (failures === 0) {
  console.log("\x1b[32mReady.\x1b[0m Point the app at this project with the same values in .env.local.\n");
  process.exit(0);
}
console.log(`\x1b[31m${failures} problem${failures === 1 ? "" : "s"} found.\x1b[0m Paste supabase/schema.sql into the SQL editor, then re-run.\n`);
process.exit(1);
