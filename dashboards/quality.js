/* ============================================================
   A.B.C.D.E — Staff Dashboards · quality.js  (LIVE API)
   The quality manager reads feedback (FR-13.1) and numbered
   complaints with a response window that escalates to the
   director when missed (FR-13.2/13.4), and the quality view
   shows the average, the worst stages, and open complaints
   (FR-13.5). Sentiment is summarised by the AI model (FR-9.4).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc, S = window.STORE;

  var data = { dash: null, complaints: [], feedback: [] };

  function sentimentOf(stars) { return stars >= 4 ? 'positive' : stars === 3 ? 'neutral' : 'negative'; }
  function openComplaints() { return data.complaints.filter(function (c) { return c.status === 'open' || c.status === 'escalated'; }); }

  function load(route) {
    var jobs = [API.quality.dashboard().then(function (d) { data.dash = d; })];
    if (route === 'complaints' || route === 'overview') jobs.push(API.quality.complaints().then(function (c) { data.complaints = c || []; }));
    if (route === 'feedback' || route === 'overview' || route === 'reports') jobs.push(API.quality.feedback().then(function (f) { data.feedback = f || []; }));
    return Promise.all(jobs);
  }

  /* ---- actions ---- */
  window.qualityUpdate = function (no, status) {
    var payload = { status: status };
    var c = data.complaints.find(function (x) { return x.complaint_no === no; });
    if (c && c.routed_to_dept) payload.routed_to_dept = c.routed_to_dept;
    API.quality.updateComplaint(no, payload).then(function () {
      UI.toast('Complaint ' + no + ' · ' + S.titleCase(status), status === 'escalated' ? 'warn' : 'ok');
      return load('complaints').then(window.render);
    }).catch(function (e) { UI.toast(e.message, 'err'); });
  };
  window.qualityReport = function () {
    var d = data.dash || {};
    var stages = d.ratings_by_stage || {};
    var worst = Object.keys(stages).sort(function (a, b) { return (stages[a].avg) - (stages[b].avg); })[0];
    UI.modal({
      title: 'AI monthly quality summary', icon: 'sparkle', wide: true,
      body: '<div class="lock-note mb-2">' + I('sparkle') + '<div>Generated from this period’s feedback and complaints (sentiment + theme grouping, FR-9.4). Review before circulating.</div></div>' +
        '<div style="font-size:13.5px;line-height:1.7">' +
        '<p><b>Overall.</b> Average stage rating is <b>' + (d.avg_satisfaction != null ? d.avg_satisfaction.toFixed(1) : '—') + ' / 5</b> across ' + (d.ratings_count || 0) + ' ratings. Sentiment is mostly positive (' + (d.sentiment ? d.sentiment.positive : 0) + ' positive vs ' + (d.sentiment ? d.sentiment.negative : 0) + ' negative).</p>' +
        '<p><b>Weakest stage.</b> The lowest-rated stage is <b>' + (worst ? window.stageLabel(worst) : 'n/a') + '</b>.</p>' +
        '<p><b>Complaints.</b> ' + (d.complaints ? d.complaints.total : 0) + ' total; ' + (d.complaints ? d.complaints.open : 0) + ' open. ' + (d.complaints ? d.complaints.answered_within_6h_pct : 0) + '% were answered within the 6-hour SLA.</p>' +
        '<p><b>Recommendation.</b> Focus on the weakest stage and on closing open complaints inside the response window.</p>' +
        '</div>',
      foot: '<button class="btn btn-ghost" onclick="UI.closeModal()">Close</button>' +
        '<button class="btn btn-primary" onclick="UI.closeModal();UI.toast(\'Report sent to the director and department heads\',\'ok\')">' + I('check') + 'Send to director</button>'
    });
  };

  /* ---- screens ---- */
  function overview() {
    var d = data.dash || {};
    var sent = d.sentiment || { positive: 0, neutral: 0, negative: 0 };
    var stages = d.ratings_by_stage || {};
    var stageBars = Object.keys(stages).map(function (k) {
      return { label: window.stageLabel(k), value: Math.round((stages[k].avg || 0) * 20), display: (stages[k].avg || 0).toFixed(1) + '★', avg: stages[k].avg };
    }).sort(function (a, b) { return a.avg - b.avg; });

    var tiles = '<div class="grid cols-4 mb-2">' +
      UI.tile({ label: 'Average rating', value: d.avg_satisfaction != null ? d.avg_satisfaction.toFixed(1) : '—', unit: '/ 5', icon: 'heart', accent: 'teal', foot: (d.ratings_count || 0) + ' ratings' }) +
      UI.tile({ label: 'Open complaints', value: d.complaints ? d.complaints.open : 0, icon: 'clipboard', foot: 'Within response window' }) +
      UI.tile({ label: 'Answered ≤ 6h', value: (d.complaints ? d.complaints.answered_within_6h_pct : 0) + '%', icon: 'clock', foot: '6-hour SLA' }) +
      UI.tile({ label: 'Negative feedback', value: sent.negative, icon: 'alert', foot: 'This period' }) +
    '</div>';

    var attention = openComplaints().map(function (c) {
      var crit = c.status === 'escalated';
      return '<div class="alert-row ' + (crit ? 'crit' : 'warn') + '">' +
        '<div class="ar-ic">' + I('clipboard') + '</div>' +
        '<div class="ar-body"><div class="ar-t">' + esc(c.complaint_no) + ' · ' + esc(c.routed_to_dept || '') + '</div><div class="ar-s">' + esc(c.complaint_text) + '</div></div>' +
        UI.statusBadge(c.status) + '</div>';
    }).join('') || UI.empty('No complaints need attention', 'check');

    var recent = data.feedback.slice(0, 6).map(function (x) {
      return '<tr><td><div class="t-name t-mono">' + esc(x.ticket_no) + '</div><div class="t-sub">' + esc(window.stageLabel(x.stage)) + ' · ' + esc(x.rated_by) + '</div></td>' +
        '<td>' + UI.stars(x.stars) + '</td>' +
        '<td class="muted" style="max-width:260px">' + esc(x.comment || '') + '</td>' +
        '<td>' + UI.sentimentBadge(sentimentOf(x.stars)) + '</td></tr>';
    }).join('') || '<tr><td colspan="4">' + UI.empty('No feedback') + '</td></tr>';

    var charts = '<div class="grid cols-2 mb-2">' +
      '<div class="card"><div class="card-head">' + I('heart') + '<h3>Sentiment mix</h3></div><div class="card-pad">' +
        UI.donut([{ label: 'Positive', value: sent.positive, color: '#3fa66a' }, { label: 'Neutral', value: sent.neutral, color: '#7c93a6' }, { label: 'Negative', value: sent.negative, color: '#d96666' }], { centerValue: d.ratings_count || 0, centerLabel: 'ratings' }) +
        '</div></div>' +
      '<div class="card"><div class="card-head">' + I('chart') + '<h3>Satisfaction by stage (FR-13.5)</h3>' +
        (stageBars.length ? '<span class="ch-act badge rose">Lowest: ' + esc(stageBars[0].label) + '</span>' : '') + '</div>' +
        '<div class="card-pad">' + (stageBars.length ? UI.barChart(stageBars) : UI.empty('No ratings yet')) + '</div></div>' +
    '</div>';

    return UI.pageHead({
      eyebrow: 'Quality · ' + esc(S.me() ? S.me().name : 'Quality'), title: 'Quality overview',
      sub: 'Patient experience, feedback and complaints (FR-13.5)',
      actions: '<button class="btn btn-primary" onclick="qualityReport()">' + I('sparkle') + 'AI monthly summary</button>'
    }) + tiles + charts +
      '<div class="grid" style="grid-template-columns:1.4fr 1fr;gap:18px">' +
        '<div class="card"><div class="card-head"><h3>Recent feedback</h3></div><div class="table-wrap"><table class="t"><tbody>' + recent + '</tbody></table></div></div>' +
        '<div class="card"><div class="card-head">' + I('alert') + '<h3>Complaints to action</h3></div><div class="card-pad">' + attention + '</div></div>' +
      '</div>';
  }

  function feedback() {
    var rows = data.feedback.map(function (x) {
      return '<tr><td class="t-mono">' + esc(x.ticket_no) + '</td>' +
        '<td>' + esc(window.stageLabel(x.stage)) + '</td>' +
        '<td>' + esc(S.titleCase(x.rated_by)) + '</td>' +
        '<td>' + UI.stars(x.stars) + '</td>' +
        '<td class="muted" style="max-width:300px">' + esc(x.comment || '') + '</td>' +
        '<td>' + UI.sentimentBadge(sentimentOf(x.stars)) + '</td>' +
        '<td class="muted">' + esc(S.fmtDateTime(x.rated_at)) + '</td></tr>';
    }).join('') || '<tr><td colspan="7">' + UI.empty('No feedback yet', 'heart') + '</td></tr>';
    var avg = data.dash && data.dash.avg_satisfaction != null ? data.dash.avg_satisfaction.toFixed(1) : '—';

    return UI.pageHead({ eyebrow: 'Quality', title: 'Stage feedback', sub: 'Every finished stage can be rated 1–5 with a note (FR-13.1)' }) +
      '<div class="card"><div class="card-head"><h3>All ratings</h3><span class="ch-act badge teal">Avg ' + avg + ' / 5</span></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Ticket</th><th>Stage</th><th>By</th><th>Rating</th><th>Note</th><th>Sentiment</th><th>When</th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function complaints() {
    var rows = data.complaints.map(function (c) {
      var open = c.status === 'open' || c.status === 'escalated';
      var sla = c.answered_within_sla === true ? UI.badge('Within SLA', 'green') : c.answered_within_sla === false ? UI.badge('SLA missed', 'rose') : UI.badge('Pending', 'gold');
      return '<tr><td class="t-mono">' + esc(c.complaint_no) + '</td>' +
        '<td class="t-mono">' + esc(c.ticket_no) + '<div class="t-sub">' + esc(window.stageLabel(c.stage)) + '</div></td>' +
        '<td style="max-width:300px">' + esc(c.complaint_text) + '</td>' +
        '<td>' + esc(c.routed_to_dept || '—') + '</td>' +
        '<td>' + UI.statusBadge(c.status) + ' ' + sla + '</td>' +
        '<td>' + (open ?
          '<div class="wrap-gap"><button class="btn btn-primary btn-sm" onclick="qualityUpdate(\'' + c.complaint_no + '\',\'responded\')">' + I('check') + 'Respond</button>' +
          (c.status !== 'escalated' ? '<button class="btn btn-rose btn-sm" onclick="qualityUpdate(\'' + c.complaint_no + '\',\'escalated\')">Escalate</button>' : '') +
          '<button class="btn btn-soft btn-sm" onclick="qualityUpdate(\'' + c.complaint_no + '\',\'closed\')">Close</button></div>'
          : '<span class="muted">' + S.titleCase(c.status) + '</span>') + '</td></tr>';
    }).join('') || '<tr><td colspan="6">' + UI.empty('No complaints', 'check') + '</td></tr>';

    return UI.pageHead({ eyebrow: 'Quality', title: 'Complaints', sub: 'Numbered tickets with a 6-hour response window that escalates to the director when missed (FR-13.2 / FR-13.4)' }) +
      UI.lockNote('Each complaint has a response window. Miss it and it escalates to the hospital director. Negative feedback is routed to the relevant department head (FR-13.3).') +
      '<div class="card mt-2"><div class="card-head"><h3>Tickets</h3></div>' +
      '<div class="table-wrap"><table class="t"><thead><tr><th>Ticket</th><th>Visit</th><th>Complaint</th><th>Routed to</th><th>Status</th><th></th></tr></thead><tbody>' + rows + '</tbody></table></div></div>';
  }

  function reports() {
    var d = data.dash || {};
    var stages = d.ratings_by_stage || {};
    var stageBars = Object.keys(stages).map(function (k) { return { label: window.stageLabel(k), value: stages[k].count, display: stages[k].count + ' · ' + (stages[k].avg || 0).toFixed(1) + '★' }; });
    var sent = d.sentiment || { positive: 0, neutral: 0, negative: 0 };
    var sentiments = [{ label: 'Positive', value: sent.positive, display: '' + sent.positive }, { label: 'Neutral', value: sent.neutral, display: '' + sent.neutral }, { label: 'Negative', value: sent.negative, display: '' + sent.negative }];

    return UI.pageHead({ eyebrow: 'Quality', title: 'Reports & insights', sub: 'AI sentiment and stage comparison (FR-9.4 / FR-13.5)',
      actions: '<button class="btn btn-primary" onclick="qualityReport()">' + I('sparkle') + 'Generate monthly summary</button>' }) +
      '<div class="grid cols-2">' +
        '<div class="card"><div class="card-head"><h3>Ratings by stage</h3></div><div class="card-pad">' + (stageBars.length ? UI.barChart(stageBars) : UI.empty('No data')) + '</div></div>' +
        '<div class="card"><div class="card-head"><h3>Sentiment mix</h3></div><div class="card-pad">' + UI.barChart(sentiments) +
          '<div class="divider"></div><p class="muted" style="font-size:12.5px">AI groups complaints into themes and writes the monthly summary.</p></div></div>' +
      '</div>';
  }

  /* ---- register ---- */
  window.ROLES = window.ROLES || {};
  window.ROLES.quality = {
    label: 'Quality', person: 'Quality Manager', icon: 'shield', accent: 'gold',
    desc: 'Read feedback and complaints, watch the response window, and turn patient experience into reports the hospital acts on.',
    home: 'overview',
    nav: [
      { route: 'overview', label: 'Quality overview', icon: 'chart' },
      { route: 'feedback', label: 'Stage feedback', icon: 'heart' },
      { route: 'complaints', label: 'Complaints', icon: 'clipboard', badge: function () { return openComplaints().length; } },
      { route: 'reports', label: 'Reports', icon: 'sparkle' }
    ],
    load: load,
    render: function (route) {
      switch (route) {
        case 'feedback': return feedback();
        case 'complaints': return complaints();
        case 'reports': return reports();
        default: return overview();
      }
    }
  };
})();
