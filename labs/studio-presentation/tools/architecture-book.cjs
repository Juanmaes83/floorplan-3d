// v1.3 · A21 · ARCHITECTURE BOOK del laboratorio: libro técnico multipágina, distinto de la lámina A3 (que sigue aparte).
// Mismo snapshot, mismos helpers de dibujo; nada nuevo se calcula sobre el negocio. Contenido:
//   portada (D1, dibujo) · contenido y estado de los datos · planta general · cuadro de superficies · plantas por estancia
//   con objetos · sección de la Presentación 3D del PRODUCTO (FT3D-3) · fachadas candidatas del PRODUCTO (FT3D-4) ·
//   procedencia y lo que no contiene. Cajetín coherente en cada lámina (código AB-nn, escala, revisión, fecha, estudio).
// Regla de oro: sin cotas, alzados técnicos ni secciones constructivas, porque el modelo no los acredita. La sección y las
// fachadas se dibujan SOLO con los descriptores que calculó el producto (snapshot/derivados), y solo si su revisión es la
// del snapshot. La escala es la de las medidas del modelo, rotulada «estimada»: nunca «a escala».
'use strict';
const fs=require('fs'),path=require('path');
module.exports=function architectureBook(C){
 const {S,T,doc,plan,roomPlan,esc,num,date,rev,rooms,counted,AREA,STATUS_AREA,STUDIO,TITLE,NOGEO,coverDrawing,keyList,matById,snapDir,roomArea}=C;
 const est=S.project.scale==='estimated';const scaleTxt=n=>`1:${n} sobre las medidas del modelo${est?' (escala estimada)':''}`;
 const derived=n=>{try{const d=JSON.parse(fs.readFileSync(path.join(snapDir,'derivados',n),'utf8'));return d.revision===S.project.revision?d:{mismatch:d.revision};}catch{return null;}};
 const SEC=derived('ft3d3-seccion.json'),FAC=derived('ft3d4-fachadas.json');
 const floorName=r=>matById[r.floorMaterialId]?.name||'Sin pavimento asignado';
 const objs=r=>{const m=new Map();for(const o of S.objects)if(o.roomId===r.id)m.set(o.name,(m.get(o.name)||0)+1);return [...m].map(([n,q])=>(q>1?q+' × ':'')+n[0].toLowerCase()+n.slice(1)).join(', ');};
 const sheets=[];let sheetNo=0;
 const cajetin=(name,scale)=>{const code=`AB-${String(++sheetNo).padStart(2,'0')}`;sheets.push({code,name});
  return `<table class="cajetin" style="margin-top:4mm;font-size:9pt"><tbody><tr><th style="width:22mm">Lámina</th><td><b>${code}</b> ${esc(name)}</td></tr><tr><th>Escala</th><td>${esc(scale||'Sin escala')}</td></tr><tr><th>Proyecto</th><td>${esc(TITLE)}</td></tr><tr><th>Revisión</th><td>${esc(rev)}</td></tr><tr><th>Fecha</th><td>${esc(date)}</td></tr><tr><th>Estudio</th><td>${esc(STUDIO)}</td></tr></tbody></table>`;};
 const pages=[];
 pages.push(coverDrawing('Libro de arquitectura',`Planta, superficies, estancias, sección y fachadas del modelo, ${date}`));
 const idxAt=pages.length;pages.push(null); // contenido: se rellena al final
 // ---------- planta general ----------
 const general=NOGEO?null:plan({scale:100,objects:true,floorTint:false,pad:300});
 if(general&&general.pw>205)throw new Error('architecture-book: la planta general no cabe a 1:100');
 pages.push({html:`<div class="grid"><div class="c1-8" style="line-height:0">${general?general.svg:plan({w:200,h:150}).svg}</div>
  <div class="c9-12"><h2 class="h2">Planta general</h2><p class="read">Geometría del proyecto en RUBIK: ${S.geometry.walls.length} muros, ${S.geometry.openings.length} huecos, ${rooms.length} estancias y ${S.objects.length} objetos.</p>
  ${general?`<div class="legend" style="margin-top:4mm">${C.scaleBar?C.scaleBar(general.mmPerUnit):''}<span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.ink}"/></svg>Portante y fachada</span><span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.partition}"/></svg>Tabique</span><span>Huecos y mobiliario según el modelo</span></div>${keyList(general.keys)}`:''}
  <p class="caption" style="margin-top:3mm">Sin cotas: el modelo no las acredita. Medir sobre el papel no sustituye a una medición en obra.</p>
  ${cajetin('Planta general',general?scaleTxt(100):null)}</div></div>`});
 // ---------- cuadro de superficies ----------
 pages.push({html:`<div class="grid"><div class="c1-4"><h2 class="h2">Cuadro de superficies</h2><p class="read">Superficie de cada estancia calculada por RUBIK sobre el modelo.</p><p class="caption" style="margin-top:4mm">${esc(STATUS_AREA)}</p>${cajetin('Cuadro de superficies',null)}</div>
  <div class="c5-12"><table><thead><tr><th>N.º</th><th>Estancia</th><th>Pavimento</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rooms.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(floorName(r))}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('')}
  <tr class="total"><td></td><td colspan="2">Superficie útil computada (${counted.length} estancias)</td><td class="num">${AREA}</td><td></td></tr></tbody></table></div></div>`});
 // ---------- plantas por estancia, dos por lámina ----------
 if(!NOGEO){const list=rooms.filter(r=>r.polygon&&r.polygon.length>=3);
  for(let i=0;i<list.length;i+=2){const pair=list.slice(i,i+2);const cells=pair.map(r=>{const p=roomPlan(r,{scale:50,maxW:120,maxH:112,markers:false,pad:450});
    return `<div><div style="line-height:0;height:140mm;display:flex;align-items:flex-end">${p.svg}</div><h3 class="h3" style="margin:2mm 0 0">${esc(r.name)}</h3><p class="caption" style="margin:.5mm 0 0">${roomArea(r)}${r.counted?'':', no computa'}. ${esc(floorName(r))}. ${scaleTxt(p.scale)}.</p><p class="caption" style="margin:.5mm 0 0">${objs(r)?esc(objs(r)[0].toUpperCase()+objs(r).slice(1))+'.':'Sin objetos colocados.'}</p></div>`;});
   pages.push({html:`<div style="display:grid;grid-template-columns:1fr 1fr 62mm;gap:8mm">${cells.join('')}${pair.length<2?'<div></div>':''}<div><h2 class="h2">Estancias</h2><p class="caption">Recorte de la planta de RUBIK alrededor de cada estancia; el resto del plano se ve como contexto.</p>${cajetin(`Estancias ${i+1}${pair.length>1?`–${i+2}`:''} de ${list.length}`,(sc=>sc.length===1?scaleTxt(sc[0]):`1:${sc.join(' y 1:')} sobre las medidas del modelo${est?' (escala estimada)':''}`)([...new Set(pair.map(r=>roomPlan(r,{scale:50,maxW:120,maxH:112,markers:false,pad:450}).scale))]))}</div></div>`});}}
 // ---------- sección FT3D-3 (producto) ----------
 const roomName=id=>rooms.find(r=>r.id===id)?.name||id;
 if(SEC&&!SEC.mismatch&&SEC.resultado?.supported){const s=SEC.resultado,X=s.intersections,lo=s.lineMin,hi=s.lineMax,H=Math.max(...X.walls.map(w=>w.height),SEC.defaults?.wallHeightMm||2800);
  const sc=[50,75,100,150].find(k=>(hi-lo)/k<=200)||200,mm=v=>v/sc,W=mm(hi-lo),Hh=mm(H);
  const wallsSvg=X.walls.map(w=>{const x=mm(w.at-w.width/2-lo);return `<rect x="${x.toFixed(2)}" y="${(Hh-mm(w.height)).toFixed(2)}" width="${mm(w.width).toFixed(2)}" height="${mm(w.height).toFixed(2)}" fill="${T.ink}"/>`+w.gaps.map(g=>`<rect x="${x.toFixed(2)}" y="${(Hh-mm(g.top)).toFixed(2)}" width="${mm(w.width).toFixed(2)}" height="${mm(g.top-g.bottom).toFixed(2)}" fill="${T.paper}" stroke="${T.ink}" stroke-width=".15"/>`).join('');}).join('');
  // Banda de estancias bajo el corte: una línea por tramo y el nombre debajo, a 3,2 mm (≥ 12 px impresos). Si el nombre no cabe
  // en su tramo, lleva un número y su nombre va en la leyenda (mismo criterio que las plantas). Dos filas alternas.
  const FS=3.2,fits=(t,w)=>t.length*FS*.56<=w-1,segs=X.rooms.flatMap(r=>r.segments.map(([a,b])=>({r,a,b}))),keyed=[];
  const roomsSvg=segs.map(({r,a,b},i)=>{const x1=mm(a-lo),x2=mm(b-lo),y=Hh+3+(i%2)*8,name=roomName(r.id);let label=name;
   if(!fits(name,x2-x1)){let k=keyed.findIndex(q=>q.id===r.id);if(k<0){keyed.push({id:r.id,name});k=keyed.length-1;}label=String(k+1);}
   return `<line x1="${x1.toFixed(2)}" x2="${x2.toFixed(2)}" y1="${y.toFixed(2)}" y2="${y.toFixed(2)}" stroke="${T.muted}" stroke-width=".3"/><line x1="${x1.toFixed(2)}" x2="${x1.toFixed(2)}" y1="${(y-1).toFixed(2)}" y2="${(y+1).toFixed(2)}" stroke="${T.muted}" stroke-width=".3"/><line x1="${x2.toFixed(2)}" x2="${x2.toFixed(2)}" y1="${(y-1).toFixed(2)}" y2="${(y+1).toFixed(2)}" stroke="${T.muted}" stroke-width=".3"/><text x="${((x1+x2)/2).toFixed(2)}" y="${(y+4.4).toFixed(2)}" font-size="${FS}" text-anchor="middle" fill="${T.ink}" font-family="RUBIK Inter"${label!==name?' font-weight="700"':''}>${esc(label)}</text>`;}).join('');
  const band=segs.length>1?22:14,Ht=Hh+band;
  const keyList=keyed.length?`<p class="caption" style="margin-top:2mm">${keyed.map((k,i)=>`<b>${i+1}</b> ${esc(k.name)}`).join(', ')}: el nombre no cabe en su tramo.</p>`:'';
  const svg=`<svg width="${W.toFixed(1)}mm" height="${Ht.toFixed(1)}mm" viewBox="0 0 ${W.toFixed(2)} ${Ht.toFixed(2)}" role="img" aria-label="Sección de la Presentación 3D"><line x1="0" x2="${W.toFixed(2)}" y1="${Hh.toFixed(2)}" y2="${Hh.toFixed(2)}" stroke="${T.ink}" stroke-width=".35"/>${wallsSvg}${roomsSvg}</svg>`;
  // plano de situación con la línea de corte (mismas coordenadas del modelo que la planta)
  const key=plan({w:78,h:62,objects:false,floorTint:false,callouts:false,labels:false,pad:300});const u=(parseFloat(/viewBox="[^ ]+ [^ ]+ ([^ ]+)/.exec(key.svg)?.[1])||1)/key.pw; // unidades del modelo por mm
  const keySvg=key.svg.replace('</svg>',`<line x1="${s.line[0][0]}" y1="${s.line[0][1]}" x2="${s.line[1][0]}" y2="${s.line[1][1]}" stroke="${T.ink}" stroke-width="${(.6*u).toFixed(1)}" stroke-dasharray="${(3*u).toFixed(0)} ${(1.5*u).toFixed(0)}"/></svg>`);
  pages.push({html:`<div class="grid"><div class="c1-8"><h2 class="h2">Sección de la Presentación 3D</h2><div style="line-height:0;margin-top:6mm">${svg}</div>${keyList}
   <p class="caption" style="margin-top:4mm">Muros que corta el plano, con su espesor visto en la línea de corte y su altura; en blanco, los huecos que atraviesa. Debajo, las estancias que recorre.</p></div>
   <div class="c9-12"><div style="line-height:0">${keySvg}</div><p class="caption">Línea de corte sobre la planta: plano ${s.axis==='x'?'paralelo al eje X':'paralelo al eje Y'}, al ${Math.round(s.fraction*100)} % del contorno.</p>
   <p class="note" style="margin-top:3mm"><b>Esquema, no sección constructiva.</b> La calcula la Presentación 3D de RUBIK (FT3D-3) con lo que el modelo sabe: muros, alturas y huecos. Sin forjados, cubierta, cimentación ni cotas.</p>${cajetin('Sección esquemática',scaleTxt(sc))}</div></div>`});}
 else pages.push({html:`<div class="grid"><div class="c1-6"><h2 class="h2">Sección</h2><p class="read">${SEC?.mismatch?'La sección calculada por el producto es de otra revisión del proyecto: no se dibuja.':SEC?.resultado?.message?esc(SEC.resultado.message):'El producto no ha calculado una sección para esta revisión: no se dibuja ninguna.'}</p></div></div>`});
 // ---------- fachadas candidatas FT3D-4 (producto) ----------
 if(FAC&&!FAC.mismatch&&FAC.resultado?.supported){const f=FAC.resultado;const key=plan({w:150,h:120,objects:false,floorTint:false,callouts:false,labels:false,pad:1600});
  const vbw=parseFloat(/viewBox="[^ ]+ [^ ]+ ([^ ]+)/.exec(key.svg)?.[1])||1,u=vbw/key.pw;
  const marks=f.candidates.map(c=>{const n=c.normal||[0,0],cx=c.centerMm.x,cy=c.centerMm.y,ox=cx+n[0]*700,oy=cy+n[1]*700;
   return `<line x1="${cx}" y1="${cy}" x2="${ox}" y2="${oy}" stroke="${T.ink}" stroke-width="${(.35*u).toFixed(1)}"/><circle cx="${ox}" cy="${oy}" r="${(3*u).toFixed(1)}" fill="${c.id===f.defaultId?T.ink:T.paper}" stroke="${T.ink}" stroke-width="${(.35*u).toFixed(1)}"/><text x="${ox}" y="${(oy+1.1*u).toFixed(1)}" font-size="${(3.2*u).toFixed(1)}" text-anchor="middle" fill="${c.id===f.defaultId?T.paper:T.ink}" font-family="RUBIK Inter" font-weight="700">${esc(c.id.slice(-1))}</text>`;}).join('');
  pages.push({html:`<div class="grid"><div class="c1-7" style="line-height:0">${key.svg.replace('</svg>',marks+'</svg>')}</div>
   <div class="c8-12"><h2 class="h2">Fachadas que reconoce el modelo</h2><p class="read">${f.candidates.length} fachadas agrupadas por orientación, calculadas por la Presentación 3D de RUBIK (FT3D-4). En negro, la que el producto elige por defecto: la de huecos más expresivos, no una «fachada principal».</p>
   <table style="margin-top:4mm"><thead><tr><th>Fachada</th><th class="num">Longitud (m)</th><th class="num">Altura (m)</th><th class="num">Huecos</th></tr></thead><tbody>${f.candidates.map(c=>`<tr><td>${esc(c.label||c.id)}${c.id===f.defaultId?' (por defecto)':''}</td><td class="num">${num(c.totalFacadeLengthMm/1000)}</td><td class="num">${num(c.heightMm/1000)}</td><td class="num">${c.openingCount}</td></tr>`).join('')}</tbody></table>
   <p class="caption" style="margin-top:3mm">${f.northOffsetDeg==null?'Sin orientación geográfica: el proyecto no tiene norte, así que las fachadas se nombran A, B, C… y no norte, sur…':''} ${f.partial?'Resultado parcial: algunos muros de fachada no se han podido orientar.':''}</p>
   <p class="note" style="margin-top:3mm"><b>No son alzados.</b> El producto no dibuja alzados técnicos; esta lámina solo dice qué fachadas reconoce y cuántos huecos tiene cada una.</p>${cajetin('Fachadas',null)}</div></div>`});}
 // ---------- procedencia ----------
 pages.push({html:`<div class="grid"><div class="c1-6"><h2 class="h2">De dónde sale cada dato</h2><p class="read">Planta, muros, huecos, estancias, superficies y objetos: proyecto en RUBIK, revisión ${esc(rev)}. ${esc(STATUS_AREA)}</p>
  <p class="read" style="margin-top:3mm">Sección y fachadas: descriptores calculados por el producto (Presentación 3D, FT3D-3 y FT3D-4) sobre esta misma revisión${SEC?.producto?`, en la versión ${esc(SEC.producto.slice(0,7))}`:''}.</p></div>
  <div class="c7-12"><h2 class="h2">Lo que este libro no contiene</h2><p class="read">Cotas, alzados técnicos, secciones constructivas, forjados, estructura, instalaciones y carpinterías detalladas: el modelo no los acredita y RUBIK no los inventa. Las escalas se refieren a las medidas del modelo${est?' y son estimadas':''}: no sirven para medir sobre el papel.</p>
  <p class="caption" style="margin-top:4mm">La lámina A3 de arquitectura se entrega aparte.</p></div></div>`});
 const idx=[...sheets.map(s=>`<tr><td>${s.code}</td><td>${esc(s.name)}</td></tr>`)].join('');
 pages[idxAt]={html:`<div class="grid"><div class="c1-5"><h2 class="h2">Contenido</h2><table><tbody>${idx}</tbody></table></div>
  <div class="c7-12"><h2 class="h2">Estado de los datos</h2><p class="read">Proyecto ${esc(TITLE)}, revisión ${esc(rev)}. ${rooms.length} estancias, ${counted.length} computan; superficie útil ${AREA} m².</p><p class="caption" style="margin-top:3mm">${esc(STATUS_AREA)}</p>
  <p class="note" style="margin-top:4mm"><b>Escala estimada.</b> RUBIK ${est?'no conoce la escala real del dibujo de partida: ':''}las medidas son las del modelo. Cada lámina lo indica en su cajetín.</p></div></div>`};
 return {D:{'architecture-book':doc('architecture-book','Libro de arquitectura','technical',pages)},meta:{'architecture-book':{laminas:sheets.length,seccion:!!(SEC&&!SEC.mismatch&&SEC.resultado?.supported),fachadas:!!(FAC&&!FAC.mismatch&&FAC.resultado?.supported)}}};
};
