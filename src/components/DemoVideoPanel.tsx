'use client';

import React, { useState } from 'react';

const CLIPS = [
  { src: '/samples/aurora-veil.mp4', poster: '/samples/aurora-veil.jpg', label: 'Aurora Veil' },
  { src: '/samples/ink-bloom.mp4', poster: '/samples/ink-bloom.jpg', label: 'Ink Bloom' },
  { src: '/samples/dune-drift.mp4', poster: '/samples/dune-drift.jpg', label: 'Dune Drift' },
];

export default function DemoVideoPanel() {
  const [i, setI] = useState(0);
  const clip = CLIPS[i];

  return (
    <section className="glass relative overflow-hidden rounded-3xl p-5">
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 sm:w-1/2">
          <video
            key={clip.src}
            src={clip.src}
            poster={clip.poster}
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="h-full w-full object-cover"
          />
          <span className="absolute bottom-2 left-3 rounded-full bg-black/50 px-2 py-0.5 text-xs text-aura-ink backdrop-blur">
            {clip.label}
          </span>
        </div>
        <div className="flex flex-1 flex-col justify-center gap-3">
          <h3 className="font-display text-lg font-semibold text-aura-ink">See it in motion</h3>
          <p className="text-sm text-aura-mute">
            Real clips made with this exact pipeline. Cycle a few, then make your own below.
          </p>
          <div className="flex gap-2">
            {CLIPS.map((c, idx) => (
              <button
                key={c.src}
                onClick={() => setI(idx)}
                aria-label={`Show ${c.label}`}
                className={`h-2 w-8 rounded-full transition ${
                  idx === i ? 'bg-gradient-to-r from-aura-iris to-aura-flare' : 'bg-white/15 hover:bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
