// Uses Rubik's existing Presentation pose/readback and V2 Project; no renderer or camera implementation.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http'),{chromium}=require('playwright');
const fixture=require('./fixtures/vq01-material-ab-v2.json');
const hash=x=>crypto.createHash('sha256').update(x).digest('hex');
async function start(root,viewport={width:1440,height:900}){
 const server=createServer(async(req,res)=>{if(req.url==='/favicon.ico'){res.writeHead(204);res.end();return;}try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.hdr')?'application/octet-stream':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.css')?'text/css':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const context=await browser.newContext({viewport,deviceScaleFactor:1,isMobile:viewport.width<1000,hasTouch:viewport.width<1000,acceptDownloads:true}),page=await context.newPage(),errors=[],warnings=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());if(m.type()==='warning')warnings.push(m.text());});
 await page.goto(`http://127.0.0.1:${server.address().port}/`);await page.waitForFunction(()=>window.View3D&&window.FloorPlanPresentation&&FloorPlanSurfaces.entries.length===50);
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 await page.evaluate(()=>{document.querySelector('#guideDetails').click();document.querySelector('#guideAllTools').click();});await require('./layout-fixture.cjs')(page);
 return {page,errors,warnings,browserVersion:browser.version(),close:async()=>{await context.close();await browser.close();await new Promise(r=>server.close(r));}};
}
async function setup(page){
 const project=await page.evaluate(assignments=>{let p=JSON.parse(JSON.stringify(FloorPlanApp.project));for(const a of assignments){const id=a.kind==='floor'?p.rooms[a.targetIndex].id:p.walls[a.targetIndex].id;p=FloorPlanSurfaces.apply(p,FloorPlanSurfaces.get(a.surfaceId),{kind:a.kind,id});}return p;},fixture.assignments);
 if(hash(JSON.stringify(project))!==fixture.projectSha256)throw Error('Project fixture drift');
 // Same source fixture construction as CP1/CP2, including stable identifiers.
 await page.evaluate(p=>FloorPlanApp.importProject(p),project);return project;
}
async function present(page){
 await page.locator('#presentationBtn').click();await page.getByRole('button',{name:/^Iniciar presentaci/}).click();await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false');
 await page.waitForFunction(()=>View3D.surfaceMetrics.every(m=>m.state==='ready'&&(m.detailState==='ready'||m.detailState==='off'))&&View3D.lifecycleMetrics.pendingAssets===0,null,{timeout:90000});
 await page.evaluate(()=>dispatchEvent(new Event('floorplan-asset-status')));await require('./layout-fixture.cjs')(page);
}
async function pose(page,view){return page.evaluate(async v=>{const T=await import('three'),c=new T.PerspectiveCamera(v.fov,innerWidth/innerHeight,.1,300);c.position.fromArray(v.position);c.lookAt(new T.Vector3(...v.target));View3D.presentationRestorePose({...v,quaternion:c.quaternion.toArray()});return View3D.presentationPose();},view);}
async function png(page,file){const data=await page.evaluate(()=>document.querySelector('#view3d canvas').toDataURL('image/png'));const bytes=Buffer.from(data.split(',')[1],'base64');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,bytes);return hash(bytes);}
module.exports={start,setup,present,pose,png,hash};
