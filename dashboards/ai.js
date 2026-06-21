/* ============================================================
   A.B.C.D.E — Staff Dashboards · ai.js  (LIVE API)
   The shared AI assistant — a floating, role-aware helper on
   every dashboard, backed by the live /assistant endpoints. It
   answers from hospital-approved content (FR-8), does not
   diagnose, and hands red flags to a person (NFR-2). Drafting,
   transcription and translation live in the Doctor AI console.
   ============================================================ */

window.AI = (function () {
  var I = UI.icon, esc = UI.esc;
  var open = false;
  var thread = [];

  var QUICK = {
    doctor:    ['Draft a discharge summary', 'After-care for a stent', 'Explain NEWS2'],
    nurse:     ['Explain this NEWS2', 'Triage guidance', 'When to escalate'],
    reception: ['Explain the insurance categories', 'How is the Serial built?'],
    quality:   ['Top complaint themes', 'Summarise this month'],
    admin:     ['What is Door-to-Balloon?', 'AI model status'],
    director:  ['What is Door-to-Balloon?', 'Summarise quality'],
    emergency: ['Escalation guidance', 'Code Blue steps'],
    family:    ['Explain the status', 'What happens next?']
  };

  function greeting(role) {
    var me = window.STORE && window.STORE.me ? window.STORE.me() : null;
    var who = me ? me.name : 'there';
    return 'Hello ' + who + '. I’m your A.B.C.D.E assistant. I work off hospital-approved content and I don’t diagnose — I’ll hand any red flag to a clinician. How can I help?';
  }

  function bubbles() {
    if (!thread.length) return '';
    return thread.map(function (m) {
      return '<div class="ai-msg ' + m.role + '">' +
        (m.role === 'ai' ? '<div class="ai-ava">' + I('sparkle') + '</div>' : '') +
        '<div class="ai-bubble">' + esc(m.text) + (m.flag ? '<div class="muted" style="font-size:11px;margin-top:4px;color:#b23a3a">⚠ red flag — escalate to a clinician</div>' : '') + '</div></div>';
    }).join('');
  }

  function panelHTML() {
    var role = window.STATE.role || 'doctor';
    var chips = (QUICK[role] || QUICK.doctor).map(function (q) {
      return '<button class="ai-chip" onclick="AI.send(' + JSON.stringify(q).replace(/"/g, '&quot;') + ')">' + esc(q) + '</button>';
    }).join('');
    return '<div class="ai-head">' +
        '<div class="ai-h-ic">' + I('sparkle') + '</div>' +
        '<div><div class="ai-h-t">AI Assistant</div><div class="ai-h-s">Smart Healthcare Assistant · live</div></div>' +
        '<button class="ai-close" onclick="AI.close()">' + I('x') + '</button>' +
      '</div>' +
      '<div class="ai-thread" id="aiThread">' + (bubbles() || '<div class="ai-empty">' + esc(greeting(role)) + '</div>') + '</div>' +
      '<div class="ai-quick">' + chips + '</div>' +
      '<div class="ai-input">' +
        '<input id="aiInput" placeholder="Ask the assistant…" onkeydown="if(event.key===\'Enter\')AI.send()" />' +
        '<button class="ai-send" onclick="AI.send()">' + I('arrowRight') + '</button>' +
      '</div>' +
      '<div class="ai-disc">' + I('shield') + 'Does not diagnose · drafts need clinician approval (NFR-2)</div>';
  }

  function paint() {
    var panel = document.getElementById('aiPanel');
    if (panel) panel.innerHTML = panelHTML();
    var th = document.getElementById('aiThread');
    if (th) th.scrollTop = th.scrollHeight;
  }

  function ensure() {
    var layer = document.getElementById('aiLayer');
    if (!layer) return;
    if (!document.getElementById('aiFab')) {
      layer.innerHTML =
        '<button class="ai-fab" id="aiFab" onclick="AI.open()" title="AI Assistant">' + I('sparkle') + '<span class="ai-fab-pulse"></span></button>' +
        '<div class="ai-panel" id="aiPanel"></div>';
    }
  }

  return {
    sync: function () {
      ensure();
      var show = window.STATE.screen === 'app';
      var fab = document.getElementById('aiFab'), panel = document.getElementById('aiPanel');
      if (fab) fab.style.display = show ? 'flex' : 'none';
      if (!show && panel) { panel.classList.remove('on'); open = false; }
    },
    open: function () { open = true; ensure(); paint(); var p = document.getElementById('aiPanel'); if (p) p.classList.add('on'); var i = document.getElementById('aiInput'); if (i) i.focus(); },
    close: function () { open = false; var p = document.getElementById('aiPanel'); if (p) p.classList.remove('on'); },
    toggle: function () { open ? this.close() : this.open(); },
    send: function (preset) {
      var inp = document.getElementById('aiInput');
      var text = (typeof preset === 'string' ? preset : (inp ? inp.value : '')) || '';
      if (!text.trim()) return;
      thread.push({ role: 'user', text: text });
      if (inp) inp.value = '';
      thread.push({ role: 'ai', text: '…', typing: true });
      paint();
      API.ai.ask({ question: text, context: window.STATE.role || 'clinical' }).then(function (r) {
        thread.pop(); // remove typing
        thread.push({ role: 'ai', text: r.answer || '—', flag: !!r.red_flag });
        paint();
      }).catch(function (e) {
        thread.pop();
        thread.push({ role: 'ai', text: e.message || 'The assistant is unavailable right now.' });
        paint();
      });
    }
  };
})();
