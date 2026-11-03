// CP1-C technical comparison only. Juanma owns the visual PASS/FAIL/INCONCLUSIVE gate.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('./fixtures/vq01-material-ab-v2.json');
const [aDir,bDir,outFile]=process.argv.slice(2);
if(!aDir||!bDir||!outFile)throw Error('Usage: node tests/vq01-ab-compare.cjs A_DIR B_DIR OUTPUT_JSON');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
const read=(dir,name)=>fs.readFile(path.join(dir,name),'utf8').then(JSON.parse);
async function pixelDelta(browser,a,b){
 const page=await browser.newPage();
 try{return await page.evaluate(async values=>{
  const images=await Promise.all(values.map(async base64=>{const binary=atob(base64),bytes=Uint8Array.from(binary,c=>c.charCodeAt(0));return createImageBitmap(new Blob([bytes],{type:'image/png'}));}));
  const width=images[0].width,height=images[0].height;
  if(images[1].width!==width||images[1].height!==height)throw Error('PNG dimensions differ');
  const pixels=images.map(image=>{const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;
   const context=canvas.getContext('2d');context.drawImage(image,0,0);const data=context.getImageData(0,0,width,height).data;image.close();return data;});
  let changedPixels=0,maxChannelDelta=0,minX=width,minY=height,maxX=-1,maxY=-1;
  for(let i=0;i<pixels[0].length;i+=4){let changed=false;for(let c=0;c<3;c++){const delta=Math.abs(pixels[0][i+c]-pixels[1][i+c]);if(delta)changed=true;maxChannelDelta=Math.max(maxChannelDelta,delta);}
   if(changed){const p=i/4,x=p%width,y=Math.floor(p/width);changedPixels++;minX=Math.min(minX,x);minY=Math.min(minY,y);maxX=Math.max(maxX,x);maxY=Math.max(maxY,y);}}
  return{changedPixels,maxChannelDelta,boundingBox:changedPixels?[minX,minY,maxX+1,maxY+1]:null,totalPixels:width*height};
 },[a.toString('base64'),b.toString('base64')]);}
 finally{await page.close();}
}
(async()=>{
 const [a1,a2,b1,b2,aResult,bResult]=await Promise.all([
  read(aDir,'a1-manifest.json'),read(aDir,'a2-manifest.json'),read(bDir,'b1-manifest.json'),read(bDir,'b2-manifest.json'),
  read(aDir,'ab-side-result.json'),read(bDir,'ab-side-result.json')
 ]);
 const fixtureSha=digest(await fs.readFile(path.join(__dirname,'fixtures/vq01-material-ab-v2.json')));
 assert.equal(aResult.result,'PASS');assert.equal(bResult.result,'PASS');
 assert.equal(aResult.sourceSha,fixture.baselineSha);assert.equal(bResult.sourceSha,b1.sourceSha);
 assert.notEqual(aResult.sourceSha,bResult.sourceSha);
 assert.equal(aResult.fixtureSha,fixtureSha);assert.equal(bResult.fixtureSha,fixtureSha);
 assert.equal(aResult.projectSha256,fixture.projectSha256);assert.equal(bResult.projectSha256,fixture.projectSha256);
 assert.deepEqual(a1.runtime,a2.runtime);assert.deepEqual(b1.runtime,b2.runtime);
 assert.deepEqual(b1.runtime,a1.runtime,'A/B Project, camera, light, Presentation, UV/maps or lifecycle drift');
 assert.deepEqual(a1.rendererMemory,a2.rendererMemory);assert.deepEqual(b1.rendererMemory,b2.rendererMemory);
 assert.deepEqual(b1.rendererMemory,a1.rendererMemory,'A/B GPU memory drift');
 for(const m of [a1,a2,b1,b2])assert.deepEqual(m.errors,[],'page/console errors');
 const normalizedWarnings=m=>m.warnings.map(w=>w.replace(/WebGL-0x[0-9a-f]+/g,'WebGL-ADDRESS'));
 assert.deepEqual(normalizedWarnings(b1),normalizedWarnings(a1),'new B warnings in first context');
 assert.deepEqual(normalizedWarnings(b2),normalizedWarnings(a2),'new B warnings in second context');
 for(const m of [a1,a2,b1,b2])for(const warning of m.warnings)assert.match(warning,/GL Driver Message \(OpenGL, Performance, GL_CLOSE_PATH_NV, High\): GPU stall due to ReadPixels/,'unexpected WebGL/shader warning');
 assert.deepEqual(b1.surfaceDisposals,a1.surfaceDisposals,'A/B disposal history drift');
 for(const [old,newer] of a1.surfaceMaterialMetrics.map((m,i)=>[m,b1.surfaceMaterialMetrics[i]])){
  assert.equal(old.id,newer.id);assert.equal(old.bytes,newer.bytes);assert.equal(old.gpuBytes,newer.gpuBytes);assert.equal(old.detailState,newer.detailState);
  const entry=require('../assets/materials/catalog.json').entries.find(e=>e.id===newer.id);
  assert.equal(newer.material?.color,(entry.mapTint||'#ffffff').slice(1));
  assert.equal(newer.material?.roughness,entry.roughness);
  assert.equal(newer.material?.metalness,0);
  assert.deepEqual(newer.material?.normalScale,[entry.normalStrength??1,entry.normalStrength??1]);
 }
 const launch={args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const browser=await chromium.launch(launch);
 let visualDifference;try{visualDifference=await pixelDelta(browser,await fs.readFile(path.join(aDir,'a1-1440x900.png')),await fs.readFile(path.join(bDir,'b1-1440x900.png')));}finally{await browser.close();}
 assert.ok(visualDifference.changedPixels>0,'B pixels are identical to A');
 const result={status:'READY_FOR_HUMAN_AB',visualVerdict:'PENDING_JUANMA',fixtureVersion:fixture.version,fixtureSha256:fixtureSha,projectSha256:fixture.projectSha256,
  sourceA:aResult.sourceSha,sourceB:bResult.sourceSha,browserVersionA:aResult.browserVersion,browserVersionB:bResult.browserVersion,
  runtimeSha256A:digest(JSON.stringify(a1.runtime)),runtimeSha256B:digest(JSON.stringify(b1.runtime)),
  screenshotSha256A:aResult.screenshotSha256,screenshotSha256B:bResult.screenshotSha256,
  withinSidePixelDeltaA:aResult.pixelDelta,withinSidePixelDeltaB:bResult.pixelDelta,betweenSidePixelDelta:visualDifference,
  rendererMemoryA:a1.rendererMemory,rendererMemoryB:b1.rendererMemory,
  surfaceMaterialMetricsA:a1.surfaceMaterialMetrics,surfaceMaterialMetricsB:b1.surfaceMaterialMetrics,
  pageConsoleWebGLShaderErrors:[],warningsA:[a1.warnings,a2.warnings],warningsB:[b1.warnings,b2.warnings],surfaceDisposalsA:a1.surfaceDisposals,surfaceDisposalsB:b1.surfaceDisposals};
 await fs.mkdir(path.dirname(outFile),{recursive:true});await fs.writeFile(outFile,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({status:result.status,sourceA:result.sourceA,sourceB:result.sourceB,projectSha256:result.projectSha256,betweenSidePixelDelta:visualDifference}));
})().catch(error=>{console.error(error);process.exitCode=1;});
