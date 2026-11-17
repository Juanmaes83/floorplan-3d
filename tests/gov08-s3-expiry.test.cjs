// GOV-08 S3 / ENT-02 · Expiry of client links, over the REAL api/share.js, api/view.js, api/delivery.js,
// api/unshare.js and api/publications.js with a simulated clock and a fake in-memory Vercel Blob store.
// Synthetic data and fictitious codes only: no network, nothing real is published, read or deleted.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{Readable}=require('node:stream');
const E=require('../js/share-expiry-core.js'),REG=require('../js/share-registry-core.js');
const Share=require('../api/share.js'),View=require('../api/view.js'),Delivery=require('../api/delivery.js'),Unshare=require('../api/unshare.js'),Pubs=require('../api/publications.js');
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_S3store_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER},HOST='s3store.public.blob.vercel-storage.com';
const HTML='<!doctype html><html lang="es"><body>Propuesta sintética</body></html>';
const T0=Date.UTC(2026,10,17,9,0),DAY=86400000,MIN=60000;
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
function req(body,headers={},method='POST'){const r=Readable.from([Buffer.isBuffer(body)?body:Buffer.from(typeof body==='string'?body:JSON.stringify(body))]);r.method=method;r.headers={host:'rubik.example',...headers};return r;}
// Fake Blob store: PUT honours x-add-random-suffix like Vercel (suffix before the extension), GET ?prefix lists with a
// cursor, POST /delete deletes (idempotent), GET <url> reads. `failDelete` makes deletes of a pathname fail N times.
function blob({pageSize=1000}={}){
 const files=new Map(),calls=[],failDelete=new Map();let n=0,listFail=false;
 const fetchImpl=async(url,init={})=>{calls.push({url,method:init.method||'GET',headers:init.headers||{}});
  if(init.method==='PUT'){let p=new URL(url).pathname;if(init.headers['x-add-random-suffix']==='1')p=p.replace(/\.(html|mp4|webm)$/,`-R${++n}x.$1`);files.set(p,{body:Buffer.from(init.body),uploadedAt:new Date(T0).toISOString()});return {ok:true,status:200,json:async()=>({url:`https://${HOST}${p}`})};}
  if(url.startsWith('https://blob.vercel-storage.com/?')){if(listFail)return {ok:false,status:500,json:async()=>({})};
   const q=new URL(url).searchParams,all=[...files.keys()].filter(p=>p.slice(1).startsWith(q.get('prefix'))).sort(),start=Number(q.get('cursor')||0),page=all.slice(start,start+pageSize);
   return {ok:true,status:200,json:async()=>({blobs:page.map(p=>({url:`https://${HOST}${p}`,pathname:p.slice(1),size:files.get(p).body.length,uploadedAt:files.get(p).uploadedAt})),hasMore:start+pageSize<all.length,cursor:start+pageSize<all.length?String(start+pageSize):undefined})};}
  if(url==='https://blob.vercel-storage.com/delete'){const {urls}=JSON.parse(init.body);for(const u of urls){const p=new URL(u).pathname,k=failDelete.get(p)||0;if(k>0){failDelete.set(p,k-1);return {ok:false,status:500,json:async()=>({})};}}for(const u of urls)files.delete(new URL(u).pathname);return {ok:true,status:200,json:async()=>({})};}
  const hit=files.get(new URL(url).pathname);return hit?{ok:true,status:200,text:async()=>hit.body.toString(),headers:{get:()=>String(hit.body.length)},body:null}:{ok:false,status:404};};
 return {files,calls,fetchImpl,failDelete,set listFail(v){listFail=v;}};
}
const share=async(b,{kind='html',ttl,pub,body=HTML,headers={},now=T0}={})=>{const out=res();const h={'x-rubik-share-token':SHARE,'x-rubik-share-kind':kind,'x-rubik-share-name':'Casa%20Prueba',...headers};if(ttl!==undefined)h['x-rubik-share-ttl']=ttl;if(pub!==undefined)h['x-rubik-share-publication']=pub;
 await Share.handler(req(body,h),out,{env,fetchImpl:b.fetchImpl,now:()=>now});return {status:out.statusCode,json:JSON.parse(out.body)};};
const view=async(b,url,now)=>{const out=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(url)},out,{env,fetchImpl:b.fetchImpl,now:()=>now});return out;};
const delivery=async(b,url,now)=>{const out=res();await Delivery.handler({method:'GET',url:'/api/delivery?f='+encodeURIComponent(url)},out,{env,fetchImpl:b.fetchImpl,now:()=>now});return {status:out.statusCode,json:JSON.parse(out.body)};};
const pubs=async(b,body,{now=T0,headers={}}={})=>{const out=res(),h={'content-type':'application/json','x-rubik-share-token':SHARE,...headers};for(const k of Object.keys(h))if(h[k]===undefined)delete h[k];await Pubs.handler(req(body,h),out,{env,fetchImpl:b.fetchImpl,now:()=>now});return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers};};
const unshare=async(b,urls)=>{const out=res();await Unshare.handler(req({urls},{'content-type':'application/json','x-rubik-share-token':SHARE}),out,{env,fetchImpl:b.fetchImpl});return {status:out.statusCode,json:JSON.parse(out.body)};};
const legacy=(b,name)=>{const p=`/rubik-share/${name}`;b.files.set(p,{body:Buffer.from(HTML),uploadedAt:'2026-11-01T10:00:00.000Z'});return `https://${HOST}${p}`;};

// ---------- core ----------
test('core: 7, 30 or 90 days; absent → 30, never unlimited; anything else is refused',()=>{
 assert.deepEqual([...E.TTL_DAYS],[7,30,90]);assert.equal(E.DEFAULT_TTL,30);
 for(const [raw,days] of [[undefined,30],[null,30],['',30],['7',7],['30',30],['90',90],[7,7]])assert.equal(E.ttl(raw),days,String(raw));
 for(const raw of ['0','1','14','60','91','365','30.0',' 30','-7','abc','unlimited','Infinity','NaN','7e0'])assert.equal(E.ttl(raw),null,raw);
});
test('core: the expiry stamp is UTC minutes, rounded up, and impossible dates are refused',()=>{
 assert.equal(E.stamp(T0),'202611170900');assert.equal(E.stamp(T0+1),'202611170901','rounded up: never shorter than chosen');
 assert.equal(E.fromStamp('202611170900'),T0);for(const s of ['202602310000','202613010000','202611172400','20261117090','abc'])assert.equal(E.fromStamp(s),null,s);
 assert.equal(E.expiresFrom(T0,30),T0+30*DAY);
});
test('core: a publication header is accepted only between now and now + 90 days (+10 min skew)',()=>{
 const id='a'.repeat(24);assert.deepEqual(E.publication(`${id}.x${E.stamp(T0+30*DAY)}`,T0),{id,expiresAt:T0+30*DAY,stamp:E.stamp(T0+30*DAY)});
 assert.ok(E.publication(`${id}.x${E.stamp(T0+90*DAY+9*MIN)}`,T0));
 for(const raw of [`${id}.x${E.stamp(T0+90*DAY+11*MIN)}`,`${id}.x${E.stamp(T0)}`,`${id}.x${E.stamp(T0-DAY)}`,`${id}.x209912312359`,`${'A'.repeat(24)}.x${E.stamp(T0+DAY)}`,`${id.slice(1)}.x${E.stamp(T0+DAY)}`,`${id}.${E.stamp(T0+DAY)}`,'',null])assert.equal(E.publication(raw,T0),null,String(raw));
});
test('core: stored names say publication and date; names without them are legacy; others are not ours',()=>{
 const p={id:'0123456789abcdef01234567',expiresAt:T0+7*DAY};
 const name=E.pathname('casa-prueba',p,'html');assert.equal(name,'rubik-share/casa-prueba--0123456789abcdef01234567--x202611240900.html');
 assert.deepEqual(E.parse(name),{legacy:false,publicationId:p.id,expiresAt:p.expiresAt,ext:'html'});
 assert.deepEqual(E.parse(`https://${HOST}/rubik-share/casa-prueba--0123456789abcdef01234567--x202611240900-AbC123xyz.webm`),{legacy:false,publicationId:p.id,expiresAt:p.expiresAt,ext:'webm'},'provider suffix');
 assert.equal(E.parse('rubik-share/casa--0123456789abcdef01234567--x202611240900.delivery.json').ext,'delivery.json');
 assert.deepEqual(E.parse(`https://${HOST}/rubik-share/casa-serra-Xy12.html`),{legacy:true,publicationId:null,expiresAt:null,ext:'html'});
 assert.equal(E.parse(`https://${HOST}/rubik-share/casa-1a2b.delivery.json`).legacy,true);
 for(const bad of ['private/a.html','rubik-share/a.json','rubik-share/sub/a.html','rubik-share/a--0123456789abcdef01234567--x202602310000.html'.replace('202602310000','202613010000')])assert.equal(E.parse(bad)?.legacy===false,false,bad);
 assert.equal(E.pathname('a--b',p,'html').includes('a--b'),false,'a slug can never fake the separator');
 assert.equal(E.state(E.parse(name),p.expiresAt-1),'active');assert.equal(E.state(E.parse(name),p.expiresAt),'expired','closed at the exact minute');assert.equal(E.state(E.parse(`https://${HOST}/rubik-share/x.html`),T0+9999*DAY),'legacy');
});

// ---------- publishing ----------
test('publish: no TTL → 30 days; 7 and 90 when asked; the date is in the stored name and returned',async()=>{
 for(const [ttl,days] of [[undefined,30],['7',7],['30',30],['90',90]]){const b=blob(),r=await share(b,{ttl});
  assert.equal(r.status,200,String(ttl));const info=E.parse(r.json.url);assert.equal(info.legacy,false);assert.equal(info.expiresAt,T0+days*DAY);
  assert.equal(r.json.publication.expiresAt,new Date(T0+days*DAY).toISOString());assert.equal(r.json.publication.header,`${info.publicationId}.x${E.stamp(T0+days*DAY)}`);
  assert.equal(b.calls[0].headers['x-add-random-suffix'],'1','page keeps the provider suffix');}
});
test('publish: an invalid TTL or publication header is refused BEFORE any storage call',async()=>{
 for(const ttl of ['0','1','365','unlimited','30.5','abc']){const b=blob(),r=await share(b,{ttl});assert.deepEqual([r.status,r.json.error],[400,'ttl'],ttl);assert.equal(b.calls.length,0);}
 const id='b'.repeat(24);
 for(const pub of [`${id}.x${E.stamp(T0+91*DAY)}`,`${id}.x${E.stamp(T0-MIN)}`,`${id}.x${E.stamp(T0)}`,'nope',`${id}.x209901010000`]){const b=blob(),r=await share(b,{pub});assert.deepEqual([r.status,r.json.error],[400,'publication'],pub);assert.equal(b.calls.length,0);}
});
test('publish: video, 3D visit and page of one publication share its id and date; the later header wins over a TTL',async()=>{
 const b=blob(),v=await share(b,{kind:'webm',ttl:'7',body:Buffer.from([0x1a,0x45,0xdf,0xa3])});assert.equal(v.status,200);
 const page=await share(b,{pub:v.json.publication.header,ttl:'90',now:T0+2*MIN});assert.equal(page.status,200);
 const a=E.parse(v.json.url),c=E.parse(page.json.url);assert.equal(a.publicationId,c.publicationId);assert.equal(a.expiresAt,c.expiresAt);assert.equal(c.expiresAt,T0+7*DAY,'the 90 is ignored: the publication already has its date');
});
test('publish: a store that drops the publication from the name is refused (the file could never expire)',async()=>{
 const b=blob(),bad=async(u,i)=>i.method==='PUT'?{ok:true,status:200,json:async()=>({url:`https://${HOST}/rubik-share/casa-prueba-Xy.html`})}:b.fetchImpl(u,i);
 const out=res();await Share.handler(req(HTML,{'x-rubik-share-token':SHARE,'x-rubik-share-kind':'html'}),out,{env,fetchImpl:bad,now:()=>T0});assert.deepEqual([out.statusCode,JSON.parse(out.body).error],[502,'storage-error']);
});
test('publish: still needs the publishing code (S1); the render code and other origins store nothing',async()=>{
 for(const headers of [{'x-rubik-share-token':RENDER},{'x-rubik-share-token':''},{origin:'https://evil.example'}]){const b=blob(),r=await share(b,{headers});assert.ok([401,403].includes(r.status));assert.equal(b.calls.length,0);}
});

// ---------- viewer, 3D visit, withdrawal ----------
test('viewer: before → 200 with the isolated CSP; at and after the expiry minute → 410, without reading the store',async()=>{
 const b=blob(),r=await share(b,{ttl:'7'}),exp=T0+7*DAY;
 const before=await view(b,r.json.url,exp-MIN);assert.equal(before.statusCode,200);assert.match(before.body,/Propuesta sintética/);
 assert.match(before.headers['content-security-policy'],/sandbox allow-scripts allow-downloads$/);assert.doesNotMatch(before.headers['content-security-policy'],/allow-same-origin/);
 for(const t of [exp,exp+MIN,exp+400*DAY]){const reads=b.calls.length,out=await view(b,r.json.url,t);
  assert.equal(out.statusCode,410);assert.equal(out.body,View.EXPIRED);assert.equal(out.headers['cache-control'],'no-store');assert.equal(b.calls.length,reads,'no storage read once expired');}
 assert.ok(b.files.size===1,'expiry closes the viewer; it does not delete the file (that is the purge or a withdrawal)');
});
test('viewer: links published before S3 have no date and keep opening, whatever the clock says (no retroactive expiry)',async()=>{
 const b=blob(),url=legacy(b,'casa-antigua-Ab12.html');
 for(const t of [T0,T0+90*DAY,Date.UTC(2099,0,1)])assert.equal((await view(b,url,t)).statusCode,200);
});
test('3D visit: same rule — 200 before, 410 {error:expired} from the minute it expires; legacy visits keep opening',async()=>{
 const EX=JSON.parse(JSON.stringify(require('../docs/contracts/examples/floorplan-project-v1.example.json')));EX.schemaVersion='1.12.0';
 const snap=Delivery.Core.buildSnapshot({project:EX,now:new Date('2026-11-10T10:00:00Z'),rand:()=>0.42,title:'Casa sintética'});
 const b=blob(),d=await share(b,{kind:'delivery',ttl:'7',body:JSON.stringify(snap)});assert.equal(d.status,200,JSON.stringify(d.json));
 assert.equal(b.calls[0].headers['x-add-random-suffix'],'0');assert.match(d.json.url,/--[0-9a-f]{24}--x\d{12}\.delivery\.json$/);
 assert.equal((await delivery(b,d.json.url,T0+7*DAY-MIN)).status,200);
 const reads=b.calls.length;assert.deepEqual(await delivery(b,d.json.url,T0+7*DAY),{status:410,json:{error:'expired'}});assert.equal(b.calls.length,reads);
 const old=`https://${HOST}/rubik-share/casa-1a2b3c.delivery.json`;b.files.set(new URL(old).pathname,{body:Buffer.from(JSON.stringify(snap)),uploadedAt:'2026-11-01T00:00:00Z'});
 assert.equal((await delivery(b,old,Date.UTC(2099,0,1))).status,200);
});
test('early withdrawal (S2) before the expiry date: the files are deleted and the link answers «no longer available»',async()=>{
 const b=blob(),r=await share(b,{ttl:'30'});const w=await unshare(b,[r.json.url]);assert.deepEqual([w.status,w.json.removed],[200,[r.json.url]]);
 const out=await view(b,r.json.url,T0+DAY);assert.equal(out.statusCode,404);assert.match(out.body,/ya no está disponible/);
});

// ---------- register of the store and purge ----------
async function storeWithEverything(){
 const b=blob();
 const a=await share(b,{ttl:'7'});const av=await share(b,{kind:'webm',pub:a.json.publication.header,body:Buffer.from([0x1a,0x45,0xdf,0xa3])});
 const c=await share(b,{ttl:'90'});const old=legacy(b,'casa-antigua-Zz9.html'),oldVideo=legacy(b,'casa-antigua-Yy8.webm');
 return {b,expiring:[a.json.url,av.json.url],active:c.json.url,legacy:[old,oldVideo]};
}
test('register: lists the whole store by publication, identifies legacy files, and returns only minimal data',async()=>{
 const s=await storeWithEverything(),r=await pubs(s.b,{action:'list'},{now:T0+8*DAY});
 assert.equal(r.status,200);assert.deepEqual(r.json.counts,{active:1,expired:1,legacy:2,inconsistent:0});assert.equal(r.json.store,HOST,'the store host (public, in every URL) is named so a validation can prove which store it uses');assert.equal(r.json.truncated,false);assert.equal(r.headers['cache-control'],'no-store');
 const exp=r.json.publications.find(p=>p.state==='expired');assert.deepEqual(exp.files.map(f=>f.url),[s.expiring[0],s.expiring[1]],'page first, then video');
 assert.equal(exp.expiresAt,new Date(T0+7*DAY).toISOString());
 assert.deepEqual(r.json.publications.filter(p=>p.state==='legacy').map(p=>[p.expiresAt,p.files[0].url]).sort(),s.legacy.map(u=>[null,u]).sort());
 for(const p of r.json.publications){assert.deepEqual(Object.keys(p).sort(),['expiresAt','files','id','state']);for(const f of p.files){assert.deepEqual(Object.keys(f).sort(),['expiresAt','size','uploadedAt','url']);assert.equal(f.expiresAt,p.state==='legacy'?null:p.expiresAt,'one date per coherent publication');}}
 const text=JSON.stringify(r.json);for(const secret of [SHARE,RENDER,env.BLOB_READ_WRITE_TOKEN,'Propuesta'])assert.ok(!text.includes(secret),secret);
});
test('register: before the date everything is active; pagination is followed; a failing store answers 502',async()=>{
 const s=await storeWithEverything();assert.deepEqual((await pubs(s.b,{action:'list'},{now:T0+DAY})).json.counts,{active:2,expired:0,legacy:2,inconsistent:0});
 const b=blob({pageSize:2});for(let i=0;i<5;i++)await share(b,{ttl:'7'});const r=await pubs(b,{action:'list'});
 assert.equal(r.json.counts.active,5);assert.equal(b.calls.filter(c=>c.url.startsWith('https://blob.vercel-storage.com/?')).length,3);
 s.b.listFail=true;assert.deepEqual([(await pubs(s.b,{action:'list'})).status,(await pubs(s.b,{action:'list'})).json.error],[502,'storage-error']);
});
test('purge: a dry run by default — reports what would go and deletes nothing',async()=>{
 const s=await storeWithEverything(),before=s.b.files.size,r=await pubs(s.b,{action:'purge-expired'},{now:T0+8*DAY});
 assert.equal(r.status,200);assert.equal(r.json.dryRun,true);assert.equal(r.json.store,HOST);assert.deepEqual(r.json.wouldRemove,s.expiring);assert.equal(r.json.legacyUntouched,2);
 assert.equal(s.b.files.size,before);assert.equal(s.b.calls.filter(c=>c.url.endsWith('/delete')).length,0);
});
test('purge: with confirm:true deletes ONLY expired files — never active or legacy ones',async()=>{
 const s=await storeWithEverything(),r=await pubs(s.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});
 assert.equal(r.status,200);assert.deepEqual(r.json.removed,s.expiring);assert.deepEqual(r.json.failed,[]);
 const left=[...s.b.files.keys()].map(p=>`https://${HOST}${p}`).sort();assert.deepEqual(left,[s.active,...s.legacy].sort());
 assert.equal((await view(s.b,s.active,T0+8*DAY)).statusCode,200,'the active link keeps opening');
 assert.equal((await view(s.b,s.legacy[0],T0+8*DAY)).statusCode,200,'the legacy link keeps opening');
 const again=await pubs(s.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});assert.deepEqual([again.status,again.json.removed],[200,[]],'idempotent');
});
test('purge: a transient failure is retried once; a persistent one is reported (207) and the next run finishes it',async()=>{
 const s=await storeWithEverything(),[page,video]=s.expiring;
 s.b.failDelete.set(new URL(page).pathname,1);let r=await pubs(s.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});
 assert.deepEqual([r.status,r.json.removed,r.json.failed],[200,[page,video],[]],'one retry absorbs a transient error');
 const t=await storeWithEverything();t.b.failDelete.set(new URL(t.expiring[1]).pathname,5);r=await pubs(t.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});
 assert.equal(r.status,207);assert.deepEqual(r.json.removed,[t.expiring[0]],'the page goes first: the link is closed even if the video fails');assert.deepEqual(r.json.failed,[{url:t.expiring[1],error:'storage-error'}]);
 t.b.failDelete.clear();r=await pubs(t.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});assert.deepEqual([r.status,r.json.removed],[200,[t.expiring[1]]]);
 const u=await storeWithEverything();for(const x of u.expiring)u.b.failDelete.set(new URL(x).pathname,9);assert.equal((await pubs(u.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY})).status,502);
});
test('purge: a TRUNCATED or INCOMPLETE listing refuses any confirmed purge — zero delete calls; the dry run says so',async()=>{
 const deletes=b=>b.calls.filter(c=>c.url==='https://blob.vercel-storage.com/delete').length;
 // (a) more pages than the function reads (MAX_PAGES): 21 expired files, one per page.
 const b=blob({pageSize:1});for(let i=0;i<Pubs.MAX_PAGES+1;i++)await share(b,{ttl:'7'});
 const dry=await pubs(b,{action:'purge-expired'},{now:T0+8*DAY});assert.equal(dry.status,200);assert.equal(dry.json.truncated,true);assert.equal(dry.json.more,true);
 const real=await pubs(b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});
 assert.deepEqual([real.status,real.json.error,real.json.removed],[409,'incomplete-listing',[]]);assert.equal(deletes(b),0,'not one delete call');assert.equal(b.files.size,Pubs.MAX_PAGES+1);
 // (b) the store says «more» but gives no cursor: incomplete, never treated as complete.
 const c=blob();await share(c,{ttl:'7'});const noCursor=async(u,i={})=>{const r=await c.fetchImpl(u,i);if(!u.startsWith('https://blob.vercel-storage.com/?'))return r;const j=await r.json();return {ok:true,status:200,json:async()=>({...j,hasMore:true,cursor:undefined})};};
 const out=res();await Pubs.handler(req({action:'purge-expired',confirm:true},{'content-type':'application/json','x-rubik-share-token':SHARE}),out,{env,fetchImpl:noCursor,now:()=>T0+8*DAY});
 assert.deepEqual([out.statusCode,JSON.parse(out.body).error],[409,'incomplete-listing']);assert.equal(deletes(c),0);assert.equal(c.files.size,1);
 const list=res();await Pubs.handler(req({action:'list'},{'content-type':'application/json','x-rubik-share-token':SHARE}),list,{env,fetchImpl:noCursor,now:()=>T0+8*DAY});assert.equal(JSON.parse(list.body).truncated,true);
});
test('register and purge: same permission as publishing; bad requests touch nothing',async()=>{
 const s=await storeWithEverything(),n=s.b.files.size;
 const cases=[[{'x-rubik-share-token':RENDER},401],[{'x-rubik-share-token':''},401],[{'x-rubik-render-token':SHARE,'x-rubik-share-token':undefined},401],[{origin:'https://evil.example'},403],[{'content-type':'text/plain'},415]];
 for(const [headers,status] of cases){
  const calls=s.b.calls.length,r=await pubs(s.b,{action:'purge-expired',confirm:true},{now:T0+8*DAY,headers});assert.equal(r.status,status,JSON.stringify(headers));assert.equal(s.b.calls.length,calls,'no storage call');}
 for(const body of [{},{action:'delete-all'},{action:'purge-expired',confirm:'yes'},{action:'list',pad:'x'.repeat(2000)}]){const r=await pubs(s.b,body,{now:T0+8*DAY});assert.ok(r.status>=400,JSON.stringify(body).slice(0,40));}
 const out=res();await Pubs.handler(req('',{},'GET'),out,{env,fetchImpl:s.b.fetchImpl});assert.equal(out.statusCode,405);
 assert.equal(s.b.files.size,n,'nothing deleted');
});

test('consistency: page, tour video and 3D visit of one publication share id and date in their stored names',async()=>{
 const EX=JSON.parse(JSON.stringify(require('../docs/contracts/examples/floorplan-project-v1.example.json')));EX.schemaVersion='1.12.0';
 const snap=Delivery.Core.buildSnapshot({project:EX,now:new Date('2026-11-10T10:00:00Z'),rand:()=>0.42,title:'Casa sintética'});
 const b=blob(),v=await share(b,{kind:'webm',ttl:'7',body:Buffer.from([0x1a,0x45,0xdf,0xa3])});
 const d=await share(b,{kind:'delivery',pub:v.json.publication.header,body:JSON.stringify(snap),now:T0+MIN});
 const p=await share(b,{pub:v.json.publication.header,now:T0+2*MIN});
 const infos=[v,d,p].map(x=>{assert.equal(x.status,200);assert.equal(x.json.publication.header,v.json.publication.header);return E.parse(x.json.url);});
 assert.equal(new Set(infos.map(i=>i.publicationId)).size,1);assert.equal(new Set(infos.map(i=>i.expiresAt)).size,1);assert.deepEqual(infos.map(i=>i.ext),['webm','delivery.json','html']);
 const r=await pubs(b,{action:'list'});assert.equal(r.json.publications.length,1);assert.deepEqual(r.json.publications[0].files.map(f=>E.parse(f.url).ext),['html','delivery.json','webm'],'page, then 3D visit, then video');
 // At the date all three close together: page (410), 3D visit (410) — and the purge takes the three.
 assert.equal((await view(b,p.json.url,T0+7*DAY)).statusCode,410);assert.equal((await delivery(b,d.json.url,T0+7*DAY)).status,410);
 assert.deepEqual((await pubs(b,{action:'purge-expired',confirm:true},{now:T0+7*DAY})).json.removed,[p.json.url,d.json.url,v.json.url]);assert.equal(b.files.size,0);
});
test('incoherent grouping: files that share an id but carry different dates are «inconsistent» and an active file is NEVER deleted',async()=>{
 const b=blob(),a=await share(b,{ttl:'7'}),id=E.parse(a.json.url).publicationId;
 // An authorised but misbehaving client re-uses the id with a later date (valid on its own): same id, two dates.
 const late=await share(b,{kind:'webm',pub:`${id}.x${E.stamp(T0+90*DAY)}`,body:Buffer.from([0x1a,0x45,0xdf,0xa3])});assert.equal(late.status,200);
 const r=await pubs(b,{action:'list'},{now:T0+8*DAY});const g=r.json.publications.find(p=>p.id===id);
 assert.equal(g.state,'inconsistent');assert.deepEqual(r.json.counts,{active:0,expired:0,legacy:0,inconsistent:1});
 assert.deepEqual(g.files.map(f=>f.expiresAt).sort(),[new Date(T0+7*DAY).toISOString(),new Date(T0+90*DAY).toISOString()]);
 const dry=await pubs(b,{action:'purge-expired'},{now:T0+8*DAY});assert.deepEqual([dry.json.wouldRemove,dry.json.inconsistentUntouched],[[],1]);
 const real=await pubs(b,{action:'purge-expired',confirm:true},{now:T0+8*DAY});assert.deepEqual([real.status,real.json.removed],[200,[]]);
 assert.equal(b.files.size,2,'nothing of an inconsistent publication is deleted');
 assert.equal((await view(b,a.json.url,T0+8*DAY)).statusCode,410,'its expired page still answers 410 in the viewer');
 // Even a coherent «expired» group never deletes a file whose own name is still active (checked file by file).
 assert.equal(E.isExpired(late.json.url,T0+8*DAY),false);
});

// ---------- «Mis publicaciones» register (this browser) ----------
test('Mis publicaciones: keeps the expiry date; states active → expired at the minute; no date → legacy; S2 states win',()=>{
 const exp=new Date(T0+7*DAY).toISOString();const [e]=REG.add([],{page:`https://${HOST}/rubik-share/a--${'c'.repeat(24)}--x${E.stamp(T0+7*DAY)}-R1x.html`,link:'https://rubik.example/api/view?f=x',project:'Casa',expiresAt:exp,ttlDays:7},new Date(T0));
 assert.equal(e.expiresAt,exp);assert.equal(e.ttlDays,7);
 assert.equal(REG.statusAt(e,T0+7*DAY-1),'active');assert.equal(REG.statusAt(e,T0+7*DAY),'expired');
 const old=REG.clean({page:`https://${HOST}/rubik-share/casa-serra-Xy12.html`,publishedAt:'2026-11-01T10:00:00Z'});assert.equal(old.expiresAt,null);assert.equal(REG.statusAt(old,Date.UTC(2099,0,1)),'legacy');
 // [defect found by the browser test] a legacy entry saved again (expiresAt:null) must stay legacy, never become 1970.
 const resaved=REG.clean(JSON.parse(JSON.stringify(old)));assert.equal(resaved.expiresAt,null);assert.equal(REG.statusAt(resaved,T0),'legacy');assert.equal(resaved.withdrawnAt,null);
 assert.equal(REG.statusAt({...e,state:'withdrawn'},T0+99*DAY),'withdrawn');assert.equal(REG.statusAt({...e,state:'partial'},T0),'partial');
 assert.equal(REG.clean({...e,ttlDays:365}).ttlDays,null,'only 7, 30 or 90');assert.equal(REG.clean({...e,expiresAt:'not a date'}).expiresAt,null);
});

// ---------- CI coverage ----------
test('the S3 browser test runs in CI (blocking partition) and the API is a routed function',()=>{
 const m=JSON.parse(fs.readFileSync(path.join(__dirname,'regression-partitions.json'),'utf8'));
 assert.ok(m.blocking.includes('tests/gov08-s3-expiry.browser.test.cjs'));
 assert.ok(fs.existsSync(path.join(__dirname,'..','api','publications.js')));
});
