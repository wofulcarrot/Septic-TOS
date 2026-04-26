// POST /api/book/confirm-demo — short-circuit "payment" for demo mode.
//
// Only used when STRIPE_SECRET_KEY is not configured. Flips a draft booking
// straight to "booked" so the demo flow is end-to-end without real payment.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { isStripeLive } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isStripeLive()) {
    // Refuse to bypass real Stripe in production.
    return Response.json(
      { ok: false, message: "Stripe is configured — use /api/book/checkout instead." },
      { status: 400 },
    );
  }

  let body: { bookingId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.bookingId) {
    return Response.json({ ok: false, message: "bookingId required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({ where: { id: body.bookingId } });
  if (!booking) {
    return Response.json({ ok: false, message: "Booking not found." }, { status: 404 });
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "booked",
      feeUSDPaid: 0, // demo — no real money moved
    },
  });

  return Response.json({ ok: true, status: updated.status });
}
