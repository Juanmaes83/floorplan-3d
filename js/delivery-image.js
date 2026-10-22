/* Delivery image: the picture a professional sends to a client (WhatsApp, e-mail, portal). Unlike a technical 3D
   capture, the home fills the picture and the information sits in its own band, never over the home. It only uses
   data that exists in the project and the professional's brand: nothing is invented, a missing datum is omitted (no
   empty placeholder), surfaces are always «aprox.» and there is no location (Rubik does not store one). */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanDeliveryImage=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 // Output formats. The image area keeps the home's aspect from the 3D camera; the band is extra canvas, not an overlay.
 const FORMATS={landscape:{w:1600,h:1000,image:{w:1600,h:780}},portrait:{w:1080,h:1350,image:{w:1080,h:1000}}};
 const clean=v=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim();
 // Bounded text: a cut is always marked with «…», never a silent truncation.
 const cap=(v,n)=>{const s=clean(v);return s.length>n?s.slice(0,n-1).trimEnd()+'…':s;};
 function shoelace(poly){let a=0;for(let i=0;i<poly.length;i++){const [x1,y1]=poly[i],[x2,y2]=poly[(i+1)%poly.length];a+=x1*y2-x2*y1;}return Math.abs(a)/2;}
 const fmtArea=m2=>m2.toLocaleString('es-ES',{minimumFractionDigits:0,maximumFractionDigits:m2<100?1:0});
 // What the image says. rooms: [{poly:[[mm,mm]…], counted}] of what is shown (one level or the whole home).
 // Returns only the lines that have data; texts are bounded so a long name cannot push the home out.
 function content({title,view,level,rooms=[],brand=null,lang='es'}={}){
  const counted=rooms.filter(r=>r&&r.counted!==false&&Array.isArray(r.poly)&&r.poly.length>=3);
  const area=counted.reduce((a,r)=>a+shoelace(r.poly),0)/1e6;
  const facts=[];
  if(counted.length)facts.push(counted.length===1?'1 estancia':`${counted.length} estancias`);
  if(area>=1)facts.push(`Superficie útil aprox. ${fmtArea(area)} m²`);
  const t=cap(title,90),v=cap(view,60),l=cap(level,40);
  const b=brand&&clean(brand.name)?{name:cap(brand.name,60),logo:brand.logo||null,contact:cap(brand.contact,80)||null}:null;
  return {title:t||null,view:[l,v].filter(Boolean).join(' · ')||null,facts,brand:b,
   note:b?'Imagen orientativa · medidas aproximadas':'Imagen orientativa creada con Rubik Sota · medidas aproximadas'};
 }
 // Canvas drawing (browser only). layout 'band' (B: image, then a band) or 'header' (C: header, image, footer).
 async function compose({image,format='landscape',layout='band',data}){
  const F=FORMATS[format];if(!F)throw Error('Formato no válido');
  const c=document.createElement('canvas');c.width=F.w;c.height=F.h;const x=c.getContext('2d');
  const img=new Image();img.src=image;await img.decode();
  x.fillStyle='#f4f5f3';x.fillRect(0,0,F.w,F.h);
  const S=F.w/1600,font=(wgt,px)=>`${wgt} ${Math.round(px*S*(format==='portrait'?1.35:1))}px Inter, Arial, sans-serif`;
  const fit=(s,max,f)=>{x.font=f;if(x.measureText(s).width<=max)return s;while(s.length>1&&x.measureText(s+'…').width>max)s=s.slice(0,-1);return s.trimEnd()+'…';};
  const pad=Math.round(48*S*(format==='portrait'?1.2:1));
  let imgY,bandY,bandH;
  if(layout==='header'){
   const headH=Math.round((F.h-F.image.h)*.5);imgY=headH;bandY=headH+F.image.h;bandH=F.h-bandY;
   x.drawImage(img,0,imgY,F.image.w,F.image.h);
   x.fillStyle='#1f2326';x.textBaseline='middle';
   if(data.title){x.font=font(650,40);x.fillText(fit(data.title,F.w-pad*2,font(650,40)),pad,headH*.42);}
   if(data.view){x.fillStyle='#5b6266';x.fillText(fit(data.view,F.w-pad*2,font(500,26)),pad,headH*(data.title?.78:.5));}
   await footer(x,{y:bandY,h:bandH,w:F.w,pad,font,fit,data,withFacts:true});
  }else{
   imgY=0;bandY=F.image.h;bandH=F.h-bandY;
   x.drawImage(img,0,0,F.image.w,F.image.h);
   x.fillStyle='#ffffff';x.fillRect(0,bandY,F.w,bandH);x.fillStyle='#d5d9db';x.fillRect(0,bandY,F.w,2);
   const portrait=format==='portrait',brandW=data.brand?(portrait?F.w-pad*2:Math.round(F.w*.34)):0;
   const textW=portrait?F.w-pad*2:F.w-pad*2-(brandW?brandW+pad:0);
   let y=bandY+Math.round(bandH*(portrait?.16:.24));x.textBaseline='middle';
   if(data.title){x.fillStyle='#1f2326';x.fillText(fit(data.title,textW,font(650,38)),pad,y);y+=Math.round(50*S*(portrait?1.35:1));}
   if(data.view){x.fillStyle='#2f6f78';x.fillText(fit(data.view,textW,font(600,26)),pad,y);y+=Math.round(38*S*(portrait?1.35:1));}
   if(data.facts.length){x.fillStyle='#4a5256';x.fillText(fit(data.facts.join(' · '),textW,font(500,24)),pad,y);y+=Math.round(36*S*(portrait?1.35:1));}
   x.fillStyle='#7a8286';x.fillText(fit(data.note,textW,font(400,18)),pad,portrait&&data.brand?y:bandY+bandH-Math.round(26*S*(portrait?1.35:1)));
   if(data.brand){const bx=portrait?pad:F.w-pad-brandW,by=portrait?bandY+bandH-Math.round(bandH*.30):bandY+Math.round(bandH*.18),bh=portrait?Math.round(bandH*.24):Math.round(bandH*.64);
    await brandBlock(x,{x:bx,y:by,w:brandW,h:bh,font,fit,brand:data.brand,align:portrait?'left':'right'});}
  }
  return {dataUrl:c.toDataURL('image/png'),width:F.w,height:F.h,image:{x:0,y:imgY,w:F.image.w,h:F.image.h}};
 }
 async function footer(x,{y,h,w,pad,font,fit,data}){
  x.fillStyle='#ffffff';x.fillRect(0,y,w,h);x.fillStyle='#d5d9db';x.fillRect(0,y,w,2);x.textBaseline='middle';
  const brandW=data.brand?Math.round(w*.4):0,textW=w-pad*2-(brandW?brandW+pad:0);
  if(data.facts.length){x.fillStyle='#4a5256';x.fillText(fit(data.facts.join(' · '),textW,font(500,24)),pad,y+h*.38);}
  x.fillStyle='#7a8286';x.fillText(fit(data.note,textW,font(400,18)),pad,y+h*(data.facts.length?.7:.5));
  if(data.brand)await brandBlock(x,{x:w-pad-brandW,y:y+h*.18,w:brandW,h:h*.64,font,fit,brand:data.brand,align:'right'});
 }
 async function brandBlock(x,{x:bx,y,w,h,font,fit,brand,align}){
  let left=bx,textW=w;
  if(brand.logo){try{const logo=new Image();logo.src=brand.logo;await logo.decode();const lh=Math.min(h,96),lw=Math.min(lh*2.6,logo.width*lh/logo.height);
   const lx=align==='right'?bx+w-lw:bx;x.drawImage(logo,lx,y+(h-lh)/2,lw,lh);textW=w-lw-16;if(align!=='right')left=bx+lw+16;}catch{}}
  x.textBaseline='middle';x.textAlign=align==='right'&&!brand.logo?'right':'left';const tx=align==='right'&&!brand.logo?bx+w:left;
  if(align==='right'&&brand.logo){x.textAlign='right';}
  const rx=align==='right'&&brand.logo?bx+textW:tx;
  x.fillStyle='#1f2326';x.fillText(fit(brand.name,textW,font(650,28)),rx,y+h*(brand.contact?.36:.5));
  if(brand.contact){x.fillStyle='#4a5256';x.fillText(fit(brand.contact,textW,font(500,20)),rx,y+h*.72);}
  x.textAlign='left';
 }
 return {FORMATS,content,compose,shoelace};
});
