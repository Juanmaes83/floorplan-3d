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
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');
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

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
 test(`el perfil explica para qué sirve Rubik y su primera acción es una entrada existente ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
  const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow});t.after(()=>context.close());
  const page=await context.newPage(),errors=[];page.on('pageerror',error=>errors.push(error.message));
  await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());
  await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
  assert.match(await page.locator('.welcome-eyebrow').textContent(),/inmobiliarias, promotoras y estudios/);
  assert.equal(await page.locator('#welcomeAudiencePurpose').isHidden(),true,'sin perfil no hay texto añadido');
  const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
  await press('#welcomeAudience-real-estate');
  assert.match(await page.locator('#welcomeAudiencePurpose p').textContent(),/comprador puede recorrer en 3D/);
  assert.doesNotMatch(await page.locator('.welcome-audience').textContent(),/personalizad|exclusiv|solo para/i,'no promete herramientas distintas');
  await press('#welcomeAudience-developer');assert.match(await page.locator('#welcomeAudiencePurpose p').textContent(),/dos plantas/);
  // The first action is the same upload entry: it opens the file picker of «Subir un plano».
  const chooser=page.waitForEvent('filechooser',{timeout:8000});await press('#welcomeAudienceStart');await chooser;
  const stored=await page.evaluate(()=>({audience:localStorage.getItem('rubik-professional-audience-v1'),inProject:JSON.stringify(FloorPlanApp.project).includes('developer')}));
  assert.deepEqual(stored,{audience:'developer',inProject:false},'preferencia local, fuera del proyecto');
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
  await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),`entry-${viewport.width}.png`)});
  assert.deepEqual(errors,[]);
 });
}

test('«El plano | La vivienda en 3D» shows the same example drawn and as a real Rubik capture 1440x900',{timeout:60000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 assert.equal(await page.locator('#welcomeView-plan').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.welcome-visual svg').isVisible(),true);
 await page.locator('#welcomeView-home').click();
 assert.equal(await page.locator('#welcomeView-home').getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.welcome-visual svg').isVisible(),false);
 await page.locator('.welcome-shot').evaluate(img=>img.complete&&img.naturalWidth?0:new Promise((ok,ko)=>{img.onload=ok;img.onerror=()=>ko(Error('no image'));}));
 assert.ok(await page.locator('.welcome-shot').evaluate(img=>img.naturalWidth>=600));
 assert.match(await page.locator('.welcome-visual figcaption').textContent(),/Captura real de Rubik/);
 await page.locator('#welcomeView-plan').click();assert.equal(await page.locator('.welcome-shot').isVisible(),false);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])test(`«Recórrela en 3D» and «Soluciones»: a reading path after the entries, cards open on demand ${viewport.width}x${viewport.height}`,{timeout:60000},async t=>{
 const narrow=viewport.width<=1100,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 const order=await page.evaluate(()=>['.welcome-entries','#welcomeWalk','#welcomeSolutions'].map(s=>document.querySelector(s).getBoundingClientRect().top));
 assert.ok(order[0]<order[1]&&order[1]<order[2],'entries, then the 3D walk band, then the solutions');
 assert.match(await page.locator('#welcomeWalk h2').textContent(),/recórrela en 3D/);
 assert.deepEqual(await page.locator('.solutions-phases strong').allTextContents(),['Empezar','Preparar','Distribuir','Amueblar','Revisar y guardar']);
 assert.equal(await page.locator('.solutions-card').count(),5);assert.equal(await page.locator('.solutions-phases svg.icon').count(),5);
 const bodyH=id=>page.locator(`#solutionsBody-${id}`).evaluate(b=>b.getBoundingClientRect().height);
 assert.ok(await bodyH('real-estate')<2,'cards start closed: not everything at once');
 const head=page.locator('[data-audience="real-estate"] .solutions-head');await head.scrollIntoViewIfNeeded();
 if(narrow){await head.tap();}else{await head.hover();}
 await page.waitForTimeout(350);assert.ok(await bodyH('real-estate')>20,'opens on hover (mouse) or tap');
 assert.equal(await head.getAttribute('aria-expanded'),'true','announced state matches what is seen (mouse, tap)');
 if(!narrow){await page.mouse.move(2,2);await page.waitForTimeout(350);assert.equal(await head.getAttribute('aria-expanded'),'false','closed again when the mouse leaves');await head.hover();await page.waitForTimeout(350);await head.click();await page.waitForTimeout(350);assert.equal(await head.getAttribute('aria-expanded'),'false','a click toggles what is seen: it closes while the mouse stays');assert.ok(await bodyH('real-estate')<2);await page.mouse.move(2,2);await page.waitForTimeout(350);await page.waitForTimeout(350);assert.ok(await bodyH('real-estate')<2,'closes when the mouse leaves');
  await head.focus();await page.keyboard.press('Enter');await page.waitForTimeout(350);assert.equal(await head.getAttribute('aria-expanded'),'true');assert.ok(await bodyH('real-estate')>20,'keyboard opens it');}
 assert.doesNotMatch(await page.locator('#welcomeSolutions').textContent(),/\bIA\b|[Ee]nlace|SKP|FBX|USDZ|GLB|DXF|1:50|1:100/,'no promise of features that are not in master');
 const press=async s=>{const l=page.locator(s).first();await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};
 await press('#welcomeAudience-interior');await page.waitForTimeout(350);
 assert.equal(await page.locator('.solutions-card').first().getAttribute('data-audience'),'interior');assert.ok(await bodyH('interior')>20,'the chosen field opens first');
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),true);
 for(const id of ['#welcomeWalk','#welcomeSolutions']){await page.locator(id).scrollIntoViewIfNeeded();await page.screenshot({path:require('node:path').join(require('node:os').tmpdir(),`sol-${id.slice(8)}-${viewport.width}.png`)});}
 assert.deepEqual(errors,[]);
});

test('«Recorrer el ejemplo en 3D» opens the example in the 3D walk 1440x900',{timeout:240000,skip:!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: 3D cannot load offline'},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 await page.locator('#welcomeWalkExample').click();
 await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&document.querySelector('#modes3d [data-mode="walk"]')?.classList.contains('on'),null,{timeout:200000});
 assert.equal(await page.locator('#welcomeDialog[open]').count(),0);assert.deepEqual(errors,[]);
});
