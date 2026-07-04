import crypto from 'crypto';
import { prisma } from '@/lib/prisma';
import { spendCredits } from '@/lib/credits';
import { fetchAndOptimizeVideo } from '@/lib/media';
import { getStorage } from '@/lib/storage';

/**
 * Shared finalization for all async result paths (n8n/provider callback,
 * fal webhook). Marks the job DONE/FAILED exactly once and charges credits
 * on success.
 */

export interface FinalizeInput {
  jobId: string;
  outputUrl?: string;
  thumbnailUrl?: string;
  error?: string;
}

export type FinalizeResult =
  | { ok: true }
  | { ok: false; status: number; message: string };

/**
 * Self-hosting (faststart transcode + poster) requires a writable, persistent
 * disk or S3-compatible storage. On Vercel the filesystem is ephemeral, so
 * with the local driver we keep the provider's URL instead.
 */
function canSelfHostMedia(): boolean {
  if (process.env.STORAGE_DRIVER === 's3') return true;
  return !process.env.VERCEL;
}

export async function finalizeVideoJob(input: FinalizeInput): Promise<FinalizeResult> {
  const { jobId, outputUrl, thumbnailUrl, error } = input;

  const job = await prisma.videoJob.findUnique({ where: { id: jobId } });
  if (!job) return { ok: false, status: 404, message: 'Not found' };

  // Guard against double processing / double-charge.
  if (job.status === 'DONE' || job.status === 'FAILED') return { ok: true };

  if (error) {
    await prisma.videoJob.update({
      where: { id: job.id },
      data: { status: 'FAILED', error },
    });
    return { ok: true };
  }

  let finalOutputUrl = outputUrl ?? null;
  let finalThumbnailUrl = thumbnailUrl ?? null;

  if (outputUrl && canSelfHostMedia()) {
    try {
      const opt = await fetchAndOptimizeVideo(outputUrl);
      const base = `outputs/${job.id}`;
      const v = await getStorage().upload(opt.video, `${base}.mp4`, opt.contentType);
      const p = await getStorage().upload(opt.poster, `${base}.jpg`, 'image/jpeg');
      finalOutputUrl = v.url;
      finalThumbnailUrl = p.url;
    } catch (err) {
      console.error('[finalize] video optimize failed, using raw url', err);
    }
  }

  await prisma.videoJob.update({
    where: { id: job.id },
    data: {
      status: 'DONE',
      outputUrl: finalOutputUrl,
      thumbnailUrl: finalThumbnailUrl,
    },
  });

  await spendCredits(job.userId, job.creditsCost, job.id);

  return { ok: true };
}

/** HMAC tag binding a jobId to our callback secret (used in webhook URLs). */
export function signJobId(jobId: string): string {
  const secret = process.env.N8N_CALLBACK_SECRET;
  // An empty key would make signatures forgeable — fail loudly instead.
  if (!secret) throw new Error('N8N_CALLBACK_SECRET is required to sign webhook URLs');
  return crypto.createHmac('sha256', secret).update(jobId).digest('hex');
}

export function verifyJobSignature(jobId: string, sig: string): boolean {
  if (!process.env.N8N_CALLBACK_SECRET) return false;
  const expected = signJobId(jobId);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(sig, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** Constant-time comparison for the shared callback secret. */
export function verifyCallbackSecret(secret: string | undefined): boolean {
  const expected = process.env.N8N_CALLBACK_SECRET;
  if (!expected || !secret) return false;
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(secret, 'utf8');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
