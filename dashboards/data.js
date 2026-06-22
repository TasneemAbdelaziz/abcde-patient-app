/* ============================================================
   A.B.C.D.E — Staff Dashboards · data.js
   Reference lists (from the SRS) + the public homepage content +
   the tiny UI store (STATE) + i18n scaffolding.

   NOTE: all *patient / clinical* data now comes from the live
   Laravel API via api.js + store.js. This file only holds static
   reference vocabulary, the marketing homepage content, and the
   language strings for the shell.
   ============================================================ */

/* ---------- 6.4 journey states — the cardiac/cath spine (matches Visit::STAGES) ---------- */
window.STAGES = [
  { key: 'arrival',   label: 'Arrival / Reception',  owner: 'Receptionist' },
  { key: 'triage',    label: 'Triage',               owner: 'Head nurse' },
  { key: 'diagnosis', label: 'Specialty / Diagnosis', owner: 'Specialist' },
  { key: 'cathprep',  label: 'Cath prep (cold)',     owner: 'Surgeon, nurse' },
  { key: 'cath',      label: 'Catheterization',      owner: 'Cath-lab team' },
  { key: 'recovery',  label: 'Recovery / ICU',       owner: 'Nurse, physician' },
  { key: 'ward',      label: 'Ward',                 owner: 'Nurse, physician' },
  { key: 'discharge', label: 'Discharge',            owner: 'Physician' },
  { key: 'followup',  label: 'Home follow-up',       owner: 'Follow-up unit' }
];
window.stageIndex = function (key) { return window.STAGES.findIndex(function (s) { return s.key === key; }); };
window.stageLabel = function (key) {
  var s = window.STAGES.find(function (x) { return x.key === key; });
  var label = s ? s.label : (key ? key.charAt(0).toUpperCase() + key.slice(1) : '—');
  return window.t ? window.t(label) : label;
};

/* ---------- vitals thresholds — alert when crossed (FR-5.2) ---------- */
window.THRESHOLDS = {
  pulse: { low: 50, high: 110, unit: 'bpm', label: 'Pulse' },
  sbp:   { low: 100, high: 180, unit: 'mmHg', label: 'Systolic BP' },
  spo2:  { low: 94, high: 100, unit: '%', label: 'SpO₂' },
  temp:  { low: 36.0, high: 38.0, unit: '°C', label: 'Temperature' },
  rr:    { low: 12, high: 20, unit: '/min', label: 'Resp rate' }
};
// how often vitals are taken per stage (FR-5.1 detail)
window.OBS_FREQ = {
  diagnosis: 'every 30 min', cathprep: 'hourly', cath: 'continuous',
  recovery: 'every 15 min', ward: 'every 4 hours', triage: 'on arrival', arrival: 'on arrival',
  discharge: 'before discharge', followup: 'at visit'
};

/* ---------- three-doctor committee roster (UC-5 / FR-12.2) ---------- */
window.COMMITTEE = [
  { name: 'Dr. Ahmed Zaki',  role: 'Hospital Director', staff_id: 'DIR-001' },
  { name: 'Dr. Karim Adel',  role: 'Cardiology',        staff_id: 'D-001' },
  { name: 'Dr. Sherif Nabil', role: 'Internal Medicine', staff_id: 'D-005' }
];

/* ---------- hospital ---------- */
window.HOSPITAL = {
  name: 'Alamein Model Hospital',
  nameAr: 'مستشفى العلمين النموذجي',
  unit: 'A.B.C.D.E System'
};

/* ---------- public hospital site content (the marketing homepage) ---------- */
window.PUBLIC = {
  departments: [
    { icon: 'heart',       name: 'Cardiology & Catheterization', nameAr: 'القلب والقسطرة', desc: 'Primary PCI, cardiac cath lab, and the Door-to-Balloon pathway.' },
    { icon: 'brain',       name: 'Neurosurgery',           nameAr: 'جراحة المخ والأعصاب', desc: 'Cerebral catheterization and complex neurosurgery.' },
    { icon: 'activity',    name: 'Stroke Unit',            nameAr: 'وحدة السكتة الدماغية', desc: 'Rapid stroke assessment and thrombolysis.' },
    { icon: 'bone',        name: 'Orthopedics',            nameAr: 'العظام', desc: 'Trauma, joint replacement and sports injuries.' },
    { icon: 'stethoscope', name: 'Internal Medicine',      nameAr: 'الباطنة', desc: 'Diagnosis and management of chronic conditions.' },
    { icon: 'surgery',     name: 'General Surgery',        nameAr: 'الجراحة العامة', desc: 'Elective and emergency surgical care.' },
    { icon: 'baby',        name: 'Pediatrics',             nameAr: 'الأطفال', desc: 'Child health, from newborn to adolescent.' },
    { icon: 'scan',        name: 'Radiology (AI Imaging)', nameAr: 'الأشعة', desc: 'AI-equipped MRI and CT for precise diagnosis.' },
    { icon: 'tooth',       name: 'Dental',                 nameAr: 'الأسنان', desc: 'Oral surgery and routine dental care.' },
    { icon: 'user',        name: 'Obstetrics & Gynecology', nameAr: 'النساء والولادة', desc: 'Maternity, gynecology and women’s health.' },
    { icon: 'eye',         name: 'Ophthalmology',          nameAr: 'العيون', desc: 'Eye examinations and microsurgery.' },
    { icon: 'ambulance',   name: 'Emergency',              nameAr: 'الطوارئ', desc: 'Open 24/7 with triage and resuscitation.' }
  ],
  services: [
    { icon: 'ambulance', name: '24/7 Emergency',        nameAr: 'طوارئ ٢٤ ساعة', desc: 'Always open, with triage and rapid response.' },
    { icon: 'heart',     name: 'Cardiac Cath Lab',      nameAr: 'معمل القسطرة القلبية', desc: 'Round-the-clock primary PCI for heart attacks.' },
    { icon: 'scan',      name: 'AI-Equipped Imaging',   nameAr: 'أشعة بالذكاء الاصطناعي', desc: 'MRI and CT powered by AI for precise reads.' },
    { icon: 'flask',     name: 'Laboratory',            nameAr: 'المعمل', desc: 'Full diagnostic lab integrated with the record.' },
    { icon: 'pill',      name: 'Pharmacy',              nameAr: 'الصيدلية', desc: 'In-house pharmacies across the hospital.' },
    { icon: 'activity',  name: 'Intensive Care (ICU/CCU)', nameAr: 'الرعاية المركزة', desc: 'Critical and cardiac intensive care units.' }
  ],
  doctors: [
    { name: 'Dr. Karim Adel',   spec: 'Interventional Cardiology', specAr: 'قلب وقسطرة', sex: 'M' },
    { name: 'Dr. Heba Samir',   spec: 'Echocardiography',          specAr: 'تخطيط صدى القلب', sex: 'F' },
    { name: 'Dr. Tarek Fouad',  spec: 'Critical Care Cardiology',  specAr: 'رعاية قلبية حرجة', sex: 'M' },
    { name: 'Dr. Mona Khalil',  spec: 'Emergency Medicine',        specAr: 'طب الطوارئ', sex: 'F' },
    { name: 'Dr. Sherif Nabil', spec: 'Internal Medicine',         specAr: 'باطنة', sex: 'M' },
    { name: 'Dr. Laila Hassan', spec: 'Radiology',                 specAr: 'أشعة', sex: 'F' }
  ],
  contact: {
    emergency: '123',
    phone: '0800-1000-200',
    email: 'info@alamein-hospital.example',
    address: 'New Alamein City, Matrouh — North Coast',
    addressAr: 'مدينة العلمين الجديدة، مطروح — الساحل الشمالي',
    hours: 'Outpatient clinics 9:00–21:00 · Emergency 24/7'
  }
};

/* ============================================================
   STORE — minimal UI state used across dashboards
   (fetched data lives in store.js + per-role module closures)
   ============================================================ */
window.STATE = {
  role: null,            // active dashboard module key
  route: null,           // current screen key for the active role
  lang: 'en',            // 'en' | 'ar'
  selectedSerial: null,  // currently focused patient serial
  selectedTicket: null,  // currently focused visit ticket_no
  notif: null,           // last loaded notifications payload
  notifCount: 0
};

/* ============================================================
   i18n — English first, Arabic-ready (RTL + chrome strings).
   ============================================================ */
window.I18N = {
  en: {
    dir: 'ltr', appTitle: 'Staff Dashboards',
    signin: 'Sign in as', signout: 'Sign out',
    search: 'Search patients by name, serial, national ID…',
    today: 'Today', patients: 'Patients', notifications: 'Notifications'
  },
  ar: {
    dir: 'rtl', appTitle: 'لوحات تحكم الطاقم',
    signin: 'الدخول كـ', signout: 'تسجيل الخروج',
    search: 'ابحث بالاسم أو الرقم التسلسلي أو الرقم القومي…',
    today: 'اليوم', patients: 'المرضى', notifications: 'الإشعارات'
  }
};
window.t = function (key) {
  var dict = window.I18N[window.STATE.lang] || window.I18N.en;
  return dict[key] || window.I18N.en[key] || key;
};
