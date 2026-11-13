'use strict';
/* UX-07 / ENT-04 · propuesta de activación: «Comparar con el original» desde «Variantes» → comparador de solo lectura en
   comparar/, en el MISMO origen que el editor (mismo servidor, mismo hostname: comparten localStorage).
   Flujo real con la interfaz del editor (Proyectos → Crear variante → editar → Comparar variantes → botón de la variante),
   en 1440×900, 390×844 y 844×390, y casos negativos sobre la dirección del comparador. Datos SINTÉTICOS: proyecto de
   ejemplo de RUBIK y presupuestos de prueba con precios ficticios (labs/ux07-ent04/fixtures.js).
   Comprobado siempre: el localStorage completo queda IDÉNTICO byte a byte (no se llama a library.save ni se escribe nada),
   la dirección solo lleva identificadores, sin errores de página y sin peticiones fuera del servidor local. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const F=require('../labs/ux07-ent04/fixtures.js'),Core=require('../js/project-core.js');
const root=path.resolve(__dirname,'..'),shots=process.env.UX07_ACT_SHOTS||null;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.wasm':'application/wasm'};
let server,browser,base;
test.before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
  if(shots)await fs.mkdir(shots,{recursive:true});
});
test.after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const LIB='rubik-sota-project-library-v1',BUDGETS='rubik-budget-v1';
const storageOf=page=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
function watch(page){const w={errors:[],external:[]};page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))w.external.push(u);});return w;}

async function editor(context){
  const page=await context.newPage(),w=watch(page);await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(base);await require('./editor-fixture.cjs')(page);await page.waitForFunction(()=>!!window.FloorPlanVariantsCompare);return {page,w};
}
// La variante se crea con la interfaz del editor; luego se le cambia el suelo de una estancia (cambia cantidades del
// presupuesto) y se quita un mueble, con el mutate del propio editor (lo que haría una persona en el panel).
async function makeVariant(page){
  await page.locator('#projectsBtn').click();await page.locator('#projectsDialog').waitFor();
  // Hasta el primer guardado la biblioteca puede no existir: el original es el «variantOf» de la variante creada.
  await page.locator('#projectVariant').click();await page.waitForFunction(k=>{const l=JSON.parse(localStorage.getItem(k)||'null');return !!l?.entries.find(e=>e.id===l.activeId)?.variantOf;},LIB);
  const originalId=await page.evaluate(k=>{const l=JSON.parse(localStorage.getItem(k));return l.entries.find(e=>e.id===l.activeId).variantOf;},LIB);
  await page.locator('#projectClose').click();
  await page.evaluate(()=>{const p=FloorPlanApp.project,room=p.rooms.find(r=>r.floorMaterialId),other=p.materials.find(m=>m.category==='floor'&&m.id!==room.floorMaterialId);
    mutate(()=>{state.rooms[room.id].mat=other.id;});const o=p.objects[0];mutate(()=>{state.furniture=state.furniture.filter(f=>f.id!==o.id);});});
  const lib=JSON.parse(await page.evaluate(k=>localStorage.getItem(k),LIB)),variant=lib.entries.find(e=>e.id===lib.activeId),original=lib.entries.find(e=>e.id===originalId);
  assert.equal(variant.variantOf,originalId);return {lib,variant,original};
}
async function openComparator(page,mobile,shot=null){
  await page.locator('#projectsBtn').click();await page.locator('#projectsDialog').waitFor();await page.locator('#projectCompare').click();await page.locator('#variantsDialog').waitFor();
  const btn=page.locator('#variantsCards .variant-card').nth(1).locator('[data-action="compare"]');
  assert.equal(await page.locator('#variantsCards .variant-card').nth(0).locator('[data-action="compare"]').count(),0,'el original no tiene «Comparar con el original»');
  assert.equal(await btn.textContent(),'Comparar con el original');await btn.scrollIntoViewIfNeeded();if(shot)await page.screenshot({path:shot});
  const [popup]=await Promise.all([page.context().waitForEvent('page'),mobile?btn.tap():btn.click()]);
  await popup.waitForLoadState();return popup;
}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`flujo real editor → Variantes → comparador, mismo origen, solo lectura ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
  const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
  const {page,w}=await editor(context);const {variant,original}=await makeVariant(page);
  // Presupuestos guardados (como los guardaría «Presupuestar»), completos, de cada distribución.
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[BUDGETS,JSON.stringify({[original.project.id]:F.budget('complete',original.project),[variant.project.id]:F.budget('complete',variant.project)})]);
  const before=await storageOf(page);
  const cmp=await openComparator(page,mobile,shots?path.join(shots,`${name}-0-variantes.png`):null),cw=watch(cmp);
  await cmp.waitForSelector('#cmpCard:not([hidden])');
  // Mismo origen y en la dirección solo identificadores (nada de proyectos, presupuestos ni secretos).
  const u=new URL(cmp.url());assert.equal(u.origin,new URL(base).origin,'mismo origen que el editor');assert.equal(u.pathname,'/comparar/');
  assert.deepEqual([...u.searchParams.keys()].sort(),['after','anchor','before','src']);
  assert.deepEqual([u.searchParams.get('before'),u.searchParams.get('after')],[original.id,variant.id]);
  for(const v of u.searchParams.values())assert.match(v,/^[A-Za-z0-9_-]{1,80}$/);assert.ok(cmp.url().length<300);
  // Avisos de alcance y de solo lectura.
  assert.match(await cmp.locator('#savedNotice').textContent(),/Se compara lo guardado en este navegador/);
  assert.match(await cmp.locator('#scope').textContent(),/el original y una variante/);
  // Cambios reales: el suelo cambiado y el mueble quitado.
  const changes=await cmp.locator('#changes li').allTextContents();
  assert.ok(changes.some(c=>/Estancia .*acabado cambiado/.test(c)),`suelo cambiado: ${changes}`);assert.ok(changes.some(c=>/Objeto .*quitado/.test(c)),`mueble quitado: ${changes}`);
  assert.equal(await cmp.locator('#bcOut').getAttribute('data-status'),'complete');assert.match(await cmp.locator('#bcSummary').textContent(),/Comparación completa/);
  if(shots)await cmp.screenshot({path:path.join(shots,`${name}-1-comparador.png`),fullPage:!mobile});
  // Borrador interno: marcado, sin envío, verificable.
  await cmp.locator('#buildBtn').click();await cmp.waitForSelector('#dosOut:not([hidden])');
  const dossier=await cmp.evaluate(()=>window.__ux07Compare.dossier.html);assert.match(dossier,/Borrador interno · no enviado al cliente/);
  // Sin scripts ni recursos externos (la única «http» es el espacio de nombres del SVG, que no se descarga).
  assert.doesNotMatch(dossier,/<script|<iframe|<link[^>]+href|(src|href)\s*=\s*["']?https?:|url\(\s*["']?https?:/i,'sin scripts ni recursos externos');
  assert.deepEqual([...new Set(dossier.match(/https?:\/\/[^"'\s)]+/g)||[])],['http://www.w3.org/2000/svg']);
  await cmp.locator('#verifyBtn').click();await cmp.waitForSelector('#verifyOut li.sum');assert.equal(await cmp.locator('#verifyOut li.sum').getAttribute('data-ok'),'true');
  if(shots)await cmp.screenshot({path:path.join(shots,`${name}-2-borrador.png`)});
  // Sin desbordar la pantalla, sin errores, sin red y sin NINGUNA escritura (editor y comparador comparten almacenamiento).
  assert.ok(await cmp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'sin desplazamiento horizontal');
  assert.equal(await storageOf(cmp),before,'el localStorage completo queda idéntico byte a byte');assert.equal(await storageOf(page),before);
  assert.deepEqual(cw.errors,[]);assert.deepEqual(cw.external,[]);assert.deepEqual(w.errors,[]);
});

// Estados del presupuesto con datos guardados de verdad en el mismo origen: completo, parcial, incoherente, ausente y de
// otro proyecto. Nunca una diferencia engañosa; en incoherente, ningún importe (ni en pantalla ni en el contrato interno).
test('presupuestos: completo, parcial, incoherente, ausente y de otro proyecto; nunca una diferencia engañosa',{timeout:300000},async t=>{
  const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
  const {page}=await editor(context);const {variant,original}=await makeVariant(page);
  const O=original.project,Vp=variant.project,wrongSubject=Core.clone(O);wrongSubject.id=Vp.id;// cantidades del original con el id de la variante
  const cases={
    complete:{[O.id]:F.budget('complete',O),[Vp.id]:F.budget('complete',Vp)},
    partial:{[O.id]:F.budget('complete',O),[Vp.id]:F.budget('partial',Vp)},
    incoherent:{[O.id]:F.budget('complete',O),[Vp.id]:F.budget('complete',wrongSubject)},
    absent:null,
    'other-project':{[Vp.id]:F.budget('complete',O)},
  };
  let cmp=null;
  for(const [name,map] of Object.entries(cases)){
    await page.evaluate(([k,v])=>v===null?localStorage.removeItem(k):localStorage.setItem(k,v),[BUDGETS,map&&JSON.stringify(map)]);
    const before=await storageOf(page);
    if(!cmp)cmp=await openComparator(page,false);else await cmp.reload();
    await cmp.waitForSelector('#cmpCard:not([hidden])');const status=await cmp.locator('#bcOut').getAttribute('data-status'),text=await cmp.locator('#bcSummary').textContent();
    if(name==='complete'){assert.equal(status,'complete');assert.match(text,/Sin IVA: .*→/);}
    if(name==='partial'){assert.equal(status,'partial');assert.match(text,/No es la diferencia de coste total/);assert.doesNotMatch(text,/Comparación completa/);}
    if(name==='incoherent'){assert.equal(status,'incoherent');assert.doesNotMatch(text,/€/,'ni un importe en pantalla');assert.match(text,/Importes no mostrados/);
      assert.equal(await cmp.locator('#bcTable table').count(),0,'sin tabla de partidas con importes');
      const bc=await cmp.evaluate(()=>window.__ux07Compare.prepared.budgetComparison);
      for(const side of [bc.before,bc.after]){assert.equal(side.amountsWithheld,true);for(const k of ['net','tax','gross','complete','unpriced','unreviewed'])assert.equal(side[k],undefined,`contrato interno sin ${k}`);}
      assert.ok(bc.lines.every(l=>l.delta===null&&l.status==='withheld'&&!('net' in (l.before||{}))&&!('net' in (l.after||{}))),'ninguna partida con importe');
      assert.equal(bc.totals.net,undefined);}
    if(name==='absent'){assert.equal(status,'none');assert.match(text,/Sin presupuestos guardados/);}
    if(name==='other-project'){assert.equal(status,'error');assert.match(text,/no corresponde a su distribución/);assert.match(text,/sin importes/);
      assert.equal(await cmp.locator('#cmpCard').isVisible(),true,'la comparación de planos sigue');}
    assert.equal(await storageOf(cmp),before,`${name}: nada escrito`);
  }
});

// Casos negativos directamente sobre la dirección del comparador (mismo origen): nada se muestra, nada se escribe.
test('negativos: sin parámetros, inexistentes, distinto grupo, identificadores inválidos, biblioteca dañada y variante borrada después',{timeout:300000},async t=>{
  const context=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});t.after(()=>context.close());
  const {page}=await editor(context);const {lib,variant,original}=await makeVariant(page);
  const go=async(cmp,query)=>{await cmp.goto(base+'comparar/'+query);await cmp.waitForSelector('#fatalCard:not([hidden]), #cmpCard:not([hidden])');
    return {fatal:await cmp.locator('#fatalCard').isVisible(),msg:await cmp.locator('#fatal').textContent(),shown:await cmp.locator('#cmpCard').isVisible()};};
  const cmp=await context.newPage(),cw=watch(cmp);const before=await storageOf(page);
  let r=await go(cmp,'');assert.ok(r.fatal&&!r.shown);assert.match(r.msg,/Faltan las dos distribuciones/);
  r=await go(cmp,`?src=library&before=${original.id}&after=ent_no-existe`);assert.ok(r.fatal&&!r.shown);
  r=await go(cmp,`?src=library&before=${encodeURIComponent('<img src=x onerror=alert(1)>')}&after=${variant.id}`);assert.ok(r.fatal&&!r.shown);assert.match(r.msg,/no son válidos/);
  assert.equal(await cmp.locator('img').count(),0,'nada de la dirección se inserta como HTML');
  r=await go(cmp,`?src=library&before=${variant.id}&after=${variant.id}`);assert.ok(r.fatal);assert.match(r.msg,/distintas/);
  // Otro proyecto de la biblioteca, sin relación de variante (distinto grupo).
  const stray=Core.clone(original.project);stray.id='prj_ux07-otro';stray.name='Otro proyecto';
  const lib2={...lib,entries:[...lib.entries,{id:'ent_ux07-otro',name:'Otro proyecto',project:stray}]};
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[LIB,JSON.stringify(lib2)]);const withStray=await storageOf(page);
  r=await go(cmp,`?src=library&before=ent_ux07-otro&after=${variant.id}&anchor=${variant.id}`);assert.ok(r.fatal&&!r.shown);assert.match(r.msg,/no están en el mismo grupo/);
  assert.equal(await storageOf(cmp),withStray);
  // Biblioteca dañada: se dice y NO se repara ni se reescribe.
  await page.evaluate(k=>localStorage.setItem(k,'{dañado'),LIB);const corrupt=await storageOf(page);
  r=await go(cmp,`?src=library&before=${original.id}&after=${variant.id}`);assert.ok(r.fatal&&!r.shown);assert.match(r.msg,/no se puede leer/);
  assert.equal(await storageOf(cmp),corrupt,'la biblioteca dañada queda tal cual');
  // Cambio de selección: comparador abierto y luego la variante desaparece; al recargar no queda nada anterior a la vista.
  await page.evaluate(([k,v])=>localStorage.setItem(k,v),[LIB,JSON.stringify(lib)]);
  r=await go(cmp,`?src=library&before=${original.id}&after=${variant.id}`);assert.ok(r.shown);
  const gone={...lib,entries:lib.entries.filter(e=>e.id!==variant.id),activeId:original.id};await page.evaluate(([k,v])=>localStorage.setItem(k,v),[LIB,JSON.stringify(gone)]);
  await cmp.reload();await cmp.waitForSelector('#fatalCard:not([hidden])');assert.equal(await cmp.locator('#cmpCard').isVisible(),false,'nada anterior a la vista');
  assert.ok(await cmp.evaluate(()=>window.__ux07Compare.prepared===null));
  assert.deepEqual(cw.errors,[]);assert.deepEqual(cw.external,[]);
  void before;
});

// Edificios: se compara la planta del mismo orden en cada distribución y se dice; nunca se presenta como el edificio entero.
test('edificio de dos plantas: el comparador nombra las plantas comparadas y no promete el edificio completo',{timeout:180000},async t=>{
  const Building=require('../js/building-core.js'),Library=require('../js/project-library.js');
  const m=new Map(),mem={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
  const lib=Library.load(mem,Core.initial());let b=Building.create(Core.initial());b=Building.addLevel(b,Core.initial(),{name:'Planta primera'});
  lib.addBuilding(b,{activeLevelId:b.levels[1].id});const originalId=lib.activeId();
  lib.variant(lib.project(),'Edificio · Variante 1');const variantId=lib.activeId();
  const v=lib.project();v.objects=v.objects.slice(1);lib.save(v);// la variante cambia en la planta activa (primera)
  const context=await browser.newContext({viewport:{width:844,height:390},isMobile:true,hasTouch:true});t.after(()=>context.close());
  const cmp=await context.newPage(),cw=watch(cmp);await cmp.goto(base+'comparar/');
  await cmp.evaluate(entries=>{for(const [k,v] of entries)localStorage.setItem(k,v);},[...m.entries()]);const before=await storageOf(cmp);
  await cmp.goto(`${base}comparar/?src=library&before=${originalId}&after=${variantId}&anchor=${variantId}`);await cmp.waitForSelector('#cmpCard:not([hidden])');
  const scope=await cmp.locator('#scope').textContent();
  assert.match(scope,/planta «Planta primera» frente a planta «Planta primera»/);assert.match(scope,/No es una comparación del edificio completo/);
  assert.match(await cmp.locator('#notes').textContent(),/Edificio: se compara la planta/);
  assert.ok(await cmp.locator('#changes li').count()>=1,'el cambio de la planta aparece');
  assert.equal(await storageOf(cmp),before,'nada escrito');assert.deepEqual(cw.errors,[]);assert.deepEqual(cw.external,[]);
  assert.ok(await cmp.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
});
