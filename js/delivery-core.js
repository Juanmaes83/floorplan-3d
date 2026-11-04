/* Delivery 3D Client Experience V1 — pure contract of the read-only 3D delivery (no DOM, no network, no storage).
   Three different things, never confused:
   A. the editable project (FloorPlanProjectV1 / FloorPlanBuildingV1, the professional's source of truth);
   B. the prepared presentation (rooms and their order per level: the presentation sidecar Rubik already stores);
   C. the client delivery: a versioned, read-only snapshot of exactly what the 3D experience needs.
   C is not a copy of A: buildSnapshot() keeps an explicit allow-list of the fields the 3D view renders (walls,
   openings, rooms, materials, objects, defaults, scale, roof parapet, north) and drops everything else (source plan
   images, measurements, app/commit info, experimental extensions, location, parcel, orthophoto, terrain, placement).
   Everything sent to the client's browser is inspectable by the client: this module never claims anything is secret.
   UMD: browser global FloorPlanDelivery; CommonJS for tests and the server endpoints. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanDelivery=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const SCHEMA='rubik-sota.client-delivery',VERSION=1,MAX_BYTES=4*1024*1024,MAX_HERO=900*1024,MAX_LOGO=120*1024;
 const PROJECT_KEEP=['schema','schemaVersion','id','name','createdAt','updatedAt','units','coordinateSystem','scale','defaults','walls','openings','rooms','materials','objects','roofParapet'];
 const PROJECT_DROPPED=['sourceImages','measurements','app','extensions','site (except north)'];
 const BUILDING_KEEP=['schema','schemaVersion','id','name','createdAt','updatedAt','units','stairs'];
 const LEVEL_KEEP=['id','name','order','elevationMm','slabThicknessMm','offsetMm'];
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const clone=v=>JSON.parse(JSON.stringify(v));
 const pick=(o,keys)=>{const out={};for(const k of keys)if(o&&o[k]!==undefined)out[k]=clone(o[k]);return out;};
 // North only: orientation is a fact of the model; location/parcel/orthophoto/terrain would expose an address and make the
 // client's browser call external providers.
 const siteOf=s=>s&&finite(s.northOffsetDeg)?{northOffsetDeg:s.northOffsetDeg}:undefined;
 function sanitizeProject(p){
  if(!p||typeof p!=='object')throw Error('delivery: project missing');
  const out=pick(p,PROJECT_KEEP),site=siteOf(p.site);if(site)out.site=site;
  return out;
 }
 function sanitizeBuilding(b){
  if(!b||!Array.isArray(b.levels))throw Error('delivery: building missing');
  const out=pick(b,BUILDING_KEEP),site=siteOf(b.site);if(site)out.site=site;
  out.levels=b.levels.map(l=>({...pick(l,LEVEL_KEEP),project:sanitizeProject(l.project)}));
  return out;
 }
 const safeText=(s,max)=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):'';
 const dataImage=(s,max,types=['image/jpeg','image/png'])=>typeof s==='string'&&types.some(t=>s.startsWith('data:'+t+';base64,'))&&s.length<=max?s:null;
 function randomId(rand){const a='abcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<16;i++)s+=a[Math.floor(rand()*a.length)];return 'dlv_'+s;}
 /* input:
    {project | building, presentation:{sidecars:[{projectId, levelId?, roomIds:[…]}], scope:'project'|'building'},
     revision, versionCode, studio:{name, logo?}, hero?:dataURL (a real prepared view), title, lang, now:Date, rand} */
 function buildSnapshot(input){
  const now=input.now instanceof Date?input.now:new Date(),rand=input.rand||Math.random;
  const building=input.building?sanitizeBuilding(input.building):null,project=building?null:sanitizeProject(input.project);
  const projects=building?building.levels.map(l=>({levelId:l.id,levelName:l.name,order:l.order,project:l.project})):[{levelId:null,levelName:null,order:0,project}];
  const roomIdsOf=p=>new Set((p.rooms||[]).map(r=>r.id));
  const sidecars=(input.presentation?.sidecars||[]).map(s=>{const lv=projects.find(x=>x.project.id===s.projectId&&(s.levelId==null||x.levelId===s.levelId));if(!lv)return null;const known=roomIdsOf(lv.project);
   return {projectId:s.projectId,levelId:lv.levelId,roomIds:[...new Set((s.roomIds||[]).filter(id=>known.has(id)))]};}).filter(s=>s&&s.roomIds.length);
  const guided=sidecars.length>0,walk=projects.some(l=>(l.project.walls||[]).length>0&&(l.project.rooms||[]).length>0);
  return {schema:SCHEMA,version:VERSION,deliveryId:randomId(rand),createdAt:now.toISOString(),
   source:{kind:building?'building':'project',id:(building||project).id,revision:safeText(input.revision||'',80),versionCode:safeText(input.versionCode||'',40)},
   title:safeText(input.title||(building||project).name||'',120),lang:['es','en','zh'].includes(input.lang)?input.lang:'es',
   studio:{name:safeText(input.studio?.name||'',120),logo:dataImage(input.studio?.logo,MAX_LOGO,['image/png'])},
   hero:dataImage(input.hero,MAX_HERO),
   capabilities:{walk,guided},
   presentation:{scope:building?'building':'project',sidecars,levels:projects.map(l=>({levelId:l.levelId,name:safeText(l.levelName||'',80),order:l.order}))},
   provenance:{geometry:'project',furniture:'project',materials:'project',context:'none',note:'Geometry, openings, rooms, furniture and finishes come from the delivered project version. No decorative context is added.'},
   content:building?{building}:{project}};
 }
 // Strict validation of a snapshot received from the network (the client viewer and the publishing endpoint).
 function validate(s,{bytes}={}){
  const fail=m=>{throw Error('delivery: '+m);};
  if(bytes!==undefined&&bytes>MAX_BYTES)fail('too large');
  if(!s||typeof s!=='object'||s.schema!==SCHEMA)fail('schema');
  if(s.version!==VERSION)fail('version');
  if(typeof s.deliveryId!=='string'||!/^dlv_[a-z0-9]{16}$/.test(s.deliveryId))fail('id');
  if(typeof s.createdAt!=='string'||isNaN(Date.parse(s.createdAt)))fail('date');
  if(!s.capabilities||typeof s.capabilities.walk!=='boolean'||typeof s.capabilities.guided!=='boolean')fail('capabilities');
  if(s.hero!==null&&s.hero!==undefined&&!dataImage(s.hero,MAX_HERO))fail('hero');
  if(s.studio?.logo&&!dataImage(s.studio.logo,MAX_LOGO,['image/png']))fail('logo');
  const c=s.content||{};
  if(!!c.project===!!c.building)fail('content');
  const projects=c.building?(Array.isArray(c.building.levels)?c.building.levels.map(l=>l.project):fail('levels')):[c.project];
  for(const p of projects){if(!p||!Array.isArray(p.walls)||!Array.isArray(p.rooms))fail('project');
   for(const k of Object.keys(p))if(!PROJECT_KEEP.includes(k)&&k!=='site')fail('field '+k);
   if(p.site&&Object.keys(p.site).some(k=>k!=='northOffsetDeg'))fail('site');}
  const sc=s.presentation?.sidecars;if(!Array.isArray(sc))fail('presentation');
  for(const x of sc)if(!x||typeof x.projectId!=='string'||!Array.isArray(x.roomIds)||x.roomIds.some(id=>typeof id!=='string'))fail('sidecar');
  return s;
 }
 // Fields of the editable project that a delivery never carries (for the UI and the tests).
 function excluded(p){const out=[];for(const k of Object.keys(p||{}))if(!PROJECT_KEEP.includes(k)&&k!=='site')out.push(k);if(p?.site&&Object.keys(p.site).some(k=>k!=='northOffsetDeg'))out.push('site.location/parcel/orthophoto/terrain');return out;}
 return {SCHEMA,VERSION,MAX_BYTES,MAX_HERO,PROJECT_KEEP,PROJECT_DROPPED,sanitizeProject,sanitizeBuilding,buildSnapshot,validate,excluded};
});
