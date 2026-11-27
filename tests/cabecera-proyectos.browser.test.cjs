'use strict';
/* §9 · Cabecera y gestión de proyectos. Fila 1: identidad, UN control de proyecto (nombre real + menú ▾), estado de
   guardado, las cuatro áreas y accesos globales. Fila 2: solo la tarea actual (vuelta contextual, vista 2D/3D, deshacer/
   rehacer, progreso, tareas, presentar, acción del paso). Cada entrada del menú acciona su flujo real:
   Abrir otro proyecto → biblioteca · Subir plano o proyecto → selector de archivo · Crear copia → proyecto con id propio ·
   Crear variante → variante vinculada con la MISMA vuelta que P10 («Volver a la historia», una sola vuelta) ·
   Descargar proyecto JSON → descarga. «Revisar en 3D» (marca el paso) ≠ «Escena 3D» (solo cambia la vista). Teclado y móvil. Capturas HDR_SHOTS. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs');
const shots=process.env.HDR_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
async function boot(viewport){const ctx=await env.browser.newContext({viewport,acceptDownloads:true});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false))await page.keyboard.press('Escape');await page.waitForTimeout(500);return {ctx,page,w};}
const menu=async page=>{if(!await page.locator('#perlaProjectMenu').evaluate(d=>d.open))await page.locator('#perlaProjectMenu > summary').click();await page.waitForSelector('#pmOpenOther:visible');};
const active=page=>page.evaluate(()=>FloorPlanApp.entryInfo());
const shownName=page=>page.locator('#projectsBtn').evaluate(b=>b.dataset.perlaName||b.textContent.trim());

test('§9 · escritorio 1440×900: un control de proyecto, fila 2 de tarea, cada acción del menú y una sola vuelta',{timeout:300000},async()=>{
 const {ctx,page,w}=await boot({width:1440,height:900});
 try{
  // Fila 1: un control de proyecto (nombre + ▾); «Crear copia» ya no ocupa la fila; deshacer/rehacer en la fila 2.
  assert.equal(await page.locator('.perla-r1 .perla-projwrap #projectsBtn').count(),1);assert.equal(await page.locator('.perla-r1 .perla-projwrap #perlaProjectMenu').count(),1);
  assert.equal(await page.locator('#guideCopyExample').isVisible(),false,'«Crear copia» está dentro del menú');
  assert.equal(await page.locator('.perla-r2 #editHistory').count(),1,'deshacer/rehacer con la tarea actual');
  assert.equal(await page.locator('.perla-r2 #uploadPlanBtn:visible, .perla-r2 #exportJsonQuick:visible').count(),0,'importar y descargar pasan al menú de proyecto');
  // Menú con teclado: abre, enfoca la primera acción, flechas, Escape devuelve el foco.
  await page.locator('#perlaProjectMenu > summary').focus();await page.keyboard.press('Enter');await page.waitForSelector('#pmOpenOther:visible');
  assert.equal(await page.evaluate(()=>document.activeElement.id),'pmOpenOther');await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>document.activeElement.id),'pmUpload');
  const labels=await page.locator('#perlaProjectMenu .perla-pm-item b').allInnerTexts();
  assert.deepEqual(labels.slice(0,5),['Abrir otro proyecto…','Subir plano o proyecto…','Crear copia','Crear variante','Descargar proyecto JSON']);
  assert.match(await page.locator('#pmSaveNote').innerText(),/«Guardado local» = se guarda solo en este navegador\. Para llevarlo a otro equipo, descarga el JSON\./);
  await page.waitForTimeout(400);if(shots)await page.screenshot({path:shots+'/1-menu-proyecto-1440.png'});
  await page.keyboard.press('Escape');assert.equal(await page.locator('#perlaProjectMenu').evaluate(d=>d.open),false);assert.equal(await page.evaluate(()=>document.activeElement.closest('#perlaProjectMenu')?'summary':document.activeElement.id),'summary');
  // Abrir otro proyecto → biblioteca.
  await menu(page);await page.locator('#pmOpenOther').click();await page.waitForSelector('#projectsDialog[open]');await page.locator('#projectClose').click();
  // Subir plano o proyecto → selector de archivo del flujo existente.
  await menu(page);const [chooser]=await Promise.all([page.waitForEvent('filechooser',{timeout:10000}),page.locator('#pmUpload').click()]);assert.ok(chooser);
  // Descargar proyecto JSON → descarga del archivo editable.
  await menu(page);const [dl]=await Promise.all([page.waitForEvent('download',{timeout:15000}),page.locator('#pmDownloadJson').click()]);assert.match(dl.suggestedFilename(),/\.json$/);
  assert.deepEqual(JSON.parse(require('node:fs').readFileSync(await dl.path(),'utf8')).walls,await page.evaluate(()=>FloorPlanApp.project.walls),'el JSON descargado es el proyecto activo');
  await page.waitForFunction(()=>/Proyecto JSON descargado/.test(document.querySelector('#toast').textContent)&&document.querySelector('#toast').classList.contains('show'));
  await menu(page);await page.waitForFunction(()=>document.querySelector('#pmDownloadJson').dataset.perlaDone==='1');
  assert.equal(await page.locator('#pmDownloadJson b').innerText(),'✓ Proyecto JSON descargado','el menú confirma la descarga');
  assert.equal(await page.locator('.perla-r2 #exportJsonQuick:visible').count(),0,'la descarga no se duplica en la fila 2');
  await page.keyboard.press('Escape');
  // Importar ese mismo JSON: el flujo existente lo abre como proyecto activo.
  const jsonPath=await dl.path();const before=await active(page);await menu(page);
  const [fc]=await Promise.all([page.waitForEvent('filechooser',{timeout:10000}),page.locator('#importJson').click()]);await fc.setFiles(jsonPath);
  await page.waitForFunction(()=>!document.querySelector('dialog[open]')||document.querySelector('dialog[open]').id!=='projectsDialog',null,{timeout:15000});await page.waitForTimeout(800);
  const after=await active(page);assert.ok(after&&after.id,'tras importar hay un proyecto activo');
  // «Exportar diseño» = solo salidas; lo demás en «Más», agrupado por tarea.
  assert.match(await page.locator('#perlaFile > summary').innerText(),/Exportar diseño/);
  const outs=await page.locator('#perlaFile .menu-pop').evaluate(p=>[...p.querySelectorAll('button')].map(b=>b.id).filter(Boolean));
  for(const id of ['territoryOpen','solarOpen','reviewNotesBtn','brandManage','clearAll','reset','photoReformMenu','importJson','exportJson','exportJsonQuick'])assert.ok(!outs.includes(id),id+' no es una salida');
  for(const id of ['exportPng','openSheet','exportDxf'])assert.ok(outs.includes(id),id+' es una salida');
  assert.deepEqual(await page.locator('#perlaMore .perla-more-group').evaluateAll(g=>g.map(x=>x.dataset.group)),['ctx','del','des']);
  // Crear copia (del ejemplo) → proyecto propio con id independiente; el nombre de la cabecera cambia.
  const a0=await active(page);await menu(page);await page.locator('#pmCopy').click();await page.waitForFunction(id=>FloorPlanApp.entryInfo()?.id!==id,a0.id,{timeout:15000});
  const a1=await active(page);assert.notEqual(a1.id,a0.id,'id independiente');assert.equal(a1.variantOf,null,'una copia NO es una variante');
  await page.waitForTimeout(300);assert.notEqual(await shownName(page),'Proyecto de ejemplo','la cabecera nombra el proyecto activo');
  // Crear copia de un proyecto propio → otra copia con id propio y «· copia».
  await menu(page);await page.locator('#pmCopy').click();await page.waitForFunction(id=>FloorPlanApp.entryInfo()?.id!==id,a1.id,{timeout:15000});
  const a2=await active(page);assert.match(a2.name,/· copia$/);assert.equal(a2.variantOf,null);
  // Crear variante → vinculada; la cabecera la nombra; UNA vuelta contextual («Volver a la historia») en la fila 2.
  await menu(page);await page.locator('#pmVariant').click();await page.waitForFunction(id=>FloorPlanApp.entryInfo()?.variantOf===id,a2.id,{timeout:15000});
  const v=await active(page);await page.waitForSelector('.perla-r2 #storyReturn:not([hidden])');
  assert.equal(await page.locator('.perla-r2 #storyReturn [data-sl-return="back"]').innerText(),'Volver a la historia');
  assert.equal(await page.locator('#perlaReturn:visible').count(),0,'sin la vuelta genérica duplicada');assert.equal(await page.locator('body > #storyReturn').count(),0,'sin aviso flotante sobre el plano');
  assert.match(await shownName(page),new RegExp(v.name.replace(/[.*+?^${}()|[\]\\]/g,'\\$&').slice(0,10)),'la cabecera dice el nombre de la variante');
  const cut=await page.evaluate(()=>[...document.querySelectorAll('.perla-r2 button, .perla-r2 summary')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').filter(b=>{const r=b.getBoundingClientRect();return r.right>innerWidth+0.5||r.left<-0.5;}).map(b=>b.textContent.trim()||b.id));
  assert.deepEqual(cut,[],'ningún control de la fila 2 queda cortado con la vuelta a la historia');
  if(shots)await page.screenshot({path:shots+'/2-variante-una-vuelta-1440.png'});
  // «Revisar en 3D» (marca el paso) ≠ «Escena 3D» (solo cambia la vista); sin sufijo «(paso)».
  const prim=await page.locator('#perlaPrimary').evaluate(b=>({t:b.textContent,title:b.title,hidden:b.hidden}));
  if(!prim.hidden&&/3D/.test(prim.t)){assert.equal(prim.t,'Revisar en 3D');assert.match(prim.title,/marca como hecho el paso «Revisa la distribución en 3D»/);}
  // Tareas del proyecto abierto: una sola «Revisar en 3D» visible; el encabezado del panel no se recorta ni tapa el inspector.
  await page.locator('#perlaTasks').click();await page.waitForSelector('#guideBar:not([hidden])');await page.waitForTimeout(300);
  const rev3d=await page.evaluate(()=>[...document.querySelectorAll('button')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden'&&/^Revisar en 3D/.test(b.textContent.trim())).length);
  assert.ok(rev3d<=1,'como mucho una acción «Revisar en 3D» visible con el panel abierto ('+rev3d+')');
  const idw=await page.locator('#guideBar .guide-identity').evaluate(e=>({w:e.getBoundingClientRect().width,sw:e.scrollWidth}));assert.ok(idw.w>200&&idw.sw<=idw.w+1,'el encabezado de Tareas se lee entero');
  const ins=await page.evaluate(()=>{const g=document.querySelector('#guideBar').getBoundingClientRect(),i=document.querySelector('.perla-inspector-head')?.parentElement;if(!i||!i.getClientRects().length)return 'sin-inspector';const r=i.getBoundingClientRect();return g.right<=r.left+1;});assert.equal(ins,true,'el panel de Tareas no tapa el inspector (y el inspector existe)');
  if(shots)await page.screenshot({path:shots+'/4-tareas-1440.png'});await page.locator('#perlaTasks').click();
  assert.doesNotMatch(await page.evaluate(()=>document.querySelector('header').innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});

test('§9 · móvil 390×844: el menú de proyecto se alcanza y cabe; sin desplazamiento horizontal',{timeout:240000},async()=>{
 const {ctx,page,w}=await boot({width:390,height:844});
 try{
  await menu(page);for(const id of ['pmOpenOther','pmUpload','pmCopy','pmVariant','pmDownloadJson']){const r=await page.locator('#'+id).boundingBox();assert.ok(r&&r.x>=0&&r.x+r.width<=390,id+' dentro de la pantalla');}
  await page.waitForTimeout(400);if(shots)await page.screenshot({path:shots+'/3-menu-movil.png'});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
