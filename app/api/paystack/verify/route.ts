import { NextResponse } from "next/server";
import { findUser, id, recordPayment, setGrant, upsertUser } from "@/lib/store";
import { PAYSTACK_SECRET_KEY } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";

const DAY = 86_400_000;
const ACCESS_DAYS = 365;

async function grantFor(email: string, reference: string, source: "paid" | "admin", amount = 0, currency = "KES") {
  const record =
    findUser(email) ?? upsertUser({ email, displayName: email.split("@")[0], role: "reader" });

  const expiresAt = new Date(Date.now() + ACCESS_DAYS * DAY).toISOString();
  setGrant(record.id, { active: true, expiresAt, source });

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
    await grantFor(user.email, reference ?? `demo_${id().slice(0, 8)}`, "paid", 0, "KES");
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
    data.data?.currency ?? "KES",
  );

  return NextResponse.redirect(`${origin}${next}?status=success&reference=${reference}`);
}
