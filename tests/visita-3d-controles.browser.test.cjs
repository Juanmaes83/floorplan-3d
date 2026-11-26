'use strict';
/* §5.1 · Visita 3D del cliente (Entregar → «Revisar como cliente» → Explorar la vivienda), con captura REAL del ratón.
   - Abre con el cursor libre y «Activar mirada con el ratón»; capturado, muestra «Esc · Pausar y mostrar controles».
   - Esc libera: la pausa es compacta, los controles responden al instante y pulsar la escena o la interfaz NO recaptura.
   - Pausar y reanudar conserva posición y orientación; «Reanudar recorrido» vuelve a capturar.
   - Un solo miniplano (Ocultar plano funciona), el Asistente sin tapar controles, salir de la visita.
   - Regla del idioma visible: el título del proyecto de ejemplo (guardado en chino) nunca se ve en chino en ES.
   Móvil 390×844 táctil: joystick, sin solapes. Capturas opcionales: VISITA_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./ux07/kit.cjs'),{accion}=require('./helpers-perla-entregar.cjs');
const shots=process.env.VISITA_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
const CJK=/[㐀-鿿]/;
let env;test.before(async()=>{env=await K.start({authority:true});});test.after(async()=>{await env?.stop();});
async function visit(opts){
 const ctx=await env.browser.newContext(opts);const page=await ctx.newPage();
 await page.goto(env.base);await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open).catch(()=>false)){await page.keyboard.press('Escape');}
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));
 const b=await accion(page,'#delivery3dPreview');const [pop]=await Promise.all([ctx.waitForEvent('page'),b.click()]);const w=K.watch(pop,env.base);
 await pop.waitForSelector('#deliveryWalk',{timeout:60000});assert.doesNotMatch(await pop.evaluate(()=>document.body.innerText+document.title),CJK,'portada de la visita sin chino');
 await pop.click('#deliveryWalk');await pop.waitForFunction(()=>window.View3D?.walkPose?.()&&document.getElementById('walkOverlay').offsetParent!==null||document.getElementById('joy')?.style.display==='block',null,{timeout:60000});
 return {ctx,pop,w};}
const pose=p=>p.evaluate(()=>{const q=View3D.walkPose();return JSON.stringify(q);});
const locked=p=>p.evaluate(()=>!!document.pointerLockElement);
// Ningún control visible queda tapado: el elemento en su centro es él mismo (o un hijo suyo).
const covered=p=>p.evaluate(()=>[...document.querySelectorAll('#deliveryBar button, #deliveryMap button, #stage button, #assistantFab')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').filter(b=>{const r=b.getBoundingClientRect();if(r.width<2)return false;const e=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return !(e===b||b.contains(e));}).map(b=>b.id||b.textContent.trim().slice(0,20)));

test('§5.1 · escritorio: cursor libre → mirada con el ratón → Esc pausa sin perder encuadre, controles directos, sin recaptura → reanudar',{timeout:240000},async()=>{
 const {ctx,pop,w}=await visit({viewport:{width:1440,height:900}});
 try{
  assert.equal(await locked(pop),false,'abre con el cursor libre');assert.equal(await pop.locator('#walkStart').innerText(),'Activar mirada con el ratón');
  assert.equal(await pop.locator('.presentation-minimap:visible, #nav3dMap:visible').count(),1,'un solo miniplano');
  assert.deepEqual(await covered(pop),[],'ningún control tapado (Asistente con espacio propio)');
  assert.doesNotMatch(await pop.locator('#deliveryBar').innerText(),CJK,'título sin chino');
  if(shots)await pop.screenshot({path:shots+'/1-inicio-cursor-libre.png'});
  // Activar la mirada: captura real del ratón y aviso persistente.
  await pop.click('#walkStart');await pop.waitForFunction(()=>!!document.pointerLockElement);
  assert.equal(await pop.locator('#walkLockHint').innerText(),'Esc · Pausar y mostrar controles');assert.equal(await pop.locator('#walkLockHint').isVisible(),true);
  // Moverse y mirar.
  const p0=await pose(pop);await pop.mouse.move(700,450);await pop.mouse.move(760,430,{steps:6});await pop.keyboard.down('KeyW');await pop.waitForTimeout(600);await pop.keyboard.up('KeyW');await pop.waitForTimeout(200);
  const p1=await pose(pop);assert.notEqual(p1,p0,'el recorrido se mueve');
  if(shots)await pop.screenshot({path:shots+'/2-mirada-capturada.png'});
  // Esc: pausa con encuadre intacto; los controles responden al momento y pulsar la escena no recaptura.
  await pop.keyboard.press('Escape');await pop.waitForFunction(()=>!document.pointerLockElement&&document.getElementById('walkOverlay').classList.contains('paused'));
  assert.equal(await pop.locator('#walkTitle').innerText(),'Recorrido en pausa');assert.equal(await pop.locator('#walkStart').innerText(),'Reanudar recorrido');
  assert.equal(await pose(pop),p1,'pausar conserva posición y orientación');
  await pop.mouse.click(1000,600);await pop.waitForTimeout(400);assert.equal(await locked(pop),false,'pulsar la escena no recaptura el ratón');
  const tg=pop.locator('#deliveryMapToggle');const t0=await tg.innerText();await tg.click();await pop.waitForTimeout(200);
  assert.notEqual(await tg.innerText(),t0,'Ocultar plano responde al primer clic');assert.equal(await locked(pop),false,'pulsar la interfaz no recaptura');
  await tg.click();assert.deepEqual(await covered(pop),[]);
  if(shots)await pop.screenshot({path:shots+'/3-pausa-controles-libres.png'});
  assert.equal(await pose(pop),p1,'usar los controles no cambia el encuadre');
  // Reanudar: vuelve a capturar desde el mismo encuadre.
  await pop.click('#walkStart');await pop.waitForFunction(()=>!!document.pointerLockElement);assert.equal(await pose(pop),p1,'reanudar conserva el encuadre');
  await pop.keyboard.press('Escape');await pop.waitForFunction(()=>!document.pointerLockElement);
  // Salir de la visita.
  await pop.click('#deliveryExit');await pop.waitForFunction(()=>!document.documentElement.classList.contains('delivery-in-visit'));
  assert.doesNotMatch(await pop.evaluate(()=>document.body.innerText+document.title),CJK);assert.deepEqual(w.errors,[]);assert.deepEqual(w.external,[]);
 }finally{await ctx.close();}
});

test('§5.1 · móvil 390×844 táctil: joystick, un miniplano, sin solapes, sin desplazamiento horizontal',{timeout:240000},async()=>{
 const {ctx,pop,w}=await visit({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  await pop.locator('#walkStart').tap();await pop.waitForFunction(()=>document.getElementById('joy')?.style.display==='block');
  assert.equal(await pop.locator('.presentation-minimap:visible, #nav3dMap:visible').count(),1);
  assert.deepEqual(await covered(pop),[],'sin solapes en móvil');
  assert.ok(await pop.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1),'sin desplazamiento horizontal');
  if(shots)await pop.screenshot({path:shots+'/4-movil.png'});
  const tg=pop.locator('#deliveryMapToggle');const t0=await tg.innerText();await tg.tap();await pop.waitForTimeout(200);assert.notEqual(await tg.innerText(),t0);
  assert.doesNotMatch(await pop.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
