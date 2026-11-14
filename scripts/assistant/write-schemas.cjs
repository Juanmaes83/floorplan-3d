#!/usr/bin/env node
/* Genera docs/contracts/assistant-v1/*.schema.json a partir de RubikAssistantContracts (las MISMAS listas de claves,
   obligatorias y enumeraciones que usa el validador). `--check` no escribe: falla si algún archivo publicado difiere,
   y así la prueba impide que el esquema y el código diverjan. Uso: node scripts/assistant/write-schemas.cjs [--check] */
'use strict';
const fs=require('node:fs'),path=require('node:path');
const K=require('../../js/assistant-contracts.js');
const OUT=path.join(__dirname,'../../docs/contracts/assistant-v1');
const id={type:'string',minLength:1,maxLength:K.LIMITS.id,pattern:'^[A-Za-z0-9_.:-]+$'};
const iso={type:'string',format:'date-time',maxLength:40};
const text={type:'string',maxLength:K.LIMITS.text};
const label={type:'string',maxLength:K.LIMITS.label};
const rev={type:'string',maxLength:K.LIMITS.id};
const FIELDS={
 version:{const:K.VERSION},id,role:{enum:[...K.ROLES]},text,at:iso,area:{enum:[...K.AREAS]},projectId:id,revision:rev,
 toolCallIds:{type:'array',maxItems:K.LIMITS.tools,items:id},proposalId:id,mode:{enum:[...K.MODES]},
 tool:id,args:{type:'object',maxProperties:6},idempotencyKey:id,
 callId:id,ok:{type:'boolean'},data:{},limitations:{type:'array',maxItems:20,items:text},
 provenance:{type:'object',additionalProperties:false,required:['source'],properties:{source:label,projectId:id,revision:{type:['string','null'],maxLength:K.LIMITS.id},status:{enum:[...K.MEASURE]},engine:label,asOf:{type:['string','null']},budgetId:{type:['string','null']}}},
 error:{type:'object',required:['code','message'],properties:{code:{enum:[...K.ERRORS]},message:text}},
 operation:{enum:[...K.OPERATIONS]},params:{type:'object',description:'set_room_floor_material: {roomId, materialId}; move_object: {objectId, dxMm?, dyMm?, rotationDeg?} (enteros; ±20 000 mm; 0–359°).'},
 baseRevision:rev,state:{enum:[...K.PROPOSAL_STATES]},
 diff:{type:'array',maxItems:40,items:{type:'object',additionalProperties:false,required:['path'],properties:{path:label,before:{},after:{},label:{type:'string'}}}},
 warnings:{type:'array',maxItems:40},conflicts:{type:'array',maxItems:40},alternatives:{type:'array',maxItems:40},explanation:text,createdAt:iso,
 runId:id,intent:id,tools:{type:'array',maxItems:K.LIMITS.tools,items:id},providerCalls:{type:'integer',minimum:0},
 cost:{type:'object',additionalProperties:false,required:['estimatedUsd','billedUsd','basis'],properties:{estimatedUsd:{type:['number','null']},billedUsd:{type:['number','null']},basis:label},description:'Desconocido = null, nunca 0 por omisión. Sin llamadas al proveedor, exactamente 0.'},
 durationMs:{type:'integer',minimum:0},
 generatedAt:iso,operations:{type:'array',maxItems:60,items:{type:'object',additionalProperties:false,required:['id','kind','state','writes','preview','costUnknown','confirmation'],properties:{id,kind:{enum:['read','proposal','visual','advanced']},state:{enum:[...K.CAP_STATES]},writes:{type:'boolean'},preview:{type:'boolean'},costUnknown:{type:'boolean'},confirmation:{enum:['none','per-action','per-generation']},owner:label,reason:text,source:label}}},
 provider:{type:'object',additionalProperties:false,required:['enabled','mode'],properties:{enabled:{type:'boolean'},mode:{enum:[...K.MODES]},reason:text}}
};
function schema(name){
 const s=K.SHAPES[name];const props={};for(const k of s.allowed){if(!(k in FIELDS))throw Error(`${name}.${k}: sin definición de campo`);props[k]=FIELDS[k];}
 return {$schema:'https://json-schema.org/draft/2020-12/schema',$id:`https://rubik-sota.example/contracts/assistant-v1/${name}.schema.json`,
  title:name,description:`Contrato ${name} v${K.VERSION} del Asistente IA RUBIK. Generado por scripts/assistant/write-schemas.cjs desde js/assistant-contracts.js: no editar a mano.`,
  type:'object',additionalProperties:false,required:[...s.required],properties:props};
}
const check=process.argv.includes('--check');let bad=0;
if(!check)fs.mkdirSync(OUT,{recursive:true});
for(const name of Object.keys(K.SHAPES)){
 const file=path.join(OUT,name+'.schema.json'),body=JSON.stringify(schema(name),null,2)+'\n';
 if(check){const cur=fs.existsSync(file)?fs.readFileSync(file,'utf8'):null;if(cur!==body){console.error('difiere: '+path.relative(process.cwd(),file));bad++;}}
 else fs.writeFileSync(file,body);
}
if(bad)process.exit(1);
console.log(check?'esquemas al día':'esquemas escritos en '+path.relative(process.cwd(),OUT));
