// POST /api/book — create a booking from realtor input + the lookup result.
//
// Flow:
//   1. Validate input
//   2. Find or create the Property (caches the geocode result)
//   3. Find the Jurisdiction by FIPS
//   4. Create the Booking with denormalized inspector display fields
//   5. Return the booking ID — the client redirects to /booking/[id]
//
// Stripe Checkout is wired separately by /api/book/checkout.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { JURISDICTIONS } from "@/lib/jurisdictions";
import { INSPECTORS } from "@/lib/inspectors";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type BookInput = {
  realtorName: string;
  realtorEmail?: string;
  realtorPhone?: string;
  closingDate?: string; // ISO yyyy-mm-dd
  property: {
    rawAddress: string;
    formattedAddress?: string;
    latitude?: number;
    longitude?: number;
    countyFips: string;
    withinSurfaceWater?: boolean;
  };
  inspectorStaticId: string; // "insp-gt-01"
  inspectorScheduledFor?: string; // ISO datetime — derived from inspector.daysFromToday
};

export async function POST(req: NextRequest) {
  let body: BookInput;
  try {
    body = await req.json();
  } catch {
    return Response.json(
      { ok: false, message: "Invalid JSON body." },
      { status: 400 },
    );
  }

  // ─── Validation ───
  if (!body.realtorName?.trim()) {
    return Response.json(
      { ok: false, message: "Realtor name is required." },
      { status: 400 },
    );
  }
  if (!body.property?.countyFips || !body.property?.rawAddress) {
    return Response.json(
      { ok: false, message: "Property address + county FIPS required." },
      { status: 400 },
    );
  }
  if (!body.inspectorStaticId) {
    return Response.json(
      { ok: false, message: "Inspector selection required." },
      { status: 400 },
    );
  }

  // ─── Resolve jurisdiction ───
  const jurisdictionStatic = JURISDICTIONS[body.property.countyFips];
  if (!jurisdictionStatic) {
    return Response.json(
      { ok: false, message: `County ${body.property.countyFips} is not yet supported.` },
      { status: 400 },
    );
  }
  const jurisdiction = await prisma.jurisdiction.findUnique({
    where: { countyFips: body.property.countyFips },
  });
  if (!jurisdiction) {
    return Response.json(
      { ok: false, message: "Jurisdiction not seeded. Run prisma/seed.ts first." },
      { status: 500 },
    );
  }

  // ─── Resolve inspector (from static map) ───
  const inspector = INSPECTORS.find((i) => i.id === body.inspectorStaticId);
  if (!inspector) {
    return Response.json(
      { ok: false, message: `Unknown inspector: ${body.inspectorStaticId}.` },
      { status: 400 },
    );
  }

  // ─── Property: find-or-create by raw address ───
  let property = await prisma.property.findFirst({
    where: { rawAddress: body.property.rawAddress },
  });
  if (!property) {
    property = await prisma.property.create({
      data: {
        rawAddress: body.property.rawAddress,
        formattedAddress: body.property.formattedAddress ?? null,
        latitude: body.property.latitude ?? null,
        longitude: body.property.longitude ?? null,
        countyFips: body.property.countyFips,
        withinSurfaceWater: body.property.withinSurfaceWater ?? null,
        jurisdictionId: jurisdiction.id,
      },
    });
  }

  // ─── Compute scheduledFor from inspector.daysFromToday ───
  const scheduledFor = body.inspectorScheduledFor
    ? new Date(body.inspectorScheduledFor)
    : (() => {
        const dt = new Date();
        dt.setDate(dt.getDate() + inspector.daysFromToday);
        return dt;
      })();

  // ─── Create the booking ───
  const booking = await prisma.booking.create({
    data: {
      realtorName: body.realtorName.trim(),
      realtorEmail: body.realtorEmail?.trim() || null,
      realtorPhone: body.realtorPhone?.trim() || null,
      closingDate: body.closingDate ? parseClosingDate(body.closingDate) : null,
      propertyId: property.id,
      jurisdictionId: jurisdiction.id,
      inspectorStaticId: inspector.id,
      inspectorName: inspector.name,
      inspectorCompany: inspector.company,
      inspectorPhone: inspector.phone,
      inspectorEmail: inspector.email,
      inspectorSlotLabel: `${formatSlotDate(scheduledFor)} · ${inspector.slotLabel}`,
      scheduledFor,
      status: "draft",
    },
  });

  return Response.json({ ok: true, bookingId: booking.id });
}

function parseClosingDate(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim());
  if (!m) return null;
  const [, y, mo, d] = m;
  const dt = new Date(Number(y), Number(mo) - 1, Number(d));
  return isNaN(dt.getTime()) ? null : dt;
}

function formatSlotDate(d: Date): string {
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}
