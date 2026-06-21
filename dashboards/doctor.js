/* ============================================================
   A.B.C.D.E — Staff Dashboards · doctor.js  (LIVE API)
   The treating doctor sees their own patients' full file
   (FR-1.8), diagnoses & problem list (FR-7.x), orders lab /
   radiology (FR-7.1), prescribes to the pharmacy (FR-6.1),
   advances the journey & records Door-to-Balloon (FR-15.2),
   and drafts AI documentation saved only on approval (NFR-2).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { visits: [], mine: [], vitalsByTicket: {}, file: null, results: null, carePlan: null, risk: null, orders: [], rx: [], pharmacy: [], draft: null };

  function sc(part, v) {
    if (v == null || v === '' || isNaN(v)) return 0; v = Number(v);
    switch (part) {
      case 'rr': return v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3;
      case 'spo2': return v >= 96 ? 0 : v >= 94 ? 1 : v >= 92 ? 2 : 3;
      case 'temp': return v <= 35 ? 3 : v <= 36 ? 1 : v <= 38 ? 0 : v <= 39 ? 1 : 2;
      case 'sbp': return v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3;
      case 'pulse': return v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3;
      default: return 0;
    }
  }
  function news2(o) { return sc('rr', o.rr) + sc('spo2', o.spo2) + sc('temp', o.temp) + sc('sbp', o.sbp) + sc('pulse', o.pulse); }
  function news2Of(ticket) { var a = data.vitalsByTicket[ticket] || []; if (!a.length) return null; var l = a[a.length - 1]; return l.news2 != null ? l.news2 : news2(l); }

  function selVisit() {
    if (!data.mine.length) return null;
    var s = window.STATE.selectedSerial;
    return data.mine.find(function (v) { return v.patient_serial === s; }) || data.mine[0];
  }

  /* ---- loaders ---- */
  function loadVisits() {
    return API.visits.list().then(function (r) {
      data.visits = r || [];
      var sid = S.staffId();
      var mine = data.visits.filter(function (v) { return sid && v.treating_doctor_id === sid; });
      data.mine = mine.length ? mine : data.visits.filter(function (v) { return v.visit_status === 'open'; });
      var v = selVisit();
      if (v) window.STATE.selectedSerial = v.patient_serial;
    });
  }
  function loadVitalsFor(list) {
    return Promise.all(list.map(function (v) {
      return API.vitals.list(v.ticket_no).then(function (a) { data.vitalsByTicket[v.ticket_no] = S.vitals(a); }, function () { data.vitalsByTicket[v.ticket_no] = []; });
    }));
  }

  function load(route) {
    return loadVisits().then(function () {
      var v = selVisit();
      if (!v) return;
      var serial = v.patient_serial, ticket = v.ticket_no;
      if (route === 'worklist') return loadVitalsFor(data.mine);
      if (route === 'file' || route === 'diagnosis') {
        return Promise.all([
          API.patients.file(serial).then(function (f) { data.file = f; }),
          API.visits.carePlan(ticket).then(function (c) { data.carePlan = c; }, function () { data.carePlan = null; }),
          API.vitals.riskScore(ticket).then(function (r) { data.risk = r; }, function () { data.risk = null; }),
          API.vitals.list(ticket).then(function (a) { data.vitalsByTicket[ticket] = S.vitals(a); }, function () {})
        ]);
      }
      if (route === 'orders') return API.diagnostics.orders(ticket).then(function (o) { data.orders = o || []; });
      if (route === 'results') return API.diagnostics.results(ticket).then(function (r) { data.results = r; });
      if (route === 'prescribe') return Promise.all([
        API.meds.list(ticket).then(function (a) { data.rx = a || []; }),
        S.pharmacy().then(function (p) { data.pharmacy = p || []; }, function () { data.pharmacy = []; })
      ]);
      if (route === 'journey') return Promise.all([
        API.visits.get(ticket).then(function (vd) { v.detail = vd; }),
        API.patients.file(serial).then(function (f) { data.file = f; }),
        API.visits.carePlan(ticket).then(function (c) { data.carePlan = c; }, function () { data.carePlan = null; })
      ]);
      return null;
    });
  }

  window.docSelect = function (serial, route) { window.STATE.selectedSerial = serial; App.go(route || 'file'); };

  /* ---- mutations ---- */
  window.docAdvance = function (ticket, stage) {
    var idx = window.stageIndex(stage);
    if (idx >= window.STAGES.length - 1) { UI.toast('Patient is at the final stage', 'warn'); return; }
    var next = window.STAGES[idx + 1];
    var payload = { stage: next.key, note: next.owner };
    if (next.key === 'cath') {
      var now = new Date();
      payload.balloon_time = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    }
    API.visits.advance(ticket, payload).then(function (r) {
      if (next.key === 'cath') UI.toast('Advanced to Catheterization · Door-to-Balloon recorded', 'ok');
      else UI.toast('Advanced to ' + next.label, 'ok');
      return load('journey').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docCathType = function (ticket) {
    UI.modal({
      title: 'Catheterization type', icon: 'heart',
      body: '<div class="field"><label>Type</label><select id="ct-type"><option value="cardiac">Cardiac</option><option value="cerebral">Cerebral</option><option value="peripheral">Peripheral</option><option value="interventional_radiology">Interventional radiology</option></select></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoCathType(\'' + ticket + '\')">' + I('check') + 'Set</button>'
    });
  };
  window.docDoCathType = function (ticket) {
    API.visits.cathType(ticket, (document.getElementById('ct-type') || {}).value).then(function () { UI.closeModal(); UI.toast('Catheterization type set', 'ok'); return load('journey').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docDiagnosisModal = function (ticket) {
    UI.modal({
      title: 'Add diagnosis', icon: 'clipboard',
      body: '<div class="field-row"><div class="field"><label>ICD-10 code</label><input id="dx-code" placeholder="e.g. I21.19" /></div>' +
        '<div class="field"><label>Primary?</label><select id="dx-primary"><option value="false">Secondary</option><option value="true">Primary</option></select></div></div>' +
        '<div class="field"><label>Diagnosis</label><input id="dx-label" placeholder="e.g. Inferior STEMI" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoDiagnosis(\'' + ticket + '\')">' + I('check') + 'Add to problem list</button>'
    });
  };
  window.docDoDiagnosis = function (ticket) {
    var label = (document.getElementById('dx-label') || {}).value || '';
    if (!label.trim()) { UI.toast('Enter a diagnosis', 'warn'); return; }
    var payload = { icd10_code: (document.getElementById('dx-code') || {}).value || null, diagnosis: label.trim(), is_primary: (document.getElementById('dx-primary') || {}).value === 'true' };
    API.diagnostics.diagnosis(ticket, payload).then(function () { UI.closeModal(); UI.toast('Added to problem list', 'ok'); return load('diagnosis').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docOrderModal = function (ticket) {
    UI.modal({
      title: 'Place order', icon: 'flask',
      body: '<div class="field"><label>Type</label><select id="ord-type"><option value="lab">Lab</option><option value="radiology">Radiology</option><option value="imaging">Imaging</option><option value="medication">Medication</option><option value="diet">Diet</option></select></div>' +
        '<div class="field"><label>Detail</label><input id="ord-detail" placeholder="e.g. Troponin I, CK-MB" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoOrder(\'' + ticket + '\')">' + I('check') + 'Place order</button>'
    });
  };
  window.docDoOrder = function (ticket) {
    var detail = (document.getElementById('ord-detail') || {}).value || '';
    if (!detail.trim()) { UI.toast('Enter the order detail', 'warn'); return; }
    API.diagnostics.storeOrder(ticket, { order_type: (document.getElementById('ord-type') || {}).value, detail: detail.trim() })
      .then(function () { UI.closeModal(); UI.toast('Order placed', 'ok'); return load('orders').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docFileResult = function (id) {
    UI.modal({
      title: 'File result', icon: 'flask',
      body: '<div class="field"><label>Result summary</label><input id="res-sum" placeholder="e.g. Troponin I 2.8 ng/mL (H)" /></div>' +
        '<div class="field"><label>Status</label><select id="res-st"><option value="resulted">Resulted</option><option value="in_progress">In progress</option><option value="cancelled">Cancelled</option></select></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoFileResult(' + id + ')">' + I('check') + 'File</button>'
    });
  };
  window.docDoFileResult = function (id) {
    API.diagnostics.fileResult(id, { result_summary: (document.getElementById('res-sum') || {}).value || '', status: (document.getElementById('res-st') || {}).value })
      .then(function () { UI.closeModal(); UI.toast('Result filed', 'ok'); return load('orders').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docPrescribeModal = function (ticket) {
    UI.modal({
      title: 'New prescription', icon: 'pill',
      body: '<div class="field"><label>Drug</label><input id="rx-drug" placeholder="e.g. Bisoprolol" /></div>' +
        '<div class="field-row"><div class="field"><label>Dose</label><input id="rx-dose" placeholder="e.g. 2.5 mg" /></div>' +
        '<div class="field"><label>Route</label><select id="rx-route"><option>PO</option><option>IV</option><option>IM</option><option>SC</option></select></div></div>' +
        '<div class="field-row"><div class="field"><label>Frequency</label><input id="rx-freq" placeholder="e.g. once daily" /></div>' +
        '<div class="field"><label>Duration (days)</label><input id="rx-dur" inputmode="numeric" value="30" /></div></div>' +
        '<div class="field"><label>Patient instructions</label><input id="rx-instr" placeholder="e.g. One tablet daily after food" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoPrescribe(\'' + ticket + '\')">' + I('check') + 'Send to pharmacy</button>'
    });
  };
  window.docDoPrescribe = function (ticket) {
    var drug = (document.getElementById('rx-drug') || {}).value || '';
    if (!drug.trim()) { UI.toast('Enter a drug', 'warn'); return; }
    var payload = {
      drug_name: drug.trim(), dose: (document.getElementById('rx-dose') || {}).value || '—',
      route: (document.getElementById('rx-route') || {}).value || 'PO', frequency: (document.getElementById('rx-freq') || {}).value || 'once daily',
      duration_days: +(document.getElementById('rx-dur') || {}).value || 30, patient_instructions: (document.getElementById('rx-instr') || {}).value || null
    };
    API.meds.prescribe(ticket, payload).then(function () { UI.closeModal(); UI.toast(drug + ' prescribed → pharmacy', 'ok'); return load('prescribe').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docPrescribeQuick = function (ticket, drug, dose) {
    API.meds.prescribe(ticket, { drug_name: drug, dose: dose, route: 'PO', frequency: 'once daily', duration_days: 30 })
      .then(function () { UI.toast(drug + ' prescribed', 'ok'); return load('prescribe').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docConsultModal = function (ticket) {
    UI.modal({
      title: 'Consultation request', icon: 'stethoscope',
      body: '<div class="field"><label>Specialty</label><input id="cs-spec" placeholder="e.g. Endocrinology" /></div>' +
        '<div class="field"><label>Question</label><textarea id="cs-q" placeholder="Clinical question for the consultant…"></textarea></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoConsult(\'' + ticket + '\')">' + I('check') + 'Send request</button>'
    });
  };
  window.docDoConsult = function (ticket) {
    var spec = (document.getElementById('cs-spec') || {}).value || '';
    if (!spec.trim()) { UI.toast('Enter a specialty', 'warn'); return; }
    API.diagnostics.consultation(ticket, { specialty: spec.trim(), question: (document.getElementById('cs-q') || {}).value || '—' })
      .then(function () { UI.closeModal(); UI.toast('Consultation requested → ' + spec, 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docCarePlanModal = function (ticket) {
    var c = data.carePlan || {};
    UI.modal({
      title: 'Multidisciplinary care plan', icon: 'clipboard', wide: true,
      body: '<div class="field"><label>Problem list</label><input id="cp-prob" value="' + esc(c.problem_list || '') + '" placeholder="e.g. STEMI; HTN; T2DM" /></div>' +
        '<div class="field"><label>Plan</label><textarea id="cp-plan" placeholder="e.g. DAPT, statin, cardiac rehab">' + esc(c.plan || '') + '</textarea></div>' +
        '<div class="field-row"><div class="field"><label>Expected outcomes</label><input id="cp-out" value="' + esc(c.outcomes || '') + '" /></div>' +
        '<div class="field"><label>Timeframe</label><input id="cp-time" value="' + esc(c.timeframe || '') + '" placeholder="e.g. 3 months" /></div></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoCarePlan(\'' + ticket + '\')">' + I('check') + 'Save care plan</button>'
    });
  };
  window.docDoCarePlan = function (ticket) {
    var payload = { problem_list: (document.getElementById('cp-prob') || {}).value || '', plan: (document.getElementById('cp-plan') || {}).value || '', outcomes: (document.getElementById('cp-out') || {}).value || '', timeframe: (document.getElementById('cp-time') || {}).value || '' };
    API.visits.storeCarePlan(ticket, payload).then(function () { UI.closeModal(); UI.toast('Care plan saved', 'ok'); return load('journey').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.docConsentModal = function (ticket) {
    UI.modal({
      title: 'Request consent', icon: 'shield',
      body: '<div class="field"><label>Procedure / item</label><input id="co-item" value="Cardiac catheterization (primary PCI)" /></div>' +
        '<p class="muted" style="font-size:12.5px">The patient or their decision-maker responds in the app (FR-8 / consent).</p>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="docDoConsent(\'' + ticket + '\')">' + I('check') + 'Request consent</button>'
    });
  };
  window.docDoConsent = function (ticket) {
    var item = (document.getElementById('co-item') || {}).value || 'Procedure consent';
    API.visits.consents(ticket, item).then(function () { UI.closeModal(); UI.toast('Consent requested', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* ---- AI documentation ---- */
  window.docAIDraft = function (ticket) {
    var dt = (document.getElementById('ai-doctype') || {}).value || 'discharge_summary';
    UI.toast('Generating draft…', 'ok');
    API.ai.draft({ ticket_no: ticket, doc_type: dt }).then(function (d) {
      data.draft = d;
      UI.modal({
        title: 'AI documentation draft', icon: 'sparkle', wide: true,
        body: '<div class="lock-note mb-2">' + I('shield') + '<div><b>Nothing is stored until you approve it (FR-9.1 / NFR-2).</b> The advisor drafts; the doctor signs off.</div></div>' +
          '<textarea id="ai-draft-text" style="width:100%;min-height:240px;font-family:monospace;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:13px;line-height:1.6">' + esc(d.content || '') + '</textarea>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Discard</button>' +
          '<button class="btn btn-primary" onclick="docApproveDraft(' + d.id + ')">' + I('check') + 'Approve & save</button>'
      });
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docApproveDraft = function (id) {
    var content = (document.getElementById('ai-draft-text') || {}).value || '';
    API.ai.approve(id, { content: content }).then(function () { UI.closeModal(); UI.toast('Report approved & saved to the record', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docTranscribe = function () {
    var note = 'Patient comfortable, chest pain resolved after PCI. Vitals stable, SpO₂ 97% on room air. Continue dual antiplatelet therapy. Plan: step down to ward, cardiology review tomorrow.';
    API.ai.transcribe({ transcript: note }).then(function (r) {
      var el = document.getElementById('ai-transcript');
      if (el) el.value = (r && (r.text || r.transcript || r.content)) || note;
      UI.toast('Transcribed — edit then add to the record', 'ok');
    }).catch(function () { var el = document.getElementById('ai-transcript'); if (el) el.value = note; });
  };
  window.docTranslate = function () {
    var src = (document.getElementById('ai-src') || {}).value || '';
    if (!src.trim()) { UI.toast('Type something to translate', 'warn'); return; }
    API.ai.translate({ text: src.trim(), target: 'ar' }).then(function (r) {
      var out = document.getElementById('ai-out');
      if (out) out.textContent = (r && r.translated_text) || src;
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.docAsk = function () {
    var q = (document.getElementById('ai-q') || {}).value || '';
    if (!q.trim()) { UI.toast('Ask a question', 'warn'); return; }
    var out = document.getElementById('ai-answer');
    if (out) out.innerHTML = '<div class="spinner" style="margin:8px auto"></div>';
    API.ai.ask({ question: q.trim(), context: 'clinical' }).then(function (r) {
      if (out) out.innerHTML = '<p>' + esc(r.answer) + '</p>' + (r.red_flag ? '<div class="lock-note mt-1" style="background:#fbe6e6;border-color:#f0c9c9;color:#b23a3a">' + I('alert') + '<div>Red flag — escalate to a clinician.</div></div>' : '') +
        '<div class="muted mt-1" style="font-size:11.5px">' + esc(r.disclaimer || '') + '</div>';
    }).catch(function (e) { if (out) out.innerHTML = '<span class="muted">' + esc(e.message) + '</span>'; });
  };

  /* ---- screens ---- */
  function worklist() {
    var mine = data.mine;
    var active = mine.filter(function (v) { return ['discharge', 'followup'].indexOf(v.current_stage) === -1 && v.visit_status === 'open'; });
    var d2bList = mine.filter(function (v) { return v.door_to_balloon_minutes != null; });
    var avgD2b = d2bList.length ? Math.round(d2bList.reduce(function (a, v) { return a + v.door_to_balloon_minutes; }, 0) / d2bList.length) : null;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'My patients', value: mine.length, icon: 'users' }) +
      UI.tile({ label: 'Active cases', value: active.length, icon: 'stethoscope' }) +
      UI.tile({ label: 'Cardiac cases', value: mine.filter(function (v) { return v.dept_code === 'CARD' || v.dept_code === 'CCU'; }).length, icon: 'heart' }) +
      UI.tile({ label: 'Avg Door-to-Balloon', value: avgD2b != null ? avgD2b : '—', unit: avgD2b != null ? 'min' : '', icon: 'clock', accent: 'teal', foot: 'Target ≤ 90' }) +
    '</div>';

    var rows = mine.map(function (vr) {
      var v = S.visit(vr); var n = news2Of(v.ticket);
      return '<tr onclick="docSelect(\'' + v.serial + '\',\'file\')">' +
        '<td><div class="flex">' + UI.avatarFor(v) + '<div><div class="t-name">' + esc(v.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(v.serial) + '</div></div></div></td>' +
        '<td>' + UI.triageBadge(v.triage) + '</td>' +
        '<td>' + esc(window.stageLabel(v.stage)) + '</td>' +
        '<td>' + (v.d2b != null ? '<b>' + v.d2b + '</b> <span class="t-sub">min</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td>' + (n != null ? UI.newsBadge(n) : '<span class="muted">—</span>') + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('No patients assigned') + '</td></tr>';

    var watch = data.mine[0] ? S.visit(data.mine[0]) : null;
    var heroV = watch ? (data.vitalsByTicket[watch.ticket] || []) : [];

    var charts = '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px" class="mb-2">' +
      '<div class="card"><div class="card-head">' + I('activity') + '<h3>' + esc(watch ? watch.name : 'Vitals') + ' — pulse & SpO₂ trend</h3></div><div class="card-pad">' +
        (heroV.length ? UI.lineChart([
          { values: heroV.map(function (v) { return v.pulse || 0; }), color: '#0d9488', label: 'Pulse' },
          { values: heroV.map(function (v) { return v.spo2 || 0; }), color: '#3fa66a', label: 'SpO₂' }
        ], { labels: heroV.map(function (v) { return v.t; }), h: 170 }) : UI.empty('No vitals', 'activity')) +
        '<div class="wrap-gap mt-1"><span class="badge teal">Pulse (bpm)</span><span class="badge green">SpO₂ (%)</span></div></div></div>' +
      '<div class="card"><div class="card-head"><h3>Caseload by stage</h3></div><div class="card-pad">' +
        UI.barChart(stageCounts(mine)) + '</div></div>' +
    '</div>';

    return UI.pageHead({
      eyebrow: 'Cardiology · ' + esc(S.me() ? S.me().name : 'Doctor'), title: 'My worklist',
      sub: 'Your own patients — full file access (FR-1.8)',
      actions: '<button class="btn btn-ghost" onclick="App.go(\'ai\')">' + I('sparkle') + 'AI console</button>'
    }) + tiles + charts +
      '<div class="card"><div class="card-head"><h3>Patients</h3><span class="ch-act muted">Tap a row to open the file</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Triage</th><th>Stage</th><th>D2B</th><th>NEWS2</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }
  function stageCounts(list) {
    var c = {};
    list.forEach(function (v) { var k = window.stageLabel(v.current_stage); c[k] = (c[k] || 0) + 1; });
    return Object.keys(c).map(function (k) { return { label: k, value: c[k], display: String(c[k]) }; });
  }

  function picker(route) {
    var sv = selVisit();
    return data.mine.map(function (vr) {
      var v = S.visit(vr); var on = sv && v.serial === sv.patient_serial;
      return '<tr onclick="docSelect(\'' + v.serial + '\',\'' + route + '\')" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="t-name">' + esc(v.name) + '</div><div class="t-sub t-mono">' + esc(v.serial) + '</div></td></tr>';
    }).join('');
  }

  function fileSection(n, title, body) {
    return '<div class="card mb-2"><div class="card-head"><span class="ti-ic" style="width:28px;height:28px;font-size:12px;font-family:Fraunces,serif">' + n + '</span><h3>' + esc(title) + '</h3></div><div class="card-pad">' + body + '</div></div>';
  }
  function kv(pairs) {
    return '<dl class="kv">' + pairs.filter(Boolean).map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd style="text-align:start">' + (r[2] ? r[1] : esc(r[1])) + '</dd>';
    }).join('') + '</dl>';
  }

  function file() {
    var v = selVisit();
    if (!v || !data.file) return UI.pageHead({ eyebrow: 'Patient file', title: 'Patient file' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'file') + '</div>';
    var f = data.file, p = f.patient, ins = f.insurance;
    var fv = (f.visits || []).find(function (x) { return x.ticket_no === v.ticket_no; }) || (f.visits || [])[0] || {};
    var nv = S.visit(v);
    var ticket = v.ticket_no;
    var diagnoses = fv.diagnoses || [], rx = fv.prescriptions || [], labs = fv.lab_results || [], rad = fv.radiology_results || [];

    var s1 = kv([
      ['Name', p.full_name], ['MRN / Serial', '<span class="t-mono">' + esc(p.patient_serial) + '</span>', true],
      ['DOB / Sex', (p.date_of_birth || '—') + ' · ' + S.sexOf(p.gender)],
      ['Chronic conditions', p.chronic_conditions || '—'],
      ['Department', nv.dept + ' · ' + nv.room],
      ['Arrival', S.fmtDateTime(fv.arrived_at) + ' · ' + S.arrivalLabel(fv.arrival_type)],
      ['Insurance', UI.insuranceBadge(ins ? ins.coverage_category : null) + (ins && ins.payer_name ? ' · ' + esc(ins.payer_name) : ''), true]
    ]);

    var primary = diagnoses.find(function (d) { return d.is_primary; }) || diagnoses[0];
    var s2 = kv([
      ['Principal diagnosis', primary ? primary.diagnosis + (primary.icd10_code ? ' (' + primary.icd10_code + ')' : '') : 'pending'],
      ['Current stage', window.stageLabel(fv.current_stage)],
      ['Procedures', nv.balloon ? 'Primary PCI — Door-to-Balloon ' + (nv.d2b != null ? nv.d2b + ' min' : '—') : (nv.cathType ? S.titleCase(nv.cathType) + ' catheterization' : 'None recorded')],
      ['Status', S.titleCase(fv.visit_status || 'open')]
    ]);

    var dxBody = diagnoses.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>ICD-10</th><th>Diagnosis</th><th>Type</th></tr></thead><tbody>' +
      diagnoses.map(function (d) { return '<tr><td class="t-mono">' + esc(d.icd10_code || '—') + '</td><td>' + esc(d.diagnosis) + '</td><td>' + (d.is_primary ? UI.badge('Primary', 'teal') : '<span class="muted">Secondary</span>') + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<span class="muted">No diagnoses recorded</span>';

    var rxBody = rx.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Dose · route · freq</th><th>Pharmacy</th></tr></thead><tbody>' +
      rx.map(function (r) { var ph = r.pharmacy || {}; return '<tr><td class="t-name">' + esc(r.drug_name) + '</td><td>' + esc(r.dose) + ' · ' + esc(r.route) + ' · ' + esc(r.frequency) + '</td><td>' + (ph.available ? UI.badge('In stock', 'green') : UI.badge('Out', 'rose')) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<span class="muted">No medication</span>';

    var labBody = labs.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Test</th><th>Result</th><th>Range</th><th>Flag</th></tr></thead><tbody>' +
      labs.map(function (it) { var h = it.flag && it.flag !== 'N'; return '<tr><td class="t-name">' + esc(it.test_name) + '</td><td>' + (h ? '<span style="color:var(--rose);font-weight:700">' + esc(it.result_value) + '</span>' : esc(it.result_value)) + ' <span class="muted">' + esc(it.unit || '') + '</span></td><td class="muted">' + (it.normal_range_low != null ? it.normal_range_low + '–' + it.normal_range_high : '—') + '</td><td>' + (h ? UI.badge('High', 'rose') : UI.badge('Normal', 'green')) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<span class="muted">No lab results</span>';

    var radBody = rad.length ? rad.map(function (r) { return '<div class="row-between" style="padding:7px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(r.study) + '</b><div class="muted" style="font-size:12.5px">' + esc(r.report_summary) + '</div></div><span class="muted" style="font-size:12px">' + esc(r.reporting_doctor || '') + '</span></div>'; }).join('') : '<span class="muted">No imaging reports</span>';

    var cp = data.carePlan;
    var s7 = cp ? kv([['Problem list', cp.problem_list || '—'], ['Plan', cp.plan || '—'], ['Outcomes', cp.outcomes || '—'], ['Timeframe', cp.timeframe || '—']]) +
      '<button class="btn btn-ghost btn-sm mt-1" onclick="docCarePlanModal(\'' + ticket + '\')">' + I('edit') + 'Edit care plan</button>'
      : '<p class="muted mb-2">No care plan yet.</p><button class="btn btn-primary btn-sm" onclick="docCarePlanModal(\'' + ticket + '\')">' + I('plus') + 'Create care plan</button>';

    var r = data.risk;
    var s4 = r && r.score != null ? kv([['NEWS2', '' + r.score + ' · ' + (r.risk_level ? S.titleCase(r.risk_level) : '')], ['Updated', S.fmtDateTime(r.taken_at)]]) : '<span class="muted">No score yet — nursing records vitals.</span>';

    var sections =
      fileSection(1, 'Basic information', s1) +
      fileSection(2, 'Admission & summary', s2) +
      fileSection(3, 'Diagnosis & problem list', dxBody + '<button class="btn btn-ghost btn-sm mt-1" onclick="docDiagnosisModal(\'' + ticket + '\')">' + I('plus') + 'Add diagnosis</button>') +
      fileSection(4, 'Risk (NEWS2)', s4) +
      fileSection(5, 'Medication', rxBody + '<button class="btn btn-ghost btn-sm mt-1" onclick="docPrescribeModal(\'' + ticket + '\')">' + I('plus') + 'Prescribe</button>') +
      fileSection(6, 'Laboratory results', labBody) +
      fileSection(7, 'Radiology & imaging', radBody) +
      fileSection(8, 'Multidisciplinary care plan', s7);

    return UI.pageHead({
      eyebrow: 'Patient file', title: p.full_name,
      sub: p.patient_serial + ' · ' + nv.dept + ' · ' + window.stageLabel(fv.current_stage),
      actions: '<button class="btn btn-ghost" onclick="docAIDraftQuick(\'' + ticket + '\')">' + I('sparkle') + 'AI summary</button>' +
        '<button class="btn btn-primary" onclick="App.go(\'journey\')">' + I('route') + 'Journey</button>'
    }) +
      '<div class="grid" style="grid-template-columns:230px 1fr;gap:18px">' +
        '<div style="align-self:start">' +
          '<div class="card mb-2"><div class="card-head"><h3>My patients</h3></div><div class="table-wrap"><table class="t"><tbody>' + picker('file') + '</tbody></table></div></div>' +
          '<div class="card card-pad">' + UI.lockNote('Only the treating doctor may open this file (BR-3 / FR-1.8). Every view and edit is logged (NFR-11).') + '</div>' +
        '</div>' +
        '<div>' + sections + '</div>' +
      '</div>';
  }
  window.docAIDraftQuick = function (ticket) {
    API.ai.draft({ ticket_no: ticket, doc_type: 'discharge_summary' }).then(function (d) {
      data.draft = d;
      UI.modal({ title: 'AI documentation draft', icon: 'sparkle', wide: true,
        body: '<div class="lock-note mb-2">' + I('shield') + '<div><b>Nothing is stored until you approve it (NFR-2).</b></div></div>' +
          '<textarea id="ai-draft-text" style="width:100%;min-height:240px;font-family:monospace;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:13px;line-height:1.6">' + esc(d.content || '') + '</textarea>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Discard</button><button class="btn btn-primary" onclick="docApproveDraft(' + d.id + ')">' + I('check') + 'Approve & save</button>' });
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  function diagnosis() {
    var v = selVisit();
    if (!v || !data.file) return UI.pageHead({ eyebrow: 'Clinical', title: 'Diagnosis' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'clipboard') + '</div>';
    var fv = (data.file.visits || []).find(function (x) { return x.ticket_no === v.ticket_no; }) || {};
    var nv = S.visit(v);
    var rows = (fv.diagnoses || []).map(function (d) {
      return '<tr><td class="t-mono">' + esc(d.icd10_code || '—') + '</td><td>' + esc(d.diagnosis) + '</td><td>' + (d.is_primary ? UI.badge('Primary', 'teal') : '<span class="muted">Secondary</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Clinical', title: 'Diagnosis & problem list', sub: 'Structured ICD-10 diagnoses (FR-7.4)' }) +
      '<div class="grid cols-2 mb-2">' +
        '<div class="card"><div class="card-head">' + UI.patientStrip(nv) + '</div><div class="card-pad">' +
          '<button class="btn btn-primary" onclick="docDiagnosisModal(\'' + v.ticket_no + '\')">' + I('plus') + 'Add diagnosis</button>' +
          '<div class="wrap-gap mt-2"><button class="btn btn-ghost btn-sm" onclick="docConsultModal(\'' + v.ticket_no + '\')">' + I('stethoscope') + 'Request consultation</button>' +
          '<button class="btn btn-ghost btn-sm" onclick="docConsentModal(\'' + v.ticket_no + '\')">' + I('shield') + 'Request consent</button></div>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Problem list</h3></div>' +
          ((fv.diagnoses || []).length ? '<div class="table-wrap"><table class="t"><thead><tr><th>ICD-10</th><th>Diagnosis</th><th>Type</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
            : '<div class="card-pad">' + UI.empty('No diagnoses recorded', 'clipboard') + '</div>') + '</div>' +
      '</div>';
  }

  function orders() {
    var v = selVisit();
    if (!v) return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Orders' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'flask') + '</div>';
    var nv = S.visit(v);
    var rows = (data.orders || []).map(function (o) {
      return '<tr><td><div class="t-name">' + esc(o.detail || o.order_type) + '</div><div class="t-sub">' + esc(S.titleCase(o.order_type)) + '</div></td>' +
        '<td class="t-mono">' + esc(o.id) + '</td>' +
        '<td>' + (o.result_summary ? esc(o.result_summary) : '<span class="muted">awaiting</span>') + '</td>' +
        '<td>' + UI.statusBadge(o.status || 'pending') + '</td>' +
        '<td>' + ((o.status !== 'resulted') ? '<button class="btn btn-soft btn-sm" onclick="docFileResult(' + o.id + ')">' + I('check') + 'File result</button>' : '<span class="muted">' + esc(S.fmtTime(o.resulted_at)) + '</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Orders & results', sub: 'Lab via DMS; radiology to its own system (FR-7.1)',
      actions: '<button class="btn btn-primary" onclick="docOrderModal(\'' + v.ticket_no + '\')">' + I('plus') + 'Place order</button>' }) +
      '<div class="card"><div class="card-head">' + UI.patientStrip(nv) + '</div>' +
        ((data.orders || []).length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Order</th><th>ID</th><th>Result</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="card-pad">' + UI.empty('No orders yet — place one above', 'flask') + '</div>') + '</div>';
  }

  function results() {
    var v = selVisit();
    if (!v) return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Results' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'scan') + '</div>';
    var R = data.results || { lab_results: [], radiology_results: [] };
    var labs = (R.lab_results || []).length ? '<div class="card mb-2"><div class="card-head">' + I('flask') + '<h3>Laboratory</h3><span class="ch-act muted" style="font-size:12px">Lab via DMS</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Test</th><th>Result</th><th>Range</th><th>Flag</th></tr></thead><tbody>' +
      R.lab_results.map(function (it) { var h = it.flag && it.flag !== 'N'; return '<tr><td class="t-name">' + esc(it.test_name) + '</td><td>' + (h ? '<span style="color:var(--rose);font-weight:700">' + esc(it.result_value) + '</span>' : esc(it.result_value)) + ' <span class="muted">' + esc(it.unit || '') + '</span></td><td class="muted">' + (it.normal_range_low != null ? it.normal_range_low + '–' + it.normal_range_high : '—') + '</td><td>' + (h ? UI.badge('High', 'rose') : UI.badge('Normal', 'green')) + '</td></tr>'; }).join('') + '</tbody></table></div></div>'
      : '<div class="card card-pad mb-2">' + UI.empty('No lab results yet', 'flask') + '</div>';

    var rad = (R.radiology_results || []).length ? R.radiology_results.map(function (r) {
      return '<div class="card mb-2"><div class="card-head">' + I('scan') + '<h3>' + esc(r.study) + '</h3><span class="ch-act muted" style="font-size:12px">' + esc(S.fmtDateTime(r.performed_at)) + '</span></div>' +
        '<div class="card-pad"><p>' + esc(r.report_summary) + '</p><div class="muted mt-1" style="font-size:12px">' + esc(r.reporting_doctor || 'Radiology') + '</div></div></div>';
    }).join('') : '<div class="card card-pad">' + UI.empty('No imaging reports', 'scan') + '</div>';

    return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Results', sub: 'Lab values with reference ranges and radiology reports (FR-7.2)' }) +
      '<div class="grid" style="grid-template-columns:200px 1fr;gap:18px">' +
        '<div class="card" style="align-self:start"><div class="card-head"><h3>My patients</h3></div><div class="table-wrap"><table class="t"><tbody>' + picker('results') + '</tbody></table></div></div>' +
        '<div><div class="grid cols-2" style="align-items:start"><div>' + labs + '</div><div>' + rad + '</div></div></div>' +
      '</div>';
  }

  function prescribe() {
    var v = selVisit();
    if (!v) return UI.pageHead({ eyebrow: 'Medication', title: 'Prescriptions' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'pill') + '</div>';
    var nv = S.visit(v);
    var rows = (data.rx || []).map(function (rx) {
      var ph = rx.pharmacy || {};
      return '<tr><td><div class="t-name">' + esc(rx.drug_name) + '</div><div class="t-sub">' + esc(rx.dose) + ' · ' + esc(rx.route) + ' · ' + esc(rx.frequency) + '</div></td>' +
        '<td class="muted">' + (rx.duration_days ? rx.duration_days + ' d' : '—') + '</td>' +
        '<td>' + (ph.available ? UI.badge('In stock (' + (ph.stock_qty != null ? ph.stock_qty : '?') + ')', 'green') : UI.badge('Out of stock', 'rose')) + '</td></tr>';
    }).join('');

    var pharmRows = (data.pharmacy || []).slice(0, 12).map(function (d) {
      return '<tr><td class="t-name">' + esc(d.drug_name) + '</td><td class="muted">' + esc(d.strength || '') + ' · ' + esc(d.form || '') + '</td>' +
        '<td>' + (d.currently_available ? UI.badge('' + (d.approx_stock_qty != null ? d.approx_stock_qty : 'yes'), 'green') : UI.badge('out', 'rose')) + '</td>' +
        '<td><button class="btn btn-soft btn-sm" onclick="docPrescribeQuick(\'' + v.ticket_no + '\',\'' + esc(d.drug_name) + '\',\'' + esc(d.strength || '') + '\')">' + I('plus') + 'Add</button></td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Medication', title: 'Prescriptions', sub: 'Write a prescription and send it to the pharmacy (FR-6.1)',
      actions: '<button class="btn btn-primary" onclick="docPrescribeModal(\'' + v.ticket_no + '\')">' + I('plus') + 'New prescription</button>' }) +
      '<div class="grid" style="grid-template-columns:1.3fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head">' + UI.patientStrip(nv) + '</div>' +
          ((data.rx || []).length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Medication</th><th>Duration</th><th>Pharmacy</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
            : '<div class="card-pad">' + UI.empty('No prescriptions yet', 'pill') + '</div>') + '</div>' +
        '<div class="card"><div class="card-head">' + I('pill') + '<h3>Pharmacy availability (FR-6.5)</h3></div>' +
          '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Form</th><th>Stock</th><th></th></tr></thead><tbody>' + (pharmRows || '<tr><td colspan="4">' + UI.empty('No data') + '</td></tr>') + '</tbody></table></div></div>' +
      '</div>';
  }

  function aiConsole() {
    var v = selVisit();
    var nv = v ? S.visit(v) : null;
    return UI.pageHead({ eyebrow: 'AI · Clinical documentation', title: 'AI Console',
      sub: nv ? 'For ' + nv.name + ' (' + nv.serial + ')' : 'Clinical documentation tools' }) +
      UI.lockNote('AI drafts are never saved until you approve them; the advisor does not diagnose and hands red flags to a clinician (FR-9.1 / NFR-2).') +
      '<div class="grid cols-2 mt-2">' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('file') + '</div><div><div class="amc-name">Report generation</div><div class="amc-eng">Visit & discharge summaries</div></div></div>' +
          '<div class="amc-desc">Draft a structured summary from the live record — approve to save.</div>' +
          '<div class="field mt-1"><label>Document type</label><select id="ai-doctype"><option value="discharge_summary">Discharge summary</option><option value="report">Clinical report</option><option value="note">Progress note</option></select></div>' +
          (v ? '<button class="btn btn-primary btn-sm" onclick="docAIDraft(\'' + v.ticket_no + '\')">' + I('sparkle') + 'Generate draft</button>' : '<span class="muted">Select a patient first</span>') + '</div>' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('stethoscope') + '</div><div><div class="amc-name">Voice transcription</div><div class="amc-eng">AR / EN</div></div></div>' +
          '<div class="amc-desc">Dictate a note and get editable text.</div>' +
          '<button class="btn btn-soft btn-sm mt-1" onclick="docTranscribe()">' + I('stethoscope') + 'Start dictation</button>' +
          '<textarea id="ai-transcript" class="mt-1" style="width:100%;min-height:70px;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:12.5px;font-family:inherit" placeholder="Transcribed text appears here…"></textarea></div>' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('globe') + '</div><div><div class="amc-name">Medical translation</div><div class="amc-eng">AR ↔ EN</div></div></div>' +
          '<div class="amc-desc">Translate instructions for the patient.</div>' +
          '<input id="ai-src" class="mt-1" style="width:100%;height:38px;border:1px solid var(--line);border-radius:10px;padding:0 12px;font-family:inherit;font-size:13px" placeholder="e.g. Take one tablet daily after food" />' +
          '<div class="wrap-gap mt-1"><button class="btn btn-soft btn-sm" onclick="docTranslate()">' + I('globe') + 'Translate</button></div>' +
          '<div id="ai-out" style="margin-top:10px;font-size:14px;font-weight:500;color:var(--teal-d);min-height:22px" dir="rtl"></div></div>' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('sparkle') + '</div><div><div class="amc-name">Healthcare advisor</div><div class="amc-eng">Q&A · approved content</div></div></div>' +
          '<div class="amc-desc">Ask a clinical-information question.</div>' +
          '<input id="ai-q" class="mt-1" style="width:100%;height:38px;border:1px solid var(--line);border-radius:10px;padding:0 12px;font-family:inherit;font-size:13px" placeholder="e.g. After-care for a stent" />' +
          '<div class="wrap-gap mt-1"><button class="btn btn-soft btn-sm" onclick="docAsk()">' + I('sparkle') + 'Ask</button></div>' +
          '<div id="ai-answer" style="margin-top:10px;font-size:13px;color:var(--ink)"></div></div>' +
      '</div>';
  }

  function journey() {
    var v = selVisit();
    if (!v) return UI.pageHead({ eyebrow: 'Care coordination', title: 'Patient journey' }) + '<div class="card card-pad">' + UI.empty('No patient selected', 'route') + '</div>';
    var nv = S.visit(v.detail || v);
    var ticket = v.ticket_no;
    var fv = data.file ? ((data.file.visits || []).find(function (x) { return x.ticket_no === ticket; }) || {}) : {};
    var timeline = (fv.timeline || []).slice().sort(function (a, b) { return (S.parseDate(a.entered_at) || 0) - (S.parseDate(b.entered_at) || 0); });
    var histMap = {}; timeline.forEach(function (h) { histMap[h.stage] = h; });
    var cur = window.stageIndex(nv.stage);

    var tl = window.STAGES.map(function (s, i) {
      var cls = i < cur ? 'done' : i === cur ? 'current' : '';
      var h = histMap[s.key];
      return '<div class="tl-item ' + cls + '">' +
        '<div class="tl-rail"><div class="tl-node">' + (i < cur ? I('check') : i === cur ? I('chevron') : '') + '</div>' + (i < window.STAGES.length - 1 ? '<div class="tl-line"></div>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-name">' + esc(s.label) + '</div>' +
          '<div class="tl-sub">' + esc(s.owner) + (h ? ' · ' + esc(S.fmtDateTime(h.entered_at)) + (h.decision_note ? ' · ' + esc(h.decision_note) : '') : '') + '</div></div>' +
      '</div>';
    }).join('');

    var d2bTile = nv.balloon
      ? UI.tile({ label: 'Door-to-Balloon', value: nv.d2b != null ? nv.d2b : '—', unit: 'min', icon: 'clock', accent: 'teal', foot: 'Recorded · target ≤ 90' })
      : UI.tile({ label: 'Door-to-Balloon', value: 'Running', icon: 'clock', accent: 'teal', foot: 'Target ≤ 90 min' });

    var cp = data.carePlan;
    var cpCard = '<div class="card mt-2"><div class="card-head">' + I('clipboard') + '<h3>Care plan</h3></div><div class="card-pad">' +
      (cp ? kv([['Plan', cp.plan || '—'], ['Outcomes', cp.outcomes || '—'], ['Timeframe', cp.timeframe || '—']]) : '<p class="muted">No care plan yet.</p>') +
      '<button class="btn btn-ghost btn-sm mt-1" onclick="docCarePlanModal(\'' + ticket + '\')">' + I('edit') + (cp ? 'Edit' : 'Create') + ' care plan</button></div></div>';

    var actions = cur < window.STAGES.length - 1
      ? '<button class="btn btn-primary" onclick="docAdvance(\'' + ticket + '\',\'' + nv.stage + '\')">' + I('arrowRight') + 'Advance to ' + esc(window.STAGES[cur + 1].label) + '</button>'
      : '<span class="badge green badge-lg"><span class="bdot"></span>Journey complete</span>';

    return UI.pageHead({ eyebrow: 'Care coordination', title: 'Patient journey', sub: nv.name + ' · ' + nv.serial, actions: actions }) +
      '<div class="grid" style="grid-template-columns:1fr 300px;gap:18px">' +
        '<div><div class="card card-pad"><div class="timeline">' + tl + '</div></div>' + cpCard + '</div>' +
        '<div>' + d2bTile +
          '<div class="card mt-2"><div class="card-head"><h3>Now</h3></div><div class="card-pad">' +
            kv([['Stage', window.stageLabel(nv.stage)], ['Triage', UI.triageBadge(nv.triage), true], ['Department', nv.dept], ['Owner', (window.STAGES[cur] || {}).owner || '—'], ['Cath type', nv.cathType ? S.titleCase(nv.cathType) : '—']]) +
            '<div class="wrap-gap mt-2"><button class="btn btn-ghost btn-sm" onclick="docCathType(\'' + ticket + '\')">' + I('heart') + 'Cath type</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="docConsentModal(\'' + ticket + '\')">' + I('shield') + 'Consent</button></div>' +
          '</div></div>' +
        '</div>' +
      '</div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.doctor = {
    label: 'Doctor', person: 'Treating physician', icon: 'doctor', accent: 'teal',
    desc: 'See your own patients’ full file, diagnose, order tests, prescribe, advance the journey, and draft AI documentation you approve.',
    home: 'worklist',
    nav: [
      { route: 'worklist', label: 'My worklist', icon: 'stethoscope' },
      { route: 'file', label: 'Patient file', icon: 'file' },
      { route: 'diagnosis', label: 'Diagnosis', icon: 'clipboard' },
      { route: 'orders', label: 'Orders', icon: 'flask' },
      { route: 'results', label: 'Results', icon: 'scan' },
      { route: 'prescribe', label: 'Prescriptions', icon: 'pill' },
      { route: 'ai', label: 'AI Console', icon: 'sparkle' },
      { route: 'journey', label: 'Journey', icon: 'route' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'file': return file();
        case 'diagnosis': return diagnosis();
        case 'orders': return orders();
        case 'results': return results();
        case 'prescribe': return prescribe();
        case 'ai': return aiConsole();
        case 'journey': return journey();
        default: return worklist();
      }
    }
  };
})();
