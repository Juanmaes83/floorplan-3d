/* FT3D-8 · S1 construction dossier (FloorPlanConstructionDossier): proves, read-only, that a RUBIK project/building, its
   C1-C4 budget(s), its FT3D-8 plan, its binding, its parcel/placement and the studio brand belong to the SAME dossier.
   Contract: docs/product/ft3d-8-s1b-contrato-expediente-2026-11-05.md (rubik-sota.construction-dossier 0.1.0).
   - Nothing is recomputed outside its authority: geometry/links/coverage come from FloorPlanConstructionProject
     (FloorPlanCore/FloorPlanBuilding), amounts from FloorPlanBudget.calculateBudget, dates from the FT3D-8 plan,
     parcel from site.parcel (FloorPlanParcelSiteAdapter), placement transforms from FloorPlanTerritoryIntegration,
     export rights from FloorPlanTerritoryExportPolicy, the geometry revision from FloorPlanGuide.revision (the one the
     editor itself uses).
   - Identity is checked by type+id and SHA-256 fingerprints, never by names. Every comparison ends in one of
     match | mismatch | obsolete | absent | unverifiable; "unverifiable" never counts as a match.
   - Conflicts are reported with both values and resolution 'none': no source silently replaces another.
   - No DOM, no network, no storage, no mutation of the input documents. */
(function(root,factory){
  const req=typeof module==='object'&&module.exports;
  const deps=req?{Adapter:require('./construction-project-adapter.js'),Schedule:require('./construction-schedule-core.js'),
    Budget:require('./budget-core.js'),Building:require('./building-core.js'),Core:require('./project-core.js'),Guide:require('./guide-core.js'),
    Parcel:require('./parcel-core.js'),ParcelSite:require('./parcel-site-adapter.js'),Territory:require('./territory-integration-core.js'),
    Policy:require('./territory-export-policy.js'),Brand:require('./brand-core.js')}
    :{Adapter:root.FloorPlanConstructionProject,Schedule:root.FloorPlanConstructionSchedule,Budget:root.FloorPlanBudget,Building:root.FloorPlanBuilding,
      Core:root.FloorPlanCore,Guide:root.FloorPlanGuide,Parcel:root.FloorPlanParcelCore,ParcelSite:root.FloorPlanParcelSiteAdapter,
      Territory:root.FloorPlanTerritoryIntegration,Policy:root.FloorPlanTerritoryExportPolicy,Brand:root.FloorPlanBrand};
  const api=factory(deps);
  if(req)module.exports=api;else root.FloorPlanConstructionDossier=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  for(const [n,v] of Object.entries(deps))if(!v)throw new TypeError('FloorPlanConstructionDossier requires '+n);
  const {Adapter,Schedule,Budget,Building,Core,Guide,Parcel,ParcelSite,Territory,Policy,Brand}=deps;
  const SCHEMA='rubik-sota.construction-dossier',VERSION='0.1.0',VERSIONS=Object.freeze(['0.1.0']);
  const EVAL_SCHEMA='rubik-sota.construction-dossier-evaluation',EVAL_VERSION='0.1.0';
  const RESULTS=Object.freeze(['match','mismatch','obsolete','absent','unverifiable']);
  // Limits derived from the real contracts (S1-B §8): GML from FloorPlanParcelCore, logo from FloorPlanBrand.
  const LIMITS=Object.freeze({jsonBytes:8*1024*1024,jsonDepth:64,gmlBytes:Parcel.LIMITS.documentBytes,logoBytes:Brand.LOGO_MAX_BYTES});
  // Placement checks are exact rotations + translations: the tolerance only absorbs floating point rounding.
  const TOLERANCE_MM=0.001;
  const BUDGET_SCHEMA='rubik-sota.floorplan-budget',PROJECT_SCHEMA='rubik-sota.floorplan-project';
  // Human messages (D7). The technical code stays in the professional diagnostics panel.
  const MESSAGES=Object.freeze({
    'project-invalid':'El proyecto no es válido para RUBIK y no se puede usar',
    'budget-invalid':'El presupuesto no es válido para el motor C1–C4',
    'budget-other-project':'El presupuesto pertenece a otro proyecto',
    'budget-selection-required':'Hay varios presupuestos de este proyecto: elige cuál se usa',
    'budget-selection-invalid':'El presupuesto elegido no pertenece a este expediente',
    'budget-unavailable':'Todavía no hay un presupuesto asociado',
    'level-budget-not-building':'Es el presupuesto de una planta: no se presenta como presupuesto del edificio',
    'building-budget-not-supported':'RUBIK guarda un presupuesto por planta: no hay un total del edificio',
    'building-budgets-not-summed':'Se muestran los presupuestos de cada planta por separado, sin sumarlos',
    'budget-project-revision-unverifiable':'El presupuesto no indica sobre qué revisión del proyecto se hizo',
    'budget-revision-obsolete':'El presupuesto ha cambiado desde que se fijó el vínculo',
    'planning-unavailable':'Todavía no hay una planificación asociada',
    'schedule-invalid':'La planificación no es válida',
    'schedule-other-project':'La planificación pertenece a otro proyecto',
    'schedule-project-revision-obsolete':'La planificación se hizo sobre otra revisión del proyecto',
    'schedule-revision-obsolete':'La planificación ha cambiado desde que se fijó el vínculo',
    'project-revision-obsolete':'El proyecto ha cambiado desde que se fijó el vínculo',
    'binding-missing':'No hay vínculo profesional: las revisiones no están fijadas',
    'binding-invalid':'El vínculo no es válido',
    'binding-other-project':'El vínculo pertenece a otro proyecto',
    'binding-other-schedule':'El vínculo se aprobó para otra planificación',
    'binding-other-budget':'El vínculo se aprobó para otro presupuesto',
    'link-unknown-element':'Una tarea apunta a un elemento que no existe en este proyecto',
    'parcel-absent':'Este proyecto no tiene parcela guardada',
    'parcel-document-invalid':'El archivo GML no se puede usar',
    'parcel-association-missing':'El GML no está asociado a ningún proyecto',
    'parcel-other-project':'La parcela está asociada a otro proyecto',
    'parcel-reference-mismatch':'La parcela necesita comprobarse: la referencia del archivo no es la del proyecto',
    'parcel-geometry-differs':'La parcela necesita comprobarse: su geometría no coincide con la guardada',
    'parcel-candidate-unplaced':'Parcela recibida, pero el proyecto no la tiene guardada: no se coloca',
    'parcel-evidence-not-loaded':'El expediente registra un GML que no se ha vuelto a cargar',
    'placement-absent':'El edificio no está colocado en la parcela',
    'placement-invalid':'La colocación guardada no es válida',
    'placement-anchor-outside-parcel':'El punto de colocación queda fuera de la parcela',
    'placement-footprint-outside-parcel':'Parte de la huella del modelo queda fuera de la parcela',
    'territory-not-exportable':'La parcela se puede ver aquí, pero su licencia no permite incluirla en el archivo del cliente',
    'brand-absent':'No hay marca profesional en el expediente',
    'brand-other-project':'La marca está asociada a otro proyecto',
    'brand-association-missing':'La marca no indica a qué proyecto se aplica',
    'brand-invalid':'La marca no es válida',
    'dossier-altered':'El expediente se modificó después de prepararlo',
    'dossier-version-unsupported':'Versión de expediente no compatible',
    'dossier-other-subject':'El expediente declara otro proyecto',
    'import-too-large':'El archivo supera el tamaño admitido',
    'import-too-deep':'El archivo tiene una estructura demasiado profunda',
    'import-not-json':'El archivo no es JSON',
    'import-not-gml':'El archivo no es GML',
    'import-malformed':'El archivo está dañado o incompleto',
    'import-unknown-kind':'No se reconoce el tipo de documento'});
  const human=(code,fallback)=>MESSAGES[code]||fallback||code;
  class DossierError extends Error{constructor(code,detail){super(human(code)+(detail?': '+detail:''));this.name='DossierError';this.code=code;this.detail=detail||null;}}
  const fail=(code,detail)=>{throw new DossierError(code,detail);};
  const clone=x=>x===undefined?undefined:JSON.parse(JSON.stringify(x));
  const sha=async text=>Building.sha256(text);
  const fp=async doc=>doc===null||doc===undefined?null:Adapter.fingerprint(doc);
  const isBuilding=d=>d?.schema===Building.SCHEMA;

  /* ---------- safe import (C4) ---------- */
  const bytesOf=s=>typeof TextEncoder!=='undefined'?new TextEncoder().encode(s).length:s.length*3;
  const firstChar=s=>{const t=s.replace(/^﻿/,'').trimStart();return t[0]||'';};
  function depthOf(value){let max=0;const stack=[[value,1]];
    while(stack.length){const [v,d]=stack.pop();if(d>max)max=d;if(max>LIMITS.jsonDepth)return max;if(v&&typeof v==='object')for(const k in v)if(v[k]&&typeof v[k]==='object')stack.push([v[k],d+1]);}
    return max;}
  function readJson(text,{maxBytes=LIMITS.jsonBytes}={}){
    if(typeof text!=='string')fail('import-malformed','se esperaba texto');
    if(bytesOf(text)>maxBytes)fail('import-too-large',Math.round(maxBytes/1048576)+' MiB máximo');
    if(firstChar(text)!=='{')fail('import-not-json');
    let value;try{value=JSON.parse(text.replace(/^﻿/,''));}catch{fail('import-malformed');}
    if(depthOf(value)>LIMITS.jsonDepth)fail('import-too-deep');
    return value;
  }
  // Identifies a document by its content (schema), never by the file extension.
  function kindOf(doc){
    if(!doc||typeof doc!=='object'||Array.isArray(doc))return null;
    if(doc.schema===SCHEMA)return 'dossier';
    if(doc.schema===PROJECT_SCHEMA)return 'project';
    if(doc.schema===Building.SCHEMA)return 'building';
    if(doc.schema===BUDGET_SCHEMA)return 'budget';
    if(doc.schema===Schedule.SCHEMA)return 'schedule';
    if(doc.schema===Adapter.BINDING_SCHEMA)return 'binding';
    if(doc.profile&&typeof doc.profile==='object'&&'takenAt' in doc)return 'brand';
    return null;
  }
  // GML: size and content sniffing here; the parsing itself is the real Catastro provider (injected in the browser).
  function checkGml(text){
    if(typeof text!=='string')fail('import-malformed','se esperaba texto');
    if(bytesOf(text)>LIMITS.gmlBytes)fail('import-too-large',LIMITS.gmlBytes+' bytes máximo');
    if(firstChar(text)!=='<')fail('import-not-gml');
    return text;
  }
  async function readParcelDocument(text,{provider,fileName='parcela.gml',associatedWith=null}={}){
    checkGml(text);
    if(!provider||typeof provider.getParcel!=='function')fail('parcel-document-invalid','proveedor de parcelas no disponible');
    const result=await provider.getParcel({mode:'document',text});
    return {fileName:String(fileName).slice(0,200),sha256:await sha(text),result:clone(result),associatedWith:associatedWith?{type:associatedWith.type,id:associatedWith.id}:null};
  }

  /* ---------- fingerprints by aspect (S1-B §9) ---------- */
  // Geometry revision: the editor's own FloorPlanGuide.revision (walls, openings, rooms, objects, materials, defaults,
  // scale, sourceImages, measurements). A rename or a parcel change does not move it; a wall or an opening does.
  function geometryText(doc){
    if(!isBuilding(doc))return Guide.revision(doc);
    const b=Building.canonical?JSON.parse(Building.canonical(doc)):clone(doc);
    return JSON.stringify({units:b.units,stairs:b.stairs,levels:b.levels.map(l=>({...l,name:undefined,project:Guide.revision(l.project)}))});
  }
  async function aspects({project,budgets=[],schedule=null,binding=null,brand=null}){
    const site=project?.site;
    return {project:await fp(project),geometry:project?await sha(geometryText(project)):null,site:site?await fp(site):null,
      budgets:Object.fromEntries(await Promise.all(budgets.map(async b=>[b.id,await fp(b)]))),
      schedule:await fp(schedule),binding:await fp(binding),brand:brand?.snapshot?await fp(brand.snapshot):null};
  }

  /* ---------- budgets (C1-C4 is the only source of amounts) ---------- */
  const priceRef=r=>r?{providerId:r.providerId,itemId:r.itemId,code:r.code,unit:r.unit,unitPrice:r.unitPrice,
    edition:r.source.edition,region:r.source.region,asOf:r.source.asOf,retrievedAt:r.source.retrievedAt,
    licenseStatus:r.source.licenseStatus,attribution:r.source.attribution,label:r.source.label}:null;
  function budgetView(budget){
    const calc=Budget.calculateBudget(budget);
    const provenance=calc.lines.map(l=>({itemId:l.id,description:l.description,unit:l.quantity.unit,quantity:l.quantity.value,quantityStatus:l.quantity.status,
      unitPrice:l.unitPrice,priceSource:clone(l.priceSource),priceReference:priceRef(l.priceReference),review:l.review.status,
      // Known vs reviewed are different: a price may be known and still unreviewed.
      priceStatus:l.unitPrice===null?'unknown':l.review.status==='reviewed'?'reviewed':'known-unreviewed',
      origin:l.priceSource===null?'none':l.priceSource.type==='provider-reference'?l.priceSource.providerId:'manual'}));
    return {budgetId:calc.budgetId,title:calc.title,subject:clone(calc.subject),schemaVersion:budget.schemaVersion,currency:calc.currency,taxRatePercent:calc.taxRatePercent,
      // Net / tax / gross are separate and keep their completeness; C1-C4 has no discounts.
      totals:{net:clone(calc.totals.net),tax:clone(calc.totals.tax),gross:clone(calc.totals.gross)},discounts:'not-in-contract',
      items:calc.lines.length,unpricedItemIds:[...calc.totals.unpricedItemIds],unreviewedPriceItemIds:[...calc.totals.unreviewedPriceItemIds],
      incompleteQuantityItemIds:[...calc.totals.incompleteQuantityItemIds],provenance};
  }

  /* ---------- territory ---------- */
  function insideRing(p,ring){let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const [xi,yi]=ring[i],[xj,yj]=ring[j];
    if((yi>p.y)!==(yj>p.y)&&p.x<(xj-xi)*(p.y-yi)/(yj-yi)+xi)inside=!inside;}return inside;}
  const insideParcel=(p,geom)=>geom.polygons.some(poly=>insideRing(p,poly.rings[0])&&!poly.rings.slice(1).some(h=>insideRing(p,h)));
  const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<=TOLERANCE_MM;
  function modelCorners(doc){
    const projects=isBuilding(doc)?doc.levels.map(l=>({p:l.project,o:l.offsetMm})):[{p:doc,o:{x:0,y:0}}];
    const pts=[];for(const {p,o} of projects){let b;try{b=Core.geometry(p).bounds;}catch{continue;}
      if(!b||!Number.isFinite(b.w)||b.w<=0)continue;
      for(const [x,y] of [[b.x,b.y],[b.x+b.w,b.y],[b.x+b.w,b.y+b.h],[b.x,b.y+b.h]])pts.push({x:x+o.x,y:y+o.y});}
    return pts;
  }
  const sameGeometry=(a,b)=>JSON.stringify(a.sourceGeometry)===JSON.stringify(b.sourceGeometry)&&a.sourceCrs===b.sourceCrs;
  function territory(doc,subject,parcelDoc,registered,issue,conflicts,corr){
    const site=doc.site||null,out={status:'absent',parcel:null,evidence:null,placement:{status:'not-placed',checks:[]},layers:{},northOffsetDeg:site?.northOffsetDeg??null};
    let saved=null;
    if(site?.parcel){
      try{const r=ParcelSite.fromSiteParcel(site.parcel);saved=r.parcel;
        out.parcel={reference:r.parcel.reference,sourceCrs:r.parcel.sourceCrs,frame:clone(r.parcel.frame),providerId:r.provenance.providerId,
          sourceType:r.provenance.type,licenseStatus:r.provenance.license?.status??null,attribution:r.provenance.attribution??null,persisted:true};
        out.status='project-site';out.layers.parcel=Policy.layer(site.parcel.source,true);
        if(!out.layers.parcel.canExport)issue('info','territory-not-exportable',{reason:out.layers.parcel.reason});
      }catch(e){issue('error','parcel-document-invalid',{detail:'site.parcel: '+e.message});}
    }else issue('info','parcel-absent');
    // Runtime layers: only their metadata is persisted; pixels/grids are never in a dossier.
    for(const k of ['orthophoto','terrain'])if(site?.[k])out.layers[k]={...Policy.layer(site[k].source,false),persisted:'metadata',runtime:'not-loaded'};
    // Evidence: a GML explicitly associated with this subject. It never replaces nor places the saved parcel.
    if(parcelDoc){
      const r=parcelDoc.result,ev={fileName:parcelDoc.fileName,sha256:parcelDoc.sha256,associatedWith:clone(parcelDoc.associatedWith),status:'rejected',reason:null,reference:null};
      out.evidence=ev;
      if(!r||r.status!=='available'){ev.reason=r?.reason||'provider-error';issue('error','parcel-document-invalid',{reason:ev.reason});corr('parcel','parcel-document','mismatch','parcel-document-invalid');}
      else{
        let cand=null;try{cand=ParcelSite.toSiteParcel(r);}catch(e){ev.reason='invalid-result';issue('error','parcel-document-invalid',{detail:e.message});}
        if(cand){ev.reference=cand.reference;ev.sourceCrs=cand.sourceCrs;ev.licenseStatus=cand.source.license?.status??null;ev.attribution=cand.source.attribution??null;
          const a=parcelDoc.associatedWith;
          if(!a){ev.status='unassociated';issue('warning','parcel-association-missing');corr('parcel','parcel-document','unverifiable','parcel-association-missing');}
          else if(a.type!==subject.type||a.id!==subject.id){ev.status='other-project';issue('error','parcel-other-project',{associatedWith:a});
            conflicts.push({code:'parcel-other-project',message:human('parcel-other-project'),values:{dossier:{...subject},parcel:a},resolution:'none'});corr('parcel','subject','mismatch','parcel-other-project');}
          else if(!saved){ev.status='candidate';out.status=out.status==='absent'?'candidate-unplaced':out.status;issue('warning','parcel-candidate-unplaced',{reference:cand.reference});corr('parcel','project-site','absent','parcel-candidate-unplaced');}
          else if(cand.reference!==saved.reference){ev.status='conflict';out.status='conflict';issue('error','parcel-reference-mismatch',{saved:saved.reference,document:cand.reference});
            conflicts.push({code:'parcel-reference-mismatch',message:human('parcel-reference-mismatch'),values:{projectSite:saved.reference,document:cand.reference},resolution:'none'});corr('parcel','project-site','mismatch','parcel-reference-mismatch');}
          else if(!sameGeometry(cand,saved)){ev.status='geometry-differs';out.status='conflict';issue('warning','parcel-geometry-differs',{reference:saved.reference});
            conflicts.push({code:'parcel-geometry-differs',message:human('parcel-geometry-differs'),values:{projectSite:saved.sourceCrs,document:cand.sourceCrs},resolution:'none'});corr('parcel','project-site','mismatch','parcel-geometry-differs');}
          else{ev.status='match';corr('parcel','project-site','match','parcel-document-matches');}
        }
      }
    }else if(registered){
      out.evidence={...clone(registered),status:'registered-not-loaded'};issue('info','parcel-evidence-not-loaded',{reference:registered.reference});
      if(saved&&registered.reference&&registered.reference!==saved.reference){issue('error','parcel-reference-mismatch',{saved:saved.reference,document:registered.reference});
        conflicts.push({code:'parcel-reference-mismatch',message:human('parcel-reference-mismatch'),values:{projectSite:saved.reference,document:registered.reference},resolution:'none'});corr('parcel','project-site','mismatch','parcel-reference-mismatch');}
      else corr('parcel','parcel-document','unverifiable','parcel-evidence-not-loaded');
    }
    if(saved&&!parcelDoc&&!registered)corr('parcel','project-site','match','parcel-from-project');
    if(!saved&&!parcelDoc&&!registered)corr('parcel','project-site','absent','parcel-absent');
    // Placement: never proposed; when saved, checked numerically through the territorial authority.
    if(site?.buildingPlacement&&saved&&out.status!=='conflict'){
      try{Territory.validate(site);
        const h=site.buildingPlacement.horizontal,checks=out.placement.checks,a=Territory.modelToParcel(site,h.modelAnchorMm);
        checks.push({check:'anchor-maps-to-parcel-anchor',ok:near(a,h.parcelLocalAnchorMm),errorMm:Math.hypot(a.x-h.parcelLocalAnchorMm.x,a.y-h.parcelLocalAnchorMm.y),toleranceMm:TOLERANCE_MM});
        const corners=modelCorners(doc);let worst=0,outside=0;
        for(const c of corners){const back=Territory.parcelToModel(site,Territory.modelToParcel(site,c));worst=Math.max(worst,Math.hypot(back.x-c.x,back.y-c.y));
          if(!insideParcel(Territory.localToSource(saved.frame,Territory.modelToParcel(site,c)),saved.sourceGeometry))outside++;}
        checks.push({check:'model-parcel-model-roundtrip',ok:worst<=TOLERANCE_MM,errorMm:worst,toleranceMm:TOLERANCE_MM,points:corners.length});
        const src=Territory.localToSource(saved.frame,h.parcelLocalAnchorMm),inside=insideParcel(src,saved.sourceGeometry);
        checks.push({check:'anchor-inside-parcel',ok:inside,anchorSource:{x:src.x,y:src.y,crs:saved.sourceCrs}});
        checks.push({check:'footprint-corners-inside-parcel',ok:outside===0,outside,points:corners.length});
        if(site.buildingPlacement.vertical)checks.push({check:'model-zero-elevation',ok:Territory.elevationToModel(site,site.buildingPlacement.vertical.modelZeroElevationM)===0,
          modelZeroElevationM:site.buildingPlacement.vertical.modelZeroElevationM,verticalReference:site.buildingPlacement.vertical.verticalReference});
        if(!inside)issue('warning','placement-anchor-outside-parcel');
        if(outside)issue('warning','placement-footprint-outside-parcel',{outside,points:corners.length});
        out.placement={status:checks.every(c=>c.ok||c.check.startsWith('footprint')||c.check==='anchor-inside-parcel')?'placed':'invalid',source:'user-entered',
          northOffsetDeg:site.northOffsetDeg,modelAnchorMm:clone(h.modelAnchorMm),parcelLocalAnchorMm:clone(h.parcelLocalAnchorMm),checks,
          levels:isBuilding(doc)?doc.levels.map(l=>({levelId:l.id,modelAnchorMm:clone(Territory.rebaseForLevel(site,l).buildingPlacement.horizontal.modelAnchorMm)})):null};
        if(out.placement.status==='invalid')issue('error','placement-invalid');
      }catch(e){out.placement={status:'invalid',checks:[],error:e.message};issue('error','placement-invalid',{detail:e.message});}
    }else if(saved&&!site?.buildingPlacement)issue('info','placement-absent');
    return out;
  }

  /* ---------- package (assemble / open) ---------- */
  async function assemble({project,budgets=[],selectedBudgetIds=null,schedule=null,binding=null,parcelDocument=null,brand=null,assembledAt=new Date().toISOString()}){
    const kind=Adapter.validateSource(project);
    const subject={type:kind,id:project.id};
    const ev=parcelDocument&&parcelDocument.result?.status==='available'?{format:'gml',fileName:parcelDocument.fileName,sha256:parcelDocument.sha256,
      reference:parcelDocument.result.parcel.reference,associatedWith:clone(parcelDocument.associatedWith)}:null;
    const parts={project:clone(project),budgets:clone(budgets),schedule:clone(schedule),binding:clone(binding),parcelEvidence:ev,
      brand:brand?{snapshot:clone(brand.snapshot),appliesTo:brand.appliesTo?{type:brand.appliesTo.type,id:brand.appliesTo.id}:null}:null};
    const fingerprints=await aspects(parts);
    const body={schema:SCHEMA,schemaVersion:VERSION,id:'dos_'+(await sha(JSON.stringify(fingerprints))).slice(0,16),assembledAt,route:'local-package',subject,
      selection:{budgetIds:selectedBudgetIds?[...selectedBudgetIds]:null,scheduleId:schedule?.id??null},parts,fingerprints};
    return {...body,fingerprint:await fp(body)};
  }
  async function openPackage(pkg){
    if(!pkg||pkg.schema!==SCHEMA)fail('import-unknown-kind');
    if(!VERSIONS.includes(pkg.schemaVersion))fail('dossier-version-unsupported',String(pkg.schemaVersion));
    const p=pkg.parts||{};if(!p.project)fail('import-malformed','el expediente no contiene proyecto');
    const {fingerprint,...body}=pkg,now=await aspects(p),changed=[];
    for(const k of ['project','geometry','site','schedule','binding','brand'])if((pkg.fingerprints?.[k]??null)!==now[k])changed.push(k);
    for(const id of new Set([...Object.keys(pkg.fingerprints?.budgets||{}),...Object.keys(now.budgets)]))if(pkg.fingerprints?.budgets?.[id]!==now.budgets[id])changed.push('budget:'+id);
    const integrity=!changed.length&&fingerprint===await fp(body)?'verified':'altered';
    return {integrity,changed,id:pkg.id,assembledAt:pkg.assembledAt,declaredSubject:clone(pkg.subject),
      input:{project:clone(p.project),budgets:clone(p.budgets||[]),selectedBudgetIds:pkg.selection?.budgetIds??null,schedule:clone(p.schedule),binding:clone(p.binding),
        parcelDocument:null,registeredParcel:clone(p.parcelEvidence),brand:clone(p.brand)}};
  }

  /* ---------- evaluation ---------- */
  async function evaluate({project,budgets=[],selectedBudgetIds=null,schedule=null,binding=null,parcelDocument=null,registeredParcel=null,brand=null,opened=null}={}){
    const issues=[],conflicts=[],correspondence=[];
    const issue=(severity,code,detail=null,message)=>issues.push({severity,code,message:human(code,message),detail:clone(detail),origin:'dossier'});
    const corr=(authority,against,result,code)=>correspondence.push({authority,against,result,code,message:human(code,code)});
    let kind;
    try{kind=Adapter.validateSource(project);}catch(e){
      issue('error','project-invalid',{detail:e.message});
      return Object.freeze({schema:EVAL_SCHEMA,schemaVersion:EVAL_VERSION,usable:{model:false,timelapse:false,costs:false,territory:false,delivery:false,reasons:['project-invalid']},issues,conflicts,correspondence});
    }
    const subject={type:kind,id:project.id,name:project.name};
    const levelProjects=kind==='building'?project.levels.map(l=>({levelId:l.id,projectId:l.project.id,name:l.name})):[];
    // Package integrity and declared subject.
    if(opened){
      if(opened.integrity==='altered')issue('error','dossier-altered',{changed:opened.changed});
      if(opened.declaredSubject&&(opened.declaredSubject.type!==subject.type||opened.declaredSubject.id!==subject.id))issue('error','dossier-other-subject',{declared:opened.declaredSubject});
    }
    corr('project','validator','match',kind==='building'?'building-valid':'project-valid');
    // Budgets: classify by subject identity; amounts only through calculateBudget.
    const valid=[],views=[];
    for(const b of budgets){let clean;try{clean=Budget.validateBudget(b);}catch(e){issue('error','budget-invalid',{budgetId:b?.id??null,detail:e.message});corr('budget','validator','mismatch','budget-invalid');continue;}
      const s=clean.subject,lvl=levelProjects.find(l=>s.type==='project'&&l.projectId===s.id);
      const role=s.type===kind&&s.id===project.id?'subject':lvl?'level':'other';
      if(role==='other'){issue('error','budget-other-project',{budgetId:b.id,subject:s});corr('budget','subject','mismatch','budget-other-project');
        conflicts.push({code:'budget-other-project',message:human('budget-other-project'),values:{dossier:{type:kind,id:project.id},budget:{...s}},resolution:'none'});continue;}
      valid.push({doc:b,role,levelId:lvl?.levelId??null});corr('budget','subject','match',role==='level'?'budget-of-level':'budget-of-subject');}
    let selected=null;
    if(selectedBudgetIds&&selectedBudgetIds.length){
      const pick=valid.filter(v=>selectedBudgetIds.includes(v.doc.id));
      if(pick.length!==selectedBudgetIds.length)issue('error','budget-selection-invalid',{selectedBudgetIds});
      selected=pick;
    }else{const own=valid.filter(v=>v.role==='subject');
      if(own.length>1){issue('warning','budget-selection-required',{budgetIds:own.map(v=>v.doc.id)});selected=valid.filter(v=>v.role==='level');}
      else selected=[...own,...valid.filter(v=>v.role==='level')];}
    for(const v of selected)views.push({...budgetView(v.doc),role:v.role,levelId:v.levelId,fingerprint:await fp(v.doc)});
    const subjectBudget=selected.find(v=>v.role==='subject')?.doc||null,levelBudgets=selected.filter(v=>v.role==='level');
    let scope='none';
    if(subjectBudget)scope=kind==='building'?'building':'project';
    else if(levelBudgets.length===1)scope='level';
    else if(levelBudgets.length>1){scope='levels-not-summed';issue('info','building-budgets-not-summed',{levels:levelBudgets.map(v=>v.levelId)});}
    if(views.length)corr('budget','project-revision','unverifiable','budget-project-revision-unverifiable');
    // The FT3D-8 presentation model (geometry, links, plan, costs, binding, coverage, delivery level) is reused as is.
    const adapterBudget=subjectBudget||(kind==='building'&&levelBudgets.length===1?levelBudgets[0].doc:null);
    const model=await Adapter.evaluate({source:project,schedule,budget:adapterBudget,budgets:levelBudgets.map(v=>({levelId:v.levelId,budget:v.doc})),binding});
    for(const i of model.issues)issues.push({...i,message:human(i.code,i.message),technical:i.message,origin:'adapter'});
    // Plan correspondence.
    if(!schedule)corr('schedule','subject','absent','planning-unavailable');
    else if(model.planning.status==='rejected')corr('schedule','subject','mismatch',model.planning.reason);
    else{corr('schedule','subject','match','schedule-of-subject');
      const s=Schedule.canonical(schedule);corr('schedule','project-revision',s.projectRef.revision===model.fingerprints.project?'match':'obsolete',
        s.projectRef.revision===model.fingerprints.project?'schedule-project-revision-current':'schedule-project-revision-obsolete');}
    // Binding: per authority (current|obsolete|unbound|missing-document|not-applicable -> the five results).
    const MAP={current:'match',obsolete:'obsolete',unbound:'unverifiable','missing-document':'absent','not-applicable':'absent',unknown:'absent'};
    if(binding)for(const [k,v] of Object.entries(model.obsolescence))corr('binding',k,MAP[v]||'absent',v==='obsolete'?k+'-revision-obsolete':'binding-'+k+'-'+v);
    else corr('binding','subject','absent','binding-missing');
    if(model.issues.some(i=>i.code==='binding-other-project'))conflicts.push({code:'binding-other-project',message:human('binding-other-project'),values:{dossier:project.id,binding:binding?.subject?.id??null},resolution:'none'});
    if(model.planning.status==='rejected'&&model.planning.reason==='schedule-other-project')
      conflicts.push({code:'schedule-other-project',message:human('schedule-other-project'),values:{dossier:{type:kind,id:project.id},schedule:clone(Schedule.canonical(schedule).projectRef)},resolution:'none'});
    // Territory.
    const terr=territory(project,{type:kind,id:project.id},parcelDocument,registeredParcel,issue,conflicts,corr);
    // Brand: FloorPlanBrand keeps no project identity, so the association is the one declared in the dossier.
    let brandView={status:'absent'};
    if(brand?.snapshot){
      try{const prof=Brand.normalizeProfile(brand.snapshot.profile,{id:brand.snapshot.profile?.id});
        const a=brand.appliesTo;brandView={status:'snapshot',name:prof.name,takenAt:brand.snapshot.takenAt??null,fingerprint:await fp(brand.snapshot),appliesTo:clone(a)};
        if(!a){brandView.status='unassociated';issue('warning','brand-association-missing');corr('brand','subject','unverifiable','brand-association-missing');}
        else if(a.type!==kind||a.id!==project.id){brandView.status='other-project';issue('error','brand-other-project',{appliesTo:a});corr('brand','subject','mismatch','brand-other-project');
          conflicts.push({code:'brand-other-project',message:human('brand-other-project'),values:{dossier:{type:kind,id:project.id},brand:clone(a)},resolution:'none'});}
        else corr('brand','subject','match','brand-of-subject');
      }catch(e){brandView={status:'invalid'};issue('error','brand-invalid',{detail:e.message});corr('brand','validator','mismatch','brand-invalid');}
    }else corr('brand','subject','absent','brand-absent');
    // Fingerprints and dossier identity (derived, never invented).
    const fingerprints=await aspects({project,budgets:selected.map(v=>v.doc),schedule:model.planning.status==='available'?schedule:null,binding,brand});
    const id=opened?.id||('dos_'+(await sha(JSON.stringify(fingerprints))).slice(0,16));
    const errors=issues.filter(i=>i.severity==='error');
    // Usability (what the timelapse, the costs and the delivery may use) and the delivery level.
    const reasons=errors.map(i=>i.code);
    const usable={model:true,timelapse:model.planning.status==='available',costs:model.costs.status==='available'&&!issues.some(i=>i.code==='budget-other-project'),
      territory:terr.status==='project-site'||terr.status==='candidate-unplaced',delivery:model.planning.status==='available'&&!errors.length&&opened?.integrity!=='altered',reasons};
    const delivery={...clone(model.delivery)};
    if(errors.length){delivery.level='internal';delivery.label='Vista interna: el expediente tiene incompatibilidades';delivery.blockers=[...new Set(['dossier-errors',...delivery.blockers])];}
    // What each channel may carry (S1-B §11). Territorial geometry follows the export policy, nothing else.
    const parcelExport=!!terr.layers.parcel?.canExport;
    const exportPolicy={
      internal:{parcelGeometry:!!terr.parcel,costs:usable.costs,note:'Solo en este navegador: nada se envía'},
      package:{editableDocuments:true,parcelGeometry:'dentro de site.parcel del proyecto, tal como lo exporta RUBIK',gmlText:false,rasters:false},
      capture:{syntheticOnly:true},
      video:{parcelGeometry:parcelExport,orthophoto:!!terr.layers.orthophoto?.canExport,terrain:!!terr.layers.terrain?.canExport,costs:'según la política de costes'},
      html:{editableDocuments:false,parcelGeometry:parcelExport,parcelReferenceText:!!terr.parcel,attribution:terr.layers.parcel?.requiredAttribution||[],costs:'según la política de costes'},
      publicLink:{enabled:false,reason:'Publicación real no autorizada en S1 (solo pruebas simuladas)'}};
    const sev={error:0,warning:1,info:2};issues.sort((a,b)=>sev[a.severity]-sev[b.severity]);
    return Object.freeze({schema:EVAL_SCHEMA,schemaVersion:EVAL_VERSION,
      dossier:{id,route:opened?'local-package':'local-documents',integrity:opened?opened.integrity:'not-packaged',assembledAt:opened?.assembledAt??null,
        changed:opened?.changed??[],fingerprint:await sha(JSON.stringify({subject:{type:kind,id:project.id},fingerprints}))},
      subject:{...subject,levels:levelProjects},fingerprints,
      authorities:{project:{status:'loaded',schemaVersion:project.schemaVersion,updatedAt:project.updatedAt,fingerprint:fingerprints.project,geometryRevision:fingerprints.geometry},
        budget:{scope,selected:views,rejected:budgets.length-valid.length,adapterBudgetId:adapterBudget?.id??null,message:scope==='levels-not-summed'?human('building-budgets-not-summed'):scope==='level'?human('level-budget-not-building'):scope==='none'?human('budget-unavailable'):null},
        schedule:{status:!schedule?'absent':model.planning.status,id:schedule?.id??null,fingerprint:fingerprints.schedule},
        binding:{status:binding?(model.issues.some(i=>i.code==='binding-invalid')?'invalid':'loaded'):'absent',obsolescence:clone(model.obsolescence)},
        territory:terr,brand:brandView},
      correspondence,conflicts,coverage:clone(model.coverage),delivery,usable,exportPolicy,issues,model});
  }

  /* ---------- invalidation between two evaluations (S1-B §9) ---------- */
  function invalidation(prev,next){
    if(!prev||!next||!prev.fingerprints||!next.fingerprints)return {subjectChanged:true,changed:['all'],invalidates:{links:true,costs:true,territory:true,delivery:true},history:'kept'};
    const subjectChanged=prev.subject.type!==next.subject.type||prev.subject.id!==next.subject.id,a=prev.fingerprints,b=next.fingerprints,changed=[];
    for(const k of ['geometry','project','site','schedule','binding','brand'])if(a[k]!==b[k])changed.push(k);
    if(JSON.stringify(a.budgets)!==JSON.stringify(b.budgets))changed.push('budget');
    const has=k=>subjectChanged||changed.includes(k);
    return {subjectChanged,changed:subjectChanged?['subject',...changed]:changed,
      invalidates:{links:has('geometry')||has('schedule'),costs:has('budget')||has('schedule'),territory:has('site')||has('geometry'),
        delivery:subjectChanged||changed.length>0},
      // Downloaded deliveries are frozen files: they are never rewritten, only superseded.
      history:'kept'};
  }
  return Object.freeze({SCHEMA,VERSION,VERSIONS,EVAL_SCHEMA,EVAL_VERSION,RESULTS,LIMITS,TOLERANCE_MM,MESSAGES,DossierError,
    human,readJson,kindOf,checkGml,readParcelDocument,aspects,geometryText,budgetView,assemble,openPackage,evaluate,invalidation});
});
