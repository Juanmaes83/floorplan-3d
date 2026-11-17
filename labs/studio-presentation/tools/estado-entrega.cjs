// v1.4 · N05 · ESTADOS DE UN CANDIDATO DE ENTREGA (laboratorio). Contrato mínimo, no un gestor documental de producto.
//   borrador    la fuente sigue editable (no hay candidato: lo que hay es el proyecto)
//   preparado   snapshot, registro, selección, receta y bytes (ZIP, manifiesto) CONGELADOS por huella
//   verificado  el verificador independiente acepta el ZIP exacto (integridad) Y las fuentes no han cambiado (vigencia)
//   verificado-desactualizado  íntegro pero las fuentes cambiaron: hace falta un candidato nuevo; el antiguo no se toca
//   invalido    los bytes no coinciden con lo congelado o el verificador los rechaza
//   emitido-simulado  SOLO con --simulacion: rótulo de laboratorio; no se envía nada a nadie
// «Aceptado», «firmado», «certificado» o «ejecutado» nunca se infieren de una descarga, una huella, un aviso reconocido o
// un QA: este laboratorio los rechaza siempre. Sustituir crea un enlace nuevo → anterior; no borra ni reescribe nada.
// El registro de estado (<dir>.estado.json) es interno del estudio: vive FUERA de la carpeta y del ZIP del cliente.
// Uso: node tools/estado-entrega.cjs preparar|verificar|emitir|sustituir|<otro> <dirCandidato> [--simulacion "motivo"] [--anterior <dir>]
// Salida: JSON; código 0 hecho · 2 rechazado · 1 uso o entorno.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),SRC=path.resolve(process.env.ENTREGA_SRC||path.join(LAB,'out/v3/entrega'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),shaF=f=>sha(fs.readFileSync(f));
const a=process.argv.slice(2);const opt=k=>{const i=a.indexOf(k);if(i<0)return null;const v=a[i+1];a.splice(i,2);return v;};
const sim=opt('--simulacion'),ant=opt('--anterior');const [accion,dirArg]=a;
const out=(code,o)=>{console.log(JSON.stringify(o,null,1));process.exit(code);};
if(!accion||!dirArg)out(1,{error:'Uso: node tools/estado-entrega.cjs <acción> <dirCandidato> [--simulacion "motivo"] [--anterior <dir>]'});
const DIR=path.resolve(dirArg),EST=DIR+'.estado.json',now=()=>new Date().toISOString();
const NUNCA=['aceptar','aceptado','firmar','firmado','certificar','certificado','ejecutar','ejecutado'];
if(NUNCA.includes(accion))out(2,{accion,hecho:false,motivo:`«${accion}» exige hechos y autorizaciones separados (persona, documento, fecha). No se infiere de una descarga, una huella, un aviso reconocido ni un QA, y esta misión no lo autoriza.`});
if(!['preparar','verificar','emitir','sustituir'].includes(accion))out(1,{error:'Acción desconocida: '+accion});
const leer=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return null;}};
const estadoActual=()=>leer(EST);
const guardar=e=>fs.writeFileSync(EST,JSON.stringify(e,null,1));
const fuentes=()=>{const reg=path.join(SRC,'entrega.json');const R=leer(reg);const snap=R?path.resolve(LAB,R.snapshot.file):null;
 return {registroSha256:fs.existsSync(reg)?shaF(reg):null,snapshotSha256:snap&&fs.existsSync(snap)?shaF(snap):null};};
// ---------------------------------------------------------------- preparar
if(accion==='preparar'||accion==='sustituir'){
 if(estadoActual())out(2,{accion,hecho:false,motivo:'Este candidato ya está preparado. Un cambio exige un candidato nuevo; el anterior no se modifica.'});
 const dig=leer(DIR+'.digest.json'),man=leer(path.join(DIR,'MANIFIESTO.json'));
 if(!dig||!man||!fs.existsSync(DIR+'.zip'))out(2,{accion,hecho:false,motivo:'No hay un candidato exportado completo (carpeta, ZIP y resumen externo).'});
 if(shaF(DIR+'.zip')!==dig.zipSha256)out(2,{accion,hecho:false,motivo:'El ZIP no coincide con su resumen externo: no se congela un candidato alterado.'});
 const rec=leer(DIR+'.receta.json');let anterior=null;
 if(accion==='sustituir'){if(!ant)out(1,{error:'sustituir necesita --anterior <dir>'});const A=leer(path.resolve(ant)+'.estado.json');
  if(!A)out(2,{accion,hecho:false,motivo:'El candidato anterior no tiene registro de estado.'});
  if(A.sustituidoPor)out(2,{accion,hecho:false,motivo:`El candidato anterior ya fue sustituido por ${A.sustituidoPor}.`});
  if(path.resolve(ant)===DIR)out(2,{accion,hecho:false,motivo:'Un candidato no se sustituye a sí mismo.'});
  anterior={id:A.id,zipSha256:A.congelado.zipSha256};}
 const e={schema:'rubik-lab-estado-entrega/1',id:path.basename(DIR),interno:'Registro del estudio. No va en la entrega del cliente.',
  congelado:{zipSha256:dig.zipSha256,manifestSha256:dig.manifestSha256,seleccionSha256:sha(JSON.stringify(man.seleccion)),snapshotSha256:man.base?.snapshotSha256,registroSha256:man.base?.registroSha256,
   idioma:man.seleccion?.idioma,modo:man.seleccion?.modo,receta:rec?{key:rec.receta,version:rec.version,catalogo:rec.catalogo,estado:rec.estado}:null},
  sustituye:anterior,estado:'preparado',historial:[{estado:'preparado',fecha:now()}]};
 guardar(e);
 if(anterior){const af=path.resolve(ant)+'.estado.json',A=leer(af);A.sustituidoPor=e.id;A.historial.push({estado:'sustituido',fecha:now(),por:e.id});fs.writeFileSync(af,JSON.stringify(A,null,1));}
 out(0,{accion,hecho:true,id:e.id,estado:e.estado,sustituye:anterior?.id||null});}
// ---------------------------------------------------------------- verificar (integridad y vigencia, por separado)
const verificar=()=>{const e=estadoActual();if(!e)out(2,{accion,hecho:false,motivo:'No hay candidato preparado.'});
 const v=spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),'--zip',DIR+'.zip','--digest',DIR+'.digest.json'],{encoding:'utf8'});
 const vf=fs.existsSync(DIR)?spawnSync('node',[path.join(__dirname,'verificar-entrega.cjs'),DIR],{encoding:'utf8'}):{status:3};
 const zipNow=fs.existsSync(DIR+'.zip')?shaF(DIR+'.zip'):null,dig=leer(DIR+'.digest.json');
 const integra=v.status===0&&vf.status===0&&zipNow===e.congelado.zipSha256&&dig?.manifestSha256===e.congelado.manifestSha256;
 const F=fuentes(),vigente=F.snapshotSha256===e.congelado.snapshotSha256&&F.registroSha256===e.congelado.registroSha256;
 const estado=!integra?'invalido':vigente?'verificado':'verificado-desactualizado';
 const motivo=[...(!integra?['Los bytes no coinciden con lo congelado o el verificador los rechaza.',...(JSON.parse(v.stdout||'{}').errores||[]).slice(0,4)]:[]),
  ...(integra&&!vigente?['Íntegro, pero las fuentes han cambiado desde que se preparó: no es la versión vigente. Preparar un candidato nuevo.']:[])];
 return {e,estado,integra,vigente,motivo};};
if(accion==='verificar'){const r=verificar();r.e.estado=r.estado;r.e.historial.push({estado:r.estado,fecha:now(),integra:r.integra,vigente:r.vigente});guardar(r.e);
 out(r.estado==='verificado'?0:2,{accion,hecho:r.estado==='verificado',id:r.e.id,estado:r.estado,integridad:r.integra?'íntegro':'alterado',vigencia:r.vigente?'vigente':'desactualizado',motivo:r.motivo});}
// ---------------------------------------------------------------- emitir (solo simulación rotulada)
if(accion==='emitir'){
 if(!sim)out(2,{accion,hecho:false,motivo:'La emisión real a un cliente no está autorizada en esta misión. Solo existe la simulación rotulada (--simulacion "motivo").'});
 const r=verificar();
 if(r.e.historial.some(h=>h.estado==='emitido-simulado'))out(2,{accion,hecho:false,motivo:'Este candidato ya tiene una emisión (simulada). Otra emisión exige un candidato nuevo que lo sustituya.'});
 if(r.e.sustituidoPor)out(2,{accion,hecho:false,motivo:`Sustituido por ${r.e.sustituidoPor}: no se emite.`});
 if(r.e.congelado.modo!=='cliente')out(2,{accion,hecho:false,motivo:'Un borrador no se emite.'});
 if(r.estado!=='verificado')out(2,{accion,hecho:false,estado:r.estado,motivo:['Solo se emite un candidato verificado y vigente.',...r.motivo]});
 r.e.estado='emitido-simulado';r.e.historial.push({estado:'emitido-simulado',fecha:now(),rotulo:'SIMULACIÓN DE LABORATORIO: no se ha enviado nada a ningún cliente; no hay aceptación ni firma.',motivo:sim});guardar(r.e);
 out(0,{accion,hecho:true,id:r.e.id,estado:r.e.estado,rotulo:'SIMULACIÓN DE LABORATORIO'});}
