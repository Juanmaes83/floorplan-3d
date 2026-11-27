'use strict';
/* §8.3 · Primera aceptación de la asistencia en StoryLayers, desde P10 con original y variante guardados (caso de control
   Baldosa → Moqueta, datos SINTÉTICOS). Recorrido normal:
   - vídeo del recorrido grabado con «Presentación 3D → Grabar vídeo» en la variante (medio existente de RUBIK);
   - historia: dato comprobable (cambio de suelo), vistas preparadas de la revisión correcta, una elegida, y el vídeo;
   - ficha de cliente sintética cargada desde un archivo JSON, con «usar» y «mostrar» por campo;
   - identidad de «Mi estudio»;
   - ayuda de redacción en un capítulo: muestra qué datos usa, borrador visible, EDITAR → ACEPTAR (nota para el cliente);
     segundo borrador DESCARTADO; cerrar la ayuda conserva el borrador, la posición y el foco;
   - una nota interna nunca sale; los medios obsoletos o ausentes reciben su estado; archivo final = vista previa.
   Evidencia opcional: SL_SHOTS=<dir>, SL_EXPORT=<dir> (muestra descargable). Chromium con SwiftShader (3D sin GPU). */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),L=require('../js/project-library.js'),{accion}=require('./helpers-perla-entregar.cjs'),{chromium}=require('playwright');
const shots=process.env.SL_SHOTS||null,exp=process.env.SL_EXPORT||null;for(const d of [shots,exp])if(d)fs.mkdirSync(d,{recursive:true});
const CJK=/[㐀-鿿]/,sha=b=>crypto.createHash('sha256').update(b).digest('hex');
let env,browser;test.before(async()=>{env=await K.start({authority:true});browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});});
test.after(async()=>{await browser?.close();await env?.stop();});
const PROFILE={id:'brd_estudionorte',name:'Estudio Norte Interiorismo',person:'Ana Ruiz',phone:'+34 600 123 456',email:'ana@estudionorte.es',web:'https://estudionorte.es',tagline:'Reformas de vivienda',cta:'',logo:null,updatedAt:'2026-11-26T10:00:00.000Z'};
// Cliente SINTÉTICO (no es una persona real): la ficha que el profesional carga.
const CLIENTE={nombre:'Laura Gómez (cliente sintético)',tratamiento:'Sra.',preferencias:'tonos cálidos y poco mantenimiento',requisitos:'obra en menos de dos semanas',telefono:'000 000 000'};
function seed(){const m=new Map(),st={getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};
 const base=F.before();base.rooms.find(r=>r.id==='rom_living').floorMaterialId='mat_tile800';
 const lib=L.load(st,base);lib.variant(base,'Propuesta moqueta');const v=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=JSON.parse(JSON.stringify(base));e.id=v.project.id;e.name=v.project.name;
 e.rooms.find(r=>r.id==='rom_living').floorMaterialId='mat_carpet';lib.save(e);const group=lib.group(lib.activeId());
 m.set('rubik-sota-brand-profiles-v1',JSON.stringify({version:1,profiles:[PROFILE]}));m.set('rubik-sota-brand-delivery-v1',JSON.stringify({version:1,entries:Object.fromEntries(group.map(g=>[g.id,{profileId:PROFILE.id}]))}));
 return Object.fromEntries(m);}
const D='#storyLayersDialog ';
async function story(page){await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));const b=await accion(page,'#professionalWorkspace [data-route="story-layers"]');/* click() resuelve el localizador de nuevo y desplaza por sí mismo: Entregar puede repintar la ficha entre medias (CI de cfabe252, «not attached»); un scroll explícito sobre el nodo antiguo no se reintenta */await b.click();await page.waitForSelector(D+'[data-sl="state"]');}
async function recordVideo(page){
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.locator('#professionalWorkspace').getByRole('button',{name:'Preparar presentación'}).click();
 const rows=page.locator('#presentationConfig .presentation-room-row input');const n=await rows.count();for(let i=2;i<n;i++)await rows.nth(i).uncheck();
 await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 await page.locator('#presentationVideo').click({timeout:60000});const dialog=page.locator('#tourVideoDialog');await dialog.waitFor();
 await dialog.locator('#tourVideoGo').click();await dialog.locator('#tourVideoPreview').waitFor({timeout:300000});
 await dialog.locator('#tourVideoClose').click();await page.keyboard.press('Escape');await page.waitForFunction(()=>!FloorPlanPresentation.active,null,{timeout:60000});
 return page.evaluate(()=>({size:FloorPlanTourVideo.result.blob.size,type:FloorPlanTourVideo.result.blob.type,entryId:FloorPlanTourVideo.result.entryId}));}

test('§8.3 · P10: dato comprobable, vista y vídeo vigentes, cliente sintético, identidad, ayuda editar/aceptar/descartar, nota interna excluida, archivo = vista previa',{timeout:900000},async()=>{
 const storage=seed(),ctx=await browser.newContext({acceptDownloads:true,viewport:{width:1440,height:900}});
 await ctx.addInitScript(([s])=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);localStorage.setItem('rubik-lang','es');sessionStorage.setItem('s','1');},[storage]);
 const page=await ctx.newPage();const w=K.watch(page,env.base);try{
  await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
  if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#welcomeDialog[open]'));}
  const variant=await page.evaluate(()=>FloorPlanApp.entryInfo());assert.ok(variant.variantOf,'la variante está abierta');
  // Medios AUSENTES primero: la historia lo dice y ofrece cómo prepararlos.
  await story(page);
  assert.equal(await page.locator(D+'[data-media="views"]').getAttribute('data-state'),'absent');assert.equal(await page.locator(D+'[data-media="video"]').getAttribute('data-state'),'absent');
  assert.match(await page.locator(D+'[data-sl="video-state"]').innerText(),/Ausente · grábalo en «Presentación 3D → Grabar vídeo»/);
  await page.keyboard.press('Escape');
  // Vídeo existente: grabado con la función normal de RUBIK en la variante.
  const vid=await recordVideo(page);assert.ok(vid.size>1000);assert.equal(vid.entryId,variant.id,'el vídeo sabe de qué entrada es');
  await story(page);
  assert.equal(await page.locator(D+'[data-media="video"]').getAttribute('data-state'),'current');
  // Vistas de la revisión correcta, preparadas desde la propia historia.
  await page.locator(D+'[data-sl="prepare-views"]').click();await page.waitForSelector(D+'[data-sl="view"]',{timeout:240000});
  assert.equal(await page.locator(D+'[data-media="views"]').getAttribute('data-state'),'current');
  await page.locator(D+'[data-sl="view"]').first().check();await page.locator(D+'[data-sl="video"]').check();
  // Cliente sintético desde un archivo; usar preferencias para redactar; mostrar nombre y requisitos.
  const card=path.join(fs.mkdtempSync(path.join(os.tmpdir(),'slc-')),'cliente-sintetico.json');fs.writeFileSync(card,JSON.stringify(CLIENTE));
  await page.locator(D+'[data-sl="c-file"]').setInputFiles(card);await page.waitForSelector(D+'[data-sl="c-msg"]:has-text("Ficha cargada")');
  assert.match(await page.locator(D+'[data-sl="c-msg"]').innerText(),/Campos no usados: telefono/,'lo que no se usa se dice');
  assert.equal(await page.locator(D+'[data-sl="c-name"]').inputValue(),CLIENTE.nombre);assert.equal(await page.locator(D+'[data-sl="c-treatment"]').inputValue(),'Sra.');
  for(const k of ['c-use-preferences','c-show-name','c-show-requirements'])await page.locator(D+`[data-sl="${k}"]`).check();
  // Ayuda de redacción en el capítulo del salón.
  const ch=await page.evaluate(()=>document.querySelector('#storyLayersDialog .sl-chapter[data-chapter^="finish-"]').dataset.chapter),C=`${D}[data-chapter="${ch}"] `;
  await page.locator(C+'[data-sl="assist"]').click();await page.waitForSelector(C+'[data-sl="assist-panel"]');
  assert.match(await page.locator(C+'[data-sl="assist-source"]').innerText(),/sin conexión/);
  const used=await page.locator(C+'[data-sl="assist-used"]').innerText();assert.match(used,/Datos comprobados del capítulo/);assert.match(used,/Preferencias del cliente/);
  assert.doesNotMatch(used,/Nombre del cliente|Requisitos/,'solo recibe lo marcado «usar»');
  const draft=await page.locator(C+'[data-sl="assist-draft"]').inputValue();
  assert.match(draft,/^En Salón proponemos cambiar el suelo de .+ a Moqueta\. La superficie útil y la distribución se conservan\. Lo planteamos teniendo en cuenta lo que nos indicó: tonos cálidos y poco mantenimiento\.$/,draft);
  assert.ok((await page.locator(C+'[data-sl="assist-asks"] li').allInnerTexts()).some(t=>/Por qué lo propones/.test(t)),'pide el motivo al profesional');
  // Cerrar la ayuda conserva el borrador editado, la posición y el foco.
  await page.locator(C+'[data-sl="assist-draft"]').fill(draft+' Muestras de color arena en el estudio.');await page.locator(C+'[data-sl="assist-close"]').scrollIntoViewIfNeeded();const y0=await page.evaluate(()=>document.getElementById('storyLayersDialog').scrollTop);
  // La posición se mide en el instante del clic (Playwright puede desplazar antes de pulsar si la barra fija tapa el botón).
  await page.evaluate(c=>document.querySelector(c+'[data-sl="assist-close"]').addEventListener('click',()=>{window.__top0=document.querySelector(c+'[data-sl="assist"]').getBoundingClientRect().top;},{capture:true,once:true}),C);
  await page.locator(C+'[data-sl="assist-close"]').click();const top0=await page.evaluate(()=>window.__top0);assert.equal(await page.evaluate(()=>document.activeElement?.dataset.sl),'assist','el foco vuelve a «Ayuda para redactar»');
  const top1=await page.locator(C+'[data-sl="assist"]').evaluate(b=>b.getBoundingClientRect().top);
  assert.ok(Math.abs(top1-top0)<=4,`la vista no se mueve: el botón de la ayuda sigue en el mismo punto (${top0} → ${top1}; desplazamiento ${y0} → ${await page.evaluate(()=>document.getElementById('storyLayersDialog').scrollTop)})`);
  assert.equal(await page.locator(D+'[data-sl="c-name"]').inputValue(),CLIENTE.nombre,'cerrar la ayuda no pierde otros textos');
  await page.locator(C+'[data-sl="assist"]').click();assert.match(await page.locator(C+'[data-sl="assist-draft"]').inputValue(),/Muestras de color arena en el estudio\.$/,'el borrador editado se conserva');
  if(shots)await page.locator(C).screenshot({path:shots+'/8-3-ayuda-borrador.png'});
  await page.locator(C+'[data-sl="assist-accept"]').click();
  const note=await page.evaluate(c=>[...document.querySelectorAll('#storyLayersDialog .sl-note')].map(n=>({vis:n.dataset.visibility,text:n.querySelector('textarea').value,anchor:n.querySelector('[data-sl="note-anchor"]').value})).find(n=>/Muestras de color arena/.test(n.text)),ch);
  assert.deepEqual([note.vis,note.anchor],['client',ch],'aceptada: nota para el cliente vinculada al capítulo');
  // Segundo borrador: descartado, no deja rastro.
  const n1=await page.locator(D+'.sl-note').count();await page.locator(C+'[data-sl="assist"]').click();await page.locator(C+'[data-sl="assist-discard"]').click();
  assert.equal(await page.locator(D+'.sl-note').count(),n1,'descartar no inserta nada');assert.equal(await page.locator(C+'[data-sl="assist-panel"]').count(),0);
  // Nota interna (no debe salir nunca) y propuesta.
  await page.locator(D+'[data-sl="note-add"]').click();const it=page.locator(D+'.sl-note').last();await it.locator('textarea').fill('INTERNA-ZX9 margen 18 %');await it.locator('textarea').dispatchEvent('change');
  assert.equal(await it.getAttribute('data-visibility'),'internal');
  for(const [k,v] of [['title','Salón más cálido: moqueta de lana'],['why','Más confort acústico y térmico donde la familia pasa más horas.'],['how','Retirada de la baldosa, recrecido y moqueta de lana en tres días.'],['decision','Aprobar la propuesta para pedir muestras.']]){const t=page.locator(`${D}[data-sl="p-${k}"]`);await t.fill(v);await t.dispatchEvent('change');}
  await page.locator(D+'[data-sl="save"]').click();await page.locator(D+'[data-sl="images"]').click();await page.waitForSelector(D+'[data-sl="preview"] img');
  assert.equal(await page.locator(D+'[data-sl="preview"] video').count(),1,'la vista previa reproduce el vídeo que se entrega');
  const prev=await page.evaluate(async()=>Promise.all([...document.querySelectorAll('#storyLayersDialog [data-sl="preview"] img, #storyLayersDialog [data-sl="preview"] video')].map(async i=>{const b=new Uint8Array(await (await fetch(i.src)).arrayBuffer());return [...new Uint8Array(await crypto.subtle.digest('SHA-256',b))].map(x=>x.toString(16).padStart(2,'0')).join('');})));
  if(shots)await page.locator('#storyLayersDialog').screenshot({path:shots+'/8-3-historia-lista.png'});
  const [dl]=await Promise.all([page.waitForEvent('download'),page.locator(D+'[data-sl="download"]').click()]);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'sla-')),zip=path.join(dir,'p.zip');await dl.saveAs(zip);execFileSync('python3',['-c','import zipfile,sys;zipfile.ZipFile(sys.argv[1]).extractall(sys.argv[2])',zip,dir]);
  const man=JSON.parse(fs.readFileSync(path.join(dir,'propuesta/manifiesto.json'),'utf8'));
  assert.deepEqual([...man.pages,...man.attachments].map(p=>sha(fs.readFileSync(path.join(dir,p.file)))),prev,'archivo final = vista previa (páginas y vídeo, mismos bytes)');
  assert.equal(man.attachments.length,1);assert.match(man.attachments[0].file,/^propuesta\/video-recorrido\.(webm|mp4)$/);
  assert.equal(man.preparedBy,PROFILE.name);assert.equal(man.preparedFor,'Sra. '+CLIENTE.nombre);assert.deepEqual(man.requests,[CLIENTE.requisitos],'solo lo marcado «mostrar»');
  assert.ok(man.changes.some(c=>/Suelo de Salón: .+ → Moqueta/.test(c)),'el dato comprobable viaja');assert.ok(man.pages.some(p=>p.content.some(c=>/Vista general|Salón|Dormitorio|Cocina/.test(c))),'una vista de la propuesta es página');
  assert.ok(man.notes.some(n=>/Muestras de color arena/.test(n)),'la nota aceptada para el cliente viaja');
  for(const f of fs.readdirSync(path.join(dir,'propuesta'))){const t=fs.readFileSync(path.join(dir,'propuesta',f)).toString('latin1');assert.ok(!t.includes('INTERNA-ZX9'),'ninguna nota interna en '+f);assert.ok(!t.includes('000 000 000'),'el teléfono ignorado no sale');}
  // Las preferencias (no marcadas «mostrar») solo viajan dentro de la nota que el profesional aceptó; nunca como dato del cliente.
  assert.ok(!JSON.stringify({...man,notes:[]}).includes('poco mantenimiento'),'las preferencias no salen como dato del cliente');
  if(exp){fs.copyFileSync(zip,path.join(exp,'propuesta-asistida-8-3.zip'));fs.writeFileSync(path.join(exp,'manifiesto-8-3.json'),JSON.stringify(man,null,1)+'\n');for(const [i,p] of man.pages.entries())fs.copyFileSync(path.join(dir,p.file),path.join(exp,`8-3-pagina-${i+1}.png`));}
  // Obsoleto: un cambio en la variante deja vista y vídeo obsoletos y la descarga bloqueada con su motivo.
  await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#storyLayersDialog[open]'));
  await page.evaluate(()=>FloorPlanProfessionalUI.close());const oid=await page.evaluate(()=>FloorPlanApp.project.objects[0].id);await page.evaluate(i=>select({kind:'furn',id:i}),oid);await page.keyboard.press('Delete');
  await page.waitForFunction(i=>!FloorPlanApp.project.objects.some(o=>o.id===i),oid);await page.evaluate(()=>FloorPlanApp.persistence.requireSaved());
  await story(page);
  assert.equal(await page.locator(D+'[data-media="views"]').getAttribute('data-state'),'stale');assert.equal(await page.locator(D+'[data-media="video"]').getAttribute('data-state'),'stale');
  assert.ok(await page.locator(D+'[data-sl="download"]').isDisabled());
  assert.doesNotMatch(await page.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});
