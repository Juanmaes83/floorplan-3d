/* FT3D-8 · M1 · S2 + S3 lab in real Chromium (labs/m1-s2-s3/). Synthetic data only. Every request outside the local
   server fails the test, EXCEPT the official Catastro host, which is intercepted with page.route and answered with
   SIMULATED responses (rejection identical to what the development environment observed, and a synthetic INSPIRE
   answer). These tests therefore prove the browser flow, not the live service (see FT3D8_M1_LIVE below).
   Evidence (viewport captures) -> FT3D8_M1_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_M1_SHOTS||null;
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json','.gml':'application/gml+xml'};
const CATASTRO='https://ovc.catastro.meh.es/';
let server,browser,base;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox']});
  if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,{width=1440,height=900,tab='precios',mobile=false,catastro=null}={}){
  const ctx=await browser.newContext({viewport:{width,height},...(mobile?{isMobile:true,hasTouch:true}:{}),acceptDownloads:true});t.after(()=>ctx.close());
  const page=await ctx.newPage(),errors=[],external=[],catastroCalls=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(u.startsWith(CATASTRO))catastroCalls.push(u);else if(!u.startsWith(base)&&!/^(data|blob):/.test(u))external.push(u);});
  // Official host: never reached from tests; answered with a SIMULATED response, or aborted if none is configured.
  await page.route(CATASTRO+'**',route=>catastro?catastro(route):route.abort('connectionrefused'));
  await page.goto(`${base}labs/m1-s2-s3/?tab=${tab}`);await page.waitForFunction(()=>window.__m1s2&&window.__m1s3);
  return {page,errors,external,catastroCalls,ctx};
}
const text=(page,sel)=>page.locator(sel).innerText();
const shot=async(page,name)=>{if(shots)await page.screenshot({path:path.join(shots,name)});};
const noHScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1);

/* ============================== S2 ============================== */
test('S2 · initial state: partial budget never shown as total, managed BCCA blocked and explained',async t=>{
  const {page,errors,external}=await open(t);
  assert.match(await text(page,'#coverage'),/Todavía no hay ninguna partida con precio[\s\S]*4 partidas sin precio/);
  assert.equal(await page.evaluate(()=>getComputedStyle(document.querySelector('.top')).position),'relative','the top bar never covers the content');
  assert.equal(await page.locator('#items li').count(),4);
  assert.match(await text(page,'#managed'),/Catálogo BCCA gestionado por RUBIK: no disponible[\s\S]*sin acreditar/);
  assert.equal(await page.getAttribute('#managed','data-enabled'),'false');
  await shot(page,'s2-01-inicial-1440x900.png');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('S2 · search, provenance, explicit apply with preview; the previous version stays in the history',async t=>{
  const {page,errors,external}=await open(t);
  await page.click('#loadDemo');
  assert.match(await text(page,'#sourceList'),/BCCA de prueba · datos inventados[\s\S]*Edición 2024 · Andalucía, España[\s\S]*Tarifa · ESTUDIO DE PRUEBA/);
  const rev0=await page.evaluate(()=>window.__m1s2.revision());
  await page.fill('#q','fábrica');await page.click('#doSearch');
  await page.waitForSelector('[data-quote="SYN-FAB"]');assert.match(await text(page,'#searchStatus'),/1 referencia encontrada/);
  await page.click('[data-quote="SYN-FAB"]');await page.click('[data-detail="0"]');
  const prov=await text(page,'#provenance');
  for(const re of [/Código\s+SYN-FAB/,/Unidad\s+m²/,/Moneda\s+EUR/,/Precio\s+31,20\s€ sin IVA/,/Edición\s+2024/,/Andalucía, España/,/Fecha del precio\s+1 ene 2024/,/Licencia/])assert.match(prov,re);
  await shot(page,'s2-02-procedencia-1440x900.png');
  assert.equal(await page.evaluate(()=>window.__m1s2.revision()),rev0,'consulting and comparing change nothing');
  await page.click('[data-as="price"]');await page.waitForSelector('#confirmApply');
  assert.match(await text(page,'#preview'),/Ahora\s+Desconocido[\s\S]*Después\s+31,20\s€[\s\S]*sin revisar/);
  await page.locator('#preview').scrollIntoViewIfNeeded();await shot(page,'s2-03-confirmacion-1440x900.png');
  assert.equal(await page.evaluate(()=>window.__m1s2.revision()),rev0,'a preview is not a change');
  await page.click('#confirmApply');
  const after=await page.evaluate(()=>{const s=window.__m1s2.state,it=s.budget.items.find(i=>i.id==='it-fab');return {price:it.unitPrice,review:it.review.status,edition:it.priceReference.source.edition,versions:s.versions.length,first:JSON.parse(s.versions[0].budget).items.find(i=>i.id==='it-fab').unitPrice};});
  assert.deepEqual(after,{price:31.2,review:'unreviewed',edition:'2024',versions:2,first:null});
  assert.match(await text(page,'#history'),/Versión inicial[\s\S]*Precio aplicado · Fábrica/);
  assert.match(await text(page,'#coverage'),/presupuesto parcial, no es el coste total\): 1248,00\s€[\s\S]*3 partidas sin precio/);
  assert.match(await text(page,'#items li:first-child'),/31,20\s€[\s\S]*Referencia · ed. 2024[\s\S]*Sin revisar/);
  assert.doesNotMatch(await text(page,'#panel-precios'),/SYNTHETIC|fixture|importe Desconocido|actual Desconocido/,'plain Spanish, no internal labels');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('S2 · incompatible unit and several price columns: blocked or asked, never decided for the user',async t=>{
  const {page,errors}=await open(t);await page.click('#loadDemo');
  await page.click('[data-item="it-rod"]');await page.uncheck('#sameUnit');await page.fill('#q','excavación');await page.click('#doSearch');
  await page.click('[data-quote="SYN-EXC"]');assert.match(await text(page,'#compare'),/Unidad incompatible/);
  await page.click('[data-detail="0"]');await page.click('[data-as="price"]');
  assert.match(await text(page,'#preview'),/No se puede aplicar[\s\S]*no convierte unidades[\s\S]*no ha cambiado/);
  await shot(page,'s2-04-unidad-incompatible-1440x900.png');
  await page.click('[data-item="it-pin"]');await page.check('#sameUnit');await page.fill('#q','pintura');await page.click('#doSearch');
  await page.click('[data-quote="PINT-LISA"]');assert.match(await text(page,'#compare'),/Elige la columna de precios/);
  await page.selectOption('select[data-col]','1');await page.click('[data-quote="PINT-LISA"]');
  assert.match(await text(page,'#compare'),/8,40\s€ \/ m²/);assert.deepEqual(errors,[]);
});

test('S2 · new edition: comparison, per-item decision, unit change never applied, history intact',async t=>{
  const {page,errors}=await open(t);await page.click('#loadDemo');
  for(const [item,q,code] of [['it-fab','fábrica','SYN-FAB'],['it-rod','rodapié','SYN-ROD']]){
    await page.click(`[data-item="${item}"]`);await page.fill('#q',q);await page.click('#doSearch');await page.click(`[data-quote="${code}"]`);
    await page.click('[data-detail="0"]');await page.click('[data-as="price"]');await page.click('#confirmApply');}
  const hist=await page.evaluate(()=>window.__m1s2.state.versions.map(v=>v.budget));
  await page.click('#loadEdition');await page.waitForSelector('#applyUpdate');
  assert.match(await text(page,'#updates'),/edición 2025[\s\S]*SYN-FAB[\s\S]*31,20\s€[\s\S]*33,70\s€[\s\S]*Precio distinto[\s\S]*SYN-ROD[\s\S]*Unidad cambiada: no aplicable/);
  assert.equal(await page.locator('[data-accept="it-rod"]').isDisabled(),true);
  await page.locator('#updatesCard').scrollIntoViewIfNeeded();await shot(page,'s2-05-actualizacion-edicion-1440x900.png');
  await page.check('[data-accept="it-fab"]');await page.click('#applyUpdate');assert.match(await text(page,'#updateError'),/Confirma/);
  await page.check('#confirmUpdate');await page.click('#applyUpdate');
  const r=await page.evaluate(()=>{const s=window.__m1s2.state,f=s.budget.items.find(i=>i.id==='it-fab'),d=s.budget.items.find(i=>i.id==='it-rod');return {fab:f.unitPrice,fabEd:f.priceReference.source.edition,rod:d.unitPrice,versions:s.versions.map(v=>v.budget)};});
  assert.deepEqual([r.fab,r.fabEd,r.rod],[33.7,'2025',8.4]);
  assert.deepEqual(r.versions.slice(0,hist.length),hist,'earlier versions are byte-identical');
  assert.match(await text(page,'#history'),/Edición 2025 aplicada a 1 partida/);assert.deepEqual(errors,[]);
});

test('S2 · save and reopen the budget: prices, references and provenance kept; invalid file changes nothing',async t=>{
  const {page,errors}=await open(t);await page.click('#loadDemo');
  await page.fill('#q','fábrica');await page.click('#doSearch');await page.click('[data-quote="SYN-FAB"]');await page.click('[data-detail="0"]');await page.click('[data-as="reference"]');await page.click('#confirmApply');
  const dl=page.waitForEvent('download');await page.click('#budgetSave');const d=await dl;const file=await d.path();
  const saved=JSON.parse(await fs.readFile(file,'utf8'));const ref=saved.items.find(i=>i.id==='it-fab').priceReference;
  assert.deepEqual([ref.code,ref.source.edition,ref.source.region,saved.items.find(i=>i.id==='it-fab').unitPrice],['SYN-FAB','2024','Andalucía, España',null],'reference kept, price unchanged');
  // The file is read asynchronously: wait for the message instead of reading it immediately (CI is slower).
  const revBefore=await page.evaluate(()=>window.__m1s2.revision());
  await page.setInputFiles('#budgetOpen',{name:'roto.json',mimeType:'application/json',buffer:Buffer.from('{"no":1}')});
  await page.waitForFunction(()=>/No se puede abrir/.test(document.getElementById('budgetIo').textContent));
  assert.match(await text(page,'#budgetIo'),/No se puede abrir[\s\S]*No ha cambiado nada/);
  assert.equal(await page.evaluate(()=>window.__m1s2.revision()),revBefore,'an invalid file changes nothing');
  await page.setInputFiles('#budgetOpen',file);
  await page.waitForFunction(()=>/procedencia y revisiones conservadas/.test(document.getElementById('budgetIo').textContent));
  assert.match(await text(page,'#items li:first-child'),/Ref. guardada 31,20\s€/);assert.deepEqual(errors,[]);
});

test('S2 · keyboard: tabs with arrows, items and actions reachable; mobile 390×844 without horizontal scroll',async t=>{
  const {page}=await open(t);
  await page.focus('#tab-precios');await page.keyboard.press('ArrowRight');assert.equal(await page.evaluate(()=>document.body.dataset.tab),'parcela');
  await page.keyboard.press('ArrowLeft');assert.equal(await page.evaluate(()=>document.activeElement.id),'tab-precios');
  await page.focus('[data-item="it-pue"]');await page.keyboard.press('Enter');assert.equal(await page.getAttribute('[data-item="it-pue"]','aria-pressed'),'true');
  const unnamed=await page.evaluate(()=>[...document.querySelectorAll('button,select,input')].filter(e=>e.offsetParent!==null&&!(e.getAttribute('aria-label')||e.textContent.trim()||e.labels?.length||e.closest('label'))).map(e=>e.id||e.outerHTML.slice(0,40)));
  assert.deepEqual(unnamed,[]);
  const m=await open(t,{width:390,height:844,mobile:true});await m.page.click('#loadDemo');await m.page.click('[data-item="it-pue"]');
  assert.ok(await noHScroll(m.page));await shot(m.page,'s2-06-movil-390x844.png');
  await m.page.fill('#q','puerta');await m.page.click('#doSearch');await m.page.click('[data-quote="SYN-PUE"]');
  assert.ok(await noHScroll(m.page));await m.page.locator('#compareCard').scrollIntoViewIfNeeded();await shot(m.page,'s2-07-movil-comparar-390x844.png');
});

/* ============================== S3 ============================== */
const syntheticWfs=reference=>`<?xml version="1.0" encoding="UTF-8"?><wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:cp="http://inspire.ec.europa.eu/schemas/cp/4.0" xmlns:base="http://inspire.ec.europa.eu/schemas/base/3.3" numberReturned="1"><wfs:member><cp:CadastralParcel gml:id="ES.SDGC.CP.${reference}"><cp:geometry><gml:MultiSurface srsName="http://www.opengis.net/def/crs/EPSG/0/25830"><gml:surfaceMember><gml:Surface srsName="http://www.opengis.net/def/crs/EPSG/0/25830"><gml:patches><gml:PolygonPatch><gml:exterior><gml:LinearRing><gml:posList srsDimension="2">440000 4470000 440030 4470000 440030 4470020 440000 4470020 440000 4470000</gml:posList></gml:LinearRing></gml:exterior></gml:PolygonPatch></gml:patches></gml:Surface></gml:surfaceMember></gml:MultiSurface></cp:geometry><cp:nationalCadastralReference>${reference}</cp:nationalCadastralReference></cp:CadastralParcel></wfs:member></wfs:FeatureCollection>`;

test('S3 · official service rejected (as observed from the dev environment): clear message, GML suggested, nothing changes',async t=>{
  const {page,errors,external,catastroCalls}=await open(t,{tab:'parcela',catastro:route=>route.fulfill({status:400,contentType:'text/html',headers:{'access-control-allow-origin':'*'},body:'<html>No se puede procesar su petición.</html>'})});
  await page.fill('#rc','3662001TF3136S');await page.click('#lookup');
  await page.waitForFunction(()=>/No se ha podido completar/.test(document.getElementById('lookupStatus').textContent));
  assert.match(await text(page,'#lookupStatus'),/el servicio de Catastro ha rechazado la consulta[\s\S]*abrir el GML/);
  assert.equal(await page.locator('#cancelLookup').isVisible(),false,'Cancel only while a lookup runs');
  assert.equal(await page.evaluate(()=>document.getElementById('gmlFallback').classList.contains('suggest')),true);
  assert.equal(catastroCalls.length,1);assert.match(catastroCalls[0],/STOREDQUERIE_ID=GetParcel&refcat=3662001TF3136S&srsname=EPSG%3A%3A25830/);
  assert.equal(await page.evaluate(()=>!!window.__m1s3.state.library['prj_demo-a'].site.parcel),false);
  await shot(page,'s3-01-servicio-rechazado-1440x900.png');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('S3 · SIMULATED official answer: parcel, source, CRS; associate to A only; persists across reload; B untouched',async t=>{
  const {page,errors,catastroCalls,ctx}=await open(t,{tab:'parcela',catastro:route=>route.fulfill({status:200,contentType:'application/gml+xml',headers:{'access-control-allow-origin':'*'},body:syntheticWfs('1907401VK4810H')})});
  await page.fill('#rc','1907401-VK4810H');await page.click('#lookup');await page.waitForSelector('#parcelFacts');
  const facts=await text(page,'#parcelFacts');
  for(const re of [/Referencia\s+1907401VK4810H/,/Origen\s+Servicio oficial de Catastro/,/Dirección General del Catastro · WFS INSPIRE/,/EPSG:25830 · Península, huso 30/,/\b600 m²/,/no se comparte la geometría/])assert.match(facts,re);
  assert.equal(catastroCalls.length,1);
  await shot(page,'s3-02-parcela-encontrada-1440x900.png');
  await page.click('#associate');assert.match(await text(page,'#saved'),/Parcela guardada: 1907401VK4810H[\s\S]*Coincide con este proyecto y su revisión/);
  await page.selectOption('#project','prj_demo-b');assert.match(await text(page,'#saved'),/no tiene parcela asociada/);
  const p2=await ctx.newPage();await p2.goto(`${base}labs/m1-s2-s3/?tab=parcela`);await p2.waitForFunction(()=>window.__m1s3);
  assert.match(await p2.locator('#saved').innerText(),/1907401VK4810H/,'reopened: saved association restored');
  await p2.selectOption('#project','prj_demo-b');assert.match(await p2.locator('#saved').innerText(),/no tiene parcela asociada/);
  assert.deepEqual(errors,[]);
});

test('S3 · replace only with confirmation; placement dropped (never moved); explicit placement round trip; export policy',async t=>{
  const {page,errors,external,catastroCalls}=await open(t,{tab:'parcela'});
  await page.check('input[value=demo]');await page.evaluate(()=>{window.__m1s3.demoDelayMs=50;});
  await page.fill('#rc','1907401VK4810H');await page.click('#lookup');await page.waitForSelector('#associate');await page.click('#associate');
  await page.locator('#placeSvg').click({position:{x:180,y:110}});await page.fill('#north','30');await page.click('#savePlacement');
  assert.match(await text(page,'#placeStatus'),/Colocación guardada[\s\S]*error máximo (menos de 0,000001 mm|[\d,]+ mm)[\s\S]*dentro de la tolerancia de 0,001 mm/);
  assert.doesNotMatch(await text(page,'#placeStatus'),/e-\d/,'no scientific notation');
  assert.match(await text(page,'#saved'),/Vivienda colocada \(norte 30°\)/);
  await page.locator('#placeCard').scrollIntoViewIfNeeded();await shot(page,'s3-03-colocacion-1440x900.png');
  const rows=await page.evaluate(()=>[...document.querySelectorAll('#exportTable tr[data-channel]')].map(r=>[r.dataset.channel,r.cells[1].textContent.trim().slice(0,2)]));
  assert.deepEqual(rows,[['screen','Sí'],['video','No'],['html','No'],['snapshot','No']]);
  assert.match(await text(page,'#exportView'),/Referencia catastral 1907401VK4810H · Fuente: Datos de prueba/);
  assert.match(await text(page,'#contextView'),/Ortofoto PNOA[\s\S]*No cargado \(opcional\)[\s\S]*Terreno MDT05[\s\S]*No es levantamiento topográfico/);
  await page.fill('#rc','8888888YY8888Y');await page.click('#lookup');await page.waitForSelector('#confirmReplace');
  assert.match(await text(page,'#planView'),/requiere tu confirmación y quitará la colocación/);
  await page.click('#associate');assert.match(await text(page,'#associateError'),/Marca la casilla/);
  assert.match(await text(page,'#saved'),/1907401VK4810H[\s\S]*Vivienda colocada/,'nothing changed without confirmation');
  await shot(page,'s3-04-sustitucion-1440x900.png');
  await page.check('#confirmReplace');await page.click('#associate');
  assert.match(await text(page,'#saved'),/8888888YY8888Y[\s\S]*todavía no está colocada/);
  assert.equal(catastroCalls.length,0,'demo mode never calls the official service');assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('S3 · cancel, invalid reference, unsupported CRS, not found and GML fallback keep the saved parcel',async t=>{
  const {page,errors}=await open(t,{tab:'parcela'});await page.check('input[value=demo]');
  await page.evaluate(()=>{window.__m1s3.demoDelayMs=50;});await page.fill('#rc','1907401VK4810H');await page.click('#lookup');await page.waitForSelector('#associate');await page.click('#associate');
  await page.evaluate(()=>{window.__m1s3.demoDelayMs=4000;});await page.fill('#rc','8888888YY8888Y');await page.click('#lookup');
  await page.waitForSelector('#cancelLookup:not([hidden])');await page.click('#cancelLookup');
  await page.waitForFunction(()=>/cancelada/.test(document.getElementById('lookupStatus').textContent));
  await page.fill('#rc','ABC');await page.click('#lookup');assert.match(await text(page,'#lookupStatus'),/14 o 20 caracteres/);
  await page.evaluate(()=>{window.__m1s3.demoDelayMs=20;});
  await page.fill('#rc','5555555XX5555X');await page.click('#lookup');await page.waitForFunction(()=>/sistema de coordenadas/.test(document.getElementById('lookupStatus').textContent));
  await page.fill('#rc','1111111AA1111A');await page.click('#lookup');await page.waitForFunction(()=>/No existe ninguna parcela/.test(document.getElementById('lookupStatus').textContent));
  assert.match(await text(page,'#lookupStatus'),/Tu parcela guardada no cambia/);
  assert.match(await text(page,'#saved'),/1907401VK4810H/,'the saved parcel survived every failure');
  await page.fill('#rc','');await page.setInputFiles('#gmlFile',path.join(__dirname,'fixtures','catastro-cp-synthetic.gml'));
  await page.waitForSelector('#parcelFacts');assert.match(await text(page,'#parcelFacts'),/Origen\s+Archivo GML · catastro-cp-synthetic.gml[\s\S]*EPSG:25830/);
  assert.match(await text(page,'#planView'),/(Esta referencia es distinta|La geometría oficial ha cambiado|misma parcela)/);
  assert.deepEqual(errors,[]);
});

test('S3 · mobile 390×844: lookup, result and placement usable without horizontal scroll',async t=>{
  const {page,errors}=await open(t,{tab:'parcela',width:390,height:844,mobile:true});
  await page.check('input[value=demo]');await page.evaluate(()=>{window.__m1s3.demoDelayMs=20;});
  await page.fill('#rc','1907401VK4810H');await page.click('#lookup');await page.waitForSelector('#associate');
  assert.ok(await noHScroll(page));await page.locator('#parcelCard').scrollIntoViewIfNeeded();await shot(page,'s3-05-movil-parcela-390x844.png');
  await page.click('#associate');await page.locator('#placeCard').scrollIntoViewIfNeeded();assert.ok(await noHScroll(page));await shot(page,'s3-06-movil-colocar-390x844.png');
  assert.deepEqual(errors,[]);
});

/* Optional, never in CI: one real lookup through the browser to record the live service behaviour. */
test('LIVE (optional, FT3D8_M1_LIVE=1) · real official request from Chromium, outcome recorded',{skip:!process.env.FT3D8_M1_LIVE},async t=>{
  const ctx=await browser.newContext();t.after(()=>ctx.close());const page=await ctx.newPage();
  await page.goto(`${base}labs/m1-s2-s3/?tab=parcela`);await page.waitForFunction(()=>window.__m1s3);
  await page.fill('#rc',process.env.FT3D8_M1_LIVE_REF||'3662001TF3136S');await page.click('#lookup');
  await page.waitForFunction(()=>!document.getElementById('lookup').disabled,null,{timeout:60000});
  // Facts only: the official geometry itself is not stored (DGC licence: no dissemination of untransformed data).
  const out=await page.evaluate(()=>{const r=window.__m1s3.state.result,p=r?.parcel;return {status:document.getElementById('lookupStatus').textContent,diagnostic:window.__m1s3.official.lastDiagnostic(),
    parcel:p?{reference:p.reference,sourceCrs:p.sourceCrs,polygons:p.sourceGeometry.polygons.length,vertices:p.sourceGeometry.polygons.reduce((a,q)=>a+q.rings.reduce((b,x)=>b+x.length,0),0),
      provider:r.providerId,sourceName:r.provenance.sourceName,license:r.provenance.license.status,retrievedAt:r.provenance.retrievedAt,
      areaText:[...document.querySelectorAll('#parcelFacts dt')].find(d=>d.textContent==='Superficie del polígono')?.nextElementSibling?.textContent}:null};});
  console.log('# LIVE',JSON.stringify(out));if(shots)await fs.writeFile(path.join(shots,'live-catastro.json'),JSON.stringify(out,null,1));
});
