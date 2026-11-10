/* ENT-01 · Contract of the client's read-only 3D delivery («rubik-sota.client-delivery», version 1).
   Pure module: no DOM, network or storage. Selectively rebuilt from PR #166 (js/delivery-core.js) on the current
   master, with the gaps found in the 09/11 audit closed:
   - the delivered project is minimised field by field (not only its top level) and then validated STRICTLY with the
     canonical validators already in master (FloorPlanCore.validate / FloorPlanBuilding.validate): one authority for
     geometry, no second schema;
   - a snapshot received from the network is checked the same way, is refused if any field the minimisation removes is
     present, and is refused if it contains any URL or anything that looks like a credential;
   - presentation room ids must exist in the delivered project.
   Three different things, never confused: A the editable project (source of truth, never modified here); B the prepared
   presentation (rooms and order); C this delivery, a versioned snapshot of exactly what the 3D visit needs.
   What the client's browser receives can be inspected by the client: nothing here is secret or «impossible to recover».
   Publishing, reading (/api/delivery) and withdrawing a delivery are NOT part of this module: they depend on GOV-08 S1
   and S2 (see docs/technical/ent01-client-delivery-contract.md). UMD: FloorPlanClientDelivery / module.exports. */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./project-core.js'):root.FloorPlanCore,node?require('./building-core.js'):root.FloorPlanBuilding);
 if(node)module.exports=api;else root.FloorPlanClientDelivery=api;
})(typeof globalThis==='object'?globalThis:this,function(Core,Building){
 'use strict';
 const SCHEMA='rubik-sota.client-delivery',VERSION=1;
 // 4 MB: the limit api/share.js (S1) already applies to any published file; Vercel caps a function request at 4.5 MB.
 const MAX_BYTES=4*1024*1024,MAX_HERO=900*1024,MAX_LOGO=120*1024,MAX_LEVELS=12,MAX_SIDECAR_ROOMS=200;
 const ENVELOPE=['schema','version','deliveryId','createdAt','source','title','lang','studio','hero','capabilities','presentation','provenance','content'];
 // Project fields the 3D visit needs. Everything else of the editable project stays with the professional.
 const PROJECT_KEEP=['schema','schemaVersion','id','name','createdAt','updatedAt','units','coordinateSystem','scale','defaults','walls','openings','rooms','materials','objects','roofParapet'];
 const PROJECT_DROPPED=['measurements','app','extensions','site (except northOffsetDeg)','sourceImages (only a bare reference for the scale calibration)','scale.note','walls[].source','walls[].structureSource','openings[].source','rooms[].source'];
 const BUILDING_KEEP=['schema','schemaVersion','id','name','createdAt','updatedAt','units','levels','stairs'];
 const LEVEL_KEEP=['id','name','order','elevationMm','slabThicknessMm','offsetMm'];
 // Minimal image reference that keeps a «real» scale valid: never the image, its name, size in bytes, hash, path or placement.
 const IMAGE_REF_KEYS=['id','mediaType','widthPx','heightPx','storage','visible'];
 const clone=v=>v===undefined?undefined:JSON.parse(JSON.stringify(v));
 const pick=(o,keys)=>{const out={};for(const k of keys)if(o&&o[k]!==undefined)out[k]=clone(o[k]);return out;};
 const omit=(o,keys)=>{const out=clone(o);for(const k of keys)delete out[k];return out;};
 const finite=v=>typeof v==='number'&&Number.isFinite(v);
 const fail=m=>{throw Error('client-delivery: '+m);};
 const siteOf=s=>s&&finite(s.northOffsetDeg)?{northOffsetDeg:s.northOffsetDeg}:undefined;
 function imageRefs(p){
  const ids=new Set([p.scale?.calibration?.sourceImageId,p.scale?.verification?.sourceImageId].filter(Boolean));
  return (p.sourceImages||[]).filter(i=>ids.has(i.id)).map(i=>({id:i.id,mediaType:i.mediaType,widthPx:i.widthPx,heightPx:i.heightPx,storage:{kind:'local-browser'},visible:false}));
 }
 // Field-by-field minimisation of one FloorPlanProjectV1 level. Pure: the input is never modified.
 function minimizeProject(p){
  if(!p||typeof p!=='object'||p.schema!=='rubik-sota.floorplan-project')fail('project missing');
  const out=pick(p,PROJECT_KEEP);
  if(out.scale)delete out.scale.note;
  out.walls=(out.walls||[]).map(w=>omit(w,['source','structureSource']));
  out.openings=(out.openings||[]).map(o=>omit(o,['source']));
  out.rooms=(out.rooms||[]).map(r=>omit(r,['source']));
  const site=siteOf(p.site);if(site)out.site=site;
  const refs=imageRefs(p);if(refs.length)out.sourceImages=refs;
  return out;
 }
 function minimizeBuilding(b){
  if(!b||b.schema!=='rubik-sota.floorplan-building'||!Array.isArray(b.levels))fail('building missing');
  const out=pick(b,BUILDING_KEEP);const site=siteOf(b.site);if(site)out.site=site;
  out.levels=b.levels.map(l=>({...pick(l,LEVEL_KEEP),project:minimizeProject(l.project)}));
  return out;
 }
 // Strict validation with master's own validators (single authority for geometry and fields).
 function validateContent(c){
  if(!c||typeof c!=='object'||!!c.project===!!c.building)fail('content');
  if(c.building){if(c.building.levels.length>MAX_LEVELS)fail('levels');try{Building.validate(c.building);}catch(e){fail('building: '+e.message);}return c.building.levels.map(l=>({levelId:l.id,project:l.project}));}
  try{Core.validate(c.project,{strict:true});}catch(e){fail('project: '+e.message);}
  return [{levelId:null,project:c.project}];
 }
 const same=(a,b)=>JSON.stringify(a)===JSON.stringify(b);
 // Defence in depth: a delivery carries no URL at all (no external resource for the client's browser to fetch) and
 // nothing shaped like a credential. Images travel only as data: URLs in hero/logo, checked separately.
 const URL_RE=/^\s*(?:[a-z][a-z0-9+.-]*:)?\/\//i,SCHEME_RE=/^\s*(?:javascript|vbscript|file|blob|data):/i;
 const SECRET_RE=/vercel_blob_rw_|\bsk-[A-Za-z0-9_-]{16,}|RUBIK_(?:RENDER|SHARE)_TOKEN|OPENAI_API_KEY|BLOB_READ_WRITE_TOKEN|-----BEGIN [A-Z ]*PRIVATE KEY/;
 function scanStrings(v,path,skip){
  if(typeof v==='string'){if(skip.has(path))return;if(URL_RE.test(v)||SCHEME_RE.test(v))fail('url at '+path);if(SECRET_RE.test(v))fail('secret-like value at '+path);return;}
  if(Array.isArray(v)){v.forEach((x,i)=>scanStrings(x,path+'/'+i,skip));return;}
  if(v&&typeof v==='object')for(const [k,x] of Object.entries(v)){if(SECRET_RE.test(k))fail('secret-like key at '+path);scanStrings(x,path+'/'+k,skip);}
 }
 const safeText=(s,max)=>typeof s==='string'?s.replace(/[\u0000-\u001f\u007f]/g,' ').trim().slice(0,max):'';
 const dataImage=(s,max,types=['image/jpeg','image/png'])=>typeof s==='string'&&s.length<=max&&types.some(t=>s.startsWith('data:'+t+';base64,'))&&/^data:image\/(?:jpeg|png);base64,[A-Za-z0-9+/]+=*$/.test(s)?s:null;
 function randomId(rand){const a='abcdefghijkmnpqrstuvwxyz23456789';let s='';for(let i=0;i<16;i++)s+=a[Math.floor(rand()*a.length)%a.length];return 'dlv_'+s;}
 function sidecarsFor(levels,list){
  return (Array.isArray(list)?list:[]).map(s=>{const lv=levels.find(x=>x.project.id===s?.projectId&&(s.levelId==null||x.levelId===s.levelId));if(!lv)return null;
   const known=new Set((lv.project.rooms||[]).map(r=>r.id));
   return {projectId:lv.project.id,levelId:lv.levelId,roomIds:[...new Set((s.roomIds||[]).filter(id=>known.has(id)))].slice(0,MAX_SIDECAR_ROOMS)};}).filter(s=>s&&s.roomIds.length);
 }
 /* input: {project | building, presentation:{sidecars:[{projectId, levelId?, roomIds}]}, revision, versionCode,
    studio:{name, logo?}, hero?:dataURL, title, lang, now:Date, rand:()=>[0,1)}. The source project is never modified. */
 function buildSnapshot(input){
  if(!input||typeof input!=='object')fail('input');
  const now=input.now instanceof Date&&Number.isFinite(input.now.getTime())?input.now:new Date(),rand=typeof input.rand==='function'?input.rand:Math.random;
  const content=input.building?{building:minimizeBuilding(input.building)}:{project:minimizeProject(input.project)};
  const levels=validateContent(content);
  const sidecars=sidecarsFor(levels,input.presentation?.sidecars);
  const walk=levels.some(l=>(l.project.walls||[]).length>0&&(l.project.rooms||[]).length>0);
  const doc=content.building||content.project;
  const snap={schema:SCHEMA,version:VERSION,deliveryId:randomId(rand),createdAt:now.toISOString(),
   source:{kind:content.building?'building':'project',id:doc.id,revision:safeText(input.revision||'',80),versionCode:safeText(input.versionCode||'',40)},
   title:safeText(input.title||doc.name||'',120),lang:['es','en','zh'].includes(input.lang)?input.lang:'es',
   studio:{name:safeText(input.studio?.name||'',120),logo:dataImage(input.studio?.logo,MAX_LOGO,['image/png'])},
   hero:dataImage(input.hero,MAX_HERO),capabilities:{walk,guided:sidecars.length>0},
   presentation:{scope:content.building?'building':'project',sidecars,levels:levels.map((l,i)=>({levelId:l.levelId,name:safeText(content.building?.levels[i].name||'',80),order:content.building?.levels[i].order??0}))},
   provenance:{geometry:'project',furniture:'project',materials:'project',context:'none'},content};
  return validate(snap);
 }
 // Strict validation of a snapshot from the network (client viewer, publishing endpoint, reading endpoint).
 function validate(s,{bytes}={}){
  if(bytes!==undefined&&!(Number.isFinite(bytes)&&bytes<=MAX_BYTES))fail('too large');
  if(!s||typeof s!=='object'||Array.isArray(s))fail('not an object');
  if(s.schema!==SCHEMA)fail('schema');if(s.version!==VERSION)fail('version');
  for(const k of Object.keys(s))if(!ENVELOPE.includes(k))fail('field '+k);
  let size;try{size=new TextEncoder().encode(JSON.stringify(s)).length;}catch{fail('not serialisable');}if(size>MAX_BYTES)fail('too large');
  if(typeof s.deliveryId!=='string'||!/^dlv_[a-z0-9]{16}$/.test(s.deliveryId))fail('id');
  if(typeof s.createdAt!=='string'||!Number.isFinite(Date.parse(s.createdAt)))fail('date');
  const src=s.source;if(!src||!['project','building'].includes(src.kind)||typeof src.id!=='string'||typeof src.revision!=='string'||typeof src.versionCode!=='string'||Object.keys(src).some(k=>!['kind','id','revision','versionCode'].includes(k)))fail('source');
  if(typeof s.title!=='string'||s.title.length>120||!['es','en','zh'].includes(s.lang))fail('title/lang');
  if(!s.studio||typeof s.studio.name!=='string'||s.studio.name.length>120||Object.keys(s.studio).some(k=>!['name','logo'].includes(k)))fail('studio');
  if(s.studio.logo!==null&&s.studio.logo!==undefined&&!dataImage(s.studio.logo,MAX_LOGO,['image/png']))fail('logo');
  if(s.hero!==null&&s.hero!==undefined&&!dataImage(s.hero,MAX_HERO))fail('hero');
  const cap=s.capabilities;if(!cap||typeof cap.walk!=='boolean'||typeof cap.guided!=='boolean'||Object.keys(cap).length!==2)fail('capabilities');
  if(!s.provenance||s.provenance.context!=='none')fail('provenance');
  const levels=validateContent(s.content);
  // Nothing the minimisation removes may be present: a hand-edited snapshot cannot smuggle source images, parcel,
  // location, measurements, provenance notes or app data back in.
  if(s.content.project&&!same(minimizeProject(s.content.project),s.content.project))fail('fields outside the delivery contract');
  if(s.content.building&&!same(minimizeBuilding(s.content.building),s.content.building))fail('fields outside the delivery contract');
  if((src.kind==='building')!==!!s.content.building||src.id!==(s.content.building||s.content.project).id)fail('source mismatch');
  const p=s.presentation;if(!p||!Array.isArray(p.sidecars)||!Array.isArray(p.levels))fail('presentation');
  for(const x of p.sidecars){const lv=levels.find(l=>l.project.id===x?.projectId&&l.levelId===(x.levelId??null));
   if(!lv||!Array.isArray(x.roomIds)||!x.roomIds.length||x.roomIds.length>MAX_SIDECAR_ROOMS)fail('sidecar');
   const known=new Set(lv.project.rooms.map(r=>r.id));if(x.roomIds.some(id=>typeof id!=='string'||!known.has(id)))fail('sidecar room');}
  if(cap.guided!==(p.sidecars.length>0))fail('capabilities');
  scanStrings(s,'',new Set(['/hero','/studio/logo']));
  return s;
 }
 // What of the editable project a delivery leaves out (for the professional's explanation and the tests).
 function excluded(p){
  const out=[];for(const k of Object.keys(p||{}))if(!PROJECT_KEEP.includes(k)&&k!=='site')out.push(k);
  if(p?.site&&Object.keys(p.site).some(k=>k!=='northOffsetDeg'))out.push('site.'+Object.keys(p.site).filter(k=>k!=='northOffsetDeg').join('/'));
  if(p?.scale?.note!==undefined)out.push('scale.note');
  for(const [list,keys] of [['walls',['source','structureSource']],['openings',['source']],['rooms',['source']]])
   for(const k of keys)if((p?.[list]||[]).some(x=>x&&x[k]!==undefined))out.push(`${list}[].${k}`);
  return out;
 }
 return Object.freeze({SCHEMA,VERSION,MAX_BYTES,MAX_HERO,MAX_LOGO,PROJECT_KEEP,PROJECT_DROPPED,IMAGE_REF_KEYS,minimizeProject,minimizeBuilding,buildSnapshot,validate,excluded});
});
