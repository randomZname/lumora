# TASKS — MVP_AI

> Active backlog. Claude: check this every session. Move tasks between sections and
> log changes in `CHANGELOG.md`. `[ ]` todo, `[~]` in-progress, `[x]` done.
> Current phase: **Phase 0–2 DONE & running. Next: Phase 3 (real video).**

## IN-PROGRESS / NEXT
- [x] 2026-06-08 Self-host fal output (faststart transcode + poster) via `lib/media.ts` +
      `/api/media` Range route → instant playback. (R2 swap later = same storage interface.)
- [ ] Swap LocalDisk → Cloudflare R2 for production permanence (storage interface ready).
- [ ] Consider moving transcode off the callback path (job queue) so DONE isn't delayed by it.
- [ ] Switch to premium model (Kling 2.5 Turbo Pro) via FAL_MODEL when ready.
- [ ] Production: real webhook (replace dev in-process polling) once deployed (fal can't reach localhost).
- [ ] Add real GOOGLE_CLIENT_ID/SECRET to `.env.local` when ready (then disable ENABLE_DEV_LOGIN).

## DONE — Phase 3 (real video, core)
- [x] 2026-06-08 `FalProvider` (fal queue submit + in-process poll + data-URI image).
- [x] 2026-06-08 Duration 5/10s; create route passes image bytes.
- [x] 2026-06-08 LIVE fal test PASS (real mp4, ~$0.02; URL + data-URI both work).
- [x] 2026-06-08 **Image optional → text-to-video** (schema nullable + migration; route + UI;
      FalProvider t2v branch via FAL_MODEL_T2V). Live-validated by sample generation.
- [x] 2026-06-08 **Sample media** generated (public/samples/) + wired into home hero,
      example cards, and DemoVideoPanel; fixed broken n8n demo with local fallback.
- [x] 2026-06-08 **FULL E2E PASS** (HTTP): dev-login → create from TEXT ONLY (no image) →
      fal t2v → callback → job DONE with real mp4; 1 credit charged (4→3). Whole loop proven.

## DONE — Runtime bring-up (2026-06-08)
- [x] Created `mvp_ai` database on `bogi_db` (user bogi).
- [x] `.env.local` written (generated NEXTAUTH_SECRET + N8N_CALLBACK_SECRET, DATABASE_URL,
      SAMPLE_VIDEO_URL=BigBuckBunny, STORAGE_DRIVER=local, VIDEO_PROVIDER=stub).
- [x] Dev Login provider added (CredentialsProvider, gated by ENABLE_DEV_LOGIN) — test without Google.
- [x] Removed obsolete sqlite migrations + dev.db; ran `prisma migrate dev` (init_postgres) on Postgres.
- [x] `npm run dev` boots; smoke test PASS: pages 200; auth guards 401; callback (secret) →
      job DONE + 1 credit spent + SPEND tx; double-callback no double-charge.

## DONE — Phase 0 (Foundation)
- [x] Switch `prisma/schema.prisma` datasource sqlite → postgresql.
- [x] `docker-compose.yml` adding `n8n` + `minio` (no new Postgres; reuse `bogi_db`).
- [x] `.env.example` (all required vars) + `docs/SETUP.md`.
- [x] `npm install` (+ `@aws-sdk/client-s3`).

## DONE — Phase 1 (Auth & Account)
- [x] Typed session via `types/next-auth.d.ts`; removed all `as any`.
- [x] Auth guards on video routes (`getServerSession`).
- [x] Account page: plan + live credit balance from DB.

## DONE — Phase 2 (Async video core)
- [x] Prisma models `VideoJob`, `CreditTransaction` (+ enums).
- [x] `lib/storage.ts` (LocalDisk + S3/MinIO).
- [x] `lib/video-provider.ts` with `StubProvider` (+ `FalProvider` stub).
- [x] `lib/credits.ts` (check / spend / refill / balance, atomic).
- [x] `api/video/create` → auth + credit check + upload + job + trigger.
- [x] `api/video/callback` (secret) → update job + spend on success.
- [x] `api/video/[id]` → owner-only job status.
- [x] `create-video` UI: submit → poll → show video.
- [x] Validation: `tsc --noEmit` passes (lint config debt → ISSUES).

## TODO — Phase 3 (Real video)
- [ ] n8n workflow: receive → fal.ai (SVD) → store → callback.
- [ ] `FalProvider` implementation (FAL_KEY).
- [ ] (optional) prompt enhancement via LiteLLM (`bogi_litellm:4000`).

## TODO — Phase 4 (Monetization)
- [ ] Stripe subscription checkout (plans).
- [ ] Stripe one-time credit packs.
- [ ] `api/stripe/webhook`: refill on renewal, grant on purchase.
- [ ] Plan gates (duration/resolution/watermark/priority).

## TODO — Phase 5 (Polish)
- [ ] Design system pass.
- [ ] Error/empty/loading states.
- [ ] Rate limiting + abuse protection.
- [ ] Analytics + logging.

## DONE
- [x] 2026-06-07 Project review + research (competitors, fal.ai) done.
- [x] 2026-06-07 `docs/` brain system + `CLAUDE.md` created.
- [x] 2026-06-07 Environment audit (specs, installed tools, existing containers).
