// «Tu marca profesional» (premium UX cut C), end to end at 1440×900, 390×844 and 844×390. Inspects the real files the
// client receives: the sheet SVG with and without a brand, the presentation card, and (desktop, with three.js) the PNG
// views and manifest of the presentation ZIP. Covers validation (empty name, bad phone, javascript: link, SVG logo),
// several profiles, the per-project choice, snapshots (editing a profile does not alter a file already made), removal,
// that neither the project JSON nor the editable package carries brand data, and old projects without brand data.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const Package=require('../js/project-package.js');
const root=path.resolve(__dirname,'..'),shots=process.env.BRAND_SHOTS||null;
let server,browser,url;
before(async()=>{server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.webp')?'image/webp':file.endsWith('.json')?'application/json':file.endsWith('.png')?'image/png':file.endsWith('.glb')?'model/gltf-binary':'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});if(shots)await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});
function entries(zip){const v=new DataView(zip.buffer,zip.byteOffset,zip.byteLength),end=zip.length-22;assert.equal(v.getUint32(end,true),0x06054b50);const count=v.getUint16(end+10,true),items=new Map();let offset=v.getUint32(end+16,true);for(let i=0;i<count;i++){const length=v.getUint32(offset+24,true),n=v.getUint16(offset+28,true),extra=v.getUint16(offset+30,true),comment=v.getUint16(offset+32,true),local=v.getUint32(offset+42,true),name=zip.subarray(offset+46,offset+46+n).toString();const start=local+30+v.getUint16(local+26,true)+v.getUint16(local+28,true),data=zip.subarray(start,start+length);assert.equal(Package.crc(data),v.getUint32(offset+16,true));items.set(name,data);offset+=46+n+extra+comment;}return items;}

for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}])
test(`professional brand ${viewport.width}x${viewport.height}`,{timeout:420000},async t=>{
 const mobile=viewport.width<=1100,name=`${viewport.width}x${viewport.height}`;
 const context=await browser.newContext({viewport,isMobile:mobile,hasTouch:mobile,acceptDownloads:true});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errors.push(m.text());});
 page.on('dialog',d=>d.accept());
 await page.route('https://cdn.jsdelivr.net/**',async r=>{if(!process.env.THREE_LOCAL_DIR)return r.abort();try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const shot=async id=>{if(shots)await page.screenshot({path:path.join(shots,`${name}-${id}.png`)});};
 const projectBefore=await page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
 const openMenuItem=async id=>{await page.evaluate(id=>{const d=document.getElementById(id).closest('details');if(d)d.open=true;document.getElementById(id).click();},id);};
 const sheetSvg=async()=>{const dl=page.waitForEvent('download',{timeout:20000});await page.locator('#sheetDownload').click();return (await fs.readFile(await (await dl).path())).toString();};

 // An old project without brand data: the sheet is the same as before (no brand group, no credit).
 await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();
 assert.equal(await page.locator('#sheetBrand select').inputValue(),'','«Sin marca» by default');
 const plain=await sheetSvg();assert.ok(!plain.includes('data-brand'),'no brand without a choice');assert.ok(plain.includes('Cotas y superficies orientativas'));
 await page.locator('#sheetClose').click();

 // Management dialog and validation.
 await openMenuItem('brandManage');await page.locator('#brandDialog[open]').waitFor();
 await shot('01-brand-empty');
 const save=()=>page.locator('#brandSave').click();
 await save();assert.match(await page.locator('#brand-name-error').textContent(),/nombre comercial/);
 await page.fill('#brand-name','Inmobiliaria Sol');await page.fill('#brand-phone','llámame');await save();assert.match(await page.locator('#brand-phone-error').textContent(),/teléfono/);
 await page.fill('#brand-phone','+34 910 000 000');await page.fill('#brand-web','javascript:alert(1)');await save();assert.match(await page.locator('#brand-web-error').textContent(),/http/);
 await page.fill('#brand-web','inmobiliariasol.es');await page.fill('#brand-email','hola@inmobiliariasol.es');await page.fill('#brand-person','Lucía Martín');
 await page.setInputFiles('#brand-logo',{name:'logo.svg',mimeType:'image/svg+xml',buffer:Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>')});
 await page.waitForFunction(()=>/no SVG/.test(document.querySelector('#brand-logo-error').textContent));
 await page.setInputFiles('#brand-logo',path.join(__dirname,'fixtures','brand-logo.png'));assert.equal(await page.locator('#brandLogoFile').textContent(),'brand-logo.png');await page.locator('.brand-logo-preview:not([hidden])').waitFor();
 assert.match(await page.locator('.brand-logo-preview').getAttribute('src'),/^data:image\/png;base64,/,'the logo is re-encoded as PNG');
 await save();await page.waitForFunction(()=>document.querySelectorAll('.brand-item').length===1);
 await page.locator('#brandNew').click();await page.fill('#brand-name','Estudio Norte');await page.fill('#brand-email','hola@norte.es');await save();await page.waitForFunction(()=>document.querySelectorAll('.brand-item').length===2);
 const layout=await page.evaluate(()=>{const d=document.querySelector('#brandDialog').getBoundingClientRect();return {inside:d.left>=0&&d.right<=innerWidth+1,hs:document.documentElement.scrollWidth>innerWidth+1};});assert.deepEqual(layout,{inside:true,hs:false});
 await shot('02-brand-saved');await page.locator('#brandClose').click();

 // Sheet signed by «Inmobiliaria Sol»: logo, name, contact and credit in the delivered SVG; the notices stay.
 await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();
 const sol=await page.evaluate(()=>FloorPlanBrand.readProfiles(FloorPlanBrandUI.store).profiles.find(p=>p.name==='Inmobiliaria Sol').id);
 await page.locator('#sheetBrand select').selectOption(sol);await page.waitForTimeout(300);
 const branded=await sheetSvg();
 for(const s of ['data-brand="true"','Inmobiliaria Sol','Lucía Martín · +34 910 000 000','hola@inmobiliariasol.es · inmobiliariasol.es','Preparado por Inmobiliaria Sol con Rubik Sota','Cotas y superficies orientativas','href="data:image/png;base64,'])assert.ok(branded.includes(s),`sheet contains ${s}`);
 assert.ok(!/javascript:|<script|onload=/i.test(branded),'no active content in the sheet');
 await shot('03-sheet-branded');
 // Editing the profile later does not change the file already delivered; the next sheet uses the new name.
 await page.evaluate(id=>{const p=FloorPlanBrand.readProfiles(FloorPlanBrandUI.store).profiles.find(p=>p.id===id);FloorPlanBrand.saveProfile(FloorPlanBrandUI.store,{...p,name:'Inmobiliaria Sol y Mar'});},sol);
 assert.ok(branded.includes('Preparado por Inmobiliaria Sol con'),'the delivered SVG keeps its snapshot');
 await page.locator('#sheetClose').click();await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();
 assert.ok((await sheetSvg()).includes('Preparado por Inmobiliaria Sol y Mar con Rubik Sota'));await page.locator('#sheetClose').click();

 // Brand data never enters the project, its history, its JSON export or the library entry.
 assert.equal(await page.evaluate(()=>JSON.stringify(FloorPlanApp.project)),projectBefore,'project unchanged');
 const json=await (async()=>{const dl=page.waitForEvent('download',{timeout:20000});await openMenuItem('exportJson');return (await fs.readFile(await (await dl).path())).toString();})();
 assert.ok(!/Inmobiliaria|brd_|Preparado por/.test(json),'exported JSON carries no brand data');
 assert.ok(!/Inmobiliaria/.test(await page.evaluate(()=>localStorage.getItem('rubik-sota-project-library-v1')||'')),'library entry carries no brand data');

 // Presentation: «Entrega al cliente» settings, brand on the card, intro on the overview, contact on the last view.
 if(process.env.THREE_LOCAL_DIR){
  await page.evaluate(()=>FloorPlanPresentation.open());await page.locator('#presentationConfig[open]').waitFor();
  assert.equal(await page.locator('.brand-config .brand-select').inputValue(),sol,'the project choice is shared with the sheet');
  await page.fill('#brandDeliveryTitle','Ático en Chamberí');await page.locator('#brandDeliveryTitle').dispatchEvent('change');
  await page.fill('#brandDeliveryIntro','Propuesta de distribución para la reunión del jueves.');await page.locator('#brandDeliveryIntro').dispatchEvent('change');
  await page.locator('.presentation-room-row').nth(0).locator('input').check();await shot('04-config');
  await page.getByRole('button',{name:'Iniciar presentación'}).click();
  await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:90000});
  const card=await page.evaluate(()=>({brand:document.querySelector('.presentation-brand')?.innerText,intro:document.querySelector('.presentation-intro')?.textContent}));
  assert.match(card.brand,/Inmobiliaria Sol y Mar[\s\S]*Ático en Chamberí/);assert.match(card.intro,/reunión del jueves/);await shot('05-presentation-overview');
  const stops=await page.evaluate(()=>FloorPlanPresentation.plan.stops.length);await page.evaluate(n=>FloorPlanPresentation.go?FloorPlanPresentation.go(n-1):null,stops);
  for(let i=1;i<stops&&!(await page.locator('.presentation-next').count());i++){await page.locator('.presentation-controls button',{hasText:'Siguiente'}).click();await page.waitForFunction(()=>document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});}
  assert.match(await page.locator('.presentation-next').textContent(),/Siguiente paso: contacta con Inmobiliaria Sol y Mar · Lucía Martín/);await shot('06-presentation-last');
  if(!mobile){
   await page.waitForFunction(()=>!document.querySelector('#presentationBatch').disabled,null,{timeout:60000});
   const dl=page.waitForEvent('download',{timeout:120000});await page.locator('#presentationBatch').click();const zip=await fs.readFile(await (await dl).path()),files=entries(zip),manifest=JSON.parse(files.get('presentation.json').toString());
   assert.deepEqual(Object.keys(manifest).sort(),['center','entryId','format','portableProject','projectId','resources','revision','viewRepresentation','version','views'].sort(),'manifest keys unchanged (no contract change)');
   assert.ok(!/Inmobiliaria|brd_/.test(files.get('presentation.json').toString()+files.get('editable-project.zip').toString('latin1')),'no brand data in the manifest or the editable project');
   const strip=await page.evaluate(async b64=>{const img=new Image();img.src='data:image/png;base64,'+b64;await img.decode();const c=document.createElement('canvas');c.width=img.width;c.height=img.height;const x=c.getContext('2d');x.drawImage(img,0,0);const band=Math.max(44,Math.round(img.height*.075)),p=x.getImageData(img.width-4,img.height-Math.round(band/2),1,1).data,line=x.getImageData(Math.round(img.width/2),img.height-band,1,1).data;return {w:img.width,h:img.height,bg:[p[0],p[1],p[2]],line:[line[0],line[1],line[2]]};},files.get('views/view-001.png').toString('base64'));
   assert.equal(strip.w,manifest.views[0].width);assert.equal(strip.h,manifest.views[0].height);
   assert.ok(strip.bg.every(v=>v>=225),`the PNG view carries the light brand strip (${strip.bg})`);assert.deepEqual(strip.line,[213,217,219],'strip top rule');
  }
  await page.locator('#presentationClose').click();await page.waitForFunction(()=>!FloorPlanPresentation.active&&!document.body.classList.contains('presentation-exiting')&&location.hash!=='#presentacion',null,{timeout:60000});
 }

 // The presentation exit ends with history.back() to #editor, which closes open dialogs: wait for the exit to finish
 // (not only for `active`, which turns false when the exit starts). People cannot open menus during the exit.
 // Removing a profile: its projects go back to «Sin marca» and deliver the complete sheet as before.
 await openMenuItem('brandManage');await page.locator('#brandDialog[open]').waitFor();
 await page.getByRole('button',{name:'Borrar «Inmobiliaria Sol y Mar»'}).click();await page.waitForFunction(()=>document.querySelectorAll('.brand-item').length===1);await page.locator('#brandClose').click();
 await openMenuItem('openSheet');await page.locator('#sheetDialog[open]').waitFor();assert.equal(await page.locator('#sheetBrand select').inputValue(),'');assert.ok(!(await sheetSvg()).includes('data-brand'));
 await page.locator('#sheetClose').click();
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false);
 assert.deepEqual(errors,[]);
});
