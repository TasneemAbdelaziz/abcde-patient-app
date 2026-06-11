# A.B.C.D.E Platform — تقسيم المشروع لـ Modules (بعمق) + خطة الـ 10 أيام

> مستشفى العلمين النموذجي — منصة A.B.C.D.E · السيناريو المرجعي: **مريض أزمة قلبية** (Catheterization pathway).
> الملف ده بيربط: **Module ← FRs (مع أرقام SRS) ← Backend API ← صفحات الويب ← شاشات الموبايل**.
> مصدر التفاصيل: `requirements/user-mindmaps.html` (الـ mindmap) + `ABCDE_API.postman_collection.json` + `dashboards/`.
> آخر تحديث: 11/6/2026

---

## 1) المعمارية والفريق

| السطح | التقنية | المكان | المحتوى |
|------|---------|--------|---------|
| **Backend API** | Laravel + Sanctum | `/api/v1` | 16 مجموعة Endpoints |
| **Web Dashboards** | Role-based | `dashboards/` | doctor, nurse, reception, quality, admin, emergency, family + AI FAB |
| **Patient Mobile App** | SPA موبايل | `index.html`+`app.js` | شاشات المريض/المرافق/الضيف |
| **Public Landing** | ويب عام | `landing.html` | بوابة عامة |

**الفريق (6):** Backend = **Mohamed + Tasnem** · Mobile Screens = **Heba + Mena** · Web Dashboards = **Sara الخراشي** · UI/UX & Content = **Mayar**.
**الأدوار:** Patient (guest & registered) · Family companion · Doctor · Nurse · Receptionist · Quality Manager · Hospital Director · System Admin.
**اللغات (NFR):** عربي / إنجليزي / روسي.

### مفتاح الحالة (من ألوان الـ mindmap)
- ✅ **مبني في البروتوتايب** (prototype)
- 🟡 **جزئي** (partial — UI موجودة بدون باك حقيقي)
- ⬜ **لسه** (not built — غالباً باك/إكلينيكي)

> الـ **In → Out** لكل feature هي نفسها مدخلات/مخرجات الـ mindmap = عقد الـ API.

---

## 2) الـ Modules بالتفصيل (الـ features اللي جوه كل واحد)

التقسيم بيجمّع الـ 17 FR في 12 module. كل module تحته جدول بكل sub-features (برقم SRS).

---

### 🟥 M1 — Identity & Onboarding · الهوية والتسجيل
**FRs:** FR1 (Authentication 1.1–1.2) · **Backend:** `Authentication & Identity`
`POST /auth/login` · `/auth/login/qr` · `/auth/logout` · `POST /patients/register` · `GET /patients/{serial}` · `PUT /patients/{serial}/preferences` · `POST /patients/{serial}/cards`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 1.1.1 | Login (password) · دخول بكلمة سر | Patient · Mobile | ✅ | mobile\|fileId, password → authToken, role |
| 1.1.1 | Login (staff) · دخول الموظف | Staff · Web | ⬜ | credentials → authToken |
| 1.1.2 | Login by QR · دخول بـ QR | Patient · Mobile | 🟡 | qrToken → authToken |
| 1.1.2 | Issue QR · إصدار QR | Reception · Web | ⬜ | patientId → qrToken |
| 1.1.3 | Guest access · دخول كزائر | Visitor · Public/Mobile | ✅ | — → guest session |
| 1.2.1 | Register patient · تسجيل | Patient/Family/Reception · Mobile/Web | 🟡 | name, nationalId, age, address, phone → patientId |
| 1.2.1 | Issue ID card · إصدار كارت | Reception · Web | ⬜ | patientId, type(arrival/booking) → card+barcode |
| 1.2.2 | Set preferences · التفضيلات | Patient · Mobile | ⬜ | religion, language, contact, decisionMaker → prefs |

---

### 🟧 M2 — Public Portal & Appointments · البوابة العامة والمواعيد
**FRs:** FR2 (Public Portal) · FR3 (Appointments) · **Backend:** `Public Portal` + `Appointments`
`GET /public/{hospital,departments,doctors,news}` · `POST /appointments` · `GET /appointments` · `GET /appointments/slots` · `PATCH /appointments/{id}/reschedule` · `DELETE /appointments/{id}`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 2.1.1 | View hospital info · معلومات المستشفى | Visitor · Public | ⬜ | — → about, contacts, videos |
| 2.2.1 | Browse departments · تصفّح الأقسام (21 قسم) | Visitor · Public | ⬜ | — → dept pages |
| 2.2.2 | Doctor directory · دليل الأطباء | Visitor · Public | ⬜ | specialty filter → doctors[] |
| 2.3.1 | News & stories · أخبار وقصص | Visitor · Public | ⬜ | — → articles[] |
| 3.1.1 | Request appointment · طلب موعد | Patient/Family/Visitor · Mobile/Public | 🟡 | dept, complaint, time → requestId |
| 3.1.2 | Manage bookings · إدارة الحجوزات | Reception · Web | ⬜ | — → slots[] |
| 3.2.1 | View appointments · عرض المواعيد | Patient/Doctor · Mobile/Web | ✅ | patientId → upcoming[] |
| 3.2.2 | Reschedule / Cancel · إعادة جدولة/إلغاء | Patient · Mobile | 🟡 | apptId, newTime → updated appt |
| 3.3.1 | Assign to doctor · إسناد لطبيب | Reception/Director · Web | ⬜ | patientId, doctorId → assignment |

---

### 🟨 M3 — Patient Journey · رحلة الرعاية (8 مراحل)
**FRs:** FR4 (Care Journey) · **Backend:** `Patient Journey`
`POST /visits` · `POST /visits/{id}/triage` · `GET /visits/{id}` · `POST /visits/{id}/advance`
**المراحل:** Arrival → Triage → Diagnosis → Catheterization → Recovery → Ward → Discharge → Home Follow-up

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 4.1.1 | Open ticket / file · فتح التذكرة | Reception · Web | ⬜ | patientId → ticketNo, file |
| 4.1.1 | Receive visit ticket · استلام التذكرة | Patient · Mobile | 🟡 | patientId → ticketNo (#ALM-20413) |
| 4.1.1 | Triage & route · فرز وتوجيه | Nurse · Web | ⬜ | ticketNo, assessment → destination (clinic/ER) |
| 4.2.1 | Advance stages · تحريك المراحل | Doctor/Nurse · Web | ⬜ | ticketNo, decision → new stage, owner |
| 4.2.2 | Alternative pathway · مسار بديل | Doctor · Web | ⬜ | ticketNo, finding → re-route |
| 4.2.3 | Select cath type · نوع القسطرة | Doctor · Web | ⬜ | finding → cathType, specialist |
| 4.3.1 | View simplified status · الحالة المبسّطة | Patient/Family · Mobile | ✅ | ticketNo → statusText |
| 4.4.1 | Classify arrival type · نوع الوصول | Reception · Web | ⬜ | arrival channel → emergency\|scheduled |
| 4.4.2 | Identify patient · تحديد الهوية | Reception · Web | ⬜ | wallet, ID, insurance → provisional identity |
| 4.4.3 | Three-doctor committee · لجنة الأطباء الثلاثة | Doctor · Web | ⬜ | life-threatening case → Direct Admission Form |
| 4.5.1 | Informed consent · الموافقة المستنيرة | Doctor/Patient/Family · Web/Mobile | ⬜ | procedure, decisionMaker → consent record |
| 4.5.2 | Pre-op + safety time-out · فحص الأمان الجراحي | Nurse · Web | ⬜ | checklist → verified |
| 4.6.1 | Maintain care plan · خطة الرعاية | Doctor · Web | ⬜ | problem list → plan, outcomes, timeframe |
| 4.6.2 | Internal transport safety (RSTP) · أمان النقل | Nurse · Web | ⬜ | from/to dept, monitoring → transport form |
| 4.6.3 | Discharge + family education · الخروج والتثقيف | Doctor · Web | ⬜ | outcome → condition, education, follow-up |

---

### 🟩 M4 — Vitals & Early Warning (NEWS2/Risk) · العلامات الحيوية والإنذار المبكر
**FRs:** FR5 (Vitals & Risk) · **Backend:** `Vitals & Early Warning`
`POST /visits/{id}/vitals` · `GET /visits/{id}/vitals` · `GET /visits/{id}/risk-score` · `POST /visits/{id}/risk-score/recompute`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 5.1.1 | Record vitals · تسجيل العلامات | Nurse · Web | ⬜ | BP, pulse, RR, SpO2, temp → saved |
| 5.1.2 | Assess pain / consciousness · تقييم الألم/الوعي | Doctor/Nurse · Web | ⬜ | scale (0–10/GCS) → saved |
| 5.2.1 | Set thresholds · ضبط الحدود | Doctor · Web | ⬜ | limits → ruleSet |
| 5.3.1 | Compute risk (NEWS2/MEWS) · حساب الخطورة | AI engine · Backend | ⬜ | vitals, labs → score |
| 5.3.2 | Deterioration alert · تنبيه تدهور | Doctor/Nurse · Web/Mobile | ⬜ | riskLevel → alert |
| 5.3.3 | VTE Padua score · خطورة الجلطات | Doctor · Web | ⬜ | risk factors → score, prophylaxis |
| 5.4 | View own vitals · عرض علاماتي | Patient · Mobile | ✅ | patientId → HR, BP, SpO2 |

---

### 🟦 M5 — Clinical: Medication + Diagnostics & EMR · الأدوية والفحوصات والسجل
**FRs:** FR6 (Medication) · FR7 (Diagnostics & EMR) · **Backend:** `Medication` + `Diagnostics & Records`
`POST/GET /visits/{id}/prescriptions` · `POST /prescriptions/{id}/administer` · `GET /pharmacy/availability` · `POST/GET /visits/{id}/orders` · `GET /visits/{id}/results` · `GET /patients/{serial}/file` · `POST /visits/{id}/consultations`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 6.1.1 | Prescribe medication · وصف الدواء | Doctor · Web | ⬜ | drug, dose, timing, route → medPlan |
| 6.1.2 | Reconcile medications · مطابقة الأدوية | Doctor/Nurse · Web | ⬜ | chronic dx, current meds → reconciled list |
| 6.2.1 | Get reminders · تذكيرات الدواء | Patient · Mobile | ✅ | patientId → due doses |
| 6.2.2 | Administer & log (MAR) · إعطاء وتسجيل | Nurse · Web | ⬜ | medItemId, time → log |
| 6.2.2 | Mark dose taken · تأكيد جرعة | Patient · Mobile | 🟡 | medItemId, time → adherence |
| — | Pharmacy availability · توفّر الدواء | Doctor/Nurse · Web | ⬜ | drug → availability |
| 7.1.1 | Order tests · طلب فحوصات | Doctor · Web | ⬜ | patientId, types[] (lab/radiology) → orderIds[] |
| 7.2.1 | View / download reports · عرض التقارير | Patient · Mobile | ✅ | patientId, type → report doc |
| 7.2.2 | Review history · السجل التاريخي | Doctor · Web | ⬜ | patientId → past visits |
| 7.2.3 | ICD-coded diagnosis · تشخيص بترميز ICD | Doctor · Web | ⬜ | findings → ICD-10, summary |
| 7.3.1 | Doctor's orders · أوامر الطبيب | Doctor · Web | ⬜ | med/lab/imaging/diet → orders + status |
| 7.3.2 | Consultation request · طلب استشارة | Doctor · Web | ⬜ | specialty, question → consult reply |

---

### 🟪 M6 — AI Assistant & Documentation · المساعد الذكي والتوثيق
**FRs:** FR8 (AI Assistant) · FR9 (Clinical Documentation) · **Backend:** `AI Assistant` + `AI Documentation`
`POST /assistant/ask` · `POST /assistant/triage` · `POST /documentation/draft` · `POST /documentation/{draftId}/approve` · `POST /documentation/transcribe` · `POST /documentation/translate`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 8.1.1 | Ask advisor · اسأل المساعد | Patient/Family · Mobile | 🟡 | question, context → answer |
| 8.1.2 | Symptom triage · فرز الأعراض | Patient · Mobile | ⬜ | symptoms → urgency, red-flag |
| 8.2.1 | Receive escalation · استقبال تحويل | Doctor/Nurse · Web | ⬜ | ticketNo → handoff |
| 9.1.1 | Generate report draft · مسودة تقرير | Doctor · Web | ⬜ | EMR data, type → draft |
| 9.1.2 | Review & approve · مراجعة واعتماد | Doctor · Web | ⬜ | draftId, edits → final |
| 9.2.1 | Voice transcription · تفريغ صوتي | Doctor · Web | ⬜ | audio → note text |
| 9.2.2 | Translate · ترجمة (AR/EN/RU) | Doctor/Patient · Web/Mobile | ⬜ | text, lang → translated |

> ⚠️ **NFR-2:** أي مخرج AI **لا يُحفظ في السجل إلا بعد اعتماد بشري**؛ الـ AI لا يشخّص؛ الأعلام الحمراء تُحوَّل لإنسان.

---

### 🟥 M7 — Emergency & Notifications · الطوارئ والإشعارات
**FRs:** FR12 (Notifications & Emergency) · **Backend:** `Notifications & Emergency`
`POST /emergency/sos` · `GET /notifications` · `POST /notifications/{id}/read`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 12.1.1 | Receive alerts · استقبال التنبيهات | Patient/Family · Mobile | ✅ | patientId → alerts[] |
| 12.2.1 | Trigger SOS · زر الطوارئ | Patient/Family · Mobile | ✅ | patientId, location → emergency raised |
| 12.2.2 | Activate Code Blue · تفعيل كود بلو | Nurse/Emergency · Web | ⬜ | location → team paged |
| — | Escalation chain · سلسلة التصعيد | Emergency · Web | 🟡 | sos → physician→nursing→family→care-center |
| — | Mark read · تعليم مقروء | Patient · Mobile | ✅ | notifId → read |

---

### 🟧 M8 — Family & Caregiver · العائلة والمرافق
**FRs:** FR11 (Family Access) · **Backend:** `Family & Caregiver`
`POST/GET /patients/{serial}/family` · `PATCH /family/{id}/permissions` · `DELETE /family/{id}`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 11.1.1 | Add companion · إضافة مرافق (QR/يدوي) | Patient · Mobile | ✅ | name\|QR, relation → linked (max 1) |
| 11.1.1 | Accept link · قبول الربط | Family · Mobile | ✅ | inviteId → access |
| 11.1.2 | Set permissions · الصلاحيات | Patient · Mobile | ✅ | companionId, level → permission set |
| 11.2.1 | Family notifications · تنبيهات الأهل | Family · Mobile/Web | 🟡 | companionId → care-area/op alerts |
| 4.3.1 | View status (family) · متابعة الحالة | Family · Web/Mobile | 🟡 | ticketNo → stage, status, physician |
| 7.2.1 | Blocked from results · محجوب عن النتائج | Family · — | ⬜ | — → privacy enforced |
| 4.5.1 | Consent as decision-maker · موافقة المخوّل | Family · Mobile | ⬜ | requestId → consent record |

---

### 🟨 M9 — Billing & Insurance · الفواتير والتأمين
**FRs:** FR13 (Billing) · **Backend:** `Billing & Insurance`
`GET /patients/{serial}/insurance` · `POST /visits/{id}/billing/committee-review` · `GET /visits/{id}/financial-file` · `POST /visits/{id}/payments`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 13.1.1 | Set coverage category · فئة التغطية | Reception · Web | ⬜ | patientId → self-pay/state/insurance/pension/student |
| 13.1.1 | View bill · عرض الفاتورة | Patient · Mobile | ✅ | patientId → bill, due |
| 13.1.2 | Pay · الدفع | Patient/Family · Mobile | 🟡 | amount, method → receipt |
| — | Committee review (funding) · لجنة التمويل | Reception · Web | ⬜ | reason → memo/authorization |
| — | Financial file · الملف المالي | Reception · Web | ⬜ | visitId → financial file |

---

### 🟩 M10 — Feedback & Quality · التقييم والجودة
**FRs:** FR10 (Feedback & Quality) · **Backend:** `Feedback & Quality`
`POST /stages/{id}/feedback` · `POST /complaints` · `GET /quality/dashboard`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 10.1.1 | Rate a stage · تقييم مرحلة | Patient/Family · Mobile | ✅ | stageId, stars → ratingId, +20 points |
| 10.1.2 | Report an issue · إبلاغ مشكلة | Patient · Mobile | ✅ | stage, text → ticketId |
| 10.2.1 | Handle complaints (≤6h SLA) · إدارة الشكاوى | Quality · Web | ⬜ | complaintId → response/escalate |
| 10.2.2 | Analyze & report (AI sentiment) · تحليل وتقارير | Quality · Web | ⬜ | ratings, comments → sentiment, themes |

---

### 🟦 M11 — Education & Loyalty · التثقيف ونقاط الولاء
**FRs:** FR14 (Education) · **Backend:** `Education & Loyalty`
`GET /education/videos` · `GET /education/relax` · `GET /patients/{serial}/care-points`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 14.1.1 | Education videos · فيديوهات تثقيفية | Patient · Mobile | ✅ | condition → videos[] |
| 14.1.2 | Relax content · محتوى مهدّئ | Patient · Mobile | ✅ | — → calm sounds, games, films |
| 14.2.1 | Earn Care Points · نقاط الرعاية | Patient · Mobile | ✅ | ratingId → points |

---

### 🟪 M12 — Admin, Reporting, Navigation & Accessibility · الإدارة/التقارير/الخرائط/الإتاحة
**FRs:** FR17 (Administration) · FR15 (Navigation) · FR16 (Accessibility) · FR1.3 (RBAC) · **Backend:** `Admin & Reporting` + `Indoor Navigation` + `Accessibility`
`POST /admin/users` · `PATCH /admin/users/{id}/role` · `GET /reports/kpis` · `GET /reports/monthly` · `GET /nav/{map,search,route}` · `GET/PUT /patients/{serial}/accessibility`

| SRS | Feature | الدور · السطح | الحالة | In → Out |
|-----|---------|---------------|:----:|----------|
| 1.3.1 | Define roles · تعريف الأدوار | Admin · Web | ⬜ | user, role → permissions |
| 1.3.2 | Edit-window rule (≤15 min) · نافذة التعديل | Admin · Web | ⬜ | record → enforced |
| 17.1.1 | Manage accounts · إدارة الحسابات | Admin · Web | ⬜ | user, role → account |
| 17.1.2 | Configure system · إعدادات النظام | Admin · Web | ⬜ | stages, roles, alarms, langs → config |
| 17.1.3 | Integrate DMS/HMIS · تكامل | Admin · Web | ⬜ | external data → synced |
| 17.2.1 | Management/KPI reports · تقارير الإدارة | Director/Quality · Web | ⬜ | range, filters → KPIs, comparisons |
| 17.2.2 | Audit / protect data · تدقيق وحماية | Admin · Web | ⬜ | record → log, access control |
| 15.1.1 | Open map · الخريطة الداخلية | Patient/Visitor · Mobile/Public | ⬜ | floor → map |
| 15.1.2 | Search & navigate · بحث وتوجيه | Patient · Mobile | ⬜ | room\|doctor\|dept → route |
| 16.1.1 | Vision / screen reader · إبصار/قارئ شاشة | Patient · Mobile | ⬜ | profile → contrast, TTS |
| 16.1.2 | Voice & audio · صوت | Patient · Mobile | ⬜ | voice command → action/audio |
| 16.1.3 | Hearing · سمع | Patient · Mobile | ⬜ | event → captions, haptics |
| 16.2.1 | Non-verbal · غير ناطق | Patient · Mobile | ⬜ | tap, message → request |
| 16.2.2 | Motor / elderly · حركة/كبار السن | Patient · Mobile | ⬜ | profile → switch, simple mode |

---

## 3) خريطة Module ↔ FR ↔ السطح (نظرة طائر)

| Module | FRs | Backend group | Web (dashboard/screens) | Mobile screens |
|--------|-----|---------------|--------------------------|----------------|
| M1 Identity | FR1.1–1.2 | Authentication & Identity | Reception: register, queue, issue QR/card | Intro, Login/QR, Guest, Profile |
| M2 Public & Appointments | FR2, FR3 | Public Portal, Appointments | Reception: appointments; Director assign | Appointments tab, Departments, News, Landing |
| M3 Journey | FR4 | Patient Journey | Reception overview, Nurse triage, Doctor worklist, Committee | Care Tracker (8), Consent |
| M4 Vitals/NEWS2 | FR5 | Vitals & Early Warning | Nurse vitals/ward/risk, Emergency critical | Home vitals grid |
| M5 Clinical | FR6, FR7 | Medication, Diagnostics & Records | Doctor file/orders/results/Rx, Nurse MAR | Visits, Meds, Reports(Health) |
| M6 AI | FR8, FR9 | AI Assistant, AI Documentation | Doctor AI console + shared FAB | AI Advisor, Symptom triage |
| M7 Emergency | FR12 | Notifications & Emergency | Emergency board/rules/critical | SOS, Alerts |
| M8 Family | FR11 | Family & Caregiver | Family status/updates/permissions/team | Family Access |
| M9 Billing | FR13 | Billing & Insurance | Reception billing/committee | Reports(Financial), Pay |
| M10 Quality | FR10 | Feedback & Quality | Quality overview/feedback/complaints/reports | Rating sheets, Report issue |
| M11 Education | FR14 | Education & Loyalty | (Admin content) | Learn & Relax, Care Points |
| M12 Admin/Nav/Access | FR17, FR15, FR16, FR1.3 | Admin & Reporting, Indoor Navigation, Accessibility | Admin (6 screens) | Map, Accessibility |

---

## 4) الأولوية + خطة الـ 10 أيام

### الأولوية (سيناريو الأزمة القلبية)
| المستوى | Modules | السبب |
|--------|---------|-------|
| **P0 — Core (قلب الديمو)** | M1, M3, M4, M5, M7 | تسجيل → رحلة → علامات/NEWS2 → تشخيص/قسطرة/أدوية → طوارئ |
| **P1 — Important** | M6, M10, M8 | مساعد AI، التقييم، العائلة |
| **P2 — Secondary** | M2, M9, M11, M12 | مواعيد، فواتير، تثقيف، إدارة/خرائط/إتاحة |

### الخطة (6 أفراد × 10 أيام)
**التوزيع:** Backend = Mohamed + Tasnem · Mobile = **Mena** (M1–M5, M11) + **Heba** (M6–M10, M12) · Web = **Sara** (كل الـ 7 داشبوردات) · UI/UX & Content = **Mayar**.

| اليوم | Backend (Mohamed + Tasnem) | Mobile (Mena + Heba) | Web Dashboards (Sara) | UI/UX & Content (Mayar) |
|-------|----------------------------|----------------------|------------------------|--------------------------|
| **1–2 تأسيس** | DB schema/migrations + Sanctum auth (M1) | App shell + tab-bar للموبايل | Dashboard shell/router + sidebar | Design system + i18n (ar/en/ru) + seed/media |
| **3–4** | M3 Journey (Mohamed) · M4 Vitals/NEWS2 (Tasnem) | Mena: Login + Care Tracker + Vitals · Heba: Alerts/SOS | Reception (register/queue) + Nurse (triage/vitals) | محتوى الرحلة + قيم العلامات + أيقونات |
| **5–6** | M5 Clinical (Tasnem) · M7 Emergency (Mohamed) | Mena: Meds/Reports · Heba: Family + Emergency mobile | Doctor (file/orders/Rx) + Emergency board | تقارير/نتائج وهمية + محتوى الطوارئ |
| **7–8 (P1+APIs)** | M6 AI + M10 + M8 + **ربط APIs** | **ربط الموبايل بالـ API** (Mena+Heba) بدل الداتا الوهمية | AI console + Quality + Family dashboards | تفريغ/ترجمة عيّنات + فيديوهات التثقيف |
| **9 (P2+تكامل)** | M2 + M9 + M12 backend | Mena: Appointments + Education · Heba: Billing/Nav/Accessibility | Admin (6 شاشات) + Committee/Billing | محتوى عام + خرائط + Care Points |
| **10 تسليم** | تثبيت + إصلاح أخطاء | اختبار E2E للموبايل + اللغات الـ3 | اختبار E2E للداشبوردات | Deploy (Pages + API host) + تجهيز الديمو |

> **نقطة الالتقاء الحرجة = يوم 7–8 (ربط الـ APIs).** عقود الـ In/Out (من الجداول فوق) لازم تكون متفق عليها قبلها.
> ⚠️ **تنبيه حِمل:** Sara لوحدها على **كل الـ 7 داشبوردات** (≈49 task فرونت) — ده أكبر حِمل في الفريق. لو ضاق الوقت، انقلوا داشبورد أو اتنين (مثلاً Quality/Family الخفيفين) لـ Mena/Heba.
> 🎨 شغل **Mayar (UI/UX)** أغلبه cross-cutting (Design system + هوية بصرية + ترجمة) مش مهام منفصلة في اللوحة — بيغذّي كل الشاشات.

---

## 5) ملاحظات تنفيذية
- الجداول فوق = **عقد الـ API**: عمود `In → Out` هو body/response لكل endpoint.
- ابدأوا بالـ **P0** كامل end-to-end قبل ما تفتحوا P2 — الديمو لازم يمشي السيناريو من الوصول للخروج.
- الحالات ⬜ (الإكلينيكي) هي أكبر شغل باك متبقي؛ الحالات ✅ موجودة UI في الموبايل وتحتاج بس ربط API.
- التزِموا بـ **NFR-2** (اعتماد بشري لأي مخرج AI) و**اللغات الـ3** في كل شاشة.
