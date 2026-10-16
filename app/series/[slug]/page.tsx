import Link from "next/link";
import { notFound } from "next/navigation";
import { SeriesStage } from "@/components/SeriesStage";
import { Rail } from "@/components/Rail";
import { getLibrary, getSeries } from "@/lib/library";
import { entitlementFor } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = getSeries(slug);
  return {
    title: series?.title ?? "Series",
    description: series?.synopsis,
  };
}

export default async function SeriesPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const series = getSeries(slug);
  if (!series) notFound();

  const user = await getCurrentUser();
  const canOpenMembers = entitlementFor(user).active;
  const library = getLibrary();
  const others = library.series.filter((s) => s.slug !== series.slug).slice(0, 8);

  return (
    <div className="pb-10">
      <SeriesStage series={series} canOpenMembers={canOpenMembers} />

      <section className="mx-auto mt-10 grid max-w-[1400px] gap-8 px-5 md:grid-cols-[minmax(0,2fr)_minmax(0,1fr)] md:px-10">
        <div>
          <h2 className="font-display text-lg font-bold text-cream md:text-[22px]">About this series</h2>
          <p className="mt-3 font-serif text-[1.08rem] leading-relaxed text-cream/80">
            {series.synopsis}
          </p>
          <p className="mt-4 text-[12.5px] leading-relaxed text-cream-dim">
            Authored and taught by Tinotenda Gwiriri. Sessions are opened live every Tuesday at
            8:00 PM CAT on WhatsApp, then edited and published here as volumes.
          </p>

          {!canOpenMembers && (
            <div className="mt-6 rounded-xl border border-gold-600/30 bg-gradient-to-r from-ink-800 to-ink-950 p-5">
              <p className="text-[10.5px] font-semibold tracking-[0.3em] text-gold-500 uppercase">
                Members&apos; vault
              </p>
              <p className="mt-2 font-serif text-[1.05rem] text-cream/85">
                {series.parts.filter((p) => p.access === "members").length} parts of this series are
                inside the vault. Create a free account — the first three months of full access are
                on us.
              </p>
              <div className="mt-4 flex flex-wrap gap-3">
                <Link href="/signup" className="btn btn-gold text-sm">
                  Create free account
                </Link>
                <Link href="/membership" className="btn btn-ghost text-sm">
                  See what access includes
                </Link>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-xl border border-cream/10 bg-ink-900/60 p-5">
            <h3 className="font-display text-base font-bold text-cream">Details</h3>
            <dl className="mt-3 space-y-2 text-[12.5px]">
              <Row label="Series" value={series.title} />
              <Row label="Parts" value={String(series.parts.length)} />
              <Row label="Year" value={String(series.year)} />
              <Row label="Rating" value={`★ ${series.rating.toFixed(1)}`} />
              <Row label="Genre" value={series.genre.join(", ")} />
              <Row label="Access" value={canOpenMembers ? "Full vault open" : "40% open"} />
            </dl>
          </div>
          <div className="rounded-xl border border-cream/10 bg-ink-900/60 p-5">
            <h3 className="font-display text-base font-bold text-cream">Formats</h3>
            <ul className="mt-3 space-y-2 text-[12.5px] text-cream-dim">
              <li>· Cinematic in-browser reader</li>
              <li>· PDF download (per volume)</li>
              <li>· Video trailers (rolling out)</li>
              <li>· Podcasts — coming after launch</li>
            </ul>
          </div>
        </aside>
      </section>

      <div className="mt-8">
        <Rail
          eyebrow="Keep walking"
          title="More from the library"
          href="/series"
          items={others.flatMap((s) =>
            (s.parts.find((p) => p.access === "public") ?? s.parts[0])
              ? [
                  {
                    slug: (s.parts.find((p) => p.access === "public") ?? s.parts[0]).slug,
                    title: s.title,
                    poster: s.poster,
                    seriesTitle: s.tagline,
                    access: (s.parts.find((p) => p.access === "public") ?? s.parts[0]).access,
                    meta: `${s.parts.length} parts`,
                  },
                ]
              : [],
          )}
        />
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-cream/5 pb-2 last:border-0">
      <dt className="text-cream-dim/70">{label}</dt>
      <dd className="text-right font-medium text-cream">{value}</dd>
    </div>
  );
}
