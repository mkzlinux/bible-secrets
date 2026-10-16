"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BrandLockup } from "./BrandMark";
import { SearchOverlay } from "./SearchOverlay";
import { cn, initials } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home" },
  { href: "/series", label: "Series" },
  { href: "/bible-technology", label: "Bible Technology" },
  { href: "/live", label: "Tuesday Live" },
  { href: "/membership", label: "Membership" },
];

export function TopNav({
  user,
}: {
  user: { displayName: string; email: string; role: string } | null;
}) {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed inset-x-0 top-0 z-50 transition-all duration-500",
          scrolled ? "glass-bar" : "bg-gradient-to-b from-ink-950/85 to-transparent",
        )}
      >
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between gap-4 px-5 md:px-10">
          <div className="flex items-center gap-8">
            <Link href="/" aria-label="Bible Secrets home">
              <BrandLockup />
            </Link>
            <nav className="hidden items-center gap-6 lg:flex">
              {LINKS.map((l) => {
                const active = l.href === "/" ? pathname === "/" : pathname.startsWith(l.href);
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "text-[12.5px] font-semibold tracking-[0.14em] uppercase transition-colors",
                      active ? "text-gold-400" : "text-cream-dim hover:text-cream",
                    )}
                  >
                    {l.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              aria-label="Search the library"
              className="flex h-9 items-center gap-2 rounded-full border border-cream/15 px-3 text-cream-dim transition-colors hover:border-gold-500/60 hover:text-cream"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.7">
                <circle cx="9" cy="9" r="5.6" />
                <path d="m13.2 13.2 3.4 3.4" strokeLinecap="round" />
              </svg>
              <span className="hidden text-[12px] tracking-wide md:inline">Search</span>
              <kbd className="hidden rounded border border-cream/20 px-1 text-[10px] text-cream-dim/80 md:inline">
                ⌘K
              </kbd>
            </button>

            {user ? (
              <Link
                href="/account"
                className="flex items-center gap-2 rounded-full border border-cream/15 py-1 pr-3 pl-1 transition-colors hover:border-gold-500/60"
              >
                <span className="grid h-7 w-7 place-items-center rounded-full bg-gradient-to-br from-gold-400 to-gold-700 text-[11px] font-bold text-ink-950">
                  {initials(user.displayName)}
                </span>
                <span className="hidden text-[12.5px] text-cream-dim md:inline">
                  {user.displayName.split(" ")[0]}
                </span>
              </Link>
            ) : (
              <>
                <Link
                  href="/signin"
                  className="rounded-full px-3 py-2 text-[12.5px] font-semibold tracking-wide text-cream-dim transition-colors hover:text-cream"
                >
                  Sign in
                </Link>
                <Link href="/signup" className="btn btn-gold hidden px-4 py-2 text-[12.5px] md:inline-flex">
                  Start free
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
    </>
  );
}
