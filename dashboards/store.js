/* ============================================================
   A.B.C.D.E — Staff Dashboards · store.js
   The bridge between the API and the UI: it normalizes backend
   shapes into the shapes the render functions expect, holds the
   signed-in identity, and provides small cached lookups
   (departments, doctors, pharmacy) shared by several roles.

   Role modules keep their own fetched data in closures; STORE is
   only the shared vocabulary + helpers + caches.
   ============================================================ */

window.STORE = (function () {

  var me = null;        // /auth/me payload
  var cache = {};       // { key: { at: ms, val } }

  /* ---------- reference label maps (match backend enums) ---------- */
  var TRIAGE = {
    cold:      { label: 'Cold',      tone: 'slate', note: 'Not urgent — clinic or planned procedure' },
    emergency: { label: 'Emergency', tone: 'gold',  note: 'Urgent — Emergency Department' },
    critical:  { label: 'Critical',  tone: 'rose',  note: 'Life-threatening — skips triage' }
  };
  // coverage_category: insured, employer_paid, uninsured_able, uninsured_unable, state, pension, student
  var INSURANCE = {
    insured:          { label: 'Insured',        tone: 'green', flow: 'Covered — carries on normally' },
    employer_paid:    { label: 'Employer-paid',  tone: 'green', flow: 'Covered by employer' },
    uninsured_able:   { label: 'Self-pay',       tone: 'gold',  flow: 'Patient pays; carries on normally' },
    uninsured_unable: { label: 'Unfunded',       tone: 'rose',  flow: 'Three-doctor committee + state-funding memo' },
    state:            { label: 'State-funded',   tone: 'green', flow: 'State coverage' },
    pension:          { label: 'Pension',        tone: 'green', flow: 'Pension scheme' },
    student:          { label: 'Student',        tone: 'teal',  flow: 'Student scheme' }
  };
  var ARRIVAL = {
    emergency: 'Emergency', scheduled: 'Scheduled', cold: 'Outpatient (cold)', referred: 'Referral / transfer',
    // legacy tokens kept for safety
    ambulance: 'Ambulance', walkin: 'Walk-in', outpatient: 'Outpatient', transfer: 'Transfer'
  };
  // appointment + complaint statuses → badge tone
  var STATUS_TONE = {
    pending: 'gold', approved: 'green', confirmed: 'green', declined: 'rose', cancelled: 'slate', completed: 'teal',
    open: 'gold', responded: 'teal', escalated: 'rose', closed: 'slate',
    resulted: 'green', in_progress: 'gold', requested: 'gold', given: 'green', active: 'green'
  };

  function titleCase(s) {
    return String(s || '').replace(/_/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }
  function triageInfo(k) { return TRIAGE[k] || { label: titleCase(k) || '—', tone: 'slate', note: '' }; }
  function insuranceInfo(k) { return INSURANCE[k] || { label: titleCase(k) || 'Unknown', tone: 'slate', flow: '' }; }
  function arrivalLabel(k) { return ARRIVAL[k] || titleCase(k) || '—'; }
  function statusTone(s) { return STATUS_TONE[s] || 'slate'; }

  /* ---------- formatting helpers ---------- */
  function parseDate(s) {
    if (!s) return null;
    // backend: "2026-06-08 08:20:00" (treat as local) or ISO "...Z"
    var d = new Date(/\dZ?$/.test(s) && s.indexOf('T') > -1 ? s : String(s).replace(' ', 'T'));
    return isNaN(d.getTime()) ? null : d;
  }
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function fmtTime(s) { var d = parseDate(s); return d ? pad(d.getHours()) + ':' + pad(d.getMinutes()) : '—'; }
  function fmtDate(s) { var d = parseDate(s); return d ? d.getDate() + ' ' + MON[d.getMonth()] : '—'; }
  function fmtDateTime(s) { var d = parseDate(s); return d ? d.getDate() + ' ' + MON[d.getMonth()] + ' · ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) : '—'; }
  function ago(s) {
    var d = parseDate(s); if (!d) return '—';
    var sec = Math.round((Date.now() - d.getTime()) / 1000);
    if (sec < 60) return sec + 's ago';
    if (sec < 3600) return Math.round(sec / 60) + 'm ago';
    if (sec < 86400) return Math.round(sec / 3600) + 'h ago';
    return Math.round(sec / 86400) + 'd ago';
  }
  function money(n) {
    var v = Number(n || 0);
    return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }
  function initials(name) {
    return String(name || '?').replace(/^Dr\.?\s*/i, '').trim().split(/\s+/)
      .map(function (w) { return w[0] || ''; }).slice(0, 2).join('').toUpperCase() || '?';
  }
  function sexOf(g) { return (g === 'F' || g === 'female' || g === 'f') ? 'F' : 'M'; }

  /* ---------- normalizers (backend → UI) ---------- */
  // A patient record (from /patients or /patients/{serial})
  function patient(p) {
    if (!p) return null;
    var ins = p.insurance || null;
    return {
      serial: p.patient_serial, nationalId: p.national_id, name: p.full_name,
      sex: sexOf(p.gender), age: p.age, dob: p.date_of_birth, phone: p.phone,
      address: p.city_district, lang: p.preferred_language, decisionMaker: p.decision_maker,
      chronic: p.chronic_conditions, carePoints: p.care_points,
      insuranceCat: ins ? ins.coverage_category : null, insurance: ins,
      companion: p.companion || null,
      department: '—', room: '—',           // filled when joined to a visit
      raw: p
    };
  }

  // A visit (from /visits or /visits/{ticket}) — the staff "case" row.
  function visit(v) {
    if (!v) return null;
    var pt = v.patient || {};
    var loc = v.location || null;
    var deptName = (v.department && v.department.department_name) || v.dept_code || '—';
    return {
      ticket: v.ticket_no, serial: v.patient_serial || pt.patient_serial,
      name: pt.full_name || v.patient_serial, sex: sexOf(pt.gender), age: pt.age,
      nationalId: pt.national_id, phone: pt.phone,
      arrival: v.arrival_type, triage: v.triage_classification, stage: v.current_stage,
      deptCode: v.dept_code, dept: deptName, department: deptName,
      doctorId: v.treating_doctor_id, doctor: (v.doctor && v.doctor.full_name) || null,
      locationCode: v.location_code,
      room: (loc && (loc.location_name || loc.name)) || v.location_code || '—',
      door: v.door_time, balloon: v.balloon_time, d2b: v.door_to_balloon_minutes,
      cathType: v.catheterization_type, status: v.visit_status,
      patient: pt, raw: v
    };
  }

  // A vitals row (from /visits/{ticket}/vitals)
  function vital(x) {
    if (!x) return null;
    return {
      id: x.id, taken_at: x.taken_at, t: fmtTime(x.taken_at),
      sbp: x.systolic_bp, dbp: x.diastolic_bp, pulse: x.pulse, rr: x.respiratory_rate,
      spo2: x.spo2, temp: x.temperature != null ? Number(x.temperature) : null,
      pain: x.pain_score, avpu: x.consciousness_avpu,
      news2: x.news2_score, risk: x.risk_level, nurse: x.nurse_id, raw: x
    };
  }
  function vitals(arr) { return (arr || []).map(vital).sort(function (a, b) {
    return (parseDate(a.taken_at) || 0) - (parseDate(b.taken_at) || 0); }); }

  // NEWS2 band for a numeric score (UI tone)
  function newsBand(score) {
    if (score == null) return { label: 'Not scored', tone: 'slate' };
    if (score >= 7) return { label: 'High', tone: 'rose' };
    if (score >= 5) return { label: 'Medium', tone: 'gold' };
    if (score >= 1) return { label: 'Low', tone: 'green' };
    return { label: 'Stable', tone: 'slate' };
  }
  function riskTone(level) {
    var k = String(level || '').toLowerCase();
    if (k.indexOf('high') > -1) return 'rose';
    if (k.indexOf('medium') > -1 || k.indexOf('mod') > -1) return 'gold';
    if (k.indexOf('low') > -1) return 'green';
    return 'slate';
  }

  /* ---------- cached shared lookups (TTL) ---------- */
  function cached(key, ttlMs, fn) {
    var c = cache[key];
    if (c && (Date.now() - c.at) < ttlMs) return Promise.resolve(c.val);
    return fn().then(function (val) { cache[key] = { at: Date.now(), val: val }; return val; });
  }
  function departments() { return cached('depts', 300000, function () { return API.pub.departments(); }); }
  function doctors() { return cached('docs', 300000, function () { return API.pub.doctors(); }); }
  function pharmacy() { return cached('pharm', 120000, function () { return API.meds.pharmacy(); }); }
  function invalidate(key) { if (key) delete cache[key]; else cache = {}; }

  return {
    // identity
    setMe: function (m) { me = m; }, me: function () { return me; },
    role: function () { return me ? me.role : (API.user() && API.user().role) || null; },
    staffId: function () { return me && me.staff ? me.staff.staff_id : (API.user() && API.user().staff_id) || null; },
    // vocab
    TRIAGE: TRIAGE, INSURANCE: INSURANCE, ARRIVAL: ARRIVAL,
    triageInfo: triageInfo, insuranceInfo: insuranceInfo, arrivalLabel: arrivalLabel,
    statusTone: statusTone, titleCase: titleCase,
    // format
    fmtTime: fmtTime, fmtDate: fmtDate, fmtDateTime: fmtDateTime, ago: ago, money: money,
    initials: initials, sexOf: sexOf, parseDate: parseDate,
    // normalizers
    patient: patient, visit: visit, vital: vital, vitals: vitals,
    newsBand: newsBand, riskTone: riskTone,
    // shared lookups
    departments: departments, doctors: doctors, pharmacy: pharmacy, invalidate: invalidate
  };
})();
