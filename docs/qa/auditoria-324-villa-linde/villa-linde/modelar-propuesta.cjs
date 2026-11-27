const fs = require('node:fs');
const path = require('node:path');
const [repo, input, out] = process.argv.slice(2);
const requireApp = name => require(path.join(repo,'js',name));
const L = requireApp('room-layout.js');
const T = requireApp('tracing-core.js');
const C = requireApp('project-core.js');
const B = requireApp('building-core.js');
const reference = requireApp('reference-project.js');
const mm = value => Math.round(value * 1000);
const pt = (x,y) => ({x:mm(x),y:mm(y)});
const rect = (x,y,w,h) => [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
const read = name => JSON.parse(fs.readFileSync(path.join(input,name),'utf8'));
const palette = { night:'mat_wood',day:'mat_marble',bath:'mat_antislip',service:'mat_tile600',hall:'mat_marble',out:'mat_antislip' };
const furnitureFor = {
 'Garaje · 2 plazas': [['cabinet','Volumen de vehículo 1'],null,['cabinet','Volumen de vehículo 2'],null],
 'Lavandería':[['counter','Encimera de lavado'],['washer','Lavadora y mueble de servicio']],
 'Gimnasio':[['cabinet','Volumen de cinta de correr'],['armchair','Volumen de banco de ejercicios'],['cabinet','Estante de pesas']],
 'Cocina y comedor':[['counter','Encimera de cocina'],['counter','Isla de cocina'],['table','Mesa de comedor'],...Array.from({length:12},()=>['chair','Silla de comedor'])],
 'Despacho':[['desk','Mesa de trabajo'],['chair','Silla de trabajo'],['sofa','Sofá del despacho']],
 'Vestidor':[['wardrobe','Armario de vestidor']],
 'P08 · Principal':[['bed','Cama principal'],null,['nightstand','Mesilla'],['nightstand','Mesilla'],['armchair','Butaca de la suite']]
};
function furniture(room, things) {
 const name=room[4];
 if(furnitureFor[name])return furnitureFor[name];
 if(/^(B|P)\d\d /.test(name)) {
  const end=[['wardrobe','Armario'],['desk','Escritorio']];
  return name.includes('Twin')?[['bed','Cama individual'],null,['bed','Cama individual'],null,...end]:[['bed','Cama doble'],null,end[0],['nightstand','Mesilla'],['nightstand','Mesilla'],end[1]];
 }
 if(name.startsWith('Baño'))return [['shower','Ducha'],['toilet','Inodoro'],['vanity','Lavabo'],null,null];
 if(name.startsWith('Salón'))return [['sofa','Sofá'],['armchair','Butaca'],['coffeetable','Mesa baja'],['tvstand','Mueble auxiliar']];
 return things.map(t=>t[4]==='cloth'?['armchair','Asiento exterior']:['table','Mesa exterior']);
}
function build(plan, side){
 const p=L.blank('Villa Linde · '+plan.name);
 p.id='prj_linde-aprobada-'+side;
 p.materials=structuredClone(reference.materials);
 const rows=plan.rooms.filter(r=>r[4]).map(r=>[...r]);
 if(side==='b')rows.push([0,5.4,14.55,2.08,'Galería de acceso','hall'],[14.55,5.4,16.45,2.08,'Distribuidor privado','hall'],[17.02,7.48,1.08,6.04,'Paso de baños','hall'],[0,14.36,7.25,5.34,'Terraza cubierta','out'],[7.25,14.36,7.30,1.10,'Paso exterior de piscina','out'],[7.25,15.46,6.64,3.54,'Piscina · huella','out']);
 else rows.push([0,5.4,31,2.08,'Galería de dormitorios','hall'],[0,14.36,7.1,3.4,'Terraza del salón','out'],[7.1,14.36,4.35,1.68,'Balcón P05','out'],[22.75,14.36,4.75,1.68,'Balcón principal','out']);
 const basePolys=rows.map(([x,y,w,h,n])=>n==='P08 · Principal'?[[x,y],[x+w,y],[x+w,8.45],[27.5,8.45],[27.5,y+h],[x,y+h]]:rect(x,y,w,h));
 const innerOutline=(poly)=>poly.map(([x,y],i)=>{
  const prior=poly[(i+poly.length-1)%poly.length], next=poly[(i+1)%poly.length];
  const pX=x-prior[0],pY=y-prior[1],nX=next[0]-x,nY=next[1]-y;
  return pt(x-.10*(Math.sign(pY)+Math.sign(nY)),y+.10*(Math.sign(pX)+Math.sign(nX)));
 });
 const parts=rows.map((room,i)=>{
  const [x,y,w,h,raw,cat]=room;
  const name=/^(B|P)\d\d /.test(raw)?'Dormitorio '+raw:raw;
  const r=T.room(p,cat==='out'?basePolys[i].map(q=>pt(...q)):innerOutline(basePolys[i]),name);
  r.id='rom_linde-'+side+'-'+(i+1);
  r.floorMaterialId=palette[cat];
  r.family=C.roomFamilyFromName(name)||'unspecified';
  r.countsTowardArea=cat!=='out'&&!(side==='p'&&raw==='Escalera S1');
  return {room,r};
 });
 const axes=new Map();
 function edge(a,b) {
  const horizontal=a[1]===b[1], axis=horizontal?'h':'v',c=mm(horizontal?a[1]:a[0]);
  const key=axis+':'+c;
  if(!axes.has(key))axes.set(key,{axis,c,segments:[]});
  const ends=horizontal?[mm(a[0]),mm(b[0])]:[mm(a[1]),mm(b[1])];
  axes.get(key).segments.push([Math.min(...ends),Math.max(...ends)]);
 }
 rows.forEach((room,i)=>{if(room[5]!=='out'){const points=basePolys[i];points.forEach((point,j)=>edge(point,points[(j+1)%points.length]));}});
 const walls=[];
 for(const {axis,c,segments} of axes.values()){
  const marks=[...new Set(segments.flat())].sort((a,b)=>a-b);
  for(let i=1;i<marks.length;i++){
   const a=marks[i-1],b=marks[i];
   if(!segments.some(s=>s[0]<=a&&s[1]>=b))continue;
   const node=value=>axis==='h'?{x:value,y:c}:{x:c,y:value};
   const wall=T.wall(p,node(a),node(b));
   wall.id='wal_linde-'+side+'-'+(walls.length+1);
   wall.thicknessMm=200;
   walls.push({axis,c,a,b,wall});
  }
 }
 const openings=[...plan.openings];
 if(side==='b')openings.push([14.55,5.85,1.21,'v',false]);
 const explicit=new Set();
 const notPlaced=[];
 for(const [x,y,len,axis,external] of openings){
  const c=mm(axis==='h'?y:x),a=mm(axis==='h'?x:y),b=a+mm(len);
  const k=[axis,c,a,b].join(':');
  if (explicit.has(k))continue;
  explicit.add(k);
  const w=walls.find(w=>w.axis===axis&&w.c===c&&w.a<=a&&w.b>=b);
  if(!w){notPlaced.push([x,y,len,axis,external]);continue;}
  const door=external&&(c===14360||side==='b'&&c===0&&[330,12560].includes(a));
  const kind=door?(len>1.5?'sliding-door':'door'):external?'window':len>1.2?'opening':'door';
  p.openings.push({id:'opn_linde-'+side+'-'+(p.openings.length+1),kind,wallId:w.wall.id,offsetMm:a-w.a,widthMm:b-a,heightMm:door||!external?2150:1350,sillHeightMm:door||!external?0:800});
 }
 const assigned = new Set();
 const sorted = [...parts].sort((a,b)=>(a.room[2]*a.room[3])-(b.room[2]*b.room[3]));
 for(const part of sorted){
  const [x,y,w,h,n]=part.room;
  const candidates=plan.things.flatMap((t,i)=>{
   const [tx,ty,tw,th]=t,cx=tx+tw/2,cy=ty+th/2;
   return !assigned.has(i)&&cx>=x&&cx<=x+w&&cy>=y&&cy<=y+h?[[t,i]]:[];
  });
  const kinds=furniture(part.room,candidates.map(t=>t[0]));
  candidates.forEach(([t,i],j)=>{
   assigned.add(i);
   const item=kinds[j];
   if(!item)return;
   const [tx,ty,tw,th,color]=t;
   const shades={ wood:'#b39476', white:'#f2eee7', cloth:'#aab9bc',dark:'#6c8481',green:'#91a377' };
   const wardrobeClearance=item[0]==='wardrobe' && /^(B|P)\d\d /.test(n) && !n.includes('Twin') ? .25 : 0;
   const obj=C.object(...item,mm(tx+tw/2+wardrobeClearance),mm(ty+th/2),mm(tw),mm(th),0,shades[color]);
   obj.id='obj_linde-'+side+'-'+(p.objects.length+1);
   obj.roomId=part.r.id;
   p.objects.push(obj);
  });
 }
 // Functional kitchen appliances absent from the decorative symbols of the approved drawing.
 if(side==='b'){
  const kitchen=parts.find(part=>part.room[4]==='Cocina y comedor').r;
  for(const [type,label,x,y,w,d] of [['fridge','Frigorífico alto',9.67,9.98,.60,.63],['ksink','Fregadero integrado',6.19,8.76,.70,.47],['stove','Placa integrada',8.49,8.76,.66,.48]]){
   const o=C.object(type,label,mm(x),mm(y),mm(w),mm(d),0);
   o.id='obj_linde-b-'+(p.objects.length+1);o.roomId=kitchen.id;p.objects.push(o);
  }
 }
 C.validate(p,{strict:true});
 return {p,notPlaced};
}
const lower=build(read('villa-linde-propuesta-baja.png.json'),'b');
const upper=build(read('villa-linde-propuesta-primera.png.json'),'p');
let b=B.create(lower.p,{name:'Villa Linde · proyecto aprobado',levelName:'Planta baja'});
b.id='bld_linde-aprobada'; b.levels[0].id='lvl_linde-aprobada-b';
b=B.addLevel(b,upper.p,{name:'Planta primera',elevationMm:3100,slabThicknessMm:280,offsetMm:{x:0,y:0}});
b.levels[1].id='lvl_linde-aprobada-p';
b=B.setStair(b,{id:'str_linde-s1',fromLevelId:b.levels[0].id,toLevelId:b.levels[1].id,startMm:{x:16040,y:4730},rotationDeg:270,widthMm:1100,runLengthMm:4010,risers:18});
b=B.setSite(b,{northOffsetDeg:0,location:{latitude:38.35,longitude:-0.48,timeZone:'Europe/Madrid',source:{providerId:'manual',type:'user-entered',sourceName:'Escenario aproximado Alicante'}}});
const data=B.validate(b);
const summary=b.levels.map(({name,project:p},i)=>({
 name,rooms:p.rooms.length,bedrooms:p.rooms.filter(r=>r.name.startsWith('Dormitorio')).length,
 baths:p.rooms.filter(r=>/^Baño/.test(r.name)).length,salons:p.rooms.filter(r=>/^Salón/.test(r.name)).length,
 objects:p.objects.length,walls:p.walls.length,openings:p.openings.length,notPlaced:[lower,upper][i].notPlaced,
 layoutFindings:requireApp('layout-review.js').review(p).findings,stairsConflicts:B.stairConflicts(b,{levelId:b.levels[i].id}).length
}));
fs.writeFileSync(path.join(out,'villa-linde-aprobada.json'),JSON.stringify(b,null,2));
fs.writeFileSync(path.join(out,'control-modelo.json'),JSON.stringify({summary,warnings:data.warnings},null,2));
console.log(JSON.stringify({summary,warnings:data.warnings},null,2));


