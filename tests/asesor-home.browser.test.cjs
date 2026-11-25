// Home · «Hablar con el Asesor» (encargo 89bae1ff §2). Chromium + Playwright, escritorio y móvil táctil.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
let server,browser,url;
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u.endsWith('/')?u+'index.html':u));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(fs.readFileSync(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
// §2 (encargo 89bae1ff) · Home → «Hablar con el Asesor» junto al retrato: seis perfiles, ida y vuelta, teclado y toque.
// La profesión llega preseleccionada con su saludo y sus preguntas; la sesión es «simulada» y no empieza sola.
// Registro de red: CERO peticiones fuera del servidor local (ninguna a Nuance).
const IDS=['architecture','real-estate','developer','renovation','interior','construction'];
for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`Home → Asesor por profesión ${viewport.width}x${viewport.height}`,{timeout:600000},async t=>{
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());const external=[];
 await context.route('**/*',r=>{const h=new URL(r.request().url()).hostname;if(h!=='127.0.0.1'){external.push(h);return r.abort();}return r.continue();});
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const [i,id] of IDS.entries()){
  await page.goto(url+'#inicio');await page.locator('#welcomeDialog[open]').waitFor({timeout:120000});
  const opt=page.locator('#welcomeAudience-'+id);await opt.scrollIntoViewIfNeeded();
  const press=async l=>{if(touch)await l.tap();else if(i%2){await l.focus();await page.keyboard.press('Enter');}else await l.click();};
  await press(opt);const talk=page.locator('#welcomeAudienceAdvisor');await talk.waitFor();
  assert.ok((await talk.boundingBox()).height>=44,'objetivo táctil de 44 px');
  assert.match(await talk.getAttribute('aria-label'),/^Hablar con el Asesor como /);
  await press(talk);await page.waitForURL(/\/labs\/asesor-rubik\/\?perfil=/);
  const lab=await page.evaluate(()=>({perfil:document.getElementById('profile').value,saludo:document.querySelector('.profile-greeting')?.textContent||'',
   ejemplos:document.querySelectorAll('#chips .chip[data-profile-example]').length,badge:document.getElementById('badgeSim').textContent,transporte:document.getElementById('transport').value,
   iniciar:!document.getElementById('start').disabled,termina:document.getElementById('close').disabled}));
  assert.equal(lab.perfil,id,'profesión preseleccionada');assert.equal(lab.saludo,AsesorProfilesFor(id).saludo);assert.equal(lab.ejemplos,3);
  assert.equal(lab.transporte,'sim');assert.equal(lab.badge,'Sesión simulada');assert.equal(lab.iniciar,true,'espera a que la persona pulse');assert.equal(lab.termina,true,'no hay conversación abierta');
  await press(page.locator('#advBackHome'));await page.locator('#welcomeDialog[open]').waitFor({timeout:120000});}
 assert.deepEqual(external,[],'cero peticiones externas (ninguna a Nuance)');assert.deepEqual(errors,[]);});
function AsesorProfilesFor(id){const ctx={};new Function('self',fs.readFileSync(path.join(root,'labs/asesor-rubik/profiles.js'),'utf8'))(ctx);return ctx.AsesorProfiles.get(id);}
