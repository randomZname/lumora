'use client';

import Link from 'next/link';
import { signOut, useSession } from 'next-auth/react';

export default function AuthWidget() {
  const { data, status } = useSession();

  if (status === 'loading') {
    return <div className="h-8 w-16 animate-pulse rounded-lg bg-white/5" />;
  }

  const user = data?.user;

  if (!user) {
    return (
      <Link
        href="/login"
        className="rounded-full border border-white/10 px-4 py-2 text-sm font-medium text-aura-ink transition hover:border-aura-iris/60 hover:bg-white/5"
      >
        Sign in
      </Link>
    );
  }

  const displayName = user.name?.trim() || user.email || 'Signed in';

  return (
    <div className="flex items-center gap-3">
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.image}
          alt="User avatar"
          className="h-8 w-8 rounded-full border border-white/10 object-cover"
        />
      ) : (
        <div className="grid h-8 w-8 place-items-center rounded-full border border-white/10 bg-gradient-to-br from-aura-iris/40 to-aura-flare/40 text-xs font-semibold text-aura-ink">
          {displayName.charAt(0).toUpperCase()}
        </div>
      )}

      <div className="hidden max-w-[160px] truncate text-sm text-aura-mute sm:block">
        {displayName}
      </div>

      <button
        onClick={() => signOut({ callbackUrl: '/' })}
        className="rounded-full border border-white/10 px-3.5 py-2 text-sm text-aura-mute transition hover:border-aura-flare/60 hover:text-aura-ink"
      >
        Logout
      </button>
    </div>
  );
}
