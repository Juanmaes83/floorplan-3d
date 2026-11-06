/* FT3D-8 · illustrative site resources (Gate D, owner decision): fence, site hut, tower crane and scaffold, drawn ONLY
   when a plan task links them explicitly («illustrative/<kind>», see construction-project-adapter ILLUSTRATIVE).
   They are labelled illustrations, not project geometry: sizes and positions derive from the project's own envelope
   (always outside the footprint) and say nothing about how the site will really be organised.
   Same procedural language as the FT3D-8 demo (labs/ft3d-8/scene.js, own code, no external models or textures). */
import * as THREE from 'three';

const C={yellow:0xe0b12c,concrete:0xb9b5ad,black:0x2b3034,white:0xf3f1ec,steel:0x8a9196,plank:0xb48b58,glass:0xcfe6ef};
const mats=new Map();
const mat=(c,o={})=>{const k=c+JSON.stringify(o);if(!mats.has(k))mats.set(k,new THREE.MeshStandardMaterial({color:c,roughness:.85,...o}));return mats.get(k);};
const box=(w,h,d,c,{x=0,y=0,z=0,bottom=false}={})=>{const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(c));if(bottom)m.geometry.translate(0,h/2,0);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;return m;};
let fenceMat=null;
function fenceMaterial(){
  if(fenceMat)return fenceMat;
  const c=document.createElement('canvas');c.width=c.height=128;const g=c.getContext('2d');g.strokeStyle='rgba(80,86,90,.85)';g.lineWidth=2;
  for(let i=0;i<=128;i+=16){g.beginPath();g.moveTo(i,0);g.lineTo(i,128);g.stroke();g.beginPath();g.moveTo(0,i);g.lineTo(128,i);g.stroke();}
  g.lineWidth=5;g.strokeRect(2,2,124,124);
  const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;
  return fenceMat=new THREE.MeshStandardMaterial({map:t,transparent:true,alphaTest:.3,side:THREE.DoubleSide,roughness:.9});
}
/* env: {x0,z0,x1,z1,top} in world metres (the project's envelope). Returns the pieces that grow ('rise') in sequence. */
export function buildIllustrative(kind,env){
  const cx=(env.x0+env.x1)/2,cz=(env.z0+env.z1)/2,span=Math.hypot(env.x1-env.x0,env.z1-env.z0);
  const pieces=[];let animate=null;
  if(kind==='site-fence'){
    const m=4,X0=env.x0-m,X1=env.x1+m,Z0=env.z0-m,Z1=env.z1+m,pw=2.6;
    const run=(x0,z0,x1,z1,gate)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(len/pw));
      for(let i=0;i<n;i++){const t=(i+.5)/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;if(gate&&Math.abs(t-.5)<.12)continue;
        const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=-Math.atan2(z1-z0,x1-x0);
        g.add(new THREE.Mesh(new THREE.PlaneGeometry(len/n-.08,1.9).translate(0,1.05,0),fenceMaterial()));
        g.add(box(.45,.16,.28,C.black,{x:-(len/n)/2+.1,bottom:true}));pieces.push(g);}};
    run(X0,Z0,X1,Z0);run(X1,Z0,X1,Z1);run(X1,Z1,X0,Z1,true);run(X0,Z1,X0,Z0);
  }else if(kind==='site-hut'){
    const g=new THREE.Group();g.position.set(env.x0-3,0,env.z1+1);g.rotation.y=Math.PI/2;
    g.add(box(4.6,2.4,2.2,C.white,{y:.15,bottom:true}));g.add(box(4.8,.16,2.4,C.black,{y:2.55,bottom:true}));g.add(box(4.6,.15,2.2,C.black,{bottom:true}));
    g.add(box(.9,.7,.04,C.glass,{x:1.2,y:1.5,z:1.12}));pieces.push(g);
  }else if(kind==='crane'){
    const g=new THREE.Group();g.position.set(env.x0-3.5,0,env.z0-3.5);
    const mastH=Math.max(10,env.top+7),jib=Math.max(10,span*.85);
    g.add(box(2.2,.5,2.2,C.concrete,{bottom:true}));
    for(const [dx,dz] of [[-.42,-.42],[.42,-.42],[-.42,.42],[.42,.42]])g.add(box(.11,mastH,.11,C.yellow,{x:dx,z:dz,y:.5,bottom:true}));
    for(let y=1;y<mastH;y+=1.2){g.add(box(.95,.07,.07,C.yellow,{y,z:.42}));g.add(box(.95,.07,.07,C.yellow,{y,z:-.42}));g.add(box(.07,.07,.95,C.yellow,{y:y+.6,x:.42}));g.add(box(.07,.07,.95,C.yellow,{y:y+.6,x:-.42}));}
    const top=new THREE.Group();top.position.y=mastH+.5;
    top.add(box(1.3,1.1,1.3,C.yellow,{bottom:true}));top.add(box(.9,.8,.9,C.glass,{x:.55,y:.2,z:.65,bottom:true}));
    top.add(box(jib,.45,.55,C.yellow,{x:jib/2-.5,y:1.25}));top.add(box(jib*.3,.4,.55,C.yellow,{x:-jib*.15-.5,y:1.25}));
    top.add(box(1.4,1.1,.9,0x3a4146,{x:-jib*.3,y:.65,bottom:true}));
    const hook=new THREE.Group();hook.position.set(jib*.55,1.05,0);hook.add(box(.03,5,.03,C.black,{y:-2.5}));hook.add(box(.35,.35,.35,C.black,{y:-5.2}));top.add(hook);
    // Point the jib towards the project, swinging slowly with the plan position (illustrative).
    const toward=Math.atan2(-(cz-(env.z0-3.5)),cx-(env.x0-3.5));top.rotation.y=toward;g.add(top);pieces.push(g);
    animate=pos=>{top.rotation.y=toward+Math.sin(pos*.35)*.45;};
  }else if(kind==='scaffold'){
    const h=env.top+1,off=1;
    const side=(x0,z0,x1,z1,nx,nz)=>{const len=Math.hypot(x1-x0,z1-z0),n=Math.max(1,Math.round(len/2));
      for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t+nx*off,z=z0+(z1-z0)*t+nz*off,g=new THREE.Group();g.position.set(x,0,z);
        g.add(box(.06,h,.06,C.steel,{bottom:true}));g.add(box(.06,h,.06,C.steel,{x:nx*.7,z:nz*.7,bottom:true}));
        if(i<n){const dx=(x1-x0)/n,dz=(z1-z0)/n,l=Math.hypot(dx,dz),ang=-Math.atan2(dz,dx);
          for(let y=1.2;y<h;y+=1.2){const p=box(l,.05,.7,C.plank,{y});p.position.x=dx/2+nx*.35;p.position.z=dz/2+nz*.35;p.rotation.y=ang;g.add(p);}}
        pieces.push(g);}};
    side(env.x0,env.z0,env.x1,env.z0,0,-1);side(env.x1,env.z0,env.x1,env.z1,1,0);side(env.x1,env.z1,env.x0,env.z1,0,1);side(env.x0,env.z1,env.x0,env.z0,-1,0);
  }
  return {pieces,animate};
}
