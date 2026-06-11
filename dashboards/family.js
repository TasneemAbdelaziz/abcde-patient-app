/* ============================================================
   A.B.C.D.E — Staff Dashboards · family.js
   The family / caregiver view. ONE linked companion may follow
   the patient and act for them inside the privacy rules (FR-11.x).
   They see STATUS and patient-approved items only — never the
   medical file (FR-11.5 / BR-3). Permissions are per-person:
   see status, get alerts, book, rate, raise an emergency
   (FR-11.2). They are told about stage moves and big decisions
   and asked for consent where the hospital needs it (FR-11.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  function link() { return window.DB.familyLink; }
  function patient() { return window.findPatient(link().patientSerial); }

  // plain-language status per stage (FR-4.7) — no clinical detail
  var PLAIN = {
    arrival: 'Being registered at reception',
    triage: 'Being assessed by the nurse',
    er: 'With the emergency doctor',
    diagnosis: 'Seeing the specialist',
    cathprep: 'Being prepared for the procedure',
    cath: 'In the procedure',
    recovery: 'Recovering and being watched closely',
    ward: 'Stable, resting on the ward',
    discharge: 'Getting ready to go home',
    followup: 'Home follow-up'
  };

  /* ---- actions ---- */
  window.famTogglePerm = function (key) {
    var p = link().permissions; p[key] = !p[key];
    UI.toast('Permission “' + key + '” ' + (p[key] ? 'enabled' : 'disabled'), p[key] ? 'ok' : 'warn');
    window.render();
  };
  window.famConsent = function (give) {
    link().consentPending = null;
    UI.toast(give ? 'Consent given — the team has been notified' : 'Consent declined', give ? 'ok' : 'warn');
    window.render();
  };
  window.famSOS = function () {
    if (!link().permissions.sos) { UI.toast('You do not have permission to raise an emergency', 'warn'); return; }
    UI.modal({
      title: 'Raise an emergency', icon: 'alert',
      body: '<div class="lock-note" style="background:#fdf2f2;border-color:#f0c9c9;color:#b23a3a">' + I('alert') + '<div>This alerts the care team in order — treating physician, then nursing station, then you, then the care center (FR-10.2).</div></div>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-rose" onclick="UI.closeModal();UI.toast(\'Emergency raised — alerting the treating physician\',\'err\')">' + I('alert') + 'Send SOS</button>'
    });
  };
  window.famRate = function () {
    if (!link().permissions.rate) { UI.toast('You do not have permission to rate', 'warn'); return; }
    UI.toast('Thanks — your rating helps the hospital improve', 'ok');
  };

  /* ---- screens ---- */
  function status() {
    var p = patient();
    var cur = window.stageIndex(p.stage);
    var pending = link().consentPending;

    var tiles = '<div class="grid cols-3 mb-2">' +
      UI.tile({ label: 'Current status', value: '<span style="font-size:18px">' + esc(PLAIN[p.stage] || window.stageLabel(p.stage)) + '</span>', icon: 'activity', accent: 'teal' }) +
      UI.tile({ label: 'Department', value: '<span style="font-size:20px">' + esc(p.department) + '</span>', icon: 'desk', foot: p.room && p.room !== '—' ? p.room : '' }) +
      UI.tile({ label: 'Care team', value: '<span style="font-size:18px">' + esc(p.doctor || '—') + '</span>', icon: 'doctor', foot: 'Treating physician' }) +
    '</div>';

    var tl = window.STAGES.map(function (s, i) {
      var cls = i < cur ? 'done' : i === cur ? 'current' : '';
      return '<div class="tl-item ' + cls + '"><div class="tl-rail"><div class="tl-node">' + (i < cur ? I('check') : i === cur ? I('chevron') : '') + '</div>' +
        (i < window.STAGES.length - 1 ? '<div class="tl-line"></div>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-name">' + esc(PLAIN[s.key] || s.label) + '</div>' +
        '<div class="tl-sub">' + (i < cur ? 'Done' : i === cur ? 'Happening now' : 'Coming up') + '</div></div></div>';
    }).join('');

    var consentCard = pending ?
      '<div class="card mb-2" style="border-color:#f1d9b4"><div class="card-head" style="background:#fdf8f0">' + I('shield') + '<h3>A decision needs your consent</h3></div><div class="card-pad">' +
        '<p class="mb-2"><b>' + esc(pending.item) + '</b><br><span class="muted">Requested at ' + esc(pending.askedAt) + '. As the named decision-maker, you may consent on the patient’s behalf.</span></p>' +
        '<div class="wrap-gap"><button class="btn btn-primary" onclick="famConsent(true)">' + I('check') + 'Give consent</button>' +
          '<button class="btn btn-soft" onclick="famConsent(false)">Decline</button></div>' +
      '</div></div>' : '';

    return UI.pageHead({
      eyebrow: 'Family · ' + esc(link().companion.name) + ' (' + esc(link().companion.relation) + ')',
      title: 'Following ' + esc(p.name),
      sub: 'You see status and approved updates only — not the medical file',
      actions: (link().permissions.sos ? '<button class="btn btn-rose" onclick="famSOS()">' + I('alert') + 'Emergency</button>' : '')
    }) +
      tiles + consentCard +
      '<div class="grid" style="grid-template-columns:1fr 300px;gap:18px">' +
        '<div class="card card-pad"><div class="row-between mb-2"><h3 style="font-size:16px">Care journey</h3>' + UI.badge('Live', 'teal') + '</div><div class="timeline">' + tl + '</div></div>' +
        '<div>' +
          UI.lockNote('For your privacy and the patient’s, family sees status updates only. Medical details stay with the treating doctor and the nursing supervisor (BR-3).') +
          '<div class="card mt-2"><div class="card-head"><h3>You can</h3></div><div class="card-pad">' +
            '<div class="wrap-gap">' +
              (link().permissions.book ? '<button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Opening appointments…\')">' + I('calendar') + 'Book</button>' : '') +
              (link().permissions.rate ? '<button class="btn btn-ghost btn-sm" onclick="famRate()">' + I('heart') + 'Rate a stage</button>' : '') +
              '<button class="btn btn-soft btn-sm" onclick="STATE.route=\'permissions\';render()">' + I('shield') + 'Permissions</button>' +
            '</div>' +
          '</div></div>' +
        '</div>' +
      '</div>';
  }

  function updates() {
    var p = patient();
    var items = p.stageHistory.slice().reverse().map(function (h) {
      return '<div class="alert-row"><div class="ar-ic" style="background:var(--mist);color:var(--teal-d)">' + I('activity') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(PLAIN[h.stage] || window.stageLabel(h.stage)) + '</div><div class="ar-s">' + esc(h.at) + '</div></div>' + UI.badge('Update', 'teal') + '</div>';
    }).join('');
    var consent = link().consentPending
      ? '<div class="alert-row warn"><div class="ar-ic">' + I('shield') + '</div><div class="ar-body"><div class="ar-t">Consent requested: ' + esc(link().consentPending.item) + '</div><div class="ar-s">' + esc(link().consentPending.askedAt) + '</div></div>' +
        '<button class="btn btn-primary btn-sm" onclick="STATE.route=\'status\';render()">Review</button></div>'
      : '';

    return UI.pageHead({ eyebrow: 'Family', title: 'Updates', sub: 'Stage moves and decisions you are told about (FR-11.4)' }) +
      '<div class="card card-pad">' + consent + (items || UI.empty('No updates yet', 'bell')) + '</div>';
  }

  function permissions() {
    var perms = [
      { key: 'status', label: 'See status', desc: 'Follow where the patient is in their visit' },
      { key: 'alerts', label: 'Get alerts', desc: 'Receive notifications about stage moves' },
      { key: 'book', label: 'Book appointments', desc: 'Request appointments for the patient' },
      { key: 'rate', label: 'Rate stages', desc: 'Leave feedback on finished stages' },
      { key: 'sos', label: 'Raise an emergency', desc: 'Trigger the SOS escalation chain' }
    ];
    var rows = perms.map(function (pm) {
      var on = link().permissions[pm.key];
      return '<div class="row-between" style="padding:13px 0;border-bottom:1px solid var(--line)">' +
        '<div><div style="font-weight:600">' + esc(pm.label) + '</div><div class="muted" style="font-size:12.5px">' + esc(pm.desc) + '</div></div>' +
        '<button class="btn ' + (on ? 'btn-primary' : 'btn-soft') + ' btn-sm" onclick="famTogglePerm(\'' + pm.key + '\')">' + (on ? I('check') + 'Allowed' : 'Off') + '</button>' +
      '</div>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Family', title: 'Permissions & privacy', sub: 'Per-person permissions for the linked companion (FR-11.2 / FR-11.3)' }) +
      UI.lockNote('Only one companion may be linked per patient. No permission ever opens the medical file — that stays with the treating doctor and nursing supervisor (FR-11.5).') +
      '<div class="card mt-2"><div class="card-head"><div class="flex"><div class="avatar">' + esc(link().companion.initials) + '</div>' +
        '<div><div style="font-weight:600">' + esc(link().companion.name) + '</div><div class="muted" style="font-size:12.5px">' + esc(link().companion.relation) + ' · linked to ' + esc(patient().name) + '</div></div></div>' +
        '<span class="ch-act">' + UI.badge('Active', 'green') + '</span></div>' +
      '<div class="card-pad">' + rows + '</div></div>';
  }

  function team() {
    var p = patient();
    var members = [
      { ic: 'doctor', name: p.doctor || '—', role: 'Treating physician', note: 'Leads the care plan' },
      { ic: 'nurse', name: 'Fatma El-Sayed', role: 'Nursing supervisor', note: 'Day-to-day care & vitals' },
      { ic: 'desk', name: window.HOSPITAL.name, role: 'Care center', note: 'General enquiries' }
    ];
    var cards = members.map(function (m) {
      return '<div class="card card-pad mb-2"><div class="row-between"><div class="flex" style="gap:12px">' +
        '<div class="rt-ic" style="width:46px;height:46px;background:linear-gradient(150deg,#e9f6f3,#d3efe9);color:var(--teal-d)">' + I(m.ic) + '</div>' +
        '<div><div style="font-weight:600">' + esc(m.name) + '</div><div class="muted" style="font-size:12.5px">' + esc(m.role) + ' · ' + esc(m.note) + '</div></div></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Request sent to the care team\',\'ok\')">' + I('phone') + 'Contact</button></div></div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Care team', sub: 'Who is looking after ' + esc(p.name) + ' and how to reach them' }) +
      UI.lockNote('You can contact the team for non-clinical questions. For an emergency, use the SOS on the status screen — it alerts the team in order (FR-10.2).') +
      '<div class="mt-2">' + cards + '</div>' +
      '<div class="card card-pad"><div class="row-between"><div class="flex" style="gap:12px"><div class="rt-ic" style="width:46px;height:46px;background:#fbe6e6;color:#b23a3a">' + I('ambulance') + '</div>' +
        '<div><div style="font-weight:600">Emergency</div><div class="muted" style="font-size:12.5px">Available 24/7</div></div></div>' +
        '<div class="cc-v sm" style="font-family:Fraunces,serif">' + esc(window.PUBLIC.contact.emergency) + '</div></div></div>';
  }

  function education() {
    var p = patient();
    var items = window.EDUCATION.map(function (e) {
      var rel = e.stage === p.stage || e.stage === 'any';
      return '<div class="card card-pad mb-2"><div class="row-between"><div class="flex" style="gap:12px">' +
        '<div class="rt-ic" style="width:44px;height:44px;background:linear-gradient(140deg,var(--teal),var(--teal-d));color:#fff">' + I(e.type === 'Video' ? 'activity' : e.type === 'Audio' ? 'bell' : 'file') + '</div>' +
        '<div><div style="font-weight:600">' + esc(e.title) + '</div><div class="muted" style="font-size:12px">' + esc(e.type) + ' · ' + e.mins + ' min · ' + esc(e.topic) + (rel ? ' · <span style="color:var(--teal-d)">recommended now</span>' : '') + '</div></div></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Opening: ' + esc(e.title) + '\')">' + I('arrowRight') + 'Open</button></div></div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Learn & prepare', sub: 'Hospital-approved guidance for this stage of the journey (FR-14)' }) +
      UI.lockNote('All educational content is reviewed and approved by the quality team before it is published (FR-14.4).') +
      '<div class="mt-2">' + items + '</div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.family = {
    label: 'Family', person: 'Mariam Al-Rashid · Companion', icon: 'users', accent: 'teal',
    desc: 'Follow the patient’s status, get updates, give consent when needed, and act for them within the permissions you are granted.',
    home: 'status',
    nav: [
      { route: 'status', label: 'Status', icon: 'activity' },
      { route: 'updates', label: 'Updates', icon: 'bell', badge: function () { return link().consentPending ? 1 : 0; } },
      { route: 'team', label: 'Care team', icon: 'stethoscope' },
      { route: 'education', label: 'Learn', icon: 'file' },
      { route: 'permissions', label: 'Permissions', icon: 'shield' }
    ],
    render: function (route) {
      switch (route) {
        case 'updates': return updates();
        case 'team': return team();
        case 'education': return education();
        case 'permissions': return permissions();
        default: return status();
      }
    }
  };
})();
