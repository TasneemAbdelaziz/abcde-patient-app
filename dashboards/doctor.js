/* ============================================================
   A.B.C.D.E — Staff Dashboards · doctor.js
   The treating doctor sees their own patients' full file
   (FR-1.8). They diagnose and set the problem list (FR-7.x),
   order lab/radiology (FR-7.1, lab via DMS, radiology to its
   own system), prescribe to the pharmacy (FR-6.1), advance the
   journey and record the Door-to-Balloon time (FR-15.2), and
   use AI documentation drafts that are saved only after the
   doctor approves them (FR-9.1 / NFR-2).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  function myPatients() {
    // the treating physician's own patients only
    return window.DB.patients.filter(function (p) { return p.doctor === window.STAFF.doctor.name; });
  }
  function latest(p) { return p.vitals.length ? p.vitals[p.vitals.length - 1] : null; }

  /* ---- actions ---- */
  window.docAdvance = function (serial) {
    var p = window.findPatient(serial);
    var idx = window.stageIndex(p.stage);
    if (idx >= window.STAGES.length - 1) { UI.toast('Patient is at the final stage', 'warn'); return; }
    var next = window.STAGES[idx + 1];
    p.stage = next.key;
    var at = new Date().toTimeString().slice(0, 5);
    var note = next.owner;
    // record Door-to-Balloon when the catheterization is reached (FR-15.2)
    if (next.key === 'cath' && !p.balloonTime) {
      p.balloonTime = new Date().toISOString().slice(0, 16);
      var d2b = window.doorToBalloon(p);
      note = 'Cath-lab' + (d2b != null ? ' · Door-to-Balloon ' + d2b + ' min' : '');
      UI.toast('Door-to-Balloon recorded' + (d2b != null ? ': ' + d2b + ' min' : ''), 'ok');
    } else {
      UI.toast(p.name + ' → ' + next.label, 'ok');
    }
    p.stageHistory.push({ stage: next.key, at: at, by: note });
    window.render();
  };

  window.docAddProblem = function (serial) {
    var code = (document.getElementById('dx-code') || {}).value || '';
    var label = (document.getElementById('dx-label') || {}).value || '';
    if (!label) { UI.toast('Enter a diagnosis', 'warn'); return; }
    var p = window.findPatient(serial);
    p.problems.unshift({ code: code || '—', label: label, at: new Date().toISOString().slice(0, 10) });
    UI.toast('Added to problem list: ' + label, 'ok');
    window.render();
  };

  window.docOrder = function (serial) {
    var type = (document.getElementById('ord-type') || {}).value || 'Lab';
    var test = (document.getElementById('ord-test') || {}).value || '';
    if (!test) { UI.toast('Enter a test to order', 'warn'); return; }
    var p = window.findPatient(serial);
    var dest = type === 'Radiology' ? 'Radiology (Milestone)' : type === 'Lab' ? 'Lab (via DMS)' : 'Cardiology';
    p.orders.unshift({ id: 'O-' + (3400 + p.orders.length + Math.floor(p.serial.length)), type: type, test: test, dest: dest, status: 'pending', result: null, at: new Date().toTimeString().slice(0, 5) });
    UI.toast(type + ' ordered → ' + dest, 'ok');
    window.render();
  };

  window.docPrescribe = function (serial) {
    var get = function (id) { return (document.getElementById(id) || {}).value || ''; };
    var drug = get('rx-drug');
    if (!drug) { UI.toast('Enter a drug', 'warn'); return; }
    var p = window.findPatient(serial);
    p.prescriptions.push({
      id: 'RX-' + (7800 + p.prescriptions.length), drug: drug, dose: get('rx-dose'),
      route: get('rx-route') || 'PO', freq: get('rx-freq') || 'OD', status: 'due', lastGiven: null
    });
    UI.toast(drug + ' prescribed → pharmacy', 'ok');
    UI.closeModal();
    window.render();
  };

  window.docPrescribeModal = function (serial) {
    UI.modal({
      title: 'New prescription', icon: 'pill',
      body:
        '<div class="field"><label>Drug</label><input id="rx-drug" placeholder="e.g. Bisoprolol" /></div>' +
        '<div class="field-row"><div class="field"><label>Dose</label><input id="rx-dose" placeholder="e.g. 2.5 mg" /></div>' +
        '<div class="field"><label>Route</label><select id="rx-route"><option>PO</option><option>IV</option><option>IM</option><option>SC</option></select></div></div>' +
        '<div class="field"><label>Frequency</label><input id="rx-freq" placeholder="e.g. OD" /></div>' +
        '<div class="lock-note">' + I('pill') + '<div>Today doctors prescribe from memory of what is around — live stock and alternatives come with pharmacy integration (FR-6.5).</div></div>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="docPrescribe(\'' + serial + '\')">' + I('check') + 'Send to pharmacy</button>'
    });
  };

  window.docResultIn = function (serial, orderId) {
    var p = window.findPatient(serial);
    var o = p.orders.find(function (x) { return x.id === orderId; });
    if (o) { o.status = 'resulted'; o.result = o.result || 'Result received — within normal limits'; UI.toast('Result received for ' + o.test, 'ok'); window.render(); }
  };

  window.docAIDraft = function (serial) {
    var p = window.findPatient(serial);
    var dx = p.problems[0] ? p.problems[0].label : 'cardiac assessment';
    var draft =
      'DISCHARGE / VISIT SUMMARY (DRAFT — not saved)\n\n' +
      'Patient: ' + p.name + '  ·  Serial: ' + p.serial + '\n' +
      'Treating physician: ' + window.STAFF.doctor.name + '  ·  ' + p.department + '\n\n' +
      'Reason for visit: ' + (p.complaint || '—') + '\n' +
      'Principal diagnosis: ' + dx + (p.problems[0] && p.problems[0].code ? ' (' + p.problems[0].code + ')' : '') + '\n\n' +
      'Course: The patient was managed along the cardiac pathway. ' +
      (p.balloonTime ? 'Primary PCI was performed; Door-to-Balloon ' + (window.doorToBalloon(p) || '—') + ' min. ' : 'Investigations were ordered and reviewed. ') +
      'Medication and observations as per the record.\n\n' +
      'Plan: Continue current medication, cardiology follow-up, and the home follow-up plan in the app.\n';
    UI.modal({
      title: 'AI documentation draft', icon: 'sparkle', wide: true,
      body:
        '<div class="lock-note mb-2">' + I('shield') + '<div><b>Nothing is stored until you approve it (FR-9.1 / NFR-2).</b> The advisor drafts; the doctor signs off.</div></div>' +
        '<textarea style="width:100%;min-height:240px;font-family:monospace;font-size:12.5px;border:1px solid var(--line);border-radius:10px;padding:13px;line-height:1.6">' + esc(draft) + '</textarea>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Discard</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();UI.toast(\'Report approved & saved to the record\',\'ok\')">' + I('check') + 'Approve & save</button>'
    });
  };

  /* ---- screens ---- */
  function worklist() {
    var mine = myPatients();
    var active = mine.filter(function (p) { return ['discharge', 'followup'].indexOf(p.stage) === -1; });
    var hero = window.findPatient('ALM-20413');
    var d2bOpen = hero && !hero.balloonTime;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'My patients', value: mine.length, icon: 'users' }) +
      UI.tile({ label: 'Active cases', value: active.length, icon: 'stethoscope' }) +
      UI.tile({ label: 'Pending results', value: mine.reduce(function (a, p) { return a + p.orders.filter(function (o) { return o.status === 'pending'; }).length; }, 0), icon: 'flask' }) +
      (d2bOpen
        ? UI.tile({ label: 'Door-to-Balloon', value: 'Running', icon: 'clock', accent: 'teal', foot: hero.name + ' · awaiting cath' })
        : UI.tile({ label: 'Door-to-Balloon', value: (hero && window.doorToBalloon(hero)) || '—', unit: 'min', icon: 'clock' })) +
    '</div>';

    var rows = mine.map(function (p) {
      var l = latest(p);
      return '<tr onclick="STATE.selectedSerial=\'' + p.serial + '\';STATE.route=\'file\';render()">' +
        '<td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(p.serial) + '</div></div></div></td>' +
        '<td>' + esc(p.complaint || '—').slice(0, 38) + '</td>' +
        '<td>' + UI.triageBadge(p.triage) + '</td>' +
        '<td>' + esc(window.stageLabel(p.stage)) + '</td>' +
        '<td>' + (l ? UI.newsBadge(l.news2) : '<span class="muted">—</span>') + '</td>' +
      '</tr>';
    }).join('');

    // charts: hero vitals trend + orders status across my patients
    var heroV = hero ? hero.vitals : [];
    var pulseSeries = heroV.map(function (v) { return v.pulse; });
    var newsSeries = heroV.map(function (v) { return v.news2; });
    var allOrders = mine.reduce(function (a, p) { return a.concat(p.orders); }, []);
    var resulted = allOrders.filter(function (o) { return o.status === 'resulted'; }).length;
    var pending = allOrders.filter(function (o) { return o.status === 'pending'; }).length;

    var charts = '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px" class="mb-2">' +
      '<div class="card"><div class="card-head">' + I('activity') + '<h3>' + esc(hero ? hero.name : 'Vitals') + ' — pulse & NEWS2 trend</h3></div><div class="card-pad">' +
        (heroV.length ? UI.lineChart([
          { values: pulseSeries, color: '#0d9488', label: 'Pulse' },
          { values: newsSeries.map(function (n) { return n * 12; }), color: '#e0a458', label: 'NEWS2 ×12' }
        ], { labels: heroV.map(function (v) { return v.t; }), h: 170 }) : UI.empty('No vitals', 'activity')) +
        '<div class="wrap-gap mt-1"><span class="badge teal">Pulse (bpm)</span><span class="badge gold">NEWS2 (scaled)</span></div></div></div>' +
      '<div class="card"><div class="card-head"><h3>Orders status</h3></div><div class="card-pad">' +
        UI.donut([{ label: 'Resulted', value: resulted, color: '#3fa66a' }, { label: 'Pending', value: pending, color: '#e0a458' }], { centerValue: allOrders.length, centerLabel: 'orders' }) +
        '</div></div>' +
    '</div>';

    return UI.pageHead({
      eyebrow: 'Cardiology · ' + esc(window.STAFF.doctor.name), title: 'My worklist',
      sub: 'Your own patients — full file access (FR-1.8)',
      actions: '<button class="btn btn-ghost" onclick="STATE.route=\'ai\';render()">' + I('sparkle') + 'AI console</button>' +
        '<button class="btn btn-primary" onclick="STATE.selectedSerial=\'ALM-20413\';STATE.route=\'journey\';render()">' + I('route') + 'Cardiac journey</button>'
    }) + tiles + charts +
      '<div class="card"><div class="card-head"><h3>Patients</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Complaint</th><th>Triage</th><th>Stage</th><th>NEWS2</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  // AI Console — clinical documentation workspace (S9)
  window.docTranscribe = function () {
    UI.toast('Listening… (Whisper)', 'ok');
    setTimeout(function () {
      var el = document.getElementById('ai-transcript');
      if (el) el.value = 'Patient comfortable, chest pain resolved after PCI. Vitals stable, SpO2 97% on room air. Continue dual antiplatelet therapy. Plan: step down to ward, cardiology review tomorrow.';
      UI.toast('Transcribed — edit then add to the record', 'ok');
    }, 800);
  };
  window.docTranslate = function () {
    var src = (document.getElementById('ai-src') || {}).value || '';
    var out = document.getElementById('ai-out');
    if (!src) { UI.toast('Type something to translate', 'warn'); return; }
    var map = {
      'take one tablet twice daily after food': 'تناول قرصاً واحداً مرتين يومياً بعد الطعام',
      'rest and avoid exertion for two weeks': 'الراحة وتجنّب المجهود لمدة أسبوعين',
      'come back if you feel chest pain': 'عُد إلى المستشفى إذا شعرت بألم في الصدر'
    };
    var key = src.trim().toLowerCase();
    if (out) out.textContent = map[key] || ('«ترجمة طبية» ' + src);
  };

  function aiConsole() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    return UI.pageHead({
      eyebrow: 'AI · Clinical documentation', title: 'AI Console',
      sub: 'Draft reports, transcribe voice, and translate — for ' + esc(p.name) + ' (' + esc(p.serial) + ')',
      actions: '<button class="btn btn-ghost" onclick="AI.open()">' + I('sparkle') + 'Open assistant</button>'
    }) +
      UI.lockNote('AI drafts are never saved to the record until you approve them; the advisor does not diagnose and hands red flags to a clinician (FR-9.1 / NFR-2).') +
      '<div class="grid cols-3 mt-2">' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('file') + '</div><div><div class="amc-name">Report generation</div><div class="amc-eng">Visit & discharge summaries</div></div></div>' +
          '<div class="amc-desc">Draft a structured summary from the record — reason, diagnosis, course, medication and follow-up.</div>' +
          '<button class="btn btn-primary btn-sm mt-1" onclick="docAIDraft(\'' + p.serial + '\')">' + I('sparkle') + 'Generate draft</button></div>' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('stethoscope') + '</div><div><div class="amc-name">Voice transcription</div><div class="amc-eng">Whisper · AR / EN</div></div></div>' +
          '<div class="amc-desc">Dictate a note and get editable text.</div>' +
          '<button class="btn btn-soft btn-sm mt-1" onclick="docTranscribe()">' + I('stethoscope') + 'Start dictation</button>' +
          '<textarea id="ai-transcript" class="mt-1" style="width:100%;min-height:70px;border:1px solid var(--line);border-radius:10px;padding:10px;font-size:12.5px;font-family:inherit" placeholder="Transcribed text appears here…"></textarea></div>' +
        '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('globe') + '</div><div><div class="amc-name">Medical translation</div><div class="amc-eng">AR ↔ EN</div></div></div>' +
          '<div class="amc-desc">Translate instructions for the patient.</div>' +
          '<input id="ai-src" class="mt-1" style="width:100%;height:38px;border:1px solid var(--line);border-radius:10px;padding:0 12px;font-family:inherit;font-size:13px" placeholder="e.g. Take one tablet twice daily after food" />' +
          '<div class="wrap-gap mt-1"><button class="btn btn-soft btn-sm" onclick="docTranslate()">' + I('globe') + 'Translate</button></div>' +
          '<div id="ai-out" style="margin-top:10px;font-size:14px;font-weight:500;color:var(--teal-d);min-height:22px" dir="rtl"></div></div>' +
      '</div>';
  }

  // the 11-section patient file (6.2)
  function fileSection(p, n, title, body) {
    return '<div class="card mb-2"><div class="card-head"><span class="ti-ic" style="width:28px;height:28px;font-size:12px;font-family:Fraunces,serif">' + n + '</span><h3>' + esc(title) + '</h3></div><div class="card-pad">' + body + '</div></div>';
  }

  function kv(pairs) {
    return '<dl class="kv">' + pairs.filter(Boolean).map(function (r) {
      return '<dt>' + esc(r[0]) + '</dt><dd style="text-align:start">' + (r[2] ? r[1] : esc(r[1])) + '</dd>';
    }).join('') + '</dl>';
  }

  function file() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var l = latest(p);
    var c = p.clinical || {};
    var d2b = window.doorToBalloon(p);

    var picker = myPatients().map(function (x) {
      var on = x.serial === p.serial;
      return '<tr onclick="STATE.selectedSerial=\'' + x.serial + '\';render()" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="t-name">' + esc(x.name) + '</div><div class="t-sub t-mono">' + esc(x.serial) + '</div></td></tr>';
    }).join('');

    // edit-window / audit banner (NFR-11)
    var au = c.audit;
    var auditBanner = au
      ? '<div class="lock-note mb-2" style="' + (au.within15 ? '' : 'background:#fbe6e6;border-color:#f0c9c9;color:#b23a3a') + '">' + I(au.within15 ? 'edit' : 'shield') +
        '<div>' + (au.within15
          ? '<b>Editable for 15 minutes.</b> Last edited by ' + esc(au.lastEditedBy) + ' at ' + esc(au.at) + '. After the window only the system admin may change this record (NFR-11).'
          : '<b>Record locked.</b> The 15-minute self-edit window has closed — changes require the system admin.') + '</div></div>'
      : '';

    // S1 basic info
    var s1 = kv([
      ['Name', p.name], ['MRN / Serial', '<span class="t-mono">' + esc(p.serial) + '</span>', true],
      ['National ID', '<span class="t-mono">' + esc(p.nationalId) + '</span>', true],
      ['DOB / Age / Sex', (p.dob || '—') + ' · ' + p.age + ' · ' + p.sex],
      ['Treating doctor', p.doctor || '—'], ['Department', p.department + ' · ' + p.room],
      ['Admission', p.doorTime ? p.doorTime.replace('T', ' ') : '—'], ['Insurance', UI.insuranceBadge(p.insurance), true]
    ]);
    // S2 admission & discharge summary
    var s2 = kv([
      ['Reason', p.complaint || '—'],
      ['Final diagnosis', p.problems[0] ? p.problems[0].label + (p.problems[0].code !== '—' ? ' (' + p.problems[0].code + ')' : '') : 'pending'],
      ['Comorbidities', (c.comorbidities && c.comorbidities.length) ? c.comorbidities.join(', ') : '—'],
      ['Procedures', p.balloonTime ? 'Primary PCI — Door-to-Balloon ' + (d2b || '—') + ' min' : 'None recorded'],
      ['Length of stay', p.stage === 'ward' || p.stage === 'recovery' ? 'In progress' : '—'],
      ['Condition', p.riskScore ? p.riskScore.value + ' risk' : 'stable'],
      ['Recommendations', 'Cardiology follow-up, dual antiplatelet therapy, home follow-up plan']
    ]);
    // S3 personal history
    var s3 = kv([
      ['Allergies', p.allergies.length ? p.allergies.join(', ') : 'NKDA'],
      ['Habits', c.habits || '—'], ['Presenting complaint', p.complaint || '—'],
      ['Past medical', c.pastMedical || '—'], ['Past surgical', c.pastSurgical || '—'],
      ['Family history', c.familyHistory || '—'], ['Social history', c.socialHistory || '—'],
      ['Systems review', c.systemsReview || '—'],
      ['Current medication', p.prescriptions.length ? p.prescriptions.map(function (rx) { return rx.drug; }).join(', ') : 'none']
    ]);
    // S4 RSTP
    var r = c.rstp;
    var s4 = r ? kv([
      ['Staff / method', r.staff + ' · ' + r.method], ['Risk level (RSTP)', r.risk],
      ['Hemodynamic', r.hemodynamic], ['Respiratory', r.respiratory], ['Neurological', r.neuro], ['Support', r.support]
    ]) : (p.riskScore ? kv([['Risk level', p.riskScore.value], ['Tool', p.riskScore.tool], ['Hemodynamic', l ? 'BP ' + l.sbp + '/' + l.dbp + ', HR ' + l.pulse : '—']]) : '<span class="muted">Not yet scored</span>');
    // S5 daily antibiotics
    var s5 = (c.antibiotics && c.antibiotics.length)
      ? '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Sample / culture</th><th>Reason</th><th>Dose · route · duration</th></tr></thead><tbody>' +
        c.antibiotics.map(function (a) { return '<tr><td class="t-name">' + esc(a.drug) + '</td><td>' + esc(a.sample) + ' · ' + esc(a.culture) + '</td><td>' + esc(a.reason) + '</td><td>' + esc(a.dose) + ' · ' + esc(a.route) + ' · ' + esc(a.duration) + '</td></tr>'; }).join('') + '</tbody></table></div>'
      : '<span class="muted">No antibiotics charted</span>';
    // S6 medication & administration
    var s6 = p.prescriptions.length
      ? '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Dose · route · freq</th><th>Status</th></tr></thead><tbody>' +
        p.prescriptions.map(function (rx) {
          var tone = rx.status === 'given' ? 'green' : rx.status === 'due' ? 'rose' : rx.status === 'unavailable' || rx.status === 'refused' ? 'slate' : 'gold';
          return '<tr><td class="t-name">' + esc(rx.drug) + '</td><td>' + esc(rx.dose) + ' · ' + esc(rx.route) + ' · ' + esc(rx.freq) + '</td><td>' + UI.badge(rx.status === 'given' ? 'Given ' + (rx.lastGiven || '') : rx.status, tone) + '</td></tr>';
        }).join('') + '</tbody></table></div>'
      : '<span class="muted">No medication</span>';
    // S7 multidisciplinary care plan
    var problemsBody = p.problems.length ? p.problems.map(function (pr) {
      return '<div class="row-between" style="padding:6px 0;border-bottom:1px solid var(--line)"><div><b>' + esc(pr.label) + '</b> ' + (pr.code !== '—' ? '<span class="t-mono">' + esc(pr.code) + '</span>' : '') + '</div><span class="muted">' + esc(pr.at) + '</span></div>';
    }).join('') : '<span class="muted">No problems</span>';
    var s7 = '<div style="font-weight:600;margin-bottom:6px">Problem list</div>' + problemsBody +
      (c.carePlan && c.carePlan.length ? '<div class="table-wrap mt-1"><table class="t"><thead><tr><th>Problem</th><th>Intervention</th><th>Outcome</th><th>Time frame</th></tr></thead><tbody>' +
        c.carePlan.map(function (cp) { return '<tr><td>' + esc(cp.problem) + '</td><td>' + esc(cp.intervention) + '</td><td>' + esc(cp.outcome) + '</td><td>' + esc(cp.timeframe) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '');
    // S8 nutrition
    var n = c.nutrition;
    var s8 = n ? kv([['Assessment', n.assessment], ['Diet', n.diet], ['Route', n.route], ['Monitoring', n.monitoring]]) : '<span class="muted">To be completed by the care team.</span>';
    // S9 Padua VTE
    var pa = c.padua;
    var s9 = pa ? '<div class="row-between mb-1"><b>Padua score: ' + pa.score + '</b>' + UI.badge(pa.result, pa.score >= 4 ? 'rose' : 'green') + '</div>' +
      '<ul style="margin:0;padding-inline-start:18px;font-size:13px;color:var(--muted)">' + pa.factors.map(function (f) { return '<li>' + esc(f) + '</li>'; }).join('') + '</ul>'
      : '<span class="muted">Not scored</span>';
    // S10 doctor's orders
    var s10 = (c.doctorsOrders && c.doctorsOrders.length)
      ? '<ul style="margin:0;padding-inline-start:18px;font-size:13.5px">' + c.doctorsOrders.map(function (o) { return '<li style="padding:3px 0">' + esc(o) + '</li>'; }).join('') + '</ul>'
      : (p.orders.length ? p.orders.map(function (o) { return '<div class="row-between" style="padding:5px 0"><span>' + esc(o.test) + ' <span class="muted">' + esc(o.dest) + '</span></span>' + UI.badge(o.status, o.status === 'resulted' ? 'green' : 'gold') + '</div>'; }).join('') : '<span class="muted">No orders</span>');
    // S11 consultation
    var s11 = p.consult ? kv([
      ['Type', p.consult.type], ['Specialty', p.consult.specialty], ['Clinical detail', p.consult.detail],
      ['Requested tests', 'As per orders'], ['Status', UI.badge(p.consult.status, p.consult.status === 'accepted' ? 'green' : 'gold'), true],
      ['Signatures', 'Requesting: ' + (p.doctor || '—')]
    ]) : '<span class="muted">No consultation requested</span>';

    var sections =
      fileSection(p, 1, 'Basic information', s1) +
      fileSection(p, 2, 'Admission & discharge summary', s2) +
      fileSection(p, 3, 'Personal history', s3) +
      fileSection(p, 4, 'Internal transport safety (RSTP)', s4) +
      fileSection(p, 5, 'Daily antibiotics', s5) +
      fileSection(p, 6, 'Medication & administration', s6) +
      fileSection(p, 7, 'Multidisciplinary care plan', s7) +
      fileSection(p, 8, 'Nutritional care plan', s8) +
      fileSection(p, 9, 'VTE risk (Padua)', s9) +
      fileSection(p, 10, "Doctor's orders", s10) +
      fileSection(p, 11, 'Consultation request', s11);

    return UI.pageHead({
      eyebrow: 'Patient file · 11 sections', title: p.name,
      sub: p.serial + ' · ' + p.department + ' · ' + window.stageLabel(p.stage),
      actions:
        '<button class="btn btn-ghost" onclick="docAIDraft(\'' + p.serial + '\')">' + I('sparkle') + 'AI summary</button>' +
        '<button class="btn btn-primary" onclick="STATE.route=\'journey\';render()">' + I('route') + 'Journey</button>'
    }) +
      '<div class="grid" style="grid-template-columns:230px 1fr;gap:18px">' +
        '<div style="align-self:start">' +
          '<div class="card mb-2"><div class="card-head"><h3>My patients</h3></div><div class="table-wrap"><table class="t"><tbody>' + picker + '</tbody></table></div></div>' +
          '<div class="card card-pad">' + UI.lockNote('Only the treating doctor and nursing supervisor may open this file (BR-3 / FR-1.8). Every view and edit is logged (NFR-11).') + '</div>' +
        '</div>' +
        '<div>' + auditBanner + sections + '</div>' +
      '</div>';
  }

  function orders() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var rows = p.orders.map(function (o) {
      return '<tr><td><div class="t-name">' + esc(o.test) + '</div><div class="t-sub">' + esc(o.type) + ' · ' + esc(o.dest) + '</div></td>' +
        '<td class="t-mono">' + esc(o.id) + '</td>' +
        '<td>' + (o.result ? esc(o.result) : '<span class="muted">awaiting</span>') + '</td>' +
        '<td>' + UI.badge(o.status, o.status === 'resulted' ? 'green' : 'gold') + '</td>' +
        '<td>' + (o.status === 'pending' ? '<button class="btn btn-soft btn-sm" onclick="docResultIn(\'' + p.serial + '\',\'' + o.id + '\')">Mark resulted</button>' : '<span class="muted">' + esc(o.at) + '</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Orders & results', sub: 'Lab orders go through DMS; radiology to its own system (FR-7.1 / FR-7.2)' }) +
      '<div class="grid cols-2 mb-2">' +
        '<div class="card"><div class="card-head">' + UI.patientStrip(p) + '</div><div class="card-pad">' +
          '<div class="field-row"><div class="field"><label>Type</label><select id="ord-type"><option>Lab</option><option>Radiology</option><option>Diagnostic</option></select></div>' +
          '<div class="field"><label>Test</label><input id="ord-test" placeholder="e.g. Troponin / Chest X-ray" /></div></div>' +
          '<button class="btn btn-primary" onclick="docOrder(\'' + p.serial + '\')">' + I('plus') + 'Place order</button>' +
        '</div></div>' +
        '<div class="card card-pad" style="display:flex;flex-direction:column;justify-content:center">' +
          UI.lockNote('Radiology films are released by category (BR-10): economic pays and gets films; insurance is discounted, no films unless paid; contracted company pays separately for films.') +
        '</div>' +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>Orders for ' + esc(p.name) + '</h3></div>' +
        (p.orders.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Test</th><th>Order</th><th>Result</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="card-pad">' + UI.empty('No orders yet', 'flask') + '</div>') + '</div>';
  }

  function results() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var R = window.RESULTS[p.serial];
    var picker = myPatients().map(function (x) {
      var on = x.serial === p.serial;
      return '<tr onclick="STATE.selectedSerial=\'' + x.serial + '\';render()" style="' + (on ? 'background:var(--mist)' : '') + '"><td><div class="t-name">' + esc(x.name) + '</div><div class="t-sub t-mono">' + esc(x.serial) + '</div></td></tr>';
    }).join('');

    var labs = (R && R.labs.length) ? R.labs.map(function (panel) {
      var rows = panel.items.map(function (it) {
        var flag = it.flag || window.resultFlag(it);
        var val = typeof it.value === 'number' ? it.value : esc(it.value);
        return '<tr><td class="t-name">' + esc(it.name) + '</td>' +
          '<td>' + (flag ? '<span style="color:var(--rose);font-weight:700">' + val + '</span>' : val) + ' <span class="muted">' + esc(it.unit) + '</span></td>' +
          '<td class="muted">' + (it.low != null ? it.low + '–' + it.high : '—') + '</td>' +
          '<td>' + (flag ? UI.badge('High', 'rose') : (it.low != null ? UI.badge('Normal', 'green') : '<span class="muted">—</span>')) + '</td></tr>';
      }).join('');
      return '<div class="card mb-2"><div class="card-head"><h3>' + esc(panel.panel) + '</h3><span class="ch-act muted" style="font-size:12px">' + esc(panel.at) + ' · Lab via DMS</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Analyte</th><th>Result</th><th>Range</th><th>Flag</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
    }).join('') : '<div class="card card-pad">' + UI.empty('No lab results yet', 'flask') + '</div>';

    var rad = (R && R.radiology.length) ? R.radiology.map(function (r) {
      return '<div class="card mb-2"><div class="card-head">' + I('scan') + '<h3>' + esc(r.study) + '</h3>' + '<span class="ch-act">' + UI.badge(r.status, 'green') + '</span></div>' +
        '<div class="card-pad"><p>' + esc(r.report) + '</p><div class="muted mt-1" style="font-size:12px">Radiology (Milestone) · ' + esc(r.at) + '</div></div></div>';
    }).join('') : '<div class="card card-pad">' + UI.empty('No imaging reports', 'scan') + '</div>';

    return UI.pageHead({ eyebrow: 'Diagnostics', title: 'Results', sub: 'Lab values with reference ranges and radiology reports (FR-7.2)' }) +
      '<div class="grid" style="grid-template-columns:200px 1fr;gap:18px">' +
        '<div class="card" style="align-self:start"><div class="card-head"><h3>My patients</h3></div><div class="table-wrap"><table class="t"><tbody>' + picker + '</tbody></table></div></div>' +
        '<div><div class="grid cols-2" style="align-items:start"><div>' + labs + '</div><div>' + rad + '</div></div></div>' +
      '</div>';
  }

  function prescribe() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var rows = p.prescriptions.map(function (rx) {
      return '<tr><td><div class="t-name">' + esc(rx.drug) + '</div><div class="t-sub">' + esc(rx.dose) + ' · ' + esc(rx.route) + ' · ' + esc(rx.freq) + '</div></td>' +
        '<td>' + UI.badge(rx.status === 'given' ? 'Given ' + (rx.lastGiven || '') : rx.status, rx.status === 'given' ? 'green' : rx.status === 'due' ? 'rose' : rx.status === 'active' ? 'teal' : 'gold') + '</td></tr>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'Medication', title: 'Prescriptions', sub: 'Write a prescription and send it to the pharmacy (FR-6.1)',
      actions: '<button class="btn btn-primary" onclick="docPrescribeModal(\'' + p.serial + '\')">' + I('plus') + 'New prescription</button>'
    }) +
      '<div class="card"><div class="card-head">' + UI.patientStrip(p) + '</div>' +
        (p.prescriptions.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Medication</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
          : '<div class="card-pad">' + UI.empty('No prescriptions yet', 'pill') + '</div>') + '</div>';
  }

  function diagnosis() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var rows = p.problems.map(function (pr) {
      return '<tr><td class="t-mono">' + esc(pr.code) + '</td><td>' + esc(pr.label) + '</td><td class="muted">' + esc(pr.at) + '</td></tr>';
    }).join('');

    var forms = [
      { key: 'dental', label: 'Dental', code: 'SMC-F-ALH-008', icon: 'tooth' },
      { key: 'gyn', label: 'Gynecology', code: 'SMC-F-ALH-011', icon: 'user' },
      { key: 'peds', label: 'Pediatric', code: 'SMC-F-ALH-014', icon: 'baby' }
    ].map(function (f) {
      return '<button class="btn btn-ghost" onclick="docOpenForm(\'' + f.key + '\',\'' + p.serial + '\')">' + I(f.icon) + f.label + ' · ' + f.code + '</button>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Clinical', title: 'Diagnosis & problem list', sub: 'Structured fields with ICD-10 and the clinic forms (FR-7.4)' }) +
      '<div class="grid cols-2 mb-2">' +
        '<div class="card"><div class="card-head">' + UI.patientStrip(p) + '</div><div class="card-pad">' +
          '<div class="field-row"><div class="field"><label>ICD-10 code</label><input id="dx-code" placeholder="e.g. I21.0" /></div>' +
          '<div class="field"><label>Diagnosis</label><input id="dx-label" placeholder="e.g. Acute anterior STEMI" /></div></div>' +
          '<button class="btn btn-primary" onclick="docAddProblem(\'' + p.serial + '\')">' + I('plus') + 'Add to problem list</button>' +
        '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Problem list</h3></div>' +
          (p.problems.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>ICD-10</th><th>Diagnosis</th><th>Since</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
            : '<div class="card-pad">' + UI.empty('No diagnoses recorded', 'clipboard') + '</div>') + '</div>' +
      '</div>' +
      '<div class="grid cols-2">' +
        '<div class="card"><div class="card-head">' + I('clipboard') + '<h3>Clinic forms</h3></div><div class="card-pad">' +
          '<p class="muted mb-2" style="font-size:12.5px">Structured forms with their own fields — the dental form carries a consent and a surgical-safety time-out.</p>' +
          '<div class="wrap-gap">' + forms + '</div></div></div>' +
        '<div class="card"><div class="card-head">' + I('stethoscope') + '<h3>Consultation request</h3></div><div class="card-pad">' +
          (p.consult
            ? '<dl class="kv"><dt>Type</dt><dd>' + esc(p.consult.type) + '</dd><dt>Specialty</dt><dd>' + esc(p.consult.specialty) + '</dd><dt>Detail</dt><dd style="text-align:start">' + esc(p.consult.detail) + '</dd><dt>Status</dt><dd>' + UI.badge(p.consult.status, p.consult.status === 'accepted' ? 'green' : 'gold') + '</dd></dl>'
            : '<p class="muted mb-2" style="font-size:12.5px">No active consultation.</p>') +
          '<button class="btn btn-ghost mt-1" onclick="docConsult(\'' + p.serial + '\')">' + I('plus') + 'New consultation</button>' +
        '</div></div>' +
      '</div>';
  }

  window.docOpenForm = function (type, serial) {
    var p = window.findPatient(serial);
    var titles = { dental: 'Dental form · SMC-F-ALH-008', gyn: 'Gynecology form · SMC-F-ALH-011', peds: 'Pediatric form · SMC-F-ALH-014' };
    var common =
      '<div class="field-row"><div class="field"><label>Patient</label><input value="' + esc(p.name) + '" readonly /></div>' +
      '<div class="field"><label>Serial</label><input value="' + esc(p.serial) + '" readonly /></div></div>' +
      '<div class="field"><label>Examination / findings</label><textarea placeholder="Clinical findings…"></textarea></div>' +
      '<div class="field"><label>Plan & treatment</label><textarea placeholder="Plan, tests, medication, education, follow-up…"></textarea></div>' +
      '<div class="field"><label>ICD-10</label><input placeholder="e.g. K02.9" /></div>';
    var dentalExtra = type === 'dental' ?
      '<div class="divider"></div>' +
      '<label class="flex" style="font-size:13px;cursor:pointer;margin-bottom:12px"><input type="checkbox" style="width:auto;height:auto"/> Patient consent obtained for the procedure</label>' +
      '<div style="font-weight:600;font-size:13px;margin-bottom:8px">Surgical safety time-out</div>' +
      ['Patient identity confirmed', 'Procedure & site confirmed', 'Allergies checked', 'Anaesthesia safety check complete', 'Equipment & sterility confirmed'].map(function (x) {
        return '<label class="flex" style="font-size:13px;cursor:pointer;padding:3px 0"><input type="checkbox" style="width:auto;height:auto"/> ' + esc(x) + '</label>';
      }).join('') : '';
    UI.modal({
      title: titles[type] || 'Clinic form', icon: 'clipboard', wide: true,
      body: common + dentalExtra,
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();UI.toast(\'Form saved to the record\',\'ok\')">' + I('check') + 'Save form</button>'
    });
  };

  window.docConsult = function (serial) {
    var p = window.findPatient(serial);
    UI.modal({
      title: 'Consultation request', icon: 'stethoscope',
      body:
        '<div class="field-row"><div class="field"><label>Type</label><select id="cs-type"><option>Urgent</option><option>Routine</option></select></div>' +
        '<div class="field"><label>Specialty</label><input id="cs-spec" placeholder="e.g. Infectious Diseases" /></div></div>' +
        '<div class="field"><label>Clinical detail</label><textarea id="cs-detail" placeholder="Reason and question for the consultant…"></textarea></div>' +
        '<div class="field"><label>Requested tests</label><input id="cs-tests" placeholder="e.g. CRP, blood cultures" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="docSaveConsult(\'' + serial + '\')">' + I('check') + 'Send request</button>'
    });
  };
  window.docSaveConsult = function (serial) {
    var p = window.findPatient(serial);
    var g = function (id) { return (document.getElementById(id) || {}).value || ''; };
    p.consult = { type: g('cs-type') || 'Routine', specialty: g('cs-spec') || 'General', detail: g('cs-detail') || '—', status: 'requested' };
    UI.closeModal(); UI.toast('Consultation requested → ' + p.consult.specialty, 'ok'); window.render();
  };

  function journey() {
    var p = window.selectedPatient();
    if (p.doctor !== window.STAFF.doctor.name) { p = myPatients()[0]; window.STATE.selectedSerial = p.serial; }
    var cur = window.stageIndex(p.stage);
    var histMap = {};
    p.stageHistory.forEach(function (h) { histMap[h.stage] = h; });

    var tl = window.STAGES.map(function (s, i) {
      var cls = i < cur ? 'done' : i === cur ? 'current' : '';
      var h = histMap[s.key];
      return '<div class="tl-item ' + cls + '">' +
        '<div class="tl-rail"><div class="tl-node">' + (i < cur ? I('check') : i === cur ? I('chevron') : '') + '</div>' + (i < window.STAGES.length - 1 ? '<div class="tl-line"></div>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-name">' + esc(s.label) + '</div>' +
          '<div class="tl-sub">' + esc(s.owner) + (h ? ' · ' + esc(h.at) + ' · ' + esc(h.by) : '') + '</div></div>' +
      '</div>';
    }).join('');

    var d2b = window.doorToBalloon(p);
    var d2bTile = p.balloonTime
      ? UI.tile({ label: 'Door-to-Balloon', value: d2b == null ? '—' : d2b, unit: 'min', icon: 'clock', accent: 'teal', foot: 'Recorded · target ≤ 90' })
      : UI.tile({ label: 'Door-to-Balloon', value: 'Running', icon: 'clock', accent: 'teal', foot: 'Target ≤ 90 min' });

    // detailed cardiac sub-timeline (door → balloon)
    var cardiac = p.cardiacTimeline ?
      '<div class="card mt-2"><div class="card-head">' + I('heart') + '<h3>Cardiac clock</h3></div><div class="card-pad"><div class="chain">' +
        p.cardiacTimeline.map(function (s, i) {
          var cls = s.done ? 'answered' : 'alerted';
          return '<div class="chain-step ' + cls + '"><div class="chain-rail"><div class="chain-dot">' + (s.done ? I('check') : (i + 1)) + '</div>' +
            (i < p.cardiacTimeline.length - 1 ? '<div class="chain-line"></div>' : '') + '</div>' +
            '<div class="chain-body"><div class="chain-role">' + esc(s.label) + '</div><div class="chain-who">' + (s.t ? esc(s.t) : (s.done ? '' : 'pending')) + '</div></div></div>';
        }).join('') + '</div></div></div>' : '';

    // cold-state operations track: requisition book (FR-4.5)
    var reqItems = p.requisition || [];
    var operations = reqItems.length ?
      '<div class="card mt-2"><div class="card-head">' + I('clipboard') + '<h3>Operations track · requisition book</h3>' +
        '<span class="ch-act muted" style="font-size:12px">Physical file · weekly risk · closing financial file</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Item</th><th>Qty</th><th>Status</th><th></th></tr></thead><tbody>' +
        reqItems.map(function (it, i) {
          var tone = it.status === 'available' ? 'green' : it.status === 'reserved' ? 'teal' : 'gold';
          return '<tr><td class="t-name">' + esc(it.item) + '</td><td>' + it.qty + '</td><td>' + UI.badge(it.status, tone) + '</td>' +
            '<td>' + (it.status === 'to order' ? '<button class="btn btn-soft btn-sm" onclick="docOrderItem(\'' + p.serial + '\',' + i + ')">' + I('check') + 'Mark ordered</button>' : '<span class="muted">—</span>') + '</td></tr>';
        }).join('') + '</tbody></table></div>' +
        '<div class="card-pad" style="border-top:1px solid var(--line)">' + UI.lockNote('Cold-state operations track (FR-4.5): a physical file is opened, the procedure’s needs are requisitioned beforehand, the risk score is redone weekly, and a closing financial file is issued at the end.') + '</div></div>' : '';

    return UI.pageHead({
      eyebrow: 'Care coordination', title: 'Patient journey', sub: p.name + ' · ' + p.serial,
      actions: cur < window.STAGES.length - 1 ? '<button class="btn btn-primary" onclick="docAdvance(\'' + p.serial + '\')">' + I('arrowRight') + 'Advance to ' + esc(window.STAGES[cur + 1].label) + '</button>' : '<span class="badge green badge-lg"><span class="bdot"></span>Journey complete</span>'
    }) +
      '<div class="grid" style="grid-template-columns:1fr 300px;gap:18px">' +
        '<div><div class="card card-pad"><div class="timeline">' + tl + '</div></div>' + operations + '</div>' +
        '<div>' + d2bTile +
          '<div class="card mt-2"><div class="card-head"><h3>Now</h3></div><div class="card-pad">' +
            '<dl class="kv"><dt>Stage</dt><dd>' + esc(window.stageLabel(p.stage)) + '</dd>' +
            '<dt>Triage</dt><dd>' + UI.triageBadge(p.triage) + '</dd>' +
            '<dt>Department</dt><dd>' + esc(p.department) + '</dd>' +
            '<dt>Owner</dt><dd>' + esc((window.STAGES[cur] || {}).owner || '—') + '</dd>' +
            '<dt>Observations</dt><dd>' + esc(window.OBS_FREQ[p.stage] || 'hourly') + '</dd></dl>' +
          '</div></div>' + cardiac +
        '</div>' +
      '</div>';
  }
  window.docOrderItem = function (serial, idx) {
    var p = window.findPatient(serial);
    if (p.requisition && p.requisition[idx]) { p.requisition[idx].status = 'reserved'; UI.toast(p.requisition[idx].item + ' ordered & reserved', 'ok'); window.render(); }
  };

  /* ---- register the role ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.doctor = {
    label: 'Doctor', person: 'Dr. Karim Adel · Cardiologist', icon: 'doctor', accent: 'teal',
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
