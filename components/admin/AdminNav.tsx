import Link from "next/link";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/library", label: "Library" },
  { href: "/admin/sessions", label: "Sessions" },
  { href: "/admin/users", label: "Members" },
];

export function AdminNav({ active }: { active: string }) {
  return (
    <nav className="no-scrollbar flex gap-1 overflow-x-auto rounded-xl border border-cream/10 bg-ink-900/70 p-1.5">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "shrink-0 rounded-lg px-4 py-2 text-[12.5px] font-semibold tracking-wide transition-colors",
            active === link.href
              ? "bg-gold-500/15 text-gold-400"
              : "text-cream-dim hover:bg-cream/5 hover:text-cream",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
