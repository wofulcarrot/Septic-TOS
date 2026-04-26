// Stripe client — lazily initialized so the app boots cleanly even when
// STRIPE_SECRET_KEY is not set (demo mode).
//
// In demo mode, /api/book/checkout returns a "demo:" pseudo-URL the
// frontend recognizes and short-circuits to a simulated success page.

import Stripe from "stripe";

let _stripe: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key || key.startsWith("sk_test_REPLACE") || key === "DEMO") return null;
  // Use Stripe SDK's pinned API version (do not override).
  _stripe = new Stripe(key);
  return _stripe;
}

export function isStripeLive(): boolean {
  return getStripe() !== null;
}
