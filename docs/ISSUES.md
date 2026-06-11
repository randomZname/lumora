# ISSUES — MVP_AI

Known bugs / tech debt. `[ ]` open, `[x]` fixed (note date). Severity: 🔴 high / 🟡 med / 🟢 low.

## Open
- [ ] 🟡 ESLint v9 needs flat config (`eslint.config.js`); project still has `.eslintrc.json`
      + `.eslintignore`, so `npm run lint` fails to start. `next dev`/`tsc` unaffected.
      Migrate to flat config in Phase 5 (tooling).
- [ ] 🟢 `callback` route: `spendCredits` runs after the DONE update, not in the same
      transaction — if spend throws, job is DONE but uncharged (double-charge guard
      prevents re-charge). Acceptable for MVP; tighten later.
- [ ] 🟢 `caniuse-lite` outdated (build warning). Fix: `npx update-browserslist-db@latest`.
- [ ] 🟡 Remaining npm audit findings (next, next-auth, bundled postcss/preact) are only
      fixed in Next 16 / NextAuth v5 — both breaking upgrades. Next pinned at ^14.2.35
      (latest 14.x security patch, fixes the 2025-12-11 advisory). Plan major upgrades
      in Phase 5.
- [x] 2026-06-08 Generated videos played slowly from fal.media (remote, no faststart) — now
      transcoded to faststart + self-hosted via `/api/media` with Range support → instant playback.
- [ ] 🟢 No rate limiting on any route. Phase 5.
- [ ] 🟢 No tests, no real CI checks.
- [x] 2026-06-12 🟡 Vercel prod had no database — provisioned Neon via Vercel Marketplace
      (`neon-coral-zebra`), ran `prisma migrate deploy`, enabled dev login. Live login
      verified end-to-end (csrf → credentials callback → session with FREE plan).
- [ ] 🟡 Stub/Fal providers do post-response work via `setTimeout` — Vercel serverless
      freezes after the response, so the callback/poll never fires in prod. Fix: fal
      webhooks (queue API supports `fal_webhook` param) pointing at /api/video/callback.

## Fixed
- [x] 2026-06-11 🟢 `src/TestComponent.tsx` leftover scaffolding — confirmed unused, removed.
- [x] 2026-06-08 🔴 `api/video/create` had no auth — now requires `getServerSession` (Agent D).
- [x] 2026-06-08 🔴 Credits never enforced — `lib/credits.ts` + create(check)/callback(spend)
      wired; spent only on success (Agents C/D).
- [x] 2026-06-08 🔴 Local disk storage — replaced with `lib/storage.ts` abstraction
      (LocalDisk dev / S3-MinIO-R2 prod) (Agent C).
- [x] 2026-06-08 🟡 `create` didn't generate video — now creates a VideoJob + triggers the
      provider; async callback finalizes it (Agents C/D/F).
- [x] 2026-06-08 🟡 `as any` in auth/account — removed; typed via `types/next-auth.d.ts` (Agent B).
- [x] 2026-06-08 🟡 SQLite datasource — switched to Postgres (Agent A).
- [x] 2026-06-08 🟢 Button `as="a"` rejected `onClick` (pre-existing, surfaced by first tsc) —
      anchor variant now extends AnchorHTMLAttributes (lead fix).
