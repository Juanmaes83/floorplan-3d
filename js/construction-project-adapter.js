/* FT3D-8 project adapter (FloorPlanConstructionProject): reads a REAL RUBIK project/building through its canonical
   authorities and binds it, read-only, to a FT3D-8 schedule and a C1-C4 budget.
   - Geometry: FloorPlanCore.geometry (the shared renderer projection the editor's 2D/3D use), FloorPlanRoof +
     FloorPlanExterior (derived upper envelope), FloorPlanBuilding (levels, elevations, offsets). Nothing is
     re-derived here: segments, sills, heads, polygons and statuses are copied from those results.
   - Evidence: FloorPlanProjectV1 scale.confidence/verification and element source.method/review. Never upgraded.
   - Time: FloorPlanConstructionSchedule 0.2.0. Money: FloorPlanBudget via Schedule.budgetReport.
   - Revisions: SHA-256 of FloorPlanBuilding.canonical(document) (the repository's own canonical form).
   Elements RUBIK does not model (foundations, excavation, framing, coverings, scaffolds...) are listed as
   unavailable and are never drawn. No DOM, no network, no mutation of inputs. */
(function(root,factory){
  const req=typeof module==='object'&&module.exports;
  const deps=req?{Core:require('./project-core.js'),Building:require('./building-core.js'),Roof:require('./roof-core.js'),
    Exterior:require('./exterior-core.js'),Schedule:require('./construction-schedule-core.js'),Budget:require('./budget-core.js')}
    :{Core:root.FloorPlanCore,Building:root.FloorPlanBuilding,Roof:root.FloorPlanRoof,Exterior:root.FloorPlanExterior,
      Schedule:root.FloorPlanConstructionSchedule,Budget:root.FloorPlanBudget};
  const api=factory(deps);
  if(req)module.exports=api;else root.FloorPlanConstructionProject=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const {Core,Building,Roof,Exterior,Schedule,Budget}=deps;
  for(const [n,v] of Object.entries({Core,Building,Roof,Exterior,Schedule,Budget}))if(!v)throw new TypeError('FloorPlanConstructionProject requires '+n);
  const BINDING_SCHEMA='rubik-sota.construction-binding',BINDING_VERSION='0.1.0';
  const MODEL_SCHEMA='rubik-sota.construction-presentation-model',MODEL_VERSION='0.1.0';
  const EVIDENCE=Object.freeze(['verified','estimated','pending','unavailable']);
  const DELIVERY=Object.freeze(['internal','orientative','approved-plan','professional']);
  // What FT3D-8 might want to show but RUBIK does not model: listed, never drawn.
  const NOT_IN_AUTHORITY=Object.freeze([
    {category:'foundation',reason:'FloorPlanProjectV1 no modela cimentaciones'},
    {category:'excavation',reason:'No existe terreno excavado en el contrato de proyecto'},
    {category:'structural-frame',reason:'Sin estructura (pilares, vigas, armaduras) en el contrato'},
    {category:'pitched-roof-covering',reason:'FloorPlanRoof solo deriva una envolvente superior plana conservadora'},
    {category:'wall-layers',reason:'Los muros tienen un unico acabado (surfaceMaterialId); no hay capas constructivas'},
    {category:'site-temporary-works',reason:'Valla, caseta, grua o andamios no forman parte del proyecto'}]);
  // Render defaults of the editor's own 3D viewer (index.html) when the project declares no material: not project data.
  const VIEWER_DEFAULTS=Object.freeze({wall:'#f4f1eb',facade:'#d9cbbb',cap:'#34312d',roof:'#c9c1b3',slab:'#d9d3c8',frame:'#5d6166',glass:'#cfe6ef',door:'#efe6d8',entrance:'#6b4f3a'});
  const APPEAR=['site','build','structure','envelope','services'],REMOVE=['demolition'];
  const err=s=>{throw new TypeError('FloorPlanConstructionProject: '+s);};
  const clone=x=>JSON.parse(JSON.stringify(x));
  const isBuilding=doc=>!!doc&&doc.schema===Building.SCHEMA;
  const elementKey=(levelId,id)=>{if(typeof id!=='string'||!id)err('element id required');return (levelId||'project')+'/'+id;};
  const fingerprint=async doc=>{if(doc===null||doc===undefined)return null;return Building.sha256(Building.canonical(doc));};

  /* ---------- authorities ---------- */
  function validateSource(doc){
    if(!doc||typeof doc!=='object')err('project or building document required');
    if(isBuilding(doc)){Building.validate(doc);return 'building';}
    if(doc.schema!=='rubik-sota.floorplan-project')err('unsupported document schema '+doc.schema);
    Core.validate(doc,{strict:true});return 'project';
  }
  const levelsOf=doc=>isBuilding(doc)
    ?[...doc.levels].sort((a,b)=>a.order-b.order).map(l=>({levelId:l.id,name:l.name,order:l.order,elevationMm:l.elevationMm,slabThicknessMm:l.slabThicknessMm,offsetMm:{...l.offsetMm},project:l.project}))
    :[{levelId:null,name:doc.name,order:0,elevationMm:0,slabThicknessMm:0,offsetMm:{x:0,y:0},project:doc}];
  // Real states only: FloorPlanSurfaceMetrics maps confidence 'real' to measured, anything else to estimated.
  function scaleEvidence(project){
    const s=project.scale||{},v=s.verification;
    if(s.confidence==='real'&&v&&v.status==='consistent'&&s.calibration&&s.calibration.confirmedByUser===true)
      return {status:'verified',confidence:'real',method:s.method,reason:'escala calibrada y verificada con segunda distancia'};
    if(s.confidence==='estimated')return {status:'estimated',confidence:'estimated',method:s.method,reason:'escala estimada ('+s.method+')'};
    return {status:'pending',confidence:s.confidence||'pending',method:s.method||'none',reason:'escala pendiente de confirmar'};
  }
  const RANK={verified:0,estimated:1,pending:2,unavailable:3};
  const worst=list=>list.reduce((a,b)=>RANK[b]>RANK[a]?b:a,'verified');
  // Element evidence never exceeds scale evidence, and an unconfirmed or missing source keeps it pending.
  function sourceEvidence(source){
    if(!source)return {status:'pending',reason:'origen no declarado'};
    if(source.review!=='confirmed')return {status:'pending',reason:'geometria sin confirmar ('+source.method+')'};
    if(source.method==='template')return {status:'estimated',reason:'plantilla confirmada'};
    if(source.method==='suggested')return {status:'pending',reason:'origen sugerido experimental'};
    return {status:'verified',reason:'confirmada por una persona ('+source.method+')'};
  }
  const evidenceOf=(scale,source)=>{const s=sourceEvidence(source),status=worst([scale.status,s.status]);return {status,scale:scale.status,source:s.status,reasons:[scale.reason,s.reason]};};
  const M=v=>v/1000;

  /* ---------- inventory: one entry per real element, with its canonical geometry ---------- */
  function levelInventory(level,{roofSurfaces,roofStatus,buildingStairs}){
    const p=level.project,g=Core.geometry(p),scale=scaleEvidence(p),lv=level.levelId,ext=Exterior.derive(p);
    const extBy=new Map(ext.walls.map(w=>[w.wallId,w.status])),mats=new Map(p.materials.map(m=>[m.id,m]));
    const elements=[];
    const piecesBy=new Map();const add=(id,piece)=>{if(!piecesBy.has(id))piecesBy.set(id,[]);piecesBy.get(id).push(piece);};
    // Same height rules as the editor's 3D (index.html arch build): solid [0,h]; under/over each opening.
    const seg=(r,kind,yb,yt)=>({kind,center:[...r.center],angle:r.angle,spanMm:r.spanMm,thicknessMm:r.thickness,ybMm:Math.round(yb),ytMm:Math.round(yt),openingId:r.openingId||null});
    for(const r of g.walls)add(r.id,seg(r,'solid',0,r.height*1000));
    for(const r of [...g.doors.map(d=>d.rect),...g.slides.map(d=>d.rect),...g.voids]){
      if(r.sill>0)add(r.id,seg(r,'below-opening',0,r.sill*1000));if(r.head<r.height)add(r.id,seg(r,'above-opening',r.head*1000,r.height*1000));}
    for(const r of g.windows){add(r.id,seg(r,'below-opening',0,r.sill*1000));if(r.head<r.height)add(r.id,seg(r,'above-opening',r.head*1000,r.height*1000));}
    for(const w of p.walls){
      const m=w.surfaceMaterialId?mats.get(w.surfaceMaterialId):null,exterior=extBy.get(w.id)||'unavailable';
      elements.push({key:elementKey(lv,w.id),levelId:lv,id:w.id,type:'wall',lifecycle:w.status,structure:w.structure,exterior,
        thicknessMm:w.thicknessMm,heightMm:w.heightMm,lengthMm:Math.round(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)),
        start:{...w.start},end:{...w.end},
        material:m?{id:m.id,name:m.name,color:m.appearance.color,source:'project'}
          :{id:null,name:null,color:exterior==='facade'?VIEWER_DEFAULTS.facade:VIEWER_DEFAULTS.wall,source:'viewer-default'},
        evidence:evidenceOf(scale,w.source),representable:true,pieces:piecesBy.get(w.id)||[]});
    }
    const wallStatus=new Map(p.walls.map(w=>[w.id,w.status]));
    const glazing=new Map([...g.windows.map(r=>[r.openingId,{rect:r,kind:'window'}]),...g.slides.map(s=>[s.id,{rect:s.rect,kind:'sliding-door'}]),
      ...g.doors.map(d=>[d.id,{rect:d.rect,kind:'door',door:{hinge:[...d.h],closedDir:[...d.c],openDir:[...d.o],lengthMm:d.len,entrance:!!d.entry,heightMm:Math.round(d.height*1000)}}]),
      ...g.voids.map(r=>[r.openingId,{rect:r,kind:'opening'}])]);
    for(const o of p.openings){
      const host=wallStatus.get(o.wallId),gl=glazing.get(o.id);
      elements.push({key:elementKey(lv,o.id),levelId:lv,id:o.id,type:o.kind,wallId:o.wallId,wallKey:elementKey(lv,o.wallId),lifecycle:host,
        widthMm:o.widthMm,heightMm:o.heightMm,sillHeightMm:o.sillHeightMm,
        rect:gl?{center:[...gl.rect.center],angle:gl.rect.angle,spanMm:gl.rect.spanMm,thicknessMm:gl.rect.thickness}:null,door:gl?.door||null,
        material:{id:null,color:o.kind==='door'?(o.isEntrance?VIEWER_DEFAULTS.entrance:VIEWER_DEFAULTS.door):VIEWER_DEFAULTS.frame,source:'viewer-default'},
        evidence:evidenceOf(scale,o.source),representable:!!gl,unavailableReason:gl?null:'muro anfitrion demolido'});
    }
    for(const r of g.rooms){
      const room=p.rooms.find(x=>x.id===r.id),m=mats.get(r.mat);
      elements.push({key:elementKey(lv,r.id),levelId:lv,id:r.id,type:'floor',lifecycle:'undeclared',name:r.name,family:r.family,
        polygon:r.poly.map(([x,y])=>({x,y})),material:m?{id:m.id,name:m.name,color:m.appearance.color,source:'project'}:{id:r.mat,color:null,source:'missing'},
        evidence:evidenceOf(scale,room.source),representable:true});
    }
    // Derived roof: one element per level (key <level>/roof); its evidence is that of the facade walls it rests on.
    const facade=p.walls.filter(w=>extBy.get(w.id)==='facade');
    const roofEvidence=facade.length?{status:worst(facade.map(w=>evidenceOf(scale,w.source).status)),scale:scale.status,source:'derived',reasons:['derivada de '+facade.length+' muros de fachada']}
      :{status:'unavailable',scale:scale.status,source:'derived',reasons:['sin fachada cerrada']};
    const surfaces=roofSurfaces.filter(s=>(s.levelId??null)===lv);
    elements.push({key:elementKey(lv,'roof'),levelId:lv,id:'roof',type:'roof',lifecycle:facade.length&&facade.every(w=>w.status==='existing')?'existing':'new',
      surfaces:surfaces.map(s=>({kind:s.kind,elevationMm:s.elevationMm,polygon:s.polygon.map(q=>({x:q.x,y:q.y}))})),
      material:{id:null,color:VIEWER_DEFAULTS.roof,source:'viewer-default'},
      evidence:roofStatus.status==='available'&&surfaces.length?roofEvidence:{...roofEvidence,status:'unavailable'},
      representable:roofStatus.status==='available'&&surfaces.length>0,unavailableReason:roofStatus.status==='available'?(surfaces.length?null:'sin superficie expuesta en este nivel'):roofStatus.reason});
    // Slab under an upper level (FloorPlanBuildingV1 slabThicknessMm): the editor extrudes that level's rooms by it.
    if(level.order>0&&level.slabThicknessMm>0){
      const stairsArriving=(buildingStairs||[]).filter(s=>s.toLevelId===lv).length;
      elements.push({key:elementKey(lv,'slab'),levelId:lv,id:'slab',type:'slab',lifecycle:p.walls.length&&p.walls.every(w=>w.status==='existing')?'existing':'new',
        thicknessMm:level.slabThicknessMm,polygons:g.rooms.map(r=>r.poly.map(([x,y])=>({x,y}))),material:{id:null,color:VIEWER_DEFAULTS.slab,source:'viewer-default'},
        evidence:{status:worst([scale.status,...p.rooms.map(r=>sourceEvidence(r.source).status)]),scale:scale.status,source:'derived',reasons:['grosor declarado en el edificio; contorno = recintos de la planta']},
        representable:!stairsArriving,unavailableReason:stairsArriving?'huecos de escalera en forjado: pendientes en FT3D-8':null});
    }
    for(const o of p.objects||[])elements.push({key:elementKey(lv,o.id),levelId:lv,id:o.id,type:'object',lifecycle:'furniture',
      evidence:{status:'unavailable',reasons:['mobiliario: fuera del alcance de la obra']},representable:false,unavailableReason:'mobiliario excluido del timelapse'});
    return {levelId:lv,name:level.name,order:level.order,elevationMm:level.elevationMm,offsetMm:level.offsetMm,slabThicknessMm:level.slabThicknessMm,
      scale,envelope:{...g.envelope},center:{...g.center},exterior:ext.status,elements};
  }
  function inventory(doc){
    const kind=validateSource(doc),levels=levelsOf(doc);
    const roof=kind==='building'?Roof.deriveBuilding({levels:doc.levels},Exterior,Building):Roof.deriveProject(doc,Exterior);
    const roofSurfaces=roof.status==='available'?roof.surfaces.map(s=>({...s,levelId:kind==='building'?s.levelId:null})):[];
    const lv=levels.map(l=>levelInventory(l,{roofSurfaces,roofStatus:roof,buildingStairs:kind==='building'?doc.stairs:[]}));
    const elements=lv.flatMap(l=>l.elements);
    const keys=new Set();for(const e of elements){if(keys.has(e.key))err('duplicate element key '+e.key);keys.add(e.key);}
    // The editor centres the active level on its envelope; buildings keep level 0's frame.
    const origin=lv[0].center;
    return {kind,id:doc.id,name:doc.name,updatedAt:doc.updatedAt,origin,levels:lv.map(({elements,...l})=>l),elements,
      roof:{status:roof.status,reason:roof.reason||null},notInAuthority:NOT_IN_AUTHORITY.map(x=>({...x})),stairs:kind==='building'?doc.stairs.map(s=>({id:s.id,representable:false,reason:'escaleras: representacion pendiente en FT3D-8'})):[]};
  }

  /* ---------- binding document (persistence contract, complementary to the project) ---------- */
  const SHA=/^[0-9a-f]{64}$/;
  function validateBinding(b){
    if(!b||typeof b!=='object'||Array.isArray(b))err('binding must be an object');
    const allowed=['schema','schemaVersion','id','subject','fingerprints','scheduleId','budgetId','review','createdAt'];
    for(const k of Object.keys(b))if(!allowed.includes(k))err('binding unknown field '+k);
    if(b.schema!==BINDING_SCHEMA||b.schemaVersion!==BINDING_VERSION)err('unsupported binding schema/version');
    if(typeof b.id!=='string'||!/^bnd_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/.test(b.id))err('binding id must match bnd_*');
    if(!b.subject||!['project','building'].includes(b.subject.type)||typeof b.subject.id!=='string')err('binding subject {type,id} required');
    const f=b.fingerprints||{};for(const k of ['project','schedule','budget'])if(!(f[k]===null||SHA.test(f[k]??'')))err('binding fingerprint '+k+' must be sha-256 hex or null');
    if(!SHA.test(f.project))err('binding fingerprint project is required');
    if(!(b.scheduleId===null||typeof b.scheduleId==='string'))err('binding scheduleId must be string or null');
    if(!(b.budgetId===null||typeof b.budgetId==='string'))err('binding budgetId must be string or null');
    const r=b.review;if(!r||!['draft','reviewed'].includes(r.status))err('binding review.status must be draft or reviewed');
    if(r.status==='reviewed'&&(typeof r.by!=='string'||!r.by.trim()||!Number.isFinite(Date.parse(r.at))))err('reviewed binding requires by and at');
    if(r.status==='draft'&&(r.by!=null||r.at!=null))err('draft binding cannot claim reviewer/date');
    return clone(b);
  }
  function createBinding({id,source,fingerprints,scheduleId=null,budgetId=null,review={status:'draft'},createdAt}){
    return validateBinding({schema:BINDING_SCHEMA,schemaVersion:BINDING_VERSION,id,subject:{type:isBuilding(source)?'building':'project',id:source.id},
      fingerprints:{project:fingerprints.project,schedule:fingerprints.schedule??null,budget:fingerprints.budget??null},scheduleId,budgetId,
      review:review.status==='reviewed'?{status:'reviewed',by:review.by,at:review.at}:{status:'draft',by:null,at:null},...(createdAt?{createdAt}:{})});
  }

  /* ---------- evaluate: the presentation model ---------- */
  const issue=(severity,code,message,refs={})=>({severity,code,message,refs});
  const ROLE_RULES={
    wall:{new:['structure','build','finish','cladding'],existing:['finish','cladding'],demolished:['demolition']},
    opening:{new:['build','finish'],existing:['finish','build'],demolished:[]},
    floor:{undeclared:['build','finish']},roof:{new:['envelope','build','finish'],existing:['finish']},slab:{new:['structure','build'],existing:['finish']}};
  const family=t=>['window','door','sliding-door','opening'].includes(t)?'opening':t;
  async function evaluate({source,schedule=null,budget=null,budgets=null,binding=null}={}){
    const inv=inventory(source),issues=[],now={project:await fingerprint(source),schedule:null,budget:null};
    const byKey=new Map(inv.elements.map(e=>[e.key,e]));
    let sch=null,planning={status:'unavailable',reason:'missing',message:'PLANIFICACION NO DISPONIBLE O PENDIENTE',evidence:null};
    if(schedule){
      try{sch=Schedule.canonical(schedule);now.schedule=await fingerprint(Schedule.validate(schedule));}
      catch(e){issues.push(issue('error','schedule-invalid',e.message));}
    }
    if(sch){
      planning={status:'available',reason:null,message:null,evidence:Schedule.evidence(schedule).level,reviewed:sch.review.status==='reviewed'};
      if(sch.projectRef.type!==inv.kind||sch.projectRef.id!==inv.id)issues.push(issue('error','schedule-other-project','El plan pertenece a '+sch.projectRef.type+' '+sch.projectRef.id,{schedule:sch.id}));
      else if(sch.projectRef.revision!==now.project)issues.push(issue('warning','schedule-project-revision-obsolete','El plan se aprobo sobre otra revision del proyecto',{expected:sch.projectRef.revision,current:now.project}));
    }else if(!schedule)issues.push(issue('warning','planning-unavailable','PLANIFICACION NO DISPONIBLE O PENDIENTE: no se inventan fechas ni tareas'));
    // Links: the schedule's own task.elements (FT3D-8 0.2.0) are the single source of element<->task links.
    const links=[],linked=new Map();
    for(const t of sch?.tasks||[])for(const el of t.elements){
      const e=byKey.get(el.elementId);let status='ok';
      if(!e){status='broken';issues.push(issue('error','link-unknown-element','La tarea '+t.id+' apunta a '+el.elementId+', que no existe en el proyecto',{taskId:t.id,elementKey:el.elementId}));}
      else{
        if(!e.representable){status='not-representable';issues.push(issue('warning','link-not-representable',el.elementId+' no tiene representacion: '+(e.unavailableReason||'no disponible'),{taskId:t.id,elementKey:e.key}));}
        const rules=ROLE_RULES[family(e.type)];const allowed=rules?(rules[e.lifecycle]||[]):[];
        if(rules&&!allowed.includes(el.role)){status='role-mismatch';issues.push(issue('error','role-status-mismatch','Rol '+el.role+' incompatible con '+e.type+' '+e.lifecycle+' ('+e.key+')',{taskId:t.id,elementKey:e.key,role:el.role}));}
      }
      links.push({elementKey:el.elementId,taskId:t.id,role:el.role,status});
      if(e){if(!linked.has(e.key))linked.set(e.key,[]);linked.get(e.key).push({taskId:t.id,role:el.role});}
    }
    // Timeline class of every element: scheduled, pre-existing, or unscheduled (never given an invented date).
    const visualElements=inv.elements.filter(e=>e.type!=='object').map(e=>{
      const roles=(linked.get(e.key)||[]).map(l=>l.role),appears=roles.some(r=>APPEAR.includes(r)),removed=roles.some(r=>REMOVE.includes(r));
      let timeline;
      if(e.lifecycle==='demolished')timeline=removed?'scheduled':'unscheduled';
      else if(e.lifecycle==='existing')timeline='pre-existing';
      else if(e.lifecycle==='undeclared')timeline=appears?'scheduled':roles.length?'pre-existing':'unscheduled';
      else timeline=appears?'scheduled':'unscheduled';
      if(timeline==='unscheduled'&&e.representable&&sch)issues.push(issue('warning',e.lifecycle==='demolished'?'demolition-unscheduled':'element-unscheduled',
        e.key+' ('+e.type+') no tiene tarea que lo '+(e.lifecycle==='demolished'?'demuela':'construya')+': se muestra como pendiente',{elementKey:e.key}));
      return {key:e.key,type:e.type,levelId:e.levelId,lifecycle:e.lifecycle,evidence:e.evidence.status,representable:e.representable,timeline,tasks:linked.get(e.key)||[]};
    });
    // Costs: only the selected C1-C4 budget whose subject is this document.
    let costs={status:'unavailable',reason:'missing',report:null};
    if(inv.kind==='building'){
      costs={status:'unavailable',reason:'building-budget-not-supported',report:null,levels:(budgets||[]).map(x=>({levelId:x.levelId,budgetId:x.budget.id,subject:{...x.budget.subject}})),
        message:'RUBIK guarda un presupuesto por planta (rubik-budget-v1[projectId]); no existe presupuesto de edificio que repartir entre tareas'};
      issues.push(issue('warning','building-budget-not-supported',costs.message));
    }else if(budget){
      now.budget=await fingerprint(budget);
      if(!budget.subject||budget.subject.id!==inv.id)issues.push(issue('error','budget-other-project','El presupuesto pertenece a '+(budget.subject&&budget.subject.id)));
      else if(sch){
        try{costs={status:'available',reason:null,report:Schedule.budgetReport(schedule,budget,Budget)};}
        catch(e){issues.push(issue('error','budget-report-failed',e.message));costs={status:'unavailable',reason:'report-failed',report:null};}
      }else{const calc=Budget.calculateBudget(budget);costs={status:'budget-only',reason:'planning-unavailable',report:null,totals:calc.totals.net,budgetId:calc.budgetId};}
    }else issues.push(issue('warning','budget-unavailable','PRESUPUESTO NO DISPONIBLE: no se muestran importes'));
    // Obsolescence against the professional's binding (when present).
    const obsolete={project:'unknown',schedule:'unknown',budget:'unknown'};
    let bnd=null;
    if(binding){
      try{bnd=validateBinding(binding);}catch(e){issues.push(issue('error','binding-invalid',e.message));}
      if(bnd){
        if(bnd.subject.id!==inv.id)issues.push(issue('error','binding-other-project','El vinculo pertenece a '+bnd.subject.id));
        for(const k of ['project','schedule','budget']){
          if(bnd.fingerprints[k]===null)obsolete[k]=now[k]===null?'not-applicable':'unbound';
          else obsolete[k]=bnd.fingerprints[k]===now[k]?'current':'obsolete';
          if(obsolete[k]==='obsolete')issues.push(issue('warning',k+'-revision-obsolete','La revision actual de '+k+' no es la aprobada en el vinculo',{bound:bnd.fingerprints[k],current:now[k]}));
        }
        if(sch&&bnd.scheduleId!==sch.id)issues.push(issue('error','binding-other-schedule','El vinculo se aprobo para el plan '+bnd.scheduleId));
        if(budget&&bnd.budgetId!==null&&bnd.budgetId!==budget.id)issues.push(issue('error','binding-other-budget','El vinculo se aprobo para el presupuesto '+bnd.budgetId));
      }
    }else issues.push(issue('info','binding-missing','Sin documento de vinculo: las revisiones no estan fijadas por un profesional'));
    // Coverage: shows its gaps.
    const eligible=visualElements,rep=eligible.filter(e=>e.representable),report=costs.report;
    const coverage={
      elements:{total:eligible.length,representable:rep.length,notRepresentable:eligible.filter(e=>!e.representable).map(e=>e.key),
        linked:eligible.filter(e=>e.tasks.length).length,unlinked:eligible.filter(e=>!e.tasks.length).map(e=>e.key),
        scheduled:eligible.filter(e=>e.timeline==='scheduled').length,preExisting:eligible.filter(e=>e.timeline==='pre-existing').length,
        unscheduled:eligible.filter(e=>e.timeline==='unscheduled').map(e=>e.key),
        byEvidence:Object.fromEntries(EVIDENCE.map(s=>[s,eligible.filter(e=>e.evidence===s).length]))},
      tasks:sch?{total:sch.tasks.length,withoutElements:sch.tasks.filter(t=>!t.elements.length).map(t=>t.id),
        withoutBudget:sch.tasks.filter(t=>!t.budgetAllocations.length).map(t=>t.id),datesApproved:sch.review.status==='reviewed'}:null,
      budget:report?{items:report.byTask.flatMap(t=>t.budgetItemIds).filter((v,i,a)=>a.indexOf(v)===i).length+report.unassignedBudgetItemIds.length,
        unassignedItemIds:[...report.unassignedBudgetItemIds],pendingAllocations:clone(report.pendingAllocations),
        unknownItemIds:[...report.budgetTotals.missingItemIds],allocatedKnownNet:report.scheduleTotals.allocatedKnownNet,budgetKnownNet:report.budgetTotals.amount,
        allocatedPercentOfKnown:report.budgetTotals.amount?Math.round(report.scheduleTotals.allocatedKnownNet/report.budgetTotals.amount*10000)/100:null,
        tasksWithoutCost:report.byTask.filter(t=>t.totalNet===null).map(t=>t.taskId),unverifiedTasks:report.byTask.filter(t=>t.lines.length&&!t.verified).map(t=>t.taskId),
        projectRevisionCheck:report.projectRevision.check}:null,
      revisions:{...obsolete}};
    // Delivery level (B7). Never a "fully verified project" label.
    const errors=issues.filter(i=>i.severity==='error'),blockers=[];
    const need=(cond,code)=>{if(!cond)blockers.push(code);return cond;};
    let level='internal';
    const orient=need(planning.status==='available','planning-unavailable')&need(!errors.length,'errors-present');
    if(orient){level='orientative';
      const approved=need(planning.reviewed,'schedule-draft')&need(bnd?.review.status==='reviewed','binding-not-reviewed')
        &need(!Object.values(obsolete).includes('obsolete')&&obsolete.project==='current','revision-obsolete-or-unbound')
        &need(!coverage.elements.unscheduled.length,'elements-unscheduled');
      if(approved){level='approved-plan';
        const linkedEls=eligible.filter(e=>e.tasks.length);
        const pro=need(linkedEls.every(e=>e.evidence==='verified'),'geometry-not-verified')&need(costs.status==='available','costs-unavailable')
          &need(report&&!report.pendingAllocations.length&&!report.unassignedBudgetItemIds.length&&!report.budgetTotals.missingItemIds.length,'budget-coverage-incomplete')
          &need(report&&report.byTask.every(t=>!t.lines.length||t.verified),'budget-lines-unverified');
        if(pro)level='professional';
      }
    }
    const LABEL={internal:'Vista interna exploratoria',orientative:'Presentacion orientativa (plan no aprobado o incompleto)',
      'approved-plan':'Presentacion de plan aprobado (no certifica ejecucion)',professional:'Entrega profesional con evidencias registradas (no certifica ejecucion ni obra)'};
    return {schema:MODEL_SCHEMA,schemaVersion:MODEL_VERSION,subject:{type:inv.kind,id:inv.id,name:inv.name,updatedAt:inv.updatedAt},
      fingerprints:now,inventory:inv,planning,links,visualElements,costs,coverage,issues,obsolescence:obsolete,
      delivery:{level,label:LABEL[level],blockers,simulation:'Simulacion planificada e ilustrativa: no es obra ejecutada ni certificada',
        // What the system checked vs what only a professional declared. Nothing here certifies built work.
        assurances:{
          geometry:'derivada de FloorPlanCore.geometry / FloorPlanRoof; evidencia segun escala y origen declarados',
          projectRevision:obsolete.project==='current'?'huella SHA-256 coincide con la aprobada en el vinculo':obsolete.project,
          budgetToProject:report?(report.projectRevision.check==='match'?'verificada por el motor':'no verificable por C1-C4; '+(bnd?.review.status==='reviewed'&&obsolete.budget==='current'?'emparejamiento declarado por el profesional en el vinculo':'sin declaracion vigente')):'sin presupuesto',
          execution:'no registrada (fuera del alcance de FT3D-8)',certification:'no aplica: FT3D-8 no certifica obra'}}};
  }
  return Object.freeze({BINDING_SCHEMA,BINDING_VERSION,MODEL_SCHEMA,MODEL_VERSION,EVIDENCE,DELIVERY,NOT_IN_AUTHORITY,VIEWER_DEFAULTS,ROLE_RULES,
    elementKey,fingerprint,validateSource,levelsOf,scaleEvidence,sourceEvidence,inventory,validateBinding,createBinding,evaluate});
});
