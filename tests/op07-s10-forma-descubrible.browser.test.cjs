'use strict';
// §7.1 · Muros: edición descubrible desde Diseñar, con interacciones REALES. Una persona nueva dibuja un muro recto en el
// plano de ejemplo, lo selecciona y ve «Forma del muro» con Recto / Curvo; al elegir Curvo aparecen el asa, «Arrastra para
// curvar» y una vista previa SIN tocar el proyecto; arrastra el asa (un paso de historial), lo ve en 3D, lo endereza,
// deshace y rehace con el teclado, guarda y reabre la forma final. En móvil la barra de selección deja libre el asa.
// Reutiliza el camino de edición de OP-07 (Core.setWallCurve → commit) y su activación de prueba (estado «active»).
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./photo-project/kit.cjs');
const shots=process.env.MUROS_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=require('./op07/browser-state.cjs').withState(await K.start(),'active');});test.after(async()=>{await env?.stop();});
const screen=(page,pt)=>page.evaluate(({x,y})=>{const s=document.querySelector('#plan'),m=s.getScreenCTM(),q=s.createSVGPoint();q.x=x;q.y=y;const r=q.matrixTransform(m);return {x:r.x,y:r.y};},pt);
const wallOf=(page,id)=>page.evaluate(id=>structuredClone(FloorPlanApp.project.walls.find(w=>w.id===id)),id);
const undo=page=>page.evaluate(()=>undoStack.length);
async function setup(viewport){const {context,page,watch}=await K.editor(env,{viewport});await page.evaluate(()=>{select(null);fitView();});return {context,page,watch};}
// Dibujar un muro recto como la persona: «Dibujar muro» de la paleta Construir, dos toques en el plano y «Terminar».
async function drawWall(page){
 const ids0=await page.evaluate(()=>FloorPlanApp.project.walls.map(w=>w.id));
 const b=await page.evaluate(()=>{const ws=FloorPlanApp.project.walls;return {x0:Math.min(...ws.map(w=>Math.min(w.start.x,w.end.x))),y1:Math.max(...ws.map(w=>Math.max(w.start.y,w.end.y)))};});
 await page.evaluate(()=>{select(null);window.FloorPlanBuildPalette.select?.('build');});
 if(await page.evaluate(()=>innerWidth<900)||!await page.locator('#paletteWall').isVisible()){await page.evaluate(()=>drawer('lib',true));await page.waitForTimeout(400);await page.locator('#paletteTabBuild').click();}
 await page.locator('#paletteWall').scrollIntoViewIfNeeded();await page.locator('#paletteWall').click();await page.waitForFunction(()=>FloorPlanTraceUI.mode?.()==='wall');
 await page.evaluate(()=>{drawer('lib',false);fitView();});await page.waitForTimeout(300);
 const a=await screen(page,{x:b.x0+1000,y:b.y1-900}),c=await screen(page,{x:b.x0+4000,y:b.y1-900});
 await page.mouse.click(a.x,a.y);await page.waitForTimeout(150);await page.mouse.click(c.x,c.y);
 await page.waitForFunction(n=>FloorPlanApp.project.walls.length>n,ids0.length);
 const id=await page.evaluate(ids=>FloorPlanApp.project.walls.find(w=>!ids.includes(w.id)).id,ids0);
 if(await page.locator('#paletteWallDone').isVisible())await page.locator('#paletteWallDone').click();else await page.evaluate(()=>FloorPlanTraceUI.stop?.());
 await page.evaluate(()=>window.FloorPlanBuildPalette.useTool('select'));return id;}
async function selectWall(page,id){const m=await page.evaluate(id=>{const w=FloorPlanApp.project.walls.find(x=>x.id===id);return w.curve?FloorPlanWallGeometry.point(w,.5):{x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2};},id),p=await screen(page,m);await page.mouse.click(p.x,p.y);
 await page.waitForFunction(id=>ui.sel?.kind==='wall'&&ui.sel.id===id,id);await page.locator('#wallShape').waitFor({state:'attached'});}
const checked=page=>page.evaluate(()=>document.querySelector('#wallShape .wall-shape-opt[aria-checked="true"]')?.dataset.shape);
const handle=async page=>{await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const b=await page.locator('#gSel circle[data-handle="curve"]').last().boundingBox();return {x:b.x+b.width/2,y:b.y+b.height/2};};

test('§7.1 · persona nueva: dibujar → Curvo (asa, «Arrastra para curvar», vista previa) → arrastrar → 3D → Enderezar → deshacer/rehacer → guardar y reabrir',{timeout:240000},async()=>{
 const {context,page,watch}=await setup({width:1440,height:900});
 try{
  const id=await drawWall(page);await selectWall(page,id);
  assert.equal(await checked(page),'straight','un muro nuevo es recto');
  assert.deepEqual(await page.locator('#wallShape .wall-shape-opt').allInnerTexts(),['Recto','Curvo']);
  assert.equal(await page.locator('#wallShapePrecise').evaluate(d=>d.open),false,'el ajuste en milímetros es secundario (plegado)');
  // Elegir Curvo: asa resaltada, aviso y vista previa; el proyecto NO cambia.
  const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),u0=await undo(page);
  await page.locator('#wallShape .wall-shape-opt[data-shape="curve"]').click();
  assert.equal(await checked(page),'curve');assert.match(await page.locator('#wallShapeHint').innerText(),/^Arrastra para curvar · /);
  assert.equal(await page.locator('#gSel [data-preview="curve"]').count(),1,'vista previa en el plano');assert.equal(await page.locator('#gSel text[data-hint="curve"]').textContent(),'Arrastra para curvar');
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'elegir Curvo no escribe nada');assert.equal(await undo(page),u0);
  if(shots)await page.screenshot({path:shots+'/1-curvo-vista-previa.png'});
  // Arrastrar el asa: curva real en UN paso; la vista previa desaparece.
  const c=await handle(page);assert.ok(await page.evaluate(([x,y])=>!!document.elementFromPoint(x,y)?.closest?.('[data-handle="curve"]'),[c.x,c.y]),'el asa queda libre');
  const w0=await wallOf(page,id),L=Math.hypot(w0.end.x-w0.start.x,w0.end.y-w0.start.y),n={x:-(w0.end.y-w0.start.y)/L,y:(w0.end.x-w0.start.x)/L};
  await page.mouse.move(c.x,c.y);await page.mouse.down();for(let i=1;i<=12;i++)await page.mouse.move(c.x+n.x*6*i,c.y+n.y*6*i);await page.mouse.up();
  const curved=await wallOf(page,id);assert.ok(curved.curve,'curvo');assert.equal(await undo(page),u0+1,'un paso de historial');
  assert.equal(await page.locator('#gSel [data-preview="curve"]').count(),0);assert.equal(await checked(page),'curve');assert.match(await page.locator('#wallShapeHint').innerText(),/Flecha actual: \d+ mm/);
  if(shots)await page.screenshot({path:shots+'/2-curvado.png'});
  // Verlo en 3D y volver.
  await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d');
  if(shots){await page.waitForTimeout(1500);await page.screenshot({path:shots+'/3-curvo-3d.png'});}
  await page.evaluate(()=>setView('2d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d');
  // Al volver del 3D la selección se conserva (contexto preservado); si no, la persona vuelve a tocar el muro.
  if(!await page.evaluate(id=>ui.sel?.kind==='wall'&&ui.sel.id===id,id))await selectWall(page,id);await page.locator('#wallStraighten').waitFor();
  // Enderezar (botón visible, sin abrir el ajuste preciso).
  await page.locator('#wallStraighten').click();assert.equal((await wallOf(page,id)).curve,undefined,'enderezado');assert.equal(await checked(page),'straight');
  // Deshacer y rehacer con el teclado; la forma final es curva.
  await page.locator('#plan').focus().catch(()=>{});
  await page.keyboard.press('Control+z');assert.deepEqual(await wallOf(page,id),curved,'deshacer: curvo');
  await page.keyboard.press('Control+Shift+z');assert.equal((await wallOf(page,id)).curve,undefined,'rehacer: recto');
  await page.keyboard.press('Control+z');assert.deepEqual(await wallOf(page,id),curved);
  await page.evaluate(async()=>{const s=window.FloorPlanPersistenceEditor?.session;if(s)await s.flush();});
  await page.reload();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&!!window.FloorPlanApp);
  assert.deepEqual(await wallOf(page,id),curved,'reabrir: la forma final guardada');
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});

test('§7.1 · Recto sobre un muro curvo lo endereza en un paso; móvil 390×844: la barra deja libre el asa con Curvo elegido',{timeout:240000},async()=>{
 const {context,page,watch}=await setup({width:390,height:844});
 try{
  const id=await drawWall(page);await page.evaluate(id=>{select({kind:'wall',id});drawer('panel',true);},id);await page.locator('#wallShape').waitFor();
  await page.locator('#wallShape .wall-shape-opt[data-shape="curve"]').click();await page.evaluate(()=>drawer('panel',false));await page.waitForFunction(()=>!document.querySelector('aside.right.open'));await page.waitForTimeout(500);// el cajón termina de cerrarse
  const c=await handle(page);assert.ok(await page.evaluate(([x,y])=>!!document.elementFromPoint(x,y)?.closest?.('[data-handle="curve"]'),[c.x,c.y]),'en móvil el asa no queda bajo la barra: '+await page.evaluate(([x,y])=>{const e=document.elementFromPoint(x,y);return e?(e.id||'')+'.'+String(e.className?.baseVal??e.className).slice(0,50)+' < '+(e.closest('[id]')?.id||''):'nada';},[c.x,c.y])+' en '+JSON.stringify(c));
  if(shots)await page.screenshot({path:shots+'/4-movil-curvo.png'});
  const w0=await wallOf(page,id),L=Math.hypot(w0.end.x-w0.start.x,w0.end.y-w0.start.y),n={x:-(w0.end.y-w0.start.y)/L,y:(w0.end.x-w0.start.x)/L};
  await page.mouse.move(c.x,c.y);await page.mouse.down();for(let i=1;i<=10;i++)await page.mouse.move(c.x+n.x*5*i,c.y+n.y*5*i);await page.mouse.up();
  assert.ok((await wallOf(page,id)).curve);const u=await undo(page);
  await page.evaluate(id=>{select({kind:'wall',id});drawer('panel',true);},id);await page.locator('#wallShape .wall-shape-opt[data-shape="straight"]').click();
  assert.equal((await wallOf(page,id)).curve,undefined,'Recto endereza');assert.equal(await undo(page),u+1,'en un paso');
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'sin desplazamiento horizontal');
  assert.deepEqual(watch.errors,[]);
 }finally{await context.close();}
});
