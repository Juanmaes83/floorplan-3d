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

// ───────────────────────────────────────────────────────────────── F03 V2
const projectV2=()=>({id:'project-v2',walls:[
 {id:'w-render',start:{x:0,y:0},end:{x:4000,y:0},heightMm:2800,surfaceMaterialId:'m-render'},
 {id:'w-clay',start:{x:0,y:0},end:{x:0,y:3000},heightMm:2800,surfaceMaterialId:'m-clay'},
 {id:'w-wood',start:{x:0,y:3000},end:{x:2000,y:3000},heightMm:2800,surfaceMaterialId:'m-wood'},
 {id:'w-stone',start:{x:4000,y:0},end:{x:4000,y:300},heightMm:2800,surfaceMaterialId:'m-stone'},
 {id:'w-stucco',start:{x:2000,y:3000},end:{x:4000,y:3000},heightMm:2800,surfaceMaterialId:'m-stucco'},
 {id:'w-inner',start:{x:1000,y:0},end:{x:1000,y:3000},heightMm:2800,surfaceMaterialId:'m-render'}],
 materials:[{id:'m-render',category:'wall',appearance:{preset:'surface-painted-plaster-wall',repeatMm:{x:1000,y:1000}}},
  {id:'m-clay',category:'wall',appearance:{preset:'surface-patterned-clay-plaster',repeatMm:{x:1500,y:1500}}},
  {id:'m-wood',category:'wall',appearance:{preset:'surface-wood-planks-grey',repeatMm:{x:1000,y:1000}}},
  {id:'m-stone',category:'wall',appearance:{preset:'surface-slate-floor'}},
  {id:'m-stucco',category:'wall',appearance:{preset:'surface-white-plaster-02'}}]});
const exteriorV2={walls:[['w-render','facade'],['w-clay','facade'],['w-wood','facade'],['w-stone','facade'],['w-stucco','facade'],['w-inner','interior']].map(([wallId,status])=>({wallId,status}))};

test('F03 V2 resolver: visual-only, off by default, per-wall material, strict',async()=>{
 const {resolveFacadeV2}=await core;const d=resolveFacadeV2();
 assert.equal(d.enabled,false);assert.equal(d.recipeVersion,2);assert.equal(d.authority,'VISUAL_ONLY');assert.equal(d.visualGate,'VISUAL_PENDING_HUMAN');
 assert.equal(resolveFacadeV2({enabled:true,projectId:'p'}).profile,'hero');assert.equal(resolveFacadeV2({enabled:true,projectId:'p',mode:'mobile'}).profile,'balanced');
 for(const bad of [{materialId:'white_stucco'},{enabled:true},{enabled:true,projectId:'p',recipeVersion:1},{enabled:true,projectId:'p',mode:'world'},{enabled:true,projectId:'p',profile:'ultra'},{enabled:'yes',projectId:'p'},[]])assert.throws(()=>resolveFacadeV2(bad));
});

test('F03 V2 eligibility: same-asset materials, V1 presets preserved, stable reasons',async()=>{
 const {resolveFacadeV2,facadeEligibilityV2,v2Recipe}=await core,on=resolveFacadeV2({enabled:true,projectId:'p'});
 const src=(preset,patch={})=>({projectId:'p',id:'w',exterior:'facade',reserved:false,materialId:'m',category:'wall',preset,...patch});
 assert.deepEqual([['surface-painted-plaster-wall','painted_plaster_wall'],['surface-patterned-clay-plaster','patterned_clay_plaster'],['surface-brushed-concrete-03','brushed_concrete_03'],['surface-wood-planks-grey','wood_planks_grey'],['surface-white-plaster-02','white_stucco'],['surface-plastered-wall-03','rough_plaster_03']].map(([p])=>facadeEligibilityV2(src(p),on).materialId),['painted_plaster_wall','patterned_clay_plaster','brushed_concrete_03','wood_planks_grey','white_stucco','rough_plaster_03']);
 for(const id of ['painted_plaster_wall','patterned_clay_plaster','brushed_concrete_03','wood_planks_grey'])assert.equal(v2Recipe.materials[id].sameAsset,true);
 for(const id of ['white_stucco','rough_plaster_03'])assert.equal(v2Recipe.materials[id].sameAsset,false);
 for(const [patch,reason] of [[{projectId:'x'},'project-mismatch'],[{exterior:'interior'},'interior-wall'],[{exterior:'unavailable'},'exterior-unavailable'],[{reserved:true},'f02-owned-surface'],[{materialId:null},'material-unassigned'],[{category:'floor'},'material-category-excluded'],[{preset:'surface-slate-floor'},'material-no-facade-source'],[{preset:'wood'},'material-no-facade-source']])
  assert.equal(facadeEligibilityV2(src('surface-painted-plaster-wall',patch),on).reason,reason);
 assert.equal(facadeEligibilityV2(src('surface-painted-plaster-wall'),{...on,recipeVersion:1}).reason,'unsupported-recipe');
});

test('F03 V2 budget plan: largest facade first, never over the cap, mobile balanced only',async()=>{
 const {planFacadeBudget,V2_GPU_BYTES,v2Recipe}=await core;
 const g=[{materialId:'a',areaM2:30,walls:8},{materialId:'b',areaM2:21,walls:3},{materialId:'c',areaM2:19,walls:2},{materialId:'d',areaM2:8,walls:4},{materialId:'e',areaM2:1,walls:1}];
 const hero=planFacadeBudget(g,'hero');assert(hero.used<=hero.cap);assert.deepEqual(hero.plan.map(p=>p.profile),['hero','hero','balanced','balanced',null]);assert.equal(hero.plan[4].reason,'budget');
 const mob=planFacadeBudget(g,'balanced');assert(mob.used<=mob.cap);assert(mob.plan.every(p=>p.profile!=='hero'));assert.equal(mob.plan.filter(p=>p.profile).length,4);
 assert.equal(V2_GPU_BYTES.hero,16777218);assert.equal(planFacadeBudget([],'hero').used,0);assert.throws(()=>planFacadeBudget(null,'hero'));
 const many=Array.from({length:9},(_,i)=>({materialId:'m'+i,areaM2:9-i,walls:1}));assert(planFacadeBudget(many,'balanced').plan.filter(p=>p.profile).length<=v2Recipe.renderBudget.materials);
});

test('F03 V2 scaled metric UVs keep topology and apply the physical repeat',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{metricFacadeGeometry,metricFacadeGeometryScaled}=await import('../js/facade-fidelity-adapter.mjs');
 const mesh=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial());mesh.position.set(1,1.4,2);
 const base=metricFacadeGeometry(T,mesh),scaled=metricFacadeGeometryScaled(T,mesh,{x:2000,y:1000});
 assert.deepEqual(scaled.attributes.position.array,mesh.geometry.attributes.position.array);assert.deepEqual(scaled.index.array,mesh.geometry.index.array);
 for(let i=0;i<base.attributes.uv.count;i++){assert(Math.abs(scaled.attributes.uv.getX(i)-base.attributes.uv.getX(i)/2)<1e-6);assert(Math.abs(scaled.attributes.uv.getY(i)-base.attributes.uv.getY(i))<1e-6);}
 assert.deepEqual(scaled.userData.f03RepeatMm,{x:2000,y:1000});base.dispose();scaled.dispose();mesh.geometry.dispose();mesh.material.dispose();
});

test('F03 V2 adapter: per-wall materials, 3 reversible cycles, isolated failure, cancellation, project untouched',async()=>{
 const T=await import('../vendor/three/build/three.module.js'),{FacadeFidelityAdapter}=await import('../js/facade-fidelity-adapter.mjs'),root=path.resolve(__dirname,'..');
 const previous={fetch:global.fetch,createImageBitmap:global.createImageBitmap,FloorPlanSurfaces:global.FloorPlanSurfaces};
 // Catálogo como en el navegador: repetición de diseño por defecto (1000 mm) para los acabados del catálogo.
 global.FloorPlanSurfaces={get:preset=>preset.startsWith('surface-')?{repeatMm:{x:1000,y:1000}}:undefined};
 global.createImageBitmap=async blob=>{const b=Buffer.from(await blob.arrayBuffer());/* RIFF/WebP VP8L/VP8: ancho y alto de la cabecera */const size=b.toString('ascii',12,16)==='VP8L'?(()=>{const bits=b.readUInt32LE(21);return [1+(bits&0x3fff),1+((bits>>14)&0x3fff)];})():[b.readUInt16LE(26)&0x3fff,b.readUInt16LE(28)&0x3fff];return {width:size[0],height:size[1],close(){this.closed=true;}};};
 const real=async url=>{const file=path.resolve(root,String(url));return new Response(await fs.readFile(file),{status:200,headers:{'Content-Type':file.endsWith('.webp')?'image/webp':'application/json'}});};
 global.fetch=real;
 try{
  const project=projectV2(),before=JSON.stringify(project),adapter=new FacadeFidelityAdapter(T),meshes=project.walls.map(w=>{const m=new T.Mesh(new T.BoxGeometry(4,2.8,.2),new T.MeshStandardMaterial());m.userData.wallId=w.id;return m;});
  const originals=meshes.map(m=>[m.material,m.geometry]);adapter.register(project,exteriorV2,meshes);
  const preview=adapter.previewV2('project-v2');assert.equal(preview.find(c=>c.wallId==='w-stone').reason,'material-no-facade-source');assert.equal(preview.find(c=>c.wallId==='w-inner').reason,'interior-wall');
  for(let i=0;i<3;i++){
   const on=await adapter.set({enabled:true,projectId:'project-v2',mode:'editor',recipeVersion:2});
   assert.equal(on.status,'ready');assert.deepEqual([...on.active].sort(),['w-clay','w-render','w-stucco','w-wood']);
   assert.equal(on.resources.materials,4);assert.equal(on.resources.textures,12);assert(on.resources.gpuBytes<=on.plan.cap);
   const byWall=Object.fromEntries(meshes.map(m=>[m.userData.wallId,m.material.name]));assert.equal(byWall['w-render'],'F03V2:painted_plaster_wall');assert.equal(byWall['w-wood'],'F03V2:wood_planks_grey');assert.equal(byWall['w-stucco'],'F03V2:white_stucco');
   assert.equal(meshes[3].material,originals[3][0]);assert.equal(meshes[5].material,originals[5][0]);
   // Repetición: la del profesional si la cambió (arcilla 1500); si no, la física de la fuente (revoco 2000).
   assert.deepEqual(meshes[1].geometry.userData.f03RepeatMm,{x:1500,y:1500});assert.deepEqual(meshes[0].geometry.userData.f03RepeatMm,{x:2000,y:2000});
   const off=await adapter.set({enabled:false,recipeVersion:2});assert.equal(off.active.length,0);assert.equal(off.resources.textures,0);assert.equal(off.resources.materials,0);
   meshes.forEach((m,k)=>{assert.equal(m.material,originals[k][0]);assert.equal(m.geometry,originals[k][1]);});
  }
  // Fallo aislado: sin los mapas de la madera, el resto se aplica y la madera conserva su acabado.
  global.fetch=async url=>String(url).includes('wood_planks_grey')?new Response('x',{status:404}):real(url);
  const partial=await adapter.set({enabled:true,projectId:'project-v2',recipeVersion:2});
  assert.equal(partial.status,'partial');assert.match(partial.error,/wood_planks_grey/);assert(!partial.active.includes('w-wood'));assert.equal(meshes[2].material,originals[2][0]);assert.equal(partial.materials.find(m=>m.materialId==='wood_planks_grey').state,'fallback');
  // Fallo total: sin manifiesto V2 ni V1, todo se conserva.
  global.fetch=async url=>String(url).endsWith('.json')?new Response('x',{status:503}):real(url);adapter.manifests?.clear();
  const failed=await adapter.set({enabled:true,projectId:'project-v2',recipeVersion:2});assert.equal(failed.status,'fallback');assert.equal(failed.resources.textures,0);meshes.forEach((m,k)=>assert.equal(m.material,originals[k][0]));
  // Cancelación: apagar mientras carga no deja nada aplicado ni pendiente.
  global.fetch=real;const pending=adapter.set({enabled:true,projectId:'project-v2',recipeVersion:2});const off=await adapter.set({enabled:false,recipeVersion:2});await pending;
  assert.equal(off.status,'off');assert.equal(adapter.snapshot().active.length,0);assert.equal(adapter.snapshot().resources.textures,0);meshes.forEach((m,k)=>assert.equal(m.material,originals[k][0]));
  assert.equal(JSON.stringify(project),before);
  adapter.dispose();originals.forEach(([m,g])=>{m.dispose();g.dispose();});
 }finally{Object.assign(global,previous);}
});
