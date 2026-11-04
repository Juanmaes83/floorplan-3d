// Delivery 3D V1 endpoints. /api/share accepts a delivery snapshot only if it passes the contract; /api/delivery serves
// only validated snapshots of the owner's store (never a general proxy) and never caches; /api/unshare withdraws the
// files of one delivery from that store, behind the same access code. Storage is a fake fetch: no network.
const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream');
const Share=require('../api/share.js'),Delivery=require('../api/delivery.js'),Unshare=require('../api/unshare.js'),D=require('../js/delivery-core.js');
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_AbC123_secret',RUBIK_RENDER_TOKEN:'access-123'};
const HOST='abc123.public.blob.vercel-storage.com',SNAP_URL=`https://${HOST}/rubik-share/casa-serra-Xy12.delivery.json`;
const project=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');
const snapshot=()=>D.buildSnapshot({project,now:new Date('2026-11-04T10:00:00Z')});
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
async function run(api,r,opts){const out=res();await api.handler(r,out,opts);return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers,body:out.body};}
function post(body,headers){const r=Readable.from([Buffer.from(body)]);r.method='POST';r.headers=headers;return r;}
const shareReq=(body,{token='access-123'}={})=>post(body,{'x-rubik-render-token':token,'x-rubik-share-kind':'delivery','x-rubik-share-name':'Casa Serra'});
const getReq=f=>({method:'GET',url:'/api/delivery'+(f===undefined?'':'?f='+encodeURIComponent(f)),headers:{}});

test('share stores a delivery only when it passes the contract, as JSON, behind the access code',async()=>{
 const calls=[],fetchImpl=async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({url:SNAP_URL})};};
 assert.equal((await run(Share,shareReq(JSON.stringify(snapshot()),{token:'wrong'}),{env,fetchImpl})).status,401);
 const ok=await run(Share,shareReq(JSON.stringify(snapshot())),{env,fetchImpl});
 assert.equal(ok.status,200);assert.deepEqual(ok.json.url,SNAP_URL);assert.equal(ok.json.kind,'delivery');
 assert.equal(calls.length,1);assert.match(calls[0].url,/^https:\/\/blob\.vercel-storage\.com\/rubik-share\/casa-serra\.delivery\.json$/);
 assert.equal(calls[0].init.headers['x-content-type'],'application/json; charset=utf-8');
 const editable=snapshot();editable.content.project.extensions={private:true};
 for(const body of ['{bad json',JSON.stringify(project),JSON.stringify(editable),JSON.stringify({...snapshot(),version:9})])
  assert.deepEqual((await run(Share,shareReq(body),{env,fetchImpl:()=>assert.fail('nothing stored')})).json,{error:'file'});
 assert.equal(JSON.stringify(ok.json).includes('secret'),false,'the store token never reaches the browser');
});

test('delivery serves only validated snapshots of the own store, never cached',async()=>{
 const body=JSON.stringify(snapshot()),seen=[];
 const fetchImpl=async(url,init)=>{seen.push({url,init});return url===SNAP_URL?{ok:true,status:200,text:async()=>body}:{ok:false,status:404,text:async()=>''};};
 const ok=await run(Delivery,getReq(SNAP_URL),{env,fetchImpl});
 assert.equal(ok.status,200);assert.equal(ok.json.schema,'rubik-sota.client-delivery');
 assert.equal(ok.headers['cache-control'],'no-store');assert.equal(ok.headers['x-content-type-options'],'nosniff');
 assert.equal(ok.headers['x-robots-tag'],'noindex, nofollow');assert.equal(ok.headers['referrer-policy'],'no-referrer');
 assert.equal(seen[0].init.cache,'no-store');
 const never=()=>assert.fail('not fetched');
 for(const f of [undefined,'','http://'+HOST+'/rubik-share/a.delivery.json',`https://other.public.blob.vercel-storage.com/rubik-share/a.delivery.json`,
  `https://${HOST}/rubik-share/a.html`,`https://${HOST}/private/a.delivery.json`,`https://${HOST}/rubik-share/../x.delivery.json`,SNAP_URL+'?x=1',SNAP_URL+'#x','https://example.com/a.delivery.json'])
  assert.deepEqual((await run(Delivery,getReq(f),{env,fetchImpl:never})).json,{error:'not-found'},String(f));
 assert.equal((await run(Delivery,{...getReq(SNAP_URL),method:'POST'},{env,fetchImpl:never})).status,405);
 assert.equal((await run(Delivery,getReq(SNAP_URL),{env:{},fetchImpl:never})).status,503);
 const gone=await run(Delivery,getReq(SNAP_URL),{env,fetchImpl:async()=>({ok:false,status:404,text:async()=>'not found'})});
 assert.deepEqual([gone.status,gone.json],[404,{error:'not-found'}],'a withdrawn delivery is simply not available');
 const tampered=await run(Delivery,getReq(SNAP_URL),{env,fetchImpl:async()=>({ok:true,status:200,text:async()=>JSON.stringify({...snapshot(),hero:'https://evil.example/x.png'})})});
 assert.deepEqual([tampered.status,tampered.json],[422,{error:'invalid'}]);
 assert.equal((await run(Delivery,getReq(SNAP_URL),{env,fetchImpl:async()=>{throw Error('down');}})).status,502);
});

test('unshare deletes only files of one delivery in the own store, behind the access code',async()=>{
 const calls=[],fetchImpl=async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({})};};
 const req=(body,token='access-123')=>{const r=post(JSON.stringify(body),{'x-rubik-render-token':token});return r;};
 const page=`https://${HOST}/rubik-share/casa-serra-Ab12.html`,video=`https://${HOST}/rubik-share/casa-serra-Cd34.webm`;
 assert.equal((await run(Unshare,{method:'GET',headers:{}},{env,fetchImpl})).status,405);
 assert.equal((await run(Unshare,req({urls:[page]}),{env:{},fetchImpl})).status,503);
 for(const t of ['wrong','',('x').repeat(300)])assert.equal((await run(Unshare,req({urls:[page]},t),{env,fetchImpl})).status,401);
 for(const urls of [[],null,Array(9).fill(page),[`https://other.public.blob.vercel-storage.com/rubik-share/a.html`],[`https://${HOST}/private/a.html`],[`https://${HOST}/rubik-share/a.png`],[page+'?x'],['javascript:alert(1)']])
  assert.deepEqual((await run(Unshare,req({urls}),{env,fetchImpl})).json,{error:'urls'},JSON.stringify(urls));
 assert.equal(calls.length,0,'nothing deleted on a refused request');
 const ok=await run(Unshare,req({urls:[page,SNAP_URL,video]}),{env,fetchImpl});
 assert.deepEqual([ok.status,ok.json],[200,{removed:3}]);
 assert.equal(calls[0].url,'https://blob.vercel-storage.com/delete');assert.equal(calls[0].init.method,'POST');
 assert.equal(calls[0].init.headers.authorization,'Bearer '+env.BLOB_READ_WRITE_TOKEN);
 assert.deepEqual(JSON.parse(calls[0].init.body),{urls:[page,SNAP_URL,video]});
 assert.ok(!ok.body.includes('secret'));
 assert.deepEqual((await run(Unshare,req({urls:[page]}),{env,fetchImpl:async()=>({ok:false,status:500})})).json,{error:'storage-error'});
});
