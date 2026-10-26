import { createHmac, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { findUser, id, recordPayment, setGrant, snapshot, upsertUser } from "@/lib/store";
import { ACCESS_PERIOD_DAYS, PAYSTACK_CURRENCY, PAYSTACK_SECRET_KEY } from "@/lib/config";

const DAY = 86_400_000;

/** Paystack → us. Configure this URL in the Paystack dashboard. */
export async function POST(request: Request) {
  if (!PAYSTACK_SECRET_KEY) {
    return NextResponse.json({ ok: false, reason: "paystack_not_configured" }, { status: 503 });
  }

  const raw = await request.text();
  const signature = request.headers.get("x-paystack-signature") ?? "";
  const expected = createHmac("sha512", PAYSTACK_SECRET_KEY).update(raw).digest("hex");

  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ ok: false, reason: "bad_signature" }, { status: 401 });
  }

  const event = JSON.parse(raw) as {
    event?: string;
    data?: {
      reference?: string;
      amount?: number;
      currency?: string;
      customer?: { email?: string };
    };
  };

  if (event.event === "charge.success" && event.data?.customer?.email) {
    const email = event.data.customer.email;
    const amount = (event.data.amount ?? 0) / 100;
    const currency = event.data.currency ?? PAYSTACK_CURRENCY;
    const reference = event.data.reference ?? `webhook_${id().slice(0, 8)}`;

    const record =
      findUser(email) ?? upsertUser({ email, displayName: email.split("@")[0], role: "reader" });

    const existing = snapshot().grants[record.id];
    const floor = existing?.expiresAt ? Math.max(Date.now(), new Date(existing.expiresAt).getTime()) : Date.now();
    setGrant(record.id, {
      active: true,
      expiresAt: new Date(floor + ACCESS_PERIOD_DAYS * DAY).toISOString(),
      source: "paid",
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
  }

  return NextResponse.json({ ok: true });
}
