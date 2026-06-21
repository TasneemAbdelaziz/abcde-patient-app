/* ============================================================
   A.B.C.D.E — Staff Dashboards · reception.js  (LIVE API)
   Reception handles ADMINISTRATIVE data only (BR-4 / FR-1.8):
   registers patients & builds the Serial (FR-1.4), issues the
   two cards (FR-1.5), checks/sets insurance (FR-12.1), manages
   appointment requests & slots, takes payment (FR-12.4) and
   routes unfunded cases to the three-doctor committee (UC-5).
   All data is live from the Laravel API.
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { patients: [], visits: [], visitBySerial: {}, appts: [], detail: null, slots: null, slotDept: 'CARD' };

  /* film category from coverage_category (BR-10, illustrative) */
  var FILM = {
    insured:   { label: 'Insurance', pays: 'Discounted', films: 'No films unless paid' },
    employer_paid: { label: 'Contracted company', pays: 'Set discount', films: 'Pays separately for films' }
  };
  function filmFor(cat) { return FILM[cat] || { label: 'Economic', pays: 'Pays full', films: 'Gets films' }; }

  function indexVisits() {
    data.visitBySerial = {};
    data.visits.forEach(function (v) {
      var s = v.patient_serial || (v.patient && v.patient.patient_serial);
      if (!s) return;
      var open = v.visit_status === 'open';
      if (!data.visitBySerial[s] || open) data.visitBySerial[s] = v;
    });
  }
  function ticketFor(serial) { var v = data.visitBySerial[serial]; return v ? v.ticket_no : null; }

  /* ---------- loader ---------- */
  function load(route) {
    var jobs = [
      API.patients.list({ per_page: 200 }).then(function (r) { data.patients = (r && r.items) || []; }),
      API.visits.list().then(function (r) { data.visits = r || []; indexVisits(); }),
      API.appointments.list().then(function (r) { data.appts = r || []; }).catch(function () { data.appts = []; })
    ];
    return Promise.all(jobs);
  }

  /* ---------- actions ---------- */
  window.recSelect = function (serial) {
    window.STATE.selectedSerial = serial;
    data.detail = null;
    window.render();
    API.patients.get(serial).then(function (p) { data.detail = p; window.render(); }).catch(function () {});
  };

  window.recRegister = function () {
    var ar = window.STATE.lang === 'ar';
    STORE.departments().then(function (depts) {
      var opts = (depts || []).map(function (d) { return '<option value="' + esc(d.dept_code) + '">' + esc(d.department_name) + '</option>'; }).join('');
      UI.modal({
        title: ar ? 'تسجيل مريض جديد' : 'Register a new patient', icon: 'plus', wide: true,
        body:
          '<p class="muted mb-2">' + (ar ? 'الاستقبال يجمع البيانات الإدارية فقط. الرقم التسلسلي يُبنى من الرقم القومي (FR-1.4).' : 'Administrative data only. The Serial is built from the national ID (FR-1.4).') + '</p>' +
          '<div class="grid cols-2">' +
            '<div class="field"><label>Full name *</label><input id="rg-name" placeholder="As on the national ID" /></div>' +
            '<div class="field"><label>National ID *</label><input id="rg-nid" placeholder="14 digits" /></div>' +
            '<div class="field"><label>Phone *</label><input id="rg-phone" placeholder="010-0000-0000" /></div>' +
            '<div class="field"><label>Date of birth</label><input id="rg-dob" type="date" /></div>' +
            '<div class="field"><label>Gender</label><select id="rg-gender"><option value="M">Male</option><option value="F">Female</option></select></div>' +
            '<div class="field"><label>City / district</label><input id="rg-city" /></div>' +
            '<div class="field"><label>Preferred language</label><select id="rg-lang"><option value="ar">العربية</option><option value="en">English</option></select></div>' +
            '<div class="field"><label>Chronic conditions</label><input id="rg-chronic" placeholder="e.g. Hypertension" /></div>' +
          '</div>',
        foot:
          '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" id="rg-btn" onclick="recDoRegister()">' + I('check') + 'Register & issue Serial</button>'
      });
    });
  };
  window.recDoRegister = function () {
    var name = (document.getElementById('rg-name') || {}).value || '';
    var phone = (document.getElementById('rg-phone') || {}).value || '';
    if (!name.trim() || !phone.trim()) { UI.toast('Name and phone are required', 'warn'); return; }
    var payload = {
      full_name: name.trim(),
      national_id: (document.getElementById('rg-nid') || {}).value || null,
      phone: phone.trim(),
      date_of_birth: (document.getElementById('rg-dob') || {}).value || null,
      gender: (document.getElementById('rg-gender') || {}).value || 'M',
      city_district: (document.getElementById('rg-city') || {}).value || null,
      preferred_language: (document.getElementById('rg-lang') || {}).value || 'ar',
      chronic_conditions: (document.getElementById('rg-chronic') || {}).value || null,
      decision_maker: 'self'
    };
    var btn = document.getElementById('rg-btn'); if (btn) btn.disabled = true;
    API.patients.register(payload).then(function (res) {
      var serial = res.patient_serial || (res.patient && res.patient.patient_serial);
      UI.closeModal();
      UI.toast('Registered · Serial ' + serial, 'ok');
      window.STATE.selectedSerial = serial;
      return load().then(function () { recShowCards(serial); window.render(); });
    }).catch(function (e) { UI.toast(e.message, 'err'); if (btn) btn.disabled = false; });
  };

  function recShowCards(serial) {
    var p = data.patients.find(function (x) { return x.patient_serial === serial; }) || (data.detail && data.detail.patient_serial === serial ? data.detail : null);
    var name = p ? p.full_name : serial;
    var stamp = new Date().toISOString().slice(0, 10);
    var arrival = '<div class="id-card"><div class="idc-top"><div><div class="idc-kind">Arrival card · 1 copy</div>' +
      '<div class="idc-serial">' + esc(serial) + '</div><div class="idc-name">' + esc(name) + '</div></div>' + I('shield') + '</div>' +
      '<div class="idc-rows"><span>' + esc(stamp) + '</span><span>Emergency desk</span></div>' + UI.barcode(serial + 'A') + '</div>';
    var booking = '<div class="id-card booking"><div class="idc-top"><div><div class="idc-kind">Booking card · several copies</div>' +
      '<div class="idc-serial">' + esc(serial) + '</div><div class="idc-name">' + esc(name) + '</div></div>' + I('card') + '</div>' +
      '<div class="idc-rows"><span>Follows the patient</span><span>' + esc(stamp) + '</span></div>' + UI.barcode(serial + 'B') + '</div>';
    UI.modal({
      title: 'Issue cards · ' + serial, icon: 'card', wide: true,
      body: '<p class="muted mb-2">Two cards print from the national ID — the arrival card ties the patient to the system; the booking card follows the patient and samples (FR-1.5).</p>' +
        '<div class="grid cols-2">' + arrival + booking + '</div>',
      foot: '<button class="btn btn-ghost" onclick="recIssueCard(\'' + serial + '\',\'arrival\')">' + I('print') + 'Issue arrival card</button>' +
        '<button class="btn btn-ghost" onclick="recIssueCard(\'' + serial + '\',\'booking\')">' + I('print') + 'Issue booking card</button>' +
        '<button class="btn btn-primary" onclick="recIssueQr(\'' + serial + '\')">' + I('scan') + 'Issue QR card</button>'
    });
  }
  window.recShowCards = recShowCards;
  window.recIssueCard = function (serial, type) {
    API.patients.issueCard(serial, type).then(function () { UI.toast((type === 'arrival' ? 'Arrival' : 'Booking') + ' card issued', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.recIssueQr = function (serial) {
    API.patients.issueQr(serial).then(function (r) { UI.closeModal(); UI.toast('QR card issued' + (r && r.qr_token ? ' · ' + r.qr_token : ''), 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* appointments */
  window.recApptStatus = function (id, status) {
    var body = { status: status };
    if (status === 'approved') {
      var ar = window.STATE.lang === 'ar';
      UI.modal({
        title: ar ? 'تأكيد الموعد' : 'Approve appointment', icon: 'calendar',
        body: '<div class="field"><label>Scheduled date & time</label><input id="ap-when" type="datetime-local" /></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="recApptApprove(\'' + id + '\')">' + I('check') + 'Approve</button>'
      });
      return;
    }
    API.appointments.setStatus(id, body).then(function () { UI.toast('Appointment ' + status, 'ok'); return load().then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.recApptApprove = function (id) {
    var when = (document.getElementById('ap-when') || {}).value || '';
    var sched = when ? when.replace('T', ' ') + ':00' : null;
    API.appointments.setStatus(id, { status: 'approved', scheduled_at: sched }).then(function () {
      UI.closeModal(); UI.toast('Appointment approved', 'ok'); return load().then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.recApptAssign = function (id) {
    STORE.doctors().then(function (docs) {
      var opts = (docs || []).map(function (d) { return '<option value="' + esc(d.staff_id) + '">' + esc(d.full_name) + ' · ' + esc(d.specialty) + '</option>'; }).join('');
      UI.modal({
        title: 'Assign doctor', icon: 'doctor',
        body: '<div class="field"><label>Doctor</label><select id="ap-doc">' + opts + '</select></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="recDoAssign(\'' + id + '\')">' + I('check') + 'Assign</button>'
      });
    });
  };
  window.recDoAssign = function (id) {
    var doc = (document.getElementById('ap-doc') || {}).value;
    API.appointments.assign(id, doc).then(function () { UI.closeModal(); UI.toast('Doctor assigned', 'ok'); return load().then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.recLoadSlots = function (dept) {
    data.slotDept = dept || data.slotDept;
    API.appointments.slots({ dept_code: data.slotDept }).then(function (r) { data.slots = r; window.render(); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* admit / start a visit */
  window.recAdmit = function (serial) {
    STORE.departments().then(function (depts) {
      var opts = (depts || []).map(function (d) { return '<option value="' + esc(d.dept_code) + '">' + esc(d.department_name) + '</option>'; }).join('');
      UI.modal({
        title: 'Admit / start visit · ' + serial, icon: 'plus',
        body: '<div class="field"><label>Arrival type</label><select id="ad-arr"><option value="emergency">Emergency</option><option value="scheduled">Scheduled</option><option value="cold">Outpatient (cold)</option><option value="referred">Referral / transfer</option></select></div>' +
          '<div class="field"><label>Department</label><select id="ad-dept">' + opts + '</select></div>' +
          '<div class="field"><label>Location / room code</label><input id="ad-loc" placeholder="e.g. ER-1" /></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-primary" onclick="recDoAdmit(\'' + serial + '\')">' + I('check') + 'Start visit</button>'
      });
    });
  };
  window.recDoAdmit = function (serial) {
    var payload = {
      patient_serial: serial,
      arrival_type: (document.getElementById('ad-arr') || {}).value || 'emergency',
      dept_code: (document.getElementById('ad-dept') || {}).value,
      location_code: (document.getElementById('ad-loc') || {}).value || null
    };
    API.visits.create(payload).then(function () { UI.closeModal(); UI.toast('Visit started for ' + serial, 'ok'); return load().then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* insurance editor */
  window.recEditInsurance = function (serial) {
    var cur = (data.detail && data.detail.insurance) || {};
    var cats = ['insured', 'employer_paid', 'uninsured_able', 'uninsured_unable', 'state', 'pension', 'student'];
    var opts = cats.map(function (c) { return '<option value="' + c + '"' + (cur.coverage_category === c ? ' selected' : '') + '>' + esc(S.insuranceInfo(c).label) + '</option>'; }).join('');
    UI.modal({
      title: 'Insurance · ' + serial, icon: 'shield',
      body: '<div class="field"><label>Coverage category</label><select id="in-cat">' + opts + '</select></div>' +
        '<div class="field"><label>Payer name</label><input id="in-payer" value="' + esc(cur.payer_name || '') + '" /></div>' +
        '<div class="field"><label>Policy no.</label><input id="in-pol" value="' + esc(cur.policy_no || '') + '" /></div>' +
        '<div class="field"><label>Notes</label><input id="in-notes" value="' + esc(cur.notes || '') + '" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="recSaveInsurance(\'' + serial + '\')">' + I('check') + 'Save</button>'
    });
  };
  window.recSaveInsurance = function (serial) {
    var payload = {
      coverage_category: (document.getElementById('in-cat') || {}).value,
      payer_name: (document.getElementById('in-payer') || {}).value || null,
      policy_no: (document.getElementById('in-pol') || {}).value || null,
      determined_from: 'manual',
      notes: (document.getElementById('in-notes') || {}).value || null
    };
    API.billing.updateInsurance(serial, payload).then(function () {
      UI.closeModal(); UI.toast('Insurance updated', 'ok'); recSelect(serial);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* financial file + payment */
  window.recFinancialFile = function (serial) {
    var ticket = ticketFor(serial);
    if (!ticket) { UI.toast('No visit for this patient yet', 'warn'); return; }
    API.billing.financialFile(ticket).then(function (f) {
      var rows = (f.items || []).map(function (it) {
        return '<tr><td>' + esc(it.item_description) + (it.quantity > 1 ? ' <span class="muted">×' + it.quantity + '</span>' : '') +
          '</td><td>' + (it.covered_by_insurance ? UI.badge('Insurance', 'green') : UI.badge(S.titleCase(it.payment_method || 'cash'), 'gold')) +
          '</td><td style="text-align:end">' + S.money(it.line_total) + '</td></tr>';
      }).join('');
      var t = f.totals || {};
      UI.modal({
        title: 'Financial file · ' + ticket, icon: 'money', wide: true,
        body: '<div class="table-wrap"><table class="t"><thead><tr><th>Item</th><th>Cover</th><th style="text-align:end">EGP</th></tr></thead><tbody>' + rows +
          '<tr><td class="t-name">Gross</td><td></td><td style="text-align:end" class="t-name">' + S.money(t.gross) + '</td></tr>' +
          '<tr><td class="muted">Insurance coverage</td><td></td><td style="text-align:end" class="muted">− ' + S.money(t.covered_by_insurance) + '</td></tr>' +
          '<tr><td class="t-name">Patient owes</td><td></td><td style="text-align:end"><b style="color:var(--teal-d);font-size:16px">' + S.money(t.outstanding) + ' EGP</b></td></tr>' +
          '</tbody></table></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">' + I('print') + 'Print</button>' +
          (t.outstanding > 0 ? '<button class="btn btn-primary" onclick="UI.closeModal();recTakePayment(\'' + serial + '\',' + t.outstanding + ')">' + I('money') + 'Take payment</button>' : '')
      });
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.recTakePayment = function (serial, amount) {
    var ticket = ticketFor(serial);
    if (!ticket) { UI.toast('No visit for this patient yet', 'warn'); return; }
    UI.modal({
      title: 'Take payment', icon: 'money',
      body: '<div class="field"><label>Amount (EGP)</label><input id="pay-amt" value="' + (amount || 850) + '" /></div>' +
        '<div class="field"><label>Method</label><select id="pay-method"><option value="cash">Cash</option><option value="card">Card</option></select></div>' +
        '<div class="field"><label>Receipt reference</label><input id="pay-ref" value="RCP-' + Math.floor(1000 + (serial.charCodeAt(serial.length - 1) * 7)) + '" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="recDoPay(\'' + serial + '\')">' + I('check') + 'Record & print receipt</button>'
    });
  };
  window.recDoPay = function (serial) {
    var ticket = ticketFor(serial);
    var payload = {
      amount: Number((document.getElementById('pay-amt') || {}).value || 0),
      method: (document.getElementById('pay-method') || {}).value || 'cash',
      reference: (document.getElementById('pay-ref') || {}).value || null
    };
    API.billing.pay(ticket, payload).then(function () { UI.closeModal(); UI.toast('Payment recorded · receipt printed', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* committee */
  window.recFundingCommittee = function (serial) {
    var ticket = ticketFor(serial);
    if (!ticket) { UI.toast('No visit for this patient yet', 'warn'); return; }
    API.billing.committeeReview(ticket, { reason: 'Unable to pay — refer to state-funding committee' })
      .then(function () { UI.toast('State-funding committee review raised', 'ok'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* ---------- screens ---------- */
  function overview() {
    var pts = data.patients, appts = data.appts;
    var pendingAppts = appts.filter(function (a) { return a.status === 'pending'; }).length;
    var openVisits = data.visits.filter(function (v) { return v.visit_status === 'open'; }).length;
    var unfunded = pts.filter(function (p) { return p.insurance && p.insurance.coverage_category === 'uninsured_unable'; }).length;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Registered patients', value: pts.length, icon: 'users', foot: 'In the system' }) +
      UI.tile({ label: 'Open visits', value: openVisits, icon: 'activity', foot: 'Currently in care' }) +
      UI.tile({ label: 'Appointment requests', value: pendingAppts, icon: 'calendar', foot: 'Awaiting action', accent: pendingAppts ? 'gold' : '' }) +
      UI.tile({ label: 'Committee cases', value: unfunded, icon: 'shield', foot: 'Uninsured & unable' }) +
    '</div>';

    var rows = data.visits.slice(0, 12).map(function (vr) {
      var v = S.visit(vr);
      return '<tr onclick="recSelect(\'' + v.serial + '\');STATE.route=\'queue\';render()">' +
        '<td><div class="flex">' + UI.avatarFor(v) + '<div><div class="t-name">' + esc(v.name) + '</div>' +
          '<div class="t-sub">' + esc(S.arrivalLabel(v.arrival)) + '</div></div></div></td>' +
        '<td class="t-mono">' + esc(v.serial) + '</td>' +
        '<td>' + UI.triageBadge(v.triage) + '</td>' +
        '<td>' + esc(window.stageLabel(v.stage)) + '</td>' +
        '<td>' + esc(v.dept) + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('No active visits') + '</td></tr>';

    return UI.pageHead({
      eyebrow: 'Reception', title: 'Front desk',
      sub: 'Administrative registration, insurance, cards, and appointments — live data',
      actions: '<button class="btn btn-primary" onclick="recRegister()">' + I('plus') + 'New registration</button>'
    }) + tiles +
    '<div class="card"><div class="card-head"><h3>Active visits</h3>' +
      '<span class="ch-act badge slate">Admin view · no clinical data</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr>' +
        '<th>Patient</th><th>Serial</th><th>Triage</th><th>Stage</th><th>Department</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function queue() {
    var serial = window.STATE.selectedSerial;
    var rows = data.patients.map(function (p) {
      var on = p.patient_serial === serial;
      var np = S.patient(p);
      return '<tr onclick="recSelect(\'' + p.patient_serial + '\')" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="flex">' + UI.avatarFor(np) + '<div><div class="t-name">' + esc(np.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(np.serial) + '</div></div></div></td>' +
        '<td>' + UI.insuranceBadge(np.insuranceCat) + '</td>' +
        '<td class="t-sub">' + esc(np.phone || '—') + '</td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="3">' + UI.empty('No patients') + '</td></tr>';

    var detailPanel;
    if (!serial) {
      detailPanel = '<div class="card card-pad">' + UI.empty('Select a patient to view their administrative record', 'user') + '</div>';
    } else if (!data.detail || data.detail.patient_serial !== serial) {
      detailPanel = '<div class="card card-pad">' + '<div class="loading-wrap"><div class="spinner"></div></div>' + '</div>';
    } else {
      var d = data.detail; var np = S.patient(d);
      var v = data.visitBySerial[serial];
      var ins = d.insurance;
      var admin = '<dl class="kv">' +
        '<dt>Serial</dt><dd class="t-mono">' + esc(np.serial) + '</dd>' +
        '<dt>National ID</dt><dd class="t-mono">' + esc(np.nationalId || '—') + '</dd>' +
        '<dt>Date of birth</dt><dd>' + esc(np.dob || '—') + '</dd>' +
        '<dt>Age / Sex</dt><dd>' + esc(np.age) + ' · ' + esc(np.sex) + '</dd>' +
        '<dt>Phone</dt><dd>' + esc(np.phone || '—') + '</dd>' +
        '<dt>City</dt><dd>' + esc(np.address || '—') + '</dd>' +
        '<dt>Language</dt><dd>' + esc((np.lang || 'ar').toUpperCase()) + '</dd>' +
        '<dt>Insurance</dt><dd>' + UI.insuranceBadge(ins ? ins.coverage_category : null) + ' <button class="btn btn-ghost btn-sm" onclick="recEditInsurance(\'' + serial + '\')">' + I('edit') + 'Edit</button></dd>' +
        '<dt>Current visit</dt><dd>' + (v ? esc(window.stageLabel(v.current_stage)) + ' · ' + UI.triageBadge(v.triage_classification) : UI.badge('No open visit', 'slate')) + '</dd>' +
      '</dl>';
      detailPanel = '<div class="card"><div class="card-head">' + UI.patientStrip(np) + '</div><div class="card-pad">' + admin +
        '<div class="divider"></div>' +
        UI.lockNote('Clinical fields (vitals, diagnosis, medication, the medical file) are hidden from reception — they live in the Nurse and Doctor dashboards.') +
        '<div class="wrap-gap mt-2">' +
          '<button class="btn btn-soft btn-sm" onclick="recShowCards(\'' + serial + '\')">' + I('card') + 'Cards</button>' +
          (v ? '' : '<button class="btn btn-primary btn-sm" onclick="recAdmit(\'' + serial + '\')">' + I('plus') + 'Admit / start visit</button>') +
          (v ? '<button class="btn btn-ghost btn-sm" onclick="recFinancialFile(\'' + serial + '\')">' + I('file') + 'Financial file</button>' : '') +
          (v ? '<button class="btn btn-ghost btn-sm" onclick="recTakePayment(\'' + serial + '\')">' + I('money') + 'Payment</button>' : '') +
        '</div></div></div>';
    }

    return UI.pageHead({ eyebrow: 'Reception', title: 'Patient queue', sub: 'Registered patients · administrative record',
      actions: '<button class="btn btn-primary" onclick="recRegister()">' + I('plus') + 'New registration</button>' }) +
    '<div class="grid cols-2">' +
      '<div class="card"><div class="card-head"><h3>Registered patients</h3><span class="ch-act muted">' + data.patients.length + '</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Insurance</th><th>Phone</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      detailPanel +
    '</div>';
  }

  function appointments() {
    var rows = data.appts.map(function (a) {
      var who = a.is_guest ? (a.patient_or_guest || 'Guest') : (a.patient_serial || a.patient_or_guest);
      var dept = (a.department && a.department.department_name) || a.dept_code;
      return '<tr>' +
        '<td><div class="t-name">' + esc(who) + '</div><div class="t-sub">' + (a.is_guest ? 'Guest request' : 'Patient ' + esc(a.patient_serial || '')) + '</div></td>' +
        '<td>' + esc(dept) + '<div class="t-sub">' + esc(a.complaint || '') + '</div></td>' +
        '<td>' + esc(a.scheduled_at ? S.fmtDateTime(a.scheduled_at) : S.fmtDateTime(a.requested_at)) + '</td>' +
        '<td>' + esc(a.doctor ? a.doctor.full_name : (a.assigned_doctor_id || '—')) + '</td>' +
        '<td>' + UI.statusBadge(a.status) + '</td>' +
        '<td><div class="wrap-gap">' +
          (a.status === 'pending' ? '<button class="btn btn-primary btn-sm" onclick="recApptStatus(\'' + a.appointment_id + '\',\'approved\')">' + I('check') + 'Approve</button>' +
            '<button class="btn btn-ghost btn-sm" onclick="recApptStatus(\'' + a.appointment_id + '\',\'declined\')">' + I('x') + 'Decline</button>' : '') +
          '<button class="btn btn-soft btn-sm" onclick="recApptAssign(\'' + a.appointment_id + '\')">' + I('doctor') + 'Assign</button>' +
        '</div></td>' +
      '</tr>';
    }).join('') || '<tr><td colspan="6">' + UI.empty('No appointment requests') + '</td></tr>';

    var slotGrid;
    if (!data.slots) {
      slotGrid = '<p class="muted mb-2">Pick a department to view today\'s slots.</p>' +
        '<button class="btn btn-soft btn-sm" onclick="recLoadSlots(\'CARD\')">' + I('calendar') + 'Load Cardiology slots</button>';
    } else {
      var slotEls = (data.slots.slots || []).map(function (s) {
        return '<button class="slot ' + (s.available ? 'free' : 'booked') + '"' + (s.available ? '' : ' disabled') + '>' + esc(s.time) + '</button>';
      }).join('');
      var avail = (data.slots.slots || []).filter(function (s) { return s.available; }).length;
      slotGrid = '<div class="row-between mb-2"><span class="muted">' + esc(data.slots.date) + ' · ' + data.slotDept + '</span><span class="badge teal">' + avail + ' free</span></div>' +
        '<div class="slot-grid">' + slotEls + '</div>';
    }

    return UI.pageHead({ eyebrow: 'Reception', title: 'Appointments & scheduling',
      sub: 'Online requests + the slot book — something the hospital cannot do in person today (FR-2.5)' }) +
    '<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:18px">' +
      '<div class="card"><div class="card-head"><h3>Incoming requests</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr>' +
          '<th>Requester</th><th>Department</th><th>When</th><th>Doctor</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>Slot book</h3></div><div class="card-pad">' + slotGrid + '</div></div>' +
    '</div>';
  }

  function billing() {
    var rows = data.patients.map(function (p) {
      var np = S.patient(p);
      var fc = filmFor(np.insuranceCat);
      var v = data.visitBySerial[np.serial];
      return '<tr>' +
        '<td><div class="flex">' + UI.avatarFor(np) + '<div><div class="t-name">' + esc(np.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(np.serial) + '</div></div></div></td>' +
        '<td>' + UI.insuranceBadge(np.insuranceCat) + '</td>' +
        '<td><span class="badge slate">' + esc(fc.label) + '</span></td>' +
        '<td>' + (v ? UI.badge('Open visit', 'green') : UI.badge('No visit', 'slate')) + '</td>' +
        '<td><div class="wrap-gap">' +
          (v ? '<button class="btn btn-ghost btn-sm" onclick="recFinancialFile(\'' + np.serial + '\')">' + I('file') + 'Financial file</button>' +
            '<button class="btn btn-soft btn-sm" onclick="recTakePayment(\'' + np.serial + '\')">' + I('money') + 'Pay</button>' : '<span class="muted">—</span>') +
        '</div></td>' +
      '</tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Reception', title: 'Billing & payments', sub: 'Cash and card, each with its own receipt (FR-12.4) · films charged by category (BR-10)' }) +
    UI.lockNote('Reception takes payment and issues receipts. The closing itemized financial file (FR-12.6) is produced from the visit. Film charges depend on the patient’s category: economic, insurance, or contracted company.') +
    '<div class="card mt-2"><div class="card-head"><h3>Patient accounts</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Insurance</th><th>Film category</th><th>Visit</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function committee() {
    var members = window.COMMITTEE.map(function (m) {
      return '<div class="flex" style="gap:10px"><div class="avatar" style="width:34px;height:34px;font-size:12px">' + esc(S.initials(m.name)) + '</div>' +
        '<div><div style="font-weight:600;font-size:13px">' + esc(m.name) + '</div><div class="muted" style="font-size:11.5px">' + esc(m.role) + '</div></div></div>';
    }).join('');

    var unfunded = data.patients.filter(function (p) { return p.insurance && p.insurance.coverage_category === 'uninsured_unable'; });
    var cards = unfunded.length ? unfunded.map(function (p) {
      var np = S.patient(p); var v = data.visitBySerial[np.serial];
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(np) + '<span class="ch-act">' + UI.badge('Uninsured & unable', 'rose') + '</span></div>' +
        '<div class="card-pad">' +
          '<dl class="kv mb-2"><dt>Visit</dt><dd>' + (v ? esc(window.stageLabel(v.current_stage)) : 'No open visit') + '</dd>' +
            '<dt>Pathway</dt><dd style="text-align:start">Three-doctor committee reviews and a state-funding memo is raised. If life-threatening, admit at once and settle later (BR-2).</dd></dl>' +
          '<div class="wrap-gap mt-2">' +
            (v ? '<button class="btn btn-primary btn-sm" onclick="recFundingCommittee(\'' + np.serial + '\')">' + I('file') + 'Raise funding committee</button>' : '') +
            '<button class="btn btn-ghost btn-sm" onclick="recSelect(\'' + np.serial + '\');STATE.route=\'queue\';render()">' + I('user') + 'Open record</button>' +
          '</div></div></div>';
    }).join('') : '<div class="card card-pad">' + UI.empty('No unfunded cases awaiting the committee', 'check') + '</div>';

    return UI.pageHead({ eyebrow: 'Reception', title: 'Three-doctor committee', sub: 'Authorize life-saving treatment and review unfunded cases (UC-5 / FR-12.2)' }) +
      '<div class="card mb-2"><div class="card-head">' + I('shield') + '<h3>Committee members</h3></div><div class="card-pad"><div class="wrap-gap" style="gap:24px">' + members + '</div></div></div>' +
      cards;
  }

  /* ---------- register the role ---------- */
  window.ROLES = window.ROLES || {};
  window.ROLES.reception = {
    label: 'Reception', person: 'Front desk', icon: 'reception', accent: 'teal',
    desc: 'Register patients, issue the Serial and cards, check insurance, manage appointments and payments — administrative data only.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'Front desk', icon: 'desk' },
      { route: 'queue', label: 'Patient queue', icon: 'users' },
      { route: 'appointments', label: 'Appointments', icon: 'calendar', badge: function () { return data.appts.filter(function (a) { return a.status === 'pending'; }).length; } },
      { route: 'committee', label: 'Committee', icon: 'shield', badge: function () { return data.patients.filter(function (p) { return p.insurance && p.insurance.coverage_category === 'uninsured_unable'; }).length; } },
      { route: 'billing', label: 'Billing', icon: 'money' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'queue': return queue();
        case 'appointments': return appointments();
        case 'committee': return committee();
        case 'billing': return billing();
        default: return overview();
      }
    }
  };
})();
