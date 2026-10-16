"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import type { HeroSet, HeroSlide } from "@/lib/hero";
import { cn } from "@/lib/utils";

const ROTATE_MS = 9000;

export function HeroStage({
  sets,
  initialSetId,
  initialSlideId,
}: {
  sets: HeroSet[];
  initialSetId?: string;
  initialSlideId?: string;
}) {
  const [setId, setSetId] = useState(initialSetId ?? sets[0]?.id ?? "originals");
  const activeSet = useMemo(
    () => sets.find((s) => s.id === setId) ?? sets[0],
    [sets, setId],
  );
  const [index, setIndex] = useState(() => {
    const idx = activeSet?.slides.findIndex((s) => s.id === initialSlideId) ?? -1;
    return idx >= 0 ? idx : 0;
  });
  const [paused, setPaused] = useState(false);
  const slides = activeSet?.slides ?? [];
  const slide: HeroSlide | undefined = slides[Math.min(index, Math.max(slides.length - 1, 0))];
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [setId]);

  useEffect(() => {
    if (paused || slides.length < 2) return;
    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    timer.current = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, ROTATE_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [paused, slides.length, setId]);

  if (!slide) return null;

  return (
    <section
      className="relative isolate"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured Bible Secrets releases"
    >
      {/* The stage: backdrop cross-fades to the art attached to the selected volume. */}
      <div className="relative h-[78svh] min-h-[520px] w-full overflow-hidden md:h-[86svh] md:min-h-[620px]">
        {slides.map((s, i) => (
          <div
            key={s.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-[1200ms] ease-[cubic-bezier(0.22,0.61,0.36,1)]",
              i === index ? "opacity-100" : "opacity-0",
            )}
            aria-hidden={i !== index}
          >
            <Image
              src={s.backdrop}
              alt=""
              fill
              priority={i === 0}
              sizes="100vw"
              className={cn(
                "object-cover object-top",
                i === index && "animate-ken",
              )}
            />
          </div>
        ))}

        <div className="absolute inset-0 scrim-hero" />
        <div className="grain absolute inset-0" />

        {/* Copy block */}
        <div className="relative z-10 mx-auto flex h-full max-w-[1400px] flex-col justify-end px-5 pb-8 md:justify-center md:px-10 md:pb-24">
          <div key={slide.id} className="max-w-xl animate-fade-up md:max-w-2xl">
            <p className="mb-3 text-[11px] font-semibold tracking-[0.4em] text-gold-400 uppercase">
              {slide.eyebrow}
            </p>
            <h2 className="font-display text-[2rem] leading-[1.05] font-bold text-cream drop-shadow-hero sm:text-5xl md:text-[3.6rem]">
              {slide.title}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12px] text-cream-dim md:text-[13px]">
              {slide.meta.map((m) => (
                <span key={m} className="after:ml-3 after:text-gold-600/60 after:content-['·'] last:after:content-['']">
                  {m}
                </span>
              ))}
            </div>
            <p className="mt-4 max-w-xl font-serif text-[1.02rem] leading-relaxed text-cream/85 md:text-[1.15rem]">
              {slide.pitch}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link href={slide.actionHref} className="btn btn-gold text-sm">
                <PlayIcon />
                {slide.actionLabel}
              </Link>
              <Link href={slide.infoHref} className="btn btn-ghost text-sm">
                <InfoIcon />
                {slide.locked ? "How to unlock" : "More info"}
              </Link>
            </div>
          </div>
        </div>

        {/* Progress dots */}
        <div className="absolute right-5 bottom-[7.5rem] z-10 hidden flex-col items-end gap-2 md:flex md:right-10 md:bottom-[9rem]">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              aria-label={s.title}
              aria-current={i === index}
              className={cn(
                "h-[3px] rounded-full transition-all duration-500",
                i === index ? "w-10 bg-gold-500" : "w-5 bg-cream/25 hover:bg-cream/50",
              )}
            />
          ))}
        </div>
      </div>

      {/* Shelf: tab strip + episode thumbnails — selecting one swaps the stage art. */}
      <div className="relative z-20 -mt-16 md:-mt-24">
        <div className="mx-auto max-w-[1400px] px-5 md:px-10">
          <div className="no-scrollbar mb-3 flex items-center gap-5 overflow-x-auto border-b border-cream/10 pb-2">
            {sets.map((s) => (
              <button
                key={s.id}
                onClick={() => setSetId(s.id)}
                className={cn(
                  "relative pb-2 text-[13px] font-semibold tracking-[0.16em] uppercase transition-colors",
                  s.id === activeSet?.id
                    ? "text-cream"
                    : "text-cream-dim/70 hover:text-cream",
                )}
              >
                {s.label}
                {s.id === activeSet?.id && (
                  <span className="absolute -bottom-[9px] left-0 h-[2px] w-full bg-gold-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="rail px-5 pb-2 md:px-10">
          {slides.map((s, i) => (
            <button
              key={s.id}
              onClick={() => setIndex(i)}
              onMouseEnter={() => setIndex(i)}
              aria-label={`Show ${s.title}`}
              className={cn(
                "group w-[132px] shrink-0 text-left md:w-[168px]",
              )}
            >
              <div
                className={cn(
                  "relative aspect-[2/3] overflow-hidden rounded-md transition-all duration-500",
                  i === index
                    ? "ring-2 ring-gold-500/90 ring-offset-2 ring-offset-ink-950"
                    : "opacity-70 ring-1 ring-cream/10 hover:opacity-100",
                )}
              >
                <Image src={s.poster} alt={s.title} fill sizes="168px" className="object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
                {s.locked && (
                  <span className="lock-ribbon absolute top-0 right-0 rounded-bl-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
                    Members
                  </span>
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-[11.5px] leading-tight text-cream-dim group-hover:text-cream">
                {s.title}
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

function InfoIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.6" aria-hidden="true">
      <circle cx="10" cy="10" r="7.5" />
      <path d="M10 9v5M10 6.6v.6" strokeLinecap="round" />
    </svg>
  );
}
