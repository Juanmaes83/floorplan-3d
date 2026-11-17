// Ampliación · 3 Render IA REALES autorizados por el propietario (17/11/2026), como ejemplo de entrega.
// Flujo real del profesional en la app de esta rama (Entregar → vistas → Render IA). Solo /api/render sale, reenviado
// con curl a Production (floorplan-3d-alpha.vercel.app) a través del proxy, que inyecta el código de acceso: este
// script nunca lo ve (envía «proxy-injected»). Límite duro: 3 peticiones; sin reintentos; una 4.ª no sale del equipo.
const path=require('node:path'),fs=require('node:fs/promises'),fss=require('node:fs'),{createServer}=require('node:http'),{execFileSync}=require('node:child_process');const {chromium}=require('playwright');
const [root,out]=process.argv.slice(2);const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const PROD='https://floorplan-3d-alpha.vercel.app/api/render',VIEWS=['Salón','Dormitorio principal','Vista general'],STYLE='natural',MAX=3;
const TYPES={js:'text/javascript',mjs:'text/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',jpg:'image/jpeg',webp:'image/webp',glb:'model/gltf-binary',html:'text/html'};
(async()=>{await fs.mkdir(out,{recursive:true});const server=createServer(async(req,res)=>{try{let p=new URL(req.url,'http://l').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(root,'.'+decodeURIComponent(p));if(!f.startsWith(root))throw 0;res.setHeader('Content-Type',TYPES[f.split('.').pop()]||'application/octet-stream');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const head=execFileSync('git',['-C',root,'rev-parse','HEAD']).toString().trim();
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},acceptDownloads:true});let sent=0,stop=null;const records=[];let current=null;
 await ctx.route('**/*',async r=>{const t=r.request().url();
  if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('three');})});
  if(t.startsWith(url+'api/render')){if(sent>=MAX||stop)return r.fulfill({status:409,contentType:'application/json',body:JSON.stringify({error:'lab-limit'})});sent++;
   const body=JSON.parse(r.request().postData()||'{}');const tmp=path.join(out,`.req-${sent}.json`);fss.writeFileSync(tmp,JSON.stringify(body));
   let status=0,txt='';try{txt=execFileSync('curl',['-sS','--max-time','280','-o','-','-w','\n%{http_code}','-X','POST',PROD,'-H','content-type: application/json','-H','x-rubik-render-token: proxy-injected','--data-binary','@'+tmp],{maxBuffer:64*1024*1024}).toString();const k=txt.lastIndexOf('\n');status=+txt.slice(k+1);txt=txt.slice(0,k);}catch(e){status=-1;txt=String(e.message).slice(0,300);}
   fss.unlinkSync(tmp);let json=null;try{json=JSON.parse(txt);}catch{}
   const meta={n:sent,view:current,style:body.style,floor:body.floor??null,walls:body.walls??null,status,model:json?.model||null,generatedAt:json?.generatedAt||null,usage:json?.usage||null,cost:json?.cost||null,error:json?.error||(status===200?null:txt.slice(0,200)),sourceImageBytes:Math.round((body.image||'').length*3/4)};
   records.push(meta);console.log(JSON.stringify(meta));if(status!==200)stop=meta;
   if(status===200&&json?.image){const b64=String(json.image).replace(/^data:image\/\w+;base64,/,'');fss.writeFileSync(path.join(out,`render-ia-${sent}-${current.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}.png`),Buffer.from(b64,'base64'));}
   return r.fulfill({status:status>0?status:502,contentType:'application/json',body:txt||'{}'});}
  if(t.startsWith(url)||t.startsWith('blob:')||t.startsWith('data:'))return r.continue();return r.abort();});
 const p=await ctx.newPage();p.setDefaultTimeout(300000);await p.goto(url);await p.locator('#welcomeExample').click();await p.waitForFunction(()=>window.FloorPlanAIRender&&window.FloorPlanProjectViews);
 const ws=p.locator('#professionalWorkspace'),dialog=p.locator('#aiRenderDialog');await p.locator('#workArea-deliver').click();await ws.locator('[data-route="prepare-views"]').first().click();
 await p.waitForFunction(()=>FloorPlanProjectViews.status()!=='busy',null,{timeout:300000});
 const revision=await p.evaluate(()=>FloorPlanGuide.revision(FloorPlanApp.project).length);const projectId=await p.evaluate(()=>FloorPlanApp.project.id);
 for(const v of VIEWS){if(stop)break;current=v;await ws.getByRole('button',{name:'Generar imágenes',exact:true}).click().catch(()=>{});
  await ws.getByRole('button',{name:'Render IA de: '+v,exact:true}).click();await dialog.waitFor();
  await dialog.locator('#aiRenderStyle').selectOption(STYLE);await dialog.locator('#aiRenderAgree').check();await dialog.locator('#aiRenderToken').fill('proxy-injected');
  await p.screenshot({path:path.join(out,`dialogo-${records.length+1}.png`)});
  const before=sent;await dialog.locator('#aiRenderGo').click();await p.waitForFunction(n=>true,before);
  await p.waitForFunction(()=>/Render IA listo|No se pudo|error|límite|código/i.test(document.querySelector('#aiRenderStatus')?.textContent||''),null,{timeout:300000}).catch(()=>{});
  await p.waitForTimeout(1500);await p.screenshot({path:path.join(out,`resultado-${records.length}.png`)});
  const status=await dialog.locator('#aiRenderStatus').innerText().catch(()=>'');records.at(-1)&&(records.at(-1).uiStatus=status.slice(0,300));
  await dialog.locator('button',{hasText:/Cerrar/}).first().click().catch(()=>p.keyboard.press('Escape'));await p.waitForTimeout(500);}
 await fs.writeFile(path.join(out,'manifest.json'),JSON.stringify({authorizedBy:'propietario, 17/11/2026, solo 3 peticiones a Production',endpoint:PROD,product:{sha:head,projectId},style:STYLE,requestsSent:sent,stoppedOn:stop,records,label:'Imagen generada con IA a partir de una vista 3D real del proyecto. Orientativa: no reproduce con exactitud la geometría ni los materiales.'},null,1));
 console.log('sent',sent,'stop',!!stop);await browser.close();server.close();})().catch(e=>{console.error(e);process.exit(1);});
