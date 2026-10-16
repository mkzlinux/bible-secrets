"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { savePartAction, type AdminState } from "@/app/actions/admin";
import type { Part, Series } from "@/lib/types";

export function PartForm({
  series,
  part,
  compact = false,
}: {
  series: Series[];
  part?: Part;
  compact?: boolean;
}) {
  const [state, action] = useActionState(savePartAction, {} as AdminState);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="existingSlug" value={part?.slug ?? ""} />

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Series">
          <select
            name="seriesSlug"
            defaultValue={series[0]?.slug}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          >
            {series.map((s) => (
              <option key={s.slug} value={s.slug}>
                {s.title}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Part number">
          <input
            name="number"
            type="number"
            min={1}
            defaultValue={part?.number ?? 1}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          />
        </Field>
      </div>

      <Field label="Title">
        <input
          name="title"
          required
          defaultValue={part?.title ?? ""}
          placeholder="The Return of Melchizedek XVI"
          className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
        />
      </Field>

      {!compact && (
        <Field label="Synopsis (shown on the hero and in listings)">
          <textarea
            name="synopsis"
            rows={3}
            defaultValue={part?.synopsis ?? ""}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          />
        </Field>
      )}

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Access">
          <select
            name="access"
            defaultValue={part?.access ?? "members"}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          >
            <option value="public">Public — the open 40%</option>
            <option value="members">Members&apos; vault</option>
          </select>
        </Field>
        <Field label="Pages (optional)">
          <input
            name="pages"
            type="number"
            min={1}
            defaultValue={part?.pages ?? ""}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[13px] text-cream"
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Google Drive file id">
          <input
            name="driveId"
            defaultValue={part?.driveId ?? ""}
            placeholder="1x-xO1nbwsnX2tiYfZ4a3MLBrPrp_g210"
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 font-mono text-[12px] text-cream"
          />
        </Field>
        <Field label="Poster URL (or upload below)">
          <input
            name="poster"
            defaultValue={part?.poster ?? ""}
            placeholder="/posters/poster-noah.jpg"
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[12px] text-cream"
          />
        </Field>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <Field label="Upload poster / still">
          <input name="posterFile" type="file" accept="image/*" className="w-full text-[12px] text-cream-dim" />
        </Field>
        <Field label="Upload PDF (stored in the books bucket)">
          <input name="pdfFile" type="file" accept="application/pdf" className="w-full text-[12px] text-cream-dim" />
        </Field>
        <Field label="Trailer URL (mp4 / YouTube)">
          <input
            name="trailerUrl"
            defaultValue={part?.trailerUrl ?? ""}
            className="w-full rounded-lg border border-cream/15 bg-ink-950/70 px-3 py-2.5 text-[12px] text-cream"
          />
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

      <Submit label={part ? "Save volume" : "Add volume"} />
    </form>
  );
}

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-semibold tracking-[0.2em] text-cream-dim uppercase">
        {label}
      </span>
      {children}
    </label>
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
