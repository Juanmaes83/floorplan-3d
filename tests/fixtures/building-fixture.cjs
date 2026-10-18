// Asymmetric synthetic two-level building (not a real plan). Ground: F1b example with a confirmed («real») scale and
// its own PNG, extended with a second room. Upper: smaller, shifted by an offset, with an estimated scale, its own
// JPEG and an overhang without a wall below. A straight stair rises from the ground room into the upper room.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../../js/project-core.js'),L=require('../../js/room-layout.js'),T=require('../../js/tracing-core.js'),B=require('../../js/building-core.js');
const root=path.resolve(__dirname,'..','..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function build(){
 const groundImage=fs.readFileSync(path.join(root,'tests/fixtures/manual-plan.png')),upperImage=fs.readFileSync(path.join(root,'tests/fixtures/manual-plan.jpg'));
 const f1b=JSON.parse(fs.readFileSync(path.join(root,'docs/contracts/examples/floorplan-project-v1.f1b.example.json'),'utf8'));
 let ground=L.blank('Casa sintética · planta baja');ground.id='prj_fixture-ground';
 ground=L.create(ground,{name:'Cocina',width:4000,depth:2400,x:400,y:400}).project;
 ground=L.create(ground,{name:'Estar',width:3000,depth:2400,neighborId:ground.rooms[0].id,side:'right'}).project;
 const estar=ground.rooms.find(r=>r.name==='Estar'),shared=ground.walls.find(w=>w.start.x===w.end.x&&w.start.x>4000&&w.start.x<5000);
 ground.openings.push({id:'opn_fixture-ground-door',kind:'door',wallId:shared.id,offsetMm:800,widthMm:800,heightMm:2100,sillHeightMm:0,swing:{hinge:'start',side:'left'}});
 // Confirmed («real») scale and image of the F1b example, so the two levels have different confidences.
 ground.scale=f1b.scale;ground.sourceImages=f1b.sourceImages;
 ground.objects.push({...C.object('sofa','Sofá',6000,1300,2000,900,0,'#9aa7b3'),id:'obj_fixture-sofa',roomId:estar.id});
 ground.objects=ground.objects.map(o=>{const {cx,cy,w,d,rot,...rest}=o;return rest;});
 ground.sourceImages[0].bytes=groundImage.length;ground.sourceImages[0].sha256=sha(groundImage);
 C.validate(ground,{strict:true});

 let upper=L.blank('Casa sintética · planta primera');upper.id='prj_fixture-upper';
 upper.scale={confidence:'estimated',method:'declared-ratio',declaredRatio:'1:100',note:'Escala declarada en el plano de la planta alta; sin calibrar.'};
 upper=L.create(upper,{name:'Dormitorio',width:4400,depth:2400,x:400,y:400}).project;
 const info=T.imageInfo(upperImage,'image/jpeg');
 upper.schemaVersion='1.1.0';
 upper.sourceImages=[{id:'img_fixture-upper',mediaType:'image/jpeg',widthPx:info.widthPx,heightPx:info.heightPx,bytes:upperImage.length,sha256:sha(upperImage),storage:{kind:'sidecar-file',ref:'images/img_fixture-upper.jpg'},placement:{originMm:{x:0,y:0},rotationDeg:0,mmPerPixel:10},visible:true,opacity:0.55}];
 const dorm=upper.rooms[0],wallTop=upper.walls.find(w=>w.start.y===w.end.y&&w.start.y<1000);
 upper.openings.push({id:'opn_fixture-upper-window',kind:'window',wallId:wallTop.id,offsetMm:1500,widthMm:1200,heightMm:1200,sillHeightMm:900});
 upper.objects.push({...C.object('bed','Cama',2400,1500,1600,2000,90,'#d9cbb5'),id:'obj_fixture-bed',roomId:dorm.id});
 upper.objects=upper.objects.map(o=>{const {cx,cy,w,d,rot,...rest}=o;return rest;});
 C.validate(upper,{strict:true});

 let b=B.create(ground,{name:'Casa sintética de dos plantas'});
 b.id='bld_fixture-house';b.levels[0].id='lvl_fixture-ground';b.createdAt=b.updatedAt='2026-10-18T09:00:00.000Z';
 b=B.addLevel(b,upper,{name:'Planta primera',elevationMm:3100,slabThicknessMm:300,offsetMm:{x:2600,y:0}});
 b.levels[1].id='lvl_fixture-upper';
 // Stair in the «Estar» room, climbing east (+x) into the upper bedroom.
 b=B.setStair(b,{id:'str_fixture-main',fromLevelId:'lvl_fixture-ground',toLevelId:'lvl_fixture-upper',startMm:{x:4900,y:2100},rotationDeg:0,widthMm:900,runLengthMm:2400,risers:14});
 b.updatedAt='2026-10-18T09:00:00.000Z';
 B.validate(b);
 return {building:b,images:new Map([['img_img_synthetic',groundImage]]),bytesFor:id=>id==='img_fixture-upper'?upperImage:groundImage};
}
module.exports={build};
