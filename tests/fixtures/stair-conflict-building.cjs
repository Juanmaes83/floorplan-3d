// A synthetic building that is NOT the multi-level fixture: other rooms, a stair climbing south (90°) in a narrow
// «Paso», an upper level without offset, and two pieces of furniture placed over the stair on purpose (a shoe rack
// on the stair, a wardrobe turned 30° over the slab void) plus one clear desk. Used to show that BW5 works on any
// imported project, not only on the corrected fixture.
const C=require('../../js/project-core.js'),L=require('../../js/room-layout.js'),B=require('../../js/building-core.js');
const item=(type,name,x,y,w,d,rot,id,roomId)=>{const {cx,cy,w:_w,d:_d,rot:_r,...o}={...C.object(type,name,x,y,w,d,rot,'#8a7f73'),id,roomId};return o;};
function build(){
 let ground=L.blank('Dúplex de prueba · baja');ground.id='prj_conflict-ground';
 ground=L.create(ground,{name:'Salón',width:4000,depth:3000,x:400,y:400}).project;
 ground=L.create(ground,{name:'Paso',width:1200,depth:3000,neighborId:ground.rooms[0].id,side:'right'}).project;
 const paso=ground.rooms.find(r=>r.name==='Paso'),px=paso.polygon.map(p=>p.x),cx=(Math.min(...px)+Math.max(...px))/2;
 ground.objects.push(item('shoerack','Zapatero',cx,1700,800,350,0,'obj_conflict-shoes',paso.id));
 let upper=L.blank('Dúplex de prueba · alta');upper.id='prj_conflict-upper';
 upper=L.create(upper,{name:'Estudio',width:5440,depth:3000,x:400,y:400}).project;
 const estudio=upper.rooms[0];
 upper.objects.push(item('wardrobe','Armario',cx-300,2300,1000,600,30,'obj_conflict-wardrobe',estudio.id),item('desk','Escritorio',1400,1200,1200,700,0,'obj_conflict-desk',estudio.id));
 let b=B.create(ground,{name:'Dúplex de prueba con conflictos',levelName:'Baja'});b.id='bld_conflict-duplex';b.levels[0].id='lvl_conflict-ground';
 b=B.addLevel(b,upper,{name:'Alta',elevationMm:3100,slabThicknessMm:250});b.levels[1].id='lvl_conflict-upper';
 b=B.setStair(b,{id:'str_conflict-1',fromLevelId:'lvl_conflict-ground',toLevelId:'lvl_conflict-upper',startMm:{x:Math.round(cx),y:600},rotationDeg:90,widthMm:1000,runLengthMm:2600,risers:15});
 b.createdAt=b.updatedAt='2026-10-18T10:00:00.000Z';B.validate(b);
 return {building:b,pasoId:paso.id,estudioId:estudio.id,pasoCenterX:cx};
}
module.exports={build};
