// v1.3 · A12 · CATÁLOGO ÚNICO de dependencias semánticas de la entrega del laboratorio. Lo leen entrega.cjs (composición),
// exportar.cjs (selección física y gates) y los QA. Un solo lugar: módulos → capítulos web → documentos → archivos.
// · 10 módulos editoriales de la v1.2 (§ taxonomía) y su capítulo web, o su ausencia declarada.
// · Cada documento declara los capítulos cuyo contenido CONTIENE: si uno no está elegido, el documento no puede ir.
// · Cada archivo de medios tiene un capítulo propietario en el registro (entrega.json → pieces[].capitulo); null = común.
// · Las 7 modalidades son selecciones sobre estos capítulos; no son documentos.
'use strict';
const MODULOS=[
 {n:'01',id:'portada',nombre:'Portada',capitulos:['portada']},
 {n:'02',id:'concepto',nombre:'Concepto y objetivos',capitulos:['concepto'],nota:'Texto del profesional, optativo; separado de los datos técnicos.'},
 {n:'03',id:'estado-actual',nombre:'Estado actual',capitulos:[],ausente:'No hay una revisión anterior vinculada y comparable en el snapshot: el módulo no se compone (ENT-04 en E2).'},
 {n:'04',id:'distribucion',nombre:'Nueva distribución',capitulos:['vivienda','estancias']},
 {n:'05',id:'transformacion',nombre:'Transformación 3D (Dibujo vivo)',capitulos:['dibujo']},
 {n:'06',id:'visualizaciones',nombre:'Visualizaciones',capitulos:['estancias','recorrido']},
 {n:'07',id:'materiales',nombre:'Materiales y mobiliario',capitulos:['materiales']},
 {n:'08',id:'economia',nombre:'Propuesta económica',capitulos:['presupuesto']},
 {n:'09',id:'planificacion',nombre:'Planificación de obra',capitulos:['obra']},
 {n:'10',id:'entrega',nombre:'Entrega y próximos pasos',capitulos:['decisiones','documentos','procedencia']}];
// Capítulos de la web de cliente, en orden. «portada» va siempre.
const CAPITULOS=['portada','concepto','vivienda','dibujo','estancias','materiales','presupuesto','obra','recorrido','decisiones','documentos','procedencia'];
// Documentos: familia, tipo de la v1.2 y capítulos cuyo contenido llevan dentro.
const DOCUMENTOS={
 'architecture-book':{familia:'técnica',tipo:'Architecture Book',contiene:['vivienda','estancias']},
 'architecture-sheet-strip':{familia:'técnica',tipo:'Architecture Book (lámina A3 independiente)',contiene:['vivienda']},
 'interior-book-v3':{familia:'diseño',tipo:'Interior Design Book',contiene:['estancias']},
 'materials-furniture-book-v3':{familia:'diseño',tipo:'Materials & Furniture Book',contiene:['materiales']},
 'commercial-proposal-client-v3':{familia:'comercial',tipo:'Commercial Proposal',contiene:['presupuesto']},
 'real-estate-sheet-v3':{familia:'comercial',tipo:'Real Estate Presentation',contiene:['vivienda','presupuesto']},
 'real-estate-sheet-v3-sin-presupuesto':{familia:'comercial',tipo:'Real Estate Presentation (sin cifras económicas)',contiene:['vivienda']},
 'entrega-integral':{familia:'comercial',tipo:'Presentación integral',contiene:'*',recursos:['imagenes-ia','videos']}};
// Recursos que el profesional puede omitir aunque su capítulo vaya: archivos que los materializan y marca en la web.
const RECURSOS={'imagenes-ia':{marca:'ia',archivos:/^media\/ia-/},'videos':{marca:'video',archivos:/\.mp4$|^documentos\/obra-presentacion\.html$/}};
const MODOS=['cliente','borrador'];
const IDIOMAS=['es','en'];
// Avisos que el profesional puede reconocer (nombre exacto del gate). Un bloqueo no se reconoce: se corrige.
const AVISOS=['Identidad del estudio','Presupuesto revisado','Imágenes IA','Plan de obra','Idioma'];
// Formatos que pueden llegar al cliente, con su firma binaria y tipo MIME.
const FORMATOS={html:{mime:'text/html'},pdf:{mime:'application/pdf'},jpg:{mime:'image/jpeg'},png:{mime:'image/png'},mp4:{mime:'video/mp4'},txt:{mime:'text/plain'},json:{mime:'application/json'}};
const firma=(ext,b)=>{switch(ext){case 'pdf':return b.subarray(0,5).toString('latin1')==='%PDF-';case 'jpg':return b[0]===0xff&&b[1]===0xd8&&b[2]===0xff;
 case 'png':return b.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]));case 'mp4':return b.subarray(4,8).toString('latin1')==='ftyp';
 case 'html':return /^\s*<!doctype html/i.test(b.subarray(0,64).toString('utf8'));case 'txt':return !b.includes(0);case 'json':try{JSON.parse(b.toString('utf8'));return true;}catch{return false;}default:return false;}};
// Límites razonables y documentados de una entrega de cliente del laboratorio.
const LIMITES={archivos:400,bytesArchivo:200*1048576,bytesTotal:600*1048576};
const RUTA=/^[A-Za-z0-9][A-Za-z0-9._-]*(\/[A-Za-z0-9][A-Za-z0-9._-]*)*$/;
module.exports={RECURSOS,MODULOS,CAPITULOS,DOCUMENTOS,MODOS,IDIOMAS,AVISOS,FORMATOS,firma,LIMITES,RUTA};
