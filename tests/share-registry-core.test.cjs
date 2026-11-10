// GOV-08 / ENT-02 S2: the local register of «Mis publicaciones». It keeps only what is needed to show and withdraw
// a link, never a code, and survives broken storage. Pure: a Map-backed fake Storage.
const test=require('node:test'),assert=require('node:assert/strict');
const R=require('../js/share-registry-core.js');
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),raw:()=>m.get(R.KEY)};};
const P='https://abc.public.blob.vercel-storage.com/rubik-share/casa-r1.html',V='https://abc.public.blob.vercel-storage.com/rubik-share/casa-r2.webm';

test('S2 register: add, save and load keep only whitelisted fields — never a code',()=>{
 const s=mem();let list=R.add(R.load(s),{page:P,video:V,link:'https://rubik.example/api/view?f=x',project:'Casa Serra',versionCode:'v3',code:'share-secret',token:'t',project_json:'{walls}'},new Date('2026-11-10T10:00:00Z'));
 assert.ok(R.save(s,list));const raw=s.raw();
 for(const leak of ['share-secret','"token"','"code"','walls'])assert.ok(!raw.includes(leak),leak);
 const [e]=R.load(s);
 assert.deepEqual({kind:e.kind,files:e.files,state:e.state,project:e.project,publishedAt:e.publishedAt},{kind:'html+video',files:[P,V],state:'active',project:'Casa Serra',publishedAt:'2026-11-10T10:00:00.000Z'});
 assert.deepEqual(R.toRemove(e),[P,V]);
});

test('S2 register: invalid entries and broken storage are ignored; newest first; capped',()=>{
 assert.deepEqual(R.load({getItem:()=>'{not json'}),[]);assert.deepEqual(R.load({getItem:()=>{throw Error('blocked');}}),[]);
 assert.equal(R.save({setItem:()=>{throw Error('quota');}},[]),false);
 assert.deepEqual(R.add([],{page:'http://insecure/x.html'}),[],'only https files');
 let list=[];for(let i=0;i<R.MAX+5;i++)list=R.add(list,{page:P.replace('r1',`r${i}`)},new Date(Date.UTC(2026,10,10,0,i)));
 assert.equal(list.length,R.MAX);assert.match(list[0].page,new RegExp(`r${R.MAX+4}\\.html$`));
});

test('S2 register: a confirmed withdrawal marks it withdrawn; a partial one keeps the files still to remove',()=>{
 let list=R.add([],{page:P,video:V},new Date('2026-11-10T10:00:00Z'));const id=list[0].id;
 const partial=R.applyWithdrawal(list,id,{removed:[P],failed:[{url:V,error:'storage-error'}]});
 assert.equal(partial[0].state,'partial');assert.deepEqual(R.toRemove(partial[0]),[V]);
 const done=R.applyWithdrawal(partial,id,{removed:[V],failed:[]},new Date('2026-11-10T11:00:00Z'));
 assert.equal(done[0].state,'withdrawn');assert.equal(done[0].withdrawnAt,'2026-11-10T11:00:00.000Z');assert.deepEqual(done[0].pending,[]);
});

test('S2 register: two publications with long, similar URLs never overwrite each other (id = full page URL)',()=>{
 const long=n=>`https://abc.public.blob.vercel-storage.com/rubik-share/${'casa-con-un-nombre-muy-largo-de-proyecto'.repeat(2)}-${n}.html`;
 let list=R.add([],{page:long('aaaa')});list=R.add(list,{page:long('bbbb')});
 assert.equal(list.length,2);assert.deepEqual(list.map(e=>e.id),[long('bbbb'),long('aaaa')]);
});

test('S2 register: an orphan video keeps only its own URL, pending withdrawal',()=>{
 const list=R.addOrphan(R.add([],{page:P}),{video:V,project:'Casa Serra'},new Date('2026-11-10T10:00:00Z'));
 assert.equal(list.length,2);const o=list[0];
 assert.deepEqual({id:o.id,kind:o.kind,state:o.state,files:o.files,link:o.link},{id:V,kind:'orphan-video',state:'partial',files:[V],link:null});
 assert.deepEqual(R.toRemove(o),[V],'only the orphan video is named');
 assert.deepEqual(R.addOrphan([],{video:'http://insecure/x.webm'}),[]);
 const done=R.applyWithdrawal(list,V,{removed:[V],failed:[]});assert.equal(done[0].state,'withdrawn');assert.equal(done[1].state,'active','other entries untouched');
});

test('S2 register: clearing forgets only the local list (no deletion), and tolerates blocked storage',()=>{
 const s=mem();R.save(s,R.add([],{page:P}));assert.ok(s.raw());
 assert.equal(R.clear(s),true);assert.equal(s.raw(),undefined);assert.deepEqual(R.load(s),[]);
 assert.equal(R.clear({removeItem:()=>{throw Error('blocked');}}),false);
});
