/**
 * Video provider abstraction (contract 2.3).
 * Selected by env VIDEO_PROVIDER=stub|fal (default: stub).
 *
 * The provider kicks off generation and returns immediately; the rendered
 * result arrives asynchronously via POST /api/video/callback.
 */

export interface GenerateInput {
  jobId: string;
  /** Optional — when absent the provider runs text-to-video. */
  inputImageUrl?: string | null;
  text: string;
  duration: number;
  /** Explicit fal model slug (overrides the env/auto resolution). */
  model?: string;
  /** Raw image bytes — used by providers that need to send the image directly
   *  (e.g. fal.ai, when the stored URL is not publicly reachable in dev). */
  imageBuffer?: Buffer;
  imageContentType?: string;
}

/** POST to our own callback so all providers share one finalize path. */
async function postCallback(
  body: { jobId: string; outputUrl?: string; error?: string },
): Promise<void> {
  const base = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/+$/, '');
  await fetch(`${base}/api/video/callback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...body, secret: process.env.N8N_CALLBACK_SECRET }),
  }).catch((err: unknown) => {
    console.error('[postCallback] failed:', err);
  });
}

export interface VideoProvider {
  readonly name: string;
  /** kicks off generation; returns nothing (result arrives via callback) OR throws */
  start(input: GenerateInput): Promise<void>;
}

/** Delay (ms) before the stub fires its callback, to mimic a real async render. */
const STUB_CALLBACK_DELAY_MS = 3000;

/**
 * StubProvider — wires the full async flow with no external API keys.
 * On start(), schedules (non-blocking) a callback to
 *   ${NEXTAUTH_URL}/api/video/callback
 * with { jobId, outputUrl: SAMPLE_VIDEO_URL, secret: N8N_CALLBACK_SECRET }.
 */
export class StubProvider implements VideoProvider {
  readonly name = 'stub';

  async start(input: GenerateInput): Promise<void> {
    // Fire-and-forget after a short delay so /api/video/create returns fast.
    setTimeout(() => {
      void postCallback({
        jobId: input.jobId,
        outputUrl: process.env.SAMPLE_VIDEO_URL,
      });
    }, STUB_CALLBACK_DELAY_MS);
  }
}

// Image-to-video default = Kling 2.5 Turbo Pro (fast + high quality).
const FAL_DEFAULT_MODEL = 'fal-ai/kling-video/v2.5-turbo/pro/image-to-video';
// Text-to-video default = LTX (Kling has no text-only endpoint here).
const FAL_DEFAULT_MODEL_T2V = 'fal-ai/ltx-video-13b-distilled';
const FAL_POLL_INTERVAL_MS = 5000;
const FAL_MAX_POLLS = 120; // ~10 min ceiling

const FAL_LTX_I2V = 'fal-ai/ltx-video-13b-distilled/image-to-video';
const FAL_KLING_T2V = 'fal-ai/kling-video/v2.5-turbo/pro/text-to-video';

const klingI2V = () => process.env.FAL_MODEL ?? FAL_DEFAULT_MODEL;
const ltxT2V = () => process.env.FAL_MODEL_T2V ?? FAL_DEFAULT_MODEL_T2V;

export type ModelChoice = 'auto' | 'ltx' | 'kling';

/** Auto: Kling i2v with an image, LTX t2v without. */
export function resolveFalModel(hasImage: boolean): string {
  return hasImage ? klingI2V() : ltxT2V();
}

/**
 * Map a user model choice + image presence to an actual fal slug.
 * With an image -> image-to-video; without -> text-to-video. Both models support both.
 */
export function resolveModelByChoice(choice: ModelChoice, hasImage: boolean): string {
  switch (choice) {
    case 'kling':
      return hasImage ? klingI2V() : FAL_KLING_T2V;
    case 'ltx':
      return hasImage ? FAL_LTX_I2V : ltxT2V();
    case 'auto':
    default:
      return resolveFalModel(hasImage);
  }
}

interface FalSubmitResponse {
  request_id: string;
  status_url: string;
  response_url: string;
}

/**
 * FalProvider — real fal.ai integration via the queue API.
 * Submits the job, then polls fal in the background (webhooks can't reach
 * localhost in dev) and forwards the finished video to our own callback.
 * Model is configurable via FAL_MODEL (default: cheap LTX Video for testing).
 */
export class FalProvider implements VideoProvider {
  readonly name = 'fal';

  async start(input: GenerateInput): Promise<void> {
    const key = process.env.FAL_KEY;
    if (!key) throw new Error('FalProvider requires FAL_KEY');

    const hasImage = !!(input.imageBuffer && input.imageContentType);

    // Explicit model wins; otherwise auto (Kling i2v with image, LTX t2v without).
    const model = input.model ?? resolveFalModel(hasImage);

    // Model-specific params: Kling expects `duration` ("5"|"10"); LTX expects `num_frames`.
    const isKling = model.includes('kling');
    const body: Record<string, unknown> = { prompt: input.text };
    if (isKling) {
      body.duration = String(input.duration);
    } else {
      body.num_frames = Math.max(48, Math.round(input.duration * 24) + 1);
    }
    if (hasImage) {
      // fal needs a reachable image; send it as a data URI (works without public hosting).
      body.image_url = `data:${input.imageContentType};base64,${input.imageBuffer!.toString('base64')}`;
    }

    const submitRes = await fetch(`https://queue.fal.run/${model}`, {
      method: 'POST',
      headers: { Authorization: `Key ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!submitRes.ok) {
      const detail = await submitRes.text().catch(() => '');
      throw new Error(`fal submit failed (${submitRes.status}): ${detail.slice(0, 300)}`);
    }

    const submit = (await submitRes.json()) as FalSubmitResponse;
    // Background poll → forward to our callback. Non-blocking.
    void this.poll(input.jobId, submit, key, 0);
  }

  private async poll(
    jobId: string,
    submit: FalSubmitResponse,
    key: string,
    attempt: number,
  ): Promise<void> {
    if (attempt > FAL_MAX_POLLS) {
      await postCallback({ jobId, error: 'fal render timed out' });
      return;
    }

    try {
      const statusRes = await fetch(submit.status_url, {
        headers: { Authorization: `Key ${key}` },
      });
      const status = (await statusRes.json()) as { status?: string };

      if (status.status === 'COMPLETED') {
        const resultRes = await fetch(submit.response_url, {
          headers: { Authorization: `Key ${key}` },
        });
        const result = (await resultRes.json()) as { video?: { url?: string } };
        const outputUrl = result.video?.url;
        if (outputUrl) {
          await postCallback({ jobId, outputUrl });
        } else {
          await postCallback({ jobId, error: 'fal returned no video url' });
        }
        return;
      }

      if (status.status === 'FAILED' || status.status === 'ERROR') {
        await postCallback({ jobId, error: 'fal render failed' });
        return;
      }

      // IN_QUEUE / IN_PROGRESS → keep polling.
      setTimeout(() => void this.poll(jobId, submit, key, attempt + 1), FAL_POLL_INTERVAL_MS);
    } catch (err) {
      console.error('[FalProvider] poll error:', err);
      setTimeout(() => void this.poll(jobId, submit, key, attempt + 1), FAL_POLL_INTERVAL_MS);
    }
  }
}

/** Picks the video provider from env (default: stub). */
export function getVideoProvider(): VideoProvider {
  const provider = (process.env.VIDEO_PROVIDER ?? 'stub').toLowerCase();

  switch (provider) {
    case 'fal':
      return new FalProvider();
    case 'stub':
    default:
      return new StubProvider();
  }
}
