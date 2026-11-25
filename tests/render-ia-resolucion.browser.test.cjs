// Render IA · catálogo canónico y descargas 2K–4K con dimensiones reales (encargo 121ad35a §3). Sin proveedor real.
'use strict';
const {abrirFicha,accion}=require('./helpers-perla-entregar.cjs');
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAIAAAABCAYAAAD0In+KAAAAEUlEQVR42mP8z8DwnwEIGBkZAQ0WAv/W3h2LAAAAAElFTkSuQmCC';
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});


// §3 (encargo 121ad35a) · catálogo canónico y descargas 2K/4K. El proveedor se intercepta con imágenes LOCALES de prueba
// (tests/fixtures/render-ia): no hay llamada a OpenAI. Se comprueba que todas las variantes parten de la MISMA captura,
// el estado del selector (Nórdico una vez; Industrial y Mediterráneo), y los píxeles reales de cada PNG descargado.
const FIX=n=>'data:image/png;base64,'+require('node:fs').readFileSync(path.join(root,'tests/fixtures/render-ia',n)).toString('base64');
for(const [fixture,w,h,expect] of [['variante-1536x1024.png',1536,1024,{'2k':[2560,1707],'4k':[3840,2560]}],['variante-1920x1080.png',1920,1080,{'2k':[2560,1440],'4k':[3840,2160]}]])
test(`Render IA · catálogo y descargas 2K/4K desde la misma vista (${w}×${h})`,{timeout:400000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],external=[],sent=[];const image=FIX(fixture);page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',async r=>{const u=r.request().url();
  if(u.startsWith(url+'api/render')){const b=JSON.parse(r.request().postData()||'{}');sent.push(b);return r.fulfill({status:200,contentType:'application/json',body:JSON.stringify({image,model:'gpt-image-1',style:b.style,usage:null,cost:null,generatedAt:'2026-11-25T12:00:00Z'})});}
  if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();external.push(u);return r.abort();});
 await page.goto(url);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>window.FloorPlanAIRender&&window.FloorPlanProjectViews&&window.RubikRenderStyles);
 const workspace=page.locator('#professionalWorkspace'),dialog=page.locator('#aiRenderDialog');
 await page.locator('#workArea-deliver').click();await workspace.locator('[data-route="prepare-views"]').first().click();
 await page.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});const before=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 await abrirFicha(page,'P2');await workspace.locator('.panel-f').getByRole('button',{name:'Generar imágenes',exact:true}).click();await workspace.getByRole('button',{name:'Render IA de: Vista general',exact:true}).click();await dialog.waitFor();
 // Selector: el catálogo canónico, con Nórdico una sola vez (y sin «Escandinavo» aparte).
 const options=await dialog.locator('#aiRenderStyle option').allInnerTexts();
 assert.deepEqual(options,['Luz natural','Cálido','Nórdico','Industrial','Mediterráneo','Premium inmobiliario']);
 await dialog.locator('#aiRenderAgree').check();await dialog.locator('#aiRenderToken').fill('access-123');
 const files=[];
 for(const style of ['industrial','mediterranean','scandinavian']){
  await dialog.locator('#aiRenderStyle').selectOption(style);await dialog.locator('#aiRenderGo').click();
  await page.waitForFunction(s=>FloorPlanAIRender.results.some(r=>r.style===s),style);await dialog.locator('#aiRenderDownload-4k').waitFor();
  for(const key of ['2k','4k']){const btn=dialog.locator('#aiRenderDownload-'+key);
   assert.equal(await btn.getAttribute('data-native'),'false','se amplía desde el original: no es nativo');
   assert.match(await btn.innerText(),new RegExp(`^Descargar ${key.toUpperCase()} reescalado desde ${w} × ${h} · ${expect[key][0]} × ${expect[key][1]}$`));
   const dl=page.waitForEvent('download');await btn.click();const d=await dl;const bytes=require('node:fs').readFileSync(await d.path());
   assert.equal(bytes.subarray(1,4).toString(),'PNG');assert.deepEqual([bytes.readUInt32BE(16),bytes.readUInt32BE(20)],expect[key],'píxeles reales del PNG descargado');
   assert.equal(d.suggestedFilename(),`rubik-sota-render-ia-${style}-${key}-${expect[key][0]}x${expect[key][1]}.png`);files.push(d.suggestedFilename());
   if(process.env.RENDER_IA_OUT)await d.saveAs(path.join(process.env.RENDER_IA_OUT,d.suggestedFilename()));}
  assert.match(await dialog.locator('.ai-render-hires-note').innerText(),new RegExp(`Archivo descargado: ${expect['4k'][0]} × ${expect['4k'][1]} px · reescalado desde ${w} × ${h}\\. Los pequeños detalles de tu proyecto en alta resolución 2K–4K\\.`));}
 // Todas las variantes parten de la misma captura y encuadre; solo cambia el estilo.
 assert.equal(sent.length,3);assert.ok(sent.every(b=>b.image===sent[0].image),'misma captura fuente para todas las variantes');
 assert.deepEqual(sent.map(b=>b.style),['industrial','mediterranean','scandinavian']);
 assert.equal(files.length,6);assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),before,'el proyecto no cambia');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);});
