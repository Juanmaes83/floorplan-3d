/* FT3D-8 · M1 lab · DEMONSTRATION DATA ONLY. Every code, text, price, reference and coordinate below is invented.
   Same synthetic content as tests/fixtures (BCCA-like editions 2024/2025 and a studio tariff). Nothing here is BCCA,
   Catastro or client data. */
(function(root){
 'use strict';
 const file=records=>records.join('\r\n')+'\r\n\x1a';
 // BC3 «ANSI» (Windows-1252): one byte per character for the Latin texts used here.
 const bytes=text=>Uint8Array.from(text,c=>c.charCodeAt(0)&255);
 const ed=(rows)=>{const codes=rows.map(r=>r.split('|')[1]).filter(c=>c!=='SYN-EXC');return file([
  '~V|DATOS DE PRUEBA|FIEBDC-3/2016|Generador sintético|Precio|ANSI||||||',
  '~C|SYNB##||Base ficticia|||0|','~C|01#||Movimiento de tierras ficticio|||0|','~C|02#||Albañilería ficticia|||0|',...rows,
  '~D|SYNB##|01#\\1\\1\\02#\\1\\1\\||','~D|01#|SYN-EXC\\1\\1\\||',`~D|02#|${codes.map(c=>c+'\\1\\1\\').join('')}|`]);};
 const bcca={
  '2024':ed(['~C|SYN-EXC|m3|Excavación ficticia|9.5|01012024|0|','~C|SYN-FAB|m2|Fábrica de ladrillo ficticia|31.2|01012024|0|',
   '~C|SYN-PUE|ud|Puerta de paso ficticia|180|01012024|0|','~C|SYN-ROD|m|Rodapié ficticio|8.4|01012024|0|',
   '~C|SYN-OLD|m2|Partida retirada ficticia|12|01012024|0|','~C|SYN-NOPRICE|m2|Partida sin precio ficticia||01012024|0|',
   '~C|SYN-PIN|m2|Pintura plástica ficticia|6.8|01012024|0|']),
  '2025':ed(['~C|SYN-EXC|m3|Excavación ficticia|10.1|01012025|0|','~C|SYN-FAB|m2|Fábrica de ladrillo ficticia|33.7|01012025|0|',
   '~C|SYN-PUE|ud|Puerta de paso ficticia|180|01012025|0|','~C|SYN-ROD|kg|Rodapié ficticio por peso|2.1|01012025|0|',
   '~C|SYN-NOPRICE|m2|Partida sin precio ficticia||01012025|0|','~C|SYN-PIN|m2|Pintura plástica ficticia|7.2|01012025|0|'])
 };
 const tariff=file(['~V|ESTUDIO DE PRUEBA|FIEBDC-3/2016|Generador de prueba|Precios\\Zona A\\Zona B|ANSI||||||','~C|TARIFA##||Tarifa de prueba|||0|',
  '~C|C01#||Acabados|||0|','~C|PAV-ROBLE|m2|Pavimento de tarima de roble|38.5\\41|01092026\\|0|','~C|PINT-LISA|m2|Pintura plástica lisa en paredes|7.9\\8.4|01092026\\|0|',
  '~C|PUERTA-LISA|ud|Puerta de paso lisa lacada|210\\225|01092026\\|0|','~C|RODAPIE|ml|Rodapié de madera lacado|9.75\\10.2|01092026\\|0|',
  '~D|TARIFA##|C01#\\1\\1\\||','~D|C01#|PAV-ROBLE\\1\\1\\PINT-LISA\\1\\1\\PUERTA-LISA\\1\\1\\RODAPIE\\1\\1\\||']);
 const source=edition=>({label:`DATOS DE PRUEBA — base tipo BCCA ${edition}`,sourceName:'DATOS DE PRUEBA — base inventada con estructura BCCA',sourceUrl:null,edition,attribution:null,licenseName:null,licenseUrl:null});
 function budget(B){
  let b=B.createBudget({id:'bud_demo-vivienda',subject:{type:'project',id:'prj_demo-a'},title:'Presupuesto de prueba · Vivienda A',taxRatePercent:21});
  b.chapters.push(B.createChapter({id:'ch1',title:'Albañilería y acabados',order:1}));
  const q=(value,unit)=>B.manualQuantity({value,unit,status:'measured'});
  b.items.push(B.createItem({id:'it-fab',chapterId:'ch1',description:'Fábrica de ladrillo en cerramientos',quantity:q(40,'m2')}));
  b.items.push(B.createItem({id:'it-pue',chapterId:'ch1',description:'Puertas de paso interiores',quantity:q(5,'unit')}));
  b.items.push(B.createItem({id:'it-rod',chapterId:'ch1',description:'Rodapié',quantity:q(60,'m')}));
  b.items.push(B.createItem({id:'it-pin',chapterId:'ch1',description:'Pintura de paredes',quantity:q(120,'m2')}));
  return B.validateBudget(b);
 }
 // Two invented projects (the parcel must land only on the selected one).
 const projects=[{id:'prj_demo-a',type:'project',name:'Vivienda A · datos de prueba',revision:'rev-a-3',footprint:{w:12000,h:9000}},
  {id:'prj_demo-b',type:'project',name:'Vivienda B · datos de prueba',revision:'rev-b-1',footprint:{w:9000,h:7000}}];
 // Synthetic INSPIRE CP answer (same structure the official WFS documents), clearly marked as test data.
 function wfsAnswer(reference,{x=500000,y=4500000,w=24,h=18,crs='25830'}={}){
  const ring=[[x,y],[x+w,y],[x+w,y+h],[x+w*.35,y+h*1.15],[x,y+h],[x,y]].map(p=>p.join(' ')).join(' ');
  return `<?xml version="1.0" encoding="UTF-8"?><wfs:FeatureCollection xmlns:wfs="http://www.opengis.net/wfs/2.0" xmlns:gml="http://www.opengis.net/gml/3.2" xmlns:cp="http://inspire.ec.europa.eu/schemas/cp/4.0" xmlns:base="http://inspire.ec.europa.eu/schemas/base/3.3" numberMatched="1" numberReturned="1"><wfs:member><cp:CadastralParcel gml:id="ES.SDGC.CP.${reference}"><cp:geometry><gml:MultiSurface srsName="http://www.opengis.net/def/crs/EPSG/0/${crs}"><gml:surfaceMember><gml:Surface srsName="http://www.opengis.net/def/crs/EPSG/0/${crs}"><gml:patches><gml:PolygonPatch><gml:exterior><gml:LinearRing><gml:posList srsDimension="2">${ring}</gml:posList></gml:LinearRing></gml:exterior></gml:PolygonPatch></gml:patches></gml:Surface></gml:surfaceMember></gml:MultiSurface></cp:geometry><cp:inspireId><base:Identifier><base:localId>${reference}</base:localId><base:namespace>ES.SDGC.CP</base:namespace></base:Identifier></cp:inspireId><cp:nationalCadastralReference>${reference}</cp:nationalCadastralReference></cp:CadastralParcel></wfs:member></wfs:FeatureCollection>`;
 }
 const demoReferences=Object.freeze({'1907401VK4810H':{},'8888888YY8888Y':{x:500100,w:30,h:14},'5555555XX5555X':{crs:'4326'}});
 root.FloorPlanM1Fixtures=Object.freeze({bytes,bcca,tariff,source,budget,projects,wfsAnswer,demoReferences});
})(globalThis);
