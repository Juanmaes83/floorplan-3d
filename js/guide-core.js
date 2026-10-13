/* Goal/progress and local intent resolution. No DOM, network or project mutations. */
(function(root){
 'use strict';
 const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/g,' ').trim();
 const stages=[['Empezar','Start','开始'],['Preparar','Prepare','准备'],['Distribuir','Layout','布局'],['Amueblar','Furnish','家具'],['Revisar y guardar','Review & save','检查并保存']];
 const goals={save:['Crear y guardar una distribución','Create and save a layout','创建并保存布局'],create:['Crear una distribución','Create a layout','创建布局'],furnish:['Amueblar una estancia','Furnish a room','布置房间'],review:['Revisar una distribución en 3D','Review a layout in 3D','在 3D 中检查布局'],save3d:['Crear y guardar una distribución en 3D','Create and save a 3D layout','创建并保存 3D 布局'],export:['Exportar una imagen de la distribución','Export a layout image','导出布局图片']};
 const text=(labels,lang='es')=>labels[lang==='en'?1:lang==='zh'?2:0];
 // Compare actual document content (not a short hash). Export evidence also includes view/layers.
 const revision=p=>JSON.stringify([p.walls,p.openings,p.rooms,p.objects,p.materials,p.defaults,p.scale,p.sourceImages,p.measurements]);
 const initial=(p,kind='own',origin=p.sourceImages?.length?'image':'blank')=>({version:1,projectId:p.id,kind,origin,goal:kind==='example'?'review':'save3d',current:'geometry',closed:false,skipped:[],completed:[],evidence:{}});
 function geometryReady(p){return p.walls.some(w=>w.status!=='demolished')&&p.rooms.some(r=>r.polygon.length>=3&&Math.abs(r.polygon.reduce((v,a,i)=>{const b=r.polygon[(i+1)%r.polygon.length];return v+a.x*b.y-b.x*a.y;},0))>0);}
 function pointInRoom(pt,poly){let inside=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.y>pt.y)!==(b.y>pt.y)&&pt.x<(b.x-a.x)*(pt.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
 const definitions={
  start:{stage:0,title:['Prepara tu proyecto','Prepare your project','准备项目'],instruction:['Elige un proyecto propio o explora el ejemplo identificado.','Choose your own project or explore the labeled example.','选择自己的项目或浏览标记的示例。'],action:'project'},
  image:{stage:1,title:['Carga la imagen de referencia','Load the reference image','加载参考图片'],instruction:['PNG, JPG o WebP estático · máximo 15 MiB y 8000 px por lado. Después hay que calibrar y dibujar.','Static PNG, JPG or WebP · up to 15 MiB and 8000 px per side. Then calibrate and draw.','静态 PNG、JPG 或 WebP；最大 15 MiB、每边 8000 像素。然后校准并绘图。'],action:'upload'},
  scale:{stage:1,title:['Ajusta y comprueba la escala','Adjust and check the scale','调整并检查比例'],instruction:['Marca dos puntos e introduce su distancia real en mm. Comprueba una segunda cota y confirma la escala.','Mark two points and enter their actual distance in mm. Check a second dimension and confirm the scale.','标记两点并输入实际毫米距离。检查第二个尺寸后确认比例。'],action:'scale'},
  geometry:{stage:2,title:['Crea o revisa las estancias','Create or check the rooms','创建或检查房间'],instruction:['Necesitas al menos una estancia con superficie y muros. Dibuja sobre la imagen o crea una estancia con dimensiones.','You need at least one room with an area and walls. Trace the image or create a room with dimensions.','至少需要一个有面积和墙体的房间。描绘图片或输入房间尺寸。'],action:'geometry'},
  furniture:{stage:3,title:['Coloca muebles en la estancia','Place furniture in the room','在房间内放置家具'],instruction:['Busca un mueble y pulsa para colocarlo en la estancia seleccionada, o arrástralo al plano.','Find an item and click to place it in the selected room, or drag it onto the plan.','搜索家具并点击放入所选房间，或拖入平面图。'],action:'furniture'},
  view3d:{stage:4,title:['Revisa la distribución en 3D','Review the layout in 3D','在 3D 中检查布局'],instruction:['Abre la escena y comprueba la distribución. Si cambia el plano, vuelve a revisar esta versión.','Open the scene and check the layout. If the plan changes, review the new version.','打开场景并检查布局。平面图变更后，请检查新版本。'],action:'3d'},
  save:{stage:4,title:['Guarda tu proyecto','Save your project','保存项目'],instruction:['Confirma el guardado local y exporta una copia para conservarla fuera de este navegador.','Confirm local saving and export a copy to keep outside this browser.','确认本地保存，并导出副本以在浏览器外保存。'],action:'save'},
  export:{stage:4,title:['Exporta una imagen','Export an image','导出图片'],instruction:['Genera un PNG del plano 2D o de la vista 3D actual. La imagen no sustituye al proyecto editable.','Generate a PNG of the 2D plan or current 3D view. The image does not replace the editable project.','生成 2D 平面图或当前 3D 视图的 PNG。图片不能替代可编辑项目。'],action:'export'}
 };
 function evaluate(p,state,facts={}){
  const goal=goals[state.goal]?state.goal:'save3d',rev=revision(p),hasImages=!!p.sourceImages?.length,needsImage=state.origin==='image'||hasImages,geometry=geometryReady(p);
  const rooms=state.targetRoomId?p.rooms.filter(r=>r.id===state.targetRoomId):p.rooms;
  const furniture=p.objects.some(o=>(!state.targetType||o.type===state.targetType)&&rooms.some(r=>pointInRoom(o.position,r.polygon)));
  const imageReady=hasImages&&facts.imagesReady===true;
  const c=p.scale.calibration,v=p.scale.verification,im=p.sourceImages?.find(i=>i.id===c?.sourceImageId);
  const scale=!!(im?.placement&&c?.confirmedByUser&&p.scale.confidence==='real'&&v?.status==='consistent'&&v.sourceImageId===im.id&&im.placement.mmPerPixel===c.mmPerPixel);
  const own=state.kind!=='example',ok={start:own||goal==='review',image:imageReady,scale,geometry,furniture,view3d:geometry&&state.evidence.view3d===rev,save:own&&facts.saved===true,export:geometry&&state.evidence.export===rev};
  const tasks=Object.entries(definitions).filter(([id])=>!['image','scale'].includes(id)||needsImage).map(([id,d])=>{
   const conditional=['image','scale'].includes(id),necessary=!['furniture','view3d','save','export'].includes(id)||id==='furniture'&&goal==='furnish'||id==='view3d'&&['review','save3d'].includes(goal)||id==='save'&&['save3d','save'].includes(goal)||id==='export'&&goal==='export';
   const blockers=[];
   if(!ok.start&&id!=='start')blockers.push('start');
   if(id==='scale'&&!imageReady)blockers.push('image');
   if(id==='geometry'&&needsImage&&!scale)blockers.push('scale');
   if(['furniture','view3d','export'].includes(id)&&!geometry)blockers.push('geometry');
   const complete=ok[id]&&(!necessary||!blockers.length);
   const status=complete?'completed':state.completed.includes(id)?'review':state.current===id?'active':'pending';
   return {id,...d,classification:conditional?'conditional':necessary?'necessary':'optional',necessary,status,blockers,skipped:!necessary&&state.skipped.includes(id)};
  });
  const required=tasks.filter(t=>t.necessary),done=required.filter(t=>t.status==='completed'),optional=tasks.filter(t=>!t.necessary),pending=required.filter(t=>t.status!=='completed');
  const selected=tasks.find(t=>t.id===state.current)||pending[0]||tasks.at(-1);
  return {goal,rev,tasks,required:required.length,done:done.length,percent:Math.round(done.length/required.length*100),optionalDone:optional.filter(t=>t.status==='completed').length,optionalTotal:optional.length,pending,current:selected,stage:selected.stage,finished:pending.length===0};
 }
 const actions={
  upload:{title:['Subir un plano','Upload a floor plan','上传平面图'],description:['PDF, imágenes, DXF, IFC, RoomPlan o proyecto JSON/ZIP. Conversión local y proyecto nuevo; conserva el anterior.','PDF, images, DXF, IFC, RoomPlan or JSON/ZIP. Local conversion into a new project; keeps the previous one.','PDF、图片、DXF、IFC、RoomPlan 或 JSON/ZIP。本地转换为新项目；保留原项目。'],next:['Revisar el plano o calibrar la imagen','Review the plan or calibrate the image','检查平面图或校准图片'],terms:'subir cargar importar imagen foto plano pdf dxf ifc roomplan json zip upload import image photo',goal:'save3d'},
  blank:{title:['Crear desde cero','Create from scratch','从零创建'],description:['Proyecto propio vacío con herramientas de dibujo y dimensiones.','An empty project with drawing and dimension tools.','带有绘图和尺寸工具的空项目。'],next:['Crear la primera estancia','Create the first room','创建第一个房间'],terms:'crear cero nuevo empezar distribucion blank scratch new layout',goal:'create'},
  example:{title:['Probar el ejemplo','Try the example','试用示例'],description:['Explora el Proyecto de ejemplo. Puedes crear una copia propia.','Explore the Example project. You can create your own copy.','浏览示例项目。可创建自己的副本。'],next:['Explorar en 2D o 3D','Explore in 2D or 3D','浏览 2D 或 3D'],terms:'ejemplo demo probar example try'},
  scale:{title:definitions.scale.title,description:definitions.scale.instruction,next:['Calibrar → segunda cota → confirmar','Calibrate → second dimension → confirm','校准 → 第二尺寸 → 确认'],terms:'escala calibrar calibracion medida medidas dimension ajustar scale calibrate dimensions',prerequisite:'image'},
  furniture:{title:['Buscar muebles','Find furniture','搜索家具'],description:definitions.furniture.instruction,next:['Seleccionar una estancia y colocar el mueble','Select a room and place the item','选择房间并放置家具'],terms:'mueble muebles amueblar catalogo biblioteca furniture furnish catalog',prerequisite:'geometry',goal:'furnish'},
  '3d':{title:definitions.view3d.title,description:definitions.view3d.instruction,next:['Cargar la escena y revisarla','Load and review the scene','加载并检查场景'],terms:'3d tridimensional recorrer visualizar ver revisar scene walk',prerequisite:'geometry',goal:'review'},
  missing:{title:['Ver qué me falta','See what is left','查看剩余任务'],description:['Consulta las tareas necesarias pendientes de tu objetivo.','See the remaining required tasks for your goal.','查看目标尚未完成的必要任务。'],next:['Resolver la primera tarea pendiente','Resolve the first remaining task','完成第一个剩余任务'],terms:'falta faltan pendiente progreso ayuda siguiente missing progress help next'},
  save:{title:definitions.save.title,description:definitions.save.instruction,next:['Exportar una copia JSON o ZIP','Export a JSON or ZIP copy','导出 JSON 或 ZIP 副本'],terms:'guardar conservar salvar save keep',goal:'save'},
  export:{title:definitions.export.title,description:definitions.export.instruction,next:['Guardar también el proyecto editable','Also save the editable project','同时保存可编辑项目'],terms:'exportar imagen png descargar captura export image png download capture',prerequisite:'geometry',goal:'export'},
  walls:{title:['Modificar paredes o estancias','Modify walls or rooms','修改墙体或房间'],description:['Abre Seleccionar/editar para ajustar la geometría existente.','Open Select/edit to adjust existing geometry.','打开选择/编辑以调整现有几何。'],next:['Seleccionar el muro o la estancia en el plano','Select the wall or room on the plan','在平面图上选择墙体或房间'],terms:'pared paredes muro muros tabique editar cambiar wall walls edit change',prerequisite:'geometry'},
  floor:{title:['Cambiar el suelo de una estancia','Change a room floor','更改房间地板'],description:['Selecciona una estancia y abre la biblioteca de acabados.','Select a room and open the finish library.','选择房间并打开饰面库。'],next:['Elegir y confirmar un acabado','Choose and confirm a finish','选择并确认饰面'],terms:'suelo pavimento acabado material floor flooring finish',prerequisite:'geometry'},
  undo:{title:['Deshacer el último cambio','Undo the last change','撤销上一步'],description:['Recupera el estado anterior con el historial existente.','Restore the previous state using the existing history.','使用现有历史恢复之前状态。'],next:['Continuar editando','Continue editing','继续编辑'],terms:'deshacer revertir undo revert'},
  clear:{title:['Vaciar los muebles','Clear the furniture','清空家具'],description:['Requiere confirmación; conserva muros y suelos. Se puede deshacer.','Requires confirmation; keeps walls and floors. Can be undone.','需要确认；保留墙体和地板。可撤销。'],next:['Confirmar o cancelar','Confirm or cancel','确认或取消'],terms:'borrar vaciar eliminar muebles clear delete remove furniture'}
 };
 const furnitureSearch=typeof module==='object'?require('./furniture-search.js'):root.FloorPlanFurnitureSearch;
 const furnitureTerms=[['bed','cama','cama camas lecho bed beds'],['crib','cuna','cuna bebe crib'],['sofa','sofa','sofa sofas couch'],['armchair','butaca','butaca sillon armchair'],['table','mesa','mesa mesas table'],['wardrobe','armario','armario ropero wardrobe'],['fridge','nevera','nevera frigorifico fridge'],['counter','encimera','encimera counter'],['chair','silla','silla sillas chair']];
 function resolve(query){
  let q=normalize(query);
  const chinese={'上传':'upload plan','家具':'furniture','床':'bed','比例':'scale','保存':'save','还有什么':'missing','剩余':'missing','地板':'floor','墙':'walls','撤销':'undo','示例':'example','从零':'scratch','导出':'export'};
  for(const [term,alias]of Object.entries(chinese))if(q.includes(term))q+=' '+alias;
  if(!q)return ['upload','blank','furniture','3d','missing','save'].map(id=>({id,...actions[id]}));
  const words=q.split(' '),has=terms=>terms.split(' ').some(w=>words.some((t,i)=>t===w||i===words.length-1&&t.length>=3&&t.length<w.length&&w.startsWith(t)));
  if(has('cambiar modificar change edit')&&has('cocina kitchen')&&!has('pared paredes muro muebles suelo floor wall furniture'))return ['walls','furniture','floor'].map(id=>({id,...actions[id],ambiguous:true}));
  if(has('borrar vaciar eliminar clear delete remove')&&has('muebles furniture'))return [{id:'clear',...actions.clear}];
  if(has('subir cargar importar upload import')&&has('plano imagen foto casa image photo plan house pdf png jpg jpeg webp heic tiff svg dxf ifc roomplan json zip bmp gif avif'))return [{id:'upload',...actions.upload}];
  if(has('exportar export captura capture png descargar download'))return [{id:'export',...actions.export}];
  if(has('subir cargar importar upload import')&&has('plano imagen foto casa image photo plan house'))return [{id:'upload',...actions.upload}];
  const catalogTerms=Object.entries(furnitureSearch.specs).map(([type,[,terms]])=>[type,terms.split(' ')[0],terms.split(' ').filter(t=>t!=='cocina').join(' ')]);
  const found=[...furnitureTerms,...catalogTerms].find(([, , terms])=>has(terms));
  if(found&&!has('borrar eliminar vaciar clear delete remove'))return [{id:'furniture',...actions.furniture,title:[`Buscar ${found[1]}`,`Find ${found[0]}`,'搜索家具'],filter:found[1],targetType:found[0],roomHint:has('dormitorio habitacion bedroom')?'bedroom':has('cocina kitchen')?'kitchen':undefined}];
  return Object.entries(actions).filter(([,a])=>has(a.terms)).map(([id,a])=>({id,...a})).slice(0,5);
 }
 const api={normalize,text,stages,goals,definitions,initial,revision,evaluate,actions,resolve,geometryReady,pointInRoom};
 if(typeof module==='object')module.exports=api;else root.FloorPlanGuide=api;
})(globalThis);
