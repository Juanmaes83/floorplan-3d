const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const core=import('../js/facade-fidelity-core.mjs');
const source={projectId:'project-a',id:'wall-a',exterior:'facade',reserved:false,materialId:'mat-white',category:'wall',preset:'surface-white-plaster-02'};
const v2={recipeId:'facade-material-v2',recipeVersion:2};

test('F03 V2 is explicit and preserves the approved V1 defaults and semantics',async()=>{
 const {resolveFacade,registry,facadeEligibility}=await core;
 const original=resolveFacade({enabled:true,projectId:'project-a',mode:'capture'});
 assert.equal(original.recipeId,'facade-material');assert.equal(original.recipeVersion,1);assert.equal(registry.F03.recipes['facade-material'].renderBudget.gpuBytes,14000000);
 const decision=resolveFacade({enabled:true,projectId:'project-a',mode:'capture',...v2});
 assert.equal(decision.authority,'VISUAL_ONLY');assert.equal(decision.materialId,'white_stucco');assert.equal(registry.F03.recipes['facade-material-v2'].renderBudget.gpuBytes,17000000);
 assert.equal(facadeEligibility(source,decision).eligible,true);
 assert.equal(facadeEligibility({...source,preset:'surface-brushed-concrete'},decision).reason,'material-semantic-mismatch');
 assert.equal(facadeEligibility({...source,reserved:true},decision).reason,'f02-owned-surface');
 assert.throws(()=>resolveFacade({enabled:true,projectId:'project-a',...v2,materialId:'rough_plaster_03'}),/opt-in/);
 const rough=resolveFacade({enabled:true,projectId:'project-a',...v2,materialId:'rough_plaster_03',allowExperimentalVariant:true});
 assert.equal(facadeEligibility({...source,preset:'surface-plastered-wall-03'},rough).eligible,true);
});

test('F03 V2 enforces the estimated GPU budget before mutating any mesh',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{FacadeFidelityAdapter}=await import('../js/facade-fidelity-adapter.mjs'),{registry}=await core;
 const adapter=new FacadeFidelityAdapter(T),project={id:'project-a',walls:[{id:'wall-a',surfaceMaterialId:'mat-white'}],materials:[{id:'mat-white',category:'wall',appearance:{preset:'surface-white-plaster-02'}}]},mesh=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial()),geometry=mesh.geometry,material=mesh.material;
 mesh.userData.wallId='wall-a';adapter.register(project,{walls:[{wallId:'wall-a',status:'facade'}]},[mesh]);
 adapter.load=async record=>{record.material=new T.MeshStandardMaterial();record.state='ready';record.gpuBytes=registry.F03.recipes['facade-material-v2'].renderBudget.gpuBytes+1;};
 const result=await adapter.set({enabled:true,projectId:'project-a',...v2});
 assert.equal(result.status,'fallback');assert.match(result.error,/gpuBytes/);assert.equal(result.active.length,0);assert.equal(result.resources.geometries,0);assert.equal(mesh.geometry,geometry);assert.equal(mesh.material,material);
 adapter.dispose();geometry.dispose();material.dispose();
});

test('F03 V2 shares textures across compatible walls and restores every original resource',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{FacadeFidelityAdapter}=await import('../js/facade-fidelity-adapter.mjs'),root=path.resolve(__dirname,'..');
 const previous={fetch:global.fetch,createImageBitmap:global.createImageBitmap};
 global.createImageBitmap=async()=>({width:512,height:512,close(){this.closed=true;}});
 global.fetch=async url=>{const file=path.resolve(root,String(url));return new Response(await fs.readFile(file),{status:200,headers:{'Content-Type':file.endsWith('.webp')?'image/webp':'application/json'}});};
 try{
  const adapter=new FacadeFidelityAdapter(T),project={id:'project-a',walls:['wall-a','wall-b'].map(id=>({id,surfaceMaterialId:'mat-white'})),materials:[{id:'mat-white',category:'wall',appearance:{preset:'surface-white-plaster-02'}}]},meshes=project.walls.map(w=>{const mesh=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial());mesh.userData.wallId=w.id;return mesh;}),original=meshes.map(mesh=>({geometry:mesh.geometry,material:mesh.material}));
  adapter.register(project,{walls:project.walls.map(w=>({wallId:w.id,status:'facade'}))},meshes);
  for(let i=0;i<3;i++){
   const on=await adapter.set({enabled:true,projectId:'project-a',mode:'mobile',...v2});assert.equal(on.status,'ready');assert.deepEqual(on.active,['wall-a','wall-b']);assert.equal(on.resources.geometries,2);assert.equal(on.resources.textures,3);assert.equal(on.resources.materials,1);assert.equal(meshes[0].material,meshes[1].material);
   const off=await adapter.set({enabled:false,...v2});assert.equal(off.active.length,0);assert.equal(off.resources.geometries,0);assert.equal(off.resources.textures,0);assert.equal(off.resources.materials,0);
   meshes.forEach((mesh,index)=>{assert.equal(mesh.geometry,original[index].geometry);assert.equal(mesh.material,original[index].material);});
  }
  adapter.dispose();for(const mesh of meshes){mesh.geometry.dispose();mesh.material.dispose();}
 }finally{Object.assign(global,previous);}
});
