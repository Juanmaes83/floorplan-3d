'use strict';
/* K4 · UX-24 + UX-26 en el editor REAL (index.html), Chromium. Proyecto de ejemplo del producto (sin datos reales).
   UX-24: el panel de la estancia sugiere el tipo con la heurística única de project-core, explica por qué y solo lo
   escribe si la persona lo acepta; se deshace en un paso. UX-26: intercambiar solo el uso (nombre y tipo) de dos
   estancias, en un paso que se deshace; geometría, muebles y acabados no se mueven. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),K=require('./r02a/editor-kit.cjs');
let env;
before(async()=>{env=await K.start();});
after(async()=>{await env?.stop();});
const room=(page,id)=>page.evaluate(id=>{const r=FloorPlanApp.project.rooms.find(q=>q.id===id);return {name:r.name,family:r.family};},id);
const undoLen=page=>page.evaluate(()=>undoStack.length);
// Todo lo que NO es el uso: cada estancia sin nombre ni tipo, y el resto del proyecto (muebles, muros, aberturas…).
const rest=page=>page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);delete p.updatedAt;for(const r of p.rooms){delete r.name;delete r.family;}return JSON.stringify(p);});

test('UX-24 · sugerencia explicada, aceptada en un clic y deshecha en un paso; nunca se escribe sola',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
    await K.selectRoom(page,'rom_master');
    const box=page.locator('#panel .room-suggest');
    assert.equal(await box.isVisible(),true,'el tipo está sin especificar y hay una sugerencia');
    const text=await box.textContent();
    assert.match(text,/Sugerencia: Dormitorio, porque contiene «/,'dice qué sugiere y por qué');
    assert.equal(await box.getAttribute('role'),'status');
    assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'mostrar la sugerencia no cambia el proyecto');
    const n0=await undoLen(page);
    await page.locator('#rSuggest').click();
    assert.deepEqual(await room(page,'rom_master'),{name:'主卧室',family:'bedroom'});
    assert.equal(await undoLen(page),n0+1,'un solo paso de deshacer');
    assert.equal(await page.locator('#rFamily').inputValue(),'bedroom');
    assert.equal(await page.locator('#panel .room-suggest').count(),0,'con un tipo declarado ya no se sugiere');
    assert.match(await page.locator('#toast').textContent(),/Tipo aplicado: Dormitorio\. Puedes deshacerlo/);
    await page.keyboard.press('Control+z');
    assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'deshacer devuelve exactamente el proyecto anterior');
    await K.selectRoom(page,'rom_master');assert.equal(await page.locator('#panel .room-suggest').count(),1,'y la sugerencia vuelve');
    // Sin pistas (ni muebles ni nombre reconocible) no se inventa nada.
    await K.selectRoom(page,'rom_hall');assert.equal(await page.locator('#panel .room-suggest').count(),0);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('UX-26 · intercambiar el uso de dos estancias: un paso, solo nombre y tipo, deshacer y rehacer exactos',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(env);
  try{
    // Un tipo declarado y otro ausente: los dos viajan tal cual.
    await page.evaluate(()=>{const b=snap();FloorPlanApp.project.rooms.find(r=>r.id==='rom_kid').family='office';FloorPlanApp.project.schemaVersion='1.6.0';commit(b);renderAll();});
    const a0=await room(page,'rom_master'),b0=await room(page,'rom_kid'),rest0=await rest(page),before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
    await K.selectRoom(page,'rom_master');
    const group=page.locator('#panel details.room-swap');
    await group.locator('summary').click();
    assert.match(await group.textContent(),/Solo se intercambian el nombre y el tipo\. Muebles, acabados, puertas y medidas se quedan donde están\./);
    assert.equal(await page.locator('#rSwap').isDisabled(),true,'sin elegir estancia no se puede intercambiar');
    await page.locator('#rSwapWith').selectOption('rom_kid');
    const n0=await undoLen(page);
    await page.locator('#rSwap').click();
    assert.deepEqual(await room(page,'rom_master'),b0);assert.deepEqual(await room(page,'rom_kid'),a0);
    assert.equal(await rest(page),rest0,'geometría, muebles, acabados y aberturas sin cambios');
    assert.equal(await undoLen(page),n0+1,'un solo paso');
    assert.match(await page.locator('#toast').textContent(),/Uso intercambiado con «.+»\. Los muebles y acabados no se han movido\./);
    const after=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
    await page.locator('#undo').click();
    assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'deshacer: el proyecto exacto de antes');
    await page.locator('#redo').click();
    const redone=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
    assert.equal(JSON.parse(redone).rooms.find(r=>r.id==='rom_master').family,'office');assert.equal(redone.replace(/"updatedAt":"[^"]+"/,''),after.replace(/"updatedAt":"[^"]+"/,''),'rehacer: el mismo resultado');
    // Ambos consumidores leen el uso nuevo desde la misma heurística (sin pasos propios).
    const consumers=await page.evaluate(()=>{const p=FloorPlanApp.project,r=p.rooms.find(q=>q.id==='rom_master');
      return {living:FloorPlanLivingDrawing.classify(r,FloorPlanLivingDrawing.objectsIn(p,r)),nav:RubikNav3DCore.familyHint(r.family,r.name)};});
    assert.equal(consumers.living,'bedroom','el Dibujo vivo sigue mandando por el contenido (una cama) cuando el tipo no es uno de sus siete');
    assert.equal(consumers.nav,'office','NAV3D ordena por el tipo declarado tras el intercambio');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('teclado y móvil 390×844: se llega a todo sin ratón, botones de 44 px y sin desplazamiento horizontal',{timeout:120000},async()=>{
  const {context,page,watch}=await K.editor(env,{viewport:{width:390,height:844},hasTouch:true,isMobile:true});
  try{
    await page.evaluate(()=>{select({kind:'room',id:'rom_master'});});
    await page.waitForSelector('#panel .room-suggest');
    if(!(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open'))))await page.locator('#tgPanel').click();
    await page.waitForFunction(()=>{const r=document.querySelector('#rSuggest').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth;});
    await page.locator('#panel details.room-swap summary').scrollIntoViewIfNeeded();await page.locator('#panel details.room-swap summary').click();
    const r=await page.evaluate(()=>({overflow:document.documentElement.scrollWidth>innerWidth+1,
      heights:['#rSuggest','#rSwap'].map(s=>document.querySelector(s).getBoundingClientRect().height),
      panelOverflow:document.querySelector('#panel').scrollWidth>document.querySelector('#panel').clientWidth+1}));
    assert.equal(r.overflow,false);assert.equal(r.panelOverflow,false);for(const h of r.heights)assert.ok(h>=44,'objetivo táctil '+h);
    // Teclado: elegir con el selector y confirmar con Enter.
    await page.locator('#rSwapWith').focus();await page.keyboard.press('ArrowDown');
    assert.equal(await page.locator('#rSwap').isDisabled(),false);
    await page.locator('#rSwap').focus();await page.keyboard.press('Enter');
    assert.notEqual((await room(page,'rom_master')).name,'主卧室','intercambiado con el teclado');
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
