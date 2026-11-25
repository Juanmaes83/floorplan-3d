// Asesor RUBIK · SKILLS con interrogatorio socrático (labs/asesor-rubik/skills.js). Chromium 1440x900 y 390x844 (táctil).
// Datos reales de la vivienda de ejemplo; sin modelo ni red. Resultados deterministas.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=path.join(root,'docs/qa/asesor-rubik/capturas-skills');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
let server,browser,url;
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u.endsWith('/')?u+'index.html':u));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/labs/asesor-rubik/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});fs.mkdirSync(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`Asesor RUBIK · skills socráticos ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const name=`${viewport.width}x${viewport.height}`,context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],req=[];page.on('pageerror',e=>errors.push(e.message));context.on('request',r=>req.push(r.url()));await context.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();touch?await l.tap():await l.click();await page.waitForTimeout(80);};
 const answer=async v=>{await page.fill('#mentorA',v);await press('#mentorForm button');};
 const q=()=>page.locator('#mentorQ').textContent();
 await page.goto(url);await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:60000});
 // Memoria: nombre, tarea y misión, visibles; un DNI no se guarda.
 await page.fill('#memNombre','Lucía');await page.fill('#memTarea','Reforma del salón');await page.fill('#memMision','Entregar la propuesta al cliente el viernes');await press('#memSave');
 assert.equal(await page.locator('#memView').textContent(),'Nombre: Lucía · Tarea: Reforma del salón · Misión: Entregar la propuesta al cliente el viernes');
 await page.fill('#memTarea','12345678Z');await press('#memSave');assert.match(await page.locator('#memView').textContent(),/Tarea: Reforma del salón/,'el DNI no sustituye la tarea');
 assert.match(await page.locator('#mentorWarn').textContent(),/No lo guardo ni lo envío/);
 // Presupuesto en modo CLIENTE: preguntas antes de proponer, eco, resumen, confirmación; sin importes.
 await press('#skillChips [data-skill="presupuesto"]');assert.match(await q(),/^Lucía, vamos con presupuesto\. Recuerdo tu misión/);
 let n=0;for(const a of ['Renovar el salón para venderlo mejor','Plazo, porque hay comprador','Unos 15.000 €','Suelo y pintura']){assert.equal(await page.locator('#mentorForm').isVisible(),true,'pregunta antes de proponer');await answer(a);n++;}
 assert.equal(n,4);assert.match(await q(),/Resumen: quieres Renovar el salón.*¿Lo he entendido bien\?$/);assert.equal(await page.locator('#mentorConfirm').isVisible(),true);
 await press('#mentorYes');const out=await page.locator('#mentorOut').textContent();
 assert.equal(await page.locator('#mentorForm').isVisible(),false,'tras proponer no queda una pregunta abierta');assert.equal(await page.locator('#mentorConfirm').isVisible(),false);
 const m2=await page.frame({url:/index\.html/}).evaluate(()=>{const r=RubikAssistantDomainTools.execute('list_rooms',{},{project:FloorPlanApp.project},'q');return Math.round(r.data.rooms.filter(x=>x.counted&&Number.isFinite(x.floor.areaM2)).reduce((s,x)=>s+x.floor.areaM2,0)*100)/100;});
 assert.ok(out.includes(m2.toLocaleString('es-ES')),'superficie real de RUBIK');assert.match(out,/medida estimada/,'dice que la medida es estimada');
 assert.match(out,/no puedo mostrar costes internos/);assert.doesNotMatch(out,/Presupuesto neto|suma parcial/,'sin importes del presupuesto en modo cliente');assert.match(out,/Tarea: «Reforma del salón»/);
 await page.screenshot({path:path.join(shots,`${name}-01-presupuesto-cliente.png`)});
 // «No, te explico mejor» reinicia las preguntas.
 await press('#skillChips [data-skill="negocio"]');for(const a of ['Familias jóvenes','Ver la casa en 3D antes de comprar','Encargos al mes'])await answer(a);await press('#mentorNo');assert.match(await q(),/empecemos de nuevo/);
 // Pregunta legal: aviso de no asesoría vinculante, sin afirmaciones normativas.
 await press('#skillChips [data-skill="organizacion"]');await answer('Necesito la licencia de obra del ayuntamiento');
 assert.match(await page.locator('#mentorWarn').textContent(),/No doy asesoría legal, fiscal ni normativa vinculante/);
 for(const a of ['El cliente y yo','No sé qué documentos piden'])await answer(a);await press('#mentorYes');
 assert.match(await page.locator('#mentorOut').textContent(),/en RUBIK te quedan \d+ tareas|no te quedan tareas/,'tareas reales de RUBIK');
 // Puntualidad: realista (margen del 20 %), sin promesas.
 await press('#skillChips [data-skill="puntualidad"]');for(const a of ['2026-12-31','10','el proveedor de suelo'])await answer(a);await press('#mentorYes');
 const p=await page.locator('#mentorOut').textContent();assert.match(p,/margen realista del 20 % necesitarías 12/);assert.match(p,/No es un compromiso/);assert.doesNotMatch(p,/garantiz|prometo/i);
 await page.screenshot({path:path.join(shots,`${name}-02-puntualidad.png`)});
 // Modo TÉCNICO: el presupuesto usa el motor real y no inventa un total si faltan precios.
 await press('input[name=mode][value=tecnico]');await press('#skillChips [data-skill="presupuesto"]');assert.match(await q(),/^Lucía/,'la memoria se conserva al cambiar de modo');
 for(const a of ['Reforma completa','Calidad','Aún no lo sé','Cocina'])await answer(a);await press('#mentorYes');
 const tech=await page.locator('#mentorOut').textContent();
 const real=await page.frame({url:/index\.html/}).evaluate(()=>{const c=window.FloorPlanBudgetUI?.current?.();if(!c)return null;const r=RubikAssistantDomainTools.execute('get_budget_summary',{},{project:FloorPlanApp.project,budget:c.budget},'q');return r.ok?r.data.net:null;});
 if(real&&real.complete)assert.ok(tech.includes(real.amount.toLocaleString('es-ES')),'importe = motor de RUBIK');
 else assert.match(tech,/no tiene un total fiable|No puedo leer el presupuesto/,'sin total inventado');
 // Olvidar todo.
 await press('#memForget');assert.equal(await page.locator('#memView').textContent(),'Aún no recuerdo nada.');
 assert.deepEqual(req.filter(u=>{try{return !/^127\.0\.0\.1/.test(new URL(u).host)&&!u.startsWith('data:')&&!u.startsWith('blob:')&&!/cdn\.jsdelivr\.net/.test(u);}catch{return false;}}),[],'sin peticiones externas');
 assert.deepEqual(errors,[]);
});
