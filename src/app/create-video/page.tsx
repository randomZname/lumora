'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Button from '@/components/Button';

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
  | { kind: 'error'; message: string; outOfCredits?: boolean };

// Adaptive polling: quick checks early (stub finishes in seconds), then relax.
const POLL_FAST_MS = 2500;
const POLL_SLOW_MS = 5000;
const POLL_FAST_COUNT = 10;
// Render (fal) + transcode can take a few minutes — poll up to ~9 min.
const MAX_POLLS = 120;

const inputClass =
  'w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-aura-ink outline-none transition focus:border-aura-iris focus:ring-1 focus:ring-aura-iris/60 disabled:opacity-60';

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
  const [elapsed, setElapsed] = useState(0);

  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isBusy = phase.kind === 'submitting' || phase.kind === 'processing';

  // Image is optional — only the text prompt is required.
  const isValid = useMemo(() => form.text.trim().length > 5, [form.text]);

  // Elapsed render timer — honest feedback while the pipeline works.
  useEffect(() => {
    if (!isBusy) return;
    setElapsed(0);
    const t = setInterval(() => setElapsed((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, [isBusy]);

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

  const schedulePoll = (jobId: string, attempt: number) => {
    const delay = attempt <= POLL_FAST_COUNT ? POLL_FAST_MS : POLL_SLOW_MS;
    pollTimer.current = setTimeout(() => void pollJob(jobId, attempt), delay);
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
        setPhase({ kind: 'error', message: 'Your session expired. Please sign in again.' });
        return;
      }
      if (res.status === 404) {
        setPhase({ kind: 'error', message: 'We could not find this render job.' });
        return;
      }
      if (!res.ok) {
        schedulePoll(jobId, attempt + 1);
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
      schedulePoll(jobId, attempt + 1);
    } catch (err) {
      console.error(err);
      // Transient network error — retry within the poll budget.
      schedulePoll(jobId, attempt + 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};
    if (!form.text.trim()) newErrors.text = 'Describe the scene first.';
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
        setPhase({ kind: 'error', message: 'Please sign in to create a video.' });
        return;
      }
      if (res.status === 402) {
        setPhase({
          kind: 'error',
          message: 'You are out of credits.',
          outOfCredits: true,
        });
        return;
      }
      if (res.status === 400 || res.status === 429 || res.status === 502) {
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
      schedulePoll(data.jobId, 1);
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
        <p className="text-sm uppercase tracking-[0.25em] text-aura-iris">The studio</p>
        <h1 className="font-display text-4xl font-semibold text-aura-ink sm:text-5xl">
          Describe it. <span className="gradient-text">Watch it move.</span>
        </h1>
        <p className="max-w-2xl text-aura-mute">
          Write a prompt and hit generate — an image is optional. Add a reference frame for
          image-to-video, or go text-only.
        </p>
      </div>

      <div className="grid items-start gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        {/* PROMPT CONSOLE */}
        <div className="glass rounded-4xl p-7">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <label htmlFor="prompt" className="text-sm font-semibold text-aura-ink">
                Prompt
              </label>
              <textarea
                id="prompt"
                name="text"
                required
                disabled={isBusy}
                aria-invalid={Boolean(errors.text)}
                value={form.text}
                onChange={(e) => setForm((prev) => ({ ...prev, text: e.target.value }))}
                placeholder="A neon-lit alley with rain reflecting on the ground, camera dolly forward, synthwave mood."
                className={`min-h-[150px] resize-y ${inputClass}`}
              />
              <div className="flex items-center justify-between text-xs">
                {errors.text ? (
                  <p className="text-red-400">{errors.text}</p>
                ) : (
                  <p className="text-aura-mute/70">
                    Mention subject, motion, and mood — camera moves work great.
                  </p>
                )}
                <span className="tabular-nums text-aura-mute/60">{form.text.length}</span>
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="image"
                className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-dashed border-white/15 bg-black/40 px-4 py-3 text-sm transition hover:border-aura-iris/60"
              >
                <div className="space-y-0.5">
                  <p className="font-semibold text-aura-ink">
                    {form.imageFile ? form.imageFile.name : 'Reference frame (optional)'}
                  </p>
                  <p className="text-xs text-aura-mute">
                    Skip it for text-to-video. JPEG, PNG, or WEBP under 5MB.
                  </p>
                </div>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs text-aura-ink">Browse</span>
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
                <div className="relative mt-2 overflow-hidden rounded-xl border border-white/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imagePreview} alt="Reference preview" className="max-h-56 w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => handleFileChange(null)}
                    disabled={isBusy}
                    className="absolute right-2 top-2 rounded-full bg-aura-void/80 px-2.5 py-1 text-xs text-aura-ink backdrop-blur transition hover:bg-aura-void"
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <span className="text-sm font-semibold text-aura-ink">Duration</span>
                <div className="grid grid-cols-2 gap-2">
                  {(['5', '10'] as const).map((value) => (
                    <label
                      key={value}
                      className={`flex cursor-pointer items-center justify-center rounded-xl border px-3 py-2.5 text-sm font-medium transition ${
                        form.duration === value
                          ? 'border-aura-iris/70 bg-aura-iris/10 text-aura-ink'
                          : 'border-white/10 bg-black/40 text-aura-mute hover:border-aura-iris/40'
                      } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                    >
                      {value}s
                      <input
                        type="radio"
                        name="duration"
                        value={value}
                        disabled={isBusy}
                        checked={form.duration === value}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, duration: e.target.value as '5' | '10' }))
                        }
                        className="sr-only"
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <span className="text-sm font-semibold text-aura-ink">Model</span>
                <div className="grid grid-cols-3 gap-2">
                  {MODEL_OPTIONS.map((opt) => {
                    const active = form.model === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        disabled={isBusy}
                        title={opt.hint}
                        onClick={() => setForm((prev) => ({ ...prev, model: opt.value }))}
                        className={`rounded-xl border px-2 py-2.5 text-center text-xs font-semibold transition ${
                          active
                            ? 'border-aura-iris/70 bg-aura-iris/10 text-aura-ink'
                            : 'border-white/10 bg-black/40 text-aura-mute hover:border-aura-iris/40'
                        } ${isBusy ? 'pointer-events-none opacity-60' : ''}`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {(phase.kind === 'failed' || phase.kind === 'error') && (
              <div className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {phase.message}{' '}
                {phase.kind === 'error' && phase.outOfCredits && (
                  <Link href="/plans" className="font-semibold underline underline-offset-4">
                    Top up credits →
                  </Link>
                )}
              </div>
            )}

            <div className="pt-1">
              {phase.kind === 'done' || phase.kind === 'failed' || phase.kind === 'error' ? (
                <Button type="button" variant="primary" className="w-full justify-center text-base" onClick={resetForAnother}>
                  Create another
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isBusy || !isValid}
                  variant="primary"
                  className="w-full justify-center text-base"
                >
                  {phase.kind === 'submitting'
                    ? 'Sending…'
                    : phase.kind === 'processing'
                      ? 'Rendering…'
                      : 'Generate clip · 1 credit'}
                </Button>
              )}
            </div>
          </form>
        </div>

        {/* SCREENING ROOM */}
        <div className="glass sticky top-24 rounded-4xl p-7">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-aura-ink">Screening room</h2>
            {isBusy && (
              <span className="tabular-nums rounded-full border border-aura-iris/40 bg-aura-iris/10 px-3 py-1 text-xs font-medium text-aura-iris">
                {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}
              </span>
            )}
          </div>

          {phase.kind === 'done' ? (
            <div className="space-y-4">
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-black">
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
              <p className="text-sm text-aura-mute">
                Rendered with <span className="text-aura-ink">{modelLabel(phase.job.model)}</span>.
              </p>
              {phase.job.outputUrl && (
                <div className="flex gap-3">
                  <Button
                    as="a"
                    href={phase.job.outputUrl}
                    download
                    variant="primary"
                    className="flex-1 justify-center text-sm"
                  >
                    Download
                  </Button>
                  <Button
                    as="a"
                    href={phase.job.outputUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    variant="outline"
                    className="flex-1 justify-center text-sm"
                  >
                    Open in new tab
                  </Button>
                </div>
              )}
            </div>
          ) : isBusy ? (
            <div className="space-y-4">
              <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-br from-aura-iris/25 via-aura-flare/10 to-transparent" />
                <div className="shimmer-sweep absolute inset-y-0 -left-full w-1/2 bg-gradient-to-r from-transparent via-white/15 to-transparent" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span
                    aria-hidden
                    className="flex h-12 w-12 animate-pulse items-center justify-center rounded-full border border-white/15 bg-white/5 text-aura-ink/80 backdrop-blur"
                  >
                    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current" aria-hidden>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </span>
                </div>
              </div>
              <p aria-live="polite" className="text-sm text-aura-mute">
                {phase.kind === 'submitting'
                  ? 'Sending your request…'
                  : phase.status === 'QUEUED'
                    ? 'Queued — your render is lined up.'
                    : 'Rendering your clip — premium models take a minute or two.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid aspect-video w-full place-items-center rounded-2xl border border-dashed border-white/15 bg-black/30">
                <div className="space-y-2 text-center">
                  <svg
                    viewBox="0 0 24 24"
                    className="mx-auto h-8 w-8 fill-none stroke-aura-mute/60"
                    strokeWidth="1.5"
                    aria-hidden
                  >
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <path d="M2 9h20M6 5v14M18 5v14" />
                  </svg>
                  <p className="text-sm text-aura-mute">Your clip premieres here.</p>
                </div>
              </div>
              <p className="text-sm text-aura-mute/80">
                Each clip costs 1 credit, charged only when the render succeeds.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
