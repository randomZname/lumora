# BUILD_PLAN — MVP_AI (Phases 0–2)

> Plan document for **/build with agents** (`bogy-build-with-agent-team`).
> Contract-first delegation · strict file ownership · staged spawning · end-to-end validation.
> Scope: Foundation + Auth hardening + Async video core with a **StubProvider** (no
> external API keys needed). Phases 3–5 (fal.ai, Stripe) are a separate later build.

---

## 0. Project facts (agents must respect)
- Root: `C:\Users\bogda\Downloads\MVP_AI-main\MVP_AI-main`. Windows, PowerShell.
- Next.js 14 App Router + TS + Tailwind v4 + Prisma + NextAuth(Google).
- DB: **Postgres** (existing container `bogi_db`, user `bogi`, port 5432). A separate
  database `mvp_ai` will be used. SQLite is being removed.
- Reuse, don't re-add Postgres. `node_modules` not installed yet.
- Read `CLAUDE.md`, `docs/ARCHITECTURE.md`, `docs/ISSUES.md` before coding.

## 1. Safety boundaries (ALL agents)
- Edit **only** files you own (Section 4). Never touch another agent's files.
- **Do NOT run** destructive/stateful commands: no `docker ...`, no `prisma migrate`,
  no `npm install`, no DB writes, no network calls. Produce files only.
  The main thread runs all runtime/migration/Docker steps after agents finish.
- No secrets in committed files. Document required vars in `.env.example` only.
- Match existing code style. TypeScript strict — no new `as any`.
- If a contract in Section 3 is ambiguous, follow it literally and leave a `// TODO(contract)`
  comment rather than inventing a different shape.

---

## 2. Shared CONTRACTS (source of truth — code against these)

### 2.1 Prisma data model (owned by Agent A; everyone imports generated client)
```prisma
enum Plan      { FREE PRO PREMIUM }
enum JobStatus { QUEUED PROCESSING DONE FAILED }
enum TxType    { REFILL SPEND PURCHASE REFUND }

model User {
  id        String  @id @default(cuid())
  email     String  @unique
  name      String?
  image     String?
  plan      Plan    @default(FREE)
  credits   Int     @default(0)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  videoJobs          VideoJob[]
  creditTransactions CreditTransaction[]
}

model VideoJob {
  id            String    @id @default(cuid())
  userId        String
  user          User      @relation(fields: [userId], references: [id])
  status        JobStatus @default(QUEUED)
  provider      String
  model         String?
  inputText     String
  inputImageUrl String
  duration      Int
  outputUrl     String?
  thumbnailUrl  String?
  creditsCost   Int
  error         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  transactions  CreditTransaction[]
}

model CreditTransaction {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id])
  amount     Int      // + add, - spend
  type       TxType
  videoJobId String?
  videoJob   VideoJob? @relation(fields: [videoJobId], references: [id])
  stripeRef  String?
  createdAt  DateTime @default(now())
}
```

### 2.2 `lib/storage.ts` (owned by Agent C)
```ts
export interface StoredObject { url: string; key: string }
export interface StorageProvider {
  // uploads bytes, returns a publicly-readable URL + storage key
  upload(buffer: Buffer, key: string, contentType: string): Promise<StoredObject>;
}
export function getStorage(): StorageProvider; // picks impl from env (MinIO/S3)
```
- Impl: S3-compatible (MinIO) via env `STORAGE_ENDPOINT/BUCKET/ACCESS_KEY/SECRET_KEY`.
- If the S3 SDK is not desired now, ship a `LocalDiskStorage` fallback writing to
  `public/uploads` ONLY when `STORAGE_DRIVER=local`, but keep the interface identical.

### 2.3 `lib/video-provider.ts` (owned by Agent C)
```ts
export interface GenerateInput {
  jobId: string; inputImageUrl: string; text: string; duration: number;
}
export interface VideoProvider {
  readonly name: string;
  // kicks off generation; returns nothing (result arrives via callback) OR throws
  start(input: GenerateInput): Promise<void>;
}
export function getVideoProvider(): VideoProvider; // env VIDEO_PROVIDER=stub|fal
```
- `StubProvider`: name `"stub"`. On `start`, schedules a callback to
  `${NEXTAUTH_URL}/api/video/callback` with `{ jobId, outputUrl: SAMPLE_VIDEO_URL,
  secret: N8N_CALLBACK_SECRET }` (e.g. via a fetch after a short delay, or trigger
  n8n if `N8N_WEBHOOK_URL` set). `SAMPLE_VIDEO_URL` = a known public sample mp4.
- `FalProvider`: stub out as `// TODO Phase 3` throwing "not implemented".

### 2.4 `lib/credits.ts` (owned by Agent C)
```ts
export const COST_PER_VIDEO = 1; // credits; tune later
export async function hasCredits(userId: string, cost: number): Promise<boolean>;
export async function spendCredits(                // atomic; writes CreditTransaction SPEND
  userId: string, cost: number, videoJobId: string
): Promise<void>;
export async function refillCredits(               // writes CreditTransaction REFILL
  userId: string, amount: number
): Promise<void>;
export async function getBalance(userId: string): Promise<number>; // User.credits
```
- Use `prisma.$transaction` for spend (decrement User.credits + insert tx atomically).

### 2.5 API route contracts (owned by Agent D)
- `POST /api/video/create` — multipart form `{ text, duration(10|15), image }`.
  Auth required (`getServerSession`). Steps: validate (keep existing MIME+size checks)
  → `hasCredits` else 402 → `getStorage().upload(image)` → create `VideoJob{QUEUED}` →
  `getVideoProvider().start(...)` → set `PROCESSING` → return `{ jobId }`. Errors: 401/402/400/500.
- `POST /api/video/callback` — JSON `{ jobId, outputUrl?, thumbnailUrl?, error?, secret }`.
  Verify `secret === N8N_CALLBACK_SECRET` (else 401). Success → `VideoJob{DONE,outputUrl}`
  + `spendCredits`. Failure → `VideoJob{FAILED,error}`, no charge. Return `{ ok: true }`.
- `GET /api/video/[id]` — auth required; only the owner. Returns
  `{ id, status, outputUrl, thumbnailUrl, error, createdAt }`. 404 if not owner/not found.

### 2.6 Session typing (owned by Agent B)
`types/next-auth.d.ts` augments `Session.user` with `id: string` and `plan: Plan`,
and JWT with `userId`/`plan`. After this, **no `as any`** anywhere.

---

## 3. Validation contract (Agent E, after all others)
- `npx tsc --noEmit` passes (typecheck).
- `npm run lint` passes.
- No `as any` in `lib/auth.ts`, `app/account/page.tsx`.
- Every owned file exists and matches its contract signature.
- Produce `docs/` updates: tick done items in `TASKS.md`, append `CHANGELOG.md`.
- Report a short PASS/FAIL table per component. Do NOT run Docker/migrate (main thread does).

---

## 4. AGENTS & FILE OWNERSHIP (no overlaps)

### Stage 1 — Foundation (run alone first)
**Agent A — Infra & Schema**
Owns:
- `prisma/schema.prisma`   (datasource → postgresql; add models from 2.1)
- `docker-compose.yml`     (services: `n8n`, `minio` only; connect to existing
  `bogirepo-main_default` network OR document how to reach `bogi_db`)
- `.env.example`           (all vars from ARCHITECTURE; placeholders only)
- `docs/SETUP.md`          (runtime steps the main thread must run: create `mvp_ai` db,
  `npm install`, `prisma migrate dev`, `docker compose up`, n8n/minio first-run notes)
Must NOT touch: `src/**`.

### Stage 2 — Core libs + Auth (parallel: B, C)
**Agent B — Auth & Account**
Owns: `src/lib/auth.ts`, `src/types/next-auth.d.ts`, `src/app/account/page.tsx`
- Implement 2.6. Remove all `as any`. Account page shows plan + live `getBalance`.
- May import `lib/credits.ts` (contract 2.4) — code against the signature.

**Agent C — Core libs**
Owns: `src/lib/storage.ts`, `src/lib/video-provider.ts`, `src/lib/credits.ts`
- Implement 2.2 / 2.3 / 2.4. No route or UI edits.

### Stage 3 — API + UI (parallel: D, E... E is validation, runs last)
**Agent D — API routes**
Owns: `src/app/api/video/create/route.ts`,
`src/app/api/video/callback/route.ts`, `src/app/api/video/[id]/route.ts`
- Implement 2.5 against lib contracts (2.2–2.4) and `lib/auth.ts` authOptions.

**Agent F — Create-video UI**
Owns: `src/app/create-video/page.tsx`
(+ may edit `src/components/DemoVideoPanel.tsx` only if needed — declare it)
- Submit → receive `{jobId}` → poll `GET /api/video/[id]` until DONE/FAILED →
  render `<video>` or error. Keep existing form/validation UX.

### Stage 4 — Validation
**Agent E — Validator** (Section 3). Read-only except `docs/TASKS.md`, `docs/CHANGELOG.md`.

---

## 5. Ownership matrix (quick conflict check)
| File / area                         | Owner |
|-------------------------------------|-------|
| prisma/schema.prisma                | A |
| docker-compose.yml, .env.example, docs/SETUP.md | A |
| src/lib/auth.ts, types/next-auth.d.ts, app/account/page.tsx | B |
| src/lib/storage.ts, video-provider.ts, credits.ts | C |
| app/api/video/{create,callback,[id]}/route.ts | D |
| app/create-video/page.tsx (+DemoVideoPanel) | F |
| docs/TASKS.md, docs/CHANGELOG.md (tick/append) | E |
| src/lib/prisma.ts                   | nobody (unchanged) |

## 6. Spawn order
1. Stage 1: **A** (alone) → then main thread runs SETUP steps (db, install, migrate).
2. Stage 2: **B**, **C** in parallel.
3. Stage 3: **D**, **F** in parallel.
4. Stage 4: **E** validates.

## 7. After build (main thread, with user permission)
- Create `mvp_ai` database on `bogi_db`.
- `npm install`; `npx prisma migrate dev --name init_postgres`.
- `docker compose up -d` (n8n, minio); create MinIO bucket.
- `npm run dev`; manual smoke test: sign in → create video → stub callback → see video.
- Update TASKS/CHANGELOG; move project to Phase 3.
