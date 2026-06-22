/* ============================================================
   A.B.C.D.E — Staff Dashboards · components.js
   Shared UI helpers used by every role: icons, badges, tiles,
   tables, the patient strip, modal, and toast. Plain functions
   that return HTML strings (same idiom as the mobile prototype),
   plus a couple of imperative helpers (toast/modal).
   ============================================================ */

window.UI = (function () {

  /* ---------- icons (Lucide-style line SVGs) ---------- */
  var P = 'stroke="currentColor" stroke-width="1.9" fill="none" stroke-linecap="round" stroke-linejoin="round"';
  var ICONS = {
    desk:      '<path '+P+' d="M3 21h18M4 21V8l8-4 8 4v13M9 21v-6h6v6"/>',
    reception: '<path '+P+' d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-5a3 3 0 0 1 6 0v5"/>',
    nurse:     '<path '+P+' d="M12 3v6m-3-3h6"/><path '+P+' d="M5 12a7 7 0 0 0 14 0"/><circle cx="12" cy="19" r="2"/>',
    doctor:    '<path '+P+' d="M9 3v3a3 3 0 0 0 6 0V3"/><path '+P+' d="M6 6v5a6 6 0 0 0 12 0V6"/><circle cx="18" cy="17" r="3"/><path '+P+' d="M12 11v3a5 5 0 0 0 3 4.6"/>',
    user:      '<circle cx="12" cy="8" r="4"/><path '+P+' d="M4 21a8 8 0 0 1 16 0"/>',
    users:     '<circle cx="9" cy="8" r="3.4"/><path '+P+' d="M2.5 21a6.5 6.5 0 0 1 13 0"/><path '+P+' d="M16 6.2a3.4 3.4 0 0 1 0 6.6M21.5 21a6.5 6.5 0 0 0-4-6"/>',
    heart:     '<path '+P+' d="M12 20s-7-4.5-9.3-9.2C1.2 7.6 3 4.5 6.2 4.5c2 0 3.2 1.2 3.8 2.3.6-1.1 1.8-2.3 3.8-2.3 3.2 0 5 3.1 3.5 6.3C19 15.5 12 20 12 20Z"/>',
    activity:  '<path '+P+' d="M3 12h4l2 7 4-14 2 7h6"/>',
    pill:      '<rect x="3" y="9" width="18" height="6" rx="3" transform="rotate(45 12 12)"/><path '+P+' d="M8.5 8.5l7 7"/>',
    flask:     '<path '+P+' d="M9 3h6M10 3v6L5 18a2 2 0 0 0 1.8 3h10.4A2 2 0 0 0 19 18l-5-9V3"/><path '+P+' d="M7.5 14h9"/>',
    file:      '<path '+P+' d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path '+P+' d="M14 3v5h5"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path '+P+' d="M9 4V3h6v1M9 11h6M9 15h4"/>',
    calendar:  '<rect x="3" y="5" width="18" height="16" rx="2"/><path '+P+' d="M3 9h18M8 3v4M16 3v4"/>',
    card:      '<rect x="3" y="5" width="18" height="14" rx="2"/><path '+P+' d="M3 10h18M7 15h4"/>',
    money:     '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.5"/><path '+P+' d="M6 9v6M18 9v6"/>',
    alert:     '<path '+P+' d="M12 3 2.5 19.5a1 1 0 0 0 .9 1.5h17.2a1 1 0 0 0 .9-1.5L12 3Z"/><path '+P+' d="M12 9v5M12 17.5v.5"/>',
    bell:      '<path '+P+' d="M18 8a6 6 0 1 0-12 0c0 7-3 8-3 8h18s-3-1-3-8"/><path '+P+' d="M10.3 21a2 2 0 0 0 3.4 0"/>',
    search:    '<circle cx="11" cy="11" r="7"/><path '+P+' d="m21 21-4.3-4.3"/>',
    check:     '<path '+P+' d="M20 6 9 17l-5-5"/>',
    checkCircle:'<circle cx="12" cy="12" r="9"/><path '+P+' d="m8.5 12 2.5 2.5 4.5-5"/>',
    x:         '<path '+P+' d="M18 6 6 18M6 6l12 12"/>',
    plus:      '<path '+P+' d="M12 5v14M5 12h14"/>',
    arrowRight:'<path '+P+' d="M5 12h14M13 6l6 6-6 6"/>',
    chevron:   '<path '+P+' d="m9 6 6 6-6 6"/>',
    stethoscope:'<path '+P+' d="M5 3v6a4 4 0 0 0 8 0V3"/><path '+P+' d="M9 13v3a5 5 0 0 0 10 0v-1"/><circle cx="19" cy="13" r="2"/>',
    shield:    '<path '+P+' d="M12 3 5 6v6c0 4 3 7 7 9 4-2 7-5 7-9V6l-7-3Z"/><path '+P+' d="m9 12 2 2 4-4"/>',
    chart:     '<path '+P+' d="M4 4v16h16"/><path '+P+' d="M8 14v3M12 10v7M16 6v11"/>',
    clock:     '<circle cx="12" cy="12" r="9"/><path '+P+' d="M12 7v5l3 2"/>',
    route:     '<circle cx="6" cy="19" r="2.5"/><circle cx="18" cy="5" r="2.5"/><path '+P+' d="M8.5 19H14a3 3 0 0 0 0-6h-4a3 3 0 0 1 0-6h5.5"/>',
    drop:      '<path '+P+' d="M12 3s6 6.4 6 10.5A6 6 0 0 1 6 13.5C6 9.4 12 3 12 3Z"/>',
    lung:      '<path '+P+' d="M12 4v8M9 8a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0M15 8a3 3 0 0 1 3 3v4a3 3 0 0 1-6 0"/>',
    edit:      '<path '+P+' d="M12 20h9"/><path '+P+' d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z"/>',
    sparkle:   '<path '+P+' d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path '+P+' d="M12 8a4 4 0 0 0 4 4 4 4 0 0 0-4 4 4 4 0 0 0-4-4 4 4 0 0 0 4-4Z"/>',
    logout:    '<path '+P+' d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path '+P+' d="M16 17l5-5-5-5M21 12H9"/>',
    globe:     '<circle cx="12" cy="12" r="9"/><path '+P+' d="M3 12h18M12 3c2.5 2.5 2.5 16 0 18M12 3c-2.5 2.5-2.5 16 0 18"/>',
    print:     '<path '+P+' d="M6 9V3h12v6M6 18H4a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="7" rx="1"/>',
    brain:     '<path '+P+' d="M12 5a3 3 0 0 0-5.6-1.5A2.5 2.5 0 0 0 4 6a2.5 2.5 0 0 0 .6 4.4A3 3 0 0 0 7 15a3 3 0 0 0 5 1.2V5Z"/><path '+P+' d="M12 5a3 3 0 0 1 5.6-1.5A2.5 2.5 0 0 1 20 6a2.5 2.5 0 0 1-.6 4.4A3 3 0 0 1 17 15a3 3 0 0 1-5 1.2"/>',
    bone:      '<path '+P+' d="m9.5 9.5 5 5"/><path '+P+' d="M9.2 6.2a2 2 0 1 0-3 3l.3.3-.3.3a2 2 0 1 0 3 3"/><path '+P+' d="M14.8 17.8a2 2 0 1 0 3-3l-.3-.3.3-.3a2 2 0 1 0-3-3"/>',
    baby:      '<circle cx="12" cy="6" r="2.5"/><path '+P+' d="M12 8.5v4m0 0-3.5 4m3.5-4 3.5 4M8 12h8"/>',
    tooth:     '<path '+P+' d="M8 3.5c-2.2 0-3.6 1.6-3.6 4 0 1.7.8 3 1.2 5 .4 1.9.2 4 1.1 5.8.4.8 1.5.7 1.8-.2.4-1.3.5-2.7 1-4 .2-.6.8-.6 1 0 .5 1.3.6 2.7 1 4 .3.9 1.4 1 1.8.2.9-1.8.7-3.9 1.1-5.8.4-2 1.2-3.3 1.2-5 0-2.4-1.4-4-3.6-4-1.1 0-1.8.5-2.4.5s-1.3-.5-2.4-.5Z"/>',
    scan:      '<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/><path '+P+' d="M12 2v3M12 19v3M2 12h3M19 12h3"/>',
    ambulance: '<path '+P+' d="M3 7h11v8H3z"/><path '+P+' d="M14 10h3.5l2.5 3v2H14z"/><circle cx="7.5" cy="17.5" r="1.6"/><circle cx="16.5" cy="17.5" r="1.6"/><path '+P+' d="M7 9.5v3M5.5 11h3"/>',
    eye:       '<path '+P+' d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
    surgery:   '<path '+P+' d="M3 21l6-6"/><path '+P+' d="M9 15 18 6a2 2 0 0 0-3-3L6 12l3 3Z"/><path '+P+' d="M14 7l3 3"/>',
    phone:     '<path '+P+' d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 5 5L14 17l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z"/>',
    pin:       '<path '+P+' d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    mail:      '<rect x="3" y="5" width="18" height="14" rx="2"/><path '+P+' d="m3 7 9 6 9-6"/>',
    menu:      '<path '+P+' d="M4 6h16M4 12h16M4 18h16"/>'
  };

  function icon(name, cls) {
    var body = ICONS[name] || '';
    return '<svg viewBox="0 0 24 24" class="' + (cls || '') + '" aria-hidden="true">' + body + '</svg>';
  }

  /* ---------- small builders ---------- */
  function badge(text, tone, large) {
    return '<span class="badge ' + (tone || 'slate') + (large ? ' badge-lg' : '') + '">' +
      '<span class="bdot"></span>' + esc(text) + '</span>';
  }

  var T = function (s) { return window.t ? window.t(s) : s; };
  function triageBadge(key) {
    if (!key) return '';
    var c = window.STORE.triageInfo(key);
    return badge(T(c.label), c.tone);
  }
  function insuranceBadge(key) {
    if (!key) return badge('—', 'slate');
    var c = window.STORE.insuranceInfo(key);
    return badge(T(c.label), c.tone);
  }
  function newsBadge(score) {
    var b = window.STORE.newsBand(score);
    return badge(score == null ? T(b.label) : 'NEWS2 ' + score + ' · ' + T(b.label), b.tone);
  }
  // generic status pill using the shared tone map (appointment/complaint/order statuses)
  function statusBadge(status, labelOverride) {
    if (!status) return badge('—', 'slate');
    return badge(T(labelOverride || window.STORE.titleCase(status)), window.STORE.statusTone(status));
  }

  function tile(opts) {
    return '<div class="tile ' + (opts.accent ? 'accent-' + opts.accent : '') + '">' +
      '<div class="ti-top"><span class="ti-label">' + esc(T(opts.label)) + '</span>' +
        '<span class="ti-ic">' + icon(opts.icon || 'activity') + '</span></div>' +
      '<div class="ti-val">' + opts.value + (opts.unit ? ' <small>' + esc(opts.unit) + '</small>' : '') + '</div>' +
      (opts.foot ? '<div class="ti-foot">' + (window.tHas && window.tHas(opts.foot) ? esc(T(opts.foot)) : opts.foot) + '</div>' : '') +
    '</div>';
  }

  function pageHead(opts) {
    return '<div class="page-head">' +
      '<div>' +
        (opts.eyebrow ? '<div class="ph-eyebrow">' + esc(T(opts.eyebrow)) + '</div>' : '') +
        '<h1>' + esc(T(opts.title)) + '</h1>' +
        (opts.sub ? '<div class="ph-sub">' + esc(T(opts.sub)) + '</div>' : '') +
      '</div>' +
      (opts.actions ? '<div class="ph-actions">' + opts.actions + '</div>' : '') +
    '</div>';
  }

  function patientStrip(p, extra) {
    var initials = p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
    return '<div class="pt-strip">' +
      '<div class="pt-av ' + (p.sex === 'F' ? 'f' : '') + '">' + esc(initials) + '</div>' +
      '<div><div class="pt-name">' + esc(p.name) + '</div>' +
      '<div class="pt-meta">' + esc(p.serial) + ' · ' + p.age + esc(p.sex === 'F' ? 'F' : 'M') +
      ' · ' + esc(p.department) + (p.room && p.room !== '—' ? ' · ' + esc(p.room) : '') + '</div></div>' +
      (extra ? '<div style="margin-inline-start:auto">' + extra + '</div>' : '') +
    '</div>';
  }

  function avatarFor(p) {
    var initials = p.name.split(' ').map(function (w) { return w[0]; }).slice(0, 2).join('');
    return '<div class="pt-av ' + (p.sex === 'F' ? 'f' : '') + '" style="width:38px;height:38px;font-size:13px;border-radius:11px">' + esc(initials) + '</div>';
  }

  function lockNote(text) {
    return '<div class="lock-note">' + icon('shield') + '<div>' + text + '</div></div>';
  }

  function empty(text, ic) {
    return '<div class="empty">' + icon(ic || 'clipboard') + '<div>' + esc(T(text)) + '</div></div>';
  }

  function barcode(seed) {
    var s = String(seed || '').split('').reduce(function (a, c) { return a + c.charCodeAt(0); }, 7);
    var bars = '';
    for (var i = 0; i < 42; i++) {
      var h = 18 + ((s * (i + 3)) % 17);
      var w = ((s + i) % 3) + 1;
      bars += '<i style="height:' + h + 'px;width:' + w + 'px"></i>';
    }
    return '<div class="barcode">' + bars + '</div>';
  }

  // tiny vitals sparkline from an array of numbers
  function spark(values, max) {
    var mx = max || Math.max.apply(null, values.concat([1]));
    return '<div class="spark">' + values.map(function (v) {
      var h = Math.max(4, Math.round((v / mx) * 28));
      return '<i style="height:' + h + 'px"></i>';
    }).join('') + '</div>';
  }

  // star rating display (0..5)
  function stars(n) {
    var out = '<span class="stars" aria-label="' + n + ' out of 5">';
    for (var i = 1; i <= 5; i++) {
      out += '<svg viewBox="0 0 24 24" class="' + (i <= n ? 'on' : '') + '"><path d="M12 3.5l2.5 5.3 5.8.7-4.3 4 1.1 5.7L12 21.2 6.9 24l1.1-5.7-4.3-4 5.8-.7z" stroke="currentColor" stroke-width="1.4" fill="' + (i <= n ? 'currentColor' : 'none') + '"/></svg>';
    }
    return out + '</span>';
  }
  function sentimentBadge(s) {
    var map = { positive: ['Positive', 'green'], neutral: ['Neutral', 'slate'], negative: ['Negative', 'rose'] };
    var m = map[s] || map.neutral;
    return badge(m[0], m[1]);
  }

  // labelled horizontal bar chart from [{label, value}], value scaled to max
  function barChart(items, opts) {
    opts = opts || {};
    var mx = Math.max.apply(null, items.map(function (i) { return i.value; }).concat([1]));
    return '<div class="barchart">' + items.map(function (i) {
      var pct = Math.round((i.value / mx) * 100);
      return '<div class="bc-row"><div class="bc-label">' + esc(i.label) + '</div>' +
        '<div class="bc-track"><div class="bc-fill" style="width:' + pct + '%"></div></div>' +
        '<div class="bc-val">' + esc(i.display != null ? i.display : i.value) + '</div></div>';
    }).join('') + '</div>';
  }

  /* ---- chart palette ---- */
  var PAL = ['#0d9488', '#e0a458', '#d96666', '#3fa66a', '#7c93a6', '#5eead4', '#0f766e', '#b58bd6'];
  function palette(i) { return PAL[i % PAL.length]; }

  // SVG line/area chart. series = [{label, values:[..], color}] or a bare values array.
  function lineChart(series, opts) {
    opts = opts || {};
    if (!Array.isArray(series)) series = [series];
    if (typeof series[0] === 'number') series = [{ values: series }];
    series = series.map(function (s, i) { return { values: s.values || s, color: s.color || palette(i), label: s.label }; });
    var W = 340, H = opts.h || 150, P = { t: 14, r: 14, b: 24, l: 30 };
    var all = series.reduce(function (a, s) { return a.concat(s.values); }, []);
    var max = opts.max != null ? opts.max : Math.max.apply(null, all.concat([1]));
    var min = opts.min != null ? opts.min : Math.min.apply(null, all.concat([0]));
    if (max === min) max += 1;
    var n = Math.max.apply(null, series.map(function (s) { return s.values.length; }));
    var iw = W - P.l - P.r, ih = H - P.t - P.b;
    var X = function (i) { return P.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw); };
    var Y = function (v) { return P.t + ih - ((v - min) / (max - min)) * ih; };
    var grid = '';
    for (var g = 0; g <= 3; g++) {
      var gy = P.t + (g / 3) * ih, gv = max - (g / 3) * (max - min);
      grid += '<line x1="' + P.l + '" y1="' + gy.toFixed(1) + '" x2="' + (W - P.r) + '" y2="' + gy.toFixed(1) + '" class="cg"/>' +
        '<text x="' + (P.l - 7) + '" y="' + (gy + 3).toFixed(1) + '" class="cyl">' + Math.round(gv) + '</text>';
    }
    var body = series.map(function (s, si) {
      var pts = s.values.map(function (v, i) { return X(i).toFixed(1) + ',' + Y(v).toFixed(1); });
      var area = opts.area === false ? '' :
        '<path d="M' + X(0).toFixed(1) + ',' + (P.t + ih) + ' L' + pts.join(' L') + ' L' + X(s.values.length - 1).toFixed(1) + ',' + (P.t + ih) + ' Z" fill="' + s.color + '" opacity="0.09"/>';
      var line = '<polyline points="' + pts.join(' ') + '" fill="none" stroke="' + s.color + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>';
      var dots = s.values.map(function (v, i) { return '<circle cx="' + X(i).toFixed(1) + '" cy="' + Y(v).toFixed(1) + '" r="2.7" fill="#fff" stroke="' + s.color + '" stroke-width="2"/>'; }).join('');
      return area + line + dots;
    }).join('');
    var xl = (opts.labels || []).map(function (l, i) { return '<text x="' + X(i).toFixed(1) + '" y="' + (H - 6) + '" class="cxl">' + esc(l) + '</text>'; }).join('');
    return '<svg viewBox="0 0 ' + W + ' ' + H + '" class="chart">' + grid + body + xl + '</svg>';
  }

  // SVG donut with legend. segs = [{label, value, color}]
  function donut(segs, opts) {
    opts = opts || {};
    segs = segs.map(function (s, i) { return { label: s.label, value: s.value, color: s.color || palette(i) }; });
    var total = segs.reduce(function (a, s) { return a + s.value; }, 0) || 1;
    var r = 54, C = 2 * Math.PI * r, cx = 70, cy = 70, sw = opts.sw || 20, off = 0;
    var arcs = segs.map(function (s) {
      var len = (s.value / total) * C, el =
        '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="' + s.color + '" stroke-width="' + sw + '" stroke-linecap="round" stroke-dasharray="' + (len - 1).toFixed(1) + ' ' + (C - len + 1).toFixed(1) + '" stroke-dashoffset="' + (-off).toFixed(1) + '" transform="rotate(-90 ' + cx + ' ' + cy + ')"/>';
      off += len; return el;
    }).join('');
    var center = '<text x="' + cx + '" y="' + (cy - 1) + '" class="dnv">' + esc(opts.centerValue != null ? opts.centerValue : total) + '</text>' +
      (opts.centerLabel ? '<text x="' + cx + '" y="' + (cy + 15) + '" class="dnl">' + esc(opts.centerLabel) + '</text>' : '');
    var svg = '<svg viewBox="0 0 140 140" class="donut"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" stroke="#eef2f5" stroke-width="' + sw + '"/>' + arcs + center + '</svg>';
    var legend = '<div class="dn-legend">' + segs.map(function (s) {
      return '<div class="dn-li"><span class="dn-sw" style="background:' + s.color + '"></span>' + esc(s.label) + '<b>' + s.value + '</b></div>';
    }).join('') + '</div>';
    return '<div class="donut-wrap">' + svg + legend + '</div>';
  }

  // circular progress ring (0..100)
  function ring(pct, opts) {
    opts = opts || {};
    var r = 34, C = 2 * Math.PI * r, dash = (pct / 100) * C, col = opts.color || '#0d9488';
    return '<div class="ring-wrap"><svg viewBox="0 0 84 84" class="ring">' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="#eef2f5" stroke-width="8"/>' +
      '<circle cx="42" cy="42" r="' + r + '" fill="none" stroke="' + col + '" stroke-width="8" stroke-linecap="round" stroke-dasharray="' + dash.toFixed(1) + ' ' + C.toFixed(1) + '" transform="rotate(-90 42 42)"/>' +
      '<text x="42" y="46" class="rgv">' + (opts.label != null ? esc(opts.label) : pct + '%') + '</text></svg></div>';
  }

  /* ---------- escape ---------- */
  function esc(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /* ---------- table enhancer: search + sortable columns (DOM-level, no module changes) ---------- */
  function cellNum(s) { var m = String(s).replace(/,/g, '').match(/-?\d+(\.\d+)?/); return m ? parseFloat(m[0]) : null; }
  function enhanceTables(root) {
    if (!root) return;
    var tables = root.querySelectorAll ? root.querySelectorAll('table.t') : [];
    Array.prototype.forEach.call(tables, function (tbl) {
      if (tbl.__enh) return;
      var thead = tbl.tHead, tbody = tbl.tBodies && tbl.tBodies[0];
      if (!thead || !thead.rows[0] || !tbody) return;
      var headCells = thead.rows[0].cells;
      var rowCount = tbody.rows.length;
      if (headCells.length < 2 || rowCount < 3) return; // skip pickers / tiny tables
      tbl.__enh = true;

      // sortable headers
      Array.prototype.forEach.call(headCells, function (th, idx) {
        if (!th.textContent.trim()) return;
        th.classList.add('sortable');
        th.insertAdjacentHTML('beforeend', '<span class="sort-ar">↕</span>');
        th.addEventListener('click', function () {
          var asc = !(th.__asc);
          th.__asc = asc;
          Array.prototype.forEach.call(headCells, function (h) { if (h !== th) { h.classList.remove('sorted'); var a = h.querySelector('.sort-ar'); if (a) a.textContent = '↕'; h.__asc = undefined; } });
          th.classList.add('sorted');
          var ar = th.querySelector('.sort-ar'); if (ar) ar.textContent = asc ? '↑' : '↓';
          var rows = Array.prototype.slice.call(tbody.rows);
          rows.sort(function (a, b) {
            var ta = (a.cells[idx] ? a.cells[idx].textContent : '').trim();
            var tb = (b.cells[idx] ? b.cells[idx].textContent : '').trim();
            var na = cellNum(ta), nb = cellNum(tb), r;
            if (na != null && nb != null) r = na - nb; else r = ta.localeCompare(tb, undefined, { numeric: true });
            return asc ? r : -r;
          });
          rows.forEach(function (r) { tbody.appendChild(r); });
        });
      });

      // search toolbar (only for longer tables)
      if (rowCount >= 6) {
        var wrap = tbl.closest ? tbl.closest('.table-wrap') : null;
        if (wrap && wrap.parentNode) {
          var bar = document.createElement('div');
          bar.className = 'tbl-toolbar';
          var ph = window.t ? window.t('Search…') : 'Search…';
          bar.innerHTML = '<div class="tbl-search">' + icon('search') + '<input type="text" placeholder="' + esc(ph) + '" /></div>' +
            '<span class="tbl-count"></span>';
          var input = bar.querySelector('input'), count = bar.querySelector('.tbl-count');
          function refresh() {
            var q = input.value.trim().toLowerCase(), shown = 0, rows = tbody.rows;
            for (var i = 0; i < rows.length; i++) {
              var hit = !q || rows[i].textContent.toLowerCase().indexOf(q) > -1;
              rows[i].style.display = hit ? '' : 'none';
              if (hit) shown++;
            }
            count.textContent = shown + ' / ' + rows.length;
          }
          input.addEventListener('input', refresh);
          wrap.parentNode.insertBefore(bar, wrap);
          refresh();
        }
      }
    });
  }

  /* ---------- modal ---------- */
  function modal(opts) {
    var back = document.getElementById('modalBack');
    back.innerHTML =
      '<div class="modal ' + (opts.wide ? 'wide' : '') + '" onclick="event.stopPropagation()">' +
        '<div class="modal-head">' +
          (opts.icon ? '<span class="ti-ic" style="width:30px;height:30px">' + icon(opts.icon) + '</span>' : '') +
          '<h3>' + esc(opts.title) + '</h3>' +
          '<button class="mh-close" onclick="UI.closeModal()" aria-label="Close">' + icon('x') + '</button>' +
        '</div>' +
        '<div class="modal-body">' + opts.body + '</div>' +
        (opts.foot ? '<div class="modal-foot">' + opts.foot + '</div>' : '') +
      '</div>';
    back.classList.add('on');
    back.onclick = function () { closeModal(); };
    if (window.i18nApply) window.i18nApply(back);
  }
  function closeModal() {
    var back = document.getElementById('modalBack');
    back.classList.remove('on');
    back.innerHTML = '';
  }

  /* ---------- toast ---------- */
  function toast(msg, kind) {
    var wrap = document.getElementById('toastWrap');
    var el = document.createElement('div');
    var ic = kind === 'ok' ? 'checkCircle' : kind === 'warn' ? 'alert' : kind === 'err' ? 'alert' : 'bell';
    el.className = 'toast ' + (kind || '');
    el.innerHTML = icon(ic) + '<span>' + esc(msg) + '</span>';
    wrap.appendChild(el);
    setTimeout(function () {
      el.style.transition = 'opacity .3s, transform .3s';
      el.style.opacity = '0'; el.style.transform = 'translateX(20px)';
      setTimeout(function () { el.remove(); }, 320);
    }, 2600);
  }

  return {
    icon: icon, badge: badge, triageBadge: triageBadge, insuranceBadge: insuranceBadge,
    newsBadge: newsBadge, statusBadge: statusBadge, tile: tile, pageHead: pageHead, patientStrip: patientStrip, enhanceTables: enhanceTables,
    avatarFor: avatarFor, lockNote: lockNote, empty: empty, barcode: barcode, spark: spark,
    stars: stars, sentimentBadge: sentimentBadge, barChart: barChart,
    lineChart: lineChart, donut: donut, ring: ring, palette: palette,
    esc: esc, modal: modal, closeModal: closeModal, toast: toast
  };
})();
