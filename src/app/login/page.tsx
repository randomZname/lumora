'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import Button from '@/components/Button';
import { BRAND } from '@/lib/brand';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);

  const devSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    await signIn('dev', { email: email.trim(), callbackUrl: '/create-video' });
  };

  return (
    <div className="mx-auto max-w-md py-16">
      <div className="glass neon-border rounded-4xl p-8">
        <div className="mb-6 flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-aura-iris via-aura-flare to-aura-gold font-display font-bold text-aura-void">
            {BRAND.mark}
          </span>
          <span className="font-display text-xl font-semibold text-aura-ink">{BRAND.name}</span>
        </div>

        <h1 className="font-display text-3xl font-semibold text-aura-ink">Sign in</h1>
        <p className="mt-2 text-sm text-aura-mute">
          Enter any email to start creating. (Dev sign-in — Google login arrives soon.)
        </p>

        <form onSubmit={devSignIn} className="mt-8 space-y-4">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-aura-ink outline-none transition focus:border-aura-iris focus:ring-1 focus:ring-aura-iris/60"
          />
          <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
            {loading ? 'Signing in…' : 'Continue'}
          </Button>
        </form>
      </div>
    </div>
  );
}
