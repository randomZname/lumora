import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { z } from 'zod';
import { authOptions } from '@/lib/auth';
import { createCheckout } from '@/lib/payments';
import { getProduct } from '@/lib/products';
import { rateLimit, clientIp } from '@/lib/rate-limit';

const checkoutSchema = z.object({ productId: z.string().min(1).max(64) });

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
    }

    const rl = rateLimit(`checkout:${clientIp(request)}`, 20, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, message: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const parsed = checkoutSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success || !getProduct(parsed.data.productId)) {
      return NextResponse.json({ success: false, message: 'Unknown product.' }, { status: 400 });
    }

    const checkout = await createCheckout(session.user.id, parsed.data.productId);
    return NextResponse.json({ success: true, url: checkout.redirectUrl });
  } catch (err) {
    console.error('[checkout] error', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
