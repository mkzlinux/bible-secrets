"use client";

import { useState } from "react";

/**
 * Starts a Paystack transaction through our own API so the secret key stays on
 * the server, then hands off to Paystack's hosted checkout.
 * Set NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY + PAYSTACK_SECRET_KEY to go live.
 */
export function PaystackButton({
  email,
  amount,
  currency,
  publicKey,
  next,
  label,
}: {
  email: string;
  amount: number;
  currency: string;
  publicKey: string;
  next?: string;
  label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/paystack/initialize", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, amount, currency, next }),
      });
      const data = (await res.json()) as {
        authorizationUrl?: string;
        error?: string;
        demo?: boolean;
      };

      if (data.demo) {
        // No keys configured: complete the flow locally so the journey can be seen.
        window.location.href = `/api/paystack/verify?demo=1&next=${encodeURIComponent(next ?? "/account")}`;
        return;
      }
      if (data.authorizationUrl) {
        window.location.href = data.authorizationUrl;
        return;
      }
      setError(data.error ?? "Could not start the payment.");
    } catch {
      setError("Network problem — try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button onClick={start} disabled={loading} className="btn btn-gold w-full text-sm disabled:opacity-60">
        {loading ? "Opening checkout…" : (label ?? `Pay ${currency} ${amount}`)}
      </button>
      {!publicKey && (
        <p className="mt-2 text-center text-[11px] text-cream-dim/70">
          Demo mode — add Paystack keys to charge for real.
        </p>
      )}
      {error && <p className="mt-2 text-center text-[11.5px] text-coral-400">{error}</p>}
    </div>
  );
}
