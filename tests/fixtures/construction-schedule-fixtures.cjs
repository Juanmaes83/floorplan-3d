/* FIXTURES FT3D-8V — DATOS SINTETICOS DE PRUEBA, NO SON PROYECTOS REALES.
   Fechas, precios, repartos y revisores son inventados solo para tests; no deben mostrarse a un
   cliente ni usarse como plantilla de plazos o costes. Cada objeto lleva "FIXTURE" en id/source.
   No contienen geometria: elementIds son claves de grupo visual que un adaptador futuro mapeara a
   FloorPlanProjectV1. No se copia ningun dato del donante Flat-to-3D (14 semanas / 2027-03-01). */
const Schedule=require('../../js/construction-schedule-core.js');
const Budget=require('../../js/budget-core.js');

const FIXTURE_SOURCE='FIXTURE de prueba — no es un plan real';
const reviewedAt='2026-11-04T09:00:00+01:00';
const priced=(id,{value,unit='unit',status='measured',price,reviewed=true,asOf='2026-11-01',complete=true})=>{
  const item=Budget.createItem({id,description:'FIXTURE '+id,
    quantity:Budget.manualQuantity({value,unit,status,complete,label:'FIXTURE medicion'}),
    ...Budget.manualPrice({unitPrice:price,label:'FIXTURE tarifa',asOf})});
  return reviewed?Budget.markReviewed(item,{reviewedAt}):item;
};
const unpriced=(id,{value,unit='unit'})=>Budget.createItem({id,description:'FIXTURE '+id,
  quantity:Budget.manualQuantity({value,unit,label:'FIXTURE medicion'}),unitPrice:null,priceSource:null});
const task=(id,wbs,startDate,endDate,extra={})=>({id,title:'FIXTURE '+id,wbs,startDate,endDate,source:FIXTURE_SOURCE,...extra});

/* 1. Vivienda sencilla: estructura -> cubierta -> revestimiento sobre los MISMOS muros,
   instalaciones solapadas (SS +15), suelos FF +3 y una partida de hormigon repartida 60/40. */
function simpleHouse(){
  const projectRef={type:'project',id:'fixture-house',revision:'fixture-rev-3'};
  const walls=['wall-n','wall-s','wall-e','wall-w'];
  const schedule=Schedule.create({id:'fixture-house-plan',projectRef,source:FIXTURE_SOURCE,
    review:{status:'reviewed',by:'FIXTURE arquitecta',at:reviewedAt},
    tasks:[
      task('site','00','2026-12-01','2026-12-04',{elements:[{elementId:'site-fence',role:'site'},{elementId:'site-hut',role:'site'}],budgetItemIds:['site-prep']}),
      task('foundations','01','2026-12-07','2026-12-18',{dependsOn:['site'],elements:[{elementId:'foundation',role:'structure'}],
        budgetAllocations:[{itemId:'concrete',sharePercent:60}]}),
      task('structure','02','2026-12-21','2027-01-15',{dependsOn:[{taskId:'foundations',type:'FS',lagDays:2}],
        elements:[...walls.map(elementId=>({elementId,role:'structure'})),{elementId:'roof-frame',role:'structure'},{elementId:'crane',role:'temporary'}],
        budgetItemIds:['timber-frame']}),
      task('roof','03','2027-01-18','2027-01-29',{dependsOn:['structure'],elements:[{elementId:'roof',role:'envelope'}],budgetItemIds:['roofing']}),
      task('services','04','2027-01-05','2027-02-05',{dependsOn:[{taskId:'structure',type:'SS',lagDays:15}],
        elements:[{elementId:'services-core',role:'services'}],budgetItemIds:['services']}),
      task('cladding','05','2027-02-01','2027-02-12',{dependsOn:['roof'],elements:walls.map(elementId=>({elementId,role:'cladding'})),budgetItemIds:['cladding']}),
      task('floors','06','2027-02-08','2027-02-15',{dependsOn:[{taskId:'cladding',type:'FF',lagDays:3}],
        elements:[{elementId:'floor-slab',role:'build'}],budgetAllocations:[{itemId:'concrete',sharePercent:40}]}),
      task('finishes','07','2027-02-16','2027-02-26',{dependsOn:['services','floors'],
        elements:walls.map(elementId=>({elementId,role:'finish'})),budgetItemIds:['finishes']})
    ]});
  const budget={...Budget.createBudget({id:'fixture-house-budget',subject:{type:'project',id:'fixture-house'},taxRatePercent:21}),
    items:[priced('site-prep',{value:1,price:1850}),priced('concrete',{value:38.5,unit:'m2',price:96.13}),
      priced('timber-frame',{value:142,unit:'m2',price:210}),priced('roofing',{value:96,unit:'m2',price:74.5,status:'estimated'}),
      priced('services',{value:1,price:12400}),priced('cladding',{value:118,unit:'m2',price:58}),priced('finishes',{value:260,unit:'m2',price:22.75})]};
  return {schedule,budget};
}

/* 2. Reforma de cocina: muros existentes (sin rol "appear"), demolicion, proteccion temporal,
   tabique nuevo que luego recibe acabado. Plan en borrador (plan-estimated). */
function kitchenReform(){
  const projectRef={type:'project',id:'fixture-kitchen',revision:'fixture-rev-1'};
  const schedule=Schedule.create({id:'fixture-kitchen-plan',projectRef,source:FIXTURE_SOURCE,review:{status:'draft'},
    tasks:[
      task('protect','00','2027-03-01','2027-03-12',{elements:[{elementId:'dust-screen',role:'temporary'}]}),
      task('demolition','01','2027-03-01','2027-03-03',{dependsOn:[{taskId:'protect',type:'SS',lagDays:0}],
        elements:[{elementId:'old-cabinets',role:'demolition'},{elementId:'old-tiles',role:'demolition'}],budgetItemIds:['demolition']}),
      task('services','02','2027-03-05','2027-03-08',{dependsOn:[{taskId:'demolition',type:'FS',lagDays:1}],
        elements:[{elementId:'kitchen-services',role:'services'}],budgetItemIds:['plumbing']}),
      task('partition','03','2027-03-06','2027-03-08',{dependsOn:[{taskId:'services',type:'SS',lagDays:1}],
        elements:[{elementId:'partition',role:'build'}],budgetItemIds:['partition']}),
      task('finishes','04','2027-03-09','2027-03-11',{dependsOn:['partition'],
        elements:[{elementId:'wall-existing-1',role:'finish'},{elementId:'partition',role:'finish'},{elementId:'new-tiles',role:'build'}],budgetItemIds:['tiling']}),
      task('cabinets','05','2027-03-10','2027-03-12',{dependsOn:[{taskId:'finishes',type:'FF',lagDays:1}],
        elements:[{elementId:'new-cabinets',role:'build'}],budgetItemIds:['cabinets']})
    ]});
  const budget={...Budget.createBudget({id:'fixture-kitchen-budget',subject:{type:'project',id:'fixture-kitchen'},taxRatePercent:21}),
    items:[priced('demolition',{value:1,price:640}),priced('plumbing',{value:1,price:1180,reviewed:false}),
      priced('partition',{value:7.2,unit:'m2',price:41}),priced('tiling',{value:14,unit:'m2',price:48,status:'estimated'}),
      priced('cabinets',{value:4.2,unit:'m',price:520})]};
  return {schedule,budget};
}

/* 3. Plan incompleto: borrador, partida sin precio, reparto 60 % pendiente de 40 %, partida sin
   asignar y cantidad incompleta. Nada debe aparecer como verificado ni como cero. */
function incompletePlan(){
  const projectRef={type:'building',id:'fixture-incomplete',revision:'fixture-rev-0'};
  const schedule=Schedule.create({id:'fixture-incomplete-plan',projectRef,source:FIXTURE_SOURCE,review:{status:'draft'},
    tasks:[
      task('earthworks','01','2027-05-03','2027-05-07',{elements:[{elementId:'excavation',role:'site'}],
        budgetAllocations:[{itemId:'earthworks',sharePercent:60}]}),
      task('slab','02','2027-05-10','2027-05-14',{dependsOn:['earthworks'],elements:[{elementId:'slab',role:'structure'}],budgetItemIds:['slab']}),
      task('walls','03','2027-05-17','2027-05-28',{dependsOn:['slab'],elementIds:['wall-a'],budgetItemIds:['walls']})
    ]});
  const budget={...Budget.createBudget({id:'fixture-incomplete-budget',subject:{type:'building',id:'fixture-incomplete'},taxRatePercent:21}),
    items:[priced('earthworks',{value:84,unit:'m2',price:12.5}),unpriced('slab',{value:42,unit:'m2'}),
      priced('walls',{value:60,unit:'m2',price:95,complete:false}),priced('landscaping',{value:1,price:900,reviewed:false})]};
  return {schedule,budget};
}

module.exports={FIXTURE_SOURCE,simpleHouse,kitchenReform,incompletePlan};
