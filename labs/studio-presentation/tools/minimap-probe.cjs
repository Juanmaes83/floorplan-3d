// Auditoría 3 · interacción del minimapa durante la visita inmersiva (vista previa de cliente, solo lectura), en Chromium local.
// Mide qué elemento recibe el clic en el centro del botón «Ver/Ocultar plano» y de cada estancia del plano, prueba ratón,
// teclado y toque (viewport móvil), y comprueba que pulsar una estancia mueve al visitante a ella. Uso: node minimap-probe.cjs <root> <outDir>
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http');const {chromium}=require('playwright');
const [root,out]=process.argv.slice(2);const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const TYPES={js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',glb:'model/gltf-binary',html:'text/html',hdr:'application/octet-stream'};
(async()=>{const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(p));
  if(!f.startsWith(root))throw 0;res.setHeader('Content-Type',TYPES[f.split('.').pop()]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;await fs.mkdir(out,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']});const report={generated:new Date().toISOString(),runs:[]};
 for(const vp of [{name:'escritorio',width:1440,height:900},{name:'movil',width:390,height:844,mobile:true}]){
  const ctx=await browser.newContext({viewport:{width:vp.width,height:vp.height},isMobile:!!vp.mobile,hasTouch:!!vp.mobile,deviceScaleFactor:vp.mobile?2:1});
  await ctx.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('three');})});
   if(t.startsWith(url)&&!t.startsWith(url+'api/')||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
  const p=await ctx.newPage();p.setDefaultTimeout(300000);const run={viewport:vp.name,steps:[]};const step=(k,v)=>{run.steps.push({k,v});console.log(vp.name,k,JSON.stringify(v));};
  await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForFunction(()=>window.FloorPlanDeliveryPreview?.eligible()===true);
  const [c]=await Promise.all([ctx.waitForEvent('page'),p.evaluate(()=>{document.querySelector('#workArea-deliver')?.click();document.querySelector('#delivery3dPreview').click();})]);c.setDefaultTimeout(300000);
  await c.waitForFunction(()=>window.FloorPlanDeliveryClient?.state==='ready');await c.locator('#deliveryWalk').click();await c.locator('#walkStart').waitFor();await c.locator('#walkStart').click();
  await c.locator('#deliveryMapToggle').waitFor();await c.waitForTimeout(2500);
  const hit=sel=>c.evaluate(sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect(),x=r.left+r.width/2,y=r.top+r.height/2,t=document.elementFromPoint(x,y);
   const chain=[];for(let n=t;n&&n!==document.body;n=n.parentElement)chain.push(n.id?'#'+n.id:n.tagName.toLowerCase()+(n.classList[0]?'.'+n.classList[0]:''));return {box:[r.left,r.top,r.width,r.height].map(Math.round),receiver:chain.slice(0,4),own:e.contains(t)||e===t};},sel);
  step('toggle hit-test',await hit('#deliveryMapToggle'));
  step('map styles',await c.evaluate(()=>{const m=document.getElementById('deliveryMap'),cv=document.querySelector('#view3d canvas,canvas');const s=getComputedStyle(m),k=getComputedStyle(cv);return {map:{position:s.position,zIndex:s.zIndex,pointerEvents:s.pointerEvents,parent:m.parentElement.id},canvas:{position:k.position,zIndex:k.zIndex,parent:cv.parentElement.id}};}));
  const before=await c.evaluate(()=>document.getElementById('deliveryMapToggle').getAttribute('aria-expanded'));
  let clickErr=null;try{await c.locator('#deliveryMapToggle').click({timeout:8000});}catch(e){clickErr=e.message.split('\n').slice(0,6).join(' | ');}
  const afterClick=await c.evaluate(()=>document.getElementById('deliveryMapToggle').getAttribute('aria-expanded'));step('mouse/touch toggle',{before,afterClick,changed:before!==afterClick,clickErr});
  await c.locator('#deliveryMapToggle').focus();await c.keyboard.press('Enter');const afterKey=await c.evaluate(()=>document.getElementById('deliveryMapToggle').getAttribute('aria-expanded'));step('keyboard toggle',{afterKey,changed:afterKey!==afterClick});
  if(await c.evaluate(()=>document.getElementById('deliveryMapPanel').hidden)){await c.evaluate(()=>document.getElementById('deliveryMapToggle').click());}
  await c.screenshot({path:path.join(out,`minimapa-${vp.name}-abierto.png`)});
  const target=await c.evaluate(()=>{const here=View3D.walkPose?.()?.roomId;const polys=[...document.querySelectorAll('#deliveryMapPanel polygon[data-room-id]')];const p=polys.find(x=>x.dataset.roomId!==here&&/kitchen|living|master/.test(x.dataset.roomId))||polys.find(x=>x.dataset.roomId!==here);return p&&{id:p.dataset.roomId,here};});
  step('room hit-test',await hit(`#deliveryMapPanel polygon[data-room-id="${target.id}"]`));
  let roomErr=null;try{await c.locator(`#deliveryMapPanel polygon[data-room-id="${target.id}"]`).click({timeout:8000});}catch(e){roomErr=e.message.split('\n').slice(0,4).join(' | ');}
  await c.waitForTimeout(3500);const pose=await c.evaluate(()=>({room:View3D.walkPose?.()?.roomId,here:document.getElementById('deliveryMapHere').textContent}));step('room click',{target,pose,moved:pose.room===target.id,roomErr});
  await c.screenshot({path:path.join(out,`minimapa-${vp.name}-tras-ir.png`)});report.runs.push(run);await ctx.close();}
 await fs.writeFile(path.join(out,'minimap-probe.json'),JSON.stringify(report,null,1));await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
