'use strict';
/* De fotografía a proyecto V1 (FOT-01 + MUE-01) en el editor REAL, actuando solo con los controles visibles (formularios,
   archivos, clics, arrastre, teclado, menús). Las lecturas de estado interno son comprobaciones POSTERIORES.
   Fotos SINTÉTICAS dibujadas por Chromium (sin personas ni datos reales); la «ubicación» EXIF es inventada. */
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs');
const K=require('./photo-project/kit.cjs');
const EXT='x-mue01-furniture-photo';
let env,jpg,png,small;
test.before(async()=>{env=await K.start();jpg=K.withExif(await K.synthPhoto(env.browser));png=await K.synthPhoto(env.browser,{type:'image/png',label:'MESA'});small=await K.synthPhoto(env.browser,{w:200,h:150});});
test.after(async()=>{await env?.stop();});
const ownObj=page=>page.evaluate(()=>{const id=ui.sel?.id;const o=FloorPlanApp.project.objects.find(x=>x.id===id);return o&&structuredClone({...o,ext:FloorPlanApp.project.extensions?.['x-mue01-furniture-photo']||null});});
const others=page=>page.evaluate(()=>JSON.stringify([FloorPlanApp.project.extensions?.['x-r03-cabinet']??null,FloorPlanApp.project.extensions?.['x-r02a-ceiling']??null]));
async function openOwn(page,{mobile=false}={}){
  // Teléfono: como una persona, se abre «Crear y amueblar» (el cajón de la biblioteca) si está cerrado.
  if(mobile&&!(await page.locator('aside.lib.open').count())){await page.locator('#tgLib').tap();await page.locator('aside.lib.open').waitFor();}
  const tab=page.locator('#paletteTabFurnish');if(await tab.getAttribute('aria-selected')!=='true')await (mobile?tab.tap():tab.click());
  await (mobile?page.locator('#ownFurnOpen').tap():page.locator('#ownFurnOpen').click());await page.locator('#ownFurnDialog[open]').waitFor();
}
async function fillOwn(page,{name='Sofá de la abuela',type='sofa',w='2140',d='920',h='830',rot='0',photo=['IMG_0042.jpg',jpg,'image/jpeg'],room}={}){
  await page.locator('#ownFurn-name').fill(name);await page.locator('#ownFurn-type').selectOption(type);
  if(photo){await page.locator('#ownFurn-photo').setInputFiles(K.file(...photo));await page.waitForFunction(()=>!/Preparando/.test(document.querySelector('#ownFurnStatus').textContent));}
  await page.locator('#ownFurn-widthMm').fill(w);await page.locator('#ownFurn-depthMm').fill(d);await page.locator('#ownFurn-heightMm').fill(h);await page.locator('#ownFurn-rotationDeg').fill(rot);
  if(room)await page.locator('#ownFurn-room').selectOption(room);
}
const toastText=page=>page.locator('#toast').innerText();

test('MUE-01 escritorio: crear desde foto y medidas, 2D/3D, mover y rotar con cotas, deshacer/rehacer, guardar y reabrir, exportar e importar sin la foto',{timeout:420000},async()=>{
  const {context,page}=await K.editor(env,{acceptDownloads:true});const w=K.watch(page,env.base);
  try{
    const r03r02=await others(page);
    // Validación en el formulario: medidas inválidas y foto no admitida no crean nada.
    await openOwn(page);const before=await K.snapshot(page);
    await fillOwn(page,{w:'20',d:'92.5',h:'99999',photo:['documento.pdf',Buffer.from('%PDF-1.7 sintético'),'application/pdf']});
    await page.waitForFunction(()=>/Formato no admitido/.test(document.querySelector('#ownFurn-photo-error').textContent));
    await page.locator('#ownFurnCreate').click();
    assert.match(await page.locator('#ownFurn-widthMm-error').innerText(),/entre 100 y 6000/);assert.match(await page.locator('#ownFurn-depthMm-error').innerText(),/enteros/);
    assert.match(await page.locator('#ownFurn-heightMm-error').innerText(),/entre 50 y 3000/);assert.equal(await page.locator('#ownFurn-widthMm').getAttribute('aria-invalid'),'true');
    await page.locator('#ownFurn-photo').setInputFiles(K.file('roto.jpg',Buffer.concat([Buffer.from([0xff,0xd8,0xff,0xe0]),Buffer.alloc(400,7)]),'image/jpeg'));
    await page.waitForFunction(()=>/dañado/.test(document.querySelector('#ownFurn-photo-error').textContent));
    await page.locator('#ownFurn-photo').setInputFiles(K.file('enorme.jpg',Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(13*1024*1024)]),'image/jpeg'));
    await page.waitForFunction(()=>/demasiado/.test(document.querySelector('#ownFurn-photo-error').textContent));
    assert.deepEqual(await K.snapshot(page),before,'nada se añade con datos inválidos');
    // Creación válida: medidas exactas, un paso del deshacer, foto sin metadatos.
    await fillOwn(page);await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});
    assert.match(await toastText(page),/Añadido «Sofá de la abuela» · 2140 × 920 × 830 mm/);
    const o=await ownObj(page);assert.deepEqual(o.size,{widthMm:2140,depthMm:920,heightMm:830});assert.equal(o.type,'sofa');assert.equal(o.rotationDeg,0);
    assert.equal(o.ext.items.length,1);assert.equal(o.ext.items[0].objectId,o.id);assert.ok(!JSON.stringify(o.ext).includes('IMG_0042'),'sin el nombre del archivo');
    const stored=Buffer.from(await K.storedBytes(page,o.ext.items[0].photo.imageKey));
    assert.ok(stored.length>1000&&!stored.includes(Buffer.from('Exif'))&&!stored.includes(Buffer.from(K.FAKE_GPS)),'copia sin EXIF ni ubicación');
    assert.equal(await page.evaluate(()=>undoStack.length),before.undo+1,'un paso del deshacer');
    // Panel: foto real del mueble y advertencias honestas.
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');
    assert.equal(await page.locator('.own-furn-photo img').count(),1);assert.match(await page.locator('.own-furn-panel').innerText(),/Volumen genérico con tus medidas: 2140 × 920 × 830 mm. No es una reconstrucción 3D/);
    assert.match(await page.locator('.own-furn-panel').innerText(),/no viaja al exportar/);
    // 2D: está en el plano con su huella; arrastrarlo muestra las cotas UX-08 y lo mueve.
    const g=page.locator(`#plan g.furn[data-fid="${o.id}"]`);assert.equal(await g.count(),1);
    const b=await g.boundingBox();await page.mouse.move(b.x+b.width/2,b.y+b.height/2);await page.mouse.down();
    await page.mouse.move(b.x+b.width/2-40,b.y+b.height/2-20,{steps:4});await page.waitForTimeout(80);
    assert.ok(await page.locator('#gSel .live-dims').count()>0,'cotas en vivo UX-08 durante el arrastre');await page.mouse.up();
    const moved=await ownObj(page);assert.notDeepEqual(moved.position,o.position);assert.deepEqual(moved.size,o.size,'mover no cambia las medidas');
    // Rotar desde el panel; deshacer y rehacer con el teclado.
    await page.locator('#aRot').click();assert.equal((await ownObj(page)).rotationDeg,90);
    await page.keyboard.press('Control+z');assert.equal((await ownObj(page)).rotationDeg,0);await page.keyboard.press('Control+Shift+z');assert.equal((await ownObj(page)).rotationDeg,90);
    // 3D: el volumen genérico está en la escena en su sitio.
    await K.open3D(page);
    assert.ok((await page.evaluate(id=>View3D.levelInspect().furniturePlan.find(f=>f.id===id),o.id)),'el mueble está en el 3D');
    await page.locator('#viewSeg .btn[data-view="2d"]').click();await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
    // Guardar y reabrir: medidas y foto siguen.
    await K.reopen(page);await page.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),o.id);
    const reopened=await page.evaluate(id=>structuredClone(FloorPlanApp.project.objects.find(o=>o.id===id)),o.id);
    assert.deepEqual(reopened.size,{widthMm:2140,depthMm:920,heightMm:830});
    const gr=page.locator(`#plan g.furn[data-fid="${o.id}"]`),br=await gr.boundingBox();await page.mouse.click(br.x+br.width/2,br.y+br.height/2);
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');
    // Duplicar (Ctrl+D) un mueble propio: la copia lleva la misma foto; es un solo paso del deshacer.
    const undoBefore=await page.evaluate(()=>undoStack.length);
    await page.keyboard.press('Control+d');const copy=await ownObj(page);
    assert.notEqual(copy.id,o.id);assert.deepEqual(copy.size,{widthMm:2140,depthMm:920,heightMm:830});
    assert.deepEqual(copy.ext.items.find(i=>i.objectId===copy.id)?.photo,copy.ext.items.find(i=>i.objectId===o.id)?.photo,'misma referencia fotográfica');
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok');
    assert.equal(await page.evaluate(()=>undoStack.length),undoBefore+1,'un paso del deshacer');
    await page.keyboard.press('Control+z');
    assert.equal(await page.evaluate(id=>FloorPlanApp.project.objects.some(o=>o.id===id),copy.id),false);
    assert.equal(await page.evaluate(([e,id])=>FloorPlanApp.project.extensions[e].items.some(i=>i.objectId===id),[EXT,copy.id]),false,'deshacer retira también la referencia de la copia');
    await page.keyboard.press('Control+Shift+z');
    assert.equal(await page.evaluate(([e,id])=>FloorPlanApp.project.extensions[e].items.some(i=>i.objectId===id),[EXT,copy.id]),true,'rehacer la repone');
    await page.keyboard.press('Control+z');
    const gb=await page.locator(`#plan g.furn[data-fid="${o.id}"]`).boundingBox();await page.mouse.click(gb.x+gb.width/2,gb.y+gb.height/2);
    // Exportar: viaja la referencia, no la foto.
    await page.locator('details.menu summary').first().click();const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportJson').click()]);
    const exported=fs.readFileSync(await dl.path(),'utf8'),json=JSON.parse(exported);
    assert.ok(json.extensions[EXT].items.some(i=>i.objectId===o.id),'la referencia viaja');assert.ok(!/data:image|IMG_0042|Exif/.test(exported),'la foto no viaja en el archivo');
    // Otro navegador (sin la foto): se importa, el volumen funciona y el panel avisa de que falta la foto.
    const other=await env.browser.newContext({viewport:{width:1440,height:900}}),p2=await other.newPage();const w2=K.watch(p2,env.base);
    await p2.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p2.goto(env.base);await require('./editor-fixture.cjs')(p2);
    await p2.locator('#uploadIn').setInputFiles({name:'proyecto.json',mimeType:'application/json',buffer:Buffer.from(exported)});
    await p2.waitForFunction(id=>FloorPlanApp.project.objects.some(o=>o.id===id),o.id,{timeout:60000});
    assert.deepEqual(await p2.evaluate(id=>FloorPlanApp.project.objects.find(o=>o.id===id).size,o.id),{widthMm:2140,depthMm:920,heightMm:830});
    const g2=p2.locator(`#plan g.furn[data-fid="${o.id}"]`),b2=await g2.boundingBox();await p2.mouse.click(b2.x+b2.width/2,b2.y+b2.height/2);
    await p2.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='missing');
    assert.match(await p2.locator('#ownFurnPhotoState').innerText(),/Falta la foto en este navegador/);
    // Recuperable: en ese navegador se vuelve a elegir la foto y el mueble queda completo.
    const [chooser]=await Promise.all([p2.waitForEvent('filechooser'),p2.locator('#ownFurnPick',{hasText:'Volver a elegir la foto'}).click()]);
    await chooser.setFiles(K.file('IMG_0042.jpg',jpg,'image/jpeg'));
    await p2.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='ok',null,{timeout:30000});
    assert.deepEqual(w2.errors,[]);await other.close();
    assert.equal(await others(page),r03r02,'R03 y R02-A intactos');
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
  }finally{await context.close();}
});

test('MUE-01: si la foto no puede guardarse el mueble se crea igual y se avisa; quitar foto; estancia sin espacio',{timeout:300000},async()=>{
  const {context,page}=await K.editor(env);const w=K.watch(page,env.base);
  try{
    // El almacén local falla (por ejemplo, sin espacio): el volumen funciona y la interfaz lo dice.
    await page.evaluate(()=>{FloorPlanImages.put=()=>Promise.reject(Error('sin espacio'));});
    await openOwn(page);await fillOwn(page,{name:'Mesa del taller',type:'table',w:'1600',d:'800',h:'750',photo:['mesa.png',png,'image/png']});
    await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});
    assert.match(await toastText(page),/No se ha podido guardar la foto en este navegador/);
    assert.deepEqual((await ownObj(page)).size,{widthMm:1600,depthMm:800,heightMm:750});
    await page.waitForFunction(()=>document.querySelector('#ownFurnPhotoState')?.dataset.state==='not-stored');
    assert.match(await page.locator('#ownFurnPhotoState').innerText(),/no tiene foto conservada/);
    // Estancia demasiado pequeña: se dice que no había sitio libre (colocación ordinaria de RUBIK).
    await openOwn(page);await fillOwn(page,{name:'Aparador grande',type:'cabinet',w:'6000',d:'3000',h:'900',photo:['a.png',png,'image/png'],room:await page.evaluate(()=>FloorPlanApp.project.rooms.find(r=>/Baño en suite/.test(r.name))?.id)});
    await page.locator('#ownFurnCreate').click();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});
    assert.match(await toastText(page),/no había sitio libre|estancia con sitio libre más cercana/);
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
  }finally{await context.close();}
});

test('MUE-01 + FOT-01 en teléfono 390×844: acceso, creación, colocación y cotas; reforma con consentimiento y simulación rotulada',{timeout:300000},async()=>{
  const {context,page}=await K.editor(env,{viewport:{width:390,height:844},isMobile:true,hasTouch:true});const w=K.watch(page,env.base);
  try{
    await openOwn(page,{mobile:true});
    assert.equal(await K.hScroll(page),false);const box=await page.locator('#ownFurnDialog').boundingBox();assert.ok(box.x>=0&&box.x+box.width<=390,'el formulario cabe');
    await fillOwn(page,{name:'Butaca de lectura',type:'armchair',w:'800',d:'850',h:'1000'});
    await page.locator('#ownFurnCreate').tap();await page.locator('#ownFurnDialog').waitFor({state:'hidden'});
    const o=await ownObj(page);assert.deepEqual(o.size,{widthMm:800,depthMm:850,heightMm:1000});
    // Arrastre con un dedo real: cotas UX-08 y nueva posición.
    // Se cierran los cajones (biblioteca y propiedades) para ver el plano, como haría una persona.
    assert.equal(await page.locator('aside.lib.open, aside.right.open').count(),0,'tras crear, los cajones se cierran y el mueble queda a la vista');
    // Un sillón de 80 cm mide unos 20 px a la escala inicial y lo tapan los tiradores: se acerca con el botón «＋».
    for(let i=0;i<8&&(await page.locator(`#plan g.furn[data-fid="${o.id}"]`).boundingBox()).width<70;i++){await page.locator('#zoomIn').tap();await page.waitForTimeout(150);}
    await page.waitForFunction(id=>{const g=document.querySelector(`#plan g.furn[data-fid="${id}"]`),r=g?.getBoundingClientRect();return r&&g.contains(document.elementFromPoint(r.left+r.width/2,r.top+r.height/2));},o.id,{timeout:10000});
    const g=page.locator(`#plan g.furn[data-fid="${o.id}"]`),b=await g.boundingBox(),cdp=await context.newCDPSession(page);
    const cx=b.x+b.width/2,cy=b.y+b.height/2;await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[{x:cx,y:cy,id:1}]});
    for(let i=1;i<=4;i++)await cdp.send('Input.dispatchTouchEvent',{type:'touchMove',touchPoints:[{x:cx-i*8,y:cy-i*5,id:1}]});
    await page.waitForTimeout(80);const dims=await page.locator('#gSel .live-dims').count();
    await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});
    assert.ok(dims>0,'cotas UX-08 en el teléfono');assert.notDeepEqual((await ownObj(page)).position,o.position);
    // FOT-01 desde «Entregar» → «Imágenes».
    await page.locator('#workArea-deliver').tap();await page.locator('#photoReformCard').tap();await page.locator('#photoReformDialog[open]').waitFor();
    await page.locator('#photoReformFile').setInputFiles(K.file('salon.jpg',jpg,'image/jpeg'));await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    await page.locator('#photoReformIntent').selectOption('walls');await page.locator('#photoReformFinish').selectOption('sage');
    assert.equal(await page.locator('#photoReformReal').isDisabled(),true,'proveedor real bloqueado');
    await page.locator('#photoReformSimulate').tap();assert.match(await page.locator('#photoReformStatus').innerText(),/Falta tu consentimiento/);
    await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').tap();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    assert.equal(await page.locator('#photoReformCmpTag').innerText(),'SIMULACIÓN · no generada por IA');
    assert.equal(await K.hScroll(page),false);assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
  }finally{await context.close();}
});

test('FOT-01 escritorio: entrada distinta de «Desde una imagen», validaciones, proveedor bloqueado, simulación rotulada, error, cancelación, descarte y proyecto intacto',{timeout:300000},async()=>{
  const {context,page}=await K.editor(env,{acceptDownloads:true});const w=K.watch(page,env.base);const api=[];page.on('request',r=>{if(/\/api\//.test(r.url()))api.push(r.url());});
  try{
    const before=await K.snapshot(page);
    assert.equal(await page.locator('#photoReformDialog img, #ownFurnDialog img').count(),0,'sin <img> vacías al cargar');
    await page.locator('details.menu summary').first().click();await page.locator('#photoReformMenu').click();await page.locator('#photoReformDialog[open]').waitFor();
    assert.match(await page.locator('.photo-reform-truth').innerText(),/no cambia tu proyecto[\s\S]*«Desde una imagen»/);
    // Archivos no válidos.
    await page.locator('#photoReformFile').setInputFiles(K.file('plano.gif',Buffer.from('GIF89a sintético'),'image/gif'));await page.waitForFunction(()=>/Formato no admitido/.test(document.querySelector('#photoReformFileError').textContent));
    await page.locator('#photoReformFile').setInputFiles(K.file('miniatura.jpg',small,'image/jpeg'));await page.waitForFunction(()=>/pequeña/.test(document.querySelector('#photoReformFileError').textContent));
    await page.locator('#photoReformFile').setInputFiles(K.file('rota.jpg',Buffer.concat([Buffer.from([0xff,0xd8,0xff]),Buffer.alloc(300,1)]),'image/jpeg'));await page.waitForFunction(()=>/dañado/.test(document.querySelector('#photoReformFileError').textContent));
    // Foto válida: original sin metadatos y lo que se enviaría.
    await page.locator('#photoReformFile').setInputFiles(K.file('IMG_9876.jpg',jpg,'image/jpeg'));await page.locator('#photoReformOriginal:not([hidden])').waitFor();
    assert.match(await page.locator('#photoReformOriginal').innerText(),/sin metadatos/);
    await page.locator('#photoReformIntent').selectOption('floor');await page.locator('#photoReformFinish').selectOption('walnut');await page.locator('#photoReformAlternatives').selectOption('3');
    const sends=await page.locator('#photoReformSends').innerText();assert.match(sends,/sin metadatos EXIF ni ubicación/);assert.match(sends,/Cambiar el suelo: Nogal/);assert.ok(!/IMG_9876/.test(sends));
    assert.match(await page.locator('#photoReformNever').innerText(),/El proyecto[\s\S]*nombre del archivo[\s\S]*EXIF/);
    // Proveedor real: bloqueado y explicado. Sin consentimiento: rechazado.
    assert.equal(await page.locator('#photoReformReal').isDisabled(),true);const prov=await page.locator('#photoReformProvider').innerText();
    for(const re of [/BLOQUEADO/,/GOV-05/,/IMG-04/,/no hay gasto/])assert.match(prov,re);
    await page.locator('#photoReformSimulate').click();assert.match(await page.locator('#photoReformStatus').innerText(),/Falta tu consentimiento/);
    // Simulación correcta: 3 alternativas rotuladas, comparación, sin coste inventado y sin descarga.
    await page.locator('#photoReformConsent').check();await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='done',null,{timeout:30000});
    assert.equal(await page.locator('.photo-reform-alt[data-status="done"]').count(),3);
    assert.equal(await page.locator('#photoReformCmpTag').innerText(),'SIMULACIÓN · no generada por IA');
    assert.match(await page.locator('#photoReformResultNote').innerText(),/Coste: no aplica \(no se ha llamado a ningún proveedor\)/);
    assert.equal(await page.locator('#photoReformDownload').isDisabled(),true,'una simulación no se descarga');
    await page.locator('#photoReformSlider').fill('20');assert.equal(await page.locator('#photoReformCompare').evaluate(n=>n.style.getPropertyValue('--cut')),'20%');
    await page.locator('.photo-reform-alt-pick').nth(1).click();assert.equal(await page.locator('.photo-reform-alt-pick').nth(1).getAttribute('aria-pressed'),'true');
    // Error del proveedor (simulado): sin imagen y sin coste.
    await page.locator('#photoReformScenario').selectOption('error');await page.locator('#photoReformSimulate').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='error',null,{timeout:30000});assert.match(await page.locator('#photoReformStatus').innerText(),/error[\s\S]*no hay coste/);
    // Lenta + Cancelar.
    await page.locator('#photoReformScenario').selectOption('slow');await page.locator('#photoReformSimulate').click();await page.locator('#photoReformCancel:not([hidden])').click();
    await page.waitForFunction(()=>RubikPhotoReform.state?.status==='cancelled',null,{timeout:30000});
    assert.equal(await page.locator('#photoReformSlider').isHidden(),true,'sin resultado no hay deslizador');assert.equal(await page.locator('#photoReformResultNote').innerText(),'','ni nota de un resultado anterior');assert.match(await page.locator('#photoReformStatus').innerText(),/Cancelado/);
    // Trazabilidad: el registro de la sesión lista lo ocurrido y se descarga sin imagen ni nombre de archivo.
    assert.match(await page.locator('#photoReformReady').innerText(),/SIN ACTIVAR/);
    await page.locator('#photoReformTrace summary').click();
    const events=await page.locator('#photoReformTraceList li').evaluateAll(l=>l.map(x=>x.dataset.event));
    for(const ev of ['photo-rejected','photo-accepted','intent-set','consent-missing','run-started','item-done','run-finished','item-error','run-cancelled'])assert.ok(events.includes(ev),ev);
    const [tdl]=await Promise.all([page.waitForEvent('download'),page.locator('#photoReformTraceDownload').click()]);
    const traceText=fs.readFileSync(await tdl.path(),'utf8'),traceDoc=JSON.parse(traceText);
    assert.equal(traceDoc.contract,'rubik-photo-reform-trace/1');assert.ok(traceDoc.entries.length>=9);
    assert.ok(!/IMG_9876|salon|data:image|base64|Exif/i.test(traceText),'sin nombre de archivo ni contenido de imagen');
    assert.ok(traceDoc.entries.filter(e=>e.event==='run-started').every(e=>e.mode==='simulated'&&e.adapter==='simulated-local'),'solo el adaptador simulado');
    // Descartar y cerrar: nada queda; el proyecto no ha cambiado; ninguna llamada a /api/.
    await page.locator('#photoReformDiscard').click();assert.equal(await page.locator('#photoReformResults').isHidden(),true);
    // Descartar A MITAD de una simulación, con la primera alternativa ya generada: se detiene, no quedan miniaturas
    // (sus URL ya están revocadas) y no hay errores.
    await page.locator('#photoReformAlternatives').selectOption('3');await page.locator('#photoReformSimulate').click();
    await page.locator('.photo-reform-alt[data-status="done"] img').first().waitFor({timeout:30000});
    await page.locator('#photoReformDiscard').click();
    assert.equal(await page.locator('#photoReformDialog img:not(#photoReformOriginal img)').count(),0,'sin miniaturas tras descartar');
    await page.waitForFunction(()=>!document.querySelector('#photoReformSimulate').hidden);await page.waitForTimeout(3000);
    assert.equal(await page.locator('#photoReformDialog img:not(#photoReformOriginal img)').count(),0,'la simulación detenida no añade nada después');
    await page.locator('#photoReformClose').click();await page.locator('#photoReformDialog').waitFor({state:'hidden'});
    assert.deepEqual(await K.snapshot(page),before,'FOT-01 no modifica el proyecto');assert.deepEqual(api,[]);
    // Tras descartar no queda ninguna imagen de FOT-01 en la página (tampoco <img> vacías: tests/browser.test.cjs las vigila).
    assert.equal(await page.locator('#photoReformDialog img, #ownFurnDialog img').count(),0);
    // También se llega desde «Entregar» → «Imágenes».
    await page.locator('#workArea-deliver').click();assert.equal(await page.locator('#photoReformCard').isVisible(),true);
    assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
  }finally{await context.close();}
});
