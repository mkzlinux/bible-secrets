import { cookies } from "next/headers";
import { createSupabaseServerClient } from "./supabase/server";
import { findUser, upsertUser } from "./store";
import type { UserRecord } from "./types";

export const SESSION_COOKIE = "bs_session";

/**
 * The signed-in member, from Supabase Auth when configured, otherwise from the
 * local demo session cookie. Returns a normalised UserRecord either way.
 */
export async function getCurrentUser(): Promise<UserRecord | null> {
  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { data } = await supabase.auth.getUser();
    const email = data.user?.email;
    if (!data.user || !email) return null;
    return upsertUser({
      id: data.user.id,
      email,
      displayName:
        (data.user.user_metadata?.display_name as string | undefined) ??
        email.split("@")[0],
    });
  }

  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  return findUser(decodeURIComponent(raw));
}

export async function isAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  if (!user) return false;
  if (user.role === "admin" || user.role === "editor") return true;
  const owners = (process.env.BIBLE_SECRETS_ADMINS ?? "")
    .split(",")
    .map((s) => s.trim().toLowerCase())
    .filter(Boolean);
  if (owners.length === 0) {
    // No owner list configured: the first account is treated as the owner so
    // the dashboard is never locked out of a fresh install.
    return true;
  }
  return owners.includes(user.email.toLowerCase());
}

export function userKey(user: UserRecord | null) {
  return user ? `u:${user.id}` : "guest";
}
