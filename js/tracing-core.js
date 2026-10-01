/* Manual tracing and review. All persistent geometry belongs to FloorPlanProjectV1. */
(function(root){
 const C=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
 const LIMITS={bytes:15*1024*1024,pixels:8000,images:20,packageBytes:320*1024*1024,jsonBytes:15*1024*1024};
 const distance=(a,b)=>Math.hypot(b.x-a.x,b.y-a.y);
 function imageInfo(bytes,type,name){
  const b=new Uint8Array(bytes),v=new DataView(b.buffer,b.byteOffset,b.byteLength);let mediaType,width,height,orientation=1,orientationOffset;
  if(!b.length||b.length>LIMITS.bytes)throw Error('La imagen debe ocupar entre 1 byte y 15 MiB.');
  if(b.length>=33&&[137,80,78,71,13,10,26,10].every((n,i)=>b[i]===n)&&v.getUint32(8)===13&&v.getUint32(12)===0x49484452){mediaType='image/png';width=v.getUint32(16);height=v.getUint32(20);for(let at=33;at+8<=b.length;){const size=v.getUint32(at),kind=v.getUint32(at+4);if(kind===0x65584966)throw Error('PNG con metadatos EXIF: exporta una copia con orientación aplicada antes de importarlo.');if(size>b.length-at-12)break;at+=size+12;}}
  else if(b[0]===255&&b[1]===216){
   mediaType='image/jpeg';let at=2;
   while(at+4<=b.length){if(b[at++]!==255)throw Error('JPEG corrupto.');while(b[at]===255)at++;const marker=b[at++];if(marker===0xda||marker===0xd9)break;
    const length=v.getUint16(at);if(length<2||at+length>b.length)throw Error('JPEG corrupto.');
    if([0xc0,0xc1,0xc2].includes(marker)&&length>=8){height=v.getUint16(at+3);width=v.getUint16(at+5);}
    if(marker===0xe1&&length>=16&&String.fromCharCode(...b.slice(at+2,at+8))==='Exif\0\0'){
     const start=at+8,little=v.getUint16(start)===0x4949;
     if(![0x4949,0x4d4d].includes(v.getUint16(start))||v.getUint16(start+2,little)!==42)throw Error('EXIF corrupto.');
     const ifd=start+v.getUint32(start+4,little),end=at+length;if(ifd+2>end)throw Error('EXIF corrupto.');const n=v.getUint16(ifd,little);
     if(ifd+2+n*12>end)throw Error('EXIF corrupto.');
     for(let i=0;i<n;i++){const entry=ifd+2+i*12;if(v.getUint16(entry,little)===0x112){if(v.getUint16(entry+2,little)!==3||v.getUint32(entry+4,little)!==1)throw Error('Orientación EXIF no válida.');orientation=v.getUint16(entry+8,little);orientationOffset={at:entry+8,little};}}
    }at+=length;
   }
  }
  else if(b.length>=12&&v.getUint32(0)===0x52494646&&v.getUint32(8)===0x57454250){
   mediaType='image/webp';
   if(v.getUint32(4,true)+8!==b.length)throw Error('WebP truncado o con tamaño incoherente.');
   let at=12,raster=false,canvas;
   const uint24=n=>b[n]+b[n+1]*256+b[n+2]*65536;
   while(at<b.length){
    if(at+8>b.length)throw Error('WebP corrupto.');
    const kind=v.getUint32(at),size=v.getUint32(at+4,true),data=at+8;
    if(size>b.length-data||data+size+(size%2)>b.length)throw Error('WebP truncado.');
    if(kind===0x414e494d||kind===0x414e4d46)throw Error('WebP animado no admitido. Exporta una imagen estática PNG/JPG/WebP.');
    if(kind===0x45584946)throw Error('WebP con EXIF no admitido: exporta una copia con orientación aplicada antes de importarlo.');
    if(kind===0x56503858){
     if(canvas||raster||size!==10||b[data]&0xc1||b[data+1]||b[data+2]||b[data+3])throw Error('Cabecera WebP no válida.');
     if(b[data]&2)throw Error('WebP animado no admitido. Exporta una imagen estática PNG/JPG/WebP.');
     if(b[data]&8)throw Error('WebP con EXIF no admitido: exporta una copia con orientación aplicada antes de importarlo.');
     canvas={width:1+uint24(data+4),height:1+uint24(data+7)};
     if(Math.max(canvas.width,canvas.height)>LIMITS.pixels)throw Error('La imagen supera 8000 px. Reduce su resolución antes de importarla.');
    }
    if(kind===0x56503820||kind===0x5650384c){
     if(raster)throw Error('WebP con varias imágenes no admitido.');raster=true;
     if(kind===0x56503820){
      if(size<10||b[data]&1||b[data+3]!==0x9d||b[data+4]!==1||b[data+5]!==0x2a)throw Error('WebP VP8 corrupto.');
      width=v.getUint16(data+6,true)&0x3fff;height=v.getUint16(data+8,true)&0x3fff;
     }else{
      if(size<5||b[data]!==0x2f||b[data+4]&0xe0)throw Error('WebP VP8L corrupto.');
      const bits=v.getUint32(data+1,true);width=(bits&0x3fff)+1;height=((bits>>>14)&0x3fff)+1;
     }
    }
    at=data+size+(size%2);
   }
   if(!raster||canvas&&(canvas.width!==width||canvas.height!==height))throw Error('Dimensiones WebP incoherentes.');
  }
  if(!mediaType||!width||!height){
   if(type==='application/pdf'||/\.pdf$/i.test(name||''))throw Error('PDF no admitido. Exporta la página localmente a PNG/JPG/WebP y calibra esa imagen.');
   if(/image\/hei[cf]|image\/heif/.test(type||'')||/\.hei[cf]$/i.test(name||''))throw Error('HEIC/HEIF no admitido. Exporta una copia local PNG/JPG/WebP con la orientación aplicada.');
   throw Error('Solo se admiten imágenes PNG, JPG/JPEG o WebP estáticas válidas. PDF y HEIC/HEIF requieren exportar una copia local.');
  }
  if(type&&type!==mediaType)throw Error('El tipo declarado no coincide con el contenido de la imagen.');
  if(name){const extension=name.split('.').pop().toLowerCase(),expected={'image/png':['png'],'image/jpeg':['jpg','jpeg'],'image/webp':['webp']}[mediaType];if(!expected.includes(extension))throw Error('La extensión no coincide con el contenido de la imagen. Usa PNG, JPG/JPEG o WebP con su extensión correcta.');}
  if(Math.max(width,height)>LIMITS.pixels)throw Error('La imagen supera 8000 px. Reduce su resolución antes de importarla.');
  if(!Number.isInteger(orientation)||orientation<1||orientation>8)throw Error('Orientación EXIF no válida.');
  return {mediaType,widthPx:width,heightPx:height,bytes:b.length,orientation,orientationOffset};
 }
 // Rendering ignores the EXIF orientation tag in a COPY. Original bytes/pixels remain untouched.
 function renderBytes(bytes,info){const b=new Uint8Array(bytes).slice();if(info.orientationOffset)new DataView(b.buffer).setUint16(info.orientationOffset.at,1,info.orientationOffset.little);return b;}
 function orientationAngle(info){return {1:0,3:180,6:90,8:-90}[info.orientation];}
 function blank(name='Plano nuevo'){const p=C.initial();p.schemaVersion='1.1.0';p.id=C.id('prj');p.name=name;p.createdAt=p.updatedAt=new Date().toISOString();p.walls=[];p.openings=[];p.rooms=[];p.objects=[];p.measurements=[];p.sourceImages=[];p.scale={confidence:'pending',method:'none'};return p;}
 function imageToWorld(image,p){const a=image.placement.rotationDeg*Math.PI/180,s=image.placement.mmPerPixel;return {x:image.placement.originMm.x+s*(p.x*Math.cos(a)-p.y*Math.sin(a)),y:image.placement.originMm.y+s*(p.x*Math.sin(a)+p.y*Math.cos(a))};}
 function worldToImage(image,p){const a=-image.placement.rotationDeg*Math.PI/180,s=image.placement.mmPerPixel,x=(p.x-image.placement.originMm.x)/s,y=(p.y-image.placement.originMm.y)/s;return {x:x*Math.cos(a)-y*Math.sin(a),y:x*Math.sin(a)+y*Math.cos(a)};}
 function bounded(image,p){if(!Number.isFinite(p.x)||!Number.isFinite(p.y)||p.x<0||p.y<0||p.x>image.widthPx||p.y>image.heightPx)throw Error('Selecciona puntos dentro de la imagen original.');return {x:p.x,y:p.y};}
 function length(value){if(!Number.isInteger(value)||value<1||value>100000)throw Error('Introduce una distancia entre 1 y 100000 mm.');return value;}
 function calibrate(p,imageId,a,b,known){const image=p.sourceImages.find(i=>i.id===imageId);if(!image)throw Error('Selecciona una imagen local.');a=bounded(image,a);b=bounded(image,b);known=length(known);const d=distance(a,b);if(!d)throw Error('Los dos puntos deben ser distintos.');const ratio=known/d;if(ratio>1000)throw Error('Escala fuera del límite del contrato.');
  // Recalibration changes the reference only. Existing mm geometry is retained for explicit review.
  image.placement??={originMm:{x:0,y:0},rotationDeg:0,mmPerPixel:ratio};image.placement.mmPerPixel=ratio;p.schemaVersion=Number(p.schemaVersion.split('.')[1])>=2?p.schemaVersion:'1.1.0';p.scale={confidence:'estimated',method:'known-dimension',calibration:{sourceImageId:imageId,pointA:a,pointB:b,knownLengthMm:known,mmPerPixel:ratio,calibratedAt:new Date().toISOString(),confirmedByUser:false}};C.validate(p);return p;
 }
 function verify(p,a,b,known){const c=p.scale.calibration;if(!c)throw Error('Calibra la imagen antes de verificar.');const image=p.sourceImages.find(i=>i.id===c.sourceImageId);a=bounded(image,a);b=bounded(image,b);known=length(known);if(!distance(a,b))throw Error('Los dos puntos deben ser distintos.');
  const same=(u,v)=>distance(u,v)<1e-7;if((same(a,c.pointA)&&same(b,c.pointB))||(same(a,c.pointB)&&same(b,c.pointA)))throw Error('Usa una segunda cota independiente, no los puntos de calibración.');
  const measuredLengthMm=Math.round(distance(a,b)*c.mmPerPixel),errorPercent=(measuredLengthMm-known)/known*100;
  p.scale.verification={sourceImageId:image.id,pointA:a,pointB:b,knownLengthMm:known,measuredLengthMm,errorPercent,thresholdPercent:2,status:Math.abs(errorPercent)<=2?'consistent':'discrepant',verifiedAt:new Date().toISOString()};p.scale.confidence='estimated';c.confirmedByUser=false;C.validate(p);return p;
 }
 function confirm(p){if(p.scale.verification?.status!=='consistent')throw Error('La segunda cota no concuerda. Revisa la calibración.');p.scale.calibration.confirmedByUser=true;p.scale.confidence='real';C.validate(p);return p;}
 function snap(p,anchor,walls,enabled,tolerance){if(!enabled)return C.point(p);let q={x:p.x,y:p.y};for(const v of walls.flatMap(w=>[w.start,w.end]))if(distance(p,v)<=tolerance)return {...v};if(anchor){const d=distance(anchor,p),angle=Math.round(Math.atan2(p.y-anchor.y,p.x-anchor.x)/(Math.PI/4))*Math.PI/4;q={x:anchor.x+d*Math.cos(angle),y:anchor.y+d*Math.sin(angle)};}return C.point(q);}
 function segmentPoint(p,a,b){const dx=b.x-a.x,dy=b.y-a.y,l=dx*dx+dy*dy,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/l));return {point:{x:a.x+t*dx,y:a.y+t*dy},t,distance:distance(p,{x:a.x+t*dx,y:a.y+t*dy})};}
 function wall(p,a,b){const w={id:C.id('wal'),start:C.point(a),end:C.point(b),thicknessMm:p.defaults.wallThicknessMm,heightMm:p.defaults.wallHeightMm,structure:'unknown',status:'new',source:{method:'manual',review:'unreviewed'}};p.walls.push(w);C.validate(p);return w;}
 function opening(p,wallId,point,kind,width=800){const w=p.walls.find(w=>w.id===wallId);if(!w||w.status==='demolished')throw Error('Selecciona un muro activo.');const L=distance(w.start,w.end);width=length(width);if(width>L)throw Error('El hueco es más ancho que el muro.');const offset=Math.max(0,Math.min(Math.floor(L-width),Math.round(segmentPoint(point,w.start,w.end).t*L-width/2)));
  const height=kind==='window'?Math.min(1200,w.heightMm):Math.min(2100,w.heightMm),sill=kind==='window'?Math.min(900,w.heightMm-height):0;
  const o={id:C.id('opn'),wallId,kind,offsetMm:offset,widthMm:width,heightMm:height,sillHeightMm:sill,source:{method:'manual',review:'unreviewed'},...(kind==='door'?{swing:{hinge:'start',side:'left'}}:{})};p.openings.push(o);C.validate(p);return o;
 }
 function room(p,polygon,name='Estancia'){const labelAt=C.point({x:polygon.reduce((n,v)=>n+v.x,0)/polygon.length,y:polygon.reduce((n,v)=>n+v.y,0)/polygon.length});const r={id:C.id('rom'),name,polygon:polygon.map(C.point),labelAt,floorMaterialId:p.materials.find(m=>m.category==='floor').id,countsTowardArea:true,source:{method:'manual',review:'unreviewed'}};p.rooms.push(r);C.validate(p);return r;}
 function remove(p,kind,id){if(kind==='wall'){p.walls=p.walls.filter(w=>w.id!==id);p.openings=p.openings.filter(o=>o.wallId!==id);}else if(kind==='opening')p.openings=p.openings.filter(o=>o.id!==id);else if(kind==='room'){p.rooms=p.rooms.filter(r=>r.id!==id);for(const o of p.objects)if(o.roomId===id)delete o.roomId;}C.validate(p);}
 const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
 function crossing(a,b,c,d){return cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0;}
 function inside(p,poly){let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if(segmentPoint(p,a,b).distance<1e-7)return true;if((a.y>p.y)!==(b.y>p.y)&&p.x<(b.x-a.x)*(p.y-a.y)/(b.y-a.y)+a.x)yes=!yes;}return yes;}
 function warnings(p){const out=[],active=p.walls.filter(w=>w.status!=='demolished'),add=(code,id,message)=>out.push({code,id,message});
  for(const kind of ['walls','openings','rooms'])for(const e of p[kind])if(e.source?.review==='unreviewed'||e.source?.method==='suggested')add('W1',e.id,e.source?.review==='confirmed'?'Origen experimental sugerido; revisión humana registrada, sin garantía de exactitud.':'Geometría pendiente de revisión humana.');
  for(const r of p.rooms){let outside=false;for(let i=0;i<r.polygon.length;i++){
    const a=r.polygon[i],b=r.polygon[(i+1)%r.polygon.length],intervals=[];
    for(const w of active){const tolerance=w.thicknessMm/2+20;
     const dx=b.x-a.x,dy=b.y-a.y,wx=w.end.x-w.start.x,wy=w.end.y-w.start.y,wl=wx*wx+wy*wy;
     const u0=((a.x-w.start.x)*wx+(a.y-w.start.y)*wy)/wl,ud=(dx*wx+dy*wy)/wl,cuts=[0,1];
     if(ud)for(const u of [0,1]){const t=(u-u0)/ud;if(t>0&&t<1)cuts.push(t);}cuts.sort((x,y)=>x-y);
     for(let j=1;j<cuts.length;j++){
      const lo=cuts[j-1],hi=cuts[j],mid=(lo+hi)/2,u=u0+ud*mid;let ax,ay,bx,by;
      if(u<=0||u>=1){const end=u<=0?w.start:w.end;ax=a.x-end.x;ay=a.y-end.y;bx=dx;by=dy;}
      else{ax=a.x-w.start.x-u0*wx;ay=a.y-w.start.y-u0*wy;bx=dx-ud*wx;by=dy-ud*wy;}
      const A=bx*bx+by*by,B=2*(ax*bx+ay*by),Q=ax*ax+ay*ay-tolerance*tolerance;
      if(A<1e-14){if(Q<=1e-7)intervals.push([lo,hi]);}
      else{const discriminant=B*B-4*A*Q;if(discriminant>=0){const root=Math.sqrt(discriminant),left=Math.max(lo,(-B-root)/(2*A)),right=Math.min(hi,(-B+root)/(2*A));if(left<=right)intervals.push([left,right]);}}
     }
    }intervals.sort((a,b)=>a[0]-b[0]);let at=0;for(const [lo,hi]of intervals){if(lo>at+1e-9)break;at=Math.max(at,hi);}if(at<1-1e-9){outside=true;break;}
   }if(outside)add('W2',r.id,'Revisa el contorno: algún tramo queda a más de grosor/2 + 20 mm de un muro.');}
  const solids=C.geometry(p).walls.filter(w=>w.status!=='demolished');
  for(const o of p.objects){const angle=o.rotationDeg*Math.PI/180,poly=[[-1,-1],[1,-1],[1,1],[-1,1]].map(([x,y])=>({x:o.position.x+x*o.size.widthMm/2*Math.cos(angle)-y*o.size.depthMm/2*Math.sin(angle),y:o.position.y+x*o.size.widthMm/2*Math.sin(angle)+y*o.size.depthMm/2*Math.cos(angle)}));
   const r=p.rooms.find(r=>r.id===o.roomId);if(r&&(poly.some(pt=>!inside(pt,r.polygon))||poly.some((a,i)=>r.polygon.some((c,j)=>crossing(a,poly[(i+1)%poly.length],c,r.polygon[(j+1)%r.polygon.length])))))add('W3',o.id,'El objeto queda fuera de su estancia asignada.');
   // Separating axis theorem between furniture footprint and each oriented wall solid.
   if(solids.some(w=>{const a=w.angle,wp=w.poly.map(([x,y])=>({x,y}));
    const axes=[angle,angle+Math.PI/2,a,a+Math.PI/2];return axes.every(a=>{const project=pts=>pts.map(v=>v.x*Math.cos(a)+v.y*Math.sin(a)),u=project(poly),v=project(wp);return Math.min(...u)<Math.max(...v)-1e-7&&Math.min(...v)<Math.max(...u)-1e-7;});}))add('W3',o.id,'El objeto se solapa con un muro; revisa su posición.');
  }
  if(p.scale.confidence!=='real')add('W4',p.id,'Medidas orientativas: escala pendiente o no confirmada.');return out;
 }
 const api={LIMITS,imageInfo,renderBytes,orientationAngle,blank,imageToWorld,worldToImage,calibrate,verify,confirm,snap,segmentPoint,wall,opening,room,remove,warnings};if(typeof module==='object')module.exports=api;else root.FloorPlanTracing=api;
})(globalThis);
