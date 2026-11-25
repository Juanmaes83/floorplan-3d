// §3 Render IA · cuota GLOBAL persistente sobre Redis real local: dos instancias (contadores propios) comparten el tope.
// Lua del almacén se ejecutan de verdad, con conexiones concurrentes. Requiere redis-server en el PATH (la CI lo instala).
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),{spawn,execFileSync}=require('node:child_process');
const Render=require('../api/render.js'),L=require('../api/_spend-ledger.js');
const fs=require('node:fs/promises'),os=require('node:os'),path=require('node:path');
let srv,serverClosed,dir,socketPath;
// Minimal RESP client (one connection = one exec function).
function resp(){const sock=net.connect({path:socketPath});let buf=Buffer.alloc(0);const q=[];
 const parse=(b,i)=>{const t=String.fromCharCode(b[i]),e=b.indexOf('\r\n',i);if(e<0)return null;const line=b.toString('utf8',i+1,e);
  if(t==='+')return [line,e+2];if(t==='-')return [new Error(line),e+2];if(t===':')return [Number(line),e+2];
  if(t==='$'){const n=Number(line);if(n<0)return [null,e+2];if(b.length<e+2+n+2)return null;return [b.toString('utf8',e+2,e+2+n),e+2+n+2];}
  if(t==='*'){const n=Number(line);if(n<0)return [null,e+2];let j=e+2;const out=[];for(let k=0;k<n;k++){const r=parse(b,j);if(!r)return null;out.push(r[0]);j=r[1];}return [out,j];}
  throw new Error('resp '+t);};
 sock.on('error',err=>{while(q.length)q.shift().rej(err);});
 sock.on('data',d=>{buf=Buffer.concat([buf,d]);for(;;){if(!buf.length||!q.length)break;const r=parse(buf,0);if(!r)break;buf=buf.subarray(r[1]);const {res,rej}=q.shift();r[0] instanceof Error?rej(r[0]):res(r[0]);}});
 const exec=cmd=>new Promise((res,rej)=>{q.push({res,rej});sock.write('*'+cmd.length+'\r\n'+cmd.map(a=>{const s=String(a);return '$'+Buffer.byteLength(s)+'\r\n'+s+'\r\n';}).join(''));});
 exec.close=()=>sock.destroy();return exec;}
test.before(async()=>{try{execFileSync('redis-server',['--version']);}catch{throw new Error('redis-server no está instalado: es obligatorio para esta prueba (no se omite).');}
 dir=await fs.mkdtemp(path.join(os.tmpdir(),'rubik-redis-'));
 socketPath=path.join(dir,'redis.sock');
 let spawnError;
 srv=spawn('redis-server',['--port','0','--unixsocket',socketPath,'--unixsocketperm','700','--save','','--appendonly','no'],{stdio:'ignore'});
 srv.once('error',error=>{spawnError=error;});
 serverClosed=new Promise(resolve=>srv.once('close',resolve));
 for(let i=0;i<50;i++){
  if(spawnError)throw spawnError;
  if(srv.exitCode!==null||srv.signalCode!==null)throw new Error('test Redis exited before readiness');
  const e=resp();
  try{await e(['PING']);return;}catch{await new Promise(r=>setTimeout(r,100));}finally{e.close();}
 }
 throw new Error('test Redis socket did not become ready');
});
test.after(async()=>{
 if(srv){srv.kill();await serverClosed;}
 if(dir)await fs.rm(dir,{recursive:true,force:true});
});
const fresh=async()=>{const e=resp();await e(['FLUSHALL']);return e;};

const env={OPENAI_API_KEY:'sk-test',RUBIK_RENDER_TOKEN:'access-123',RUBIK_RENDER_ENABLED:'1',RUBIK_RENDER_GLOBAL_QUOTA:'1',RUBIK_RENDER_GLOBAL_MAX_IMAGES:'2',RUBIK_RENDER_GLOBAL_CAP_USD:'5',RUBIK_RENDER_RESERVE_USD:'0.25',RUBIK_RENDER_PRICE_INPUT_TEXT:'5',RUBIK_RENDER_PRICE_INPUT_IMAGE:'10',RUBIK_RENDER_PRICE_OUTPUT:'40',RUBIK_RENDER_MAX_INPUT_TOKENS:'10000',RUBIK_RENDER_MAX_OUTPUT_TOKENS:'7000',RUBIK_RENDER_QUOTA_BOUND_MODEL:Render.MODEL};
// cota = 10000·10 + 7000·40 = 380000 µ$ → 0,38 USD por imagen (> 0,25 configurado: manda la cota)
const pngOf=(w,h)=>{const b=Buffer.alloc(33);b.writeUInt32BE(0x89504e47,0);b.writeUInt32BE(0x0d0a1a0a,4);b.writeUInt32BE(13,8);b.write('IHDR',12);b.writeUInt32BE(w,16);b.writeUInt32BE(h,20);return 'data:image/png;base64,'+b.toString('base64');};
const png=pngOf(1536,1024);
const out=()=>({statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}});
const rq=(image=png)=>({method:'POST',headers:{'x-rubik-render-token':'access-123'},body:{style:'nordic',image}});
const ok=async()=>({ok:true,status:200,json:async()=>({data:[{b64_json:'AAAA'}]})});
async function call(store,meter,fetchImpl=ok,e=env,image=png){let n=0;const logs=[];const f=async(...a)=>{n++;return fetchImpl(...a);};const o=out();await Render.handler(rq(image),o,{env:e,store,meter,fetchImpl:f,log:l=>logs.push(JSON.parse(l))});return {status:o.statusCode,json:JSON.parse(o.body),calls:n,logs,headers:o.headers};}
test('dos instancias comparten el tope global: 2 imágenes y la tercera se rechaza sin llamar al proveedor',async()=>{
 const admin=await fresh(),a=L.redisStore({exec:resp()}),b=L.redisStore({exec:resp()}),ma=Render.createMeter(),mb=Render.createMeter();
 assert.equal((await call(a,ma)).status,200);assert.equal((await call(b,mb)).status,200);
 const third=await call(a,ma);assert.equal(third.status,429);assert.equal(third.json.error,'global-limit');assert.equal(third.calls,0);
 const s=await a.snapshot();assert.equal(s.outputs,2);assert.equal(s.reservedOutputs,0);assert.equal(s.image,0.76);assert.equal(s.reservedUsd,0);admin.close();});
test('concurrencia: 6 peticiones simultáneas en 6 conexiones con tope 3 → exactamente 3 llamadas al proveedor',async()=>{
 const admin=await fresh(),e={...env,RUBIK_RENDER_GLOBAL_MAX_IMAGES:'3'};
 const r=await Promise.all(Array.from({length:6},()=>call(L.redisStore({exec:resp()}),Render.createMeter(),ok,e)));
 assert.equal(r.filter(x=>x.status===200).length,3);assert.equal(r.reduce((s,x)=>s+x.calls,0),3);admin.close();});
test('fallo del proveedor libera la unidad (no consume cuota) y queda en el registro',async()=>{
 const admin=await fresh(),s=L.redisStore({exec:resp()});
 const bad=async()=>({ok:false,status:500,json:async()=>({})});
 assert.equal((await call(s,Render.createMeter(),bad)).status,502);
 const snap=await s.snapshot();assert.equal(snap.outputs,0);assert.equal(snap.reservedOutputs,0);
 assert.deepEqual((await s.log()).map(x=>x.op),['reserve','settle']);admin.close();});
test('cuota global activada sin almacén → 503 store-not-configured; almacén caído → 503 store-unavailable; nunca se llama al proveedor',async()=>{
 assert.equal((await call(null,Render.createMeter())).json.error,'store-not-configured');
 const down={reserve:async()=>{throw new Error('down');}};const r=await call(down,Render.createMeter());assert.equal(r.json.error,'store-unavailable');assert.equal(r.calls,0);});
test('cuota global desactivada por defecto: comportamiento anterior intacto',()=>{assert.equal(Render.globalQuota({}),null);assert.equal(Render.globalQuota({RUBIK_RENDER_GLOBAL_QUOTA:'1'}).reserveUsd,null);assert.equal(Render.globalQuota(env).reserveUsd,0.38);});
test('cota no verificada para el modelo en uso (p. ej. gpt-image-2.5-sunburst) → 503 quota-bound-unverified, sin proveedor',async()=>{
 for(const m of [undefined,'otro-modelo']){const e={...env};if(m)e.RUBIK_RENDER_QUOTA_BOUND_MODEL=m;else delete e.RUBIK_RENDER_QUOTA_BOUND_MODEL;
  const r=await call(L.redisStore({exec:resp()}),Render.createMeter(),ok,e);assert.equal(r.json.error,'quota-bound-unverified');assert.equal(r.calls,0);}});
test('dimensiones de entrada: lado largo > máximo → 413 image-dimensions, sin proveedor; PNG y JPEG se miden',async()=>{
 const r=await call(L.redisStore({exec:resp()}),Render.createMeter(),ok,env,pngOf(4000,3000));assert.equal(r.status,413);assert.equal(r.calls,0);
 const j=Buffer.from([0xff,0xd8,0xff,0xc0,0,17,8,0x04,0x00,0x06,0x00]);assert.deepEqual(Render.imageDims(Buffer.concat([j,Buffer.alloc(8)])),{w:1536,h:1024});});
test('sin tarifa o sin cotas de tokens la cuota no arranca: 503 quota-not-configured, sin proveedor',async()=>{
 const e={...env};delete e.RUBIK_RENDER_MAX_OUTPUT_TOKENS;const r=await call(L.redisStore({exec:resp()}),Render.createMeter(),ok,e);
 assert.equal(r.json.error,'quota-not-configured');assert.equal(r.calls,0);});
test('tope en USD con concurrencia: 12 simultáneas, tope 1 USD y cota 0,38 → 2 llamadas; reservado+gastado nunca supera el tope',async()=>{
 const admin=await fresh(),e={...env,RUBIK_RENDER_GLOBAL_CAP_USD:'1',RUBIK_RENDER_GLOBAL_MAX_IMAGES:'100'};
 const worst=async()=>({ok:true,status:200,json:async()=>({data:[{b64_json:'AAAA'}],usage:{input_tokens:10000,output_tokens:7000,input_tokens_details:{text_tokens:0,image_tokens:10000}}})});
 const r=await Promise.all(Array.from({length:12},()=>call(L.redisStore({exec:resp()}),Render.createMeter(),worst,e)));
 assert.equal(r.reduce((a,x)=>a+x.calls,0),2);const s=await L.redisStore({exec:resp()}).snapshot();assert.ok(s.spentUsd+s.reservedUsd<=1);assert.equal(s.image,0.76);admin.close();});
test('coste real por encima de la reserva → render-overrun registrado y cuota detenida (503 global-halted)',async()=>{
 const admin=await fresh(),st=L.redisStore({exec:resp()});
 const over=async()=>({ok:true,status:200,json:async()=>({data:[{b64_json:'AAAA'}],usage:{input_tokens:10000,output_tokens:20000,input_tokens_details:{text_tokens:0,image_tokens:10000}}})});
 const a=await call(st,Render.createMeter(),over);assert.equal(a.status,200);assert.ok(a.logs.some(l=>l.status==='render-overrun'));
 const b=await call(st,Render.createMeter());assert.equal(b.json.error,'global-halted');assert.equal(b.calls,0);admin.close();});
test('liquidación fallida NO se silencia: log ledger-settle-failed, cabecera x-rubik-ledger=unsettled y la reserva sigue contando',async()=>{
 const admin=await fresh(),real=L.redisStore({exec:resp()}),st={...real,settle:async()=>{throw new Error('down');}};
 const r=await call(st,Render.createMeter());assert.equal(r.status,200);assert.equal(r.headers['x-rubik-ledger'],'unsettled');
 assert.ok(r.logs.some(l=>l.status==='ledger-settle-failed'));const s=await real.snapshot();assert.equal(s.reservedUsd,0.38);assert.equal(s.reservedOutputs,1);
 const rec=L.reconcile(await real.log(),[]);assert.equal(rec.verdict,'review');admin.close();});
