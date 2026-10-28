/* Project orientation and private location; explicit, reversible solar visualization. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Geo=window.FloorPlanGeoProvider,GeoSite=window.FloorPlanGeoSiteAdapter,Solar=window.FloorPlanSolar;
 const geoRegistry=Geo.createDefaultRegistry();
 const t=(es,en,zh)=>({es,en,zh})[LANG]||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const css=el('link',undefined,document.head);css.rel='stylesheet';css.href='css/solar.css';
 let owner=app.entryId,mode='presentation',returnFocus=null;
 const site=()=>app.levelContext?window.FloorPlanBuildingUI.site:app.project.site;
 const now=new Date();let localDate=[now.getFullYear(),String(now.getMonth()+1).padStart(2,'0'),String(now.getDate()).padStart(2,'0')].join('-'),localTime='12:00';
 const entry=el('button','',undefined,'btn');entry.id='solarOpen';entry.type='button';document.querySelector('#exportPng').before(entry);
 const compass=el('button','',document.querySelector('#stage'),'solar-compass only2d');compass.id='solarNorth';compass.type='button';
 const arrow=el('span','↑',compass,'solar-north-arrow');arrow.setAttribute('aria-hidden','true');const compassText=el('span','',compass);
 const bar=el('div',undefined,document.querySelector('#stage'),'solar-preview-bar only3d');bar.hidden=true;
 const barStatus=el('span','',bar);barStatus.id='solarPreviewStatus';
 const edit=el('button','',bar,'btn');edit.type='button';edit.id='solarEdit';
 const leave=el('button','',bar,'btn');leave.type='button';leave.id='solarPresentation';
 const barNote=el('small','',bar,'solar-preview-note');
 const editor3d=el('button','',document.querySelector('#sun').closest('.grp'),'btn');editor3d.id='solarOpen3d';editor3d.type='button';
 const dialog=el('dialog',undefined,document.body,'solar-dialog');dialog.id='solarDialog';dialog.setAttribute('aria-labelledby','solarTitle');
 const form=el('form',undefined,dialog);form.noValidate=true;
 const heading=el('div',undefined,form,'solar-heading');const title=el('h2','',heading);title.id='solarTitle';
 const close=el('button','',heading,'btn');close.type='button';close.id='solarClose';
 const intro=el('p','',form,'solar-intro');
 const fields=el('div',undefined,form,'solar-fields');
 const inputs={};
 function field(id,type,attrs={}){const label=el('label',undefined,fields),text=el('span','',label),input=el('input',undefined,label);input.id=id;input.type=type;Object.assign(input,attrs);inputs[id]={input,text};return input;}
 const north=field('solarNorthInput','number',{min:'0',max:'359.999999',step:'any',placeholder:'—'});
 const lat=field('solarLatitude','number',{min:'-90',max:'90',step:'any',placeholder:'—'});
 const lon=field('solarLongitude','number',{min:'-180',max:'180',step:'any',placeholder:'—'});
 const zone=field('solarTimeZone','text',{placeholder:'Europe/Madrid',maxLength:100});zone.setAttribute('list','solarZones');
 const zones=el('datalist',undefined,form);zones.id='solarZones';for(const z of ['Europe/Madrid','Europe/London','Atlantic/Canary','America/New_York','America/Argentina/Buenos_Aires','Asia/Shanghai','Australia/Sydney','UTC']){const op=el('option',undefined,zones);op.value=z;}
 const shared=el('p','',form,'solar-secondary');
 const privacy=el('p','',form,'solar-secondary');
 const timeFields=el('div',undefined,form,'solar-time-fields');
 const dateLabel=el('label',undefined,timeFields),dateText=el('span','',dateLabel),date=el('input',undefined,dateLabel);date.id='solarDate';date.type='date';date.min='1900-01-01';date.max='2150-12-31';date.value=localDate;
 const timeLabel=el('label',undefined,timeFields),timeText=el('span','',timeLabel),time=el('input',undefined,timeLabel);time.id='solarTime';time.type='time';time.step='60';time.value=localTime;
 const result=el('output','',form,'solar-result');result.id='solarResult';result.setAttribute('aria-live','polite');
 const warning=el('p','',form,'solar-warning');
 const error=el('p','',form,'solar-error');error.id='solarError';error.setAttribute('role','alert');
 const actions=el('div',undefined,form,'solar-actions');
 const saveButton=el('button','',actions,'btn');saveButton.type='submit';saveButton.id='solarSave';
 const activate=el('button','',actions,'btn primary');activate.type='button';activate.id='solarActivate';
 const presentation=el('button','',actions,'btn');presentation.type='button';presentation.id='solarRestore';
 const body=el('div',undefined,undefined,'solar-body');heading.after(body);body.append(intro,fields,shared,privacy,timeFields,result,warning,error);
 function calculation(){const data=site()||{};return Solar.position({...data.location,northOffsetDeg:data.northOffsetDeg,localDate,localTime});}
 function draftCalculation(){return Solar.position({latitude:lat.value===''?undefined:Number(lat.value),longitude:lon.value===''?undefined:Number(lon.value),timeZone:zone.value.trim(),northOffsetDeg:north.value===''?undefined:Number(north.value),localDate,localTime});}
 function reason(value){return ({north:t('Configura el norte para relacionar la vivienda con el sol.','Set north to relate the home to the sun.','请设置北向，以确定住宅与太阳的关系。'),coordinates:t('Configura latitud y longitud.','Set latitude and longitude.','请设置纬度和经度。'),timeZone:t('Introduce una zona horaria IANA válida.','Enter a valid IANA time zone.','请输入有效的 IANA 时区。'),'ambiguous-time':t('Esta hora se repite por el cambio de horario. Elige otra hora.','This time occurs twice at the clock change. Choose another time.','夏令时转换使该时间出现两次，请选择其他时间。'),'nonexistent-time':t('Esta hora no existe por el cambio de horario. Elige otra hora.','This time does not exist at the clock change. Choose another time.','夏令时转换使该时间不存在，请选择其他时间。')})[value]||t('Introduce una fecha y hora válidas (1900–2150).','Enter a valid date and time (1900–2150).','请输入有效日期和时间（1900–2150 年）。');}
 function cardinal(azimuth){return t(['norte','noreste','este','sureste','sur','suroeste','oeste','noroeste'],['north','northeast','east','southeast','south','southwest','west','northwest'],['北','东北','东','东南','南','西南','西','西北'])[Math.round(azimuth/45)%8];}
 function resultText(p){const format=n=>n.toLocaleString(({es:'es-ES',en:'en-GB',zh:'zh-CN'})[LANG],{minimumFractionDigits:1,maximumFractionDigits:1});return p.status!=='available-orientative'?reason(p.reason):(!p.aboveHorizon?t('Sol bajo el horizonte','Sun below the horizon','太阳在地平线以下'):t('Sol desde el ','Sun from the ','太阳来自')+cardinal(p.azimuthDeg))+' · '+t('Azimut','Azimuth','方位角')+' '+format(p.azimuthDeg)+'° · '+t('Elevación','Elevation','高度角')+' '+format(p.altitudeDeg)+'°';}
 function update(){
  const data=site()||{},p=calculation();
  arrow.style.transform='rotate('+(data.northOffsetDeg??0)+'deg)';arrow.hidden=data.northOffsetDeg===undefined;
  compassText.textContent=data.northOffsetDeg===undefined?t('Norte sin configurar','North not set','未设置北向'):'N · '+data.northOffsetDeg+'°';
  compass.title=t('Orientación y solar','Orientation and solar','朝向与日照');
  const draft=dialog.open?draftCalculation():p;
  result.textContent=(dialog.open?t('Vista previa · ','Preview · ','预览 · '):'')+resultText(draft);
  bar.hidden=mode!=='solar';barStatus.textContent=t('Solar orientativo','Indicative solar','日照示意')+' · '+localDate+' · '+localTime+' · '+(p.aboveHorizon?t('Día','Day','白天'):t('Bajo horizonte','Below horizon','地平线以下'));
  document.querySelector('#sun').disabled=mode==='solar';document.querySelector('[data-t="night"]').disabled=mode==='solar';
  document.querySelector('#sun').closest('label').classList.toggle('solar-artistic-hidden',mode==='solar');
  if(mode==='solar'){
   if(p.status==='available-orientative'){if(!window.FloorPlanPresentation?.active)window.View3D?.setSolar(p);}
   else{mode='presentation';window.View3D?.setSolar(null);bar.hidden=true;document.querySelector('#sun').disabled=false;document.querySelector('[data-t="night"]').disabled=false;document.querySelector('#sun').closest('label').classList.remove('solar-artistic-hidden');}
  }
 }
 function sync(){if(owner!==app.entryId){owner=app.entryId;mode='presentation';window.View3D?.setSolar(null);if(dialog.open)dialog.close();}update();}
 function relang(){
  const label=t('Orientación y solar','Orientation and solar','朝向与日照');entry.textContent=editor3d.textContent=title.textContent=label;
  close.textContent=t('Cerrar','Close','关闭');intro.textContent=t('Declara el norte y la ubicación para explorar de dónde vendría el sol.','Declare north and location to explore where sunlight would come from.','设置北向和位置，查看阳光大致来自哪个方向。');
  const labels={solarNorthInput:t('Norte · grados horarios desde arriba del plano','North · degrees clockwise from plan-up','北向 · 从平面图上方向顺时针角度'),solarLatitude:t('Latitud','Latitude','纬度'),solarLongitude:t('Longitud','Longitude','经度'),solarTimeZone:t('Zona horaria IANA','IANA time zone','IANA 时区')};for(const [id,value]of Object.entries(labels))inputs[id].text.textContent=value;
  shared.textContent=app.levelContext?t('Una orientación y ubicación compartidas por todas las plantas.','One orientation and location shared by all levels.','所有楼层共享朝向和位置。'):t('Norte vacío: sin configurar. Ubicación vacía: no disponible.','Empty north: not configured. Empty location: unavailable.','北向为空：未设置。位置为空：不可用。');
  privacy.textContent=t('Datos internos, introducidos por el profesional. No aparecen en imágenes, fichas ni vídeo. Los archivos editables JSON/ZIP sí conservan la ubicación.','Internal data entered by the professional. Images, sheets and video do not show it. Editable JSON/ZIP files retain location.','专业人员输入的内部数据，不显示在图片、明细表或视频中。可编辑的 JSON/ZIP 文件会保留位置。');
  dateText.textContent=t('Fecha','Date','日期');timeText.textContent=t('Hora local del proyecto','Project local time','项目当地时间');
  warning.textContent=t('Visualización solar orientativa basada en los datos introducidos. No constituye un estudio de soleamiento, certificación energética ni verificación normativa.','Indicative solar visualization based on the entered data. It is not a sunlight study, energy certification or regulatory verification.','基于输入数据的日照示意，不构成日照研究、能源认证或法规验证。');
  barNote.textContent=t('Orientativo: no es un estudio de soleamiento, certificación ni verificación normativa.','Indicative: not a sunlight study, certification or regulatory verification.','日照示意，不构成日照研究、认证或法规验证。');
  saveButton.textContent=t('Guardar configuración','Save settings','保存设置');activate.textContent=t('Guardar y ver solar 3D','Save and view solar 3D','保存并查看日照 3D');presentation.textContent=leave.textContent=t('Iluminación de presentación','Presentation lighting','展示照明');edit.textContent=t('Ajustar','Adjust','调整');update();
 }
 function open(){returnFocus=document.activeElement;const data=site()||{};north.value=data.northOffsetDeg??'';lat.value=data.location?.latitude??'';lon.value=data.location?.longitude??'';zone.value=data.location?.timeZone??'';error.textContent='';relang();dialog.showModal();north.focus();}
 async function store(){
  if([north,lat,lon].some(input=>input.validity.badInput))throw Error(t('Introduce números válidos.','Enter valid numbers.','请输入有效数值。'));
  const value=structuredClone(site()||{}),n=north.value.trim();
  if(n===''){if(value.buildingPlacement)throw Error(t('Elimina primero la colocación del edificio para quitar el norte.','Remove building placement before clearing north.','请先移除建筑定位。'));delete value.northOffsetDeg;}else{if(!north.validity.valid||!Number.isFinite(Number(n)))throw Error(t('Norte: usa un valor desde 0 hasta menos de 360°.','North: enter a value from 0 to less than 360°.','北向：请输入 0 至小于 360° 的数值。'));value.northOffsetDeg=Number(n);}
  const parts=[lat.value.trim(),lon.value.trim(),zone.value.trim()];
  if(parts.every(v=>v===''))delete value.location;
  else{if(parts.some(v=>v===''))throw Error(t('Completa latitud, longitud y zona horaria, o vacía los tres campos.','Complete latitude, longitude and time zone, or clear all three.','请填写纬度、经度和时区，或将三项全部清空。'));const normalized=await geoRegistry.getCoordinates('manual',{latitude:Number(parts[0]),longitude:Number(parts[1]),timeZone:parts[2]});if(normalized.status!=='available')throw Error(reason(normalized.reason));
   const previous=value.location;if(!previous||previous.latitude!==normalized.location.latitude||previous.longitude!==normalized.location.longitude||previous.timeZone!==normalized.location.timeZone)value.location=GeoSite.toSiteLocation(normalized);}
  const next=Object.keys(value).length?value:undefined;
  if(JSON.stringify(site())===JSON.stringify(next)){localDate=date.value;localTime=time.value;update();return;}
  if(app.levelContext)window.FloorPlanBuildingUI.setSite(next);
  else{const before=snap();project=Core.setSite(project,next);if(!commit(before))throw Error(t('No se pudo guardar la configuración.','Settings could not be saved.','无法保存设置。'));renderAll();}
  localDate=date.value;localTime=time.value;error.textContent='';update();
 }
 function restore(){mode='presentation';window.View3D?.setSolar(null);update();}
 async function start(){try{const preview=draftCalculation();if(preview.status!=='available-orientative')throw Error(reason(preview.reason));await store();const p=calculation();await app.enterPresentation3D();mode='solar';window.View3D.setSolar(p);update();dialog.close();}catch(e){error.textContent=e.message;}}
 form.onsubmit=async e=>{e.preventDefault();try{await store();error.textContent=t('Configuración guardada.','Settings saved.','设置已保存。');}catch(e){error.textContent=e.message;}};
 activate.onclick=start;presentation.onclick=leave.onclick=restore;
 entry.onclick=()=>{entry.closest('details')?.removeAttribute('open');open();};compass.onclick=editor3d.onclick=edit.onclick=open;
 close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 date.oninput=time.oninput=()=>{localDate=date.value;localTime=time.value;update();};
 north.oninput=lat.oninput=lon.oninput=zone.oninput=update;
 document.querySelector('#langBtn').addEventListener('click',()=>queueMicrotask(relang));
 window.FloorPlanSolarUI={open,sync,restore,get mode(){return mode;},get result(){return calculation();}};
 relang();
})();
