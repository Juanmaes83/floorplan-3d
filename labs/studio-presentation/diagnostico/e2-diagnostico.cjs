// v1.3 · §1.4 y §7 (A24–A26, H03) · DIAGNÓSTICO DEL PRODUCTO en solo lectura. No modifica ningún archivo del producto:
// carga sus módulos (require) y sirve su árbol tal cual desde un worktree aparte. Datos SINTÉTICOS: fixtures del propio
// producto (labs/ux07-ent04/fixtures.js) y presupuestos con precios ficticios. Nada se publica.
// Uso: node diagnostico/e2-diagnostico.cjs <worktreeMaster> → evidence/e2/diagnostico.json
'use strict';
const fs=require('fs'),path=require('path'),http=require('http'),crypto=require('crypto'),{execFileSync}=require('child_process');
const M=path.resolve(process.argv[2]||'');if(!fs.existsSync(path.join(M,'comparar/comparar.js'))){console.error('Uso: node diagnostico/e2-diagnostico.cjs <worktree de master>');process.exit(1);}
const LAB=path.resolve(__dirname,'..');const head=execFileSync('git',['-C',M,'rev-parse','HEAD']).toString().trim();
const status0=execFileSync('git',['-C',M,'status','--porcelain']).toString();
const F=require(path.join(M,'labs/ux07-ent04/fixtures.js')),D=require(path.join(M,'js/before-after-dossier-core.js')),R=require(path.join(M,'js/revision-compare-core.js')),
 V=require(path.join(M,'js/variants-compare-adapter.js')),L=require(path.join(M,'js/project-library.js')),RB=require(path.join(M,'js/revision-budget-core.js'));
const eur=v=>new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
const out={schema:'rubik-lab-e2-diagnostico/1',master:head,fecha:new Date().toISOString(),datos:'sintéticos (fixtures del producto, precios ficticios)',casos:[]};
const caso=(id,hallazgo,reproducido,evidencia)=>out.casos.push({id,hallazgo,resultado:reproducido?'REPRODUCIDO':'NO REPRODUCIDO',evidencia});
const b=F.before(),a=F.after();const cmp=R.compare(b,a,{relation:'same-project',beforeLabel:'Original',afterLabel:'Reforma'});
const bBefore=F.budget('complete',b),bAfter=F.budget('complete',a),bStale=F.budget('complete',b);// «después» hecho sobre la revisión anterior
(async()=>{
 // ---- A25-1 · nota de revisión que afirma coincidencia antes de decir que no coincide; importes mostrados igualmente ----
 {const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bStale,now:'2026-11-17T00:00:00Z'});const h=D.html(v,{beforeSvg:'',afterSvg:''});
  const contra=h.includes('se ha comprobado que sus cantidades coinciden con las de «después»')&&/no coinciden en \d+ partida/.test(h);
  caso('A25-1','Presupuesto de «después» hecho sobre la revisión anterior: la nota afirma que «se ha comprobado que coinciden» y a continuación dice que no coinciden; el bloque muestra base, IVA y total como si fueran de «después».',
   contra&&h.includes(eur(v.budget.gross.amount)),{quantities:v.budget.quantities,revisionMatch:v.budget.revisionMatch,diferencias:v.budget.quantityDifferences.length,totalMostrado:h.includes(eur(v.budget.gross.amount))});}
 // ---- A25-2 · comparación «incoherent»: la sección comparativa retiene importes, pero el bloque individual los muestra ----
 {const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bStale,beforeBudget:bBefore,now:'2026-11-17T00:00:00Z'});const h=D.html(v,{beforeSvg:'',afterSvg:''});
  caso('A25-2','Con la comparación en estado «incoherent» (no se calcula diferencia), el HTML descargable sigue mostrando el total del presupuesto individual de «después», que corresponde a otra revisión.',
   v.budgetComparison.status==='incoherent'&&h.includes(eur(v.budget.gross.amount)),{estado:v.budgetComparison.status,totalIndividualMostrado:h.includes(eur(v.budget.gross.amount))});}
 // ---- A25-3 · asimetría: solo «antes» tiene presupuesto ----
 {let err=null;try{D.view(cmp,{beforeProject:b,afterProject:a,budget:null,beforeBudget:bBefore});}catch(e){err=e.code||e.message;}
  const pr=RB.compareBudgets({comparison:cmp,beforeProject:b,afterProject:a,beforeBudget:bBefore,afterBudget:null});
  // replica exacta de comparar.js:build → beforeBudget=budget?state.budgets.before:null
  const budget=null,beforeBudget=budget?bBefore:null;const v=D.view(cmp,{beforeProject:b,afterProject:a,budget,beforeBudget});const h=D.html(v,{beforeSvg:'',afterSvg:''});
  caso('A25-3','Solo «antes» tiene presupuesto: la pantalla muestra «Comparación no disponible», el núcleo rechaza antes-sin-después y comparar.js lo descarta en silencio: el borrador descargado dice «Sin presupuesto adjunto», sin mencionar que existe el de «antes».',
   err==='after-budget-required'&&pr.status==='one-sided'&&/Sin presupuesto adjunto/.test(h),{nucleo:err,pantalla:pr.status,borrador:'Sin presupuesto adjunto'});}
 // ---- A25-4 · sentido inverso: solo «después» ----
 {const pr=RB.compareBudgets({comparison:cmp,beforeProject:b,afterProject:a,beforeBudget:null,afterBudget:bAfter});const v=D.view(cmp,{beforeProject:b,afterProject:a,budget:bAfter});const h=D.html(v,{beforeSvg:'',afterSvg:''});
  caso('A25-4','Solo «después» tiene presupuesto: la pantalla dice «Comparación no disponible» y el borrador muestra el presupuesto individual completo (coherente con su revisión). Asimetría con A25-3.',
   pr.status==='one-sided'&&h.includes(eur(v.budget.gross.amount)),{pantalla:pr.status,borradorMuestraTotal:true,quantities:v.budget.quantities});}
 // ---- A26 / H03 · obsolescencia real en el navegador ----
 const {chromium}=require('playwright');
 const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png'};
 const srv=http.createServer((q,r)=>{try{let p=new URL(q.url,'http://x').pathname;if(p.endsWith('/'))p+='index.html';const f=path.resolve(M,'.'+decodeURIComponent(p));if(!f.startsWith(M+path.sep))throw 0;r.setHeader('Content-Type',TYPES[path.extname(f)]||'application/octet-stream');r.end(fs.readFileSync(f));}catch{r.statusCode=404;r.end();}});
 await new Promise(r=>srv.listen(0,'127.0.0.1',r));const base=`http://127.0.0.1:${srv.address().port}/`;
 const mem=new Map(),st={getItem:k=>mem.has(k)?mem.get(k):null,setItem:(k,v)=>mem.set(k,String(v)),removeItem:k=>mem.delete(k)};
 const lib=L.load(st,F.before());lib.variant(F.before(),'Reforma A');const vv=lib.group(lib.activeId()).find(g=>g.id===lib.activeId());const e=F.after();e.id=vv.project.id;e.name=vv.project.name;lib.save(e);const group=lib.group(lib.activeId());
 mem.set('rubik-budget-v1',JSON.stringify({[group[0].project.id]:F.budget('complete',group[0].project),[group[1].project.id]:F.budget('complete',group[1].project)}));
 const seedStore=Object.fromEntries(mem);
 const browser=await chromium.launch({args:['--no-sandbox']});const ctx=await browser.newContext({acceptDownloads:true});
 await ctx.addInitScript(s=>{if(window.top!==window||sessionStorage.getItem('s'))return;localStorage.clear();for(const [k,v] of Object.entries(s))localStorage.setItem(k,v);sessionStorage.setItem('s','1');},seedStore);
 const ext=[];ctx.on('request',r=>{if(!r.url().startsWith(base)&&!/^(data|blob):/.test(r.url()))ext.push(r.url());});
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',x=>errs.push(x.message));
 await pg.goto(base+'comparar/?'+V.handoff({beforeId:group[0].id,afterId:group[1].id})+'&anchor='+encodeURIComponent(group[1].id));await pg.waitForSelector('#cmpCard:not([hidden])');
 const dump=()=>pg.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
 const s0=await dump();const sum0=await pg.locator('#bcSummary').textContent();
 // otra pestaña del mismo origen cambia la variante guardada y su presupuesto (lo que haría el editor)
 const other=await ctx.newPage();await other.goto(base+'comparar/?src=library&before=x&after=y');
 await other.evaluate(({k,id})=>{const l=JSON.parse(localStorage.getItem(k));const en=l.entries.find(e=>e.id===id);en.name=en.name+' (cambiada en otra pestaña)';en.updatedAt='2026-11-17T12:00:00Z';localStorage.setItem(k,JSON.stringify(l));
  const bm=JSON.parse(localStorage.getItem('rubik-budget-v1'));for(const key of Object.keys(bm))bm[key].title='Presupuesto cambiado en otra pestaña';localStorage.setItem('rubik-budget-v1',JSON.stringify(bm));},{k:L.KEY,id:group[1].id});
 const s1=await dump();
 await pg.locator('#buildBtn').click();await pg.waitForSelector('#dosOut:not([hidden])');const status=await pg.locator('#dosStatus').textContent();
 await pg.locator('#verifyBtn').click();await pg.waitForSelector('#verifyOut li.sum');const verified=await pg.locator('#verifyOut li.sum').getAttribute('data-ok');
 const usesStale=await pg.evaluate(()=>!/otra pestaña/.test(window.__ux07Compare.dossier.html));
 const s2=await dump();
 caso('A26/H03-1','Tras cambiar la variante y el presupuesto guardados en otra pestaña, el comparador abierto prepara el borrador con los datos retenidos al abrir y «Verificar» lo da por bueno: verify() recibe state.prepared/state.dossier, no una lectura nueva del almacenamiento. Ningún aviso de obsolescencia.',
  usesStale&&verified==='true'&&s1!==s0,{borradorConDatosAntiguos:usesStale,verificado:verified,avisoObsoleto:/obsolet|ha cambiado/i.test(status),estado:status});
 caso('D02-producto','El comparador no escribe en el almacenamiento: lo único que cambia es lo que escribió la otra pestaña.',s2===s1,{igualTrasPreparar:s2===s1});
 // carrera: cambio durante la preparación (entre el clic y el final del await de exportDossier)
 await pg.reload();await pg.waitForSelector('#cmpCard:not([hidden])');
 await pg.evaluate(()=>{const orig=window.FloorPlanBeforeAfterDossier.exportDossier;});// (el módulo está congelado: la carrera se provoca desde fuera)
 const p1=pg.locator('#buildBtn').click();await other.evaluate(()=>{const bm=JSON.parse(localStorage.getItem('rubik-budget-v1'));for(const k of Object.keys(bm))bm[k].title='Cambio durante la preparación';localStorage.setItem('rubik-budget-v1',JSON.stringify(bm));});await p1;
 await pg.waitForSelector('#dosOut:not([hidden])');const raced=await pg.evaluate(()=>!/durante la preparación/.test(window.__ux07Compare.dossier.html));
 caso('A26/H03-2','Cambio del presupuesto guardado mientras se prepara: el borrador sale con el estado leído al cargar la página; no hay invalidación ni reconfirmación.',raced,{borradorConDatosAntiguos:raced});
 await browser.close();srv.close();
 out.paginaSinErrores=!errs.length;out.peticionesExternas=ext.length;
 out.productoSinCambios=execFileSync('git',['-C',M,'status','--porcelain']).toString()===status0;
 const dst=path.join(LAB,'evidence/e2/diagnostico.json');fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,JSON.stringify(out,null,1));
 for(const c of out.casos)console.log(c.resultado,c.id);console.log('producto sin cambios:',out.productoSinCambios,'errores de página:',errs.length,'externas:',ext.length);
})().catch(e=>{console.error(e);process.exit(1);});
