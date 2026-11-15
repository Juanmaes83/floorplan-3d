'use strict';
/* Ejecuta el protocolo de validación C (docs/product/assistant-ai-v3/eval/questions.json).
   Por defecto: SIMULADORES rotulados (sin red, sin modelo, sin gasto). Valida el ARNÉS, no la comprensión.
     node scripts/qa/assistant-eval.cjs                 → simulador de referencia + simulador defectuoso
   Modo real: BLOQUEADO salvo GO expreso y separado del propietario. Aun con GO, no llama al proveedor directamente: habla
   con la pasarela /api/assistant de un Preview, que aplica sus puertas, tope de gasto, disyuntor y libro común.
     ASSISTANT_EVAL_GO=GO-<ref> ASSISTANT_EVAL_ENDPOINT=https://<preview>/api/assistant ASSISTANT_EVAL_CODE=<código>
     node scripts/qa/assistant-eval.cjs --real
   Se niega en CI, sin GO con formato válido, con un endpoint que no sea https de un Preview *.vercel.app, o sin código. */
const fs=require('node:fs'),path=require('node:path');
const E=require('./assistant-eval-core.cjs'),A=require('../../js/assistant-agent-core.js');
const protocol=JSON.parse(fs.readFileSync(path.join(__dirname,'../../docs/product/assistant-ai-v3/eval/questions.json'),'utf8'));
function realGuard(env,argv){
 if(!argv.includes('--real'))return {real:false};
 const why=[];if(env.CI)why.push('CI');if(!/^GO-[A-Z0-9][A-Z0-9-]{3,40}$/.test(env.ASSISTANT_EVAL_GO||''))why.push('sin GO del propietario (ASSISTANT_EVAL_GO=GO-<ref>)');
 let u=null;try{u=new URL(env.ASSISTANT_EVAL_ENDPOINT||'');}catch{}
 if(!u||u.protocol!=='https:'||!/\.vercel\.app$/.test(u.hostname)||u.pathname!=='/api/assistant')why.push('endpoint no es https://<preview>.vercel.app/api/assistant');
 if(!env.ASSISTANT_EVAL_CODE||env.ASSISTANT_EVAL_CODE.length<32)why.push('sin código de acceso');
 return why.length?{real:true,refused:why}:{real:true,endpoint:u.href,code:env.ASSISTANT_EVAL_CODE,go:env.ASSISTANT_EVAL_GO};}
async function main(env=process.env,argv=process.argv.slice(2)){
 const g=realGuard(env,argv);
 if(g.refused){console.error(JSON.stringify({refused:true,reasons:g.refused,note:'NO MERGE · NO PRODUCTION · STOP_GASTO: la prueba real exige un GO separado.'}));return 2;}
 if(!g.real){const out={};for(const k of ['reference','faulty']){const r=await E.run({protocol,adapterFor:E.simulator(k)});out[k]={passed:r.passed,items:r.items,metrics:r.metrics,undetected:k==='faulty'?r.results.filter(x=>x.pass).map(x=>x.id):undefined};}
  const valid=out.reference.passed===out.reference.items&&out.faulty.undetected.length===0;
  console.log(JSON.stringify({mode:'simulated (labelled test doubles — NOT AI)',harnessValid:valid,...out},null,1));return valid?0:1;}
 const adapterFor=()=>A.httpAdapter({fetch:globalThis.fetch,endpoint:g.endpoint,accessCode:()=>g.code,consent:()=>({question:true,projectData:true}),conversationId:'eval_'+g.go.toLowerCase()+'_'+Date.now().toString(36)});
 const r=await E.run({protocol,adapterFor});
 console.log(JSON.stringify({mode:'real (through the gateway)',go:g.go,endpoint:new URL(g.endpoint).hostname,...r},null,1));return 0;}
if(require.main===module)main().then(c=>process.exit(c));
module.exports={main,realGuard};
