// Auditoría U9: desde cada área, abre cada módulo (botones con data-route y tarjetas de la Home), vuelve por el control
// visible de «Volver/Cerrar/✕» o, si no hay, por Atrás del navegador, y anota dónde queda el usuario.
const {chromium}=require('/home/user/pwcli/node_modules/playwright');const U='http://127.0.0.1:43984/';
const where=p=>p.evaluate(()=>{const dlg=[...document.querySelectorAll('dialog[open]')].map(d=>d.id||d.className).join('|');return {hash:location.hash,area:window.FloorPlanProfessionalUI?.area||null,welcome:!!document.querySelector('#welcome[open],dialog#welcomeDialog[open]')||document.body.classList.contains('welcome-open'),dlg,y:Math.round(scrollY+(document.querySelector('#professionalWorkspace')?.scrollTop||0))};});
(async()=>{const b=await chromium.launch({executablePath:'/opt/pw-browsers/chromium-1243/chrome-linux64/chrome'});const out=[];
for(const area of ['deliver','budget','analyze']){
 const c=await b.newContext({viewport:{width:1440,height:900}});const p=await c.newPage();p.on('dialog',d=>d.dismiss());
 await p.goto(U);await p.waitForFunction(()=>window.FloorPlanProfessionalUI);await p.evaluate(()=>document.querySelector('#welcomeExample').click());await p.waitForTimeout(800);
 await p.evaluate(a=>FloorPlanProfessionalUI.open(a),area);await p.waitForTimeout(1000);
 const routes=await p.evaluate(()=>[...new Set([...document.querySelectorAll('#professionalWorkspace [data-route]')].filter(e=>e.checkVisibility()&&!e.disabled).map(e=>e.dataset.route))]);
 for(const r of routes){
  try{
   await p.evaluate(a=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();FloorPlanProfessionalUI.open(a);},area);await p.waitForTimeout(500);
   const before=await where(p);const ok=await p.evaluate(r=>{const e=[...document.querySelectorAll(`#professionalWorkspace [data-route="${r}"]`)].find(e=>e.checkVisibility());if(!e)return false;e.scrollIntoView({block:'center'});e.click();return true;},r);if(!ok)continue;
   await p.waitForTimeout(1500);const opened=await where(p);
   // control de vuelta visible
   const back=await p.evaluate(()=>{const vis=e=>e.checkVisibility()&&getComputedStyle(e).visibility!=='hidden';const scope=[...document.querySelectorAll('dialog[open]')].pop()||document;const ret=document.querySelector('#perlaReturn:not([hidden]),#professionalWorkspace .professional-head>button[data-perla-return]');if(ret&&!document.querySelector('dialog[open]')){const t=ret.textContent.trim();ret.click();return t;}const cands=[...scope.querySelectorAll('button,a')].filter(vis);const e=cands.find(e=>/^(←|✕|×)|Volver|Cerrar|Close|Back/i.test((e.textContent||'').trim()+' '+(e.getAttribute('aria-label')||'')));if(!e)return null;const t=(e.textContent.trim()||e.getAttribute('aria-label')).slice(0,40);e.click();return t;});
   await p.waitForTimeout(1200);let after=await where(p),via=back;
   if(!back){await p.goBack().catch(()=>{});await p.waitForTimeout(1200);after=await where(p);via='Atrás navegador';}
   out.push({area,r,opened:opened.dlg||opened.hash||opened.area,via,after:after.area||(after.welcome?'HOME':after.hash),ok:after.area===area&&!after.dlg});
  }catch(e){out.push({area,r,err:e.message.slice(0,80)});}
 }
 await c.close();}
for(const o of out)console.log(JSON.stringify(o));await b.close();})();
