// UX-312 Home (encargo del propietario, 23/11/2026): cabecera aprobada, prueba del caso, «Qué recibe tu cliente» (16 rutas
// y 10 destinos E3), prioridad por profesión, 28 accesos de fase (Armarios incluido), servicios compactos (E01), modo real
// del Asistente (E03), FAQ, footer en cuatro grupos y texto legal. Cada acceso se comprueba por su resultado real.
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{createServer}=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
let server,url;
const TYPES={'.js':'text/javascript','.cjs':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.jpg':'image/jpeg','.png':'image/png','.svg':'image/svg+xml','.html':'text/html'};
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://local').pathname;const file=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));if(!file.startsWith(root+path.sep))throw Error('path');res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(await fs.readFile(file));}catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>{await new Promise(r=>server.close(r));});
async function open(t,viewport={width:1440,height:900}){const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});t.after(()=>browser.close());
 const narrow=viewport.width<1000,context=await browser.newContext({viewport,isMobile:narrow,hasTouch:narrow}),page=await context.newPage(),errors=[],external=[];page.setDefaultTimeout(15000);
 page.on('pageerror',e=>errors.push(e.message));await page.route('**/*',r=>{const h=new URL(r.request().url()).hostname;if(h==='127.0.0.1')return r.continue();external.push(h);return r.abort();});
 await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();await page.waitForLoadState('load');
 const press=async s=>{const l=page.locator(s).first();await l.scrollIntoViewIfNeeded();if(narrow)await l.tap();else await l.click();};return {page,errors,external,press,narrow};}
const project=page=>page.evaluate(()=>JSON.stringify(FloorPlanApp.project));

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Home UX-312: contenido aprobado, inventarios y sin desbordes ${viewport.width}x${viewport.height}`,{timeout:120000},async t=>{
 const {page,errors,external}=await open(t,viewport);
 assert.equal(await page.locator('#welcomeDialogTitle').textContent(),'Imaginar. Diseñar. Construir. Presentar. Recorrer.');
 assert.match(await page.locator('.welcome-intro .lead').textContent(),/^Cinco fases para llevar un proyecto desde la idea hasta la experiencia final\. Una única firma profesional\.$/);
 assert.equal(await page.locator('#welcomeHeroPrimary').textContent(),'Probar la vivienda de ejemplo');assert.equal(await page.locator('#welcomeHeroSecondary').textContent(),'Ver qué puedes entregar');
 for(const id of ['welcomeUpload','welcomeBlank','welcomeExample','welcomeService','welcomeLanguage','welcomeLegal'])assert.equal(await page.locator('#'+id).count(),1,id+' se conserva');
 // Prueba del caso: 5 pasos, imágenes reales cargadas y rotuladas.
 assert.equal(await page.locator('#welcomeCase .welcome-case-step').count(),5);
 for(const img of await page.locator('#welcomeCase img').all()){await img.scrollIntoViewIfNeeded();await img.evaluate(i=>i.complete&&i.naturalWidth?0:new Promise((ok,ko)=>{i.onload=ok;i.onerror=()=>ko(Error('imagen '+i.src));}));}
 assert.equal((await page.locator('#welcomeCase figcaption').allTextContents()).filter(x=>/Captura real/.test(x)).length,5);
 assert.match(await page.locator('#welcomeCase [data-step="works"]').textContent(),/fechas ilustrativas y sin importes/,'aviso original de Evolución');
 // Demos con sus avisos originales y «Personalizar esta demo».
 assert.match(await page.locator('[data-demo="dibujo-vivo"]').textContent(),/Sin IA/);assert.equal(await page.locator('#welcomeDemoCustomize-evolucion-obra').count(),1);
 // «Qué recibe tu cliente»: 16 rutas indexadas + 10 destinos E3, con «Abrir en Entregar».
 const codes=await page.locator('#welcomeDeliverablesAll [data-entrega-code]').evaluateAll(n=>n.map(x=>x.dataset.entregaCode).sort());
 assert.deepEqual(codes,['D1','D2','D3','D4','D5','P1','P2','P3','P4','P5','P6','P7','S1','S2','T1','T2']);
 assert.equal(await page.locator('#welcomeDeliverablesE3 [data-e3]').count(),10,'los 10 destinos E3');
 // El catálogo completo se revela a demanda con su botón (aria-expanded) y se vuelve a plegar.
 assert.equal(await page.locator('#welcomeDeliverablesAll').isHidden(),true);await page.locator('#welcomeDeliverablesAllToggle').click();assert.equal(await page.locator('#welcomeDeliverablesAll').isVisible(),true);assert.equal(await page.locator('#welcomeDeliverablesAllToggle').getAttribute('aria-expanded'),'true');await page.locator('#welcomeDeliverablesAllToggle').click();assert.equal(await page.locator('#welcomeDeliverablesAll').isHidden(),true);
 assert.equal(await page.locator('#welcomeDeliverables .deliverable-cards [data-entrega-code]').count(),5);
 // 37 accesos de fase: 27 originales + Armarios + 9 capacidades integradas o de laboratorio (#321, corrección 1).
 assert.equal(await page.locator('#welcomeDialog [data-module="studio-vision"] .studio-opcion').count(),37);
 for(const r of ['studio-disenar-plantas','studio-disenar-variantes','studio-disenar-catalogos','studio-presentar-estudio','studio-presentar-foto','studio-presentar-blueprint','studio-presentar-despiece','studio-recorrer-archivo','studio-recorrer-marca'])assert.equal(await page.locator('#welcomeDialog [data-route="'+r+'"]').count(),1,r);
 // Bloque independiente de servicios retirado; FAQ por temas.
 assert.equal(await page.locator('#welcomeAIServices').count(),0);assert.equal(await page.locator('.welcome-faq-topic').count(),4);assert.equal(await page.locator('.welcome-faq-panel:visible').count(),0,'FAQ compacta al abrir');
 assert.equal(await page.locator('#welcomeDeliverablesAll [data-entrega-code="D4"] img, #welcomeDeliverablesAll [data-entrega-code="T2"] img').count(),2,'D4 y T2 con muestra auténtica');
 assert.equal(await page.locator('#welcomeDialog [data-route="studio-disenar-armarios"]').count(),1);
 assert.equal(await page.locator('#welcomeDialog h2',{hasText:'Imaginar. Diseñar. Construir. Presentar. Recorrer.'}).count(),0,'solo el h1 lleva el título');
 // 14 capacidades del registro y 9 servicios, con condiciones a demanda (E01) y el modo real del Asistente (E03).
 assert.equal(await page.evaluate(()=>FloorPlanCapabilities.CAPABILITIES.length),14);
 assert.equal(await page.locator('#welcomeModules .ai-service').count(),9);
 assert.equal(await page.locator('#welcomeModules .ai-service details.ai-service-more').count(),9);
 const ia=await page.locator('#welcomeDialog [data-module="studio-ia"]').textContent();assert.match(ia,/consulta guiada/);assert.match(ia,/sin modelo de lenguaje/);assert.doesNotMatch(ia,/Automatiza tareas/);
 // FAQ y footer.
 assert.equal(await page.locator('#welcomeFaq details').count(),10);
 assert.deepEqual(await page.locator('#welcomeFooter .welcome-footer-group h2').allTextContents(),['Quiénes somos','Producto y precios','Ayuda y dudas','Legal y autoría']);
 assert.equal(await page.locator('#welcomePricing').textContent(),'Las tarifas y los planes aún no están definidos. Puedes probar la vivienda de ejemplo.');
 assert.match(await page.locator('.welcome-foot').textContent(),/se guardan en este navegador/);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1&&![...document.querySelectorAll('#welcomeDialog *')].some(e=>{const r=e.getBoundingClientRect();return r.width&&r.right>innerWidth+1;})),true,'sin desbordes');
 assert.deepEqual(external,[]);assert.deepEqual(errors,[]);
});

test('Home UX-312: la profesión ordena entregables y soluciones sin tocar el proyecto 1440x900',{timeout:120000},async t=>{
 const {page,errors,press}=await open(t);const before=await project(page);
 const top=()=>page.locator('#welcomeDeliverables .deliverable-cards [data-entrega-code]').evaluateAll(n=>n.map(x=>x.dataset.entregaCode));
 for(const [aud,first] of [['architecture','D2'],['real-estate','P3'],['developer','P6'],['renovation','T2'],['interior','P5'],['construction','S1']]){
  await press('#welcomeAudience-'+aud);assert.equal((await top())[0],first,aud);
  assert.equal(await page.locator('#welcomeHeroAudience').isVisible(),true);
  assert.equal(await page.locator('.solutions-card:visible').count(),1,aud+': su solución primero');
  await press('#welcomeSolutionsAll');assert.equal(await page.locator('.solutions-card:visible').count(),6,'Ver todas las soluciones');await press('#welcomeSolutionsAll');
  await press('#welcomeAudience-'+aud);}
 assert.equal(await project(page),before);assert.deepEqual(errors,[]);
});

for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`Home UX-312: accesos reales (entregar, presupuesto, Armarios, FAQ, footer, legal) ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 // «Ver qué puedes entregar» deja el foco en los resultados.
 {const {page,press}=await open(t,viewport);await press('#welcomeHeroSecondary');await page.waitForFunction(()=>document.activeElement?.id==='welcomeDeliverablesTitle');}
 // Un entregable abre Entregar en su tarjeta, con el foco en su acción (no vuelve a la Home).
 {const {page,errors,press}=await open(t,viewport);await press('#welcomeDeliver-P7');
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open&&FloorPlanProfessionalUI.area==='deliver'&&document.activeElement?.closest?.('[data-entrega-code="P7"]'));
  assert.deepEqual(errors,[]);}
 // Prueba del caso → Presupuestar sobre la vivienda de ejemplo.
 {const {page,errors,press}=await open(t,viewport);await press('#welcomeCase-budget');await page.waitForFunction(()=>window.FloorPlanProfessionalUI?.area==='budget',null,{timeout:20000});assert.deepEqual(errors,[]);}
 // Armarios sin armario seleccionado: explica qué falta y abre Muebles; no cambia el proyecto.
 {const {page,errors}=await open(t,viewport);const before=await project(page);
  await page.evaluate(()=>{const d=document.querySelector('#welcomeDialog [data-module="studio-vision"]');const col=[...d.querySelectorAll('.studio-opcion')].find(b=>b.dataset.route==='studio-disenar-armarios');col.click();});
  await page.waitForFunction(()=>!document.querySelector('#welcomeDialog').open);
  await page.waitForFunction(()=>/selecciona un armario/i.test(document.body.innerText),null,{timeout:8000});assert.equal(await project(page),before);assert.deepEqual(errors,[]);}
 // FAQ desde el footer y legal sin datos de identificación personal.
 {const {page,errors,press}=await open(t,viewport);await press('#welcomeFooterFaq');await page.waitForFunction(()=>document.activeElement?.id==='welcomeFaqTitle');
  await press('#welcomeFooterLegal');await page.locator('#legalDialog[open]').waitFor();const legal=await page.locator('#legalDialog').innerText();
  assert.match(legal,/Se prohíbe la explotación comercial de RUBIK SOTA/);assert.match(legal,/629 554 870/);assert.doesNotMatch(legal,/\bDNI\b|\b\d{8}\s?-?[A-Z]\b/);
  await page.keyboard.press('Escape');assert.equal(await page.locator('#welcomeDialog[open]').count(),1,'vuelve a la Home');assert.deepEqual(errors,[]);}
 // Idioma desde el footer: EN sin chino visible, y vuelta a ES.
 {const {page,errors,press}=await open(t,viewport);await press('#welcomeFooterLang-en');assert.equal(await page.evaluate(()=>LANG),'en');
  assert.doesNotMatch(await page.locator('#welcomeDialog').innerText(),/[㐀-鿿]/,'EN sin chino visible');
  assert.equal(await page.locator('#welcomeDialogTitle').textContent(),'Imagine. Design. Build. Present. Walk through.');
  await press('#welcomeFooterLang-es');assert.equal(await page.evaluate(()=>LANG),'es');assert.deepEqual(errors,[]);}
});

// UX-312 #321 · correcciones 3–6: guía por profesión, módulos integrados, FAQ por temas, footer, movimiento reducido e idiomas.
for(const viewport of [{width:1440,height:900},{width:390,height:844}])
test(`#321: guía y módulos por profesión, FAQ por temas y footer ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const {page,errors,press,narrow}=await open(t,viewport);const before=await project(page);
 const FIRST={architecture:'assistant','real-estate':'render-ai',developer:'render-ai',renovation:'photo-reform',interior:'catalogs',construction:'catalog-budget'};
 assert.equal(await page.locator('.solutions-phases').isVisible(),true,'sin profesión: las cinco fases');
 for(const [aud,first] of Object.entries(FIRST)){await press('#welcomeAudience-'+aud);
  assert.equal(await page.locator('.welcome-work-path').isVisible(),true,aud+' guía propia');assert.equal(await page.locator('.solutions-phases').isHidden(),true);
  assert.ok(await page.locator('.welcome-work-step').count()>=4);assert.equal(await page.locator('#welcomeModules .ai-service').first().getAttribute('data-service'),first,aud+' módulo destacado');
  assert.equal(await page.locator('#welcomeModules .ai-service').count(),9);await press('#welcomeAudience-'+aud);}
 await press('#welcomeAudience-construction');assert.deepEqual(await page.locator('.welcome-work-step strong').allTextContents(),['Mediciones y presupuesto','Plan de obra','Gantt','Obra prevista en 3D','Entrega de obra']);
 // Reformas y Decoración: sus módulos clave, localizables arriba.
 await press('#welcomeAudience-renovation');const ren=await page.locator('#welcomeModules .ai-service.is-featured').evaluateAll(n=>n.map(x=>x.dataset.service));assert.ok(ren.includes('photo-reform')&&ren.includes('catalog-budget'));
 await press('#welcomeAudience-interior');const int=await page.locator('#welcomeModules .ai-service.is-featured').evaluateAll(n=>n.map(x=>x.dataset.service));assert.ok(['catalogs','visual-studio','render-ai'].every(x=>int.includes(x)));
 await press('#welcomeAudience-interior');
 // FAQ: un tema abre su acordeón y el mismo control lo cierra; teclado y toque.
 const topic=page.locator('#welcomeFaqTopic-empezar');await press('#welcomeFaqTopic-empezar');assert.equal(await topic.getAttribute('aria-expanded'),'true');assert.equal(await page.locator('#welcomeFaqPanel-empezar details').count(),4);
 await press('#welcomeFaqTopic-entregar');assert.equal(await page.locator('#welcomeFaqPanel-empezar').isHidden(),true,'un tema a la vez');
 await page.locator('#welcomeFaqTopic-entregar').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#welcomeFaqPanel-entregar').isHidden(),true,'el mismo control cierra');
 await page.locator('#welcomeFaqTopic-ia').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('#welcomeFaqPanel-ia').isVisible(),true);
 assert.equal(await page.locator('#welcomeFaq details').count(),10,'diez respuestas');
 // Footer → módulos consolidados.
 await press('#welcomeFooterServices');await page.waitForFunction(()=>document.activeElement?.id==='welcomeModulesTitle');
 assert.equal(await project(page),before);assert.deepEqual(errors,[]);
});

test('#321: movimiento reducido y EN/ZH sin chino visible en EN',{timeout:120000},async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});t.after(()=>browser.close());
 const ctx=await browser.newContext({viewport:{width:1440,height:900},reducedMotion:'reduce'});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/*',r=>new URL(r.request().url()).hostname==='127.0.0.1'?r.continue():r.abort());await page.goto(url);await page.locator('#welcomeDialog[open]').waitFor();
 await page.locator('#welcomeAudience-construction').click();
 assert.equal(await page.locator('.welcome-work-path').evaluate(n=>getComputedStyle(n).animationName),'none','sin animación con movimiento reducido');
 assert.equal(await page.locator('.welcome-work-step').count(),5,'el cambio de contenido se entiende igual');
 await page.locator('#welcomeFooterLang-en').click();assert.doesNotMatch(await page.locator('#welcomeDialog').innerText(),/[㐀-鿿]/);
 assert.equal(await page.locator('#welcomeModulesTitle').textContent(),'Modules for your work');
 await page.locator('#welcomeFooterLang-zh').click();assert.equal(await page.locator('#welcomeModulesTitle').textContent(),'适合你工作的模块');
 assert.deepEqual(errors,[]);
});
