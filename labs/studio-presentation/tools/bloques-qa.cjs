// v1.4 §4 · QA de los bloques documentales de las recetas L: presente, ausente, parcial, incompatible y obsoleto, sobre el
// módulo de bloques (contenido) y sobre el resolvedor (estado). Uso: node tools/bloques-qa.cjs → evidence/recetas/bloques-qa.json
'use strict';
const fs=require('fs'),path=require('path'),LAB=path.resolve(__dirname,'..');
const S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8')),AP0=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/aportaciones.json'),'utf8'));
const RC=require('./recetas.cjs'),B=require('./bloques-receta.cjs');const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d,useGrouping:true}),num=v=>nf(2).format(v);
const views=S.views.map(v=>({...v,src:'data:,'}));
const valid=AP=>{if(!AP||AP.proyecto!==S.project.id||AP.revision!==S.project.revision)return null;const ok={};for(const [k,v] of Object.entries(AP.campos)){const e=RC.FUENTES[k].eval({S,REG:null,aportaciones:{[k]:v}});if(e.estado==='disponible'||e.estado==='parcial')ok[k]=v;}return {...AP,campos:ok};};
const run=AP=>B({S,esc,num,nf,date:'',rev:S.project.revision,STUDIO:'',views,AP:valid(AP),planDemo:null});
const html=(r,doc)=>(r.pages[doc]||[]).map(p=>p.html).join('');
const cases=[];const add=(id,want,ok,det)=>cases.push({id,want,result:ok?'PASS':'FAIL',detalle:det});const clone=o=>JSON.parse(JSON.stringify(o));
{const r=run(AP0);add('B-01 presente','los 7 bloques con sus valores',['commercial-proposal-client-v3','real-estate-sheet-v3','interior-book-v3','architecture-sheet-strip','architecture-book','materials-furniture-book-v3'].every(d=>html(r,d))&&html(r,'commercial-proposal-client-v3').includes('1.800,00')&&html(r,'materials-furniture-book-v3').includes('LAB-FIX-CAMA-160'),Object.keys(r.pages));}
{const r=run(null);add('B-02 ausente','sin bloques de aportaciones; solo los derivados del proyecto (RP10 memoria, RP12 revisión)',!r.pages['real-estate-sheet-v3']&&!r.pages['materials-furniture-book-v3']&&!!r.pages['architecture-book']&&!r.compuestas.honorarios,Object.keys(r.pages));}
{const a=clone(AP0);delete a.campos.honorarios;delete a.campos.validezOferta;const r=run(a),h=html(r,'commercial-proposal-client-v3');add('B-03 parcial','sin honorarios: «No consta» y nunca derivados del presupuesto; sin validez: «no consta»',h.includes('No consta')&&h.includes('no consta.')&&!r.compuestas.honorarios,null);}
{const a=clone(AP0);a.campos.honorarios.valor[0].moneda=undefined;a.campos.precioInmueble={valor:{importe:1},atribucion:''};const r=run(a);add('B-04 incompatible','honorarios sin moneda y precio sin atribución se descartan (no se componen)',!r.compuestas.honorarios&&!r.compuestas.precioInmueble,r.compuestas);}
{const a=clone(AP0);a.revision='rv1-otra';const r=run(a);add('B-05 obsoleto (otra revisión)','ninguna aportación compuesta',!Object.keys(r.compuestas).some(k=>['honorarios','precioInmueble','catalogoProductos'].includes(k)),r.compuestas);}
{const a=clone(AP0);delete a.campos.preciosVerificados;const r=run(a),h=html(r,'materials-furniture-book-v3');add('B-06 precio no verificado','«No valorado», nunca cero ni estimado',h.includes('No valorado')&&!/890,00/.test(h),null);}
{const r=run(AP0),h=html(r,'real-estate-sheet-v3');add('B-07 autoridades separadas','compra, impuestos y reforma en filas con su origen; sin suma',h.includes('no se suman')&&!/Total compra/i.test(h),null);}
// resolvedor sobre la entrega compuesta: estado emitible con las aportaciones compuestas
{const ctx=RC.contexto(LAB,path.join(LAB,'out/v3/entrega'),null);const st=['RP01','RP04','RP06','RP08','RP11','RP12'].map(k=>{const x=RC.resolver(k,ctx,'es');return {k,estado:x.estado,incompleta:x.incompleta};});
 add('B-08 resolvedor','RP01/RP04/RP06/RP11 emitibles sin campos aportados pendientes (los de corte E2/E4 se declaran)',st.filter(x=>['RP01','RP04','RP06','RP11'].includes(x.k)).every(x=>x.estado.startsWith('emitible')&&!x.incompleta.some(i=>['alcanceServicios','honorarios','precioInmueble','impuestosCompra','referenciasMoodboard','catalogoProductos'].includes(i))),st);}
// REGRESIÓN (falso positivo de exclusión textual, 17/11): un texto de aportación que repite el título de un capítulo
// («materiales y mobiliario») hacía que el exportador bloquease las recetas comerciales sin materiales. Ninguna aportación de la
// fixture puede contener títulos de capítulos que el exportador busca como rastro de lo excluido; el título sigue detectándose.
{const TITLES=['Cómo avanzará la obra','plan de obra','Recorrer la vivienda','Lo que hay que decidir','Materiales y mobiliario','Del dibujo a la imagen'];
 const txt=JSON.stringify(AP0.campos).toLowerCase();const hits=TITLES.filter(t=>txt.includes(t.toLowerCase()));
 const exp=fs.readFileSync(path.join(__dirname,'exportar.cjs'),'utf8');const still=TITLES.every(t=>exp.includes(`'${t}'`));
 add('B-09 regresión falso positivo de exclusión textual','0 títulos de capítulo en las aportaciones; el exportador sigue buscándolos',!hits.length&&still,{hits,exportadorConserva:still});}
// estado de salida de compose cuando el inglés pedido se bloquea (código 3, sin ocultarlo con 0)
if(process.argv.includes('--compose')){const os=require('os'),{spawnSync}=require('child_process');const W=fs.mkdtempSync(path.join(os.tmpdir(),'en-fault-'));
 const r=spawnSync('node',[path.join(__dirname,'compose.cjs'),path.join(LAB,'snapshot'),W],{encoding:'utf8',env:{...process.env,STUDIO_EN_FAULT:'1'},maxBuffer:1<<26});
 const q=JSON.parse(fs.readFileSync(path.join(W,'qa.json'),'utf8'));
 add('B-10 compose: inglés pedido y bloqueado','código 3; ES publicado; sin PDF EN del documento bloqueado ni entrega EN',r.status===3&&q.en.blocked.some(b=>b.doc==='commercial-proposal-client-v3.en')&&fs.existsSync(path.join(W,'entrega/index.html'))&&!fs.existsSync(path.join(W,'commercial-proposal-client-v3.en.pdf'))&&!fs.existsSync(path.join(W,'entrega-en')),{codigo:r.status,bloqueados:q.en.blocked.map(b=>b.doc)});fs.rmSync(W,{recursive:true,force:true});}
// REGRESIÓN (17/11): los títulos de bloque con un <span> desbordaban su caja (spill=1) y la reconstrucción lo detectó.
{const q=JSON.parse(fs.readFileSync(path.join(LAB,'out/v3/qa.json'),'utf8'));const ids=['commercial-proposal-client-v3','real-estate-sheet-v3','interior-book-v3','architecture-sheet-strip','architecture-book','materials-furniture-book-v3'].flatMap(i=>[i,i+'.en']);
 const bad=ids.filter(i=>q.docs[i]&&['overflowCount','textOverlapCount','spillCount','svgClipCount','tagOverlaps'].some(k=>q.docs[i][k]));add('B-11 QA geométrico del compositor a cero en los documentos con bloques (ES/EN)',!bad.length&&ids.every(i=>q.docs[i]),bad);}
const out={schema:'rubik-lab-bloques-qa/1',fecha:new Date().toISOString(),pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases};
fs.writeFileSync(path.join(LAB,'evidence/recetas/bloques-qa.json'),JSON.stringify(out,null,1));for(const c of cases)console.log(c.result,c.id,c.result==='FAIL'?JSON.stringify(c.detalle):'');console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);
