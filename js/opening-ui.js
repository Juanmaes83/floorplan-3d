/* Contextual doors and windows: select an opening in the 2D plan with «Seleccionar», edit it in the properties
   panel with a preview drawn on the plan, or add one to a wall of the selected room. Every change is a preview
   until «Aplicar»; applying stores first and then publishes one history step, like «Plano propio». */
(function(){
 'use strict';
 const O=FloorPlanOpenings,C=FloorPlanCore,SVGNS='http://www.w3.org/2000/svg';
 let draft=null,pick=null,error='',pending=null;
 const el=(tag,text,parent,attrs={})=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
 const opening=(p,id)=>p.openings.find(o=>o.id===id);
 const display=n=>typeof nm==='function'?nm(n):n;
 const wallOf=(p,o)=>p.walls.find(w=>w.id===o.wallId);
 const current=()=>draft?.project||project;
 function setStatus(text){const s=document.getElementById('traceStatus');if(s){s.textContent=text;s.hidden=!text;}}

 // Store first; publish canonical state and one history step only after persistence succeeds.
 function apply(next,id){
  next.updatedAt=new Date(Math.max(Date.now(),Date.parse(next.createdAt))).toISOString();C.validate(next);
  const before=snap();storage.setItem(STORE,JSON.stringify(next));
  project=next;undoStack.push(before);if(undoStack.length>150)undoStack.shift();redoStack.length=0;
  draft=null;error='';pending=null;ui.sel={kind:'opening',id};refreshProject();renderAll();window.FloorPlanPresentation?.onProjectChange();
 }
 function values(form){
  const v={},get=n=>form.elements[n];
  // Only fields the person changed are sent, so a type change can apply the usual height and sill of the new type.
  const base=opening(baseOf(),draft?.id||ui.sel.id);
  v.kind=get('kind').value;for(const k of ['offsetMm','widthMm','heightMm','sillHeightMm'])if(get(k)&&!get(k).closest('[hidden]')&&get(k).value!==String(base?.[k]))v[k]=get(k).value===''?Number.NaN:get(k).value;
  const hinge=form.querySelector('input[name=hinge]:checked'),side=form.querySelector('input[name=side]:checked');
  if(v.kind==='door'&&hinge&&side&&opening(baseOf(),draft?.id||ui.sel.id)?.kind==='door'){v.hinge=hinge.value;v.side=side.value;}
  return v;
 }
 const baseOf=()=>draft?.mode==='add'?draft.base:project;
 // Recompute the preview from the panel. Errors keep the previous canonical state and disable «Aplicar».
 // Only a type change rebuilds the form; other inputs update the preview and the buttons in place, so typing a
 // width and then pressing «Aplicar» never loses the click to a re-render.
 function recompute(form,id,structural=false){
  // Keep what the person typed; after a type change only the fields they changed, the rest follow the new type.
  const before=opening(baseOf(),id);
  pending={id,raw:Object.fromEntries([...form.elements].filter(e=>e.name&&e.type!=='radio'&&(!structural||e.name==='kind'||e.value!==String(before?.[e.name]))).map(e=>[e.name,e.value])),focus:document.activeElement?.id};
  try{const base=baseOf(),r=O.edit(base,id,values(form));draft={...(draft?.mode==='add'?draft:{mode:'edit',id}),project:r.changed||draft?.mode==='add'?r.project:null,notes:r.notes};if(!draft.project&&draft.mode==='edit')draft=null;error='';}
  catch(e){error=e.message;if(draft?.mode==='edit')draft={mode:'edit',id,project:null,notes:[]};else if(draft?.mode==='add')draft={...draft,project:null,notes:[]};}
  renderSel();renderFab();
  if(structural){renderPanel();if(pending?.focus)document.getElementById(pending.focus)?.focus({preventScroll:true});}
  else{const section=document.querySelector('#panel .opening-panel');if(section)paint(section,id);}
 }
 function paint(section,id){
  const adding=draft?.mode==='add',labels=O.sideLabels(current(),opening(current(),id)||opening(baseOf(),id),display);
  const status=section.querySelector('#openingPreview');status.replaceChildren();
  if(error)el('p',error,status,{role:'alert',class:'opening-error',id:'openingError'});
  else if(draft?.notes?.length){el('p','Vista previa en el plano (verde, discontinua). Cambios:',status);const ul=el('ul',null,status);for(const n of draft.notes)el('li',n,ul);}
  else if(adding)el('p','Vista previa en el plano (verde, discontinua). Ajusta y pulsa «Aplicar y añadir».',status);
  const actions=section.querySelector('.actions');actions.replaceChildren();
  const button=(bid,text,fn,cls='btn')=>{const b=el('button',text,actions,{type:'button',class:cls,id:bid});b.onclick=()=>{try{fn();}catch(e){error=e.message;paint(section,id);}};return b;};
  const ready=!!draft?.project&&!error,review=opening(project,id)?.source?.review;
  const go=button('openingApply',adding?'Aplicar y añadir':'Aplicar cambios',()=>{if(!ready)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,id);},'btn primary');go.disabled=!ready;
  // On narrow screens the panel is a drawer over the plan: «Ver en el plano» closes it and keeps the preview,
  // with «Aplicar / Editar / Descartar» in the bottom bar.
  if(ready){const look=button('openingShowPlan','Ver en el plano',()=>{closeDrawers();renderFab();});look.classList.add('narrow-only');}
  if(adding||draft||error)button('openingDiscard','Descartar',discard);
  if(!adding&&!draft&&!error){
   const sideRoom=[labels.sides.left,labels.sides.right].find(x=>x.named);
   if(review!=='confirmed')button('openingConfirm','Confirmar revisión de este hueco',()=>{const next=C.clone(project),t=opening(next,id);t.source={method:t.source?.method||'manual',review:'confirmed'};apply(next,id);});
   button('openingDelete','Eliminar hueco',()=>{if(!confirm('¿Eliminar este hueco? Puedes deshacerlo.'))return;const next=C.clone(project);next.openings=next.openings.filter(x=>x.id!==id);apply(next,id);ui.sel=null;renderAll();},'btn danger');
   button('openingBack',sideRoom?`← Estancia «${display(sideRoom.name)}»`:'← Volver',()=>select(sideRoom?{kind:'room',id:sideRoom.roomId}:null));
  }
 }

 function panel(root,id){
  const shown=current(),o=opening(shown,id)||opening(baseOf(),id);if(!o){draft=null;return false;}
  const w=wallOf(shown,o),L=Math.floor(O.length(w)),labels=O.sideLabels(shown,o,display),adding=draft?.mode==='add',raw=pending?.id===id?pending.raw:{};
  root.replaceChildren();const section=el('section',null,root,{class:'opening-panel','aria-labelledby':'openingTitle'});
  el('h3',`${adding?'Nueva ':''}${O.LABEL[o.kind]}${adding?' · vista previa':''}`,section,{id:'openingTitle',tabindex:'-1'});
  el('p',`Muro seleccionado · ${L} mm · planta activa`,section,{class:'muted opening-id'});
  const legacy=O.conflicts(project).filter(c=>c.a===id||c.b===id);
  if(legacy.length)el('p',`Aviso de datos existentes: este hueco ya se solapa ${legacy.map(c=>`${Math.round(c.overlapMm)} mm con ${O.describe(project,c.a===id?c.b:c.a)}`).join(', ')}. Cambia su posición o su ancho para resolverlo; no se corrige solo.`,section,{class:'opening-legacy',role:'note',id:'openingLegacy'});
  const form=el('form',null,section,{id:'openingForm'});form.onsubmit=e=>e.preventDefault();
  const field=(name,text,value,extra={})=>{const l=el('label',text,form);const i=el('input',null,l,{name,id:'opening-'+name,type:'number',inputmode:'numeric',step:'1',...extra});i.value=raw[name]??value;i.oninput=()=>recompute(form,id);return l;};
  const typeLabel=el('label','Tipo',form);const type=el('select',null,typeLabel,{name:'kind',id:'opening-kind'});for(const k of O.KINDS){const opt=el('option',O.LABEL[k],type);opt.value=k;}type.value=raw.kind??o.kind;type.onchange=()=>recompute(form,id,true);
  field('offsetMm','Distancia desde el inicio del muro (mm)',o.offsetMm,{min:'0'});
  const centre=el('button','Centrar en el muro',form,{type:'button',class:'btn',id:'openingCentre'});centre.onclick=()=>{form.elements.offsetMm.value=Math.round((L-Number(form.elements.widthMm.value))/2);recompute(form,id);};
  field('widthMm','Ancho (mm)',o.widthMm,{min:'1'});field('heightMm','Alto (mm)',o.heightMm,{min:'100'});
  const sill=field('sillHeightMm','Antepecho (mm)',o.sillHeightMm,{min:'0'});sill.hidden=o.kind==='door'||o.kind==='sliding-door';
  if(o.kind==='door'){
   const hinge=el('fieldset',null,form,{id:'openingHinge'});el('legend','Bisagra',hinge);
   for(const [value,text]of [['start','Extremo A'],['end','Extremo B']]){const l=el('label',null,hinge,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'hinge',value});r.checked=o.swing.hinge===value;r.onchange=()=>recompute(form,id);el('span',text,l);}
   const side=el('fieldset',null,form,{id:'openingSide'});el('legend','Abre hacia',side);
   for(const value of ['left','right']){const l=el('label',null,side,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'side',value});r.checked=o.swing.side===value;r.onchange=()=>recompute(form,id);el('span',labels[value],l);}
   el('p',labels.sides.left.named&&labels.sides.right.named?'Las flechas del plano muestran hacia dónde abre la hoja.':'Un lado no pertenece a una única estancia: el plano rotula «1» y «2» con una flecha en cada lado.',form,{class:'muted'});
  }
  if(draft?.mode==='edit'&&o.kind!==opening(project,id)?.kind)el('p','Revisa el resto de campos antes de aplicar: cambian con el tipo.',form,{class:'muted'});
  el('div',null,section,{id:'openingPreview','aria-live':'polite'});
  const review=opening(project,id)?.source?.review;
  if(!adding)el('p',`Revisión del hueco: ${review==='confirmed'?'confirmada (posición, medidas y sentido como un todo)':'sin revisar'}. Editar lo deja sin revisar.`,section,{class:'muted',id:'openingReview'});
  el('div',null,section,{class:'actions'});
  paint(section,id);
  return true;
 }

 // Plan overlay: selected opening, A/B ends, start-of-wall marker and side arrows; the preview in dashed green.
 function overlay(){
  const k=1/view.s,parts=[],accent='#b5653a',green='#2f7d4f';
  const strip=(p,o,color,dash)=>{const w=wallOf(p,o);const poly=C.wallRect(w,o.offsetMm,o.widthMm).poly;parts.push(`<polygon points="${poly.map(q=>q.join(',')).join(' ')}" fill="none" stroke="${color}" stroke-width="3" ${dash?'stroke-dasharray="6 4"':''} vector-effect="non-scaling-stroke"/>`);};
  const text=(x,y,t,color,size=13)=>parts.push(`<text x="${x}" y="${y}" font-size="${size*k}" font-weight="700" text-anchor="middle" dominant-baseline="central" fill="${color}" stroke="#fff" stroke-width="${3*k}" paint-order="stroke">${esc(t)}</text>`);
  for(const c of O.conflicts(project))for(const id of [c.a,c.b]){const o=opening(project,id);if(o)strip(project,o,'#a3261b',true);}
  if(pick){for(const w of O.roomWalls(project,pick.roomId)){const r=C.wallRect(w).poly;parts.push(`<polygon class="opening-pick" points="${r.map(q=>q.join(',')).join(' ')}" fill="rgba(47,125,79,.18)" stroke="${green}" stroke-width="2" vector-effect="non-scaling-stroke"/>`);}}
  const id=ui.sel?.kind==='opening'?ui.sel.id:null,shown=current(),o=id&&opening(shown,id);
  if(o){
   const w=wallOf(shown,o),u=O.normal(w,'left'),dir={x:-u.y,y:u.x},A=O.length(w);
   const point=t=>({x:w.start.x+dir.x*t,y:w.start.y+dir.y*t});
   if(opening(project,id))strip(project,opening(project,id),accent,false);
   if(draft?.project)strip(shown,o,green,true);
   const a=point(o.offsetMm),b=point(o.offsetMm+o.widthMm),off=w.thicknessMm/2+26*k;
   text(a.x-dir.x*14*k,a.y-dir.y*14*k,'A',accent);text(b.x+dir.x*14*k,b.y+dir.y*14*k,'B',accent);
   const s0=point(0);parts.push(`<circle cx="${s0.x}" cy="${s0.y}" r="${4*k}" fill="${accent}"/>`);text(s0.x-dir.x*16*k,s0.y-dir.y*16*k,'0',accent,11);
   if(o.kind==='door'){
    const m=point(o.offsetMm+o.widthMm/2),labels=O.sideLabels(shown,o,display),chosen=o.swing.side;
    for(const side of ['left','right']){const n=O.normal(w,side),on=side===chosen,c=on?(draft?.project?green:accent):'#8a8378',len=(on?36:22)*k,from={x:m.x+n.x*off,y:m.y+n.y*off},to={x:from.x+n.x*len,y:from.y+n.y*len};
     parts.push(`<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" stroke="${c}" stroke-width="${on?3:1.5}" vector-effect="non-scaling-stroke" marker-end="url(#openingArrow${on?'On':''})"/>`);
     // Named sides are already labelled by the room itself and in the panel; only «1/2» need a mark on the plan.
     if(!labels.sides[side].named)text(to.x+n.x*14*k,to.y+n.y*14*k,side==='left'?'1':'2',c,on?13:11);}
    if(draft?.project){const d=C.geometry(shown).doors.find(x=>x.id===id);if(d){const L=d.len,ox=d.h[0]+d.o[0]*L,oy=d.h[1]+d.o[1]*L,cx=d.h[0]+d.c[0]*L,cy=d.h[1]+d.c[1]*L,sweep=d.o[0]*d.c[1]-d.o[1]*d.c[0]>0?1:0;
     parts.push(`<line x1="${d.h[0]}" y1="${d.h[1]}" x2="${ox}" y2="${oy}" stroke="${green}" stroke-width="3" vector-effect="non-scaling-stroke"/><path d="M${ox} ${oy}A${L} ${L} 0 0 ${sweep} ${cx} ${cy}" fill="none" stroke="${green}" stroke-width="2" stroke-dasharray="6 4" vector-effect="non-scaling-stroke"/>`);}}
   }
  }
  const defs=`<defs><marker id="openingArrowOn" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="${draft?.project?green:accent}"/></marker><marker id="openingArrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#8a8378"/></marker></defs>`;
  return parts.length?`<g class="opening-overlay" pointer-events="none">${defs}${parts.join('')}</g>`:'';
 }

 function startAdd(roomId,kind){
  const walls=O.roomWalls(project,roomId);const room=project.rooms.find(r=>r.id===roomId);
  if(!walls.length){toast('Esta estancia no tiene muros activos que la bordeen de forma inequívoca. Usa «Plano propio» para trazarlos.',7000);return;}
  if(is3D())return toast('Cambia al plano 2D para elegir el muro.');
  draft=null;error='';pick={roomId,kind,name:room?.name};setStatus(`${kind==='door'?'Añadir puerta':'Añadir ventana'}: toca uno de los muros resaltados de «${display(room?.name||'')}». Esc cancela.`);renderSel();
 }
 function pickAt(point){
  const {roomId,kind}=pick,walls=O.roomWalls(project,roomId);pick=null;setStatus('');
  const near=walls.map(w=>{const q=FloorPlanTracing.segmentPoint(point,w.start,w.end);return {w,d:q.distance};}).sort((a,b)=>a.d-b.d)[0];
  if(!near||near.d>Math.max(near.w.thicknessMm/2,24/view.s)){toast('Toca uno de los muros resaltados de la estancia. No se ha añadido nada.',6000);select({kind:'room',id:roomId});return;}
  try{const r=O.add(project,roomId,near.w.id,kind,point);draft={mode:'add',id:r.id,roomId,base:r.project,project:r.project,notes:[]};error='';ui.sel={kind:'opening',id:r.id};renderSel();renderPanel();drawer('panel',true);document.getElementById('openingTitle')?.focus({preventScroll:true});}
  catch(e){toast(e.message+' No se ha añadido nada.',7000);select({kind:'room',id:roomId});}
 }
 function applyDraft(){if(!draft?.project||error)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,draft.id);}
 function discard(){const back=draft?.mode==='add'?{kind:'room',id:draft.roomId}:{kind:'opening',id:draft?.id||ui.sel?.id};draft=null;error='';pending=null;select(back.id?back:null);}
 function cancel(){const was=!!pick||!!draft;pick=null;draft=null;error='';pending=null;setStatus('');return was;}
 // Selection changes discard an unapplied preview.
 function selected(sel){if(!(sel?.kind==='opening'&&sel.id===draft?.id)){draft=null;error='';pending=null;}if(sel)pick=null;}
 window.FloorPlanOpeningUI={panel,overlay,startAdd,pickAt,cancel,selected,applyDraft,discard,picking:()=>!!pick,draft:()=>draft,ready:()=>!!draft?.project&&!error};
})();
