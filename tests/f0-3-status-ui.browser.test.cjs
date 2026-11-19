'use strict';
/* F0.3 · Interfaz única de estados de persistencia (js/persistence-status-ui.js), AISLADA. Chromium real con el CSS
   Perla del producto (css/design-system.css). Comprueba las tres reglas de oro UX-FIRST en todos los estados, el
   contraste AA, el consentimiento, el teclado, el móvil y los adaptadores con las fuentes REALES (A0, arranque y
   migración v2 sobre datos sintéticos, sesión F0.2b). */
const {test,before,after}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs/promises'),path=require('node:path'),{createServer}=require('node:http'),{chromium}=require('playwright');
const root=path.resolve(__dirname,'..');let server,browser,url;
const PAGE=`<!doctype html><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>estados F0.3</title>
<link rel="stylesheet" href="/css/design-system.css">
<script src="/js/schema-epoch.js"></script><script src="/js/local-images.js"></script><script src="/js/store-v2.js"></script>
<script src="/js/store-v2-backup.js"></script><script src="/js/store-v2-migrate.js"></script><script src="/js/persistence-status-ui.js"></script>
<body><div id="slot"></div></body>`;
before(async()=>{
  server=createServer(async(req,res)=>{try{const p=new URL(req.url,'http://l').pathname;if(p==='/t.html'){res.setHeader('content-type','text/html');return res.end(PAGE);}
    const f=path.resolve(root,'.'+p);if(!f.startsWith(root+path.sep))throw 0;res.setHeader('content-type',f.endsWith('.css')?'text/css':'text/javascript');res.end(await fs.readFile(f));}catch{res.statusCode=404;res.end();}});
  await new Promise(r=>server.listen(0,'127.0.0.1',r));url=`http://127.0.0.1:${server.address().port}/t.html`;
  browser=await chromium.launch({executablePath:process.env.CHROME||'/usr/bin/chromium',args:['--no-sandbox']});
});
after(async()=>{await browser?.close();await new Promise(r=>server.close(r));});
async function page(opts={}){const ctx=await browser.newContext(opts),p=await ctx.newPage(),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.goto(url);return {ctx,p,errors};}

test('aislamiento: ninguna página del producto carga todavía la interfaz F0.3',async()=>{
  for(const f of (await fs.readdir(root)).filter(f=>f.endsWith('.html')))assert.doesNotMatch(await fs.readFile(path.join(root,f),'utf8'),/persistence-status-ui/,f);
});

test('reglas de oro en TODOS los estados: qué/por qué, estado de los datos, una sola acción dominante, alternativa segura en los de riesgo, icono + texto, avisos persistentes',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(()=>{const U=FloorPlanPersistenceUI,out={};
      for(const kind of Object.keys(U.STATES)){const box=U.render(document.getElementById('slot'),{kind,vars:{reason:'motivo',why:'causa',revision:3,available:'10 MB',needed:'40 MB',step:2,steps:4,docs:4,resources:7,photos:5,hash:'0123456789ab…',absent:''}});
        const q=s=>box.querySelector(s);out[kind]={tone:box.dataset.tone,role:box.getAttribute('role'),persistent:box.dataset.persistent,title:q('h2')?.textContent.trim(),
          iconHidden:q('.psui-icon')?.getAttribute('aria-hidden'),what:q('.psui-what')?.textContent,data:q('.psui-data')?.textContent,
          primaries:box.querySelectorAll('.btn.primary').length,secondary:!!q('[data-slot=secondary]'),labelled:!!document.getElementById(box.getAttribute('aria-labelledby')),placeholders:/\{\w+\}/.test(box.textContent)};}
      return out;});
    for(const [kind,s] of Object.entries(r)){
      assert.ok(s.title&&s.what&&s.data.startsWith('Estado de tus datos: '),kind+': qué ocurrió y estado de los datos');
      assert.equal(s.iconHidden,'true',kind+': icono decorativo, el texto lleva el significado');assert.ok(s.primaries<=1,kind+': como mucho una acción dominante');
      assert.equal(s.labelled,true,kind);assert.equal(s.placeholders,false,kind+': sin huecos sin rellenar');
      if(s.tone==='warn'||s.tone==='danger'){assert.equal(s.role,'alert',kind);assert.equal(s.persistent,'true',kind+': un riesgo nunca es efímero');
        assert.equal(s.primaries,1,kind+': ningún bloqueo sin solución');assert.equal(s.secondary,true,kind+': alternativa segura');}
      else assert.equal(s.role,'status',kind);}
    assert.equal(Object.keys(r).length,19);assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('contraste AA (≥ 4,5:1) del texto sobre el fondo de cada tono Perla',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(()=>{const U=FloorPlanPersistenceUI,lum=c=>{const [R,G,B]=c.match(/\d+(\.\d+)?/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4;});return 0.2126*R+0.7152*G+0.0722*B;};
      const ratio=(a,b)=>{const [x,y]=[lum(a),lum(b)].sort((m,n)=>n-m);return (x+0.05)/(y+0.05);},out={};
      for(const kind of ['saved','error','outdated','pending']){const box=U.render(document.getElementById('slot'),{kind,vars:{reason:'x',revision:1}});const cs=getComputedStyle(box);
        out[kind]=Math.min(...[...box.querySelectorAll('p,h2')].map(n=>ratio(getComputedStyle(n).color,cs.backgroundColor)));
        const btn=box.querySelector('.btn.primary');if(btn){const b=getComputedStyle(btn);out[kind+'-boton']=ratio(b.color,b.backgroundColor);}}
      return out;});
    for(const [k,v] of Object.entries(r))assert.ok(v>=4.5,k+': '+v.toFixed(2));assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('copia de emergencia: la acción dominante exige el consentimiento; teclado y foco visibles',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    await p.evaluate(()=>{window.calls=[];FloorPlanPersistenceUI.render(document.getElementById('slot'),{kind:'emergency-export'},{onAction:(a,x)=>calls.push([a,x.consent])});});
    const primary=p.locator('.psui .btn.primary');assert.equal(await primary.isDisabled(),true);
    await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.className),'psui-consent','el consentimiento es lo primero que se enfoca');
    await p.keyboard.press('Space');assert.equal(await primary.isDisabled(),false);
    await p.keyboard.press('Tab');assert.equal(await p.evaluate(()=>document.activeElement.dataset.action),'download-copy');
    const outline=await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle);assert.notEqual(outline,'none','foco visible');
    await p.keyboard.press('Enter');assert.deepEqual(await p.evaluate(()=>calls),[['download-copy',true]]);assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('móvil 390×844: sin desplazamiento horizontal y botones de al menos 44 px de alto',{timeout:60000},async()=>{
  const {ctx,p,errors}=await page({viewport:{width:390,height:844}});
  try{
    const r=await p.evaluate(()=>{const out=[];for(const kind of Object.keys(FloorPlanPersistenceUI.STATES)){const box=FloorPlanPersistenceUI.render(document.getElementById('slot'),{kind,vars:{reason:'un motivo bastante largo para comprobar el ajuste en pantallas estrechas',why:'x',available:'1 MB',needed:'2 MB',step:1,steps:4,revision:1,docs:4,resources:7,photos:5,hash:'0123456789ab…',absent:' Aviso: 1 imágenes citadas ya faltaban en este navegador; la copia no puede recuperarlas.'}});
      out.push({kind,overflow:document.documentElement.scrollWidth>innerWidth+1,minH:Math.min(...[...box.querySelectorAll('.btn')].map(b=>b.getBoundingClientRect().height),99)});}return out;});
    for(const x of r){assert.equal(x.overflow,false,x.kind);assert.ok(x.minH>=44,x.kind+': '+x.minH);}assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});

test('adaptadores con las fuentes reales: A0, arranque v2 ilegible, errores de migración y sesión F0.2b',{timeout:90000},async()=>{
  const {ctx,p,errors}=await page();
  try{
    const r=await p.evaluate(async()=>{const U=FloorPlanPersistenceUI,E=FloorPlanSchemaEpoch,M=FloorPlanStoreV2Migrate,out={};
      E.announce(2);out.a0=U.fromEpoch(E.read())?.kind;localStorage.removeItem(E.KEY);E._reset();
      localStorage.setItem(E.KEY,'{dañado');out.a0bad=U.fromEpoch(E.read())?.kind;localStorage.clear();E._reset();
      localStorage.setItem(M.SWITCHED,JSON.stringify({token:1}));
      const b=await M.boot({source:M.legacySource({persistence:'ui-p',images:'ui-i'}),name:'ui-v2',indexedDB:{databases:async()=>[{name:'ui-v2'}]},open:()=>Promise.reject(new Error('x'))});
      out.boot=U.fromBoot(b)?.kind;localStorage.clear();
      const src=M.legacySource({persistence:'ui-p',images:'ui-i'});
      out.noCopy=U.fromMigrationError(await M.migrate({source:src,name:'ui-v2',tab:'A'}).catch(e=>e)).kind;
      const pre=await M.prepare(src,{consent:{confirmed:true,scope:'private-complete'}});
      const q=await M.migrate({source:src,name:'ui-v2',tab:'A',preExport:pre,estimate:async()=>({quota:1000,usage:900})}).catch(e=>e);
      out.quota=U.fromMigrationError(q);
      out.writer=U.fromMigrationError({code:'legacy-writer-active'});
      out.session=[{status:'pending',pending:1},{status:'saving'},{status:'saved',revision:4},{status:'error',error:{message:'disco lleno'}},{status:'conflict'},{status:'error',error:{code:'schema-outdated'}}].map(s=>U.fromSession(s).kind);
      const box=U.render(document.getElementById('slot'),out.quota);out.quotaText=box.textContent;
      return out;});
    assert.equal(r.a0,'outdated');assert.equal(r.a0bad,'indeterminate');assert.equal(r.boot,'v2-unreadable');
    assert.equal(r.noCopy,'pre-migration-copy');assert.equal(r.quota.kind,'quota');assert.match(r.quotaText,/hacen falta \d+ MB/);
    assert.equal(r.writer.kind,'migration-stopped');assert.match(r.writer.vars.why,/Cierra las demás pestañas/);
    assert.deepEqual(r.session,['pending','saving','saved','error','conflict','outdated']);assert.deepEqual(errors,[]);
  }finally{await ctx.close();}
});
