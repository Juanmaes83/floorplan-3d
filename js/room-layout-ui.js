/* Local design workflow. No pending preview ever mutates the canonical project. */
(function(){
 'use strict';
 const L=FloorPlanRoomLayout,dialog=document.createElement('dialog');dialog.id='roomDesignDialog';dialog.className='room-design';dialog.setAttribute('aria-labelledby','roomDesignTitle');document.body.append(dialog);
 const title=document.createElement('h2');title.id='roomDesignTitle';dialog.append(title);
 const body=document.createElement('div');dialog.append(body);const error=document.createElement('p');error.id='roomDesignError';error.setAttribute('role','alert');dialog.append(error);
 let result,baseline,owner,form,preview,confirmButton,consent,returnFocus;
 function element(tag,text,parent=body){const el=document.createElement(tag);if(text!==undefined)el.textContent=text;parent.append(el);return el;}
 function button(id,text,fn,parent=body){const b=element('button',text,parent);b.id=id;b.type='button';b.className='btn';b.onclick=fn;return b;}
 function input(id,text,value,type='number',parent=form){const label=element('label',text,parent),el=element('input',undefined,label);el.id=id;el.type=type;el.value=value;el.required=true;if(type==='number'){el.step=1;el.inputMode='numeric';}else el.maxLength=120;return el;}
 function selectInput(id,text,options,parent=form){const label=element('label',text,parent),el=element('select',undefined,label);el.id=id;for(const [value,name]of options){const o=element('option',name,el);o.value=value;}return el;}
 function close(){dialog.close();result=null;returnFocus?.focus();}
 function start(name){returnFocus=document.activeElement;dialog.close();body.replaceChildren();error.textContent='';title.textContent=name;result=null;baseline=snap();owner=library?.activeId();dialog.showModal();}
 function actions(){const row=element('div');row.className='actions';button('roomDesignCancel','Cancelar',close,row);const manual=button('roomDesignManual','Trazado manual',()=>{close();if(!$('#tracePanel').hidden)return drawer('panel',true);$('#traceBtn').click();},row);manual.title='Seleccionar/editar permite ajustar vértices y muros';}
 dialog.addEventListener('cancel',()=>{result=null;});
 // Store first; publish canonical state and history only after persistence succeeds.
 function apply(next,roomId){if(snap()!==baseline||library?.activeId()!==owner)throw Error('El proyecto cambió. Cancela y vuelve a preparar la operación.');
  next.updatedAt=new Date(Math.max(Date.now(),Date.parse(next.createdAt))).toISOString();Core.validate(next);storage.setItem(STORE,JSON.stringify(next));window.FloorPlanTraceUI?.cancel();project=next;undoStack.push(baseline);if(undoStack.length>150)undoStack.shift();redoStack.length=0;ui.sel={kind:'room',id:roomId};refreshProject();renderAll();fitView();close();drawer('panel',true);
 }
 function createProject(){
  if(!library)return toast('Colección local no disponible; exporta tu proyecto.',6000);start('Nuevo proyecto');
  element('p','Cada proyecto se guarda por separado en este navegador. Puedes abrir los anteriores en Proyectos.');
  const name=input('newProjectName','Nombre del proyecto','Mi vivienda','text',body);
  const createBlank=button('newProjectBlank','Plano vacío',()=>{try{if(!name.reportValidity())return;const clean=name.value.trim();if(!clean)throw Error('Escribe un nombre.');const next=library.add(L.blank(clean),clean);window.FloorPlanTraceUI?.cancel();project=next;ui.sel=null;ui.mA=ui.mCur=null;undoStack.length=redoStack.length=0;++importSequence;refreshProject();renderAll();fitView();close();createRoom();}catch(e){error.textContent=e.message;}});createBlank.classList.add('primary');
  button('newProjectImage','Desde una imagen',()=>{try{if(!name.reportValidity())return;const clean=name.value.trim();if(!clean||clean.length>120)throw Error('Nombre: entre 1 y 120 caracteres.');close();FloorPlanTraceUI.openImage(true,clean);}catch(e){error.textContent=e.message;}});
  element('p','Imagen PNG, JPG/JPEG o WebP estática · hasta 15 MiB y 8000 px por lado. No se crea otro proyecto si cancelas o la imagen no es válida. Calibra y traza con Plano propio.');button('roomDesignCancel','Cancelar',close);name.focus();
 }
 function setupPreview(){
  preview=element('section');preview.id='roomDesignPreview';preview.setAttribute('aria-label','Vista previa del plano');
  const row=element('div');row.className='actions';const review=button('roomDesignReview','Ver cambio',()=>{},row);review.type='submit';form.append(row);
  confirmButton=button('roomDesignConfirm','Confirmar y guardar',()=>{try{if(!result)throw Error('Revisa la vista previa primero.');if(result.requiresOpenings&&!consent?.checked)throw Error('Confirma explícitamente el movimiento de puertas y ventanas.');apply(result.project,result.roomId);}catch(e){error.textContent=e.message;}});confirmButton.classList.add('primary');confirmButton.disabled=true;actions();
  form.addEventListener('input',invalidate);form.addEventListener('change',invalidate);
 }
 function invalidate(){result=null;confirmButton.disabled=true;preview.replaceChildren();error.textContent='';}
 function show(resultValue){result=resultValue;error.textContent='';preview.replaceChildren();
  element('h3','Antes → después',preview);const svgPreview=document.createElementNS('http://www.w3.org/2000/svg','svg');svgPreview.id='roomDesignSvg';svgPreview.setAttribute('role','img');svgPreview.setAttribute('aria-label','Plano actual en trazo discontinuo; propuesta en trazo continuo.');preview.append(svgPreview);
  const pts=[...project.rooms,...result.project.rooms].flatMap(r=>r.polygon);const xs=pts.map(p=>p.x),ys=pts.map(p=>p.y),x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,pad=Math.max(w,h)*.08+100;svgPreview.setAttribute('viewBox',`${x-pad} ${y-pad} ${w+2*pad} ${h+2*pad}`);
  for(const [rooms,old]of [[project.rooms,true],[result.project.rooms,false]])for(const r of rooms){const poly=document.createElementNS(svgPreview.namespaceURI,'polygon');poly.setAttribute('points',r.polygon.map(p=>`${p.x},${p.y}`).join(' '));poly.setAttribute('fill',old?'none':r.id===result.roomId?'#dbefe5':'#f4eee2');poly.setAttribute('fill-opacity',old?'0':'.65');poly.setAttribute('stroke',old?'#5b5b5b':'#12623d');poly.setAttribute('stroke-width','2');poly.setAttribute('vector-effect','non-scaling-stroke');if(old)poly.setAttribute('stroke-dasharray','8 5');svgPreview.append(poly);if(!old){const text=document.createElementNS(svgPreview.namespaceURI,'text');const xs=r.polygon.map(p=>p.x),ys=r.polygon.map(p=>p.y),b={x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),depth:Math.max(...ys)-Math.min(...ys)};text.setAttribute('x',b.x+b.width/2);text.setAttribute('y',b.y+b.depth/2);text.setAttribute('text-anchor','middle');text.setAttribute('font-size',Math.max(80,Math.min(b.width,b.depth)/12));text.textContent=r.name;svgPreview.append(text);}}
  // Existing furniture stays at its world coordinates; openings show both positions.
  for(const o of project.objects){const rect=document.createElementNS(svgPreview.namespaceURI,'rect');for(const [key,val]of Object.entries({x:-o.size.widthMm/2,y:-o.size.depthMm/2,width:o.size.widthMm,height:o.size.depthMm,fill:'none',stroke:'#525252','stroke-width':1,'vector-effect':'non-scaling-stroke',transform:`translate(${o.position.x} ${o.position.y}) rotate(${o.rotationDeg})`}))rect.setAttribute(key,val);const caption=document.createElementNS(svgPreview.namespaceURI,'title');caption.textContent=`${o.name}: posición y tamaño conservados`;rect.append(caption);svgPreview.append(rect);}
  for(const [p,old]of [[project,true],[result.project,false]])for(const o of p.openings){const w=p.walls.find(w=>w.id===o.wallId),len=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),dx=(w.end.x-w.start.x)/len,dy=(w.end.y-w.start.y)/len,line=document.createElementNS(svgPreview.namespaceURI,'line');for(const [key,val]of Object.entries({x1:w.start.x+dx*o.offsetMm,y1:w.start.y+dy*o.offsetMm,x2:w.start.x+dx*(o.offsetMm+o.widthMm),y2:w.start.y+dy*(o.offsetMm+o.widthMm),stroke:'#68452c','stroke-width':4,'vector-effect':'non-scaling-stroke'}))line.setAttribute(key,val);if(old)line.setAttribute('stroke-dasharray','4 4');svgPreview.append(line);}
  element('p','Discontinuo: antes. Continuo: después. Muebles: contorno gris; huecos: líneas gruesas. La vista principal se conserva hasta confirmar.',preview);const list=element('ul',undefined,preview);for(const line of result.impact)element('li',line,list);
  if(result.requiresOpenings){const label=element('label','Acepto mover los huecos con el muro según el detalle anterior.',preview);consent=element('input',undefined,label);consent.id='roomDesignConsent';consent.type='checkbox';}else consent=null;
  confirmButton.disabled=false;preview.scrollIntoView({block:'nearest'});
 }
 function createRoom(){start('Nueva estancia');element('p',`Proyecto: ${project.name}. Dimensiones interiores de diseño en milímetros; no son una medición profesional.`);form=element('form');form.id='roomDesignForm';
  const name=input('roomDesignName','Nombre de la estancia',`Estancia ${project.rooms.length+1}`,'text'),width=input('roomDesignWidth','Ancho interior (mm)',3000),depth=input('roomDesignDepth','Profundidad interior (mm)',4000);
  width.min=depth.min=100;width.max=depth.max=50000;
  const options=[['','Independiente · posición X/Y'],...project.rooms.filter(r=>{try{L.mapping(project,r);return true;}catch{return false;}}).flatMap(r=>[[`${r.id}:right`,`A la derecha de ${r.name}`],[`${r.id}:bottom`,`Debajo de ${r.name}`]])];
  const placement=selectInput('roomDesignPlacement','Ubicación',options),b=project.rooms.length?project.rooms.flatMap(r=>r.polygon):[],x=input('roomDesignX','Esquina interior izquierda X (mm)',b.length?Math.max(...b.map(p=>p.x))+1000:0),y=input('roomDesignY','Esquina interior superior Y (mm)',0);
  placement.addEventListener('change',()=>{const [id,side]=placement.value.split(':');x.disabled=y.disabled=!!id;if(id){const r=L.rectangle(project.rooms.find(r=>r.id===id));if(side==='right')depth.value=r.depth;else width.value=r.width;}});
  element('p','La unión comparte un muro completo: debe coincidir la dimensión del lado vecino. La otra estancia no cambia.',form);setupPreview();form.onsubmit=e=>{e.preventDefault();try{const [neighborId,side]=placement.value.split(':');show(L.create(project,{name:name.value,width:Number(width.value),depth:Number(depth.value),x:Number(x.value),y:Number(y.value),neighborId,side}));}catch(e){invalidate();error.textContent=e.message;}};name.focus();
 }
 function dimensions(id){start('Dimensiones de la estancia');const r=project.rooms.find(r=>r.id===id);element('p',`Proyecto: ${project.name} · ${r?.name||'Estancia'}. Se cambia una dimensión por operación. Los muebles y la escala no se redimensionan.`);
  try{const b=L.rectangle(r);L.mapping(project,r);element('p',`Medidas actuales: ${b.width} × ${b.depth} mm · ${(b.width*b.depth/1e6).toFixed(2)} m².`);form=element('form');form.id='roomDesignForm';const axis=selectInput('roomDesignAxis','Dimensión',[['width',`Ancho actual: ${b.width} mm`],['depth',`Profundidad actual: ${b.depth} mm`]]),value=input('roomDesignValue','Nueva dimensión interior (mm)',b.width),fixed=selectInput('roomDesignFixed','Lado que permanece fijo',[['','Elige un lado fijo'],['left','Izquierdo'],['right','Derecho']]);value.min=100;value.max=50000;fixed.required=true;
   axis.onchange=()=>{value.value=b[axis.value];fixed.replaceChildren();for(const [v,text]of axis.value==='width'?[['','Elige un lado fijo'],['left','Izquierdo'],['right','Derecho']]:[['','Elige un lado fijo'],['top','Superior'],['bottom','Inferior']]){const o=element('option',text,fixed);o.value=v;}};
   setupPreview();form.onsubmit=e=>{e.preventDefault();try{show(L.resize(project,{roomId:id,axis:axis.value,value:Number(value.value),fixed:fixed.value}));}catch(e){invalidate();error.textContent=e.message;}};value.focus();
  }catch(e){error.textContent=e.message;actions();}
 }
 $('#newProjectBtn').onclick=createProject;$('#newRoomBtn').onclick=createRoom;
 window.FloorPlanRoomUI={dimensions,createRoom,createProject};
})();
