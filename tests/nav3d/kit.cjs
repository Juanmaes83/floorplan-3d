'use strict';
/* NAV3D V1 · utilidades de navegador: editor real (servidor local, Chromium de Playwright, sin red), proyectos SINTÉTICOS
   (una vivienda con un armario empotrado inaccesible y el edificio de dos plantas de las pruebas multiplanta). */
const K=require('../r02a/editor-kit.cjs');
const C=require('../../js/project-core.js'),L=require('../../js/room-layout.js');
const B=require('../../js/building-core.js'),P=require('../../js/project-package.js'),T=require('../../js/tracing-core.js');
const F=require('../fixtures/building-fixture.cjs');
const KEY='rubik-sota-project-library-v1';

// Salón y, aparte, un armario empotrado de 50 × 50 cm: dentro del armario no cabe una persona (muros a < 30 cm).
function closetProject(){
  let p=L.blank('Vivienda sintética con armario');p.id='prj_nav3d-closet';
  p=L.create(p,{name:'Salón',width:4200,depth:3200,x:400,y:400}).project;
  p=L.create(p,{name:'Armario empotrado',width:500,depth:500,x:5200,y:400}).project;
  C.validate(p,{strict:true});return p;
}
async function buildingZip(){const fx=F.build();const {entries}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo);return Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer());}
async function importFile(page,file,check){const before=await page.evaluate(k=>JSON.parse(localStorage.getItem(k))?.activeId||null,KEY);
  await page.locator('#uploadIn').setInputFiles(file);
  await page.waitForFunction(([k,id,check])=>{const lib=JSON.parse(localStorage.getItem(k));return lib&&lib.activeId!==id&&(check!=='building'||FloorPlanBuildingUI.context?.levels===2);},[KEY,before,check],{timeout:60000});}
const importBuilding=async page=>importFile(page,{name:'edificio.zip',mimeType:'application/zip',buffer:await buildingZip()},'building');
const importProject=(page,p)=>importFile(page,{name:'vivienda.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(p))},'project');
// Lo que la navegación no debe tocar: el proyecto en pantalla, el historial y la biblioteca guardada.
const snapshot=page=>page.evaluate(k=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,redo:redoStack.length,library:localStorage.getItem(k)}),KEY);
async function open3D(page){await page.locator('#viewSeg .btn[data-view="3d"]').click();
  await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating&&View3D.navState?.available&&!View3D.navState.busy&&!document.querySelector('#nav3d').hidden&&document.querySelector('#nav3dRoom').options.length>1,null,{timeout:60000});}
const settled=page=>page.waitForFunction(()=>View3D.navState?.available&&!View3D.navState.busy,null,{timeout:30000});
// Coloca la cámara del paseo en un punto del plano (mm) mirando a otro, como si la persona hubiera caminado hasta allí.
const standAt=(page,at,look)=>page.evaluate(([at,look])=>{const g=View3D.renderedGeometry,st=View3D.presentationPose(),yaw=Math.atan2(-(look[0]-at[0]),-(look[1]-at[1]));
  View3D.presentationRestorePose({...st,position:[(at[0]-g.center.x)/1000,1.6,(at[1]-g.center.y)/1000],quaternion:[0,Math.sin(yaw/2),0,Math.cos(yaw/2)]});},[at,look]);
const box=(page,sel)=>page.locator(sel).evaluate(n=>{const r=n.getBoundingClientRect();return {left:r.left,top:r.top,right:r.right,bottom:r.bottom,width:r.width,height:r.height};});
const overlaps=(a,b)=>!!a&&!!b&&a.width>0&&b.width>0&&a.left<b.right&&b.left<a.right&&a.top<b.bottom&&b.top<a.bottom;
const hScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
module.exports={...K,KEY,closetProject,importBuilding,importProject,snapshot,open3D,settled,standAt,box,overlaps,hScroll};
