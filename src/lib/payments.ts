import { TxType, type Payment } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { getProduct, type Product } from '@/lib/products';

/**
 * Payment provider abstraction.
 *
 * "mock" (default) runs the full checkout → fulfillment loop against an
 * internal test checkout page — no external service, no real charges.
 * "stripe" slots in later behind the same interface: createCheckout returns a
 * Stripe Checkout URL and the webhook route calls fulfillPayment/failPayment.
 */

export interface CheckoutSession {
  paymentId: string;
  /** Where to send the user to complete payment. */
  redirectUrl: string;
}

export interface PaymentProviderAdapter {
  readonly name: string;
  createCheckout(payment: Payment, product: Product): Promise<CheckoutSession>;
}

class MockPaymentProvider implements PaymentProviderAdapter {
  readonly name = 'mock';

  async createCheckout(payment: Payment): Promise<CheckoutSession> {
    return { paymentId: payment.id, redirectUrl: `/checkout/${payment.id}` };
  }
}

export function getPaymentProvider(): PaymentProviderAdapter {
  const provider = (process.env.PAYMENT_PROVIDER ?? 'mock').toLowerCase();
  if (provider === 'stripe') {
    // Implemented when Stripe keys arrive; interface is already in place.
    throw new Error('Stripe provider not configured yet. Set PAYMENT_PROVIDER=mock.');
  }
  return new MockPaymentProvider();
}

/** Create a PENDING payment for a catalog product and open a checkout session. */
export async function createCheckout(userId: string, productId: string): Promise<CheckoutSession> {
  const product = getProduct(productId);
  if (!product) throw new Error(`Unknown product: ${productId}`);

  const provider = getPaymentProvider();
  const payment = await prisma.payment.create({
    data: {
      userId,
      provider: provider.name,
      status: 'PENDING',
      kind: product.kind,
      plan: product.kind === 'PLAN' ? product.plan : null,
      credits: product.credits,
      amountCents: product.priceCents,
    },
  });

  return provider.createCheckout(payment, product);
}

export type FulfillResult = 'fulfilled' | 'already_processed' | 'not_found';

/**
 * Mark a payment COMPLETED and apply what was bought (plan and/or credits).
 * Idempotent: the PENDING→COMPLETED transition happens inside the same
 * transaction as the grant, and only the caller that wins the transition
 * applies it — a replayed webhook or double-submit is a no-op.
 */
export async function fulfillPayment(paymentId: string): Promise<FulfillResult> {
  return prisma.$transaction(async (tx) => {
    const payment = await tx.payment.findUnique({ where: { id: paymentId } });
    if (!payment) return 'not_found';

    const transition = await tx.payment.updateMany({
      where: { id: paymentId, status: 'PENDING' },
      data: { status: 'COMPLETED' },
    });
    if (transition.count === 0) return 'already_processed';

    if (payment.kind === 'PLAN' && payment.plan) {
      await tx.user.update({
        where: { id: payment.userId },
        data: { plan: payment.plan, credits: { increment: payment.credits ?? 0 } },
      });
    } else {
      await tx.user.update({
        where: { id: payment.userId },
        data: { credits: { increment: payment.credits ?? 0 } },
      });
    }

    await tx.creditTransaction.create({
      data: {
        userId: payment.userId,
        amount: payment.credits ?? 0,
        type: TxType.PURCHASE,
        stripeRef: payment.id,
      },
    });

    return 'fulfilled';
  });
}

/** Mark a PENDING payment CANCELED (user backed out). Idempotent. */
export async function cancelPayment(paymentId: string): Promise<void> {
  await prisma.payment.updateMany({
    where: { id: paymentId, status: 'PENDING' },
    data: { status: 'CANCELED' },
  });
}
