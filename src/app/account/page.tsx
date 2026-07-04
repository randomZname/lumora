import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getBalance } from '@/lib/credits';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/products';
import Button from '@/components/Button';

export const dynamic = 'force-dynamic';

const statusStyles: Record<string, string> = {
  COMPLETED: 'text-aura-mint bg-aura-mint/10 border-aura-mint/30',
  PENDING: 'text-aura-gold bg-aura-gold/10 border-aura-gold/30',
  FAILED: 'text-red-300 bg-red-500/10 border-red-400/30',
  CANCELED: 'text-aura-mute bg-white/5 border-white/10',
};

export default async function AccountPage({
  searchParams,
}: {
  searchParams?: { purchase?: string };
}) {
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

  const [credits, payments, clips] = await Promise.all([
    getBalance(session.user.id),
    prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    }),
    prisma.videoJob.findMany({
      where: { userId: session.user.id, status: 'DONE', outputUrl: { not: null } },
      orderBy: { createdAt: 'desc' },
      take: 6,
      select: { id: true, inputText: true, outputUrl: true, thumbnailUrl: true, createdAt: true },
    }),
  ]);

  const initial = (session.user.name || session.user.email || '?').charAt(0).toUpperCase();

  return (
    <div className="mx-auto max-w-3xl space-y-8 py-10">
      {searchParams?.purchase === 'success' && (
        <div className="flex items-center gap-3 rounded-2xl border border-aura-mint/30 bg-aura-mint/10 px-5 py-4 text-sm text-aura-mint">
          <svg className="h-5 w-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Purchase complete — your plan and credits are updated below.
        </div>
      )}

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

      {clips.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-aura-ink">Your latest clips</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {clips.map((clip) => (
              <div key={clip.id} className="glass overflow-hidden rounded-2xl border border-white/10">
                <video
                  src={clip.outputUrl!}
                  poster={clip.thumbnailUrl ?? undefined}
                  controls
                  playsInline
                  preload="none"
                  className="aspect-video w-full bg-black object-cover"
                />
                <p className="truncate px-3 py-2 text-xs text-aura-mute" title={clip.inputText}>
                  {clip.inputText}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {payments.length > 0 && (
        <div className="space-y-4">
          <h2 className="font-display text-xl font-semibold text-aura-ink">Billing history</h2>
          <div className="glass overflow-hidden rounded-2xl border border-white/10">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs uppercase tracking-wider text-aura-mute">
                  <th className="px-5 py-3 font-medium">Item</th>
                  <th className="px-5 py-3 font-medium">Amount</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="hidden px-5 py-3 font-medium sm:table-cell">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b border-white/5 last:border-0">
                    <td className="px-5 py-3 text-aura-ink">
                      {p.kind === 'PLAN'
                        ? `${p.plan === 'PREMIUM' ? 'Premium' : 'Pro'} plan`
                        : `${p.credits?.toLocaleString('en-US')} credits`}
                    </td>
                    <td className="px-5 py-3 text-aura-mute">{formatPrice(p.amountCents)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                          statusStyles[p.status] ?? statusStyles.CANCELED
                        }`}
                      >
                        {p.status.toLowerCase()}
                      </span>
                    </td>
                    <td className="hidden px-5 py-3 text-aura-mute sm:table-cell">
                      {p.createdAt.toISOString().slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
