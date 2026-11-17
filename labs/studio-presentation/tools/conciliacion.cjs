'use strict';

const defined = value => typeof value === 'string' && value.trim().length > 0;
const date = value => defined(value) && Number.isFinite(Date.parse(value));
const tuple = source => [source.proyecto,source.revision,source.ambito,source.unidad,source.metodo];

function offers(values, ctx) {
 if (!Array.isArray(values) || values.length < 2) return 'Hacen falta al menos dos ofertas independientes.';
 const valid = source => source && tuple(source).every(defined) && defined(source.proveedor) &&
  defined(source.moneda) && typeof source.ivaIncluido==='boolean' && defined(source.alcance) && date(source.fecha);
 if (!values.every(valid)) return 'Cada oferta necesita proveedor, fecha, proyecto, revisión, ámbito, unidad, método, moneda, IVA y alcance.';
 if (values.some(v=>v.proyecto!==ctx.S.project.id||v.revision!==ctx.S.project.revision)) return 'Hay una oferta de otro proyecto o revisión.';
 if (new Set(values.map(v=>v.proveedor.trim().toLowerCase())).size!==values.length) return 'Dos ofertas del mismo proveedor no son independientes.';
 const identity = source => JSON.stringify([...tuple(source),source.moneda,source.ivaIncluido,source.alcance]);
 if (new Set(values.map(identity)).size!==1) return 'Moneda, IVA, unidad, método o alcance no comparables.';
 return null;
}

function revisionAnterior(value, ctx) {
 const actual = ctx.S.project;
 if (!value || !defined(value.revision) || value.revision===actual.revision || value.propuestaRevision!==actual.revision ||
     value.proyecto!==actual.id || value.relacion!=='same-project') {
  return 'La fuente debe declarar dos revisiones distintas vinculadas al mismo proyecto y a la propuesta activa.';
 }
 return null;
}

function observations(values, ctx) {
 if (!Array.isArray(values) || !values.length || !values.every(x=>x&&date(x.fecha)&&defined(x.autor)&&defined(x.ubicacion))) {
  return 'Cada observación necesita fecha, autor y ubicación.';
 }
 if (values.some(x=>x.proyecto!==ctx.S.project.id||x.revision!==ctx.S.project.revision||x.autoridad!=='observado')) {
  return 'Una previsión, simulación, declaración u otra revisión no acredita una observación.';
 }
 return null;
}

function validity(record, ctx, authorities) {
 if (!record || !authorities.includes(record.autoridad) || record.proyecto!==ctx.S.project.id ||
     record.revision!==ctx.S.project.revision || !defined(record.ambito) || !defined(record.metodo) ||
     !date(record.fecha) || !defined(record.autor)) return 'Falta fuente atribuida del proyecto y revisión activos con ámbito, método, fecha y autoridad adecuados.';
 return null;
}

module.exports={offers,revisionAnterior,observations,validity};
