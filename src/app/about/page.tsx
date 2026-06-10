import Card from '@/components/Card';
import { BRAND } from '@/lib/brand';

const principles = [
  {
    title: 'Image or text — your call',
    description:
      'Bring a keyframe to anchor the look, or start from pure description. Either way you get motion in seconds.',
  },
  {
    title: 'Model-agnostic core',
    description:
      'A clean provider layer means we can ride the best video model available — and swap to a better one without a rewrite.',
  },
  {
    title: 'Built to be fast',
    description:
      'Async render jobs, optimized media, and instant-start playback. Speed is a feature, not an afterthought.',
  },
  {
    title: 'Responsible by default',
    description:
      'Inputs are validated, prompts stay yours, and credits are only spent on a successful render.',
  },
];

export default function AboutPage() {
  return (
    <div className="space-y-16 py-6">
      <section className="grid items-center gap-10 lg:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-5">
          <p className="text-sm uppercase tracking-[0.25em] text-aura-flare">About</p>
          <h1 className="font-display text-4xl font-semibold leading-tight text-aura-ink sm:text-5xl">
            A studio that turns ideas into <span className="gradient-text">moving images</span>.
          </h1>
          <p className="max-w-xl text-lg leading-relaxed text-aura-mute">
            {BRAND.name} fuses prompt understanding, image conditioning, and modern
            video models into one simple flow. You bring the vision — {BRAND.name}
            handles the motion, the pacing, and the render.
          </p>
        </div>
        <div className="relative overflow-hidden rounded-4xl border border-white/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/astro-shore.jpg"
            alt="A cinematic AI-generated frame"
            className="aspect-[4/3] w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-aura-void/70 via-transparent to-transparent" />
          <span className="absolute bottom-3 left-4 text-xs text-aura-mute">Generated with {BRAND.name}</span>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        {principles.map((p, i) => (
          <Card key={p.title} title={p.title} description={p.description} accent={i % 2 ? 'purple' : 'blue'} />
        ))}
      </section>

      <section className="glass relative overflow-hidden rounded-4xl p-8 sm:p-10">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-aura-iris/12 via-transparent to-aura-gold/10" />
        <h2 className="font-display text-2xl font-semibold text-aura-ink">Where we&apos;re headed</h2>
        <p className="mt-2 max-w-2xl text-aura-mute">
          Premium models, longer clips, in-app galleries, and team workspaces are on the
          way. The foundation is built to grow — fast.
        </p>
      </section>
    </div>
  );
}
