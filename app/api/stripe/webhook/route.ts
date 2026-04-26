// POST /api/stripe/webhook — Stripe → us.
//
// Listens for `checkout.session.completed` and flips the matching booking
// to "booked". In production: configure this URL in Stripe dashboard with
// the signing secret saved to STRIPE_WEBHOOK_SECRET.

import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { getStripe } from "@/lib/stripe";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return Response.json(
      { ok: false, message: "Stripe not configured." },
      { status: 400 },
    );
  }

  const sig = req.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const rawBody = await req.text();

  let event;
  if (sig && secret) {
    try {
      event = stripe.webhooks.constructEvent(rawBody, sig, secret);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      return Response.json(
        { ok: false, message: `Signature verification failed: ${msg}` },
        { status: 400 },
      );
    }
  } else {
    // Dev convenience: parse without verifying. NEVER do this in prod.
    try {
      event = JSON.parse(rawBody);
    } catch {
      return Response.json({ ok: false, message: "Invalid JSON." }, { status: 400 });
    }
  }

  if (event.type !== "checkout.session.completed") {
    return Response.json({ ok: true, ignored: event.type });
  }

  const session = event.data.object;
  const bookingId = session.metadata?.bookingId;
  if (!bookingId) {
    return Response.json({ ok: false, message: "No bookingId in metadata." }, { status: 400 });
  }

  const amount = session.amount_total ?? 0; // cents

  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      status: "booked",
      stripePaymentId: session.payment_intent ?? null,
      feeUSDPaid: Math.round(amount / 100),
    },
  });

  return Response.json({ ok: true });
}
