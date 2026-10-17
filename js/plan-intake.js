/* Upload intake: format detection by content and conversion of vector/scan sources to FloorPlanProjectV1. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const T=typeof module==='object'?require('./tracing-core.js'):root.FloorPlanTracing;
 const LIMITS={uploadBytes:200*1024*1024,rasterSide:T.LIMITS.pixels,rasterPixels:40e6,dxfSegments:6000,margin:1000};
 const LABELS={pdf:'PDF',png:'PNG',jpeg:'JPEG',webp:'WebP',gif:'GIF',bmp:'BMP',tiff:'TIFF',heic:'HEIC/HEIF',avif:'AVIF',svg:'SVG',dxf:'DXF','dxf-binary':'DXF binario',dwg:'DWG',ifc:'IFC',step:'STEP',zip:'ZIP',usdz:'USDZ',json:'JSON',unknown:'desconocido'};
 const latin=(b,n)=>Array.from(b.subarray(0,Math.min(n,b.length)),c=>String.fromCharCode(c)).join('');

 // The file name never decides the format; it is only used to distinguish a USDZ package from a plain ZIP.
 function sniff(bytes,name=''){
  const b=bytes instanceof Uint8Array?bytes:new Uint8Array(bytes),at=(sig,off=0)=>b.length>=off+sig.length&&sig.every((v,i)=>b[off+i]===v);
  if(!b.length)return 'unknown';
  const head=latin(b,4096);
  if(head.startsWith('%PDF-'))return 'pdf';
  if(at([137,80,78,71,13,10,26,10]))return 'png';
  if(at([255,216,255]))return 'jpeg';
  if(head.startsWith('RIFF')&&head.slice(8,12)==='WEBP')return 'webp';
  if(head.startsWith('GIF87a')||head.startsWith('GIF89a'))return 'gif';
  if(head.startsWith('BM')&&b.length>=26&&[12,40,52,56,64,108,124].includes(b[14]|b[15]<<8|b[16]<<16|b[17]<<24))return 'bmp';
  if(at([0x49,0x49,0x2a,0])||at([0x4d,0x4d,0,0x2a]))return 'tiff';
  if(head.slice(4,8)==='ftyp'){const box=((b[0]<<24)|(b[1]<<16)|(b[2]<<8)|b[3])>>>0,brands=head.slice(8,Math.max(12,Math.min(box,64)));if(/avif|avis/.test(brands))return 'avif';if(/hei[cxms]|hev[cx]|mif1|msf1/.test(brands))return 'heic';}
  if(at([0x50,0x4b,3,4]))return /\.usdz$/i.test(name)||/\.usd[ac]?\b/.test(latin(b,512))?'usdz':'zip';
  if(/^AC10\d\d/.test(head))return 'dwg';
  if(head.startsWith('AutoCAD Binary DXF'))return 'dxf-binary';
  const t=head.replace(/^\xEF\xBB\xBF/,'').trimStart();
  if(t.startsWith('ISO-10303-21'))return /FILE_SCHEMA\s*\(\s*\(\s*'IFC/i.test(head)?'ifc':'step';
  if(/^0\s*\r?\n\s*SECTION\s*\r?\n/.test(t)||/^999\s*\r?\n/.test(t))return 'dxf';
  if(/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(t))return 'svg';
  if(t.startsWith('{')||t.startsWith('['))return 'json';
  return 'unknown';
 }
 function classifyJson(value){
  if(value&&typeof value==='object'&&!Array.isArray(value)){
   if(Array.isArray(value.walls)&&value.walls.length&&value.walls.every(w=>rpMatrix(w?.transform)&&Array.isArray(w.dimensions)))return 'roomplan';
   if(value.type==='FeatureCollection'||value.type==='Feature')return 'geojson';
  }
  return 'project';
 }
 // Uniform reduction keeping the aspect ratio; the plan is calibrated afterwards, so no scale is lost.
 function fitRaster(width,height,maxSide=LIMITS.rasterSide,maxPixels=LIMITS.rasterPixels){
  if(!(width>0&&height>0))throw Error('Dimensiones de imagen no válidas.');
  const factor=Math.min(1,maxSide/Math.max(width,height),Math.sqrt(maxPixels/(width*height)));
  return {factor,width:Math.max(1,Math.floor(width*factor)),height:Math.max(1,Math.floor(height*factor))};
 }

 const UNIT_MM={1:25.4,2:304.8,4:1,5:10,6:1000,14:100};
 const UNIT_NAME={0:'sin unidades (se asumen mm)',1:'pulgadas',2:'pies',4:'mm',5:'cm',6:'m',14:'dm'};
 const WALL_LAYER=/mur|wall|tabiq|pared|cerram|fachad|partition|a-wal/i,DOOR=/door|puert/i,WINDOW=/window|ventan/i;
 function segmentsOf(entity){
  const v=entity.vertices||[],out=[];
  if(entity.type==='LINE'&&v.length>=2)out.push([v[0],v[1]]);
  if((entity.type==='LWPOLYLINE'||entity.type==='POLYLINE')&&v.length>=2){for(let i=0;i+1<v.length;i++)out.push([v[i],v[i+1]]);if(entity.shape&&v.length>2)out.push([v[v.length-1],v[0]]);}
  return out.filter(([a,b])=>[a?.x,a?.y,b?.x,b?.y].every(Number.isFinite));
 }
 // Two parallel overlapping faces 50–600 mm apart are one wall: centre line plus measured thickness.
 function pairFaces(segments){
  const n=segments.length,used=new Uint8Array(n),walls=[];
  const info=segments.map(([a,b])=>{const dx=b.x-a.x,dy=b.y-a.y,len=Math.hypot(dx,dy);return {a,b,len,ux:dx/len,uy:dy/len};});
  for(let i=0;i<n;i++){
   if(used[i])continue;const s=info[i];let best=null;
   for(let j=i+1;j<n;j++){
    if(used[j])continue;const o=info[j];
    if(Math.abs(s.ux*o.uy-s.uy*o.ux)>0.0175)continue;
    const dist=Math.abs((o.a.x-s.a.x)*-s.uy+(o.a.y-s.a.y)*s.ux);if(dist<50||dist>600)continue;
    const p0=(o.a.x-s.a.x)*s.ux+(o.a.y-s.a.y)*s.uy,p1=(o.b.x-s.a.x)*s.ux+(o.b.y-s.a.y)*s.uy,omin=Math.min(p0,p1),omax=Math.max(p0,p1);
    if(Math.min(s.len,omax)-Math.max(0,omin)<0.5*Math.min(s.len,o.len))continue;
    // The centre line ends halfway between both faces, so outer and inner corners meet on the wall axis.
    if(!best||dist<best.dist)best={j,dist,lo:omin/2,hi:(s.len+omax)/2};
   }
   if(best){
    used[i]=used[best.j]=1;const o=info[best.j],side=Math.sign((o.a.x-s.a.x)*-s.uy+(o.a.y-s.a.y)*s.ux)||1,nx=-s.uy*side*best.dist/2,ny=s.ux*side*best.dist/2;
    walls.push({a:{x:s.a.x+s.ux*best.lo+nx,y:s.a.y+s.uy*best.lo+ny},b:{x:s.a.x+s.ux*best.hi+nx,y:s.a.y+s.uy*best.hi+ny},thickness:best.dist,paired:true});
   }
  }
  for(let i=0;i<n;i++)if(!used[i])walls.push({a:info[i].a,b:info[i].b,thickness:null,paired:false});
  return walls;
 }
 // ---- Plan assembly shared by DXF, vector PDF and IFC: walls (axis + thickness) → openings → rooms. ----
 const DEFAULT_T=100,len2=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 const frame=w=>{const L=len2(w.a,w.b)||1;return {L,ux:(w.b.x-w.a.x)/L,uy:(w.b.y-w.a.y)/L};};
 const along=(w,p)=>{const f=frame(w);return (p.x-w.a.x)*f.ux+(p.y-w.a.y)*f.uy;};
 const across=(w,p)=>{const f=frame(w);return Math.abs((p.x-w.a.x)*-f.uy+(p.y-w.a.y)*f.ux);};
 const at=(w,t)=>{const f=frame(w);return {x:w.a.x+f.ux*t,y:w.a.y+f.uy*t};};
 const thick=w=>w.thickness||DEFAULT_T;
 const parallel=(v,w)=>{const a=frame(v),b=frame(w);return Math.abs(a.ux*b.uy-a.uy*b.ux)<0.0175;};
 function lineHit(w,h){const a=frame(w),b=frame(h),den=a.ux*b.uy-a.uy*b.ux;if(Math.abs(den)<1e-9)return null;const dx=h.a.x-w.a.x,dy=h.a.y-w.a.y,t=(dx*b.uy-dy*b.ux)/den,u=(dx*a.uy-dy*a.ux)/den;return {t,u,point:{x:w.a.x+a.ux*t,y:w.a.y+a.uy*t}};}
 // Double-line drawings: jambs and end caps are short unpaired lines; single faces inside a paired wall are duplicates.
 function cleanWalls(input){
  const anyPaired=input.some(w=>w.paired);
  let walls=input.map(w=>({...w,openings:[...(w.openings||[])]})).filter(w=>len2(w.a,w.b)>=50&&(!anyPaired||w.paired||len2(w.a,w.b)>=400));
  if(anyPaired)walls=walls.filter(w=>w.paired||!walls.some(h=>h!==w&&h.paired&&[w.a,w.b].every(p=>across(h,p)<=thick(h)/2+5&&along(h,p)>=-5&&along(h,p)<=frame(h).L+5)));
  walls=walls.filter((w,i)=>!walls.some((h,j)=>j!==i&&parallel(h,w)&&Math.abs(thick(h)-thick(w))<=30&&[w.a,w.b].every(p=>across(h,p)<=30&&along(h,p)>=-5&&along(h,p)<=frame(h).L+5)&&(len2(h.a,h.b)>len2(w.a,w.b)||j<i)));
  // T-junctions and corners: extend an end to the axis of the wall it touches (within that wall's half thickness).
  for(const w of walls)for(const end of ['a','b']){
   let best=null;
   for(const h of walls){
    if(h===w||parallel(h,w))continue;const hit=lineHit(w,h);if(!hit)continue;
    const move=len2(w[end],hit.point),tol=thick(h)/2+60,L=frame(h).L;
    if(move>tol||hit.u<-tol||hit.u>L+tol)continue;
    if(!best||move<best.move)best={move,point:hit.point,h,u:hit.u};
   }
   if(best){w[end]=best.point;const h=best.h,L=frame(h).L;if(best.u<0)h.a=best.point;else if(best.u>L)h.b=best.point;}
  }
  return walls;
 }
 // Two collinear pieces of similar thickness separated by 0.45–2.7 m are one wall with an opening in the gap.
 function mergeGaps(walls){
  let merged=true;
  while(merged){
   merged=false;
   outer:for(let i=0;i<walls.length;i++)for(let j=i+1;j<walls.length;j++){
    const v=walls[i],w=walls[j];
    if(!parallel(v,w)||across(v,w.a)>30||across(v,w.b)>30||Math.abs(thick(v)-thick(w))>30)continue;
    const L=frame(v).L,ja=along(v,w.a),jb=along(v,w.b),lo=Math.min(ja,jb),hi=Math.max(ja,jb);
    let gap=null;if(lo>L)gap=[L,lo];else if(hi<0)gap=[hi,0];if(!gap)continue;
    const g=gap[1]-gap[0];if(g<450||g>2700)continue;
    const start=Math.min(0,lo),end=Math.max(L,hi);
    const next={a:at(v,start),b:at(v,end),thickness:Math.max(thick(v),thick(w)),paired:v.paired||w.paired,openings:[...v.openings,...w.openings,{p1:at(v,gap[0]),p2:at(v,gap[1]),kind:'opening',gap:true}]};
    walls.splice(j,1);walls.splice(i,1,next);merged=true;break outer;
   }
  }
  return walls;
 }
 // Door/window evidence (CAD blocks, swing arcs, BIM elements) becomes an opening on the wall it sits on.
 function placeHints(walls,hints){
  let placed=0,upgraded=0,skipped=0;
  for(const hint of hints){
   let best=null;const pool=hint.wallRef&&walls.some(w=>w.ref===hint.wallRef)?walls.filter(w=>w.ref===hint.wallRef):walls;
   for(const w of pool){
    const L=frame(w).L,ts=hint.points.map(p=>along(w,p)),near=Math.min(...hint.points.map(p=>across(w,p)));
    const t0=Math.max(0,Math.min(...ts)),t1=Math.min(L,Math.max(...ts));
    if(near>thick(w)/2+150||t1-t0<300)continue;
    if(!best||near<best.near)best={w,t0,t1,near};
   }
   if(!best){skipped++;continue;}
   const {w,t0,t1}=best,existing=w.openings.find(o=>{const a=Math.min(along(w,o.p1),along(w,o.p2)),b=Math.max(along(w,o.p1),along(w,o.p2));return Math.min(b,t1)-Math.max(a,t0)>=0.5*Math.min(b-a,t1-t0);});
   if(existing){if(existing.kind==='opening'||hint.strong&&!(hint.windowLine))existing.kind=hint.kind;if(hint.meta)existing.meta=hint.meta;upgraded++;continue;}
   if(hint.weak){skipped++;continue;}
   const width=Math.max(400,Math.min(3000,t1-t0)),mid=(t0+t1)/2;
   w.openings.push({p1:at(w,mid-width/2),p2:at(w,mid+width/2),kind:hint.kind,meta:hint.meta});placed++;
  }
  return {placed,upgraded,skipped};
 }
 function signedArea(poly){let s=0;for(let i=0;i<poly.length;i++){const a=poly[i],b=poly[(i+1)%poly.length];s+=a.x*b.y-b.x*a.y;}return s/2;}
 function inside(p,poly){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)c=!c;}return c;}
 // Rooms are the bounded faces of the wall-axis graph, shrunk by half of each bounding wall's thickness.
 function findRooms(walls,labels=[]){
  const cuts=walls.map(w=>[0,frame(w).L]);
  for(let i=0;i<walls.length;i++)for(let j=i+1;j<walls.length;j++){const hit=lineHit(walls[i],walls[j]);if(!hit)continue;const Li=frame(walls[i]).L,Lj=frame(walls[j]).L;if(hit.t>=-2&&hit.t<=Li+2&&hit.u>=-2&&hit.u<=Lj+2){cuts[i].push(Math.max(0,Math.min(Li,hit.t)));cuts[j].push(Math.max(0,Math.min(Lj,hit.u)));}}
  const nodes=[],key=p=>{let n=nodes.findIndex(q=>len2(q,p)<=5);if(n<0){nodes.push({x:p.x,y:p.y});n=nodes.length-1;}return n;},edges=new Map();
  walls.forEach((w,i)=>{const ts=[...new Set(cuts[i].map(t=>Math.round(t)))].sort((a,b)=>a-b);for(let k=0;k+1<ts.length;k++){if(ts[k+1]-ts[k]<5)continue;const u=key(at(w,ts[k])),v=key(at(w,ts[k+1]));if(u===v)continue;const id=u<v?`${u}-${v}`:`${v}-${u}`;if(!edges.has(id))edges.set(id,{u,v,t:thick(w)});}});
  let list=[...edges.values()];
  for(let pruned=true;pruned;){pruned=false;const deg=new Map();for(const e of list){deg.set(e.u,(deg.get(e.u)||0)+1);deg.set(e.v,(deg.get(e.v)||0)+1);}const kept=list.filter(e=>deg.get(e.u)>1&&deg.get(e.v)>1);if(kept.length<list.length){list=kept;pruned=true;}}
  const out=new Map();for(const e of list){for(const [a,b]of [[e.u,e.v],[e.v,e.u]]){if(!out.has(a))out.set(a,[]);out.get(a).push({to:b,t:e.t,angle:Math.atan2(nodes[b].y-nodes[a].y,nodes[b].x-nodes[a].x)});}}
  for(const arr of out.values())arr.sort((x,y)=>x.angle-y.angle);
  const seen=new Set(),faces=[];
  for(const [start,arr]of out)for(const first of arr){
   if(seen.has(`${start}>${first.to}`))continue;const poly=[],thicknesses=[];let u=start,e=first,guard=0;
   while(!seen.has(`${u}>${e.to}`)&&guard++<1000){seen.add(`${u}>${e.to}`);poly.push(nodes[u]);thicknesses.push(e.t);const v=e.to,around=out.get(v),back=around.findIndex(x=>x.to===u);const next=around[(back-1+around.length)%around.length];u=v;e=next;}
   if(poly.length>=3)faces.push({poly,thicknesses,area:signedArea(poly)});
  }
  if(!faces.length)return [];
  const outerSign=Math.sign(faces.reduce((m,f)=>Math.abs(f.area)>Math.abs(m.area)?f:m).area),rooms=[];
  for(const f of faces){
   if(Math.sign(f.area)===outerSign||Math.abs(f.area)<1e6)continue;
   // Merge collinear consecutive edges, then offset every edge inwards by half its wall thickness.
   const pts=[],ts=[];for(let i=0;i<f.poly.length;i++){const a=f.poly[(i-1+f.poly.length)%f.poly.length],b=f.poly[i],c=f.poly[(i+1)%f.poly.length],cross=(b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x);if(Math.abs(cross)>1e-6*len2(a,b)*len2(b,c)){pts.push(b);ts.push(f.thicknesses[i]);}}
   if(pts.length<3)continue;const ccw=signedArea(pts)>0,lines=pts.map((a,i)=>{const b=pts[(i+1)%pts.length],L=len2(a,b),nx=(ccw?-1:1)*(b.y-a.y)/L,ny=(ccw?1:-1)*(b.x-a.x)/L,d=ts[i]/2;return {a:{x:a.x+nx*d,y:a.y+ny*d},b:{x:b.x+nx*d,y:b.y+ny*d}};});
   const poly=lines.map((l,i)=>{const prev=lines[(i-1+lines.length)%lines.length],hit=lineHit(prev,l);return hit?hit.point:l.a;});
   if(Math.abs(signedArea(poly))<0.5e6||poly.length>200)continue;
   const label=labels.find(l=>inside(l.point,poly)&&!/\d/.test(l.text)&&l.text.trim());
   rooms.push({polygon:poly,name:label?label.text.trim().slice(0,100):null});
  }
  return rooms;
 }
 function buildProject({name,walls,rooms,map,scale,wallStatus='new'}){
  const p=T.blank(name),ids=[];let skippedOpenings=0;
  for(const w of walls){const a=C.point(map(w.a)),b=C.point(map(w.b));if(len2(a,b)<10){ids.push(null);continue;}const id=C.id('wal');ids.push(id);p.walls.push({id,start:a,end:b,thicknessMm:Math.max(10,Math.min(1500,Math.round(thick(w)))),heightMm:w.height>=500&&w.height<=100000?Math.round(w.height):p.defaults.wallHeightMm,structure:'unknown',status:wallStatus,source:{method:'imported',review:'unreviewed'}});}
  walls.forEach((w,i)=>{if(!ids[i])return;for(const o of w.openings||[]){const c=map({x:(o.p1.x+o.p2.x)/2,y:(o.p1.y+o.p2.y)/2}),width=Math.round(len2(o.p1,o.p2));try{const made=T.opening(p,ids[i],c,o.kind,width),wallHeight=p.walls.find(x=>x.id===ids[i]).heightMm,m=o.meta;made.source={method:'imported',review:'unreviewed'};if(m&&m.heightMm>0){const sill=m.sillHeightMm??made.sillHeightMm;if(sill>=0&&m.heightMm+sill<=wallHeight){made.heightMm=m.heightMm;made.sillHeightMm=sill;}}}catch{skippedOpenings++;}}});
  const floor=p.materials.find(m=>m.category==='floor').id;let n=0;
  for(const r of rooms){const polygon=r.polygon.map(q=>C.point(map(q)));const labelAt=C.point({x:polygon.reduce((s,v)=>s+v.x,0)/polygon.length,y:polygon.reduce((s,v)=>s+v.y,0)/polygon.length});p.rooms.push({id:C.id('rom'),name:r.name||`Estancia ${++n}`,polygon,labelAt,floorMaterialId:floor,countsTowardArea:true,source:{method:'imported',review:'unreviewed'}});}
  p.scale=scale;C.validate(p);
  const kinds={door:0,window:0,opening:0};for(const o of p.openings)kinds[o.kind==='sliding-door'?'door':o.kind]++;
  return {project:p,openings:kinds,skippedOpenings};
 }
 function assemble(rawWalls,{hints=[],labels=[]}={}){
  const walls=mergeGaps(cleanWalls(rawWalls)),evidence=placeHints(walls,hints),rooms=findRooms(walls,labels);
  return {walls,rooms,evidence};
 }
 function bounds(walls){const xs=walls.flatMap(w=>[w.a.x,w.b.x]),ys=walls.flatMap(w=>[w.a.y,w.b.y]);return {minX:Math.min(...xs),maxX:Math.max(...xs),minY:Math.min(...ys),maxY:Math.max(...ys)};}

 // Extent of the swept part only (end points plus the quadrant points inside the sweep), not the full circle.
 function arcPoints(e){
  const {center:c,radius:r}=e;if(e.type!=='ARC')return [{x:c.x-r,y:c.y-r},{x:c.x+r,y:c.y+r}];
  const start=e.startAngle,end=e.endAngle>start?e.endAngle:e.endAngle+2*Math.PI,angles=[start,end];
  for(let k=Math.ceil(start/(Math.PI/2));k*Math.PI/2<end;k++)angles.push(k*Math.PI/2);
  return [c,...angles.map(a=>({x:c.x+r*Math.cos(a),y:c.y+r*Math.sin(a)}))];
 }
 function blockPoints(block){
  const pts=[];for(const e of block?.entities||[]){if(e.vertices)pts.push(...e.vertices);if(e.center&&e.radius)pts.push(...arcPoints(e));if(e.position)pts.push(e.position);}
  return pts.filter(p=>Number.isFinite(p?.x)&&Number.isFinite(p?.y));
 }
 function insertFootprint(e,block,toMm){
  const pts=blockPoints(block);if(!pts.length)return null;const base=block.position||{x:0,y:0},xs=pts.map(p=>p.x-base.x),ys=pts.map(p=>p.y-base.y);
  const corners=[[Math.min(...xs),Math.min(...ys)],[Math.max(...xs),Math.min(...ys)],[Math.max(...xs),Math.max(...ys)],[Math.min(...xs),Math.max(...ys)]],r=(e.rotation||0)*Math.PI/180,sx=e.xScale??1,sy=e.yScale??1;
  return corners.map(([x,y])=>{const X=x*sx,Y=y*sy;return {x:(e.position.x+X*Math.cos(r)-Y*Math.sin(r))*toMm,y:(e.position.y+X*Math.sin(r)+Y*Math.cos(r))*toMm};});
 }
 function dxfToProject(dxf,{name='Plano DXF'}={}){
  if(!dxf||!Array.isArray(dxf.entities))throw Error('El DXF no contiene entidades legibles.');
  const units=dxf.header?.$INSUNITS??0,toMm=units===0?1:UNIT_MM[units];
  if(!toMm)throw Error(`Unidades DXF no admitidas ($INSUNITS=${units}). Exporta el plano en mm, cm o m.`);
  const all=[],hints=[],labels=[],inserts={doors:0,windows:0};
  for(const e of dxf.entities){
   if(e.type==='INSERT'){const key=`${e.layer||''} ${e.name||''}`,kind=DOOR.test(key)?'door':WINDOW.test(key)?'window':null;if(!kind)continue;inserts[kind+'s']++;const points=insertFootprint(e,dxf.blocks?.[e.name],toMm);if(points)hints.push({kind,points,strong:true});continue;}
   if(e.type==='ARC'&&e.radius*toMm>=500&&e.radius*toMm<=1300&&Math.abs((e.angleLength??Math.abs(e.endAngle-e.startAngle))-Math.PI/2)<0.35){const c={x:e.center.x*toMm,y:e.center.y*toMm},R=e.radius*toMm;hints.push({kind:'door',points:[c,{x:c.x+R*Math.cos(e.startAngle),y:c.y+R*Math.sin(e.startAngle)},{x:c.x+R*Math.cos(e.endAngle),y:c.y+R*Math.sin(e.endAngle)}],weak:!DOOR.test(e.layer||'')});continue;}
   if((e.type==='TEXT'||e.type==='MTEXT')&&e.text){const q=e.startPoint||e.position;if(q)labels.push({text:String(e.text).replace(/\\[A-Za-z][^;]*;|[{}]/g,'').replace(/\\P/g,' '),point:{x:q.x*toMm,y:q.y*toMm}});continue;}
   for(const seg of segmentsOf(e))all.push({layer:e.layer||'0',seg:[{x:seg[0].x*toMm,y:seg[0].y*toMm},{x:seg[1].x*toMm,y:seg[1].y*toMm}]});
  }
  const onWallLayers=all.filter(s=>WALL_LAYER.test(s.layer)),chosen=(onWallLayers.length?onWallLayers:all).filter(s=>len2(s.seg[0],s.seg[1])>=50);
  if(!chosen.length)throw Error('No se encontraron líneas de muro (LINE/LWPOLYLINE/POLYLINE) en el DXF.');
  if(chosen.length>LIMITS.dxfSegments)throw Error(`El DXF tiene ${chosen.length} líneas candidatas (máximo ${LIMITS.dxfSegments}). Exporta solo la planta o la capa de muros.`);
  const paired=pairFaces(chosen.map(s=>s.seg)),{walls,rooms,evidence}=assemble(paired,{hints,labels}),b=bounds(walls);
  if(b.maxX-b.minX>200000||b.maxY-b.minY>200000)throw Error('El dibujo mide más de 200 m: revisa las unidades del DXF o exporta solo la planta.');
  const built=buildProject({name,walls,rooms,map:q=>({x:q.x-b.minX+LIMITS.margin,y:b.maxY-q.y+LIMITS.margin}),scale:{confidence:'estimated',method:'declared-ratio',note:`Medidas tomadas del DXF (${UNIT_NAME[units]}). Revisa el resultado antes de usarlo como medida real.`}});
  return {project:built.project,report:{units:UNIT_NAME[units],assumedUnits:units===0,layerFilter:onWallLayers.length>0,walls:built.project.walls.length,paired:walls.filter(w=>w.paired).length,openings:built.openings,rooms:built.project.rooms.length,roomNames:built.project.rooms.map(r=>r.name),inserts,unplaced:evidence.skipped+built.skippedOpenings}};
 }

 // ---- IFC (BIM). web-ifc returns metres with Y up; the plan is (x, -z). ----
 function ifcExtract(api,W,data){
  const m=api.OpenModel(data);if(m<0)throw Error('No se pudo abrir el IFC.');
  try{
   const ids=type=>{if(type===undefined)return [];const v=api.GetLineIDsWithType(m,type),out=[];for(let i=0;i<v.size();i++)out.push(v.get(i));return out;};
   const meshOf=id=>{const verts=[],tris=[];const mesh=api.GetFlatMesh(m,id);
    for(let g=0;g<mesh.geometries.size();g++){const pg=mesh.geometries.get(g),geo=api.GetGeometry(m,pg.geometryExpressID),v=api.GetVertexArray(geo.GetVertexData(),geo.GetVertexDataSize()),ix=api.GetIndexArray(geo.GetIndexData(),geo.GetIndexDataSize()),t=pg.flatTransformation,base=verts.length;
     for(let k=0;k<v.length;k+=6){const x=v[k],y=v[k+1],z=v[k+2];verts.push({x:(t[0]*x+t[4]*y+t[8]*z+t[12])*1000,y:-(t[2]*x+t[6]*y+t[10]*z+t[14])*1000,h:(t[1]*x+t[5]*y+t[9]*z+t[13])*1000});}
     for(let k=0;k<ix.length;k+=3)tris.push([base+ix[k],base+ix[k+1],base+ix[k+2]]);geo.delete?.();}
    return {verts,tris};};
   const span=verts=>({minH:Math.min(...verts.map(v=>v.h)),maxH:Math.max(...verts.map(v=>v.h))});
   const fills=new Map();for(const id of ids(W.IFCRELFILLSELEMENT)){const r=api.GetLine(m,id);fills.set(r.RelatingOpeningElement.value,r.RelatedBuildingElement.value);}
   const kindOf=id=>{if(id===undefined)return 'opening';const type=api.GetLineType(m,id);return type===W.IFCDOOR||type===W.IFCDOORSTANDARDCASE?'door':type===W.IFCWINDOW||type===W.IFCWINDOWSTANDARDCASE?'window':'opening';};
   const walls=[],openings=[],spaces=[];
   for(const id of [...ids(W.IFCWALL),...ids(W.IFCWALLSTANDARDCASE)]){const {verts}=meshOf(id);if(verts.length)walls.push({points:verts.map(({x,y})=>({x,y})),...span(verts)});}
   for(const id of ids(W.IFCOPENINGELEMENT)){const {verts}=meshOf(id);if(verts.length)openings.push({kind:kindOf(fills.get(id)),points:verts.map(({x,y})=>({x,y})),...span(verts)});}
   const hosted=new Set(fills.values());
   for(const id of [...ids(W.IFCDOOR),...ids(W.IFCWINDOW)]){if(hosted.has(id))continue;const {verts}=meshOf(id);if(verts.length)openings.push({kind:kindOf(id),points:verts.map(({x,y})=>({x,y})),...span(verts)});}
   for(const id of ids(W.IFCSPACE)){const line=api.GetLine(m,id),{verts,tris}=meshOf(id);if(!verts.length)continue;const s=span(verts),polygon=bottomOutline(verts,tris,s.minH);if(polygon)spaces.push({name:String(line.LongName?.value||line.Name?.value||'').trim(),polygon,...s});}
   return {walls,openings,spaces};
  }finally{api.CloseModel(m);}
 }
 // Outline of the lowest face of a mesh: edges used by exactly one bottom triangle, chained into the longest loop.
 function bottomOutline(verts,tris,minH){
  const key=v=>`${Math.round(v.x)},${Math.round(v.y)}`,count=new Map(),pt=new Map();
  for(const t of tris){if(!t.every(i=>Math.abs(verts[i].h-minH)<=5))continue;for(let k=0;k<3;k++){const a=verts[t[k]],b=verts[t[(k+1)%3]],ka=key(a),kb=key(b);if(ka===kb)continue;pt.set(ka,a);pt.set(kb,b);const e=ka<kb?`${ka}|${kb}`:`${kb}|${ka}`;count.set(e,(count.get(e)||0)+1);}}
  const next=new Map();for(const [e,n]of count){if(n!==1)continue;const [a,b]=e.split('|');(next.get(a)||next.set(a,[]).get(a)).push(b);(next.get(b)||next.set(b,[]).get(b)).push(a);}
  let best=null;const used=new Set();
  for(const start of next.keys()){if(used.has(start))continue;const loop=[start];used.add(start);let prev=null,cur=start;
   for(let guard=0;guard<5000;guard++){const cand=(next.get(cur)||[]).find(n=>n!==prev&&(!used.has(n)||n===start&&loop.length>2));if(!cand||cand===start)break;loop.push(cand);used.add(cand);prev=cur;cur=cand;}
   if(loop.length>=3&&(!best||loop.length>best.length))best=loop;}
  if(!best)return null;
  const poly=best.map(k=>({x:pt.get(k).x,y:pt.get(k).y}));
  return poly.filter((b,i)=>{const a=poly[(i-1+poly.length)%poly.length],c=poly[(i+1)%poly.length];return Math.abs((b.x-a.x)*(c.y-b.y)-(b.y-a.y)*(c.x-b.x))>1e-3*len2(a,b)*len2(b,c);});
 }
 // Oriented footprint of a wall: minimum-area rectangle of its plan points (exact for straight walls, robust to opening reveals).
 function hull(points){
  const pts=[...new Map(points.map(p=>[`${Math.round(p.x)},${Math.round(p.y)}`,p])).values()].sort((a,b)=>a.x-b.x||a.y-b.y);if(pts.length<3)return pts;
  const cross=(o,a,b)=>(a.x-o.x)*(b.y-o.y)-(a.y-o.y)*(b.x-o.x),lower=[],upper=[];
  for(const p of pts){while(lower.length>=2&&cross(lower[lower.length-2],lower[lower.length-1],p)<=0)lower.pop();lower.push(p);}
  for(const p of pts.reverse()){while(upper.length>=2&&cross(upper[upper.length-2],upper[upper.length-1],p)<=0)upper.pop();upper.push(p);}
  return lower.slice(0,-1).concat(upper.slice(0,-1));
 }
 function wallFromPoints(points){
  const h=hull(points);let best=null;
  for(let i=0;i<h.length;i++){
   const a=h[i],b=h[(i+1)%h.length],L=len2(a,b);if(L<1e-6)continue;const ux=(b.x-a.x)/L,uy=(b.y-a.y)/L,ts=h.map(p=>p.x*ux+p.y*uy),ns=h.map(p=>-p.x*uy+p.y*ux);
   const t0=Math.min(...ts),t1=Math.max(...ts),n0=Math.min(...ns),n1=Math.max(...ns),area=(t1-t0)*(n1-n0);
   if(!best||area<best.area-1e-6)best={area,ux,uy,t0,t1,n0,n1};
  }
  if(!best)return {a:points[0],b:points[0],thickness:0,paired:true};
  let {ux,uy,t0,t1,n0,n1}=best;
  if(n1-n0>t1-t0){[ux,uy]=[-uy,ux];[t0,t1,n0,n1]=[n0,n1,-t1,-t0];}
  const mid=(n0+n1)/2,pt=t=>({x:ux*t-uy*mid,y:uy*t+ux*mid});
  return {a:pt(t0),b:pt(t1),thickness:n1-n0,paired:true};
 }
 function ifcToProject(model,{name='Modelo IFC'}={}){
  if(!model.walls.length)throw Error('El IFC no contiene muros (IfcWall) con geometría.');
  // One storey: the elevation band holding most walls (multi-storey models are reported).
  const levels=new Map();for(const w of model.walls){const k=Math.round(w.minH/500);levels.set(k,(levels.get(k)||0)+1);}
  const [level]=[...levels.entries()].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0],base=Math.min(...model.walls.filter(w=>Math.round(w.minH/500)===level).map(w=>w.minH)),onLevel=e=>e.minH>=base-300&&e.minH<base+2600;
  const walls=model.walls.filter(onLevel).map(w=>({...wallFromPoints(w.points),height:w.maxH-w.minH})).filter(w=>w.thickness>=10&&w.thickness<=1500&&len2(w.a,w.b)>=100);
  if(!walls.length)throw Error('Los muros del IFC no tienen una planta reconocible.');
  const hints=model.openings.filter(onLevel).map(o=>({kind:o.kind,points:o.points,strong:o.kind!=='opening',meta:{heightMm:Math.round(o.maxH-o.minH),sillHeightMm:Math.max(0,Math.round(o.minH-base))}}));
  const spaces=model.spaces.filter(onLevel),assembled=assemble(walls,{hints}),rooms=spaces.length?spaces.map(s=>({polygon:s.polygon,name:s.name||null})):assembled.rooms;
  const b=bounds(assembled.walls);
  const built=buildProject({name,walls:assembled.walls,rooms,wallStatus:'existing',map:q=>({x:q.x-b.minX+LIMITS.margin,y:b.maxY-q.y+LIMITS.margin}),scale:{confidence:'estimated',method:'declared-ratio',note:'Medidas tomadas del modelo IFC (BIM). Revisa el resultado antes de usarlo como medida real.'}});
  return {project:built.project,report:{walls:built.project.walls.length,openings:built.openings,rooms:built.project.rooms.length,roomNames:built.project.rooms.map(r=>r.name),roomsFrom:spaces.length?'IfcSpace':'muros',storeys:levels.size,unplaced:assembled.evidence.skipped+built.skippedOpenings}};
 }

 // ---- Vector PDF: pdf.js operator list → segments in page points (y up). DrawOPS: 0 move, 1 line, 2 cubic, 3 quadratic, 4 close. ----
 function pdfVectorExtract(list,OPS){
  const FILL=new Set([OPS.fill,OPS.eoFill,OPS.fillStroke,OPS.eoFillStroke,OPS.closeFillStroke,OPS.closeEOFillStroke].filter(n=>n!==undefined));
  const STROKE=new Set([OPS.stroke,OPS.closeStroke,OPS.fillStroke,OPS.eoFillStroke,OPS.closeFillStroke,OPS.closeEOFillStroke].filter(n=>n!==undefined));
  let ctm=[1,0,0,1,0,0],lineWidth=1;const stack=[],paths=[];
  const mul=(m,n)=>[m[0]*n[0]+m[2]*n[1],m[1]*n[0]+m[3]*n[1],m[0]*n[2]+m[2]*n[3],m[1]*n[2]+m[3]*n[3],m[0]*n[4]+m[2]*n[5]+m[4],m[1]*n[4]+m[3]*n[5]+m[5]];
  const tp=(x,y)=>({x:ctm[0]*x+ctm[2]*y+ctm[4],y:ctm[1]*x+ctm[3]*y+ctm[5]});
  for(let i=0;i<list.fnArray.length;i++){
   const fn=list.fnArray[i],args=list.argsArray[i];
   if(fn===OPS.save)stack.push([ctm,lineWidth]);else if(fn===OPS.restore){const s=stack.pop();if(s)[ctm,lineWidth]=s;}
   else if(fn===OPS.transform)ctm=mul(ctm,args);else if(fn===OPS.setLineWidth)lineWidth=args[0];
   else if(fn===OPS.constructPath){
    const op=args[0],data=args[1]?.[0];if(!data||!data.length||!(FILL.has(op)||STROKE.has(op)))continue;
    const scale=Math.sqrt(Math.abs(ctm[0]*ctm[3]-ctm[1]*ctm[2]))||1,segs=[],curves=[];let start=null,cur=null;
    for(let k=0;k<data.length;){
     const c=data[k++];
     if(c===0){cur=start=tp(data[k],data[k+1]);k+=2;}
     else if(c===1){const p=tp(data[k],data[k+1]);k+=2;if(cur)segs.push([cur,p]);cur=p;}
     else if(c===2){const p1=tp(data[k],data[k+1]),p2=tp(data[k+2],data[k+3]),p=tp(data[k+4],data[k+5]);k+=6;if(cur)curves.push([cur,p1,p2,p]);cur=p;}
     else if(c===3){const p=tp(data[k+2],data[k+3]);k+=4;cur=p;}
     else if(c===4){if(cur&&start&&(cur.x!==start.x||cur.y!==start.y))segs.push([cur,start]);cur=start;}
     else break;
    }
    paths.push({filled:FILL.has(op),width:lineWidth*scale,segs,curves,closed:segs.length===4&&!curves.length&&segs.every((sg,j)=>len2(sg[1],segs[(j+1)%4][0])<1e-3)});
   }
  }
  const strokeWidths=paths.filter(p=>!p.filled).map(p=>p.width),maxStroke=strokeWidths.length?Math.max(...strokeWidths):0;
  const heavy=p=>p.filled||(maxStroke>0&&p.width>=0.7*maxStroke&&p.width>=0.5);
  // A filled, closed, elongated rectangle is a wall by itself; it is kept apart from loose face lines.
  const isRect=p=>p.filled&&p.closed&&p.segs.every((sg,j)=>{const n=p.segs[(j+1)%4],a={x:sg[1].x-sg[0].x,y:sg[1].y-sg[0].y},b={x:n[1].x-n[0].x,y:n[1].y-n[0].y};return Math.abs(a.x*b.x+a.y*b.y)<=0.02*Math.hypot(a.x,a.y)*Math.hypot(b.x,b.y);});
  const rects=paths.filter(isRect).map(p=>p.segs.map(sg=>sg[0]));
  return {rects,heavy:paths.filter(p=>heavy(p)&&!isRect(p)).flatMap(p=>p.segs),light:paths.filter(p=>!heavy(p)).flatMap(p=>p.segs),curves:paths.flatMap(p=>p.curves)};
 }
 // Drawing scale printed on the sheet ("ESCALA 1:50", "E 1/100"). Several different values are ambiguous.
 function pdfScaleFromText(texts){
  const found=new Set();for(const t of texts){for(const m of String(t).matchAll(/(?:^|[^\d.,])1\s*[:\/]\s*(\d{1,4})(?!\d)/g)){const n=Number(m[1]);if([1,2,5,10,20,25,50,75,100,125,150,200,250,500,1000].includes(n))found.add(n);}}
  return found.size===1?[...found][0]:null;
 }
 // A cubic that is a quarter circle (door swing): centre where the end normals meet, equal radii, ~90°.
 function quarterArc([p0,p1,p2,p3]){
  const t0={x:p1.x-p0.x,y:p1.y-p0.y},t3={x:p3.x-p2.x,y:p3.y-p2.y},den=t0.x*t3.y-t0.y*t3.x;if(Math.abs(den)<1e-9)return null;
  // centre c satisfies (c-p0)·t0=0 and (c-p3)·t3=0
  const b0=p0.x*t0.x+p0.y*t0.y,b3=p3.x*t3.x+p3.y*t3.y,cx=(b0*t3.y-b3*t0.y)/den,cy=(t0.x*b3-t3.x*b0)/den,c={x:cx,y:cy},r0=len2(c,p0),r3=len2(c,p3);
  if(!(r0>0)||Math.abs(r0-r3)>0.08*r0)return null;const angle=Math.acos(Math.max(-1,Math.min(1,((p0.x-cx)*(p3.x-cx)+(p0.y-cy)*(p3.y-cy))/(r0*r3))));
  return Math.abs(angle-Math.PI/2)<0.3?{center:c,p0,p3,radius:r0}:null;
 }
 function pdfToProject(vec,{name='Plano PDF',scale,labels=[]}={}){
  if(!(scale>=1))throw Error('Indica la escala del plano (por ejemplo 1:50 o 1:100).');
  const k=25.4/72*scale,mm=p=>({x:p.x*k,y:p.y*k});
  const segs=vec.heavy.map(s=>[mm(s[0]),mm(s[1])]).filter(s=>len2(s[0],s[1])>=50);
  const rectWalls=(vec.rects||[]).map(r=>wallFromPoints(r.map(mm))).filter(w=>w.thickness>=50&&w.thickness<=600&&len2(w.a,w.b)>=1.5*w.thickness);
  if(segs.length+4*rectWalls.length<4)throw Error('El PDF no contiene suficientes líneas de muro vectoriales.');
  if(segs.length>LIMITS.dxfSegments)throw Error(`El PDF tiene ${segs.length} trazos candidatos (máximo ${LIMITS.dxfSegments}); impórtalo como imagen.`);
  const hints=[];
  for(const c of vec.curves){const arc=quarterArc(c);if(!arc)continue;const R=arc.radius*k;if(R<500||R>1300)continue;hints.push({kind:'door',points:[mm(arc.center),mm(arc.p0),mm(arc.p3)],weak:true});}
  for(const s of vec.light){const a=mm(s[0]),b=mm(s[1]);if(len2(a,b)>=400)hints.push({kind:'window',points:[a,b],weak:true,windowLine:true});}
  const {walls,rooms,evidence}=assemble([...rectWalls,...pairFaces(segs)],{hints,labels:labels.map(l=>({text:l.text,point:mm(l.point)}))});
  if(walls.length<3)throw Error('No se reconocen muros en el dibujo vectorial; impórtalo como imagen.');
  const b=bounds(walls);
  if(b.maxX-b.minX>200000||b.maxY-b.minY>200000)throw Error('Con esa escala el dibujo mide más de 200 m: revisa la escala.');
  const built=buildProject({name,walls,rooms,map:q=>({x:q.x-b.minX+LIMITS.margin,y:b.maxY-q.y+LIMITS.margin}),scale:{confidence:'estimated',method:'declared-ratio',declaredRatio:`1:${scale}`,note:`Medidas del dibujo vectorial del PDF a escala 1:${scale}. Revisa el resultado antes de usarlo como medida real.`}});
  return {project:built.project,report:{scale,walls:built.project.walls.length,openings:built.openings,rooms:built.project.rooms.length,roomNames:built.project.rooms.map(r=>r.name),unplaced:built.skippedOpenings}};
 }

 // ---- Raster plans: walls are dark bands of uniform thickness. Thin strokes (text, furniture, dimensions) are ignored. ----
 function rasterWallBands({width,height,data},{minThick=3,maxThick=60,minLength=30}={}){
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||data.length!==width*height*4)throw Error('Raster de análisis no válido.');
  const gray=new Uint8Array(width*height);let low=255,high=0;
  for(let i=0;i<gray.length;i++){const a=data[i*4+3]/255,v=Math.round((.299*data[i*4]+.587*data[i*4+1]+.114*data[i*4+2])*a+255*(1-a));gray[i]=v;if(v<low)low=v;if(v>high)high=v;}
  if(high-low<60)return [];
  const thr=Math.min(160,(low+high)/2),out=[],dark=new Uint8Array(gray.length);for(let i=0;i<gray.length;i++)dark[i]=gray[i]<=thr?1:0;
  // Cross thickness of the dark stroke through each pixel: a horizontal wall pixel must be part of a tall enough vertical run, and vice versa.
  const crossRun=vertical=>{const run=new Uint16Array(gray.length),major=vertical?width:height,minor=vertical?height:width,idx=(i,j)=>vertical?j*width+i:i*width+j;
   for(let j=0;j<minor;j++){let i=0;while(i<major){if(!dark[idx(i,j)]){i++;continue;}let e=i;while(e<major&&dark[idx(e,j)])e++;for(let k=i;k<e;k++)run[idx(k,j)]=Math.min(65535,e-i);i=e;}}return run;};
  const tall=crossRun(false),wide=crossRun(true);
  for(const vertical of [false,true]){
   const major=vertical?height:width,minor=vertical?width:height,closed=[];let open=[];
   for(let r=0;r<minor;r++){
    const runs=[];let s=-1;
    for(let c=0;c<=major;c++){const i=vertical?c*width+r:r*width+c,on=c<major&&dark[i]&&(vertical?wide[i]:tall[i])>=minThick;if(on&&s<0)s=c;if(!on&&s>=0){if(c-s>=minLength)runs.push([s,c-1]);s=-1;}}
    const next=[];
    for(const [rs,re]of runs){const b=open.find(b=>!b.taken&&Math.abs(b.s-rs)<=2&&Math.abs(b.e-re)<=2);if(b){b.taken=true;b.r1=r;next.push(b);}else next.push({s:rs,e:re,r0:r,r1:r,taken:true});}
    for(const b of open)if(!b.taken)closed.push(b);
    for(const b of next)b.taken=false;open=next;
   }
   closed.push(...open);
   for(const b of closed){const t=b.r1-b.r0+1;if(t<minThick||t>maxThick)continue;const mid=(b.r0+b.r1+1)/2;out.push(vertical?{a:{x:mid,y:b.s},b:{x:mid,y:b.e+1},thickness:t}:{a:{x:b.s,y:mid},b:{x:b.e+1,y:mid},thickness:t});}
  }
  return out;
 }

 // RoomPlan CapturedRoom (Codable JSON): metres, y up; transform = 4 columns (flat 16 or nested 4×4), column 0 = right, column 3 = position.
 const RP_ROOM={livingRoom:'Salón',bedroom:'Dormitorio',kitchen:'Cocina',bathroom:'Baño',diningRoom:'Comedor'};
 const rpMatrix=t=>Array.isArray(t)&&t.length===16&&t.every(Number.isFinite)?t:Array.isArray(t)&&t.length===4&&t.every(c=>Array.isArray(c)&&c.length===4&&c.every(Number.isFinite))?t.flat():null;
 function rpSurfaces(list){
  return (Array.isArray(list)?list:[]).map(s=>{const m=rpMatrix(s?.transform),d=s?.dimensions;if(!m||!Array.isArray(d)||!Number.isFinite(d[0]))return null;const l=Math.hypot(m[0],m[2])||1;return {id:s.identifier??null,parent:s.parentIdentifier??null,x:m[12]*1000,y:m[14]*1000,z:m[13]*1000,ux:m[0]/l,uy:m[2]/l,width:d[0]*1000,height:(d[1]||0)*1000};}).filter(Boolean);
 }
 function roomPlanToProject(room,{name='Escaneo RoomPlan'}={}){
  const walls=rpSurfaces(room.walls).filter(w=>w.width>=50&&Number.isFinite(w.x+w.y)).map(w=>({a:{x:w.x-w.ux*w.width/2,y:w.y-w.uy*w.width/2},b:{x:w.x+w.ux*w.width/2,y:w.y+w.uy*w.width/2},thickness:null,paired:false,height:w.height,ref:w.id}));
  if(!walls.length)throw Error('El escaneo RoomPlan no contiene muros válidos.');
  const floor=Math.min(...rpSurfaces(room.walls).map(w=>w.z-w.height/2));
  const hints=[];for(const [list,kind]of [[room.doors,'door'],[room.windows,'window'],[room.openings,'opening']])for(const s of rpSurfaces(list)){const half=s.width/2;hints.push({kind,strong:true,wallRef:s.parent,points:[{x:s.x-s.ux*half,y:s.y-s.uy*half},{x:s.x+s.ux*half,y:s.y+s.uy*half}],meta:s.height>0?{heightMm:Math.round(s.height),sillHeightMm:Number.isFinite(floor)?Math.max(0,Math.round(s.z-s.height/2-floor)):null}:null});}
  const labels=(Array.isArray(room.sections)?room.sections:[]).filter(x=>Array.isArray(x?.center)&&RP_ROOM[x.label]).map(x=>({text:RP_ROOM[x.label],point:{x:x.center[0]*1000,y:x.center[2]*1000}}));
  const {walls:built,rooms,evidence}=assemble(walls,{hints,labels}),b=bounds(built);
  const out=buildProject({name,walls:built,rooms,wallStatus:'existing',map:q=>({x:q.x-b.minX+LIMITS.margin,y:q.y-b.minY+LIMITS.margin}),scale:{confidence:'estimated',method:'declared-ratio',note:'Medidas de escaneo LiDAR (Apple RoomPlan). Revisa el resultado antes de usarlo como medida real.'}});
  return {project:out.project,report:{walls:out.project.walls.length,openings:out.project.openings.length,rooms:out.project.rooms.length,roomNames:out.project.rooms.map(r=>r.name),skippedOpenings:evidence.skipped+out.skippedOpenings}};
 }

 const DWG_VERSIONS={AC1012:'R13',AC1014:'R14',AC1015:'2000–2002',AC1018:'2004–2006',AC1021:'2007–2009',AC1024:'2010–2012',AC1027:'2013–2017',AC1032:'2018 o posterior'};
 function dwgVersion(bytes){const tag=String.fromCharCode(...bytes.subarray(0,6));return DWG_VERSIONS[tag]||null;}
 const GUIDANCE={
  dwg:'DWG no se puede abrir en el navegador. Expórtalo a DXF (AutoCAD: Guardar como › DXF; o el conversor gratuito ODA File Converter) y súbelo de nuevo.',
  'dxf-binary':'DXF binario no admitido. Guárdalo como DXF ASCII y súbelo de nuevo.',
  step:'STEP no es un plano de planta. Exporta la planta a DXF, PDF o imagen.',
  usdz:'USDZ de RoomPlan no se importa directamente. Exporta el escaneo como JSON (CapturedRoom) desde la app y súbelo.',
  geojson:'GeoJSON no es un proyecto de plano. Sube un PDF, imagen, DXF o un proyecto JSON de Rubik Sota.',
  unknown:'Formato no reconocido. Sube PDF, imagen (PNG, JPG, WebP, HEIC, TIFF, BMP, GIF, AVIF), SVG, DXF, IFC, escaneo RoomPlan (JSON) o un proyecto JSON/ZIP de Rubik Sota.'
 };
 const api={LIMITS,LABELS,GUIDANCE,sniff,classifyJson,fitRaster,pairFaces,assemble,findRooms,buildProject,dxfToProject,ifcExtract,ifcToProject,pdfVectorExtract,pdfScaleFromText,pdfToProject,rasterWallBands,dwgVersion,roomPlanToProject};
 if(typeof module==='object')module.exports=api;else root.FloorPlanIntake=api;
})(typeof globalThis!=='undefined'?globalThis:this);
