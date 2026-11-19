'use strict';
/* A0 · residuales de navegador de #273 (comentario 7021022541 de Codex). Comprobación DIRIGIDA, sin filtrar errores:
   pensada para ejecutarse también en Firefox y WebKit con el mismo editor y el mismo kit que R1-T01–T04.
   1) Fixture de maquetación (tests/layout-fixture.cjs): espera las animaciones que se dibujan y solo esas. En Firefox
      el «fadeIn» de .menu-pop dentro de un <details> cerrado queda «running» en tiempo 0 y no termina nunca.
   2) ResizeObserver: ningún callback cambia en la misma entrega el tamaño de un elemento observado (lo que WebKit
      notifica como «ResizeObserver loop completed with undelivered notifications») y NINGÚN evento de error de
      ResizeObserver llega a la ventana, en los recorridos de R1-T02/T02b/T04 con F0.2b activo y sin él. Las
      variables que publican esos observadores convergen al valor real tras un fotograma. */
const test=require('node:test'),assert=require('node:assert/strict'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),settle=require('./layout-fixture.cjs');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const at=host=>({...env,base:env.base.replace('127.0.0.1',host)});

// Registro sin filtros: todo error de ResizeObserver y todo callback que cambie el tamaño de algo observado.
function instrument(){window.__roErrors=[];window.__roSync=[];const targets=new Set(),RO=window.ResizeObserver;
 addEventListener('error',e=>{if(/ResizeObserver/i.test(e.message||''))window.__roErrors.push(e.message);});
 const sizes=()=>[...targets].map(t=>{const r=t.getBoundingClientRect();return `${t.id||t.tagName}:${r.width}x${r.height}`;}).join('|');
 window.ResizeObserver=class extends RO{constructor(cb){const label=cb.toString().replace(/\s+/g,' ').slice(0,80);
  super((entries,o)=>{const a=sizes(),r=cb(entries,o),b=sizes();if(a!==b)window.__roSync.push({label,before:a,after:b});return r;});}
  observe(t,...x){targets.add(t);return super.observe(t,...x);}};}
const rename=(page,n)=>page.evaluate(n=>FloorPlanApp.applyExtension(p=>({ok:true,project:{...p,name:n}})),n);
const flush=page=>page.evaluate(async()=>{const s=window.FloorPlanPersistenceEditor?.session;if(s)await s.flush();});
const frames=(page,n=3)=>page.evaluate(n=>new Promise(r=>{const f=k=>k?requestAnimationFrame(()=>f(k-1)):r();f(n);}),n);

test('fixture: espera la animación que se dibuja e ignora la de un <details> cerrado (caso .menu-pop en Firefox)',{timeout:120000},async()=>{
 const {context,page,watch}=await K.editor(env);
 try{
  // Contenido de un <details> cerrado con una animación que nunca acaba: no se dibuja, no se espera.
  await page.evaluate(()=>{const d=document.createElement('details');d.id='fxClosed';d.innerHTML='<summary>Menú</summary><div class="menu-pop" id="fxPop">x</div>';document.querySelector('.app').append(d);
   document.getElementById('fxPop').animate([{opacity:0},{opacity:1}],{duration:200,iterations:Infinity});});
  await settle(page);
  // El <summary> sí se dibuja: su animación SÍ se espera (no se oculta el movimiento real).
  await page.evaluate(()=>{window.__sum=document.querySelector('#fxClosed>summary').animate([{opacity:.5},{opacity:1}],{duration:400});});
  const t0=Date.now();await settle(page);assert.ok(Date.now()-t0>=250,'esperó la animación visible del <summary>');
  // Una animación visible que no termina mantiene la espera: el fixture no da por estable lo que se mueve.
  await page.evaluate(()=>{const v=document.createElement('div');v.id='fxVisible';v.textContent='y';v.style.cssText='position:fixed;left:0;top:0;width:20px;height:20px';document.querySelector('.app').append(v);v.animate([{opacity:0},{opacity:1}],{duration:200,iterations:Infinity});});
  const r=await Promise.race([settle(page).then(()=>'estable'),new Promise(res=>setTimeout(()=>res('esperando'),1500))]);
  assert.equal(r,'esperando');
  await page.evaluate(()=>{document.getElementById('fxVisible').getAnimations().forEach(a=>a.cancel());document.getElementById('fxClosed').remove();document.getElementById('fxVisible').remove();});
  await settle(page);
  // El menú real de la cabecera: cerrado no bloquea; abierto se espera y luego se cierra.
  const menu=page.locator('details:has(> .menu-pop)').first();
  if(await menu.count()){await menu.evaluate(d=>{d.open=true;});await settle(page);await menu.evaluate(d=>{d.open=false;});await settle(page);}
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

const read=p=>p.evaluate(()=>{const css=n=>getComputedStyle(document.documentElement).getPropertyValue(n).trim(),nav=document.getElementById('professionalNav');
 return {errors:window.__roErrors,sync:window.__roSync,header:css('--shell-header-bottom'),headerReal:Math.round(document.querySelector('header').getBoundingClientRect().bottom)+'px',
  nav:nav?css('--professional-nav-bottom'):null,navReal:nav?nav.getBoundingClientRect().bottom+'px':null};});
// Cada recorrido en un contexto nuevo, como R1-T02/T02b/T04: mismo editor, misma confirmación, mismo aviso A0.
const ROUTES={
 'R1-T04':async(page)=>{await rename(page,'RO igual');await flush(page);},
 'R1-T02b':async(page)=>{await rename(page,'RO base');await flush(page);
  await page.evaluate(()=>{localStorage.setItem('rubik-sota-schema-epoch-v1','{dañado');window.dispatchEvent(new StorageEvent('storage',{key:'rubik-sota-schema-epoch-v1'}));});
  await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='indeterminate');await rename(page,'RO indeterminado');await flush(page);},
 'R1-T02':async(page,context,e)=>{await rename(page,'RO antes');await flush(page);
  const other=await context.newPage();await other.goto(e.base+'tests/fixtures/manual-plan.png');
  await other.addScriptTag({path:path.join(K.ROOT,'js/schema-epoch.js')});await other.evaluate(()=>FloorPlanSchemaEpoch.announce(2));
  await page.waitForFunction(()=>document.getElementById('a0Banner')?.dataset.state==='outdated');await rename(page,'RO después');await flush(page);}};
for(const [label,host] of [['normal','127.0.0.1'],['F0.2b activo','f0-2b.localhost']])
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
for(const [route,run] of Object.entries(ROUTES))
test(`ResizeObserver · ${route} · ${label} · ${viewport.width}x${viewport.height}: sin bucles ni errores, valores que convergen`,{timeout:120000},async()=>{
 const e=at(host),context=await e.browser.newContext({viewport}),page=await context.newPage(),errors=[];
 page.on('pageerror',x=>errors.push(x.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 try{
  await context.addInitScript(instrument);await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(e.base);await require('./editor-fixture.cjs')(page);
  await run(page,context,e);await frames(page);
  // También al cambiar el tamaño de la ventana: los observadores entregan y lo publicado sigue al tamaño real.
  await page.setViewportSize({width:viewport.width-41,height:viewport.height-27});await settle(page);await frames(page);
  const state=await read(page);
  assert.deepEqual(state.errors,[],'ningún error de ResizeObserver llega a la ventana');
  assert.deepEqual(state.sync,[],'ningún callback cambia el tamaño de un elemento observado dentro de la entrega');
  assert.equal(state.header,state.headerReal,'--shell-header-bottom converge');
  if(state.nav!==null)assert.equal(state.nav,state.navReal,'--professional-nav-bottom converge');
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
