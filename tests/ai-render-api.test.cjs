// Phase B2: /api/render (Vercel function). It refuses unless configured and called with the access token, accepts
// only one image and a known style, sends OpenAI a fixed geometry-preserving prompt, never returns the key, and maps
// provider failures to short codes. The provider is a fake fetch: no network.
const test=require('node:test'),assert=require('node:assert/strict');
const Render=require('../api/render.js');
const env={OPENAI_API_KEY:'sk-test-secret',RUBIK_RENDER_TOKEN:'access-123'};
const png='data:image/png;base64,'+Buffer.from([0x89,0x50,0x4e,0x47,1,2,3]).toString('base64');
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
const req=(body,{token='access-123',method='POST'}={})=>({method,headers:token===null?{}:{'x-rubik-render-token':token},body});
async function call(r,opts){const out=res();await Render.handler(r,out,opts);return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers};}
const okFetch=calls=>async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({data:[{b64_json:'QUJD'}]})};};

test('refuses unless configured, POST and with the right access token',async()=>{
 assert.deepEqual((await call(req({}),{env:{}})).json,{error:'not-configured'});
 assert.equal((await call(req({}),{env:{OPENAI_API_KEY:'x'}})).status,503,'the access token is mandatory');
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
