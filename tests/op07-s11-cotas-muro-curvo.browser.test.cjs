'use strict';
/* §7.1 · Defecto de la revisión humana (26/11): tras curvar un muro exterior del ejemplo, la cota vertical izquierda mostraba
   «3699.0858725761773» y sus caracteres se solapaban. Las cotas muestran mm enteros y se leen en planta y en móvil; el valor
   de cálculo (geometría) no cambia. No toca el control aprobado de Recto/Curvo/Enderezar. Capturas: MUROS_SHOTS=<dir>. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const K=require('./photo-project/kit.cjs');
const shots=process.env.MUROS_SHOTS||null;if(shots)fs.mkdirSync(shots,{recursive:true});
let env;test.before(async()=>{env=require('./op07/browser-state.cjs').withState(await K.start(),'active');});test.after(async()=>{await env?.stop();});
const screen=(page,pt)=>page.evaluate(({x,y})=>{const s=document.querySelector('#plan'),m=s.getScreenCTM(),q=s.createSVGPoint();q.x=x;q.y=y;const r=q.matrixTransform(m);return {x:r.x,y:r.y};},pt);
const dims=page=>page.evaluate(()=>{const t=[...document.querySelectorAll('#gDims text')];return {texts:t.map(e=>e.textContent),boxes:t.map(e=>{const r=e.getBoundingClientRect();return [r.left,r.top,r.right,r.bottom];})};});
const overlaps=b=>{const o=[];for(let i=0;i<b.length;i++)for(let j=i+1;j<b.length;j++){const [a,c]=[b[i],b[j]];if(a[0]<c[2]-.5&&c[0]<a[2]-.5&&a[1]<c[3]-.5&&c[1]<a[3]-.5)o.push([i,j]);}return o;};
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`§7.1 · cotas con un muro exterior curvado: mm enteros, sin solapes, cálculo intacto (${viewport.width}x${viewport.height})`,{timeout:240000},async()=>{
 const {context,page,watch}=await K.editor(env,{viewport});
 try{
  await page.evaluate(()=>{select(null);fitView();});
  // El muro superior del dormitorio infantil (exterior), como en la captura del propietario.
  const wall=await page.evaluate(()=>{const P=FloorPlanApp.project,r=geometry.rooms.find(r=>r.id==='rom_kid');const pts=r.poly;
   const x0=Math.min(...pts.map(p=>p[0])),x1=Math.max(...pts.map(p=>p[0])),y0=Math.min(...pts.map(p=>p[1]));
   const w=P.walls.filter(w=>Math.abs(w.start.y-w.end.y)<1&&Math.abs(w.start.y-y0)<600&&Math.max(w.start.x,w.end.x)>x0+100&&Math.min(w.start.x,w.end.x)<x1-100).sort((a,b)=>Math.abs(b.end.x-b.start.x)-Math.abs(a.end.x-a.start.x))[0];return w?structuredClone(w):null;});
  assert.ok(wall,'muro exterior superior del dormitorio infantil');
  await page.evaluate(id=>{select({kind:'wall',id});if(innerWidth<900)drawer('panel',true);},wall.id);await page.waitForTimeout(400);await page.locator('#wallShape').waitFor({state:'attached'});
  // Flecha de 330 mm, la de la captura, con el ajuste preciso del mismo control (no se toca el diseño aprobado).
  const pr=page.locator('#wallShapePrecise');if(!await pr.evaluate(d=>d.open)){await page.locator('#wallShapePrecise > summary').scrollIntoViewIfNeeded();await page.locator('#wallShapePrecise > summary').click();}
  await page.locator('#wallSagitta').scrollIntoViewIfNeeded();await page.fill('#wallSagitta','-330');await page.click('#wallApplyShape');
  await page.waitForFunction(id=>!!FloorPlanApp.project.walls.find(w=>w.id===id)?.curve,wall.id,{timeout:15000}).catch(async()=>{await page.fill('#wallSagitta','330');await page.click('#wallApplyShape');});
  if(viewport.width<900){await page.evaluate(()=>{for(const d of ['lib','panel'])try{drawer(d,false);}catch{}});await page.waitForTimeout(400);}
  const curved=await page.evaluate(id=>structuredClone(FloorPlanApp.project.walls.find(w=>w.id===id)),wall.id);assert.ok(curved.curve,'el muro queda curvo');
  await page.evaluate(()=>{select(null);fitView();});await page.waitForTimeout(300);
  const d=await dims(page);assert.ok(d.texts.length>=10,'cotas visibles: '+d.texts.length);
  for(const t of d.texts)assert.match(t,/^\d+$/,'cota en mm enteros: «'+t+'»');
  assert.deepEqual(overlaps(d.boxes),[],'ninguna cota se solapa con otra');
  // El cálculo subyacente no se toca: la geometría conserva decimales y la etiqueta es su redondeo.
  const exact=await page.evaluate(()=>{const r=geometry.rooms.find(q=>q.id==='rom_kid');const ys=r.poly.map(p=>p[1]);return Math.max(...ys)-Math.min(...ys);});
  if(exact!==null)assert.ok(d.texts.includes(String(Math.round(exact))),'la cota muestra el redondeo del valor exacto '+exact);
  if(shots)await page.screenshot({path:`${shots}/cotas-muro-curvo-${viewport.width}.png`});
  assert.deepEqual(watch.errors??[],[]);
 }finally{await context.close();}
});
