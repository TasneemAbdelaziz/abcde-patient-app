# A.B.C.D.E Healthcare — Backend API

Laravel 12 + Sanctum REST API for the Alamein Model Hospital A.B.C.D.E platform.
Implements the 12 service groups / ~100 endpoints from the project's API contract
(`/api/v1`) and an **Excel import pipeline** that ingests the hospital-supplied
workbooks in `../db/` into a relational schema.

## Requirements

- PHP 8.2+ with `ext-gd`, `ext-zip`, `ext-mbstring` (XAMPP works; GD is enabled in `php.ini`)
- Composer 2
- SQLite (default, zero-config) or MySQL

## Setup

```bash
cd backend
composer install
php artisan key:generate          # if APP_KEY is empty
php artisan migrate:fresh
php artisan abcde:import           # imports ../db/ABCDE_Data_*.xlsx + creates accounts
php artisan serve
```

The API is then at `http://127.0.0.1:8000/api/v1`.

### Switching to MySQL

Edit `.env`:

```
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=abcde
DB_USERNAME=root
DB_PASSWORD=
```

then `php artisan migrate:fresh && php artisan abcde:import`.

## Data import

The four hospital workbooks are mapped sheet-by-sheet to models. Every sheet has
row 1 = headers, row 2 = the hospital's instruction text (skipped), data from
row 3. Columns are matched by **normalised header name**, so column reordering is
tolerated. `Y/N` becomes boolean, dates are parsed (Excel serials or strings),
and the `—`/`�` "no value" tokens become `NULL`. Imports are **idempotent**
(upsert on natural keys), so re-running never duplicates rows.

| Workbook | Sheets → tables |
|----------|------------------|
| `ABCDE_Data_1_Hospital_Master` | departments, staff, locations, drugs, education_contents, hospital_settings |
| `ABCDE_Data_2_Patients_Visits` | patients, insurance_coverages, visits, appointments, family_companions |
| `ABCDE_Data_3_Clinical_Cardiac` | journey_timelines, vitals, lab_results, radiology_results, diagnoses, prescriptions, mar_administrations, consents_checklists |
| `ABCDE_Data_4_Operational_Quality` | feedback_ratings, complaints, emergency_sos_logs, kpi_monthly, billing_items |

**Ways to import**

- CLI: `php artisan abcde:import [path] [--no-accounts] [--password=...]`
- API (upload): `POST /api/v1/admin/import` (multipart `file` or `files[]`)
- API (seed from `db/`): `POST /api/v1/admin/import/seed`

The import API is **open during first-time setup** (while no `admin` user exists)
to allow bootstrapping, then becomes **admin-only**.

### Provisioned accounts

`abcde:import` creates login accounts (default password `password`):

- **Staff** — username = work email (e.g. `k.adel@alamein.example`, role `doctor`)
- **Patients** — username = phone (e.g. `010-0000-0001`)
- **Family companions** — username = phone

## Authentication

Token auth via Sanctum. `POST /auth/login` with `{ identifier, password }`
(identifier = email / phone / patient serial / **national ID**). Send the
returned token as `Authorization: Bearer <token>`. The response — and
`GET /auth/me` — include the patient's `national_id`.

```bash
# Staff by email
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"k.adel@alamein.example","password":"password"}'

# Patient by national ID
curl -X POST http://127.0.0.1:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"25803151234567","password":"password"}'
```

### Roles (RBAC)

`patient`, `family`, `doctor`, `nurse`, `reception`, `quality`, `director`,
`admin`, `emergency`. Enforced by the `role:` middleware; patient/family access
to records is additionally scoped to their own data in the controllers.

## API surface (`/api/v1`)

| Group | Examples |
|-------|----------|
| S1 Identity | `POST /auth/login`, `/auth/login/qr`, `POST /patients/register`, `GET /patients/{serial}`, `GET /patients?q=`, accessibility, cards/QR |
| S2 Public & Appointments | `GET /public/{hospital,departments,doctors,news}`, `POST /appointments`, `/appointments/slots`, reschedule, assign |
| S3 Journey | `POST /visits`, `/visits/{id}/triage`, `/advance`, `/cath-type`, consents, checklists, transport, committee, care-plan |
| S4 Vitals & Early Warning | `POST/GET /visits/{id}/vitals`, `GET /visits/{id}/risk-score` (NEWS2), `/vte`, `/thresholds` |
| S5 Medication & Records | prescriptions, `/prescriptions/{id}/administer`, reconciliation, `/pharmacy/availability`, orders, results, diagnosis, `GET /patients/{serial}/file`, consultations |
| S6 AI Assistant | `/assistant/ask`, `/assistant/triage`, documentation draft/approve/transcribe/translate (NFR-2: human approval required) |
| S7 Emergency & Notifications | `/emergency/sos`, `/code-blue`, `/active`, `/metrics`, `GET /notifications`, mark read |
| S8 Family | `POST/GET /patients/{serial}/family`, accept, permissions, remove |
| S9 Billing | insurance get/patch, committee-review, `GET /visits/{id}/financial-file`, payments |
| S10 Quality | `POST /stages/{id}/feedback`, complaints, `GET /quality/dashboard` |
| S11 Education & Loyalty | `/education/videos`, `/education/relax`, `GET /patients/{serial}/care-points` |
| S12 Admin / Reports / Nav | `/admin/{users,permissions,audit,integrations,ai-models}`, `/reports/{kpis,monthly}`, `/nav/{map,search,route}` |

`GET /api/v1/health` returns service status (no auth).

## Multilingual API (en · ar · ru · zh)

Every endpoint is localized. The active language is negotiated per request, in
this priority order:

1. `?lang=ar` query parameter
2. `X-Locale: ar` request header
3. `Accept-Language: zh-CN,zh;q=0.9` request header (quality-weighted)
4. the authenticated user's saved `locale`
5. `APP_LOCALE` (default `en`)

What gets localized:

- **Response messages** — the `message` field (JSON lang files in `lang/{ar,ru,zh}.json`).
- **Validation errors** — `lang/{ar,ru,zh}/validation.php`.
- **Patient notifications** — rendered in the *recipient's* `preferred_language`,
  not the actor's. A nurse working in English still produces an Arabic alert for
  an Arabic-speaking patient.

Every response carries `meta.locale`, and the chosen language is echoed in the
`Content-Language` response header. `GET /api/v1/health` lists supported
languages (and which are RTL). Supported set is configured in `config/i18n.php`;
`preferred_language`/`locale` accept `ar`, `en`, `ru`, `zh`.

```bash
curl "http://127.0.0.1:8000/api/v1/auth/login?lang=zh" \
  -H "Content-Type: application/json" \
  -d '{"identifier":"k.adel@alamein.example","password":"password"}'
# -> { "message": "已登录。", ..., "meta": { "locale": "zh" } }
```

> Note: free-text *content* coming from the spreadsheets (department names,
> clinical notes) is stored in its original language. Localizing that requires
> per-field translation columns or the `POST /documentation/translate` endpoint;
> the localization *infrastructure* (negotiation, messages, validation) is in place.

## Postman

Import `ABCDE_API.postman_collection.json` and `ABCDE_API.postman_environment.json`.
Requests are organised **platform → role → feature**, so each team member opens
their own folder and finds endpoints grouped by feature inside it:

```
🔑 Shared
   └─ Auth & Session              login / qr / logout / me / health
📱 Mobile App
   └─ Guest / Public              Public Portal · Navigation · Appointments
   └─ Patient                     Profile & Settings · Appointments · Care Journey ·
                                  Vitals & Risk · Medications · Diagnostics & Records ·
                                  AI Assistant · Notifications · Emergency & Alerts ·
                                  Family & Caregiver · Billing & Insurance ·
                                  Feedback & Quality · Education & Loyalty
   └─ Family                      Care Journey · AI Assistant · Notifications ·
                                  Emergency & Alerts · Family · Feedback · Education
🖥️ Web Dashboards
   └─ Reception                   Profile & Settings · Appointments · Care Journey · Billing
   └─ Nurse                       Care Journey · Vitals & Risk · Medications · Emergency
   └─ Doctor                      Care Journey · Vitals & Risk · Medications ·
                                  Diagnostics & Records · AI Assistant
   └─ Quality                     Feedback & Quality · Reports & KPIs
   └─ Director                    Reports & KPIs · Appointments · Emergency
   └─ Emergency                   Emergency & Alerts
   └─ Admin                       Admin & Users · Data Import
```

Run **Shared › Login** first — it captures the bearer token into a collection
variable automatically. Endpoints used by more than one role (e.g. viewing a
visit) appear in each relevant role's matching feature folder. Add
`?lang=ar|ru|zh` to any request to see localized responses. Regenerate after route
changes with:

```bash
php artisan route:list --json > storage/app/routes.json
python tools/generate_postman.py
```

## Domain logic highlights

- **NEWS2 early-warning score** (`App\Services\News2Service`) computed on every
  vitals entry; non-low scores raise a deterioration alert notification.
- **Door-to-balloon** minutes derived on the `Visit` model (cardiac KPI).
- **Journey timeline** auto-recorded on every stage transition; patient + family
  notified (respecting companion alert permissions).
- **Care points** (+20) awarded for each stage rating (loyalty).
- **6-hour complaint SLA** computed for the quality dashboard.
- Notes: `thresholds` and the RBAC permission matrix are cached;
  AI endpoints are rule-based placeholders pending a real model.

## Notable code

- `app/Services/ExcelImportService.php` — the sheet→model mapping & import engine
- `app/Console/Commands/ImportHospitalData.php` — the `abcde:import` command
- `app/Http/Controllers/Api/V1/` — one controller per service group
- `routes/api.php` — the full `/api/v1` route table
- `app/Http/Middleware/EnsureRole.php` — RBAC; `OptionalSanctum.php` — guest-or-auth
