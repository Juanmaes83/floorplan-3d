// Sonda avc1 (28/11): mismo recorrido de grabación que P10 §8.3 (Entregar › Preparar presentación › 2 estancias › Iniciar ›
// Grabar vídeo) sobre el proyecto de ejemplo, en el código que se sirva (master o candidata). Guarda: avisos de consola, bytes
// del vídeo (los mismos que descarga el cliente) y una reproducción completa en <video> del mismo navegador (duración, ended).
// Uso: CHROME=<chrome> node grabar-recorrido.cjs <raíz-del-repo> <salida>
const path=require('path'),fs=require('fs/promises'),{createServer}=require('http'),{chromium}=require('playwright');
const [root,out]=process.argv.slice(2);
(async()=>{await fs.mkdir(out,{recursive:true});const T={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.glb':'model/gltf-binary','.wasm':'application/wasm'};
const s=createServer(async(q,r)=>{try{const p=decodeURIComponent(new URL(q.url,'http://l').pathname),f=path.resolve(root,'.'+(p.endsWith('/')?p+'index.html':p));r.setHeader('Content-Type',T[path.extname(f)]||'application/octet-stream');r.end(await fs.readFile(f));}catch{r.writeHead(404);r.end();}});
await new Promise(r=>s.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${s.address().port}/`;
const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader','--use-angle=swiftshader']});
const ctx=await b.newContext({viewport:{width:1440,height:900}});const page=await ctx.newPage();page.setDefaultTimeout(120000);
const consola=[];page.on('console',m=>{if(['warning','error'].includes(m.type()))consola.push(m.type()+': '+m.text());});page.on('pageerror',e=>consola.push('pageerror: '+e.message));
await page.route('**/*',r=>{const u=r.request().url();return u.startsWith(base)||u.startsWith('blob:')||u.startsWith('data:')?r.continue():r.abort();});
await page.goto(base);await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
const version=await b.version();
await page.evaluate(()=>FloorPlanProfessionalUI.open('deliver'));await page.locator('#professionalWorkspace').getByRole('button',{name:'Preparar presentación'}).click();
const rows=page.locator('#presentationConfig .presentation-room-row input');const n=await rows.count();for(let i=2;i<n;i++)await rows.nth(i).uncheck();
await page.locator('#presentationConfig').getByRole('button',{name:'Iniciar presentación',exact:true}).click();
await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:180000});
const antes=consola.length;
await page.locator('#presentationVideo').click();const dialog=page.locator('#tourVideoDialog');await dialog.waitFor();
await dialog.locator('#tourVideoGo').click();await dialog.locator('#tourVideoPreview').waitFor({timeout:300000});
const meta=await page.evaluate(async()=>{const r=FloorPlanTourVideo.result,buf=new Uint8Array(await r.blob.arrayBuffer());let bin='';for(let i=0;i<buf.length;i+=32768)bin+=String.fromCharCode(...buf.subarray(i,i+32768));
 return {type:r.blob.type,size:r.blob.size,mime:FloorPlanTourRecorder.pickType(),recorder:r.recording?{frames:r.recording.frames,durationMs:r.recording.durationMs,stops:r.recording.stops,fps:r.recording.framesPerSecond,marks:r.recording.marks}:null,b64:btoa(bin)};});
const ext=meta.type.includes('mp4')?'mp4':'webm';await fs.writeFile(path.join(out,'video-recorrido.'+ext),Buffer.from(meta.b64,'base64'));delete meta.b64;
// Reproducción completa en el mismo navegador (blob → <video>, a velocidad 4x, hasta «ended»).
const play=await page.evaluate(async()=>{const v=document.createElement('video');v.muted=true;v.src=URL.createObjectURL(FloorPlanTourVideo.result.blob);document.body.append(v);
 await new Promise((ok,ko)=>{v.onloadedmetadata=ok;v.onerror=()=>ko(Error('error de carga '+(v.error&&v.error.code)));});const dur=v.duration;v.playbackRate=4;const t0=performance.now();
 v.play();
 const r2=await Promise.race([new Promise(ok=>v.onended=()=>ok('ended')),new Promise(ok=>v.onerror=()=>ok('error '+(v.error&&v.error.code))),new Promise(ok=>setTimeout(()=>ok('timeout'),60000))]);
 const q=v.getVideoPlaybackQuality?.();return {duration:dur,result:r2,currentTime:v.currentTime,videoWidth:v.videoWidth,videoHeight:v.videoHeight,wallMs:Math.round(performance.now()-t0),decoded:q?.totalVideoFrames??null,dropped:q?.droppedVideoFrames??null};}).catch(e=>({error:e.message}));
const res={browser:version,meta,play,consolaDuranteGrabacion:consola.slice(antes),consolaTotal:consola};
await fs.writeFile(path.join(out,'resultado.json'),JSON.stringify(res,null,1)+'\n');console.log(JSON.stringify(res,null,1));await b.close();s.close();})().catch(e=>{console.error(e);process.exit(1);});
