/* FT3D-8 fidelity lab — renders a REAL RUBIK project from FloorPlanConstructionProject.inventory().
   No geometry is computed here: every position, span, thickness, height, sill, head, polygon, elevation and material
   comes from the inventory (FloorPlanCore.geometry / FloorPlanRoof / FloorPlanBuilding). The mesh assembly mirrors
   the editor's own 3D rules (index.html: wallBox, glazing, door leaf, sliding panes, ShapeGeometry floors/roof) so
   that both can be compared from the same camera. Those rules are inside index.html and are not exported; see
   docs/product/ft3d-8-auditoria-autoridades-2026-11-05.md (blocker "no mesh contract").
   Illustrative only: the "raw" colour before a finish layer, ghosts for elements without a task, and the growth. */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {buildIllustrative} from './illustrative-props.js';

const RAW='#cfc9bf',GHOST='#7a8a99',DEMOLISH='#b23a2a',PREVIEW='#0f7f95';
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
  // Outside root (never part of inspect() or of the model): the initial footprint and the selection outlines.
  const foot=new THREE.Group();foot.visible=false;scene.add(foot);
  const marks=new THREE.Group();scene.add(marks);
  const footMat=new THREE.MeshBasicMaterial({color:0x9aa7ad,transparent:true,opacity:.55,depthWrite:false});
  const footLine=new THREE.LineBasicMaterial({color:0x2b3034});
  const markLine=new THREE.LineBasicMaterial({color:0x1f5a66,depthTest:false,transparent:true,opacity:.95});
  let objects=new Map(),roofVisible=true,frame={origin:{x:0,y:0}},auto=false,userMoved=false;
  const glass=new THREE.MeshPhysicalMaterial({color:0xcfe6ef,roughness:.05,transparent:true,opacity:.28,depthWrite:false,side:THREE.DoubleSide});
  const frameMat=mat('#5d6166',{roughness:.5,metalness:.4});
  const capMat=mat('#34312d',{roughness:.9});
  function clear(){root.traverse(o=>o.geometry?.dispose());root.clear();objects=new Map();
    for(const grp of [foot,marks]){grp.traverse(o=>o.geometry?.dispose());grp.clear();}}
  // World mapping identical to the editor: x=(xmm-OX)/1000, z=(ymm-OY)/1000, levels lifted by elevation.
  function load(inventory,illustrative=[]){
    clear();lastStates=null;frame={origin:inventory.origin};
    const levels=new Map(inventory.levels.map(l=>[l.levelId,l]));
    const wx=(x,l)=>(x+l.offsetMm.x-frame.origin.x)/1000,wz=(y,l)=>(y+l.offsetMm.y-frame.origin.y)/1000;
    for(const e of inventory.elements){
      if(!e.representable)continue;
      const l=levels.get(e.levelId),g=new THREE.Group();g.position.y=l.elevationMm/1000;g.name=e.key;
      const parts={appear:[],layer:[],meshes:[]};
      const keep=(m,{color=null,layer=false}={})=>{m.castShadow=m.receiveShadow=true;m.userData.base={y:m.position.y,sy:m.scale.y};m.userData.final=color;parts.meshes.push(m);(layer?parts.layer:parts.appear).push(m);return m;};
      if(e.type==='wall'){
        // Footprint of the REAL walls (same pieces, flat): shows where the house will stand before anything is built.
        if(l.elevationMm===Math.min(...inventory.levels.map(x=>x.elevationMm)))for(const p of e.pieces){
          const fp=new THREE.Mesh(new THREE.PlaneGeometry(p.spanMm/1000,p.thicknessMm/1000),footMat);fp.rotation.x=-Math.PI/2;
          const holder=new THREE.Group();holder.position.set(wx(p.center[0],l),.004,wz(p.center[1],l));holder.rotation.y=-p.angle;holder.add(fp);
          const edge=new THREE.LineSegments(new THREE.EdgesGeometry(fp.geometry),footLine);edge.rotation.x=-Math.PI/2;holder.add(edge);foot.add(holder);}
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
    loadIllustrative(inventory,illustrative);
  }
  // Illustrative site resources linked by the plan (never project geometry): built around the project's envelope.
  let animators=[];
  // The project's own envelope in world metres (x, z on the ground; top = highest level + 3 m).
  function envBox(inventory){
    const env=inventory.levels.reduce((a,l)=>({x0:Math.min(a.x0,l.envelope.x+l.offsetMm.x),y0:Math.min(a.y0,l.envelope.y+l.offsetMm.y),x1:Math.max(a.x1,l.envelope.x+l.envelope.w+l.offsetMm.x),y1:Math.max(a.y1,l.envelope.y+l.envelope.h+l.offsetMm.y)}),{x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
    return {x0:(env.x0-frame.origin.x)/1000,x1:(env.x1-frame.origin.x)/1000,z0:(env.y0-frame.origin.y)/1000,z1:(env.y1-frame.origin.y)/1000,top:Math.max(...inventory.levels.map(l=>l.elevationMm))/1000+3};
  }
  function loadIllustrative(inventory,list){
    animators=[];if(!list.length)return;
    const box=envBox(inventory);
    for(const r of list){const {pieces,animate}=buildIllustrative(r.kind,box);if(!pieces.length)continue;
      const g=new THREE.Group();g.name=r.key;g.userData.illustrative=true;for(const p of pieces){p.userData.base={y:p.position.y,sy:p.scale.y};g.add(p);}
      const ghost=new THREE.Group();ghost.visible=false;g.add(ghost);root.add(g);
      objects.set(r.key,{e:{key:r.key,type:'illustrative',kind:r.kind},g,parts:{appear:pieces,layer:[],meshes:pieces},ghost});if(animate)animators.push(animate);}
  }
  const tintable=x=>x&&x!==glass&&x!==frameMat&&x!==capMat&&!x.isMeshPhysicalMaterial&&x.color;
  const tint=(m,final,k)=>{if(!final)return;m.traverse(o=>{if(!o.isMesh)return;for(const x of [].concat(o.material))if(tintable(x))x.color.set(RAW).lerp(new THREE.Color(final),k);});};
  /* state: key -> {mode:'scheduled'|'pre-existing'|'unscheduled', build:0..1, layer:0..1|null, removal:0..1, present:0..1} */
  let visiblePieces=0;
  let lastStates=null,lastPos=0;
  function setState(states,pos=0){
    lastStates=states;lastPos=pos;
    for(const a of animators)a(pos);
    visiblePieces=0;
    for(const [key,o] of objects){
      const s=states.get(key)||{mode:'unscheduled'};
      if(o.g.userData.roof&&!roofVisible){o.g.visible=false;continue;}
      if(s.mode==='unscheduled'){o.g.visible=true;o.parts.meshes.forEach(m=>m.visible=false);o.ghost.visible=true;continue;}
      o.ghost.visible=false;
      const present=s.present??1;o.g.visible=present>0.001;if(!o.g.visible)continue;
      const b=ease(s.build??1),rem=ease(s.removal??0);
      // Roofs and slabs are thin: growing their height would show them complete on day one and hide the works below.
      // While their task runs they are drawn translucent (opacity follows the elapsed share of the task, illustrative);
      // when it ends they get back their own materials untouched.
      const fade=(o.e.type==='roof'||o.e.type==='slab')&&b<.999;
      if(o.e.type==='roof'||o.e.type==='slab')o.parts.meshes.forEach(m=>m.traverse(x=>{if(!x.isMesh)return;
        if(!x.userData.solid){x.userData.solid=x.material;x.userData.fadeMat=[].concat(x.material).map(mm=>{const c=mm.clone();c.transparent=true;c.depthWrite=false;return c;});}
        if(fade){x.material=Array.isArray(x.userData.solid)?x.userData.fadeMat:x.userData.fadeMat[0];for(const mm of x.userData.fadeMat)mm.opacity=.12+.7*b;}
        else x.material=x.userData.solid;}));
      o.parts.appear.forEach((m,i)=>{const n=o.parts.appear.length,k=fade?1:ease(Math.min(1,Math.max(0,b*n-i)));m.visible=(fade?b:k)>0.001;if(!m.visible)return;
        m.scale.y=m.userData.base.sy*Math.max(.001,k)*(1-rem*.98);m.position.y=m.userData.base.y;visiblePieces++;});
      const layerK=s.layer===null||s.layer===undefined?1:s.layer;
      o.parts.meshes.forEach(m=>{if(m.userData.final)tint(m,m.userData.final,layerK);});
      if(rem>0&&o.e.type!=='illustrative')o.parts.meshes.forEach(m=>m.traverse(x=>{if(x.isMesh)for(const y of [].concat(x.material))if(tintable(y))y.color.lerp(new THREE.Color(DEMOLISH),rem*.6);}));
    }
    applyPreview();
  }
  /* OBR-02 · fantasma de la SIGUIENTE tarea planificada: las aristas del propio elemento (las mismas del estado «sin
     tarea»), en otro color y visibles a través de lo construido. Un elemento que todavía no existe se ve solo como
     contorno; uno que ya existe (p. ej. un acabado) se ve con el contorno encima. Ilustrativo: es plan, no obra. */
  const previewMat=new THREE.LineBasicMaterial({color:PREVIEW,transparent:true,opacity:.95,depthTest:false});
  let previewKeys=new Set(),previewShown=0;
  function applyPreview(){
    previewShown=0;
    for(const [key,o] of objects){
      const on=previewKeys.has(key)&&!(o.g.userData.roof&&!roofVisible);
      o.ghost.children.forEach(l=>{if(!l.userData.baseMat)l.userData.baseMat=l.material;l.material=on?previewMat:l.userData.baseMat;l.renderOrder=on?5:0;});
      if(!on)continue;
      if(!o.g.visible){o.g.visible=true;o.parts.meshes.forEach(m=>m.visible=false);}
      o.ghost.visible=true;previewShown++;
    }
  }
  // Cambiar la vista previa vuelve a aplicar el último estado, así lo que se mostró como fantasma vuelve a ser lo que era.
  function setPreview(keys=[]){previewKeys=new Set(keys);if(lastStates)setState(lastStates,lastPos);else applyPreview();return previewShown;}
  // offset (NDC): where the target is drawn on screen. It shifts the PROJECTION (setViewOffset), not the world: the camera
  // keeps orbiting around the house's own centre and the house stays in the free part of the viewer at every angle.
  let viewOffset=null;
  const applyOffset=()=>{const [w,h]=fixedSize||[canvas.clientWidth||1,canvas.clientHeight||1];
    if(viewOffset&&!fixedSize)camera.setViewOffset(w,h,-viewOffset.x*w/2,viewOffset.y*h/2,w,h);else camera.clearViewOffset();};
  const setPose=({position,target,fov,offset=null})=>{auto=false;userMoved=false;controls.autoRotate=false;viewOffset=offset;const d=controls.enableDamping;controls.enableDamping=false;camera.position.fromArray(position);controls.target.fromArray(target);if(fov){camera.fov=fov;}applyOffset();camera.updateProjectionMatrix();controls.update();controls.enableDamping=d;};
  // Default framing from the project's own envelope (no fixed demo camera).
  function frameEnvelope(inventory,view='iso'){
    const env=inventory.levels.reduce((a,l)=>({x0:Math.min(a.x0,l.envelope.x+l.offsetMm.x),y0:Math.min(a.y0,l.envelope.y+l.offsetMm.y),x1:Math.max(a.x1,l.envelope.x+l.envelope.w+l.offsetMm.x),y1:Math.max(a.y1,l.envelope.y+l.envelope.h+l.offsetMm.y)}),{x0:Infinity,y0:Infinity,x1:-Infinity,y1:-Infinity});
    const top=Math.max(...inventory.levels.map(l=>l.elevationMm))/1000+3,span=Math.hypot(env.x1-env.x0,env.y1-env.y0)/1000;
    const cx=((env.x0+env.x1)/2-frame.origin.x)/1000,cz=((env.y0+env.y1)/2-frame.origin.y)/1000,d=span*1.25+6;
    const dirs={iso:[.62,.55,.72],front:[0,.28,1],top:[0,1,.001],auto:[.62,.55,.72]},v=new THREE.Vector3(...dirs[view]).normalize();
    return {position:[cx+v.x*d,top/2+v.y*d,cz+v.z*d],target:[cx,top/3,cz],fov:45};
  }
  // Presentation framing (the evolution view): closer than frameEnvelope and, on wide screens, shifted so the house sits
  // right of the headline. frameEnvelope stays the neutral framing used by the fidelity comparison with the editor.
  // With illustrative site resources (fence 4 m around the envelope, crane outside it) every framing opens the same way.
  const siteOpen=()=>[...objects.keys()].some(k=>k.startsWith('illustrative/'))?1.35:1;
  /* Presentation framing (GD-UX-01): the house is CENTRED in the part of the viewer the headline leaves free, and the
     distance is the closest at which a vertical cylinder around the house (+ 4.3 m when the plan has site resources:
     fence ring at 4 m, hut and crane base) fits that part with the viewer's real aspect, so nothing standing on the
     ground is cut at any angle of the AUTO orbit. Only the crane's mast and jib may leave the frame (as in the reference).
     frameEnvelope stays the neutral framing used by the fidelity comparison with the editor. */
  const fitCam=new THREE.PerspectiveCamera(45,1,.1,4000);
  // standing=true (ISO button): frame what stands at the current moment (site resources only if one is visible now).
  const siteStanding=()=>[...objects].some(([k,o])=>k.startsWith('illustrative/')&&o.g.visible&&!o.ghost.visible);
  function presentationPose(inventory,view='iso',reserve=null,{standing=false}={}){
    const b=envBox(inventory),site=standing?siteStanding():siteOpen()>1,m=site?4.3:.3,orbit=view==='iso'||view==='auto';
    const cx=(b.x0+b.x1)/2,cz=(b.z0+b.z1)/2,top=b.top-(site?0:1.2),pts=[];
    if(orbit){const R=Math.hypot(b.x1-b.x0+2*m,b.z1-b.z0+2*m)/2;for(let i=0;i<24;i++){const a=i/24*Math.PI*2;for(const y of [0,top])pts.push(new THREE.Vector3(cx+Math.cos(a)*R,y,cz+Math.sin(a)*R));}}
    else for(const x of [b.x0-m,b.x1+m])for(const z of [b.z0-m,b.z1+m])for(const y of [0,top])pts.push(new THREE.Vector3(x,y,z));
    const w=Math.max(1,fixedSize?.[0]||canvas.clientWidth||1),h=Math.max(1,fixedSize?.[1]||canvas.clientHeight||1),aspect=w/h;
    const wide=aspect>1.6&&w>760,res=reserve||{left:wide?.3:0,top:wide?0:.26};
    // Usable window in normalised device coordinates (x right, y up), with a safety margin; its centre (wx, wy).
    const win={x0:-1+2*Math.min(.5,res.left||0)+.04,x1:.95,y0:-.92,y1:1-2*Math.min(.5,res.top||0)-.05},wx=(win.x0+win.x1)/2,wy=(win.y0+win.y1)/2;
    const dirs={iso:[.62,.55,.72],front:[0,.28,1],top:[0,1,.001],auto:[.62,.55,.72]},dir=new THREE.Vector3(...(dirs[view]||dirs.iso)).normalize();
    fitCam.fov=45;fitCam.aspect=aspect;fitCam.updateProjectionMatrix();fitCam.up.set(0,1,0);
    const target=new THREE.Vector3(cx,top*.42,cz);
    const fits=d=>{fitCam.position.copy(target).addScaledVector(dir,d);fitCam.lookAt(target);fitCam.updateMatrixWorld();
      // The view offset draws the target at the window centre (wx, wy): test every point with that offset (exact).
      for(const p of pts){const q=p.clone().project(fitCam);if(q.z>1||q.x+wx<win.x0||q.x+wx>win.x1||q.y+wy<win.y0||q.y+wy>win.y1)return false;}return true;};
    let lo=1,hi=800;for(let i=0;i<36;i++){const mid=(lo+hi)/2;fits(mid)?hi=mid:lo=mid;}const d=hi;fits(d);
    return {position:target.clone().addScaledVector(dir,d).toArray(),target:target.toArray(),fov:45,offset:{x:wx,y:wy}};
  }
  let fixedSize=null;
  const resize=()=>{const [w,h]=fixedSize||[canvas.clientWidth||1,canvas.clientHeight||1];renderer.setSize(w,h,false);camera.aspect=w/h;applyOffset?.();camera.updateProjectionMatrix();};
  // Recording: render at an exact pixel size (e.g. 1280x720) without touching the page layout.
  const setRenderSize=(w,h)=>{fixedSize=[w,h];renderer.setPixelRatio(1);resize();};
  const releaseRenderSize=()=>{fixedSize=null;renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));resize();};
  // Deterministic orbit (no damping) around the project's own envelope, for the video.
  const orbitPose=(inventory,angle,{lift=.55,scale=1}={})=>{const p=frameEnvelope(inventory,'iso'),t=new THREE.Vector3(...p.target),v=new THREE.Vector3(...p.position).sub(t);
    const k=scale*siteOpen(),r=Math.hypot(v.x,v.z)*k,base=Math.atan2(v.x,v.z)+angle;return {position:[t.x+Math.sin(base)*r,t.y+v.y*k*lift/.55,t.z+Math.cos(base)*r],target:p.target,fov:p.fov};};
  const renderNow=()=>{renderer.render(scene,camera);};
  controls.addEventListener('start',()=>{auto=false;controls.autoRotate=false;userMoved=true;});
  // While a video is encoded frame by frame the recorder renders explicitly (renderNow): the live loop is suspended.
  let raf=0,suspended=false;const tick=()=>{raf=requestAnimationFrame(tick);if(suspended)return;controls.update();renderer.render(scene,camera);};resize();tick();window.addEventListener('resize',resize);
  // The viewer's box follows the layout (window, mode, sections): re-size the renderer and tell the app (re-framing).
  let onResize=null,roT=0;if(typeof ResizeObserver!=='undefined')new ResizeObserver(()=>{if(fixedSize)return;resize();clearTimeout(roT);roT=setTimeout(()=>onResize?.(),120);}).observe(canvas);
  // Read-only structural inspection: world-space bounding box of every rendered element (for fidelity checks).
  function inspect(){const out={};for(const [key,o] of objects){if(!o.g.visible||o.ghost.visible)continue;const b=new THREE.Box3();
    o.parts.meshes.forEach(m=>{if(m.visible)b.expandByObject(m);});if(b.isEmpty())continue;
    const entry={min:b.min.toArray().map(v=>+v.toFixed(4)),max:b.max.toArray().map(v=>+v.toFixed(4)),type:o.e.type};
    const pv=o.parts.meshes.find(m=>m.userData.doorPivot);if(pv){const w=pv.getWorldPosition(new THREE.Vector3());entry.pivot={x:+w.x.toFixed(4),z:+w.z.toFixed(4),angle:+pv.rotation.y.toFixed(4)};}
    out[key]=entry;}return out;}
  // Outline (selection) of the given elements, drawn over the model without touching its geometry or materials.
  function highlight(keys=[]){
    marks.traverse(o=>o.geometry?.dispose());marks.clear();
    for(const k of keys){const o=objects.get(k);if(!o||!o.g.visible)continue;o.g.updateWorldMatrix(true,true);
      o.g.traverse(m=>{if(!m.isMesh||!m.visible)return;const ln=new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry,30),markLine);
        ln.applyMatrix4(m.matrixWorld);ln.renderOrder=10;marks.add(ln);});}
    return marks.children.length;
  }
  // Element under a screen point (client coordinates), or null. Read-only: no association is created.
  const ray=new THREE.Raycaster();
  function pick(clientX,clientY){
    const r=canvas.getBoundingClientRect();if(!r.width||!r.height)return null;
    ray.setFromCamera(new THREE.Vector2((clientX-r.left)/r.width*2-1,-(clientY-r.top)/r.height*2+1),camera);
    const hits=ray.intersectObjects(root.children,true).filter(h=>{for(let o=h.object;o;o=o.parent)if(!o.visible)return false;return true;});
    for(const h of hits)for(let o=h.object;o&&o!==root;o=o.parent)if(o.name&&objects.has(o.name)&&!o.userData.ghostOnly)return o.name;
    return null;
  }
  // Read-only: normalised screen box (NDC, -1..1) of what stands now among the keys with this prefix (framing checks).
  function screenBounds(prefix='project/'){
    const all=new THREE.Box3(),tmp=new THREE.Box3();let any=false;
    for(const [k,o] of objects){if(!k.startsWith(prefix)||!o.g.visible||o.ghost.visible)continue;tmp.setFromObject(o.g);if(tmp.isEmpty())continue;all.union(tmp);any=true;}
    if(!any)return null;camera.updateMatrixWorld();const r={x0:Infinity,x1:-Infinity,y0:Infinity,y1:-Infinity};
    for(const x of [all.min.x,all.max.x])for(const y of [all.min.y,all.max.y])for(const z of [all.min.z,all.max.z]){const q=new THREE.Vector3(x,y,z).project(camera);r.x0=Math.min(r.x0,q.x);r.x1=Math.max(r.x1,q.x);r.y0=Math.min(r.y0,q.y);r.y1=Math.max(r.y1,q.y);}
    return r;
  }
  return {get userMoved(){return userMoved;},screenBounds,set onResize(fn){onResize=fn;},get size(){return [canvas.clientWidth,canvas.clientHeight];},
    load,setState,highlight,pick,presentationPose,setFootprint(v){foot.visible=!!v;},get footprintVisible(){return foot.visible;},setPose,frameEnvelope,resize,inspect,setRenderSize,releaseRenderSize,orbitPose,renderNow,canvas,setSuspended(v){suspended=!!v;},
    setAuto(v){auto=v;controls.autoRotate=v;controls.autoRotateSpeed=.5;},setRoofVisible(v){roofVisible=!!v;},get roofVisible(){return roofVisible;},
    get pose(){return {position:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov,offset:viewOffset};},get visiblePieces(){return visiblePieces;},
    get objectCount(){return objects.size;},renderer,dispose:()=>cancelAnimationFrame(raf),setPreview,get preview(){return {keys:[...previewKeys],shown:previewShown};}};
}
