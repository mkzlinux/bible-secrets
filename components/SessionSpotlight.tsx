"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { countdown } from "@/lib/utils";

export function SessionSpotlight({
  title,
  description,
  poster,
  startsAt,
  whatsappUrl,
  host,
}: {
  title: string;
  description: string;
  poster: string;
  startsAt: string;
  whatsappUrl: string;
  host: string;
}) {
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const c = useMemo(() => countdown(startsAt, now ?? new Date()), [startsAt, now]);

  return (
    <section className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12">
      <div className="relative overflow-hidden rounded-2xl border border-cream/10 bg-ink-900/70">
        <div className="grid md:grid-cols-[minmax(0,1fr)_320px]">
          <div className="relative z-10 p-6 md:p-10">
            <p className="flex items-center gap-2 text-[10.5px] font-semibold tracking-[0.34em] text-coral-400 uppercase">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-coral-400" />
              Live on WhatsApp · Tuesday 8PM
            </p>
            <h2 className="mt-3 font-display text-2xl font-bold text-cream md:text-[34px]">
              {title}
            </h2>
            <p className="mt-3 max-w-xl font-serif text-[1.05rem] leading-relaxed text-cream/80">
              {description}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              {(c.days > 0 || c.hours > 0 || c.minutes > 0) && !c.past ? (
                <div className="flex items-center gap-3">
                  {[
                    { label: "Days", value: c.days },
                    { label: "Hrs", value: c.hours },
                    { label: "Min", value: c.minutes },
                    { label: "Sec", value: c.seconds },
                  ].map((unit) => (
                    <div
                      key={unit.label}
                      className="min-w-[58px] rounded-lg border border-cream/10 bg-ink-950/70 px-3 py-2 text-center"
                    >
                      <span className="block font-display text-xl font-bold text-gold-400">
                        {String(unit.value).padStart(2, "0")}
                      </span>
                      <span className="text-[9.5px] tracking-[0.2em] text-cream-dim uppercase">
                        {unit.label}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <span className="btn btn-gold text-sm">Session open now</span>
              )}
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {whatsappUrl ? (
                <a href={whatsappUrl} target="_blank" rel="noreferrer" className="btn btn-gold text-sm">
                  Join the session
                </a>
              ) : (
                <Link href="/live" className="btn btn-gold text-sm">
                  Session details & notes
                </Link>
              )}
              <Link href="/live" className="btn btn-ghost text-sm">
                Past session notes
              </Link>
            </div>
            <p className="mt-4 text-[11.5px] text-cream-dim/70">Hosted by {host}.</p>
          </div>

          <div className="relative h-56 md:h-auto">
            <Image src={poster} alt={title} fill sizes="(max-width: 768px) 100vw, 320px" className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-900 via-ink-900/40 to-transparent md:from-ink-900 md:via-ink-900/20" />
          </div>
        </div>
      </div>
    </section>
  );
}
