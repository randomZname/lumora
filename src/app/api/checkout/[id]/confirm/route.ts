import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { fulfillPayment, cancelPayment } from '@/lib/payments';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const confirmSchema = z.object({ action: z.enum(['pay', 'cancel']) });

/**
 * Confirm endpoint for the MOCK provider's internal checkout page.
 * Stripe payments never hit this route — they confirm via the webhook.
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`confirm:${clientIp(request)}`, 30, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, message: 'Too many requests.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: 'Invalid action.' }, { status: 400 });
    }

    const payment = await prisma.payment.findUnique({ where: { id: params.id } });
    if (!payment || payment.userId !== session.user.id) {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    if (payment.provider !== 'mock') {
      return NextResponse.json(
        { success: false, message: 'This payment is handled by an external provider.' },
        { status: 400 },
      );
    }

    if (parsed.data.action === 'cancel') {
      await cancelPayment(payment.id);
      return NextResponse.json({ success: true, status: 'CANCELED' });
    }

    const result = await fulfillPayment(payment.id);
    if (result === 'not_found') {
      return NextResponse.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, status: 'COMPLETED' });
  } catch (err) {
    console.error('[checkout confirm] error', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
