const {test}=require('node:test');
const assert=require('node:assert/strict');
const core=import('../js/visual-families-core.mjs');
const source={projectId:'project-a',id:'window-a',kind:'window',widthMm:2400,heightMm:1600,thicknessMm:200,fullHeight:true};
test('versioned opt-in resolver is pure, strict and stable with explicit precedence',async()=>{
 const {resolveVisual,stableJSON}=await core,input={enabled:true,projectId:'project-a',sourceIds:['window-b','window-a'],session:{'frame.finish':'chalk'},overrides:{'frame.finish':'graphite'}},copy=JSON.stringify(input),r=resolveVisual(input);
 assert.equal(r.tokens['frame.finish'],'graphite');assert.deepEqual(r.sourceIds,['window-a','window-b']);assert.equal(JSON.stringify(input),copy);assert.equal(stableJSON(r),stableJSON(resolveVisual(input)));assert.equal(resolveVisual().enabled,false);
 for(const bad of [{unknown:1},{recipeVersion:3},{role:'BACKGROUND'},{seed:NaN},{session:{'fake.token':1}},{overrides:{'frame.finish':'wood'}},{sourceIds:['a','a']},{sourceIds:Array.from({length:65},(_,i)=>'w'+i)},{mode:'world'}])assert.throws(()=>resolveVisual(bad));
});
test('architectural recipe derives reveals, distinct sash sections, sills and real-interior glazing',async()=>{
 const {resolveVisual,windowAssembly}=await core,a=resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a','window-b']}),b=resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a','window-b'],overrides:{'frame.finish':'chalk'}});
 const sa=windowAssembly(source,a),sb=windowAssembly(source,b),flush=windowAssembly(source,resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a','window-b'],overrides:{'frame.system':'flush-sash'}}));assert.deepEqual(sa.boxes,sb.boxes);assert.notDeepEqual(sa.materials,sb.materials);assert.notDeepEqual(sa.boxes,flush.boxes);assert.deepEqual(sa.materials,flush.materials);assert.notEqual(sa.boxes.find(b=>b.material==='frame').size[0],flush.boxes.find(b=>b.material==='frame').size[0]);
 assert.ok(windowAssembly({...source,id:'window-b',widthMm:1800},a));
 for(const excluded of [{...source,projectId:'other-project'},{...source,id:'other'},{...source,kind:'door'},{...source,fullHeight:false},{...source,widthMm:500},{...source,heightMm:NaN}])assert.equal(windowAssembly(excluded,a),null);
 for(const box of sa.boxes){assert.ok(box.size.every(v=>v>0));assert.ok(Math.abs(box.position[0])+box.size[0]/2<=1.27+1e-9);assert.ok(box.position[1]-box.size[1]/2>=-.057-1e-9);assert.ok(box.position[1]+box.size[1]/2<=1.604+1e-9);}
 assert.ok(sa.boxes.some(b=>b.material==='reveal'&&b.size[2]>.19));assert.ok(sa.boxes.some(b=>b.material==='sill'&&b.size[2]>.15));assert.equal(sa.glass.length,3);assert.ok(sa.glass.every(g=>g.size[2]===.012));assert.ok(sa.glazing.transmission>0&&sa.glazing.opacity<.5);
 assert.ok(sa.triangles<2000);assert.ok(windowAssembly(source,resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a'],mode:'mobile'})).triangles<sa.triangles);
});
test('adapter restores original frames, glass and facade, bounds ownership and cleans repeated cycles',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{WindowVisualAdapter}=await import('../js/visual-families-adapter.mjs'),adapter=new WindowVisualAdapter(T);
 const g=new T.Group(),frame=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial()),glass=new T.Mesh(frame.geometry,new T.MeshPhysicalMaterial({opacity:.28,transparent:true}));g.add(frame,glass);adapter.register(source,g,[frame],[glass]);
 for(let i=0;i<3;i++){adapter.set({enabled:true,projectId:'project-a',sourceIds:['window-a']});assert.equal(frame.visible,false);assert.equal(glass.visible,false);assert.equal(glass.material.opacity,.28);assert.equal(adapter.snapshot().resources.geometries,1);assert.equal(adapter.snapshot().resources.materials,5);assert.ok(adapter.snapshot().resources.meshes>=7);assert.ok(adapter.snapshot().resources.gpuBytes<32768);adapter.set({enabled:false});assert.equal(frame.visible,true);assert.equal(glass.visible,true);assert.equal(g.children.length,2);assert.equal(adapter.snapshot().resources.geometries,0);}
 const before=JSON.stringify(adapter.snapshot());assert.throws(()=>adapter.set({enabled:true,projectId:'project-a',overrides:{'frame.finish':'invalid'}}));assert.equal(JSON.stringify(adapter.snapshot()),before);
 adapter.set({enabled:true,projectId:'project-a',sourceIds:['window-a']});adapter.clearBindings();assert.equal(g.children.length,2);assert.equal(adapter.snapshot().bindings.length,0);assert.equal(adapter.snapshot().resources.pending,0);adapter.dispose();frame.geometry.dispose();frame.material.dispose();glass.material.dispose();
});
