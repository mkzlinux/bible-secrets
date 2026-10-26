import { isSupabaseConfigured } from "./supabase/server";

export { isSupabaseConfigured };

export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const BUCKETS = {
  covers: process.env.SUPABASE_BUCKET_COVERS ?? "covers",
  books: process.env.SUPABASE_BUCKET_BOOKS ?? "books",
  media: process.env.SUPABASE_BUCKET_MEDIA ?? "media",
} as const;

export const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "";
export const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY ?? "";
export const PAYSTACK_CURRENCY = process.env.PAYSTACK_CURRENCY ?? "USD";
/** Amount in the major unit (e.g. $5). Paystack wants the minor unit (×100). */
export const ACCESS_PRICE = Number(process.env.BIBLE_SECRETS_PRICE ?? "5");
/** One key fee buys this many days — the key renews monthly. */
export const ACCESS_PERIOD_DAYS = Number(process.env.BIBLE_SECRETS_PERIOD_DAYS ?? "30");

/** Server-side address of the Bereshit Lab engine (health checks). */
export const ENGINE_URL =
  process.env.BERESHIT_URL ??
  process.env.NEXT_PUBLIC_BERESHIT_URL ??
  "http://127.0.0.1:8080";

/**
 * Browser-facing mount point. `next.config.ts` proxies it to ENGINE_URL, so the
 * workbench is same-origin everywhere — no CORS, no localhost in the browser.
 */
export const ENGINE_EMBED = "/engine";
