'use strict';
/* §5.3 · Presupuestar y Analizar con el estándar de Entregar, desde la interfaz normal y con el proyecto de ejemplo.
   - Estados coherentes: sin plan → «Falta»; plan creado y guardado sin tareas → la ficha dice «Borrador · 0 tareas», su acción
     es «Añadir primera tarea» y el resumen NO lo da por «Listo».
   - Cada porcentaje dice qué cuenta y su denominador («N de M …»); cada semáforo lleva texto (Analizar: etiqueta en la ficha).
   - Analizar usa las tarjetas de Presupuestar/Entregar: una acción principal por ficha; se conservan todas las acciones.
   - Escritorio y móvil sin desplazamiento horizontal; sin chino visible. Capturas: P53_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.P53_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
async function boot(viewport){const ctx=await env.browser.newContext({viewport});const page=await ctx.newPage();const w=K.watch(page,env.base);
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');}return {ctx,page,w};}
const area=async(page,k)=>{await page.evaluate(k=>FloorPlanProfessionalUI.open(k),k);await page.waitForTimeout(900);};
const heroRows=page=>page.evaluate(()=>[...document.querySelectorAll('#professionalWorkspace .pres-listo li')].map(li=>li.innerText.replace(/\s+/g,' ').trim()));
const ACTIONS={analyze:['Revisar superficies','Estancias y pavimentos','Abrir herramientas de calibración','Comprobar el plano','Configurar orientación','Ver estudio solar','Sol directo por estancia','Configurar emplazamiento','Revisar exterior 3D','Revisar petos y propiedades']};

test('§5.3 · Presupuestar: sin plan «Falta»; plan sin tareas «Borrador · 0 tareas» → «Añadir primera tarea», nunca «Listo»; porcentaje con su base',{timeout:240000},async()=>{
 const {ctx,page,w}=await boot({width:1440,height:900});
 try{
  await area(page,'budget');
  assert.ok((await heroRows(page)).includes('Falta Plan de obra'),'sin plan: falta');
  assert.match(await page.locator('#professionalWorkspace .perla-sem-base').first().innerText(),/^\d+ de \d+ piezas del presupuesto listas$/,'el porcentaje dice su base');
  // Crear un plan y guardarlo sin tareas, como la persona.
  const b=await accion(page,'#professionalWorkspace [data-route="construction-plan"]');await b.click();await page.locator('#planCreate').click();
  await page.locator('#planSave').click();await page.waitForFunction(()=>document.getElementById('planSave')?.disabled===true);
  // Revisión humana: «Cerrar» arriba a la derecha y, SIN volver a entrar en Presupuestar, la ficha ya está al día.
  await page.locator('#planClose').click();await page.waitForFunction(()=>!document.querySelector('dialog[open]'));
  await page.waitForFunction(()=>/Borrador · 0 tareas/.test(document.querySelector('#constructionPlanCard .professional-state')?.textContent||''),null,{timeout:8000});
  assert.equal(await page.locator('#constructionPlanCard [data-route="construction-plan"]').innerText(),'Añadir primera tarea');
  const rows=await heroRows(page);assert.ok(rows.includes('Falta Plan de obra (borrador · 0 tareas)'),'resumen coherente con la ficha: '+JSON.stringify(rows));
  assert.ok(!rows.some(r=>/^Listo Plan de obra/.test(r)),'nunca «Listo» con 0 tareas');
  if(shots)await page.screenshot({path:shots+'/1-presupuestar-plan-vacio.png'});
  // «Añadir primera tarea» lleva al control para añadirla (formulario de nueva tarea con el foco en el título).
  await page.locator('#constructionPlanCard [data-route="construction-plan"]').click();await page.waitForSelector('#taskForm');
  await page.waitForFunction(()=>document.activeElement?.id==='taskTitle');assert.match(await page.locator('#taskForm h3').innerText(),/^Nueva tarea$/);
  if(shots)await page.screenshot({path:shots+'/1b-anadir-primera-tarea.png'});
  await page.locator('#planClose').click();if(await page.locator('#planDiscard').count()){const d=page.locator('#planDiscard');if(await d.count())await d.click();}
  assert.doesNotMatch(await page.evaluate(()=>document.getElementById('professionalWorkspace').innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`§5.3 · Analizar con tarjetas de Entregar: una acción principal por ficha, semáforo con texto, porcentaje con base, todas las acciones (${viewport.width}x${viewport.height})`,{timeout:240000},async()=>{
 const {ctx,page,w}=await boot(viewport);
 try{
  await area(page,'analyze');
  assert.match(await page.locator('#professionalWorkspace .perla-sem-base').first().innerText(),/^\d+ de 4 comprobaciones hechas$/);
  const cards=await page.evaluate(()=>[...document.querySelectorAll('#professionalWorkspace .professional-grid > .professional-card')].map(c=>({h:c.querySelector('h2,h3')?.textContent.trim(),pres:c.classList.contains('pres-card'),go:c.querySelectorAll('.pres-go').length,tag:c.querySelector('.perla-sem-tag')?.textContent||null,sem:c.dataset.sem||null})));
  for(const c of cards){assert.ok(c.pres,'tarjeta de Entregar: '+c.h);assert.ok(c.go<=1,'una sola acción principal: '+c.h);if(c.sem)assert.match(c.tag||'',/^(Hecho|Empezado, sin terminar|Sin hacer)$/,'el color lleva texto: '+c.h);}
  assert.ok(cards.filter(c=>c.sem).length>=4);
  const labels=await page.evaluate(()=>[...document.querySelectorAll('#professionalWorkspace .professional-grid button')].map(b=>b.textContent.trim()));
  for(const a of ACTIONS.analyze)assert.ok(labels.includes(a),'se conserva la acción «'+a+'»');
  assert.ok(await page.evaluate(()=>document.getElementById('professionalWorkspace').scrollWidth-document.getElementById('professionalWorkspace').clientWidth<=1),'sin desplazamiento horizontal');
  if(shots)await page.screenshot({path:`${shots}/2-analizar-${viewport.width}.png`});
  assert.doesNotMatch(await page.evaluate(()=>document.getElementById('professionalWorkspace').innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
