// Interacción de «Preparar entrega» (profesional): cambiar de tipo, quitar un capítulo, comprobar que la vista del cliente
// lo refleja, registrar la entrega (descarga JSON) y capturas. Uso: node preparar-qa.cjs <outV> <dirCapturas>
const path=require('path'),fs=require('fs');const {chromium}=require('playwright');const [outV,shots]=process.argv.slice(2);fs.mkdirSync(shots,{recursive:true});
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox']});const res={steps:[]};const step=(k,v)=>{res.steps.push({k,v});console.log(k,JSON.stringify(v));};
 for(const vp of [{n:'escritorio',w:1440,h:900},{n:'movil',w:390,h:844,m:true}]){const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},acceptDownloads:true,isMobile:!!vp.m,hasTouch:!!vp.m});const ext=[],errors=[];
  ctx.on('request',r=>{if(!/^(file|data|blob|about):/.test(r.url()))ext.push(r.url());});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));
  await p.goto('file://'+path.resolve(outV,'profesional/preparar-entrega.html'));await p.waitForTimeout(1500);
  const fr=()=>p.frame({url:/entrega\/index\.html/});
  const visible=async()=>fr().evaluate(()=>[...document.querySelectorAll('section.ch')].filter(s=>!s.hidden).map(s=>s.id));
  step(vp.n+' integral',await visible());
  await p.locator('input[name=tipo][value=obra]').check();await p.waitForTimeout(500);
  step(vp.n+' obra',{visible:await visible(),kind:await fr().evaluate(()=>document.querySelector('.hero .kind').textContent),docs:await fr().evaluate(()=>[...document.querySelectorAll('.doc')].filter(a=>!a.hidden).map(a=>a.dataset.doc)),note:await p.locator('#custom').textContent()});
  await p.locator('[data-ch=decisiones]').uncheck();await p.waitForTimeout(300);step(vp.n+' sin decisiones',{visible:await visible(),note:await p.locator('#custom').textContent()});
  if(vp.n==='escritorio'){await p.locator('[data-w="390px"]').click();await p.waitForTimeout(400);await p.screenshot({path:path.join(shots,'preparar-escritorio-vista-movil.png')});await p.locator('[data-w="100%"]').click();}
  const [d]=await Promise.all([p.waitForEvent('download'),p.locator('#reg').click()]);const reg=JSON.parse(fs.readFileSync(await d.path(),'utf8'));
  fs.writeFileSync(path.join(shots,`registro-${vp.n}.json`),JSON.stringify(reg,null,1));step(vp.n+' registro',{file:d.suggestedFilename(),tipo:reg.tipo,capitulos:reg.capitulos,documentos:reg.documentos,avisos:reg.avisos.length,piezas:reg.piezas.length,log:await p.locator('#log li').count()});
  await p.locator('input[name=tipo][value=integral]').check();await p.waitForTimeout(500);await p.screenshot({path:path.join(shots,`preparar-${vp.n}.png`),fullPage:vp.n==='movil'});
  step(vp.n+' red/errores',{ext:ext.length,errors});await ctx.close();}
 fs.writeFileSync(path.join(shots,'preparar-qa.json'),JSON.stringify(res,null,1));await b.close();})().catch(e=>{console.error(e);process.exit(1);});
