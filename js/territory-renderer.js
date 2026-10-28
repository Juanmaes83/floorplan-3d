/* Three.js adapter. Context only: no building transforms, picking, collision or network. */
(function(root){
 'use strict';
 function create(THREE){
  const group=new THREE.Group();group.name='territorialContextGroup';group.userData.territorialContext=true;
  let signature='',generation=0,credits=[],state={building:true,parcel:true,orthophoto:true,terrain:true,north:true};
  const disposed={geometry:0,materials:0,textures:0};
  function clear(){generation++;const geometries=new Set(),materials=new Set(),textures=new Set();group.traverse(o=>{if(o.geometry)geometries.add(o.geometry);for(const m of Array.isArray(o.material)?o.material:o.material?[o.material]:[]){materials.add(m);if(m.map)textures.add(m.map);}});for(const t of textures){t.dispose();disposed.textures++;}for(const m of materials){m.dispose();disposed.materials++;}for(const g of geometries){g.dispose();disposed.geometry++;}group.clear();}
  function build({site,session,origin,level,owner}){
   session.sync(owner,site);const key=JSON.stringify([site,session.revision,origin,level]);if(key===signature)return;signature=key;clear();credits=[];
   if(!site?.buildingPlacement)return;
   const Core=root.FloorPlanTerritoryIntegration,Policy=root.FloorPlanTerritoryExportPolicy,Terrain=root.FloorPlanTerrainCore,frame=site.parcel.frame,placement=site.buildingPlacement,offset=level?.offsetMm||{x:0,y:0},elevation=(level?.elevationMm||0)/1000;
   const world=(p,z)=>{const m=Core.parcelToModel(site,p);return [(m.x-offset.x-origin.x)/1000,z-elevation,(m.y-offset.y-origin.y)/1000];};
   function tag(object,layers,policyLayers=layers){object.userData.territoryLayers=layers;object.userData.territoryPolicies=policyLayers.map(name=>Policy.layer(site[name]?.source,true));object.raycast=()=>{};group.add(object);return object;}
   function geometry(vertices,triangles,withUV){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices.flatMap(v=>world(v.local,v.height)),3));if(withUV)g.setAttribute('uv',new THREE.Float32BufferAttribute(vertices.flatMap(v=>{const uv=Core.uv(site.orthophoto.extent,v.sourceX,v.sourceY);return [uv.u,uv.v];}),2));g.setIndex(triangles.flat());g.computeVertexNormals();return g;}
   for(const polygon of site.parcel.sourceGeometry.polygons)for(const ring of polygon.rings){const pts=ring.map(([x,y])=>new THREE.Vector3(...world(Core.sourceToLocal(frame,x,y),.004)));pts.push(pts[0].clone());tag(new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x216b73,depthTest:false})),['parcel']);}
   const terrain=session.get('terrain'),ortho=session.get('orthophoto');let vertices,triangles,terrainActive=!!(terrain&&placement.vertical);
   if(terrainActive){const surface=Terrain.deriveSurface(terrain.grid,frame);vertices=surface.vertices.map(v=>({local:{x:v.xMm,y:v.yMm},sourceX:v.sourceX,sourceY:v.sourceY,height:v.elevationM===null?0:Core.elevationToModel(site,v.elevationM)}));triangles=surface.triangles;tag(new THREE.Mesh(geometry(vertices,triangles,false),new THREE.MeshStandardMaterial({color:0x7e9a6d,side:THREE.DoubleSide,roughness:1})),['terrain']);}
   if(ortho){let vv=vertices,tt=triangles;if(!terrainActive){const e=site.orthophoto.extent;vv=[[e.minX,e.maxY],[e.maxX,e.maxY],[e.minX,e.minY],[e.maxX,e.minY]].map(([x,y])=>({sourceX:x,sourceY:y,local:Core.sourceToLocal(frame,x,y),height:0}));tt=[[0,2,1],[1,2,3]];}
    const allowed=tt.filter(tri=>tri.every(i=>Core.uvInside(Core.uv(site.orthophoto.extent,vv[i].sourceX,vv[i].sourceY))));const token=generation,texture=new THREE.TextureLoader().load(ortho.url,()=>{if(token!==generation)texture.dispose();});texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
    const g=geometry(vv.map(v=>({...v,height:v.height+.002})),allowed,true);tag(new THREE.Mesh(g,new THREE.MeshBasicMaterial({map:texture,side:THREE.DoubleSide,polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1})),['orthophoto'],terrainActive?['orthophoto','terrain']:['orthophoto']);
   }
   const n=Core.parcelToModel(site,{x:placement.horizontal.parcelLocalAnchorMm.x,y:placement.horizontal.parcelLocalAnchorMm.y-1500}),a=placement.horizontal.modelAnchorMm;const points=[[a.x,a.y],[n.x,n.y]].map(([x,y])=>new THREE.Vector3((x-offset.x-origin.x)/1000,.03-elevation,(y-offset.y-origin.y)/1000));const line=new THREE.Line(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xb73228,depthTest:false}));line.userData.territoryLayers=['north'];line.raycast=()=>{};group.add(line);
   apply();
  }
  function apply(){for(const child of group.children)child.visible=(child.userData.territoryLayers||[]).every(k=>state[k]!==false);credits=root.FloorPlanTerritoryExportPolicy.attributions(group.children.filter(c=>c.visible).flatMap(c=>c.userData.territoryPolicies||[]));}
  function capture(){const visibility=group.children.map(o=>[o,o.visible]);const policies=[];for(const [o,visible] of visibility){const p=o.userData.territoryPolicies||[];if(visible&&p.every(v=>v.canExport))policies.push(...p);else if(p.length)o.visible=false;}return {attribution:root.FloorPlanTerritoryExportPolicy.attributions(policies),restore(){for(const [o,v]of visibility)o.visible=v;}};}
  return {group,update:build,get layers(){return {...state};},setLayers(patch){for(const k of Object.keys(state))if(typeof patch[k]==='boolean')state[k]=patch[k];apply();},get attribution(){return [...credits];},capture,dispose(){clear();signature='';},get disposals(){return {...disposed};}};
 }
 root.FloorPlanTerritoryRenderer={create};
})(globalThis);
