/* Hybrid Registered Elevation V1 — runtime representation layer for elevation-open (opt-in).
   One geometry, several registered representations: the façade meshes Rubik already built are read technically (paper
   with ink hatching wherever Rubik's own sun does not reach — read from Rubik's shadow map) and then materialised by a
   diagonal front that crosses the façade in façade-local coordinates. Mechanism sculpted from an MIT donor (see the
   shader section and docs/product/provenance/hybrid-registered-elevation-v1-donor-provenance.md). Nothing here derives geometry, loads
   assets, owns light/sun or schedules time: the façade candidate (FloorPlanPresentationElevation) says which walls and
   openings, SurfaceRenderer owns the materials, the Story owns p.

   Ownership:
   - targets are found by real identity only: wall meshes carry userData.wallId (walls, sill and head pieces of their
     openings), opening groups carry userData.openingId (runtime-only metadata set by the 3D view from geometry ids);
     the level of a mesh is the levelId of its level group (levelsG) or the active level. Never by position or name.
   - each distinct source material of a target gets ONE presentation clone (textures borrowed, not copied, never
     disposed); target meshes get the clone only while the hybrid state is active and their exact original material
     reference (single or array) back otherwise and at end. Glass/transparent materials are left untouched.
   - clones share clipping plane arrays with their source, sync map/normalMap/roughnessMap/colour from the source when
     SurfaceRenderer finishes loading late, and are the only resources disposed here.
   UMD: browser global FloorPlanElevationHybrid; CommonJS for the pure parts (tests).

   The shader section below (lineAt/lineFade, shadow-mask hatch, sweep smoothstep, front band, paper composite) is
   derived from Sam1983Aing/flat-to-3d @ d7b9b69753d3af679535ee56695a05c8d955c3c6, 07-sunlit-elevation/engine/elevation.js:
   MIT License — Copyright (c) 2026 Samnang Aing
   Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
   documentation files (the "Software"), to deal in the Software without restriction, including without limitation the
   rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit
   persons to whom the Software is furnished to do so, subject to the following conditions:
   The above copyright notice and this permission notice shall be included in all copies or substantial portions of the
   Software.
   THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE
   WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
   COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
   OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanElevationHybrid=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const HYBRID={version:1,paper:0xf2efe7,ink:0x1d1c19,accent:0x1f6f6a,minPeriodM:.11,maxPeriodM:.4,linesAcross:55,edgeAngleDeg:25,minTargets:1,minWallShare:.5,cacheKey:'rubik-hybrid-elevation-v1',
  REASONS:{'no-candidate':'No hay fachada derivada.','no-targets':'No se encontraron los muros de la fachada en la escena.','insufficient-targets':'La escena no contiene suficientes muros de la fachada.',
   'unsupported-material':'Un material de la fachada no admite la representación híbrida.','shader-unavailable':'El navegador no admite el sombreado necesario.','shader-error':'El sombreado híbrido no compiló.'}};
 const keyOf=(levelId,id)=>JSON.stringify([levelId??null,id]);
 const materialsOf=m=>Array.isArray(m)?m:m?[m]:[];
 // Transparent / glass: preserved as is (never hatched or made opaque).
 const transparent=m=>!!m&&(m.transparent||m.opacity<1||m.transmission>0);
 const adaptable=m=>!!m&&(m.isMeshStandardMaterial||m.isMeshPhysicalMaterial);
 /* Pure selection over a scene-like tree. roots: [{object, levelId}] — each object has traverse(fn) and children; a
    descendant whose ancestor group carries userData.levelId belongs to that level instead (levelsG children).
    refs: candidate {wallRefs:[{levelId,wallId}], openingRefs:[{levelId,openingId}]}.
    Returns {meshes:[{mesh, kind:'wall'|'opening', levelId, id}], walls:Set of found wall keys, glass:n}. */
 function selectTargets(roots,refs){
  const walls=new Set((refs?.wallRefs||[]).map(r=>keyOf(r.levelId,r.wallId))),openings=new Set((refs?.openingRefs||[]).map(r=>keyOf(r.levelId,r.openingId)));
  const out=[],found=new Set();let glass=0;const seen=new Set();
  function visit(o,levelId,opening){
   if(!o||seen.has(o))return;seen.add(o);
   const lv=o.userData&&o.userData.levelId!==undefined?o.userData.levelId:levelId;
   const op=o.userData&&o.userData.openingId!==undefined&&openings.has(keyOf(lv,o.userData.openingId))?o.userData.openingId:opening;
   if(o.isMesh&&!o.userData?.walkOnly&&!o.userData?.sectionCap){
    const wallId=o.userData?.wallId;
    if(wallId!==undefined&&walls.has(keyOf(lv,wallId))){out.push({mesh:o,kind:'wall',levelId:lv,id:wallId});found.add(keyOf(lv,wallId));}
    else if(op!==undefined&&op!==null){if(materialsOf(o.material).every(transparent))glass++;else out.push({mesh:o,kind:'opening',levelId:lv,id:op});}
   }
   for(const c of o.children||[])visit(c,lv,op);
  }
  for(const r of roots||[])if(r?.object)visit(r.object,r.levelId??null,undefined);
  return {meshes:out,walls:found,glass,expectedWalls:walls.size};
 }
 /* Validation of a selection (pure): enough of the candidate's walls are really in the scene, and every opaque target
    material can be adapted. Returns {supported, reason}. */
 function validate(sel,{shader=true}={}){
  if(!sel||!sel.expectedWalls)return {supported:false,reason:'no-candidate'};
  if(!sel.meshes.some(t=>t.kind==='wall'))return {supported:false,reason:'no-targets'};
  if(sel.walls.size<HYBRID.minTargets||sel.walls.size/sel.expectedWalls<HYBRID.minWallShare)return {supported:false,reason:'insufficient-targets'};
  for(const t of sel.meshes)for(const m of materialsOf(t.mesh.material))if(!transparent(m)&&!adaptable(m))return {supported:false,reason:'unsupported-material'};
  if(!shader)return {supported:false,reason:'shader-unavailable'};
  return {supported:true,reason:null};
 }
 // Façade-local frame (world metres) from the elevation descriptor already converted by the 3D view.
 function frameOf(facade){
  const t=facade.tangent,n=facade.normal,lt=Math.hypot(t[0],t[1]||0,t[2])||1,ln=Math.hypot(n[0],n[1]||0,n[2])||1;
  return {center:[...facade.center],tangent:[t[0]/lt,(t[1]||0)/lt,t[2]/lt],normal:[n[0]/ln,(n[1]||0)/ln,n[2]/ln],width:Math.max(.5,facade.width),height:Math.max(.5,facade.height||facade.width)};
 }

 /* ── Shader: sculpted from the donor stone (Sam1983Aing/flat-to-3d @ d7b9b69, 07-sunlit-elevation/engine/elevation.js,
    MIT, Copyright (c) 2026 Samnang Aing — full notice in the file header). Kept from the donor: lineAt / lineFade (pixel-width ink lines with a density fade, no moiré), the sweep
    smoothstep of revealAt, the laser + halo of frontBand, the hatch read from the shadow map (shade = 1 − shadow mask ·
    smoothstep(N·sun)), the paper composite after dithering. Changed for Rubik: the sweep, hatch and band coordinates are
    façade-local (facade centre / tangent / normal of FloorPlanPresentationElevation) instead of donor world xy; the sun
    direction is Rubik's directional light (uniform refreshed from it, never a donor convention); the reveal and the
    technical weight are Story state; the accent is Rubik's; donor material kinds, drafting, wipes, noise, AO and discard
    modes are removed. */
 const VERT_HEAD='varying vec3 vHybridWP;\nvarying vec3 vHybridWN;\n';
 const VERT_BODY=`#include <worldpos_vertex>
 vHybridWP=(modelMatrix*vec4(transformed,1.0)).xyz;
 vHybridWN=normalize(mat3(modelMatrix)*objectNormal);`;
 const FRAG_HEAD=`varying vec3 vHybridWP;
varying vec3 vHybridWN;
uniform float uHybridTech;
uniform float uHybridHatch;
uniform vec4 uHybridSweep;
uniform vec3 uHybridSun;
uniform vec3 uHybridCenter;
uniform vec3 uHybridTangent;
uniform vec3 uHybridNormal;
uniform vec3 uHybridPaper;
uniform vec3 uHybridInk;
uniform vec3 uHybridAccent;
uniform float uHybridPeriod;
uniform float uHybridLinePx;
// façade-local coordinates (metres): a along the façade, b vertical from its centre, c out of the façade
vec3 hybridLocal(vec3 p){vec3 q=p-uHybridCenter;return vec3(dot(q,uHybridTangent),q.y,dot(q,uHybridNormal));}
float hybridSweepS(vec3 l){return dot(l.xy,uHybridSweep.xy);}
float hybridReveal(vec3 l){return 1.0-smoothstep(uHybridSweep.z-uHybridSweep.w,uHybridSweep.z+uHybridSweep.w,hybridSweepS(l));}
float hybridLineAt(float c,float period,float px){float t=c/period,fw=max(fwidth(t),1e-5);float d=abs(fract(t)-0.5);float hw=0.5*px*fw;return 1.0-smoothstep(hw,hw+fw,0.5-d);}
float hybridLineFade(float c,float period,float minPx){float px=period/max(fwidth(c),1e-5);return smoothstep(minPx,minPx*1.8,px);}
float hybridFrontBand(vec3 l){float sd=hybridSweepS(l)-uHybridSweep.z;float w=max(uHybridSweep.w,0.45);
 return clamp(exp(-pow(sd/(w*0.11),2.0))+exp(-pow(sd/(w*0.32),2.0))*0.26,0.0,1.0);}
// façade-plane coordinates of a surface: the face's own plane (front faces: a/b, returns: c/b, horizontal: a/c)
vec2 hybridPlaneUV(vec3 l,vec3 n){vec3 an=vec3(abs(dot(n,uHybridTangent)),abs(n.y),abs(dot(n,uHybridNormal)));if(an.y>0.7)return l.xz;return an.x>an.z?vec2(l.z,l.y):vec2(l.x,l.y);}
`;
 const FRAG_COMPOSITE=`#include <dithering_fragment>
 if(uHybridTech>0.0){
  vec3 hl3=hybridLocal(vHybridWP);vec3 N=normalize(vHybridWN);
  float ndl=dot(N,uHybridSun);
  float lit=getShadowMask()*smoothstep(-0.02,0.06,ndl);
  float shade=1.0-lit;
  vec2 q=hybridPlaneUV(hl3,N);
  vec3 col=uHybridPaper;
  float hl=hybridLineAt(q.x+q.y,uHybridPeriod,uHybridLinePx*0.95);
  float dense=1.0-hybridLineFade(q.x+q.y,uHybridPeriod,3.5);
  hl=mix(hl,0.32,dense);
  col=mix(col,col*0.93,shade);
  col=mix(col,uHybridInk,hl*shade*0.85*uHybridHatch);
  float rv=hybridReveal(hl3);
  vec3 hybridOut=mix(col,gl_FragColor.rgb,rv);
  float fb=uHybridSweep.z>-1e3&&uHybridSweep.z<1e3?hybridFrontBand(hl3):0.0;
  hybridOut=mix(hybridOut,uHybridAccent,clamp(fb*0.8,0.0,0.9));
  gl_FragColor.rgb=mix(gl_FragColor.rgb,hybridOut,uHybridTech);
 }
`;
 // Ink contours (the donor's drafted lines, here derived from the target meshes' own geometry — EdgesGeometry — so they
 // are the same façade, never a second model): visible in the technical part only, cut by the same registered sweep.
 const LINE_FRAG_HEAD=`varying vec3 vHybridWP;
uniform float uHybridTech;
uniform vec4 uHybridSweep;
uniform vec3 uHybridCenter;
uniform vec3 uHybridTangent;
uniform vec3 uHybridNormal;
vec3 hybridLocal(vec3 p){vec3 q=p-uHybridCenter;return vec3(dot(q,uHybridTangent),q.y,dot(q,uHybridNormal));}
float hybridReveal(vec3 l){return 1.0-smoothstep(uHybridSweep.z-uHybridSweep.w,uHybridSweep.z+uHybridSweep.w,dot(l.xy,uHybridSweep.xy));}
`;
 function patchLine(shader,U){
  Object.assign(shader.uniforms,U);
  shader.vertexShader='varying vec3 vHybridWP;\n'+shader.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vHybridWP=(modelMatrix*vec4(transformed,1.0)).xyz;');
  shader.fragmentShader=LINE_FRAG_HEAD+shader.fragmentShader.replace('#include <opaque_fragment>','#include <opaque_fragment>\n gl_FragColor.a*=uHybridTech*(1.0-hybridReveal(hybridLocal(vHybridWP)));');
 }
 function patch(shader,U){
  Object.assign(shader.uniforms,U);
  shader.vertexShader=VERT_HEAD+shader.vertexShader.replace('#include <worldpos_vertex>',VERT_BODY);
  shader.fragmentShader=FRAG_HEAD+shader.fragmentShader
   .replace('#include <shadowmap_pars_fragment>','#include <shadowmap_pars_fragment>\n#include <shadowmask_pars_fragment>')
   .replace('#include <dithering_fragment>',FRAG_COMPOSITE);
 }
 /* Sweep along the façade (pure, the shader's own formula): s = (a, b)·dir with dir = (√½, −√½) in the façade plane — the
    donor's diagonal, from the upper end of the façade to its lower opposite end, now in façade-local metres. The threshold
    travels from before the first corner to beyond the last, so reveal 0 is all technical and 1 all material. */
 const SWEEP_DIR=[Math.SQRT1_2,-Math.SQRT1_2];
 function sweepRange(frame){const a=frame.width/2,b=frame.height/2,ext=Math.abs(SWEEP_DIR[0])*a+Math.abs(SWEEP_DIR[1])*b;return {min:-ext,max:ext};}
 function sweepSoft(frame){return Math.max(.35,Math.min(1.1,(frame.width+frame.height)*.045));}
 function sweepZ(frame,reveal){const r=sweepRange(frame),w=sweepSoft(frame);return reveal<=0?-1e4:reveal>=1?1e4:(r.min-w)+(r.max-r.min+2*w)*reveal;}
 function sweepS(frame,p){const q=[p[0]-frame.center[0],p[1]-frame.center[1],p[2]-frame.center[2]],a=q[0]*frame.tangent[0]+q[1]*frame.tangent[1]+q[2]*frame.tangent[2];return a*SWEEP_DIR[0]+q[1]*SWEEP_DIR[1];}
 // Material weight at a world point for a reveal value (1 material, 0 technical) — the shader's hybridReveal.
 function materialAt(frame,p,reveal){const z=sweepZ(frame,reveal),w=sweepSoft(frame),x=Math.min(1,Math.max(0,(sweepS(frame,p)-(z-w))/(2*w)));return 1-x*x*(3-2*x);}
 // Hatch period from the façade's own size (geometry, fixed for the scene — never the camera): the donor reads ~55 lines
 // across its façade; the same density on a Rubik façade of any width.
 function periodFor(widthM){return Math.min(HYBRID.maxPeriodM,Math.max(HYBRID.minPeriodM,widthM/HYBRID.linesAcross));}
 const SYNC=['map','normalMap','roughnessMap','metalnessMap','aoMap','alphaMap'];
 /* Runtime controller. THREE: the module; targets: selectTargets result (validated); facade: the elevation descriptor in
    world metres (center, tangent, normal, width, height); sun: [x,y,z] direction towards Rubik's directional light;
    linePx: ink line width in device pixels (renderer pixel ratio). */
 function create(THREE,{targets,facade,sun,linePx=1}){
  const frame=frameOf(facade),hex=h=>new THREE.Vector3(((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255);
  const U={uHybridTech:{value:0},uHybridHatch:{value:0},uHybridSweep:{value:new THREE.Vector4(SWEEP_DIR[0],SWEEP_DIR[1],-1e4,sweepSoft(frame))},
   uHybridSun:{value:new THREE.Vector3(...(sun||[0,1,0])).normalize()},uHybridCenter:{value:new THREE.Vector3(...frame.center)},uHybridTangent:{value:new THREE.Vector3(...frame.tangent)},uHybridNormal:{value:new THREE.Vector3(...frame.normal)},
   uHybridPaper:{value:hex(HYBRID.paper)},uHybridInk:{value:hex(HYBRID.ink)},uHybridAccent:{value:hex(HYBRID.accent)},uHybridPeriod:{value:periodFor(frame.width)},uHybridLinePx:{value:1.05*Math.max(1,linePx)}};
  const clones=new Map(); // source material → presentation clone
  const lineMat=new THREE.LineBasicMaterial({color:HYBRID.ink,transparent:true,depthWrite:false,toneMapped:false});lineMat.userData.hybridPresentation=true;
  lineMat.onBeforeCompile=shader=>patchLine(shader,U);lineMat.customProgramCacheKey=()=>HYBRID.cacheKey+'-line';
  const edges=new Map(); // geometry → EdgesGeometry (presentation-owned)
  const lines=[]; // {line, parent}
  const records=[]; // {mesh, kind, original, hybrid}
  const ctl={frame,uniforms:U,clones,records,lines,edges,swapped:false,state:null,created:0,disposed:0,syncs:0,edgesDisposed:0,lineMaterialDisposed:false};
  function cloneOf(src){
   if(transparent(src))return src;
   let c=clones.get(src);if(c)return c;
   c=src.clone();c.clippingPlanes=src.clippingPlanes;c.polygonOffset=true;c.polygonOffsetFactor=1;c.polygonOffsetUnits=1;c.userData={...c.userData,hybridPresentation:true,hybridSource:src.uuid};
   c.extensions={...(c.extensions||{}),derivatives:true};c.onBeforeCompile=shader=>patch(shader,U);c.customProgramCacheKey=()=>HYBRID.cacheKey;
   clones.set(src,c);ctl.created++;return c;
  }
  function unline(){for(const l of lines)l.parent.remove(l.line);lines.length=0;}
  function bind(list){
   records.length=0;unline();
   for(const t of list){const original=t.mesh.material;records.push({mesh:t.mesh,kind:t.kind,original,hybrid:Array.isArray(original)?original.map(cloneOf):cloneOf(original)});
    if(!t.mesh.geometry)continue;let g=edges.get(t.mesh.geometry);if(!g){g=new THREE.EdgesGeometry(t.mesh.geometry,HYBRID.edgeAngleDeg);edges.set(t.mesh.geometry,g);ctl.edgesCreated=(ctl.edgesCreated||0)+1;}
    const line=new THREE.LineSegments(g,lineMat);line.userData.hybridPresentation=true;line.visible=false;line.renderOrder=2;t.mesh.add(line);lines.push({line,parent:t.mesh});}
  }
  bind(targets.meshes);
  ctl.attached=isIn=>records.every(r=>isIn(r.mesh));
  ctl.rebind=list=>{const was=ctl.swapped;if(was)ctl.swap(false);bind(list);if(was)ctl.swap(true);};
  ctl.swap=on=>{if(ctl.swapped===on)return;for(const r of records)r.mesh.material=on?r.hybrid:r.original;for(const l of lines)l.line.visible=on;ctl.swapped=on;};
  // A source material that SurfaceRenderer finished later (maps, colour) is mirrored into its clone, never the reverse.
  ctl.sync=()=>{for(const [src,c] of clones){let changed=false;for(const k of SYNC)if(c[k]!==src[k]){c[k]=src[k];changed=true;}
   if(!c.color.equals(src.color)){c.color.copy(src.color);changed=true;}if(c.roughness!==src.roughness||c.metalness!==src.metalness){c.roughness=src.roughness;c.metalness=src.metalness;changed=true;}
   if(c.clippingPlanes!==src.clippingPlanes){c.clippingPlanes=src.clippingPlanes;changed=true;}
   if(changed){c.needsUpdate=true;ctl.syncs++;}}};
  // h: the Story's hybrid state at p (plain data); sunNow: Rubik's current light direction (solar snapshot included).
  ctl.apply=(h,sunNow)=>{
   ctl.state=h?{...h}:null;const on=!!h&&h.active;
   if(sunNow&&sunNow.every(Number.isFinite))U.uHybridSun.value.set(...sunNow).normalize();
   U.uHybridTech.value=on?h.technicalMix:0;U.uHybridHatch.value=on?h.hatchStrength:0;U.uHybridSweep.value.z=on?sweepZ(frame,h.materialReveal):1e4;
   if(on)ctl.sync();ctl.swap(on);
  };
  ctl.end=()=>{ctl.swap(false);for(const r of records)r.mesh.material=r.original;records.length=0;unline();for(const c of clones.values()){c.dispose();ctl.disposed++;}clones.clear();
   for(const g of edges.values()){g.dispose();ctl.edgesDisposed++;}ctl.edgesCreated=ctl.edgesCreated||0;edges.clear();lineMat.dispose();ctl.lineMaterialDisposed=true;ctl.state=null;};
  ctl.info=()=>({targets:records.length,walls:records.filter(r=>r.kind==='wall').length,openings:records.filter(r=>r.kind==='opening').length,clones:clones.size,lines:lines.length,edgeGeometries:edges.size,edgesCreated:ctl.edgesCreated||0,edgesDisposed:ctl.edgesDisposed,lineMaterialDisposed:ctl.lineMaterialDisposed,swapped:ctl.swapped,created:ctl.created,disposed:ctl.disposed,syncs:ctl.syncs,
   maps:[...clones].map(([src,c])=>({source:src.uuid,map:!!src.map,normalMap:!!src.normalMap,roughnessMap:!!src.roughnessMap,sameMap:c.map===src.map,sameNormal:c.normalMap===src.normalMap,sameRoughness:c.roughnessMap===src.roughnessMap})),
   state:ctl.state&&{...ctl.state},uniforms:{tech:U.uHybridTech.value,hatch:U.uHybridHatch.value,sweepZ:U.uHybridSweep.value.z,sweepSoft:U.uHybridSweep.value.w,period:U.uHybridPeriod.value,sun:U.uHybridSun.value.toArray()},
   frame:{...frame,center:[...frame.center],tangent:[...frame.tangent],normal:[...frame.normal]}});
  return ctl;
 }
 return {HYBRID,selectTargets,validate,frameOf,periodFor,sweepRange,sweepSoft,sweepZ,sweepS,materialAt,create,keyOf,SWEEP_DIR};
});
