import type { ReactNode } from 'react';

type CardProps = {
  title?: string;
  description?: string;
  accent?: 'blue' | 'purple' | 'green';
  children?: ReactNode;
  className?: string;
};

// accent kept for backwards-compat; mapped to the aurora palette.
const accentMap = {
  blue: 'from-aura-iris/18',
  purple: 'from-aura-flare/18',
  green: 'from-aura-mint/16',
};

export default function Card({
  title,
  description,
  children,
  accent = 'blue',
  className,
}: CardProps) {
  return (
    <div
      className={`glass neon-border group relative overflow-hidden rounded-3xl p-6 transition-transform duration-300 hover:-translate-y-1 ${className ?? ''}`}
    >
      <div
        className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${accentMap[accent]} to-transparent opacity-70`}
      />
      <div className="relative space-y-3">
        {title && (
          <h3 className="font-display text-lg font-semibold text-aura-ink">{title}</h3>
        )}
        {description && <p className="text-sm leading-relaxed text-aura-mute">{description}</p>}
        {children}
      </div>
    </div>
  );
}
