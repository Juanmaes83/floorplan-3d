// Stair void overlap (docs/qa/multilevel-first-cut.md §5) at 1440×900, 390×844 and 844×390: imports the synthetic
// two-level fixture ZIP from the UI and checks, on screen, that the stair label stays inside the stair footprint and
// that room labels, dimensions and furniture stay clear of it on both levels, while the stair is still drawn on both
// and over the furniture layer (a real collision would stay visible). STAIR_SHOTS sets where captures and the measured
// geometry go; captures are written before the assertions so a failing run still leaves evidence.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),F=require('./fixtures/building-fixture.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.STAIR_SHOTS||path.join(root,'docs/qa/artifacts/multilevel/stair-overlap');
let server,browser,url,zipFile;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.wasm')?'application/wasm':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});await fs.mkdir(shots,{recursive:true});
 const fx=F.build(),{entries}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo);
 zipFile=path.join(await fs.mkdtemp(path.join(os.tmpdir(),'stair-overlap-')),'edificio-fixture.zip');await fs.writeFile(zipFile,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

const overlap=(a,b,pad=0)=>a.left<b.right+pad&&b.left<a.right+pad&&a.top<b.bottom+pad&&b.top<a.bottom+pad;
const inside=(a,b,pad=1)=>a.left>=b.left-pad&&a.right<=b.right+pad&&a.top>=b.top-pad&&a.bottom<=b.bottom+pad;
// Screen rectangles (CSS px) of everything that can collide with the stair on the active level.
const measure=(page,role,furnitureId)=>page.evaluate(({role,furnitureId})=>{
 const r=e=>{const b=e.getBoundingClientRect();return {left:b.left,top:b.top,right:b.right,bottom:b.bottom};};
 const stair=document.querySelector(`#gStairs .level-stair-${role}`);
 return {stair:stair&&r(stair.querySelector('.level-stair-outline')),stairLabel:stair&&{text:stair.querySelector('.level-stair-label').textContent,...r(stair.querySelector('.level-stair-label'))},
  roomLabels:[...document.querySelectorAll('#gLabels text')].map(e=>({text:e.textContent,...r(e)})),dims:[...document.querySelectorAll('#gDims text')].map(e=>({text:e.textContent,...r(e)})),
  furniture:(e=>e&&r(e))(document.querySelector(`#gFurn [data-fid="${furnitureId}"]`)),levelBar:r(document.querySelector('#levelBar')),viewport:{width:innerWidth,height:innerHeight},
  stairsAboveFurniture:!!(document.querySelector('#gFurn').compareDocumentPosition(document.querySelector('#gStairs'))&Node.DOCUMENT_POSITION_FOLLOWING)};
},{role,furnitureId});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`stair void and labels do not overlap ${viewport.width}x${viewport.height}`,{timeout:300000},async t=>{
 const mobile=viewport.width<1000,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push('pageerror: '+e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push('console: '+m.text());});
 await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanBuildingUI);await require('./editor-fixture.cjs')(page);
 await page.locator('#uploadIn').setInputFiles(zipFile);await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 const levelButton=n=>page.locator('#levelBar [data-level]').nth(n),capture=async(level,role,furnitureId)=>{
  await (mobile?levelButton(level).tap():levelButton(level).click());await page.waitForFunction(o=>FloorPlanBuildingUI.context.order===o,level);
  if(mobile)await page.evaluate(()=>{if(document.querySelector('aside.right')?.classList.contains('open'))document.querySelector('#tgPanel').click();});
  await page.evaluate(()=>document.querySelector('#fit').click());await page.locator('#toast:not(.show)').waitFor({state:'attached'});await page.waitForTimeout(600);
  const step=role==='to'?'upper':'lower',m=await measure(page,role,furnitureId);
  await page.screenshot({path:path.join(shots,`${name}-${step}.png`)});await fs.writeFile(path.join(shots,`${name}-${step}.json`),JSON.stringify(m,null,1));return m;};

 const cases=[[1,'to','obj_fixture-bed','Hueco de escalera'],[0,'from','obj_fixture-sofa','Sube']],measured=[];
 for(const [level,role,furnitureId] of cases)measured.push(await capture(level,role,furnitureId));
 for(const [i,[level,,,text]] of cases.entries()){
  const m=measured[i];
  assert.ok(m.stair,`stair drawn on level ${level}`);assert.equal(m.stairLabel.text,text);assert.ok(m.furniture,'furniture drawn');
  assert.ok(m.stairsAboveFurniture,'stair layer drawn over furniture, so a real collision stays visible');
  assert.ok(inside(m.stairLabel,m.stair),`«${text}» inside the stair footprint`);
  for(const l of [...m.roomLabels,...m.dims])assert.ok(!overlap(l,m.stair,2),`«${l.text}» clear of the stair (level ${level})`);
  for(const l of m.roomLabels)assert.ok(!overlap(l,m.stairLabel,2),`«${l.text}» clear of «${text}»`);
  for(const l of m.roomLabels)assert.ok(!overlap(l,m.furniture,2),`«${l.text}» clear of the furniture (level ${level})`);
  assert.ok(!overlap(m.furniture,m.stair),`furniture clear of the stair (level ${level})`);
  assert.ok(m.levelBar.right<=m.viewport.width&&m.levelBar.bottom<=m.viewport.height&&m.levelBar.right>m.levelBar.left,'level selector visible');
 }
 // Display only: the stored label anchors travel unchanged through import.
 const stored=await page.evaluate(()=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.find(e=>e.kind==='building').building.levels.map(l=>l.project.rooms.map(r=>r.labelAt)));
 assert.deepEqual(stored,F.build().building.levels.map(l=>l.project.rooms.map(r=>r.labelAt)));
 assert.deepEqual(errors,[]);
});
