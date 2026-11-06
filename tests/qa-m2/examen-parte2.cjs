'use strict';
/* Examen final M2/S4 — escenarios EX-04 … EX-13 (continúan el estado de EX-01…03). */
const fs=require('node:fs/promises'),fss=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
module.exports=function({test,run,H,F,T,get,set,plan,addTaskUI}){
const {boot,close,dump,shot,area,openProject,openBudget,setPriceUI,budgetNow,snap,inventory,openEvolution,evoFrame,eurParse}=H;
const reopen=async page=>{await page.reload();await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible().catch(()=>false))await page.locator('#welcomeReturn').click();};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const TARIFF=require(path.join(H.ROOT,'tests','fixtures','bc3','synthetic-tariff.cjs'));
// Importes esperados por tarea a partir del presupuesto actual y los repartos guardados (referencia independiente).
function expectedByTask(budget,schedule){const lines=new Map(F.referencia(budget.items).lineas.map(l=>[l.id,l.neto]));const parts=new Map();
 for(const t of schedule.tasks){const al=t.budgetAllocations||(t.budgetItemIds||[]).map(i=>({itemId:i,sharePercent:100}));for(const a of al){if(!parts.has(a.itemId))parts.set(a.itemId,[]);parts.get(a.itemId).push({task:t.id,p:a.sharePercent});}}
 const out={};for(const [item,list] of parts){const n=lines.get(item);const cents=n===null||n===undefined?null:F.reparto(Math.round(n*100),list.map(x=>x.p));list.forEach((x,i)=>{out[x.task]=out[x.task]||{known:0,unknown:0};if(cents===null)out[x.task].unknown++;else out[x.task].known+=cents[i];});}
 for(const k in out)out[k].known=out[k].known/100;return out;}

/* EX-04 · VÍDEO 2 · Revisiones B y C, tarifa BC3, invalidación, reapertura y nueva entrega. */
test('EX-04 vídeo 2: revisiones económicas B y C, tarifa BC3, invalidación y nueva entrega',{timeout:900000},()=>run('EX-04','Economía: revisiones B y C (vídeo 2)','Economía',async S=>{
 const s=await boot({state:get(),video:'v2'}),{page,log}=s;
 try{
 // --- Revisión B: tres precios a mano y una partida sin valorar ---
 await openBudget(page);for(const [id,p] of Object.entries(F.CAMBIOS_B))await setPriceUI(page,id,p);await setPriceUI(page,F.B_SIN_VALORAR,null);
 await shot(page,'ex04-presupuesto-revision-B',{escenario:'Revisión B',esperado:'3 precios nuevos, nogal sin valorar'});await page.locator('#budgetClose').click();
 // Tarifa BC3 aportada: referencia PINT-LISA para «paint», con confirmación
 await area(page,'budget');await page.locator('[data-route="reference-prices"]').click();await page.waitForSelector('#pricesDialog[open]');
 S.check('EX-04.B0','BCCA gestionada sigue bloqueada',await page.locator('#pricesManaged').getAttribute('data-enabled')==='false');
 await page.locator('#pricesItems [data-item="paint"]').click();await page.setInputFiles('#pricesTariff',{name:'tarifa-sintetica.bc3',mimeType:'application/octet-stream',buffer:Buffer.from(TARIFF.text,'latin1')});
 await page.waitForSelector('#pricesSources [data-col]');await page.locator('#pricesSources [data-col]').selectOption(String(F.B_REFERENCIA.columna));
 await page.fill('#pricesQuery','pintura');await page.locator('#pricesSearch button[type=submit]').click();await page.waitForSelector('[data-quote="PINT-LISA"]');
 await page.locator('[data-quote="PINT-LISA"]').click();await page.locator('[data-detail="0"]').click();await page.locator('#pricesAsPrice').click();
 const before=(await budgetNow(page)).budget.items.find(i=>i.id==='paint').unitPrice;S.check('EX-04.B1','La vista previa no cambia el presupuesto',before===F.PRECIOS_A.paint,{observed:before});
 await shot(page,'ex04-tarifa-confirmacion',{escenario:'Tarifa BC3',esperado:'antes/después y confirmación'});
 await page.locator('#pricesConfirm').click();await page.waitForFunction(()=>/Cambio aplicado/.test(document.getElementById('pricesStatus').textContent));
 // Unidad incompatible: PUERTA-LISA (ud) sobre pintura (m²) sin el filtro de unidad
 await page.locator('#pricesSameUnit').uncheck();await page.fill('#pricesQuery','puerta');await page.locator('#pricesSearch button[type=submit]').click();await page.waitForSelector('[data-quote="PUERTA-LISA"]');
 await page.locator('[data-quote="PUERTA-LISA"]').click();await page.locator('#pricesCompare [data-detail]').last().click();await page.locator('#pricesAsPrice').click();
 S.check('EX-04.B2','Unidad incompatible: se bloquea y el presupuesto no cambia',/No se puede aplicar/.test(await page.locator('#pricesPreview').innerText()),{observed:await page.locator('#pricesPreview').innerText()});
 await page.locator('#pricesDialog .cx-head button').click();
 const B=await budgetNow(page),ref=F.referencia(B.budget.items),paint=B.budget.items.find(i=>i.id==='paint');
 S.check('EX-04.B3','Pintura con precio de referencia 7,90 € y procedencia PINT-LISA',paint.unitPrice===F.B_REFERENCIA.precio&&paint.priceReference?.code==='PINT-LISA'&&paint.priceSource?.type==='provider-reference',{observed:{p:paint.unitPrice,src:paint.priceSource?.type,code:paint.priceReference?.code}});
 S.check('EX-04.B4','El nogal queda sin precio (desconocido, no 0)',B.calc.lines.find(l=>l.id===F.B_SIN_VALORAR).subtotalNet===null);
 S.check('EX-04.B5','Neto conocido = referencia independiente',Math.abs(B.calc.totals.net.amount-ref.netoConocido)<0.005,{expected:ref.netoConocido,observed:B.calc.totals.net.amount});
 const hist=(await snap(page)).record.priceHistory['prj_qa-vivienda-obra']||[];S.check('EX-04.B6','El historial registra el cambio por tarifa (antes/después y revisiones)',hist.some(h=>h.code==='PINT-LISA'&&h.revBefore&&h.revAfter),{observed:hist.length});
 S.note('Los cambios de precio hechos A MANO en el diálogo de presupuesto no se anotan en el historial M2 (solo los de «Precios de referencia»); ver hallazgo si procede.');
 S.check('EX-04.B7','Los cambios manuales de precio también quedan en un historial de revisiones',hist.some(h=>h.itemId==='opening:window'),{expected:'entrada para opening:window',observed:hist.map(h=>h.itemId||h.edition)});
 // Evolución: importes por tarea recalculados = referencia
 const {frame:f}=await openEvolution(page);const P=await plan(page),exp=expectedByTask(B.budget,P);
 const got=await f.evaluate(()=>Object.fromEntries(window.__ft3dFidelity.ctx.model.costs.report.byTask.map(t=>[t.taskId,{known:t.knownNet,missing:t.missingItemIds.length}])));
 let bad=[];for(const [tid,e] of Object.entries(exp)){const g=got[tid];if(!g||Math.abs((g.known??0)-e.known)>0.005||(e.unknown>0)!==(g.missing>0))bad.push({tid,exp:e,got:g});}
 S.check('EX-04.B8','Evolución: importe conocido por tarea = referencia (reparto en céntimos) y partidas sin precio señaladas',!bad.length,{observed:bad});
 const sumTasks=Object.values(got).reduce((a,g)=>a+Math.round((g.known||0)*100),0)/100,sumAlloc=Object.values(exp).reduce((a,e)=>a+Math.round(e.known*100),0)/100;
 S.check('EX-04.B9','Sin doble contabilización: suma por tareas = suma de lo asignado',Math.abs(sumTasks-sumAlloc)<0.005,{expected:sumAlloc,observed:sumTasks});
 await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-04-25'));await page.waitForTimeout(300);await shot(page,'ex04-evolucion-revision-B',{escenario:'Revisión B en Evolución'});
 await page.locator('#evolutionBack').click();await area(page,'deliver');await page.waitForSelector('#deliveryState');
 S.check('EX-04.B10','La entrega de la revisión A queda desactualizada por el presupuesto',/desactualizada[\s\S]*presupuesto/.test(await page.locator('#deliveryState').innerText()),{observed:await page.locator('#deliveryState').innerText()});
 // --- Revisión C: reparto 60/40, duración de dos tareas, cambio de elemento ---
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();const id=t=>P.tasks.find(x=>x.title===t).id;
 const editAlloc=async(task,pct)=>{await page.locator(`[data-edit="${id(task)}"]`).click();await page.locator('#taskForm [data-alloc]').first().locator('input').fill(String(pct));};
 await editAlloc('Tabiquería interior',40);await page.locator('#taskSave').click();await editAlloc('Cerramientos exteriores',60);await page.locator('#taskSave').click();
 const c1=await page.locator('#taskError').count()?await page.locator('#taskError').textContent():'';S.check('EX-04.C1','Reparto 60/40 aceptado (bajar primero, subir después)',!c1,{observed:c1});
 await page.locator(`[data-edit="${id('Impermeabilización')}"]`).click();await page.fill('#taskEnd','2027-04-22');await page.locator('#taskSave').click();
 await page.locator(`[data-edit="${id('Fontanería')}"]`).click();await page.fill('#taskEnd','2027-04-22');await page.locator('#taskSave').click();
 await page.locator(`[data-edit="${id('Carpintería exterior')}"]`).click();const inv=await inventory(page);const wins=inv.filter(e=>e.type==='window').map(e=>e.key);
 await page.locator(`#taskElements input[data-element="${wins[0]}"]`).uncheck();await page.locator(`#taskElements input[data-element="${wins[5]}"]`).check();await page.locator('#taskSave').click();
 await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));
 await shot(page,'ex04-plan-revision-C',{escenario:'Revisión C',esperado:'60/40, duraciones y elemento cambiados'});await page.locator('#planClose').click();
 await reopen(page);const P2=await plan(page),rec=(await snap(page)).record,al=t=>{const x=P2.tasks.find(y=>y.title===t);return (x.budgetAllocations||[]).find(a=>a.itemId==='partition-new')?.sharePercent??((x.budgetItemIds||[]).includes('partition-new')?100:null);};
 S.check('EX-04.C2','Tras reabrir: reparto 60/40 guardado',al('Cerramientos exteriores')===60&&al('Tabiquería interior')===40,{observed:[al('Cerramientos exteriores'),al('Tabiquería interior')]});
 S.check('EX-04.C3','Tras reabrir: duraciones cambiadas',P2.tasks.find(t=>t.title==='Impermeabilización').endDate==='2027-04-22'&&P2.tasks.find(t=>t.title==='Fontanería').endDate==='2027-04-22');
 const t07=P2.tasks.find(t=>t.title==='Carpintería exterior'),k07=(t07.elements||[]).map(e=>e.elementId).concat(t07.elementIds||[]);
 S.check('EX-04.C4','Tras reabrir: elemento de T07 cambiado',!k07.includes(wins[0])&&k07.includes(wins[5]),{observed:k07});
 S.check('EX-04.C5','Historial del plan conserva cada guardado',rec.planHistory.length>=3,{observed:rec.planHistory.map(h=>h.action)});
 const corr=await page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot();return FloorPlanConstructionRecord.correspondence(s.record,FloorPlanConstructionRecord.nowOf(s.subject,await FloorPlanConstructionContext.nowFingerprints(s)));});
 S.check('EX-04.C6','La revisión declarada queda desactualizada tras B y C',corr.find(c=>c.aspect==='review').result==='obsolete',{observed:corr});
 // Nueva entrega (HTML) y conservación de la histórica
 const {frame:f2}=await openEvolution(page,{mode:'deliver'});await f2.evaluate(async()=>{await window.__ft3dDelivery.prepareDocument();});await page.waitForTimeout(500);
 await page.locator('#evolutionBack').click();const rec2=(await snap(page)).record;
 S.check('EX-04.C7','Historial de entregas: la de A se conserva y se añade la de C',rec2.deliveries.length>=2&&rec2.deliveries[0].fingerprints.budget!==rec2.deliveries.at(-1).fingerprints.budget,{observed:rec2.deliveries.map(d=>({id:d.id,at:d.at}))});
 await area(page,'deliver');await page.waitForSelector('#deliveryState');S.check('EX-04.C8','La nueva entrega corresponde al estado actual',await page.locator('#deliveryState').getAttribute('data-result')==='match');
 await shot(page,'ex04-entregar-nueva',{escenario:'Nueva entrega',esperado:'al día'});
 S.check('EX-04.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});
 set(await dump(page));
 }finally{await close(s,'v2-economia-persistencia');}
}));

/* EX-05 · 5.2 · Selección real de elementos 3D con el ratón y botones del panel. */
test('EX-05 selección 3D real: identidad, partida, tarea, elemento sin tarea y sin partida',{timeout:420000},()=>run('EX-05','Selección de elementos 3D (5.2)','Evolución',async S=>{
 const s=await boot({state:get()}),{page,log}=s;
 try{
 const {frame:f}=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.end());await f.locator('[data-view="iso"]').click();await page.waitForTimeout(1200);
 // Hallazgo D-14: el control «Cubierta derivada» no está disponible dentro de RUBIK; con la cubierta hecha, lo interior queda tapado.
 const roofCtl=(await f.locator('#roofCut').isVisible().catch(()=>false))?'#roofCut':(await f.locator('#roofToggle').isVisible())?'#roofToggle':null;
 S.check('EX-05.R','Dentro de RUBIK hay un control visible para ocultar la cubierta y ver el interior',!!roofCtl,{observed:roofCtl||'control oculto en la vista integrada'});
 const P=await plan(page),keysOf=t=>{const x=P.tasks.find(y=>y.title===t);return [...(x.elements||[]).map(e=>e.elementId),...(x.elementIds||[])];};
 const linked=new Set(P.tasks.flatMap(t=>[...(t.elements||[]).map(e=>e.elementId),...(t.elementIds||[])]));
 const inv=await inventory(page),free=inv.find(e=>e.type==='wall'&&e.representable&&!linked.has(e.key)).key;
 const frameBox=await page.locator('#evolutionFrame').boundingBox();
 // Punto de pantalla de un elemento: centro de su caja NDC (screenBounds con su clave como prefijo exacto)
 const at=async key=>f.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k);if(!b||!isFinite(b.x0))return null;
  for(const [u,v] of [[.5,.5],[.35,.5],[.65,.5],[.5,.35],[.5,.65]]){const nx=b.x0+(b.x1-b.x0)*u,ny=b.y0+(b.y1-b.y0)*v,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;if(F.scene.pick(x,y)===k)return {x,y,hit:true};}
  const x=c.left+((b.x0+b.x1)/2+1)/2*c.width,y=c.top+(1-(b.y0+b.y1)/2)/2*c.height;return {x,y,hit:false};},key);
 const clickKey=async key=>{const p=key?at2(key):null;if(!p)return {key,clicked:null};await lookAt(p.look);await page.mouse.click(frameBox.x+p.x,frameBox.y+p.y);await page.waitForTimeout(350);
  return {key,hit:p.hit,panel:await f.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:{key:b.dataset.key,text:b.innerText};})};};
 // Muestreo en rejilla del lienzo con el raycast real: qué elemento hay bajo cada punto (para elegir objetivos visibles).
 // Como haría un usuario: mirar la casa en varios momentos y vistas (antes de la cubierta en ISO, y al final en PLANTA).
 const grid=()=>f.evaluate(()=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),m={};for(let i=1;i<40;i++)for(let j=1;j<28;j++){const x=c.left+c.width*i/40,y=c.top+c.height*j/28,k=F.scene.pick(x,y);if(k&&!m[k])m[k]={x,y};}return m;});
 const looks=[['2027-04-14','iso'],['2027-05-13','top'],['2027-05-13','iso']],hits={};
 const roofHidden=()=>f.evaluate(()=>!document.getElementById('roofToggle').checked);
 const lookAt=async([d,v,roof])=>{await f.evaluate(d=>window.__ft3dFidelity.setDate(d),d);await f.locator(`[data-view="${v}"]`).click();
  if(roofCtl&&(roof==='sin-cubierta')!==(await roofHidden()))await f.locator(roofCtl).click();await page.waitForTimeout(900);};
 for(const lk of looks){await lookAt(lk);for(const [k,p] of Object.entries(await grid()))if(!hits[k])hits[k]={...p,look:lk};}
 if(roofCtl)for(const lk of [['2027-05-13','iso','sin-cubierta'],['2027-05-13','top','sin-cubierta']]){looks.push(lk);await lookAt(lk);for(const [k,p] of Object.entries(await grid()))if(!hits[k])hits[k]={...p,look:lk};}
 // Búsqueda densa (13×13) dentro de la caja en pantalla de cada elemento del grupo, en cada vista, con el raycast real.
 const dense=async list=>{for(const lk of looks){await lookAt(lk);for(const key of list){const p=await f.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k);if(!b||!isFinite(b.x0))return null;
   for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;if(x>c.left&&x<c.right&&y>c.top&&y<c.bottom&&F.scene.pick(x,y)===k)return {x,y};}return null;},key);
   if(p){hits[key]={...p,look:lk};return key;}}}return undefined;};
 const firstHit=list=>list.find(k=>hits[k]);const pickable=Object.keys(hits);S.note(`Rejilla 39×27 en 3 vistas (ISO antes de la cubierta, PLANTA y ISO al final): ${pickable.length} elementos distintos alcanzables con el ratón`);
 const at2=k=>hits[k]?{...hits[k],hit:true}:null;
 const cases=[['T04 tabique (partida tabiquería)',firstHit(keysOf('Tabiquería interior'))||await dense(keysOf('Tabiquería interior'))],['T09 suelo (partidas pavimento)',firstHit(keysOf('Pavimentos'))||await dense(keysOf('Pavimentos'))],['T02 muro de carga (tarea sin partida)',firstHit(keysOf('Estructura'))||await dense(keysOf('Estructura'))],['muro sin tarea',pickable.find(k=>k.startsWith('project/wal')&&!linked.has(k))]];
 let i=0;for(const [label,key] of cases){i++;if(!key){S.partial('EX-05.'+i,`Selección real de «${label}»`,'Ningún elemento de ese grupo es alcanzable con el ratón en las vistas probadas');continue;}const r=await clickKey(key);
  if(!r.hit){S.partial('EX-05.'+i,`Selección real de «${label}»`,'El elemento no es alcanzable con el ratón desde la vista ISO final (tapado por otros); se registra sin forzar',{observed:r});continue;}
  S.check('EX-05.'+i+'a',`Clic real sobre «${label}»: el panel muestra ESE elemento`,r.panel?.key===key,{expected:key,observed:r.panel?.key});
  if(label.startsWith('T04')){const b=f.locator('#pickInfo [data-rubik="open-budget"]').first();S.check('EX-05.'+i+'b','Panel: botón de la partida vinculada',await b.count()>0);
   if(await b.count()){await b.click();await page.waitForSelector('#budgetDialog[open]');S.check('EX-05.'+i+'c','La partida se abre en Presupuestar',await page.locator('#budgetDialog tr.is-focus').getAttribute('data-item')==='partition-new');await shot(page,'ex05-pick-partida',{escenario:'5.2'});await page.locator('#budgetClose').click();await page.waitForTimeout(600);}
   const panelAfter=await evoFrame(page).evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:b.dataset.key;});
   S.check('EX-05.'+i+'d','Al volver de Presupuestar sin cambios, el panel del elemento sigue abierto',panelAfter===key,{observed:panelAfter});
   const pb=evoFrame(page).locator('#pickInfo [data-rubik="open-plan"]');if(await pb.count()){await pb.click();await page.waitForSelector('#planDialog[open]');
    S.check('EX-05.'+i+'e','«Ver en el plan de obra» abre la pestaña Elementos en ese elemento',await page.locator('#planElements tr.is-focus').getAttribute('data-element')===key,{observed:await page.locator('#planElements tr.is-focus').getAttribute('data-element').catch(()=>null)});
    await shot(page,'ex05-pick-plan',{escenario:'5.2'});await page.locator('#planClose').click();await page.waitForTimeout(400);}
   const tb=evoFrame(page).locator('#pickInfo [data-pick-task]').first();if(await tb.count()){await tb.click();await page.waitForTimeout(300);S.check('EX-05.'+i+'f','«Ver trabajo» selecciona la tarea en el Gantt',await evoFrame(page).evaluate(()=>window.__ft3dFidelity.selected)===P.tasks.find(t=>t.title==='Tabiquería interior').id);}}
  if(label.startsWith('T02'))S.check('EX-05.'+i+'b','Elemento con tarea sin partidas: el panel lo dice',/Sin partidas asignadas/.test(r.panel?.text||''),{observed:r.panel?.text});
  if(label==='muro sin tarea')S.check('EX-05.'+i+'b','Elemento sin tarea: el panel lo dice con naturalidad',/no tiene trabajos vinculados/.test(r.panel?.text||''),{observed:r.panel?.text});
  await shot(page,'ex05-pick-'+i,{escenario:'5.2 '+label});}
 // Accesibilidad: ¿se puede seleccionar un elemento sin ratón?
 const closeBtn=evoFrame(page).locator('#pickInfo button:has-text("Cerrar")');if(await closeBtn.count()&&await closeBtn.first().isVisible())await closeBtn.first().click();await page.waitForTimeout(200);
 const openBefore=await evoFrame(page).evaluate(()=>!document.getElementById('pickInfo').hidden);
 await evoFrame(page).locator('#stage').focus();for(const k of ['Enter','Tab','ArrowRight','Space'])await page.keyboard.press(k);await page.waitForTimeout(300);
 const kb=!openBefore&&await evoFrame(page).evaluate(()=>!document.getElementById('pickInfo').hidden);
 S.check('EX-05.K','La selección de elementos 3D tiene alternativa por teclado',kb,{expected:'algún medio de teclado abre el panel de un elemento',observed:{panelAbiertoAntes:openBefore,panelTrasTeclado:kb}});
 S.check('EX-05.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});
 }finally{await close(s);}
}));

/* EX-06 · Aislamiento entre dos proyectos con el mismo nombre (y tras recargar). */
test('EX-06 aislamiento A/B con el mismo nombre, antes y después de recargar',{timeout:300000},()=>run('EX-06','Aislamiento entre proyectos','Identidad',async S=>{
 const s=await boot({state:get()}),{page}=s;
 try{
 const A=await snap(page),AB=(await budgetNow(page)).budget;
 await openProject(page,'ent_qa-b');const B=await snap(page),BB=(await budgetNow(page)).budget;
 S.check('EX-06.1','B: otro sujeto, sin plan, sin entregas, sin historial de A',B.subject.id==='prj_qa-vivienda-obra-2'&&B.record===null,{observed:{id:B.subject.id,record:!!B.record}});
 S.check('EX-06.2','B: ningún precio de A',BB.items.every(i=>i.unitPrice===null),{observed:BB.items.filter(i=>i.unitPrice!==null).map(i=>i.id)});
 await openBudget(page);await setPriceUI(page,'paint',99);await page.locator('#budgetClose').click();
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();await page.locator('#planAddTask').click();
 await page.fill('#taskTitle','Tarea solo de B');await page.fill('#taskStart','2027-06-01');await page.fill('#taskEnd','2027-06-03');await page.locator('#taskSave').click();await page.locator('#planSave').click();await page.locator('#planClose').click();
 await openProject(page,'ent_qa-a');const A2=await snap(page),A2B=(await budgetNow(page)).budget;
 S.check('EX-06.3','Vuelta a A: mismo plan, mismas tareas, mismas entregas',A2.record.schedule.id===A.record.schedule.id&&A2.record.schedule.tasks.length===A.record.schedule.tasks.length&&A2.record.deliveries.length===A.record.deliveries.length);
 S.check('EX-06.4','Vuelta a A: precio de pintura de A (no el 99 de B)',A2B.items.find(i=>i.id==='paint').unitPrice===AB.items.find(i=>i.id==='paint').unitPrice,{observed:A2B.items.find(i=>i.id==='paint').unitPrice});
 await reopen(page);const A3=await snap(page);await openProject(page,'ent_qa-b');const B3=await snap(page);
 S.check('EX-06.5','Tras recargar: A y B conservan sus planes separados',A3.record.schedule.tasks.length===11&&B3.record.schedule.tasks.length===1&&B3.record.schedule.tasks[0].title==='Tarea solo de B');
 S.check('EX-06.6','Claves de registro distintas aunque los ids se parezcan (prefijo común)',A3.subject.id!==B3.subject.id&&!!A3.record&&!!B3.record);
 await shot(page,'ex06-proyecto-B',{escenario:'Aislamiento'});await openProject(page,'ent_qa-a');set(await dump(page));
 }finally{await close(s);}
}));

/* EX-07 · Evolución 4D completa día a día, retroceso, simultaneidad, ilustraciones y fidelidad. */
test('EX-07 evolución 4D día a día: Gantt, escena, tarjeta y costes; retroceso; ilustraciones',{timeout:600000},()=>run('EX-07','Evolución 4D completa','Evolución',async S=>{
 const s=await boot({state:get()}),{page,log}=s;
 try{
 // Andamio ilustrativo en Estructura (por la UI)
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();const P0=await plan(page);
 await page.locator(`[data-edit="${P0.tasks.find(t=>t.title==='Estructura').id}"]`).click();await page.locator('#taskElements input[data-element="illustrative/scaffold"]').check();
 await page.locator('#taskElements label:has(input[data-element="illustrative/scaffold"]) select').selectOption('temporary');await page.locator('#taskSave').click();await page.locator('#planSave').click();await page.locator('#planClose').click();
 const {frame:f,ms:openMs}=await openEvolution(page);S.metric('abrir-evolucion-150',openMs,'ms');
 const res=await f.evaluate(()=>{const F=window.__ft3dFidelity,S=window.FloorPlanConstructionSchedule,tl=F.timeline,bad=[];let maxActive=0,days=0;const t0=performance.now();
  for(let p=0;p<tl.positions;p++){const d=new Date(Date.parse(tl.preStartDate+'T00:00:00Z')+p*864e5).toISOString().slice(0,10);const last=F.setDate(d);days++;
   const exp=S.stateAt(F.ctx.schedule,d).tasks.filter(t=>t.plannedPhase==='in-progress').map(t=>t.id).sort(),got=[...(last.activeTaskIds||[])].sort();maxActive=Math.max(maxActive,got.length);
   const cursor=document.querySelector('#gantt [data-role=cursor]')?.dataset.date,card=document.getElementById('cardDate').textContent;
   if(JSON.stringify(exp)!==JSON.stringify(got)||cursor!==d)bad.push({d,exp,got,cursor});}
  return {bad:bad.slice(0,5),nbad:bad.length,days,maxActive,msPerDay:(performance.now()-t0)/days};});
 S.check('EX-07.1','Cada día: tareas activas (escena/tarjeta) = motor y cursor del Gantt = fecha',res.nbad===0,{observed:res});S.metric('scrub-por-dia',Math.round(res.msPerDay*10)/10,'ms/día',{dias:res.days});
 S.check('EX-07.2','Hay días con varias tareas simultáneas',res.maxActive>=3,{observed:res.maxActive});
 // Retroceso: el estado de un día anterior se restituye idéntico
 const stateOf=d=>f.evaluate(d=>{const l=window.__ft3dFidelity.setDate(d);return JSON.stringify({a:l.activeTaskIds,p:l.presentElements?.length,m:l.modes});},d);
 const x1=await stateOf('2027-04-10');await stateOf('2027-05-10');const x2=await stateOf('2027-04-10');S.check('EX-07.3','Retroceder a una fecha restituye exactamente su estado',x1===x2);
 // Tareas sin geometría en la tarjeta
 await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-03-05'));S.check('EX-07.4','Cimentación (sin geometría) aparece en la tarjeta',/Cimentación[\s\S]*sin representación 3D/.test(await f.locator('#cardTasks').innerText()),{observed:await f.locator('#cardTasks').innerText()});
 // Ilustraciones: dibujadas pero no cuentan como elementos ni importes
 await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-03-18'));await page.waitForTimeout(300);await shot(page,'ex07-andamio-ilustrativo',{escenario:'Ilustración'});
 const ill=await f.evaluate(()=>{const m=window.__ft3dFidelity.ctx.model;return {ill:(m.illustrative||[]).length,elems:m.coverage.elements.scheduled,inInv:m.inventory.elements.some(e=>e.key.startsWith('illustrative/')),cost:m.costs.report.byTask.find(t=>t.taskId===m.planning&&0)};});
 S.check('EX-07.5','El andamio es una ilustración y no un elemento del proyecto',ill.ill===1&&!ill.inInv,{observed:ill});
 const card=await f.locator('#cardTasks').innerText();S.check('EX-07.6','La tarjeta lo rotula como ilustración',/andamio \(ilustración\)/i.test(card),{observed:card.slice(0,300)});
 // Coherencia material/partida/tarea (M2-UX-DEMO-03, sobre nuestra obra)
 const P=await plan(page),floors=await page.evaluate(async keys=>{const s=await FloorPlanConstructionContext.snapshot(),inv=FloorPlanConstructionProject.inventory(s.doc);return inv.elements.filter(e=>keys.includes(e.key)).map(e=>({key:e.key,mat:e.material?.id}));},[...(P.tasks.find(t=>t.title==='Pavimentos').elements||[]).map(e=>e.elementId),...(P.tasks.find(t=>t.title==='Pavimentos').elementIds||[])]);
 const items=(P.tasks.find(t=>t.title==='Pavimentos').budgetAllocations||[]).map(a=>a.itemId).concat(P.tasks.find(t=>t.title==='Pavimentos').budgetItemIds||[]);
 const incoh=floors.filter(e=>!items.includes('floor:'+e.mat));S.check('EX-07.7','Cada suelo vinculado a «Pavimentos» tiene su partida de material en la misma tarea',!incoh.length,{observed:{floors,items}});
 // Composición Gate D presente
 const comp=await f.evaluate(()=>['stage','gantt','cardDate','play'].every(id=>document.getElementById(id))&&document.querySelectorAll('.cams [data-view]').length===5);
 S.check('EX-07.8','Composición Gate D: visor, 5 cámaras, transporte, tarjeta y Gantt',comp);
 await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-04-20'));await page.waitForTimeout(300);await shot(page,'ex07-simultaneas',{escenario:'Simultáneas 20/04'});
 await f.evaluate(()=>window.__ft3dFidelity.end());await page.waitForTimeout(300);await shot(page,'ex07-final',{escenario:'Fin del plan'});
 S.check('EX-07.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});set(await dump(page));
 }finally{await close(s);}
}));

/* EX-08 · Edificio de dos plantas (DEC-06) y revisión del sujeto en el presupuesto (DEC-07). */
test('EX-08 edificio de dos plantas: DEC-06 y DEC-07',{timeout:420000},()=>run('EX-08','Edificio dos plantas · DEC-06/DEC-07','Edificio',async S=>{
 const s=await boot({state:get()}),{page,log}=s;
 try{
 await openProject(page,'ent_qa-c');const c=await snap(page);S.check('EX-08.1','Sujeto edificio con 2 plantas y planta activa',c.subject.type==='building'&&c.subject.levels.length===2,{observed:c.subject});
 await openBudget(page);const ground=(await budgetNow(page)).budget;await page.locator('#budgetVat').selectOption('10');for(const it of ground.items.slice(0,3))await setPriceUI(page,it.id,20);await page.locator('#budgetClose').click();
 if(await page.locator('#professionalWorkspace').isVisible())await page.locator('#professionalWorkspace .professional-head button').first().click();
 const lv=page.locator('#levelBar button',{hasText:/primera/i});S.check('EX-08.2','La barra de plantas permite cambiar de planta',await lv.count()>0);if(await lv.count())await lv.first().click();await page.waitForTimeout(600);
 const up=await snap(page);S.check('EX-08.3','Planta activa cambiada, mismo sujeto edificio',up.subject.id===c.subject.id&&up.subject.activeLevelId!==c.subject.activeLevelId,{observed:[c.subject.activeLevelId,up.subject.activeLevelId]});
 await openBudget(page);const upper=(await budgetNow(page)).budget;for(const it of upper.items.slice(0,2))await setPriceUI(page,it.id,30);await page.locator('#budgetClose').click();
 S.check('EX-08.4','Cada planta tiene su propio presupuesto (sujetos distintos)',ground.subject.id!==upper.subject.id,{observed:[ground.subject.id,upper.subject.id]});
 const common=ground.items.map(i=>i.id).filter(x=>upper.items.some(u=>u.id===x));S.note('Partidas con el mismo id en ambas plantas (comunes conceptuales): '+common.join(', '));
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();await page.locator('#planAddTask').click();
 const t=await page.locator('#taskForm').innerText();S.check('EX-08.5','El editor explica que un plan de edificio no reparte partidas (DEC-06)',/todavía no tiene presupuesto de edificio/.test(t));
 const lvKeys=await page.evaluate(()=>[...document.querySelectorAll('#taskElements input[data-element]')].map(i=>i.dataset.element.split('/')[0]));S.check('EX-08.6','El plan de edificio ofrece elementos de ambas plantas',new Set(lvKeys.filter(k=>k!=='illustrative')).size===2,{observed:[...new Set(lvKeys)]});
 await page.fill('#taskTitle','Tabiquería ambas plantas');await page.fill('#taskStart','2027-03-01');await page.fill('#taskEnd','2027-03-20');
 const els=await page.evaluate(()=>{const byLv={};for(const i of document.querySelectorAll('#taskElements input[data-element]')){const lv=i.dataset.element.split('/')[0];if(lv!=='illustrative'&&!byLv[lv])byLv[lv]=i.dataset.element;}return Object.values(byLv);});
 for(const k of els)await page.locator(`#taskElements input[data-element="${k}"]`).check();await page.locator('#taskSave').click();await page.locator('#planSave').click();
 await page.locator('#planTab-items').click();const txt=await page.locator('#planDialog').innerText();
 S.check('EX-08.7','Partidas: presupuestos por planta listados, sin «Total del edificio»',/Presupuestos por planta/.test(txt)&&!/Total del edificio|total del edificio:/i.test(txt),{observed:await page.locator('#planLevelBudgets').innerText()});
 await shot(page,'ex08-edificio-partidas',{escenario:'DEC-06'});
 await page.locator('#planTab-checks').click();const ck=await page.locator('#planCorrespondence').innerText();
 S.check('EX-08.8','DEC-07: presupuesto ↔ revisión del proyecto «no comprobable», nunca coincidencia',/no comprobable/.test(ck),{observed:ck});await page.locator('#planClose').click();
 const {frame:f}=await openEvolution(page);const costs=await f.evaluate(()=>window.__ft3dFidelity.ctx.model.costs);
 S.check('EX-08.9','Evolución del edificio: sin reparto de importes (no inventa total)',costs.status==='unavailable'&&/building|level/.test(costs.reason),{observed:{status:costs.status,reason:costs.reason}});
 const shown=await f.locator('body').innerText();S.check('EX-08.10','Evolución del edificio no muestra un importe global',!/asignado [\d.]+,\d{2}\s?€/.test(shown),{observed:(shown.match(/asignado[^\n]{0,60}/)||[''])[0]});
 await shot(page,'ex08-edificio-evolucion',{escenario:'DEC-06 evolución'});
 // ¿El panel Entregar/C4 suma plantas? (no debe)
 await page.locator('#evolutionBack').click();await area(page,'deliver');const del=await page.locator('#professionalWorkspace').innerText();S.note('Entregar (edificio): '+(del.match(/Presupuesto[^\n]{0,120}/)||[''])[0]);
 S.check('EX-08.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});set(await dump(page));
 }finally{await close(s);}
}));

/* EX-09 · Catastro y emplazamiento: GML sintético, colocación, reapertura, GML inválido, caída del servicio, política. */
test('EX-09 Catastro/GML: asociación, colocación, rechazo, caída simulada y política de exportación',{timeout:420000},()=>run('EX-09','Catastro, emplazamiento y resiliencia','Territorio',async S=>{
 let s=await boot({state:get()}),{page,log}=s;
 try{
 await openProject(page,'ent_qa-p');await area(page,'analyze');await page.locator('[data-route="territory"]').click();await page.waitForSelector('#territoryDialog[open]');
 S.check('EX-09.1','GML sigue siendo la fuente por defecto',await page.locator('#territoryProvider').inputValue()==='catastro-inspire-cp');
 await page.setInputFiles('#territoryFile',path.join(H.ROOT,'tests','fixtures','catastro-cp-synthetic.gml'));await page.locator('#territoryImport').click();await page.waitForSelector('#territoryCard:not([hidden])');
 await page.locator('#territorySave').click();await page.waitForFunction(()=>!!FloorPlanApp.project.site?.parcel);
 S.check('EX-09.2','Parcela GML guardada con su referencia y CRS; la vivienda no se mueve sola',await page.evaluate(()=>{const s=FloorPlanApp.project.site;return s.parcel.reference==='1907401VK4810H'&&s.parcel.sourceCrs==='EPSG:25830'&&!s.buildingPlacement;}));
 await page.locator('#territoryPlacementPreview svg').click();await page.locator('#territoryPlacementSave').click();await page.waitForFunction(()=>!!FloorPlanApp.project.site.buildingPlacement);
 await shot(page,'ex09-emplazamiento',{escenario:'GML + colocación'});const saved=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.site));
 // GML inválido (CRS no admitido): rechazo sin perder lo guardado
 const bad=fss.readFileSync(path.join(H.ROOT,'tests','fixtures','catastro-cp-synthetic.gml'),'utf8').replace(/EPSG\/0\/25830/g,'EPSG/0/4326');
 await page.setInputFiles('#territoryFile',{name:'parcela-crs-4326.gml',mimeType:'application/gml+xml',buffer:Buffer.from(bad)});await page.locator('#territoryImport').click();await page.waitForTimeout(800);
 const st=await page.locator('#territoryStatus').innerText();S.check('EX-09.3','GML con CRS no admitido: rechazo con mensaje claro',/no soportado|no admitid/i.test(st),{observed:st});
 S.check('EX-09.4','Tras el rechazo, la parcela y la colocación guardadas no cambian',await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.site))===saved);
 await page.locator('#territoryClose').click();set(await dump(page));await close(s);
 // Caída simulada del servicio oficial
 s=await boot({state:get(),catastro:'down'});page=s.page;await openProject(page,'ent_qa-p');await area(page,'analyze');await page.locator('[data-route="territory"]').click();
 await page.locator('#territoryProvider').selectOption('catastro-inspire-wfs');await page.fill('#territoryLookupReference','1907401VK4810H');await page.locator('#territoryLookup').click();
 await page.waitForFunction(()=>/Catastro/.test(document.getElementById('territoryStatus').textContent));const down=await page.locator('#territoryStatus').innerText();
 S.check('EX-09.5','Servicio caído: mensaje en castellano, sin códigos',/No se ha podido consultar el Catastro/.test(down)&&!/network-unavailable/.test(down),{observed:down});
 S.check('EX-09.6','Servicio caído: la parcela guardada se conserva',await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.site))===saved);await shot(page,'ex09-servicio-caido',{escenario:'Caída simulada'});
 await page.locator('#territoryClose').click();
 await openProject(page,'ent_qa-a');S.check('EX-09.7','Cambio de proyecto: la vivienda A no hereda la parcela',await page.evaluate(()=>!FloorPlanApp.project.site?.parcel));
 await openProject(page,'ent_qa-p');S.check('EX-09.8','Vuelta al proyecto P: la parcela sigue igual',await page.evaluate(()=>JSON.stringify(FloorPlanApp.project.site))===saved);
 // Política de exportación: entrega HTML del proyecto con parcela restringida
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();await page.locator('#planAddTask').click();await page.fill('#taskTitle','Obra P');await page.fill('#taskStart','2027-03-01');await page.fill('#taskEnd','2027-03-10');
 await page.locator('#taskElements input[data-element]').first().check();await page.locator('#taskSave').click();await page.locator('#planSave').click();await page.locator('#planClose').click();
 const {frame:f}=await openEvolution(page,{mode:'deliver'});const html=await f.evaluate(async()=>(await window.__ft3dDelivery.prepareDocument()).html);
 const coord=await page.evaluate(()=>FloorPlanApp.project.site.parcel.sourceGeometry.polygons[0].rings[0].slice(0,3).map(p=>String(p[0])));
 S.check('EX-09.9','La entrega HTML no contiene la geometría restringida de la parcela',coord.every(c=>!html.includes(c)),{observed:coord.filter(c=>html.includes(c))});
 S.note('PNOA y MDT05: NOT_RUN en este examen (no se cargan capas ráster; requieren red/licencia y su integración no está en el alcance M2).');
 S.notRun('EX-09.10','PNOA/MDT05 integrales','No ejecutado: sin carga de capas en este examen');
 S.check('EX-09.Z','Sin errores JavaScript',!s.log.errors.length,{observed:s.log.errors.slice(0,5)});set(await dump(page));
 }finally{await close(s);}
}));

/* EX-10 · Entrega local MP4 + HTML con marca de Mi estudio; histórico e invalidación por precio, tarea y marca. */
test('EX-10 entrega local MP4 y HTML con marca; abrir archivos; histórico e invalidación',{timeout:900000},()=>run('EX-10','Entrega local y revisión histórica','Entregar',async S=>{
 const s=await boot({state:get()}),{page,log}=s;
 try{
 await openProject(page,'ent_qa-a');
 await page.evaluate(()=>{const B=FloorPlanBrand,p=B.saveProfile(localStorage,{name:'Estudio Ficticio QA',person:'Arquitecta Sintética',email:'estudio@example.test',tagline:'Datos de prueba'});B.setDelivery(localStorage,FloorPlanApp.entryId,{profileId:p.id});});
 S.note('La marca se crea con FloorPlanBrand (núcleo de Mi estudio, misma clave de almacenamiento que su UI); el formulario de Mi estudio no se ha recorrido en este escenario.');
 const {frame:f}=await openEvolution(page,{mode:'deliver'});
 S.check('EX-10.1','La entrega usa la firma de Mi estudio del proyecto',/Firma de este proyecto \(Mi estudio\): Estudio Ficticio QA/.test(await f.locator('#brandSel').innerText()));
 S.check('EX-10.2','Publicación remota bloqueada',!(await f.locator('#publishBox').isVisible())&&/desactivado/.test(await f.locator('#publishOff').textContent()));
 const t0=Date.now();const v=await f.evaluate(async()=>{if(typeof VideoEncoder==='undefined')return {skip:'sin WebCodecs'};await window.__ft3dDelivery.record();const vv=window.__ft3dDelivery.state.video;return vv?{bytes:vv.blob.size,type:vv.blob.type,name:vv.filename}:{skip:'sin vídeo'};});
 S.metric('exportar-mp4',Date.now()-t0,'ms',v);
 if(v.skip)S.blocked('EX-10.3','MP4 generado',v.skip);else S.check('EX-10.3','MP4 generado (H.264 indexado)',v.type==='video/mp4'&&v.bytes>10000,{observed:v});
 // Descargas reales de ambos archivos
 await f.evaluate(async()=>{await window.__ft3dDelivery.prepareDocument();});await page.waitForTimeout(400);await f.evaluate(()=>{for(const id of ['step5','resultMore'])document.getElementById(id)?.setAttribute('open','');});
 const dl=async sel=>{const p=page.waitForEvent('download');await f.locator(sel).click();const d=await p;const dst=path.join(H.EVID,'entrega-'+d.suggestedFilename().replace(/[^\w.-]/g,'_'));await d.saveAs(dst);return dst;};
 const mp4=v.skip?null:await dl('#videoDownload'),htmlFile=await dl('#docDownload');
 if(mp4){await H.registerEvidence(mp4,{tipo:'entrega-mp4',escenario:'EX-10'});const insp=await page.evaluate(b=>FloorPlanConstructionMp4?FloorPlanConstructionMp4.inspect(new Uint8Array(b)):null,[...fss.readFileSync(mp4)]).catch(()=>null);
  const insp2=await f.evaluate(async()=>{const vv=window.__ft3dDelivery.state.video;return window.FloorPlanConstructionMp4.inspect(new Uint8Array(await vv.blob.arrayBuffer()));});
  S.check('EX-10.4','El MP4 descargado es un MP4 indexado válido',insp2.valid===true,{observed:{valid:insp2.valid,codec:insp2.codec,w:insp2.width,h:insp2.height,samples:insp2.sampleCount}});}
 await H.registerEvidence(htmlFile,{tipo:'entrega-html',escenario:'EX-10'});const html=fss.readFileSync(htmlFile,'utf8'),h0=sha(fss.readFileSync(htmlFile));
 // Abrir el HTML descargado como lo haría el cliente (archivo local)
 const viewer=await s.context.newPage();await viewer.goto('file://'+htmlFile);await viewer.waitForTimeout(800);const vt=await viewer.locator('body').innerText();
 await viewer.screenshot({path:path.join(H.EVID,'ex10-html-abierto.jpg'),type:'jpeg',quality:80});await H.registerEvidence(path.join(H.EVID,'ex10-html-abierto.jpg'),{tipo:'captura',escenario:'HTML abierto'});
 S.check('EX-10.5','El HTML abierto muestra proyecto, marca y tareas',/Vivienda QA obra nueva/.test(vt)&&/Estudio Ficticio QA/.test(vt)&&/Pavimentos|Pintura/.test(vt),{observed:vt.slice(0,300)});
 S.check('EX-10.6','El HTML no contiene controles editables ni la biblioteca',!/<input|<textarea|contenteditable|rubik-sota-project-library/i.test(html));
 S.check('EX-10.7','El HTML dice que es obra prevista (simulación), no ejecutada',/previst|simulaci/i.test(vt),{observed:(vt.match(/[^\n]*(previst|simulaci)[^\n]*/i)||[''])[0]});
 await viewer.close();
 // Cambios posteriores: precio, tarea y marca → la entrega queda desactualizada con los tres aspectos
 await page.locator('#evolutionBack').click();await openBudget(page);await setPriceUI(page,'skirting',11.4);await page.locator('#budgetClose').click();
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();const P=await plan(page);await page.locator(`[data-edit="${P.tasks.find(t=>t.title==='Pintura y acabados').id}"]`).click();await page.fill('#taskTitle','Pintura y acabados finales');await page.locator('#taskSave').click();await page.locator('#planSave').click();await page.locator('#planClose').click();
 await page.evaluate(()=>{const B=FloorPlanBrand,p=B.readProfiles(localStorage).profiles.find(x=>x.name==='Estudio Ficticio QA');B.saveProfile(localStorage,{...p,name:'Estudio Ficticio QA Renombrado'});});
 await area(page,'analyze');await area(page,'deliver');await page.waitForSelector('#deliveryState');const ds=await page.locator('#deliveryState').innerText();
 S.check('EX-10.8','Entrega anterior desactualizada: presupuesto, plan y firma nombrados',/presupuesto/.test(ds)&&/plan de obra/.test(ds)&&/firma/.test(ds),{observed:ds});await shot(page,'ex10-entrega-desactualizada',{escenario:'Invalidación'});
 S.check('EX-10.9','El archivo HTML descargado antes no cambia',sha(fss.readFileSync(htmlFile))===h0);
 const n0=(await snap(page)).record.deliveries.length;const {frame:f2}=await openEvolution(page,{mode:'deliver'});const doc2=await f2.evaluate(async()=>{const d=await window.__ft3dDelivery.prepareDocument();return d.html;});
 S.check('EX-10.10','La nueva entrega lleva la marca renombrada',/Estudio Ficticio QA Renombrado/.test(doc2));
 await page.locator('#evolutionBack').click();const rec=(await snap(page)).record;S.check('EX-10.11','Histórico: se añade una entrega y las anteriores se conservan',rec.deliveries.length===n0+1,{observed:[n0,rec.deliveries.length]});
 S.check('EX-10.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});set(await dump(page));
 }finally{await close(s);}
}));

/* EX-11 · UX: escritorio (4), zoom 125/150 %, móvil 390×844 y 844×390 (vídeo 3), teclado y foco. */
const VPS=[[1280,720],[1366,768],[1440,900],[1920,1080]];
for(const [w,h] of VPS)test(`EX-11 escritorio ${w}×${h}: encaje de Evolución dentro de RUBIK`,{timeout:240000},()=>run(`EX-11-${w}`,`Escritorio ${w}×${h}`,'UX',async S=>{
 const s=await boot({state:get(),viewport:{width:w,height:h}}),{page}=s;
 try{const {frame:f}=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-04-20'));await page.waitForTimeout(400);
  const b=await f.evaluate(()=>{const r=id=>{const e=document.getElementById(id)||document.querySelector(id),q=e.getBoundingClientRect();return {t:Math.round(q.top),b:Math.round(q.bottom),h:Math.round(q.height)};};return {vh:innerHeight,scroll:document.documentElement.scrollHeight>innerHeight+1,stage:r('stage'),transport:r('.transport'),card:r('cardDate'),gantt:r('gantt')};});
  for(const k of ['stage','transport','card','gantt'])S.check(`EX-11-${w}.${k}`,`${k} dentro de la ventana`,b[k].t>=0&&b[k].b<=b.vh+1,{observed:b[k]});
  S.check(`EX-11-${w}.scroll`,'Sin scroll de página en Evolución',!b.scroll);await shot(page,`ex11-evolucion-${w}x${h}`,{escenario:'Escritorio'});
 }finally{await close(s);}
}));
for(const z of [1.25,1.5])test(`EX-11 zoom ${z*100} % (1366×768)`,{timeout:240000},()=>run(`EX-11-zoom${z*100}`,`Zoom ${z*100} % sobre 1366×768`,'UX',async S=>{
 // Zoom de navegador emulado: viewport CSS = 1366/z × 768/z con deviceScaleFactor z (mismo efecto de maquetación).
 const s=await boot({state:get(),viewport:{width:Math.round(1366/z),height:Math.round(768/z)},deviceScaleFactor:z}),{page}=s;
 try{const {frame:f}=await openEvolution(page);await f.evaluate(()=>window.__ft3dFidelity.setDate('2027-04-20'));await page.waitForTimeout(400);
  const b=await f.evaluate(()=>{const r=id=>{const e=document.getElementById(id)||document.querySelector(id),q=e.getBoundingClientRect();return {t:Math.round(q.top),b:Math.round(q.bottom),h:Math.round(q.height)};};return {vh:innerHeight,vw:innerWidth,hs:document.documentElement.scrollWidth>innerWidth+1,stage:r('stage'),gantt:r('gantt'),card:r('cardDate')};});
  // Gate D aprobado (b12b925, ft3d-8-fit «browser zoom»): por debajo de 560 px de alto la Evolución pasa a disposición apilada con
  // desplazamiento vertical, sin nada cortado. Se comprueba ESA promesa (no que todo quepa sin desplazar) y, aparte, la barra de RUBIK.
  const stacked=b.vh<560,pageH=await f.evaluate(()=>document.documentElement.scrollHeight);
  S.check(`EX-11-z${z}.1`,stacked?'Disposición apilada (Gate D): visor, tarjeta y Gantt renderizados y alcanzables con desplazamiento vertical':'Visor, tarjeta y Gantt visibles',
   stacked?['stage','gantt','card'].every(k=>b[k].h>0&&b[k].b<=pageH+1)&&pageH>b.vh:['stage','gantt','card'].every(k=>b[k].t>=0&&b[k].b<=b.vh+1&&b[k].h>0),{observed:{...b,pageH}});
  const bar=await page.evaluate(()=>{const br=document.querySelector('.cx-evolution-bar'),h2=br?.querySelector('h2'),vw=innerWidth;const out=[...br.querySelectorAll('button')].filter(x=>{const r=x.getBoundingClientRect();return r.width>0&&(r.right>vw+1||r.left<-1);}).map(x=>x.textContent.trim());
   return {overflow:br.scrollWidth>br.clientWidth+1,h2Lines:h2?Math.round(h2.getBoundingClientRect().height/parseFloat(getComputedStyle(h2).lineHeight||'20')):0,h2H:h2?Math.round(h2.getBoundingClientRect().height):0,cut:out};});
  S.check(`EX-11-z${z}.4`,'Barra de RUBIK sin desbordar: nombre en una línea y ningún botón cortado',!bar.overflow&&!bar.cut.length&&bar.h2H<=32,{observed:bar});S.check(`EX-11-z${z}.2`,'Sin scroll horizontal',!b.hs);
  await shot(page,`ex11-zoom-${z*100}`,{escenario:'Zoom'});
  await page.locator('#evolutionBack').click();await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
  S.check(`EX-11-z${z}.3`,'Plan de obra sin desbordamiento horizontal',await page.evaluate(()=>{const d=document.getElementById('planDialog');return d.scrollWidth<=d.clientWidth+1;}));await shot(page,`ex11-zoom-${z*100}-plan`,{escenario:'Zoom plan'});
 }finally{await close(s);}
}));
test('EX-11 móvil (vídeo 3): Plan de obra, navegación de Evolución, controles, teclado y foco',{timeout:480000},()=>run('EX-11-movil','Móvil 390×844 y 844×390 (vídeo 3)','UX',async S=>{
 const s=await boot({state:get(),video:'v3',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),{page}=s;
 try{
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 const foot=await page.evaluate(()=>{const f=document.querySelector('#planDialog .cx-foot'),st=document.getElementById('planStatus'),bs=[...f.querySelectorAll('button')].map(b=>b.getBoundingClientRect());const r=st.getBoundingClientRect();
  const overlap=bs.some(q=>r.width>0&&!(q.right<=r.left||q.left>=r.right||q.bottom<=r.top||q.top>=r.bottom));return {statusW:Math.round(r.width),statusH:Math.round(r.height),overlap,footH:Math.round(f.getBoundingClientRect().height),buttons:bs.map(q=>[Math.round(q.width),Math.round(q.height)])};});
 // Provocar un mensaje de estado (guardar sin cambios no aplica: editar y guardar)
 await page.locator('#planTab-tasks').click();const first=page.locator('#planTasks [data-edit]').first();await first.click();await page.locator('#taskSave').click();await page.locator('#planSave').click();await page.waitForTimeout(300);
 const foot2=await page.evaluate(()=>{const st=document.getElementById('planStatus'),r=st.getBoundingClientRect(),lh=parseFloat(getComputedStyle(st).lineHeight)||20;return {text:st.textContent,w:Math.round(r.width),h:Math.round(r.height),lines:Math.round(r.height/lh)};});
 await shot(page,'ex11-movil-plan-pie',{escenario:'M2-UX-MOB-01'});
 S.check('EX-11-m.1','M2-UX-MOB-01: el mensaje del pie no queda comprimido (≥ 200 px de ancho o ≤ 3 líneas)',foot2.w>=200||foot2.lines<=3,{observed:{foot,foot2}});
 const small=foot.buttons.filter(([bw,bh])=>bh<44);S.check('EX-11-m.2','Botones del pie con altura táctil ≥ 44 px',!small.length,{observed:foot.buttons});
 await page.locator('#planClose').click();
 const {frame:f}=await openEvolution(page);await page.waitForTimeout(500);
 const nav=await page.evaluate(()=>{const n=document.querySelector('.cx-steps'),ent=document.querySelector('.cx-step[data-step="entrega"]');const r=ent.getBoundingClientRect(),nr=n.getBoundingClientRect();return {sw:n.scrollWidth,cw:n.clientWidth,ox:getComputedStyle(n).overflowX,entVisible:r.left>=nr.left-1&&r.right<=nr.right+1,stepH:Math.round(ent.getBoundingClientRect().height)};});
 await shot(page,'ex11-movil-evolucion-nav',{escenario:'M2-UX-MOB-02'});
 S.note('Navegación de Evolución en móvil: '+JSON.stringify(nav));
 await page.locator('.cx-step[data-step="entrega"]').focus();const after=await page.evaluate(()=>{const n=document.querySelector('.cx-steps'),r=document.querySelector('.cx-step[data-step="entrega"]').getBoundingClientRect(),nr=n.getBoundingClientRect();return r.left>=nr.left-1&&r.right<=nr.right+1;});
 S.check('EX-11-m.3','M2-UX-MOB-02: «Entregar» alcanzable (desplazamiento horizontal o visible) con foco de teclado',nav.entVisible||(nav.ox==='auto'&&after),{observed:{...nav,afterFocus:after}});
 await page.locator('.cx-steps').evaluate(n=>n.scrollTo({left:n.scrollWidth}));await page.waitForTimeout(200);await shot(page,'ex11-movil-evolucion-nav-desplazada',{escenario:'M2-UX-MOB-02 desplazada'});
 S.check('EX-11-m.4','Pasos de la barra con altura táctil ≥ 44 px',nav.stepH>=44,{observed:nav.stepH});
 await page.locator('.cx-step[data-step="entrega"]').tap();await page.waitForTimeout(400);S.check('EX-11-m.5','Tocar «Entregar» cambia la evolución a la entrega',await f.evaluate(()=>document.body.dataset.tab)==='entrega');
 await page.locator('.cx-step[data-step="evolucion"]').tap();await f.locator('#play').tap();await page.waitForTimeout(1500);await f.locator('#play').tap();await shot(page,'ex11-movil-evolucion-reproduccion',{escenario:'Controles móviles'});
 S.check('EX-11-m.6','Evolución móvil sin scroll horizontal',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 // Apaisado 844×390
 await page.setViewportSize({width:844,height:390});await page.waitForTimeout(600);await shot(page,'ex11-movil-apaisado',{escenario:'844×390'});
 S.check('EX-11-m.7','Apaisado: sin scroll horizontal',await f.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 }finally{await close(s,'v3-movil');}
}));
test('EX-11 teclado, foco visible, restauración de foco y movimiento reducido',{timeout:240000},()=>run('EX-11-teclado','Teclado, foco y movimiento reducido','UX',async S=>{
 const s=await boot({state:get(),reducedMotion:'reduce'}),{page}=s;
 try{await area(page,'budget');const btn=page.locator('[data-route="construction-plan"]');await btn.focus();await page.keyboard.press('Enter');await page.waitForSelector('#planDialog[open]');
  S.check('EX-11-k.1','El diálogo se abre con teclado',await page.locator('#planDialog').isVisible());
  await page.locator('#planTab-tasks').focus();const ring=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement,':focus-visible');return getComputedStyle(document.activeElement).outlineStyle+' '+getComputedStyle(document.activeElement).outlineWidth;});
  await page.keyboard.press('ArrowRight');S.check('EX-11-k.2','Pestañas con flechas',await page.evaluate(()=>document.activeElement.id)==='planTab-items');
  await page.keyboard.press('Escape');await page.waitForTimeout(300);const fe=await page.evaluate(()=>document.activeElement?.dataset?.route||document.activeElement?.id||document.activeElement?.tagName);
  S.check('EX-11-k.3','Al cerrar con Escape el foco vuelve al botón que abrió el diálogo',fe==='construction-plan',{observed:fe});
  const {frame:f}=await openEvolution(page);await page.keyboard.press('Escape');await page.waitForTimeout(300);S.check('EX-11-k.4','Escape cierra la Evolución y vuelve a RUBIK',await page.locator('#evolutionOverlay').isHidden());
  const rm=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);S.check('EX-11-k.5','Preferencia de movimiento reducido detectada por la página',rm);
  S.partial('EX-11-k.6','Movimiento reducido aplicado en la animación 3D','Solo se verifica la detección; la cámara automática de Gate D no se ha medido frame a frame');
 }finally{await close(s);}
}));

/* EX-12 · Robustez: versión de registro desconocida, registro corrupto, presupuesto sin precios, sesión sin guardar. */
test('EX-12 robustez de persistencia: versión desconocida, corrupto y presupuesto sin precios',{timeout:300000},()=>run('EX-12','Persistencia y recuperación','Persistencia',async S=>{
 const st={...get()},rec=JSON.parse(st['rubik-construction-v1']);rec.schemaVersion='9.9.9';
 const s=await boot({state:{...st,'rubik-construction-v1':JSON.stringify(rec)}}),{page,log}=s;
 try{await area(page,'budget');const card=await page.locator('#constructionPlanCard').innerText();S.check('EX-12.1','Versión desconocida: se explica y no se usa',/versión que esta versión de RUBIK no sabe leer/.test(card),{observed:card});
  await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
  const err=await page.locator('#planError').textContent();S.check('EX-12.2','El editor muestra el error y no ofrece un plan vacío como si no existiera',/no sabe leer/.test(err||''),{observed:{err,empty:await page.locator('#planEmpty').count()}});
  if(await page.locator('#planCreate').count()){await page.locator('#planCreate').click();await page.locator('#planSave').click();await page.waitForTimeout(300);}
  const raw=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-construction-v1')).schemaVersion);S.check('EX-12.3','Los datos de versión desconocida no se sobrescriben',raw==='9.9.9',{observed:raw});
  await page.locator('#planClose').click().catch(()=>{});if(await page.locator('#planDiscard').isVisible().catch(()=>false))await page.locator('#planDiscard').click();
  await page.evaluate(()=>localStorage.setItem('rubik-construction-v1','{roto'));await area(page,'analyze');await area(page,'budget');
  S.check('EX-12.4','Registro corrupto: mensaje y sin bloqueo',/no son válidos/.test(await page.locator('#constructionPlanCard').innerText()),{observed:await page.locator('#constructionPlanCard').innerText()});
  await openProject(page,'ent_qa-p');await area(page,'deliver');const alive=await Promise.race([page.evaluate(()=>1),new Promise(r=>setTimeout(()=>r(0),8000))]);S.check('EX-12.5','Entregar con presupuesto sin precios no bloquea la página',alive===1);
  S.check('EX-12.Z','Sin errores JavaScript no controlados',!log.errors.length,{observed:log.errors.slice(0,5)});
 }finally{await close(s);}
}));

/* EX-13 · Rendimiento con carga creciente (QA-22 parcial). */
test('EX-13 rendimiento: apertura de Evolución con ~150, ~600 y ~1200 elementos',{timeout:900000},()=>run('EX-13','Rendimiento y carga (QA-22)','Rendimiento',async S=>{
 const lib=JSON.parse(get()['rubik-sota-project-library-v1']);for(const n of [4,8])lib.entries.push({id:'ent_qa-x'+n,name:'Vivienda QA carga x'+n,project:F.viviendaGrande(n)});
 const s=await boot({state:{...get(),'rubik-sota-project-library-v1':JSON.stringify(lib)}}),{page,log}=s;
 try{for(const [ent,label] of [['ent_qa-a','x1'],['ent_qa-x4','x4'],['ent_qa-x8','x8']]){const t0=Date.now();await openProject(page,ent);const tOpen=Date.now()-t0;
   const n=(await inventory(page)).length;
   if(ent!=='ent_qa-a'){await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.locator('#planCreate').click();await page.locator('#planAddTask').click();await page.fill('#taskTitle','Carga');await page.fill('#taskStart','2027-03-01');await page.fill('#taskEnd','2027-03-30');
    await page.evaluate(()=>{let i=0;for(const c of document.querySelectorAll('#taskElements input[data-element]'))if(!c.dataset.element.startsWith('illustrative')&&i++<300)c.checked=true;});const ts=Date.now();await page.locator('#taskSave').click();await page.locator('#planSave').click();S.metric('guardar-plan-'+label,Date.now()-ts,'ms');await page.locator('#planClose').click();}
   const {ms:evo,frame:f}=await openEvolution(page);const scrub=await f.evaluate(()=>{const F=window.__ft3dFidelity,t0=performance.now();for(let i=0;i<20;i++)F.setDate(new Date(Date.parse(F.timeline.preStartDate+'T00:00:00Z')+i*864e5).toISOString().slice(0,10));return (performance.now()-t0)/20;});
   const mem=await f.evaluate(()=>performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null);
   S.metric('abrir-proyecto-'+label,tOpen,'ms',{elementos:n});S.metric('abrir-evolucion-'+label,evo,'ms',{elementos:n});S.metric('scrub-dia-'+label,Math.round(scrub*10)/10,'ms');S.metric('heap-evolucion-'+label,mem,'MiB');
   S.check('EX-13.'+label,`Evolución abre con ${n} elementos en < 30 s`,evo<30000,{observed:evo});await page.locator('#evolutionBack').click();}
  S.partial('EX-13.lim','QA-22 a gran escala','Medido hasta ~1200 elementos en un equipo de 4 vCPU con SwiftShader (sin GPU); no representa hardware de cliente');
  S.check('EX-13.Z','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,5)});
 }finally{await close(s);}
}));
};
