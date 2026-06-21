/* ============================================================
   A.B.C.D.E — Staff Dashboards · api.js
   The single, complete client for the Laravel /api/v1 backend.
   Every one of the ~90 endpoints in routes/api.php is reachable
   through window.API. The dashboards never touch fetch() directly.

   Response envelope (from App\Http\Traits\ApiResponds):
     success: { success:true, message?, data, meta:{locale} }
     error  : { success:false, message, meta, errors? }   (4xx/5xx)

   req() returns the unwrapped `data` and throws an ApiError on
   failure (so callers `try { await API.x() } catch (e) { ... }`).
   ============================================================ */

window.API = (function () {

  /* ---------- configuration ---------- */
  var DEFAULT_BASE = 'http://127.0.0.1:8000/api/v1';

  function resolveBase() {
    // 1) explicit override stored by the user (Settings),
    // 2) same-origin when the dashboards are served by Laravel itself,
    // 3) the local dev default.
    try {
      var saved = localStorage.getItem('abcde_api_base');
      if (saved) return saved.replace(/\/+$/, '');
    } catch (e) {}
    if (typeof location !== 'undefined' && /^https?:/.test(location.protocol) &&
        location.port !== '5500' && location.port !== '8080' && location.hostname &&
        location.pathname.indexOf('/dashboards') === -1) {
      // served from the API host → use a relative path
      return location.origin + '/api/v1';
    }
    return DEFAULT_BASE;
  }

  var state = {
    base: resolveBase(),
    token: safeGet('abcde_token'),
    locale: safeGet('abcde_locale') || 'en',
    user: parseJson(safeGet('abcde_user'))
  };

  function safeGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function safeSet(k, v) { try { v == null ? localStorage.removeItem(k) : localStorage.setItem(k, v); } catch (e) {} }
  function parseJson(s) { try { return s ? JSON.parse(s) : null; } catch (e) { return null; } }

  /* ---------- session ---------- */
  function setSession(token, user) {
    state.token = token; state.user = user || null;
    safeSet('abcde_token', token);
    safeSet('abcde_user', user ? JSON.stringify(user) : null);
  }
  function clearSession() {
    state.token = null; state.user = null;
    safeSet('abcde_token', null); safeSet('abcde_user', null);
  }
  function setLocale(l) { state.locale = l; safeSet('abcde_locale', l); }
  function setBase(b) { state.base = (b || '').replace(/\/+$/, '') || DEFAULT_BASE; safeSet('abcde_api_base', state.base); }

  /* ---------- error type ---------- */
  function ApiError(message, status, errors, payload) {
    this.name = 'ApiError';
    this.message = message || 'Request failed';
    this.status = status || 0;
    this.errors = errors || null;   // { field: [msg, ...] }
    this.payload = payload || null;
  }
  ApiError.prototype = Object.create(Error.prototype);

  // flatten Laravel validation errors into one readable line
  function firstError(errors, fallback) {
    if (!errors) return fallback;
    var keys = Object.keys(errors);
    if (!keys.length) return fallback;
    var v = errors[keys[0]];
    return Array.isArray(v) ? v[0] : String(v);
  }

  /* ---------- core request ---------- */
  // method, path (starts with /), body (object|FormData|null), opts:{full, query}
  function req(method, path, body, opts) {
    opts = opts || {};
    var url = state.base + path;
    if (opts.query) {
      var qs = Object.keys(opts.query)
        .filter(function (k) { return opts.query[k] != null && opts.query[k] !== ''; })
        .map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(opts.query[k]); })
        .join('&');
      if (qs) url += (url.indexOf('?') > -1 ? '&' : '?') + qs;
    }
    var headers = { 'Accept': 'application/json', 'X-Locale': state.locale };
    if (state.token) headers['Authorization'] = 'Bearer ' + state.token;

    var init = { method: method, headers: headers };
    if (body instanceof FormData) {
      init.body = body; // browser sets multipart boundary
    } else if (body != null) {
      headers['Content-Type'] = 'application/json';
      init.body = JSON.stringify(body);
    }

    return fetch(url, init).then(function (res) {
      return res.text().then(function (text) {
        var payload = null;
        try { payload = text ? JSON.parse(text) : null; } catch (e) { payload = null; }

        if (!res.ok) {
          if (res.status === 401 && state.token) {
            clearSession();
            if (typeof API.onUnauthorized === 'function') API.onUnauthorized();
          }
          var msg = (payload && (payload.message)) ||
                    firstError(payload && payload.errors, null) ||
                    (res.status === 403 ? 'You do not have access to this.' :
                     res.status === 404 ? 'Not found.' :
                     res.status >= 500 ? 'Server error — please try again.' :
                     'Request failed (' + res.status + ').');
          throw new ApiError(msg, res.status, payload && payload.errors, payload);
        }
        if (opts.full) return payload;
        return payload ? payload.data : null;
      });
    }, function (networkErr) {
      throw new ApiError(
        'Cannot reach the server. Is the API running at ' + state.base + '?',
        0, null, { network: String(networkErr) }
      );
    });
  }

  var get = function (p, o) { return req('GET', p, null, o); };
  var post = function (p, b, o) { return req('POST', p, b, o); };
  var put = function (p, b, o) { return req('PUT', p, b, o); };
  var patch = function (p, b, o) { return req('PATCH', p, b, o); };
  var del = function (p, o) { return req('DELETE', p, null, o); };

  // visit id in the routes is the ticket_no ("#ALM-20413"); encode the "#".
  function vt(ticket) { return encodeURIComponent(ticket); }

  /* ============================================================
     ENDPOINTS — grouped by SRS service (S1…S12)
     ============================================================ */
  var API = {
    // expose state + helpers
    base: function () { return state.base; },
    setBase: setBase,
    token: function () { return state.token; },
    user: function () { return state.user; },
    setSession: setSession,
    clearSession: clearSession,
    setLocale: setLocale,
    locale: function () { return state.locale; },
    isAuthed: function () { return !!state.token; },
    ApiError: ApiError,
    firstError: firstError,
    onUnauthorized: null,           // app.js assigns a handler
    health: function () { return get('/health', { full: true }); },

    /* -- S1 Identity & auth -- */
    auth: {
      login: function (identifier, password, device) {
        return post('/auth/login', { identifier: identifier, password: password, device_name: device || 'dashboard' })
          .then(function (data) { setSession(data.token, data.user); return data; });
      },
      loginQr: function (qr_token) {
        return post('/auth/login/qr', { qr_token: qr_token })
          .then(function (data) { setSession(data.token, data.user); return data; });
      },
      logout: function () { return post('/auth/logout').then(function (r) { clearSession(); return r; },
                                                              function (e) { clearSession(); throw e; }); },
      me: function () { return get('/auth/me'); }
    },

    /* -- S2 Public portal -- */
    pub: {
      hospital: function () { return get('/public/hospital'); },
      departments: function () { return get('/public/departments'); },
      doctors: function () { return get('/public/doctors'); },
      news: function () { return get('/public/news'); }
    },
    nav: {
      map: function () { return get('/nav/map'); },
      search: function (q) { return get('/nav/search', { query: { q: q } }); },
      route: function (from, to) { return get('/nav/route', { query: { from: from, to: to } }); }
    },

    /* -- Patients -- */
    patients: {
      list: function (params) { return get('/patients', { query: params || {} }); },
      get: function (serial) { return get('/patients/' + encodeURIComponent(serial)); },
      register: function (payload) { return post('/patients/register', payload); },
      updatePreferences: function (serial, payload) { return put('/patients/' + encodeURIComponent(serial) + '/preferences', payload); },
      issueCard: function (serial, card_type) { return post('/patients/' + encodeURIComponent(serial) + '/cards', { card_type: card_type || 'arrival' }); },
      issueQr: function (serial) { return post('/patients/' + encodeURIComponent(serial) + '/qr'); },
      accessibility: function (serial) { return get('/patients/' + encodeURIComponent(serial) + '/accessibility'); },
      updateAccessibility: function (serial, payload) { return put('/patients/' + encodeURIComponent(serial) + '/accessibility', payload); },
      file: function (serial) { return get('/patients/' + encodeURIComponent(serial) + '/file'); },
      carePoints: function (serial) { return get('/patients/' + encodeURIComponent(serial) + '/care-points'); }
    },

    /* -- S2 Appointments -- */
    appointments: {
      slots: function (params) { return get('/appointments/slots', { query: params || {} }); },
      create: function (payload) { return post('/appointments', payload); },
      list: function (params) { return get('/appointments', { query: params || {} }); },
      reschedule: function (id, scheduled_at) { return patch('/appointments/' + encodeURIComponent(id) + '/reschedule', { scheduled_at: scheduled_at }); },
      cancel: function (id) { return del('/appointments/' + encodeURIComponent(id)); },
      setStatus: function (id, payload) { return patch('/appointments/' + encodeURIComponent(id) + '/status', payload); },
      assign: function (id, assigned_doctor_id) { return post('/appointments/' + encodeURIComponent(id) + '/assign', { assigned_doctor_id: assigned_doctor_id }); }
    },

    /* -- S3 Visits & journey -- */
    visits: {
      create: function (payload) { return post('/visits', payload); },
      list: function (params) { return get('/visits', { query: params || {} }); },
      get: function (ticket) { return get('/visits/' + vt(ticket)); },
      triage: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/triage', payload); },
      advance: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/advance', payload); },
      cathType: function (ticket, type) { return post('/visits/' + vt(ticket) + '/cath-type', { catheterization_type: type }); },
      carePlan: function (ticket) { return get('/visits/' + vt(ticket) + '/care-plan'); },
      storeCarePlan: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/care-plan', payload); },
      consents: function (ticket, item) { return post('/visits/' + vt(ticket) + '/consents', { item: item }); },
      respondConsent: function (id, payload) { return post('/consents/' + encodeURIComponent(id) + '/respond', payload); },
      checklist: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/checklists', payload); },
      transport: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/transport', payload); },
      committee: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/committee', payload); },
      authorizeCommittee: function (id, payload) { return post('/committee/' + encodeURIComponent(id) + '/authorize', payload); }
    },

    /* -- S4 Vitals & early warning -- */
    vitals: {
      list: function (ticket) { return get('/visits/' + vt(ticket) + '/vitals'); },
      store: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/vitals', payload); },
      riskScore: function (ticket) { return get('/visits/' + vt(ticket) + '/risk-score'); },
      recompute: function (ticket) { return post('/visits/' + vt(ticket) + '/risk-score/recompute'); },
      vte: function (ticket, factors) { return post('/visits/' + vt(ticket) + '/vte', { factors: factors }); },
      thresholds: function (ticket, payload) { return put('/visits/' + vt(ticket) + '/thresholds', payload); }
    },

    /* -- S5 Medication, diagnostics & records -- */
    meds: {
      list: function (ticket) { return get('/visits/' + vt(ticket) + '/prescriptions'); },
      prescribe: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/prescriptions', payload); },
      administer: function (id, payload) { return post('/prescriptions/' + encodeURIComponent(id) + '/administer', payload); },
      reconciliation: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/reconciliation', payload); },
      pharmacy: function () { return get('/pharmacy/availability'); }
    },
    diagnostics: {
      orders: function (ticket) { return get('/visits/' + vt(ticket) + '/orders'); },
      storeOrder: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/orders', payload); },
      fileResult: function (id, payload) { return post('/orders/' + encodeURIComponent(id) + '/result', payload); },
      results: function (ticket) { return get('/visits/' + vt(ticket) + '/results'); },
      diagnosis: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/diagnosis', payload); },
      consultation: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/consultations', payload); }
    },

    /* -- S6 AI assistant & documentation -- */
    ai: {
      ask: function (payload) { return post('/assistant/ask', payload); },
      triage: function (payload) { return post('/assistant/triage', payload); },
      draft: function (payload) { return post('/documentation/draft', payload); },
      approve: function (draftId, payload) { return post('/documentation/' + encodeURIComponent(draftId) + '/approve', payload); },
      transcribe: function (payload) { return post('/documentation/transcribe', payload); },
      translate: function (payload) { return post('/documentation/translate', payload); }
    },

    /* -- S7 Emergency & notifications -- */
    emergency: {
      sos: function (payload) { return post('/emergency/sos', payload); },
      codeBlue: function (payload) { return post('/emergency/code-blue', payload); },
      active: function () { return get('/emergency/active'); },
      answer: function (id, payload) { return post('/emergency/' + encodeURIComponent(id) + '/answer', payload); },
      advance: function (id, payload) { return post('/emergency/' + encodeURIComponent(id) + '/advance', payload); },
      metrics: function () { return get('/emergency/metrics'); }
    },
    notifications: {
      list: function () { return get('/notifications'); },
      markRead: function (id) { return post('/notifications/' + encodeURIComponent(id) + '/read'); }
    },

    /* -- S8 Family & caregiver -- */
    family: {
      list: function (serial) { return get('/patients/' + encodeURIComponent(serial) + '/family'); },
      add: function (serial, payload) { return post('/patients/' + encodeURIComponent(serial) + '/family', payload); },
      accept: function (id) { return post('/family/' + encodeURIComponent(id) + '/accept'); },
      permissions: function (id, payload) { return patch('/family/' + encodeURIComponent(id) + '/permissions', payload); },
      remove: function (id) { return del('/family/' + encodeURIComponent(id)); }
    },

    /* -- S9 Billing & insurance -- */
    billing: {
      insurance: function (serial) { return get('/patients/' + encodeURIComponent(serial) + '/insurance'); },
      updateInsurance: function (serial, payload) { return patch('/patients/' + encodeURIComponent(serial) + '/insurance', payload); },
      committeeReview: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/billing/committee-review', payload); },
      financialFile: function (ticket) { return get('/visits/' + vt(ticket) + '/financial-file'); },
      pay: function (ticket, payload) { return post('/visits/' + vt(ticket) + '/payments', payload); }
    },

    /* -- S10 Feedback & quality -- */
    quality: {
      rateStage: function (stageId, payload) { return post('/stages/' + encodeURIComponent(stageId) + '/feedback', payload); },
      storeComplaint: function (payload) { return post('/complaints', payload); },
      complaints: function () { return get('/complaints'); },
      updateComplaint: function (no, payload) { return patch('/complaints/' + encodeURIComponent(no), payload); },
      feedback: function () { return get('/feedback'); },
      dashboard: function () { return get('/quality/dashboard'); }
    },

    /* -- S11 Education & loyalty -- */
    education: {
      videos: function () { return get('/education/videos'); },
      relax: function () { return get('/education/relax'); }
    },

    /* -- S12 Admin, reports, import -- */
    admin: {
      users: function () { return get('/admin/users'); },
      storeUser: function (payload) { return post('/admin/users', payload); },
      setRole: function (id, payload) { return patch('/admin/users/' + encodeURIComponent(id) + '/role', payload); },
      getPermissions: function () { return get('/admin/permissions'); },
      setPermissions: function (payload) { return put('/admin/permissions', payload); },
      audit: function () { return get('/admin/audit'); },
      integrations: function () { return get('/admin/integrations'); },
      aiModels: function () { return get('/admin/ai-models'); },
      importSeed: function (password) { return post('/admin/import/seed', { password: password || 'password' }); },
      importUpload: function (formData) { return post('/admin/import', formData); }
    },
    reports: {
      kpis: function () { return get('/reports/kpis'); },
      monthly: function () { return get('/reports/monthly'); }
    }
  };

  return API;
})();
