// B1 (v3) · more designs per deliverable. Lab only; called by compose.cjs with its own helpers and the same snapshot,
// so there is one data path. Regla de oro: every figure, name, line and image comes from the snapshot; the composer
// only lays out, scales and does labelled arithmetic. What the project does not have is written as missing.
// References (reports/03 grade A, reports/05 DNA): R36/R13/R46 interior book, R19/R17/R20/R46 materials, R25/R30/R13
// proposal, R04/R11 real estate, R22/R03 sheet. Grammar donors: product-editorial-showcase (giant word as a layer),
// FF&E spec book / product cut sheet (one verifiable card per item), IFC Sheet (title block strip 50 × 180 mm at the
// right), dataviz skill (ranked horizontal bars, one hue, value at the tip, table view on the same page).
module.exports=function b1(C){
 const {S,T,P,B,BV,prof,TITLE,date,rooms,area,matById,views,viewBy,VIEW_NOTE,STATUS_AREA,W_COLOR,wallById,
  nf,num,eur,esc,tint,bbox,centroid,plan,axo,scaleBar,doc,fig,img,studioBlock,coverDrawing,materialsPage,objectRows,
  STUDIO,AREA,INTRO,NOGEO,roomArea,biggest,keyList,LOGO,noBudgetPage,LONG_ROOMS,sheetTable,annexPage}=C;
 const D={},meta={};
 const studio=STUDIO;
 const BC=S.budget?.test?.view?.client||null;
 // ---------- object tags: the same grouping as the schedule (room | name | size → M-xx), so a tag is one schedule line ----------
 const rows=objectRows();
 const keyOf=i=>{const o=S.objects[i],g=S.geometry.objects[i];const sz=g?.size?`${num(g.size.widthMm,0)} × ${num(g.size.depthMm,0)}`:null;return (o.room||'Fuera de los recintos')+'|'+o.name+'|'+sz;};
 const rowByKey=new Map(rows.map(r=>[r.room+'|'+r.name+'|'+r.size,r]));
 const tagOf=i=>rowByKey.get(keyOf(i))?.tag||null;
 const objsIn=r=>S.objects.map((o,i)=>({o,g:S.geometry.objects[i],i,tag:tagOf(i)})).filter(x=>x.o.roomId===r.id);
 const rowsIn=r=>rows.filter(x=>x.room===r.name);
 const UNIT_MM=.3528; // 1 pt in mm
 // ---------- room crop at a fixed drawing scale: the room tinted by its floor, the rest of the plan as context ----------
 function roomPlan(r,{scale=50,maxW=150,maxH=150,markers=true,pad=650}={}){
  const b=bbox(r.polygon);let s=scale;const fits=k=>(b.x1-b.x0+2*pad)/k<=maxW&&(b.y1-b.y0+2*pad)/k<=maxH;
  for(const k of [scale,75,100,150])if(fits(k)){s=k;break;}
  const vb={x:b.x0-pad,y:b.y0-pad,w:b.x1-b.x0+2*pad,h:b.y1-b.y0+2*pad},mmPerUnit=1/s,u=UNIT_MM/mmPerUnit;
  const out=[`<title>${esc(r.name)}, planta a escala 1:${s}</title><desc>Recorte de la planta de RUBIK alrededor de la estancia; el resto del plano se muestra como contexto.</desc>`];
    for(const q of rooms){const m=matById[q.floorMaterialId];out.push(`<polygon points="${q.polygon.map(p=>p.x+','+p.y).join(' ')}" fill="${q.id===r.id&&m?tint(m.color,.55):T.paper}"/>`);}
  S.geometry.objects.forEach((g,i)=>{const mine=S.objects[i].roomId===r.id;out.push(`<rect x="${-g.size.widthMm/2}" y="${-g.size.depthMm/2}" width="${g.size.widthMm}" height="${g.size.depthMm}" fill="${mine?T.paper:'none'}" fill-opacity="${mine?.55:0}" stroke="${mine?T.ink:T.rule}" stroke-width="${(mine?.3:.2)*u}" transform="translate(${g.position.x} ${g.position.y}) rotate(${g.rotationDeg||0})"/>`);});
  for(const x of S.geometry.walls)out.push(`<line x1="${x.start.x}" y1="${x.start.y}" x2="${x.end.x}" y2="${x.end.y}" stroke="${W_COLOR[x.structure]||T.ink}" stroke-width="${x.thicknessMm}" stroke-linecap="square"/>`);
  for(const o of S.geometry.openings){const x=wallById[o.wallId];if(!x)continue;const L=Math.hypot(x.end.x-x.start.x,x.end.y-x.start.y)||1,d={x:(x.end.x-x.start.x)/L,y:(x.end.y-x.start.y)/L};
   const a={x:x.start.x+d.x*o.offsetMm,y:x.start.y+d.y*o.offsetMm},c={x:a.x+d.x*o.widthMm,y:a.y+d.y*o.widthMm};
   out.push(`<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="${T.paper}" stroke-width="${x.thicknessMm+2}"/>`);
   if(o.kind==='window'){const n={x:-d.y,y:d.x},t=x.thicknessMm/2;for(const k of [-t,0,t])out.push(`<line x1="${a.x+n.x*k}" y1="${a.y+n.y*k}" x2="${c.x+n.x*k}" y2="${c.y+n.y*k}" stroke="${T.ink}" stroke-width="${(k?.5:.25)*u}"/>`);}
   else out.push(`<line x1="${a.x}" y1="${a.y}" x2="${c.x}" y2="${c.y}" stroke="${T.ink}" stroke-width="${.25*u}" stroke-dasharray="${2*u} ${1.5*u}"/>`);}
  // Numbered markers keyed to the schedule tag (one per tag; a second copy of the same tag only if far from the first).
  const placed=[];let markersOut=0;
  if(markers){const R=2.3/mmPerUnit;for(const x of objsIn(r)){if(!x.tag)continue;let p={x:x.g.position.x,y:x.g.position.y};
    if(placed.some(q=>q.tag===x.tag&&Math.hypot(q.x-p.x,q.y-p.y)<1200))continue;
    for(let k=0;k<16&&placed.some(q=>Math.hypot(q.x-p.x,q.y-p.y)<2.15*R);k++){const a=k*Math.PI/4,rr=R*(1.2+Math.floor(k/8));p={x:x.g.position.x+Math.cos(a)*rr*2,y:x.g.position.y+Math.sin(a)*rr*2};}
    placed.push({...p,tag:x.tag});markersOut++;
    out.push(`<g class="mk"><circle cx="${p.x}" cy="${p.y}" r="${R}" fill="${T.ink}"/><text x="${p.x}" y="${p.y+2.5*u}" text-anchor="middle" font-size="${7.2*u}" font-weight="700" fill="${T.paper}">${parseInt(x.tag.slice(2),10)}</text></g>`);}}
  return {svg:`<svg class="plan room" viewBox="${vb.x} ${vb.y} ${vb.w} ${vb.h}" width="${vb.w*mmPerUnit}mm" height="${vb.h*mmPerUnit}mm" role="img">${out.join('')}</svg>`,scale:s,mmPerUnit,markers:markersOut,w:vb.w*mmPerUnit,h:vb.h*mmPerUnit};}
 const floorOf=r=>matById[r.floorMaterialId]||null;
 const cap=t=>t?t[0].toUpperCase()+t.slice(1):t;
 const objPhrase=r=>{const by=new Map();for(const x of rowsIn(r))by.set(x.name,(by.get(x.name)||0)+x.qty);return [...by].map(([n,q])=>(q>1?q+' × ':'')+n[0].toLowerCase()+n.slice(1)).join(', ');}; // only the initial: «Mueble de TV» keeps «TV»
 const swatch=(m,h=6)=>m?`<i style="display:inline-block;width:${h*1.6}mm;height:${h}mm;background:${m.color};border:.2mm solid rgba(0,0,0,.14);vertical-align:-1mm;margin-right:2mm"></i>`:'';
 const objTable=r=>{const list=rowsIn(r);if(!list.length)return '<p class="caption">No hay objetos colocados en esta estancia.</p>';const anyRef=list.some(x=>x.ref);
  return `<table><thead><tr><th>Ref.</th><th>Objeto</th><th class="num">Ud.</th><th class="num">Medida (mm)</th>${anyRef?'<th>Producto</th>':''}</tr></thead><tbody>${list.map(x=>`<tr><td class="muted" style="white-space:nowrap">${x.tag}</td><td>${esc(x.name)}</td><td class="num">${x.qty}</td><td class="num">${x.size||'<span class="unk">sin medida</span>'}</td>${anyRef?`<td>${x.ref?esc(x.ref):'<span class="unk">Sin referencia de producto</span>'}</td>`:''}</tr>`).join('')}</tbody></table>
   ${anyRef?'':'<p class="caption"><span class="unk">Sin referencia de producto:</span> ninguno de estos objetos tiene fabricante, acabado ni precio en el proyecto.</p>'}`;};
 // ---------- interior book v3: index, a spread per room with a 3D view, small multiples for the rest, closing ----------
 const roomById=Object.fromEntries(rooms.map(r=>[r.id,r]));
 const viewRooms=views.filter(v=>v.kind==='room'&&roomById[v.roomId]).map(v=>({v,r:roomById[v.roomId]}));
 const otherRooms=rooms.filter(r=>!viewRooms.some(x=>x.r.id===r.id));
 function roomLeft(r,{withList=true}={}){const p=roomPlan(r,{scale:50,maxW:126,maxH:160});const m=floorOf(r);
  return {meta:{room:r.name,scale:p.scale,markers:p.markers},html:`<div class="grid"><div class="c1-6" style="display:flex;flex-direction:column;justify-content:center;align-items:flex-start">${p.svg}
   <div class="legend" style="margin-top:3mm;width:100%">${scaleBar(p.mmPerUnit,2)}<span>Escala 1:${p.scale} sobre las medidas del modelo, impreso al 100 %</span></div></div>
  <div class="c7-12" style="display:flex;flex-direction:column"><h2 class="h2">${esc(r.name)}</h2>
   <div style="display:grid;grid-template-columns:1fr 1fr;gap:5mm">${fig(r.areaM2==null?'—':num(r.areaM2),'m²','Superficie',r.counted?'Computa como superficie útil':'No computa como superficie útil')}${fig(rowsIn(r).reduce((s,x)=>s+x.qty,0),'','Objetos colocados','Mobiliario y equipamiento del modelo')}</div>
   <div class="note" style="margin-top:5mm"><b>Pavimento.</b> ${m?`${swatch(m,4.5)}${esc(m.name)}`:'<span class="unk">Sin pavimento asignado</span>'}<br><span class="muted">Color del modelo, no muestra física.</span></div>
   ${withList?`<div style="margin-top:5mm">${objTable(r)}</div>`:''}
   <p class="caption" style="margin-top:auto">Los números del plano son las referencias del listado de mobiliario. ${esc(STATUS_AREA)}</p></div></div>`};}
 const roomRight=v=>({cls:'bleed',html:`<figure style="position:absolute;inset:0 0 27mm 0;background:${v.bg}" class="frame">${img(v)}</figure>
  <div style="position:absolute;left:16mm;right:16mm;bottom:16mm;display:flex;gap:8mm;align-items:baseline"><span class="h3" style="margin:0">${esc(v.label)}</span><span class="caption" style="margin:0">${VIEW_NOTE}</span></div>`});
 function smallMultiples(list,{first=true,part='',total=1}={}){const cells=list.map(r=>{const p=roomPlan(r,{scale:100,maxW:76,maxH:34,markers:false,pad:250}),m=floorOf(r),ph=objPhrase(r);
   return `<div style="border-top:.35mm solid var(--d-ink);padding-top:1.6mm"><div style="display:flex;justify-content:space-between;align-items:baseline"><span class="h3" style="margin:0">${esc(r.name)}</span><span class="caption" style="margin:0">1:${p.scale}</span></div>
    <div style="height:35mm;display:flex;align-items:center;justify-content:center;overflow:hidden">${p.svg}</div>
    <div class="caption" style="margin:.6mm 0 0">${r.areaM2==null?'Sin área':num(r.areaM2)+' m²'}${r.counted?'':', no computa'}. ${m?esc(m.name):'Sin pavimento asignado'}.<br>${ph?esc(cap(ph))+'.':'Sin objetos.'}</div></div>`;}).join('');
  return {html:`<div style="display:grid;grid-template-columns:62mm 1fr;gap:6mm;height:176mm"><div><h2 class="h2">${viewRooms.length?'El resto de estancias':'Las estancias'}</h2>${total>1?`<p class="caption" style="margin:-2mm 0 4mm">Parte ${part} de ${total}</p>`:''}${first?`<p class="read">${viewRooms.length?'Las estancias de las que el proyecto no tiene vista 3D':'Todas las estancias del proyecto'}, con su recorte de planta, pavimento y objetos.</p>
   <p class="note" style="margin-top:6mm"><b>Sin vista 3D.</b> RUBIK solo muestra las vistas que el profesional ha generado en el proyecto: ${viewRooms.length===1?'1 estancia tiene una':viewRooms.length+' estancias tienen una'}. No se fabrica ninguna imagen para las demás.</p>`:''}</div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);align-content:start;gap:3.5mm 5mm">${cells}</div></div>`};}
 const smallPages=list=>{const per=LONG_ROOMS?3:9,n=Math.ceil(list.length/per),out=[];for(let i=0;i<list.length;i+=per)out.push(smallMultiples(list.slice(i,i+per),{first:i===0,part:i/per+1,total:n}));return out;};
 const indexPage=entries=>({html:`<div class="grid"><div class="c1-4"><h2 class="h2">Contenido</h2><p class="read">${INTRO}</p><p class="caption">Texto del profesional en la ficha de entrega.</p></div>
  <div class="c6-12"><table style="font-size:10.5pt"><tbody>${entries.map(([t,pg,d])=>`<tr><td style="padding:2.4mm 0"><span style="font-family:var(--f-read);font-size:13pt">${esc(t)}</span>${d?`<br><span class="caption">${esc(d)}</span>`:''}</td><td class="num" style="vertical-align:top;padding-top:3mm">${pg}</td></tr>`).join('')}</tbody></table></div></div>`});
 const closingPage=()=>({html:`<div class="grid"><div class="c1-5" style="display:flex;flex-direction:column;justify-content:space-between;height:178mm"><div><h2 class="h2">${esc(studio)}</h2><p class="lead">${esc(prof.tagline||'')}</p></div>
   ${studioBlock()}</div>
  <div class="c7-12" style="display:flex;flex-direction:column;justify-content:flex-end;gap:5mm">
   <p class="note"><b>De dónde sale cada dato.</b> Superficies, estancias, objetos, materiales y vistas proceden del proyecto en RUBIK (revisión ${esc(P.revision||'sin revisión')}). Las vistas son del modelo 3D, no fotografías; los colores de material son los del modelo, no muestras físicas.</p>
   <p class="note"><b>Lo que este libro no contiene.</b> ${[S.objects.length&&!S.objects.some(o=>o.catalogRef)?'referencias de fabricante':null,!S.board.walls.length?'acabados de pared':null,!views.length?'vistas 3D':null,'alzados y secciones'].filter(Boolean).join(', ').replace(/^./,c=>c.toUpperCase())}: el proyecto no los tiene y RUBIK no los inventa.</p></div></div>`});
 {const pages=[coverDrawing('Libro de interiorismo',`Presentado por ${prof.person||studio}, ${date}`)];
  const pj=plan({w:150,h:150,callouts:false});const proj={html:`<div class="grid"><div class="c1-5"><h2 class="h2">El proyecto</h2><p class="read">${INTRO}</p><p class="caption">Texto del profesional en la ficha de entrega.</p><p class="note" style="margin-top:6mm"><b>Estado de los datos.</b> ${esc(STATUS_AREA)}</p>${keyList(pj.keys)}</div>
   <div class="c7-12" style="display:flex;flex-direction:column;align-items:center">${pj.svg}${NOGEO?'':'<p class="caption" style="align-self:flex-start">Planta del proyecto; cada estancia lleva el color de su pavimento.</p>'}</div></div>`};
  // Spreads open on even pages (left), the view on the next odd page (right): index p2, project p3, first spread p4.
  const entries=[['El proyecto',3,'Descripción y planta']];let pg=4;const spreads=[];
  for(const x of viewRooms){entries.push([x.r.name,pg,`Planta a escala, pavimento, objetos y vista 3D`]);spreads.push(roomLeft(x.r),roomRight(x.v));pg+=2;}
  const small=smallPages(otherRooms);if(small.length){entries.push([viewRooms.length?'El resto de estancias':'Las estancias',pg,`${otherRooms.length} ${otherRooms.length===1?'estancia':'estancias'} sin vista 3D`]);pg+=small.length;}
  entries.push(['Materiales de pavimento',pg,'Pavimentos por superficie']);pg++;entries.push([studio,pg,'Datos del estudio y procedencia']);
  pages.push(indexPage(entries),proj,...spreads,...small,materialsPage('Materiales de pavimento'),closingPage());
  meta['interior-book-v3']={rooms:spreads.filter(p=>p.meta).map(p=>p.meta)};
  D['interior-book-v3']=doc('interior-book-v3','Libro de interiorismo','client',pages);}
 // ---------- materials & furniture v3: giant-word cover, board per room, one card per schedule line ----------
 const giantCover=(word,sub)=>{const fl=[...S.board.floors].sort((a,b)=>b.areaM2-a.areaM2);
  return {cls:'bleed',foot:false,html:`<figure style="position:absolute;left:0;right:0;top:20mm;height:131mm"><div style="position:absolute;left:0;right:0;top:14mm;text-align:center;font-family:var(--f-read);font-weight:600;font-size:150pt;line-height:.8;letter-spacing:-.04em;color:${T.low};white-space:nowrap">${esc(word)}</div>
  <div style="position:absolute;left:50%;top:32mm;transform:translateX(-50%);display:flex;align-items:flex-end;gap:2.6mm;height:96mm">${fl.map(f=>`<div style="width:${Math.max(9,22*Math.sqrt(f.areaM2/fl[0].areaM2)).toFixed(1)}mm;height:${(30+66*f.areaM2/fl[0].areaM2).toFixed(1)}mm;background:${f.color};box-shadow:0 0 0 .2mm rgba(0,0,0,.14)"></div>`).join('')}</div>
  <div style="position:absolute;left:50%;top:130mm;transform:translateX(-50%);width:200mm;border-top:.35mm solid var(--d-ink)"></div></figure>
  <div style="position:absolute;left:16mm;right:16mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6mm;align-items:end">
   <div><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><h1 class="h1" style="font-size:${TITLE.length>55?'14pt':'22pt'};margin-top:1mm">${esc(TITLE)}</h1></div>
   <p class="caption" style="margin:0">${esc(sub)}</p><p class="caption" style="margin:0;text-align:right">${fl.length?'Cada bloque es un pavimento del modelo, con altura proporcional a su superficie. Colores del modelo, no muestras físicas.':'El proyecto no tiene pavimentos asignados: no hay bloques que mostrar.'}</p></div>`};};
 function boardPages(){if(!rooms.length)return [{html:`<div class="grid"><div class="c1-6"><h2 class="h2">Materiales por estancia</h2><p class="read">El proyecto no tiene estancias: no hay materiales que asignar.</p></div></div>`}];const cellOf=r=>{const m=floorOf(r),objs=rowsIn(r);
   return `<div style="border-top:.35mm solid var(--d-ink);padding-top:2mm;display:grid;grid-template-columns:15mm 1fr;gap:3mm;break-inside:avoid"><i style="display:block;height:15mm;background:${m?m.color:T.field};border:.2mm solid rgba(0,0,0,.14)"></i>
    <div><div class="h3" style="margin:0">${esc(r.name)}</div><div class="caption" style="margin:0">${m?esc(m.name):'Sin pavimento asignado'}${r.areaM2!=null?`, ${num(r.areaM2)} m²`:''}</div><div class="caption" style="margin:.4mm 0 0">${objs.length?`${objs.reduce((s,x)=>s+x.qty,0)} objetos: ${objs.map(x=>x.tag).join(', ')}`:'Sin objetos'}</div></div></div>`;};
  const per=LONG_ROOMS?6:15,out=[];for(let k=0;k<rooms.length;k+=per){const cells=rooms.slice(k,k+per).map(cellOf).join('');const first=k===0,total=Math.ceil(rooms.length/per);
  out.push({html:`<div style="display:grid;grid-template-columns:60mm 1fr;gap:8mm;height:176mm"><div><h2 class="h2">Materiales por estancia</h2>${total>1?`<p class="caption" style="margin:-2mm 0 4mm">Parte ${k/per+1} de ${total}</p>`:''}${first?`<p class="read">El pavimento de cada estancia y las referencias de los objetos que contiene.</p>
   <p class="note" style="margin-top:6mm"><b>Paredes.</b> ${S.board.walls.length?esc(S.board.walls.map(w=>w.name).join(', ')):'El proyecto no tiene acabados de pared asignados: no se muestra ninguno.'}</p>`:''}</div>
   <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4mm 6mm;align-content:start">${cells}</div></div>`});}return out;}
 // One card per schedule line (FF&E spec book / product cut sheet grammar): tag, item, room, quantity, footprint at
 // 1:50, key plan locator and every unknown written as such. Nothing about the product is filled in.
 const keyPlan=(idxs,{w=36,h=30}={})=>{const pts=[...S.geometry.walls.flatMap(x=>[x.start,x.end])],b=bbox(pts),pad=300,vbW=b.x1-b.x0+2*pad,vbH=b.y1-b.y0+2*pad,k=Math.min(w/vbW,h/vbH),u=UNIT_MM/k;
  const mine=new Set(idxs);return `<svg class="key" viewBox="${b.x0-pad} ${b.y0-pad} ${vbW} ${vbH}" width="${vbW*k}mm" height="${vbH*k}mm" role="img"><title>Situación en la planta</title>${rooms.map(q=>`<polygon points="${q.polygon.map(p=>p.x+','+p.y).join(' ')}" fill="${T.paper}"/>`).join('')}
   ${S.geometry.walls.map(x=>`<line x1="${x.start.x}" y1="${x.start.y}" x2="${x.end.x}" y2="${x.end.y}" stroke="${T.muted}" stroke-width="${Math.max(x.thicknessMm*.6,.3*u)}"/>`).join('')}
   ${S.geometry.objects.map((g,i)=>mine.has(i)?`<rect x="${-g.size.widthMm/2}" y="${-g.size.depthMm/2}" width="${g.size.widthMm}" height="${g.size.depthMm}" fill="${T.ink}" transform="translate(${g.position.x} ${g.position.y}) rotate(${g.rotationDeg||0})"/>`:'').join('')}</svg>`;};
 const footprint=(wmm,dmm,{scale=50,max=34}={})=>{let s=scale;while(Math.max(wmm,dmm)/s>max-9)s=s===50?75:s===75?100:s+50;const w=wmm/s,d=dmm/s;
  return `<svg width="${max}mm" height="${max}mm" viewBox="0 0 ${max} ${max}" role="img"><title>Huella en planta a escala 1:${s}</title><rect x="${(max-w)/2}" y="${(max-d)/2}" width="${w}" height="${d}" fill="${T.field}" stroke="${T.ink}" stroke-width=".3"/>
   <text x="${max/2}" y="${(max-d)/2-1.2}" text-anchor="middle" font-size="2.6" fill="${T.muted}">${num(wmm,0)}</text><text x="${(max+w)/2+1.2}" y="${max/2}" font-size="2.6" fill="${T.muted}" dominant-baseline="middle" transform="rotate(90 ${(max+w)/2+1.2} ${max/2})" text-anchor="middle">${num(dmm,0)}</text></svg><div class="caption" style="margin:0;text-align:center">1:${s}</div>`;};
 const idxOfRow=x=>S.objects.map((o,i)=>i).filter(i=>tagOf(i)===x.tag);
 const card=x=>{const idx=idxOfRow(x),g=S.geometry.objects[idx[0]],o=S.objects[idx[0]];
  return `<article style="border-top:.35mm solid var(--d-ink);padding-top:2.4mm;display:grid;grid-template-columns:1fr 36mm;gap:2mm 5mm;min-height:0">
   <div><div style="display:flex;gap:3mm;align-items:baseline"><span style="font-weight:700;font-size:16pt;line-height:1;white-space:nowrap">${x.tag}</span><span class="h3" style="margin:0;font-size:11pt">${esc(x.name)}</span></div>
    <table style="margin-top:2mm"><tbody>
     <tr><td class="muted">Estancia</td><td>${esc(x.room)}</td></tr><tr><td class="muted">Cantidad</td><td>${x.qty} ud.</td></tr>
     <tr><td class="muted">Medida</td><td>${x.size?x.size+' mm (ancho × fondo)':'<span class="unk">Sin medida</span>'}</td></tr><tr><td class="muted">Altura</td><td><span class="unk">No definida en el modelo</span></td></tr>
     <tr><td class="muted">Acabado</td><td>${o.materialId&&matById[o.materialId]?esc(matById[o.materialId].name):'<span class="unk">Sin material asignado</span>'}</td></tr>
     <tr><td class="muted">Producto</td><td>${x.ref?esc(x.ref):'<span class="unk">Sin referencia de producto</span>'}</td></tr><tr><td class="muted">Precio</td><td><span class="unk">Sin precio</span></td></tr></tbody></table></div>
   <div style="display:flex;flex-direction:column;gap:2mm;align-items:center">${g?footprint(g.size.widthMm,g.size.depthMm):''}${keyPlan(idx)}</div></article>`;};
 const LONG_ITEMS=rows.some(x=>x.name.length>40||x.room.length>40);
 const cardPages=(list,per=LONG_ITEMS?2:4)=>{const out=[];for(let i=0;i<list.length;i+=per){const chunk=list.slice(i,i+per);
  out.push({html:`<div style="display:grid;grid-template-columns:52mm 1fr;gap:8mm;height:176mm"><div><h2 class="h2">Fichas de mobiliario</h2><p class="caption" style="margin:-2mm 0 4mm">${chunk[0].tag} a ${chunk.at(-1).tag} de ${list.at(-1).tag}</p>${i===0?`<p class="read">Una ficha por línea del listado: lo que el modelo sabe del objeto y, escrito, lo que no sabe.</p>
   <p class="note" style="margin-top:6mm"><b>Sin productos asignados.</b> Ningún objeto del proyecto tiene fabricante, acabado ni precio. RUBIK no los inventa: quedan abiertos hasta que el estudio los elija.</p>`:''}</div>
   <div style="display:grid;grid-template-columns:1fr 1fr;grid-template-rows:${per>2?'1fr 1fr':'1fr'};gap:5mm 8mm">${chunk.map(card).join('')}</div></div>`});}return out;};
 D['materials-furniture-book-v3']=doc('materials-furniture-book-v3','Libro de materiales y mobiliario','client',[
  giantCover('Materiales',`${S.board.floors.length} pavimentos y ${S.objects.length} objetos del modelo, ${date}`),...boardPages(),...(rows.length?cardPages(rows):[{html:`<div class="grid"><div class="c1-6"><h2 class="h2">Fichas de mobiliario</h2><p class="read">El proyecto no tiene objetos colocados: no hay fichas.</p></div></div>`}])]);
 // ---------- commercial proposal v3: chapter chart, one-page summary, client and professional versions ----------
 const unit={m2:'m²',m:'m',unit:'ud'};
 const chapterTotals=V=>V.chapters.map(c=>({title:c.title,n:c.lines.length,net:c.lines.reduce((s,l)=>s+l.subtotalNet,0)})).sort((a,b)=>b.net-a.net);
 // dataviz: ranked horizontal bars, one hue (ink), ≤24 px bars, value at the tip in a text token, one baseline, no legend.
 function chapterChart(V,{w=150}={}){const t=chapterTotals(V),max=Math.max(...t.map(x=>x.net)),label=44,valW=44,bw=w-label-valW,rowH=11,barH=5.2;
  return `<svg width="${w}mm" height="${t.length*rowH+4}mm" viewBox="0 0 ${w} ${t.length*rowH+4}" role="img" aria-label="Importe neto por capítulo"><title>Importe neto por capítulo, de mayor a menor</title>
   <line x1="${label}" y1="0" x2="${label}" y2="${t.length*rowH+2}" stroke="${T.rule}" stroke-width=".25"/>
   ${t.map((x,i)=>{const y=i*rowH+2,L=bw*x.net/max;return `<text x="${label-2.5}" y="${y+barH/2}" text-anchor="end" dominant-baseline="middle" font-size="3.4" fill="${T.ink}">${esc(x.title)}</text>
    <path d="M ${label} ${y} h ${Math.max(L-1,0)} a 1 1 0 0 1 1 1 v ${barH-2} a 1 1 0 0 1 -1 1 h ${-Math.max(L-1,0)} z" fill="${T.ink}"/>
    <text x="${label+L+2}" y="${y+barH/2}" dominant-baseline="middle" font-size="3.4" font-weight="700" fill="${T.ink}">${eur(x.net)}</text>
    <text x="${label+L+2}" y="${y+barH/2+4.6}" dominant-baseline="middle" font-size="3.2" fill="${T.muted}">${num(x.net/V.summary.net.amount*100,0)} % de la base, ${x.n} partidas</text>`;}).join('')}</svg>`;}
 const TEST=S.budget?.test?.label||'';
 function summaryPage(V,{variant}){const sm=V.summary;
  return {html:`<div class="grid"><div class="c1-5" style="display:flex;flex-direction:column;justify-content:space-between;height:178mm">
   <div><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><h1 class="h1" style="margin-top:2mm">Propuesta económica</h1><p class="lead" style="margin-top:2mm">${esc(TITLE)}</p></div>
   <div>${fig(nf(2).format(sm.gross.amount),'€','Total con IVA',`Base ${eur(sm.net.amount)} más IVA ${num(sm.tax.ratePercent,0)} % (${eur(sm.tax.amount)})`,'focal')}
    <p style="margin-top:4mm"><span class="status">${sm.reviewComplete?'Revisado por el estudio':'Pendiente de revisión profesional'}</span></p>
    <p class="caption">${sm.items-sm.unreviewed} de ${sm.items} partidas revisadas. ${variant==='professional'?`Presupuesto ${esc(V.budgetId)}.`:''}</p></div>
   <p class="note"><b>${esc(TEST)}</b></p></div>
  <div class="c7-12" style="display:flex;flex-direction:column;gap:6mm"><div><h3 class="h3">Importe neto por capítulo</h3>${chapterChart(V,{w:126})}</div>
   <div><h3 class="h3">Qué incluye</h3><p class="read" style="margin:0">${sm.items} partidas medidas por RUBIK sobre el modelo, en ${sm.chapters} capítulos: ${esc(V.chapters.map(c=>c.title.toLowerCase()).join(', '))}.</p></div>
   <div><h3 class="h3">Qué no incluye</h3><p class="read" style="margin:0">Mobiliario, equipamiento y honorarios: el proyecto no tiene precios para ellos y RUBIK no los estima.</p></div>
   ${variant==='professional'?`<div><h3 class="h3">Avisos para el estudio</h3>${V.warnings.length?`<ul class="caption" style="margin:0;padding-left:4mm">${V.warnings.map(w=>`<li>${w.code==='unreviewed-prices'?`${w.count} precios sin revisar`:esc(w.code)+(w.count?` (${w.count})`:'')}</li>`).join('')}</ul>`:'<p class="caption">Sin avisos.</p>'}
    <p class="caption">Trazabilidad: ${V.trace.projectQuantities} cantidades del proyecto, ${V.trace.manualQuantities} manuales, ${V.trace.ownPrices} precios propios, ${V.trace.referencePrices} de base de precios.</p></div>`:''}</div></div>`};}
 function detailPage(V,{variant}){const prof=variant==='professional';
  const head=prof?'<th>Partida</th><th class="num">Medición</th><th class="num">Merma</th><th class="num">Precio unitario</th><th>Origen del precio</th><th>Revisión</th><th class="num">Importe neto</th>':'<th>Partida</th><th class="num">Cantidad</th><th class="num">Precio unitario</th><th class="num">Importe neto</th>';
  const cols=prof?7:4;
  const body=V.chapters.map(c=>`<tr class="chap"><td colspan="${cols}">${esc(c.title)}</td></tr>${c.lines.map(l=>{const q=`${num(l.quantity.value,l.quantity.unit==='unit'?0:2)} ${unit[l.quantity.unit]||esc(l.quantity.unit)}`;
   return prof?`<tr><td>${esc(l.description)}</td><td class="num">${q}${l.quantity.status==='estimated'?' <span class="muted">est.</span>':''}</td><td class="num">${num(l.wastePercent,0)} %</td><td class="num">${eur(l.unitPrice)}</td><td>${esc(l.ownSource?.label||l.origin)}</td><td>${l.review==='pending'?'Pendiente':'Revisado'}</td><td class="num">${eur(l.subtotalNet)}</td></tr>`
    :`<tr><td>${esc(l.description)}</td><td class="num">${num(l.budgetQuantity,l.quantity.unit==='unit'?0:2)} ${unit[l.quantity.unit]||''}</td><td class="num">${eur(l.unitPrice)}</td><td class="num">${eur(l.subtotalNet)}</td></tr>`;}).join('')}
   <tr class="sub"><td colspan="${cols-1}">Subtotal ${esc(c.title.toLowerCase())}</td><td class="num">${eur(c.lines.reduce((s,l)=>s+l.subtotalNet,0))}</td></tr>`).join('');
  const sm=V.summary;
  return {html:`<div class="grid"><div class="c1-${prof?'12':'8'}"><h2 class="h2">${prof?'Detalle para el estudio':'Detalle del presupuesto'}</h2><table><thead><tr>${head}</tr></thead><tbody>${body}
   <tr class="total"><td colspan="${cols-1}">Base imponible</td><td class="num">${eur(sm.net.amount)}</td></tr><tr><td colspan="${cols-1}">IVA ${num(sm.tax.ratePercent,0)} %</td><td class="num">${eur(sm.tax.amount)}</td></tr><tr class="total"><td colspan="${cols-1}">Total con IVA</td><td class="num">${eur(sm.gross.amount)}</td></tr></tbody></table>
   <p class="caption">${prof?'Medición: cantidad calculada por RUBIK sobre el modelo (est. = escala estimada). El importe aplica la merma a la medición.':'Cantidad: medición del modelo más la merma de obra. Precios de prueba de laboratorio, no de mercado.'}</p></div>
   ${prof?'':`<div class="c9-12"><p class="note"><b>Lo que ve el cliente.</b> Partida, cantidad, precio e importe. El origen de cada precio, su revisión y los avisos internos quedan en la versión del estudio.</p></div>`}</div>`};}
 D['commercial-proposal-client-v3']=doc('commercial-proposal-client-v3','Propuesta económica, versión cliente','client',BC?[summaryPage(BC,{variant:'client'}),detailPage(BC,{variant:'client'})]:[noBudgetPage('Propuesta económica')]);
 D['commercial-proposal-studio-v3']=doc('commercial-proposal-studio-v3','Propuesta económica, versión estudio','technical',BV?[summaryPage(BV,{variant:'professional'}),detailPage(BV,{variant:'professional'})]:[noBudgetPage('Propuesta económica')]);
 // ---------- real-estate A4 portrait, one page: figures with their origin under each ----------
 const hero=(biggest&&views.find(v=>v.roomId===biggest.id))||views.find(v=>v.kind==='room')||views[0]||null;const byName=re=>rooms.filter(r=>re.test(r.name)).length;
 const reFig=(n,u,l,o)=>`<div style="border-top:.35mm solid var(--d-ink);padding-top:1.6mm"><div style="font-weight:700;font-size:22pt;line-height:1;letter-spacing:-.02em">${n}<span style="font-size:11pt;font-weight:400;margin-left:1mm">${u}</span></div><div style="font-weight:700;font-size:9.5pt;margin-top:1.4mm">${esc(l)}</div><div class="caption" style="margin:.4mm 0 0">${esc(o)}</div></div>`;
 const reSheet=()=>{if(!hero)return reB();const p=plan({w:84,h:78,callouts:false,labels:false});const sm=BV?.summary||null;
  return {cls:'bleed',foot:false,html:`<figure style="position:absolute;left:0;right:0;top:0;height:104mm;background:${hero.bg}" class="frame">${img(hero)}</figure>
  <div style="position:absolute;left:14mm;right:14mm;top:108mm;display:flex;justify-content:space-between;align-items:baseline"><span class="caption" style="margin:0">${esc(hero.label)}. ${VIEW_NOTE}</span></div>
  <div style="position:absolute;left:14mm;right:14mm;top:118mm"><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><h1 class="h1" style="font-size:${TITLE.length>55?'16pt':'26pt'};margin-top:1mm">${esc(TITLE)}</h1><p class="read" style="margin-top:2mm;max-width:none">${INTRO}</p></div>
  <div style="position:absolute;left:14mm;width:92mm;top:158mm;display:grid;grid-template-columns:1fr 1fr;gap:5mm 5mm">
   ${reFig(AREA,'m²','Superficie útil','Estimada por RUBIK sobre el modelo')}${reFig(rooms.length?byName(/^Dormitorio/):'—','','Dormitorios','Por el nombre de las estancias')}
   ${reFig(rooms.length?byName(/^Baño/):'—','','Baños','Por el nombre de las estancias')}${biggest?reFig(num(biggest.areaM2),'m²','Estancia mayor',biggest.name):reFig('—','','Estancia mayor','Sin estancias con superficie')}
   ${sm?reFig(nf(0).format(sm.gross.amount),'€','Reforma, IVA incluido','Precios de prueba, solo ilustran el formato'):reFig('—','','Reforma','El proyecto no tiene presupuesto')}${reFig(rooms.length||'—','','Estancias en el plano',rooms.length?`${rooms.length-C.counted.length} no computan`:'El proyecto no tiene estancias')}</div>
  <div style="position:absolute;right:14mm;width:82mm;top:158mm;display:flex;flex-direction:column;align-items:center">${p.svg}<p class="caption" style="align-self:flex-start">Planta dibujada desde la geometría del proyecto.</p></div>
  <div style="position:absolute;left:14mm;right:14mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm;border-top:.2mm solid var(--d-rule);padding-top:2mm">
   <p class="caption" style="margin:0"><b>No disponibles en el proyecto:</b> ubicación, precio de venta, año, orientación, planta del edificio y certificado energético.</p>
   <p class="caption" style="margin:0;text-align:right"><b>${esc(studio)}</b><br>${esc(prof.email||'')}${prof.web?'<br>'+esc(prof.web.replace(/^https?:\/\//,'')):''}<br>${esc(date)}</p></div>`};};
 D['real-estate-sheet-v3']=doc('real-estate-sheet-v3','Ficha inmobiliaria','realestate',[reSheet()],{size:'A4P'});
 // ---------- A3 sheet with the IFC Sheet title block as a strip at the right (50 × 180 mm) ----------
 {const p=plan({scale:50,objects:true,floorTint:false,pad:160});meta['architecture-sheet-strip']={callouts:p.callouts,dropped:p.dropped,keyed:p.keys.length};if(p.dropped)throw new Error('strip: room tags dropped '+p.dropped);
  const cell=(c,v,cls='')=>`<div class="${cls}"><small>${c}</small>${v?esc(v):'<span class="unk">No facilitado</span>'}</div>`;
  D['architecture-sheet-strip']=doc('architecture-sheet-strip','Lámina de arquitectura, cajetín en franja','technical',[{foot:false,html:`
  <div class="sheet-frame" style="position:absolute;inset:10mm;border:.7mm solid var(--d-ink)"></div>
  <div style="position:absolute;left:16mm;top:14mm;line-height:0">${p.svg}</div>
  ${NOGEO?'':`<div style="position:absolute;left:16mm;bottom:15mm;width:${Math.min(p.pw,250).toFixed(1)}mm" class="legend">${scaleBar(p.mmPerUnit)}<span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.ink}"/></svg>Portante y fachada</span><span><svg width="7mm" height="3mm"><rect width="7mm" height="3mm" fill="${T.partition}"/></svg>Tabique</span><span>Huecos y mobiliario según el modelo</span></div>`}
  <div style="position:absolute;left:${(16+p.pw+6).toFixed(1)}mm;top:16mm;width:${(360-6-(16+p.pw+6)).toFixed(1)}mm">
   <h2 class="h2" style="font-size:14pt">Cuadro de superficies</h2>${sheetTable()||`<table><thead><tr><th>Estancia</th><th class="num">m²</th></tr></thead><tbody>${rooms.map(r=>`<tr><td>${esc(r.name)}${r.counted?'':' <span class="muted">(no computa)</span>'}</td><td class="num">${r.areaM2==null?'<span class="unk">—</span>':num(r.areaM2)}</td></tr>`).join('')}<tr class="total"><td>Superficie útil computada</td><td class="num">${AREA}</td></tr></tbody></table>`}
   ${LONG_ROOMS?'':`<p class="caption">${esc(STATUS_AREA)}</p>${keyList(p.keys)}`}</div>
  <div style="position:absolute;right:12mm;top:14mm;width:46mm"><p class="note"><b>Alzados y secciones: no incluidos.</b> RUBIK no tiene motor de alzados ni de secciones; esta lámina no los dibuja.</p></div>
  <div class="tbs" style="position:absolute;right:10mm;bottom:10mm;width:50mm;height:180mm;border:.5mm solid var(--d-ink);border-right:none;border-bottom:none;display:grid;grid-template-rows:14mm repeat(9,1fr) 20mm 16mm;font-size:9pt;background:var(--d-paper);font-feature-settings:'cv08' 1">
   ${[prof.logo?`<div><small>Logotipo</small>${LOGO(9,44)}</div>`:cell('Logotipo',null),cell('Proyecto',TITLE),cell('Dirección',null),cell('Cliente',null),cell('Organización',prof.name),cell('Título','Planta de distribución propuesta'),cell('Dibujado por',prof.person),cell('Revisado por',null),cell('Fecha',date),cell('Revisión',P.revision||null)].join('')}
   <div><small>Lámina</small><span class="num">A-02</span></div><div><small>Escala</small><span style="font-size:12.8pt;font-weight:700">${NOGEO?'—':'1:50'}</span></div></div>`},...(LONG_ROOMS?[annexPage('A-02')]:[])],{size:'A3L'});}
 // ---------- Huashu gate: three directions for each new page type. One is used in v3; approving it is the owner's call ----------
 // The direction name goes in the running foot (never over the design): every gate page keeps a foot.
 // A design drawn without a foot (bleed) is placed in a box 14 mm shorter, so the foot never covers it; nothing inside changes.
 const withMark=(pg,t,chosen)=>({...pg,foot:true,note:`${t}${chosen?', usada en v3 (pendiente de aprobación)':''}`,html:pg.foot===false&&pg.cls==='bleed'?`<div style="position:absolute;inset:0 0 14mm 0;overflow:hidden">${pg.html}</div>`:pg.html});
 const R0=viewRooms[0];
 const spreadA=R0&&{cls:'bleed',html:`<figure style="position:absolute;inset:0 0 62mm 0;background:${R0.v.bg}" class="frame">${img(R0.v)}</figure>
  <div style="position:absolute;left:16mm;right:16mm;bottom:20mm;display:grid;grid-template-columns:1fr 2fr;gap:8mm"><div><h2 class="h2" style="margin:0">${esc(R0.r.name)}</h2><p class="caption">${VIEW_NOTE}</p></div>
  <p class="read" style="margin:0">${num(R0.r.areaM2)} m², ${floorOf(R0.r)?esc(floorOf(R0.r).name.toLowerCase()):'sin pavimento asignado'}. ${esc(cap(objPhrase(R0.r)))}.</p></div>`};
 const spreadC=R0&&(()=>{const p=roomPlan(R0.r,{scale:100,maxW:84,maxH:80,pad:300});return {html:`<div style="display:grid;grid-template-columns:2fr 1fr;grid-template-rows:auto 1fr;gap:5mm 8mm;height:176mm">
  <figure class="frame" style="background:${R0.v.bg};height:104mm">${img(R0.v)}</figure><div style="display:flex;flex-direction:column;align-items:center">${p.svg}<p class="caption">Escala 1:${p.scale}</p></div>
  <div>${objTable(R0.r)}</div><div><h2 class="h2">${esc(R0.r.name)}</h2><p class="note">${swatch(floorOf(R0.r),4.5)}${esc(floorOf(R0.r)?.name||'Sin pavimento asignado')}</p></div></div>`};})();
 const sheetA=x=>({html:`<div style="display:grid;grid-template-columns:52mm 1fr;gap:8mm;height:176mm"><div><h2 class="h2">Ficha de mobiliario</h2></div><div style="display:grid;grid-template-columns:1fr;max-width:150mm">${card(x)}</div></div>`});
 const sheetC=list=>({html:`<div class="grid"><div class="c1-3"><h2 class="h2">Mobiliario con situación</h2></div><div class="c4-12" style="grid-column:4/13"><table><thead><tr><th>Ref.</th><th>Objeto</th><th>Estancia</th><th class="num">Ud.</th><th class="num">Medida (mm)</th><th>Producto</th><th>Situación</th></tr></thead><tbody>
  ${list.map(x=>`<tr><td class="muted" style="white-space:nowrap">${x.tag}</td><td>${esc(x.name)}</td><td>${esc(x.room)}</td><td class="num">${x.qty}</td><td class="num">${x.size||'—'}</td><td><span class="unk">Sin referencia de producto</span></td><td>${keyPlan(idxOfRow(x),{w:22,h:17})}</td></tr>`).join('')}</tbody></table></div></div>`});
 const coverB=()=>{const fl=[...S.board.floors].sort((a,b)=>b.areaM2-a.areaM2),tot=fl.reduce((s,f)=>s+f.areaM2,0);
  return {cls:'bleed',foot:false,html:`<div style="position:absolute;inset:0 0 46mm 0;display:flex">${fl.map(f=>`<div style="flex:${f.areaM2};background:${f.color}"></div>`).join('')}</div>
  <div style="position:absolute;left:16mm;right:16mm;bottom:12mm;display:grid;grid-template-columns:1fr 1fr;gap:6mm;align-items:end"><div><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><h1 class="h1" style="margin-top:1mm">Materiales y mobiliario</h1></div>
  <p class="caption" style="margin:0">Cada franja es un pavimento del modelo, con anchura proporcional a su superficie (${num(tot)} m² en total). Colores del modelo, no muestras físicas.</p></div>`};};
 const coverC=()=>({html:`<div class="grid"><div class="c1-4" style="display:flex;flex-direction:column;justify-content:flex-end;height:178mm"><p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><h1 class="h1" style="margin-top:2mm">Materiales y mobiliario</h1><p class="lead" style="margin-top:2mm">${esc(TITLE)}</p></div><div class="c5-12" style="display:flex;align-items:center;justify-content:center">${axo({w:176,h:170})}</div></div>`});
 function reB(){const p=plan({w:170,h:150,callouts:false});return {foot:false,html:`<div style="display:flex;flex-direction:column;align-items:center">${p.svg}${keyList(p.keys)}</div><h1 class="h1" style="margin-top:6mm">${esc(TITLE)}</h1><p class="read" style="max-width:none;margin-top:2.5mm">${INTRO}</p>
  <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:5mm;margin-top:6mm">${reFig(AREA,'m²','Superficie útil','Estimada por RUBIK sobre el modelo')}${reFig(rooms.length?byName(/^Dormitorio/):'—','','Dormitorios','Por el nombre de las estancias')}${reFig(rooms.length?byName(/^Baño/):'—','','Baños','Por el nombre de las estancias')}</div>`};};
 const reC=()=>({foot:false,html:`<p class="meta" style="color:var(--d-ink);font-weight:700">${esc(studio)}</p><div style="font-family:var(--f-read);font-weight:600;font-size:120pt;line-height:1.15;letter-spacing:-.04em;margin-top:14mm">${num(area,0)}<span style="font-size:30pt;margin-left:3mm">m²</span></div>
  <p class="caption" style="margin-top:4mm">Superficie útil estimada por RUBIK sobre el modelo (${AREA} m²).</p><h1 class="h1" style="margin-top:10mm">${esc(TITLE)}</h1>
  <figure class="frame" style="margin-top:8mm;height:86mm;background:${hero.bg}">${img(hero)}</figure><p class="caption">${esc(hero.label)}. ${VIEW_NOTE}</p>`});
 if(!S.variant&&R0&&rows.length&&BV){D['directions-b1']=doc('directions-b1','Direcciones B1 por tipo de página','client',[
  withMark(spreadA,'Pliego de estancia A: la vista manda',false),withMark(roomLeft(R0.r),'Pliego de estancia B: el dibujo manda',true),withMark(spreadC,'Pliego de estancia C: lámina R46',false),
  withMark(sheetA(rows[0]),'Ficha de objeto A: una por página',false),withMark(cardPages(rows.slice(0,4))[0],'Ficha de objeto B: cuatro por página',true),withMark(sheetC(rows.slice(0,8)),'Ficha de objeto C: fila con situación',false),
  withMark(giantCover('Materiales',`${S.board.floors.length} pavimentos y ${S.objects.length} objetos del modelo, ${date}`),'Portada de materiales A: palabra gigante',true),withMark(coverB(),'Portada de materiales B: campo de muestras',false),withMark(coverC(),'Portada de materiales C: axonometría',false)]);
 D['directions-b1-portrait']=doc('directions-b1-portrait','Direcciones B1, ficha inmobiliaria','realestate',[
  withMark(reSheet(),'Ficha inmobiliaria A: la vista arriba',true),withMark(reB(),'Ficha inmobiliaria B: el dibujo arriba',false),withMark(reC(),'Ficha inmobiliaria C: la cifra',false)],{size:'A4P'});}else meta['directions-b1']=S.variant?'omitidas: las direcciones se comparan sobre el proyecto canónico, no sobre variantes de prueba':'omitidas: el proyecto no tiene vistas de estancia, objetos o presupuesto que comparar';
 return {D,meta};
};
