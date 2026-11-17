// v1.2 · ST02/ST03/ST04/ST06 · Pruebas negativas y positivas de la exportación selectiva. Cada caso declara lo que DEBE pasar.
// Se ejecutan sobre copias en un directorio temporal; los casos de manipulación alteran solo esas copias.
// Uso: node tools/exportar-qa.cjs <dirTrabajo>   → evidence/entrega/qa/exportar-qa.json
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync,execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),W=path.resolve(process.argv[2]||fs.mkdtempSync(path.join(os.tmpdir(),'rubik-exp-')));fs.mkdirSync(W,{recursive:true});
const run=(sel,name,env={})=>{const f=path.join(W,name+'.sel.json');fs.writeFileSync(f,JSON.stringify(sel));const r=spawnSync('node',[path.join(__dirname,'exportar.cjs'),f,path.join(W,name)],{encoding:'utf8',env:{...process.env,...env}});
 let res=null;try{res=JSON.parse(fs.readFileSync(path.join(W,name)+'.resultado.json','utf8'));}catch{}return {code:r.status,res,err:r.stderr.slice(-400)};};
const verify=name=>{const r=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),path.join(W,name)],{encoding:'utf8'});return {code:r.status,out:JSON.parse(r.stdout||'{}')};};
const grepAll=(dir,needles)=>{const hits=[];const walk=d=>{for(const f of fs.readdirSync(d)){const p=path.join(d,f);if(fs.statSync(p).isDirectory()){walk(p);continue;}
  let t;if(/\.pdf$/.test(f))t=execFileSync('pdftotext',['-q',p,'-']).toString();else if(/\.(html|json)$/.test(f))t=fs.readFileSync(p,'utf8');else t=fs.readFileSync(p).toString('latin1');
  for(const n of needles)if(t.includes(n))hits.push(`${n} → ${path.relative(dir,p)}`);}};walk(dir);return hits;};
const cases=[];const add=(id,want,ok,detail)=>{cases.push({id,want,result:ok?'PASS':'FAIL',detail});};
const S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8')),v=S.budget.test.view.client;
const nf=d=>new Intl.NumberFormat('es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
const BUDGET=[nf(2).format(v.summary.gross.amount),nf(2).format(v.summary.net.amount),nf(2).format(v.summary.tax.amount)];
const ACK=['Identidad del estudio','Presupuesto revisado','Imágenes IA','Plan de obra'];
// 1 · selección de un tipo completo exporta y verifica
{const r=run({tipo:'propuesta-comercial',modo:'cliente',reconocidos:ACK},'pc');const vf=r.code===0?verify('pc'):null;
 add('ST04-a tipo completo exporta y verifica','exportado y verificador válido',r.code===0&&vf.code===0,{export:r.res?.digest,verificador:vf?.out});}
// 1b · los 7 tipos predefinidos son exportables tal cual (ningún preset adjunta un PDF con capítulos que no muestra)
{const reg=JSON.parse(fs.readFileSync(path.join(LAB,'out/v3/entrega/entrega.json'),'utf8'));const res=reg.tipos.map(t=>{const r=run({tipo:t.tipo,modo:'cliente',reconocidos:ACK},'tipo-'+t.tipo);const vf=r.code===0?verify('tipo-'+t.tipo):{code:-1};return {tipo:t.tipo,code:r.code,verificador:vf.code,files:r.res?.digest?.files,motivo:r.res?.motivo};});
 add('ST02-b los 7 tipos exportan y verifican','7/7 exportados y válidos',res.every(x=>x.code===0&&x.verificador===0),res);}
// 2 · ST02 · sin presupuesto: ninguna cifra del presupuesto en HTML, PDF, medios ni manifiesto
{const r=run({tipo:'propuesta-comercial',capitulos:['vivienda','estancias','materiales','decisiones','documentos','procedencia'],documentos:['interior-book-v3'],modo:'cliente',reconocidos:ACK},'pc-sin-presupuesto');
 const hits=r.code===0?grepAll(path.join(W,'pc-sin-presupuesto'),BUDGET):['no exportado'];add('ST02-a presupuesto desmarcado: ausencia física','0 coincidencias de importes en toda la carpeta',r.code===0&&!hits.length,{hits,cifras:BUDGET});}
// 3 · ST02 · documento incoherente con la selección: bloquea
{const r=run({tipo:'propuesta-comercial',capitulos:['vivienda','estancias'],documentos:['commercial-proposal-client-v3'],modo:'cliente',reconocidos:ACK},'pc-incoherente');
 add('ST03-a PDF con capítulo excluido','bloquea (código 2)',r.code===2&&r.res.gates.some(g=>g.k==='Selección coherente'&&g.s==='block'),r.res?.motivo);}
// 4 · ST02 · el PDF integral solo con todos los capítulos
{const r=run({tipo:'integral',capitulos:['vivienda','estancias'],documentos:['entrega-integral'],modo:'cliente',reconocidos:ACK},'integral-parcial');
 add('ST03-b PDF integral con secciones excluidas','bloquea',r.code===2,r.res?.motivo);}
// 5 · ST03 · avisos sin reconocer en modo cliente: bloquea; en borrador exporta con banda BORRADOR
{const r=run({tipo:'propuesta-comercial',modo:'cliente'},'pc-sin-ack');add('ST03-c avisos sin reconocer (cliente)','bloquea',r.code===2&&r.res.motivo.some(m=>m.startsWith('SIN RECONOCER')),r.res?.motivo);
 const b=run({tipo:'propuesta-comercial',modo:'borrador'},'pc-borrador');const h=b.code===0?fs.readFileSync(path.join(W,'pc-borrador/index.html'),'utf8'):'';
 add('ST03-d borrador','exporta rotulado BORRADOR',b.code===0&&h.includes('BORRADOR'),b.res?.digest);}
// 6 · ST03 · falta la identidad del estudio: bloquea
{const snap=JSON.parse(JSON.stringify(S));snap.brand.profile={};const f=path.join(W,'snap-sin-marca.json');fs.writeFileSync(f,JSON.stringify(snap));
 const r=run({tipo:'primera-reunion',modo:'cliente',reconocidos:ACK},'sin-marca',{ENTREGA_SNAPSHOT:f});add('ST03-e sin identidad','bloquea',r.code===2&&r.res.gates.some(g=>g.k==='Identidad del estudio'&&g.s==='block'),r.res?.motivo);}
// 7 · ST03 · proyecto cruzado (registro de otra revisión) y obra de otro proyecto: bloquea
{const src=path.join(W,'src-cruzado');fs.cpSync(path.join(LAB,'out/v3/entrega'),src,{recursive:true});const reg=JSON.parse(fs.readFileSync(path.join(src,'entrega.json'),'utf8'));
 reg.ft3d8.project.id='prj_otro-proyecto';fs.writeFileSync(path.join(src,'entrega.json'),JSON.stringify(reg));
 const r=run({tipo:'obra',modo:'cliente',reconocidos:ACK},'cruzado',{ENTREGA_SRC:src});add('ST03-f obra de otro proyecto','bloquea',r.code===2&&r.res.gates.some(g=>g.k==='Mismo proyecto y revisión'&&g.s==='block'),r.res?.motivo);
 const reg2=JSON.parse(fs.readFileSync(path.join(src,'entrega.json'),'utf8'));reg2.ft3d8.project.id=S.project.id;reg2.project.revision='rv1-otra';fs.writeFileSync(path.join(src,'entrega.json'),JSON.stringify(reg2));
 const r2=run({tipo:'primera-reunion',modo:'cliente',reconocidos:ACK},'cruzado-rev',{ENTREGA_SRC:src});add('ST03-g revisión cruzada','bloquea',r2.code===2,r2.res?.motivo);}
// 8 · ST03/ST06 · dato personal ajeno y proyecto editable dentro de un anexo: bloquea
{const src=path.join(W,'src-datos');fs.cpSync(path.join(LAB,'out/v3/entrega'),src,{recursive:true});const f=path.join(src,'documentos/obra-presentacion.html');
 fs.writeFileSync(f,fs.readFileSync(f,'utf8').replace('</body>','<p>cliente.real@correo.es</p><script type="application/json">{"walls":[{"id":"w1"}]}</script></body>'));
 const r=run({tipo:'obra',modo:'cliente',reconocidos:ACK},'datos',{ENTREGA_SRC:src});
 add('ST06-a dato personal y geometría editable en anexo','bloquea por ambos',r.code===2&&r.res.gates.some(g=>g.k==='Datos personales'&&g.s==='block')&&r.res.gates.some(g=>g.k==='Sin proyecto editable'&&g.s==='block'),r.res?.motivo);}
// 9 · ST04 · manipulación: un byte cambiado, un archivo añadido, el manifiesto reescrito sin el resumen externo
{fs.cpSync(path.join(W,'pc'),path.join(W,'pc-tamper'),{recursive:true});fs.copyFileSync(path.join(W,'pc.digest.json'),path.join(W,'pc-tamper.digest.json'));
 const img=fs.readdirSync(path.join(W,'pc-tamper/media'))[0],ip=path.join(W,'pc-tamper/media',img),b=fs.readFileSync(ip);b[b.length-1]^=1;fs.writeFileSync(ip,b);
 const a=verify('pc-tamper');add('ST04-b byte alterado','verificador rechaza',a.code===3&&a.out.errores.some(e=>e.includes(img)),a.out.errores);
 fs.cpSync(path.join(W,'pc'),path.join(W,'pc-extra'),{recursive:true});fs.copyFileSync(path.join(W,'pc.digest.json'),path.join(W,'pc-extra.digest.json'));fs.writeFileSync(path.join(W,'pc-extra/nota.txt'),'extra');
 const e=verify('pc-extra');add('ST04-c archivo añadido','verificador rechaza',e.code===3&&e.out.errores.some(x=>x.includes('nota.txt')),e.out.errores);
 fs.cpSync(path.join(W,'pc'),path.join(W,'pc-man'),{recursive:true});fs.copyFileSync(path.join(W,'pc.digest.json'),path.join(W,'pc-man.digest.json'));const mp=path.join(W,'pc-man/MANIFIESTO.json'),m=JSON.parse(fs.readFileSync(mp,'utf8'));
 m.files=m.files.filter(f=>!f.path.startsWith('media/'));fs.writeFileSync(mp,JSON.stringify(m));const g=verify('pc-man');add('ST04-d manifiesto reescrito','verificador rechaza',g.code===3&&g.out.errores.some(x=>x.includes('resumen externo')),g.out.errores);}
// 10 · ST06 · la web final no escucha mensajes ni lleva scripts; abre sin red con todos sus recursos
{const h=fs.readFileSync(path.join(W,'pc/index.html'),'utf8');add('ST06-b sin scripts ni listener en la web final','0 <script> y 0 addEventListener(message)',!/<script/i.test(h)&&!/addEventListener\('message'/.test(h),null);}
// 11 · registro = selección: el manifiesto registra exactamente lo exportado (archivos y capítulos)
{const m=JSON.parse(fs.readFileSync(path.join(W,'pc-sin-presupuesto/MANIFIESTO.json'),'utf8'));const files=m.files.map(f=>f.path);
 add('A02 registro = selección','sin vídeos ni PDF no elegidos; capítulo presupuesto en excluidos',!files.some(f=>/obra|recorrido\.mp4|commercial|entrega-integral/.test(f))&&m.seleccion.excluidos.includes('presupuesto'),{files});}
const out={schema:'rubik-lab-exportar-qa/1',ran:new Date().toISOString(),workdir:W,pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases};
const dst=path.join(LAB,'evidence/entrega/qa/exportar-qa.json');fs.mkdirSync(path.dirname(dst),{recursive:true});fs.writeFileSync(dst,JSON.stringify(out,null,1));
for(const c of cases)console.log(c.result,c.id);console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);
