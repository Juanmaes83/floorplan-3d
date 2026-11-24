/* UX-312 PERLA · Presupuestar con el lenguaje de Entregar (maqueta c96888ac). Solo diseño y usabilidad.
   - Un solo título; resumen arriba con la superficie y el estado de cada pieza en tres colores: listo, al pulsar, falta.
   - La acción principal del área («Abrir presupuesto») en vino; cada tarjeta con su estado en color y su acción a la vista.
   - Las tarjetas, el recorrido de obra y la leyenda son los del producto: mismos botones, rutas y textos. Nada se quita.
   - Los botones del resumen pulsan los controles reales de las tarjetas (mismo generador y misma vuelta de foco). */
(function(){
 'use strict';
 const L=()=>{try{return typeof LANG==='string'?LANG:'es';}catch{return 'es';}},tx=(es,en,zh)=>L()==='en'?en:L()==='zh'?zh:es;
 const $=s=>document.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const ws=()=>$('#professionalWorkspace');
 const open=()=>{const w=ws();return !!w&&!w.hidden&&w.dataset.area==='budget';};
 const route=r=>$(`#professionalWorkspace [data-route="${r}"]`);
 const card=m=>$(`#professionalWorkspace .professional-card[data-module="${m}"]`);
 const state=m=>(card(m)?.querySelector('.professional-state')?.textContent||'').trim();
 // Estado → color (mismas reglas que Entregar; ES, EN y ZH)
 const budgetKind=new Map();
 function kind(m){const s=state(m);
  if(m==='reference-prices')return 'pend';
  // El estado en chino no dice cuántas partidas faltan por precio: se usa el último estado leído en ES/EN de este proyecto
  // y, si no lo hay, «al pulsar» (desconocido), nunca «listo».
  if(m==='budget'||m==='budget-edit'){const key=(()=>{try{return window.FloorPlanApp?.entryId||'';}catch{return '';}})();
   const n=/(\d+)\s*(sin precio|without price|unpriced|无价格|未定价)/i.exec(s);let k=null;
   if(n)k=+n[1]>0?'req':'ok';else if(/sin presupuesto|no budget|尚未/i.test(s))k='req';else if(L()!=='zh'&&s)k='ok';
   if(k){budgetKind.set(key,k);return k;}return budgetKind.get(key)||'pend';}
  if(/Sin plan|No plan|没有|尚未|Requiere|Necesita|Requires|Needs/i.test(s))return 'req';
  if(s)return 'ok';return 'pend';}
 const PILL={ok:()=>tx('Listo','Ready','就绪'),pend:()=>tx('Al pulsar','On demand','点击时'),req:()=>tx('Falta','Missing','缺少')};
 function pill(k,text,parent){return el('span','perla-pill '+k,parent,text);}
 // Tarjetas: estado en color y la primera acción como enlace con flecha; el resto de botones igual que siempre
 function cards(){for(const c of $$('#professionalWorkspace .professional-grid > .professional-card[data-module]')){
  c.classList.add('pres-card');const m=c.dataset.module,k=kind(m);c.dataset.presPill=k;
  const st=c.querySelector(':scope>.professional-state');if(st&&!st.classList.contains('perla-pill-state')){st.classList.add('perla-pill-state');}
  if(st)st.dataset.kind=k;
  const acts=$$(':scope>button,:scope>.professional-actions>button',c);acts.forEach((b,i)=>b.classList.toggle('pres-go',i===0));}}
 // Resumen: superficie, estado de cada pieza y la acción principal del área
 function hero(){const w=ws(),grid=w.querySelector('.professional-grid');if(!grid)return;
  let h=w.querySelector(':scope>.pres-hero');
  const q=state('quantities'),area=(q.split('·')[0]||'').trim(),rest=q.split('·').slice(1).join(' · ').trim();
  const b=state('budget-edit'),p=state('construction-plan');
  const rows={ok:[],pend:[],req:[]};
  rows[q?'ok':'pend'].push(tx('Cantidades del proyecto','Project quantities','项目数量'));
  rows[kind('budget-edit')].push(kind('budget-edit')==='req'?tx('Precios de las partidas','Item prices','条目价格')+((x=>x?' ('+x+')':'')(b.split('·').slice(1).join(' ·').trim())):tx('Presupuesto con precios','Priced budget','已定价预算'));
  rows[kind('construction-plan')].push(tx('Plan de obra','Construction plan','施工计划'));
  rows.pend.push(tx('Precios de referencia de tus bases BC3','Reference prices from your BC3 databases','来自你的 BC3 库的参考价格'));
  const sig=JSON.stringify([L(),area,rest,rows]);if(h&&h.dataset.sig===sig)return;
  if(!h){h=el('section','pres-hero',null);h.setAttribute('aria-labelledby','presHeroT');(w.querySelector(':scope>.professional-intro')||w.querySelector(':scope>.professional-head')).after(h);}
  h.dataset.sig=sig;h.replaceChildren();
  const a=el('div','pres-hero-num',h);el('span','pres-eyebrow',a,tx('Superficie del proyecto','Project area','项目面积'));
  const t=el('h2','pres-big',a,area||'—');t.id='presHeroT';if(rest)el('p','pres-hero-meta',a,rest);
  const r=el('div','pres-hero-txt',h);const ul=el('ul','pres-listo',r);
  for(const k of ['ok','pend','req'])for(const x of rows[k]){const li=el('li',null,ul);pill(k,PILL[k](),li);el('span',null,li,x);}
  // U9 sin duplicados: el resumen dice el estado; cada acción vive una sola vez, en su ficha (justo debajo).
 }
 // El recorrido de obra va tras las tarjetas, como en Entregar (el resumen ya dice el siguiente paso)
 function order(){const grid=ws().querySelector('.professional-grid');if(!grid)return;const j=grid.querySelector(':scope>.cx-journey'),leg=grid.querySelector(':scope>.professional-legend');
  const last=[...grid.querySelectorAll(':scope>.pres-card')].pop();if(!last)return;
  if(j&&last.nextElementSibling!==j)last.after(j);const after=j||last;if(leg&&after.nextElementSibling!==leg)after.after(leg);}
 let busy=false;
 function apply(){busy=false;const w=ws();if(!open()){w?.classList.remove('perla-pres');return;}
  mo.disconnect();try{w.classList.add('perla-pres');cards();order();hero();}finally{mo.observe(document.body,{childList:true,subtree:true,characterData:true});}}
 const mo=new MutationObserver(()=>{if(!busy&&(open()||ws()?.classList.contains('perla-pres'))){busy=true;requestAnimationFrame(apply);}});
 mo.observe(document.body,{childList:true,subtree:true,characterData:true});
 new MutationObserver(()=>{if(open()){const h=ws().querySelector(':scope>.pres-hero');if(h)h.dataset.sig='';busy=true;requestAnimationFrame(apply);}}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 window.FloorPlanPerlaPresupuestar=Object.freeze({apply});
})();
