// Phase B5: «Envíanos tu plano» from the welcome. The person adds plan files and a contact, accepts the use of their
// data, and gets ONE ZIP (plans + solicitud.json + solicitud.txt) plus an e-mail to the service with the request
// written in; the dialog says to attach the ZIP. Nothing is uploaded. Closing without sending returns to the welcome.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{execFileSync}=require('node:child_process'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..'),SHOTS=process.env.QA_SHOTS||'';let server,browser,url;
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.glb':'model/gltf-binary'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname,f=path.resolve(root,'.'+(p==='/'?'/index.html':p));if(!f.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const PDF=Buffer.from('%PDF-1.4\n% plano de prueba\n');

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Phase B5: send us your plan from the welcome ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[],requests=[];page.setDefaultTimeout(20000);page.on('pageerror',e=>errors.push(e.message));
 page.on('request',r=>{if(r.method()!=='GET')requests.push(r.url());});
 await page.route('**/*',r=>{const u=r.request().url();if(u.startsWith(url)||u.startsWith('blob:')||u.startsWith('data:'))return r.continue();return r.abort();});
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 const dialog=page.locator('#planServiceDialog');
 await page.locator('#welcomeService').click();await dialog.waitFor();assert.equal(await page.locator('#welcomeDialog[open]').count(),0);
 assert.match(await dialog.locator('#planServiceNote').innerText(),/lo revisa una persona[\s\S]*presupuesto y plazo antes de empezar/);assert.doesNotMatch(await dialog.innerText(),/€/);
 // Closing without sending goes back to the welcome.
 await page.keyboard.press('Escape');await page.locator('#welcomeDialog[open]').waitFor();
 await page.locator('#welcomeService').click();await dialog.waitFor();
 await dialog.locator('#planServiceGo').click();assert.match(await dialog.locator('#planServiceStatus').innerText(),/Acepta el uso de tus datos/);
 await dialog.locator('#planServiceAgree').check();await dialog.locator('#planServiceGo').click();assert.match(await dialog.locator('#planServiceStatus').innerText(),/Indica tu nombre/);
 await dialog.locator('#planServiceName').fill('Ana Pérez');await dialog.locator('#planServiceEmail').fill('ana@example.com');await dialog.locator('#planServiceGo').click();
 assert.match(await dialog.locator('#planServiceStatus').innerText(),/Añade al menos un plano/);
 await dialog.locator('#planServiceFiles').setInputFiles([{name:'planta baja.pdf',mimeType:'application/pdf',buffer:PDF},{name:'foto.jpg',mimeType:'image/jpeg',buffer:Buffer.from([0xff,0xd8,0xff,0xd9])}]);
 assert.deepEqual(await dialog.locator('#planServiceList li').allInnerTexts().then(a=>a.map(s=>s.split(' · ')[0])),['planta baja.pdf','foto.jpg']);
 assert.equal(await dialog.locator('#planServiceName').inputValue(),'Ana Pérez','typed data survives adding files');
 await dialog.getByRole('button',{name:'Quitar foto.jpg'}).click();assert.equal(await dialog.locator('#planServiceList li').count(),1);
 await dialog.locator('#planServiceNeed-3d').check();await dialog.locator('#planServiceNotes').fill('Piso en Valencia, quiero verlo amueblado.');
 if(SHOTS){await fs.mkdir(SHOTS,{recursive:true});await page.screenshot({path:path.join(SHOTS,`b5-${viewport.width}-form.png`)});}
 const download=page.waitForEvent('download');await dialog.locator('#planServiceGo').click();const d=await download;
 assert.match(d.suggestedFilename(),/^rubik-envianos-tu-plano-\d{8}-ana-perez\.zip$/);
 await dialog.locator('#planServiceDone').waitFor();assert.match(await dialog.locator('#planServiceDone').innerText(),/Adjunta ese archivo al correo y envíalo a juanmaes83@gmail\.com/);
 const sent=await page.evaluate(()=>FloorPlanPlanService.sent.mailto);assert.ok(sent.startsWith('mailto:juanmaes83@gmail.com?subject='));assert.match(decodeURIComponent(sent),/Nombre: Ana Pérez[\s\S]*Necesito: Plano 2D editable, Vivienda en 3D[\s\S]*Adjunto el archivo rubik-envianos-tu-plano-/);
 // The ZIP holds the plan bytes and the request, under safe names.
 const zip=await d.path(),list=execFileSync('python3',['-I','-c','import sys,zipfile,json;z=zipfile.ZipFile(sys.argv[1]);print(json.dumps({n:z.read(n).decode("latin-1") for n in z.namelist()}))',zip]).toString();
 const entries=JSON.parse(list);assert.deepEqual(Object.keys(entries).sort(),['planos/planta_baja.pdf','solicitud.json','solicitud.txt']);
 assert.equal(entries['planos/planta_baja.pdf'],PDF.toString('latin1'));const req=JSON.parse(Buffer.from(entries['solicitud.json'],'latin1').toString());assert.equal(req.contact.email,'ana@example.com');assert.deepEqual(req.needs,['plan','3d']);
 if(SHOTS)await page.screenshot({path:path.join(SHOTS,`b5-${viewport.width}-done.png`)});
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#planServiceDialog').open);
 assert.deepEqual(requests,[],'nothing is uploaded');assert.deepEqual(errors,[]);
});
