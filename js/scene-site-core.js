/* Película · «Desde el paisaje» · entorno para la «Escena para Blender» (rama claude/pelicula-efectos, fuera de #324).
 *
 * Puro (sin red, sin DOM): convierte el entorno YA cargado en RUBIK (terreno MDT05 y ortofoto PNOA de la sesión) a un documento
 * `rubik-entorno.json` en las coordenadas del PLANO del proyecto (mm) y cotas del modelo (m), usando las transformaciones de
 * emplazamiento existentes (FloorPlanTerritoryIntegration: parcela-local ↔ modelo, giro al norte y cota cero del modelo).
 *
 * Reglas:
 *  - Cada capa pasa por la política existente (FloorPlanTerritoryExportPolicy.layer): solo se exporta si su licencia es
 *    «verified» con atribución (o «not-applicable»). La atribución obligatoria viaja en el documento (y el informe/vídeo la repite).
 *  - La PARCELA catastral (licencia «restricted») NUNCA se exporta: sirve para comprobar el emplazamiento dentro de RUBIK.
 *  - Sin emplazamiento (sin parcela o sin colocación del edificio) el resultado es `status:'absent'` y el ZIP no cambia.
 *  - Si falta un dato imprescindible, `status:'incomplete'` con la lista `missing` (Entregar lo muestra).
 * UMD: window.FloorPlanSceneSite / module.exports. */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanSceneSite = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (root) {
  'use strict';
  const FORMAT = 'rubik-sota.scene-site', VERSION = '1.0.0', FILE = 'rubik-entorno.json', ORTHO = 'rubik-ortofoto.jpg';
  const req = (name, path) => (typeof module === 'object' && module.exports) ? require(path) : root[name];
  const Terrain = () => req('FloorPlanTerrainCore', './terrain-core.js');
  const Territory = () => req('FloorPlanTerritoryIntegration', './territory-integration-core.js');
  const Policy = () => req('FloorPlanTerritoryExportPolicy', './territory-export-policy.js');
  const r3 = v => Math.round(v * 1000) / 1000;

  /** Qué falta para exportar el entorno (lista vacía = completo). */
  function missing(site, session) {
    const out = [];
    if (!site || !site.parcel) return ['parcel'];
    if (!site.buildingPlacement || !site.buildingPlacement.horizontal) out.push('buildingPlacement.horizontal');
    if (!site.buildingPlacement || !site.buildingPlacement.vertical) out.push('buildingPlacement.vertical');
    if (!Number.isFinite(site.northOffsetDeg)) out.push('northOffsetDeg');
    if (!site.terrain) out.push('terrain'); else if (!(session && session.terrain && session.terrain.grid)) out.push('terrain.session');
    if (!site.orthophoto) out.push('orthophoto'); else if (!(session && session.orthophoto && session.orthophoto.bytes)) out.push('orthophoto.session');
    return out;
  }

  /**
   * @param site     project.site (parcel, terrain, orthophoto, buildingPlacement, northOffsetDeg)
   * @param session  { terrain:{grid}, orthophoto:{bytes:Uint8Array} } (activos de sesión: FloorPlanTerritorySession)
   * @returns {status:'absent'} | {status:'incomplete', missing:[…]} | {status:'ready', doc, files:Map}
   */
  function build({ site, session } = {}) {
    if (!site || !site.parcel) return { status: 'absent' };
    const miss = missing(site, session);
    const T = Territory(), P = Policy(), frame = site.parcel.frame;
    const layers = {
      parcel: { exported: false, reason: 'restricted-geometry-stays-in-rubik', policy: P.layer(site.parcel.source, true) },
      terrain: { policy: P.layer(site.terrain && site.terrain.source, !!(session && session.terrain)) },
      orthophoto: { policy: P.layer(site.orthophoto && site.orthophoto.source, !!(session && session.orthophoto)) },
    };
    for (const k of ['terrain', 'orthophoto']) if (site[k] && !layers[k].policy.canExport && !miss.includes(k + '.session')) miss.push(k + '.licence:' + layers[k].policy.reason);
    if (miss.length) return { status: 'incomplete', missing: miss, layers };
    // Terreno: superficie derivada por RUBIK (parcela-local, mm) → plano del modelo (mm) y cota del modelo (m).
    const surf = Terrain().deriveSurface(session.terrain.grid, frame);
    const vertices = surf.vertices.map(v => {
      const m = T.parcelToModel(site, { x: v.xMm, y: v.yMm });
      return v.elevationM === null ? null : [r3(m.x), r3(m.y), r3(T.elevationToModel(site, v.elevationM))];
    });
    // Ortofoto: UV de cada vértice del terreno en su extensión (misma fórmula que el visor: FloorPlanTerritoryIntegration.uv);
    // las esquinas de la extensión pasan también al plano del modelo (evidencia de alineación).
    const e = site.orthophoto.extent, uvs = surf.vertices.map(v => { const q = T.uv(e, v.sourceX, v.sourceY); return [r3(q.u), r3(q.v)]; }), corner = (x, y) => { const l = T.sourceToLocal(frame, x, y), m = T.parcelToModel(site, l); return [r3(m.x), r3(m.y)]; };
    const attributions = P.attributions([layers.terrain.policy, layers.orthophoto.policy]);
    const doc = {
      format: FORMAT, version: VERSION, units: { plan: 'mm (RUBIK plan, same frame as rubik-estancias.json)', elevation: 'm above the model zero (ground floor finished level)' },
      placement: { northOffsetDeg: site.northOffsetDeg, horizontal: site.buildingPlacement.horizontal, vertical: site.buildingPlacement.vertical,
        sourceCrs: site.parcel.sourceCrs, parcelFrame: { originX: frame.originX, originY: frame.originY },
        meaning: 'site position, scale and orientation entered in RUBIK (Analyze › Territorial context); the cadastral parcel itself is not exported' },
      terrain: { source: site.terrain.source, product: site.terrain.productName || null, coverageId: site.terrain.coverageId || null, resolutionM: site.terrain.resolutionM || null,
        verticalReference: 'orthometric', cols: session.terrain.grid.cols, rows: session.terrain.grid.rows, vertices, uv: uvs, uvConvention: 'u east, v south (0,0 = north-west corner of the orthophoto)', triangles: surf.triangles,
        modelZeroElevationM: site.buildingPlacement.vertical.modelZeroElevationM },
      orthophoto: { file: ORTHO, source: site.orthophoto.source, mediaType: 'image/jpeg', widthPx: site.orthophoto.widthPx, heightPx: site.orthophoto.heightPx,
        sourceExtent: e, cornersPlanMm: { nw: corner(e.minX, e.maxY), ne: corner(e.maxX, e.maxY), se: corner(e.maxX, e.minY), sw: corner(e.minX, e.minY) } },
      parcel: { exported: false, reference: null, reason: 'Catastro INSPIRE CP licence is restricted: the geometry is used inside RUBIK to check the site and is not distributed' },
      attributions, layers: { parcel: layers.parcel.policy, terrain: layers.terrain.policy, orthophoto: layers.orthophoto.policy },
    };
    const bytes = new TextEncoder().encode(JSON.stringify(doc) + '\n');
    return { status: 'ready', doc, files: new Map([[FILE, bytes], [ORTHO, session.orthophoto.bytes]]) };
  }
  return { FORMAT, VERSION, FILE, ORTHO, missing, build };
});
