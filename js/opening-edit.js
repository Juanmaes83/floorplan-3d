/* Contextual editing of doors and windows. Pure functions over FloorPlanProjectV1: every route that creates or
   changes an opening (contextual panel, add from a room, «Plano propio») uses the same interval guard, and a
   preview never mutates its input. The swing is stored as the contract defines it, relative to wall.start→end;
   rooms are only shown as labels when each side of the wall belongs to one room without doubt. */
(function(root){
 'use strict';
 const node=typeof module==='object';
 const C=node?require('./project-core.js'):root.FloorPlanCore;
 const T=node?require('./tracing-core.js'):root.FloorPlanTracing;
 const KINDS=['door','sliding-door','window','opening'];
 const LABEL={door:'Puerta abatible','sliding-door':'Puerta corredera',window:'Ventana',opening:'Hueco de paso'};
 const EPS=1e-7,PROBE_MM=5;
 const fail=message=>{throw new Error(message);};
 const length=w=>Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
 const axis=w=>{const L=length(w);return {x:(w.end.x-w.start.x)/L,y:(w.end.y-w.start.y)/L};};
 // project-core.geometry: side 'left' opens towards (u.y, -u.x) — the left hand looking from start to end on a y-down plan.
 const normal=(w,side)=>{const u=axis(w);return side==='right'?{x:-u.y,y:u.x}:{x:u.y,y:-u.x};};
 const at=(w,t)=>({x:w.start.x+(w.end.x-w.start.x)*t/length(w),y:w.start.y+(w.end.y-w.start.y)*t/length(w)});
 const wallOf=(p,o)=>p.walls.find(w=>w.id===o.wallId)||fail('El hueco no tiene un muro válido.');

 function inside(poly,q){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function onEdge(poly,q){return poly.some((a,i)=>{const b=poly[(i+1)%poly.length],dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=l?Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/l)):0;return Math.hypot(a.x+t*dx-q.x,a.y+t*dy-q.y)<1e-6;});}
 const roomsAt=(p,q)=>p.rooms.filter(r=>inside(r.polygon,q)&&!onEdge(r.polygon,q));

 // Room on each side of a wall span [from, to] (mm along the wall). A side has a room only if three probes just
 // beyond the wall face (thickness/2 + 5 mm) all fall strictly inside the same single room and its name is unique.
 function spanSides(p,w,from,to){
  const out={};
  for(const side of ['left','right']){
   const n=normal(w,side),d=w.thicknessMm/2+PROBE_MM,found=[];
   for(const f of [.25,.5,.75]){const c=at(w,from+(to-from)*f);found.push(roomsAt(p,{x:c.x+n.x*d,y:c.y+n.y*d}));}
   const ids=new Set(found.map(list=>list.length===1?list[0].id:null));
   const room=ids.size===1&&!ids.has(null)?p.rooms.find(r=>r.id===[...ids][0]):null;
   const unique=room&&p.rooms.filter(r=>r.name.trim().toLowerCase()===room.name.trim().toLowerCase()).length===1;
   out[side]=room?{roomId:room.id,name:room.name,named:!!unique}:{roomId:null,reason:found.some(list=>list.length>1)?'overlapping-rooms':found.every(list=>!list.length)?'no-room':'mixed'};
  }
  return out;
 }
 function sides(p,o){return spanSides(p,wallOf(p,o),o.offsetMm,o.offsetMm+o.widthMm);}
 // What the panel shows for «Abre hacia»: a room name only when the side is unequivocal, otherwise «Lado 1/2».
 function sideLabels(p,o,display=n=>n){const s=sides(p,o);return {left:s.left.named?`Hacia «${display(s.left.name)}»`:'Lado 1',right:s.right.named?`Hacia «${display(s.right.name)}»`:'Lado 2',sides:s};}

 // Walls of a room: active walls with at least one 250 mm stretch whose probes fall inside the room on one side.
 function roomWalls(p,roomId){
  return p.walls.filter(w=>w.status!=='demolished').filter(w=>{const L=length(w),n=Math.max(1,Math.floor(L/250));
   for(let i=0;i<n;i++){const s=spanSides(p,w,L*i/n,L*(i+1)/n);if(s.left.roomId===roomId||s.right.roomId===roomId)return true;}return false;});
 }

 // Shared interval guard. Touching openings (end == start) are allowed; an opening must lie within its wall.
 function overlaps(p,wallId){
  const list=p.openings.filter(o=>o.wallId===wallId).sort((a,b)=>a.offsetMm-b.offsetMm||(a.id<b.id?-1:1)),out=[];
  for(let i=0;i<list.length;i++)for(let j=i+1;j<list.length;j++){const a=list[i],b=list[j],mm=Math.min(a.offsetMm+a.widthMm,b.offsetMm+b.widthMm)-Math.max(a.offsetMm,b.offsetMm);if(mm>EPS)out.push({a:a.id,b:b.id,wallId,overlapMm:mm});}
  return out;
 }
 // Conflicts already present in a project (e.g. an old JSON/ZIP). Reported, never rewritten.
 function conflicts(p){return p.walls.flatMap(w=>overlaps(p,w.id));}
 const pairKey=c=>[c.a,c.b].sort().join('|');
 // Rejects an operation that puts an opening outside its wall or creates (or worsens) an overlap on its wall.
 function guard(before,after,id){
  const o=after.openings.find(x=>x.id===id);if(!o)return [];
  const w=wallOf(after,o),L=length(w),problems=[];
  if(o.offsetMm<0)problems.push({code:'before-start',message:`El hueco empieza antes del inicio del muro, marcado «0» en el plano (posición ${o.offsetMm} mm).`});
  if(o.offsetMm+o.widthMm>L+EPS)problems.push({code:'past-end',message:`El hueco termina en ${o.offsetMm+o.widthMm} mm y el muro mide ${Math.floor(L)} mm: no cabe.`});
  const old=new Map(overlaps(before,o.wallId).map(c=>[pairKey(c),c.overlapMm]));
  for(const c of overlaps(after,o.wallId)){if(c.a!==id&&c.b!==id)continue;const prev=old.get(pairKey(c));if(prev===undefined||c.overlapMm>prev+EPS)problems.push({code:'overlap',other:c.a===id?c.b:c.a,overlapMm:c.overlapMm,message:`Se solaparía ${Math.round(c.overlapMm)} mm con ${describe(after,c.a===id?c.b:c.a)} en el mismo muro.`});}
  return problems;
 }
 function describe(p,id){const o=p.openings.find(x=>x.id===id);return o?`${LABEL[o.kind]||'hueco'} · tramo ${Math.round(o.offsetMm)}–${Math.round(o.offsetMm+o.widthMm)} mm`:'otro hueco';}
 function assertGuard(before,after,id){const problems=guard(before,after,id);if(problems.length){const e=new Error(problems.map(x=>x.message).join(' '));e.problems=problems;throw e;}}

 const int=(v,name)=>{const n=Number(v);if(!Number.isFinite(n))fail(`${name}: introduce un número en milímetros.`);return Math.round(n);};
 function defaults(kind,w){const height=kind==='window'?Math.min(1200,w.heightMm):Math.min(2100,w.heightMm);return {heightMm:height,sillHeightMm:kind==='window'?Math.min(900,w.heightMm-height):0};}
 // Preview of an edit: returns the next project and a plain-language list of what changes. Throws with the reason.
 function edit(p,id,changes){
  const next=C.clone(p),o=next.openings.find(x=>x.id===id)||fail('El hueco ya no existe.'),w=wallOf(next,o),before=JSON.stringify(o),notes=[];
  const kind=changes.kind??o.kind;if(!KINDS.includes(kind))fail('Tipo de hueco no admitido.');
  if(kind!==o.kind){
   notes.push(`Tipo: ${LABEL[o.kind]} → ${LABEL[kind]}.`);
   const d=defaults(kind,w);if(changes.heightMm===undefined&&(kind==='window')!==(o.kind==='window')){o.heightMm=d.heightMm;notes.push(`Alto: ${d.heightMm} mm (valor habitual del nuevo tipo).`);}
   if(changes.sillHeightMm===undefined&&(kind==='window')!==(o.kind==='window')){o.sillHeightMm=d.sillHeightMm;notes.push(`Antepecho: ${d.sillHeightMm} mm.`);}
   if(o.swing&&kind!=='door'){delete o.swing;notes.push('Se elimina el sentido de apertura: sólo existe en puertas abatibles.');}
   if(kind==='door'&&!o.swing){o.swing={hinge:'start',side:'left'};notes.push('Se crea un sentido de apertura inicial (bisagra A, lado 1): revísalo.');}
   o.kind=kind;
  }
  for(const [key,name]of [['offsetMm','Posición'],['widthMm','Ancho'],['heightMm','Alto'],['sillHeightMm','Antepecho']])if(changes[key]!==undefined){const v=int(changes[key],name);if(v!==o[key]){notes.push(`${name}: ${o[key]} → ${v} mm.`);o[key]=v;}}
  if(o.widthMm<1)fail('Ancho: al menos 1 mm.');if(o.heightMm<100)fail('Alto: al menos 100 mm.');if(o.sillHeightMm<0)fail('Antepecho: no puede ser negativo.');
  if(o.sillHeightMm+o.heightMm>w.heightMm)fail(`Alto más antepecho (${o.sillHeightMm+o.heightMm} mm) supera la altura del muro (${w.heightMm} mm).`);
  if(changes.hinge!==undefined||changes.side!==undefined){
   if(o.kind!=='door')fail('Sólo una puerta abatible tiene bisagra y sentido.');
   const hinge=changes.hinge??o.swing.hinge,side=changes.side??o.swing.side;
   if(!['start','end'].includes(hinge)||!['left','right'].includes(side))fail('Bisagra o sentido no válidos.');
   if(hinge!==o.swing.hinge)notes.push(`Bisagra: extremo ${o.swing.hinge==='start'?'A':'B'} → ${hinge==='start'?'A':'B'}.`);
   if(side!==o.swing.side)notes.push('Sentido de apertura cambiado.');
   o.swing={hinge,side};
  }
  if(JSON.stringify(o)===before)return {project:p,notes:[],changed:false};
  // Editing never certifies anything: the opening goes back to «unreviewed»; confirming stays an explicit action.
  o.source={method:o.source?.method||'manual',review:'unreviewed'};
  assertGuard(p,next,id);C.validate(next);
  return {project:next,notes,changed:true};
 }
 // Preview of a new opening of any contract kind on a wall of a room, centred where the wall was touched. A hinged
 // door opens into that room; the other kinds carry no swing.
 function add(p,roomId,wallId,kind,point,width=800){
  if(!KINDS.includes(kind))fail('Tipo de hueco no admitido.');
  if(!roomWalls(p,roomId).some(w=>w.id===wallId))fail('Ese muro no bordea la estancia seleccionada. Toca uno de sus muros resaltados.');
  const next=C.clone(p),o=T.opening(next,wallId,point,kind,width),w=wallOf(next,o);
  const s=spanSides(next,w,o.offsetMm,o.offsetMm+o.widthMm);
  if(s.left.roomId!==roomId&&s.right.roomId!==roomId)fail('En ese tramo el muro no separa la estancia seleccionada de forma inequívoca. Elige otro punto del muro o usa «Plano propio».');
  if(kind==='door')o.swing={hinge:'start',side:s.left.roomId===roomId?'left':'right'};
  assertGuard(p,next,o.id);C.validate(next);
  return {project:next,id:o.id};
 }
 // A wall edited in «Plano propio» may reverse direction. Its openings keep their physical place and leaf:
 // offset is mirrored and hinge/side flip with the axis. They go back to «unreviewed».
 function wallEdited(before,after,wallId){
  const a=before.walls.find(w=>w.id===wallId),b=after.walls.find(w=>w.id===wallId);if(!a||!b)return [];
  const ua=axis(a),ub=axis(b);if(ua.x*ub.x+ua.y*ub.y>=0)return [];
  const L=Math.floor(length(b)),moved=[];
  for(const o of after.openings.filter(x=>x.wallId===wallId)){
   o.offsetMm=Math.max(0,Math.round(L-o.offsetMm-o.widthMm));
   if(o.swing)o.swing={hinge:o.swing.hinge==='start'?'end':'start',side:o.swing.side==='left'?'right':'left'};
   o.source={method:o.source?.method||'manual',review:'unreviewed'};moved.push(o.id);
  }
  return moved;
 }
 const API={KINDS,LABEL,sides,sideLabels,spanSides,roomWalls,overlaps,conflicts,guard,assertGuard,edit,add,wallEdited,normal,length,describe};
 if(node)module.exports=API;else root.FloorPlanOpenings=API;
})(typeof globalThis==='object'?globalThis:this);
