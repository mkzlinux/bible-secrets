import Image from "next/image";
import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { getLibrary } from "@/lib/library";

export const metadata = { title: "What Bible Secrets is" };

export default function AboutPage() {
  const { site } = getLibrary();

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 h-[60svh]">
        <Image src="/posters/backdrop-melchizedek.jpg" alt="" fill sizes="100vw" className="object-cover object-top opacity-40" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/60 via-ink-950/90 to-ink-950" />
      </div>

      <article className="mx-auto max-w-3xl px-5 pt-32 pb-20 md:px-10 md:pt-40">
        <div className="flex items-center gap-3">
          <BrandMark className="h-10 w-10" />
          <div>
            <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
              The house
            </p>
            <h1 className="font-display text-2xl font-bold text-cream md:text-[34px]">
              What Bible Secrets is
            </h1>
          </div>
        </div>

        <blockquote className="mt-8 border-l-2 border-gold-600/60 pl-5 font-serif text-[1.25rem] leading-relaxed text-cream/85 italic">
          “The secret things belong unto the LORD our God: but those things which are revealed
          belong unto us and to our children for ever.”
          <span className="mt-2 block text-[11px] tracking-[0.3em] text-gold-500/80 uppercase not-italic">
            Deuteronomy 29:29
          </span>
        </blockquote>

        <p className="mt-8 font-serif text-[1.15rem] leading-relaxed text-cream/85">
          {site.about}
        </p>

        <h2 className="mt-12 font-display text-xl font-bold text-cream">The mark</h2>
        <p className="mt-3 font-serif text-[1.12rem] leading-relaxed text-cream/80">
          The logo carries four wheels and a crystal line — drawn from the likeness in Ezekiel 1,
          where the wheels moved with the living creatures and above them was the platform of
          crystal. Bible Secrets takes that image literally: a platform set for transporting
          revelation out of the Word and into your hands. Not a devotional pamphlet, and not a
          prophecy toy — a house for teaching that stays anchored to the text.
        </p>

        <h2 className="mt-12 font-display text-xl font-bold text-cream">What is published here</h2>
        <ul className="mt-4 space-y-3 font-serif text-[1.1rem] leading-relaxed text-cream/80">
          <li>
            <span className="text-gold-400">Series</span> — the return of Melchizedek, the days of
            Noah, unmasking the devil, the Heis series, meditation, the Q&amp;A archive.
          </li>
          <li>
            <span className="text-gold-400">Illustrated issues</span> — Church Witchcraft and the
            comics line, with character terms published alongside.
          </li>
          <li>
            <span className="text-gold-400">Bible Technology</span> — the Bereshit Lab engine:
            nested words, anagrams and ciphers, the verse cross-reference graph and letter codes,
            always with the plain verse shown first.
          </li>
          <li>
            <span className="text-gold-400">Tuesday night</span> — the live WhatsApp session at 8:00
            PM CAT, then edited into a volume.
          </li>
        </ul>

        <h2 className="mt-12 font-display text-xl font-bold text-cream">How access works</h2>
        <p className="mt-3 font-serif text-[1.12rem] leading-relaxed text-cream/80">
          Roughly 40% of every series is open to anyone, without an account. Create a free account
          and the whole vault opens for {site.membership.trialDays} days — every locked volume, the
          engine, the downloads. After that a small key fee keeps it open, and a coffee is always
          welcome.
        </p>

        <div className="mt-10 flex flex-wrap gap-3">
          <Link href="/series" className="btn btn-gold text-sm">
            Start reading
          </Link>
          <Link href="/membership" className="btn btn-ghost text-sm">
            Membership &amp; giving
          </Link>
        </div>

        <p className="mt-12 border-t border-cream/10 pt-6 text-[12px] leading-relaxed text-cream-dim/70">
          Bible Secrets is authored and taught by {site.founder} and built in conjunction with{" "}
          {site.studio}. Scripture texts used by the Bible Technology engine are public domain:
          King James Version (KJV) and the Westminster Leningrad Codex via Open Scriptures MorphHB
          (CC BY 4.0). Cross-reference data from OpenBible.info (CC BY 4.0), derived from the
          Treasury of Scripture Knowledge.
        </p>
      </article>
    </div>
  );
}
