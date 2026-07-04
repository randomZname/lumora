import { NextResponse } from 'next/server';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientIp } from '@/lib/rate-limit';
import { STARTER_CREDITS } from '@/lib/credits';

const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(128),
  name: z.string().trim().min(1).max(80).optional(),
});

export async function POST(request: Request) {
  try {
    const rl = rateLimit(`register:${clientIp(request)}`, 10, 15 * 60_000);
    if (!rl.ok) {
      return NextResponse.json(
        { success: false, message: 'Too many attempts. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(rl.retryAfterSec) } },
      );
    }

    const parsed = registerSchema.safeParse(await request.json().catch(() => null));
    if (!parsed.success) {
      const message = parsed.error.issues[0]?.message ?? 'Invalid input.';
      return NextResponse.json({ success: false, message }, { status: 400 });
    }
    const { email, password, name } = parsed.data;

    const existing = await prisma.user.findUnique({ where: { email }, select: { id: true } });
    if (existing) {
      return NextResponse.json(
        { success: false, message: 'An account with this email already exists. Sign in instead.' },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    await prisma.user.create({
      data: {
        email,
        name: name ?? email.split('@')[0],
        passwordHash,
        credits: STARTER_CREDITS,
      },
    });

    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    console.error('[register] error', err);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
