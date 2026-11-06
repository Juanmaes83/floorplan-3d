// «Legal y autoría» on the Home: the platform's existing, approved legal and authorship dialog (#legalDialog) opens from
// the Home's top bar for every field and language, over the Home and without changing the route, and closing it
// returns to the Home with its focus, field and project unchanged. The footer link and #legal-y-uso keep working, and
// there is never more than one legal dialog. No legal text is written here: the assertions read the existing one.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(new URL(req.url,'http://local').pathname==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':file.endsWith('.webp')?'image/webp':'text/html');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>{await new Promise(r=>server.close(r));});
async function setup(t,viewport={width:1440,height:900},hash=''){const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});t.after(()=>browser.close());const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000}),page=await context.newPage(),errors=[];page.setDefaultTimeout(10000);page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());await page.goto(url+hash);return {page,context,errors};}
const project=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));
const state=page=>page.evaluate(()=>({welcome:document.querySelector('#welcomeDialog').open,legal:document.querySelectorAll('#legalDialog[open]').length,dialogs:[...document.querySelectorAll('dialog[open]')].map(d=>d.id),hash:location.hash,focus:document.activeElement?.id||null}));
async function shot(page,name){if(process.env.LEGAL_ARTIFACTS){await fs.mkdir(process.env.LEGAL_ARTIFACTS,{recursive:true});await page.screenshot({path:path.join(process.env.LEGAL_ARTIFACTS,name+'.png')});}}
// The approved text, as it already is in index.html (#legalDialog), per language.
const APPROVED={es:{label:'Legal y autoría',title:'Legal y uso',text:'No se autoriza la venta, reventa ni distribución de la plataforma sin autorización expresa del titular.',other:'Sale, resale or distribution'},
 en:{label:'Legal & authorship',title:'Legal & use',text:"Sale, resale or distribution of this platform is not authorized without the owner's express permission.",other:'No se autoriza la venta'},
 zh:{label:'法律与作者',title:'法律与使用',text:'未经权利人明确授权，不得销售、转售或分发本平台。',other:'No se autoriza la venta'}};
const AUDIENCES=['architecture','real-estate','developer','renovation','interior'];

for(const viewport of [{width:1440,height:900},{width:390,height:844}])test(`Home «Legal y autoría» for every field, keyboard and touch, back to the Home ${viewport.width}x${viewport.height}`,async t=>{
 const {page,errors}=await setup(t,viewport);const size=`${viewport.width}x${viewport.height}`;
 assert.equal((await state(page)).welcome,true,'the Home is open');const before=await project(page);
 const visible=()=>page.evaluate(()=>{const b=document.querySelector('#welcomeLegal');if(!b||b.closest('[hidden]'))return null;const r=b.getBoundingClientRect(),cs=getComputedStyle(b);
  const others=[...document.querySelectorAll('#welcomeDialog .welcome-nav > *')].filter(n=>n!==b).map(n=>n.getBoundingClientRect());
  return {text:b.textContent,tag:b.tagName,x:r.left,right:r.right,top:r.top,h:r.height,w:r.width,inView:r.left>=0&&r.right<=innerWidth,overlap:others.some(o=>o.left<r.right-1&&o.right>r.left+1&&o.top<r.bottom-1&&o.bottom>r.top+1),font:parseFloat(cs.fontSize),visibility:cs.visibility,display:cs.display};});
 // Visible with no field chosen and with each of the five fields.
 for(const field of [null,...AUDIENCES]){
  if(field){const o=page.locator('#welcomeAudience-'+field);await o.scrollIntoViewIfNeeded();await o.click();assert.equal(await o.getAttribute('aria-pressed'),'true',`${size} ${field} chosen`);}
  await page.locator('#welcomeLegal').scrollIntoViewIfNeeded();const v=await visible();
  assert.ok(v&&v.display!=='none'&&v.visibility==='visible',`${size} ${field||'no field'}: «Legal y autoría» shown`);assert.equal(v.text,'Legal y autoría');assert.equal(v.tag,'BUTTON');
  assert.ok(v.inView,`${size} ${field||'no field'}: inside the screen ${JSON.stringify(v)}`);assert.equal(v.overlap,false,`${size}: no overlap in the top bar`);
  assert.ok(v.h>=40&&v.font>=13,`${size}: readable, full touch target ${JSON.stringify(v)}`);
 }
 await page.locator('#welcomeAudience-interior').scrollIntoViewIfNeeded();await page.locator('#welcomeLegal').scrollIntoViewIfNeeded();await shot(page,`${size}-home`);
 // Keyboard: Enter opens the existing dialog over the Home, one legal dialog, the route unchanged.
 await page.locator('#welcomeLegal').focus();await page.keyboard.press('Enter');await page.locator('#legalDialog[open]').waitFor();
 let s=await state(page);assert.equal(s.legal,1,'one legal dialog');assert.equal(s.welcome,true,'the Home stays underneath');assert.equal(s.hash,'#inicio','the Home route is kept');
 const text=await page.locator('#legalDialog').innerText();assert.match(text,/Juan Manuel Espinosa Galant · Rubik Sota/,'authorship');assert.ok(text.includes(APPROVED.es.text),'the approved text, unchanged');
 assert.ok(await page.evaluate(()=>{const r=document.querySelector('#legalDialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth&&document.documentElement.scrollWidth<=innerWidth;}),`${size}: the dialog fits the screen`);
 await shot(page,`${size}-legal`);
 // A second request while it is open never stacks another one.
 await page.evaluate(()=>{window.FloorPlanLegal.open();window.FloorPlanLegal.open();});assert.equal((await state(page)).legal,1);
 // Escape returns to the Home, focus back on the entry.
 await page.keyboard.press('Escape');await page.waitForFunction(()=>!document.querySelector('#legalDialog').open);
 s=await state(page);assert.equal(s.welcome,true,'back on the Home');assert.equal(s.focus,'welcomeLegal','focus returns to «Legal y autoría»');assert.equal(s.hash,'#inicio');
 // Touch/click and the dialog's own «Cerrar».
 await page.locator('#welcomeLegal').click();await page.locator('#legalDialog[open]').waitFor();await page.locator('#legalClose').click();
 s=await state(page);assert.equal(s.legal,0);assert.equal(s.welcome,true);assert.equal(s.focus,'welcomeLegal');
 // The field and the project are as they were.
 assert.equal(await page.locator('#welcomeAudience-interior').getAttribute('aria-pressed'),'true','the chosen field is kept');assert.deepEqual(await project(page),before,'project unchanged');
 assert.deepEqual(errors,[]);
});

test('ES / EN / ZH: label and approved text in the chosen language, kept after closing',async t=>{
 const {page,errors}=await setup(t);
 for(const lang of ['es','en','zh']){
  assert.equal(await page.evaluate(()=>LANG),lang);const a=APPROVED[lang];
  assert.equal(await page.locator('#welcomeLegal').textContent(),a.label,`${lang} label`);
  await page.locator('#welcomeLegal').click();await page.locator('#legalDialog[open]').waitFor();
  const text=await page.locator('#legalDialog').innerText();assert.equal(await page.locator('#legalTitle').textContent(),a.title,`${lang} title`);
  assert.ok(text.includes(a.text),`${lang}: approved text`);assert.ok(!text.includes(a.other),`${lang}: no other language mixed in`);
  await shot(page,`1440x900-legal-${lang}`);
  await page.locator('#legalClose').click();assert.equal(await page.evaluate(()=>LANG),lang,`${lang} kept after closing`);assert.equal((await state(page)).welcome,true);
  await page.locator('#welcomeLanguage').click();
 }
 assert.deepEqual(errors,[]);
});

test('direct #legal-y-uso and the footer link keep working; one legal dialog; Home entries still work afterwards',async t=>{
 const {page,errors}=await setup(t,{width:1440,height:900},'#legal-y-uso');
 await page.locator('#legalDialog[open]').waitFor();let s=await state(page);assert.equal(s.legal,1,'#legal-y-uso opens it directly');assert.equal(s.dialogs.length,1,'only the legal dialog');
 await page.locator('#legalClose').click();assert.equal((await state(page)).legal,0);
 // Home → example → editor: the footer link opens the same dialog (and keeps its permanent address).
 await page.goto(url);await page.locator('#welcomeLegal').click();await page.locator('#legalClose').click();
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>location.hash==='#editor'&&!document.querySelector('#welcomeDialog').open);
 const example=await project(page);await page.locator('#legalLink').click();await page.locator('#legalDialog[open]').waitFor();
 s=await state(page);assert.equal(s.legal,1);assert.equal(s.hash,'#legal-y-uso','the footer keeps its permanent address');
 await page.locator('#legalClose').click();assert.deepEqual(await project(page),example,'project unchanged');
 // Regression: the Home entries after using «Legal y autoría».
 await page.goto(url+'#inicio');await page.locator('#welcomeDialog[open]').waitFor();await page.locator('#welcomeLegal').click();await page.locator('#legalClose').click();
 await page.locator('#welcomeBlank').click();await page.locator('#roomDesignDialog[open]').waitFor();await page.locator('#roomDesignCancel').click();await page.locator('#welcomeDialog[open]').waitFor();
 const chooser=page.waitForEvent('filechooser');await page.locator('#welcomeUpload').click();await chooser;
 assert.deepEqual(errors,[]);
});
