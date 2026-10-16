import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Reader } from "@/components/Reader";
import { Rail } from "@/components/Rail";
import { getPart, getSeries } from "@/lib/library";
import { gateForPart } from "@/lib/access";
import { getCurrentUser, userKey } from "@/lib/auth";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getPart(slug);
  return {
    title: found?.part.title ?? "Reader",
    description: found?.part.synopsis,
  };
}

export default async function ReadPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const found = getPart(slug);
  if (!found) notFound();

  const { series, part } = found;
  const user = await getCurrentUser();
  const gate = gateForPart(part, user);

  const index = series.parts.findIndex((p) => p.slug === part.slug);
  const prev = index > 0 ? series.parts[index - 1] : null;
  const next = index >= 0 && index < series.parts.length - 1 ? series.parts[index + 1] : null;

  if (gate.allowed) {
    return (
      <Reader
        part={{
          slug: part.slug,
          title: part.title,
          number: part.number,
          pagesHint: part.pages ?? null,
          seriesSlug: series.slug,
          seriesTitle: series.title,
        }}
        prev={prev ? { slug: prev.slug, title: prev.title } : null}
        next={next ? { slug: next.slug, title: next.title } : null}
        canDownload
        userKey={userKey(user)}
      />
    );
  }

  /* ------------------------------------------------------------- the gate */
  const openParts = series.parts.filter((p) => p.access === "public").slice(0, 12);

  return (
    <div className="relative isolate min-h-svh">
      <div className="absolute inset-0 -z-10">
        <Image src={part.backdrop || series.backdrop} alt="" fill sizes="100vw" className="object-cover object-top" />
        <div className="absolute inset-0 scrim-hero" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="mx-auto max-w-[1000px] px-5 pt-28 pb-16 md:px-10 md:pt-36">
        <p className="text-[10.5px] font-semibold tracking-[0.34em] text-coral-400 uppercase">
          {gate.needsSignIn ? "Members' vault" : "Access complete"} · {series.title}
        </p>
        <h1 className="mt-3 font-display text-3xl leading-tight font-bold text-cream md:text-5xl">
          {part.title}
        </h1>
        <p className="mt-4 max-w-2xl font-serif text-[1.15rem] leading-relaxed text-cream/85">
          {part.synopsis}
        </p>

        <div className="mt-8 max-w-xl rounded-2xl border border-gold-600/30 bg-ink-900/80 p-6 backdrop-blur">
          <p className="font-serif text-[1.08rem] leading-relaxed text-cream/85">{gate.reason}</p>
          <div className="mt-5 flex flex-wrap gap-3">
            {gate.needsSignIn ? (
              <>
                <Link href={`/signup?next=/read/${part.slug}`} className="btn btn-gold text-sm">
                  Create free account
                </Link>
                <Link href={`/signin?next=/read/${part.slug}`} className="btn btn-ghost text-sm">
                  I already have one
                </Link>
              </>
            ) : (
              <>
                <Link href={`/membership?next=/read/${part.slug}`} className="btn btn-gold text-sm">
                  Unlock the vault
                </Link>
                <Link href="/membership#giving" className="btn btn-ghost text-sm">
                  Buy a coffee instead
                </Link>
              </>
            )}
          </div>
          <ul className="mt-6 space-y-2 text-[12.5px] text-cream-dim">
            <li>· Cinematic reader with bookmarks and resume-where-you-stopped</li>
            <li>· PDF downloads of every volume while your access is active</li>
            <li>· The Bereshit Lab Bible Technology engine</li>
            <li>· Every new volume and comic issue as it ships</li>
          </ul>
        </div>

        {openParts.length > 0 && (
          <p className="mt-8 text-[12.5px] text-cream-dim">
            {openParts.length} parts of this series are open to everyone right now —{" "}
            <Link href={`/read/${openParts[0].slug}`} className="text-gold-400 underline decoration-gold-600/50">
              start with {openParts[0].title}
            </Link>
            .
          </p>
        )}
      </div>

      <div className="pb-10">
        <Rail
          eyebrow="Open to everyone"
          title={`Free parts of ${series.title}`}
          href={`/series/${series.slug}`}
          items={openParts.map((p) => ({
            slug: p.slug,
            title: p.title,
            poster: p.poster || series.poster,
            seriesTitle: series.title,
            access: "public" as const,
            meta: `Part ${p.number}`,
          }))}
        />
      </div>
    </div>
  );
}
