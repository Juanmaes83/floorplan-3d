/* FT3D-8 · M1 · S3 — associate a parcel with ONE subject (project or building, at a revision), keep the explicit
   placement, and decide what may leave RUBIK. Pure; no network, no storage.
   Reuses the durable contracts: site.parcel (FloorPlanParcelSiteAdapter), buildingPlacement + northOffsetDeg
   (FloorPlanTerritoryIntegration) and the export policy (FloorPlanTerritoryExportPolicy).
   Rules (Documento Maestro §9.3-5, FT8-S3-03/04/07):
   - a parcel only ever lands on the subject it was asked for; other subjects are returned untouched;
   - a different parcel (other reference or other geometry) replaces the saved one ONLY with explicit confirmation,
     and the placement/orthophoto/terrain that depended on the old parcel are dropped and reported (never moved);
   - the same parcel again keeps everything (placement included);
   - a failed lookup never changes anything (the caller keeps the previous site);
   - restricted/unknown geometry is never exported; the reference and attribution are exported as text. */
(function(root){
 'use strict';
 const node=typeof module==='object'&&module.exports;
 const Parcel=node?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const Adapter=node?require('./parcel-site-adapter.js'):root.FloorPlanParcelSiteAdapter;
 const Territory=node?require('./territory-integration-core.js'):root.FloorPlanTerritoryIntegration;
 const Policy=node?require('./territory-export-policy.js'):root.FloorPlanTerritoryExportPolicy;
 if(!Parcel||!Adapter||!Territory||!Policy)throw new Error('FloorPlanParcelAssociation requires ParcelCore, ParcelSiteAdapter, TerritoryIntegration and TerritoryExportPolicy');
 const VERSION='1.0.0';
 const DEPENDENT=Object.freeze(['buildingPlacement','orthophoto','terrain']);
 const CHANNELS=Object.freeze(['screen','video','html','snapshot']);
 const fail=m=>{throw new TypeError('FloorPlanParcelAssociation: '+m);};
 const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const freeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);Object.values(o).forEach(freeze);}return o;};
 function subjectOf(s){
  if(!s||!['project','building'].includes(s.type)||typeof s.id!=='string'||!s.id.trim())fail('subject {type:project|building,id,revision?} required');
  return {type:s.type,id:s.id,revision:typeof s.revision==='string'&&s.revision?s.revision:null};
 }
 // Geometry fingerprint (FNV-1a 64 over the canonical parcel): same reference + CRS + geometry ⇒ same value.
 function fingerprint(parcel){
  const p=Parcel.normalizeParcel(parcel),text=JSON.stringify([p.reference,p.sourceCrs,p.sourceGeometry]);
  let h=0xcbf29ce484222325n;const k=0x100000001b3n,m=(1n<<64n)-1n;for(let i=0;i<text.length;i++){h^=BigInt(text.charCodeAt(i));h=(h*k)&m;}
  return 'pcl_'+h.toString(16).padStart(16,'0');
 }
 /* Decide what associating `result` (an available GeoProvider parcel result) to `subject` would do to its `site`.
    Returns a plan; nothing changes until apply(plan,{confirmed}). */
 function plan(site,subject,result){
  const subj=subjectOf(subject);
  if(!result||result.status!=='available')return freeze({ok:false,subject:subj,action:'none',reason:result?.reason||'no-result',message:'No se ha obtenido ninguna parcela: no cambia nada de lo guardado.'});
  let incoming;try{incoming=Adapter.toSiteParcel(result);}catch{return freeze({ok:false,subject:subj,action:'none',reason:'invalid-parcel',message:'La parcela recibida no es válida: no cambia nada de lo guardado.'});}
  const current=site?.parcel||null,fpNew=fingerprint(incoming),fpOld=current?fingerprint(current):null;
  const dropped=current?DEPENDENT.filter(k=>site[k]!==undefined):[];
  let action;
  if(!current)action='add';
  else if(fpOld===fpNew)action='same';
  else if(current.reference===incoming.reference)action='update-geometry';
  else action='replace';
  const needsConfirmation=action==='update-geometry'||action==='replace';
  const next=action==='same'?clone(site):(()=>{const n={...clone(site||{}),parcel:incoming};for(const k of DEPENDENT)delete n[k];return n;})();
  return freeze({ok:true,subject:subj,action,needsConfirmation,fingerprint:fpNew,previousFingerprint:fpOld,reference:incoming.reference,previousReference:current?.reference||null,
   dropped:action==='same'||action==='add'?[]:dropped,keepsPlacement:action==='same'&&!!site?.buildingPlacement,provider:incoming.source.providerId,next,
   message:action==='add'?'Se asociará la parcela a este proyecto. La vivienda no se coloca sola: después la colocas tú.':
    action==='same'?'Es la misma parcela que ya está guardada: no cambia nada, la colocación se conserva.':
    `${action==='replace'?'Esta referencia es distinta de la guardada':'La geometría oficial ha cambiado'}: sustituirla requiere tu confirmación${dropped.length?' y quitará la colocación y las capas que dependían de la parcela anterior':''}.`});
 }
 // Apply a plan to a library of subjects ({[subjectId]: {site, revision}}): only that subject changes.
 function apply(library,p,{confirmed=false}={}){
  if(!p?.ok)fail('nothing to apply');
  if(p.needsConfirmation&&confirmed!==true)fail('replacing a saved parcel requires explicit confirmation');
  const entry=library?.[p.subject.id];if(!entry)fail(`unknown subject ${p.subject.id}`);
  if(p.subject.revision&&entry.revision&&p.subject.revision!==entry.revision)fail('the project revision changed since the plan; prepare it again');
  const out={...library,[p.subject.id]:{...entry,site:clone(p.next),association:association(p)}};
  return out;
 }
 function association(p){return freeze({version:VERSION,subject:clone(p.subject),reference:p.reference,fingerprint:p.fingerprint,providerId:p.provider});}
 // Verify a stored association against the current subject and site (S1 correspondence vocabulary).
 function verify(assoc,subject,site){
  const subj=subjectOf(subject);
  if(!assoc)return 'absent';
  if(assoc.subject.id!==subj.id||assoc.subject.type!==subj.type)return 'mismatch';
  if(!site?.parcel)return 'absent';
  if(fingerprint(site.parcel)!==assoc.fingerprint)return 'mismatch';
  if(assoc.subject.revision&&subj.revision&&assoc.subject.revision!==subj.revision)return 'obsolete';
  if(!assoc.subject.revision||!subj.revision)return 'unverifiable';
  return 'match';
 }
 /* Explicit placement (FT8-S3-04): the professional gives the anchor in the model and on the parcel; north must be
    configured. Returns the new site; validated by the territory core (exact transform, round trip ≤ 0.001 mm). */
 function place(site,{modelAnchorMm,parcelLocalAnchorMm,northOffsetDeg}={}){
  const next={...clone(site),...(northOffsetDeg!==undefined?{northOffsetDeg}:{})};
  next.buildingPlacement={horizontal:{modelAnchorMm:clone(modelAnchorMm),parcelLocalAnchorMm:clone(parcelLocalAnchorMm),source:{type:'user-entered'}}};
  Territory.validate(next);return next;
 }
 function roundTrip(site,points){
  let max=0;for(const p of points){const q=Territory.parcelToModel(site,Territory.modelToParcel(site,p));max=Math.max(max,Math.hypot(q.x-p.x,q.y-p.y));}
  return {maxErrorMm:max,withinTolerance:max<=Territory.EPS.mm};
 }
 /* What each channel may carry (FT8-S3-07). Geometry only when the licence allows it (not-applicable, or verified
    with attribution); otherwise the reference and the attribution travel as text. */
 function exportView(site,channel){
  if(!CHANNELS.includes(channel))fail('channel must be '+CHANNELS.join(', '));
  const parcel=site?.parcel;if(!parcel)return freeze({channel,includeGeometry:false,text:null,attribution:[],reason:'no-parcel'});
  const decision=Policy.layer(parcel.source,true),internal=channel==='screen';
  const credit=parcel.source.attribution||parcel.source.sourceName||null;
  return freeze({channel,includeGeometry:internal?decision.canDisplay:decision.canExport,
   text:`Referencia catastral ${parcel.reference}${credit?' · Fuente: '+credit:''}`,attribution:credit?[credit]:[],
   licenseStatus:parcel.source.license?.status||'unknown',reason:internal?'internal-display':decision.canExport?'license-allows-export':'license-does-not-allow-export'});
 }
 // Context layers (FT8-S3-06): optional, never loaded automatically, never used to infer excavation or certified topography.
 function contextLayers(site,registry){
  const meta=id=>{try{return registry.inspect(id);}catch{return null;}};
  const row=(key,id)=>{const m=meta(id),saved=!!site?.[key];
   return {key,providerId:id,available:!!m,requested:saved,network:m?.network||null,license:m?.license?.status||'unknown',attribution:m?.attribution||null,
    status:!m?'unavailable':saved?'saved':'not-requested',requiresParcel:true,
    note:'Contexto opcional. No es levantamiento topográfico ni sirve para deducir excavaciones o movimientos de tierras.'};};
  return freeze([row('orthophoto','ign-pnoa-ma-wms'),row('terrain','ign-mdt05-terrain')]);
 }
 const api=Object.freeze({VERSION,DEPENDENT,CHANNELS,fingerprint,plan,apply,verify,place,roundTrip,exportView,contextLayers});
 if(node)module.exports=api;else root.FloorPlanParcelAssociation=api;
})(globalThis);
