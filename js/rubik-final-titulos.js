/* HERO FINAL universal · títulos de cierre integrados (UMD, sin three ni DOM salvo el lienzo 2D que se le pasa).
 *
 * Un ÚNICO contrato de composición para todos los consumidores: el vídeo exportado de la Evolución, la previsualización de
 * STUDIO «Personalización HERO FINAL» y los siguientes (Dibujo vivo, Simulator B, Section, Recorrer…).
 *   composicion(firma,{W,H,estilo,medir,logo}) → cajas deterministas (posición, tipografía, límites) en píxeles del lienzo;
 *   pintar(x,W,H,firma,{progreso,estilo,logo}) → dibuja esas cajas con la aparición escalonada.
 * La previsualización y el vídeo descargado llaman a la MISMA función: proporciones del logo, límites de texto, encuadre y
 * firma coinciden por construcción (escala relativa a la altura del lienzo).
 *
 * Estilos:
 *   cine       títulos sobre el plano, abajo a la izquierda, velo inferior y sombra suave (sin caja);
 *   editorial  columna clara a la izquierda, tipografía con serifa, la vivienda respira a la derecha.
 */
(function(root,factory){const api=factory(root.RubikFinalCore||(typeof require==='function'?require('./final-core.cjs'):null));
 if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikFinalTitulos=api;})(typeof globalThis!=='undefined'?globalThis:this,function(C){
 'use strict';
 const VERSION='rubik-final-titulos/1';
 const ESTILOS=Object.freeze(['cine','editorial']);
 const SANS='Inter, "Helvetica Neue", Arial, sans-serif',SERIF='Georgia, "Times New Roman", serif';
 const LOGO=Object.freeze({maxW:240,maxH:60});// px a 900 de alto; el logo conserva su proporción y nunca se deforma
 const suave=x=>{x=Math.max(0,Math.min(1,x));return x*x*x*(x*(x*6-15)+10);};
 const escalon=C?.escalon||((f,i,n)=>{const a=i/(n+1),b=a+2/(n+1);return suave((f-a)/(b-a));});

 /** Ajusta un texto a un ancho: reduce el cuerpo hasta `min` y, si aún no cabe, recorta con «…». */
 function ajustar(medir,texto,{peso,cuerpo,min,familia,ancho,sp=0}){
  let c=cuerpo;const f=c=>`${peso} ${c}px ${familia}`,w=c=>medir(f(c),texto)+sp*texto.length;
  while(c>min&&w(c)>ancho)c-=1;
  let t=texto;if(w(c)>ancho){while(t.length>1&&medir(f(c),t+'…')+sp*(t.length+1)>ancho)t=t.slice(0,-1);t=t.trimEnd()+'…';}
  return {texto:t,font:f(c),cuerpo:c,ancho:Math.min(ancho,w(c))};}
 /** Título en hasta 2 líneas, cortando por palabras; si no cabe, reduce y por último recorta. */
 function ajustarTitulo(medir,texto,{peso,cuerpo,min,familia,ancho}){
  for(let c=cuerpo;c>=min;c-=2){const f=`${peso} ${c}px ${familia}`,pal=texto.split(/\s+/);const lin=[''];
   for(const p of pal){const prueba=(lin[lin.length-1]+' '+p).trim();if(medir(f,prueba)<=ancho||!lin[lin.length-1])lin[lin.length-1]=prueba;else lin.push(p);}
   if(lin.length<=2&&lin.every(l=>medir(f,l)<=ancho))return {lineas:lin,font:f,cuerpo:c};}
  const a=ajustar(medir,texto,{peso,cuerpo:min,min,familia,ancho});return {lineas:[a.texto],font:a.font,cuerpo:min};}

 /**
  * Composición determinista. `medir(font,texto)` → ancho en px (en el navegador, measureText; en pruebas, un medidor fijo).
  * `logo` = {w,h} naturales o null. Devuelve {estilo,escala,fondo,lineas:[{tipo,texto?,font?,color,x,y,w,h,sp?,sombra}]}.
  */
 function composicion(firma,{W,H,estilo='cine',medir,logo=null}){
  if(!ESTILOS.includes(estilo))estilo='cine';if(!(W>0&&H>0))throw new Error('Lienzo no válido');
  const vertical=H>W,s=vertical?Math.min(H/900,W/430):Math.min(H/900,W/1440),ed=estilo==='editorial';
  // En vertical (móvil, redes) la columna ocupa todo el ancho; en editorial el panel claro pasa a la mitad inferior.
  const margen=Math.round((vertical?24:ed?64:72)*s),colW=vertical?W:ed?Math.round(Math.max(W*0.36,380*s)):Math.round(Math.min(W*0.56,880*s)),ancho=colW-2*margen;
  const tinta=ed?'#24211d':'#ffffff',suaveT=ed?'rgba(36,33,29,.74)':'rgba(255,255,255,.86)',acento=ed?'#8a5a1f':'#f3d9a8';
  const fam=ed?SERIF:SANS,sombra=!ed;
  const items=[];
  if(firma.logo&&logo&&logo.w>0&&logo.h>0){const k=Math.min(LOGO.maxW*s/logo.w,LOGO.maxH*s/logo.h);items.push({tipo:'logo',w:Math.round(logo.w*k),h:Math.round(logo.h*k),hueco:0});}
  const linea=(texto,o)=>{if(!texto)return;const a=ajustar(medir,o.mayus?texto.toUpperCase():texto,{...o,ancho});items.push({tipo:'texto',texto:a.texto,font:a.font,color:o.color,h:Math.round(a.cuerpo*(o.alto||1.35)),sp:o.sp||0,hueco:Math.round((o.hueco||0)*s)});};
  linea(firma.estudio,{peso:700,cuerpo:Math.round(17*s),min:Math.round(12*s),familia:SANS,color:suaveT,mayus:true,sp:Math.round(3*s),hueco:items.length&&ed?18:items.length?4:0});
  if(firma.cliente)linea(firma.para,{peso:500,cuerpo:Math.round(17*s),min:Math.round(12*s),familia:SANS,color:suaveT,hueco:4});
  {const t=ajustarTitulo(medir,firma.titulo||'',{peso:ed?600:800,cuerpo:Math.round((ed?52:58)*s),min:Math.round(30*s),familia:fam,ancho});
   t.lineas.forEach((l,i)=>items.push({tipo:'texto',texto:l,font:t.font,color:tinta,h:Math.round(t.cuerpo*1.08),hueco:i===0?Math.round(8*s):0,sp:0,grupo:'titulo'}));}
  linea(firma.lema,{peso:400,cuerpo:Math.round(23*s),min:Math.round(15*s),familia:ed?SERIF:SANS,color:ed?tinta:'rgba(255,255,255,.94)',hueco:6});
  linea(firma.cierre,{peso:ed?400:500,cuerpo:Math.round(19*s),min:Math.round(13*s),familia:SANS,color:suaveT,hueco:10});
  linea([firma.cta,firma.web].filter(Boolean).join('   ·   '),{peso:700,cuerpo:Math.round(19*s),min:Math.round(13*s),familia:SANS,color:acento,hueco:14});
  linea(firma.completada&&firma.aviso?firma.completada+' · '+firma.aviso:'',{peso:500,cuerpo:Math.round(14*s),min:Math.round(10*s),familia:SANS,color:ed?'rgba(36,33,29,.62)':'rgba(255,255,255,.78)',hueco:16});
  const altoTotal=items.reduce((a,i)=>a+i.h+i.hueco,0);
  // Anclaje: cine → abajo a la izquierda, sobre el velo; editorial → centrado vertical en la columna.
  let y=ed&&!vertical?Math.round((H-altoTotal)/2):Math.round(H-Math.round(64*s)-altoTotal);y=Math.max(margen,y);
  const lineas=[];for(const i of items){y+=i.hueco;lineas.push({...i,x:margen,y,w:i.tipo==='logo'?i.w:Math.min(ancho,Math.ceil(medir(i.font,i.texto)+i.sp*i.texto.length)),sombra});y+=i.h;}
  const panelY=Math.max(0,Math.min(H*.5,lineas[0]?lineas[0].y-margen:0));
  const fondo=ed?{tipo:'columna',x:0,y:vertical?Math.round(panelY):0,w:colW,h:vertical?H-Math.round(panelY):H,color:'rgba(247,242,234,.94)'}:{tipo:'velo',y0:Math.round(H*.45),y1:H,color:[18,16,14],alfa:.62};
  return Object.freeze({version:VERSION,estilo,escala:s,W,H,fondo,lineas,limite:{x0:margen,x1:margen+ancho}});}

 /** Luminancia media de los píxeles opacos del logo (0..1), en caché. Un logo claro sobre el panel editorial claro
  *  desaparecería: entonces se le pone una placa oscura discreta (mismo criterio en preview y vídeo). */
 const lumCache=new WeakMap();
 function luminancia(im){if(lumCache.has(im))return lumCache.get(im);let L=0.5;
  try{const w=Math.min(64,im.naturalWidth||im.width),h=Math.max(1,Math.round(w*(im.naturalHeight||im.height)/(im.naturalWidth||im.width)));
   const c=typeof OffscreenCanvas!=='undefined'?new OffscreenCanvas(w,h):Object.assign(document.createElement('canvas'),{width:w,height:h});const g=c.getContext('2d');g.drawImage(im,0,0,w,h);
   const d=g.getImageData(0,0,w,h).data;let s=0,n=0;for(let i=0;i<d.length;i+=4){const a=d[i+3]/255;if(a<.3)continue;s+=(0.2126*d[i]+0.7152*d[i+1]+0.0722*d[i+2])/255;n++;}if(n)L=s/n;}catch{}
  lumCache.set(im,L);return L;}
 const imgOK=i=>!!(i&&(i.naturalWidth||i.width)&&(i.complete!==false));
 /** Dibuja los títulos sobre un fotograma ya pintado. progreso 0..1 (fase de firma). Mismo resultado en vivo y en vídeo. */
 function pintar(x,W,H,firma,{progreso=1,estilo='cine',logo=null}={}){
  const lg=imgOK(logo)?{w:logo.naturalWidth||logo.width,h:logo.naturalHeight||logo.height}:null;
  const comp=composicion(firma,{W,H,estilo,logo:lg,medir:(font,t)=>{x.save();x.font=font;const w=x.measureText(t).width;x.restore();return w;}});
  if(progreso<=0)return comp;
  const f=comp.fondo,k0=Math.min(1,progreso*2);x.save();
  if(f.tipo==='velo'){const g=x.createLinearGradient(0,f.y0,0,f.y1);g.addColorStop(0,`rgba(${f.color},0)`);g.addColorStop(1,`rgba(${f.color},${f.alfa*k0})`);x.fillStyle=g;x.fillRect(0,f.y0,W,f.y1-f.y0);}
  else{x.globalAlpha=k0;x.fillStyle=f.color;x.fillRect(f.x,f.y,f.w*(0.6+0.4*suave(k0)),f.h);}
  x.restore();
  const n=comp.lineas.length;
  comp.lineas.forEach((l,i)=>{const k=escalon(progreso,i,n);if(k<=0)return;x.save();x.globalAlpha=k;const dy=(1-k)*18*comp.escala;
   if(l.sombra){x.shadowColor='rgba(0,0,0,.5)';x.shadowBlur=12*comp.escala;x.shadowOffsetY=2*comp.escala;}
   if(l.tipo==='logo'){
    if(comp.estilo==='editorial'&&luminancia(logo)>0.62){const p=Math.round(8*comp.escala),r=Math.round(6*comp.escala);x.fillStyle='#2b2724';x.beginPath();
     if(x.roundRect)x.roundRect(l.x-p,l.y+dy-p,l.w+2*p,l.h+2*p,r);else x.rect(l.x-p,l.y+dy-p,l.w+2*p,l.h+2*p);x.fill();}
    x.drawImage(logo,l.x,l.y+dy,l.w,l.h);}
   else{x.font=l.font;x.fillStyle=l.color;x.textAlign='left';x.textBaseline='top';if('letterSpacing' in x)x.letterSpacing=(l.sp||0)+'px';x.fillText(l.texto,l.x,l.y+dy);}
   x.restore();});
  return comp;}
 return Object.freeze({VERSION,ESTILOS,LOGO,composicion,pintar,ajustar});
});
