/* Hybrid V2 «Dibujo vivo» — C0: pure core (no DOM, no three.js, no I/O).
   Decides, from the user's project data only, WHICH elements of each room are the protagonists that will later come to
   life (C2), WHEN each one does (deterministic, irregular moments), HOW LONG each room lasts in the cinematic autoplay
   and WHEN the camera leaves it (before 100 %), plus an OPTIONAL catalogue ambience that is kept apart from the client's
   own materials. Nothing here mutates or stores the project.
   Decisions it encodes (docs/product/hybrid-v2-living-drawing-proposal-2026-11-05.md §9):
   D1 — no dark, large object (a TV) and no plant opens a room; doors are never protagonists; at most one plant.
   D3 — ambience is a separate, labelled object («source: 'ambientacion'»), never written into the project.
   D4 — 5–8 s per room depending on its protagonists; the camera leaves at 70–80 % of the room.
   UMD: browser global FloorPlanLivingDrawing; CommonJS for tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanLivingDrawing=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const LIVING=Object.freeze({version:1,firstSeedS:.9,minGapS:.45,gapSpreadS:.45,minGapDeltaS:.06,roomMinS:5,roomMaxS:8,roomBaseS:5,roomPerSeedS:.5,leaveMin:.7,leaveMax:.8,maxProtagonists:6,darkLuminance:.06,
  label:'Ambientación sugerida · no forma parte del proyecto'});
 // Protagonists by room class, in order of importance (furniture `type` values of RUBIK's catalogue).
 const RANK=Object.freeze({
  living:['sofa','coffeetable','rug','tvstand','armchair','roundtable','bookshelf','plant'],
  dining:['table','roundtable','cabinet','fridge','chair','plant'],
  kitchen:['counter','fridge','stove','ksink','table','cabinet','plant'],
  bedroom:['bed','wardrobe','desk','nightstand','bookshelf','baycushion','chair','plant'],
  bathroom:['vanity','bathtub','shower','toilet'],
  laundry:['washer','vanity','counter'],
  terrace:['roundtable','armchair','table','plant'],
  other:['sofa','table','bed','counter','desk','wardrobe','cabinet','armchair','plant']});
 // Objects that read as large dark masses in the 3D view (screens): never the first stain of a room (D1).
 const DARK_TYPES=new Set(['tvstand','tv','television','screen']);
 const PER_TYPE=Object.freeze({counter:2,chair:1,plant:1,armchair:2,nightstand:1});
 const NAME_HINTS=[[/sal[oó]n|estar|living|lounge|客厅|起居/i,'living'],[/comedor|dining|餐厅/i,'dining'],[/cocina|kitchen|厨房/i,'kitchen'],
  [/dormitorio|habitaci[oó]n|bedroom|卧|房$/i,'bedroom'],[/ba[nñ]o|aseo|bath|卫/i,'bathroom'],[/lavader|laundry|洗衣/i,'laundry'],[/terraza|balc[oó]n|terrace|balcony|阳台/i,'terrace']];
 const FAMILY={living:'living',dining:'dining',kitchen:'kitchen',bedroom:'bedroom',bathroom:'bathroom',toilet:'bathroom',laundry:'laundry',terrace:'terrace',balcony:'terrace'};

 // —— small pure helpers ——
 function hash(str){let h=0x811c9dc5;for(let i=0;i<str.length;i++){h^=str.charCodeAt(i);h=Math.imul(h,0x01000193);}return h>>>0;}
 function prng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296;};}
 const clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
 const round=(v,d=3)=>Math.round(v*10**d)/10**d;
 function luminance(hex){const m=/^#?([0-9a-f]{6})$/i.exec(hex||'');if(!m)return null;const n=parseInt(m[1],16),c=[(n>>16)&255,(n>>8)&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});return .2126*c[0]+.7152*c[1]+.0722*c[2];}
 function inside(poly,x,y){let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])hit=!hit;}return hit;}
 const polyOf=room=>room.poly||(room.polygon||[]).map(p=>[p.x,p.y]);
 const isDark=o=>DARK_TYPES.has(o.type)||((luminance(o.color)??1)<LIVING.darkLuminance);

 /* Objects of a room: by roomId when the object carries it, otherwise by its centre inside the room polygon. */
 function objectsIn(project,room){const poly=polyOf(room);return (project?.objects||[]).filter(o=>o&&o.position&&(o.roomId?o.roomId===room.id:inside(poly,o.position.x,o.position.y)));}
 /* Room class: the declared family first, then what the room contains, then its name. */
 function classify(room,objects){
  if(FAMILY[room?.family])return FAMILY[room.family];
  const t=new Set((objects||[]).map(o=>o.type));
  if(t.has('counter')||t.has('stove')||t.has('ksink'))return 'kitchen';
  if(t.has('toilet')||t.has('shower')||t.has('bathtub'))return 'bathroom';
  if(t.has('bed'))return 'bedroom';
  if(t.has('sofa'))return 'living';
  if(t.has('table')&&[...(objects||[])].filter(o=>o.type==='chair').length>=2)return 'dining';
  if(t.has('washer'))return 'laundry';
  for(const [re,c] of NAME_HINTS)if(re.test(room?.name||''))return c;
  return 'other';
 }
 /* Ordered protagonists of a room (D1). Independent of the order of project.objects. */
 function protagonists(roomClass,objects,{max=LIVING.maxProtagonists}={}){
  const rank=RANK[roomClass]||RANK.other,score=o=>{const i=rank.indexOf(o.type);return i<0?99:i;};
  const pool=(objects||[]).filter(o=>o&&rank.includes(o.type)).slice().sort((a,b)=>score(a)-score(b)||(b.size?.widthMm||0)*(b.size?.depthMm||0)-(a.size?.widthMm||0)*(a.size?.depthMm||0)||String(a.id).localeCompare(String(b.id)));
  const taken={},out=[];
  for(const o of pool){const cap=PER_TYPE[o.type]??1;if((taken[o.type]||0)>=cap)continue;taken[o.type]=(taken[o.type]||0)+1;out.push(o);if(out.length>=max)break;}
  // D1: the room is told by its main pieces; plants come after them and dark masses (a TV) last of all, so a black slab
  // never takes over the view while the camera is in the room (it lands just before the camera leaves). Stable within
  // each group; the first stain is therefore never a dark mass nor a plant when anything else exists.
  const group=o=>isDark(o)?2:o.type==='plant'?1:0;
  out.splice(0,out.length,...out.map((o,i)=>({o,i})).sort((a,b)=>group(a.o)-group(b.o)||a.i-b.i).map(x=>x.o));
  return out.map((o,i)=>({id:o.id,type:o.type,rank:i,dark:isDark(o),position:{x:o.position.x,y:o.position.y},reason:i===0?'opens the room':isDark(o)?'dark mass — never first':o.type==='plant'?'secondary only':'protagonist'}));
 }
 /* Deterministic, irregular moments for a room's protagonists, seconds from the room's start. */
 function seeds(key,list){
  const rnd=prng(hash(String(key))),out=[];let t=LIVING.firstSeedS,prev=null;
  for(let i=0;i<list.length;i++){
   if(i>0){let g=LIVING.minGapS+rnd()*LIVING.gapSpreadS;
    // never two equal intervals in a row (mechanical rhythm): push away from the previous gap, never under the minimum
    if(prev!==null&&Math.abs(g-prev)<LIVING.minGapDeltaS){g=g>=prev?prev+LIVING.minGapDeltaS:prev-LIVING.minGapDeltaS;if(g<LIVING.minGapS)g=prev+LIVING.minGapDeltaS;}
    t+=g;prev=g;}
   out.push({id:list[i].id,type:list[i].type,rank:list[i].rank,at:round(t),...(list[i].dark?{dark:true}:{})});
  }
  return out;
 }
 function roomDuration(n){return round(clamp(LIVING.roomBaseS+LIVING.roomPerSeedS*(n-3),LIVING.roomMinS,LIVING.roomMaxS));}
 /* Autoplay timeline for an ordered list of rooms. project: FloorPlanProjectV1-like; geometry: rooms with poly
    (FloorPlanCore.geometry). order: room ids in visiting order (default: rooms with at least one protagonist, as listed).
    The camera leaves each room at 70–80 % of it (deterministic per room). */
 function timeline(project,geometry,{order=null,reduced=false}={}){
  const rooms=(geometry?.rooms||[]).filter(r=>polyOf(r).length>=3),byId=new Map(rooms.map(r=>[r.id,r])),key=project?.id||'project';
  const plan=[];
  for(const room of rooms){const objs=objectsIn(project,room),cls=classify(room,objs),list=protagonists(cls,objs);plan.push({room,cls,list});}
  const chosen=(order||plan.filter(p=>p.list.length).map(p=>p.room.id)).map(id=>plan.find(p=>p.room.id===id)).filter(Boolean);
  let start=0;const out=[];
  for(const p of chosen){const duration=roomDuration(p.list.length),rnd=prng(hash(key+'|leave|'+p.room.id)),leaveFrac=round(LIVING.leaveMin+(LIVING.leaveMax-LIVING.leaveMin)*rnd(),3);
   const s=seeds(key+'|'+p.room.id,p.list).filter(x=>x.at<duration);
   out.push({roomId:p.room.id,roomClass:p.cls,start:round(start),duration,leaveAt:round(start+duration*leaveFrac),leaveFrac,protagonists:p.list,seeds:s});start+=duration;}
  return Object.freeze({version:LIVING.version,motion:reduced?'reduced':'full',total:round(start),rooms:out,missing:(order||[]).filter(id=>!byId.has(id))});
 }
 /* Pure state at story progress p (0..1): which room, how far into it, whether the camera is leaving, which stains have
    landed. Same p → same state, whatever was asked before (seek and reverse are exact). */
 function stateAt(tl,p){
  const total=tl?.total||0,t=clamp(Number(p)||0,0,1)*total;
  if(!tl||!tl.rooms.length)return {t:0,roomIndex:-1,roomId:null,roomP:0,leaving:false,cameraHold:true,seeds:[]};
  let i=tl.rooms.findIndex(r=>t<r.start+r.duration);if(i<0)i=tl.rooms.length-1;
  const r=tl.rooms[i],local=t-r.start;
  return {t:round(t),roomIndex:i,roomId:r.roomId,roomP:round(clamp(local/r.duration,0,1)),leaving:tl.motion==='full'&&t>=r.leaveAt,cameraHold:tl.motion==='reduced',
   seeds:r.seeds.map(s=>({id:s.id,age:round(local-s.at),landed:local>=s.at}))};
 }
 /* Optional ambience (D3): catalogue finishes SUGGESTED for the presentation only, beside the project's originals. Never
    mutates the project; returns a frozen, labelled object. catalogue: entries {id, applications:[...]} (FloorPlanSurfaces). */
 const AMBIENCE=Object.freeze({living:{floor:'surface-oak-wood-planks'},dining:{floor:'surface-oak-wood-planks'},bedroom:{floor:'surface-oak-wood-planks'},
  kitchen:{floor:'surface-marble-01',wall:'surface-long-white-tiles'},bathroom:{floor:'surface-large-floor-tiles-02',wall:'surface-long-white-tiles'},other:{}});
 function ambience(project,geometry,catalogue,{rooms=null}={}){
  const entries=new Map((catalogue||[]).map(e=>[e.id,e])),ok=(id,kind)=>!!id&&entries.get(id)?.applications?.includes(kind);
  const materialName=id=>(project?.materials||[]).find(m=>m.id===id)?.name||null,out=[];
  for(const room of (geometry?.rooms||[])){if(rooms&&!rooms.includes(room.id))continue;const pr=(project?.rooms||[]).find(r=>r.id===room.id);
   const cls=classify(room,objectsIn(project,room)),s=AMBIENCE[cls]||AMBIENCE.other;
   // a finish the client already chose from the catalogue is the project's own: the ambience never covers it
   const chosen=(project?.materials||[]).find(m=>m.id===pr?.floorMaterialId)?.appearance?.preset?.startsWith?.('surface-');
   if(ok(s.floor,'floor')&&!chosen)out.push({roomId:room.id,surface:'floor',suggested:s.floor,original:pr?.floorMaterialId??null,originalName:materialName(pr?.floorMaterialId)});
   if(ok(s.wall,'wall'))out.push({roomId:room.id,surface:'walls',suggested:s.wall,original:null,originalName:null});}
  return Object.freeze({source:'ambientacion',label:LIVING.label,optional:true,defaultOn:false,storesInProject:false,suggestions:Object.freeze(out.map(Object.freeze))});
 }
 return {LIVING,RANK,classify,protagonists,objectsIn,seeds,roomDuration,timeline,stateAt,ambience,luminance,hash};
});
