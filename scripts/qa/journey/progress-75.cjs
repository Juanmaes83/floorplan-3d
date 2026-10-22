/* Reproduces the «75 % completado» next to «Empezar / Prepara tu proyecto» seen in the #66 preview, in a clean
   browser profile. Three paths: (1) example → «Crear a partir del ejemplo» (own copy, goal «Crear y guardar en 3D»),
   untouched; (2) the same, then «← Paso anterior» to the first task; (3) path 2 followed by a reload (F5) and by a
   new visit from the entry URL. Each state records the guide's progress line, task, stage and button, and the stored
   guide entry (current task, manualTask). Usage: node progress-75.cjs <checkout> <outdir> */
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const [rootArg,outArg]=process.argv.slice(2),root=path.resolve(rootArg),out=path.resolve(outArg);
const types={'.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.svg':'image/svg+xml'};
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!file.startsWith(root+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(file)]||'text/html');res.end(await fs.readFile(file));}catch{res.statusCode=404;res.end();}}).listen(0);
 const url=`http://127.0.0.1:${server.address().port}/`,browser=await chromium.launch({executablePath:process.env.CHROME||undefined});
 const ctx=await browser.newContext({viewport:{width:1440,height:900}}),page=await ctx.newPage();
 await page.route('https://cdn.jsdelivr.net/**',r=>r.abort());
 const rows=[];
 const state=async label=>{await page.waitForTimeout(500);const s=await page.evaluate(()=>{const b=document.querySelector('#guideBar'),t=s=>b.querySelector(s)?.textContent.trim();const st=FloorPlanGuideUI.state();return {progress:t('.guide-progress-line strong'),stage:t('[aria-current=step] .step-label'),task:t('.guide-current h2'),button:document.querySelector('#guidePrimary')?.textContent,stored:{goal:st.goal,kind:st.kind,current:st.current,manualTask:!!st.manualTask},welcome:document.querySelector('#welcomeDialog').open};});
  const file=`${String(rows.length+1).padStart(2,'0')}.png`;await page.screenshot({path:path.join(out,file)});rows.push({label,file,...s});console.log(label,'|',JSON.stringify(s));};
 await page.goto(url);await page.locator('#welcomeExample').click();await state('1. Ejemplo (perfil limpio)');
 await page.locator('#guideCopyExample').click();await state('2. «Crear a partir del ejemplo»: copia propia');
 for(let i=0;i<5;i++){const p=await page.evaluate(()=>FloorPlanGuideUI.state().current);if(p==='start')break;await page.locator('#guidePrevious').click();await state(`3.${i+1} «← Paso anterior»`);}
 await page.reload();await page.waitForFunction(()=>window.FloorPlanGuideUI);await state('4. Recargar (F5) con #editor');
 await page.goto(url.replace(/#.*/,''));await page.waitForFunction(()=>window.FloorPlanGuideUI);await state('5. Nueva visita desde la URL de entrada');
 if(await page.locator('#welcomeContinue').isVisible()){await page.locator('#welcomeContinue').click();await state('6. «Continuar mi proyecto»');}
 await fs.writeFile(path.join(out,'progress-75.json'),JSON.stringify(rows,null,1));
 await browser.close();server.close();
})().catch(e=>{console.error(e);process.exit(1);});
