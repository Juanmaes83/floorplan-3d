/* FT3D-8 · Gate D · GD-UX-01: the 4D experience fits the usable window of a desktop browser. Real Chromium, the lab
   with the K dossier (FIXTURE A + site resources, 14 weeks). Every check reads the VISIBLE viewport (getBoundingClientRect
   against innerHeight, scroll position 0), never a full-page capture. Evidence (viewport captures) -> FT3D8_FIT_SHOTS. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_FIT_SHOTS||null;
const TYPES={'.js':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
let server,browser,base;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));base=`http://127.0.0.1:${server.address().port}/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,width,height,extra={}){
  const ctx=await browser.newContext({viewport:{width,height},...extra});t.after(()=>ctx.close());
  const page=await ctx.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))external.push(u);});
  await page.goto(`${base}labs/ft3d-8/?tab=evolucion`);
  await page.waitForFunction(()=>/^dos_/.test(document.body.dataset.dossier||'')&&window.__ft3dFidelity?.ctx,null,{timeout:60000});
  await page.evaluate(()=>{document.getElementById('introOverlay').hidden=true;});await settle(page);return {page,errors,external};
}
const settle=page=>page.evaluate(()=>new Promise(r=>setTimeout(()=>requestAnimationFrame(()=>requestAnimationFrame(r)),180)));
const at=(page,d)=>page.evaluate(d=>{const F=window.__ft3dFidelity;F.clearSelection();return d==='END'?F.end():d==='START'?F.setPos(0):F.setDate(d);},d);
// Essential regions of the 4D experience: present, rendered (non-zero size) and ENTIRELY inside the visible viewport.
const ESSENTIAL={hero:'.hero-t',viewer:'#stage',play:'#play',scrub:'#scrub',date:'#dateReadout',stamp:'#cardStage',
  card:'.evo-panel .card',week:'#cardWeek',headline:'#cardHeadline',gantt:'#ganttWrap',ganttHead:'#ganttWrap .ghead',cursor:'#gantt [data-role=cursor]',legend:'#ganttLegend'};
const layout=page=>page.evaluate(E=>{const H=innerHeight,W=innerWidth,out={};
  for(const [k,s] of Object.entries(E)){const e=document.querySelector(s),r=e?.getBoundingClientRect();
    // Parts of the Gantt (time scale, date cursor) live in its own scroll box: they must be visible INSIDE that box.
    const box=(k==='ganttHead'||k==='cursor')?document.getElementById('gantt').getBoundingClientRect():{top:0,bottom:H,left:0,right:W};
    const vis=r&&Math.min(r.bottom,box.bottom)-Math.max(r.top,box.top)>4&&Math.min(r.right,box.right)-Math.max(r.left,box.left)>1;
    out[k]=r?{top:Math.round(r.top),bottom:Math.round(r.bottom),h:Math.round(r.height),inside:(k==='ganttHead'||k==='cursor')?!!vis&&r.top>=box.top-1:r.height>0&&r.width>0&&r.top>=-1&&r.bottom<=H+1&&r.left>=-1&&r.right<=W+1}:null;}
  const R=s=>document.querySelector(s).getBoundingClientRect();
  return {H,W,scrollY,scrollW:document.documentElement.scrollWidth,regions:out,
    seams:{stageToTransport:Math.round(R('#panel-evolucion .transport').top-R('#panel-evolucion>.stagewrap').bottom),transportToPanel:Math.round(R('#panel-evolucion>.evo-panel').top-R('#panel-evolucion .transport').bottom)},
    panelBottom:Math.round(R('#panel-evolucion>.evo-panel').bottom),pageH:document.documentElement.scrollHeight,
    // Every phase of the plan inside the Gantt box (no inner scroll needed) and the legend below the last one.
    phases:(()=>{const g=R('#gantt'),rows=[...document.querySelectorAll('#gantt .row')].map(r=>r.getBoundingClientRect());
      return {count:rows.length,visible:rows.filter(r=>r.top>=g.top-1&&r.bottom<=g.bottom+1).length,legendBelow:R('#ganttLegend').top>=Math.max(...rows.map(r=>r.bottom))-1,rowH:Math.round(rows[0]?.height||0)};})()};},ESSENTIAL);
function assertFits(l,label){
  const out=Object.entries(l.regions).filter(([,r])=>!r||!r.inside).map(([k,r])=>`${k}:${JSON.stringify(r)}`);
  assert.deepEqual(out,[],`${label}: every essential region inside the ${l.W}x${l.H} viewport without scrolling`);
  assert.equal(l.scrollY,0);assert.ok(l.scrollW<=l.W+1,`${label}: no horizontal scroll`);
  assert.ok(l.panelBottom<=l.H+1,`${label}: the composition ends inside the viewport (${l.panelBottom} > ${l.H})`);
  assert.deepEqual(l.seams,{stageToTransport:0,transportToPanel:0},`${label}: no empty band between viewer, playback and panel`);
  assert.equal(l.phases.visible,l.phases.count,`${label}: all ${l.phases.count} phases of the plan visible (row ${l.phases.rowH} px)`);
  assert.ok(l.phases.legendBelow,`${label}: the legend never covers a phase`);assert.ok(l.phases.rowH>=16,`${label}: readable rows`);
}
// The house (project elements standing now) is entirely on screen and not lost in empty space.
async function framing(page){return page.evaluate(()=>window.__ft3dFidelity.scene.screenBounds('project/'));}
const shot=async(page,name)=>{if(!shots)return;await settle(page);await page.screenshot({path:path.join(shots,name)});};
const SIZES=[[1366,768],[1440,900],[1920,1080],[1280,720]];

for(const [w,h] of SIZES)test(`${w}×${h} · start, playback, simultaneous works and end of plan fit the window together`,{timeout:180000},async t=>{
  const {page,errors,external}=await open(t,w,h);
  await at(page,'START');assertFits(await layout(page),'inicio');await shot(page,`${w}x${h}-01-inicial.png`);
  // Playback: the card and the Gantt follow while the viewer stays visible (no page scroll).
  await at(page,'2027-09-20');const before=await page.evaluate(()=>({d:window.__ft3dFidelity.last.date,w:document.getElementById('cardWeek').textContent,c:document.querySelector('#gantt [data-role=cursor]').style.left}));
  await page.evaluate(()=>window.__ft3dFidelity.play());await page.waitForFunction(d=>window.__ft3dFidelity.last.date>d,before.d,{timeout:20000});
  await page.waitForTimeout(600);const during=await page.evaluate(()=>({d:window.__ft3dFidelity.last.date,c:document.querySelector('#gantt [data-role=cursor]').style.left,playing:window.__ft3dFidelity.playing,cursorDate:window.__ft3dFidelity.last.ganttCursorDate}));
  assert.equal(during.playing,true);assert.ok(during.d>before.d);assert.notEqual(during.c,before.c,'Gantt cursor moves');assert.equal(during.cursorDate,during.d);
  assertFits(await layout(page),'reproducción');await shot(page,`${w}x${h}-02-reproduccion.png`);await page.evaluate(()=>window.__ft3dFidelity.pause());
  // Four works at once: all reachable inside the card, the page does not grow.
  const pageH0=(await layout(page)).pageH;await at(page,'2027-10-12');await settle(page);
  const sim=await page.evaluate(()=>{const sc=document.querySelector('.evo-panel .cardscroll');return {tasks:document.querySelectorAll('#cardTasks li').length,scrollable:sc.scrollHeight>sc.clientHeight,overflow:getComputedStyle(sc).overflowY};});
  assert.equal(sim.tasks,4);assert.equal(sim.overflow,'auto');
  const l=await layout(page);assertFits(l,'simultáneas');assert.equal(l.pageH,pageH0,'many simultaneous works never stretch the page');
  // Every work of the moment can be brought into view INSIDE the card (the page itself does not move).
  const reach=await page.evaluate(()=>[...document.querySelectorAll('#cardTasks li')].map(li=>{li.scrollIntoView({block:'nearest'});
    const r=li.getBoundingClientRect(),sc=document.querySelector('.evo-panel .cardscroll').getBoundingClientRect();return r.top>=sc.top-1&&Math.min(r.bottom,sc.bottom)-r.top>=Math.min(40,r.height)&&scrollY===0;}));
  assert.deepEqual(reach,[true,true,true,true],'each simultaneous work is reachable inside the card');
  await shot(page,`${w}x${h}-03-simultaneas.png`);
  // End of the plan (the owner's capture): final house, «Plan completado», date, controls, card and Gantt together.
  await at(page,'END');await settle(page);const f=await layout(page);assertFits(f,'final');
  assert.equal(await page.locator('#cardStage').textContent(),'FINAL · PLAN COMPLETADO');assert.match(await page.locator('#dateReadout').textContent(),/2027/);
  const fb=await framing(page);assert.ok(fb&&fb.x0>=-1&&fb.x1<=1&&fb.y0>=-1&&fb.y1<=1,'final house entirely on screen: '+JSON.stringify(fb));
  // AUTO at the end: site resources removed, the camera comes closer to the finished house (protagonist).
  assert.ok(fb.y1-fb.y0>.6||fb.x1-fb.x0>.9,'final house fills the free part of the viewer: '+JSON.stringify(fb));
  await shot(page,`${w}x${h}-04-final.png`);
  // ISO frames what stands now: at the end the house fills the free part of the viewer.
  await page.locator('[data-view="iso"]').click();await settle(page);const iso=await framing(page);
  assert.ok(iso.x0>=-1&&iso.x1<=1&&iso.y0>=-1&&iso.y1<=1,'ISO: house on screen '+JSON.stringify(iso));
  assert.ok(iso.y1-iso.y0>.6||iso.x1-iso.x0>.9,'the house is not lost in empty space: '+JSON.stringify(iso));
  await shot(page,`${w}x${h}-05-final-iso.png`);
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
});

test('1366×768 · expanding tasks and items keeps the moment and the page height; closing restores it',{timeout:120000},async t=>{
  const {page,errors}=await open(t,1366,768);await at(page,'2027-10-12');await settle(page);
  const h0=(await layout(page)).pageH,d0=await page.evaluate(()=>window.__ft3dFidelity.last.date);
  await page.locator('#cardExtra details.cdet summary').click();await settle(page);
  assert.equal(await page.evaluate(()=>document.querySelector('#cardExtra details.cdet').open),true);
  const l=await layout(page);assertFits(l,'detalle abierto');assert.equal(l.pageH,h0);assert.equal(await page.evaluate(()=>window.__ft3dFidelity.last.date),d0);
  await page.evaluate(()=>document.querySelector('#cardExtra details.cdet').scrollIntoView({block:'nearest'}));assert.equal(await page.evaluate(()=>scrollY),0,'scrolls inside the card, not the page');
  await shot(page,'1366x768-06-detalle-partidas.png');
  await page.locator('#cardExtra details.cdet summary').click();assert.equal(await page.evaluate(()=>window.__ft3dFidelity.last.date),d0);
  // Gantt: all rows reachable inside the panel, the time scale stays on top.
  await page.evaluate(()=>{const g=document.getElementById('gantt');g.scrollTop=g.scrollHeight;});await settle(page);
  const g=await page.evaluate(()=>{const w=document.getElementById('gantt').getBoundingClientRect(),hd=document.querySelector('#ganttWrap .ghead').getBoundingClientRect(),last=[...document.querySelectorAll('#gantt .row')].at(-1).getBoundingClientRect();
    return {headTop:Math.round(hd.top-w.top),lastVisible:last.bottom<=w.bottom+1&&last.top>=w.top};});
  assert.equal(g.headTop,0,'sticky time scale');assert.equal(g.lastVisible,true,'last plan row reachable');
  assert.equal((await layout(page)).scrollY,0);assert.deepEqual(errors,[]);
});

test('resizing the window re-frames the house (camera follows the viewer) unless the user moved it',{timeout:120000},async t=>{
  const {page}=await open(t,1440,900);await at(page,'END');await page.locator('[data-view="iso"]').click();await settle(page);
  const p0=await page.evaluate(()=>window.__ft3dFidelity.pose);
  await page.setViewportSize({width:1280,height:720});await page.waitForTimeout(500);await settle(page);
  const p1=await page.evaluate(()=>window.__ft3dFidelity.pose),b1=await framing(page);
  assert.notDeepEqual(p1.position,p0.position,'re-framed after resize');assert.ok(b1.x0>=-1&&b1.x1<=1&&b1.y0>=-1&&b1.y1<=1,JSON.stringify(b1));
  assertFits(await layout(page),'tras redimensionar');
  await page.locator('[data-view="free"]').click();const p2=await page.evaluate(()=>window.__ft3dFidelity.pose);
  await page.setViewportSize({width:1366,height:768});await page.waitForTimeout(500);
  assert.deepEqual((await page.evaluate(()=>window.__ft3dFidelity.pose)).position,p2.position,'LIBRE keeps the user view');
});

test('browser zoom: 125 % keeps the composition; 150 % falls back to the stacked layout, nothing cut or hidden',{timeout:120000},async t=>{
  // 1280×720 at 125 % = 1024×576 CSS px (fits); 1366×768 at 150 % ≈ 911×512 (below 560 px of height: stacked).
  const z125=await open(t,1024,576);await at(z125.page,'2027-10-12');assertFits(await layout(z125.page),'zoom 125 %');await shot(z125.page,'zoom125-1024x576-simultaneas.png');
  const z150=await open(t,911,512);await at(z150.page,'2027-10-12');
  const s=await z150.page.evaluate(()=>({scrollW:document.documentElement.scrollWidth,W:innerWidth,pageH:document.documentElement.scrollHeight,H:innerHeight,
    sizes:['#stage','#play','.evo-panel .card','#ganttWrap'].map(q=>Math.round(document.querySelector(q).getBoundingClientRect().height))}));
  assert.ok(s.scrollW<=s.W+1,'no horizontal scroll');assert.ok(s.pageH>s.H,'page scroll available');assert.ok(s.sizes.every(x=>x>30),'every region rendered: '+s.sizes);
  await shot(z150.page,'zoom150-911x512-inicio-de-pagina.png');
});

test('mobile 390×844 keeps its stacked layout (viewer first, no horizontal scroll)',{timeout:120000},async t=>{
  const {page,errors}=await open(t,390,844,{isMobile:true,hasTouch:true});await at(page,'2027-10-12');
  const m=await page.evaluate(()=>({top:Math.round(document.getElementById('stage').getBoundingClientRect().top),h:Math.round(document.getElementById('stage').getBoundingClientRect().height),scrollW:document.documentElement.scrollWidth,W:innerWidth,
    panelH:getComputedStyle(document.getElementById('panel-evolucion')).height}));
  assert.ok(m.top<160&&m.h>=260,JSON.stringify(m));assert.ok(m.scrollW<=m.W+1);await shot(page,'movil-390x844.png');assert.deepEqual(errors,[]);
});

test('AUTO orbit: at every angle the house stays on screen and clear of the headline (projection offset, not a world pan)',{timeout:120000},async t=>{
  for(const [w,h] of [[1366,768],[1920,1080]]){
    const {page}=await open(t,w,h);await at(page,'2027-10-12');await settle(page);
    const r=await page.evaluate(()=>{const F=window.__ft3dFidelity,p=F.pose,hero=document.querySelector('.hero').getBoundingClientRect(),cv=document.getElementById('stage').getBoundingClientRect(),out=[];
      for(let i=0;i<8;i++){const a=i/8*Math.PI*2,dx=p.position[0]-p.target[0],dz=p.position[2]-p.target[2];
        F.setPose({...p,position:[p.target[0]+dx*Math.cos(a)-dz*Math.sin(a),p.position[1],p.target[2]+dx*Math.sin(a)+dz*Math.cos(a)]});
        const b=F.scene.screenBounds('project/');
        // Headline box in NDC: the house must not sit under it.
        const hx1=(hero.right-cv.left)/cv.width*2-1,hy0=1-(hero.bottom-cv.top)/cv.height*2;
        out.push({b,under:b.x0<hx1&&b.y1>hy0,offset:p.offset});}
      return out;});
    for(const [i,x] of r.entries()){assert.ok(x.offset,'presentation pose carries a projection offset');
      assert.ok(x.b.x0>=-1&&x.b.x1<=1&&x.b.y0>=-1&&x.b.y1<=1,`${w}x${h} angle ${i}: on screen ${JSON.stringify(x.b)}`);
      assert.equal(x.under,false,`${w}x${h} angle ${i}: house clear of the headline ${JSON.stringify(x.b)}`);}
  }
});
