import { NextResponse } from 'next/server';

/**
 * External payment provider webhook (Stripe).
 *
 * Placeholder until Stripe keys are configured. When live:
 *  1. Verify the `stripe-signature` header against STRIPE_WEBHOOK_SECRET
 *     using stripe.webhooks.constructEvent on the RAW request body.
 *  2. On `checkout.session.completed` → fulfillPayment(session.metadata.paymentId).
 *  3. On `checkout.session.expired` / payment failure → cancelPayment(...).
 * fulfillPayment is already idempotent, so webhook retries are safe.
 */
export async function POST() {
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json(
      { success: false, message: 'Webhook not configured' },
      { status: 501 },
    );
  }
  // Unreachable until Stripe is wired up; kept explicit to fail loudly.
  return NextResponse.json({ success: false, message: 'Not implemented' }, { status: 501 });
}
