import {resolveVisual,windowProfile,stableJSON,registry} from './visual-families-core.mjs';
// F02 owns only derived meshes/materials. Rubik owns source groups, glass and original frames.
export class WindowVisualAdapter{
 constructor(THREE){this.T=THREE;this.bindings=new Map();this.decision=resolveVisual();this.derived=[];this.resources=[];this.disposals=0;}
 register(source,group,frames){
  if(this.bindings.has(source.id))throw Error('Duplicate window binding: '+source.id);
  this.bindings.set(source.id,{source:{...source},group,frames:frames.map(mesh=>({mesh,visible:mesh.visible}))});
 }
 set(input){const next=resolveVisual(input);this.apply(next);return this.snapshot();}
 apply(next=this.decision){
  const specs=[...this.bindings.values()].map(binding=>({binding,spec:windowProfile(binding.source,next)})).filter(x=>x.spec);
  const budget=registry.F02.recipes['window-profile'].renderBudget;
  if(specs.length>budget.instances||specs.reduce((n,x)=>n+x.spec.triangles,0)>budget.triangles)throw Error('Visual recipe budget exceeded');
  this.release();this.decision=next;if(!specs.length)return;
  const T=this.T;
  try{
   const geometry=new T.BoxGeometry(1,1,1);this.resources.push(geometry);
   const materials=Object.fromEntries(Object.entries(specs[0].spec.materials).map(([k,p])=>{const m=new T.MeshStandardMaterial(p);this.resources.push(m);return[k,m];}));
   for(const {binding,spec}of specs){
    const group=new T.Group();group.name='rubik-visual-window';group.userData={authority:'VISUAL_ONLY',sourceId:spec.sourceId,recipe:'F02/window-profile@1'};
    group.position.y=(binding.source.sillMm||0)/1000;this.derived.push({binding,group,spec});binding.group.add(group);
    for(const name of ['frame','seal']){
     const boxes=spec.boxes.filter(b=>b.material===name),mesh=new T.InstancedMesh(geometry,materials[name],boxes.length),matrix=new T.Matrix4();
     for(let i=0;i<boxes.length;i++){const b=boxes[i];matrix.makeScale(...b.size);matrix.setPosition(...b.position);mesh.setMatrixAt(i,matrix);}
     mesh.instanceMatrix.needsUpdate=true;mesh.computeBoundingSphere();mesh.receiveShadow=true;mesh.castShadow=false;group.add(mesh);
    }
    for(const f of binding.frames)f.mesh.visible=false;
   }
  }catch(error){this.release();this.decision=resolveVisual();throw error;}
 }
 release(){
  for(const {binding,group}of this.derived){binding.group.remove(group);group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const f of binding.frames)f.mesh.visible=f.visible;}
  this.derived=[];for(const resource of this.resources){resource.dispose();this.disposals++;}this.resources=[];
 }
 clearBindings(){this.release();this.bindings.clear();}
 dispose(){this.clearBindings();this.decision=resolveVisual();}
 snapshot(){return {decision:JSON.parse(stableJSON(this.decision)),bindings:[...this.bindings.values()].map(b=>b.source),active:this.derived.map(d=>d.spec.sourceId),
  resources:{geometries:this.resources.length?1:0,materials:this.resources.length?2:0,textures:0,meshes:this.derived.length*2,triangles:this.derived.reduce((n,d)=>n+d.spec.triangles,0),gpuBytes:this.resources.length?840+this.derived.reduce((n,d)=>n+d.spec.gpuBytes,0):0,pending:0},disposals:this.disposals};}
}
