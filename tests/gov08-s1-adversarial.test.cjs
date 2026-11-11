// GOV-08 S1 — adversarial audit of the publishing permission (11/11/2026). Complements tests/share-api.test.cjs.
// Fictitious codes only; the storage and the AI provider are fake fetches that fail the test if they are called.
// Written BEFORE any change and run against 54e6fc3: every case here documents behaviour that was already correct.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream');
const Share=require('../api/share.js'),Render=require('../api/render.js');
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef',BLOB='vercel_blob_rw_AbC123_secret',OPENAI='sk-test-secret-openai';
const env={BLOB_READ_WRITE_TOKEN:BLOB,RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER};
const HTML='<!doctype html><html><body>Propuesta</body></html>';
const none=()=>assert.fail('no storage / provider call may happen');
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
function req({headers={},body=HTML,method='POST'}={}){const r=Readable.from([Buffer.from(body)]);r.method=method;r.headers={host:'rubik.example','x-rubik-share-kind':'html','x-rubik-share-name':'Casa',...headers};return r;}
// Runs the handler with console output captured: nothing may be logged, least of all a code.
async function share(r,e=env,fetchImpl=none){
 const out=res(),logs=[],saved={};for(const k of ['log','info','warn','error','debug'])saved[k]=console[k],console[k]=(...a)=>logs.push(a.join(' '));
 try{await Share.handler(r,out,{env:e,fetchImpl});}finally{Object.assign(console,saved);}
 return {status:out.statusCode,body:out.body,json:JSON.parse(out.body),headers:out.headers,logs};
}
const SECRETS=[SHARE,RENDER,BLOB,OPENAI,'AbC123_secret'];
const clean=r=>{for(const s of SECRETS){assert.ok(!r.body.includes(s),'secret in body');assert.ok(!r.logs.join('\n').includes(s),'secret in logs');}
 assert.equal(r.headers['cache-control'],'no-store');assert.deepEqual(Object.keys(r.json),['error']);};

test('S1-adv: missing, wrong, other-service and old-header codes are refused before any storage call, with nothing leaked',async()=>{
 const cases={'missing':{},'empty':{'x-rubik-share-token':''},'wrong':{'x-rubik-share-token':'x'.repeat(40)},'render code in share header':{'x-rubik-share-token':RENDER},
  'share code in render header':{'x-rubik-render-token':SHARE},'both, share wrong + render right':{'x-rubik-share-token':'nope','x-rubik-render-token':RENDER},
  'longer than 200':{'x-rubik-share-token':SHARE+'x'.repeat(200)},'prefix':{'x-rubik-share-token':SHARE.slice(0,16)},'surrounding space':{'x-rubik-share-token':' '+SHARE},
  'header array (duplicate header)':{'x-rubik-share-token':[SHARE,SHARE]},'number':{'x-rubik-share-token':12345},'blob token':{'x-rubik-share-token':BLOB}};
 for(const [name,headers] of Object.entries(cases)){const r=await share(req({headers}));assert.equal(r.status,401,name);assert.equal(r.json.error,'token',name);clean(r);}
});
test('S1-adv: configuration fails closed — absent, short, too long or shared with the render code; no fallback',async()=>{
 const c=[[{BLOB_READ_WRITE_TOKEN:BLOB},'not-configured'],[{RUBIK_SHARE_TOKEN:SHARE},'not-configured'],[{BLOB_READ_WRITE_TOKEN:BLOB,RUBIK_RENDER_TOKEN:RENDER},'not-configured'],
  [{...env,RUBIK_SHARE_TOKEN:'a'.repeat(31)},'misconfigured'],[{...env,RUBIK_SHARE_TOKEN:'a'.repeat(201)},'misconfigured'],[{...env,RUBIK_SHARE_TOKEN:RENDER},'misconfigured'],
  [{...env,RUBIK_SHARE_TOKEN:''},'not-configured']];
 for(const [e,error] of c)for(const headers of [{'x-rubik-share-token':e.RUBIK_SHARE_TOKEN||SHARE},{'x-rubik-render-token':RENDER}]){
  const r=await share(req({headers}),e);assert.equal(r.status,503,JSON.stringify(Object.keys(e)));assert.equal(r.json.error,error);clean(r);}
 // Boundary: exactly 32 characters is accepted as a configuration (and still needs the right header).
 const ok=await share(req({headers:{'x-rubik-share-token':'b'.repeat(32)},body:'x'}),{...env,RUBIK_SHARE_TOKEN:'b'.repeat(32)});assert.equal(ok.json.error,'file');
});
test('S1-adv: browser requests from another origin are refused even with the right code; ambiguous origins too',async()=>{
 for(const origin of ['https://evil.example','null','not a url','https://rubik.example.evil.example','https://rubik.example:8443','https://evil.example/?h=rubik.example'])
  {const r=await share(req({headers:{'x-rubik-share-token':SHARE,origin}}));assert.equal(r.status,403,origin);clean(r);}
 // A spoofed forwarded host list only counts its first entry (set by the platform, not by a browser).
 assert.equal((await share(req({headers:{'x-rubik-share-token':SHARE,origin:'https://evil.example','x-forwarded-host':'rubik.example, evil.example'}}))).status,403);
 // Same host (the app itself) and server-side tools without Origin are judged by the code alone.
 for(const headers of [{origin:'https://rubik.example'},{}]){const calls=[];const r=await share(req({headers:{'x-rubik-share-token':SHARE,...headers}}),env,async(u,i)=>{calls.push(u);return {ok:true,json:async()=>({url:'https://abc123.public.blob.vercel-storage.com/rubik-share/casa-Xy.html'})};});assert.equal(r.status,200);assert.equal(calls.length,1);}
});
test('S1-adv: the publishing code never authorises the AI render, and the render code never publishes',async()=>{
 const renderEnv={OPENAI_API_KEY:OPENAI,RUBIK_RENDER_TOKEN:RENDER,RUBIK_RENDER_ENABLED:'1',RUBIK_SHARE_TOKEN:SHARE};
 for(const headers of [{'x-rubik-render-token':SHARE},{'x-rubik-share-token':SHARE},{'x-rubik-share-token':SHARE,'x-rubik-render-token':'wrong'}]){
  const out=res();await Render.handler({method:'POST',headers,body:{style:'natural',image:'data:image/png;base64,iVBORw0KGgo='}},out,{env:renderEnv,fetchImpl:none,meter:Render.createMeter(),log:()=>{}});
  assert.equal(out.statusCode,401,JSON.stringify(Object.keys(headers)));assert.ok(!out.body.includes(SHARE)&&!out.body.includes(RENDER));}
 assert.equal((await share(req({headers:{'x-rubik-share-token':RENDER}}))).status,401);
});
test('S1-adv: a valid code still meets every other check (method, kind, size, HTML), and errors never echo input',async()=>{
 const h={'x-rubik-share-token':SHARE};
 assert.equal((await share(req({headers:h,method:'GET'}))).status,405);
 for(const kind of ['exe','','__proto__','HTML'])assert.equal((await share(req({headers:{...h,'x-rubik-share-kind':kind}}))).json.error,'kind',kind);
 assert.equal((await share(req({headers:h,body:'<html>no doctype'}))).json.error,'file');
 const big=req({headers:h,body:''});big[Symbol.asyncIterator]=async function*(){for(let i=0;i<5;i++)yield Buffer.alloc(1024*1024);};
 assert.equal((await share(big)).status,413);
 const echo=await share(req({headers:{...h,'x-rubik-share-kind':'<script>'+SHARE}}));assert.ok(!echo.body.includes('<script>'));clean(echo);
});
