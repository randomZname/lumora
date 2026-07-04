'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Button from '@/components/Button';
import { PRODUCTS, formatPrice } from '@/lib/products';
import { BRAND } from '@/lib/brand';

const plans = [
  {
    productId: null,
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    desc: 'Explore the studio and make your first clips.',
    features: ['20 starter credits', '5s clips', '720p', 'Watermarked', 'Community support'],
    highlight: false,
    cta: 'Start free',
  },
  {
    productId: 'plan_pro',
    name: 'Pro',
    price: formatPrice(PRODUCTS.plan_pro.priceCents),
    cadence: '/month',
    desc: 'For creators shipping motion every week.',
    features: ['400 credits / month', '5–10s clips', '1080p', 'No watermark', 'Priority queue', 'Buy extra credits'],
    highlight: true,
    cta: 'Go Pro',
  },
  {
    productId: 'plan_premium',
    name: 'Premium',
    price: formatPrice(PRODUCTS.plan_premium.priceCents),
    cadence: '/month',
    desc: 'Top models and the highest fidelity.',
    features: ['1,200 credits / month', 'Premium models (Kling)', '1080p+', 'No watermark', 'Fastest queue', 'Early features'],
    highlight: false,
    cta: 'Go Premium',
  },
];

const creditPacks = ['credits_100', 'credits_400', 'credits_1200'].map((id) => PRODUCTS[id]);

export default function PlansPage() {
  const router = useRouter();
  const { status } = useSession();
  const [pendingProduct, setPendingProduct] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const buy = async (productId: string | null) => {
    setError(null);

    if (!productId) {
      router.push('/create-video');
      return;
    }
    if (status !== 'authenticated') {
      router.push('/login?callbackUrl=/plans');
      return;
    }

    setPendingProduct(productId);
    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId }),
      });
      const data = (await res.json().catch(() => null)) as
        | { success?: boolean; url?: string; message?: string }
        | null;
      if (!res.ok || !data?.url) {
        setError(data?.message ?? 'Could not start checkout. Please try again.');
        setPendingProduct(null);
        return;
      }
      router.push(data.url);
    } catch {
      setError('Could not start checkout. Please try again.');
      setPendingProduct(null);
    }
  };

  return (
    <div className="space-y-14 py-6">
      <div className="space-y-3 text-center">
        <p className="text-sm uppercase tracking-[0.25em] text-aura-iris">Plans</p>
        <h1 className="font-display text-4xl font-semibold text-aura-ink sm:text-5xl">
          Simple credits. <span className="gradient-text">Real motion.</span>
        </h1>
        <p className="mx-auto max-w-2xl text-aura-mute">
          Every plan includes monthly credits — each clip spends one. Subscribe for more,
          or top up anytime. Cancel whenever.
        </p>
      </div>

      {error && (
        <p className="mx-auto max-w-md rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-300">
          {error}
        </p>
      )}

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`glass relative flex flex-col rounded-4xl p-7 transition-transform duration-300 hover:-translate-y-1 ${
              plan.highlight
                ? 'neon-border ring-1 ring-aura-iris/40'
                : 'border border-white/10'
            }`}
          >
            {plan.highlight && (
              <span className="absolute -top-3 left-7 rounded-full bg-gradient-to-r from-aura-iris via-aura-flare to-aura-gold px-3 py-1 text-xs font-semibold text-aura-void">
                Most popular
              </span>
            )}
            <h3 className="font-display text-xl font-semibold text-aura-ink">{plan.name}</h3>
            <p className="mt-1 text-sm text-aura-mute">{plan.desc}</p>
            <div className="mt-5 flex items-end gap-1">
              <span className="font-display text-4xl font-semibold text-aura-ink">{plan.price}</span>
              <span className="pb-1 text-sm text-aura-mute">{plan.cadence}</span>
            </div>
            <ul className="mt-5 flex-1 space-y-2.5 text-sm text-aura-mute">
              {plan.features.map((f) => (
                <li key={f} className="flex items-center gap-2.5">
                  <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full bg-aura-iris/20 text-[10px] text-aura-iris">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Button
              onClick={() => buy(plan.productId)}
              variant={plan.highlight ? 'primary' : 'outline'}
              disabled={pendingProduct !== null}
              className="mt-6 w-full justify-center"
            >
              {pendingProduct === plan.productId ? 'Opening checkout…' : plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <div className="space-y-6">
        <div className="space-y-2 text-center">
          <h2 className="font-display text-2xl font-semibold text-aura-ink">
            Need a top-up? <span className="gradient-text">Credit packs</span>
          </h2>
          <p className="mx-auto max-w-xl text-sm text-aura-mute">
            One-off purchases, no subscription. Credits never expire.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {creditPacks.map((pack) => (
            <div
              key={pack.id}
              className="glass flex flex-col items-center rounded-3xl border border-white/10 p-6 text-center transition-transform duration-300 hover:-translate-y-1"
            >
              <span className="font-display text-3xl font-semibold text-aura-ink">
                {pack.credits.toLocaleString('en-US')}
              </span>
              <span className="text-xs uppercase tracking-wider text-aura-mute">credits</span>
              <span className="mt-3 font-display text-xl text-aura-ink">{formatPrice(pack.priceCents)}</span>
              <Button
                onClick={() => buy(pack.id)}
                variant="outline"
                disabled={pendingProduct !== null}
                className="mt-4 w-full justify-center"
              >
                {pendingProduct === pack.id ? 'Opening…' : 'Buy'}
              </Button>
            </div>
          ))}
        </div>
      </div>

      <p className="text-center text-xs text-aura-mute/70">
        {BRAND.name} is in active development — billing runs in test mode for now.
      </p>
    </div>
  );
}
