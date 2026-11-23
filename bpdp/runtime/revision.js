/* BP-DP · VIGENCIA DE LAS SALIDAS (módulo ES).
 * Cada salida (vídeo, lámina) lleva la revisión SHA-256 del proyecto con el que se preparó. Antes de ofrecerla —al terminar,
 * al reabrir y al pulsar «Descargar»— se compara con la revisión ACTUAL del proyecto:
 *  - en RUBIK (puente, paquete en vivo): SHA-256 del proyecto abierto (FloorPlanApp.project, claves ordenadas), el mismo
 *    cálculo que fija la revisión del paquete;
 *  - en el laboratorio: la revisión del paquete (no hay editor que lo cambie), salvo que una prueba sustituya la sonda.
 * Si difieren, la salida se identifica como OBSOLETA y no se ofrece como vigente. */
const sortKeys = v => Array.isArray(v) ? v.map(sortKeys) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, sortKeys(v[k])])) : v;
export const hashProject = async s => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)))].map(b => b.toString(16).padStart(2, '0')).join('');
export function snapshotLiveProject() {
  const app = window.FloorPlanApp;
  const project = app.levelContext ? { ...app.project, site: window.FloorPlanBuildingUI?.site } : app.project;
  return JSON.stringify(sortKeys(project));
}
export function probeFor(pkg) {
  if (typeof pkg.revisionProbe === 'function') return pkg.revisionProbe; // punto de prueba documentado
  if (pkg.source?.live && window.FloorPlanApp?.project) return () => hashProject(snapshotLiveProject());
  return async () => pkg.revision;
}
/** Estado de vigencia de una salida preparada con `revision`. */
export async function vigencia(pkg, revision) {
  const actual = await (pkg.revisionProbe || probeFor(pkg))(); // se relee la sonda en cada consulta
  return { vigente: actual === revision, preparada: revision, actual };
}
// Últimas salidas por proyecto y experiencia (sobreviven a cerrar y reabrir la experiencia en la misma página).
const store = new Map();
export const recordar = (pkg, modulo, tipo, r) => store.set(`${pkg.projectId}|${modulo}|${tipo}`, r);
export const ultima = (pkg, modulo, tipo) => store.get(`${pkg.projectId}|${modulo}|${tipo}`) || null;
export const olvidar = (pkg, modulo, tipo) => store.delete(`${pkg.projectId}|${modulo}|${tipo}`);
