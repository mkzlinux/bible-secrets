"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SESSION_COOKIE } from "@/lib/auth";
import { findUser, upsertUser } from "@/lib/store";

export interface AuthState {
  error?: string;
  ok?: boolean;
  message?: string;
}

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax" as const,
  path: "/",
  maxAge: 60 * 60 * 24 * 180,
};

function safeNext(value: FormDataEntryValue | null) {
  const next = typeof value === "string" ? value : "/";
  return next.startsWith("/") && !next.startsWith("//") ? next : "/";
}

export async function signUpAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const displayName = String(formData.get("displayName") ?? "").trim() || email.split("@")[0];
  const next = safeNext(formData.get("next"));

  if (!email.includes("@")) return { error: "Enter a valid email address." };
  if (password.length < 6) return { error: "Use at least 6 characters for your password." };

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { display_name: displayName } },
    });
    if (error) return { error: error.message };
    redirect(next);
  }

  if (findUser(email)) {
    return { error: "That email already has an account — sign in instead." };
  }

  upsertUser({ email, displayName, role: "reader" });
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeURIComponent(email), COOKIE_OPTS);
  redirect(next);
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));

  const supabase = await createSupabaseServerClient();
  if (supabase) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    redirect(next);
  }

  const existing = findUser(email);
  if (!existing) {
    return { error: "No account for that email yet — create one in a few seconds." };
  }
  const jar = await cookies();
  jar.set(SESSION_COOKIE, encodeURIComponent(email), COOKIE_OPTS);
  redirect(next);
}

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  if (supabase) await supabase.auth.signOut();
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  redirect("/");
}
