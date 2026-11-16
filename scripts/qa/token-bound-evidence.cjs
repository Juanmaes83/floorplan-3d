'use strict';
// Evidencia local SIN GASTO de la hipótesis H-TOK (api/assistant.js · inputTokenBound): cuenta los tokens reales del
// cuerpo enviado con los tokenizadores públicos de OpenAI (o200k_base, cl100k_base; paquete js-tiktoken, sin red al
// proveedor) y los compara con la cota reservada. Uso: NODE_PATH=<dir con js-tiktoken> node scripts/qa/token-bound-evidence.cjs
// No forma parte de la CI (dependencia opcional); la prueba de vigilancia real es el disyuntor del servidor.
const API=require('../../api/assistant.js'),Agent=require('../../js/assistant-agent-core.js');
const {getEncoding}=require('js-tiktoken');const enc={o200k:getEncoding('o200k_base'),cl100k:getEncoding('cl100k_base')};
const cases={
 'ES realista':'Estoy diseñando un salón para un cliente: revisa la distribución y dime qué mejorarías y cuánto supondría el sofá de Mis catálogos.',
 'ZH 客厅':'我正在为客户设计客厅：请检查布局，告诉我需要改进什么，以及目录中的沙发要花多少钱。'.repeat(40),
 'emoji ZWJ':'🛋️👨‍👩‍👧‍👦🏳️‍🌈'.repeat(300),'escapes':'"\\\n\t\u0000'.repeat(500),'dígitos':'1234567890'.repeat(800),'espacios':' '.repeat(6000),'raros':'ﷺ𒐫꧅'.repeat(500),
 'historial 8 turnos':null};
const rows=[];
for(const [name,text] of Object.entries(cases)){
 let msgs;if(text===null){msgs=[];for(let i=0;i<8;i++){msgs.push({role:'user',content:'¿Y la estancia '+i+'? 预算 🧱'});msgs.push({role:'assistant',content:null,tool_calls:[{id:'c'+i,type:'function',function:{name:'get_room',arguments:JSON.stringify({roomId:'rom_'+i})}}]});msgs.push({role:'tool',tool_call_id:'c'+i,name:'get_room',content:JSON.stringify({ok:true,data:{name:'Salón «'+i+'» 客厅',areaM2:20+i,objects:Array.from({length:30},(_,k)=>({id:'obj_'+k,name:'Silla '+k}))}})});}msgs.push({role:'user',content:'Resume.'});}
 else msgs=[{role:'user',content:text}];
 const pb=API.providerBody({model:'m',maxOut:800},Agent.NAMES.slice(),msgs,{area:'design',lang:'es'}),json=JSON.stringify(pb),bound=API.inputTokenBound(pb);
 const t={o200k:enc.o200k.encode(json).length,cl100k:enc.cl100k.encode(json).length},old=Math.ceil(json.length/3)+200;
 rows.push({caso:name,bytes:Buffer.byteLength(json,'utf8'),cota:bound,o200k:t.o200k,cl100k:t.cl100k,margen:+(bound/Math.max(t.o200k,t.cl100k)).toFixed(2),heuristicaAnterior:old,anteriorCubria:old>=Math.max(t.o200k,t.cl100k)});}
console.table(rows);const ok=rows.every(r=>r.cota>=r.o200k&&r.cota>=r.cl100k);console.log(JSON.stringify({ok,minMargen:Math.min(...rows.map(r=>r.margen)),heuristicaAnteriorFalla:rows.filter(r=>!r.anteriorCubria).map(r=>r.caso)}));process.exit(ok?0:1);
