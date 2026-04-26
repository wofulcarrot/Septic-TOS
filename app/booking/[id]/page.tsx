// /booking/[id] — public status page for a booking.
// Shareable URL: realtor sends this to the buyer/seller; pumper sees same view.
// No login required; auth comes in Day 3.

import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TraverseLogo } from "@/app/components/TraverseLogo";
import { StatusBadge } from "@/app/components/StatusBadge";
import { CopyLinkButton } from "@/app/components/CopyLinkButton";
import { PaymentSection } from "@/app/components/PaymentSection";

export const dynamic = "force-dynamic";

const COPPER = "#E07A2F";

type Params = { id: string };

export default async function BookingPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { id } = await params;

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, jurisdiction: true },
  });

  if (!booking) {
    notFound();
  }

  const formattedClosing = booking.closingDate
    ? new Date(booking.closingDate).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

  const formattedSlot = booking.scheduledFor
    ? new Date(booking.scheduledFor).toLocaleDateString("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : null;

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
        <div className="flex items-center gap-4 text-sm">
          <a
            href="/"
            className="text-white/60 hover:text-white transition hidden sm:inline"
          >
            Look up another property
          </a>
          <a
            href="mailto:hello@traverserts.com"
            className="text-white px-5 py-2 rounded-lg border border-white/[0.18] hover:bg-white/[0.04] transition"
          >
            Contact
          </a>
        </div>
      </nav>

      <section className="max-w-4xl mx-auto px-6 sm:px-10 py-10 sm:py-16 space-y-6">
        {/* Header */}
        <div>
          <div
            className="text-[11px] tracking-[3.5px] uppercase font-medium mb-4 inline-flex items-center gap-3.5"
            style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="w-7 h-px" style={{ background: COPPER }} />
            Booking · {booking.id.slice(-8).toUpperCase()}
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold tracking-[-1.5px] sm:tracking-[-2.5px] leading-[1.05] text-white mb-3"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Septic inspection scheduled.
          </h1>
          <p className="text-base sm:text-lg text-white/70 leading-relaxed max-w-2xl">
            {booking.property.formattedAddress ?? booking.property.rawAddress}
          </p>
        </div>

        {/* Payment section — top of fold, prominent CTA */}
        <Suspense fallback={null}>
          <PaymentSection
            bookingId={booking.id}
            status={booking.status}
            feeUSD={booking.jurisdiction.feeUSD}
            feeUSDPaid={booking.feeUSDPaid}
          />
        </Suspense>

        {/* Status banner */}
        <div
          className="rounded-2xl border p-6 sm:p-8 flex flex-col sm:flex-row sm:items-center gap-4"
          style={{
            background:
              booking.status === "booked" || booking.status === "draft"
                ? "linear-gradient(135deg, rgba(224,122,47,0.08) 0%, rgba(15,25,35,0.6) 100%)"
                : "linear-gradient(135deg, rgba(34,197,94,0.06) 0%, rgba(15,25,35,0.6) 100%)",
            borderColor:
              booking.status === "booked" || booking.status === "draft"
                ? "rgba(224,122,47,0.3)"
                : "rgba(34,197,94,0.25)",
          }}
        >
          <div className="flex-1">
            <div
              className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Current status
            </div>
            <StatusBadge status={booking.status} />
            <p className="text-sm sm:text-base text-white/75 leading-relaxed mt-3 max-w-xl">
              {statusBlurb(booking.status)}
            </p>
          </div>
          <div className="text-right">
            <div
              className="text-[10px] tracking-[2px] uppercase text-white/40"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Scheduled
            </div>
            <div
              className="text-xl sm:text-2xl font-semibold text-white tracking-tight"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {formattedSlot ?? "TBD"}
            </div>
          </div>
        </div>

        {/* Detail grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <DetailCard label="Inspector" value={booking.inspectorName ?? "—"} sub={booking.inspectorCompany ?? undefined} />
          <DetailCard
            label="Jurisdiction"
            value={booking.jurisdiction.authorityCode}
            sub={booking.jurisdiction.authorityName}
          />
          <DetailCard
            label="Form"
            value={booking.jurisdiction.formName.split(" — ")[0] ?? booking.jurisdiction.formName}
            sub={booking.jurisdiction.formName.split(" — ")[1] ?? undefined}
          />
          <DetailCard
            label="Inspection fee"
            value={`$${booking.jurisdiction.feeUSD.toLocaleString()}`}
            sub={booking.jurisdiction.feeIsEstimate ? "Estimated" : "Confirmed"}
          />
          <DetailCard label="Realtor" value={booking.realtorName} sub={booking.realtorEmail ?? undefined} />
          {formattedClosing && (
            <DetailCard label="Closing" value={formattedClosing} />
          )}
        </div>

        {/* Inspector contact */}
        {(booking.inspectorPhone || booking.inspectorEmail) && (
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-5">
            <div
              className="text-[10px] tracking-[2px] uppercase text-white/40 mb-3"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Inspector contact
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm">
              {booking.inspectorPhone && (
                <a
                  href={`tel:${booking.inspectorPhone}`}
                  className="text-white/85 hover:text-[#E07A2F] transition"
                >
                  📞 {booking.inspectorPhone}
                </a>
              )}
              {booking.inspectorEmail && (
                <a
                  href={`mailto:${booking.inspectorEmail}`}
                  className="text-white/85 hover:text-[#E07A2F] transition"
                >
                  ✉️ {booking.inspectorEmail}
                </a>
              )}
            </div>
          </div>
        )}

        {/* Share */}
        <div
          className="rounded-xl border p-5 flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between"
          style={{ borderColor: "rgba(224,122,47,0.2)", background: "rgba(224,122,47,0.04)" }}
        >
          <div>
            <div
              className="text-[10px] tracking-[2px] uppercase mb-1 font-medium"
              style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
            >
              Share with the buyer / seller
            </div>
            <p className="text-sm text-white/70">
              Anyone with this URL can see the booking status. No login required.
            </p>
          </div>
          <CopyLinkButton id={booking.id} />
        </div>

        {/* Footer hint */}
        <p className="text-xs text-white/40 leading-relaxed pt-4">
          Need to make a change? Email{" "}
          <a
            href="mailto:hello@traverserts.com"
            className="text-white/60 hover:text-[#E07A2F] transition"
          >
            hello@traverserts.com
          </a>{" "}
          or call your inspector directly.
        </p>
      </section>

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
    </>
  );
}

function DetailCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string;
  sub?: string;
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
        className="text-base sm:text-lg font-semibold text-white tracking-[-0.3px] mb-1"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {value}
      </div>
      {sub && <div className="text-sm text-white/55 leading-snug">{sub}</div>}
    </div>
  );
}

function statusBlurb(status: string): string {
  const m: Record<string, string> = {
    draft: "Booking created. Awaiting payment to confirm the slot.",
    pending_payment: "Awaiting payment confirmation. Stripe is processing the inspection fee.",
    booked: "Confirmed. The inspector will arrive at the scheduled time.",
    en_route: "The inspector is on their way to the property.",
    arrived: "Inspector on site. Inspection in progress.",
    inspected_pass: "Inspection complete — system passed.",
    inspected_fail: "Inspection complete — system requires repair before certification.",
    certified: "Certification document drafted. Pending submission to the county.",
    submitted: "Submitted to the county health authority. Awaiting acceptance.",
    accepted: "County has accepted the certification. Closing-clear.",
  };
  return m[status] ?? `Status: ${status}`;
}
