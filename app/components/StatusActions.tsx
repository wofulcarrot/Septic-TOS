"use client";

// Inline status-progression buttons used on the pumper dashboard.
// Maps the current status to the next 1-2 reasonable transitions.

import { useState } from "react";
import { useRouter } from "next/navigation";

const COPPER = "#E07A2F";

type Transition = { label: string; nextStatus: string; tone?: "default" | "fail" | "complete" };

const NEXT_STEPS: Record<string, Transition[]> = {
  draft: [{ label: "Mark booked", nextStatus: "booked" }],
  pending_payment: [{ label: "Mark booked", nextStatus: "booked" }],
  booked: [{ label: "Mark en route", nextStatus: "en_route" }],
  en_route: [{ label: "Mark arrived", nextStatus: "arrived" }],
  arrived: [
    { label: "Inspection passed", nextStatus: "inspected_pass", tone: "complete" },
    { label: "Inspection failed", nextStatus: "inspected_fail", tone: "fail" },
  ],
  inspected_pass: [{ label: "Cert ready", nextStatus: "certified" }],
  inspected_fail: [{ label: "Cert ready", nextStatus: "certified" }],
  certified: [{ label: "Submit to county", nextStatus: "submitted" }],
  submitted: [{ label: "County accepted", nextStatus: "accepted", tone: "complete" }],
  accepted: [],
};

export function StatusActions({
  bookingId,
  currentStatus,
}: {
  bookingId: string;
  currentStatus: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const router = useRouter();
  const transitions = NEXT_STEPS[currentStatus] ?? [];

  if (transitions.length === 0) {
    return (
      <span className="text-xs text-white/40 italic">No further actions — closing-clear.</span>
    );
  }

  async function update(nextStatus: string) {
    setBusy(nextStatus);
    try {
      const res = await fetch(`/api/booking/${bookingId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: nextStatus }),
      });
      const data = await res.json();
      if (data.ok) {
        router.refresh();
      } else {
        alert(data.message ?? "Update failed.");
      }
    } catch {
      alert("Couldn't reach the server.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {transitions.map((t) => {
        const isBusy = busy === t.nextStatus;
        const toneStyles = {
          default: { bg: COPPER, color: "white" },
          complete: { bg: "rgba(34,197,94,0.15)", color: "#86efac", border: "1px solid rgba(34,197,94,0.4)" },
          fail: { bg: "rgba(239,68,68,0.12)", color: "#fca5a5", border: "1px solid rgba(239,68,68,0.4)" },
        }[t.tone ?? "default"];
        return (
          <button
            key={t.nextStatus}
            type="button"
            onClick={() => update(t.nextStatus)}
            disabled={!!busy}
            className="px-4 py-2 rounded-md text-xs font-semibold tracking-wide uppercase transition disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              ...toneStyles,
              fontFamily: "var(--font-space-grotesk)",
              letterSpacing: "1px",
              border: ("border" in toneStyles ? toneStyles.border : "none"),
              boxShadow: t.tone === "default" && !isBusy ? "0 4px 16px rgba(224,122,47,0.25)" : "none",
            }}
          >
            {isBusy ? "…" : t.label}
          </button>
        );
      })}
    </div>
  );
}
