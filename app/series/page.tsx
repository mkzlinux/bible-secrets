import Image from "next/image";
import Link from "next/link";
import { getLibrary } from "@/lib/library";
import { cn } from "@/lib/utils";

export const metadata = { title: "All series" };

export default function SeriesIndexPage() {
  const library = getLibrary();

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <p className="text-[10.5px] font-semibold tracking-[0.4em] text-gold-500 uppercase">
        The library
      </p>
      <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-5xl">
        Every series, in order
      </h1>
      <p className="mt-4 max-w-2xl font-serif text-[1.1rem] leading-relaxed text-cream/75">
        {library.series.length} series and{" "}
        {library.series.reduce((n, s) => n + s.parts.length, 0)} parts. Roughly 40% of every
        series is open to anyone — sign in and the vault doors open for your first three months.
      </p>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {library.series.map((series) => {
          const open = series.parts.filter((p) => p.access === "public").length;
          return (
            <Link
              key={series.slug}
              href={`/series/${series.slug}`}
              className={cn(
                "group relative overflow-hidden rounded-2xl border border-cream/10 bg-ink-900 transition-all duration-500 hover:-translate-y-1",
                "hover:border-gold-500/50 hover:shadow-cinema",
              )}
            >
              <div className="relative aspect-[16/10]">
                <Image
                  src={series.backdrop}
                  alt=""
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950 via-ink-950/40 to-transparent" />
                <span
                  className="absolute top-3 left-3 rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.18em] uppercase"
                  style={{ backgroundColor: `${series.accent}22`, color: series.accent }}
                >
                  {series.badge}
                </span>
              </div>
              <div className="p-5">
                <h2 className="font-display text-xl font-bold text-cream">{series.title}</h2>
                <p className="mt-1 text-[12.5px] text-gold-400/90 italic">{series.tagline}</p>
                <p className="mt-3 line-clamp-3 font-serif text-[1rem] leading-relaxed text-cream/70">
                  {series.synopsis}
                </p>
                <div className="mt-4 flex items-center gap-3 text-[11.5px] text-cream-dim">
                  <span>{series.parts.length} parts</span>
                  <span className="text-gold-600/70">·</span>
                  <span>{open} free</span>
                  <span className="text-gold-600/70">·</span>
                  <span>★ {series.rating.toFixed(1)}</span>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
