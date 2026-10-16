"use client";

import { createBrowserClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabaseConfigured = Boolean(url && anon);

let cached: ReturnType<typeof createBrowserClient> | null = null;

export function browserSupabase() {
  if (!supabaseConfigured) return null;
  if (!cached) cached = createBrowserClient(url, anon);
  return cached;
}
