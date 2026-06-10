'use client';

import { useEffect, useState } from 'react';
import Button from './Button';
import Card from './Card';

type PaymentModalProps = {
  isOpen: boolean;
  onClose: () => void;
  planName: string;
  planPrice: string;
};

export default function PaymentModal({
  isOpen,
  onClose,
  planName,
  planPrice,
}: PaymentModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    // Mock submission delay
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      onClose();
      setFormData({ name: '', email: '', cardNumber: '', expiryDate: '', cvv: '' });
    }, 2000);
  };

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, '');
    const chunks = cleaned.match(/.{1,4}/g) || [];
    return chunks.join(' ').slice(0, 19);
  };

  const formatExpiryDate = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    return cleaned;
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="payment-modal-title"
    >
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        aria-hidden="true"
      />
      <div
        className="relative z-10 w-full max-w-lg animate-[fadeIn_0.2s_ease-out,scaleIn_0.2s_ease-out]"
        onClick={(e) => e.stopPropagation()}
      >
        <Card
          title={`Upgrade to ${planName}`}
          description={`Complete your purchase for ${planPrice}/month`}
          accent={planName === 'Pro' ? 'purple' : 'green'}
          className="p-0"
        >
          {submitted ? (
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20">
                <svg
                  className="h-8 w-8 text-emerald-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="mb-2 font-display text-xl text-white">
                Payment Successful!
              </h3>
              <p className="text-sm text-slate-300">
                Your {planName} plan is now active.
              </p>
            </div>
          ) : (
            <form className="space-y-4 p-6" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <label
                  htmlFor="name"
                  className="text-sm font-semibold text-slate-100"
                >
                  Full Name
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, name: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60"
                  placeholder="John Doe"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="email"
                  className="text-sm font-semibold text-slate-100"
                >
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60"
                  placeholder="john@example.com"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor="cardNumber"
                  className="text-sm font-semibold text-slate-100"
                >
                  Card Number
                </label>
                <input
                  id="cardNumber"
                  type="text"
                  required
                  maxLength={19}
                  value={formData.cardNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      cardNumber: formatCardNumber(e.target.value),
                    }))
                  }
                  className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60"
                  placeholder="1234 5678 9012 3456"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label
                    htmlFor="expiryDate"
                    className="text-sm font-semibold text-slate-100"
                  >
                    Expiry Date
                  </label>
                  <input
                    id="expiryDate"
                    type="text"
                    required
                    maxLength={5}
                    value={formData.expiryDate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        expiryDate: formatExpiryDate(e.target.value),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60"
                    placeholder="MM/YY"
                  />
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="cvv"
                    className="text-sm font-semibold text-slate-100"
                  >
                    CVV
                  </label>
                  <input
                    id="cvv"
                    type="text"
                    required
                    maxLength={4}
                    value={formData.cvv}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        cvv: e.target.value.replace(/\D/g, ''),
                      }))
                    }
                    className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60"
                    placeholder="123"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Button type="submit" disabled={isSubmitting} className="flex-1">
                  {isSubmitting ? 'Processing...' : 'Complete Purchase'}
                </Button>
                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:border-white/20 hover:bg-black/60"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-slate-400">
                This is a demo payment form. No real charges will be made.
              </p>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}

