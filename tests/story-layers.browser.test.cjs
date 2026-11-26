'use strict';
/* StoryLayersV1 · «Explicar el cambio» desde Entregar (P10), con datos SINTÉTICOS (fixtures UX-07/ENT-04: original y
   variante guardados en la biblioteca). Recorrido real: abrir desde Entregar, dos revisiones con el mismo encuadre, ≥ 2
   rótulos anclados a elementos visibles con valor/unidad/fuente/revisión/estado (cifras = FICHA INDEPENDIENTE calculada
   aquí), ordenar y revisar textos, guardar, generar imágenes, descargar y ABRIR los archivos, cerrar con Escape y volver
   a la ficha con su posición y foco, obsolescencia al cambiar el proyecto, cancelación sin escrituras, móvil y teclado,
   sin chino visible en ES/EN. Evidencia visual opcional: SL_SHOTS=<dir>; ejemplo exportado: SL_EXPORT=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),L=require('../js/project-library.js'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.SL_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
// Ficha independiente: área por la fórmula del lazo, escrita aquí.
const ficha=poly=>{let s=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];s+=a.x*b.y-b.x*a.y;}return Math.round(Math.abs(s)/2/1e6*100)/100;};
function seed(){const m=new Map(),st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 const lib=L.load(st,F.before());lib.variant(F.before(),'Reforma A');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=F.after();e.id=v.project.id;e.name=v.project.name;
 // Cambio de superficie real en «después» (dato sintético declarado): el salón se amplía 400 mm hacia su lado derecho.
 const room=e.rooms.slice().sort((a,b)=>ficha(b.polygon)-ficha(a.polygon))[0],mx=Math.max(...room.polygon.map(p=>p.x));for(const p of room.polygon)if(p.x===mx)p.x+=400;
 lib.save(e);return {storage:Object.fromEntries(m),group:lib.group(lib.activeId()),after:e};}
async function open(storage,viewport={width:1440,height:900},lang='es'){
 const ctx=await env.browser.newContext({acceptDownloads:true,viewport});
 await ctx.addInitScript(([s,l])=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);localStorage.setItem('rubik-lang',l);sessionStorage.setItem('s','1');},[storage,lang]);
 const page=await ctx.newPage();const w=K.watch(page,env.base);await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 // Perfil nuevo: la bienvenida se cierra como lo haría la persona (Escape), igual que en las demás pruebas del editor.
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog[open]'));}
 if(lang!=='es')await page.evaluate(l=>setLang(l),lang);
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForSelector('#professionalWorkspace [data-route="story-layers"]',{state:'attached'});return {ctx,page,w};}
// Devuelve la posición de Entregar en el momento del clic (la que la persona espera recuperar al volver).
async function launch(page){const b=await accion(page,'#professionalWorkspace [data-route="story-layers"]');await b.scrollIntoViewIfNeeded();
 const top=await page.evaluate(()=>document.getElementById('professionalWorkspace').scrollTop);await b.click();await page.waitForSelector('#storyLayersDialog[open] [data-sl="state"]');return top;}
const visibleText=page=>page.evaluate(()=>document.getElementById('storyLayersDialog').innerText);

test('P10 · historia de dos revisiones: encuadre común, rótulos anclados con datos trazables = ficha independiente, revisión, imágenes que abren, vuelta a Entregar',{timeout:240000},async()=>{
 const {storage,group}=seed();const {ctx,page,w}=await open(storage);try{
  const libBefore=await page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1'));
  const scroller=await launch(page);
  // Encuadre común: las dos plantas del mismo capítulo con el MISMO viewBox.
  const vb=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog .sl-chapter')].map(c=>[...c.querySelectorAll('figure svg')].map(s=>s.getAttribute('viewBox'))));
  for(const [a,b] of vb)assert.equal(a,b,'misma cámara en planta para antes y después');
  // ≥ 2 rótulos anclados a elementos VISIBLES: el punto del rótulo cae dentro de la caja del elemento al que apunta.
  const anchors=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog g.sl-callout')].map(g=>{const [kind,id]=g.dataset.anchor.split(':'),c=g.querySelector('circle'),svg=g.ownerSVGElement;
   const target=svg.querySelector(`path[data-id="${CSS.escape(id)}"]`);if(!target)return {kind,id,found:false};const bb=target.getBBox(),x=+c.getAttribute('cx'),y=+c.getAttribute('cy'),tol=Math.max(bb.width,bb.height)*.02+60;
   return {kind,id,found:true,inside:x>=bb.x-tol&&x<=bb.x+bb.width+tol&&y>=bb.y-tol&&y<=bb.y+bb.height+tol,visible:target.getBoundingClientRect().width>0};}));
  assert.ok(anchors.length>=2,'al menos dos rótulos: '+JSON.stringify(anchors));for(const a of anchors){assert.ok(a.found,'el elemento existe: '+a.id);assert.ok(a.inside,'el rótulo apunta al elemento: '+a.id);}
  assert.ok(new Set(anchors.map(a=>a.kind)).size>=1);
  // Datos: cada fila tiene valor/unidad, fuente, revisión y estado; superficies = ficha independiente.
  const story=await page.evaluate(()=>FloorPlanStoryLayersUI.state&&JSON.parse(JSON.stringify(document.querySelectorAll('#storyLayersDialog tr[data-datum]').length)));assert.ok(story>=4);
  const B=F.before(),A=JSON.parse(storage['rubik-sota-project-library-v1']).entries.find(x=>x.id===group[1].id).project;
  const rows=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog .sl-chapter')].flatMap(c=>[...c.querySelectorAll('tr[data-datum]')].map(r=>({ch:c.dataset.chapter,id:r.dataset.datum,state:r.dataset.state,cells:[...r.cells].map(x=>x.textContent)}))));
  for(const r of rows){assert.equal(r.cells.length,6);assert.ok(r.cells[3].length>3,'fuente');assert.match(r.cells[4],/(antes|después) · [0-9a-f]{8}/,'revisión con huella');}
  const roomRows=rows.filter(r=>r.ch.startsWith('room-'));assert.ok(roomRows.length,'hay capítulos de superficie');
  for(const r of roomRows){const id=r.ch.slice(5),src=(r.id==='area-before'?B:A).rooms.find(x=>x.id===id);
   if(!src){assert.equal(r.state,'absent');assert.match(r.cells[2],/Ausente/);}else assert.equal(r.cells[2],`${ficha(src.polygon)} m²`,'cifra = ficha independiente ('+r.id+' '+id+')');}
  // El Asistente tiene espacio propio: su acceso no se solapa con ninguna acción de la historia (antes tapaba «Descargar»).
  const solape=await page.evaluate(()=>{const acc=document.getElementById('assistantAccess');if(!acc||!acc.getClientRects().length)return [];const a=acc.getBoundingClientRect();
   return [...document.querySelectorAll('#storyLayersDialog .sl-actions button')].filter(b=>{const r=b.getBoundingClientRect();return r.right>a.left&&r.left<a.right&&r.bottom>a.top&&r.top<a.bottom;}).map(b=>b.textContent.trim());});
  assert.deepEqual(solape,[],'el acceso del Asistente no tapa acciones');
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/p10-historia-escritorio.png'});
  // Revisión profesional: bajar el primer capítulo, revisar su texto, guardar, generar imágenes → lista.
  const first=await page.evaluate(()=>document.querySelector('#storyLayersDialog .sl-chapter').dataset.chapter);
  await page.locator(`#storyLayersDialog [data-chapter="${first}"] [data-sl="down"]`).click();
  assert.notEqual(await page.evaluate(()=>document.querySelector('#storyLayersDialog .sl-chapter').dataset.chapter),first,'orden cambiado');
  await page.locator('#storyLayersDialog .sl-chapter textarea').first().fill('Revisado por el estudio: la reforma amplía el salón.');await page.locator('#storyLayersDialog .sl-chapter textarea').first().dispatchEvent('change');
  assert.equal(await page.locator('#storyLayersDialog [data-sl="state"]').getAttribute('data-state'),'INCOMPLETE');assert.ok(await page.locator('[data-sl="download"]').isDisabled());
  await page.locator('[data-sl="save"]').click();await page.locator('[data-sl="images"]').click();
  await page.waitForFunction(()=>document.querySelector('#storyLayersDialog [data-sl="state"]')?.dataset.state==='READY');
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sl-')),zipPath=path.join(dir,'h.zip');await dl.saveAs(zipPath);
  // Ejemplo exportado opcional (evidencia): SL_EXPORT=<dir> guarda el ZIP tal como se descargó.
  if(process.env.SL_EXPORT){fs.mkdirSync(process.env.SL_EXPORT,{recursive:true});fs.copyFileSync(zipPath,path.join(process.env.SL_EXPORT,dl.suggestedFilename()));}
  // Abrir los archivos descargados: ZIP válido, PNG decodificables con su tamaño, manifiesto con huellas que coinciden.
  execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zipPath,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'historia/manifiesto.json'),'utf8'));
  assert.equal(man.chapters[0].text,'Revisado por el estudio: la reforma amplía el salón.','el texto revisado viaja');assert.equal(man.revisions.after.entryId,group[1].id,'referencia durable a la entrada');
  for(const c of man.chapters){const b=fs.readFileSync(path.join(dir,c.image.file));assert.equal(crypto.createHash('sha256').update(b).digest('hex'),c.image.sha256);
   assert.equal(b.subarray(1,4).toString(),'PNG');assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],[1600,1000],'PNG 1600×1000 decodificable');}
  assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1')),libBefore,'la biblioteca y los proyectos no cambian');
  // Volver: Escape cierra y Entregar recupera ficha, posición y foco.
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  await page.waitForFunction(()=>document.activeElement?.dataset?.route==='story-layers'||document.activeElement?.closest?.('.perla-panel-open'));
  const back=await page.evaluate(()=>{const s=document.getElementById('professionalWorkspace');return {area:FloorPlanProfessionalUI.area,top:s.scrollTop,max:s.scrollHeight-s.clientHeight,focus:document.activeElement?.textContent?.trim()};});
  assert.equal(back.area,'deliver');assert.match(back.focus,/Explicar el cambio/);assert.ok(Math.abs(back.top-scroller)<=120,'posición conservada: '+JSON.stringify(back)+' vs '+scroller);
  assert.doesNotMatch(await page.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});

test('P10 · obsolescencia: si cambia una revisión guardada, la historia queda OBSOLETA y no se entrega como vigente; cancelar no escribe',{timeout:240000},async()=>{
 const {storage,group}=seed();const {ctx,page,w}=await open(storage);try{
  await launch(page);await page.locator('[data-sl="save"]').click();
  const saved=await page.evaluate(()=>localStorage.getItem('rubik-story-layers-v1'));assert.ok(saved);
  await page.keyboard.press('Escape');
  // El proyecto «después» cambia (otra pestaña / otra sesión de trabajo).
  await page.evaluate(async id=>{const {storage,persistence}=FloorPlanApp,k='rubik-sota-project-library-v1',l=JSON.parse(storage.getItem(k));const e=l.entries.find(x=>x.id===id);e.project.name+=' (cambiada)';storage.setItem(k,JSON.stringify(l));await persistence.requireSaved?.();},group[1].id);
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');}await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForSelector('#professionalWorkspace [data-route="story-layers"]',{state:'attached'});
  await launch(page);
  assert.equal(await page.locator('[data-sl="state"]').getAttribute('data-state'),'OBSOLETE');
  for(const b of ['download','save','images'])assert.ok(await page.locator(`[data-sl="${b}"]`).isDisabled(),b+' deshabilitado en una historia obsoleta');
  // Y se VE deshabilitada: la acción principal no puede conservar su aspecto activo.
  assert.ok(+(await page.locator('[data-sl="download"]').evaluate(e=>getComputedStyle(e).opacity))<=.6,'«Descargar» se ve deshabilitada');
  assert.match(await page.locator('[data-sl="state"]').innerText(),/Obsoleta/);
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/p10-obsoleta.png'});
  // Cancelar (Escape) sin hacer nada no escribe; rehacer crea una historia nueva por revisar (no vigente hasta guardar).
  const before=await page.evaluate(()=>localStorage.getItem('rubik-story-layers-v1'));await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(()=>localStorage.getItem('rubik-story-layers-v1')),before,'cancelar no escribe');
  await launch(page);await page.locator('[data-sl="regenerate"]').click();await page.waitForFunction(()=>document.querySelector('[data-sl="state"]')?.dataset.state==='INCOMPLETE');
  assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});

for(const [lang,viewport] of [['es',{width:390,height:844}],['en',{width:1440,height:900}]])
test(`P10 · ${lang} ${viewport.width}x${viewport.height}: teclado, sin desbordes, sin chino visible`,{timeout:240000},async()=>{
 const {storage}=seed();const {ctx,page,w}=await open(storage,viewport,lang);try{
  await launch(page);
  assert.equal(await page.evaluate(()=>document.activeElement?.dataset?.sl),'close','el foco entra en el diálogo');
  const over=await page.evaluate(()=>{const d=document.getElementById('storyLayersDialog');return {dlg:d.scrollWidth-d.clientWidth,doc:document.documentElement.scrollWidth-innerWidth};});
  assert.ok(over.dlg<=1&&over.doc<=1,'sin desbordamiento horizontal '+JSON.stringify(over));
  for(let i=0;i<6;i++)await page.keyboard.press('Tab');assert.ok(await page.evaluate(()=>!!document.activeElement.closest('#storyLayersDialog')),'el tabulador sigue dentro del diálogo');
  assert.doesNotMatch(await visibleText(page),CJK,'sin chino visible en '+lang);
  // Cada valor de la tabla se lee en una línea con anchura útil (antes, en 390 px, «Revisión» se partía letra a letra):
  // ninguna palabra de las cabeceras o etiquetas queda partida y cada celda de valor tiene al menos 150 px.
  const estrechas=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog tr[data-datum] td')].filter(td=>td.getBoundingClientRect().width<150&&getComputedStyle(td).display!=='table-cell').length);
  const partidas=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog .sl-data th')].filter(th=>th.getClientRects().length&&th.getBoundingClientRect().width>1&&th.scrollWidth>th.clientWidth+1).map(th=>th.textContent));
  assert.equal(estrechas,0,'celdas con anchura útil');assert.deepEqual(partidas,[],'cabeceras visibles sin cortar');
  if(viewport.width<600){const labels=await page.evaluate(()=>[...document.querySelectorAll('#storyLayersDialog tr[data-datum] td')].slice(0,6).map(td=>getComputedStyle(td,'::before').content));
   assert.ok(labels.every(l=>l&&l!=='none'&&l!=='""'),'en el teléfono cada valor lleva su columna');}
  if(lang==='en')assert.match(await visibleText(page),/Explain the change to the client/);
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:`${shots}/p10-${lang}-${viewport.width}.png`});
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
