// Shared panel pattern (19-10-2026): every properties panel starts with the same head. «Volver» is the first control,
// at the top, with the same look in equivalent panels, and goes one level up (furniture → room → overview, opening →
// room, «Plano propio» edit → its tools). On narrow screens «Ver en el plano» closes the drawer and keeps the
// selection. Checked at 1440x900, 390x844 and 844x390 on the example in the full editor.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.UX_SHOTS||path.join(root,'docs/qa/artifacts/editor-ux/after');
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

// 720x450 is 1440x900 at 200 % page zoom.
for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390},{width:720,height:450}])
test(`panel head, «Volver» and «Ver en el plano» ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const mobile=viewport.width<1000,narrow=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await require('./editor-fixture.cjs')(page);
 const press=async sel=>{const l=page.locator(sel).first();await l.scrollIntoViewIfNeeded();mobile?await l.tap():await l.click();await page.waitForTimeout(150);};
 const open=async sel=>{await page.evaluate(sel=>{window.select(sel);drawer('panel',true);},sel);await page.waitForTimeout(400);};
 // Measures the head of the current panel: first control, its position and its look.
 const head=()=>page.evaluate(()=>{const p=document.querySelector('#panel .panel-view, #panel > .opening-panel'),h=p?.querySelector('.panel-head'),b=h?.querySelector('[data-panel-back]'),aside=document.querySelector('aside.right').getBoundingClientRect();
  const first=p?.querySelector('button,input,select,textarea,summary,a[href]');const cs=b&&getComputedStyle(b),r=b?.getBoundingClientRect();
  return {head:!!h,headFirst:p?.firstElementChild===h,back:b&&{text:b.textContent,first:first===b,top:Math.round(r.top-aside.top),left:Math.round(r.left-aside.left),h:Math.round(r.height),style:[cs.fontWeight,cs.borderTopStyle,cs.borderRadius,cs.backgroundColor,cs.color].join('|')},title:h?.querySelector('h3')?.textContent,plan:!!h?.querySelector('[data-panel-plan]'),hScroll:document.documentElement.scrollWidth>innerWidth+1,panelOverflow:p?p.scrollWidth>p.clientWidth+1:false};});
 const ids=await page.evaluate(()=>{const p=FloorPlanApp.project,room=p.rooms.find(r=>r.id==='rom_child')||p.rooms[0];const f=state.furniture.find(f=>{const g=FloorPlanApp.geometry.rooms.find(r=>r.id===room.id);let y=false;const poly=g.poly;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>f.cy)!==(b[1]>f.cy)&&f.cx<(b[0]-a[0])*(f.cy-a[1])/(b[1]-a[1])+a[0])y=!y;}return y;});const o=p.openings.find(o=>{const s=FloorPlanOpenings.sides(p,o);return s.left.roomId===room.id||s.right.roomId===room.id;});return {room:room.id,furn:f.id,opening:o.id};});
 const seen=[];
 // Overview: top level, same head without «Volver».
 await open(null);let h=await head();assert.equal(h.head&&h.headFirst,true);assert.ok(!h.back,'the overview is the top level');assert.match(h.title,/Vista general/);seen.push(['overview',h]);
 // Room → «← Vista general».
 await open({kind:'room',id:ids.room});h=await head();assert.equal(h.headFirst,true);assert.equal(h.back.first,true,'«Volver» is the first control');assert.equal(h.back.text,'← Vista general');seen.push(['room',h]);
 await page.screenshot({path:path.join(shots,`${name}-p01-room-head.png`)});
 // Furniture inside the room → «← Estancia «…»».
 await open({kind:'furn',id:ids.furn});h=await head();assert.equal(h.back.first,true);assert.match(h.back.text,/^← Estancia «/);seen.push(['furniture',h]);
 await page.screenshot({path:path.join(shots,`${name}-p02-furniture-head.png`)});
 await press('#panel [data-panel-back]');assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:ids.room},'furniture → room');
 // Opening → «← Estancia «…»» (opens directly).
 await page.evaluate(id=>openOpening(id),ids.opening);await page.waitForTimeout(400);h=await head();assert.equal(h.back.first,true);assert.match(h.back.text,/^← (Estancia «|Vista general)/);seen.push(['opening',h]);
 await press('#panel [data-panel-back]');assert.equal(await page.evaluate(()=>ui.sel?.kind==='room'||ui.sel===null),true,'opening → room');
 await press('#panel [data-panel-back]');assert.equal(await page.evaluate(()=>ui.sel),null,'room → overview');
 // «Plano propio»: tools panel closes from the head; an edited element returns to the tools.
 await page.evaluate(()=>{document.querySelector('#traceBtn').click();});await page.waitForTimeout(400);
 const trace=await page.evaluate(()=>{const p=document.querySelector('#tracePanel'),h=p.querySelector('.panel-head'),b=h?.querySelector('.panel-back'),cs=b&&getComputedStyle(b);return {headFirst:p.firstElementChild===h,id:b?.id,first:p.querySelector('button')===b,style:cs&&[cs.fontWeight,cs.borderTopStyle,cs.borderRadius,cs.backgroundColor,cs.color].join('|'),groups:[...p.querySelectorAll('details.panel-group:not([hidden])')].map(d=>d.querySelector('summary').textContent)};});
 assert.deepEqual([trace.headFirst,trace.id,trace.first],[true,'traceHidePanel',true]);assert.deepEqual(trace.groups.slice(0,3),['Imagen y escala','Dibujar','Revisar y editar']);
 await page.screenshot({path:path.join(shots,`${name}-p03-trace-panel.png`)});
 await page.evaluate(()=>{const b=[...document.querySelectorAll('#traceWarnings button')].find(b=>b.dataset.target?.startsWith('wal_'));b.click();});await page.waitForTimeout(300);
 h=await head();assert.equal(h.back.first,true);assert.equal(h.back.text,'← Plano propio');assert.match(h.title,/^Editar muro$/);seen.push(['trace-edit',h]);
 assert.doesNotMatch(await page.locator('#panel').innerText(),/\b(wal|opn|rom|prj)_/,'no internal IDs in the edit panel');
 await press('#panel [data-panel-back]');assert.equal(await page.locator('#tracePanel').isVisible(),true,'edit → tools');
 await press('#traceHidePanel');
 // Same place and look for «Volver» in every equivalent panel (overview has none by design).
 const backs=seen.filter(([,x])=>x.back).map(([k,x])=>[k,x.back]);
 for(const [k,b] of backs){assert.ok(b.top>=0&&b.top<=24,`${k}: «Volver» at the top (${b.top}px)`);assert.ok(Math.abs(b.left-backs[0][1].left)<=1,`${k}: same left edge`);assert.equal(b.style,backs[0][1].style,`${k}: same look`);}
 assert.equal(trace.style,backs[0][1].style,'«Plano propio» uses the same «Volver» look');
 // Narrow: «Ver en el plano» from any head closes the drawer and keeps the selection.
 if(narrow){await open({kind:'room',id:ids.room});assert.equal((await head()).plan,true);await press('#panel [data-panel-plan]');
  assert.equal(await page.evaluate(()=>document.querySelector('aside.right').classList.contains('open')),false);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:ids.room});}
 // «Mostrar ▾» groups the display layers: its options sit above the plan, inside the viewport, and toggle the layer.
 await page.evaluate(()=>drawer(null));await page.waitForTimeout(400);await press('#layersMenu summary');
 const layer=await page.evaluate(()=>{const b=document.querySelector('#layers [data-layer=grid]'),r=b.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return {onTop:hit===b,inside:r.top>=0&&r.bottom<=innerHeight&&r.left>=0&&r.right<=innerWidth,before:ui.layers.grid};});
 assert.deepEqual([layer.onTop,layer.inside],[true,true],'layer options above the plan and inside the viewport');
 await press('#layers [data-layer=grid]');assert.equal(await page.evaluate(()=>ui.layers.grid),!layer.before,'the layer toggles');await press('#layers [data-layer=grid]');
 assert.equal(seen.some(([,x])=>x.hScroll),false,'no horizontal page scroll');assert.deepEqual(seen.filter(([,x])=>x.panelOverflow).map(([k])=>k),[],'no horizontal overflow inside panels');
 assert.deepEqual(errors,[]);
});

// Desktop: a tap that selects a room or a piece of furniture shows the properties column even if it was collapsed
// (the guided example starts collapsed). Phones keep «Propiedades» in the bottom bar for rooms and furniture.
test('desktop selection shows properties; phones keep the bottom bar',{timeout:240000},async t=>{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const mobile=viewport.width<1000,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});
  const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url);await page.waitForTimeout(600);
  const tap=async(x,y)=>{mobile?await page.touchscreen.tap(x,y):await page.mouse.click(x,y);await page.waitForTimeout(400);};
  await (mobile?page.locator('#welcomeExample').tap():page.locator('#welcomeExample').click());await page.waitForTimeout(800);
  const shown=()=>page.evaluate(()=>{const a=document.querySelector('aside.right');return matchMedia('(max-width:1100px)').matches?a.classList.contains('open'):!document.querySelector('.app').classList.contains('hide-panel');});
  assert.equal(await shown(),false,'guided example starts with the panel collapsed');
  const pt=await page.evaluate(()=>{const c=FloorPlanApp.project.rooms.find(r=>r.id==='rom_child').labelAt,m=new DOMPoint(c.x,c.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};});
  await tap(pt.x,pt.y);assert.deepEqual(await page.evaluate(()=>ui.sel),{kind:'room',id:'rom_child'});
  if(mobile){assert.equal(await shown(),false);assert.equal(await page.locator('#fab [data-a=prop]').isVisible(),true,'phone: «Propiedades» in the bottom bar');}
  else assert.equal(await shown(),true,'desktop: room properties shown');
  await context.close();
 }
});
