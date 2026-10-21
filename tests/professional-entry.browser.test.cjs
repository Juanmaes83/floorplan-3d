const {test,before,after}=require('node:test');
const assert=require('node:assert/strict');
const {createServer}=require('node:http');
const fs=require('node:fs/promises');
const path=require('node:path');
const {chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
let server,browser,url;

before(async()=>{
 server=createServer(async(req,res)=>{try{
  const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));
  if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');
  res.end(await fs.readFile(file));
 }catch{res.statusCode=404;res.end();}});
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(resolve=>server?.close(resolve));});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
 test(`perfil opcional y entradas intactas ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
  const context=await browser.newContext({viewport});t.after(()=>context.close());
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
  const beforeProject=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
  const ids=await page.locator('.welcome-audience-option').evaluateAll(nodes=>nodes.map(node=>node.id));
  assert.deepEqual(ids,['welcomeAudience-architecture','welcomeAudience-real-estate','welcomeAudience-developer','welcomeAudience-renovation','welcomeAudience-interior']);
  assert.deepEqual(await page.locator('.welcome-entry strong').allTextContents(),['Subir un plano','Crear desde cero','Probar el ejemplo']);
  assert.equal(await page.evaluate(()=>!!(document.querySelector('.welcome-entries').compareDocumentPosition(document.querySelector('.welcome-audience'))&Node.DOCUMENT_POSITION_FOLLOWING)),true,'el perfil opcional va tras las tres acciones');
  await page.locator('#welcomeAudience-developer').click();
  assert.equal(await page.locator('#welcomeAudience-developer').getAttribute('aria-pressed'),'true');
  assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),beforeProject,'perfil no modifica el plano');
  await page.reload();await page.locator('#welcomeDialog[open]').waitFor();
  assert.equal(await page.locator('#welcomeAudience-developer').getAttribute('aria-pressed'),'true');
  await page.locator('#welcomeAudience-architecture').focus();await page.keyboard.press('Enter');
  assert.equal(await page.locator('#welcomeAudience-developer').getAttribute('aria-pressed'),'false');
  assert.equal(await page.locator('#welcomeAudience-architecture').getAttribute('aria-pressed'),'true');
  await page.locator('#welcomeAudience-architecture').click();
  assert.equal(await page.locator('[aria-pressed="true"].welcome-audience-option').count(),0,'perfil se puede omitir');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true,'sin desplazamiento horizontal');
  await page.locator('#welcomeExample').click();
  assert.equal(await page.locator('#welcomeDialog[open]').count(),0,'perfil no impide entrar');
  assert.deepEqual(errors,[]);
 });
}
