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
 const {S,T,doc,plan,roomPlan,esc,num,date,rev,rooms,counted,AREA,STATUS_AREA,STUDIO,TITLE,NOGEO,matById,snapDir,roomArea,LOGO,prof}=C;
 const est=S.project.scale==='estimated';const scaleTxt=n=>`1:${n} sobre las medidas del modelo${est?' (escala estimada)':''}`;
 const derived=n=>{try{const d=JSON.parse(fs.readFileSync(path.join(snapDir,'derivados',n),'utf8'));return d.revision===S.project.revision?d:{mismatch:d.revision};}catch{return null;}};
 const SEC=derived('ft3d3-seccion.json'),FAC=derived('ft3d4-fachadas.json');
 const floorName=r=>matById[r.floorMaterialId]?.name||'Sin pavimento asignado';
 const objs=r=>{const m=new Map();for(const o of S.objects)if(o.roomId===r.id)m.set(o.name,(m.get(o.name)||0)+1);return [...m].map(([n,q])=>(q>1?q+' × ':'')+n[0].toLowerCase()+n.slice(1)).join(', ');};
 const sheets=[];let sheetNo=0;
 const cajetin=(name,scale)=>{const code=`AB-${String(++sheetNo).padStart(2,'0')}`;sheets.push({code,name,page:pages.length+1});
  return `<table class="cajetin" id="${code}" style="margin-top:4mm;font-size:9pt"><tbody><tr><th style="width:18mm">Lámina</th><td><b>${code}</b> ${esc(name)}</td></tr><tr><th>Escala</th><td>${esc(scale||'Sin escala')}</td></tr><tr><th>Proyecto</th><td>${esc(TITLE)}</td></tr><tr><th>Revisión</th><td>${esc(rev)}</td></tr><tr><th>Fecha</th><td>${esc(date)}</td></tr><tr><th>Estudio</th><td>${esc(STUDIO)}</td></tr>${prof.person?`<tr><th>Contacto</th><td>${esc(prof.person)}</td></tr>`:''}</tbody></table>`;};
 const pages=[];
 const coverPlan=plan({w:174,h:155,floorTint:false,labels:false});
 pages.push({head:false,html:`<div class="grid"><div class="c1-4" style="display:flex;flex-direction:column;justify-content:space-between;padding:5mm 0;border-top:1mm solid var(--d-ink)">
 <div>${LOGO()}<p class="meta">${esc(STUDIO)}</p></div><div><h1 class="h1">Libro de arquitectura</h1><p class="lead" style="margin-top:5mm">${esc(TITLE)}</p></div>
 <div><p class="meta">${esc(date)} · ${esc(rev)}</p><p class="caption">Planta, superficies y esquemas del modelo.</p></div></div>
 <div class="c5-12" style="display:grid;place-items:center;background:var(--d-field)">${coverPlan.svg}</div></div>`});
 const idxAt=pages.length;pages.push(null); // contenido: se rellena al final
 // ---------- planta general ----------
 const general=NOGEO?null:plan({scale:100,objects:true,floorTint:false,pad:300,labelPt:9.5,callouts:false});
 if(general&&general.pw>205)throw new Error('architecture-book: la planta general no cabe a 1:100');
 pages.push({html:`<div class="grid"><div class="c1-8" style="line-height:0">${general?general.svg:plan({w:200,h:150}).svg}</div>
  <div class="c9-12"><h2 class="h2">Planta general</h2><p class="read">Geometría del proyecto en RUBIK: ${S.geometry.walls.length} muros, ${S.geometry.openings.length} huecos, ${rooms.length} estancias y ${S.objects.length} objetos.</p>
  ${general?`<div class="legend" style="margin-top:4mm;flex-wrap:wrap;gap:2mm 5mm"><div style="flex-basis:100%">${C.scaleBar(general.mmPerUnit,2,true)}</div><span data-ui><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.ink}"/></svg>Portante y fachada</span><span data-ui><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.partition}"/></svg>Tabique</span><span data-ui style="flex-basis:100%">Huecos y mobiliario según el modelo</span></div>${general.keys.length?`<p class="caption">Números de estancia según el cuadro de superficies (<a href="#AB-02">AB-02</a>).</p>`:''}`:''}
  <p class="caption" style="margin-top:3mm">Sin cotas: el modelo no las acredita. Medir sobre el papel no sustituye a una medición en obra.</p>
  ${cajetin('Planta general',general?scaleTxt(100):null)}</div></div>`});
 // ---------- cuadro de superficies ----------
 pages.push({html:`<div class="grid"><div class="c1-4"><h2 class="h2">Cuadro de superficies</h2><p class="read">Superficie de cada estancia calculada por RUBIK sobre el modelo.</p><p class="caption" style="margin-top:4mm">${esc(STATUS_AREA)}</p>${cajetin('Cuadro de superficies',null)}</div>
  <div class="c5-12"><table><thead><tr><th>N.º</th><th>Estancia</th><th>Pavimento</th><th class="num">m²</th><th>Computa</th></tr></thead><tbody>${rooms.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.name)}</td><td>${esc(floorName(r))}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td><td>${r.counted?'Sí':'No'}</td></tr>`).join('')}
  <tr class="total"><td></td><td colspan="2">Superficie útil computada (${counted.length} estancias)</td><td class="num">${AREA}</td><td></td></tr></tbody></table></div></div>`});
 // ---------- plantas por estancia, dos por lámina ----------
 if(!NOGEO){const list=rooms.filter(r=>r.polygon&&r.polygon.length>=3);
  for(let i=0;i<list.length;i+=2){const pair=list.slice(i,i+2),solo=pair.length===1;
   const crops=pair.map(r=>roomPlan(r,{scale:50,maxW:92,maxH:112,markers:false,pad:450}));
   const cells=pair.map((r,j)=>{const p=crops[j],objects=objs(r);
    return `<div><div style="line-height:0;height:${solo?88:119}mm;display:flex;align-items:flex-end">${p.svg}</div><h3 class="h3" style="margin:3mm 0 0">${esc(r.name)}</h3><p class="caption" style="margin:.5mm 0 0">${roomArea(r)}${r.counted?'':', no computa'}. ${esc(floorName(r))}. ${scaleTxt(p.scale)}.</p><p class="caption" style="margin:.5mm 0 0">${objects?esc(objects[0].toUpperCase()+objects.slice(1))+'.':'Sin objetos colocados.'}</p></div>`;});
   const locator=solo?plan({w:88,h:74,floorTint:false,labels:false,highlight:pair.map(r=>r.id)}):null;
   const sc=[...new Set(crops.map(p=>p.scale))];
   const scale=sc.length===1?scaleTxt(sc[0]):`1:${sc.join(' y 1:')} sobre las medidas del modelo${est?' (escala estimada)':''}`;
   pages.push({html:`<div style="display:grid;grid-template-columns:1fr 1fr 62mm;gap:8mm">${cells.join('')}${locator?`<div style="margin-top:10mm"><h3 class="h3">Localizador</h3>${locator.svg}<p class="caption">Estancia destacada en la planta general. Esquema de situación sin escala.</p></div>`:''}<div><h2 class="h2">Estancias</h2><p class="caption">Recorte de la planta de RUBIK alrededor de cada estancia; el resto del plano se ve como contexto.</p>${cajetin(`Estancias ${i+1}${!solo?`–${i+2}`:''} de ${list.length}`,scale)}</div></div>`});}}
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
 const openings=S.geometry.openings.filter(o=>Number.isFinite(o.widthMm)&&o.widthMm>0);
 const openingTypes={window:'Ventana',door:'Puerta','sliding-door':'Puerta corredera'};
 const openingsTable=rows=>`<table><thead><tr><th>Ref.</th><th>Tipo</th><th class="num">Ancho (mm)</th></tr></thead><tbody>${rows.map(o=>`<tr><td>${esc(o.id)}</td><td data-ui>${openingTypes[o.kind]||'Hueco'}</td><td class="num">${num(o.widthMm,0)}</td></tr>`).join('')}</tbody></table>`;
 const schedule=rows=>{const halves=Math.ceil(rows.length/2);return `<div class="c1-12" style="align-self:start"><h2 class="h2">Anchos de huecos del modelo</h2>
  <p class="caption">Anchos registrados para los huecos de la planta general. Altura y sentido no se detallan en este cuadro.</p>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:8mm;margin-top:3mm">${openingsTable(rows.slice(0,halves))}${rows.length>1?openingsTable(rows.slice(halves)):''}</div></div>`;};
 pages.push({html:`<div class="grid" style="height:auto;row-gap:5mm"><div class="c1-6"><h2 class="h2">De dónde sale cada dato</h2><p class="read">Planta, muros, huecos, estancias, superficies y objetos: proyecto en RUBIK, revisión ${esc(rev)}. ${esc(STATUS_AREA)}</p>
  <p class="read" style="margin-top:3mm">Sección y fachadas: descriptores calculados por el producto (Presentación 3D, FT3D-3 y FT3D-4) sobre esta misma revisión${SEC?.producto?`, en la versión ${esc(SEC.producto.slice(0,7))}`:''}.</p></div>
  <div class="c7-12"><h2 class="h2">Lo que este libro no contiene</h2><p class="read">Cotas, alzados técnicos, secciones constructivas, forjados, estructura, instalaciones y carpinterías detalladas: el modelo no los acredita y RUBIK no los inventa. Las escalas se refieren a las medidas del modelo${est?' y son estimadas':''}: no sirven para medir sobre el papel.</p>
  <p class="caption" style="margin-top:4mm">La lámina A3 de arquitectura se entrega aparte.</p></div>${openings.length?schedule(openings.slice(0,24)):''}</div>`});
 for(let start=24;start<openings.length;start+=40){
  pages.push({html:`<div class="grid">${schedule(openings.slice(start,start+40))}</div>`});
 }
 const link=code=>`<a href="#${code}" style="color:var(--d-accent);white-space:nowrap">${code}</a>`;
 const idx=sheets.map(s=>`<tr><td>${link(s.code)}</td><td>${esc(s.name)}</td><td class="num">${s.page}</td></tr>`).join('');
 const roomSheets=sheets.filter(s=>s.name.startsWith('Estancias '));
 const planSheet=NOGEO?'—':'AB-01';
 const categories=[
  ['A-01','Planta y superficies',NOGEO?'AB-02':'AB-01, AB-02'],
  ['A-02','Demolición','—'],['A-03','Nueva tabiquería','—'],
  ['A-04','Mobiliario del modelo',S.objects.length?roomSheets.map(s=>s.code).join(', '):'—'],
  ['A-05','Pavimentos asignados',S.board.floors.length?'AB-02':'—'],
  ['A-06','Instalaciones','—'],['A-07','Huecos en planta',S.geometry.openings.length?planSheet:'—'],
  ['A-08','Sección y fachadas esquemáticas',sheets.filter(s=>['Sección esquemática','Fachadas'].includes(s.name)).map(s=>s.code).join(', ')||'—']
 ];
 pages[idxAt]={html:`<div class="grid"><div class="c1-5"><h2 class="h2">Contenido</h2><table><tbody>${idx}</tbody></table></div>
  <div class="c7-12"><h2 class="h2">Estado de los datos</h2><p class="caption">${esc(STATUS_AREA)}</p>
  <table style="margin-top:4mm"><thead><tr><th>Código</th><th>Contenido</th><th>Láminas disponibles</th></tr></thead><tbody>${categories.map(([id,name,codes])=>`<tr><td style="white-space:nowrap">${id}</td><td data-ui>${name}</td><td>${codes.split(', ').map(code=>code==='—'?code:link(code)).join(', ')}</td></tr>`).join('')}</tbody></table>
  <p class="caption">Sin lámina para demolición, nueva tabiquería o instalaciones. Los huecos se representan según el modelo; altura y sentido solo se indican si constan.</p>
  ${est?'<p class="note" style="margin-top:4mm"><b>Escala estimada.</b> Las escalas se refieren a las medidas del modelo. Cada lámina lo indica en su cajetín.</p>':''}</div></div>`};
 return {D:{'architecture-book':doc('architecture-book','Libro de arquitectura','technical',pages)},meta:{'architecture-book':{laminas:sheets.length,indice:sheets,correspondencia:categories,anchosProgramados:openings.map(o=>({id:o.id,mm:o.widthMm})),seccion:!!(SEC&&!SEC.mismatch&&SEC.resultado?.supported),fachadas:!!(FAC&&!FAC.mismatch&&FAC.resultado?.supported)}}};
};
