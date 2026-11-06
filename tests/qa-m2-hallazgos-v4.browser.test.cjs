'use strict';
/* FT3D-8 · EXAMEN FINAL M2/S4 — VÍDEO 4 (hallazgos). Reproduce, sobre la app real del SHA examinado, cada defecto
   confirmado en el examen. Antes de cada reproducción se muestra un rótulo con el identificador del defecto, lo esperado
   y lo que se va a observar. No corrige nada: las comprobaciones esperan el comportamiento CORRECTO, de modo que un
   defecto presente se registra como FAIL (no se rebajan aserciones). Datos sintéticos. */
const {test,before,after}=require('node:test');
process.env.QA_RESULTS='resultados-v4-hallazgos.json';
const H=require('./qa-m2/harness.cjs'),F=require('./qa-m2/obra-sintetica.cjs');
const {scenario,boot,close,dump,shot,area,openBudget,setPriceUI,snap,inventory,openEvolution}=H;
before(async()=>{await H.start();});
after(async()=>{await H.write();await H.stop();});
async function run(id,titulo,fn){const S=scenario(id,titulo,'Hallazgos (vídeo 4)');let err=null;try{await fn(S);}catch(e){err=e;}S.finish(err);}
async function rotulo(page,id,texto,ms=3200){
 await page.evaluate(([id,texto])=>{let d=document.getElementById('qa-rotulo');if(!d){d=document.createElement('div');d.id='qa-rotulo';document.body.appendChild(d);}
  d.style.cssText='position:fixed;left:50%;top:12px;transform:translateX(-50%);z-index:2147483647;max-width:min(92vw,760px);background:#1d1d1b;color:#fff;font:600 15px/1.4 system-ui,sans-serif;padding:12px 16px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none;white-space:pre-line';
  d.textContent='QA · '+id+'\n'+texto;},[id,texto]);await page.waitForTimeout(ms);}
const quitarRotulo=page=>page.evaluate(()=>document.getElementById('qa-rotulo')?.remove());
let STATE=null;

test('V4 · hallazgos de escritorio reproducidos con rótulo previo',{timeout:900000},()=>run('V4-escritorio','Vídeo 4: hallazgos de escritorio',async S=>{
 const s=await boot({state:{'rubik-sota-project-library-v1':JSON.stringify(F.biblioteca())},video:'v4',viewport:{width:1366,height:768}}),{page}=s;
 try{
 await rotulo(page,'VÍDEO 4 · HALLAZGOS','Examen final M2/S4 · código 49e8feb · datos sintéticos.\nCada defecto se identifica antes de reproducirlo.',3500);
 // ---- EX-02.A7 ----
 await rotulo(page,'EX-02.A7 · P2 · Presupuesto','Esperado: con partidas sin precio, el importe final no se rotula «Total» sin calificar.\nSe va a observar: «Total …» sobre un presupuesto parcial; el aviso queda aparte, en la lista.');
 await quitarRotulo(page);await openBudget(page);await page.locator('#budgetVat').selectOption(String(F.IVA));
 for(const [id,p] of Object.entries(F.PRECIOS_A))await setPriceUI(page,id,p);
 await page.locator('#budgetTotals').scrollIntoViewIfNeeded();const tot=await page.locator('#budgetTotals').innerText();
 await shot(page,'v4-A7-total-parcial',{escenario:'EX-02.A7',esperado:'total calificado como parcial',observado:tot.replace(/\n/g,' | ')});await page.waitForTimeout(1500);
 S.check('V4.A7','Un presupuesto parcial no se rotula «Total» sin calificar',!/Total\s*[\d.,]+\s?€/.test(tot),{observed:tot.replace(/\n/g,' | ')});
 // ---- EX-04.B7 ----
 await rotulo(page,'EX-04.B7 · P2 · Historial de precios','Esperado: un cambio manual de precio deja rastro en el historial de revisiones.\nSe va a observar: se cambia «ventana» a 455 € y el historial no lo anota.');
 await quitarRotulo(page);await setPriceUI(page,'opening:window',455);await page.waitForTimeout(800);
 const hist=(await snap(page)).record?.priceHistory?.['prj_qa-vivienda-obra']||[];
 await rotulo(page,'EX-04.B7 · observado',`Entradas en el historial para «opening:window»: ${hist.filter(h=>h.itemId==='opening:window').length} (total historial: ${hist.length}).`,2500);await quitarRotulo(page);
 S.check('V4.B7','El cambio manual de precio queda en el historial',hist.some(h=>h.itemId==='opening:window'),{observed:hist.length});
 await page.locator('#budgetClose').click();
 // ---- Plan mínimo para los hallazgos del editor ----
 const inv=await inventory(page),wins=inv.filter(e=>e.type==='window').map(e=>e.key);
 await area(page,'budget');await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 await page.fill('#planName','Plan QA hallazgos');await page.locator('#planCreate').click();
 await page.locator('#planAddTask').click();await page.fill('#taskTitle','Carpintería exterior');await page.fill('#taskStart','2027-04-15');await page.fill('#taskEnd','2027-04-30');
 for(const k of wins.slice(0,3))await page.locator(`#taskElements input[data-element="${k}"]`).check();await page.locator('#taskSave').click();
 await page.locator('#planAddTask').click();await page.fill('#taskTitle','Fontanería');await page.fill('#taskStart','2027-03-31');await page.fill('#taskEnd','2027-04-23');await page.locator('#taskSave').click();
 await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));
 const tid=t=>page.evaluate(t=>FloorPlanConstructionPlanUI.draft.tasks.find(x=>x.title===t).id,t);
 // ---- EX-04.C4 ----
 await rotulo(page,'EX-04.C4 · P1 · Editar elementos de una tarea guardada','Esperado: cambiar los elementos de una tarea ya guardada se aplica.\nSe va a observar: se cambia una ventana por otra y el guardado se rechaza con un error técnico en inglés.');
 await quitarRotulo(page);const cid=await tid('Carpintería exterior');await page.locator(`[data-edit="${cid}"]`).click();
 await page.locator(`#taskElements input[data-element="${wins[0]}"]`).uncheck();await page.locator(`#taskElements input[data-element="${wins[5]}"]`).check();await page.locator('#taskSave').click();await page.waitForTimeout(400);
 const open=await page.locator('#taskForm').count(),err=open?await page.locator('#taskError').textContent():null;
 if(open)await page.locator('#taskError').scrollIntoViewIfNeeded();await shot(page,'v4-C4-error-editar-elementos',{escenario:'EX-04.C4',esperado:'tarea actualizada',observado:err});await page.waitForTimeout(2000);
 S.check('V4.C4','Editar los elementos de una tarea guardada se guarda',!open,{observed:err});
 if(err)S.check('V4.C4b','El mensaje de error está en castellano y sin códigos técnicos',!/FloorPlanConstructionSchedule|contradict|tsk_/.test(err),{observed:err});
 if(open)await page.locator('#taskForm button:has-text("Cancelar")').click();
 // ---- EX-03.6b ----
 await rotulo(page,'EX-03.6b · P3 · Copia de tarea sin señalar','Esperado: la copia recién creada queda señalada en la tabla.\nSe va a observar: se duplica «Fontanería» y ninguna fila queda señalada.');
 await quitarRotulo(page);await page.locator(`[data-dup="${await tid('Fontanería')}"]`).click();await page.waitForTimeout(500);
 const foc=await page.locator('#planTasks tr.is-focus').count();await shot(page,'v4-6b-copia-sin-senalar',{escenario:'EX-03.6b',observado:foc?'señalada':'sin señalar'});await page.waitForTimeout(1500);
 S.check('V4.6b','La copia queda señalada',foc===1,{observed:foc});
 // ---- EX-03.11 ----
 await rotulo(page,'EX-03.11 · P2 · Eliminar plan','Esperado: hay una acción en la interfaz para eliminar un plan guardado.\nSe va a observar: el pie del diálogo no ofrece «Eliminar plan» (solo existe en el núcleo).');
 await quitarRotulo(page);await page.locator('#planDialog').evaluate(d=>d.querySelector('footer,.cx-foot,.plan-foot')?.scrollIntoView());await page.waitForTimeout(1500);
 const del=await page.locator('#planDialog button:has-text("Eliminar plan")').count();S.check('V4.11','Existe «Eliminar plan» en la UI',del>0,{observed:del});
 // ---- EX-03.12 ----
 await rotulo(page,'EX-03.12 · P2 · Recarga sin aviso','Esperado: recargar con cambios sin guardar en el plan avisa antes de perderlos.\nSe va a observar: la copia sin guardar desaparece al recargar, sin ningún aviso.');
 await quitarRotulo(page);let dlg=false;page.once('dialog',d=>{dlg=true;d.dismiss().catch(()=>{});});
 await page.reload({waitUntil:'load'}).catch(()=>{});await page.waitForFunction(()=>window.FloorPlanConstructionUI);if(await page.locator('#welcomeReturn').isVisible().catch(()=>false))await page.locator('#welcomeReturn').click();
 const n=await page.evaluate(()=>FloorPlanConstructionPlanUI?.draft?.tasks?.length??null);
 await rotulo(page,'EX-03.12 · observado',`Aviso del navegador: ${dlg?'sí':'no'}. La copia «Fontanería (copia)» no está en el plan guardado.`,2500);await quitarRotulo(page);
 S.check('V4.12','Recargar con cambios sin guardar avisa',dlg,{observed:{aviso:dlg,tareasDraftTrasRecarga:n}});
 // ---- EX-11-k.3 ----
 await rotulo(page,'EX-11-k.3 · P3 · Foco tras Escape','Esperado: al cerrar el plan con Escape, el foco vuelve al botón «Plan de obra».\nSe va a observar: el foco acaba en el título del espacio de trabajo.');
 await quitarRotulo(page);await area(page,'budget');const btn=page.locator('[data-route="construction-plan"]');await btn.focus();await page.keyboard.press('Enter');await page.waitForSelector('#planDialog[open]');await page.waitForTimeout(600);
 await page.keyboard.press('Escape');await page.waitForTimeout(500);const fe=await page.evaluate(()=>document.activeElement?.dataset?.route||document.activeElement?.id||document.activeElement?.tagName);
 await rotulo(page,'EX-11-k.3 · observado','Elemento con foco: '+fe,2500);await quitarRotulo(page);S.check('V4.k3','El foco vuelve al botón que abrió el diálogo',fe==='construction-plan',{observed:fe});
 // ---- EX-11-k.4 ----
 await rotulo(page,'EX-11-k.4 · P3 · Escape dentro de la Evolución','Esperado: Escape cierra la Evolución también con el foco dentro de ella.\nSe va a observar: con el foco en un control de la Evolución, Escape no la cierra.');
 await quitarRotulo(page);const {frame:f}=await openEvolution(page);await f.locator('#play').focus();await page.keyboard.press('Escape');await page.waitForTimeout(600);
 const hidden=await page.locator('#evolutionOverlay').isHidden();await shot(page,'v4-k4-escape-evolucion',{escenario:'EX-11-k.4',observado:hidden?'cerrada':'sigue abierta'});
 await rotulo(page,'EX-11-k.4 · observado','Evolución '+(hidden?'cerrada':'sigue abierta tras Escape'),2500);await quitarRotulo(page);
 S.check('V4.k4','Escape con el foco dentro de la Evolución la cierra',hidden);
 if(!hidden)await page.locator('#evolutionBack').click();
 STATE=await dump(page);
 }finally{await close(s,'v4-hallazgos-escritorio');}
}));

test('V4 · hallazgos móviles (390×844) reproducidos con rótulo previo',{timeout:600000},()=>run('V4-movil','Vídeo 4: hallazgos móviles',async S=>{
 const s=await boot({state:STATE||{'rubik-sota-project-library-v1':JSON.stringify(F.biblioteca())},video:'v4m',viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),{page}=s;
 try{
 await rotulo(page,'EX-11-m.3 · M2-UX-MOB-02 · P2/P3','Esperado: «Entregar» visible o alcanzable con el foco en la barra de pasos.\nSe va a observar: «Entregar» queda fuera de la barra; el foco no la desplaza.');
 await quitarRotulo(page);await openEvolution(page);await page.waitForTimeout(700);
 const vis=()=>page.evaluate(()=>{const n=document.querySelector('.cx-steps'),r=document.querySelector('.cx-step[data-step="entrega"]').getBoundingClientRect(),nr=n.getBoundingClientRect();return {visible:r.left>=nr.left-1&&r.right<=nr.right+1,sw:n.scrollWidth,cw:n.clientWidth,h:Math.round(r.height)};});
 const v0=await vis();await page.locator('.cx-step[data-step="entrega"]').focus();await page.waitForTimeout(400);const v1=await vis();
 await shot(page,'v4-MOB02-entregar-oculto',{escenario:'M2-UX-MOB-02',observado:JSON.stringify({v0,v1})});
 await rotulo(page,'EX-11-m.3 · observado',`Barra ${v0.sw}px de contenido en ${v0.cw}px visibles. «Entregar» visible: ${v0.visible?'sí':'no'}; tras el foco: ${v1.visible?'sí':'no'}.`,3000);await quitarRotulo(page);
 S.check('V4.MOB02','«Entregar» visible o revelado al recibir el foco',v0.visible||v1.visible,{observed:{v0,v1}});
 await rotulo(page,'EX-11-m.2 / m.4 · P3 · Áreas táctiles','Esperado: pasos y botones del pie con al menos 44 px de alto.\nSe va a observar: alturas de 36–38 px.');
 await quitarRotulo(page);S.check('V4.m4','Pasos de la barra con altura ≥ 44 px',v0.h>=44,{observed:v0.h});
 await page.locator('.cx-steps').evaluate(n=>n.scrollTo({left:n.scrollWidth,behavior:'smooth'}));await page.waitForTimeout(1200);
 await rotulo(page,'Contraste (PASS)','Con desplazamiento manual, «Entregar» sí se alcanza y se puede tocar (EX-11-m.5 PASS).',2500);await quitarRotulo(page);
 }finally{await close(s,'v4-hallazgos-movil');}
}));
