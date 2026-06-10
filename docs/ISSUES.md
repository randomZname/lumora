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
- [x] 2026-06-08 Generated videos played slowly from fal.media (remote, no faststart) — now
      transcoded to faststart + self-hosted via `/api/media` with Range support → instant playback.
- [ ] 🟢 No rate limiting on any route. Phase 5.
- [ ] 🟢 No tests, no real CI checks.
- [ ] 🟢 `src/TestComponent.tsx` looks like leftover scaffolding — remove if unused.

## Fixed
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
