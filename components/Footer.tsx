import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function Footer({
  site,
}: {
  site: { name: string; founder: string; studio: string; verse: { ref: string; text: string } };
}) {
  return (
    <footer className="mt-16 border-t border-cream/10 bg-ink-950/80">
      <div className="mx-auto max-w-[1400px] px-5 py-12 md:px-10">
        <p className="mx-auto max-w-3xl text-center font-serif text-[1.15rem] leading-relaxed text-cream/70 italic">
          “{site.verse.text}”
          <span className="mt-2 block text-[11px] tracking-[0.3em] text-gold-500/80 uppercase not-italic">
            {site.verse.ref}
          </span>
        </p>

        <div className="mt-12 grid gap-10 border-t border-cream/10 pt-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2">
              <BrandMark className="h-7 w-7" />
              <span className="font-display text-sm font-bold tracking-[0.24em] text-cream uppercase">
                {site.name}
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed text-cream-dim">
              The teaching library of {site.founder}. Built in conjunction with {site.studio}.
            </p>
          </div>

          <FooterCol
            title="Library"
            links={[
              { href: "/series", label: "All series" },
              { href: "/series/the-return-of-melchizedek", label: "Return of Melchizedek" },
              { href: "/series/the-days-of-noah", label: "The Days of Noah" },
              { href: "/series/comic-book-issues", label: "Comic issues" },
            ]}
          />
          <FooterCol
            title="Platform"
            links={[
              { href: "/bible-technology", label: "Bible Technology" },
              { href: "/live", label: "Tuesday Live" },
              { href: "/membership", label: "Membership & giving" },
              { href: "/account", label: "Your account" },
            ]}
          />
          <FooterCol
            title="House"
            links={[
              { href: "/about", label: "What Bible Secrets is" },
              { href: "/admin", label: "Publisher dashboard" },
              { href: "/signin", label: "Sign in" },
              { href: "/signup", label: "Create account" },
            ]}
          />
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-cream/10 pt-6 text-[11px] text-cream-dim/70 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} {site.name}. All volumes authored by {site.founder}.
          </p>
          <p className="text-cream-dim/60">
            Scripture quotations are public domain (KJV / WLC). Bible Technology data: Open
            Scriptures MorphHB (CC BY 4.0) and OpenBible.info cross-references (CC BY 4.0).
          </p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: { href: string; label: string }[] }) {
  return (
    <div>
      <p className="text-[10.5px] font-semibold tracking-[0.3em] text-gold-500/80 uppercase">{title}</p>
      <ul className="mt-3 space-y-2">
        {links.map((l) => (
          <li key={l.href}>
            <Link href={l.href} className="text-[12.5px] text-cream-dim transition-colors hover:text-cream">
              {l.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
