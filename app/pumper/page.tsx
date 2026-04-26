// /pumper — the inspector / dispatcher dashboard.
// Day 2: no auth (demo). Lists ALL active bookings grouped by date with
// inline status-progression buttons.
//
// Day 3 wires login → restrict to bookings for that inspector.

import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TraverseLogo } from "@/app/components/TraverseLogo";
import { StatusBadge } from "@/app/components/StatusBadge";
import { StatusActions } from "@/app/components/StatusActions";

export const dynamic = "force-dynamic";

const COPPER = "#E07A2F";

const ACTIVE_STATUSES = [
  "draft",
  "pending_payment",
  "booked",
  "en_route",
  "arrived",
  "inspected_pass",
  "inspected_fail",
  "certified",
  "submitted",
];

export default async function PumperDashboard() {
  const bookings = await prisma.booking.findMany({
    include: { property: true, jurisdiction: true },
    orderBy: { scheduledFor: "asc" },
  });

  const active = bookings.filter((b) => ACTIVE_STATUSES.includes(b.status));
  const accepted = bookings.filter((b) => b.status === "accepted");

  // Group by scheduled date label (Today / Tomorrow / This week / Later)
  const grouped = groupByDate(active);

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
          <span
            className="text-[10px] tracking-[3px] uppercase text-white/40 hidden sm:inline"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Pumper dashboard
          </span>
          <a
            href="/"
            className="text-white px-5 py-2 rounded-lg border border-white/[0.18] hover:bg-white/[0.04] transition"
          >
            Realtor view →
          </a>
        </div>
      </nav>

      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-10 sm:py-14 space-y-10">
        <div>
          <div
            className="text-[11px] tracking-[3.5px] uppercase font-medium mb-4 inline-flex items-center gap-3.5"
            style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
          >
            <span className="w-7 h-px" style={{ background: COPPER }} />
            Today&apos;s route · {active.length} active
          </div>
          <h1
            className="text-3xl sm:text-5xl font-bold tracking-[-1.5px] sm:tracking-[-2.5px] leading-[1.05] text-white mb-2"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Septic inspections, in flight.
          </h1>
          <p className="text-base text-white/65 leading-relaxed max-w-2xl">
            Every active booking on one screen. Tap a status to advance the job. Realtors and homeowners see updates immediately on the shareable status URL.
          </p>
        </div>

        {/* Stats strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatTile label="Active" value={active.length.toString()} />
          <StatTile
            label="Awaiting payment"
            value={active.filter((b) => b.status === "draft" || b.status === "pending_payment").length.toString()}
          />
          <StatTile
            label="Today"
            value={active.filter((b) => isToday(b.scheduledFor)).length.toString()}
          />
          <StatTile label="Closing-clear" value={accepted.length.toString()} />
        </div>

        {/* Active bookings grouped by date */}
        {active.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-white/[0.02] p-12 text-center">
            <p
              className="text-lg font-semibold text-white mb-2"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              No active bookings.
            </p>
            <p className="text-sm text-white/55 mb-6">
              Once a realtor books a slot from the homepage, it lands here.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium text-white"
              style={{ background: COPPER }}
            >
              Try the realtor flow →
            </Link>
          </div>
        ) : (
          grouped.map(({ label, bookings: rows }) => (
            <div key={label}>
              <h2
                className="text-[11px] tracking-[3px] uppercase text-white/45 mb-4 font-medium"
                style={{ fontFamily: "var(--font-space-grotesk)" }}
              >
                {label} · {rows.length}
              </h2>
              <div className="space-y-3">
                {rows.map((b) => (
                  <BookingRow key={b.id} booking={b} />
                ))}
              </div>
            </div>
          ))
        )}

        {accepted.length > 0 && (
          <div>
            <h2
              className="text-[11px] tracking-[3px] uppercase text-white/45 mb-4 font-medium"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              Closing-clear · {accepted.length}
            </h2>
            <div className="space-y-2 opacity-65">
              {accepted.map((b) => (
                <BookingRow key={b.id} booking={b} />
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer
        className="mt-auto px-6 sm:px-10 py-8 text-center text-xs tracking-wide text-white/30 border-t border-white/[0.05]"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        TRAVERSE · Custom software, shipped fast · Michigan ·{" "}
        <a href="mailto:hello@traverserts.com" className="text-white/50 hover:text-[#E07A2F] no-underline">
          hello@traverserts.com
        </a>
      </footer>
    </>
  );
}

// ──────────────────────────────────────────────────────────────────

type Booking = Awaited<ReturnType<typeof prisma.booking.findMany>>[number] & {
  property: { rawAddress: string; formattedAddress: string | null };
  jurisdiction: { authorityCode: string; feeUSD: number };
};

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5">
      <div
        className="text-[10px] tracking-[2px] uppercase text-white/40 mb-2"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {label}
      </div>
      <div
        className="text-3xl font-bold text-white tracking-tight"
        style={{ fontFamily: "var(--font-space-grotesk)" }}
      >
        {value}
      </div>
    </div>
  );
}

function BookingRow({ booking }: { booking: Booking }) {
  const closingDate = booking.closingDate
    ? new Date(booking.closingDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    : null;
  const slot = booking.scheduledFor
    ? new Date(booking.scheduledFor).toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : "TBD";

  return (
    <div className="rounded-xl border border-white/[0.08] bg-white/[0.02] p-5 hover:border-white/[0.15] transition">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Address + meta */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-3 mb-1.5">
            <StatusBadge status={booking.status} />
            <span
              className="text-[10px] tracking-[2px] uppercase text-white/40"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {booking.jurisdiction.authorityCode}
            </span>
            <span className="text-xs text-white/40">•</span>
            <span
              className="text-[10px] tracking-[2px] uppercase text-white/40"
              style={{ fontFamily: "var(--font-space-grotesk)" }}
            >
              {slot}
            </span>
            {closingDate && (
              <>
                <span className="text-xs text-white/40">•</span>
                <span
                  className="text-[10px] tracking-[2px] uppercase"
                  style={{ color: COPPER, fontFamily: "var(--font-space-grotesk)" }}
                >
                  Closing {closingDate}
                </span>
              </>
            )}
          </div>
          <Link
            href={`/booking/${booking.id}`}
            className="text-base font-semibold text-white tracking-[-0.3px] hover:text-[#E07A2F] transition no-underline block truncate"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            {booking.property.formattedAddress ?? booking.property.rawAddress}
          </Link>
          <div className="text-sm text-white/55 mt-0.5 truncate">
            {booking.realtorName} {booking.realtorEmail ? `· ${booking.realtorEmail}` : ""}
          </div>
        </div>

        {/* Inspector */}
        <div className="lg:w-44 lg:flex-shrink-0">
          <div
            className="text-[10px] tracking-[2px] uppercase text-white/40"
            style={{ fontFamily: "var(--font-space-grotesk)" }}
          >
            Inspector
          </div>
          <div className="text-sm text-white truncate" style={{ fontFamily: "var(--font-space-grotesk)" }}>
            {booking.inspectorName ?? "—"}
          </div>
          <div className="text-xs text-white/45 truncate">{booking.inspectorCompany ?? ""}</div>
        </div>

        {/* Actions */}
        <div className="lg:flex-shrink-0">
          <StatusActions bookingId={booking.id} currentStatus={booking.status} />
        </div>
      </div>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Helpers

function groupByDate(bookings: Booking[]) {
  const groups: { label: string; bookings: Booking[] }[] = [
    { label: "Today", bookings: [] },
    { label: "Tomorrow", bookings: [] },
    { label: "This week", bookings: [] },
    { label: "Later", bookings: [] },
    { label: "No date", bookings: [] },
  ];

  for (const b of bookings) {
    if (!b.scheduledFor) {
      groups[4].bookings.push(b);
    } else if (isToday(b.scheduledFor)) {
      groups[0].bookings.push(b);
    } else if (isTomorrow(b.scheduledFor)) {
      groups[1].bookings.push(b);
    } else if (isThisWeek(b.scheduledFor)) {
      groups[2].bookings.push(b);
    } else {
      groups[3].bookings.push(b);
    }
  }

  return groups.filter((g) => g.bookings.length > 0);
}

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function isToday(d: Date | null): boolean {
  if (!d) return false;
  const today = startOfDay(new Date()).getTime();
  return startOfDay(new Date(d)).getTime() === today;
}

function isTomorrow(d: Date | null): boolean {
  if (!d) return false;
  const tomorrow = startOfDay(new Date());
  tomorrow.setDate(tomorrow.getDate() + 1);
  return startOfDay(new Date(d)).getTime() === tomorrow.getTime();
}

function isThisWeek(d: Date | null): boolean {
  if (!d) return false;
  const now = startOfDay(new Date()).getTime();
  const end = now + 7 * 24 * 60 * 60 * 1000;
  const t = startOfDay(new Date(d)).getTime();
  return t >= now && t <= end;
}
