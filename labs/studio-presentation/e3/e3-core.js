/* RUBIK SOTA · Studio Presentation E3 / K10 / ENT-03 · núcleo de laboratorio (puro: sin DOM, red ni escritura).
 *
 * «Entregar → Preparar entrega → receta profesional → composición con fuentes reales → verificación → vista previa».
 * No es un motor, un catálogo, un compositor ni una autoridad nueva: lee lo que el producto ya publica y lo une al catálogo
 * único de recetas (tools/recetas.cjs → e3/recetas-catalogo.js, generado y comprobado por huella).
 *
 * Contratos propuestos a Codex (informe 22; ninguno se consolida aquí):
 *  C1  leerConfirmado(P): lectura de FloorPlanPersistence.readConfirmed() (js/persistence-store.js). Sin sesión de escritura,
 *      sin migración, sin autoguardado y sin flush. Nunca toma el proyecto observado del editor como revisión confirmada.
 *  C2  identidad(): separa cinco identidades que no se confunden: trabajo (contentId de FloorPlanExpediente), revisión
 *      local confirmada (meta.revision de F0.2b), proyecto (id local), selección (huella de la receta elegida) y
 *      documento/paquete (nulo: E3 no emite). Lo que contentId no cubre (marca, registro de obra, vínculos de variante)
 *      se congela aparte en `externos`, para que su cambio también caduque el candidato.
 *  C3  Variantes: solo se leen las relaciones `variantOf` de la biblioteca confirmada; no se implementa expediente v2.
 *  C4  Vistas 3D: se acreditan solo si FloorPlanProjectViews dice «ready» y no hay cambios sin guardar. No se persisten
 *      cámaras. Blender/C6: solo se describe el consumo (informe 22 §C4); no se llama a record() ni se activa nada.
 *
 * Estados (vocabulario N05, tools/estado-entrega.cjs): preparado · verificado · verificado-desactualizado · invalido.
 * «Emitido», «aceptado» o «firmado» no existen aquí: E3 no emite.
 */
(function(root,factory){
 const node=typeof module==='object'&&module.exports;
 const api=factory(node?require('./recetas-catalogo.js'):root.RubikStudioE3Catalogo);
 if(node)module.exports=api;else root.RubikStudioE3=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(CAT){
 'use strict';
 if(!CAT||!Array.isArray(CAT.recetas)||CAT.recetas.length!==21)throw new Error('RubikStudioE3: falta el catálogo de recetas generado (e3/recetas-catalogo.js).');
 const VERSION='rubik-lab-e3/1';
 const KEYS=Object.freeze({project:'rubik-sota-floorplan-project-v1',library:'rubik-sota-project-library-v1',budgets:'rubik-budget-v1',reviews:'rubik-review-v1',construction:'rubik-construction-v1'});
 const LANGS=['es','en','zh'];
 const enc=new TextEncoder();
 const canon=x=>JSON.stringify(function s(v){if(Array.isArray(v))return v.map(s);if(v&&typeof v==='object')return Object.fromEntries(Object.keys(v).sort().map(k=>[k,s(v[k])]));return v;}(x));
 const parse=t=>{if(typeof t!=='string')return null;try{return JSON.parse(t);}catch{return undefined;}};

 // ---------------------------------------------------------------- textos (ES/EN/ZH, sin respaldo silencioso)
 // Cada estado bloqueado explica: causa, siguiente paso, alternativa segura y qué pasa con los datos.
 const T={
  'c1-origen':{
   es:['La lectura confirmada (F0.2b) solo está activa en el origen de prueba.','Prepara la entrega cuando F0.2b esté activada en este origen.','Las demás tarjetas de Entregar siguen funcionando con el proyecto abierto.','No se ha leído ni escrito nada.'],
   en:['The confirmed read (F0.2b) is only active on the test origin.','Prepare the delivery once F0.2b is enabled on this origin.','The other Deliver cards keep working with the open project.','Nothing was read or written.'],
   zh:['已确认读取（F0.2b）仅在测试源上启用。','在此源启用 F0.2b 后再准备交付。','“交付”中的其他卡片仍可基于当前项目使用。','未读取或写入任何内容。']},
  'c1-sin-revision':{
   es:['Este navegador todavía no tiene una revisión confirmada del proyecto.','Guarda el proyecto en el editor y vuelve a «Preparar entrega».','Puedes revisar la ficha y las imágenes en las otras tarjetas de Entregar.','No se ha creado ninguna revisión ni se ha migrado nada.'],
   en:['This browser has no confirmed revision of the project yet.','Save the project in the editor and come back to «Prepare delivery».','You can review the sheet and images in the other Deliver cards.','No revision was created and nothing was migrated.'],
   zh:['此浏览器尚无该项目的已确认版本。','请在编辑器中保存项目，然后返回“准备交付”。','您可以在“交付”的其他卡片中查看图纸和图片。','未创建任何版本，也未迁移任何内容。']},
  'c1-otra-pestana':{
   es:['Otra pestaña de RUBIK bloquea el almacenamiento.','Cierra o recarga la otra pestaña y vuelve a intentarlo.','Trabaja en una sola pestaña hasta terminar la entrega.','Tus datos guardados no se han tocado.'],
   en:['Another RUBIK tab is blocking storage.','Close or reload the other tab and try again.','Work in a single tab until the delivery is done.','Your saved data was not touched.'],
   zh:['另一个 RUBIK 标签页正在占用存储。','关闭或重新加载另一个标签页后重试。','在完成交付前只使用一个标签页。','已保存的数据未被改动。']},
  'c1-error':{
   es:['No se pudo leer la revisión confirmada.','Recarga RUBIK y vuelve a intentarlo.','Exporta el expediente desde «Más opciones» si necesitas una copia ahora.','No se ha escrito nada.'],
   en:['The confirmed revision could not be read.','Reload RUBIK and try again.','Export the project file from «More options» if you need a copy now.','Nothing was written.'],
   zh:['无法读取已确认版本。','重新加载 RUBIK 后重试。','如需立即备份，可在“更多选项”中导出项目档案。','未写入任何内容。']},
  'cambios-sin-guardar':{
   es:['El proyecto abierto tiene cambios que aún no están confirmados.','Guarda el proyecto y vuelve a preparar la entrega.','Si no quieres esos cambios en la entrega, prepárala igualmente cuando estén guardados o deshazlos.','La entrega solo usa lo confirmado; tus cambios siguen en el editor.'],
   en:['The open project has changes that are not confirmed yet.','Save the project and prepare the delivery again.','If you do not want those changes in the delivery, undo them or prepare it once they are saved.','The delivery only uses what is confirmed; your changes stay in the editor.'],
   zh:['当前项目有尚未确认的更改。','请保存项目后重新准备交付。','若不希望这些更改进入交付，请撤销，或在保存后再准备。','交付只使用已确认内容；您的更改仍保留在编辑器中。']},
  'revision-movida':{
   es:['Se confirmó una revisión nueva mientras se preparaba (otra pestaña o un guardado).','Vuelve a preparar la entrega sobre la revisión actual.','Trabaja en una sola pestaña durante la preparación.','La preparación anterior se ha descartado sin guardar nada.'],
   en:['A new revision was confirmed while preparing (another tab or a save).','Prepare the delivery again on the current revision.','Work in a single tab while preparing.','The previous preparation was discarded without saving anything.'],
   zh:['准备期间确认了新版本（其他标签页或一次保存）。','请基于当前版本重新准备交付。','准备期间只使用一个标签页。','之前的准备已丢弃，未保存任何内容。']},
  'edificio':{
   es:['El proyecto confirmado es un edificio de varias plantas.','Prepara la entrega desde una planta exportada como proyecto.','La ficha y la presentación del edificio siguen disponibles en Entregar.','No se ha modificado el edificio.'],
   en:['The confirmed project is a multi-level building.','Prepare the delivery from a level exported as a project.','The building sheet and presentation remain available in Deliver.','The building was not modified.'],
   zh:['已确认的项目是多层建筑。','请从导出为项目的单个楼层准备交付。','建筑的图纸与展示仍可在“交付”中使用。','建筑未被修改。']},
  'proyecto-invalido':{
   es:['La revisión confirmada no supera la validación del proyecto.','Abre el proyecto en el editor y corrige lo que indica la validación.','Exporta el expediente para conservar una copia.','No se ha reparado ni reescrito nada.'],
   en:['The confirmed revision does not pass project validation.','Open the project in the editor and fix what validation reports.','Export the project file to keep a copy.','Nothing was repaired or rewritten.'],
   zh:['已确认版本未通过项目校验。','在编辑器中打开项目并修正校验指出的问题。','导出项目档案以保留副本。','未修复或改写任何内容。']},
  'receta-bloqueada':{
   es:['Faltan fuentes obligatorias de esta receta.','Completa en RUBIK lo que falta (abajo) o elige otra receta.','Las recetas marcadas «preparable» usan solo lo que ya existe.','No se prepara nada incompleto.'],
   en:['This recipe is missing required sources.','Complete what is missing in RUBIK (below) or choose another recipe.','Recipes marked «ready to prepare» only use what already exists.','Nothing incomplete is prepared.'],
   zh:['此配方缺少必需的来源。','在 RUBIK 中补全缺失内容（见下方）或选择其他配方。','标为“可准备”的配方只使用已有内容。','不会准备不完整的内容。']},
  'receta-c':{
   es:['Receta de contrato: se evalúa su elegibilidad, pero no genera entrega para el cliente.','Consulta qué fuentes cumple y cuáles faltan.','Elige una receta «preparable» para entregar hoy.','No se genera ningún archivo.'],
   en:['Contract recipe: its eligibility is evaluated, but it produces no client delivery.','Check which sources it meets and which are missing.','Choose a «ready to prepare» recipe to deliver today.','No file is generated.'],
   zh:['合同类配方：只评估其资格，不生成客户交付。','查看已满足和缺失的来源。','如需今天交付，请选择“可准备”的配方。','不会生成任何文件。']},
  'receta-f':{
   es:['Función futura: hoy no está disponible.','Consulta de qué depende en el contrato.','Elige una receta «preparable» para entregar hoy.','No se genera ningún archivo.'],
   en:['Future function: not available today.','Check what it depends on in the contract.','Choose a «ready to prepare» recipe to deliver today.','No file is generated.'],
   zh:['未来功能：目前不可用。','查看合同中所依赖的内容。','如需今天交付，请选择“可准备”的配方。','不会生成任何文件。']},
  'cancelada':{
   es:['Preparación cancelada.','Vuelve a preparar cuando quieras.','Las demás tarjetas de Entregar no se ven afectadas.','No se ha guardado nada.'],
   en:['Preparation cancelled.','Prepare again whenever you want.','The other Deliver cards are not affected.','Nothing was saved.'],
   zh:['准备已取消。','可随时重新准备。','“交付”的其他卡片不受影响。','未保存任何内容。']},
  'obsoleta':{
   es:['Ha llegado un resultado de una preparación anterior y se ha descartado.','Usa la preparación en curso.','—','No se ha aplicado ningún resultado antiguo.'],
   en:['A result from an earlier preparation arrived and was discarded.','Use the current preparation.','—','No stale result was applied.'],
   zh:['收到之前一次准备的结果，已丢弃。','请使用当前的准备。','—','未应用任何过期结果。']},
  'verificado':{
   es:['El candidato coincide con el trabajo confirmado.','Revisa la vista previa.','—','El candidato vive en esta sesión; no se ha guardado ni enviado.'],
   en:['The candidate matches the confirmed work.','Review the preview.','—','The candidate lives in this session; it was not saved or sent.'],
   zh:['候选与已确认的作品一致。','请查看预览。','—','候选仅存在于本次会话中，未保存也未发送。']},
  'verificado-restaurado':{
   es:['Mismo trabajo con otra revisión local (por ejemplo, restaurado en otro navegador).','Revisa la vista previa.','—','El candidato sigue vigente; no se ha guardado ni enviado.'],
   en:['Same work under another local revision (for example, restored in another browser).','Review the preview.','—','The candidate is still current; it was not saved or sent.'],
   zh:['相同作品，但本地版本不同（例如在其他浏览器中恢复）。','请查看预览。','—','候选仍然有效，未保存也未发送。']},
  'desactualizado-trabajo':{
   es:['El trabajo cambió desde que se preparó (geometría, imágenes o documentos).','Prepara un candidato nuevo.','El candidato anterior se conserva como referencia y no se modifica.','No se ha borrado nada.'],
   en:['The work changed since it was prepared (geometry, images or documents).','Prepare a new candidate.','The previous candidate is kept for reference and not modified.','Nothing was deleted.'],
   zh:['自准备以来作品已更改（几何、图片或文档）。','请准备新的候选。','之前的候选保留作参考，未被修改。','未删除任何内容。']},
  'desactualizado-externo':{
   es:['Cambió algo que la entrega usa y que el expediente no incluye (firma, plan de obra o variantes).','Prepara un candidato nuevo.','El candidato anterior se conserva como referencia y no se modifica.','No se ha borrado nada.'],
   en:['Something the delivery uses and the project file does not include changed (signature, works plan or variants).','Prepare a new candidate.','The previous candidate is kept for reference and not modified.','Nothing was deleted.'],
   zh:['交付使用但项目档案未包含的内容已更改（签名、施工计划或变体）。','请准备新的候选。','之前的候选保留作参考，未被修改。','未删除任何内容。']},
  'invalido-alterado':{
   es:['El candidato no coincide con su propia huella: está alterado.','Descártalo y prepara uno nuevo.','—','No se usa ningún dato alterado.'],
   en:['The candidate does not match its own fingerprint: it was altered.','Discard it and prepare a new one.','—','No altered data is used.'],
   zh:['候选与其自身指纹不符：已被篡改。','丢弃后重新准备。','—','不会使用任何被篡改的数据。']},
  'invalido-expediente':{
   es:['El expediente está alterado o incompleto y se ha rechazado.','Vuelve a exportarlo desde el RUBIK de origen.','Verifica contra la revisión confirmada de este navegador.','No se ha restaurado ni escrito nada.'],
   en:['The project file is altered or incomplete and was rejected.','Export it again from the original RUBIK.','Verify against this browser’s confirmed revision.','Nothing was restored or written.'],
   zh:['项目档案已被篡改或不完整，已拒绝。','请从原始 RUBIK 重新导出。','改为对照本浏览器的已确认版本进行验证。','未恢复或写入任何内容。']},
  'c2-sin-expediente':{
   es:['Falta la autoridad del expediente (contentId) en esta página.','Carga js/expediente-core.js en el editor (parte del enganche E3).','Las demás tarjetas de Entregar siguen funcionando.','No se ha calculado ninguna identidad alternativa ni se ha escrito nada.'],
   en:['The project-file authority (contentId) is missing on this page.','Load js/expediente-core.js in the editor (part of the E3 hook).','The other Deliver cards keep working.','No alternative identity was computed and nothing was written.'],
   zh:['此页面缺少项目档案权威（contentId）。','在编辑器中加载 js/expediente-core.js（E3 挂接的一部分）。','“交付”的其他卡片仍可使用。','未计算任何替代身份，也未写入任何内容。']},
  'sin-verificar':{
   es:['No se puede verificar ahora: falta la revisión confirmada.','Resuelve el aviso de lectura y vuelve a verificar.','—','El candidato sigue «preparado».'],
   en:['It cannot be verified now: the confirmed revision is missing.','Resolve the read notice and verify again.','—','The candidate stays «prepared».'],
   zh:['目前无法验证：缺少已确认版本。','处理读取提示后重新验证。','—','候选保持“已准备”。']}
 };
 // Motivos de fuente (una línea; la causa larga va en la matriz del informe 22).
 const TF={
  confirmada:{es:'Revisión confirmada',en:'Confirmed revision',zh:'已确认版本'},
  motor:{es:'Calculado por RUBIK desde la geometría confirmada',en:'Computed by RUBIK from the confirmed geometry',zh:'由 RUBIK 根据已确认几何计算'},
  'sesion-lista':{es:'Vistas preparadas de esta revisión (no se guardan)',en:'Views prepared for this revision (not stored)',zh:'本版本已准备的视图（不保存）'},
  'sesion-caducada':{es:'Vistas sin preparar o de otra revisión: prepáralas en «Imágenes»',en:'Views not prepared or from another revision: prepare them in «Images»',zh:'视图未准备或属于其他版本：请在“图片”中准备'},
  'local-no-portable':{es:'Solo en este navegador, fuera del expediente: se congela su huella',en:'Only in this browser, outside the project file: its fingerprint is frozen',zh:'仅在本浏览器中、不在项目档案内：冻结其指纹'},
  'consumidor-pendiente':{es:'El dato existe, pero su lectura confirmada no está conectada',en:'The data exists, but its confirmed read is not connected',zh:'数据存在，但其已确认读取尚未接入'},
  historial:{es:'Requiere historial de versiones (F0.3)',en:'Requires version history (F0.3)',zh:'需要版本历史（F0.3）'},
  'sin-fuente':{es:'El modelo de RUBIK no contiene este dato',en:'RUBIK’s model does not contain this data',zh:'RUBIK 模型不包含此数据'},
  aportacion:{es:'Aportación del profesional: sin autoridad de producto todavía',en:'Professional input: no product authority yet',zh:'专业人员提供：尚无产品权威来源'},
  fuera:{es:'Fuera de E3 (obra, comercial o F1)',en:'Outside E3 (works, commercial or F1)',zh:'超出 E3 范围（施工、商务或 F1）'},
  'sin-dato':{es:'Aún no hay datos en el proyecto confirmado',en:'No data yet in the confirmed project',zh:'已确认项目中尚无数据'},
  'sin-motor':{es:'El motor no está cargado en esta página',en:'The engine is not loaded on this page',zh:'此页面未加载该引擎'},
  'cambios':{es:'Hay cambios sin guardar: no se acredita',en:'There are unsaved changes: not credited',zh:'存在未保存的更改：不予认可'}
 };
 function texto(code,lang){
  const e=T[code];if(!e)throw new Error('Texto E3 desconocido: '+code);
  if(!LANGS.includes(lang)||!e[lang])throw new Error(`Texto E3 «${code}» sin traducción «${lang}» (sin respaldo silencioso).`);
  const [causa,siguiente,alternativa,datos]=e[lang];return {code,causa,siguiente,alternativa,datos};}
 function motivoFuente(code,lang){const e=TF[code];if(!e||!e[lang])throw new Error(`Motivo de fuente «${code}» sin «${lang}».`);return e[lang];}
 // Nombre de receta y de fuente: el catálogo es ES/EN. En ZH se muestra EN rotulado (lang="en"), nunca en silencio.
 function nombre(obj,lang){if(lang==='es'||lang==='en')return {texto:obj[lang],lang};return {texto:obj.en,lang:'en',rotulo:'EN'};}

 // ---------------------------------------------------------------- C1 · lectura confirmada (solo lectura)
 async function leerConfirmado(P){
  if(!P||typeof P.readConfirmed!=='function')return {estado:'no-disponible',motivo:'c1-error'};
  if(typeof P.isTestOrigin==='function'&&!P.isTestOrigin())return {estado:'no-disponible',motivo:'c1-origen'};
  let r;
  try{r=await P.readConfirmed();}
  catch(e){const code=e&&e.code;
   return {estado:code==='authority-missing'?'sin-revision':code==='open-blocked'?'otra-pestana':'no-disponible',
    motivo:code==='authority-missing'?'c1-sin-revision':code==='open-blocked'?'c1-otra-pestana':'c1-error',detalle:(e&&e.message)||String(e)};}
  if(!r||!Number.isInteger(r.revision)||r.revision<1||!(r.docs instanceof Map))return {estado:'sin-revision',motivo:'c1-sin-revision'};
  // Copia desprendida: lo leído no se comparte con la sesión del editor.
  return {estado:'confirmado',revision:r.revision,docs:new Map([...r.docs].filter(([k])=>Object.values(KEYS).includes(k))),lectura:'FloorPlanPersistence.readConfirmed'};
 }
 // Desglose de la lectura confirmada con las autoridades del producto (Core.prepare valida; no migra ni escribe).
 function analizar(lectura,{Core}={}){
  if(!lectura||lectura.estado!=='confirmado')return {ok:false,motivo:lectura?.motivo||'c1-error'};
  // Con F0.2b el proyecto abierto vive en la biblioteca confirmada (entrada activa: {project} o {kind:'building'}).
  // La clave suelta del proyecto solo se usa si no hay biblioteca (estado heredado).
  const lib0=parse(lectura.docs.get(KEYS.library));const act=Array.isArray(lib0?.entries)?lib0.entries.find(e=>e.id===lib0.activeId):null;
  if(act&&act.kind==='building')return {ok:false,motivo:'edificio'};
  const raw=act&&act.project?JSON.stringify(act.project):lib0?null:lectura.docs.get(KEYS.project);const p0=parse(raw);
  if(!p0)return {ok:false,motivo:'c1-sin-revision'};
  if(p0.schema==='rubik-sota.floorplan-building')return {ok:false,motivo:'edificio'};
  let project=p0;
  if(Core&&typeof Core.prepare==='function'){try{project=Core.prepare(raw).project;}catch(e){return {ok:false,motivo:'proyecto-invalido',detalle:e.message};}}
  else if(Core&&typeof Core.validate==='function'){try{Core.validate(p0);}catch(e){return {ok:false,motivo:'proyecto-invalido',detalle:e.message};}}
  const id=project.id;
  const budgets=parse(lectura.docs.get(KEYS.budgets))||{},reviews=parse(lectura.docs.get(KEYS.reviews))||{};
  const lib=parse(lectura.docs.get(KEYS.library)),cons=parse(lectura.docs.get(KEYS.construction));
  const entries=Array.isArray(lib?.entries)?lib.entries:[];
  const entry=entries.find(e=>e.id===lib?.activeId)||null;
  const budget=budgets[id]&&budgets[id].subject?.id===id?budgets[id]:null;// un presupuesto de otro sujeto no se acredita
  const records=cons&&cons.records&&entry?Object.fromEntries(Object.entries(cons.records).filter(([k])=>k.startsWith(entry.id+'|'))):{};
  const variantes=entry?entries.filter(e=>e.variantOf===entry.id||e.id===entry.variantOf).map(e=>({id:e.id,variantOf:e.variantOf||null})):[];
  return {ok:true,revision:lectura.revision,project,entryId:entry?.id||null,budget,budgetAjeno:!!budgets[id]&&!budget,review:reviews[id]??null,obra:records,variantes};
 }
 // Cambios sin guardar: el proyecto observado frente al confirmado (comparación de contenido; no se usa la sesión).
 function cambiosSinGuardar(analisis,observado){
  if(!analisis?.ok||!observado)return true;
  return canon(observado)!==canon(analisis.project);}

 // ---------------------------------------------------------------- C2 · identidades separadas
 async function identidad(analisis,{X,digest,marca=null}){
  const p=analisis.project,id=p.id;
  const docs={budgets:analisis.budget?{[id]:analisis.budget}:{},reviews:analisis.review!=null?{[id]:analisis.review}:{}};
  // Token de imagen: la huella SHA-256 de sus bytes reales que el modelo ya guarda (sourceImages[].sha256). Sin huella → no hay trabajo identificable.
  const contentId=await X.contentId({kind:'project',project:p},docs,im=>{if(typeof im.sha256!=='string'||!/^[0-9a-f]{64}$/.test(im.sha256))throw Object.assign(new Error('Imagen sin huella: '+im.id),{code:'image-unfingerprinted'});return im.sha256;});
  const h=async v=>v==null?null:digest(enc.encode(canon(v)));
  return {
   trabajo:{contentId,autoridad:'FloorPlanExpediente.contentId'},
   revisionLocal:{revision:analisis.revision,autoridad:'FloorPlanPersistence.readConfirmed · meta.revision'},
   proyecto:{id,entryId:analisis.entryId},
   externos:{marca:await h(marca),obra:await h(Object.keys(analisis.obra).length?analisis.obra:null),variantes:await h(analisis.variantes.length?analisis.variantes:null)},
   paquete:null};
 }

 // ---------------------------------------------------------------- matriz de las 43 fuentes contra master 130ba24
 // clase: confirmada · motor · sesion · local · consumidor-pendiente · historial · sin-fuente · aportacion · fuera
 // ev: [archivo de master, patrón que debe existir] → comprobado por tools/e3-qa.cjs contra el pin.
 const M=(clase,modulo,autoridad,condicion,identidad,consumidor,privacidad,ev,cambio)=>({clase,modulo,autoridad,condicion,identidad,consumidor,privacidad,ev,cambio:cambio||null});
 const RC=['js/persistence-store.js','async function readConfirmed'],XC=['js/expediente-core.js','async function contentId'];
 const MATRIZ={
  geometria:M('confirmada','project-core.js · prepare/validate','F0.2b (IndexedDB)','revisión confirmada ≥1 en origen de prueba','contentId (geometría sin ids)','E3 · RP02–RP04, RP07, RP09, RP10','propietario del proyecto',[RC,XC,['js/project-core.js','function validate']]),
  superficies:M('motor','surface-core.js · FloorPlanSurfaceMetrics','motor sobre la geometría confirmada','geometría confirmada con estancias','deriva de contentId','RP02, RP04, RP07, RP09, RP10','—',[['js/surface-core.js','root.FloorPlanSurfaceMetrics=api']]),
  vistas3d:M('sesion','project-views-ui.js · FloorPlanProjectViews.current()','sesión del editor (no persistido)','status «ready» y sin cambios sin guardar','no forma parte de contentId; se calcula','RP03, RP06, RP07','vistas del propio modelo',[['js/project-views-ui.js','function current\\(\\)\\{return status\\(\\)===\'ready\''],['js/project-core.js','api=']],'antes «sin-fuente»: el producto ya prepara vistas reales por revisión; siguen sin persistirse (C4)'),
  imagenesIA:M('sin-fuente','—','—','—','—','opcional en RP03, RP06, RP11, RP21','imágenes IA: no se inventan',[['js/expediente-core.js','NOT_INCLUDED=']]),
  dibujoVivo:M('motor','presentation-living-drawing-core.js','motor sobre la geometría','geometría con muros','deriva de contentId','opcional RP03, RP06, RP07','—',[['js/presentation-living-drawing-core.js','function']]),
  recorrido:M('motor','presentation-route.js · plan/choreography','motor sobre la geometría','geometría con estancias','deriva de contentId','opcional RP03, RP04, RP07, RP21','—',[['js/presentation-route.js','root.FloorPlanPresentationRoute=api']]),
  materiales:M('confirmada','project.materials','F0.2b','al menos un material','contentId','RP06, RP11, RP17','—',[RC,['docs/contracts/FloorPlanProjectV1.md','`materials`']]),
  objetos:M('confirmada','project.objects','F0.2b','al menos un objeto','contentId','RP11, RP17','—',[RC,['docs/contracts/FloorPlanProjectV1.md','`objects`']]),
  presupuesto:M('confirmada','rubik-budget-v1[project.id] · FloorPlanBudgetV1','F0.2b (misma transacción que el proyecto)','presupuesto del mismo sujeto','contentId (documento con referencia neutralizada)','RP01, RP05, RP12, RP13','importes del profesional',[RC,['js/persistence-store.js','\'rubik-budget-v1\''],['js/budget-core.js','subject is required']]),
  presupuestoRevisado:M('consumidor-pendiente','revision-budget-core.js','F0.2b (dato) · consumidor sin conectar','consumidor conectado a readConfirmed','—','RP12','—',[['js/revision-budget-core.js','root.FloorPlanRevisionBudget=api']]),
  planObra:M('local','construction-record-core.js · rubik-construction-v1','F0.2b, pero excluido del expediente v1','registros de la entrada activa','huella propia congelada (externos.obra)','RP08, RP15','datos de obra del estudio',[['js/persistence-store.js','\'rubik-construction-v1\''],['js/expediente-core.js','\'construction-record\'']],'antes «excluido»: bajo autoridad F0 en este navegador; no portable'),
  vinculoPlanPresupuesto:M('local','construction-record-core.js (binding)','F0.2b, excluido del expediente v1','vínculo declarado en el registro','huella propia congelada (externos.obra)','RP08','—',[['js/construction-record-core.js','binding']],'antes «excluido»'),
  concepto:M('aportacion','—','sin autoridad de producto','—','—','RP01, RP03, RP06, RP10','texto del profesional',[]),
  marca:M('local','brand-core.js · rubik-sota-brand-profiles-v1 (localStorage)','brand-core fuera de F0 y del expediente','perfil de firma seleccionado','huella propia congelada (externos.marca)','RP01','datos del estudio (nombre, logo, contacto)',[['js/brand-core.js','rubik-sota-brand-profiles-v1'],['js/expediente-core.js','\'brand-profiles\'']],'antes «excluido»: se acredita como parcial no portable'),
  seccionFachadas:M('motor','presentation-section-core.js · presentation-elevation-core.js','motor sobre la geometría','geometría con muros','deriva de contentId','opcional RP09','—',[['js/presentation-section-core.js','function'],['js/presentation-elevation-core.js','function']]),
  dimensionesHuecos:M('confirmada','project.openings (widthMm, heightMm)','F0.2b','al menos un hueco con medidas','contentId','RP09','—',[RC,['docs/contracts/FloorPlanProjectV1.md','`openings`']]),
  revisionAnterior:M('historial','—','F0.3 (historial)','—','—','RP02, RP04, RP09, RP10, RP14','—',[['js/persistence-store.js','\'conflicts\'']]),
  variantesGuardadas:M('local','project-library.js · variantOf','biblioteca F0.2b; excluida del expediente v1 (variant-links)','relación variantOf en la biblioteca confirmada','huella propia congelada (externos.variantes)','RP03','—',[['js/project-library.js','variantOf'],['js/expediente-core.js','\'variant-links\'']],'antes «exp-v2»: legible en local; portable solo con expediente v2 (C3)'),
  fotosAportadas:M('confirmada','project.sourceImages[] (sha256)','F0.2b + almacén de imágenes','imagen con huella SHA-256','contentId (bytes reales)','RP02','fotos del propietario: privadas',[RC,['docs/contracts/FloorPlanProjectV1.md','sourceImages']]),
  norte:M('confirmada','project.site.northOffsetDeg (ProjectV1 ≥ 1.7)','F0.2b','norte configurado (ausente = sin configurar)','contentId','opcional RP07','—',[['docs/contracts/FloorPlanProjectV1.md','northOffsetDeg']],'antes «sin-fuente»: el contrato 1.7 declara el norte'),
  alcanceServicios:M('aportacion','—','sin autoridad de producto','—','—','RP01','—',[]),
  honorarios:M('aportacion','—','studio-tariff solo existe como exclusión del expediente','—','—','RP01','—',[['js/expediente-core.js','\'studio-tariff\'']],'antes «excluido»: no hay módulo de honorarios en master'),
  exclusiones:M('aportacion','—','sin autoridad de producto','—','—','RP01, RP08','—',[]),
  validezOferta:M('aportacion','—','sin autoridad de producto','—','—','RP01','—',[]),
  precioInmueble:M('aportacion','—','sin autoridad de producto','—','—','RP04','dato comercial',[]),
  impuestosCompra:M('aportacion','—','sin autoridad de producto','—','—','RP04','—',[]),
  referenciasMoodboard:M('aportacion','moodboard (derivado del modelo)','sin autoridad de referencias de terceros','—','—','RP06','sin imágenes de terceros',[]),
  ofertaTecnica:M('aportacion','—','sin autoridad de producto','—','—','RP08','—',[]),
  catalogoProductos:M('consumidor-pendiente','catalog-budget-core.js · cat04','catálogo fuera de las claves F0','consumidor conectado a readConfirmed','—','RP11, RP17','—',[['js/catalog-budget-core.js','root.RubikCatalogBudget=api']]),
  preciosVerificados:M('fuera','corte económico','—','—','—','RP11','—',[]),
  ofertasIndependientes:M('fuera','corte económico','—','—','—','RP13','—',[]),
  motivoCambio:M('aportacion','—','atribuido por quien propone el cambio','—','—','RP14','—',[]),
  observacionesObra:M('fuera','OBR','—','—','—','RP15','—',[]),
  certificadosObra:M('fuera','OBR','—','—','—','RP15','—',[]),
  actasVisita:M('fuera','OBR','—','—','—','RP16','—',[]),
  especificacionValidada:M('fuera','validación competente','—','—','—','RP17','—',[]),
  punchList:M('fuera','OBR','—','—','—','RP18','—',[]),
  revisionEjecutada:M('fuera','E6 / F1','—','—','—','RP19','—',[]),
  manualesGarantias:M('fuera','F1','—','—','—','RP19, RP20','—',[]),
  costeLiquidado:M('fuera','corte económico futuro','—','—','—','RP20','—',[]),
  actasEntrega:M('fuera','OBR','—','—','—','RP20','—',[]),
  evidenciaEjecutada:M('fuera','OBR / F1','—','—','—','RP21','—',[]),
  archivoPropietario:M('fuera','F1','—','—','—','RP21','—',[])};

 const DISP=(motivo,dato)=>({estado:'disponible',motivo,dato:dato??null});
 const PARC=(motivo,dato)=>({estado:'parcial',motivo,dato:dato??null});
 const AUS=motivo=>({estado:'ausente',motivo,dato:null});
 /** Evalúa las 43 fuentes. entorno: {cambios:bool, motores:{superficies,dibujoVivo,recorrido,seccion}, vistas:{estado,n}, marca:obj|null}. */
 function evaluarFuentes(analisis,entorno={}){
  const out={};const mot=entorno.motores||{};const ok=analisis&&analisis.ok;const p=ok?analisis.project:null;
  const walls=p?.walls?.length||0,rooms=p?.rooms?.length||0;
  for(const id of Object.keys(CAT.fuentes)){
   const m=MATRIZ[id];let r;
   if(!m)throw new Error('Fuente sin fila en la matriz: '+id);
   if(!ok)r=AUS('sin-dato');
   else switch(m.clase){
    case 'confirmada':{
     const d={geometria:walls&&rooms?`${walls}·${p.openings?.length||0}·${rooms}`:null,materiales:p.materials?.length||null,objetos:p.objects?.length||null,
      presupuesto:analisis.budget?(analisis.budget.items?.length??0)+'':null,dimensionesHuecos:(p.openings||[]).filter(o=>o.widthMm>0&&o.heightMm>0).length||null,
      fotosAportadas:(p.sourceImages||[]).filter(i=>/^[0-9a-f]{64}$/.test(i.sha256||'')).length||null,norte:Number.isFinite(p.site?.northOffsetDeg)?p.site.northOffsetDeg+'°':null}[id];
     r=d?DISP('confirmada',d):AUS('sin-dato');break;}
    case 'motor':{const need={superficies:rooms,dibujoVivo:walls,recorrido:rooms,seccionFachadas:walls}[id];
     const key={superficies:'superficies',dibujoVivo:'dibujoVivo',recorrido:'recorrido',seccionFachadas:'seccion'}[id];
     r=!need?AUS('sin-dato'):mot[key]===false?AUS('sin-motor'):DISP('motor');break;}
    case 'sesion':{const v=entorno.vistas||{};r=entorno.cambios?AUS('cambios'):v.estado==='ready'&&v.n>0?DISP('sesion-lista',String(v.n)):AUS('sesion-caducada');break;}
    case 'local':{
     const has={planObra:Object.values(analisis.obra).some(x=>x&&x.schedule),vinculoPlanPresupuesto:Object.values(analisis.obra).some(x=>x&&x.binding),
      marca:!!entorno.marca,variantesGuardadas:analisis.variantes.length>0}[id];
     r=has?PARC('local-no-portable'):AUS('sin-dato');break;}
    case 'consumidor-pendiente':r=AUS('consumidor-pendiente');break;
    case 'historial':r=AUS('historial');break;
    case 'sin-fuente':r=AUS('sin-fuente');break;
    case 'aportacion':r=AUS('aportacion');break;
    default:r=AUS('fuera');}
   out[id]={...r,clase:m.clase};
  }
  return out;
 }

 // ---------------------------------------------------------------- resolución de recetas (misma regla que tools/recetas.cjs)
 const receta=key=>CAT.recetas.find(r=>r.key===key)||null;
 function resolver(key,F){
  const r=receta(key);if(!r)return {key,estado:'desconocida',preparable:false};
  const st=i=>F[i]?.estado;
  const falta=r.requeridas.filter(i=>st(i)!=='disponible'&&st(i)!=='parcial');
  const incompleta=r.completas.filter(i=>st(i)!=='disponible');
  const omitidas=r.opcionales.filter(i=>st(i)!=='disponible'&&st(i)!=='parcial');
  const ids=[...new Set([...r.requeridas,...r.completas,...r.opcionales])];
  const acreditadas=ids.filter(i=>st(i)==='disponible'),parciales=ids.filter(i=>st(i)==='parcial');
  const base={key,version:r.version,catalogo:CAT.catalogo,nivel:r.nivel,corte:r.corte,falta,incompleta,omitidas,acreditadas,parciales,emitible:false};
  if(r.nivel==='C'){const cumple=!falta.length&&r.requeridas.every(i=>st(i)==='disponible');return {...base,estado:cumple?'contrato-cumplido-sin-emision':'no-elegible',preparable:false,aviso:'receta-c'};}
  if(r.nivel==='F')return {...base,estado:'no-disponible',preparable:false,aviso:'receta-f'};
  if(falta.length)return {...base,estado:'bloqueada',preparable:false,aviso:'receta-bloqueada'};
  return {...base,estado:incompleta.length?'preparable-parcial':'preparable',preparable:true,aviso:null};
 }
 const resolverTodas=F=>CAT.recetas.map(r=>resolver(r.key,F));

 // ---------------------------------------------------------------- preparación cancelable y rechazo de resultados obsoletos
 function preparador(){
  let gen=0,ctrl=null,cancelado=-1;
  return {
   iniciar(){gen++;ctrl?.abort?.();ctrl=typeof AbortController==='function'?new AbortController():{signal:{aborted:false},abort(){this.signal.aborted=true;}};return {gen,signal:ctrl.signal};},
   cancelar(){cancelado=gen;gen++;ctrl?.abort?.();ctrl=null;},
   aceptar(token,resultado){if(token&&token.gen===cancelado)return {aceptado:false,motivo:'cancelada'};if(!token||token.gen!==gen||token.signal?.aborted)return {aceptado:false,motivo:'obsoleta'};return {aceptado:true,resultado};},
   get generacion(){return gen;}};
 }
 const sha=async(digest,v)=>digest(enc.encode(canon(v)));
 /**
  * Flujo completo: lectura confirmada → análisis → identidades → fuentes → receta → relectura (otra pestaña) → candidato.
  * deps: {P, X, Core, digest, observado(): proyecto del editor, entorno(): {...}, marca(): perfil|null}
  * El candidato vive en memoria: no se guarda, no se envía y no se escribe en ningún almacenamiento.
  */
 async function preparar({key,idioma},deps,token,prep){
  const fin=o=>{const a=prep?prep.aceptar(token,o):{aceptado:true,resultado:o};return a.aceptado?a.resultado:{ok:false,motivo:a.motivo};};
  if(!['es','en'].includes(idioma))return fin({ok:false,motivo:'idioma',detalle:'Las recetas existen en ES y EN.'});
  if(!deps.X||typeof deps.X.contentId!=='function')return fin({ok:false,motivo:'c2-sin-expediente'});
  const l1=await leerConfirmado(deps.P);if(l1.estado!=='confirmado')return fin({ok:false,motivo:l1.motivo,lectura:l1.estado});
  const A=analizar(l1,{Core:deps.Core});if(!A.ok)return fin({ok:false,motivo:A.motivo,detalle:A.detalle});
  const cambios=cambiosSinGuardar(A,deps.observado?.());
  if(cambios)return fin({ok:false,motivo:'cambios-sin-guardar'});
  const marca=deps.marca?.()||null;
  const ent={...(deps.entorno?.()||{}),cambios,marca};
  const F=evaluarFuentes(A,ent);const R=resolver(key,F);
  if(!R.preparable)return fin({ok:false,motivo:R.aviso||'receta-bloqueada',receta:R,fuentes:F});
  let I;try{I=await identidad(A,{X:deps.X,digest:deps.digest,marca});}catch(e){return fin({ok:false,motivo:'proyecto-invalido',detalle:e.message});}
  const l2=await leerConfirmado(deps.P);
  if(l2.estado!=='confirmado'||l2.revision!==l1.revision)return fin({ok:false,motivo:'revision-movida'});
  const r=receta(key);
  const seleccion={receta:key,version:r.version,catalogo:CAT.catalogo,idioma,acreditadas:R.acreditadas,parciales:R.parciales};
  const congelado={revision:I.revisionLocal.revision,contentId:I.trabajo.contentId,proyectoId:I.proyecto.id,entryId:I.proyecto.entryId,
   seleccionSha256:await sha(deps.digest,seleccion),externos:I.externos,receta:{key,version:r.version,nivel:r.nivel,corte:r.corte},idioma,
   fuentes:Object.fromEntries(Object.entries(F).map(([k,v])=>[k,v.estado]))};
  const candidato={schema:'rubik-lab-e3-candidato/1',version:VERSION,estado:'preparado',interno:'Candidato de laboratorio en memoria. No se guarda ni se envía.',
   congelado,huella:await sha(deps.digest,congelado),composicion:{seleccion,resolucion:R},identidades:I,paquete:null};
  return fin({ok:true,candidato,fuentes:F});
 }
 /** N05 · vigencia frente a la revisión confirmada actual (o frente a un expediente leído con el adaptador F0). */
 async function verificar(candidato,actual,{digest}){
  if(!candidato||await sha(digest,candidato.congelado)!==candidato.huella)return {estado:'invalido',motivo:'invalido-alterado'};
  if(actual?.expedienteRechazado)return {estado:'invalido',motivo:'invalido-expediente',detalle:actual.expedienteRechazado};
  if(!actual||!actual.contentId)return {estado:'preparado',motivo:'sin-verificar'};
  const c=candidato.congelado;
  if(actual.contentId!==c.contentId)return {estado:'verificado-desactualizado',motivo:'desactualizado-trabajo'};
  const ext=actual.externos||{};const cambiados=Object.keys(c.externos).filter(k=>actual.externos&&(ext[k]??null)!==(c.externos[k]??null));
  if(cambiados.length)return {estado:'verificado-desactualizado',motivo:'desactualizado-externo',cambiados};
  if(actual.revision!==undefined&&actual.revision!==c.revision)return {estado:'verificado',motivo:'verificado-restaurado'};
  return {estado:'verificado',motivo:'verificado'};
 }
 /** Estado actual para verificar() desde la lectura confirmada de este navegador. */
 async function actualDesdeConfirmado(deps){
  const l=await leerConfirmado(deps.P);if(l.estado!=='confirmado')return {motivo:l.motivo};
  const A=analizar(l,{Core:deps.Core});if(!A.ok)return {motivo:A.motivo};
  const I=await identidad(A,{X:deps.X,digest:deps.digest,marca:deps.marca?.()||null});
  return {contentId:I.trabajo.contentId,revision:I.revisionLocal.revision,externos:I.externos};
 }

 return Object.freeze({VERSION,KEYS,LANGS,CATALOGO:CAT,MATRIZ,T,TF,texto,motivoFuente,nombre,leerConfirmado,analizar,cambiosSinGuardar,identidad,
  evaluarFuentes,resolver,resolverTodas,receta,preparador,preparar,verificar,actualDesdeConfirmado,canon});
});
