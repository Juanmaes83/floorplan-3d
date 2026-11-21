/* Contextual doors and windows: select an opening in the 2D plan with «Seleccionar», edit it in the properties
   panel with a preview drawn on the plan, or add one to a wall of the selected room. Every change is a preview
   until «Aplicar»; applying stores first and then publishes one history step, like «Plano propio». */
(function(){
 'use strict';
 const O=FloorPlanOpenings,C=FloorPlanCore,SVGNS='http://www.w3.org/2000/svg';
 let draft=null,pick=null,error='',errorField='',pending=null,applied='',groups={id:null,open:{}};
 // Same language source as the whole app (global LANG; es by default). The core (opening-edit) keeps its Spanish messages as
 // its contract; this panel only presents them: `loc` rewrites the known ones in the language of the session.
 const tx=(es,en,zh)=>{const l=typeof LANG==='string'?LANG:'es';return l==='en'?en:l==='zh'?zh:es;};
 const q=s=>tx(`«${s}»`,`"${s}"`,`「${s}」`);
 const KIND3={'Puerta abatible':['Hinged door','平开门'],'Puerta corredera':['Sliding door','推拉门'],'Ventana':['Window','窗'],'Hueco de paso':['Passage opening','过道洞口'],'hueco':['opening','洞口']};
 const kindName=es=>KIND3[es]?tx(es,KIND3[es][0],KIND3[es][1]):es;
 const label=k=>typeof openingLabel==='function'?openingLabel(k):O.LABEL[k];
 const FIELD3={'Posición':['Position','位置'],'Ancho':['Width','宽度'],'Alto':['Height','高度'],'Antepecho':['Sill height','窗台高度']};
 const LOC=[
  [/(Puerta abatible|Puerta corredera|Ventana|Hueco de paso|hueco) · tramo (\d+)–(\d+) mm/g,(m,k,a,b)=>tx(m,`${kindName(k)} · span ${a}–${b} mm`,`${kindName(k)} · 区段 ${a}–${b} mm`)],
  [/otro hueco/g,()=>tx('otro hueco','another opening','另一个洞口')],
  [/El hueco ya no existe\./g,()=>tx('El hueco ya no existe.','The opening no longer exists.','该洞口已不存在。')],
  [/El hueco no tiene un muro válido\./g,()=>tx('El hueco no tiene un muro válido.','The opening has no valid wall.','该洞口没有有效的墙。')],
  [/El hueco empieza antes del inicio del muro, marcado «0» en el plano \(posición (-?\d+) mm\)\./g,(m,n)=>tx(m,`The opening starts before the start of the wall, marked "0" on the plan (position ${n} mm).`,`洞口起点在墙体起点之前（平面图中标记为「0」，位置 ${n} mm）。`)],
  [/El hueco termina en (\d+) mm y el muro mide (\d+) mm: no cabe\./g,(m,a,b)=>tx(m,`The opening ends at ${a} mm and the wall is ${b} mm long: it does not fit.`,`洞口在 ${a} mm 处结束，而墙长 ${b} mm：放不下。`)],
  [/Se solaparía (\d+) mm con (.*?) en el mismo muro\./g,(m,n,d)=>tx(m,`It would overlap ${n} mm with ${d} on the same wall.`,`将与同一面墙上的 ${d} 重叠 ${n} mm。`)],
  [/(Posición|Ancho|Alto|Antepecho): introduce un número en milímetros\./g,(m,f)=>tx(m,`${FIELD3[f][0]}: enter a number in millimetres.`,`${FIELD3[f][1]}：请输入以毫米为单位的数字。`)],
  [/Ancho: al menos 1 mm\./g,()=>tx('Ancho: al menos 1 mm.','Width: at least 1 mm.','宽度：至少 1 mm。')],
  [/Alto: al menos 100 mm\./g,()=>tx('Alto: al menos 100 mm.','Height: at least 100 mm.','高度：至少 100 mm。')],
  [/Antepecho: no puede ser negativo\./g,()=>tx('Antepecho: no puede ser negativo.','Sill height: cannot be negative.','窗台高度：不能为负。')],
  [/Alto más antepecho \((\d+) mm\) supera la altura del muro \((\d+) mm\)\./g,(m,a,b)=>tx(m,`Height plus sill height (${a} mm) exceeds the wall height (${b} mm).`,`高度加窗台高度（${a} mm）超过墙高（${b} mm）。`)],
  [/Sólo una puerta abatible tiene bisagra y sentido\./g,()=>tx('Sólo una puerta abatible tiene bisagra y sentido.','Only a hinged door has a hinge and a swing direction.','只有平开门才有铰链和开启方向。')],
  [/Bisagra o sentido no válidos\./g,()=>tx('Bisagra o sentido no válidos.','Invalid hinge or swing direction.','铰链或开启方向无效。')],
  [/Tipo de hueco no admitido\./g,()=>tx('Tipo de hueco no admitido.','Opening type not supported.','不支持该洞口类型。')],
  [/Ese muro no bordea la estancia seleccionada\. Toca uno de sus muros resaltados\./g,()=>tx('Ese muro no bordea la estancia seleccionada. Toca uno de sus muros resaltados.','That wall does not border the selected room. Tap one of its highlighted walls.','该墙不与所选房间相邻。请点按其高亮的墙。')],
  [/En ese tramo el muro no separa la estancia seleccionada de forma inequívoca\. Elige otro punto del muro o usa «Plano propio»\./g,()=>tx('En ese tramo el muro no separa la estancia seleccionada de forma inequívoca. Elige otro punto del muro o usa «Plano propio».','In that stretch the wall does not unambiguously separate the selected room. Choose another point on the wall or use "Own plan".','该段墙体无法明确分隔所选房间。请选择墙上的其他位置，或使用「自有平面图」。')],
  [/Tipo: (Puerta abatible|Puerta corredera|Ventana|Hueco de paso) → (Puerta abatible|Puerta corredera|Ventana|Hueco de paso)\./g,(m,a,b)=>tx(m,`Type: ${kindName(a)} → ${kindName(b)}.`,`类型：${kindName(a)} → ${kindName(b)}。`)],
  [/Alto: (\d+) mm \(valor habitual del nuevo tipo\)\./g,(m,n)=>tx(m,`Height: ${n} mm (usual value for the new type).`,`高度：${n} mm（新类型的常用值）。`)],
  [/Antepecho: (\d+) mm\./g,(m,n)=>tx(m,`Sill height: ${n} mm.`,`窗台高度：${n} mm。`)],
  [/Se elimina el sentido de apertura: sólo existe en puertas abatibles\./g,()=>tx('Se elimina el sentido de apertura: sólo existe en puertas abatibles.','The swing direction is removed: it only exists on hinged doors.','移除开启方向：只有平开门才有。')],
  [/Se crea un sentido de apertura inicial \(bisagra A, lado 1\): revísalo\./g,()=>tx('Se crea un sentido de apertura inicial (bisagra A, lado 1): revísalo.','An initial swing direction is created (hinge A, side 1): check it.','已创建初始开启方向（铰链 A，侧 1）：请检查。')],
  [/(Posición|Ancho|Alto|Antepecho): (-?\d+) → (-?\d+) mm\./g,(m,f,a,b)=>tx(m,`${FIELD3[f][0]}: ${a} → ${b} mm.`,`${FIELD3[f][1]}：${a} → ${b} mm。`)],
  [/Bisagra: extremo (A|B) → (A|B)\./g,(m,a,b)=>tx(m,`Hinge: end ${a} → ${b}.`,`铰链：端 ${a} → ${b}。`)],
  [/Sentido de apertura cambiado\./g,()=>tx('Sentido de apertura cambiado.','Swing direction changed.','开启方向已更改。')]
 ];
 const loc=m=>{let t=String(m??'');if(tx('es','en','zh')==='es')return t;for(const [re,fn] of LOC)t=t.replace(re,fn);return t;};
 const el=(tag,text,parent,attrs={})=>{const e=document.createElement(tag);if(text!==undefined&&text!==null)e.textContent=text;for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;};
 const opening=(p,id)=>p.openings.find(o=>o.id===id);
 const display=n=>typeof nm==='function'?nm(n):n;
 const sideText=(labels,value)=>{const side=labels.sides[value];return side.named?tx(labels[value],`Towards "${display(side.name)}"`,`朝向「${display(side.name)}」`):tx(labels[value],value==='left'?'Side 1':'Side 2',value==='left'?'侧 1':'侧 2');};
 const wallOf=(p,o)=>p.walls.find(w=>w.id===o.wallId);
 const current=()=>draft?.project||project;
 function setStatus(text){const s=document.getElementById('traceStatus');if(s){s.textContent=text;s.hidden=!text;}}

 // The «applied» note is kept as a key and rendered in the language of the session, so it follows a language change.
 const appliedText=k=>k==='added'?tx('Hueco añadido. Puedes deshacerlo con «Deshacer».','Opening added. You can undo it with "Undo".','已添加洞口。你可以用「撤销」撤回。'):k==='reviewed'?tx('Revisión confirmada. Puedes deshacerlo con «Deshacer».','Review confirmed. You can undo it with "Undo".','已确认审核。你可以用「撤销」撤回。'):tx('Cambio aplicado. Puedes deshacerlo con «Deshacer».','Change applied. You can undo it with "Undo".','更改已应用。你可以用「撤销」撤回。');
 // Store first; publish canonical state and one history step only after persistence succeeds.
 function apply(next,id,message){
  if(message===undefined)message=true;
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
  const margins=section.querySelector('#openingMargins');if(margins)margins.textContent=tx(`Muro libre a cada lado: ${shown.offsetMm} mm junto a A · ${Math.max(0,L-shown.offsetMm-shown.widthMm)} mm junto a B.`,`Free wall on each side: ${shown.offsetMm} mm next to A · ${Math.max(0,L-shown.offsetMm-shown.widthMm)} mm next to B.`,`两侧剩余墙长：A 侧 ${shown.offsetMm} mm · B 侧 ${Math.max(0,L-shown.offsetMm-shown.widthMm)} mm。`);
  for(const old of section.querySelectorAll('.field-error'))old.remove();for(const f of section.querySelectorAll('[aria-invalid]')){f.removeAttribute('aria-invalid');f.removeAttribute('aria-describedby');}
  const status=section.querySelector('#openingPreview');status.replaceChildren();
  // The error sits under the field that caused it, whose group is opened; the status only points to it.
  const cause=error&&errorField&&section.querySelector('#'+errorField);
  if(cause){cause.setAttribute('aria-invalid','true');cause.setAttribute('aria-describedby','openingError');const d=cause.closest('details');if(d)d.open=true;cause.closest('label').after(el('p',loc(error),null,{role:'alert',class:'opening-error field-error',id:'openingError'}));el('p',tx('No se puede aplicar: corrige el campo marcado.','It cannot be applied: correct the marked field.','无法应用：请修正标记的字段。'),status,{class:'opening-error-note'});}
  else if(error)el('p',loc(error),status,{role:'alert',class:'opening-error',id:'openingError'});
  else if(draft?.notes?.length){el('p',tx('Vista previa en el plano (verde, discontinua). Cambios:','Preview on the plan (green, dashed). Changes:','平面图上的预览（绿色虚线）。更改：'),status);const ul=el('ul',null,status);for(const n of draft.notes)el('li',loc(n),ul);}
  else if(adding)el('p',tx('Vista previa en el plano (verde, discontinua). Ajusta y pulsa «Aplicar y añadir».','Preview on the plan (green, dashed). Adjust and press "Apply and add".','平面图上的预览（绿色虚线）。调整后点按「应用并添加」。'),status);
  else if(applied)el('p',appliedText(applied),status,{class:'opening-applied',id:'openingApplied'});
  else el('p',tx('Cambia un valor para ver la vista previa en el plano. Nada se guarda hasta «Aplicar».','Change a value to see the preview on the plan. Nothing is saved until "Apply".','更改某个值即可在平面图上查看预览。点按「应用」之前不会保存任何内容。'),status,{class:'muted'});
  const actions=section.querySelector('.panel-foot');actions.replaceChildren();
  const row=el('div',null,actions,{class:'panel-foot-row'}),more=el('div',null,actions,{class:'panel-foot-row'});
  const button=(bid,text,fn,cls='btn',parent=row)=>{const b=el('button',text,parent,{type:'button',class:cls,id:bid});b.onclick=()=>{try{fn();}catch(e){error=e.message;paint(section,id);}};return b;};
  const ready=!!draft?.project&&!error;
  const go=button('openingApply',adding?tx('Aplicar y añadir','Apply and add','应用并添加'):tx('Aplicar cambios','Apply changes','应用更改'),()=>{if(!ready)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,id,adding?'added':undefined);},'btn primary');go.disabled=!ready;
  if(!ready)go.title=error?tx('Corrige el error indicado para poder aplicar.','Correct the indicated error to be able to apply.','请先修正所示错误才能应用。'):tx('Cambia algún valor para poder aplicar.','Change a value to be able to apply.','请更改某个值才能应用。');
  if(adding||draft||error)button('openingDiscard',adding?tx('Descartar','Discard','放弃'):tx('Descartar cambios','Discard changes','放弃更改'),discard);
  // History is reachable from the panel; while a preview is pending it must be applied or discarded first.
  const busy=!!draft||!!error;
  const u=button('openingUndo',tx('Deshacer','Undo','撤销'),()=>undo(),'btn',more),r=button('openingRedo',tx('Rehacer','Redo','重做'),()=>redo(),'btn',more);
  u.disabled=busy||!undoStack.length;r.disabled=busy||!redoStack.length;if(busy)u.title=r.title=tx('Aplica o descarta la vista previa primero.','Apply or discard the preview first.','请先应用或放弃预览。');
  if(!adding&&!draft&&!error)button('openingDelete',tx('Eliminar hueco','Delete opening','删除洞口'),()=>{if(!confirm(tx('¿Eliminar este hueco? Puedes deshacerlo.','Delete this opening? You can undo it.','删除此洞口？你可以撤销。')))return;const next=C.clone(project);next.openings=next.openings.filter(x=>x.id!==id);apply(next,id);ui.sel=null;renderAll();},'btn danger',more);
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
  const back=el('button',sideRoom?tx(`← Estancia «${display(sideRoom.name)}»`,`← Room "${display(sideRoom.name)}"`,`← 房间「${display(sideRoom.name)}」`):tx('← Vista general','← Overview','← 总览'),head,{type:'button',class:'btn panel-back',id:'openingBack','data-panel-back':''});
  back.onclick=()=>{if(adding){discard();return;}select(sideRoom?{kind:'room',id:sideRoom.roomId}:null);};
  if(adding)back.title=tx('Descarta la propuesta y vuelve a la estancia.','Discard the proposal and go back to the room.','放弃提议并返回房间。');
  // On narrow screens the panel is a drawer over the plan: «Ver en el plano» closes it and keeps the selection and
  // any preview, with «Aplicar / Editar / Descartar» or «Propiedades» in the bottom bar. Same place as in every panel.
  const look=el('button',tx('Ver en el plano','View on the plan','在平面图中查看'),head,{type:'button',class:'btn narrow-only panel-plan',id:'openingShowPlan','data-panel-plan':''});look.onclick=()=>{closeDrawers();renderFab();};
  el('h3',adding?tx(`Nueva ${label(o.kind)} · vista previa`,`New ${label(o.kind).toLowerCase()} · preview`,`新${label(o.kind)} · 预览`):label(o.kind),head,{id:'openingTitle',tabindex:'-1'});
  el('p',tx(`Muro seleccionado · ${L} mm · planta activa`,`Selected wall · ${L} mm · active level`,`所选墙体 · ${L} mm · 当前楼层`),head,{class:'muted opening-id panel-context'});
  const legacy=O.conflicts(project).filter(c=>c.a===id||c.b===id);
  if(legacy.length)el('p',tx(`Aviso de datos existentes: este hueco ya se solapa ${legacy.map(c=>`${Math.round(c.overlapMm)} mm con ${O.describe(project,c.a===id?c.b:c.a)}`).join(', ')}. Cambia su posición o su ancho para resolverlo; no se corrige solo.`,`Warning about existing data: this opening already overlaps ${legacy.map(c=>`${Math.round(c.overlapMm)} mm with ${loc(O.describe(project,c.a===id?c.b:c.a))}`).join(', ')}. Change its position or width to resolve it; it is not corrected automatically.`,`现有数据警告：此洞口已与 ${legacy.map(c=>`${loc(O.describe(project,c.a===id?c.b:c.a))} 重叠 ${Math.round(c.overlapMm)} mm`).join('、')}。请更改其位置或宽度来解决；不会自动修正。`),section,{class:'opening-legacy',role:'note',id:'openingLegacy'});
  const form=el('form',null,section,{id:'openingForm'});form.onsubmit=e=>e.preventDefault();
  const field=(parent,name,text,value,extra={})=>{const l=el('label',text,parent);const i=el('input',null,l,{name,id:'opening-'+name,type:'number',inputmode:'numeric',step:'1',...extra});i.value=raw[name]??value;i.oninput=()=>recompute(form,id);return l;};
  const typeBox=el('div',null,form,{class:'panel-group panel-fixed'});
  const typeLabel=el('label',tx('Tipo','Type','类型'),typeBox);const type=el('select',null,typeLabel,{name:'kind',id:'opening-kind'});for(const k of O.KINDS){const opt=el('option',label(k),type);opt.value=k;}type.value=raw.kind??o.kind;type.onchange=()=>recompute(form,id,true);
  if(draft?.mode==='edit'&&o.kind!==opening(project,id)?.kind)el('p',tx('Revisa el resto de campos antes de aplicar: cambian con el tipo.','Check the other fields before applying: they change with the type.','应用前请检查其余字段：它们会随类型而变化。'),typeBox,{class:'muted'});
  const door=o.kind==='door';
  const measures=group(form,'measures',tx('Posición y medidas','Position and dimensions','位置与尺寸'),!door||!!legacy.length||adding);
  field(measures,'offsetMm',tx('Distancia desde el inicio del muro «0» (mm)','Distance from the start of the wall "0" (mm)','距墙体起点「0」的距离 (mm)'),o.offsetMm,{min:'0'});
  const centre=el('button',tx('Centrar en el muro','Centre on the wall','在墙上居中'),measures,{type:'button',class:'btn',id:'openingCentre'});centre.onclick=()=>{form.elements.offsetMm.value=Math.round((L-Number(form.elements.widthMm.value))/2);recompute(form,id);};
  el('p',null,measures,{class:'muted',id:'openingMargins','aria-live':'polite'});
  if(o.offsetMm===0&&o.widthMm>=L)el('p',tx(`Este hueco ocupa todo su tramo de muro (${L} mm): no puede ensancharse ni desplazarse sin alargar ese tramo en «Plano propio».`,`This opening fills its whole stretch of wall (${L} mm): it cannot be widened or moved without lengthening that stretch in "Own plan".`,`此洞口占满整段墙体（${L} mm）：若不在「自有平面图」中加长该段墙体，就无法加宽或移动。`),measures,{class:'muted',id:'openingFullWall'});
  field(measures,'widthMm',tx('Ancho (mm)','Width (mm)','宽度 (mm)'),o.widthMm,{min:'1'});field(measures,'heightMm',tx('Alto (mm)','Height (mm)','高度 (mm)'),o.heightMm,{min:'100'});
  const sill=field(measures,'sillHeightMm',tx('Antepecho (mm)','Sill height (mm)','窗台高度 (mm)'),o.sillHeightMm,{min:'0'});sill.hidden=o.kind==='door'||o.kind==='sliding-door';
  if(door){
   const swing=group(form,'swing',tx('Apertura','Opening','开启'),true);
   const hinge=el('fieldset',null,swing,{id:'openingHinge'});el('legend',tx('Bisagra','Hinge','铰链'),hinge);
   for(const [value,text]of [['start',tx('Extremo A','End A','A 端')],['end',tx('Extremo B','End B','B 端')]]){const l=el('label',null,hinge,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'hinge',value});r.checked=o.swing.hinge===value;r.onchange=()=>recompute(form,id);el('span',text,l);}
   const side=el('fieldset',null,swing,{id:'openingSide'});el('legend',tx('Abre hacia','Opens towards','开向'),side);
   for(const value of ['left','right']){const l=el('label',null,side,{class:'radio'});const r=el('input',null,l,{type:'radio',name:'side',value});r.checked=o.swing.side===value;r.onchange=()=>recompute(form,id);el('span',sideText(labels,value),l);}
   el('p',labels.sides.left.named&&labels.sides.right.named?tx('A y B están rotulados en el plano; las flechas muestran hacia dónde abre la hoja.','A and B are labelled on the plan; the arrows show where the leaf opens.','A 和 B 已在平面图上标注；箭头表示门扇的开启方向。'):tx('Un lado no pertenece a una única estancia: el plano rotula «1» y «2» con una flecha en cada lado.','One side does not belong to a single room: the plan labels "1" and "2" with an arrow on each side.','有一侧不属于单一房间：平面图在两侧用箭头标注「1」和「2」。'),swing,{class:'muted'});
  }
  if(!adding){
   const review=opening(project,id)?.source?.review,confirmed=review==='confirmed';
   const box=group(form,'review',tx('Revisión del hueco','Opening review','洞口审核'),false,confirmed?tx('confirmada','confirmed','已确认'):tx('sin revisar','unreviewed','未审核'));
   el('p',tx(`Estado: ${confirmed?'confirmada (posición, medidas y sentido como un todo)':'sin revisar'}. Editar el hueco lo deja sin revisar.`,`Status: ${confirmed?'confirmed (position, dimensions and direction as a whole)':'unreviewed'}. Editing the opening leaves it unreviewed.`,`状态：${confirmed?'已确认（位置、尺寸和方向作为整体）':'未审核'}。编辑洞口会使其恢复为未审核。`),box,{class:'muted',id:'openingReview'});
   if(!confirmed&&!draft&&!error){const b=el('button',tx('Confirmar revisión de este hueco','Confirm the review of this opening','确认此洞口的审核'),box,{type:'button',class:'btn',id:'openingConfirm'});b.onclick=()=>{const next=C.clone(project),t=opening(next,id);t.source={method:t.source?.method||'manual',review:'confirmed'};apply(next,id,'reviewed');};}
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
  if(!b){b=el('div',null,document.getElementById('stage'),{id:'openingPick',class:'opening-pick-banner',role:'region','aria-label':tx('Añadir hueco','Add opening','添加洞口')});}
  b.hidden=false;b.replaceChildren();
  const copy=el('div',null,b,{class:'opening-pick-copy'});
  el('strong',tx(`Añadir ${(O.LABEL[pick.kind]||'hueco').toLowerCase()} a «${display(pick.name||'')}»`,`Add ${label(pick.kind).toLowerCase()} to "${display(pick.name||'')}"`,`向「${display(pick.name||'')}」添加${label(pick.kind)}`),copy,{id:'openingPickTitle'});
  if(pick.error)el('span',loc(pick.error),copy,{role:'alert',class:'opening-error',id:'openingPickError'});
  else el('span',tx('Paso 1 de 2: toca uno de sus muros resaltados en verde. Verás la propuesta antes de añadirla.','Step 1 of 2: tap one of its walls highlighted in green. You will see the proposal before adding it.','第 1 步（共 2 步）：点按以绿色高亮的其中一面墙。添加前你会先看到预览。'),copy,{id:'openingPickHint'});
  const c=el('button',tx('Cancelar','Cancel','取消'),b,{type:'button',class:'btn',id:'openingPickCancel'});c.onclick=()=>cancelPick();
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
  if(!walls.length){toast(tx('Esta estancia no tiene muros activos que la bordeen de forma inequívoca. Usa «Plano propio» para trazarlos.','This room has no active walls that unambiguously border it. Use "Own plan" to draw them.','此房间没有能明确围合它的有效墙体。请使用「自有平面图」绘制。'),7000);return;}
  if(is3D())return toast(tx('Cambia al plano 2D para elegir el muro.','Switch to the 2D plan to choose the wall.','请切换到 2D 平面图来选择墙体。'));
  draft=null;error='';pick={roomId,kind,name:room?.name,error:''};setStatus('');banner();frameRoom(roomId);renderSel();renderFab();document.getElementById('openingPickCancel')?.focus({preventScroll:true});
 }
 function pickAt(point){
  const {roomId,kind}=pick,walls=O.roomWalls(project,roomId);
  const near=walls.map(w=>{const q=FloorPlanTracing.segmentPoint(point,w.start,w.end);return {w,d:q.distance};}).sort((a,b)=>a.d-b.d)[0];
  if(!near||near.d>Math.max(near.w.thicknessMm/2,24/view.s)){pick.error=tx(`Ese punto no está sobre un muro verde de «${display(pick.name||'')}». Toca uno de ellos o pulsa «Cancelar». No se ha añadido nada.`,`That point is not on a green wall of "${display(pick.name||'')}". Tap one of them or press "Cancel". Nothing has been added.`,`该点不在「${display(pick.name||'')}」的绿色墙体上。请点按其中一面或按「取消」。未添加任何内容。`);banner();frameRoom(roomId);return;}
  try{const r=O.add(project,roomId,near.w.id,kind,point);pick=null;banner();draft={mode:'add',id:r.id,roomId,base:r.project,project:r.project,notes:[]};error='';applied='';ui.sel={kind:'opening',id:r.id};renderSel();renderPanel();drawer('panel',true);document.getElementById('openingTitle')?.focus({preventScroll:true});}
  catch(e){pick.error=tx(`${e.message} No se ha añadido nada; prueba en otro punto o pulsa «Cancelar».`,`${loc(e.message)} Nothing has been added; try another point or press "Cancel".`,`${loc(e.message)} 未添加任何内容；请尝试其他位置或按「取消」。`);banner();frameRoom(roomId);}
 }
 function applyDraft(){if(!draft?.project||error)throw Error(error||'No hay cambios que aplicar.');apply(draft.project,draft.id,draft.mode==='add'?'added':undefined);}
 function discard(){const back=draft?.mode==='add'?{kind:'room',id:draft.roomId}:{kind:'opening',id:draft?.id||ui.sel?.id};draft=null;error='';pending=null;applied='';select(back.id?back:null);}
 function cancel(){const was=!!pick||!!draft;pick=null;draft=null;error='';pending=null;applied='';banner();setStatus('');return was;}
 // Selection changes discard an unapplied preview; the «applied» note belongs to the opening just applied.
 function selected(sel){if(!(sel?.kind==='opening'&&sel.id===draft?.id)){draft=null;error='';pending=null;}if(!(sel?.kind==='opening'&&sel.id===ui.sel?.id)){applied='';groups={id:null,open:{}};}if(sel){pick=null;banner();}}
 // The «add to a room» banner is not part of the panel: it is redrawn in the new language while it is shown.
 document.addEventListener('rubik:languagechange',()=>{if(pick)banner();});
 window.FloorPlanOpeningUI={panel,overlay,startAdd,pickAt,cancel,cancelPick,selected,applyDraft,discard,picking:()=>!!pick,pickError:()=>pick?.error||'',draft:()=>draft,ready:()=>!!draft?.project&&!error};
})();
