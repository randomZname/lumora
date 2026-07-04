'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Button from './Button';
import { BRAND } from '@/lib/brand';

const TEST_CARD = '4242 4242 4242 4242';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-aura-ink outline-none transition focus:border-aura-iris focus:ring-1 focus:ring-aura-iris/60';

type Props = {
  paymentId: string;
  label: string;
  price: string;
  cadence: string;
  credits: number;
};

export default function CheckoutForm({ paymentId, label, price, cadence, credits }: Props) {
  const router = useRouter();
  const [card, setCard] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [state, setState] = useState<'idle' | 'paying' | 'done'>('idle');

  const formatCard = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 16);
    return digits.replace(/(.{4})/g, '$1 ').trim();
  };

  const formatExpiry = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 4);
    return digits.length > 2 ? `${digits.slice(0, 2)}/${digits.slice(2)}` : digits;
  };

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (card !== TEST_CARD) {
      setError(`Test mode: use card ${TEST_CARD}.`);
      return;
    }

    setState('paying');
    try {
      const res = await fetch(`/api/checkout/${paymentId}/confirm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'pay' }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => null)) as { message?: string } | null;
        setError(data?.message ?? 'Payment failed. Please try again.');
        setState('idle');
        return;
      }
      setState('done');
      setTimeout(() => {
        router.push('/account?purchase=success');
        router.refresh();
      }, 1200);
    } catch {
      setError('Payment failed. Please try again.');
      setState('idle');
    }
  };

  const cancel = async () => {
    await fetch(`/api/checkout/${paymentId}/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'cancel' }),
    }).catch(() => undefined);
    router.push('/plans');
  };

  if (state === 'done') {
    return (
      <div className="glass neon-border rounded-4xl p-8 text-center">
        <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-full bg-aura-mint/15">
          <svg className="h-8 w-8 text-aura-mint" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-2xl font-semibold text-aura-ink">Payment complete</h1>
        <p className="mt-2 text-sm text-aura-mute">
          {credits.toLocaleString('en-US')} credits added to your account. Redirecting…
        </p>
      </div>
    );
  }

  return (
    <div className="glass neon-border rounded-4xl p-8">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-aura-iris via-aura-flare to-aura-gold font-display font-bold text-aura-void">
            {BRAND.mark}
          </span>
          <span className="font-display text-lg font-semibold text-aura-ink">Checkout</span>
        </div>
        <span className="rounded-full border border-aura-gold/40 bg-aura-gold/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-aura-gold">
          Test mode
        </span>
      </div>

      <div className="mb-6 rounded-2xl border border-white/10 bg-black/30 p-5">
        <div className="flex items-baseline justify-between">
          <span className="text-sm text-aura-mute">{label}</span>
          <span className="font-display text-2xl font-semibold text-aura-ink">
            {price}
            <span className="ml-1 text-xs font-normal text-aura-mute">{cadence}</span>
          </span>
        </div>
        <p className="mt-2 text-xs text-aura-mute">
          Includes {credits.toLocaleString('en-US')} credits — each clip spends one.
        </p>
      </div>

      <form onSubmit={pay} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="card" className="text-sm font-semibold text-aura-ink">
            Card number
          </label>
          <input
            id="card"
            type="text"
            required
            inputMode="numeric"
            maxLength={19}
            value={card}
            onChange={(e) => setCard(formatCard(e.target.value))}
            placeholder={TEST_CARD}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="expiry" className="text-sm font-semibold text-aura-ink">
              Expiry
            </label>
            <input
              id="expiry"
              type="text"
              required
              inputMode="numeric"
              maxLength={5}
              value={expiry}
              onChange={(e) => setExpiry(formatExpiry(e.target.value))}
              placeholder="12/28"
              className={inputClass}
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="cvc" className="text-sm font-semibold text-aura-ink">
              CVC
            </label>
            <input
              id="cvc"
              type="text"
              required
              inputMode="numeric"
              maxLength={4}
              value={cvc}
              onChange={(e) => setCvc(e.target.value.replace(/\D/g, ''))}
              placeholder="123"
              className={inputClass}
            />
          </div>
        </div>

        {error && (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button type="submit" variant="primary" disabled={state === 'paying'} className="flex-1 justify-center">
            {state === 'paying' ? 'Processing…' : `Pay ${price}`}
          </Button>
          <button
            type="button"
            onClick={cancel}
            className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-aura-mute transition hover:border-white/20 hover:text-aura-ink"
          >
            Cancel
          </button>
        </div>

        <p className="text-xs text-aura-mute/70">
          {BRAND.name} billing runs in test mode — no real charges. Use card {TEST_CARD} with any
          future expiry and any CVC.
        </p>
      </form>
    </div>
  );
}
