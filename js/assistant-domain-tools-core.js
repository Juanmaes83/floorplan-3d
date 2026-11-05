/* RUBIK AG-1: strictly read-only, deterministic domain tools.
   No LLM/provider call, DOM, storage, network or project mutations.
   All user/project content is untrusted data, never instructions. */
(function(root,factory){
  const deps=typeof module==='object'&&module.exports?
    {Q:require('./quantity-core.js'),B:require('./budget-core.js'),L:require('./layout-review.js')}:
    {Q:root.FloorPlanQuantities,B:root.FloorPlanBudget,L:root.FloorPlanLayoutReview};
  const api=factory(deps);
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.RubikAssistantDomainTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const {Q,B,L}=deps;
  const TOOLS=Object.freeze(['list_capabilities','get_project_summary','list_rooms','get_room','get_quantities','get_budget_summary','get_layout_review']);
  const fail=(code,message)=>({ok:false,error:{code,message}});
  const okay=(data,provenance,limitations=[])=>({ok:true,data,provenance,limitations});
  const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const has=(o,k)=>Object.prototype.hasOwnProperty.call(o,k);
  const allowed=(obj,keys)=>Object.keys(obj).every(k=>keys.includes(k));
  const validId=x=>typeof x==='string'&&x.length<=150&&x.length>0;
  const base=(ctx)=>{
    if(!isObj(ctx)||!isObj(ctx.project))return false;
    const p=ctx.project;
    return p.schema==='rubik-sota.floorplan-project'&&validId(p.id)&&
      Array.isArray(p.rooms)&&Array.isArray(p.walls)&&Array.isArray(p.openings)&&Array.isArray(p.objects);
  };
  const provenance=(ctx,engine)=>({source:engine,projectId:ctx.project.id,projectRevision:ctx.project.updatedAt??null});
  const safeCount=(v)=>Array.isArray(v)?v.length:0;
  const safeRoom=(p,r)=>{
    const q=Q.room(p,r.id);
    return {id:r.id,name:r.name??'',family:r.family??null,
      floor:{areaM2:q.floor.areaM2,status:q.floor.status,source:q.floor.source},
      perimeter:{lengthM:q.perimeter.lengthM,status:q.perimeter.status,complete:q.perimeter.complete},
      wallFaces:{netAreaM2:q.wallFaces?.netAreaM2??null,
        status:q.wallFaces?.status??'unavailable',complete:q.wallFaces?.complete??false}};
  };
  function execute(tool,args={},ctx={}){
    if(!TOOLS.includes(tool))return fail('not_authorized','Herramienta no permitida');
    if(!isObj(args)||Object.keys(args).length>6)return fail('invalid_arguments','Argumentos no válidos');
    const keys={
      list_capabilities:[],
      get_project_summary:[],
      list_rooms:[],
      get_room:['roomId'],
      get_quantities:[],
      get_budget_summary:[],
      get_layout_review:['clearanceMm']
    };
    if(!allowed(args,keys[tool]))return fail('invalid_arguments','Parámetro no permitido');
    if(tool==='list_capabilities')return okay({tools:TOOLS.map(name=>({name,access:'read-only'})),writesEnabled:false,providerConnected:false},{source:'rubik-assistant-domain-tools'});
    if(!base(ctx))return fail('invalid_arguments','Contexto de proyecto incompatible');
    if(ctx.expectedProjectId!==undefined&&ctx.expectedProjectId!==ctx.project.id)return fail('not_authorized','Proyecto fuera de alcance');
    if(ctx.expectedRevision!==undefined&&ctx.expectedRevision!==ctx.project.updatedAt)return fail('revision_mismatch','Revisión de proyecto distinta');
    const p=ctx.project;
    try {
      if(tool==='get_project_summary')return okay({
        id:p.id,schemaVersion:p.schemaVersion??null,updatedAt:p.updatedAt??null,units:p.units??'mm',
        counts:{rooms:p.rooms.length,walls:p.walls.length,openings:p.openings.length,
          objects:p.objects.length,materials:safeCount(p.materials)}
      },provenance(ctx,'FloorPlanProjectV1'),['No verifica normativa ni la existencia de una obra ejecutada.']);
      if(tool==='list_rooms'){
        if(p.rooms.length>60)return fail('not_available','Listado demasiado amplio para esta versión de consulta');
        return okay({rooms:p.rooms.map(r=>({id:r.id,name:r.name??'',family:r.family??null})),count:p.rooms.length},
          provenance(ctx,'FloorPlanProjectV1'));
      }
      if(tool==='get_room'){
        if(!validId(args.roomId))return fail('invalid_arguments','roomId obligatorio');
        const room=p.rooms.find(r=>r.id===args.roomId);
        if(!room)return fail('not_found','Estancia no encontrada');
        return okay(safeRoom(p,room),provenance(ctx,'FloorPlanQuantities'),
          ['Las áreas reflejan el estado de escala medido/estimado/no disponible del proyecto.']);
      }
      if(tool==='get_quantities'){
        if(!Q?.home)return fail('not_available','Motor de cantidades no disponible');
        const q=Q.home(p);
        return okay({status:q.status,quantities:q.quantities,
          levels:q.levels.map(l=>({levelId:l.levelId,name:l.name,status:l.status,
            roomIds:l.rooms.map(r=>r.id)}))},
          provenance(ctx,'FloorPlanQuantities'),['Datos de cantidades, no costes ni precios.']);
      }
      if(tool==='get_budget_summary'){
        if(!ctx.budget)return fail('not_available','El proyecto no aporta un presupuesto');
        if(!B?.calculateBudget)return fail('not_available','Motor económico no disponible');
        if(ctx.budget.subject?.type!=='project'||ctx.budget.subject.id!==p.id)return fail('not_authorized','Presupuesto de otro proyecto o sujeto');
        const result=B.calculateBudget(ctx.budget),t=result.totals;
        return okay({budgetId:result.budgetId,currency:result.currency,
          counts:{items:result.lines.length,chapters:result.chapters.length},
          net:t.net,tax:t.tax,gross:t.gross,reviewComplete:t.reviewComplete,
          unpricedItemIds:t.unpricedItemIds,unreviewedPriceItemIds:t.unreviewedPriceItemIds,
          incompleteQuantityItemIds:t.incompleteQuantityItemIds},
          {...provenance(ctx,'FloorPlanBudget.calculateBudget'),budgetId:result.budgetId},
          ['Presupuesto previsto, no gasto ejecutado. Precios o cantidades incompletos no equivalen a cero.']);
      }
      if(tool==='get_layout_review'){
        if(args.clearanceMm!==undefined&&
           !(typeof args.clearanceMm==='number'&&Number.isFinite(args.clearanceMm)&&args.clearanceMm>0&&args.clearanceMm<=3000))
          return fail('invalid_arguments','clearanceMm debe ser un número entre 0 y 3000 mm');
        if(!L?.review)return fail('not_available','Motor de revisión no disponible');
        const r=L.review(p,args);
        return okay({status:r.status,checks:r.checks,
          findings:r.findings.map(f=>({code:f.code,objects:f.objects,message:f.message})),
          skipped:r.skipped,unsupported:r.unsupported},
          provenance(ctx,'FloorPlanLayoutReview'),
          ['Solo examen de huellas en planta; no constituye cumplimiento normativo ni certificación.']);
      }
      return fail('not_authorized','Herramienta no permitida');
    }catch(e){
      // Fail closed. Never send internal stack traces, serialized projects or budget details.
      if(e instanceof RangeError)return fail('not_found','Elemento solicitado no encontrado');
      return fail('not_available','No se pudo calcular esta consulta con los datos actuales');
    }
  }
  return Object.freeze({TOOLS,execute});
});
