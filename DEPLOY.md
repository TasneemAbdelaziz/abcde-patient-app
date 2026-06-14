# Deploying the ABCDE Healthcare API (free host)

The backend ships as a single Docker image (verified locally: it builds, boots,
imports `db/*.xlsx`, and serves the API in production mode). The **same image runs
on any Docker host** — pick whichever one doesn't ask for a credit card.

**No credit card, free:** Koyeb or Back4App (Option A below).
**Needs a card:** Render, Railway, Fly.io, Google Cloud Run, AWS.

Files that power this:
- [`Dockerfile`](Dockerfile) — PHP 8.2 + extensions, installs deps, runs the app.
- [`backend/docker/start.sh`](backend/docker/start.sh) — on boot: key:generate → migrate → `abcde:import` → serve on `$PORT`.
- [`render.yaml`](render.yaml) — Render Blueprint (free plan, health check, env).
- [`.dockerignore`](.dockerignore) — keeps the build context small.

> **Data note:** the free tier has no persistent disk, so SQLite is rebuilt from
> the Excel files on every (re)start. Great for a demo — the API always reflects
> `db/*.xlsx`. Runtime-created rows reset on restart. For real persistence, use a
> managed Postgres (see *Going further*).

---

## Option A — Koyeb (free, no credit card) ★ recommended

1. Push the code to GitHub (done — branch `add-backend-and-deploy`).
2. Sign up at **koyeb.com** with your GitHub account (free tier, no card).
3. **Create Web Service → GitHub** → pick the repo and branch.
4. Builder: **Dockerfile** (path `./Dockerfile`, work dir = repo root).
5. Set the service **port to 8080** and **health check path** `/api/v1/health`.
   Koyeb injects `$PORT`; `start.sh` already listens on it.
6. (Optional) add env var `APP_KEY` = output of
   `cd backend && php artisan key:generate --show`. Otherwise one is generated
   on boot (sessions reset on restart — fine for a demo).
7. **Deploy** → you get a URL like `https://abcde-<you>.koyeb.app`.
8. Smoke-test, then point Postman `{{baseUrl}}` at `https://.../api/v1`:
   ```
   GET  https://<app>.koyeb.app/api/v1/health
   POST https://<app>.koyeb.app/api/v1/auth/login
        { "identifier": "k.adel@alamein.example", "password": "password" }
   ```

## Option B — Back4App Containers (free, no credit card)
Same `Dockerfile`. At **back4app.com** → *Containers* → deploy from the GitHub
repo, Dockerfile at root, exposed port `8080`. Free 256–512 MB instance.

## Option C — Render / Railway (need a credit card)
The repo includes a [`render.yaml`](render.yaml) Blueprint if you ever use Render
(New + → Blueprint → pick the repo; paste an `APP_KEY` when asked). Railway works
the same way on a small trial credit. Both ask for a card, so prefer A/B for $0.

> All free tiers sleep after ~15 min idle; the first request then takes ~30–60s
> to wake. Normal.

## Truly-free-forever (if you'll use a card once for sign-up only)
**Oracle Cloud Always Free** gives a real always-free VM (ARM, generous specs).
A card is taken only for identity verification — never charged on the free tier.
You manage a full Linux box: install Docker, then `docker run` this same image.

## The static dashboards / landing page
The dashboards in `dashboards/` + `landing.html` are static and use mock data
(`dashboards/data.js`), independent of the API. Deploy them free by dragging the
folder onto **netlify.com/drop**, or via **GitHub Pages**. (Wiring them to the
live API is a separate task.)

---

## Run it locally (same image as production)
```bash
docker build -t abcde-api .
docker run --rm -p 8099:8080 -e PORT=8080 abcde-api
# → http://127.0.0.1:8099/api/v1/health
```

## Security checklist before sharing the URL
- [ ] **Change the seeded passwords** — every imported account uses `password`.
      Re-run the importer with `php artisan abcde:import --password='<strong>'`,
      or rotate via `PATCH /admin/users/{id}/role` / a password reset.
- [ ] **Lock the import endpoint** — `POST /admin/import*` is open *until an admin
      user exists*, then admin-only. Make sure at least one `admin` account is
      provisioned (the seed creates `ADM-001` → `admin@alamein.example`).
- [ ] **Set a fixed `APP_KEY`** on the host (step 4) so tokens/sessions persist.
- [ ] Keep `APP_DEBUG=false` (baked in, verified).

## Going further (persistence)
Provision a free Postgres (e.g. **Neon**), then on the host set
`DB_CONNECTION=pgsql`, `DB_HOST/PORT/DATABASE/USERNAME/PASSWORD`, and remove the
SQLite steps. Data then survives restarts; run `abcde:import` once instead of on
every boot.
