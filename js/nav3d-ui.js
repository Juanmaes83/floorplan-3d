/* NAV3D V1 · Navegación 3D profesional (Ola 2 · corte 2a). Panel del escenario 3D y minimapa del paseo.
   · Una sola fuente de verdad: el estado lo dan View3D.navState y building-ui; el panel lo lee (sondeo ligero mientras
     se ve el 3D) y nunca guarda una copia propia que pueda contradecirlos. Las acciones son las existentes:
     modos → View3D.setNavMode (el mismo setMode de «Explorar»), cubierta/encuadres/muebles/cortes → los mismos botones
     de la barra, plantas → FloorPlanBuildingUI.selectLevel, estancias → View3D.focusRoom (flyToRoom / walkToRoom).
   · Nada se escribe en el proyecto, el historial ni el almacenamiento: maqueta blanca y puertas son de la visita.
   · Minimapa del paseo (UX-22): el plano de la planta activa se dibuja una vez por geometría (FloorPlanPresentationCore
     .minimap, el mismo del minimapa de la Presentación); con cada paso solo se mueve el marcador. Sirve al paseo del 3D
     normal y al paseo iniciado desde la Presentación (que oculta su propio minimapa mientras se camina). */
(function(){
 'use strict';
 const C=window.RubikNav3DCore,V=()=>window.View3D,NS='http://www.w3.org/2000/svg';
 if(!C)return;
 const lang=()=>{try{return LANG;}catch{return 'es';}};
 const t=(es,en)=>lang()==='en'?en:es;
 const $=s=>document.querySelector(s);
 const stage=$('#stage');if(!stage)return;
 const make=(tag,attrs={},parent,text)=>{const n=document.createElement(tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v);if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 const svg=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent?.append(n);return n;};
 const displayName=room=>{try{return roomDisplay(room);}catch{return room?.name||room?.id;}};

 // ── Panel ────────────────────────────────────────────────────────────────────────────────────────────────────────
 const panel=make('section',{id:'nav3d',class:'nav3d','aria-labelledby':'nav3dToggle',hidden:''},stage);
 const toggle=make('button',{id:'nav3dToggle',type:'button',class:'btn nav3d-toggle','aria-expanded':'false','aria-controls':'nav3dBody'},panel);
 const body=make('div',{id:'nav3dBody',class:'nav3d-body'},panel);
 const row=(label,id)=>{const g=make('div',{class:'nav3d-row',role:'group','aria-labelledby':id},body);make('span',{id,class:'nav3d-label'},g,label);const box=make('div',{class:'nav3d-buttons'},g);return {g,box};};
 const btn=(box,id,attrs={})=>make('button',{id,type:'button',class:'btn chip',...attrs},box);
 const modeRow=row('','nav3dModeLabel');
 const modeBtns={exterior:btn(modeRow.box,'nav3dMode-exterior',{'data-nav-mode':'exterior','aria-pressed':'false'}),interior:btn(modeRow.box,'nav3dMode-interior',{'data-nav-mode':'interior','aria-pressed':'false'}),walk:btn(modeRow.box,'nav3dMode-walk',{'data-nav-mode':'walk','aria-pressed':'false'})};
 const levelRow=row('','nav3dLevelLabel');levelRow.g.hidden=true;
 const roomRow=make('div',{class:'nav3d-row nav3d-room'},body);
 const roomLabel=make('label',{for:'nav3dRoom',class:'nav3d-label',id:'nav3dRoomLabel'},roomRow);
 const roomSelect=make('select',{id:'nav3dRoom'},roomRow);
 const frameRow=row('','nav3dFrameLabel');
 const frameIso=btn(frameRow.box,'nav3dFrame-iso'),frameTop=btn(frameRow.box,'nav3dFrame-top');
 const lookRow=row('','nav3dLookLabel');
 const finishesBtn=btn(lookRow.box,'nav3dFinishes',{'aria-pressed':'true'}),whiteBtn=btn(lookRow.box,'nav3dWhite',{'aria-pressed':'false'}),furnBtn=btn(lookRow.box,'nav3dFurniture',{'aria-pressed':'true'});
 const doorRow=row('','nav3dDoorLabel');
 const doorBtn=btn(doorRow.box,'nav3dDoors');
 const doorInfo=make('p',{id:'nav3dDoorInfo',class:'nav3d-note'},body);
 const collisions=make('p',{id:'nav3dCollisions',class:'nav3d-note'},body);
 const status=make('p',{id:'nav3dStatus',class:'nav3d-status',role:'status','aria-live':'polite'},body);
 let open=matchMedia('(min-width: 1100px) and (min-height: 600px)').matches,userToggled=false;

 // ── Minimapa del paseo ───────────────────────────────────────────────────────────────────────────────────────────
 const map=make('section',{id:'nav3dMap',class:'nav3d-map','aria-labelledby':'nav3dMapToggle',hidden:''},stage);
 const mapToggle=make('button',{id:'nav3dMapToggle',type:'button',class:'btn nav3d-map-toggle','aria-expanded':'true','aria-controls':'nav3dMapPanel'},map);
 const mapPanel=make('div',{id:'nav3dMapPanel',class:'nav3d-map-panel'},map);
 const mapSvg=svg('svg',{id:'nav3dMapSvg',role:'img',preserveAspectRatio:'xMidYMid meet'},mapPanel);
 const roomsG=svg('g',{class:'nav3d-map-rooms'},mapSvg),markerG=svg('g',{id:'nav3dMarker',class:'nav3d-map-marker'},mapSvg);
 const cone=svg('path',{class:'nav3d-map-cone'},markerG),dot=svg('circle',{class:'nav3d-map-dot',cx:0,cy:0},markerG);
 const mapCaption=make('p',{id:'nav3dMapCaption',class:'nav3d-map-caption','aria-live':'polite'},mapPanel);
 let mapOpen=true,mapData=null,mapKey='',lastMarker='';

 // ── Estado derivado (sin copia propia) ───────────────────────────────────────────────────────────────────────────
 let openBeforeWalk=false,groups=[],roomsKey='',levelList=[],busyGoing=false,stateKey='',whiteBeforePresentation=false,lastMode=null;
 function levelsWithRooms(){
  const ctx=window.FloorPlanBuildingUI?.context,project=window.FloorPlanApp?.project;if(!project)return {levels:[],active:null};
  if(!ctx||ctx.levels<2)return {levels:[{levelId:null,name:'',order:0,rooms:roomsOf(project)}],active:null};
  let b=null;try{b=library.building();}catch{}
  if(!b)return {levels:[{levelId:ctx.levelId,name:ctx.levelName,order:ctx.order,rooms:roomsOf(project)}],active:ctx.levelId};
  return {levels:b.levels.map(l=>({levelId:l.id,name:l.name,order:l.order,rooms:roomsOf(l.id===ctx.levelId?project:l.project)})),active:ctx.levelId};
 }
 const roomsOf=p=>(p?.rooms||[]).map(r=>({id:r.id,name:r.name,family:r.family,poly:(r.polygon||[]).map(v=>[v.x,v.y]),src:r}));
 function refreshRooms(){
  const ctx=window.FloorPlanBuildingUI?.context,project=window.FloorPlanApp?.project;
  const k=JSON.stringify([ctx&&[ctx.buildingId,ctx.levelId,ctx.levels],project?.id,project?.rooms?.map(r=>[r.id,r.name,r.family,r.polygon]),lang()]);
  if(k===roomsKey)return false;roomsKey=k;
  const {levels,active}=levelsWithRooms();levelList=levels;
  groups=C.roomGroups({levels:levels.map(l=>({...l,rooms:l.rooms.map(r=>({...r,name:displayName(r.src)}))})),activeLevelId:active,label:r=>r.name});
  roomSelect.replaceChildren();
  make('option',{value:''},roomSelect,t('Ir a una estancia…','Go to a room…'));
  for(const g of groups){const parent=groups.length>1?make('optgroup',{label:g.name+(g.active?t(' (activa)',' (active)'):'')},roomSelect):roomSelect;
   for(const r of g.rooms)make('option',{value:r.key},parent,r.label);}
  levelRow.box.replaceChildren();
  if(levels.length>1){for(const l of [...levels].sort((a,b)=>a.order-b.order)){const b=btn(levelRow.box,'nav3dLevel-'+l.levelId,{'data-level':l.levelId,'aria-pressed':String(l.levelId===active)});b.textContent=l.name;b.onclick=()=>goLevel(l.levelId);}
   const all=btn(levelRow.box,'nav3dLevelAll',{'aria-pressed':String(V()?.levelView==='all')});all.textContent=t('Ver todas','Show all');all.onclick=()=>$('#levelViewAll')?.click();}
  return true;
 }
 function say(text){status.textContent=text||'';}
 const reasonText={'3d-unavailable':t('La vista 3D no está disponible.','The 3D view is not available.'),busy:t('Espera a que termine el movimiento de cámara.','Wait for the camera to settle.'),'no-room':t('Esa estancia ya no está en la planta.','That room is no longer on this level.'),
  'no-free-spot':t('No hay un punto libre dentro de esa estancia para situarte (muros o puertas lo impiden). Prueba la vista interior.','There is no free spot inside that room to stand in (walls or doors are in the way). Try the interior view.')};
 const waitFor=(fn,ms=4000)=>new Promise(res=>{const t0=performance.now();const step=()=>{let ok=false;try{ok=fn();}catch{}if(ok)return res(true);if(performance.now()-t0>ms)return res(false);requestAnimationFrame(step);};step();});
 const settled=()=>{const s=V()?.navState;return !!s&&s.available&&!s.busy;};

 async function goRoom(k){
  const target=C.parseKey(k);if(!target||busyGoing)return;
  const g=groups.find(g=>g.rooms.some(r=>r.key===k)),room=g?.rooms.find(r=>r.key===k);if(!room)return;
  busyGoing=true;sync(true);
  try{
   const ctx=window.FloorPlanBuildingUI?.context;
   if(target.levelId&&ctx&&ctx.levels>1&&ctx.levelId!==target.levelId){
    say(t(`Cambiando a la planta «${g.name}»…`,`Switching to level «${g.name}»…`));
    window.FloorPlanBuildingUI.selectLevel(target.levelId);
    const ready=await waitFor(()=>window.FloorPlanBuildingUI.context?.levelId===target.levelId&&V().renderedGeometry?.rooms?.some(r=>r.id===target.roomId)&&settled());
    if(!ready){say(t('La planta no terminó de prepararse; vuelve a intentarlo.','The level did not finish loading; try again.'));return;}
   }else if(!await waitFor(settled,2500)){say(reasonText.busy);return;}
   const r=V().focusRoom(target.roomId);
   if(!r?.ok){say(reasonText[r?.reason]||reasonText['3d-unavailable']);return;}
   const where=g&&groups.length>1?t(` (${g.name})`,` (${g.name})`):'';
   say(r.how==='walk'?t(`Te hemos situado en «${room.label}»${where}: es un salto de cámara a un punto libre, no un recorrido.`,`You are now in «${room.label}»${where}: a camera jump to a free spot, not a route.`)
    :t(`Encuadre de «${room.label}»${where}.`,`Framing «${room.label}»${where}.`)+(r.roofHidden?t(' Cubierta oculta para ver el interior.',' Roof hidden to see inside.'):''));
  }finally{busyGoing=false;roomSelect.value='';sync(true);}
 }
 async function goLevel(levelId){
  const ctx=window.FloorPlanBuildingUI?.context;if(!ctx||ctx.levelId===levelId||busyGoing)return;
  const walking=V()?.navState?.mode==='walk';busyGoing=true;
  try{
   window.FloorPlanBuildingUI.selectLevel(levelId);
   await waitFor(()=>window.FloorPlanBuildingUI.context?.levelId===levelId&&settled());
   refreshRooms();
   // En el paseo, la persona no se queda dentro de un muro de la otra planta: se la sitúa en la primera estancia libre.
   if(walking){const g=groups.find(g=>g.levelId===levelId);let placed=null;for(const r of g?.rooms||[]){if(V().focusRoom(r.roomId)?.ok){placed=r;break;}}
    say(placed?t(`Planta «${g.name}»: te hemos situado en «${placed.label}» (salto de cámara).`,`Level «${g.name}»: you are now in «${placed.label}» (camera jump).`):t(`Planta «${g?.name}»: no hay un punto libre para el paseo; vuelve a la vista interior.`,`Level «${g?.name}»: no free spot for the walk; go back to the interior view.`));}
   else say(t(`Planta activa: «${window.FloorPlanBuildingUI.context?.levelName}».`,`Active level: «${window.FloorPlanBuildingUI.context?.levelName}».`));
  }finally{busyGoing=false;sync(true);}
 }
 async function goMode(m){
  const s=V()?.navState;if(!s?.available||busyGoing)return;
  const current=C.modeOf(s);if(current===m)return;
  busyGoing=true;
  try{
   if(m==='walk'){V().setNavMode('walk');say(t('Paseo libre a la altura de los ojos. Los muebles no bloquean el paso.','Free walk at eye level. Furniture never blocks you.'));return;}
   if(s.mode==='walk'){V().setNavMode('orbit');await waitFor(settled);}
   const roofOn=!!V().navState.roof;
   if((m==='exterior')!==roofOn){$('#roofToggle')?.click();await waitFor(settled);}
   say(m==='exterior'?t('Vista exterior: el volumen y la cubierta derivada.','Exterior view: the volume and the derived roof.'):t('Vista interior: la vivienda sin cubierta, desde arriba.','Interior view: the home without its roof, from above.'));
  }finally{busyGoing=false;sync(true);}
 }

 toggle.onclick=()=>{open=!open;userToggled=true;sync(true);if(open)modeBtns.walk.focus({preventScroll:true});};
 for(const [m,b] of Object.entries(modeBtns))b.onclick=()=>goMode(m);
 roomSelect.onchange=()=>{if(roomSelect.value)goRoom(roomSelect.value);};
 frameIso.onclick=()=>{$('#vIso')?.click();say(t('Vista general de la vivienda.','Overall view of the home.'));};
 frameTop.onclick=()=>{$('#vTop')?.click();say(t('Vista desde arriba.','View from above.'));};
 finishesBtn.onclick=()=>{V()?.setWhiteModel(false);say(t('Acabados del proyecto.','Project finishes.'));sync(true);};
 whiteBtn.onclick=()=>{if(V()?.setWhiteModel(true))say(t('Maqueta blanca: solo volúmenes, sin acabados. El proyecto no cambia.','White model: volumes only, no finishes. The project does not change.'));sync(true);};
 furnBtn.onclick=()=>{$('#toggles3d [data-t="furn"]')?.click();const on=V()?.navState?.furniture;say(on?t('Mobiliario visible.','Furniture shown.'):t('Mobiliario oculto (no se borra nada). Los muebles nunca bloquean el paseo.','Furniture hidden (nothing is deleted). Furniture never blocks the walk.'));sync(true);};
 doorBtn.onclick=()=>{const s=V()?.navState;const d=C.doors(s?.doors);if(!d.action)return;const r=V().setAllDoors(d.action==='open');
  if(r?.ok)say(d.action==='open'?t(`Puertas abiertas (${r.total}). Solo en esta visita: no cambia el proyecto.`,`Doors opened (${r.total}). This visit only: the project does not change.`):t(`Puertas cerradas (${r.total}). Las puertas cerradas bloquean el paseo.`,`Doors closed (${r.total}). Closed doors block the walk.`));sync(true);};
 mapToggle.onclick=()=>{mapOpen=!mapOpen;lastMarker='';sync(true);};

 // ── Minimapa ─────────────────────────────────────────────────────────────────────────────────────────────────────
 function drawMap(){
  const g=V()?.renderedGeometry,ctx=window.FloorPlanBuildingUI?.context;if(!g)return null;
  const k=[g.rooms?.length,g.rooms?.map(r=>r.id).join(),ctx?.levelId,g.center?.x,g.center?.y].join('|');
  if(k===mapKey&&mapData&&mapData.geometry===g)return mapData;
  const data=window.FloorPlanPresentationCore?.minimap(g,null,null);mapKey=k;
  roomsG.replaceChildren();if(!data){mapData=null;return null;}
  mapSvg.setAttribute('viewBox',data.viewBox.join(' '));
  for(const r of data.rooms)svg('polygon',{points:r.poly.map(p=>p.join(',')).join(' '),'data-room-id':r.id,class:'nav3d-map-room'},roomsG);
  const s=Math.max(data.viewBox[2],data.viewBox[3]),R=s*.022,L=s*.11;
  dot.setAttribute('r',R);cone.setAttribute('d',`M 0 0 L ${L} ${-L*.45} A ${L} ${L} 0 0 1 ${L} ${L*.45} Z`);
  mapData={...data,geometry:g,rooms:data.rooms,size:s};lastMarker='';return mapData;
 }
 function updateMarker(force){
  const data=drawMap();
  const pose=V()?.walkPose?.();
  const m=data?C.marker(pose,data.viewBox,data.rooms):{state:'unknown'};
  const k=JSON.stringify([m.state,Math.round(m.x||0),Math.round(m.y||0),m.angleDeg,m.roomId]);if(!force&&k===lastMarker)return;lastMarker=k;
  const shown=m.state==='ok'||m.state==='between';
  markerG.style.display=shown?'':'none';
  if(shown)markerG.setAttribute('transform',`translate(${m.x} ${m.y}) rotate(${m.angleDeg})`);
  roomsG.querySelectorAll('.nav3d-map-room').forEach(p=>p.classList.toggle('active',p.dataset.roomId===m.roomId));
  markerG.dataset.state=m.state;map.dataset.state=m.state;
  const ctx=window.FloorPlanBuildingUI?.context,lvl=ctx&&ctx.levels>1?`${ctx.levelName} · `:'';
  const room=m.roomId&&data?.rooms.find(r=>r.id===m.roomId);
  mapCaption.textContent=m.state==='ok'?lvl+(room?displayName(window.FloorPlanApp?.project?.rooms.find(r=>r.id===room.id))||room.name:'')
   :m.state==='between'?lvl+t('Entre estancias','Between rooms'):m.state==='outside'?lvl+t('Fuera del plano','Outside the plan'):lvl+t('Posición no disponible','Position unavailable');
 }

 // ── Sincronización con el estado real ───────────────────────────────────────────────────────────────────────────
 function setBtn(b,c,text){b.textContent=text;if(!c)return;b.disabled=!!c.disabled;if('pressed' in c)b.setAttribute('aria-pressed',String(!!c.pressed));b.classList.toggle('on',!!c.pressed);if(c.reason)b.title=c.reason;else b.removeAttribute('title');}
 function sync(force){
  const in3d=window.FloorPlanApp?.viewMode==='3d'&&document.body.classList.contains('m3d'),s=V()?.navState;
  const presenting=document.body.classList.contains('presenting');
  // Presentación: maqueta blanca fuera mientras dura (tiene sus propios materiales); vuelve al acabar si seguía en 3D.
  if(s?.presentation&&s.white){whiteBeforePresentation=true;V().setWhiteModel(false);}
  else if(!s?.presentation&&whiteBeforePresentation&&in3d&&s?.available){whiteBeforePresentation=false;V().setWhiteModel(true);}
  const walking=!!s?.active&&s.available&&s.mode==='walk';
  // Teléfono: la barra inferior fija (#mobileDock) tapaba el centro del joystick y «Salir del paseo» (defecto previo).
  // Mientras se camina se mide cuánto invade el escenario y los dos controles suben lo justo; fuera del paseo, nada.
  if(walking){const dock=document.querySelector('#mobileDock'),r=dock&&getComputedStyle(dock).position==='fixed'?dock.getBoundingClientRect():null,st=(document.querySelector('#view3d')||stage).getBoundingClientRect();
   const clear=r&&r.height&&r.left<st.right&&r.right>st.left&&r.top<st.bottom?Math.max(0,Math.round(st.bottom-r.top+8)):0;/* en horizontal la barra va al lado: no invade */if(stage.style.getPropertyValue('--nav3d-dock-clear')!==clear+'px')stage.style.setProperty('--nav3d-dock-clear',clear+'px');}
  else if(stage.style.getPropertyValue('--nav3d-dock-clear'))stage.style.removeProperty('--nav3d-dock-clear');
  map.hidden=!(in3d&&walking);
  if(!map.hidden){mapToggle.textContent=mapOpen?t('Ocultar plano','Hide map'):t('Mostrar plano','Show map');mapToggle.setAttribute('aria-expanded',String(mapOpen));mapPanel.hidden=!mapOpen;map.classList.toggle('collapsed',!mapOpen);if(mapOpen)updateMarker(force);}
  // Al empezar a caminar el panel se recoge (vista despejada; queda la pastilla para volver a abrirlo) y el minimapa toma
  // el relevo; al volver a la observación se reabre como estaba antes en escritorio.
  if(walking!==(lastMode==='walk')){if(walking){openBeforeWalk=open;open=false;}else if(lastMode==='walk')open=openBeforeWalk;lastMode=walking?'walk':'orbit';}
  const show=in3d&&!presenting;panel.hidden=!show;
  if(!show)return;
  refreshRooms();
  const vm=C.viewModel(s,{lang:lang(),groups,levels:levelList});
  const k=JSON.stringify([vm,open,busyGoing,lang()]);if(!force&&k===stateKey)return;stateKey=k;
  toggle.textContent=(open?'▾ ':'▸ ')+t('Navegación','Navigation');toggle.setAttribute('aria-expanded',String(open));body.hidden=!open;panel.classList.toggle('open',open);
  $('#nav3dModeLabel').textContent=t('Modo','Mode');$('#nav3dLevelLabel').textContent=t('Planta','Level');roomLabel.textContent=t('Estancia','Room');
  $('#nav3dFrameLabel').textContent=t('Encuadre','Framing');$('#nav3dLookLabel').textContent=t('Visualización','Display');$('#nav3dDoorLabel').textContent=t('Puertas','Doors');
  if(!vm.available){for(const b of body.querySelectorAll('button,select'))b.disabled=true;say(vm.reason);return;}
  const c=vm.controls,lock=busyGoing;
  setBtn(modeBtns.exterior,c['mode-exterior'],t('Exterior','Exterior'));setBtn(modeBtns.interior,c['mode-interior'],t('Interior','Interior'));setBtn(modeBtns.walk,c['mode-walk'],t('Paseo','Walk'));
  levelRow.g.hidden=!!c.levels.hidden;
  const ctx=window.FloorPlanBuildingUI?.context;levelRow.box.querySelectorAll('[data-level]').forEach(b=>{const on=b.dataset.level===ctx?.levelId;b.setAttribute('aria-pressed',String(on));b.classList.toggle('on',on);b.disabled=lock||!!s.busy;});
  const all=$('#nav3dLevelAll');if(all){const on=V().levelView==='all';all.setAttribute('aria-pressed',String(on));all.classList.toggle('on',on);all.disabled=lock||!!s.busy;}
  roomSelect.disabled=!!c.rooms.disabled||lock;if(c.rooms.reason)roomSelect.title=c.rooms.reason;else roomSelect.removeAttribute('title');
  setBtn(frameIso,c.frames,t('Vista general','Overall'));setBtn(frameTop,c.frames,t('Desde arriba','From above'));
  setBtn(finishesBtn,c.finishes,t('Acabados','Finishes'));setBtn(whiteBtn,c.white,t('Maqueta blanca','White model'));setBtn(furnBtn,c.furniture,t('Mobiliario','Furniture'));
  const d=vm.doors;setBtn(doorBtn,c.doors,d.action==='close'?t('Cerrar todas las puertas','Close all doors'):t('Abrir todas las puertas','Open all doors'));
  doorInfo.textContent=d.total?t(`${d.open} de ${d.total} abiertas en esta planta · solo en esta visita, no cambia el proyecto.`,`${d.open} of ${d.total} open on this level · this visit only, the project does not change.`):(c.doors.reason||'');
  collisions.textContent=vm.collisions;
  if(lock)for(const b of body.querySelectorAll('button,select'))b.disabled=true;
 }

 // Un solo bucle ligero mientras se ve el 3D: el estado se sondea cada 250 ms y el marcador del paseo ~12 veces/s.
 let raf=0,lastPoll=0,lastMark=0,lastWhite=0,frames=0;
 function loop(now){
  raf=0;frames++;const in3d=document.body.classList.contains('m3d');
  // El bucle sigue vivo aunque un paso falle (un error de un fotograma no debe congelar el panel ni el minimapa).
  try{
  if(now-lastPoll>250){lastPoll=now;sync(false);}
  if(!map.hidden&&mapOpen&&now-lastMark>80){lastMark=now;updateMarker(false);}
  // Mallas que llegan después (modelos de muebles que terminan de cargar): se pasan a blanco al segundo, sin bucles caros.
  if(now-lastWhite>1000){lastWhite=now;if(V()?.navState?.white)V().refreshWhiteModel();}
  }finally{if(in3d)raf=requestAnimationFrame(loop);}
 }
 function wake(){if(!raf)raf=requestAnimationFrame(loop);}
 // Al volver al plano 2D: la maqueta blanca se apaga (estado de la visita); el proyecto no se ha tocado.
 new MutationObserver(()=>{if(document.body.classList.contains('m3d'))wake();else{if(V()?.navState?.white)V().setWhiteModel(false);whiteBeforePresentation=false;userToggled=false;open=matchMedia('(min-width: 1100px) and (min-height: 600px)').matches;sync(true);}})
  .observe(document.body,{attributes:true,attributeFilter:['class']});
 // Al terminar de entrar en el 3D el panel se rellena en el acto (sin esperar al primer fotograma del bucle).
 addEventListener('floorplan-view-ready',()=>{wake();sync(true);});
 addEventListener('floorplan-3d-context-lost',()=>{whiteBeforePresentation=false;sync(true);});
 if(document.body.classList.contains('m3d'))wake();
 window.RubikNav3D={sync:()=>sync(true),get frames(){return frames;},get looping(){return !!raf;},get groups(){return structuredClone(groups);},goRoom,goLevel,goMode,get open(){return open;},setOpen(v){open=!!v;userToggled=true;sync(true);},
  get marker(){return {state:map.dataset.state||null,transform:markerG.getAttribute('transform'),caption:mapCaption.textContent,hidden:map.hidden};}};
})();
