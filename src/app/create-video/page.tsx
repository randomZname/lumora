'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Button from '@/components/Button';
import Card from '@/components/Card';
import DemoVideoPanel from '@/components/DemoVideoPanel';

type ModelChoice = 'auto' | 'ltx' | 'kling';

type FormState = {
  text: string;
  duration: '5' | '10';
  imageFile: File | null;
  model: ModelChoice;
};

const MODEL_OPTIONS: { value: ModelChoice; label: string; hint: string }[] = [
  { value: 'auto', label: 'Auto', hint: 'Best for your input' },
  { value: 'ltx', label: 'LTX · fast', hint: 'Cheap & quick' },
  { value: 'kling', label: 'Kling · premium', hint: 'Top quality' },
];

type JobStatus = 'QUEUED' | 'PROCESSING' | 'DONE' | 'FAILED';

// GET /api/video/[id] response shape (contract 2.5)
type JobResponse = {
  id: string;
  status: JobStatus;
  outputUrl: string | null;
  thumbnailUrl: string | null;
  error: string | null;
  model: string | null;
  createdAt: string;
};

// Friendly label for the model slug shown on a finished clip.
function modelLabel(model: string | null): string {
  if (!model) return 'AI';
  if (model.includes('kling')) return 'Kling 2.5 Turbo';
  if (model.includes('ltx')) return 'LTX Video';
  return model;
}

// Local UI phase machine
type Phase =
  | { kind: 'idle' }
  | { kind: 'submitting' }
  | { kind: 'processing'; status: JobStatus }
  | { kind: 'done'; job: JobResponse }
  | { kind: 'failed'; message: string }
  | { kind: 'error'; message: string };

const POLL_INTERVAL_MS = 3000;
// Render (fal) + transcode can take a few minutes — poll up to ~6 min.
const MAX_POLLS = 120;

export default function CreateVideoPage() {
  const [form, setForm] = useState<FormState>({
    text: '',
    duration: '5',
    imageFile: null,
    model: 'auto',
  });

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [phase, setPhase] = useState<Phase>({ kind: 'idle' });

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBusy = phase.kind === 'submitting' || phase.kind === 'processing';

  // Image is optional — only the text prompt is required.
  const isValid = useMemo(() => form.text.trim().length > 5, [form.text]);

  // Clean up object URL + any pending poll timer on unmount.
  useEffect(() => {
    return () => {
      if (pollTimer.current) clearTimeout(pollTimer.current);
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
    // imagePreview intentionally captured via closure cleanup on unmount only;
    // per-change revocation handled in handleFileChange.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleFileChange = (file: File | null) => {
    setForm((prev) => ({ ...prev, imageFile: file }));
    setImagePreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return file ? URL.createObjectURL(file) : null;
    });
  };

  const stopPolling = () => {
    if (pollTimer.current) {
      clearTimeout(pollTimer.current);
      pollTimer.current = null;
    }
  };

  const pollJob = async (jobId: string, attempt: number) => {
    if (attempt > MAX_POLLS) {
      setPhase({
        kind: 'error',
        message:
          'Timed out waiting for the render to finish. It may still complete — check back shortly.',
      });
      return;
    }

    try {
      const res = await fetch(`/api/video/${jobId}`);

      if (res.status === 401) {
        setPhase({
          kind: 'error',
          message: 'Your session expired. Please sign in again.',
        });
        return;
      }
      if (res.status === 404) {
        setPhase({
          kind: 'error',
          message: 'We could not find this render job.',
        });
        return;
      }
      if (!res.ok) {
        setPhase({
          kind: 'error',
          message: 'Could not check render status. Retrying…',
        });
        pollTimer.current = setTimeout(
          () => void pollJob(jobId, attempt + 1),
          POLL_INTERVAL_MS,
        );
        return;
      }

      const job = (await res.json()) as JobResponse;

      if (job.status === 'DONE') {
        setPhase({ kind: 'done', job });
        return;
      }
      if (job.status === 'FAILED') {
        setPhase({
          kind: 'failed',
          message: job.error || 'Generation failed. Please try again.',
        });
        return;
      }

      // QUEUED or PROCESSING -> keep polling
      setPhase({ kind: 'processing', status: job.status });
      pollTimer.current = setTimeout(
        () => void pollJob(jobId, attempt + 1),
        POLL_INTERVAL_MS,
      );
    } catch (err) {
      console.error(err);
      // Transient network error — retry within the poll budget.
      pollTimer.current = setTimeout(
        () => void pollJob(jobId, attempt + 1),
        POLL_INTERVAL_MS,
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.text.trim()) newErrors.text = 'Please describe the scene.';
    if (form.duration !== '5' && form.duration !== '10') {
      newErrors.duration = 'Choose a valid duration.';
    }

    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;

    const body = new FormData();
    body.append('text', form.text);
    body.append('duration', form.duration);
    body.append('model', form.model);
    if (form.imageFile) body.append('image', form.imageFile);

    stopPolling();
    setPhase({ kind: 'submitting' });

    try {
      const res = await fetch('/api/video/create', { method: 'POST', body });

      if (res.status === 401) {
        setPhase({
          kind: 'error',
          message: 'Please sign in to create a video.',
        });
        return;
      }
      if (res.status === 402) {
        setPhase({
          kind: 'error',
          message:
            'You are out of credits. Top up your balance to keep generating.',
        });
        return;
      }
      if (res.status === 400) {
        let message = 'Please check your inputs and try again.';
        try {
          const data = (await res.json()) as { message?: string };
          if (data?.message) message = data.message;
        } catch {
          // ignore parse error, use default message
        }
        setPhase({ kind: 'error', message });
        return;
      }
      if (!res.ok) {
        setPhase({
          kind: 'error',
          message: 'Something went wrong on our side. Please try again.',
        });
        return;
      }

      const data = (await res.json()) as { jobId?: string };
      if (!data?.jobId) {
        setPhase({
          kind: 'error',
          message: 'Unexpected response from the server. Please try again.',
        });
        return;
      }

      // Kick off polling.
      setPhase({ kind: 'processing', status: 'QUEUED' });
      void pollJob(data.jobId, 1);
    } catch (err) {
      console.error(err);
      setPhase({ kind: 'error', message: 'Network error. Try again.' });
    }
  };

  const resetForAnother = () => {
    stopPolling();
    setPhase({ kind: 'idle' });
    setErrors({});
    setForm({ text: '', duration: '5', imageFile: null, model: 'auto' });
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setImagePreview(null);
    const input = document.getElementById('image') as HTMLInputElement | null;
    if (input) input.value = '';
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <p className="text-sm uppercase tracking-[0.25em] text-aura-iris">
          The studio
        </p>
        <h1 className="font-display text-4xl font-semibold text-aura-ink sm:text-5xl">
          Describe it. <span className="gradient-text">Watch it move.</span>
        </h1>
        <p className="max-w-2xl text-aura-mute">
          Write a prompt and hit generate — an image is optional. Add a reference
          frame for image-to-video, or go text-only. Your clip renders in seconds.
        </p>
      </div>

      {/* ✅ ТУК Е DEMO ПАНЕЛЪТ (точното място) */}
      <DemoVideoPanel />

      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <Card
          title="Generation request"
          description="Your request is validated and queued for the AI render pipeline."
          accent="purple"
          className="p-0"
        >
          <form className="space-y-6 p-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-100">
                Scene description
              </label>
              <textarea
                name="text"
                required
                disabled={isBusy}
                aria-invalid={Boolean(errors.text)}
                value={form.text}
                onChange={(e) =>
                  setForm((prev) => ({ ...prev, text: e.target.value }))
                }
                placeholder="Ex: A neon-lit alley with rain reflecting on the ground, camera dolly forward, synthwave mood."
                className="min-h-[140px] w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-slate-100 outline-none transition focus:border-neon-blue focus:ring-1 focus:ring-neon-blue/60 disabled:opacity-60"
              />
              {errors.text && (
                <p className="text-xs text-red-400">{errors.text}</p>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-sm font-semibold text-slate-100">
                Reference image{' '}
                <span className="font-normal text-slate-400">(optional)</span>
              </label>

              <label
                htmlFor="image"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 bg-black/40 px-4 py-3 text-sm text-slate-200 transition hover:border-neon-blue/60"
              >
                <div className="space-y-1">
                  <p className="font-semibold">
                    {form.imageFile ? form.imageFile.name : 'Upload image (optional)'}
                  </p>
                  <p className="text-xs text-slate-400">
                    Skip it for text-to-video. JPEG, PNG, or WEBP. Under 5MB.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs">
                  Browse
                </span>
              </label>

              <input
                id="image"
                name="image"
                type="file"
                accept="image/png,image/jpeg,image/webp"
                className="sr-only"
                disabled={isBusy}
                onChange={(e) => handleFileChange(e.target.files?.[0] ?? null)}
              />

              {imagePreview && (
                <div className="mt-2 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imagePreview}
                    alt="Reference preview"
                    className="max-h-56 w-full object-cover"
                  />
                </div>
              )}

              {errors.image && (
                <p className="text-xs text-red-400">{errors.image}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-100">
                Duration
              </span>
              <div className="grid grid-cols-2 gap-3">
                {(['5', '10'] as const).map((value) => (
                  <label
                    key={value}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-4 py-3 text-sm transition ${
                      form.duration === value
                        ? 'border-neon-blue/70 bg-neon-blue/10'
                        : 'border-white/10 bg-black/40 hover:border-neon-blue/40'
                    } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                  >
                    <span>{value} seconds</span>
                    <input
                      type="radio"
                      name="duration"
                      value={value}
                      disabled={isBusy}
                      checked={form.duration === value}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          duration: e.target.value as '5' | '10',
                        }))
                      }
                      className="h-4 w-4 accent-neon-blue"
                    />
                  </label>
                ))}
              </div>
              {errors.duration && (
                <p className="text-xs text-red-400">{errors.duration}</p>
              )}
            </div>

            <div className="space-y-2">
              <span className="text-sm font-semibold text-slate-100">Model</span>
              <div className="grid grid-cols-3 gap-3">
                {MODEL_OPTIONS.map((opt) => {
                  const active = form.model === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      disabled={isBusy}
                      onClick={() =>
                        setForm((prev) => ({ ...prev, model: opt.value }))
                      }
                      className={`flex flex-col items-start gap-0.5 rounded-xl border px-3 py-2.5 text-left transition ${
                        active
                          ? 'border-aura-iris/70 bg-aura-iris/10'
                          : 'border-white/10 bg-black/40 hover:border-aura-iris/40'
                      } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      <span className="text-sm font-semibold text-aura-ink">
                        {opt.label}
                      </span>
                      <span className="text-[11px] leading-tight text-aura-mute">
                        {opt.hint}
                      </span>
                    </button>
                  );
                })}
              </div>
              {errors.model && (
                <p className="text-xs text-red-400">{errors.model}</p>
              )}
            </div>

            {/* Processing / progress state */}
            {phase.kind === 'submitting' && (
              <StatusBanner tone="info">
                Uploading your request…
              </StatusBanner>
            )}
            {phase.kind === 'processing' && (
              <div className="rounded-xl border border-neon-blue/40 bg-neon-blue/10 px-4 py-3 text-sm text-neon-blue">
                <div className="flex items-center gap-3">
                  <Spinner />
                  <span>
                    {phase.status === 'QUEUED'
                      ? 'Queued — your render is lined up…'
                      : 'Rendering your video… this can take a moment.'}
                  </span>
                </div>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                  <div className="h-full w-1/3 animate-pulse rounded-full bg-neon-blue" />
                </div>
              </div>
            )}
            {phase.kind === 'failed' && (
              <StatusBanner tone="error">{phase.message}</StatusBanner>
            )}
            {phase.kind === 'error' && (
              <StatusBanner tone="error">{phase.message}</StatusBanner>
            )}
            {phase.kind === 'done' && (
              <StatusBanner tone="success">
                Your video is ready — see the preview on the right.
              </StatusBanner>
            )}

            <div className="flex flex-col items-center justify-center gap-3 pt-4">
              {phase.kind === 'done' ||
              phase.kind === 'failed' ||
              phase.kind === 'error' ? (
                <Button
                  type="button"
                  variant="neon"
                  className="text-base"
                  onClick={resetForAnother}
                >
                  Create another
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isBusy || !isValid}
                  variant="neon"
                  className="text-base"
                >
                  {phase.kind === 'submitting'
                    ? 'Creating…'
                    : phase.kind === 'processing'
                      ? 'Rendering…'
                      : 'Create video'}
                </Button>
              )}
            </div>
          </form>
        </Card>

        <div className="space-y-4">
          <Card
            title="Live checklist"
            description="Validation kicks in before the request is sent."
            accent="green"
          >
            <ul className="space-y-2 text-sm text-slate-300">
              <ChecklistItem
                label="Description length"
                ok={form.text.trim().length > 5}
              />
              <ChecklistItem
                label="Image (optional)"
                ok={Boolean(form.imageFile)}
              />
              <ChecklistItem
                label="Duration chosen"
                ok={Boolean(form.duration)}
              />
            </ul>
          </Card>

          {phase.kind === 'done' ? (
            <Card
              title="Your video"
              description={`Generated with ${modelLabel(phase.job.model)}.`}
              accent="blue"
            >
              <div className="space-y-3">
                <div className="overflow-hidden rounded-xl border border-white/10">
                  <video
                    key={phase.job.outputUrl ?? phase.job.id}
                    src={phase.job.outputUrl ?? undefined}
                    poster={phase.job.thumbnailUrl ?? undefined}
                    controls
                    autoPlay
                    muted
                    playsInline
                    preload="metadata"
                    className="w-full"
                  />
                </div>
                {phase.job.outputUrl && (
                  <Button
                    as="a"
                    href={phase.job.outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    className="w-full justify-center text-sm"
                  >
                    Open in new tab
                  </Button>
                )}
              </div>
            </Card>
          ) : isBusy ? (
            <Card
              title="Your video"
              description="Rendering — this slot fills the moment it's ready."
              accent="blue"
            >
              <VideoSkeleton
                label={
                  phase.kind === 'submitting'
                    ? 'Uploading your request…'
                    : phase.status === 'QUEUED'
                      ? 'Queued — your render is lined up…'
                      : 'Rendering your video…'
                }
              />
            </Card>
          ) : (
            <Card
              title="What happens next?"
              description="Your request runs through the async render pipeline."
              accent="purple"
            >
              <ol className="space-y-2 text-sm text-slate-300">
                <li>1) Validate payload &amp; file type</li>
                <li>2) Upload your reference frame</li>
                <li>3) Queue the job &amp; start generation</li>
                <li>4) Poll until your video is ready</li>
              </ol>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function StatusBanner({
  tone,
  children,
}: {
  tone: 'success' | 'error' | 'info';
  children: React.ReactNode;
}) {
  const toneClasses =
    tone === 'success'
      ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-200'
      : tone === 'error'
        ? 'border-red-500/50 bg-red-500/10 text-red-200'
        : 'border-neon-blue/40 bg-neon-blue/10 text-neon-blue';
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${toneClasses}`}>
      {children}
    </div>
  );
}

function VideoSkeleton({ label }: { label: string }) {
  return (
    <div className="space-y-3">
      {/* Aspect-video shimmer block standing in for the player. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-white/10 bg-white/5">
        {/* Soft aurora base glow. */}
        <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-aura-iris/25 via-aura-flare/10 to-transparent" />
        {/* Sweeping shimmer highlight. */}
        <div className="absolute inset-y-0 -left-full w-1/2 animate-video-shimmer bg-gradient-to-r from-transparent via-white/15 to-transparent" />
        {/* Center pulsing play glyph. */}
        <div className="absolute inset-0 flex items-center justify-center">
          <span
            aria-hidden
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/15 bg-white/5 text-aura-ink/80 backdrop-blur animate-pulse"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        </div>
      </div>

      {/* Status line. */}
      <div className="flex items-center gap-3 text-sm text-aura-mute">
        <Spinner />
        <span aria-live="polite">{label}</span>
      </div>

      {/* Faux metadata lines to complete the skeleton. */}
      <div className="space-y-2" aria-hidden>
        <div className="h-3 w-2/3 animate-pulse rounded-full bg-white/5" />
        <div className="h-3 w-1/3 animate-pulse rounded-full bg-white/5" />
      </div>

      <style jsx>{`
        @keyframes video-shimmer {
          100% {
            transform: translateX(400%);
          }
        }
        :global(.animate-video-shimmer) {
          animation: video-shimmer 1.6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

function Spinner() {
  return (
    <span
      aria-hidden
      className="inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-neon-blue/30 border-t-neon-blue"
    />
  );
}

function ChecklistItem({ label, ok }: { label: string; ok: boolean }) {
  return (
    <li className="flex items-center gap-2">
      <span
        aria-hidden
        className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${
          ok
            ? 'bg-emerald-500/20 text-emerald-300'
            : 'bg-white/5 text-slate-500'
        }`}
      >
        {ok ? '✓' : '•'}
      </span>
      <span className="text-slate-200">{label}</span>
    </li>
  );
}
