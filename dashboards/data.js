/* ============================================================
   A.B.C.D.E — Staff Dashboards
   data.js — shared mock dataset + tiny store + i18n scaffolding

   This is illustrative prototype data only. No backend.
   The same roster powers Reception, Nurse, and Doctor so the
   three dashboards tell one connected story (the cardiac /
   catheterization journey from the SRS), centred on the hero
   patient Ahmed Al-Rashid (Serial ALM-20413), the same demo
   patient used in the mobile app.
   ============================================================ */

/* ---------- reference lists (from the SRS) ---------- */

// 6.4 journey states — the cardiac/cath spine
window.STAGES = [
  { key: 'arrival',   label: 'Arrival / Reception', owner: 'Receptionist' },
  { key: 'triage',    label: 'Triage',              owner: 'Head nurse' },
  { key: 'er',        label: 'ER exam',             owner: 'ER physician' },
  { key: 'diagnosis', label: 'Specialty / Diagnosis', owner: 'Specialist' },
  { key: 'cathprep',  label: 'Cath prep (cold)',    owner: 'Surgeon, nurse' },
  { key: 'cath',      label: 'Catheterization',     owner: 'Cath-lab team' },
  { key: 'recovery',  label: 'Recovery / ICU',      owner: 'Nurse, physician' },
  { key: 'ward',      label: 'Ward',                owner: 'Nurse, physician' },
  { key: 'discharge', label: 'Discharge',           owner: 'Physician' },
  { key: 'followup',  label: 'Home follow-up',      owner: 'Follow-up unit' }
];

window.stageIndex = function (key) {
  return window.STAGES.findIndex(function (s) { return s.key === key; });
};
window.stageLabel = function (key) {
  var s = window.STAGES.find(function (x) { return x.key === key; });
  return s ? s.label : key;
};

// 6.3 triage classes
window.TRIAGE = {
  cold:      { label: 'Cold',      tone: 'slate', note: 'Not urgent — clinic or planned op' },
  emergency: { label: 'Emergency', tone: 'gold',  note: 'Urgent — Emergency Department' },
  critical:  { label: 'Critical',  tone: 'rose',  note: 'Unconscious / accident / life-threatening — skips triage' }
};

// 6.3 insurance answers (worked out from the national ID)
window.INSURANCE = {
  insured:   { label: 'Insured',                 tone: 'green', flow: 'Carries on normally' },
  employer:  { label: 'Employer-paid',           tone: 'green', flow: 'Carries on normally' },
  selfpay:   { label: 'Uninsured — can pay',     tone: 'gold',  flow: 'Patient pays; carries on normally' },
  unfunded:  { label: 'Uninsured — cannot pay',  tone: 'rose',  flow: 'Three-doctor committee + state-funding memo' }
};

window.ARRIVAL = {
  ambulance: 'Ambulance',
  walkin:    'Walk-in with family',
  outpatient:'Outpatient (cold)',
  transfer:  'Transfer'
};

/* vitals thresholds — alert when crossed (FR-5.2) */
window.THRESHOLDS = {
  pulse: { low: 50, high: 110, unit: 'bpm', label: 'Pulse' },
  sbp:   { low: 100, high: 180, unit: 'mmHg', label: 'Systolic BP' },
  spo2:  { low: 94, high: 100, unit: '%', label: 'SpO₂' },
  temp:  { low: 36.0, high: 38.0, unit: '°C', label: 'Temperature' },
  rr:    { low: 12, high: 20, unit: '/min', label: 'Resp rate' }
};
// how often vitals are taken per stage (FR-5.1 detail)
window.OBS_FREQ = {
  er: 'every 15 min', diagnosis: 'every 30 min', cathprep: 'hourly', cath: 'continuous',
  recovery: 'every 15 min', ward: 'every 4 hours', triage: 'on arrival', arrival: 'on arrival',
  discharge: 'before discharge', followup: 'at visit'
};

/* radiology film category — who gets films (BR-10 / FR-7.7) */
window.FILM_CATEGORY = {
  economic:   { label: 'Economic',           pays: 'Pays full', films: 'Gets films' },
  insurance:  { label: 'Insurance',          pays: 'Discounted', films: 'No films unless paid' },
  contracted: { label: 'Contracted company', pays: 'Set discount', films: 'Pays separately for films' }
};
// map a patient's insurance to a film category
window.filmCategory = function (insurance) {
  if (insurance === 'selfpay' || insurance === 'unfunded') return 'economic';
  if (insurance === 'employer') return 'contracted';
  return 'insurance';
};

/* structured lab & radiology results with reference ranges (FR-7.2) */
window.RESULTS = {
  'ALM-20413': {
    labs: [
      { panel: 'Cardiac markers', at: '09:10', items: [
        { name: 'Troponin I', value: 4.8, unit: 'ng/mL', low: 0, high: 0.04, flag: 'high' },
        { name: 'CK-MB', value: 42, unit: 'U/L', low: 0, high: 25, flag: 'high' },
        { name: 'BNP', value: 380, unit: 'pg/mL', low: 0, high: 100, flag: 'high' }
      ] },
      { panel: 'Full blood count', at: '09:10', items: [
        { name: 'Haemoglobin', value: 13.8, unit: 'g/dL', low: 13, high: 17 },
        { name: 'WBC', value: 11.2, unit: '10⁹/L', low: 4, high: 11, flag: 'high' },
        { name: 'Platelets', value: 240, unit: '10⁹/L', low: 150, high: 400 }
      ] },
      { panel: 'U&E', at: '09:10', items: [
        { name: 'Sodium', value: 139, unit: 'mmol/L', low: 135, high: 145 },
        { name: 'Potassium', value: 4.2, unit: 'mmol/L', low: 3.5, high: 5.1 },
        { name: 'Creatinine', value: 1.0, unit: 'mg/dL', low: 0.7, high: 1.3 }
      ] }
    ],
    radiology: [
      { study: 'Echocardiogram', report: 'Anterior wall hypokinesia, EF 42%. No pericardial effusion. Mild MR.', status: 'final', at: '08:40' },
      { study: 'ECG — 12 lead', report: 'ST elevation V1–V4 with reciprocal change — acute anterior STEMI.', status: 'final', at: '08:25' }
    ]
  },
  'ALM-20399': {
    labs: [
      { panel: 'Inflammatory markers', at: 'Day2 10:05', items: [
        { name: 'CRP', value: 142, unit: 'mg/L', low: 0, high: 5, flag: 'high' },
        { name: 'WBC', value: 16.4, unit: '10⁹/L', low: 4, high: 11, flag: 'high' },
        { name: 'Lactate', value: 2.6, unit: 'mmol/L', low: 0.5, high: 2.0, flag: 'high' }
      ] },
      { panel: 'Blood cultures', at: 'Day2 10:05', items: [
        { name: 'Culture (aerobic)', value: 'Pending', unit: '', low: null, high: null }
      ] }
    ],
    radiology: [
      { study: 'Chest X-ray', report: 'Left basal consolidation — likely hospital-acquired pneumonia.', status: 'final', at: 'Day2 09:00' }
    ]
  }
};
window.resultFlag = function (it) {
  if (it.low == null || typeof it.value !== 'number') return '';
  return (it.value < it.low || it.value > it.high) ? 'high' : '';
};

/* approved education content (FR-14 / S14) */
window.EDUCATION = [
  { title: 'Understanding cardiac catheterization', type: 'Video', mins: 4, topic: 'Procedure', stage: 'cathprep' },
  { title: 'After your stent — recovery at home', type: 'Article', mins: 6, topic: 'Recovery', stage: 'discharge' },
  { title: 'Taking your blood thinners safely', type: 'Video', mins: 3, topic: 'Medication', stage: 'ward' },
  { title: 'Heart-healthy diet basics', type: 'Article', mins: 5, topic: 'Lifestyle', stage: 'followup' },
  { title: 'Warning signs to watch for', type: 'Video', mins: 4, topic: 'Safety', stage: 'discharge' },
  { title: 'Relaxation for waiting families', type: 'Audio', mins: 8, topic: 'Wellbeing', stage: 'any' }
];

/* three-doctor committee (UC-5 / FR-12.2) */
window.COMMITTEE = [
  { name: 'Dr. Hisham Nour', role: 'Hospital Director' },
  { name: 'Dr. Karim Adel', role: 'Cardiology' },
  { name: 'Dr. Sami Rashed', role: 'Internal Medicine' }
];

/* emergency response metrics */
window.RESPONSE = { avgToResponder: '48 s', avgResolve: '6 m', codeBlueMonth: 3, sosMonth: 14, trend: [62, 55, 51, 49, 47, 46] };

/* who-can-view / who-can-edit, by resource (FR-1.7 / FR-1.8 / BR-3/BR-4) */
window.PERMISSIONS = {
  resources: ['Medical file', 'Vitals', 'Medication', 'Diagnosis', 'Admin data', 'Billing', 'Feedback', 'KPIs / reports'],
  rows: [
    { role: 'Doctor',       perms: ['edit', 'edit', 'edit', 'edit', 'view', 'none', 'view', 'none'] },
    { role: 'Nursing sup.', perms: ['view', 'edit', 'edit', 'view', 'view', 'none', 'none', 'none'] },
    { role: 'Nurse',        perms: ['none', 'edit', 'edit', 'none', 'view', 'none', 'none', 'none'] },
    { role: 'Reception',    perms: ['none', 'none', 'none', 'none', 'edit', 'edit', 'none', 'none'] },
    { role: 'Quality',      perms: ['none', 'none', 'none', 'none', 'none', 'none', 'edit', 'view'] },
    { role: 'Director',     perms: ['none', 'none', 'none', 'none', 'view', 'view', 'view', 'view'] },
    { role: 'Family',       perms: ['none', 'none', 'none', 'none', 'none', 'none', 'rate', 'none'] }
  ]
};

/* ---------- NEWS2 helper (severity band for the demo) ---------- */
window.newsBand = function (score) {
  if (score >= 7) return { label: 'High',   tone: 'rose'  };
  if (score >= 5) return { label: 'Medium', tone: 'gold'  };
  if (score >= 1) return { label: 'Low',    tone: 'green' };
  return { label: 'Stable', tone: 'slate' };
};

/* ---------- staff (who is "logged in" per role) ---------- */
window.STAFF = {
  reception: { name: 'Nadia Hassan',     role: 'Receptionist',        sub: 'Emergency reception desk', initials: 'NH' },
  nurse:     { name: 'Fatma El-Sayed',   role: 'Head Nurse',          sub: 'Cardiology & ER',          initials: 'FE' },
  doctor:    { name: 'Dr. Karim Adel',   role: 'Cardiologist',        sub: 'Treating physician',       initials: 'KA' },
  quality:   { name: 'Mervat Gaber',     role: 'Quality Manager',     sub: 'Patient experience & complaints', initials: 'MG' },
  admin:     { name: 'Dr. Hisham Nour',  role: 'Hospital Director',   sub: 'Administration & reporting', initials: 'HN' },
  emergency: { name: 'Amir Zaki',        role: 'Emergency Coordinator', sub: 'Rapid response & escalation', initials: 'AZ' },
  family:    { name: 'Mariam Al-Rashid', role: 'Family companion',    sub: 'Linked to Ahmed Al-Rashid', initials: 'MA' }
};

/* ---------- hospital ---------- */
window.HOSPITAL = {
  name: 'Alamein Model Hospital',
  nameAr: 'مستشفى العلمين النموذجي',
  unit: 'A.B.C.D.E System'
};

/* ---------- public hospital site content (the homepage) ---------- */
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
    { name: 'Dr. Hala Mansour', spec: 'Neurology & Stroke',        specAr: 'مخ وأعصاب', sex: 'F' },
    { name: 'Dr. Tarek Saleh',  spec: 'Neurosurgery',              specAr: 'جراحة المخ', sex: 'M' },
    { name: 'Dr. Mona Fahmy',   spec: 'Pediatrics',                specAr: 'أطفال', sex: 'F' },
    { name: 'Dr. Sami Rashed',  spec: 'Internal Medicine',         specAr: 'باطنة', sex: 'M' },
    { name: 'Dr. Laila Hosny',  spec: 'Radiology',                 specAr: 'أشعة', sex: 'F' }
  ],
  contact: {
    emergency: '123',
    phone: '+20 46 460 0100',
    email: 'info@alameinhospital.gov.eg',
    address: 'New Alamein City, Matrouh — North Coast',
    addressAr: 'مدينة العلمين الجديدة، مطروح — الساحل الشمالي',
    hours: 'Outpatient clinics 9:00–17:00 · Emergency 24/7'
  }
};

/* ============================================================
   PATIENT ROSTER
   ============================================================ */
window.DB = {
  // a running counter for new serials issued at reception
  lastSerial: 20425,
  patients: [

    /* ---- HERO: the cardiac / catheterization case ---- */
    {
      serial: 'ALM-20413',
      nationalId: '2680114201537',
      name: 'Ahmed Al-Rashid',
      nameAr: 'أحمد الراشد',
      sex: 'M', age: 58, dob: '1968-01-14',
      phone: '0100 114 2015',
      address: 'New Alamein City, Matrouh',
      arrival: 'ambulance',
      triage: 'critical',
      insurance: 'insured',
      stage: 'diagnosis',
      complaint: 'Crushing central chest pain, 50 min, radiating to left arm',
      allergies: ['Penicillin'],
      doctor: 'Dr. Karim Adel',
      department: 'Cardiology',
      room: 'CCU-3',
      // door-to-balloon clock (the headline cardiac KPI)
      doorTime: '2026-06-08T08:12',
      balloonTime: null, // not yet — heading to cath
      cardIssued: true,
      vitals: [
        { t: '08:15', pulse: 104, sbp: 148, dbp: 92, spo2: 94, temp: 37.0, rr: 22, news2: 6 },
        { t: '09:00', pulse: 98,  sbp: 138, dbp: 86, spo2: 96, temp: 36.9, rr: 20, news2: 4 },
        { t: '10:00', pulse: 92,  sbp: 132, dbp: 84, spo2: 97, temp: 36.8, rr: 18, news2: 3 }
      ],
      riskScore: { value: 'High', tool: 'RSTP', updated: '2026-06-08', note: 'For transfer to Cath-lab' },
      orders: [
        { id: 'O-3301', type: 'Radiology', test: 'Echocardiogram', dest: 'Radiology (Milestone)', status: 'resulted', result: 'Anterior wall hypokinesia, EF 42%', at: '08:40' },
        { id: 'O-3302', type: 'Diagnostic', test: 'ECG (12-lead)', dest: 'Cardiology', status: 'resulted', result: 'ST elevation V1–V4 — anterior STEMI', at: '08:25' },
        { id: 'O-3303', type: 'Lab', test: 'Troponin I', dest: 'Lab (via DMS)', status: 'resulted', result: '4.8 ng/mL (high)', at: '09:10' },
        { id: 'O-3304', type: 'Lab', test: 'CBC, U&E, Coag', dest: 'Lab (via DMS)', status: 'pending', result: null, at: '09:10' }
      ],
      prescriptions: [
        { id: 'RX-7701', drug: 'Aspirin', dose: '300 mg', route: 'PO', freq: 'STAT then 75 mg OD', status: 'given', lastGiven: '08:30' },
        { id: 'RX-7702', drug: 'Clopidogrel', dose: '600 mg', route: 'PO', freq: 'STAT then 75 mg OD', status: 'given', lastGiven: '08:31' },
        { id: 'RX-7703', drug: 'Heparin', dose: '5000 IU', route: 'IV', freq: 'Bolus', status: 'due', lastGiven: null },
        { id: 'RX-7704', drug: 'Atorvastatin', dose: '80 mg', route: 'PO', freq: 'OD', status: 'soon', lastGiven: null }
      ],
      problems: [
        { code: 'I21.0', label: 'Acute anterior STEMI', at: '2026-06-08' },
        { code: 'I10', label: 'Essential hypertension', at: '2021' }
      ],
      consult: { type: 'Urgent', specialty: 'Interventional Cardiology', detail: 'For primary PCI', status: 'accepted' },
      stageHistory: [
        { stage: 'arrival',   at: '08:12', by: 'Reception' },
        { stage: 'er',        at: '08:14', by: 'ER physician (critical — skipped triage)' },
        { stage: 'diagnosis', at: '08:45', by: 'Cardiology' }
      ],
      // detailed Door-to-Balloon sub-timeline (target ≤ 90 min)
      cardiacTimeline: [
        { label: 'Door — arrival', t: '08:12', done: true },
        { label: 'First medical contact', t: '08:14', done: true },
        { label: 'First ECG', t: '08:25', done: true },
        { label: 'STEMI diagnosis', t: '08:30', done: true },
        { label: 'Cath-lab activated', t: '08:45', done: true },
        { label: 'Balloon inflation', t: null, done: false }
      ],
      // requisition book — what the procedure needs, reserved beforehand (FR-4.5)
      requisition: [
        { item: 'Drug-eluting stent 3.0 × 18 mm', qty: 1, status: 'reserved' },
        { item: 'Guide catheter JL 4.0', qty: 1, status: 'reserved' },
        { item: 'Coronary guidewire 0.014"', qty: 2, status: 'reserved' },
        { item: 'Contrast media (Iohexol) 100 ml', qty: 1, status: 'available' },
        { item: 'Heparin 5000 IU', qty: 2, status: 'available' },
        { item: 'Temporary pacing wire', qty: 1, status: 'to order' }
      ],
      clinical: {
        comorbidities: ['Essential hypertension (I10)', 'Dyslipidemia (E78.5)'],
        habits: 'Ex-smoker (quit 2019, 20 pack-years), no alcohol',
        pastMedical: 'Hypertension since 2021; dyslipidemia',
        pastSurgical: 'Appendectomy (2005)',
        familyHistory: 'Father — myocardial infarction at age 60',
        socialHistory: 'Married, lives in New Alamein, retired teacher',
        systemsReview: 'CVS: crushing chest pain radiating to left arm. Resp: mild exertional dyspnea. GI/GU/CNS: unremarkable.',
        padua: { score: 4, result: 'High VTE risk — prophylaxis indicated', factors: ['Acute MI & reduced mobility (+3)', 'Age > 70 — no', 'Obesity — no', 'Known thrombophilia — no'] },
        rstp: { staff: 'Nurse + porter', method: 'Trolley with portable monitor & O₂', risk: 'High', hemodynamic: 'BP 132/84, HR 92 — stable on support', respiratory: 'SpO₂ 97% on 2 L O₂, RR 18', neuro: 'Alert, GCS 15', support: 'IV access ×2, O₂, cardiac monitor' },
        antibiotics: [],
        carePlan: [
          { problem: 'Acute anterior STEMI', intervention: 'Primary PCI + dual antiplatelet', outcome: 'Reperfusion, preserve LV function', timeframe: 'Immediate' },
          { problem: 'Hypertension', intervention: 'Continue antihypertensives', outcome: 'BP < 140/90', timeframe: 'Ongoing' }
        ],
        nutrition: { assessment: 'No malnutrition (MUST 0)', diet: 'Cardiac diet — low salt, low saturated fat', route: 'Oral', monitoring: 'Daily intake chart' },
        doctorsOrders: ['NPO until after procedure', 'Continuous cardiac monitoring', 'Dual antiplatelet therapy (aspirin + clopidogrel)', 'Hourly vital signs', 'Strict input/output chart', 'Bed rest'],
        audit: { lastEditedBy: 'Dr. Karim Adel', at: '10:02', within15: true }
      }
    },

    /* ---- awake emergency, walk-in with family (UC-2) ---- */
    {
      serial: 'ALM-20418',
      nationalId: '2790233100442',
      name: 'Mona Saleh',
      nameAr: 'منى صالح',
      sex: 'F', age: 47, dob: '1979-02-23',
      phone: '0111 233 1004',
      address: 'Marsa Matrouh',
      arrival: 'walkin',
      triage: 'emergency',
      insurance: 'employer',
      stage: 'triage',
      complaint: 'Chest tightness and shortness of breath, on/off since morning',
      allergies: [],
      doctor: 'Dr. Karim Adel',
      department: 'Emergency',
      room: 'Triage-2',
      doorTime: '2026-06-08T10:05',
      balloonTime: null,
      cardIssued: true,
      vitals: [
        { t: '10:10', pulse: 96, sbp: 142, dbp: 88, spo2: 95, temp: 37.1, rr: 20, news2: 4 }
      ],
      riskScore: { value: 'Medium', tool: 'NEWS2', updated: '2026-06-08', note: '' },
      orders: [
        { id: 'O-3310', type: 'Diagnostic', test: 'ECG (12-lead)', dest: 'Cardiology', status: 'pending', result: null, at: '10:12' }
      ],
      prescriptions: [],
      problems: [],
      consult: null,
      stageHistory: [
        { stage: 'arrival', at: '10:05', by: 'Reception' },
        { stage: 'triage',  at: '10:08', by: 'Head nurse' }
      ]
    },

    /* ---- outpatient cold cardiology follow-up (UC-3) ---- */
    {
      serial: 'ALM-20402',
      nationalId: '2630455900221',
      name: 'Khaled Mansour',
      nameAr: 'خالد منصور',
      sex: 'M', age: 63, dob: '1963-04-05',
      phone: '0122 455 9002',
      address: 'El Dabaa, Matrouh',
      arrival: 'outpatient',
      triage: 'cold',
      insurance: 'insured',
      stage: 'diagnosis',
      complaint: 'Post-catheterization follow-up, mild exertional breathlessness',
      allergies: ['Aspirin (mild rash)'],
      doctor: 'Dr. Karim Adel',
      department: 'Cardiology (Outpatient)',
      room: 'Clinic C-12',
      doorTime: null,
      balloonTime: null,
      cardIssued: true,
      vitals: [
        { t: '11:20', pulse: 74, sbp: 128, dbp: 80, spo2: 98, temp: 36.7, rr: 16, news2: 0 }
      ],
      riskScore: { value: 'Low', tool: 'NEWS2', updated: '2026-06-01', note: '' },
      orders: [
        { id: 'O-3290', type: 'Lab', test: 'Lipid panel, HbA1c', dest: 'Lab (via DMS)', status: 'resulted', result: 'LDL 132, HbA1c 6.4%', at: '2026-06-01' }
      ],
      prescriptions: [
        { id: 'RX-7650', drug: 'Clopidogrel', dose: '75 mg', route: 'PO', freq: 'OD', status: 'active', lastGiven: '—' },
        { id: 'RX-7651', drug: 'Rosuvastatin', dose: '20 mg', route: 'PO', freq: 'OD', status: 'active', lastGiven: '—' }
      ],
      problems: [
        { code: 'I25.1', label: 'Atherosclerotic heart disease (post-PCI)', at: '2026-03' }
      ],
      consult: null,
      stageHistory: [
        { stage: 'arrival',   at: '11:00', by: 'Reception (outpatient)' },
        { stage: 'diagnosis', at: '11:25', by: 'Outpatient cardiology' }
      ]
    },

    /* ---- registering now: outpatient, self-pay (Reception demo) ---- */
    {
      serial: 'ALM-20421',
      nationalId: '2950788400119',
      name: 'Sara Abdullah',
      nameAr: 'سارة عبد الله',
      sex: 'F', age: 31, dob: '1995-07-08',
      phone: '0150 788 4001',
      address: 'New Alamein City',
      arrival: 'outpatient',
      triage: 'cold',
      insurance: 'selfpay',
      stage: 'arrival',
      complaint: 'Palpitations, requesting cardiology clinic appointment',
      allergies: [],
      doctor: null,
      department: 'Reception',
      room: '—',
      doorTime: null,
      balloonTime: null,
      cardIssued: false,
      vitals: [],
      riskScore: null,
      orders: [],
      prescriptions: [],
      problems: [],
      consult: null,
      stageHistory: [
        { stage: 'arrival', at: '11:40', by: 'Reception' }
      ]
    },

    /* ---- ward / recovery, deteriorating — early-warning demo ---- */
    {
      serial: 'ALM-20399',
      nationalId: '2551099200337',
      name: 'Yusuf Ibrahim',
      nameAr: 'يوسف إبراهيم',
      sex: 'M', age: 71, dob: '1955-10-09',
      phone: '0128 109 9200',
      address: 'Sidi Abdel Rahman',
      arrival: 'ambulance',
      triage: 'emergency',
      insurance: 'insured',
      stage: 'ward',
      complaint: 'Day 2 post-PCI, now febrile and tachycardic',
      allergies: [],
      doctor: 'Dr. Karim Adel',
      department: 'Cardiology Ward',
      room: 'Ward B-7',
      doorTime: '2026-06-06T14:30',
      balloonTime: '2026-06-06T15:42',
      cardIssued: true,
      vitals: [
        { t: 'Day1 18:00', pulse: 80,  sbp: 124, dbp: 78, spo2: 97, temp: 36.8, rr: 17, news2: 1 },
        { t: 'Day2 06:00', pulse: 102, sbp: 112, dbp: 70, spo2: 93, temp: 38.2, rr: 22, news2: 7 },
        { t: 'Day2 10:00', pulse: 110, sbp: 106, dbp: 66, spo2: 92, temp: 38.6, rr: 24, news2: 8 }
      ],
      riskScore: { value: 'High', tool: 'NEWS2', updated: '2026-06-08', note: 'Deteriorating — escalate' },
      orders: [
        { id: 'O-3270', type: 'Lab', test: 'Blood cultures, CRP, CBC', dest: 'Lab (via DMS)', status: 'pending', result: null, at: 'Day2 10:05' }
      ],
      prescriptions: [
        { id: 'RX-7600', drug: 'Ceftriaxone', dose: '1 g', route: 'IV', freq: 'BD', status: 'due', lastGiven: 'Day2 06:00' },
        { id: 'RX-7601', drug: 'Paracetamol', dose: '1 g', route: 'IV', freq: 'QDS PRN', status: 'soon', lastGiven: 'Day1 22:00' },
        { id: 'RX-7602', drug: 'Aspirin', dose: '75 mg', route: 'PO', freq: 'OD', status: 'given', lastGiven: 'Day2 08:00' }
      ],
      problems: [
        { code: 'I21.9', label: 'Recent acute MI (PCI Day 0)', at: '2026-06-06' },
        { code: 'A41.9', label: 'Suspected sepsis — under investigation', at: '2026-06-08' }
      ],
      consult: { type: 'Routine', specialty: 'Infectious Diseases', detail: 'Post-op fever workup', status: 'requested' },
      stageHistory: [
        { stage: 'arrival',  at: 'Day0 14:30', by: 'Reception' },
        { stage: 'cath',     at: 'Day0 15:42', by: 'Cath-lab (D2B 72 min)' },
        { stage: 'recovery', at: 'Day0 17:00', by: 'CCU' },
        { stage: 'ward',     at: 'Day1 09:00', by: 'Cardiology ward' }
      ],
      clinical: {
        comorbidities: ['Recent MI (PCI Day 0)', 'Type 2 diabetes'],
        habits: 'Non-smoker', pastMedical: 'Type 2 diabetes (10 yrs)', pastSurgical: 'None',
        familyHistory: 'Non-contributory', socialHistory: 'Lives with family, Sidi Abdel Rahman',
        systemsReview: 'Febrile, tachycardic. CVS: post-PCI, stable graft. Resp: mild crackles left base.',
        padua: { score: 5, result: 'High VTE risk — prophylaxis indicated', factors: ['Acute infection/inflammation (+1)', 'Reduced mobility (+3)', 'Age ≥ 70 (+1)'] },
        rstp: { staff: 'Nurse', method: 'Wheelchair with monitor', risk: 'Medium', hemodynamic: 'BP 106/66, HR 110 — borderline', respiratory: 'SpO₂ 92% on air, RR 24', neuro: 'Alert, GCS 15', support: 'IV antibiotics, O₂ standby' },
        antibiotics: [
          { sample: 'Blood ×2', culture: 'Pending', date: 'Day2 10:05', reason: 'Post-op fever, suspected sepsis', drug: 'Ceftriaxone', dose: '1 g', route: 'IV', duration: '7 days', notes: 'Review with cultures' }
        ],
        carePlan: [
          { problem: 'Suspected sepsis (post-op fever)', intervention: 'IV antibiotics, cultures, fluids', outcome: 'Source control, defervescence', timeframe: '48–72 h' }
        ],
        nutrition: { assessment: 'Mild risk (MUST 1)', diet: 'Diabetic diet', route: 'Oral', monitoring: 'BM 4×/day' },
        doctorsOrders: ['IV Ceftriaxone 1 g BD', 'Blood cultures + CRP', '4-hourly vitals — escalate if NEWS2 ≥ 5', 'Fluid balance chart', 'Diabetic diet'],
        audit: { lastEditedBy: 'Fatma El-Sayed', at: '10:05', within15: true }
      }
    },

    /* ---- critical, arrest, uninsured-unable — committee + admit-now ---- */
    {
      serial: 'ALM-20425',
      nationalId: '2710366700558',
      name: 'Omar Farouk',
      nameAr: 'عمر فاروق',
      sex: 'M', age: 55, dob: '1971-03-06',
      phone: '—',
      address: 'Unknown (brought in by ambulance)',
      arrival: 'ambulance',
      triage: 'critical',
      insurance: 'unfunded',
      stage: 'er',
      complaint: 'Cardiac arrest pre-hospital, ROSC achieved, unidentified on arrival',
      allergies: [],
      doctor: 'Dr. Karim Adel',
      department: 'Resuscitation',
      room: 'Resus-1',
      doorTime: '2026-06-08T11:48',
      balloonTime: null,
      cardIssued: true,
      committee: { status: 'pending', memo: false, reason: 'Uninsured & cannot pay — life-threatening, admitted at once' },
      vitals: [
        { t: '11:52', pulse: 124, sbp: 92, dbp: 60, spo2: 90, temp: 36.4, rr: 26, news2: 9 }
      ],
      riskScore: { value: 'High', tool: 'RSTP', updated: '2026-06-08', note: 'Critical' },
      orders: [
        { id: 'O-3320', type: 'Diagnostic', test: 'ECG (12-lead)', dest: 'Cardiology', status: 'pending', result: null, at: '11:53' }
      ],
      prescriptions: [],
      problems: [
        { code: 'I46.9', label: 'Cardiac arrest, cause unknown', at: '2026-06-08' }
      ],
      consult: null,
      stageHistory: [
        { stage: 'arrival', at: '11:48', by: 'Reception (admit-now, money later)' },
        { stage: 'er',      at: '11:49', by: 'Resuscitation (critical)' }
      ]
    }
  ],

  /* ---------- appointment requests (Reception queue) ---------- */
  appointments: [
    { id: 'AP-501', name: 'Layla Hosny',  phone: '0106 220 1190', dept: 'Cardiology', complaint: 'Chest pain on exertion', pref: '2026-06-10 09:00', status: 'pending', source: 'Mobile app' },
    { id: 'AP-502', name: 'Tarek Selim',  phone: '0114 980 7765', dept: 'Cardiology', complaint: 'Follow-up after stent',   pref: '2026-06-10 10:30', status: 'pending', source: 'Public website' },
    { id: 'AP-503', name: 'Hana Mostafa', phone: '0127 543 8890', dept: 'Internal Medicine', complaint: 'Hypertension review', pref: '2026-06-11 11:00', status: 'confirmed', source: 'Mobile app' }
  ],

  /* ---------- stage feedback (FR-13.1) — rating 1..5 + optional note ---------- */
  feedback: [
    { id: 'FB-901', serial: 'ALM-20413', patient: 'Ahmed Al-Rashid', stage: 'er',        dept: 'Emergency',  rating: 5, note: 'Seen immediately, the team was reassuring.', at: '08:50', sentiment: 'positive' },
    { id: 'FB-902', serial: 'ALM-20413', patient: 'Ahmed Al-Rashid', stage: 'diagnosis', dept: 'Cardiology', rating: 4, note: 'Clear explanation of the procedure.', at: '09:30', sentiment: 'positive' },
    { id: 'FB-903', serial: 'ALM-20418', patient: 'Mona Saleh',      stage: 'triage',    dept: 'Emergency',  rating: 2, note: 'Waited a long time before triage.', at: '10:40', sentiment: 'negative' },
    { id: 'FB-904', serial: 'ALM-20402', patient: 'Khaled Mansour',  stage: 'diagnosis', dept: 'Cardiology (Outpatient)', rating: 5, note: 'Doctor was thorough.', at: '11:35', sentiment: 'positive' },
    { id: 'FB-905', serial: 'ALM-20399', patient: 'Yusuf Ibrahim',   stage: 'ward',      dept: 'Cardiology Ward', rating: 3, note: 'Room was comfortable but call bell was slow.', at: 'Day1 20:00', sentiment: 'neutral' },
    { id: 'FB-906', serial: 'ALM-20399', patient: 'Yusuf Ibrahim',   stage: 'recovery',  dept: 'CCU',        rating: 2, note: 'Felt I waited too long for pain relief.', at: 'Day1 02:00', sentiment: 'negative' },
    { id: 'FB-907', serial: 'ALM-20402', patient: 'Khaled Mansour',  stage: 'arrival',   dept: 'Reception',  rating: 4, note: 'Registration was quick.', at: '11:05', sentiment: 'positive' }
  ],

  /* ---------- complaints (FR-13.2/13.3/13.4) — numbered tickets, SLA + escalation ---------- */
  complaints: [
    { id: 'CMP-2210', serial: 'ALM-20418', patient: 'Mona Saleh',    dept: 'Emergency',       stage: 'triage',  text: 'Long wait before being triaged in the ER.', opened: '10:42', sla: '48h', status: 'open',      hoursLeft: 41, sentiment: 'negative', assignee: 'Emergency dept head' },
    { id: 'CMP-2208', serial: 'ALM-20399', patient: 'Yusuf Ibrahim', dept: 'CCU',             stage: 'recovery', text: 'Delay in receiving pain relief after the procedure.', opened: 'Day1 02:10', sla: '48h', status: 'due-soon', hoursLeft: 5, sentiment: 'negative', assignee: 'CCU supervisor' },
    { id: 'CMP-2205', serial: 'ALM-20399', patient: 'Yusuf Ibrahim', dept: 'Cardiology Ward', stage: 'ward',     text: 'Call bell response was slow overnight.', opened: 'Day1 21:00', sla: '48h', status: 'escalated', hoursLeft: -3, sentiment: 'negative', assignee: 'Director (escalated)' },
    { id: 'CMP-2201', serial: 'ALM-20402', patient: 'Khaled Mansour', dept: 'Pharmacy',       stage: 'diagnosis', text: 'Medication was out of stock, had to come back.', opened: '2026-06-01', sla: '48h', status: 'responded', hoursLeft: 0, sentiment: 'negative', assignee: 'Pharmacy lead' }
  ],

  /* ---------- live emergencies (UC-6 / FR-10.x) — ordered escalation chain ---------- */
  emergencies: [
    {
      id: 'SOS-77', serial: 'ALM-20399', patient: 'Yusuf Ibrahim', room: 'Ward B-7',
      type: 'SOS', kind: 'real', triggeredBy: 'Family (tap)', started: '10:58', elapsed: '4m 20s', status: 'active', step: 1,
      chain: [
        { order: 0, role: 'Treating physician', who: 'Dr. Karim Adel',  status: 'no-answer', at: '10:58', wait: '60s' },
        { order: 1, role: 'Nursing station',    who: 'Ward B station',   status: 'alerted',   at: '10:59', wait: '60s' },
        { order: 2, role: 'Family contact',      who: 'Mariam Al-Rashid', status: 'pending',   at: null,    wait: '90s' },
        { order: 3, role: 'Care center',         who: 'Rapid response',   status: 'pending',   at: null,    wait: '—' }
      ]
    },
    {
      id: 'CB-12', serial: 'ALM-20425', patient: 'Omar Farouk', room: 'Resus-1',
      type: 'Code Blue', kind: 'real', triggeredBy: 'Staff', started: '11:50', elapsed: '—', status: 'active', step: 0,
      chain: [
        { order: 0, role: 'Treating physician', who: 'Dr. Karim Adel',  status: 'answered',  at: '11:50', wait: '—' },
        { order: 1, role: 'Nursing station',    who: 'Resus team',       status: 'answered',  at: '11:50', wait: '—' },
        { order: 2, role: 'Family contact',      who: 'Not identified',   status: 'na',        at: null,    wait: '—' },
        { order: 3, role: 'Care center',         who: 'ICU on standby',   status: 'alerted',   at: '11:51', wait: '—' }
      ]
    },
    {
      id: 'SOS-76', serial: 'ALM-20418', patient: 'Mona Saleh', room: 'Triage-2',
      type: 'SOS', kind: 'heads-up', triggeredBy: 'Patient (voice)', started: '10:20', elapsed: 'resolved', status: 'resolved', step: 0,
      chain: [
        { order: 0, role: 'Treating physician', who: 'Dr. Karim Adel',  status: 'answered', at: '10:20', wait: '—' }
      ]
    }
  ],

  /* ---------- user accounts (FR-15.1, admin) ---------- */
  users: [
    { id: 'U-01', name: 'Nadia Hassan',     role: 'Receptionist',     dept: 'Reception',  status: 'active',  last: '2 min ago' },
    { id: 'U-02', name: 'Fatma El-Sayed',   role: 'Head Nurse',       dept: 'Cardiology', status: 'active',  last: 'now' },
    { id: 'U-03', name: 'Dr. Karim Adel',   role: 'Doctor',           dept: 'Cardiology', status: 'active',  last: '5 min ago' },
    { id: 'U-04', name: 'Mervat Gaber',     role: 'Quality Manager',  dept: 'Quality',    status: 'active',  last: '1 h ago' },
    { id: 'U-05', name: 'Dr. Hisham Nour',  role: 'Hospital Director', dept: 'Administration', status: 'active', last: 'now' },
    { id: 'U-06', name: 'Amir Zaki',        role: 'Emergency Coord.', dept: 'Emergency',  status: 'active',  last: '3 min ago' },
    { id: 'U-07', name: 'Sami Rashed',      role: 'Doctor',           dept: 'Internal Medicine', status: 'pending', last: '—' },
    { id: 'U-08', name: 'Hoda Kamal',       role: 'Nurse',            dept: 'Cardiology Ward', status: 'disabled', last: '8 d ago' }
  ],

  /* ---------- integration status (FR-15.4/15.5/15.6) ---------- */
  integration: [
    { system: 'DMS (main HMIS)', vendor: 'CMIS / MRM 5.2', link: 'Bought APIs pending', state: 'dummy', note: 'Registration, appointments, record, clinical notes, admin — working off dummy-data API docs.' },
    { system: 'Lab',             vendor: 'via DMS',          link: 'Through DMS',          state: 'dummy', note: 'Lab orders and results read through DMS.' },
    { system: 'Radiology',       vendor: 'Milestone (to confirm)', link: 'Separate system', state: 'pending', note: 'Own interface for orders, reports, images; respects film category.' },
    { system: 'Pharmacy',        vendor: 'via DMS, half-manual', link: 'Partly manual',    state: 'partial', note: 'Read prescriptions and dispensing now; live stock and alternatives later.' }
  ],

  /* ---------- KPI series for the director board (FR-15.2) ---------- */
  kpis: {
    monthlyD2B: [ { m: 'Jan', v: 82 }, { m: 'Feb', v: 78 }, { m: 'Mar', v: 74 }, { m: 'Apr', v: 71 }, { m: 'May', v: 70 }, { m: 'Jun', v: 68 } ],
    deptComparison: [
      { dept: 'Cardiology', patients: 64, avgStage: 38, satisfaction: 4.4 },
      { dept: 'Emergency',  patients: 91, avgStage: 52, satisfaction: 3.8 },
      { dept: 'Internal Medicine', patients: 47, avgStage: 41, satisfaction: 4.1 },
      { dept: 'Outpatient', patients: 120, avgStage: 26, satisfaction: 4.3 }
    ],
    avgStageTimes: [
      { stage: 'Arrival / Reception', mins: 12 }, { stage: 'Triage', mins: 9 },
      { stage: 'ER exam', mins: 24 }, { stage: 'Diagnosis', mins: 36 },
      { stage: 'Cath prep', mins: 48 }, { stage: 'Catheterization', mins: 41 }
    ]
  },

  /* ---------- AI models (S8/S9 + risk) — the assistants powering the platform ---------- */
  aiModels: [
    { id: 'ai-advisor',   name: 'Smart Healthcare Assistant', engine: 'RAG · hospital-approved content', purpose: 'Answers after-care, medication and procedure questions; sorts symptoms by urgency and flags red flags (does not diagnose).', fr: 'FR-8.x', status: 'live', calls: 1284, accuracy: 96, latency: '0.8s', icon: 'sparkle' },
    { id: 'ai-risk',      name: 'Deterioration Risk (NEWS2/MEWS)', engine: 'NEWS2 / MEWS scoring', purpose: 'Scores deterioration from manual vitals and warns the team before a patient slides.', fr: 'FR-5.3', status: 'live', calls: 642, accuracy: 94, latency: '0.1s', icon: 'activity' },
    { id: 'ai-report',    name: 'Clinical Report Generation', engine: 'LLM draft + doctor approval', purpose: 'Drafts visit summaries, progress notes and discharge summaries — nothing is saved until a doctor approves.', fr: 'FR-9.1', status: 'live', calls: 318, accuracy: 92, latency: '2.1s', icon: 'file' },
    { id: 'ai-voice',     name: 'Voice Transcription', engine: 'Whisper (AR/EN)', purpose: 'Turns dictated clinical notes into text in Arabic and English.', fr: 'FR-9.2', status: 'beta', calls: 156, accuracy: 90, latency: '1.4s', icon: 'stethoscope' },
    { id: 'ai-translate', name: 'Medical Translation', engine: 'Neural MT (AR↔EN)', purpose: 'Translates instructions and conversations for foreign patients.', fr: 'FR-9.3', status: 'beta', calls: 203, accuracy: 93, latency: '0.6s', icon: 'globe' },
    { id: 'ai-sentiment', name: 'Feedback Sentiment & Themes', engine: 'NLP sentiment + clustering', purpose: 'Reads patient feedback, groups complaints into themes, and writes the monthly summary.', fr: 'FR-9.4', status: 'live', calls: 472, accuracy: 91, latency: '0.5s', icon: 'heart' }
  ],
  aiUsage: { week: [42, 58, 51, 73, 66, 88, 95], byModel: [ { label: 'Advisor', value: 1284 }, { label: 'Risk', value: 642 }, { label: 'Sentiment', value: 472 }, { label: 'Reports', value: 318 }, { label: 'Translate', value: 203 }, { label: 'Voice', value: 156 } ] },

  /* ---------- audit trail (NFR-11) — every view/edit logged; 15-min self-edit window ---------- */
  auditLog: [
    { at: '10:02', user: 'Dr. Karim Adel',   role: 'Doctor',       action: 'edit', what: 'Problem list — added STEMI', target: 'ALM-20413', window: 'within 15 min' },
    { at: '10:05', user: 'Fatma El-Sayed',   role: 'Head Nurse',   action: 'edit', what: 'Recorded vitals (NEWS2 8)', target: 'ALM-20399', window: 'within 15 min' },
    { at: '09:58', user: 'Dr. Karim Adel',   role: 'Doctor',       action: 'view', what: 'Opened medical file', target: 'ALM-20402', window: '—' },
    { at: '09:45', user: 'Nadia Hassan',     role: 'Receptionist', action: 'edit', what: 'Issued arrival & booking cards', target: 'ALM-20421', window: 'within 15 min' },
    { at: '09:30', user: 'System',           role: 'System',       action: 'lock', what: 'Edit window expired — record locked to sys-admin', target: 'ALM-20413', window: 'expired' },
    { at: '09:12', user: 'Mervat Gaber',     role: 'Quality Mgr',  action: 'view', what: 'Reviewed complaint CMP-2208', target: '—', window: '—' },
    { at: '08:50', user: 'Dr. Karim Adel',   role: 'Doctor',       action: 'edit', what: 'Prescribed Aspirin 300 mg', target: 'ALM-20413', window: 'within 15 min' },
    { at: '08:25', user: 'Reception',        role: 'Receptionist', action: 'create', what: 'Registered patient + Serial', target: 'ALM-20425', window: 'within 15 min' }
  ],

  /* ---------- family / caregiver link (FR-11.x) — ONE companion per patient ---------- */
  familyLink: {
    companion: { name: 'Mariam Al-Rashid', relation: 'Daughter', initials: 'MA' },
    patientSerial: 'ALM-20413',
    active: true,
    permissions: { status: true, alerts: true, book: true, rate: true, sos: true },
    consentPending: { item: 'Cardiac catheterization (primary PCI)', askedAt: '08:46' }
  }
};

/* ============================================================
   STORE — minimal state + helpers used across dashboards
   ============================================================ */
window.STATE = {
  role: null,        // 'reception' | 'nurse' | 'doctor'
  route: null,       // current screen key for the active role
  lang: 'en',        // 'en' | 'ar'
  selectedSerial: 'ALM-20413'
};

window.findPatient = function (serial) {
  return window.DB.patients.find(function (p) { return p.serial === serial; });
};

window.selectedPatient = function () {
  return window.findPatient(window.STATE.selectedSerial) || window.DB.patients[0];
};

// door-to-balloon in minutes (string) when both stamps exist
window.doorToBalloon = function (p) {
  if (!p.doorTime || !p.balloonTime) return null;
  var diff = (new Date(p.balloonTime) - new Date(p.doorTime)) / 60000;
  return Math.round(diff);
};

/* ============================================================
   i18n — English first, Arabic-ready (RTL + chrome strings).
   Full clinical-field translation is a later pass; this covers
   the shell + common terms so the language toggle is real.
   ============================================================ */
window.I18N = {
  en: {
    dir: 'ltr',
    appTitle: 'Staff Dashboards',
    login_title: 'Staff Dashboards',
    login_sub: 'Choose your role to sign in',
    login_note: 'Prototype — illustrative data. Access is gated per role (FR-1.7 / FR-1.8).',
    signin: 'Sign in as',
    signout: 'Sign out',
    search: 'Search patients, serial, national ID…',
    today: 'Today',
    patients: 'Patients',
    notifications: 'Notifications'
  },
  ar: {
    dir: 'rtl',
    appTitle: 'لوحات تحكم الطاقم',
    login_title: 'لوحات تحكم الطاقم',
    login_sub: 'اختر دورك لتسجيل الدخول',
    login_note: 'نموذج أولي — بيانات توضيحية. الوصول محكوم حسب الدور (FR-1.7 / FR-1.8).',
    signin: 'الدخول كـ',
    signout: 'تسجيل الخروج',
    search: 'ابحث بالاسم أو الرقم التسلسلي أو الرقم القومي…',
    today: 'اليوم',
    patients: 'المرضى',
    notifications: 'الإشعارات'
  }
};

window.t = function (key) {
  var dict = window.I18N[window.STATE.lang] || window.I18N.en;
  return dict[key] || window.I18N.en[key] || key;
};
