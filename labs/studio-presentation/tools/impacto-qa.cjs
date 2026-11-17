// v1.4 §11 · negativos del verificador del mapa de impacto: dependencia inexistente, archivo cambiado, evidencia obsoleta.
'use strict';
const fs=require('fs'),os=require('os'),path=require('path'),{spawnSync}=require('child_process');const LAB=path.resolve(__dirname,'..');
const M=JSON.parse(fs.readFileSync(path.join(LAB,'evidence/impacto/mapa.json'),'utf8'));const W=fs.mkdtempSync(path.join(os.tmpdir(),'imp-'));
const run=(m,n)=>{const f=path.join(W,n+'.json');fs.writeFileSync(f,JSON.stringify(m));const r=spawnSync('node',[path.join(__dirname,'verificar-impacto.cjs'),f],{encoding:'utf8'});return {code:r.status,o:JSON.parse(r.stdout)};};
const c=o=>JSON.parse(JSON.stringify(o));const cases=[];const add=(id,ok,d)=>{cases.push({id,result:ok?'PASS':'FAIL',detalle:d});console.log(ok?'PASS':'FAIL',id);};
{const r=run(M,'ok');add('I-00 mapa vigente',r.code===0,r.o);}
{const m=c(M);m.dependenciasComunes['tools/no-existe.cjs']={sha256:'0'.repeat(64),bytes:1};const r=run(m,'a');add('I-01 dependencia inexistente',r.code===3&&r.o.errores.some(e=>/inexistente/.test(e)),r.o.errores);}
{const m=c(M);const k=Object.keys(m.dependenciasComunes)[0];m.dependenciasComunes[k].sha256='f'.repeat(64);const r=run(m,'b');add('I-02 archivo cambiado',r.code===3&&r.o.errores.some(e=>/cambiado/.test(e)),r.o.errores);}
{const m=c(M);m.identidad.registroSha256='1'.repeat(64);const r=run(m,'c');add('I-03 evidencia e identidad obsoletas',r.code===3&&r.o.errores.some(e=>/obsoleta/.test(e)),r.o.errores.slice(0,3));}
{const m=c(M);const g=Object.keys(m.gates)[0];m.gates[g].pruebas.push('tools/prueba-fantasma.cjs');const r=run(m,'d');add('I-04 prueba citada inexistente',r.code===3,r.o.errores.slice(0,2));}
const out={schema:'rubik-lab-impacto-qa/1',pass:cases.filter(x=>x.result==='PASS').length,fail:cases.filter(x=>x.result==='FAIL').length,cases,nota:'El mapa no autoriza omitir CI.'};
fs.writeFileSync(path.join(LAB,'evidence/impacto/impacto-qa.json'),JSON.stringify(out,null,1));fs.rmSync(W,{recursive:true,force:true});console.log(out.pass+'/'+cases.length);process.exit(out.fail?1:0);
