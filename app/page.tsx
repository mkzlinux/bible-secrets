import Image from "next/image";
import Link from "next/link";
import { HeroStage } from "@/components/HeroStage";
import { Rail } from "@/components/Rail";
import { ContinueRail } from "@/components/ContinueRail";
import { SessionSpotlight } from "@/components/SessionSpotlight";
import { buildHeroSets, buildRails } from "@/lib/home";
import { getLibrary, getSessions, publicCount } from "@/lib/library";
import { entitlementFor } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import { currency, formatDateTime } from "@/lib/utils";

export default async function HomePage() {
  const library = getLibrary();
  const heroSets = buildHeroSets();
  const rails = buildRails();
  const sessions = getSessions();
  const user = await getCurrentUser();
  const entitlement = entitlementFor(user);
  const counts = publicCount();
  const { site, bibleTechnology } = library;

  return (
    <>
      <HeroStage sets={heroSets} />

      <div className="relative z-20 -mt-6 space-y-4 md:-mt-10">
        <ContinueRail />

        <Rail
          eyebrow={`${counts.public} of ${counts.total} parts open to everyone`}
          title="Free to read now"
          href="/series"
          items={rails
            .flatMap(({ series, items }) =>
              items
                .filter((i) => i.access === "public")
                .slice(0, 3)
                .map((i) => ({ ...i, meta: `${series.title} · #${i.slug.split("-").pop()}` })),
            )
            .slice(0, 14)}
        />

        <SessionSpotlight
          title={site.session.title}
          description={site.session.note}
          poster={site.session ? library.liveSession.poster : "/posters/poster-session.jpg"}
          startsAt={sessions[0]?.startsAt ?? new Date().toISOString()}
          whatsappUrl={sessions[0]?.whatsappUrl ?? ""}
          host={site.founder}
        />

        {rails.slice(0, 4).map(({ series, items }) => (
          <Rail
            key={series.slug}
            eyebrow={series.badge}
            title={series.title}
            href={`/series/${series.slug}`}
            items={items}
          />
        ))}

        {/* Bible Technology */}
        <section className="mx-auto max-w-[1400px] px-5 py-8 md:px-10 md:py-12">
          <div className="relative overflow-hidden rounded-2xl border border-teal-400/20">
            <Image
              src={bibleTechnology.poster}
              alt=""
              fill
              sizes="100vw"
              className="object-cover object-center opacity-60"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-ink-950 via-ink-950/85 to-ink-950/40" />
            <div className="relative grid gap-6 p-6 md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:p-12">
              <div>
                <p className="text-[10.5px] font-semibold tracking-[0.34em] text-teal-400 uppercase">
                  {bibleTechnology.engine} · Bible Technology
                </p>
                <h2 className="mt-3 font-display text-2xl font-bold text-cream md:text-[34px]">
                  Four indexes. One text. Nothing hidden behind the curtain.
                </h2>
                <p className="mt-3 max-w-2xl font-serif text-[1.05rem] leading-relaxed text-cream/80">
                  Words inside a word (בראשית → ב + ראשית), anagrams and temurah, a verse
                  cross-reference graph, and letter codes — each shown with the plain verse first
                  and the statistical caveat on the glass.
                </p>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {["Nested words", "Anagrams & ciphers", "Verse graph", "Letter codes (ELS)"].map(
                    (tag) => (
                      <li key={tag} className="chip">
                        {tag}
                      </li>
                    ),
                  )}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <Link href="/bible-technology" className="btn btn-gold text-sm">
                  Open Bible Technology
                </Link>
                <p className="max-w-[220px] text-[11.5px] leading-relaxed text-cream-dim">
                  Included with membership for your first {site.membership.trialDays} days.
                </p>
              </div>
            </div>
          </div>
        </section>

        {rails.slice(4).map(({ series, items }) => (
          <Rail
            key={series.slug}
            eyebrow={series.badge}
            title={series.title}
            href={`/series/${series.slug}`}
            items={items}
          />
        ))}

        {/* Membership */}
        <section className="mx-auto max-w-[1400px] px-5 py-10 md:px-10 md:py-16">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gold-600/25 bg-gradient-to-br from-ink-800 to-ink-950 p-6 md:p-9">
              <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
                Membership
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold text-cream md:text-[30px]">
                {site.membership.headline}
              </h2>
              <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-cream/80">
                {site.membership.blurb}
              </p>
              <div className="mt-5 flex flex-wrap items-center gap-3">
                <Link
                  href={user ? "/membership" : "/signup"}
                  className="btn btn-gold text-sm"
                >
                  {user ? "Manage access" : "Create free account"}
                </Link>
                <span className="text-[12.5px] text-cream-dim">
                  {currency(site.membership.priceKes, site.membership.currency)} after{" "}
                  {site.membership.trialDays} days · cancel by not paying
                </span>
              </div>
              {user && (
                <p className="mt-4 rounded-lg border border-cream/10 bg-ink-950/60 px-3 py-2 text-[12.5px] text-cream-dim">
                  {entitlement.reason}
                  {entitlement.expiresAt ? ` Ends ${formatDateTime(entitlement.expiresAt)}.` : ""}
                </p>
              )}
            </div>

            <div className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6 md:p-9">
              <p className="text-[10.5px] font-semibold tracking-[0.34em] text-coral-400 uppercase">
                Giving
              </p>
              <h2 className="mt-3 font-display text-2xl font-bold text-cream md:text-[30px]">
                {site.membership.coffee.label}
              </h2>
              <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-cream/80">
                {site.membership.coffee.blurb} Every coffee goes into editing, art and the next
                volume — not into a paywall.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link href="/membership#giving" className="btn btn-ghost text-sm">
                  Send a coffee
                </Link>
                <Link href="/about" className="btn btn-ghost text-sm">
                  What is Bible Secrets?
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
