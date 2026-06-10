# CLAUDE.md — MVP_AI

> Project "brain". Read this first every session. Keep it short; details live in `docs/`.

## What this is
AI **image + text → video** generator (SaaS). User uploads a still frame + describes
motion/mood, an async pipeline (n8n + a video provider) renders a short clip.
Hybrid monetization: subscription plans (FREE/PRO/PREMIUM) + buyable credits.

## Stack
Next.js 14 (App Router, TS) · Tailwind v4 · Prisma + Postgres · NextAuth (Google) ·
n8n (orchestration) · fal.ai (video provider) · Stripe (payments) ·
S3-compatible storage (MinIO dev / Cloudflare R2 prod) · Docker Compose.

## Rules for Claude (IMPORTANT — follow every session)
1. **Read `docs/` at session start**: `ROADMAP.md` → `TASKS.md` → `ISSUES.md`.
   They tell you where we are and what's next.
2. **After every change**, update `docs/TASKS.md` (move task) and `docs/CHANGELOG.md`
   (what / why / date). New bug found → add to `docs/ISSUES.md`.
3. **The user grants access; Claude inspects/runs/verifies everything.** Don't ask the
   user to run commands or open apps — do it yourself, ask only for permission.
4. Don't break the docs system. It is how the project stays understandable across sessions.
5. Date format in docs: `YYYY-MM-DD`.

## docs/ map
| File | Purpose |
|------|---------|
| `docs/VISION.md` | Goal, product, audience, business model. Rarely changes. |
| `docs/ARCHITECTURE.md` | Stack, data model, data flow, n8n pipeline, decisions. |
| `docs/ROADMAP.md` | Phases & milestones (the big picture over time). |
| `docs/TASKS.md` | Active backlog: TODO / IN-PROGRESS / DONE. Check every session. |
| `docs/CHANGELOG.md` | What changed, when, why. History. |
| `docs/ISSUES.md` | Known bugs / tech debt to fix. |

## Environment facts (verified 2026-06-07)
- Machine: AMD Ryzen 7 5700U, 34GB RAM, **no NVIDIA GPU** (AMD iGPU only)
  → cannot self-host video models; use cloud API (fal.ai).
- Installed: Node v24, npm 11, Docker 29 + Compose v5, Python 3.12, git. (no psql/gh)
- **Existing Docker containers reused**: `bogi_db` (Postgres 16 + pgvector, port 5432,
  user `bogi`) → we create a separate `mvp_ai` database on it. `bogi_litellm`
  (LiteLLM proxy, port 4000) → optional LLM gateway for prompt enhancement.
- So our compose only needs to add **n8n** + **minio**, not a new Postgres.

## Commands
- Dev server: `npm run dev` (after `npm install` — node_modules not present yet)
- DB: `npx prisma migrate dev`, `npx prisma studio`
