// POST /api/booking/[id]/cert — runs the Permit Auto-Filler agent on a
// booking and stores the structured payload. Only valid once the booking
// has reached an inspected status (pass or fail).
//
// Body: { pass: boolean, systemNotes?: string }
//   pass        — required, captures the inspector's verdict
//   systemNotes — optional, the inspector's free-text findings the agent
//                 reasons over

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateCertPayload } from "@/lib/cert-agent";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { pass?: boolean; systemNotes?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (typeof body.pass !== "boolean") {
    return Response.json(
      { ok: false, message: "Field 'pass' (boolean) is required." },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({
    where: { id },
    include: { property: true, jurisdiction: true },
  });
  if (!booking) {
    return Response.json({ ok: false, message: "Booking not found." }, { status: 404 });
  }

  // Run the agent
  const payload = await generateCertPayload({
    jurisdiction: {
      countyName: booking.jurisdiction.countyName,
      countyFips: booking.jurisdiction.countyFips,
      authorityCode: booking.jurisdiction.authorityCode,
      authorityName: booking.jurisdiction.authorityName,
      authorityShortName: booking.jurisdiction.authorityCode, // mirrors map
      formName: booking.jurisdiction.formName,
      formCode: booking.jurisdiction.formName.split(" — ")[0] ?? booking.jurisdiction.formName,
      feeUSD: booking.jurisdiction.feeUSD,
      feeIsEstimate: booking.jurisdiction.feeIsEstimate,
      submissionMethod: booking.jurisdiction.submissionMethod as
        | "PDF"
        | "Online portal"
        | "Email",
      submissionDetail: "",
      notes: booking.jurisdiction.notes ?? "",
      surfaceWaterRule: booking.property.withinSurfaceWater !== null,
      ruleSummary: booking.jurisdiction.notes ?? "",
      websiteUrl: "",
      evalValidityYears: 3,
      waterTestValidityMonths: 6,
      inspectorModel:
        booking.jurisdiction.authorityCode === "BLDHD" ? "monopoly" : "private",
    },
    property: {
      formattedAddress: booking.property.formattedAddress ?? booking.property.rawAddress,
      rawAddress: booking.property.rawAddress,
      latitude: booking.property.latitude,
      longitude: booking.property.longitude,
      countyFips: booking.property.countyFips ?? booking.jurisdiction.countyFips,
      withinSurfaceWater: booking.property.withinSurfaceWater,
    },
    booking: {
      id: booking.id,
      realtorName: booking.realtorName,
      realtorEmail: booking.realtorEmail,
      closingDate: booking.closingDate,
      scheduledFor: booking.scheduledFor,
    },
    inspector: {
      name: booking.inspectorName ?? "Unknown",
      company: booking.inspectorCompany ?? "Unknown",
      phone: booking.inspectorPhone,
      email: booking.inspectorEmail,
    },
    inspection: {
      pass: body.pass,
      systemNotes: (body.systemNotes ?? "").trim(),
    },
  });

  // Persist
  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      certGeneratedAt: new Date(),
      certPayloadJson: JSON.stringify(payload),
      certInspectionPass: body.pass,
      certSystemNotes: body.systemNotes ?? null,
      status: "certified",
    },
  });

  return Response.json({
    ok: true,
    bookingId: updated.id,
    source: payload.source,
    escalationsCount: payload.escalations.length,
    pdfUrl: `/api/booking/${updated.id}/cert.pdf`,
  });
}
