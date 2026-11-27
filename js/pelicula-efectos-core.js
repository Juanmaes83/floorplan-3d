/* «Tu proyecto cobra vida» · tres efectos de película (rama claude/pelicula-efectos, fuera de #324).
 *
 * Núcleo puro (sin DOM ni red), compartido por Home, Entregar → Vídeo y el kit de rodaje:
 *  - EFFECTS: qué explica cada efecto al cliente y qué se ve al inicio, en la transición y al final.
 *  - requirements(project, ctx): qué pide cada efecto y qué falta en ESTE proyecto (datos reales, nada inventado).
 *  - script(effectId, opts): el guion (planos con segundos y fotogramas) que usan la vista previa ligera y el render.
 *    El mismo guion para los dos: la previa permite juzgar ritmo, montaje y cámara antes de comprometer horas de render.
 *  - estimate(script, profile, measures): estimación por perfil con sus factores, o «no disponible» sin medición.
 * Duración: estrictamente > 20 s (aceptación: tres MP4 independientes de más de 20 s).
 * UMD: window.FloorPlanPeliculaEfectos / module.exports. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api; else root.FloorPlanPeliculaEfectos = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const VERSION = '1.0.0', FPS = 24;
  const t3 = (es, en) => ({ es, en });
  const EFFECTS = Object.freeze([
    { id: 'pieza-a-pieza', name: t3('Pieza a pieza', 'Piece by piece'),
      explains: t3('Cómo se forma la vivienda: las piezas reales del modelo entran y encajan sobre su huella en el plano.', 'How the home is formed: the real pieces of the model come in and fit onto their footprint on the plan.'),
      chooseWhen: t3('Para explicar el sistema constructivo, una reforma estructural o el alcance de la obra.', 'To explain the building system, a structural renovation or the scope of works.'),
      start: t3('Planta de RUBIK rotulada (o el croquis alineado), con el proyecto y la revisión.', 'RUBIK plan with labels (or the aligned sketch), with the project and revision.'),
      transition: t3('Suelos, muros, huecos y carpinterías y mobiliario entran por sistemas y encajan en su sitio; el plano sigue visible.', 'Floors, walls, openings and furniture come in by system and fit into place; the plan stays visible.'),
      end: t3('La vivienda montada, con el volumen y la huella de origen a la vista.', 'The assembled home, with the volume and its footprint in view.'),
      needs: ['rooms', 'walls'],
      shots: [['plan', 0, 3.5], ['floors', 3.5, 7], ['walls', 7, 12.5], ['openings', 12.5, 16], ['furniture', 16, 20], ['assembled', 20, 24]] },
    { id: 'maqueta-abierta', name: t3('Maqueta abierta', 'Open model'),
      explains: t3('Cómo se distribuye y se vive por dentro: la maqueta abierta enseña cómo se conectan las estancias y termina dentro de una.', 'How it is laid out and lived in: the open model shows how rooms connect and ends inside one.'),
      chooseWhen: t3('Para un comprador o un cliente de interiorismo que quiere entender la distribución.', 'For a buyer or an interior-design client who wants to understand the layout.'),
      start: t3('Planta legible donde se localiza la estancia de destino.', 'Readable plan where the destination room can be found.'),
      transition: t3('La planta gana volumen; la maqueta sin techo muestra las conexiones; descenso con referencias visibles.', 'The plan gains volume; the roofless model shows the connections; descent with visible references.'),
      end: t3('Interior de esa misma estancia, con encuadre estable y luz continua.', 'Inside that same room, with a steady frame and continuous light.'),
      needs: ['rooms', 'walls', 'countedRoom'],
      shots: [['plan', 0, 2.5], ['floors', 2.5, 5], ['walls', 5, 10], ['openings', 10, 13], ['furniture', 13, 17], ['enter', 17, 24.5], ['living', 24.5, 30]] },
    { id: 'desde-el-paisaje', name: t3('Desde el paisaje', 'From the landscape'),
      explains: t3('Cómo se relaciona con su entorno y cómo se llega: del emplazamiento real al acceso y al interior.', 'How it relates to its setting and how you arrive: from the real site to the entrance and inside.'),
      chooseWhen: t3('Para vivienda en parcela, terraza o venta sobre plano donde el contexto vende.', 'For a house on a plot, terraces or off-plan sales where the setting sells.'),
      start: t3('La vivienda situada en el terreno y la ortofoto de su emplazamiento.', 'The home placed on the terrain and orthophoto of its site.'),
      transition: t3('Acercamiento a escala comprensible, el acceso y el paso por la puerta real del modelo.', 'Approach at an understandable scale, the access and the passage through the model\'s real door.'),
      end: t3('Interior con la relación con el exterior y el acceso a la vista.', 'Interior keeping the relation with the outside and the access in view.'),
      needs: ['rooms', 'walls', 'entrance', 'site'],
      shots: [['site', 0, 4], ['approach', 4, 11], ['access', 11, 16], ['door', 16, 19.5], ['inside', 19.5, 25]] },
  ]);
  const byId = id => EFFECTS.find(e => e.id === id) || null;

  /** Requisitos de un efecto sobre el proyecto real. ctx.siteMissing = FloorPlanSceneSite.missing(site, session). */
  function requirements(effectId, project, ctx = {}) {
    const e = byId(effectId); if (!e) throw Error('effect: unknown ' + effectId);
    const rooms = (project && project.rooms) || [], walls = (project && project.walls) || [], openings = (project && project.openings) || [];
    const checks = {
      rooms: { ok: rooms.some(r => Array.isArray(r.polygon) && r.polygon.length >= 3), label: t3('Estancias dibujadas', 'Drawn rooms') },
      walls: { ok: walls.length > 0, label: t3('Muros', 'Walls') },
      countedRoom: { ok: rooms.some(r => r.counted !== false && Array.isArray(r.polygon) && r.polygon.length >= 3), label: t3('Una estancia de destino (contada)', 'A destination room (counted)') },
      entrance: { ok: openings.some(o => o.isEntrance === true && /door/.test(o.kind || '')), label: t3('Puerta de entrada marcada en el modelo', 'Entrance door marked in the model') },
      site: { ok: Array.isArray(ctx.siteMissing) ? ctx.siteMissing.length === 0 : false, label: t3('Emplazamiento: terreno, ortofoto y colocación de la vivienda', 'Site: terrain, orthophoto and building placement'),
        missing: Array.isArray(ctx.siteMissing) ? ctx.siteMissing : ['site'] },
    };
    const rows = e.needs.map(k => ({ key: k, ...checks[k] }));
    return { effect: e.id, ready: rows.every(r => r.ok), rows };
  }

  /** Guion del efecto (mismo para la vista previa y el render). Duración > 20 s garantizada. */
  function script(effectId, { fps = FPS, revision = null } = {}) {
    const e = byId(effectId); if (!e) throw Error('effect: unknown ' + effectId);
    const shots = e.shots.map(([id, a, b]) => ({ id, seconds: [a, b], frames: [Math.round(a * fps), Math.round(b * fps) - 1] }));
    const seconds = e.shots[e.shots.length - 1][2];
    if (!(seconds > 20)) throw Error('script: an effect must last more than 20 s');
    return { format: 'rubik-sota.pelicula-script', version: VERSION, effect: e.id, fps, seconds, frames: Math.round(seconds * fps), shots, revision };
  }

  /** Estimación por perfil. measures = { [profile]: secondsPerFrame } medido en una prueba real; sin medida → no disponible. */
  function estimate(s, profile, measures = {}) {
    const spf = measures && measures[profile && profile.id];
    const factors = [{ key: 'frames', value: s.frames }, { key: 'resolution', value: profile ? profile.res : null }, { key: 'samples', value: profile ? profile.samples : null }];
    if (!profile || !Number.isFinite(spf) || spf <= 0) return { available: false, factors, reason: 'no-measure' };
    const total = s.frames * spf;
    return { available: true, seconds: Math.round(total), low: Math.round(total * 0.8), high: Math.round(total * 1.3), factors: [...factors, { key: 'secondsPerFrame', value: spf, source: 'measured' }] };
  }
  // Los mismos perfiles que el kit de rodaje (scripts/interop/blender-rodaje.py · PROFILES): el guion nombra uno de ellos.
  const PROFILES = Object.freeze([{ id: 'revision', res: '1280x720', samples: 16 }, { id: 'entrega1440', res: '2560x1440', samples: 32 }, { id: 'entrega4k', res: '3840x2160', samples: 24 }]);
  return { VERSION, FPS, EFFECTS, PROFILES, byId, requirements, script, estimate };
});
