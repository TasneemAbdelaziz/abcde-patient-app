/* ============================================================
   A.B.C.D.E — Staff Dashboards · nurse.js  (LIVE API)
   Nursing takes vitals by hand (FR-5.1), NEWS2 deterioration
   scoring (FR-5.3) with early warnings (FR-5.2), the medication
   administration record (FR-6.2/6.3), head-nurse triage (FR-4.2),
   and the weekly risk score / VTE / transport safety (FR-5.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { visits: [], open: [], vitalsByTicket: {}, rxByTicket: {}, riskByTicket: {}, selRisk: null };

  /* ---- NEWS2 scoring from manual vitals (mirrors News2Service) ---- */
  function sc(part, v) {
    if (v == null || v === '' || isNaN(v)) return 0; v = Number(v);
    switch (part) {
      case 'rr':   return v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3;
      case 'spo2': return v >= 96 ? 0 : v >= 94 ? 1 : v >= 92 ? 2 : 3;
      case 'temp': return v <= 35 ? 3 : v <= 36 ? 1 : v <= 38 ? 0 : v <= 39 ? 1 : 2;
      case 'sbp':  return v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3;
      case 'pulse':return v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3;
      default: return 0;
    }
  }
  function news2(o) { return sc('rr', o.rr) + sc('spo2', o.spo2) + sc('temp', o.temp) + sc('sbp', o.sbp) + sc('pulse', o.pulse); }
  function latest(ticket) { var a = data.vitalsByTicket[ticket] || []; return a.length ? a[a.length - 1] : null; }
  function news2Of(ticket) { var l = latest(ticket); if (!l) return null; return l.news2 != null ? l.news2 : news2(l); }

  /* ---- selected visit ---- */
  function selTicket() {
    var t = window.STATE.selectedTicket;
    if (t && data.open.some(function (v) { return v.ticket_no === t; })) return t;
    return data.open.length ? data.open[0].ticket_no : null;
  }
  function visitByTicket(t) { return data.visits.find(function (v) { return v.ticket_no === t; }); }

  /* ---- loaders ---- */
  function loadVisits() {
    return API.visits.list().then(function (r) {
      data.visits = r || [];
      data.open = data.visits.filter(function (v) { return v.visit_status === 'open'; });
    });
  }
  function loadVitalsFor(list) {
    return Promise.all(list.map(function (v) {
      return API.vitals.list(v.ticket_no).then(function (a) { data.vitalsByTicket[v.ticket_no] = S.vitals(a); },
        function () { data.vitalsByTicket[v.ticket_no] = []; });
    }));
  }
  function loadRxFor(list) {
    return Promise.all(list.map(function (v) {
      return API.meds.list(v.ticket_no).then(function (a) { data.rxByTicket[v.ticket_no] = a || []; },
        function () { data.rxByTicket[v.ticket_no] = []; });
    }));
  }
  function loadRiskFor(list) {
    return Promise.all(list.map(function (v) {
      return API.vitals.riskScore(v.ticket_no).then(function (r) { data.riskByTicket[v.ticket_no] = r; },
        function () { data.riskByTicket[v.ticket_no] = null; });
    }));
  }

  function load(route) {
    return loadVisits().then(function () {
      if (route === 'mar') return loadRxFor(data.open);
      if (route === 'risk') {
        var t = selTicket();
        return Promise.all([loadRiskFor(data.open), t ? API.vitals.riskScore(t).then(function (r) { data.selRisk = r; }, function () {}) : null]);
      }
      if (route === 'handover') return Promise.all([loadVitalsFor(data.open), loadRxFor(data.open)]);
      if (route === 'vitals') {
        var t2 = selTicket();
        return Promise.all([loadVitalsFor(data.open), t2 ? API.vitals.riskScore(t2).then(function (r) { data.selRisk = r; }, function () {}) : null]);
      }
      // ward / triage
      return loadVitalsFor(data.open);
    });
  }

  /* ---- actions ---- */
  window.nurseSaveVitals = function (ticket) {
    var g = function (id) { var el = document.getElementById(id); return el ? el.value : ''; };
    var o = { pulse: g('v-pulse'), sbp: g('v-sbp'), dbp: g('v-dbp'), spo2: g('v-spo2'), temp: g('v-temp'), rr: g('v-rr'), pain: g('v-pain'), avpu: g('v-avpu') };
    if (!o.pulse && !o.sbp && !o.spo2) { UI.toast('Enter at least pulse, BP and SpO₂', 'warn'); return; }
    var payload = {
      systolic_bp: +o.sbp || null, diastolic_bp: +o.dbp || null, pulse: +o.pulse || null,
      respiratory_rate: +o.rr || null, spo2: +o.spo2 || null,
      temperature: o.temp ? Number(o.temp) : null, pain_score: o.pain !== '' ? +o.pain : null,
      consciousness_avpu: o.avpu || 'A'
    };
    var n = news2(o);
    API.vitals.store(ticket, payload).then(function () {
      var band = S.newsBand(n);
      if (n >= 5) UI.toast('NEWS2 ' + n + ' (' + band.label + ') — early warning raised to the team', 'warn');
      else UI.toast('Vitals saved · NEWS2 ' + n + ' (' + band.label + ')', 'ok');
      return load('vitals').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseTriageModal = function (ticket) {
    var v = visitByTicket(ticket);
    STORE.departments().then(function (depts) {
      var opts = (depts || []).map(function (d) { return '<option value="' + esc(d.dept_code) + '"' + (v && v.dept_code === d.dept_code ? ' selected' : '') + '>' + esc(d.department_name) + '</option>'; }).join('');
      UI.modal({
        title: 'Triage · ' + (v && v.patient ? v.patient.full_name : ticket), icon: 'route',
        body:
          '<div class="field"><label>Classification</label><select id="tr-cls"><option value="cold">Cold — clinic / planned</option><option value="emergency" selected>Emergency — ER</option><option value="critical">Critical — resus, skip triage</option></select></div>' +
          '<div class="field"><label>Route to department</label><select id="tr-dept">' + opts + '</select></div>' +
          '<div class="field"><label>Location / room code</label><input id="tr-loc" placeholder="e.g. ER-1 / CATH-1" /></div>' +
          '<div class="field"><label>Note</label><input id="tr-note" placeholder="optional" /></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="nurseDoTriage(\'' + ticket + '\')">' + I('check') + 'Set triage</button>'
      });
    });
  };
  window.nurseDoTriage = function (ticket) {
    var payload = {
      triage_classification: (document.getElementById('tr-cls') || {}).value,
      dept_code: (document.getElementById('tr-dept') || {}).value,
      location_code: (document.getElementById('tr-loc') || {}).value || null,
      note: (document.getElementById('tr-note') || {}).value || null
    };
    API.visits.triage(ticket, payload).then(function () {
      UI.closeModal();
      UI.toast('Triaged · ' + S.triageInfo(payload.triage_classification).label, payload.triage_classification === 'cold' ? 'ok' : 'warn');
      return load('triage').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseAdminister = function (rxId, action, drug) {
    var now = new Date();
    var stamp = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    var payload = { action: action, scheduled_time: stamp, actual_time: stamp, note: '' };
    API.meds.administer(rxId, payload).then(function () {
      var msg = action === 'given' || action === 'taken' ? 'Given' : action === 'refused' ? 'Recorded as refused' : 'Recorded as missed';
      UI.toast((drug || 'Medication') + ' · ' + msg, action === 'given' ? 'ok' : 'warn');
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseRecompute = function (ticket) {
    API.vitals.recompute(ticket).then(function (r) {
      UI.toast('Risk score recomputed' + (r && r.risk_level ? ' · ' + S.titleCase(r.risk_level) : ''), 'ok');
      return load('risk').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseTransport = function (ticket) {
    UI.modal({
      title: 'Transport (RSTP) · ' + ticket, icon: 'route',
      body: '<div class="field"><label>From location</label><input id="tp-from" placeholder="e.g. CCU-1" /></div>' +
        '<div class="field"><label>To location</label><input id="tp-to" placeholder="e.g. CATH-1" /></div>' +
        '<div class="field"><label>Monitoring during transfer</label><input id="tp-mon" placeholder="ECG, SpO2, O2" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="nurseDoTransport(\'' + ticket + '\')">' + I('check') + 'Record transport</button>'
    });
  };
  window.nurseDoTransport = function (ticket) {
    var mon = ((document.getElementById('tp-mon') || {}).value || '').split(',').map(function (s) { return s.trim(); }).filter(Boolean);
    var payload = { from_location: (document.getElementById('tp-from') || {}).value || '—', to_location: (document.getElementById('tp-to') || {}).value || '—', monitoring: mon };
    API.visits.transport(ticket, payload).then(function () { UI.closeModal(); UI.toast('Transport form recorded', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseChecklist = function (ticket) {
    UI.modal({
      title: 'Safety checklist · ' + ticket, icon: 'clipboard',
      body: '<div class="field"><label>Type</label><select id="cl-type"><option value="preop_checklist">Pre-op checklist</option><option value="surgical_timeout">Surgical timeout</option></select></div>' +
        '<div class="field"><label>Item</label><input id="cl-item" value="Identity, procedure and site verified" /></div>' +
        '<div class="field"><label>Decision</label><select id="cl-dec"><option value="completed">Completed</option><option value="declined">Declined</option></select></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="nurseDoChecklist(\'' + ticket + '\')">' + I('check') + 'Record</button>'
    });
  };
  window.nurseDoChecklist = function (ticket) {
    var payload = { record_type: (document.getElementById('cl-type') || {}).value, item: (document.getElementById('cl-item') || {}).value, decision: (document.getElementById('cl-dec') || {}).value };
    API.visits.checklist(ticket, payload).then(function () { UI.closeModal(); UI.toast('Checklist item recorded', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.nurseSelect = function (ticket, route) { window.STATE.selectedTicket = ticket; App.go(route || 'vitals'); };

  /* ---- screens ---- */
  function ward() {
    var pts = data.open;
    var deteriorating = pts.filter(function (v) { var n = news2Of(v.ticket_no); return n != null && n >= 5; });
    var triageWaiting = data.visits.filter(function (v) { return v.current_stage === 'triage' || v.current_stage === 'arrival'; }).length;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Patients on unit', value: pts.length, icon: 'users' }) +
      UI.tile({ label: 'Early warnings', value: deteriorating.length, icon: 'alert', accent: deteriorating.length ? 'gold' : '', foot: 'NEWS2 ≥ 5' }) +
      UI.tile({ label: 'Awaiting triage', value: triageWaiting, icon: 'route' }) +
      UI.tile({ label: 'Cardiac cases', value: pts.filter(function (v) { return v.dept_code === 'CARD' || v.dept_code === 'CCU'; }).length, icon: 'heart' }) +
    '</div>';

    var rows = pts.map(function (vr) {
      var v = S.visit(vr); var l = latest(v.ticket); var n = news2Of(v.ticket);
      return '<tr onclick="nurseSelect(\'' + v.ticket + '\',\'vitals\')">' +
        '<td><div class="flex">' + UI.avatarFor(v) + '<div><div class="t-name">' + esc(v.name) + '</div>' +
          '<div class="t-sub">' + esc(v.dept) + ' · ' + esc(v.room) + '</div></div></div></td>' +
        '<td>' + (l ? '<b>' + (l.pulse != null ? l.pulse : '—') + '</b> <span class="t-sub">bpm</span>' : '—') + '</td>' +
        '<td>' + (l && l.sbp ? '<b>' + l.sbp + '/' + (l.dbp || '—') + '</b>' : '—') + '</td>' +
        '<td>' + (l && l.spo2 != null ? '<b>' + l.spo2 + '</b><span class="t-sub">%</span>' : '—') + '</td>' +
        '<td>' + (n != null ? UI.newsBadge(n) : '<span class="muted">no vitals</span>') + '</td>' +
        '<td>' + esc(window.stageLabel(v.stage)) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="6">' + UI.empty('No patients on the unit') + '</td></tr>';

    var ewPanel = deteriorating.length ? deteriorating.map(function (vr) {
      var v = S.visit(vr); var n = news2Of(v.ticket); var crit = n >= 7;
      return '<div class="alert-row ' + (crit ? 'crit' : 'warn') + '">' +
        '<div class="ar-ic">' + I('activity') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(v.name) + ' · ' + esc(v.room) + '</div>' +
          '<div class="ar-s">NEWS2 ' + n + ' · ' + esc(window.stageLabel(v.stage)) + '</div></div>' +
        '<button class="btn ' + (crit ? 'btn-rose' : 'btn-ghost') + ' btn-sm" onclick="nurseSelect(\'' + v.ticket + '\',\'vitals\')">Review</button>' +
      '</div>';
    }).join('') : UI.empty('No patients crossing the early-warning threshold', 'check');

    var watch = deteriorating[0] || pts[0];
    var watchNews = watch ? (data.vitalsByTicket[watch.ticket_no] || []).map(function (v) { return v.news2 != null ? v.news2 : news2(v); }) : [];
    var watchLabels = watch ? (data.vitalsByTicket[watch.ticket_no] || []).map(function (v) { return v.t; }) : [];

    var charts = '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px" class="mb-2">' +
      '<div class="card"><div class="card-head">' + I('activity') + '<h3>' + esc(watch ? (watch.patient ? watch.patient.full_name : watch.ticket_no) : 'NEWS2') + ' — NEWS2 trend</h3>' +
        (watchNews.length ? '<span class="ch-act">' + UI.newsBadge(watchNews[watchNews.length - 1]) + '</span>' : '') + '</div>' +
        '<div class="card-pad">' + (watchNews.length ? UI.lineChart([{ values: watchNews, color: '#d96666' }], { labels: watchLabels, h: 168, min: 0, max: 12 }) : UI.empty('No vitals', 'activity')) +
        '<p class="muted mt-1" style="font-size:12.5px">Early warning fires at NEWS2 ≥ 5 — a rising trend is escalated to the team.</p></div></div>' +
      '<div class="card"><div class="card-head"><h3>Unit watch</h3></div><div class="card-pad">' + ewPanel + '</div></div>' +
    '</div>';

    return UI.pageHead({ eyebrow: 'Nursing · ' + esc(S.me() ? S.me().name : 'Head Nurse'), title: 'Ward overview', sub: 'Vitals, early warning, medication and risk — live' }) +
      tiles + charts +
      '<div class="card"><div class="card-head"><h3>My patients</h3><span class="ch-act muted">Tap a row to record vitals</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Pulse</th><th>BP</th><th>SpO₂</th><th>NEWS2</th><th>Stage</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function triage() {
    var waiting = data.visits.filter(function (v) { return v.visit_status === 'open' && (v.current_stage === 'triage' || v.current_stage === 'arrival'); });
    if (!waiting.length) {
      return UI.pageHead({ eyebrow: 'Nursing', title: 'Triage', sub: 'Sort each patient: Cold · Emergency · Critical (FR-4.2)' }) +
        '<div class="card card-pad">' + UI.empty('No patients waiting for triage right now', 'check') + '</div>';
    }
    var cards = waiting.map(function (vr) {
      var v = S.visit(vr); var l = latest(v.ticket);
      return '<div class="card card-pad mb-2">' +
        '<div class="row-between mb-2">' + UI.patientStrip(v) + UI.triageBadge(v.triage) + '</div>' +
        '<div class="kv mb-2" style="grid-template-columns:auto 1fr auto 1fr">' +
          '<dt>Arrival</dt><dd style="text-align:start">' + esc(S.arrivalLabel(v.arrival)) + '</dd>' +
          '<dt>Department</dt><dd style="text-align:start">' + esc(v.dept) + '</dd>' +
          '<dt>Vitals</dt><dd style="text-align:start">' + (l ? (l.pulse || '—') + ' bpm · ' + (l.sbp || '—') + '/' + (l.dbp || '—') + ' · ' + (l.spo2 || '—') + '%' : 'not taken') + '</dd>' +
          '<dt>NEWS2</dt><dd style="text-align:start">' + (news2Of(v.ticket) != null ? news2Of(v.ticket) : '—') + '</dd>' +
        '</div>' +
        '<div class="wrap-gap"><button class="btn btn-primary btn-sm" onclick="nurseTriageModal(\'' + v.ticket + '\')">' + I('route') + 'Set triage & route</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="nurseSelect(\'' + v.ticket + '\',\'vitals\')">' + I('heart') + 'Record vitals</button></div>' +
      '</div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing · Head nurse', title: 'Triage', sub: 'Sort each patient: Cold · Emergency · Critical, then route (FR-4.2)' }) +
      UI.lockNote('Critical (unconscious / accident / life-threatening) skips triage and goes straight to the ER. Cold during clinic hours goes to the clinic.') +
      '<div class="mt-2">' + cards + '</div>';
  }

  function vitalsScreen() {
    var ticket = selTicket();
    if (!ticket) {
      return UI.pageHead({ eyebrow: 'Nursing', title: 'Record vitals' }) + '<div class="card card-pad">' + UI.empty('No open visits to chart', 'activity') + '</div>';
    }
    var v = S.visit(visitByTicket(ticket));
    var arr = data.vitalsByTicket[ticket] || [];
    var l = arr.length ? arr[arr.length - 1] : null;
    var pulses = arr.map(function (x) { return x.pulse; }).filter(function (x) { return x != null; });

    var flag = function (val, key) {
      if (val == null) return '—';
      var t = window.THRESHOLDS[key]; if (!t) return '' + val;
      return (val < t.low || val > t.high) ? '<span style="color:var(--rose);font-weight:700">' + val + '</span>' : '' + val;
    };
    var rows = arr.slice().reverse().map(function (x) {
      var n = x.news2 != null ? x.news2 : news2(x);
      return '<tr><td>' + esc(S.fmtDateTime(x.taken_at)) + '</td><td>' + flag(x.pulse, 'pulse') + '</td><td>' + (x.sbp ? flag(x.sbp, 'sbp') + '/' + (x.dbp || '—') : '—') + '</td>' +
        '<td>' + flag(x.spo2, 'spo2') + '</td><td>' + flag(x.temp, 'temp') + '</td><td>' + flag(x.rr, 'rr') + '</td><td>' + UI.newsBadge(n) + '</td></tr>';
    }).join('');

    var picker = data.open.map(function (vr) {
      var nv = S.visit(vr); var on = nv.ticket === ticket; var n = news2Of(nv.ticket);
      return '<tr onclick="nurseSelect(\'' + nv.ticket + '\',\'vitals\')" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="t-name">' + esc(nv.name) + '</div><div class="t-sub">' + esc(nv.room) + '</div></td>' +
        '<td>' + (n != null ? UI.newsBadge(n) : '<span class="muted">—</span>') + '</td></tr>';
    }).join('');

    var thRows = ['pulse', 'sbp', 'spo2', 'temp', 'rr'].map(function (key) {
      var t = window.THRESHOLDS[key], val = l ? l[key] : null;
      var out = val != null && (val < t.low || val > t.high);
      return '<tr><td class="t-name">' + esc(t.label) + '</td><td class="muted">' + t.low + '–' + t.high + ' ' + esc(t.unit) + '</td>' +
        '<td>' + (val != null ? (out ? '<span class="badge rose">' + val + ' · out</span>' : '<span class="badge green">' + val + '</span>') : '<span class="muted">—</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Record vitals', sub: 'Typed by hand — monitors are not on the network (FR-5.1)' }) +
      '<div class="grid" style="grid-template-columns:260px 1fr;gap:18px">' +
        '<div class="card" style="align-self:start"><div class="card-head"><h3>Ward</h3></div><div class="table-wrap"><table class="t"><tbody>' + (picker || '<tr><td>' + UI.empty('No patients') + '</td></tr>') + '</tbody></table></div></div>' +
        '<div>' +
          '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(v) + '<span class="ch-act badge teal">Obs ' + esc(window.OBS_FREQ[v.stage] || 'hourly') + '</span></div><div class="card-pad">' +
            '<div class="field-row-3">' +
              '<div class="field"><label>Pulse (bpm)</label><input id="v-pulse" inputmode="numeric" placeholder="e.g. 92" /></div>' +
              '<div class="field"><label>Systolic BP</label><input id="v-sbp" inputmode="numeric" placeholder="e.g. 130" /></div>' +
              '<div class="field"><label>Diastolic BP</label><input id="v-dbp" inputmode="numeric" placeholder="e.g. 84" /></div>' +
            '</div>' +
            '<div class="field-row-3">' +
              '<div class="field"><label>SpO₂ (%)</label><input id="v-spo2" inputmode="numeric" placeholder="e.g. 97" /></div>' +
              '<div class="field"><label>Temp (°C)</label><input id="v-temp" inputmode="decimal" placeholder="e.g. 36.8" /></div>' +
              '<div class="field"><label>Resp rate</label><input id="v-rr" inputmode="numeric" placeholder="e.g. 18" /></div>' +
            '</div>' +
            '<div class="field-row-3">' +
              '<div class="field"><label>Pain (0–10)</label><input id="v-pain" inputmode="numeric" placeholder="e.g. 3" /></div>' +
              '<div class="field"><label>Consciousness (AVPU)</label><select id="v-avpu"><option>A</option><option>V</option><option>P</option><option>U</option></select></div>' +
              '<div class="field" style="align-self:end"><button class="btn btn-primary btn-block" onclick="nurseSaveVitals(\'' + ticket + '\')">' + I('check') + 'Save vitals</button></div>' +
            '</div>' +
            '<p class="muted" style="font-size:12.5px;margin:4px 0 0">NEWS2 is scored on the server when you save · early warning at ≥ 5 or any single threshold breach.</p>' +
          '</div></div>' +
          '<div class="grid cols-2 mb-2">' +
            '<div class="card"><div class="card-head">' + I('shield') + '<h3>Thresholds (FR-5.2)</h3></div>' +
              '<div class="table-wrap"><table class="t"><thead><tr><th>Vital</th><th>Range</th><th>Latest</th></tr></thead><tbody>' + thRows + '</tbody></table></div></div>' +
            '<div class="card"><div class="card-head"><h3>Trend</h3>' + (pulses.length ? '<span class="ch-act">' + UI.spark(pulses) + '</span>' : '') + '</div>' +
              '<div class="card-pad"><div class="muted" style="font-size:12.5px">Latest NEWS2</div>' + (l ? '<div style="margin-top:8px">' + UI.newsBadge(l.news2 != null ? l.news2 : news2(l)) + '</div>' : '<span class="muted">—</span>') +
              '<div class="divider"></div><div class="muted" style="font-size:12px">Observations taken <b>' + esc(window.OBS_FREQ[v.stage] || 'hourly') + '</b> at this stage.</div></div></div>' +
          '</div>' +
          '<div class="card"><div class="card-head"><h3>Full trend</h3></div>' +
            (arr.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>When</th><th>Pulse</th><th>BP</th><th>SpO₂</th><th>Temp</th><th>RR</th><th>NEWS2</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
              : '<div class="card-pad">' + UI.empty('No vitals recorded yet', 'activity') + '</div>') + '</div>' +
        '</div>' +
      '</div>';
  }

  function mar() {
    var blocks = data.open.map(function (vr) {
      var v = S.visit(vr); var list = data.rxByTicket[v.ticket] || [];
      if (!list.length) return '';
      var rows = list.map(function (rx) {
        var ph = rx.pharmacy || {};
        return '<tr><td><div class="t-name">' + esc(rx.drug_name) + '</div><div class="t-sub">' + esc(rx.dose) + ' · ' + esc(rx.route) + ' · ' + esc(rx.frequency) + '</div></td>' +
          '<td>' + (ph.available ? UI.badge('In stock', 'green') : UI.badge('Out of stock', 'rose')) + '</td>' +
          '<td><div class="wrap-gap">' +
            '<button class="btn btn-primary btn-sm" onclick="nurseAdminister(' + rx.id + ',\'given\',\'' + esc(rx.drug_name) + '\')">' + I('check') + 'Give</button>' +
            '<button class="btn btn-soft btn-sm" onclick="nurseAdminister(' + rx.id + ',\'refused\',\'' + esc(rx.drug_name) + '\')">Refused</button>' +
            '<button class="btn btn-soft btn-sm" onclick="nurseAdminister(' + rx.id + ',\'missed\',\'' + esc(rx.drug_name) + '\')">Missed</button>' +
          '</div></td></tr>';
      }).join('');
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(v) + '</div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Medication</th><th>Pharmacy</th><th>Record administration</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Medication administration (MAR)', sub: 'Record given, refused, or missed (FR-6.2 / FR-6.3)' }) +
      '<div class="mt-2">' + (blocks || '<div class="card card-pad">' + UI.empty('No active medications', 'pill') + '</div>') + '</div>';
  }

  function risk() {
    var rows = data.open.map(function (vr) {
      var v = S.visit(vr); var r = data.riskByTicket[v.ticket];
      var score = r && r.score != null ? r.score : news2Of(v.ticket);
      var lvl = r && r.risk_level ? r.risk_level : (score != null ? S.newsBand(score).label : null);
      return '<tr>' +
        '<td><div class="flex">' + UI.avatarFor(v) + '<div><div class="t-name">' + esc(v.name) + '</div><div class="t-sub">' + esc(v.room) + '</div></div></div></td>' +
        '<td>' + (lvl ? UI.badge(S.titleCase(lvl), S.riskTone(lvl)) : '<span class="muted">—</span>') + '</td>' +
        '<td>' + (score != null ? score : '—') + '</td>' +
        '<td class="muted">NEWS2 / MEWS</td>' +
        '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="nurseSelect(\'' + v.ticket + '\',\'risk\')">' + I('shield') + 'Open</button>' +
          '<button class="btn btn-soft btn-sm" onclick="nurseRecompute(\'' + v.ticket + '\')">' + I('activity') + 'Recompute</button></div></td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('No open visits') + '</td></tr>';

    var ticket = selTicket();
    var v = ticket ? S.visit(visitByTicket(ticket)) : null;
    var r = data.selRisk;
    var breakdown = r && r.breakdown ? Object.keys(r.breakdown).map(function (k) {
      return '<tr><td class="t-name">' + esc(S.titleCase(k)) + '</td><td style="text-align:end">' + r.breakdown[k] + '</td></tr>';
    }).join('') : '';

    var detail = v ? '<div class="grid cols-2 mt-2">' +
      '<div class="card"><div class="card-head">' + I('activity') + '<h3>NEWS2 breakdown · ' + esc(v.name) + '</h3>' +
        (r && r.score != null ? '<span class="ch-act">' + UI.newsBadge(r.score) + '</span>' : '') + '</div>' +
        (breakdown ? '<div class="table-wrap"><table class="t"><thead><tr><th>Component</th><th style="text-align:end">Points</th></tr></thead><tbody>' + breakdown +
          '<tr><td class="t-name">Total</td><td style="text-align:end" class="t-name">' + (r.score != null ? r.score : '—') + '</td></tr></tbody></table></div>'
          : '<div class="card-pad">' + UI.empty('No score yet — record vitals first', 'activity') + '</div>') +
        '<div class="card-pad"><div class="wrap-gap"><button class="btn btn-primary btn-sm" onclick="nurseRecompute(\'' + ticket + '\')">' + I('activity') + 'Recompute</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="nurseTransport(\'' + ticket + '\')">' + I('route') + 'Transport (RSTP)</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="nurseChecklist(\'' + ticket + '\')">' + I('clipboard') + 'Safety checklist</button></div></div></div>' +
      '<div class="card"><div class="card-head">' + I('drop') + '<h3>VTE risk (Padua)</h3></div><div class="card-pad">' +
        '<p class="muted" style="font-size:12.5px">Tick the factors that apply, then record the VTE assessment (FR-5.x).</p>' +
        ['Reduced mobility|3', 'Active cancer|3', 'Previous VTE|3', 'Recent surgery / trauma|2', 'Age ≥ 70|1', 'Heart / respiratory failure|1', 'Acute MI / stroke|1', 'Obesity (BMI ≥ 30)|1'].map(function (f, i) {
          var parts = f.split('|');
          return '<label class="task"><input type="checkbox" id="vte-' + i + '" data-f="' + esc(parts[0]) + '" data-p="' + parts[1] + '"/> <span>' + esc(parts[0]) + ' <span class="muted">(+' + parts[1] + ')</span></span></label>';
        }).join('') +
        '<button class="btn btn-primary btn-sm mt-2" onclick="nurseSaveVte(\'' + ticket + '\')">' + I('check') + 'Record VTE assessment</button></div></div>' +
    '</div>' : '';

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Risk, RSTP & VTE', sub: 'NEWS2/MEWS now; redone with an RSTP for transfers (FR-5.4) — pick a patient for detail' }) +
      UI.lockNote('The risk score travels with the patient between departments. Padua VTE risk drives prophylaxis; the transport (RSTP) form is recorded before transfers.') +
      '<div class="card mt-2"><div class="card-head"><h3>Patient risk</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Risk</th><th>Score</th><th>Tool</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      detail;
  }
  window.nurseSaveVte = function (ticket) {
    var factors = [];
    for (var i = 0; i < 8; i++) {
      var el = document.getElementById('vte-' + i);
      if (el && el.checked) factors.push({ factor: el.getAttribute('data-f'), points: Number(el.getAttribute('data-p')) });
    }
    if (!factors.length) { UI.toast('Select at least one factor', 'warn'); return; }
    API.vitals.vte(ticket, factors).then(function (r) {
      var total = factors.reduce(function (a, f) { return a + f.points; }, 0);
      UI.toast('VTE recorded · Padua ' + total + (total >= 4 ? ' — prophylaxis indicated' : ''), total >= 4 ? 'warn' : 'ok');
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  function handover() {
    var pts = data.open;
    var blocks = pts.map(function (vr) {
      var v = S.visit(vr); var l = latest(v.ticket); var n = news2Of(v.ticket);
      var rx = data.rxByTicket[v.ticket] || [];
      var sbar =
        '<div class="sbar"><div class="sbar-row"><b>S</b><div><span class="sbar-k">Situation</span> ' + esc(v.name) + ', ' + esc(window.stageLabel(v.stage)) + ' in ' + esc(v.room) + '.</div></div>' +
        '<div class="sbar-row"><b>B</b><div><span class="sbar-k">Background</span> ' + esc((v.patient && v.patient.chronic_conditions) || 'see file') + '.</div></div>' +
        '<div class="sbar-row"><b>A</b><div><span class="sbar-k">Assessment</span> ' + (l ? 'HR ' + (l.pulse || '—') + ', BP ' + (l.sbp || '—') + '/' + (l.dbp || '—') + ', SpO₂ ' + (l.spo2 || '—') + '%, NEWS2 ' + (n != null ? n : '—') : 'no vitals') + '.</div></div>' +
        '<div class="sbar-row"><b>R</b><div><span class="sbar-k">Recommendation</span> ' + (rx.length ? 'Continue ' + esc(rx.slice(0, 2).map(function (r) { return r.drug_name; }).join(', ')) + ' and the care plan' : 'Continue plan') + '.</div></div></div>';
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(v) + '<span class="ch-act">' + (n != null ? UI.newsBadge(n) : '') + '</span></div>' +
        '<div class="card-pad">' + sbar + '</div></div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Nursing', title: 'Shift handover (SBAR)', sub: 'Situation · Background · Assessment · Recommendation' }) +
      '<div class="mt-2">' + (blocks || '<div class="card card-pad">' + UI.empty('No active patients', 'clipboard') + '</div>') + '</div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.nurse = {
    label: 'Nursing', person: 'Head Nurse', icon: 'nurse', accent: 'teal',
    desc: 'Take vitals by hand, score deterioration with NEWS2, raise early warnings, run the medication record, set triage and the risk score.',
    home: 'ward',
    nav: [
      { route: 'ward', label: 'Ward overview', icon: 'activity' },
      { route: 'triage', label: 'Triage', icon: 'route', badge: function () { return data.visits.filter(function (v) { return v.visit_status === 'open' && (v.current_stage === 'triage' || v.current_stage === 'arrival'); }).length; } },
      { route: 'vitals', label: 'Record vitals', icon: 'heart' },
      { route: 'mar', label: 'Medications (MAR)', icon: 'pill' },
      { route: 'handover', label: 'Handover (SBAR)', icon: 'clipboard' },
      { route: 'risk', label: 'Risk & RSTP', icon: 'shield' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'triage': return triage();
        case 'vitals': return vitalsScreen();
        case 'mar': return mar();
        case 'handover': return handover();
        case 'risk': return risk();
        default: return ward();
      }
    }
  };
})();
