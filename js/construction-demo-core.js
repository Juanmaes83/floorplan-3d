/* Demo pública «Ver cómo evoluciona una obra» (Evolución 4D).
   Construye EN MEMORIA, sin leer ni escribir el almacenamiento del navegador, un expediente de demostración a partir
   de la vivienda de ejemplo canónica de RUBIK (FloorPlanCore.initial(), js/reference-project.js):
   - el proyecto, como supuesto de OBRA NUEVA: los muros pasan a status «new» para que la casa se construya; la
     geometría, los huecos y las estancias son los del ejemplo, sin cambios;
   - un plan de ejemplo FloorPlanConstructionSchedule 0.2.0, con tareas vinculadas a elementos REALES del ejemplo y
     roles admitidos por las reglas de FT3D-8 (FloorPlanConstructionProject.ROLE_RULES), y su vínculo;
   - SIN presupuesto: la demo no muestra importes. Los precios los fija cada profesional en Presupuestar; poner aquí
     precios sobre las mediciones reales parecería un presupuesto profesional.
   Las fechas son ilustrativas y todo va rotulado como «datos de ejemplo». No depende de labs/ (no se publica).
   UMD: window.FloorPlanConstructionDemo / module.exports. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(()=>({Core:require('./project-core.js'),
    Schedule:require('./construction-schedule-core.js'),Adapter:require('./construction-project-adapter.js')}));
  else root.FloorPlanConstructionDemo=factory(()=>({Core:root.FloorPlanCore,Schedule:root.FloorPlanConstructionSchedule,Adapter:root.FloorPlanConstructionProject}));
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const ID='obra';
  const SOURCE='Datos de ejemplo de RUBIK: vivienda de ejemplo como obra nueva, fechas ilustrativas, sin presupuesto. No es un proyecto de cliente.';
  // Display names of the example (the same Spanish names the editor shows for this project); data stays in memory only.
  const NAMES={'三室两厅两卫':'Vivienda de ejemplo de RUBIK','主卧室':'Dormitorio principal','主卫浴':'Baño en suite','小孩房':'Dormitorio infantil',
    '客卫浴':'Baño de invitados','洗衣阳台':'Balcón-lavadero','子女房':'Dormitorio juvenil','厨房':'Cocina','餐厅':'Comedor','过道':'Pasillo',
    '客厅':'Salón','休闲阳台':'Balcón de estar','主卧飘窗':'Mirador del dormitorio principal','子女房飘窗':'Mirador del dormitorio juvenil'};
  const err=m=>{throw new Error('Demo de evolución: '+m);};

  // The example as a new-build project (in memory). Throws if the canonical example is not a valid project.
  function project(){
    const {Core}=deps();if(!Core||typeof Core.initial!=='function')err('falta el proyecto de ejemplo de RUBIK');
    const p=Core.initial();
    p.name=NAMES[p.name]||'Vivienda de ejemplo de RUBIK';
    for(const r of p.rooms)if(NAMES[r.name])r.name=NAMES[r.name];
    for(const w of p.walls)w.status='new';
    Core.validate(p,{strict:true});
    return p;
  }

  // The example plan: every task links real element ids of the example with a role FT3D-8 admits for it.
  function tasks(p,key){
    const {Adapter}=deps();
    const structural=p.walls.filter(w=>w.structure==='load-bearing'||w.structure==='exterior').map(w=>w.id);
    const interior=p.walls.filter(w=>!structural.includes(w.id)).map(w=>w.id);
    if(!structural.length||!p.openings.length||!p.rooms.length)err('el proyecto de ejemplo no tiene muros, huecos o estancias');
    const el=(ids,role)=>ids.map(id=>({elementId:key(id),role}));
    const ill=(kind,role)=>({elementId:Adapter.ILLUSTRATIVE_PREFIX+kind,role});
    const t=(id,wbs,title,startDate,endDate,extra={})=>({id,wbs,title,startDate,endDate,source:SOURCE,...extra});
    return [
      t('implantacion','01','Implantación de la obra: vallado y caseta','2027-03-01','2027-03-05',{elements:[ill('site-fence','site'),ill('site-hut','site')]}),
      t('cimentacion','02','Cimentación (no se dibuja: RUBIK no la modela)','2027-03-08','2027-03-19',{dependsOn:['implantacion']}),
      t('estructura','03','Estructura y muros de fachada','2027-03-22','2027-04-16',{dependsOn:['cimentacion'],
        elements:[...el(structural,'structure'),ill('scaffold','site')]}),
      t('cubierta','04','Cubierta (no se dibuja: este ejemplo no tiene envolvente superior derivable)','2027-04-19','2027-04-30',{dependsOn:['estructura']}),
      t('tabiqueria','05','Tabiquería interior','2027-04-12','2027-05-07',{dependsOn:[{taskId:'estructura',type:'SS',lagDays:14}],elements:el(interior,'build')}),
      t('carpinteria','06','Puertas y ventanas','2027-05-10','2027-05-28',{dependsOn:['cubierta','tabiqueria'],elements:el(p.openings.map(o=>o.id),'build')}),
      t('instalaciones','07','Instalaciones (no se dibujan: RUBIK no las modela)','2027-05-10','2027-06-04',{dependsOn:['tabiqueria']}),
      t('acabados','08','Revestimientos y pintura','2027-06-07','2027-06-25',{dependsOn:['carpinteria','instalaciones'],elements:el(p.walls.map(w=>w.id),'finish')}),
      t('pavimentos','09','Pavimentos','2027-06-14','2027-07-02',{dependsOn:[{taskId:'acabados',type:'SS',lagDays:5}],elements:el(p.rooms.map(r=>r.id),'build')}),
      t('retirada','10','Retirada del andamio, la caseta y el vallado','2027-07-05','2027-07-09',{dependsOn:['acabados','pavimentos'],
        elements:[ill('scaffold','demolition'),ill('site-hut','demolition'),ill('site-fence','demolition')]})];
  }

  // The dossier input the Evolución page evaluates (same shape as ?source=library), built in memory.
  async function build(id=ID){
    if(id!==ID)err('demostración desconocida «'+id+'»');
    const {Schedule,Adapter}=deps();if(!Schedule||!Adapter)err('faltan los motores de la planificación de obra');
    const p=project(),fp=await Adapter.fingerprint(p),key=x=>Adapter.elementKey(null,x);
    const schedule=Schedule.create({id:'sch_demo-obra',projectRef:{type:'project',id:p.id,revision:fp},source:SOURCE,review:{status:'draft'},tasks:tasks(p,key)});
    const binding=Adapter.createBinding({id:'bnd_demo-obra',source:p,fingerprints:{project:fp,schedule:await Adapter.fingerprint(schedule),budget:null},
      scheduleId:schedule.id,budgetId:null,review:{status:'draft'}});
    return {project:p,budgets:[],selectedBudgetIds:null,schedule,binding,brand:null,registeredParcel:null,parcelDocument:null};
  }
  return Object.freeze({ID,SOURCE,project,build});
});
