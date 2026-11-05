/* HV2 — prototype of «Hybrid V2: dibujo que cobra vida» over RUBIK's real example home.
   NOT product code. Loaded into the running app by the QA harness; it only READS RUBIK's scene (via the in-memory
   hook __hv2) and renders it three ways with RUBIK's own renderer:
     1. REAL: the scene exactly as RUBIK renders it (its materials, lights, HDR, shadows).
     2. AUX:  a float buffer with the world position and the identity of every pixel (architecture / furniture piece).
     3. COMPOSITE: graphite drawing on paper (ink from depth/normal/identity edges) everywhere a point has not "landed"
        yet, and the REAL image where it has. Each point's landing moment t(p) comes from asynchronous realism seeds
        anchored on chosen furniture (a seed starts on part of the protagonist and grows over it, then into the room).
   Nothing in RUBIK's scene is modified except the per-frame material swap for the AUX pass, which is restored at once. */
(function(){
'use strict';
const K=window.__hv2(),THREE=K.THREE,renderer=K.renderer,scene=K.scene;
let W=1280,H=720,cam,rtAux,texReal,quad,quadScene,quadCam,compMat,auxCache=new Map(),hidden=[],furnIndex=new Map(),roomTex,roomInfo;
const MAX_SEEDS=24,MAX_OBJ=64;

function setup(opts={}){
 W=opts.width||W;H=opts.height||H;
 View3D.setSuspended(true);
 const c=renderer.domElement;document.body.appendChild(c);c.classList.add('hv2');
 const st=document.createElement('style');st.textContent='body>*{visibility:hidden!important} body>canvas.hv2{visibility:visible!important;position:fixed!important;left:0;top:0;z-index:2147483647}';document.head.appendChild(st);
 renderer.setPixelRatio(1);renderer.setSize(W,H,false);c.style.width=W+'px';c.style.height=H+'px';
 cam=new THREE.PerspectiveCamera(opts.fov||52,W/H,.05,200);
 rtAux=new THREE.WebGLRenderTarget(W,H,{type:THREE.FloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true});
 texReal=new THREE.FramebufferTexture(W,H);texReal.minFilter=texReal.magFilter=THREE.NearestFilter;
 // furniture identity: index 1..n per furniture group (architecture = 0)
 K.furnG.children.forEach((g,i)=>{furnIndex.set(g,i+1);});
 buildRoomMap();
 buildComposite();
 return {furniture:K.furnG.children.map((g,i)=>{const b=new THREE.Box3().setFromObject(g);const o=project.objects.find(o=>o.id===g.userData.fid)||{};return {i:i+1,fid:g.userData.fid,kind:o.kind||o.type||null,min:b.min.toArray(),max:b.max.toArray()};}),rooms:roomInfo};
}

/* Room map: plan rasterised at 4 cm, each pixel the index (1..n) of its room; walls/gaps take the nearest room
   within 0.4 m, so a wall belongs to the room it bounds on that side. */
function buildRoomMap(){
 const rooms=geometry.rooms,xs=rooms.flatMap(r=>r.poly.map(p=>p[0])),ys=rooms.flatMap(r=>r.poly.map(p=>p[1]));
 const pad=600,x0=Math.min(...xs)-pad,y0=Math.min(...ys)-pad,x1=Math.max(...xs)+pad,y1=Math.max(...ys)+pad,res=40;
 const w=Math.ceil((x1-x0)/res),h=Math.ceil((y1-y0)/res),cv=document.createElement('canvas');cv.width=w;cv.height=h;const g=cv.getContext('2d');
 rooms.forEach((r,i)=>{g.fillStyle=`rgb(${i+1},0,0)`;g.beginPath();r.poly.forEach((p,j)=>{const X=(p[0]-x0)/res,Y=(p[1]-y0)/res;j?g.lineTo(X,Y):g.moveTo(X,Y);});g.closePath();g.fill();});
 const img=g.getImageData(0,0,w,h).data,id=new Uint8Array(w*h);for(let i=0;i<w*h;i++)id[i]=img[i*4];
 // nearest-room fill for unassigned pixels (BFS up to 10 px = 0.4 m)
 let front=[];for(let i=0;i<w*h;i++)if(id[i])front.push(i);
 for(let step=0;step<10&&front.length;step++){const nx=[];for(const i of front){const x=i%w,y=(i/w)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const X=x+dx,Y=y+dy;if(X<0||Y<0||X>=w||Y>=h)continue;const j=Y*w+X;if(!id[j]){id[j]=id[i];nx.push(j);}}}front=nx;}
 const data=new Uint8Array(w*h*4);for(let i=0;i<w*h;i++){data[i*4]=id[i];data[i*4+3]=255;}
 roomTex=new THREE.DataTexture(data,w,h,THREE.RGBAFormat);roomTex.minFilter=roomTex.magFilter=THREE.NearestFilter;roomTex.needsUpdate=true;
 // world mapping: world x = (planX - OX)/1000, world z = (planY - OY)/1000
 roomInfo={x0:(x0-K.OX)/1000,z0:(y0-K.OY)/1000,sx:(x1-x0)/1000,sz:(y1-y0)/1000,rooms:rooms.map((r,i)=>({i:i+1,id:r.id}))};
}

const AUX_VS=`
varying vec3 vW;
void main(){
 vec4 p=vec4(position,1.0);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;
 #endif
 vec4 w=modelMatrix*p;vW=w.xyz;
 gl_Position=projectionMatrix*viewMatrix*w;
}`;
const AUX_FS=`uniform float uId;varying vec3 vW;void main(){gl_FragColor=vec4(vW,uId);}`;
function auxMat(id,side){const k=id+'|'+side;let m=auxCache.get(k);if(!m){m=new THREE.ShaderMaterial({vertexShader:AUX_VS,fragmentShader:AUX_FS,uniforms:{uId:{value:id}},side});auxCache.set(k,m);}return m;}
function furnIdOf(o){let g=o;while(g&&g.parent!==K.furnG)g=g.parent;return g?furnIndex.get(g)||0:0;}
const isGlass=m=>m&&(m===K.glassMat||m.transparent||m.opacity<1||m.transmission>0);

function renderAux(){
 const swapped=[];
 scene.traverse(o=>{
  if(o.isLine||o.isLineSegments||o.isPoints||o.isSprite||o.isCSS2DObject){if(o.visible){o.visible=false;swapped.push([o,'v']);}return;}
  if(!o.isMesh)return;
  const mats=[].concat(o.material);
  if(mats.every(isGlass)){if(o.visible){o.visible=false;swapped.push([o,'v']);}return;}
  const side=mats[0]?.side??THREE.FrontSide;
  swapped.push([o,'m',o.material]);o.material=auxMat(furnIdOf(o)+1,side===THREE.BackSide?THREE.BackSide:THREE.DoubleSide);
 });
 const bg=scene.background,env=scene.fog;scene.background=null;scene.fog=null;
 renderer.setRenderTarget(rtAux);renderer.setClearColor(0x000000,0);renderer.clear();
 // clear w=-1 for sky: draw with clear alpha 0 and test w<0.5? ids start at 0 for architecture -> encode id+1
 renderer.render(scene,cam);
 renderer.setRenderTarget(null);
 scene.background=bg;scene.fog=env;
 for(const s of swapped){if(s[1]==='v')s[0].visible=true;else s[0].material=s[2];}
}

const COMP_FS=`
precision highp float;
uniform sampler2D tReal,tAux,tRoom;uniform vec2 uRes;uniform float uTime;uniform vec3 uCam;
uniform vec4 uRoomMap; // x0,z0,sx,sz
uniform vec4 uSeedA[${MAX_SEEDS}]; // xyz seed point, w birth (s)
uniform vec4 uSeedB[${MAX_SEEDS}]; // x anchor object id (0 none), y room index, z object speed m/s, w env speed m/s
uniform vec4 uSeedC[${MAX_SEEDS}]; // x env delay s, y env max radius m, z noise amp m, w active
uniform vec4 uObjA[${MAX_OBJ}];    // xyz entry point, w landing time (1e4 = never)
uniform float uObjSpeed;
uniform vec3 uPaper,uInk,uAccent;uniform float uInkReal,uLine,uDrawBg;uniform vec3 uKey;
uniform float uAO,uSat,uContrast,uLift,uWarm,uVig,uSkyT;
varying vec2 vUv;
float h31(vec3 p){p=fract(p*0.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),
            mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float fbm(vec3 p){float a=0.5,s=0.0;for(int i=0;i<4;i++){s+=a*vn3(p);p=p*2.03+vec3(1.7,9.2,3.1);a*=0.5;}return s;}
float vn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
vec4 aux(vec2 uv){return texture2D(tAux,uv);}
float roomAt(vec3 p){vec2 q=(p.xz-uRoomMap.xy)/uRoomMap.zw;return floor(texture2D(tRoom,q).r*255.0+0.5);}
// landing moment of a world point
float landAt(vec3 p,float id,vec3 nrm){
 if(id>0.5){ // furniture: the whole piece lands from its entry point, unless a seed is anchored on it
  float t=1e4;
  for(int i=0;i<${MAX_SEEDS};i++){ if(uSeedC[i].w<0.5)continue; if(abs(uSeedB[i].x-id)<0.5){
    float d=length(p-uSeedA[i].xyz)+ (fbm(p*3.0)-0.5)*uSeedC[i].z*0.35;
    t=min(t,uSeedA[i].w+max(d,0.0)/uSeedB[i].z);} }
  for(int j=0;j<${MAX_OBJ};j++){ if(abs(float(j+1)-id)<0.5){ vec4 o=uObjA[j]; if(o.w<9000.0){
    float d=length(p-o.xyz)+(fbm(p*3.0)-0.5)*0.08; t=min(t,o.w+max(d,0.0)/uObjSpeed);} } }
  return t;
 }
 // architecture (walls, floor): fronts from the seeds of the same room, broken into laid pieces with irregular edges
 float room=roomAt(p+nrm*0.2+vec3(fbm(p*1.3)-0.5,0.0,fbm(p*1.3+7.0)-0.5)*0.10);
 float t=1e4;
 for(int i=0;i<${MAX_SEEDS};i++){ if(uSeedC[i].w<0.5)continue; if(abs(uSeedB[i].y-room)>0.5)continue;
  vec3 s=uSeedA[i].xyz;vec3 d3=p-s;d3.y*=0.6; // spread a little faster up the walls than along the floor
  float d=length(d3);
  float n=(fbm(p*0.9+float(i)*3.7)-0.5)*uSeedC[i].z + (fbm(p*2.6)-0.5)*uSeedC[i].z*0.14;
  if(d>uSeedC[i].y)continue;
  t=min(t,uSeedA[i].w+uSeedC[i].x+max(d+n,0.0)/uSeedB[i].w);
 }
 t+=smoothstep(2.45,2.75,p.y)*1.1; // the ceiling lands last, after the walls have risen
 vec3 cell=floor(p/0.45+vec3(0.0,0.0,0.0));
 return t+(h31(cell+19.0)-0.5)*0.30;
}
void main(){
 vec2 uv=vUv,px=1.0/uRes;
 vec3 real=texture2D(tReal,uv).rgb;
 vec4 a=aux(uv);
 bool sky=a.w<0.5;           // ids are stored +1: 0 means nothing drawn here
 float id=a.w-1.0;vec3 p=a.xyz;
 // ink: edges of depth, normal and identity from the 3x3 neighbourhood
 float z0=sky?1e3:length(p-uCam);
 float edge=0.0;vec3 n0=vec3(0.0);
 if(!sky){
  vec4 r1=aux(uv+vec2(px.x,0.0)),l1=aux(uv-vec2(px.x,0.0)),u1=aux(uv+vec2(0.0,px.y)),d1=aux(uv-vec2(0.0,px.y));
  vec4 r2=aux(uv+vec2(px.x,px.y)),l2=aux(uv-vec2(px.x,px.y)),u2=aux(uv+vec2(-px.x,px.y)),d2=aux(uv+vec2(px.x,-px.y));
  vec3 dx=(r1.w>0.5?r1.xyz:p)-(l1.w>0.5?l1.xyz:p),dy=(u1.w>0.5?u1.xyz:p)-(d1.w>0.5?d1.xyz:p);
  n0=normalize(cross(dx,dy));if(dot(n0,uCam-p)<0.0)n0=-n0;
  float zr=r1.w>0.5?length(r1.xyz-uCam):1e3,zl=l1.w>0.5?length(l1.xyz-uCam):1e3,zu=u1.w>0.5?length(u1.xyz-uCam):1e3,zd=d1.w>0.5?length(d1.xyz-uCam):1e3;
  float lap=abs(zr+zl-2.0*z0)+abs(zu+zd-2.0*z0);
  float dEdge=smoothstep(0.012,0.03,lap/max(z0,0.5));
  // normal discontinuity: compare one-sided normals
  vec3 nr=normalize(cross(r1.xyz-p,u1.xyz-p)),nl=normalize(cross(l1.xyz-p,d1.xyz-p));
  float nEdge=(r1.w>0.5&&l1.w>0.5&&u1.w>0.5&&d1.w>0.5)?smoothstep(0.25,0.6,1.0-abs(dot(nr,nl))):0.0;
  float iEdge=(abs(r1.w-a.w)+abs(l1.w-a.w)+abs(u1.w-a.w)+abs(d1.w-a.w))>0.5?1.0:0.0;
  edge=clamp(max(max(dEdge,nEdge),iEdge),0.0,1.0);
 } else {
  vec4 r1=aux(uv+vec2(px.x,0.0)),l1=aux(uv-vec2(px.x,0.0)),u1=aux(uv+vec2(0.0,px.y)),d1=aux(uv-vec2(0.0,px.y));
  edge=(r1.w>0.5||l1.w>0.5||u1.w>0.5||d1.w>0.5)?1.0:0.0;
 }
 // pencil: graphite line with grain, lighter with distance (depth in the drawing)
 vec2 sp=uv*uRes;
 float grain=0.72+0.28*vn2(sp*vec2(0.9,0.35));
 float far=1.0-0.45*smoothstep(3.0,11.0,z0);
 float ink=edge*grain*far*uLine;
 if(!sky){ // sketch: faint doubled stroke where the pencil went over the line twice, and hatching where light is low
  vec2 jo=(vec2(vn2(sp*0.02),vn2(sp*0.02+17.0))-0.5)*2.4*px;vec4 j1=aux(uv+jo+vec2(px.x,0.0)),j2=aux(uv+jo-vec2(px.x,0.0));
  float e2=abs(j1.w-j2.w)>0.5?1.0:smoothstep(0.02,0.06,abs(length(j1.xyz-uCam)-length(j2.xyz-uCam))/max(z0,0.5));
  ink=max(ink,e2*0.32*grain*far*uLine);
 }
 // paper: soft model shading, fibre
 float fibre=vn2(sp*0.12)*0.5+vn2(sp*0.9)*0.5;
 float shade=sky?1.0:(0.93+0.07*max(dot(n0,normalize(uKey)),0.0)+0.02*n0.y);
 // ambient occlusion from the AUX buffer (grounds furniture in both layers)
 float ao=1.0;
 if(!sky){float occ=0.0;float rpx=clamp(0.32*uRes.y/(z0*1.1),3.0,46.0);
  for(int i=0;i<12;i++){float fi=float(i);float ang=fi*2.39996+h21(sp)*6.283;float rr=rpx*(0.25+0.75*fract(fi*0.618+0.13));
   vec2 o=vec2(cos(ang),sin(ang))*rr*px;vec4 q=aux(uv+o);if(q.w<0.5)continue;vec3 v=q.xyz-p;float L=length(v);
   occ+=max(dot(n0,v/max(L,1e-4))-0.12,0.0)*(1.0-smoothstep(0.08,0.45,L));}
  ao=clamp(1.0-occ/12.0*1.6,0.0,1.0);}
 vec3 paper=uPaper*shade*mix(1.0,ao,0.35)*(1.0-0.035*(fibre-0.5));
 float hatch=0.0;if(!sky){float lowL=clamp((0.97-shade*ao)*5.0,0.0,1.0);float hl=abs(fract((sp.x*0.7071-sp.y*0.7071)/4.2)-0.5);hatch=lowL*(1.0-smoothstep(0.06,0.16,hl))*0.30*(0.6+0.4*grain);}
 vec3 drawn=mix(paper,uInk,max(ink,hatch));
 // sky / outside through the windows: the drawing keeps a pale wash of what is there
 if(sky)drawn=mix(uPaper,real,uDrawBg)*(1.0-0.0)+0.0;
 if(sky)drawn=mix(drawn,uInk,edge*0.8);
 // landing
 float t=sky?(uSkyT+vn2(sp*0.004)*1.4):landAt(p,id,n0); // what is seen outside lands with the room it is seen from
 float real01=step(t,uTime);
 float age=uTime-t;
 // presentation grade of the real layer: AO, gentle contrast/saturation, warm key, vignette
 vec3 rg=real*mix(1.0,ao,uAO);
 float lumR=dot(rg,vec3(0.2126,0.7152,0.0722));
 rg=mix(vec3(lumR),rg,uSat);rg=(rg-0.5)*uContrast+0.5+uLift;
 rg*=mix(vec3(1.0),vec3(1.04,1.0,0.94),uWarm);
 float vig=1.0-uVig*smoothstep(0.45,1.05,length((uv-0.5)*vec2(uRes.x/uRes.y,1.0)));
 rg=clamp(rg*vig,0.0,1.0);
 vec3 realC=mix(rg,uInk,ink*uInkReal);
 vec3 col=mix(drawn,realC,real01);
 // the front: a thin graphite contour exactly where real meets paper, and a short warm glaze on what just landed
 float fw=max(fwidth(t),1e-4);
 float front=(1.0-smoothstep(0.6,1.8,abs(age)/fw))*(1.0-step(9000.0,t));
 float fresh=real01*(1.0-smoothstep(0.0,0.22,age));
 col=mix(col,min(col*1.10+0.03,vec3(1.0)),fresh);          // light arrives on what just landed
 col=mix(col,uInk,front*0.62);                                // the pencil keeps tracing the front
 gl_FragColor=vec4(col,1.0);
}`;
function buildComposite(){
 const seedsA=[],seedsB=[],seedsC=[],objs=[];for(let i=0;i<MAX_SEEDS;i++){seedsA.push(new THREE.Vector4());seedsB.push(new THREE.Vector4());seedsC.push(new THREE.Vector4());}
 for(let i=0;i<MAX_OBJ;i++)objs.push(new THREE.Vector4(0,0,0,1e4));
 compMat=new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:COMP_FS,
  uniforms:{tReal:{value:texReal},tAux:{value:rtAux.texture},tRoom:{value:roomTex},uRes:{value:new THREE.Vector2(W,H)},uTime:{value:0},uCam:{value:new THREE.Vector3()},
   uRoomMap:{value:new THREE.Vector4(roomInfo.x0,roomInfo.z0,roomInfo.sx,roomInfo.sz)},uSeedA:{value:seedsA},uSeedB:{value:seedsB},uSeedC:{value:seedsC},uObjA:{value:objs},uObjSpeed:{value:1.6},
   uPaper:{value:new THREE.Color(0.962,0.953,0.930)},uInk:{value:new THREE.Color(0.17,0.17,0.18)},uAccent:{value:new THREE.Color(0.86,0.62,0.38)},uInkReal:{value:0.06},uLine:{value:0.92},uDrawBg:{value:0.18},uKey:{value:new THREE.Vector3(0.45,0.8,0.35)},
   uAO:{value:0.75},uSat:{value:1.03},uContrast:{value:1.10},uLift:{value:-0.02},uWarm:{value:0.35},uVig:{value:0.22},uSkyT:{value:1e4}},
  depthTest:false,depthWrite:false});
 compMat.extensions={derivatives:true};
 quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),compMat);quad.frustumCulled=false;quadScene=new THREE.Scene();quadScene.add(quad);quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
}
function setSeeds(seeds){const A=compMat.uniforms.uSeedA.value,B=compMat.uniforms.uSeedB.value,C=compMat.uniforms.uSeedC.value;
 for(let i=0;i<MAX_SEEDS;i++){const s=seeds[i];if(!s){C[i].set(0,0,0,0);continue;}A[i].set(s.p[0],s.p[1],s.p[2],s.t);B[i].set(s.obj||0,s.room||0,s.vObj||0.9,s.vEnv||0.8);C[i].set(s.envDelay??0.6,s.maxR??7,s.noise??0.7,1);}}
function setObjects(list){const O=compMat.uniforms.uObjA.value;for(let i=0;i<MAX_OBJ;i++)O[i].set(0,0,0,1e4);for(const o of list)O[o.i-1].set(o.p[0],o.p[1],o.p[2],o.t);}
function setParams(p){for(const k in p){const u=compMat.uniforms[k];if(!u)continue;if(u.value&&u.value.set&&Array.isArray(p[k]))u.value.set(...p[k]);else u.value=p[k];}}
function pose(pos,target,fov){cam.position.set(...pos);cam.lookAt(new THREE.Vector3(...target));if(fov){cam.fov=fov;}cam.aspect=W/H;cam.updateProjectionMatrix();cam.updateMatrixWorld();}
// mode: 'real' | 'aux' | 'drawn' | 'comp'
function frame(time,mode='comp'){
 renderer.setRenderTarget(null);renderer.setClearColor(0xffffff,1);
 renderer.render(scene,cam);
 if(mode==='real')return;
 renderer.copyFramebufferToTexture(new THREE.Vector2(0,0),texReal);
 renderAux();
 compMat.uniforms.uTime.value=mode==='drawn'?-1e3:time;compMat.uniforms.uCam.value.copy(cam.position);
 renderer.setRenderTarget(null);renderer.render(quadScene,quadCam);
}
function roomIndex(id){return roomInfo.rooms.find(r=>r.id===id)?.i||0;}
window.HV2={setup,pose,frame,setSeeds,setObjects,setParams,roomIndex,get cam(){return cam;}};
})();
