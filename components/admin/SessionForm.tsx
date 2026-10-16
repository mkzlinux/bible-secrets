"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { saveSessionAction, type AdminState } from "@/app/actions/admin";
import { Field } from "./PartForm";
import type { LiveSession } from "@/lib/types";

export function SessionForm({ session }: { session?: LiveSession }) {
  const [state, action] = useActionState(saveSessionAction, {} as AdminState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={session?.id ?? ""} />
      <Field label="Session title">
        <input
          name="title"
          required
          defaultValue={session?.title ?? "Tuesday Night Bible Secrets"}
          className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
        />
      </Field>
      <Field label="Description / poster text">
        <textarea
          name="description"
          rows={3}
          defaultValue={session?.description ?? ""}
          placeholder="This Tuesday: the courts of heaven, part 2 — bring your questions."
          className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
        />
      </Field>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Starts at (your local time)">
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={session?.startsAt ? session.startsAt.slice(0, 16) : ""}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          />
        </Field>
        <Field label="WhatsApp group link">
          <input
            name="whatsappUrl"
            defaultValue={session?.whatsappUrl ?? ""}
            placeholder="https://chat.whatsapp.com/…"
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          />
        </Field>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Poster URL">
          <input
            name="poster"
            defaultValue={session?.poster ?? ""}
            placeholder="/posters/poster-session.jpg"
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[12px] text-cream"
          />
        </Field>
        <Field label="Upload poster">
          <input name="posterFile" type="file" accept="image/*" className="w-full text-[12px] text-cream-dim" />
        </Field>
      </div>

      {state.error && (
        <p className="rounded-lg border border-coral-400/40 bg-coral-400/10 px-3 py-2 text-[12.5px] text-coral-400">
          {state.error}
        </p>
      )}
      {state.ok && (
        <p className="rounded-lg border border-teal-400/40 bg-teal-400/10 px-3 py-2 text-[12.5px] text-teal-400">
          {state.message}
        </p>
      )}

      <Submit label={session ? "Update session" : "Publish session"} />
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="btn btn-gold text-sm disabled:opacity-60">
      {pending ? "Saving…" : label}
    </button>
  );
}
