'use strict';
/* OBR-01 · EX-09.10 — PNOA (ortofoto) y MDT05 (terreno) integrales en la Evolución FT3D-8, en navegador real.
   El examen M2/S4 lo dejó NOT_RUN. Aquí: un edificio con metadatos PNOA/MDT05 de la fixture territorial existente
   (tests/fixtures/territorial-integration.cjs: licencia del terreno VERIFICADA) se abre desde la biblioteca en la
   Evolución, se ve y se entrega. Se comprueba que solo viajan METADATOS: ninguna petición al IGN ni a otro host, ningún
   ráster ni malla en el documento del cliente, el expediente lo dice y el proyecto guardado no cambia.
   La descarga REAL de teselas PNOA/MDT05 del IGN (red + licencia) no se ejecuta aquí: ver acta OBR-01. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr01/browser-kit.cjs');
const TERR=require('./fixtures/territorial-integration.cjs');
let env,s,T;
before(async()=>{env=await K.start();T=TERR.build();
  s=await K.openEvolution(env,{fixture:{building:T.building,tasks:[{id:'T01',wbs:'01',titulo:'Muros',inicio:'2027-03-01',fin:'2027-03-20',deps:[],elementos:{tipo:'wall',rol:'build',n:6}}]}});});
after(async()=>{await s?.context.close();await env?.stop();});

test('EX-09.10 · el edificio con PNOA/MDT05 se abre y se dibuja en la Evolución, sin pedir nada a servicios externos',{timeout:300000},async()=>{
  const r=await s.page.evaluate(()=>({objects:window.__ft3dFidelity.scene.objectCount,levels:window.__ft3dFidelity.ctx.model.inventory.levels.length}));
  assert.ok(r.objects>0,'hay elementos dibujados');assert.equal(r.levels,2,'las dos plantas del edificio');
  assert.deepEqual(s.watch.external,[],'ninguna petición a IGN/PNOA/MDT05 ni a otro host');assert.deepEqual(s.watch.errors,[]);
});

test('EX-09.10 · el expediente dice que ortofoto y terreno son solo metadatos (no imágenes)',{timeout:120000},async()=>{
  await s.page.evaluate(()=>{const b=[...document.querySelectorAll('[role=tab],button')].find(x=>/^Proyecto$/.test(x.textContent.trim()));b?.click();document.querySelectorAll('details').forEach(d=>d.open=true);});
  await s.page.waitForTimeout(400);
  const text=await s.page.evaluate(()=>document.body.innerText);
  assert.match(text,/Ortofoto\/terreno: solo metadatos guardados; las imágenes no forman parte del expediente/);
});

test('EX-09.10 · el documento del cliente no contiene ráster, malla ni direcciones de servicio; el proyecto guardado no cambia',{timeout:300000},async()=>{
  const before=await s.page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1'));
  const doc=await s.page.evaluate(async()=>{const d=await window.__ft3dDelivery.prepareDocument();return {html:d.html,manifest:d.manifest};});
  assert.ok(doc.html.length>1000,'se genera el documento');
  for(const bad of [/ign\.es/i,/wms/i,/pnoa/i,/mdt05/i,/data:image\/jpeg/i,/synthetic-image/,/fixture-terrain/])assert.doesNotMatch(doc.html,bad,`sin ${bad}`);
  // La malla del terreno no viaja: ninguna serie de cotas de la rejilla de la fixture aparece en el documento.
  for(const bad of [/sampleDomain/,/cellSizeX/,/"values"\s*:\s*\[/,/requestedResolutionM/])assert.doesNotMatch(doc.html,bad,`sin la rejilla ni la petición ráster (${bad})`);
  assert.deepEqual(s.watch.external,[]);
  const after=await s.page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1'));
  const site=JSON.parse(after).entries[0].building.site;
  assert.equal(after,before,'la biblioteca (con los metadatos PNOA/MDT05) no cambia byte a byte');
  assert.ok(site.orthophoto&&site.terrain,'los metadatos siguen guardados');
});
