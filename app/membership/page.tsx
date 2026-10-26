import Image from "next/image";
import Link from "next/link";
import { PaystackButton } from "@/components/PaystackButton";
import { entitlementFor } from "@/lib/access";
import { getCurrentUser } from "@/lib/auth";
import {
  ACCESS_PERIOD_DAYS,
  ACCESS_PRICE,
  PAYSTACK_CURRENCY,
  PAYSTACK_PUBLIC_KEY,
} from "@/lib/config";
import { getLibrary } from "@/lib/library";
import { currency, formatDateTime } from "@/lib/utils";

export const metadata = { title: "Membership & giving" };

export default async function MembershipPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; reference?: string; status?: string }>;
}) {
  const { next, reference, status } = await searchParams;
  const user = await getCurrentUser();
  const entitlement = entitlementFor(user);
  const { site } = getLibrary();
  const price = ACCESS_PRICE || site.membership.price;
  const periodDays = ACCESS_PERIOD_DAYS || site.membership.periodDays || 30;

  return (
    <div className="relative isolate">
      <div className="absolute inset-0 -z-10 h-[70svh]">
        <Image src="/posters/backdrop-bereshit.jpg" alt="" fill sizes="100vw" className="object-cover object-top opacity-45" />
        <div className="absolute inset-0 bg-gradient-to-b from-ink-950/70 via-ink-950/90 to-ink-950" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 pt-32 pb-20 md:px-10 md:pt-40">
        <p className="text-[10.5px] font-semibold tracking-[0.34em] text-gold-500 uppercase">
          Membership
        </p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold text-cream md:text-5xl">
          {site.membership.headline}
        </h1>
        <p className="mt-5 max-w-2xl font-serif text-[1.12rem] leading-relaxed text-cream/80">
          {site.membership.blurb}
        </p>

        {status === "success" && (
          <p className="mt-6 rounded-xl border border-teal-400/40 bg-teal-400/10 px-4 py-3 text-[13px] text-teal-400">
            Payment received{reference ? ` (ref ${reference})` : ""}. Your access is open — thank you.
          </p>
        )}
        {status === "failed" && (
          <p className="mt-6 rounded-xl border border-coral-400/40 bg-coral-400/10 px-4 py-3 text-[13px] text-coral-400">
            That payment did not go through. Nothing was taken — try again or send us a message.
          </p>
        )}

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <Card
            title="The vault"
            price={`${currency(price, PAYSTACK_CURRENCY)} / month`}
            points={[
              `${periodDays} days per key — renews only when you pay again`,
              "Cinematic reader, bookmarks, resume",
              "PDF downloads while access is active",
              "Every new volume the week it ships",
            ]}
            cta={
              user ? (
                entitlement.active && entitlement.source === "paid" ? (
                  <span className="btn btn-ghost w-full text-sm">Access already active</span>
                ) : (
                  <PaystackButton
                    email={user.email}
                    amount={price}
                    currency={PAYSTACK_CURRENCY}
                    publicKey={PAYSTACK_PUBLIC_KEY}
                    next={next ?? "/account"}
                  />
                )
              ) : (
                <Link href={`/signup?next=${encodeURIComponent(next ?? "/membership")}`} className="btn btn-gold w-full text-sm">
                  Create account first
                </Link>
              )
            }
            highlight
          />

          <Card
            title="Bible Technology"
            price="Included"
            points={[
              "Bereshit Lab engine access",
              "Nested words, ciphers, verse graph, ELS",
              "Hebrew + English indexes",
              "Unlimited queries while your access is active",
            ]}
            cta={
              <Link href="/bible-technology" className="btn btn-ghost w-full text-sm">
                See the engine
              </Link>
            }
          />

          <Card
            id="giving"
            title={site.membership.coffee.label}
            price="Any amount"
            points={[
              "Goes to editing, artwork and printing",
              "Keeps the free 40% free",
              "No paywall attached to a coffee",
              "Reference it against the comic issues",
            ]}
            cta={
              <Link href="/about" className="btn btn-ghost w-full text-sm">
                How funds are used
              </Link>
            }
          />
        </div>

        <section className="mt-14 rounded-2xl border border-cream/10 bg-ink-900/60 p-6 md:p-9">
          <h2 className="font-display text-xl font-bold text-cream md:text-2xl">Your access</h2>
          {user ? (
            <div className="mt-4 grid gap-4 md:grid-cols-3">
              <Stat label="Signed in as" value={user.email} />
              <Stat label="Access" value={entitlement.active ? "Open" : "Paused"} />
              <Stat
                label={entitlement.source === "trial" ? "Trial ends" : "Renews"}
                value={entitlement.expiresAt ? formatDateTime(entitlement.expiresAt) : "Never expires"}
              />
            </div>
          ) : (
            <p className="mt-4 max-w-xl font-serif text-[1.05rem] text-cream/75">
              Create an account and your first {site.membership.trialDays} days are free. Nothing is
              charged automatically — after the trial, you choose whether to keep the vault open.
            </p>
          )}
          <p className="mt-5 text-[12px] leading-relaxed text-cream-dim/70">
            Payments are processed by Paystack. Card details never touch this platform. Donations
            and subscriptions are recorded in the publisher dashboard for reconciliation.
          </p>
        </section>
      </div>
    </div>
  );
}

function Card({
  title,
  price,
  points,
  cta,
  highlight,
  id,
}: {
  title: string;
  price: string;
  points: string[];
  cta: React.ReactNode;
  highlight?: boolean;
  id?: string;
}) {
  return (
    <div
      id={id}
      className={`flex flex-col rounded-2xl border p-6 ${
        highlight
          ? "border-gold-600/50 bg-gradient-to-b from-ink-800 to-ink-950 shadow-cinema"
          : "border-cream/10 bg-ink-900/60"
      }`}
    >
      <h3 className="font-display text-lg font-bold text-cream">{title}</h3>
      <p className="mt-1 font-display text-2xl font-bold text-gold-400">{price}</p>
      <ul className="mt-4 flex-1 space-y-2 text-[12.5px] text-cream-dim">
        {points.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="text-gold-500">·</span>
            {p}
          </li>
        ))}
      </ul>
      <div className="mt-6">{cta}</div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-ink-950/60 px-4 py-3">
      <p className="text-[10.5px] font-semibold tracking-[0.24em] text-cream-dim uppercase">{label}</p>
      <p className="mt-1 truncate text-[13.5px] text-cream">{value}</p>
    </div>
  );
}
