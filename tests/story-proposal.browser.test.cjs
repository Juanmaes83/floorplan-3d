'use strict';
/* StoryLayersV1 · §7.3 plantilla comercial, recorrido REAL desde Entregar › P10 con el caso de control del propietario:
   salón Baldosa 800 → Moqueta (superficie y distribución conservadas). Identidad de «Mi estudio» con los campos elegidos,
   propuesta escrita por el profesional (texto largo que continúa en otra página), notas Para el cliente / Interna, coste
   ausente sin presupuesto, «Previsualizar como cliente» = archivo descargado (mismos bytes), volver a editar invalida la
   vista previa, y sin identidad la propuesta sale sin nombre ni logo. Evidencia opcional: SL_SHOTS=<dir>, SL_EXPORT=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),L=require('../js/project-library.js'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.SL_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
const PROFILE={id:'brd_estudionorte',name:'Estudio Norte Interiorismo',person:'Ana Ruiz',phone:'+34 600 123 456',email:'ana@estudionorte.es',web:'https://estudionorte.es',tagline:'Reformas de vivienda',cta:'',logo:null,updatedAt:'2026-11-26T10:00:00.000Z'};
// Caso de control: la variante solo cambia el suelo del salón de Baldosa 800 a Moqueta.
function seed({brand=true}={}){const m=new Map(),st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 const base=F.before(),living=base.rooms.find(r=>r.id==='rom_living');assert.ok(living,'el ejemplo tiene salón');living.floorMaterialId='mat_tile800';
 const lib=L.load(st,base);lib.variant(base,'Propuesta moqueta');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=JSON.parse(JSON.stringify(base));e.id=v.project.id;e.name=v.project.name;
 e.rooms.find(r=>r.id==='rom_living').floorMaterialId='mat_carpet';lib.save(e);const group=lib.group(lib.activeId());
 if(brand){m.set('rubik-sota-brand-profiles-v1',JSON.stringify({version:1,profiles:[PROFILE]}));m.set('rubik-sota-brand-delivery-v1',JSON.stringify({version:1,entries:Object.fromEntries(group.map(g=>[g.id,{profileId:PROFILE.id}]))}));}
 return {storage:Object.fromEntries(m),group};}
async function open(storage,viewport={width:1440,height:900}){
 const ctx=await env.browser.newContext({acceptDownloads:true,viewport});
 await ctx.addInitScript(([s])=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);localStorage.setItem('rubik-lang','es');sessionStorage.setItem('s','1');},[storage]);
 const page=await ctx.newPage();const w=K.watch(page,env.base);await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog[open]'));}
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForSelector('#professionalWorkspace [data-route="story-layers"]',{state:'attached'});
 const b=await accion(page,'#professionalWorkspace [data-route="story-layers"]');/* click() re-resuelve y desplaza (Entregar puede repintar la ficha) */await b.click();await page.waitForSelector('#storyLayersDialog[open] [data-sl="state"]');
 return {ctx,page,w};}
const fill=async(page,key,text)=>{const t=page.locator(`#storyLayersDialog [data-sl="p-${key}"]`);await t.fill(text);await t.dispatchEvent('change');};
const LONG=('La moqueta de lana aporta confort acústico y térmico en la zona de estar, donde la familia pasa más horas. '.repeat(19)+'Se mantiene la baldosa en el paso hacia la cocina.').slice(0,2000);
async function previewBytes(page){return page.evaluate(async()=>Promise.all([...document.querySelectorAll('#storyLayersDialog [data-sl="preview"] img')].map(async i=>{const b=new Uint8Array(await (await fetch(i.src)).arrayBuffer());
 const h=[...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');return h;})));}

test('§7.3 · caso Baldosa 800 → Moqueta: propuesta del estudio, notas con visibilidad, vista previa = archivo, texto largo en varias páginas',{timeout:300000},async()=>{
 const {storage}=seed();const {ctx,page,w}=await open(storage);try{
  // Lo que RUBIK comprueba, en lenguaje natural, ya visible antes de escribir nada.
  // Nombres VISIBLES del producto (embudo FloorPlanDisplayName): mat_tile800 se muestra «Baldosa 80×80».
  const NM=await page.evaluate(()=>{const m=id=>FloorPlanApp.project.materials.find(x=>x.id===id);return {a:FloorPlanDisplayName(m('mat_tile800').name,'material'),b:FloorPlanDisplayName(m('mat_carpet').name,'material')};});assert.equal(NM.b,'Moqueta');
  const CHANGE=`Suelo de Salón: ${NM.a} → ${NM.b}.`;
  const ph=await page.locator('#storyLayersDialog [data-sl="p-summary"]').getAttribute('placeholder');assert.ok(ph.includes(CHANGE),ph);
  assert.match(await page.locator('#storyLayersDialog [data-sl="cost"]').innerText(),/No hay un presupuesto guardado/);assert.equal(await page.locator('#storyLayersDialog [data-sl="cost"]').getAttribute('data-status'),'absent');
  // Identidad de Mi estudio: el profesional elige mostrar persona y correo (no teléfono).
  await page.locator('#storyLayersDialog [data-sl="id-person"]').check();await page.locator('#storyLayersDialog [data-sl="id-email"]').check();
  await fill(page,'title','Salón más cálido: moqueta de lana en la zona de estar');await fill(page,'summary','Proponemos cambiar el suelo del salón de baldosa a moqueta. La superficie y la distribución no cambian.');
  await fill(page,'why',LONG);await fill(page,'how',('Retirada de la baldosa existente, regularización con mortero autonivelante y colocación de moqueta sobre fieltro. Remate con perfil de transición en la puerta de la cocina. ').repeat(12).slice(0,2000));
  await fill(page,'decision','Aprobar la propuesta para pedir muestras de color.');
  // Notas: una para el cliente en el capítulo del suelo, una interna general.
  await page.locator('#storyLayersDialog [data-sl="note-add"]').click();await page.locator('#storyLayersDialog [data-sl="note-add"]').click();
  const notes=page.locator('#storyLayersDialog .sl-note');
  await notes.nth(0).locator('textarea').fill('Moqueta de lana color arena; muestra disponible en el estudio.');await notes.nth(0).locator('textarea').dispatchEvent('change');
  await notes.nth(0).locator('[data-sl="note-visibility"]').selectOption('client');await notes.nth(0).locator('[data-sl="note-anchor"]').selectOption({index:1});
  await notes.nth(1).locator('textarea').fill('INTERNA-XQ7 margen del 18 %, no mostrar');await notes.nth(1).locator('textarea').dispatchEvent('change');
  assert.equal(await notes.nth(1).getAttribute('data-visibility'),'internal','una nota nueva es interna hasta que se elige lo contrario');
  assert.equal(await notes.nth(0).getAttribute('data-visibility'),'client','la nota elegida «Para el cliente» se marca como tal al instante');
  if(shots){await page.locator('#storyLayersDialog [data-sl="notes"]').scrollIntoViewIfNeeded();await page.locator('#storyLayersDialog').screenshot({path:shots+'/p10-propuesta-editor.png'});}
  // Guardar y previsualizar como cliente: el progreso y el motivo de bloqueo se dicen.
  assert.ok(await page.locator('[data-sl="download"]').isDisabled());assert.match(await page.locator('[data-sl="why"]').innerText(),/Guarda la revisión/);
  await page.locator('[data-sl="save"]').click();assert.match(await page.locator('[data-sl="why"]').innerText(),/Previsualiza como cliente/);
  await page.locator('[data-sl="images"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="preview"] img');
  const prog=await page.locator('[data-sl="progress"]').innerText();assert.match(prog,/^Revisión guardada · (\d+) de \1 imágenes listas$/);
  const pv=await previewBytes(page);assert.ok(pv.length>=3,'portada, capítulo y propuesta: '+pv.length);
  const ui=await page.evaluate(()=>FloorPlanStoryLayersUI.pages);assert.deepEqual(pv,ui.map(p=>p.sha256),'la vista previa muestra las páginas que se descargarán');
  assert.ok(ui.some(p=>p.cont),'el texto largo continúa en la página siguiente (no se trunca)');
  // Volver a editar invalida la vista previa; previsualizar de nuevo la rehace.
  await fill(page,'decision','Aprobar la propuesta para pedir muestras de color esta semana.');assert.ok(await page.locator('[data-sl="download"]').isDisabled(),'texto cambiado tras previsualizar: no se descarga lo que no se ha visto');
  await page.locator('[data-sl="save"]').click();await page.locator('[data-sl="images"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="preview"] img');
  const pv2=await previewBytes(page);assert.notDeepEqual(pv2,pv);
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slp-')),zip=path.join(dir,'p.zip');await dl.saveAs(zip);
  execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'propuesta/manifiesto.json'),'utf8'));
  assert.deepEqual(man.pages.map(p=>sha(fs.readFileSync(path.join(dir,p.file)))),pv2,'archivo final = vista previa (mismos bytes)');
  assert.equal(man.title,'Salón más cálido: moqueta de lana en la zona de estar');assert.equal(man.preparedBy,'Estudio Norte Interiorismo');
  assert.deepEqual(man.changes,[CHANGE]);assert.ok(man.kept.some(k=>/distribución se conserva/.test(k)));
  assert.ok(man.notes.includes('Moqueta de lana color arena; muestra disponible en el estudio.'),'la nota para el cliente viaja');
  for(const f of fs.readdirSync(path.join(dir,'propuesta')))assert.ok(!fs.readFileSync(path.join(dir,'propuesta',f)).toString('latin1').includes('INTERNA-XQ7'),'ninguna nota interna en '+f);
  assert.equal(man.sections.find(s=>/Cuánto cuesta/.test(s.title)).lines.length,0,'sin presupuesto, sin cifras');
  assert.ok(man.pages.length>=3,'portada y propuesta larga en varias páginas: '+man.pages.length);
  if(shots)for(const [i,p] of man.pages.entries())fs.copyFileSync(path.join(dir,p.file),path.join(shots,`texto-largo-pagina-${i+1}.png`));
  assert.doesNotMatch(await page.evaluate(()=>document.getElementById('storyLayersDialog').innerText),CJK);assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});

test('§7.3 · sin identidad de estudio: aviso claro y propuesta sin nombre ni logo; móvil sin desbordes',{timeout:240000},async()=>{
 const {storage}=seed({brand:false});const {ctx,page,w}=await open(storage,{width:390,height:844});try{
  assert.match(await page.locator('#storyLayersDialog [data-sl="no-identity"]').innerText(),/Sin identidad de estudio/);
  await page.locator('[data-sl="save"]').click();await page.locator('[data-sl="images"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="preview"] img');
  const over=await page.evaluate(()=>{const d=document.getElementById('storyLayersDialog');return {dlg:d.scrollWidth-d.clientWidth,doc:document.documentElement.scrollWidth-innerWidth};});
  assert.ok(over.dlg<=1&&over.doc<=1,'sin desbordamiento horizontal '+JSON.stringify(over));
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/p10-propuesta-movil.png'});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slq-')),zip=path.join(dir,'p.zip');await dl.saveAs(zip);execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'propuesta/manifiesto.json'),'utf8'));
  assert.equal(man.preparedBy,null);assert.match(man.summary,/^Proponemos: Suelo de Salón: .+ → Moqueta\./);
  assert.deepEqual(man.sections.filter(s=>s.pending===true).map(s=>s.title.split(' ')[0]),['Por','Cómo','Qué'],'lo que debe aportar el profesional queda pendiente y dicho');
  assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});

// Muestra para el propietario (caso de control con una propuesta realista): la que se publica como ejemplo descargable.
test('§7.3 · muestra del caso Baldosa → Moqueta con propuesta realista: se entiende sin explicación y sin notas internas',{timeout:300000},async()=>{
 const {storage}=seed();const {ctx,page,w}=await open(storage);try{
  for(const f of ['person','phone','email'])await page.locator(`#storyLayersDialog [data-sl="id-${f}"]`).check();
  await fill(page,'title','Salón más cálido: moqueta de lana en la zona de estar');
  await fill(page,'summary','Proponemos sustituir la baldosa del salón por moqueta de lana. El resto de la vivienda, la superficie y la distribución no cambian.');
  await fill(page,'why','El salón es la estancia de mayor uso y hoy resulta frío y con eco. La moqueta de lana mejora el confort térmico y acústico y hace la zona de estar más acogedora.\nValoramos también un parqué flotante: lo descartamos porque no mejora la acústica en la misma medida.');
  await fill(page,'how','Retirada de la baldosa existente y regularización del soporte con mortero autonivelante. Colocación de moqueta de lana sobre fieltro, con perfil de transición en la puerta de la cocina. Plazo estimado: 3 días laborables.\nQueda por definir el color definitivo y el tipo de rodapié.');
  await fill(page,'decision','Aprobar la propuesta para pedir muestras de color y cerrar el presupuesto.');
  for(let i=0;i<3;i++)await page.locator('#storyLayersDialog [data-sl="note-add"]').click();
  const n=page.locator('#storyLayersDialog .sl-note'),note=async(i,t,vis,anchor)=>{await n.nth(i).locator('textarea').fill(t);await n.nth(i).locator('textarea').dispatchEvent('change');await n.nth(i).locator('[data-sl="note-visibility"]').selectOption(vis);if(anchor!==undefined)await n.nth(i).locator('[data-sl="note-anchor"]').selectOption({index:anchor});};
  await note(0,'Muestra de moqueta color arena disponible en el estudio.','client',1);await note(1,'Durante la obra el salón no podrá usarse; el resto de la vivienda, sí.','client');await note(2,'INTERNA-MRG margen 18 %; proveedor alternativo si se retrasa.','internal');
  await page.locator('[data-sl="save"]').click();await page.locator('[data-sl="images"]').click();await page.waitForSelector('#storyLayersDialog [data-sl="preview"] img');
  if(shots)await page.locator('#storyLayersDialog [data-sl="preview"]').screenshot({path:shots+'/p10-vista-previa-cliente.png'});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'slm-')),zip=path.join(dir,'p.zip');await dl.saveAs(zip);
  if(process.env.SL_EXPORT){fs.mkdirSync(process.env.SL_EXPORT,{recursive:true});fs.copyFileSync(zip,path.join(process.env.SL_EXPORT,'propuesta-baldosa-moqueta.zip'));}
  execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'propuesta/manifiesto.json'),'utf8'));
  if(process.env.SL_EXPORT)fs.writeFileSync(path.join(process.env.SL_EXPORT,'manifiesto-cliente.json'),JSON.stringify(man,null,1)+'\n');
  if(shots)for(const [i,p] of man.pages.entries())fs.copyFileSync(path.join(dir,p.file),path.join(shots,`muestra-pagina-${i+1}.png`));
  assert.ok(man.pages.length<=3,'una propuesta breve cabe en pocas páginas: '+man.pages.length);assert.equal(man.notes.length,2);
  for(const f of fs.readdirSync(path.join(dir,'propuesta')))assert.ok(!fs.readFileSync(path.join(dir,'propuesta',f)).toString('latin1').includes('INTERNA-MRG'));
  assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
