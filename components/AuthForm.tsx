"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import type { AuthState } from "@/app/actions/auth";

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: "signin" | "signup";
  action: (prev: AuthState, formData: FormData) => Promise<AuthState>;
  next: string;
}) {
  const [state, formAction] = useActionState(action, {} as AuthState);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="next" value={next} />

      {mode === "signup" && (
        <Field label="Your name" name="displayName" type="text" placeholder="Tinotenda Gwiriri" required />
      )}
      <Field label="Email" name="email" type="email" placeholder="you@example.com" required />
      <Field
        label="Password"
        name="password"
        type="password"
        placeholder={mode === "signup" ? "At least 6 characters" : "Your password"}
        required
      />

      {state.error && (
        <p className="rounded-lg border border-coral-400/40 bg-coral-400/10 px-3 py-2 text-[12.5px] text-coral-400">
          {state.error}
        </p>
      )}

      <SubmitButton label={mode === "signup" ? "Create account & open the vault" : "Sign in"} />
      <p className="text-[11.5px] leading-relaxed text-cream-dim/80">
        {mode === "signup"
          ? "Your first three months include the whole vault and the Bible Technology engine."
          : "Welcome back. Your reading position and bookmarks are kept with your account."}
      </p>
    </form>
  );
}

function Field({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[10.5px] font-semibold tracking-[0.24em] text-cream-dim uppercase">
        {label}
      </span>
      <input
        {...props}
        className="w-full rounded-xl border border-cream/15 bg-ink-900/80 px-4 py-3 text-[14px] text-cream outline-none transition-colors placeholder:text-cream-dim/40 focus:border-gold-500/70"
      />
    </label>
  );
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-gold w-full py-3 text-[14px] disabled:opacity-60">
      {pending ? "One moment…" : label}
    </button>
  );
}
