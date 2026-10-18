/* Building (multi-level) editing UI for FloorPlanBuildingV1. The 2D editor, 3D and every single-level tool keep
   working on `project`, which is always the active level's 1.x project; this module switches levels, keeps one
   undo history per level, draws the lower level as a dimmed reference and the stairs, edits building data
   (levels, offsets, stairs) and handles building JSON/ZIP. Classic script: shares the app's globals. */
(function(){
 const B=window.FloorPlanBuilding,P=window.FloorPlanPackage,T=window.FloorPlanTracing,I=window.FloorPlanImages;
 const NS='http://www.w3.org/2000/svg';
 const histories=new Map();let historyEntry=null,pendingLevel=null,adoptedLevel=false,showGhost=true,lastContext='',dialogError='';
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
 function entryChanged(){if(historyEntry!==library?.activeId()){histories.clear();historyEntry=library?.activeId();}lastContext='';}
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
   const label=el('text',{x:start.x+d.x*s.runLengthMm/2+n.x*(w+180),y:start.y+d.y*s.runLengthMm/2+n.y*(w+180),class:'level-stair-label','text-anchor':'middle'},g);
   label.textContent=role==='from'?'Sube':'Hueco de escalera';
  }
 }
 function render(){
  if(!library)return;if(historyEntry!==library.activeId())entryChanged();
  const b=current();bar(b);render2D(b);push3D(b);
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
  const update=()=>{const rise=to.elevationMm-from.elevationMm,k=Math.max(1,Number(n.value)||1);derived.textContent=`Desnivel ${rise} mm · contrahuella ${(rise/k).toFixed(0)} mm · huella ${((Number(run.value)||0)/k).toFixed(0)} mm. Valores orientativos; no se comprueban contra ninguna normativa.`;};
  for(const i of [n,run])i.oninput=update;update();
  const row=document.createElement('div');row.className='actions';section.append(row);
  button(row,'Situar en la estancia seleccionada','stairFromRoom',()=>{
   const sel=ui.sel?.kind==='room'?project.rooms.find(r=>r.id===ui.sel.id):null;if(!sel)throw Error('Selecciona primero una estancia en el plano 2D.');
   const xs=sel.polygon.map(p=>p.x),ys=sel.polygon.map(p=>p.y),c={x:(Math.min(...xs)+Math.max(...xs))/2+A.offsetMm.x,y:(Math.min(...ys)+Math.max(...ys))/2+A.offsetMm.y},r=Number(rot.value)*Math.PI/180,L=Number(run.value)||0;
   x.value=String(Math.round(c.x-Math.cos(r)*L/2));y.value=String(Math.round(c.y-Math.sin(r)*L/2));});
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
 function exportBuildingJson(){const b=current();download(fileName(b.name,'json'),new Blob([JSON.stringify(b,null,2)],{type:'application/json'}));say('Edificio exportado en JSON (sin bytes de imágenes; usa el ZIP para incluirlas).');}
 async function bytesOf(im){const blob=await I.get(im.storage?.ref||im.id);return blob?new Uint8Array(await blob.arrayBuffer()):null;}
 async function exportBuildingZip(){try{const b=current(),{entries}=await B.packageEntries(b,im=>bytesOf(im),T.imageInfo);download(fileName(b.name,'zip'),P.zip(entries,{check:B.packagePath}));say('Edificio exportado en ZIP con las imágenes de cada planta.');}catch(e){dialogError=e.message;fill();toast(e.message,6000);}}
 async function exportLevel(levelId,kind){
  const {project:p,warning}=B.exportLevel(current(),levelId);
  if(kind==='zip'){for(const im of p.sourceImages||[])if(!await I.get(im.storage?.ref||im.id))throw Error('Falta una imagen local de esta planta; exporta el JSON.');download(fileName(p.name,'zip'),await P.encode(p,I.get));}
  else download(fileName(p.name,'json'),new Blob([JSON.stringify(p,null,2)],{type:'application/json'}));
  dialogError='';const note=$('#levelsError');if(note)note.textContent=warning;toast(warning,8000);
 }
 // JSON import of a building document (menu «Importar» or «Subir plano»): a new entry; the open one is kept.
 function importBuilding(value,name,operation){
  const b=B.prepare(value);if(!FloorPlanApp.fileImportCurrent(operation))return false;
  switchProject(library.importBuilding(project,b,name||b.name));FloorPlanApp.fileImportCompleted(operation,'project');
  const missing=b.levels.reduce((n,l)=>n+(l.project.sourceImages||[]).length,0);
  say(`Edificio «${library.building().name}» importado con ${b.levels.length} planta(s)${missing?'; las imágenes no viajan en el JSON: usa el ZIP para traerlas':''}.`,7000);return true;
 }
 async function importZip(buffer,name,operation){
  const entries=await P.unzip(buffer,{check:B.packagePath,required:'building.json',maxEntries:B.MAX_ENTRIES,jsonNames:['building.json','manifest.json']});
  const {building,images}=await B.readEntries(entries,T.imageInfo),pending=[];
  for(const {levelId,image,bytes}of images){const key=Core.id('img'),level=building.levels.find(l=>l.id===levelId),im=level.project.sourceImages.find(x=>x.id===image.id);im.storage={kind:'local-browser',ref:key};pending.push([key,new Blob([bytes],{type:image.mediaType})]);}
  B.validate(building);if(!FloorPlanApp.fileImportCurrent(operation))return false;
  await I.put(pending);
  try{if(!FloorPlanApp.fileImportCurrent(operation)){await I.remove(pending.map(e=>e[0]));return false;}switchProject(library.importBuilding(project,building,name||building.name));FloorPlanApp.fileImportCompleted(operation,'project');}
  catch(e){await I.remove(pending.map(e=>e[0]));throw e;}
  say(`Edificio «${building.name}» importado desde ZIP con ${images.length} imagen(es) verificadas.`,7000);return true;
 }
 $('#levelsBtn').onclick=open;
 $('#levelsClose').onclick=()=>$('#levelsDialog').close();
 $('#levelImageIn').onchange=e=>{const file=e.target.files[0];e.target.value='';if(!file)return;$('#levelsDialog').close();addFromFile(file).catch(err=>toast(err.message,6000));};
 window.FloorPlanBuildingUI={render,open,takeAdoptedLevel(){const v=adoptedLevel;adoptedLevel=false;return v;},resend(){lastContext='';push3D(current());},selectLevel,entryChanged,adoptImported,importBuilding,importZip,exportBuildingJson,exportBuildingZip,exportLevel,createBuilding,
  get context(){const b=current();if(!b)return null;const A=activeLevel(b);return {buildingId:b.id,buildingName:b.name,levelId:A.id,levelName:A.name,order:A.order,levels:b.levels.length};},
  get histories(){return histories;}};
 render();
})();
