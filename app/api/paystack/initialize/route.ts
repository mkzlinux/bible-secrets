import { NextResponse } from "next/server";
import { z } from "zod";
import { recordPayment } from "@/lib/store";
import { id } from "@/lib/store";
import { PAYSTACK_CURRENCY, PAYSTACK_SECRET_KEY } from "@/lib/config";
import { getCurrentUser } from "@/lib/auth";

const schema = z.object({
  email: z.string().email(),
  amount: z.number().positive(),
  currency: z.string().default(PAYSTACK_CURRENCY),
  next: z.string().optional(),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "bad_request" }, { status: 400 });

  const { email, amount, currency, next } = parsed.data;

  if (!PAYSTACK_SECRET_KEY) {
    // Demo mode: no keys yet, let the flow complete locally so the journey is visible.
    return NextResponse.json({ demo: true, reference: `demo_${id().slice(0, 8)}` });
  }

  const origin = new URL(request.url).origin;
  const reference = `bs_${Date.now()}_${id().slice(0, 6)}`;
  const user = await getCurrentUser();

  const res = await fetch("https://api.paystack.co/transaction/initialize", {
    method: "POST",
    headers: {
      authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      email,
      amount: Math.round(amount * 100), // minor units
      currency,
      reference,
      callback_url: `${origin}/api/paystack/verify?reference=${reference}${
        next ? `&next=${encodeURIComponent(next)}` : ""
      }`,
      metadata: {
        product: "Bible Secrets full access",
        user_id: user?.id ?? null,
      },
    }),
  });

  const data = (await res.json()) as {
    status?: boolean;
    message?: string;
    data?: { authorization_url?: string };
  };

  if (!res.ok || !data.status || !data.data?.authorization_url) {
    return NextResponse.json(
      { error: data.message ?? "paystack_initialize_failed" },
      { status: 502 },
    );
  }

  recordPayment({
    id: id(),
    reference,
    email,
    amount,
    currency,
    status: "pending",
    provider: "paystack",
    createdAt: new Date().toISOString(),
  });

  return NextResponse.json({ authorizationUrl: data.data.authorization_url, reference });
}
