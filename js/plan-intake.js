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
   if(Array.isArray(value.walls)&&value.walls.length&&value.walls.every(w=>Array.isArray(w?.transform)&&w.transform.length===16&&Array.isArray(w.dimensions)))return 'roomplan';
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
 function dxfToProject(dxf,{name='Plano DXF'}={}){
  if(!dxf||!Array.isArray(dxf.entities))throw Error('El DXF no contiene entidades legibles.');
  const units=dxf.header?.$INSUNITS??0,toMm=units===0?1:UNIT_MM[units];
  if(!toMm)throw Error(`Unidades DXF no admitidas ($INSUNITS=${units}). Exporta el plano en mm, cm o m.`);
  const all=[],inserts={doors:0,windows:0};
  for(const e of dxf.entities){
   if(e.type==='INSERT'){const key=`${e.layer||''} ${e.name||''}`;if(DOOR.test(key))inserts.doors++;else if(WINDOW.test(key))inserts.windows++;continue;}
   for(const seg of segmentsOf(e))all.push({layer:e.layer||'0',seg:[{x:seg[0].x*toMm,y:seg[0].y*toMm},{x:seg[1].x*toMm,y:seg[1].y*toMm}]});
  }
  const onWallLayers=all.filter(s=>WALL_LAYER.test(s.layer)),chosen=(onWallLayers.length?onWallLayers:all).filter(s=>Math.hypot(s.seg[1].x-s.seg[0].x,s.seg[1].y-s.seg[0].y)>=50);
  if(!chosen.length)throw Error('No se encontraron líneas de muro (LINE/LWPOLYLINE/POLYLINE) en el DXF.');
  if(chosen.length>LIMITS.dxfSegments)throw Error(`El DXF tiene ${chosen.length} líneas candidatas (máximo ${LIMITS.dxfSegments}). Exporta solo la planta o la capa de muros.`);
  const walls=pairFaces(chosen.map(s=>s.seg)),xs=walls.flatMap(w=>[w.a.x,w.b.x]),ys=walls.flatMap(w=>[w.a.y,w.b.y]),minX=Math.min(...xs),maxY=Math.max(...ys);
  if(Math.max(...xs)-minX>200000||maxY-Math.min(...ys)>200000)throw Error('El dibujo mide más de 200 m: revisa las unidades del DXF o exporta solo la planta.');
  const p=T.blank(name),map=q=>({x:q.x-minX+LIMITS.margin,y:maxY-q.y+LIMITS.margin});
  for(const w of walls){const a=C.point(map(w.a)),b=C.point(map(w.b));if(Math.hypot(b.x-a.x,b.y-a.y)<10)continue;p.walls.push({id:C.id('wal'),start:a,end:b,thicknessMm:w.thickness?Math.max(10,Math.min(1500,Math.round(w.thickness))):p.defaults.wallThicknessMm,heightMm:p.defaults.wallHeightMm,structure:'unknown',status:'new',source:{method:'imported',review:'unreviewed'}});}
  p.scale={confidence:'estimated',method:'declared-ratio',note:`Medidas tomadas del DXF (${UNIT_NAME[units]}). Revisa el resultado antes de usarlo como medida real.`};
  C.validate(p);
  const paired=walls.filter(w=>w.paired).length;
  return {project:p,report:{units:UNIT_NAME[units],assumedUnits:units===0,layerFilter:onWallLayers.length>0,walls:p.walls.length,paired,single:walls.length-paired,inserts}};
 }

 // RoomPlan CapturedRoom (Codable JSON): metres, y up, simd column-major 4x4 transforms.
 function roomPlanToProject(room,{name='Escaneo RoomPlan'}={}){
  const pose=s=>{const m=s.transform;return {x:m[12]*1000,y:m[14]*1000,ux:m[0],uy:m[2],width:s.dimensions[0]*1000,height:s.dimensions[1]*1000};};
  const walls=(room.walls||[]).map(pose).filter(w=>w.width>=50&&Number.isFinite(w.x+w.y+w.ux+w.uy));
  if(!walls.length)throw Error('El escaneo RoomPlan no contiene muros válidos.');
  const ends=walls.map(w=>{const l=Math.hypot(w.ux,w.uy)||1,ux=w.ux/l,uy=w.uy/l;return {a:{x:w.x-ux*w.width/2,y:w.y-uy*w.width/2},b:{x:w.x+ux*w.width/2,y:w.y+uy*w.width/2},h:w.height};});
  const minX=Math.min(...ends.flatMap(e=>[e.a.x,e.b.x])),minY=Math.min(...ends.flatMap(e=>[e.a.y,e.b.y])),shift=q=>({x:q.x-minX+LIMITS.margin,y:q.y-minY+LIMITS.margin});
  const p=T.blank(name);
  for(const e of ends)p.walls.push({id:C.id('wal'),start:C.point(shift(e.a)),end:C.point(shift(e.b)),thicknessMm:p.defaults.wallThicknessMm,heightMm:Math.max(1,Math.min(100000,Math.round(e.h)||p.defaults.wallHeightMm)),structure:'unknown',status:'existing',source:{method:'imported',review:'unreviewed'}});
  let skipped=0;
  for(const [list,kind]of [[room.doors,'door'],[room.windows,'window'],[room.openings,'opening']])for(const s of list||[]){
   const o=pose(s),c=shift(o),near=p.walls.map(w=>({w,...T.segmentPoint(c,w.start,w.end)})).sort((x,y)=>x.distance-y.distance)[0];
   try{if(!near||near.distance>300)throw Error();T.opening(p,near.w.id,c,kind,Math.max(1,Math.round(o.width)));}catch{skipped++;}
  }
  p.scale={confidence:'estimated',method:'declared-ratio',note:'Medidas de escaneo LiDAR (Apple RoomPlan). Revisa el resultado antes de usarlo como medida real.'};
  C.validate(p);
  return {project:p,report:{walls:p.walls.length,openings:p.openings.length,skippedOpenings:skipped}};
 }

 const GUIDANCE={
  dwg:'DWG no se puede abrir en el navegador. Expórtalo a DXF (AutoCAD: Guardar como › DXF; o el conversor gratuito ODA File Converter) y súbelo de nuevo.',
  'dxf-binary':'DXF binario no admitido. Guárdalo como DXF ASCII y súbelo de nuevo.',
  ifc:'IFC (BIM) todavía no se importa. Exporta la planta a DXF desde Revit, ArchiCAD u otro programa BIM y súbela.',
  step:'STEP no es un plano de planta. Exporta la planta a DXF, PDF o imagen.',
  usdz:'USDZ de RoomPlan no se importa directamente. Exporta el escaneo como JSON (CapturedRoom) desde la app y súbelo.',
  geojson:'GeoJSON no es un proyecto de plano. Sube un PDF, imagen, DXF o un proyecto JSON de Rubik Sota.',
  unknown:'Formato no reconocido. Sube PDF, imagen (PNG, JPG, WebP, HEIC, TIFF, BMP, GIF, AVIF), SVG, DXF, escaneo RoomPlan (JSON) o un proyecto JSON/ZIP de Rubik Sota.'
 };
 const api={LIMITS,LABELS,GUIDANCE,sniff,classifyJson,fitRaster,pairFaces,dxfToProject,roomPlanToProject};
 if(typeof module==='object')module.exports=api;else root.FloorPlanIntake=api;
})(typeof globalThis!=='undefined'?globalThis:this);
