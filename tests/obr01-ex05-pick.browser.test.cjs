'use strict';
/* OBR-01 · EX-05.3 — selección real con el ratón de los muros de carga de T02 «Estructura» (tarea sin partida).
   Defecto reproducido (examen FT3D-8 M2/S4, matriz ronda 3): ningún elemento de T02 era alcanzable con el ratón en
   ninguna vista. Causa demostrada: los contornos «sin tarea» (LineSegments) entraban en el raycast con el umbral por
   defecto de Three para líneas (1 m) y robaban el clic al muro construido. Datos: SOLO la obra sintética del examen.
   Antes/después reproducible: OBR01_ROOT=<árbol master> node --test tests/obr01-ex05-pick.browser.test.cjs (falla). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const K=require('./obr01/browser-kit.cjs');
let env,s;
before(async()=>{env=await K.start();s=await K.openEvolution(env);});
after(async()=>{await s?.context.close();await env?.stop();});
const LOOKS=[['2027-05-13','top',false],['2027-05-13','iso',false],['2027-05-13','front',false],['2027-03-24','iso',true],['2027-03-24','top',true],['2027-05-13','iso',true]];
async function look(page,[d,v,roof]){await page.evaluate(async([d,v,roof])=>{const F=window.__ft3dFidelity;F.setDate(d);document.querySelector(`[data-view="${v}"]`).click();
  const rt=document.getElementById('roofToggle');if(rt&&rt.checked!==roof)rt.click();await new Promise(r=>setTimeout(r,500));},[d,v,roof]);}
// First screen point (client coordinates) where the REAL pick returns `key`, searching a 13x13 grid inside the element's own box.
const reach=(page,key)=>page.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true});
  if(!b||!isFinite(b.x0))return null;for(let i=0;i<=12;i++)for(let j=0;j<=12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;
    if(x>c.left+2&&x<c.right-2&&y>c.top+2&&y<c.bottom-2&&F.scene.pick(x,y)===k)return {x,y};}return null;},key);
async function findAndClick(page,key){
  for(const lk of LOOKS){await look(page,lk);const p=await reach(page,key);if(!p)continue;
    await page.mouse.click(p.x,p.y);await page.waitForTimeout(250);
    const panel=await page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:{key:b.dataset.key,tasks:[...b.querySelectorAll('[data-pick-task]')].map(x=>x.dataset.pickTask),text:b.innerText};});
    return {look:lk,point:p,panel};}
  return null;}

test('EX-05.3 · los tres muros de carga de T02 «Estructura» se seleccionan con un clic real y el panel muestra ESE muro y su trabajo',{timeout:600000},async()=>{
  const T02=K.FX.elementsOf(s.fixture.schedule,'T02');
  assert.equal(T02.length,3);assert.ok(T02.every(k=>/wal_ref-w\d+$/.test(k)));
  for(const key of T02){const r=await findAndClick(s.page,key);
    assert.ok(r,`${key}: alcanzable con el ratón en alguna vista`);
    assert.equal(r.panel?.key,key,`${key}: el panel muestra ESE elemento (vista ${r.look.join('/')})`);
    assert.deepEqual(r.panel.tasks,['T02'],`${key}: su único trabajo es T02`);
    await s.page.evaluate(()=>{document.getElementById('pickInfo').hidden=true;});}
});

test('EX-05.4 sin regresión · un muro SIN tarea sigue siendo seleccionable con el ratón y el panel lo dice',{timeout:300000},async()=>{
  const linked=new Set(s.fixture.schedule.tasks.flatMap(t=>K.FX.elementsOf(s.fixture.schedule,t.id)));
  const free=s.fixture.inventory.elements.filter(e=>e.type==='wall'&&e.representable&&!linked.has(e.key)).map(e=>e.key);
  // Como el examen: barrido 39x27 del lienzo con el raycast real (los contornos «sin tarea» no tienen caja «en pie»).
  let got=null;for(const lk of LOOKS){await look(s.page,lk);
    const p=await s.page.evaluate(free=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),set=new Set(free);
      for(let i=1;i<40;i++)for(let j=1;j<28;j++){const x=c.left+c.width*i/40,y=c.top+c.height*j/28,k=F.scene.pick(x,y);if(set.has(k))return {x,y,k};}return null;},free);
    if(!p)continue;await s.page.mouse.click(p.x,p.y);await s.page.waitForTimeout(250);
    got={look:lk,key:p.k,panel:await s.page.evaluate(()=>{const b=document.getElementById('pickInfo');return b.hidden?null:{key:b.dataset.key,tasks:[...b.querySelectorAll('[data-pick-task]')].map(x=>x.dataset.pickTask),text:b.innerText};})};break;}
  assert.ok(got,'algún muro sin tarea es alcanzable');
  assert.equal(got.panel?.key,got.key,'el panel muestra ESE muro sin tarea');assert.match(got.panel.text,/no tiene trabajos vinculados/);assert.deepEqual(got.panel.tasks,[]);
  await s.page.evaluate(()=>{document.getElementById('pickInfo').hidden=true;});
});

test('EX-05.3 causa · si un elemento construido está en el rayo, gana el sólido más cercano; un contorno «sin tarea» nunca se lo quita',{timeout:300000},async()=>{
  // Planta, al final, sin cubierta, y el ISO final: rejilla dentro de la silueta de cada muro de T02.
  for(const lk of [['2027-05-13','top',false],['2027-05-13','iso',false]]){await look(s.page,lk);
    for(const key of K.FX.elementsOf(s.fixture.schedule,'T02')){
      const r=await s.page.evaluate(k=>{const F=window.__ft3dFidelity,c=document.getElementById('stage').getBoundingClientRect(),b=F.scene.screenBounds(k,{exact:true}),bad=[];let own=0,n=0;
        for(let i=1;i<12;i++)for(let j=1;j<12;j++){const nx=b.x0+(b.x1-b.x0)*i/12,ny=b.y0+(b.y1-b.y0)*j/12,x=c.left+(nx+1)/2*c.width,y=c.top+(1-ny)/2*c.height;
          if(!(x>c.left&&x<c.right&&y>c.top&&y<c.bottom))continue;n++;const hs=F.scene.hitsAt(x,y),p=F.scene.pick(x,y),solid=hs.find(h=>h.kind==='solid');
          if(p===k)own++;if(solid&&p!==solid.key)bad.push({p,solid:solid.key});if(hs.some(h=>h.kind==='ghost')&&solid&&p!==solid.key)bad.push({ghostWon:p});}
        return {own,n,bad:bad.slice(0,5)};},key);
      assert.deepEqual(r.bad,[],`${key} ${lk.join('/')}: el sólido más cercano gana siempre`);
      assert.ok(r.own>0,`${key} ${lk.join('/')}: el propio muro gana dentro de su silueta (${r.own}/${r.n})`);}}
});

test('EX-05.K sin regresión · alternativa de teclado (Intro) y sin errores ni peticiones externas',{timeout:120000},async()=>{
  await s.page.locator('#stage').focus();await s.page.keyboard.press('Enter');
  assert.ok(await s.page.evaluate(()=>!document.getElementById('pickInfo').hidden),'Intro abre el panel de un elemento');
  assert.deepEqual(s.watch.errors,[]);assert.deepEqual(s.watch.external,[]);
});
