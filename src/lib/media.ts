import { execFile } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import os from 'node:os';
import path from 'node:path';
import { promisify } from 'node:util';
import ffmpegPath from 'ffmpeg-static';

/** Resolve the ffmpeg binary, with a fallback for bundlers that rewrite the path. */
function resolveFfmpeg(): string {
  if (ffmpegPath && existsSync(ffmpegPath)) return ffmpegPath;
  const bin = process.platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const fallback = path.join(process.cwd(), 'node_modules', 'ffmpeg-static', bin);
  if (existsSync(fallback)) return fallback;
  throw new Error('ffmpeg-static binary not found');
}

/**
 * Media optimization (contract C1).
 *
 * Downloads a remote video URL, transcodes it to a web-optimized faststart
 * H.264 mp4, and extracts a single-frame JPEG poster. Throws on any failure;
 * the caller is responsible for falling back to the original URL.
 */

export interface OptimizedVideo {
  /** faststart H.264 mp4 */
  video: Buffer;
  /** single-frame JPEG */
  poster: Buffer;
  contentType: 'video/mp4';
}

const execFileAsync = promisify(execFile);

// ffmpeg can stall reading stdin when spawned without a TTY, and writes lots of
// progress to stderr — so always pass -nostdin and give execFile room + a hard cap.
const FFMPEG_OPTS = { maxBuffer: 64 * 1024 * 1024, timeout: 90_000 } as const;

/**
 * Downloads a remote video, transcodes to a web-optimized faststart mp4,
 * and extracts a poster frame. Throws on failure (caller handles fallback).
 */
export async function fetchAndOptimizeVideo(srcUrl: string): Promise<OptimizedVideo> {
  const ffmpeg = resolveFfmpeg();

  const res = await fetch(srcUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch source video (${res.status} ${res.statusText}) from ${srcUrl}`);
  }
  const input = Buffer.from(await res.arrayBuffer());

  const dir = await mkdtemp(path.join(os.tmpdir(), 'media-'));
  const id = randomUUID();
  const inPath = path.join(dir, `${id}-in`);
  const outPath = path.join(dir, `${id}-out.mp4`);
  const posterPath = path.join(dir, `${id}-poster.jpg`);

  try {
    await writeFile(inPath, input);

    // Transcode to web-optimized faststart mp4.
    await execFileAsync(ffmpeg, [
      '-nostdin',
      '-y',
      '-i',
      inPath,
      '-movflags',
      '+faststart',
      '-c:v',
      'libx264',
      '-crf',
      '26',
      '-preset',
      'veryfast',
      '-pix_fmt',
      'yuv420p',
      '-an',
      outPath,
    ], FFMPEG_OPTS);

    // Extract a single-frame poster from the optimized output.
    await execFileAsync(
      ffmpeg,
      ['-nostdin', '-y', '-i', outPath, '-frames:v', '1', '-q:v', '4', posterPath],
      FFMPEG_OPTS,
    );

    const [video, poster] = await Promise.all([readFile(outPath), readFile(posterPath)]);

    return { video, poster, contentType: 'video/mp4' };
  } finally {
    // Best-effort cleanup of all temp files; ignore unlink errors.
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
