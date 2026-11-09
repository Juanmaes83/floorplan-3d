'use strict';
/* Examen final M2/S4 — arnés. Comprobaciones «blandas»: cada check se registra (PASS/FAIL) y el escenario sigue; al
   final del escenario, si hubo algún FAIL, el test de node termina en rojo con la lista (no se ocultan fallos).
   Estado entre escenarios: volcado de localStorage del origen local (sin datos reales). Vídeo por contexto. */
const fs=require('node:fs/promises'),fss=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{createServer}=require('node:http'),{chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..','..'),OUT=process.env.QA_OUT||path.join(ROOT,'docs','qa','ft3d-8-m2-examen-final-2026-11-06');
const EVID=path.join(OUT,'evidencias'),CODE_SHA=process.env.QA_CODE_SHA||'49e8feba2e3aad03a25fb602248758e39dbe3b3c';
const types={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.gml':'application/gml+xml'};
const CATASTRO='https://ovc.catastro.meh.es/';
const results=[],evidence=[],metrics=[];let server,browser,url,browserVersion='';
const now=()=>new Date().toISOString();

async function start(){
 server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(ROOT,'.'+decodeURIComponent(p));if(!f.startsWith(ROOT+path.sep))throw 0;res.setHeader('Content-Type',types[path.extname(f)]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.writeHead(404);res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;
 browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--enable-precise-memory-info']});browserVersion=browser.version();
 await fs.mkdir(EVID,{recursive:true});return url;
}
async function stop(){await browser?.close();await new Promise(r=>server?server.close(r):r());}

/* ---------- results ---------- */
function scenario(id,titulo,area){const s={id,titulo,area,checks:[],notes:[],status:null,started:now(),error:null};results.push(s);
 const api={
  check(cid,desc,ok,{expected=null,observed=null,evidence:ev=null}={}){s.checks.push({id:cid,desc,status:ok?'PASS':'FAIL',expected,observed,evidence:ev});return ok;},
  partial(cid,desc,why,{observed=null}={}){s.checks.push({id:cid,desc,status:'PARTIAL',expected:null,observed,why});},
  blocked(cid,desc,why){s.checks.push({id:cid,desc,status:'BLOCKED',why});},
  notRun(cid,desc,why){s.checks.push({id:cid,desc,status:'NOT_RUN',why});},
  note(t){s.notes.push(t);},
  metric(name,value,unit,extra={}){metrics.push({scenario:id,name,value,unit,...extra});},
  finish(err=null){s.finished=now();if(err){s.error=String(err&&err.stack||err).slice(0,1500);}
   const st=s.checks.map(c=>c.status);
   s.status=err?(st.length?'FAIL':'BLOCKED'):st.includes('FAIL')?'FAIL':st.every(x=>x==='PASS')&&st.length?'PASS':st.includes('PASS')||st.includes('PARTIAL')?'PARTIAL':st.includes('BLOCKED')?'BLOCKED':'NOT_RUN';
   const fails=s.checks.filter(c=>c.status==='FAIL');
   if(err)throw err;if(fails.length){const e=new Error(`${id}: ${fails.length} comprobación(es) en FAIL → `+fails.map(f=>f.id+' '+f.desc).join(' | '));e.qa=true;throw e;}},
  s};
 return api;}

/* ---------- browser contexts ---------- */
// boot({state, video, viewport}) → página de RUBIK con la biblioteca/estado dados, bienvenida cerrada.
async function boot({state,video=null,viewport={width:1440,height:900},deviceScaleFactor=1,isMobile=false,hasTouch=false,reducedMotion='no-preference',catastro='synthetic'}={}){
 const opts={viewport,deviceScaleFactor,isMobile,hasTouch,reducedMotion,acceptDownloads:true};
 if(video)opts.recordVideo={dir:path.join(EVID,'_tmp_video'),size:{width:Math.min(viewport.width,1280),height:Math.round(Math.min(viewport.width,1280)*viewport.height/viewport.width)}};
 const context=await browser.newContext(opts);const page=await context.newPage();page.setDefaultTimeout(45000);
 const log={errors:[],console:[],requests:[]};
 page.on('pageerror',e=>log.errors.push(e.message));page.on('console',m=>{if(['error','warning'].includes(m.type()))log.console.push(m.type()+': '+m.text().slice(0,300));});page.on('request',r=>log.requests.push(r.url()));
 const GML=fss.readFileSync(path.join(ROOT,'tests','fixtures','catastro-cp-synthetic.gml'),'utf8');
 await context.route(CATASTRO+'**',r=>{if(catastro==='down')return r.fulfill({status:503,headers:{'content-type':'text/html'},body:'<html>Servicio no disponible</html>'});
  const u=new URL(r.request().url()),ref=u.searchParams.get('refcat');
  return r.fulfill({status:200,headers:{'content-type':'text/xml; charset=utf-8','access-control-allow-origin':'*'},body:ref==='1907401VK4810H'?GML:`<ows:ExceptionReport xmlns:ows="http://www.opengis.net/ows/1.1"><ows:Exception><ows:ExceptionText><![CDATA[No se ha encontrado la parcela ${ref} para el huso ${u.searchParams.get('srsname').slice(6)}]]></ows:ExceptionText></ows:Exception></ows:ExceptionReport>`});});
 await context.route(/^https?:\/\/(?!127\.0\.0\.1)/,r=>r.request().url().startsWith(CATASTRO)?r.fallback():r.abort());
 // Estado: biblioteca y demás claves del origen (solo top window; una vez por contexto).
 await page.addInitScript(st=>{if(window.top!==window||sessionStorage.getItem('qa-seeded'))return;localStorage.clear();for(const [k,v] of Object.entries(st))localStorage.setItem(k,v);sessionStorage.setItem('qa-seeded','1');},state);
 const t0=Date.now();await page.goto(url);await page.waitForFunction(()=>window.FloorPlanConstructionUI&&window.FloorPlanBudgetUI);const loadMs=Date.now()-t0;
 if(await page.locator('#welcomeReturn').isVisible().catch(()=>false))await page.locator('#welcomeReturn').click();
 return {context,page,log,loadMs,video};
}
async function close(sess,name){
 const v=sess.page.video?.();await sess.context.close();
 if(v&&name){const dst=path.join(EVID,name+'.webm');await v.saveAs(dst).catch(()=>{});await fs.rm(await v.path(),{force:true}).catch(()=>{});await registerEvidence(dst,{tipo:'video',escenario:name});}
}
const dump=page=>page.evaluate(()=>{const o={};for(let i=0;i<localStorage.length;i++){const k=localStorage.key(i);o[k]=localStorage.getItem(k);}return o;});
async function shot(page,name,meta={}){const f=path.join(EVID,name+'.jpg');await page.screenshot({path:f,type:'jpeg',quality:80});const vp=page.viewportSize();await registerEvidence(f,{tipo:'captura',resolucion:vp?`${vp.width}x${vp.height}`:null,...meta});return path.basename(f);}
async function registerEvidence(file,meta){const buf=await fs.readFile(file).catch(()=>null);if(!buf)return;evidence.push({archivo:path.relative(OUT,file),sha256:crypto.createHash('sha256').update(buf).digest('hex'),bytes:buf.length,codigoSha:CODE_SHA,navegador:'Chromium '+browserVersion,fecha:now(),...meta});}
async function write(){
 const sum={};for(const s of results)sum[s.status]=(sum[s.status]||0)+1;
 const checks={};for(const s of results)for(const c of s.checks)checks[c.status]=(checks[c.status]||0)+1;
 await fs.writeFile(path.join(OUT,process.env.QA_RESULTS||'resultados.json'),JSON.stringify({codigoSha:CODE_SHA,navegador:'Chromium '+browserVersion,fecha:now(),resumenEscenarios:sum,resumenComprobaciones:checks,escenarios:results,metricas:metrics},null,1));
 const prev=fss.existsSync(path.join(OUT,'manifest-evidencias.json'))?JSON.parse(fss.readFileSync(path.join(OUT,'manifest-evidencias.json'),'utf8')).evidencias||[]:[];
 const merged=[...prev.filter(p=>!evidence.some(e=>e.archivo===p.archivo)),...evidence];
 await fs.writeFile(path.join(OUT,'manifest-evidencias.json'),JSON.stringify({codigoSha:CODE_SHA,generado:now(),evidencias:merged},null,1));
}

/* ---------- RUBIK helpers (real UI) ---------- */
const eurParse=t=>{const m=/(-?[\d.]*\d,\d{2})\s?€/.exec(String(t||''));return m?Number(m[1].replace(/\./g,'').replace(',','.')):null;};
async function area(page,key){await page.locator('#workArea-'+key).click();await page.waitForFunction(k=>document.getElementById('professionalWorkspace')?.dataset.area===k,key).catch(()=>{});await page.waitForTimeout(150);}
async function openProject(page,entryId){
 if(await page.locator('#professionalWorkspace').isVisible().catch(()=>false))await page.locator('#professionalWorkspace .professional-head button').first().click();
 await page.locator('#projectsBtn').click();await page.locator('#projectList').selectOption(entryId);await page.locator('#projectOpen').click();
 await page.waitForFunction(id=>FloorPlanApp.entryId===id,entryId);if(await page.locator('#projectsDialog').isVisible().catch(()=>false))await page.locator('#projectClose').click();}
async function openBudget(page){await area(page,'budget');await page.locator('[data-route="budget-edit"]').click();await page.waitForSelector('#budgetDialog[open]');}
async function setPriceUI(page,itemId,value){const inp=page.locator(`#budgetDialog tr[data-item="${itemId}"] [data-field="price"]`);await inp.fill(value===null?'':String(value));await inp.press('Tab');await page.waitForTimeout(80);}
async function budgetNow(page){return page.evaluate(()=>{const b=FloorPlanBudgetUI.current().budget,c=FloorPlanBudget.calculateBudget(b);return {budget:b,calc:{lines:c.lines.map(l=>({id:l.id,subtotalNet:l.subtotalNet,taxAmount:l.taxAmount})),totals:c.totals,taxRatePercent:c.taxRatePercent}};});}
const snap=page=>page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot();return {entryId:s.entry.id,subject:s.subject,revision:s.revision,record:s.record};});
async function inventory(page){return page.evaluate(async()=>{const s=await FloorPlanConstructionContext.snapshot(),inv=FloorPlanConstructionProject.inventory(s.doc);return inv.elements.map(e=>({key:e.key,type:e.type,structure:e.structure||null,lifecycle:e.lifecycle,representable:e.representable}));});}
async function openEvolution(page,opts={}){const t0=Date.now();await page.evaluate(o=>FloorPlanConstructionUI.openEvolution(o),opts);
 await page.waitForFunction(()=>{const f=document.getElementById('evolutionFrame');return f?.contentDocument?.body?.classList.contains('ready')&&(f.contentWindow.__ft3dFidelity?.ctx||f.contentDocument.body.dataset.state);},null,{timeout:90000});
 return {frame:page.frames().find(f=>f.url().includes('/evolucion/')),ms:Date.now()-t0};}
const evoFrame=page=>page.frames().find(f=>f.url().includes('/evolucion/'));

module.exports={ROOT,OUT,EVID,CODE_SHA,start,stop,scenario,boot,close,dump,shot,registerEvidence,write,eurParse,area,openProject,openBudget,setPriceUI,budgetNow,snap,inventory,openEvolution,evoFrame,get url(){return url;},get browserVersion(){return browserVersion;},metrics,results};
