/* 8C-B: neutral, read-only parcel context. File input never leaves this browser. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,Geo=window.FloorPlanGeoProvider,Parcel=window.FloorPlanParcelCore,Adapter=window.FloorPlanParcelSiteAdapter;
 const registry=Geo.createDefaultRegistry();
 const t=(es,en,zh)=>({es,en,zh})[LANG]||es;
 const el=(tag,parent,text)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;parent?.append(node);return node;};
 const link=el('link',document.head);link.rel='stylesheet';link.href='css/territory.css';
 const entry=el('button');entry.id='territoryOpen';entry.type='button';entry.className='btn';document.querySelector('#solarOpen').before(entry);
 const dialog=el('dialog',document.body);dialog.id='territoryDialog';dialog.className='territory-dialog';dialog.setAttribute('aria-labelledby','territoryTitle');
 const header=el('div',dialog),title=el('h2',header),close=el('button',header);header.className='territory-header';title.id='territoryTitle';close.type='button';close.className='btn';close.id='territoryClose';
 const body=el('div',dialog);body.className='territory-body';
 const intro=el('p',body),providerRow=el('div',body),providerLabel=el('span',providerRow),providerChoice=el('select',providerRow);
 providerRow.className='territory-provider';providerChoice.id='territoryProvider';
 const documentSection=el('section',body),fileLabel=el('label',documentSection),file=el('input',fileLabel),selectLabel=el('label',documentSection),selectRef=el('input',selectLabel),importButton=el('button',documentSection);
 documentSection.id='territoryDocument';file.id='territoryFile';file.type='file';file.accept='.gml,.xml,application/xml,text/xml';selectRef.id='territorySelectReference';selectRef.type='text';selectRef.maxLength=32;importButton.id='territoryImport';importButton.type='button';importButton.className='btn';
 const referenceSection=el('section',body),lookupLabel=el('label',referenceSection),lookup=el('input',lookupLabel),lookupButton=el('button',referenceSection);
 referenceSection.id='territoryReference';lookup.id='territoryLookupReference';lookup.type='text';lookup.maxLength=32;lookupButton.id='territoryLookup';lookupButton.type='button';lookupButton.className='btn';
 const status=el('p',body);status.id='territoryStatus';status.setAttribute('role','status');
 const card=el('section',body),cardTitle=el('h3',card),metadata=el('dl',card),preview=el('div',card),caution=el('p',card);
 card.id='territoryCard';preview.id='territoryPreview';preview.className='territory-preview';caution.className='territory-caution';
 const actions=el('div',dialog),save=el('button',actions),remove=el('button',actions);actions.className='territory-actions';save.id='territorySave';remove.id='territoryRemove';save.type=remove.type='button';save.className='btn primary';remove.className='btn';
 let pending=null,owner=null,busy=false,returnFocus=null;
 const providers=()=>registry.list({capability:'parcel'});
 const site=()=>app.levelContext?window.FloorPlanBuildingUI.site:app.project.site;
 function descriptor(){
  const list=providers();
  const id=list.length===1?list[0].providerId:providerChoice.value;
  return registry.inspect(id);
 }
 function line(label,value){const dt=el('dt',metadata,label),dd=el('dd',metadata,String(value));return [dt,dd];}
 function renderPreview(parcel){
  preview.replaceChildren();
  const local=Parcel.toLocalGeometry(parcel),points=local.polygons.flatMap(p=>p.rings.flat());
  const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
  const pad=Math.max(maxX-minX,maxY-minY)*.07||1000,svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
  svg.setAttribute('viewBox',`${minX-pad} ${minY-pad} ${maxX-minX+2*pad} ${maxY-minY+2*pad}`);
  svg.setAttribute('role','img');svg.setAttribute('aria-label',t('Geometría fuente de la parcela, norte arriba','Source parcel geometry, north up','地块源几何，北朝上'));
  for(const polygon of local.polygons){
   const shape=document.createElementNS('http://www.w3.org/2000/svg','path');
   shape.setAttribute('d',polygon.rings.map(r=>'M '+r.map(([x,y])=>x+' '+y).join(' L ')+' Z').join(' '));
   shape.setAttribute('fill-rule','evenodd');shape.setAttribute('class','territory-shape');svg.append(shape);
  }
  preview.append(svg);
 }
 function render(){
  const current=pending||site()?.parcel,selected=descriptor(),list=providers();
  entry.textContent=t('Contexto territorial','Territorial context','地理背景');title.textContent=entry.textContent;close.textContent=t('Cerrar','Close','关闭');
  intro.textContent=t('Parcela fuente para contexto. No posiciona ni modifica la vivienda.','Source parcel for context. It does not position or change the home.','地块仅作背景，不定位或修改住宅。');
  providerLabel.textContent=t('Fuente','Source','来源');
  providerChoice.replaceChildren();
  if(list.length>1){for(const d of list){const option=el('option',providerChoice,d.label);option.value=d.providerId;}if(selected)providerChoice.value=selected.providerId;}
  else providerLabel.textContent+=list[0]?' · '+list[0].label:' · '+t('No disponible','Unavailable','不可用');
  providerChoice.hidden=list.length<=1;
  const modes=selected?.parcelInputModes||[];
  documentSection.hidden=!modes.includes('document');referenceSection.hidden=!modes.includes('reference');
  fileLabel.firstChild?.nodeType===3?fileLabel.firstChild.textContent=t('Documento GML/XML de parcela','Parcel GML/XML document','地块 GML/XML 文件'):fileLabel.prepend(document.createTextNode(t('Documento GML/XML de parcela','Parcel GML/XML document','地块 GML/XML 文件')));
  selectLabel.firstChild?.nodeType===3?selectLabel.firstChild.textContent=t('Referencia opcional si hay varias parcelas','Optional reference if there are several parcels','多个地块时可填参考号'):selectLabel.prepend(document.createTextNode(t('Referencia opcional si hay varias parcelas','Optional reference if there are several parcels','多个地块时可填参考号')));
  lookupLabel.firstChild?.nodeType===3?lookupLabel.firstChild.textContent=t('Referencia de parcela','Parcel reference','地块参考号'):lookupLabel.prepend(document.createTextNode(t('Referencia de parcela','Parcel reference','地块参考号')));
  importButton.textContent=t('Importar documento','Import document','导入文件');lookupButton.textContent=t('Cargar referencia','Load reference','加载参考号');
  card.hidden=!current;cardTitle.textContent=t('Parcela territorial fuente','Territorial source parcel','地理来源地块');
  metadata.replaceChildren();preview.replaceChildren();
  if(current){
   line(t('Referencia','Reference','参考号'),current.reference);line('CRS',current.sourceCrs);
   line(t('Fuente','Source','来源'),current.source.sourceName||current.source.providerId);
   if(current.source.retrievedAt)line(t('Recuperado','Retrieved','获取时间'),current.source.retrievedAt);
   if(current.source.attribution)line(t('Atribución','Attribution','署名'),current.source.attribution);
   if(current.source.license)line(t('Licencia','License','许可'),[current.source.license.name,current.source.license.status,current.source.license.note].filter(Boolean).join(' · '));
   renderPreview(current);
  }
  caution.textContent=t('Geometría catastral orientativa; no es lindero legal certificado ni posición del edificio. No difundas información original sin revisar la licencia de la fuente.','Indicative cadastral geometry; not a certified legal boundary or building position. Check source terms before sharing original data.','地籍几何仅供参考，不代表法定边界或建筑位置。分享原始数据前请核对来源条款。');
  save.textContent=t('Guardar parcela','Save parcel','保存地块');remove.textContent=t('Eliminar parcela','Remove parcel','删除地块');
  save.disabled=!pending||busy;remove.disabled=!site()?.parcel||busy;importButton.disabled=lookupButton.disabled=busy;
 }
 function message(result){return ({'multiple-parcels-require-selection':t('El GML contiene varias parcelas: indica una referencia.','The GML contains several parcels: enter a reference.','文件含多个地块，请输入参考号。'),'unsupported-source-crs':t('CRS de fuente no soportado.','Source CRS is not supported.','不支持来源坐标系。'),'invalid-source-geometry':t('La geometría de fuente no es válida.','Source geometry is invalid.','来源几何无效。'),'invalid-source-document':t('El GML no es válido o no contiene una parcela INSPIRE CP.','The GML is invalid or has no INSPIRE CP parcel.','GML 无效或缺少 INSPIRE CP 地块。')})[result.reason]||t('No se pudo incorporar la parcela: ','Could not load parcel: ','无法加载地块：')+result.reason;}
 async function run(input){
  const d=descriptor();if(!d){status.textContent=t('No hay fuente de parcela disponible.','No parcel source available.','没有可用的地块来源。');return;}
  busy=true;status.textContent=t('Procesando documento…','Processing document…','正在处理文件…');render();
  try{const result=await registry.getParcel(d.providerId,input);if(result.status!=='available')throw Error(message(result));pending=Adapter.toSiteParcel(result);status.textContent=t('Parcela preparada; guarda para incorporarla al proyecto.','Parcel ready; save to add it to the project.','地块已准备，保存后加入项目。');}
  catch(error){status.textContent=error.message;pending=null;}
  finally{busy=false;render();}
 }
 importButton.onclick=async()=>{const selected=file.files[0];if(!selected){status.textContent=t('Selecciona un GML/XML.','Select a GML/XML file.','请选择 GML/XML 文件。');return;}if(selected.size>Parcel.LIMITS.documentBytes){status.textContent=t('El documento supera el límite local de 2 MB.','Document exceeds the local 2 MB limit.','文件超过本地 2 MB 限制。');return;}await run({mode:'document',text:await selected.text(),...(selectRef.value.trim()?{reference:selectRef.value}:null)});};
 lookupButton.onclick=()=>run({mode:'reference',reference:lookup.value});
 save.onclick=()=>{if(!pending)return;try{app.setSite({...site(),parcel:pending});pending=null;status.textContent=t('Parcela guardada.','Parcel saved.','地块已保存。');render();}catch(error){status.textContent=error.message;}};
 remove.onclick=()=>{try{const next={...site()};delete next.parcel;app.setSite(Object.keys(next).length?next:undefined);pending=null;status.textContent=t('Parcela eliminada.','Parcel removed.','地块已删除。');render();}catch(error){status.textContent=error.message;}};
 providerChoice.onchange=()=>{pending=null;render();};
 function open(){owner=app.entryId;pending=null;status.textContent='';returnFocus=document.activeElement;render();dialog.showModal();close.focus();}
 entry.onclick=open;close.onclick=()=>dialog.close();dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 window.FloorPlanTerritoryUI={open,registry};
 render();
})();
