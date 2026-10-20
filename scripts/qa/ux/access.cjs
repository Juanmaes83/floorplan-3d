/* Access to properties and to the creation tools, measured as a person would do it on the example project:
   for a room, a piece of furniture and a door, the actions (taps/clicks) from the plain editor until the
   properties of that element are visible and editable, and whether a mode change was needed. Also captures the
   left column (library/palette) and the creation entry points that are visible without scrolling.
   Usage: node scripts/qa/ux/access.cjs <checkout> <outdir> [1440x900 390x844 844x390] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844','844x390']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const commit=(await require('node:util').promisify(require('node:child_process').execFile)('git',['-C',root,'rev-parse','HEAD'])).stdout.trim();
 const report={commit,browser:browser.version(),viewports:[]};
 for(const [w,h] of VPS){
  const narrow=w<=1100,ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage(),errors=[],name=`${w}x${h}`;
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(url);await require(path.join(root,'tests/editor-fixture.cjs'))(page);await page.evaluate(()=>{drawer(null);});await page.waitForTimeout(500);
  const tap=(x,y)=>narrow?page.touchscreen.tap(x,y):page.mouse.click(x,y);
  const at=(kind,id)=>page.evaluate(([kind,id])=>{const p=FloorPlanApp.project;let pt;
   if(kind==='room')pt=p.rooms.find(r=>r.id===id).labelAt;else if(kind==='furniture'){const o=p.objects.find(o=>o.id===id);pt=o.position;}
   else{const o=p.openings.find(o=>o.id===id),wl=p.walls.find(x=>x.id===o.wallId),L=Math.hypot(wl.end.x-wl.start.x,wl.end.y-wl.start.y),t=(o.offsetMm+o.widthMm/2)/L;pt={x:wl.start.x+(wl.end.x-wl.start.x)*t,y:wl.start.y+(wl.end.y-wl.start.y)*t};}
   const m=new DOMPoint(pt.x,pt.y).matrixTransform(document.querySelector('#plan').getScreenCTM());return {x:m.x,y:m.y};},[kind,id]);
  // Properties are «visible and editable» when the right column is on screen and shows a field for the element.
  const editable=field=>page.evaluate(f=>{const a=document.querySelector('aside.right'),r=a.getBoundingClientRect(),e=document.querySelector(f);if(!e)return false;const b=e.getBoundingClientRect();
   return r.width>40&&r.right>4&&r.left<innerWidth-4&&!document.querySelector('.app').classList.contains('hide-panel')&&b.width>0&&b.bottom>0&&b.top<innerHeight&&b.left<innerWidth;},field);
  const ids=await page.evaluate(()=>{const p=FloorPlanApp.project;return {room:'rom_child',furniture:p.objects.find(o=>o.roomId==='rom_child')?.id||p.objects[0].id,door:'opn_door-0'};});
  const result={viewport:name,access:{}};
  for(const [kind,id,field] of [['room',ids.room,'#rName'],['furniture',ids.furniture,'#fW'],['opening',ids.door,'#opening-kind']]){
   await page.evaluate(()=>{select?.(null);drawer(null);});await page.waitForTimeout(400);
   const p=await at(kind,id);let actions=1;await tap(p.x,p.y);await page.waitForTimeout(500);
   let sel=await page.evaluate(()=>ui.sel&&{...ui.sel});const hit=sel?.id===id;
   let ok=await editable(field),extra=null;
   if(!ok&&narrow&&await page.locator('#fab [data-a=prop]').isVisible()){await page.locator('#fab [data-a=prop]').tap();actions++;extra='«Propiedades» en la barra inferior';await page.waitForTimeout(500);ok=await editable(field);}
   result.access[kind]={id,hit,selected:sel,actions,extra,editable:ok};
   await page.screenshot({path:path.join(out,`${name}-access-${kind}.png`)});
  }
  // Left column: what a person sees to create (library open).
  await page.evaluate(()=>{select?.(null);drawer('lib',true);});await page.waitForTimeout(500);
  result.leftColumn=await page.evaluate(()=>{const a=document.querySelector('aside.lib'),r=a.getBoundingClientRect(),vis=[...a.querySelectorAll('button,input,select,[role=tab]')].filter(e=>{const b=e.getBoundingClientRect();return b.width>0&&b.top<innerHeight&&b.bottom>r.top;}).map(e=>(e.getAttribute('aria-label')||e.textContent||e.placeholder||'').trim()).filter(Boolean);
   return {width:Math.round(r.width),visibleControls:vis.slice(0,40),count:vis.length,creationEntries:['#newRoomBtn','#traceBtn','#levelsBtn'].map(s=>{const e=document.querySelector(s),b=e?.getBoundingClientRect();return {id:s,visible:!!b&&b.width>0&&b.top<innerHeight&&b.bottom>0,inLeftColumn:!!e?.closest('aside.lib')};})};});
  await page.screenshot({path:path.join(out,`${name}-left-column.png`)});
  result.errors=errors;report.viewports.push(result);await ctx.close();
 }
 await fs.writeFile(path.join(out,'access.json'),JSON.stringify(report,null,1));
 await browser.close();server.close();console.log(JSON.stringify(report.viewports.map(v=>({vp:v.viewport,access:Object.fromEntries(Object.entries(v.access).map(([k,a])=>[k,`${a.actions}${a.extra?' ('+a.extra+')':''} ok=${a.editable} hit=${a.hit}`])),left:v.leftColumn.count,errors:v.errors.length}))));
})().catch(e=>{console.error(e);process.exit(1);});
