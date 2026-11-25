// §2.1 · Panel de memoria consentida (comodidad del dispositivo), traspaso autorizado y rechazo en modo cliente sin alterar el proyecto.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
let server,browser,url;
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u.endsWith('/')?u+'index.html':u));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`memoria consentida y rechazo cliente ${viewport.width}x${viewport.height}`,{timeout:600000},async t=>{
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());const external=[],sent=[];
 await context.route('**/*',r=>{const u=new URL(r.request().url());if(u.hostname!=='127.0.0.1'){external.push(u.hostname);return r.abort();}if(r.request().method()!=='GET')sent.push(u.pathname);return r.continue();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const press=async s=>{const l=page.locator(s);await l.scrollIntoViewIfNeeded();if(touch)await l.tap();else{await l.focus();await page.keyboard.press(/checkbox/.test(await l.getAttribute('type')||'')?'Space':'Enter');}};
 await page.goto(url+'labs/asesor-rubik/');await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:120000});
 // Accesibilidad: nombres accesibles, región etiquetada, estado anunciado y objetivos táctiles.
 for(const id of ['memConsent','memPref','memNote','memKeep','memErase','memHandoff'])assert.ok((await page.locator('#'+id).evaluate(e=>e.labels?.[0]?.textContent||e.textContent||'')).trim().length>3,id+' con nombre');
 assert.equal(await page.locator('#memStatus').getAttribute('aria-live'),'polite');
 assert.match(await page.locator('#memScope').textContent(),/no es privada ni separa de forma segura/);
 for(const id of ['memKeep','memErase'])assert.ok((await page.locator('#'+id).boundingBox()).height>=44||!touch,id+' 44 px');
 // Sin consentimiento: campos desactivados y nada guardado.
 assert.equal(await page.locator('#memFields').isDisabled(),true);
 assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('rubik-asistente')).length),0);
 await press('#memConsent');await page.waitForFunction(()=>!document.getElementById('memFields').disabled);
 await page.locator('#memPref').fill('Ana');await page.locator('#memNote').fill('IBAN ES91 2100 0418 4502 0005 1332');await press('#memKeep');
 assert.match(await page.locator('#memStatus').textContent(),/dato sensible/);
 assert.ok(!(await page.evaluate(()=>JSON.stringify(localStorage))).includes('ES91'),'el IBAN no se guarda');
 await page.locator('#memNote').fill('Prefiere tonos cálidos');await press('#memKeep');assert.match(await page.locator('#memStatus').textContent(),/Guardado/);
 await page.reload();await page.waitForFunction(()=>document.body.dataset.ready==='1',null,{timeout:120000});
 assert.equal(await page.locator('#memPref').inputValue(),'Ana','persiste tras recargar');
 // Traspaso: solo lo autorizado; revocar impide.
 assert.equal((await page.evaluate(()=>AsesorMemory.handoff('r'))).reason,'no-autorizado');
 await press('#memHandoff');const h=await page.evaluate(()=>AsesorMemory.handoff('Revisamos el salón'));
 assert.deepEqual(h.entrega,{campos:['resumen','nombrePreferido'],resumen:'Revisamos el salón',nombrePreferido:'Ana'});
 await press('#memHandoff');assert.equal((await page.evaluate(()=>AsesorMemory.handoff('x'))).reason,'no-autorizado');
 // Rechazo en modo cliente: el proyecto queda idéntico y la interfaz explica el límite.
 const frame=()=>page.frameLocator('#rubik').locator('body');const project=()=>page.evaluate(()=>JSON.stringify(document.getElementById('rubik').contentWindow.FloorPlanApp.project));
 const before=await project();await press('#start');await page.waitForFunction(()=>AsesorLab.sim?.state==='live');
 await page.evaluate(()=>document.querySelector('#results').replaceChildren());await press('#chips .chip[data-say*="cuesta"]');
 await page.locator('#results .denied').waitFor();assert.match(await page.locator('#results .denied').textContent(),/En modo cliente esta acción no está permitida/);
 assert.equal(await project(),before,'proyecto idéntico');
 await press('#close');await press('#memErase');assert.equal(await page.evaluate(()=>Object.keys(localStorage).filter(k=>k.startsWith('rubik-asistente')).length),0,'borrado total');
 const dir=path.join(root,'docs/qa/asistente-unificado');fs.mkdirSync(dir,{recursive:true});
 await page.locator('#memoryPanel').screenshot({path:path.join(dir,`panel-memoria-${viewport.width}.png`)});
 fs.writeFileSync(path.join(dir,`red-${viewport.width}.json`),JSON.stringify({externas:external,peticionesNoGET:sent},null,1));
 assert.deepEqual(external,[],'cero peticiones externas (ninguna a Nuance)');assert.deepEqual(sent,[],'ningún dato enviado');assert.deepEqual(errors,[]);});
