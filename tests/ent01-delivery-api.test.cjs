// ENT-01 I1A: synthetic API integration. All storage requests are captured by an in-memory fake.
// No Vercel Blob object, real credential, project, or client is ever used.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const {Readable}=require('node:stream');
const Share=require('../api/share.js'),Delivery=require('../api/delivery.js'),Unshare=require('../api/unshare.js');
const EX=require('../docs/contracts/examples/floorplan-project-v1.example.json');
const SHARE_CODE='share-fixture-code-0123456789abcdef',RENDER_CODE='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_Store42_secret',RUBIK_SHARE_TOKEN:SHARE_CODE,RUBIK_RENDER_TOKEN:RENDER_CODE};
const HOST='store42.public.blob.vercel-storage.com';
function snapshot(){const p=JSON.parse(JSON.stringify(EX));p.schemaVersion='1.12.0';return Delivery.Core.buildSnapshot({project:p,now:new Date('2026-11-10T10:00:00Z'),rand:()=>0.42,title:'Casa de prueba'});}
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(v){this.body=v;}};}
function req(body,{token=SHARE_CODE,kind='delivery',method='POST',origin}={}){
 const r={method,body:Buffer.from(typeof body==='string'?body:JSON.stringify(body)),headers:{host:'rubik.test','content-type':'application/json','x-rubik-share-kind':kind,'x-rubik-share-name':'Casa Prueba'}};
 if(token!==null)r.headers['x-rubik-share-token']=token;
 if(origin!==undefined)r.headers.origin=origin;
 return r;
}
async function call(fn,request,opts){const out=res();await fn.handler(request,out,opts);return {status:out.statusCode,body:JSON.parse(out.body),headers:out.headers};}
function fixture(){
 const files=new Map(),calls=[];
 const fetchImpl=async(url,options={})=>{
  calls.push({url,options});
  if(url.startsWith('https://blob.vercel-storage.com/rubik-share/')&&options.method==='PUT'){
   const page='https://'+HOST+'/'+url.slice('https://blob.vercel-storage.com/'.length);
   files.set(page,Buffer.from(options.body));
   return {ok:true,json:async()=>({url:page})};
  }
  if(url==='https://blob.vercel-storage.com/delete'&&options.method==='POST'){
   for(const u of JSON.parse(options.body).urls)files.delete(u);
   return {ok:true,status:200};
  }
  if(files.has(url)){const body=files.get(url);
   return {ok:true,headers:{get:key=>key==='content-length'?String(body.length):null},body:Readable.from([body]),text:async()=>body.toString('utf8')};
  }
  return {ok:false,status:404};
 };
 return {files,calls,fetchImpl};
}
async function publish(st,content=snapshot()){return call(Share,req(content),{env,fetchImpl:st.fetchImpl});}
async function read(st,url){return call(Delivery,{method:'GET',url:'/api/delivery?f='+encodeURIComponent(url)},{env,fetchImpl:st.fetchImpl});}
async function withdraw(st,url,token=SHARE_CODE){
 return call(Unshare,req({urls:[url]},{kind:null,token}),{env,fetchImpl:st.fetchImpl});
}
test('I1A publication is independently authorized, validated before Blob, and preserves the exact .delivery.json suffix',async()=>{
 const st=fixture(),s=snapshot(),out=await publish(st,s);
 assert.equal(out.status,200);assert.equal(out.body.kind,'delivery');
 assert.match(out.body.url,new RegExp('^https://'+HOST.replace(/\./g,'\\.')+'/rubik-share/casa-prueba-[a-f0-9]{24}\\.delivery\\.json$'));
 assert.equal(Delivery.target(out.body.url,HOST),out.body.url);
 const put=st.calls.find(x=>x.options.method==='PUT');
 assert.equal(put.options.headers['x-add-random-suffix'],'0');
 assert.equal(put.options.headers['x-content-type'],'application/json; charset=utf-8');
 assert.deepEqual(JSON.parse(put.options.body.toString()),s);
 assert.ok(!JSON.stringify(out.body).includes('secret'));
});
test('I1A invalid or oversized delivery never reaches storage',async()=>{
 const st=fixture(),ok=snapshot();
 for(const v of ['not json',{}, {...ok,analytics:{user:'test'}},{...ok,content:{...ok.content,project:{...ok.content.project,measurements:[{secret:1}]}}}]){
  const out=await call(Share,req(v),{env,fetchImpl:st.fetchImpl});
  assert.deepEqual([out.status,out.body.error],[400,'file']);
 }
 const huge=await call(Share,req('x'.repeat(Share.LIMIT+1)),{env,fetchImpl:st.fetchImpl});
 assert.equal(huge.status,413);assert.equal(st.calls.length,0);
});
test('I1A render code, missing config and hostile Origin cannot upload or delete any delivery',async()=>{
 const st=fixture(),s=snapshot();
 const cases=[[req(s,{token:RENDER_CODE}),env,401],[req(s,{token:null}),env,401],
  [req(s),{BLOB_READ_WRITE_TOKEN:env.BLOB_READ_WRITE_TOKEN,RUBIK_RENDER_TOKEN:RENDER_CODE},503],
  [req(s,{origin:'https://other.example'}),env,403]];
 for(const [input,config,status] of cases)assert.equal((await call(Share,input,{env:config,fetchImpl:st.fetchImpl})).status,status);
 assert.equal((await withdraw(st,'https://'+HOST+'/rubik-share/x.delivery.json',RENDER_CODE)).status,401);
 assert.equal(st.calls.length,0);
});
test('I1A two deliveries are independent: reading validates the exact contract; withdraw one, other survives',async()=>{
 const st=fixture(),a=(await publish(st)).body.url,b=(await publish(st)).body.url;
 assert.notEqual(a,b);
 const view=await read(st,a);
 assert.equal(view.status,200);assert.equal(view.body.schema,'rubik-sota.client-delivery');
 assert.equal(view.headers['cache-control'],'no-store');assert.equal(view.headers['x-robots-tag'],'noindex, nofollow');
 const gone=await withdraw(st,a);assert.deepEqual(gone.body.removed,[a]);
 assert.equal((await read(st,a)).status,404);assert.equal((await read(st,b)).status,200);
});
test('I1A reader rejects every foreign URL or extension before network access',async()=>{
 const st=fixture(),base='https://'+HOST+'/rubik-share/casa-abc.delivery.json';
 for(const f of ['https://evil.example/rubik-share/casa-abc.delivery.json',base+'?x=1',base+'#x',base+'?',base+'#',base.replace('/rubik-share/','/private/'),
  base.replace('.delivery.json','.html'),'http://'+HOST+'/rubik-share/casa-abc.delivery.json',base.replace('/rubik-share/','/rubik-share/../'),
  'javascript:alert(1)','https://'+HOST+'/rubik-share/a%2Fb.delivery.json']){
  assert.equal((await read(st,f)).status,404,f);
 }
 assert.equal((await call(Delivery,{method:'POST',url:'/api/delivery?f=x'},{env,fetchImpl:st.fetchImpl})).status,405);
 assert.equal((await call(Delivery,{method:'GET',url:'/api/delivery?f='+encodeURIComponent(base)},{env:{},fetchImpl:st.fetchImpl})).status,503);
 assert.equal((await call(Delivery,{method:'GET',url:'/api/delivery?f='+encodeURIComponent(base)+'&f=x'},{env,fetchImpl:st.fetchImpl})).status,404);
 assert.equal(st.calls.length,0);
});
test('I1A malformed response, oversize, storage error and missing Blob are not delivered',async()=>{
 const st=fixture(),url='https://'+HOST+'/rubik-share/fixture-123.delivery.json';
 st.files.set(url,Buffer.from(JSON.stringify({...snapshot(),extra:'not allowed'})));
 assert.equal((await read(st,url)).status,422);
 st.files.set(url,Buffer.alloc(Delivery.MAX_BYTES+1,65));
 assert.equal((await read(st,url)).status,422);
 st.files.set(url,Buffer.from('not json'));
 assert.equal((await read(st,url)).status,422);
 st.files.delete(url);assert.equal((await read(st,url)).status,404);
 const failed=await call(Delivery,{method:'GET',url:'/api/delivery?f='+encodeURIComponent(url)},{env,fetchImpl:async()=>{throw Error('simulated');}});
 assert.equal(failed.status,502);
});
test('I1A unshare restricts the extension to .delivery.json from this store',async()=>{
 const st=fixture(),a=(await publish(st)).body.url;
 const outside='https://another.public.blob.vercel-storage.com/rubik-share/a.delivery.json';
 assert.equal((await withdraw(st,outside)).status,400);
 assert.equal((await withdraw(st,a.replace('.delivery.json','.secret.json'))).status,400);
 assert.ok(st.files.has(a));
 const done=await withdraw(st,a);assert.equal(done.status,200);assert.deepEqual(done.body.removed,[a]);
 assert.equal((await withdraw(st,a)).status,200,'idempotent');
});
