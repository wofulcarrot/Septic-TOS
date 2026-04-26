// PATCH /api/booking/[id]/status — update a booking's status.
//
// Day 2: no auth (demo only). Day 3 will scope this to the inspector
// who owns the booking via login + signed token.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED_STATUSES = new Set([
  "draft",
  "pending_payment",
  "booked",
  "en_route",
  "arrived",
  "inspected_pass",
  "inspected_fail",
  "certified",
  "submitted",
  "accepted",
]);

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  let body: { status?: string; notes?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.status || !ALLOWED_STATUSES.has(body.status)) {
    return Response.json(
      { ok: false, message: `Status must be one of: ${[...ALLOWED_STATUSES].join(", ")}` },
      { status: 400 },
    );
  }

  const booking = await prisma.booking.findUnique({ where: { id } });
  if (!booking) {
    return Response.json({ ok: false, message: "Booking not found." }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status: body.status,
      notes: body.notes ?? booking.notes,
    },
  });

  return Response.json({ ok: true, status: updated.status });
}
