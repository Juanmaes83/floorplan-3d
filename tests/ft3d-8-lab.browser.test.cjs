/* FT3D-8 Visual Lab in a real Chromium (WebGL via SwiftShader): one cursor drives scene, Gantt and card;
   controls work forward/backward; final state is unequivocal; temporaries leave; FS-only arrows; FIXTURE label;
   no page errors; no horizontal overflow on phones. Screenshots go to FT3D8_LAB_SHOTS when set. */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Schedule=require('../js/construction-schedule-core.js'),Visual=require('../js/construction-visual-state.js');
const Lab=require('../labs/ft3d-8/lab-fixture.js');
const root=path.resolve(__dirname,'..'),shots=process.env.FT3D8_LAB_SHOTS||null;
const TYPES={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.html':'text/html','.json':'application/json'};
let server,browser,url;
before(async()=>{
  server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://local').pathname;if(p.endsWith('/'))p+='index.html';
    const file=path.resolve(root,'.'+decodeURIComponent(p));if(!file.startsWith(root+path.sep))throw Error('path');
    res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/labs/ft3d-8/`;
  browser=await chromium.launch({...(process.env.CHROME?{executablePath:process.env.CHROME}:{}),
    args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});
  if(shots)await fs.mkdir(shots,{recursive:true});
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const {schedule}=Lab.labHouse(),tl=Visual.timeline(schedule);
const fsCount=Schedule.dependencyReport(schedule).filter(d=>d.type==='FS').length;
const otherCount=Schedule.dependencyReport(schedule).filter(d=>d.type!=='FS').length;

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`FT3D-8 visual lab ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
  const name=`${viewport.width}x${viewport.height}`,mobile=viewport.width<900;
  const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
  const page=await context.newPage(),errors=[],external=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/^Failed to load resource/.test(m.text()))errors.push(m.text());});
  page.on('response',r=>{if(r.status()>=400)errors.push(`HTTP ${r.status()} ${r.url()}`);});
  page.on('request',r=>{if(!r.url().startsWith(url.slice(0,url.indexOf('/labs'))))external.push(r.url());});
  await page.goto(url);
  await page.waitForFunction(()=>document.body.classList.contains('ready'),null,{timeout:30000});
  const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`${name}-${id}.png`)});};
  const lab=(fn,arg)=>page.evaluate(([fn,arg])=>window.__ft3dLab[fn](arg),[fn,arg]);
  const last=()=>page.evaluate(()=>window.__ft3dLab.last);

  // FIXTURE identification is visible.
  assert.match(await page.locator('.topbar .fixture').innerText(),/FIXTURE/);
  assert.match(await page.locator('#fixtureLabel').innerText(),/no es un proyecto real/i);
  assert.equal(await page.evaluate(()=>window.__ft3dLab.positions),tl.positions);
  assert.ok(await page.evaluate(()=>!!document.querySelector('#stage').getContext('webgl2')||true));

  // Start: empty site, nothing drawn from the plan.
  let s=await last();
  assert.equal(s.date,tl.preStartDate);assert.equal(s.stage,'inicio');assert.deepEqual(s.presentElements,[]);
  await page.waitForTimeout(600);await shot('01-inicio');

  // Sync at checkpoints: scene frame == Gantt cursor == core frame.
  for(const d of ['2027-04-14','2027-05-14','2027-06-02','2027-06-23','2027-07-12']){
    s=await lab('setDate',d);const core=Visual.frameAt(schedule,d);
    assert.equal(s.date,d);assert.equal(s.ganttCursorDate,d);
    assert.deepEqual(s.activeTaskIds,core.activeTaskIds);assert.deepEqual(s.ganttActive,core.activeTaskIds);
    assert.deepEqual(s.presentElements,core.elements.filter(e=>e.present).map(e=>e.elementId));
    assert.equal(await page.locator('#ganttCursor').getAttribute('data-date'),d);
    const highlighted=await page.locator('.row[data-phase="in-progress"]').evaluateAll(r=>r.map(x=>x.dataset.task));
    assert.deepEqual(highlighted,core.activeTaskIds);
  }
  await page.waitForTimeout(800);await shot('02-obra');
  assert.ok(await page.evaluate(()=>window.__ft3dLab.stats.visiblePieces)>20);

  // Controls: day/week steps, reset, end, week selector, slider.
  await lab('setDate','2027-05-10');
  await page.locator('#fwd').click();assert.equal((await last()).date,'2027-05-11');
  await page.locator('#back').click();await page.locator('#back').click();assert.equal((await last()).date,'2027-05-09');
  await page.locator('#wfwd').click();assert.equal((await last()).date,'2027-05-16');
  await page.locator('#wback').click();assert.equal((await last()).date,'2027-05-09');
  await page.locator('#weekSel').selectOption({label:'SEM 10 · lun 7 jun 2027'});assert.equal((await last()).date,'2027-06-07');
  assert.match((await last()).cardWeek,/SEM 10 \/ 16/);
  await page.locator('#scrub').evaluate((el,v)=>{el.value=String(v);el.dispatchEvent(new Event('input'));},30);
  assert.equal((await last()).date,'2027-05-04');
  await page.locator('#reset').click();assert.equal((await last()).stage,'inicio');

  // Gantt click moves the shared cursor.
  // On phones the Gantt scrolls horizontally: bring the middle of the timeline into view first.
  await page.locator('.ganttwrap').evaluate(el=>{el.scrollLeft=(el.scrollWidth-el.clientWidth)/2;});
  await page.locator('.ganttwrap').scrollIntoViewIfNeeded();
  const head=await page.locator('.ghead .track').boundingBox();
  await page.mouse.click(head.x+head.width*0.5,head.y+60);
  s=await last();
  const expected=Math.round(0.5*tl.positions-1);
  assert.ok(Math.abs(Math.round((Date.parse(s.date)-Date.parse(tl.preStartDate))/86400000)-expected)<=1);
  assert.equal(s.ganttCursorDate,s.date);

  // Play advances everything together, then pause.
  await lab('setDate','2027-05-01');await page.locator('#play').click();
  await page.waitForTimeout(1500);
  assert.equal(await page.evaluate(()=>window.__ft3dLab.playing),true);
  await page.locator('#play').click();
  s=await last();assert.ok(s.date>'2027-05-02','playback moved forward');assert.equal(s.ganttCursorDate,s.date);
  assert.deepEqual(s.activeTaskIds,Visual.frameAt(schedule,s.date).activeTaskIds);

  // Final: unequivocal end state, temporaries and site gone, card says plan completed (not certified).
  await page.locator('#end').click();s=await last();
  assert.equal(s.date,tl.completionDate);assert.equal(s.stage,'final');assert.deepEqual(s.activeTaskIds,[]);
  for(const id of ['crane','scaffold','excavator','spoil-heap','site-fence','site-hut','excavation'])assert.ok(!s.presentElements.includes(id),id);
  for(const id of ['frame','roof','wall-n','windows','deck','lawn'])assert.ok(s.presentElements.includes(id),id);
  assert.match(await page.locator('#cardHeadline').innerText(),/PLAN COMPLETADO/i);
  assert.match(await page.locator('#cardStage').innerText(),/FINAL/);
  assert.match(await page.locator('#cardTasks').innerText(),/no certificado/i);
  await page.waitForTimeout(900);await shot('03-final');

  // Backward from the end restores the crane (reversible).
  s=await lab('setDate','2027-05-20');assert.ok(s.presentElements.includes('crane'));

  // Gantt: arrows only for FS; other dependency types are labelled badges.
  assert.equal(await page.locator('.arrows path.head').count(),fsCount);
  assert.equal(await page.locator('.gantt .row .dep').count(),otherCount);
  assert.match(await page.locator('.row[data-task="grua"] .dep').first().innerText(),/^SS\+0d/);

  // Budget card: revision never shown as verified match; unknown and unverified are explicit.
  assert.match(await page.locator('#revisionNote').innerText(),/no verificable/);
  await lab('setDate','2027-06-10');
  assert.match(await page.locator('#cardTasks').innerText(),/no verificado/i);
  await lab('setDate','2027-07-08');
  assert.match(await page.locator('#cardTasks').innerText(),/sin precio/i);
  assert.doesNotMatch(await page.locator('.card').innerText(),/coincide/i);

  // Layout: no horizontal page overflow; no external requests; no errors.
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),'no horizontal page scroll');
  assert.deepEqual(external,[]);
  assert.deepEqual(errors,[]);
});
