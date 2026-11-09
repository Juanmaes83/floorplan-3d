'use strict';
/* FT3D-8 · EXAMEN FINAL M2/S4 (06/11/2026) — QA end-to-end sobre la app real (index.html) del SHA M2 examinado.
   No modifica código de producto. Datos sintéticos. Cada escenario registra comprobaciones PASS/FAIL/PARTIAL/BLOCKED en
   docs/qa/ft3d-8-m2-examen-final-2026-11-06/resultados.json y termina en rojo si alguna comprobación falla. */
const {test,before,after}=require('node:test'),fs=require('node:fs/promises'),fss=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const H=require('./qa-m2/harness.cjs'),F=require('./qa-m2/obra-sintetica.cjs');
const {scenario,boot,close,dump,shot,area,openProject,openBudget,setPriceUI,budgetNow,snap,inventory,openEvolution,evoFrame,eurParse}=H;
let STATE=null;                                   // estado de la biblioteca/almacenamiento que pasa de un escenario al siguiente
const T=Object.fromEntries([...F.TAREAS,F.HITO].map(t=>[t.id,t]));
before(async()=>{await H.start();STATE={'rubik-sota-project-library-v1':JSON.stringify(F.biblioteca())};});
after(async()=>{await H.write();await H.stop();});
const ms=d=>Date.parse(d+'T00:00:00Z');
async function run(id,titulo,areaName,fn){const S=scenario(id,titulo,areaName);let err=null;try{await fn(S);}catch(e){err=e;}S.finish(err);}

/* Crea una tarea por la UI real del editor de plan; devuelve el id asignado por RUBIK. */
async function addTaskUI(page,t,inv,{milestone=false}={}){
 await page.locator(milestone?'#planAddMilestone':'#planAddTask').click();
 await page.fill('#taskTitle',t.titulo);await page.fill('#taskWbs',t.wbs);await page.fill('#taskStart',t.inicio);if(!milestone)await page.fill('#taskEnd',t.fin);
 for(const [dep,type,lag] of t.deps){await page.locator('#taskAddDep').click();const r=page.locator('#taskForm [data-dep]').last();
  await r.locator('select').first().selectOption({label:`${T[dep].wbs} ${T[dep].titulo}`});await r.locator('select').nth(1).selectOption(type);await r.locator('input').fill(String(lag));}
 const keys=[];if(t.elementos){const sel=t.elementos;keys.push(...inv.filter(e=>e.representable&&(sel.tipo?e.type===sel.tipo:e.type==='wall'&&e.structure===sel.structure)).slice(sel.offset||0,(sel.offset||0)+sel.n).map(e=>e.key));
  for(const k of keys){await page.locator(`#taskElements input[data-element="${k}"]`).check();await page.locator(`#taskElements label:has(input[data-element="${k}"]) select`).selectOption(sel.rol);}}
 for(const [itemId,pct] of t.partidas){await page.locator('#taskAddItem').click();const r=page.locator('#taskForm [data-alloc]').last();await r.locator('select').selectOption(itemId);await r.locator('input').fill(String(pct));}
 await page.locator('#taskSave').click();
 const open=await page.locator('#taskForm').count();
 return {saved:!open,error:open?await page.locator('#taskError').textContent():null,elementKeys:keys};
}
const plan=page=>page.evaluate(async()=>(await FloorPlanConstructionContext.snapshot()).record?.schedule||null);

/* ======================================================================================================================
   EX-01 · Línea base: biblioteca sintética, identidad y estado inicial de cada área. */
test('EX-01 línea base: biblioteca sintética, identidad y capturas iniciales',{timeout:180000},()=>run('EX-01','Línea base y biblioteca sintética','Biblioteca',async S=>{
 const s=await boot({state:STATE}),{page,log}=s;S.metric('carga-app',s.loadMs,'ms');
 const lib=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.map(e=>({id:e.id,name:e.name})));
 S.check('EX-01.1','La biblioteca contiene las 4 entradas sintéticas',lib.length===4,{expected:4,observed:lib.length});
 const sn=await snap(page);S.check('EX-01.2','El sujeto activo es la vivienda principal por id (no por nombre)',sn.subject.id==='prj_qa-vivienda-obra'&&sn.entryId==='ent_qa-a',{expected:'ent_qa-a / prj_qa-vivienda-obra',observed:sn.entryId+' / '+sn.subject.id});
 S.check('EX-01.3','Dos entradas con el mismo nombre visible y distinta identidad',lib.filter(e=>e.name==='Vivienda QA obra nueva').length===2);
 const inv=await inventory(page);const by={};for(const e of inv){const k=e.type+':'+e.lifecycle;by[k]=(by[k]||0)+1;}S.note('Inventario real vivienda principal: '+JSON.stringify(by));S.metric('elementos-vivienda',inv.length,'elementos');
 for(const a of ['analyze','budget','deliver']){await area(page,a);await shot(page,'ex01-inicial-'+a,{escenario:'EX-01',esperado:'Área real con el proyecto sintético',observado:'captura'});}
 S.check('EX-01.4','Sin errores JavaScript al cargar y recorrer las áreas',!log.errors.length,{observed:log.errors.slice(0,3)});
 STATE=await dump(page);await close(s);
}));

/* ======================================================================================================================
   EX-02 · VÍDEO 1 · Recorrido de escritorio: presupuesto A, diez tareas + hito, Gantt/3D, cambio de precio (5.1) y entrega. */
test('EX-02 vídeo 1: recorrido completo de escritorio con revisión A, diez tareas y regreso tras cambiar precio',{timeout:900000},()=>run('EX-02','Recorrido completo escritorio (vídeo 1)','E2E',async S=>{
 const s=await boot({state:STATE,video:'v1',viewport:{width:1440,height:900}}),{page,log}=s;
 try{
 // --- Revisión A del presupuesto, por la UI de Presupuestar ---
 await openBudget(page);await page.locator('#budgetVat').selectOption(String(F.IVA));
 for(const [id,p] of Object.entries(F.PRECIOS_A))await setPriceUI(page,id,p);
 await shot(page,'ex02-presupuesto-revision-A',{escenario:'Revisión A',esperado:'10 partidas valoradas, 2 sin precio, IVA 10 %'});
 const A=await budgetNow(page),ref=F.referencia(A.budget.items);
 S.check('EX-02.A1','C1–C4 genera 12 partidas desde las cantidades',A.budget.items.length===12,{observed:A.budget.items.map(i=>i.id)});
 let worst=0;for(const l of ref.lineas){const shown=A.calc.lines.find(x=>x.id===l.id).subtotalNet;if(l.neto===null)S.check('EX-02.A2-'+l.id,'Partida sin precio: importe desconocido, nunca 0',shown===null,{expected:null,observed:shown});else worst=Math.max(worst,Math.abs(shown-l.neto));}
 S.check('EX-02.A3','Importe por línea = referencia independiente (céntimos)',worst<0.005,{expected:'diferencia 0',observed:worst});
 const tot=await page.locator('#budgetTotals').innerText(),warn=await page.locator('#budgetWarnings').innerText();
 S.check('EX-02.A4','Base imponible mostrada = neto conocido de la referencia',eurParse(tot.split('\n').slice(0,3).join(' '))===ref.netoConocido,{expected:ref.netoConocido,observed:tot.replace(/\n/g,' | ')});
 S.check('EX-02.A5','El total se declara incompleto (hay partidas sin precio)',/sin precio: el total no está completo/.test(warn),{observed:warn});
 S.note(`Revisión A: neto conocido ${ref.netoConocido} €, IVA por línea ${ref.ivaPorLinea} €, IVA sobre total ${ref.ivaSobreTotal} € (diferencia de redondeo ${Math.round((ref.ivaPorLinea-ref.ivaSobreTotal)*100)/100} €)`);
 S.check('EX-02.A6','El IVA mostrado sigue la regla por línea del contrato',Math.abs(A.calc.totals.tax.amount-ref.ivaPorLinea)<0.005,{expected:ref.ivaPorLinea,observed:A.calc.totals.tax.amount});
 // ¿Se rotula como «Total» un importe parcial? (Regla P0 del Maestro: parcial ≠ total)
 const totalLine=/Total\s*([\d.,]+\s?€)/.exec(tot);S.check('EX-02.A7','Un presupuesto parcial no se rotula como «Total» sin calificarlo',!totalLine,{expected:'«—» o «parcial» junto al total',observed:tot.replace(/\n/g,' | ')});
 await page.locator('#budgetClose').click();
 // --- Diez tareas + hito por la UI del Plan de obra ---
 const inv=await inventory(page);await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 await page.fill('#planName','Plan QA obra nueva');await page.locator('#planCreate').click();
 const ids={};const t0=Date.now();
 for(const t of F.TAREAS){const r=await addTaskUI(page,t,inv);S.check('EX-02.T-'+t.id,`Tarea ${t.id} «${t.titulo}» creada por la UI`,r.saved,{observed:r.error||'guardada',expected:'guardada'});ids[t.id]=r.elementKeys;}
 const hr=await addTaskUI(page,F.HITO,inv,{milestone:true});S.check('EX-02.H01','Hito «Fin de obra» (un día) creado',hr.saved,{observed:hr.error||'guardado'});
 S.metric('crear-10-tareas-ui',Date.now()-t0,'ms');await shot(page,'ex02-diez-tareas',{escenario:'Plan de obra',esperado:'10 tareas + hito con dependencias'});
 const ts=Date.now();await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));S.metric('guardar-plan',Date.now()-ts,'ms');
 const P=await plan(page);S.check('EX-02.P1','Plan guardado con 11 tareas (10 + hito)',P?.tasks.length===11,{observed:P?.tasks.length});
 const byTitle=Object.fromEntries((P?.tasks||[]).map(t=>[t.title,t]));
 S.check('EX-02.P2','Fechas guardadas exactamente como se introdujeron (no se mueven)',F.TAREAS.every(t=>byTitle[t.titulo]?.startDate===t.inicio&&byTitle[t.titulo]?.endDate===t.fin));
 S.check('EX-02.P3','Dependencias FS/SS/FF/SF con desfases ±, guardadas',(()=>{const deps=P.tasks.flatMap(t=>(t.dependsOn||[]).map(d=>typeof d==='string'?'FS0':d.type+d.lagDays));return ['FS0','SS3','SS2','FF2','FS-2','FF5','SF0'].every(x=>deps.includes(x));})(),{observed:JSON.stringify(P.tasks.map(t=>[t.title,t.dependsOn]))});
 // Revisión declarada (para observar luego su invalidación)
 await page.locator('#planReview').click();await page.fill('#planReviewer','Auditor QA (declaración sintética)');await page.locator('#planReviewConfirm').click();
 await page.waitForFunction(()=>/marcado como revisado/.test(document.getElementById('planStatus').textContent));
 await page.locator('#planTab-items').click();await shot(page,'ex02-partidas-y-relaciones',{escenario:'Plan · partidas',esperado:'reparto, sin asignar, desconocido'});
 const items=await page.locator('#planItems').innerText();
 S.check('EX-02.P4','La puerta queda «Sin tarea» (partida sin tarea)',/Puerta[\s\S]{0,200}Sin tarea/.test(items),{observed:items.slice(0,400)});
 await page.locator('#planClose').click();
 // --- Evolución desde la navegación real; reproducción y Gantt ---
 await page.locator('[data-route="construction-evolution"]').click();
 await page.waitForFunction(()=>document.getElementById('evolutionFrame')?.contentWindow?.__ft3dFidelity?.ctx?.timeline,null,{timeout:90000});
 const f=evoFrame(page);await page.waitForTimeout(500);await shot(page,'ex02-evolucion-inicio',{escenario:'Evolución',esperado:'composición Gate D con el proyecto real'});
 await f.locator('#play').click();await page.waitForTimeout(3500);await f.locator('#play').click();
 const playedTo=await f.evaluate(()=>window.__ft3dFidelity.last?.date);S.check('EX-02.E1','Reproducir y pausar avanzan la fecha',!!playedTo&&playedTo>'2027-02-28',{observed:playedTo});
 // Selección de fecha intermedia con clic real en la cabecera del Gantt y de tarea con clic real en su fila
 const mid='2027-04-18';await f.evaluate(d=>window.__ft3dFidelity.setDate(d),mid);
 const t04=P.tasks.find(t=>t.title==='Tabiquería interior').id;await f.locator(`#gantt .row[data-task="${t04}"] .lab`).click();await page.waitForTimeout(400);
 const before=await f.evaluate(id=>{const F=window.__ft3dFidelity,rep=F.ctx.model.costs.report;return {date:F.last.date,sel:F.selected,cost:rep.byTask.find(t=>t.taskId===id),card:document.getElementById('cardTasks').innerText,cursor:document.querySelector('#gantt [data-role=cursor]')?.dataset.date};},t04);
 S.check('EX-02.E2','Clic en la fila del Gantt selecciona la tarea',before.sel===t04,{observed:before.sel});
 await shot(page,'ex02-evolucion-tarea-T04',{escenario:'5.1 antes',esperado:'T04 seleccionada, tarjeta con su coste'});
 // --- 5.1 · Regreso tras MODIFICAR un precio relacionado (partition-new) ---
 await f.evaluate(()=>document.querySelector('#cardExtra details')?.setAttribute('open',''));
 const link=f.locator('#cardExtra [data-rubik="open-budget"][data-item-id="partition-new"]').first();
 S.check('EX-02.R0','La tarjeta ofrece la partida vinculada de T04',await link.count()>0);
 const evoRev=await f.evaluate(()=>window.__ft3dFidelity.model.fingerprint);
 await link.click();await page.waitForSelector('#budgetDialog[open]');
 S.check('EX-02.R1','Presupuestar se abre sobre la evolución en la partida',await page.locator('#budgetDialog tr.is-focus').getAttribute('data-item')==='partition-new');
 await setPriceUI(page,'partition-new',46.5);await shot(page,'ex02-5-1-cambio-precio',{escenario:'5.1',esperado:'precio cambiado en Presupuestar'});
 await page.locator('#budgetClose').click();
 await page.waitForFunction(()=>{const f=document.getElementById('evolutionFrame');return f&&f.contentWindow?.__ft3dFidelity?.ctx?.timeline&&f.contentDocument.body.classList.contains('ready');},null,{timeout:90000});await page.waitForTimeout(800);
 const after=await evoFrame(page).evaluate(id=>{const F=window.__ft3dFidelity,rep=F.ctx.model.costs.report;return {date:F.last?.date,sel:F.selected,cost:rep.byTask.find(t=>t.taskId===id),fp:F.model.fingerprint,issues:F.model.issues,review:document.body.innerText.match(/revisi[oó]n[^\n]{0,80}desactualizad[^\n]{0,40}/i)?.[0]||null};},t04);
 const net=(await budgetNow(page)).calc.lines.find(l=>l.id==='partition-new').subtotalNet,expected=F.reparto(Math.round(net*100),[50,50])[1]/100;
 S.check('EX-02.R2','Al volver: misma fecha',after.date===before.date,{expected:before.date,observed:after.date});
 S.check('EX-02.R3','Al volver: misma tarea seleccionada',after.sel===before.sel,{expected:before.sel,observed:after.sel});
 const lineAfter=after.cost?.lines.find(l=>l.itemId==='partition-new')?.allocatedNet;
 S.check('EX-02.R4','Al volver: el coste de T04 refleja el nuevo precio (50 % de la partida)',Math.abs((lineAfter??-1)-expected)<0.005,{expected,observed:lineAfter});
 S.check('EX-02.R5','La identidad (revisión del proyecto) no cambia por un cambio de precio',after.fp===evoRev,{observed:after.fp===evoRev});
 S.check('EX-02.R6','La revisión declarada del plan se marca desactualizada tras cambiar el presupuesto',(after.issues||[]).some(i=>/binding.*obsolete|budget-revision-obsolete|revision-obsolete/.test(i))||!!after.review,{observed:after.issues});
 await shot(page,'ex02-5-1-despues',{escenario:'5.1 después',esperado:'misma fecha/tarea, coste nuevo'});
 // Repetir tras recargar la aplicación
 STATE=await dump(page);await page.reload();await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible().catch(()=>false))await page.locator('#welcomeReturn').click();
 const {frame:f2}=await openEvolution(page);const afterReload=await f2.evaluate(id=>{const F=window.__ft3dFidelity;return {date:F.last?.date,sel:F.selected,cost:F.ctx.model.costs.report.byTask.find(t=>t.taskId===id)?.lines.find(l=>l.itemId==='partition-new')?.allocatedNet};},t04);
 S.check('EX-02.R7','Tras recargar: el coste persistido es el nuevo',Math.abs((afterReload.cost??-1)-expected)<0.005,{expected,observed:afterReload.cost});
 S.note(`Tras recargar, la evolución abre en ${afterReload.date} con selección ${afterReload.sel}: la fecha/tarea de la sesión anterior no se conservan entre recargas (se registran, no se exigen).`);
 // --- Entregar: revisión de la entrega (HTML local) ---
 await f2.evaluate(()=>window.__ft3dUI.go('entrega'));await page.waitForTimeout(400);
 const doc=await f2.evaluate(async()=>{const d=await window.__ft3dDelivery.prepareDocument();return {id:d.manifest.id,bytes:d.bytes,project:d.manifest.project};});
 S.check('EX-02.D1','Entrega HTML local generada para el mismo proyecto',doc.project.id==='prj_qa-vivienda-obra',{observed:doc.project});
 await shot(page,'ex02-entrega',{escenario:'Entregar',esperado:'entrega HTML local preparada'});
 await page.locator('#evolutionBack').click();await area(page,'deliver');await page.waitForSelector('#deliveryState');
 S.check('EX-02.D2','Entregar muestra la última entrega como «corresponde al estado actual»',await page.locator('#deliveryState').getAttribute('data-result')==='match',{observed:await page.locator('#deliveryState').innerText()});
 S.check('EX-02.Z','Sin errores JavaScript en el recorrido',!log.errors.length,{observed:log.errors.slice(0,5)});
 STATE=await dump(page);
 }finally{await close(s,'v1-recorrido-escritorio');}
}));

/* ======================================================================================================================
   EX-03 · Validación del plan: edición, duplicado, eliminación controlada, ciclo, dependencia incumplida, >100 %. */
test('EX-03 plan: edición, duplicado, eliminación, ciclos, dependencias y reparto > 100 %',{timeout:300000},()=>run('EX-03','Validaciones del Plan de obra','Plan',async S=>{
 const s=await boot({state:STATE}),{page}=s;
 try{
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 const P0=await plan(page),id=t=>P0.tasks.find(x=>x.title===t).id;
 // Ciclo: Cimentación depende de Pintura
 await page.locator(`[data-edit="${id('Cimentación')}"]`).click();await page.locator('#taskAddDep').click();const r=page.locator('#taskForm [data-dep]').last();await r.locator('select').first().selectOption({label:'10 Pintura y acabados'});
 await page.locator('#taskSave').click();const cyc=await page.locator('#taskError').textContent();
 S.check('EX-03.1','Una dependencia cíclica se rechaza con explicación',/ciclo|no cumple/i.test(cyc||''),{observed:cyc});await page.locator('#taskForm button:has-text("Cancelar")').click();
 // Dependencia incumplida: acortar Cimentación hacia más tarde (fin 2027-03-12) rompe FS con Estructura → rechazo, sin mover fechas
 await page.locator(`[data-edit="${id('Cimentación')}"]`).click();await page.fill('#taskEnd','2027-03-12');await page.locator('#taskSave').click();
 const dep=await page.locator('#taskError').textContent();S.check('EX-03.2','Fecha que incumple FS se rechaza; RUBIK no mueve fechas',/no cumple su dependencia/.test(dep||''),{observed:dep});
 await page.locator('#taskForm button:has-text("Cancelar")').click();
 S.check('EX-03.3','Las fechas guardadas no han cambiado',JSON.stringify((await plan(page)).tasks.map(t=>[t.startDate,t.endDate]))===JSON.stringify(P0.tasks.map(t=>[t.startDate,t.endDate])));
 // Reparto > 100 %: Pintura ya tiene paint 100 %; asignar paint 50 % a Pavimentos
 await page.locator(`[data-edit="${id('Pavimentos')}"]`).click();await page.locator('#taskAddItem').click();const ar=page.locator('#taskForm [data-alloc]').last();
 const disabled=await ar.locator('select option[value="paint"]').isDisabled();S.check('EX-03.4','La partida ya repartida al 100 % aparece deshabilitada en el selector',disabled);
 if(!disabled){await ar.locator('select').selectOption('paint');await ar.locator('input').fill('50');await page.locator('#taskSave').click();S.check('EX-03.5','Un reparto > 100 % se rechaza',/100 %/.test(await page.locator('#taskError').textContent()||''));}
 else{await page.evaluate(()=>{});const ok=await page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot(),S2=FloorPlanConstructionSchedule,p=structuredClone(s.record.schedule);const t=p.tasks.find(x=>x.title==='Pavimentos');t.budgetAllocations=[...(t.budgetAllocations||t.budgetItemIds.map(i=>({itemId:i,sharePercent:100}))),{itemId:'paint',sharePercent:50}];delete t.budgetItemIds;try{S2.validate(p);return 'aceptado';}catch(e){return e.message;}});
  S.check('EX-03.5','El motor rechaza un reparto > 100 % (no se corrompe nada)',/beyond 100/.test(ok),{observed:ok});}
 await page.locator('#taskForm button:has-text("Cancelar")').click();
 // Duplicar tarea y eliminarla (eliminación controlada)
 const n0=(await page.locator('#planTasks tbody tr[data-task]').count());await page.locator(`[data-dup="${id('Fontanería')}"]`).click();
 const n1=await page.locator('#planTasks tbody tr[data-task]').count();S.check('EX-03.6','Duplicar crea una tarea (sin elementos ni partidas)',n1===n0+1,{observed:[n0,n1]});
 const focusedCopy=await page.locator('#planTasks tr.is-focus').count();S.check('EX-03.6b','La copia recién creada queda señalada en la tabla',focusedCopy===1,{observed:focusedCopy?'señalada':'sin señalar: hay que buscarla («Fontanería (copia)»)'});
 const dupId=await page.evaluate(()=>[...document.querySelectorAll('#planTasks tbody tr[data-task]')].find(r=>/\(copia\)/.test(r.textContent))?.dataset.task);await page.locator(`[data-remove="${dupId}"]`).click();
 S.check('EX-03.7','La copia se elimina sin afectar al resto',await page.locator('#planTasks tbody tr[data-task]').count()===n0);
 // Eliminar una tarea con sucesores se bloquea
 await page.locator(`[data-remove="${id('Cimentación')}"]`).click();S.check('EX-03.8','No se elimina una tarea de la que dependen otras',/depende de esta tarea/.test(await page.locator('#planError').textContent()||''),{observed:await page.locator('#planError').textContent()});
 // Editar una tarea que ya tiene elementos (todos «construir») y partidas al 100 %: solo cambiar el título
 await page.locator(`[data-edit="${id('Carpintería exterior')}"]`).click();await page.fill('#taskTitle','Carpintería exterior (aluminio)');await page.locator('#taskSave').click();
 const editOpen=await page.locator('#taskForm').count(),editErr=editOpen?await page.locator('#taskError').textContent():null;
 S.check('EX-03.14','Editar el título de una tarea con elementos y partidas existentes se guarda',!editOpen,{expected:'tarea actualizada',observed:editErr});
 if(editErr)S.check('EX-03.15','El error de edición está en castellano y sin códigos técnicos',!/FloorPlanConstructionSchedule|contradict|tsk_/.test(editErr),{observed:editErr});
 if(editOpen)await page.locator('#taskForm button:has-text("Cancelar")').click();
 // Cambios sin guardar al cerrar
 await page.locator('#planClose').click();S.check('EX-03.9','Cerrar con cambios sin guardar pregunta (guardar/descartar/seguir)',await page.locator('#planDiscard').isVisible());
 await page.locator('#planDiscard').click();
 // Duplicar plan, seleccionar, y eliminar plan seleccionado (¿hay UI?)
 await page.locator('[data-route="construction-plan"]').click();await page.locator('#planDuplicate').click();await page.waitForTimeout(400);
 const rec=(await snap(page)).record;S.check('EX-03.10','Duplicar plan guarda una copia en borrador sin cambiar el plan en uso',rec.plans.length===2&&rec.selectedScheduleId===P0.id,{observed:[rec.plans.length,rec.selectedScheduleId===P0.id]});
 const delUI=await page.locator('#planDialog button:has-text("Eliminar plan")').count();
 S.check('EX-03.11','Existe en la UI una acción para eliminar un plan guardado',delUI>0,{expected:'botón «Eliminar plan»',observed:'no existe en la UI (solo en el núcleo removeSchedule)'});
 await shot(page,'ex03-plan-duplicado',{escenario:'Planes múltiples'});
 // Devolver el plan en uso al original (seleccionado) y cerrar
 await page.locator('#planSelect').selectOption(P0.id);await page.locator('#planClose').click();
 // Recarga con cambios sin guardar: ¿aviso del navegador?
 await page.locator('[data-route="construction-plan"]').click();await page.locator(`[data-dup="${id('Fontanería')}"]`).click();
 let dialogSeen=false;page.once('dialog',d=>{dialogSeen=true;d.accept().catch(()=>{});});
 await page.reload({waitUntil:'load'}).catch(()=>{});await page.waitForTimeout(800);
 S.check('EX-03.12','Recargar con cambios sin guardar en el plan avisa antes de perderlos',dialogSeen,{expected:'aviso beforeunload',observed:dialogSeen?'aviso':'se pierden sin aviso'});
 await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible().catch(()=>false))await page.locator('#welcomeReturn').click();
 const P1=await plan(page);S.check('EX-03.13','Tras recargar, el plan guardado sigue intacto (11 tareas)',P1.tasks.length===11);
 STATE=await dump(page);
 }finally{await close(s);}
}));
module.exports={get STATE(){return STATE;},set STATE(v){STATE=v;}};
require('./qa-m2/examen-parte2.cjs')({test,run,H,F,T,get:()=>STATE,set:v=>{STATE=v;},plan,addTaskUI});
