/* Creation palette in the left column («Construir» / «Amueblar»), grouped by task. Every action reuses an existing
   implementation and its history: the editor tools (setTool), «+ Estancia» (createRoom, here with a suggested name),
   «Añadir puerta/ventana» from a room (FloorPlanOpeningUI.startAdd, the four contract kinds), wall drawing of
   «Plano propio» (shown with a visible banner and «Terminar» while it is active) and the «Plantas…» dialog for the
   straight stair. Nothing is stored here: a room example only suggests the name; no room type is saved.
   Classic script: shares the app's globals. */
(function(){
 const $=s=>document.querySelector(s),aside=$('aside.lib');
 const KEY='rubik-sota-palette-tab';
 const ICON={
  select:'<path d="M6 4l12 7-5 1.5 3 6-2 1-3-6-4 3z"/>',
  measure:'<path d="M3 15l12-12 6 6-12 12z"/><path d="M8 10l2 2M11 7l2 2M14 4l2 2M5 13l2 2"/>',
  demolish:'<path d="M4 20h16M6 20V9h5v11M13 20v-6h5v6"/><path d="M15 4l5 5M20 4l-5 5"/>',
  room:'<rect x="4" y="5" width="16" height="14" rx="1"/><path d="M4 12h6"/>',
  wall:'<path d="M3 17h18M3 13h18"/><path d="M7 13v4M12 13v4M17 13v4"/>',
  door:'<path d="M5 20V4h8v16"/><path d="M13 20A8 8 0 0 0 5 12"/>',
  'sliding-door':'<path d="M4 20V4h16v16"/><path d="M8 8h6M10 6l-2 2 2 2"/><path d="M12 4v16"/>',
  window:'<rect x="4" y="5" width="16" height="14"/><path d="M12 5v14M4 12h16"/>',
  opening:'<path d="M5 20V6h14v14"/><path d="M5 6l3-2h8l3 2"/>',
  stair:'<path d="M4 20h4v-4h4v-4h4V8h4V4"/>',
  levels:'<path d="M3 9l9-5 9 5-9 5z"/><path d="M3 15l9 5 9-5"/>',
  trace:'<path d="M4 20l4-1 11-11-3-3L5 16z"/><path d="M14 6l3 3"/>'};
 const icon=k=>`<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${ICON[k]||''}</svg>`;
 // Example names: suggestions for the name field of «Nueva estancia», with their visible translation elsewhere.
 // The most common first; the rest stay one tap away under «Más nombres».
 const EXAMPLES=['Salón','Cocina','Dormitorio','Baño','Comedor','Estudio'],MORE=['Dormitorio principal','Aseo','Recibidor','Pasillo','Lavadero','Terraza','Vestidor','Habitación de invitados'];
 const OPENINGS=[['door','Puerta abatible'],['sliding-door','Puerta corredera'],['window','Ventana'],['opening','Hueco de paso']];
 const TOOLS=[['select','Seleccionar','V'],['measure','Medir','M'],['demolish','Modificar muros','X']];
 const el=(tag,attrs={},parent,html)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))if(v!==undefined&&v!==null)n.setAttribute(k,v);if(html!==undefined)n.innerHTML=html;parent?.append(n);return n;};
 const shown=n=>typeof nm==='function'?nm(n):n;

 // Tabs: «Construir» (new) and «Amueblar» (the existing library: search, catalogue and, in 3D, the room list).
 const tabs=el('div',{class:'palette-tabs',role:'tablist','aria-label':'Crear y amueblar'});
 const furnish=el('div',{id:'paletteFurnish',class:'palette-panel',role:'tabpanel','aria-labelledby':'paletteTabFurnish'});
 const build=el('div',{id:'paletteBuild',class:'palette-panel palette-build',role:'tabpanel','aria-labelledby':'paletteTabBuild'});
 for(const n of [...aside.children])furnish.append(n);
 aside.append(tabs,build,furnish);
 const tab=(id,text,panel)=>{const b=el('button',{type:'button',role:'tab',id,class:'palette-tab','aria-controls':panel.id},tabs);b.textContent=text;return b;};
 const tBuild=tab('paletteTabBuild','Construir',build),tFurnish=tab('paletteTabFurnish','Amueblar',furnish);
 function selectTab(which,focus=false){
  const isBuild=which==='build';
  tBuild.setAttribute('aria-selected',String(isBuild));tFurnish.setAttribute('aria-selected',String(!isBuild));
  tBuild.tabIndex=isBuild?0:-1;tFurnish.tabIndex=isBuild?-1:0;build.hidden=!isBuild;furnish.hidden=isBuild;
  try{localStorage.setItem(KEY,which);}catch{}
  if(focus)(isBuild?tBuild:tFurnish).focus();
  if(isBuild)render();
 }
 // When another project opens and it has no rooms, the palette shows «Construir»: there is nothing to furnish yet.
 // Otherwise the last tab chosen is kept (also for the next session).
 let shownProject=null;
 tBuild.onclick=()=>selectTab('build');tFurnish.onclick=()=>selectTab('furnish');
 tabs.addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();selectTab(e.target===tBuild&&e.key!=='Home'?'furnish':'build',true);});

 // Building blocks of the «Construir» panel: a titled group, a grid of icon+label actions and short help.
 const groupOf=(title,help)=>{const g=el('section',{class:'palette-group'},build);el('h4',{},g).textContent=title;if(help){const p=el('p',{class:'palette-help'},g);p.textContent=help;}return g;};
 const action=(parent,{id,icon:ic,label,hint,onclick,cls='palette-action'})=>{const b=el('button',{type:'button',class:`btn ${cls}`,id,title:hint},parent,icon(ic));el('span',{},b).textContent=label;b.onclick=onclick;return b;};
 // Closes the drawer on phones so the plan is visible for the next tap.
 const toPlan=()=>{if(typeof closeDrawers==='function')closeDrawers();};
 const in2D=async()=>{if(typeof is3D==='function'&&is3D())await setView('2d');};

 // The room of the current selection: the room itself, the room a furniture item belongs to, or a room beside a
 // selected opening. Used to add doors and windows without going back to the room first.
 function contextRoom(){
  const sel=typeof ui==='object'?ui.sel:null;if(!sel)return null;
  const has=id=>project.rooms.some(r=>r.id===id);
  if(sel.kind==='room'&&has(sel.id))return sel.id;
  if(sel.kind==='furniture'){const o=project.objects.find(o=>o.id===sel.id);return o?.roomId&&has(o.roomId)?o.roomId:null;}
  if(sel.kind==='opening'){const o=project.openings.find(o=>o.id===sel.id),w=o&&project.walls.find(w=>w.id===o.wallId);if(!w)return null;
   try{const s=FloorPlanOpenings.spanSides(project,w,o.offsetMm,o.offsetMm+o.widthMm);return [s.left.roomId,s.right.roomId].find(id=>id&&has(id))||null;}catch{return null;}}
  return null;
 }

 let toolButtons=[],openingButtons=[],openingContext=null,stairNote=null,mode3d=null,wallBanner=null,wallTimer=null;
 function construct(){
  build.replaceChildren();
  mode3d=el('div',{class:'palette-3d-note',id:'palette3dNote',hidden:''},build);
  el('p',{},mode3d).textContent='Para construir, cambia al plano 2D.';
  action(mode3d,{id:'palettePlan2d',icon:'room',label:'Ir al plano 2D',onclick:()=>setView('2d')});

  const tools=groupOf('Herramientas');const tg=el('div',{class:'palette-grid palette-tools',role:'group','aria-label':'Herramienta activa'},tools);
  toolButtons=TOOLS.map(([t,label,key])=>{const b=action(tg,{id:'paletteTool-'+t,icon:t,label,hint:`${label} (${key})`,onclick:async()=>{await in2D();setTool(t);toPlan();}});b.dataset.tool=t;return b;});

  const rooms=groupOf('Estancias','Crea una estancia rectangular con sus muros. Los ejemplos sólo proponen el nombre; puedes cambiarlo.');
  action(rooms,{id:'paletteNewRoom',icon:'room',label:'Nueva estancia',cls:'palette-action palette-primary',onclick:async()=>{await in2D();FloorPlanRoomUI.createRoom();}});
  const chip=(parent,name)=>{const b=el('button',{type:'button',class:'btn palette-chip','data-room-name':name},parent);b.textContent=name;b.onclick=async()=>{await in2D();FloorPlanRoomUI.createRoom({name:uniqueName(name)});};};
  const ex=el('div',{class:'palette-examples',role:'group','aria-label':'Ejemplos de nombre'},rooms);for(const name of EXAMPLES)chip(ex,name);
  const more=el('details',{class:'palette-more',id:'paletteMoreNames'},rooms);el('summary',{},more).textContent='Más nombres';
  const mx=el('div',{class:'palette-examples',role:'group','aria-label':'Más ejemplos de nombre'},more);for(const name of MORE)chip(mx,name);

  const holes=groupOf('Puertas y ventanas');
  openingContext=el('p',{class:'palette-help',id:'paletteOpeningContext','aria-live':'polite'},holes);
  const og=el('div',{class:'palette-grid',role:'group','aria-label':'Tipos de hueco'},holes);
  openingButtons=OPENINGS.map(([kind,label])=>{const b=action(og,{id:'paletteOpening-'+kind,icon:kind,label,onclick:()=>addOpening(kind,label)});b.dataset.kind=kind;return b;});

  const walls=groupOf('Muros y trazado');const wg=el('div',{class:'palette-grid'},walls);
  action(wg,{id:'paletteWall',icon:'wall',label:'Dibujar muro',hint:'Toca dos extremos por cada muro',onclick:drawWall});
  action(wg,{id:'paletteTrace',icon:'trace',label:'Plano propio',hint:'Imagen de referencia, escala, estancias por vértices y edición',onclick:()=>{$('#traceBtn')?.click();}});

  const lv=groupOf('Plantas y escalera');const lg=el('div',{class:'palette-grid'},lv);
  action(lg,{id:'paletteLevels',icon:'levels',label:'Plantas…',onclick:()=>FloorPlanBuildingUI?.open()});
  action(lg,{id:'paletteStair',icon:'stair',label:'Escalera recta',onclick:openStair});
  stairNote=el('p',{class:'palette-help',id:'paletteStairNote'},lv);

  const tip=el('p',{class:'palette-tip'},build);tip.textContent='Consejo: crea primero las estancias (sus muros se crean con ellas), añade después puertas y ventanas y amuebla en «Amueblar».';
 }
 const uniqueName=name=>{const used=new Set(project.rooms.map(r=>r.name));if(!used.has(name))return name;let i=2;while(used.has(`${name} ${i}`))i++;return `${name} ${i}`;};

 async function addOpening(kind,label){
  const roomId=contextRoom();
  if(!roomId){openingContext.textContent=`Para añadir «${label}», toca antes en el plano la estancia donde va y vuelve a pulsar «${label}».`;openingContext.classList.add('palette-warn');openingContext.focus?.();toPlan();return;}
  // The room becomes the selection first, so the properties column shows the room the opening is added to (as in
  // «Añadir puerta» of the room panel) instead of the previous item.
  await in2D();if(ui.sel?.kind!=='room'||ui.sel.id!==roomId)select({kind:'room',id:roomId});toPlan();FloorPlanOpeningUI.startAdd(roomId,kind);
 }
 async function drawWall(){await in2D();await FloorPlanTraceUI.start('wall');showWallBanner();}
 // Wall drawing stays visible: a banner with what to do and «Terminar», so no hidden mode keeps taking taps.
 function showWallBanner(){
  if(!wallBanner){wallBanner=el('div',{id:'paletteWallBanner',class:'opening-pick-banner',role:'region','aria-label':'Dibujar muro'},$('#stage'));
   const copy=el('div',{class:'opening-pick-copy'},wallBanner);el('strong',{},copy).textContent='Dibujando muros';el('span',{},copy).textContent='Toca dos extremos por cada muro (se ajusta a 45°/90°). Deshacer quita el último.';
   const done=el('button',{type:'button',class:'btn',id:'paletteWallDone'},wallBanner);done.textContent='Terminar';done.onclick=()=>{FloorPlanTraceUI.cancel();hideWallBanner();};}
  wallBanner.hidden=false;$('#paletteWallDone')?.focus({preventScroll:true});
  clearInterval(wallTimer);wallTimer=setInterval(()=>{if(FloorPlanTraceUI.mode?.()!=='wall')hideWallBanner();},250);
 }
 function hideWallBanner(){clearInterval(wallTimer);wallTimer=null;if(wallBanner)wallBanner.hidden=true;}
 function openStair(){
  const ctx=window.FloorPlanBuildingUI?.context;FloorPlanBuildingUI?.open();
  if(ctx?.levels>1)requestAnimationFrame(()=>{const s=$('.level-stair-form');s?.scrollIntoView({block:'start'});$('#stairX')?.focus({preventScroll:true});});
 }
 // Keeps the palette in step with the editor: active tool, 2D/3D, the room that will receive a door or window and
 // whether a stair is possible (two levels).
 function render(){
  if(!toolButtons.length)construct();
  if(shownProject!==project.id){shownProject=project.id;if(!project.rooms.length&&build.hidden)selectTab('build');}
  const three=typeof is3D==='function'&&is3D();mode3d.hidden=!three;
  for(const g of build.querySelectorAll('.palette-group'))g.hidden=three;
  for(const b of toolButtons){const on=ui.tool===b.dataset.tool;b.classList.toggle('on',on);b.setAttribute('aria-pressed',String(on));}
  const roomId=contextRoom(),room=project.rooms.find(r=>r.id===roomId);
  openingContext.classList.remove('palette-warn');
  openingContext.textContent=room?`Se añadirá a «${shown(room.name)}»: toca después uno de sus muros.`:'Toca antes en el plano la estancia donde va el hueco.';
  for(const b of openingButtons)b.setAttribute('aria-describedby','paletteOpeningContext');
  const levels=window.FloorPlanBuildingUI?.context?.levels||1;
  stairNote.textContent=levels>1?'La escalera recta une las dos plantas del edificio.':'La escalera une dos plantas: añade la segunda en «Plantas…».';
 }
 let initial='build';try{initial=localStorage.getItem(KEY)||(project.rooms.length?'furnish':'build');}catch{}
 construct();selectTab(initial==='furnish'?'furnish':'build');
 window.FloorPlanBuildPalette={render,select:selectTab,contextRoom,hideWallBanner,get tab(){return build.hidden?'furnish':'build';}};
})();
