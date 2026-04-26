"use client";

// Renders the appropriate payment CTA based on booking status + Stripe configuration.
//
//  - draft / pending_payment + Stripe live   → "Pay $385 with Stripe"
//  - draft / pending_payment + demo mode     → "Mark paid (demo)" button
//  - booked or beyond                        → confirmation card

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

const COPPER = "#E07A2F";

export function PaymentSection({
  bookingId,
  status,
  feeUSD,
  feeUSDPaid,
}: {
  bookingId: string;
  status: string;
  feeUSD: number;
  feeUSDPaid: number | null;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const params = useSearchParams();
  const router = useRouter();

  const justPaid = params?.get("paid") === "true";
  const justCancelled = params?.get("cancelled") === "true";

  // After Stripe success redirect, the webhook should have flipped status to "booked"
  // — but if it hasn't (timing / dev without webhook) we display the success state
  // optimistically and refresh the page after a beat.
  useEffect(() => {
    if (justPaid && status !== "booked") {
      const t = setTimeout(() => router.refresh(), 1500);
      return () => clearTimeout(t);
    }
  }, [justPaid, status, router]);

  async function handlePay() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/book/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookingId }),
      });
      const data = await res.json();
      if (!data.ok || !data.url) {
        setError(data.message ?? "Couldn't create checkout session.");
        setBusy(false);
        return;
      }

      if (data.url.startsWith("demo:")) {
        // Demo mode — call the short-circuit endpoint
        const confirm = await fetch("/api/book/confirm-demo", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookingId }),
        });
        const c = await confirm.json();
        if (c.ok) {
          router.refresh();
        } else {
          setError(c.message ?? "Demo confirmation failed.");
        }
        setBusy(false);
        return;
      }

      // Real Stripe — redirect
      window.location.href = data.url;
    } catch {
      setError("Couldn't reach the server.");
      setBusy(false);
    }
  }

  // ─── Already paid / booked ───
  if (status === "booked" || ["en_route", "arrived", "inspected_pass", "inspected_fail", "certified", "submitted", "accepted"].includes(status)) {
    return (
      <div
        className="rounded-2xl border p-6 sm:p-7"
        style={{
          background: "linear-gradient(135deg, rgba(34,197,94,0.05) 0%, rgba(15,25,35,0.6) 100%)",
          borderColor: "rgba(34,197,94,0.25)",
        }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div
              className="text-[10px] tracking-[2px] uppercase mb-2 font-medium"
              style={{ color: "#86efac", fontFamily: "var(--font-space-grotesk)" }}
            >
              Payment confirmed
            </div>
            <p className="text-sm sm:text-base text-white/80 leading-relaxed">
              {feeUSDPaid !== null && feeUSDPaid > 0
                ? `Inspection fee of $${feeUSDPaid.toLocaleString()} received.`
                : "Booking confirmed. Inspector is locked in for the scheduled slot."}
            </p>
          </div>
          <div
            className="text-2xl sm:text-3xl font-semibold tracking-tight"
            style={{ color: "#86efac", fontFamily: "var(--font-space-grotesk)" }}
          >
            ✓
          </div>
        </div>
      </div>
    );
  }

  // ─── Awaiting payment ───
  return (
    <div
      className="rounded-2xl border p-6 sm:p-7"
      style={{
        background: "linear-gradient(135deg, rgba(224,122,47,0.06) 0%, rgba(15,25,35,0.6) 100%)",
        borderColor: "rgba(224,122,47,0.3)",
      }}
    >
      <div
        className="text-[10px] tracking-[2px] uppercase mb-2 font-medium"
        style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
      >
        Confirm your booking
      </div>
      <h3
        className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.5px] mb-2"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        Pay the inspection fee to lock the slot.
      </h3>
      <p className="text-sm sm:text-base text-white/65 leading-relaxed mb-5 max-w-xl">
        ${feeUSD.toLocaleString()} due now. The inspector confirms the visit immediately. You&apos;ll get a receipt + the shareable status link by email.
      </p>

      {justCancelled && (
        <p className="text-sm text-white/60 mb-4 italic">
          Payment cancelled. You can try again whenever you&apos;re ready.
        </p>
      )}

      {error && (
        <p className="text-sm mb-4" style={{ color: "#fca5a5" }}>
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={handlePay}
        disabled={busy}
        className="px-7 py-3.5 rounded-lg font-medium text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
        style={{
          background: COPPER,
          boxShadow: busy ? "none" : "0 8px 30px rgba(224,122,47,0.3)",
        }}
      >
        {busy ? "Working…" : `Pay $${feeUSD.toLocaleString()} →`}
      </button>

      <p className="text-xs text-white/40 mt-4">
        Stripe-secured checkout. Card details never touch our servers. If Stripe is not configured, this button will simulate a successful payment for demo purposes.
      </p>
    </div>
  );
}
