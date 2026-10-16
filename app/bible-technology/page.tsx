import Image from "next/image";
import Link from "next/link";
import { BereshitLab } from "@/components/BereshitLab";
import { ENGINE_EMBED, ENGINE_URL } from "@/lib/config";
import { entitlementFor } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";

export const metadata = { title: "Bible Technology" };

async function engineIsUp() {
  try {
    const res = await fetch(`${ENGINE_URL}/api/stats`, {
      signal: AbortSignal.timeout(1500),
      cache: "no-store",
    });
    return res.ok;
  } catch {
    return false;
  }
}

export default async function BibleTechnologyPage() {
  const [engineUp, user] = await Promise.all([engineIsUp(), getCurrentUser()]);
  const entitlement = entitlementFor(user);

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 h-[80svh]">
        <Image
          src="/posters/backdrop-bereshit.jpg"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-top opacity-70"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/85 to-ink-950" />
        <div className="grain absolute inset-0" />
      </div>

      <div className="mx-auto max-w-[1300px] px-5 pt-32 pb-10 md:px-10 md:pt-40">
        <p className="text-[10.5px] font-semibold tracking-[0.34em] text-teal-400 uppercase">
          Bible Technology · Bereshit Lab
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl leading-tight font-bold text-cream md:text-5xl">
          Four indexes on one text — with the plain verse always on screen first.
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-[1.15rem] leading-relaxed text-cream/85">
          This is the same stack behind Logos and Accordance, rebuilt from public-domain data:
          words nested inside words, anagrams and ciphers, a verse cross-reference graph, and letter
          codes. The instruments are shown plainly, including where they stop being evidence.
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <span className="chip">Default verse · Genesis 1:1</span>
          <span className="chip">Hebrew consonants</span>
          <span className="chip">Public domain only</span>
          <span className="chip">Open Scriptures · OpenBible.info</span>
          <span
            className={
              engineUp
                ? "chip border-teal-400/50 text-teal-400"
                : "chip border-coral-400/40 text-coral-400"
            }
          >
            Engine {engineUp ? "online" : "offline"}
          </span>
        </div>

        <div className="mt-8">
          <BereshitLab engineUp={engineUp} engineUrl={ENGINE_EMBED} />
        </div>

        <section className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
            <h2 className="font-display text-lg font-bold text-cream">Access</h2>
            <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-cream/80">
              {user
                ? entitlement.reason
                : `Create a free account and the engine is included for your first three months — then a small key fee keeps it open.`}
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {user ? (
                <Link href="/membership" className="btn btn-gold text-sm">
                  Manage access
                </Link>
              ) : (
                <Link href="/signup?next=/bible-technology" className="btn btn-gold text-sm">
                  Unlock full access
                </Link>
              )}
              <Link href="/membership#giving" className="btn btn-ghost text-sm">
                Buy a coffee
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
            <h2 className="font-display text-lg font-bold text-cream">The workbench</h2>
            <p className="mt-3 font-serif text-[1.05rem] leading-relaxed text-cream/80">
              The full engine is a local Flask workbench in this repository (
              <code className="rounded bg-cream/10 px-1.5 py-0.5 font-sans text-[12px]">bible-tech/</code>
              ). It compiles KJV, the WLC Hebrew text, Strong&apos;s lexicon, ~345,000
              cross-references and per-book letter streams into SQLite.
            </p>
            <Link href="/docs" className="btn btn-ghost mt-4 text-sm">
              Read the build notes
            </Link>
          </div>

          <div className="rounded-2xl border border-coral-400/25 bg-ink-900/60 p-6">
            <h2 className="font-display text-lg font-bold text-cream">What this is not</h2>
            <ul className="mt-3 space-y-2 font-serif text-[1.02rem] leading-relaxed text-cream/80">
              <li>· Not a prophecy machine, and not a claim of hidden predictions.</li>
              <li>· Not a replacement for the plain reading of the text.</li>
              <li>· Not a licence to make gematria prove doctrine.</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  );
}
