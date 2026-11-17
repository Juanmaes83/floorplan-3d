#!/usr/bin/env node
'use strict';
/* GOV-08 S3 · Validation against a REAL Preview deployment backed by an ISOLATED, EXCLUSIVE and EMPTY test Blob store.
   DO NOT RUN without the owner's explicit authorisation and the preparation of docs/security/gov08-s3-validacion-preview.md.
   Required environment (the code is read from the environment and never printed):
     PREVIEW_SHARE_URL      Preview URL with ?_vercel_share=… (sets the Preview access cookie)
     RUBIK_S3_TEST_CODE     test publishing code of THAT Preview (≥ 32 chars)
     TEST_STORE_HOST        public host of the isolated test store, e.g. abc123.public.blob.vercel-storage.com
     PRODUCTION_STORE_HOST  public host of the Production store (from Vercel metadata; never its token)
     OUT                    output folder (default qa-results/gov08-s3-preview)
   Guards — any failure is a FAIL and the run exits 1:
   - isolation is proven BEFORE any write: /api/publications must name TEST_STORE_HOST (≠ PRODUCTION_STORE_HOST), be
     complete (not truncated) and EMPTY (no publication of any state); otherwise nothing is written at all;
   - every file the Preview stores must be on TEST_STORE_HOST, or the run stops and cleans up;
   - a truncated listing or a purge with `more` stops the run;
   - the dry run must leave the store file set identical; the confirmed purge must remove EXACTLY the expected files
     (page, 3D visit and tour video of the expired publication) and nothing else;
   - the final cleanup is verified: the store must be empty again, or the run fails.
   Synthetic content only. Prints one line per check. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),{randomBytes}=require('node:crypto');
const E=require('../../js/share-expiry-core.js'),Core=require('../../js/client-delivery-core.js');
const SHARE=process.env.PREVIEW_SHARE_URL,CODE=process.env.RUBIK_S3_TEST_CODE,TEST_HOST=process.env.TEST_STORE_HOST,PROD_HOST=process.env.PRODUCTION_STORE_HOST,OUT=process.env.OUT||'qa-results/gov08-s3-preview';
const HOST_RE=/^[a-z0-9]+\.public\.blob\.vercel-storage\.com$/;
if(!SHARE||!CODE||CODE.length<32||!HOST_RE.test(TEST_HOST||'')||!HOST_RE.test(PROD_HOST||'')||TEST_HOST===PROD_HOST){
 console.error('PREVIEW_SHARE_URL, RUBIK_S3_TEST_CODE (≥32), TEST_STORE_HOST and PRODUCTION_STORE_HOST (two DIFFERENT public store hosts) are required.');process.exit(2);}
const base=new URL(SHARE).origin,log=[],created=new Set();
class Stop extends Error{}
const ok=(name,cond,info)=>{log.push({name,ok:!!cond});console.log(`${cond?'PASS':'FAIL'} ${name}${info!==undefined?' · '+JSON.stringify(info).slice(0,260):''}`);return !!cond;};
const must=(name,cond,info)=>{if(!ok(name,cond,info))throw new Stop(name);};
const HTML='<!doctype html><html lang="es"><body>Validación S3 · documento sintético</body></html>';
const WEBM=Buffer.from([0x1a,0x45,0xdf,0xa3,0x9f,0x42,0x86,0x81,0x01]); // synthetic WebM header bytes
const sameSet=(a,b)=>a.length===b.length&&[...a].sort().join('\n')===[...b].sort().join('\n');
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'es-ES',timezoneId:'Europe/Madrid'});
 const page=await ctx.newPage();await page.goto(SHARE);
 const api=(route,{method='POST',headers={},data}={})=>ctx.request.fetch(base+'/'+route,{method,headers:{origin:base,...headers},data,failOnStatusCode:false});
 const share=(headers,body,kind)=>api('api/share',{headers:{'x-rubik-share-token':CODE,'x-rubik-share-kind':kind,'x-rubik-share-name':'validacion-s3','content-type':kind==='html'?'text/html; charset=utf-8':kind==='delivery'?'application/json; charset=utf-8':'application/octet-stream',...headers},data:body});
 const pubs=body=>api('api/publications',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json'},data:JSON.stringify(body)});
 const unshare=urls=>api('api/unshare',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json'},data:JSON.stringify({urls})});
 const view=u=>api('api/view?f='+encodeURIComponent(u),{method:'GET'}),visit=u=>api('api/delivery?f='+encodeURIComponent(u),{method:'GET'});
 // Direct (public) access to a stored file. REHEARSAL_BLOB_BASE exists only for the LOCAL rehearsal against a fake
 // store (it must point to 127.0.0.1); a real run never sets it and reads the real public Blob URL.
 const REH=process.env.REHEARSAL_BLOB_BASE;if(REH&&!/^http:\/\/127\.0\.0\.1:\d+$/.test(REH))throw Error('REHEARSAL_BLOB_BASE must be a local 127.0.0.1 address');
 const direct=u=>ctx.request.get(REH?REH+'/__blob'+new URL(u).pathname:u,{failOnStatusCode:false,headers:{'cache-control':'no-cache'}});
 // The whole store, as /api/publications sees it. Always complete and always THIS store, or the run stops.
 const store=async label=>{const r=await pubs({action:'list'}),j=await r.json().catch(()=>({}));
  must(`${label}: store listing answers 200, names the test store and is complete`,r.status()===200&&j.store===TEST_HOST&&j.store!==PROD_HOST&&j.truncated===false,{status:r.status(),store:j.store,truncated:j.truncated});
  return {json:j,files:(j.publications||[]).flatMap(p=>p.files.map(f=>f.url))};};
 const stored=async(r,label)=>{const j=await r.json().catch(()=>({}));if(typeof j.url==='string')created.add(j.url);
  let host=null;try{host=new URL(j.url).hostname;}catch{}
  must(`${label}: stored on the test store`,r.status()===200&&host===TEST_HOST,{status:r.status(),host});return j;};
 try{
  // 0 · isolation, exclusivity and emptiness — BEFORE any write.
  const before=await store('0 pre-flight (no write yet)');
  must('0 the test store is EMPTY before starting (no active, expired, legacy or inconsistent publication)',before.files.length===0&&Object.values(before.json.counts||{}).every(n=>n===0),before.json.counts);
  // 1–3 · publish 7 days, open with the isolated CSP, withdraw early.
  const t0=Date.now(),j1=await stored(await share({'x-rubik-share-ttl':'7'},HTML,'html'),'1 publish 7 days'),i1=E.parse(j1.url);
  ok('1 the date is now + 7 days, written in the stored name',i1&&!i1.legacy&&Math.abs(i1.expiresAt-(t0+7*E.DAY))<5*60000&&j1.publication?.expiresAt===new Date(i1.expiresAt).toISOString(),j1.publication);
  const v1=await view(j1.url);ok('2 opens through /api/view with the isolated CSP',v1.status()===200&&/sandbox allow-scripts allow-downloads$/.test(v1.headers()['content-security-policy']||''),{status:v1.status()});
  const w1=await unshare([j1.url]),w1j=await w1.json().catch(()=>({}));
  ok('3 early withdrawal removes exactly that file',w1.status()===200&&sameSet(w1j.removed||[],[j1.url])&&(w1j.failed||[]).length===0,{status:w1.status()});
  if(w1.status()===200)created.delete(j1.url);
  ok('3 the withdrawn link answers 404 and is gone from the store',(await view(j1.url)).status()===404&&!(await store('3 after withdrawal')).files.includes(j1.url));
  // 4–6 · one publication that expires in 3 minutes: tour video + 3D visit + page.
  const id=randomBytes(12).toString('hex'),exp=Math.ceil((Date.now()+3*60000)/60000)*60000,header=`${id}.x${E.stamp(exp)}`;
  const example=JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','docs','contracts','examples','floorplan-project-v1.example.json'),'utf8'));example.schemaVersion='1.12.0';
  const snap=Core.buildSnapshot({project:example,now:new Date(),rand:Math.random,title:'Validación S3'});
  const jv=await stored(await share({'x-rubik-share-publication':header},WEBM,'webm'),'4 tour video');
  const jd=await stored(await share({'x-rubik-share-publication':header},JSON.stringify(snap),'delivery'),'4 3D visit');
  const jp=await stored(await share({'x-rubik-share-publication':header},HTML,'html'),'4 page');
  const expected=[jp.url,jd.url,jv.url],infos=expected.map(u=>E.parse(u));
  ok('4 page, 3D visit and video share ONE publication id and ONE date',infos.every(i=>i&&!i.legacy&&i.publicationId===id&&i.expiresAt===exp),infos.map(i=>i&&[i.ext,i.publicationId===id,i.expiresAt===exp]));
  ok('5 before the date: page 200, 3D visit 200, video 200',(await view(jp.url)).status()===200&&(await visit(jd.url)).status()===200&&(await direct(jv.url)).status()===200);
  await page.screenshot({path:path.join(OUT,'00-preview.png')});
  while(Date.now()<exp+5000)await new Promise(r=>setTimeout(r,5000));
  const after=await visit(jd.url);ok('6 after the date: page 410 and 3D visit 410 expired',(await view(jp.url)).status()===410&&after.status()===410&&(await after.json()).error==='expired');
  ok('6 S5 limit, as documented: the video is still reachable DIRECTLY until it is deleted',(await direct(jv.url)).status()===200);
  // 7–9 · register, dry run (deletes nothing), confirmed purge (exactly the expected files).
  const s7=await store('7 register');const mine=s7.json.publications.find(p=>p.id===id);
  ok('7 the publication is listed as expired with exactly its 3 files; nothing inconsistent',mine?.state==='expired'&&sameSet(mine.files.map(f=>f.url),expected)&&s7.json.counts.inconsistent===0,s7.json.counts);
  const dryR=await pubs({action:'purge-expired'}),dry=await dryR.json();
  must('8 dry run: complete, this store, no further batch',dryR.status()===200&&dry.dryRun===true&&dry.store===TEST_HOST&&dry.truncated===false&&dry.more===false,{status:dryR.status(),more:dry.more});
  ok('8 dry run plans EXACTLY the 3 expected files',sameSet(dry.wouldRemove||[],expected),dry.wouldRemove);
  const s8=await store('8 after the dry run');ok('8 the dry run deleted NOTHING (same file set)',sameSet(s8.files,s7.files),{before:s7.files.length,after:s8.files.length});
  const realR=await pubs({action:'purge-expired',confirm:true}),real=await realR.json();
  must('9 confirmed purge: complete, this store, no further batch',realR.status()===200&&real.store===TEST_HOST&&real.truncated===false&&real.more===false,{status:realR.status(),more:real.more});
  ok('9 confirmed purge removed EXACTLY the planned files, with no failure',sameSet(real.removed||[],dry.wouldRemove||[])&&(real.failed||[]).length===0,{removed:real.removed?.length,failed:real.failed});
  for(const u of real.removed||[])created.delete(u);
  const s9=await store('9 after the purge');ok('9 nothing else was touched: the store is empty again',s9.files.length===0,s9.json.counts);
  let gone=false;for(let i=0;i<10&&!gone;i++){gone=(await direct(jv.url)).status()===404;if(!gone)await new Promise(r=>setTimeout(r,10000));}
  ok('9 after deletion the video is no longer reachable directly (CDN cache up to ~1 min allowed)',gone);
  // 10 · unauthorised access writes or reads nothing.
  const st=[await api('api/publications',{headers:{'content-type':'application/json'},data:'{"action":"list"}'}),await api('api/publications',{headers:{'x-rubik-share-token':'x'.repeat(40),'content-type':'application/json'},data:'{"action":"list"}'}),await api('api/publications',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json',origin:'https://evil.example'},data:'{"action":"list"}'})].map(r=>r.status());
  ok('10 no code / wrong code / other origin are refused',st[0]===401&&st[1]===401&&st[2]===403,st);
  // 12 · the real UI (nothing is published from it).
  for(const vp of [{width:1440,height:900},{width:390,height:844}]){const p=await ctx.newPage();await p.setViewportSize(vp);await p.goto(base+'/');await p.locator('#welcomeExample').click();
   await p.locator('#workArea-deliver').click();await p.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();const d=p.locator('#shareLinkDialog');await d.waitFor();
   const radios=await d.locator('#shareLinkTtl input').evaluateAll(xs=>xs.map(x=>[x.value,x.checked]));ok(`12 UI ${vp.width}: 7/30/90 with 30 checked`,JSON.stringify(radios)==='[["7",false],["30",true],["90",false]]');
   await d.locator('#shareLinkTtl').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,`12-ui-${vp.width}.png`)});await p.close();}
 }catch(e){if(!(e instanceof Stop))ok('unexpected error',false,e.message);else console.log(`STOP · ${e.message}`);}
 finally{
  // Verified cleanup: withdraw whatever this run still holds, then the store must be empty — or the run FAILS.
  try{
   if(created.size){const r=await unshare([...created]),j=await r.json().catch(()=>({}));ok('cleanup withdraws every file this run created',r.status()===200&&(j.failed||[]).length===0,{status:r.status(),files:created.size});}
   const r=await pubs({action:'list'}),j=await r.json().catch(()=>({}));
   ok('cleanup verified: the test store is empty again',r.status()===200&&j.store===TEST_HOST&&j.truncated===false&&(j.publications||[]).length===0,{status:r.status(),counts:j.counts});
  }catch(e){ok('cleanup verified',false,e.message);}
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(log,null,1));await browser.close();
  const failed=log.filter(x=>!x.ok).length;console.log(`${log.length-failed}/${log.length} PASS`);process.exit(failed?1:0);
 }
})();
