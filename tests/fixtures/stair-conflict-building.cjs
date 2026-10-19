// A synthetic building with furniture over its stair, NOT the corrected multi-level fixture. It reproduces the human
// review of #53: a sofa (turned 90°) on the steps of the ground level and a bed over the slab void of the upper
// level. Also: a stair climbing south (90°) in a narrow «Paso» that leaves no free place, a door next to it, an upper
// level with an estimated scale and a clear desk. Used to show that BW5 works on any imported project.
const C=require('../../js/project-core.js'),L=require('../../js/room-layout.js'),B=require('../../js/building-core.js');
const item=(type,name,x,y,w,d,rot,id,roomId)=>{const {cx,cy,w:_w,d:_d,rot:_r,...o}={...C.object(type,name,x,y,w,d,rot,'#8a7f73'),id,roomId};return o;};
function build(){
 let ground=L.blank('Dúplex de prueba · baja');ground.id='prj_conflict-ground';
 ground=L.create(ground,{name:'Salón',width:4000,depth:3000,x:400,y:400}).project;
 ground=L.create(ground,{name:'Paso',width:1200,depth:3000,neighborId:ground.rooms[0].id,side:'right'}).project;
 const salon=ground.rooms.find(r=>r.name==='Salón'),paso=ground.rooms.find(r=>r.name==='Paso'),px=paso.polygon.map(p=>p.x),cx=(Math.min(...px)+Math.max(...px))/2;
 // Door in the wall shared by «Salón» and «Paso», swinging into «Salón».
 const shared=ground.walls.find(w=>w.start.x===w.end.x&&w.start.x>4400&&w.start.x<4640);
 ground.openings.push({id:'opn_conflict-door',kind:'door',wallId:shared.id,offsetMm:2100,widthMm:800,heightMm:2100,sillHeightMm:0,swing:{hinge:'start',side:'right'}});
 ground.objects.push(item('sofa','Sofá',cx,1900,1400,800,90,'obj_conflict-sofa',paso.id),item('table','Mesa',1600,1300,1200,800,0,'obj_conflict-table',salon.id));
 let upper=L.blank('Dúplex de prueba · alta');upper.id='prj_conflict-upper';
 upper.scale={confidence:'estimated',method:'declared-ratio',declaredRatio:'1:50',note:'Escala declarada, sin calibrar.'};
 upper=L.create(upper,{name:'Estudio',width:5440,depth:3000,x:400,y:400}).project;
 const estudio=upper.rooms[0];
 upper.objects.push(item('bed','Cama',4600,1900,1600,2000,0,'obj_conflict-bed',estudio.id),item('desk','Escritorio',1400,1200,1200,700,0,'obj_conflict-desk',estudio.id));
 let b=B.create(ground,{name:'Dúplex de prueba con conflictos',levelName:'Planta baja'});b.id='bld_conflict-duplex';b.levels[0].id='lvl_conflict-ground';
 b=B.addLevel(b,upper,{name:'Planta primera',elevationMm:3100,slabThicknessMm:250});b.levels[1].id='lvl_conflict-upper';
 b=B.setStair(b,{id:'str_conflict-1',fromLevelId:'lvl_conflict-ground',toLevelId:'lvl_conflict-upper',startMm:{x:Math.round(cx),y:600},rotationDeg:90,widthMm:1000,runLengthMm:2600,risers:15});
 b.createdAt=b.updatedAt='2026-10-18T10:00:00.000Z';B.validate(b);
 return {building:b,pasoId:paso.id,salonId:salon.id,estudioId:estudio.id,pasoCenterX:cx};
}
module.exports={build};
