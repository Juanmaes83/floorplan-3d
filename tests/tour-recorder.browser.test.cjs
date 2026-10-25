// Tour video V1 (internal): the active presentation is recorded into one video Blob; the same Blob plays in a
// <video> (the future preview), its frames show the 3D scene and nothing else, and cancelling leaves no Blob.
// The interface offers no recording yet: no visible text says «Grabar».
const {test,before,after}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const {execFile}=require('node:child_process'),{promisify}=require('node:util'),run=promisify(execFile);
const skip=!process.env.THREE_LOCAL_DIR&&'THREE_LOCAL_DIR not set: recording needs 3D';
const OUT=process.env.TOUR_VIDEO_ARTIFACTS||'qa-results/tour-video-v1';
let server,url;
before(async()=>{const root=path.resolve(__dirname,'..');server=createServer(async(req,res)=>{
 try{const file=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://local').pathname));if(!file.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(file)?'text/javascript':file.endsWith('.css')?'text/css':file.endsWith('.json')?'application/json':'text/html');res.end(await fs.readFile(file));}
 catch{res.writeHead(404);res.end();}});await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/`;});
after(async()=>new Promise(r=>server.close(r)));

async function open(t){
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});t.after(()=>browser.close());
 const page=await browser.newPage({viewport:{width:1440,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',async r=>{try{await r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await require('./helpers/three-module.cjs')(r.request().url(),()=>Promise.reject(Error('no cdn')))});}catch{await r.abort();}});
 await page.goto(url);await page.waitForFunction(()=>window.FloorPlanPresentation&&window.View3D&&window.FloorPlanTourRecorder,null,{timeout:120000});await page.locator('#welcomeExample').click();
 await page.locator('#guideClose').click();await page.locator('#presentationBtn').click();
 await page.locator('.presentation-room-row').nth(1).locator('input').check();await page.getByRole('button',{name:'Iniciar presentación'}).click();
 await page.waitForFunction(()=>FloorPlanPresentation.active&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});
 return {page,errors};
}

test('V1 records the presentation stops into one playable video of the 3D scene only',{timeout:600000,skip},async t=>{
 const {page,errors}=await open(t);
 const before=await page.evaluate(()=>FloorPlanPresentation.current?.kind);
 const result=await page.evaluate(async()=>{const r=await FloorPlanTourRecorder.record({holdMs:1200});window.__tour=r.blob;
  const video=document.createElement('video');video.muted=true;video.src=URL.createObjectURL(r.blob);
  await new Promise((ok,ko)=>{video.onloadedmetadata=ok;video.onerror=()=>ko(Error('video does not load'));});
  // MediaRecorder WebM has no duration in its header: seeking far forces the real one.
  if(!Number.isFinite(video.duration)){video.currentTime=1e6;await new Promise(ok=>video.ontimeupdate=ok);}
  const duration=video.duration;video.currentTime=Math.min(duration/2,1.5);await new Promise(ok=>video.onseeked=ok);
  const c=document.createElement('canvas');c.width=160;c.height=90;const x=c.getContext('2d');x.drawImage(video,0,0,160,90);const d=x.getImageData(0,0,160,90).data;
  let sum=0,sum2=0;for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;sum+=l;sum2+=l*l;}const n=d.length/4,mean=sum/n;
  return {type:r.type,extension:r.extension,bytes:r.blob.size,blobType:r.blob.type,width:video.videoWidth,height:video.videoHeight,duration,frames:r.frames,stops:r.stops,durationMs:r.durationMs,mean,variance:sum2/n-mean*mean};});
 // The same bytes, saved for inspection outside the browser.
 await fs.mkdir(OUT,{recursive:true});const bytes=Buffer.from(await page.evaluate(async()=>[...new Uint8Array(await window.__tour.arrayBuffer())]));
 const file=path.join(OUT,`tour-v1.${result.extension}`);await fs.writeFile(file,bytes);await fs.writeFile(path.join(OUT,'result.json'),JSON.stringify(result,null,1));
 assert.equal(bytes.length,result.bytes);assert.ok(result.bytes>20_000,JSON.stringify(result));
 assert.match(result.type,/^video\/(mp4|webm)/);assert.equal(result.blobType,result.type.split(';')[0]);assert.equal(result.extension,result.type.startsWith('video/mp4')?'mp4':'webm');
 assert.equal(result.width,1280);assert.equal(result.height,720);assert.equal(result.stops,2);
 assert.ok(result.duration>2,`duration ${result.duration}`);assert.ok(result.variance>20,`frame is not a flat image: ${JSON.stringify(result)}`);
 // Outside the browser (ffprobe when present): the file is a real video of that size.
 const probe=await run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height','-of','json',file]).then(r=>JSON.parse(r.stdout)).catch(()=>null);
 if(probe){await fs.writeFile(path.join(OUT,'ffprobe.json'),JSON.stringify(probe,null,1));assert.equal(probe.streams[0].width,1280);assert.equal(probe.streams[0].height,720);}
 // The presentation is back on its view and still running; the interface offers no recording.
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true);assert.equal(await page.evaluate(()=>FloorPlanPresentation.current?.kind),before);
 assert.equal(await page.evaluate(()=>FloorPlanTourRecorder.busy),false);
 assert.equal(await page.getByText(/grabar|grabación|record/i).count(),0);
 await page.screenshot({path:path.join(OUT,'presentation-after.png')});assert.deepEqual(errors,[]);
});

test('V1 cancel leaves no video and frees the recorder',{timeout:600000,skip},async t=>{
 const {page,errors}=await open(t);
 const outcome=await page.evaluate(async()=>{const c=new AbortController();setTimeout(()=>c.abort(),800);
  try{const r=await FloorPlanTourRecorder.record({holdMs:3000,signal:c.signal});return {blob:r.blob.size};}catch(e){return {name:e.name,busy:FloorPlanTourRecorder.busy};}});
 assert.deepEqual(outcome,{name:'AbortError',busy:false});
 assert.equal(await page.evaluate(()=>FloorPlanPresentation.active),true);assert.deepEqual(errors,[]);
});

test('V1 refuses to record without an active presentation',{timeout:300000,skip},async t=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});t.after(()=>browser.close());
 const page=await browser.newPage();await page.route(/cdn\.jsdelivr\.net/,r=>r.abort());await page.goto(url);await page.waitForFunction(()=>window.FloorPlanTourRecorder);
 const message=await page.evaluate(()=>FloorPlanTourRecorder.record().then(()=>null,e=>e.message));
 assert.equal(message,'Inicia una presentación antes de grabar.');
});
