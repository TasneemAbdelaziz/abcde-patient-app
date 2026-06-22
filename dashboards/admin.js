/* ============================================================
   A.B.C.D.E — Staff Dashboards · admin.js  (LIVE API)
   Administration = the IT admin + the hospital director.
   The director reads the management numbers — Door-to-Balloon,
   patient counts, satisfaction, monthly reports (FR-15.2/15.3).
   The IT admin creates accounts & sets permissions (FR-15.1) and
   oversees DMS/lab/radiology/pharmacy integration (FR-15.4/5/6).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { kpis: null, monthly: [], users: [], perms: null, audit: [], integrations: [], aiModels: [], quality: null, emMetrics: null,
    content: { tab: 'education', education: [], departments: [], drugs: [] } };

  /* ---- loaders ---- */
  function load(route) {
    var jobs = [];
    if (route === 'overview') jobs.push(API.reports.kpis().then(function (k) { data.kpis = k; }), API.reports.monthly().then(function (m) { data.monthly = m || []; }));
    if (route === 'reports') jobs.push(API.reports.kpis().then(function (k) { data.kpis = k; }), API.reports.monthly().then(function (m) { data.monthly = m || []; }));
    if (route === 'aimodels') jobs.push(API.admin.aiModels().then(function (m) { data.aiModels = m || []; }));
    if (route === 'users') jobs.push(API.admin.users().then(function (u) { data.users = u || []; }));
    if (route === 'permissions') jobs.push(API.admin.getPermissions().then(function (p) { data.perms = p; }));
    if (route === 'audit') jobs.push(API.admin.audit().then(function (a) { data.audit = a || []; }));
    if (route === 'integration') jobs.push(API.admin.integrations().then(function (g) { data.integrations = g || []; }));
    if (route === 'content') jobs.push(
      API.admin.education().then(function (e) { data.content.education = e || []; }, function () {}),
      API.admin.departments().then(function (d) { data.content.departments = d || []; }, function () {}),
      API.admin.drugs().then(function (d) { data.content.drugs = d || []; }, function () {})
    );
    // director-only routes
    if (route === 'quality') jobs.push(API.quality.dashboard().then(function (q) { data.quality = q; }));
    if (route === 'emergency') jobs.push(API.emergency.metrics().then(function (m) { data.emMetrics = m; }));
    return Promise.all(jobs);
  }

  /* ---- actions ---- */
  window.adminToggleUser = function (id, active, role) {
    API.admin.setRole(id, { role: role, is_active: !active }).then(function () {
      UI.toast('Account ' + (!active ? 'enabled' : 'disabled'), !active ? 'ok' : 'warn');
      return load('users').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.adminSetRole = function (id, currentRole, active) {
    var roles = ['reception', 'nurse', 'doctor', 'quality', 'director', 'emergency', 'admin', 'patient', 'family'];
    var opts = roles.map(function (r) { return '<option value="' + r + '"' + (r === currentRole ? ' selected' : '') + '>' + S.titleCase(r) + '</option>'; }).join('');
    UI.modal({
      title: 'Change role', icon: 'shield',
      body: '<div class="field"><label>Role</label><select id="ur-role">' + opts + '</select></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="adminDoSetRole(' + id + ',' + active + ')">' + I('check') + 'Save</button>'
    });
  };
  window.adminDoSetRole = function (id, active) {
    API.admin.setRole(id, { role: (document.getElementById('ur-role') || {}).value, is_active: active }).then(function () {
      UI.closeModal(); UI.toast('Role updated', 'ok'); return load('users').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.adminNewUser = function () {
    UI.modal({
      title: 'Create account', icon: 'user',
      body: '<div class="field"><label>Full name</label><input id="u-name" placeholder="Staff member" /></div>' +
        '<div class="field-row"><div class="field"><label>Email / username</label><input id="u-email" placeholder="name@alamein.example" /></div>' +
        '<div class="field"><label>Role</label><select id="u-role"><option value="reception">Reception</option><option value="nurse">Nurse</option><option value="doctor" selected>Doctor</option><option value="quality">Quality</option><option value="director">Director</option><option value="emergency">Emergency</option><option value="admin">Admin</option></select></div></div>' +
        '<div class="field-row"><div class="field"><label>Staff ID</label><input id="u-staff" placeholder="e.g. D-009" /></div>' +
        '<div class="field"><label>Password</label><input id="u-pass" type="password" value="password" /></div></div>' +
        UI.lockNote('Permissions follow the role: who can view and who can edit, screen by screen and field by field (FR-1.7).'),
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button><button class="btn btn-primary" onclick="adminSaveUser()">' + I('check') + 'Create account</button>'
    });
  };
  window.adminSaveUser = function () {
    var name = (document.getElementById('u-name') || {}).value || '';
    var email = (document.getElementById('u-email') || {}).value || '';
    if (!name.trim() || !email.trim()) { UI.toast('Name and email are required', 'warn'); return; }
    var payload = { name: name.trim(), email: email.trim(), username: email.trim(), role: (document.getElementById('u-role') || {}).value, staff_id: (document.getElementById('u-staff') || {}).value || null, password: (document.getElementById('u-pass') || {}).value || 'password', locale: 'en' };
    API.admin.storeUser(payload).then(function () { UI.closeModal(); UI.toast('Account created for ' + name, 'ok'); return load('users').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* ---- shared KPI building ---- */
  function kpiTiles() {
    var k = data.kpis || {};
    return '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Door-to-Balloon (avg)', value: k.avg_door_to_balloon_min != null ? k.avg_door_to_balloon_min : '—', unit: 'min', icon: 'clock', accent: 'teal', foot: 'Target ≤ 90' }) +
      UI.tile({ label: 'Open visits', value: k.open_visits != null ? k.open_visits : '—', icon: 'users', foot: k.cardiac_cases + ' cardiac cases' }) +
      UI.tile({ label: 'Satisfaction', value: k.avg_satisfaction != null ? k.avg_satisfaction.toFixed(1) : '—', unit: '/ 5', icon: 'heart' }) +
      UI.tile({ label: 'Complaints ≤ 6h', value: (k.complaints_answered_within_6h_pct != null ? k.complaints_answered_within_6h_pct : '—') + '%', icon: 'clipboard', foot: k.complaints_total + ' total' }) +
    '</div>';
  }
  function d2bTrendCard() {
    var m = data.monthly || [];
    return '<div class="card"><div class="card-head">' + I('clock') + '<h3>Door-to-Balloon trend</h3>' + (m.length > 1 && m[m.length - 1].avg_door_to_balloon_min < m[0].avg_door_to_balloon_min ? '<span class="ch-act badge green">↓ improving</span>' : '') + '</div>' +
      '<div class="card-pad">' + (m.length ? UI.lineChart([{ values: m.map(function (x) { return x.avg_door_to_balloon_min; }), color: '#0d9488' }], { labels: m.map(function (x) { return x.month.slice(5); }), h: 170, min: 40 }) : UI.empty('No monthly data')) +
      '<p class="muted mt-1" style="font-size:12.5px">Minutes from arrival (door) to balloon inflation. Lower is better.</p></div></div>';
  }

  /* ---- screens (admin) ---- */
  function overview() {
    var m = data.monthly || [];
    var casesBars = m.map(function (x) { return { label: x.month.slice(5), value: x.cardiac_cases_count, display: '' + x.cardiac_cases_count }; });
    return UI.pageHead({
      eyebrow: 'Administration · ' + esc(S.me() ? S.me().name : 'Director'), title: 'Management dashboard',
      sub: 'Key performance indicators and reporting (FR-15.2)',
      actions: '<button class="btn btn-ghost" onclick="App.go(\'aimodels\')">' + I('sparkle') + 'AI models</button>' +
        '<button class="btn btn-primary" onclick="App.go(\'reports\')">' + I('file') + 'Reports</button>'
    }) + kpiTiles() +
      '<div class="grid" style="grid-template-columns:1.5fr 1fr;gap:18px">' + d2bTrendCard() +
        '<div class="card"><div class="card-head"><h3>Cardiac cases / month</h3></div><div class="card-pad">' + (casesBars.length ? UI.barChart(casesBars) : UI.empty('No data')) + '</div></div>' +
      '</div>';
  }

  function reports() {
    var m = data.monthly || [];
    var rows = m.slice().reverse().map(function (x) {
      return '<tr><td class="t-name">' + esc(x.month) + '</td><td>' + x.avg_door_to_balloon_min + ' min</td><td>' + x.cardiac_cases_count + '</td>' +
        '<td>' + UI.stars(Math.round(Number(x.avg_satisfaction))) + ' <span class="muted">' + Number(x.avg_satisfaction).toFixed(1) + '</span></td>' +
        '<td>' + x.complaints_count + '</td><td>' + x.complaints_answered_within_6h_pct + '%</td><td>' + (x.avg_sos_response_seconds != null ? x.avg_sos_response_seconds + 's' : '—') + '</td></tr>';
    }).join('') || '<tr><td colspan="7">' + UI.empty('No monthly reports') + '</td></tr>';
    return UI.pageHead({ eyebrow: 'Administration', title: 'Reports', sub: 'Scheduled monthly reports to a set list (FR-15.3)',
      actions: '<button class="btn btn-primary" onclick="UI.toast(\'Monthly report scheduled to the director\\\'s list\',\'ok\')">' + I('calendar') + 'Schedule monthly report</button>' }) +
      kpiTiles() +
      '<div class="card"><div class="card-head"><h3>Monthly KPI history (FR-15.2)</h3></div>' +
        '<div class="table-wrap"><table class="t"><thead><tr><th>Month</th><th>Door-to-Balloon</th><th>Cardiac cases</th><th>Satisfaction</th><th>Complaints</th><th>≤ 6h</th><th>SOS resp.</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function aimodels() {
    var models = data.aiModels || [];
    var cards = models.map(function (m) {
      return '<div class="ai-mcard"><div class="amc-top"><div class="amc-ic">' + I('sparkle') + '</div>' +
        '<div><div class="amc-name">' + esc(m.name) + '</div><div class="amc-eng">' + esc(m.key) + '</div></div>' +
        '<span style="margin-inline-start:auto">' + (m.human_approval_required ? UI.badge('Approval req.', 'gold') : UI.badge('Auto', 'green')) + '</span></div>' +
        '<div class="amc-desc">' + (m.diagnoses ? 'May suggest diagnoses.' : 'Does not diagnose — information & drafting only (NFR-2).') + '</div>' +
        '<div class="amc-foot"><span class="muted">' + (m.human_approval_required ? 'Human approval required' : 'No approval gate') + '</span></div></div>';
    }).join('') || '<div class="card card-pad">' + UI.empty('No AI models configured', 'sparkle') + '</div>';
    return UI.pageHead({ eyebrow: 'Administration · AI', title: 'AI models', sub: 'The assistants powering the platform (S6 / S9, risk & sentiment)' }) +
      UI.lockNote('AI safety rules are enforced: the advisor does not diagnose and hands red flags to a clinician; report drafts are stored only after a doctor approves them (NFR-2).') +
      '<div class="grid cols-2 mt-2">' + cards + '</div>';
  }

  function users() {
    var rows = (data.users || []).map(function (u) {
      var tone = u.is_active ? 'green' : 'slate';
      return '<tr><td><div class="flex"><div class="avatar" style="width:34px;height:34px;font-size:12px">' + esc(S.initials(u.name)) + '</div>' +
        '<div><div class="t-name">' + esc(u.name) + '</div><div class="t-sub">' + esc(u.email || u.username) + '</div></div></div></td>' +
        '<td>' + UI.badge(S.titleCase(u.role), 'teal') + '</td>' +
        '<td class="t-mono">' + esc(u.staff_id || u.patient_serial || '—') + '</td>' +
        '<td>' + UI.badge(u.is_active ? 'Active' : 'Disabled', tone) + '</td>' +
        '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="adminSetRole(' + u.id + ',\'' + u.role + '\',' + u.is_active + ')">' + I('edit') + 'Role</button>' +
          '<button class="btn btn-soft btn-sm" onclick="adminToggleUser(' + u.id + ',' + u.is_active + ',\'' + u.role + '\')">' + (u.is_active ? 'Disable' : 'Enable') + '</button></div></td></tr>';
    }).join('') || '<tr><td colspan="5">' + UI.empty('No users') + '</td></tr>';
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Users & roles', sub: 'Create accounts and set permissions (FR-15.1)',
      actions: '<button class="btn btn-primary" onclick="adminNewUser()">' + I('plus') + 'Create account</button>' }) +
      UI.lockNote('Roles enforce who can view and who can edit (FR-1.7). The medical file stays with the treating doctor and nursing supervisor; reception is admin-only (FR-1.8).') +
      '<div class="card mt-2"><div class="card-head"><h3>Accounts</h3><span class="ch-act muted">' + (data.users || []).length + '</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Name</th><th>Role</th><th>Staff / Serial</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function permissions() {
    var p = data.perms || {};
    var rows = Object.keys(p).map(function (role) {
      return '<tr><td class="t-name">' + esc(S.titleCase(role)) + '</td><td>' + (p[role] || []).map(function (perm) { return UI.badge(perm, perm === '*' ? 'rose' : 'slate'); }).join(' ') + '</td></tr>';
    }).join('') || '<tr><td colspan="2">' + UI.empty('No permission data') + '</td></tr>';
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Permissions matrix', sub: 'Capabilities granted to each role (FR-1.7 / FR-1.8)' }) +
      UI.lockNote('The medical file is for the treating doctor and nursing supervisor only; reception is administrative-only; each department sees only its own part (BR-3 / BR-4).') +
      '<div class="card mt-2"><div class="card-head"><h3>Role capabilities</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Role</th><th>Capabilities</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function audit() {
    var log = data.audit || [];
    var rows = log.map(function (e) {
      return '<tr><td class="t-mono">' + esc(S.fmtDateTime(e.created_at || e.at)) + '</td>' +
        '<td>' + esc(e.actor_id || e.user || e.actor || '—') + '</td>' +
        '<td>' + UI.badge(S.titleCase(e.action || 'event'), 'teal') + '</td>' +
        '<td>' + esc(e.description || e.what || e.target_type || '') + '</td>' +
        '<td class="t-mono">' + esc(e.target_id || e.target || '—') + '</td></tr>';
    }).join('');
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Audit trail', sub: 'Every view and edit of clinical data is logged with who and when (NFR-11)' }) +
      UI.lockNote('Staff may correct their own entries for 15 minutes; after that, only the system administrator can change a record. Every access is traceable (NFR-11).') +
      '<div class="card mt-2"><div class="card-head"><h3>Recent activity</h3></div>' +
      (log.length ? '<div class="table-wrap"><table class="t"><thead><tr><th>Time</th><th>Actor</th><th>Action</th><th>Detail</th><th>Target</th></tr></thead><tbody>' + rows + '</tbody></table></div>'
        : '<div class="card-pad">' + UI.empty('No audit entries recorded yet', 'clipboard') + '</div>') + '</div>';
  }

  function integration() {
    var rows = (data.integrations || []).map(function (g) {
      var tone = g.status === 'connected' ? 'green' : g.status === 'partial' ? 'gold' : 'slate';
      return '<tr><td><div class="t-name">' + esc(g.name) + '</div><div class="t-sub t-mono">' + esc(g.key) + '</div></td>' +
        '<td>' + UI.badge(S.titleCase(g.status), tone) + '</td></tr>';
    }).join('') || '<tr><td colspan="2">' + UI.empty('No integrations') + '</td></tr>';
    return UI.pageHead({ eyebrow: 'IT Administration', title: 'Integration', sub: 'Links to DMS, lab, radiology and pharmacy (FR-15.4 / FR-15.5)' }) +
      UI.lockNote('Live integration APIs are bought from the DMS vendor. Until then the platform runs over the hospital LAN behind an IP whitelist (FR-15.6).') +
      '<div class="card mt-2"><div class="card-head"><h3>External systems</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>System</th><th>Status</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---- director-only screens ---- */
  function dirQuality() {
    var d = data.quality || {};
    var sent = d.sentiment || { positive: 0, neutral: 0, negative: 0 };
    return UI.pageHead({ eyebrow: 'Director', title: 'Quality overview', sub: 'Cross-hospital patient experience (FR-13.5)' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Satisfaction', value: d.avg_satisfaction != null ? d.avg_satisfaction.toFixed(1) : '—', unit: '/ 5', icon: 'heart', accent: 'teal' }) +
        UI.tile({ label: 'Ratings', value: d.ratings_count || 0, icon: 'chart' }) +
        UI.tile({ label: 'Open complaints', value: d.complaints ? d.complaints.open : 0, icon: 'clipboard' }) +
        UI.tile({ label: 'Answered ≤ 6h', value: (d.complaints ? d.complaints.answered_within_6h_pct : 0) + '%', icon: 'clock' }) +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>Sentiment</h3></div><div class="card-pad">' +
        UI.donut([{ label: 'Positive', value: sent.positive, color: '#3fa66a' }, { label: 'Neutral', value: sent.neutral, color: '#7c93a6' }, { label: 'Negative', value: sent.negative, color: '#d96666' }], { centerValue: d.ratings_count || 0, centerLabel: 'ratings' }) + '</div></div>';
  }
  function dirEmergency() {
    var m = data.emMetrics || {};
    var bt = m.by_type || {};
    return UI.pageHead({ eyebrow: 'Director', title: 'Emergency metrics', sub: 'Response performance across the hospital' }) +
      '<div class="grid cols-4 mb-2">' +
        UI.tile({ label: 'Total events', value: m.total_events || 0, icon: 'alert' }) +
        UI.tile({ label: 'Active now', value: m.active || 0, icon: 'activity', accent: m.active ? 'rose' : '' }) +
        UI.tile({ label: 'Real emergencies', value: m.real_emergencies || 0, icon: 'heart' }) +
        UI.tile({ label: 'Avg response', value: m.avg_response_seconds != null ? m.avg_response_seconds : '—', unit: 's', icon: 'clock' }) +
      '</div>' +
      '<div class="card"><div class="card-head"><h3>By type</h3></div><div class="card-pad">' +
        UI.barChart([{ label: 'SOS', value: bt.sos || 0, display: '' + (bt.sos || 0) }, { label: 'Code Blue', value: bt.code_blue || 0, display: '' + (bt.code_blue || 0) }]) + '</div></div>';
  }

  /* ===================== CONTENT MANAGEMENT ===================== */
  window.adminContentTab = function (tab) { data.content.tab = tab; window.render(); };

  function content() {
    var c = data.content;
    var tabs = [['education', 'Education media', 'file'], ['departments', 'Departments', 'desk'], ['drugs', 'Medications', 'pill']]
      .map(function (t) {
        return '<button class="btn ' + (c.tab === t[0] ? 'btn-primary' : 'btn-ghost') + ' btn-sm" onclick="adminContentTab(\'' + t[0] + '\')">' + I(t[2]) + esc(window.t(t[1])) + '</button>';
      }).join('');

    var body, addBtn;
    if (c.tab === 'education') {
      addBtn = '<button class="btn btn-primary" onclick="adminEduModal()">' + I('plus') + esc(window.t('Add')) + '</button>';
      var rows = c.education.map(function (e) {
        var isMedia = /\.(mp4|webm|mov|m4v|jpg|jpeg|png|gif|webp|mp3|wav)$/i.test(e.file_or_link || '') || /^https?:/.test(e.file_or_link || '');
        return '<tr><td><div class="t-name">' + esc(e.title) + '</div><div class="t-sub">' + esc(e.approved_by || '') + '</div></td>' +
          '<td>' + UI.badge(S.titleCase(e.content_type), 'teal') + '</td>' +
          '<td>' + esc(window.stageLabel(e.journey_stage) || '—') + '</td>' +
          '<td class="t-sub">' + (e.file_or_link ? (isMedia ? '<a href="' + esc(e.file_or_link) + '" target="_blank" style="color:var(--teal-d)">' + I('scan') + 'open</a>' : esc(e.file_or_link)) : '—') + '</td>' +
          '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="adminEduModal(' + e.id + ')">' + I('edit') + '</button>' +
            '<button class="btn btn-soft btn-sm" onclick="adminEduDelete(' + e.id + ')">' + I('x') + '</button></div></td></tr>';
      }).join('') || '<tr><td colspan="5">' + UI.empty('No content yet') + '</td></tr>';
      body = '<div class="table-wrap"><table class="t"><thead><tr><th>Title</th><th>Type</th><th>Stage</th><th>File / link</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div>';
    } else if (c.tab === 'departments') {
      addBtn = '<button class="btn btn-primary" onclick="adminDeptModal()">' + I('plus') + esc(window.t('Add')) + '</button>';
      var drows = c.departments.map(function (d) {
        return '<tr><td class="t-mono">' + esc(d.dept_code) + '</td><td><div class="t-name">' + esc(d.department_name) + '</div><div class="t-sub">' + esc(d.head_of_department || '') + '</div></td>' +
          '<td>' + (d.accepts_bookings ? UI.badge('Bookable', 'green') : UI.badge('Internal', 'slate')) + '</td>' +
          '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="adminDeptModal(\'' + esc(d.dept_code) + '\')">' + I('edit') + '</button>' +
            '<button class="btn btn-soft btn-sm" onclick="adminDeptDelete(\'' + esc(d.dept_code) + '\')">' + I('x') + '</button></div></td></tr>';
      }).join('') || '<tr><td colspan="4">' + UI.empty('No departments') + '</td></tr>';
      body = '<div class="table-wrap"><table class="t"><thead><tr><th>Code</th><th>Department</th><th>Bookings</th><th></th></tr></thead><tbody>' + drows + '</tbody></table></div>';
    } else {
      addBtn = '<button class="btn btn-primary" onclick="adminDrugModal()">' + I('plus') + esc(window.t('Add')) + '</button>';
      var grows = c.drugs.map(function (d) {
        return '<tr><td><div class="t-name">' + esc(d.drug_name) + '</div><div class="t-sub">' + esc(d.code || '') + '</div></td>' +
          '<td>' + esc((d.strength || '') + ' · ' + (d.form || '')) + '</td>' +
          '<td>' + (d.currently_available ? UI.badge('In stock (' + (d.approx_stock_qty != null ? d.approx_stock_qty : '?') + ')', 'green') : UI.badge('Out', 'rose')) + '</td>' +
          '<td>' + (d.part_of_cardiac_protocol ? UI.badge('Cardiac', 'teal') : '<span class="muted">—</span>') + '</td>' +
          '<td><div class="wrap-gap"><button class="btn btn-ghost btn-sm" onclick="adminDrugModal(' + d.id + ')">' + I('edit') + '</button>' +
            '<button class="btn btn-soft btn-sm" onclick="adminDrugDelete(' + d.id + ')">' + I('x') + '</button></div></td></tr>';
      }).join('') || '<tr><td colspan="5">' + UI.empty('No medications') + '</td></tr>';
      body = '<div class="table-wrap"><table class="t"><thead><tr><th>Drug</th><th>Strength / form</th><th>Stock</th><th>Protocol</th><th></th></tr></thead><tbody>' + grows + '</tbody></table></div>';
    }

    return UI.pageHead({ eyebrow: 'Administration', title: 'Content management', sub: 'Edit departments, education media (images & videos) and the medication catalogue', actions: addBtn }) +
      UI.lockNote('Admin-only. Changes here update the live site content (the public portal, patient app, and dashboards) immediately.') +
      '<div class="wrap-gap mt-2 mb-2">' + tabs + '</div>' +
      '<div class="card">' + body + '</div>';
  }

  /* media upload helper: reads #<fileId>, uploads, writes URL into #<linkId> */
  window.adminUploadMedia = function (fileId, linkId) {
    var el = document.getElementById(fileId);
    if (!el || !el.files || !el.files[0]) { UI.toast('Choose a file first', 'warn'); return; }
    var fd = new FormData(); fd.append('file', el.files[0]);
    UI.toast('Uploading…', 'ok');
    API.admin.uploadMedia(fd).then(function (r) {
      var link = document.getElementById(linkId); if (link) link.value = r.url;
      UI.toast('Uploaded · URL filled in', 'ok');
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.adminEduModal = function (id) {
    var e = id ? data.content.education.find(function (x) { return x.id === id; }) : {};
    e = e || {};
    var ct = ['video', 'article', 'audio', 'image', 'game'].map(function (t) { return '<option value="' + t + '"' + (e.content_type === t ? ' selected' : '') + '>' + S.titleCase(t) + '</option>'; }).join('');
    UI.modal({
      title: id ? 'Edit content' : 'Add education content', icon: 'file', wide: true,
      body: '<div class="field"><label>Title</label><input id="ed-title" value="' + esc(e.title || '') + '" /></div>' +
        '<div class="field-row"><div class="field"><label>Type</label><select id="ed-type">' + ct + '</select></div>' +
        '<div class="field"><label>Journey stage</label><input id="ed-stage" value="' + esc(e.journey_stage || '') + '" placeholder="e.g. discharge / any" /></div></div>' +
        '<div class="field-row"><div class="field"><label>Duration (min)</label><input id="ed-dur" inputmode="numeric" value="' + esc(e.duration_min != null ? e.duration_min : '') + '" /></div>' +
        '<div class="field"><label>Approved by</label><input id="ed-appr" value="' + esc(e.approved_by || '') + '" /></div></div>' +
        '<div class="field"><label>File or link (image / video URL)</label><input id="ed-link" value="' + esc(e.file_or_link || '') + '" placeholder="https://… or upload below" /></div>' +
        '<div class="wrap-gap"><input type="file" id="ed-file" accept="image/*,video/*,audio/*" style="font-size:12px" />' +
          '<button class="btn btn-soft btn-sm" onclick="adminUploadMedia(\'ed-file\',\'ed-link\')">' + I('scan') + 'Upload image/video</button></div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="adminEduSave(' + (id || 'null') + ')">' + I('check') + 'Save</button>'
    });
  };
  window.adminEduSave = function (id) {
    var g = function (x) { return (document.getElementById(x) || {}).value || ''; };
    var p = { title: g('ed-title'), content_type: g('ed-type'), journey_stage: g('ed-stage') || null,
      duration_min: g('ed-dur') ? +g('ed-dur') : null, approved_by: g('ed-appr') || null, file_or_link: g('ed-link') || null };
    if (!p.title.trim()) { UI.toast('Title is required', 'warn'); return; }
    var req = id ? API.admin.updateEducation(id, p) : API.admin.createEducation(p);
    req.then(function () { UI.closeModal(); UI.toast('Saved', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.adminEduDelete = function (id) {
    API.admin.deleteEducation(id).then(function () { UI.toast('Deleted', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.adminDeptModal = function (code) {
    var d = code ? data.content.departments.find(function (x) { return x.dept_code === code; }) : {};
    d = d || {};
    UI.modal({
      title: code ? 'Edit department' : 'Add department', icon: 'desk',
      body: (code ? '' : '<div class="field"><label>Code</label><input id="dp-code" placeholder="e.g. NEUR" /></div>') +
        '<div class="field"><label>Department name</label><input id="dp-name" value="' + esc(d.department_name || '') + '" /></div>' +
        '<div class="field"><label>Head of department</label><input id="dp-head" value="' + esc(d.head_of_department || '') + '" /></div>' +
        '<div class="field"><label>Description</label><textarea id="dp-desc">' + esc(d.description || '') + '</textarea></div>' +
        '<label class="task"><input type="checkbox" id="dp-book"' + (d.accepts_bookings ? ' checked' : '') + '/> <span>Accepts bookings</span></label>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="adminDeptSave(' + (code ? '\'' + esc(code) + '\'' : 'null') + ')">' + I('check') + 'Save</button>'
    });
  };
  window.adminDeptSave = function (code) {
    var g = function (x) { return (document.getElementById(x) || {}).value || ''; };
    var p = { department_name: g('dp-name'), head_of_department: g('dp-head') || null, description: g('dp-desc') || null,
      accepts_bookings: !!(document.getElementById('dp-book') || {}).checked };
    var req;
    if (code) { req = API.admin.updateDepartment(code, p); }
    else { p.dept_code = g('dp-code'); if (!p.dept_code.trim() || !p.department_name.trim()) { UI.toast('Code and name are required', 'warn'); return; } req = API.admin.createDepartment(p); }
    req.then(function () { UI.closeModal(); UI.toast('Saved', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.adminDeptDelete = function (code) {
    API.admin.deleteDepartment(code).then(function () { UI.toast('Deleted', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  window.adminDrugModal = function (id) {
    var d = id ? data.content.drugs.find(function (x) { return x.id === id; }) : {};
    d = d || {};
    UI.modal({
      title: id ? 'Edit medication' : 'Add medication', icon: 'pill',
      body: '<div class="field"><label>Drug name</label><input id="dg-name" value="' + esc(d.drug_name || '') + '" /></div>' +
        '<div class="field-row"><div class="field"><label>Strength</label><input id="dg-str" value="' + esc(d.strength || '') + '" placeholder="e.g. 75 mg" /></div>' +
        '<div class="field"><label>Form</label><input id="dg-form" value="' + esc(d.form || '') + '" placeholder="tablet / vial…" /></div></div>' +
        '<div class="field-row"><div class="field"><label>ATC code</label><input id="dg-code" value="' + esc(d.code || '') + '" /></div>' +
        '<div class="field"><label>Stock qty</label><input id="dg-qty" inputmode="numeric" value="' + esc(d.approx_stock_qty != null ? d.approx_stock_qty : '') + '" /></div></div>' +
        '<label class="task"><input type="checkbox" id="dg-avail"' + (d.currently_available !== false ? ' checked' : '') + '/> <span>Currently available</span></label>' +
        '<label class="task"><input type="checkbox" id="dg-card"' + (d.part_of_cardiac_protocol ? ' checked' : '') + '/> <span>Part of cardiac protocol</span></label>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Cancel</button>' +
        '<button class="btn btn-primary" onclick="adminDrugSave(' + (id || 'null') + ')">' + I('check') + 'Save</button>'
    });
  };
  window.adminDrugSave = function (id) {
    var g = function (x) { return (document.getElementById(x) || {}).value || ''; };
    var p = { drug_name: g('dg-name'), strength: g('dg-str') || null, form: g('dg-form') || null, code: g('dg-code') || null,
      approx_stock_qty: g('dg-qty') ? +g('dg-qty') : null,
      currently_available: !!(document.getElementById('dg-avail') || {}).checked,
      part_of_cardiac_protocol: !!(document.getElementById('dg-card') || {}).checked };
    if (!p.drug_name.trim()) { UI.toast('Drug name is required', 'warn'); return; }
    var req = id ? API.admin.updateDrug(id, p) : API.admin.createDrug(p);
    req.then(function () { UI.closeModal(); UI.toast('Saved', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.adminDrugDelete = function (id) {
    API.admin.deleteDrug(id).then(function () { UI.toast('Deleted', 'ok'); return load('content').then(window.render); }).catch(function (e) { UI.toast(e.message, 'err'); });
  };

  /* ---- register admin ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.admin = {
    label: 'Administration', person: 'IT Admin & Director', icon: 'chart', accent: 'admin',
    desc: 'Read the KPIs and monthly reports, manage staff accounts and permissions, audit access, and oversee integration.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'KPIs', icon: 'chart' },
      { route: 'reports', label: 'Reports', icon: 'file' },
      { route: 'content', label: 'Content', icon: 'edit' },
      { route: 'aimodels', label: 'AI models', icon: 'sparkle' },
      { route: 'users', label: 'Users & roles', icon: 'users' },
      { route: 'permissions', label: 'Permissions', icon: 'shield' },
      { route: 'audit', label: 'Audit trail', icon: 'clipboard' },
      { route: 'integration', label: 'Integration', icon: 'route' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'reports': return reports();
        case 'content': return content();
        case 'aimodels': return aimodels();
        case 'users': return users();
        case 'permissions': return permissions();
        case 'audit': return audit();
        case 'integration': return integration();
        default: return overview();
      }
    }
  };

  /* ---- register director (reporting + oversight only; no /admin/*) ---- */
  window.ROLES.director = {
    label: 'Director', person: 'Hospital Director', icon: 'chart', accent: 'admin',
    desc: 'Read the management KPIs, monthly reports, quality overview, and emergency response metrics.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'KPIs', icon: 'chart' },
      { route: 'reports', label: 'Reports', icon: 'file' },
      { route: 'quality', label: 'Quality', icon: 'heart' },
      { route: 'emergency', label: 'Emergency', icon: 'alert' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'reports': return reports();
        case 'quality': return dirQuality();
        case 'emergency': return dirEmergency();
        default: return overview();
      }
    }
  };
})();
