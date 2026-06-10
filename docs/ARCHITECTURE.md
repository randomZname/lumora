# ARCHITECTURE — MVP_AI

## Stack
- **Web**: Next.js 14 App Router, TypeScript, Tailwind v4, React 18.
- **Auth**: NextAuth (Google provider), JWT sessions.
- **DB**: Postgres 16 (reusing existing `bogi_db` container, separate `mvp_ai` database),
  Prisma ORM. (SQLite dropped — was dev-only, not serverless/prod safe.)
- **Storage**: S3-compatible via abstraction `lib/storage.ts`.
  Dev = MinIO (Docker). Prod = Cloudflare R2. No more `public/uploads`.
- **Orchestration**: n8n (Docker, self-hosted) runs the video pipeline + webhooks.
- **Video provider**: abstraction `lib/video-provider.ts`.
  - `StubProvider` — returns a sample clip (wire the flow free, day 1).
  - `FalProvider` — fal.ai single API; free credits for SVD now, swap model id to
    Kling/Veo/Sora for premium later. No app changes to upgrade.
- **LLM (optional)**: existing `bogi_litellm` proxy (port 4000) for prompt enhancement.
- **Payments**: Stripe (subscriptions + one-time credit packs + webhooks).
- **Dev env**: Docker Compose — adds `n8n` + `minio` (Postgres already running).

## Folder layout (target)
```
src/
  app/
    (marketing)/      home, about, faq, plans
    api/
      auth/[...nextauth]/
      video/create/         POST: start a job
      video/callback/       POST: n8n -> us (secured by secret)
      video/[id]/           GET: job status
      stripe/webhook/       POST: Stripe events
    account/          plan + credits + gallery
    create-video/     the generator UI
  components/
  lib/
    auth.ts
    prisma.ts
    storage.ts        storage abstraction (MinIO/R2)
    video-provider.ts provider abstraction (Stub/Fal)
    credits.ts        credit check/spend/refill helpers
  types/
prisma/
docs/
docker-compose.yml
```

## Data model (Prisma)
```
enum Plan        { FREE PRO PREMIUM }
enum JobStatus   { QUEUED PROCESSING DONE FAILED }
enum TxType      { REFILL SPEND PURCHASE REFUND }

User
  id, email(unique), name?, image?, plan(FREE), credits(0),
  createdAt, updatedAt
  videoJobs[], creditTransactions[], subscription?

VideoJob
  id, userId -> User, status(QUEUED), provider, model?,
  inputText, inputImageUrl, duration, outputUrl?, thumbnailUrl?,
  creditsCost, error?, createdAt, updatedAt

CreditTransaction        // audit log; balance = sum(amount)
  id, userId -> User, amount(+/-), type, videoJobId?, stripeRef?, createdAt

Subscription             // phase 4
  id, userId(unique) -> User, stripeSubId, stripeCustomerId,
  plan, status, currentPeriodEnd
```

## Core flow — async video generation
```
1. Browser POST /api/video/create  (text, image, duration)
2. Server: getServerSession -> require auth
3. Server: credits.check(user, cost) -> 402 if insufficient
4. Server: upload image to storage -> inputImageUrl
5. Server: create VideoJob {status: QUEUED}
6. Server: trigger n8n webhook {jobId, inputImageUrl, text, duration, callbackUrl, secret}
7. Server: return {jobId}   (fast, does NOT wait for render)

8. n8n: call video provider (fal.ai) -> poll until done
9. n8n: upload result to storage -> outputUrl
10. n8n: POST /api/video/callback {jobId, outputUrl, secret}
11. Server: verify secret -> VideoJob {status: DONE, outputUrl}
12. Server: credits.spend(user, cost)  // ONLY on success
                          (on failure -> status FAILED, no charge)

13. Browser: poll GET /api/video/[id] -> show progress -> render video
```

## Security decisions
- All `/api/video/*` user routes require an authenticated session.
- `/api/video/callback` authenticated by a shared secret (`N8N_CALLBACK_SECRET`),
  not a user session (n8n is the caller).
- Upload validation kept: MIME whitelist + size limit (already in code).
- Credits are spent server-side on success only; never trust the client.
- Secrets in `.env.local` (never committed); `.env.example` documents required vars.

## Decisions log (ADR-lite)
- **2026-06-07** Postgres over SQLite — prod/serverless parity, reuse running `bogi_db`.
- **2026-06-07** fal.ai as video provider — one API spans free (SVD) → premium
  (Kling/Veo/Sora); free signup credits enable testing at $0.
- **2026-06-07** Async job model (VideoJob + callback) — video render is slow
  (30s–min), synchronous request would time out.
- **2026-06-07** Storage abstraction — MinIO dev / R2 prod, no vendor lock, no local disk.
- **2026-06-07** Hybrid monetization — plans give monthly credits, credits buyable.

## Required env vars (see .env.example)
```
DATABASE_URL=postgresql://bogi:***@localhost:5432/mvp_ai
NEXTAUTH_URL, NEXTAUTH_SECRET
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
N8N_WEBHOOK_URL, N8N_CALLBACK_SECRET
FAL_KEY
STORAGE_ENDPOINT, STORAGE_BUCKET, STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY
STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_* (phase 4)
```
