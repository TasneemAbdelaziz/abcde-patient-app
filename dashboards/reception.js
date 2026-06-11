/* ============================================================
   A.B.C.D.E — Staff Dashboards · reception.js
   Reception handles ADMINISTRATIVE data only and never touches
   anything medical (BR-4 / FR-1.8). It registers patients,
   builds the Serial from the national ID (BR-5 / FR-1.4),
   checks insurance with four answers (UC-5 / FR-12.1), issues
   the two cards (FR-1.5), manages appointment requests, and
   takes payment (FR-12.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  /* ---- insurance lookup from the national ID (simulated) ---- */
  function verifyInsurance(nationalId) {
    var known = window.DB.patients.find(function (p) { return p.nationalId === nationalId; });
    if (known) return known.insurance;
    // deterministic pseudo-answer from the ID digits, for unknown IDs
    var keys = ['insured', 'employer', 'selfpay', 'unfunded'];
    var sum = String(nationalId).split('').reduce(function (a, c) { return a + (parseInt(c, 10) || 0); }, 0);
    return keys[sum % 4];
  }

  function readForm() {
    var d = window.STATE.regDraft || {};
    ['name', 'nationalId', 'dob', 'age', 'phone', 'address', 'complaint', 'arrival'].forEach(function (k) {
      var el = document.getElementById('reg-' + k);
      if (el) d[k] = el.value;
    });
    var lt = document.getElementById('reg-lifethreat');
    if (lt) d.lifeThreat = lt.checked;
    window.STATE.regDraft = d;
    return d;
  }

  /* ---- actions ---- */
  window.recVerify = function () {
    var d = readForm();
    if (!d.nationalId || d.nationalId.length < 6) { UI.toast('Enter a valid national ID first', 'warn'); return; }
    d.insurance = verifyInsurance(d.nationalId);
    window.STATE.regDraft = d;
    window.render();
    var ins = window.INSURANCE[d.insurance];
    UI.toast('Insurance: ' + ins.label, d.insurance === 'unfunded' ? 'warn' : 'ok');
  };

  window.recIssue = function () {
    var d = readForm();
    if (!d.name || !d.nationalId) { UI.toast('Name and national ID are required', 'warn'); return; }
    if (!d.insurance) { UI.toast('Verify insurance from the national ID first', 'warn'); return; }

    // reuse an existing Serial if this national ID was seen before (BR-5)
    var existing = window.DB.patients.find(function (p) { return p.nationalId === d.nationalId; });
    var serial;
    if (existing) {
      serial = existing.serial;
      existing.cardIssued = true;
      UI.toast('Existing patient — records reused under ' + serial, 'ok');
    } else {
      window.DB.lastSerial += 1;
      serial = 'ALM-' + window.DB.lastSerial;
      window.DB.patients.push({
        serial: serial, nationalId: d.nationalId, name: d.name,
        sex: 'M', age: parseInt(d.age, 10) || 0, dob: d.dob || '',
        phone: d.phone || '', address: d.address || '',
        arrival: d.arrival || 'outpatient',
        triage: d.lifeThreat ? 'critical' : 'cold',
        insurance: d.insurance,
        stage: 'arrival',
        complaint: d.complaint || '',
        allergies: [], doctor: null, department: 'Reception', room: '—',
        doorTime: new Date().toISOString().slice(0, 16), balloonTime: null, cardIssued: true,
        vitals: [], riskScore: null, orders: [], prescriptions: [], problems: [], consult: null,
        committee: d.insurance === 'unfunded'
          ? { status: 'pending', memo: false, reason: 'Uninsured & cannot pay' + (d.lifeThreat ? ' — life-threatening, admitted at once' : '') }
          : null,
        stageHistory: [{ stage: 'arrival', at: new Date().toISOString().slice(11, 16), by: 'Reception' }]
      });
      window.STATE.selectedSerial = serial;
    }

    var p = window.findPatient(serial);
    showCards(p);
    if (d.insurance === 'unfunded') {
      UI.toast('Routed to three-doctor committee · state-funding memo raised', 'warn');
    }
    window.STATE.regDraft = {};
  };

  function showCards(p) {
    var now = new Date();
    var stamp = now.toISOString().slice(0, 10) + ' ' + now.toTimeString().slice(0, 5);
    var reg = 'R-' + (10000 + (window.DB.patients.indexOf(p) * 137 % 90000));
    var arrival =
      '<div class="id-card">' +
        '<div class="idc-top"><div><div class="idc-kind">Arrival card · 1 copy</div>' +
          '<div class="idc-serial">' + esc(p.serial) + '</div>' +
          '<div class="idc-name">' + esc(p.name) + '</div></div>' + I('shield', '') + '</div>' +
        '<div class="idc-rows"><span>Reg ' + esc(reg) + '</span><span>' + esc(stamp) + '</span></div>' +
        UI.barcode(p.serial + 'A') +
      '</div>';
    var booking =
      '<div class="id-card booking">' +
        '<div class="idc-top"><div><div class="idc-kind">Booking card · several copies</div>' +
          '<div class="idc-serial">' + esc(p.serial) + '</div>' +
          '<div class="idc-name">' + esc(p.name) + '</div></div>' + I('card', '') + '</div>' +
        '<div class="idc-rows"><span>Age ' + esc(p.age) + '</span><span>DOB ' + esc(p.dob || '—') + '</span></div>' +
        UI.barcode(p.serial + 'B') +
      '</div>';
    UI.modal({
      title: 'Cards issued · ' + p.serial, icon: 'card', wide: true,
      body:
        '<p class="muted mb-2">Two cards print from the national ID. The arrival card ties the patient to the system on arrival; the booking card follows the patient and samples after booking.</p>' +
        '<div class="grid cols-2">' + arrival + booking + '</div>' +
        (p.committee ? '<div class="lock-note mt-2">' + I('alert') +
          '<div><b>Three-doctor committee.</b> ' + esc(p.committee.reason) + '. A memo for state funding has been raised to the authorities. The patient is admitted; the money is settled afterwards.</div></div>' : ''),
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">' + I('print') + 'Print both</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();STATE.route=\'queue\';render()">Done · go to queue</button>'
    });
  }

  window.recConfirmAppt = function (id) {
    var a = window.DB.appointments.find(function (x) { return x.id === id; });
    if (a) { a.status = 'confirmed'; UI.toast('Appointment ' + id + ' confirmed', 'ok'); window.render(); }
  };

  window.recTakePayment = function (serial) {
    var p = window.findPatient(serial);
    UI.modal({
      title: 'Take payment · ' + p.name, icon: 'money',
      body:
        '<div class="field"><label>Amount (EGP)</label><input id="pay-amt" value="450" /></div>' +
        '<div class="field"><label>Method</label><select id="pay-method"><option>Cash</option><option>Card</option></select></div>' +
        '<p class="muted" style="font-size:12.5px">Each method prints its own receipt (FR-12.4). Films are charged by category (BR-10).</p>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();UI.toast(\'Payment recorded · receipt printed\',\'ok\')">' + I('check') + 'Record & print receipt</button>'
    });
  };

  /* ---- screens ---- */
  function overview() {
    var pts = window.DB.patients;
    var todayCount = pts.filter(function (p) { return p.cardIssued; }).length;
    var pendingAppts = window.DB.appointments.filter(function (a) { return a.status === 'pending'; }).length;
    var committee = pts.filter(function (p) { return p.committee && p.committee.status === 'pending'; });

    var tiles =
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Registered today', value: todayCount, icon: 'users', foot: 'Across Emergency & Outpatient' }) +
        UI.tile({ label: 'Appointment requests', value: pendingAppts, icon: 'calendar', foot: 'Awaiting confirmation', accent: pendingAppts ? '' : '' }) +
        UI.tile({ label: 'Committee reviews', value: committee.length, icon: 'shield', foot: 'Uninsured & unable cases' }) +
        UI.tile({ label: 'Open desk', value: 'Emergency', icon: 'reception', foot: 'Nadia Hassan' }) +
      '</div>';

    var rows = pts.map(function (p) {
      return '<tr onclick="STATE.selectedSerial=\'' + p.serial + '\';STATE.route=\'queue\';render()">' +
        '<td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div>' +
          '<div class="t-sub">' + esc(window.ARRIVAL[p.arrival] || p.arrival) + '</div></div></div></td>' +
        '<td class="t-mono">' + esc(p.serial) + '</td>' +
        '<td>' + UI.insuranceBadge(p.insurance) + '</td>' +
        '<td>' + UI.triageBadge(p.triage) + '</td>' +
        '<td>' + esc(window.stageLabel(p.stage)) + '</td>' +
      '</tr>';
    }).join('');

    // charts: insurance mix + triage mix
    var insCount = {}; pts.forEach(function (p) { insCount[p.insurance] = (insCount[p.insurance] || 0) + 1; });
    var insSegs = Object.keys(insCount).map(function (k, i) { return { label: window.INSURANCE[k].label, value: insCount[k], color: UI.palette(i) }; });
    var triCount = {}; pts.forEach(function (p) { triCount[p.triage] = (triCount[p.triage] || 0) + 1; });
    var triBars = Object.keys(triCount).map(function (k) { return { label: window.TRIAGE[k].label, value: triCount[k], display: String(triCount[k]) }; });

    var charts = '<div class="grid cols-2 mb-2">' +
      '<div class="card"><div class="card-head"><h3>Insurance mix</h3></div><div class="card-pad">' + UI.donut(insSegs, { centerValue: pts.length, centerLabel: 'patients' }) + '</div></div>' +
      '<div class="card"><div class="card-head"><h3>Triage mix</h3></div><div class="card-pad">' + UI.barChart(triBars) + '</div></div>' +
    '</div>';

    return UI.pageHead({
      eyebrow: 'Reception', title: 'Front desk',
      sub: 'Administrative registration, insurance, cards, and appointments',
      actions: '<button class="btn btn-primary" onclick="STATE.route=\'register\';render()">' + I('plus') + 'New registration</button>'
    }) + tiles + charts +
    '<div class="card"><div class="card-head"><h3>Today\'s patients</h3>' +
      '<span class="ch-act badge slate">Admin view · no clinical data</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr>' +
        '<th>Patient</th><th>Serial</th><th>Insurance</th><th>Triage</th><th>Stage</th>' +
      '</tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function register() {
    var d = window.STATE.regDraft || {};
    var v = function (k) { return esc(d[k] || ''); };
    var insBlock = '';
    if (d.insurance) {
      var ins = window.INSURANCE[d.insurance];
      var crit = d.insurance === 'unfunded';
      insBlock =
        '<div class="card card-pad mb-2" style="border-color:' + (crit ? '#f0c9c9' : '#cfe8e2') + '">' +
          '<div class="row-between"><div class="flex">' + I(crit ? 'alert' : 'shield', '') +
            '<div><div style="font-weight:600">Insurance · worked out from the national ID</div>' +
            '<div class="muted" style="font-size:12.5px">' + esc(ins.flow) + '</div></div></div>' +
            UI.insuranceBadge(d.insurance) + '</div>' +
          (crit ?
            '<div class="lock-note mt-1">' + I('alert') + '<div>Uninsured & cannot pay → the three-doctor committee reviews and a state-funding memo is raised. If the case is life-threatening, admit at once and settle the money afterwards (BR-2).</div></div>'
          : '') +
        '</div>';
    }

    return UI.pageHead({
      eyebrow: 'Reception', title: 'New registration',
      sub: 'Build the Serial from the national ID · reception collects administrative data only'
    }) +
    UI.lockNote('<b>Administrative only.</b> Reception never records or edits anything medical (BR-4). Vitals and clinical fields are taken by nursing and the treating doctor.') +
    '<div class="grid cols-2 mt-2">' +
      '<div class="card"><div class="card-head"><h3>Patient details</h3></div><div class="card-pad">' +
        '<div class="field"><label>Full name *</label><input id="reg-name" value="' + v('name') + '" placeholder="As on the national ID" /></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>National ID *<span class="hint"> · basis for Serial & insurance</span></label><input id="reg-nationalId" value="' + v('nationalId') + '" placeholder="14 digits" /></div>' +
          '<div class="field"><label>Phone</label><input id="reg-phone" value="' + v('phone') + '" /></div>' +
        '</div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Date of birth</label><input id="reg-dob" type="date" value="' + v('dob') + '" /></div>' +
          '<div class="field"><label>Age</label><input id="reg-age" value="' + v('age') + '" /></div>' +
        '</div>' +
        '<div class="field"><label>Address</label><input id="reg-address" value="' + v('address') + '" /></div>' +
        '<div class="field-row">' +
          '<div class="field"><label>Arrival path</label><select id="reg-arrival">' +
            Object.keys(window.ARRIVAL).map(function (k) {
              return '<option value="' + k + '"' + (d.arrival === k ? ' selected' : '') + '>' + esc(window.ARRIVAL[k]) + '</option>';
            }).join('') + '</select></div>' +
          '<div class="field"><label>Reason for visit</label><input id="reg-complaint" value="' + v('complaint') + '" placeholder="Patient/family stated" /></div>' +
        '</div>' +
        '<label class="flex" style="font-size:13px;cursor:pointer"><input id="reg-lifethreat" type="checkbox" style="width:auto;height:auto"' + (d.lifeThreat ? ' checked' : '') + '/> Life-threatening — admit at once, settle money later (BR-2)</label>' +
      '</div></div>' +

      '<div>' +
        '<div class="card mb-2"><div class="card-head"><h3>Insurance & Serial</h3></div><div class="card-pad">' +
          '<p class="muted" style="font-size:12.5px;margin-bottom:14px">Type the national ID, then verify. The system returns one of four answers and reuses the existing Serial if the patient is known.</p>' +
          '<div class="wrap-gap">' +
            '<button class="btn btn-ghost" onclick="recVerify()">' + I('search') + 'Verify insurance</button>' +
            '<button class="btn btn-primary" onclick="recIssue()">' + I('card') + 'Issue Serial & cards</button>' +
          '</div>' +
        '</div></div>' +
        insBlock +
      '</div>' +
    '</div>';
  }

  function queue() {
    var p = window.selectedPatient();
    var rows = window.DB.patients.map(function (x) {
      var on = x.serial === p.serial;
      return '<tr onclick="STATE.selectedSerial=\'' + x.serial + '\';render()" style="' + (on ? 'background:var(--mist)' : '') + '">' +
        '<td><div class="flex">' + UI.avatarFor(x) + '<div><div class="t-name">' + esc(x.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(x.serial) + '</div></div></div></td>' +
        '<td>' + UI.insuranceBadge(x.insurance) + '</td>' +
        '<td>' + esc(window.stageLabel(x.stage)) + '</td>' +
      '</tr>';
    }).join('');

    var admin =
      '<dl class="kv">' +
        '<dt>Serial</dt><dd class="t-mono">' + esc(p.serial) + '</dd>' +
        '<dt>National ID</dt><dd class="t-mono">' + esc(p.nationalId) + '</dd>' +
        '<dt>Date of birth</dt><dd>' + esc(p.dob || '—') + '</dd>' +
        '<dt>Age / Sex</dt><dd>' + esc(p.age) + ' · ' + esc(p.sex) + '</dd>' +
        '<dt>Phone</dt><dd>' + esc(p.phone || '—') + '</dd>' +
        '<dt>Address</dt><dd>' + esc(p.address || '—') + '</dd>' +
        '<dt>Arrival</dt><dd>' + esc(window.ARRIVAL[p.arrival] || p.arrival) + '</dd>' +
        '<dt>Insurance</dt><dd>' + UI.insuranceBadge(p.insurance) + '</dd>' +
        '<dt>Triage</dt><dd>' + UI.triageBadge(p.triage) + '</dd>' +
        '<dt>Cards</dt><dd>' + (p.cardIssued ? UI.badge('Issued', 'green') : UI.badge('Not issued', 'slate')) + '</dd>' +
      '</dl>';

    return UI.pageHead({ eyebrow: 'Reception', title: 'Patient queue', sub: 'Registered patients · administrative record' }) +
    '<div class="grid cols-2">' +
      '<div class="card"><div class="card-head"><h3>Registered patients</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Insurance</th><th>Stage</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head">' + UI.patientStrip(p) + '</div><div class="card-pad">' +
        admin +
        '<div class="divider"></div>' +
        UI.lockNote('Clinical fields (vitals, diagnosis, medication, the medical file) are hidden from reception. They live in the Nurse and Doctor dashboards.') +
        '<div class="wrap-gap mt-2">' +
          '<button class="btn btn-ghost btn-sm" onclick="recTakePayment(\'' + p.serial + '\')">' + I('money') + 'Take payment</button>' +
          (p.cardIssued ? '<button class="btn btn-soft btn-sm" onclick="UI.toast(\'Cards reprinted\',\'ok\')">' + I('print') + 'Reprint cards</button>' : '') +
        '</div>' +
      '</div></div>' +
    '</div>';
  }

  function appointments() {
    var rows = window.DB.appointments.map(function (a) {
      return '<tr>' +
        '<td><div class="t-name">' + esc(a.name) + '</div><div class="t-sub">' + esc(a.phone) + '</div></td>' +
        '<td>' + esc(a.dept) + '<div class="t-sub">' + esc(a.complaint) + '</div></td>' +
        '<td>' + esc(a.pref) + '</td>' +
        '<td><span class="t-sub">' + esc(a.source) + '</span></td>' +
        '<td>' + (a.status === 'pending' ? UI.badge('Pending', 'gold') : UI.badge('Confirmed', 'green')) + '</td>' +
        '<td>' + (a.status === 'pending'
          ? '<button class="btn btn-primary btn-sm" onclick="recConfirmAppt(\'' + a.id + '\')">' + I('check') + 'Confirm</button>'
          : '<span class="muted">—</span>') + '</td>' +
      '</tr>';
    }).join('');

    // 15-minute slot grid for Cardiology clinic (FR-3.2): daily cap, some booked
    var times = [];
    for (var hh = 9; hh < 13; hh++) { [0, 15, 30, 45].forEach(function (m) { times.push((hh < 10 ? '0' + hh : hh) + ':' + (m === 0 ? '00' : m)); }); }
    var booked = { '09:00': 1, '09:30': 1, '10:15': 1, '11:00': 1, '11:30': 1, '12:00': 1 };
    var cap = 20, used = Object.keys(booked).length;
    var slotEls = times.map(function (t) {
      var isB = booked[t];
      return '<button class="slot ' + (isB ? 'booked' : 'free') + '"' + (isB ? ' disabled' : ' onclick="recBookSlot(\'' + t + '\')"') + '>' + t + '</button>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'Reception', title: 'Appointments & scheduling',
      sub: 'Online requests + the slot book — something the hospital cannot do in person today (FR-2.5)'
    }) +
    '<div class="grid" style="grid-template-columns:1.3fr 1fr;gap:18px">' +
      '<div class="card"><div class="card-head"><h3>Incoming requests</h3>' +
        '<span class="ch-act muted" style="font-size:12px">Reschedule allowed up to 12 h before (FR-3.4)</span></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr>' +
          '<th>Requester</th><th>Department</th><th>Preferred</th><th>Status</th><th></th>' +
        '</tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
      '<div class="card"><div class="card-head"><h3>Cardiology — today</h3>' +
        '<span class="ch-act badge ' + (used >= cap ? 'rose' : 'teal') + '">' + used + '/' + cap + ' booked</span></div><div class="card-pad">' +
        '<p class="muted mb-2" style="font-size:12.5px">15-minute slots, capped at ' + cap + ' per clinic per day (FR-3.2). Pick a free slot to book.</p>' +
        '<div class="slot-grid">' + slotEls + '</div></div></div>' +
    '</div>';
  }
  window.recBookSlot = function (t) {
    UI.toast('Slot ' + t + ' booked · added to the day list', 'ok');
  };

  // build a closing itemized financial file (FR-12.6)
  function invoiceItems(p) {
    var items = [{ desc: 'Registration & administrative file', amt: 150 }];
    if (p.doorTime) items.push({ desc: 'Examination / consultation fee', amt: 300 });
    p.orders.forEach(function (o) {
      var amt = o.type === 'Radiology' ? 800 : o.type === 'Lab' ? 250 : 150;
      items.push({ desc: o.test + ' (' + o.type + ')', amt: amt, film: o.type === 'Radiology' });
    });
    p.prescriptions.forEach(function (rx) { items.push({ desc: 'Medication — ' + rx.drug, amt: 120 }); });
    if (p.balloonTime || p.stage === 'cath') items.push({ desc: 'Cardiac catheterization (PCI) + stent', amt: 25000 });
    if (['recovery', 'ward', 'discharge'].indexOf(p.stage) > -1) items.push({ desc: 'Inpatient bed (per day)', amt: 600 });
    return items;
  }
  window.recFinancialFile = function (serial) {
    var p = window.findPatient(serial);
    var items = invoiceItems(p);
    var fc = window.FILM_CATEGORY[window.filmCategory(p.insurance)];
    var total = items.reduce(function (a, i) { return a + i.amt; }, 0);
    var covered = window.INSURANCE[p.insurance].tone === 'green' ? Math.round(total * 0.8) : (p.insurance === 'selfpay' ? 0 : 0);
    var owed = total - covered;
    var rows = items.map(function (i) {
      return '<tr><td>' + esc(i.desc) + (i.film ? ' <span class="badge slate">film: ' + esc(fc.films) + '</span>' : '') + '</td><td style="text-align:end">' + i.amt.toLocaleString() + '</td></tr>';
    }).join('');
    UI.modal({
      title: 'Closing financial file · ' + p.serial, icon: 'money', wide: true,
      body:
        '<div class="row-between mb-2">' + UI.patientStrip(p) + UI.insuranceBadge(p.insurance) + '</div>' +
        '<div class="lock-note mb-2">' + I('scan') + '<div><b>Radiology film category: ' + esc(fc.label) + '.</b> ' + esc(fc.pays) + ' · ' + esc(fc.films) + ' (BR-10).</div></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Item</th><th style="text-align:end">EGP</th></tr></thead><tbody>' + rows +
          '<tr><td class="t-name">Total</td><td style="text-align:end" class="t-name">' + total.toLocaleString() + '</td></tr>' +
          '<tr><td class="muted">Insurance coverage</td><td style="text-align:end" class="muted">− ' + covered.toLocaleString() + '</td></tr>' +
          '<tr><td class="t-name">Patient owes</td><td style="text-align:end"><b style="color:var(--teal-d);font-size:16px">' + owed.toLocaleString() + ' EGP</b></td></tr>' +
        '</tbody></table></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">' + I('print') + 'Print</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();recTakePayment(\'' + serial + '\')">' + I('money') + 'Take payment</button>'
    });
  };

  function billing() {
    var rows = window.DB.patients.filter(function (p) { return p.cardIssued; }).map(function (p) {
      var owed = window.INSURANCE[p.insurance].tone === 'green' ? 'Covered' : (p.insurance === 'unfunded' ? 'State-funding memo' : 'Self-pay');
      var fc = window.FILM_CATEGORY[window.filmCategory(p.insurance)];
      return '<tr>' +
        '<td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div>' +
          '<div class="t-sub t-mono">' + esc(p.serial) + '</div></div></div></td>' +
        '<td>' + UI.insuranceBadge(p.insurance) + '</td>' +
        '<td><span class="badge slate">' + esc(fc.label) + '</span></td>' +
        '<td>' + esc(owed) + '</td>' +
        '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="recFinancialFile(\'' + p.serial + '\')">' + I('file') + 'Financial file</button>' +
          '<button class="btn btn-soft btn-sm" onclick="recTakePayment(\'' + p.serial + '\')">' + I('money') + 'Pay</button></div></td>' +
      '</tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Reception', title: 'Billing & payments', sub: 'Cash and card, each with its own receipt (FR-12.4) · films charged by category (BR-10)' }) +
    UI.lockNote('Reception takes payment and issues receipts. The closing itemized financial file (FR-12.6) is produced at the end of the visit. Film charges depend on the patient’s category: economic, insurance, or contracted company.') +
    '<div class="card mt-2"><div class="card-head"><h3>Patient accounts</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Insurance</th><th>Film category</th><th>Coverage</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  window.recCommitteeAuthorize = function (serial) {
    var p = window.findPatient(serial);
    if (p.committee) { p.committee.status = 'authorized'; UI.toast('Committee authorized treatment for ' + p.name, 'ok'); window.render(); }
  };
  window.recCommitteeMemo = function (serial) {
    var p = window.findPatient(serial);
    if (p.committee) { p.committee.memo = true; UI.toast('State-funding memo raised to the authorities', 'ok'); window.render(); }
  };

  function committee() {
    var pts = window.DB.patients.filter(function (p) { return p.committee; });
    var members = window.COMMITTEE.map(function (m) {
      return '<div class="flex" style="gap:10px"><div class="avatar" style="width:34px;height:34px;font-size:12px">' + esc(m.name.replace(/^Dr\.?\s*/, '').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('')) + '</div>' +
        '<div><div style="font-weight:600;font-size:13px">' + esc(m.name) + '</div><div class="muted" style="font-size:11.5px">' + esc(m.role) + '</div></div></div>';
    }).join('');

    var cards = pts.length ? pts.map(function (p) {
      var cm = p.committee;
      return '<div class="card mb-2"><div class="card-head">' + UI.patientStrip(p) +
        '<span class="ch-act">' + (cm.status === 'authorized' ? UI.badge('Authorized', 'green') : UI.badge('Pending review', 'gold')) + '</span></div>' +
        '<div class="card-pad">' +
          '<dl class="kv mb-2"><dt>Insurance</dt><dd>' + UI.insuranceBadge(p.insurance) + '</dd>' +
            '<dt>Reason</dt><dd style="text-align:start">' + esc(cm.reason) + '</dd>' +
            '<dt>State-funding memo</dt><dd>' + (cm.memo ? UI.badge('Raised', 'green') : UI.badge('Not yet', 'slate')) + '</dd></dl>' +
          (p.triage === 'critical' ? UI.lockNote('Life-threatening — the patient is admitted at once; the money is settled afterwards (BR-2).') : '') +
          '<div class="wrap-gap mt-2">' +
            (cm.status !== 'authorized' ? '<button class="btn btn-primary btn-sm" onclick="recCommitteeAuthorize(\'' + p.serial + '\')">' + I('check') + 'Authorize treatment</button>' : '') +
            (!cm.memo ? '<button class="btn btn-ghost btn-sm" onclick="recCommitteeMemo(\'' + p.serial + '\')">' + I('file') + 'Raise funding memo</button>' : '') +
          '</div>' +
        '</div></div>';
    }).join('') : '<div class="card card-pad">' + UI.empty('No cases awaiting the committee', 'check') + '</div>';

    return UI.pageHead({ eyebrow: 'Reception', title: 'Three-doctor committee', sub: 'Authorize life-saving treatment and review unfunded cases (UC-5 / FR-12.2)' }) +
      '<div class="card mb-2"><div class="card-head">' + I('shield') + '<h3>Committee members</h3></div><div class="card-pad"><div class="wrap-gap" style="gap:24px">' + members + '</div></div></div>' +
      cards;
  }

  /* ---- register the role ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.reception = {
    label: 'Reception', person: 'Nadia Hassan', icon: 'reception', accent: 'teal',
    desc: 'Register patients, issue the Serial and cards, check insurance, manage appointments and payments — administrative data only.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'Front desk', icon: 'desk' },
      { route: 'register', label: 'New registration', icon: 'plus' },
      { route: 'queue', label: 'Patient queue', icon: 'users' },
      { route: 'appointments', label: 'Appointments', icon: 'calendar', badge: function () { return window.DB.appointments.filter(function (a) { return a.status === 'pending'; }).length; } },
      { route: 'committee', label: 'Committee', icon: 'shield', badge: function () { return window.DB.patients.filter(function (p) { return p.committee && p.committee.status !== 'authorized'; }).length; } },
      { route: 'billing', label: 'Billing', icon: 'money' }
    ],
    render: function (route) {
      switch (route) {
        case 'register': return register();
        case 'queue': return queue();
        case 'appointments': return appointments();
        case 'committee': return committee();
        case 'billing': return billing();
        default: return overview();
      }
    }
  };
})();
