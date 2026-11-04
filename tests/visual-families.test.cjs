const {test}=require('node:test'),assert=require('node:assert/strict');
const core=import('../js/visual-families-core.mjs');
const source={projectId:'project-a',id:'window-a',kind:'window',widthMm:2400,heightMm:1600,thicknessMm:200,fullHeight:true};
test('versioned opt-in resolver is pure, strict and stable with explicit precedence',async()=>{
 const {resolveVisual,stableJSON}=await core,input={enabled:true,projectId:'project-a',sourceIds:['window-b','window-a'],session:{'frame.finish':'chalk'},overrides:{'frame.finish':'graphite'}},copy=JSON.stringify(input),r=resolveVisual(input);
 assert.equal(r.tokens['frame.finish'],'graphite');assert.deepEqual(r.sourceIds,['window-a','window-b']);assert.equal(JSON.stringify(input),copy);assert.equal(stableJSON(r),stableJSON(resolveVisual(input)));assert.equal(resolveVisual().enabled,false);
 for(const bad of [{unknown:1},{recipeVersion:2},{role:'BACKGROUND'},{seed:NaN},{session:{'fake.token':1}},{overrides:{'frame.finish':'wood'}},{sourceIds:['a','a']},{sourceIds:['a','b','c','d']},{mode:'world'}])assert.throws(()=>resolveVisual(bad));
});
test('one physical recipe yields two finishes, several compatible instances and excluded targets',async()=>{
 const {resolveVisual,windowProfile}=await core,a=resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a','window-b']}),b=resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a','window-b'],overrides:{'frame.finish':'chalk'}});
 const sa=windowProfile(source,a),sb=windowProfile(source,b);assert.deepEqual(sa.boxes,sb.boxes);assert.notDeepEqual(sa.materials,sb.materials);
 assert.ok(windowProfile({...source,id:'window-b',widthMm:1800},a));
 for(const excluded of [{...source,projectId:'other-project'},{...source,id:'other'},{...source,kind:'door'},{...source,fullHeight:false},{...source,widthMm:500},{...source,heightMm:NaN}])assert.equal(windowProfile(excluded,a),null);
 for(const box of sa.boxes){assert.ok(box.size.every(v=>v>0));assert.ok(Math.abs(box.position[0])+box.size[0]/2<=1.2+1e-9);assert.ok(box.position[1]-box.size[1]/2>=-1e-9);assert.ok(box.position[1]+box.size[1]/2<=1.6+1e-9);}
 assert.ok(sa.triangles<1000);assert.ok(windowProfile(source,resolveVisual({enabled:true,projectId:'project-a',sourceIds:['window-a'],mode:'mobile'})).triangles<sa.triangles);
});
test('adapter restores original frames, leaves glass untouched, bounds ownership and cleans repeated cycles',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{WindowVisualAdapter}=await import('../js/visual-families-adapter.mjs'),adapter=new WindowVisualAdapter(T);
 const g=new T.Group(),frame=new T.Mesh(new T.BoxGeometry(1,1,1),new T.MeshStandardMaterial()),glass=new T.Mesh(frame.geometry,new T.MeshPhysicalMaterial({opacity:.28,transparent:true}));g.add(frame,glass);adapter.register(source,g,[frame]);
 for(let i=0;i<3;i++){adapter.set({enabled:true,projectId:'project-a',sourceIds:['window-a']});assert.equal(frame.visible,false);assert.equal(glass.visible,true);assert.equal(glass.material.opacity,.28);assert.equal(adapter.snapshot().resources.geometries,1);assert.equal(adapter.snapshot().resources.meshes,2);assert.ok(adapter.snapshot().resources.gpuBytes<32768);adapter.set({enabled:false});assert.equal(frame.visible,true);assert.equal(g.children.length,2);assert.equal(adapter.snapshot().resources.geometries,0);}
 const before=JSON.stringify(adapter.snapshot());assert.throws(()=>adapter.set({enabled:true,projectId:'project-a',overrides:{'frame.finish':'invalid'}}));assert.equal(JSON.stringify(adapter.snapshot()),before);
 adapter.set({enabled:true,projectId:'project-a',sourceIds:['window-a']});adapter.clearBindings();assert.equal(g.children.length,2);assert.equal(adapter.snapshot().bindings.length,0);assert.equal(adapter.snapshot().resources.pending,0);adapter.dispose();frame.geometry.dispose();frame.material.dispose();glass.material.dispose();
});
