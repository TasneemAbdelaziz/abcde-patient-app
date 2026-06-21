/* ============================================================
   A.B.C.D.E — Apple Watch companion · watch.js
   A glanceable, role-aware watch UI on top of the SAME live API
   (api.js + store.js). Reuses any existing dashboard session
   (shared localStorage on the same origin) or pairs by tapping a
   role. Each role gets a one-screen glance + its key action
   (patient/family → SOS; emergency → Code Blue).
   ============================================================ */

window.WATCH = (function () {
  var I = function (n) { return window.UI ? UI.icon(n) : ''; };
  var esc = window.UI ? UI.esc : function (s) { return String(s == null ? '' : s); };
  var S = window.STORE;
  var screen = document.getElementById('watchScreen');

  var state = { role: null, serial: null, ticket: null };

  var DEMO = {
    patient: '010-0000-0001', family: '010-0000-0003', nurse: 'f.sayed@alamein.example',
    doctor: 'k.adel@alamein.example', emergency: 'k.sami@alamein.example',
    quality: 'h.mansour@alamein.example', director: 'a.zaki@alamein.example'
  };
  var META = {
    patient: { label: 'Patient', icon: 'user' }, family: { label: 'Family', icon: 'users' },
    nurse: { label: 'Nurse', icon: 'nurse' }, doctor: { label: 'Doctor', icon: 'doctor' },
    emergency: { label: 'Emergency', icon: 'alert' }, quality: { label: 'Quality', icon: 'shield' },
    director: { label: 'Director', icon: 'chart' }
  };
  // which renderer handles a backend role (admin folds into the director glance)
  function rendererFor(role) { return RENDER[role] ? role : (role === 'admin' ? 'director' : null); }

  var PLAIN = {
    arrival: 'At reception', triage: 'Being assessed', diagnosis: 'With the specialist',
    cathprep: 'Preparing for procedure', cath: 'In the procedure', recovery: 'In recovery',
    ward: 'Resting on the ward', discharge: 'Getting ready for home', followup: 'Home follow-up'
  };

  /* ---- NEWS2 (client-side, mirrors the service) ---- */
  function sc(p, v) {
    if (v == null || v === '' || isNaN(v)) return 0; v = Number(v);
    switch (p) {
      case 'rr': return v <= 8 ? 3 : v <= 11 ? 1 : v <= 20 ? 0 : v <= 24 ? 2 : 3;
      case 'spo2': return v >= 96 ? 0 : v >= 94 ? 1 : v >= 92 ? 2 : 3;
      case 'temp': return v <= 35 ? 3 : v <= 36 ? 1 : v <= 38 ? 0 : v <= 39 ? 1 : 2;
      case 'sbp': return v <= 90 ? 3 : v <= 100 ? 2 : v <= 110 ? 1 : v <= 219 ? 0 : 3;
      case 'pulse': return v <= 40 ? 3 : v <= 50 ? 1 : v <= 90 ? 0 : v <= 110 ? 1 : v <= 130 ? 2 : 3;
      default: return 0;
    }
  }
  function news2(o) { return sc('rr', o.rr) + sc('spo2', o.spo2) + sc('temp', o.temp) + sc('sbp', o.sbp) + sc('pulse', o.pulse); }
  function bandTone(n) { return n >= 7 ? 'red' : n >= 5 ? 'amber' : n >= 1 ? 'green' : 'slate'; }

  /* ---- chrome ---- */
  function clock() { var d = new Date(); var h = d.getHours() % 12 || 12; return h + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function statusBar(label) {
    return '<div class="w-status"><span class="w-role"><span class="w-dot"></span>' + esc(label) + '</span><span class="w-time" id="wTime">' + clock() + '</span></div>';
  }
  function footer() {
    return '<div class="w-foot-actions">' +
      '<button class="w-btn ghost" onclick="WATCH.refresh()">' + I('route') + 'Refresh</button>' +
      '<button class="w-btn ghost" onclick="WATCH.signOut()">' + I('logout') + 'Sign out</button></div>';
  }
  function set(html) { screen.innerHTML = html; screen.scrollTop = 0; }
  function loading() { set('<div class="w-load"><div class="w-spin"></div><div>Loading…</div></div>'); }
  function shell(label, body) { set(statusBar(label) + '<div class="w-wrap">' + body + '</div>' + footer()); }

  function toast(msg, err) {
    var t = document.getElementById('watchToast'); if (!t) return;
    t.textContent = msg; t.className = 'watch-toast on' + (err ? ' err' : '');
    clearTimeout(t._t); t._t = setTimeout(function () { t.className = 'watch-toast' + (err ? ' err' : ''); }, 2400);
  }

  function tile(label, val, opts) {
    opts = opts || {};
    return '<div class="w-tile ' + (opts.tone || '') + (opts.onclick ? ' tap" onclick="' + opts.onclick + '"' : '"') + '>' +
      '<div class="w-label">' + (opts.icon ? I(opts.icon) : '') + esc(label) + '</div>' +
      '<div class="w-val">' + val + (opts.unit ? ' <small>' + esc(opts.unit) + '</small>' : '') + '</div>' +
      (opts.foot ? '<div class="w-foot">' + esc(opts.foot) + '</div>' : '') + '</div>';
  }
  function row(name, sub, pill, tone) {
    return '<div class="w-row"><div><div class="w-rn">' + esc(name) + '</div>' + (sub ? '<div class="w-rs">' + esc(sub) + '</div>' : '') + '</div>' +
      (pill != null ? '<span class="w-pill ' + (tone || 'slate') + '">' + esc(pill) + '</span>' : '') + '</div>';
  }

  /* ---- role chooser (pairing) ---- */
  function showRoles() {
    var tiles = Object.keys(DEMO).map(function (k) {
      return '<button class="w-rolebtn" id="wr-' + k + '" onclick="WATCH.pick(\'' + k + '\')">' + I(META[k].icon) + '<span>' + META[k].label + '</span></button>';
    }).join('');
    set('<div class="w-brand"><div class="w-logo">A.B.C.D.E</div><div class="w-tag">Apple Watch · tap a role to pair</div></div>' +
      '<div class="w-roles">' + tiles + '</div>');
  }

  /* ---- per-role glance renderers (return a Promise<html-body>) ---- */
  var RENDER = {
    patient: glancePatient, family: glancePatient,
    nurse: glanceNurse, doctor: glanceDoctor, emergency: glanceEmergency,
    quality: glanceQuality, director: glanceDirector
  };

  function glancePatient() {
    var me = S.me() || {};
    var serial = (me.patient && me.patient.patient_serial) || (API.user() && API.user().patient_serial);
    state.serial = serial; state.ticket = serial ? '#' + serial : null;
    if (!serial) return Promise.resolve('<div class="w-empty">No linked patient.</div>');
    return Promise.all([
      API.visits.get('#' + serial).catch(function () { return null; }),
      API.patients.carePoints(serial).catch(function () { return null; }),
      API.meds.list('#' + serial).catch(function () { return []; })
    ]).then(function (r) {
      var v = r[0] ? S.visit(r[0]) : null;
      var pts = r[1] ? r[1].total : 0;
      var rx = r[2] || [];
      var name = (me.patient && me.patient.full_name) || me.name || 'You';
      var body = '<div class="w-h1">' + esc(name.split(' ')[0]) + '</div>';
      if (v) {
        body += '<div class="w-stage"><div class="w-stage-k">Current status</div>' +
          '<div class="w-stage-v">' + esc(PLAIN[v.stage] || window.stageLabel(v.stage)) + '</div>' +
          '<div class="w-stage-s">' + esc(v.dept) + (v.room && v.room !== '—' ? ' · ' + esc(v.room) : '') + '</div></div>';
      } else {
        body += '<div class="w-tile"><div class="w-label">Status</div><div class="w-foot">No active visit right now.</div></div>';
      }
      if (rx.length) body += tile('Next medication', '<span style="font-size:17px">' + esc(rx[0].drug_name) + '</span>', { icon: 'pill', foot: rx[0].dose + ' · ' + rx[0].route + ' · ' + rx.length + ' active' });
      body += tile('Care points', pts, { tone: 'teal', icon: 'heart', foot: 'Loyalty rewards' });
      body += '<button class="w-btn sos" onclick="WATCH.sos()">' + I('alert') + 'Emergency SOS</button>';
      return body;
    });
  }

  function glanceNurse() {
    return API.visits.list().then(function (vs) {
      var open = (vs || []).filter(function (v) { return v.visit_status === 'open'; });
      return Promise.all(open.map(function (v) { return API.vitals.list(v.ticket_no).then(function (a) { return { v: v, vit: S.vitals(a) }; }, function () { return { v: v, vit: [] }; }); }))
        .then(function (rows) {
          var crit = rows.map(function (r) {
            var l = r.vit.length ? r.vit[r.vit.length - 1] : null;
            var n = l ? (l.news2 != null ? l.news2 : news2(l)) : null;
            return { v: S.visit(r.v), n: n };
          }).filter(function (x) { return x.n != null; }).sort(function (a, b) { return b.n - a.n; });
          var warnings = crit.filter(function (x) { return x.n >= 5; });
          var body = '<div class="w-h1">Ward</div><div class="w-sub">' + open.length + ' patients on unit</div>';
          body += tile('Early warnings', warnings.length, { tone: warnings.length ? 'red' : 'teal', icon: 'alert', foot: 'NEWS2 ≥ 5' });
          (warnings.length ? warnings : crit).slice(0, 4).forEach(function (x) {
            body += row(x.v.name, x.v.room, 'NEWS2 ' + x.n, bandTone(x.n));
          });
          if (!crit.length) body += '<div class="w-empty">No vitals recorded yet.</div>';
          return body;
        });
    });
  }

  function glanceDoctor() {
    return API.visits.list().then(function (vs) {
      var sid = S.staffId();
      var mine = (vs || []).filter(function (v) { return sid && v.treating_doctor_id === sid; });
      if (!mine.length) mine = (vs || []).filter(function (v) { return v.visit_status === 'open'; });
      var active = mine.filter(function (v) { return ['discharge', 'followup'].indexOf(v.current_stage) === -1 && v.visit_status === 'open'; });
      var running = mine.filter(function (v) { return v.door_time && !v.balloon_time; });
      var body = '<div class="w-h1">My patients</div>';
      body += tile('Active cases', active.length, { tone: 'teal', icon: 'stethoscope', foot: mine.length + ' total assigned' });
      if (running.length) body += tile('Door-to-Balloon', 'Running', { tone: 'amber', icon: 'clock', foot: running.length + ' awaiting cath' });
      mine.slice(0, 4).forEach(function (vr) { var v = S.visit(vr); body += row(v.name, v.dept, window.stageLabel(v.stage), 'slate'); });
      return body;
    });
  }

  function glanceEmergency() {
    return Promise.all([API.emergency.active().catch(function () { return []; }), API.emergency.metrics().catch(function () { return {}; })])
      .then(function (r) {
        var active = r[0] || [], m = r[1] || {};
        var body = '<div class="w-h1">Emergency</div>';
        body += tile('Active alerts', active.length, { tone: active.length ? 'red' : 'teal', icon: 'alert', foot: (m.real_emergencies || 0) + ' real to date' });
        active.slice(0, 3).forEach(function (e) {
          body += row(S.titleCase(e.event_type), e.ticket_no + ' · ' + (e.triggered_by || ''), e.classification === 'real_emergency' ? 'REAL' : 'Heads-up', e.classification === 'real_emergency' ? 'red' : 'amber');
        });
        if (!active.length) body += '<div class="w-empty">All clear — no active alerts.</div>';
        body += '<button class="w-btn code" onclick="WATCH.codeBlue()">' + I('alert') + 'Trigger Code Blue</button>';
        return body;
      });
  }

  function glanceQuality() {
    return API.quality.dashboard().then(function (d) {
      d = d || {};
      var body = '<div class="w-h1">Quality</div>';
      body += tile('Satisfaction', (d.avg_satisfaction != null ? d.avg_satisfaction.toFixed(1) : '—'), { tone: 'teal', unit: '/ 5', icon: 'heart', foot: (d.ratings_count || 0) + ' ratings' });
      body += tile('Open complaints', d.complaints ? d.complaints.open : 0, { tone: (d.complaints && d.complaints.open) ? 'amber' : '', icon: 'clipboard' });
      body += tile('Answered ≤ 6h', (d.complaints ? d.complaints.answered_within_6h_pct : 0) + '%', { icon: 'clock', foot: 'SLA compliance' });
      return body;
    });
  }

  function glanceDirector() {
    return API.reports.kpis().then(function (k) {
      k = k || {};
      var body = '<div class="w-h1">Hospital KPIs</div>';
      body += tile('Door-to-Balloon', (k.avg_door_to_balloon_min != null ? k.avg_door_to_balloon_min : '—'), { tone: 'teal', unit: 'min', icon: 'clock', foot: 'Target ≤ 90' });
      body += tile('Open visits', k.open_visits != null ? k.open_visits : '—', { icon: 'users', foot: (k.cardiac_cases || 0) + ' cardiac cases' });
      body += tile('Satisfaction', (k.avg_satisfaction != null ? k.avg_satisfaction.toFixed(1) : '—'), { unit: '/ 5', icon: 'heart' });
      return body;
    });
  }

  function glance() {
    var role = state.role;
    var fn = RENDER[role];
    if (!fn) { showRoles(); return Promise.resolve(); }
    loading();
    return fn().then(function (body) {
      shell(META[role] ? META[role].label : S.titleCase(role), body);
    }).catch(function (e) {
      shell(META[role] ? META[role].label : role, '<div class="w-err">' + esc(e.message || 'Could not load') + '</div>');
    });
  }

  /* ---- actions ---- */
  return {
    pick: function (roleKey) {
      var btn = document.getElementById('wr-' + roleKey); if (btn) btn.classList.add('loading');
      return API.auth.login(DEMO[roleKey], 'password').then(function () { return API.auth.me(); }).then(function (me) {
        S.setMe(me); state.role = rendererFor(me.role) || roleKey; return glance();
      }).catch(function (e) { if (btn) btn.classList.remove('loading'); toast(e.message || 'Sign-in failed', true); });
    },
    refresh: function () { glance(); },
    signOut: function () { API.auth.logout().catch(function () {}); S.setMe(null); state = { role: null }; showRoles(); },
    sos: function () {
      if (!state.ticket) { toast('No active visit', true); return; }
      API.emergency.sos({ ticket_no: state.ticket, location: 'Sent from Apple Watch' })
        .then(function () { toast('SOS sent — alerting the care team'); })
        .catch(function (e) { toast(e.message || 'Could not send SOS', true); });
    },
    codeBlue: function () {
      API.visits.list().then(function (vs) {
        var open = (vs || []).filter(function (v) { return v.visit_status === 'open'; });
        if (!open.length) { toast('No open visit', true); return; }
        return API.emergency.codeBlue({ ticket_no: open[0].ticket_no, location: 'Sent from Apple Watch' })
          .then(function () { toast('Code Blue broadcast'); glance(); });
      }).catch(function (e) { toast(e.message || 'Failed', true); });
    },
    boot: function () {
      // tick the clock
      setInterval(function () { var t = document.getElementById('wTime'); if (t) t.textContent = clock(); }, 15000);
      if (API.isAuthed()) {
        loading();
        API.auth.me().then(function (me) {
          S.setMe(me);
          var r = rendererFor(me.role);
          if (r) { state.role = r; glance(); } else { showRoles(); }
        }).catch(function () { API.clearSession(); showRoles(); });
      } else { showRoles(); }
    }
  };
})();

WATCH.boot();
