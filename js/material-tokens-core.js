/* RUBIK SOTA · Material Tokens (núcleo puro, sin DOM ni red) · contrato rubik-sota.material-tokens 1.0.0
 *
 * Tres conceptos separados (encargo «Sistema profesional de materiales», §3):
 *  · IDENTIDAD  — qué material está declarado: token semántico estable (material.wood.oak.natural), categoría, nombre
 *                 visible, versión de la taxonomía, procedencia y certeza. Fabricante/referencia solo con fuente verificable.
 *  · ASIGNACIÓN — qué objeto/superficie/pieza lo recibe (id estable del proyecto + ranura) y con qué certeza se pidió.
 *  · RECETA     — cómo se representa en Cycles: vive en el kit de Blender (rubik_blender_rodaje.py), nunca aquí.
 *
 * El proyecto sigue siendo la ÚNICA autoridad: este documento es un DERIVADO determinista que viaja en el ZIP con su
 * huella. No se escribe en el proyecto, no inventa materiales y no copia texto libre (solo identificadores ASCII).
 * Orden de resolución (determinista): 1) material explícito del profesional → 2) material documentado del activo o del
 * catálogo autorizado → 3) aproximación visual por familia y pieza (la hace el kit) → 4) reserva visible.
 */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.RubikMaterialTokens = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const FORMAT = 'rubik-sota.material-tokens', VERSION = '1.0.0', TAXONOMY_VERSION = '1.0.0';
  const FILE = 'rubik-materiales.json';

  // Taxonomía extensible: material.<familia>.<subfamilia>.<acabado>[.<variante>…]. Añadir variantes (fabricante,
  // referencia) alarga el token sin romper a quien lee el prefijo: el kit resuelve por el prefijo más largo conocido.
  const T = (id, category, es, en, zh) => [id, Object.freeze({ id, category, names: Object.freeze({ es, en, zh }) })];
  const TAXONOMY = Object.freeze(Object.fromEntries([
    T('material.wood.oak.natural', 'wood', 'Roble natural', 'Natural oak', '天然橡木'),
    T('material.wood.oak.oiled', 'wood', 'Roble aceitado', 'Oiled oak', '油蜡橡木'),
    T('material.wood.walnut.satin', 'wood', 'Nogal satinado', 'Satin walnut', '缎面胡桃木'),
    T('material.wood.ash.veneer', 'wood', 'Chapa de fresno', 'Ash veneer', '白蜡木饰面'),
    T('material.wood.lacquer.satin', 'wood', 'Lacado satinado', 'Satin lacquer', '缎面烤漆'),
    T('material.ceramic.porcelain.polished', 'ceramic', 'Porcelánico pulido', 'Polished porcelain', '抛光瓷砖'),
    T('material.ceramic.porcelain.matte', 'ceramic', 'Porcelánico mate', 'Matte porcelain', '哑光瓷砖'),
    T('material.ceramic.porcelain.antislip', 'ceramic', 'Porcelánico antideslizante', 'Anti-slip porcelain', '防滑瓷砖'),
    T('material.ceramic.glaze.gloss', 'ceramic', 'Cerámica esmaltada', 'Glazed ceramic', '釉面陶瓷'),
    T('material.ceramic.sanitary.vitreous', 'ceramic', 'Loza sanitaria', 'Vitreous china', '卫浴陶瓷'),
    T('material.stone.marble.polished', 'stone', 'Mármol pulido', 'Polished marble', '抛光大理石'),
    T('material.stone.terrazzo.honed', 'stone', 'Terrazo apomazado', 'Honed terrazzo', '水磨石'),
    T('material.stone.compact.worktop', 'stone', 'Piedra compacta', 'Compact stone', '石英石台面'),
    T('material.plaster.painted.matte', 'plaster', 'Yeso pintado mate', 'Matte painted plaster', '哑光涂料墙面'),
    T('material.fabric.linen.natural', 'fabric', 'Lino natural', 'Natural linen', '天然亚麻'),
    T('material.fabric.cotton.plain', 'fabric', 'Algodón liso', 'Plain cotton', '纯棉'),
    T('material.fabric.velvet.cotton', 'fabric', 'Terciopelo de algodón', 'Cotton velvet', '棉质天鹅绒'),
    T('material.fabric.wool.carpet', 'fabric', 'Moqueta de lana', 'Wool carpet', '羊毛地毯'),
    T('material.fabric.wool.rug', 'fabric', 'Alfombra de lana', 'Wool rug', '羊毛小地毯'),
    T('material.fabric.outdoor.canvas', 'fabric', 'Lona de exterior', 'Outdoor canvas', '户外帆布'),
    T('material.thread.cotton.fine', 'thread', 'Hilo de algodón fino', 'Fine cotton thread', '细棉线'),
    T('material.leather.natural.aniline', 'leather', 'Piel natural anilina', 'Aniline leather', '苯胺真皮'),
    T('material.leather.synthetic.pu', 'leather', 'Piel sintética', 'Synthetic leather', '人造革'),
    T('material.leather.suede', 'leather', 'Ante', 'Suede', '麂皮'),
    T('material.metal.stainless.brushed', 'metal', 'Acero inoxidable cepillado', 'Brushed stainless steel', '拉丝不锈钢'),
    T('material.metal.aluminium.anodised', 'metal', 'Aluminio anodizado', 'Anodised aluminium', '阳极氧化铝'),
    T('material.metal.painted.satin', 'metal', 'Metal lacado satinado', 'Satin painted metal', '缎面喷涂金属'),
    T('material.plastic.technical.matte', 'plastic', 'Plástico técnico mate', 'Matte technical plastic', '哑光工程塑料'),
    T('material.glass.clear', 'glass', 'Vidrio transparente', 'Clear glass', '透明玻璃'),
    T('material.art.canvas.printed', 'art', 'Lienzo impreso', 'Printed canvas', '印刷画布'),
    T('material.paper.uncoated', 'paper', 'Papel sin estucar', 'Uncoated paper', '非涂布纸'),
    T('material.plant.leaf.generic', 'plant', 'Hoja (especie sin identificar)', 'Leaf (species unidentified)', '叶片（未识别品种）'),
  ]));

  // Catálogo de materiales de RUBIK (biblioteca de suelos/paredes) → token. Es la equivalencia DOCUMENTADA del catálogo:
  // cuando el profesional eligió uno de estos materiales, su identidad queda declarada sin adivinar.
  const CATALOG = Object.freeze({
    byId: Object.freeze({ mat_wood: 'material.wood.oak.natural', mat_walnut: 'material.wood.walnut.satin', mat_tile800: 'material.ceramic.porcelain.polished',
      mat_tile600: 'material.ceramic.porcelain.matte', mat_marble: 'material.stone.marble.polished', mat_antislip: 'material.ceramic.porcelain.antislip',
      mat_terrazzo: 'material.stone.terrazzo.honed', mat_carpet: 'material.fabric.wool.carpet' }),
    // preset del catálogo (familia) → token: solo familias inequívocas
    byPreset: Object.freeze({ wood: 'material.wood.oak.natural', walnut: 'material.wood.walnut.satin', 'tile-800': 'material.ceramic.porcelain.polished',
      'tile-600': 'material.ceramic.porcelain.matte', 'tile-300': 'material.ceramic.porcelain.antislip', marble: 'material.stone.marble.polished',
      terrazzo: 'material.stone.terrazzo.honed', carpet: 'material.fabric.wool.carpet', 'surface-oak-wood-planks': 'material.wood.oak.natural',
      'surface-marble-01': 'material.stone.marble.polished', 'surface-painted-plaster-wall': 'material.plaster.painted.matte',
      'surface-white-plaster-02': 'material.plaster.painted.matte', 'surface-plastered-wall-03': 'material.plaster.painted.matte' }),
  });
  const KEY = /^[A-Za-z0-9_:.-]{1,80}$/;
  const key = v => typeof v === 'string' && KEY.test(v) ? v : null;
  const isToken = v => typeof v === 'string' && /^material(\.[a-z0-9-]{1,32}){2,8}$/.test(v);

  /** Token conocido más específico para un token (prefijo más largo); null si la familia no existe en esta taxonomía. */
  function known(token) {
    if (!isToken(token)) return null;
    const parts = token.split('.');
    for (let n = parts.length; n >= 3; n--) { const t = parts.slice(0, n).join('.'); if (TAXONOMY[t]) return t; }
    return null;
  }

  /** Identidad pedida para un material del proyecto: explícita (token declarado en el material) → catálogo por id →
   *  catálogo por preset → sin identidad. Nunca por color: el color orienta una aproximación, no acredita un material. */
  function identityOf(mat) {
    if (!mat) return { token: null, source: 'none', certainty: 'unknown', projectMaterialId: null, reason: 'la superficie no tiene material asignado' };
    const pid = key(mat.id), declared = mat.appearance && mat.appearance.materialToken;
    if (isToken(declared)) return { token: declared, source: 'explicit', certainty: 'declared', projectMaterialId: pid, knownToken: known(declared), reason: null };
    // El profesional ELIGIÓ este material del catálogo de RUBIK para la superficie: selección explícita con identidad documentada.
    if (pid && CATALOG.byId[pid]) return { token: CATALOG.byId[pid], source: 'explicit', certainty: 'documented', projectMaterialId: pid, reason: null };
    const preset = key(mat.appearance && mat.appearance.preset);
    if (preset && CATALOG.byPreset[preset]) return { token: CATALOG.byPreset[preset], source: 'catalog', certainty: 'documented', projectMaterialId: pid, preset, reason: null };
    return { token: null, source: 'none', certainty: 'unknown', projectMaterialId: pid, preset, reason: 'material del proyecto sin equivalencia en la taxonomía: el kit aproximará por familia y lo declarará' };
  }

  /** Documento rubik-materiales.json (derivado del proyecto). Superficies con material del proyecto (suelos de estancia y
   *  caras de muro) y objetos (tipo de catálogo, sin material declarado salvo `materialToken` explícito en el objeto). */
  function materialsDoc({ project }) {
    if (!project || !Array.isArray(project.rooms)) throw Error('materialsDoc: project is required');
    const mats = new Map((project.materials || []).map(m => [m.id, m]));
    const assignments = [];
    for (const r of project.rooms) {
      if (!key(r.id) || !Array.isArray(r.polygon) || r.polygon.length < 3) continue;
      assignments.push({ target: { kind: 'room-floor', id: r.id, slot: 'floor' }, requested: identityOf(mats.get(r.floorMaterialId)) });
    }
    for (const w of project.walls || []) {
      if (!key(w.id) || !w.surfaceMaterialId) continue;
      assignments.push({ target: { kind: 'wall', id: w.id, slot: 'surface' }, requested: identityOf(mats.get(w.surfaceMaterialId)) });
    }
    for (const o of project.objects || []) {
      if (!o || !key(o.id)) continue;
      // `materialToken` por objeto: el contrato lo admite, pero el esquema del proyecto aún no tiene ese campo (decisión del
      // propietario pendiente). Hasta entonces ningún proyecto válido lo trae y el kit aproxima por tipo y pieza.
      const t = o.materialToken;
      assignments.push({ target: { kind: 'object', id: o.id, slot: '*', type: /^[a-z0-9_-]{1,40}$/.test(o.type || '') ? o.type : null },
        requested: isToken(t) ? { token: t, source: 'explicit', certainty: 'declared', knownToken: known(t), reason: null }
          : { token: null, source: 'none', certainty: 'unknown', reason: 'el proyecto no declara el material de este objeto: tipo y color solo orientan una aproximación' } });
    }
    const used = [...new Set(assignments.map(a => a.requested.token).filter(Boolean))].sort();
    return { format: FORMAT, version: VERSION, taxonomyVersion: TAXONOMY_VERSION, authority: 'project (this file is a derived, fingerprinted view)',
      resolutionOrder: ['explicit', 'catalog', 'approximation', 'reserve'],
      tokens: Object.fromEntries(used.map(t => [t, TAXONOMY[known(t)] ? { known: known(t), category: TAXONOMY[known(t)].category, names: TAXONOMY[known(t)].names } : { known: null }])),
      assignments };
  }

  return Object.freeze({ FORMAT, VERSION, TAXONOMY_VERSION, FILE, TAXONOMY, CATALOG, isToken, known, identityOf, materialsDoc });
});
