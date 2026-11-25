// REGLA PERMANENTE (propietario, 20/11/2026): en español o inglés NUNCA se muestra texto en chino.
// Recorre la interfaz REAL con el proyecto de ejemplo (que guarda sus nombres en chino) en ES y EN: plano, panel de cada
// mueble y de cada estancia, diálogo de interiores R03 con sus holguras y sección de techo R02-A. Falla con el texto exacto
// y su sitio si aparece un solo carácter CJK visible. La fuente única de nombres visibles es window.FloorPlanDisplayName.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
before(async()=>{server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname,file=path.resolve(root,'.'+(p==='/'?'/index.html':decodeURIComponent(p)));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

// Texto VISIBLE con CJK (nodos de texto con caja visible, más title/aria-label/placeholder/value de controles visibles).
// SIN excepciones (decisión del propietario del 20/11/2026): el selector de idioma usa los códigos ES / EN / ZH.
const FIND=()=>{const re=/[\p{Script=Han}⺀-⿿　-〿぀-ヿ㐀-䶿一-鿿豈-﫿＀-￯]/u,out=[];
 const visible=el=>{if(!el||!el.isConnected)return false;const st=getComputedStyle(el);if(st.display==='none'||st.visibility==='hidden')return false;const r=el.getBoundingClientRect();return r.width>0&&r.height>0;};
 const w=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);for(let n;(n=w.nextNode());){const p=n.parentElement;if(!p||p.closest('script,style,template'))continue;if(re.test(n.nodeValue)&&visible(p))out.push({where:p.closest('[id]')?.id||p.tagName,text:n.nodeValue.trim().slice(0,60)});}
 for(const el of document.querySelectorAll('[title],[aria-label],[placeholder],input,select,option')){for(const v of [el.title,el.getAttribute('aria-label'),el.placeholder,el.tagName==='INPUT'?el.value:'',el.tagName==='SELECT'?el.selectedOptions?.[0]?.textContent:''])if(v&&re.test(v)&&visible(el.tagName==='OPTION'?el.parentElement:el))out.push({where:el.id||el.tagName,text:String(v).slice(0,60)});}
 for(const t of document.querySelectorAll('svg text'))if(re.test(t.textContent)&&visible(t))out.push({where:'svg:'+(t.closest('[id]')?.id||''),text:t.textContent.slice(0,60)});
 return out;};

for(const lang of ['es','en'])
test(`sin chino visible en ${lang.toUpperCase()}: plano, paneles, interiores R03 con holguras, techo R02-A, áreas de trabajo y cantidades`,{timeout:300000},async t=>{
 const context=await browser.newContext({viewport:{width:1440,height:900}});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 await page.evaluate(l=>setLang(l),lang);await page.waitForTimeout(400);
 assert.equal(await page.evaluate(()=>LANG),lang);
 const found=[];const scan=async where=>{for(const f of await page.evaluate(FIND))found.push({at:where,...f});};
 await scan('plano');
 const ids=await page.evaluate(()=>({furn:project.objects.map(o=>o.id),rooms:project.rooms.map(r=>r.id)}));
 for(const id of ids.furn){await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},id);await page.waitForTimeout(60);await scan('panel mueble '+id);}
 for(const id of ids.rooms){await page.evaluate(id=>{select({kind:'room',id});drawer('panel',true);},id);await page.waitForTimeout(60);await scan('panel estancia '+id);}
 for(const id of await page.evaluate(()=>project.objects.filter(o=>RubikCabinetBridge.isCabinet(o)).map(o=>o.id))){
  await page.evaluate(id=>{select({kind:'furn',id});drawer('panel',true);},id);await page.waitForTimeout(150);
  await page.locator('#aInterior').first().click();await page.locator('.r03-rubik-dialog').waitFor();await scan('interior R03 '+id);await page.evaluate(()=>RubikCabinetRubikUI.close());}
 // Áreas de trabajo (Analizar, Presupuestar, Entregar, Mi estudio…) y cuadro de cantidades.
 for(const id of await page.evaluate(()=>[...document.querySelectorAll('[id^="workArea-"]')].map(b=>b.id))){
  await page.locator('#'+id).click();await page.waitForTimeout(250);await scan('área '+id);
  // UX-312 C4 (aprobado por el propietario el 22/11/2026): «Preparar entregables» (E3) vive solo en Entregar · D5.
  if(id==='workArea-studio')assert.equal(await page.locator('#professionalWorkspace [data-route="e3-entregas"]').count(),0,'C4: E3 solo en Entregar');
  if(id==='workArea-deliver'){
   const trigger=page.locator('#professionalWorkspace [data-route="e3-entregas"]');
   assert.equal(await trigger.count(),1,'one E3 entry per workspace');
   assert.equal(await trigger.getAttribute('aria-haspopup'),'dialog');
   assert.equal(await trigger.evaluate(button=>button.classList.contains('primary')),false,'E3 is a secondary action');
   assert.equal(await trigger.evaluate((button,area)=>{
    const card=button.closest('.professional-card');
    const anchor=area==='workArea-deliver'?document.querySelector('[data-group="documentation"] [data-module="sheet"]'):document.querySelector('[data-module="studio"]');
    return !!(anchor?.compareDocumentPosition(card)&Node.DOCUMENT_POSITION_FOLLOWING);
   },id),true,'existing actions come before E3');
   await trigger.focus();await page.keyboard.press('Enter');
   const e3=page.locator('#e3Entregas[open]');
   const next=e3.locator('[data-route="e3-siguiente"]');
   await e3.waitFor();
   assert.equal(await e3.locator('input[type="checkbox"]').count(),await page.evaluate(()=>RubikE3Core.CATALOGO.length),'una casilla por entregable del catálogo E3 (14 con Blueprint y Despiece)');
   assert.equal(await e3.evaluate(dialog=>document.activeElement?.id===dialog.getAttribute('aria-labelledby')),true);
   await scan('E3 elegir '+id);
   await next.click();await next.waitFor();await scan('E3 previsualizar '+id);
   await next.click();await e3.locator('.e3-prep').first().waitFor();await scan('E3 preparar '+id);
   await page.keyboard.press('Escape');await e3.waitFor({state:'hidden'});
   assert.equal(await trigger.evaluate(button=>document.activeElement===button),true,'closing E3 restores focus');
  }
 }
 await page.locator('#workArea-design').click().catch(()=>{});await page.waitForTimeout(200);
 await page.evaluate(()=>window.FloorPlanQuantityUI?.open());await page.waitForTimeout(300);await scan('cantidades');
 await page.evaluate(()=>document.querySelectorAll('dialog[open]').forEach(d=>d.close()));
 assert.deepEqual(found,[],'texto chino visible:\n'+found.slice(0,15).map(f=>`${f.at} · ${f.where} · «${f.text}»`).join('\n'));
 assert.deepEqual(errors,[]);
});


test('E3: ten previews decode and navigation stays clear of the Assistant on small screens', async t=>{
 for(const viewport of [{width:393,height:659},{width:844,height:390}]){
  await t.test(viewport.width+'×'+viewport.height,async sub=>{
   const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});sub.after(()=>context.close());
   const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
   await page.goto(url);await require('./editor-fixture.cjs')(page);
   await page.locator('#workArea-deliver').click();
   await page.locator('#professionalWorkspace [data-route="e3-entregas"]').tap();
   const dialog=page.locator('#e3Entregas[open]');
   const next=dialog.locator('[data-route="e3-siguiente"]');
   const withoutOverlap=async()=>{
    assert.equal(await dialog.evaluate(d=>{
     const clip=d.getBoundingClientRect();
     const a=d.querySelector('#assistantAccess').getBoundingClientRect();
     const c=d.querySelector('.e3-cuerpo').getBoundingClientRect();
     const footer=d.querySelector('.e3-pie').getBoundingClientRect();
     return a.top>=c.bottom-1 && a.bottom<=clip.bottom &&
      footer.top>=c.bottom-1 && footer.bottom<=clip.bottom &&
      d.scrollWidth===d.clientWidth;
    }),true,'assistant and navigation are separate from the scrolling content');
   };
   await next.waitFor();
   await dialog.locator('#assistantAccess').waitFor();
   await withoutOverlap();
   const images=await dialog.locator('.e3-mini img').all();
   assert.equal(images.length,10);
   for(const image of images){
    await image.scrollIntoViewIfNeeded();
    assert.equal(await image.evaluate(async i=>{await i.decode();return i.naturalWidth;}),360);
   }
   await withoutOverlap();
   const checked=dialog.getByRole('checkbox',{checked:true});
   while(await checked.count())await checked.last().uncheck();
   assert.equal(await next.isEnabled(),false);
   assert.match(await dialog.getByRole('status').innerText(),/Selecciona al menos un entregable/);
   await dialog.getByRole('checkbox',{name:/Vistas reales del proyecto/}).check();
   await next.tap();
   await dialog.getByText('Aún no hay vistas preparadas', {exact:false}).waitFor();
   await next.waitFor();
   await withoutOverlap();
   await next.tap();
   await dialog.getByRole('button',{name:'Preparar las vistas'}).waitFor();
   await withoutOverlap();
   await page.keyboard.press('Escape');
   await dialog.waitFor({state:'hidden'});
   assert.equal(await page.locator('#professionalWorkspace [data-route="e3-entregas"]').evaluate(n=>n===document.activeElement),true);
  });
 }
});

test('selector de idioma: ES / EN / ZH, el chino sigue disponible y en ES/EN no hay ningún carácter chino en el control', async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const read=()=>page.evaluate(()=>{const b=document.getElementById('langBtn');return {lang:LANG,text:b.textContent.trim(),current:b.querySelector('.is-current')?.textContent,label:b.getAttribute('aria-label')};});
 const seen=[];for(let i=0;i<4;i++){seen.push(await read());await page.locator('#langBtn').click();await page.waitForTimeout(150);}
 assert.deepEqual(seen.map(s=>s.lang),['es','en','zh','es'],'ES → EN → ZH → ES');
 for(const s of seen){assert.equal(s.text,'ES · EN · ZH');assert.equal(s.current,s.lang.toUpperCase());}
 for(const s of seen.filter(s=>s.lang!=='zh'))assert.doesNotMatch(s.label,/[\u3400-\u9fff]/,'etiqueta accesible sin chino en '+s.lang);
 assert.match(seen[0].label,/Cambiar a inglés/);assert.match(seen[1].label,/Switch to Chinese/);
});

test('FloorPlanDisplayName: traducción, red de seguridad por tipo y genérico; en chino se respeta el original', async t=>{
 const context=await browser.newContext();t.after(()=>context.close());const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await require('./editor-fixture.cjs')(page);
 const r=await page.evaluate(()=>{const o={};for(const l of ['es','en','zh']){setLang(l);o[l]=[FloorPlanDisplayName('衣柜','wardrobe'),FloorPlanDisplayName('不存在的名字','wardrobe'),FloorPlanDisplayName('不存在的名字','tipo-inexistente'),FloorPlanDisplayName('Mi armario','wardrobe'),FloorPlanDisplayName('𠀀','tipo-inexistente')];}setLang('es');return o;});
 assert.deepEqual(r.es,['Armario','Armario','Elemento','Mi armario','Elemento']);
 assert.equal(r.en[0],'Wardrobe');assert.equal(r.en[2],'Item');assert.equal(r.en[3],'Mi armario');assert.equal(r.en[4],'Item');
 assert.equal(r.zh[1],'不存在的名字','en chino se muestra el original');assert.equal(r.zh[4],'𠀀');
 for(const v of [...r.es,...r.en])assert.doesNotMatch(v,/\p{Script=Han}/u);
});
