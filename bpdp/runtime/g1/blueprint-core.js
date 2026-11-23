/* BP-DP · BLUEPRINT 3D · núcleo puro (UMD, sin DOM, sin three, sin escrituras). Versión G1.
 *
 * Lectura TÉCNICA de la misma vivienda, en el MISMO marco que View3D (verificado contra View3D.renderedGeometry.center):
 *   x = (planX − centro.x)/1000, y = elevación/1000, z = (planY − centro.y)/1000   (metros, Y arriba).
 * Autoridades reutilizadas: FloorPlanProjectV1, FloorPlanCore.geometry/wallRect, evidence-core (certeza G1).
 * Cada elemento separa: `record` (hechos del modelo: identidad y geometría, sin escala de certeza), `review` (estado de
 * revisión del elemento, aparte), `claims` (afirmaciones con clave estable, certeza y justificación) y `deps`
 * (dependencias para la vigencia, ver revision-core).
 * Patrón de blueprint3d-modern@f56f0b2 (solo la REGLA, linaje en HOLD): no acotar muros cortos (aquí 600 mm).
 */
(function(root,factory){
 const api=factory(typeof module==='object'&&module.exports?require('./evidence-core.js'):root.RubikBpdpEvidence);
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikBlueprintCore=api;
})(typeof self!=='undefined'?self:this,function(E){
 'use strict';
 const MIN_DIMENSION_MM=600,DIM_OFFSET_M=.45;
 const OPENING={door:'Puerta','sliding-door':'Puerta corredera',window:'Ventana',void:'Hueco de paso'};
 const STRUCT={'load-bearing':'Portante',partition:'Tabique',exterior:'Cerramiento exterior (dato anterior)',low:'Murete (dato anterior)',other:'Otro'};
 const STATUS={existing:'Existente',new:'Nuevo',demolished:'A demoler'};
 const area=poly=>{let a=0;for(let i=0;i<poly.length;i++){const p=poly[i],q=poly[(i+1)%poly.length];a+=p.x*q.y-q.x*p.y;}return Math.abs(a)/2;};
 /** structureSource (contrato 1.5.0) → actor que declara. Ausente: nadie lo declaró (la plantilla no es un actor). */
 const STRUCT_ACTOR={professional:'professional',imported:'imported','pending-review':'pending-review'};

 function build({project,Core,revision,displayName=(n)=>n,sources=[],audience='public'}){
  if(!project||!Core||typeof Core.geometry!=='function')throw Error('blueprint-core: project y FloorPlanCore son obligatorios');
  if(typeof revision!=='string'||!revision)throw Error('blueprint-core: revision es obligatoria (identidad de entrada)');
  const g=Core.geometry(project),cx=g.center.x,cy=g.center.y,scale=project.scale||{},defH=(project.defaults?.wallHeightMm||2800);
  const W=(x,y,elevMm=0)=>[(x-cx)/1000,elevMm/1000,(y-cy)/1000];
  const ctx={scale,sources,audience};
  const M=(key,label,valueMm,unit)=>E.measure({key,label,valueMm,unit,...ctx});
  const items=[],dimensions=[];
  const withSourceDeps=(deps,claims)=>[...deps,...claims.map(c=>'source:'+c.key)];
  for(const w of project.walls||[]){
   if(w.status==='demolished')continue;
   const len=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),h=w.heightMm||defH,rect=Core.wallRect?Core.wallRect(w):null,k=`wall:${w.id}:`;
   const claims=[M(k+'length','Longitud (eje)',len,'m'),M(k+'thickness','Espesor',w.thicknessMm),
    M(k+'height',w.heightMm?'Altura':'Altura (valor por defecto del proyecto)',h,'m'),
    E.assess({key:k+'structure',label:'Tipo estructural',value:w.structure==null||w.structure==='unknown'?null:w.structure,display:STRUCT[w.structure]||w.structure,
     kind:'declaration',declaredBy:STRUCT_ACTOR[w.structureSource]||null,...ctx}),
    E.existenceAssessment(w,k+'exists',sources,audience),
    E.assess({key:k+'hidden-structure',label:'Estructura oculta en su interior',kind:'not-modelled'})];
   items.push({id:w.id,role:'wall',kind:'wall',label:`Muro · ${(len/1000).toFixed(2)} m`,anchor:W((w.start.x+w.end.x)/2,(w.start.y+w.end.y)/2,h),
    record:{id:w.id,element:'Muro',status:STATUS[w.status]||w.status||'Sin estado',structureDeclared:!!(rect&&rect.declared)},review:E.reviewOf(w),claims,
    deps:withSourceDeps([`entity:${w.id}`,'global:scale','global:defaults'],claims),revision});
   if(len>=MIN_DIMENSION_MM){
    const ux=(w.end.x-w.start.x)/len,uy=(w.end.y-w.start.y)/len,nx=-uy,ny=ux,off=w.thicknessMm/2+DIM_OFFSET_M*1000;
    dimensions.push({id:'dim:'+w.id,elementId:w.id,from:W(w.start.x+nx*off,w.start.y+ny*off,0),to:W(w.end.x+nx*off,w.end.y+ny*off,0),
     witness:[[W(w.start.x,w.start.y,0),W(w.start.x+nx*off,w.start.y+ny*off,0)],[W(w.end.x,w.end.y,0),W(w.end.x+nx*off,w.end.y+ny*off,0)]],
     valueMm:Math.round(len),text:(len/1000).toFixed(2),claim:claims[0],deps:[`entity:${w.id}`,'global:scale',`source:${k}length`],revision});
   }
  }
  const wallById=new Map((project.walls||[]).map(w=>[w.id,w]));
  for(const o of project.openings||[]){
   const w=wallById.get(o.wallId);if(!w)continue;const len=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)||1,t=(o.offsetMm+o.widthMm/2)/len,k=`opening:${o.id}:`;
   const px=w.start.x+(w.end.x-w.start.x)*t,py=w.start.y+(w.end.y-w.start.y)*t;
   const claims=[M(k+'width','Ancho',o.widthMm),M(k+'height','Alto',o.heightMm),M(k+'sill','Antepecho',o.sillHeightMm||0),E.existenceAssessment(o,k+'exists',sources,audience)];
   items.push({id:o.id,role:'opening',kind:o.kind,label:`${OPENING[o.kind]||'Hueco'} · ${(o.widthMm/1000).toFixed(2)} m`,anchor:W(px,py,(o.sillHeightMm||0)+o.heightMm),
    record:{id:o.id,element:OPENING[o.kind]||'Hueco',hostWall:o.wallId},review:E.reviewOf(o),claims,
    deps:withSourceDeps([`entity:${o.id}`,`entity:${o.wallId}`,'global:scale'],claims),revision});
  }
  for(const r of project.rooms||[]){
   if(!(r.polygon&&r.polygon.length>=3))continue;const a=area(r.polygon),at=r.labelAt||r.polygon[0],k=`room:${r.id}:`;
   const claims=[M(k+'area','Superficie del polígono',a,'m2'),E.existenceAssessment(r,k+'exists',sources,audience)];
   items.push({id:r.id,role:'room',kind:'room',label:displayName(r.name,'room'),anchor:W(at.x,at.y,0),
    record:{id:r.id,element:'Estancia',countsTowardArea:r.countsTowardArea===false?'No':'Sí'},review:E.reviewOf(r),claims,
    deps:withSourceDeps([`entity:${r.id}`,'global:scale'],claims),revision});
  }
  for(const o of project.objects||[]){
   const s=o.size||{},k=`object:${o.id}:`;
   const claims=[M(k+'width','Ancho',s.widthMm),M(k+'depth','Fondo',s.depthMm),
    s.heightMm?M(k+'height','Alto',s.heightMm):E.assess({key:k+'height',label:'Alto',value:null,kind:'declaration'}),E.existenceAssessment(o,k+'exists',sources,audience)];
   items.push({id:o.id,role:'object',kind:o.type,label:displayName(o.name,o.type),anchor:W(o.position.x,o.position.y,(o.elevationMm||0)+(s.heightMm||800)),
    record:{id:o.id,element:'Objeto',type:o.type},review:E.reviewOf(o),claims,deps:withSourceDeps([`entity:${o.id}`,'global:scale'],claims),revision});
  }
  const env=g.envelope,ext={w:env.w/1000,d:env.h/1000,h:defH/1000};
  const documented=items.reduce((n,i)=>n+i.claims.filter(c=>c.certainty==='documented').length,0);
  return Object.freeze({schema:'rubik-sota.bpdp.blueprint@2',revision,projectId:project.id,scale:{confidence:scale.confidence||'unknown',method:scale.method||null},
   frame:{originPlanMm:{x:cx,y:cy},units:'metres',axes:'x=(planX-cx)/1000, y=elevation/1000, z=(planY-cy)/1000'},extent:ext,items,dimensions,notModelled:E.NOT_MODELLED,
   minDimensionMm:MIN_DIMENSION_MM,sourceRegistry:Array.isArray(sources)&&sources.length?'provided':'absent',documentedClaims:documented});
 }
 /**
  * Selección SOBRE LA GEOMETRÍA CANÓNICA (sin tocar la escena de View3D): punto de planta en mm (p. ej. de
  * View3D.groundAt, API pública) → elemento. Prioridad: hueco, objeto, muro, estancia. Tolerancia en mm.
  */
 function pick(project,pt,tolMm=120){
  if(!pt||!Number.isFinite(pt.x)||!Number.isFinite(pt.y))return null;
  const seg=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,l2=dx*dx+dy*dy||1,t=Math.max(0,Math.min(1,((pt.x-a.x)*dx+(pt.y-a.y)*dy)/l2));return {d:Math.hypot(pt.x-a.x-dx*t,pt.y-a.y-dy*t),t};};
  const walls=new Map((project.walls||[]).filter(w=>w.status!=='demolished').map(w=>[w.id,w]));
  for(const o of project.openings||[]){const w=walls.get(o.wallId);if(!w)continue;const L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)||1,{d,t}=seg(w.start,w.end),along=t*L;
   if(d<=w.thicknessMm/2+tolMm&&along>=o.offsetMm-tolMm/2&&along<=o.offsetMm+o.widthMm+tolMm/2)return {id:o.id,role:'opening'};}
  for(const o of project.objects||[]){const s=o.size||{},a=-(o.rotationDeg||0)*Math.PI/180,dx=pt.x-o.position.x,dy=pt.y-o.position.y,lx=dx*Math.cos(a)-dy*Math.sin(a),ly=dx*Math.sin(a)+dy*Math.cos(a);
   if(Math.abs(lx)<=(s.widthMm||0)/2&&Math.abs(ly)<=(s.depthMm||0)/2)return {id:o.id,role:'object'};}
  let best=null;for(const w of walls.values()){const {d}=seg(w.start,w.end);if(d<=w.thicknessMm/2+tolMm&&(!best||d<best.d))best={id:w.id,role:'wall',d};}
  if(best)return {id:best.id,role:'wall'};
  for(const r of project.rooms||[]){const P=r.polygon||[];let inside=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a.y>pt.y)!==(b.y>pt.y)&&pt.x<(b.x-a.x)*(pt.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}
   if(inside)return {id:r.id,role:'room'};}
  return null;
 }
 return Object.freeze({build,pick,MIN_DIMENSION_MM});
});
