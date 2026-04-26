"use client";

import { useState } from "react";
import type { LookupResult } from "@/lib/lookup";
import { SAMPLE_ADDRESSES } from "@/lib/sample-addresses";

const COPPER = "#E07A2F";

function TraverseLogo({ size = 30 }: { size?: number }) {
  return (
    <svg
      viewBox="0 0 68 80"
      width={size}
      height={(size * 80) / 68}
      aria-label="Traverse"
    >
      <path
        d="M6 58 Q14 32 24 18 Q30 8 34 4 Q38 8 44 18 Q54 32 62 58 Z"
        fill="rgba(255,255,255,0.03)"
      />
      <path
        d="M6 58 Q14 32 24 18 Q30 8 34 4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <path
        d="M62 58 Q54 32 44 18 Q38 8 34 4"
        fill="none"
        stroke="rgba(255,255,255,0.2)"
        strokeWidth="1.5"
      />
      <line x1="20" y1="32" x2="34" y2="52" stroke={COPPER} strokeWidth="1.2" opacity="0.55" />
      <line x1="48" y1="32" x2="34" y2="52" stroke={COPPER} strokeWidth="1.2" opacity="0.55" />
      <circle cx="34" cy="4" r="2.2" fill="rgba(255,255,255,0.4)" />
      <circle cx="24" cy="18" r="2.5" fill="white" />
      <circle cx="44" cy="18" r="2.5" fill="white" />
      <circle cx="20" cy="32" r="2.5" fill="white" />
      <circle cx="48" cy="32" r="2.5" fill="white" />
      <circle cx="34" cy="52" r="6" fill={COPPER} />
      <circle cx="34" cy="52" r="2.2" fill="white" />
    </svg>
  );
}

function HeroConstellation() {
  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none"
      viewBox="0 0 1180 600"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {[
        { x1: 120, y1: 100, x2: 280, y2: 160, delay: "0.5s" },
        { x1: 280, y1: 160, x2: 450, y2: 120, delay: "0.9s" },
        { x1: 450, y1: 120, x2: 620, y2: 200, delay: "1.3s" },
        { x1: 620, y1: 200, x2: 800, y2: 100, delay: "1.7s" },
        { x1: 800, y1: 100, x2: 970, y2: 160, delay: "2.1s" },
        { x1: 970, y1: 160, x2: 1080, y2: 240, delay: "2.5s" },
      ].map((l, i) => (
        <line
          key={i}
          x1={l.x1}
          y1={l.y1}
          x2={l.x2}
          y2={l.y2}
          stroke="rgba(224,122,47,0.42)"
          strokeWidth="0.7"
          strokeDasharray="220"
          strokeDashoffset="220"
          style={{ animation: `draw 3.8s cubic-bezier(0.4,0,0.2,1) ${l.delay} forwards` }}
        />
      ))}
      {[
        { cx: 120, cy: 100, r: 2.2, delay: 0 },
        { cx: 280, cy: 160, r: 1.8, delay: 0.4 },
        { cx: 450, cy: 120, r: 2.4, delay: 0.8 },
        { cx: 620, cy: 200, r: 2, delay: 1.2 },
        { cx: 800, cy: 100, r: 2.2, delay: 1.6 },
        { cx: 970, cy: 160, r: 1.8, delay: 2 },
      ].map((c, i) => (
        <circle
          key={i}
          cx={c.cx}
          cy={c.cy}
          r={c.r}
          fill="white"
          style={{ animation: `twinkle 3.5s ease-in-out ${c.delay}s infinite` }}
        />
      ))}
      <circle cx="1080" cy="240" r="4" fill={COPPER} />
      <style>{`
        @keyframes draw { to { stroke-dashoffset: 0; } }
        @keyframes twinkle { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        @media (prefers-reduced-motion: reduce) {
          line { animation: none !important; stroke-dashoffset: 0 !important; }
          circle { animation: none !important; }
        }
      `}</style>
    </svg>
  );
}

function formatFee(usd: number) {
  return `$${usd.toLocaleString("en-US")}`;
}

function relativeDate(daysFromToday: number) {
  const dt = new Date();
  dt.setDate(dt.getDate() + daysFromToday);
  return dt.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [closingDate, setClosingDate] = useState("");
  const [realtorName, setRealtorName] = useState("");
  const [realtorEmail, setRealtorEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [bookingInspectorId, setBookingInspectorId] = useState<string | null>(null);
  const [result, setResult] = useState<LookupResult | null>(null);

  async function handleCheck(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (!address.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, closingDate: closingDate || undefined }),
      });
      const data: LookupResult = await res.json();
      setResult(data);
    } catch {
      setResult({
        ok: false,
        reason: "fetch_error",
        message: "Couldn't reach the server. Try again.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleBook(inspectorStaticId: string) {
    if (!result || !result.ok) return;
    if (!realtorName.trim()) {
      // Scroll to realtor field and let the browser focus it
      const el = document.getElementById("realtor-name");
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
        (el as HTMLInputElement).focus();
      }
      return;
    }

    setBookingInspectorId(inspectorStaticId);

    const insp = result.inspectors.find((i) => i.id === inspectorStaticId);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          realtorName: realtorName.trim(),
          realtorEmail: realtorEmail.trim() || undefined,
          closingDate: closingDate || undefined,
          property: {
            rawAddress: address.trim(),
            formattedAddress: result.matchedAddress,
            latitude: result.latitude,
            longitude: result.longitude,
            countyFips: result.countyFips,
            withinSurfaceWater: result.surfaceWater?.isWithin ?? null,
          },
          inspectorStaticId,
          inspectorScheduledFor: insp?.earliestAvailable.toISOString(),
        }),
      });
      const data = await res.json();
      if (data.ok && data.bookingId) {
        window.location.href = `/booking/${data.bookingId}`;
      } else {
        alert(data.message ?? "Booking failed. Try again.");
        setBookingInspectorId(null);
      }
    } catch {
      alert("Couldn't reach the server. Try again.");
      setBookingInspectorId(null);
    }
  }

  function pickSample(sample: typeof SAMPLE_ADDRESSES[number]) {
    setAddress(sample.address);
    setResult(null);
  }

  return (
    <>
      {/* Sticky nav */}
      <nav
        className="sticky top-0 z-50 px-6 sm:px-10 py-4 flex items-center justify-between border-b border-white/[0.06]"
        style={{
          background: "rgba(15, 25, 35, 0.85)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
        }}
      >
        <a href="/" className="flex items-center gap-3.5 no-underline">
          <TraverseLogo size={28} />
          <span
            className="text-white text-[20px] tracking-[1.5px] uppercase font-semibold"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Traverse
          </span>
        </a>
        <div className="flex items-center gap-6 text-sm">
          <span className="text-white/60 hidden md:inline">Septic TOS Coordinator</span>
          <a
            href="mailto:hello@traverserts.com"
            className="text-white px-5 py-2 rounded-lg border border-white/[0.18] hover:bg-white/[0.04] transition"
          >
            Contact
          </a>
        </div>
      </nav>

      {/* Hero / form */}
      <section className="relative overflow-hidden">
        <HeroConstellation />
        <div className="relative z-10 max-w-5xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div
            className="text-[11px] tracking-[3.5px] uppercase font-medium mb-8 inline-flex items-center gap-3.5"
            style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="w-7 h-px" style={{ background: COPPER }} />
            Northern Michigan Septic TOS · Live demo
          </div>

          <h1
            className="text-4xl sm:text-6xl font-bold tracking-[-2px] sm:tracking-[-3.5px] leading-[1.02] text-white mb-4"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Paste an address.
          </h1>
          <h1
            className="text-4xl sm:text-6xl font-bold tracking-[-2px] sm:tracking-[-3.5px] leading-[1.02] text-white mb-8"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Get the{" "}
            <span
              style={{
                background: `linear-gradient(135deg, ${COPPER} 0%, #FFB175 50%, ${COPPER} 100%)`,
                WebkitBackgroundClip: "text",
                backgroundClip: "text",
                WebkitTextFillColor: "transparent",
                filter: "drop-shadow(0 4px 24px rgba(224,122,47,0.3))",
              }}
            >
              answer.
            </span>
          </h1>
          <p className="text-base sm:text-lg leading-relaxed text-white/70 max-w-xl mb-10">
            Jurisdiction. Form. Fee. First inspector slot. Surface-water rule. Closing-safety check.{" "}
            <strong className="text-white font-medium">In under three seconds.</strong>
          </p>

          {/* Form */}
          <form
            onSubmit={handleCheck}
            className="rounded-2xl border border-white/[0.08] p-5 sm:p-6 space-y-4 backdrop-blur-sm"
            style={{ background: "rgba(15, 25, 35, 0.65)" }}
          >
            <label className="block">
              <span
                className="block text-[11px] tracking-[2px] uppercase text-white/50 mb-2"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Property address
              </span>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="e.g., 13319 S West Bayshore Dr, Traverse City, MI"
                className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#E07A2F]/50 focus:bg-white/[0.06] transition"
                autoFocus
              />
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="block">
                <span
                  className="block text-[11px] tracking-[2px] uppercase text-white/50 mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Realtor name{" "}
                  <span className="text-white/30 normal-case tracking-normal text-[10px]">(needed to book)</span>
                </span>
                <input
                  id="realtor-name"
                  type="text"
                  value={realtorName}
                  onChange={(e) => setRealtorName(e.target.value)}
                  placeholder="e.g., Sarah Mitchell"
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#E07A2F]/50 focus:bg-white/[0.06] transition"
                />
              </label>
              <label className="block">
                <span
                  className="block text-[11px] tracking-[2px] uppercase text-white/50 mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Realtor email{" "}
                  <span className="text-white/30 normal-case tracking-normal text-[10px]">(optional)</span>
                </span>
                <input
                  type="email"
                  value={realtorEmail}
                  onChange={(e) => setRealtorEmail(e.target.value)}
                  placeholder="sarah@aspirenorth.com"
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-[#E07A2F]/50 focus:bg-white/[0.06] transition"
                />
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-end">
              <label className="block flex-1">
                <span
                  className="block text-[11px] tracking-[2px] uppercase text-white/50 mb-2"
                  style={{ fontFamily: "var(--font-space-grotesk)" }}
                >
                  Target closing date{" "}
                  <span className="text-white/30 normal-case tracking-normal text-[10px]">(optional)</span>
                </span>
                <input
                  type="date"
                  value={closingDate}
                  onChange={(e) => setClosingDate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-white/[0.04] border border-white/[0.1] rounded-lg text-white focus:outline-none focus:border-[#E07A2F]/50 focus:bg-white/[0.06] transition [color-scheme:dark]"
                />
              </label>
              <button
                type="submit"
                disabled={loading || !address.trim()}
                className="px-7 py-3.5 rounded-lg font-medium text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: COPPER,
                  boxShadow: loading
                    ? "none"
                    : "0 8px 40px rgba(224,122,47,0.35), 0 0 80px rgba(224,122,47,0.12)",
                }}
              >
                {loading ? "Checking…" : "Check →"}
              </button>
            </div>

            {/* Sample pills */}
            <div className="pt-2">
              <span
                className="block text-[10px] tracking-[2px] uppercase text-white/40 mb-3"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                Try one of these
              </span>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_ADDRESSES.map((s) => (
                  <button
                    key={s.address}
                    type="button"
                    onClick={() => pickSample(s)}
                    className="text-xs px-3 py-1.5 rounded-md border border-white/[0.1] bg-white/[0.02] text-white/70 hover:border-[#E07A2F]/40 hover:text-white hover:bg-white/[0.04] transition"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </form>
        </div>
      </section>

      {/* Results */}
      {result && (
        <section className="max-w-5xl mx-auto px-6 sm:px-10 pb-24">
          <ResultPanel
            result={result}
            onBook={handleBook}
            bookingInspectorId={bookingInspectorId}
            realtorNamePresent={!!realtorName.trim()}
          />
        </section>
      )}

      {/* Footer */}
      <footer
        className="mt-auto px-6 sm:px-10 py-8 text-center text-xs tracking-wide text-white/30 border-t border-white/[0.05]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        TRAVERSE · Custom software, shipped fast · Michigan ·{" "}
        <a
          href="mailto:hello@traverserts.com"
          className="text-white/50 hover:text-[#E07A2F] no-underline"
        >
          hello@traverserts.com
        </a>
      </footer>

      {/* Result panel fade-in keyframes */}
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </>
  );
}

// ───────────────────────────────────────────────────────────────────
// Result panel — renders LookupSuccess or LookupFailure
// ───────────────────────────────────────────────────────────────────

function ResultPanel({
  result,
  onBook,
  bookingInspectorId,
  realtorNamePresent,
}: {
  result: LookupResult;
  onBook: (inspectorStaticId: string) => void;
  bookingInspectorId: string | null;
  realtorNamePresent: boolean;
}) {
  if (!result.ok) {
    return (
      <div
        className="rounded-2xl border border-white/[0.08] p-8 mt-2"
        style={{
          background: "rgba(15, 25, 35, 0.55)",
          animation: "fadeUp 0.35s ease-out forwards",
        }}
      >
        <div
          className="text-[11px] tracking-[2px] uppercase mb-3 font-medium"
          style={{
            color: result.reason === "unsupported_county" ? COPPER : "#ef9999",
            fontFamily: "var(--font-space-grotesk)",
          }}
        >
          {result.reason === "unsupported_county"
            ? "Coming soon"
            : result.reason === "no_match"
            ? "Address not found"
            : result.reason === "non_michigan"
            ? "Not in Michigan"
            : "Lookup error"}
        </div>
        <p className="text-base text-white/70 leading-relaxed">{result.message}</p>
      </div>
    );
  }

  return (
    <div className="space-y-5" style={{ animation: "fadeUp 0.4s ease-out forwards" }}>
      {/* Top status banner */}
      <div
        className="rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6"
        style={{
          background: result.tosRequired
            ? "linear-gradient(135deg, rgba(224,122,47,0.08) 0%, rgba(15,25,35,0.6) 100%)"
            : "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(15,25,35,0.6) 100%)",
          borderColor: result.tosRequired ? "rgba(224,122,47,0.3)" : "rgba(34,197,94,0.25)",
        }}
      >
        <div className="flex-1">
          <div
            className="text-[11px] tracking-[2.5px] uppercase mb-2 font-medium"
            style={{
              color: result.tosRequired ? COPPER : "#86efac",
              fontFamily: "var(--font-space-grotesk)",
            }}
          >
            {result.tosRequired ? "TOS inspection required" : "TOS rule does not apply"}
          </div>
          <div
            className="text-xl sm:text-2xl font-semibold text-white tracking-[-0.5px] mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {result.matchedAddress}
          </div>
          <div className="text-sm text-white/70 leading-relaxed">
            {result.countyName} County ·{" "}
            <span className="text-white">{result.jurisdiction.authorityName}</span>
          </div>
        </div>
        {result.surfaceWater && (
          <div className="text-right">
            <div
              className="text-[10px] tracking-[2px] uppercase text-white/40"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Distance to surface water
            </div>
            <div
              className="text-2xl sm:text-3xl font-semibold text-white tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {result.surfaceWater.distanceFt.toLocaleString()} ft
            </div>
            <div className="text-xs text-white/50 mt-0.5">
              from {result.surfaceWater.nearestFeature}
            </div>
          </div>
        )}
      </div>

      {/* Form + Fee + Submission card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <DataCard label="Form" value={result.jurisdiction.formCode} sub={result.jurisdiction.formName} />
        <DataCard
          label="Fee"
          value={formatFee(result.jurisdiction.feeUSD)}
          sub={result.jurisdiction.feeIsEstimate ? "Estimated · confirm with authority" : "Confirmed"}
        />
        <DataCard
          label="Submission"
          value={result.jurisdiction.submissionMethod}
          sub={result.jurisdiction.submissionDetail}
          subClass="text-xs"
        />
      </div>

      {/* TOS reason */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div
          className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Why
        </div>
        <p className="text-sm sm:text-base text-white/80 leading-relaxed">{result.tosReason}</p>
      </div>

      {/* Closing risk banner */}
      {result.closingRisk && (
        <ClosingRiskBanner
          level={result.closingRisk.level}
          message={result.closingRisk.message}
          bufferDays={result.closingRisk.bufferDays}
        />
      )}

      {/* Inspectors */}
      {result.inspectors.length > 0 && (
        <div>
          <div
            className="text-[11px] tracking-[2.5px] uppercase mb-3 font-medium"
            style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
          >
            Available inspectors · {result.inspectors.length}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {result.inspectors.map((insp) => {
              const isBooking = bookingInspectorId === insp.id;
              const isOtherBooking = bookingInspectorId !== null && !isBooking;
              return (
                <div
                  key={insp.id}
                  className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 transition flex flex-col"
                  style={{ opacity: isOtherBooking ? 0.45 : 1 }}
                >
                  <div
                    className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    Earliest · {relativeDate(insp.daysFromToday)} · {insp.slotLabel}
                  </div>
                  <div
                    className="text-base font-semibold text-white tracking-[-0.3px] mb-1"
                    style={{ fontFamily: "var(--font-space-grotesk)" }}
                  >
                    {insp.name}
                  </div>
                  <div className="text-sm text-white/70 mb-3">{insp.company}</div>
                  <div className="text-xs text-white/40 space-y-0.5 mb-4 flex-1">
                    <div>{insp.phone}</div>
                    <div className="truncate">{insp.email}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBook(insp.id)}
                    disabled={isBooking || isOtherBooking}
                    className="w-full px-4 py-2.5 rounded-lg text-sm font-medium transition disabled:cursor-not-allowed"
                    style={{
                      background: isBooking ? "rgba(224,122,47,0.4)" : COPPER,
                      color: "white",
                      boxShadow: isBooking
                        ? "none"
                        : "0 4px 20px rgba(224,122,47,0.25)",
                    }}
                  >
                    {isBooking
                      ? "Creating booking…"
                      : !realtorNamePresent
                      ? "Add realtor name to book →"
                      : "Book this slot →"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Notes */}
      {result.jurisdiction.notes && (
        <div className="text-xs text-white/40 leading-relaxed pt-2">
          <span
            className="text-white/30 tracking-[1.5px] uppercase mr-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Note
          </span>
          {result.jurisdiction.notes}
        </div>
      )}

      {/* CTA */}
      <div className="pt-6 mt-2 border-t border-white/[0.06] flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <p className="text-sm text-white/60 max-w-md">
          This is a Traverse demo. The production version books the slot, takes payment, and pre-fills the county form.
        </p>
        <a
          href="mailto:hello@traverserts.com?subject=Septic%20TOS%20Coordinator%20demo"
          className="px-6 py-3 rounded-lg font-medium text-white whitespace-nowrap"
          style={{
            background: COPPER,
            boxShadow: "0 8px 30px rgba(224,122,47,0.3)",
          }}
        >
          Talk to us →
        </a>
      </div>
    </div>
  );
}

function DataCard({
  label,
  value,
  sub,
  subClass = "",
}: {
  label: string;
  value: string;
  sub?: string;
  subClass?: string;
}) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div
        className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {label}
      </div>
      <div
        className="text-lg font-semibold text-white tracking-[-0.3px] mb-1"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {value}
      </div>
      {sub && <div className={`text-white/55 leading-snug ${subClass || "text-sm"}`}>{sub}</div>}
    </div>
  );
}

function ClosingRiskBanner({
  level,
  message,
  bufferDays,
}: {
  level: "safe" | "tight" | "at_risk";
  message: string;
  bufferDays: number;
}) {
  const colorMap = {
    safe: { fg: "#86efac", bg: "rgba(34,197,94,0.06)", border: "rgba(34,197,94,0.25)", label: "Closing safe" },
    tight: { fg: "#fde68a", bg: "rgba(234,179,8,0.07)", border: "rgba(234,179,8,0.3)", label: "Cutting it close" },
    at_risk: { fg: "#fca5a5", bg: "rgba(239,68,68,0.07)", border: "rgba(239,68,68,0.3)", label: "Closing at risk" },
  } as const;
  const c = colorMap[level];

  return (
    <div
      className="rounded-xl border p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5"
      style={{ background: c.bg, borderColor: c.border }}
    >
      <div
        className="w-3 h-3 rounded-full flex-shrink-0"
        style={{ background: c.fg, boxShadow: `0 0 12px ${c.fg}` }}
      />
      <div className="flex-1">
        <div
          className="text-[11px] tracking-[2.5px] uppercase mb-1 font-medium"
          style={{ color: c.fg, fontFamily: "var(--font-space-grotesk)" }}
        >
          {c.label}
        </div>
        <p className="text-sm sm:text-base text-white/85 leading-relaxed">{message}</p>
      </div>
      <div className="text-right">
        <div
          className="text-2xl sm:text-3xl font-semibold tracking-tight"
          style={{ color: c.fg, fontFamily: "var(--font-space-grotesk)" }}
        >
          {bufferDays >= 0 ? `+${bufferDays}` : bufferDays}
        </div>
        <div
          className="text-[10px] tracking-[2px] uppercase text-white/40"
          style={{ fontFamily: "var(--font-space-grotesk)" }}
        >
          Days buffer
        </div>
      </div>
    </div>
  );
}
