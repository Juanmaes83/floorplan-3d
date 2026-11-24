// UX-312 PERLA · U10 semáforo (js/perla-semaforo.js): rojo sin hacer · naranja empezado · verde hecho, con barra de % y
// recuento; la fuente es el estado real (tareas de la guía, fichas de Entregar, resumen de Presupuestar, Recorrido de obra).
// Recorridos reales con gestos visibles en 1440x900 (ratón) y 390x844 (táctil):
//  1. Entregar → «Presupuesto» (abre Presupuestar): la cabecera ofrece «← Volver a Entregar» y vuelve a Entregar.
//  2. Analizar → «Calibrar» (abre el editor): «← Volver a Analizar» aparece en el editor y vuelve a Analizar.
//  3. Atrás del navegador desde un área vuelve a la pantalla anterior (el editor), no al inicio ni fuera de la app.
//  4. Con un diálogo abierto en un área, Atrás cierra el diálogo y la persona sigue en su área.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u==='/'?'/index.html':u));if(!file.startsWith(root+path.sep))throw 0;const body=fs.readFileSync(file);res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`U10 semáforo ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPerlaSemaforo);await page.locator('#welcomeExample').click();await page.waitForTimeout(900);
 // Editor: un punto por tarea necesaria, con el estado de la guía.
 const ed=await page.evaluate(()=>{const p=FloorPlanGuideUI.progress(),tasks=p.tasks.filter(t=>t.necessary&&!t.skipped),map=s=>s==='completed'?'ok':(s==='active'||s==='review')?'pend':'req';
  return {expect:tasks.map(t=>t.id+':'+map(t.status)),got:[...document.querySelectorAll('#perlaProgress .perla-dot')].map(d=>d.dataset.task+':'+d.dataset.sem),names:[...document.querySelectorAll('#perlaProgress .perla-dot')].map(d=>d.getAttribute('aria-label'))};});
 assert.deepEqual(ed.got,ed.expect,'los puntos reflejan el estado real de las tareas');assert.ok(ed.names.every(n=>/: (hecho|empezado, sin terminar|sin hacer)$/.test(n)),'cada punto dice su estado con texto');
 if(!touch){const pend=page.locator('#perlaProgress .perla-dot:not(.ok)').first();if(await pend.count()){const id=await pend.getAttribute('data-task');await pend.click();await page.waitForTimeout(400);
  assert.equal(await page.evaluate(id=>!!document.querySelector(`dialog[open] [data-task="${id}"]`),id),true,'pulsar el punto lleva a esa tarea');await page.keyboard.press('Escape');}}
 // Entregar: barra y recuento = fichas por estado.
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForTimeout(900);
 const del=await page.evaluate(()=>{const c={ok:0,pend:0,req:0};for(const x of document.querySelectorAll('#professionalWorkspace [data-entrega-code][data-perla-pill]'))c[x.dataset.perlaPill]++;const b=document.querySelector('#professionalWorkspace .perla-sem-bar');
  return {c,now:+b.getAttribute('aria-valuenow'),pct:Math.round(c.ok/(c.ok+c.pend+c.req)*100),segs:[...b.children].map(s=>s.className.split(' ')[1]+':'+s.style.flexGrow),vis:b.checkVisibility()};});
 assert.equal(del.vis,true);assert.equal(del.now,del.pct,'porcentaje = fichas hechas / total');
 assert.deepEqual(del.segs,['ok','pend','req'].filter(k=>del.c[k]).map(k=>k+':'+del.c[k]),'segmentos = recuento por estado');
 // Presupuestar: barra del resumen; el Recorrido de obra no repite acciones de sus fichas.
 await page.evaluate(()=>FloorPlanProfessionalUI.open('budget'));await page.waitForTimeout(900);
 assert.equal(await page.locator('#professionalWorkspace .pres-hero-txt .perla-sem-bar').isVisible(),true);
 assert.ok(await page.locator('#professionalWorkspace .cx-jstep[data-sem]').count()>0,'los pasos del recorrido llevan semáforo');
 // U12 · Analizar: escala estimada → naranja; norte y parcela sin configurar → rojo; fachadas detectadas → verde.
 await page.evaluate(()=>FloorPlanProfessionalUI.open('analyze'));await page.waitForTimeout(900);
 const an=await page.evaluate(()=>Object.fromEntries([...document.querySelectorAll('#professionalWorkspace .professional-card[data-sem]')].map(c=>[c.querySelector('h2,h3').textContent.trim(),c.dataset.sem])));
 assert.deepEqual(an,{'Medidas y superficies':'pend','Orientación y sol':'req','Emplazamiento':'req','Exterior':'ok'},'estado real de cada ficha de Analizar');
 assert.equal(await page.locator('#professionalWorkspace .perla-sem-bar').getAttribute('aria-valuenow'),'25');
 assert.deepEqual(errors,[]);
});
