/* M13 · Casos límite SINTÉTICOS para la exportación MSPDI. No son planes reales: fechas y nombres inventados solo para
   pruebas; cada id/origen lleva FIXTURE. Se construyen con la autoridad de planificación (Schedule.create). */
const Schedule=require('../../js/construction-schedule-core.js');
const SRC='FIXTURE de prueba — no es un plan real';
const ref={type:'project',id:'fixture-mspdi',revision:'fixture-rev-1'};
const t=(id,wbs,startDate,endDate,extra={})=>({id,title:'FIXTURE '+id,wbs,startDate,endDate,source:SRC,...extra});
const plan=(id,tasks,review={status:'draft',by:null,at:null})=>Schedule.create({id,projectRef:ref,source:SRC,review,tasks});
function cases(){
  return {
    // Hitos (un día, sin vínculos) frente a tarea de un día con elementos (no es hito).
    milestones:plan('fixture-milestones',[
      t('start','0','2027-01-04','2027-01-04'),
      t('one-day-work','1','2027-01-05','2027-01-05',{dependsOn:['start'],elements:[{elementId:'wall-a',role:'build'}]}),
      t('handover','2','2027-01-08','2027-01-08',{dependsOn:['one-day-work']})]),
    // Los cuatro tipos de dependencia con desfases positivos, cero y negativos, y tareas que cruzan fines de semana.
    dependencyTypes:plan('fixture-deps',[
      t('a','A','2027-03-01','2027-03-10'),
      t('fs','B','2027-03-13','2027-03-16',{dependsOn:[{taskId:'a',type:'FS',lagDays:2}]}),
      t('ss','C','2027-03-03','2027-03-12',{dependsOn:[{taskId:'a',type:'SS',lagDays:2}]}),
      t('ff','D','2027-03-05','2027-03-09',{dependsOn:[{taskId:'a',type:'FF',lagDays:-1}]}),
      t('sf','E','2027-02-25','2027-03-02',{dependsOn:[{taskId:'a',type:'SF',lagDays:1}]}),
      t('lead','F','2027-03-09','2027-03-20',{dependsOn:[{taskId:'a',type:'FS',lagDays:-2}]})],
      {status:'reviewed',by:'FIXTURE jefa de obra',at:'2027-02-01T10:00:00+01:00'}),
    // Texto con caracteres especiales XML, acentos y saltos (escapado sin pérdida), año bisiesto y cambio de año.
    textAndCalendar:plan('fixture-text',[
      t('amp','1.1','2027-12-30','2028-01-03',{title:'Demolición & «retirada» <tabique> "norte" — fase 1'}),
      t('leap','1.2','2028-02-28','2028-03-01',{dependsOn:['amp'],title:'Solera · ñandú · ç · día 29/02'})]),
    // Plan de una sola tarea y plan vacío.
    single:plan('fixture-single',[t('only','1','2027-06-01','2027-06-30')]),
    empty:plan('fixture-empty',[]),
    // Plan complejo: 6 frentes × 19 tareas con dependencias FS/SS/FF y desfases, más un hito por frente. Las fechas se
    // calculan para cumplir cada dependencia (RUBIK valida, no reprograma).
    complex:plan('fixture-complex',(()=>{
      const out=[],by=new Map(),D=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
      for(let f=0;f<6;f++)for(let i=0;i<19;i++){
        const id=`f${f}-t${i}`,len=3+((f+i)%5),deps=[];
        if(i)deps.push(i%4===0?{taskId:`f${f}-t${i-1}`,type:'SS',lagDays:2}:{taskId:`f${f}-t${i-1}`,type:'FS',lagDays:i%5===0?1:0});
        if(f&&i%3===0)deps.push({taskId:`f${f-1}-t${i}`,type:'FF',lagDays:5});
        let start=ms('2027-01-04')+f*2*D,end;
        for(const d of deps){const p=by.get(d.taskId);if(d.type==='FS')start=Math.max(start,ms(p.endDate)+D+d.lagDays*D);if(d.type==='SS')start=Math.max(start,ms(p.startDate)+d.lagDays*D);}
        end=start+(len-1)*D;
        for(const d of deps){const p=by.get(d.taskId);if(d.type==='FF')end=Math.max(end,ms(p.endDate)+d.lagDays*D);}
        const task=t(id,`${f+1}.${i+1}`,iso(start),iso(end),{dependsOn:deps.map(d=>d.type==='FS'&&!d.lagDays?d.taskId:d)});
        by.set(id,task);out.push(task);
      }
      for(let f=0;f<6;f++){const last=by.get(`f${f}-t18`),end=iso(ms(last.endDate)+D);out.push(t(`m${f}`,`${f+1}.M`,end,end,{title:`FIXTURE hito fin frente ${f+1}`,dependsOn:[last.id]}));}
      return out;
    })()),
  };
}
module.exports={cases};
