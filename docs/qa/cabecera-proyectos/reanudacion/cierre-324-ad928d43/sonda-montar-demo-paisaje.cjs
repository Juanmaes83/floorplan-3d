const path=require('path'),fs=require('fs/promises'),{createServer}=require('http'),{chromium}=require('playwright');
const [root,out]=process.argv.slice(2);const REF='11039A02800004',ANCHOR_CRS={x:234062,y:4015975},NORTH=180,MODEL_ANCHOR={x:5900,y:5280};
(async()=>{const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm','.py':'text/plain','.txt':'text/plain','.sh':'text/plain','.bat':'text/plain'};
const s=createServer(async(q,r)=>{try{const p=decodeURIComponent(new URL(q.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(await fs.readFile(f));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:1440,height:900},acceptDownloads:true});const page=await ctx.newPage();const errs=[];page.on('pageerror',e=>errs.push(e.message));page.setDefaultTimeout(60000);
await page.route('**/*',r=>{const u=r.request().url();return /^(http:\/\/127\.0\.0\.1|blob:|data:|https:\/\/(ovc\.catastro\.meh\.es|servicios\.idee\.es|www\.ign\.es)\/)/.test(u)?r.continue():r.abort();});
await page.goto(`http://127.0.0.1:${s.address().port}/`);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&window.FloorPlanTerritoryUI);
// 1 · Vivienda ficticia de RUBIK (la del ejemplo) como proyecto propio con su nombre de demostración.
const json=await page.evaluate(()=>{const p=structuredClone(FloorPlanApp.project);p.id='prj_demo-entorno-real';p.name='Proyecto de demostración sobre entorno real';delete p.site;return JSON.stringify(p);});
const pf=path.join(out,'demo-sin-emplazamiento.json');await fs.writeFile(pf,json);
await page.locator('#uploadIn').setInputFiles(pf);await page.waitForFunction(()=>FloorPlanApp.project?.id==='prj_demo-entorno-real'&&document.documentElement.dataset.editorReady==='true');
// 2 · Parcela (WFS real), terreno y ortofoto desde la interfaz.
await page.evaluate(()=>FloorPlanTerritoryUI.open());await page.locator('#territoryDialog[open]').waitFor();
await page.locator('#territoryProvider').selectOption('catastro-inspire-wfs');await page.locator('#territoryLookupReference').fill(REF);await page.locator('#territoryLookup').click();
await page.locator('#territoryCard:not([hidden])').waitFor();await page.locator('#territorySave').click();await page.waitForTimeout(600);
await page.locator('#territoryTerrainLoad').click();await page.waitForFunction(()=>/Disponible/.test(document.querySelector('#territoryTerrain')?.textContent||''),null,{timeout:90000});
await page.locator('#territoryTerrain button:has-text("Guardar configuración")').click();
await page.locator('#territoryOrthophotoLoad').click();await page.waitForFunction(()=>/Disponible/.test(document.querySelector('#territoryOrthophoto')?.textContent||''),null,{timeout:90000});
await page.locator('#territoryOrthophotoSave').click();await page.waitForTimeout(600);
// 3 · Emplazamiento: norte, ancla de la huella y cota cero del modelo = terreno en el ancla (MDT05).
const placed=await page.evaluate(([A,N,M])=>{const app=FloorPlanApp,site=app.project.site,C=FloorPlanTerritoryIntegration,TC=FloorPlanTerrainCore,grid=FloorPlanTerritorySession.get('terrain')?.grid;
 if(!grid)throw Error('terrain session missing');const local=C.sourceToLocal(site.parcel.frame,A.x,A.y),z=TC.sampleElevation(grid,A.x,A.y);if(z.status!=='available')throw Error('anchor outside terrain');
 app.setSite({...site,northOffsetDeg:N,buildingPlacement:{horizontal:{modelAnchorMm:M,parcelLocalAnchorMm:{x:Math.round(local.x),y:Math.round(local.y)},source:{type:'user-entered'}},vertical:{modelZeroElevationM:z.elevationM,verticalReference:'orthometric',source:{type:'derived',derivedFrom:'site.terrain',sourceId:site.terrain.coverageId,retrievedAt:site.terrain.source.retrievedAt}}}});
 const s2=app.project.site;return {north:s2.northOffsetDeg,placement:s2.buildingPlacement,terrainSession:!!FloorPlanTerritorySession.get('terrain'),orthoSession:!!FloorPlanTerritorySession.get('orthophoto'),
  entrance:(()=>{const o=app.project.openings.find(o=>o.isEntrance),w=app.project.walls.find(w=>w.id===o.wallId);const mid={x:(w.start.x+w.end.x)/2,y:(w.start.y+w.end.y)/2},pl=C.modelToParcel(s2,mid),src=C.localToSource(s2.parcel.frame,pl);return {id:o.id,wall:w.id,modelMm:mid,sourceCrs:src};})()};},[ANCHOR_CRS,NORTH,MODEL_ANCHOR]);
await page.evaluate(()=>document.querySelector('#territoryPlacement')?.scrollIntoView());await page.waitForTimeout(800);await page.locator('#territoryDialog').screenshot({path:path.join(out,'rubik-colocacion.png')});
const projectJson=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));await fs.writeFile(path.join(out,'demo-con-emplazamiento.json'),projectJson);
await page.locator('#territoryClose').click();
// 4 · Entregar → Escena para Blender (3D, preparar, descargar).
await page.locator('#workArea-deliver').click();await page.locator('#professionalWorkspace #sceneExportOpen').first().evaluate(b=>b.click());
await page.waitForFunction(()=>document.querySelector('#sceneExportDialog[open]'));
if(await page.locator('#sceneExportDialog').getAttribute('data-state')==='no3d'){await page.locator('#sePrimary').click();await page.waitForFunction(()=>document.querySelector('#sceneExportDialog').dataset.state==='idle',null,{timeout:120000});}
await page.locator('#sePrimary').click();await page.waitForFunction(()=>['ready','error'].includes(document.querySelector('#sceneExportDialog').dataset.state),null,{timeout:300000});
const state=await page.locator('#sceneExportDialog').getAttribute('data-state'),note=await page.locator('#sceneExportSite').textContent().catch(()=>null),status=await page.locator('#seStatus').textContent();
await page.locator('#sceneExportDialog').screenshot({path:path.join(out,'entregar-escena-entorno.png')});
let zip=null;if(state==='ready'){const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#sePrimary').click()]);zip=path.join(out,await d.suggestedFilename());await d.saveAs(zip);}
console.log(JSON.stringify({placed,state,status,note,zip,errs},null,1));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});
