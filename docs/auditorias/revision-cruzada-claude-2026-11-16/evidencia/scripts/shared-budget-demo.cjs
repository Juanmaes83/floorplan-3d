// Browser demonstration on master@46174d6: two library entries created by importing the SAME project.json share ONE budget.
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),http=require('http');
const ROOT=process.argv[2],OUT=process.argv[3];fs.mkdirSync(OUT,{recursive:true});
const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.glb':'model/gltf-binary','.webp':'image/webp'};
(async()=>{const srv=http.createServer((q,r)=>{try{let p=new URL(q.url,'http://x').pathname;if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,decodeURIComponent(p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));}catch{r.statusCode=404;r.end();}});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${srv.address().port}/`;
 const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});const ctx=await b.newContext({viewport:{width:1440,height:900},recordVideo:{dir:OUT,size:{width:1440,height:900}}});const page=await ctx.newPage();
 await page.route(u=>!String(u).startsWith(base),r=>r.abort());await page.goto(base);await require(path.join(ROOT,'tests/editor-fixture.cjs'))(page);await page.waitForFunction(()=>window.FloorPlanBudgetUI&&window.FloorPlanApp);
 const ev=f=>page.evaluate(f);
 // 1. Original: open Presupuestar once (budget saved) and set a price of 11 on its first item.
 await ev(()=>{FloorPlanBudgetUI.open();const c=FloorPlanBudgetUI.current().budget;FloorPlanBudgetUI.commit({...c,items:c.items.map((i,k)=>k===0?FloorPlanBudget.setManualPrice(i,{unitPrice:11,label:'Precio original'}):i)});document.querySelector('#budgetDialog').close();});
 const orig=await ev(()=>({libId:null,projectId:FloorPlanApp.project.id,price:FloorPlanBudgetUI.current().budget.items[0].unitPrice}));
 // 2. «Exportar proyecto» content, re-imported through the real file input (#fileIn) — as a professional would do.
 const json=await ev(()=>JSON.stringify(FloorPlanApp.project));
 await page.locator('#fileIn').setInputFiles({name:'mi-proyecto.json',mimeType:'application/json',buffer:Buffer.from(json)});
 await page.waitForFunction(()=>(JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')||'null')?.entries||[]).length===2);
 orig.libId=await ev(()=>{const l=JSON.parse(localStorage.getItem('rubik-sota-project-library-v1'));return l.entries.find(e=>e.id!==l.activeId).id;});
 const copy=await ev(()=>({libId:JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId,projectId:FloorPlanApp.project.id,priceSeen:FloorPlanBudgetUI.current().budget.items[0].unitPrice}));
 // 3. In the imported COPY the professional changes that price to 99.
 await ev(()=>{FloorPlanBudgetUI.open();const c=FloorPlanBudgetUI.current().budget;FloorPlanBudgetUI.commit({...c,items:c.items.map((i,k)=>k===0?FloorPlanBudget.setManualPrice(i,{unitPrice:99,label:'Precio de la copia'}):i)});document.querySelector('#budgetDialog').close();});
 // 4. Back to the ORIGINAL through «Proyectos» → select → «Abrir».
 await page.locator('#projectsBtn').click();await page.locator('#projectList').selectOption(orig.libId);await page.locator('#projectOpen').click();
 await page.waitForFunction(id=>JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId===id,orig.libId);
 const back=await ev(()=>({libId:JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).activeId,projectId:FloorPlanApp.project.id,price:FloorPlanBudgetUI.current().budget.items[0].unitPrice,label:FloorPlanBudgetUI.current().budget.items[0].priceSource?.label,budgetKeys:Object.keys(JSON.parse(localStorage.getItem('rubik-budget-v1')||'{}')),entries:JSON.parse(localStorage.getItem('rubik-sota-project-library-v1')).entries.map(e=>({lib:e.id,project:e.project?.id}))}));
 await ev(()=>FloorPlanBudgetUI.open());await page.screenshot({path:path.join(OUT,'original-tras-editar-copia.png')});
 await ctx.close();await b.close();srv.close();
 const r={original:orig,importedCopy:copy,originalAfterEditingCopy:back,SHARED_BUDGET:back.price===99&&orig.projectId===copy.projectId&&orig.libId!==copy.libId};console.log(JSON.stringify(r,null,1));fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(r,null,1));
})().catch(e=>{console.error(e);process.exit(1);});
