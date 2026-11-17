// v1.4 §5 · N04/RP-Q06 · SEIS ESCENARIOS ECONÓMICOS por el RECORRIDO REAL: núcleo canónico del producto (pin de solo lectura,
// huellas de cada archivo contra git) → composición ES/EN con entrega → selección → exportar.cjs (todas sus comprobaciones) →
// verificador independiente del ZIP exacto. Comprobación ESTRUCTURAL de la tabla económica (ámbito, concepto, importe por fila,
// en orden) en el HTML del documento y en el texto del PDF dentro del ZIP, ES y EN; RP07 (ficha sin presupuesto) sin importes.
// El código del núcleo NO se copia al laboratorio ni a ningún ZIP (licencia de redistribución no acreditada).
// Uso: node tools/economia-zip-qa.cjs <repoProducto> → evidence/economia/economia-zip-qa.json + dist/economia/*.zip/.digest.json
'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),crypto=require('crypto'),{execFileSync,spawnSync}=require('child_process');
const pin='8525025a1470d48d52d8e365070e5a0acf116134';const repo=path.resolve(process.argv[2]||'');const LAB=path.resolve(__dirname,'..');
const W=fs.mkdtempSync(path.join(LAB,'out','.economia-'));const DIST=path.join(LAB,'dist/economia');fs.mkdirSync(DIST,{recursive:true});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');const git=(...a)=>execFileSync('git',['-C',repo,...a],{maxBuffer:1<<26});
const P=path.join(os.tmpdir(),'rubik-econ-pin-'+process.pid);fs.mkdirSync(P);execFileSync('tar',['-xf','-','-C',P],{input:git('archive','--format=tar',pin,'js','labs/ux07-ent04/fixtures.js')});
const econ=require(path.join(P,'js/revision-budget-core.js')),compare=require(path.join(P,'js/revision-compare-core.js')),fx=require(path.join(P,'labs/ux07-ent04/fixtures.js'));
const fuentes=Object.keys(require.cache).filter(p=>p.startsWith(P+path.sep)).map(p=>{const rel=path.relative(P,p);const ok=sha(fs.readFileSync(p))===sha(git('show',pin+':'+rel));if(!ok)throw new Error('Núcleo distinto del pin: '+rel);return {archivo:rel,sha256:sha(fs.readFileSync(p))};});
const before=fx.before(),after=fx.after(),cmp=compare.compare(before,after,{relation:'same-project',beforeLabel:'Original',afterLabel:'Reforma'});
const B=fx.budget('complete',before),A=fx.budget('complete',after);const S0=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));
const CASES=[['complete','complete',B,A],['partial','partial',B,fx.budget('partial',after)],['incoherent','incoherent',B,B],['before','one-sided',B,null],['after','one-sided',null,A],['none','none',null,null]];
const fmt=(v,en)=>new Intl.NumberFormat(en?'en-GB':'es-ES',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}).format(v);
// filas esperadas, calculadas del resultado CANÓNICO (no del documento)
const expectedRows=c=>{const r=[],side=(s,l)=>s?.matchesRevision?[[l,s.complete?'Base imponible':'Base conocida',s.net],[l,s.complete?'IVA':'IVA conocido',s.tax],[l,s.complete?'Total con IVA':'Importe conocido con IVA',s.gross]]:[];
 if(c.status==='complete'||c.status==='one-sided'){r.push(...side(c.before,'Revisión base'),...side(c.after,'Revisión propuesta'));if(c.status==='complete')r.push(['Comparación','Diferencia con IVA',c.totals.gross.delta]);}
 if(c.status==='partial')r.push(['Revisión base','Base conocida',c.totals.knownNet.before],['Revisión propuesta','Base conocida',c.totals.knownNet.after],['Comparación','Diferencia de partidas comparables con IVA',c.totals.comparable.grossDelta]);return r;};
const cases=[];const add=(id,ok,det)=>{cases.push({id,result:ok?'PASS':'FAIL',detalle:det});console.log(ok?'PASS':'FAIL',id,ok?'':JSON.stringify(det).slice(0,400));};
const DOCS=['commercial-proposal-client-v3','real-estate-sheet-v3','real-estate-sheet-v3-sin-presupuesto'];
const flat=t=>t.replace(/[  ]/g,' ').replace(/\s+/g,' ');
const paquetes=[];
for(const [id,status,bb,ab] of CASES.filter(c=>!process.env.SOLO||c[0]===process.env.SOLO)){const can=econ.compareBudgets({comparison:cmp,beforeProject:before,afterProject:after,beforeBudget:bb,afterBudget:ab});
 if(can.status!==status)throw new Error('estado canónico inesperado '+id);
 const out=path.join(W,id),inp=path.join(out,'inputs');fs.mkdirSync(path.join(inp,'assets'),{recursive:true});
 for(const f of fs.readdirSync(path.join(LAB,'snapshot/assets')))fs.copyFileSync(path.join(LAB,'snapshot/assets',f),path.join(inp,'assets',f));
 fs.writeFileSync(path.join(inp,'snapshot.json'),JSON.stringify({...S0,variant:'fixture-economia-'+id,brand:{...S0.brand,title:'Fixture de laboratorio económica'},project:{...S0.project,revision:null},views:[],budget:null,economiaComparada:can}));
 const comp=spawnSync('node',[path.join(__dirname,'compose.cjs'),inp,out],{encoding:'utf8',env:{...process.env,STUDIO_FIXTURE_DOC:DOCS.join(','),STUDIO_FIXTURE_ENTREGA:'1'},maxBuffer:1<<26});
 if(comp.status!==0){let en=null;try{en=JSON.parse(fs.readFileSync(path.join(out,'qa.json'),'utf8')).en;en={bloqueados:en.blocked.map(b=>b.doc),restos:Object.values(JSON.parse(fs.readFileSync(path.join(out,'qa.json'),'utf8')).docs).flatMap(d=>(d.i18n?.residual||[]).map(x=>x.t)).filter((x,i,a)=>a.indexOf(x)===i).slice(0,30)};}catch{}add(`${id}: composición`,false,{codigo:comp.status,en,cola:(comp.stdout+comp.stderr).slice(-300)});continue;}
 const exp=expectedRows(can);const REG=JSON.parse(fs.readFileSync(path.join(out,'entrega/entrega.json'),'utf8'));
 for(const lang of ['es','en']){const en=lang==='en';
  // estructura en el HTML compuesto del documento (ES): filas exactas y en orden
  if(!en){const h=fs.readFileSync(path.join(out,'commercial-proposal-client-v3.html'),'utf8');const rows=[...h.matchAll(/<tr><td>([^<]*)<\/td><td>([^<]*)<\/td><td class="num">([^<]*)<\/td><\/tr>/g)].map(m=>[m[1],m[2],m[3].replace(/\s/g,' ').trim()]);
   const want=exp.map(([a,b,v])=>[a,b,Number.isFinite(v)?fmt(v,0)+' €':'—']);add(`${id}: estructura HTML (filas, conceptos, importes, orden)`,JSON.stringify(rows.filter(r=>/Revisión|Comparación/.test(r[0])))===JSON.stringify(want),{esperado:want,obtenido:rows.slice(0,8)});}
  // recorrido real: selección → exportar → verificador del ZIP exacto
  const name=`economia-${id}-${lang}`,sel={tipo:'propuesta-comercial',capitulos:['vivienda','presupuesto','documentos','procedencia'],documentos:['commercial-proposal-client-v3','real-estate-sheet-v3'],modo:'cliente',idioma:lang,
   reconocidos:['Identidad del estudio','Presupuesto revisado','Imágenes IA','Plan de obra','Idioma'],base:{proyecto:REG.project.id,revision:REG.project.revision,snapshotSha256:REG.snapshot.sha256}};
  const sf=path.join(W,name+'.sel.json');fs.writeFileSync(sf,JSON.stringify(sel));const dst=path.join(DIST,name);for(const x of ['','.zip','.digest.json','.resultado.json','.rechazo.json'])fs.rmSync(dst+x,{recursive:true,force:true});
  const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),sf,dst],{encoding:'utf8',env:{...process.env,ENTREGA_SRC:path.join(out,'entrega')}});
  if(r.status!==0){add(`${id}/${lang}: exportación real`,false,{codigo:r.status,salida:r.stdout.slice(0,600)});continue;}
  const v=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),'--zip',dst+'.zip','--digest',dst+'.digest.json'],{encoding:'utf8'});
  const t=flat(execFileSync('pdftotext',['-q',path.join(dst,`documentos/commercial-proposal-client-v3${en?'.en':''}.pdf`),'-']).toString());
  const amountsOk=exp.every(([,,v])=>!Number.isFinite(v)||t.includes(fmt(v,en)));
  const forbidden=status==='incoherent'||status==='none'?/\d[\d.,]*[.,]\d\d\s*€|€\s*\d/.test(t.replace(/Precios? de prueba[^.]*\./g,'')):false;
  const orderOk=(()=>{let p=0;for(const [,,v] of exp){if(!Number.isFinite(v))continue;const i=t.indexOf(fmt(v,en),p);if(i<0)return false;p=i;}return true;})();
  add(`${id}/${lang}: ZIP exportado y verificado; importes canónicos presentes y en orden; sin importes cuando no procede`,v.status===0&&amountsOk&&orderOk&&!forbidden,{verificador:v.status,amountsOk,orderOk,forbidden});
  paquetes.push({escenario:id,idioma:lang,zip:path.basename(dst)+'.zip',sha256:sha(fs.readFileSync(dst+'.zip')),digest:path.basename(dst)+'.digest.json'});}
 // RP07 / selección sin economía: ficha sin presupuesto → ningún importe en ningún archivo distribuido
 {const name=`economia-${id}-rp07`,sel={tipo:'inmobiliaria',capitulos:['vivienda','documentos','procedencia'],documentos:['real-estate-sheet-v3-sin-presupuesto'],modo:'cliente',idioma:'es',reconocidos:['Identidad del estudio','Imágenes IA'],base:{proyecto:REG.project.id,revision:REG.project.revision,snapshotSha256:REG.snapshot.sha256}};
  const sf=path.join(W,name+'.sel.json');fs.writeFileSync(sf,JSON.stringify(sel));const dst=path.join(W,name);
  const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),sf,dst],{encoding:'utf8',env:{...process.env,ENTREGA_SRC:path.join(out,'entrega')}});
  let hits=[];if(r.status===0){const walk=d=>fs.readdirSync(d).flatMap(f=>{const p=path.join(d,f);return fs.statSync(p).isDirectory()?walk(p):[p];});
   for(const f of walk(dst)){const tx=f.endsWith('.pdf')?execFileSync('pdftotext',['-q',f,'-']).toString():/\.(html|txt|json)$/.test(f)?fs.readFileSync(f,'utf8'):'';const m=flat(tx).match(/\d{1,3}(\.\d{3})*,\d\d\s*€/g);if(m)hits.push(path.relative(dst,f)+': '+m.slice(0,3).join(' '));}}
  add(`${id}/RP07: sin importes económicos en ningún recurso distribuido`,r.status===0&&!hits.length,{codigo:r.status,hits,salida:r.status?r.stdout.slice(0,300):null});}}
fs.rmSync(P,{recursive:true,force:true});
const res={schema:'rubik-lab-economia-zip-qa/1',fecha:new Date().toISOString(),producto:pin,fuentes,licencia:'Núcleo ejecutado desde el pin en una carpeta temporal y borrado al terminar; no se copia al laboratorio ni a ningún ZIP. Derechos de redistribución: no acreditados.',
 pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases,paquetes};
fs.writeFileSync(path.join(LAB,'evidence/economia/economia-zip-qa.json'),JSON.stringify(res,null,1).split(W).join('<trabajo>'));
if(!process.env.KEEP)fs.rmSync(W,{recursive:true,force:true});console.log(res.pass+'/'+cases.length);process.exit(res.fail?1:0);
