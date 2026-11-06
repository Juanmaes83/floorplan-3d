/* Section → Spatial Visit hand-over: short evidence video of the REAL flow in Chromium (SwiftShader here, so frames are
   captured from the running app and assembled with their real order; key states are held so they can be read).
   «Ver la historia completa» plays plan → section → visit by itself; at the arrival the camera stays at eye level with
   «Explorar desde aquí» and «Volver a la sección»; «Explorar desde aquí» opens «Recorrer» at that pose; the user walks;
   «Volver a la presentación»; then the whole story again and «Volver a la sección». Not product code.
   usage: node scripts/qa/record-visit-handover.cjs <root> <out-dir> */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process'),{chromium}=require('playwright');
const [root,out]=process.argv.slice(2),three=require(path.join(root,'tests/helpers/three-module.cjs'));
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
(async()=>{const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim();await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const ctx=await browser.newContext({viewport:{width:1280,height:800}});const page=await ctx.newPage();page.setDefaultTimeout(600000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(r.request().url(),()=>{throw Error('no')})}));
 const frames=[];let n=0;const shot=async(hold=.25,label='')=>{const f=path.join(out,`s${String(n++).padStart(4,'0')}.png`);await page.screenshot({path:f});frames.push({f,hold,label});};
 const settled=()=>page.waitForFunction(()=>FloorPlanPresentation.active&&!FloorPlanPresentation.story&&document.querySelector('#presentationOverlay').dataset.moving==='false'&&!View3D.lifecycleMetrics.flying);
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D?.presentationStoryBegin);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>FloorPlanApp.project.rooms.length>3);
 await page.locator('#presentationBtn:visible,#guidePresent:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 for(const id of ['#presentationStoryOption','#presentationSectionOption','#presentationVisitOption'])await page.locator(id).check();await shot(2,'options');
 await page.locator('#presentationConfig .presentation-config-actions .btn').first().click();await settled();await shot(1.5,'overview');
 // «Ver la historia completa», sampled while it plays by itself until it stops.
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1);
 for(let i=0;i<400;i++){const s=await page.evaluate(()=>{const s=FloorPlanPresentation.story;return s?{P:s.P,playing:s.playing}:null;});await shot(.25,'story');if(!s||(!s.playing&&s.P>=1))break;}
 await page.waitForTimeout(3000);await shot(3,'arrival + 3 s: still inside, «Explorar desde aquí»');
 await page.locator('#presentationVisitWalk').hover();await shot(1.5,'hover');await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());await shot(2.5,'Recorrer at the same pose');
 await page.locator('#walkStart').click();await page.waitForFunction(()=>!!document.pointerLockElement);
 for(let i=0;i<8;i++){await page.keyboard.down('KeyW');await page.waitForTimeout(250);await page.keyboard.up('KeyW');await shot(.3,'walking');}
 await page.evaluate(()=>document.exitPointerLock());await page.waitForFunction(()=>!document.pointerLockElement);
 await page.locator('#presentationWalkBack').hover();await shot(1.2,'back');await page.locator('#presentationWalkBack').click();await page.waitForFunction(()=>!View3D.walking());await settled();await shot(2.5,'back in the presentation');
 // The whole story again (to the arrival), «Explorar desde aquí», then «Volver a la sección».
 await page.locator('.presentation-stops button').nth(0).click();await settled();
 await page.evaluate(()=>document.querySelector('#presentationStoryFull').click());await page.waitForFunction(()=>FloorPlanPresentation.story?.scenes>1&&!FloorPlanPresentation.story.busy);
 await page.evaluate(()=>{const s=document.querySelector('#presentationStorySlider');s.value=s.max;s.dispatchEvent(new Event('input',{bubbles:true}));});await page.waitForFunction(()=>FloorPlanPresentation.story?.P>=1&&!FloorPlanPresentation.story.busy);
 await shot(1.5,'arrival again');await page.locator('#presentationVisitWalk').click();await page.waitForFunction(()=>View3D.walking());await shot(1.5,'Recorrer');
 await page.locator('#presentationWalkSection').hover();await shot(1.2,'to the section');await page.locator('#presentationWalkSection').click();
 await page.waitForFunction(()=>!View3D.walking()&&FloorPlanPresentation.story?.kind==='section-open'&&!FloorPlanPresentation.story.busy);await shot(3,'back to the section');
 // concat list for ffmpeg
 const list=frames.map(x=>`file '${x.f}'\nduration ${x.hold}`).join('\n')+`\nfile '${frames.at(-1).f}'\n`;await fs.writeFile(path.join(out,'list.txt'),list);
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({head,chromium:browser.version(),frames:frames.map(x=>({file:path.basename(x.f),hold:x.hold,label:x.label})),errors},null,1));
 console.log('frames',frames.length,'errors',errors);await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
