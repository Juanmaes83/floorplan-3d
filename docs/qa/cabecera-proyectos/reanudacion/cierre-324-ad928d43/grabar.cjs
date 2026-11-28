// Contraste avc1: graba el vídeo del recorrido por la interfaz real N veces y cuenta los avisos de consola del codificador.
const path=require('path'),fs=require('fs/promises'),{createServer}=require('http'),{chromium}=require('playwright');
const [root,tag,nStr,out]=process.argv.slice(2),N=+nStr||3;
(async()=>{const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const s=createServer(async(q,r)=>{try{const p=decodeURIComponent(new URL(q.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(await fs.readFile(f));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const rows=[];
for(let i=1;i<=N;i++){const ctx=await b.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage(),cons=[];page.setDefaultTimeout(120000);
 page.on('console',m=>{if(/avc1|avc3|codec description/i.test(m.text()))cons.push(m.type()+': '+m.text().slice(0,160));});page.on('pageerror',e=>cons.push('pageerror: '+e.message.slice(0,160)));
 await page.route('**/*',r=>/^(http:\/\/127\.0\.0\.1|blob:|data:)/.test(r.request().url())?r.continue():r.abort());
 await page.goto(`http://127.0.0.1:${s.address().port}/`);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const t0=Date.now();
 await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.locator('#professionalWorkspace').getByRole('button',{name:'Preparar presentación'}).click();
 const rr=page.locator('#presentationConfig .presentation-room-row input');const n=await rr.count();for(let k=2;k<n;k++)await rr.nth(k).uncheck();
 await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación',exact:true}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
 await page.locator('#presentationVideo').click();const d=page.locator('#tourVideoDialog');await d.waitFor();await d.locator('#tourVideoGo').click();await d.locator('#tourVideoPreview').waitFor({timeout:300000});
 const info=await page.evaluate(async()=>{const bl=FloorPlanTourVideo.result.blob;return {size:bl.size,type:bl.type,b64:btoa(String.fromCharCode(...new Uint8Array(await bl.arrayBuffer()).slice(0,0)))};});
 const bytes=await page.evaluate(async()=>Array.from(new Uint8Array(await FloorPlanTourVideo.result.blob.arrayBuffer())));const f=path.join(out,`${tag}-${i}.${info.type.includes('mp4')?'mp4':'webm'}`);await fs.writeFile(f,Buffer.from(bytes));
 rows.push({run:i,type:info.type,size:info.size,file:path.basename(f),seconds:Math.round((Date.now()-t0)/1000),avisos:cons});await ctx.close();}
console.log(JSON.stringify({tag,root,rows},null,1));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});
