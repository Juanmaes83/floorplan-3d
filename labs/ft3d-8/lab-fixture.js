/* FIXTURE FT3D-8 VISUAL LAB — DATOS SINTETICOS DE DEMOSTRACION, NO ES UN PROYECTO REAL DE CLIENTE.
   Fechas, mediciones, precios, repartos y revisor son inventados para probar el laboratorio.
   No proceden del donante Flat-to-3D (su demo usa 14 semanas desde 2027-03-01; aqui no se reutilizan).
   Se construye con los motores reales FloorPlanBudget (C1-C4) y FloorPlanConstructionSchedule (FT3D-8V),
   asi que todas las reglas (dependencias, repartos, revision, importes desconocidos) son las del nucleo. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(require('../../js/budget-core.js'),require('../../js/construction-schedule-core.js'));
  else root.FT3D8LabFixture=factory(root.FloorPlanBudget,root.FloorPlanConstructionSchedule);
})(typeof globalThis!=='undefined'?globalThis:this,function(Budget,Schedule){
  'use strict';
  if(!Budget||!Schedule)throw new TypeError('FT3D8LabFixture requires FloorPlanBudget and FloorPlanConstructionSchedule');
  const SOURCE='FIXTURE de demostracion — no es un plan real';
  const reviewedAt='2026-11-05T09:00:00+01:00';
  const item=(id,description,{value,unit='unit',status='measured',complete=true,price=null,reviewed=true,asOf='2026-11-01'})=>{
    const quantity=Budget.manualQuantity({value,unit,status,complete,label:'FIXTURE medicion'});
    if(price===null)return Budget.createItem({id,description:'FIXTURE '+description,quantity,unitPrice:null,priceSource:null});
    const it=Budget.createItem({id,description:'FIXTURE '+description,quantity,...Budget.manualPrice({unitPrice:price,label:'FIXTURE tarifa estudio',asOf})});
    return reviewed?Budget.markReviewed(it,{reviewedAt}):it;
  };
  const walls=['wall-n','wall-s','wall-e','wall-w'];
  const task=(id,wbs,title,startDate,endDate,extra)=>({id,wbs,title,startDate,endDate,source:SOURCE,...extra});
  const tasks=()=>[
    task('implantacion','00','Implantacion de obra','2027-04-05','2027-04-09',{
      elements:[{elementId:'site-fence',role:'site'},{elementId:'site-hut',role:'site'}],budgetItemIds:['implantacion']}),
    task('excavacion','01','Excavacion','2027-04-12','2027-04-16',{dependsOn:['implantacion'],
      elements:[{elementId:'excavation',role:'site'},{elementId:'excavator',role:'temporary'},{elementId:'spoil-heap',role:'temporary'}],budgetItemIds:['excavacion']}),
    task('cimentacion','02','Cimentacion y solera','2027-04-19','2027-04-30',{dependsOn:['excavacion'],
      elements:[{elementId:'foundation',role:'structure'}],budgetAllocations:[{itemId:'hormigon',sharePercent:70}]}),
    task('grua','03','Grua y medios de elevacion','2027-05-04','2027-06-04',{
      dependsOn:[{taskId:'estructura',type:'SS',lagDays:0},{taskId:'cubierta',type:'FF',lagDays:0}],
      elements:[{elementId:'crane',role:'temporary'}],budgetItemIds:['grua']}),
    task('estructura','04','Estructura de madera','2027-05-04','2027-05-21',{dependsOn:[{taskId:'cimentacion',type:'FS',lagDays:3}],
      elements:[{elementId:'frame',role:'structure'}],budgetItemIds:['estructura']}),
    task('cubierta','05','Cubierta','2027-05-24','2027-06-04',{dependsOn:['estructura'],
      elements:[{elementId:'roof',role:'envelope'}],budgetItemIds:['cubierta']}),
    task('cerramientos','06','Cerramientos','2027-05-27','2027-06-11',{dependsOn:[{taskId:'cubierta',type:'SS',lagDays:3}],
      elements:walls.map(elementId=>({elementId,role:'envelope'})),budgetItemIds:['cerramientos']}),
    task('andamios','07','Andamios','2027-05-27','2027-06-25',{
      dependsOn:[{taskId:'cerramientos',type:'SS',lagDays:0},{taskId:'revestimiento',type:'FF',lagDays:0}],
      elements:[{elementId:'scaffold',role:'temporary'}],budgetItemIds:['andamios']}),
    task('instalaciones','08','Instalaciones','2027-06-01','2027-06-25',{dependsOn:[{taskId:'cerramientos',type:'SS',lagDays:5}],
      elements:[{elementId:'services-core',role:'services'}],budgetItemIds:['instalaciones']}),
    task('carpinterias','09','Carpinterias y vidrios','2027-06-14','2027-06-18',{dependsOn:['cerramientos'],
      elements:[{elementId:'windows',role:'build'}],budgetItemIds:['carpinterias']}),
    task('revestimiento','10','Revestimiento exterior','2027-06-21','2027-06-25',{dependsOn:['carpinterias'],
      elements:walls.map(elementId=>({elementId,role:'cladding'})),budgetItemIds:['revestimiento']}),
    task('acabados','11','Acabados interiores','2027-06-28','2027-07-16',{
      dependsOn:['revestimiento',{taskId:'instalaciones',type:'FF',lagDays:5}],
      elements:[...walls.map(elementId=>({elementId,role:'finish'})),{elementId:'interior-floor',role:'build'}],budgetItemIds:['acabados']}),
    task('urbanizacion','12','Urbanizacion y relleno','2027-07-05','2027-07-16',{dependsOn:[{taskId:'revestimiento',type:'FS',lagDays:7}],
      elements:[{elementId:'deck',role:'build'},{elementId:'path',role:'build'},{elementId:'lawn',role:'build'},{elementId:'excavation',role:'demolition'}],
      budgetAllocations:[{itemId:'hormigon',sharePercent:30},{itemId:'jardineria',sharePercent:100}]}),
    task('retirada','13','Retirada de medios y limpieza','2027-07-19','2027-07-23',{dependsOn:['acabados','urbanizacion'],
      elements:[{elementId:'site-fence',role:'demolition'},{elementId:'site-hut',role:'demolition'}],budgetItemIds:['limpieza']})
  ];
  const items=()=>[
    item('implantacion','implantacion, vallado y caseta',{value:1,price:2400}),
    item('excavacion','excavacion de vaciado',{value:84,unit:'m2',price:14.2}),
    item('hormigon','hormigon de solera y caminos',{value:52,unit:'m2',price:118}),
    item('grua','alquiler de grua',{value:1,price:3600}),
    item('estructura','estructura de madera laminada',{value:96,unit:'m2',price:185}),
    item('cubierta','cubierta de chapa engatillada',{value:104,unit:'m2',price:68,status:'estimated'}),
    item('cerramientos','paneles de cerramiento',{value:118,unit:'m2',price:72}),
    item('andamios','andamio perimetral',{value:1,price:1450,reviewed:false}),
    item('instalaciones','instalaciones completas',{value:1,price:14800}),
    item('carpinterias','carpinterias y vidrios',{value:9,price:880}),
    item('revestimiento','revestimiento de madera',{value:118,unit:'m2',price:49}),
    item('acabados','acabados interiores',{value:142,unit:'m2',price:38}),
    item('jardineria','jardineria y cesped',{value:160,unit:'m2',price:null}),
    item('limpieza','retirada y limpieza final',{value:1,price:650})
  ];
  function labHouse(){
    const projectRef={type:'project',id:'fixture-lab-house',revision:'fixture-rev-1'};
    const schedule=Schedule.create({id:'fixture-lab-house-plan',projectRef,source:SOURCE,
      review:{status:'reviewed',by:'FIXTURE arquitecta',at:reviewedAt},tasks:tasks()});
    const budget={...Budget.createBudget({id:'fixture-lab-house-budget',subject:{type:'project',id:'fixture-lab-house'},
      title:'FIXTURE presupuesto demostracion',taxRatePercent:21}),items:items()};
    return {schedule,budget,label:'FIXTURE · vivienda de demostracion · no es un proyecto real de cliente'};
  }
  return Object.freeze({SOURCE,labHouse});
});
