'use strict';
// Read a real protected preview; URL supplied privately, never persisted with query/token.
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const url=process.env.F3_PREVIEW_URL;
const expected=process.env.F3_PREVIEW_SHA;
if(!url||!expected)throw Error('F3_PREVIEW_URL and F3_PREVIEW_SHA required');
const out=path.resolve(process.env.F3_LIVE_OUT||'docs/qa/artifacts/f3-reconciliation-live');
fs.mkdirSync(out,{recursive:true});
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const ids=['ikea-glostad-2-seat-sofa-knisa-dark-grey-demo','ikea-strandmon-wing-chair-tommaboda-deep-beige-demo','ikea-skogsta-mesa-acacia-demo','ikea-knoxhult-armario-bajo-con-puertas-y-cajon-blanco-demo','ikea-stockholm-2025-aparador-chapa-roble-demo','ikea-nordli-comoda-de-5-cajones-blanco-demo'];
const clean=text=>String(text).replace(/https?:\/\/[^\s"']+/g,u=>{try{const p=new URL(u);return p.origin+p.pathname;}catch{return '[URL]';}});
(async()=>{
  const browser=await chromium.launch({executablePath:process.env.CHROME,headless:true,args:['--no-sandbox','--enable-unsafe-swiftshader']});
  const results=[];
  try{
    for(const viewport of [{width:1440,height:900},{width:390,height:844},{width:844,height:390}]){
      const context=await browser.newContext({viewport,isMobile:viewport.width<1000,hasTouch:viewport.width<1000});
      const page=await context.newPage(),errors=[],consoleMessages=[],failures=[],responses=[];
      page.on('pageerror',e=>errors.push(clean(e.message)));
      page.on('console',m=>consoleMessages.push({type:m.type(),text:clean(m.text())}));
      page.on('requestfailed',r=>failures.push({path:new URL(r.url()).pathname,reason:r.failure()?.errorText}));
      page.on('response',r=>{if(r.url().endsWith('.glb'))responses.push({path:new URL(r.url()).pathname,status:r.status()});});
      const response=await page.goto(url,{waitUntil:'networkidle',timeout:60000});
      assert.equal(response.status(),200);
      await page.waitForFunction(()=>window.View3D&&window.FloorPlanAssetUI?.ready,null,{timeout:40000});
      assert.equal(new URL(page.url()).hostname,new URL(url).hostname,'SSO page rather than application');
      const integrity=[];
      for(const name of ['index.html','js/asset-loader.mjs','js/asset-catalog.js','assets/f3/external.manifest.json']){
        const response=await context.request.get(new URL(name,page.url()).href);
        assert.equal(response.status(),200,name);const body=await response.body();
        const local=fs.readFileSync(name);assert.equal(hash(body),hash(local),name+' deployed bytes');
        integrity.push({path:name,bytes:body.length,sha256:hash(body),matchesLocal:true});
      }
      const base=JSON.parse(fs.readFileSync('docs/contracts/examples/floorplan-project-v1.example.json'));
      const entries=await page.evaluate(ids=>ids.map(id=>FloorPlanAssetUI.entries.find(e=>e.id===id)),ids);
      assert.ok(entries.every(Boolean));
      base.objects=entries.map((e,i)=>({...structuredClone(base.objects[0]),id:'obj_live_'+i,name:e.name,type:e.type,size:{widthMm:e.dimensionsMm.width,depthMm:e.dimensionsMm.depth,heightMm:e.dimensionsMm.height},position:{x:900+(i%3)*1800,y:900+Math.floor(i/3)*1700},rotationDeg:0,elevationMm:0,assetRef:{catalog:e.catalog,assetId:e.id,catalogRevision:e.revision}}));
      delete base.sourceImages;delete base.scale.calibration;base.scale={confidence:'estimated',method:'template'};
      await page.evaluate(p=>FloorPlanApp.importProject(p),base);
      await page.click('[data-view="3d"]');
      await page.waitForFunction(ids=>ids.every(id=>['ready','error'].includes(View3D.assetStatus(id)?.state)),base.objects.map(x=>x.id),{timeout:60000});
      const states=await page.evaluate(ids=>ids.map(id=>View3D.assetStatus(id)),base.objects.map(x=>x.id));
      assert.ok(states.every(s=>s.state==='ready'),JSON.stringify(states));
      assert.ok(states.every(s=>s.textureStats.images>0));
      assert.equal(responses.filter(r=>r.status===200).length,6);
      for(const e of entries){const fetched=await context.request.get(new URL(e.url,page.url()).href);assert.equal(fetched.status(),200);const b=await fetched.body();assert.equal(hash(b),e.sha256);integrity.push({path:e.url,bytes:b.length,sha256:hash(b),matchesLocal:true});}
      await page.screenshot({path:path.join(out,`live-${viewport.width}x${viewport.height}.png`)});
      await page.reload({waitUntil:'networkidle'});await page.waitForFunction(()=>FloorPlanAssetUI?.ready);
      assert.deepEqual(await page.evaluate(()=>FloorPlanApp.project.objects.map(o=>o.assetRef.assetId)),ids);
      assert.deepEqual(errors,[]);assert.deepEqual(failures,[]);
      results.push({viewport,status:'PASS',htmlStatus:response.status(),models:ids,states,integrity,responses,errors,consoleMessages,requestFailures:failures,reloadPersistence:'PASS'});
      await context.close();
    }
    const report={status:'PASS',sourceCommit:expected,previewOrigin:new URL(url).origin,results,renderer:'Chromium/SwiftShader; not a physical phone',productionMutation:false};
    fs.writeFileSync(path.join(out,'verification.json'),JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify({status:'PASS',sourceCommit:expected,previewOrigin:report.previewOrigin,viewports:results.map(r=>r.viewport)}));
  }finally{await browser.close();}
})().catch(error=>{fs.writeFileSync(path.join(out,'failure.json'),JSON.stringify({status:'FAIL',sourceCommit:expected,error:clean(error.stack||error)},null,2)+'\n');console.error(clean(error.stack||error));process.exitCode=1;});
