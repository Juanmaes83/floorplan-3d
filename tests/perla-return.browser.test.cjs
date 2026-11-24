// UX-312 PERLA · U9 Navegación coherente (js/perla-return.js): «Volver» devuelve a donde estabas, nunca al inicio.
// Recorridos reales con gestos visibles en 1440x900 (ratón) y 390x844 (táctil):
//  1. Entregar → «Presupuesto» (abre Presupuestar): la cabecera ofrece «← Volver a Entregar» y vuelve a Entregar.
//  2. Analizar → «Calibrar» (abre el editor): «← Volver a Analizar» aparece en el editor y vuelve a Analizar.
//  3. Atrás del navegador desde un área vuelve a la pantalla anterior (el editor), no al inicio ni fuera de la app.
//  4. Con un diálogo abierto en un área, Atrás cierra el diálogo y la persona sigue en su área.
'use strict';
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const path=require('node:path'),fs=require('node:fs'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const TYPES={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.woff2':'font/woff2'};
before(async()=>{server=createServer((req,res)=>{try{const u=decodeURIComponent(new URL(req.url,'http://l').pathname),file=path.resolve(root,'.'+(u==='/'?'/index.html':u));if(!file.startsWith(root+path.sep))throw 0;const body=fs.readFileSync(file);res.setHeader('Content-Type',TYPES[path.extname(file)]||'application/octet-stream');res.end(body);}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;browser=await chromium.launch({executablePath:process.env.CHROME||undefined});});
after(async()=>{await browser?.close();await new Promise(r=>server?.close(r));});

for(const [viewport,touch] of [[{width:1440,height:900},false],[{width:390,height:844},true]])
test(`U9 «Volver» devuelve al origen ${viewport.width}x${viewport.height}`,{timeout:240000},async t=>{
 const context=await browser.newContext({viewport,isMobile:touch,hasTouch:touch});t.after(()=>context.close());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('dialog',d=>d.dismiss());
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const press=async loc=>{await loc.scrollIntoViewIfNeeded();touch?await loc.tap():await loc.click();await page.waitForTimeout(500);};
 const area=()=>page.evaluate(()=>document.querySelector('#professionalWorkspace').hidden?'design':FloorPlanProfessionalUI.area);
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanProfessionalUI&&window.FloorPlanPerlaReturn);
 await press(page.locator('#welcomeExample'));await page.waitForTimeout(600);

 // 1 · Entregar → Presupuestar y vuelta a Entregar con la misma posición.
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.waitForTimeout(600);
 const budget=page.locator('#professionalWorkspace [data-route="budget"]:visible').first();await budget.scrollIntoViewIfNeeded();
 const y0=await page.evaluate(()=>document.querySelector('#professionalWorkspace').scrollTop);
 await press(budget);assert.equal(await area(),'budget','«Presupuesto» abre Presupuestar');
 const head=page.locator('#professionalWorkspace .professional-head>button');
 assert.equal((await head.textContent()).trim(),'← Volver a Entregar','un único «Volver», en su sitio, que nombra el origen');
 await press(head);assert.equal(await area(),'deliver','vuelve a Entregar, no a Diseñar ni al inicio');
 const y1=await page.evaluate(()=>document.querySelector('#professionalWorkspace').scrollTop);
 assert.ok(Math.abs(y1-y0)<=40,`misma posición en Entregar (${y0} → ${y1})`);
 assert.equal((await head.textContent()).trim(),'← Volver a Diseñar','sin retorno pendiente, el «Volver» habitual');

 // 2 · Analizar → editor (calibrar) y vuelta a Analizar desde el editor.
 await page.evaluate(()=>FloorPlanProfessionalUI.open('analyze'));await page.waitForTimeout(600);
 await press(page.locator('#professionalWorkspace [data-route="calibration"]:visible').first());
 assert.equal(await area(),'design','«Calibrar» abre el editor');
 const ret=page.locator('#perlaReturn');await ret.waitFor({state:'visible'});
 assert.equal((await ret.textContent()).trim(),'← Volver a Analizar');
 assert.equal(await page.locator('#perlaReturn:visible').count(),1,'un solo botón de retorno');
 await press(ret);assert.equal(await area(),'analyze','vuelve a Analizar');assert.equal(await ret.isVisible(),false,'el retorno desaparece al usarse');

 // 3 · Atrás del navegador desde un área: a la pantalla anterior, dentro de la app.
 await page.evaluate(()=>FloorPlanProfessionalUI.close());await page.waitForTimeout(400);
 await page.evaluate(()=>FloorPlanProfessionalUI.open('budget'));await page.waitForTimeout(600);
 await page.goBack();await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>!!window.FloorPlanProfessionalUI),true,'sigue en la aplicación');
 assert.equal(await area(),'design','Atrás vuelve al editor, la pantalla anterior');
 assert.equal(await page.evaluate(()=>!!document.querySelector('#welcomeDialog[open]')),false,'no abre el inicio');
 await page.goForward();await page.waitForTimeout(800);assert.equal(await area(),'budget','Adelante vuelve a Presupuestar');

 // 4 · Diálogo abierto + Atrás: se cierra el diálogo y se sigue en el área.
 await press(page.locator('#professionalWorkspace [data-route="budget-edit"]:visible').first());
 assert.equal(await page.evaluate(()=>!!document.querySelector('dialog[open]')),true,'el diálogo de presupuesto está abierto');
 await page.goBack();await page.waitForTimeout(800);
 assert.equal(await page.evaluate(()=>!!document.querySelector('dialog[open]')),false,'Atrás cierra el diálogo');
 assert.equal(await area(),'budget','y deja a la persona en Presupuestar');
 assert.deepEqual(errors,[]);
});
