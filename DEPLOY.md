# Deploying the ABCDE Healthcare API (free host)

The backend ships as a single Docker image (verified locally: it builds, boots,
imports `db/*.xlsx`, and serves the API in production mode). Recommended free
host: **Render** (free Docker web service + GitHub auto-deploy).

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

## Option A — Render (recommended)

1. **Push the code to GitHub** (Render deploys from a repo). The `Dockerfile`,
   `render.yaml`, `backend/`, and `db/` must be committed.
2. Go to **render.com** → sign up (free) → **New + → Blueprint**.
3. Connect the GitHub repo `abcde-patient-app`. Render reads `render.yaml`.
4. When prompted for **`APP_KEY`**, paste one generated with:
   ```bash
   cd backend && php artisan key:generate --show
   ```
   (copy the whole `base64:...` string). Or leave it blank — the container
   generates one on boot (sessions then reset on each restart).
5. Click **Apply**. First build takes a few minutes. When live you get a URL like
   `https://abcde-healthcare-api.onrender.com`.
6. Smoke-test:
   ```
   GET  https://<your-app>.onrender.com/api/v1/health
   POST https://<your-app>.onrender.com/api/v1/auth/login
        { "identifier": "k.adel@alamein.example", "password": "password" }
   ```
7. In your **Postman** collection set `{{baseUrl}}` to
   `https://<your-app>.onrender.com/api/v1`.

> Free services sleep after ~15 min idle; the first request after that takes
> ~30–60s to wake. That's normal on the free plan.

## Option B — Koyeb / Railway
Both deploy the same `Dockerfile` from GitHub. Create a service, point it at the
repo, set the Docker context to the repo root, and add the same env vars that
`render.yaml` lists. Railway uses a small trial credit; Koyeb has a free service.

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
