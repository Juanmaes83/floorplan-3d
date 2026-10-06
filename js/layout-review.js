/* Read-only layout review in plan (mm). Never mutates, stores or moves anything; FloorPlanProjectV1 stays the only source of truth.
   Reports with checked/partial/insufficient_evidence and states every limitation it does not cover. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const T=typeof module==='object'?require('./tracing-core.js'):root.FloorPlanTracing;
 const EPS=1e-6,METHOD='Huella orientada en planta (rectángulo girado) y ejes separadores, en mm';
 // Stacking by design, taken from Rubik's own generic 3D builders (index.html): rug drawn at floor level,
 // stove/ksink drawn at worktop level on a counter/island, acwall drawn wall-mounted at 2.2 m.
 const FLOOR_COVERING=new Set(['rug']),WORKTOP_INSERT=new Set(['stove','ksink']),WORKTOP=new Set(['counter','island']),HIGH_WALL=new Set(['acwall']);
 const UNSUPPORTED=[
  ['altura','No se evalúa altura ni elevación: solo huellas en planta.'],
  ['muros','La holgura se mide entre muebles, no entre un mueble y un muro (W3 ya avisa de solapes con muros).'],
  ['circulacion','No calcula recorridos de paso completos, giros ni entrega de muebles.'],
  ['normativa','No comprueba normativa ni accesibilidad; el umbral lo fija la persona.'],
  ['mallas','Usa el tamaño guardado del objeto, no la malla 3D del modelo.']
 ];
 const dot=(a,b)=>a.x*b.x+a.y*b.y,sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y}),len=v=>Math.hypot(v.x,v.y);
 const round=n=>Math.round(n*10)/10;
 function valid(o){return o&&o.position&&o.size&&[o.position.x,o.position.y,o.size.widthMm,o.size.depthMm,o.rotationDeg].every(Number.isFinite)&&o.size.widthMm>0&&o.size.depthMm>0;}
 function normals(P){return P.map((v,i)=>{const w=P[(i+1)%P.length],e=sub(w,v),l=len(e);return {x:-e.y/l,y:e.x/l};});}
 // Minimum penetration along all separating-axis candidates; 0 or less means no positive-area overlap.
 function penetration(A,B){let best=Infinity;for(const n of [...normals(A),...normals(B)]){const a=A.map(v=>dot(v,n)),b=B.map(v=>dot(v,n));best=Math.min(best,Math.min(Math.max(...a),Math.max(...b))-Math.max(Math.min(...a),Math.min(...b)));}return best;}
 function closestOnSegment(p,a,b){const e=sub(b,a),l=dot(e,e),t=l?Math.max(0,Math.min(1,dot(sub(p,a),e)/l)):0;return {x:a.x+e.x*t,y:a.y+e.y*t};}
 // Exact distance between two disjoint convex polygons with the closest pair of points.
 function separation(A,B){let best={d:Infinity};for(const [P,Q,flip]of [[A,B,false],[B,A,true]])for(const p of P)for(let i=0;i<Q.length;i++){const q=closestOnSegment(p,Q[i],Q[(i+1)%Q.length]),d=len(sub(p,q));if(d<best.d)best=flip?{d,a:q,b:p}:{d,a:p,b:q};}return best;}
 // Length of segment a→b strictly inside convex polygon P (Cyrus–Beck clipping).
 function insideLength(a,b,P){let t0=0,t1=1;const d=sub(b,a),ccw=area(P)>0;for(let i=0;i<P.length;i++){const v=P[i],w=P[(i+1)%P.length],e=sub(w,v),n=ccw?{x:e.y,y:-e.x}:{x:-e.y,y:e.x},num=dot(n,sub(a,v)),den=dot(n,d);
   if(Math.abs(den)<EPS){if(num>=-EPS)return 0;continue;}const t=-num/den;if(den<0)t0=Math.max(t0,t);else t1=Math.min(t1,t);if(t0>=t1)return 0;}return (t1-t0)*len(d);}
 function area(P){let s=0;for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length];s+=a.x*b.y-b.x*a.y;}return s/2;}
 function clip(P,origin,n){const out=[];for(let i=0;i<P.length;i++){const a=P[i],b=P[(i+1)%P.length],da=dot(sub(a,origin),n),db=dot(sub(b,origin),n);if(da>=0)out.push(a);if((da>=0)!==(db>=0)){const t=da/(da-db);out.push({x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t});}}return out;}
 // Door leaf sweep exactly as Rubik draws it in 2D: hinge h on the wall face, closed along c, open along o (90°), radius = opening width.
 // Returns the largest opening angle (degrees) before the leaf reaches the footprint, or null when they do not interfere.
 function leafContact(door,P){const h={x:door.h[0],y:door.h[1]},c={x:door.c[0],y:door.c[1]},o={x:door.o[0],y:door.o[1]},L=door.len;
  let Q=clip(clip(P,h,c),h,o);if(Q.length<3||Math.abs(area(Q))<EPS)return null;
  const r=v=>len(sub(v,h)),angle=v=>r(v)<EPS?0:Math.atan2(dot(sub(v,h),o),dot(sub(v,h),c))*180/Math.PI;
  const nearest=Math.min(...Q.map((v,i)=>len(sub(h,closestOnSegment(h,v,Q[(i+1)%Q.length])))));
  const hInside=Q.every((v,i)=>{const w=Q[(i+1)%Q.length];return (w.x-v.x)*(h.y-v.y)-(w.y-v.y)*(h.x-v.x)>=-EPS;})||Q.every((v,i)=>{const w=Q[(i+1)%Q.length];return (w.x-v.x)*(h.y-v.y)-(w.y-v.y)*(h.x-v.x)<=EPS;});
  if(!hInside&&nearest>=L-EPS)return null;
  const candidates=Q.filter(v=>r(v)<=L+EPS).map(angle);
  for(let i=0;i<Q.length;i++){const a=Q[i],b=Q[(i+1)%Q.length],d=sub(b,a),A=dot(d,d),B=2*dot(sub(a,h),d),K=dot(sub(a,h),sub(a,h))-L*L,disc=B*B-4*A*K;
   if(A<EPS||disc<0)continue;for(const t of [(-B-Math.sqrt(disc))/(2*A),(-B+Math.sqrt(disc))/(2*A)])if(t>=-EPS&&t<=1+EPS)candidates.push(angle({x:a.x+d.x*t,y:a.y+d.y*t}));}
  if(hInside)candidates.push(0);
  return candidates.length?Math.max(0,Math.min(90,Math.min(...candidates))):null;}
 function exclusion(a,b,label=o=>o.name||o.type){
  for(const [x,y]of [[a,b],[b,a]]){
   if(FLOOR_COVERING.has(x.type))return `«${label(x)}» es un revestimiento de suelo en el modelo 3D genérico de Rubik.`;
   if(HIGH_WALL.has(x.type))return `«${label(x)}» se dibuja colgado en pared a 2,2 m en el modelo 3D genérico de Rubik.`;
   if(WORKTOP_INSERT.has(x.type)&&WORKTOP.has(y.type))return `«${label(x)}» se dibuja encastrado a la altura de la encimera «${label(y)}».`;
  }return null;}
 function review(project,options={}){
  const raw=options.clearanceMm,clearanceMm=raw===null||raw===undefined||raw===''?null:Number(raw);
  if(clearanceMm!==null&&!(Number.isFinite(clearanceMm)&&clearanceMm>0))throw Error('La holgura mínima debe ser un número de milímetros mayor que 0.');
  const label=typeof options.label==='function'?o=>String(options.label(o)||o.name||o.type):o=>o.name||o.type;
  const geometry=C.geometry(project),findings=[],skipped=[],excluded=[];
  const objects=[];for(const o of project.objects||[]){if(valid(o))objects.push({o,poly:T.footprint(o)});else skipped.push({id:o?.id,check:'objetos',reason:'Posición, tamaño o giro no válidos.'});}
  const walls=geometry.walls.filter(w=>w.status!=='demolished').map(w=>w.poly.map(([x,y])=>({x,y})));
  for(let i=0;i<objects.length;i++)for(let j=i+1;j<objects.length;j++){const A=objects[i],B=objects[j],ids=[A.o.id,B.o.id];
   const depth=penetration(A.poly,B.poly),why=exclusion(A.o,B.o,label);
   if(why){if(depth>EPS||clearanceMm!==null&&separation(A.poly,B.poly).d<clearanceMm)excluded.push({objects:ids,reason:why});continue;}
   if(depth>EPS){findings.push({code:'solape',objects:ids,measurementMm:round(depth),method:METHOD,limitation:'Huellas en planta; no evalúa altura, por lo que un solape puede ser intencionado (por ejemplo, una silla bajo la mesa).',message:`Las huellas de «${label(A.o)}» y «${label(B.o)}» se solapan ${round(depth)} mm en planta.`});continue;}
   if(clearanceMm===null)continue;
   const s=separation(A.poly,B.poly);if(!(s.d<clearanceMm))continue;
   if(walls.some(W=>insideLength(s.a,s.b,W)>EPS)){excluded.push({objects:ids,reason:'La separación más corta atraviesa un muro; no es un hueco libre entre muebles.'});continue;}
   findings.push({code:'holgura',objects:ids,measurementMm:round(s.d),thresholdMm:clearanceMm,method:METHOD+'; distancia mínima exacta entre huellas',limitation:'Distancia en planta entre huellas; no garantiza un paso utilizable ni cumplimiento normativo.',message:s.d<0.05?`«${label(A.o)}» y «${label(B.o)}» están en contacto en planta (0 mm), menos que la holgura indicada (${clearanceMm} mm).`:`«${label(A.o)}» y «${label(B.o)}» quedan a ${round(s.d)} mm en planta, menos que la holgura indicada (${clearanceMm} mm).`});}
  const swingDoors=(project.openings||[]).filter(op=>op.kind==='door'&&project.walls.find(w=>w.id===op.wallId)?.status!=='demolished');
  let doorsChecked=0;
  for(const op of swingDoors){
   if(!op.swing||!['start','end'].includes(op.swing.hinge)||!['left','right'].includes(op.swing.side)){skipped.push({id:op.id,check:'puertas',reason:'La puerta no tiene registrados bisagra y sentido de apertura (swing); no se puede calcular su barrido.'});continue;}
   const door=geometry.doors.find(d=>d.id===op.id);if(!door){skipped.push({id:op.id,check:'puertas',reason:'No se pudo derivar la geometría de la puerta.'});continue;}
   doorsChecked++;
   for(const {o,poly}of objects){
    if(FLOOR_COVERING.has(o.type)||HIGH_WALL.has(o.type)){const contact=leafContact(door,poly);if(contact!==null)excluded.push({objects:[op.id,o.id],reason:exclusion(o,o,label)||'Tipo excluido.'});continue;}
    const contact=leafContact(door,poly);if(contact===null||contact>=90-EPS)continue;
    findings.push({code:'puerta',objects:[op.id,o.id],openingId:op.id,measurementDeg:Math.round(contact),method:'Barrido de la hoja como cuarto de círculo de radio igual al ancho del hueco, con la bisagra y el sentido guardados (igual que el plano 2D)',limitation:'Hoja de grosor nulo y apertura completa de 90°; no evalúa altura, tiradores ni el lado opuesto.',message:`La hoja de la puerta ${op.id} (${op.widthMm} mm) alcanza «${label(o)}» al abrir unos ${Math.round(contact)}° de 90°.`});}
  }
  const checks={
   solapes:{status:'checked'},
   holgura:clearanceMm===null?{status:'insufficient_evidence',reason:'Indica una holgura mínima en milímetros para revisar separaciones; no hay valor predeterminado.'}:{status:'checked',thresholdMm:clearanceMm},
   puertas:!swingDoors.length?{status:'checked',reason:'No hay puertas abatibles activas.'}:doorsChecked===swingDoors.length?{status:'checked'}:doorsChecked?{status:'partial',reason:'Algunas puertas no tienen bisagra y sentido registrados.'}:{status:'insufficient_evidence',reason:'Ninguna puerta tiene bisagra y sentido registrados.'}
  };
  if(skipped.some(s=>s.check==='objetos'))checks.solapes={status:'partial',reason:'Algunos objetos no tienen geometría válida.'};
  const states=Object.values(checks).map(c=>c.status);
  const status=states.every(s=>s==='checked')?'checked':states.every(s=>s==='insufficient_evidence')?'insufficient_evidence':'partial';
  return {status,units:'mm',method:METHOD,scaleConfidence:project.scale?.confidence,checks,findings,excluded,skipped,unsupported:UNSUPPORTED.map(([check,reason])=>({check,reason}))};
 }
 const api={review,leafContact,separation,penetration};if(typeof module==='object')module.exports=api;else root.FloorPlanLayoutReview=api;
})(globalThis);
