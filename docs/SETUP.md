# SETUP — MVP_AI (runtime steps)

> Ordered steps the **main thread** runs after Agent A produces the infra/schema
> files. These involve Docker, the database, npm, and Prisma migrations —
> agents must NOT run them; the main thread executes them with user permission.
> Platform: Windows + PowerShell.

---

## Prerequisites (already verified on this machine)
- Node v24, npm 11, Docker 29 + Compose v5, git.
- Existing container `bogi_db` running (Postgres 16, port 5432, user `bogi`).

---

## (a) Create the `mvp_ai` database on the existing `bogi_db`
The app uses a **separate database** on the already-running Postgres container.

```powershell
docker exec bogi_db psql -U bogi -c "CREATE DATABASE mvp_ai;"
```

Verify it exists:

```powershell
docker exec bogi_db psql -U bogi -c "\l"   # mvp_ai should be listed
```

> If it already exists you'll get `database "mvp_ai" already exists` — safe to ignore.

---

## (b) Create `.env.local` from the example and fill it in
```powershell
Copy-Item .env.example .env.local
```
Then edit `.env.local`:
- Set `DATABASE_URL` password to the real `bogi` password
  (`postgresql://bogi:<REAL_PW>@localhost:5432/mvp_ai`).
- Generate `NEXTAUTH_SECRET`: `openssl rand -base64 32` (or any 32-byte base64).
- Fill `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` from the Google Cloud OAuth client.
- Choose a value for `N8N_CALLBACK_SECRET` (any long random string).
- Keep `VIDEO_PROVIDER=stub` for the first run (no fal.ai key needed).
- MinIO/n8n creds can stay at the local defaults for dev.

---

## (c) Install dependencies
`node_modules` is not present yet.
```powershell
npm install
```

---

## (d) Generate the Prisma client + run the first migration
The schema now targets `postgresql`. With the `mvp_ai` db created and
`DATABASE_URL` set in `.env.local`:
```powershell
npx prisma migrate dev --name init_postgres
```
This creates the `User`, `VideoJob`, `CreditTransaction` tables + enums and
generates the Prisma client.

Sanity check (optional):
```powershell
npx prisma studio   # browse the empty tables
```

---

## (e) Start the Docker services (n8n + minio)
```powershell
docker compose up -d
```
- MinIO API:    http://localhost:9000
- MinIO console: http://localhost:9001  (login: `MINIO_ROOT_USER` / `MINIO_ROOT_PASSWORD`)
- n8n:          http://localhost:5678  (basic auth: `N8N_BASIC_AUTH_USER` / `..._PASSWORD`)

> n8n / containers reach the host-bound `bogi_db` via `host.docker.internal:5432`.
> If that does not resolve, attach to the existing network instead — uncomment the
> `networks:` blocks in `docker-compose.yml` and set the external network name
> (find it with `docker network ls`, commonly `bogirepo-main_default`).

---

## (f) Create the MinIO bucket
Match `STORAGE_BUCKET` from `.env.local` (default `mvp-ai`).

Option 1 — Web console: open http://localhost:9001, log in, **Create Bucket**
named `mvp-ai`, and set its access policy to **public** (so rendered video URLs
are readable) if your storage impl returns direct URLs.

Option 2 — CLI inside the container (`mc`):
```powershell
docker exec mvp_ai_minio sh -c "mc alias set local http://localhost:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD; mc mb -p local/mvp-ai; mc anonymous set download local/mvp-ai"
```

---

## (g) Run the app + smoke test
```powershell
npm run dev
```
Open http://localhost:3000 and verify the end-to-end flow:
1. Sign in with Google.
2. (If credits = 0) give the user credits via Prisma Studio or a refill call so
   the create flow passes the credit check.
3. Go to **Create Video**: upload an image, enter text, pick duration (10/15), submit.
4. Expect a `{ jobId }` response; the UI polls `GET /api/video/[id]`.
5. With `VIDEO_PROVIDER=stub`, the StubProvider posts back to
   `/api/video/callback` with `SAMPLE_VIDEO_URL` → job goes `DONE`.
6. The sample video renders. Credits are spent once on success.

If the callback 401s, confirm `N8N_CALLBACK_SECRET` matches on both sides.

---

## Teardown / reset (optional)
```powershell
docker compose down              # stop n8n + minio (keeps volumes)
docker compose down -v           # also drop minio/n8n data volumes
# Drop the app database (does NOT affect other bogi_db databases):
docker exec bogi_db psql -U bogi -c "DROP DATABASE mvp_ai;"
```
