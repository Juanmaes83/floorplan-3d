/* Reversible presentation UI. Plan and progress are local derived state. */
(function(){
 'use strict';
 const Core=FloorPlanPresentationCore,app=FloorPlanApp,tx=(es,en,zh)=>FloorPlanGuide.text([es,en,zh||es],LANG);
 const roomName=name=>typeof nm==='function'?nm(name):name;
 const el=(tag,text,parent,cls)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(cls)node.className=cls;parent?.append(node);return node;};
 const button=(text,parent,fn)=>{const node=el('button',text,parent,'btn');node.type='button';node.onclick=fn;return node;};
 const headerButton=button('',document.querySelector('header'),()=>open());headerButton.id='presentationBtn';headerButton.classList.add('presentation-entry');
 const config=el('dialog',undefined,document.body,'presentation-config');config.id='presentationConfig';config.setAttribute('aria-labelledby','presentationConfigTitle');
 const overlay=el('section',undefined,document.querySelector('#stage'),'presentation-overlay');overlay.id='presentationOverlay';overlay.hidden=true;overlay.setAttribute('aria-label','Presentación de la vivienda');
 const card=el('div',undefined,overlay,'presentation-card');
 const top=el('div',undefined,card,'presentation-card-top');
 const title=el('h2',undefined,top),closeButton=button('',top,()=>stop());closeButton.id='presentationClose';
 const status=el('p',undefined,card,'presentation-status');status.setAttribute('role','status');
 const info=el('p',undefined,card,'presentation-info');
 const controls=el('div',undefined,card,'presentation-controls');
 const previous=button('',controls,()=>go(index-1)),next=button('',controls,()=>go(index+1));
 const stops=el('div',undefined,card,'presentation-stops');
 const select=el('select',undefined,config);select.id='presentationRoom';
 let plan=null,entry=null,sceneState=null,index=0,epoch=0,movement=0,active=false,pendingStart=null,returnFocus=null,stopping=false;
 function sourceCurrent(){return !!plan&&Core.current(plan,app.project.id,app.entryId,FloorPlanGuide.revision(app.project));}
 function draw(){
  headerButton.textContent=tx('Presentar mi vivienda','Present my home','展示我的住宅');
  closeButton.textContent=tx('Volver a editar','Return to editor','返回编辑');
  previous.textContent=tx('← Anterior','← Previous','← 上一个');next.textContent=tx('Siguiente →','Next →','下一个 →');
  if(!plan)return;
  const stop=plan.stops[index];title.textContent=stop.kind==='room'?roomName(stop.label):tx('Vista general','Overview','总览');
  status.textContent=tx(`Vista ${index+1} de ${plan.stops.length}`,`View ${index+1} of ${plan.stops.length}`,`视图 ${index+1} / ${plan.stops.length}`);
  info.textContent=stop.kind==='room'?tx(`Superficie aproximada ${stop.areaM2.toFixed(2)} m² · medidas orientativas`,`Approximate area ${stop.areaM2.toFixed(2)} m² · indicative dimensions`,`约 ${stop.areaM2.toFixed(2)} 平方米 · 仅供参考`):tx('Vista general del proyecto actual','Overview of the current project','当前项目总览');
  previous.disabled=index===0;next.disabled=index===plan.stops.length-1;
  stops.replaceChildren();
  plan.stops.forEach((item,i)=>{const b=button(item.kind==='room'?roomName(item.label):tx('Vista general','Overview','总览'),stops,()=>go(i));b.classList.toggle('on',i===index);b.setAttribute('aria-current',i===index?'step':'false');});
 }
 function open(){
  if(active||pendingStart){closeButton.focus();return;}
  returnFocus=document.activeElement;
  config.replaceChildren();
  const heading=el('h2',tx('Presentar mi vivienda','Present my home','展示我的住宅'),config);heading.id='presentationConfigTitle';
  const possible=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project));
  if(!possible){
   el('p',tx('Primero crea una estancia con muros en Distribuir. El proyecto actual se conserva.','Create a room with walls in Layout first. The current project is kept.','请先在布局中创建带墙的房间。当前项目会保留。'),config);
   const row=el('div',undefined,config,'presentation-config-actions');button(tx('Ir a Distribuir','Go to Layout','前往布局'),row,()=>{config.close();FloorPlanGuideUI?.openDetails('geometry');});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
  }else{
   el('p',tx('Vista general y una estancia real. La presentación no cambia el proyecto ni tu objetivo.','Overview and one real room. The presentation does not change your project or goal.','总览和一个真实房间。展示不会更改项目或目标。'),config);
   const label=el('label',tx('Estancia','Room','房间'),config);
   label.append(select);select.replaceChildren();
   app.geometry.rooms.filter(r=>r.poly.length>=3).forEach(r=>{const option=el('option',roomName(r.name),select);option.value=r.id;});
   const row=el('div',undefined,config,'presentation-config-actions');button(tx('Iniciar presentación','Start presentation','开始展示'),row,()=>{pendingStart=start();pendingStart.finally(()=>{pendingStart=null;});});
   button(tx('Cancelar','Cancel','取消'),row,()=>config.close());
  }
  config.showModal();
  (config.querySelector('select')||config.querySelector('button'))?.focus();
 }
 async function start(){
  const token=++epoch;
  entry=app.capturePresentationEntry();entry.focus=returnFocus;
  plan=Core.create(app.project,app.geometry,app.entryId,FloorPlanGuide.revision(app.project),select.value);
  if(!plan){config.close();return;}
  config.close();overlay.hidden=false;document.body.classList.add('presenting');
  title.textContent=tx('Preparando la escena','Preparing the scene','正在准备场景');
  status.textContent=tx('Cargando geometría 3D…','Loading 3D geometry…','正在加载 3D 几何…');
  info.textContent='';controls.hidden=true;stops.hidden=true;
  try{
   if(!window.View3D||!await app.enterPresentation3D())throw Error(tx('3D no disponible. Puedes seguir editando en 2D.','3D unavailable. You can keep editing in 2D.','3D 不可用。可继续在 2D 编辑。'));
   if(token!==epoch)return;
   if(!sourceCurrent())throw Error(tx('El proyecto cambió. Vuelve a configurar la presentación.','The project changed. Configure the presentation again.','项目已更改。请重新配置展示。'));
   sceneState=View3D.presentationCapture();active=true;index=0;controls.hidden=false;stops.hidden=false;
   history.pushState({...history.state,rubikPresentation:true},'','#presentacion');
   await go(0,token);closeButton.focus();
  }catch(error){
   if(token===epoch){status.textContent=error.message;info.textContent=tx('El plano permanece disponible.','Your plan remains available.','平面图仍可用。');
    toast(error.message,6000);
    document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
    await app.restorePresentationEntry(entry,sceneState);document.body.classList.remove('presentation-exiting');overlay.hidden=true;active=false;returnFocus?.focus?.({preventScroll:true});}
  }
 }
 async function go(target,token=epoch){
  if(!active||target<0||target>=plan.stops.length)return;
  if(!sourceCurrent()){await stop();return;}
  const move=++movement;index=target;draw();overlay.dataset.moving='true';
  try{await View3D.presentationGo(plan.stops[index],matchMedia('(prefers-reduced-motion: reduce)').matches);}catch(error){if(token===epoch){status.textContent=error.message;}}
  finally{if(move===movement)overlay.dataset.moving='false';}
 }
 async function stop(fromPop=false){
  if(stopping||(!entry&&!active&&!pendingStart))return;
  stopping=true;++epoch;
  if(sceneState)View3D?.presentationRestore(sceneState);
  if(pendingStart)await pendingStart.catch(()=>{});
  const saved=entry,three=sceneState;
  active=false;entry=null;sceneState=null;plan=null;
  document.body.classList.remove('presenting');document.body.classList.add('presentation-exiting');
  if(saved)await app.restorePresentationEntry(saved,three);
  overlay.hidden=true;document.body.classList.remove('presentation-exiting');
  if(!fromPop&&location.hash==='#presentacion'){
   const focus=saved?.focus;
   addEventListener('popstate',()=>{if(focus?.isConnected)focus.focus({preventScroll:true});},{once:true});
   history.back();
  }
  stopping=false;
 }
 function onKey(e){
  if(!active&&!pendingStart)return;
  if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();stop();return;}
  if(active&&e.target?.matches?.('input,select,textarea'))return;
  if(e.key==='ArrowRight'||e.key==='ArrowLeft'){
   e.preventDefault();e.stopImmediatePropagation();go(index+(e.key==='ArrowRight'?1:-1));return;
  }
  if(e.key!=='Tab')e.stopImmediatePropagation();
 }
 addEventListener('keydown',onKey,true);
 addEventListener('popstate',()=>{if(active||pendingStart)stop(true);});
 config.addEventListener('close',()=>{if(!active&&!pendingStart)returnFocus?.focus?.({preventScroll:true});});
 draw();
 window.FloorPlanPresentation={open,stop,get active(){return active;},get plan(){return plan;}};
})();
