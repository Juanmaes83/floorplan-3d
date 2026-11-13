/* SCULPT-R02-A · CeilingLayoutEvidenceV1 — RUBIK adapter around the R02-A donor (verbatim workshop extracts, MIT).
 *
 * Contract: given a read-only RUBIK project (FloorPlanProjectV1) or building level (FloorPlanBuildingV1) and requested
 * ceiling / high items, return PROPOSALS with their plan pose, vertical mounting and the checks the donor knows how to
 * make (wall overlap, wall-fit relocation, clear-height rule), plus interferences. It never writes to the project,
 * never applies a proposal, never invents a ceiling height or a mounting height (missing → `unknown`), and is not an
 * MEP, lighting, HVAC or regulatory design tool. Pure: no DOM, network, clock or randomness.
 *
 * Units mm. Plan: origin plan-top-left, x right, y down, rotation degrees clockwise on screen (same as RUBIK and as the
 * donor's footprint()). Vertical: heights measured up from the reference floor named in `vertical.reference`.
 */
(function (root) {
  'use strict';
  const node = typeof module === 'object' && typeof require === 'function';
  const D = node ? require('./r02a-donor-extracts.js') : root.RubikR02DonorExtracts;

  const SCHEMA = 'rubik.ceiling-layout-evidence', VERSION = 1;
  const DONOR = Object.freeze({ repo: 'zhuzhuyumeng/floorplan-3d', upstreamPr: 'wy51ai/floorplan-3d#17', commit: '324eb64cf9b26f6d4df8323c2dec4591fa4691e3', parent: '88323f3cc4ab5960570560192dee3d6163186a94', license: 'MIT (declared in the donor tree; GOV-05 pending)' });
  const LIMITS = Object.freeze({ maxRequests: 200, coordMm: 1000000, sizeMm: 50000, dropMm: 10000, curtainMinMm: 100, curtainMaxMm: 10000, clearMinMm: 1, clearMaxMm: 100000 });
  const STANDING_LIMITS = Object.freeze(['not-integrated-in-rubik', 'proposals-not-applied', 'human-review-required', 'not-mep-design',
    'no-lighting-calculation', 'no-hvac-sizing', 'not-regulatory', 'no-suspended-ceiling-geometry', 'plan-and-vertical-checks-only']);
  // Donor catalogue (extract B), kept as donor defaults: they are generic sizes of the donor, not measured products.
  const KIND = { ceilinglight: 'ceiling-mounted', pendant: 'ceiling-mounted', bathheater: 'ceiling-mounted', curtaintrack: 'curtain', curtainbox: 'curtain', acwall: 'wall-high' };
  const CATALOG = Object.freeze(Object.fromEntries(D.CEILING_LIB[0].items.map(([type, name, w, d, color, h]) => [type, Object.freeze({ type, donorName: name, widthMm: w, depthMm: d, heightMm: h, color, kind: KIND[type], source: 'donor CEILING_LIB @324eb64' })])));
  // Donor creation defaults (extract E). Only applied with options.useDonorDefaults, and always labelled as such.
  const DONOR_DEFAULTS = Object.freeze({ dropMm: t => t === 'acwall' ? 200 : 0, curtainMarginMm: 20, curtainMinMm: 100 });
  const ID_RE = /^[a-zA-Z0-9_-]{1,64}$/;
  // The ONE vertical formula (donor rule D + 3D placement F), used by propose() and re-checked by validate().
  function mountFrom(clear, drop, h, curtain) {
    const top = clear - drop, bottom = top - h, lowest = bottom - curtain;
    return { topMm: top, bottomMm: bottom, lowestPointMm: lowest, fitsClearHeight: drop + h + curtain <= clear };
  }

  const finite = v => typeof v === 'number' && Number.isFinite(v);
  const fail = (code, detail) => ({ ok: false, error: detail ? { code, detail } : { code } });
  const clone = v => JSON.parse(JSON.stringify(v));
  const norm360 = r => ((r % 360) + 360) % 360;

  // ---- geometry bridges RUBIK → donor ------------------------------------------------------------------------------
  // RUBIK wall: centre-line segment + symmetric thickness. Axis-aligned walls become the donor's exact rectangles;
  // other walls become oriented quads (the donor's overlap() is a general convex SAT test).
  function wallShape(w) {
    const { start: a, end: b } = w, t = w.thicknessMm / 2, dx = b.x - a.x, dy = b.y - a.y, L = Math.hypot(dx, dy);
    if (!(L > 0) || !(t > 0)) return null;
    if (dy === 0 || dx === 0) {
      const r = dy === 0 ? [Math.min(a.x, b.x), a.y - t, Math.max(a.x, b.x), a.y + t] : [a.x - t, Math.min(a.y, b.y), a.x + t, Math.max(a.y, b.y)];
      return { id: w.id, axisAligned: true, rect: r, poly: [[r[0], r[1]], [r[2], r[1]], [r[2], r[3]], [r[0], r[3]]] };
    }
    const nx = -dy / L * t, ny = dx / L * t;
    return { id: w.id, axisAligned: false, rect: null, poly: [[a.x + nx, a.y + ny], [b.x + nx, b.y + ny], [b.x - nx, b.y - ny], [a.x - nx, a.y - ny]] };
  }
  const activeWalls = p => (p.walls || []).filter(w => w && w.status !== 'demolished').map(wallShape).filter(Boolean);
  // C3b: RUBIK stores integer millimetres. The donor relocation returns real numbers: round, then re-check with the donor
  // test itself; try the four neighbouring integer poses before giving up (never return a pose that overlaps a wall).
  function integerPose(q, x, y, donorWalls) {
    if (Number.isInteger(x) && Number.isInteger(y)) return { x, y };
    const cands = [[Math.round(x), Math.round(y)], [Math.floor(x), Math.floor(y)], [Math.ceil(x), Math.ceil(y)], [Math.floor(x), Math.ceil(y)], [Math.ceil(x), Math.floor(y)]];
    for (const [cx, cy] of cands) if (D.furniturePlacement({ ...donorItem(q), cx, cy }, { walls: donorWalls }, []).ok) return { x: cx, y: cy };
    return null;
  }
  const donorItem = q => ({ cx: q.position.x, cy: q.position.y, w: q.size.widthMm, d: q.size.depthMm, rot: q.rotationDeg });
  function inPoly(x, y, poly) { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const a = poly[i], b = poly[j]; if ((a.y > y) !== (b.y > y) && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) c = !c; } return c; }

  // ---- vertical reference: declared, derived from the level above, or unknown ----------------------------------------
  function ceilingReference({ project, building = null, levelId = null, declared = null } = {}) {
    const walls = (project?.walls || []).filter(w => w && w.status !== 'demolished' && finite(w.heightMm)).map(w => w.heightMm);
    const context = { wallHeightsMm: walls.length ? { min: Math.min(...walls), max: Math.max(...walls), note: 'context only, never used as the ceiling' } : null };
    let dec = null, der = null;
    if (declared != null) {
      if (typeof declared !== 'object' || !Number.isInteger(declared.clearHeightMm) || declared.clearHeightMm < LIMITS.clearMinMm || declared.clearHeightMm > LIMITS.clearMaxMm
        || !['finished-floor', 'level-floor'].includes(declared.reference) || typeof declared.source !== 'string' || !declared.source || declared.source.length > 200) return { error: 'ceiling-declaration-invalid' };
      dec = { clearHeightMm: declared.clearHeightMm, reference: declared.reference, source: declared.source };
    }
    if (building && levelId) {
      const i = building.levels.findIndex(l => l.id === levelId), above = building.levels[i + 1];
      if (i >= 0 && above) der = { clearHeightMm: above.elevationMm - above.slabThicknessMm - building.levels[i].elevationMm, reference: 'level-floor', source: `FloorPlanBuildingV1: next level «${above.name}» elevation ${above.elevationMm} − slab ${above.slabThicknessMm} − this level ${building.levels[i].elevationMm}` };
    }
    if (dec && der && (dec.clearHeightMm !== der.clearHeightMm || dec.reference !== der.reference))
      return { vertical: { status: 'contradictory', clearHeightMm: null, reference: null, declared: dec, derived: der, ...context } };
    const v = dec || der;
    return { vertical: v ? { status: dec ? 'declared' : 'derived', ...v, ...(dec && der ? { derivedAgrees: true } : {}), ...context } : { status: 'unknown', clearHeightMm: null, reference: null, ...context } };
  }

  // ---- request validation -----------------------------------------------------------------------------------------
  function cleanRequest(r, i) {
    const at = 'request ' + i;
    if (!r || typeof r !== 'object' || Array.isArray(r)) return { error: 'request-invalid', detail: at };
    if (typeof r.id !== 'string' || !ID_RE.test(r.id)) return { error: 'request-id-invalid', detail: at };
    if (!CATALOG[r.type]) return { error: 'unknown-type', detail: at };
    const cat = CATALOG[r.type];
    const nums = [r.position?.x, r.position?.y, r.rotationDeg ?? 0, r.size?.widthMm ?? cat.widthMm, r.size?.depthMm ?? cat.depthMm, r.size?.heightMm ?? cat.heightMm];
    if (r.dropMm != null) nums.push(r.dropMm);
    if (r.curtainLengthMm != null) nums.push(r.curtainLengthMm);
    if (!nums.every(finite)) return { error: 'invalid-number', detail: at };
    if (Math.abs(r.position.x) > LIMITS.coordMm || Math.abs(r.position.y) > LIMITS.coordMm) return { error: 'position-out-of-range', detail: at };
    const size = { widthMm: r.size?.widthMm ?? cat.widthMm, depthMm: r.size?.depthMm ?? cat.depthMm, heightMm: r.size?.heightMm ?? cat.heightMm };
    if (!Object.values(size).every(v => v > 0 && v <= LIMITS.sizeMm)) return { error: 'invalid-size', detail: at };
    if (r.dropMm != null && (r.dropMm < 0 || r.dropMm > LIMITS.dropMm)) return { error: 'invalid-drop', detail: at };
    if (r.curtainLengthMm != null && (cat.kind !== 'curtain' || r.curtainLengthMm < LIMITS.curtainMinMm || r.curtainLengthMm > LIMITS.curtainMaxMm)) return { error: 'invalid-curtain-length', detail: at };
    return { req: { id: r.id, type: r.type, position: { x: r.position.x, y: r.position.y }, rotationDeg: norm360(r.rotationDeg ?? 0), size,
      sizeSource: r.size ? 'request' : 'donor-catalog', dropMm: r.dropMm ?? null, curtainLengthMm: r.curtainLengthMm ?? null } };
  }

  // ---- proposals --------------------------------------------------------------------------------------------------
  function propose({ project, building = null, levelId = null, ceiling = null, requests = [], options = {} } = {}) {
    if (building) {
      if (!Array.isArray(building.levels)) return fail('building-invalid');
      const level = building.levels.find(l => l.id === levelId);
      if (!level) return fail('level-not-found');
      project = level.project;
    }
    if (!project || !Array.isArray(project.walls) || !Array.isArray(project.rooms)) return fail('project-invalid');
    if (!Array.isArray(requests) || requests.length > LIMITS.maxRequests) return fail('requests-invalid');
    const reqs = [];
    for (let i = 0; i < requests.length; i++) { const c = cleanRequest(requests[i], i); if (c.error) return fail(c.error, c.detail); reqs.push(c.req); }
    if (new Set(reqs.map(r => r.id)).size !== reqs.length) return fail('duplicate-request-id');
    const ref = ceilingReference({ project, building, levelId, declared: ceiling });
    if (ref.error) return fail(ref.error);
    const vertical = ref.vertical, clear = vertical.status === 'declared' || vertical.status === 'derived' ? vertical.clearHeightMm : null;
    const useDefaults = options.useDonorDefaults === true;
    const walls = activeWalls(project), donorWalls = walls.filter(w => w.axisAligned).map(w => [...w.rect, 'n', w.id]);
    const allAxisAligned = walls.every(w => w.axisAligned);

    const proposals = reqs.map(q => {
      const cat = CATALOG[q.type], warnings = [];
      // Vertical mounting (donor rule D: drop + h + curtain <= clear; donor 3D F: top = clear - drop, bottom = top - h).
      let drop = q.dropMm, dropSource = drop == null ? null : 'request', curtain = q.curtainLengthMm, curtainSource = curtain == null ? null : 'request';
      if (drop == null && useDefaults) { drop = DONOR_DEFAULTS.dropMm(q.type); dropSource = 'donor-default'; }
      if (cat.kind === 'curtain' && curtain == null && useDefaults && clear != null) { curtain = Math.max(DONOR_DEFAULTS.curtainMinMm, clear - q.size.heightMm - DONOR_DEFAULTS.curtainMarginMm); curtainSource = 'donor-default'; }
      if (drop == null) warnings.push('drop-unknown');
      if (cat.kind === 'curtain' && curtain == null) warnings.push('curtain-length-unknown');
      if (clear == null) warnings.push('ceiling-' + vertical.status);
      const known = clear != null && drop != null && (cat.kind !== 'curtain' || curtain != null);
      const mf = known ? mountFrom(clear, drop, q.size.heightMm, cat.kind === 'curtain' ? curtain : 0) : null;
      const top = known ? mf.topMm : null, bottom = known ? mf.bottomMm : null, lowest = known ? mf.lowestPointMm : null;
      const verticalOk = known ? mf.fitsClearHeight : null;
      if (verticalOk === false) warnings.push('exceeds-clear-height');
      const mount = { status: known ? 'computed' : 'unknown', reference: known ? vertical.reference : null, dropMm: drop, dropSource,
        topMm: top, bottomMm: bottom, curtainLengthMm: cat.kind === 'curtain' ? curtain : null, curtainSource: cat.kind === 'curtain' ? curtainSource : null, lowestPointMm: lowest, fitsClearHeight: verticalOk };
      // Plan: room, wall overlap (donor A, touching allowed), and the donor's wall-fit relocation (axis-aligned walls only).
      const fp = D.footprint(donorItem(q));
      const room = (project.rooms || []).filter(r => Array.isArray(r.polygon) && inPoly(q.position.x, q.position.y, r.polygon));
      if (!room.length) warnings.push('outside-rooms');
      const hit = walls.find(w => D.overlap(fp, w.poly));
      let suggestion;
      if (!hit) suggestion = { status: 'in-place', position: { ...q.position }, donorMessage: '' };
      else if (!allAxisAligned) { suggestion = { status: 'unsupported-wall-orientation', position: null, donorMessage: null }; warnings.push('relocation-needs-axis-aligned-walls'); }
      else {
        const r = D.resolveFurniturePlacement(donorItem(q), { walls: donorWalls }, []);
        suggestion = r.ok ? { status: r.moved ? 'moved' : 'in-place', position: integerPose(q, r.cx, r.cy, donorWalls), donorPosition: { x: r.cx, y: r.cy }, donorMessage: r.message } : { status: 'no-fit', position: null, donorMessage: r.message };
        // C3a: the donor resolves walls only; a relocation may leave the room (it moves oversized items out of the gap).
        if (suggestion.position) {
          const inRooms = (project.rooms || []).filter(rm => Array.isArray(rm.polygon) && inPoly(suggestion.position.x, suggestion.position.y, rm.polygon));
          suggestion.roomId = inRooms.length === 1 ? inRooms[0].id : null;
          if (suggestion.roomId !== (room.length === 1 ? room[0].id : null)) warnings.push('suggestion-leaves-room');
        }
        if (suggestion.position === null && r.ok) { suggestion = { status: 'no-integer-pose', position: null, donorPosition: { x: r.cx, y: r.cy }, donorMessage: r.message }; warnings.push('no-integer-wall-free-pose'); }
      }
      if (hit) warnings.push('overlaps-wall');
      if (suggestion.status === 'no-fit') warnings.push('no-wall-free-position');
      return { id: q.id, type: q.type, kind: cat.kind, layer: 'ceiling', position: q.position, rotationDeg: q.rotationDeg, size: q.size, sizeSource: q.sizeSource,
        roomId: room.length === 1 ? room[0].id : null, mount, plan: { wallContact: hit ? 'overlaps' : 'clear', wallId: hit ? hit.id : null, suggestion },
        interferences: [], floorClearance: [], warnings, review: 'unreviewed', status: 'proposed-not-applied' };
    });

    // Interferences between proposals: plan overlap (donor SAT) and, when both are known, the vertical intervals.
    const span = p => p.mount.status === 'computed' ? [p.mount.lowestPointMm, p.mount.topMm] : null;
    for (let i = 0; i < proposals.length; i++) for (let j = i + 1; j < proposals.length; j++) {
      const a = proposals[i], b = proposals[j];
      if (!D.overlap(D.footprint(donorItem(a)), D.footprint(donorItem(b)))) continue;
      const sa = span(a), sb = span(b);
      const kind = !sa || !sb ? 'plan-overlap-vertical-unknown' : (Math.min(sa[1], sb[1]) > Math.max(sa[0], sb[0]) ? 'overlap-3d' : 'plan-overlap-vertically-clear');
      a.interferences.push({ with: b.id, kind }); b.interferences.push({ with: a.id, kind });
    }
    // The floor layer is read only: a ceiling item never moves or replaces floor objects; vertical clearance is reported.
    const objects = Array.isArray(project.objects) ? project.objects : [];
    for (const p of proposals) {
      const fp = D.footprint(donorItem(p));
      for (const o of objects) {
        if (!o?.position || !o.size || ![o.position.x, o.position.y, o.size.widthMm, o.size.depthMm].every(finite)) continue;
        if (!D.overlap(fp, D.footprint({ cx: o.position.x, cy: o.position.y, w: o.size.widthMm, d: o.size.depthMm, rot: o.rotationDeg || 0 }))) continue;
        const objTop = finite(o.size.heightMm) ? (o.elevationMm || 0) + o.size.heightMm : null;
        const low = p.mount.lowestPointMm;
        const entry = { objectId: o.id, objectTopMm: objTop };
        if (objTop == null) entry.status = 'object-height-unknown';
        else if (low == null) entry.status = 'proposal-height-unknown';
        else if (vertical.reference !== 'finished-floor' && vertical.reference !== 'level-floor') entry.status = 'reference-unknown';
        else { entry.clearanceMm = low - objTop; entry.status = entry.clearanceMm >= 0 ? 'clear' : 'clash'; }
        p.floorClearance.push(entry);
        if (entry.status === 'clash') p.warnings.push('clashes-with-floor-object');
      }
    }
    const warnings = [];
    if (vertical.status !== 'declared' && vertical.status !== 'derived') warnings.push('ceiling-' + vertical.status);
    if (!allAxisAligned) warnings.push('non-axis-aligned-walls');
    if (proposals.some(p => p.interferences.some(x => x.kind === 'overlap-3d'))) warnings.push('proposals-interfere');
    return { ok: true, evidence: {
      schema: SCHEMA, version: VERSION, canonical: false, applied: false,
      frame: { units: 'mm', origin: 'plan-top-left', xAxis: 'right', yAxis: 'down', rotation: 'degrees-clockwise' },
      vertical, levelId: building ? levelId : null,
      source: { engine: 'sculpt-r02a', donor: { ...DONOR }, extracts: ['A footprint/overlap/furniturePlacement/resolveFurniturePlacement', 'B CEILING_LIB'], rules: ['D drop+h+curtain<=clear', 'E creation defaults (opt-in)', 'F 3D vertical placement'], useDonorDefaults: useDefaults },
      proposals, floorLayer: { readOnly: true, objectCount: objects.length },
      warnings, limits: STANDING_LIMITS.slice()
    } };
  }

  // What WOULD change if a human accepted a proposal. Informative only: nothing is applied and there is no apply function.
  // Closing audit 11/11: three states. BLOCKED (evidence of infeasibility) and PENDING (data missing) never produce a
  // `would-add`; only a CANDIDATE with no known blocker does, still `not-applied` and waiting for a human. A failed
  // relocation never falls back to the original position. Full containment of the rotated footprint in the room polygon
  // is NOT evaluated here (future surgery): it is listed in `notEvaluated` instead of being implied.
  const NOT_EVALUATED = Object.freeze(['rotated-footprint-containment-in-room', 'door-swing', 'stairs', 'regulatory-checks']);
  function previewState(p) {
    const blocked = [], pending = [];
    if (!p || typeof p !== 'object') return { state: 'blocked', blocked: ['invalid-proposal'], pending };
    const sg = p.plan?.suggestion, m = p.mount;
    if (!sg) blocked.push('plan-missing');
    else {
      if (['no-fit', 'no-integer-pose', 'unsupported-wall-orientation'].includes(sg.status)) blocked.push(sg.status === 'no-fit' ? 'no-wall-free-position' : sg.status);
      if (sg.status === 'moved' && !sg.position) blocked.push('moved-without-position');
      if (sg.status === 'moved' && sg.position && sg.roomId !== p.roomId) blocked.push('suggestion-leaves-room');
    }
    if (p.roomId == null) blocked.push('outside-rooms');
    if (!m || m.status !== 'computed') pending.push('mount-unknown');
    else if (m.fitsClearHeight === false) blocked.push('exceeds-clear-height');
    for (const x of Array.isArray(p.interferences) ? p.interferences : []) {
      if (x?.kind === 'overlap-3d') blocked.push('overlap-3d-with:' + x.with);
      else if (x?.kind === 'plan-overlap-vertical-unknown') pending.push('vertical-overlap-unknown-with:' + x.with);
    }
    for (const c of Array.isArray(p.floorClearance) ? p.floorClearance : []) {
      if (c?.status === 'clash') blocked.push('clash-with-floor-object:' + c.objectId);
      else if (c?.status === 'object-height-unknown') pending.push('floor-object-height-unknown:' + c.objectId);
      else if (c?.status === 'proposal-height-unknown' || c?.status === 'reference-unknown') pending.push(c.status + ':' + c.objectId);
    }
    return { state: blocked.length ? 'blocked' : pending.length ? 'pending' : 'candidate-reviewable', blocked, pending };
  }
  function previewDiff(ev) {
    return (Array.isArray(ev?.proposals) ? ev.proposals : []).map((p, i) => {
      const { state, blocked, pending } = previewState(p), sg = p?.plan?.suggestion;
      const base = { id: p?.id ?? null, index: i, type: p?.type ?? null, layer: 'ceiling', state, status: 'not-applied', review: 'human-required',
        originalPosition: p?.position ? { x: p.position.x, y: p.position.y } : null, suggestedPosition: sg?.position ? { x: sg.position.x, y: sg.position.y } : null };
      if (state === 'candidate-reviewable')
        return { op: 'would-add', ...base, position: base.suggestedPosition, relocated: sg.status === 'moved', mount: p.mount.status, reasons: [], notEvaluated: NOT_EVALUATED.slice() };
      return { op: 'none', ...base, reasons: state === 'blocked' ? [...blocked, ...pending] : pending, notEvaluated: NOT_EVALUATED.slice() };
    });
  }

  // ---- validation and serialisation -------------------------------------------------------------------------------
  function validate(ev) {
    const errs = [], add = m => { if (errs.length < 60) errs.push(m); };
    if (!ev || typeof ev !== 'object') return ['not-an-object'];
    if (ev.schema !== SCHEMA || ev.version !== VERSION) add('schema');
    if (ev.canonical !== false) add('canonical-must-be-false');
    if (ev.applied !== false) add('applied-must-be-false');
    const f = ev.frame;
    if (!f || f.units !== 'mm' || f.origin !== 'plan-top-left' || f.yAxis !== 'down' || f.rotation !== 'degrees-clockwise') add('frame');
    const v = ev.vertical;
    const vKnown = !!v && typeof v === 'object' && ['declared', 'derived'].includes(v.status);
    if (!v || typeof v !== 'object') add('vertical-missing');
    else if (!['declared', 'derived', 'unknown', 'contradictory'].includes(v.status)) add('vertical-status');
    else if (vKnown ? !(Number.isInteger(v.clearHeightMm) && v.clearHeightMm > 0 && ['finished-floor', 'level-floor'].includes(v.reference)) : (v.clearHeightMm !== null || v.reference !== null)) add('vertical-values');
    if (!Array.isArray(ev.proposals)) { add('proposals'); return errs; }
    const ids = new Set();
    ev.proposals.forEach((p, i) => {
      if (!p || typeof p !== 'object' || Array.isArray(p)) { add('proposal-not-object:' + i); return; }
      const id = p.id;
      if (typeof id !== 'string' || !ID_RE.test(id) || ids.has(id)) add('proposal-id:' + id); ids.add(id);
      const cat = CATALOG[p.type];
      if (!cat || p.layer !== 'ceiling' || p.kind !== cat.kind) add('proposal-type:' + id);
      if (!p.position || ![p.position.x, p.position.y, p.rotationDeg].every(finite)) add('proposal-geometry:' + id);
      const size = p.size, h = size?.heightMm;
      if (!size || typeof size !== 'object') add('proposal-size-missing:' + id);
      else if (![size.widthMm, size.depthMm, size.heightMm].every(x => finite(x) && x > 0)) add('proposal-geometry:' + id);
      if (p.review !== 'unreviewed' || p.status !== 'proposed-not-applied') add('proposal-state:' + id);
      const m = p.mount;
      if (!m || typeof m !== 'object') add('mount-missing:' + id);
      else if (!['computed', 'unknown'].includes(m.status)) add('mount-status:' + id);
      else if (m.status === 'computed') {
        // Every value present and finite (JSON turns NaN/Infinity into null: that is "missing"), the reference equal to
        // the evidence's, the curtain compatible with the type, then the relations of mountFrom() and the fit status.
        const isCurtain = cat?.kind === 'curtain';
        const fields = ['dropMm', 'topMm', 'bottomMm', 'lowestPointMm', ...(isCurtain ? ['curtainLengthMm'] : [])];
        let complete = true;
        for (const k of fields) {
          if (m[k] === undefined || m[k] === null) { add(`mount-missing-value:${k}:${id}`); complete = false; }
          else if (typeof m[k] !== 'number' || !Number.isFinite(m[k])) { add(`mount-non-finite:${k}:${id}`); complete = false; }
        }
        if (typeof m.fitsClearHeight !== 'boolean') { add('mount-missing-value:fitsClearHeight:' + id); complete = false; }
        if (!vKnown) { add('mount-without-ceiling:' + id); complete = false; }
        else if (m.reference !== v.reference) add('mount-reference-mismatch:' + id);
        if (!['request', 'donor-default'].includes(m.dropSource)) add('mount-source:' + id);
        if (isCurtain) {
          if (finite(m.curtainLengthMm) && (m.curtainLengthMm < LIMITS.curtainMinMm || m.curtainLengthMm > LIMITS.curtainMaxMm)) { add('mount-curtain-incompatible:' + id); complete = false; }
          if (!['request', 'donor-default'].includes(m.curtainSource)) add('mount-source:' + id);
        } else if (m.curtainLengthMm !== null || m.curtainSource !== null) { add('mount-curtain-incompatible:' + id); complete = false; }
        if (complete && finite(h) && h > 0) {
          const want = mountFrom(v.clearHeightMm, m.dropMm, h, isCurtain ? m.curtainLengthMm : 0);
          if (m.topMm !== want.topMm) add('mount-top:' + id);
          if (m.bottomMm !== want.bottomMm) add('mount-bottom:' + id);
          if (m.lowestPointMm !== want.lowestPointMm) add('mount-lowest:' + id);
          if (m.fitsClearHeight !== want.fitsClearHeight) add('mount-fits:' + id);
        }
      } else if (m.topMm != null || m.bottomMm != null || m.lowestPointMm != null || m.fitsClearHeight != null) add('mount-unknown-with-values:' + id);
      const plan = p.plan, sg = plan?.suggestion;
      if (!plan || typeof plan !== 'object') add('plan-missing:' + id);
      else if (!sg || typeof sg !== 'object') add('plan-suggestion-missing:' + id);
      else if (!['in-place', 'moved', 'no-fit', 'no-integer-pose', 'unsupported-wall-orientation'].includes(sg.status)) add('plan:' + id);
      else if (sg.position && !(Number.isInteger(sg.position.x) && Number.isInteger(sg.position.y))) add('plan-non-integer:' + id);
    });
    for (const p of ev.proposals) for (const x of (Array.isArray(p?.interferences) ? p.interferences : [])) if (!ids.has(x?.with)) add('interference-target:' + p.id);
    const walk = (o, path) => { if (!o || typeof o !== 'object') return; for (const [k, x] of Object.entries(o)) { if (/^(confidence|score|probability|lux|watts|circuit|airflow|certified)$/i.test(k)) add('forbidden-field:' + path + k); walk(x, path + k + '.'); } };
    walk(ev, '');
    if (!ev.floorLayer || ev.floorLayer.readOnly !== true) add('floor-layer');
    if (!Array.isArray(ev.limits) || !STANDING_LIMITS.every(l => ev.limits.includes(l))) add('limits');
    return errs;
  }
  const serialize = ev => JSON.stringify(ev);
  function parse(text) {
    let ev; try { ev = JSON.parse(text); } catch { return fail('invalid-json'); }
    const errs = validate(ev);
    return errs.length ? fail('invalid-evidence', errs.slice(0, 5).join(',')) : { ok: true, evidence: ev };
  }

  const api = { SCHEMA, VERSION, DONOR, LIMITS, STANDING_LIMITS, CATALOG, DONOR_DEFAULTS, NOT_EVALUATED, wallShape, ceilingReference, propose, previewDiff, validate, serialize, parse, clone };
  if (node && module.exports) module.exports = api; else root.RubikCeilingLayoutEvidence = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
