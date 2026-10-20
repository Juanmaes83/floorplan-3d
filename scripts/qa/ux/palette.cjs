/* Captures of the creation palette (left column) on the example project at 1440×900, 390×844 and 844×390:
   «Construir» with nothing selected and with a room selected, «Amueblar», wall drawing with its banner, the
   opening pick started from the palette and the 3D note. Records layout facts per step in palette.json.
   Usage: node scripts/qa/ux/palette.cjs <checkout> <outdir> [1440x900 390x844 844x390] */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg,...vpArgs]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const VPS=(vpArgs.length?vpArgs:['1440x900','390x844','844x390']).map(s=>s.split('x').map(Number));
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const report={browser:browser.version(),steps:[]};
 for(const [w,h] of VPS){
  const narrow=w<=1100,ctx=await browser.newContext({viewport:{width:w,height:h},isMobile:narrow,hasTouch:narrow}),page=await ctx.newPage(),errors=[],name=`${w}x${h}`;
  page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/ERR_FAILED|cdn\.jsdelivr|Failed to load resource/.test(m.text()))errors.push(m.text());});
  await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
  await page.goto(url);await require(path.join(root,'tests/editor-fixture.cjs'))(page);await page.waitForTimeout(400);
  const openLib=async()=>{await page.evaluate(()=>drawer('lib',true));await page.waitForTimeout(450);};
  const step=async(id,note)=>{await page.waitForTimeout(300);await page.screenshot({path:path.join(out,`${name}-${id}.png`)});
   report.steps.push({viewport:name,id,note,...await page.evaluate(()=>{const a=document.querySelector('aside.lib'),r=a.getBoundingClientRect(),plan=document.querySelector('#plan').getBoundingClientRect();
    const vis=s=>{const e=document.querySelector(s);if(!e)return null;const b=e.getBoundingClientRect();return {x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),inView:b.width>0&&b.left>=-1&&b.right<=innerWidth+1&&b.top>=-1&&b.bottom<=innerHeight+1};};
    return {aside:{x:Math.round(r.x),w:Math.round(r.width)},planVisibleWidth:Math.round(Math.max(0,Math.min(plan.right,innerWidth)-Math.max(plan.left,r.right>0&&r.left<innerWidth&&getComputedStyle(a).position!=='static'?0:0))),hScroll:document.documentElement.scrollWidth>innerWidth+1,
     tab:window.FloorPlanBuildPalette?.tab,context:document.querySelector('#paletteOpeningContext')?.textContent,banner:vis('#paletteWallBanner:not([hidden])')||vis('#openingPick:not([hidden])'),firstAction:vis('#paletteTool-select'),newRoom:vis('#paletteNewRoom'),selection:ui.sel&&{...ui.sel},tool:ui.tool};})});};
  await openLib();await page.evaluate(()=>FloorPlanBuildPalette.select('build'));await step('p01-build','Construir, sin selección');
  await page.evaluate(()=>FloorPlanBuildPalette.select('furnish'));await step('p02-furnish','Amueblar');
  await page.evaluate(()=>{select({kind:'room',id:'rom_child'});FloorPlanBuildPalette.select('build');});await openLib();await step('p03-build-room','Construir con una estancia seleccionada');
  await page.locator('#paletteOpening-window').click();await page.waitForTimeout(500);await step('p04-opening-pick','Ventana desde la paleta: elegir muro');
  await page.evaluate(()=>FloorPlanOpeningUI.cancel());await page.evaluate(()=>{select(null);});await openLib();
  await page.locator('#paletteWall').click();await page.waitForTimeout(600);await step('p05-wall','Dibujar muro: banner visible');
  await page.locator('#paletteWallDone').click();await page.waitForTimeout(300);
  report.steps.push({viewport:name,id:'p06-after-wall',traceMode:await page.evaluate(()=>FloorPlanTraceUI.mode()),bannerHidden:await page.evaluate(()=>document.querySelector('#paletteWallBanner')?.hidden)});
  report.steps.push({viewport:name,id:'errors',errors});await ctx.close();
 }
 await fs.writeFile(path.join(out,'palette.json'),JSON.stringify(report,null,1));await browser.close();server.close();
 console.log(JSON.stringify(report.steps.map(s=>[s.viewport,s.id,s.tab,s.banner?.inView,s.hScroll,s.traceMode,s.errors?.length])));
})().catch(e=>{console.error(e);process.exit(1);});
