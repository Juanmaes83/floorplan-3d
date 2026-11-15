/* RUBIK · Asistente IA V2 · AG-1: herramientas de dominio de SOLO LECTURA, deterministas.
   Origen auditado: rama feat/agent-ai-ag1-readonly-2026-11-05 @ e458028 (7 herramientas y 12 pruebas, que pasan contra
   los motores de master c91d12d). Adaptación V2, sin cambiar los motores:
     · resultados con la forma AssistantToolResultV1 (RubikAssistantContracts) y procedencia completa: motor, proyecto,
       revisión por CONTENIDO y estado de medida (measured / estimated / unavailable);
     · la revisión ya no es `updatedAt` (el commit del editor la reescribe en cada paso aunque nada cambie), sino un
       resumen del contenido sin `updatedAt`, el mismo criterio que UX-12;
     · 2 lecturas nuevas que necesitan las propuestas de AG-2: `list_materials` y `list_objects`.
   Sin LLM, DOM, almacenamiento, red ni mutaciones. Todo el contenido del proyecto es DATO, nunca instrucciones.
   `expectedProjectId` / `expectedRevision` son comprobaciones DEFENSIVAS de un contexto que da la propia aplicación:
   NO son autenticación ni autorizan a nadie a leer un proyecto.
   UMD: window.RubikAssistantDomainTools / module.exports. */
(function(root,factory){
  const deps=typeof module==='object'&&module.exports?
    {Q:require('./quantity-core.js'),B:require('./budget-core.js'),L:require('./layout-review.js'),K:require('./assistant-contracts.js')}:
    {Q:root.FloorPlanQuantities,B:root.FloorPlanBudget,L:root.FloorPlanLayoutReview,K:root.RubikAssistantContracts};
  const api=factory(deps);
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantDomainTools=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const {Q,B,L,K}=deps;
  // CAT-04: three more READ-ONLY tools over data the application already computed for the open project and studio:
  // «Mis catálogos» (CatalogCapabilitiesForAssistantV1), the catalogue items of the SAME budget (amounts recomputed here
  // with FloorPlanBudget.calculateBudget, never another formula) and the visual references linked to the project.
  const TOOLS=Object.freeze(['list_capabilities','get_project_summary','list_rooms','get_room','get_quantities','get_budget_summary','get_layout_review','list_materials','list_objects','list_catalog_products','get_placed_products','get_visual_references']);
  const ARGS=Object.freeze({list_capabilities:[],get_project_summary:[],list_rooms:[],get_room:['roomId'],get_quantities:[],get_budget_summary:[],get_layout_review:['clearanceMm'],list_materials:[],list_objects:['roomId'],list_catalog_products:['query'],get_placed_products:[],get_visual_references:[]});
  const fold=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
  const short=(v,n=120)=>typeof v==='string'?v.slice(0,n):null;
  const priceView=p=>p?{unitPrice:Number.isFinite(p.unitPrice)?p.unitPrice:null,unit:short(p.unit,8),label:short(p.label),asOf:short(p.asOf,10),edition:short(p.edition,40)}:null;
  const MAX_LIST=200;
  const isObj=x=>x!==null&&typeof x==='object'&&!Array.isArray(x);
  const validId=x=>typeof x==='string'&&x.length>0&&x.length<=150;
  // Content revision: two independent 32-bit FNV-1a passes over the project without `updatedAt` (64 bits in hex).
  function revision(project){
    const {updatedAt,...rest}=project||{};const s=JSON.stringify(rest);let a=0x811c9dc5,b=0x01000193^0x5bd1e995;
    for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,0x01000193)>>>0;b=Math.imul(b^(c+i&0xffff),0x01000193)>>>0;}
    return 'rv1-'+a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');
  }
  const base=ctx=>{
    if(!isObj(ctx)||!isObj(ctx.project))return false;const p=ctx.project;
    return p.schema==='rubik-sota.floorplan-project'&&validId(p.id)&&Array.isArray(p.rooms)&&Array.isArray(p.walls)&&Array.isArray(p.openings)&&Array.isArray(p.objects);
  };
  const result=(callId,data,prov,limitations=[])=>({version:K.VERSION,callId,ok:true,data,provenance:prov,limitations});
  const failure=(callId,code,message)=>({version:K.VERSION,callId,ok:false,error:{code,message}});
  const prov=(ctx,source,extra={})=>({source,projectId:ctx.project.id,revision:revision(ctx.project),...extra});
  const status=v=>K.MEASURE.includes(v)?v:'unavailable';
  // A total with unknown prices is NOT a total: `amount` is null and the sum of the priced items travels apart, labelled partial.
  const money=m=>({amount:m?.complete?m.amount:null,complete:!!m?.complete,partialAmount:Number.isFinite(m?.amount)?m.amount:null,missingItemIds:(m?.missingItemIds||[]).slice(0,MAX_LIST)});
  // scale.confidence (contrato): real = calibrada y confirmada; estimated = escala declarada o plantilla; pending = sin calibrar.
  const scaleStatus=p=>({real:'measured',estimated:'estimated',pending:'unavailable'})[p.scale?.confidence]||'unavailable';
  const roomInfo=(p,r)=>{const q=Q.room(p,r.id);
    return {id:r.id,name:typeof r.name==='string'?r.name.slice(0,100):'',family:q.family??null,counted:q.counted!==false,floorMaterialId:r.floorMaterialId??null,
      floor:{areaM2:q.floor.areaM2??null,status:status(q.floor.status),source:q.floor.source??null},
      perimeter:{lengthM:q.perimeter.lengthM??null,status:status(q.perimeter.status),complete:!!q.perimeter.complete},
      wallFaces:{netAreaM2:q.wallFaces?.netAreaM2??null,status:status(q.wallFaces?.status),complete:!!q.wallFaces?.complete}};};
  // What is missing: closed list, computed from the same data (no guesses).
  function gaps(p,q){
    const list=[];if(scaleStatus(p)!=='measured')list.push({code:'scale_not_measured',detail:p.scale?.confidence??'pending'});
    const unnamed=p.rooms.filter(r=>!r.name).map(r=>r.id);if(unnamed.length)list.push({code:'rooms_without_name',ids:unnamed.slice(0,MAX_LIST)});
    const noMat=p.rooms.filter(r=>!r.floorMaterialId).map(r=>r.id);if(noMat.length)list.push({code:'rooms_without_floor_material',ids:noMat.slice(0,MAX_LIST)});
    const est=q.rooms.filter(r=>r.floor.status!=='measured').map(r=>r.id);if(est.length)list.push({code:'areas_not_measured',ids:est.slice(0,MAX_LIST)});
    const faces=q.rooms.filter(r=>!r.wallFaces?.complete).map(r=>r.id);if(faces.length)list.push({code:'wall_faces_incomplete',ids:faces.slice(0,MAX_LIST)});
    return list;
  }
  function execute(tool,args={},ctx={},callId='call'){
    if(!K.isId(callId))callId='call';
    if(!TOOLS.includes(tool))return failure(callId,'not_authorized','Herramienta no permitida');
    if(!isObj(args)||Object.keys(args).length>6)return failure(callId,'invalid_arguments','Argumentos no válidos');
    if(!Object.keys(args).every(k=>ARGS[tool].includes(k)))return failure(callId,'invalid_arguments','Parámetro no permitido');
    if(tool==='list_capabilities')return result(callId,{tools:TOOLS.map(name=>({name,access:'read-only'})),writesEnabled:false,providerConnected:false},{source:'RubikAssistantDomainTools'});
    if(!base(ctx))return failure(callId,'invalid_arguments','Contexto de proyecto incompatible');
    if(ctx.expectedProjectId!==undefined&&ctx.expectedProjectId!==ctx.project.id)return failure(callId,'not_authorized','Proyecto fuera de alcance');
    if(ctx.expectedRevision!==undefined&&ctx.expectedRevision!==revision(ctx.project))return failure(callId,'revision_mismatch','Revisión de proyecto distinta');
    const p=ctx.project;
    try{
      if(tool==='get_project_summary'){const h=Q.home(p);
        return result(callId,{id:p.id,schemaVersion:p.schemaVersion??null,units:p.units??'mm',scale:{status:scaleStatus(p),confidence:p.scale?.confidence??null,method:p.scale?.method??null},
          counts:{rooms:p.rooms.length,walls:p.walls.length,openings:p.openings.length,objects:p.objects.length,materials:Array.isArray(p.materials)?p.materials.length:0,levels:Array.isArray(ctx.levels)?ctx.levels.length:1},
          area:{countedM2:h.quantities?.floor?.areaM2??null,status:status(h.quantities?.floor?.status),complete:!!h.quantities?.floor?.complete,excludedRoomIds:(h.quantities?.floor?.excluded||[]).slice(0,MAX_LIST)},gaps:gaps(p,{rooms:p.rooms.map(r=>Q.room(p,r.id))})},
          prov(ctx,'FloorPlanProjectV1',{engine:'FloorPlanQuantities.home',status:status(h.status)}),
          ['No verifica normativa ni la existencia de una obra ejecutada.','Con varias plantas, cada consulta se refiere a la planta activa.']);}
      if(tool==='list_rooms'){if(p.rooms.length>MAX_LIST)return failure(callId,'not_available','Listado demasiado amplio para esta versión');
        return result(callId,{rooms:p.rooms.map(r=>roomInfo(p,r)),count:p.rooms.length},prov(ctx,'FloorPlanQuantities.room',{engine:'FloorPlanQuantities'}));}
      if(tool==='get_room'){if(!validId(args.roomId))return failure(callId,'invalid_arguments','roomId obligatorio');
        const room=p.rooms.find(r=>r.id===args.roomId);if(!room)return failure(callId,'not_found','Estancia no encontrada');
        const info=roomInfo(p,room);
        return result(callId,info,prov(ctx,'FloorPlanQuantities.room',{engine:'FloorPlanQuantities',status:info.floor.status}),['Las áreas reflejan el estado de escala medido, estimado o no disponible del proyecto.']);}
      if(tool==='get_quantities'){const q=Q.home(p);
        return result(callId,{status:status(q.status),quantities:q.quantities,levels:q.levels.map(l=>({levelId:l.levelId,name:l.name,status:status(l.status),roomIds:l.rooms.map(r=>r.id)}))},
          prov(ctx,'FloorPlanQuantities.home',{engine:'FloorPlanQuantities',status:status(q.status)}),['Datos de cantidades, no costes ni precios.']);}
      if(tool==='get_budget_summary'){
        if(!ctx.budget)return failure(callId,'not_available','El proyecto no aporta un presupuesto');
        if(ctx.budget.subject?.type!=='project'||ctx.budget.subject.id!==p.id)return failure(callId,'not_authorized','Presupuesto de otro proyecto o sujeto');
        const c=B.calculateBudget(ctx.budget),t=c.totals;
        const desc=new Map(ctx.budget.items.map(i=>[i.id,typeof i.description==='string'?i.description.slice(0,120):i.id]));
        return result(callId,{budgetId:c.budgetId,currency:c.currency,saved:ctx.budgetSaved===true,counts:{items:c.lines.length,chapters:c.chapters.length},
          unpricedItems:t.unpricedItemIds.slice(0,50).map(id=>({id,description:desc.get(id)||id})),
          net:money(t.net),tax:money(t.tax),gross:money(t.gross),reviewComplete:t.reviewComplete,unpricedItemIds:t.unpricedItemIds.slice(0,MAX_LIST),
          unreviewedPriceItemIds:t.unreviewedPriceItemIds.slice(0,MAX_LIST),incompleteQuantityItemIds:t.incompleteQuantityItemIds.slice(0,MAX_LIST)},
          prov(ctx,'FloorPlanBudget.calculateBudget',{engine:'FloorPlanBudget',budgetId:c.budgetId}),
          ['Presupuesto previsto, no gasto ejecutado ni presupuesto aprobado. Un precio o una cantidad que faltan no equivalen a cero.']);}
      if(tool==='get_layout_review'){
        if(args.clearanceMm!==undefined&&!(typeof args.clearanceMm==='number'&&Number.isFinite(args.clearanceMm)&&args.clearanceMm>0&&args.clearanceMm<=3000))
          return failure(callId,'invalid_arguments','clearanceMm debe ser un número entre 0 y 3000 mm');
        const r=L.review(p,args);
        return result(callId,{status:r.status,checks:r.checks,findings:r.findings.slice(0,200).map(f=>({code:f.code,objects:f.objects,message:f.message})),skipped:r.skipped,unsupported:r.unsupported},
          prov(ctx,'FloorPlanLayoutReview.review',{engine:'FloorPlanLayoutReview'}),['Solo examina huellas en planta: no es cumplimiento normativo, accesibilidad ni certificación.']);}
      if(tool==='list_materials')return result(callId,{materials:(p.materials||[]).slice(0,MAX_LIST).map(m=>({id:m.id,name:typeof m.name==='string'?m.name.slice(0,100):'',category:m.category??null})),count:(p.materials||[]).length},prov(ctx,'FloorPlanProjectV1.materials'));
      if(tool==='list_objects'){if(args.roomId!==undefined&&!p.rooms.some(r=>r.id===args.roomId))return failure(callId,'not_found','Estancia no encontrada');
        const list=p.objects.filter(o=>args.roomId===undefined||o.roomId===args.roomId).slice(0,MAX_LIST).map(o=>({id:o.id,type:o.type,name:typeof o.name==='string'?o.name.slice(0,100):'',roomId:o.roomId??null,position:{x:o.position.x,y:o.position.y},rotationDeg:o.rotationDeg,size:{widthMm:o.size.widthMm,depthMm:o.size.depthMm}}));
        return result(callId,{objects:list,count:list.length},prov(ctx,'FloorPlanProjectV1.objects'));}
      if(tool==='list_catalog_products'){
        if(args.query!==undefined&&!(typeof args.query==='string'&&args.query.length<=80))return failure(callId,'invalid_arguments','query debe ser un texto de hasta 80 caracteres');
        const cat=ctx.catalog;if(!isObj(cat)||!Array.isArray(cat.products))return failure(callId,'not_available','«Mis catálogos» no está cargado en esta página');
        const words=fold(args.query||'').split(/[^\p{L}\p{N}]+/u).filter(w=>w.length>=2);
        // Words of the query scored against SKU, name, collection and ids: the products with the most matched words.
        const all=cat.products.slice(0,MAX_LIST),scored=all.map(p=>{const t=fold(`${p.sku} ${p.displayName} ${p.collection||''} ${p.productId} ${p.variantId||''}`);return {p,n:words.filter(w=>t.includes(w)).length};});
        const best=words.length?Math.max(0,...scored.map(x=>x.n)):0,hits=words.length?scored.filter(x=>best>0&&x.n===best).map(x=>x.p):all;
        return result(callId,{studioId:short(cat.studioId,60),scope:'local-browser-pilot',query:args.query||null,catalogs:(cat.catalogs||[]).slice(0,20).map(c=>({catalogId:short(c.catalogId,60),name:short(c.name),revision:c.revision,products:c.products})),
          matches:hits.slice(0,20).map(p=>({key:short(p.key,200),catalogId:short(p.catalogId,60),catalogRevision:p.catalogRevision,sku:short(p.sku,60),displayName:short(p.displayName),kind:short(p.kind,20),placeable:p.placeable!==false,synthetic:!!p.synthetic,sheetPrice:priceView(p.sheetPrice)})),total:hits.length},
          {source:'CatalogCapabilitiesForAssistantV1',engine:'RubikCatalogProduct'},
          ['Piloto local de este navegador, por estudio: no es control de acceso multiempresa (GOV-06a).','El precio de la ficha es una referencia: no cuenta en el presupuesto hasta que lo aplicas y lo revisas.','Nunca se deducen productos ni precios de imágenes.']);}
      if(tool==='get_placed_products'){
        const rep=ctx.catalogReport;if(!Array.isArray(rep))return failure(callId,'not_available','«Mis catálogos» no está cargado en esta página');
        if(!ctx.budget)return failure(callId,'not_available','El proyecto no aporta un presupuesto');
        if(ctx.budget.subject?.type!=='project'||ctx.budget.subject.id!==p.id)return failure(callId,'not_authorized','Presupuesto de otro proyecto o sujeto');
        const ids=new Set(p.objects.map(o=>o.id)),c=B.calculateBudget(ctx.budget),lines=new Map(c.lines.map(l=>[l.id,l])),items=new Map(ctx.budget.items.map(i=>[i.id,i]));
        const ch=c.chapters.find(x=>x.id==='catalog')||null;
        const list=rep.filter(r=>isObj(r)&&typeof r.itemId==='string'&&Array.isArray(r.objects)&&r.objects.every(id=>ids.has(id))).slice(0,MAX_LIST).map(r=>{const l=lines.get(r.itemId)||null,it=items.get(r.itemId)||null;
          return {itemId:r.itemId.slice(0,200),sku:short(r.sku,60),displayName:short(r.displayName),objects:r.objects.length,quantity:Number.isFinite(r.quantity)?r.quantity:null,unit:short(r.unit,8),quantityStatus:short(r.quantityStatus,30),retired:!!r.retired,
            state:short(r.state,30),inBudget:!!it,activeUnitPrice:it&&Number.isFinite(it.unitPrice)?it.unitPrice:null,reviewed:it?.review?.status==='reviewed',subtotalNet:l&&Number.isFinite(l.subtotalNet)?l.subtotalNet:null,
            reference:priceView(r.reference),sheetPrice:priceView(r.sheetPrice),sheetStatus:short(r.sheet?.status,30),versionChanged:!!r.versionChanged,synthetic:!!r.synthetic};});
        return result(callId,{budgetId:c.budgetId,currency:c.currency,saved:ctx.budgetSaved===true,products:list,count:list.length,
          chapter:ch?{net:money(ch.totals.net),unpricedItemIds:ch.totals.unpricedItemIds.slice(0,MAX_LIST)}:null,total:{gross:money(c.totals.gross),unpricedItemIds:c.totals.unpricedItemIds.slice(0,MAX_LIST)}},
          prov(ctx,'FloorPlanBudget.calculateBudget',{engine:'RubikCatalogBudget',budgetId:c.budgetId}),
          ['Las cantidades son el recuento de objetos vinculados (CAT-03), no una medición del motor de cantidades.','Un precio de ficha no aplicado no cuenta; un precio desconocido no es cero; un precio sin revisar no es un presupuesto aprobado.']);}
      if(tool==='get_visual_references'){
        const refs=ctx.visualRefs;if(!Array.isArray(refs))return failure(callId,'not_available','El Estudio de imágenes no está cargado en esta página');
        const list=refs.slice(0,50).map(r=>({hash:short(r.hash,64),status:short(r.status,20),decision:short(r.decision,20),resultKind:short(r.resultKind,20),simulated:r.simulated===true,deliverable:r.deliverable===true,
          reviewStatus:short(r.review?.status,20),linkedAt:short(r.linkedAt,30),references:(r.references||[]).slice(0,3).map(x=>({sku:short(x.sku,60),displayName:short(x.displayName),placed:x.placed===true,catalogStatus:short(x.catalogStatus,20)}))}));
        return result(callId,{references:list,count:list.length},prov(ctx,'RubikVisualReferences',{engine:'RubikVisualReferences'}),
          ['Una referencia visual no es una medición, ni una ficha validada, ni un precio: no crea partidas.','No certifica un SKU por parecido. Una simulación no es una imagen generada por IA ni un entregable.']);}
      return failure(callId,'not_authorized','Herramienta no permitida');
    }catch(e){
      // Fail closed: never return stack traces, serialized projects or budget details.
      if(e instanceof RangeError)return failure(callId,'not_found','Elemento solicitado no encontrado');
      return failure(callId,'not_available','No se pudo calcular esta consulta con los datos actuales');
    }
  }
  return Object.freeze({TOOLS,ARGS,execute,revision});
});
