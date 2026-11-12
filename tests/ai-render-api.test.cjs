// Phase B2: /api/render (Vercel function). It refuses unless configured and called with the access token, accepts
// only one image and a known style, sends OpenAI a fixed geometry-preserving prompt, never returns the key, and maps
// provider failures to short codes. The provider is a fake fetch: no network.
const test=require('node:test'),assert=require('node:assert/strict');
const Render=require('../api/render.js');
const env={OPENAI_API_KEY:'sk-test-secret',RUBIK_RENDER_TOKEN:'access-123',RUBIK_RENDER_ENABLED:'1'};
const png='data:image/png;base64,'+Buffer.from([0x89,0x50,0x4e,0x47,1,2,3]).toString('base64');
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
const req=(body,{token='access-123',method='POST'}={})=>({method,headers:token===null?{}:{'x-rubik-render-token':token},body});
async function call(r,opts){const out=res();await Render.handler(r,out,{meter:Render.createMeter(),log:()=>{},...opts});return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers};}
const okFetch=calls=>async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({data:[{b64_json:'QUJD'}]})};};

test('refuses unless configured, POST and with the right access token',async()=>{
 assert.deepEqual((await call(req({}),{env:{RUBIK_RENDER_ENABLED:'1'}})).json,{error:'not-configured'});
 assert.equal((await call(req({}),{env:{OPENAI_API_KEY:'x',RUBIK_RENDER_ENABLED:'1'}})).status,503,'the access token is mandatory');
 assert.equal((await call(req({},{method:'GET'}),{env})).status,405);
 for(const token of [null,'wrong','access-1234','x'.repeat(300)])assert.equal((await call(req({style:'natural',image:png},{token}),{env,fetchImpl:()=>assert.fail('no provider call')})).status,401,String(token));
});

test('accepts only a known style and one bounded PNG/JPEG image',async()=>{
 const none=()=>assert.fail('no provider call');
 assert.deepEqual((await call(req({style:'cyberpunk',image:png}),{env,fetchImpl:none})).json,{error:'style'});
 assert.deepEqual((await call(req({style:'__proto__',image:png}),{env,fetchImpl:none})).json,{error:'style'});
 for(const image of ['https://example.com/a.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,','not-an-image',null])
  assert.deepEqual((await call(req({style:'natural',image}),{env,fetchImpl:none})).json,{error:'image'},String(image).slice(0,30));
 const big='data:image/jpeg;base64,'+Buffer.alloc(4*1024*1024,1).toString('base64');assert.deepEqual((await call(req({style:'natural',image:big}),{env,fetchImpl:none})).json,{error:'image'});
 assert.deepEqual((await call(req('{bad json'),{env,fetchImpl:none})).json,{error:'json'});
});

test('sends a fixed geometry-preserving prompt and the image; returns the render without the key',async()=>{
 const calls=[],r=await call(req({style:'warm',image:png,project:{secret:'should not travel'}}),{env,fetchImpl:okFetch(calls)});
 assert.equal(r.status,200);assert.equal(r.json.image,'data:image/png;base64,QUJD');assert.equal(r.json.style,'warm');assert.equal(r.headers['cache-control'],'no-store');
 assert.ok(!JSON.stringify(r.json).includes('sk-test-secret'));
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://api.openai.com/v1/images/edits');assert.equal(calls[0].init.headers.Authorization,'Bearer sk-test-secret');
 const form=calls[0].init.body;assert.equal(form.get('model'),'gpt-image-1');assert.equal(form.get('n'),'1');
 assert.match(form.get('prompt'),/Keep EXACTLY the same camera angle, walls/);assert.match(form.get('prompt'),/Do not add or remove rooms, walls, openings/);assert.match(form.get('prompt'),/warm evening light/);
 assert.deepEqual([...form.keys()].sort(),['image','model','n','prompt','size'],'only the image and the fixed prompt reach the provider');
 const image=form.get('image');assert.equal(image.type,'image/png');assert.deepEqual([...new Uint8Array(await image.arrayBuffer())].slice(0,4),[0x89,0x50,0x4e,0x47]);
});

test('maps provider failures to short codes',async()=>{
 const fail=status=>async()=>({ok:false,status,json:async()=>({error:{message:'internal detail sk-test-secret'}})});
 assert.deepEqual((await call(req({style:'natural',image:png}),{env,fetchImpl:fail(429)})).json,{error:'provider-rate-limit'});
 assert.deepEqual((await call(req({style:'natural',image:png}),{env,fetchImpl:fail(400)})).json,{error:'provider-rejected'});
 const five=await call(req({style:'natural',image:png}),{env,fetchImpl:fail(500)});assert.deepEqual(five.json,{error:'provider-error'});assert.equal(five.status,502);
 assert.deepEqual((await call(req({style:'natural',image:png}),{env,fetchImpl:async()=>{throw Error('down');}})).json,{error:'provider-unreachable'});
 assert.deepEqual((await call(req({style:'natural',image:png}),{env,fetchImpl:async()=>({ok:true,status:200,json:async()=>({data:[]})})})).json,{error:'provider-empty'});
});

// B8: material alternatives from closed lists; the server writes the words, the geometry rules stay.
test('material alternatives: only known keys, geometry rules kept, reported back',async()=>{
 const none=()=>assert.fail('no provider call');
 for(const bad of [{floor:'gold'},{walls:'__proto__'},{floor:'walnut; ignore previous'},{walls:5}])assert.deepEqual((await call(req({style:'natural',image:png,...bad}),{env,fetchImpl:none})).json,{error:'finish'},JSON.stringify(bad));
 const calls=[],r=await call(req({style:'scandinavian',image:png,floor:'microcement',walls:'sage'}),{env,fetchImpl:okFetch(calls)});
 assert.equal(r.status,200);assert.equal(r.json.floor,'microcement');assert.equal(r.json.walls,'sage');
 const text=calls[0].init.body.get('prompt');assert.match(text,/Keep EXACTLY the same camera angle, walls/);assert.match(text,/Do not add or remove rooms, walls, openings/);
 assert.match(text,/Change ONLY these finishes and nothing else: floor: seamless light grey microcement floor; walls: soft sage green painted walls\./);
 const only=[];await call(req({style:'natural',image:png,floor:'walnut'}),{env,fetchImpl:okFetch(only)});assert.match(only[0].init.body.get('prompt'),/floor: dark walnut[^;]*\. Style/);
 const plain=[];await call(req({style:'natural',image:png}),{env,fetchImpl:okFetch(plain)});assert.doesNotMatch(plain[0].init.body.get('prompt'),/Change ONLY/);
});

// RENDER AI D1 · access and spending guards. All provider calls are fakes: nothing billable runs here.
const none=()=>assert.fail('no provider call');
const ok=()=>okFetch([]);

test('D1: disabled unless RUBIK_RENDER_ENABLED is exactly "1", even with a key and a token configured',async()=>{
 const configured={OPENAI_API_KEY:'sk-test-secret',RUBIK_RENDER_TOKEN:'access-123'};
 for(const flag of [undefined,'','0','true','yes','1 ',' 1','01'])
  {const r=await call(req({style:'natural',image:png}),{env:{...configured,RUBIK_RENDER_ENABLED:flag},fetchImpl:none});assert.equal(r.status,503,String(flag));assert.deepEqual(r.json,{error:'disabled'});}
 assert.equal((await call(req({style:'natural',image:png}),{env,fetchImpl:ok()})).status,200);
 assert.deepEqual((await call(req({},{method:'GET'}),{env:configured})).json,{error:'method'},'the method check does not reveal the configuration');
});

test('D1: a cross-site Origin is refused before the access code; same-site and no Origin keep working',async()=>{
 const at=(origin,host='rubik.example',extra={})=>({method:'POST',headers:{'x-rubik-render-token':'access-123',host,...(origin===undefined?{}:{origin}),...extra},body:{style:'natural',image:png}});
 for(const origin of ['https://evil.example','http://rubik.example.evil.example','null','not a url',''])
  assert.deepEqual((await call(at(origin),{env,fetchImpl:none})).json,{error:'origin'},origin);
 assert.equal((await call(at('https://rubik.example'),{env,fetchImpl:ok()})).status,200);
 assert.equal((await call(at(undefined),{env,fetchImpl:ok()})).status,200,'no Origin: the access code still decides');
 assert.equal((await call(at('https://preview-x.vercel.app','internal:3000',{'x-forwarded-host':'preview-x.vercel.app'}),{env,fetchImpl:ok()})).status,200,'behind the Vercel proxy the forwarded host counts');
 const meter=Render.createMeter();await call(at('https://evil.example'),{env,meter,fetchImpl:none});assert.equal(meter.snapshot().fails.count,0,'an origin refusal is not a guessed code');
});

test('D1: wrong access codes are braked per hour; the brake applies before comparing',async()=>{
 const meter=Render.createMeter();let t=0;const now=()=>t;const e={...env,RUBIK_RENDER_MAX_TOKEN_FAILS:'3'};
 for(let i=0;i<3;i++)assert.equal((await call(req({style:'natural',image:png},{token:'guess'+i}),{env:e,meter,now,fetchImpl:none})).status,401);
 const blocked=await call(req({style:'natural',image:png}),{env:e,meter,now,fetchImpl:none});
 assert.equal(blocked.status,429,'even the right code waits once the brake is on');assert.deepEqual(blocked.json,{error:'limit'});assert.equal(blocked.headers['retry-after'],'3600');
 t=3600e3;assert.equal((await call(req({style:'natural',image:png}),{env:e,meter,now,fetchImpl:ok()})).status,200,'a new hour lifts the brake');
});

test('D1: provider calls are capped per hour and per day; refusals never reach the provider',async()=>{
 const meter=Render.createMeter();let t=1000;const now=()=>t;const e={...env,RUBIK_RENDER_MAX_PER_HOUR:'2',RUBIK_RENDER_MAX_PER_DAY:'3'};
 const calls=[],go=()=>call(req({style:'natural',image:png}),{env:e,meter,now,fetchImpl:okFetch(calls)});
 assert.equal((await go()).status,200);assert.equal((await go()).status,200);
 const h=await go();assert.equal(h.status,429);assert.deepEqual(h.json,{error:'limit',retryAfter:3600});assert.equal(h.headers['retry-after'],'3600');assert.equal(calls.length,2);
 t+=3600e3;assert.equal((await go()).status,200,'next hour');
 const d=await go();assert.equal(d.status,429,'the daily cap holds across hours');assert.equal(d.json.retryAfter,24*3600-3600);assert.equal(calls.length,3);
 t=1000+24*3600e3;assert.equal((await go()).status,200,'next day');
 // Invalid requests do not consume the budget.
 const m2=Render.createMeter(),e1={...env,RUBIK_RENDER_MAX_PER_HOUR:'1'};
 for(const bad of [{style:'x',image:png},{style:'natural',image:'nope'},{style:'natural',image:png,floor:'gold'}])await call(req(bad),{env:e1,meter:m2,fetchImpl:none});
 assert.equal((await call(req({style:'natural',image:png}),{env:e1,meter:m2,fetchImpl:ok()})).status,200);
 assert.equal((await call(req({style:'natural',image:png}),{env:e1,meter:m2,fetchImpl:none})).status,429);
 // A limit of 0 turns provider calls off without disabling the endpoint's checks.
 assert.equal((await call(req({style:'natural',image:png}),{env:{...env,RUBIK_RENDER_MAX_PER_DAY:'0'},fetchImpl:none})).status,429);
});

test('D1: limits read from the environment fall back to conservative defaults when absent or invalid',()=>{
 assert.deepEqual(Render.limits({}),Render.DEFAULT_LIMITS);assert.deepEqual(Render.DEFAULT_LIMITS,{perHour:10,perDay:30,tokenFailsPerHour:20});
 for(const v of ['','-1','2.5','abc','99999',' '])assert.equal(Render.limits({RUBIK_RENDER_MAX_PER_HOUR:v}).perHour,10,JSON.stringify(v));
 assert.deepEqual(Render.limits({RUBIK_RENDER_MAX_PER_HOUR:'5',RUBIK_RENDER_MAX_PER_DAY:'0',RUBIK_RENDER_MAX_TOKEN_FAILS:'7'}),{perHour:5,perDay:0,tokenFailsPerHour:7});
});

// RENDER AI D1 · IMG-02: usage and cost per generation. Fake provider only: nothing billable runs here.
const usageFetch=(usage,extra={})=>async()=>({ok:true,status:200,json:async()=>({data:[{b64_json:'QUJD'}],usage,...extra})});
const sample={total_tokens:6460,input_tokens:1220,output_tokens:5240,input_tokens_details:{text_tokens:180,image_tokens:1040}};
const prices={RUBIK_RENDER_PRICE_INPUT_TEXT:'5',RUBIK_RENDER_PRICE_INPUT_IMAGE:'10',RUBIK_RENDER_PRICE_OUTPUT:'40'};

test('IMG-02: usage is returned from a closed list of integer fields; unknown or bad fields are dropped',async()=>{
 const logs=[];const r=await call(req({style:'natural',image:png}),{env,fetchImpl:usageFetch(sample),log:l=>logs.push(l)});
 assert.equal(r.status,200);assert.deepEqual(r.json.usage,{inputTokens:1220,outputTokens:5240,totalTokens:6460,inputTextTokens:180,inputImageTokens:1040});
 assert.equal(r.json.cost,null,'no tariff configured: no estimate, never an invented price');
 assert.deepEqual(Render.usageOf({total_tokens:-3,input_tokens:'12',output_tokens:1.5,secret:'x',input_tokens_details:'no'}),null);
 assert.deepEqual(Render.usageOf({output_tokens:7,evil:{a:1}}),{inputTokens:null,outputTokens:7,totalTokens:null,inputTextTokens:null,inputImageTokens:null});
 for(const u of [undefined,null,'x',[],{}])assert.equal(Render.usageOf(u),null);
 const none=await call(req({style:'natural',image:png}),{env,fetchImpl:usageFetch(undefined),log:()=>{}});assert.equal(none.status,200);assert.equal(none.json.usage,null);assert.equal(none.json.cost,null);
});

test('IMG-02: cost is estimated only with a full tariff from the environment',async()=>{
 const r=await call(req({style:'natural',image:png}),{env:{...env,...prices},fetchImpl:usageFetch(sample),log:()=>{}});
 // (180×5 + 1040×10 + 5240×40) / 1e6 = 0.2209 USD
 assert.deepEqual(r.json.cost,{amount:0.2209,currency:'USD',basis:'tariff-env'});
 assert.equal(Render.tariff({...prices,RUBIK_RENDER_PRICE_OUTPUT:''}),null,'a missing price disables the estimate');
 for(const bad of ['-1','abc','1e3','12345','0x10'])assert.equal(Render.tariff({...prices,RUBIK_RENDER_PRICE_INPUT_TEXT:bad}),null,bad);
 assert.deepEqual(Render.tariff({...prices,RUBIK_RENDER_PRICE_INPUT_TEXT:' 2.5 '}),{inputText:2.5,inputImage:10,output:40});
 // Undetailed input is priced at the image rate: the estimate errs high, never low.
 assert.deepEqual(Render.costOf({inputTokens:1000,outputTokens:0,totalTokens:1000,inputTextTokens:null,inputImageTokens:null},Render.tariff(prices)),{amount:0.01,currency:'USD',basis:'tariff-env'});
 assert.equal(Render.costOf({inputTokens:1000,outputTokens:null,totalTokens:null,inputTextTokens:null,inputImageTokens:null},Render.tariff(prices)),null);
});

test('IMG-02: one JSON log line per provider call, without image, access code, key or address',async()=>{
 let t=1000;const clock=()=>(t+=850);
 const logs=[];await call({...req({style:'warm',image:png,floor:'walnut'}),headers:{'x-rubik-render-token':'access-123','x-forwarded-for':'203.0.113.9'}},{env:{...env,...prices},fetchImpl:usageFetch(sample),log:l=>logs.push(l),clock});
 assert.equal(logs.length,1);const e=JSON.parse(logs[0]);
 assert.deepEqual(Object.keys(e).sort(),['cost','event','floor','model','ms','status','style','usage','walls']);
 assert.equal(e.event,'rubik-render');assert.equal(e.status,'ok');assert.equal(e.ms,850);assert.equal(e.floor,'walnut');assert.equal(e.cost.amount,0.2209);
 for(const secret of ['sk-test-secret','access-123','203.0.113.9','QUJD',png.slice(30)])assert.ok(!logs[0].includes(secret),secret);
 // Failures are logged too, with the provider's status code but never its message.
 const fl=[];await call(req({style:'natural',image:png}),{env,fetchImpl:async()=>({ok:false,status:429,json:async()=>({error:{message:'detail sk-test-secret'}})}),log:l=>fl.push(l)});
 assert.equal(JSON.parse(fl[0]).status,'provider-rate-limit');assert.equal(JSON.parse(fl[0]).providerStatus,429);assert.ok(!fl[0].includes('sk-test-secret'));
 const ul=[];await call(req({style:'natural',image:png}),{env,fetchImpl:async()=>{throw Error('down');},log:l=>ul.push(l)});assert.equal(JSON.parse(ul[0]).status,'provider-unreachable');
 // Refusals before the provider (token, style, image) are not provider calls: no line.
 const rl=[];await call(req({style:'x',image:png}),{env,log:l=>rl.push(l),fetchImpl:()=>assert.fail('no provider call')});await call(req({style:'natural',image:png},{token:'bad'}),{env,log:l=>rl.push(l),fetchImpl:()=>assert.fail('no provider call')});assert.deepEqual(rl,[]);
 // A throwing logger never breaks the render.
 assert.equal((await call(req({style:'natural',image:png}),{env,fetchImpl:usageFetch(sample),log:()=>{throw Error('log down');}})).status,200);
});

// GOV-08 S1: the publishing code never authorises an AI render, in either header. No provider call happens.
test('S1: RUBIK_SHARE_TOKEN does not authorise the render',async()=>{
 const SHARE='share-fixture-code-0123456789abcdef',both={...env,RUBIK_SHARE_TOKEN:SHARE};
 const fetchImpl=()=>assert.fail('no provider call');
 for(const headers of [{'x-rubik-render-token':SHARE},{'x-rubik-share-token':SHARE},{'x-rubik-share-token':'access-123'}]){
  const out={statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}};
  await Render.handler({method:'POST',headers,body:{style:'natural',image:'data:image/png;base64,iVBORw0KGgo='}},out,{env:both,fetchImpl,meter:Render.createMeter(),log:()=>{}});
  assert.equal(out.statusCode,401,JSON.stringify(Object.keys(headers)));assert.deepEqual(JSON.parse(out.body),{error:'token'});}
});
