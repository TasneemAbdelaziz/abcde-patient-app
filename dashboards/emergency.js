/* ============================================================
   A.B.C.D.E — Staff Dashboards · emergency.js
   The emergency console runs the ordered escalation from UC-6.
   An SOS reaches people in order — treating physician, nursing
   station, family contact, care center (FR-10.2) — moving to the
   next after a set wait with no answer (FR-10.3). A real emergency
   is told apart from an ordinary heads-up (FR-10.4) and a Code Blue
   runs the same chain (FR-10.5).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  function active() { return window.DB.emergencies.filter(function (e) { return e.status === 'active'; }); }

  /* ---- actions ---- */
  window.emAdvance = function (id) {
    var e = window.DB.emergencies.find(function (x) { return x.id === id; });
    if (!e) return;
    // current alerted step -> no-answer, next pending -> alerted (FR-10.3)
    var cur = e.chain[e.step];
    if (cur && cur.status === 'alerted') cur.status = 'no-answer';
    var next = e.chain[e.step + 1];
    if (next) {
      e.step += 1; next.status = 'alerted'; next.at = 'now';
      UI.toast('No answer — escalated to ' + next.role, 'warn');
    } else {
      UI.toast('End of chain reached', 'warn');
    }
    window.render();
  };
  window.emAnswer = function (id) {
    var e = window.DB.emergencies.find(function (x) { return x.id === id; });
    if (!e) return;
    var cur = e.chain[e.step];
    if (cur) cur.status = 'answered';
    e.status = 'resolved'; e.elapsed = 'resolved';
    UI.toast(cur ? cur.role + ' answered — ' + e.id + ' resolved' : e.id + ' resolved', 'ok');
    window.render();
  };
  window.emCodeBlue = function () {
    UI.modal({
      title: 'Trigger Code Blue', icon: 'alert',
      body:
        '<div class="lock-note crit-note" style="background:#fdf2f2;border-color:#f0c9c9;color:#b23a3a">' + I('alert') + '<div>A Code Blue runs the full escalation chain with <b>no confirm step</b> (FR-10.5). Use only for a real arrest.</div></div>' +
        '<div class="field mt-2"><label>Patient / location</label><input id="cb-loc" placeholder="e.g. Ward B-7" /></div>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-rose" onclick="UI.closeModal();UI.toast(\'Code Blue broadcast — team responding\',\'err\')">' + I('alert') + 'Broadcast Code Blue</button>'
    });
  };

  function chainHTML(e) {
    return '<div class="chain">' + e.chain.map(function (s, i) {
      var cls = s.status;
      var icons = { answered: I('check'), alerted: I('bell'), 'no-answer': I('x'), na: '', pending: (i + 1) };
      return '<div class="chain-step ' + cls + '">' +
        '<div class="chain-rail"><div class="chain-dot">' + (icons[s.status] != null ? icons[s.status] : (i + 1)) + '</div>' +
          (i < e.chain.length - 1 ? '<div class="chain-line"></div>' : '') + '</div>' +
        '<div class="chain-body"><div class="chain-role">' + esc(s.role) + '</div>' +
          '<div class="chain-who">' + esc(s.who) + (s.at ? ' · ' + esc(s.at) : '') +
          (s.status === 'no-answer' ? ' · no answer' : s.status === 'alerted' ? ' · alerting…' : s.status === 'answered' ? ' · answered' : s.status === 'na' ? ' · n/a' : ' · waiting') +
          (s.wait && s.wait !== '—' && s.status === 'alerted' ? ' (' + esc(s.wait) + ')' : '') + '</div></div>' +
      '</div>';
    }).join('') + '</div>';
  }

  function board() {
    var act = active();
    var real = act.filter(function (e) { return e.kind === 'real'; }).length;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Active alerts', value: act.length, icon: 'alert', accent: act.length ? 'teal' : '', foot: 'SOS + Code Blue' }) +
      UI.tile({ label: 'Real emergencies', value: real, icon: 'activity', foot: 'Need intervention now' }) +
      UI.tile({ label: 'Resolved today', value: window.DB.emergencies.filter(function (e) { return e.status === 'resolved'; }).length, icon: 'check' }) +
      UI.tile({ label: 'On call', value: 'Dr. Karim Adel', icon: 'doctor', foot: 'Treating physician' }) +
    '</div>';

    var cards = window.DB.emergencies.map(function (e) {
      var resolved = e.status === 'resolved';
      var crit = e.type === 'Code Blue';
      return '<div class="card mb-2" style="border-color:' + (resolved ? 'var(--line)' : crit ? '#f0c9c9' : '#f1d9b4') + '">' +
        '<div class="card-head" style="background:' + (resolved ? '#fff' : crit ? '#fdf2f2' : '#fdf8f0') + '">' +
          '<span class="ti-ic" style="background:' + (crit ? '#fbe6e6' : '#fbf0dd') + ';color:' + (crit ? '#b23a3a' : '#a96b1f') + '">' + I('alert') + '</span>' +
          '<div><h3>' + esc(e.type) + ' · ' + esc(e.patient) + '</h3>' +
            '<div class="t-sub">' + esc(e.room) + ' · ' + esc(e.serial) + ' · triggered by ' + esc(e.triggeredBy) + ' at ' + esc(e.started) + '</div></div>' +
          '<span class="ch-act">' + (resolved ? UI.badge('Resolved', 'green') : e.kind === 'real' ? UI.badge('Real emergency', 'rose') : UI.badge('Heads-up', 'gold')) + '</span>' +
        '</div>' +
        '<div class="card-pad"><div class="grid" style="grid-template-columns:1fr 220px;gap:18px">' +
          '<div>' + chainHTML(e) + '</div>' +
          '<div>' +
            '<dl class="kv mb-2"><dt>Elapsed</dt><dd>' + esc(e.elapsed) + '</dd><dt>At step</dt><dd>' + (e.step + 1) + ' / ' + e.chain.length + '</dd></dl>' +
            (resolved ? '<span class="badge green badge-lg"><span class="bdot"></span>Handled</span>' :
              '<div class="wrap-gap">' +
                '<button class="btn btn-primary btn-sm" onclick="emAnswer(\'' + e.id + '\')">' + I('check') + 'Mark answered</button>' +
                '<button class="btn btn-soft btn-sm" onclick="emAdvance(\'' + e.id + '\')">' + I('arrowRight') + 'No answer · next</button>' +
              '</div>') +
          '</div>' +
        '</div></div>' +
      '</div>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'Emergency · ' + esc(window.STAFF.emergency.name), title: 'Live escalation board',
      sub: 'Ordered alerting with automatic escalation (UC-6 / FR-10.x)',
      actions: '<button class="btn btn-rose" onclick="emCodeBlue()">' + I('alert') + 'Code Blue</button>'
    }) + tiles + cards;
  }

  function rules() {
    var order = [
      { n: 1, role: 'Treating physician', when: 'First' },
      { n: 2, role: 'Nursing station', when: 'No answer in the set wait' },
      { n: 3, role: 'Family contact', when: 'Still no answer' },
      { n: 4, role: 'Care center', when: 'Last resort' }
    ];
    var rows = order.map(function (o) {
      return '<tr><td class="t-mono">' + o.n + '</td><td class="t-name">' + esc(o.role) + '</td><td class="muted">' + esc(o.when) + '</td></tr>';
    }).join('');
    return UI.pageHead({ eyebrow: 'Emergency', title: 'Escalation rules', sub: 'Who is reached, in what order (data table 6.3)' }) +
      UI.lockNote('The SOS can be fired by tap or by voice (accessibility). A real emergency that needs intervention now is told apart from an ordinary heads-up and routed accordingly. A Code Blue runs the same chain with no confirm step.') +
      '<div class="card mt-2"><div class="card-head"><h3>Ordered chain</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Order</th><th>Who</th><th>When</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function latest(p) { return p.vitals.length ? p.vitals[p.vitals.length - 1] : null; }

  function critical() {
    // hospital-wide early-warning feed (NEWS2 ≥ 5 or High risk) + live cardiac clocks
    var watch = window.DB.patients.filter(function (p) { var l = latest(p); return (l && l.news2 >= 5) || (p.riskScore && p.riskScore.value === 'High'); });
    var d2bOpen = window.DB.patients.filter(function (p) { return p.doorTime && !p.balloonTime && (p.triage === 'critical' || p.department.indexOf('Card') > -1 || p.department === 'Resuscitation'); });

    var rows = watch.map(function (p) {
      var l = latest(p);
      return '<tr><td><div class="flex">' + UI.avatarFor(p) + '<div><div class="t-name">' + esc(p.name) + '</div><div class="t-sub">' + esc(p.department) + ' · ' + esc(p.room) + '</div></div></div></td>' +
        '<td>' + (l ? UI.newsBadge(l.news2) : '—') + '</td>' +
        '<td>' + (l ? l.pulse + ' · ' + l.sbp + '/' + l.dbp + ' · ' + l.spo2 + '%' : '—') + '</td>' +
        '<td>' + (p.riskScore ? UI.badge(p.riskScore.value, p.riskScore.value === 'High' ? 'rose' : 'gold') : '—') + '</td>' +
        '<td><button class="btn ' + (l && l.news2 >= 7 ? 'btn-rose' : 'btn-ghost') + ' btn-sm" onclick="UI.toast(\'Rapid response notified for ' + esc(p.name) + '\',\'warn\')">' + I('alert') + 'Respond</button></td></tr>';
    }).join('');

    var clocks = d2bOpen.map(function (p) {
      return '<div class="alert-row warn"><div class="ar-ic">' + I('clock') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(p.name) + ' · Door-to-Balloon running</div><div class="ar-s">' + esc(p.room) + ' · door ' + esc((p.doorTime || '').slice(11)) + ' · target ≤ 90 min</div></div>' +
        '<span class="badge teal">Running</span></div>';
    }).join('') || UI.empty('No open cardiac clocks', 'check');

    return UI.pageHead({ eyebrow: 'Emergency', title: 'Critical watch', sub: 'Hospital-wide early warning (NEWS2 ≥ 5) and live cardiac clocks' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Critical patients', value: watch.length, icon: 'alert', accent: watch.length ? 'teal' : '', foot: 'NEWS2 ≥ 5 or high risk' }) +
        UI.tile({ label: 'Open cardiac clocks', value: d2bOpen.length, icon: 'clock' }) +
        UI.tile({ label: 'Avg → responder', value: window.RESPONSE.avgToResponder, icon: 'activity' }) +
        UI.tile({ label: 'On call', value: 'Dr. Karim Adel', icon: 'doctor' }) +
      '</div>' +
      '<div class="grid" style="grid-template-columns:1.6fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head">' + I('activity') + '<h3>Early-warning feed</h3></div>' +
          (watch.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>NEWS2</th><th>Vitals</th><th>Risk</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>' : '<div class="card-pad">' + UI.empty('No patients crossing the threshold', 'check') + '</div>') + '</div>' +
        '<div class="card"><div class="card-head">' + I('heart') + '<h3>Cardiac clocks</h3></div><div class="card-pad">' + clocks + '</div></div>' +
      '</div>';
  }

  function metrics() {
    var R = window.RESPONSE;
    var resolved = window.DB.emergencies.filter(function (e) { return e.status === 'resolved'; });
    var logRows = window.DB.emergencies.map(function (e) {
      return '<tr><td class="t-mono">' + esc(e.id) + '</td><td>' + esc(e.type) + '</td><td>' + esc(e.patient) + '</td><td>' + esc(e.started) + '</td>' +
        '<td>' + (e.kind === 'real' ? UI.badge('Real', 'rose') : UI.badge('Heads-up', 'gold')) + '</td>' +
        '<td>' + (e.status === 'resolved' ? UI.badge('Resolved', 'green') : UI.badge('Active', 'teal')) + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Emergency', title: 'Response metrics', sub: 'How fast the right people are reached' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Avg → first responder', value: R.avgToResponder, icon: 'clock', accent: 'teal' }) +
        UI.tile({ label: 'Avg time to resolve', value: R.avgResolve, icon: 'check' }) +
        UI.tile({ label: 'SOS this month', value: R.sosMonth, icon: 'alert' }) +
        UI.tile({ label: 'Code Blue this month', value: R.codeBlueMonth, icon: 'activity' }) +
      '</div>' +
      '<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head">' + I('chart') + '<h3>Response time trend (s)</h3><span class="ch-act badge green">↓ improving</span></div><div class="card-pad">' +
          UI.lineChart([{ values: R.trend, color: '#d96666' }], { labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'], h: 160 }) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Today</h3></div><div class="card-pad"><dl class="kv">' +
          '<dt>Alerts</dt><dd>' + window.DB.emergencies.length + '</dd><dt>Resolved</dt><dd>' + resolved.length + '</dd>' +
          '<dt>Active</dt><dd>' + active().length + '</dd></dl></div></div>' +
      '</div>' +
      '<div class="card mt-2"><div class="card-head"><h3>Alert log</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>ID</th><th>Type</th><th>Patient</th><th>Started</th><th>Kind</th><th>Status</th></tr></thead><tbody>' + logRows + '</tbody></table></div></div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.emergency = {
    label: 'Emergency', person: 'Amir Zaki · Coordinator', icon: 'alert', accent: 'teal',
    desc: 'Watch live SOS and Code Blue alerts, follow the ordered escalation chain, monitor critical patients, and make sure the right people are reached in time.',
    home: 'board',
    nav: [
      { route: 'board', label: 'Live board', icon: 'alert', badge: function () { return active().length; } },
      { route: 'critical', label: 'Critical watch', icon: 'activity', badge: function () { return window.DB.patients.filter(function (p) { var l = p.vitals.length ? p.vitals[p.vitals.length - 1] : null; return l && l.news2 >= 7; }).length; } },
      { route: 'metrics', label: 'Metrics', icon: 'chart' },
      { route: 'rules', label: 'Escalation rules', icon: 'route' }
    ],
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
