'use strict';
// E3 · ADAPTADOR DE LABORATORIO HACIA F0 (continuidad de proyecto). Solo lectura del producto.
// Lee lo que F0 ya publica en master (expediente v1: identidad de contenido, documentos, huellas de imagen y exclusiones)
// desde un PIN de producto de solo lectura (`git archive <sha> js` fuera del repositorio), y lo une al contexto de las
// recetas SIN cambiar su contrato: `ctx.f0` es una clave añadida que ningún evaluador de fuente lee.
// No escribe en el producto, no crea persistencia ni biblioteca, no simula revisión confirmada: hasta F0.2b la revisión
// vive en la sesión de IndexedDB del navegador y aquí se declara ausente, con su motivo.
// Uso como módulo: const A=require('./f0-adaptador.cjs'); const pin=A.cargarPin(dir); const f=await A.leerExpediente(pin,bytes);
const path=require('node:path');

// ---------------------------------------------------------------- pin de producto (solo lectura)
function cargarPin(dir){const js=f=>require(path.join(path.resolve(dir),'js',f));
 const X=js('expediente-core.js');
 for(const k of ['read','pack','contentId','NOT_INCLUDED','VERSION','FORMAT'])if(!(k in X))throw new Error(`El pin ${dir} no tiene el contrato de expediente esperado (falta ${k}).`);
 return {dir:path.resolve(dir),X,Core:js('project-core.js'),Budget:js('budget-core.js')};}

// ---------------------------------------------------------------- fuente F0 desde un expediente
const IMAGEN=/(^|\/)images\//;
async function leerExpediente(pin,bytes){
 const r=await pin.X.read(bytes);// valida TODO (formato, versión, huellas, rutas, geometría, presupuestos) antes de devolver
 const m=r.manifest,files=m?m.files:[],obj=r.kind==='building'?r.building:r.project;
 const subject=r.kind==='building'?{kind:'building',building:r.building}:{kind:'project',project:r.project};
 // Token de imagen = huella SHA-256 de sus bytes reales, tal y como la lista el manifiesto (sin otra autoridad).
 const imageToken=async im=>{const f=files.find(x=>IMAGEN.test(x.path)&&[im.id,im.key,im.path,im.storage&&im.storage.path].filter(Boolean).some(k=>x.path.endsWith(String(k))||x.path.includes(String(k))));
  if(!f)throw new Error(`Imagen ${im.id||im.key} sin huella en el manifiesto.`);return f.sha256;};
 return {
  formato:m?m.format:null,version:m?m.version:null,origen:r.source,
  sujeto:m?m.subject:{kind:r.kind,id:obj.id,name:obj.name},
  contentId:await pin.X.contentId(subject,r.documents,imageToken),
  documentos:{presupuestos:Object.keys(r.documents.budgets),observaciones:Object.keys(r.documents.reviews)},
  imagenes:files.filter(f=>IMAGEN.test(f.path)).map(({path:p,bytes,sha256})=>({path:p,bytes,sha256})),
  noIncluido:(m?m.notIncluded:pin.X.NOT_INCLUDED).slice(),
  revision:null,
  revisionMotivo:'La revisión confirmada vive en la sesión de persistencia (IndexedDB) y el editor no la expone a sus consumidores hasta F0.2b.',
  _documentos:r.documents};
}

// ---------------------------------------------------------------- vigencia por identidad de trabajo (propuesta N05 + F0)
// Hoy N05 compara las huellas del snapshot y del registro. F0 aporta la identidad PORTABLE del trabajo (contentId: igual
// tras restaurar en otro navegador con otro id, distinta si cambian geometría, bytes de imagen o documentos).
// Mismo vocabulario que tools/estado-entrega.cjs; no lo sustituye ni lo modifica.
function vigencia({congeladoContentId=null,fuente}){
 if(!fuente||!fuente.contentId)return {vigencia:'sin-fuente',estado:null,motivo:'No hay expediente F0 que comparar.'};
 if(!congeladoContentId)return {vigencia:'sin-vincular',estado:null,motivo:'El candidato se preparó antes de F0: solo cuentan las huellas de snapshot y registro.'};
 return congeladoContentId===fuente.contentId?{vigencia:'vigente',estado:'verificado',motivo:null}
  :{vigencia:'desactualizado',estado:'verificado-desactualizado',motivo:'El trabajo del expediente ya no es el que se congeló (geometría, imágenes o documentos distintos). Preparar un candidato nuevo.'};
}
/** Contexto de recetas + F0. No altera REG, S ni aportaciones: las 21 recetas resuelven exactamente igual. */
function vincular(ctx,fuente,{congeladoContentId=null}={}){
 const {_documentos,...publico}=fuente;return {...ctx,f0:{...publico,...vigencia({congeladoContentId,fuente})}};}

// ---------------------------------------------------------------- mapa de dependencias de las 43 fuentes de receta
// estado: expediente  disponible hoy en master (dd528119) leyendo el expediente v1
//         motor       se calcula con los motores del producto a partir de la geometría (sin dato persistente propio)
//         F0.2b       el dato existe, pero sus consumidores (presupuestos, observaciones, editor) aún no usan la sesión
//         F0.3        requiere historial de versiones o recuperación visible (candidatos F0.3 del contrato)
//         exp-v2      requiere expediente v2 con subjects[] y variantOf (§7 del contrato de expediente)
//         excluido    el expediente v1 lo excluye expresamente (notIncluded); hace falta decidir su autoridad
//         aportacion  texto o dato del profesional; hoy fixture rotulada del laboratorio (sin autoridad de producto)
//         sin-fuente  el modelo canónico no lo contiene
//         fuera       corte de obra, comercial o F1; fuera del alcance de F0
const E=(estado,f0,nota)=>({estado,f0,nota});
const MAPA={
 geometria:E('expediente','project.json / building.json','contentId incluye geometría y metadatos sin ids locales'),
 superficies:E('motor','FloorPlanSurfaceMetrics sobre la geometría del expediente','Sin dato persistente propio'),
 vistas3d:E('sin-fuente','—','Las vistas se calculan; el modelo canónico no guarda cámaras (project-core sin «camera»)'),
 imagenesIA:E('sin-fuente','—','El resultado visual (Render IA) no es parte del expediente ni del modelo canónico'),
 dibujoVivo:E('motor','motores de presentación sobre la geometría',''),
 recorrido:E('motor','motores de presentación sobre la geometría',''),
 materiales:E('expediente','project.materials',''),
 objetos:E('expediente','project.objects',''),
 presupuesto:E('expediente','documents/budget-*.json (FloorPlanBudgetV1 validado)',''),
 presupuestoRevisado:E('F0.2b','revision-budget-core + revisión confirmada','El presupuesto viaja; su revisión confirmada no se expone hasta F0.2b'),
 planObra:E('excluido','construction-record','notIncluded del expediente v1'),
 vinculoPlanPresupuesto:E('excluido','construction-record','notIncluded del expediente v1'),
 concepto:E('aportacion','—',''),
 marca:E('excluido','brand-profiles','notIncluded; en el laboratorio sigue siendo identidad sintética rotulada'),
 seccionFachadas:E('motor','building-core / alzados sobre la geometría',''),
 dimensionesHuecos:E('expediente','project.openings (widthMm, heightMm, sillHeightMm)',''),
 revisionAnterior:E('F0.3','historial de versiones','F0.2b da la revisión confirmada; la anterior requiere historial (candidato F0.3)'),
 variantesGuardadas:E('exp-v2','subjects[] + relation.variantOf','variant-links está en notIncluded del v1'),
 fotosAportadas:E('expediente','images/… (huella SHA-256 de bytes reales)',''),
 norte:E('sin-fuente','—','El modelo no tiene orientación con fuente'),
 alcanceServicios:E('aportacion','—',''),
 honorarios:E('excluido','studio-tariff','notIncluded del expediente v1'),
 exclusiones:E('aportacion','—',''),
 validezOferta:E('aportacion','—',''),
 precioInmueble:E('aportacion','—','Solo fixture atribuida y rotulada'),
 impuestosCompra:E('aportacion','—',''),
 referenciasMoodboard:E('aportacion','—','Sin terceros: vistas del propio modelo'),
 ofertaTecnica:E('aportacion','—',''),
 catalogoProductos:E('F0.2b','catalog-budget-core / cat04 con la sesión','Ya reciben storage; falta pasarles la sesión'),
 preciosVerificados:E('fuera','corte económico','Ningún precio real en el laboratorio'),
 ofertasIndependientes:E('fuera','corte económico',''),
 motivoCambio:E('aportacion','—','Atribuido por quien propone el cambio'),
 observacionesObra:E('fuera','OBR','assistant-log y construction-record fuera del v1'),
 certificadosObra:E('fuera','OBR',''),
 actasVisita:E('fuera','OBR',''),
 especificacionValidada:E('fuera','validación competente',''),
 punchList:E('fuera','OBR',''),
 revisionEjecutada:E('fuera','E6 / F1',''),
 manualesGarantias:E('fuera','F1',''),
 costeLiquidado:E('fuera','corte económico futuro',''),
 actasEntrega:E('fuera','OBR',''),
 evidenciaEjecutada:E('fuera','OBR / F1',''),
 archivoPropietario:E('fuera','F1','')};
/** Exclusiones del expediente que el mapa debe cubrir (sin dato huérfano). */
const EXCLUSION_A_FUENTES={'brand-profiles':['marca'],'studio-tariff':['honorarios'],'construction-record':['planObra','vinculoPlanPresupuesto'],'variant-links':['variantesGuardadas'],'assistant-log':['observacionesObra'],'published-links':[]};

module.exports={cargarPin,leerExpediente,vigencia,vincular,MAPA,EXCLUSION_A_FUENTES};
