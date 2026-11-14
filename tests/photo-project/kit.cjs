'use strict';
/* De fotografía a proyecto V1 (FOT-01 + MUE-01) · utilidades de prueba. Fotos SINTÉTICAS dibujadas por Chromium en un
   lienzo (formas y colores, sin personas ni datos reales). El JPEG «con EXIF» lleva un bloque APP1 falso con una
   ubicación inventada, para comprobar que RUBIK lo elimina. */
const K=require('../r02a/editor-kit.cjs');
const KEY='rubik-sota-project-library-v1';
function watch(page,base){const w={errors:[],external:[]};page.on('pageerror',e=>w.errors.push(e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))w.errors.push(m.text());});
  page.on('request',r=>{const u=r.url();if(!u.startsWith(base)&&!/^(data|blob):/.test(u))w.external.push(u);});return w;}
// Lo que no debe cambiar sin una acción de la persona: el proyecto, el historial y la biblioteca guardada.
const snapshot=page=>page.evaluate(k=>({project:JSON.stringify(FloorPlanApp.project),undo:undoStack.length,redo:redoStack.length,library:localStorage.getItem(k)}),KEY);
const hScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1);
async function open3D(page){await page.locator('#viewSeg .btn[data-view="3d"]').click();
  await page.waitForFunction(()=>FloorPlanApp.viewMode==='3d'&&!View3D.lifecycleMetrics.animating,null,{timeout:60000});}
const FAKE_GPS='GPS 40.4168N 3.7038W SINTETICO';
// Dibuja una «foto» sintética (un mueble esquemático sobre un fondo) y la devuelve como Buffer.
async function synthPhoto(browser,{w=1200,h=900,type='image/jpeg',label='SOFA'}={}){
  const ctx=await browser.newContext(),page=await ctx.newPage();
  try{
    const b64=await page.evaluate(async([w,h,type,label])=>{const c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');
      const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'#e9e4da');g.addColorStop(1,'#b9ad9b');x.fillStyle=g;x.fillRect(0,0,w,h);
      x.fillStyle='#6d7f8c';x.fillRect(w*.15,h*.45,w*.7,h*.3);x.fillStyle='#55636d';x.fillRect(w*.15,h*.35,w*.7,h*.14);x.fillRect(w*.12,h*.4,w*.08,h*.35);x.fillRect(w*.8,h*.4,w*.08,h*.35);
      x.fillStyle='#3b2f25';for(const fx of [.2,.78])x.fillRect(w*fx,h*.75,w*.03,h*.06);x.fillStyle='#1f1d1a';x.font=`700 ${Math.round(h/12)}px sans-serif`;x.fillText(label+' · FOTO SINTÉTICA',w*.05,h*.12);
      const blob=await new Promise(r=>c.toBlob(r,type,.9));const buf=new Uint8Array(await blob.arrayBuffer());let s='';for(const b of buf)s+=String.fromCharCode(b);return btoa(s);},[w,h,type,label]);
    return Buffer.from(b64,'base64');
  }finally{await ctx.close();}
}
// Inserta un APP1 «Exif» con una ubicación falsa justo después del SOI de un JPEG.
function withExif(jpeg){
  if(jpeg[0]!==0xff||jpeg[1]!==0xd8)throw Error('no es JPEG');
  const tiff=Buffer.concat([Buffer.from('II*\0',  'binary'),Buffer.from([8,0,0,0]),Buffer.from([0,0]),Buffer.from([0,0,0,0]),Buffer.from(FAKE_GPS,'ascii')]);
  const payload=Buffer.concat([Buffer.from('Exif\0\0','binary'),tiff]),len=payload.length+2;
  return Buffer.concat([jpeg.subarray(0,2),Buffer.from([0xff,0xe1,len>>8,len&255]),payload,jpeg.subarray(2)]);
}
const file=(name,buffer,mimeType)=>({name,mimeType,buffer});
// Bytes guardados en IndexedDB para una clave (para comprobar que no hay metadatos).
const storedBytes=(page,key)=>page.evaluate(async key=>{const b=await FloorPlanImages.get(key);if(!b)return null;return [...new Uint8Array(await b.arrayBuffer())];},key);
module.exports={...K,KEY,watch,snapshot,hScroll,open3D,FAKE_GPS,synthPhoto,withExif,file,storedBytes};
