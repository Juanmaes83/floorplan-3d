// Phase B7: the material board lists only what the project uses: floor finishes with m² and rooms, wall finishes
// with their length, and the furniture palette weighted by footprint. Real catalog samples when the finish has one.
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/moodboard-core.js'),project=require('../js/reference-project.js');
test('floors, walls and palette come from the project, ordered by weight',()=>{
 const d=M.derive(project);
 const used=new Set(project.rooms.map(r=>r.floorMaterialId));assert.deepEqual(new Set(d.floors.map(f=>f.materialId)),used);
 for(let i=1;i<d.floors.length;i++)assert.ok(d.floors[i-1].areaM2>=d.floors[i].areaM2);
 const total=project.rooms.reduce((n,r)=>n+M.area(r.polygon),0);assert.ok(Math.abs(d.floors.reduce((n,f)=>n+f.areaM2,0)-total)<0.05);
 assert.equal(d.walls.length,0);assert.ok(d.palette.length>0&&d.palette.length<=8);assert.equal(d.furniture,project.objects.length);assert.equal(d.empty,false);
});
test('wall finishes and real catalog samples; an empty project says so',()=>{
 const p=structuredClone(project);p.materials.push({id:'mat_plaster',name:'Yeso',category:'wall',appearance:{color:'#e0d8cc',preset:'surface-blue-plaster-wall'}});
 p.walls[0].surfaceMaterialId='mat_plaster';p.walls[1].surfaceMaterialId='mat_plaster';p.walls[2].surfaceMaterialId='mat_plaster';p.walls[2].status='demolished';
 const catalog={get:id=>id==='surface-blue-plaster-wall'?{sample:{path:'assets/materials/blue-plaster-wall-sample.webp'}}:null};
 const d=M.derive(p,{catalog});assert.equal(d.walls.length,1);assert.equal(d.walls[0].count,2,'a demolished wall is not counted');assert.equal(d.walls[0].sample,'assets/materials/blue-plaster-wall-sample.webp');
 assert.equal(d.floors.every(f=>f.sample===null),true,'legacy presets have no sample: colour only');
 assert.equal(M.derive({rooms:[],walls:[],objects:[],materials:[]}).empty,true);
});
