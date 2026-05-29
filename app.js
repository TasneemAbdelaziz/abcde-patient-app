/* ---------- intro ---------- */
  var slide=0;
  function introNext(){
    if(slide<3){
      document.getElementById('slide-'+slide).classList.remove('on');
      slide++;
      document.getElementById('slide-'+slide).classList.add('on');
      document.querySelectorAll('#introdots i').forEach(function(d,i){d.classList.toggle('on',i===slide);});
      if(slide===3) document.getElementById('introNext').textContent='Get Started';
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
    guestMode=true;
    document.getElementById('login').classList.remove('on');
    document.getElementById('statusbar').classList.remove('light');
    document.getElementById('homeName').textContent='Guest';
    document.getElementById('homeHi').textContent='Welcome,';
    document.getElementById('homeAvatar').textContent='G';
    document.getElementById('guestNotice').innerHTML=
      '<div class="guest-banner"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>'+
      '<span>You are browsing as a guest. Sign in to see your personal journey, reports, and alerts.</span></div>';
    go('home');
  }

  /* ---------- navigation ---------- */
  function go(p){
    if(guestMode && (p==='journey'||p==='alerts'||p==='family')){
      openSheet('guestblock'); return;
    }
    document.querySelectorAll('.page').forEach(el=>el.classList.remove('on'));
    document.getElementById('page-'+p).classList.add('on');
    document.querySelectorAll('.tab').forEach(t=>t.classList.remove('on'));
    var tab=document.getElementById('tab-'+p);
    if(tab) tab.classList.add('on');
    document.getElementById('view').scrollTop=0;
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
  function askChip(btn){
    var q=btn.textContent;
    var box=document.getElementById('chatbox');
    var me=document.createElement('div'); me.className='bub me'; me.textContent=q; box.appendChild(me);
    var load=document.createElement('div'); load.className='bub ai';
    load.innerHTML='<span class="dotload"><i></i><i></i><i></i></span>';
    box.appendChild(load);
    document.getElementById('view').scrollTop=99999;
    setTimeout(function(){
      load.textContent=answers[q]||'A member of the care team will follow up with you on this.';
      document.getElementById('view').scrollTop=99999;
    },950);
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
  function backToLogin(){
    closeSheet();
    guestMode=false;
    document.getElementById('homeName').textContent='Karim Hassan';
    document.getElementById('homeHi').textContent='Good morning,';
    document.getElementById('homeAvatar').textContent='KH';
    document.getElementById('guestNotice').innerHTML='';
    document.getElementById('login').classList.add('on');
    document.getElementById('statusbar').classList.add('light');
  }
