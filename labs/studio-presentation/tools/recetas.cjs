// v1.4 · N01 · CATÁLOGO DE RECETAS RP01–RP21 del anexo de entregables profesionales (laboratorio).
// Una receta es una SELECCIÓN SEMÁNTICA de piezas que ya existen: modalidad base (uno de los 7 tipos de entrega),
// capítulos y documentos del catálogo único (catalogo-entrega.cjs). No es un motor, un tipo documental, un perfil
// Story, un octavo preset ni un ID de catálogo de producto. Los códigos RP son requisitos internos del anexo.
//
// Niveles (anexo §4):
//   L  se exporta de verdad con exportar.cjs si sus fuentes mínimas existen; si faltan fuentes de la receta completa,
//      sale como «L parcial» y nombra lo que falta. Nunca rellena con ceros ni deriva un dato de otro.
//   C  contrato y evaluación de elegibilidad sobre datos reales; proyecta lo disponible. Sin descarga de cliente.
//   F  contrato, dependencias y prueba de indisponibilidad. Sin descarga de cliente.
//
// Fuentes: cada una se evalúa sobre el snapshot y el registro de la entrega compuesta. Las que el contrato del proyecto
// no tiene (honorarios, precio del inmueble, ofertas, actas…) solo existen si se aportan como FIXTURE atribuida
// (ctx.aportaciones); entonces se validan (moneda, alcance, unidad) y quedan rotuladas «aportado (fixture)».
// Perfiles (AR, AT, IN, RE, CO, IM) y fases (A, D, P) solo FILTRAN y recomiendan: no cambian datos, marca ni selección.
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const CAT=require('./catalogo-entrega.cjs');
const VERSION='rubik-lab-recetas/1';

const PERFILES={AR:{es:'Arquitectura',en:'Architecture'},AT:{es:'Arquitectura técnica',en:'Building surveying'},IN:{es:'Interiorismo',en:'Interior design'},
 RE:{es:'Reformas',en:'Renovation'},CO:{es:'Construcción',en:'Construction'},IM:{es:'Inmobiliaria y promoción',en:'Real estate and development'}};
const FASES={A:{es:'Antes del proyecto',en:'Before the project'},D:{es:'Durante el proyecto',en:'During the project'},P:{es:'Después de la obra',en:'After the works'}};
const FAMILIAS={tecnica:{es:'Técnica',en:'Technical'},editorial:{es:'Editorial',en:'Editorial'},comercial:{es:'Comercial',en:'Commercial'}};
const TIPOS_DOC=['Architecture Book','Interior Design Book','Materials & Furniture Book','Commercial Proposal','Real Estate Presentation'];
const MODALIDADES=['integral','primera-reunion','propuesta-comercial','dossier-tecnico','interiorismo','inmobiliaria','obra'];
const STORY=['real-estate','developer','architecture','renovation','interior-design']; // perfiles Story del producto (master@8525025), otro eje

// ---------------------------------------------------------------- fuentes
const ok=(autoridad,nota)=>({estado:'disponible',autoridad,nota});
const parcial=(autoridad,nota)=>({estado:'parcial',autoridad,nota});
const no=nota=>({estado:'ausente',autoridad:null,nota});
const SIN_CAMPO='El contrato del proyecto (snapshot) no tiene este dato. Solo puede llegar como aportación atribuida del estudio.';
// Aportación de laboratorio: {valor, atribucion}. Sin atribución no se acepta.
const aport=(ctx,id,validar)=>{const a=ctx.aportaciones?.[id];if(!a)return null;
 if(!a.atribucion||typeof a.atribucion!=='string')return {estado:'incompatible',autoridad:null,nota:'Aportación sin atribución: no se acepta.'};
 const v=validar?validar(a.valor):null;if(v)return {estado:'incompatible',autoridad:null,nota:v};
 return {estado:'disponible',autoridad:'aportado (fixture de laboratorio)',nota:a.atribucion};};
const absentOr=(id,validar,nota=SIN_CAMPO)=>ctx=>aport(ctx,id,validar)||no(nota);
const budget=ctx=>ctx.S.budget?.test?.view?.client||null;
const pieces=(ctx,re)=>(ctx.REG?.pieces||[]).filter(p=>re.test(p.file));
const composed=(ctx,c)=>(ctx.REG?.tipos||[]).find(t=>t.tipo==='integral')?.chapters.includes(c);
const isNum=x=>typeof x==='number'&&Number.isFinite(x);

const FUENTES={
 geometria:{es:'Geometría del proyecto (muros, huecos, estancias)',en:'Project geometry (walls, openings, rooms)',
  eval:ctx=>{const g=ctx.S.geometry;return g?.rooms?.length&&g?.walls?.length?ok('núcleo del proyecto',`${g.walls.length} muros, ${g.openings.length} huecos, ${g.rooms.length} estancias; revisión ${ctx.S.project.revision}.`):no('Sin geometría en el snapshot.');}},
 superficies:{es:'Cuadro de superficies',en:'Table of areas',
  eval:ctx=>{const s=ctx.S.summary;return isNum(s?.areaM2)?ok('cálculo del producto, escala estimada',`${s.roomsCounted} estancias computadas; escala ${s.scale==='estimated'?'estimada':s.scale}.`):no('Sin superficies calculadas.');}},
 vistas3d:{es:'Vistas 3D del modelo',en:'3D model views',eval:ctx=>ctx.S.views?.length?ok('modelo 3D del producto',`${ctx.S.views.length} vistas.`):no('Sin vistas preparadas.')},
 imagenesIA:{es:'Imágenes con IA',en:'AI images',eval:ctx=>{const n=pieces(ctx,/^media\/ia-/).length;return n?ok('orientativa',`${n} imágenes, siempre junto a su vista del modelo.`):no('Sin imágenes IA.');}},
 dibujoVivo:{es:'Dibujo vivo (fotograma de la apertura)',en:'Living drawing (opening frame)',eval:ctx=>composed(ctx,'dibujo')?ok('fotograma auténtico del producto','Un fotograma; no es una exportación de la transformación.'):no('Sin fotograma.')},
 recorrido:{es:'Vídeo de recorrido',en:'Walkthrough video',eval:ctx=>composed(ctx,'recorrido')?ok('vídeo exportado por el producto','MP4 local; no es la visita 3D interactiva.'):no('Sin vídeo de recorrido.')},
 materiales:{es:'Materiales del modelo',en:'Model materials',eval:ctx=>ctx.S.materials?.length?ok('colores del modelo, no muestras físicas',`${ctx.S.materials.length} materiales.`):no('Sin materiales.')},
 objetos:{es:'Objetos colocados (mobiliario y equipamiento)',en:'Placed objects (furniture and equipment)',eval:ctx=>ctx.S.objects?.length?ok('instancias del modelo',`${ctx.S.objects.length} instancias.`):no('Sin objetos.')},
 presupuesto:{es:'Presupuesto canónico',en:'Canonical budget',
  eval:ctx=>{const v=budget(ctx);if(!v)return no('El proyecto no tiene presupuesto con precios.');const s=v.summary;
   const t=`${s.items} partidas en ${s.chapters} capítulos; precios de prueba del laboratorio.`;
   return s.net?.complete&&!s.unpriced&&!s.unavailable&&!s.incomplete?ok('motor económico del producto (precios de prueba)',t):parcial('motor económico del producto (parcial)',t+' Hay partidas sin precio o incompletas.');}},
 presupuestoRevisado:{es:'Presupuesto revisado por el estudio',en:'Budget reviewed by the studio',
  eval:ctx=>{const s=budget(ctx)?.summary;if(!s)return no('Sin presupuesto.');return s.unreviewed?no(`${s.unreviewed} de ${s.items} partidas sin revisar por el estudio.`):ok('revisado por el estudio',`${s.items} partidas revisadas.`);}},
 planObra:{es:'Plan de obra (FT3D-8)',en:'Works plan (FT3D-8)',
  eval:ctx=>composed(ctx,'obra')?parcial('orientativo: plan de ejemplo, fechas ilustrativas, sin partidas vinculadas','Plan importado de la demo y ajustado al proyecto (assets/ft3d8-plan-ajuste.json).'):no('Sin plan de obra.')},
 vinculoPlanPresupuesto:{es:'Vínculo acreditado entre plan y presupuesto',en:'Proven link between plan and budget',eval:absentOr('vinculoPlanPresupuesto',null,'El plan de ejemplo no tiene partidas vinculadas: la economía del plan no se puede mostrar.')},
 concepto:{es:'Concepto del estudio (texto aportado)',en:'Studio concept (contributed text)',eval:ctx=>(ctx.S.brand?.intro||'').trim()?ok('texto del profesional, atribuido','No se traduce ni se reescribe.'):no('El estudio no ha escrito el concepto.')},
 marca:{es:'Identidad del estudio',en:'Studio identity',eval:ctx=>{const p=ctx.S.brand?.profile;return p?.name?(/\.invalid$/.test(p.email||'')?parcial('perfil sintético del laboratorio',p.name):ok('perfil de «Mi estudio»',p.name)):no('Sin perfil del estudio.');}},
 seccionFachadas:{es:'Sección y fachadas esquemáticas (FT3D-3/FT3D-4)',en:'Schematic section and facades (FT3D-3/FT3D-4)',
  eval:ctx=>{const d=ctx.snapDir&&path.join(ctx.snapDir,'derivados');const a=d&&fs.existsSync(path.join(d,'ft3d3-seccion.json')),b=d&&fs.existsSync(path.join(d,'ft3d4-fachadas.json'));
   return a&&b?ok('derivados del producto, esquemáticos','No son sección constructiva ni alzados.'):no('Sin derivados FT3D-3/FT3D-4.');}},
 dimensionesHuecos:{es:'Dimensiones completas de huecos (ancho, alto, sentido)',en:'Full opening dimensions (width, height, swing)',
  eval:ctx=>{const o=ctx.S.geometry?.openings||[];if(!o.length)return no('Sin huecos.');const h=o.filter(x=>isNum(x.heightMm)).length;
   return h===o.length?ok('modelo','Ancho y alto en todos los huecos.'):parcial('modelo',`Ancho en ${o.filter(x=>isNum(x.widthMm)).length} de ${o.length} huecos; alto en ${h}. Sin alto no hay hoja de carpintería.`);}},
 revisionAnterior:{es:'Revisión anterior vinculada y comparable (estado actual)',en:'Linked, comparable previous revision (current state)',
  eval:absentOr('revisionAnterior',v=>v?.revision&&v?.proyecto?null:'La revisión aportada no declara proyecto y revisión.','El snapshot tiene una sola revisión: no hay estado actual ni antes/después.')},
 variantesGuardadas:{es:'Variantes guardadas del proyecto (opciones)',en:'Saved project variants (options)',eval:absentOr('variantesGuardadas',v=>Array.isArray(v)&&v.length>=2?null:'Hacen falta al menos dos variantes guardadas.','El snapshot es un único proyecto: no se presenta como si fueran dos opciones.')},
 fotosAportadas:{es:'Fotos del estado actual aportadas',en:'Contributed photos of the current state',eval:absentOr('fotosAportadas')},
 norte:{es:'Norte u orientación con fuente',en:'North or orientation with a source',eval:absentOr('norte',null,'El proyecto no tiene norte: no se indica orientación.')},
 alcanceServicios:{es:'Alcance, fases y entregables del encargo',en:'Scope, phases and deliverables of the commission',eval:absentOr('alcanceServicios')},
 honorarios:{es:'Honorarios aportados por fase',en:'Fees contributed per phase',
  eval:absentOr('honorarios',v=>Array.isArray(v)&&v.length&&v.every(x=>x.fase&&isNum(x.importe)&&x.moneda)?null:'Cada honorario necesita fase, importe y moneda.','El snapshot no tiene honorarios. Nunca se derivan del coste de obra.')},
 exclusiones:{es:'Exclusiones del encargo',en:'Exclusions of the commission',eval:absentOr('exclusiones')},
 validezOferta:{es:'Validez de la oferta',en:'Offer validity',eval:absentOr('validezOferta')},
 precioInmueble:{es:'Precio del inmueble aportado',en:'Contributed property price',eval:absentOr('precioInmueble',v=>isNum(v?.importe)&&v.moneda?null:'Precio sin importe o moneda.','Precio no consta (no es cero).')},
 impuestosCompra:{es:'Impuestos de compra aportados',en:'Contributed purchase taxes',eval:absentOr('impuestosCompra',null,'No constan: no se infieren del precio.')},
 referenciasMoodboard:{es:'Referencias de moodboard con derechos',en:'Moodboard references with rights',eval:absentOr('referenciasMoodboard',null,'Sin referencias aportadas: no se buscan ni se generan imágenes.')},
 ofertaTecnica:{es:'Oferta técnica aportada',en:'Contributed technical offer',eval:absentOr('ofertaTecnica')},
 catalogoProductos:{es:'Referencias de producto acreditadas (SKU, marca)',en:'Accredited product references (SKU, brand)',
  eval:ctx=>{const n=(ctx.S.objects||[]).filter(o=>o.catalogRef).length;return n?parcial('catálogo acreditado',`${n} de ${ctx.S.objects.length} objetos con referencia.`):aport(ctx,'catalogoProductos')||no(`Ninguno de los ${(ctx.S.objects||[]).length} objetos tiene referencia de catálogo: son genéricos del modelo.`);}},
 preciosVerificados:{es:'Precios de producto verificados',en:'Verified product prices',eval:absentOr('preciosVerificados',null,'Sin precios de producto: «no valorado», nunca cero.')},
 ofertasIndependientes:{es:'Ofertas independientes comparables',en:'Comparable independent offers',
  eval:absentOr('ofertasIndependientes',v=>{if(!Array.isArray(v)||v.length<2)return 'Hacen falta al menos dos ofertas independientes.';
   const k=x=>[x.moneda,x.ivaIncluido,x.alcance].join('|');if(!v.every(x=>x.proveedor&&x.moneda&&typeof x.ivaIncluido==='boolean'&&x.alcance))return 'Cada oferta necesita proveedor, moneda, IVA y alcance.';
   if(new Set(v.map(x=>x.proveedor)).size<v.length)return 'Dos ofertas del mismo proveedor no son independientes.';
   if(new Set(v.map(k)).size>1)return 'Moneda, IVA o alcance no comparables: no se homologa por suposición.';return null;},'Sin ofertas aportadas: no se compara el presupuesto consigo mismo.')},
 motivoCambio:{es:'Motivo del cambio atribuido',en:'Attributed reason for the change',eval:absentOr('motivoCambio')},
 observacionesObra:{es:'Observaciones de obra reales (fecha, autor)',en:'Real site observations (date, author)',eval:absentOr('observacionesObra',v=>Array.isArray(v)&&v.every(x=>x.fecha&&x.autor)?null:'Cada observación necesita fecha y autor.','No hay registros de obra: una proyección no es avance.')},
 certificadosObra:{es:'Certificaciones de obra aportadas',en:'Contributed progress certificates',eval:absentOr('certificadosObra')},
 actasVisita:{es:'Actas de visita, RFI y decisiones',en:'Site visit minutes, RFIs and decisions',eval:absentOr('actasVisita')},
 especificacionValidada:{es:'Especificación de ejecución validada por técnico competente',en:'Execution specification validated by a competent professional',eval:absentOr('especificacionValidada')},
 punchList:{es:'Lista de remates observada',en:'Observed punch list',eval:absentOr('punchList')},
 revisionEjecutada:{es:'Revisión ejecutada y validada (as-built)',en:'Executed and validated revision (as-built)',eval:absentOr('revisionEjecutada')},
 manualesGarantias:{es:'Manuales y garantías aportados',en:'Contributed manuals and warranties',eval:absentOr('manualesGarantias')},
 costeLiquidado:{es:'Coste real liquidado',en:'Settled actual cost',eval:absentOr('costeLiquidado',null,'No se infiere del presupuesto.')},
 actasEntrega:{es:'Actas de entrega y aceptación',en:'Handover and acceptance records',eval:absentOr('actasEntrega',null,'No se simula ninguna firma ni aceptación.')},
 evidenciaEjecutada:{es:'Evidencia de lo ejecutado (fotos reales de obra)',en:'Evidence of the executed works (real site photos)',eval:absentOr('evidenciaEjecutada',null,'Las imágenes del diseño no son evidencia de lo ejecutado.')},
 archivoPropietario:{es:'Archivo del propietario disponible por contrato',en:'Owner archive available by contract',eval:absentOr('archivoPropietario',null,'Un ZIP no es un portal: el archivo del propietario requiere contrato (E6/E7).')}};

// ---------------------------------------------------------------- recetas
// sel: modalidad base y selección explícita (capítulos sin «portada»; documentos del catálogo). completas: fuentes de la
// receta completa del anexo; si faltan, la receta L sale como parcial y lo dice.
const R=(o)=>({version:1,opcionales:[],completas:[],economia:'no-aplica',...o});
const RECETAS=[
 R({key:'RP01',es:'Alcance, servicios y honorarios',en:'Scope, services and fees',fases:['A'],perfiles:['AR','AT','IN','RE'],familia:'comercial',tipo:'Commercial Proposal',modulos:['01','02','08','10'],nivel:'L',corte:'E3',
  sel:{tipo:'propuesta-comercial',capitulos:['concepto','presupuesto','decisiones','documentos','procedencia'],documentos:['commercial-proposal-client-v3']},
  requeridas:['presupuesto','marca'],completas:['alcanceServicios','honorarios','exclusiones','validezOferta'],opcionales:['concepto'],economia:'presupuesto-canonico',
  autoridad:{es:'Honorarios nunca derivados del coste de obra.',en:'Fees are never derived from the construction cost.'}}),
 R({key:'RP02',es:'Viabilidad y estado actual',en:'Feasibility and current state',fases:['A'],perfiles:['AR','AT','IM'],familia:'tecnica',tipo:'Architecture Book',modulos:['01','03','06','10'],nivel:'L',corte:'E3/E4',
  sel:{tipo:'dossier-tecnico',capitulos:['vivienda','estancias','documentos','procedencia'],documentos:['architecture-book','architecture-sheet-strip']},
  requeridas:['geometria','superficies'],completas:['revisionAnterior','fotosAportadas'],opcionales:['vistas3d'],
  autoridad:{es:'Resultado orientativo: sin restricciones urbanísticas, patologías ni encaje real.',en:'Indicative result: no planning constraints, defects or real fit.'}}),
 R({key:'RP03',es:'Anteproyecto integral y opciones',en:'Integrated outline design and options',fases:['A'],perfiles:['AR','IN','RE'],familia:'editorial',tipo:'Interior Design Book',modulos:['01','02','03','04','05','06','07','08','09','10'],nivel:'L',corte:'E2/E3',
  sel:{tipo:'integral'},requeridas:['geometria','vistas3d'],completas:['variantesGuardadas'],opcionales:['concepto','presupuesto','planObra','imagenesIA','dibujoVivo','recorrido'],economia:'presupuesto-canonico',
  autoridad:{es:'Un único proyecto no se presenta como dos opciones.',en:'A single project is not presented as two options.'}}),
 R({key:'RP04',es:'Vivienda y potencial de reforma',en:'Home and renovation potential',fases:['A'],perfiles:['IM','RE'],familia:'comercial',tipo:'Real Estate Presentation',modulos:['01','03','04','05','06','08','10'],nivel:'L',corte:'E3',
  sel:{tipo:'inmobiliaria',capitulos:['vivienda','dibujo','estancias','presupuesto','recorrido','documentos','procedencia'],documentos:['real-estate-sheet-v3']},
  requeridas:['geometria','superficies'],completas:['precioInmueble','impuestosCompra','revisionAnterior'],opcionales:['presupuesto','recorrido','dibujoVivo'],economia:'presupuesto-canonico',
  autoridad:{es:'Compra, reforma e impuestos en bloques separados; precio no consta no es cero.',en:'Purchase, renovation and taxes in separate blocks; a missing price is not zero.'}}),
 R({key:'RP05',es:'Estimación económica inicial',en:'Initial cost estimate',fases:['A'],perfiles:['AT','RE','CO'],familia:'comercial',tipo:'Commercial Proposal',modulos:['01','08','10'],nivel:'L',corte:'E3',
  sel:{tipo:'propuesta-comercial',capitulos:['presupuesto','documentos','procedencia'],documentos:['commercial-proposal-client-v3']},
  requeridas:['presupuesto'],economia:'presupuesto-canonico',autoridad:{es:'Sin garantía de coste final, plazos ni fiscalidad.',en:'No guarantee of final cost, timing or taxation.'}}),
 R({key:'RP06',es:'Concepto, moodboard y opciones',en:'Concept, moodboard and options',fases:['A'],perfiles:['IN','AR'],familia:'editorial',tipo:'Interior Design Book',modulos:['01','02','04','06','07','10'],nivel:'L',corte:'E3/E4',
  sel:{tipo:'interiorismo',capitulos:['concepto','dibujo','estancias','materiales','decisiones','documentos','procedencia'],documentos:['interior-book-v3','materials-furniture-book-v3']},
  requeridas:['vistas3d','materiales'],completas:['concepto','referenciasMoodboard'],opcionales:['imagenesIA','dibujoVivo'],
  autoridad:{es:'No se inventan fotos, compras ni preferencias.',en:'No photos, purchases or preferences are invented.'}}),
 R({key:'RP07',es:'Ficha comercial de vivienda',en:'Home sales sheet',fases:['A'],perfiles:['IM'],familia:'comercial',tipo:'Real Estate Presentation',modulos:['01','03','05','06','10'],nivel:'L',corte:'E3',
  sel:{tipo:'inmobiliaria',capitulos:['vivienda','dibujo','estancias','recorrido','documentos','procedencia'],documentos:['real-estate-sheet-v3-sin-presupuesto']},
  requeridas:['geometria','superficies','vistas3d'],opcionales:['recorrido','dibujoVivo','norte','revisionAnterior'],economia:'sin-importes',
  autoridad:{es:'Ningún importe en ningún archivo de la entrega.',en:'No amounts in any file of the delivery.'}}),
 R({key:'RP08',es:'Oferta técnica y planificación',en:'Technical offer and planning',fases:['A'],perfiles:['CO','RE'],familia:'comercial',tipo:'Commercial Proposal',modulos:['01','08','09','10'],nivel:'L',corte:'E3/E4',
  sel:{tipo:'obra',capitulos:['vivienda','obra','decisiones','documentos','procedencia'],documentos:['architecture-sheet-strip']},
  requeridas:['planObra'],completas:['ofertaTecnica','exclusiones','vinculoPlanPresupuesto'],economia:'sin-economia-del-plan',
  autoridad:{es:'Plan orientativo; sin vínculo acreditado, el plan no lleva importes.',en:'Indicative plan; without a proven link, the plan carries no amounts.'}}),
 R({key:'RP09',es:'Architecture Book y juego de láminas',en:'Architecture Book and sheet set',fases:['D'],perfiles:['AR','AT','RE'],familia:'tecnica',tipo:'Architecture Book',modulos:['01','03','04','05','06','07','10'],nivel:'L',corte:'E4',
  sel:{tipo:'dossier-tecnico',capitulos:['vivienda','estancias','documentos','procedencia'],documentos:['architecture-book','architecture-sheet-strip']},
  requeridas:['geometria','superficies'],completas:['revisionAnterior','dimensionesHuecos'],opcionales:['seccionFachadas'],
  autoridad:{es:'Escala estimada sobre el modelo: no apta para replanteo.',en:'Estimated scale on the model: not for setting out.'}}),
 R({key:'RP10',es:'Memoria descriptiva y superficies',en:'Descriptive report and areas',fases:['D'],perfiles:['AR','AT'],familia:'tecnica',tipo:'Architecture Book',modulos:['01','02','03','04','10'],nivel:'L',corte:'E4',
  sel:{tipo:'dossier-tecnico',capitulos:['concepto','vivienda','estancias','documentos','procedencia'],documentos:['architecture-book']},
  requeridas:['geometria','superficies'],completas:['revisionAnterior'],opcionales:['concepto'],
  autoridad:{es:'Memoria del modelo, no memoria constructiva.',en:'Report of the model, not a construction report.'}}),
 R({key:'RP11',es:'Libro FF&E y fichas de activos',en:'FF&E book and asset sheets',fases:['D'],perfiles:['IN','AR','IM'],familia:'editorial',tipo:'Materials & Furniture Book',modulos:['01','06','07','10'],nivel:'L',corte:'E4',
  sel:{tipo:'interiorismo',capitulos:['estancias','materiales','documentos','procedencia'],documentos:['materials-furniture-book-v3']},
  requeridas:['objetos','materiales'],completas:['catalogoProductos','preciosVerificados'],opcionales:['imagenesIA'],
  autoridad:{es:'Genérico del modelo frente a producto con referencia; precio solo verificado.',en:'Generic model item versus referenced product; price only when verified.'}}),
 R({key:'RP12',es:'Mediciones y presupuesto detallado',en:'Quantities and detailed budget',fases:['D'],perfiles:['AT','AR','RE','CO'],familia:'comercial',tipo:'Commercial Proposal',modulos:['01','03','08','10'],nivel:'L',corte:'E3/E5',
  sel:{tipo:'dossier-tecnico',capitulos:['vivienda','presupuesto','documentos','procedencia'],documentos:['commercial-proposal-client-v3']},
  requeridas:['presupuesto'],completas:['presupuestoRevisado'],economia:'presupuesto-canonico',
  autoridad:{es:'No es medición oficial, BC3 ni normativa.',en:'Not an official measurement, BC3 file or code compliance.'}}),
 R({key:'RP13',es:'Comparativo de ofertas homologadas',en:'Comparison of standardised offers',fases:['D'],perfiles:['AT','CO','RE'],familia:'comercial',tipo:'Commercial Proposal',modulos:['01','08','10'],nivel:'C',corte:'corte económico específico',
  requeridas:['ofertasIndependientes','presupuesto'],contrato:['proveedor','moneda','IVA','alcance','unidad','fecha de la oferta'],autoridad:{es:'Sin ofertas no hay comparación.',en:'No offers, no comparison.'}}),
 R({key:'RP14',es:'Orden de cambio de diseño u obra',en:'Design or works change order',fases:['D'],perfiles:['RE','AR','AT','IN','CO'],familia:'tecnica',tipo:'Architecture Book',modulos:['01','03','04','05','08','09','10'],nivel:'C',corte:'E2/E3 (ENT-04)',
  requeridas:['revisionAnterior','motivoCambio'],opcionales:['planObra'],contrato:['revisión base','revisión propuesta','motivo atribuido','diferencias canónicas','delta económico solo si ambas revisiones son coherentes (A25)','plazo solo con plan válido'],
  autoridad:{es:'La conformidad no se infiere.',en:'Approval is never inferred.'}}),
 R({key:'RP15',es:'Seguimiento y certificaciones de obra',en:'Works monitoring and progress certificates',fases:['D'],perfiles:['CO','AT','RE','IM'],familia:'tecnica',tipo:'Architecture Book',modulos:['01','05','06','08','09','10'],nivel:'C',corte:'E3/E6 + OBR',
  requeridas:['planObra','observacionesObra','certificadosObra'],contrato:['previsto','simulado','declarado por terceros','observado (fecha, autor, ubicación)'],autoridad:{es:'Una proyección no es avance certificado.',en:'A projection is not certified progress.'}}),
 R({key:'RP16',es:'Visita, actas, RFI y decisiones',en:'Site visit, minutes, RFIs and decisions',fases:['D'],perfiles:['AR','AT','CO','RE'],familia:'tecnica',tipo:null,modulos:['01','06','09','10'],nivel:'F',corte:'OBR futuro',
  requeridas:['actasVisita'],contrato:['fecha','participantes','observaciones','hechos, propuestas y decisiones separados','responsables','fuentes autorizadas'],autoridad:{es:'No se crean actas.',en:'No minutes are created.'}}),
 R({key:'RP17',es:'Personalización y especificación técnica',en:'Customisation and technical specification',fases:['D'],perfiles:['IN','AR','IM'],familia:'editorial',tipo:'Materials & Furniture Book',modulos:['01','04','06','07','10'],nivel:'C',corte:'E4 (ENT-05)',
  requeridas:['materiales','objetos','catalogoProductos','especificacionValidada'],contrato:['selección de acabados actual','alternativas','especificación de ejecución validada'],autoridad:{es:'La especificación de ejecución exige validación competente.',en:'An execution specification needs competent validation.'}}),
 R({key:'RP18',es:'Recepción y remates',en:'Handover and punch list',fases:['P'],perfiles:['RE','CO','AT'],familia:'tecnica',tipo:null,modulos:['01','06','09','10'],nivel:'F',corte:'OBR futuro',
  requeridas:['punchList'],contrato:['ubicación','estado observado','responsable','cierre aceptado expresamente'],autoridad:{es:'No se infiere de la geometría ni del plan.',en:'Not inferred from geometry or the plan.'}}),
 R({key:'RP19',es:'As-built y manual de mantenimiento',en:'As-built and maintenance manual',fases:['P'],perfiles:['AR','AT','CO','RE'],familia:'tecnica',tipo:null,modulos:['01','03','07','10'],nivel:'F',corte:'E6 / alcance futuro',
  requeridas:['revisionEjecutada','manualesGarantias'],contrato:['revisión ejecutada validada','manuales','garantías','planos de instalaciones solo con evidencia'],autoridad:{es:'No es el Libro del Edificio reglamentario.',en:'Not the statutory building logbook.'}}),
 R({key:'RP20',es:'Liquidación, garantías y entrega de llaves',en:'Final account, warranties and key handover',fases:['P'],perfiles:['CO','AT','RE','IM'],familia:'comercial',tipo:null,modulos:['01','07','08','10'],nivel:'F',corte:'corte futuro',
  requeridas:['costeLiquidado','manualesGarantias','actasEntrega'],contrato:['coste liquidado','desviación homologada','garantías','actas'],autoridad:{es:'No se simula ninguna firma.',en:'No signature is simulated.'}}),
 R({key:'RP21',es:'Dossier del propietario y portfolio final',en:'Owner dossier and final portfolio',fases:['P'],perfiles:['IM','IN','RE','AR'],familia:'editorial',tipo:'Interior Design Book',modulos:['01','03','05','06','07','10'],nivel:'C',corte:'E6/E7',
  requeridas:['evidenciaEjecutada','archivoPropietario'],opcionales:['imagenesIA','recorrido'],contrato:['imágenes del diseño frente a evidencia ejecutada','visita y archivo por contrato','sin datos ajenos'],
  autoridad:{es:'Las imágenes del diseño no prueban la ejecución.',en:'Design images do not prove execution.'}})];

// ---------------------------------------------------------------- evaluación y resolución
const evalFuentes=(ctx,ids)=>Object.fromEntries(ids.map(id=>{const f=FUENTES[id];if(!f)throw new Error('Fuente desconocida en el catálogo: '+id);return [id,f.eval(ctx)];}));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
// Contexto desde la entrega compuesta (registro + snapshot que este declara).
const contexto=(LAB,src,aportaciones)=>{const REG=JSON.parse(fs.readFileSync(path.join(src,'entrega.json'),'utf8'));const snapFile=path.resolve(LAB,REG.snapshot.file);
 return {REG,S:JSON.parse(fs.readFileSync(snapFile,'utf8')),snapDir:path.dirname(snapFile),aportaciones:aportaciones||null};};
const filtrar=({perfil,fase}={})=>{if(perfil&&!PERFILES[perfil])throw new Error('Perfil desconocido: '+perfil);if(fase&&!FASES[fase])throw new Error('Fase desconocida: '+fase);
 return RECETAS.filter(r=>(!perfil||r.perfiles.includes(perfil))&&(!fase||r.fases.includes(fase)));};
// Resolución: estado de la receta y, para L, la selección exacta para exportar.cjs (contrato v1.3 sin cambios).
function resolver(key,ctx,lang='es'){
 const r=RECETAS.find(x=>x.key===key);if(!r)return {key,estado:'desconocida',emitible:false,motivo:[`Receta desconocida: ${JSON.stringify(key)}. Admitidas: RP01–RP21.`]};
 if(!CAT.IDIOMAS.includes(lang))return {key,estado:'idioma-no-valido',emitible:false,motivo:[`Idioma no válido: ${JSON.stringify(lang)}.`]};
 // En una receta L las aportaciones de fixture NO cuentan: los documentos actuales no las componen, y declararlas
 // cumplidas sería prometer en la etiqueta lo que los bytes no llevan (se registran aparte, N04).
 const ids=[...new Set([...r.requeridas,...r.completas,...r.opcionales])],F=evalFuentes(r.nivel==='L'?{...ctx,aportaciones:null}:ctx,ids);
 const aportIgnoradas=r.nivel==='L'&&ctx.aportaciones?Object.keys(ctx.aportaciones).filter(k=>ids.includes(k)):[];
 const falta=r.requeridas.filter(i=>F[i].estado!=='disponible'&&F[i].estado!=='parcial');
 const incompleta=r.completas.filter(i=>F[i].estado!=='disponible');
 const omitidas=r.opcionales.filter(i=>F[i].estado!=='disponible'&&F[i].estado!=='parcial');
 const base={key:r.key,version:r.version,catalogo:VERSION,nivel:r.nivel,nombre:r[lang],fuentes:F,falta,incompleta,omitidas,autoridad:r.autoridad[lang],corte:r.corte};
 if(r.nivel!=='L'){
  const proyeccion=Object.fromEntries(Object.entries(F).filter(([,v])=>v.estado!=='ausente'&&v.estado!=='incompatible').map(([k,v])=>[k,v.nota]));
  const cumple=!falta.length&&r.requeridas.every(i=>F[i].estado==='disponible');
  return {...base,estado:r.nivel==='C'?(cumple?'contrato-cumplido-sin-emision':'no-elegible'):'no-disponible',emitible:false,contrato:r.contrato,proyeccion,
   motivo:[r.nivel==='F'?`Función futura (${r.corte}): solo contrato y prueba de indisponibilidad.`:`Contrato de laboratorio (${r.corte}): se evalúa la elegibilidad, no se emite ninguna pieza de cliente.`,
    ...falta.map(i=>`Falta: ${FUENTES[i].es}. ${F[i].nota}`),...(cumple?['Los requisitos están aportados, pero la emisión necesita su corte de producto y un GO.']:[])]};}
 if(falta.length)return {...base,estado:'bloqueada',emitible:false,motivo:falta.map(i=>`Falta una fuente obligatoria: ${FUENTES[i].es}. ${F[i].nota}`)};
 const REG=ctx.REG,t=REG.tipos.find(x=>x.tipo===r.sel.tipo);if(!t)return {...base,estado:'bloqueada',emitible:false,motivo:[`La modalidad ${r.sel.tipo} no está compuesta.`]};
 const capitulos=(r.sel.capitulos||t.chapters.filter(c=>c!=='portada')).filter(c=>t.chapters.includes(c)||REG.tipos.find(x=>x.tipo==='integral').chapters.includes(c));
 const documentos=r.sel.documentos||t.documents;
 const suf=lang==='en'?'.en':'';const sinDoc=documentos.filter(d=>!REG.pieces.some(p=>p.file===`documentos/${d}${suf}.pdf`));
 if(sinDoc.length)return {...base,estado:'bloqueada',emitible:false,motivo:sinDoc.map(d=>`Documento no compuesto en «${lang}»: ${d}.`)};
 if(r.economia==='sin-importes'&&(capitulos.includes('presupuesto')||documentos.some(d=>CAT.DOCUMENTOS[d].contiene==='*'||CAT.DOCUMENTOS[d].contiene.includes('presupuesto'))))
  return {...base,estado:'bloqueada',emitible:false,motivo:['La receta es sin importes y su selección arrastra el presupuesto.']};
 const seleccion={tipo:r.sel.tipo,capitulos,documentos,omitir:[],idioma:lang,
  base:{proyecto:REG.project.id,revision:REG.project.revision,snapshotSha256:REG.snapshot.sha256},
  nota:`Receta ${r.key} (${r.key} v${r.version}, ${VERSION}): ${r.es}. Selección de laboratorio sobre la modalidad «${t.name}»; no es un tipo nuevo.`};
 return {...base,estado:incompleta.length?'emitible-parcial':'emitible',emitible:true,seleccion,
  motivo:[...incompleta.map(i=>`Alcance parcial: falta ${FUENTES[i].es}. ${F[i].nota}`),...aportIgnoradas.map(k=>`Aportación de fixture «${k}» no compuesta: los documentos actuales no la muestran.`)]};}
const selSha=s=>sha(JSON.stringify(s));
module.exports={VERSION,PERFILES,FASES,FAMILIAS,TIPOS_DOC,MODALIDADES,STORY,FUENTES,RECETAS,contexto,filtrar,resolver,evalFuentes,selSha};
