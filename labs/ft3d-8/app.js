/* FT3D-8 Visual Lab controller. One cursor (pos, in days from preStartDate) drives:
   the Three.js scene, the Gantt cursor, the task/budget card and the week selector.
   Every number shown comes from the FT3D-8 core: FloorPlanConstructionSchedule (dates, stateAt, budgetReport),
   FloorPlanConstructionVisualState (timeline, frameAt), FloorPlanConstructionGantt (rows, cursor) and
   FloorPlanConstructionLabPresenter (labels). Fixture data: FT3D8LabFixture. */
import {createScene} from './scene.js';

const S=window.FloorPlanConstructionSchedule,V=window.FloorPlanConstructionVisualState,G=window.FloorPlanConstructionGantt,
  P=window.FloorPlanConstructionLabPresenter,B=window.FloorPlanBudget,Fx=window.FT3D8LabFixture;
const $=id=>document.getElementById(id);
const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

const {schedule,budget,label}=Fx.labHouse();
const report=S.budgetReport(schedule,budget,B);
const tl=V.timeline(schedule);
const LAST=tl.positions-1;
const dateAt=i=>iso(ms(tl.preStartDate)+Math.max(0,Math.min(LAST,i))*DAY);
const indexOf=d=>Math.round((ms(d)-ms(tl.preStartDate))/DAY);

/* Authoritative day frames, precomputed once (pure, cheap). */
const frames=Array.from({length:tl.positions},(_,i)=>V.frameAt(schedule,dateAt(i)));
const digest=frames.map(f=>new Map(f.elements.map(e=>[e.elementId,{
  presence:e.present?1:0,
  roles:Object.fromEntries(e.layers.filter(l=>l.behaviour==='appear'||l.behaviour==='layer').map(l=>[l.role,l.progress])),
  removal:Math.max(0,...e.layers.filter(l=>l.behaviour==='remove').map(l=>l.progress))}])));
function blendAt(pos){
  const i=Math.max(0,Math.min(LAST,Math.floor(pos))),j=Math.min(LAST,i+1),f=Math.max(0,Math.min(1,pos-i));
  const a=digest[i],b=digest[j],out=new Map();
  for(const [id,x] of a){const y=b.get(id)||x,roles={};
    for(const k of new Set([...Object.keys(x.roles),...Object.keys(y.roles)]))roles[k]=(x.roles[k]??0)*(1-f)+(y.roles[k]??0)*f;
    // A removed element stays removed in the tween only once the next frame says so.
    out.set(id,{presence:x.presence*(1-f)+y.presence*f,roles,removal:y.presence===0&&x.presence===1?f:x.removal*(1-f)+y.removal*f});}
  return out;
}

/* ---------- static header ---------- */
const weeks=P.weeks(schedule),sum=P.summary(report);
$('fixtureLabel').textContent=label;
$('weeksCount').textContent=String(weeks.length);
$('metaLine').innerHTML=[
  `<b>${esc(schedule.projectRef.id)}</b>`,`INICIO ${esc(P.dateLabel(tl.startDate))}`,`FIN PLAN ${esc(P.dateLabel(tl.endDate))}`,
  `PLAN ${schedule.review.status==='reviewed'?'APROBADO':'ESTIMADO'} · ${esc(schedule.review.by||'sin revisor')}`,
  `PRESUPUESTADO CONOCIDO ${esc(sum.knownText)}${sum.complete?'':' (INCOMPLETO)'}`].join('<i>//</i>');
$('revisionNote').textContent=sum.revisionText;

/* ---------- Gantt ---------- */
const rows=G.toGanttTasks(schedule,{budgetReport:report}),links=P.ganttLinks(schedule);
const span=tl.positions; // days from preStart to completionDate inclusive
const pct=i=>(i/span*100).toFixed(4)+'%';
const gantt=$('gantt');
function buildGantt(){
  const head=weeks.map(w=>{const a=indexOf(w.startDate),b=indexOf(w.endDate)+1;return `<span class="wk" style="left:${pct(a)};width:${pct(b-a)}">SEM ${String(w.n).padStart(2,'0')}</span>`;}).join('');
  const body=rows.map(r=>{
    const a=indexOf(r.start),b=indexOf(r.end)+1,badges=links.badges.filter(x=>x.to===r.id);
    const cost=P.costView(report.byTask.find(t=>t.taskId===r.id),report);
    return `<div class="row" data-task="${esc(r.id)}">
      <div class="lab"><span class="wbs">${esc(r._ft3d.wbs)}</span><span class="name">${esc(r._ft3d.title.replace(/^FIXTURE /,''))}</span>
        <span class="chip c-${cost.status}" title="${esc(cost.label)}">${cost.status==='revisado'?'€':cost.status==='no-verificado'?'€?':cost.status==='parcial'?'€½':cost.status==='desconocido'?'€✕':'·'}</span></div>
      <div class="track"><div class="bar" style="left:${pct(a)};width:${pct(b-a)}"><i class="fill"></i></div>
        ${badges.map(x=>`<span class="dep" style="${b/span>.82?`left:calc(${pct(a)} - 6px);transform:translateX(-100%)`:`left:calc(${pct(b)} + 6px)`}" title="${esc(x.title)} — no se dibuja como flecha fin→inicio">${esc(x.text)}</span>`).join('')}</div></div>`;}).join('');
  gantt.innerHTML=`<div class="ghead"><div class="lab">WBS // PLAN DE OBRA <em>FIXTURE</em></div><div class="track">${head}</div></div>
    <div class="gbody">${body}<svg class="arrows" aria-hidden="true"></svg>
      <div class="cursor" id="ganttCursor"><span id="ganttCursorLabel"></span></div></div>`;
  drawArrows();
}
function drawArrows(){
  const svg=gantt.querySelector('.arrows'),bodyEl=gantt.querySelector('.gbody');if(!svg)return;
  const br=bodyEl.getBoundingClientRect(),paths=[];
  svg.setAttribute('width',br.width);svg.setAttribute('height',br.height);
  for(const a of links.arrows){
    const from=gantt.querySelector(`.row[data-task="${a.from}"] .bar`),to=gantt.querySelector(`.row[data-task="${a.to}"] .bar`);if(!from||!to)continue;
    const f=from.getBoundingClientRect(),t=to.getBoundingClientRect();
    const x1=f.right-br.left,y1=f.top+f.height/2-br.top,x2=t.left-br.left,y2=t.top+t.height/2-br.top,mx=Math.max(x1+5,Math.min(x2-5,x1+8));
    paths.push(`<path d="M${x1},${y1} H${mx} V${y2} H${x2-2}" /><path class="head" d="M${x2-6},${y2-3} L${x2},${y2} L${x2-6},${y2+3}" />`);
    if(a.text)paths.push(`<text x="${x1+3}" y="${y1-3}">${a.text}</text>`);
  }
  svg.innerHTML=paths.join('');
}

/* ---------- card ---------- */
function renderCard(date){
  const c=P.taskCard(schedule,report,date);
  $('cardWeek').textContent=c.week.label;$('cardWeek').classList.toggle('long',c.week.label.length>12);
  $('cardDate').textContent=c.dateText.toUpperCase();
  $('cardEvidence').textContent=c.evidenceText;
  $('cardHeadline').textContent=c.headline.replace(/FIXTURE /g,'');
  $('cardStage').textContent=c.stage==='final'?'FINAL · PLAN COMPLETADO':c.stage==='inicio'?'INICIO · SOLAR SIN OBRA':'EN OBRA (SEGUN PLAN)';
  $('cardStage').dataset.stage=c.stage;
  const list=c.active.length?c.active:c.next?[c.next]:[];
  $('cardTasks').innerHTML=list.map(t=>`<li>
    <div class="t"><span class="wbs">${esc(t.wbs)}</span> ${esc(t.title.replace(/^FIXTURE /,''))} <span class="pp">${c.active.length?t.plannedPercent+' % plan':'proxima'}</span></div>
    <div class="d">${esc(P.dateLabel(t.startDate))} → ${esc(P.dateLabel(t.endDate))} · ${esc(t.phaseText)}</div>
    <div class="cost c-${t.cost.status}"><b>${esc(t.cost.label)}</b> · asignado sin IVA ${esc(t.cost.totalText)}${t.cost.status==='parcial'?' · conocido '+esc(t.cost.knownText):''}</div>
    ${t.cost.notes.length?`<div class="notes">${t.cost.notes.map(esc).join(' · ')}</div>`:''}</li>`).join('')||`<li class="none">
    <div class="t">${schedule.tasks.length} / ${schedule.tasks.length} tareas completadas según plan</div>
    <div class="cost c-${sum.complete?'revisado':'parcial'}"><b>Presupuestado conocido ${esc(sum.knownText)}</b>${sum.complete?'':' · incompleto'}</div>
    <div class="notes">${sum.unknownItemIds.length?'Partidas sin precio: '+esc(sum.unknownItemIds.join(', ')):'Todas las partidas con precio'}${sum.unverifiedTaskIds.length?' · Tareas con coste no verificado: '+esc(sum.unverifiedTaskIds.join(', ')):''}</div>
    <div class="notes">Fin del plan, no certificado de fin de obra</div></li>`;
  return c;
}

/* ---------- cursor & sync ---------- */
const scene=createScene($('stage'));
let pos=0,playing=false,speed=1,lastT=0,lastDay=-1;
const slider=$('scrub');slider.max=String(LAST);
const weekSel=$('weekSel');
weekSel.innerHTML=`<option value="${0}">SEM 00 · antes de obra</option>`+weeks.map(w=>`<option value="${indexOf(w.startDate)}">SEM ${String(w.n).padStart(2,'0')} · ${P.dateLabel(w.startDate)}</option>`).join('')+`<option value="${LAST}">FIN · plan completado</option>`;
function setPos(p,{fromSlider=false}={}){
  pos=Math.max(0,Math.min(LAST,p));
  scene.setState(blendAt(pos),pos);
  const day=Math.floor(pos+1e-9),date=dateAt(day);
  if(!fromSlider)slider.value=String(pos);
  const cur=G.cursor(schedule,date);
  const gc=$('ganttCursor');gc.style.left=`calc(var(--labw) + (100% - var(--labw)) * ${(pos+1)/span})`;
  gc.dataset.date=cur.date;$('ganttCursorLabel').textContent='PLAN · '+P.dateLabel(cur.date);
  const fr=(pos+1)/span;$('ganttCursorLabel').style.transform=fr>.86?'translateX(-100%)':fr<.08?'translateX(0)':'translateX(-50%)';
  if(day!==lastDay){
    lastDay=day;
    const card=renderCard(date),frame=frames[day];
    for(const row of gantt.querySelectorAll('.row')){
      const t=S.stateAt(schedule,date).tasks.find(x=>x.id===row.dataset.task);
      row.dataset.phase=t.plannedPhase;row.querySelector('.fill').style.width=(t.visualProgress*100)+'%';}
    $('dateReadout').textContent=P.dateLabel(date).toUpperCase();
    const w=P.weekOf(schedule,date);weekSel.value=String(day>=LAST?LAST:w.n===0?0:indexOf(weeks[w.n-1].startDate));
    document.body.dataset.stage=frame.stage;
    window.__ft3dLab.last={date,stage:frame.stage,activeTaskIds:frame.activeTaskIds,ganttCursorDate:cur.date,ganttActive:cur.activeTaskIds,
      cardWeek:card.week.label,presentElements:frame.elements.filter(e=>e.present).map(e=>e.elementId)};
  }
}
function step(days){pause();setPos(Math.round(pos)+days);}
function play(){if(pos>=LAST)setPos(0);playing=true;lastT=performance.now();$('play').textContent='❚❚';$('play').setAttribute('aria-label','Pausa');requestAnimationFrame(loop);}
function pause(){playing=false;$('play').textContent='▶';$('play').setAttribute('aria-label','Reproducir');}
function loop(t){if(!playing)return;const dt=Math.min(.1,(t-lastT)/1000);lastT=t;setPos(pos+dt*4*speed);if(pos>=LAST){setPos(LAST);pause();return;}requestAnimationFrame(loop);}

window.__ft3dLab={positions:tl.positions,timeline:tl,setDate:d=>{pause();setPos(indexOf(d));return window.__ft3dLab.last;},
  setPos:p=>{pause();setPos(p);return window.__ft3dLab.last;},play,pause,get pos(){return pos;},get playing(){return playing;},
  stats:scene.stats,last:null};

$('play').onclick=()=>playing?pause():play();
$('reset').onclick=()=>{pause();setPos(0);};
$('end').onclick=()=>{pause();setPos(LAST);};
$('back').onclick=()=>step(-1);$('fwd').onclick=()=>step(1);
$('wback').onclick=()=>step(-7);$('wfwd').onclick=()=>step(7);
slider.oninput=()=>{pause();setPos(Number(slider.value),{fromSlider:true});};
weekSel.onchange=()=>{pause();setPos(Number(weekSel.value));};
for(const b of document.querySelectorAll('[data-speed]'))b.onclick=()=>{speed=Number(b.dataset.speed);
  document.querySelectorAll('[data-speed]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));};
const camButtons=document.querySelectorAll('[data-view]');
const markView=v=>camButtons.forEach(x=>x.setAttribute('aria-pressed',String(x.dataset.view===v)));
for(const b of camButtons)b.onclick=()=>{scene.setView(b.dataset.view);markView(b.dataset.view);};
scene.onModeChange=markView;
// Click / drag on the Gantt timeline moves the shared cursor.
function ganttPick(e){const track=gantt.querySelector('.ghead .track').getBoundingClientRect();
  const x=(e.clientX-track.left)/track.width;if(x<0||x>1)return;pause();setPos(Math.round(x*span-1));}
let dragging=false;
gantt.addEventListener('pointerdown',e=>{if(e.target.closest('.lab'))return;dragging=true;gantt.setPointerCapture(e.pointerId);ganttPick(e);});
gantt.addEventListener('pointermove',e=>{if(dragging)ganttPick(e);});
gantt.addEventListener('pointerup',()=>{dragging=false;});
gantt.addEventListener('click',e=>{const r=e.target.closest('.row .lab');if(!r)return;const t=r.parentElement.dataset.task,row=rows.find(x=>x.id===t);pause();setPos(indexOf(row.start));});
window.addEventListener('keydown',e=>{if(e.target.closest('select,input'))return;
  if(e.code==='Space'){e.preventDefault();playing?pause():play();}
  else if(e.key==='ArrowRight')step(e.shiftKey?7:1);else if(e.key==='ArrowLeft')step(e.shiftKey?-7:-1);
  else if(e.key==='Home'){pause();setPos(0);}else if(e.key==='End'){pause();setPos(LAST);}});
let rz=0;window.addEventListener('resize',()=>{cancelAnimationFrame(rz);rz=requestAnimationFrame(()=>{drawArrows();scene.resize();});});

buildGantt();
const q=new URLSearchParams(location.search);
const startDate=q.get('date');
setPos(startDate&&/^\d{4}-\d{2}-\d{2}$/.test(startDate)?indexOf(startDate):0);
document.body.classList.add('ready');
if(q.get('play')==='1')play();
