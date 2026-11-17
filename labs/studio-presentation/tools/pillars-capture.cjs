// Ampliación · los cuatro pilares tal como funcionan HOY en el producto (código de esta rama), en Chromium local.
// Nada se genera con coste: /api/* se bloquea (Render IA abre su diálogo real sobre una vista real, sin enviar nada).
// Evolución de obra usa el caso sintético A del laboratorio FT3D-8 (?lab=1), rotulado como tal en cada captura.
// usage: node pillars-capture.cjs <repoRoot> <outDir>   (Dibujo vivo: scripts/qa/render-presentation-living-drawing.cjs)
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http');const {chromium}=require('playwright');
const [root,out]=process.argv.slice(2);const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const TYPES={js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',glb:'model/gltf-binary',html:'text/html'};
(async()=>{const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(p));
  if(!f.startsWith(root))throw 0;res.setHeader('Content-Type',TYPES[f.split('.').pop()]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const log=[];
 const blocked=[];const prep=async ctx=>{await ctx.route('**/*',async r=>{const t=r.request().url();
  if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('three');})});
  if(t.startsWith(url+'api/')){blocked.push(t);return r.abort();}if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();blocked.push(t);return r.abort();});};
 const shot=async(p,name,note)=>{await p.screenshot({path:path.join(out,name)});log.push({file:name,note});console.log(name);};
 // 1. Evolución de obra (FT3D-8), caso sintético A
 {const ctx=await browser.newContext({viewport:{width:1440,height:900}});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(240000);
  for(const [q,name,note] of [['lab=1&case=A','ft3d8-1-evolucion-caso-A.png','Evolución de obra, caso sintético A del laboratorio FT3D-8 (planificación prevista, no obra ejecutada).'],['lab=1&dossier=A','ft3d8-2-expediente-caso-A.png','Expediente de obra del caso sintético A (FT3D-8).']]){
   await p.goto(`${url}evolucion/?${q}`);await p.waitForLoadState('networkidle').catch(()=>{});await p.waitForTimeout(9000);await shot(p,name,note);}
  await ctx.close();}
 // 2. Render IA: vistas preparadas y diálogo real; /api/render bloqueado (sin coste)
 {const ctx=await browser.newContext({viewport:{width:1440,height:900}});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(240000);
  await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForFunction(()=>window.FloorPlanAIRender&&window.FloorPlanProjectViews);
  const ws=p.locator('#professionalWorkspace');await p.locator('#workArea-deliver').click();await ws.locator('[data-route="prepare-views"]').first().click();
  await p.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:240000});await p.waitForTimeout(800);await shot(p,'render-1-vistas-preparadas.png','Entregar: vistas del modelo preparadas por RUBIK, origen de cualquier Render IA.');
  await ws.getByRole('button',{name:'Generar imágenes',exact:true}).click();await ws.getByRole('button',{name:'Render IA de: Vista general',exact:true}).click();await p.locator('#aiRenderDialog').waitFor();await p.waitForTimeout(600);
  await shot(p,'render-2-dialogo-render-ia.png','Render IA: diálogo real con la vista de origen, estilo, consentimiento y código de acceso. No se ha generado ninguna imagen (coste).');await ctx.close();}
 // 3. Visita inmersiva: vista previa de cliente (solo lectura) y recorrido 3D
 {const ctx=await browser.newContext({viewport:{width:1440,height:900}});await prep(ctx);const p=await ctx.newPage();p.setDefaultTimeout(240000);
  await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForFunction(()=>window.FloorPlanDeliveryPreview?.eligible()===true);
  await p.locator('#workArea-deliver').click();await p.locator('#delivery3dPreview').waitFor();await p.locator('#delivery3dPreview').scrollIntoViewIfNeeded();await shot(p,'visita-1-entregar.png','Entregar: acceso a la vista previa 3D de cliente.');
  const [c]=await Promise.all([ctx.waitForEvent('page'),p.locator('#delivery3dPreview').click()]);c.setDefaultTimeout(240000);
  await c.waitForFunction(()=>window.FloorPlanDeliveryClient?.state==='ready',null,{timeout:240000});await c.waitForTimeout(3000);await shot(c,'visita-2-cliente-inicio.png','Experiencia de cliente de solo lectura (vista previa local, no un enlace publicado).');
  await c.locator('#deliveryWalk').click();await c.locator('#walkStart').waitFor();await c.locator('#walkStart').click();await c.waitForTimeout(5000);await shot(c,'visita-3-recorrido.png','Recorrido 3D en primera persona dentro de la experiencia de cliente.');
  if(await c.locator('#deliveryMapToggle').count()){await c.locator('#deliveryMapToggle').click();await c.waitForTimeout(1500);await shot(c,'visita-4-minimapa.png','Minimapa de estancias durante el recorrido.');}
  await ctx.close();}
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({blockedRequests:blocked,shots:log},null,1));console.log('blocked',blocked.length,[...new Set(blocked.map(u=>u.replace(url,'/')))].slice(0,5));
 await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
