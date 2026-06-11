/* ============================================================
   A.B.C.D.E — Staff Dashboards · quality.js
   The quality manager reads feedback and complaints and turns
   them into something the hospital acts on. Patients rate each
   finished stage 1–5 (FR-13.1); problems become numbered tickets
   to the unit supervisor (FR-13.2); negative feedback goes to the
   department head (FR-13.3); complaints hold a response window
   and escalate to the director when missed (FR-13.4); the quality
   view shows the average, the worst points, and open complaints
   (FR-13.5). AI summarises sentiment and themes (FR-9.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  function avgRating() {
    var f = window.DB.feedback;
    if (!f.length) return 0;
    return (f.reduce(function (a, x) { return a + x.rating; }, 0) / f.length);
  }
  function openComplaints() { return window.DB.complaints.filter(function (c) { return c.status === 'open' || c.status === 'due-soon'; }); }
  function breaches() { return window.DB.complaints.filter(function (c) { return c.status === 'escalated'; }); }

  function slaBadge(c) {
    if (c.status === 'responded') return UI.badge('Responded', 'green');
    if (c.status === 'escalated') return UI.badge('Escalated to director', 'rose');
    if (c.status === 'due-soon') return UI.badge(c.hoursLeft + 'h left', 'gold');
    return UI.badge(c.hoursLeft + 'h left', 'teal');
  }

  /* ---- actions ---- */
  window.qualityRespond = function (id) {
    var c = window.DB.complaints.find(function (x) { return x.id === id; });
    if (c) { c.status = 'responded'; c.hoursLeft = 0; UI.toast('Complaint ' + id + ' marked responded', 'ok'); window.render(); }
  };
  window.qualityEscalate = function (id) {
    var c = window.DB.complaints.find(function (x) { return x.id === id; });
    if (c) { c.status = 'escalated'; c.assignee = 'Director (escalated)'; UI.toast('Complaint ' + id + ' escalated to the director', 'warn'); window.render(); }
  };
  window.qualityReport = function () {
    var f = window.DB.feedback, neg = f.filter(function (x) { return x.sentiment === 'negative'; });
    var byDept = {};
    neg.forEach(function (x) { byDept[x.dept] = (byDept[x.dept] || 0) + 1; });
    var topTheme = Object.keys(byDept).sort(function (a, b) { return byDept[b] - byDept[a]; })[0] || 'none';
    UI.modal({
      title: 'AI monthly quality summary', icon: 'sparkle', wide: true,
      body:
        '<div class="lock-note mb-2">' + I('sparkle') + '<div>Generated from this month’s feedback and complaints (sentiment + theme grouping, FR-9.4). Review before circulating.</div></div>' +
        '<div style="font-size:13.5px;line-height:1.7">' +
        '<p><b>Overall.</b> Average stage rating is <b>' + avgRating().toFixed(1) + ' / 5</b> across ' + f.length + ' ratings. Sentiment is mostly positive, with a clear negative cluster around <b>' + esc(topTheme) + '</b>.</p>' +
        '<p><b>Leading theme.</b> The most common complaint is <b>waiting time in ' + esc(topTheme) + '</b> — for example, time before triage in the ER and a delay in post-procedure pain relief.</p>' +
        '<p><b>Open items.</b> ' + openComplaints().length + ' complaints are inside the response window; ' + breaches().length + ' breached it and were escalated to the director.</p>' +
        '<p><b>Recommendation.</b> Track door-to-triage time in Emergency and the call-bell response on the ward; both drive the negative ratings this month.</p>' +
        '</div>',
      foot:
        '<button class="btn btn-ghost" onclick="UI.closeModal()">Close</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();UI.toast(\'Report sent to the director and department heads\',\'ok\')">' + I('check') + 'Send to director</button>'
    });
  };

  /* ---- screens ---- */
  function overview() {
    var f = window.DB.feedback;
    var neg = f.filter(function (x) { return x.sentiment === 'negative'; });
    var byDept = {}; neg.forEach(function (x) { byDept[x.dept] = (byDept[x.dept] || 0) + 1; });
    var topTheme = Object.keys(byDept).sort(function (a, b) { return byDept[b] - byDept[a]; })[0] || '—';

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Average rating', value: avgRating().toFixed(1), unit: '/ 5', icon: 'heart', accent: 'teal', foot: f.length + ' ratings this period' }) +
      UI.tile({ label: 'Open complaints', value: openComplaints().length, icon: 'clipboard', foot: 'Within response window' }) +
      UI.tile({ label: 'SLA breaches', value: breaches().length, icon: 'alert', foot: 'Escalated to director' }) +
      UI.tile({ label: 'Leading theme', value: '<span style="font-size:18px">' + esc(topTheme) + '</span>', icon: 'sparkle', foot: 'From AI sentiment' }) +
    '</div>';

    var recent = f.slice().reverse().slice(0, 5).map(function (x) {
      return '<tr><td><div class="t-name">' + esc(x.patient) + '</div><div class="t-sub">' + esc(window.stageLabel(x.stage)) + ' · ' + esc(x.dept) + '</div></td>' +
        '<td>' + UI.stars(x.rating) + '</td>' +
        '<td class="muted" style="max-width:260px">' + esc(x.note || '') + '</td>' +
        '<td>' + UI.sentimentBadge(x.sentiment) + '</td></tr>';
    }).join('');

    var attention = openComplaints().concat(breaches()).map(function (c) {
      var crit = c.status === 'escalated' || c.status === 'due-soon';
      return '<div class="alert-row ' + (crit ? (c.status === 'escalated' ? 'crit' : 'warn') : '') + '">' +
        '<div class="ar-ic">' + I('clipboard') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(c.id) + ' · ' + esc(c.dept) + '</div><div class="ar-s">' + esc(c.text) + '</div></div>' +
        slaBadge(c) + '</div>';
    }).join('') || UI.empty('No complaints need attention', 'check');

    // charts: sentiment donut + rating distribution + satisfaction-by-stage (worst points)
    var sentCount = { positive: 0, neutral: 0, negative: 0 };
    f.forEach(function (x) { sentCount[x.sentiment] = (sentCount[x.sentiment] || 0) + 1; });
    var dist = [5, 4, 3, 2, 1].map(function (r) { return { label: r + '★', value: f.filter(function (x) { return x.rating === r; }).length, display: String(f.filter(function (x) { return x.rating === r; }).length) }; });
    var stageAvg = {};
    f.forEach(function (x) { (stageAvg[x.stage] = stageAvg[x.stage] || []).push(x.rating); });
    var stageBars = Object.keys(stageAvg).map(function (k) {
      var arr = stageAvg[k], avg = arr.reduce(function (a, b) { return a + b; }, 0) / arr.length;
      return { label: window.stageLabel(k), value: Math.round(avg * 20), display: avg.toFixed(1) + '★', avg: avg };
    }).sort(function (a, b) { return a.avg - b.avg; });

    var charts = '<div class="grid cols-2 mb-2">' +
      '<div class="card"><div class="card-head">' + I('heart') + '<h3>Sentiment mix</h3></div><div class="card-pad">' +
        UI.donut([{ label: 'Positive', value: sentCount.positive, color: '#3fa66a' }, { label: 'Neutral', value: sentCount.neutral, color: '#7c93a6' }, { label: 'Negative', value: sentCount.negative, color: '#d96666' }], { centerValue: f.length, centerLabel: 'ratings' }) +
        '</div></div>' +
      '<div class="card"><div class="card-head"><h3>Rating distribution</h3></div><div class="card-pad">' + UI.barChart(dist) + '</div></div>' +
    '</div>' +
    '<div class="card mb-2"><div class="card-head">' + I('chart') + '<h3>Satisfaction by stage — the worst points (FR-13.5)</h3>' +
      '<span class="ch-act badge rose">Lowest: ' + esc(stageBars[0] ? stageBars[0].label : '—') + '</span></div>' +
      '<div class="card-pad">' + UI.barChart(stageBars) + '</div></div>';

    return UI.pageHead({
      eyebrow: 'Quality · ' + esc(window.STAFF.quality.name), title: 'Quality overview',
      sub: 'Patient experience, feedback and complaints (FR-13.5)',
      actions: '<button class="btn btn-primary" onclick="qualityReport()">' + I('sparkle') + 'AI monthly summary</button>'
    }) + tiles + charts +
      '<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head"><h3>Recent feedback</h3></div><div class="table-wrap"><table class="t"><tbody>' + recent + '</tbody></table></div></div>' +
        '<div class="card"><div class="card-head">' + I('alert') + '<h3>Complaints to action</h3></div><div class="card-pad">' + attention + '</div></div>' +
      '</div>';
  }

  function feedback() {
    var byStage = {};
    window.DB.feedback.forEach(function (x) { (byStage[x.stage] = byStage[x.stage] || []).push(x); });
    var rows = window.DB.feedback.slice().reverse().map(function (x) {
      return '<tr><td><div class="t-name">' + esc(x.patient) + '</div><div class="t-sub t-mono">' + esc(x.serial) + '</div></td>' +
        '<td>' + esc(window.stageLabel(x.stage)) + '</td>' +
        '<td>' + esc(x.dept) + '</td>' +
        '<td>' + UI.stars(x.rating) + '</td>' +
        '<td class="muted" style="max-width:280px">' + esc(x.note || '') + '</td>' +
        '<td>' + UI.sentimentBadge(x.sentiment) + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Quality', title: 'Stage feedback', sub: 'Every finished stage can be rated 1–5 with a note (FR-13.1)' }) +
      '<div class="card"><div class="card-head"><h3>All ratings</h3><span class="ch-act badge teal">Avg ' + avgRating().toFixed(1) + ' / 5</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Patient</th><th>Stage</th><th>Department</th><th>Rating</th><th>Note</th><th>Sentiment</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function complaints() {
    var rows = window.DB.complaints.map(function (c) {
      var actionable = c.status !== 'responded';
      return '<tr><td class="t-mono">' + esc(c.id) + '</td>' +
        '<td><div class="t-name">' + esc(c.patient) + '</div><div class="t-sub">' + esc(c.dept) + ' · ' + esc(window.stageLabel(c.stage)) + '</div></td>' +
        '<td style="max-width:300px">' + esc(c.text) + '</td>' +
        '<td>' + esc(c.assignee) + '</td>' +
        '<td>' + slaBadge(c) + '</td>' +
        '<td>' + (actionable ?
          '<div class="wrap-gap">' +
            '<button class="btn btn-primary btn-sm" onclick="qualityRespond(\'' + c.id + '\')">' + I('check') + 'Respond</button>' +
            (c.status !== 'escalated' ? '<button class="btn btn-rose btn-sm" onclick="qualityEscalate(\'' + c.id + '\')">Escalate</button>' : '') +
          '</div>' : '<span class="muted">closed</span>') + '</td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Quality', title: 'Complaints', sub: 'Numbered tickets with a response window that escalates to the director when missed (FR-13.2 / FR-13.4)' }) +
      UI.lockNote('Each complaint has a response window (here 48h, per the SRS example). Miss it and it escalates automatically to the hospital director. Negative feedback is routed to the relevant department head (FR-13.3).') +
      '<div class="card mt-2"><div class="card-head"><h3>Open & recent tickets</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Ticket</th><th>Patient</th><th>Complaint</th><th>Assigned to</th><th>SLA</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function reports() {
    var dc = window.DB.kpis.deptComparison.map(function (d) { return { label: d.dept, value: d.satisfaction, display: d.satisfaction.toFixed(1) }; });
    var sentiments = ['positive', 'neutral', 'negative'].map(function (s) {
      var n = window.DB.feedback.filter(function (x) { return x.sentiment === s; }).length;
      return { label: s.charAt(0).toUpperCase() + s.slice(1), value: n, display: String(n) };
    });

    return UI.pageHead({
      eyebrow: 'Quality', title: 'Reports & insights', sub: 'AI sentiment and department comparison (FR-9.4 / FR-13.5)',
      actions: '<button class="btn btn-primary" onclick="qualityReport()">' + I('sparkle') + 'Generate monthly summary</button>'
    }) +
      '<div class="grid cols-2">' +
        '<div class="card"><div class="card-head"><h3>Satisfaction by department</h3></div><div class="card-pad">' + UI.barChart(dc) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Sentiment mix</h3></div><div class="card-pad">' + UI.barChart(sentiments) +
          '<div class="divider"></div><p class="muted" style="font-size:12.5px">AI groups complaints into themes and writes the monthly summary — the leading theme this period is waiting time in Emergency.</p></div></div>' +
      '</div>';
  }

  var HEADS = { 'Emergency': 'Dr. Adel Sami', 'Cardiology': 'Dr. Karim Adel', 'Cardiology Ward': 'Dr. Karim Adel', 'CCU': 'Dr. Nour Hany', 'Pharmacy': 'Ph. Rania Adel', 'Cardiology (Outpatient)': 'Dr. Karim Adel', 'Reception': 'Nadia Hassan' };
  function departments() {
    var depts = {};
    var ensure = function (d) { depts[d] = depts[d] || { ratings: [], neg: 0, complaints: [] }; return depts[d]; };
    window.DB.feedback.forEach(function (x) { var o = ensure(x.dept); o.ratings.push(x.rating); if (x.sentiment === 'negative') o.neg++; });
    window.DB.complaints.forEach(function (c) { ensure(c.dept).complaints.push(c); });

    var rows = Object.keys(depts).map(function (d) {
      var o = depts[d];
      var avg = o.ratings.length ? (o.ratings.reduce(function (a, b) { return a + b; }, 0) / o.ratings.length) : 0;
      var openN = o.complaints.filter(function (c) { return c.status !== 'responded'; }).length;
      return '<tr><td><div class="t-name">' + esc(d) + '</div><div class="t-sub">Head: ' + esc(HEADS[d] || '—') + '</div></td>' +
        '<td>' + (o.ratings.length ? UI.stars(Math.round(avg)) + ' <span class="muted">' + avg.toFixed(1) + '</span>' : '<span class="muted">—</span>') + '</td>' +
        '<td>' + (o.neg ? UI.badge(o.neg + ' negative', 'rose') : '<span class="muted">0</span>') + '</td>' +
        '<td>' + (openN ? UI.badge(openN + ' open', 'gold') : UI.badge('0', 'green')) + '</td>' +
        '<td><button class="btn btn-ghost btn-sm" onclick="UI.toast(\'Routed to ' + esc(HEADS[d] || 'the head') + '\',\'ok\')">' + I('arrowRight') + 'Route to head</button></td></tr>';
    }).join('');

    return UI.pageHead({ eyebrow: 'Quality', title: 'Departments', sub: 'Negative feedback and complaints routed to each department head (FR-13.3)' }) +
      UI.lockNote('Each department head receives the negative feedback and complaints for their department. The hospital director sees the cross-department summary.') +
      '<div class="card mt-2"><div class="card-head"><h3>By department</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Department</th><th>Satisfaction</th><th>Negative</th><th>Open complaints</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.quality = {
    label: 'Quality', person: 'Mervat Gaber · Quality Manager', icon: 'shield', accent: 'teal',
    desc: 'Read feedback and complaints, watch the response window, and turn patient experience into reports the hospital acts on.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'Quality overview', icon: 'chart' },
      { route: 'feedback', label: 'Stage feedback', icon: 'heart' },
      { route: 'complaints', label: 'Complaints', icon: 'clipboard', badge: function () { return openComplaints().length + breaches().length; } },
      { route: 'departments', label: 'Departments', icon: 'desk' },
      { route: 'reports', label: 'Reports', icon: 'sparkle' }
    ],
    render: function (route) {
      switch (route) {
        case 'feedback': return feedback();
        case 'complaints': return complaints();
        case 'departments': return departments();
        case 'reports': return reports();
        default: return overview();
      }
    }
  };
})();
