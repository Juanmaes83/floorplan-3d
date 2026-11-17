// QA de la experiencia web de cliente (out/<v>/entrega): cada archivo de tipo de entrega en escritorio, tableta y móvil.
// Mide: desbordamiento horizontal de la página, elementos que se salen del ancho, imágenes rotas, vídeos sin metadatos,
// enlaces locales rotos, peticiones externas, errores, tamaño mínimo de texto y solapes de texto. Capturas de página completa.
// Uso: node entrega-qa.cjs <dirEntrega> <dirCapturas>
const path=require('path'),fs=require('fs');const {chromium}=require('playwright');
const [dir,shots]=process.argv.slice(2);fs.mkdirSync(shots,{recursive:true});
const VP=[{n:'escritorio',w:1440,h:900},{n:'tableta',w:820,h:1180,m:true},{n:'movil',w:390,h:844,m:true}];
(async()=>{const b=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--autoplay-policy=no-user-gesture-required']});const out={generated:new Date().toISOString(),runs:[]};
 const files=fs.readdirSync(dir).filter(f=>f.endsWith('.html')).sort((a,b)=>a==='index.html'?-1:b==='index.html'?1:a.localeCompare(b));
 for(const f of files)for(const vp of VP){const ctx=await b.newContext({viewport:{width:vp.w,height:vp.h},isMobile:!!vp.m,hasTouch:!!vp.m,deviceScaleFactor:1});
  const ext=[],errors=[];ctx.on('request',r=>{if(!/^(file|data|blob|about):/.test(r.url()))ext.push(r.url());});const p=await ctx.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await p.goto('file://'+path.resolve(dir,f));await p.evaluate(()=>document.fonts.ready);
  await p.evaluate(async()=>{for(const i of document.images){i.loading='eager';}await Promise.all([...document.images].map(i=>i.complete?0:new Promise(r=>{i.onload=i.onerror=r;})));});
  await p.evaluate(()=>Promise.all([...document.querySelectorAll('video')].map(v=>v.readyState>=1?0:new Promise(r=>{v.onloadedmetadata=v.onerror=r;v.load();setTimeout(r,8000);}))));
  const m=await p.evaluate(()=>{const W=document.documentElement.clientWidth,over=[];
   for(const el of document.querySelectorAll('body *')){const r=el.getBoundingClientRect();if(!r.width)continue;if(el.closest('.scroll,.toc,.pan'))continue;if(el.closest('svg')&&el.tagName!=='svg')continue;if(r.right>W+1||r.left<-1)over.push({tag:el.tagName,cls:String(el.className).slice(0,20),text:(el.textContent||'').trim().slice(0,30),right:Math.round(r.right)});}
   const imgs=[...document.images].filter(i=>!i.naturalWidth).map(i=>i.getAttribute('src').slice(0,60));
   const vids=[...document.querySelectorAll('video')].map(v=>({src:v.querySelector('source')?.getAttribute('src'),ready:v.readyState,dur:Math.round(v.duration||0),w:v.videoWidth}));
   const small=[];const tw=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);let n;while((n=tw.nextNode())){if(!n.textContent.trim()||n.parentElement.closest('svg'))continue;const fs=parseFloat(getComputedStyle(n.parentElement).fontSize);if(fs<12)small.push({t:n.textContent.trim().slice(0,24),fs});}
   const svgSmall=[];for(const t of document.querySelectorAll('main svg text')){if(t.closest('.pan')&&t.closest('.pan').scrollWidth>t.closest('.pan').clientWidth+1&&t.getBoundingClientRect().height>=7)continue;const r=t.getBoundingClientRect();if(r.height&&r.height<9)svgSmall.push({t:t.textContent.slice(0,20),h:+r.height.toFixed(1)});}
   const boxes=[];const tw2=document.createTreeWalker(document.body,NodeFilter.SHOW_TEXT);while((n=tw2.nextNode())){if(!n.textContent.trim()||n.parentElement.closest('svg,.toc'))continue;const st=getComputedStyle(n.parentElement);if(st.visibility==='hidden'||st.display==='none')continue;const rg=document.createRange();rg.selectNodeContents(n);for(const r of rg.getClientRects())if(r.width>1&&r.height>1)boxes.push({n,r});}
   let overlaps=[];for(let i=0;i<boxes.length;i++)for(let j=i+1;j<boxes.length&&j<i+60;j++){if(boxes[i].n===boxes[j].n)continue;const a=boxes[i].r,c=boxes[j].r;if(Math.min(a.right,c.right)-Math.max(a.left,c.left)>1&&Math.min(a.bottom,c.bottom)-Math.max(a.top,c.top)>2)overlaps.push([boxes[i].n.textContent.trim().slice(0,20),boxes[j].n.textContent.trim().slice(0,20)]);}
   const links=[...document.querySelectorAll('a[href]')].map(a=>a.getAttribute('href')).filter(h=>!/^(#|mailto:|https?:)/.test(h));
   return {scrollW:document.documentElement.scrollWidth,W,pageOverflow:document.documentElement.scrollWidth>W+1,over:over.slice(0,6),overCount:over.length,brokenImgs:imgs,vids,small:small.slice(0,6),smallCount:small.length,svgSmall:svgSmall.slice(0,6),svgSmallCount:svgSmall.length,overlaps:overlaps.slice(0,6),overlapCount:overlaps.length,links,sections:[...document.querySelectorAll('section')].map(s=>s.id),H:document.documentElement.scrollHeight};});
  m.brokenLinks=m.links.filter(h=>!fs.existsSync(path.resolve(dir,h.split('#')[0])));delete m.links;
  if(f==='index.html'||vp.n==='movil'){await p.screenshot({path:path.join(shots,`${f.replace('.html','')}-${vp.n}.jpg`),fullPage:true,type:'jpeg',quality:78});}
  out.runs.push({file:f,viewport:vp.n,...m,external:ext,errors});console.log(f,vp.n,'overflow',m.pageOverflow,m.overCount,'img',m.brokenImgs.length,'vid',JSON.stringify(m.vids.map(v=>v.ready+'/'+v.dur)),'small',m.smallCount,'svgSmall',m.svgSmallCount,'overlap',m.overlapCount,'links',m.brokenLinks.length,'ext',ext.length,'err',errors.length);await ctx.close();}
 fs.writeFileSync(path.join(shots,'entrega-qa.json'),JSON.stringify(out,null,1));await b.close();})().catch(e=>{console.error(e);process.exit(1);});
