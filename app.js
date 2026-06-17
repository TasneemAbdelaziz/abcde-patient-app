/* ---------- intro ---------- */
  var slide=0;
  var SLIDE_COUNT=2;
  function introNext(){
    if(slide < SLIDE_COUNT-1){
      document.getElementById('slide-'+slide).classList.remove('on');
      slide++;
      document.getElementById('slide-'+slide).classList.add('on');
      document.querySelectorAll('#introdots i').forEach(function(d,i){d.classList.toggle('on',i===slide);});
      if(slide === SLIDE_COUNT-1) document.getElementById('introNext').textContent='Get Started';
    } else {
      skipIntro();
    }
  }
  function skipIntro(){
    document.getElementById('intro').classList.add('gone');
    document.getElementById('login').classList.add('on');
    document.getElementById('statusbar').classList.add('light');
  }
  function enterApp(){
    document.getElementById('login').classList.remove('on');
    document.getElementById('statusbar').classList.remove('light');
    go('home');
    setTimeout(function(){ openSheet('ratenudge','Diagnosis'); },900);
  }
  var guestMode=false;

  function enterGuest(){
    // Step 1: brief "loading the browser" transition
    var phone = document.querySelector('.phone .screen');
    phone.innerHTML =
      '<div class="redirect-screen">'+
        '<div class="redirect-logo"><img src="logo.png" alt="Alamein Model Hospital"></div>'+
        '<div class="redirect-spin"></div>'+
        '<div class="redirect-title">Opening website</div>'+
        '<div class="redirect-sub">Loading\u2026</div>'+
      '</div>';
    // Step 2: after a short delay, render the in-phone "browser" with a placeholder hospital site
    setTimeout(function(){ renderHospitalSite(phone); }, 1100);
  }

  function renderHospitalSite(phone){
    phone.innerHTML =
      // mobile status bar (dark text on white)
      '<div class="statusbar" id="statusbar">'+
        '<span>9:41</span>'+
        '<span class="dots">'+
          '<span class="sig"><i></i><i></i><i></i></span>'+
          '<span style="font-size:11px">5G</span>'+
          '<span class="batt"><i></i></span>'+
        '</span>'+
      '</div>'+
      // browser chrome (URL bar)
      '<div class="browser-bar">'+
        '<button class="bb-btn" onclick="exitWebsite()" aria-label="Back">'+
          '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7"/></svg>'+
        '</button>'+
        '<div class="bb-url">'+
          '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg>'+
          '<span>alamein-hospital.com</span>'+
        '</div>'+
        '<button class="bb-btn" onclick="exitWebsite()" aria-label="Close">'+
          '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2.2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg>'+
        '</button>'+
      '</div>'+
      // website body
      '<div class="site-body">'+
        // hero with city photo + logo
        '<div class="site-hero">'+
          '<img src="alamein-city.jpg" class="site-hero-bg" alt="">'+
          '<div class="site-hero-overlay"></div>'+
          '<div class="site-hero-inner">'+
            '<div class="site-logo"><img src="logo.png" alt="Alamein Model Hospital"></div>'+
            '<h1 class="site-h1">Alamein Model Hospital</h1>'+
            '<p class="site-tagline">Caring for the people and visitors of the North Coast</p>'+
            '<button class="site-cta" onclick="exitWebsite()">Book an Appointment</button>'+
          '</div>'+
        '</div>'+
        // nav strip
        '<div class="site-nav">'+
          '<button>About</button><button>Departments</button><button>Doctors</button><button>Contact</button>'+
        '</div>'+
        // about section
        '<section class="site-sec">'+
          '<div class="site-eyebrow">About the Hospital</div>'+
          '<h2 class="site-h2">A modern medical landmark on Egypt\u2019s North Coast</h2>'+
          '<p class="site-p">Founded in 2002 and elevated to a "Model Hospital" in 2019, we serve Matrouh Governorate and visitors of New Alamein City under the Secretariat of Specialized Medical Centers.</p>'+
          '<div class="site-stats">'+
            '<div class="site-stat"><div class="ss-n">107</div><div class="ss-l">Beds</div></div>'+
            '<div class="site-stat"><div class="ss-n">5</div><div class="ss-l">Operating Rooms</div></div>'+
            '<div class="site-stat"><div class="ss-n">20+</div><div class="ss-l">Specialties</div></div>'+
            '<div class="site-stat"><div class="ss-n">24/7</div><div class="ss-l">Emergency</div></div>'+
          '</div>'+
        '</section>'+
        // departments grid
        '<section class="site-sec site-sec-grey">'+
          '<div class="site-eyebrow">Our Specialties</div>'+
          '<h2 class="site-h2">Departments</h2>'+
          '<div class="dept-grid">'+
            deptCard('\u2764\uFE0F','Cardiology','Catheterization &amp; cardiac care')+
            deptCard('\uD83E\uDDE0','Neurosurgery','Brain &amp; nervous system')+
            deptCard('\uD83D\uDC76','Pediatrics','Care for children')+
            deptCard('\uD83D\uDC69','Gynecology','Women\u2019s health')+
            deptCard('\uD83D\uDC41\uFE0F','Ophthalmology','Eye care &amp; surgery')+
            deptCard('\uD83E\uDDB4','Orthopedics','Bones &amp; joints')+
          '</div>'+
        '</section>'+
        // contact
        '<section class="site-sec">'+
          '<div class="site-eyebrow">Get in Touch</div>'+
          '<h2 class="site-h2">Contact us</h2>'+
          '<div class="site-contact"><div class="sc-row"><div class="sc-ic">\uD83D\uDCCD</div><div class="sc-tx">K107 Alexandria\u2013Matrouh Road</div></div>'+
          '<div class="sc-row"><div class="sc-ic">\u260E\uFE0F</div><div class="sc-tx">046 410 0212</div></div>'+
          '<div class="sc-row"><div class="sc-ic">\u2709\uFE0F</div><div class="sc-tx">alameenmodelhospital@gmail.com</div></div></div>'+
        '</section>'+
        // footer
        '<footer class="site-footer">'+
          '<div class="site-foot-logo"><img src="logo.png" alt=""></div>'+
          '<div class="site-foot-tx">&copy; Alamein Model Hospital. Placeholder website \u2014 the full site will be built and connected here.</div>'+
          '<button class="site-back" onclick="exitWebsite()">\u2190 Back to App</button>'+
        '</footer>'+
      '</div>';
    phone.scrollTop = 0;
  }

  function deptCard(emoji, name, desc){
    return '<div class="dept-card">'+
      '<div class="dept-emoji">'+emoji+'</div>'+
      '<div class="dept-n">'+name+'</div>'+
      '<div class="dept-d">'+desc+'</div>'+
    '</div>';
  }

  function exitWebsite(){
    // Reload the prototype so the user returns to the intro/login screens.
    window.location.reload();
  }

  /* ---------- navigation ---------- */
  function go(p){
    if(guestMode && (p==='journey'||p==='alerts'||p==='family'||p==='visits')){
      openSheet('guestblock'); return;
    }
    document.querySelectorAll('.page').forEach(el=>el.classList.remove('on'));
    document.getElementById('page-'+p).classList.add('on');
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    var tab=document.getElementById('tab-'+p);
    if(tab) tab.classList.add('on');
    document.getElementById('view').scrollTop=0;
  }

  /* Open Care page on a specific section (meds / appts / reports) */
  function goCare(which){
    if(guestMode){ openSheet('guestblock'); return; }
    go('care');
    // hide all care sections, show only the requested one
    var sections={meds:'care-meds',appts:'care-appts',reports:'care-reports'};
    Object.values(sections).forEach(function(id){
      var el=document.getElementById(id); if(el) el.style.display='none';
    });
    var target=document.getElementById(sections[which]);
    if(target) target.style.display='block';
    // update header
    var titles={meds:'Medication',appts:'Appointments',reports:'Reports'};
    var subs={meds:'Care Plan',appts:'Bookings',reports:'Records'};
    var t=document.getElementById('careTitle'); if(t) t.textContent=titles[which]||'Care';
    var e=document.getElementById('careEyebrow'); if(e) e.textContent=subs[which]||'Care';
  }

  /* Direct emergency alert — no intermediate screen */
  function alertDoctor(){
    showToast('Alerting your care team…');
    setTimeout(function(){ openSheet('sosdone'); },650);
  }

  /* ---------- Journey: active vs completed ----------
     The Journey page is reused for any visit. We snapshot the original ACTIVE
     journey HTML on first load, then either restore it (for the active visit)
     or render a fully-completed timeline (for past visits). */
  var _journeyActiveSnapshot=null;
  var _journeyActiveHeader=null;

  function _captureActiveJourney(){
    if(_journeyActiveSnapshot!==null) return;
    var t=document.getElementById('jTrack');
    if(t) _journeyActiveSnapshot=t.innerHTML;
    _journeyActiveHeader={
      eyebrow:document.getElementById('jEyebrow').textContent,
      title:document.getElementById('jTitle').textContent,
      sub:document.getElementById('jSub').textContent
    };
  }

  function showActiveJourney(){
    _captureActiveJourney();
    if(_journeyActiveSnapshot===null) return;
    document.getElementById('jEyebrow').textContent=_journeyActiveHeader.eyebrow;
    document.getElementById('jTitle').textContent=_journeyActiveHeader.title;
    document.getElementById('jSub').textContent=_journeyActiveHeader.sub;
    document.getElementById('jTrack').innerHTML=_journeyActiveSnapshot;
    var note=document.getElementById('jNote');
    if(note) note.style.display='block';
  }

  function openCompletedJourney(visitNo,visitDate,visitDx,visitDr,rating){
    _captureActiveJourney(); // ensure we can restore later

    // Build stage list based on visit type
    var stages;
    if(/cardiac\s*check/i.test(visitDx)){
      // 5-stage routine check-up
      stages=[
        {nm:'Arrival & Registration', meta:'Reception desk'},
        {nm:'Vitals & Initial Assessment', meta:'Nurse station'},
        {nm:'Consultation', meta:visitDr},
        {nm:'ECG & Tests', meta:'Cardiology lab'},
        {nm:'Summary & Discharge', meta:'Outpatient clinic'}
      ];
    } else {
      // 8-stage default (e.g., hypertension follow-up)
      stages=[
        {nm:'Arrival & Registration', meta:'Reception desk'},
        {nm:'Triage Assessment', meta:'Emergency nurse'},
        {nm:'Diagnosis', meta:'Lab & imaging'},
        {nm:'Treatment Plan', meta:visitDr},
        {nm:'Procedure / Intervention', meta:'Procedure room'},
        {nm:'Recovery & Monitoring', meta:'Ward'},
        {nm:'Discharge Planning', meta:'Care coordinator'},
        {nm:'Home Follow-up', meta:'Completed at home'}
      ];
    }

    // Render — all done, no upcoming
    var html='';
    for(var i=0;i<stages.length;i++){
      html+=
        '<div class="step done">'+
          '<div class="dot">\u2713</div>'+
          '<div class="body">'+
            '<div class="nm">'+stages[i].nm+'</div>'+
            '<div class="meta">'+stages[i].meta+'</div>'+
            '<button class="rate-btn done">'+
              '<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg>'+
              ' Rated '+rating+
            '</button>'+
          '</div>'+
        '</div>';
    }

    // Update header
    document.getElementById('jEyebrow').textContent='Visit Ticket \u00B7 #'+visitNo;
    document.getElementById('jTitle').textContent=visitDx;
    document.getElementById('jSub').textContent=visitDr+' \u00B7 '+visitDate;
    document.getElementById('jTrack').innerHTML=html;
    var note=document.getElementById('jNote');
    if(note) note.style.display='none';

    go('journey');
  }

  function segCare(btn,which){
    btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('care-meds').style.display=which==='meds'?'block':'none';
    document.getElementById('care-appts').style.display=which==='appts'?'block':'none';
    document.getElementById('care-reports').style.display=which==='reports'?'block':'none';
  }
  function segRep(btn,which){
    btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('rep-health').style.display=which==='health'?'block':'none';
    document.getElementById('rep-fin').style.display=which==='fin'?'block':'none';
  }
  function segLearn(btn,which){
    btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
    document.getElementById('learn-edu').style.display=which==='edu'?'block':'none';
    document.getElementById('learn-fun').style.display=which==='fun'?'block':'none';
  }

  /* ---------- toast ---------- */
  var toastT;
  function showToast(msg){
    var t=document.getElementById('toast');
    t.textContent=msg; t.classList.add('show');
    clearTimeout(toastT);
    toastT=setTimeout(function(){t.classList.remove('show');},2200);
  }

  /* ---------- advisor ---------- */
  var answers={
    'What can I eat?':'For now, a low-salt, low-fat diet is recommended. The hospital kitchen has prepared meals that fit your plan. Your dietitian will give you a full guide before discharge.',
    'When can I walk?':'Light supervised walking usually starts within a day of the procedure. A nurse will accompany you for your first short walk — check your Care goals for today.',
    'Is my pain normal?':'Mild soreness near the catheter site is common. If you feel chest pain, shortness of breath, or heavy bleeding, use the Emergency button immediately or tell your nurse.',
    'Talk to a nurse':'Connecting you to the nursing station now — a member of the care team will respond shortly. You can also use the Message Care Team option under Care.'
  };

  /* keyword-based smart reply for free-text questions */
  function smartReply(text){
    var t=text.toLowerCase();
    // urgent / red-flag keywords
    if(/\b(chest pain|can'?t breathe|cannot breathe|shortness of breath|bleeding|dizzy|faint|unconscious|emergency|stroke|heart attack)\b/.test(t)){
      return '⚠️ These symptoms can be serious. I am notifying the care team now — please stay calm and seated. If symptoms worsen, use the Alert Doctor button on the home screen immediately.';
    }
    // medication
    if(/\b(medic|medicine|drug|pill|dose|dosage|aspirin|atorvastatin|clopidogrel|when to take)\b/.test(t)){
      return 'Your current medications are listed in Treatment Plan on the home screen. You have Aspirin 81 mg after breakfast, Atorvastatin 40 mg in the evening, and Clopidogrel 75 mg in the morning. Never change your doses without checking with Dr. Amira Fouad.';
    }
    // food / diet
    if(/\b(eat|food|diet|drink|coffee|tea|salt|sugar|fat|fruit|water)\b/.test(t)){
      return 'For your recovery, the hospital recommends a low-salt, low-fat diet with plenty of water and fresh fruits. The kitchen has prepared your meals according to your care plan. Avoid caffeine for the first 48 hours after your procedure.';
    }
    // pain / discomfort
    if(/\b(pain|hurt|sore|ache|discomfort|tight)\b/.test(t)){
      return 'Mild soreness around the catheter site is normal. If the pain becomes sharp, sudden, or moves to your chest or arm, please tell your nurse right away or use the Alert Doctor button.';
    }
    // sleep / rest
    if(/\b(sleep|tired|rest|insomnia|awake|nap)\b/.test(t)){
      return 'Rest is one of the most important parts of your recovery. Try to sleep on your back for the first 24 hours. If you have trouble sleeping, let the nurse know — they can help you find a comfortable position.';
    }
    // walking / exercise / movement
    if(/\b(walk|exercise|move|stand|sit|gym|activity|workout)\b/.test(t)){
      return 'Light supervised walking begins within a day of your procedure. Avoid lifting anything heavy or vigorous exercise for at least one week. The nurse will guide your first short walk today.';
    }
    // discharge / home / leave
    if(/\b(discharge|home|leave|go home|when can i leave)\b/.test(t)){
      return 'Discharge is typically planned 24–48 hours after a successful catheterization, depending on how you respond. Dr. Amira Fouad will assess you tomorrow morning and discuss the plan with you.';
    }
    // appointment / follow-up
    if(/\b(appointment|follow.?up|visit|schedule|book)\b/.test(t)){
      return 'Your next cardiology follow-up is in 7 days with Dr. Amira Fouad, and your echocardiogram is in 14 days. You can see and reschedule them from the Reserve Appointment tile on the home screen.';
    }
    // family / visitor
    if(/\b(family|visitor|wife|husband|son|daughter|relative)\b/.test(t)){
      return 'You can manage who follows your care from the Family tab. Visiting hours in your ward are 2–4 PM and 7–8 PM. Mahmoud (your son) is already linked to your account.';
    }
    // anxiety / fear / worry
    if(/\b(worried|anxious|scared|afraid|nervous|stress|panic)\b/.test(t)){
      return 'It is completely normal to feel anxious after a cardiac procedure. Your team is here for you 24/7. Would you like me to connect you with the hospital chaplain or a counsellor? You can also explore the calm content in the Entertainment tile.';
    }
    // procedure / what happened
    if(/\b(procedure|catheter|surgery|operation|what happened|what did)\b/.test(t)){
      return 'You had a coronary catheterization — a minimally invasive procedure that opened a narrowed artery in your heart. Blood flow has been restored. There is a short video explaining it under Treatment Plan if you want to learn more.';
    }
    // greetings
    if(/\b(hi|hello|hey|good morning|good evening|salam|asalam)\b/.test(t)){
      return 'Hello Ahmed. How are you feeling today? You can ask me about your condition, medication, recovery, or daily care.';
    }
    // thank you
    if(/\b(thank|thanks|shokran)\b/.test(t)){
      return 'You are very welcome. I am here whenever you need me. Please remember — I am here to help, but for any clinical decision, always check with your doctor or nurse.';
    }
    // doctor / nurse contact
    if(/\b(doctor|nurse|call|contact|talk to)\b/.test(t)){
      return 'I can connect you with the nursing station right away — they typically respond within minutes. Or for urgent matters, use the Alert Doctor button on the home screen.';
    }
    // fallback
    return 'That is a good question. While I can share general guidance, I would recommend asking Dr. Amira Fouad or one of the nurses for a specific answer about your case. Would you like me to relay your question to the care team?';
  }

  function postUserMessage(text){
    var box=document.getElementById('chatbox');
    var me=document.createElement('div'); me.className='bub me'; me.textContent=text; box.appendChild(me);
    var load=document.createElement('div'); load.className='bub ai';
    load.innerHTML='<span class="dotload"><i></i><i></i><i></i></span>';
    box.appendChild(load);
    document.getElementById('view').scrollTop=99999;
    var delay=600+Math.random()*700;
    setTimeout(function(){
      load.textContent=answers[text]||smartReply(text);
      document.getElementById('view').scrollTop=99999;
    },delay);
  }

  function askChip(btn){
    postUserMessage(btn.textContent);
  }

  function sendChat(){
    var input=document.getElementById('chatInput');
    var text=input.value.trim();
    if(!text) return;
    input.value='';
    postUserMessage(text);
  }

  /* ---------- modal ---------- */
  function openSheet(type,arg){
    var s=document.getElementById('sheet');
    s.innerHTML='<div class="grip"></div>'+buildSheet(type,arg);
    document.getElementById('modal').classList.add('on');
  }
  function closeSheet(){document.getElementById('modal').classList.remove('on');}

  var chosen=0;
  function setStars(n){
    chosen=n;
    document.querySelectorAll('#sheet .star').forEach(function(st,i){st.classList.toggle('lit',i<n);});
  }

  function buildSheet(type,arg){
    if(type==='ratenudge'){
      return '<div style="width:54px;height:54px;border-radius:50%;background:rgba(224,164,88,.18);margin:6px auto 12px;display:flex;align-items:center;justify-content:center">'+
        '<svg fill="none" stroke="#b07d2e" stroke-width="2" viewBox="0 0 24 24" style="width:26px;height:26px"><path stroke-linecap="round" stroke-linejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.196-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118L2.05 9.801c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"/></svg></div>'+
        '<h2 style="text-align:center">How was your '+arg+'?</h2>'+
        '<div class="shsub" style="text-align:center">You just completed this stage. A quick rating helps the hospital improve.</div>'+
        '<button class="btn-primary" style="margin-top:4px" onclick="openSheet(\'rate\',\''+arg+'\')">Rate Now</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Later</button>';
    }
    if(type==='rate'){
      return '<h2>Rate: '+arg+'</h2>'+
        '<div class="shsub">Your feedback helps us improve care at every step.</div>'+
        '<div class="stars">'+[1,2,3,4,5].map(function(n){
          return '<div class="star" onclick="setStars('+n+')"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
        }).join('')+'</div>'+
        '<textarea placeholder="Add a comment (optional)…"></textarea>'+
        '<button class="btn-primary" onclick="submitRate(\''+(arg||'')+'\')">Submit Rating</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Maybe later</button>';
    }
    if(type==='done'){
      return '<div class="check-anim"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>'+
        '<h2 style="text-align:center">Thank you</h2>'+
        '<div class="shsub" style="text-align:center">Your rating was recorded and added to the hospital quality report. You earned <b style="color:#0f766e">+20 Care Points</b>.</div>'+
        '<button class="btn-primary" onclick="closeSheet()">Done</button>';
    }
    if(type==='sos'){
      return '<h2 style="color:#c0392b">Emergency Help</h2>'+
        '<div class="shsub">This sends an immediate alert. It will reach the following, in order:</div>'+
        '<div class="escal">'+
          '<div class="e"><span class="num">1</span><span class="et">Treating Physician</span><span class="es">Dr. Amira Fouad</span></div>'+
          '<div class="e"><span class="num">2</span><span class="et">Nursing Station</span><span class="es">CCU</span></div>'+
          '<div class="e"><span class="num">3</span><span class="et">Family Contact</span><span class="es">Linked caregiver</span></div>'+
          '<div class="e"><span class="num">4</span><span class="et">Care Center</span><span class="es">Rapid response</span></div>'+
        '</div>'+
        '<button class="sos" onclick="openSheet(\'sosdone\')" style="margin-top:14px"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z"/></svg> Send Emergency Alert</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='sosdone'){
      return '<div class="check-anim" style="background:#e25555"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>'+
        '<h2 style="text-align:center">Alert Sent</h2>'+
        '<div class="shsub" style="text-align:center">Your care team has been notified and is on the way. Stay calm and remain where you are.</div>'+
        '<button class="btn-primary" onclick="closeSheet()">OK</button>';
    }
    if(type==='video'){
      return '<h2>Understanding Your Procedure</h2>'+
        '<div class="shsub">A short explainer prepared by the cardiology team.</div>'+
        '<div style="height:170px;border-radius:16px;background:linear-gradient(135deg,#134e4a,#0d9488);display:flex;align-items:center;justify-content:center;margin-bottom:8px">'+
          '<div class="play" style="width:54px;height:54px"><svg fill="currentColor" viewBox="0 0 24 24" style="width:22px;height:22px;color:#0f766e;margin-left:3px"><path d="M8 5v14l11-7z"/></svg></div></div>'+
        '<div class="shsub">Prototype — video playback is not connected in this mockup.</div>'+
        '<button class="btn-primary" onclick="closeSheet()">Close</button>';
    }
    if(type==='issue'){
      return '<h2>Report an Issue</h2>'+
        '<div class="shsub">Linked to your current stage: Recovery & Monitoring.</div>'+
        '<textarea placeholder="Describe the problem you experienced…" style="height:96px"></textarea>'+
        '<button class="btn-primary" onclick="openSheet(\'genericdone\',\'Issue Submitted|Ticket #ISS-2049 was created and routed to the unit supervisor.\')">Submit Issue</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='appt'){
      return '<h2>Cardiology Follow-up</h2><div class="shsub">Appointment details</div>'+
        '<div class="card" style="margin-bottom:6px"><div class="row-item" style="border:none;padding:6px 0"><div class="rt"><div class="a">Dr. Amira Fouad</div><div class="b">Cardiology Clinic · Room 4</div></div></div>'+
        '<div class="row-item" style="border:none;padding:6px 0"><div class="rt"><div class="a">In 7 days · 11:00 AM</div><div class="b">15-minute slot</div></div></div></div>'+
        '<button class="btn-primary" onclick="closeSheet()">Add to Calendar</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Reschedule</button>';
    }
    if(type==='book'){
      return '<h2>Request Appointment</h2><div class="shsub">Choose a department and preferred time.</div>'+
        '<div class="card" style="margin-bottom:6px">'+
          '<div class="row-item"><div class="rt"><div class="a">Department</div><div class="b">Cardiology</div></div><span class="chev"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></span></div>'+
          '<div class="row-item"><div class="rt"><div class="a">Preferred day</div><div class="b">Next available</div></div><span class="chev"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></span></div></div>'+
        '<button class="btn-primary" onclick="openSheet(\'genericdone\',\'Request Sent|Your appointment request was received. The clinic will confirm a slot shortly.\')">Send Request</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='invite'){
      return '<h2>Add Family — Manually</h2><div class="shsub">Enter their details to send a secure invite.</div>'+
        '<div class="card" style="margin-bottom:6px">'+
          '<div class="row-item"><div class="rt"><div class="a">Full name</div><div class="b">The relative\u2019s name</div></div></div>'+
          '<div class="row-item"><div class="rt"><div class="a">Mobile number</div><div class="b">For the secure invite</div></div></div>'+
          '<div class="row-item"><div class="rt"><div class="a">Relationship</div><div class="b">Son, spouse, daughter\u2026</div></div><span class="chev"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7"/></svg></span></div></div>'+
        '<button class="btn-primary" onclick="openSheet(\'genericdone\',\'Invite Sent|A secure link was sent. They will appear in your family list once they register.\')">Send Invite</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='addqr'){
      return '<h2>Add Family — QR Code</h2><div class="shsub">Two ways to connect a family member instantly.</div>'+
        '<div style="font-weight:600;font-size:13px;margin-bottom:6px">Your invite code</div>'+
        '<div class="qr-graphic">'+qrSVG()+'</div>'+
        '<div class="shsub" style="text-align:center;margin-top:6px">Ask your relative to scan this from their app</div>'+
        '<button class="btn-primary" onclick="openSheet(\'scanfam\')">Or Scan Their Code Instead</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Close</button>';
    }
    if(type==='scanfam'){
      return '<h2>Scan Family QR</h2><div class="shsub">Point the camera at the family member\u2019s invite code.</div>'+
        '<div class="scanner"><div class="scan-frame"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><span class="scan-line"></span></div></div>'+
        '<div class="shsub" style="text-align:center">Prototype — camera is simulated.</div>'+
        '<button class="btn-primary" onclick="openSheet(\'genericdone\',\'Family Member Added|The scanned relative has been linked to your care. Set their permissions anytime.\')">Simulate Successful Scan</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='qrlogin'){
      return '<h2>Log in with QR</h2><div class="shsub">Scan the QR code shown at the hospital reception or on your appointment card.</div>'+
        '<div class="scanner"><div class="scan-frame"><span class="corner tl"></span><span class="corner tr"></span><span class="corner bl"></span><span class="corner br"></span><span class="scan-line"></span></div></div>'+
        '<div class="shsub" style="text-align:center">Prototype — camera is simulated.</div>'+
        '<button class="btn-primary" onclick="closeSheet();enterApp();">Simulate Successful Scan</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='perm'){
      return '<h2>'+arg+'\u2019s Access</h2><div class="shsub">Choose what this family member is allowed to do.</div>'+
        '<div class="card" style="margin-bottom:6px">'+
          '<div class="toggle-row"><span class="tlbl">View patient status</span><button class="switch on" onclick="this.classList.toggle(\'on\')"></button></div>'+
          '<div class="toggle-row"><span class="tlbl">Receive alerts</span><button class="switch on" onclick="this.classList.toggle(\'on\')"></button></div>'+
          '<div class="toggle-row"><span class="tlbl">Book appointments</span><button class="switch'+(arg==='Mahmoud'?' on':'')+'" onclick="this.classList.toggle(\'on\')"></button></div>'+
          '<div class="toggle-row"><span class="tlbl">Submit ratings</span><button class="switch'+(arg==='Mahmoud'?' on':'')+'" onclick="this.classList.toggle(\'on\')"></button></div>'+
          '<div class="toggle-row"><span class="tlbl">Trigger emergency</span><button class="switch'+(arg==='Mahmoud'?' on':'')+'" onclick="this.classList.toggle(\'on\')"></button></div></div>'+
        '<button class="btn-primary" onclick="closeSheet();showToast(\'Permissions saved\')">Save Permissions</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='repview'){
      return '<h2>'+arg+'</h2><div class="shsub">Alamein Model Hospital · official record</div>'+
        '<div style="background:#fff;border:1px solid var(--line);border-radius:14px;padding:16px;margin-bottom:6px">'+
          '<div style="height:9px;width:55%;background:var(--line);border-radius:4px;margin-bottom:9px"></div>'+
          '<div style="height:9px;width:88%;background:#eef1f0;border-radius:4px;margin-bottom:7px"></div>'+
          '<div style="height:9px;width:80%;background:#eef1f0;border-radius:4px;margin-bottom:7px"></div>'+
          '<div style="height:9px;width:90%;background:#eef1f0;border-radius:4px;margin-bottom:7px"></div>'+
          '<div style="height:9px;width:40%;background:#eef1f0;border-radius:4px"></div></div>'+
        '<div class="shsub">Prototype — full document content is illustrative.</div>'+
        '<button class="btn-primary" onclick="closeSheet();showToast(\'Download started — prototype\')">Download PDF</button>'+
        '<button class="btn-ghost" onclick="closeSheet();showToast(\'Share sheet — prototype\')">Share with a provider</button>';
    }
    if(type==='alertmed'){
      var mp=(arg||'Medication||').split('|');
      return '<div style="width:54px;height:54px;border-radius:50%;background:rgba(224,164,88,.18);margin:6px auto 12px;display:flex;align-items:center;justify-content:center">'+
        '<svg fill="none" stroke="#b07d2e" stroke-width="2" viewBox="0 0 24 24" style="width:26px;height:26px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg></div>'+
        '<h2 style="text-align:center">'+mp[0]+'</h2>'+
        '<div class="shsub" style="text-align:center">'+(mp[1]||'')+' · due '+(mp[2]||'')+'</div>'+
        '<button class="btn-primary" style="margin-top:4px" onclick="closeSheet();showToast(\'Marked as taken\')">Mark as Taken</button>'+
        '<button class="btn-ghost" onclick="closeSheet();showToast(\'Reminder snoozed 15 min\')">Snooze 15 min</button>';
    }
    if(type==='alertinfo'){
      var ip=(arg||'Update|').split('|');
      return '<h2>'+ip[0]+'</h2>'+
        '<div class="shsub" style="margin-bottom:6px">'+(ip[1]||'')+'</div>'+
        '<button class="btn-primary" onclick="closeSheet()">Got it</button>';
    }
    if(type==='genericdone'){
      var parts=(arg||'Done|').split('|');
      return '<div class="check-anim"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>'+
        '<h2 style="text-align:center">'+parts[0]+'</h2>'+
        '<div class="shsub" style="text-align:center">'+(parts[1]||'')+'</div>'+
        '<button class="btn-primary" onclick="closeSheet()">Done</button>';
    }
    if(type==='ratevisit'){
      return '<h2>Rate your last visit</h2>'+
        '<div class="shsub">Visit <b>#ALM-20413</b> \u2014 Today, Catheterization with Dr. Amira Fouad</div>'+
        '<div style="font-weight:600;font-size:13px;margin:8px 2px 4px">Overall experience</div>'+
        '<div class="stars">'+[1,2,3,4,5].map(function(n){
          return '<div class="star" onclick="setStars('+n+')"><svg viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg></div>';
        }).join('')+'</div>'+
        '<div style="font-weight:600;font-size:13px;margin:14px 2px 8px">Quick survey</div>'+
        '<div class="card" style="padding:14px;margin-bottom:6px">'+
          '<div class="srv-q">How long did you wait for care?</div>'+
          '<div class="srv-opts">'+
            '<button class="srv-pill" onclick="srvPick(this)">Very short</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">Acceptable</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">Too long</button>'+
          '</div>'+
          '<div class="srv-q" style="margin-top:14px">How clear were the staff explanations?</div>'+
          '<div class="srv-opts">'+
            '<button class="srv-pill" onclick="srvPick(this)">Very clear</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">Somewhat</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">Unclear</button>'+
          '</div>'+
          '<div class="srv-q" style="margin-top:14px">Would you recommend the hospital?</div>'+
          '<div class="srv-opts">'+
            '<button class="srv-pill" onclick="srvPick(this)">Definitely</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">Maybe</button>'+
            '<button class="srv-pill" onclick="srvPick(this)">No</button>'+
          '</div>'+
        '</div>'+
        '<textarea placeholder="Add a comment (optional)\u2026"></textarea>'+
        '<button class="btn-primary" onclick="submitRate(\'visit\')">Submit Feedback</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Cancel</button>';
    }
    if(type==='visitpast'){
      var p=(arg||'||||||').split('|');
      return '<h2>Visit #'+p[0]+'</h2>'+
        '<div class="shsub">'+p[1]+'</div>'+
        '<div class="card" style="margin-bottom:6px">'+
          '<div style="font-weight:600;font-size:14px;margin-bottom:8px">'+p[2]+'</div>'+
          '<div style="font-size:12px;color:var(--muted);margin-bottom:11px">'+p[3]+'</div>'+
          '<div class="bill"><span class="bl">Status</span><span class="bv">'+p[4]+'</span></div>'+
          '<div class="bill"><span class="bl">Your rating</span><span class="bv" style="color:#c98a1f">\u2605 '+p[5]+' / 5</span></div>'+
        '</div>'+
        '<button class="btn-primary" onclick="closeSheet();openCompletedJourney(\''+p[0]+'\',\''+p[1]+'\',\''+p[2]+'\',\''+p[3]+'\',\''+p[5]+'\')">View Journey</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Close</button>';
    }
    if(type==='guestblock'){
      return '<div style="width:54px;height:54px;border-radius:50%;background:rgba(224,164,88,.18);margin:6px auto 12px;display:flex;align-items:center;justify-content:center">'+
        '<svg fill="none" stroke="#b07d2e" stroke-width="2" viewBox="0 0 24 24" style="width:26px;height:26px"><path stroke-linecap="round" stroke-linejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></div>'+
        '<h2 style="text-align:center">Sign In Required</h2>'+
        '<div class="shsub" style="text-align:center">This section holds personal information. Sign in to view your journey, reports, alerts, and family access.</div>'+
        '<button class="btn-primary" onclick="backToLogin()">Go to Sign In</button>'+
        '<button class="btn-ghost" onclick="closeSheet()">Keep browsing</button>';
    }
    return '<h2>—</h2><button class="btn-primary" onclick="closeSheet()">Close</button>';
  }

  function qrSVG(){
    // simple deterministic QR-like pattern
    var c='<svg viewBox="0 0 100 100" shape-rendering="crispEdges">';
    var seed=[7,13,2,29,17,23,11,31,5,19];
    for(var y=0;y<14;y++){for(var x=0;x<14;x++){
      var on=((x*7+y*13+seed[(x+y)%10])%3===0);
      if(x<4&&y<4||x>9&&y<4||x<4&&y>9) on=(x===0||x===3||y===0||y===3||(x>0&&x<3&&y>0&&y<3));
      if(on) c+='<rect x="'+(x*7+1)+'" y="'+(y*7+1)+'" width="7" height="7" fill="#15302b"/>';
    }}
    c+='</svg>';return c;
  }

  function submitRate(stage){
    if(chosen===0){ showToast('Tap the stars to rate'); return; }
    openSheet('done');
    var pts=document.getElementById('ptsHome');
    if(pts) pts.textContent=String(parseInt(pts.textContent,10)+20);
    if(stage==='Diagnosis'){var b=document.getElementById('rb-diag');if(b){b.className='rate-btn done';b.innerHTML='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Rated';}}
    if(stage==='Catheterization'){var c=document.getElementById('rb-cath');if(c){c.className='rate-btn done';c.innerHTML='<svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="3"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg> Rated';}}
    chosen=0;
  }
  function srvPick(btn){
    btn.parentElement.querySelectorAll('button').forEach(b=>b.classList.remove('on'));
    btn.classList.add('on');
  }
  function backToLogin(){
    closeSheet();
    guestMode=false;
    document.getElementById('homeName').textContent='Ahmed Abdel-Rahman';
    document.getElementById('homeHi').innerHTML='Good morning <span style="font-size:14px">\ud83d\udc4b</span>';
    document.getElementById('homeAvatar').textContent='AA';
    document.getElementById('guestNotice').innerHTML='';
    document.getElementById('login').classList.add('on');
    document.getElementById('statusbar').classList.add('light');
  }
