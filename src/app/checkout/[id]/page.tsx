import { getServerSession } from 'next-auth';
import { redirect, notFound } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { formatPrice } from '@/lib/products';
import CheckoutForm from '@/components/CheckoutForm';

export const metadata = { title: 'Checkout' };

export default async function CheckoutPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect(`/login?callbackUrl=/checkout/${params.id}`);
  }

  const payment = await prisma.payment.findUnique({ where: { id: params.id } });
  if (!payment || payment.userId !== session.user.id) notFound();

  if (payment.status === 'COMPLETED') redirect('/account?purchase=success');
  if (payment.status !== 'PENDING') redirect('/plans');

  const label =
    payment.kind === 'PLAN'
      ? `${payment.plan === 'PREMIUM' ? 'Premium' : 'Pro'} plan`
      : `${payment.credits?.toLocaleString('en-US')} credits`;

  return (
    <div className="mx-auto max-w-md py-12">
      <CheckoutForm
        paymentId={payment.id}
        label={label}
        price={formatPrice(payment.amountCents)}
        cadence={payment.kind === 'PLAN' ? '/month' : 'one-time'}
        credits={payment.credits ?? 0}
      />
    </div>
  );
}
