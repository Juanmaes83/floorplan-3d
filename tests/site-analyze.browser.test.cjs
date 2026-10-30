// Project-First A3: Analyze shows orientation, sun and site on the project itself, and the orientation/site report
// gathers them in one printable document. Without north, location or parcel it says what is missing instead of
// drawing a guess. Reading never changes the project. Desktop and phone.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const parcel={reference:'1907401VK4810H',sourceCrs:'EPSG:25830',sourceGeometry:{type:'MultiPolygon',polygons:[{rings:[[[500000,4500000],[500030,4500000],[500030,4500025],[500000,4500025]]]}]},frame:{sourceCrs:'EPSG:25830',originX:500015,originY:4500012.5,sourceUnits:'m',xAxis:'east',yAxis:'north'},source:{providerId:'synthetic',type:'derived',license:{status:'restricted'}}};
const location={latitude:40.4168,longitude:-3.7038,timeZone:'Europe/Madrid',source:{providerId:'manual',type:'user-entered'}};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test('Project-First A3: visual Analyze and the orientation/site report '+viewport.width+'x'+viewport.height,{timeout:120000},async t=>{
 const mobile=viewport.width<1100,context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(15000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanSitePreview);
 const workspace=page.locator('#professionalWorkspace'),card=id=>workspace.locator(`.professional-card[data-module="${id}"]`);
 // Without north, location or parcel: the plan is shown, orientations are relative and nothing is invented.
 await page.locator('#workArea-analyze').click();await workspace.getByRole('heading',{name:'Orientación y sol',exact:true}).waitFor();
 assert.match(await card('orientation').innerText(),/Configura el norte para orientarlos/);assert.equal(await card('orientation').locator('.site-rose,.site-sun').count(),0);assert.equal(await card('territory').locator('.site-parcel').count(),0);
 // Configure north, location and parcel through the app's own site API, as Orientación and Emplazamiento do.
 await page.evaluate(({parcel,location})=>FloorPlanApp.setSite({...(FloorPlanApp.project.site||{}),northOffsetDeg:30,location,parcel}),{parcel,location});
 const configured=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#workArea-design').click();await page.locator('#workArea-analyze').click();await workspace.getByRole('heading',{name:'Orientación y sol',exact:true}).waitFor();
 const facts=await page.evaluate(()=>{const d=FloorPlanSitePreview.data();return {sectors:d.facades.sectors.filter(s=>s.walls).map(s=>s.sector),summer:d.sun.days.find(x=>x.key==='summer').maxAltitudeDeg};});
 const rose=card('orientation').locator('svg.site-rose');assert.match(await rose.getAttribute('aria-label'),/^Ventanas y fachadas por orientación\. /);
 assert.equal(await rose.locator('.site-rose-window').count(),facts.sectors.length);
 assert.match(await card('orientation').locator('svg.site-north').evaluate(n=>n.querySelector('g').getAttribute('transform')),/rotate\(30\)/);
 const sun=card('orientation').locator('svg.site-sun');assert.equal(await sun.locator('.site-sun-path').count(),3);assert.equal(await card('orientation').locator('.site-table tbody tr').count(),3);
 assert.match(await card('orientation').innerText(),new RegExp(`${Math.round(facts.summer)}°`));assert.match(await card('orientation').innerText(),/No considera relieve ni edificios vecinos/);
 assert.equal(await card('territory').locator('svg.site-parcel .site-parcel-shape').count(),1);assert.match(await card('territory').innerText(),/Parcela de 750 m²/);
 // The example has no provable footprint (8A classification is partial): it is not placed by guess.
 assert.equal(await card('territory').locator('.site-parcel-building').count(),0);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>document.documentElement.clientWidth+1),false);
 // The report gathers orientation, sun, site and exterior with their sources; it can be printed.
 await workspace.getByRole('button',{name:'Ver informe de orientación y emplazamiento',exact:true}).click();await page.locator('#siteReportDialog[open]').waitFor();
 const report=page.locator('#siteReportDocument'),text=await report.innerText();
 for(const h of ['ORIENTACIÓN Y FACHADAS','RECORRIDO DEL SOL','EMPLAZAMIENTO','EXTERIOR'])assert.ok(text.toUpperCase().includes(h),h);
 assert.match(text,/Norte declarado: 30°/);assert.match(text,/SunCalc 2\.1\.1/);assert.match(text,/No es un informe urbanístico, catastral ni topográfico certificado/);
 assert.equal(await report.locator('svg.site-rose,svg.site-sun,svg.site-parcel').count(),3);
 assert.equal(await page.locator('#siteReportPrint').innerText(),'Imprimir / Guardar PDF');
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#siteReportDialog').open);
 assert.equal(await page.evaluate(()=>document.activeElement?.dataset.route),'site-report','focus returns to the report action');
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),configured,'analysis and report do not change the project');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});
