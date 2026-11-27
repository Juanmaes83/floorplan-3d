// «Tu proyecto cobra vida» · el ZIP para Blender lleva EXACTAMENTE el efecto, el perfil, el proyecto y la revisión elegidos
// en Entregar → Vídeo; al cambiar de efecto lleva el nuevo; al cancelar o cambiar de proyecto no lleva ninguno.
// Flujo real: diálogo del efecto → «Descargar el paquete para Blender» → Escena para Blender → descargar el ZIP.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),zlib=require('node:zlib'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),os=require('node:os'),Fixtures=require('./fixtures/scene-blender/build.cjs');let server,browser,url,fx;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm','.py':'text/plain','.sh':'text/plain','.bat':'text/plain','.txt':'text/plain'};
function unzip(buffer){const end=buffer.length-22,count=buffer.readUInt16LE(end+10),items=new Map();let at=buffer.readUInt32LE(end+16);
 for(let i=0;i<count;i++){const method=buffer.readUInt16LE(at+10),size=buffer.readUInt32LE(at+20),n=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32),local=buffer.readUInt32LE(at+42),name=buffer.subarray(at+46,at+46+n).toString();
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),raw=buffer.subarray(start,start+size);items.set(name,method===8?zlib.inflateRawSync(raw):raw);at+=46+n+extra+comment;}
 return items;}
before(async()=>{fx=path.join(require('node:fs').mkdtempSync(path.join(os.tmpdir(),'pel-zip-')),'fx');Fixtures.build(fx);server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://l').pathname),f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function zipFrom(page){
 await page.waitForFunction(()=>document.querySelector('#sceneExportDialog[open]'));
 if(await page.locator('#sceneExportDialog').getAttribute('data-state')==='no3d'){await page.locator('#sePrimary').click();await page.waitForFunction(()=>document.querySelector('#sceneExportDialog').dataset.state==='idle',null,{timeout:120000});}
 await page.locator('#sePrimary').click();await page.waitForFunction(()=>window.RubikSceneExport.state==='ready',null,{timeout:300000});
 const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#sePrimary').click()]);const items=unzip(await fs.readFile(await d.path()));
 await page.evaluate(()=>document.querySelector('#sceneExportDialog').close());return items;}
async function choose(page,effect,profile){
 await page.evaluate(id=>window.RubikPeliculaEfectos.openDeliver(id),effect);await page.waitForSelector('#peliculaEfectosDialog[open]');
 await page.locator('#peliculaProfile').selectOption(profile);await page.locator('#peliculaConfirm').click();}
test('ZIP = efecto, perfil, proyecto y revisión elegidos; cambio de efecto, cancelar y cambio de proyecto',{timeout:900000},async t=>{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>ctx.close());const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&window.RubikPeliculaEfectos);
 const P1=await page.evaluate(()=>({id:FloorPlanApp.project.id,entry:FloorPlanApp.entryId}));
 // 1 · Maqueta abierta · revision
 await choose(page,'maqueta-abierta','revision');await page.locator('#peliculaGo').click();let z=await zipFrom(page);
 let g=JSON.parse(z.get('rubik-pelicula-guion.json')),m=JSON.parse(z.get('manifest.json'));
 assert.equal(g.effect,'maqueta-abierta');assert.equal(g.profile,'revision');assert.equal(g.revision.projectId,P1.id);assert.equal(g.revision.entryId,P1.entry);assert.ok(g.seconds>20);
 assert.deepEqual({e:m.film.effect,p:m.film.profile},{e:'maqueta-abierta',p:'revision'});assert.ok(m.files['rubik-pelicula-guion.json'].sha256);assert.equal(m.source.projectId,P1.id);
 for(const k of ['rubik_blender_rodaje.py','rodar.sh','RODAR-windows.bat','rubik_blender_entorno.py'])assert.ok(z.has(k),k+' en el ZIP');
 // 2 · Cambio de efecto y perfil: el ZIP lleva el nuevo.
 await choose(page,'pieza-a-pieza','entrega1440');await page.locator('#peliculaGo').click();z=await zipFrom(page);g=JSON.parse(z.get('rubik-pelicula-guion.json'));
 assert.deepEqual([g.effect,g.profile],['pieza-a-pieza','entrega1440']);
 // 3 · Exportar de nuevo sin elegir: la elección se consumió → sin guion.
 await page.evaluate(()=>window.RubikSceneExport.open());z=await zipFrom(page);assert.equal(z.has('rubik-pelicula-guion.json'),false,'consumido');assert.equal('film' in JSON.parse(z.get('manifest.json')),false);
 // 4 · Cancelar en la confirmación: no se prepara nada.
 await choose(page,'maqueta-abierta','revision');await page.locator('#peliculaCancel').click();await page.evaluate(()=>document.querySelector('#peliculaEfectosDialog').close());
 await page.evaluate(()=>window.RubikSceneExport.open());z=await zipFrom(page);assert.equal(z.has('rubik-pelicula-guion.json'),false,'cancelar no prepara');
 // 5 · Elegir y cambiar de proyecto antes de exportar: el otro proyecto no hereda la elección.
 await choose(page,'maqueta-abierta','revision');await page.locator('#peliculaGo').click();await page.waitForFunction(()=>document.querySelector('#sceneExportDialog[open]'));await page.evaluate(()=>document.querySelector('#sceneExportDialog').close());
 await page.locator('#fileIn').setInputFiles(path.join(fx,'f3-openings.json'));await page.waitForFunction(()=>FloorPlanApp.project?.id==='prj_op10-f3-openings');
 await page.evaluate(()=>window.RubikSceneExport.open());z=await zipFrom(page);assert.equal(z.has('rubik-pelicula-guion.json'),false,'otro proyecto sin guion heredado');
 assert.equal(JSON.parse(z.get('manifest.json')).source.projectId,'prj_op10-f3-openings');
 assert.deepEqual(errors,[]);
});
