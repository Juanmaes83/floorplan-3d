// v1.3 · A04/A11/A20 · QA del motor de PDF (CSS Print + paginación medida) y de la publicación atómica del compositor.
// Banco: 0 (sin presupuesto), 1, 50, 200 y 500 partidas; descripciones largas y multilínea; caracteres ES/EN; fila
// desmesurada; dos tablas paginables en una página; fallo de impresión. Cada documento con tabla se contrasta con el SNAPSHOT
// (no solo con el DOM): número de filas, descripción de cada partida en orden en el PDF y total impreso = suma de partidas.
// Además: todas las páginas del mismo tamaño, ninguna en blanco, fuentes embebidas.
// Uso: node tools/motor-qa.cjs [dirTrabajo] → evidence/motor/motor-qa.json
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{spawnSync,execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),W=path.resolve(process.argv[2]||fs.mkdtempSync(path.join(os.tmpdir(),'rubik-motor-')));fs.rmSync(W,{recursive:true,force:true});fs.mkdirSync(W,{recursive:true});
const sha=f=>crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
const S0=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));const clone=o=>JSON.parse(JSON.stringify(o));
const cases=[];const add=(id,want,ok,detail)=>cases.push({id,want,result:ok?'PASS':'FAIL',detail});const times=[];
const compose=(snapDir,out,env={})=>{const t=Date.now();const r=spawnSync('node',[path.join(__dirname,'compose.cjs'),snapDir,out],{encoding:'utf8',env:{...process.env,...env},maxBuffer:1<<26});times.push({snapDir:path.basename(snapDir),out:path.basename(out),ms:Date.now()-t,code:r.status});
 let qa=null;try{qa=JSON.parse(fs.readFileSync(path.join(out,'qa.json'),'utf8'));}catch{}return {code:r.status,qa,tail:(r.stdout+r.stderr).slice(-300)};};
const mkVariant=(name,fn)=>{const d=path.join(W,'var',name);fs.mkdirSync(path.join(d,'assets'),{recursive:true});for(const f of fs.readdirSync(path.join(LAB,'snapshot/assets')))fs.copyFileSync(path.join(LAB,'snapshot/assets',f),path.join(d,'assets',f));
 const S=clone(S0);fn(S);S.variant=name;fs.writeFileSync(path.join(d,'snapshot.json'),JSON.stringify(S));return d;};
// N partidas: las del presupuesto canónico repetidas en orden con «PRUEBA n», precios sin tocar, totales recalculados por suma.
const rows=(S,N,desc=l=>l.description)=>{for(const k of ['professional','client']){const V=S.budget.test.view[k];if(!V)continue;const all=V.chapters.flatMap(c=>c.lines.map(l=>({c,l})));let n=0;
  for(const c of V.chapters)c.lines=[];for(let i=0;i<N;i++){const {c,l}=all[i%all.length];c.lines.push({...l,description:`${desc(l,i)} (PRUEBA ${++n})`});}
  V.chapters=V.chapters.filter(c=>c.lines.length);const net=V.chapters.reduce((s,c)=>s+c.lines.reduce((t,l)=>t+l.subtotalNet,0),0),rate=V.summary.tax.ratePercent;
  V.summary={...V.summary,items:n,unreviewed:n,net:{...V.summary.net,amount:Math.round(net*100)/100},tax:{...V.summary.tax,amount:Math.round(net*rate)/100},gross:{...V.summary.gross,amount:Math.round(net*(100+rate))/100}};}
 S.budget.test.label=`DATOS DE PRUEBA DEL MOTOR DE PAGINACIÓN: ${N} partidas sintéticas, no es un presupuesto.`;};
const nf=new Intl.NumberFormat('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2,useGrouping:true}); // el mismo formato que compose.cjs
const pdfPages=f=>{const i=execFileSync('pdfinfo',['-f','1','-l','9999',f]).toString();const sizes=[...i.matchAll(/Page\s+\d+ size:\s+([\d.]+) x ([\d.]+)/g)].map(m=>m[1]+'x'+m[2]);return {n:+/Pages:\s+(\d+)/.exec(i)[1],sizes:[...new Set(sizes)]};};
const blank=(f,n)=>{const o=[];for(let p=1;p<=n;p++)if(!execFileSync('pdftotext',['-q','-f',String(p),'-l',String(p),f,'-']).toString().trim())o.push(p);return o;};
const fontsOk=f=>{const t=execFileSync('pdffonts',[f]).toString().split('\n').slice(2).filter(Boolean);return {fuentes:t.length,noEmbebidas:t.filter(l=>/\s(no)\s+(yes|no)\s+(yes|no)\s+\d+\s+\d+\s*$/.test(l)).length};};
// contraste con el snapshot del documento de propuesta del cliente
const contrast=(out,S)=>{const f=path.join(out,'commercial-proposal-client-v3.pdf');if(!fs.existsSync(f))return {pdf:false};const V=S.budget?.test?.view?.client;if(!V)return {pdf:true,sinPresupuesto:true};
 const txt=execFileSync('pdftotext',['-q','-raw',f,'-']).toString().replace(/[   ]/g,' ').replace(/\s+/g,' ');
 const lines=V.chapters.flatMap(c=>c.lines);let pos=0,missing=[],order=0;for(const l of lines){const key=`(PRUEBA ${l.description.match(/PRUEBA (\d+)\)$/)?.[1]})`;const needle=/PRUEBA \d+\)$/.test(l.description)?key:l.description.slice(0,40).replace(/\s+/g,' ');const i=txt.indexOf(needle,pos);if(i<0){if(txt.includes(needle))order++;else missing.push(needle);}else pos=i+needle.length;}
 const sum=Math.round(lines.reduce((s,l)=>s+l.subtotalNet,0)*100)/100;
 return {pdf:true,filas:lines.length,faltan:missing.length,fueraDeOrden:order,ejemplos:missing.slice(0,3),sumaPartidas:sum,netoSnapshot:V.summary.net.amount,totalImpreso:txt.includes(nf.format(V.summary.gross.amount)),sumaCuadra:Math.abs(sum-V.summary.net.amount)<0.01};};
// ---------- banco ----------
const bench=[['filas-1',S=>rows(S,1)],['filas-50',S=>rows(S,50)],['filas-200',S=>rows(S,200)],['filas-500',S=>rows(S,500)],
 ['sin-presupuesto',S=>{S.budget=null;}],
 ['multilinea-es-en',S=>rows(S,60,(l,i)=>i%3===0?`${l.description}. Línea larga con «comillas», ñ, ü, ç, Ø 12 mm, 3/4", façade, naïve café, Œ, ẞ; segunda frase para forzar varias líneas en la celda`:i%3===1?`Floor finish — oak boards, 14 mm, “quoted” text & ampersand < > in English`:l.description)],
 ['fila-desmesurada',S=>{const V=S.budget.test.view.client,l=V.chapters[0].lines[0];l.description=('PRUEBA DE FILA DESMESURADA. '+l.description+'. ').repeat(140).trim();S.budget.test.view.professional.chapters[0].lines[0].description=l.description;}]];
for(const [name,fn] of bench){const d=mkVariant(name,fn),out=path.join(W,'out',name);const r=compose(d,out);const S=JSON.parse(fs.readFileSync(path.join(d,'snapshot.json'),'utf8'));
 const docs=r.qa?Object.entries(r.qa.docs).filter(([,v])=>v.flow&&v.flow.tables).map(([id,v])=>({id,flow:{rows:v.flow.rows,pagesAdded:v.flow.pagesAdded,ok:v.flow.ok,oversized:v.flow.oversized.length},pdfRows:v.pdfRows&&{cells:v.pdfRows.cells,bad:v.pdfRows.bad}})):[];
 const pdfs=fs.existsSync(out)?fs.readdirSync(out).filter(f=>f.endsWith('.pdf')):[];const phys=pdfs.map(f=>{const p=pdfPages(path.join(out,f));return {f,paginas:p.n,tamanos:p.sizes.length,enBlanco:blank(path.join(out,f),p.n),...fontsOk(path.join(out,f))};});
 const c=contrast(out,S);
 if(name==='fila-desmesurada')add(`B3-${name}`,'compositor termina con código 2 y NO hay PDF de los documentos bloqueados ni .tmp',r.code===2&&r.qa?.blocked?.length>0&&r.qa.blocked.every(b=>!fs.existsSync(path.join(out,b.doc+'.pdf')))&&!fs.readdirSync(out).some(f=>f.endsWith('.tmp')),{blocked:r.qa?.blocked?.map(b=>[b.doc,b.reason]),times:times.at(-1)});
 else add(`B3-${name}`,'0 diferencias de celdas; filas del snapshot en orden en el PDF; suma = neto; total impreso; páginas del mismo tamaño, ninguna en blanco, fuentes embebidas',
  r.code===0&&docs.every(d=>d.flow.ok&&(!d.pdfRows||d.pdfRows.bad===0))&&(c.sinPresupuesto||(c.faltan===0&&c.fueraDeOrden===0&&c.sumaCuadra&&c.totalImpreso))&&phys.every(p=>p.tamanos===1&&!p.enBlanco.length&&p.noEmbebidas===0),{code:r.code,docs,contraste:c,pdfs:phys.filter(p=>/commercial|materials/.test(p.f)),ms:times.at(-1).ms});}
// ---------- publicación atómica del compositor (snapshot canónico) ----------
{const out=path.join(W,'out','canonico');const a=compose(path.join(LAB,'snapshot'),out);const reg0=sha(path.join(out,'entrega/entrega.json')),list0=fs.readdirSync(path.join(out,'entrega/documentos')).sort().join();
 add('PUB-01 composición correcta publica la entrega','código 0; entrega/ con registro y documentos',a.code===0&&fs.existsSync(path.join(out,'entrega/index.html')),{ms:times.at(-1).ms});
 const b=compose(path.join(LAB,'snapshot'),out,{FLOW_FAULT:'print'});
 const left=fs.readdirSync(out).filter(f=>f.startsWith('.entrega-preparacion-')||f.endsWith('.tmp'));
 add('PUB-02 fallo de impresión (celda oculta solo al imprimir)','código 2; entrega anterior intacta byte a byte; informe de rechazo aparte; sin PDF de los documentos bloqueados; sin temporales',
  b.code===2&&sha(path.join(out,'entrega/entrega.json'))===reg0&&fs.readdirSync(path.join(out,'entrega/documentos')).sort().join()===list0&&fs.existsSync(path.join(out,'entrega-rechazo.json'))&&(b.qa?.blocked||[]).every(x=>!fs.existsSync(path.join(out,x.doc+'.pdf')))&&!left.length,
  {blocked:b.qa?.blocked?.map(x=>[x.doc,x.reason]),temporales:left});
 const m=compose(path.join(LAB,'snapshot'),out,{FLOW_FAULT:'multi'});
 add('PUB-03 dos tablas paginables en una página','bloqueo explícito «no soportado»; entrega intacta',m.code===2&&m.qa?.blocked?.some(x=>/varias tablas/.test(x.reason))&&sha(path.join(out,'entrega/entrega.json'))===reg0,{blocked:m.qa?.blocked?.map(x=>[x.doc,x.reason])});
 const c=compose(path.join(LAB,'snapshot'),out);add('PUB-04 recomposición correcta tras un rechazo','código 0; nueva entrega publicada; la anterior en entrega-anterior/; sin informe de rechazo',c.code===0&&fs.existsSync(path.join(out,'entrega-anterior/entrega.json'))&&!fs.existsSync(path.join(out,'entrega-rechazo.json')),{ms:times.at(-1).ms});}
const ms=times.map(t=>t.ms).sort((a,b)=>a-b);
const out={schema:'rubik-lab-motor-qa/1',ran:new Date().toISOString(),entorno:{node:process.version,poppler:execFileSync('pdfinfo',['-v'],{stdio:['ignore','pipe','pipe']}).toString()||spawnSync('pdfinfo',['-v'],{encoding:'utf8'}).stderr.split('\n')[0]},
 pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases,tiempos:{composiciones:times,p50:ms[Math.floor(ms.length/2)],max:ms.at(-1),muestras:ms.length,nota:'Composiciones distintas (no repeticiones del mismo caso): orientativo, no un p95.'}};
const dst=path.join(LAB,'evidence/motor/motor-qa.json');fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,JSON.stringify(out,null,1).split(W).join('<trabajo>'));
for(const c of cases)console.log(c.result,c.id);console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);
