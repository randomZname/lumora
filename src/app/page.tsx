import React from 'react';
import Link from 'next/link';
import Button from '@/components/Button';
import { BRAND } from '@/lib/brand';

const steps = [
  {
    n: '01',
    title: 'Describe or upload',
    description:
      'Start from a single still frame, or just words. Set the mood, motion, and pacing in one prompt.',
  },
  {
    n: '02',
    title: 'Lumora renders',
    description:
      'Our pipeline maps depth, structure, and motion, then drives a state-of-the-art video model.',
  },
  {
    n: '03',
    title: 'Watch it move',
    description:
      'Get a cinematic clip in seconds, ready to download, share, or regenerate with a new vibe.',
  },
];

const showcase = [
  { title: 'Cyber Alley', tag: 'cinematic · teal-magenta', video: '/samples/cyber-alley.mp4' },
  { title: 'Solar Bloom', tag: 'macro · slow-motion', video: '/samples/solar-bloom.mp4' },
  { title: 'Neon Drifter', tag: 'synthwave · parallax', video: '/samples/neon-city.mp4' },
  { title: 'Aurora Veil', tag: 'abstract · light ribbons', video: '/samples/aurora-veil.mp4' },
  { title: 'Ink Bloom', tag: 'macro · fluid', video: '/samples/ink-bloom.mp4' },
  { title: 'Dune Drift', tag: 'aerial · golden hour', video: '/samples/dune-drift.mp4' },
];

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="font-display text-2xl font-semibold text-aura-ink">{value}</div>
      <div className="text-xs uppercase tracking-[0.18em] text-aura-mute">{label}</div>
    </div>
  );
}

export default function Home() {
  return (
    <div className="space-y-24 pb-8">
      {/* HERO */}
      <section className="rise grid items-center gap-10 pt-6 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-7">
          <p className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.22em] text-aura-mute">
            <span className="h-1.5 w-1.5 rounded-full bg-aura-mint" />
            AI motion studio
          </p>
          <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-aura-ink sm:text-6xl">
            Turn a thought into{' '}
            <span className="gradient-text glow-text">living motion</span>
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-aura-mute">
            {BRAND.description} No timeline, no rig, no crew — just your idea and a
            few seconds.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button as="a" href="/create-video" variant="primary" className="text-base">
              {BRAND.cta}
            </Button>
            <Link
              href="/plans"
              className="text-sm font-semibold text-aura-mute underline decoration-dotted underline-offset-8 transition hover:text-aura-ink"
            >
              See pricing →
            </Link>
          </div>
          <div className="flex gap-10 pt-4">
            <Stat value="~30s" label="to first clip" />
            <Stat value="5–10s" label="clip length" />
            <Stat value="∞" label="re-rolls" />
          </div>
        </div>

        {/* Hero video frame */}
        <div className="relative">
          <div className="glass neon-border relative aspect-[4/3] w-full overflow-hidden rounded-4xl">
            <video
              src="/samples/cyber-alley.mp4"
              poster="/samples/cyber-alley.jpg"
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-aura-void/80 via-transparent to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 flex items-center justify-between p-4 text-xs text-aura-ink">
              <span className="font-semibold">Real {BRAND.name} output</span>
              <span className="rounded-full bg-white/10 px-3 py-1 backdrop-blur">live render</span>
            </div>
          </div>
          <div className="pointer-events-none absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-br from-aura-iris/20 via-aura-flare/10 to-aura-gold/10 blur-2xl" />
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="space-y-8">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="text-sm uppercase tracking-[0.25em] text-aura-iris">How it works</p>
            <h2 className="font-display text-3xl font-semibold text-aura-ink sm:text-4xl">
              Three steps to motion
            </h2>
          </div>
          <Link
            href="/create-video"
            className="text-sm font-semibold text-aura-mute underline decoration-dotted underline-offset-8 transition hover:text-aura-ink"
          >
            Try the studio →
          </Link>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {steps.map((s) => (
            <div
              key={s.n}
              className="glass relative overflow-hidden rounded-3xl p-7"
            >
              <div className="font-display text-5xl font-semibold text-transparent [-webkit-text-stroke:1px_rgba(236,233,245,0.18)]">
                {s.n}
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold text-aura-ink">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-aura-mute">{s.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* SHOWCASE */}
      <section className="space-y-8">
        <div className="space-y-2">
          <p className="text-sm uppercase tracking-[0.25em] text-aura-flare">Showcase</p>
          <h2 className="font-display text-3xl font-semibold text-aura-ink sm:text-4xl">
            Made entirely with {BRAND.name}
          </h2>
          <p className="max-w-2xl text-aura-mute">
            Every clip below was generated by the same pipeline you get in the studio.
          </p>
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {showcase.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-3xl border border-white/10"
            >
              <video
                src={item.video}
                poster={item.video.replace('.mp4', '.jpg')}
                autoPlay
                muted
                loop
                playsInline
                preload="none"
                className="aspect-video h-full w-full object-cover transition duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-aura-void/85 via-transparent to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <div className="font-display font-semibold text-aura-ink">{item.title}</div>
                <div className="text-xs text-aura-mute">{item.tag}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA BAND */}
      <section className="relative overflow-hidden rounded-4xl border border-white/10 p-10 sm:p-14">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-aura-iris/20 via-aura-flare/12 to-aura-gold/12" />
        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <h2 className="font-display text-3xl font-semibold text-aura-ink sm:text-4xl">
              Your first clip is waiting.
            </h2>
            <p className="max-w-xl text-aura-mute">
              Start free with the dev studio — describe a scene and watch {BRAND.name}
              bring it to life.
            </p>
          </div>
          <Button as="a" href="/create-video" variant="primary" className="text-base">
            {BRAND.cta}
          </Button>
        </div>
      </section>
    </div>
  );
}
