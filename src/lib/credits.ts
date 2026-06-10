import { TxType } from '@prisma/client';
import { prisma } from '@/lib/prisma';

/**
 * Credit helpers (contract 2.4).
 * Balance of record lives on User.credits; CreditTransaction is the audit log.
 */

export const COST_PER_VIDEO = 1; // credits; tune later

/** True if the user currently has at least `cost` credits. */
export async function hasCredits(userId: string, cost: number): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return (user?.credits ?? 0) >= cost;
}

/**
 * Atomically spend `cost` credits for a video job:
 * decrement User.credits AND insert a SPEND CreditTransaction (amount = -cost).
 */
export async function spendCredits(
  userId: string,
  cost: number,
  videoJobId: string,
): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { decrement: cost } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount: -cost,
        type: TxType.SPEND,
        videoJobId,
      },
    }),
  ]);
}

/**
 * Atomically add `amount` credits:
 * increment User.credits AND insert a REFILL CreditTransaction (amount = +amount).
 */
export async function refillCredits(userId: string, amount: number): Promise<void> {
  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: amount } },
    }),
    prisma.creditTransaction.create({
      data: {
        userId,
        amount,
        type: TxType.REFILL,
      },
    }),
  ]);
}

/** Current credit balance (User.credits). */
export async function getBalance(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { credits: true },
  });
  return user?.credits ?? 0;
}
