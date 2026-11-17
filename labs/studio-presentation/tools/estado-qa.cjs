// v1.4 · N05 · QA DE ESTADOS (RP-Q07). Sobre candidatos REALES exportados con una receta (RP05), en una carpeta temporal.
// Uso: node tools/estado-qa.cjs [dirTrabajo]  → evidence/estados/estado-qa.json
'use strict';
const fs=require('fs'),path=require('path'),os=require('os'),{spawnSync}=require('child_process');
const LAB=path.resolve(__dirname,'..'),EV=path.join(LAB,'evidence/estados');fs.mkdirSync(EV,{recursive:true});
const W=path.resolve(process.argv[2]||fs.mkdtempSync(path.join(os.tmpdir(),'rubik-estados-')));fs.rmSync(W,{recursive:true,force:true});fs.mkdirSync(W,{recursive:true});
const ACK='Identidad del estudio,Presupuesto revisado,Imágenes IA,Plan de obra';
const casos=[];const caso=(id,ok,d)=>{casos.push({id,ok:!!ok,detalle:d});console.log(`${ok?'PASS':'FAIL'} ${id}${ok?'':' · '+JSON.stringify(d).slice(0,300)}`);};
const node=(args,env={})=>{const r=spawnSync('node',args,{encoding:'utf8',env:{...process.env,...env}});let j=null;try{j=JSON.parse(r.stdout);}catch{}return {code:r.status,j,out:r.stdout};};
const st=(acc,dir,extra=[],env)=>node([path.join(__dirname,'estado-entrega.cjs'),acc,dir,...extra],env);
const exp=(name,modo='cliente')=>node([path.join(__dirname,'receta-exportar.cjs'),'RP05','es',path.join(W,name),'--modo',modo,'--reconocer',ACK]);
const leer=f=>JSON.parse(fs.readFileSync(f,'utf8'));
// candidato A
const A=path.join(W,'cand-a');let r=exp('cand-a');caso('E-exportado',r.code===0,r.out.slice(0,200));
r=st('verificar',A);caso('E-sin-preparar-no-verifica',r.code===2,r.j);
r=st('preparar',A);caso('E-preparado',r.code===0&&r.j.estado==='preparado',r.j);
const e0=leer(A+'.estado.json');caso('E-congela-receta-y-huellas',e0.congelado.receta?.key==='RP05'&&/^[0-9a-f]{64}$/.test(e0.congelado.zipSha256)&&/^[0-9a-f]{64}$/.test(e0.congelado.snapshotSha256),e0.congelado);
caso('E-registro-fuera-del-zip',!spawnSync('unzip',['-Z1',A+'.zip'],{encoding:'utf8'}).stdout.includes('estado.json'),'');
r=st('preparar',A);caso('E-no-se-reprepara',r.code===2,r.j);
r=st('verificar',A);caso('E-verificado',r.code===0&&r.j.estado==='verificado'&&r.j.vigencia==='vigente',r.j);
for(const x of ['firmar','aceptar','certificar','ejecutar']){r=st(x,A);caso('E-nunca-'+x,r.code===2&&!r.j.hecho,r.j);}
r=st('emitir',A);caso('E-emision-real-rechazada',r.code===2,r.j);
r=st('emitir',A,['--simulacion','QA de laboratorio']);caso('E-emitido-simulado-rotulado',r.code===0&&r.j.estado==='emitido-simulado'&&/SIMULACIÓN/.test(r.j.rotulo),r.j);
r=st('emitir',A,['--simulacion','otra vez']);caso('E-doble-emision-rechazada',r.code===2,r.j);
const hist=leer(A+'.estado.json').historial.map(h=>h.estado);caso('E-historial',JSON.stringify(hist)===JSON.stringify(['preparado','verificado','emitido-simulado']),hist);
// vigencia frente a integridad: fuentes cambiadas (copia de la entrega con el registro alterado) → íntegro pero desactualizado
const SRC2=path.join(W,'entrega-cambiada');fs.cpSync(path.join(LAB,'out/v3/entrega'),SRC2,{recursive:true});
const reg=leer(path.join(SRC2,'entrega.json'));reg.generated='2026-11-18T00:00:00.000Z';fs.writeFileSync(path.join(SRC2,'entrega.json'),JSON.stringify(reg,null,1));
const B=path.join(W,'cand-b');exp('cand-b');st('preparar',B);
r=st('verificar',B,[],{ENTREGA_SRC:SRC2});caso('E-integro-pero-desactualizado',r.code===2&&r.j.estado==='verificado-desactualizado'&&r.j.integridad==='íntegro',r.j);
r=st('emitir',B,['--simulacion','QA'],{ENTREGA_SRC:SRC2});caso('E-desactualizado-no-se-emite',r.code===2,r.j);
// bytes alterados: un byte del ZIP; y términos alterados en la carpeta (manifiesto)
const C=path.join(W,'cand-c');exp('cand-c');st('preparar',C);const z=fs.readFileSync(C+'.zip');z[z.length-30]^=1;fs.writeFileSync(C+'.zip',z);
r=st('verificar',C);caso('E-zip-alterado-invalido',r.code===2&&r.j.estado==='invalido',r.j);
const D=path.join(W,'cand-d');exp('cand-d');st('preparar',D);const mf=path.join(D,'LEEME.txt');fs.appendFileSync(mf,'\nCondición añadida después.');
r=st('verificar',D);caso('E-terminos-alterados-invalido',r.code===2&&r.j.estado==='invalido',r.j);
// sustitución: el nuevo enlaza al anterior; el anterior conserva sus bytes y no se vuelve a emitir
const E=path.join(W,'cand-e');exp('cand-e');const zA=leer(A+'.estado.json').congelado.zipSha256;
r=st('sustituir',E,['--anterior',A]);caso('E-sustituye',r.code===0&&r.j.sustituye===path.basename(A),r.j);
const eA=leer(A+'.estado.json');caso('E-anterior-intacto-y-enlazado',eA.sustituidoPor===path.basename(E)&&eA.congelado.zipSha256===zA&&require('crypto').createHash('sha256').update(fs.readFileSync(A+'.zip')).digest('hex')===zA,eA.historial);
r=st('sustituir',path.join(W,'cand-b'),['--anterior',A]);caso('E-doble-sustitucion-rechazada',r.code===2,r.j);
// un borrador no se emite
const F=path.join(W,'cand-f');exp('cand-f','borrador');st('preparar',F);st('verificar',F);r=st('emitir',F,['--simulacion','QA']);caso('E-borrador-no-se-emite',r.code===2&&/borrador/i.test(JSON.stringify(r.j)),r.j);
const res={schema:'rubik-lab-estado-qa/1',fecha:new Date().toISOString(),total:casos.length,pass:casos.filter(c=>c.ok).length,casos};
fs.writeFileSync(path.join(EV,'estado-qa.json'),JSON.stringify(res,null,1));console.log(`${res.pass}/${res.total}`);process.exit(casos.every(c=>c.ok)?0:1);
