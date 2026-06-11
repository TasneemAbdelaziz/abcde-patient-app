/* ============================================================
   A.B.C.D.E — Staff Dashboards · nurse.js
   Nursing takes vitals by hand (monitors are not networked —
   FR-5.1), scores deterioration with NEWS2 (FR-5.3) and raises
   early warnings (FR-5.2/5.5), runs the medication administration
   record (FR-6.2/6.3), and the head nurse sets the triage class
   (FR-4.2). The risk score is redone weekly with an RSTP for
   transfers (FR-5.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  /* ---- NEWS2 scoring from manual vitals ---- */
  function score(part, v) {
    if (v == null || v === '' || isNaN(v)) return 0;
    v = Number(v);
    switch (part) {
      case 'rr':   return v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3;
      case 'spo2': return v >= 96 ? 0 : v >= 94 ? 1 : v >= 92 ? 2 : 3;
      case 'temp': return v <= 35 ? 3 : v <= 36 ? 1 : v <= 38 ? 0 : v <= 39 ? 1 : 2;
      case 'sbp':  return v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3;
      case 'pulse':return v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3;
      default: return 0;
    }
  }
  function news2(o) {
    return score('rr', o.rr) + score('spo2', o.spo2) + score('temp', o.temp) +
           score('sbp', o.sbp) + score('pulse', o.pulse);
  }
  function latest(p) { return p.vitals.length ? p.vitals[p.vitals.length - 1] : null; }

  function dueMeds(p) {
    return p.prescriptions.filter(function (rx) { return rx.status === 'due' || rx.status === 'soon'; });
  }

  /* ---- actions ---- */
  window.nurseSaveVitals = function (serial) {
    var p = window.findPatient(serial);
    var get = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var o = {
      pulse: get('v-pulse'), sbp: get('v-sbp'), dbp: get('v-dbp'),
      spo2: get('v-spo2'), temp: get('v-temp'), rr: get('v-rr')
    };
    if (!o.pulse && !o.sbp && !o.spo2) { UI.toast('Enter at least pulse, BP and SpO2', 'warn'); return; }
    var n = news2(o);
    var rec = {
      t: new Date().toTimeString().slice(0, 5),
      pulse: +o.pulse || null, sbp: +o.sbp || null, dbp: +o.dbp || null,
      spo2: +o.spo2 || null, temp: +o.temp || null, rr: +o.rr || null, news2: n
    };
    p.vitals.push(rec);
    var band = window.newsBand(n);
    if (n >= 5) {
      UI.toast('NEWS2 ' + n + ' (' + band.label + ') — early warning raised to the team', 'warn');
    } else {
      UI.toast('Vitals saved · NEWS2 ' + n + ' (' + band.label + ')', 'ok');
    }
    window.render();
  };

  window.nurseTriage = function (serial, cls) {
    var p = window.findPatient(serial);
    p.triage = cls;
    // route on the class (FR-4.2)
    if (cls === 'critical') { p.stage = 'er'; p.department = 'Resuscitation'; }
    else if (cls === 'emergency') { p.stage = 'er'; p.department = 'Emergency'; }
    else { p.stage = 'diagnosis'; p.department = 'Outpatient'; }
    p.stageHistory.push({ stage: p.stage, at: new Date().toTimeString().slice(0, 5), by: 'Head nurse (triage: ' + window.TRIAGE[cls].label + ')' });
    UI.toast(p.name + ' → ' + window.TRIAGE[cls].label + (cls === 'critical' ? ' · skips to Emergency' : ''), cls === 'cold' ? 'ok' : 'warn');
    window.render();
  };

  window.nurseAdminister = function (serial, rxId, status) {
    var p = window.findPatient(serial);
    var rx = p.prescriptions.find(function (x) { return x.id === rxId; });
    if (!rx) return;
    rx.status = status === 'given' ? 'given' : status;
    if (status === 'given') rx.lastGiven = new Date().toTimeString().slice(0, 5);
    var msg = status === 'given' ? 'Given' : status === 'refused' ? 'Recorded as refused' : 'Recorded as unavailable';
    UI.toast(rx.drug + ' · ' + msg, status === 'given' ? 'ok' : 'warn');
    window.render();
  };

  window.nurseRecomputeRisk = function (serial) {
    var p = window.findPatient(serial);
    var l = latest(p);
    var val = l && l.news2 >= 7 ? 'High' : l && l.news2 >= 5 ? 'Medium' : 'Low';
    p.riskScore = { value: val, tool: 'RSTP', updated: new Date().toISOString().slice(0, 10), note: 'Weekly recompute' };
    UI.toast('Risk score recomputed · ' + val + ' (RSTP)', 'ok');
    window.render();
  };

  /* ---- screens ---- */
  function ward() {
    var pts = window.DB.patients.filter(function (p) { return p.stage !== 'arrival'; });
    var deteriorating = pts.filter(function (p) { var l = latest(p); return l && l.news2 >= 5; });
    var medsDue = pts.reduce(function (a, p) { return a + dueMeds(p).length; }, 0);
    var triageWaiting = window.DB.patients.filter(function (p) { return p.stage === 'triage'; }).length;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Patients on unit', value: pts.length, icon: 'users' }) +
      UI.tile({ label: 'Early warnings', value: deteriorating.length, icon: 'alert', accent: deteriorating.length ? 'teal' : '', foot: 'NEWS2 ≥ 5' }) +
      UI.tile({ label: 'Medications due', value: medsDue, icon: 'pill' }) +
      UI.tile({ label: 'Awaiting triage', value: triageWaiting, icon: 'route' }) +
    '</div>';

    var rows = pts.map(function (p) {
      var l = latest(p);
      return '<tr onclick="STATE.selectedSerial=\'' + p.serial + '\';STATE.route=\'vitals\';render()">' +
        '<td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div>' +
          '<div class="t-sub">' + esc(p.department) + ' · ' + esc(p.room) + '</div></div></div></td>' +
        '<td>' + (l ? '<b>' + l.pulse + '</b> <span class="t-sub">bpm</span>' : '—') + '</td>' +
        '<td>' + (l ? '<b>' + l.sbp + '/' + l.dbp + '</b>' : '—') + '</td>' +
        '<td>' + (l ? '<b>' + l.spo2 + '</b><span class="t-sub">%</span>' : '—') + '</td>' +
        '<td>' + (l ? UI.newsBadge(l.news2) : '<span class="muted">no vitals</span>') + '</td>' +
        '<td>' + (p.riskScore ? UI.badge(p.riskScore.value + ' · ' + p.riskScore.tool, p.riskScore.value === 'High' ? 'rose' : p.riskScore.value === 'Medium' ? 'gold' : 'green') : '—') + '</td>' +
      '</tr>';
    }).join('');

    var ewPanel = deteriorating.length ? deteriorating.map(function (p) {
      var l = latest(p);
      var crit = l.news2 >= 7;
      return '<div class="alert-row ' + (crit ? 'crit' : 'warn') + '">' +
        '<div class="ar-ic">' + I('activity') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(p.name) + ' · ' + esc(p.room) + '</div>' +
          '<div class="ar-s">NEWS2 ' + l.news2 + ' · ' + (p.riskScore ? p.riskScore.note || p.riskScore.value : '') + '</div></div>' +
        '<button class="btn ' + (crit ? 'btn-rose' : 'btn-ghost') + ' btn-sm" onclick="STATE.selectedSerial=\'' + p.serial + '\';STATE.route=\'vitals\';render()">Review</button>' +
      '</div>';
    }).join('') : UI.empty('No patients crossing the early-warning threshold', 'check');

    // charts: NEWS2 trend of the most-watched patient + risk distribution
    var watch = deteriorating[0] || pts[0];
    var watchNews = watch ? watch.vitals.map(function (v) { return v.news2; }) : [];
    var riskCount = { High: 0, Medium: 0, Low: 0 };
    pts.forEach(function (p) { if (p.riskScore) riskCount[p.riskScore.value] = (riskCount[p.riskScore.value] || 0) + 1; });

    var charts = '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px" class="mb-2">' +
      '<div class="card"><div class="card-head">' + I('activity') + '<h3>' + esc(watch ? watch.name : 'NEWS2') + ' — NEWS2 trend</h3>' +
        (watch && watchNews.length ? '<span class="ch-act">' + UI.newsBadge(watchNews[watchNews.length - 1]) + '</span>' : '') + '</div>' +
        '<div class="card-pad">' + (watchNews.length ? UI.lineChart([{ values: watchNews, color: '#d96666' }], { labels: watch.vitals.map(function (v) { return v.t; }), h: 168, min: 0, max: 12 }) : UI.empty('No vitals', 'activity')) +
        '<p class="muted mt-1" style="font-size:12.5px">Early warning fires at NEWS2 ≥ 5 — a rising trend is escalated to the team.</p></div></div>' +
      '<div class="card"><div class="card-head"><h3>Risk distribution</h3></div><div class="card-pad">' +
        UI.donut([{ label: 'High', value: riskCount.High, color: '#d96666' }, { label: 'Medium', value: riskCount.Medium, color: '#e0a458' }, { label: 'Low', value: riskCount.Low, color: '#3fa66a' }], { centerLabel: 'on unit' }) +
        '</div></div>' +
    '</div>';

    return UI.pageHead({ eyebrow: 'Nursing · ' + esc(window.STAFF.nurse.name), title: 'Ward overview', sub: 'Vitals, early warning, medication and risk' }) +
      tiles + charts +
      '<div class="grid cols-2"><div class="card span-2"><div class="card-head"><h3>My patients</h3>' +
        '<span class="ch-act muted" style="font-size:12.5px">Tap a row to record vitals</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Pulse</th><th>BP</th><th>SpO2</th><th>NEWS2</th><th>Risk</th></tr></thead><tbody>' + rows + '</tbody></table></div></div></div>' +
      '<div class="card mt-2"><div class="card-head">' + I('alert') + '<h3>Early-warning panel</h3></div><div class="card-pad">' + ewPanel + '</div></div>';
  }

  function triage() {
    var waiting = window.DB.patients.filter(function (p) { return p.stage === 'triage' || p.stage === 'arrival'; });
    if (!waiting.length) {
      return UI.pageHead({ eyebrow: 'Nursing', title: 'Triage', sub: 'Sort each patient: Cold · Emergency · Critical (FR-4.2)' }) +
        '<div class="card card-pad">' + UI.empty('No patients waiting for triage right now', 'check') + '</div>';
    }
    var cards = waiting.map(function (p) {
      var l = latest(p);
      return '<div class="card card-pad mb-2">' +
        '<div class="row-between mb-2">' + UI.patientStrip(p) + UI.triageBadge(p.triage) + '</div>' +
        '<div class="kv mb-2" style="grid-template-columns:auto 1fr auto 1fr">' +
          '<dt>Complaint</dt><dd style="text-align:start">' + esc(p.complaint || '—') + '</dd>' +
          '<dt>Arrival</dt><dd style="text-align:start">' + esc(window.ARRIVAL[p.arrival]) + '</dd>' +
          '<dt>Vitals</dt><dd style="text-align:start">' + (l ? l.pulse + ' bpm · ' + l.sbp + '/' + l.dbp + ' · ' + l.spo2 + '%' : 'not taken') + '</dd>' +
          '<dt>NEWS2</dt><dd style="text-align:start">' + (l ? l.news2 : '—') + '</dd>' +
        '</div>' +
        '<div class="wrap-gap">' +
          '<button class="btn btn-soft btn-sm" onclick="nurseTriage(\'' + p.serial + '\',\'cold\')">Cold — clinic</button>' +
          '<button class="btn btn-sm" style="background:#fbf0dd;color:#a96b1f" onclick="nurseTriage(\'' + p.serial + '\',\'emergency\')">Emergency</button>' +
          '<button class="btn btn-rose btn-sm" onclick="nurseTriage(\'' + p.serial + '\',\'critical\')">Critical — skip to ER</button>' +
        '</div>' +
      '</div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing · Head nurse', title: 'Triage', sub: 'Sort each patient: Cold · Emergency · Critical, then route (FR-4.2)' }) +
      UI.lockNote('Critical (unconscious / accident / life-threatening) skips triage and goes straight to Emergency. Cold during clinic hours goes to the clinic.') +
      '<div class="mt-2">' + cards + '</div>';
  }

  function vitals() {
    var p = window.selectedPatient();
    var l = latest(p);
    var pulses = p.vitals.map(function (v) { return v.pulse; });
    var flag = function (val, key) {
      if (val == null) return '—';
      var t = window.THRESHOLDS[key]; if (!t) return val;
      return (val < t.low || val > t.high) ? '<span style="color:var(--rose);font-weight:700">' + val + '</span>' : '' + val;
    };
    var rows = p.vitals.slice().reverse().map(function (v) {
      return '<tr><td>' + esc(v.t) + '</td><td>' + flag(v.pulse, 'pulse') + '</td><td>' + (v.sbp ? flag(v.sbp, 'sbp') + '/' + v.dbp : '—') + '</td>' +
        '<td>' + flag(v.spo2, 'spo2') + '</td><td>' + flag(v.temp, 'temp') + '</td><td>' + flag(v.rr, 'rr') + '</td>' +
        '<td>' + UI.newsBadge(v.news2) + '</td></tr>';
    }).join('');

    var picker = window.DB.patients.filter(function (x) { return x.stage !== 'arrival'; }).map(function (x) {
      var on = x.serial === p.serial;
      return '<tr onclick="STATE.selectedSerial=\'' + x.serial + '\';render()" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="t-name">' + esc(x.name) + '</div><div class="t-sub">' + esc(x.room) + '</div></td>' +
        '<td>' + (latest(x) ? UI.newsBadge(latest(x).news2) : '<span class="muted">—</span>') + '</td></tr>';
    }).join('');

    // thresholds & observation schedule
    var thRows = ['pulse', 'sbp', 'spo2', 'temp', 'rr'].map(function (key) {
      var t = window.THRESHOLDS[key], val = l ? l[key] : null;
      var out = val != null && (val < t.low || val > t.high);
      return '<tr><td class="t-name">' + esc(t.label) + '</td><td class="muted">' + t.low + '–' + t.high + ' ' + esc(t.unit) + '</td>' +
        '<td>' + (val != null ? (out ? '<span class="badge rose">' + val + ' · out</span>' : '<span class="badge green">' + val + '</span>') : '<span class="muted">—</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Record vitals', sub: 'Typed by hand — monitors are not on the network (FR-5.1)' }) +
      '<div class="grid" style="grid-template-columns:260px 1fr;gap:18px">' +
        '<div class="card" style="align-self:start"><div class="card-head"><h3>Ward</h3></div><div class="table-wrap"><table class="t"><tbody>' + picker + '</tbody></table></div></div>' +
        '<div>' +
          '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(p) + '<span class="ch-act badge teal">Obs ' + esc(window.OBS_FREQ[p.stage] || 'hourly') + '</span></div><div class="card-pad">' +
            '<div class="field-row-3">' +
              '<div class="field"><label>Pulse (bpm)</label><input id="v-pulse" inputmode="numeric" placeholder="e.g. 92" /></div>' +
              '<div class="field"><label>Systolic BP</label><input id="v-sbp" inputmode="numeric" placeholder="e.g. 130" /></div>' +
              '<div class="field"><label>Diastolic BP</label><input id="v-dbp" inputmode="numeric" placeholder="e.g. 84" /></div>' +
            '</div>' +
            '<div class="field-row-3">' +
              '<div class="field"><label>SpO2 (%)</label><input id="v-spo2" inputmode="numeric" placeholder="e.g. 97" /></div>' +
              '<div class="field"><label>Temp (°C)</label><input id="v-temp" inputmode="decimal" placeholder="e.g. 36.8" /></div>' +
              '<div class="field"><label>Resp rate</label><input id="v-rr" inputmode="numeric" placeholder="e.g. 18" /></div>' +
            '</div>' +
            '<div class="row-between mt-1">' +
              '<span class="muted" style="font-size:12.5px">NEWS2 scored automatically · alert at ≥ 5 or any single threshold breach.</span>' +
              '<button class="btn btn-primary" onclick="nurseSaveVitals(\'' + p.serial + '\')">' + I('check') + 'Save vitals</button>' +
            '</div>' +
          '</div></div>' +
          '<div class="grid cols-2 mb-2">' +
            '<div class="card"><div class="card-head">' + I('shield') + '<h3>Thresholds (FR-5.2)</h3></div>' +
              '<div class="table-wrap"><table class="t"><thead><tr><th>Vital</th><th>Range</th><th>Latest</th></tr></thead><tbody>' + thRows + '</tbody></table></div></div>' +
            '<div class="card"><div class="card-head"><h3>Trend</h3>' + (pulses.length ? '<span class="ch-act">' + UI.spark(pulses) + '</span>' : '') + '</div>' +
              '<div class="card-pad"><div class="muted" style="font-size:12.5px">Latest NEWS2</div>' + (l ? '<div style="margin-top:8px">' + UI.newsBadge(l.news2) + '</div>' : '<span class="muted">—</span>') +
              '<div class="divider"></div><div class="muted" style="font-size:12px">Observations are taken <b>' + esc(window.OBS_FREQ[p.stage] || 'hourly') + '</b> at this stage.</div></div></div>' +
          '</div>' +
          '<div class="card"><div class="card-head"><h3>Full trend</h3></div>' +
            (p.vitals.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Time</th><th>Pulse</th><th>BP</th><th>SpO2</th><th>Temp</th><th>RR</th><th>NEWS2</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
              : '<div class="card-pad">' + UI.empty('No vitals recorded yet', 'activity') + '</div>') +
          '</div>' +
        '</div>' +
      '</div>';
  }

  function mar() {
    var pts = window.DB.patients.filter(function (p) { return p.prescriptions.length; });
    var blocks = pts.map(function (p) {
      var rows = p.prescriptions.map(function (rx) {
        var tone = rx.status === 'given' ? 'green' : rx.status === 'due' ? 'rose' : rx.status === 'soon' ? 'gold' :
          rx.status === 'refused' ? 'slate' : rx.status === 'unavailable' ? 'slate' : 'teal';
        var label = rx.status === 'given' ? 'Given ' + (rx.lastGiven || '') : rx.status.charAt(0).toUpperCase() + rx.status.slice(1);
        var actionable = rx.status === 'due' || rx.status === 'soon';
        return '<tr><td><div class="t-name">' + esc(rx.drug) + '</div><div class="t-sub">' + esc(rx.dose) + ' · ' + esc(rx.route) + ' · ' + esc(rx.freq) + '</div></td>' +
          '<td>' + UI.badge(label, tone) + '</td>' +
          '<td>' + (actionable ?
            '<div class="wrap-gap">' +
              '<button class="btn btn-primary btn-sm" onclick="nurseAdminister(\'' + p.serial + '\',\'' + rx.id + '\',\'given\')">' + I('check') + 'Give</button>' +
              '<button class="btn btn-soft btn-sm" onclick="nurseAdminister(\'' + p.serial + '\',\'' + rx.id + '\',\'refused\')">Refused</button>' +
              '<button class="btn btn-soft btn-sm" onclick="nurseAdminister(\'' + p.serial + '\',\'' + rx.id + '\',\'unavailable\')">Unavailable</button>' +
            '</div>' : '<span class="muted">—</span>') + '</td></tr>';
      }).join('');
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(p) + '</div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Medication</th><th>Status</th><th>Action</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Medication administration (MAR)', sub: 'Record given, refused, or unavailable (FR-6.2 / FR-6.3)' }) +
      '<div class="mt-2">' + (blocks || '<div class="card card-pad">' + UI.empty('No active medications', 'pill') + '</div>') + '</div>';
  }

  function risk() {
    var pts = window.DB.patients.filter(function (p) { return p.riskScore; });
    var rows = pts.map(function (p) {
      var l = latest(p);
      return '<tr>' +
        '<td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div><div class="t-sub">' + esc(p.room) + '</div></div></div></td>' +
        '<td>' + UI.badge(p.riskScore.value, p.riskScore.value === 'High' ? 'rose' : p.riskScore.value === 'Medium' ? 'gold' : 'green') + '</td>' +
        '<td>' + esc(p.riskScore.tool) + '</td>' +
        '<td>' + (l ? l.news2 : '—') + '</td>' +
        '<td class="muted">' + esc(p.riskScore.updated) + (p.riskScore.note ? ' · ' + esc(p.riskScore.note) : '') + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="nurseRecomputeRisk(\'' + p.serial + '\')">' + I('activity') + 'Recompute</button></td>' +
      '</tr>';
    }).join('');

    // detailed clinical panels for the selected patient
    var sp = window.selectedPatient();
    if (!sp.riskScore && pts.length) { sp = pts[0]; }
    var c = sp.clinical || {};
    var r = c.rstp, pa = c.padua, ab = c.antibiotics || [];

    var rstpCard = '<div class="card"><div class="card-head">' + I('shield') + '<h3>Transport safety (RSTP) · ' + esc(sp.name) + '</h3></div><div class="card-pad">' +
      (r ? '<dl class="kv"><dt>Staff / method</dt><dd style="text-align:start">' + esc(r.staff + ' · ' + r.method) + '</dd>' +
        '<dt>Risk</dt><dd>' + UI.badge(r.risk, r.risk === 'High' ? 'rose' : r.risk === 'Medium' ? 'gold' : 'green') + '</dd>' +
        '<dt>Hemodynamic</dt><dd style="text-align:start">' + esc(r.hemodynamic) + '</dd>' +
        '<dt>Respiratory</dt><dd style="text-align:start">' + esc(r.respiratory) + '</dd>' +
        '<dt>Neurological</dt><dd style="text-align:start">' + esc(r.neuro) + '</dd>' +
        '<dt>Support</dt><dd style="text-align:start">' + esc(r.support) + '</dd></dl>'
        : '<span class="muted">No RSTP recorded for this patient.</span>') + '</div></div>';

    var paduaCard = '<div class="card"><div class="card-head">' + I('drop') + '<h3>VTE risk · Padua</h3></div><div class="card-pad">' +
      (pa ? '<div class="row-between mb-1"><b>Score ' + pa.score + '</b>' + UI.badge(pa.result, pa.score >= 4 ? 'rose' : 'green') + '</div>' +
        '<ul style="margin:0;padding-inline-start:18px;font-size:13px;color:var(--muted)">' + pa.factors.map(function (f) { return '<li style="padding:2px 0">' + esc(f) + '</li>'; }).join('') + '</ul>'
        : '<span class="muted">Not scored.</span>') + '</div></div>';

    var abxCard = '<div class="card"><div class="card-head">' + I('flask') + '<h3>Daily antibiotics</h3></div>' +
      (ab.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Sample/culture</th><th>Dose · route · duration</th></tr></thead><tbody>' +
        ab.map(function (a) { return '<tr><td class="t-name">' + esc(a.drug) + '</td><td>' + esc(a.sample) + ' · ' + esc(a.culture) + '</td><td>' + esc(a.dose) + ' · ' + esc(a.route) + ' · ' + esc(a.duration) + '</td></tr>'; }).join('') + '</tbody></table></div>'
        : '<div class="card-pad"><span class="muted">No antibiotics charted.</span></div>') + '</div>';

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Risk, RSTP & VTE', sub: 'NEWS2/MEWS now; redone weekly with an RSTP for transfers (FR-5.4) · select a patient for detail' }) +
      UI.lockNote('The RSTP (transport-safety) score travels with the patient between departments and is recomputed weekly. Padua VTE risk drives prophylaxis.') +
      '<div class="card mt-2"><div class="card-head"><h3>Patient risk</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Risk</th><th>Tool</th><th>NEWS2</th><th>Updated</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="grid cols-3 mt-2">' + rstpCard + paduaCard + abxCard + '</div>';
  }

  // SBAR handover + nursing task checklist
  var TASKDONE = {};
  window.nurseTask = function (key) { TASKDONE[key] = !TASKDONE[key]; window.render(); };

  function handover() {
    var pts = window.DB.patients.filter(function (p) { return ['er', 'diagnosis', 'cathprep', 'cath', 'recovery', 'ward'].indexOf(p.stage) > -1; });
    var blocks = pts.map(function (p) {
      var l = latest(p), c = p.clinical || {};
      var tasks = ['Observations ' + (window.OBS_FREQ[p.stage] || 'hourly')];
      dueMeds(p).forEach(function (rx) { tasks.push('Give ' + rx.drug + ' ' + rx.dose + ' ' + rx.route); });
      (c.doctorsOrders || []).filter(function (o) { return /monitor|chart|bed|rest|I\/O|fluid|NPO|escalate/i.test(o); }).forEach(function (o) { tasks.push(o); });
      var done = tasks.filter(function (t, i) { return TASKDONE[p.serial + '-' + i]; }).length;
      var taskEls = tasks.map(function (t, i) {
        var key = p.serial + '-' + i, dn = TASKDONE[key];
        return '<label class="task"><input type="checkbox" ' + (dn ? 'checked' : '') + ' onchange="nurseTask(\'' + key + '\')"/> <span' + (dn ? ' class="done"' : '') + '>' + esc(t) + '</span></label>';
      }).join('');
      var sbar =
        '<div class="sbar"><div class="sbar-row"><b>S</b><div><span class="sbar-k">Situation</span> ' + esc(p.name) + ', ' + esc(window.stageLabel(p.stage)) + ' in ' + esc(p.room) + '. ' + esc(p.complaint || '') + '</div></div>' +
        '<div class="sbar-row"><b>B</b><div><span class="sbar-k">Background</span> ' + esc((c.comorbidities || []).join(', ') || 'see file') + '. Allergies: ' + esc(p.allergies.length ? p.allergies.join(', ') : 'NKDA') + '.</div></div>' +
        '<div class="sbar-row"><b>A</b><div><span class="sbar-k">Assessment</span> ' + (l ? 'HR ' + l.pulse + ', BP ' + l.sbp + '/' + l.dbp + ', SpO₂ ' + l.spo2 + '%, NEWS2 ' + l.news2 : 'no vitals') + (p.riskScore ? ' · ' + p.riskScore.value + ' risk' : '') + '.</div></div>' +
        '<div class="sbar-row"><b>R</b><div><span class="sbar-k">Recommendation</span> ' + esc((c.doctorsOrders || []).slice(0, 2).join('; ') || 'continue plan') + '.</div></div></div>';
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(p) +
        '<span class="ch-act">' + (l ? UI.newsBadge(l.news2) : '') + '</span></div>' +
        '<div class="card-pad"><div class="grid cols-2" style="align-items:start">' +
          '<div>' + sbar + '</div>' +
          '<div><div class="row-between mb-1"><b style="font-size:13px">Nursing tasks</b><span class="badge ' + (done === tasks.length ? 'green' : 'gold') + '">' + done + '/' + tasks.length + '</span></div>' + taskEls + '</div>' +
        '</div></div></div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Shift handover (SBAR)', sub: 'Situation · Background · Assessment · Recommendation — plus the nursing task list' }) +
      '<div class="mt-2">' + (blocks || '<div class="card card-pad">' + UI.empty('No active patients', 'clipboard') + '</div>') + '</div>';
  }

  /* ---- register the role ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.nurse = {
    label: 'Nursing', person: 'Fatma El-Sayed · Head Nurse', icon: 'nurse', accent: 'teal',
    desc: 'Take vitals by hand, score deterioration with NEWS2, raise early warnings, run the medication record, set triage and the risk score.',
    home: 'ward',
    nav: [
      { route: 'ward', label: 'Ward overview', icon: 'activity' },
      { route: 'triage', label: 'Triage', icon: 'route', badge: function () { return window.DB.patients.filter(function (p) { return p.stage === 'triage'; }).length; } },
      { route: 'vitals', label: 'Record vitals', icon: 'heart' },
      { route: 'mar', label: 'Medications (MAR)', icon: 'pill' },
      { route: 'handover', label: 'Handover (SBAR)', icon: 'clipboard' },
      { route: 'risk', label: 'Risk & RSTP', icon: 'shield' }
    ],
    render: function (route) {
      switch (route) {
        case 'triage': return triage();
        case 'vitals': return vitals();
        case 'mar': return mar();
        case 'handover': return handover();
        case 'risk': return risk();
        default: return ward();
      }
    }
  };
})();
