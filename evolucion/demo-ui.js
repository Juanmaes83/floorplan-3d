/* HOM-04 · demo «Descubre cómo evoluciona una obra» (?demo=obra): the closing card of the guided demo.
   When the example plan reaches its end it offers «Volver a ver», «Cómo hacerlo con mi proyecto», «Volver al inicio»
   and «Explorar la obra». It only uses the page's own player (window.__ft3dFidelity); outside the demo it does nothing. */
(function(){
 'use strict';
 if(window.__ft3dSource?.mode!=='demo')return;
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 let card=null,dismissed=false;
 function show(title,lines,actions){
  if(!card){card=el('div','demo-end',null);card.id='demoEnd';card.setAttribute('role','dialog');card.setAttribute('aria-labelledby','demoEndTitle');document.getElementById('stage')?.closest('.stagewrap')?.append(card);}
  card.replaceChildren();el('h2',null,card,title).id='demoEndTitle';for(const l of lines)el('p',null,card,l);
  const row=el('div','demo-end-actions',card);
  for(const [label,fn,primary,id] of actions){const b=el('button','btn'+(primary?' primary':''),row,label);b.type='button';b.onclick=fn;if(id)b.id=id;}
  card.hidden=false;row.querySelector('.primary')?.focus({preventScroll:true});
 }
 const close=()=>{if(card)card.hidden=true;dismissed=true;window.__rubikFinal?.salir?.();};
 const F=()=>window.__ft3dFidelity;
 function end(){
  show('Así avanza una obra en RUBIK',['La vivienda de ejemplo, de la implantación a la retirada del andamio, con su plan de obra semana a semana.'],[
   ['Volver a ver',()=>{close();dismissed=false;F().setPos(0);F().play();},true,'demoReplay'],
   ['Cómo hacerlo con mi proyecto',()=>howTo(),false,'demoHowTo'],
   ['Volver al inicio',()=>{location.href='../';},false,'demoHome'],
   ['Explorar la obra',()=>close(),false,'demoExplore']]);
 }
 function howTo(){
  show('Hazlo con tu proyecto',['1. Abre o crea tu proyecto en RUBIK.','2. Presupuestar → Plan de obra: crea las tareas con sus fechas y vincúlalas a tus muros, huecos y estancias.','3. Pulsa «Ver evolución»: verás tu vivienda construirse según tu plan, con tus importes si los has presupuestado.'],[
   ['Volver al inicio',()=>{location.href='../';},true],['Volver',()=>end()]]);
 }
 // The end of the plan (stage «final») after playing or stepping there: offer the closing card once per arrival.
 window.addEventListener('ft3d8-moment',e=>{const fin=e.detail?.stage==='final';
  if(!fin){dismissed=false;if(card&&!card.hidden)card.hidden=true;return;}
  // The player pauses right after its last frame: check once it has stopped.
  if(!dismissed&&(!card||card.hidden))setTimeout(()=>{
   // SCULPT A · HERO final: si el desenlace se está reproduciendo, la tarjeta llega cuando termina, no encima de él.
   if(window.__rubikFinal?.activo||window.__rubikFinal?.pendiente){window.addEventListener('rubik-final-fin',()=>{if(!dismissed&&(!card||card.hidden))end();},{once:true});return;}
   if(!dismissed&&!F()?.playing&&F()?.last?.stage==='final'&&(!card||card.hidden))end();},400);});
 window.__ft3dDemo={end,howTo,close};
 setupConfig(F,howTo);
})();

/* UX-312 F4 · «Personalizar esta demo» de Evolución (configuradores-f4/ESPECIFICACION-F4.md, aprobado).
   Cambia inicio o duración de hasta 3 tareas del plan de ejemplo y lo vuelve a mostrar con el reproductor de la página.
   Orquesta la autoridad existente: FloorPlanConstructionSchedule.create() valida TODAS las dependencias; si un cambio
   rompe una, se rechaza y se explica, y el último plan válido sigue en pantalla (nunca se reprograma solo).
   Todo vive en memoria de esta pestaña: no lee ni escribe almacenamiento («una demo es una demo»). */
function setupConfig(F,howTo){
 const S=window.FloorPlanConstructionSchedule,bar=document.querySelector('.demo-bar');
 if(!S||!bar)return;
 const MAX=3,DAY=864e5,clone=o=>JSON.parse(JSON.stringify(o));
 const d=x=>Date.parse(x+'T00:00:00Z'),iso=ms=>new Date(ms).toISOString().slice(0,10);
 const fmt=x=>new Date(d(x)).toLocaleDateString('es-ES',{day:'numeric',month:'short',year:'numeric',timeZone:'UTC'});
 const dur=t=>Math.round((d(t.endDate)-d(t.startDate))/DAY)+1,short=t=>String(t.title||t.id).replace(/\s*\(.*\)$/,'');
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const TYPE={FS:'empezar después de que termine',SS:'empezar después de que empiece',FF:'terminar después de que termine',SF:'terminar después de que empiece'};
 let original=null,current=null,chosen=[];
 const style=el('style',null,document.head);
 style.textContent='.demo-config{width:min(640px,calc(100vw - 24px));max-height:calc(100dvh - 24px);overflow:auto;padding:18px 20px;border:1px solid var(--line);border-radius:12px;background:var(--surface-panel);color:var(--ink);font-family:var(--font-sans)}'+
  '.demo-config::backdrop{background:rgba(20,26,30,.35)}.demo-config h2{margin:0 0 4px;font-size:19px}.demo-config .dc-lead{margin:0 0 10px;color:var(--ink-muted);font-size:14px}'+
  '.dc-tasks{list-style:none;margin:0 0 10px;padding:0;display:grid}.dc-tasks li{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 10px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}'+
  '.dc-tasks li[data-mod=true] b::after{content:" · cambiada";color:var(--action);font-weight:600}.dc-tasks small{display:block;color:var(--ink-muted);font-size:12.5px}'+
  '.dc-tasks button{min-width:96px}.dc-tasks button[aria-pressed=true]{background:var(--action-soft);border-color:var(--action);color:var(--action)}'+
  '.dc-edit{display:grid;gap:8px;margin:0 0 10px}.dc-edit:empty{display:none}.dc-ed{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:6px 10px;align-items:end;padding:8px 10px;border:1px solid var(--line);border-radius:8px;background:var(--surface-sunken)}'+
  '.dc-ed label{display:grid;gap:2px;font-size:12.5px;color:var(--ink-muted)}.dc-ed input{min-height:44px;padding:4px 8px;border:1px solid var(--line-strong);border-radius:6px;font:inherit;color:var(--ink);background:var(--surface-panel)}.dc-ed input[type=number]{width:7ch}'+
  '.dc-msg{margin:0 0 10px;padding:8px 10px;border-radius:8px;font-size:14px;line-height:1.45}.dc-msg:empty{display:none}.dc-msg.ok{background:var(--action-soft);color:var(--ink)}.dc-msg.err{background:var(--warn-soft);color:var(--ink);border-left:4px solid var(--warn)}'+
  '.dc-actions{display:flex;flex-wrap:wrap;gap:8px;justify-content:flex-end;position:sticky;bottom:-18px;margin:0 -20px -18px;padding:10px 20px 14px;background:var(--surface-panel);border-top:1px solid var(--line)}.demo-config .btn{min-height:44px;padding:0 14px;border:1px solid var(--line-strong);border-radius:8px;background:var(--surface-panel);color:var(--ink);font:inherit;font-weight:600;cursor:pointer}'+
  '.demo-config .btn.primary{background:var(--action);border-color:var(--action);color:#fff}.demo-config .btn:disabled{opacity:.5;cursor:default}.demo-config :focus-visible{outline:3px solid var(--focus);outline-offset:2px}'+
  '@media (pointer:coarse){#demoConfigOpen{min-height:44px}}@media (max-width:520px){.dc-ed{grid-template-columns:1fr 1fr}.dc-ed>div{grid-column:1/-1}.dc-actions{flex-direction:column-reverse;flex-wrap:nowrap}.dc-actions .btn{width:100%}}';
 const open=el('button','btn',null,'Personalizar esta demo');open.type='button';open.id='demoConfigOpen';open.setAttribute('aria-haspopup','dialog');
 const help=bar.querySelector('#demoHelpOpen');if(help)help.before(open);else bar.append(open);
 const dlg=el('dialog','demo-config',document.body);dlg.id='demoConfig';dlg.setAttribute('aria-labelledby','demoConfigTitle');
 el('h2',null,dlg,'Personalizar esta demo').id='demoConfigTitle';
 el('p','dc-lead',dlg,'Cambia el inicio o la duración de hasta 3 tareas y mira cómo cambia la obra. Si un cambio rompe una dependencia, RUBIK lo explica y no reprograma nada. Solo en esta pestaña: no se guarda nada.');
 const list=el('ul','dc-tasks',dlg),edit=el('div','dc-edit',dlg),msg=el('p','dc-msg',dlg);msg.setAttribute('role','status');msg.setAttribute('aria-live','polite');
 const acts=el('div','dc-actions',dlg);
 const mk=(label,id,primary)=>{const b=el('button','btn'+(primary?' primary':''),acts,label);b.type='button';b.id=id;return b;};
 const how=mk('Cómo hacerlo con mi proyecto','demoConfigHow'),reset=mk('Restaurar el plan de ejemplo','demoConfigReset'),closeB=mk('Cerrar','demoConfigClose'),playB=mk('Reproducir la evolución','demoConfigPlay'),tryB=mk('Probar el cambio','demoConfigTry',true);
 const title=id=>short((current||original).tasks.find(t=>t.id===id)||{id});
 function explain(e){const m=/dependency (\S+) -> (\S+) \((\w\w)([+-]\d+)d\) violated by (\d+) day/.exec(e&&e.message||'');
  if(!m)return 'No se puede aplicar: '+(e&&e.message||e)+'. El plan anterior sigue en pantalla.';
  const [,a,b,ty,lag,n]=m,l=+lag;
  return `No se puede aplicar. «${title(b)}» tiene que ${TYPE[ty]||'respetar su dependencia con'} «${title(a)}»${l?` (${l>0?'+':''}${l} días)`:''}, y con este cambio le faltan ${n} ${+n===1?'día':'días'}. Ajusta también la fecha de «${title(b)}» o la de «${title(a)}». RUBIK no reprograma por su cuenta; el plan anterior sigue en pantalla.`;}
 function say(text,kind){msg.textContent=text;msg.className='dc-msg '+(kind||'');}
 function render(){
  list.replaceChildren();
  for(const t of current.tasks){const o=original.tasks.find(x=>x.id===t.id),li=el('li',null,list);li.dataset.mod=String(!!o&&(o.startDate!==t.startDate||o.endDate!==t.endDate));
   const txt=el('span',null,li);el('b',null,txt,(t.wbs?t.wbs+' · ':'')+short(t));el('small',null,txt,`${fmt(t.startDate)} – ${fmt(t.endDate)} · ${dur(t)} días`);
   const on=chosen.includes(t.id),b=el('button','btn',li,on?'Elegida':'Cambiar');b.type='button';b.dataset.task=t.id;b.setAttribute('aria-pressed',String(on));b.setAttribute('aria-label',(on?'Quitar ':'Cambiar ')+short(t));}
  edit.replaceChildren();
  for(const id of chosen){const t=current.tasks.find(x=>x.id===id),box=el('div','dc-ed',edit),h=el('div',null,box);el('b',null,h,short(t));el('small',null,h,` · ahora ${fmt(t.startDate)}, ${dur(t)} días`);
   const l1=el('label',null,box,'Inicio'),i1=el('input',null,l1);i1.type='date';i1.value=t.startDate;i1.dataset.start=id;
   const l2=el('label',null,box,'Duración (días)'),i2=el('input',null,l2);i2.type='number';i2.min='1';i2.max='365';i2.value=String(dur(t));i2.dataset.days=id;}
  tryB.disabled=!chosen.length;}
 function ensure(){const c=F()?.ctx;if(!c?.schedule)return false;if(!original){original=clone(c.input.schedule);current=clone(c.input.schedule);}return true;}
 async function showPlan(schedule,label){const c=F().ctx,input={...c.input,schedule:clone(schedule)},meta={...c.meta,origin:label};const r=await F().show(input,meta);return !r?.superseded;}
 open.addEventListener('click',()=>{if(!ensure()){say('La demostración todavía se está preparando.','err');}else render();dlg.showModal();(list.querySelector('button')||closeB).focus();});
 list.addEventListener('click',e=>{const b=e.target.closest('button[data-task]');if(!b)return;const id=b.dataset.task;
  if(chosen.includes(id))chosen=chosen.filter(x=>x!==id);
  else if(chosen.length>=MAX){say(`Para que sea ágil, la demo cambia hasta ${MAX} tareas a la vez. Quita una de las elegidas para elegir otra.`,'err');return;}
  else chosen=[...chosen,id];
  say('','');render();list.querySelector(`button[data-task="${CSS.escape(id)}"]`)?.focus();});
 tryB.addEventListener('click',async()=>{const c=clone(current);
  for(const id of chosen){const t=c.tasks.find(x=>x.id===id),start=edit.querySelector(`[data-start="${CSS.escape(id)}"]`).value,n=Math.round(+edit.querySelector(`[data-days="${CSS.escape(id)}"]`).value);
   if(!/^\d{4}-\d{2}-\d{2}$/.test(start)){say('No se puede aplicar: escribe una fecha de inicio válida.','err');return;}
   if(!(n>=1)){say('No se puede aplicar: la duración tiene que ser de 1 día o más.','err');return;}
   t.startDate=start;t.endDate=iso(d(start)+(n-1)*DAY);}
  try{S.create(clone(c));}catch(e){say(explain(e),'err');return;}
  tryB.disabled=true;
  try{if(await showPlan(c,'Demostración · versión personalizada en esta pestaña (no se guarda)')){current=c;render();say('Cambio aplicado en esta pestaña. Todas las dependencias se cumplen: pulsa «Reproducir la evolución» o cierra para explorar.','ok');}}
  catch(e){say('No se ha podido mostrar el cambio: '+(e&&e.message||e)+'. El plan anterior sigue en pantalla.','err');}
  finally{tryB.disabled=!chosen.length;}});
 reset.addEventListener('click',async()=>{if(!ensure())return;chosen=[];
  try{await showPlan(original,'Demostración · vivienda de ejemplo de RUBIK (datos de ejemplo)');current=clone(original);render();say('Restaurado el plan de ejemplo original.','ok');}
  catch(e){say('No se ha podido restaurar: '+(e&&e.message||e),'err');}});
 playB.addEventListener('click',()=>{dlg.close();F()?.setPos(0);F()?.play();});
 closeB.addEventListener('click',()=>dlg.close());
 how.addEventListener('click',()=>{dlg.close();howTo();});
 dlg.addEventListener('close',()=>open.focus({preventScroll:true}));
}
