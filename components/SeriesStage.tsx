"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Series } from "@/lib/types";
import { cn } from "@/lib/utils";

export function SeriesStage({
  series,
  initialPartSlug,
  canOpenMembers,
}: {
  series: Series;
  initialPartSlug?: string;
  canOpenMembers: boolean;
}) {
  const initial = Math.max(
    0,
    series.parts.findIndex((p) => p.slug === initialPartSlug),
  );
  const [index, setIndex] = useState(initial);
  const part = series.parts[index] ?? series.parts[0];

  if (!part) {
    return (
      <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
        <h1 className="font-display text-3xl font-bold text-cream">{series.title}</h1>
        <p className="mt-4 text-cream-dim">Parts for this series are still being uploaded.</p>
      </div>
    );
  }

  const locked = part.access === "members" && !canOpenMembers;

  return (
    <section className="relative isolate">
      {/* Switching the part switches the attached art — the stage follows the selection. */}
      <div className="relative h-[64svh] min-h-[460px] w-full overflow-hidden md:h-[74svh]">
        {series.parts.map((p, i) => (
          <div
            key={p.slug}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              i === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={p.backdrop || series.backdrop}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn("object-cover object-top", i === index && "animate-ken")}
            />
          </div>
        ))}
        <div className="absolute inset-0 scrim-hero" />
        <div className="grain absolute inset-0" />

        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pt-24 pb-6 md:justify-center md:px-10 md:pb-16">
          <div key={part.slug} className="max-w-2xl animate-fade-up">
            <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-400 uppercase">
              {series.badge} · {series.title}
            </p>
            <h1 className="mt-3 font-display text-[1.75rem] leading-tight font-bold text-cream drop-shadow-hero md:text-[3rem]">
              {part.title}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 text-[12px] text-cream-dim">
              <span>★ {series.rating.toFixed(1)}</span>
              <span className="text-gold-600/60">·</span>
              <span>{series.year}</span>
              <span className="text-gold-600/60">·</span>
              <span>
                Part {part.number} of {series.parts.length}
              </span>
              {part.pages ? (
                <>
                  <span className="text-gold-600/60">·</span>
                  <span>{part.pages} pages</span>
                </>
              ) : null}
              <span className="text-gold-600/60">·</span>
              <span className={part.access === "public" ? "text-teal-400" : "text-coral-400"}>
                {part.access === "public" ? "Free to read" : "Members' vault"}
              </span>
            </div>
            <p className="mt-4 max-w-xl font-serif text-[1.05rem] leading-relaxed text-cream/85 md:text-[1.15rem]">
              {part.synopsis}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {locked ? (
                <>
                  <Link href={`/read/${part.slug}`} className="btn btn-gold text-sm">
                    <PlayIcon /> Preview & unlock
                  </Link>
                  <Link href="/signup" className="btn btn-ghost text-sm">
                    Start 3 free months
                  </Link>
                </>
              ) : (
                <>
                  <Link href={`/read/${part.slug}`} className="btn btn-gold text-sm">
                    <PlayIcon /> Read now
                  </Link>
                  {part.trailerUrl && (
                    <a href={part.trailerUrl} target="_blank" rel="noreferrer" className="btn btn-ghost text-sm">
                      Watch trailer
                    </a>
                  )}
                  <a
                    href={`/api/read/${part.slug}?download=1`}
                    className="btn btn-ghost text-sm"
                    download
                  >
                    Download PDF
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Episodes */}
      <div className="mx-auto max-w-[1400px] px-5 md:px-10">
        <div className="mt-6 flex items-end justify-between gap-4">
          <h2 className="font-display text-lg font-bold text-cream md:text-[22px]">
            Parts &amp; volumes
          </h2>
          <span className="text-[11.5px] text-cream-dim">
            {series.parts.filter((p) => p.access === "public").length} open ·{" "}
            {series.parts.filter((p) => p.access === "members").length} in the vault
          </span>
        </div>

        <div className="rail mt-4 px-0">
          {series.parts.map((p, i) => (
            <button
              key={p.slug}
              onClick={() => {
                setIndex(i);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="group w-[150px] text-left md:w-[178px]"
              aria-current={i === index}
            >
              <div
                className={cn(
                  "relative aspect-[2/3] overflow-hidden rounded-md transition-all duration-500",
                  i === index
                    ? "ring-2 ring-gold-500 ring-offset-2 ring-offset-ink-950"
                    : "opacity-75 ring-1 ring-cream/10 hover:opacity-100",
                )}
              >
                <Image src={p.poster || series.poster} alt={p.title} fill sizes="178px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 to-transparent" />
                <span className="absolute bottom-1.5 left-1.5 rounded bg-ink-950/80 px-1.5 py-0.5 text-[10px] font-bold text-cream">
                  {p.number}
                </span>
                {p.access === "members" && (
                  <span className="lock-ribbon absolute top-0 right-0 rounded-bl-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                    Vault
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[12px] leading-snug text-cream-dim group-hover:text-cream">
                {p.title}
              </p>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current" aria-hidden="true">
      <path d="M6 3.8v12.4L16.4 10 6 3.8Z" />
    </svg>
  );
}
