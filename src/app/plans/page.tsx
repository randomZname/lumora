'use client';

import { useState } from 'react';
import Button from '@/components/Button';
import PaymentModal from '@/components/PaymentModal';
import { BRAND } from '@/lib/brand';

const plans = [
  {
    name: 'Free',
    price: '$0',
    cadence: 'forever',
    desc: 'Explore the studio and make your first clips.',
    features: ['20 credits / month', '5s clips', '720p', 'Watermarked', 'Community support'],
    highlight: false,
    cta: 'Start free',
  },
  {
    name: 'Pro',
    price: '$19',
    cadence: '/month',
    desc: 'For creators shipping motion every week.',
    features: ['400 credits / month', '5–10s clips', '1080p', 'No watermark', 'Priority queue', 'Buy extra credits'],
    highlight: true,
    cta: 'Go Pro',
  },
  {
    name: 'Premium',
    price: '$49',
    cadence: '/month',
    desc: 'Top models and the highest fidelity.',
    features: ['1,200 credits / month', 'Premium models (Kling)', '1080p+', 'No watermark', 'Fastest queue', 'Early features'],
    highlight: false,
    cta: 'Go Premium',
  },
];

export default function PlansPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<{ name: string; price: string } | null>(null);

  const handlePlanClick = (plan: (typeof plans)[number]) => {
    if (plan.name === 'Free') {
      window.location.href = '/create-video';
      return;
    }
    setSelectedPlan({ name: plan.name, price: plan.price });
    setModalOpen(true);
  };

  return (
    <div className="space-y-12 py-6">
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

      <div className="grid gap-6 md:grid-cols-3">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`glass relative flex flex-col rounded-4xl p-7 ${
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
              onClick={() => handlePlanClick(plan)}
              variant={plan.highlight ? 'primary' : 'outline'}
              className="mt-6 w-full justify-center"
            >
              {plan.cta}
            </Button>
          </div>
        ))}
      </div>

      <p className="text-center text-xs text-aura-mute/70">
        {BRAND.name} is in active development — billing runs in test mode for now.
      </p>

      {selectedPlan && (
        <PaymentModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedPlan(null);
          }}
          planName={selectedPlan.name}
          planPrice={selectedPlan.price}
        />
      )}
    </div>
  );
}
