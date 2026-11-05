/* Hybrid V2 «Dibujo vivo» — C1: the graphite drawing layer (no realism stains yet; those are C2).
   The SAME scene RUBIK builds is drawn as an architectural graphite drawing on paper:
   1. AUX pass — the scene writes, per pixel, its world position and an identity (architecture, each opening, each piece
      of furniture). Materials are swapped only for this pass and restored before it returns; nothing is cloned or kept
      on the user's objects; clipping planes (dynamic section) are honoured; glass, lines, sprites and labels stay out.
   2. COMPOSITE pass — paper with fibre and a soft model shading, ambient occlusion from the AUX buffer, fine graphite
      lines from depth / normal / identity discontinuities, a faint second stroke where the pencil went over the line
      again, light hatching only where light is low, and lines that lighten with distance.
   D2 (docs/product/hybrid-v2-living-drawing-proposal-2026-11-05.md §9): fine graphite only — no colour, no accent.
   Owned resources: one render target, one composite material, one quad, the AUX materials (one per identity/side/
   clipping set). All are released by dispose(). The renderer state it touches (render target, clear colour/alpha,
   shadow auto-update, scene background/fog) is restored after every frame.
   Browser global: FloorPlanLivingDrawingRenderer.create(THREE, renderer, hooks). */
(function(root){
 'use strict';
 const PAPER=[0.962,0.953,0.930],INK=[0.17,0.17,0.18],MAX_SEEDS=16,MAX_OBJ=96,MAX_ROOMS=64;
 const AUX_VS=`
#include <common>
#include <clipping_planes_pars_vertex>
varying vec3 vW;
void main(){
 vec4 p=vec4(position,1.0);
 #ifdef USE_INSTANCING
 p=instanceMatrix*p;
 #endif
 vec4 w=modelMatrix*p;vW=w.xyz;
 vec4 mvPosition=viewMatrix*w;
 gl_Position=projectionMatrix*mvPosition;
 #include <clipping_planes_vertex>
}`;
 const AUX_FS=`
uniform float uId;varying vec3 vW;
#include <clipping_planes_pars_fragment>
void main(){
 #include <clipping_planes_fragment>
 gl_FragColor=vec4(vW,uId);
}`;
 const COMP_FS=()=>`
precision highp float;
uniform sampler2D tAux;uniform vec2 uRes;uniform vec3 uCam;uniform float uStep,uAoN;
uniform vec3 uPaper,uInk,uKey;uniform float uLine;
// C2 — realism stains. uLand 0: graphite only (C1). Otherwise each world point lands at its moment t(p) and shows the
// real render (RUBIK's own materials and light) from then on.
uniform float uLand,uTime,uObjSpeed;uniform sampler2D tReal,tRoom;uniform vec4 uRoomMap;uniform vec2 uLevelY;
uniform vec4 uSeedA[${MAX_SEEDS}];uniform vec4 uSeedB[${MAX_SEEDS}];uniform vec4 uSeedC[${MAX_SEEDS}];uniform vec4 uObjA[${MAX_OBJ}];uniform float uRoomDone[${MAX_ROOMS}];
varying vec2 vUv;
float h21(vec2 p){vec3 q=fract(vec3(p.xyx)*0.1031);q+=dot(q,q.yzx+33.33);return fract((q.x+q.y)*q.z);}
float vn2(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(h21(i),h21(i+vec2(1,0)),f.x),mix(h21(i+vec2(0,1)),h21(i+vec2(1,1)),f.x),f.y);}
vec4 aux(vec2 uv){return texture2D(tAux,uv);}
float h31(vec3 p){p=fract(p*0.1031);p+=dot(p,p.zyx+31.32);return fract((p.x+p.y)*p.z);}
float vn3(vec3 p){vec3 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);
 return mix(mix(mix(h31(i),h31(i+vec3(1,0,0)),f.x),mix(h31(i+vec3(0,1,0)),h31(i+vec3(1,1,0)),f.x),f.y),mix(mix(h31(i+vec3(0,0,1)),h31(i+vec3(1,0,1)),f.x),mix(h31(i+vec3(0,1,1)),h31(i+vec3(1,1,1)),f.x),f.y),f.z);}
float roomAt(vec3 q){vec2 r=(q.xz-uRoomMap.xy)/uRoomMap.zw;if(r.x<0.0||r.y<0.0||r.x>1.0||r.y>1.0)return 0.0;return floor(texture2D(tRoom,r).r*255.0+0.5);}
float roomDone(float room){int k=int(room+0.5);if(k<1||k>=${MAX_ROOMS})return 0.0;return uRoomDone[k];}
/* The moment a world point becomes real. Furniture: the protagonist's stain spreads over it from its seed; other pieces
   land whole from their entry point. Walls: whole vertical panels (0.9 m) — architectural pieces, never torn paper.
   Floors: a soft, low-amplitude organic front. Ceilings: last. Only the room's own seeds count (room map). */
float landAt(vec3 p,vec3 n,float id){
 if(p.y<uLevelY.x||p.y>uLevelY.y)return 1e4;
 float fi=id-1001.0,nz=vn3(p*1.1)-0.5;
 if(fi>-0.5){
  int k=int(fi+0.5);float t=1e4;
  for(int i=0;i<${MAX_SEEDS};i++){if(uSeedC[i].w<0.5)continue;if(abs(uSeedB[i].x-fi)<0.5){float d=length(p-uSeedA[i].xyz)+(vn3(p*3.0)-0.5)*0.22;t=min(t,uSeedA[i].w+max(d,0.0)/uSeedB[i].z);}}
  if(k>=0&&k<${MAX_OBJ}){vec4 o=uObjA[k];if(o.w<9000.0)t=min(t,o.w+(length(p-o.xyz)+(vn3(p*2.5)-0.5)*0.1)/uObjSpeed);}
  return t;
 }
 bool wall=abs(n.y)<0.6,ceil=n.y<-0.6;vec3 q=p;float jit=0.0;
 if(wall){vec2 tg=normalize(vec2(-n.z,n.x));float sAl=dot(p.xz,tg),cell=floor(sAl/0.9);q.xz=p.xz+tg*((cell+0.5)*0.9-sAl);q.y=1.0;jit=(h21(vec2(cell,floor(dot(p.xz,n.xz)*2.0)+7.0))-0.5)*0.22;}
 float room=roomAt(q+n*0.22);if(room<0.5)return 1e4;
 if(roomDone(room)>0.5)return -1.0;
 float t=1e4;
 for(int i=0;i<${MAX_SEEDS};i++){if(uSeedC[i].w<0.5)continue;if(abs(uSeedB[i].y-room)>0.5)continue;
  vec3 dv=q-uSeedA[i].xyz;dv.y*=0.5;float d=length(dv);if(d>uSeedC[i].y)continue;if(!wall)d+=nz*uSeedC[i].z;
  t=min(t,uSeedA[i].w+uSeedC[i].x+max(d,0.0)/uSeedB[i].w);}
 if(ceil)t+=1.1;
 return t+jit;
}
float zOf(vec4 a){return a.w>0.5?length(a.xyz-uCam):1e3;}
void main(){
 vec2 uv=vUv,px=uStep/uRes,sp=uv*uRes;
 vec4 a=aux(uv);bool sky=a.w<0.5;vec3 p=a.xyz;float z0=sky?1e3:length(p-uCam);
 vec4 r1=aux(uv+vec2(px.x,0.0)),l1=aux(uv-vec2(px.x,0.0)),u1=aux(uv+vec2(0.0,px.y)),d1=aux(uv-vec2(0.0,px.y));
 float edge=0.0;vec3 n0=vec3(0.0,1.0,0.0);
 if(!sky){
  vec3 dx=(r1.w>0.5?r1.xyz:p)-(l1.w>0.5?l1.xyz:p),dy=(u1.w>0.5?u1.xyz:p)-(d1.w>0.5?d1.xyz:p);
  n0=normalize(cross(dx,dy));if(dot(n0,uCam-p)<0.0)n0=-n0;
  float lap=abs(zOf(r1)+zOf(l1)-2.0*z0)+abs(zOf(u1)+zOf(d1)-2.0*z0);
  float dEdge=smoothstep(0.012,0.03,lap/max(z0,0.5));
  bool full=r1.w>0.5&&l1.w>0.5&&u1.w>0.5&&d1.w>0.5;
  vec3 nr=normalize(cross(r1.xyz-p,u1.xyz-p)),nl=normalize(cross(l1.xyz-p,d1.xyz-p));
  float nEdge=full?smoothstep(0.25,0.6,1.0-abs(dot(nr,nl))):0.0;
  float iEdge=(abs(r1.w-a.w)+abs(l1.w-a.w)+abs(u1.w-a.w)+abs(d1.w-a.w))>0.5?1.0:0.0;
  edge=clamp(max(max(dEdge,nEdge),iEdge),0.0,1.0);
 } else {
  edge=(r1.w>0.5||l1.w>0.5||u1.w>0.5||d1.w>0.5)?1.0:0.0;
 }
 float grain=0.72+0.28*vn2(sp*vec2(0.9,0.35)/uStep);
 float far=1.0-0.45*smoothstep(3.0,11.0,z0);
 float ink=edge*grain*far*uLine;
 if(!sky){ // a faint second stroke, slightly displaced, where the pencil went over the line again
  vec2 jo=(vec2(vn2(sp*0.02),vn2(sp*0.02+17.0))-0.5)*2.4*px;vec4 j1=aux(uv+jo+vec2(px.x,0.0)),j2=aux(uv+jo-vec2(px.x,0.0));
  float e2=abs(j1.w-j2.w)>0.5?1.0:smoothstep(0.02,0.06,abs(zOf(j1)-zOf(j2))/max(z0,0.5));
  ink=max(ink,e2*0.32*grain*far*uLine);
 }
 float fibre=vn2(sp*0.12/uStep)*0.5+vn2(sp*0.9/uStep)*0.5;
 float shade=sky?1.0:(0.93+0.07*max(dot(n0,normalize(uKey)),0.0)+0.02*n0.y);
 float ao=1.0;
 if(!sky){float occ=0.0;float rpx=clamp(0.32*uRes.y/(z0*1.1),3.0*uStep,46.0*uStep);
  for(int i=0;i<12;i++){if(float(i)>=uAoN)break;float fi=float(i);float ang=fi*2.39996+h21(sp)*6.283;float rr=rpx*(0.25+0.75*fract(fi*0.618+0.13));
   vec2 o=vec2(cos(ang),sin(ang))*rr/uRes;vec4 q=aux(uv+o);if(q.w<0.5)continue;vec3 v=q.xyz-p;float L=length(v);
   occ+=max(dot(n0,v/max(L,1e-4))-0.12,0.0)*(1.0-smoothstep(0.08,0.45,L));}
  ao=clamp(1.0-occ/uAoN*1.6,0.0,1.0);}
 vec3 paper=uPaper*shade*mix(1.0,ao,0.35)*(1.0-0.035*(fibre-0.5));
 // poché: cut walls read as solid graphite, as on a sectioned plan
 if(!sky&&abs(a.w-3.0)<0.5){paper=mix(paper,uInk,0.62+0.06*(fibre-0.5));}
 float hatch=0.0;if(!sky){float lowL=clamp((0.97-shade*ao)*5.0,0.0,1.0);float hl=abs(fract((sp.x*0.7071-sp.y*0.7071)/(4.2*uStep))-0.5);hatch=lowL*(1.0-smoothstep(0.06,0.16,hl))*0.30*(0.6+0.4*grain);}
 vec3 drawn=mix(paper,uInk,clamp(max(ink,hatch),0.0,1.0));
 if(uLand<0.5){gl_FragColor=vec4(drawn,1.0);return;}
 // realism: the real render where the point has landed, a faint trace of the drawing kept on it, light rising on what
 // has just landed, and the pencil tracing the front (one or two pixels) — no colour, no fade of the whole frame
 float t=sky?1e4:landAt(p,n0,a.w);float real01=step(t,uTime),age=uTime-t;
 vec3 realC=mix(texture2D(tReal,uv).rgb,uInk,ink*0.05);
 vec3 col=mix(drawn,realC,real01);
 float fresh=real01*(1.0-smoothstep(0.0,0.3,age));col=mix(col,min(col*1.08+0.025,vec3(1.0)),fresh);
 float front=clamp(fwidth(real01),0.0,1.0)*(1.0-step(9000.0,t));col=mix(col,uInk,front*0.55);
 gl_FragColor=vec4(col,1.0);
}`;
 function create(THREE,renderer,hooks={}){
  const info={active:false,reason:null,precision:null,width:0,height:0,frames:0,auxMaterials:0,aoSamples:0,lineStep:1,restored:true};
  let rt=null,quad=null,quadScene=null,quadCam=null,comp=null;const auxCache=new Map(),openingIds=new Map(),size=new THREE.Vector2(),savedClear=new THREE.Color();
  function support(){
   const gl=renderer.getContext(),isGL2=renderer.capabilities?.isWebGL2;
   if(isGL2&&gl.getExtension('EXT_color_buffer_float'))return THREE.FloatType;
   if(gl.getExtension('EXT_color_buffer_half_float')||(isGL2&&gl.getExtension('EXT_color_buffer_float')))return THREE.HalfFloatType;
   return null;
  }
  function begin(){
   if(hooks.forceUnsupported)return {...info,active:false,reason:'float-render-target'};
   const type=support();if(!type)return {...info,active:false,reason:'float-render-target'};
   info.precision=type===THREE.FloatType?'float':'half';
   comp=new THREE.ShaderMaterial({vertexShader:'varying vec2 vUv;void main(){vUv=uv;gl_Position=vec4(position.xy,0.0,1.0);}',fragmentShader:COMP_FS(),
    uniforms:{tAux:{value:null},uRes:{value:new THREE.Vector2(1,1)},uCam:{value:new THREE.Vector3()},uStep:{value:1},uAoN:{value:12},
     uPaper:{value:new THREE.Color(...PAPER)},uInk:{value:new THREE.Color(...INK)},uKey:{value:new THREE.Vector3(.45,.8,.35)},uLine:{value:.92}},depthTest:false,depthWrite:false});
   quad=new THREE.Mesh(new THREE.PlaneGeometry(2,2),comp);quad.frustumCulled=false;quadScene=new THREE.Scene();quadScene.add(quad);quadCam=new THREE.OrthographicCamera(-1,1,1,-1,0,1);
   info.active=true;info.reason=null;return {...info};
  }
  function ensureTarget(w,h){
   if(rt&&rt.width===w&&rt.height===h)return;
   rt?.dispose();
   rt=new THREE.WebGLRenderTarget(w,h,{type:info.precision==='float'?THREE.FloatType:THREE.HalfFloatType,format:THREE.RGBAFormat,minFilter:THREE.NearestFilter,magFilter:THREE.NearestFilter,depthBuffer:true,stencilBuffer:false});
   info.width=w;info.height=h;
  }
  // Identity: 1 architecture; each opening (door/window) its own; each furniture group its own. Stored +1 → 0 is "nothing".
  const POCHE=2,skip=new THREE.ShaderMaterial({visible:false});
  function identity(o){
   const furn=hooks.furniture?.();let g=o,opening=null;
   while(g){if(furn&&g.parent===furn)return 1000+furn.children.indexOf(g);const u=g.userData||{};if(opening===null&&(u.openingId!==undefined||u.door))opening=String(u.openingId??u.door?.id??u.door);g=g.parent;}
   if(opening!==null){if(!openingIds.has(opening))openingIds.set(opening,10+openingIds.size);return openingIds.get(opening);}
   return 1;
  }
  // One AUX material per identity / side / set of clipping planes (by plane object, not by array: the dynamic section
  // gives each material its own array holding the same plane). The planes are re-pointed every frame, so a moving cut
  // is honoured without creating materials.
  const planeIds=new WeakMap();let planeSeq=0;const planeId=p=>{if(!planeIds.has(p))planeIds.set(p,++planeSeq);return planeIds.get(p);};
  function auxMaterial(id,side,src){
   const planes=src?.clippingPlanes?.length?src.clippingPlanes:null,key=id+'|'+side+'|'+(planes?planes.map(planeId).join(','):'-')+'|'+(src?.clipIntersection?1:0);
   let m=auxCache.get(key);
   if(!m){m=new THREE.ShaderMaterial({vertexShader:AUX_VS,fragmentShader:AUX_FS,uniforms:{uId:{value:id+1}},side,clipping:true,clippingPlanes:planes,clipIntersection:!!src?.clipIntersection});auxCache.set(key,m);info.auxMaterials=auxCache.size;}
   else m.clippingPlanes=planes;
   return m;
  }
  const glass=m=>!!m&&(m===hooks.glass?.()||m.transparent||m.opacity<1||m.transmission>0);
  function render(scene,camera){
   if(!info.active)return renderer.render(scene,camera);
   renderer.getDrawingBufferSize(size);const w=Math.max(1,Math.floor(size.x)),h=Math.max(1,Math.floor(size.y));ensureTarget(w,h);
   const dpr=renderer.getPixelRatio(),step=Math.max(1,Math.round(dpr*.75)),aoN=w*h>2.6e6?6:12;
   info.lineStep=step;info.aoSamples=aoN;
   // AUX pass: swap → render → restore (always, even if the render throws)
   const swapped=[],prevTarget=renderer.getRenderTarget(),prevAlpha=renderer.getClearAlpha(),prevAuto=renderer.shadowMap.autoUpdate,bg=scene.background,fog=scene.fog;
   renderer.getClearColor(savedClear);info.restored=false;
   try{
    scene.traverse(o=>{
     if(o.isLine||o.isLineSegments||o.isPoints||o.isSprite||o.isCSS2DObject){if(o.visible){o.visible=false;swapped.push([o,0]);}return;}
     if(!o.isMesh||!o.material)return;
     const mats=Array.isArray(o.material)?o.material:[o.material];
     // what RUBIK does not draw stays undrawn: glass, hidden or colour-masked materials; and each face keeps its own
     // culling (ceilings are culled from above by design), so the drawing shows exactly the geometry the view shows
     const draws=m=>m&&m.visible!==false&&m.colorWrite!==false&&!glass(m);
     if(!mats.some(draws)){if(o.visible){o.visible=false;swapped.push([o,0]);}return;}
     // cut tops of walls (the dark cap face) and the section's lids are drawn as poché
     const id=identity(o),cut=m=>o.userData?.sectionCap||(hooks.cap&&m===hooks.cap());
     swapped.push([o,1,o.material]);
     o.material=Array.isArray(o.material)?o.material.map(m=>draws(m)?auxMaterial(cut(m)?POCHE:id,m.side,m):skip):auxMaterial(cut(o.material)?POCHE:id,o.material.side,o.material);
    });
    scene.background=null;scene.fog=null;renderer.shadowMap.autoUpdate=false;
    renderer.setRenderTarget(rt);renderer.setClearColor(0x000000,0);renderer.clear(true,true,false);
    renderer.render(scene,camera);
   }finally{
    for(let i=swapped.length-1;i>=0;i--){const s=swapped[i];if(s[1]===0)s[0].visible=true;else s[0].material=s[2];}
    scene.background=bg;scene.fog=fog;renderer.shadowMap.autoUpdate=prevAuto;renderer.setRenderTarget(prevTarget);renderer.setClearColor(savedClear,prevAlpha);info.restored=true;
   }
   // COMPOSITE pass to the canvas
   comp.uniforms.tAux.value=rt.texture;comp.uniforms.uRes.value.set(w,h);comp.uniforms.uCam.value.setFromMatrixPosition(camera.matrixWorld);comp.uniforms.uStep.value=step;comp.uniforms.uAoN.value=aoN;
   renderer.setRenderTarget(null);renderer.render(quadScene,quadCam);
   info.frames++;
  }
  function dispose(){
   rt?.dispose();rt=null;comp?.dispose();comp=null;quad?.geometry.dispose();quad=null;quadScene=null;quadCam=null;
   for(const m of auxCache.values())m.dispose();auxCache.clear();openingIds.clear();skip.dispose();
   info.active=false;info.auxMaterials=0;info.width=info.height=0;
  }
  return {begin,render,dispose,get info(){return {...info};}};
 }
 root.FloorPlanLivingDrawingRenderer={create,version:1};
})(typeof self!=='undefined'?self:this);
