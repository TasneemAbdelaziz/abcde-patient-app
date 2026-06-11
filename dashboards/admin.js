/* ============================================================
   A.B.C.D.E — Staff Dashboards · admin.js
   Administration covers the hospital director and the IT admin.
   The director reads the management numbers — patient counts,
   average stage times, the Door-to-Balloon KPI, and a department
   comparison (FR-15.2) — plus the scheduled monthly reports
   (FR-15.3). The IT admin creates accounts and sets permissions
   (FR-15.1) and runs the integration with DMS, lab, radiology
   and pharmacy (FR-15.4/15.5/15.6).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  function avgD2B() {
    var done = window.DB.patients.filter(function (p) { return window.doorToBalloon(p) != null; });
    if (!done.length) return null;
    return Math.round(done.reduce(function (a, p) { return a + window.doorToBalloon(p); }, 0) / done.length);
  }

  /* ---- actions ---- */
  window.adminToggleUser = function (id) {
    var u = window.DB.users.find(function (x) { return x.id === id; });
    if (!u) return;
    u.status = u.status === 'active' ? 'disabled' : 'active';
    UI.toast(u.name + ' is now ' + u.status, u.status === 'active' ? 'ok' : 'warn');
    window.render();
  };
  window.adminApproveUser = function (id) {
    var u = window.DB.users.find(function (x) { return x.id === id; });
    if (u) { u.status = 'active'; u.last = 'now'; UI.toast(u.name + ' account approved', 'ok'); window.render(); }
  };
  window.adminNewUser = function () {
    UI.modal({
      title: 'Create account', icon: 'user',
      body:
        '<div class="field"><label>Full name</label><input id="u-name" placeholder="Staff member" /></div>' +
        '<div class="field"><label>Role</label><select id="u-role"><option>Receptionist</option><option>Nurse</option><option>Doctor</option><option>Quality Manager</option><option>Emergency Coord.</option><option>Hospital Director</option></select></div>' +
        '<div class="field"><label>Department</label><input id="u-dept" placeholder="e.g. Cardiology" /></div>' +
        UI.lockNote('Permissions follow the role: who can view and who can edit, screen by screen and field by field (FR-1.7).'),
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="adminSaveUser()">' + I('check') + 'Create account</button>'
    });
  };
  window.adminSaveUser = function () {
    var name = (document.getElementById('u-name') || {}).value || '';
    if (!name) { UI.toast('Enter a name', 'warn'); return; }
    var role = (document.getElementById('u-role') || {}).value || 'Nurse';
    var dept = (document.getElementById('u-dept') || {}).value || '—';
    window.DB.users.push({ id: 'U-' + (10 + window.DB.users.length), name: name, role: role, dept: dept, status: 'active', last: 'now' });
    UI.closeModal(); UI.toast('Account created for ' + name, 'ok'); window.render();
  };
  window.adminSchedule = function () {
    UI.toast('Monthly report scheduled to the director’s list', 'ok');
  };

  /* ---- screens ---- */
  function overview() {
    var pts = window.DB.patients;
    var d2b = avgD2B();
    var trend = window.DB.kpis.monthlyD2B;

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Door-to-Balloon (avg)', value: d2b == null ? '—' : d2b, unit: 'min', icon: 'clock', accent: 'teal', foot: '↓ 14 min vs Jan · target < 60' }) +
      UI.tile({ label: 'Patients today', value: pts.length, icon: 'users', foot: 'Across all arrival paths' }) +
      UI.tile({ label: 'Active staff', value: window.DB.users.filter(function (u) { return u.status === 'active'; }).length, icon: 'shield', foot: window.DB.users.filter(function (u) { return u.status === 'pending'; }).length + ' pending approval' }) +
      UI.tile({ label: 'Patient satisfaction', value: '4.2', unit: '/ 5', icon: 'heart', foot: 'Across departments' }) +
    '</div>';

    // patients by stage (donut)
    var byStage = {};
    pts.forEach(function (p) { var l = window.stageLabel(p.stage); byStage[l] = (byStage[l] || 0) + 1; });
    var stageSegs = Object.keys(byStage).map(function (k, i) { return { label: k, value: byStage[k], color: UI.palette(i) }; });

    var deptRows = window.DB.kpis.deptComparison.map(function (d) {
      return '<tr><td class="t-name">' + esc(d.dept) + '</td><td>' + d.patients + '</td><td>' + d.avgStage + ' min</td>' +
        '<td>' + UI.stars(Math.round(d.satisfaction)) + ' <span class="muted">' + d.satisfaction.toFixed(1) + '</span></td></tr>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'Administration · ' + esc(window.STAFF.admin.name), title: 'Management dashboard',
      sub: 'Key performance indicators and reporting (FR-15.2)',
      actions: '<button class="btn btn-ghost" onclick="STATE.route=\'aimodels\';render()">' + I('sparkle') + 'AI models</button>' +
        '<button class="btn btn-primary" onclick="STATE.route=\'reports\';render()">' + I('file') + 'Reports</button>'
    }) + tiles +
      '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head">' + I('clock') + '<h3>Door-to-Balloon trend</h3><span class="ch-act badge green">↓ improving</span></div>' +
          '<div class="card-pad">' + UI.lineChart([{ values: trend.map(function (x) { return x.v; }), color: '#0d9488' }], { labels: trend.map(function (x) { return x.m; }), h: 170, min: 40 }) +
          '<p class="muted mt-1" style="font-size:12.5px">Minutes from arrival (door) to balloon inflation. Lower is better — six-month average.</p></div></div>' +
        '<div class="card"><div class="card-head"><h3>Patients by stage</h3></div><div class="card-pad">' +
          UI.donut(stageSegs, { centerValue: pts.length, centerLabel: 'patients' }) + '</div></div>' +
      '</div>' +
      '<div class="card mt-2"><div class="card-head"><h3>Department comparison</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Department</th><th>Patients</th><th>Avg stage time</th><th>Satisfaction</th></tr></thead><tbody>' + deptRows + '</tbody></table></div></div>';
  }

  function aimodels() {
    var models = window.DB.aiModels;
    var live = models.filter(function (m) { return m.status === 'live'; }).length;
    var totalCalls = models.reduce(function (a, m) { return a + m.calls; }, 0);
    var avgAcc = Math.round(models.reduce(function (a, m) { return a + m.accuracy; }, 0) / models.length);

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'AI models', value: models.length, icon: 'sparkle', accent: 'teal', foot: live + ' live · ' + (models.length - live) + ' in beta' }) +
      UI.tile({ label: 'Calls this week', value: totalCalls.toLocaleString(), icon: 'activity' }) +
      UI.tile({ label: 'Avg accuracy', value: avgAcc, unit: '%', icon: 'shield' }) +
      UI.tile({ label: 'Recommended scope', value: '1 · 2 · 4', icon: 'check', foot: 'Advisor · Sentiment · Reports' }) +
    '</div>';

    var cards = models.map(function (m) {
      return '<div class="ai-mcard">' +
        '<div class="amc-top"><div class="amc-ic">' + I(m.icon) + '</div>' +
          '<div><div class="amc-name">' + esc(m.name) + '</div><div class="amc-eng">' + esc(m.engine) + '</div></div>' +
          '<span style="margin-inline-start:auto">' + (m.status === 'live' ? UI.badge('Live', 'green') : UI.badge('Beta', 'gold')) + '</span></div>' +
        '<div class="amc-desc">' + esc(m.purpose) + '</div>' +
        '<div class="amc-foot"><span class="muted">' + esc(m.fr) + '</span>' +
          '<span style="margin-inline-start:auto">' + I('activity') + ' <b>' + m.accuracy + '%</b></span>' +
          '<span>' + I('clock') + ' ' + esc(m.latency) + '</span></div>' +
      '</div>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'Administration · AI', title: 'AI models', sub: 'The assistants powering the platform (S8 / S9, risk & sentiment)'
    }) + tiles +
      '<div class="grid cols-2 mb-2">' +
        '<div class="card"><div class="card-head"><h3>AI usage this week</h3></div><div class="card-pad">' +
          UI.lineChart([{ values: window.DB.aiUsage.week, color: '#0d9488' }], { labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], h: 160 }) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Calls by model</h3></div><div class="card-pad">' +
          UI.barChart(window.DB.aiUsage.byModel.map(function (x) { return { label: x.label, value: x.value, display: x.value.toLocaleString() }; })) + '</div></div>' +
      '</div>' +
      UI.lockNote('AI safety rules are enforced: the advisor does not diagnose and hands red flags to a clinician; report drafts are stored only after a doctor approves them (NFR-2).') +
      '<div class="grid cols-3 mt-2">' + cards + '</div>';
  }

  function reports() {
    var stageBars = window.DB.kpis.avgStageTimes.map(function (s) { return { label: s.stage, value: s.mins, display: s.mins + 'm' }; });
    return UI.pageHead({
      eyebrow: 'Administration', title: 'Reports', sub: 'Scheduled monthly reports to a set list (FR-15.3)',
      actions: '<button class="btn btn-primary" onclick="adminSchedule()">' + I('calendar') + 'Schedule monthly report</button>'
    }) +
      '<div class="grid cols-2">' +
        '<div class="card"><div class="card-head"><h3>Average time per stage</h3></div><div class="card-pad">' + UI.barChart(stageBars) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Scheduled reports</h3></div><div class="card-pad">' +
          '<div class="alert-row"><div class="ar-ic" style="background:var(--mist);color:var(--teal-d)">' + I('file') + '</div>' +
            '<div class="ar-body"><div class="ar-t">Monthly KPI report</div><div class="ar-s">Door-to-Balloon, patient counts, department comparison · to director + quality</div></div>' + UI.badge('Monthly', 'teal') + '</div>' +
          '<div class="alert-row"><div class="ar-ic" style="background:var(--mist);color:var(--teal-d)">' + I('heart') + '</div>' +
            '<div class="ar-body"><div class="ar-t">Patient experience summary</div><div class="ar-s">AI sentiment + complaint themes · to director + department heads</div></div>' + UI.badge('Monthly', 'teal') + '</div>' +
          '<div class="divider"></div>' + UI.lockNote('Door-to-Balloon is the hospital’s main cardiac quality number and is always on the management screen (FR-15.2 detail).') +
        '</div></div>' +
      '</div>';
  }

  function users() {
    var rows = window.DB.users.map(function (u) {
      var tone = u.status === 'active' ? 'green' : u.status === 'pending' ? 'gold' : 'slate';
      return '<tr><td><div class="flex"><div class="avatar" style="width:34px;height:34px;font-size:12px">' + esc(u.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('')) + '</div>' +
        '<div><div class="t-name">' + esc(u.name) + '</div><div class="t-sub">' + esc(u.dept) + '</div></div></div></td>' +
        '<td>' + esc(u.role) + '</td>' +
        '<td>' + UI.badge(u.status.charAt(0).toUpperCase() + u.status.slice(1), tone) + '</td>' +
        '<td class="muted">' + esc(u.last) + '</td>' +
        '<td>' + (u.status === 'pending'
          ? '<button class="btn btn-primary btn-sm" onclick="adminApproveUser(\'' + u.id + '\')">' + I('check') + 'Approve</button>'
          : '<button class="btn btn-soft btn-sm" onclick="adminToggleUser(\'' + u.id + '\')">' + (u.status === 'active' ? 'Disable' : 'Enable') + '</button>') + '</td></tr>';
    }).join('');

    return UI.pageHead({
      eyebrow: 'IT Administration', title: 'Users & roles', sub: 'Create accounts and set permissions (FR-15.1)',
      actions: '<button class="btn btn-primary" onclick="adminNewUser()">' + I('plus') + 'Create account</button>'
    }) +
      UI.lockNote('Roles enforce who can view and who can edit, screen by screen and field by field (FR-1.7). The medical file stays with the treating doctor and nursing supervisor; reception is admin-only (FR-1.8).') +
      '<div class="card mt-2"><div class="card-head"><h3>Accounts</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Status</th><th>Last active</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function integration() {
    var stateBadge = function (s) {
      return s === 'dummy' ? UI.badge('Dummy-data APIs', 'gold') :
        s === 'partial' ? UI.badge('Partly manual', 'gold') :
        s === 'pending' ? UI.badge('To confirm', 'slate') : UI.badge('Live', 'green');
    };
    var rows = window.DB.integration.map(function (g) {
      return '<tr><td><div class="t-name">' + esc(g.system) + '</div><div class="t-sub">' + esc(g.vendor) + '</div></td>' +
        '<td>' + esc(g.link) + '</td>' +
        '<td>' + stateBadge(g.state) + '</td>' +
        '<td class="muted" style="max-width:320px">' + esc(g.note) + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Integration', sub: 'Links to DMS, lab, radiology and pharmacy (FR-15.4 / FR-15.5)' }) +
      UI.lockNote('There are no live integration APIs yet — they are bought from the DMS vendor. Until then the platform runs over the hospital LAN behind an IP whitelist and works off dummy-data API documentation, standing as the source of truth (FR-15.6).') +
      '<div class="card mt-2"><div class="card-head"><h3>External systems</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>System</th><th>Link</th><th>Status</th><th>Notes</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function permissions() {
    var P = window.PERMISSIONS;
    var cell = function (v) {
      var map = { edit: ['Edit', 'teal'], view: ['View', 'slate'], rate: ['Rate', 'gold'], none: ['—', 'none'] };
      var m = map[v] || map.none;
      return v === 'none' ? '<span class="muted">—</span>' : UI.badge(m[0], m[1]);
    };
    var head = '<tr><th>Role</th>' + P.resources.map(function (r) { return '<th>' + esc(r) + '</th>'; }).join('') + '</tr>';
    var rows = P.rows.map(function (row) {
      return '<tr><td class="t-name">' + esc(row.role) + '</td>' + row.perms.map(function (v) { return '<td>' + cell(v) + '</td>'; }).join('') + '</tr>';
    }).join('');
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Permissions matrix', sub: 'Who may view and who may edit, by resource (FR-1.7 / FR-1.8)' }) +
      UI.lockNote('The medical file is for the treating doctor and nursing supervisor only; reception is administrative-only and never edits anything medical; each department sees only its own part (BR-3 / BR-4).') +
      '<div class="card mt-2"><div class="card-head"><h3>Role × resource</h3></div>' +
      '<div class="table-wrap"><table class="t perm-matrix"><thead>' + head + '</thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function audit() {
    var log = window.DB.auditLog;
    var actBadge = function (a) {
      var m = { edit: ['Edit', 'teal'], view: ['View', 'slate'], create: ['Create', 'green'], lock: ['Lock', 'rose'] };
      return UI.badge((m[a] || [a, 'slate'])[0], (m[a] || [a, 'slate'])[1]);
    };
    var rows = log.map(function (e) {
      return '<tr><td class="t-mono">' + esc(e.at) + '</td>' +
        '<td><div class="t-name">' + esc(e.user) + '</div><div class="t-sub">' + esc(e.role) + '</div></td>' +
        '<td>' + actBadge(e.action) + '</td>' +
        '<td>' + esc(e.what) + '</td>' +
        '<td class="t-mono">' + esc(e.target) + '</td>' +
        '<td>' + (e.window === 'expired' ? UI.badge('Window expired', 'rose') : e.window === '—' ? '<span class="muted">—</span>' : UI.badge(e.window, 'green')) + '</td></tr>';
    }).join('');
    var edits = log.filter(function (e) { return e.action === 'edit'; }).length;
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Audit trail', sub: 'Every view and edit of clinical data is logged with who, role, and when (NFR-11)' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Events today', value: log.length, icon: 'clipboard' }) +
        UI.tile({ label: 'Edits', value: edits, icon: 'edit' }) +
        UI.tile({ label: 'Self-edit window', value: 15, unit: 'min', icon: 'clock', accent: 'teal', foot: 'Then sys-admin only' }) +
        UI.tile({ label: 'Records locked', value: log.filter(function (e) { return e.action === 'lock'; }).length, icon: 'shield' }) +
      '</div>' +
      UI.lockNote('Staff may correct their own entries for 15 minutes; after that, only the system administrator can change a record. Every access is traceable (NFR-11).') +
      '<div class="card mt-2"><div class="card-head"><h3>Recent activity</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Time</th><th>User</th><th>Action</th><th>Detail</th><th>Record</th><th>Edit window</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.admin = {
    label: 'Administration', person: 'Dr. Hisham Nour · Director', icon: 'chart', accent: 'teal',
    desc: 'Read the KPIs and monthly reports, manage staff accounts and permissions, audit access, and oversee integration.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'KPIs', icon: 'chart' },
      { route: 'reports', label: 'Reports', icon: 'file' },
      { route: 'aimodels', label: 'AI models', icon: 'sparkle' },
      { route: 'users', label: 'Users & roles', icon: 'users', badge: function () { return window.DB.users.filter(function (u) { return u.status === 'pending'; }).length; } },
      { route: 'permissions', label: 'Permissions', icon: 'shield' },
      { route: 'audit', label: 'Audit trail', icon: 'clipboard' },
      { route: 'integration', label: 'Integration', icon: 'route' }
    ],
    render: function (route) {
      switch (route) {
        case 'permissions': return permissions();
        case 'audit': return audit();
        case 'reports': return reports();
        case 'aimodels': return aimodels();
        case 'users': return users();
        case 'integration': return integration();
        default: return overview();
      }
    }
  };
})();
