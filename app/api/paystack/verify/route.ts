import { NextResponse } from "next/server";
import { findUser, id, recordPayment, setGrant, snapshot, upsertUser } from "@/lib/store";
import { ACCESS_PERIOD_DAYS, PAYSTACK_CURRENCY, PAYSTACK_SECRET_KEY } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";

const DAY = 86_400_000;
/** One payment extends access by one billing period (default: a month). */
const ACCESS_DAYS = ACCESS_PERIOD_DAYS;

/** Never shorten an active grant: stack the new period on top of what is left. */
function extendFrom(current?: { expiresAt: string | null } | null) {
  const now = Date.now();
  const base = current?.expiresAt ? Math.max(now, new Date(current.expiresAt).getTime()) : now;
  return new Date(base + ACCESS_DAYS * DAY).toISOString();
}

async function grantFor(
  email: string,
  reference: string,
  source: "paid" | "admin",
  amount = 0,
  currency = PAYSTACK_CURRENCY,
) {
  const record =
    findUser(email) ?? upsertUser({ email, displayName: email.split("@")[0], role: "reader" });

  setGrant(record.id, {
    active: true,
    expiresAt: extendFrom(snapshot().grants[record.id]),
    source,
  });

  recordPayment({
    id: id(),
    reference,
    email,
    amount,
    currency,
    status: "success",
    provider: "paystack",
    createdAt: new Date().toISOString(),
    paidAt: new Date().toISOString(),
  });

  return record;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const reference = url.searchParams.get("reference");
  const demo = url.searchParams.get("demo") === "1";
  const next = url.searchParams.get("next") ?? "/account";
  const origin = url.origin;

  /* --------------------------------------------------------------- demo path */
  if (demo || !PAYSTACK_SECRET_KEY) {
    const user = await getCurrentUser();
    if (!user) return NextResponse.redirect(`${origin}/signup?next=${encodeURIComponent(next)}`);
    await grantFor(user.email, reference ?? `demo_${id().slice(0, 8)}`, "paid", 0, PAYSTACK_CURRENCY);
    return NextResponse.redirect(`${origin}${next}?status=success&demo=1`);
  }

  if (!reference) {
    return NextResponse.redirect(`${origin}/membership?status=failed`);
  }

  /* ---------------------------------------------------------- real verify */
  const res = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
    headers: { authorization: `Bearer ${PAYSTACK_SECRET_KEY}` },
    cache: "no-store",
  });
  const data = (await res.json()) as {
    status?: boolean;
    data?: {
      status?: string;
      amount?: number;
      currency?: string;
      customer?: { email?: string };
    };
  };

  const ok = res.ok && data.status && data.data?.status === "success";
  if (!ok) return NextResponse.redirect(`${origin}/membership?status=failed&reference=${reference}`);

  const email = data.data?.customer?.email;
  if (!email) return NextResponse.redirect(`${origin}/membership?status=failed&reference=${reference}`);

  await grantFor(
    email,
    reference,
    "paid",
    (data.data?.amount ?? 0) / 100,
    data.data?.currency ?? PAYSTACK_CURRENCY,
  );

  return NextResponse.redirect(`${origin}${next}?status=success&reference=${reference}`);
}
