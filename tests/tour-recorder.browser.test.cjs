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
  const duration=video.duration;
  // One thumbnail in the middle of the hold of each stop: each has content, and two stops differ.
  const thumb=async t=>{video.currentTime=t;await new Promise(ok=>video.onseeked=ok);const c=document.createElement('canvas');c.width=160;c.height=90;const x=c.getContext('2d');x.drawImage(video,0,0,160,90);return [...x.getImageData(0,0,160,90).data];};
  const shots=[];for(const m of r.marks)shots.push(await thumb(Math.min(duration-.05,(m.atMs+m.holdMs/2)/1000)));
  const stats=d=>{let sum=0,sum2=0;for(let i=0;i<d.length;i+=4){const l=(d[i]+d[i+1]+d[i+2])/3;sum+=l;sum2+=l*l;}const n=d.length/4,mean=sum/n;return {mean:+mean.toFixed(1),variance:+(sum2/n-mean*mean).toFixed(1)};};
  const diff=(a,b)=>{let t=0;for(let i=0;i<a.length;i+=4)t+=(Math.abs(a[i]-b[i])+Math.abs(a[i+1]-b[i+1])+Math.abs(a[i+2]-b[i+2]))/3;return +(t/(a.length/4)).toFixed(1);};
  return {type:r.type,extension:r.extension,bytes:r.blob.size,blobType:r.blob.type,width:video.videoWidth,height:video.videoHeight,duration,frames:r.frames,stops:r.stops,marks:r.marks,durationMs:r.durationMs,
   shots:shots.map(stats),stopDifference:diff(shots[0],shots[1])};});
 // The same bytes, saved for inspection outside the browser.
 await fs.mkdir(OUT,{recursive:true});const bytes=Buffer.from(await page.evaluate(async()=>[...new Uint8Array(await window.__tour.arrayBuffer())]));
 const file=path.join(OUT,`tour-v1.${result.extension}`);await fs.writeFile(file,bytes);await fs.writeFile(path.join(OUT,'result.json'),JSON.stringify(result,null,1));
 assert.equal(bytes.length,result.bytes);assert.ok(result.bytes>20_000,JSON.stringify(result));
 assert.match(result.type,/^video\/(mp4|webm)/);assert.equal(result.blobType,result.type.split(';')[0]);assert.equal(result.extension,result.type.startsWith('video/mp4')?'mp4':'webm');
 assert.equal(result.width,1280);assert.equal(result.height,720);assert.ok(result.stops>=2);assert.equal(result.marks.length,result.stops);
 assert.ok(result.duration>2,`duration ${result.duration}`);
 for(const shot of result.shots)assert.ok(shot.variance>20,`a stop frame is a flat image: ${JSON.stringify(result.shots)}`);
 assert.ok(result.stopDifference>8,`the video does not change between the first two stops: ${result.stopDifference}`);
 // Outside the browser: ffprobe reads the file. Its outcome is recorded as passed, missing or failed; failed fails.
 let ffprobe;try{const out=await run('ffprobe',['-v','error','-show_entries','stream=codec_name,width,height','-of','json',file]);ffprobe={status:'passed',streams:JSON.parse(out.stdout).streams};}
 catch(error){ffprobe=error.code==='ENOENT'?{status:'missing'}:{status:'failed',message:String(error.stderr||error.message).slice(0,300)};}
 await fs.writeFile(path.join(OUT,'ffprobe.json'),JSON.stringify(ffprobe,null,1));
 assert.notEqual(ffprobe.status,'failed',JSON.stringify(ffprobe));
 if(ffprobe.status==='passed'){assert.equal(ffprobe.streams[0].width,1280);assert.equal(ffprobe.streams[0].height,720);}
 else t.diagnostic('ffprobe missing: external check not done');
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

// Failures inside the recorder never leave it blocked: a MediaRecorder that cannot be built, and one that cannot start
// (no «stop» event will come). Each attempt must reject quickly and leave «busy» false and the presentation running.
test('V1 a recorder that fails to build or to start leaves nothing blocked',{timeout:600000,skip},async t=>{
 const {page,errors}=await open(t);
 const outcome=await page.evaluate(async()=>{const Real=window.MediaRecorder,limit=ms=>new Promise((_,ko)=>setTimeout(()=>ko(Error('hung')),ms)),out={};
  const attempt=async name=>{const t0=performance.now();try{await Promise.race([FloorPlanTourRecorder.record({holdMs:200}),limit(15000)]);out[name]={result:'resolved'};}
   catch(e){out[name]={result:e.message,ms:Math.round(performance.now()-t0),busy:FloorPlanTourRecorder.busy,active:FloorPlanPresentation.active};}};
  class NoBuild extends Real{constructor(){throw new DOMException('no encoder','NotSupportedError');}}
  window.MediaRecorder=NoBuild;await attempt('build');
  class NoStart extends Real{start(){throw new DOMException('cannot start','InvalidStateError');}}
  window.MediaRecorder=NoStart;await attempt('start');
  window.MediaRecorder=Real;const ok=await FloorPlanTourRecorder.record({holdMs:200});out.after={bytes:ok.blob.size,busy:FloorPlanTourRecorder.busy};return out;});
 await fs.mkdir(OUT,{recursive:true});await fs.writeFile(path.join(OUT,'failures.json'),JSON.stringify(outcome,null,1));
 assert.equal(outcome.build.result,'no encoder');assert.equal(outcome.build.busy,false);assert.equal(outcome.build.active,true);
 assert.equal(outcome.start.result,'cannot start');assert.equal(outcome.start.busy,false);assert.ok(outcome.start.ms<10000,JSON.stringify(outcome.start));
 assert.ok(outcome.after.bytes>0);assert.equal(outcome.after.busy,false);assert.deepEqual(errors,[]);
});
