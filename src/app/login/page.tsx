'use client';

import { Suspense, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Button from '@/components/Button';
import { BRAND } from '@/lib/brand';

type Mode = 'signin' | 'register';

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-aura-ink outline-none transition focus:border-aura-iris focus:ring-1 focus:ring-aura-iris/60';

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState<Mode>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const callbackUrl = searchParams.get('callbackUrl') ?? '/create-video';

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (mode === 'register') {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password, ...(name.trim() ? { name } : {}) }),
        });
        if (!res.ok) {
          const data = (await res.json().catch(() => null)) as { message?: string } | null;
          setError(data?.message ?? 'Registration failed. Please try again.');
          setLoading(false);
          return;
        }
      }

      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(
          result.error === 'CredentialsSignin'
            ? 'Wrong email or password.'
            : result.error,
        );
        setLoading(false);
        return;
      }

      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError('Something went wrong. Please try again.');
      setLoading(false);
    }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
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

        <div className="mb-6 grid grid-cols-2 rounded-xl border border-white/10 bg-black/30 p-1 text-sm font-semibold">
          <button
            type="button"
            onClick={() => switchMode('signin')}
            className={`rounded-lg px-3 py-2 transition ${
              mode === 'signin'
                ? 'bg-gradient-to-r from-aura-iris via-aura-flare to-aura-gold text-aura-void'
                : 'text-aura-mute hover:text-aura-ink'
            }`}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => switchMode('register')}
            className={`rounded-lg px-3 py-2 transition ${
              mode === 'register'
                ? 'bg-gradient-to-r from-aura-iris via-aura-flare to-aura-gold text-aura-void'
                : 'text-aura-mute hover:text-aura-ink'
            }`}
          >
            Create account
          </button>
        </div>

        <h1 className="font-display text-3xl font-semibold text-aura-ink">
          {mode === 'signin' ? 'Welcome back' : 'Start creating'}
        </h1>
        <p className="mt-2 text-sm text-aura-mute">
          {mode === 'signin'
            ? 'Sign in with your email and password.'
            : `Create a free account — ${BRAND.name} gives you starter credits to try the studio.`}
        </p>

        <form onSubmit={submit} className="mt-8 space-y-4">
          {mode === 'register' && (
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your name (optional)"
              maxLength={80}
              className={inputClass}
              autoComplete="name"
            />
          )}
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
            autoComplete="email"
          />
          <input
            type="password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === 'register' ? 'Password (min 8 characters)' : 'Password'}
            className={inputClass}
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />

          {error && (
            <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              {error}
            </p>
          )}

          <Button type="submit" variant="primary" disabled={loading} className="w-full justify-center">
            {loading
              ? mode === 'signin'
                ? 'Signing in…'
                : 'Creating account…'
              : mode === 'signin'
                ? 'Sign in'
                : 'Create account'}
          </Button>
        </form>
      </div>
    </div>
  );
}
