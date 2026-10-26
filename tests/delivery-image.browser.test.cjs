// Delivery image in Chromium: what «Compartir imagen» downloads is a composed picture where the home fills the image
// (overview reframed to the whole home), the project data and the brand sit in their own band, and the preview is the
// very same bytes as the download. Example (one level) at 1440×900 and 390×844, the two-level fixture building with a
// brand, landscape and portrait, contact only when the professional asks for it. Pixels are inspected, not the DOM.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{execFile}=require('node:child_process'),{chromium}=require('playwright');
const B=require('../js/building-core.js'),P=require('../js/project-package.js'),T=require('../js/tracing-core.js'),F=require('./fixtures/building-fixture.cjs');
const root=path.resolve(__dirname,'..'),shots=process.env.DELIVERY_SHOTS||null,cache=new Map();
// A small PNG logo (Rubik only accepts converted PNG logos).
const LOGO='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAAAYCAYAAACbU/80AAAAKElEQVR4nO3BAQ0AAADCoPdPbQ43oAAAAAAAAAAAAAAAAAAAAAAA4G8hOAABzCpR2gAAAABJRU5ErkJggg==';
let server,url,browser;
before(async()=>{server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
 res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader']});if(shots)await fs.mkdir(shots,{recursive:true});});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
const curl=t=>new Promise((res,rej)=>execFile('curl',['--fail','--silent','--show-error','--max-time','30',t],{maxBuffer:20e6},(e,o)=>e?rej(e):res(o)));
async function open(t,viewport){const ctx=await browser.newContext({viewport,acceptDownloads:true,isMobile:viewport.width<1000,hasTouch:viewport.width<1000});t.after(()=>ctx.close());
 const page=await ctx.newPage(),errors=[];page.setDefaultTimeout(120000);page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/npm/three@0.160.0/**',async r=>{const target=r.request().url();let p=cache.get(target);if(!p){p=require('./helpers/three-module.cjs')(target,()=>curl(target));cache.set(target,p);}await r.fulfill({status:200,contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await p});});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D&&window.FloorPlanDeliveryImage);return {page,errors};}
async function present(page,{brand,title}={}){
 let id=null;if(brand)id=await page.evaluate(([n,logo])=>FloorPlanBrand.saveProfile(FloorPlanBrandUI.store,{name:n,logo,phone:'600 123 456',email:'hola@estudionorte.es'}).id,[brand,LOGO]);
 await page.locator('#guidePresent:visible, #presentationBtn:visible').first().click();await page.locator('#presentationConfig[open]').waitFor();
 if(id){await page.locator('.brand-config .brand-select').selectOption(id);if(title)await page.locator('#brandDeliveryTitle').fill(title);}
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});}
const idle=page=>page.waitForFunction(()=>!document.querySelector('#shareDialog').hasAttribute('aria-busy'));
// The downloaded file, checked against the preview, and the share of the image area the home occupies.
async function take(page,tag,format){
 if(format)await page.locator(`.share-format [data-format="${format}"]`).click();await idle(page);
 const {href,src,name,contact}=await page.evaluate(()=>({href:document.querySelector('#shareDownload').href,src:document.querySelector('.share-preview').src,name:document.querySelector('#shareDownload').download,contact:document.querySelector('#shareDialog').dataset.contact}));
 const pending=page.waitForEvent('download');await page.locator('#shareDownload').click();const d=await pending,chunks=[];for await(const c of await d.createReadStream())chunks.push(c);const bytes=Buffer.concat(chunks);
 assert.equal(src,href,`${tag}: the preview is the downloaded image`);assert.ok(bytes.equals(Buffer.from(href.split(',')[1],'base64')),`${tag}: same bytes`);
 if(shots)await fs.writeFile(path.join(shots,tag+'.png'),bytes);
 const px=await page.evaluate(async([u,f])=>{const A={image:FloorPlanDeliveryImage.imageArea(f,f==='landscape'?'side':'band')},i=new Image();i.src=u;await i.decode();const c=document.createElement('canvas');c.width=i.width;c.height=i.height;const x=c.getContext('2d');x.drawImage(i,0,0);
  const d=x.getImageData(0,0,A.image.w,A.image.h).data,bg=[d[0],d[1],d[2]];let a=A.image.w,b=A.image.h,e=-1,g=-1;
  for(let y=0;y<A.image.h;y+=2)for(let X=0;X<A.image.w;X+=2){const k=(y*A.image.w+X)*4;if(Math.abs(d[k]-bg[0])+Math.abs(d[k+1]-bg[1])+Math.abs(d[k+2]-bg[2])>30){a=Math.min(a,X);e=Math.max(e,X);b=Math.min(b,y);g=Math.max(g,y);}}
  return {width:i.width,height:i.height,fx:(e-a)/A.image.w,fy:(g-b)/A.image.h};},[href,format||'landscape']);
 return {name,contact,...px};}
const close=page=>page.locator('#shareDialog .share-actions button',{hasText:'Cerrar'}).click();

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`delivery image: the home fills the picture, the preview is the file ${viewport.width}x${viewport.height}`,{timeout:600000},async t=>{
 const {page,errors}=await open(t,viewport);await page.locator('#welcomeExample').click();await present(page);
 await page.locator('#presentationShare').click();await page.locator('#shareDialog[open]').waitFor();
 assert.equal(await page.locator('#shareContact').count(),0,'no brand: no contact option');
 const land=await take(page,`${viewport.width}-overview-landscape`);
 assert.deepEqual([land.width,land.height,land.name],[1600,1000,'rubik-sota-vivienda-horizontal.png']);
 assert.ok(land.fy>=.8&&land.fx*land.fy>=.55,`landscape overview fills the image area (${land.fx}, ${land.fy})`);
 const port=await take(page,`${viewport.width}-overview-portrait`,'portrait');
 assert.deepEqual([port.width,port.height,port.name],[1080,1350,'rubik-sota-vivienda-vertical.png']);
 assert.ok(port.fx>=.65&&port.fy>=.75,`portrait overview fills the picture (${port.fx}, ${port.fy})`);
 assert.equal(await page.locator('.share-format [data-format="portrait"]').getAttribute('aria-pressed'),'true');
 await close(page);assert.deepEqual(errors,[]);
});

test('delivery image with a brand: name and data in their band, contact only when asked',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});await page.locator('#welcomeExample').click();
 await present(page,{brand:'Estudio Norte Arquitectura y Promoción Inmobiliaria del Mediterráneo',title:'Ático con terraza, bloque B, escalera 2 — vivienda tipo C de cuatro dormitorios'});
 await page.locator('#presentationShare').click();await page.locator('#shareDialog[open]').waitFor();
 const plain=await take(page,'brand-landscape');assert.equal(plain.contact,'hidden','contact is off by default');
 await page.locator('#shareContact').check();const withContact=await take(page,'brand-portrait-contact','portrait');assert.equal(withContact.contact,'shown');
 await close(page);assert.deepEqual(errors,[]);
});

test('delivery image of a two-level building names the level it shows',{timeout:900000},async t=>{
 const {page,errors}=await open(t,{width:1440,height:900});
 await require('./editor-fixture.cjs')(page);const fx=F.build(),{entries}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo);
 await page.locator('#uploadIn').setInputFiles({name:'edificio.zip',mimeType:'application/zip',buffer:Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer())});
 await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levels===2,null,{timeout:60000});
 await present(page);await page.locator('#presentationShare').click();await page.locator('#shareDialog[open]').waitFor();
 const levelLabel=await page.evaluate(()=>FloorPlanPresentation.plan.stops[0].levelName);assert.ok(levelLabel,'the overview belongs to a level');
 const two=await take(page,'two-levels-landscape');assert.ok(two.fy>=.8,`two-level overview fills the height (${two.fy})`);
 await close(page);assert.deepEqual(errors,[]);
});
