/* Contextual doors and windows: select an opening in the 2D plan with «Seleccionar», edit it in the properties
   panel with a preview drawn on the plan, or add one to a wall of the selected room. Every change is a preview
   until «Aplicar»; applying stores first and then publishes one history step, like «Plano propio». */
(function(){
 'use strict';
 const O=FloorPlanOpenings,C=FloorPlanCore,SVGNS='http://www.w3.org/2000/svg';
 let draft=null,pick=null,error='',errorField='',pending=null,applied='',groups={id:null,open:{}};
 const el=(tag,text,parent,attrs={})=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
 const opening=(p,id)=>p.openings.find(o=>o.id===id);
 const display=n=>typeof nm==='function'?nm(n):n;
 const wallOf=(p,o)=>p.walls.find(w=>w.id===o.wallId);
 const current=()=>draft?.project||project;
 function setStatus(text){const s=document.getElementById('traceStatus');if(s){s.textContent=text;s.hidden=!text;}}

 // Store first; publish canonical state and one history step only after persistence succeeds.
 function apply(next,id,message='Cambio aplicado. Puedes deshacerlo con «Deshacer».'){
  next.updatedAt=new Date(Math.max(Date.now(),Date.parse(next.createdAt))).toISOString();C.validate(next);
  const before=snap();storage.setItem(STORE,JSON.stringify(next));
  project=next;undoStack.push(before);if(undoStack.length>150)undoStack.shift();redoStack.length=0;
  draft=null;error='';pending=null;applied=message;ui.sel={kind:'opening',id};refreshProject();renderAll();window.FloorPlanPresentation?.onProjectChange();
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
  const before=opening(baseOf(),id);applied='';
  pending={id,raw:Object.fromEntries([...form.elements].filter(e=>e.name&&e.type!=='radio'&&(!structural||e.name==='kind'||e.value!==String(before?.[e.name]))).map(e=>[e.name,e.value])),focus:document.activeElement?.id};
  errorField='';try{const base=baseOf(),r=O.edit(base,id,values(form));draft={...(draft?.mode==='add'?draft:{mode:'edit',id}),project:r.changed||draft?.mode==='add'?r.project:null,notes:r.notes};if(!draft.project&&draft.mode==='edit')draft=null;error='';}
  catch(e){error=e.message;errorField=form.contains(document.activeElement)&&document.activeElement.name&&document.activeElement.type!=='radio'?document.activeElement.id:'';if(draft?.mode==='edit')draft={mode:'edit',id,project:null,notes:[]};else if(draft?.mode==='add')draft={...draft,project:null,notes:[]};}
  renderSel();renderFab();
  if(structural){renderPanel();if(pending?.focus)document.getElementById(pending.focus)?.focus({preventScroll:true});}
  else{const section=document.querySelector('#panel .opening-panel');if(section)paint(section,id);}
 }
 // Status, margins and the action bar; repainted in place while the person types.
 function paint(section,id){
  const adding=draft?.mode==='add',shown=opening(current(),id)||opening(baseOf(),id),w=wallOf(current(),shown),L=Math.floor(O.length(w));
  const margins=section.querySelector('#openingMargins');if(margins)margins.textContent=`Muro libre a cada lado: ${shown.offsetMm} mm junto a A · ${Math.max(0,L-shown.offsetMm-shown.widthMm)} mm junto a B.`;
  for(const old of section.querySelectorAll('.field-error'))old.remove();for(const f of section.querySelectorAll('[aria-invalid]')){f.removeAttribute('aria-invalid');f.removeAttribute('aria-describedby');}
  const status=section.querySelector('#openingPreview');status.replaceChildren();
  // The error sits under the field that caused it, whose group is opened; the status only points to it.
  const cause=error&&errorField&&section.querySelector('#'+errorField);
  if(cause){cause.setAttribute('aria-invalid','true');cause.setAttribute('aria-describedby','openingError');const d=cause.closest('details');if(d)d.open=true;cause.closest('label').after(el('p',error,null,{role:'alert',class:'opening-error field-error',id:'openingError'}));el('p','No se puede aplicar: corrige el campo marcado.',status,{class:'opening-error-note'});}
  else if(error)el('p',error,status,{role:'alert',class:'opening-error',id:'openingError'});
  else if(draft?.notes?.length){el('p','Vista previa en el plano (verde, discontinua). Cambios:',status);const ul=el('ul',null,status);for(const n of draft.notes)el('li',n,ul);}
  else if(adding)el('p','Vista previa en el plano (verde, discontinua). Ajusta y pulsa «Aplicar y añadir».',status);
  else if(applied)el('p',applied,status,{class:'opening-applied',id:'openingApplied'});
  else el('p','Cambia un valor para ver la vista previa en el plano. Nada se guarda hasta «Aplicar».',status,{class:'muted'});
  const actions=section.querySelector('.panel-foot');actions.replaceChildren();
  const row=el('div',null,actions,{class:'panel-foot-row'}),more=el('div',null,actions,{class:'panel-foot-row'});
  const button=(bid,text,fn,cls='btn',parent=row)=>{const b=el('button',text,parent,{type:'button',class:cls,id:bid});b.onclick=()=>{try{fn();}catch(e){error=e.message;paint(section,id);}};return b;};
  const ready=!!draft?.project&&!error;
  const go=button('openingApply',adding?'Aplicar y añadir':'Aplicar cambios',()=>{if(!ready)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,id,adding?'Hueco añadido. Puedes deshacerlo con «Deshacer».':undefined);},'btn primary');go.disabled=!ready;
  if(!ready)go.title=error?'Corrige el error indicado para poder aplicar.':'Cambia algún valor para poder aplicar.';
  if(adding||draft||error)button('openingDiscard',adding?'Descartar':'Descartar cambios',discard);
  // On narrow screens the panel is a drawer over the plan: «Ver en el plano» closes it and keeps the selection and
  // any preview, with «Aplicar / Editar / Descartar» or «Propiedades» in the bottom bar.
  const look=button('openingShowPlan','Ver en el plano',()=>{closeDrawers();renderFab();});look.classList.add('narrow-only');
  // History is reachable from the panel; while a preview is pending it must be applied or discarded first.
  const busy=!!draft||!!error;
  const u=button('openingUndo','Deshacer',()=>undo(),'btn',more),r=button('openingRedo','Rehacer',()=>redo(),'btn',more);
  u.disabled=busy||!undoStack.length;r.disabled=busy||!redoStack.length;if(busy)u.title=r.title='Aplica o descarta la vista previa primero.';
  if(!adding&&!draft&&!error)button('openingDelete','Eliminar hueco',()=>{if(!confirm('¿Eliminar este hueco? Puedes deshacerlo.'))return;const next=C.clone(project);next.openings=next.openings.filter(x=>x.id!==id);apply(next,id);ui.sel=null;renderAll();},'btn danger',more);
 }
 // Accordion state survives repaints of the same opening and resets when another one is selected.
 function group(form,key,title,open,summaryNote){
  if(groups.id!==ui.sel?.id)groups={id:ui.sel?.id,open:{}};
  const d=el('details',null,form,{class:'panel-group','data-group':key,id:'openingGroup-'+key});d.open=groups.open[key]??open;
  const s=el('summary',title,d);if(summaryNote)el('small',summaryNote,s);
  d.addEventListener('toggle',()=>{groups.open[key]=d.open;});
  return el('div',null,d,{class:'panel-group-body'});
 }

 function panel(root,id){
  const shown=current(),o=opening(shown,id)||opening(baseOf(),id);if(!o){draft=null;return false;}
  const w=wallOf(shown,o),L=Math.floor(O.length(w)),labels=O.sideLabels(shown,o,display),adding=draft?.mode==='add',raw=pending?.id===id?pending.raw:{};
  const sideRoom=adding?{roomId:draft.roomId,name:project.rooms.find(r=>r.id===draft.roomId)?.name}:[labels.sides.left,labels.sides.right].find(x=>x.named);
  // A newly selected opening starts at the top of the panel, not at the scroll position of the previous one.
  const fresh=groups.id!==id;root.replaceChildren();const section=el('section',null,root,{class:'opening-panel panel-view','aria-labelledby':'openingTitle'});
  if(fresh){const box=root.closest('aside');if(box)box.scrollTop=0;}
  // Shared head: «Volver» always first and in the same place; then what is selected and where.
  const head=el('div',null,section,{class:'panel-head'});
  const back=el('button',sideRoom?`← Estancia «${display(sideRoom.name)}»`:'← Vista general',head,{type:'button',class:'btn panel-back',id:'openingBack','data-panel-back':''});
  back.onclick=()=>{if(adding){discard();return;}select(sideRoom?{kind:'room',id:sideRoom.roomId}:null);};
  if(adding)back.title='Descarta la propuesta y vuelve a la estancia.';
  el('h3',`${adding?'Nueva ':''}${O.LABEL[o.kind]}${adding?' · vista previa':''}`,head,{id:'openingTitle',tabindex:'-1'});
  el('p',`Muro seleccionado · ${L} mm · planta activa`,head,{class:'muted opening-id panel-context'});
  const legacy=O.conflicts(project).filter(c=>c.a===id||c.b===id);
  if(legacy.length)el('p',`Aviso de datos existentes: este hueco ya se solapa ${legacy.map(c=>`${Math.round(c.overlapMm)} mm con ${O.describe(project,c.a===id?c.b:c.a)}`).join(', ')}. Cambia su posición o su ancho para resolverlo; no se corrige solo.`,section,{class:'opening-legacy',role:'note',id:'openingLegacy'});
  const form=el('form',null,section,{id:'openingForm'});form.onsubmit=e=>e.preventDefault();
  const field=(parent,name,text,value,extra={})=>{const l=el('label',text,parent);const i=el('input',null,l,{name,id:'opening-'+name,type:'number',inputmode:'numeric',step:'1',...extra});i.value=raw[name]??value;i.oninput=()=>recompute(form,id);return l;};
  const typeBox=el('div',null,form,{class:'panel-group panel-fixed'});
  const typeLabel=el('label','Tipo',typeBox);const type=el('select',null,typeLabel,{name:'kind',id:'opening-kind'});for(const k of O.KINDS){const opt=el('option',O.LABEL[k],type);opt.value=k;}type.value=raw.kind??o.kind;type.onchange=()=>recompute(form,id,true);
  if(draft?.mode==='edit'&&o.kind!==opening(project,id)?.kind)el('p','Revisa el resto de campos antes de aplicar: cambian con el tipo.',typeBox,{class:'muted'});
  const door=o.kind==='door';
  const measures=group(form,'measures','Posición y medidas',!door||!!legacy.length||adding);
  field(measures,'offsetMm','Distancia desde el inicio del muro «0» (mm)',o.offsetMm,{min:'0'});
  const centre=el('button','Centrar en el muro',measures,{type:'button',class:'btn',id:'openingCentre'});centre.onclick=()=>{form.elements.offsetMm.value=Math.round((L-Number(form.elements.widthMm.value))/2);recompute(form,id);};
  el('p',null,measures,{class:'muted',id:'openingMargins','aria-live':'polite'});
  if(o.offsetMm===0&&o.widthMm>=L)el('p',`Este hueco ocupa todo su tramo de muro (${L} mm): no puede ensancharse ni desplazarse sin alargar ese tramo en «Plano propio».`,measures,{class:'muted',id:'openingFullWall'});
  field(measures,'widthMm','Ancho (mm)',o.widthMm,{min:'1'});field(measures,'heightMm','Alto (mm)',o.heightMm,{min:'100'});
  const sill=field(measures,'sillHeightMm','Antepecho (mm)',o.sillHeightMm,{min:'0'});sill.hidden=o.kind==='door'||o.kind==='sliding-door';
  if(door){
   const swing=group(form,'swing','Apertura',true);
   const hinge=el('fieldset',null,swing,{id:'openingHinge'});el('legend','Bisagra',hinge);
   for(const [value,text]of [['start','Extremo A'],['end','Extremo B']]){const l=el('label',null,hinge,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'hinge',value});r.checked=o.swing.hinge===value;r.onchange=()=>recompute(form,id);el('span',text,l);}
   const side=el('fieldset',null,swing,{id:'openingSide'});el('legend','Abre hacia',side);
   for(const value of ['left','right']){const l=el('label',null,side,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'side',value});r.checked=o.swing.side===value;r.onchange=()=>recompute(form,id);el('span',labels[value],l);}
   el('p',labels.sides.left.named&&labels.sides.right.named?'A y B están rotulados en el plano; las flechas muestran hacia dónde abre la hoja.':'Un lado no pertenece a una única estancia: el plano rotula «1» y «2» con una flecha en cada lado.',swing,{class:'muted'});
  }
  if(!adding){
   const review=opening(project,id)?.source?.review,confirmed=review==='confirmed';
   const box=group(form,'review','Revisión del hueco',false,confirmed?'confirmada':'sin revisar');
   el('p',`Estado: ${confirmed?'confirmada (posición, medidas y sentido como un todo)':'sin revisar'}. Editar el hueco lo deja sin revisar.`,box,{class:'muted',id:'openingReview'});
   if(!confirmed&&!draft&&!error){const b=el('button','Confirmar revisión de este hueco',box,{type:'button',class:'btn',id:'openingConfirm'});b.onclick=()=>{const next=C.clone(project),t=opening(next,id);t.source={method:t.source?.method||'manual',review:'confirmed'};apply(next,id,'Revisión confirmada. Puedes deshacerlo con «Deshacer».');};}
  }
  el('div',null,section,{id:'openingPreview','aria-live':'polite',class:'opening-status'});
  el('div',null,section,{class:'panel-foot actions'});
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

 // «Añadir puerta/ventana» from a room: a banner over the plan says what to do now and offers «Cancelar».
 // Wrong taps and refused positions are explained there; the person can try another wall. Nothing is stored.
 function banner(){
  let b=document.getElementById('openingPick');
  if(!pick){if(b)b.hidden=true;return;}
  if(!b){b=el('div',null,document.getElementById('stage'),{id:'openingPick',class:'opening-pick-banner',role:'region','aria-label':'Añadir hueco'});}
  b.hidden=false;b.replaceChildren();
  const what=pick.kind==='door'?'puerta':'ventana',copy=el('div',null,b,{class:'opening-pick-copy'});
  el('strong',`Añadir ${what} a «${display(pick.name||'')}»`,copy,{id:'openingPickTitle'});
  if(pick.error)el('span',pick.error,copy,{role:'alert',class:'opening-error',id:'openingPickError'});
  else el('span','Paso 1 de 2: toca uno de sus muros resaltados en verde. Verás la propuesta antes de añadirla.',copy,{id:'openingPickHint'});
  const c=el('button','Cancelar',b,{type:'button',class:'btn',id:'openingPickCancel'});c.onclick=()=>cancelPick();
 }
 // Keep the room's walls clear of the banner: if part of the room is hidden under it or off screen, frame the room
 // in the plan area below the banner. A view that already shows it is left alone.
 function frameRoom(roomId){
  const room=project.rooms.find(r=>r.id===roomId),plan=document.getElementById('plan'),b=document.getElementById('openingPick');if(!room||!plan||!b)return;
  const W=plan.clientWidth,H=plan.clientHeight,top=b.getBoundingClientRect().bottom-plan.getBoundingClientRect().top+8,pad=600;
  const xs=room.polygon.map(p=>p.x),ys=room.polygon.map(p=>p.y),box={x0:Math.min(...xs)-pad,x1:Math.max(...xs)+pad,y0:Math.min(...ys)-pad,y1:Math.max(...ys)+pad};
  const sx=x=>(x-view.x0)*view.s,sy=y=>(y-view.y0)*view.s;
  if(sx(box.x0)>=0&&sx(box.x1)<=W&&sy(box.y0)>=top&&sy(box.y1)<=H-8)return;
  const avail=Math.max(60,H-top-8),s=Math.min(W/(box.x1-box.x0),avail/(box.y1-box.y0),.2);
  view.s=s;view.x0=(box.x0+box.x1)/2-W/2/s;view.y0=(box.y0+box.y1)/2-(top+avail/2)/s;applyView();
 }
 function cancelPick(){const roomId=pick?.roomId;pick=null;banner();setStatus('');if(roomId){select({kind:'room',id:roomId});drawer('panel',true);}else renderSel();}
 function startAdd(roomId,kind){
  const walls=O.roomWalls(project,roomId);const room=project.rooms.find(r=>r.id===roomId);
  if(!walls.length){toast('Esta estancia no tiene muros activos que la bordeen de forma inequívoca. Usa «Plano propio» para trazarlos.',7000);return;}
  if(is3D())return toast('Cambia al plano 2D para elegir el muro.');
  draft=null;error='';pick={roomId,kind,name:room?.name,error:''};setStatus('');banner();frameRoom(roomId);renderSel();renderFab();document.getElementById('openingPickCancel')?.focus({preventScroll:true});
 }
 function pickAt(point){
  const {roomId,kind}=pick,walls=O.roomWalls(project,roomId);
  const near=walls.map(w=>{const q=FloorPlanTracing.segmentPoint(point,w.start,w.end);return {w,d:q.distance};}).sort((a,b)=>a.d-b.d)[0];
  if(!near||near.d>Math.max(near.w.thicknessMm/2,24/view.s)){pick.error=`Ese punto no está sobre un muro verde de «${display(pick.name||'')}». Toca uno de ellos o pulsa «Cancelar». No se ha añadido nada.`;banner();frameRoom(roomId);return;}
  try{const r=O.add(project,roomId,near.w.id,kind,point);pick=null;banner();draft={mode:'add',id:r.id,roomId,base:r.project,project:r.project,notes:[]};error='';applied='';ui.sel={kind:'opening',id:r.id};renderSel();renderPanel();drawer('panel',true);document.getElementById('openingTitle')?.focus({preventScroll:true});}
  catch(e){pick.error=`${e.message} No se ha añadido nada; prueba en otro punto o pulsa «Cancelar».`;banner();frameRoom(roomId);}
 }
 function applyDraft(){if(!draft?.project||error)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,draft.id,draft.mode==='add'?'Hueco añadido. Puedes deshacerlo con «Deshacer».':undefined);}
 function discard(){const back=draft?.mode==='add'?{kind:'room',id:draft.roomId}:{kind:'opening',id:draft?.id||ui.sel?.id};draft=null;error='';pending=null;applied='';select(back.id?back:null);}
 function cancel(){const was=!!pick||!!draft;pick=null;draft=null;error='';pending=null;applied='';banner();setStatus('');return was;}
 // Selection changes discard an unapplied preview; the «applied» note belongs to the opening just applied.
 function selected(sel){if(!(sel?.kind==='opening'&&sel.id===draft?.id)){draft=null;error='';pending=null;}if(!(sel?.kind==='opening'&&sel.id===ui.sel?.id)){applied='';groups={id:null,open:{}};}if(sel){pick=null;banner();}}
 window.FloorPlanOpeningUI={panel,overlay,startAdd,pickAt,cancel,cancelPick,selected,applyDraft,discard,picking:()=>!!pick,pickError:()=>pick?.error||'',draft:()=>draft,ready:()=>!!draft?.project&&!error};
})();
