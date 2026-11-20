// OP-05 · P2 · Núcleo PURO de referencias a modelos privados (LABORATORIO). Sin DOM, sin red, sin almacenamiento y sin
// escribir en el proyecto que recibe: cada operación devuelve un proyecto NUEVO.
// Decisiones del propietario (20/11/2026): id opaco separado del SHA-256; extensión versionada (precedente MUE-01, sin
// tocar el contrato base de objetos ni OP-07); ficha limitada al proyecto; perfil F3; exportaciones ordinarias sin nada
// de OP-05; expediente privado futuro solo explícito; entregables con la representación genérica; sin persistencia GLB.
//   project.extensions['x-op05-private-model'] = {version:1, models:[descriptor], items:[{objectId, modelId, sha256}]}
//   descriptor = {modelId, sha256, byteLength, mediaType:'model/gltf-binary', title, profileId:'f3-v1',
//                 rights:{basis:'original'|'licensed', attribution, license, evidenceSha256, scope:'project-private'}}
// El objeto canónico (id, posición, rotación, cotas, assetRef) NO cambia: el modelo solo es una representación.
export const EXT = 'x-op05-private-model', VERSION = 1, PROFILE = 'f3-v1', MEDIA = 'model/gltf-binary', SCOPE = 'project-private';
const SHA = /^[a-f0-9]{64}$/, MID = /^pmd_[a-f0-9]{32}$/;
// Codex P2 finding: the RAW string is bounded (not only its trimmed form) and what is kept is the trimmed value.
const text = (v, max) => typeof v === 'string' && v.length <= max && v.trim().length > 0;
const norm = v => typeof v === 'string' ? v.trim() : v;
const clone = v => JSON.parse(JSON.stringify(v));
const keysExactly = (o, keys) => o && typeof o === 'object' && !Array.isArray(o) && Object.keys(o).sort().join() === [...keys].sort().join();
export class PrivateModelError extends Error { constructor(code, message) { super(message); this.code = code; } }
const fail = (code, message) => { throw new PrivateModelError(code, message); };

// Identificador opaco: aleatorio, sin relación con el contenido (no revela ni permite reconocer el modelo).
export function newModelId(random = n => crypto.getRandomValues(new Uint8Array(n))) {
  return 'pmd_' + Array.from(random(16), b => b.toString(16).padStart(2, '0')).join('');
}
function checkRights(r) {
  if (!keysExactly(r, ['basis', 'attribution', 'license', 'evidenceSha256', 'scope'])) fail('rights-invalid', 'La ficha de derechos no es válida.');
  if (!['original', 'licensed'].includes(r.basis) || !text(r.attribution, 200) || !text(r.license, 160) || !SHA.test(r.evidenceSha256) || r.scope !== SCOPE)
    fail('rights-invalid', 'Faltan procedencia, atribución, licencia o prueba de derechos, o el ámbito no es privado del proyecto.');
}
function checkDescriptor(d) {
  if (!keysExactly(d, ['modelId', 'sha256', 'byteLength', 'mediaType', 'title', 'profileId', 'rights'])) fail('descriptor-invalid', 'Ficha de modelo con campos desconocidos o incompletos.');
  if (!MID.test(d.modelId) || !SHA.test(d.sha256) || !Number.isSafeInteger(d.byteLength) || d.byteLength <= 0 || d.byteLength > 8 * 1024 * 1024 ||
      d.mediaType !== MEDIA || !text(d.title, 100) || d.profileId !== PROFILE) fail('descriptor-invalid', 'Ficha de modelo no válida para el perfil F3.');
  checkRights(d.rights);
}
// Lee y valida la extensión contra el proyecto. Ausente → vacía. Cualquier incoherencia → error (nunca se adivina).
export function read(project) {
  const raw = project?.extensions?.[EXT];
  if (raw === undefined) return {version: VERSION, models: [], items: []};
  if (!keysExactly(raw, ['version', 'models', 'items']) || raw.version !== VERSION || !Array.isArray(raw.models) || !Array.isArray(raw.items)) fail('extension-invalid', 'Extensión OP-05 no reconocida.');
  const models = new Map(), shas = new Set(), objects = new Set((project.objects || []).map(o => o.id)), used = new Set();
  for (const d of raw.models) { checkDescriptor(d); if (models.has(d.modelId)) fail('extension-invalid', 'Ficha repetida.'); models.set(d.modelId, d); }
  for (const d of raw.models) { const key = d.sha256 + ':' + d.byteLength; if (shas.has(key)) fail('extension-invalid', 'Los mismos bytes con dos fichas: conflicto sin resolver.'); shas.add(key); }
  for (const i of raw.items) {
    if (!keysExactly(i, ['objectId', 'modelId', 'sha256'])) fail('extension-invalid', 'Referencia de objeto no válida.');
    const d = models.get(i.modelId);
    if (!objects.has(i.objectId) || !d || d.sha256 !== i.sha256 || used.has(i.objectId)) fail('extension-invalid', 'Referencia a un objeto o una ficha inexistentes, o con huella distinta.');
    used.add(i.objectId);
  }
  return clone(raw);
}
const write = (project, ext) => { const next = clone(project); next.extensions = {...(next.extensions || {})};
  const live = new Set(ext.items.map(i => i.modelId)); ext.models = ext.models.filter(d => live.has(d.modelId));   // una ficha sin usos no se conserva
  if (ext.items.length) next.extensions[EXT] = ext; else delete next.extensions[EXT];
  if (!Object.keys(next.extensions).length) delete next.extensions; return next; };

// Asocia un modelo admitido (bytes verificados por P1: sha256 y byteLength) a un objeto del proyecto. Deduplicación SIN
// ampliar derechos: los mismos bytes reutilizan la ficha solo si la ficha de derechos es idéntica; si no, conflicto.
export function attach(project, objectId, admitted, {modelId = newModelId} = {}) {
  if (!(project.objects || []).some(o => o.id === objectId)) fail('object-not-found', 'El objeto no existe en este proyecto.');
  const ext = read(project), rights = clone(admitted?.rights);
  checkRights(rights);
  rights.attribution = norm(rights.attribution); rights.license = norm(rights.license);
  if (typeof admitted?.title !== 'string' || !text(admitted.title, 100)) fail('descriptor-invalid', 'Falta un título acotado del modelo.');
  const same = ext.models.find(d => d.sha256 === admitted.sha256 && d.byteLength === admitted.byteLength);
  let model = same;
  if (same) { if (JSON.stringify(same.rights) !== JSON.stringify(rights)) fail('rights-conflict', 'Estos bytes ya están en el proyecto con otra ficha de derechos. Revisa el conflicto: no se amplían permisos.'); }
  else { model = {modelId: modelId(), sha256: admitted.sha256, byteLength: admitted.byteLength, mediaType: MEDIA, title: String(admitted.title ?? '').trim(), profileId: PROFILE, rights};
    checkDescriptor(model); ext.models.push(model); }
  ext.items = ext.items.filter(i => i.objectId !== objectId).concat([{objectId, modelId: model.modelId, sha256: model.sha256}]);
  return write(project, ext);
}
export function detach(project, objectId) { const ext = read(project); ext.items = ext.items.filter(i => i.objectId !== objectId); return write(project, ext); }

// Resolución: privada solo si la referencia es válida en ESTE proyecto y los bytes están disponibles con la misma huella;
// en cualquier otro caso, la representación genérica (el objeto canónico) con su razón.
export function resolve(project, objectId, {available = () => false} = {}) {
  let ext; try { ext = read(project); } catch (e) { return {kind: 'generic', reason: 'invalid-reference'}; }
  const item = ext.items.find(i => i.objectId === objectId);
  if (!item) return {kind: 'generic', reason: 'no-private-model'};
  const d = ext.models.find(m => m.modelId === item.modelId);
  if (!available(d.sha256, d.byteLength)) return {kind: 'generic', reason: 'bytes-unavailable'};
  return {kind: 'private', modelId: d.modelId, sha256: d.sha256, byteLength: d.byteLength, title: d.title, profileId: d.profileId};
}

// Minimización por destino. Falla CERRADO: un destino que no está en la lista es un error, nunca un «pasa».
// Ordinarios y compartidos: sin la extensión (ni ids, ni huellas, ni derechos, ni títulos); el resto del proyecto intacto.
export const SHARED_DESTINATIONS = Object.freeze(['project-export', 'project-package', 'client-delivery', 'blender', 'presentation', 'image', 'video', 'dxf', 'budget', 'expediente']);
export function minimize(project, destination) {
  if (destination === 'private-expediente') fail('not-available', 'El expediente privado con modelos propios requiere F0.2c/F0.3, una acción explícita y comprobación de derechos.');
  if (!SHARED_DESTINATIONS.includes(destination)) fail('destination-unknown', `Destino desconocido «${destination}»: no se exporta nada de OP-05.`);
  const next = clone(project);
  if (next.extensions) { delete next.extensions[EXT]; if (!Object.keys(next.extensions).length) delete next.extensions; }
  return next;
}
// Para consumidores visuales (Blender, presentación, imágenes, vídeo): qué objetos deben usar la representación genérica.
export function genericObjects(project) { try { return read(project).items.map(i => i.objectId); } catch { return (project.objects || []).map(o => o.id); } }
