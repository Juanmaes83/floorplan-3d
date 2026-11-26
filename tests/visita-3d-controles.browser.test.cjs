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

/* §5.1 · Revisión humana 26/11 (b1fc6248): barra utilizable antes de empezar y en pausa, atenuada y sin clics con el ratón
   capturado; sin avisos solapados; las opciones solo de Vista aérea lo dicen y llevan a ese modo; ningún botón visible sin
   respuesta; «Fachadas» completo dentro de la ventana (ratón y teclado); pausar/reanudar varias veces sin salto de cámara. */
const BAR='#stage .perla-canvas-top';
const barState=p=>p.evaluate(sel=>{const top=document.querySelector(sel);return [...top.querySelectorAll('button,select,input')].filter(b=>b.getClientRects().length&&getComputedStyle(b).visibility!=='hidden').map(b=>{
 const r=b.getBoundingClientRect(),cx=Math.min(Math.max(r.x+r.width/2,top.getBoundingClientRect().left+2),top.getBoundingClientRect().right-2),h=document.elementFromPoint(cx,r.y+r.height/2);
 const reach=getComputedStyle(b).pointerEvents!=='none'&&getComputedStyle(b.closest('.perla-canvas-top>*')||b).pointerEvents!=='none';
 return {label:(b.textContent.trim()||b.id).replace(/\s+/g,' ').slice(0,40),reach,hit:!!h&&(h===b||b.contains(h)||top.contains(h)),inside:r.top>=0&&r.bottom<=innerHeight,note:b.dataset.modeNote||null,modes:!!b.closest('#modes3d'),dim:+getComputedStyle(b.closest('.perla-canvas-top>*')||b).opacity<.5};});},BAR);
const hintsOverlap=p=>p.evaluate(()=>{const vis=[...document.querySelectorAll('#hint3d,#walkLockHint')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.hidden&&getComputedStyle(e).opacity!=='0');
 const boxes=vis.map(e=>e.getBoundingClientRect()),map=document.querySelector('#deliveryMap')?.getBoundingClientRect(),hit=(a,b)=>a&&b&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
 return {visible:vis.map(e=>e.id),overlap:boxes.length>1&&hit(boxes[0],boxes[1]),underMap:boxes.some(b=>hit(b,map))};});
for(const viewport of [{width:1440,height:900},{width:1024,height:560}])
test(`§5.1 · barra en Recorrer: antes, capturada, en pausa; opciones de Vista aérea; Fachadas; pausar ×3 (${viewport.width}x${viewport.height})`,{timeout:300000},async()=>{
 const {ctx,pop,w}=await visit({viewport});const tag=`${viewport.width}`;
 try{
  // Antes de empezar: toda la barra visible y alcanzable; la tarjeta no queda tapada.
  let bar=await barState(pop);assert.ok(bar.length>=12,'la barra entera se ve: '+bar.length);
  for(const b of bar){assert.ok(b.reach&&b.hit,'alcanzable antes de empezar: '+b.label);assert.ok(b.inside,'dentro de la ventana: '+b.label);}
  const startHit=await pop.evaluate(()=>{const r=document.getElementById('walkStart').getBoundingClientRect(),h=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return h?.id==='walkStart'||!!h?.closest?.('#walkStart');});
  assert.ok(startHit,'«Activar mirada con el ratón» no queda tapado por la barra');
  const notes=bar.filter(b=>b.note).map(b=>b.label);
  for(const n of ['Muros completos','Muros seccionados','Exterior','Detalle arquitectónico','Nombres'])assert.ok(notes.some(l=>l.startsWith(n)),'«'+n+'» indica que es de Vista aérea');
  assert.ok(notes.every(()=>true)&&bar.filter(b=>b.note).every(b=>b.note==='Vista aérea'));
  // Capturado: la barra se atenúa y no recibe clics; un solo aviso, sin solapes.
  await pop.click('#walkStart');await pop.waitForFunction(()=>!!document.pointerLockElement&&document.body.dataset.walkLock==='on');
  bar=await barState(pop);for(const b of bar.filter(b=>!b.modes))assert.ok(!b.reach&&b.dim,'con el ratón capturado no aparenta poder pulsarse: '+b.label);
  let h=await hintsOverlap(pop);assert.deepEqual(h.visible,['walkLockHint'],'un único aviso con el ratón capturado');assert.equal(h.underMap,false);
  if(shots)await pop.screenshot({path:`${shots}/5-capturado-${tag}.png`});
  // Pausar y reanudar tres veces: misma cámara.
  let p=await pose(pop);
  for(let i=0;i<3;i++){
   await pop.keyboard.press('Escape');await pop.waitForFunction(()=>!document.pointerLockElement&&document.getElementById('walkOverlay').classList.contains('paused'));
   assert.equal(await pose(pop),p,'pausa '+(i+1)+' conserva la cámara');
   assert.equal(await pop.evaluate(()=>getComputedStyle(document.getElementById('walkOverlay')).backgroundColor),'rgba(0, 0, 0, 0)','la pausa no oscurece la escena');
   bar=await barState(pop);for(const b of bar)assert.ok(b.reach&&b.hit&&b.inside,'en pausa se puede usar: '+b.label);
   h=await hintsOverlap(pop);assert.equal(h.overlap,false);assert.equal(h.underMap,false,'el aviso no queda bajo el miniplano');
   if(i===0){
    // Controles del recorrido, directos en pausa y sin recapturar: Noche, Muebles, luz, entorno, plano, Asistente.
    for(const sel of ['[data-t="night"]','[data-t="furn"]']){const b=pop.locator(sel);const on=await b.evaluate(e=>e.classList.contains('on'));await b.click();await pop.waitForTimeout(150);
     assert.notEqual(await b.evaluate(e=>e.classList.contains('on')),on,sel+' responde en Recorrer');await b.click();assert.equal(await locked(pop),false);}
    await pop.locator('#sun').fill('15');assert.equal(await pop.locator('#sunT').innerText(),'15:00','la luz responde');
    const env=pop.locator('#env3d');const v0=await env.inputValue();const opts=await env.evaluate(s=>[...s.options].map(o=>o.value));await env.selectOption(opts.find(o=>o!==v0));await env.selectOption(v0);
    assert.equal(await pose(pop),p,'usar los controles del recorrido no mueve la cámara');assert.equal(await locked(pop),false);
    const fab=pop.locator('#assistantFab');await fab.click();await pop.waitForTimeout(400);assert.equal(await locked(pop),false,'el Asistente se abre sin recapturar');await pop.keyboard.press('Escape');await pop.waitForTimeout(300);
    if(shots)await pop.screenshot({path:`${shots}/6-pausa-barra-${tag}.png`});
   }
   await pop.click('#walkStart');await pop.waitForFunction(()=>!!document.pointerLockElement);assert.equal(await pose(pop),p,'reanudar '+(i+1)+' sin salto de cámara');
  }
  await pop.keyboard.press('Escape');await pop.waitForFunction(()=>!document.pointerLockElement);
  // Opción de Vista aérea pulsada en Recorrer: pasa a Vista aérea y se aplica (ningún botón visible sin respuesta).
  await pop.locator('[data-cut="1.2"]').click();await pop.waitForFunction(()=>document.body.dataset.mode3d==='orbit',null,{timeout:15000});
  await pop.waitForFunction(()=>document.querySelector('[data-cut="1.2"]').classList.contains('on'));
  assert.equal(await pop.locator('[data-cut="1.2"]').evaluate(b=>b.dataset.modeNote||null),null,'en Vista aérea ya no lleva la nota');
  await pop.locator('[data-cut="2.8"]').click();await pop.waitForFunction(()=>document.querySelector('[data-cut="2.8"]').classList.contains('on'));
  // Fachadas: completo dentro de la ventana, con teclado y con ratón; se cierra con Esc y devuelve el foco.
  await pop.locator('#architecturalQuality').click();await pop.waitForFunction(()=>{const m=document.getElementById('facadeV2Menu');return m&&!m.hidden;},null,{timeout:30000});
  const menu=pop.locator('#facadeV2Menu');await menu.focus();await pop.keyboard.press('Enter');await pop.waitForFunction(()=>!document.getElementById('facadeV2Pop').hidden);
  const fp=await pop.evaluate(()=>{const p=document.getElementById('facadeV2Pop'),r=p.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,vh:innerHeight,vw:innerWidth,clip:p.scrollHeight-p.clientHeight};});
  assert.ok(fp.top>=0&&fp.bottom<=fp.vh&&fp.left>=0&&fp.right<=fp.vw,'Fachadas entero dentro de la ventana: '+JSON.stringify(fp));assert.ok(fp.clip<=1,'todas sus opciones a la vista');
  const sw=pop.locator('#facadeV2Toggle');await sw.focus();assert.equal(await pop.evaluate(()=>document.activeElement.id),'facadeV2Toggle','su opción se alcanza con teclado');
  if(shots)await pop.screenshot({path:`${shots}/7-fachadas-${tag}.png`});
  await pop.keyboard.press('Escape');await pop.waitForFunction(()=>document.getElementById('facadeV2Pop').hidden);assert.equal(await pop.evaluate(()=>document.activeElement.id),'facadeV2Menu');
  await menu.click();await pop.waitForFunction(()=>!document.getElementById('facadeV2Pop').hidden);await menu.click();await pop.waitForFunction(()=>document.getElementById('facadeV2Pop').hidden);
  // Volver a Recorrer y salir de la visita.
  await pop.getByRole('button',{name:'Recorrer',exact:true}).click();await pop.waitForFunction(()=>document.body.dataset.mode3d==='walk');
  await pop.click('#deliveryExit');await pop.waitForFunction(()=>!document.documentElement.classList.contains('delivery-in-visit'));
  assert.doesNotMatch(await pop.evaluate(()=>document.body.innerText),CJK);assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});

test('§5.1 · móvil 390×844: Fachadas en Vista aérea entero dentro de la pantalla; opciones de Vista aérea señaladas en Recorrer',{timeout:240000},async()=>{
 const {ctx,pop,w}=await visit({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
 try{
  assert.equal(await pop.evaluate(()=>document.body.dataset.mode3d),'walk');
  await pop.getByRole('button',{name:'Vista aérea',exact:true}).first().tap();await pop.waitForFunction(()=>document.body.dataset.mode3d==='orbit',null,{timeout:15000});
  await pop.locator('#architecturalQuality').scrollIntoViewIfNeeded();await pop.locator('#architecturalQuality').tap();
  await pop.waitForFunction(()=>{const m=document.getElementById('facadeV2Menu');return m&&!m.hidden;},null,{timeout:30000});
  await pop.locator('#facadeV2Menu').scrollIntoViewIfNeeded();await pop.locator('#facadeV2Menu').tap();await pop.waitForFunction(()=>!document.getElementById('facadeV2Pop').hidden);
  const fp=await pop.evaluate(()=>{const p=document.getElementById('facadeV2Pop'),r=p.getBoundingClientRect();return {top:r.top,bottom:r.bottom,left:r.left,right:r.right,vh:innerHeight,vw:innerWidth};});
  assert.ok(fp.top>=0&&fp.bottom<=fp.vh&&fp.left>=0&&fp.right<=fp.vw,'Fachadas dentro de la pantalla: '+JSON.stringify(fp));
  if(shots)await pop.screenshot({path:shots+'/8-movil-fachadas.png'});
  assert.ok(await pop.evaluate(()=>document.documentElement.scrollWidth-innerWidth<=1));assert.deepEqual(w.errors,[]);
 }finally{await ctx.close();}
});
