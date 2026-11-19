/* RUBIK · Asistente IA V2 · AG-2 (propuestas tipadas, sin escritura) y núcleo de AG-3 (aplicar revalidando).
   Cadena: parseIntent (en assistant-intents-core) → plan(operación tipada) → validar contra el proyecto en una COPIA →
   diff legible → [la persona confirma] → apply(proyecto vigente, propuesta) → un solo paso del commit del editor.
   Una instrucción, venga de una persona o de un modelo, es SOLO un dato que se valida aquí: operaciones cerradas,
   IDs que deben existir, enteros acotados y revisión base. Dos operaciones en V2:
     · set_room_floor_material {roomId, materialId}: el material debe existir ya en project.materials (categoría suelo).
     · move_object {objectId, dxMm, dyMm, rotationDeg?}: misma validación que la colocación del editor
       (FloorPlanPlacement.problemsIn: estancia, muros, barrido de puertas, escalera, muebles) más la revisión exacta
       del conjunto (FloorPlanLayoutReview). Solo se rechazan conflictos NUEVOS: un hallazgo que ya existía en la pose
       original no bloquea moverlo, porque moverlo no lo empeora.
   Nada de esto escribe: `plan` y `apply` reciben el proyecto y devuelven uno nuevo (o un rechazo con su motivo); el
   proyecto de entrada no cambia nunca. Las extensiones x- (R03, R02-A…) y todo lo que no sea el campo afectado se
   conservan byte a byte; una prueba lo comprueba.
   UMD: window.RubikAssistantProposals / module.exports. */
(function(root,factory){
 const deps=typeof module==='object'&&module.exports?{C:require('./project-core.js'),P:require('./furniture-placement.js'),R:require('./layout-review.js'),K:require('./assistant-contracts.js'),T:require('./assistant-domain-tools-core.js'),V:require('./proposal-core.js')}
  :{C:root.FloorPlanCore,P:root.FloorPlanPlacement,R:root.FloorPlanLayoutReview,K:root.RubikAssistantContracts,T:root.RubikAssistantDomainTools,V:root.RubikProposalCore};
 const api=factory(deps);if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantProposals=api;
})(typeof self!=='undefined'?self:this,function(deps){
 'use strict';
 const {C,P,R,K,T,V}=deps;
 const clone=x=>JSON.parse(JSON.stringify(x));
 const now=()=>new Date().toISOString();
 let seq=0;const nextId=()=>'prop_'+Date.now().toString(36)+'_'+(++seq).toString(36);
 const reject=(code,message,extra={})=>({ok:false,error:{code,message},...extra});
 const blocking=f=>f.code==='solape'||f.code==='puerta'||f.code==='escalera';
 const findingKey=f=>f.code+':'+[...(f.objects||[])].sort().join('|');
 // Problems of one pose, as stable keys, to tell new conflicts from pre-existing ones.
 function poseProblems(project,obj){
  const sc=P.scene(project,{ignoreIds:[obj.id]});
  const at=P.roomsAt(sc,obj.position),roomId=at.length===1?at[0].id:null;
  const list=P.problemsIn(sc,obj,roomId,P.TOLERANCE_MM,false);
  if(at.length!==1)list.push({kind:'room',detail:'Su centro no queda dentro de una única estancia.'});
  return {roomId,list,keys:new Set(list.map(p=>p.kind+':'+(p.id||'')))};
 }
 function validateParams(operation,params){
  const probe={version:K.VERSION,id:'prop_probe',operation,params,baseRevision:'rv1-probe',projectId:'prj_probe',state:'proposed',diff:[]};
  return K.proposal(probe);
 }
 // Simulate one typed operation on a copy. Returns {ok, proposal, project} or a closed rejection; never mutates `project`.
 const tx=(lang,es,en,zh)=>({es,en,zh})[['es','en','zh'].includes(lang)?lang:'es'];
 function moveLabel(dx,dy,lang){const part=(v,neg,pos)=>v?`${Math.abs(v)} mm ${v<0?neg:pos}`:'';
  return [part(dx,tx(lang,'a la izquierda','left','向左'),tx(lang,'a la derecha','right','向右')),part(dy,tx(lang,'hacia arriba','up','向上'),tx(lang,'hacia abajo','down','向下'))].filter(Boolean).join(', ')+tx(lang,' en el plano',' on the plan','（平面图）');}
 function plan(project,operation,params,{materialLabel=id=>id??'—',objectLabel=o=>o.name||o.id,roomLabel=r=>r.name||r.id,lang='es'}={}){
  if(!K.OPERATIONS.includes(operation))return reject('not_authorized','Operación no permitida.');
  const v=validateParams(operation,params);if(!v.ok)return reject(v.error.code,v.error.message);
  const base=T.revision(project),next=clone(project),diff=[],warnings=[],alternatives=[];
  if(operation==='set_room_floor_material'){
   const room=next.rooms.find(r=>r.id===params.roomId);if(!room)return reject('not_found','Estancia no encontrada.');
   const mat=(next.materials||[]).find(m=>m.id===params.materialId);
   if(!mat){const floors=(next.materials||[]).filter(m=>m.category==='floor').map(m=>m.id);return reject('not_found','Ese material no existe en este proyecto.',{alternatives:floors.slice(0,12)});}
   if(mat.category&&mat.category!=='floor')return reject('conflict','Ese material no es de suelo.');
   if(room.floorMaterialId===mat.id)return reject('conflict','La estancia ya tiene ese suelo.');
   diff.push({path:`rooms[${room.id}].floorMaterialId`,before:room.floorMaterialId??null,after:mat.id,label:`${roomLabel(room)}: ${materialLabel(room.floorMaterialId)} → ${materialLabel(mat.id)}`});
   room.floorMaterialId=mat.id;
   warnings.push(tx(lang,'Cambia el acabado de suelo: las cantidades por material y el borrador de presupuesto se recalculan con el nuevo suelo.','Changes the floor finish: quantities per material and the draft budget are recalculated with the new floor.','更改地面材料：按材料的工程量和预算草稿将按新地面重新计算。'));
  }else{
   const obj=next.objects.find(o=>o.id===params.objectId);if(!obj)return reject('not_found','Mueble no encontrado.');
   const dx=params.dxMm??0,dy=params.dyMm??0,rot=params.rotationDeg??obj.rotationDeg;
   if(!dx&&!dy&&rot===obj.rotationDeg)return reject('conflict','La propuesta no cambia nada.');
   const before=poseProblems(project,project.objects.find(o=>o.id===obj.id));
   const moved={...clone(obj),position:{x:Math.round(obj.position.x+dx),y:Math.round(obj.position.y+dy)},rotationDeg:rot};
   const after=poseProblems(project,moved);
   const conflicts=after.list.filter(p=>!before.keys.has(p.kind+':'+(p.id||''))).map(p=>({kind:p.kind,id:p.id||null,detail:p.detail}));
   if(conflicts.length)return reject('conflict','La nueva posición no es válida: '+conflicts.map(c=>c.detail).join(' '),{conflicts});
   const prev={x:obj.position.x,y:obj.position.y,r:obj.rotationDeg};
   obj.position=moved.position;obj.rotationDeg=rot;
   if('roomId' in obj&&after.roomId&&obj.roomId!==after.roomId){diff.push({path:`objects[${obj.id}].roomId`,before:obj.roomId,after:after.roomId,label:`${objectLabel(obj)}: ${tx(lang,'cambia de estancia','changes room','更换房间')}`});obj.roomId=after.roomId;}
   // Exact set review (the same guard as UX-12 apply): no NEW overlap, door-leaf or stair finding with this object.
   const was=new Set(R.review(project).findings.filter(blocking).filter(f=>(f.objects||[]).includes(obj.id)).map(findingKey));
   const now2=R.review(next).findings.filter(blocking).filter(f=>(f.objects||[]).includes(obj.id)&&!was.has(findingKey(f)));
   if(now2.length)return reject('conflict','La revisión del conjunto encuentra un conflicto nuevo: '+now2.map(f=>f.message).join(' '),{conflicts:now2.map(f=>({kind:f.code,id:(f.objects||[]).find(id=>id!==obj.id)||null,detail:f.message}))});
   diff.unshift({path:`objects[${obj.id}].position`,before:{x:prev.x,y:prev.y},after:{...obj.position},label:`${objectLabel(obj)}: ${moveLabel(dx,dy,lang)}`});
   if(rot!==prev.r)diff.push({path:`objects[${obj.id}].rotationDeg`,before:prev.r,after:rot,label:`${objectLabel(obj)}: ${tx(lang,'giro','rotation','旋转')} ${prev.r}° → ${rot}°`});
   if(before.list.length)warnings.push(tx(lang,'El mueble ya tenía avisos en su posición original; la propuesta no los empeora.','The item already had warnings in its original position; the proposal does not make them worse.','该家具原位置已有提示；此建议不会使其更糟。'));
  }
  try{C.validate(next);}catch(e){return reject('conflict','El resultado no cumple el contrato del proyecto: '+String(e.message).slice(0,200));}
  const proposal={version:K.VERSION,id:nextId(),operation,params:clone(params),baseRevision:base,projectId:project.id,state:'proposed',diff,warnings,conflicts:[],alternatives,createdAt:now()};
  const check=K.proposal(proposal);if(!check.ok)return reject('internal','Propuesta mal formada: '+check.error.message);
  return {ok:true,proposal,project:next};
 }
 // AG-3 core: re-plan on the CURRENT project (no stored copy is trusted) and refuse when the base revision moved.
 function apply(project,proposal){
  const v=K.proposal(proposal);if(!v.ok)return reject(v.error.code,v.error.message);
  if(proposal.projectId!==project.id)return reject('not_authorized','La propuesta es de otro proyecto.');
  if(proposal.state!=='proposed'&&proposal.state!=='confirmed')return reject('conflict','La propuesta ya no está pendiente.');
  // K13: la vigencia la decide el contrato común (ProposalV1); el código público sigue siendo revision_mismatch.
  const fresh=V.checkFresh({kind:'revision',value:proposal.baseRevision},T.revision(project));
  if(!fresh.ok)return reject(fresh.legacyCode,'El proyecto ha cambiado desde la propuesta: genera una nueva.');
  const r=plan(project,proposal.operation,proposal.params);if(!r.ok)return r;
  return {ok:true,project:r.project,diff:r.proposal.diff};
 }
 // K13: la misma propuesta vista con el contrato común (no cambia AssistantProposalV1).
 const toProposalV1=proposal=>V.fromAssistant(proposal);
 return Object.freeze({plan,apply,toProposalV1});
});
