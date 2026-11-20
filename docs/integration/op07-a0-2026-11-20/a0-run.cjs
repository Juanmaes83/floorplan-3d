const fs=require('node:fs'), path=require('node:path'), os=require('node:os'), Module=require('node:module');
const {AsyncLocalStorage}=require('node:async_hooks'), {createServer}=require('node:http');
const pw=require('playwright'), root=process.env.A0_ROOT, out=process.env.A0_TRACE_OUT;
const engine=process.argv[2], traced=process.env.A0_TRACED!=='0', orientation=process.env.A0_SIZE||'desktop', als=new AsyncLocalStorage();
const testFiles=process.argv.slice(3).map(x=>path.join(root,'tests',x));
const test=require('node:test'), original=Module._extensions['.cjs']||Module._extensions['.js'];
let seq=0;
const mark=(page,label)=>page.evaluate(l=>window.__roTrace?.mark(l),label).catch(()=>{});
const markSource=key=>`await page.evaluate(l=>window.__roTrace?.mark(l),${JSON.stringify(key)});`;
Module._extensions['.cjs']=(mod,file)=>{
 if(testFiles.includes(file)){
  let source=fs.readFileSync(file,'utf8');
  source=source.replace("const test=require('node:test'),","const test=globalThis.__a0Test,");
  if(traced){
   source=source.replace(/await (run\(page,context,e\)|page\.setViewportSize\(\{width:viewport\.width-41,height:viewport\.height-27\}\)|rename\(page,'RO antes'\)|rename\(page,'RO base'\)|rename\(page,'RO igual'\)|rename\(page,'A0 antes'\))/g,(text,call)=>markSource(call)+text);
   source=source.replace(/await other\.evaluate\(\(\)=>FloorPlanSchemaEpoch\.announce\(2\)\);/g,text=>markSource('announce epoch 2')+text);
  }
  return mod._compile(source,file);
 }
 if(file===path.join(root,'tests','r02a','editor-kit.cjs')){
  const source=fs.readFileSync(file,'utf8');
  const before=source.indexOf('  const browser=await chromium.launch('),end=source.indexOf('\n  return {base:',before);
  if(before<0||end<0)throw Error('Unexpected kit');
  return mod._compile(source.slice(0,before)+'  const browser=globalThis.__a0Browser;'+source.slice(end),file);
 }
 return original(mod,file);
};
globalThis.__a0Test=Object.assign((name,opts,fn)=>(new RegExp(process.env.A0_PATTERN||'fixture|ResizeObserver|R1-T02|R1-T04')).test(name)?test(name,opts,t=>als.run(t,()=>fn(t))):undefined,test);
const args=engine==='chromium'?['--no-sandbox','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[];
globalThis.__a0Browser={async newContext(opts={}){
 const t=als.getStore(), profile=fs.mkdtempSync(path.join(os.tmpdir(),'rubik-a0-'+engine+'-'));
 if(orientation==='mobile')opts={...opts,viewport:{width:390,height:844}};
 const ctx=await pw[engine].launchPersistentContext(profile,{...opts,args,acceptDownloads:true});
 const diagnostics=[];
 const addPage=ctx.newPage.bind(ctx),close=ctx.close.bind(ctx);
 if(traced)await ctx.addInitScript({path:path.join(out,'ro-trace.init.js')});
 ctx.newPage=async()=>{
  const page=await addPage();page.on('pageerror',e=>diagnostics.push({message:e.message,url:page.url()}));
  page.on('console',m=>{if(m.type()==='error'&&/ResizeObserver/.test(m.text()))diagnostics.push({message:m.text(),url:page.url()});});
  if(traced){const goto=page.goto.bind(page);page.goto=async(...args)=>{const r=await goto(...args);await mark(page,'navigated');return r;};}
  return page;
 };
 let closed=false;
 ctx.close=async()=>{
  if(closed)return;closed=true;
  try{
   const views=[];
   for(const page of ctx.pages())if(/^http:\/\/(127\.0\.0\.1|f0-2b\.localhost):/.test(page.url())){
    await mark(page,'context.close');
    const trace=traced?await page.evaluate(()=>window.__roTrace?.dump()).catch(()=>null):null;
    views.push({url:page.url(),trace});
   }
   const result={test:t?.name,engine,browserVersion:await ctx.browser()?.version(),traced,diagnostics,views};
   fs.writeFileSync(path.join(out,engine+'-'+(traced?'trace':'plain')+'-'+orientation+'-'+String(++seq).padStart(2,'0')+'.json'),JSON.stringify(result,null,2)+'\n');
  }finally{await close();}
 };
 t?.after(()=>ctx.close());
 return ctx;
},close:async()=>{}};
for(const file of testFiles)require(file);
