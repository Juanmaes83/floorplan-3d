'use strict';
/* CAT-02 «Mi estudio → Mis catálogos» en el editor REAL, con los controles visibles: cargar el piloto sintético, buscar
   y filtrar, ver la ficha, descargarla (HTML/JSON), congelar una selección, importar una colección con casos negativos
   (SKU duplicado, marca falsa, precio sin fecha, imagen sin permiso, licencia caducada, electrodoméstico incongruente,
   variante contradictoria), versionado, separación por estudio, reabrir; teléfono y apaisado en EN/ZH.
   Las lecturas de estado interno son comprobaciones POSTERIORES. Fixtures sintéticos propios (assets/cat-ia/fixtures). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const K=require('./photo-project/kit.cjs'),C=require('../js/catalog-product-core.js');
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'..','assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const OUT=process.env.CAT_IA_SHOTS||null;
let env;
test.before(async()=>{env=await K.start();});
test.after(async()=>{await env?.stop();});
const clone=v=>JSON.parse(JSON.stringify(v));
const shot=async(page,name)=>{if(!OUT)return;fs.mkdirSync(OUT,{recursive:true});await page.screenshot({path:path.join(OUT,name+'.png')});};
async function openCatalogs(page,{touch=false}={}){
 const go=l=>touch?l.tap():l.click();
 await go(page.locator('#workArea-studio'));await page.locator('#catalogStudioCard').waitFor();
 const b=page.locator('#catalogOpen');await b.scrollIntoViewIfNeeded();await go(b);await page.locator('#catalogDialog[open]').waitFor();
}
async function download(page,locator){const [d]=await Promise.all([page.waitForEvent('download'),locator.click()]);return {name:d.suggestedFilename(),text:fs.readFileSync(await d.path(),'utf8')};}
const items=page=>page.locator('#catalogList .catalog-item').evaluateAll(n=>n.map(x=>x.dataset.key).sort());
const negatives=()=>{
 const p=PILOT.products,m=[];
 m.push(Object.assign(clone(p[2]),{productId:'horno-h60-copia'}));                                  // SKU duplicado
 m.push(Object.assign(clone(p[4]),{productId:'lampara-falsa',variantId:null,sku:'QA-FAKE-1',brand:'IKEA'})); // marca falsa
 const noDate=Object.assign(clone(p[4]),{productId:'lampara-sin-fecha',variantId:null,sku:'QA-NODATE-1'});noDate.commercial.verifiedAt=null;m.push(noDate);
 const noPerm=Object.assign(clone(p[4]),{productId:'lampara-sin-permiso',variantId:null,sku:'QA-NOPERM-1'});noPerm.imageRefs[0].license={scope:['qa'],proofRef:'x'};m.push(noPerm);
 const expired=Object.assign(clone(p[4]),{productId:'lampara-caducada',variantId:null,sku:'QA-EXP-1'});expired.imageRefs[0].license.expiresAt='2026-01-01';m.push(expired);
 const huge=Object.assign(clone(p[2]),{productId:'horno-gigante',sku:'QA-H60-XXL'});huge.dimensionsMm.height=5950;m.push(huge); // incongruente
 m.push(Object.assign(clone(p[0]),{variantId:'blanco',sku:'QA-LUMEN-160-BL',family:'dormitorios'})); // variante contradictoria
 const edit=clone(p[0]);edit.commercial.netUnitPrice=710;m.push(edit);                               // nueva versión válida
 return {schema:'rubik-catalog-collection/1',catalogId:'piloto-sintetico-qa',name:'Piloto sintético QA',products:m};
};

test('CAT-02 escritorio: piloto, búsqueda, ficha exportable, selección congelada, rechazos explicados, versiones, estudios y reabrir',{timeout:300000},async()=>{
 const {context,page}=await K.editor(env,{acceptDownloads:true});const w=K.watch(page,env.base);
 try{
  const before=await K.snapshot(page);
  await openCatalogs(page);assert.match(await page.locator('#catalogRevision').innerText(),/Sin catálogo/);assert.match(await page.locator('#catalogTruth').innerText(),/ni separa estudios de forma segura/);
  await shot(page,'01-vacio');
  await page.locator('#catalogLoadPilot').click();await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.imported==='5');
  assert.match(await page.locator('#catalogImportSummary').innerText(),/5 nuevas, 0 nuevas versiones, 0 sin cambios, 0 rechazadas/);
  assert.match(await page.locator('#catalogRevision').innerText(),/Revisión 1 · 5 fichas · huella [0-9a-f]{12}…/);
  assert.equal((await items(page)).length,5);await page.waitForFunction(()=>document.querySelectorAll('#catalogList .catalog-thumb img').length===5);
  await shot(page,'02-piloto');
  // Búsqueda y filtros.
  await page.locator('#catalogSearch').fill('lumen');assert.deepEqual(await items(page),['aparador-lumen@nogal','aparador-lumen@roble']);
  await page.locator('#catalogSearch').fill('');await page.locator('#catalogPrice').selectOption('unknown');assert.deepEqual(await items(page),['horno-h60@inox']);
  await page.locator('#catalogPrice').selectOption('');await page.locator('#catalogDims').selectOption('unknown');assert.deepEqual(await items(page),['encimera-basalto@-']);
  await page.locator('#catalogDims').selectOption('');await page.locator('#catalogFamily').selectOption('iluminacion');assert.deepEqual(await items(page),['lampara-orbe@ambar']);
  await page.locator('#catalogFamily').selectOption('');assert.match(await page.locator('#catalogCount').innerText(),/5 de 5 fichas/);
  // Ficha del horno (precio desconocido) y de la encimera (medidas desconocidas).
  await page.locator('#catalogList .catalog-item[data-key="horno-h60@inox"]').click();await page.locator('#catalogPreviewImage').waitFor();
  const cell=k=>page.locator(`#catalogSheetTable tr[data-k="${k}"] td`);
  assert.equal(await cell('price').innerText(),'Desconocido');assert.equal(await cell('price').getAttribute('class'),'unknown');assert.equal(await cell('width').innerText(),'595 mm');
  const notices=await page.locator('#catalogNotices').innerText();assert.match(notices,/Sin afiliación/);assert.match(notices,/Fixture sintético/);assert.match(notices,/Precio desconocido/);
  await shot(page,'03-ficha-horno');
  const html=await download(page,page.locator('#catalogSheetHtml'));assert.equal(html.name,'rubik-ficha-QA-H60-INOX.html');
  assert.match(html.text,/default-src 'none'/);assert.doesNotMatch(html.text,/<script/i);assert.match(html.text,/<img src="data:image\/png;base64,/);assert.match(html.text,/Desconocido/);assert.match(html.text,/Horno integrable de 60 cm\. Precio desconocido a propósito\./);
  const js=JSON.parse((await download(page,page.locator('#catalogSheetJson'))).text);assert.equal(js.schema,'rubik-catalog-sheet/1');{const{hash,...b}=js;assert.equal(C.hashOf(b),hash);}
  await page.locator('#catalogAddSel').click();
  await page.locator('#catalogList .catalog-item[data-key="aparador-lumen@roble"]').click();await page.locator('#catalogPreview[data-key="aparador-lumen@roble"]').waitFor();
  await page.locator('#catalogAddSel').click();await page.locator('#catalogAddSel').click();
  assert.deepEqual(await page.locator('#catalogSelection li').allInnerTexts().then(t=>t.map(s=>s.replace(/\s*×$/,''))),['1 × Horno integrable H60 inox (QA-H60-INOX)','2 × Aparador Lumen 160 roble (QA-LUMEN-160-RB)']);
  const frozen=JSON.parse((await download(page,page.locator('#catalogFreeze'))).text);
  assert.equal(frozen.catalogRevision,1);assert.equal(frozen.items[1].product.commercial.netUnitPrice,690);{const{hash,...b}=frozen;assert.equal(C.hashOf(b),hash);}
  assert.match(await page.locator('#catalogSelNote').innerText(),/Selección congelada: revisión 1/);
  await page.locator('#catalogList .catalog-item[data-key="encimera-basalto@-"]').click();await page.locator('#catalogPreview[data-key="encimera-basalto@-"]').waitFor();
  assert.equal(await cell('width').innerText(),'No verificada');assert.match(await page.locator('#catalogNotices').innerText(),/Medidas incompletas/);
  // Importación con casos negativos: cada rechazo dice por qué; la ficha válida crea una nueva versión.
  await page.locator('#catalogImportFile').setInputFiles({name:'coleccion-qa.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(negatives()))});
  await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.rejected==='7');
  assert.match(await page.locator('#catalogImportSummary').innerText(),/0 nuevas, 1 nuevas versiones, 0 sin cambios, 7 rechazadas/);
  const why=sku=>page.locator(`#catalogRejected li[data-sku="${sku}"]`).innerText();
  assert.match(await why('QA-H60-INOX'),/ya existe en el catálogo/);assert.match(await why('QA-FAKE-1'),/Marca de terceros usada como propia/);
  assert.match(await why('QA-NODATE-1'),/fecha en que se comprobó/);assert.match(await why('QA-NOPERM-1'),/sin permiso documentado/);
  assert.match(await why('QA-EXP-1'),/licencia ha caducado/);assert.match(await why('QA-H60-XXL'),/incongruente/);assert.match(await why('QA-LUMEN-160-BL'),/Variante contradictoria/);
  assert.match(await page.locator('#catalogRevision').innerText(),/Revisión 2 · 5 fichas/);
  await shot(page,'04-rechazos');
  // La selección congelada antes no cambia: el precio de la revisión 2 es otro.
  await page.locator('#catalogList .catalog-item[data-key="aparador-lumen@roble"]').click();await page.locator('#catalogPreview[data-key="aparador-lumen@roble"]').waitFor();
  assert.match(await cell('price').innerText(),/710/);assert.match(await cell('version').innerText(),/v2 · revisión de catálogo 2/);assert.equal(frozen.items[1].product.commercial.netUnitPrice,690);
  // Archivo que no es una colección / no es JSON.
  await page.locator('#catalogImportFile').setInputFiles({name:'x.json',mimeType:'application/json',buffer:Buffer.from('{"schema":"otra/1"}')});
  assert.match(await page.locator('#catalogImportError').innerText(),/no es una colección RUBIK/);
  await page.locator('#catalogImportFile').setInputFiles({name:'x.json',mimeType:'application/json',buffer:Buffer.from('{roto')});
  assert.match(await page.locator('#catalogImportError').innerText(),/no es JSON válido/);
  // Otro estudio (perfil de marca) no ve este catálogo; el catálogo de «este navegador» sigue intacto.
  await page.locator('#catalogClose').click();
  await page.evaluate(()=>FloorPlanBrand.saveProfile(FloorPlanBrandUI.store,{name:'Estudio Sur QA'}));
  await openCatalogs(page);const sur=await page.locator('#catalogStudio option').evaluateAll(o=>o.map(x=>x.value).find(v=>v!=='local'));assert.ok(sur);
  await page.locator('#catalogStudio').selectOption(sur);assert.match(await page.locator('#catalogRevision').innerText(),/Sin catálogo/);assert.equal((await items(page)).length,0);
  await shot(page,'05-otro-estudio');
  await page.locator('#catalogStudio').selectOption('local');assert.match(await page.locator('#catalogRevision').innerText(),/Revisión 2 · 5 fichas/);
  // Sin red externa, sin errores y el proyecto (y su historial) no ha cambiado.
  const after=await K.snapshot(page);assert.equal(after.project,before.project);assert.equal(after.undo,before.undo);assert.equal(after.redo,before.redo);
  assert.equal(await K.hScroll(page),false);
  await page.locator('#catalogClose').click();
  // Reabrir: el catálogo sigue (revisión 2).
  await K.reopen(page);await openCatalogs(page);assert.match(await page.locator('#catalogRevision').innerText(),/Revisión 2 · 5 fichas/);
  // Interfaz para el Asistente: sólo lectura.
  const cap=await page.evaluate(()=>{const c=RubikCatalogUI.capabilities;return {v:c.version,keys:Object.keys(c).sort(),n:c.listCatalogs()[0].products};});
  assert.deepEqual(cap,{v:'CatalogCapabilitiesForAssistantV1',keys:['limits','listCatalogs','readOnly','search','sheet','version'],n:5});
  assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
 }finally{await context.close();}
});

for(const [label,viewport,lang] of [['teléfono 390×844 EN',{width:390,height:844},'en'],['apaisado 844×390 ZH',{width:844,height:390},'zh']]){
 test(`CAT-02 ${label}: táctil, idioma, sin desbordes, ficha y rechazo`,{timeout:240000},async()=>{
  const {context,page}=await K.editor(env,{viewport,isMobile:true,hasTouch:true,acceptDownloads:true});const w=K.watch(page,env.base);
  try{
   await page.evaluate(l=>localStorage.setItem('rubik-sota-floorplan-lang',l),lang);await K.reopen(page);
   await openCatalogs(page,{touch:true});
   const t={en:{title:'My catalogues',sum:/5 new, 0 new versions/,unk:'Unknown',rej:/already exists/},zh:{title:'我的目录',sum:/新增 5/,unk:'未知',rej:/已用于/}}[lang];
   assert.equal(await page.locator('#catalogTitle').innerText(),t.title);
   await page.locator('#catalogLoadPilot').tap();await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.imported==='5');
   assert.match(await page.locator('#catalogImportSummary').innerText(),t.sum);
   const oven=page.locator('#catalogList .catalog-item[data-key="horno-h60@inox"]');await oven.scrollIntoViewIfNeeded();await oven.tap();await page.locator('#catalogPreviewImage').waitFor();
   assert.equal(await page.locator('#catalogSheetTable tr[data-k="price"] td').innerText(),t.unk);
   const overflow=await page.evaluate(()=>{const d=document.querySelector('#catalogDialog');return {dialog:d.scrollWidth>d.clientWidth+1,page:document.documentElement.scrollWidth>innerWidth+1};});
   assert.deepEqual(overflow,{dialog:false,page:false});
   const small=await page.locator('#catalogDialog button:visible').evaluateAll(b=>b.filter(x=>{const r=x.getBoundingClientRect();return r.height<44&&r.width>0;}).map(x=>x.id||x.textContent));
   assert.deepEqual(small,[],'targets ≥ 44 px');
   await shot(page,`06-${lang}-ficha`);
   const dupe=Object.assign(clone(PILOT.products[2]),{productId:'horno-copia'});
   await page.locator('#catalogImportFile').setInputFiles({name:'d.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify({schema:'rubik-catalog-collection/1',catalogId:'piloto-sintetico-qa',products:[dupe]}))});
   await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.rejected==='1');assert.match(await page.locator('#catalogRejected').innerText(),t.rej);
   await shot(page,`07-${lang}-rechazo`);
   assert.deepEqual(w.external,[]);assert.deepEqual(w.errors,[]);
  }finally{await context.close();}
 });
}
