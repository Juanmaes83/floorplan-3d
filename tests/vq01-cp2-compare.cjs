// Technical gates only; visual improvement belongs to Juanma.
const fs=require('node:fs/promises'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('./fixtures/vq01-material-ab-v2.json'),views=require('./fixtures/vq01-cp2-views.json');
const dirs=process.argv.slice(2);if(dirs.length!==4)throw Error('Usage: A0_DIR B1_DIR B2_DIR OUTPUT_DIR');
const digest=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=async(d,n)=>JSON.parse(await fs.readFile(path.join(d,n),'utf8'));
async function delta(browser,a,b){const page=await browser.newPage();try{return await page.evaluate(async inputs=>{
 const arrays=[];let width,height;for(const data of inputs){const image=await createImageBitmap(new Blob([Uint8Array.from(atob(data),c=>c.charCodeAt(0))],{type:'image/png'}));
  if(width&&(width!==image.width||height!==image.height))throw Error('dimensions');width=image.width;height=image.height;
  const c=document.createElement('canvas');c.width=width;c.height=height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);arrays.push(ctx.getImageData(0,0,width,height).data);image.close();}
 let count=0,max=0,x0=width,y0=height,x1=-1,y1=-1;
 for(let i=0;i<arrays[0].length;i+=4){let changed=false;for(let c=0;c<4;c++){const d=Math.abs(arrays[0][i+c]-arrays[1][i+c]);max=Math.max(max,d);changed||=d>0;}if(changed){count++;const x=i/4%width,y=Math.floor(i/4/width);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}}
 return{changedPixels:count,maxChannelDelta:max,boundingBox:count?[x0,y0,x1+1,y1+1]:null,totalPixels:width*height};
 },[a.toString('base64'),b.toString('base64')]);}finally{await page.close();}}
(async()=>{
 const labels=['A0','B1','B2'],sides=[];await fs.mkdir(dirs[3],{recursive:true});
 for(let i=0;i<3;i++){
  const label=labels[i],prefix=label.toLowerCase(),result=await read(dirs[i],'ab-side-result.json'),runs=await Promise.all([1,2].map(n=>read(dirs[i],`${prefix}${n}-manifest.json`)));
  assert.equal(result.result,'PASS');assert.equal(result.side,label);if(views.sources[label])assert.equal(result.sourceSha,views.sources[label]);
  for(const m of runs){assert.equal(m.sourceSha,result.sourceSha);assert.equal(m.runtime.projectSha256,fixture.projectSha256);assert.deepEqual(m.errors,[]);
   for(const w of m.warnings)assert.match(w,/GPU stall due to ReadPixels/,'unexpected warning');
   const png=await fs.readFile(path.join(dirs[i],`${m.label}-1440x900.png`));assert.equal(digest(png),m.screenshotSha256);
   for(const close of m.closeups)assert.equal(digest(await fs.readFile(path.join(dirs[i],close.file))),close.sha256);
  }
  assert.deepEqual(runs[0].rendererMemory,runs[1].rendererMemory);
  sides.push({label,result,runs});await fs.cp(dirs[i],path.join(dirs[3],prefix),{recursive:true});
 }
 const base=sides[0].runs[0],invariants=m=>{const r=structuredClone(m.runtime);delete r.surfaces;return r;};
 for(const s of sides)for(const m of s.runs){
  assert.deepEqual(invariants(m),invariants(base),'Project/camera/light/global drift');
  for(const key of ['fixtureSha','viewsSha','captureProtocolSha','geometrySha256'])assert.equal(m[key],base[key],key);
  assert.deepEqual(m.closeups.map(c=>({id:c.id,pose:c.pose})),base.closeups.map(c=>({id:c.id,pose:c.pose})));
  assert.deepEqual(m.runtime.surfaces.map(s=>({id:s.id,map:s.map})),base.runtime.surfaces.map(s=>({id:s.id,map:s.map})));
  assert.equal(m.rendererMemory.geometries,base.rendererMemory.geometries);
  assert.ok(m.rendererMemory.textures<=base.rendererMemory.textures+views.resources.maxExtraTextures);
 }
 const lifecycle=await read(dirs[2],'lifecycle.json');assert.equal(lifecycle.result,'PASS');assert.deepEqual(lifecycle.errors,[]);assert.deepEqual(lifecycle.warnings,[]);
 const launch={args:['--no-sandbox','--enable-unsafe-swiftshader']};if(process.env.CHROME)launch.executablePath=process.env.CHROME;
 const browser=await chromium.launch(launch),comparisons={};try{
  for(const i of [0,1]){const left=sides[i].runs[0],right=sides[2].runs[0],names=[['GLOBAL',`${left.label}-1440x900.png`,`${right.label}-1440x900.png`],...left.closeups.map((c,j)=>[c.id,c.file,right.closeups[j].file])];
   comparisons[labels[i]+'_vs_B2']={};for(const [id,a,b]of names)comparisons[labels[i]+'_vs_B2'][id]=await delta(browser,await fs.readFile(path.join(dirs[i],a)),await fs.readFile(path.join(dirs[2],b)));
  }
 }finally{await browser.close();}
 const result={status:'READY_FOR_HUMAN_AB_CP2',visualVerdict:'PENDING_JUANMA',fixtureSha:base.fixtureSha,viewsSha:base.viewsSha,captureProtocolSha:base.captureProtocolSha,projectSha256:fixture.projectSha256,sides,comparisons,lifecycle,
 humanScore:{A0:100,B1:null,B2:null,dimensions:['identity/differentiation','physical scale','microrelief/depth','roughness/specular','timber','stone','plaster/concrete','glass/metal','absence of artifacts','architectural credibility'],verdict:'PENDING_JUANMA'}};
 await fs.writeFile(path.join(dirs[3],'comparison.json'),JSON.stringify(result,null,2)+'\n');
 const options=['GLOBAL',...views.closeups.map(v=>v.id)],images={};for(const s of sides){const m=s.runs[0];images[s.label]={GLOBAL:`${s.label.toLowerCase()}/${m.label}-1440x900.png`,...Object.fromEntries(m.closeups.map(c=>[c.id,`${s.label.toLowerCase()}/${c.file}`]))};}
 await fs.writeFile(path.join(dirs[3],'index.html'),`<!doctype html><meta charset="utf-8"><title>VQ-01 CP2 human review</title><style>body{font:16px system-ui;margin:16px;background:#eee}button,select{font:inherit;padding:8px}img{max-width:100%;display:block}pre{white-space:pre-wrap}</style><h1>VQ-01 CP2 — PENDING_JUANMA</h1><p>A0=100. B1 y B2 sin puntuación asignada. El pixel diff es diagnóstico, no mejora perceptiva.</p><select id="view">${options.map(v=>`<option>${v}</option>`).join('')}</select> <button onclick="show('A0')">A0 original</button> <button onclick="show('B1')">B1 CP1</button> <button onclick="show('B2')">B2 CP2</button><h2 id="title"></h2><img id="image"><p>¿B2 representa un salto material claramente visible respecto a A0 y una mejora significativa respecto a B1, suficiente para continuar construyendo VQ-01?</p><a href="comparison.json">Manifests, hashes, métricas y diagnósticos</a><script>const images=${JSON.stringify(images)};let side='A0';function show(s){side=s;document.getElementById('title').textContent=s+' / '+view.value;document.getElementById('image').src=images[s][view.value]}view.onchange=()=>show(side);show(side);</script>`);
 const hashes=[];async function walk(dir){for(const e of await fs.readdir(dir,{withFileTypes:true})){const p=path.join(dir,e.name);if(e.isDirectory())await walk(p);else hashes.push({file:path.relative(dirs[3],p).replaceAll('\\','/'),sha256:digest(await fs.readFile(p))});}}await walk(dirs[3]);
 await fs.writeFile(path.join(dirs[3],'artifact-files-sha256.json'),JSON.stringify(hashes,null,2)+'\n');console.log(JSON.stringify({status:result.status,sources:sides.map(s=>s.result.sourceSha),comparisons}));
})().catch(e=>{console.error(e);process.exitCode=1;});
