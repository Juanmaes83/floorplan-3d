/* Sculpture phase B — PROVE THE STONE (temporary harness, removed in phase E).
   Runs js/vendor/donor-elevation-stone.mjs unmodified on Three r160 in Chromium with a minimal synthetic façade (a wall
   with a recess and a projecting slab, so there is a real cast shadow) lit by one shadow-casting directional light.
   Proves: (1) the stone compiles; (2) technical state = paper + hatch exactly where the shadow map / back-facing light
   says shade; (3) the material reveal exists; (4) the reveal is registered in world space: two different cameras (pose
   and FOV) see the same world points on the same side of the boundary; (5) reverse: returning to the same uniforms
   gives the same pixels. Writes PNGs + proof.json to <out>.
   usage: node scripts/qa/hybrid-elevation-stone-proof.cjs <root> <out> */
const path=require('node:path'),fs=require('node:fs/promises'),{createServer}=require('node:http');
const {chromium}=require('playwright');const [root,out]=process.argv.slice(2);
const three=require(path.join(root,'tests/helpers/three-module.cjs'));
const PAGE=`<!doctype html><html><body style="margin:0;background:#fff"><canvas id="gl" width="640" height="400"></canvas>
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script>
<script type="module">
import * as THREE from 'three';import {applyStone} from '/js/vendor/donor-elevation-stone.mjs';
const r=new THREE.WebGLRenderer({canvas:document.getElementById('gl'),antialias:false,preserveDrawingBuffer:true});r.setSize(640,400,false);r.shadowMap.enabled=true;
const scene=new THREE.Scene();scene.background=new THREE.Color(0xffffff);
const sun=new THREE.DirectionalLight(0xffffff,3);const sunDir=new THREE.Vector3(-1,1,1).normalize();sun.position.copy(sunDir).multiplyScalar(30);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
Object.assign(sun.shadow.camera,{left:-10,right:10,top:10,bottom:-10,near:1,far:80});sun.shadow.camera.updateProjectionMatrix();scene.add(sun,sun.target,new THREE.HemisphereLight(0xffffff,0x888888,.6));
const raw=h=>new THREE.Vector3(((h>>16)&255)/255,((h>>8)&255)/255,(h&255)/255);
const U={uSun:{value:sunDir.clone()},uSweep:{value:new THREE.Vector4(Math.SQRT1_2,-Math.SQRT1_2,-999,.8)},uReal:{value:0},uPaper:{value:raw(0xf2efe7)},uInk:{value:raw(0x1d1c19)},uAccent:{value:raw(0xe85d04)},
 uHatch:{value:.25},uLinePx:{value:1.05},uDraw:{value:1},uDrawSpan:{value:new THREE.Vector2(0,12)},uDrawDir:{value:new THREE.Vector2(0,1)},uHatchIn:{value:1},uWipe:{value:new THREE.Vector2(-12,8)},uDetailIn:{value:1},uDepthCue:{value:0},uBump:{value:1.25}};
const m=applyStone(new THREE.MeshStandardMaterial({color:0xb5552f,roughness:.8}),U);
const add=(w,h,d,x,y,z)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;scene.add(o);return o;};
add(10,6,.3,0,3,0);add(10,.2,1.5,0,4,.85); // façade in plane z = 0.15 facing +z, a projecting slab casting a shadow
add(2,2.5,.4,2.5,1.25,.35); // a pier
const camA=new THREE.PerspectiveCamera(4,640/400,1,500);camA.position.set(0,3,130);camA.lookAt(0,3,0);
const camB=new THREE.PerspectiveCamera(30,640/400,.5,500);camB.position.set(6,4,16);camB.lookAt(0,3,0);
function render(cam,sweepZ,real){U.uSweep.value.z=sweepZ;U.uReal.value=real;r.render(scene,cam);}
function px(cam,p){const v=new THREE.Vector3(...p).project(cam);const x=Math.round((v.x+1)/2*639),y=Math.round((1-v.y)/2*399);const g=r.getContext(),b=new Uint8Array(4);g.readPixels(x,399-y,1,1,g.RGBA,g.UNSIGNED_BYTE,b);return [...b.slice(0,3)];}
window.proof={render,px,camA,camB,program:()=>{r.compile(scene,camA);const p=r.properties.get(m).currentProgram;return {runnable:p?.diagnostics?.runnable??true,programs:r.info.programs.length};}};
window.ready=true;
</script></body></html>`;
(async()=>{
 await fs.mkdir(out,{recursive:true});
 const server=createServer(async(req,res)=>{try{const u=new URL(req.url,'http://l').pathname;if(u==='/')return res.end(PAGE);res.setHeader('Content-Type','text/javascript');res.end(await fs.readFile(path.join(root,u)));}catch{res.statusCode=404;res.end();}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url=`http://127.0.0.1:${server.address().port}/`;
 const browser=await chromium.launch({executablePath:process.env.CHROME,args:['--no-sandbox','--enable-unsafe-swiftshader']});const page=await browser.newPage({viewport:{width:640,height:400}});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'||m.type()==='warning')errors.push(m.text());});
 await page.route('**/*',async r=>{const t=r.request().url();if(t.startsWith('https://cdn.jsdelivr.net/npm/three@0.160.0/'))return r.fulfill({contentType:'text/javascript',headers:{'access-control-allow-origin':'*'},body:await three(t,()=>{throw Error('no local three');})});return r.continue();});
 await page.goto(url);await page.waitForFunction(()=>window.ready,null,{timeout:60000});
 const shot=async n=>page.locator('#gl').screenshot({path:path.join(out,n+'.png')});
 const res=await page.evaluate(()=>{const P=window.proof,o={};o.compile=P.program();
  // world points on the façade plane (z = 0.15): left (s low) / right (s high) of the diagonal sweep s = (x - y)/√2
  const L=[-3.5,4.5,.151],R=[4.4,.7,.151],LIT=[-3.5,2,.151],SHADE=[-3.5,3.6,.151];
  P.render(P.camA,-999,0);o.techLit=P.px(P.camA,LIT);o.techShade=P.px(P.camA,SHADE);
  P.render(P.camA,999,0);o.matLit=P.px(P.camA,LIT);
  const mid=0;for(const cam of ['camA','camB']){P.render(P[cam],mid,0);o[cam]={left:P.px(P[cam],L),right:P.px(P[cam],R)};}
  P.render(P.camA,-2,0);const a1=P.px(P.camA,L);P.render(P.camA,3,0);P.render(P.camA,-2,0);o.reverse=[a1,P.px(P.camA,L)];
  return o;});
 for(const [n,z,cam] of [['tech',-999,'camA'],['mid-camA',0,'camA'],['mid-camB',0,'camB'],['material',999,'camA']]){await page.evaluate(([z,cam])=>window.proof.render(window.proof[cam],z,0),[z,cam]);await shot(n);}
 const dist=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i])),paper=[242,239,231];
 const checks={compiles:res.compile.runnable!==false&&!errors.some(e=>/shader|program/i.test(e)),
  technicalPaperWhereLit:dist(res.techLit,paper)<12,technicalHatchOrDarkerWhereShade:dist(res.techShade,paper)>=6,materialDiffers:dist(res.matLit,paper)>30,
  revealRegisteredCamA:dist(res.camA.left,paper)>30&&dist(res.camA.right,paper)<40,revealRegisteredCamB:dist(res.camB.left,paper)>30&&dist(res.camB.right,paper)<40,reverseIdentical:dist(...res.reverse)===0};
 await fs.writeFile(path.join(out,'proof.json'),JSON.stringify({checks,res,errors},null,1));console.log(JSON.stringify({checks,errors:errors.length}));
 await browser.close();server.close();process.exit(Object.values(checks).every(Boolean)?0:1);
})().catch(e=>{console.error(e);process.exit(1);});
