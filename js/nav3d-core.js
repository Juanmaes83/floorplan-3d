/* NAV3D V1 · Navegación 3D profesional (Ola 2 · corte 2a: UX-05, UX-09, UX-22, UX-23, UX-25). Núcleo PURO del panel:
   no toca el DOM, el 3D ni el proyecto. La única fuente de verdad del estado es View3D.navState (y el edificio de
   building-ui); aquí solo se deriva lo que el panel muestra y lo que se puede pulsar, con su motivo cuando no se puede.
   · Estancias: nombres del proyecto, agrupadas por planta; la clave une planta y estancia (los ids no se mezclan).
   · Minimapa: marcador de posición y orientación del paseo, o un estado seguro cuando no hay datos fiables.
   · Puertas: resumen y acción global (abrir/cerrar todas) de la planta activa, solo de la visita.
   Coordenadas del plano en mm. */
(function(root){
 'use strict';
 const FAMILY_ORDER=['living','dining','kitchen','bedroom','bathroom','toilet','office','hallway','laundry','storage','utility','garage','terrace','balcony','other','unspecified'];
 const rank=f=>{const i=FAMILY_ORDER.indexOf(f);return i<0?FAMILY_ORDER.length:i;};
 // Proyectos antiguos sin uso declarado: solo para ORDENAR la lista se deduce el uso del nombre (no se guarda nada).
 const HINTS=[[/sal[oó]n|estar|living|lounge/i,'living'],[/comedor|dining/i,'dining'],[/cocina|kitchen/i,'kitchen'],[/dormitorio|habitaci[oó]n|bedroom/i,'bedroom'],
  [/ba[ñn]o|bath/i,'bathroom'],[/aseo|toilet|wc/i,'toilet'],[/despacho|estudio|office/i,'office'],[/pasillo|distribuidor|recibidor|hall/i,'hallway'],
  [/lavadero|laundry/i,'laundry'],[/trastero|almac[eé]n|storage/i,'storage'],[/terraza|terrace/i,'terrace'],[/balc[oó]n|mirador|balcony/i,'balcony']];
 const familyHint=(family,name)=>family&&family!=='unspecified'?family:(HINTS.find(([re])=>re.test(name||''))||[,'unspecified'])[1];
 const area=poly=>Math.abs(poly.reduce((s,p,i)=>{const q=poly[(i+1)%poly.length];return s+p[0]*q[1]-q[0]*p[1];},0))/2;
 const validPoly=poly=>Array.isArray(poly)&&poly.length>=3&&poly.every(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1]))&&area(poly)>0;
 const SEP='::';
 const key=(levelId,roomId)=>`${levelId||''}${SEP}${roomId}`;
 function parseKey(k){if(typeof k!=='string')return null;const i=k.indexOf(SEP);if(i<0)return null;const roomId=k.slice(i+SEP.length);return roomId?{levelId:k.slice(0,i)||null,roomId}:null;}

 // levels: [{levelId|null, name, order, rooms:[{id,name,family,poly}]}]; label(room) → nombre a mostrar.
 // Devuelve los grupos por planta (orden de planta), con las estancias por uso (salón, cocina, dormitorios, baños…).
 function roomGroups({levels=[],activeLevelId=null,label=r=>r.name}={}){
  return [...levels].sort((a,b)=>(a.order??0)-(b.order??0)).map(level=>{
   const rooms=(level.rooms||[]).filter(r=>r&&r.id&&validPoly(r.poly)).map(r=>({roomId:r.id,levelId:level.levelId||null,family:r.family||'unspecified',label:String(label(r)||r.name||r.id).trim()||r.id,area:area(r.poly)}));
   rooms.sort((a,b)=>rank(familyHint(a.family,a.label))-rank(familyHint(b.family,b.label))||a.label.localeCompare(b.label,'es',{numeric:true})||b.area-a.area);
   const seen=new Map();
   for(const r of rooms){const n=(seen.get(r.label)||0)+1;seen.set(r.label,n);if(n>1)r.label=`${r.label} (${n})`;}
   return {levelId:level.levelId||null,name:level.name||'',order:level.order??0,active:(level.levelId||null)===(activeLevelId||null),
    rooms:rooms.map(r=>({key:key(r.levelId,r.roomId),roomId:r.roomId,levelId:r.levelId,label:r.label,family:r.family}))};
  });
 }

 const insidePoly=(poly,x,y)=>{let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;};
 function roomAt(rooms,x,y){if(!Number.isFinite(x)||!Number.isFinite(y))return null;const r=(rooms||[]).find(r=>validPoly(r.poly)&&insidePoly(r.poly,x,y));return r?r.id:null;}

 // pose = View3D.walkPose() ({x,y,dx,dy} en mm del plano) y viewBox [x,y,w,h] del minimapa.
 // state: 'ok' (dentro de una estancia), 'between' (dentro del plano, fuera de las estancias), 'outside' (fuera del
 // plano) o 'unknown' (sin datos fiables: no se dibuja ninguna posición).
 function marker(pose,viewBox,rooms){
  if(!pose||!Array.isArray(viewBox)||viewBox.length!==4)return {state:'unknown'};
  const {x,y,dx,dy}=pose;
  if(![x,y,dx,dy].every(Number.isFinite))return {state:'unknown'};
  const len=Math.hypot(dx,dy);if(len<.5||len>1.5)return {state:'unknown'};
  const [vx,vy,vw,vh]=viewBox;
  if(x<vx||y<vy||x>vx+vw||y>vy+vh)return {state:'outside'};
  const roomId=roomAt(rooms,x,y);
  return {state:roomId?'ok':'between',x,y,roomId,angleDeg:Math.round(Math.atan2(dy/len,dx/len)*1800/Math.PI)/10};
 }

 // Puertas batientes de la planta activa (View3D.navState.doors = {total, open}).
 function doors(summary){
  const total=Math.max(0,summary?.total|0),open=Math.min(total,Math.max(0,summary?.open|0));
  if(!total)return {total:0,open:0,state:'none',action:null};
  return {total,open,state:open===total?'open':open===0?'closed':'mixed',action:open===total?'close':'open'};
 }

 const MODES=['exterior','interior','walk'];
 const modeOf=s=>!s?null:s.mode==='walk'?'walk':s.roof&&s.roofStatus==='available'?'exterior':'interior';

 // Qué se muestra y qué se puede pulsar, con el motivo cuando no. s = View3D.navState; ctx = {levels, rooms, lang}.
 function viewModel(s,ctx={}){
  const es=(ctx.lang||'es')!=='en',t=(a,b)=>es?a:b;
  const off=reason=>({disabled:true,reason});
  if(!s||!s.available)return {available:false,reason:s&&s.active?t('La vista 3D no está disponible en este momento.','The 3D view is not available right now.'):t('Abre la vista 3D para navegar.','Open the 3D view to navigate.'),controls:{}};
  if(s.presentation)return {available:false,reason:t('La presentación tiene sus propios controles.','The presentation has its own controls.'),controls:{}};
  const mode=modeOf(s),busy=!!s.busy,roofOk=s.roofStatus==='available';
  const c={};
  for(const m of MODES)c['mode-'+m]={pressed:mode===m,disabled:false,reason:null};
  if(!roofOk)c['mode-exterior']={pressed:false,...off(t(`Vista exterior no disponible: ${s.roofReason||'la cubierta no se puede derivar'}.`,`Exterior view unavailable: ${s.roofReason||'the roof cannot be derived'}.`))};
  const rooms=(ctx.groups||[]).reduce((n,g)=>n+g.rooms.length,0);
  c.rooms=rooms?{disabled:false,reason:null}:off(t('El proyecto no tiene estancias con superficie.','The project has no rooms with an area.'));
  c.frames=mode==='walk'?{disabled:false,reason:t('Sale del paseo.','Leaves the walk.')}:{disabled:false,reason:null};
  c.white={pressed:!!s.white,disabled:false,reason:null};
  c.finishes={pressed:!s.white,disabled:false,reason:null};
  c.furniture={pressed:!!s.furniture,disabled:false,reason:null};
  const d=doors(s.doors);
  c.doors=d.total?{disabled:false,reason:null,action:d.action}:{...off(t('Esta planta no tiene puertas batientes en 3D.','This level has no hinged doors in 3D.')),action:null};
  c.levels=(ctx.levels||[]).length>1?{disabled:false,reason:null}:{...off(null),hidden:true};
  if(busy)for(const k of Object.keys(c))if(!c[k].disabled&&!c[k].hidden)c[k]={...c[k],disabled:true,reason:t('Espera a que termine el movimiento de cámara.','Wait for the camera to settle.')};
  return {available:true,mode,doors:d,controls:c,collisions:t('En el paseo chocan los muros y las puertas; los muebles no bloquean el paso (visibles u ocultos).','In the walk, walls and doors block you; furniture never does (shown or hidden).')};
 }

 const api={FAMILY_ORDER,familyHint,key,parseKey,roomGroups,roomAt,marker,doors,modeOf,viewModel,validPoly};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikNav3DCore=api;
})(globalThis);
