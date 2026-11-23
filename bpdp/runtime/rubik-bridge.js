/* BP-DP PREMIUM · PUENTE CON RUBIK (módulo ES, solo laboratorio / copia de prueba).
 *
 * Demuestra la integración futura SIN cambiar el producto: dentro de una página de RUBIK construye el paquete de escena
 * EN VIVO con APIs públicas (FloorPlanApp.project + View3D.captureScene) y abre Blueprint o Despiece en una capa a
 * pantalla completa sobre el editor. Al cerrar: libera el contexto WebGL del Studio y comprueba que el proyecto de RUBIK
 * no ha cambiado. No llama a ninguna API de escritura de RUBIK.
 */

import { hashProject, snapshotLiveProject } from './revision.js';

/** Paquete de escena en vivo (mismo contrato que tools/export-rubik-package.cjs). */
export async function livePackage({ signal } = {}) {
  const app = window.FloorPlanApp, V = window.View3D; if (!app?.project || !V?.captureScene) throw Error('RUBIK no está listo (abre la vista 3D).');
  const before = snapshotLiveProject(), { doc } = await V.captureScene({ stableFrames: 3, signal }), after = snapshotLiveProject();
  if (before !== after) throw Error('La captura cambió el proyecto: no se abre nada.');
  let nv = 0, nf = 0; for (const m of doc.meshes) { nv += m.vertices.length * 3; nf += m.faces.length * 3; }
  const pos = new Float32Array(nv), idx = new Uint32Array(nf); let ov = 0, of = 0;
  const meshes = doc.meshes.map(m => { const v = m.vertices.flat(), f = m.faces.flat(); pos.set(v, ov); idx.set(f, of); const r = { name: m.name, entity: m.entity, level: m.level, material: m.material, bounds: m.bounds, v: [ov / 3, v.length / 3], f: [of, f.length] }; ov += v.length; of += f.length; return r; });
  const P = JSON.parse(before), names = Object.fromEntries([...(P.rooms || []).map(r => [r.id, window.FloorPlanDisplayName?.(r.name, 'room') || r.id]), ...(P.objects || []).map(o => [o.id, window.FloorPlanDisplayName?.(o.name, o.type) || o.id])]);
  const pkg = { schema: 'rubik-sota.bpdp.scene-package@1', scenario: 'rubik-real', label: 'Proyecto abierto en RUBIK (en vivo)', source: { api: ['FloorPlanApp.project', 'View3D.captureScene'], live: true },
    revision: await hashProject(before), projectId: P.id, project: P, displayNames: names, frame: doc.frame, meshes, geometry: { sha256: null } };
  return { pkg, pos, idx, projectHash: pkg.revision };
}

/** Compatibilidad: abre la experiencia sobre RUBIK con la conexión de Entregar (una sola implementación). */
export async function openOverRubik(module = 'blueprint') {
  const E = await import('./entregar.js'); let fallo = null;
  const done = E.abrir(module, { origen: document.activeElement }).catch(e => { fallo = e; });
  for (let i = 0; i < 600 && !window.BPDP?.studio && !fallo; i++) await new Promise(r => setTimeout(r, 50));
  if (fallo) throw fallo;
  return { revision: window.BPDP.studio.pkg.revision, close: () => window.BPDP.close(), done };
}
