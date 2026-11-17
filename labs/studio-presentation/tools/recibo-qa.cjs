// v1.4 §6 · N05 · RECIBO DE RECETA por el recorrido profesional (Preparar entrega → selección → preparar.cjs → candidato).
// Uso: node tools/recibo-qa.cjs → evidence/recetas/recibo-qa.json
'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync,execFileSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),W=fs.mkdtempSync(path.join(os.tmpdir(),'recibo-')),RC=require('./recetas.cjs');
const ctx=RC.contexto(LAB,path.join(LAB,'out/v3/entrega'),null);const cases=[];const add=(id,ok,d)=>{cases.push({id,result:ok?'PASS':'FAIL',detalle:d});console.log(ok?'PASS':'FAIL',id,ok?'':JSON.stringify(d).slice(0,300));};
const ACK=['Identidad del estudio','Presupuesto revisado','Imágenes IA','Plan de obra'];
const prep=(sel,n)=>{const f=path.join(W,n+'.json');fs.writeFileSync(f,JSON.stringify(sel));const r=spawnSync('node',[path.join(__dirname,'preparar.cjs'),f,path.join(W,n)],{encoding:'utf8'});let j=null;try{j=JSON.parse(r.stdout);}catch{}return {code:r.status,j,dir:path.join(W,n)};};
const rp=RC.resolver('RP01',ctx,'es'),v=RC.RECETAS.find(r=>r.key==='RP01').version;
// 1 · receta aplicada sin cambios
{const r=prep({...rp.seleccion,modo:'cliente',reconocidos:ACK,receta:{key:'RP01',version:v}},'a');const rec=r.j?.recibo?JSON.parse(fs.readFileSync(path.join(r.dir,r.j.recibo),'utf8')):null;
 const zip=rec?.candidato?path.join(r.dir,rec.candidato.zip):null;const zipOk=zip&&require('crypto').createHash('sha256').update(fs.readFileSync(zip)).digest('hex')===rec.candidato.zipSha256;
 const list=zip?execFileSync('unzip',['-Z1',zip]).toString():'';const man=zip?execFileSync('unzip',['-p',zip,path.basename(zip,'.zip')+'/MANIFIESTO.json']).toString():'';
 add('R-01 receta aplicada: recibo con receta, versión, fuentes, alcance, avisos y huella EXACTA del ZIP',r.code===0&&rec.receta==='RP01'&&rec.versionCoincide&&rec.seleccion.aplicada.includes('sin cambios')&&Object.keys(rec.fuentes).length>3&&Array.isArray(rec.avisos)&&zipOk,{rec:rec&&{...rec,fuentes:undefined}});
 add('R-02 el ZIP del cliente no lleva el recibo ni datos de receta; el manifiesto no cambia de esquema',!/recibo|receta/i.test(list)&&!/"receta"/.test(man)&&/rubik-lab-entrega-manifiesto\/2/.test(man),{lista:list.split('\n').length});}
// 2 · receta modificada por el estudio
{const s={...rp.seleccion,documentos:[],capitulos:rp.seleccion.capitulos.filter(c=>c!=='documentos'),modo:'cliente',reconocidos:ACK,receta:{key:'RP01',version:v}};const r=prep(s,'b');
 const rec=r.j?.recibo?JSON.parse(fs.readFileSync(path.join(r.dir,r.j.recibo),'utf8')):null;add('R-03 selección modificada: el recibo lo dice y nombra los cambios',rec&&/modificada/.test(rec.seleccion.aplicada)&&rec.seleccion.cambios.includes('documentos'),rec?.seleccion);}
// 3 · receta inválida y versión distinta
{const r=prep({...rp.seleccion,modo:'cliente',reconocidos:ACK,receta:{key:'RP99',version:1}},'c');add('R-04 receta inexistente: selección rechazada',r.code===2,r.j?.motivo);}
{const r=prep({...rp.seleccion,modo:'cliente',reconocidos:ACK,receta:{key:'RP01',version:v+7}},'d');const rec=r.j?.recibo?JSON.parse(fs.readFileSync(path.join(r.dir,r.j.recibo),'utf8')):null;
 add('R-05 versión de receta distinta del catálogo: queda registrada (versionCoincide=false)',rec&&rec.versionCoincide===false,rec&&{version:rec.version,catalogo:rec.versionCatalogo});}
// 4 · interfaz: aplicar receta en «Preparar entrega» y descargar la selección lleva {receta:{key,version}}
(async()=>{const {chromium}=require('playwright');const b=await chromium.launch({args:['--no-sandbox']});const c=await b.newContext({acceptDownloads:true});const p=await c.newPage();
 await p.goto('file://'+path.join(LAB,'out/v3/profesional/preparar-entrega.html'));const btn=p.locator('[data-rec="RP01"]').first();let sel=null;
 try{await btn.click();await p.locator('#recApply').click();const [dl]=await Promise.all([p.waitForEvent('download'),p.locator('#reg').click()]);sel=JSON.parse(fs.readFileSync(await dl.path(),'utf8'));}catch(e){sel={error:e.message.slice(0,200)};}
 await b.close();add('R-06 interfaz: la selección descargada lleva receta y versión',sel?.receta?.key==='RP01'&&sel.receta.version===v,sel?.receta||sel);
 const out={schema:'rubik-lab-recibo-qa/1',fecha:new Date().toISOString(),pass:cases.filter(c=>c.result==='PASS').length,fail:cases.filter(c=>c.result==='FAIL').length,cases};
 fs.writeFileSync(path.join(LAB,'evidence/recetas/recibo-qa.json'),JSON.stringify(out,null,1).split(W).join('<trabajo>'));fs.rmSync(W,{recursive:true,force:true});console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);})();
