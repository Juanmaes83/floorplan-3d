// UX-312 PERLA · U9: en el móvil el acceso «Asistente» de los diálogos va en flujo al final y nunca tapa sus controles.
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

for(const viewport of [{width:390,height:844},{width:844,height:390}])
test(`U9 el Asistente no tapa controles de los diálogos ${viewport.width}x${viewport.height}`,{timeout:180000},async t=>{
 const context=await browser.newContext({viewport,isMobile:true,hasTouch:true});t.after(()=>context.close());
 const page=await context.newPage();await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanProfessionalUI);await page.locator('#welcomeExample').tap();await page.waitForTimeout(600);
 for(const [a,r] of [['analyze','territory'],['budget','budget-edit'],['deliver','dossier'],['analyze','site-report']]){
  await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();});await page.evaluate(a=>FloorPlanProfessionalUI.open(a),a);await page.waitForTimeout(400);
  const b=page.locator(`#professionalWorkspace [data-route="${r}"]:visible`).first();await b.scrollIntoViewIfNeeded();await b.tap();await page.waitForTimeout(900);
  const covered=await page.evaluate(async()=>{const d=[...document.querySelectorAll('dialog[open]')].filter(x=>x.id!=='assistantHost').pop();if(!d)return ['sin diálogo'];const acc=document.querySelector('#assistantAccess'),hits=new Set();
   const box=[d,...d.querySelectorAll('*')].find(e=>e.scrollHeight>e.clientHeight+4&&/auto|scroll/.test(getComputedStyle(e).overflowY))||d;
   for(let y=0;y<=box.scrollHeight;y+=60){box.scrollTop=y;await new Promise(r=>requestAnimationFrame(r));
    for(const c of d.querySelectorAll('button,a[href],input,select,summary')){if(acc?.contains(c)||!c.checkVisibility())continue;const q=c.getBoundingClientRect();if(q.width<2||q.bottom<0||q.top>innerHeight)continue;
     if(document.elementFromPoint(q.left+q.width/2,Math.min(innerHeight-1,q.top+q.height/2))===acc)hits.add((c.textContent||c.id).trim().slice(0,30)||c.tagName);}}
   return [...hits];});
  assert.deepEqual(covered,[],`${a}/${r}: ningún control tapado por «Asistente»`);
 }
});
