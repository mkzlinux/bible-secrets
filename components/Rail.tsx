import Image from "next/image";
import Link from "next/link";
import { cn } from "@/lib/utils";
import type { Access } from "@/lib/types";

export interface RailItem {
  slug: string;
  title: string;
  poster: string;
  seriesTitle: string;
  access: Access;
  meta?: string;
  progress?: number;
}

export function Rail({
  title,
  href,
  items,
  variant = "poster",
  eyebrow,
}: {
  title: string;
  href?: string;
  items: RailItem[];
  variant?: "poster" | "wide";
  eyebrow?: string;
}) {
  if (items.length === 0) return null;

  return (
    <section className="relative py-3">
      <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-4 px-5 md:px-10">
        <div>
          {eyebrow && (
            <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500/80 uppercase">
              {eyebrow}
            </p>
          )}
          <h3 className="mt-1 font-display text-lg font-bold text-cream md:text-[22px]">{title}</h3>
        </div>
        {href && (
          <Link
            href={href}
            className="group flex shrink-0 items-center gap-1 text-[11.5px] font-semibold tracking-[0.16em] text-cream-dim uppercase transition-colors hover:text-gold-400"
          >
            See all
            <span className="transition-transform group-hover:translate-x-1">→</span>
          </Link>
        )}
      </div>

      <div className="rail mt-3 px-5 md:px-10">
        {items.map((item) => (
          <PosterCard key={item.slug} item={item} variant={variant} />
        ))}
      </div>
    </section>
  );
}

export function PosterCard({ item, variant }: { item: RailItem; variant: "poster" | "wide" }) {
  return (
    <Link
      href={`/read/${item.slug}`}
      className={cn(
        "card-poster group block",
        variant === "poster" ? "w-[134px] md:w-[168px]" : "w-[240px] md:w-[300px]",
      )}
    >
      <div className={cn("relative", variant === "poster" ? "aspect-[2/3]" : "aspect-video")}>
        <Image
          src={item.poster}
          alt={item.title}
          fill
          sizes={variant === "poster" ? "168px" : "300px"}
          className="object-cover transition-transform duration-700 group-hover:scale-[1.06]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/95 via-ink-950/10 to-transparent" />

        {item.access === "members" && (
          <span className="lock-ribbon absolute top-0 right-0 rounded-bl-md px-1.5 py-0.5 text-[9px] font-bold tracking-wider uppercase">
            Members
          </span>
        )}

        {typeof item.progress === "number" && item.progress > 0 && (
          <span className="absolute inset-x-2 bottom-2 h-[3px] overflow-hidden rounded-full bg-cream/20">
            <span
              className="block h-full rounded-full bg-gold-500"
              style={{ width: `${Math.min(100, Math.round(item.progress * 100))}%` }}
            />
          </span>
        )}

        <span className="absolute inset-0 grid place-items-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <span className="grid h-10 w-10 place-items-center rounded-full border border-cream/40 bg-ink-950/60 backdrop-blur">
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-cream">
              <path d="M6.5 4v12L16 10 6.5 4Z" />
            </svg>
          </span>
        </span>
      </div>

      <div className="px-2.5 pt-2 pb-3">
        <p className="line-clamp-2 text-[12.5px] leading-snug font-semibold text-cream">{item.title}</p>
        <p className="mt-0.5 truncate text-[11px] text-cream-dim/80">{item.meta ?? item.seriesTitle}</p>
      </div>
    </Link>
  );
}
