import Link from "next/link";
import { redirect } from "next/navigation";
import { signOutAction } from "@/app/actions/auth";
import { Rail } from "@/components/Rail";
import { entitlementFor, TRIAL_DAYS } from "@/lib/access";
import { getCurrentUser, userKey } from "@/lib/auth";
import { allParts, getSessions } from "@/lib/library";
import { snapshot } from "@/lib/store";
import { formatDate, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Your account" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/signin?next=/account");

  const entitlement = entitlementFor(user);
  const parts = allParts();
  const store = snapshot();
  const key = userKey(user);
  const progress = store.progress.filter((p) => p.userKey === key).slice(0, 8);
  const bookmarks = store.bookmarks.filter((b) => b.userKey === key).slice(0, 8);
  const payments = store.payments.filter((p) => p.email.toLowerCase() === user.email.toLowerCase());
  const sessions = getSessions();

  const continueItems = progress.flatMap((record) => {
    const found = parts.find(({ part }) => part.slug === record.partSlug);
    if (!found) return [];
    return [
      {
        slug: record.partSlug,
        title: found.part.title,
        poster: found.part.poster || found.series.poster,
        seriesTitle: found.series.title,
        access: found.part.access,
        meta: record.pageCount ? `Page ${record.page} of ${record.pageCount}` : "In progress",
        progress: record.pageCount ? record.page / record.pageCount : 0,
      },
    ];
  });

  return (
    <div className="mx-auto max-w-[1400px] px-5 pt-28 pb-16 md:px-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
            Your account
          </p>
          <h1 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">
            {user.displayName}
          </h1>
          <p className="mt-2 text-[13px] text-cream-dim">{user.email}</p>
        </div>
        <form action={signOutAction}>
          <button className="btn btn-ghost text-sm">Sign out</button>
        </form>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-4">
        <Tile label="Access" value={entitlement.active ? "Open" : "Paused"} accent={entitlement.active} />
        <Tile
          label="Source"
          value={
            entitlement.source === "trial"
              ? "Trial"
              : entitlement.source === "paid"
                ? "Paid"
                : entitlement.source === "admin"
                  ? "Staff"
                  : "None"
          }
        />
        <Tile
          label={entitlement.source === "trial" ? "Days left" : "Access ends"}
          value={
            entitlement.source === "trial" && entitlement.daysLeft !== null
              ? String(entitlement.daysLeft)
              : entitlement.expiresAt
                ? formatDate(entitlement.expiresAt)
                : "—"
          }
        />
        <Tile label="Member since" value={formatDate(user.accessStartedAt)} />
      </div>

      <div className="mt-6 rounded-2xl border border-gold-600/25 bg-gradient-to-r from-ink-800 to-ink-950 p-6">
        <p className="font-serif text-[1.08rem] leading-relaxed text-cream/85">{entitlement.reason}</p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link href="/membership" className="btn btn-gold text-sm">
            {entitlement.source === "paid" ? "Manage membership" : "Unlock full access"}
          </Link>
          <Link href="/bible-technology" className="btn btn-ghost text-sm">
            Open Bible Technology
          </Link>
          <Link href="/membership#giving" className="btn btn-ghost text-sm">
            Buy a coffee
          </Link>
        </div>
        <p className="mt-3 text-[11.5px] text-cream-dim/80">
          Trial length is {TRIAL_DAYS} days from the day you joined. Nothing is charged
          automatically.
        </p>
      </div>

      {continueItems.length > 0 && (
        <div className="mt-8">
          <Rail eyebrow="Saved reading position" title="Continue Reading" items={continueItems} variant="wide" />
        </div>
      )}

      <div className="mt-10 grid gap-6 md:grid-cols-2">
        <section className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
          <h2 className="font-display text-lg font-bold text-cream">Bookmarks</h2>
          {bookmarks.length === 0 ? (
            <p className="mt-3 text-[13px] text-cream-dim">
              No bookmarks yet — in the reader, tap the ribbon to mark a page.
            </p>
          ) : (
            <ul className="mt-3 space-y-2">
              {bookmarks.map((b) => (
                <li key={b.id} className="flex items-center justify-between gap-3 text-[13px]">
                  <Link href={`/read/${b.partSlug}`} className="truncate text-cream hover:text-gold-400">
                    {b.label || b.partSlug}
                  </Link>
                  <span className="shrink-0 text-cream-dim">p{b.page}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
          <h2 className="font-display text-lg font-bold text-cream">Payments & giving</h2>
          {payments.length === 0 ? (
            <p className="mt-3 text-[13px] text-cream-dim">
              Nothing on record yet. Your free months are running.
            </p>
          ) : (
            <ul className="mt-3 space-y-2 text-[13px]">
              {payments.map((p) => (
                <li key={p.id} className="flex items-center justify-between gap-3">
                  <span className="truncate text-cream-dim">{p.reference}</span>
                  <span className="text-cream">
                    {p.currency} {p.amount.toLocaleString()}
                  </span>
                  <span
                    className={
                      p.status === "success" ? "text-teal-400" : p.status === "pending" ? "text-gold-400" : "text-coral-400"
                    }
                  >
                    {p.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <section className="mt-10 rounded-2xl border border-cream/10 bg-ink-900/60 p-6">
        <h2 className="font-display text-lg font-bold text-cream">Next live session</h2>
        <p className="mt-2 text-[13.5px] text-cream-dim">
          {sessions[0]?.title} · {formatDateTime(sessions[0]?.startsAt)} ·{" "}
          {sessions[0]?.whatsappUrl ? "WhatsApp group open" : "Link posted on the Live page"}
        </p>
        <Link href="/live" className="btn btn-ghost mt-4 text-sm">
          Session details
        </Link>
      </section>
    </div>
  );
}

function Tile({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-ink-900/60 p-4">
      <p className="text-[10px] font-semibold tracking-[0.24em] text-cream-dim uppercase">{label}</p>
      <p className={`mt-1 font-display text-xl font-bold ${accent ? "text-teal-400" : "text-cream"}`}>
        {value}
      </p>
    </div>
  );
}
