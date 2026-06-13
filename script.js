const translations={en:{hospitalName:"Alamein Model Hospital",aboutTitle:"ABOUT THE HOSPITAL",card1Title:"Matrouh’s Largest Medical Hub",card1Text:"A leading healthcare destination serving Matrouh, New Alamein, the North Coast, residents, visitors, and medical tourism patients.",card2Title:"Multi‑Specialty Excellence",card2Text:"More than 20 departments bring specialized care together, including cardiology, neurosurgery, emergency, radiology, stroke care, and surgery.",card3Title:"AI‑Powered Imaging",card3Text:"Advanced MRI, CT, and catheterization technologies support faster diagnosis and more precise clinical decisions.",card4Title:"Quality‑Driven Care",card4Text:"Built around safety, clinical quality, patient experience, and trusted healthcare standards for every stage of care.",nextBtn:"Next",learnBtn:"Open Patient App"},ar:{hospitalName:"مستشفى العلمين النموذجي",aboutTitle:"عن المستشفى",card1Title:"أكبر مركز طبي في مطروح",card1Text:"وجهة رعاية صحية رائدة تخدم مطروح والعلمين الجديدة والساحل الشمالي والسكان والزائرين ومرضى السياحة العلاجية.",card2Title:"تميّز متعدد التخصصات",card2Text:"أكثر من 20 قسماً طبياً يجمعون الرعاية المتخصصة في مكان واحد، تشمل القلب والمخ والأعصاب والطوارئ والأشعة وعلاج السكتات والجراحة.",card3Title:"تصوير طبي مدعوم بالذكاء الاصطناعي",card3Text:"تقنيات MRI وCT والقسطرة المتقدمة تدعم التشخيص السريع والقرارات الطبية الأكثر دقة.",card4Title:"رعاية قائمة على الجودة",card4Text:"منظومة تهتم بسلامة المرضى وجودة الخدمة وتجربة المريض والمعايير الصحية الموثوقة في كل مرحلة من مراحل الرعاية.",nextBtn:"التالي",learnBtn:"افتح تطبيق المريض"},ru:{hospitalName:"Alamein Model Hospital",aboutTitle:"О БОЛЬНИЦЕ",card1Title:"Крупный медицинский центр Матруха",card1Text:"Ведущее медицинское направление для Матруха, Нового Аламейна, Северного побережья, жителей, гостей и пациентов медицинского туризма.",card2Title:"Многопрофильная экспертиза",card2Text:"Более 20 отделений объединяют специализированную помощь: кардиология, нейрохирургия, экстренная помощь, радиология, лечение инсульта и хирургия.",card3Title:"Визуализация с ИИ",card3Text:"Современные MRI, CT и катетеризационные технологии помогают быстрее ставить диагноз и принимать более точные клинические решения.",card4Title:"Качество и безопасность",card4Text:"Модель ухода построена вокруг безопасности, качества, опыта пациента и надежных медицинских стандартов на каждом этапе.",nextBtn:"Далее",learnBtn:"Открыть приложение"}};
const languageBtn=document.getElementById("languageBtn"),languageMenu=document.getElementById("languageMenu");
languageBtn.addEventListener("click",e=>{e.stopPropagation();languageMenu.classList.toggle("show")});
function changeLanguage(lang){const selected=translations[lang]||translations.en;document.documentElement.lang=lang;document.documentElement.dir=lang==="ar"?"rtl":"ltr";document.body.classList.toggle("arabic-mode",lang==="ar");document.querySelectorAll("[data-i18n]").forEach(el=>{const key=el.getAttribute("data-i18n");if(selected[key])el.innerHTML=selected[key]});languageMenu.classList.remove("show");showSlide(activeSlide)}
languageMenu.addEventListener("click",e=>{const b=e.target.closest("button[data-lang]");if(b)changeLanguage(b.dataset.lang)});
document.addEventListener("click",e=>{if(!e.target.closest(".language-dropdown"))languageMenu.classList.remove("show")});
const track=document.getElementById("aboutTrack"),dots=document.querySelectorAll(".dot");let activeSlide=0,autoSlideInterval;
function showSlide(index){activeSlide=index;track.style.transform=`translateX(-${index*100}%)`;dots.forEach(d=>d.classList.remove("active"));dots[index].classList.add("active")}
function nextSlide(){showSlide((activeSlide+1)%dots.length)}
function startAutoSlide(){clearInterval(autoSlideInterval);autoSlideInterval=setInterval(nextSlide,3500)}
dots.forEach(dot=>dot.addEventListener("click",()=>{showSlide(Number(dot.dataset.slide));startAutoSlide()}));
document.getElementById("nextBtn").addEventListener("click",()=>{nextSlide();startAutoSlide()});
document.getElementById("openAppBtn").addEventListener("click",()=>{document.getElementById("homeView").classList.remove("active");document.getElementById("loginView").classList.add("active");clearInterval(autoSlideInterval)});
function backToHome(){document.getElementById("loginView").classList.remove("active");document.getElementById("homeView").classList.add("active");startAutoSlide()}
function enterPatientApp(asGuest){
  document.getElementById("loginView").classList.remove("active");
  document.getElementById("appView").classList.add("active");
  const avatar=document.querySelector('.profile-avatar');
  const greeting=document.getElementById('profileGreeting');
  const name=document.getElementById('profileName');
  const room=document.getElementById('profileRoom');
  const title=document.getElementById('conditionTitle');
  const text=document.getElementById('conditionText');
  if(asGuest){
    avatar.textContent='G';
    greeting.textContent='Guest access';
    name.textContent='Guest User';
    room.textContent='Limited Mode';
    title.textContent='Welcome to Alamein Model Hospital';
    text.textContent='Guest mode lets you browse the app design. Sign in to view personal reports, medication, and care journey data.';
  }else{
    avatar.textContent='AA';
    greeting.textContent='Welcome back';
    name.textContent='Ahmed Al‑Rashid';
    room.textContent='Room 204 · Ward B';
    title.textContent='Recovery & Monitoring';
    text.textContent='Acute coronary syndrome · Stage 5 of 8';
  }
  showPage('profile');
}
function scanQRLogin(){
  const modal=document.getElementById('modal');
  modal.innerHTML='<div class="modal-sheet"><span></span><h3>Scan QR Code</h3><small>Point the camera at the QR code on the appointment card or at reception.</small><div class="qr-scan-box"><div class="qr-frame"></div></div><button onclick="closeModal();enterPatientApp(false)">Simulate Successful Scan</button><button style="background:#fff;color:#6b8079;border:1px solid #e3ebe8;margin-top:9px" onclick="closeModal()">Cancel</button></div>';
  modal.classList.add('active');
}
function showPage(page){document.querySelectorAll('.app-page').forEach(p=>p.classList.remove('active'));document.getElementById('page-'+page).classList.add('active');document.querySelectorAll('.tab').forEach(t=>t.classList.toggle('active',t.dataset.page===page));document.getElementById('appPages').scrollTop=0}
function openModal(text){const modal=document.getElementById('modal');modal.innerHTML='<div class="modal-sheet"><span></span><p id="modalText"></p><button onclick="closeModal()">OK</button></div>';document.getElementById('modalText').textContent=text;modal.classList.add('active')}
function closeModal(){document.getElementById('modal').classList.remove('active')}
function sendChat(){const input=document.getElementById('chatInput');const text=input.value.trim();if(!text)return;const box=document.getElementById('chatBox');box.insertAdjacentHTML('beforeend',`<div class="bubble user"></div>`);box.lastChild.textContent=text;input.value='';setTimeout(()=>{box.insertAdjacentHTML('beforeend','<div class="bubble ai">For your safety, please follow your doctor’s instructions. I can help explain general recovery, medication timing, food, walking, or follow-up appointments.</div>');box.scrollTop=box.scrollHeight},450)}
changeLanguage('en');startAutoSlide();