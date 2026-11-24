'use strict';
// UX-312 PERLA · Entregar (maqueta c96888ac): cada ficha muestra una acción; las demás están en su panel de detalle.
// Esta prueba abre antes el panel de la ficha (tests/helpers-perla-entregar.cjs). La acción y su efecto no cambian.
const {abrirFicha,accion}=require('../helpers-perla-entregar.cjs');
/* CAT-IA · utilidades de navegador compartidas por las pruebas y por scripts/qa/record-cat-ia-v1.cjs. */
const fs=require('node:fs');
// Synthetic kitchen photo (no people, no real place): wall, window (left), oven slot (right), floor.
async function synthKitchen(browser){const ctx=await browser.newContext(),page=await ctx.newPage();
 try{const b64=await page.evaluate(async()=>{const w=1200,h=900,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
  x.fillStyle='#e8e2d6';x.fillRect(0,0,w,h);x.fillStyle='#b8a48a';x.fillRect(0,h*.72,w,h*.28);
  x.fillStyle='#9cc4e4';x.fillRect(w*.06,h*.15,w*.18,h*.3);x.strokeStyle='#ffffff';x.lineWidth=14;x.strokeRect(w*.06,h*.15,w*.18,h*.3);x.beginPath();x.moveTo(w*.15,h*.15);x.lineTo(w*.15,h*.45);x.stroke();
  x.fillStyle='#ffffff';x.fillRect(w*.35,h*.45,w*.55,h*.27);x.fillStyle='#4a4a4a';x.fillRect(w*.35,h*.42,w*.55,h*.03);
  x.fillStyle='#2a2a2a';x.fillRect(w*.58,h*.47,w*.16,h*.22);x.fillStyle='#1d1d1f';x.font='700 54px sans-serif';x.fillText('COCINA · FOTO SINTÉTICA',w*.3,h*.1);
  const blob=await new Promise(r=>c.toBlob(r,'image/jpeg',.9));const buf=new Uint8Array(await blob.arrayBuffer());let s='';for(const b of buf)s+=String.fromCharCode(b);return btoa(s);});
  return Buffer.from(b64,'base64');}finally{await ctx.close();}}
async function loadPilot(page,touch){const go=l=>touch?l.tap():l.click();await go(page.locator('#workArea-studio'));const b=page.locator('#catalogOpen');await b.waitFor();await b.scrollIntoViewIfNeeded();await go(b);
 await page.locator('#catalogLoadPilot').click();await page.waitForFunction(()=>document.querySelector('#catalogDialog').dataset.imported==='5');await page.locator('#catalogClose').click();}
async function openStudio(page,touch){const go=l=>touch?l.tap():l.click();await go(page.locator('#workArea-deliver'));const b=await accion(page,'#visualStudioCard');await b.scrollIntoViewIfNeeded();await go(b);await page.locator('#visualStudioDialog[open]').waitFor();}
async function dragZone(page,[x0,y0],[x1,y1]){const c=page.locator('#vsStageCanvas');await c.scrollIntoViewIfNeeded();const b=await c.boundingBox();
 await page.mouse.move(b.x+b.width*x0,b.y+b.height*y0);await page.mouse.down();await page.mouse.move(b.x+b.width*(x0+x1)/2,b.y+b.height*(y0+y1)/2,{steps:4});await page.mouse.move(b.x+b.width*x1,b.y+b.height*y1,{steps:4});await page.mouse.up();}
async function sheetOf(page){const [d]=await Promise.all([page.waitForEvent('download'),page.locator('#vsSheet').click()]);return JSON.parse(fs.readFileSync(await d.path(),'utf8'));}
// Rotated copy of the sample plan (same helper as the UX-12 property test): every wall, room and object turned by deg.
function rotatedProject(deg,dx=0,dy=0){const C=require('../../js/project-core.js'),q=C.clone(C.initial()),a=deg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),T=pt=>({x:Math.round(pt.x*c-pt.y*s+dx),y:Math.round(pt.x*s+pt.y*c+dy)});
 for(const w of q.walls){w.start=T(w.start);w.end=T(w.end);}for(const r of q.rooms){r.polygon=r.polygon.map(T);if(r.labelAt)r.labelAt=T(r.labelAt);}
 for(const o of q.objects){o.position=T(o.position);o.rotationDeg=((Math.round(o.rotationDeg+deg)%360)+360)%360;}q.measurements=[];
 for(let k=0;k<30;k++){try{C.validate(q);return q;}catch(e){const m=/openings\/([^:]+):/.exec(e.message);if(!m)throw e;q.openings=q.openings.filter(o=>o.id!==m[1]);}}throw Error('rotated plan not valid');}
module.exports={synthKitchen,loadPilot,openStudio,dragZone,sheetOf,rotatedProject};
