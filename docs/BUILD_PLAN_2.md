# BUILD_PLAN_2 — Output pipeline + playback speed

> Plan for **/build with agents**. Goal: generated videos must play **instantly**.
> Root cause: we store the raw fal.media URL (remote, not faststart) → slow first play.
> Fix: post-process the fal output (download → faststart transcode → poster) and host it
> from our own storage, so playback streams from our domain and starts immediately.

## Project facts
- Root: `C:\Users\bogda\Downloads\MVP_AI-main\MVP_AI-main` (Windows, Next.js 14, node runtime).
- `ffmpeg-static` is already installed (used for sample optimization).
- Storage abstraction `lib/storage.ts`: `getStorage().upload(buffer, key, contentType) -> {url,key}`.
  Dev driver = LocalDisk (writes public/uploads, served at `/uploads/...` — fast + local).
- Callback route currently sets `outputUrl` to the raw fal URL. We will replace that with
  our hosted, optimized URL.

## Safety (ALL agents)
- Edit ONLY your owned files (Section "Ownership"). Never touch another agent's files.
- Do NOT run `docker`, `npm run build`, `prisma migrate`, `npm install`, or start servers.
  Produce code only. The lead runs build/migrate/tests/restart afterwards.
- No secrets in code. TypeScript strict, no `as any`. Match existing style.
- Route handlers run in the Node runtime (ffmpeg via child_process is OK here). Do NOT add
  `export const runtime = 'edge'`.

## CONTRACTS (frozen — code against these exactly)

### C1 — `src/lib/media.ts` (NEW, owned by Agent MEDIA)
```ts
export interface OptimizedVideo {
  video: Buffer;        // faststart H.264 mp4
  poster: Buffer;       // single-frame JPEG
  contentType: 'video/mp4';
}
// Downloads a remote video URL, transcodes to web-optimized faststart mp4,
// and extracts a poster frame. Throws on failure (caller handles fallback).
export async function fetchAndOptimizeVideo(srcUrl: string): Promise<OptimizedVideo>;
```
Implementation notes:
- Use `ffmpeg-static` (default export = binary path) via `node:child_process` (execFile/spawn).
- Download srcUrl with `fetch` to a temp file in `os.tmpdir()`; clean up temp files in `finally`.
- Video args: `-movflags +faststart -c:v libx264 -crf 26 -preset veryfast -pix_fmt yuv420p -an`.
- Poster args: `-frames:v 1 -q:v 4`.
- Read outputs back into Buffers; return them. Do not write into public/ here (storage does that).

### C2 — `src/app/api/video/callback/route.ts` (EDIT, owned by Agent CALLBACK)
On a successful callback (has `outputUrl`, no `error`), BEFORE marking DONE:
1. `import { fetchAndOptimizeVideo } from '@/lib/media'` and `getStorage` from `@/lib/storage`.
2. Try: `const { video, poster, contentType } = await fetchAndOptimizeVideo(outputUrl);`
   - `const base = \`outputs/${jobId}\`;`
   - `const v = await getStorage().upload(video, \`${base}.mp4\`, contentType);`
   - `const p = await getStorage().upload(poster, \`${base}.jpg\`, 'image/jpeg');`
   - set `finalOutputUrl = v.url`, `finalThumbnailUrl = p.url`.
3. On ANY error in step 2: log it and **fall back** to the raw fal `outputUrl` (never lose the result);
   `finalThumbnailUrl = thumbnailUrl ?? null`.
4. Update VideoJob `{ status: 'DONE', outputUrl: finalOutputUrl, thumbnailUrl: finalThumbnailUrl }`
   then `spendCredits(...)` exactly as today. Keep the existing secret check, double-charge guard,
   and FAILED handling unchanged.
- Keep the response shape `{ ok: true }`.

### C3 — `src/app/create-video/page.tsx` (EDIT, owned by Agent UI)
- While polling (QUEUED/PROCESSING) show a clean animated skeleton in the "Your video" slot
  (not just text), so the wait feels fast.
- On DONE: the `<video>` already uses `outputUrl` + `poster={thumbnailUrl}`. Ensure:
  `autoPlay muted playsInline preload="metadata"` and `poster` set when present.
- Do NOT change the fetch/poll logic or API shapes. Visual/loading polish only.

## Ownership (no overlaps)
| File | Owner |
|------|-------|
| src/lib/media.ts (new) | MEDIA |
| src/app/api/video/callback/route.ts | CALLBACK |
| src/app/create-video/page.tsx | UI |
| everything else | nobody (do not touch) |

## Spawn order
1. MEDIA first (produces the contract C1 implementation).
2. CALLBACK + UI in parallel (code against frozen C1/C2/C3).
3. Lead validates: `tsc`, `npm run build`, restart prod, e2e (create → confirm outputUrl is a
   `/uploads/outputs/...` URL and plays), measure playback.

## Acceptance
- Generated video `outputUrl` is served from our domain (`/uploads/outputs/<jobId>.mp4`), faststart.
- Poster shows instantly; playback starts immediately.
- If transcode fails, job still completes with the fal URL (graceful fallback).
- `tsc` + `build` pass; e2e create still returns DONE.
