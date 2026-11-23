// M13 · Exportación MSPDI desde la interfaz REAL: Presupuestar → Plan de obra → «Exportar a Microsoft Project /
// GanttProject (XML)». El plan se crea con el editor del producto (tareas, dependencias, hito), se guarda y se exporta.
// Comprueba el archivo descargado, el informe visible, que el plan guardado no cambia y que el JSON sigue igual.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.M13_SHOTS||'',OUT=process.env.M13_SAMPLES||'';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary'};
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
function library(){const ref=JSON.parse(JSON.stringify(require('../js/reference-project.js')));ref.id='prj_m13-house';ref.name='Vivienda M13';return {version:1,activeId:'ent_m13',entries:[{id:'ent_m13',name:'Vivienda M13',project:ref}]};}
async function boot(viewport){
 const context=await browser.newContext({viewport,acceptDownloads:true});const page=await context.newPage();page.setDefaultTimeout(45000);
 const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.abort());
 await page.addInitScript(l=>{if(window.top!==window||sessionStorage.getItem('m13-seeded'))return;localStorage.clear();localStorage.setItem('rubik-sota-project-library-v1',l);sessionStorage.setItem('m13-seeded','1');},JSON.stringify(library()));
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanConstructionUI&&window.FloorPlanScheduleMSPDI);
 if(await page.locator('#welcomeReturn').isVisible())await page.locator('#welcomeReturn').click();
 return {context,page,errors};
}
const shot=async(page,name)=>{if(!SHOTS)return;await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,name+'.png')});};
async function buildPlan(page){
 await page.locator('#workArea-budget').click();await page.locator('[data-route="construction-plan"]').click();await page.waitForSelector('#planDialog[open]');
 await page.locator('#planCreate').click();
 const add=async({title,start,end,dep=null,milestone=false})=>{
  await page.locator(milestone?'#planAddMilestone':'#planAddTask').click();await page.fill('#taskTitle',title);await page.fill('#taskStart',start);if(!milestone)await page.fill('#taskEnd',end);
  if(dep){await page.locator('#taskAddDep').click();const r=page.locator('#taskForm [data-dep]').last();await r.locator('select').first().selectOption({label:dep.label});await r.locator('select').nth(1).selectOption(dep.type);await r.locator('input').fill(String(dep.lag));}
  await page.locator('#taskSave').click();if(await page.locator('#taskForm').count())assert.fail('task not saved: '+await page.locator('#taskError').textContent());};
 await add({title:'Replanteo y protecciones',start:'2027-03-01',end:'2027-03-03'});
 await add({title:'Demolición & retirada',start:'2027-03-04',end:'2027-03-12',dep:{label:'1 Replanteo y protecciones',type:'FS',lag:0}});
 await add({title:'Instalaciones',start:'2027-03-08',end:'2027-03-19',dep:{label:'2 Demolición & retirada',type:'SS',lag:4}});
 await add({title:'Entrega de llaves',start:'2027-03-22',milestone:true,dep:{label:'3 Instalaciones',type:'FS',lag:2}});
 await page.locator('#planSave').click();await page.waitForFunction(()=>/Plan guardado/.test(document.getElementById('planStatus').textContent));
}
const stored=page=>page.evaluate(async()=>JSON.stringify((await FloorPlanConstructionContext.snapshot()).record?.schedule||null));

for(const [label,viewport] of [['escritorio',{width:1440,height:900}],['móvil',{width:390,height:844}]])
test(`interfaz real (${label}): exporta MSPDI del plan guardado, informa de lo que no viaja y no altera el plan`,{timeout:300000},async()=>{
 const {context,page,errors}=await boot(viewport);
 try{
  await buildPlan(page);
  const before=await stored(page);assert.ok(before&&before!=='null');
  const jsonBefore=await (await Promise.all([page.waitForEvent('download'),page.locator('#planExport').click()]))[0];
  const json=await fs.readFile(await jsonBefore.path(),'utf8');assert.equal(JSON.parse(json).tasks.length,4,'JSON export unchanged');
  const btn=page.locator('#planExportMspdi');await btn.scrollIntoViewIfNeeded();assert.equal(await btn.isEnabled(),true);
  const [dl]=await Promise.all([page.waitForEvent('download'),btn.click()]);
  assert.match(dl.suggestedFilename(),/^plan-de-obra-vivienda-m13\.mspdi\.xml$/);
  const xml=await fs.readFile(await dl.path(),'utf8');
  if(OUT){await fs.mkdir(OUT,{recursive:true});await fs.writeFile(path.join(OUT,'interfaz-'+(label==='móvil'?'movil':label)+'.mspdi.xml'),xml);}
  assert.match(xml,/<Project xmlns="http:\/\/schemas.microsoft.com\/project">/);
  assert.match(xml,/<Name>Demolición &amp; retirada<\/Name>/);
  assert.match(xml,/<Name>Entrega de llaves<\/Name>[\s\S]*?<Milestone>1<\/Milestone>/);
  assert.match(xml,/<Start>2027-03-08T08:00:00<\/Start><Finish>2027-03-19T17:00:00<\/Finish>/,'exact dates of «Instalaciones»');
  assert.match(xml,/<PredecessorLink><PredecessorUID>\d+<\/PredecessorUID><Type>3<\/Type><CrossProject>0<\/CrossProject><LinkLag>19200<\/LinkLag>/,'SS +4 d');
  assert.match(xml,/Plan previsto en borrador/);assert.doesNotMatch(xml,/<ActualStart>/);
  const rep=page.locator('#planMspdiReport');await rep.waitFor();
  const text=await rep.textContent();assert.match(text,/3 tareas, 1 hito y 3 dependencias/);assert.match(text,/Qué no viaja al formato MSPDI/);assert.match(text,/Fechas ancladas/);
  await rep.scrollIntoViewIfNeeded();await shot(page,'m13-informe-'+(label==='móvil'?'movil':label));
  assert.equal(await stored(page),before,'the stored plan is untouched');
  // Con cambios sin guardar se exporta lo guardado, nunca cambios a medias: se pide guardar.
  await page.locator('#planAddTask').click();await page.fill('#taskTitle','Tarea a medias');await page.fill('#taskStart','2027-04-01');await page.fill('#taskEnd','2027-04-02');await page.locator('#taskSave').click();
  await page.locator('#planExportMspdi').click();await page.waitForFunction(()=>/Guarda el plan antes de exportarlo/.test(document.getElementById('planError').textContent));
  assert.equal(await stored(page),before);
  assert.deepEqual(errors,[]);
 }finally{await context.close();}
});
