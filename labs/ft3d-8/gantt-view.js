/* FT3D-8 lab Gantt view (DOM only). Rows/costs/links come from FloorPlanConstructionGantt + Presenter; the cursor
   position is given by the caller so the Gantt and the 3D scene always share one date. FS links are arrows; SS/FF/SF
   are labelled badges (never drawn as finish-to-start). */
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
export function createGanttView(container,{schedule,report,timeline,S,G,P,onPick}){
  const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),indexOf=d=>Math.round((ms(d)-ms(timeline.preStartDate))/DAY);
  const span=timeline.positions,pct=i=>(i/span*100).toFixed(4)+'%';
  const rows=G.toGanttTasks(schedule,report?{budgetReport:report}:{}),links=P.ganttLinks(schedule),weeks=P.weeks(schedule);
  const chip=id=>{if(!report)return {k:'sin-presupuesto',t:'·'};const v=P.costView(report.byTask.find(t=>t.taskId===id),report);
    return {k:v.status,t:{revisado:'€','no-verificado':'€?',parcial:'€½',desconocido:'€✕','sin-partidas':'·'}[v.status],label:v.label};};
  const head=weeks.map(w=>{const a=indexOf(w.startDate),b=indexOf(w.endDate)+1;return `<span class="wk" style="left:${pct(a)};width:${pct(b-a)}">SEM ${String(w.n).padStart(2,'0')}</span>`;}).join('');
  container.innerHTML=`<div class="ghead"><div class="lab">WBS // PLAN</div><div class="track">${head}</div></div><div class="gbody">${rows.map(r=>{
    const a=indexOf(r.start),b=indexOf(r.end)+1,badges=links.badges.filter(x=>x.to===r.id),c=chip(r.id);
    return `<div class="row" data-task="${esc(r.id)}"><div class="lab"><span class="wbs">${esc(r._ft3d.wbs)}</span><span class="name">${esc(r._ft3d.title.replace(/^FIXTURE /,''))}</span>
      <span class="chip c-${c.k}" title="${esc(c.label||'Sin presupuesto disponible')}">${c.t}</span></div>
      <div class="track"><div class="bar" style="left:${pct(a)};width:${pct(b-a)}"><i class="fill"></i></div>
      ${badges.map(x=>`<span class="dep" style="${b/span>.82?`left:calc(${pct(a)} - 6px);transform:translateX(-100%)`:`left:calc(${pct(b)} + 6px)`}" title="${esc(x.title)}">${esc(x.text)}</span>`).join('')}</div></div>`;}).join('')}
    <svg class="arrows" aria-hidden="true"></svg><div class="cursor" data-role="cursor"><span></span></div></div>`;
  const cursor=container.querySelector('[data-role=cursor]');
  // A newer selection may have replaced this Gantt before a queued redraw runs: then there is nothing to draw.
  function drawArrows(){const svg=container.querySelector('.arrows'),body=container.querySelector('.gbody');if(!svg||!body||!body.contains(cursor))return;const br=body.getBoundingClientRect(),out=[];
    svg.setAttribute('width',br.width);svg.setAttribute('height',br.height);
    for(const a of links.arrows){const f=container.querySelector(`.row[data-task="${a.from}"] .bar`)?.getBoundingClientRect(),t=container.querySelector(`.row[data-task="${a.to}"] .bar`)?.getBoundingClientRect();if(!f||!t)continue;
      const x1=f.right-br.left,y1=f.top+f.height/2-br.top,x2=t.left-br.left,y2=t.top+t.height/2-br.top,mx=Math.max(x1+5,Math.min(x2-5,x1+8));
      out.push(`<path d="M${x1},${y1} H${mx} V${y2} H${x2-2}"/><path class="head" d="M${x2-6},${y2-3} L${x2},${y2} L${x2-6},${y2+3}"/>`);if(a.text)out.push(`<text x="${x1+3}" y="${y1-3}">${a.text}</text>`);}
    svg.innerHTML=out.join('');}
  function update(pos,date){
    const fr=(pos+1)/span;cursor.style.left=`calc(var(--labw) + (100% - var(--labw)) * ${fr})`;cursor.dataset.date=G.cursor(schedule,date).date;
    const lab=cursor.querySelector('span');lab.textContent='PLAN · '+P.dateLabel(date);lab.style.transform=fr>.86?'translateX(-100%)':fr<.08?'translateX(0)':'translateX(-50%)';
    const st=S.stateAt(schedule,date);for(const row of container.querySelectorAll('.row')){const t=st.tasks.find(x=>x.id===row.dataset.task);row.dataset.phase=t.plannedPhase;row.querySelector('.fill').style.width=(t.visualProgress*100)+'%';}
  }
  let drag=false;const pick=e=>{const head=container.querySelector('.ghead .track');if(!head)return;const tr=head.getBoundingClientRect(),x=(e.clientX-tr.left)/tr.width;if(x>=0&&x<=1)onPick(Math.round(x*span-1));};
  container.addEventListener('pointerdown',e=>{if(e.target.closest('.lab'))return;drag=true;container.setPointerCapture(e.pointerId);pick(e);});
  container.addEventListener('pointermove',e=>{if(drag)pick(e);});container.addEventListener('pointerup',()=>{drag=false;});
  requestAnimationFrame(drawArrows);
  return {update,drawArrows,rows,links};
}
