// GOV-08 / ENT-02 S2: /api/unshare withdraws a published link from the owner's Blob store with the PUBLISHING code
// (never the AI render one), only for files under rubik-share/ of this store, and /api/view stops serving it.
// Fictitious codes and a fake in-memory Blob store: no network, nothing real is deleted.
const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream');
const Unshare=require('../api/unshare.js'),Share=require('../api/share.js'),View=require('../api/view.js');
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_AbC123_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER};
const HOST='abc123.public.blob.vercel-storage.com',HTML='<!doctype html><html><body>Propuesta</body></html>';
const page=n=>`https://${HOST}/rubik-share/casa-${n}-Xy12.html`,video=n=>`https://${HOST}/rubik-share/casa-${n}-Vd34.webm`;
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
function req(body,{token=SHARE,header='x-rubik-share-token',method='POST',ct='application/json',origin,raw=false}={}){
 const r=Readable.from([Buffer.from(raw?body:JSON.stringify(body))]);r.method=method;r.headers={host:'rubik.example'};
 if(ct)r.headers['content-type']=ct;if(origin!==undefined)r.headers.origin=origin;if(token!==null)r.headers[header]=token;return r;}
async function unshare(r,opts){const out=res();await Unshare.handler(r,out,opts);return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers};}
// Fake Blob store: PUT (publish), POST /delete (withdraw), GET (read through /api/view).
function blob(initial=[]){const files=new Map(initial.map(u=>[new URL(u).pathname,HTML])),calls=[];let n=0,failOn=new Set();
 const fetchImpl=async(url,init={})=>{calls.push({url,init});
  if(init.method==='PUT'){const p=new URL(url).pathname.replace(/\.(\w+)$/,`-r${++n}.$1`);files.set(p,Buffer.from(init.body).toString());return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(url==='https://blob.vercel-storage.com/delete'){const {urls}=JSON.parse(init.body);if(urls.some(u=>failOn.has(u)))return {ok:false,status:500,json:async()=>({})};for(const u of urls)files.delete(new URL(u).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=files.get(new URL(url).pathname);return hit?{ok:true,status:200,text:async()=>hit}:{ok:false,status:404};};
 return {files,calls,fetchImpl,failOn};}
async function view(url,fetchImpl){const out=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(url)},out,{env,fetchImpl});return out;}
const none=()=>assert.fail('no storage call');

test('S2: unshare uses the S1 permission — the render code, missing or wrong codes and GET delete nothing',async()=>{
 const b={urls:[page(1)]};
 assert.deepEqual((await unshare(req(b,{method:'GET'}),{env,fetchImpl:none})).json,{error:'method'});
 for(const token of [null,'','wrong',RENDER,SHARE.slice(0,-1)+'X','x'.repeat(300)])assert.equal((await unshare(req(b,{token}),{env,fetchImpl:none})).status,401,String(token).slice(0,12));
 assert.equal((await unshare(req(b,{token:RENDER,header:'x-rubik-render-token'}),{env,fetchImpl:none})).status,401,'render header');
 assert.equal((await unshare(req(b,{token:SHARE,header:'x-rubik-render-token'}),{env,fetchImpl:none})).status,401,'old header ignored');
 assert.deepEqual((await unshare(req(b),{env:{BLOB_READ_WRITE_TOKEN:env.BLOB_READ_WRITE_TOKEN,RUBIK_RENDER_TOKEN:RENDER},fetchImpl:none})).json,{error:'not-configured'},'no fallback to the render code');
 assert.deepEqual((await unshare(req(b),{env:{...env,RUBIK_SHARE_TOKEN:RENDER},fetchImpl:none})).json,{error:'misconfigured'});
 assert.deepEqual((await unshare(req(b,{origin:'https://evil.example'}),{env,fetchImpl:none})).json,{error:'origin'});
 assert.deepEqual((await unshare(req(b,{ct:'text/plain'}),{env,fetchImpl:none})).json,{error:'content-type'},'a plain form post cannot withdraw');
});

test('S2: only files under rubik-share/ of this store can be named, at most 8, no arbitrary Blob object',async()=>{
 const bad=['https://other.public.blob.vercel-storage.com/rubik-share/a.html',`https://${HOST}/private/a.html`,`https://${HOST}/a.html`,
  `http://${HOST}/rubik-share/a.html`,`https://${HOST}/rubik-share/a.html?x=1`,`https://${HOST}/rubik-share/a.html#x`,`https://${HOST}/rubik-share/../secret.html`,
  `https://${HOST}/rubik-share/a.json`,`https://${HOST}/rubik-share/sub/a.html`,`https://user:p@${HOST}/rubik-share/a.html`,`https://${HOST}:444/rubik-share/a.html`,'javascript:alert(1)','',42,null];
 for(const u of bad)assert.deepEqual((await unshare(req({urls:[page(1),u]}),{env,fetchImpl:none})).json,{error:'urls'},String(u));
 for(const b of [{},{urls:[]},{urls:'x'},null])assert.equal((await unshare(req(b),{env,fetchImpl:none})).json.error,'urls');
 assert.equal((await unshare(req('{not json',{raw:true}),{env,fetchImpl:none})).json.error,'urls');
 assert.equal((await unshare(req('x'.repeat(9000),{raw:true}),{env,fetchImpl:none})).json.error,'urls','body over 8 KB');
 assert.deepEqual((await unshare(req({urls:Array.from({length:9},(_,i)=>page(i))}),{env,fetchImpl:none})).json,{error:'too-many'});
 assert.equal(Unshare.MAX_FILES,8);
 // Duplicates count once.
 const s=blob([page(1)]);assert.deepEqual((await unshare(req({urls:[page(1),page(1)]}),{env,fetchImpl:s.fetchImpl})).json,{removed:[page(1)],failed:[]});
 assert.equal(s.calls.length,1);
});

test('S2: publish → open → withdraw → the link stops; other links keep working; repeat is safe',async()=>{
 const s=blob();
 const pub=async name=>{const r=Readable.from([Buffer.from(HTML)]);r.method='POST';r.headers={host:'rubik.example','x-rubik-share-token':SHARE,'x-rubik-share-kind':'html','x-rubik-share-name':name};const out=res();await Share.handler(r,out,{env,fetchImpl:s.fetchImpl});return JSON.parse(out.body).url;};
 const a=await pub('Casa A'),b=await pub('Casa B');
 assert.equal((await view(a,s.fetchImpl)).statusCode,200);
 const ok=await view(b,s.fetchImpl);assert.equal(ok.headers['cache-control'],'no-store','S2: /api/view keeps no cached copy of its response');
 const out=await unshare(req({urls:[a]}),{env,fetchImpl:s.fetchImpl});
 assert.equal(out.status,200);assert.deepEqual(out.json,{removed:[a],failed:[]});assert.equal(out.headers['cache-control'],'no-store');
 const del=s.calls.filter(c=>c.url==='https://blob.vercel-storage.com/delete');
 assert.equal(del.length,1);assert.equal(del[0].init.method,'POST');assert.equal(del[0].init.headers.authorization,'Bearer '+env.BLOB_READ_WRITE_TOKEN);assert.deepEqual(JSON.parse(del[0].init.body),{urls:[a]});
 assert.equal((await view(a,s.fetchImpl)).statusCode,404,'withdrawn link no longer served');
 assert.equal((await view(b,s.fetchImpl)).statusCode,200,'the other link keeps working');
 assert.equal((await unshare(req({urls:[a]}),{env,fetchImpl:s.fetchImpl})).status,200,'withdrawing twice is safe');
 for(const secret of [SHARE,RENDER,env.BLOB_READ_WRITE_TOKEN])assert.ok(!JSON.stringify(out.json).includes(secret));
});

test('S2: page and video are withdrawn together; partial and total failures are reported file by file',async()=>{
 const s=blob([page(1),video(1)]);
 assert.deepEqual((await unshare(req({urls:[page(1),video(1)]}),{env,fetchImpl:s.fetchImpl})).json,{removed:[page(1),video(1)],failed:[]});
 assert.equal(s.files.size,0);
 const p=blob([page(2),video(2)]);p.failOn.add(video(2));
 const part=await unshare(req({urls:[page(2),video(2)]}),{env,fetchImpl:p.fetchImpl});
 assert.equal(part.status,207);assert.deepEqual(part.json,{removed:[page(2)],failed:[{url:video(2),error:'storage-error'}]});
 assert.ok(p.files.has(new URL(video(2)).pathname),'the failed file is still there and named for a retry');
 const down=await unshare(req({urls:[page(3)]}),{env,fetchImpl:async()=>{throw Error('down');}});
 assert.equal(down.status,502);assert.deepEqual(down.json,{removed:[],failed:[{url:page(3),error:'storage-unreachable'}]});
});

test('S2: the 8 KB body limit applies to parsed objects, strings, Buffers and streams; unserialisable bodies are refused',async()=>{
 const big={urls:[page(1)],pad:'x'.repeat(Unshare.MAX_BODY)};
 const parsed=b=>{const r={method:'POST',headers:{host:'rubik.example','content-type':'application/json','x-rubik-share-token':SHARE},body:b};return r;};
 const out=async r=>{const o=res();await Unshare.handler(r,o,{env,fetchImpl:none});return {status:o.statusCode,json:JSON.parse(o.body)};};
 assert.deepEqual(await out(parsed(big)),{status:400,json:{error:'urls'}},'object parsed by the platform, over 8 KB');
 assert.deepEqual(await out(parsed(JSON.stringify(big))),{status:400,json:{error:'urls'}},'string over 8 KB');
 assert.deepEqual(await out(parsed(Buffer.from(JSON.stringify(big)))),{status:400,json:{error:'urls'}},'Buffer over 8 KB');
 assert.equal((await unshare(req(big),{env,fetchImpl:none})).json.error,'urls','raw stream over 8 KB');
 // Multi-byte characters are counted in bytes, not characters.
 assert.equal((await out(parsed({urls:[page(1)],pad:'é'.repeat(Unshare.MAX_BODY/2)}))).json.error,'urls');
 const circular={urls:[page(1)]};circular.self=circular;assert.deepEqual(await out(parsed(circular)),{status:400,json:{error:'urls'}});
 assert.deepEqual(await out(parsed({urls:[page(1)],n:10n})),{status:400,json:{error:'urls'}},'BigInt cannot be serialised');
 // A small parsed object still works.
 const s=blob([page(1)]);const o=res();await Unshare.handler(parsed({urls:[page(1)]}),o,{env,fetchImpl:s.fetchImpl});assert.equal(o.statusCode,200);
});
