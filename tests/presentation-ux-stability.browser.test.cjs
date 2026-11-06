/* Presentation UX stability (owner incident video 2026-11-06, docs/qa/presentation-ux/2026-11-06 on the evidence
   branch): during a whole story the card changed size and position, its header and the play button moved, and every
   tool and stop stayed on screen while it played. Measured in the real app, every animation frame of a whole story
   (plan → section → façade → axonometric view → validated visit), with a pause in the middle and the arrival:
   - the card, its header, the play button, the slider and the caption box do not move or resize (tolerance 1 px);
     on desktop and landscape the card is also the same in the presentation's stops and in the story;
   - while it plays only the player is shown (close, previous, play/pause, next); paused and at the end the stops and
     tools come back in the card body, below the player, without moving it;
   - at the arrival «Explorar desde aquí» and «Volver a la sección» are shown inside the card, without overlaps;
   - nothing scrolls the page or the card itself (only its body), the card overlaps neither the minimap nor
     «Capas de contexto», the header names the room once inside it;
   - «Explorar desde aquí» and the way back still work; the project never changes; no page errors.
   Also: «Usar escenas sugeridas» turns on the scenes this project can show and leaves «Dibujo vivo» off, and the
   living drawing (Hybrid V2) keeps the same stable card, with and without the suggested ambience. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),three=require('./helpers/three-module.cjs');let server,url,browser;
const QA=process.env.UX_ARTIFACTS||path.join(os.tmpdir(),'presentation-ux-stability');
const TOL=1;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary','.hdr':'application/octet-stream'};
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(QA,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
async function open(t,{reduced=false,viewport}){const ctx=await browser.newContext({viewport,reducedMotion:reduced?'reduce':'no-preference'});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[],external=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push('console: '+m.text());});
 page.on('request',r=>{const u=r.url();if(!u.startsWith(url)&&!u.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/')&&!/^(data|blob):/.test(u))external.push(u);});
 page.setDefaultTimeout(300000);
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no local three');})}));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin,null,{timeout:120000});
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);return {page,errors,external};}
const settled=page=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying,null,{timeout:600000});
async function configure(page,{suggested=true,living=false,ambience=false}={}){
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 if(suggested){await page.locator('#presentationSuggestedScenes').click();
  const chosen=await page.evaluate(()=>Object.fromEntries(['presentationStoryOption','presentationSectionOption','presentationVisitOption','presentationElevationOption','presentationAxonCompact','presentationLivingDrawing','presentationLivingAmbience'].map(id=>[id,!!document.getElementById(id)?.checked])));
  for(const id of ['presentationStoryOption','presentationSectionOption','presentationVisitOption'])assert.equal(chosen[id],true,`suggested scenes turn on ${id}`);
  assert.equal(chosen.presentationLivingDrawing,false,'«Dibujo vivo» stays opt-in');assert.equal(chosen.presentationLivingAmbience,false,'the ambience stays opt-in');
  assert.match(await page.locator('#presentationSuggestedNote').textContent(),/Activadas: /);
  // The primary action is always reachable without scrolling the dialog.
  assert.ok(await page.evaluate(()=>{const d=document.querySelector('#presentationConfig').getBoundingClientRect(),b=[...document.querySelectorAll('#presentationConfig .presentation-config-actions .btn')][0].getBoundingClientRect();return b.top>=d.top&&b.bottom<=d.bottom+1;}),'«Iniciar presentación» visible');}
 if(living){await page.locator('#presentationLivingDrawing').check();if(ambience)await page.locator('#presentationLivingAmbience').check();}
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();
 // The presentation opens with a story of its own («Dibujo vivo», or the plan): wait for it first, so «settled» is
 // the end of that story and not the instant before it opens.
 if(living||(suggested&&!await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches)))await page.waitForFunction(()=>!!FloorPlanPresentation.story,null,{timeout:300000});
 if(suggested){const reduced=await page.evaluate(()=>matchMedia('(prefers-reduced-motion: reduce)').matches);
  if(reduced){await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='plan-reveal'&&!FloorPlanPresentation.story.busy,null,{timeout:300000});
   for(let i=0;i<6&&await page.evaluate(()=>!!FloorPlanPresentation.story);i++){await page.locator('#presentationStoryPlay').click();await page.waitForTimeout(500);}}}
 await settled(page);}
// In-page sampler: every animation frame, the geometry of the card and of the controls, and what the card shows.
const startSampler=page=>page.evaluate(()=>{const S=window.__ux={samples:[],on:true};const q=s=>document.querySelector(s);
 const rect=e=>{if(!e||!e.getClientRects().length||e.closest('[hidden]'))return null;const r=e.getBoundingClientRect();return [r.left,r.top,r.width,r.height].map(v=>Math.round(v*10)/10);};
 const tick=()=>{if(!S.on)return;const card=q('#presentationOverlay .presentation-card'),s=FloorPlanPresentation.story;
  const buttons=[...card.querySelectorAll('button')].filter(b=>b.getClientRects().length&&!b.closest('[hidden]')&&getComputedStyle(b).visibility!=='hidden');
  S.samples.push({story:s?{kind:s.kind,P:s.P,local:s.local,playing:!!s.playing}:null,ui:q('#presentationOverlay').dataset.story||null,title:card.querySelector('h2').textContent,
   card:rect(card),head:rect(card.querySelector('.presentation-card-top')),play:rect(q('#presentationStoryPlay')),slider:rect(q('#presentationStorySlider')),caption:rect(q('#presentationStoryCaption')),
   cardScroll:card.scrollHeight>card.clientHeight+1||card.scrollTop>0,docScroll:scrollX||scrollY,ids:buttons.map(b=>b.id||b.closest('.presentation-stops')&&'stop'||b.textContent.trim()),
   out:buttons.filter(b=>{if(b.closest('.presentation-card-body'))return false;const r=b.getBoundingClientRect(),c=card.getBoundingClientRect();return r.left<c.left-1||r.right>c.right+1||r.top<c.top-1||r.bottom>c.bottom+1;}).map(b=>b.id)});
  requestAnimationFrame(tick);};requestAnimationFrame(tick);});
const stopSampler=page=>page.evaluate(()=>{window.__ux.on=false;return window.__ux.samples;});
const spanOf=(xs,f)=>{const v=xs.map(f).filter(x=>x!=null);if(!v.length)return 0;return Math.max(...v)-Math.min(...v);};
function assertStable(samples,label){
 const s=samples.filter(x=>x.story);assert.ok(s.length>=10,`${label}: frames sampled (${s.length})`);
 for(const [k,name] of [['card','card'],['head','header'],['play','play button'],['slider','slider'],['caption','caption box']])
  for(const i of [0,1,2,3]){const span=spanOf(s,x=>x[k]?.[i]);assert.ok(span<=TOL,`${label}: ${name} ${['left','top','width','height'][i]} moves ${span}px (≤${TOL})`);}
 assert.equal(s.filter(x=>x.cardScroll).length,0,`${label}: the card itself never scrolls (only its body)`);
 assert.equal(s.filter(x=>x.docScroll).length,0,`${label}: the page never scrolls`);
 assert.deepEqual([...new Set(s.flatMap(x=>x.out))],[],`${label}: header and player controls stay inside the card`);
 // The header names the view on screen: a section, façade or axonometry under way is not «Vista general».
 const names={'section-open':'Sección visual','elevation-open':'Fachada visual','axon-open':'Axonometría'};
 for(const [kind,name] of Object.entries(names)){const t=[...new Set(s.filter(x=>x.story.kind===kind&&x.story.local>.05).map(x=>x.title))];if(t.length)assert.deepEqual(t,[name],`${label}: header during ${kind}`);}
 const playing=s.filter(x=>x.story.playing);
 const extra=[...new Set(playing.flatMap(x=>x.ids))].filter(id=>!['presentationClose','presentationStoryPlan','presentationStoryPlay','presentationStoryNext'].includes(id));
 assert.deepEqual(extra,[],`${label}: while playing only the player is shown`);
 for(const x of s)assert.equal(x.ui,x.story.playing?'playing':x.story.P>=1?'end':'paused',`${label}: UI state follows the story`);
 return s;}
const overlaps=page=>page.evaluate(()=>{const r=e=>e&&e.getClientRects().length&&!e.closest('[hidden]')?e.getBoundingClientRect():null,hit=(a,b)=>!!a&&!!b&&a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
 const card=r(document.querySelector('#presentationOverlay .presentation-card'));
 return {minimap:hit(card,r(document.querySelector('#presentationMinimap'))),layers:hit(card,r(document.querySelector('#territoryLayers'))),
  card:card&&[card.left,card.top,card.right,card.bottom].map(Math.round),viewport:[innerWidth,innerHeight]};});
const cardRect=page=>page.evaluate(()=>{const r=document.querySelector('#presentationOverlay .presentation-card').getBoundingClientRect();return [r.left,r.top,r.width,r.height].map(v=>Math.round(v*10)/10);});

for(const {viewport,reduced} of [{viewport:{width:1440,height:900}},{viewport:{width:1280,height:800}},{viewport:{width:390,height:844}},{viewport:{width:844,height:390}},{viewport:{width:1280,height:800},reduced:true},{viewport:{width:390,height:844},reduced:true}])
test(`stable card through a whole story ${viewport.width}x${viewport.height}${reduced?' reduced motion':''}`,{timeout:3600000},async t=>{
 const size=`${viewport.width}x${viewport.height}${reduced?'-rm':''}`,{page,errors,external}=await open(t,{viewport,reduced});
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await configure(page);const browse=await cardRect(page);let o=await overlaps(page);
 assert.equal(o.minimap,false,`${size}: card and minimap apart`);assert.equal(o.layers,false,`${size}: card and «Capas de contexto» apart`);
 assert.ok(o.card[0]>=0&&o.card[1]>=0&&o.card[2]<=o.viewport[0]&&o.card[3]<=o.viewport[1],`${size}: card inside the viewport ${o.card}`);
 await page.screenshot({path:path.join(QA,`${size}-1-overview.png`)});
 await startSampler(page);
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());
 await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1,null,{timeout:120000});
 if(!reduced){
  await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.3,null,{timeout:900000});await page.screenshot({path:path.join(QA,`${size}-2-playing.png`)});
  await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing);
  await page.waitForTimeout(800);await page.screenshot({path:path.join(QA,`${size}-3-paused.png`)});
  assert.ok(await page.locator('#presentationOverlay .presentation-stops button').first().isVisible(),`${size}: paused, the stops are back`);
  await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
 }else{
  for(let i=0;i<40&&await page.evaluate(()=>{const s=FloorPlanPresentation.story;return !!s&&!(s.P>=1&&!s.playing);});i++){
   await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(!s.playing&&!s.busy);});await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForTimeout(300);}
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
 }
 await page.waitForTimeout(500);await page.screenshot({path:path.join(QA,`${size}-4-arrival.png`)});
 const samples=assertStable(await stopSampler(page),size);
 const storyRect=samples.at(-1).card;
 if(viewport.width>=700)for(const i of [0,1,2,3])assert.ok(Math.abs(storyRect[i]-browse[i])<=TOL,`${size}: the same card in stops and story (${browse} vs ${storyRect})`);
 // Arrival: the hand-over buttons, inside the card, apart from each other and from the transport row; the header
 // names the room.
 const arrival=await page.evaluate(()=>{const s=FloorPlanPresentation.story,r=id=>{const e=document.getElementById(id);return e&&e.getClientRects().length&&!e.closest('[hidden]')?e.getBoundingClientRect():null;};
  const c=document.querySelector('#presentationOverlay .presentation-card').getBoundingClientRect(),w=r('presentationVisitWalk'),b=r('presentationVisitSection'),p=r('presentationStoryPlay');
  const inside=x=>!!x&&x.left>=c.left-1&&x.right<=c.right+1&&x.top>=c.top-1&&x.bottom<=c.bottom+1,hit=(a,b)=>a.left<b.right-1&&b.left<a.right-1&&a.top<b.bottom-1&&b.top<a.bottom-1;
  return {kind:s?.kind,P:s?.P,walk:!!w,section:!!b,inside:inside(w)&&inside(b),overlap:!!w&&!!b&&(hit(w,b)||hit(w,p)||hit(b,p)),title:document.querySelector('#presentationOverlay .presentation-card h2').textContent,room:FloorPlanPresentation.plan.stops.find(x=>x.kind==='room')?.roomId};});
 assert.equal(arrival.kind,'room-visit',size);assert.equal(arrival.P,1,size);assert.ok(arrival.walk&&arrival.section,`${size}: «Explorar desde aquí» and «Volver a la sección»`);
 assert.ok(arrival.inside,`${size}: arrival buttons inside the card`);assert.equal(arrival.overlap,false,`${size}: arrival buttons do not overlap`);
 assert.notEqual(arrival.title,'Vista general',`${size}: the header names the room at the arrival`);
 o=await overlaps(page);assert.equal(o.minimap,false,`${size}: arrival, card and minimap apart`);assert.equal(o.layers,false,`${size}: arrival, card and «Capas de contexto» apart`);
 // «Explorar desde aquí» and back: Section → visit keeps working with the new card.
 await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());assert.equal(await page.locator('#presentationWalkBar').isVisible(),true);
 await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled(page);
 assert.ok(!await page.evaluate(()=>'story' in document.querySelector('#presentationOverlay').dataset),`${size}: no story state left after the story`);
 if(viewport.width>=700){const back=await cardRect(page);for(const i of [0,1,2,3])assert.ok(Math.abs(back[i]-browse[i])<=TOL,`${size}: the same card back at the stops`);}
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,`${size}: the project never changes`);
 assert.deepEqual(errors,[],size);assert.deepEqual(external,[],`${size}: no requests outside the app`);
 await fs.writeFile(path.join(QA,`${size}-samples.json`),JSON.stringify(samples.filter((_,i)=>i%Math.max(1,Math.ceil(samples.length/600))===0)));
});

// Hybrid V2 «Dibujo vivo» (approved, PR #174), off by default, is the first option of «Historia y escenas» and the first
// button of «Escenas». When chosen, its scene keeps the same stable card while the graphite drawing comes to life by
// patches; pause, back to the drawing, play again and repeat never move the card; at the end the presentation goes on
// (the whole story with the section and the interior visit), with and without the suggested ambience (whose
// «no forma parte del proyecto» caption stays readable in the fixed caption box).
for(const {viewport,ambience,thenStory} of [{viewport:{width:1280,height:800},ambience:false,thenStory:true},{viewport:{width:390,height:844},ambience:true,thenStory:false}])
test(`«Dibujo vivo» in the new panel ${viewport.width}x${viewport.height}${ambience?' with ambience':''}${thenStory?' then section and visit':''}`,{timeout:3600000},async t=>{
 const size=`${viewport.width}x${viewport.height}-living${ambience?'-ambience':''}`,{page,errors}=await open(t,{viewport});
 const project=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 // Configuration: «Dibujo vivo» in plain sight, first in its group, off; its ambience a separate, off sub-option.
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 const cfg=await page.evaluate(()=>{const box=document.querySelector('#presentationLivingOptionBox'),head=document.querySelector('.presentation-scenes-head'),d=document.querySelector('#presentationConfig');
  const options=[...d.querySelectorAll('.presentation-story-option')];return {first:options[0]?.id,afterHead:head?.nextElementSibling===box,living:document.querySelector('#presentationLivingDrawing').checked,
   ambience:document.querySelector('#presentationLivingAmbience').checked,ambienceDisabled:document.querySelector('#presentationLivingAmbience').disabled,label:box.querySelector('label').textContent};});
 assert.equal(cfg.first,'presentationLivingOptionBox',`${size}: «Dibujo vivo» is the first scene option`);assert.ok(cfg.afterHead,`${size}: right under «Historia y escenas»`);
 assert.equal(cfg.living,false,`${size}: off by default`);assert.equal(cfg.ambience,false,`${size}: ambience off by default`);assert.equal(cfg.ambienceDisabled,true,`${size}: ambience only with the living drawing`);
 assert.match(cfg.label,/Dibujo vivo/);await page.locator('#presentationLivingOptionBox').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(QA,`${size}-0-config.png`)});
 await page.locator('#presentationConfig').evaluate(d=>d.close());await page.waitForFunction(()=>!document.querySelector('#presentationConfig[open]'));
 await configure(page,{suggested:thenStory,living:true,ambience});const browse=await cardRect(page);
 assert.equal(await page.evaluate(()=>document.querySelector('#presentationScenes button:not([hidden])')?.id),'presentationLivingPlay',`${size}: «Ver dibujo vivo» leads the scenes`);
 assert.equal(await page.locator('#presentationLivingPlay').isVisible(),true);
 await startSampler(page);
 await page.locator('#presentationLivingPlay').click();
 await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing',null,{timeout:120000});
 // Diagnostics: if the story panel is ever hidden while this scene should stay open, keep the call path that did it.
 await page.evaluate(()=>{const p=document.getElementById('presentationStory'),d=Object.getOwnPropertyDescriptor(HTMLElement.prototype,'hidden');window.__storyHidden=[];
  Object.defineProperty(p,'hidden',{configurable:true,get(){return d.get.call(this);},set(v){if(v&&!d.get.call(this))window.__storyHidden.push({t:Math.round(performance.now()),stack:String(new Error().stack).split('\n').slice(1,9).join(' | ')});d.set.call(this,v);}});});
 // Pause as soon as the scene is under way, then take it to the middle with the slider (what a person does). Waiting
 // for the middle while it plays raced the scene's own end on slow CI renderers (SwiftShader, 2 cores): between two
 // polls the 30 s scene could reach its end and close, which is the expected end of a played scene, not a defect.
 await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.03,null,{timeout:900000});
 await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing);
 await page.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value=String(Math.round(+s.max*.5));s.dispatchEvent(new Event('input',{bubbles:true}));});
 await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return s&&!s.busy&&s.P>0.4&&s.P<0.6;},null,{timeout:300000});
 await page.waitForTimeout(500);
 {const s=await page.evaluate(()=>({story:FloorPlanPresentation.story,current:FloorPlanPresentation.current?.kind,hidden:window.__storyHidden}));
  assert.ok(s.story&&s.story.kind==='living-drawing'&&s.story.P<1,`${size}: paused, the living drawing stays open ${JSON.stringify(s)}`);}
 const mid=await page.evaluate(()=>({info:View3D.presentationLivingDrawingInfo,caption:document.querySelector('#presentationStoryCaption').textContent}));
 if(ambience)assert.match(mid.caption,/no forma parte del proyecto/,`${size}: the ambience label stays in the caption`);
 await page.screenshot({path:path.join(QA,`${size}-1-paused.png`)});
 // Back to the drawing, play again, pause; then forward with the slider: the card never moves.
 await page.locator('#presentationStoryPlan').click();await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return s&&s.P===0&&!s.playing&&!s.busy;});
 await page.screenshot({path:path.join(QA,`${size}-2-back-to-drawing.png`)});
 await page.locator('#presentationStoryPlay').click();await page.waitForFunction(()=>(FloorPlanPresentation.story?.P||0)>0.15,null,{timeout:900000});
 await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing);
 await page.locator('#presentationStorySlider').evaluate(e=>{e.value='80';e.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>Math.abs((FloorPlanPresentation.story?.P||0)-.8)<.02&&!FloorPlanPresentation.story.busy);
 await page.locator('#presentationStoryPlay').click();
 await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
 // Played to its end with the play button, the scene hands over to the presentation by itself, as on master: the
 // overview again, «Ver dibujo vivo» available to repeat it, no ambience left.
 await settled(page);await page.screenshot({path:path.join(QA,`${size}-3-end.png`)});
 const samples=await stopSampler(page);assertStable(samples,size);
 if(viewport.width>=700){const last=samples.filter(x=>x.story).at(-1).card;for(const i of [0,1,2,3])assert.ok(Math.abs(last[i]-browse[i])<=TOL,`${size}: the same card in stops and story`);}
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.current?.kind),'overview',`${size}: back on the overview`);
 assert.equal(await page.evaluate(()=>!!View3D.presentationAmbienceInfo?.active),false,`${size}: no ambience left`);
 // Repeat: «Ver dibujo vivo» plays it again from the drawing; pause and resume to its end.
 await page.locator('#presentationLivingPlay').click();await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing'&&(FloorPlanPresentation.story.P||0)>0.05,null,{timeout:900000});
 await page.evaluate(()=>document.querySelector('#presentationStoryPlay').click());await page.waitForFunction(()=>!FloorPlanPresentation.story?.playing);
 await page.locator('#presentationStoryPlay').click();await settled(page);
 if(thenStory){
  // The presentation goes on with the whole story: plan → section → façade → axonometric view → interior visit.
  await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1,null,{timeout:120000});
  await page.waitForFunction(()=>{const s=FloorPlanPresentation.story;return !s||(s.P>=1&&!s.playing&&!s.busy);},null,{timeout:900000});
  const arrival=await page.evaluate(()=>({kind:FloorPlanPresentation.story?.kind,walk:!!document.querySelector('#presentationVisitWalk:not([hidden])')}));
  assert.equal(arrival.kind,'room-visit',`${size}: the visit after the living drawing`);assert.ok(arrival.walk,`${size}: «Explorar desde aquí»`);
  await page.screenshot({path:path.join(QA,`${size}-4-visit.png`)});
  await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled(page);
 }
 await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active);
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),project,`${size}: the project never changes`);
 assert.deepEqual(errors,[],size);
});
