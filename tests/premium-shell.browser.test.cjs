// Premium UX cut A (docs/product/premium-ux-design-2026-10-20.md §6) at 1440×900, 390×844 and 844×390:
// - capability inventory: every control of the header and of the left column recorded before the cut
//   (tests/fixtures/capability-inventory.json) still exists and can be reached by a person: visible after opening
//   its drawer, tab or menu and scrolling it into view, and not covered by anything else;
// - one dominant action per state, drawn with the action role: «Nueva estancia» in an empty project, «Presentar mi
//   vivienda» when there is something to present, none while the building distribution is pending (the entry then
//   says why); «Subir plano» stays visible as a secondary button;
// - selection never uses the action colour; text roles keep WCAG AA;
// - phones: «Crear y amueblar», 2D/3D and «Propiedades» are inside the viewport without scrolling the header;
// - Spanish labels («Atajos de teclado», «Vaciar distribución»), visible keyboard focus, no horizontal page
//   scroll and no console errors.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),shots=process.env.PREMIUM_SHOTS||null,inventory=require('./fixtures/capability-inventory.json').controls;
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),S=require('./fixtures/stair-conflict-building.cjs');
let server,browser,url,tmp;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});if(shots)await fs.mkdir(shots,{recursive:true});
 tmp=await fs.mkdtemp(path.join(os.tmpdir(),'premium-'));const {entries}=await B.packageEntries(S.build().building,()=>null,T.imageInfo);
 await fs.writeFile(path.join(tmp,'duplex.zip'),Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));if(tmp)await fs.rm(tmp,{recursive:true,force:true});});

// Colour helpers evaluated in the page: rgb of a computed colour, relative luminance and WCAG contrast.
const COLOR_FNS=`const rgb=c=>{const m=String(c).match(/[\\d.]+/g)||[];return m.slice(0,3).map(Number).join(',')+(m[3]!==undefined&&+m[3]<1?'@'+m[3]:'');};
 const lum=c=>{const [r,g,b]=String(c).match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.03928?v/12.92:((v+.055)/1.055)**2.4;});return .2126*r+.7152*g+.0722*b;};
 const contrast=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05);};
 const action=(()=>{const p=document.createElement('i');p.style.color='var(--action)';document.body.append(p);const c=getComputedStyle(p).color;p.remove();return rgb(c);})();`;

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`premium shell ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const mobile=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`${name}-${id}.png`)});};
 const filledWithAction=()=>page.evaluate(new Function(`${COLOR_FNS} return [...document.querySelectorAll('header button,header summary,aside button,#fab button')].filter(e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&rgb(getComputedStyle(e).backgroundColor)===action).map(e=>e.id||e.textContent.trim());`));

 // 1. Capability inventory: nothing removed, everything reachable.
 const reach=async(c,in3d)=>page.evaluate(([c,mobile])=>{
  const e=c.id?document.getElementById(c.id):document.querySelector(c.selector);if(!e)return {exists:false};
  if(e.closest('[hidden]'))return {exists:true,state:'hidden-by-state'};
  if(c.scope==='aside.lib'){if(mobile)drawer('lib',true);const tab=e.closest('#paletteBuild')?'build':e.closest('#paletteFurnish')?'furnish':null;if(tab&&FloorPlanBuildPalette.tab!==tab)FloorPlanBuildPalette.select(tab);}
  for(let d=e.parentElement;d;d=d.parentElement)if(d.tagName==='DETAILS')d.open=true;
  return {exists:true,state:'pending'};},[c,mobile]).then(async r=>{
   if(r.state!=='pending')return r;await page.waitForTimeout(mobile?380:60);
   return page.evaluate(c=>{const e=c.id?document.getElementById(c.id):document.querySelector(c.selector);e.scrollIntoView({block:'nearest',inline:'nearest'});const b=e.getBoundingClientRect();
    if(b.width<2||b.height<2)return {exists:true,state:'zero-size'};
    const x=Math.min(innerWidth-1,Math.max(0,b.left+b.width/2)),y=Math.min(innerHeight-1,Math.max(0,b.top+b.height/2)),hit=document.elementFromPoint(x,y);
    const inView=b.right>0&&b.left<innerWidth&&b.bottom>0&&b.top<innerHeight;
    return {exists:true,state:inView&&hit&&(hit===e||e.contains(hit)||hit.contains(e)||hit.closest('label')?.contains(e))?'reachable':'covered',by:hit?.id||hit?.className||hit?.tagName};},c);});
 const close=()=>page.evaluate(()=>{for(const d of document.querySelectorAll('details[open]'))d.open=false;drawer(null);});
 const problems=[];
 for(const c of inventory.filter(c=>!c.only3d)){const r=await reach(c);if(!r.exists||!['reachable','hidden-by-state'].includes(r.state))problems.push(`${c.id||c.selector}: ${r.exists?r.state+' by '+r.by:'missing'}`);await close();await page.waitForTimeout(mobile?350:20);}
 if(process.env.THREE_LOCAL_DIR){await page.evaluate(()=>setView('3d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!document.body.classList.contains('busy'),null,{timeout:60000});
  for(const c of inventory.filter(c=>c.only3d)){const r=await reach(c);if(!r.exists||!['reachable','hidden-by-state'].includes(r.state))problems.push(`3D ${c.id||c.selector}: ${r.exists?r.state+' by '+r.by:'missing'}`);await close();await page.waitForTimeout(mobile?350:20);}
  await page.evaluate(()=>setView('2d'));await page.waitForFunction(()=>FloorPlanApp.viewMode==='2d'&&!document.body.classList.contains('busy'),null,{timeout:60000});}
 else for(const c of inventory.filter(c=>c.only3d))if(!await page.evaluate(c=>!!(c.id?document.getElementById(c.id):document.querySelector(c.selector)),c))problems.push(`3D ${c.id||c.selector}: missing`);
 assert.deepEqual(problems,[],'every control recorded before the cut exists and is reachable');

 // 2. Phones: the essential controls are in the viewport without scrolling the header.
 await close();await page.waitForTimeout(400);
 if(mobile){
  const dock=await page.evaluate(()=>{const h=document.querySelector('header');h.scrollLeft=0;return ['#tgLib','#tgPanel','[data-view="2d"]','[data-view="3d"]'].map(s=>{const e=document.querySelector(s),b=e.getBoundingClientRect(),hit=document.elementFromPoint(b.left+b.width/2,b.top+b.height/2);
   return {s,inside:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,hit:!!hit&&(hit===e||e.contains(hit)),h:Math.round(b.height)};});});
  for(const d of dock){assert.ok(d.inside&&d.hit,`${d.s} visible without scrolling the header`);assert.ok(d.h>=40,`${d.s} touch height ${d.h}`);}
  await page.locator('#tgLib').tap();await page.waitForTimeout(400);assert.equal(await page.evaluate(()=>document.querySelector('aside.lib').classList.contains('open')),true,'the bar opens the palette');
  await page.locator('#tgLib').tap();await page.waitForTimeout(400);
 }
 await shot('01-editor');

 // 3. Hierarchy with something to present: «Presentar mi vivienda» is the only action-filled control.
 assert.deepEqual(await filledWithAction(),['presentationBtn'],'one dominant action in the editor with rooms');
 assert.notEqual(await page.evaluate(new Function(`${COLOR_FNS} return rgb(getComputedStyle(document.querySelector('#uploadPlanBtn')).backgroundColor);`)),await page.evaluate(new Function(`${COLOR_FNS} return action;`)),'«Subir plano» is secondary');
 assert.equal(await page.locator('#uploadPlanBtn').count(),1);

 // 4. Selection is not drawn with the action colour, and text roles keep AA.
 const roles=await page.evaluate(new Function(`${COLOR_FNS}
  const bg=s=>getComputedStyle(document.querySelector(s)).backgroundColor,fg=s=>getComputedStyle(document.querySelector(s)).color;
  const panel=getComputedStyle(document.querySelector('aside.right')).backgroundColor;
  return {pill:rgb(bg('#viewSeg .pill')),tool:rgb(bg('header [data-tool="select"]')),chip:rgb(bg('#tgPanel')),action,
   cta:contrast(fg('#presentationBtn'),bg('#presentationBtn')),tool_contrast:contrast(fg('header [data-tool="select"]'),bg('header [data-tool="select"]')),
   help:contrast(getComputedStyle(document.querySelector('.palette-help')).color,getComputedStyle(document.querySelector('aside.lib')).backgroundColor),
   muted:(()=>{const i=document.createElement('i');i.style.color='var(--ink-muted)';document.body.append(i);const c=getComputedStyle(i).color;i.remove();return contrast(c,panel);})()};`));
 for(const k of ['pill','tool','chip'])assert.notEqual(roles[k],roles.action,`${k}: selection must not use the action colour`);
 for(const k of ['cta','tool_contrast','help','muted'])assert.ok(roles[k]>=4.5,`${k} contrast ${roles[k].toFixed(2)} ≥ 4.5`);

 // 5. Spanish labels and visible keyboard focus.
 const texts=await page.evaluate(()=>({keys:[...document.querySelectorAll('#panel summary')].map(s=>s.textContent.trim()),clear:document.querySelector('#clearAll').textContent.trim()}));
 assert.ok(texts.keys.includes('Atajos de teclado'),'«Atajos de teclado» translated');assert.ok(!texts.keys.includes('Keyboard Shortcuts'));
 assert.equal(texts.clear,'Vaciar distribución','one name for the same action');
 if(!mobile){await page.locator('#undo').focus();await page.keyboard.press('Tab');const ring=await page.evaluate(()=>{const s=getComputedStyle(document.activeElement);return {w:s.outlineWidth,st:s.outlineStyle};});assert.equal(ring.st,'solid');assert.equal(ring.w,'3px','visible keyboard focus ring');}

 // 6. Empty project: «Nueva estancia» is the action; the presentation entry is not dominant.
 await page.evaluate(()=>drawer(null));await page.waitForTimeout(350);
 await page.evaluate(()=>document.querySelector('#newProjectBtn').click());await page.fill('#newProjectName','Vacío');await page.evaluate(()=>document.querySelector('#newProjectBlank').click());await page.locator('#roomDesignCancel').first().click();
 if(mobile){await page.evaluate(()=>drawer('lib',true));await page.waitForTimeout(400);}
 assert.equal(await page.evaluate(()=>FloorPlanBuildPalette.tab),'build');
 assert.deepEqual(await filledWithAction(),['paletteNewRoom'],'empty project: the next step is «Nueva estancia»');
 await shot('02-empty');await page.evaluate(()=>drawer(null));await page.waitForTimeout(350);

 // 7. A building with a pending distribution: no dominant presentation entry, and it says why.
 await page.locator('#uploadIn').setInputFiles(path.join(tmp,'duplex.zip'));await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>document.body.classList.contains('distribution-pending')),true);
 assert.ok(!(await filledWithAction()).includes('presentationBtn'),'pending distribution: presentation is not the dominant action');
 assert.match(await page.locator('#presentationBtn').getAttribute('aria-description'),/Presentación bloqueada/);
 assert.match(await page.evaluate(()=>getComputedStyle(document.querySelector('#presentationBtn'),'::after').content),/pendiente/);
 await shot('03-pending');

 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false,'no horizontal page scroll');
 assert.deepEqual(errors,[]);
});
