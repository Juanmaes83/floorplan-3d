/* FloorPlanBuildingV1 (option D of PR #50): a versioned building document that embeds one complete, independent
   FloorPlanProjectV1 1.x project per level, plus the building-level data no 1.x reader knows about (level order,
   elevation, offset and straight stairs). Pure data module: validation, editing helpers, derived geometry and the
   building ZIP layout. No DOM, storage or network. Geometry checks are orientative coherence warnings for a
   proposal tool; they are never structural or regulatory judgements. */
(function(root){
 'use strict';
 const Core=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const SCHEMA='rubik-sota.floorplan-building',VERSION='1.0.0';
 // Embedded projects must use a 1.x version this reader knows, validated strictly (no unknown fields).
 const Territory=typeof module==='object'&&module.exports?require('./territory-integration-core.js'):root.FloorPlanTerritoryIntegration;
 const PROJECT_VERSIONS=['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0','1.5.0','1.6.0','1.7.0','1.8.0','1.9.0','1.10.0','1.11.0','1.12.0'];
 const LIMITS={levels:2,stairs:4,coordMm:1000000,elevationMm:100000,slabMm:1000,nameMax:200,levelNameMax:80};
 const ID={building:/^bld_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/,level:/^lvl_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/,stair:/^str_[A-Za-z0-9][A-Za-z0-9_-]{2,63}$/};
 const MULTI_LEVEL_HINT=/level|floor|storey|story|stair|planta|nivel|piso|escalera|building|edificio/i;
 const clone=Core.clone;
 const fail=(path,message)=>{throw new Error(`${path}: ${message}`);};
 const isInt=(v,min,max)=>Number.isSafeInteger(v)&&v>=min&&v<=max;
 function dateValid(v){return typeof v==='string'&&/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d+)?Z$/.test(v)&&Number.isFinite(Date.parse(v));}
 function exactKeys(value,path,required,optional=[]){
  if(!value||typeof value!=='object'||Array.isArray(value))fail(path,'expected object');
  for(const k of required)if(!Object.hasOwn(value,k))fail(path,`missing ${k}`);
  for(const k of Object.keys(value))if(!required.includes(k)&&!optional.includes(k))fail(`${path}/${k}`,'unknown field');
 }
 function point(value,path){exactKeys(value,path,['x','y']);for(const k of ['x','y'])if(!isInt(value[k],-LIMITS.coordMm,LIMITS.coordMm))fail(`${path}/${k}`,`integer mm within ±${LIMITS.coordMm}`);}
 function text(value,path,max){if(typeof value!=='string'||!value.trim()||[...value].length>max)fail(path,`text of 1–${max} characters`);}
 // A key anywhere inside extensions that names levels or stairs would be multi-level meaning a 1.x reader ignores.
 function scanExtensions(value,path){
  if(value&&typeof value==='object')for(const [k,v]of Object.entries(value)){if(MULTI_LEVEL_HINT.test(k))fail(`${path}/${k}`,'multi-level data is not allowed inside a level project; use the building document');scanExtensions(v,`${path}/${k}`);}
 }
 function embedded(project,path){
  if(!project||typeof project!=='object')fail(path,'expected an embedded FloorPlanProjectV1 project');
  if(project.schema===SCHEMA)fail(path,'a building cannot be nested inside a level');
  if(!PROJECT_VERSIONS.includes(project.schemaVersion))fail(`${path}/schemaVersion`,`unsupported level project version ${project.schemaVersion}; supported ${PROJECT_VERSIONS.join(', ')}`);
  try{Core.validate(project,{strict:true});}catch(e){fail(path,e.message.replace(/^\/+/,'/'));}
  scanExtensions(project.extensions,`${path}/extensions`);
  for(const k of ['walls','openings','rooms','materials','objects','measurements','sourceImages'])for(const x of project[k]||[])scanExtensions(x.extensions,`${path}/${k}/${x.id}/extensions`);
 }
 // Straight stair footprint in the building frame. startMm is the middle of the first step's front edge;
 // rotationDeg is the climbing direction, clockwise in plan (x right, y down), like the 1.x contract.
 function stairFootprint(s){
  const a=s.rotationDeg*Math.PI/180,d={x:Math.cos(a),y:Math.sin(a)},n={x:-d.y,y:d.x},w=s.widthMm/2,L=s.runLengthMm,p=s.startMm;
  return [{x:p.x-n.x*w,y:p.y-n.y*w},{x:p.x+n.x*w,y:p.y+n.y*w},{x:p.x+n.x*w+d.x*L,y:p.y+n.y*w+d.y*L},{x:p.x-n.x*w+d.x*L,y:p.y-n.y*w+d.y*L}];
 }
 const toLocal=(poly,level)=>poly.map(p=>({x:p.x-level.offsetMm.x,y:p.y-level.offsetMm.y}));
 const toBuilding=(poly,level)=>poly.map(p=>({x:p.x+level.offsetMm.x,y:p.y+level.offsetMm.y}));
 function inPoly(p,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
 const areaMm2=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p.x*q.y-q.x*p.y;},0))/2;
 /* BW5: furniture over a stair. One shared computation for the warning, the 2D highlight, the stair form and the
    layout review. Footprints are the exact oriented rectangles (FloorPlanTracing.footprint), never their bounding
    boxes, and the overlap test is the separating-axis penetration of FloorPlanLayoutReview. A pair conflicts only
    with a positive penetration above CONTACT_TOLERANCE_MM: sharing an edge, touching a corner or a sub-millimetre
    overlap from rounding is contact, not a conflict. Each level is compared only with the stairs that leave from it
    (their footprint) or arrive at it (the slab void), both in that level's own frame. */
 const CONTACT_TOLERANCE_MM=1;
 const geometryLib=()=>typeof module==='object'?{T:require('./tracing-core.js'),R:require('./layout-review.js')}:{T:root.FloorPlanTracing,R:root.FloorPlanLayoutReview};
 const finiteObject=o=>o&&o.position&&o.size&&[o.position.x,o.position.y,o.size.widthMm,o.size.depthMm,o.rotationDeg].every(Number.isFinite)&&o.size.widthMm>0&&o.size.depthMm>0;
 const polyArea=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p.x*q.y-q.x*p.y;},0))/2;
 // Conflict between one footprint and one stair zone polygon (same frame), or null when they only touch or are apart.
 function zoneConflict(footprint,zone){const {R}=geometryLib(),depth=R.penetration(footprint,zone);if(!(depth>CONTACT_TOLERANCE_MM))return null;
  const overlap=R.intersection(footprint,zone);return {penetrationMm:Math.round(depth*10)/10,overlapAreaMm2:Math.round(polyArea(overlap)),overlap};}
 // Stair zones of one level: index (1-based, as shown to people), id, kind ('escalera' leaving, 'hueco' arriving) and polygon.
 function stairZonesOf(building,level){const out=[];building.stairs.forEach((s,i)=>{const kind=s.fromLevelId===level.id?'escalera':s.toLevelId===level.id?'hueco':null;
  if(kind)out.push({stairId:s.id,index:i+1,kind,polygon:toLocal(stairFootprint(s),level)});});return out;}
 // Every furniture/stair conflict of the building, or of `levelId` only; `objects` replaces that level's objects
 // (used to check an unsaved edit). Objects without finite geometry are skipped, never guessed.
 function stairConflicts(building,{levelId,objects}={}){const {T}=geometryLib(),out=[];
  for(const l of building.levels){if(levelId&&l.id!==levelId)continue;const zones=stairZonesOf(building,l);if(!zones.length)continue;
   for(const o of (objects&&l.id===levelId?objects:l.project.objects||[])){if(!finiteObject(o))continue;const footprint=T.footprint(o);
    for(const z of zones){const c=zoneConflict(footprint,z.polygon);if(c){const x={levelId:l.id,levelName:l.name,objectId:o.id,objectName:o.name||o.type,stairId:z.stairId,stairIndex:z.index,zone:z.kind,scaleConfidence:l.project.scale?.confidence||'pending',...c,footprint,stairPolygon:z.polygon};x.message=conflictMessage(x);x.summary=conflictSummary(x);out.push(x);}}}}
  return out;
 }
 const m2=mm2=>(Math.round(mm2/1e4)/100).toFixed(2).replace('.',',');
 function conflictMessage(c){return `«${c.objectName}» de «${c.levelName}» pisa ${c.zone==='hueco'?'el hueco':'la huella'} de la escalera ${c.stairIndex}: ${String(c.penetrationMm).replace('.',',')} mm de penetración y ${m2(c.overlapAreaMm2)} m² compartidos en planta. Aviso de coherencia del dibujo; no es una comprobación normativa ni bloquea nada.`;}
 const SCALE_LABEL={real:'escala confirmada',estimated:'escala estimada: medida nominal',pending:'escala pendiente: medida nominal'};
 // Short, plain wording for lists: «Planta baja: «Sofá» sobre los peldaños».
 function conflictSummary(c){return `${c.levelName}: «${c.objectName}» sobre ${c.zone==='hueco'?'el hueco de la escalera':'los peldaños'} ${c.stairIndex} · ${String(c.penetrationMm).replace('.',',')} mm (${SCALE_LABEL[c.scaleConfidence]||SCALE_LABEL.pending})`;}
 /* Derived distribution state of the whole building (every level), never stored: 'clear' when every object of every
    level with stairs could be evaluated and none conflicts; 'pending' when at least one BW5 conflict exists;
    'insufficient' when there is no conflict but some object could not be evaluated, so «clear» cannot be claimed. */
 function buildingStatus(building){
  const conflicts=stairConflicts(building),unevaluated=[];
  for(const l of building.levels)if(stairZonesOf(building,l).length)for(const o of l.project.objects||[])if(!finiteObject(o))unevaluated.push({levelId:l.id,levelName:l.name,objectId:o?.id,objectName:o?.name||o?.type||'objeto',reason:'Posición, tamaño o giro no válidos: no se puede evaluar.'});
  const levels=new Set(conflicts.map(c=>c.levelId));
  return {state:conflicts.length?'pending':unevaluated.length?'insufficient':'clear',conflicts,unevaluated,conflictLevels:levels.size,
   headline:conflicts.length?`${conflicts.length} ${conflicts.length===1?'conflicto':'conflictos'} en ${levels.size} ${levels.size===1?'planta':'plantas'}: distribución pendiente`:unevaluated.length?`Evidencia insuficiente: ${unevaluated.length} mueble(s) sin evaluar`:'Sin muebles sobre escaleras'};
 }
 // 2D labels. Display only: neither function changes the document, and room.labelAt keeps its stored value.
 // Convex polygons overlap unless an edge normal of one of them separates both (touching does not count).
 function convexOverlap(a,b){
  for(const poly of [a,b])for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length],nx=q.y-p.y,ny=p.x-q.x;
   const pa=a.map(v=>v.x*nx+v.y*ny),pb=b.map(v=>v.x*nx+v.y*ny);if(Math.max(...pa)<=Math.min(...pb)||Math.max(...pb)<=Math.min(...pa))return false;}
  return true;
 }
 // Where to anchor a room label (block `box` = {left,right,above,below} mm around the anchor) so that it stays inside
 // the room and clear of the stair zones of that level (footprints and slab voids, same frame), with `margin` mm.
 // The stored anchor wins when it is clear; otherwise the nearest clear anchor on a `step` mm grid. `prefer` lists
 // groups of polygons to keep clear as well, most important first (the editor passes the furniture): when no place is
 // clear of all of them, the last group is dropped, and so on down to the stair zones alone. When no place is clear
 // even of the stairs the stored anchor is kept with blocked:true, so a real conflict stays visible instead of hidden.
 function labelAnchor(roomPolygon,at,box,zones,{prefer=[],margin=100,step=100}={}){
  const rect=(x,y,m)=>[{x:x-box.left-m,y:y-box.above-m},{x:x+box.right+m,y:y-box.above-m},{x:x+box.right+m,y:y+box.below+m},{x:x-box.left-m,y:y+box.below+m}];
  const clear=(x,y,polys)=>{const r=rect(x,y,0),[a,,c]=r;
   return r.every(v=>inPoly(v,roomPolygon))&&!roomPolygon.some(v=>v.x>a.x&&v.x<c.x&&v.y>a.y&&v.y<c.y)&&!polys.some(z=>convexOverlap(rect(x,y,margin),z));};
  if(!zones.some(z=>convexOverlap(rect(at.x,at.y,margin),z)))return {x:at.x,y:at.y,moved:false,blocked:false};
  const xs=roomPolygon.map(v=>v.x),ys=roomPolygon.map(v=>v.y);
  for(let k=prefer.length;k>=0;k--){const polys=[...zones,...prefer.slice(0,k).flat()];let best=null;
   for(let x=Math.min(...xs);x<=Math.max(...xs);x+=step)for(let y=Math.min(...ys);y<=Math.max(...ys);y+=step){
    const d=Math.hypot(x-at.x,y-at.y);if((!best||d<best.d)&&clear(x,y,polys))best={x,y,d};}
   if(best)return {x:best.x,y:best.y,moved:true,blocked:false};}
  return {x:at.x,y:at.y,moved:false,blocked:true};
 }
 // Label of a stair inside its own footprint (level frame): along the climbing direction, centred between the
 // arrow and the side edge, kept upright, with the font reduced only when the text would not fit the footprint.
 function stairLabel(s,level,text,{fontMm=170,charEm=0.6}={}){
  const a=s.rotationDeg*Math.PI/180,d={x:Math.cos(a),y:Math.sin(a)},n={x:-d.y,y:d.x},mid=s.runLengthMm/2,side=s.widthMm/4;
  const font=Math.max(1,Math.min(fontMm,s.runLengthMm*0.85/([...text].length*charEm),s.widthMm/2*0.7));
  let angleDeg=s.rotationDeg;if(angleDeg>90&&angleDeg<270)angleDeg-=180;
  return {x:s.startMm.x-level.offsetMm.x+d.x*mid+n.x*side,y:s.startMm.y-level.offsetMm.y+d.y*mid+n.y*side,angleDeg,fontMm:Math.round(font)};
 }
 function stairInfo(building,s){
  const from=building.levels.find(l=>l.id===s.fromLevelId),to=building.levels.find(l=>l.id===s.toLevelId),riseMm=to.elevationMm-from.elevationMm;
  return {riseMm,riserMm:riseMm/s.risers,treadMm:s.runLengthMm/s.risers,footprint:stairFootprint(s)};
 }
 function validate(building){
  exactKeys(building,'/',['schema','schemaVersion','id','name','createdAt','updatedAt','units','levels','stairs'],['site']);
  if(building.schema!==SCHEMA)fail('/schema',`expected ${SCHEMA}`);
  if(!['1.0.0','1.1.0','1.2.0','1.3.0','1.4.0','1.5.0'].includes(building.schemaVersion))fail('/schemaVersion',`unsupported building version ${building.schemaVersion}; this reader supports 1.0.0–1.5.0`);
  if(building.site!==undefined){if(building.schemaVersion==='1.0.0')fail('/site','requires building 1.1.0');if(building.site.parcel!==undefined&&building.schemaVersion==='1.1.0')fail('/site/parcel','requires building 1.2.0');if(building.site.orthophoto!==undefined&&['1.0.0','1.1.0','1.2.0'].includes(building.schemaVersion))fail('/site/orthophoto','requires building 1.3.0');if(building.site.terrain!==undefined&&!['1.4.0','1.5.0'].includes(building.schemaVersion))fail('/site/terrain','requires building 1.4.0');if(building.site.buildingPlacement!==undefined&&building.schemaVersion!=='1.5.0')fail('/site/buildingPlacement','requires building 1.5.0');Core.validateSite(building.site);}
  if(Array.isArray(building.levels)&&building.levels.some(l=>l?.project?.site&&(l.project.site.parcel!==undefined||l.project.site.orthophoto!==undefined||l.project.site.terrain!==undefined||l.project.site.buildingPlacement!==undefined)))fail('/levels','territorial parcel, orthophoto and terrain belong only to building.site');
  if(!ID.building.test(building.id))fail('/id','invalid building ID');
  text(building.name,'/name',LIMITS.nameMax);
  if(!dateValid(building.createdAt))fail('/createdAt','invalid UTC date-time');
  if(!dateValid(building.updatedAt))fail('/updatedAt','invalid UTC date-time');
  if(Date.parse(building.updatedAt)<Date.parse(building.createdAt))fail('/updatedAt','earlier than createdAt');
  if(building.units!=='mm')fail('/units','expected mm');
  if(!Array.isArray(building.levels)||building.levels.length<1||building.levels.length>LIMITS.levels)fail('/levels',`between 1 and ${LIMITS.levels} levels in this version`);
  if(!Array.isArray(building.stairs)||building.stairs.length>LIMITS.stairs)fail('/stairs',`at most ${LIMITS.stairs} stairs`);
  const ids=new Set([building.id]),unique=(id,path)=>{if(ids.has(id))fail(path,`duplicate ID ${id}`);ids.add(id);};
  const projectIds=new Set(),imageIds=new Set();
  building.levels.forEach((l,i)=>{
   const path=`/levels/${i}`;exactKeys(l,path,['id','name','order','elevationMm','slabThicknessMm','offsetMm','project']);
   if(!ID.level.test(l.id))fail(`${path}/id`,'invalid level ID');unique(l.id,`${path}/id`);
   text(l.name,`${path}/name`,LIMITS.levelNameMax);
   if(l.order!==i)fail(`${path}/order`,'levels must be listed in contiguous order starting at 0');
   if(!isInt(l.elevationMm,0,LIMITS.elevationMm))fail(`${path}/elevationMm`,`integer mm 0–${LIMITS.elevationMm}`);
   if(!isInt(l.slabThicknessMm,0,LIMITS.slabMm))fail(`${path}/slabThicknessMm`,`integer mm 0–${LIMITS.slabMm}`);
   point(l.offsetMm,`${path}/offsetMm`);
   if(i===0&&(l.elevationMm!==0||l.slabThicknessMm!==0||l.offsetMm.x!==0||l.offsetMm.y!==0))fail(path,'level 0 defines the building frame: elevation, slab and offset must be 0');
   if(i>0){const below=building.levels[i-1];if(l.elevationMm<=below.elevationMm)fail(`${path}/elevationMm`,'must be higher than the level below');if(l.elevationMm-l.slabThicknessMm<=below.elevationMm)fail(`${path}/slabThicknessMm`,'slab reaches the floor of the level below');}
   embedded(l.project,`${path}/project`);
   if(projectIds.has(l.project.id))fail(`${path}/project/id`,`duplicate project ID ${l.project.id} across levels`);projectIds.add(l.project.id);
   for(const im of l.project.sourceImages||[]){if(imageIds.has(im.id))fail(`${path}/project/sourceImages/${im.id}`,'duplicate image ID across levels');imageIds.add(im.id);}
  });
  building.stairs.forEach((s,i)=>{
   const path=`/stairs/${i}`;exactKeys(s,path,['id','kind','fromLevelId','toLevelId','startMm','rotationDeg','widthMm','runLengthMm','risers']);
   if(!ID.stair.test(s.id))fail(`${path}/id`,'invalid stair ID');unique(s.id,`${path}/id`);
   if(s.kind!=='straight')fail(`${path}/kind`,'only straight stairs in this version');
   const from=building.levels.find(l=>l.id===s.fromLevelId),to=building.levels.find(l=>l.id===s.toLevelId);
   if(!from)fail(`${path}/fromLevelId`,`missing level reference ${s.fromLevelId}`);if(!to)fail(`${path}/toLevelId`,`missing level reference ${s.toLevelId}`);
   if(to.order!==from.order+1)fail(path,'a stair joins a level with the one directly above');
   point(s.startMm,`${path}/startMm`);
   if(!isInt(s.rotationDeg,0,359))fail(`${path}/rotationDeg`,'integer 0–359');
   if(!isInt(s.widthMm,300,5000))fail(`${path}/widthMm`,'integer mm 300–5000');
   if(!isInt(s.runLengthMm,500,20000))fail(`${path}/runLengthMm`,'integer mm 500–20000');
   if(!isInt(s.risers,2,40))fail(`${path}/risers`,'integer 2–40');
  });
  return {warnings:warnings(building)};
 }
 // Orientative coherence warnings (never blocking, never a regulatory or structural verdict).
 function warnings(building){
  const out=[],level=id=>building.levels.find(l=>l.id===id);
  for(const s of building.stairs){
   for(const [key,l] of [['from',level(s.fromLevelId)],['to',level(s.toLevelId)]]){
    const rooms=(l.project.rooms||[]).map(r=>r.polygon),corners=toLocal(stairFootprint(s),l);
    if(!corners.every(c=>rooms.some(poly=>inPoly(c,poly))))out.push({code:'BW1',path:`/stairs/${s.id}`,level:l.id,message:`La huella de la escalera no queda dentro de las estancias de «${l.name}» (${key==='from'?'salida':'llegada'}).`});
   }
  }
  building.levels.forEach((l,i)=>{
   const above=building.levels[i+1];
   if(above){const clear=above.elevationMm-above.slabThicknessMm-l.elevationMm,tall=(l.project.walls||[]).filter(w=>w.status!=='demolished'&&w.heightMm>clear);
    if(tall.length)out.push({code:'BW2',path:`/levels/${l.id}`,level:l.id,message:`${tall.length} muro(s) de «${l.name}» superan la altura libre bajo el forjado de «${above.name}» (${clear} mm).`});}
  });
  const conf=building.levels.map(l=>l.project.scale.confidence),label=c=>c==='real'?'confirmada':c==='estimated'?'estimada':'pendiente';
  if(new Set(conf).size>1||conf.some(c=>c!=='real'))out.push({code:'BW3',path:'/levels',message:`Escala por planta: ${building.levels.map(l=>`«${l.name}» ${label(l.project.scale.confidence)}`).join(', ')}. ${new Set(conf).size>1?'Las distancias en mm son nominales y su confianza física difiere entre plantas.':'Ninguna escala está confirmada: las medidas de todas las plantas son orientativas.'}`});
  for(const c of stairConflicts(building))out.push({code:'BW5',path:`/levels/${c.levelId}/objects/${c.objectId}`,level:c.levelId,objectId:c.objectId,stairId:c.stairId,message:c.message,
   evidence:{rule:`penetración > ${CONTACT_TOLERANCE_MM} mm entre la huella girada del mueble y la ${c.zone==='hueco'?'del hueco':'de la escalera'} (ejes separadores, marco de la planta)`,zone:c.zone,penetrationMm:c.penetrationMm,overlapAreaMm2:c.overlapAreaMm2,overlap:c.overlap,footprint:c.footprint,stairPolygon:c.stairPolygon}});
  for(let i=1;i<building.levels.length;i++){const a=alignment(building,building.levels[i].id);if(a.unsupported.length)out.push({code:'BW4',path:`/levels/${building.levels[i].id}`,level:building.levels[i].id,message:`${a.unsupported.length} de ${a.checked} muro(s) de «${building.levels[i].name}» no tienen un muro de la planta inferior debajo. Aviso de coherencia visual, no un dictamen estructural.`});}
  return out;
 }
 // Point-to-segment distance in mm.
 function segDist(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,L=dx*dx+dy*dy,t=L?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/L)):0;return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
 // Alignment check of a level against the one below: a wall counts as supported when both its endpoints and its
 // midpoint lie within (thickness/2 + 20 mm) of some active wall axis of the level below, both in the building frame.
 function alignment(building,levelId){
  const i=building.levels.findIndex(l=>l.id===levelId),l=building.levels[i],below=building.levels[i-1];
  if(i<1)return {checked:0,supported:0,unsupported:[]};
  const lower=(below.project.walls||[]).filter(w=>w.status!=='demolished').map(w=>({w,a:{x:w.start.x+below.offsetMm.x,y:w.start.y+below.offsetMm.y},b:{x:w.end.x+below.offsetMm.x,y:w.end.y+below.offsetMm.y}}));
  const upper=(l.project.walls||[]).filter(w=>w.status!=='demolished'),unsupported=[];
  for(const w of upper){const a={x:w.start.x+l.offsetMm.x,y:w.start.y+l.offsetMm.y},b={x:w.end.x+l.offsetMm.x,y:w.end.y+l.offsetMm.y},m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
   const ok=[a,m,b].every(p=>lower.some(q=>segDist(p,q.a,q.b)<=q.w.thicknessMm/2+20));if(!ok)unsupported.push(w.id);}
  return {checked:upper.length,supported:upper.length-unsupported.length,unsupported};
 }
 // Openings of the slab under `levelId` (in that level's own frame): the footprint of every stair arriving at it.
 function slabVoids(building,levelId){const l=building.levels.find(x=>x.id===levelId);return building.stairs.filter(s=>s.toLevelId===levelId).map(s=>({stairId:s.id,polygon:toLocal(stairFootprint(s),l)}));}
 function areas(building){
  const levels=building.levels.map(l=>{const m2=(l.project.rooms||[]).filter(r=>r.countsTowardArea!==false).reduce((a,r)=>a+areaMm2(r.polygon),0)/1e6;return {levelId:l.id,name:l.name,m2};});
  return {levels,totalM2:levels.reduce((a,l)=>a+l.m2,0)};
 }
 // Canonical text: object keys sorted recursively, so hashes do not depend on key order.
 function canonical(value){return JSON.stringify(value,(k,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(x=>[x,v[x]])):v);}
 async function sha256(text){const bytes=new TextEncoder().encode(text);if(globalThis.crypto?.subtle)return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join('');return require('node:crypto').createHash('sha256').update(bytes).digest('hex');}
 const now=building=>new Date(Math.max(Date.now(),Date.parse(building?.createdAt||0))).toISOString();
 // Wraps an existing 1.x project as level 0 of a new building. The project is copied unchanged (same IDs).
 function create(project,{name=project.name,levelName='Planta baja'}={}){
  const t=new Date().toISOString(),b={schema:SCHEMA,schemaVersion:VERSION,id:Core.id('bld'),name:String(name).slice(0,LIMITS.nameMax),createdAt:t,updatedAt:t,units:'mm',
   levels:[{id:Core.id('lvl'),name:levelName,order:0,elevationMm:0,slabThicknessMm:0,offsetMm:{x:0,y:0},project:clone(project)}],stairs:[]};
  if(project.site!==undefined){b.site=clone(project.site);b.schemaVersion=project.site.buildingPlacement?'1.5.0':project.site.terrain?'1.4.0':project.site.orthophoto?'1.3.0':project.site.parcel?'1.2.0':'1.1.0';if(b.levels[0].project.site){delete b.levels[0].project.site.parcel;delete b.levels[0].project.site.orthophoto;delete b.levels[0].project.site.terrain;delete b.levels[0].project.site.buildingPlacement;}}
  validate(b);return b;
 }
 // Default elevation of a new level: the tallest active wall below plus the default visual slab thickness.
 const DEFAULT_SLAB_MM=300;
 function nextElevation(building){const top=building.levels.at(-1),walls=(top.project.walls||[]).filter(w=>w.status!=='demolished');return top.elevationMm+Math.max(top.project.defaults.wallHeightMm,...walls.map(w=>w.heightMm))+DEFAULT_SLAB_MM;}
 function addLevel(building,project,{name,elevationMm,slabThicknessMm=DEFAULT_SLAB_MM,offsetMm={x:0,y:0}}={}){
  if(building.levels.length>=LIMITS.levels)throw Error(`Este corte admite ${LIMITS.levels} plantas como máximo.`);
  const b=clone(building),order=b.levels.length;
  const p=clone(project);if(b.levels.some(l=>l.project.id===p.id))p.id=Core.id('prj');
  if(p.site){delete p.site.parcel;delete p.site.orthophoto;delete p.site.terrain;delete p.site.buildingPlacement;}
  b.levels.push({id:Core.id('lvl'),name:name||(order===1?'Planta primera':`Planta ${order}`),order,elevationMm:elevationMm??nextElevation(building),slabThicknessMm,offsetMm:{x:Math.round(offsetMm.x),y:Math.round(offsetMm.y)},project:p});
  b.updatedAt=now(b);validate(b);return b;
 }
 // Removing a level also removes the stairs that reference it.
 function removeLevel(building,levelId){
  const b=clone(building),i=b.levels.findIndex(l=>l.id===levelId);if(i<0)throw Error('Planta no encontrada.');if(i===0)throw Error('La planta baja define el marco del edificio y no se puede eliminar.');
  b.levels.splice(i,1);b.levels.forEach((l,k)=>l.order=k);b.stairs=b.stairs.filter(s=>s.fromLevelId!==levelId&&s.toLevelId!==levelId);b.updatedAt=now(b);validate(b);return b;
 }
 function updateLevel(building,levelId,patch){
  const b=clone(building),l=b.levels.find(x=>x.id===levelId);if(!l)throw Error('Planta no encontrada.');
  for(const k of ['name','elevationMm','slabThicknessMm','offsetMm'])if(patch[k]!==undefined)l[k]=clone(patch[k]);
  b.updatedAt=now(b);validate(b);return b;
 }
 // Storing an unchanged level is a no-op (no updatedAt bump), so saving on load or on a level switch writes nothing new.
 function setProject(building,levelId,project){const b=clone(building),l=b.levels.find(x=>x.id===levelId);if(!l)throw Error('Planta no encontrada.');if(canonical(l.project)===canonical(project))return b;l.project=clone(project);b.updatedAt=now(b);validate(b);return b;}
 function setStair(building,stair){
  const b=clone(building),s={id:stair.id||Core.id('str'),kind:'straight',fromLevelId:stair.fromLevelId,toLevelId:stair.toLevelId,startMm:{x:Math.round(stair.startMm.x),y:Math.round(stair.startMm.y)},rotationDeg:((Math.round(stair.rotationDeg)%360)+360)%360,widthMm:Math.round(stair.widthMm),runLengthMm:Math.round(stair.runLengthMm),risers:Math.round(stair.risers)};
  const i=b.stairs.findIndex(x=>x.id===s.id);if(i<0)b.stairs.push(s);else b.stairs[i]=s;b.updatedAt=now(b);validate(b);return b;
 }
 function removeStair(building,stairId){const b=clone(building);b.stairs=b.stairs.filter(s=>s.id!==stairId);b.updatedAt=now(b);validate(b);return b;}
 // Copy with new building, level and project IDs; embedded entity IDs are kept (they are unique per project).
 function duplicate(building,name){const b=clone(building),map=new Map();b.id=Core.id('bld');if(name)b.name=name;const t=new Date().toISOString();b.createdAt=b.updatedAt=t;
  for(const l of b.levels){const id=Core.id('lvl');map.set(l.id,id);l.id=id;l.project.id=Core.id('prj');}
  for(const s of b.stairs){s.id=Core.id('str');s.fromLevelId=map.get(s.fromLevelId);s.toLevelId=map.get(s.toLevelId);}validate(b);return b;}
 // «Exportar esta planta»: the level's own 1.x project, unchanged and strictly valid, plus what it leaves out.
 function exportLevel(building,levelId){
  const l=building.levels.find(x=>x.id===levelId);if(!l)throw Error('Planta no encontrada.');
  const project=building.site===undefined&&!l.project.site?clone(l.project):Core.setSite(l.project,building.site?.buildingPlacement?Territory.rebaseForLevel(building.site,l):building.site);Core.validate(project,{strict:true});
  const omitted=[`la relación con ${building.levels.length-1} planta(s) más del edificio «${building.name}»`,`la elevación (${l.elevationMm} mm) y el desplazamiento (${l.offsetMm.x}, ${l.offsetMm.y} mm)`];
  const stairs=building.stairs.filter(s=>s.fromLevelId===l.id||s.toLevelId===l.id).length;if(stairs)omitted.push(`${stairs} escalera(s) y su hueco`);
  return {project,warning:`Se exporta sólo «${l.name}» como proyecto de una planta. Omite ${omitted.join('; ')}.`};
 }
 function isBuilding(value){return !!value&&typeof value==='object'&&value.schema===SCHEMA;}
 function prepare(text){let value;try{value=typeof text==='string'?JSON.parse(text):text;}catch{throw Error('El archivo no es JSON válido o está incompleto.');}if(!isBuilding(value))throw Error('No es un documento de edificio Rubik.');validate(value);return clone(value);}

 /* Building ZIP: building.json, manifest.json and levels/<levelId>/images/<imageId>.<ext>. Each level keeps the 1.x
    sidecar reference images/<imageId>.<ext>; the entry path is that reference prefixed by the level, so two levels
    can never collide and resolution is exact. No deduplication across levels. */
 const EXT={'image/png':'png','image/jpeg':'jpg','image/webp':'webp'};
 const MAX_ENTRIES=2+LIMITS.levels*20;
 function packagePath(name){if(name==='building.json'||name==='manifest.json'||/^levels\/lvl_[A-Za-z0-9][A-Za-z0-9_-]{2,63}\/images\/img_[A-Za-z0-9][A-Za-z0-9_-]{2,63}\.(png|jpg|webp)$/.test(name))return name;throw Error('Ruta ZIP no permitida en un edificio: '+name);}
 const encoder=new TextEncoder(),decoder=new TextDecoder('utf-8',{fatal:true});
 const hex=async bytes=>globalThis.crypto?.subtle?[...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(n=>n.toString(16).padStart(2,'0')).join(''):require('node:crypto').createHash('sha256').update(bytes).digest('hex');
 // getBytes(image) resolves the stored bytes of a level image; imageInfo(bytes,mediaType) returns {widthPx,heightPx}.
 async function packageEntries(building,getBytes,imageInfo){
  validate(building);const b=clone(building),entries=new Map(),images=[];
  for(const l of b.levels)for(const im of l.project.sourceImages||[]){
   const bytes=await getBytes(im,l);if(!bytes)throw Error(`Imagen local no disponible en «${l.name}»: ${im.id}`);
   const info=imageInfo(bytes,im.mediaType);im.widthPx=info.widthPx;im.heightPx=info.heightPx;im.bytes=bytes.length;im.sha256=await hex(bytes);delete im.originalFileName;
   im.storage={kind:'sidecar-file',ref:`images/${im.id}.${EXT[im.mediaType]}`};const entry=`levels/${l.id}/${im.storage.ref}`;entries.set(entry,bytes);
   images.push({levelId:l.id,sourceImageId:im.id,entry,sha256:im.sha256,bytes:bytes.length,mediaType:im.mediaType});
  }
  validate(b);entries.set('building.json',encoder.encode(JSON.stringify(b,null,2)));
  entries.set('manifest.json',encoder.encode(JSON.stringify({format:'rubik-sota.floorplan-building-package',version:1,buildingId:b.id,images},null,2)));
  return {entries,building:b};
 }
 // Validates every entry before anything is applied. Returns the building and the image bytes per level.
 async function readEntries(entries,imageInfo){
  if(!(entries instanceof Map)||!entries.has('building.json')||!entries.has('manifest.json'))throw Error('ZIP de edificio sin building.json o manifest.json.');
  if(entries.size>MAX_ENTRIES)throw Error('ZIP de edificio con demasiadas entradas.');
  for(const name of entries.keys())packagePath(name);
  let building,manifest;try{building=JSON.parse(decoder.decode(entries.get('building.json')));manifest=JSON.parse(decoder.decode(entries.get('manifest.json')));}catch{throw Error('building.json o manifest.json no son JSON válidos.');}
  validate(building);
  if(manifest?.format!=='rubik-sota.floorplan-building-package'||manifest.version!==1||manifest.buildingId!==building.id||!Array.isArray(manifest.images))throw Error('Manifiesto de edificio no válido o de otro edificio.');
  const expected=[],used=new Set(['building.json','manifest.json']),images=[];
  for(const l of building.levels)for(const im of l.project.sourceImages||[]){
   if(im.storage.kind!=='sidecar-file'||im.storage.ref!==`images/${im.id}.${EXT[im.mediaType]}`)throw Error(`La imagen ${im.id} de «${l.name}» no tiene la referencia sidecar esperada.`);
   const entry=`levels/${l.id}/${im.storage.ref}`,m=manifest.images.find(x=>x.entry===entry);
   if(!m||m.levelId!==l.id||m.sourceImageId!==im.id||m.sha256!==im.sha256||m.bytes!==im.bytes||m.mediaType!==im.mediaType)throw Error(`El manifiesto no coincide con la imagen ${im.id} de «${l.name}».`);
   const bytes=entries.get(entry);if(!bytes)throw Error(`Falta la imagen ${entry}.`);if(used.has(entry))throw Error('Imagen referenciada dos veces.');used.add(entry);
   if(bytes.length!==im.bytes||await hex(bytes)!==im.sha256)throw Error(`La imagen ${entry} no coincide con su tamaño o huella SHA-256.`);
   const info=imageInfo(bytes,im.mediaType);if(info.widthPx!==im.widthPx||info.heightPx!==im.heightPx)throw Error(`La imagen ${entry} no coincide con sus dimensiones.`);
   expected.push(entry);images.push({levelId:l.id,image:im,bytes});
  }
  if(manifest.images.length!==expected.length)throw Error('El manifiesto lista imágenes que el edificio no usa.');
  if(used.size!==entries.size)throw Error('El ZIP de edificio contiene entradas ajenas.');
  return {building,images};
 }
 function setSite(building,site){const b=clone(building);if(site===undefined)delete b.site;else b.site=clone(site);if(site?.buildingPlacement!==undefined)b.schemaVersion='1.5.0';else if(site?.terrain!==undefined&&Number(b.schemaVersion.split('.')[1])<4)b.schemaVersion='1.4.0';else if(site?.orthophoto!==undefined&&['1.0.0','1.1.0','1.2.0'].includes(b.schemaVersion))b.schemaVersion='1.3.0';else if(site?.parcel!==undefined&&['1.0.0','1.1.0'].includes(b.schemaVersion))b.schemaVersion='1.2.0';else if(b.schemaVersion==='1.0.0')b.schemaVersion='1.1.0';b.updatedAt=now(b);validate(b);return b;}
 const api={SCHEMA,VERSION,PROJECT_VERSIONS,LIMITS,DEFAULT_SLAB_MM,validate,warnings,alignment,slabVoids,stairFootprint,stairInfo,convexOverlap,labelAnchor,stairLabel,CONTACT_TOLERANCE_MM,zoneConflict,stairZonesOf,stairConflicts,conflictMessage,conflictSummary,buildingStatus,areas,canonical,sha256,create,setSite,addLevel,removeLevel,updateLevel,setProject,setStair,removeStair,duplicate,exportLevel,isBuilding,prepare,nextElevation,toLocal,toBuilding,packagePath,packageEntries,readEntries,MAX_ENTRIES};
 if(typeof module==='object')module.exports=api;else root.FloorPlanBuilding=api;
})(typeof globalThis==='object'?globalThis:this);
