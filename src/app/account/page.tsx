import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBalance } from '@/lib/credits';
import Button from '@/components/Button';

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return (
      <div className="mx-auto max-w-md py-20 text-center">
        <h1 className="font-display text-3xl font-semibold text-aura-ink">Account</h1>
        <p className="mt-2 text-aura-mute">You are not signed in.</p>
        <Button as="a" href="/login" variant="primary" className="mt-6">
          Sign in
        </Button>
      </div>
    );
  }

  const credits = await getBalance(session.user.id);
  const initial = (session.user.name || session.user.email || '?').charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      <div className="flex items-center gap-4">
        {session.user.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={session.user.image} alt="" className="h-16 w-16 rounded-2xl border border-white/10 object-cover" />
        ) : (
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-gradient-to-br from-aura-iris via-aura-flare to-aura-gold font-display text-2xl font-bold text-aura-void">
            {initial}
          </div>
        )}
        <div>
          <h1 className="font-display text-3xl font-semibold text-aura-ink">
            {session.user.name || 'Your account'}
          </h1>
          <p className="text-aura-mute">{session.user.email}</p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-aura-mute">Plan</p>
          <p className="mt-2 font-display text-2xl font-semibold text-aura-ink">{session.user.plan}</p>
          <Link href="/plans" className="mt-3 inline-block text-sm text-aura-iris hover:text-aura-flare">
            Upgrade →
          </Link>
        </div>
        <div className="glass rounded-3xl p-6">
          <p className="text-xs uppercase tracking-[0.2em] text-aura-mute">Credits</p>
          <p className="mt-2 font-display text-2xl font-semibold gradient-text">{credits}</p>
          <p className="mt-3 text-sm text-aura-mute">1 credit per clip</p>
        </div>
      </div>

      <div className="glass relative overflow-hidden rounded-4xl p-8">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-aura-iris/12 to-aura-flare/10" />
        <h2 className="font-display text-xl font-semibold text-aura-ink">Ready to create?</h2>
        <p className="mt-1 text-aura-mute">Head to the studio and turn an idea into motion.</p>
        <Button as="a" href="/create-video" variant="primary" className="mt-4">
          Open the studio
        </Button>
      </div>
    </div>
  );
}
