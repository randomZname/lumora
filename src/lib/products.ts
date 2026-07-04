import type { Plan } from '@prisma/client';

/**
 * Product catalog (single source of truth for pricing).
 * Plans grant a monthly credit allowance + set User.plan;
 * credit packs are one-off top-ups.
 */

export interface PlanProduct {
  kind: 'PLAN';
  id: string;
  plan: Extract<Plan, 'PRO' | 'PREMIUM'>;
  name: string;
  priceCents: number;
  credits: number; // granted on purchase
}

export interface CreditProduct {
  kind: 'CREDITS';
  id: string;
  name: string;
  priceCents: number;
  credits: number;
}

export type Product = PlanProduct | CreditProduct;

export const PRODUCTS: Record<string, Product> = {
  plan_pro: {
    kind: 'PLAN',
    id: 'plan_pro',
    plan: 'PRO',
    name: 'Pro plan',
    priceCents: 1900,
    credits: 400,
  },
  plan_premium: {
    kind: 'PLAN',
    id: 'plan_premium',
    plan: 'PREMIUM',
    name: 'Premium plan',
    priceCents: 4900,
    credits: 1200,
  },
  credits_100: {
    kind: 'CREDITS',
    id: 'credits_100',
    name: '100 credits',
    priceCents: 500,
    credits: 100,
  },
  credits_400: {
    kind: 'CREDITS',
    id: 'credits_400',
    name: '400 credits',
    priceCents: 1800,
    credits: 400,
  },
  credits_1200: {
    kind: 'CREDITS',
    id: 'credits_1200',
    name: '1,200 credits',
    priceCents: 4500,
    credits: 1200,
  },
};

export function getProduct(id: string): Product | null {
  return PRODUCTS[id] ?? null;
}

export function formatPrice(cents: number): string {
  return cents % 100 === 0 ? `$${cents / 100}` : `$${(cents / 100).toFixed(2)}`;
}
