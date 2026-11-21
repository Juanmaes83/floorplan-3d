/* RUBIK · Asistente IA V2: una «vuelta» completa del asistente, pura y determinista.
   handle(texto, ctx) → interpreta (RubikAssistantIntents) → llama SOLO a herramientas de la lista blanca
   (RubikAssistantDomainTools) o planifica una propuesta tipada (RubikAssistantProposals) → redacta la respuesta con
   las cifras de esas herramientas → devuelve mensajes AssistantMessageV1, la propuesta (si la hay) y la auditoría
   AssistantRunAuditV1 de la ejecución. Nunca muta ctx.project ni llama a la red: aplicar es un paso aparte (la persona
   confirma y la interfaz usa FloorPlanApp.applyAssistant).
   ctx: {project, budget?, budgetSaved?, levels?, selection?, area?, lang?, labels:{rooms,objects,materials}, caps?}
   UMD: window.RubikAssistantSession / module.exports. */
(function(root,factory){
 const deps=typeof module==='object'&&module.exports?{K:require('./assistant-contracts.js'),T:require('./assistant-domain-tools-core.js'),I:require('./assistant-intents-core.js'),S:require('./assistant-proposals-core.js'),RT:require('./assistant-runtime-core.js')}
  :{K:root.RubikAssistantContracts,T:root.RubikAssistantDomainTools,I:root.RubikAssistantIntents,S:root.RubikAssistantProposals,RT:root.RubikAssistantRuntime};
 const api=factory(deps);if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantSession=api;
})(typeof self!=='undefined'?self:this,function(deps){
 'use strict';
 const {K,T,I,S,RT}=deps;
 let seq=0;const uid=p=>p+'_'+Date.now().toString(36)+'_'+(++seq).toString(36);
 const tx=(lang,es,en,zh)=>({es,en,zh})[['es','en','zh'].includes(lang)?lang:'es'];
 const defined=o=>Object.fromEntries(Object.entries(o).filter(([,v])=>v!==undefined&&v!==null));
 const msg=(role,text,extra={})=>({version:K.VERSION,id:uid('msg'),role,text:String(text).slice(0,K.LIMITS.text),at:new Date().toISOString(),...defined(extra)});
 const ents=(map={})=>Object.entries(map).map(([id,labels])=>({id,labels:Array.isArray(labels)?labels:[labels]}));
 const first=(map,id)=>{const v=(map||{})[id];return Array.isArray(v)?v[0]:v||id;};
 function examples(lang){return tx(lang,
  ['¿Cuántas estancias hay?','¿Qué superficie tiene el salón?','¿Qué datos faltan?','¿Qué conflictos tiene la distribución?','¿Cuánto cuesta?','Cambia el suelo del salón a madera','Mueve el sofá 20 cm a la izquierda'],
  ['How many rooms are there?','What is the area of the living room?','What data is missing?','What conflicts does the layout have?','How much does it cost?','Change the living room floor to wood','Move the sofa 20 cm left'],
  ['有几个房间？','客厅面积多少？','缺少哪些数据？','布局有什么冲突？','预算多少钱？','把客厅地面换成木地板','把沙发向左移动20厘米']);}
 function handle(text,ctx){
  const t0=Date.now(),lang=ctx.lang||'es',project=ctx.project,labels=ctx.labels||{};
  const base={projectId:project?.id,revision:project?T.revision(project):undefined};
  const call=(tool,args={})=>T.execute(tool,args,{project,lang,labels,budget:ctx.budget,budgetSaved:ctx.budgetSaved,levels:ctx.levels,expectedProjectId:project?.id,catalog:ctx.catalog,catalogReport:ctx.catalogReport,visualRefs:ctx.visualRefs},uid('call'));
  const intent=I.parse(text,{rooms:ents(labels.rooms),objects:ents(labels.objects),materials:ents(labels.materials),products:ents(labels.products),objectProduct:labels.objectProduct||{},selection:ctx.selection||null});
  const user=msg('user',text,{area:ctx.area,...base,mode:'deterministic'});
  const done=(replyText,extra={},tools=[],error)=>{
   const reply=msg('assistant',replyText,{area:ctx.area,...base,mode:'deterministic',toolCallIds:tools.map(r=>r.callId),...(extra.proposal?{proposalId:extra.proposal.id}:{})});
   const audit=RT.audit({runId:uid('run'),area:ctx.area,projectId:base.projectId,revision:base.revision,intent:intent.intent,tools:tools.map(r=>r.__tool).filter(Boolean),proposalId:extra.proposal?.id,durationMs:Date.now()-t0,error});
   return {intent,messages:[user,reply],results:tools,audit,...extra};
  };
  const run=(tool,args)=>{const r=call(tool,args);Object.defineProperty(r,'__tool',{value:tool,enumerable:false});return r;};
  if(!project)return done(tx(lang,'No hay ningún proyecto abierto.','No project is open.','没有打开的项目。'),{},[],'not_available');
  switch(intent.intent){
   case 'rooms_count':{const r=run('get_project_summary');const c=I.compose(intent,[r],{lang});return done(c.text,{answer:c},[r],c.error);}
   case 'missing_data':{const r=run('get_project_summary');const c=I.compose(intent,[r],{lang});return done(c.text,{answer:c},[r],c.error);}
   case 'room_area':{const r=intent.roomId?run('get_room',{roomId:intent.roomId}):run('get_project_summary');const c=I.compose(intent,[r],{lang,labels:Object.fromEntries(Object.keys(labels.rooms||{}).map(id=>[id,first(labels.rooms,id)]))});return done(c.text,{answer:c},[r],c.error);}
   case 'layout_review':{const r=run('get_layout_review');const c=I.compose(intent,[r],{lang});return done(c.text,{answer:c},[r],c.error);}
   case 'budget':{const r=run('get_budget_summary');const c=I.compose(intent,[r],{lang});return done(c.text,{answer:c},[r],c.error);}
   case 'set_floor_material':case 'move_object':{
    const op=intent.intent==='move_object'?'move_object':'set_room_floor_material';const params={...intent.params};
    if(op==='move_object'&&'rotateBy' in params){const o=project.objects.find(x=>x.id===params.objectId);params.rotationDeg=((o.rotationDeg+params.rotateBy)%360+360)%360;delete params.rotateBy;}
    if(op==='move_object'){if(!params.dxMm)delete params.dxMm;if(!params.dyMm)delete params.dyMm;}
    const p=S.plan(project,op,params,{roomLabel:r=>first(labels.rooms,r.id),objectLabel:o=>first(labels.objects,o.id),materialLabel:id=>id?first(labels.materials,id):'—',lang});
    if(!p.ok)return done(tx(lang,'No propongo ese cambio: ','I do not propose that change: ','不建议此更改：')+p.error.message,{rejection:p},[],p.error.code);
    return done(tx(lang,'Propuesta lista para revisar (aún no cambia el proyecto): ','Proposal ready to review (the project has not changed yet): ','建议已就绪（项目尚未更改）：')+p.proposal.diff.map(d=>d.label).join(' · '),{proposal:p.proposal,preview:p.project},[]);
   }
   case 'render':{const cap=ctx.caps?.operations?.find(o=>o.id==='render_views');
    if(!cap||cap.state!=='available')return done(tx(lang,'Render IA no está disponible aquí: ','AI render is not available here: ','此处无法使用 AI 渲染：')+(cap?.reason||''),{service:{id:'render_views',state:cap?.state||'blocked'}},[],'not_available');
    const r=RT.renderRequest({styles:ctx.renderStyles||[]});
    return done(tx(lang,'Puedo llevarte al flujo de Render IA de Entregar para hasta 3 vistas. No gasto nada ahora: cada imagen la confirmas en ese diálogo, con tu código de acceso. Coste: lo fija el proveedor (desconocido hasta configurar la tarifa).','I can take you to the Deliver AI render flow for up to 3 views. Nothing is spent now: you confirm each image in that dialog, with your access code. Cost: set by the provider (unknown until the tariff is configured).','我可以带你进入交付中的 AI 渲染流程（最多 3 个视图）。现在不产生费用：每张图片需在该对话框中用访问码确认。费用由服务商决定（配置价格前未知）。'),{service:{id:'render_views',state:'available',request:r.request}},[]);}
   case 'photo_reform':{const cap=ctx.caps?.operations?.find(o=>o.id==='photo_reform');return done(tx(lang,'«Reformar desde fotografía» no está disponible: ','«Reform from a photo» is not available: ','“照片改造”不可用：')+(cap?.reason||'FOT-01 sin proveedor autorizado.'),{service:{id:'photo_reform',state:cap?.state||'preparation'}},[],'not_available');}
   // CAT-04: «Mis catálogos», productos colocados, coste, partidas sin precio y referencias visuales: solo lectura, con
   // las cifras del MISMO presupuesto (get_placed_products recalcula con FloorPlanBudget.calculateBudget).
   case 'catalog':case 'placed_products':case 'product_cost':case 'visual_refs':case 'budget_detail':{
    const plan={catalog:[['list_catalog_products',intent.query?{query:intent.query}:{}]],placed_products:[['get_placed_products',{}]],product_cost:[['get_placed_products',{}]],visual_refs:[['get_visual_references',{}]],budget_detail:[['get_budget_summary',{}],['get_placed_products',{}]]}[intent.intent];
    const rs=plan.map(([tool,args])=>run(tool,args)),main=rs[0];
    if(!main.ok&&main.error?.code==='not_available'&&intent.intent!=='budget_detail'){const cap=ctx.caps?.operations?.find(o=>o.id==='catalog_products');
     return done(tx(lang,'Eso no está disponible en esta página: ','That is not available on this page: ','此页面不可用：')+main.error.message+(cap?.reason?' · '+cap.reason:''),{service:{id:'catalog_products',state:cap?.state||'preparation'}},rs,'not_available');}
    const c=I.compose(intent,rs,{lang});return done(c.text,{answer:c},rs,c.error);}
   case 'advanced':{const r=RT.advancedRefusal('generate_layout');return done(tx(lang,'Eso está en preparación y no lo hago todavía (generar u optimizar distribuciones, foto → mueble 3D). Antes hace falta decidir: ','That is in preparation and I do not do it yet (generating or optimising layouts, photo → 3D furniture). It first needs these decisions: ','此功能正在准备中，暂不执行（生成或优化布局、照片转三维家具）。需要先决定：')+r.decisions.join(' '),{service:{id:'advanced',state:'preparation',decisions:r.decisions}},[],'not_available');}
   case 'ambiguous':{const need={room:tx(lang,'¿De qué estancia? Selecciónala en el plano o di su nombre.','Which room? Select it on the plan or say its name.','哪个房间？请在平面图中选择或说出名称。'),material:tx(lang,'¿Qué material de suelo? Opciones del proyecto: ','Which floor material? Project options: ','哪种地面材料？项目中的选项：')+Object.keys(labels.materials||{}).map(id=>first(labels.materials,id)).join(', '),object:tx(lang,'¿Qué mueble? Hay varios con ese nombre o ninguno: selecciónalo en el plano.','Which item? There are several with that name, or none: select it on the plan.','哪件家具？同名的有多个或没有：请在平面图中选择。'),product:tx(lang,'¿Qué producto? Hay varios que coinciden: ','Which product? Several match: ','哪个产品？有多个匹配：')+(intent.candidates||[]).map(id=>first(labels.products,id)).join(' · ')+tx(lang,'. Dime su SKU o selecciónalo en el plano.','. Tell me its SKU or select it on the plan.','。请告诉我 SKU 或在平面图中选择。'),direction:tx(lang,'Dime la dirección y la distancia, por ejemplo «20 cm a la izquierda».','Tell me the direction and distance, for example «20 cm left».','请说明方向和距离，例如“向左20厘米”。'),angle:tx(lang,'Dime un giro entre 1 y 359 grados.','Give a rotation between 1 and 359 degrees.','请给出1到359度之间的角度。')}[intent.need]||'';return done(need,{},[],'invalid_arguments');}
   case 'help':return done(tx(lang,'Consulta guiada sin modelo de lenguaje: respondo con los datos del proyecto abierto. Prueba: ','Guided query without a language model: I answer with the open project data. Try: ','无语言模型的引导式查询：根据打开的项目数据回答。试试：')+examples(lang).join(' · '),{},[]);
   default:return done(tx(lang,'No sé hacer eso. ','I cannot do that. ','我不会做这个。')+(intent.reason==='not_an_instruction'?tx(lang,'Trato el texto como datos: no ejecuto instrucciones, código ni direcciones web.','I treat text as data: I do not run instructions, code or web addresses.','我把文本当作数据：不执行指令、代码或网址。'):tx(lang,'Ejemplos: ','Examples: ','例如：')+examples(lang).slice(0,4).join(' · ')),{},[],'unsupported_intent');
  }
 }
 return Object.freeze({handle,examples});
});
