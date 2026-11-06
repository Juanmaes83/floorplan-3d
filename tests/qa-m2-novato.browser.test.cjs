'use strict';
/* FT3D-8 · M2 · RECORRIDO DE UN USUARIO NOVATO (vídeo V5). Empieza sin ningún dato, como quien entra por primera vez, y
   completa el proceso de obra de principio a fin SOLO con lo que ve en pantalla (clics y teclado sobre la UI real):
   ejemplo → copia propia → Presupuestar (precios) → Plan de obra (tareas, elementos, partidas, dependencia, hito) →
   Evolución 4D → Entregar (documento HTML). En cada paso comprueba que hay un «siguiente paso» claro y que no hay errores.
   Datos sintéticos. Cada comprobación espera el comportamiento correcto (no se rebajan aserciones). */
const {test,before,after}=require('node:test');
process.env.QA_RESULTS=process.env.QA_RESULTS||'resultados-novato.json';
const fss=require('node:fs'),path=require('node:path');
const H=require('./qa-m2/harness.cjs');
const {scenario,boot,close,shot,area}=H;
before(async()=>{await H.start();});
after(async()=>{await H.write();await H.stop();});
async function run(id,titulo,fn){const S=scenario(id,titulo,'Experiencia novato (vídeo 5)');let err=null;try{await fn(S);}catch(e){err=e;}S.finish(err);}
async function rotulo(page,texto,ms=2600){await page.evaluate(t=>{let d=document.getElementById('qa-rotulo');if(!d){d=document.createElement('div');d.id='qa-rotulo';document.body.appendChild(d);}
  d.style.cssText='position:fixed;left:50%;bottom:16px;transform:translateX(-50%);z-index:2147483647;max-width:min(92vw,720px);background:#1d1d1b;color:#fff;font:600 15px/1.4 system-ui,sans-serif;padding:10px 16px;border-radius:10px;box-shadow:0 6px 24px rgba(0,0,0,.35);pointer-events:none;white-space:pre-line';d.textContent=t;},texto);
 await page.waitForTimeout(ms);await page.evaluate(()=>document.getElementById('qa-rotulo')?.remove());}
const journey=page=>page.evaluate(()=>{const j=document.getElementById('obraJourney');if(!j)return null;return {sum:j.querySelector('.cx-journey-sum')?.textContent,
 steps:[...j.querySelectorAll('.cx-jstep')].map(li=>({k:li.dataset.step,state:li.dataset.state,text:li.innerText.replace(/\s+/g,' ').trim()})),next:j.querySelector('.cx-jstep[data-state=next]')?.dataset.step||null};});
const day=n=>{const d=new Date(Date.UTC(2027,2,1+n));return d.toISOString().slice(0,10);};

test('V5 · un usuario novato completa el proceso de obra de principio a fin, guiado paso a paso',{timeout:900000},()=>run('V5-novato','Recorrido completo de un usuario novato',async S=>{
 const s=await boot({state:{},video:'v5-novato',viewport:{width:1366,height:768}}),{page,log}=s;
 try{
 await rotulo(page,'Primera visita a RUBIK: no hay ningún proyecto.\nObjetivo: preparar la obra de una vivienda y entregársela al cliente.',3200);
 await shot(page,'v5-01-portada',{escenario:'Portada'});
 S.check('N.1','La portada ofrece un punto de partida claro (subir plano, crear o probar el ejemplo)',await page.getByText('Probar el ejemplo').first().isVisible());
 await page.getByText('Probar el ejemplo').first().click();await page.waitForTimeout(1200);
 await rotulo(page,'Abro el ejemplo. La app me sugiere crear mi copia para guardar cambios.');
 const copy=page.getByText('Crear mi copia').first();S.check('N.2','El ejemplo invita a crear una copia propia',await copy.isVisible());await copy.click();await page.waitForTimeout(1200);
 // Presupuestar
 await rotulo(page,'Voy a «Presupuestar», donde empieza la parte de obra.');await area(page,'budget');await page.waitForSelector('#obraJourney');await page.waitForTimeout(500);
 let j=await journey(page);await shot(page,'v5-02-recorrido-obra',{escenario:'Recorrido de obra',observado:j?.sum});
 S.check('N.3','Presupuestar muestra el «Recorrido de obra» con 5 pasos ordenados y un siguiente paso',j&&j.steps.length===5&&j.next==='precios',{observed:j});
 await rotulo(page,'El recorrido me dice qué hacer primero: poner precio a las partidas.');
 await page.locator('[data-journey="precios"]').click();await page.waitForSelector('#budgetDialog[open]');
 const n=await page.locator('#budgetDialog [data-field="price"]').count();
 for(let i=0;i<n;i++){const inp=page.locator('#budgetDialog [data-field="price"]').nth(i);await inp.fill(String(20+i));await inp.press('Tab');}
 await page.waitForTimeout(300);const tot=await page.locator('#budgetTotals').innerText();
 S.check('N.4','Con todas las partidas valoradas, el total es completo (sin «parcial»)',/Total\s*\n?\s*[\d.]+,\d\d/.test(tot)&&!/parcial/.test(tot),{observed:tot.replace(/\n/g,' | ')});
 await shot(page,'v5-03-presupuesto',{escenario:'Presupuesto'});await page.locator('#budgetClose').click();await page.waitForTimeout(700);
 j=await journey(page);S.check('N.5','Tras poner precios, el paso 1 queda hecho y el siguiente es crear el plan',j?.steps[0].state==='done'&&j.next==='plan',{observed:j?.sum});
 // Plan de obra
 await rotulo(page,'Paso 2: crear el plan de obra.');await page.locator('[data-journey="plan"]').click();await page.waitForSelector('#planDialog[open]');
 await page.locator('#planCreate').click();await page.waitForTimeout(300);
 const addTask=async({title,start,end,filter,pickN=2,item=true,dep=null,milestone=false})=>{
  await page.locator(milestone?'#planAddMilestone':'#planAddTask').click();await page.fill('#taskTitle',title);await page.fill('#taskStart',start);if(!milestone)await page.fill('#taskEnd',end);
  if(dep){await page.locator('#taskAddDep').click();await page.locator('#taskForm [data-dep] select').first().selectOption({label:dep});}
  if(filter){await page.fill('#taskElementFilter',filter);await page.waitForTimeout(150);const boxes=page.locator('#taskElements label:not([hidden]) input[type=checkbox]');const c=await boxes.count();for(let i=0;i<Math.min(pickN,c);i++)await boxes.nth(i).check();}
  if(item&&await page.locator('#taskAddItem').count()){await page.locator('#taskAddItem').click();const sel=page.locator('#taskForm [data-alloc] select').last();const opt=await sel.evaluate(s=>[...s.options].find(o=>o.value&&!o.disabled)?.value||'');if(opt)await sel.selectOption(opt);}
  await page.locator('#taskSave').click();await page.waitForTimeout(250);const open=await page.locator('#taskForm').count();return open?await page.locator('#taskError').textContent():null;};
 await rotulo(page,'Añado los trabajos: busco «suelo» y marco los suelos que se colocan.');
 let e1=await addTask({title:'Pavimentos',start:day(0),end:day(9),filter:'suelo'});S.check('N.6','Tarea «Pavimentos» con suelos (buscados por nombre) y su partida',!e1,{observed:e1});
 await shot(page,'v5-04-plan-tarea',{escenario:'Plan de obra'});
 let e2=await addTask({title:'Pintura',start:day(10),end:day(16),filter:'salon',pickN:2,dep:'1 Pavimentos'});S.check('N.7','Tarea «Pintura» después de «Pavimentos» (dependencia) con muros del salón',!e2,{observed:e2});
 let e3=await addTask({title:'Fin de obra',start:day(17),milestone:true,item:false,dep:'2 Pintura'});S.check('N.8','Hito «Fin de obra»',!e3,{observed:e3});
 await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus')?.textContent||''));
 await shot(page,'v5-05-plan-guardado',{escenario:'Plan guardado'});await rotulo(page,'Plan guardado. Cierro y vuelvo al recorrido.');
 await page.locator('#planClose').click();await page.waitForTimeout(800);
 j=await journey(page);S.check('N.9','Plan y vínculos quedan hechos; el recorrido ofrece ver la evolución y entregar',j?.steps[1].state==='done'&&j?.steps[2].state==='done'&&!!j?.next,{observed:j});
 await shot(page,'v5-06-recorrido-avanzado',{escenario:'Recorrido de obra',observado:j?.sum});
 // Evolución 4D
 await rotulo(page,'Paso 4: miro cómo se construye la casa día a día.');await page.locator('[data-journey="evolucion"]').click();
 await page.waitForSelector('#evolutionOverlay:not([hidden])');const f=H.evoFrame(page);await f.waitForFunction(()=>window.__ft3dFidelity?.ctx);await page.waitForTimeout(800);
 await f.locator('#play').click();await page.waitForTimeout(3000);await f.locator('#play').click();await shot(page,'v5-07-evolucion',{escenario:'Evolución 4D'});
 S.check('N.10','La evolución reproduce el plan (la fecha avanza)',!!(await f.evaluate(()=>window.__ft3dFidelity.last?.date)));
 await rotulo(page,'Paso 5: Entregar. Preparo el documento para el cliente.');await page.locator('.cx-step[data-step="entrega"]').click();await page.waitForTimeout(900);
 await shot(page,'v5-08-entregar',{escenario:'Entregar'});
 S.check('N.10b','Entregar no muestra textos técnicos de desarrollo (nombres de módulos)',!/FloorPlanCore|FloorPlanRoof|FT3D-8|C1–C4 \(FloorPlanBudget\)/.test(await f.locator('body').innerText()),{observed:(await f.locator('footer').innerText().catch(()=>'')).slice(0,160)});
 const visibleBtns=await f.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.offsetParent&&!b.disabled).map(b=>b.textContent.trim()).filter(Boolean));
 S.note('Botones visibles en Entregar: '+visibleBtns.join(' | '));
 const go=f.locator('#deliverGo');S.check('N.11','Entregar tiene una acción principal clara: «Generar vídeo y presentación»',await go.isVisible()&&/Generar v[ií]deo y presentaci[oó]n/.test(await go.textContent()),{observed:visibleBtns});
 await rotulo(page,'Pulso la acción principal: genera el vídeo y la presentación para el cliente.',2200);
 const t0=Date.now();await go.click();await f.waitForFunction(()=>{const d=document.getElementById('docDownload'),v=document.getElementById('videoDownload');return d&&!d.disabled&&d.offsetParent!==null||/Generar de nuevo/.test(document.getElementById('deliverGo')?.textContent||'');},null,{timeout:240000}).catch(()=>{});
 S.metric('novato-generar-entrega',Date.now()-t0,'ms');await f.evaluate(()=>{for(const id of ['step5','resultMore'])document.getElementById(id)?.setAttribute('open','');});await page.waitForTimeout(500);
 const dlBtn=f.locator('#docDownload'),ok=await dlBtn.isVisible().catch(()=>false);S.check('N.12','La presentación queda lista para descargar',ok);
 if(ok){const p=page.waitForEvent('download');await dlBtn.click();const d=await p;const dst=path.join(H.EVID,'v5-entrega-'+d.suggestedFilename().replace(/[^\w.-]/g,'_'));await d.saveAs(dst);await H.registerEvidence(dst,{tipo:'entrega-html',escenario:'V5'});}
 await shot(page,'v5-09-entregado',{escenario:'Entregado'});
 await page.locator('#evolutionBack').click();await page.waitForTimeout(800);await area(page,'budget');await page.waitForSelector('#obraJourney');
 j=await journey(page);S.check('N.13','Al terminar, el recorrido marca la entrega al día',j?.steps[4].state==='done',{observed:j});
 S.check('N.14','Al terminar, los 5 pasos están hechos y no queda ningún «siguiente paso» pendiente',j?.steps.every(x=>x.state==='done')&&!j.next,{observed:j?.sum});
 await shot(page,'v5-10-recorrido-final',{escenario:'Recorrido final',observado:j?.sum});await rotulo(page,'Recorrido completo: presupuesto, plan, evolución y entrega.',3000);
 S.check('N.Z','Sin errores JavaScript en todo el recorrido',!log.errors.length,{observed:log.errors.slice(0,5)});
 }finally{await close(s,'v5-novato');}
}));

test('V5 · el recorrido de obra también guía en el móvil (390×844)',{timeout:300000},()=>run('V5-movil','Recorrido de obra en móvil',async S=>{
 const s=await boot({state:{},viewport:{width:390,height:844},deviceScaleFactor:2,isMobile:true,hasTouch:true}),{page,log}=s;
 try{await page.getByText('Probar el ejemplo').first().click();await page.waitForTimeout(800);await page.getByText('Crear mi copia').first().click().catch(()=>{});await page.waitForTimeout(800);
  await area(page,'budget');await page.waitForSelector('#obraJourney');await page.locator('#obraJourney').scrollIntoViewIfNeeded();await page.waitForTimeout(400);
  const m=await page.evaluate(()=>{const j=document.getElementById('obraJourney'),r=j.getBoundingClientRect();return {w:Math.round(r.width),overflow:j.scrollWidth>j.clientWidth+1,pageOverflow:document.documentElement.scrollWidth>innerWidth+1,
   btns:[...j.querySelectorAll('button')].map(b=>Math.round(b.getBoundingClientRect().height))};});
  await shot(page,'v5-movil-recorrido',{escenario:'Recorrido de obra móvil'});
  S.check('N.M1','El recorrido cabe en 390 px sin desbordar',!m.overflow&&!m.pageOverflow&&m.w<=390,{observed:m});
  S.check('N.M2','Botones del recorrido con altura táctil ≥ 44 px',m.btns.every(h=>h>=44),{observed:m.btns});
  S.check('N.MZ','Sin errores JavaScript',!log.errors.length,{observed:log.errors.slice(0,3)});
 }finally{await close(s);}
}));
