// Phase B4: /api/share stores ONE client file (HTML or tour video) in the owner's Vercel Blob store behind the access
// code, and /api/view serves only those HTML files as a page with a strict CSP. The storage is a fake fetch: no network.
const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream');
const Share=require('../api/share.js'),View=require('../api/view.js');
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_AbC123_secret',RUBIK_RENDER_TOKEN:'access-123'};
const HOST='abc123.public.blob.vercel-storage.com',HTML='<!doctype html><html><body>Propuesta</body></html>';
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
function req(body,{token='access-123',kind='html',name='Casa Serra',method='POST'}={}){const r=Readable.from([Buffer.from(body)]);r.method=method;r.headers={};if(token!==null)r.headers['x-rubik-render-token']=token;if(kind!==null)r.headers['x-rubik-share-kind']=kind;r.headers['x-rubik-share-name']=name;return r;}
async function share(r,opts){const out=res();await Share.handler(r,out,opts);return {status:out.statusCode,json:JSON.parse(out.body)};}
const stored=calls=>async(url,init)=>{calls.push({url,init});return {ok:true,status:200,json:async()=>({url:`https://${HOST}/rubik-share/casa-serra-Xy12.html`})};};

test('share refuses unless configured, POST, with the access code and a known kind',async()=>{
 const none=()=>assert.fail('no storage call');
 assert.equal((await share(req(HTML),{env:{RUBIK_RENDER_TOKEN:'x'},fetchImpl:none})).json.error,'not-configured');
 assert.equal((await share(req(HTML,{method:'GET'}),{env,fetchImpl:none})).status,405);
 for(const token of [null,'wrong','x'.repeat(300)])assert.equal((await share(req(HTML,{token}),{env,fetchImpl:none})).status,401);
 for(const kind of [null,'exe','__proto__'])assert.equal((await share(req(HTML,{kind}),{env,fetchImpl:none})).json.error,'kind');
 assert.equal((await share(req('<script>x</script>'),{env,fetchImpl:none})).json.error,'file','only a Rubik HTML document');
 assert.equal((await share(req(''),{env,fetchImpl:none})).json.error,'size');
 assert.equal((await share(req(Buffer.alloc(Share.LIMIT+1,65)),{env,fetchImpl:none})).status,413);
});

test('share stores the file with a random suffix and returns its URL, never the storage token',async()=>{
 const calls=[],r=await share(req(HTML),{env,fetchImpl:stored(calls)});
 assert.equal(r.status,200);assert.equal(r.json.url,`https://${HOST}/rubik-share/casa-serra-Xy12.html`);assert.ok(!JSON.stringify(r.json).includes('secret'));
 assert.equal(calls.length,1);assert.equal(calls[0].url,'https://blob.vercel-storage.com/rubik-share/casa-serra.html');
 assert.equal(calls[0].init.method,'PUT');assert.equal(calls[0].init.headers.authorization,'Bearer vercel_blob_rw_AbC123_secret');
 assert.equal(calls[0].init.headers['x-add-random-suffix'],'1');assert.equal(calls[0].init.headers['x-content-type'],'text/html; charset=utf-8');
 assert.equal(calls[0].init.body.toString(),HTML);
 const video=[];await share(req(Buffer.from([0x1a,0x45,0xdf,0xa3]),{kind:'webm'}),{env,fetchImpl:stored(video)});assert.equal(video[0].init.headers['x-content-type'],'video/webm');assert.match(video[0].url,/\.webm$/);
 assert.equal((await share(req(HTML),{env,fetchImpl:async()=>{throw Error('down');}})).json.error,'storage-unreachable');
 assert.equal((await share(req(HTML),{env,fetchImpl:async()=>({ok:false,status:403,json:async()=>({})})})).json.error,'storage-error');
});

async function view(url,opts){const out=res();await View.handler({method:'GET',url},out,opts);return out;}
test('view serves only published client files from the owner store, with a strict CSP',async()=>{
 const fetched=[],ok=async u=>{fetched.push(u);return {ok:true,status:200,text:async()=>HTML};};
 const good=`https://${HOST}/rubik-share/casa-serra-Xy12.html`;
 const out=await view('/api/view?f='+encodeURIComponent(good),{env,fetchImpl:ok});
 assert.equal(out.statusCode,200);assert.equal(out.body,HTML);assert.equal(out.headers['content-type'],'text/html; charset=utf-8');
 assert.match(out.headers['content-security-policy'],/default-src 'none'.*media-src https:\/\/abc123\.public\.blob\.vercel-storage\.com/);assert.equal(out.headers['x-robots-tag'],'noindex, nofollow');
 for(const bad of ['https://other.public.blob.vercel-storage.com/rubik-share/a.html',`https://${HOST}/private/a.html`,`https://${HOST}/rubik-share/a.mp4`,`http://${HOST}/rubik-share/a.html`,`https://${HOST}/rubik-share/../x.html`,`https://${HOST}/rubik-share/a.html?x=1`,'javascript:alert(1)',''])
  assert.equal((await view('/api/view?f='+encodeURIComponent(bad),{env,fetchImpl:()=>assert.fail('not a proxy')})).statusCode,404,bad);
 assert.deepEqual(fetched,[good]);
 assert.equal((await view('/api/view?f=x',{env:{},fetchImpl:ok})).statusCode,503);
 assert.equal((await view('/api/view?f='+encodeURIComponent(good),{env,fetchImpl:async()=>({ok:false,status:404})})).statusCode,404);
});
