/* UX-07 / ENT-04 · fixtures SINTÉTICAS del laboratorio antes/después. Solo para QA (?lab=1 y pruebas).
   - «Antes»: la vivienda de referencia de RUBIK (js/reference-project.js) con los nombres traducidos.
   - «Después»: la misma obra (mismo identificador de proyecto) con una reforma pequeña y conocida: un tabique a demoler,
     un muro nuevo, el suelo de la cocina cambiado, un acabado de pared declarado, una ventana nueva, un mueble quitado y
     otro movido.
   - Presupuestos de prueba de «después» con los borradores reales de RUBIK (FloorPlanBudgetDraft) y PRECIOS FICTICIOS,
     rotulados como tales en el propio dato (priceSource.label). No son precios de mercado ni de ningún cliente. */
(function(root,factory){
  const node=typeof module==='object'&&module.exports;
  const api=factory(node?require('../../js/reference-project.js'):root.FloorPlanReference,node?require('../../js/project-core.js'):root.FloorPlanCore,node?require('../../js/budget-draft-core.js'):root.FloorPlanBudgetDraft,node?require('../../js/budget-core.js'):root.FloorPlanBudget);
  if(node)module.exports=api;else root.UX07Fixtures=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(Reference,Core,Draft,Budget){
  'use strict';
  const ROOMS={'主卧室':'Dormitorio principal','主卫浴':'Baño principal','小孩房':'Dormitorio infantil','客卫浴':'Baño de invitados','洗衣阳台':'Lavadero','子女房':'Dormitorio juvenil','厨房':'Cocina','餐厅':'Comedor','过道':'Pasillo','客厅':'Salón','休闲阳台':'Terraza','主卧飘窗':'Mirador del dormitorio principal','子女房飘窗':'Mirador del dormitorio juvenil'};
  const MATS={'橡木地板':'Tarima de roble','胡桃木地板':'Tarima de nogal','800 地砖':'Baldosa 80×80','600 地砖':'Baldosa 60×60','大理石':'Mármol','300 防滑砖':'Baldosa antideslizante 30×30','水磨石':'Terrazo','满铺地毯':'Moqueta'};
  const OBJS={'双人床':'Cama doble','床头柜':'Mesilla','衣柜':'Armario','飘窗垫':'Cojín de mirador','淋浴房':'Mampara de ducha','马桶':'Inodoro','浴室柜':'Mueble de baño','单人床':'Cama individual','书桌':'Escritorio','椅子':'Silla','书架':'Estantería','淋浴区':'Zona de ducha','洗衣机':'Lavadora','洗衣池':'Pila de lavar','橱柜台面':'Encimera','燃气灶':'Placa de cocina','水槽':'Fregadero','冰箱':'Frigorífico','餐桌':'Mesa de comedor','餐椅':'Silla de comedor','餐边柜':'Aparador','地毯':'Alfombra','电视柜':'Mueble de TV','三人沙发':'Sofá de tres plazas','茶几':'Mesa de centro','单人沙发':'Butaca','鞋柜':'Zapatero','绿植':'Planta','茶桌':'Mesa de té','休闲椅':'Silla de descanso'};
  const LABELS={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié (perímetro de estancias, sin descontar puertas)',paint:'Pintura de paredes',newWalls:'Tabiquería nueva',demolition:'Demolición de tabiques',door:'Puerta',slidingDoor:'Puerta corredera',window:'Ventana',tariff:'Precio de prueba ficticio (laboratorio)',
    chapters:{floors:'Pavimentos y rodapiés',walls:'Acabados de paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
  // Precios FICTICIOS de laboratorio (€ por unidad de la partida). Solo para ejercitar los estados del presupuesto.
    // Claves de tarifa del borrador real (FloorPlanBudgetDraft.lines → tariffKey).
  const TEST_TARIFF={'floor:wood':40,'floor:walnut':55,'floor:tile-800':32,'floor:tile-600':28,'floor:marble':90,'floor:tile-300':25,'floor:terrazzo':60,'floor:carpet':20,
    skirting:9,paint:7,'partition-new':38,demolition:18,'opening:door':260,'opening:sliding-door':480,'opening:window':390};
  const STAMP='2026-11-12T00:00:00Z';

  function before(){
    const p=Core.clone(Reference);
    p.name='Vivienda de referencia (datos de prueba)';p.updatedAt='2026-10-01T09:00:00Z';
    for(const r of p.rooms)r.name=ROOMS[r.name]||r.name;
    for(const m of p.materials)m.name=MATS[m.name]||m.name;
    for(const o of p.objects)o.name=OBJS[o.name]||o.name;
    Core.validate(p);return p;
  }
  function after(){
    const p=before();p.updatedAt='2026-10-15T09:00:00Z';
    const wall=id=>p.walls.find(w=>w.id===id);
    wall('wal_ref-w32').status='demolished';                                      // tabique de la cocina, a demoler
    p.walls.push({id:'wal_ux07-new',start:{x:6600,y:2600},end:{x:7800,y:2600},thicknessMm:100,heightMm:2600,structure:'partition',status:'new'});
    p.rooms.find(r=>r.id==='rom_kitchen').floorMaterialId='mat_terrazzo';         // suelo de la cocina
    p.materials.push({id:'mat_ux07-paint',name:'Pintura blanca mate',category:'wall',appearance:{color:'#f3f1ea'}});
    wall('wal_ref-w34').surfaceMaterialId='mat_ux07-paint';                       // acabado de pared declarado
    p.openings.push({id:'opn_ux07-window',wallId:'wal_ref-w2',kind:'window',offsetMm:900,widthMm:900,heightMm:1200,sillHeightMm:900});
    p.objects=p.objects.filter(o=>o.id!=='obj_template-036');                     // planta quitada
    p.objects.find(o=>o.id==='obj_template-032').position.y-=400;                 // sofá movido 400 mm
    Core.validate(p);return p;
  }
  const tariff=keys=>Object.fromEntries(Object.entries(TEST_TARIFF).filter(([k])=>!keys||keys.includes(k)).map(([k,v])=>[k,{unitPrice:v,asOf:'2026-11-12'}]));
  /* kind: 'complete' (todas las partidas con precio de prueba) | 'partial' (sin precio: ventanas y pintura). project: de qué
     revisión se hace el borrador (por defecto «después»). */
  function budget(kind='complete',project=after()){
    const all=Object.keys(TEST_TARIFF),keys=kind==='partial'?all.filter(k=>k!=='opening:window'&&k!=='paint'):all;
    return Draft.draft(project,{tariff:tariff(keys),labels:LABELS,now:STAMP}).budget;
  }
  return Object.freeze({before,after,budget,LABELS,TEST_TARIFF,ids:['reforma-pequena']});
});
