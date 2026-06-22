/* ============================================================
   A.B.C.D.E — Staff Dashboards · app.js
   The shell: landing page, REAL authentication against the
   Laravel API (/auth/login + /auth/me), the sidebar + topbar
   chrome, an async router that fetches each screen's data before
   rendering, live notifications, and the language toggle.
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;

  /* ---- small Arabic map for the chrome + nav (English-first, AR-ready) ---- */
  var AR = {
    'Reception': 'الاستقبال', 'Nursing': 'التمريض', 'Doctor': 'الطبيب',
    'Quality': 'الجودة', 'Administration': 'الإدارة', 'Director': 'الإدارة العليا', 'Emergency': 'الطوارئ', 'Family': 'العائلة',
    'Front desk': 'مكتب الاستقبال', 'New registration': 'تسجيل جديد', 'Patient queue': 'قائمة المرضى',
    'Appointments': 'المواعيد', 'Billing': 'الحسابات',
    'Ward overview': 'نظرة عامة على القسم', 'Triage': 'الفرز', 'Record vitals': 'تسجيل العلامات الحيوية',
    'Medications (MAR)': 'سجل الأدوية', 'Risk & RSTP': 'درجة الخطورة',
    'My worklist': 'قائمة عملي', 'Patient file': 'الملف الطبي', 'Diagnosis': 'التشخيص',
    'Orders & results': 'الطلبات والنتائج', 'Prescriptions': 'الوصفات', 'Journey': 'الرحلة',
    'Quality overview': 'نظرة الجودة', 'Stage feedback': 'تقييم المراحل', 'Complaints': 'الشكاوى', 'Reports': 'التقارير',
    'KPIs': 'المؤشرات', 'Users & roles': 'المستخدمون والصلاحيات', 'Integration': 'الربط',
    'Live board': 'اللوحة الحية', 'Escalation rules': 'قواعد التصعيد',
    'AI Console': 'مساعد الذكاء', 'AI models': 'نماذج الذكاء', 'Audit trail': 'سجل التدقيق',
    'Status': 'الحالة', 'Updates': 'التحديثات', 'Permissions': 'الصلاحيات',
    'Orders': 'الطلبات', 'Results': 'النتائج', 'Handover (SBAR)': 'التسليم', 'Committee': 'اللجنة',
    'Departments': 'الأقسام', 'Critical watch': 'الحالات الحرجة', 'Metrics': 'المقاييس',
    'Care team': 'فريق الرعاية', 'Learn': 'تعلّم', 'Overview': 'نظرة عامة', 'Medications': 'الأدوية',
    'Worklist': 'قائمة العمل', 'Care journey': 'رحلة الرعاية'
  };
  function tn(label) { return window.t ? window.t(label) : label; }
  window.tn = tn;
  function dirOf(code) { for (var i = 0; i < window.LANGS.length; i++) if (window.LANGS[i].code === code) return window.LANGS[i].dir; return 'ltr'; }
  function applyI18n(el) { if (el && window.i18nApply) window.i18nApply(el); }

  /* ---- demo accounts for one-click sign-in (password: "password") ---- */
  var DEMO = {
    reception: { id: 'o.lotfy@alamein.example',  name: 'Omar Lotfy' },
    nurse:     { id: 'f.sayed@alamein.example',  name: 'Fatma El-Sayed' },
    doctor:    { id: 'k.adel@alamein.example',   name: 'Dr. Karim Adel' },
    quality:   { id: 'h.mansour@alamein.example', name: 'Hala Mansour' },
    admin:     { id: 'admin@alamein.example',    name: 'System Admin' },
    director:  { id: 'a.zaki@alamein.example',   name: 'Dr. Ahmed Zaki' },
    emergency: { id: 'k.sami@alamein.example',   name: 'Khaled Sami' },
    family:    { id: '010-0000-0003',            name: 'Mariam Al-Rashid' }
  };

  /* ============================================================
     LANDING PAGE — the hospital's public homepage
     ============================================================ */
  function renderLanding() {
    var ar = window.STATE.lang === 'ar';
    var P = window.PUBLIC, C = P.contact;
    var initials = function (n) { return n.replace(/^Dr\.?\s*/, '').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join(''); };

    var hero =
      '<div class="lp-visual">' +
        '<div class="lp-herophoto"><img src="../alamein-city.jpg" alt="Alamein Model Hospital" onerror="this.parentNode.classList.add(\'noimg\')"></div>' +
        '<div class="lp-float lp-float-a"><div class="lf-ic">' + I('ambulance') + '</div><div><div class="lf-t">' + (ar ? 'طوارئ ٢٤ ساعة' : '24/7 Emergency') + '</div><div class="lf-s">' + (ar ? 'استقبال وإنعاش' : 'Triage & resuscitation') + '</div></div></div>' +
        '<div class="lp-float lp-float-b"><div class="lf-ic" style="background:#e6f4ec;color:#2e7d4f">' + I('shield') + '</div><div><div class="lf-t">' + (ar ? 'اعتماد GAHAR' : 'GAHAR accredited') + '</div><div class="lf-s">' + (ar ? 'جودة وسلامة المرضى' : 'Quality & patient safety') + '</div></div></div>' +
      '</div>';

    var trust = [
      { ic: 'shield', v: 'GAHAR', s: ar ? 'معتمد' : 'accredited' },
      { ic: 'desk', v: '180', s: ar ? 'سرير' : 'beds' },
      { ic: 'surgery', v: '2', s: ar ? 'معامل قسطرة' : 'cath labs' },
      { ic: 'stethoscope', v: '20+', s: ar ? 'تخصص' : 'specialties' },
      { ic: 'clock', v: '2002', s: ar ? 'تأسست' : 'established' }
    ];
    var trustBar = '<div class="lp-trustbar">' + trust.map(function (t, i) {
      return (i ? '<div class="sep"></div>' : '') +
        '<div class="ti">' + I(t.ic) + '<b>' + esc(t.v) + '</b><span>' + esc(t.s) + '</span></div>';
    }).join('') + '</div>';

    var depts = '<div id="departments" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'الأقسام' : 'Departments') + '</div>' +
        '<h2>' + (ar ? 'أقسامنا الطبية' : 'Our medical departments') + '</h2>' +
        '<p>' + (ar ? 'رعاية متخصصة عبر أكثر من عشرين تخصصاً.' : 'Specialist care across more than twenty specialties.') + '</p></div>' +
      '<div class="dept-grid">' + P.departments.map(function (d) {
        return '<div class="dept-card"><div class="dept-ic">' + I(d.icon) + '</div>' +
          '<div class="dept-name">' + esc(ar ? d.nameAr : d.name) + '</div>' +
          '<div class="dept-desc">' + esc(d.desc) + '</div></div>';
      }).join('') + '</div></div>';

    var svcs = '<div id="services" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'الخدمات' : 'Services') + '</div>' +
        '<h2>' + (ar ? 'خدمات على مدار الساعة' : 'Round-the-clock services') + '</h2>' +
        '<p>' + (ar ? 'مرافق حديثة تدعم رحلة المريض من البداية للنهاية.' : 'Modern facilities supporting the patient journey end to end.') + '</p></div>' +
      '<div class="svc-grid">' + P.services.map(function (s) {
        return '<div class="svc-card"><div class="svc-ic">' + I(s.icon) + '</div>' +
          '<div><div class="svc-name">' + esc(ar ? s.nameAr : s.name) + '</div>' +
          '<div class="svc-desc">' + esc(s.desc) + '</div></div></div>';
      }).join('') + '</div></div>';

    var smart = '<div class="lp-smart">' +
      '<div class="lp-smart-txt"><div class="lpk">' + (ar ? 'رعاية ذكية ومترابطة' : 'Smart & connected care') + '</div>' +
        '<h2>' + (ar ? 'تقنية تخدم المريض' : 'Technology that serves the patient') + '</h2>' +
        '<p>' + (ar ? 'تصوير مدعوم بالذكاء الاصطناعي، تطبيق يتابع زيارتك خطوة بخطوة مع مستشار ذكي، ورعاية ثنائية اللغة وميسّرة للجميع.' : 'AI-assisted imaging, an app that tracks your visit step by step with a smart advisor, and bilingual, accessible care for everyone.') + '</p>' +
        '<a class="btn-cta" href="../index.html">' + I('heart') + (ar ? 'حمّل تطبيق المريض' : 'Get the patient app') + '</a></div>' +
      '<div class="lp-smart-points">' +
        '<div class="sp"><div class="sp-ic">' + I('scan') + '</div><div><b>' + (ar ? 'تصوير بالذكاء الاصطناعي' : 'AI imaging') + '</b><span>' + (ar ? 'رنين وأشعة مقطعية أدق' : 'MRI & CT, more precise') + '</span></div></div>' +
        '<div class="sp"><div class="sp-ic">' + I('route') + '</div><div><b>' + (ar ? 'تتبّع الرحلة' : 'Track your journey') + '</b><span>' + (ar ? 'من الوصول للمنزل' : 'Arrival to home') + '</span></div></div>' +
        '<div class="sp"><div class="sp-ic">' + I('sparkle') + '</div><div><b>' + (ar ? 'مستشار ذكي' : 'Smart advisor') + '</b><span>' + (ar ? 'إجابات من محتوى معتمد' : 'From approved content') + '</span></div></div>' +
        '<div class="sp"><div class="sp-ic">' + I('globe') + '</div><div><b>' + (ar ? 'لغتان وإتاحة' : 'Bilingual & accessible') + '</b><span>' + (ar ? 'عربي/إنجليزي' : 'Arabic / English') + '</span></div></div>' +
      '</div></div>';

    var docs = '<div id="doctors" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'الأطباء' : 'Our doctors') + '</div>' +
        '<h2>' + (ar ? 'نخبة من الاستشاريين' : 'Meet our consultants') + '</h2>' +
        '<p>' + (ar ? 'فريق طبي متخصص في خدمتك.' : 'A specialist medical team at your service.') + '</p></div>' +
      '<div class="doc-grid">' + P.doctors.map(function (d) {
        return '<div class="doc-card"><div class="doc-av ' + (d.sex === 'F' ? 'f' : '') + '">' + esc(initials(d.name)) + '</div>' +
          '<div class="doc-name">' + esc(d.name) + '</div>' +
          '<div class="doc-spec">' + esc(ar ? d.specAr : d.spec) + '</div>' +
          '<button class="doc-book" onclick="App.bookAppointment()">' + I('calendar') + (ar ? 'احجز' : 'Book') + '</button></div>';
      }).join('') + '</div></div>';

    var about = '<div class="lp-about">' +
      '<div class="lp-about-txt"><div class="lpk">' + (ar ? 'عن المستشفى' : 'About the hospital') + '</div>' +
        '<h2>' + (ar ? 'مستشفى العلمين النموذجي' : 'Alamein Model Hospital') + '</h2>' +
        '<p>' + (ar
          ? 'صرح طبي حديث على ساحل البحر المتوسط يخدم مطروح والساحل الشمالي. تأسس عام ٢٠٠٢ وأصبح "مستشفى نموذجياً" عام ٢٠١٩.'
          : 'A modern medical campus on the Mediterranean serving Matrouh and the North Coast. Founded in 2002 and elevated to a “Model Hospital” in 2019 — 180 beds, 2 cath labs, and 20+ specialties.') + '</p>' +
        '<a class="btn-line" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:#eaf2f0" href="#contact">' + I('pin') + (ar ? 'تواصل معنا' : 'Contact us') + '</a></div>' +
      '<div class="lp-about-photo"><img src="../alamein-city.jpg" alt="New Alamein City" onerror="this.style.display=\'none\'"></div>' +
    '</div>';

    var contact = '<div id="contact" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'تواصل' : 'Contact') + '</div>' +
        '<h2>' + (ar ? 'تواصل معنا' : 'Get in touch') + '</h2></div>' +
      '<div class="contact-grid">' +
        '<div class="contact-card emerg"><div class="cc-ic">' + I('ambulance') + '</div><div class="cc-l">' + (ar ? 'الطوارئ' : 'Emergency') + '</div><div class="cc-v">' + esc(C.emergency) + '</div><div class="cc-s">' + (ar ? 'متاح ٢٤ ساعة' : 'Available 24/7') + '</div></div>' +
        '<div class="contact-card"><div class="cc-ic">' + I('phone') + '</div><div class="cc-l">' + (ar ? 'الهاتف' : 'Phone') + '</div><div class="cc-v sm">' + esc(C.phone) + '</div><div class="cc-s">' + esc(C.hours) + '</div></div>' +
        '<div class="contact-card"><div class="cc-ic">' + I('pin') + '</div><div class="cc-l">' + (ar ? 'العنوان' : 'Address') + '</div><div class="cc-v sm">' + esc(ar ? C.addressAr : C.address) + '</div><div class="cc-s">' + esc(C.email) + '</div></div>' +
      '</div></div>';

    document.getElementById('landing').innerHTML =
      '<div class="lp-wrap">' +
        '<nav class="lp-nav">' +
          '<div class="lpn-brand"><img src="../logo.png" alt="" onerror="this.style.display=\'none\'">' +
            '<div><div class="lpn-t">A . B . C . D . E</div><div class="lpn-s">' + esc(ar ? window.HOSPITAL.nameAr : window.HOSPITAL.name) + '</div></div></div>' +
          '<div class="spacer"></div>' +
          '<a class="lpn-link lpn-hide" href="#departments">' + (ar ? 'الأقسام' : 'Departments') + '</a>' +
          '<a class="lpn-link lpn-hide" href="#services">' + (ar ? 'الخدمات' : 'Services') + '</a>' +
          '<a class="lpn-link lpn-hide" href="#doctors">' + (ar ? 'الأطباء' : 'Doctors') + '</a>' +
          '<a class="lpn-link lpn-hide" href="#contact">' + (ar ? 'تواصل' : 'Contact') + '</a>' +
          '<button class="lpn-link" onclick="App.toggleLang()">' + (ar ? 'EN' : 'العربية') + '</button>' +
          '<button class="btn-cta" onclick="App.showLogin()">' + I('logout') + (ar ? 'دخول الطاقم' : 'Staff sign in') + '</button>' +
        '</nav>' +

        '<header class="lp-hero">' +
          '<div>' +
            '<div class="lph-eyebrow"><span class="dotp"></span>' + (ar ? 'مدينة العلمين الجديدة · الساحل الشمالي' : 'New Alamein City · North Coast') + '</div>' +
            '<h1>' + (ar ? 'رعاية عالمية المستوى،<br><em>قريبة منك</em>.' : 'World-class care,<br><em>close to home</em>.') + '</h1>' +
            '<p class="lph-lead">' + (ar
              ? 'مستشفى العلمين النموذجي — رعاية محورها المريض من لحظة الوصول حتى العودة للمنزل.'
              : 'Alamein Model Hospital — patient-centered care from the moment you arrive until you’re home, with round-the-clock cardiac catheterization and a specialist team.') + '</p>' +
            '<div class="lph-cta">' +
              '<button class="btn-cta" onclick="App.bookAppointment()">' + I('calendar') + (ar ? 'احجز موعداً' : 'Book an appointment') + '</button>' +
              '<a class="btn-line" href="#doctors">' + I('stethoscope') + (ar ? 'ابحث عن طبيب' : 'Find a doctor') + '</a>' +
            '</div>' +
            '<div class="lp-emerg"><span class="le-dot"></span>' + (ar ? 'للطوارئ اتصل' : 'For emergencies call') + ' <b>' + esc(C.emergency) + '</b> · ' + (ar ? 'مفتوح ٢٤ ساعة' : 'open 24/7') + '</div>' +
          '</div>' +
          hero +
        '</header>' +

        trustBar + depts + svcs + smart + docs + about + contact +

        '<div class="lp-foot">' +
          '<span>© 2026 ' + esc(window.HOSPITAL.name) + ' · ' + esc(window.HOSPITAL.nameAr) + '</span>' +
          '<span>' + (ar ? 'بوابة الطاقم' : 'Staff portal') + ' · <a href="#" onclick="App.showLogin();return false">' + (ar ? 'تسجيل الدخول' : 'Sign in') + '</a> · <a href="../index.html">' + (ar ? 'تطبيق المريض' : 'Patient app') + '</a></span>' +
        '</div>' +
      '</div>';
  }

  /* ============================================================
     LOGIN — real authentication against /auth/login
     ============================================================ */
  var RT_ACCENT = {
    reception: ['#dbf3ef', '#0f766e'], nurse: ['#dbf3ef', '#0f766e'], doctor: ['#dbf3ef', '#0f766e'],
    quality: ['#fbf0dd', '#a96b1f'], admin: ['#e7e8fb', '#5b56c0'], director: ['#e7e8fb', '#5b56c0'],
    emergency: ['#fbe6e6', '#b23a3a'], family: ['#e6f4ec', '#2e7d4f']
  };

  function renderLogin() {
    var ar = window.STATE.lang === 'ar';
    var order = ['reception', 'nurse', 'doctor', 'quality', 'admin', 'director', 'emergency', 'family'];
    var tiles = order.map(function (key) {
      var r = window.ROLES[key]; if (!r) return '';
      var a = RT_ACCENT[key] || ['#dbf3ef', '#0f766e'];
      return '<button class="role-tile" onclick="App.quickLogin(\'' + key + '\')" id="qt-' + key + '">' +
        '<div class="rt-ic" style="background:' + a[0] + ';color:' + a[1] + '">' + I(r.icon) + '</div>' +
        '<div class="rt-txt"><div class="rt-name">' + esc(tn(r.label)) + '</div>' +
          '<div class="rt-person">' + esc((DEMO[key] && DEMO[key].name) || r.person) + '</div></div>' +
        '<div class="rt-go">' + I('arrowRight') + '</div>' +
      '</button>';
    }).join('');

    document.getElementById('login').innerHTML =
      '<div class="login-card">' +
        '<aside class="ls-brand">' +
          '<div class="lsb-logo"><img src="../logo.png" alt="" onerror="this.style.display=\'none\'">' +
            '<div><div class="lsl-t">A . B . C . D . E</div><div class="lsl-s">' + (ar ? 'بوابة الطاقم' : 'Staff Portal') + '</div></div></div>' +
          '<h2>' + (ar ? 'منصّة واحدة،<br><em>لكل دور</em>.' : 'One platform,<br><em>every role</em>.') + '</h2>' +
          '<p class="lsb-lead">' + (ar ? 'سجّل الدخول إلى مساحة عملك في نظام A.B.C.D.E بمستشفى العلمين النموذجي.' : 'Sign in to your workspace in the A.B.C.D.E system at Alamein Model Hospital.') + '</p>' +
          '<div class="lsb-points">' +
            '<div class="lsb-point"><div class="lpi">' + I('shield') + '</div><div><b>' + (ar ? 'وصول حسب الدور' : 'Role-based access') + '</b><span>' + (ar ? 'كل فريق يرى ما يخصه فقط' : 'Each team sees only its own data') + '</span></div></div>' +
            '<div class="lsb-point"><div class="lpi">' + I('activity') + '</div><div><b>' + (ar ? 'لحظي' : 'Real-time') + '</b><span>' + (ar ? 'بيانات حية من الخادم' : 'Live data from the API') + '</span></div></div>' +
            '<div class="lsb-point"><div class="lpi">' + I('globe') + '</div><div><b>' + (ar ? 'لغتان' : 'Bilingual') + '</b><span>' + (ar ? 'عربي وإنجليزي' : 'Arabic & English') + '</span></div></div>' +
          '</div>' +
          '<div class="lsb-foot">' + (ar ? 'سري — للفرق المعنية فقط.' : 'Confidential — for the named teams only.') + '<br>' + esc(window.HOSPITAL.name) + '</div>' +
        '</aside>' +

        '<main class="ls-main">' +
          '<div class="ls-top">' +
            '<a class="ls-back" href="#" onclick="App.showLanding();return false">' + I('arrowRight') + (ar ? 'الرئيسية' : 'Back to homepage') + '</a>' +
            '<button class="ls-langbtn" onclick="App.toggleLang()">' + (ar ? 'EN' : 'العربية') + '</button>' +
          '</div>' +
          '<div class="ls-eyebrow">' + (ar ? 'دخول الطاقم' : 'Staff sign-in') + '</div>' +
          '<h1>' + (ar ? 'تسجيل الدخول' : 'Sign in to continue') + '</h1>' +
          '<p class="ls-sub">' + (ar ? 'أدخل بيانات الدخول، أو اختر دوراً للدخول التجريبي السريع.' : 'Enter your credentials, or pick a role for quick demo access.') + '</p>' +

          '<form class="auth-form" onsubmit="App.doLogin(event)">' +
            '<div class="field"><label>' + (ar ? 'البريد / الهاتف / الرقم القومي' : 'Email · phone · national ID') + '</label>' +
              '<input id="lg-id" autocomplete="username" placeholder="' + (ar ? 'مثال: k.adel@alamein.example' : 'e.g. k.adel@alamein.example') + '" /></div>' +
            '<div class="field"><label>' + (ar ? 'كلمة المرور' : 'Password') + '</label>' +
              '<input id="lg-pw" type="password" autocomplete="current-password" placeholder="••••••••" value="password" /></div>' +
            '<div id="lg-err" class="login-error" style="display:none"></div>' +
            '<button class="btn btn-primary btn-block" id="lg-btn" type="submit">' + I('logout') + (ar ? 'تسجيل الدخول' : 'Sign in') + '</button>' +
          '</form>' +

          '<div class="q-divider"><span>' + (ar ? 'أو دخول سريع بدور' : 'or quick sign-in by role') + '</span></div>' +
          '<div class="role-tiles">' + tiles + '</div>' +
          '<div class="ls-note">' + I('shield') + (ar ? 'بيانات حية · الوصول محكوم حسب الدور (FR-1.7 / FR-1.8)' : 'Live data · access gated per role (FR-1.7 / FR-1.8)') + '</div>' +
        '</main>' +
      '</div>';
    applyI18n(document.getElementById('login'));
  }

  function loginError(msg) {
    var el = document.getElementById('lg-err');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  }

  /* ============================================================
     SHELL CHROME
     ============================================================ */
  function sidebarHTML(role) {
    var nav = role.nav.map(function (item) {
      var on = window.STATE.route === item.route;
      var n = 0; try { n = typeof item.badge === 'function' ? (item.badge() || 0) : 0; } catch (e) {}
      return '<a class="nav-item ' + (on ? 'on' : '') + '" onclick="App.go(\'' + item.route + '\')">' +
        I(item.icon) + '<span>' + esc(tn(item.label)) + '</span>' +
        (n ? '<span class="badge-n">' + n + '</span>' : '') +
      '</a>';
    }).join('');

    return '<div class="sb-brand"><img src="../logo.png" alt="" onerror="this.style.display=\'none\'">' +
        '<div><div class="sbb-t">A.B.C.D.E</div><div class="sbb-s">Dashboards</div></div></div>' +
      '<div class="sb-role"><div class="sr-ic">' + I(role.icon) + '</div>' +
        '<div><div class="sr-name">' + esc(tn(role.label)) + '</div><div class="sr-sub">' + esc(currentUserName()) + '</div></div></div>' +
      '<div class="sb-section">' + (window.STATE.lang === 'ar' ? 'القائمة' : 'Menu') + '</div>' +
      nav +
      '<div class="sb-foot">' + (window.STATE.lang === 'ar' ? 'بيانات حية من الخادم' : 'Live data · ' + API.base().replace(/^https?:\/\//, '')) + '<br>Alamein Model Hospital</div>';
  }

  function currentUserName() {
    var m = STORE.me() || API.user() || {};
    return m.name || (window.ROLES[window.STATE.role] && window.ROLES[window.STATE.role].person) || 'Staff';
  }

  function topbarHTML(role) {
    var name = currentUserName();
    var roleLabel = role.label;
    var n = window.STATE.notifCount || 0;
    return '<button class="nav-toggle" onclick="App.toggleNav()" aria-label="Menu">' + I('menu') + '</button>' +
      '<div class="search">' + I('search') +
        '<input type="text" placeholder="' + esc(window.t('Search patients…')) + '" oninput="App.search(this.value)" onkeydown="if(event.key===\'Enter\')App.searchGo()" id="globalSearch" /></div>' +
      '<div class="spacer"></div>' +
      '<button class="icon-btn" title="' + esc(window.t('Refresh')) + '" onclick="App.refresh()">' + I('route') + '</button>' +
      '<button class="icon-btn" title="' + esc(window.t('Theme')) + '" onclick="App.toggleTheme()">' + I('shield') + '</button>' +
      langSelect() +
      '<button class="icon-btn notif-btn" title="' + esc(window.t('Notifications')) + '" onclick="App.toggleNotif(event)">' + I('bell') +
        (n ? '<span class="dot"></span>' : '') + '</button>' +
      '<div class="tb-user"><div class="avatar">' + esc(STORE.initials(name)) + '</div>' +
        '<div><div class="tu-name">' + esc(name) + '</div><div class="tu-role">' + esc(tn(roleLabel)) + '</div></div></div>' +
      '<button class="icon-btn" title="' + esc(window.t('Sign out')) + '" onclick="App.signOut()">' + I('logout') + '</button>';
  }

  function langSelect() {
    var cur = window.STATE.lang || 'en';
    var opts = window.LANGS.map(function (l) {
      return '<option value="' + l.code + '"' + (l.code === cur ? ' selected' : '') + '>' + l.native + '</option>';
    }).join('');
    return '<select class="lang-select" aria-label="Language" onchange="App.setLang(this.value)">' + opts + '</select>';
  }

  /* ============================================================
     RENDER + ASYNC ROUTER
     ============================================================ */
  function render() {
    var role = window.ROLES[window.STATE.role];
    if (!role) return;
    document.getElementById('sidebar').innerHTML = sidebarHTML(role);
    document.getElementById('topbar').innerHTML = topbarHTML(role);
    var main = document.getElementById('main');
    try {
      main.innerHTML = role.render(window.STATE.route);
    } catch (e) {
      main.innerHTML = errorPanel(e);
    }
    main.scrollTop = 0;
    applyI18n(document.getElementById('appRoot'));
    if (UI.enhanceTables) UI.enhanceTables(main);
  }
  window.render = render;

  function loadingPanel() {
    return '<div class="loading-wrap">' +
      '<div class="spinner"></div>' +
      '<div class="loading-txt">' + esc(window.t('Loading…')) + '</div>' +
    '</div>';
  }
  function errorPanel(e) {
    var msg = (e && e.message) || 'Something went wrong.';
    return '<div class="error-panel"><div class="ep-ic">' + I('alert') + '</div>' +
      '<h3>' + esc(window.t('Could not load this screen')) + '</h3>' +
      '<p>' + esc(msg) + '</p>' +
      '<button class="btn btn-primary" onclick="App.refresh()">' + I('route') + esc(window.t('Retry')) + '</button></div>';
  }

  function showScreen(which) {
    window.STATE.screen = which;
    document.getElementById('landing').classList.toggle('hidden', which !== 'landing');
    document.getElementById('login').classList.toggle('hidden', which !== 'login');
    document.getElementById('appRoot').classList.toggle('on', which === 'app');
    if (window.AI) window.AI.sync();
  }

  // run a role screen's async loader (if any), then render
  function navigate(route) {
    var role = window.ROLES[window.STATE.role];
    if (!role) return Promise.resolve();
    window.STATE.route = route;
    // chrome first (so sidebar highlights immediately), then a loading body
    document.getElementById('sidebar').innerHTML = sidebarHTML(role);
    document.getElementById('topbar').innerHTML = topbarHTML(role);
    var main = document.getElementById('main');
    main.innerHTML = loadingPanel();
    main.scrollTop = 0;

    var loader = role.load ? Promise.resolve().then(function () { return role.load(route); }) : Promise.resolve();
    return loader.then(function () {
      render();
    }, function (e) {
      document.getElementById('main').innerHTML = errorPanel(e);
      if (e && e.message) UI.toast(e.message, 'err');
    });
  }

  var App = {
    /* ---- entering a dashboard once authenticated ---- */
    enter: function (roleKey) {
      var role = window.ROLES[roleKey];
      if (!role) {
        UI.toast('No dashboard for the "' + roleKey + '" role.', 'warn');
        App.signOut();
        return;
      }
      window.STATE.role = roleKey;
      showScreen('app');
      App.loadNotifications();
      navigate(role.home);
    },

    go: function (route) { App.closeNav(); navigate(route); },
    refresh: function () { navigate(window.STATE.route); App.loadNotifications(); },

    toggleNav: function () { document.getElementById('appRoot').classList.toggle('nav-open'); },
    closeNav: function () { var a = document.getElementById('appRoot'); if (a) a.classList.remove('nav-open'); },
    showLogin: function () { renderLogin(); showScreen('login'); },
    showLanding: function () { window.STATE.role = null; renderLanding(); showScreen('landing'); },

    /* ---- AUTH ---- */
    doLogin: function (ev) {
      if (ev) ev.preventDefault();
      var id = (document.getElementById('lg-id') || {}).value || '';
      var pw = (document.getElementById('lg-pw') || {}).value || '';
      if (!id.trim()) { loginError(window.STATE.lang === 'ar' ? 'أدخل بيانات الدخول' : 'Enter your identifier'); return; }
      var btn = document.getElementById('lg-btn');
      if (btn) { btn.disabled = true; btn.classList.add('loading'); }
      App._authenticate(id.trim(), pw).catch(function (e) {
        loginError(e.message || 'Sign-in failed');
        if (btn) { btn.disabled = false; btn.classList.remove('loading'); }
      });
    },
    quickLogin: function (roleKey) {
      var acct = DEMO[roleKey];
      if (!acct) return;
      var tile = document.getElementById('qt-' + roleKey);
      if (tile) tile.classList.add('loading');
      App._authenticate(acct.id, 'password').catch(function (e) {
        if (tile) tile.classList.remove('loading');
        UI.toast(e.message || 'Sign-in failed', 'err');
      });
    },
    _authenticate: function (identifier, password) {
      return API.auth.login(identifier, password).then(function () {
        return API.auth.me();
      }).then(function (meData) {
        STORE.setMe(meData);
        var roleKey = meData.role;
        if (roleKey === 'director' && !window.ROLES.director && window.ROLES.admin) roleKey = 'admin';
        if (!window.ROLES[roleKey]) {
          throw new API.ApiError('The "' + roleKey + '" role has no web dashboard (use the patient app).', 0);
        }
        UI.toast((window.STATE.lang === 'ar' ? 'مرحباً ' : 'Welcome, ') + meData.name, 'ok');
        App.enter(roleKey);
      });
    },
    signOut: function () {
      API.auth.logout().catch(function () {});
      STORE.setMe(null);
      window.STATE.role = null; window.STATE.selectedSerial = null; window.STATE.selectedTicket = null;
      renderLogin();
      showScreen('login');
    },

    /* ---- notifications ---- */
    loadNotifications: function () {
      if (!API.isAuthed()) return;
      API.notifications.list().then(function (data) {
        window.STATE.notif = data;
        window.STATE.notifCount = (data && data.unread) || 0;
        var btn = document.querySelector('.notif-btn .dot');
        var hasBtn = document.querySelector('.notif-btn');
        if (hasBtn && window.STATE.screen === 'app') {
          document.getElementById('topbar').innerHTML = topbarHTML(window.ROLES[window.STATE.role]);
        }
      }).catch(function () {});
    },
    toggleNotif: function (ev) {
      if (ev) ev.stopPropagation();
      var existing = document.getElementById('notifPop');
      if (existing) { existing.remove(); return; }
      var data = window.STATE.notif || { items: [], unread: 0 };
      var items = (data.items || []);
      var ar = window.STATE.lang === 'ar';
      var list = items.length ? items.map(function (it) {
        var title = it.title || it.message || it.body || it.type || 'Notification';
        var when = it.created_at || it.sent_at || it.at;
        var unread = !it.read_at && !it.is_read;
        return '<div class="np-item ' + (unread ? 'unread' : '') + '"' + (it.id ? ' onclick="App.readNotif(\'' + it.id + '\')"' : '') + '>' +
          '<div class="np-dot"></div><div><div class="np-title">' + esc(title) + '</div>' +
          '<div class="np-time">' + esc(when ? STORE.ago(when) : '') + '</div></div></div>';
      }).join('') : '<div class="np-empty">' + (ar ? 'لا إشعارات جديدة' : 'No notifications') + '</div>';
      var pop = document.createElement('div');
      pop.id = 'notifPop'; pop.className = 'notif-pop';
      pop.innerHTML = '<div class="np-head">' + (ar ? 'الإشعارات' : 'Notifications') +
        (data.unread ? '<span class="badge gold">' + data.unread + '</span>' : '') + '</div>' +
        '<div class="np-list">' + list + '</div>';
      pop.onclick = function (e) { e.stopPropagation(); };
      document.body.appendChild(pop);
      applyI18n(pop);
      setTimeout(function () { document.addEventListener('click', App._closeNotif); }, 0);
    },
    _closeNotif: function () {
      var p = document.getElementById('notifPop'); if (p) p.remove();
      document.removeEventListener('click', App._closeNotif);
    },
    readNotif: function (id) {
      API.notifications.markRead(id).then(function () { App.loadNotifications(); App._closeNotif(); }).catch(function () {});
    },

    /* ---- public appointment booking (landing) ---- */
    bookAppointment: function () {
      var ar = window.STATE.lang === 'ar';
      STORE.departments().then(function (depts) {
        var bookable = (depts || []).filter(function (d) { return d.accepts_bookings; });
        var opts = bookable.map(function (d) { return '<option value="' + esc(d.dept_code) + '">' + esc(d.department_name) + '</option>'; }).join('');
        UI.modal({
          title: ar ? 'طلب موعد' : 'Request an appointment', icon: 'calendar',
          body:
            '<div class="field"><label>' + (ar ? 'الاسم' : 'Full name') + '</label><input id="ap-name" /></div>' +
            '<div class="field-row"><div class="field"><label>' + (ar ? 'الهاتف' : 'Phone') + '</label><input id="ap-phone" /></div>' +
            '<div class="field"><label>' + (ar ? 'القسم' : 'Department') + '</label><select id="ap-dept">' + opts + '</select></div></div>' +
            '<div class="field"><label>' + (ar ? 'الشكوى' : 'Reason / complaint') + '</label><input id="ap-complaint" /></div>' +
            '<p class="muted" style="font-size:12.5px">' + (ar ? 'سيتواصل معك الاستقبال لتأكيد الموعد (FR-2.5).' : 'Reception will contact you to confirm (FR-2.5).') + '</p>',
          foot:
            '<button class="btn btn-ghost" onclick="UI.closeModal()">' + (ar ? 'إلغاء' : 'Cancel') + '</button>' +
            '<button class="btn btn-primary" onclick="App.submitAppointment()">' + UI.icon('check') + (ar ? 'إرسال الطلب' : 'Submit request') + '</button>'
        });
      }).catch(function (e) { UI.toast(e.message, 'err'); });
    },
    submitAppointment: function () {
      var ar = window.STATE.lang === 'ar';
      var name = (document.getElementById('ap-name') || {}).value || '';
      if (!name.trim()) { UI.toast(ar ? 'من فضلك أدخل الاسم' : 'Please enter your name', 'warn'); return; }
      var payload = {
        dept_code: (document.getElementById('ap-dept') || {}).value || '',
        complaint: (document.getElementById('ap-complaint') || {}).value || 'General consultation',
        guest_name: name.trim(),
        guest_phone: (document.getElementById('ap-phone') || {}).value || '—'
      };
      API.appointments.create(payload).then(function () {
        UI.closeModal();
        UI.toast(ar ? 'تم استلام طلبك — سيتواصل معك الاستقبال' : 'Request received — reception will be in touch', 'ok');
      }).catch(function (e) { UI.toast(e.message, 'err'); });
    },

    /* ---- language (4 languages) ---- */
    setLang: function (code) {
      if (!code) return;
      window.STATE.lang = code;
      API.setLocale(code);
      document.documentElement.dir = dirOf(code);
      document.documentElement.lang = code;
      if (window.STATE.screen === 'app') navigate(window.STATE.route);
      else if (window.STATE.screen === 'login') { renderLogin(); applyI18n(document.getElementById('login')); }
      else renderLanding();
      var l = window.LANGS.filter(function (x) { return x.code === code; })[0];
      UI.toast((l ? l.native : code) + (dirOf(code) === 'rtl' ? ' · RTL' : ''), 'ok');
    },
    toggleLang: function () {
      var codes = window.LANGS.map(function (l) { return l.code; });
      var i = codes.indexOf(window.STATE.lang || 'en');
      App.setLang(codes[(i + 1) % codes.length]);
    },

    /* ---- theme (light / dark) ---- */
    setTheme: function (theme) {
      window.STATE.theme = theme;
      document.documentElement.setAttribute('data-theme', theme);
      try { localStorage.setItem('abcde_theme', theme); } catch (e) {}
    },
    toggleTheme: function () {
      App.setTheme((window.STATE.theme === 'dark') ? 'light' : 'dark');
    },

    /* ---- global patient search ---- */
    search: function (val) { window._q = val; },
    searchGo: function () {
      var q = (window._q || '').trim();
      if (!q) return;
      API.patients.list({ q: q, per_page: 1 }).then(function (res) {
        var items = (res && res.items) || [];
        if (items.length) {
          var hit = STORE.patient(items[0]);
          window.STATE.selectedSerial = hit.serial;
          var dest = { reception: 'queue', nurse: 'ward', doctor: 'worklist' }[window.STATE.role] || window.ROLES[window.STATE.role].home;
          navigate(dest);
          UI.toast('Opened ' + hit.name, 'ok');
        } else {
          UI.toast('No patient matches “' + q + '”', 'warn');
        }
      }).catch(function (e) { UI.toast(e.message, 'err'); });
    },

    /* ---- boot / resume ---- */
    boot: function () {
      // resume an existing session if a token is stored
      if (API.isAuthed()) {
        showScreen('app');
        document.getElementById('main').innerHTML = loadingPanel();
        API.auth.me().then(function (meData) {
          STORE.setMe(meData);
          var roleKey = meData.role;
          if (!window.ROLES[roleKey] && roleKey === 'director' && window.ROLES.admin) roleKey = 'admin';
          if (window.ROLES[roleKey]) { App.enter(roleKey); }
          else { App.signOut(); }
        }).catch(function () { API.clearSession(); renderLanding(); showScreen('landing'); });
        return;
      }
      var hash = (typeof location !== 'undefined' && location.hash ? location.hash.replace('#', '') : '');
      if (hash === 'login') { renderLogin(); showScreen('login'); }
      else { renderLanding(); showScreen('landing'); }
    }
  };
  window.App = App;

  // when the API forces a logout (401), bounce to the login screen
  API.onUnauthorized = function () {
    STORE.setMe(null);
    UI.toast(window.STATE.lang === 'ar' ? 'انتهت الجلسة — سجّل الدخول مجدداً' : 'Session expired — please sign in again', 'warn');
    renderLogin(); showScreen('login');
  };

  /* ---- boot ---- */
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') UI.closeModal(); });
  // sync stored locale + theme into the UI on first paint
  window.STATE.lang = API.locale() || window.STATE.lang || 'en';
  document.documentElement.dir = dirOf(window.STATE.lang);
  document.documentElement.lang = window.STATE.lang;
  try { App.setTheme(localStorage.getItem('abcde_theme') || 'light'); } catch (e) { App.setTheme('light'); }
  App.boot();
})();
