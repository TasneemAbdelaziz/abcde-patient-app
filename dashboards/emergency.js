/* ============================================================
   A.B.C.D.E — Staff Dashboards · emergency.js  (LIVE API)
   The emergency console runs the ordered escalation from UC-6:
   physician → nursing → family → care center, moving on after a
   set wait with no answer (FR-10.2/10.3). A real emergency is
   told apart from a heads-up (FR-10.4); a Code Blue runs the same
   chain (FR-10.5). Plus a hospital-wide critical-watch feed.
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { active: [], metrics: null, visits: [], open: [], vitalsByTicket: {} };

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
  function news2Of(t) { var a = data.vitalsByTicket[t] || []; if (!a.length) return null; var l = a[a.length - 1]; return l.news2 != null ? l.news2 : news2(l); }

  function load(route) {
    if (route === 'metrics') return API.emergency.metrics().then(function (m) { data.metrics = m; });
    if (route === 'critical') {
      return API.visits.list().then(function (r) {
        data.visits = r || []; data.open = data.visits.filter(function (v) { return v.visit_status === 'open'; });
        return Promise.all(data.open.map(function (v) { return API.vitals.list(v.ticket_no).then(function (a) { data.vitalsByTicket[v.ticket_no] = S.vitals(a); }, function () { data.vitalsByTicket[v.ticket_no] = []; }); }));
      });
    }
    if (route === 'rules') return Promise.resolve();
    // board
    return Promise.all([
      API.emergency.active().then(function (a) { data.active = a || []; }),
      API.emergency.metrics().then(function (m) { data.metrics = m; })
    ]);
  }

  /* ---- chain helpers ---- */
  function steps(e) {
    return [
      { key: 'physician', role: 'Treating physician', at: e.physician_alerted_at },
      { key: 'nursing', role: 'Nursing station', at: e.nursing_alerted_at },
      { key: 'family', role: 'Family contact', at: e.family_alerted_at },
      { key: 'resolved', role: 'Care center / resolved', at: e.resolved_at }
    ];
  }
  function nextStep(e) {
    var s = steps(e);
    for (var i = 0; i < s.length; i++) { if (!s[i].at) return s[i].key; }
    return 'resolved';
  }

  /* ---- actions ---- */
  window.emAdvance = function (id) {
    var e = data.active.find(function (x) { return x.event_id === id; });
    if (!e) return;
    var step = nextStep(e);
    API.emergency.advance(id, { step: step }).then(function () {
      UI.toast('Escalated · ' + S.titleCase(step), 'warn'); return load('board').then(window.render);
    }).catch(function (err) { UI.toast(err.message, 'err'); });
  };
  window.emAnswer = function (id) {
    var me = S.me() || {};
    API.emergency.answer(id, { answered_by: me.name || 'Emergency coordinator', classification: 'real_emergency', resolve: true }).then(function () {
      UI.toast('Alert ' + id + ' answered & resolved', 'ok'); return load('board').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.emCodeBlue = function () {
    var ar = window.STATE.lang === 'ar';
    API.visits.list().then(function (vs) {
      var open = (vs || []).filter(function (v) { return v.visit_status === 'open'; });
      var opts = open.map(function (v) { return '<option value="' + esc(v.ticket_no) + '">' + esc((v.patient && v.patient.full_name) || v.patient_serial) + ' · ' + esc(v.location_code || v.dept_code) + '</option>'; }).join('');
      UI.modal({
        title: 'Trigger Code Blue', icon: 'alert',
        body: '<div class="lock-note" style="background:#fdf2f2;border-color:#f0c9c9;color:#b23a3a">' + I('alert') + '<div>A Code Blue runs the full escalation chain with <b>no confirm step</b> (FR-10.5). Use only for a real arrest.</div></div>' +
          '<div class="field mt-2"><label>Patient</label><select id="cb-ticket">' + opts + '</select></div>' +
          '<div class="field"><label>Location</label><input id="cb-loc" placeholder="e.g. Ward B - Bed 7" /></div>',
        foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
          '<button class="btn btn-rose" onclick="emDoCodeBlue()">' + I('alert') + 'Broadcast Code Blue</button>'
      });
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.emDoCodeBlue = function () {
    var payload = { ticket_no: (document.getElementById('cb-ticket') || {}).value, location: (document.getElementById('cb-loc') || {}).value || 'Unknown' };
    API.emergency.codeBlue(payload).then(function () { UI.closeModal(); UI.toast('Code Blue broadcast — team responding', 'err'); return load('board').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  function chainHTML(e) {
    var s = steps(e); var nx = nextStep(e);
    return '<div class="chain">' + s.map(function (st, i) {
      var done = !!st.at, isNext = !done && st.key === nx;
      var cls = done ? 'answered' : isNext ? 'alerted' : 'pending';
      return '<div class="chain-step ' + cls + '"><div class="chain-rail"><div class="chain-dot">' + (done ? I('check') : isNext ? I('bell') : (i + 1)) + '</div>' +
        (i < s.length - 1 ? '<div class="chain-line"></div>' : '') + '</div>' +
        '<div class="chain-body"><div class="chain-role">' + esc(st.role) + '</div>' +
        '<div class="chain-who">' + (done ? 'alerted ' + esc(S.fmtTime(st.at)) : isNext ? 'alerting…' : 'waiting') + '</div></div></div>';
    }).join('') + '</div>';
  }

  /* ---- screens ---- */
  function board() {
    var m = data.metrics || {};
    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Active alerts', value: data.active.length, icon: 'alert', accent: data.active.length ? 'rose' : '', foot: 'SOS + Code Blue' }) +
      UI.tile({ label: 'Real emergencies', value: m.real_emergencies || 0, icon: 'activity', foot: 'Total to date' }) +
      UI.tile({ label: 'Total events', value: m.total_events || 0, icon: 'bell' }) +
      UI.tile({ label: 'Avg response', value: m.avg_response_seconds != null ? m.avg_response_seconds : '—', unit: 's', icon: 'clock' }) +
    '</div>';

    var cards = data.active.map(function (e) {
      var crit = e.event_type === 'code_blue';
      return '<div class="card mb-2" style="border-color:' + (crit ? '#f0c9c9' : '#f1d9b4') + '">' +
        '<div class="card-head" style="background:' + (crit ? '#fdf2f2' : '#fdf8f0') + '">' +
          '<span class="ti-ic" style="background:' + (crit ? '#fbe6e6' : '#fbf0dd') + ';color:' + (crit ? '#b23a3a' : '#a96b1f') + '">' + I('alert') + '</span>' +
          '<div><h3>' + esc(S.titleCase(e.event_type)) + ' · ' + esc(e.ticket_no) + '</h3>' +
            '<div class="t-sub">triggered by ' + esc(e.triggered_by) + ' at ' + esc(S.fmtTime(e.started_at)) + '</div></div>' +
          '<span class="ch-act">' + (e.classification === 'real_emergency' ? UI.badge('Real emergency', 'rose') : UI.badge('Heads-up', 'gold')) + '</span></div>' +
        '<div class="card-pad"><div class="grid" style="grid-template-columns:1fr 220px;gap:18px">' +
          '<div>' + chainHTML(e) + '</div>' +
          '<div><dl class="kv mb-2"><dt>Elapsed</dt><dd>' + esc(S.ago(e.started_at)) + '</dd><dt>Answered by</dt><dd>' + esc(e.answered_by || '—') + '</dd></dl>' +
            '<div class="wrap-gap"><button class="btn btn-primary btn-sm" onclick="emAnswer(\'' + e.event_id + '\')">' + I('check') + 'Answer & resolve</button>' +
            '<button class="btn btn-soft btn-sm" onclick="emAdvance(\'' + e.event_id + '\')">' + I('arrowRight') + 'No answer · next</button></div></div>' +
        '</div></div></div>';
    }).join('') || '<div class="card card-pad">' + UI.empty('No active alerts — all clear', 'check') + '</div>';

    return UI.pageHead({ eyebrow: 'Emergency · ' + esc(S.me() ? S.me().name : 'Coordinator'), title: 'Live escalation board',
      sub: 'Ordered alerting with automatic escalation (UC-6 / FR-10.x)',
      actions: '<button class="btn btn-rose" onclick="emCodeBlue()">' + I('alert') + 'Code Blue</button>' }) + tiles + cards;
  }

  function critical() {
    var watch = data.open.filter(function (v) { var n = news2Of(v.ticket_no); return n != null && n >= 5; });
    var rows = watch.map(function (vr) {
      var v = S.visit(vr); var a = data.vitalsByTicket[v.ticket] || []; var l = a.length ? a[a.length - 1] : null; var n = news2Of(v.ticket);
      return '<tr><td><div class="flex">' + UI.avatarFor(v) + '<div><div class="t-name">' + esc(v.name) + '</div><div class="t-sub">' + esc(v.dept) + ' · ' + esc(v.room) + '</div></div></div></td>' +
        '<td>' + (n != null ? UI.newsBadge(n) : '—') + '</td>' +
        '<td>' + (l ? (l.pulse || '—') + ' · ' + (l.sbp || '—') + '/' + (l.dbp || '—') + ' · ' + (l.spo2 || '—') + '%' : '—') + '</td>' +
        '<td><button class="btn ' + (n >= 7 ? 'btn-rose' : 'btn-ghost') + ' btn-sm" onclick="UI.toast(\'Rapid response notified for ' + esc(v.name) + '\',\'warn\')">' + I('alert') + 'Respond</button></td></tr>';
    }).join('') || '<tr><td colspan="4">' + UI.empty('No patients crossing the threshold', 'check') + '</td></tr>';

    var d2bOpen = data.open.filter(function (v) { return v.door_time && !v.balloon_time; });
    var clocks = d2bOpen.map(function (vr) {
      var v = S.visit(vr);
      return '<div class="alert-row warn"><div class="ar-ic">' + I('clock') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(v.name) + ' · Door-to-Balloon running</div><div class="ar-s">' + esc(v.room) + ' · door ' + esc(S.fmtTime(v.door)) + ' · target ≤ 90 min</div></div>' +
        '<span class="badge teal">Running</span></div>';
    }).join('') || UI.empty('No open cardiac clocks', 'check');

    return UI.pageHead({ eyebrow: 'Emergency', title: 'Critical watch', sub: 'Hospital-wide early warning (NEWS2 ≥ 5) and live cardiac clocks' }) +
      '<div class="grid cols-3 mb-2">' +
        UI.tile({ label: 'Critical patients', value: watch.length, icon: 'alert', accent: watch.length ? 'rose' : '', foot: 'NEWS2 ≥ 5' }) +
        UI.tile({ label: 'Open cardiac clocks', value: d2bOpen.length, icon: 'clock' }) +
        UI.tile({ label: 'Patients on units', value: data.open.length, icon: 'users' }) +
      '</div>' +
      '<div class="grid" style="grid-template-columns:1.6fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head">' + I('activity') + '<h3>Early-warning feed</h3></div>' +
          '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>NEWS2</th><th>Vitals</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>' +
        '<div class="card"><div class="card-head">' + I('heart') + '<h3>Cardiac clocks</h3></div><div class="card-pad">' + clocks + '</div></div>' +
      '</div>';
  }

  function metrics() {
    var m = data.metrics || {}; var bt = m.by_type || {};
    return UI.pageHead({ eyebrow: 'Emergency', title: 'Response metrics', sub: 'How fast the right people are reached' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Total events', value: m.total_events || 0, icon: 'bell' }) +
        UI.tile({ label: 'Active now', value: m.active || 0, icon: 'alert', accent: m.active ? 'rose' : '' }) +
        UI.tile({ label: 'Real emergencies', value: m.real_emergencies || 0, icon: 'activity' }) +
        UI.tile({ label: 'Avg response', value: m.avg_response_seconds != null ? m.avg_response_seconds : '—', unit: 's', icon: 'clock', accent: 'teal' }) +
      '</div>' +
      '<div class="card"><div class="card-head">' + I('chart') + '<h3>Events by type</h3></div><div class="card-pad">' +
        UI.barChart([{ label: 'SOS', value: bt.sos || 0, display: '' + (bt.sos || 0) }, { label: 'Code Blue', value: bt.code_blue || 0, display: '' + (bt.code_blue || 0) }]) + '</div></div>';
  }

  function rules() {
    var order = [
      { n: 1, role: 'Treating physician', when: 'First' },
      { n: 2, role: 'Nursing station', when: 'No answer in the set wait' },
      { n: 3, role: 'Family contact', when: 'Still no answer' },
      { n: 4, role: 'Care center', when: 'Last resort' }
    ];
    var rows = order.map(function (o) { return '<tr><td class="t-mono">' + o.n + '</td><td class="t-name">' + esc(o.role) + '</td><td class="muted">' + esc(o.when) + '</td></tr>'; }).join('');
    return UI.pageHead({ eyebrow: 'Emergency', title: 'Escalation rules', sub: 'Who is reached, in what order (data table 6.3)' }) +
      UI.lockNote('The SOS can be fired by tap or by voice (accessibility). A real emergency is told apart from a heads-up and routed accordingly. A Code Blue runs the same chain with no confirm step.') +
      '<div class="card mt-2"><div class="card-head"><h3>Ordered chain</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Order</th><th>Who</th><th>When</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.emergency = {
    label: 'Emergency', person: 'Emergency Coordinator', icon: 'alert', accent: 'rose',
    desc: 'Watch live SOS and Code Blue alerts, follow the ordered escalation chain, monitor critical patients, and make sure the right people are reached in time.',
    home: 'board',
    nav: [
      { route: 'board', label: 'Live board', icon: 'alert', badge: function () { return data.active.length; } },
      { route: 'critical', label: 'Critical watch', icon: 'activity' },
      { route: 'metrics', label: 'Metrics', icon: 'chart' },
      { route: 'rules', label: 'Escalation rules', icon: 'route' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'critical': return critical();
        case 'metrics': return metrics();
        case 'rules': return rules();
        default: return board();
      }
    }
  };
})();
