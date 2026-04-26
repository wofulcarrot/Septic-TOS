// POST /api/book/checkout — creates a Stripe Checkout Session for a booking.
//
// Two modes:
//   • If STRIPE_SECRET_KEY is set → real Stripe Checkout
//   • Otherwise (demo mode)        → returns { url: "demo:<bookingId>" }
//                                    so the frontend can show a "Mark paid (demo)"
//                                    flow without leaving the app.
//
// On Stripe success: customer returns to /booking/[id]?paid=true&session_id=...
// On Stripe cancel:  customer returns to /booking/[id]?cancelled=true

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe, isStripeLive } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  let body: { bookingId?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
  }

  if (!body.bookingId) {
    return Response.json({ ok: false, message: "bookingId required." }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { id: body.bookingId },
    include: { jurisdiction: true, property: true },
  });
  if (!booking) {
    return Response.json({ ok: false, message: "Booking not found." }, { status: 404 });
  }

  if (booking.status !== "draft" && booking.status !== "pending_payment") {
    return Response.json({
      ok: true,
      url: `/booking/${booking.id}`,
      message: `Booking is already ${booking.status}; nothing to charge.`,
    });
  }

  const origin = req.headers.get("origin") ?? "http://localhost:3000";
  const successUrl = `${origin}/booking/${booking.id}?paid=true&session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${origin}/booking/${booking.id}?cancelled=true`;

  // ─── Demo mode (no Stripe configured) ───
  if (!isStripeLive()) {
    return Response.json({
      ok: true,
      url: `demo:${booking.id}`,
      mode: "demo",
    });
  }

  // ─── Real Stripe ───
  const stripe = getStripe()!;
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: booking.jurisdiction.feeUSD * 100, // cents
          product_data: {
            name: `Septic TOS Inspection — ${booking.jurisdiction.authorityCode}`,
            description: `${booking.jurisdiction.formName} for ${booking.property.formattedAddress ?? booking.property.rawAddress}`,
          },
        },
        quantity: 1,
      },
    ],
    customer_email: booking.realtorEmail ?? undefined,
    metadata: { bookingId: booking.id },
    success_url: successUrl,
    cancel_url: cancelUrl,
  });

  await prisma.booking.update({
    where: { id: booking.id },
    data: {
      status: "pending_payment",
      stripeSessionId: session.id,
    },
  });

  return Response.json({ ok: true, url: session.url, mode: "stripe" });
}
