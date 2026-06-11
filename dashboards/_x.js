let STORE={};
const el=(id)=>{ STORE[id]=STORE[id]||{innerHTML:'',value:'',checked:false,style:{},classList:{_c:[],add(x){this._c.push(x)},remove(x){this._c=this._c.filter(y=>y!==x)},toggle(x,f){f?this.add(x):this.remove(x)},contains(x){return this._c.includes(x)}},appendChild(){},remove(){},scrollTop:0,scrollHeight:0,focus(){}}; return STORE[id]; };
global.window=global;
global.document={ getElementById:el, querySelectorAll:()=>[], createElement:()=>el('t'+Math.random()), addEventListener:()=>{}, documentElement:{dir:'',lang:''} };
const fs=require('fs');
['data.js','components.js','reception.js','nurse.js','doctor.js','quality.js','admin.js','emergency.js','family.js','ai.js','app.js'].forEach(f=>eval(fs.readFileSync(f,'utf8')));
window.render=()=>{};
let ok=0,bad=0; const T=(n,c)=>{ if(c)ok++; else {bad++;console.log('  FAIL '+n);} };
let total=0;
Object.keys(window.ROLES).forEach(rk=>{ const role=window.ROLES[rk]; window.STATE.role=rk;
  role.nav.forEach(it=>{ total++; window.STATE.route=it.route; try{ const h=role.render(it.route); if(typeof h!=='string'||h.length<50)throw new Error('thin'); ok++; }catch(e){ bad++; console.log('  FAIL render '+rk+':'+it.route+' -> '+e.message+'\n   '+(e.stack||'').split('\n')[1]); }
    if(typeof it.badge==='function'){ try{ it.badge(); }catch(e){ bad++; console.log('  FAIL badge '+rk+':'+it.route+' '+e.message);} } });
});
console.log('rendered '+total+' role screens');
// new screen depth checks
window.STATE.role='doctor'; window.STATE.selectedSerial='ALM-20413';
T('doctor Results: lab ranges+flags', /Troponin I/.test(window.ROLES.doctor.render('results'))&&/Range/.test(window.ROLES.doctor.render('results')));
T('doctor nav has results', window.ROLES.doctor.nav.some(n=>n.route==='results'));
window.STATE.role='nurse';
T('nurse Handover SBAR', /Shift handover|sbar/.test(window.ROLES.nurse.render('handover')));
window.nurseTask('ALM-20399-0'); T('nurse task toggles', /shift handover|sbar/i.test(window.ROLES.nurse.render('handover')));
window.STATE.role='reception';
T('reception Committee', /Three-doctor committee/.test(window.ROLES.reception.render('committee'))&&/Committee members/.test(window.ROLES.reception.render('committee')));
window.recCommitteeAuthorize('ALM-20425'); T('committee authorize', window.findPatient('ALM-20425').committee.status==='authorized');
window.recCommitteeMemo('ALM-20425'); T('committee memo', window.findPatient('ALM-20425').committee.memo===true);
window.STATE.role='quality';
T('quality Departments routing', /Departments/.test(window.ROLES.quality.render('departments'))&&/Route to head/.test(window.ROLES.quality.render('departments')));
T('quality worst-points chart', /worst points/.test(window.ROLES.quality.render('overview')));
window.STATE.role='emergency';
T('emergency Critical watch', /Critical watch|Early-warning feed/.test(window.ROLES.emergency.render('critical')));
T('emergency Metrics chart', /Response metrics/.test(window.ROLES.emergency.render('metrics'))&&/class="chart"/.test(window.ROLES.emergency.render('metrics')));
window.STATE.role='family';
T('family Care team', /Care team/.test(window.ROLES.family.render('team')));
T('family Education', /Learn & prepare/.test(window.ROLES.family.render('education'))&&/recommended now|Procedure/.test(window.ROLES.family.render('education')));
// counts
console.log('nav counts:', Object.keys(window.ROLES).map(r=>r+':'+window.ROLES[r].nav.length).join(' '));
console.log('\nPASS '+ok+'  FAIL '+bad); process.exit(bad?1:0);
