#!/usr/bin/env node
'use strict';
/* GOV-08 S3 · Validation against a REAL Preview deployment backed by an ISOLATED test Blob store.
   DO NOT RUN without the owner's explicit authorisation and the preparation of
   docs/security/gov08-s3-validacion-preview.md (test store connected only to that Preview, test publishing code).
   Usage:  PREVIEW_SHARE_URL='<preview url with ?_vercel_share=…>' RUBIK_S3_TEST_CODE=… OUT=dir node scripts/qa/gov08-s3-preview-validation.cjs
   The code comes from the environment and is never printed. Synthetic content only. Everything it creates is deleted
   before it exits, even when a check fails. Prints one line per check and exits 1 if any check fails. */
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path');
const E=require('../../js/share-expiry-core.js');
const SHARE=process.env.PREVIEW_SHARE_URL,CODE=process.env.RUBIK_S3_TEST_CODE,OUT=process.env.OUT||'qa-results/gov08-s3-preview';
if(!SHARE||!CODE||CODE.length<32){console.error('PREVIEW_SHARE_URL and RUBIK_S3_TEST_CODE (≥32 chars) are required.');process.exit(2);}
const base=new URL(SHARE).origin,log=[],created=new Set();
const ok=(name,cond,info)=>{log.push({name,ok:!!cond});console.log(`${cond?'PASS':'FAIL'} ${name}${info!==undefined?' · '+JSON.stringify(info).slice(0,240):''}`);};
const HTML='<!doctype html><html lang="es"><body>Validación S3 · documento sintético</body></html>';
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox','--enable-unsafe-swiftshader']});
 const ctx=await browser.newContext({viewport:{width:1440,height:900},locale:'es-ES',timezoneId:'Europe/Madrid'});
 const page=await ctx.newPage();await page.goto(SHARE); // sets the Preview access cookie for the context's requests
 const api=(route,{method='POST',headers={},data}={})=>ctx.request.fetch(base+'/'+route,{method,headers:{origin:base,...headers},data,failOnStatusCode:false});
 const share=(headers,body=HTML,kind='html')=>api('api/share',{headers:{'x-rubik-share-token':CODE,'x-rubik-share-kind':kind,'x-rubik-share-name':'validacion-s3','content-type':kind==='html'?'text/html; charset=utf-8':'application/json; charset=utf-8',...headers},data:body});
 const pubs=body=>api('api/publications',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json'},data:JSON.stringify(body)});
 const unshare=urls=>api('api/unshare',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json'},data:JSON.stringify({urls})});
 const view=u=>api('api/view?f='+encodeURIComponent(u),{method:'GET'}),visit=u=>api('api/delivery?f='+encodeURIComponent(u),{method:'GET'});
 try{
  // 1–3 publish 7 days, open, withdraw early
  const t0=Date.now(),r1=await share({'x-rubik-share-ttl':'7'}),j1=await r1.json();if(j1.url)created.add(j1.url);
  const i1=E.parse(j1.url||'');ok('1 publish 7 days',r1.status()===200&&i1&&!i1.legacy&&Math.abs(Date.parse(j1.publication.expiresAt)-(t0+7*E.DAY))<5*60000,{status:r1.status(),expiresAt:j1.publication?.expiresAt});
  const v1=await view(j1.url);ok('2 open through /api/view with the isolated CSP',v1.status()===200&&/sandbox allow-scripts allow-downloads$/.test(v1.headers()['content-security-policy']||''),{status:v1.status()});
  const w1=await unshare([j1.url]);ok('3 early withdrawal',w1.status()===200&&(await view(j1.url)).status()===404,{status:w1.status()});if(w1.status()===200)created.delete(j1.url);
  // 4–6 a publication that expires in 3 minutes: page + 3D visit
  const id=require('node:crypto').randomBytes(12).toString('hex'),exp=Math.ceil((Date.now()+3*60000)/60000)*60000,header=`${id}.x${E.stamp(exp)}`;
  const snap=JSON.parse(fs.readFileSync(path.join(__dirname,'..','..','docs','contracts','examples','floorplan-project-v1.example.json'),'utf8'));snap.schemaVersion='1.12.0';
  const Core=require('../../js/client-delivery-core.js'),delivery=Core.buildSnapshot({project:snap,now:new Date(),rand:Math.random,title:'Validación S3'});
  const rd=await share({'x-rubik-share-publication':header},JSON.stringify(delivery),'delivery'),jd=await rd.json();if(jd.url)created.add(jd.url);
  const rp=await share({'x-rubik-share-publication':header}),jp=await rp.json();if(jp.url)created.add(jp.url);
  const a=E.parse(jd.url||''),b=E.parse(jp.url||'');ok('4 page and 3D visit share id and date',rd.status()===200&&rp.status()===200&&a?.publicationId===id&&b?.publicationId===id&&a.expiresAt===exp&&b.expiresAt===exp);
  ok('5 before the date: page 200 and visit 200',(await view(jp.url)).status()===200&&(await visit(jd.url)).status()===200);
  await page.screenshot({path:path.join(OUT,'00-preview.png')});
  while(Date.now()<exp+5000)await new Promise(r=>setTimeout(r,5000));
  const after=await visit(jd.url);ok('6 after the date: page 410 and visit 410 expired',(await view(jp.url)).status()===410&&after.status()===410&&(await after.json()).error==='expired');
  // 7–9 register, dry run, confirmed purge
  const list=await (await pubs({action:'list'})).json(),mine=list.publications?.find(p=>p.id===id);ok('7 the store lists it as expired, nothing inconsistent',mine?.state==='expired'&&list.counts?.inconsistent===0,list.counts);
  const dry=await (await pubs({action:'purge-expired'})).json();ok('8 dry run reports both files and deletes nothing',dry.dryRun===true&&[jp.url,jd.url].every(u=>dry.wouldRemove.includes(u))&&(await view(jp.url)).status()===410);
  const real=await pubs({action:'purge-expired',confirm:true}),rj=await real.json();ok('9 confirmed purge removes both',real.status()===200&&[jp.url,jd.url].every(u=>rj.removed.includes(u)),{status:real.status(),removed:rj.removed?.length});
  for(const u of rj.removed||[])created.delete(u);
  const again=await (await pubs({action:'list'})).json();ok('9b the register no longer lists them',!again.publications?.some(p=>p.id===id));
  // 10 unauthorised access changes nothing
  const st=[await api('api/publications',{headers:{'content-type':'application/json'},data:'{"action":"list"}'}),await api('api/publications',{headers:{'x-rubik-share-token':'x'.repeat(40),'content-type':'application/json'},data:'{"action":"list"}'}),await api('api/publications',{headers:{'x-rubik-share-token':CODE,'content-type':'application/json',origin:'https://evil.example'},data:'{"action":"list"}'})].map(r=>r.status());
  ok('10 no code / wrong code / other origin are refused',st[0]===401&&st[1]===401&&st[2]===403,st);
  // 12 real UI
  for(const vp of [{width:1440,height:900},{width:390,height:844}]){const p=await ctx.newPage();await p.setViewportSize(vp);await p.goto(base+'/');await p.locator('#welcomeExample').click();
   await p.locator('#workArea-deliver').click();await p.locator('#professionalWorkspace').getByRole('button',{name:'Publicar enlace para el cliente'}).click();const d=p.locator('#shareLinkDialog');await d.waitFor();
   const radios=await d.locator('#shareLinkTtl input').evaluateAll(xs=>xs.map(x=>[x.value,x.checked]));ok(`12 UI ${vp.width}: 7/30/90 with 30 checked`,JSON.stringify(radios)==='[["7",false],["30",true],["90",false]]');
   await d.locator('#shareLinkTtl').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(OUT,`12-ui-${vp.width}.png`)});await p.close();}
 }catch(e){ok('unexpected error',false,e.message);}
 finally{
  if(created.size){const r=await unshare([...created]);console.log(`cleanup: ${r.status()} (${created.size} file(s))`);}
  fs.writeFileSync(path.join(OUT,'result.json'),JSON.stringify(log,null,1));await browser.close();
  const failed=log.filter(x=>!x.ok).length;console.log(`${log.length-failed}/${log.length} PASS`);process.exit(failed?1:0);
 }
})();
