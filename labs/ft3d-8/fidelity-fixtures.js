/* FIXTURES FT3D-8 FIDELIDAD — PROYECTOS SINTETICOS DE PRUEBA, NO SON PROYECTOS DE CLIENTES.
   Cada proyecto es un FloorPlanProjectV1 / FloorPlanBuildingV1 valido para los validadores reales de RUBIK
   (FloorPlanCore.validate strict, FloorPlanBuilding.validate). Los presupuestos se generan con el motor real
   FloorPlanBudgetDraft (mediciones 7A -> partidas 7B) y solo los PRECIOS de tarifa son inventados (FIXTURE).
   Las planificaciones son FloorPlanConstructionSchedule 0.2.0 cuyos elementos son IDs reales de estos proyectos.
   Ninguna geometria procede de la casa demo de scene.js ni del donante Flat-to-3D. */
(function(root,factory){
  if(typeof module==='object'&&module.exports)module.exports=factory(()=>({
    Core:require('../../js/project-core.js'),Building:require('../../js/building-core.js'),Budget:require('../../js/budget-core.js'),
    Draft:require('../../js/budget-draft-core.js'),Schedule:require('../../js/construction-schedule-core.js'),
    Adapter:require('../../js/construction-project-adapter.js')}));
  else root.FT3D8FidelityFixtures=factory(()=>({Core:root.FloorPlanCore,Building:root.FloorPlanBuilding,Budget:root.FloorPlanBudget,
    Draft:root.FloorPlanBudgetDraft,Schedule:root.FloorPlanConstructionSchedule,Adapter:root.FloorPlanConstructionProject}));
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const T0='2026-10-01T09:00:00Z',T1='2026-11-04T10:00:00Z';
  const SOURCE='FIXTURE de prueba — proyecto sintetico, no es de un cliente';
  const LABELS={title:'FIXTURE presupuesto',tariff:'FIXTURE tarifa del estudio',skirting:'Rodapie',paint:'Pintura de paredes',
    newWalls:'Tabiqueria y muros nuevos',demolition:'Demolicion de muros',door:'Puertas',slidingDoor:'Puertas correderas',window:'Ventanas',
    floor:m=>'Pavimento '+m,chapters:{floors:'Pavimentos',walls:'Acabados de paredes',partitions:'Tabiqueria',carpentry:'Carpinteria'}};
  const confirmed={method:'manual',review:'confirmed'},unreviewed={method:'manual',review:'unreviewed'},template={method:'template',review:'unreviewed'};
  const mats=[
    {id:'mat_fx-oak',name:'FIXTURE roble',category:'floor',appearance:{color:'#c9a172',preset:'wood'}},
    {id:'mat_fx-tile',name:'FIXTURE gres claro',category:'floor',appearance:{color:'#e6e1d6',preset:'tile-800'}},
    {id:'mat_fx-stone',name:'FIXTURE piedra gris',category:'floor',appearance:{color:'#9fa3a3'}},
    {id:'mat_fx-lime',name:'FIXTURE mortero de cal',category:'wall',appearance:{color:'#e9e1d1'}},
    {id:'mat_fx-clay',name:'FIXTURE revoco arcilla',category:'wall',appearance:{color:'#b5745a'}}];
  const base=(id,name,version,{scale,heightMm=2700,thicknessMm=250,sourceImages}={})=>({schema:'rubik-sota.floorplan-project',schemaVersion:version,id,name,
    createdAt:T0,updatedAt:T1,units:'mm',coordinateSystem:{origin:'plan-top-left',xAxis:'right',yAxis:'down',rotation:'degrees-clockwise'},
    scale,defaults:{wallHeightMm:heightMm,wallThicknessMm:thicknessMm},...(sourceImages?{sourceImages}:{}),walls:[],openings:[],rooms:[],materials:mats.map(m=>({...m,appearance:{...m.appearance}})),objects:[]});
  const W=(p,id,a,b,o={})=>p.walls.push({id,start:{x:a[0],y:a[1]},end:{x:b[0],y:b[1]},thicknessMm:o.t??p.defaults.wallThicknessMm,heightMm:o.h??p.defaults.wallHeightMm,
    structure:o.structure??'exterior',status:o.status??'new',...(o.mat?{surfaceMaterialId:o.mat}:{}),...(o.source!==null?{source:o.source??confirmed}:{})});
  const O=(p,id,wallId,kind,offsetMm,widthMm,heightMm,sillHeightMm,o={})=>p.openings.push({id,wallId,kind,offsetMm,widthMm,heightMm,sillHeightMm,
    ...(kind==='door'?{swing:{hinge:'start',side:'left'}}:{}),...(o.entrance?{isEntrance:true}:{}),...(o.source!==null?{source:o.source??confirmed}:{})});
  const R=(p,id,name,family,poly,mat,o={})=>p.rooms.push({id,name,family,polygon:poly.map(([x,y])=>({x,y})),floorMaterialId:mat,countsTowardArea:true,...(o.source!==null?{source:o.source??confirmed}:{})});
  const rect=(x0,y0,x1,y1)=>[[x0,y0],[x1,y0],[x1,y1],[x0,y1]];

  /* A — vivienda de una planta, 11,0 x 8,0 m, escala REAL (calibrada y verificada), elementos confirmados. */
  function projectA(){
    const {Core}=deps();
    const img={id:'img_fx-a-plan',role:'floor-plan',mediaType:'image/png',widthPx:2400,heightPx:1800,storage:{kind:'sidecar-file',ref:'fixture-a-plan.png'},
      placement:{originMm:{x:-500,y:-500},rotationDeg:0,mmPerPixel:5}};
    const scale={confidence:'real',method:'known-dimension',
      calibration:{sourceImageId:img.id,pointA:{x:100,y:100},pointB:{x:2300,y:100},knownLengthMm:11000,mmPerPixel:5,calibratedAt:'2026-10-02T09:00:00Z',confirmedByUser:true},
      verification:{sourceImageId:img.id,pointA:{x:100,y:200},pointB:{x:100,y:1800},knownLengthMm:8000,measuredLengthMm:8000,errorPercent:0,thresholdPercent:2,status:'consistent',verifiedAt:'2026-10-02T09:30:00Z'}};
    const p=base('prj_fx-house-a','FIXTURE A · Vivienda una planta','1.6.0',{scale,sourceImages:[img]});
    W(p,'wal_a-n',[0,0],[11000,0],{mat:'mat_fx-lime'});W(p,'wal_a-e',[11000,0],[11000,8000],{mat:'mat_fx-lime'});
    W(p,'wal_a-s',[11000,8000],[0,8000],{mat:'mat_fx-lime'});W(p,'wal_a-w',[0,8000],[0,0],{mat:'mat_fx-lime'});
    W(p,'wal_a-p1',[6500,0],[6500,8000],{t:100,structure:'partition'});W(p,'wal_a-p2',[6500,4500],[11000,4500],{t:100,structure:'partition'});
    O(p,'opn_a-n1','wal_a-n','window',1200,2200,1300,900);O(p,'opn_a-n2','wal_a-n','window',7800,1400,1200,1000);
    O(p,'opn_a-e1','wal_a-e','window',1600,1200,1200,1000);
    O(p,'opn_a-s1','wal_a-s','door',1400,1000,2100,0,{entrance:true});O(p,'opn_a-s2','wal_a-s','sliding-door',5600,2600,2200,0);
    O(p,'opn_a-w1','wal_a-w','window',2600,2000,1300,900);
    O(p,'opn_a-d1','wal_a-p1','door',1700,800,2050,0);O(p,'opn_a-d2','wal_a-p1','door',5600,800,2050,0);
    R(p,'rom_a-living','FIXTURE salon-cocina','living',rect(0,0,6500,8000),'mat_fx-oak');
    R(p,'rom_a-bed','FIXTURE dormitorio','bedroom',rect(6500,0,11000,4500),'mat_fx-oak');
    R(p,'rom_a-bath','FIXTURE bano','bathroom',rect(6500,4500,11000,8000),'mat_fx-tile');
    Core.validate(p,{strict:true});return p;
  }
  /* B — edificio de DOS plantas en L (FloorPlanBuildingV1), otras proporciones, escala estimada. */
  function buildingB(){
    const {Core,Building}=deps();
    const scale={confidence:'estimated',method:'declared-ratio',declaredRatio:'1:50'};
    const g=base('prj_fx-house-b-l0','FIXTURE B · planta baja','1.6.0',{scale,heightMm:2600,thicknessMm:300});
    const L=[[0,0],[9000,0],[9000,5000],[5000,5000],[5000,9000],[0,9000]];
    L.forEach((pt,i)=>W(g,'wal_b0-'+i,pt,L[(i+1)%L.length],{mat:i%2?'mat_fx-clay':undefined}));
    W(g,'wal_b0-p',[0,5000],[5000,5000],{t:120,structure:'partition'});
    O(g,'opn_b0-1','wal_b0-0','window',1000,1600,1400,800);O(g,'opn_b0-2','wal_b0-0','window',5600,2400,1600,700);
    O(g,'opn_b0-3','wal_b0-1','sliding-door',1200,2800,2300,0);O(g,'opn_b0-4','wal_b0-3','door',1500,1000,2150,0,{entrance:true});
    O(g,'opn_b0-5','wal_b0-4','window',1500,1500,1300,900);O(g,'opn_b0-6','wal_b0-5','window',3500,1800,1200,900,{source:unreviewed});
    O(g,'opn_b0-7','wal_b0-p','door',2000,900,2050,0);
    R(g,'rom_b0-day','FIXTURE estar','living',rect(0,0,9000,5000),'mat_fx-stone');
    R(g,'rom_b0-wing','FIXTURE estudio','office',rect(0,5000,5000,9000),'mat_fx-oak',{source:unreviewed});
    Core.validate(g,{strict:true});
    const u=base('prj_fx-house-b-l1','FIXTURE B · planta alta','1.6.0',{scale,heightMm:2500,thicknessMm:250});
    const S=rect(0,0,5000,5000);S.forEach((pt,i)=>W(u,'wal_b1-'+i,pt,S[(i+1)%4],{mat:'mat_fx-clay'}));
    O(u,'opn_b1-1','wal_b1-0','window',1200,2600,1400,700);O(u,'opn_b1-2','wal_b1-2','window',1800,1400,1200,900);
    R(u,'rom_b1-bed','FIXTURE dormitorio alto','bedroom',S,'mat_fx-oak');
    Core.validate(u,{strict:true});
    const b={schema:Building.SCHEMA,schemaVersion:'1.0.0',id:'bld_fx-house-b',name:'FIXTURE B · Vivienda en L de dos plantas',createdAt:T0,updatedAt:T1,units:'mm',
      levels:[{id:'lvl_fx-b0',name:'Planta baja',order:0,elevationMm:0,slabThicknessMm:0,offsetMm:{x:0,y:0},project:g},
              {id:'lvl_fx-b1',name:'Planta alta',order:1,elevationMm:2900,slabThicknessMm:300,offsetMm:{x:0,y:0},project:u}],stairs:[]};
    Building.validate(b);return b;
  }
  /* C — reforma de un piso existente: muros existentes, uno demolido, tabiques nuevos. Escala estimada (plantilla). */
  function projectC(){
    const {Core}=deps();
    const p=base('prj_fx-reform-c','FIXTURE C · Reforma de piso','1.6.0',{scale:{confidence:'estimated',method:'template'},heightMm:2650,thicknessMm:200});
    const E=rect(0,0,9000,6000);E.forEach((pt,i)=>W(p,'wal_c-x'+i,pt,E[(i+1)%4],{status:'existing',source:template}));
    W(p,'wal_c-old',[4000,0],[4000,6000],{t:100,structure:'partition',status:'demolished',source:template});
    W(p,'wal_c-new1',[6000,0],[6000,3500],{t:100,structure:'partition',status:'new'});
    W(p,'wal_c-new2',[6000,3500],[9000,3500],{t:100,structure:'partition',status:'new'});
    O(p,'opn_c-w1','wal_c-x0','window',1200,1500,1300,900,{source:template});O(p,'opn_c-w2','wal_c-x0','window',6800,1400,1300,900,{source:template});
    O(p,'opn_c-d0','wal_c-x2','door',6900,950,2100,0,{entrance:true,source:template});
    O(p,'opn_c-dn','wal_c-new2','door',600,800,2050,0);
    R(p,'rom_c-open','FIXTURE estar-cocina abierto','living',rect(0,0,6000,6000),'mat_fx-oak');
    R(p,'rom_c-bed','FIXTURE dormitorio','bedroom',rect(6000,0,9000,3500),'mat_fx-oak');
    R(p,'rom_c-hall','FIXTURE paso','hallway',rect(6000,3500,9000,6000),'mat_fx-tile');
    Core.validate(p,{strict:true});return p;
  }
  /* D — datos insuficientes: escala pendiente, fachada abierta (sin cubierta derivable), origenes sin revisar. */
  function projectD(){
    const {Core}=deps();
    const p=base('prj_fx-partial-d','FIXTURE D · Datos insuficientes','1.6.0',{scale:{confidence:'pending',method:'none'},heightMm:2700,thicknessMm:250});
    W(p,'wal_d-1',[0,0],[7000,0],{source:unreviewed});W(p,'wal_d-2',[7000,0],[7000,5000],{source:null});W(p,'wal_d-3',[7000,5000],[0,5000],{source:unreviewed});
    O(p,'opn_d-1','wal_d-1','window',2000,1500,1200,900,{source:null});
    R(p,'rom_d-1','FIXTURE recinto sin cerrar','unspecified',rect(0,0,7000,5000),'mat_fx-tile',{source:unreviewed});
    Core.validate(p,{strict:true});return p;
  }
  function budgetFor(project,prices,reviewedKeys){
    const {Budget,Draft}=deps();
    const first=Draft.draft(project,{labels:LABELS,taxRatePercent:21,name:v=>v});
    const tariff={};for(const [key,tk] of Object.entries(first.tariffKeys))if(prices[key]!==undefined)tariff[tk]={unitPrice:prices[key],asOf:'2026-11-01'};
    const b=Draft.draft(project,{labels:LABELS,tariff,taxRatePercent:21,name:v=>v}).budget;
    b.items=b.items.map(i=>reviewedKeys.includes(i.id)&&i.unitPrice!==null?Budget.markReviewed(i,{reviewedAt:'2026-11-04T11:00:00+01:00'}):i);
    return Budget.validateBudget(b);
  }
  const task=(id,wbs,title,startDate,endDate,extra={})=>({id,wbs,title:'FIXTURE '+title,startDate,endDate,source:SOURCE,...extra});
  const key=(Adapter,levelId,id)=>Adapter.elementKey(levelId,id);
  async function caseA(){
    const {Schedule,Adapter}=deps(),source=projectA(),k=id=>key(Adapter,null,id),fp=await Adapter.fingerprint(source);
    const ext=['wal_a-n','wal_a-e','wal_a-s','wal_a-w'],par=['wal_a-p1','wal_a-p2'];
    const ops=['opn_a-n1','opn_a-n2','opn_a-e1','opn_a-s1','opn_a-s2','opn_a-w1','opn_a-d1','opn_a-d2'];
    const schedule=Schedule.create({id:'sch_fx-house-a',projectRef:{type:'project',id:source.id,revision:fp},source:SOURCE,
      review:{status:'reviewed',by:'FIXTURE arquitecta',at:'2026-11-04T12:00:00+01:00'},tasks:[
        task('cimentacion','01','Cimentacion (sin geometria en RUBIK)','2027-09-06','2027-09-17'),
        task('muros','02','Muros de fachada','2027-09-20','2027-10-08',{dependsOn:['cimentacion'],elements:ext.map(id=>({elementId:k(id),role:'structure'})),
          budgetAllocations:[{itemId:'partition-new',sharePercent:75}]}),
        task('tabiques','03','Tabiqueria interior','2027-10-04','2027-10-15',{dependsOn:[{taskId:'muros',type:'SS',lagDays:10}],elements:par.map(id=>({elementId:k(id),role:'structure'})),
          budgetAllocations:[{itemId:'partition-new',sharePercent:25}]}),
        task('cubierta','04','Cubierta (envolvente superior derivada)','2027-10-11','2027-10-22',{dependsOn:['muros'],elements:[{elementId:k('roof'),role:'envelope'}]}),
        task('carpinteria','05','Carpinterias','2027-10-25','2027-11-05',{dependsOn:['cubierta','tabiques'],elements:ops.map(id=>({elementId:k(id),role:'build'})),
          budgetItemIds:['opening:door','opening:window','opening:sliding-door']}),
        task('acabados','06','Pintura y revestimientos','2027-11-08','2027-11-19',{dependsOn:['carpinteria'],elements:[...ext,...par].map(id=>({elementId:k(id),role:'finish'})),budgetItemIds:['paint']}),
        task('suelos','07','Pavimentos','2027-11-15','2027-11-26',{dependsOn:[{taskId:'acabados',type:'SS',lagDays:5}],
          elements:['rom_a-living','rom_a-bed','rom_a-bath'].map(id=>({elementId:k(id),role:'build'})),budgetItemIds:['floor:mat_fx-oak','floor:mat_fx-tile','skirting']})]});
    const budget=budgetFor(source,{'floor:mat_fx-oak':42,'floor:mat_fx-tile':36,skirting:9.5,paint:11,'partition-new':64,'opening:door':420,'opening:window':610,'opening:sliding-door':1350},
      ['floor:mat_fx-oak','floor:mat_fx-tile','skirting','paint','partition-new','opening:door','opening:window','opening:sliding-door']);
    const binding=Adapter.createBinding({id:'bnd_fx-house-a',source,fingerprints:{project:fp,schedule:await Adapter.fingerprint(schedule),budget:await Adapter.fingerprint(budget)},
      scheduleId:schedule.id,budgetId:budget.id,review:{status:'reviewed',by:'FIXTURE arquitecta',at:'2026-11-04T12:30:00+01:00'}});
    return {id:'A',label:'A · Vivienda una planta (escala real)',source,schedule,budget,budgets:null,binding};
  }
  async function caseB(){
    const {Schedule,Adapter}=deps(),source=buildingB(),fp=await Adapter.fingerprint(source);
    const k=(l,id)=>key(Adapter,l,id),g=source.levels[0].project,u=source.levels[1].project;
    const schedule=Schedule.create({id:'sch_fx-house-b',projectRef:{type:'building',id:source.id,revision:fp},source:SOURCE,review:{status:'draft'},tasks:[
      task('pb-muros','01','Muros planta baja','2028-03-06','2028-03-31',{elements:g.walls.map(w=>({elementId:k('lvl_fx-b0',w.id),role:'structure'}))}),
      task('pb-forjado','02','Forjado y cubierta de planta baja','2028-04-03','2028-04-14',{dependsOn:['pb-muros'],elements:[{elementId:k('lvl_fx-b0','roof'),role:'envelope'},{elementId:k('lvl_fx-b1','slab'),role:'structure'}]}),
      task('pa-muros','03','Muros planta alta','2028-04-10','2028-04-28',{dependsOn:[{taskId:'pb-forjado',type:'SS',lagDays:7}],elements:u.walls.map(w=>({elementId:k('lvl_fx-b1',w.id),role:'structure'}))}),
      task('pa-cubierta','04','Cubierta superior','2028-05-01','2028-05-12',{dependsOn:['pa-muros'],elements:[{elementId:k('lvl_fx-b1','roof'),role:'envelope'}]}),
      task('carpinteria','05','Carpinterias de ambas plantas','2028-05-15','2028-05-26',{dependsOn:['pa-cubierta'],
        elements:[...g.openings.map(o=>({elementId:k('lvl_fx-b0',o.id),role:'build'})),...u.openings.map(o=>({elementId:k('lvl_fx-b1',o.id),role:'build'}))]}),
      task('suelos','06','Pavimentos','2028-05-29','2028-06-09',{dependsOn:['carpinteria'],
        elements:[...g.rooms.map(r=>({elementId:k('lvl_fx-b0',r.id),role:'build'})),...u.rooms.map(r=>({elementId:k('lvl_fx-b1',r.id),role:'build'}))]})]});
    // RUBIK keeps one budget per level project (rubik-budget-v1[projectId]); there is no building budget authority.
    const budgets=[{levelId:'lvl_fx-b0',budget:budgetFor(g,{paint:12,'opening:window':580},['paint'])}];
    const binding=Adapter.createBinding({id:'bnd_fx-house-b',source,fingerprints:{project:fp,schedule:await Adapter.fingerprint(schedule),budget:null},
      scheduleId:schedule.id,budgetId:null,review:{status:'draft'}});
    return {id:'B',label:'B · Edificio en L de dos plantas',source,schedule,budget:null,budgets,binding};
  }
  async function caseC(){
    const {Schedule,Adapter}=deps(),source=projectC(),k=id=>key(Adapter,null,id),fp=await Adapter.fingerprint(source);
    const standing=['wal_c-x0','wal_c-x1','wal_c-x2','wal_c-x3','wal_c-new1','wal_c-new2'];
    const schedule=Schedule.create({id:'sch_fx-reform-c',projectRef:{type:'project',id:source.id,revision:fp},source:SOURCE,
      review:{status:'reviewed',by:'FIXTURE arquitecto',at:'2026-11-04T12:00:00+01:00'},tasks:[
        task('demolicion','01','Demolicion del tabique','2027-02-01','2027-02-05',{elements:[{elementId:k('wal_c-old'),role:'demolition'}],budgetItemIds:['demolition']}),
        task('tabiques','02','Tabiques nuevos','2027-02-08','2027-02-19',{dependsOn:['demolicion'],elements:['wal_c-new1','wal_c-new2'].map(id=>({elementId:k(id),role:'structure'})),budgetItemIds:['partition-new']}),
        task('puerta','03','Puerta interior nueva','2027-02-22','2027-02-24',{dependsOn:['tabiques'],elements:[{elementId:k('opn_c-dn'),role:'build'}],
          budgetAllocations:[{itemId:'opening:door',sharePercent:50}]}),
        task('pintura','04','Pintura','2027-02-25','2027-03-05',{dependsOn:['puerta'],elements:standing.map(id=>({elementId:k(id),role:'finish'})),budgetItemIds:['paint']}),
        task('suelos','05','Pavimentos','2027-03-01','2027-03-10',{dependsOn:[{taskId:'pintura',type:'SS',lagDays:4}],
          elements:['rom_c-open','rom_c-bed','rom_c-hall'].map(id=>({elementId:k(id),role:'finish'})),budgetItemIds:['floor:mat_fx-oak','floor:mat_fx-tile','skirting']})]});
    const budget=budgetFor(source,{demolition:18,'partition-new':52,'opening:door':390,paint:10.5,'floor:mat_fx-oak':44,skirting:9},
      ['demolition','partition-new','paint','floor:mat_fx-oak']);
    const binding=Adapter.createBinding({id:'bnd_fx-reform-c',source,fingerprints:{project:fp,schedule:await Adapter.fingerprint(schedule),budget:await Adapter.fingerprint(budget)},
      scheduleId:schedule.id,budgetId:budget.id,review:{status:'reviewed',by:'FIXTURE arquitecto',at:'2026-11-04T12:30:00+01:00'}});
    return {id:'C',label:'C · Reforma de piso existente',source,schedule,budget,budgets:null,binding};
  }
  async function caseD(){
    const {Adapter}=deps(),source=projectD();
    // No planning has been supplied by a professional, so none is invented.
    return {id:'D',label:'D · Datos insuficientes (sin plan)',source,schedule:null,budget:budgetFor(source,{},[]),budgets:null,binding:null,
      fingerprint:await Adapter.fingerprint(source)};
  }
  const CASES={A:caseA,B:caseB,C:caseC,D:caseD};
  return Object.freeze({SOURCE,CASES,ids:Object.keys(CASES),build:id=>{if(!CASES[id])throw new TypeError('unknown fixture case '+id);return CASES[id]();},
    projectA,buildingB,projectC,projectD,budgetFor,LABELS});
});
