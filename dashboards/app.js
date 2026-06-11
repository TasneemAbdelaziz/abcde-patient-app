/* ============================================================
   A.B.C.D.E — Staff Dashboards · app.js
   The shell: login / role picker, the sidebar + topbar chrome,
   the router that delegates to each role module, and the
   language toggle (English first, Arabic/RTL ready).
   ============================================================ */

(function () {
  var I = UI.icon, esc = UI.esc;
  var DEMO_DATE = 'Monday · 8 June 2026';

  /* ---- small Arabic map for the chrome + nav (English-first, AR-ready) ---- */
  var AR = {
    'Reception': 'الاستقبال', 'Nursing': 'التمريض', 'Doctor': 'الطبيب',
    'Quality': 'الجودة', 'Administration': 'الإدارة', 'Emergency': 'الطوارئ', 'Family': 'العائلة',
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
    'Care team': 'فريق الرعاية', 'Learn': 'تعلّم'
  };
  function tn(label) { return window.STATE.lang === 'ar' && AR[label] ? AR[label] : label; }

  /* ---- role groups for the picker ---- */
  var ROLE_GROUPS = [
    { label: 'Clinical care', labelAr: 'الرعاية الإكلينيكية', roles: ['reception', 'nurse', 'doctor'] },
    { label: 'Oversight', labelAr: 'الإشراف', roles: ['quality', 'admin'] },
    { label: 'Response & access', labelAr: 'الاستجابة والوصول', roles: ['emergency', 'family'] }
  ];

  function roleCard(key) {
    var r = window.ROLES[key];
    return '<button class="role-card" onclick="App.enter(\'' + key + '\')">' +
      '<div class="rc-ic">' + I(r.icon) + '</div>' +
      '<div><div class="rc-name">' + esc(tn(r.label)) + '</div>' +
        '<div class="rc-person">' + esc(r.person) + '</div></div>' +
      '<div class="rc-desc">' + esc(r.desc) + '</div>' +
      '<div class="rc-go">' + esc(window.t('signin')) + ' ' + esc(tn(r.label)) + ' ' + I('arrowRight') + '</div>' +
    '</button>';
  }

  /* ============================================================
     LANDING PAGE — the hospital's public homepage
     ============================================================ */
  function renderLanding() {
    var ar = window.STATE.lang === 'ar';
    var P = window.PUBLIC, C = P.contact;
    var initials = function (n) { return n.replace(/^Dr\.?\s*/, '').split(' ').map(function (w) { return w[0]; }).slice(0, 2).join(''); };

    // hero visual — hospital photo with floating info cards
    var hero =
      '<div class="lp-visual">' +
        '<div class="lp-herophoto"><img src="../alamein-city.jpg" alt="Alamein Model Hospital" onerror="this.parentNode.classList.add(\'noimg\')"></div>' +
        '<div class="lp-float lp-float-a"><div class="lf-ic">' + I('ambulance') + '</div><div><div class="lf-t">' + (ar ? 'طوارئ ٢٤ ساعة' : '24/7 Emergency') + '</div><div class="lf-s">' + (ar ? 'استقبال وإنعاش' : 'Triage & resuscitation') + '</div></div></div>' +
        '<div class="lp-float lp-float-b"><div class="lf-ic" style="background:#e6f4ec;color:#2e7d4f">' + I('shield') + '</div><div><div class="lf-t">' + (ar ? 'اعتماد GAHAR' : 'GAHAR accredited') + '</div><div class="lf-s">' + (ar ? 'جودة وسلامة المرضى' : 'Quality & patient safety') + '</div></div></div>' +
      '</div>';

    var trust = [
      { ic: 'shield', v: 'GAHAR', s: ar ? 'معتمد' : 'accredited' },
      { ic: 'desk', v: '107', s: ar ? 'سرير' : 'beds' },
      { ic: 'surgery', v: '5', s: ar ? 'غرف عمليات' : 'operating rooms' },
      { ic: 'stethoscope', v: '20+', s: ar ? 'تخصص' : 'specialties' },
      { ic: 'clock', v: '2002', s: ar ? 'تأسست' : 'established' }
    ];
    var trustBar = '<div class="lp-trustbar">' + trust.map(function (t, i) {
      return (i ? '<div class="sep"></div>' : '') +
        '<div class="ti">' + I(t.ic) + '<b>' + esc(t.v) + '</b><span>' + esc(t.s) + '</span></div>';
    }).join('') + '</div>';

    // departments
    var depts = '<div id="departments" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'الأقسام' : 'Departments') + '</div>' +
        '<h2>' + (ar ? 'أقسامنا الطبية' : 'Our medical departments') + '</h2>' +
        '<p>' + (ar ? 'رعاية متخصصة عبر أكثر من عشرين تخصصاً.' : 'Specialist care across more than twenty specialties.') + '</p></div>' +
      '<div class="dept-grid">' + P.departments.map(function (d) {
        return '<div class="dept-card"><div class="dept-ic">' + I(d.icon) + '</div>' +
          '<div class="dept-name">' + esc(ar ? d.nameAr : d.name) + '</div>' +
          '<div class="dept-desc">' + esc(d.desc) + '</div></div>';
      }).join('') + '</div></div>';

    // services
    var svcs = '<div id="services" class="lp-section">' +
      '<div class="lp-section-h"><div class="lpk">' + (ar ? 'الخدمات' : 'Services') + '</div>' +
        '<h2>' + (ar ? 'خدمات على مدار الساعة' : 'Round-the-clock services') + '</h2>' +
        '<p>' + (ar ? 'مرافق حديثة تدعم رحلة المريض من البداية للنهاية.' : 'Modern facilities supporting the patient journey end to end.') + '</p></div>' +
      '<div class="svc-grid">' + P.services.map(function (s) {
        return '<div class="svc-card"><div class="svc-ic">' + I(s.icon) + '</div>' +
          '<div><div class="svc-name">' + esc(ar ? s.nameAr : s.name) + '</div>' +
          '<div class="svc-desc">' + esc(s.desc) + '</div></div></div>';
      }).join('') + '</div></div>';

    // smart & connected care (the technology, patient-facing)
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

    // doctors
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

    // about
    var about = '<div class="lp-about">' +
      '<div class="lp-about-txt"><div class="lpk">' + (ar ? 'عن المستشفى' : 'About the hospital') + '</div>' +
        '<h2>' + (ar ? 'مستشفى العلمين النموذجي' : 'Alamein Model Hospital') + '</h2>' +
        '<p>' + (ar
          ? 'صرح طبي حديث على ساحل البحر المتوسط يخدم مطروح والساحل الشمالي. تأسس عام ٢٠٠٢ وأصبح "مستشفى نموذجياً" عام ٢٠١٩، بـ١٠٧ أسرّة و٥ غرف عمليات وأكثر من ٢٠ تخصصاً.'
          : 'A modern medical campus on the Mediterranean serving Matrouh and the North Coast. Founded in 2002 and elevated to a “Model Hospital” in 2019 — 107 beds, 5 operating rooms, and 20+ specialties.') + '</p>' +
        '<a class="btn-line" style="background:rgba(255,255,255,.06);border-color:rgba(255,255,255,.2);color:#eaf2f0" href="#contact">' + I('pin') + (ar ? 'تواصل معنا' : 'Contact us') + '</a></div>' +
      '<div class="lp-about-photo"><img src="../alamein-city.jpg" alt="New Alamein City" onerror="this.style.display=\'none\'"></div>' +
    '</div>';

    // contact
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
              ? 'مستشفى العلمين النموذجي — رعاية محورها المريض من لحظة الوصول حتى العودة للمنزل، بقسطرة قلبية على مدار الساعة، وتصوير مدعوم بالذكاء الاصطناعي، وفريق متخصص.'
              : 'Alamein Model Hospital — patient-centered care from the moment you arrive until you’re home, with round-the-clock cardiac catheterization, AI-assisted imaging, and a specialist team.') + '</p>' +
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
     LOGIN / ROLE PICKER
     ============================================================ */
  var RT_ACCENT = {
    reception: ['#dbf3ef', '#0f766e'], nurse: ['#dbf3ef', '#0f766e'], doctor: ['#dbf3ef', '#0f766e'],
    quality: ['#fbf0dd', '#a96b1f'], admin: ['#e7e8fb', '#5b56c0'], emergency: ['#fbe6e6', '#b23a3a'], family: ['#e6f4ec', '#2e7d4f']
  };

  function renderLogin() {
    var ar = window.STATE.lang === 'ar';
    var order = ['reception', 'nurse', 'doctor', 'quality', 'admin', 'emergency', 'family'];
    var tiles = order.map(function (key) {
      var r = window.ROLES[key], a = RT_ACCENT[key] || ['#dbf3ef', '#0f766e'];
      return '<button class="role-tile" onclick="App.enter(\'' + key + '\')">' +
        '<div class="rt-ic" style="background:' + a[0] + ';color:' + a[1] + '">' + I(r.icon) + '</div>' +
        '<div class="rt-txt"><div class="rt-name">' + esc(tn(r.label)) + '</div>' +
          '<div class="rt-person">' + esc(r.person.split(' · ')[0]) + '</div></div>' +
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
            '<div class="lsb-point"><div class="lpi">' + I('activity') + '</div><div><b>' + (ar ? 'لحظي' : 'Real-time') + '</b><span>' + (ar ? 'علامات حيوية ورحلة وتنبيهات' : 'Vitals, journey & alerts live') + '</span></div></div>' +
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
          '<h1>' + (ar ? 'اختر مساحة عملك' : 'Choose your workspace') + '</h1>' +
          '<p class="ls-sub">' + (ar ? 'اختر دورك للمتابعة.' : 'Select your role to continue.') + '</p>' +
          '<div class="role-tiles">' + tiles + '</div>' +
          '<div class="ls-note">' + I('shield') + (ar ? 'نموذج أولي · الوصول محكوم حسب الدور (FR-1.7 / FR-1.8)' : 'Prototype · access gated per role (FR-1.7 / FR-1.8)') + '</div>' +
        '</main>' +
      '</div>';
  }

  /* ============================================================
     SHELL CHROME
     ============================================================ */
  function sidebarHTML(role) {
    var nav = role.nav.map(function (item) {
      var on = window.STATE.route === item.route;
      var n = typeof item.badge === 'function' ? item.badge() : 0;
      return '<a class="nav-item ' + (on ? 'on' : '') + '" onclick="App.go(\'' + item.route + '\')">' +
        I(item.icon) + '<span>' + esc(tn(item.label)) + '</span>' +
        (n ? '<span class="badge-n">' + n + '</span>' : '') +
      '</a>';
    }).join('');

    return '<div class="sb-brand"><img src="../logo.png" alt="" onerror="this.style.display=\'none\'">' +
        '<div><div class="sbb-t">A.B.C.D.E</div><div class="sbb-s">Dashboards</div></div></div>' +
      '<div class="sb-role"><div class="sr-ic">' + I(role.icon) + '</div>' +
        '<div><div class="sr-name">' + esc(tn(role.label)) + '</div><div class="sr-sub">' + esc(role.person) + '</div></div></div>' +
      '<div class="sb-section">' + (window.STATE.lang === 'ar' ? 'القائمة' : 'Menu') + '</div>' +
      nav +
      '<div class="sb-foot">Prototype · illustrative data<br>Alamein Model Hospital</div>';
  }

  function topbarHTML(role) {
    var staff = window.STAFF[window.STATE.role];
    return '<button class="nav-toggle" onclick="App.toggleNav()" aria-label="Menu">' + I('menu') + '</button>' +
      '<div class="search">' + I('search') +
        '<input type="text" placeholder="' + esc(window.t('search')) + '" oninput="App.search(this.value)" onkeydown="if(event.key===\'Enter\')App.searchGo()" id="globalSearch" /></div>' +
      '<div class="spacer"></div>' +
      '<span class="tb-date">' + esc(window.STATE.lang === 'ar' ? 'الإثنين · ٨ يونيو ٢٠٢٦' : DEMO_DATE) + '</span>' +
      '<button class="lang-toggle" onclick="App.toggleLang()">' + (window.STATE.lang === 'en' ? 'العربية' : 'EN') + '</button>' +
      '<button class="icon-btn" title="' + esc(window.t('notifications')) + '" onclick="UI.toast(\'No new notifications\')">' + I('bell') + '<span class="dot"></span></button>' +
      '<div class="tb-user"><div class="avatar">' + esc(staff.initials) + '</div>' +
        '<div><div class="tu-name">' + esc(staff.name) + '</div><div class="tu-role">' + esc(staff.role) + '</div></div></div>' +
      '<button class="icon-btn" title="' + esc(window.t('signout')) + '" onclick="App.signOut()">' + I('logout') + '</button>';
  }

  /* ============================================================
     RENDER + ROUTER
     ============================================================ */
  function render() {
    var role = window.ROLES[window.STATE.role];
    if (!role) return;
    document.getElementById('sidebar').innerHTML = sidebarHTML(role);
    document.getElementById('topbar').innerHTML = topbarHTML(role);
    var main = document.getElementById('main');
    main.innerHTML = role.render(window.STATE.route);
    main.scrollTop = 0;
  }
  window.render = render; // role modules call this after mutations

  function showScreen(which) {
    window.STATE.screen = which;
    document.getElementById('landing').classList.toggle('hidden', which !== 'landing');
    document.getElementById('login').classList.toggle('hidden', which !== 'login');
    document.getElementById('appRoot').classList.toggle('on', which === 'app');
    if (window.AI) window.AI.sync();
  }

  var App = {
    enter: function (roleKey) {
      window.STATE.role = roleKey;
      window.STATE.route = window.ROLES[roleKey].home;
      showScreen('app');
      render();
    },
    go: function (route) {
      window.STATE.route = route;
      App.closeNav();
      render();
    },
    toggleNav: function () { document.getElementById('appRoot').classList.toggle('nav-open'); },
    closeNav: function () { var a = document.getElementById('appRoot'); if (a) a.classList.remove('nav-open'); },
    showLogin: function () { renderLogin(); showScreen('login'); },
    showLanding: function () { window.STATE.role = null; renderLanding(); showScreen('landing'); },
    bookAppointment: function () {
      var ar = window.STATE.lang === 'ar';
      var opts = window.PUBLIC.departments.map(function (d) { return '<option>' + esc(ar ? d.nameAr : d.name) + '</option>'; }).join('');
      UI.modal({
        title: ar ? 'طلب موعد' : 'Request an appointment', icon: 'calendar',
        body:
          '<div class="field"><label>' + (ar ? 'الاسم' : 'Full name') + '</label><input id="ap-name" /></div>' +
          '<div class="field-row"><div class="field"><label>' + (ar ? 'الهاتف' : 'Phone') + '</label><input id="ap-phone" /></div>' +
          '<div class="field"><label>' + (ar ? 'القسم' : 'Department') + '</label><select id="ap-dept">' + opts + '</select></div></div>' +
          '<div class="field"><label>' + (ar ? 'الوقت المفضّل' : 'Preferred time') + '</label><input id="ap-time" type="datetime-local" /></div>' +
          '<p class="muted" style="font-size:12.5px">' + (ar ? 'سيتواصل معك الاستقبال لتأكيد الموعد (FR-2.5).' : 'Reception will contact you to confirm (FR-2.5).') + '</p>',
        foot:
          '<button class="btn btn-ghost" onclick="UI.closeModal()">' + (ar ? 'إلغاء' : 'Cancel') + '</button>' +
          '<button class="btn btn-primary" onclick="App.submitAppointment()">' + UI.icon('check') + (ar ? 'إرسال الطلب' : 'Submit request') + '</button>'
      });
    },
    submitAppointment: function () {
      var ar = window.STATE.lang === 'ar';
      var name = (document.getElementById('ap-name') || {}).value || '';
      if (!name.trim()) { UI.toast(ar ? 'من فضلك أدخل الاسم' : 'Please enter your name', 'warn'); return; }
      var dept = (document.getElementById('ap-dept') || {}).value || '';
      window.DB.appointments.push({ id: 'AP-' + (510 + window.DB.appointments.length), name: name, phone: (document.getElementById('ap-phone') || {}).value || '—', dept: dept, complaint: '—', pref: (document.getElementById('ap-time') || {}).value || '—', status: 'pending', source: 'Public website' });
      UI.closeModal();
      UI.toast(ar ? 'تم استلام طلبك — سيتواصل معك الاستقبال' : 'Request received — reception will be in touch', 'ok');
    },
    signOut: function () {
      window.STATE.role = null;
      renderLogin();
      showScreen('login');
    },
    toggleLang: function () {
      window.STATE.lang = window.STATE.lang === 'en' ? 'ar' : 'en';
      var dict = window.I18N[window.STATE.lang];
      document.documentElement.dir = dict.dir;
      document.documentElement.lang = window.STATE.lang;
      if (window.STATE.screen === 'app') render();
      else if (window.STATE.screen === 'login') renderLogin();
      else renderLanding();
      UI.toast(window.STATE.lang === 'ar' ? 'تم التبديل إلى العربية (RTL)' : 'Switched to English', 'ok');
    },
    search: function (val) { window._q = val; },
    searchGo: function () {
      var q = (window._q || '').trim().toLowerCase();
      if (!q) return;
      var hit = window.DB.patients.find(function (p) {
        return p.name.toLowerCase().indexOf(q) > -1 || p.serial.toLowerCase().indexOf(q) > -1 || (p.nationalId || '').indexOf(q) > -1;
      });
      if (hit) {
        window.STATE.selectedSerial = hit.serial;
        // jump to the most relevant screen for the current role
        var dest = { reception: 'queue', nurse: 'vitals', doctor: 'file' }[window.STATE.role];
        window.STATE.route = dest;
        render();
        UI.toast('Opened ' + hit.name, 'ok');
      } else {
        UI.toast('No patient matches “' + q + '”', 'warn');
      }
    }
  };
  window.App = App;

  /* ---- boot ---- */
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') UI.closeModal();
  });
  window.STATE.screen = 'landing';
  // deep-link: #doctor / #nurse / … opens that dashboard directly (handy on mobile)
  var hash = (typeof location !== 'undefined' && location.hash ? location.hash.replace('#', '') : '');
  if (window.ROLES[hash]) { App.enter(hash); } else { renderLanding(); }
})();
