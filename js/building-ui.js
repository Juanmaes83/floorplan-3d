/* Building (multi-level) editing UI for FloorPlanBuildingV1. The 2D editor, 3D and every single-level tool keep
   working on `project`, which is always the active level's 1.x project; this module switches levels, keeps one
   undo history per level, draws the lower level as a dimmed reference and the stairs, edits building data
   (levels, offsets, stairs) and handles building JSON/ZIP. Classic script: shares the app's globals. */
(function(){
 const B=window.FloorPlanBuilding,P=window.FloorPlanPackage,T=window.FloorPlanTracing,I=window.FloorPlanImages;
 const NS='http://www.w3.org/2000/svg';
 const histories=new Map();let historyEntry=null,pendingLevel=null,adoptedLevel=false,showGhost=true,lastContext='',dialogError='',announced=null;
 const $=s=>document.querySelector(s);
 const isBuilding=()=>!!library?.isBuilding?.();
 // The stored building with the on-screen project as its active level (the editor may be ahead of storage).
 function current(){if(!isBuilding())return null;const b=library.building(),id=library.activeLevelId();return B.setProject(b,id,project);}
 const activeLevel=b=>b.levels.find(l=>l.id===library.activeLevelId());
 const fmtM2=v=>v.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2});
 const say=(text,ms=5000)=>{const s=$('#levelStatus');if(s)s.textContent=text;toast(text,ms);};
 function blank(name){return FloorPlanRoomLayout.blank(name);}
 function persist(b,opts={}){library.saveBuilding(b,{visible:project,...opts});}
 // Switches the editor to another level of the open building; one undo/redo history per level.
 function selectLevel(levelId){
  if(!isBuilding()||levelId===library.activeLevelId())return;
  const b=current(),from=activeLevel(b),to=b.levels.find(l=>l.id===levelId);if(!to)return;
  if(!save())return;
  histories.set(from.id,{undo:undoStack.splice(0),redo:redoStack.splice(0)});
  project=library.setActiveLevel(levelId);
  const h=histories.get(levelId);if(h){undoStack.push(...h.undo);redoStack.push(...h.redo);}
  ui.sel=null;ui.mA=ui.mCur=null;window.FloorPlanTraceUI?.cancel();window.FloorPlanPresentation?.invalidate();
  // Keep the same building point under the viewport centre: local coordinates differ by the offsets.
  view.x0+=from.offsetMm.x-to.offsetMm.x;view.y0+=from.offsetMm.y-to.offsetMm.y;
  refreshProject();renderAll();applyView();
  say(`Planta activa: «${to.name}» (${to.order+1} de ${b.levels.length}). Sólo se edita esta planta.`,3500);
 }
 // Called whenever the open entry changes (open, import, create): histories belong to one entry.
 function entryChanged(){if(historyEntry!==library?.activeId()){histories.clear();historyEntry=library?.activeId();}lastContext='';announced=null;}
 function context(b){return b?{activeLevelId:library.activeLevelId(),levels:b.levels,stairs:b.stairs}:null;}
 function push3D(b){
  const ctx=context(b),key=ctx?JSON.stringify([ctx.activeLevelId,ctx.stairs,ctx.levels.map(l=>l.id===ctx.activeLevelId?[l.id,l.order,l.elevationMm,l.slabThicknessMm,l.offsetMm]:l)]):'none';
  // The 3D module loads after this script; until it exists nothing is sent (and nothing is marked as sent).
  if(key===lastContext||!window.View3D?.setLevelContext)return;lastContext=key;window.View3D.setLevelContext(ctx);
 }
 function bar(b){
  const box=$('#levelBar');if(!box)return;box.replaceChildren();box.hidden=!b;
  const status=$('#levelStatus');
  if(!b){if(status)status.textContent='';$('#levelsBtn').textContent='Plantas';return;}
  const active=activeLevel(b);$('#levelsBtn').textContent='Plantas…';
  for(const l of b.levels){const btn=document.createElement('button');btn.type='button';btn.className='btn chip'+(l.id===active.id?' on':'');btn.dataset.level=l.id;btn.textContent=l.name;btn.setAttribute('aria-pressed',String(l.id===active.id));btn.onclick=()=>selectLevel(l.id);box.append(btn);}
  const all=document.createElement('button');all.type='button';all.id='levelViewAll';all.className='btn chip only3d'+(window.View3D?.levelView==='all'?' on':'');all.textContent='Ver todas';all.title='Ver en 3D todas las plantas o sólo hasta la activa';
  all.setAttribute('aria-pressed',String(window.View3D?.levelView==='all'));all.onclick=()=>{const next=window.View3D?.levelView==='all'?'active':'all';lastContext='';window.View3D?.setLevelContext(context(current()),next);bar(current());};box.append(all);
  if(status&&!status.textContent.startsWith('Planta activa'))status.textContent=`Edificio «${b.name}» · planta «${active.name}» (${active.order+1} de ${b.levels.length})`;
 }
 const pathOf=(poly,dx=0,dy=0)=>poly.map((p,i)=>`${i?'L':'M'}${(Array.isArray(p)?p[0]:p.x)+dx} ${(Array.isArray(p)?p[1]:p.y)+dy}`).join(' ')+' Z';
 function el(name,attrs,parent){const e=document.createElementNS(NS,name);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);parent?.append(e);return e;}
 function render2D(b){
  const ghost=$('#gLevelGhost'),stairs=$('#gStairs');if(!ghost||!stairs)return;ghost.replaceChildren();stairs.replaceChildren();
  if(!b)return;const A=activeLevel(b),below=b.levels[A.order-1];
  if(below&&showGhost){
   const g=Core.geometry(below.project),dx=below.offsetMm.x-A.offsetMm.x,dy=below.offsetMm.y-A.offsetMm.y;ghost.dataset.level=below.id;
   for(const r of g.rooms)el('path',{d:pathOf(r.poly,dx,dy),class:'level-ghost-room'},ghost);
   for(const w of g.walls.filter(w=>w.status!=='demolished'))el('path',{d:pathOf(w.poly,dx,dy),class:'level-ghost-wall'},ghost);
  }
  for(const s of b.stairs){
   const role=s.fromLevelId===A.id?'from':s.toLevelId===A.id?'to':null;if(!role)continue;
   const fp=B.toLocal(B.stairFootprint(s),A),g=el('g',{class:`level-stair level-stair-${role}`,'data-stair':s.id},stairs);
   el('path',{d:pathOf(fp),class:'level-stair-outline'},g);
   const a=s.rotationDeg*Math.PI/180,d={x:Math.cos(a),y:Math.sin(a)},n={x:-d.y,y:d.x},w=s.widthMm/2,start={x:s.startMm.x-A.offsetMm.x,y:s.startMm.y-A.offsetMm.y};
   if(role==='from')for(let i=1;i<s.risers;i++){const t=s.runLengthMm*i/s.risers,c={x:start.x+d.x*t,y:start.y+d.y*t};el('line',{x1:c.x-n.x*w,y1:c.y-n.y*w,x2:c.x+n.x*w,y2:c.y+n.y*w,class:'level-stair-tread'},g);}
   else{el('line',{x1:fp[0].x,y1:fp[0].y,x2:fp[2].x,y2:fp[2].y,class:'level-stair-tread'},g);el('line',{x1:fp[1].x,y1:fp[1].y,x2:fp[3].x,y2:fp[3].y,class:'level-stair-tread'},g);}
   const tip={x:start.x+d.x*s.runLengthMm,y:start.y+d.y*s.runLengthMm};
   el('line',{x1:start.x,y1:start.y,x2:tip.x,y2:tip.y,class:'level-stair-arrow','marker-end':'url(#levelArrow)'},g);
   // The label sits inside the footprint, so it never lands on the room label, walls, furniture or dimensions.
   const text=role==='from'?'Sube':'Hueco de escalera',at=B.stairLabel(s,A,text);
   const label=el('text',{x:at.x,y:at.y,class:'level-stair-label','text-anchor':'middle','dominant-baseline':'central','font-size':at.fontMm,transform:`rotate(${at.angleDeg} ${at.x} ${at.y})`},g);
   label.textContent=text;
  }
  // BW5: furniture over a stair of this level. Dashed outline, hatched shared area and a «!» mark, so the conflict
  // does not rely on colour alone; the warning text is in #levelConflicts and in «Plantas…».
  for(const c of B.stairConflicts(b,{levelId:A.id})){
   const g=el('g',{class:'level-conflict','data-object':c.objectId,'data-stair':c.stairId,role:'img','aria-label':c.message},stairs);
   el('title',{},g).textContent=c.message;
   el('path',{d:pathOf(c.overlap),class:'level-conflict-area'},g);el('path',{d:pathOf(c.footprint),class:'level-conflict-outline'},g);
   const at=c.overlap.reduce((a,p)=>({x:a.x+p.x/c.overlap.length,y:a.y+p.y/c.overlap.length}),{x:0,y:0});
   el('circle',{cx:at.x,cy:at.y,r:150,class:'level-conflict-mark'},g);el('text',{x:at.x,y:at.y,class:'level-conflict-mark-text','text-anchor':'middle','dominant-baseline':'central'},g).textContent='!';
  }
  drawProposal(stairs,A);
  // Over a conflict highlight the stair texts are repeated on top (visual copy, hidden from assistive technology), so
  // both remain readable; the original text stays in its stair group.
  if(stairs.querySelector('.level-conflict'))for(const label of [...stairs.querySelectorAll('.level-stair-label')]){label.id=`levelStairLabel-${label.closest('[data-stair]').dataset.stair}`;el('use',{href:'#'+label.id,class:'level-stair-label-top','aria-hidden':'true'},stairs);}
 }
 /* ---------- BW5: building-wide diagnosis, guard and guided correction ---------- */
 const keyOf=c=>c.levelId+'|'+c.objectId+'|'+c.stairId;
 function status(b=current()){return b?B.buildingStatus(b):{state:'clear',conflicts:[],unevaluated:[],conflictLevels:0,headline:''};}
 // Chip over the plan (2D and 3D, bottom right, away from the toolbars and the top dimension) with the state of the
 // WHOLE building, and a one-time announcement when a conflict appears (adding, dragging, importing, a new stair).
 function notify(b){
  const box=$('#levelConflicts'),st=status(b),list=st.conflicts;
  if(box){box.hidden=st.state==='clear';box.dataset.state=st.state;box.replaceChildren();
   if(st.state!=='clear'){const t=document.createElement('span');t.className='level-conflicts-full';t.textContent=`⚠ ${st.headline}`;
    const short=document.createElement('span');short.className='level-conflicts-short';short.setAttribute('aria-hidden','true');short.textContent=`⚠ ${st.conflicts.length||st.unevaluated.length}`;box.append(short);
    const more=document.createElement('button');more.type='button';more.className='btn';more.id='levelConflictsOpen';more.textContent='Revisar';more.onclick=()=>openConflicts();box.append(t,' ',more);}}
  const keys=new Set(list.map(keyOf)),fresh=announced?list.filter(c=>!announced.has(keyOf(c))):list;
  if(fresh.length)say(fresh.length===1?fresh[0].message:`${st.headline}. Pulsa «Revisar» para localizarlos.`,7000);
  announced=keys;
 }
 // While a drag is in progress: the same highlight and chip, without announcements (the drop decides).
 function preview(){const b=current();if(!b)return;render2D(b);const keep=announced;notify(b);announced=keep;}
 // Frames a plan footprint in the 2D view.
 function frame(poly){const xs=poly.map(p=>p.x),ys=poly.map(p=>p.y),w=Math.max(800,Math.max(...xs)-Math.min(...xs)),h=Math.max(800,Math.max(...ys)-Math.min(...ys)),cx=(Math.min(...xs)+Math.max(...xs))/2,cy=(Math.min(...ys)+Math.max(...ys))/2;
  view.s=Math.max(.012,Math.min(.25,svg.clientWidth/(w*3),svg.clientHeight/(h*3)));view.x0=cx-svg.clientWidth/2/view.s;view.y0=cy-svg.clientHeight/2/view.s;applyView();}
 // «Localizar»: the level of the conflict becomes active, the 2D plan opens, the furniture is selected and framed.
 async function locate(c){
  closeConflicts();if(typeof viewMode!=='undefined'&&viewMode!=='2d')await setView('2d');
  if(library.activeLevelId()!==c.levelId)selectLevel(c.levelId);
  const fresh=B.stairConflicts(current(),{levelId:c.levelId}).find(x=>x.objectId===c.objectId)||c;
  select({kind:'furn',id:c.objectId});frame(fresh.footprint);
  say(`Seleccionado «${c.objectName}» en «${c.levelName}». Arrástralo fuera de la escalera, o edita la escalera en «Plantas…». Rubik no lo mueve por sí solo.`,9000);
 }
 // 3D: show the conflicting level without the levels above it (it can then be orbited freely).
 function isolate(c){closeConflicts();if(library.activeLevelId()!==c.levelId)selectLevel(c.levelId);lastContext='';window.View3D?.setLevelContext(context(current()),'active');bar(current());
  say(`3D: se muestra «${c.levelName}» sin las plantas superiores. «Ver todas» las vuelve a mostrar.`,7000);}
 function editStair(){closeConflicts();open();const f=$('#levelsDialog .level-stair-form');f?.scrollIntoView({block:'start'});$('#stairX')?.focus();}
 function conflictsDialog(){let d=$('#conflictsDialog');if(d)return d;
  d=document.createElement('dialog');d.id='conflictsDialog';d.className='conflicts-dialog';d.setAttribute('aria-labelledby','conflictsTitle');
  d.innerHTML='<h2 id="conflictsTitle"></h2><p id="conflictsIntro"></p><ul id="conflictsList"></ul><div class="actions"><button type="button" class="btn" id="conflictsClose">Cerrar</button></div>';
  document.body.append(d);d.querySelector('#conflictsClose').onclick=()=>closeConflicts();return d;}
 function closeConflicts(){const d=$('#conflictsDialog');if(d?.open)d.close();}
 function openConflicts(){
  const d=conflictsDialog(),st=status(),in3D=typeof viewMode!=='undefined'&&viewMode==='3d';
  d.querySelector('#conflictsTitle').textContent=st.state==='clear'?'Sin muebles sobre escaleras':st.headline;
  d.querySelector('#conflictsIntro').textContent=st.state==='clear'?'Ningún mueble del edificio pisa una escalera ni un hueco.':'Coherencia del dibujo en planta, no una comprobación normativa. Las medidas son nominales cuando la escala no está confirmada. Para corregirlo: mueve el mueble fuera de la escalera, edita la escalera o cambia el mueble de estancia. Rubik no mueve nada por sí solo.';
  const ul=d.querySelector('#conflictsList');ul.replaceChildren();
  for(const c of st.conflicts){const li=document.createElement('li');li.dataset.object=c.objectId;li.dataset.level=c.levelId;
   const t=document.createElement('p');t.textContent=c.summary;li.append(t);const row=document.createElement('div');row.className='actions';
   const go=document.createElement('button');go.type='button';go.className='btn primary';go.dataset.action='locate';go.textContent='Localizar en el plano 2D';go.onclick=()=>locate(c);row.append(go);
   if(in3D){const iso=document.createElement('button');iso.type='button';iso.className='btn';iso.dataset.action='isolate';iso.textContent='Ver esta planta en 3D';iso.onclick=()=>isolate(c);row.append(iso);}
   const find=document.createElement('button');find.type='button';find.className='btn';find.dataset.action='propose';find.textContent='Buscar sitio libre';find.onclick=()=>propose(c.levelId,[c.objectId]);row.append(find);
   const st2=document.createElement('button');st2.type='button';st2.className='btn';st2.dataset.action='stair';st2.textContent='Editar la escalera';st2.onclick=()=>editStair();row.append(st2);
   li.append(row);ul.append(li);}
  for(const [levelId,list] of Object.entries(Object.groupBy?Object.groupBy(st.conflicts,c=>c.levelId):st.conflicts.reduce((a,c)=>((a[c.levelId]||=[]).push(c),a),{})))if(list.length>1){
   const li=document.createElement('li');li.dataset.level=levelId;const all=document.createElement('button');all.type='button';all.className='btn';all.dataset.action='propose-all';
   all.textContent=`Buscar sitio para los ${list.length} de «${list[0].levelName}»`;all.onclick=()=>propose(levelId,[...new Set(list.map(c=>c.objectId))]);li.append(all);ul.append(li);}
  for(const u of st.unevaluated){const li=document.createElement('li');li.dataset.unevaluated=u.objectId||'';li.textContent=`${u.levelName}: «${u.objectName}» — evidencia insuficiente. ${u.reason}`;ul.append(li);}
  if(!d.open)d.showModal();(d.querySelector('#conflictsList button')||d.querySelector('#conflictsClose')).focus();
 }
 // commit() guard: a change that creates a NEW conflict on the active level is refused (returns the reason).
 function guard(before){
  if(!isBuilding())return null;const b=library.building(),id=library.activeLevelId();let prev;
  try{prev=B.setProject(b,id,JSON.parse(before));}catch{return null;}
  const was=new Set(B.stairConflicts(prev,{levelId:id}).map(keyOf)),now=B.stairConflicts(current(),{levelId:id}).find(c=>!was.has(keyOf(c)));
  return now?`No se ha aplicado el cambio: «${now.objectName}» quedaría sobre ${now.zone==='hueco'?'el hueco de la escalera':'los peldaños'} ${now.stairIndex}. Conserva su última posición válida; colócalo fuera de la escalera.`:null;
 }
 function refused(message){say(message,8000);}
 // Add/duplicate without a demonstrated free place: nothing is added; the reason and the way out are explained.
 function explainPlacement(result,name){
  let d=$('#placementDialog');if(!d){d=document.createElement('dialog');d.id='placementDialog';d.className='conflicts-dialog';d.setAttribute('aria-labelledby','placementTitle');
   d.innerHTML='<h2 id="placementTitle">No se ha añadido el mueble</h2><p id="placementReason"></p><p>Arrástralo desde la biblioteca a otra estancia, o selecciona otra estancia y vuelve a pulsarlo.</p><div class="actions"><button type="button" class="btn primary" id="placementClose">Entendido</button></div>';
   document.body.append(d);d.querySelector('#placementClose').onclick=()=>d.close();}
  d.querySelector('#placementReason').textContent=result.message||`No hay un sitio libre demostrado para «${name}».`;d.dataset.reason=result.reason||'';
  if(!d.open)d.showModal();d.querySelector('#placementClose').focus();
 }
 /* Presentation outputs (presentation, its captures and image ZIP, sheet, image export): while the distribution is
    not clear they are not produced; the person is offered the conflict list instead. 3D inspection and JSON/ZIP
    backups stay available and say the state. Returns true when the output may proceed. */
 function gate(what){const st=status();if(st.state==='clear')return true;
  say(`${what}: ${st.state==='pending'?'la distribución está pendiente':'hay muebles sin evaluar'} (${st.headline}). Corrígelo antes de presentarla como propuesta.`,8000);openConflicts();return false;}
 const pendingNote=()=>{const st=status();return st.state==='clear'?'':` Atención: ${st.headline}.`;};
 /* ---------- «Buscar sitio libre»: proposal with preview; nothing changes until «Aplicar» ---------- */
 let proposal=null;
 const PL=window.FloorPlanPlacement,pt=p=>`(${p.x}, ${p.y})`;
 // Proposals for the given conflicting objects of one level; the preview is drawn in 2D and listed in a panel.
 async function propose(levelId,ids){
  closeConflicts();if(typeof viewMode!=='undefined'&&viewMode!=='2d')await setView('2d');
  if(library.activeLevelId()!==levelId)selectLevel(levelId);
  const b=current(),A=activeLevel(b),before=B.stairConflicts(b,{levelId:A.id}),set=PL.proposeSet(project,ids,{zones:B.stairZonesOf(b,A)});
  proposal={levelId:A.id,levelName:A.name,sig:snap(),set,resolves:Object.fromEntries(before.map(c=>[c.objectId,c.summary]))};
  render();const polys=set.moves.flatMap(m=>{const o=project.objects.find(x=>x.id===m.id);return [T.footprint(o),T.footprint({...o,position:m.to})];}).flat();
  if(polys.length){frame(polys);const panel=$('#relocationPanel'),stage=$('#stage').getBoundingClientRect(),r=panel?.getBoundingClientRect();
   // The panel sits at the top (or, on short screens, at the left) of the plan: the proposal is shifted next to it.
   if(r&&r.height){if(r.height>stage.height*.5)view.x0-=Math.min(r.right-stage.left+12,stage.width*.55)/2/view.s;else view.y0-=Math.min(r.bottom-stage.top+12,stage.height*.45)/2/view.s;applyView();}}
  $('#relocationTitle')?.focus({preventScroll:true});
 }
 function cancelProposal(message){if(!proposal)return;proposal=null;render();if(message)say(message,5000);}
 // Applies the whole proposal as ONE change (one undo step). It is re-validated first; if saving fails, it is undone.
 function applyProposal(){
  if(!proposal||proposal.sig!==snap()){cancelProposal('La propuesta ya no corresponde al plano actual: vuelve a buscar.');return;}
  const {set}=proposal,check=PL.proposeSet(project,set.moves.map(m=>m.id),{zones:stairZoneList()});
  const same=check.valid&&check.moves.length===set.moves.length&&check.moves.every((m,i)=>m.to.x===set.moves[i].to.x&&m.to.y===set.moves[i].to.y);
  if(!same){cancelProposal('La propuesta ya no es válida con el plano actual: no se ha aplicado nada.');return;}
  const before=snap(),undoDepth=undoStack.length;
  for(const m of set.moves){const o=project.objects.find(x=>x.id===m.id);o.position={...m.to};}
  refreshProject();const saved=commit(before);
  const after=current(),left=B.stairConflicts(after,{levelId:proposal.levelId}).filter(c=>set.moves.some(m=>m.id===c.objectId)),bad=set.moves.some(m=>PL.problems(project,project.objects.find(x=>x.id===m.id),{zones:stairZoneList()}).length);
  if(!saved||left.length||bad){
   if(undoStack.length>undoDepth)undoStack.pop();project=JSON.parse(before);refreshProject();save();proposal=null;renderAll();
   say(saved?'No se ha aplicado: la comprobación posterior encontró un conflicto. El plano queda como estaba.':'No se ha podido guardar: no se ha aplicado nada y el plano queda como estaba.',9000);return;}
  proposal=null;renderAll();
  say(`Aplicado: ${set.moves.map(m=>`«${m.name}» ${m.distanceMm} mm`).join(', ')} (medidas nominales). ${status().state==='clear'?'Sin conflictos en el edificio.':status().headline+'.'} «Deshacer» lo revierte en un paso.`,9000);
 }
 function drawProposal(stairs,A){
  if(!proposal||proposal.levelId!==A.id)return;
  for(const m of proposal.set.moves){const o=project.objects.find(x=>x.id===m.id);if(!o)continue;const g=el('g',{class:'level-proposal','data-object':m.id,role:'img','aria-label':`Propuesta: «${m.name}» a ${pt(m.to)}`},stairs);
   el('path',{d:pathOf(T.footprint({...o,position:m.to})),class:'level-proposal-outline'},g);
   el('line',{x1:m.from.x,y1:m.from.y,x2:m.to.x,y2:m.to.y,class:'level-proposal-arrow','marker-end':'url(#levelArrow)'},g);}
 }
 function proposalPanel(){
  let box=$('#relocationPanel');
  if(!proposal){if(box)box.hidden=true;return;}
  if(!box){box=document.createElement('section');box.id='relocationPanel';box.className='relocation-panel';box.setAttribute('role','region');box.setAttribute('aria-label','Propuesta de recolocación');$('#stage').append(box);}
  // Title and actions stay fixed; only the list scrolls, so neither can scroll out of view on short screens.
  box.hidden=false;box.replaceChildren();const {set}=proposal,h=document.createElement('h3');h.id='relocationTitle';h.tabIndex=-1;h.textContent=`Propuesta en «${proposal.levelName}» · vista previa, sin aplicar`;box.setAttribute('aria-labelledby','relocationTitle');box.append(h);
  const body=document.createElement('div');body.className='relocation-body';body.id='relocationBody';box.append(body);
  const ul=document.createElement('ul');for(const m of set.moves){const li=document.createElement('li');li.dataset.object=m.id;li.textContent=`«${m.name}»: de ${pt(m.from)} a ${pt(m.to)} · ${m.distanceMm} mm nominales, dentro de «${m.roomName}». Resuelve: ${proposal.resolves[m.id]||'—'}.`;ul.append(li);}
  for(const f of set.failed){const li=document.createElement('li');li.dataset.failed=f.id;li.textContent=f.message;ul.append(li);}body.append(ul);
  const note=document.createElement('p');note.className='relocation-note';note.textContent=`Comprobado: ${PL.CHECKED.join(', ')}. No comprobado: ${PL.NOT_CHECKED.join(', ')}.`;body.append(note);
  const row=document.createElement('div');row.className='actions';box.append(row);
  // «Aplicar» exists only when there is a valid proposal; otherwise the panel only explains and closes.
  if(set.moves.length&&set.valid){const apply=document.createElement('button');apply.type='button';apply.className='btn primary';apply.id='relocationApply';apply.textContent=set.moves.length>1?`Aplicar las ${set.moves.length}`:'Aplicar';apply.onclick=()=>applyProposal();row.append(apply);}
  const cancel=document.createElement('button');cancel.type='button';cancel.className='btn';cancel.id='relocationCancel';cancel.textContent=set.moves.length?'Cancelar':'Cerrar';cancel.onclick=()=>cancelProposal(set.moves.length?'Propuesta descartada; no ha cambiado nada.':'');
  row.append(cancel);
 }
 // Stair zones of the active level with id and kind, for the placement search.
 function stairZoneList(){const b=current();return b?B.stairZonesOf(b,activeLevel(b)):[];}
 // Stair footprints of the active level in its own frame (the slab void on the arriving level), for 2D labels.
 function stairZones(){const b=current();if(!b)return [];const A=activeLevel(b);return b.stairs.filter(s=>s.fromLevelId===A.id||s.toLevelId===A.id).map(s=>B.toLocal(B.stairFootprint(s),A));}
 function render(){
  if(!library)return;if(historyEntry!==library.activeId())entryChanged();
  if(proposal&&(proposal.sig!==snap()||!isBuilding()||library.activeLevelId()!==proposal.levelId))proposal=null;
  const b=current();bar(b);render2D(b);notify(b);proposalPanel();push3D(b);
  if($('#levelsDialog')?.open)fill();
 }
 /* ---------- dialog ---------- */
 function field(parent,label,id,value,{type='number',min,max,step=1,help}={}){
  const wrap=document.createElement('label');wrap.className='level-field';wrap.textContent=label+' ';const input=document.createElement('input');input.id=id;input.type=type;
  if(type==='number'){input.inputMode='numeric';input.step=String(step);if(min!==undefined)input.min=String(min);if(max!==undefined)input.max=String(max);}
  input.value=String(value);wrap.append(input);if(help){const h=document.createElement('small');h.textContent=' '+help;wrap.append(h);}parent.append(wrap);return input;
 }
 function button(parent,text,id,fn,cls='btn'){const b=document.createElement('button');b.type='button';b.className=cls;b.id=id;b.textContent=text;b.onclick=()=>{dialogError='';try{fn();}catch(e){dialogError=e.message;fill();}};parent.append(b);return b;}
 const int=v=>{const n=Number(v);if(!Number.isFinite(n))throw Error('Introduce números en milímetros.');return Math.round(n);};
 function fill(){
  const box=$('#levelsBody');if(!box)return;box.replaceChildren();const b=current();
  const p=(text,parent=box,cls)=>{const e=document.createElement('p');e.textContent=text;if(cls)e.className=cls;parent.append(e);return e;};
  if(!b){
   p('Este proyecto tiene una planta. Al añadir otra se crea un edificio nuevo en tu colección con este proyecto como «Planta baja»; el proyecto actual no se modifica.');
   const row=document.createElement('div');row.className='actions';box.append(row);
   button(row,'Crear edificio con planta vacía','levelCreateEmpty',()=>createBuilding(null),'btn primary');
   button(row,'Crear edificio con planta desde imagen o PDF…','levelCreateImage',()=>$('#levelImageIn').click());
  }else{
   const A=activeLevel(b);
   p(`Edificio «${b.name}». Cada planta es un proyecto independiente con su propia imagen y escala; el marco del edificio es el de la planta baja.`);
   const list=document.createElement('div');list.className='level-list';box.append(list);
   for(const l of b.levels){
    const card=document.createElement('fieldset');card.className='level-card';card.dataset.level=l.id;const legend=document.createElement('legend');legend.textContent=`${l.order+1}. ${l.name}${l.id===A.id?' — activa':''}`;card.append(legend);list.append(card);
    const name=field(card,'Nombre',`levelName-${l.order}`,l.name,{type:'text'});name.maxLength=80;
    let elev,slab,ox,oy;
    if(l.order>0){elev=field(card,'Elevación del suelo (mm)',`levelElevation-${l.order}`,l.elevationMm,{min:1,max:100000});slab=field(card,'Forjado visual (mm)',`levelSlab-${l.order}`,l.slabThicknessMm,{min:0,max:1000,help:'sin significado estructural'});
     ox=field(card,'Desplazamiento X (mm)',`levelOffsetX-${l.order}`,l.offsetMm.x,{min:-1000000,max:1000000});oy=field(card,'Desplazamiento Y (mm)',`levelOffsetY-${l.order}`,l.offsetMm.y,{min:-1000000,max:1000000});
     const al=B.alignment(b,l.id);p(`Alineación con «${b.levels[l.order-1].name}»: ${al.supported} de ${al.checked} muros tienen un muro debajo (±grosor/2 + 20 mm). Comprobación visual, no estructural.`,card,'level-alignment').dataset.level=l.id;}
    else p('Define el marco del edificio: elevación 0 y sin desplazamiento.',card);
    const conf=l.project.scale.confidence;p(`Escala: ${conf==='real'?'confirmada':conf==='estimated'?'estimada — medidas orientativas':'pendiente de calibrar — medidas orientativas'}.`,card,'level-scale');
    const row=document.createElement('div');row.className='actions';card.append(row);
    button(row,'Aplicar','levelApply-'+l.order,()=>{const patch={name:name.value.trim()};if(l.order>0){patch.elevationMm=int(elev.value);patch.slabThicknessMm=int(slab.value);patch.offsetMm={x:int(ox.value),y:int(oy.value)};}
     persist(B.updateLevel(b,l.id,patch));refreshProject();renderAll();say(`Planta «${patch.name}» actualizada.`);});
    if(l.id!==A.id)button(row,'Editar esta planta','levelOpen-'+l.order,()=>{selectLevel(l.id);fill();});
    button(row,'Exportar esta planta (JSON 1.x)','levelExport-'+l.order,()=>exportLevel(l.id,'json'));
    button(row,'Exportar esta planta (ZIP 1.x)','levelExportZip-'+l.order,()=>exportLevel(l.id,'zip'));
    if(l.order>0)button(row,'Eliminar planta','levelRemove-'+l.order,()=>{if(!confirm(`¿Eliminar «${l.name}» y su escalera del edificio? No se puede deshacer; exporta antes si la necesitas.`))return;const next=B.removeLevel(b,l.id);if(l.id===A.id){selectLevel(b.levels[0].id);}persist(next,{activeLevelId:next.levels[0].id});project=library.project();refreshProject();renderAll();say(`«${l.name}» eliminada.`);},'btn danger');
   }
   if(b.levels.length<B.LIMITS.levels){const row=document.createElement('div');row.className='actions';box.append(row);
    button(row,'Añadir planta vacía','levelAddEmpty',()=>addEmpty(),'btn primary');button(row,'Añadir planta desde imagen o PDF…','levelAddImage',()=>$('#levelImageIn').click());}
   if(b.levels.length>1)stairForm(box,b,A);
   const a=B.areas(b);const sum=p(`Superficie útil: ${a.levels.map(x=>`«${x.name}» ${fmtM2(x.m2)} m²`).join(' · ')} · total ${fmtM2(a.totalM2)} m².`,box,'level-areas');sum.id='levelAreas';
   const w=B.warnings(b);if(w.length){const ul=document.createElement('ul');ul.className='level-warnings';ul.id='levelWarnings';for(const x of w){const li=document.createElement('li');li.dataset.code=x.code;li.textContent=x.message;ul.append(li);}box.append(ul);}
   const ghostLabel=document.createElement('label');ghostLabel.className='level-check';const ghost=document.createElement('input');ghost.type='checkbox';ghost.id='levelGhostToggle';ghost.checked=showGhost;ghost.onchange=()=>{showGhost=ghost.checked;render2D(current());};ghostLabel.append(ghost,' Mostrar atenuada la planta inferior en 2D');box.append(ghostLabel);
   const io=document.createElement('div');io.className='actions';box.append(io);
   button(io,'Exportar edificio (JSON)','buildingExportJson',()=>exportBuildingJson());button(io,'Exportar edificio (ZIP con imágenes)','buildingExportZip',()=>exportBuildingZip());
  }
  const err=$('#levelsError');if(err)err.textContent=dialogError;
 }
 function stairForm(box,b,A){
  const s=b.stairs[0],from=b.levels[0],to=b.levels[1],section=document.createElement('section');section.className='level-stair-form';box.append(section);
  const h=document.createElement('h3');h.textContent='Escalera recta';section.append(h);
  const intro=document.createElement('p');intro.textContent=`De «${from.name}» a «${to.name}». Coordenadas en el marco del edificio (las de «${from.name}»). El arranque es el centro del primer peldaño; el sentido indica hacia dónde se sube.`;section.append(intro);
  const d=s||{startMm:{x:0,y:0},rotationDeg:0,widthMm:900,runLengthMm:Math.max(500,Math.round((to.elevationMm-from.elevationMm)*.85)),risers:Math.max(2,Math.round((to.elevationMm-from.elevationMm)/180))};
  const x=field(section,'Arranque X (mm)','stairX',d.startMm.x),y=field(section,'Arranque Y (mm)','stairY',d.startMm.y),rot=field(section,'Sentido de subida (°, horario)','stairRotation',d.rotationDeg,{min:0,max:359});
  const w=field(section,'Ancho (mm)','stairWidth',d.widthMm,{min:300,max:5000}),run=field(section,'Longitud en planta (mm)','stairRun',d.runLengthMm,{min:500,max:20000}),n=field(section,'Peldaños (contrahuellas)','stairRisers',d.risers,{min:2,max:40});
  const derived=document.createElement('p');derived.id='stairDerived';derived.className='level-derived';section.append(derived);
  // Before saving: the furniture of either level that would sit on this stair (same BW5 computation).
  const clash=document.createElement('p');clash.id='stairConflictsPreview';clash.className='level-derived';clash.setAttribute('aria-live','polite');section.append(clash);
  const preview=()=>{let list;try{list=B.stairConflicts(B.setStair(b,{id:s?.id,fromLevelId:from.id,toLevelId:to.id,startMm:{x:int(x.value),y:int(y.value)},rotationDeg:int(rot.value),widthMm:int(w.value),runLengthMm:int(run.value),risers:int(n.value)}));}catch{clash.textContent='';return;}
   clash.dataset.count=String(list.length);clash.textContent=list.length?`⚠ Quedarían sobre la escalera (BW5): ${list.map(c=>`«${c.objectName}» en «${c.levelName}» (${String(c.penetrationMm).replace('.',',')} mm)`).join('; ')}. Si guardas, la distribución quedará pendiente y cada mueble aparecerá en «Revisar» para corregirlo. Ningún mueble se moverá solo.`:'Ningún mueble queda sobre la huella ni sobre el hueco.';};
  const update=()=>{const rise=to.elevationMm-from.elevationMm,k=Math.max(1,Number(n.value)||1);derived.textContent=`Desnivel ${rise} mm · contrahuella ${(rise/k).toFixed(0)} mm · huella ${((Number(run.value)||0)/k).toFixed(0)} mm. Valores orientativos; no se comprueban contra ninguna normativa.`;};
  for(const i of [n,run])i.oninput=update;update();for(const i of [x,y,rot,w,run,n])i.addEventListener('input',preview);preview();
  const row=document.createElement('div');row.className='actions';section.append(row);
  button(row,'Situar en la estancia seleccionada','stairFromRoom',()=>{
   const sel=ui.sel?.kind==='room'?project.rooms.find(r=>r.id===ui.sel.id):null;if(!sel)throw Error('Selecciona primero una estancia en el plano 2D.');
   const xs=sel.polygon.map(p=>p.x),ys=sel.polygon.map(p=>p.y),c={x:(Math.min(...xs)+Math.max(...xs))/2+A.offsetMm.x,y:(Math.min(...ys)+Math.max(...ys))/2+A.offsetMm.y},r=Number(rot.value)*Math.PI/180,L=Number(run.value)||0;
   x.value=String(Math.round(c.x-Math.cos(r)*L/2));y.value=String(Math.round(c.y-Math.sin(r)*L/2));preview();});
  button(row,s?'Guardar escalera':'Añadir escalera','stairSave',()=>{const next=B.setStair(b,{id:s?.id,fromLevelId:from.id,toLevelId:to.id,startMm:{x:int(x.value),y:int(y.value)},rotationDeg:int(rot.value),widthMm:int(w.value),runLengthMm:int(run.value),risers:int(n.value)});persist(next);renderAll();say(s?'Escalera actualizada.':'Escalera añadida: se dibuja en ambas plantas y abre el forjado de la planta superior.');},'btn primary');
  if(s)button(row,'Eliminar escalera','stairRemove',()=>{persist(B.removeStair(b,s.id));renderAll();say('Escalera eliminada.');},'btn danger');
 }
 function open(){if(!library)return toast('Colección local no disponible; exporta tu proyecto.',6000);dialogError='';fill();$('#levelsDialog').showModal();($('#levelsDialog').querySelector('input,button.primary,button'))?.focus();}
 /* ---------- create / add ---------- */
 // From a single-level project: a NEW building entry; the 1.x entry stays as it is.
 function createBuilding(second,{name}={}){
  if(isBuilding())throw Error('El proyecto abierto ya es un edificio.');
  if(!save())throw Error('No se pudo guardar el proyecto actual.');
  const base=Core.clone(project);base.id=Core.id('prj');
  const entryName=library.list().find(e=>e.id===library.activeId())?.name||project.name,title=`${entryName} · edificio`.slice(0,120);
  let b=B.create(base,{name:title});b=B.addLevel(b,second||blank('Planta primera'),{name:name||'Planta primera'});
  switchProject(library.addBuilding(b,{activeLevelId:b.levels[1].id}));
  say(`Edificio «${title}» creado con 2 plantas. El proyecto «${entryName}» de una planta no ha cambiado.`,6000);fill();return project;
 }
 function addEmpty(){const b=current(),next=B.addLevel(b,blank('Planta primera'));const id=next.levels.at(-1).id;persist(next,{activeLevelId:id});switchLevelAfterAdd(id);}
 function switchLevelAfterAdd(id){histories.set(library.building().levels[0].id,{undo:undoStack.splice(0),redo:redoStack.splice(0)});project=library.setActiveLevel(id);ui.sel=null;refreshProject();renderAll();fitView();say('Planta añadida y abierta. Ajusta su elevación y desplazamiento en «Plantas…».',6000);fill();}
 // Image/PDF/DXF… for a new level reuses the existing upload flow; only the next import transaction is redirected.
 async function addFromFile(file){
  if(!file)return;pendingLevel={sequence:importSequence+1,building:isBuilding()};
  try{await FloorPlanUpload.upload(file);}finally{pendingLevel=null;}
 }
 function adoptImported(visible,next,name,session){
  if(!pendingLevel||session?.sequence!==pendingLevel.sequence)return library.importProject(visible,next,name);
  pendingLevel=null;adoptedLevel=true;Core.validate(next,{strict:true});
  if(!isBuilding()){$('#levelsDialog').open&&$('#levelsDialog').close();project=visible;createBuilding(next,{name:'Planta primera'});return library.project();}
  const b=B.setProject(library.building(),library.activeLevelId(),visible),added=B.addLevel(b,next);const id=added.levels.at(-1).id;
  histories.set(library.activeLevelId(),{undo:undoStack.splice(0),redo:redoStack.splice(0)});library.saveBuilding(added,{activeLevelId:id});
  say('Planta añadida desde el archivo y abierta. Calibra su escala y ajusta su desplazamiento.',6000);return library.project();
 }
 /* ---------- exchange ---------- */
 const fileName=(text,ext)=>(text||'edificio').replace(/[^\p{L}\p{N}_-]+/gu,'-').replace(/^-+|-+$/g,'').slice(0,80)+'.'+ext;
 function exportBuildingJson(){const b=current();download(fileName(b.name,'json'),new Blob([JSON.stringify(b,null,2)],{type:'application/json'}));say('Edificio exportado en JSON (sin bytes de imágenes; usa el ZIP para incluirlas).'+pendingNote());}
 async function bytesOf(im){const blob=await I.get(im.storage?.ref||im.id);return blob?new Uint8Array(await blob.arrayBuffer()):null;}
 async function exportBuildingZip(){try{const b=current(),{entries}=await B.packageEntries(b,im=>bytesOf(im),T.imageInfo);download(fileName(b.name,'zip'),P.zip(entries,{check:B.packagePath}));say('Edificio exportado en ZIP con las imágenes de cada planta.'+pendingNote());}catch(e){dialogError=e.message;fill();toast(e.message,6000);}}
 async function exportLevel(levelId,kind){
  const {project:p,warning}=B.exportLevel(current(),levelId);
  if(kind==='zip'){for(const im of p.sourceImages||[])if(!await I.get(im.storage?.ref||im.id))throw Error('Falta una imagen local de esta planta; exporta el JSON.');download(fileName(p.name,'zip'),await P.encode(p,I.get));}
  else download(fileName(p.name,'json'),new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
  dialogError='';const note=$('#levelsError');if(note)note.textContent=warning;toast(warning,8000);
 }
 // JSON import of a building document (menu «Importar» or «Subir plano»): a new entry; the open one is kept.
 // The building keeps the name it carries; the file name is only a fallback.
 function importBuilding(value,name,operation){
  const b=B.prepare(value);if(!FloorPlanApp.fileImportCurrent(operation))return false;
  switchProject(library.importBuilding(project,b,b.name||name));FloorPlanApp.fileImportCompleted(operation,'project');
  const missing=b.levels.reduce((n,l)=>n+(l.project.sourceImages||[]).length,0);
  say(`Edificio «${library.building().name}» importado con ${b.levels.length} planta(s)${missing?'; las imágenes no viajan en el JSON: usa el ZIP para traerlas':''}.`,7000);return true;
 }
 async function importZip(buffer,name,operation){
  const entries=await P.unzip(buffer,{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']});
  const {building,images}=await B.readEntries(entries,T.imageInfo),pending=[];
  for(const {levelId,image,bytes}of images){const key=Core.id('img'),level=building.levels.find(l=>l.id===levelId),im=level.project.sourceImages.find(x=>x.id===image.id);im.storage={kind:'local-browser',ref:key};pending.push([key,new Blob([bytes],{type:image.mediaType})]);}
  B.validate(building);if(!FloorPlanApp.fileImportCurrent(operation))return false;
  await I.put(pending);
  try{if(!FloorPlanApp.fileImportCurrent(operation)){await I.remove(pending.map(e=>e[0]));return false;}switchProject(library.importBuilding(project,building,building.name||name));FloorPlanApp.fileImportCompleted(operation,'project');}
  catch(e){await I.remove(pending.map(e=>e[0]));throw e;}
  say(`Edificio «${building.name}» importado desde ZIP con ${images.length} imagen(es) verificadas.`,7000);return true;
 }
 $('#levelsBtn').onclick=open;
 $('#levelsClose').onclick=()=>$('#levelsDialog').close();
 $('#levelImageIn').onchange=e=>{const file=e.target.files[0];e.target.value='';if(!file)return;$('#levelsDialog').close();addFromFile(file).catch(err=>toast(err.message,6000));};
 window.FloorPlanBuildingUI={render,propose,applyProposal,cancelProposal,get proposal(){return proposal&&structuredClone(proposal.set.moves);},stairZones,stairZoneList,status,guard,refused,preview,explainPlacement,openConflicts,gate,locate,conflicts(){const b=current();return b?B.stairConflicts(b,{levelId:activeLevel(b).id}):[];},open,takeAdoptedLevel(){const v=adoptedLevel;adoptedLevel=false;return v;},resend(){lastContext='';push3D(current());},selectLevel,entryChanged,adoptImported,importBuilding,importZip,exportBuildingJson,exportBuildingZip,exportLevel,createBuilding,
  get context(){const b=current();if(!b)return null;const A=activeLevel(b);return {buildingId:b.id,buildingName:b.name,levelId:A.id,levelName:A.name,order:A.order,levels:b.levels.length};},
  get histories(){return histories;}};
 render();
})();
