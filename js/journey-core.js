/* Next action of the professional's journey (docs/product/journey-orientation-2026-10-21.md §4.1): from the real state
   of the project (rooms, openings, furniture, scale of the reference image), of the building (conflicts that block the
   presentation) and of what was already reviewed or presented for this revision. One primary action at most, and only
   when it is unambiguous; an optional secondary one. Pure: no DOM, no storage, no project mutations. Suggestions open a
   tool; they never change geometry or data. UMD: window.FloorPlanJourney / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanJourney=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const T={
  example:{title:['Estás viendo un ejemplo','You are viewing an example','正在查看示例'],text:['Recórrelo en 3D o crea tu propia vivienda a partir de él. Tus cambios en la copia son tuyos; el ejemplo no cambia.','Walk through it in 3D or create your own home from it. Your copy is yours; the example stays as it is.','在 3D 中浏览，或以它为基础创建自己的住宅。副本归你所有；示例保持不变。']},
  scale:{title:['Ajusta la escala del plano','Set the plan’s scale','设置平面图比例'],text:['Marca dos puntos de una medida que conozcas y escribe su distancia en milímetros.','Mark two points of a known measurement and enter its distance in millimetres.','标记已知尺寸的两个点并输入毫米距离。']},
  verify:{title:['Comprueba la escala con otra medida','Check the scale with another measurement','用另一个尺寸检查比例'],text:['Mide una segunda cota distinta: si coincide, la escala es fiable.','Measure a second, different dimension: if it agrees, the scale is reliable.','测量另一个不同尺寸：若一致，比例可靠。']},
  mismatch:{title:['La segunda medida no coincide','The second measurement does not agree','第二个尺寸不一致'],text:['Difieren más del 2 %. Repite la segunda medida o vuelve a calibrar.','They differ by more than 2%. Repeat the second measurement or calibrate again.','相差超过 2%。请重新测量第二尺寸或重新校准。']},
  confirm:{title:['Las dos medidas coinciden','Both measurements agree','两个尺寸一致'],text:['Confirma la escala para empezar a dibujar las estancias.','Confirm the scale to start drawing the rooms.','确认比例后开始绘制房间。']},
  trace:{title:['Dibuja las estancias sobre el plano','Draw the rooms over the plan','在平面图上绘制房间'],text:['Toca las esquinas de una estancia y ciérrala tocando el primer punto.','Tap the corners of a room and close it by tapping the first point.','点击房间各角，再点击第一个点闭合。']},
  empty:{title:['Crea la primera estancia','Create the first room','创建第一个房间'],text:['Empieza en el plano: «Crear primera estancia».','Start on the plan: “Create first room”.','从平面图开始：“创建第一个房间”。']},
  conflicts:{title:['Resuelve los conflictos del edificio','Resolve the building conflicts','解决建筑冲突'],text:['{headline}. Mientras sigan, no se puede presentar la vivienda.','{headline}. While they remain, the home cannot be presented.','{headline}。存在冲突时无法展示住宅。']},
  openings:{title:['Añade puertas y ventanas','Add doors and windows','添加门窗'],text:['Elige el tipo, toca la estancia y después el muro donde va.','Choose the type, tap the room and then the wall it goes in.','选择类型，点击房间，再点击所在墙体。']},
  furnish:{title:['Amuebla las estancias','Furnish the rooms','布置房间'],text:['{n} sin muebles. Busca un mueble y púlsalo para colocarlo en la estancia seleccionada.','{n} without furniture. Find an item and press it to place it in the selected room.','{n} 没有家具。搜索家具并点击，放入所选房间。']},
  review:{title:['Revisa la vivienda en 3D','Review the home in 3D','在 3D 中检查住宅'],text:['Comprueba huecos y muebles antes de presentarla.','Check openings and furniture before presenting it.','展示前检查门窗和家具。']},
  reviewing:{title:['Estás revisando la vivienda en 3D','You are reviewing the home in 3D','正在 3D 中检查住宅'],text:['Cuando termines, vuelve al plano 2D o presenta la vivienda.','When you finish, go back to the 2D plan or present the home.','完成后返回 2D 平面图或展示住宅。']},
  present:{title:['Presenta la vivienda','Present the home','展示住宅'],text:['Prepara el recorrido para tu cliente; puedes firmarlo con tu marca y descargar las vistas.','Prepare the tour for your client; you can sign it with your brand and download the views.','为客户准备导览；可署上你的品牌并下载视图。']},
  done:{title:['Entrega preparada','Delivery ready','交付已准备'],text:['Presentaste esta versión. Si cambias el plano, revísala y preséntala de nuevo.','You presented this version. If you change the plan, review and present it again.','已展示此版本。如修改平面图，请重新检查并展示。']}};
 const L={view3d:['Ver en 3D','View in 3D','在 3D 中查看'],copy:['Crear mi copia','Create my copy','创建副本'],calibrate:['Empezar a calibrar','Start calibrating','开始校准'],verify:['Medir segunda cota','Measure second dimension','测量第二尺寸'],reverify:['Repetir segunda cota','Repeat second dimension','重新测量第二尺寸'],recalibrate:['Volver a calibrar','Calibrate again','重新校准'],confirm:['Confirmar escala','Confirm scale','确认比例'],trace:['Dibujar estancia','Draw a room','绘制房间'],conflicts:['Ver conflictos','See conflicts','查看冲突'],openings:['Añadir puertas y ventanas','Add doors and windows','添加门窗'],room:['Otra estancia','Another room','再加一个房间'],furnish:['Amueblar','Furnish','布置家具'],opening:['Otra puerta o ventana','Another door or window','再加门窗'],keepFurnishing:['Seguir amueblando','Keep furnishing','继续布置'],present:['Presentar mi vivienda','Present my home','展示我的住宅'],plan2d:['Volver al plano 2D','Back to the 2D plan','返回 2D 平面图'],exportCopy:['Exportar copia del proyecto','Export a project copy','导出项目副本'],later:['Ahora no','Not now','暂不']};
 // Rules that can be put off for this project with «Ahora no» (stored by the guide in the browser, never in the project).
 const SKIPPABLE=['openings','furnish','review'];
 function pointInPolygon(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>pt.y)!==(b.y>pt.y)&&pt.x<(b.x-a.x)*(pt.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
 const area=poly=>Math.abs(poly.reduce((v,a,i)=>{const b=poly[(i+1)%poly.length];return v+a.x*b.y-b.x*a.y;},0))/2;
 const realRooms=p=>(p.rooms||[]).filter(r=>r.polygon?.length>=3&&area(r.polygon)>0);
 // Scale of the reference image: none → calibrated → (discrepant | consistent) → confirmed. Mirrors guide-core's check.
 function scaleState(p){
  const c=p.scale?.calibration,v=p.scale?.verification,im=p.sourceImages?.find(i=>i.id===c?.sourceImageId);
  if(!c||!im)return 'none';
  if(v?.sourceImageId===im.id&&v.status==='consistent'&&c.confirmedByUser&&p.scale.confidence==='real'&&im.placement?.mmPerPixel===c.mmPerPixel)return 'confirmed';
  if(v?.sourceImageId===im.id&&v.status==='discrepant')return 'discrepant';
  if(v?.sourceImageId===im.id&&v.status==='consistent')return 'consistent';
  return 'calibrated';
 }
 function roomsWithoutFurniture(p){const rooms=realRooms(p);return rooms.filter(r=>!(p.objects||[]).some(o=>o.position&&pointInPolygon(o.position,r.polygon)));}
 /* input: {project, kind:'own'|'example', revision, evidence:{view3d,present}, skipped:[ids], view:'2d'|'3d',
    imagesReady, building:{state, headline}}. Returns {id, title, text, primary|null, secondary|null, skippable}. */
 function next(input){
  const p=input.project,ev=input.evidence||{},rev=input.revision,skipped=new Set(input.skipped||[]),b=input.building||{state:'clear'};
  const make=(id,primary,secondary,vars={})=>({id,title:T[id].title,text:T[id].text.map((s,i)=>s.replace('{headline}',vars.headline||'').replace('{n}',vars.n?vars.n[i]:'')),primary:primary?{id:primary,label:L[primary]}:null,secondary:secondary?{id:secondary,label:L[secondary]}:null,skippable:SKIPPABLE.includes(id),later:SKIPPABLE.includes(id)?{id:'later',label:L.later}:null});
  const reviewed=ev.view3d===rev,presented=ev.present===rev,in3d=input.view==='3d';
  // The example line of the guide already offers the copy while 3D is the next step; the copy becomes the action after.
  if(input.kind==='example')return in3d||reviewed?make('example','copy',null):make('example','view3d',null);
  const hasImage=!!p.sourceImages?.length,rooms=realRooms(p);
  if(hasImage&&!rooms.length){const s=scaleState(p);
   if(s==='none')return make('scale','calibrate');
   if(s==='calibrated')return make('verify','verify');
   if(s==='discrepant')return make('mismatch','reverify','recalibrate');
   if(s==='consistent')return make('confirm','confirm');
   return make('trace','trace');}
  if(!rooms.length)return make('empty',null,null);
  if(b.state&&b.state!=='clear'&&b.headline)return make('conflicts','conflicts',null,{headline:b.headline});
  if(!(p.openings||[]).length&&!skipped.has('openings'))return make('openings','openings','room');
  const empty=roomsWithoutFurniture(p);
  if(!(p.objects||[]).length&&!skipped.has('furnish'))return make('furnish','furnish','opening',{n:countRooms(empty.length)});
  if(!reviewed&&!skipped.has('review'))return in3d?make('reviewing','present','plan2d'):make('review','view3d','keepFurnishing');
  if(!presented)return make('present','present',null);
  return make('done',null,'exportCopy');
 }
 const countRooms=n=>[`${n} ${n===1?'estancia':'estancias'}`,`${n} ${n===1?'room':'rooms'}`,`${n} 个房间`];
 // Localised text of a result (labels are [es,en,zh]); {n} holds per-language variants.
 function text(labels,lang='es'){const i=lang==='en'?1:lang==='zh'?2:0;return labels[i];}
 return {next,scaleState,roomsWithoutFurniture,text,SKIPPABLE,T,L};
});
