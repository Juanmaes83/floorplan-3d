// Libro de gasto común (texto + imagen) sobre un Redis REAL local (redis-server, sin red ni servicio de pago): los scripts
// Lua del almacén se ejecutan de verdad, con conexiones concurrentes. Requiere redis-server en el PATH (la CI lo instala).
const test=require('node:test'),assert=require('node:assert/strict'),net=require('node:net'),{spawn,execFileSync}=require('node:child_process');
const L=require('../api/_spend-ledger.js'),API=require('../api/assistant.js');
let srv,port;
// Minimal RESP client (one connection = one exec function).
function resp(port){const sock=net.connect(port,'127.0.0.1');let buf=Buffer.alloc(0);const q=[];
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
 port=20000+Math.floor(Math.random()*20000);srv=spawn('redis-server',['--port',String(port),'--save','','--appendonly','no'],{stdio:'ignore'});
 for(let i=0;i<50;i++){const e=resp(port);try{await e(['PING']);e.close();return;}catch{e.close();await new Promise(r=>setTimeout(r,100));}}throw new Error('redis did not start');});
test.after(()=>srv?.kill());
const fresh=async()=>{const e=resp(port);await e(['FLUSHALL']);return e;};

test('atomic common cap: 20 concurrent reservations on 20 connections, text and image, never exceed the cap',async()=>{
 const admin=await fresh(),conns=Array.from({length:20},()=>resp(port));
 const results=await Promise.all(conns.map((c,i)=>L.redisStore({exec:c}).reserve({id:'r'+i,family:i%2?'image':'text',usd:0.01,capUsd:0.05})));
 assert.equal(results.filter(r=>r.ok).length,5,'exactly cap/usd reservations pass, whatever the family');
 const s=L.redisStore({exec:admin});assert.equal((await s.snapshot()).reservedUsd,0.05);
 assert.deepEqual(await s.reserve({id:'r0',family:'text',usd:0,capUsd:1}),{ok:false,reason:'duplicate'},'an id is never reserved twice');
 assert.equal((await s.reserve({id:'x',family:'video',usd:0.01,capUsd:1})).reason,'family');
 conns.forEach(c=>c.close());admin.close();
});

test('settle with real usage releases the worst case; double settle is refused; an unsettled reservation keeps counting (error by excess)',async()=>{
 const e=await fresh(),s=L.redisStore({exec:e,now:()=>Date.parse('2026-11-15T10:00:00Z')});
 assert.equal((await s.reserve({id:'a',family:'text',usd:0.04,capUsd:0.1,meta:{model:'m',tariffDate:'2026-11-15'}})).ok,true);
 assert.equal((await s.reserve({id:'b',family:'image',usd:0.05,capUsd:0.1})).ok,true);
 let st=await s.settle('a',{usd:0.0012,basis:'usage'});assert.deepEqual([st.settled,st.text,st.reservedUsd],[true,0.0012,0.05]);
 assert.equal((await s.settle('a',{usd:0.04})).settled,false,'double settle refused');
 assert.equal((await s.reserve({id:'c',family:'text',usd:0.05,capUsd:0.1})).ok,false,'open image reservation still blocks: 0.0012+0.05+0.05 > 0.1');
 assert.equal((await s.reserve({id:'d',family:'text',usd:0.0488,capUsd:0.1})).ok,true);
 const log=await s.log();assert.deepEqual(log.map(x=>x.op),['reserve','reserve','settle','reserve']);
 assert.equal(JSON.stringify(log).match(/question|prompt|content|code|key/i),null,'ledger entries carry no content');
 // KV, idempotency, rate and fails.
 assert.equal(await s.setIfAbsent('idem:k',{s:1},60000),true);assert.equal(await s.setIfAbsent('idem:k',{s:2},60000),false);assert.deepEqual(await s.get('idem:k'),{s:1});
 assert.equal(await s.rate('text',1000,2),true);assert.equal(await s.rate('text',1001,2),true);assert.equal(await s.rate('text',1002,2),false);assert.equal(await s.rate('text',61001,2),true,'window slides');
 assert.equal(await s.fail('code'),1);assert.equal(await s.fail('code'),2);e.close();
});

test('the gateway runs on the persistent store: reserve worst case → provider → settle real usage, ledger reconciles with the provider bill',async()=>{
 const e=await fresh(),store=L.redisStore({exec:e,now:()=>Date.parse('2026-11-15T12:00:00Z')});
 const CODE='c'.repeat(40),ENV={RUBIK_ASSISTANT_ENABLED:'1',RUBIK_ASSISTANT_TOKEN:CODE,RUBIK_ASSISTANT_PROVIDER:'openai-chat',RUBIK_ASSISTANT_PROVIDER_KEY:'sk-assistant-'+'k'.repeat(30),RUBIK_ASSISTANT_MODEL:'gpt-test-mini',
  RUBIK_ASSISTANT_PRICE_INPUT_PER_MTOK:'0.4',RUBIK_ASSISTANT_PRICE_OUTPUT_PER_MTOK:'1.6',RUBIK_ASSISTANT_PRICE_DATE:'2026-11-15',RUBIK_ASSISTANT_BUDGET_CAP_USD:'0.05'};
 const fake=async()=>({ok:true,status:200,json:async()=>({choices:[{message:{role:'assistant',content:'ok'}}],usage:{prompt_tokens:1000,completion_tokens:100}})});
 const r=await new Promise(res=>{const rr={statusCode:0,setHeader(){},end:b=>res({status:rr.statusCode,body:JSON.parse(b)})};
  API.handler({method:'POST',headers:{host:'x','content-type':'application/json','x-rubik-contract':'rubik-assistant/2','x-rubik-assistant-code':CODE},body:JSON.stringify({version:2,action:'step',conversationId:'c',idempotencyKey:'conv_ledger_1',consent:{question:true,projectData:true},context:{},tools:['list_rooms'],messages:[{role:'user',content:'hola'}]})},rr,{env:ENV,log(){},store,fetch:fake});});
 assert.equal(r.status,200);const cost=+((1000*0.4+100*1.6)/1e6).toFixed(6);assert.equal(r.body.usage.costUsd,cost);
 const snap=await store.snapshot();assert.deepEqual([snap.text,snap.reservedUsd],[cost,0],'reservation released, real cost settled');
 const log=await store.log(),rec=L.reconcile(log,[{date:'2026-11-15',family:'text',usd:cost}]);assert.equal(rec.verdict,'ok');assert.equal(rec.totals.text,cost);
 assert.equal(L.reconcile(log,[{date:'2026-11-15',family:'text',usd:cost+0.5}]).verdict,'blocking','a provider bill above the ledger is a blocking finding');
 e.close();
});

test('reconcile: open reservations flag review; families add up to a single common total; storeFromEnv is null without owner configuration',()=>{
 const log=[{op:'reserve',id:'t1',family:'text',usd:0.01,at:'2026-11-15T01:00:00Z'},{op:'settle',id:'t1',usd:0.002,at:'2026-11-15T01:00:01Z'},
  {op:'reserve',id:'i1',family:'image',usd:0.2,at:'2026-11-15T02:00:00Z'},{op:'settle',id:'i1',usd:0.17,at:'2026-11-15T02:00:09Z'},{op:'reserve',id:'i2',family:'image',usd:0.2,at:'2026-11-16T09:00:00Z'}];
 const r=L.reconcile(log,[{date:'2026-11-15',family:'text',usd:0.0019},{date:'2026-11-15',family:'image',usd:0.169}]);
 assert.equal(r.totals.ledgerUsd,0.172);assert.equal(r.verdict,'review');assert.equal(r.rows.find(x=>x.date==='2026-11-16').status,'open-reservations');
 assert.equal(L.storeFromEnv({}),null);assert.equal(L.storeFromEnv({RUBIK_SPEND_STORE_URL:'http://insecure.example',RUBIK_SPEND_STORE_TOKEN:'t'.repeat(30)}),null,'https only');
 assert.equal(L.storeFromEnv({RUBIK_SPEND_STORE_URL:'https://x.upstash.io',RUBIK_SPEND_STORE_TOKEN:'short'}),null);
 assert.equal(L.storeFromEnv({RUBIK_SPEND_STORE_URL:'https://x.upstash.io',RUBIK_SPEND_STORE_TOKEN:'t'.repeat(30)}).kind,'redis','configured by the owner → persistent store');
});

test('offline reconciliation CLI: ok / review / blocking exit codes with synthetic exports; bad input refused',()=>{
 const CLI=require('../scripts/qa/assistant-ledger-reconcile.cjs'),os=require('node:os'),fs=require('node:fs'),path=require('node:path');
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rec-')),w=(n,c)=>{const f=path.join(dir,n);fs.writeFileSync(f,c);return f;};
 const log=w('log.json',JSON.stringify([{op:'reserve',id:'t1',family:'text',usd:0.01,at:'2026-11-20T10:00:00Z'},{op:'settle',id:'t1',usd:0.003,at:'2026-11-20T10:00:02Z'}]));
 const quiet=f=>{const a=console.log,b=console.table,c=console.error;console.log=console.table=console.error=()=>{};try{return f();}finally{console.log=a;console.table=b;console.error=c;}};
 assert.equal(quiet(()=>CLI.main([log,w('ok.csv','fecha,familia,usd\n2026-11-20,text,0.0029\n')])),0);
 assert.equal(quiet(()=>CLI.main([log,w('bad.csv','fecha,familia,usd\n2026-11-20,text,0.5\n')])),2,'provider bill above the ledger → blocking');
 const open=w('open.json',JSON.stringify([{op:'reserve',id:'t2',family:'text',usd:0.01,at:'2026-11-20T11:00:00Z'}]));assert.equal(quiet(()=>CLI.main([open,w('z.csv','fecha,familia,usd\n')])),3,'open reservation → review');
 assert.equal(quiet(()=>CLI.main([log,w('h.csv','a,b\n1,2\n')])),1);assert.equal(quiet(()=>CLI.main([])),1);
});
test('image quota and shared budget are reserved atomically and isolated by beta namespace',async()=>{
 const connection=await fresh();
 try{
  const s=L.redisStore({exec:connection,namespace:'beta-rubik-test'});
  const other=L.redisStore({exec:connection,namespace:'beta-rubik-other'});
  const image={family:'image',usd:.04,capUsd:.1,units:1,maxUnits:2,maxSubjectUnits:1};
  const attempts=await Promise.all(['one','two','three'].map(id=>s.reserve({...image,id,subject:'tester-a'})));
  assert.deepEqual(attempts.map(x=>x.reason).sort(),['ok','tester-outputs','tester-outputs']);
  assert.equal((await s.reserve({...image,id:'b',subject:'tester-b'})).ok,true);
  assert.equal((await s.reserve({...image,id:'c',usd:.01,subject:'tester-c'})).reason,'outputs');
  assert.equal((await s.reserve({id:'text-over',family:'text',usd:.03,capUsd:.1})).reason,'cap');
  const settled=await s.settle('one',{subject:'tester-a',units:1,usd:.02,basis:'provider-usage'});
  assert.deepEqual([settled.settled,settled.outputs,settled.reservedOutputs,settled.spentUsd],[true,1,1,.02]);
  assert.equal((await s.settle('one',{subject:'tester-a',units:1,usd:.02})).settled,false);
  assert.equal((await other.snapshot()).spentUsd,0);
  assert.equal((await other.reserve({...image,id:'one',subject:'tester-a'})).ok,true);
  const Beta=require('../api/_beta-controls.js');
  await s.set(Beta.SWITCH,true);
  assert.equal(await Beta.enabled(s),false);
  assert.equal(await Beta.enabled(other),true);
  assert.equal(await s.remove(Beta.SWITCH),1);
  assert.equal(await Beta.enabled(s),true);
 }finally{connection.close();}
});
