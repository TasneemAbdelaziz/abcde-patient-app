/* ============================================================
   A.B.C.D.E — Staff Dashboards · family.js  (LIVE API)
   The family / caregiver view. ONE linked companion follows the
   patient and acts for them inside the privacy rules (FR-11.x).
   They see STATUS and patient-approved items only — never the
   medical file (FR-11.5 / BR-3). Permissions are per-person and
   they may raise an SOS, rate stages, and give consent (FR-11.2).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { serial: null, visit: null, companions: [], notif: null, edu: [], points: null };

  // plain-language status per stage (FR-4.7) — no clinical detail
  var PLAIN = {
    arrival: 'Being registered at reception', triage: 'Being assessed by the nurse',
    diagnosis: 'Seeing the specialist', cathprep: 'Being prepared for the procedure',
    cath: 'In the procedure', recovery: 'Recovering and being watched closely',
    ward: 'Stable, resting on the ward', discharge: 'Getting ready to go home', followup: 'Home follow-up'
  };

  function mySerial() {
    if (data.serial) return data.serial;
    var u = API.user() || {}; var me = S.me() || {};
    data.serial = u.patient_serial || (me.patient && me.patient.patient_serial) || null;
    return data.serial;
  }
  function ticket() { var s = mySerial(); return s ? '#' + s : null; }
  function myCompanion() {
    // the row that matches the logged-in companion phone, else the first
    var u = API.user() || {};
    return data.companions.find(function (c) { return c.companion_phone === u.name || c.companion_phone === u.username; }) || data.companions[0] || null;
  }

  function load(route) {
    var s = mySerial();
    if (!s) return Promise.resolve();
    var t = '#' + s;
    if (route === 'updates') return API.notifications.list().then(function (n) { data.notif = n; });
    if (route === 'education') return API.education.videos().then(function (e) { data.edu = e || []; });
    if (route === 'permissions') return API.family.list(s).then(function (c) { data.companions = c || []; });
    // status / team
    var jobs = [API.visits.get(t).then(function (v) { data.visit = v; }, function () { data.visit = null; }),
      API.family.list(s).then(function (c) { data.companions = c || []; }, function () { data.companions = []; })];
    if (route === 'status') jobs.push(API.patients.carePoints(s).then(function (p) { data.points = p; }, function () {}));
    return Promise.all(jobs);
  }

  /* ---- actions ---- */
  window.famSOS = function () {
    var t = ticket(); if (!t) { UI.toast('No active visit', 'warn'); return; }
    UI.modal({
      title: 'Raise an emergency', icon: 'alert',
      body: '<div class="lock-note" style="background:#fdf2f2;border-color:#f0c9c9;color:#b23a3a">' + I('alert') + '<div>This alerts the care team in order — treating physician, then nursing station, then you, then the care center (FR-10.2).</div></div>' +
        '<div class="field mt-2"><label>Where is the patient?</label><input id="sos-loc" placeholder="e.g. Ward B - Bed 7" /></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-rose" onclick="famDoSOS()">' + I('alert') + 'Send SOS</button>'
    });
  };
  window.famDoSOS = function () {
    API.emergency.sos({ ticket_no: ticket(), location: (document.getElementById('sos-loc') || {}).value || 'Unknown' })
      .then(function () { UI.closeModal(); UI.toast('Emergency raised — alerting the treating physician', 'err'); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.famTogglePerm = function (id, key, val) {
    var c = data.companions.find(function (x) { return x.id === id; }); if (!c) return;
    var payload = {
      can_see_status: c.can_see_status, receives_alerts: c.receives_alerts, can_book: c.can_book,
      can_rate: c.can_rate, can_raise_emergency: c.can_raise_emergency, is_decision_maker: c.is_decision_maker
    };
    payload[key] = !val;
    API.family.permissions(id, payload).then(function () {
      UI.toast('Permission “' + S.titleCase(key.replace(/_/g, ' ')) + '” ' + (!val ? 'enabled' : 'disabled'), !val ? 'ok' : 'warn');
      return load('permissions').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* ---- screens ---- */
  function status() {
    if (!data.visit) return UI.pageHead({ eyebrow: 'Family', title: 'Status' }) + '<div class="card card-pad">' + UI.empty('No active visit for your patient right now', 'activity') + '</div>';
    var v = S.visit(data.visit);
    var cur = window.stageIndex(v.stage);
    var comp = myCompanion();

    var tiles = '<div class="grid cols-3 mb-2">' +
      UI.tile({ label: 'Current status', value: '<span style="font-size:17px">' + esc(PLAIN[v.stage] || window.stageLabel(v.stage)) + '</span>', icon: 'activity', accent: 'teal' }) +
      UI.tile({ label: 'Department', value: '<span style="font-size:18px">' + esc(v.dept) + '</span>', icon: 'desk', foot: v.room && v.room !== '—' ? v.room : '' }) +
      UI.tile({ label: 'Care team', value: '<span style="font-size:16px">' + esc(v.doctor || '—') + '</span>', icon: 'doctor', foot: 'Treating physician' }) +
    '</div>';

    var tl = window.STAGES.map(function (s, i) {
      var cls = i < cur ? 'done' : i === cur ? 'current' : '';
      return '<div class="tl-item ' + cls + '"><div class="tl-rail"><div class="tl-node">' + (i < cur ? I('check') : i === cur ? I('chevron') : '') + '</div>' +
        (i < window.STAGES.length - 1 ? '<div class="tl-line"></div>' : '') + '</div>' +
        '<div class="tl-body"><div class="tl-name">' + esc(PLAIN[s.key] || s.label) + '</div>' +
        '<div class="tl-sub">' + (i < cur ? 'Done' : i === cur ? 'Happening now' : 'Coming up') + '</div></div></div>';
    }).join('');

    var canSos = comp ? comp.can_raise_emergency : true;
    return UI.pageHead({
      eyebrow: 'Family · ' + esc(comp ? comp.companion_name + ' (' + comp.relation + ')' : 'Companion'),
      title: 'Following ' + esc(v.name),
      sub: 'You see status and approved updates only — not the medical file',
      actions: canSos ? '<button class="btn btn-rose" onclick="famSOS()">' + I('alert') + 'Emergency</button>' : ''
    }) + tiles +
      '<div class="grid" style="grid-template-columns:1fr 300px;gap:18px">' +
        '<div class="card card-pad"><div class="row-between mb-2"><h3 style="font-size:16px">Care journey</h3>' + UI.badge('Live', 'teal') + '</div><div class="timeline">' + tl + '</div></div>' +
        '<div>' + UI.lockNote('For privacy, family sees status updates only. Medical details stay with the treating doctor and the nursing supervisor (BR-3).') +
          '<div class="card mt-2"><div class="card-head"><h3>Loyalty points</h3></div><div class="card-pad">' +
            '<div style="font-size:30px;font-weight:700;font-family:Fraunces,serif;color:var(--teal-d)">' + (data.points ? data.points.total : 0) + '</div>' +
            '<div class="muted" style="font-size:12.5px">Care points earned across the journey (FR-14 loyalty).</div></div></div>' +
        '</div>' +
      '</div>';
  }

  function updates() {
    var n = data.notif || { items: [] };
    var items = (n.items || []).map(function (it) {
      var title = it.title || it.message || it.body || it.type || 'Update';
      return '<div class="alert-row"><div class="ar-ic" style="background:var(--mist);color:var(--teal-d)">' + I('activity') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(title) + '</div><div class="ar-s">' + esc(it.created_at ? S.fmtDateTime(it.created_at) : '') + '</div></div>' +
        (it.read_at ? UI.badge('Read', 'slate') : UI.badge('New', 'teal')) + '</div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Updates', sub: 'Stage moves and decisions you are told about (FR-11.4)' }) +
      '<div class="card card-pad">' + (items || UI.empty('No updates yet', 'bell')) + '</div>';
  }

  function team() {
    if (!data.visit) return UI.pageHead({ eyebrow: 'Family', title: 'Care team' }) + '<div class="card card-pad">' + UI.empty('No active visit', 'stethoscope') + '</div>';
    var v = S.visit(data.visit);
    var members = [
      { ic: 'doctor', name: v.doctor || '—', role: 'Treating physician', note: 'Leads the care plan' },
      { ic: 'desk', name: v.dept, role: 'Department', note: v.room && v.room !== '—' ? 'Room ' + v.room : 'In-patient unit' },
      { ic: 'reception', name: window.HOSPITAL.name, role: 'Care center', note: 'General enquiries' }
    ];
    var cards = members.map(function (m) {
      return '<div class="card card-pad mb-2"><div class="row-between"><div class="flex" style="gap:12px">' +
        '<div class="rt-ic" style="width:46px;height:46px;background:linear-gradient(150deg,#e9f6f3,#d3efe9);color:var(--teal-d)">' + I(m.ic) + '</div>' +
        '<div><div style="font-weight:600">' + esc(m.name) + '</div><div class="muted" style="font-size:12.5px">' + esc(m.role) + ' · ' + esc(m.note) + '</div></div></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Request sent to the care team\',\'ok\')">' + I('phone') + 'Contact</button></div></div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Care team', sub: 'Who is looking after ' + esc(v.name) + ' and how to reach them' }) +
      UI.lockNote('Contact the team for non-clinical questions. For an emergency, use the SOS on the status screen — it alerts the team in order (FR-10.2).') +
      '<div class="mt-2">' + cards + '</div>' +
      '<div class="card card-pad"><div class="row-between"><div class="flex" style="gap:12px"><div class="rt-ic" style="width:46px;height:46px;background:#fbe6e6;color:#b23a3a">' + I('ambulance') + '</div>' +
        '<div><div style="font-weight:600">Emergency</div><div class="muted" style="font-size:12.5px">Available 24/7</div></div></div>' +
        '<div class="cc-v sm" style="font-family:Fraunces,serif">' + esc(window.PUBLIC.contact.emergency) + '</div></div></div>';
  }

  function education() {
    var v = data.visit ? S.visit(data.visit) : null;
    var items = (data.edu || []).map(function (e) {
      var rel = v && (e.journey_stage === v.stage || e.journey_stage === 'any');
      return '<div class="card card-pad mb-2"><div class="row-between"><div class="flex" style="gap:12px">' +
        '<div class="rt-ic" style="width:44px;height:44px;background:linear-gradient(140deg,var(--teal),var(--teal-d));color:#fff">' + I(e.content_type === 'video' ? 'activity' : e.content_type === 'audio' ? 'bell' : 'file') + '</div>' +
        '<div><div style="font-weight:600">' + esc(e.title) + '</div><div class="muted" style="font-size:12px">' + esc(S.titleCase(e.content_type)) + ' · ' + (e.duration_min || '—') + ' min · ' + esc(e.approved_by || '') + (rel ? ' · <span style="color:var(--teal-d)">recommended now</span>' : '') + '</div></div></div>' +
        '<button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Opening: ' + esc(e.title) + '\')">' + I('arrowRight') + 'Open</button></div></div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Learn & prepare', sub: 'Hospital-approved guidance for this stage of the journey (FR-14)' }) +
      UI.lockNote('All educational content is reviewed and approved by the quality team before it is published (FR-14.4).') +
      '<div class="mt-2">' + (items || '<div class="card card-pad">' + UI.empty('No content available', 'file') + '</div>') + '</div>';
  }

  function permissions() {
    var comp = myCompanion();
    if (!comp) return UI.pageHead({ eyebrow: 'Family', title: 'Permissions' }) + '<div class="card card-pad">' + UI.empty('No linked companion found', 'shield') + '</div>';
    var perms = [
      { key: 'can_see_status', label: 'See status', desc: 'Follow where the patient is in their visit' },
      { key: 'receives_alerts', label: 'Get alerts', desc: 'Receive notifications about stage moves' },
      { key: 'can_book', label: 'Book appointments', desc: 'Request appointments for the patient' },
      { key: 'can_rate', label: 'Rate stages', desc: 'Leave feedback on finished stages' },
      { key: 'can_raise_emergency', label: 'Raise an emergency', desc: 'Trigger the SOS escalation chain' }
    ];
    var rows = perms.map(function (pm) {
      var on = !!comp[pm.key];
      return '<div class="row-between" style="padding:13px 0;border-bottom:1px solid var(--line)">' +
        '<div><div style="font-weight:600">' + esc(pm.label) + '</div><div class="muted" style="font-size:12.5px">' + esc(pm.desc) + '</div></div>' +
        '<button class="btn ' + (on ? 'btn-primary' : 'btn-soft') + ' btn-sm" onclick="famTogglePerm(' + comp.id + ',\'' + pm.key + '\',' + on + ')">' + (on ? I('check') + 'Allowed' : 'Off') + '</button></div>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Family', title: 'Permissions & privacy', sub: 'Per-person permissions for the linked companion (FR-11.2 / FR-11.3)' }) +
      UI.lockNote('No permission ever opens the medical file — that stays with the treating doctor and nursing supervisor (FR-11.5).') +
      '<div class="card mt-2"><div class="card-head"><div class="flex"><div class="avatar">' + esc(S.initials(comp.companion_name)) + '</div>' +
        '<div><div style="font-weight:600">' + esc(comp.companion_name) + '</div><div class="muted" style="font-size:12.5px">' + esc(comp.relation) + ' · linked to ' + esc(mySerial()) + '</div></div></div>' +
        '<span class="ch-act">' + (comp.is_accepted ? UI.badge('Active', 'green') : UI.badge('Pending', 'gold')) + '</span></div>' +
      '<div class="card-pad">' + rows + '</div></div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.family = {
    label: 'Family', person: 'Companion', icon: 'users', accent: 'green',
    desc: 'Follow the patient’s status, get updates, give consent when needed, and act for them within the permissions you are granted.',
    home: 'status',
    nav: [
      { route: 'status', label: 'Status', icon: 'activity' },
      { route: 'updates', label: 'Updates', icon: 'bell' },
      { route: 'team', label: 'Care team', icon: 'stethoscope' },
      { route: 'education', label: 'Learn', icon: 'file' },
      { route: 'permissions', label: 'Permissions', icon: 'shield' }
    ],
    load: load,
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
