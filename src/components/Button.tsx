import type {
  AnchorHTMLAttributes,
  ButtonHTMLAttributes,
  DetailedHTMLProps,
  ReactNode,
} from "react";

type ButtonVariant = "primary" | "ghost" | "outline" | "neon";

type ButtonProps =
  | (DetailedHTMLProps<
      ButtonHTMLAttributes<HTMLButtonElement>,
      HTMLButtonElement
    > & {
      as?: "button";
      variant?: ButtonVariant;
      icon?: ReactNode;
    })
  | (DetailedHTMLProps<
      AnchorHTMLAttributes<HTMLAnchorElement>,
      HTMLAnchorElement
    > & {
      as: "a";
      href: string;
      variant?: ButtonVariant;
      icon?: ReactNode;
    });

const baseStyles =
  "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aura-iris/70 focus-visible:ring-offset-2 focus-visible:ring-offset-aura-void disabled:opacity-50 disabled:pointer-events-none";

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-gradient-to-r from-aura-iris via-aura-flare to-aura-gold text-aura-void shadow-glow hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(251,113,133,0.5)]",
  ghost:
    "bg-white/5 text-aura-ink border border-white/10 hover:border-aura-iris/60 hover:bg-white/10",
  outline:
    "border border-aura-iris/55 text-aura-ink hover:border-aura-flare/70 hover:bg-white/5",
  neon:
    "border border-aura-iris/70 text-aura-ink shadow-[0_0_14px_rgba(139,92,246,0.35)] hover:border-aura-flare hover:shadow-[0_0_24px_rgba(251,113,133,0.5)] hover:-translate-y-0.5",
};

export default function Button({
  children,
  className,
  variant = "primary",
  icon,
  ...props
}: ButtonProps) {
  if (props.as === "a") {
    const { as: _as, href, target, rel, ...rest } = props;
    return (
      <a
        href={href}
        target={target}
        rel={rel}
        className={cn(baseStyles, variantStyles[variant], className)}
        {...rest}
      >
        {icon}
        {children}
      </a>
    );
  }

  return (
    <button
      className={cn(baseStyles, variantStyles[variant], className)}
      {...props}
    >
      {icon}
      {children}
    </button>
  );
}

function cn(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(" ");
}

