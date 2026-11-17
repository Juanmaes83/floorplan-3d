// v1.4 §4 · BLOQUES DOCUMENTALES de las recetas L (RP01, RP04, RP06, RP08, RP10, RP11, RP12) a partir de fuentes existentes y
// de la fixture rotulada snapshot/aportaciones.json. Cada bloque es una página que se inserta en el documento de su receta.
// Regla de oro: los datos aportados se muestran con su atribución y el rótulo de fixture; lo que falta se dice; los honorarios
// nunca se derivan del coste de obra; compra, impuestos y reforma no se suman (autoridades distintas); precio de producto solo
// si está verificado. Devuelve {pages:{docId:[página]}, en:{es→en}, data:[cadenas de datos que no se traducen], registro}.
'use strict';
module.exports=function bloques(C){
 const {S,esc,num,nf,date,rev,STUDIO,views,AP,planDemo}=C;
 const EN={};const t=(es,en)=>{EN[es]=en;return `<span>${esc(es)}</span>`;};
 const DATA=new Set();const d=x=>{if(x!=null&&String(x).trim())DATA.add(String(x).trim());return esc(x);};
 const A=AP?.campos||{},pages={},compuestas={};const put=(doc,campos,page)=>{page={...page,html:page.html.replace(/<(h[23]) class="(h[23])"([^>]*)><span>([^<]*)<\/span><\/h[23]>/g,'<$1 class="$2"$3>$4</$1>')}; // títulos: texto directo (la caja del título no crece por un span)
 (pages[doc]||=[]).push(page);for(const c of campos)(compuestas[c]||=new Set()).add(doc);};
 const eur=v=>nf(2).format(v)+' €';
 const rotulo=`<p class="caption" style="margin-top:4mm">${t('Datos de fixture sintética del laboratorio: inventados para probar el documento.','Synthetic laboratory fixture data: invented to test the document.')}</p>`;
 const atr=c=>`<p class="caption" style="margin:1mm 0 0">${t('Aportado por:','Contributed by:')} <span lang="es">${d(A[c].atribucion)}</span></p>`;
 // ---------- RP01: alcance, servicios, fases, honorarios, exclusiones y validez ----------
 if(A.alcanceServicios||A.honorarios){const sv=A.alcanceServicios?.valor||[],hn=A.honorarios?.valor||[];const fases=[...new Set([...sv.map(x=>x.fase),...hn.map(x=>x.fase)])];
  const tot=hn.reduce((s,x)=>s+x.importe,0);
  put('commercial-proposal-client-v3',['alcanceServicios','honorarios','exclusiones','validezOferta'].filter(c=>A[c]),{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${t('Alcance, servicios y honorarios','Scope, services and fees')}</h2>
   <p class="read">${t('Lo que el estudio hará en cada fase y lo que cobra por ello.','What the studio will do in each phase and what it charges for it.')}</p>
   <p class="note" style="margin-top:4mm"><b>${t('Honorarios separados del coste de la obra.','Fees kept apart from the construction cost.')}</b> ${t('No se calculan a partir del presupuesto.','They are not calculated from the budget.')}</p>${rotulo}</div>
   <div class="c5-12"><table><thead><tr><th>${t('Fase','Phase')}</th><th>${t('Servicios y entregables','Services and deliverables')}</th><th class="num">${t('Honorarios','Fees')}</th></tr></thead><tbody>
   ${fases.map(f=>{const s=sv.find(x=>x.fase===f),h=hn.find(x=>x.fase===f);return `<tr><td><span lang="es">${d(f)}</span></td><td>${s?`<span lang="es">${d(s.entregables)}</span>`:t('Sin alcance aportado','No scope contributed')}</td><td class="num">${h?eur(h.importe):t('No consta','Not stated')}</td></tr>`;}).join('')}
   ${hn.length?`<tr class="total"><td colspan="2">${t('Honorarios aportados, sin IVA','Contributed fees, excluding VAT')}</td><td class="num">${eur(tot)}</td></tr>`:''}</tbody></table>
   ${A.honorarios?atr('honorarios'):`<p class="caption">${t('Honorarios: no constan. No se derivan del coste de obra.','Fees: not stated. They are not derived from the construction cost.')}</p>`}
   <h3 class="h3" style="margin-top:5mm">${t('No incluye','Not included')}</h3>${A.exclusiones?`<ul class="read" style="margin:1mm 0 0 4mm;padding:0">${A.exclusiones.valor.map(x=>`<li><span lang="es">${d(x)}</span></li>`).join('')}</ul>`:`<p class="caption">${t('Exclusiones: no constan.','Exclusions: not stated.')}</p>`}
   <p class="read" style="margin-top:4mm"><b>${t('Validez de la oferta:','Offer validity:')}</b> ${A.validezOferta?`${A.validezOferta.valor.dias} ${t('días desde la fecha del documento.','days from the document date.')}`:t('no consta.','not stated.')}</p></div></div>`});}
 // ---------- RP12: estado de revisión del presupuesto y condiciones de completitud ----------
 const V=S.budget?.test?.view?.client;
 if(V){const sm=V.summary,rev_=sm.items-sm.unreviewed;compuestas.presupuestoRevisado=new Set(['commercial-proposal-client-v3']);
  put('commercial-proposal-client-v3',[],{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${t('Estado de revisión del presupuesto','Budget review status')}</h2><p class="read">${t('Cuándo este presupuesto puede tomarse como cerrado.','When this budget can be taken as final.')}</p></div>
   <div class="c5-12"><table><thead><tr><th>${t('Condición','Condition')}</th><th>${t('Estado','Status')}</th></tr></thead><tbody>
   <tr><td>${t('Todas las partidas con precio','Every line item priced')}</td><td>${sm.items} / ${sm.items}</td></tr>
   <tr><td>${t('Cantidades medidas sobre el modelo','Quantities measured on the model')}</td><td>${t('Sí, con la merma indicada','Yes, with the stated waste')}</td></tr>
   <tr><td>${t('Partidas revisadas por el estudio','Line items reviewed by the studio')}</td><td>${rev_} / ${sm.items}</td></tr>
   <tr><td>${t('Precios de mercado','Market prices')}</td><td>${t('No: precios de prueba del laboratorio','No: laboratory test prices')}</td></tr></tbody></table>
   <p class="note" style="margin-top:4mm"><b>${sm.reviewComplete?t('Presupuesto revisado por el estudio.','Budget reviewed by the studio.'):t('Presupuesto no revisado.','Budget not reviewed.')}</b> ${sm.reviewComplete?'':t('Es completo como documento, pero sus datos no están revisados: no es una oferta cerrada.','It is complete as a document, but its data is not reviewed: it is not a final offer.')}</p></div></div>`});}
 // ---------- RP04: compra, impuestos y reforma, separados por autoridad ----------
 if(A.precioInmueble||A.impuestosCompra){const row=(lab,v,auth)=>`<tr><td>${lab}</td><td class="num">${v}</td><td>${auth}</td></tr>`;
  put('real-estate-sheet-v3',['precioInmueble','impuestosCompra'].filter(c=>A[c]),{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${t('Compra y reforma','Purchase and renovation')}</h2>
   <p class="read">${t('Cada cifra con su origen. Son de autoridades distintas y no se suman.','Each figure with its source. They come from different authorities and are not added up.')}</p>${rotulo}</div>
   <div class="c5-12"><table><thead><tr><th>${t('Concepto','Item')}</th><th class="num">${t('Importe','Amount')}</th><th>${t('Origen','Source')}</th></tr></thead><tbody>
   ${row(t('Precio del inmueble','Property price'),A.precioInmueble?eur(A.precioInmueble.valor.importe):t('No consta','Not stated'),A.precioInmueble?`<span lang="es">${d(A.precioInmueble.atribucion)}</span>`:'—')}
   ${row(t('Impuestos de compra','Purchase taxes'),A.impuestosCompra?eur(A.impuestosCompra.valor.importe):t('No constan','Not stated'),A.impuestosCompra?`<span lang="es">${d(A.impuestosCompra.atribucion)}</span>`:'—')}
   ${row(t('Reforma, con IVA','Renovation, including VAT'),V?eur(V.summary.gross.amount):t('Sin presupuesto','No budget'),t('Presupuesto de RUBIK con precios de prueba','RUBIK budget with test prices'))}</tbody></table>
   ${A.impuestosCompra?`<p class="caption" style="margin-top:2mm"><span lang="es">${d(A.impuestosCompra.valor.concepto)}</span></p>`:''}
   <p class="note" style="margin-top:4mm"><b>${t('Sin financiación ni rentabilidad.','No financing or yield.')}</b> ${t('RUBIK no las calcula ni las estima.','RUBIK neither calculates nor estimates them.')}</p></div></div>`});}
 // ---------- RP06: concepto y referencias de moodboard (vistas propias, atribuidas) ----------
 if(A.referenciasMoodboard){const refs=A.referenciasMoodboard.valor.map(r=>({...r,v:views.find(v=>v.label===r.vista)})).filter(r=>r.v);
  put('interior-book-v3',['referenciasMoodboard','concepto'],{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${t('Concepto y referencias','Concept and references')}</h2>
   ${S.brand?.intro?`<p class="read" lang="es">${d(S.brand.intro)}</p><p class="caption">${t('Texto del estudio.','Studio text.')}</p>`:`<p class="caption">${t('El estudio no ha escrito el concepto.','The studio has not written the concept.')}</p>`}
   <p class="caption" style="margin-top:4mm">${t('Referencias tomadas de las vistas del propio modelo: sin imágenes de terceros.','References taken from the model’s own views: no third-party images.')}</p>${atr('referenciasMoodboard')}</div>
   <div class="c5-12" style="display:grid;grid-template-columns:1fr 1fr;gap:6mm">${refs.map(r=>`<figure style="margin:0"><img src="${r.v.src}" alt="${esc(r.vista)}" style="width:100%;height:92mm;object-fit:cover;display:block"><figcaption class="caption" style="margin-top:2mm"><b lang="es">${d(r.vista)}</b> <span lang="es">${d(r.nota)}</span></figcaption></figure>`).join('')}</div></div>`});}
 // ---------- RP08: oferta técnica, exclusiones y planificación disponible ----------
 if(A.ofertaTecnica){const tasks=(planDemo?.tasks||[]).slice(0,12);const df=s=>new Intl.DateTimeFormat('es-ES',{day:'numeric',month:'short',timeZone:'UTC'}).format(new Date(s));
  put('architecture-sheet-strip',['ofertaTecnica','exclusiones'].filter(c=>A[c]),{html:`<div style="position:absolute;left:16mm;top:16mm;right:16mm;display:grid;grid-template-columns:110mm 1fr;gap:12mm">
   <div><h2 class="h2" style="font-size:14pt">${t('Oferta técnica','Technical offer')}</h2><p class="read" lang="es">${d(A.ofertaTecnica.valor.metodo)}</p><p class="read"><b>${t('Plazo aportado:','Contributed duration:')}</b> ${A.ofertaTecnica.valor.plazoSemanas} ${t('semanas','weeks')}</p>${atr('ofertaTecnica')}
   <h3 class="h3" style="margin-top:6mm">${t('No incluye','Not included')}</h3>${A.exclusiones?`<ul class="read" style="margin:1mm 0 0 4mm;padding:0">${A.exclusiones.valor.map(x=>`<li><span lang="es">${d(x)}</span></li>`).join('')}</ul>`:`<p class="caption">${t('Exclusiones: no constan.','Exclusions: not stated.')}</p>`}
   <p class="note" style="margin-top:6mm"><b>${t('Plan y presupuesto no vinculados.','Plan and budget not linked.')}</b> ${t('El plan de ejemplo no tiene partidas asociadas: no se deduce coste por fase.','The example plan has no associated line items: no cost per phase is deduced.')}</p>${rotulo}</div>
   <div><h2 class="h2" style="font-size:14pt">${t('Planificación disponible','Available schedule')}</h2>${tasks.length?`<table><thead><tr><th>${t('Fase','Phase')}</th><th>${t('Inicio','Start')}</th><th>${t('Fin','End')}</th></tr></thead><tbody>${tasks.map(x=>`<tr><td lang="es">${d(x.title)}</td><td>${df(x.start)}</td><td>${df(x.end)}</td></tr>`).join('')}</tbody></table>
   <p class="caption" style="margin-top:2mm">${t('Plan de ejemplo de RUBIK aplicado a este proyecto: fechas ilustrativas, no un calendario de obra.','RUBIK example plan applied to this project: illustrative dates, not a works calendar.')}</p>`:`<p class="caption">${t('Sin plan de obra.','No works plan.')}</p>`}</div></div>`,foot:false});
  if(planDemo)(compuestas.planObra||=new Set()).add('architecture-sheet-strip');}
 // ---------- RP10: memoria descriptiva con superficies (finalidad distinta del libro técnico) ----------
 {const rooms=S.geometry.rooms,cnt=rooms.filter(r=>r.counted),nc=rooms.filter(r=>!r.counted),sum=a=>a.reduce((s,r)=>s+(r.areaM2||0),0);
  put('architecture-book',[],{html:`<div class="grid"><div class="c1-5"><h2 class="h2">${t('Memoria descriptiva','Descriptive report')}</h2>
   <p class="read">${t('Para qué sirve: describir la vivienda tal como está en el modelo, para el expediente del proyecto.','Purpose: to describe the home as it is in the model, for the project file.')}</p>
   ${S.brand?.intro?`<p class="read" lang="es" style="margin-top:3mm">${d(S.brand.intro)}</p><p class="caption">${t('Texto del estudio.','Studio text.')}</p>`:''}
   <p class="note" style="margin-top:4mm"><b>${t('No es una memoria constructiva.','Not a construction report.')}</b> ${t('Sin sistemas constructivos, estructura ni instalaciones: el modelo no los tiene.','No construction systems, structure or services: the model does not have them.')}</p></div>
   <div class="c7-12"><table><thead><tr><th>${t('Superficies','Areas')}</th><th class="num">${t('Estancias','Rooms')}</th><th class="num">m²</th></tr></thead><tbody>
   <tr><td>${t('Computan como superficie útil','Count as usable area')}</td><td class="num">${cnt.length}</td><td class="num">${num(sum(cnt))}</td></tr>
   <tr><td>${t('No computan','Do not count')}</td><td class="num">${nc.length}</td><td class="num">${num(sum(nc))}</td></tr>
   <tr class="total"><td>${t('Total de estancias','All rooms')}</td><td class="num">${rooms.length}</td><td class="num">${num(sum(rooms))}</td></tr></tbody></table>
   <p class="caption" style="margin-top:2mm">${t('Superficies calculadas por RUBIK sobre el modelo, con escala estimada.','Areas calculated by RUBIK on the model, at an estimated scale.')}</p></div></div>`});}
 // ---------- RP11: fichas positivas de catálogo (genérico / referencia / elegido / instalado) ----------
 if(A.catalogoProductos){const pv=new Map((A.preciosVerificados?.valor||[]).map(p=>[p.sku,p]));const ST={'referencia':t('Referencia','Reference'),'producto elegido':t('Producto elegido','Chosen product')};
  const cards=A.catalogoProductos.valor.map(c=>({c,o:S.objects.find(o=>o.id===c.objectId)})).filter(x=>x.o);
  put('materials-furniture-book-v3',['catalogoProductos',...(A.preciosVerificados?['preciosVerificados']:[])],{html:`<div class="grid"><div class="c1-4"><h2 class="h2">${t('Productos con referencia','Products with a reference')}</h2>
   <p class="read">${cards.length} ${t('de','of')} ${S.objects.length} ${t('objetos tienen ficha de catálogo aportada. El resto siguen siendo genéricos del modelo.','objects have a contributed catalogue sheet. The rest remain generic model items.')}</p>
   <p class="note" style="margin-top:4mm"><b>${t('Instalado: ninguno.','Installed: none.')}</b> ${t('No hay evidencia de obra ejecutada.','There is no evidence of executed works.')}</p>${rotulo}</div>
   <div class="c5-12"><table><thead><tr><th>${t('Objeto','Object')}</th><th>${t('Estado','Status')}</th><th>${t('Fabricante y referencia','Manufacturer and reference')}</th><th>${t('Acabado','Finish')}</th><th class="num">${t('Medida (mm)','Size (mm)')}</th><th class="num">${t('Precio','Price')}</th></tr></thead><tbody>
   ${cards.map(({c,o})=>{const p=pv.get(c.sku);return `<tr><td lang="es">${d(o.name)}</td><td>${ST[c.estado]||d(c.estado)}</td><td><span lang="es">${d(c.fabricante)}</span><br>${d(c.sku)}</td><td lang="es">${d(c.acabado)}</td><td class="num">${o.size?.widthMm&&o.size?.depthMm?`${nf(0).format(o.size.widthMm)} × ${nf(0).format(o.size.depthMm)}`:'—'}</td><td class="num">${p?eur(p.importe):t('No valorado','Not priced')}</td></tr>`;}).join('')}</tbody></table>
   ${A.preciosVerificados?atr('preciosVerificados'):''}${atr('catalogoProductos')}<p class="caption" style="margin-top:2mm">${t('Precio solo cuando está verificado; «no valorado» no es cero. No forma parte del presupuesto de obra.','Price only when verified; «not priced» is not zero. It is not part of the works budget.')}</p></div></div>`});}
 return {pages,en:EN,data:[...DATA],compuestas:Object.fromEntries(Object.entries(compuestas).map(([k,v])=>[k,[...v]]))};
};
