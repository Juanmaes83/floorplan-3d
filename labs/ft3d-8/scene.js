/* FT3D-8 Visual Lab — Three.js scene (RUBIK's vendored three 0.160.0, no second copy).
   Visual language inspired by Flat-to-3D "05 Schedule Build" (MIT, Sam1983Aing): pale site, low-poly trees,
   mesh fences, site hut, crane, timber frame, standing-seam roof, charred cladding. Own implementation:
   no donor code or assets copied.
   The scene NEVER decides what is built: it only renders blended frames produced by
   FloorPlanConstructionVisualState.frameAt (core FT3D-8). Geometry here is FIXTURE demo geometry, keyed by the
   fixture's elementIds, one sub-group per visual role (structure, envelope, cladding, finish...). */
import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';

const C={ground:0xeceae4,timber:0xd8b27a,concrete:0xbdbab2,panel:0xe9ddc5,clad:0x6b2a22,roof:0x6c7277,seam:0x4c5257,
  black:0x1c1c1e,glass:0xbcd7e0,white:0xf5f4f0,yellow:0xe6c24a,earth:0xa9825a,lawn:0x9fc06f,deck:0xb98a55,stone:0xe3d7c9,
  trunk:0x8a6b4f,leaf:0xa9c28c,steel:0x9aa1a7,pipeA:0xd9822b,pipeB:0x3f6fb4,lining:0xf2efe8,oak:0xc9a172};
const L=12,W=7,X0=-L/2,Z0=-W/2,SLAB=0.3,H=3,TOP=SLAB+H,RISE=3.2,RIDGE=TOP+RISE;
const mats=new Map();
function mat(color,extra={}){const k=color+JSON.stringify(extra);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color,roughness:.82,metalness:0,...extra}));return mats.get(k);}
function box(w,h,d,color,{x=0,y=0,z=0,origin='center',m}={}){
  const g=new THREE.BoxGeometry(w,h,d);if(origin==='bottom')g.translate(0,h/2,0);
  const mesh=new THREE.Mesh(g,m||mat(color));mesh.position.set(x,y,z);mesh.castShadow=true;mesh.receiveShadow=true;return mesh;}
function canvasTexture(draw,size=256){const c=document.createElement('canvas');c.width=c.height=size;draw(c.getContext('2d'),size);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.wrapS=t.wrapT=THREE.RepeatWrapping;t.anisotropy=4;return t;}
const gableTop=z=>TOP+RISE*(1-Math.abs(z)/(W/2));

/* Openings per wall in wall-local coords: u along the wall, v height above ground. */
const OPEN={
  'wall-n':[{u0:-4.6,u1:-3.0,v0:1.2,v1:2.6},{u0:-0.6,u1:0.5,v0:SLAB,v1:2.5,door:true},{u0:1.4,u1:3.8,v0:0.6,v1:2.7}],
  'wall-s':[{u0:-3.2,u1:-1.6,v0:1.2,v1:2.6},{u0:2.0,u1:3.6,v0:1.2,v1:2.6}],
  'wall-e':[{u0:-2.6,u1:2.6,v0:SLAB,v1:3.1,glazing:true}],
  'wall-w':[{u0:-0.8,u1:0.8,v0:1.3,v1:2.5}]
};
/* Wall frame: origin + direction of u and outward normal; gables have a sloped top. */
const WALL={
  'wall-n':{len:L,at:u=>[u,W/2],n:[0,1],top:()=>TOP},
  'wall-s':{len:L,at:u=>[-u,-W/2],n:[0,-1],top:()=>TOP},
  'wall-e':{len:W,at:u=>[L/2,-u],n:[1,0],top:u=>gableTop(u)},
  'wall-w':{len:W,at:u=>[-L/2,u],n:[-1,0],top:u=>gableTop(u)}
};
/* Vertical strips along a wall, cut around openings: the basic "piece" of envelope/cladding/lining. */
function strips(id,pitch,gap,offset,thick,color,{inner=false,bottom=SLAB}={}){
  const w=WALL[id],pieces=[],n=Math.ceil(w.len/pitch);
  for(let i=0;i<n;i++){
    const u0=-w.len/2+i*pitch,u1=Math.min(w.len/2,u0+pitch-gap),uc=(u0+u1)/2,top=w.top(uc)-(inner?0.05:0);
    let segs=[[bottom,top]];
    for(const o of OPEN[id])if(uc>o.u0&&uc<o.u1)segs=segs.flatMap(([a,b])=>[[a,Math.min(b,o.v0)],[Math.max(a,o.v1),b]]).filter(([a,b])=>b-a>0.05);
    const g=new THREE.Group(),[px,pz]=w.at(uc),off=inner?-offset:offset;
    g.position.set(px+w.n[0]*off,0,pz+w.n[1]*off);
    g.rotation.y=Math.atan2(w.n[0],w.n[1]);
    for(const [a,b] of segs){const m=box(u1-u0,b-a,thick,color,{y:a,origin:'bottom'});g.add(m);}
    if(segs.length)pieces.push(g);
  }
  return pieces;
}
function tree(x,z,s=1){
  const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);
  g.add(box(.35,3.2,.35,C.trunk,{origin:'bottom'}));
  const leaf=mat(C.leaf,{flatShading:true});
  for(const [dx,dy,dz,r] of [[0,4.2,0,1.9],[1.1,3.7,.4,1.3],[-1,3.8,-.3,1.4],[.2,5.2,-.2,1.3],[-.4,4.4,1,1.2]]){
    const m=new THREE.Mesh(new THREE.IcosahedronGeometry(r,1),leaf);m.position.set(dx,dy,dz);m.castShadow=true;g.add(m);}
  return g;
}

/* Builders: elementId -> {role: {pieces, how}}. how: drop | rise | grow | fade (piece-level choreography). */
function buildElements(){
  const E={};
  const fenceTex=canvasTexture((g,s)=>{g.clearRect(0,0,s,s);g.strokeStyle='rgba(90,92,96,.85)';g.lineWidth=2;
    for(let i=0;i<=s;i+=s/8){g.beginPath();g.moveTo(i,0);g.lineTo(i,s);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(s,i);g.stroke();}
    g.lineWidth=6;g.strokeRect(2,2,s-4,s-4);});
  const fenceMat=new THREE.MeshStandardMaterial({map:fenceTex,transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.9});
  // --- site: fence (perimeter with a gate gap) and hut
  {const pieces=[],FX=15,FZ=11,cz=1,pw=3;
    const run=(x0,z0,x1,z1)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.round(len/pw);for(let i=0;i<n;i++){
      const t=(i+.5)/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;if(Math.abs(x)<2.2&&z>cz+FZ-0.5)continue; // gate
      const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=Math.atan2(z1-z0,x1-x0)*-1;
      const p=new THREE.Mesh(new THREE.PlaneGeometry(len/n-.1,2).translate(0,1.1,0),fenceMat);g.add(p);
      g.add(box(.5,.18,.3,C.black,{x:-(len/n)/2+.1,origin:'bottom'}));pieces.push(g);}};
    run(-FX,cz-FZ,FX,cz-FZ);run(FX,cz-FZ,FX,cz+FZ);run(FX,cz+FZ,-FX,cz+FZ);run(-FX,cz+FZ,-FX,cz-FZ);
    E['site-fence']={site:{pieces,how:'rise'}};}
  {const g=new THREE.Group();g.position.set(-10.5,0,7.2);g.rotation.y=.25;
    g.add(box(5,2.5,2.4,C.white,{origin:'bottom',y:.15}));g.add(box(5.2,.18,2.6,C.black,{y:2.65,origin:'bottom'}));
    g.add(box(5,.15,2.4,C.black,{origin:'bottom'}));
    for(const x of [-1.6,-.4,.8]){const f=box(.8,.8,.05,C.black,{x,y:1.4,z:1.22});g.add(f);g.add(box(.62,.62,.06,C.glass,{x,y:1.49,z:1.23,m:mat(C.white)}));}
    g.add(box(.7,1.9,.06,C.black,{x:2,y:.2,z:1.22,origin:'bottom'}));
    g.add(box(1.1,1.6,1.1,0xc9d2d6,{x:2.7,z:1.6,origin:'bottom'}));
    E['site-hut']={site:{pieces:[g],how:'drop'}};}
  // --- excavation pit, excavator, spoil heap
  {const tex=canvasTexture((g,s)=>{g.fillStyle='#a9825a';g.fillRect(0,0,s,s);g.strokeStyle='rgba(80,55,30,.35)';g.lineWidth=3;for(let y=0;y<s;y+=10){g.beginPath();g.moveTo(0,y);g.lineTo(s,y+4);g.stroke();}});
    tex.repeat.set(3,2);const pieces=[];
    for(let i=0;i<7;i++){const m=new THREE.Mesh(new THREE.BoxGeometry(2,.04,W+2),new THREE.MeshStandardMaterial({map:tex,roughness:1}));
      m.position.set(X0-1+1+i*2,.005,0);m.receiveShadow=true;pieces.push(m);}
    E['excavation']={site:{pieces,how:'grow'}};}
  {const g=new THREE.Group();g.position.set(8.5,0,4.5);g.rotation.y=-.6;
    g.add(box(3.2,.8,2.4,C.black,{origin:'bottom'}));g.add(box(2.6,1.1,2.1,C.yellow,{y:.8,origin:'bottom'}));
    g.add(box(1.1,1.1,1.2,C.yellow,{x:-.6,y:1.9,z:.35,origin:'bottom'}));g.add(box(.05,.7,.9,C.glass,{x:-1.16,y:2.15,z:.35,origin:'bottom'}));
    const arm=new THREE.Group();arm.position.set(1,1.8,-.5);arm.name='arm';
    const a1=box(.4,3.4,.4,C.yellow,{origin:'bottom'});a1.rotation.z=-.9;arm.add(a1);
    const a2=new THREE.Group();a2.position.set(2.65,1.9,0);const b2=box(.35,2.6,.35,C.yellow,{origin:'bottom'});b2.rotation.z=2.6;a2.add(b2);
    const bucket=box(.8,.6,.8,C.black,{x:1.3,y:-2.3});a2.add(bucket);arm.add(a2);g.add(arm);
    E['excavator']={temporary:{pieces:[g],how:'drop',animate:(pos)=>{arm.rotation.z=Math.sin(pos*3)*.18;arm.parent.rotation.y=-.6+Math.sin(pos*1.3)*.25;}}};}
  {const m=new THREE.Mesh(new THREE.SphereGeometry(2.4,10,6),mat(C.earth,{flatShading:true}));m.scale.set(1.3,.45,1);m.position.set(9.5,0,-6.5);m.castShadow=true;
    E['spoil-heap']={temporary:{pieces:[m],how:'grow'}};}
  // --- foundation: footings then slab tiles
  {const pieces=[];
    for(const [w,d,x,z] of [[L+.6,.6,0,W/2],[L+.6,.6,0,-W/2],[.6,W,L/2,0],[.6,W,-L/2,0]])pieces.push(box(w,.5,d,C.concrete,{x,z,y:-.45,origin:'bottom'}));
    for(let i=0;i<4;i++)for(let j=0;j<2;j++)pieces.push(box(L/4+.02,SLAB,W/2+.02,C.concrete,{x:X0+L/8+i*L/4,z:Z0+W/4+j*W/2,origin:'bottom'}));
    E['foundation']={structure:{pieces,how:'rise'}};}
  // --- timber frame: posts, plates, rafters, ridge
  {const pieces=[],tim=C.timber,xs=[-6,-4,-2,0,2,4,6];
    for(const z of [W/2-.1,-W/2+.1])for(const x of xs)pieces.push(box(.2,H,.2,tim,{x,z,y:SLAB,origin:'bottom'}));
    for(const x of [L/2-.1,-L/2+.1])for(const z of [-1.75,0,1.75])pieces.push(box(.2,gableTop(z)-SLAB,.2,tim,{x,z,y:SLAB,origin:'bottom'}));
    for(const z of [W/2-.1,-W/2+.1])pieces.push(box(L+.2,.24,.24,tim,{z,y:TOP}));
    const slope=Math.atan2(RISE,W/2),raf=Math.hypot(W/2,RISE)+.55;
    for(const x of xs)for(const s of [1,-1]){const r=box(.16,.26,raf,tim,{x,y:TOP+RISE/2+.08,z:s*W/4+s*.18});r.rotation.x=s*slope;pieces.push(r);}
    pieces.push(box(L+.6,.3,.22,tim,{y:RIDGE+.05}));
    for(const x of [-4,0,4]){const t=box(.14,.2,W*.55,tim,{x,y:TOP+RISE*.45});pieces.push(t);}
    E['frame']={structure:{pieces,how:'drop'}};}
  // --- roof: standing-seam strips both slopes + ridge cap + skylight
  {const pieces=[],slope=Math.atan2(RISE,W/2),len=Math.hypot(W/2,RISE)+.7,n=13,sw=(L+1)/n;
    for(const s of [1,-1])for(let i=0;i<n;i++){
      const g=new THREE.Group();g.position.set(-(L+1)/2+sw*(i+.5),TOP+RISE/2+.32,s*(W/4+.26));g.rotation.x=s*slope;
      g.add(box(sw-.02,.12,len,C.roof));g.add(box(.05,.09,len,C.seam,{x:sw/2-.03,y:.09}));
      if(s===1&&i===8){g.add(box(1.1,.08,1.6,C.white,{y:.1,z:.1,m:mat(0xffffff,{emissive:0x555555})}));}
      pieces.push(g);}
    pieces.push(box(L+1.1,.16,.5,0x7a2f22,{y:RIDGE+.42}));
    E['roof']={envelope:{pieces,how:'drop'}};}
  // --- walls: envelope panels, charred cladding boards, interior lining
  for(const id of Object.keys(WALL)){
    E[id]={envelope:{pieces:strips(id,.6,.02,.16,.12,C.panel),how:'rise'},
      cladding:{pieces:strips(id,.2,.05,.27,.06,C.clad),how:'rise'},
      finish:{pieces:strips(id,1.2,.01,.22,.05,C.lining,{inner:true,bottom:SLAB+.05}),how:'fade'}};}
  // --- windows and doors (one piece per opening)
  {const pieces=[];
    for(const id of Object.keys(OPEN))for(const o of OPEN[id]){
      const w=WALL[id],uc=(o.u0+o.u1)/2,[px,pz]=w.at(uc),g=new THREE.Group();
      g.position.set(px+w.n[0]*.24,0,pz+w.n[1]*.24);g.rotation.y=Math.atan2(w.n[0],w.n[1]);
      const ww=o.u1-o.u0,hh=o.v1-o.v0,t=.09;
      if(o.door){g.add(box(ww,hh,.08,C.black,{y:o.v0,origin:'bottom'}));g.add(box(.18,hh-.3,.09,C.glass,{x:ww/2-.25,y:o.v0+.15,origin:'bottom',m:mat(0xe9e7e0)}));}
      else{g.add(box(ww,hh,.03,C.glass,{y:o.v0,origin:'bottom',m:new THREE.MeshStandardMaterial({color:C.glass,transparent:true,opacity:.38,roughness:.1,metalness:.1})}));
        for(const [fw,fh,fx,fy] of [[ww,t,0,o.v0],[ww,t,0,o.v1-t],[t,hh,-ww/2+t/2,o.v0],[t,hh,ww/2-t/2,o.v0]])g.add(box(fw,fh,.12,C.black,{x:fx,y:fy,origin:'bottom'}));
        const mull=o.glazing?[-ww/4,0,ww/4]:ww>2?[0]:[];for(const mx of mull)g.add(box(.07,hh,.12,C.black,{x:mx,y:o.v0,origin:'bottom'}));
        if(o.glazing)g.add(box(ww,.07,.12,C.black,{y:o.v0+hh*.62,origin:'bottom'}));}
      pieces.push(g);}
    // gable glazing frame lines above the east glazing
    E['windows']={build:{pieces,how:'drop'}};}
  // --- services (visible through openings before linings)
  {const pieces=[],pipe=(len,color,{x,y,z,axis})=>{const m=new THREE.Mesh(new THREE.CylinderGeometry(.07,.07,len,8),mat(color));m.position.set(x,y,z);
      if(axis==='x')m.rotation.z=Math.PI/2;if(axis==='z')m.rotation.x=Math.PI/2;m.castShadow=true;return m;};
    pieces.push(pipe(L-1.2,C.pipeA,{x:0,y:.55,z:-W/2+.45,axis:'x'}),pipe(L-1.2,C.pipeB,{x:0,y:.75,z:-W/2+.45,axis:'x'}));
    for(const x of [-4.5,-1.5,1.5,4.5])pieces.push(pipe(2.6,x%3?C.pipeA:C.pipeB,{x,y:1.9,z:-W/2+.45}));
    pieces.push(pipe(W-1.2,C.pipeB,{x:-L/2+.5,y:2.9,z:0,axis:'z'}),pipe(L-1.2,C.pipeA,{x:0,y:2.95,z:0,axis:'x'}));
    pieces.push(box(1.2,.9,.6,0xdedad2,{x:3.5,z:-W/2+.6,y:SLAB,origin:'bottom'}),box(.7,1.9,.7,0xdedad2,{x:-5,z:-W/2+.6,y:SLAB,origin:'bottom'}));
    E['services-core']={services:{pieces,how:'grow'}};}
  // --- interior oak floor
  {const pieces=[];for(let i=0;i<10;i++)pieces.push(box((L-.6)/10-.02,.04,W-.6,C.oak,{x:X0+.3+(L-.6)/20+i*(L-.6)/10,y:SLAB,origin:'bottom'}));
    E['interior-floor']={build:{pieces,how:'grow'}};}
  // --- temporary works: tower crane and scaffold
  {const g=new THREE.Group();g.position.set(-10,0,-7.5);
    g.add(box(2.4,.6,2.4,C.concrete,{origin:'bottom'}));
    const mastH=15;for(const [dx,dz] of [[-.45,-.45],[.45,-.45],[-.45,.45],[.45,.45]])g.add(box(.12,mastH,.12,C.yellow,{x:dx,z:dz,y:.6,origin:'bottom'}));
    for(let y=1;y<mastH;y+=1.2){g.add(box(1,.08,.08,C.yellow,{y:y,z:.45}));g.add(box(1,.08,.08,C.yellow,{y:y,z:-.45}));g.add(box(.08,.08,1,C.yellow,{y:y+.6,x:.45}));g.add(box(.08,.08,1,C.yellow,{y:y+.6,x:-.45}));}
    const top=new THREE.Group();top.position.y=mastH+.6;top.name='slew';
    top.add(box(1.4,1.2,1.4,C.yellow,{origin:'bottom'}));top.add(box(1,.9,1,C.glass,{x:.6,y:.2,z:.7,origin:'bottom'}));
    top.add(box(19,.5,.6,C.yellow,{x:8.5,y:1.3}));top.add(box(6,.45,.6,C.yellow,{x:-3.5,y:1.3}));
    top.add(box(1.6,1.2,1,0x3a3a3c,{x:-5.6,y:.7,origin:'bottom'}));top.add(box(.1,3,.1,C.yellow,{y:1.2,origin:'bottom'}));
    const hook=new THREE.Group();hook.position.set(11,1.1,0);hook.add(box(.03,6,.03,C.black,{y:-3}));hook.add(box(.4,.4,.4,C.black,{y:-6.2}));top.add(hook);
    g.add(top);
    E['crane']={temporary:{pieces:[g],how:'rise',animate:(pos)=>{top.rotation.y=.95+Math.sin(pos*.35)*.55;}}};}
  {const pieces=[],tube=C.steel;
    for(const s of [1,-1]){const z=s*(W/2+1.05);
      for(let x=-L/2;x<=L/2+.01;x+=2){const g=new THREE.Group();g.position.set(x,0,z);
        g.add(box(.07,TOP+1.2,.07,tube,{origin:'bottom'}));g.add(box(.07,TOP+1.2,.07,tube,{z:s*.7,origin:'bottom'}));
        if(x<L/2-.01)for(const y of [1.2,2.4,3.6]){g.add(box(2,.06,.06,tube,{x:1,y}));g.add(box(2,.05,.75,0xb48b58,{x:1,y:y+.05,z:s*.35}));}
        pieces.push(g);}}
    E['scaffold']={temporary:{pieces,how:'rise'}};}
  // --- external works
  {const pieces=[];for(let i=0;i<9;i++)pieces.push(box(3.2,.12,.2,C.deck,{x:L/2+1.9,y:.25,z:-W/2+.2+i*.85,origin:'bottom'}));
    for(const [x,z] of [[L/2+.7,-W/2],[L/2+.7,W/2],[L/2+3.3,-W/2],[L/2+3.3,W/2]])pieces.push(box(.15,.25,.15,C.deck,{x,z,origin:'bottom'}));
    E['deck']={build:{pieces,how:'grow'}};}
  {const pieces=[];for(let i=0;i<8;i++)pieces.push(box(1.3,.08,.75,C.stone,{x:-.1+Math.sin(i*.7)*.6,z:W/2+1.1+i*1.15,origin:'bottom'}));
    E['path']={build:{pieces,how:'drop'}};}
  {const tex=canvasTexture((g,s)=>{for(let i=0;i<8;i++){g.fillStyle=i%2?'#a2c373':'#97b968';g.fillRect(0,i*s/8,s,s/8);}});tex.repeat.set(1,6);
    const m=new THREE.Mesh(new THREE.BoxGeometry(29,.02,21),new THREE.MeshStandardMaterial({map:tex,roughness:1}));m.position.set(0,.012,1);m.receiveShadow=true;
    E['lawn']={build:{pieces:[m],how:'grow'}};}
  return E;
}

const ease=t=>t<=0?0:t>=1?1:t*t*(3-2*t);
function applyPiece(p,how,e){
  const o=p.userData.base||(p.userData.base={y:p.position.y,sx:p.scale.x,sy:p.scale.y,sz:p.scale.z});
  p.visible=e>0.001;if(!p.visible)return;
  if(how==='drop'){p.position.y=o.y+(1-e)*2.4;p.scale.set(o.sx,o.sy,o.sz);}
  else if(how==='rise'){p.position.y=o.y;p.scale.set(o.sx,o.sy*Math.max(.001,e),o.sz);}
  else if(how==='grow'){p.position.y=o.y;p.scale.set(o.sx*Math.max(.001,e),o.sy*Math.max(.001,e),o.sz*Math.max(.001,e));}
  else {p.position.y=o.y;p.scale.set(o.sx,o.sy*Math.max(.001,e),o.sz);}
}

export function createScene(canvas){
  const renderer=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});
  renderer.setPixelRatio(Math.min(2,window.devicePixelRatio||1));
  renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  const scene=new THREE.Scene();scene.background=new THREE.Color(0xf1efea);scene.fog=new THREE.Fog(0xf1efea,70,140);
  const camera=new THREE.PerspectiveCamera(32,1,.5,400);
  scene.add(new THREE.HemisphereLight(0xffffff,0xd9d4c8,1.25));
  const sun=new THREE.DirectionalLight(0xffffff,1.9);sun.position.set(18,30,14);sun.castShadow=true;
  sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-28,right:28,top:28,bottom:-28,near:1,far:90});sun.shadow.bias=-.0005;scene.add(sun);
  const ground=new THREE.Mesh(new THREE.PlaneGeometry(400,400),mat(C.ground));ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;scene.add(ground);
  const grid=new THREE.GridHelper(80,40,0xd7d3ca,0xe2dfd7);grid.position.y=.002;scene.add(grid);
  // Static decor (not part of the plan): trees outside the fence.
  for(const [x,z,s] of [[-19,-6,1.1],[-17,9,.9],[19,-7,1.2],[20,6,1],[-6,-15,1.15],[8,-15,1],[3,-17,.8]])scene.add(tree(x,z,s));
  const elements=buildElements(),roots=new Map();
  for(const [id,roles] of Object.entries(elements)){
    const root=new THREE.Group();root.name=id;
    for(const [role,r] of Object.entries(roles)){const g=new THREE.Group();g.name=id+':'+role;r.pieces.forEach(p=>g.add(p));r.group=g;root.add(g);}
    scene.add(root);roots.set(id,root);
  }
  const controls=new OrbitControls(camera,canvas);controls.target.set(0,2.4,0);controls.enableDamping=true;controls.maxPolarAngle=Math.PI*.49;
  controls.minDistance=10;controls.maxDistance=110;
  const VIEWS={iso:[30,21,30],front:[2,6,34],top:[0,58,.01],auto:[30,21,30]};
  let mode='auto',flight=null;
  const setView=name=>{mode=name;controls.autoRotate=name==='auto';controls.autoRotateSpeed=.6;if(name==='free')return;
    flight={from:camera.position.clone(),to:new THREE.Vector3(...VIEWS[name]),t:0};};
  camera.position.set(...VIEWS.iso);setView('auto');
  controls.addEventListener('start',()=>{flight=null;if(mode!=='free'){mode='free';controls.autoRotate=false;onModeChange&&onModeChange(mode);}});
  let onModeChange=null;
  const resize=()=>{const w=canvas.clientWidth||1,h=canvas.clientHeight||1;renderer.setSize(w,h,false);camera.aspect=w/h;
    camera.fov=w/h<1?52:32;camera.updateProjectionMatrix();};
  /* Blended visual state: for every element, presence (0..1) and per-role progress (0..1),
     interpolated between two authoritative day frames. At whole days it equals the core frame exactly. */
  const stats={visiblePieces:0};
  function setState(blend,pos){
    let vis=0;
    for(const [id,roles] of Object.entries(elements)){
      const root=roots.get(id),s=blend.get(id);
      if(!s||s.presence<=0.001){root.visible=false;continue;}
      root.visible=true;
      const removal=s.removal;root.scale.set(1,1-removal*.97,1);root.position.y=-removal*.2;
      for(const [role,r] of Object.entries(roles)){
        const p=role==='temporary'?s.presence:(s.roles[role]??0);
        if(role==='temporary'){r.group.visible=p>0.001;r.group.scale.set(1,Math.max(.001,ease(p)),1);if(r.animate)r.animate(pos);
          if(r.group.visible)vis+=r.pieces.length;continue;}
        r.group.visible=p>0.001;if(!r.group.visible)continue;
        const n=r.pieces.length;
        r.pieces.forEach((piece,i)=>{const e=ease(Math.min(1,Math.max(0,p*n-i)));applyPiece(piece,r.how,e);if(piece.visible)vis++;});
      }
    }
    stats.visiblePieces=vis;
  }
  let raf=0;const tick=()=>{raf=requestAnimationFrame(tick);
    if(flight){flight.t=Math.min(1,flight.t+.035);camera.position.lerpVectors(flight.from,flight.to,ease(flight.t));if(flight.t>=1)flight=null;}
    controls.update();renderer.render(scene,camera);};
  resize();tick();
  window.addEventListener('resize',resize);
  return {setState,setView,resize,stats,elementIds:Object.keys(elements),
    get mode(){return mode;},set onModeChange(fn){onModeChange=fn;},renderer,dispose:()=>cancelAnimationFrame(raf)};
}
