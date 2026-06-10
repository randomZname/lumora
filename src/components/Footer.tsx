import Link from "next/link";
import { BRAND } from "@/lib/brand";

export default function Footer() {
  return (
    <footer className="border-t border-white/5 bg-aura-void/60 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-md bg-gradient-to-br from-aura-iris via-aura-flare to-aura-gold text-xs font-bold text-aura-void">
              {BRAND.mark}
            </span>
            <p className="font-display text-lg font-semibold text-aura-ink">{BRAND.name}</p>
          </div>
          <p className="text-sm text-aura-mute">{BRAND.tagline}</p>
        </div>
        <div className="flex items-center gap-5 text-sm text-aura-mute">
          <Link href="/about" className="transition hover:text-aura-ink">About</Link>
          <Link href="/plans" className="transition hover:text-aura-ink">Plans</Link>
          <Link href="/faq" className="transition hover:text-aura-ink">FAQ</Link>
          <Link href="/create-video" className="transition hover:text-aura-ink">Studio</Link>
        </div>
      </div>
      <div className="border-t border-white/5 py-4 text-center text-xs text-aura-mute/70">
        © {new Date().getFullYear()} {BRAND.name}. Crafted for motion.
      </div>
    </footer>
  );
}
