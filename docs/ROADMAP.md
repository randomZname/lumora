# ROADMAP — MVP_AI

Phases are ordered. Each ends with a working, testable result. Details/checkboxes
live in `TASKS.md`; this file is the big picture.

## Phase 0 — Foundation
**Goal:** stable, reproducible base.
- `docs/` system (this) ✅
- `docker-compose.yml`: add `n8n` + `minio` (reuse existing Postgres `bogi_db`).
- Create `mvp_ai` database on `bogi_db`.
- Switch Prisma datasource to Postgres; first migration.
- `.env.example` + `.env.local`.
- `npm install`, dev server runs.
**Done when:** `docker compose up` + `npm run dev` work; DB connects.

## Phase 1 — Auth & Account hardening
**Goal:** secure, typed auth.
- Fix NextAuth types (remove `as any`, use `types/next-auth.d.ts`).
- Guard protected routes/pages.
- Account page shows plan + live credit balance.
**Done when:** sign in works; session is fully typed; account shows real data.

## Phase 2 — Async video core (with Stub)
**Goal:** full pipeline end-to-end on a fake renderer.
- Prisma: `VideoJob`, `CreditTransaction` models + migration.
- `lib/storage.ts` (MinIO), `lib/video-provider.ts` (StubProvider), `lib/credits.ts`.
- Routes: `video/create` (auth + credit check + job + trigger), `video/callback`
  (secret), `video/[id]` (status).
- `create-video` UI: submit → poll → show result.
**Done when:** a logged-in user submits and gets a (stub) video back; credits charged on success.

## Phase 3 — Real video generation
**Goal:** real clips from fal.ai (free credits).
- n8n workflow: receive → call fal.ai (SVD) → store → callback.
- `FalProvider` wired; remove/keep Stub behind env flag.
- Optional: LiteLLM prompt enhancement before generation.
**Done when:** real AI video is produced and shown in the account gallery.

## Phase 4 — Monetization
**Goal:** users can pay.
- Stripe: subscription checkout (plans) + one-time credit packs.
- `stripe/webhook`: refill credits on renewal, grant on purchase.
- Plan gates (max duration/resolution, watermark on FREE, queue priority).
- `CreditTransaction` records every movement.
**Done when:** a test user subscribes and buys credits; balances update via webhook.

## Phase 5 — Polish & launch-ready
**Goal:** presentable, robust.
- Design system pass (brand, components, responsive).
- Landing / FAQ / plans content finalized.
- Error states, empty states, loading skeletons.
- Rate limiting + abuse protection.
- Basic analytics + logging.
**Done when:** a stranger can use it without confusion; abuse is bounded.

## Later (backlog ideas)
- Video gallery sharing / public links.
- More aspect ratios + premium models (Kling/Veo/Sora via fal.ai).
- Referral credits, team accounts.
