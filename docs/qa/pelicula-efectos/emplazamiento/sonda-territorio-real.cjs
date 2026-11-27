const path=require('path'),fs=require('fs/promises'),{createServer}=require('http'),{chromium}=require('playwright');
const root=process.argv[2],ref=process.argv[3]||'3662001TF3136S',out=process.argv[4];
(async()=>{const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const s=createServer(async(q,r)=>{try{const p=decodeURIComponent(new URL(q.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(await fs.readFile(f));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
const page=await (await b.newContext({viewport:{width:1440,height:900}})).newPage();const errs=[],net=[];page.on('pageerror',e=>errs.push(e.message));
await page.route('**/*',r=>{const u=r.request().url();if(/^(http:\/\/127\.0\.0\.1|blob:|data:|https:\/\/(ovc\.catastro\.meh\.es|servicios\.idee\.es|www\.ign\.es)\/)/.test(u)){if(/catastro|idee|ign\.es/.test(u))net.push(u.slice(0,200));return r.continue();}net.push('ABORT '+u.slice(0,120));return r.abort();});
page.on('response',x=>{if(/catastro|idee|ign\.es/.test(x.url()))net.push(x.status()+' '+x.headers()['content-type']+' '+x.url().slice(8,60));});
await page.goto(`http://127.0.0.1:${s.address().port}/`);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&window.FloorPlanTerritoryUI);
await page.evaluate(()=>FloorPlanTerritoryUI.open());await page.locator('#territoryDialog[open]').waitFor();
await page.locator('#territoryProvider').selectOption('catastro-inspire-wfs');await page.locator('#territoryReference').waitFor();
await page.locator('#territoryLookupReference').fill(ref);await page.locator('#territoryLookup').click();
let ok=true;try{await page.locator('#territoryCard:not([hidden])').waitFor({timeout:60000});}catch{ok=false;}
const card=ok?await page.locator('#territoryCard').innerText():null,status=await page.locator('#territoryDialog').evaluate(d=>[...d.querySelectorAll('[role=status],.territory-status,#territoryStatus')].map(n=>n.textContent.trim()).filter(Boolean).join(' | '));
const paths=await page.locator('#territoryPreview path').count();
const site=await page.evaluate(()=>{const s=FloorPlanApp.project.site;return s?{ref:s.parcel?.reference,crs:s.parcel?.sourceCrs,src:s.parcel?.source?.providerId||s.parcel?.source?.sourceId,lic:s.parcel?.source?.license?.status,area:s.parcel?.areaM2}:null;});
let ter=null,ort=null;
if(ok){await page.locator('#territorySave').click();await page.waitForTimeout(800);
 const st=id=>page.locator(id).innerText().catch(()=>null);
 if(await page.locator('#territoryTerrainLoad').isVisible()){await page.locator('#territoryTerrainLoad').click();await page.waitForFunction(()=>!/Cargando/.test(document.querySelector('#territoryTerrainStatus')?.textContent||document.querySelector('#territoryTerrain')?.textContent||''),null,{timeout:90000}).catch(()=>{});ter=(await st('#territoryTerrain'))?.slice(0,700);}
 if(await page.locator('#territoryOrthophotoLoad').isVisible()){await page.locator('#territoryOrthophotoLoad').click();await page.waitForTimeout(1000);await page.waitForFunction(()=>!/Cargando/.test(document.querySelector('#territoryOrthophotoStatus')?.textContent||''),null,{timeout:90000}).catch(()=>{});ort=(await st('#territoryOrthophoto'))?.slice(0,700);}}
await page.locator('#territoryDialog').screenshot({path:out});
await page.evaluate(()=>document.querySelector('#territoryTerrain')?.scrollIntoView());await page.locator('#territoryDialog').screenshot({path:out.replace('.png','-terreno.png')});
console.log(JSON.stringify({ref,ok,ter,ort,card,status,paths,site,net,errs},null,1));await b.close();s.close();})();
