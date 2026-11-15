#!/usr/bin/env node
// HOM-03 · evidence for «Nuevos servicios IA» from the real app of this tree (no mock UI):
//  - one capture of the section per profile (neutral + 6) and size (1440×900, 390×844, 844×390);
//  - one capture of each real place a button opens (Render IA band, Assistant, My catalogues, Image studio, FOT-01);
//  - one video (1440×900) clicking every button in turn, checked with ffprobe and a full ffmpeg decode if available;
//  - manifest.json with sha256 of every file, the service matrix (state, button, place opened) and the /api requests
//    (must be 0: every /api call is blocked and recorded). Usage: node scripts/qa/record-home-ai-services.cjs <outDir>
'use strict';
const {createServer}=require('node:http'),fs=require('node:fs'),fsp=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {chromium}=require('playwright');
const R=require('../../js/capability-registry.js');
const root=path.resolve(__dirname,'../..'),out=path.resolve(process.argv[2]||'qa-results/home-ai-services');
const PROFILES=['','architecture','real-estate','developer','renovation','interior','construction'];
const SIZES=[{width:1440,height:900},{width:390,height:844},{width:844,height:390}];
const OPENS={'render-ai':{check:()=>document.activeElement?.id==='welcomeRenderAITitle'&&document.querySelector('#welcomeDialog').open,place:'Home → banda «Render IA» existente (sin abrir el diálogo de pago)'},
 assistant:{check:()=>!document.querySelector('#welcomeDialog').open&&!document.querySelector('#assistantPanel').hidden,place:'Editor → panel «Asistente» (#assistantPanel)'},
 catalogs:{check:()=>FloorPlanProfessionalUI.area==='studio'&&document.querySelector('#catalogDialog')?.open,place:'Mi estudio → «Mis catálogos» (#catalogDialog)'},
 'visual-studio':{check:()=>FloorPlanProfessionalUI.area==='deliver'&&document.querySelector('#visualStudioDialog')?.open,place:'Entregar → «Estudio de imágenes» (#visualStudioDialog, simulación)'},
 'photo-reform':{check:()=>FloorPlanProfessionalUI.area==='deliver'&&document.querySelector('#photoReformDialog')?.open,place:'Entregar → «Reformar desde fotografía» (#photoReformDialog, simulación)'}};
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
(async()=>{
 await fsp.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const f=path.resolve(root,'.'+(req.url==='/'?'/index.html':new URL(req.url,'http://l').pathname));if(!f.startsWith(root+path.sep))throw Error('path');
  res.setHeader('Content-Type',/\.m?js$/.test(f)?'text/javascript':f.endsWith('.css')?'text/css':f.endsWith('.json')?'application/json':f.endsWith('.webp')?'image/webp':f.endsWith('.svg')?'image/svg+xml':'text/html');res.end(await fsp.readFile(f));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME||undefined,args:['--no-sandbox']});
 const api=[],errors=[],files=[],matrix=[];
 async function page(ctx,audience){const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.route('https://cdn.jsdelivr.net/**',r=>r.abort());await p.route('**/api/**',r=>{api.push(r.request().url());return r.abort();});
  if(audience)await p.addInitScript(a=>localStorage.setItem('rubik-professional-audience-v1',a),audience);
  await p.goto(url,{waitUntil:'load'});await p.locator('#welcomeDialog[open]').waitFor();await p.locator('#welcomeAIServices .ai-service-go').first().waitFor();return p;}
 try{
  for(const vp of SIZES)for(const a of PROFILES){const narrow=vp.width<=1100,ctx=await browser.newContext({viewport:vp,isMobile:narrow,hasTouch:narrow});
   const p=await page(ctx,a);await p.evaluate(()=>document.getElementById('welcomeAIServices').scrollIntoView({block:'start'}));await p.waitForTimeout(150);
   const f=path.join(out,`home-ai-${vp.width}x${vp.height}-${a||'neutral'}.jpg`);await p.screenshot({path:f,type:'jpeg',quality:82});files.push(f);await ctx.close();}
  const vp={width:1440,height:900};
  const ctx=await browser.newContext({viewport:vp,recordVideo:{dir:out,size:vp}});
  for(const s of R.aiServices('general')){const row={id:s.id,state:s.state,name:s.name[0],button:null,opens:null,ok:false};
   const p=await page(ctx,'');const b=p.locator('#welcomeAI-'+s.id);
   if(await b.count()){row.button=(await b.textContent()).trim();await b.scrollIntoViewIfNeeded();await p.waitForTimeout(500);await b.click();
    await p.waitForFunction(OPENS[s.id].check,null,{timeout:15000});row.opens=OPENS[s.id].place;row.ok=true;await p.waitForTimeout(900);
    const f=path.join(out,`opens-${s.id}.jpg`);await p.screenshot({path:f,type:'jpeg',quality:82});files.push(f);}
   else{row.ok=s.state==='preparation';row.opens='— (sin botón: '+(s.state==='preparation'?'en preparación':'módulo ausente')+')';}
   matrix.push(row);await p.close();}
  await ctx.close();
 }finally{await browser.close();server.close();}
 const videos=fs.readdirSync(out).filter(f=>f.endsWith('.webm')).map(f=>path.join(out,f));
 const checks=[];for(const v of videos){try{const d=execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','csv=p=0',v]).toString().trim();execFileSync('ffmpeg',['-v','error','-i',v,'-f','null','-']);checks.push({file:path.basename(v),durationS:Number(d),decoded:true});}catch(e){checks.push({file:path.basename(v),decoded:false,error:String(e.message).slice(0,200)});}}
 const manifest={tree:execFileSync('git',['rev-parse','HEAD'],{cwd:root}).toString().trim(),dirty:execFileSync('git',['status','--porcelain'],{cwd:root}).toString().trim().length>0,createdAt:new Date().toISOString(),
  matrix,gatedNotShown:R.AI_SERVICES.filter(s=>s.gate).map(s=>s.id),apiRequests:api,pageErrors:errors,videos:checks,
  files:[...files,...videos].map(f=>({file:path.basename(f),sha256:sha(f)}))};
 fs.writeFileSync(path.join(out,'manifest.json'),JSON.stringify(manifest,null,1));
 const bad=matrix.filter(r=>!r.ok).length+api.length+errors.length+checks.filter(c=>c.decoded===false).length;
 console.log(JSON.stringify({matrix:matrix.map(r=>`${r.state}:${r.id}:${r.ok}`),api:api.length,errors:errors.length,videos:checks},null,0));
 if(bad)process.exit(1);
})().catch(e=>{console.error(e);process.exit(1);});
