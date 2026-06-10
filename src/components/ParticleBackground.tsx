// Aurora background — drifting blurred light blobs over a deep void.
// Pure CSS (no canvas) so it's smooth and cheap on the GPU.
export default function ParticleBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 overflow-hidden bg-aura-void"
    >
      {/* iris (violet) */}
      <div className="aura-blob absolute -left-[10%] -top-[15%] h-[55vmax] w-[55vmax] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.30),transparent_60%)]" />
      {/* flare (rose) */}
      <div
        className="aura-blob absolute right-[-15%] top-[5%] h-[50vmax] w-[50vmax] rounded-full bg-[radial-gradient(circle,rgba(251,113,133,0.22),transparent_60%)]"
        style={{ animationDelay: '-6s' }}
      />
      {/* gold */}
      <div
        className="aura-blob absolute bottom-[-20%] left-[20%] h-[45vmax] w-[45vmax] rounded-full bg-[radial-gradient(circle,rgba(251,191,36,0.14),transparent_60%)]"
        style={{ animationDelay: '-12s' }}
      />
      {/* mint accent */}
      <div
        className="aura-blob absolute bottom-[0%] right-[10%] h-[38vmax] w-[38vmax] rounded-full bg-[radial-gradient(circle,rgba(52,211,153,0.12),transparent_60%)]"
        style={{ animationDelay: '-3s' }}
      />
      {/* vignette for depth + legibility */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(8,7,13,0.85)_100%)]" />
    </div>
  );
}
