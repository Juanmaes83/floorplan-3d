// OP-05 P3 · Proveedor de LABORATORIO de representaciones privadas (solo memoria; C1 NO-GO: nada se persiste).
// Se registra como window.RubikPrivateView solo cuando una prueba o el laboratorio lo carga; el producto no lo carga.
// Un acceso es una CONCESIÓN ligada a (proyecto, modelo) que exige que ese proyecto contenga la referencia y la ficha con
// derechos (núcleo P2). La huella SHA-256 por sí sola no concede nada: una concesión de otro proyecto no resuelve.
import * as Core from './private-model-core.mjs';
import {loadPrivateModel} from './private-loader.mjs';

const grants = new Map();   // `${projectId}|${modelId}` → {sha256, byteLength, bytes}
// C1 NO-GO por construcción: la extensión P2 de cada proyecto vive AQUÍ, en memoria, indexada por project.id; nunca entra
// en el documento del editor, así que save(), la biblioteca y F0 no pueden persistirla ni exportarla.
const overlays = new Map();   // projectId → extensión x-op05-private-model
const virtual = project => { const ext = overlays.get(project?.id); if (!ext) return project;
  return {...project, extensions: {...(project.extensions || {}), [Core.EXT]: ext}}; };
const key = (projectId, modelId) => `${projectId}|${modelId}`;
export const view = {
  enabled: false,
  enable() { this.enabled = true; globalThis.View3D?.invalidate?.(); },
  disable() { this.enabled = false; globalThis.View3D?.invalidate?.(); },
  // Asocia (en memoria) un modelo admitido a un objeto del proyecto: valida con el núcleo P2 (id opaco, derechos, conflicto).
  attach(project, objectId, admitted) {
    const next = Core.attach(virtual(project), objectId, admitted);
    overlays.set(project.id, next.extensions[Core.EXT]);
    return Core.read(next).items.find(i => i.objectId === objectId).modelId;
  },
  composed(project) { return virtual(project); },   // solo para pruebas y minimización; nunca se guarda
  // Concede los bytes de la representación privada de `objectId` en ESTE proyecto (ficha y derechos ya en su extensión).
  grant(project, objectId, bytes) {
    if (!(bytes instanceof ArrayBuffer)) throw Error('Solo bytes en memoria.');
    const ext = Core.read(virtual(project)), item = ext.items.find(i => i.objectId === objectId);
    if (!item) throw Error('Ese objeto no tiene un modelo privado en este proyecto.');
    const d = ext.models.find(m => m.modelId === item.modelId);
    if (bytes.byteLength !== d.byteLength) throw Error('Los bytes no tienen la longitud de la ficha.');
    grants.set(key(project.id, d.modelId), {sha256: d.sha256, byteLength: d.byteLength, bytes: bytes.slice(0)});
  },
  // OP05-C: revocar retira también lo ya cargado: reconstruye el mobiliario (cancela cargas, libera escenas privadas).
  revokeAll() { grants.clear(); overlays.clear(); globalThis.View3D?.refreshAssets?.(); globalThis.View3D?.invalidate?.(); },
  isGranted(k) { return typeof k === 'string' && grants.has(k); },
  grantsFor(projectId) { return [...grants.keys()].filter(k => k.startsWith(projectId + '|')).length; },
  resolve(project, objectId) {
    const r = Core.resolve(virtual(project), objectId, {available: () => true});
    if (r.kind !== 'private') return r;
    const g = grants.get(key(project.id, r.modelId));
    if (!g || g.sha256 !== r.sha256 || g.byteLength !== r.byteLength) return {kind: 'generic', reason: 'not-granted-for-this-project'};
    return r;
  },
  async load(project, objectId, {signal} = {}) {
    const r = this.resolve(project, objectId);
    if (r.kind !== 'private') throw Error('Representación genérica: ' + r.reason);
    const g = grants.get(key(project.id, r.modelId)), projectId = project.id;
    const result = await loadPrivateModel(g.bytes, {sha256: g.sha256, byteLength: g.byteLength}, {signal});
    return {...result, projectId, key: key(project.id, r.modelId)};
  },
};
globalThis.RubikPrivateView = view;
