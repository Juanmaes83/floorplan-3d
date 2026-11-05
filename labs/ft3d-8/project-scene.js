/* FT3D-8 fidelity lab — renders a REAL RUBIK project from FloorPlanConstructionProject.inventory().
   No geometry is computed here: every position, span, thickness, height, sill, head, polygon, elevation and material
   comes from the inventory (FloorPlanCore.geometry / FloorPlanRoof / FloorPlanBuilding). The mesh assembly mirrors
   the editor's own 3D rules (index.html: wallBox, glazing, door leaf, sliding panes, ShapeGeometry floors/roof) so
   that both can be compared from the same camera. Those rules are inside index.html and are not exported; see
   docs/product/ft3d-8-auditoria-autoridades-2026-11-05.md (blocker "no mesh contract").
   Illustrative only: the "raw" colour before a finish layer, ghosts for elements without a task, and the growth. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const RAW='#cfc9bf',GHOST='#7a8a99',DEMOLISH='#b23a2a';
const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
const mats=new Map();
const mat=(color,extra={})=>{const k=color+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.9,...extra}));return mats.get(k);};

export function createProjectScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xe7e6e2);
  const camera=new THREE.PerspectiveCamera(45,1,.05,600);
  scene.add(new THREE.HemisphereLight(0xffffff,0xd8d3c8,1.2));
  const sun=new THREE.DirectionalLight(0xffffff,1.7);sun.position.set(14,24,10);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-25,right:25,top:25,bottom:-25,near:1,far:80});sun.shadow.bias=-.0004;sun.shadow.normalBias=.02;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(300,300),mat('#e2e0da',{roughness:1}));ground.rotation.x=-Math.PI/2;ground.position.y=-.002;ground.receiveShadow=true;scene.add(ground);
  const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;
  const root=new THREE.Group();scene.add(root);
  let objects=new Map(),roofVisible=true,frame={origin:{x:0,y:0}},auto=false;
  const glass=new THREE.MeshPhysicalMaterial({color:0xcfe6ef,roughness:.05,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
  const frameMat=mat('#5d6166',{roughness:.5,metalness:.4});
  const capMat=mat('#34312d',{roughness:.9});
  function clear(){root.traverse(o=>o.geometry?.dispose());root.clear();objects=new Map();}
  // World mapping identical to the editor: x=(xmm-OX)/1000, z=(ymm-OY)/1000, levels lifted by elevation.
  function load(inventory){
    clear();frame={origin:inventory.origin};
    const levels=new Map(inventory.levels.map(l=>[l.levelId,l]));
    const wx=(x,l)=>(x+l.offsetMm.x-frame.origin.x)/1000,wz=(y,l)=>(y+l.offsetMm.y-frame.origin.y)/1000;
    for(const e of inventory.elements){
      if(!e.representable)continue;
      const l=levels.get(e.levelId),g=new THREE.Group();g.position.y=l.elevationMm/1000;g.name=e.key;
      const parts={appear:[],layer:[],meshes:[]};
      const keep=(m,{color=null,layer=false}={})=>{m.castShadow=m.receiveShadow=true;m.userData.base={y:m.position.y,sy:m.scale.y};m.userData.final=color;parts.meshes.push(m);(layer?parts.layer:parts.appear).push(m);return m;};
      if(e.type==='wall'){
        for(const p of e.pieces){const h=(p.ytMm-p.ybMm)/1000;if(h<=.001)continue;
          // Editor rule (wallBox): walls with no declared material and not on the facade get a dark top cap.
          const face=()=>new THREE.MeshStandardMaterial({color:e.material.color,roughness:.92});
          const material=e.material.source==='viewer-default'&&e.exterior!=='facade'?[face(),face(),capMat,face(),face(),face()]:face();
          const m=new THREE.Mesh(new THREE.BoxGeometry(p.spanMm/1000,h,p.thicknessMm/1000),material);
          m.geometry.translate(0,h/2,0);m.position.set(wx(p.center[0],l),p.ybMm/1000,wz(p.center[1],l));m.rotation.y=-p.angle;g.add(keep(m,{color:e.material.color}));}
      }else if(['window','sliding-door','opening'].includes(e.type)&&e.rect){
        const grp=new THREE.Group();grp.position.set(wx(e.rect.center[0],l),0,wz(e.rect.center[1],l));grp.rotation.y=-e.rect.angle;
        const L=e.rect.spanMm/1000,sill=e.sillHeightMm/1000,top=(e.sillHeightMm+e.heightMm)/1000,gh=top-sill;
        if(e.type==='window'){
          const pane=new THREE.Mesh(new THREE.BoxGeometry(L,gh,.01),glass);pane.position.set(0,sill+gh/2,0);grp.add(pane);
          const n=Math.max(1,Math.round(L/.9));for(let k=0;k<=n;k++){const mu=new THREE.Mesh(new THREE.BoxGeometry(.04,gh,.06),frameMat);mu.position.set(-L/2+k*L/n,sill+gh/2,0);grp.add(mu);}
          for(const y of [sill+.02,top-.02]){const tr=new THREE.Mesh(new THREE.BoxGeometry(L,.04,.06),frameMat);tr.position.set(0,y,0);grp.add(tr);}
        }else if(e.type==='sliding-door'){
          const ph=e.heightMm/1000,pl=L*.55;
          for(const [s,off] of [[-1,-.02],[1,.02]]){const x=s<0?-L/2+pl/2:L/2-pl/2;
            const pane=new THREE.Mesh(new THREE.BoxGeometry(pl,ph,.02),glass);pane.position.set(x,ph/2,off);grp.add(pane);
            for(const y of [ph-.03,.03]){const fr=new THREE.Mesh(new THREE.BoxGeometry(pl,.05,.04),frameMat);fr.position.set(x,y,off);grp.add(fr);}
            for(const q of [-1,1]){const fr=new THREE.Mesh(new THREE.BoxGeometry(.04,ph,.04),frameMat);fr.position.set(x+q*pl/2,ph/2,off);grp.add(fr);}}
        }
        grp.userData.base={y:0,sy:1};g.add(grp);parts.appear.push(grp);parts.meshes.push(grp);
      }else if(e.type==='door'&&e.door){
        const d=e.door,L=d.lengthMm/1000,dh=d.heightMm/1000-.05,pivot=new THREE.Group();pivot.position.set(wx(d.hinge[0],l),0,wz(d.hinge[1],l));
        const leaf=new THREE.Mesh(new THREE.BoxGeometry(L,dh,.04),mat(e.material.color,{roughness:.5}));leaf.position.set(L/2,dh/2,0);leaf.castShadow=true;pivot.add(leaf);
        pivot.rotation.y=Math.atan2(-d.openDir[1],d.openDir[0]);pivot.userData.base={y:0,sy:1};pivot.userData.doorPivot=true;g.add(pivot);parts.appear.push(pivot);parts.meshes.push(pivot);
      }else if(e.type==='floor'){
        const shape=new THREE.Shape(e.polygon.map(p=>new THREE.Vector2(wx(p.x,l),-wz(p.y,l))));
        const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
        const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:e.material.color||'#d9d4ca',roughness:.85}));m.position.y=.006;m.receiveShadow=true;
        m.userData.base={y:.006,sy:1};m.userData.final=e.material.color;parts.appear.push(m);parts.layer.push(m);parts.meshes.push(m);g.add(m);
      }else if(e.type==='slab'){
        for(const poly of e.polygons){const geo=new THREE.ExtrudeGeometry(new THREE.Shape(poly.map(p=>new THREE.Vector2(wx(p.x,l),-wz(p.y,l)))),{depth:e.thicknessMm/1000,bevelEnabled:false});geo.rotateX(-Math.PI/2);
          const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:e.material.color,roughness:.95}));m.position.y=-e.thicknessMm/1000-.002;m.castShadow=m.receiveShadow=true;
          m.userData.base={y:m.position.y,sy:1};parts.appear.push(m);parts.meshes.push(m);g.add(m);}
      }else if(e.type==='roof'){
        for(const s of e.surfaces){
          const shape=new THREE.Shape(s.polygon.map(p=>new THREE.Vector2(wx(p.x,l),-wz(p.y,l))));const geo=new THREE.ShapeGeometry(shape);geo.rotateX(-Math.PI/2);
          const m=new THREE.Mesh(geo,new THREE.MeshStandardMaterial({color:e.material.color,roughness:.95,side:THREE.DoubleSide}));
          m.position.y=(s.elevationMm-l.elevationMm+2)/1000;m.castShadow=m.receiveShadow=true;m.userData.base={y:m.position.y,sy:1};m.userData.final=e.material.color;
          parts.appear.push(m);parts.meshes.push(m);g.add(m);}
        g.userData.roof=true;
      }
      // Ghost outline for "no task" state: built from the same meshes' edges, never from new geometry.
      const ghost=new THREE.Group();for(const m of [...parts.meshes]){m.updateMatrix();m.traverse(o=>{if(o.isMesh){const ln=new THREE.LineSegments(new THREE.EdgesGeometry(o.geometry),new THREE.LineBasicMaterial({color:GHOST,transparent:true,opacity:.75}));
        o.updateWorldMatrix(true,false);ln.applyMatrix4(new THREE.Matrix4().copy(g.matrixWorld).invert().multiply(o.matrixWorld));ghost.add(ln);}});}
      ghost.visible=false;g.add(ghost);
      root.add(g);objects.set(e.key,{e,g,parts,ghost});
    }
  }
  const tintable=x=>x&&x!==glass&&x!==frameMat&&x!==capMat&&!x.isMeshPhysicalMaterial&&x.color;
  const tint=(m,final,k)=>{if(!final)return;m.traverse(o=>{if(!o.isMesh)return;for(const x of [].concat(o.material))if(tintable(x))x.color.set(RAW).lerp(new THREE.Color(final),k);});};
  /* state: key -> {mode:'scheduled'|'pre-existing'|'unscheduled', build:0..1, layer:0..1|null, removal:0..1, present:0..1} */
  let visiblePieces=0;
  function setState(states){
    visiblePieces=0;
    for(const [key,o] of objects){
      const s=states.get(key)||{mode:'unscheduled'};
      if(o.g.userData.roof&&!roofVisible){o.g.visible=false;continue;}
      if(s.mode==='unscheduled'){o.g.visible=true;o.parts.meshes.forEach(m=>m.visible=false);o.ghost.visible=true;continue;}
      o.ghost.visible=false;
      const present=s.present??1;o.g.visible=present>0.001;if(!o.g.visible)continue;
      const b=ease(s.build??1),rem=ease(s.removal??0);
      o.parts.appear.forEach((m,i)=>{const n=o.parts.appear.length,k=ease(Math.min(1,Math.max(0,b*n-i)));m.visible=k>0.001;if(!m.visible)return;
        m.scale.y=m.userData.base.sy*Math.max(.001,k)*(1-rem*.98);m.position.y=m.userData.base.y;visiblePieces++;});
      const layerK=s.layer===null||s.layer===undefined?1:s.layer;
      o.parts.meshes.forEach(m=>{if(m.userData.final)tint(m,m.userData.final,layerK);});
      if(rem>0)o.parts.meshes.forEach(m=>m.traverse(x=>{if(x.isMesh)for(const y of [].concat(x.material))if(tintable(y))y.color.lerp(new THREE.Color(DEMOLISH),rem*.6);}));
    }
  }
  const setPose=({position,target,fov})=>{auto=false;controls.autoRotate=false;camera.position.fromArray(position);controls.target.fromArray(target);if(fov){camera.fov=fov;camera.updateProjectionMatrix();}controls.update();};
  // Default framing from the project's own envelope (no fixed demo camera).
  function frameEnvelope(inventory,view='iso'){
    const env=inventory.levels.reduce((a,l)=>({x0:Math.min(a.x0,l.envelope.x+l.offsetMm.x),y0:Math.min(a.y0,l.envelope.y+l.offsetMm.y),x1:Math.max(a.x1,l.envelope.x+l.envelope.w+l.offsetMm.x),y1:Math.max(a.y1,l.envelope.y+l.envelope.h+l.offsetMm.y)}),{x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
    const top=Math.max(...inventory.levels.map(l=>l.elevationMm))/1000+3,span=Math.hypot(env.x1-env.x0,env.y1-env.y0)/1000;
    const cx=((env.x0+env.x1)/2-frame.origin.x)/1000,cz=((env.y0+env.y1)/2-frame.origin.y)/1000,d=span*1.25+6;
    const dirs={iso:[.62,.55,.72],front:[0,.28,1],top:[0,1,.001],auto:[.62,.55,.72]},v=new THREE.Vector3(...dirs[view]).normalize();
    return {position:[cx+v.x*d,top/2+v.y*d,cz+v.z*d],target:[cx,top/3,cz],fov:45};
  }
  const resize=()=>{const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();};
  controls.addEventListener('start',()=>{auto=false;controls.autoRotate=false;});
  let raf=0;const tick=()=>{raf=requestAnimationFrame(tick);controls.update();renderer.render(scene,camera);};resize();tick();window.addEventListener('resize',resize);
  // Read-only structural inspection: world-space bounding box of every rendered element (for fidelity checks).
  function inspect(){const out={};for(const [key,o] of objects){if(!o.g.visible||o.ghost.visible)continue;const b=new THREE.Box3();
    o.parts.meshes.forEach(m=>{if(m.visible)b.expandByObject(m);});if(b.isEmpty())continue;
    const entry={min:b.min.toArray().map(v=>+v.toFixed(4)),max:b.max.toArray().map(v=>+v.toFixed(4)),type:o.e.type};
    const pv=o.parts.meshes.find(m=>m.userData.doorPivot);if(pv){const w=pv.getWorldPosition(new THREE.Vector3());entry.pivot={x:+w.x.toFixed(4),z:+w.z.toFixed(4),angle:+pv.rotation.y.toFixed(4)};}
    out[key]=entry;}return out;}
  return {load,setState,setPose,frameEnvelope,resize,inspect,
    setAuto(v){auto=v;controls.autoRotate=v;controls.autoRotateSpeed=.5;},setRoofVisible(v){roofVisible=!!v;},get roofVisible(){return roofVisible;},
    get pose(){return {position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov};},get visiblePieces(){return visiblePieces;},
    get objectCount(){return objects.size;},renderer,dispose:()=>cancelAnimationFrame(raf)};
}
