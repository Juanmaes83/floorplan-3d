// GOV-08 / ENT-02 S2 — adversarial audit of link withdrawal (11/11/2026). Complements tests/unshare-api.test.cjs and
// tests/share-registry-core.test.cjs. Written BEFORE any change and run against fdf7fc4; cases tagged [defect] failed
// there and pass after the fix, the rest document behaviour that was already correct. Fictitious codes; the Blob store
// is an in-memory simulator that, like a provider that does not normalise URLs, deletes only the EXACT URL it is
// given and answers ok for a URL it does not hold (delete is idempotent). No network; nothing real is deleted.
'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),{Readable}=require('node:stream'),fs=require('node:fs'),path=require('node:path');
const Unshare=require('../api/unshare.js'),View=require('../api/view.js'),REG=require('../js/share-registry-core.js');
const SHARE='share-fixture-code-0123456789abcdef',RENDER='render-fixture-code-0123456789abcdef';
const env={BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_AbC123_secret',RUBIK_SHARE_TOKEN:SHARE,RUBIK_RENDER_TOKEN:RENDER};
const HOST='abc123.public.blob.vercel-storage.com',page=n=>`https://${HOST}/rubik-share/casa-${n}-Xy12.html`,video=n=>`https://${HOST}/rubik-share/casa-${n}-Vd34.webm`;
function res(){return {statusCode:0,headers:{},body:'',setHeader(k,v){this.headers[k.toLowerCase()]=v;},end(b){this.body=b;}};}
function req(body,{headers={},raw=false,chunks=null}={}){const r=Readable.from(chunks||[Buffer.from(raw?body:JSON.stringify(body))]);r.method='POST';r.headers={host:'rubik.example','content-type':'application/json','x-rubik-share-token':SHARE,...headers};return r;}
async function unshare(r,fetchImpl){const out=res();await Unshare.handler(r,out,{env,fetchImpl});return {status:out.statusCode,json:JSON.parse(out.body),headers:out.headers};}
function strictStore(urls){const files=new Set(urls),deletes=[];let failNext=0,throwNext=0;
 const fetchImpl=async(url,init={})=>{
  if(url==='https://blob.vercel-storage.com/delete'){const {urls:list}=JSON.parse(init.body);deletes.push(...list);
   if(throwNext){throwNext--;throw new Error('network');}if(failNext){failNext--;return {ok:false,status:500,json:async()=>({})};}
   for(const u of list)files.delete(u);return {ok:true,status:200,json:async()=>({})};}
  return files.has(url)?{ok:true,status:200,text:async()=>'<!doctype html><p>x'}:{ok:false,status:404};};
 return {files,deletes,fetchImpl,fail(n=1){failNext=n;},throw(n=1){throwNext=n;}};}
const none=()=>assert.fail('no storage call');

// ---------- 5.2 destination ----------
for(const [name,variant,tag] of [['trailing «?»',page(1)+'?','[defect]'],['trailing «#»',page(1)+'#','[defect]'],['explicit :443',page(1).replace(HOST,HOST+':443'),'[ya correcto]'],['upper-case host',page(1).replace(HOST,HOST.toUpperCase()),'[ya correcto]'],
 ['dot segment',page(1).replace('/rubik-share/','/rubik-share/./'),'[ya correcto]'],['dot-dot back into the folder',page(1).replace('/rubik-share/','/rubik-share/x/../'),'[ya correcto]'],['backslashes',page(1).replace(/\//g,'\\').replace('https:\\\\','https://'),'[ya correcto]']])
 test(`${tag} an equivalent variant (${name}) withdraws the REAL stored file — never a false «removed»`,async()=>{
  const s=strictStore([page(1)]),r=await unshare(req({urls:[variant]}),s.fetchImpl);
  assert.equal(r.status,200);assert.deepEqual(r.json,{removed:[page(1)],failed:[]});
  assert.deepEqual(s.deletes,[page(1)],'the provider receives the canonical URL');assert.ok(!s.files.has(page(1)),'the stored object is really gone');
 });
test('[defect] variants of one file count once: one delete call, one result',async()=>{
 const s=strictStore([page(1)]),r=await unshare(req({urls:[page(1),page(1)+'?',page(1)+'#',page(1).replace(HOST,HOST+':443')]}),s.fetchImpl);
 assert.deepEqual(r.json,{removed:[page(1)],failed:[]});assert.equal(s.deletes.length,1);
});
test('[defect] only string URLs are accepted: a nested array is not coerced into its first element',async()=>{
 for(const u of [[page(1)],[[page(1)]],{href:page(1)},42,true])assert.deepEqual((await unshare(req({urls:[u]}),none)).json,{error:'urls'},JSON.stringify(u).slice(0,60));
});
test('protection: a URL longer than 2048 characters is refused (no file /api/share writes is that long)',async()=>{
 assert.deepEqual((await unshare(req({urls:[`https://${HOST}/rubik-share/${'a'.repeat(2100)}.html`]}),none)).json,{error:'urls'});
});
test('foreign, encoded or out-of-folder references are refused before any storage call',async()=>{
 for(const u of [`https://${HOST}/rubik-share/%2e%2e/secret/a.html`,`https://${HOST}/rubik-share/a%2Fb.html`,`https://${HOST}/rubik-share/a%00.html`,`https://${HOST}./rubik-share/a.html`,
  `https://${HOST.replace('a','а')}/rubik-share/a.html`,`https://evil.example/${HOST}/rubik-share/a.html`,`https://${HOST}@evil.example/rubik-share/a.html`,`https://${HOST}/rubik-share/a.HTML`,
  `https://${HOST}/rubik-share/a.html.exe`,`https://${HOST}/rubik-share/.html`,`ftp://${HOST}/rubik-share/a.html`,`HTTPS://${HOST}/RUBIK-SHARE/a.html`,`//${HOST}/rubik-share/a.html`,`https://${HOST}/rubik-share/a.mp4?download=1`])
  assert.deepEqual((await unshare(req({urls:[page(1),u]}),none)).json,{error:'urls'},u);
});

// ---------- 5.1 authorisation (already correct) ----------
test('withdrawal needs the publishing code and the same origin; nothing is deleted otherwise',async()=>{
 const cases=[[{'x-rubik-share-token':RENDER},401],[{'x-rubik-share-token':null,'x-rubik-render-token':SHARE},401],[{'x-rubik-share-token':'x'.repeat(40)},401],[{origin:'https://evil.example'},403],[{origin:'null'},403]];
 for(const [headers,status] of cases){const r=req({urls:[page(1)]},{headers});for(const k of Object.keys(r.headers))if(r.headers[k]===null)delete r.headers[k];
  const out=await unshare(r,none);assert.equal(out.status,status,JSON.stringify(headers));assert.ok(!JSON.stringify(out.json).includes(SHARE));assert.equal(out.headers['cache-control'],'no-store');}
});

// ---------- 5.3 limits, body shapes, storage failures (already correct) ----------
test('limits: 8 distinct files, 8 KB, JSON only, every body shape; malformed bodies delete nothing',async()=>{
 assert.equal((await unshare(req({urls:Array.from({length:8},(_,i)=>page(i))}),strictStore(Array.from({length:8},(_,i)=>page(i))).fetchImpl)).status,200);
 assert.deepEqual((await unshare(req({urls:Array.from({length:9},(_,i)=>page(i))}),none)).json,{error:'too-many'});
 assert.equal((await unshare(req({urls:[page(1)]},{headers:{'content-type':'text/plain'}}),none)).status,415);
 assert.equal((await unshare(req({urls:[page(1)]},{headers:{'content-type':'application/json; charset=utf-8'}}),strictStore([page(1)]).fetchImpl)).status,200);
 for(const raw of ['','null','[]','"x"','{"urls":null}','{"urls":{"0":"x"}}','{"urls":[1,2]}','{'])assert.equal((await unshare(req(raw,{raw:true}),none)).status,400,raw);
 assert.equal((await unshare(req(null,{chunks:['{"urls":["'+page(1)+'"]','}']}),strictStore([page(1)]).fetchImpl)).status,200,'string chunks');
 assert.equal((await unshare(req(null,{chunks:Array.from({length:10},()=>Buffer.alloc(1000,32))}),none)).json.error,'urls','stream over 8 KB');
 const parsed=req({});parsed.body={urls:[page(1)],pad:'x'.repeat(9000)};assert.equal((await unshare(parsed,none)).json.error,'urls','parsed object over 8 KB');
});
test('partial and total storage failures are reported file by file and a retry of the pending file completes it',async()=>{
 const s=strictStore([page(1),video(1)]);s.throw(1);
 const first=await unshare(req({urls:[page(1),video(1)]}),s.fetchImpl);
 assert.equal(first.status,207);assert.deepEqual(first.json,{removed:[video(1)],failed:[{url:page(1),error:'storage-unreachable'}]});
 const retry=await unshare(req({urls:first.json.failed.map(f=>f.url)}),s.fetchImpl);assert.deepEqual(retry.json,{removed:[page(1)],failed:[]});
 const t=strictStore([page(2)]);t.fail(1);const all=await unshare(req({urls:[page(2)]}),t.fetchImpl);assert.equal(all.status,502);assert.deepEqual(all.json.removed,[]);
});

// ---------- 5.4 local register (already correct) ----------
test('register: never keeps codes or project data, partial keeps what is left, errors do not change it, clearing deletes nothing',()=>{
 const mem=new Map(),storage={getItem:k=>mem.get(k)??null,setItem:(k,v)=>mem.set(k,v),removeItem:k=>mem.delete(k)};
 let list=REG.add([],{page:page(1),video:video(1),link:'https://rubik.example/api/view?f=x',project:'Casa',versionCode:'v1',token:SHARE,code:SHARE,projectData:{secret:1}});
 REG.save(storage,list);const raw=mem.get(REG.KEY);for(const s of [SHARE,'projectData','secret'])assert.ok(!raw.includes(s),s);
 list=REG.applyWithdrawal(list,page(1),{removed:[video(1)],failed:[{url:page(1),error:'storage-error'}]});
 assert.deepEqual([list[0].state,list[0].pending,REG.toRemove(list[0])],['partial',[page(1)],[page(1)]]);
 list=REG.applyWithdrawal(list,page(1),{removed:[page(1)],failed:[]});assert.deepEqual([list[0].state,list[0].pending],['withdrawn',[]]);
 // A link with another scheme, an http page or garbage never enters the register.
 for(const e of [{page:'http://x/a.html',publishedAt:new Date()},{page:'javascript:alert(1)',publishedAt:new Date()},{page:page(2),publishedAt:'not a date'}])assert.equal(REG.clean(e),null);
 assert.equal(REG.clean({page:page(3),publishedAt:new Date(),link:'javascript:alert(1)'}).link,null);
 assert.ok(REG.clear(storage));assert.equal(mem.size,0,'only the local list is forgotten');
});

// ---------- 5.5 view after withdrawal (already correct) ----------
test('view: a withdrawn file answers «no longer available» with no-store; the response itself is never cached',async()=>{
 const s=strictStore([page(1)]);const before=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(page(1))},before,{env,fetchImpl:s.fetchImpl});
 assert.equal(before.statusCode,200);assert.equal(before.headers['cache-control'],'no-store');
 await unshare(req({urls:[page(1)]}),s.fetchImpl);
 const after=res();await View.handler({method:'GET',url:'/api/view?f='+encodeURIComponent(page(1))},after,{env,fetchImpl:s.fetchImpl});
 assert.equal(after.statusCode,404);assert.equal(after.headers['cache-control'],'no-store');assert.match(after.body,/ya no está disponible/);
});

// ---------- CI coverage ----------
test('[defect] the S2 test files run in CI (they were in no workflow)',()=>{
 const wf=fs.readFileSync(path.join(__dirname,'..','.github','workflows','project-first.yml'),'utf8');
 for(const f of ['tests/unshare-api.test.cjs','tests/share-registry-core.test.cjs','tests/gov08-s2-adversarial.test.cjs','tests/share-withdraw.browser.test.cjs'])assert.ok(wf.includes(f),f+' missing from project-first.yml');
});
