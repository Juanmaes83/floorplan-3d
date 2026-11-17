// v1.3 · QA de la exportación selectiva: los 16 casos de la v1.2 (con sus aserciones) + los negativos nuevos del mandato v1.3.
// Cada caso declara lo que DEBE pasar. Trabaja en un directorio temporal; los casos de manipulación alteran solo copias.
// Uso: node tools/exportar-qa.cjs [dirTrabajo]   → evidence/entrega/qa/exportar-qa.json (código 1 si algún caso falla)
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),crypto=require('crypto'),{spawnSync,spawn,execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),W=path.resolve(process.argv[2]||fs.mkdtempSync(path.join(os.tmpdir(),'rubik-exp-')));fs.rmSync(W,{recursive:true,force:true});fs.mkdirSync(W,{recursive:true});
const SRC0=path.join(LAB,'out/v3/entrega'),REG=JSON.parse(fs.readFileSync(path.join(SRC0,'entrega.json'),'utf8'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),shaF=f=>sha(fs.readFileSync(f));
const BASE={proyecto:REG.project.id,revision:REG.project.revision,snapshotSha256:REG.snapshot.sha256};
const ACK=['Identidad del estudio','Presupuesto revisado','Imágenes IA','Plan de obra'];
const sel=(o)=>({modo:'cliente',idioma:'es',reconocidos:ACK,base:BASE,...o});
const t0=Date.now();const timings=[];
const VALID=path.join(W,'valida.sel.json');fs.writeFileSync(VALID,JSON.stringify(sel({tipo:'propuesta-comercial'})));
const run=(s,name,env={},{raw=false,out}={})=>{const f=path.join(W,name+'.sel.json');fs.writeFileSync(f,raw?s:JSON.stringify(s));const a=Date.now();
 const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),f,out||path.join(W,name)],{encoding:'utf8',env:{...process.env,...env}});timings.push({name,ms:Date.now()-a,code:r.status});
 let res=null;for(const x of ['.resultado.json','.rechazo.json']){try{const p=(out||path.join(W,name))+x;if(fs.existsSync(p)&&fs.statSync(p).mtimeMs>=a-5)res=JSON.parse(fs.readFileSync(p,'utf8'));}catch{}}
 let stdout=null;try{stdout=JSON.parse(r.stdout);}catch{}return {code:r.status,res,stdout,err:(r.stderr||'').slice(-300)};};
const verify=name=>{const r=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),path.join(W,name)],{encoding:'utf8'});return {code:r.status,out:JSON.parse(r.stdout||'{}')};};
const verifyZip=(zip,dig)=>{const r=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),'--zip',zip,'--digest',dig],{encoding:'utf8'});let o={};try{o=JSON.parse(r.stdout);}catch{}return {code:r.status,out:o};};
const texto=p=>/\.pdf$/.test(p)?execFileSync('pdftotext',['-q',p,'-']).toString():/\.(html|json|txt)$/.test(p)?fs.readFileSync(p,'utf8'):fs.readFileSync(p).toString('latin1');
const grepAll=(dir,needles)=>{const hits=[];const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory()){walk(p);continue;}const t=texto(p);for(const n of needles)if(t.includes(n))hits.push(`${n} → ${path.relative(dir,p)}`);}};walk(dir);return hits;};
const filesOf=dir=>{const o=[];const w=(d,r='')=>{for(const f of fs.readdirSync(d).sort()){const p=path.join(d,f),rel=r?r+'/'+f:f;fs.statSync(p).isDirectory()?w(p,rel):o.push(rel);}};w(dir);return o;};
const cases=[];const add=(id,want,ok,detail,v='1.3')=>{cases.push({id,desde:v,want,result:ok?'PASS':'FAIL',detail});};
const blockedBy=(r,k)=>r.code===2&&(r.res?.gates||[]).some(g=>g.k===k&&g.s==='block');
const motivoHas=(r,re)=>r.code!==0&&(r.res?.motivo||r.stdout?.motivo||[]).some(m=>re.test(m));
const srcCopy=name=>{const d=path.join(W,'fuente-'+name,'entrega');fs.cpSync(SRC0,d,{recursive:true});return d;};
const regEdit=(src,fn)=>{const p=path.join(src,'entrega.json'),r=JSON.parse(fs.readFileSync(p,'utf8'));fn(r);fs.writeFileSync(p,JSON.stringify(r,null,1));};
const setPiece=(src,file,b)=>{fs.writeFileSync(path.join(src,file),b);regEdit(src,r=>{r.pieces.find(p=>p.file===file).sha256=sha(b);});};
const S=JSON.parse(fs.readFileSync(path.join(LAB,REG.snapshot.file),'utf8')),v=S.budget.test.view.client;
const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const BUDGET=[nf(2).format(v.summary.gross.amount),nf(2).format(v.summary.net.amount),nf(2).format(v.summary.tax.amount)];

// ===================== casos de la v1.2 (aserciones conservadas) =====================
{const r=run(sel({tipo:'propuesta-comercial'}),'pc');const vf=r.code===0?verify('pc'):null;
 add('ST04-a tipo completo exporta y verifica','exportado y verificador válido',r.code===0&&vf.code===0,{digest:r.stdout?.digest,verificador:vf?.out},'1.2');}
{const res=REG.tipos.map(t=>{const r=run(sel({tipo:t.tipo}),'tipo-'+t.tipo);const vf=r.code===0?verify('tipo-'+t.tipo):{code:-1};return {tipo:t.tipo,code:r.code,verificador:vf.code,files:r.stdout?.digest?.files,motivo:r.res?.motivo};});
 add('ST02-b los 7 tipos exportan y verifican','7/7 exportados y válidos',res.length===7&&res.every(x=>x.code===0&&x.verificador===0),res,'1.2');}
{const r=run(sel({tipo:'propuesta-comercial',capitulos:['vivienda','estancias','materiales','decisiones','documentos','procedencia'],documentos:['interior-book-v3']}),'pc-sin-presupuesto');
 const hits=r.code===0?grepAll(path.join(W,'pc-sin-presupuesto'),BUDGET):['no exportado'];add('ST02-a presupuesto desmarcado: ausencia física','0 coincidencias de importes en toda la carpeta',r.code===0&&!hits.length,{hits,cifras:BUDGET},'1.2');}
{const r=run(sel({tipo:'propuesta-comercial',capitulos:['vivienda','estancias','documentos'],documentos:['commercial-proposal-client-v3']}),'pc-incoherente');
 add('ST03-a PDF con capítulo excluido','bloquea (código 2) por el grafo de contenido',blockedBy(r,'Lo excluido no está'),r.res?.motivo,'1.2');}
{const r=run(sel({tipo:'integral',capitulos:['vivienda','estancias','documentos'],documentos:['entrega-integral']}),'integral-parcial');
 add('ST03-b PDF integral con secciones excluidas','bloquea',r.code===2,r.res?.motivo,'1.2');}
{const r=run(sel({tipo:'propuesta-comercial',reconocidos:[]}),'pc-sin-ack');add('ST03-c avisos sin reconocer (cliente)','bloquea',r.code===2&&r.res.motivo.some(m=>m.startsWith('SIN RECONOCER')),r.res?.motivo,'1.2');
 const b=run(sel({tipo:'propuesta-comercial',modo:'borrador',reconocidos:[]}),'pc-borrador');const h=b.code===0?fs.readFileSync(path.join(W,'pc-borrador/index.html'),'utf8'):'';
 const pdfs=b.code===0?filesOf(path.join(W,'pc-borrador')).filter(f=>f.endsWith('.pdf')):[];
 const pages=pdfs.map(f=>{const p=path.join(W,'pc-borrador',f),n=+/Pages:\s+(\d+)/.exec(execFileSync('pdfinfo',[p]).toString())[1];const per=Array.from({length:n},(_,i)=>execFileSync('pdftotext',['-q','-f',String(i+1),'-l',String(i+1),p,'-']).toString().includes('BORRADOR'));return {f,n,rotuladas:per.filter(Boolean).length};});
 add('ST03-d borrador','exporta rotulado BORRADOR en la web y en CADA página de cada PDF',b.code===0&&h.includes('BORRADOR')&&pages.length>0&&pages.every(x=>x.rotuladas===x.n),{pages},'1.2+1.3');}
{const src=srcCopy('sin-marca');const snap=JSON.parse(JSON.stringify(S));snap.brand.profile={};const sf=path.join(path.dirname(src),'snapshot.json');fs.writeFileSync(sf,JSON.stringify(snap));
 regEdit(src,r=>{r.snapshot={file:path.relative(LAB,sf),sha256:shaF(sf)};});
 const r=run({...sel({tipo:'primera-reunion'}),base:{...BASE,snapshotSha256:shaF(sf)}},'sin-marca',{ENTREGA_SRC:src});add('ST03-e sin identidad','bloquea',blockedBy(r,'Identidad del estudio'),r.res?.motivo,'1.2');}
{const src=srcCopy('cruzado');regEdit(src,r=>{r.ft3d8.project.id='prj_otro-proyecto';});
 const r=run(sel({tipo:'obra'}),'cruzado',{ENTREGA_SRC:src});add('ST03-f obra de otro proyecto','bloquea',blockedBy(r,'Mismo proyecto y revisión'),r.res?.motivo,'1.2');
 const src2=srcCopy('cruzado-rev');regEdit(src2,r=>{r.project.revision='rv1-otra';});
 const r2=run(sel({tipo:'primera-reunion'}),'cruzado-rev',{ENTREGA_SRC:src2});add('ST03-g revisión cruzada','rechaza (código 2)',r2.code===2,r2.res?.motivo,'1.2');}
{const src=srcCopy('datos');const f='documentos/obra-presentacion.html';
 setPiece(src,f,Buffer.from(fs.readFileSync(path.join(src,f),'utf8').replace('</body>','<p>persona.ajena@correo.example</p><script type="application/json">{"walls":[{"id":"w1"}]}</script></body>')));
 const r=run(sel({tipo:'obra'}),'datos',{ENTREGA_SRC:src});
 add('ST06-a dato personal y geometría editable en anexo','bloquea por ambos',blockedBy(r,'Datos personales')&&blockedBy(r,'Sin proyecto editable'),r.res?.motivo,'1.2');}
{const cp=(n)=>{fs.cpSync(path.join(W,'pc'),path.join(W,n),{recursive:true});fs.copyFileSync(path.join(W,'pc.digest.json'),path.join(W,n+'.digest.json'));};
 cp('pc-tamper');const img=fs.readdirSync(path.join(W,'pc-tamper/media'))[0],ip=path.join(W,'pc-tamper/media',img),b=fs.readFileSync(ip);b[b.length-1]^=1;fs.writeFileSync(ip,b);
 const a=verify('pc-tamper');add('ST04-b byte alterado','verificador rechaza',a.code===3&&a.out.errores.some(e=>e.includes(img)),a.out.errores,'1.2');
 cp('pc-extra');fs.writeFileSync(path.join(W,'pc-extra/nota.txt'),'extra');const e=verify('pc-extra');add('ST04-c archivo añadido','verificador rechaza',e.code===3&&e.out.errores.some(x=>x.includes('nota.txt')),e.out.errores,'1.2');
 cp('pc-man');const mp=path.join(W,'pc-man/MANIFIESTO.json'),m=JSON.parse(fs.readFileSync(mp,'utf8'));m.files=m.files.filter(f=>!f.path.startsWith('media/'));fs.writeFileSync(mp,JSON.stringify(m));
 const g=verify('pc-man');add('ST04-d manifiesto reescrito','verificador rechaza',g.code===3&&g.out.errores.some(x=>x.includes('resumen externo')),g.out.errores,'1.2');}
{const h=fs.readFileSync(path.join(W,'pc/index.html'),'utf8');add('ST06-b sin scripts ni listener en la web final','0 <script> y 0 addEventListener(message)',!/<script/i.test(h)&&!/addEventListener\('message'/.test(h),null,'1.2');}
{const m=JSON.parse(fs.readFileSync(path.join(W,'pc-sin-presupuesto/MANIFIESTO.json'),'utf8'));const files=m.files.map(f=>f.path);
 add('A02 registro = selección','sin vídeos ni PDF no elegidos; capítulo presupuesto en excluidos',!files.some(f=>/obra|recorrido\.mp4|commercial|entrega-integral/.test(f))&&m.seleccion.excluidos.includes('presupuesto'),{files},'1.2');}

// ===================== v1.3 · contrato de la selección (A01/A17) =====================
const inval=(id,s,re,opt)=>{const name='sel-'+cases.length;const r=run(s,name,{},opt);add(id,'rechazada (código 2), sin salida',r.code===2&&r.res?.tipo==='selección inválida'&&(!re||motivoHas(r,re))&&!fs.existsSync(path.join(W,name)),r.res?.motivo);};
inval('SEL-01 modo ausente',(({modo,...x})=>x)(sel({tipo:'integral'})),/Modo no válido/);
inval('SEL-02 modo desconocido no es un atajo',sel({tipo:'integral',modo:'publicar'}),/Modo no válido/);
inval('SEL-03 capítulo duplicado',sel({tipo:'integral',capitulos:['vivienda','vivienda','documentos']}),/repetidos/);
inval('SEL-04 documento duplicado',sel({tipo:'integral',documentos:['interior-book-v3','interior-book-v3']}),/repetidos/);
inval('SEL-05 campo no admitido',sel({tipo:'integral',publicar:true}),/Campo no admitido/);
inval('SEL-06 documento con ruta',sel({tipo:'integral',documentos:['../../reports/00-RESUMEN-EJECUTIVO']}),/Documento desconocido/);
inval('SEL-07 documento elegido sin capítulo Documentos',sel({tipo:'integral',capitulos:['vivienda'],documentos:['interior-book-v3']}),/capítulo «Documentos»/);
inval('SEL-08 «reconocer» un bloqueo',sel({tipo:'integral',reconocidos:[...ACK,'Datos personales']}),/no existe/);
inval('SEL-09 selección de otro snapshot (obsoleta)',{...sel({tipo:'integral'}),base:{...BASE,snapshotSha256:'0'.repeat(64)}},/otro snapshot/);
inval('SEL-10 selección de otra revisión',{...sel({tipo:'integral'}),base:{...BASE,revision:'rv1-otra'}},/revisión/);
inval('SEL-11 idioma no admitido (zh aplazado, D6)',sel({tipo:'integral',idioma:'zh'}),/Idioma no válido/);
inval('SEL-12 JSON ilegible','{"tipo":',/JSON legible/,{raw:true});
inval('SEL-13 tipo desconocido',sel({tipo:'portal-publico'}),/Tipo de entrega desconocido/);
inval('SEL-14 recurso a omitir desconocido',sel({tipo:'integral',omitir:['presupuesto']}),/no se puede omitir/);
{const en=(REG.idiomas||['es']).includes('en');const r=run(sel({tipo:'primera-reunion',idioma:'en'}),'idioma-en');
 add('SEL-15 idioma en','exporta si la entrega está compuesta en inglés; si no, bloquea sin mezclar idiomas',en?r.code===0:blockedBy(r,'Idioma'),{compuestaEn:en,motivo:r.res?.motivo});}
// ===================== v1.3 · destino (A13/A14) =====================
{const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),VALID,path.join(LAB,'reports','x')],{encoding:'utf8'});
 add('DST-01 destino fuera de las raíces','error (código 1) y nada escrito',r.status===1&&!fs.existsSync(path.join(LAB,'reports','x'))&&!fs.existsSync(path.join(LAB,'reports','x.rechazo.json')),r.stderr.trim());}
{const before=shaF(path.join(W,'pc.zip'));const r=run(sel({tipo:'propuesta-comercial'}),'pc');
 add('DST-02 no sobrescribe una entrega anterior','error (código 1); ZIP anterior intacto',r.code===1&&shaF(path.join(W,'pc.zip'))===before&&verify('pc').code===0,r.stdout?.motivo);}
{const before=shaF(path.join(W,'pc.zip'));const r=run(sel({tipo:'propuesta-comercial',modo:'x'}),'pc');
 add('DST-03 un intento inválido no borra la salida válida','rechazo (código 2); carpeta, ZIP y resumen intactos',r.code===2&&shaF(path.join(W,'pc.zip'))===before&&verify('pc').code===0,r.res?.motivo);}
{const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),VALID,path.join(W,'Con Espacio')],{encoding:'utf8'});add('DST-04 nombre de salida no permitido','error (código 1)',r.status===1,r.stderr.trim());}
// dos preparaciones simultáneas al mismo destino: exactamente una gana
const concurrent=()=>new Promise(res=>{const f=VALID,codes=[];let n=0;for(let i=0;i<2;i++){const p=spawn('node',[path.join(__dirname,'exportar.cjs'),f,path.join(W,'doble')]);p.on('exit',c=>{codes.push(c);if(++n===2)res(codes.sort());});}});
// ===================== v1.3 · integridad y procedencia de las fuentes (A07/A08/A15) =====================
{const src=srcCopy('img');const f=path.join(src,'media/vista-01-overview.jpg'),b=fs.readFileSync(f);b[200]^=0xff;fs.writeFileSync(f,b);
 const r=run(sel({tipo:'primera-reunion'}),'src-img',{ENTREGA_SRC:src});add('SRC-01 imagen cambiada tras componer','bloquea por integridad de origen',blockedBy(r,'Integridad de origen'),r.res?.motivo);}
{const src=srcCopy('pdf');setPiece(src,'documentos/interior-book-v3.pdf',Buffer.from('%PDF-1.7\nesto no es un PDF válido\n'));
 const r=run(sel({tipo:'propuesta-comercial'}),'src-pdf',{ENTREGA_SRC:src});add('SRC-02 PDF corrupto (aunque el registro cuadre)','bloquea: PDF ilegible',blockedBy(r,'Formato válido'),r.res?.motivo);}
{const src=srcCopy('mp4');const f=path.join(src,'media/recorrido.mp4'),b=fs.readFileSync(f);b[b.length>>1]^=0xff;fs.writeFileSync(f,b);
 const r=run(sel({tipo:'inmobiliaria'}),'src-mp4',{ENTREGA_SRC:src});add('SRC-03 vídeo cambiado tras componer','bloquea',blockedBy(r,'Integridad de origen'),r.res?.motivo);}
{const src=srcCopy('web');fs.appendFileSync(path.join(src,'index.html'),'<!-- -->');
 const r=run(sel({tipo:'primera-reunion'}),'src-web',{ENTREGA_SRC:src});add('SRC-04 página web alterada','rechaza (código 2)',r.code===2&&motivoHas(r,/huella registrada/),r.res?.motivo);}
{const src=srcCopy('noreg');regEdit(src,r=>{r.pieces=r.pieces.filter(p=>p.file!=='media/dibujo-vivo.jpg');});
 const r=run(sel({tipo:'primera-reunion'}),'src-noreg',{ENTREGA_SRC:src});add('SRC-05 archivo sin procedencia registrada','bloquea',blockedBy(r,'Procedencia'),r.res?.motivo);}
{const src=srcCopy('link');const f=path.join(src,'media/vista-02-room.jpg');fs.rmSync(f);fs.symlinkSync('/etc/hostname',f);
 const r=run(sel({tipo:'primera-reunion'}),'src-link',{ENTREGA_SRC:src});add('SRC-06 enlace simbólico fuera de la entrega','bloquea',blockedBy(r,'Rutas válidas'),r.res?.motivo);}
{const src=srcCopy('ext');const f='documentos/obra-presentacion.html';setPiece(src,f,Buffer.from(fs.readFileSync(path.join(src,f),'utf8').replace('</body>','<img src="https://ejemplo.invalid/pixel.png"></body>')));
 const r=run(sel({tipo:'obra'}),'src-ext',{ENTREGA_SRC:src});add('SRC-07 recurso externo oculto en un anexo','bloquea',blockedBy(r,'Sin recursos externos'),r.res?.motivo);}
{const src=srcCopy('js');const f='documentos/obra-presentacion.html';setPiece(src,f,Buffer.from(fs.readFileSync(path.join(src,f),'utf8').replace('</body>','<script>document.title="x"</script></body>')));
 const r=run(sel({tipo:'obra'}),'src-js',{ENTREGA_SRC:src});add('SRC-08 script ejecutable en un anexo','bloquea',blockedBy(r,'Sin código ejecutable'),r.res?.motivo);}
{const src=srcCopy('origen');regEdit(src,r=>{r.pieces.find(p=>p.file==='media/vista-01-overview.jpg').sourceSha256='f'.repeat(64);});
 const r=run(sel({tipo:'primera-reunion'}),'src-origen',{ENTREGA_SRC:src});add('SRC-09 origen cambiado después de componer','bloquea: entrega obsoleta',blockedBy(r,'Origen vigente'),r.res?.motivo);}
{const src=srcCopy('ft');regEdit(src,r=>{r.ft3d8.sha256='0'.repeat(64);});
 const r=run(sel({tipo:'obra'}),'src-ft',{ENTREGA_SRC:src});add('SRC-10 manifiesto FT3D-8 original alterado','bloquea',blockedBy(r,'Integridad de origen'),r.res?.motivo);}
{const src=srcCopy('snap');const snap=JSON.parse(JSON.stringify(S));const sf=path.join(path.dirname(src),'snapshot.json');fs.writeFileSync(sf,JSON.stringify(snap));regEdit(src,r=>{r.snapshot={file:path.relative(LAB,sf),sha256:shaF(sf)};});
 snap.project.name+=' (cambiado)';fs.writeFileSync(sf,JSON.stringify(snap));
 const r=run({...sel({tipo:'primera-reunion'})},'src-snap',{ENTREGA_SRC:src});add('SRC-11 snapshot cambiado después de componer','rechaza: obsoleta',r.code===2,r.res?.motivo);}
{const src=srcCopy('snapfuera');regEdit(src,r=>{r.snapshot.file='../../../../etc/passwd';});const r=run(sel({tipo:'primera-reunion'}),'src-snapfuera',{ENTREGA_SRC:src});
 add('SRC-12 ruta de snapshot fuera del laboratorio','rechaza',r.code===2&&motivoHas(r,/snapshot no permitida/),r.res?.motivo);}
// ===================== v1.3 · herramientas y carrera (A14/A07) =====================
{const bin=path.join(W,'bin-sin-pdftotext');fs.mkdirSync(bin);for(const t of ['which','pdfinfo','ffprobe','zip','unzip','zipinfo','python3']){const w=execFileSync('which',[t]).toString().trim();fs.symlinkSync(w,path.join(bin,t));}
 const r=spawnSync(process.execPath,[path.join(__dirname,'exportar.cjs'),VALID,path.join(W,'sin-extractor')],{encoding:'utf8',env:{...process.env,PATH:bin}});
 add('TOOL-01 extractor de PDF no disponible','error (código 1) y ninguna salida; nunca «texto vacío válido»',r.status===1&&!fs.existsSync(path.join(W,'sin-extractor'))&&/pdftotext/.test(r.stdout),r.stdout.slice(0,200));}
{const hook=path.join(W,'hook-media.cjs');fs.writeFileSync(hook,"module.exports=({SRC})=>{const f=require('path').join(SRC,'media/vista-01-overview.jpg');const b=require('fs').readFileSync(f);b[300]^=1;require('fs').writeFileSync(f,b);};");
 const src=srcCopy('carrera');const r=run(sel({tipo:'primera-reunion'}),'carrera',{ENTREGA_SRC:src,RUBIK_LAB_TEST:'1',RUBIK_LAB_TEST_HOOK:hook});
 add('RACE-01 imagen cambia durante la preparación','cancela el candidato (código 2): sin carpeta, ZIP ni resumen; sin temporales',r.code===2&&r.res?.tipo==='obsoleto'&&!fs.existsSync(path.join(W,'carrera'))&&!fs.existsSync(path.join(W,'carrera.zip'))&&!fs.readdirSync(W).some(x=>x.startsWith('.exportando-')),r.res?.motivo);}
{const hook=path.join(W,'hook-snap.cjs');const src=srcCopy('carrera2');const sf=path.join(path.dirname(src),'snapshot.json');fs.writeFileSync(sf,JSON.stringify(S));regEdit(src,r=>{r.snapshot={file:path.relative(LAB,sf),sha256:shaF(sf)};});
 fs.writeFileSync(hook,`module.exports=()=>{require('fs').appendFileSync(${JSON.stringify(sf)},' ');};`);
 const r=run({...sel({tipo:'primera-reunion'}),base:{...BASE,snapshotSha256:shaF(sf)}},'carrera2',{ENTREGA_SRC:src,RUBIK_LAB_TEST:'1',RUBIK_LAB_TEST_HOOK:hook});
 add('RACE-02 snapshot cambia durante la preparación (otra pestaña)','cancela el candidato',r.code===2&&r.res?.tipo==='obsoleto',r.res?.motivo);}
// ===================== v1.3 · selecciones personalizadas y grafo (A12) =====================
{const r=run(sel({tipo:'integral',capitulos:['vivienda','dibujo','estancias','materiales','presupuesto','recorrido','decisiones','documentos','procedencia'],documentos:['interior-book-v3','commercial-proposal-client-v3']}),'sin-obra');
 const fl=r.code===0?filesOf(path.join(W,'sin-obra')):[];const hits=r.code===0?grepAll(path.join(W,'sin-obra'),['Cómo avanzará la obra','obra-presentacion','obra.mp4']):[];
 add('CUS-01 sin obra','exporta; 0 archivos y 0 textos de obra',r.code===0&&!fl.some(f=>/obra/.test(f))&&!hits.length,{hits,files:fl.length});}
{const r=run(sel({tipo:'interiorismo',omitir:['imagenes-ia'],reconocidos:ACK.filter(x=>x!=='Imágenes IA')}),'sin-ia');
 const fl=r.code===0?filesOf(path.join(W,'sin-ia')):[];const hits=r.code===0?grepAll(path.join(W,'sin-ia'),['Imagen IA','generada con IA','Imágenes con IA']):[];
 add('CUS-02 sin imágenes IA','exporta; 0 archivos ia-*, 0 textos de IA, sin aviso IA que reconocer',r.code===0&&!fl.some(f=>/ia-/.test(f))&&!hits.length,{hits,motivo:r.res?.motivo});}
{const r=run(sel({tipo:'integral',omitir:['videos'],documentos:REG.tipos.find(t=>t.tipo==='integral').documents.filter(d=>d!=='entrega-integral')}),'sin-video');
 const fl=r.code===0?filesOf(path.join(W,'sin-video')):[];const h=r.code===0?fs.readFileSync(path.join(W,'sin-video/index.html'),'utf8'):'';
 add('CUS-03 sin vídeos','exporta; 0 MP4, 0 <video>, sin el anexo con vídeo incrustado',r.code===0&&!fl.some(f=>/\.mp4$|obra-presentacion/.test(f))&&!/<video/.test(h),{motivo:r.res?.motivo});}
{const r=run(sel({tipo:'integral',omitir:['videos']}),'sin-video-integral');add('CUS-04 sin vídeos pero con el PDF integral (que los menciona)','bloquea por el grafo',blockedBy(r,'Lo excluido no está'),r.res?.motivo);}
{const r=run(sel({tipo:'integral',capitulos:['vivienda','estancias','decisiones','procedencia'],documentos:[]}),'sin-documentos');const fl=r.code===0?filesOf(path.join(W,'sin-documentos')):[];
 add('CUS-05 sin documentos','exporta; 0 PDF y sin capítulo Documentos',r.code===0&&!fl.some(f=>f.endsWith('.pdf'))&&!/id="documentos"/.test(fs.readFileSync(path.join(W,'sin-documentos/index.html'),'utf8')),{files:fl});}
{const r=run(sel({tipo:'integral',capitulos:['vivienda','estancias','presupuesto','documentos','procedencia'],documentos:['real-estate-sheet-v3-sin-presupuesto','commercial-proposal-client-v3'],omitir:['imagenes-ia']}),'combinada');
 const vf=r.code===0?verifyZip(path.join(W,'combinada.zip'),path.join(W,'combinada.digest.json')):{code:-1};
 add('CUS-06 combinación (capítulos + documentos + omitir)','exporta y verifica el ZIP exacto',r.code===0&&vf.code===0,{verificador:vf.out?.errores});}
{const r=run(sel({tipo:'primera-reunion',documentos:['real-estate-sheet-v3']}),'ficha-con-presupuesto');add('CUS-07 ficha con presupuesto en una entrega sin presupuesto','bloquea por el grafo',blockedBy(r,'Lo excluido no está'),r.res?.motivo);}
// ===================== v1.3 · ZIP de reparto exacto: alteración de cada tipo de archivo (A09) =====================
{const Z=path.join(W,'pc.zip'),D=path.join(W,'pc.digest.json');const ok=verifyZip(Z,D);
 add('ZIP-00 ZIP de reparto exacto válido','verificador válido; LEEME dentro del inventario',ok.code===0&&JSON.parse(fs.readFileSync(path.join(W,'pc/MANIFIESTO.json'),'utf8')).files.some(f=>f.path==='LEEME.txt'),ok.out);
 const kinds={html:'index.html',txt:'LEEME.txt',json:'MANIFIESTO.json',pdf:filesOf(path.join(W,'pc')).find(f=>f.endsWith('.pdf')),jpg:filesOf(path.join(W,'pc')).find(f=>f.endsWith('.jpg'))};
 for(const [k,rel] of Object.entries(kinds)){const d=path.join(W,'zt-'+k);fs.mkdirSync(d);fs.cpSync(path.join(W,'pc'),path.join(d,'pc'),{recursive:true});const f=path.join(d,'pc',rel),b=fs.readFileSync(f);b[Math.min(b.length-1,40)]^=1;fs.writeFileSync(f,b);
  const z=path.join(d,'pc.zip');execFileSync('zip',['-qrX',z,'pc'],{cwd:d});const r=verifyZip(z,D);add(`ZIP-${k} un byte cambiado en ${rel}`,'verificador rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-extra');fs.mkdirSync(d);fs.cpSync(path.join(W,'pc'),path.join(d,'pc'),{recursive:true});fs.writeFileSync(path.join(d,'pc/media/extra.jpg'),'x');const z=path.join(d,'pc.zip');execFileSync('zip',['-qrX',z,'pc'],{cwd:d});
  const r=verifyZip(z,D);add('ZIP-extra archivo de más','rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-falta');fs.mkdirSync(d);fs.cpSync(path.join(W,'pc'),path.join(d,'pc'),{recursive:true});fs.rmSync(path.join(d,'pc/LEEME.txt'));const z=path.join(d,'pc.zip');execFileSync('zip',['-qrX',z,'pc'],{cwd:d});
  const r=verifyZip(z,D);add('ZIP-falta LEEME eliminado','rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-zip');fs.mkdirSync(d);const z=path.join(d,'pc.zip'),b=fs.readFileSync(Z);b[b.length-30]^=1;fs.writeFileSync(z,b);const r=verifyZip(z,D);add('ZIP-bytes un byte del ZIP','rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-sl');fs.mkdirSync(d);fs.cpSync(path.join(W,'pc'),path.join(d,'pc'),{recursive:true});fs.symlinkSync('/etc/hostname',path.join(d,'pc/media/enlace.jpg'));const z=path.join(d,'pc.zip');execFileSync('zip',['-qrXy',z,'pc'],{cwd:d});
  const r=verifyZip(z,D);add('ZIP-symlink enlace simbólico dentro del ZIP','rechaza',r.code===3&&r.out.errores.some(e=>/simbólico/.test(e)),r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-dup');fs.mkdirSync(d);const z=path.join(d,'pc.zip');execFileSync('python3',['-I','-c',`import zipfile,shutil,warnings;warnings.simplefilter('ignore');shutil.copy(${JSON.stringify(Z)},${JSON.stringify(z)});zf=zipfile.ZipFile(${JSON.stringify(z)},'a');zf.writestr('pc/LEEME.txt','duplicado');zf.close()`]);
  const r=verifyZip(z,D);add('ZIP-dup entrada duplicada','rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-trav');fs.mkdirSync(d);const z=path.join(d,'pc.zip');execFileSync('python3',['-I','-c',`import zipfile,shutil;shutil.copy(${JSON.stringify(Z)},${JSON.stringify(z)});zf=zipfile.ZipFile(${JSON.stringify(z)},'a');zf.writestr('../fuera.txt','x');zf.close()`]);
  const r=verifyZip(z,D);add('ZIP-ruta entrada que sale de la carpeta','rechaza',r.code===3,r.out.errores?.slice(0,3));}
 {const d=path.join(W,'zt-dig');fs.mkdirSync(d);const dd=JSON.parse(fs.readFileSync(D,'utf8'));dd.schema='otro/9';fs.writeFileSync(path.join(d,'pc.digest.json'),JSON.stringify(dd));
  const r=verifyZip(Z,path.join(d,'pc.digest.json'));add('ZIP-esquema resumen externo de otro esquema','rechaza',r.code===3,r.out.errores?.slice(0,3));}}
// ===================== v1.3 · determinismo del contenido =====================
{const r=run(sel({tipo:'propuesta-comercial'}),'pc-bis');const a=JSON.parse(fs.readFileSync(path.join(W,'pc.digest.json'),'utf8')),b=r.code===0?JSON.parse(fs.readFileSync(path.join(W,'pc-bis.digest.json'),'utf8')):{};
 add('DET-01 misma selección, mismo manifiesto','huella del manifiesto idéntica en dos exportaciones',r.code===0&&a.manifestSha256===b.manifestSha256,{a:a.manifestSha256,b:b.manifestSha256,nota:'El ZIP cambia solo por el nombre de la carpeta interior.'});}
(async()=>{const codes=await concurrent();add('DST-05 dos exportaciones simultáneas al mismo destino','una exporta (0) y la otra se rechaza (1); la ganadora verifica',codes.join()==='0,1'&&verify('doble').code===0,{codes});
 const out={schema:'rubik-lab-exportar-qa/2',ran:new Date().toISOString(),entorno:{node:process.version,plataforma:process.platform},ms:Date.now()-t0,pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases,timings};
 const dst=path.join(LAB,'evidence/entrega/qa/exportar-qa.json');fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,JSON.stringify(out,null,1).split(W).join('<trabajo>').split(LAB).join('<lab>'));
 for(const c of cases)console.log(c.result,c.id);console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);})();
