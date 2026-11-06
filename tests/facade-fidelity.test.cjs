const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs/promises');
const path=require('node:path');
const {webcrypto}=require('node:crypto');
const core=import('../js/facade-fidelity-core.mjs');
const source={projectId:'project-a',id:'wall-a',exterior:'facade',reserved:false,materialId:'mat-white',category:'wall',preset:'surface-white-plaster-02'};

test('F03 resolver is visual-only, off by default, strict and experimentally gated',async()=>{
 const {resolveFacade}=await core,input={enabled:true,projectId:'project-a',mode:'capture'},copy=JSON.stringify(input),r=resolveFacade(input);
 assert.equal(r.enabled,true);assert.equal(r.authority,'VISUAL_ONLY');assert.equal(r.profile,'hero');assert.equal(r.materialId,'white_stucco');assert.equal(JSON.stringify(input),copy);assert.equal(resolveFacade().enabled,false);
 assert.equal(resolveFacade({...input,mode:'mobile'}).profile,'balanced');
 for(const bad of [{unknown:1},{enabled:true},{...input,recipeVersion:2},{...input,role:'BACKGROUND'},{...input,mode:'world'},{...input,materialId:'white_rough_plaster'},{...input,materialId:'other'},{...input,normalStrength:3},{...input,repeatMm:1}])assert.throws(()=>resolveFacade(bad));
});

test('F03 eligibility preserves material identity and excludes F02-owned surfaces',async()=>{
 const {resolveFacade,facadeEligibility,compatibleFacade}=await core,on=resolveFacade({enabled:true,projectId:'project-a'});
 assert.equal(facadeEligibility(source,on).eligible,true);assert.equal(compatibleFacade(source,on),true);
 for(const [patch,reason]of [
  [{projectId:'other'},'project-mismatch'],[{exterior:'interior'},'interior-wall'],[{exterior:'unavailable'},'exterior-unavailable'],[{reserved:true},'f02-owned-surface'],[{materialId:null},'material-unassigned'],[{category:'floor'},'material-category-excluded'],[{preset:'surface-plastered-wall-03'},'material-semantic-mismatch']
 ])assert.equal(facadeEligibility({...source,...patch},on).reason,reason);
 const experimental=resolveFacade({enabled:true,projectId:'project-a',materialId:'rough_plaster_03',allowExperimentalVariant:true});
 assert.equal(facadeEligibility({...source,preset:'surface-plastered-wall-03'},experimental).eligible,true);
});

test('F03 metric UVs preserve geometry topology and adapt physical repeat',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{metricFacadeGeometry}=await import('../js/facade-fidelity-adapter.mjs');
 const mesh=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial());mesh.position.set(3,1.4,-2);mesh.rotation.y=-Math.PI/6;
 const original=mesh.geometry,derived=metricFacadeGeometry(T,mesh);
 assert.notEqual(derived,original);assert.deepEqual(derived.attributes.position.array,original.attributes.position.array);assert.deepEqual(derived.attributes.normal.array,original.attributes.normal.array);assert.deepEqual(derived.index.array,original.index.array);
 assert.equal(derived.userData.f03MetricUV,true);assert.equal(derived.attributes.uv.count,original.attributes.uv.count);
 const uv=derived.attributes.uv;assert(Math.max(...uv.array)-Math.min(...uv.array)>2);
 original.dispose();derived.dispose();mesh.material.dispose();
});

test('F03 verified loading, fallback and three reversible cycles release owned resources',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{FacadeFidelityAdapter}=await import('../js/facade-fidelity-adapter.mjs'),root=path.resolve(__dirname,'..');
 const previous={fetch:global.fetch,createImageBitmap:global.createImageBitmap};
 global.createImageBitmap=async()=>({width:512,height:512,close(){this.closed=true;}});
 global.fetch=async url=>{const file=path.resolve(root,String(url));return new Response(await fs.readFile(file),{status:200,headers:{'Content-Type':file.endsWith('.webp')?'image/webp':'application/json'}});};
 try{
  const adapter=new FacadeFidelityAdapter(T),project={id:'project-a',walls:[{id:'wall-a',surfaceMaterialId:'mat-white'}],materials:[{id:'mat-white',category:'wall',appearance:{preset:'surface-white-plaster-02'}}]},mesh=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial()),originalGeometry=mesh.geometry,originalMaterial=mesh.material;
  mesh.userData.wallId='wall-a';adapter.register(project,{walls:[{wallId:'wall-a',status:'facade'}]},[mesh]);
  for(let i=0;i<3;i++){
   const on=await adapter.set({enabled:true,projectId:'project-a',mode:'mobile'});assert.equal(on.status,'ready');assert.deepEqual(on.active,['wall-a']);assert.equal(on.resources.textures,3);assert.equal(on.resources.materials,1);assert.equal(on.resources.geometries,1);assert.notEqual(mesh.material,originalMaterial);assert.notEqual(mesh.geometry,originalGeometry);
   const off=await adapter.set({enabled:false});assert.equal(off.active.length,0);assert.equal(off.resources.textures,0);assert.equal(off.resources.materials,0);assert.equal(off.resources.geometries,0);assert.equal(off.resources.pending,0);assert.equal(mesh.material,originalMaterial);assert.equal(mesh.geometry,originalGeometry);
  }
  global.fetch=async url=>String(url).endsWith('.json')?new Response(await fs.readFile(path.resolve(root,String(url))),{status:200,headers:{'Content-Type':'application/json'}}):new Response('missing',{status:404});
  const fallback=await adapter.set({enabled:true,projectId:'project-a',mode:'mobile'});assert.equal(fallback.status,'fallback');assert.equal(fallback.resources.textures,0);assert.equal(mesh.material,originalMaterial);assert.match(fallback.error,/HTTP 404/);
  adapter.dispose();originalGeometry.dispose();originalMaterial.dispose();
 }finally{Object.assign(global,previous);}
});
