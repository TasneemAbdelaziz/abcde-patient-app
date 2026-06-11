/* ============================================================
   A.B.C.D.E — Staff Dashboards · ai.js
   The shared AI assistant. A floating helper on every dashboard,
   role-aware, backed by the platform's AI models (S8 advisor +
   S9 documentation, plus the risk and sentiment models). It can
   draft documentation (saved only after approval — FR-9.1),
   transcribe voice (Whisper — FR-9.2), translate AR/EN (FR-9.3),
   explain NEWS2 and triage, and summarise. It does not diagnose;
   red flags are handed to a person (FR-8.2/8.3 / NFR-2).
   ============================================================ */

window.AI = (function () {
  var I = UI.icon, esc = UI.esc;
  var open = false;
  var thread = [];

  /* ---- role-aware quick actions ---- */
  var QUICK = {
    doctor:    [['draft', 'Draft discharge summary'], ['summary', 'Summarise patient'], ['transcribe', 'Transcribe voice note'], ['translate', 'Translate AR↔EN'], ['differential', 'Suggest differential']],
    nurse:     [['news2', 'Explain this NEWS2'], ['handover', 'Shift handover'], ['triage', 'Triage guidance']],
    reception: [['insurance', 'Explain insurance result'], ['translate', 'Translate for patient']],
    quality:   [['themes', 'Top complaint themes'], ['monthly', 'Monthly summary']],
    admin:     [['kpi', 'KPI insight'], ['forecast', 'Forecast Door-to-Balloon'], ['models', 'AI model status']],
    emergency: [['escalation', 'Escalation guidance'], ['codeblue', 'Code Blue steps']],
    family:    [['status', 'Explain the status'], ['next', 'What happens next?']]
  };

  function greeting(role) {
    var who = { doctor: 'Dr. Adel', nurse: 'nurse', reception: 'reception', quality: 'quality team', admin: 'director', emergency: 'coordinator', family: 'Mariam' }[role] || 'there';
    return 'Hello ' + who + '. I’m your A.B.C.D.E assistant. I work off hospital-approved content and I don’t diagnose — I’ll hand any red flag to a clinician. How can I help?';
  }

  function patientName() { var p = window.selectedPatient && window.selectedPatient(); return p ? p.name : 'the patient'; }

  /* ---- canned, context-aware replies ---- */
  function reply(text) {
    var q = (text || '').toLowerCase();
    var role = window.STATE.role;
    var p = window.selectedPatient ? window.selectedPatient() : null;
    var has = function () { for (var i = 0; i < arguments.length; i++) if (q.indexOf(arguments[i]) > -1) return true; return false; };

    if (has('news2', 'deterior', 'warning')) {
      var l = p && p.vitals && p.vitals.length ? p.vitals[p.vitals.length - 1] : null;
      return 'NEWS2 aggregates respiratory rate, SpO₂, temperature, blood pressure, pulse and consciousness into one score. '
        + (l ? 'For ' + p.name + ', the latest score is ' + l.news2 + ' — ' + window.newsBand(l.news2).label + '. ' : '')
        + 'At ≥ 5 the team is alerted; a single 3 in any one vital also warrants review. This supports clinical judgement — it does not replace it.';
    }
    if (has('draft', 'discharge', 'summary', 'report', 'note')) {
      return 'Drafting a structured summary for ' + (p ? p.name + ' (' + p.serial + ')' : 'the patient') + '… ready in the AI Console. '
        + 'It includes reason for visit, diagnosis, course, medication and follow-up. Remember: nothing is saved to the record until you approve it (FR-9.1).';
    }
    if (has('transcribe', 'voice', 'dictat', 'whisper')) {
      return 'Voice transcription (Whisper) is ready in Arabic and English. Tap the mic, dictate your note, and I’ll return editable text you can paste into the record (FR-9.2).';
    }
    if (has('translate', 'arabic', 'english', 'russian', 'translat')) {
      return 'Medical translation is on (AR↔EN). Example — “Take one tablet twice daily after food” → «تناول قرصاً واحداً مرتين يومياً بعد الطعام». Paste any instruction and I’ll translate it for the patient (FR-9.3).';
    }
    if (has('insurance')) {
      return 'Insurance is read from the national ID and returns one of four answers: insured, employer-paid, uninsured-but-able, or uninsured-and-unable. The last goes to the three-doctor committee with a state-funding memo; a life-threatening case is admitted at once and settled later (BR-2).';
    }
    if (has('triage')) {
      return 'Triage sorts each patient into Cold (not urgent → clinic), Emergency (urgent → ER), or Critical (unconscious / accident / life-threatening → straight to ER, skipping triage). Vitals plus the presenting complaint drive the decision.';
    }
    if (has('door', 'balloon', 'd2b', 'kpi', 'forecast')) {
      var d = window.DB.kpis.monthlyD2B; var last = d[d.length - 1].v;
      return 'Door-to-Balloon is the headline cardiac KPI — door arrival to balloon inflation. The six-month trend is improving (now ' + last + ' min, down from ' + d[0].v + '). At the current rate you’re trending toward the < 60 min target next quarter.';
    }
    if (has('escalation', 'sos', 'code blue', 'codeblue')) {
      return 'The SOS chain alerts people in order: treating physician → nursing station → family contact → care center, moving on after a set wait with no answer. A Code Blue runs the same chain with no confirm step (FR-10.x).';
    }
    if (has('theme', 'complaint', 'sentiment')) {
      return 'This period the leading complaint theme is waiting time in Emergency (door-to-triage), with a secondary cluster on post-procedure pain relief. Sentiment is mostly positive; I’ve grouped the negatives by department for the heads.';
    }
    if (has('handover')) {
      return 'Shift handover for the ward: ' + (p ? p.name + ' — ' + window.stageLabel(p.stage) + ', ' + (p.riskScore ? p.riskScore.value + ' risk. ' : '') : '') + 'Watch the NEWS2 trend, due medications in the MAR, and any pending results. I can draft a full SBAR if you’d like.';
    }
    if (has('status', 'next', 'happen')) {
      return p ? p.name + ' is currently: ' + window.stageLabel(p.stage) + '. Next, the care team will move them to the following stage when ready. You’ll get an update each time the stage changes.' : 'I can explain the patient’s current status and what comes next in plain language.';
    }
    if (has('model', 'ai status')) {
      return window.DB.aiModels.length + ' AI models are configured: a RAG advisor, NEWS2/MEWS risk, report generation, Whisper transcription, sentiment, and translation. ' + window.DB.aiModels.filter(function (m) { return m.status === 'live'; }).length + ' are live; voice and translation are in beta.';
    }
    if (has('differential', 'suggest', 'diagnos')) {
      return 'I can surface considerations from approved content, but I don’t diagnose. For ' + (p ? p.name : 'this presentation') + ', the recorded problem list and the ordered tests are the basis — a red flag would be handed to you directly (FR-8.2).';
    }
    return 'I can help with documentation drafts, voice transcription, AR/EN translation, NEWS2 and triage guidance, KPI insights, and patient summaries. Try one of the quick actions below — or ask me anything about ' + (p ? p.name : 'a patient') + '.';
  }

  /* ---- rendering ---- */
  function bubbles() {
    if (!thread.length) return '';
    return thread.map(function (m) {
      return '<div class="ai-msg ' + m.role + '">' +
        (m.role === 'ai' ? '<div class="ai-ava">' + I('sparkle') + '</div>' : '') +
        '<div class="ai-bubble">' + esc(m.text) + '</div></div>';
    }).join('');
  }

  function panelHTML() {
    var role = window.STATE.role || 'doctor';
    var chips = (QUICK[role] || QUICK.doctor).map(function (a) {
      return '<button class="ai-chip" onclick="AI.quick(\'' + a[0] + '\')">' + esc(a[1]) + '</button>';
    }).join('');
    var models = window.DB.aiModels.slice(0, 4).map(function (m) {
      return '<span class="ai-modelchip">' + I(m.icon) + esc(m.engine.split(' ')[0]) + '</span>';
    }).join('');
    return '<div class="ai-head">' +
        '<div class="ai-h-ic">' + I('sparkle') + '</div>' +
        '<div><div class="ai-h-t">AI Assistant</div><div class="ai-h-s">Smart Healthcare Assistant · RAG</div></div>' +
        '<button class="ai-close" onclick="AI.close()">' + I('x') + '</button>' +
      '</div>' +
      '<div class="ai-models">' + models + '</div>' +
      '<div class="ai-thread" id="aiThread">' + (bubbles() || '<div class="ai-empty">' + esc(greeting(role)) + '</div>') + '</div>' +
      '<div class="ai-quick">' + chips + '</div>' +
      '<div class="ai-input">' +
        '<button class="ai-mic" title="Dictate (Whisper)" onclick="AI.mic()">' + I('stethoscope') + '</button>' +
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
    open: function () { open = true; ensure(); paint(); document.getElementById('aiPanel').classList.add('on'); var i = document.getElementById('aiInput'); if (i) i.focus(); },
    close: function () { open = false; var p = document.getElementById('aiPanel'); if (p) p.classList.remove('on'); },
    toggle: function () { open ? this.close() : this.open(); },
    send: function (preset) {
      var inp = document.getElementById('aiInput');
      var text = preset || (inp ? inp.value : '');
      if (!text || !text.trim()) return;
      thread.push({ role: 'user', text: text });
      if (inp) inp.value = '';
      paint();
      var ans = reply(text);
      setTimeout(function () { thread.push({ role: 'ai', text: ans }); paint(); }, 240);
    },
    quick: function (key) {
      var label = (QUICK[window.STATE.role] || []).filter(function (a) { return a[0] === key; })[0];
      this.send(label ? label[1] : key);
    },
    mic: function () {
      UI.toast('Listening… (Whisper transcription)', 'ok');
      var self = this;
      setTimeout(function () { self.send('Transcribe: patient reports chest discomfort eased after rest, no shortness of breath now.'); }, 700);
    }
  };
})();
