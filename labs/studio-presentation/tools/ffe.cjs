'use strict';

// El snapshot fija la identidad y ubicación. El catálogo declarado no acredita
// una compra, una instalación ni un precio.
function objectRows(snapshot, formatDimension) {
 const {project, geometry, objects} = snapshot;
 const roomOrder = new Map(geometry.rooms.map((room, i) => [room.id, i]));
 const geometryById = new Map(geometry.objects.map(object => [object.id, object]));
 if (geometryById.size !== geometry.objects.length || project.objects !== objects.length) {
  throw new Error('FF&E: inventario geométrico duplicado o recuento incoherente');
 }
 const seen = new Set(), grouped = new Map();
 const ordered = [...objects].sort((a, b) => a.id < b.id ? -1 : a.id === b.id ? 0 : 1);
 for (const object of ordered) {
  const {id, roomId, name, type, materialId, catalogRef} = object;
  if (!id || seen.has(id) || (roomId && !roomOrder.has(roomId)) ||
      (object.projectId && object.projectId !== project.id) ||
      (object.revision && object.revision !== project.revision) ||
      (object.quantity !== undefined && object.quantity !== 1)) {
   throw new Error('FF&E: instancia duplicada, fuera de ámbito o con cantidad inválida');
  }
  seen.add(id);
  const size = geometryById.get(id)?.size || object.size;
  const dims = size && [size.widthMm, size.depthMm].every(x => Number.isFinite(x) && x > 0)
   ? [size.widthMm, size.depthMm]
   : null;
  const ref = typeof catalogRef === 'string' ? catalogRef : catalogRef?.sku || catalogRef?.productId || null;
  const identity = typeof catalogRef === 'string' ? catalogRef : catalogRef && [
   catalogRef.studioId, catalogRef.catalogId, catalogRef.catalogRevision, catalogRef.revisionHash,
   catalogRef.productId, catalogRef.variantId, catalogRef.sku, catalogRef.productVersion
  ];
  const key = JSON.stringify([roomId, name, type, dims, materialId, identity]);
  if (!grouped.has(key)) {
   grouped.set(key, {roomId, room: object.room || 'Fuera de los recintos', name,
    size: dims && dims.map(formatDimension).join(' × '), ref, materialId,
    authority: ref ? 'reference' : 'generic', installed: null, price: null, instanceIds: []});
  }
  grouped.get(key).instanceIds.push(id);
 }
 if ([...geometryById.keys()].some(id => !seen.has(id))) {
  throw new Error('FF&E: geometría sin instancia de inventario');
 }
 const roomIndex = row => roomOrder.get(row.roomId) ?? Infinity;
 return [...grouped.values()].sort((a, b) => roomIndex(a) - roomIndex(b))
  .map((row, index) => ({...row, qty: row.instanceIds.length, tag: 'M-' + String(index + 1).padStart(2, '0')}));
}

module.exports = {objectRows};
