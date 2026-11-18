import {resolveVisual,windowAssembly,stableJSON,registry} from './visual-families-core.mjs';
import {bakeSurface,recipeTextures} from './surface-fidelity.mjs';
export class WindowVisualAdapter{
 constructor(THREE){this.T=THREE;this.bindings=new Map();this.decision=resolveVisual();this.derived=[];this.resources=[];this.disposals=0;}
 register(source,group,frames,glass=[],facade=[]){
  if(this.bindings.has(source.id))throw Error('Duplicate window binding: '+source.id);
  const preserve=mesh=>({mesh,visible:mesh.visible});
  this.bindings.set(source.id,{source:{...source},group,frames:frames.map(preserve),glass:glass.map(preserve),facade:facade.map(mesh=>({mesh,material:mesh.material}))});
 }
 set(input){const next=resolveVisual(input);this.apply(next);return this.snapshot();}
 apply(next=this.decision){
  const specs=[...this.bindings.values()].map(binding=>({binding,spec:windowAssembly(binding.source,next)})).filter(x=>x.spec);
  const budget=registry.F02.recipes['window-assembly'].renderBudget;
  if(specs.length>budget.instances||specs.reduce((n,x)=>n+x.spec.triangles,0)>budget.triangles)throw Error('Visual recipe budget exceeded');
  this.release();this.decision=next;if(!specs.length)return;
  const T=this.T;
  try{
   const geometry=new T.BoxGeometry(1,1,1);this.resources.push(geometry);
   const materials=Object.fromEntries(Object.entries(specs[0].spec.materials).map(([k,p])=>{const m=new T.MeshStandardMaterial(p);this.resources.push(m);return[k,m];}));
   const glazing=new T.MeshPhysicalMaterial(specs[0].spec.glazing);glazing.side=T.DoubleSide;this.resources.push(glazing);
   const facadeBindings=specs.filter(({binding})=>binding.facade.length);
   if(facadeBindings.length){
    const recipe=specs[0].spec.facade,bake=bakeSurface(recipe.family,recipe.mean,recipe.repeatMm),textures=recipeTextures(T,bake,recipe.repeatMm);this.resources.push(...textures);
    const material=new T.MeshStandardMaterial({color:0xffffff,map:textures[0],normalMap:textures[1],roughnessMap:textures[2],roughness:1});material.normalScale.setScalar(.8);this.resources.push(material);
    for(const {binding}of facadeBindings)for(const item of binding.facade)item.mesh.material=material;
   }
   for(const {binding,spec}of specs){
    const group=new T.Group();group.name='rubik-visual-window-assembly';group.userData={authority:'VISUAL_ONLY',sourceId:spec.sourceId,recipe:'F02/window-assembly@2'};
    group.position.y=(binding.source.sillMm||0)/1000;this.derived.push({binding,group,spec});binding.group.add(group);
    for(const name of Object.keys(materials)){
     const boxes=spec.boxes.filter(b=>b.material===name);if(!boxes.length)continue;
     const mesh=new T.InstancedMesh(geometry,materials[name],boxes.length),matrix=new T.Matrix4();
     for(let i=0;i<boxes.length;i++){const b=boxes[i];matrix.makeScale(...b.size);matrix.setPosition(...b.position);mesh.setMatrixAt(i,matrix);}
     mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.castShadow=name!=='seal';group.add(mesh);
    }
    for(const pane of spec.glass){const mesh=new T.Mesh(geometry,glazing);mesh.scale.set(...pane.size);mesh.position.set(...pane.position);mesh.renderOrder=2;mesh.castShadow=false;group.add(mesh);}
    for(const f of binding.frames)f.mesh.visible=false;for(const pane of binding.glass)pane.mesh.visible=false;
   }
  }catch(error){this.release();this.decision=resolveVisual();throw error;}
 }
 release(){
  for(const {binding,group}of this.derived){
   binding.group.remove(group);group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});
   for(const f of binding.frames)f.mesh.visible=f.visible;for(const pane of binding.glass)pane.mesh.visible=pane.visible;
   for(const item of binding.facade)item.mesh.material=item.material;
  }
  this.derived=[];for(const resource of this.resources){resource.dispose();this.disposals++;}this.resources=[];
 }
 clearBindings(){this.release();this.bindings.clear();}
 dispose(){this.clearBindings();this.decision=resolveVisual();}
 snapshot(){return {decision:JSON.parse(stableJSON(this.decision)),bindings:[...this.bindings.values()].map(b=>b.source),active:this.derived.map(d=>d.spec.sourceId),
  resources:{geometries:this.resources.filter(r=>r.isBufferGeometry).length,materials:this.resources.filter(r=>r.isMaterial).length,textures:this.resources.filter(r=>r.isTexture).length,meshes:this.derived.reduce((n,d)=>n+d.group.children.length,0),facadeMeshes:this.derived.reduce((n,d)=>n+d.binding.facade.length,0),triangles:this.derived.reduce((n,d)=>n+d.spec.triangles,0),gpuBytes:this.resources.reduce((n,r)=>n+(r.isTexture&&r.image?Math.ceil(r.image.width*r.image.height*4*4/3):0),this.resources.length?840:0)+this.derived.reduce((n,d)=>n+d.spec.gpuBytes,0),pending:0},disposals:this.disposals};}
}
