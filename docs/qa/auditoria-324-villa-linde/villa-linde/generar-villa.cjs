const fs=require('node:fs'),path=require('node:path');
const repo=process.argv[2], out=process.argv[3];
const req=n=>require(path.join(repo,'js',n));
const L=req('room-layout.js'),T=req('tracing-core.js'),C=req('project-core.js'), B=req('building-core.js'), reference=req('reference-project.js');
const lower=[
 ['Garaje','Dormitorio B1','Dormitorio B2','Salón de recepción'],
 ['Dormitorio B3','Baño B1','Baño B2','Gimnasio'],
 ['Galería oeste','Vestíbulo de escalera','Galería este','Acceso principal'],
 ['Dormitorio B4','Dormitorio B5','Dormitorio B6','Salón de piscina'],
 ['Lavandería','Cocina','Comedor','Cuarto técnico']
];
const upper=[
 ['Dormitorio P1','Dormitorio P2','Dormitorio P3','Dormitorio P4'],
 ['Baño P1','Baño P2','Baño P3','Salón panorámico'],
 ['Galería oeste','Vestíbulo de escalera','Galería este','Distribuidor'],
 ['Dormitorio P5','Dormitorio P6','Dormitorio P7','Dormitorio P8']
];
const material=name=>/^Dormitorio/.test(name)?'mat_wood':/^Baño|Cocina|Lavander/.test(name)?'mat_antislip':/Salón|Vestíbulo|Comedor/.test(name)?'mat_marble':'mat_tile600';
const W=[6500,6200,5500,7000],D=[5100,5200,3500,5300,4400], t=240;
const coord=(ls,i)=>ls.slice(0,i).reduce((s,n)=>s+n+t,0);
function make(tag,order,grid){
 const p=L.blank('Villa Linde · '+tag);
 p.id='prj_linde-'+order;
 p.materials=structuredClone(reference.materials);
 const seen=new Map(), area=[];
 function line(a,b){
  const k=[a,b].map(q=>q.x+','+q.y).sort().join(';');
  if(!seen.has(k)){const wall=T.wall(p,a,b);wall.id='wal_linde-'+order+'-'+(seen.size+1);seen.set(k,wall);}
  return seen.get(k);
 }
 function space(name,x,y,width,depth,interior){
  const r=T.room(p,[{x,y},{x:x+width,y},{x:x+width,y:y+depth},{x,y:y+depth}],name);
  r.id='rom_linde-'+order+'-'+(area.length+1);r.floorMaterialId=material(name);r.countsTowardArea=interior;
  area.push({name,roomId:r.id,x,y,width,depth,countsTowardArea:interior,areaM2:width*depth/1e6});
  return r;
 }
 function furnishing(r,name,type,label,x,y,w,d){
  const {cx,cy,w:oldW,d:oldD,rot,...obj}=C.object(type,label,x,y,w,d,0,'#c7b8a2');
  p.objects.push({...obj,id:'obj_linde-'+order+'-'+(p.objects.length+1),roomId:r.id});
 }
 for (const [j,row] of grid.entries()) for (const [i,name] of row.entries()){
  const x=coord(W,i),y=coord(D,j),w=W[i],d=D[j],a=x-t/2,b=y-t/2,c=x+w+t/2,e=y+d+t/2;
  const r=space(name,x,y,w,d,true);
  const north=line({x:a,y:b},{x:c,y:b}),south=line({x:a,y:e},{x:c,y:e});
  const west=line({x:a,y:b},{x:a,y:e}),east=line({x:c,y:b},{x:c,y:e});
  const add=(wall,kind,offset,width,height,sill)=>{
   if(p.openings.some(o=>o.wallId===wall.id)) return;
   p.openings.push({id:'opn_linde-'+order+'-'+(p.openings.length+1),kind,wallId:wall.id,offsetMm:offset,widthMm:width,heightMm:height,sillHeightMm:sill});
  };
  if(j===0)add(north,'window',700,1800,1550,750);
  if(j===grid.length-1)add(south,'window',700,1800,1550,750);
  if(i===0)add(west,'window',720,1650,1450,900);
  if(i===row.length-1)add(east,'window',720,1650,1450,900);
  if(j!==2 && j!==grid.length-1)add(j<2?south:north,'door',w-1300,950,2200,0);
  if(j===2&&i<row.length-1)add(east,'opening',350,1200,2400,0);
  if(j===grid.length-1)add(north,'door',w-1250,950,2200,0);
  if(/^Dormitorio/.test(name)){
   furnishing(r,name,'bed','Cama doble',x+1800,y+1450,1800,2100);
   furnishing(r,name,'wardrobe','Armario',x+w-1200,y+850,1800,600);
  } else if(/^Salón/.test(name)) {
   furnishing(r,name,'sofa','Sofá principal',x+2440,y+1450,2400,900);
   furnishing(r,name,'coffeetable','Mesa central',x+2440,y+2750,1200,650);
  }
 }
 if(order==='b'){
  space('Terraza de piscina',1000,-6000,11500,5200,false);
  const pool=space('Vaso de piscina · representación de planta',14000,-6000,9000,4200,false);
  pool.floorMaterialId='mat_tile600';
  space('Terraza del garaje',26700,12600,4300,4400,false);
 }else{
  space('Terraza alta',6000,-5000,12600,4500,false);
  space('Balcón oeste',-2300,600,1950,4400,false);
  space('Balcón este',25300,5500,1900,4500,false);
 }
 C.validate(p,{strict:true});
 return {p,area};
}
const low=make('Planta baja','b',lower),high=make('Planta primera','p',upper);
let building=B.create(low.p,{name:'Villa Linde · Costa Blanca',levelName:'Planta baja'});
building.id='bld_villa-linde'; building.levels[0].id='lvl_linde-baja';
building=B.addLevel(building,high.p,{name:'Planta primera',elevationMm:3200,slabThicknessMm:300,offsetMm:{x:0,y:0}});
building.levels[1].id='lvl_linde-primera';
building=B.setStair(building,{id:'str_linde-vestibulo',fromLevelId:'lvl_linde-baja',toLevelId:'lvl_linde-primera',startMm:{x:7600,y:12000},rotationDeg:0,widthMm:1300,runLengthMm:4500,risers:18});
B.validate(building);
const metrics=[low,high].map(({p,area})=>({id:p.id,name:p.name,roomCount:p.rooms.length,bedrooms:p.rooms.filter(r=>r.name.startsWith('Dormitorio')).length,bathrooms:p.rooms.filter(r=>r.name.startsWith('Baño')).length,salons:p.rooms.filter(r=>r.name.startsWith('Salón')).length,furniture:p.objects.length,walls:p.walls.length,openings:p.openings.length,interiorM2:area.filter(r=>r.countsTowardArea).reduce((s,r)=>s+r.areaM2,0),nonCountedM2:area.filter(r=>!r.countsTowardArea).reduce((s,r)=>s+r.areaM2,0),area}));
fs.writeFileSync(path.join(out,'villa-linde-edificio.json'),JSON.stringify(building,null,2));
fs.writeFileSync(path.join(out,'villa-linde-control.json'),JSON.stringify(metrics,null,2));
console.log(JSON.stringify(metrics.map(({area,...rest})=>rest)));


