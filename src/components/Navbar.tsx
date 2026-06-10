'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import Button from './Button';
import AuthWidget from '@/components/AuthWidget';
import { BRAND } from '@/lib/brand';

const links = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/create-video', label: 'Studio' },
  { href: '/plans', label: 'Plans' },
  { href: '/faq', label: 'FAQ' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-aura-void/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* LOGO */}
        <Link
          href="/"
          className="group flex items-center gap-2.5"
          aria-label={`${BRAND.name} home`}
        >
          <span className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-aura-iris via-aura-flare to-aura-gold font-display text-sm font-bold text-aura-void shadow-glow">
            {BRAND.mark}
          </span>
          <span className="font-display text-lg font-semibold tracking-tight text-aura-ink">
            {BRAND.name}
          </span>
        </Link>

        {/* DESKTOP NAV */}
        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`relative rounded-full px-3.5 py-2 text-sm font-medium transition-colors duration-150 ${
                  active ? 'text-aura-ink' : 'text-aura-mute hover:text-aura-ink'
                }`}
              >
                {link.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-px h-px bg-gradient-to-r from-aura-iris via-aura-flare to-aura-gold" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* RIGHT SIDE */}
        <div className="hidden items-center gap-3 md:flex">
          <Button as="a" href="/create-video" variant="primary" className="text-sm">
            {BRAND.cta}
          </Button>
          <AuthWidget />
        </div>

        {/* MOBILE TOGGLE */}
        <button
          aria-label="Toggle navigation"
          className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-full border border-white/10 text-aura-ink transition hover:border-aura-iris md:hidden"
          onClick={() => setOpen((v) => !v)}
        >
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? 'translate-y-1.5 rotate-45' : ''}`} />
          <span className={`block h-0.5 w-5 bg-current transition-opacity duration-200 ${open ? 'opacity-0' : 'opacity-80'}`} />
          <span className={`block h-0.5 w-5 bg-current transition-transform duration-200 ${open ? '-translate-y-1.5 -rotate-45' : ''}`} />
        </button>
      </div>

      {/* MOBILE MENU */}
      {open && (
        <div className="border-t border-white/10 bg-aura-void/90 backdrop-blur md:hidden">
          <nav className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-3 sm:px-6">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    active ? 'bg-white/5 text-aura-ink' : 'text-aura-mute hover:bg-white/5'
                  }`}
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              );
            })}
            <Button className="w-full" onClick={() => setOpen(false)} as="a" href="/create-video">
              {BRAND.cta}
            </Button>
            <div className="pt-2">
              <AuthWidget />
            </div>
          </nav>
        </div>
      )}
    </header>
  );
}
