# ABCDE Patient Wearable — Hardware & Software Specification

**Prepared for:** Cardoo (hardware/firmware partner)
**Prepared by:** ABCDE Healthcare Platform Team — Alamein Model Hospital
**Document:** RFP / Technical Specification · **Version:** 1.0 · **Date:** 2026-06-14
**Status:** Draft for partner review · **Classification:** Confidential

> **خلاصة بالعربي:** ده ملف المواصفات اللي بنبعته لـ Cardoo عشان تصنّع **سوار طبي مخصّص (custom medical bracelet)** للمريض. السوار لازم: (1) يقيس **كل مدخلات NEWS2** الحيوية، (2) يكون فيه **app جوّاه على شاشة** + **5 زراير فيزيائية منفصلة** للوصول السريع للـ 5 features بتوعنا، (3) يدعم **٤ لغات (عربي/إنجليزي/صيني/روسي)** + **مايك للتحويل من صوت لنص (speech-to-text)**، (4) يتكامل مع الـ backend بتاعنا (Laravel `/api/v1`). الملف مكتوب إنجليزي تقني مع ملخص عربي تحت كل قسم.

---

## 0. How to read this document · إزاي تقرأ الملف

| Marker | Meaning |
|---|---|
| **MUST** | Hard requirement — device is not acceptable without it. |
| **SHOULD** | Strongly preferred; deviations need written justification. |
| **MAY** | Optional / nice-to-have. |
| ⚠️ | Technical or clinical caution — read the note carefully. |
| ❓ | Open question — we need Cardoo's input (see §12). |

Requirements are numbered `HW-x` (hardware), `SW-x` (software/firmware), `INT-x` (integration), `SEC-x` (security), `REG-x` (regulatory), `ACC-x` (acceptance).

> **خلاصة:** MUST = إجباري، SHOULD = مفضّل جداً، MAY = اختياري. ⚠️ تحذير فني/طبي. ❓ سؤال محتاجين رد Cardoo عليه.

---

## 1. Project context · سياق المشروع

ABCDE is a hospital patient-care platform built around a reference scenario of a **cardiac (catheterization) patient journey** across 8 stages (Arrival → Triage → Diagnosis → Catheterization → Recovery → Ward → Discharge → Home follow-up).

The platform already has:

- **Backend API** — Laravel 12 + Sanctum, serving `/api/v1` (~103 endpoints). Localized for **en, ar, ru, zh**.
- **Patient mobile app** (SPA) and **role-based web dashboards** (doctor, nurse, reception, quality, emergency, family, admin).
- A **NEWS2 early-warning engine** that turns a vitals set into a deterioration score and risk band, and auto-notifies the clinical team on medium/high risk.

**The wearable's role:** a body-worn device that (a) continuously/periodically captures the patient's vitals and streams them into the ABCDE backend so NEWS2 runs on live data, and (b) gives the patient direct one-tap access to the 5 core platform features from the wrist.

> **خلاصة:** المنصة بتشتغل على رحلة مريض القلب في ٨ مراحل. عندنا backend (Laravel) + app موبايل + داشبوردات + محرك NEWS2 بيحسب الخطورة ويبلّغ الفريق الطبي أوتوماتيك. دور السوار: يقيس الـ vitals ويبعتها للـ backend عشان NEWS2 يشتغل على بيانات حيّة، وكمان يدّي المريض وصول مباشر للـ 5 features من على إيده.

### 1.1 Clinical framing — why "ABCDE"
The platform name maps to the clinical **A·B·C·D·E** rapid-assessment (Airway, Breathing, Circulation, Disability, Exposure). The wearable's vitals suite is deliberately chosen to feed this assessment and the NEWS2 score derived from it. This is the clinical reason the **full NEWS2 vitals set** (not just heart rate) is required.

---

## 2. Form factor & industrial design · الشكل والتصميم

| ID | Requirement |
|---|---|
| HW-1 | **MUST** be a wrist-worn **custom bracelet** with a color **touchscreen display** capable of running an embedded app (the "ABCDE Band app"). |
| HW-2 | **MUST** provide **5 dedicated physical buttons** (or 5 fixed capacitive/haptic touch zones) for fast access to the 5 core features (§6), each usable **without unlocking** the device. Buttons **MUST** be distinguishable by touch (raised / textured) and **SHOULD** be labelled with both an icon and a language-neutral color. |
| HW-3 | A **6th control** (side button or long-press) **MUST** exist for power / wake / back. The 5 feature buttons must not be overloaded for power. |
| HW-4 | **MUST** be lightweight (target **≤ 60 g**) and comfortable for continuous multi-day wear by post-operative and elderly patients. |
| HW-5 | Band **MUST** be adjustable, **latex-free**, skin-safe, and use a clasp that an elderly or partially-disabled patient can open one-handed. **SHOULD** be available in S/M/L. |
| HW-6 | Outer surfaces **MUST** withstand routine hospital disinfection (alcohol/quaternary wipes) without degradation — see HW-21. |
| HW-7 | Display **MUST** remain legible in bright ward lighting (target **≥ 400 nits**) and support large-font / high-contrast accessibility mode. |
| HW-8 | Device **SHOULD** support a tamper / removal-detection signal (skin-contact sensor) so the system knows when the band is taken off. |

> **خلاصة:** سوار يتلبس في الإيد بشاشة لمس بتشغّل app. لازم **٥ زراير فيزيائية منفصلة** للـ 5 features يتحسّوا بالإيد ويشتغلوا من غير ما تفتح الجهاز، + زر سادس للباور/الرجوع. خفيف (≤ ٦٠ جم)، مريح لكبار السن وما بعد العمليات، مادة آمنة للجلد بدون لاتكس، يتعقّم بمناديل الكحول، شاشة واضحة في إضاءة المستشفى، وحساس يكشف لو السوار اتشال من إيد المريض.

### 2.1 The 5 physical buttons → features mapping

| Button | Feature (icon) | Color (suggested) | Opens |
|:---:|---|---|---|
| 1 | **Educational** · تثقيف | Blue | Disease/procedure/discharge/financial education (§6.1) |
| 2 | **Alert / SOS** · استدعاء | Red | Emergency call + escalation chain (§6.2) |
| 3 | **Evaluation** · تقييم | Green | Rate each stage & care team (§6.3) |
| 4 | **Development** · تطوير | Purple | Service feedback / improvement & app rating (§6.4) |
| 5 | **Entertainment** · ترفيه | Orange | Videos, relaxation, light games (§6.5) |

⚠️ **Alert (button 2) MUST be physically and visually distinct** (e.g. recessed + raised guard ring + red) to allow fast use in distress while reducing accidental presses. A **press-and-hold (1–2 s)** confirmation **SHOULD** be required to fire an SOS.

> **خلاصة:** كل زر من الـ ٥ بيفتح feature: ١ تثقيف، ٢ استدعاء/طوارئ (أحمر ومميّز فيزيائياً وبيتفعّل بضغطة مستمرة ١–٢ ثانية عشان مايتفعّلش بالغلط)، ٣ تقييم، ٤ تطوير، ٥ ترفيه.

---

## 3. Vitals sensor suite (full NEWS2 inputs) · حسّاسات العلامات الحيوية

The ABCDE NEWS2 engine consumes the fields below. **Scoring is done server-side** — the device's job is to capture each parameter as accurately as possible and report raw values; the device **MUST NOT** compute or display its own clinical risk score (to avoid two conflicting "scores"). The device **MAY** display the latest NEWS2 risk band returned by the backend.

| # | NEWS2 parameter | API field | How the device obtains it | Feasibility on wrist | Target accuracy |
|:--:|---|---|---|:--:|---|
| 1 | Pulse / heart rate | `pulse` | PPG optical sensor (continuous) | ✅ Good | ±3 bpm or ±5 % (rest) |
| 2 | SpO₂ (oxygen saturation) | `spo2` | Reflectance pulse-oximetry (red/IR PPG) | ✅ Good (motion-sensitive) | ±2 % (70–100 %) |
| 3 | Body temperature | `temperature` | Skin-temp sensor + core-temp estimation algorithm | ⚠️ Skin ≠ core | ±0.3 °C vs core after calibration |
| 4 | Respiratory rate | `respiratory_rate` | Derived from PPG + accelerometer (resp. sinus arrhythmia / chest motion) | ⚠️ Best at rest | ±2 breaths/min (rest) |
| 5 | Systolic BP | `systolic_bp` | Cuffless estimation (PPG/PTT) **or** paired upper-arm cuff module | ⚠️ Hardest | See §3.1 |
| 6 | Diastolic BP | `diastolic_bp` | Same as systolic | ⚠️ Hardest | See §3.1 |
| 7 | Consciousness (AVPU) | `consciousness_avpu` | **Not sensor-measurable.** Device provides a *responsiveness proxy* (see §3.2) | ❌ Sensor / ✅ Proxy | n/a |
| 8 | Pain score (0–10) | `pain_score` | Collected via on-screen prompt (patient taps a 0–10 scale) | ✅ UI input | n/a |

| ID | Requirement |
|---|---|
| HW-9 | **MUST** measure pulse, SpO₂, body temperature and respiratory rate. |
| HW-10 | **MUST** provide a blood-pressure value (systolic + diastolic) by one of the two methods in §3.1. If cuffless, accuracy caveats and calibration flow **MUST** be documented. |
| HW-11 | **MUST** support a **on-demand "measure now" spot check** (all parameters) triggered by the app/backend, in addition to background sampling. |
| HW-12 | **MUST** timestamp every reading (device RTC, synced to backend time) and tag it with the source (`device`) and a per-reading quality/confidence indicator. |
| HW-13 | **MUST** flag motion-corrupted or low-confidence readings rather than reporting them as valid. |
| HW-14 | **SHOULD** include a 3-axis accelerometer/gyro for activity, posture, **fall detection** and respiratory-rate derivation. |
| HW-15 | **SHOULD** include skin-contact / wear-detection so off-wrist periods are marked (and not scored as "0/abnormal"). |

> **خلاصة:** السوار لازم يقيس: النبض، الأكسجين SpO₂، الحرارة، معدل التنفس، وضغط الدم (انظر ٣.١). **الحساب الإكلينيكي (NEWS2) بيتعمل على السيرفر مش على الجهاز** — الجهاز بس بيبعت القيم الخام مع وقت وتقييم جودة لكل قراءة، ويعلّم القراءات اللي فيها حركة/جودة ضعيفة. مستوى الوعي (AVPU) **ماينفعش يتقاس بحساس** — الجهاز بيدّي مؤشر استجابة تقريبي بس (انظر ٣.٢)، ودرجة الألم بياخدها من المريض على الشاشة.

### 3.1 Blood pressure — choose an approach ❓
We need Cardoo to recommend **one** of:

- **Option A — Cuffless PPG/PTT estimation:** convenient, continuous, but ⚠️ accuracy and drift are a known concern and typically need periodic re-calibration against a reference cuff. If chosen, Cardoo **MUST** state the validation standard met (e.g. IEEE 1708 / ISO 81060-2 where applicable) and the calibration cadence.
- **Option B — Companion oscillometric cuff module** paired over BLE, with the bracelet acting as display/relay. More accurate, less convenient.

Our preference: **A for continuous trending + the ability to pair B for clinical-grade spot checks**. Please advise feasibility and cost for each.

> **خلاصة:** ضغط الدم أصعب حاجة على المعصم. عايزين Cardoo ترشّح: (أ) تقدير cuffless مستمر (مريح بس دقته محل شك ومحتاج معايرة)، أو (ب) كفّ منفصل يتوصل بالبلوتوث (أدق). تفضيلنا (أ) للمتابعة المستمرة مع إمكانية ربط (ب) للقياس الدقيق. محتاجين رأيهم في الجدوى والتكلفة.

### 3.2 Consciousness / AVPU — proxy only ⚠️
AVPU (Alert / Voice / Pain / Unresponsive) is a **clinical assessment**, not a sensor reading. The device **MUST NOT** report an AVPU letter as if measured. Instead it **MAY** generate a **"responsiveness proxy" event** to the backend when it detects, e.g., a fall + prolonged immobility + no response to a prompt — which the backend treats as a *deterioration hint* that escalates to a human, never as a recorded AVPU value. The actual `consciousness_avpu` field stays clinician-entered.

> **خلاصة:** مستوى الوعي تقييم بشري مش قراءة حساس. الجهاز ممكن يبعت "إشارة عدم استجابة" لو حصل سقوط + عدم حركة + معافيش رد على تنبيه — والسيرفر يعاملها كتلميح تدهور يتصعّد لإنسان، مش كقيمة AVPU مسجّلة.

---

## 4. Other on-device hardware · باقي المكوّنات

| ID | Requirement |
|---|---|
| HW-16 | **Microphone** — **MUST** include a mic suitable for **speech-to-text** capture in noisy ward conditions (see SW-9). **SHOULD** support a wake/push-to-talk button. |
| HW-17 | **Speaker / buzzer** — **MUST** support audible alerts and **SHOULD** support voice prompts / text-to-speech playback for low-vision and elderly patients. |
| HW-18 | **Haptic motor** — **MUST** support distinct vibration patterns (alert received, SOS confirmed, medication reminder, deterioration). |
| HW-19 | **Connectivity** — **MUST** support **BLE 5.x**; **MUST** support at least one of **Wi-Fi (2.4 GHz)** or **cellular (LTE-M/NB-IoT)** for standalone upload. See §7.1 for the two operating modes. |
| HW-20 | **Battery** — **MUST** last **≥ 48 h** under normal use (background vitals sampling + occasional interaction); **SHOULD** target **3–5 days**. **MUST** support fast/contactless charging and report battery % to the backend. |
| HW-21 | **Ingress / durability** — **MUST** be at least **IP67** (hand-wash/splash safe). **SHOULD** be IP68. **MUST** survive ≥ 1.2 m drop onto a hard floor. |
| HW-22 | **Compute/memory** — **MUST** be sufficient to run the embedded app with **4 languages + RTL rendering + on-device or streamed STT**, OTA updates, and local buffering of ≥ 72 h of readings offline. |
| HW-23 | **Real-time clock** — **MUST** keep time across charge cycles and sync to backend on connect. |
| HW-24 | **Unique device identity** — each unit **MUST** have a unique, immutable hardware ID and support secure provisioning/pairing to one patient at a time. |

> **خلاصة:** مايك (للـ speech-to-text في زحمة العنبر) + سماعة/تنبيه صوتي + اهتزاز بأنماط مختلفة + بلوتوث 5 + (واي فاي أو LTE) + بطارية ≥ ٤٨ ساعة (الهدف ٣–٥ أيام) وشحن سريع + مقاومة ماء IP67 على الأقل + ذاكرة كفاية لـ ٤ لغات وتحديثات OTA وتخزين ٧٢ ساعة بيانات أوفلاين + ساعة داخلية + هوية جهاز فريدة وربط آمن بمريض واحد.

---

## 5. On-device software / firmware · سوفت وير الجهاز

| ID | Requirement |
|---|---|
| SW-1 | The embedded **ABCDE Band app MUST** present the 5 features (§6) as a home screen of 5 icons **and** be reachable via the 5 physical buttons. |
| SW-2 | **Multilingual MUST:** UI fully localized for **Arabic, English, Chinese (中文), Russian (Русский)**. **Arabic MUST render right-to-left (RTL).** Language follows the patient's `preferred_language` from the backend and can be changed on-device. |
| SW-3 | **MUST** render alerts/notifications **in the patient's preferred language** (the backend already sends notification text pre-localized — see §7.4). |
| SW-4 | **MUST** support an **accessibility mode**: large fonts, high contrast, text-to-speech read-out, and haptic-only alerting for hearing-impaired patients (aligns with platform accessibility module). |
| SW-5 | **MUST** buffer readings and queued user actions **offline** and sync when connectivity returns (store-and-forward, ≥ 72 h). |
| SW-6 | **MUST** support **secure OTA firmware/app updates** (signed images, rollback on failure). |
| SW-7 | **MUST** show device state clearly: battery, connectivity, sync status, current patient binding, last-sync time. |
| SW-8 | **MUST** lock to a single patient binding; re-provisioning to a new patient **MUST** wipe prior patient data from the device. |
| SW-9 | **Speech-to-text MUST:** capture voice via the mic and convert to text for: (a) free-text in complaints/feedback, (b) the "ask assistant" question field, (c) voice-driven navigation. STT **MAY** run on-device or stream audio to a backend STT endpoint (`POST /documentation/transcribe` exists; a patient-facing STT endpoint will be provided — see §7). Must support at least Arabic + English dictation; Chinese/Russian **SHOULD**. |
| SW-10 | **MUST NOT** store PHI in cleartext on the device; encrypt local storage (see §8). |

> **خلاصة:** الـ app الداخلي بيعرض الـ 5 features كأيقونات + متوصّلة بالـ 5 زراير. واجهة بـ ٤ لغات (والعربي RTL)، تتبع لغة المريض المحفوظة. وضع إتاحة (خط كبير/تباين عالي/قراءة صوتية/اهتزاز للصُم). تخزين أوفلاين ومزامنة لاحقاً. تحديثات OTA موقّعة. ربط بمريض واحد ومسح بياناته عند إعادة الربط. **تحويل الكلام لنص (STT)** عبر المايك للشكاوى والأسئلة والتنقّل الصوتي (عربي+إنجليزي على الأقل). تشفير أي بيانات على الجهاز.

---

## 6. The 5 core features in detail · الـ 5 features بالتفصيل

Each feature below lists its on-device behavior and the ABCDE API it talks to. Endpoint base: `{{base_url}}/api/v1`.

### 6.1 Educational · تثقيف (Button 1, blue)
**Purpose (manager's brief):** general disease info, the procedure/operation, post-discharge care, and the patient's **financial** situation.

- On-device: list of educational cards/videos filtered by the patient's `condition` and current journey `stage`.
- API: `GET /education/videos?condition={c}&stage={s}` → returns `{title, content_type: video|article, journey_stage, ...}`.
- Financial education: surface the patient's bill/coverage summary — `GET /patients/{serial}/insurance` and `GET /visits/{id}/financial-file`.

> **خلاصة:** تعريف بالمرض، العملية، الرعاية بعد الخروج، والوضع المالي. بيجيب الفيديوهات/المقالات حسب حالة المريض ومرحلته، والملخص المالي من endpoints الفواتير/التأمين.

### 6.2 Alert / SOS · الاستدعاء (Button 2, red) ⚠️ critical
**Purpose:** summon a response team (on-duty manager, doctor, nurse, IT/PR) to solve any problem; supports the escalation chain.

- On-device: press-and-hold red button → confirm → fire SOS with location/ticket context → show "help is on the way" + live escalation status.
- API: `POST /emergency/sos` body `{ "ticket_no": "#ALM-20413", "location": "Ward 3 / Bed 12" }`.
- Backend response logs an `event_id` and starts the escalation chain: **physician → nursing → family** (`POST /emergency/{id}/advance`), notifies the patient (`SOS received — help is on the way`), and surfaces the event on the Emergency dashboard.
- ⚠️ The current `POST /emergency/sos` requires the caller to hold the **patient/family** auth token — so the band must operate under the bound patient's token (see §7.2).

> **خلاصة:** زر أحمر بضغطة مستمرة → تأكيد → يبعت استغاثة بالموقع ورقم التذكرة، السيرفر يفتح حدث ويبدأ سلسلة التصعيد (طبيب → تمريض → أهل) ويبلّغ المريض ويظهر الحدث على داشبورد الطوارئ. (الفريق المطلوب — مدير مناوب/طبيب/ممرضة/IT — بيتعرّف على مستوى الـ backend في إعداد سلسلة التصعيد).

### 6.3 Evaluation on progress · تقييم (Button 3, green)
**Purpose:** rate each journey stage and the people in it (doctor, nurse, response team); ratings feed quality decisions and earn loyalty points.

- On-device: after each stage, show a star rating + optional voice/text comment (STT).
- API: `POST /stages/{id}/feedback` body `{ "stars": 1..5, "comment": "..." }` → returns `ratingId` and **+20 care points** (`GET /patients/{serial}/care-points` shows the balance).

> **خلاصة:** تقييم بالنجوم + تعليق (صوت/نص) لكل مرحلة وللطاقم؛ بيتحوّل لداشبورد الجودة وبيكسب نقاط ولاء (+٢٠ نقطة).

### 6.4 Development / Improve the service · تطوير (Button 4, purple) ❓
**Purpose (manager's brief, needs confirmation):** general "development" — the manager wants to weigh in on everything (e.g. "I want two nurses/doctors, not one") and to **rate the infrastructure / the app itself**. Our interpretation: a **suggestions + service/app-rating** channel.

- On-device: submit a suggestion / report an issue (voice or text via STT) and rate the app/infrastructure.
- API: `POST /complaints` body `{ "stage": "...", "text": "..." }` for issues/suggestions; app/infrastructure rating reuses the feedback model.
- ❓ **Please confirm with the manager** exactly what "Development" should do — see §12 Q5. We've scoped it as feedback/suggestions + app rating; if he means staffing requests or config, that's a different (staff-side) workflow.

> **خلاصة:** المدير قصده بـ"تطوير" مش واضح ١٠٠٪ (قال عايز رأيه في كل حاجة وتقييم الـ infrastructure/الـ app). فسّرناها كقناة **اقتراحات + تقييم الخدمة/التطبيق** عبر الشكاوى والـ feedback. **محتاجين نأكّد منه** المقصود بالظبط (سؤال ٥ في §12).

### 6.5 Entertainment · ترفيه (Button 5, orange)
**Purpose:** videos, games, and relaxation content.

- On-device: relaxation kit (calm breathing, nature sounds), light games, and films/videos.
- API: `GET /education/relax` → `{ library: [...], relax_kit: [ {Calm Breathing, audio, 5min}, {Nature Sounds, audio, 10min}, {Light Puzzle Game, game} ] }`.

> **خلاصة:** فيديوهات وألعاب خفيفة ومحتوى استرخاء (تنفّس هادئ/أصوات طبيعة) من endpoint الترفيه.

---

## 7. Integration with the ABCDE backend · التكامل

Base URL: `{{base_url}}/api/v1`. Auth: **Laravel Sanctum bearer tokens**. All responses are localized; every response carries `meta.locale` and a `Content-Language` header. Health/capabilities: `GET /api/v1/health` returns `supported_languages` and `rtl_languages`.

### 7.1 Two operating modes — device **MUST** support both
| Mode | Path | Use case |
|---|---|---|
| **A — Companion (BLE relay)** | Band ⇄ **BLE** ⇄ patient phone app ⇄ `/api/v1` | Default for home/ambulatory use; phone provides connectivity + heavy STT. |
| **B — Standalone** | Band ⇄ **Wi-Fi/LTE** ⇄ `/api/v1` directly (device token) | In-ward use when the patient has no phone on them. |

For Mode A, Cardoo **MUST** deliver a documented **BLE GATT profile / SDK** (services & characteristics for vitals, battery, alerts, time sync, OTA) so our mobile app can read from the band. (❓ §12 Q3.)

> **خلاصة:** الجهاز لازم يدعم وضعين: (أ) يتوصل بالموبايل عبر بلوتوث والموبايل يكلّم الـ API (الافتراضي)، (ب) يتوصل لوحده عبر واي فاي/LTE بـ device token (للاستخدام جوّه العنبر من غير موبايل). في الوضع (أ) محتاجين من Cardoo **BLE GATT profile/SDK** موثّق.

### 7.2 Authentication & device identity
| ID | Requirement |
|---|---|
| INT-1 | The band **MUST** authenticate to the API with a bearer token. Patient-scoped actions (SOS, feedback, education) run under the **bound patient's** token (login: `POST /auth/login`, or QR pairing: `POST /auth/login/qr`). |
| INT-2 | ⚠️ **Backend gap to close:** `POST /visits/{id}/vitals` is currently restricted to `nurse,doctor,admin` roles, so a patient-held device **cannot** post vitals through it as-is. Our backend team will add a **device-scoped vitals ingestion endpoint** (proposed `POST /devices/{deviceId}/vitals` or `POST /patients/{serial}/wearable/vitals`) authenticated by a **device token**, plus device registration. Cardoo's firmware **MUST** target that ingestion contract (§7.3). |
| INT-3 | Device tokens **MUST** be revocable/rotatable; loss/theft of a band **MUST NOT** expose other patients' data. |

> **خلاصة:** السوار بيتصادق بـ bearer token. أفعال المريض (استغاثة/تقييم/تثقيف) بتشتغل بـ token المريض المربوط. **تنبيه:** الـ endpoint الحالي لتسجيل الـ vitals محصور على الطاقم الطبي، فالـ backend هيضيف **endpoint مخصّص لاستقبال vitals من الأجهزة بـ device token** + تسجيل الأجهزة، و Cardoo لازم تبني عليه. التوكِنات لازم تكون قابلة للإلغاء/التدوير.

### 7.3 Vitals ingestion contract (to be implemented our side; target this shape)
The device posts a vitals set. Field names **MUST** match the backend `Vital` model so NEWS2 runs unchanged:

```json
POST /api/v1/patients/{serial}/wearable/vitals
Authorization: Bearer <device_token>
Content-Type: application/json

{
  "device_id": "CARDOO-AB12-0007",
  "ticket_no": "#ALM-20413",
  "taken_at": "2026-06-14T10:32:00Z",
  "systolic_bp": 128,
  "diastolic_bp": 82,
  "pulse": 76,
  "respiratory_rate": 16,
  "spo2": 97,
  "temperature": 37.1,
  "pain_score": 2,
  "consciousness_avpu": null,
  "quality": { "pulse": "good", "spo2": "good", "bp": "estimated", "rr": "low_confidence" },
  "on_wrist": true
}
```

Validation ranges enforced by the backend (device **SHOULD** pre-validate): `systolic_bp 40–300`, `diastolic_bp 20–200`, `pulse 20–260`, `respiratory_rate 4–60`, `spo2 50–100`, `temperature 30–45`, `pain_score 0–10`, `consciousness_avpu ∈ {A,V,P,U}` or null.

**Backend response** returns the computed `news2_score`, `risk_level` (`low|medium|high`), and breakdown — the device **MAY** display the risk band but **MUST NOT** compute its own. On `medium`/`high`, the backend auto-notifies the clinical team (no extra device action needed).

> **خلاصة:** الجهاز بيبعت مجموعة العلامات بنفس أسماء الحقول اللي في موديل `Vital` عشان NEWS2 يشتغل من غير تغيير، مع تقييم جودة لكل قراءة وعلامة on_wrist. الـ backend بيرجّع الـ NEWS2 score والـ risk_level، ولو medium/high بيبلّغ الفريق أوتوماتيك. الجهاز يعرض الـ risk بس مايحسبوش بنفسه.

### 7.4 Other endpoints the device uses
| Feature | Method & path | Notes |
|---|---|---|
| SOS | `POST /emergency/sos` | `{ticket_no, location}` → `event_id`; escalation chain (§6.2). |
| Live SOS status | `GET /emergency/active` *(staff-scoped)* / notifications | Patient sees status via notifications. |
| Notifications (alerts) | `GET /notifications`, `POST /notifications/{id}/read` | Pre-localized to patient language; render + haptic. |
| Education | `GET /education/videos`, `GET /education/relax` | §6.1, §6.5. |
| Rating | `POST /stages/{id}/feedback` | §6.3; returns care points. |
| Feedback/suggestions | `POST /complaints` | §6.4. |
| Care points | `GET /patients/{serial}/care-points` | Loyalty balance. |
| Financial | `GET /patients/{serial}/insurance`, `GET /visits/{id}/financial-file` | §6.1 financial education. |
| Speech-to-text | `POST /documentation/transcribe` (staff today) → a patient STT endpoint to be added | §5 SW-9. |
| Time/i18n/capabilities | `GET /health` | `supported_languages`, `rtl_languages`. |

### 7.5 Push & real-time
| ID | Requirement |
|---|---|
| INT-4 | Alerts **SHOULD** reach the device in near-real-time. Backend will expose push (FCM) / WebSocket; in companion mode the phone relays pushes to the band over BLE, in standalone mode the band subscribes directly. Cardoo to advise supported push transport. ❓ |

> **خلاصة:** التنبيهات لازم توصل الجهاز شبه فوري — عبر FCM/WebSocket؛ في وضع الموبايل الموبايل بيمرّر التنبيه للسوار بالبلوتوث، وفي الوضع المستقل السوار بيشترك مباشرة. محتاجين Cardoo تقول وسيلة الـ push المدعومة.

---

## 8. Security & privacy · الأمان والخصوصية

| ID | Requirement |
|---|---|
| SEC-1 | All API traffic **MUST** be **TLS 1.2+ (HTTPS)**; no plaintext endpoints. |
| SEC-2 | BLE link **MUST** be encrypted/bonded; pairing **MUST** require explicit user/clinician action. |
| SEC-3 | Any PHI stored on the device **MUST** be encrypted at rest; keys protected by secure element/keystore where available. |
| SEC-4 | Device data wipe **MUST** be possible remotely and on re-provisioning (SW-8). |
| SEC-5 | Tokens **MUST** be stored securely and never logged; support rotation/revocation (INT-3). |
| SEC-6 | **Data residency:** patient data **SHOULD** remain hosted in Egypt / per hospital policy; no third-party analytics SDKs may exfiltrate PHI. |
| SEC-7 | The device/firmware **MUST** support an audit trail of clinically-relevant events (readings sent, SOS fired, binding changes). |

> **خلاصة:** كل الاتصال HTTPS (TLS 1.2+)، البلوتوث مشفّر ومقترن بإذن صريح، أي بيانات مريض على الجهاز مشفّرة، إمكانية مسح عن بُعد، توكِنات آمنة قابلة للتدوير، البيانات تفضل مستضافة في مصر/حسب سياسة المستشفى من غير SDKs تسرّب بيانات، وسجل تدقيق للأحداث المهمة.

---

## 9. Regulatory & quality · التنظيم والجودة

| ID | Requirement |
|---|---|
| REG-1 | Cardoo **MUST** state the device's regulatory class and any clearances (Egyptian Drug Authority / EDA medical-device registration as applicable). |
| REG-2 | Manufacturing **SHOULD** be under **ISO 13485** (medical device QMS). |
| REG-3 | Electrical/medical safety **SHOULD** meet **IEC 60601-1** (and 60601-1-2 EMC) where the device is a medical monitor. |
| REG-4 | Biocompatibility of skin-contact materials **MUST** meet **ISO 10993** (skin-contact). |
| REG-5 | SpO₂ / BP / temperature accuracy claims **MUST** cite the validation standard used (e.g. ISO 80601-2-61 for pulse oximeters, ISO 81060-2 for BP). |
| REG-6 | Cardoo **MUST** clarify which outputs are **clinical-grade vs. wellness/indicative**, so we label them correctly in the UI (e.g. cuffless BP shown as "estimate"). |

> **خلاصة:** Cardoo لازم تحدّد تصنيف الجهاز وتسجيله (هيئة الدواء المصرية)، ويفضّل تصنيع تحت ISO 13485، وأمان كهربي IEC 60601، وتوافق حيوي ISO 10993 للمواد الملامسة للجلد، وذكر معايير التحقق لدقة SpO₂/الضغط/الحرارة، وتوضيح أي قياسات "طبية معتمدة" وأي قياسات "تقديرية" عشان نكتبها صح في الواجهة.

---

## 10. Acceptance criteria · معايير القبول

| ID | Criterion |
|---|---|
| ACC-1 | All NEWS2 vitals captured and posted in the §7.3 shape; backend computes a NEWS2 score with no field mapping changes. |
| ACC-2 | Each of the 5 physical buttons opens its correct feature within 1 s, with the device locked. |
| ACC-3 | UI verified in all 4 languages incl. Arabic RTL; alerts render in the patient's preferred language. |
| ACC-4 | STT converts Arabic + English speech to text in a noisy ward sample with acceptable word error rate (target ❓ to agree). |
| ACC-5 | SOS press-and-hold fires within 2 s and the event appears on the Emergency dashboard; accidental single-tap does **not** fire. |
| ACC-6 | Accuracy of pulse/SpO₂/temperature within the §3 targets vs. reference devices on a pilot cohort. |
| ACC-7 | ≥ 48 h battery under the defined duty cycle; offline buffering replays after reconnect with no data loss. |
| ACC-8 | Security: TLS-only, encrypted BLE, encrypted at-rest PHI, remote wipe demonstrated. |

> **خلاصة:** القبول مبني على: تسجيل كل علامات NEWS2 بالشكل المتفق، الزراير الـ٥ تفتح features بسرعة والجهاز مقفول، الواجهة شغّالة بالـ٤ لغات والعربي RTL، STT يحوّل عربي/إنجليزي بدقة مقبولة، زر الطوارئ يشتغل بضغطة مستمرة ومايتفعّلش بالغلط، دقة القياسات في الحدود، بطارية ≥ ٤٨ ساعة وتخزين أوفلاين بدون فقد، وأمان كامل.

---

## 11. Deliverables we need from Cardoo · المطلوب من Cardoo تسلّمه

1. **Hardware datasheet** — sensors, accuracy, BOM summary, dimensions, weight, battery, IP rating.
2. **BLE GATT profile + mobile SDK** (iOS/Android) for companion mode (§7.1).
3. **Firmware update (OTA) mechanism** description and security model.
4. **Sample/pilot units** (qty ❓) for integration testing against `/api/v1`.
5. **Regulatory pack** — classifications, certificates, validation standards (§9).
6. **API/firmware integration doc** mapping device events → our ingestion contract (§7.3).
7. **Pricing** — per-unit (volume tiers), NRE/customization, and per-feature cost deltas (e.g. cuffless BP, LTE, cuff module).
8. **Lead time** for samples and for a production batch.

> **خلاصة:** عايزين من Cardoo: داتاشيت الهاردوير، BLE GATT profile + SDK للموبايل، آلية تحديث OTA وأمانها، وحدات عيّنة للاختبار، الحزمة التنظيمية والشهادات، مستند تكامل يربط أحداث الجهاز بعقد استقبال البيانات عندنا، التسعير (للوحدة + التخصيص + فروق كل ميزة)، ومدة التوريد.

---

## 12. Open questions for Cardoo · أسئلة محتاجين ردهم

| # | Question |
|:--:|---|
| Q1 | Can you build a **custom bracelet** with a touchscreen **+ 5 dedicated physical buttons**, or is your platform a fixed SKU? What's customizable (case, buttons, colors, band)? |
| Q2 | **Blood pressure** — do you offer cuffless estimation, a companion cuff, or both? What accuracy/validation can you certify? (§3.1) |
| Q3 | Do you provide a documented **BLE GATT profile + mobile SDK**? Can we read raw vitals and push commands (measure-now, time sync, OTA)? (§7.1) |
| Q4 | Which **connectivity** options (Wi-Fi / LTE-M / NB-IoT) and which **push** transport do you support for standalone mode? (§7.5) |
| Q5 | Can the firmware run our **4-language UI (ar/en/zh/ru, RTL)** and on-device **STT** — or must STT stream to our server? What languages does your STT support? (SW-2, SW-9) |
| Q6 | Confirm **battery life** under a vitals-sampling duty cycle and the charging method. (HW-20) |
| Q7 | **Regulatory status** in Egypt and which accuracy validation standards you meet. (§9) |
| Q8 | Sample-unit **quantity, price, and lead time**; production MOQ and pricing tiers. (§11) |
| Q9 | What is your recommended **vitals sampling cadence** (continuous vs. interval) and its battery trade-off? |

> **خلاصة (سؤال داخلي لازم نأكّده مع المدير قبل ما نبعت):** المقصود بميزة **"Development / تطوير"** بالظبط إيه؟ هل قناة اقتراحات + تقييم للتطبيق/الـ infrastructure (تفسيرنا)، ولا طلبات تشغيلية زي "عايز ممرّضين بدل واحد"؟ ده بيغيّر الـ scope (انظر §6.4).

---

## 13. Summary of what we're asking Cardoo to build · الملخص النهائي

A **custom medical bracelet** that:
1. Measures the **full NEWS2 vitals set** (pulse, SpO₂, temperature, respiratory rate, blood pressure) with quality flags, and streams them to our backend where NEWS2 runs and auto-alerts the clinical team.
2. Runs an **embedded app** showing **5 features** (Educational, Alert/SOS, Evaluation, Development, Entertainment), each also reachable by a **dedicated physical button**.
3. Supports **4 languages (ar/en/zh/ru, RTL)** and a **microphone for speech-to-text**.
4. **Integrates** with the ABCDE `/api/v1` (Sanctum + a device-token ingestion endpoint we will add), in **companion (BLE)** and **standalone (Wi-Fi/LTE)** modes.
5. Meets **security, privacy and medical-device** requirements (TLS, encryption, ISO/IEC standards, EDA registration).

> **خلاصة نهائية:** سوار طبي مخصّص يقيس **كل علامات NEWS2** ويبعتها للسيرفر اللي بيحسب الخطورة ويبلّغ الفريق، وفيه **app بـ 5 features** كل واحدة ليها **زر فيزيائي**، يدعم **٤ لغات + مايك STT**، ويتكامل مع `/api/v1` في وضعين (بلوتوث/مستقل)، وملتزم بمعايير الأمان والأجهزة الطبية.

---

*Contact: ABCDE Platform Team — Backend lead: Mohamed. · Document v1.0 · 2026-06-14.*
