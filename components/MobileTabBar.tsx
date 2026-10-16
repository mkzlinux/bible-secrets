"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/", label: "Home", icon: HomeIcon },
  { href: "/series", label: "Series", icon: LibraryIcon },
  { href: "/live", label: "Live", icon: BroadcastIcon },
  { href: "/bible-technology", label: "Engine", icon: WheelIcon },
  { href: "/account", label: "You", icon: UserIcon },
];

export function MobileTabBar() {
  const pathname = usePathname();
  if (pathname.startsWith("/read/") || pathname.startsWith("/admin")) return null;

  return (
    <nav className="glass-bar fixed inset-x-0 bottom-0 z-50 pb-[env(safe-area-inset-bottom)] lg:hidden">
      <ul className="mx-auto flex max-w-lg items-stretch justify-between px-2">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2.5 text-[10px] font-semibold tracking-wider uppercase transition-colors",
                  active ? "text-gold-400" : "text-cream-dim/70",
                )}
              >
                <Icon active={active} />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <path d="M4 10.6 12 4l8 6.6V20H4z" strokeLinejoin="round" />
    </svg>
  );
}
function LibraryIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <rect x="3.5" y="4.5" width="4.6" height="15" rx="1" />
      <rect x="10" y="4.5" width="4.6" height="15" rx="1" />
      <path d="M17.4 5.6 21 20" strokeLinecap="round" />
    </svg>
  );
}
function BroadcastIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <circle cx="12" cy="12" r="2.4" />
      <path d="M7.8 7.8a6 6 0 0 0 0 8.4M16.2 16.2a6 6 0 0 0 0-8.4M4.9 4.9a10 10 0 0 0 0 14.2M19.1 19.1a10 10 0 0 0 0-14.2" strokeLinecap="round" />
    </svg>
  );
}
function WheelIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="2.6" />
      <path d="M12 4v4M12 16v4M4 12h4M16 12h4" strokeLinecap="round" />
    </svg>
  );
}
function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className={cn("h-5 w-5", active ? "fill-current" : "fill-none stroke-current")} strokeWidth="1.6">
      <circle cx="12" cy="8.6" r="3.6" />
      <path d="M4.8 20c1.4-3.6 4-5.2 7.2-5.2s5.8 1.6 7.2 5.2" strokeLinecap="round" />
    </svg>
  );
}
