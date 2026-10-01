/* Local search metadata. Dimensions and names remain in their existing catalogs. */
(function(root){
'use strict';
const families={asientos:'Asientos',camas:'Camas',mesas:'Mesas',almacenaje:'Almacenaje',iluminacion:'Iluminación',decoracion:'Decoración y plantas',electrodomesticos:'Electrodomésticos',sanitarios:'Sanitarios',cocina:'Superficies de cocina',ocio:'Ocio'};
const specs={
 bed:['camas','cama lecho'],crib:['camas','cuna bebe'],nightstand:['mesas','mesilla mesa de noche'],wardrobe:['almacenaje','armario ropero'],dresser:['almacenaje','comoda tocador'],desk:['mesas','escritorio mesa de trabajo'],chair:['asientos','silla asiento'],bookshelf:['almacenaje','estanteria libreria'],baycushion:['decoracion','cojin almohadon'],
 sofa:['asientos','sofa sillon'],cornersofa:['asientos','sofa rinconera esquinero'],armchair:['asientos','sillon butaca asiento'],beanbag:['asientos','puf puff pouf asiento'],coffeetable:['mesas','mesa de centro'],sidetable:['mesas','mesa auxiliar'],tvstand:['almacenaje','mueble television'],rug:['decoracion','alfombra tapete'],shoecab:['almacenaje','zapatero recibidor'],floorlamp:['iluminacion','lampara luz'],plant:['decoracion','planta vegetacion'],table:['mesas','mesa comedor'],roundtable:['mesas','mesa redonda'],island:['cocina','isla cocina'],barstool:['asientos','taburete asiento'],counter:['cocina','encimera cocina'],stove:['electrodomesticos','cocina fogones placa'],ksink:['sanitarios','fregadero pila'],fridge:['electrodomesticos','frigorifico nevera refrigerador'],cabinet:['almacenaje','aparador armario almacenaje'],toilet:['sanitarios','inodoro vater wc'],vanity:['sanitarios','lavabo mueble bano'],shower:['sanitarios','ducha'],bathtub:['sanitarios','banera'],washer:['electrodomesticos','lavadora'],waterheater:['electrodomesticos','termo calentador'],tv:['electrodomesticos','televisor television'],aircon:['electrodomesticos','aire acondicionado'],acwall:['electrodomesticos','aire acondicionado split'],dishwasher:['electrodomesticos','lavavajillas'],ovencol:['electrodomesticos','horno'],dryer:['electrodomesticos','secadora'],purifier:['electrodomesticos','purificador'],officechair:['asientos','silla oficina asiento'],piano:['ocio','piano musica'],treadmill:['ocio','cinta correr ejercicio']
};
// Explicit placement/fallback metadata for accepted catalog IDs, never availability.
const assets={
 'rubik-sota-local/synthetic-bench':{type:'chair',room:5,terms:'banco asiento sintetico'},
 'immersphere-asset-lab/ikea-songesand-comoda-de-3-cajones-blanco-90366839-demo':{type:'dresser',room:0,terms:'comoda cajonera songesand ikea'},
 'immersphere-asset-lab/ikea-stockholm-2025-puf-alhamn-beige-80586139-demo':{type:'beanbag',room:1,terms:'puf puff pouf stockholm ikea'}
};
function normalize(text){return String(text??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().trim().replace(/\s+/g,' ');}
function build(groups,entries=[],label=s=>s,spanish=label){
 const seen=new Set(),result=[];
 function add(r){if(seen.has(r.id)||!specs[r.type]||!r.name.trim())throw Error('Duplicate or ambiguous search entry');seen.add(r.id);r.family=specs[r.type][0];r.terms=normalize([r.name,r.type,families[r.family],specs[r.type][1],r.extra||''].join(' '));result.push(r);}
 groups.forEach((g,ci)=>g.items.forEach((it,ii)=>add({id:`${ci}:${ii}`,kind:'generic',name:label(it[1]),extra:spanish(it[1]),room:String(ci),roomName:label(g.cat),type:it[0],item:it,dimensions:{width:it[2],height:it[5],depth:it[3]}})));
 for(const entry of entries){const meta=assets[entry.catalog+'/'+entry.id];if(!meta)continue;const d=entry.dimensionsMm;
  add({id:'asset:'+entry.catalog+'/'+entry.id,kind:'asset',name:entry.name,room:String(meta.room),roomName:label(groups[meta.room].cat),type:meta.type,extra:meta.terms,dimensions:d,entry,item:[meta.type,entry.name,d.width,d.depth,'#c9c2b7',d.height,entry]});
 }
 return result;
}
function filter(rows,{query='',room='',family=''}={}){const words=normalize(query).split(' ').filter(Boolean);return rows.filter(r=>(!room||r.room===room)&&(!family||r.family===family)&&words.every(w=>r.terms.includes(w)));}
const api={families,specs,assets,normalize,build,filter};if(typeof module==='object')module.exports=api;else root.FloorPlanFurnitureSearch=api;
})(globalThis);
