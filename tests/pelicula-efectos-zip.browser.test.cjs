// «Tu proyecto cobra vida» · el ZIP para Blender lleva EXACTAMENTE el efecto, el perfil y la revisión elegidos en Entregar → Vídeo.
// Recorrido real: diálogo del efecto → «Descargar el paquete para Blender» → Escena para Blender → descargar el ZIP → abrirlo.
//  1. Maqueta abierta (revision) → ZIP A.  2. Sin editar, Pieza a pieza (entrega1440) → ZIP B. Ambos: manifiesto y guion correctos,
//     misma revisión del proyecto.  3. Editar el mismo proyecto entre la elección y la exportación → la elección se descarta y se
//     dice; el ZIP no lleva guion.  4. Cerrar el diálogo de exportación sin preparar y volver a «Escena para Blender» → la elección
//     sigue (se ve) y el ZIP la lleva.  5. Cancelar en la confirmación → sin guion.  6. Cambio de proyecto → sin guion heredado.
// Grabación opcional: PEL_REC=<carpeta> (vídeo continuo del recorrido). Evidencia de ZIP opcional: PEL_OUT=<carpeta>.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),fss=require('node:fs'),os=require('node:os'),path=require('node:path'),zlib=require('node:zlib'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),Fixtures=require('./fixtures/scene-blender/build.cjs');let server,browser,url,fx;
const REC=process.env.PEL_REC||null,OUT=process.env.PEL_OUT||null;for(const d of [REC,OUT])if(d)fss.mkdirSync(d,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm','.py':'text/plain','.sh':'text/plain','.bat':'text/plain','.txt':'text/plain'};
function unzip(buffer){const end=buffer.length-22,count=buffer.readUInt16LE(end+10),items=new Map();let at=buffer.readUInt32LE(end+16);
 for(let i=0;i<count;i++){const method=buffer.readUInt16LE(at+10),size=buffer.readUInt32LE(at+20),n=buffer.readUInt16LE(at+28),extra=buffer.readUInt16LE(at+30),comment=buffer.readUInt16LE(at+32),local=buffer.readUInt32LE(at+42),name=buffer.subarray(at+46,at+46+n).toString();
  const start=local+30+buffer.readUInt16LE(local+26)+buffer.readUInt16LE(local+28),raw=buffer.subarray(start,start+size);items.set(name,method===8?zlib.inflateRawSync(raw):raw);at+=46+n+extra+comment;}
 return items;}
before(async()=>{fx=path.join(fss.mkdtempSync(path.join(os.tmpdir(),'pel-zip-')),'fx');Fixtures.build(fx);
 server=createServer(async(req,res)=>{try{const p=decodeURIComponent(new URL(req.url,'http://l').pathname),f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader'],slowMo:REC?250:0});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const results=[];const check=(name,cond,detail)=>{results.push({check:name,ok:!!cond,detail});assert.ok(cond,name+' · '+JSON.stringify(detail));};
async function prepareAndDownload(page,tag){
 if(await page.locator('#sceneExportDialog').getAttribute('data-state')==='no3d'){await page.locator('#sePrimary').click();await page.waitForFunction(()=>document.querySelector('#sceneExportDialog').dataset.state==='idle',null,{timeout:120000});}
 await page.locator('#sePrimary').click();await page.waitForFunction(()=>window.RubikSceneExport.state==='ready',null,{timeout:300000});
 const film=await page.locator('#sceneExportFilm').evaluate(n=>({state:n.dataset.film,text:n.hidden?'':n.textContent})).catch(()=>null);
 const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#sePrimary').click()]);const buf=await fs.readFile(await d.path());
 if(OUT)await fs.writeFile(path.join(OUT,tag+'.zip'),buf);await page.evaluate(()=>document.querySelector('#sceneExportDialog').close());
 const z=unzip(buf);return {z,film,manifest:JSON.parse(z.get('manifest.json')),guion:z.has('rubik-pelicula-guion.json')?JSON.parse(z.get('rubik-pelicula-guion.json')):null};}
async function choose(page,effect,profile){
 await page.evaluate(id=>window.RubikPeliculaEfectos.openDeliver(id),effect);await page.waitForSelector('#peliculaEfectosDialog[open]');
 await page.locator('#peliculaDlgTab-'+effect).click();await page.locator('#peliculaProfile').selectOption(profile);await page.locator('#peliculaConfirm').click();}
async function go(page){await page.locator('#peliculaGo').click();await page.waitForFunction(()=>document.querySelector('#sceneExportDialog[open]'));}
test('ZIP = efecto, perfil y revisión elegidos: dos descargas, edición entre elección y exportación, cerrar y volver, cancelar y cambio de proyecto',{timeout:1500000},async t=>{
 const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true,...(REC?{recordVideo:{dir:REC,size:{width:1440,height:900}}}:{})});
 t.after(async()=>{await ctx.close();if(OUT)await fs.writeFile(path.join(OUT,'comprobaciones.json'),JSON.stringify(results,null,1)+'\n');});
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(60000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true'&&window.RubikPeliculaEfectos);
 const P=await page.evaluate(()=>({id:FloorPlanApp.project.id,entry:FloorPlanApp.entryId,updatedAt:FloorPlanApp.project.updatedAt||null}));
 // 1 · Maqueta abierta · revision
 await choose(page,'maqueta-abierta','revision');await go(page);
 check('1 · la Escena para Blender anuncia la película pendiente',/Maqueta abierta/.test(await page.locator('#sceneExportFilm').textContent()),await page.locator('#sceneExportFilm').textContent());
 const A=await prepareAndDownload(page,'A-maqueta-revision');
 check('1 · guion A: efecto y perfil',A.guion?.effect==='maqueta-abierta'&&A.guion?.profile==='revision',A.guion&&{effect:A.guion.effect,profile:A.guion.profile});
 check('1 · guion A: revisión (proyecto, entrada, fecha)',A.guion?.revision?.projectId===P.id&&A.guion?.revision?.entryId===P.entry&&A.guion?.revision?.updatedAt===P.updatedAt,A.guion?.revision);
 check('1 · manifiesto A: película declarada con huella',A.manifest.film?.effect==='maqueta-abierta'&&A.manifest.film?.profile==='revision'&&!!A.manifest.files['rubik-pelicula-guion.json']?.sha256,A.manifest.film);
 check('1 · manifiesto A: proyecto',A.manifest.source.projectId===P.id,A.manifest.source.projectId);
 check('1 · ZIP A lleva el kit que consume el guion',['rubik_blender_rodaje.py','rodar.sh','RODAR-windows.bat'].every(k=>A.z.has(k)),[...A.z.keys()].filter(k=>/rodaje|rodar/.test(k)));
 // 2 · sin editar: Pieza a pieza · entrega1440
 await choose(page,'pieza-a-pieza','entrega1440');await go(page);const B=await prepareAndDownload(page,'B-pieza-entrega1440');
 check('2 · guion B: efecto y perfil nuevos',B.guion?.effect==='pieza-a-pieza'&&B.guion?.profile==='entrega1440'&&B.guion?.seconds>20,B.guion&&{effect:B.guion.effect,profile:B.guion.profile,seconds:B.guion.seconds});
 check('2 · manifiesto B coincide con su guion',B.manifest.film?.effect==='pieza-a-pieza'&&B.manifest.film?.profile==='entrega1440',B.manifest.film);
 check('2 · A y B: misma revisión del proyecto (sin editar)',A.manifest.source.observedProjectSha256===B.manifest.source.observedProjectSha256&&B.guion.revision.updatedAt===A.guion.revision.updatedAt,{a:A.manifest.source.observedProjectSha256.slice(0,12),b:B.manifest.source.observedProjectSha256.slice(0,12)});
 // 3 · editar el mismo proyecto entre la elección y la exportación
 await choose(page,'maqueta-abierta','revision');await go(page);await page.evaluate(()=>document.querySelector('#sceneExportDialog').close());
 const oid=await page.evaluate(()=>FloorPlanApp.project.objects[0].id);await page.evaluate(i=>select({kind:'furn',id:i}),oid);await page.keyboard.press('Delete');await page.waitForFunction(i=>!FloorPlanApp.project.objects.some(o=>o.id===i),oid);
 await page.evaluate(()=>window.RubikSceneExport.open());const C=await prepareAndDownload(page,'C-editado-tras-elegir');
 check('3 · editado tras elegir: el ZIP no lleva el guion de otra revisión',!C.guion&&!('film' in C.manifest),{guion:!!C.guion,film:C.manifest.film||null});
 check('3 · y la interfaz lo dice',C.film?.state==='dropped'&&/proyecto cambió/.test(C.film.text),C.film);
 check('3 · la revisión exportada es la editada',C.manifest.source.observedProjectSha256!==A.manifest.source.observedProjectSha256,null);
 // 4 · cerrar el diálogo de exportación sin preparar y volver a «Escena para Blender»
 await choose(page,'pieza-a-pieza','revision');await go(page);await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#sceneExportDialog[open]'));
 await page.evaluate(()=>window.RubikSceneExport.open());
 check('4 · al volver, la elección sigue y se ve',(await page.locator('#sceneExportFilm').getAttribute('data-film'))==='pending'&&/Pieza a pieza/.test(await page.locator('#sceneExportFilm').textContent()),await page.locator('#sceneExportFilm').textContent());
 const D4=await prepareAndDownload(page,'D-cerrar-y-volver');
 check('4 · el ZIP lleva Pieza a pieza · revision de la revisión actual',D4.guion?.effect==='pieza-a-pieza'&&D4.guion?.profile==='revision'&&D4.manifest.source.observedProjectSha256===C.manifest.source.observedProjectSha256,D4.guion&&{effect:D4.guion.effect,profile:D4.guion.profile});
 // 5 · cancelar en la confirmación del efecto
 await choose(page,'maqueta-abierta','revision');await page.locator('#peliculaCancel').click();await page.evaluate(()=>document.querySelector('#peliculaEfectosDialog').close());
 await page.evaluate(()=>window.RubikSceneExport.open());const E5=await prepareAndDownload(page,'E-cancelar-confirmacion');
 check('5 · cancelar en la confirmación: sin guion',!E5.guion,null);
 // 6 · elegir y cambiar de proyecto antes de exportar
 await choose(page,'maqueta-abierta','revision');await go(page);await page.evaluate(()=>document.querySelector('#sceneExportDialog').close());
 await page.locator('#fileIn').setInputFiles(path.join(fx,'f3-openings.json'));await page.waitForFunction(()=>FloorPlanApp.project?.id==='prj_op10-f3-openings');
 await page.evaluate(()=>window.RubikSceneExport.open());const F6=await prepareAndDownload(page,'F-otro-proyecto');
 check('6 · otro proyecto: sin guion heredado y su propio id',!F6.guion&&F6.manifest.source.projectId==='prj_op10-f3-openings',F6.manifest.source.projectId);
 check('sin errores de página',errors.length===0,errors);
});
