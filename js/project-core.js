/* FloorPlanProjectV1: validation, migration and shared renderer projection. No DOM/network. */
(function (root) {
  'use strict';
  const schema = typeof module !== 'undefined' ? require('./project-schema.js') : root.FloorPlanSchema;
  const reference = typeof module !== 'undefined' ? require('./reference-project.js') : root.FloorPlanReference;
  const Geo = typeof module !== 'undefined' ? require('./geo-provider.js') : root.FloorPlanGeoProvider;
  const ParcelSite = typeof module !== 'undefined' ? require('./parcel-site-adapter.js') : root.FloorPlanParcelSiteAdapter;
  const OrthophotoSite = typeof module !== 'undefined' ? require('./orthophoto-site-adapter.js') : root.FloorPlanOrthophotoSiteAdapter;
  const TerrainSite = typeof module !== 'undefined' ? require('./terrain-site-adapter.js') : root.FloorPlanTerrainSiteAdapter;
  const Territory = typeof module !== 'undefined' ? require('./territory-integration-core.js') : root.FloorPlanTerritoryIntegration;
  const Walls = typeof module !== 'undefined' ? require('./wall-geometry-core.js') : root.FloorPlanWallGeometry;
  // OP-07 · Resolution of every curved wall, the same for plan, 3D, measurements, openings and DXF (D-OP07-3). The
  // laboratory recommends a single metric tolerance of 1 mm (DECISIONES.md §2); it is a proposal, not a product
  // decision, so it lives in this one place. null = the donor's 16 facets. MAX_FACETS (1024) caps it either way.
  const WALL_PATH = Object.freeze({toleranceMm: 1});
  const WALL_FEATURES = Object.freeze(['wall.curve', 'wall.heightEnd']);   // what this writer understands (guardSave)
  const shapedWall = w => !!(w && (w.curve || w.heightEndMm !== undefined));
  // ── Versions (D-OP07-4, option B): the SINGLE authority that reads, compares and raises schemaVersion ─────────────
  // 1.x is FloorPlanProjectV1. 2.0 is the same contract plus the two non-ignorable wall fields (curve, heightEndMm):
  // only a document that uses them needs 2.x, so no v1 project is ever migrated in bulk. A 1.x reader rejects 2.x without
  // modifying anything (contract §3, «major desconocido»). 2.0 contains every 1.x feature up to 1.12; a feature added
  // to 1.x later as 1.(12+k) is 2.k. Every module raises and compares versions through these three functions.
  const V2_BASE_MINOR = 12;
  const parseVersion = v => { const m = /^(1|2)\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.exec(typeof v === 'string' ? v : ''); return m ? {major:+m[1], minor:+m[2], patch:+m[3]} : null; };
  const versionLine = v => v.major === 1 ? v.minor : V2_BASE_MINOR + v.minor;
  // Does a document of `version` already carry what `target` introduced? (2.x never goes below 2; 1.x never reaches 2.)
  function versionAtLeast(version, target) {
    const a = parseVersion(version), b = parseVersion(target);
    if (!a || !b) return false;
    if (b.major === 2 && a.major < 2) return false;
    return versionLine(a) >= versionLine(b);
  }
  // Raise `project.schemaVersion` (in place) to the lowest version that has both its features and `target`'s. Never
  // lowers anything and never turns a 1.x document into 2.x unless `target` is 2.x. Returns the project.
  function raiseVersion(project, target) {
    const a = parseVersion(project.schemaVersion), b = parseVersion(target);
    if (!a || !b) throw new Error(`/schemaVersion: cannot raise ${project.schemaVersion} to ${target}`);
    if (versionAtLeast(project.schemaVersion, target)) return project;
    const major = Math.max(a.major, b.major), line = Math.max(versionLine(a), versionLine(b));
    project.schemaVersion = major === 1 ? `1.${line}.0` : `2.${Math.max(0, line - V2_BASE_MINOR)}.0`;
    return project;
  }
  // OP-07 · Save gate for the persistence write path (F0.2b): refuses a degraded legacy view, a writer that does not know
  // a feature the project uses, the loss of a curve, a slope, a wall or an opening without an explicit intent, and walls
  // or openings that break the rules. `writerFeatures` defaults to this writer's; an older writer passes its own (none).
  function guardSave(previous, next, {intent = {}, writerFeatures = WALL_FEATURES} = {}) {
    return Walls.guardSave({previous, next, writerFeatures, intent});
  }
  const wallLength = w => shapedWall(w) ? Walls.pathProfile(w, WALL_PATH).length : Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = (path, message) => { throw new Error(`${path}: ${message}`); };
  const id = prefix => `${prefix}_${globalThis.crypto.randomUUID().replaceAll('-', '')}`;
  const point = p => ({x: Math.round(p.x), y: Math.round(p.y)});
  const lists = ['walls', 'openings', 'rooms', 'materials', 'objects', 'measurements', 'sourceImages'];
  const roomFamilies = Object.freeze(['unspecified','living','dining','kitchen','bedroom','bathroom','toilet','office','hallway','storage','laundry','terrace','balcony','garage','utility','other']);
  const roomFamily = room => roomFamilies.includes(room?.family) ? room.family : 'unspecified';
  const roomName = (room, labels = {}, legacyName = name => name) => room?.name
    ? (room.family === undefined ? legacyName(room.name) : room.name)
    : labels[roomFamily(room)] || labels.unspecified || 'Estancia';
  function dateValid(value) {
    if (!/^\d{4}-\d\d-\d\d[Tt]\d\d:\d\d:\d\d(?:\.\d+)?(?:[Zz]|[+-]\d\d:\d\d)$/.test(value)) return false;
    const [y, m, d] = value.slice(0, 10).split('-').map(Number);
    const days = new Date(Date.UTC(y, m, 0)).getUTCDate();
    return m >= 1 && m <= 12 && d >= 1 && d <= days && Number.isFinite(Date.parse(value));
  }
  // Implements the keywords actually present in the authoritative F0 schema.
  function check(value, rule, path = '/', future = false) {
    if (rule.$ref) return check(value, schema.$defs[rule.$ref.split('/').at(-1)], path, future);
    if (Object.hasOwn(rule, 'const') && value !== rule.const) fail(path, `expected ${rule.const}`);
    if (rule.enum && !rule.enum.includes(value)) fail(path, `expected one of ${rule.enum.join(', ')}`);
    if (rule.type) {
      const ok = {object: value !== null && typeof value === 'object' && !Array.isArray(value),
        array: Array.isArray(value), string: typeof value === 'string', boolean: typeof value === 'boolean',
        number: typeof value === 'number' && Number.isFinite(value), integer: Number.isSafeInteger(value)}[rule.type];
      if (!ok) fail(path, `expected ${rule.type}`);
    }
    if (typeof value === 'number') {
      if (!Number.isFinite(value)) fail(path, 'number must be finite');
      if (rule.minimum !== undefined && value < rule.minimum) fail(path, `minimum ${rule.minimum}`);
      if (rule.maximum !== undefined && value > rule.maximum) fail(path, `maximum ${rule.maximum}`);
      if (rule.exclusiveMaximum !== undefined && value >= rule.exclusiveMaximum) fail(path, `must be below ${rule.exclusiveMaximum}`);
      if (rule.exclusiveMinimum !== undefined && value <= rule.exclusiveMinimum) fail(path, `must exceed ${rule.exclusiveMinimum}`);
    }
    if (typeof value === 'string') {
      const length = [...value].length;
      if (rule.minLength !== undefined && length < rule.minLength) fail(path, 'string too short');
      if (rule.maxLength !== undefined && length > rule.maxLength) fail(path, 'string too long');
      if (rule.pattern && !new RegExp(rule.pattern).test(value)) fail(path, 'invalid format');
      if (rule.format === 'date-time' && !dateValid(value)) fail(path, 'invalid date-time');
    }
    if (Array.isArray(value)) {
      if (rule.minItems !== undefined && value.length < rule.minItems) fail(path, 'too few items');
      if (rule.maxItems !== undefined && value.length > rule.maxItems) fail(path, 'too many items');
      if (rule.items) value.forEach((v, i) => check(v, rule.items, `${path}/${i}`, future));
    } else if (value !== null && typeof value === 'object') {
      for (const key of rule.required || []) if (!Object.hasOwn(value, key)) fail(path, `missing ${key}`);
      for (const [key, v] of Object.entries(value)) {
        const child = rule.properties && Object.hasOwn(rule.properties,key) ? rule.properties[key] : undefined;
        const pattern = Object.entries(rule.patternProperties || {}).find(([p]) => new RegExp(p).test(key));
        if (child) check(v, child, `${path}/${key}`, future);
        else if (pattern) check(v, pattern[1], `${path}/${key}`, future);
        else if (rule.additionalProperties === false && !future) fail(`${path}/${key}`, 'unknown field');
      }
    }
    for (const r of rule.allOf || []) check(value, r, path, future);
    if (rule.if) {
      let applies = true;
      try { check(value, rule.if, path, future); } catch { applies = false; }
      if (applies && rule.then) check(value, rule.then, path, future);
    }
  }
  const cross = (a, b, c) => (b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  function onSegment(a, b, p) {
    return cross(a, b, p) === 0 && p.x >= Math.min(a.x,b.x) && p.x <= Math.max(a.x,b.x) && p.y >= Math.min(a.y,b.y) && p.y <= Math.max(a.y,b.y);
  }
  function intersects(a, b, c, d) {
    const x = cross(a,b,c), y = cross(a,b,d), z = cross(c,d,a), t = cross(c,d,b);
    return (x*y < 0 && z*t < 0) || onSegment(a,b,c) || onSegment(a,b,d) || onSegment(c,d,a) || onSegment(c,d,b);
  }
  // `strict` treats every field the schema does not define as an error for any 1.x version. The building
  // container (js/building-core.js) uses it so an embedded level cannot carry meaning a 1.x reader would ignore.
  function validate(project, {strict = false} = {}) {
    if (project?.schema === 'rubik-sota.floorplan-building') fail('/schema', 'this is a multi-level building, not a FloorPlanProjectV1 project; open it in Rubik or export a single level');
    const version = project?.schemaVersion;
    if (!parseVersion(version)) fail('/schemaVersion', 'unsupported version');
    const future = version !== '1.0.0' && !strict;
    check(project, schema, '/', future);
    if(project.site!==undefined){
      if(!versionAtLeast(version,'1.7.0'))fail('/site','requires project 1.7.0');
      if(project.site.buildingPlacement!==undefined&&!versionAtLeast(version,'1.12.0'))fail('/site/buildingPlacement','requires project 1.12.0');
      try{Territory.validate(project.site);}catch(error){fail('/site/buildingPlacement',error.message);}
      try{Geo.validateSite(project.site);}catch(error){fail('/site',error.message);}
      if(project.site.parcel!==undefined){
        if(!versionAtLeast(version,'1.9.0'))fail('/site/parcel','requires project 1.9.0');
        check(project.site.parcel,schema.$defs.parcel,'/site/parcel',false);
        try{ParcelSite.fromSiteParcel(project.site.parcel);}catch(error){fail('/site/parcel',error.message);}
      }
      if(project.site.orthophoto!==undefined){
        if(!versionAtLeast(version,'1.10.0'))fail('/site/orthophoto','requires project 1.10.0');
        check(project.site.orthophoto,schema.$defs.orthophoto,'/site/orthophoto',false);
        try{OrthophotoSite.fromSiteOrthophoto(project.site.orthophoto,project.site.parcel);}catch(error){fail('/site/orthophoto',error.message);}
      }
      if(project.site.terrain!==undefined){
        if(!versionAtLeast(version,'1.11.0'))fail('/site/terrain','requires project 1.11.0');
        check(project.site.terrain,schema.$defs.terrain,'/site/terrain',false);
        try{TerrainSite.fromSiteTerrain(project.site.terrain,project.site.parcel);}catch(error){fail('/site/terrain',error.message);}
      }
    }
    if(project.roofParapet!==undefined&&!versionAtLeast(version,'1.8.0'))fail('/roofParapet','requires project 1.8.0');
    const ids = new Map([[project.id, 'project']]);
    const warnings = [];
    if (future) warnings.push('Newer V1 version: unknown fields are retained; unsupported values are rejected.');
    for (const k of lists) for (const x of project[k] || []) {
      if (ids.has(x.id)) fail(`/${k}/${x.id}`, 'duplicate ID');
      ids.set(x.id, k);
      if (x.source?.review === 'unreviewed' || x.source?.method === 'suggested') warnings.push(`${x.id}: ${x.source?.review==='confirmed'?'experimental suggested origin; human review recorded':'geometry not confirmed'}`);
    }
    const ref = (value, kind, path) => { if (ids.get(value) !== kind) fail(path, `missing ${kind} reference ${value}`); };
    const walls = new Map(project.walls.map(w => [w.id, w]));
    for(const w of project.walls)if(w.surfaceMaterialId){ref(w.surfaceMaterialId,'materials',`/walls/${w.id}/surfaceMaterialId`);if(project.materials.find(m=>m.id===w.surfaceMaterialId).category!=='wall')fail(`/walls/${w.id}/surfaceMaterialId`,'wall material required');}
    if(project.roofParapet?.materialId){ref(project.roofParapet.materialId,'materials','/roofParapet/materialId');if(project.materials.find(m=>m.id===project.roofParapet.materialId).category!=='wall')fail('/roofParapet/materialId','wall material required');}
    for (const w of project.walls) if (Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y) < 1) fail(`/walls/${w.id}`, 'zero-length wall');
    // OP-07 (2.0): curved and sloped walls. The fields are not ignorable, so only a 2.x document can carry them, and
    // each such wall must pass the wall rules of the single geometric core (minimum radius, no fold, end height).
    for (const w of project.walls) if (shapedWall(w)) {
      if (!versionAtLeast(version, '2.0.0')) fail(`/walls/${w.id}`, 'curve and heightEndMm require project 2.0.0');
      for (const message of Walls.validateWall(w)) fail(`/walls/${w.id}`, message);
    }
    for (const o of project.openings) {
      ref(o.wallId, 'walls', `/openings/${o.id}/wallId`);
      const w = walls.get(o.wallId), length = Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
      // A curved or sloped wall measures along its faceted path and under the lower edge of the opening (no clipping).
      if (shapedWall(w)) for (const message of Walls.validateOpening(w, o, WALL_PATH)) fail(`/openings/${o.id}`, message);
      else {
        if (o.offsetMm+o.widthMm > length+1e-7) fail(`/openings/${o.id}`, 'opening extends beyond wall');
        if (o.sillHeightMm+o.heightMm > w.heightMm) fail(`/openings/${o.id}`, 'opening exceeds wall height');
      }
      if (o.swing && o.kind !== 'door') fail(`/openings/${o.id}/swing`, 'swing only allowed on door');
    }
    for (const r of project.rooms) {
      ref(r.floorMaterialId, 'materials', `/rooms/${r.id}/floorMaterialId`);
      const poly = r.polygon, n = poly.length;
      const a = Math.abs(poly.reduce((sum,p,i) => sum+p.x*poly[(i+1)%n].y-poly[(i+1)%n].x*p.y,0));
      if (!a) fail(`/rooms/${r.id}/polygon`, 'zero-area polygon');
      for (let i=0;i<n;i++) {
        const p=poly[i], q=poly[(i+1)%n];
        if (p.x===q.x && p.y===q.y) fail(`/rooms/${r.id}/polygon/${i}`, 'repeated vertex');
        const prev=poly[(i+n-1)%n];
        if (cross(prev,p,q)===0 && (prev.x-p.x)*(q.x-p.x)+(prev.y-p.y)*(q.y-p.y)>0) fail(`/rooms/${r.id}/polygon/${i}`, 'overlapping edges');
        for (let j=i+1;j<n;j++) if (j!==i+1 && !(i===0 && j===n-1) && intersects(p,q,poly[j],poly[(j+1)%n])) fail(`/rooms/${r.id}/polygon`, 'self-intersection');
      }
    }
    for (const o of project.objects) {
      // Future metadata must not shadow the legacy editing adapter's numeric accessors.
      for(const key of ['cx','cy','w','d','rot']){
        const descriptor=Object.getOwnPropertyDescriptor(o,key);
        if(descriptor?.enumerable)fail(`/objects/${o.id}/${key}`,'unsupported field conflicts with editing adapter');
      }
      if (o.roomId) ref(o.roomId, 'rooms', `/objects/${o.id}/roomId`);
    }
    const c=project.scale.calibration;
    if (c) {
      ref(c.sourceImageId, 'sourceImages', '/scale/calibration/sourceImageId');
      const d=Math.hypot(c.pointB.x-c.pointA.x,c.pointB.y-c.pointA.y), expected=c.knownLengthMm/d;
      if (!d || !Number.isFinite(expected) || Math.abs(c.mmPerPixel-expected)/expected>0.001) fail('/scale/calibration/mmPerPixel', 'inconsistent calibration');
    }
    const v=project.scale.verification;
    if(c){
      const image=(project.sourceImages||[]).find(i=>i.id===c.sourceImageId);
      for(const p of [c.pointA,c.pointB])if(p.x>image.widthPx||p.y>image.heightPx)fail('/scale/calibration','point outside source image');
    }
    if(v){
      if(!c||v.sourceImageId!==c.sourceImageId)fail('/scale/verification','verification must use calibrated source image');
      const image=project.sourceImages.find(i=>i.id===v.sourceImageId);
      for(const p of [v.pointA,v.pointB])if(p.x>image.widthPx||p.y>image.heightPx)fail('/scale/verification','point outside source image');
      const same=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y)<1e-7;
      if((same(v.pointA,c.pointA)&&same(v.pointB,c.pointB))||(same(v.pointA,c.pointB)&&same(v.pointB,c.pointA)))fail('/scale/verification','requires an independent second distance');
      if(image.placement&&Math.abs(image.placement.mmPerPixel-c.mmPerPixel)/c.mmPerPixel>.001)fail('/scale/calibration','placement scale differs from calibration');
      const distance=Math.hypot(v.pointB.x-v.pointA.x,v.pointB.y-v.pointA.y),measured=Math.round(distance*c.mmPerPixel);
      if(!distance||measured!==v.measuredLengthMm)fail('/scale/verification/measuredLengthMm','inconsistent second distance');
      const error=(measured-v.knownLengthMm)/v.knownLengthMm*100;
      if(Math.abs(v.errorPercent-error)>1e-7)fail('/scale/verification/errorPercent','inconsistent error');
      if(v.status!==(Math.abs(error)<=v.thresholdPercent?'consistent':'discrepant'))fail('/scale/verification/status','inconsistent verification status');
      if(Date.parse(v.verifiedAt)<Date.parse(c.calibratedAt))fail('/scale/verification/verifiedAt','earlier than calibration');
      if(project.scale.confidence==='real'&&(v.status!=='consistent'||c.confirmedByUser!==true))fail('/scale/confidence','real requires consistent verification and explicit confirmation');
    }
    if (Date.parse(project.updatedAt)<Date.parse(project.createdAt)) fail('/updatedAt', 'earlier than createdAt');
    if (project.scale.confidence !== 'real') warnings.push('Dimensions are approximate: scale not confirmed.');
    return {warnings};
  }
  function initial() { const p=clone(reference); validate(p); return p; }
  function migrate(legacy) {
    if (!legacy || legacy.schema !== undefined || !Array.isArray(legacy.furniture)) fail('/', 'not a project or legacy design');
    const p=initial();
    p.objects=legacy.furniture.map((f,i) => {
      if (!f || typeof f.id!=='string') fail(`/furniture/${i}`, 'missing ID');
      for(const key of ['cx','cy','w','d','rot']) if(typeof f[key]!=='number'||!Number.isFinite(f[key]))fail(`/furniture/${i}/${key}`,'expected finite number');
      return {id:`obj_${f.id}`,type:f.type,name:f.name,position:point({x:f.cx,y:f.cy}),size:{widthMm:Math.round(f.w),depthMm:Math.round(f.d)},rotationDeg:Math.round(f.rot),...(f.color!==undefined?{color:f.color}:{})};
    });
    if (legacy.rooms !== undefined && (!legacy.rooms || typeof legacy.rooms!=='object' || Array.isArray(legacy.rooms))) fail('/rooms', 'invalid legacy rooms');
    for (const [key, value] of Object.entries(legacy.rooms || {})) {
      const r=p.rooms.find(r=>r.id===`rom_${key}`);
      if (!r || !value || typeof value!=='object') fail(`/rooms/${key}`, 'unknown room');
      if (value.name!==undefined) r.name=value.name;
      if (value.mat!==undefined) r.floorMaterialId=`mat_${value.mat}`;
    }
    if (legacy.demolished!==undefined && !Array.isArray(legacy.demolished)) fail('/demolished','expected array');
    for (const value of legacy.demolished || []) {
      if (typeof value!=='string' || !/^w\d+$/.test(value)) fail('/demolished','invalid wall ID');
      const w=p.walls.find(w=>w.id===`wal_ref-${value}`);
      if (!w) fail('/demolished',`unknown wall ${value}`);
      w.status='demolished';
    }
    if (legacy.measures!==undefined && !Array.isArray(legacy.measures)) fail('/measures','expected array');
    p.measurements=(legacy.measures||[]).map((m,i)=>{
      for(const key of ['a','b'])for(const axis of ['x','y'])if(typeof m?.[key]?.[axis]!=='number'||!Number.isFinite(m[key][axis]))fail(`/measures/${i}/${key}/${axis}`,'expected finite number');
      return {id:`msr_legacy-${i}`,a:point(m.a),b:point(m.b)};
    });
    validate(p);return p;
  }
  function prepare(value) {
    const parsed=typeof value==='string'?JSON.parse(value):clone(value);
    const migrated=parsed?.schema===undefined && Array.isArray(parsed?.furniture);
    const project=migrated?migrate(parsed):parsed;
    const {warnings}=validate(project);
    geometry(project); // Fail unsupported projections before either state or storage changes.
    return {project,warnings,migrated};
  }
  function load(storage, key='rubik-sota-floorplan-project-v1', legacyKey='huxing-design-v1') {
    try {
      const saved=storage.getItem(key);
      if (saved!==null) return {...prepare(saved),message:'',saved:true};
      const old=storage.getItem(legacyKey);
      if (old!==null) {
        const next=prepare(old);
        try {storage.setItem(key,JSON.stringify(next.project));return {...next,message:'Previous design migrated; original retained.',saved:true};}
        catch {return {...next,message:'Previous design migrated in memory; storage unavailable. Original retained.',saved:false};}
      }
      return {project:initial(),warnings:[],message:'',saved:false};
    } catch (e) {return {project:initial(),warnings:[],message:`Saved design could not be loaded; original retained. ${e.message}`,saved:false};}
  }
  // No mutation or storage write occurs until all validation has succeeded.
  function importInto(store, value) {
    const next=prepare(value);
    store.storage.setItem(store.key,JSON.stringify(next.project));
    store.project=next.project;
    return next;
  }
  function decorate(o) {
    const fields={cx:['position','x'],cy:['position','y'],w:['size','widthMm'],d:['size','depthMm']};
    for (const [key,[parent,field]] of Object.entries(fields)) if (!Object.hasOwn(o,key)) Object.defineProperty(o,key,{configurable:true,get(){return this[parent][field];},set(v){this[parent][field]=Math.round(v);}});
    if (!Object.hasOwn(o,'rot')) Object.defineProperty(o,'rot',{configurable:true,get(){return this.rotationDeg;},set(v){this.rotationDeg=((Math.round(v)%360)+360)%360;}});
    return o;
  }
  function object(type,name,cx,cy,w,d,rot=0,color) {
    return decorate({id:id('obj'),type,name,position:point({x:cx,y:cy}),size:{widthMm:Math.round(w),depthMm:Math.round(d)},rotationDeg:((Math.round(rot)%360)+360)%360,...(color?{color}:{})});
  }
  function editing(getProject) {
    return {
      get furniture(){const objects=getProject().objects;objects.forEach(decorate);return objects;},
      set furniture(value){getProject().objects=value;},
      get rooms(){return Object.fromEntries(getProject().rooms.map(r=>[r.id,{get name(){return r.name;},set name(v){r.name=v;},get family(){return roomFamily(r);},set family(v){r.family=v;},get mat(){return r.floorMaterialId;},set mat(v){r.floorMaterialId=v;}}]));},
      get demolished(){return getProject().walls.filter(w=>w.status==='demolished').map(w=>w.id);},
      set demolished(value){for(const w of getProject().walls) w.status=value.includes(w.id)?'demolished':(w.status==='demolished'?'existing':w.status);},
      get measures(){return getProject().measurements||[];},
      set measures(value){getProject().measurements=value;}
    };
  }
  function wallRect(w, offset=0, length=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y)) {
    const total=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),u=[(w.end.x-w.start.x)/total,(w.end.y-w.start.y)/total],n=[-u[1],u[0]],t=w.thicknessMm/2;
    const a=[w.start.x+u[0]*offset,w.start.y+u[1]*offset],b=[a[0]+u[0]*length,a[1]+u[1]*length];
    const poly=[[a[0]+n[0]*t,a[1]+n[1]*t],[b[0]+n[0]*t,b[1]+n[1]*t],[b[0]-n[0]*t,b[1]-n[1]*t],[a[0]-n[0]*t,a[1]-n[1]*t]];
    const rect=[Math.min(...poly.map(p=>p[0])),Math.min(...poly.map(p=>p[1])),Math.max(...poly.map(p=>p[0])),Math.max(...poly.map(p=>p[1])),({ 'load-bearing':'b',exterior:'e',low:'low'})[w.structure]||'n'];
    Object.assign(rect,{id:w.id,poly,center:[(a[0]+b[0])/2,(a[1]+b[1])/2],angle:Math.atan2(u[1],u[0]),spanMm:length,thickness:w.thicknessMm,height:w.heightMm/1000,status:w.status,declared:!!w.structureSource});
    return rect;
  }
  // OP-07 · S2: plan pieces of a curved or sloped wall. One straight sub-wall per facet of the single geometric core
  // (same facets as 3D, measurements and DXF), solid where no opening is, so every consumer of geometry().walls keeps
  // drawing rectangles. Each piece carries its heights at both ends (heightStart/heightEnd, m) for sloped walls.
  // S4b · The joint where two plan pieces of a shaped wall meet, at a distance `s` along it. Computed ONCE per joint, from
  // the facets of the single core, and handed to both pieces, so their shared corners are the very same numbers (a
  // watertight mesh, no rasterisation cracks). Inside a facet (an opening edge, a wall end) the joint is square to the
  // facet; at a facet boundary its plane bisects the two facets (the mitre), and its horizontal direction `m` is the
  // smooth face normal there. `c` = m·n of the facets (the same on both sides of a bisector): a face corner is V + m·z/c.
  function jointAt(path, s) {
    const spans=path.spans.filter(x=>x.length>0),dir=sp=>{const dx=sp.end.x-sp.start.x,dy=sp.end.y-sp.start.y,l=Math.hypot(dx,dy);return {x:dx/l,y:dy/l};};
    let i=spans.findIndex(sp=>s<sp.to-1e-9);if(i<0)i=spans.length-1;
    const seam=i>0&&Math.abs(s-spans[i].from)<1e-9,d=dir(spans[i]);let t=d,v;
    if(seam){const a=dir(spans[i-1]),tx=a.x+d.x,ty=a.y+d.y,l=Math.hypot(tx,ty);t={x:tx/l,y:ty/l};v=spans[i].start;}
    else v=path.sample(s).point;
    const m={x:-t.y,y:t.x};
    return Object.freeze({x:v.x,y:v.y,tx:t.x,ty:t.y,mx:m.x,my:m.y,c:m.x*(-d.y)+m.y*d.x,seam});
  }
  // Plan pieces of a shaped wall (S2) and, for a curved wall, the infill above and below each opening per facet (S4b).
  function shapedPieces(w, openings, infills=[]) {
    const path=Walls.pathProfile(w,WALL_PATH),holes=[],curved=Walls.isCurved(w);
    for (const o of openings) {const a=o.offsetMm,b=o.offsetMm+o.widthMm,last=holes.at(-1);if(last&&a<=last[1])last[1]=Math.max(last[1],b);else holes.push([a,b]);}
    const pieces=[],joints=new Map(),joint=x=>{if(!joints.has(x))joints.set(x,jointAt(path,x));return joints.get(x);};
    const piece=(span,a,b,extra)=>{const sub={...w,start:span.start,end:span.end},rect=wallRect(sub,a-span.from,b-a),h=x=>(span.startHeight+(span.endHeight-span.startHeight)*(x-span.from)/span.length)/1000;
      return Object.assign(rect,{id:w.id,heightStart:h(a),heightEnd:h(b),height:Math.max(h(a),h(b)),facet:span.index,shaped:true,alongMm:(a+b)/2,
        ends:{start:joint(a),end:joint(b)},seamStart:curved&&joint(a).seam,seamEnd:curved&&joint(b).seam},extra);};
    for (const span of path.spans) {
      if (!(span.length>0)) continue;
      const solid=[];let at=span.from;
      for (const [a,b] of holes) {if(b<=at||a>=span.to)continue;if(a>at)solid.push([at,a]);at=Math.max(at,b);}
      if (at<span.to) solid.push([at,span.to]);
      for (const [a,b] of solid) if (b-a>1e-6) pieces.push(piece(span,a,b,{}));
      // Above the head and below the sill of each opening on a curved wall, per facet (the straight chord would not follow it).
      if (curved) for (const o of openings) {const a=Math.max(span.from,o.offsetMm),b=Math.min(span.to,o.offsetMm+o.widthMm);if(b-a<=1e-6||w.status==='demolished')continue;
        const head=(o.sillHeightMm+o.heightMm)/1000,sill=o.sillHeightMm/1000;
        infills.push(piece(span,a,b,{openingId:o.id,band:'head',yb:head}));
        if(sill>0)infills.push(piece(span,a,b,{openingId:o.id,band:'sill',yt:sill}));}
    }
    return pieces;
  }
  // The straight host of an opening: the wall itself, or on a curved wall the chord between the two edges of the opening
  // on the faceted path (its symbol is drawn on that chord, at the opening's true place).
  function openingHost(w, o) {
    if (!Walls.isCurved(w)) return {host:w,offset:o.offsetMm};
    const path=Walls.pathProfile(w,WALL_PATH),a=path.sample(o.offsetMm).point,b=path.sample(o.offsetMm+o.widthMm).point;
    return {host:{...w,start:a,end:b},offset:0};
  }
  // Closed outline of a whole wall in plan: the rectangle of a straight wall, or the left face of every facet followed by
  // the right face backwards (for the DXF auxiliary layer, the envelope and hit areas). Straight wall = wallRect().poly.
  function wallOutline(w) {
    if (!shapedWall(w) || !Walls.isCurved(w)) return wallRect(w).poly;
    const spans=Walls.pathProfile(w,WALL_PATH).spans.filter(s=>s.length>0).map(s=>wallRect({...w,start:s.start,end:s.end}).poly);
    return [...spans.map(q=>q[0]),spans.at(-1)[1],spans.at(-1)[2],...spans.map(q=>q[3]).reverse()];
  }
  // OP-07 · S4: renderer-independent mesh of one plan piece between heights yb and yt (m), its top following the wall
  // (heightStart → heightEnd) and the texture running continuously along the whole wall (alongMm). Positions in mm,
  // faces in BoxGeometry order (+x, −x, top, bottom, +z, −z). null for a piece of a straight, level wall (a box).
  // OP-07 · S4/S4b: renderer-independent mesh of one plan piece between heights yb and yt (m), its top following the wall
  // (heightStart → heightEnd), the texture running continuously along the whole wall (alongMm). Topology, UVs and face
  // order from the core's slopedPiece (+x, −x, top, bottom, +z, −z); positions in PLAN millimetres [x, height, y] built
  // from the shared joints (watertight: neighbouring pieces have identical corners), normals in the same axes: the two
  // faces of a curved wall get the joint's smooth normal, top, bottom, ends and reveals keep hard edges. null for a
  // piece of a straight, level wall (a box, as before).
  function pieceMesh(rect, yb, yt) {
    if (!rect?.shaped) return null;
    const top=h=>Math.min(h,yt)*1000,lo=rect.yb!==undefined?Math.max(yb,rect.yb):yb;
    const m=Walls.slopedPiece(rect.spanMm,rect.thickness,lo*1000,rect.yt!==undefined?Math.min(rect.yt,yt)*1000:top(rect.heightStart),rect.yt!==undefined?Math.min(rect.yt,yt)*1000:top(rect.heightEnd),rect.alongMm,Walls.TEXTURE_TILE_MM);
    const u={x:Math.cos(rect.angle),y:Math.sin(rect.angle)},n={x:-u.y,y:u.x},half=rect.thickness/2,ends=rect.ends;
    const positions=new Array(m.positions.length),normals=new Array(m.normals.length);
    for (let i=0;i<m.positions.length;i+=3) {
      const x=m.positions[i],y=m.positions[i+1],z=m.positions[i+2],J=x>0?ends.end:ends.start,k=Math.sign(z)*half/J.c;
      positions[i]=J.x+J.mx*k;positions[i+1]=y;positions[i+2]=J.y+J.my*k;
      const nx=m.normals[i],ny=m.normals[i+1],nz=m.normals[i+2];
      if (Math.abs(nz)>0.5&&Math.abs(ny)<1e-9) {normals[i]=J.mx*Math.sign(nz);normals[i+1]=0;normals[i+2]=J.my*Math.sign(nz);}          // smooth face
      else if (Math.abs(nx)>0.5&&Math.abs(ny)<1e-9) {normals[i]=J.tx*Math.sign(nx);normals[i+1]=0;normals[i+2]=J.ty*Math.sign(nx);}      // end / reveal
      else {normals[i]=nx*u.x+nz*n.x;normals[i+1]=ny;normals[i+2]=nx*u.y+nz*n.y;}                                                      // top, bottom
    }
    // A seam end is an internal face shared with the next piece: it is not emitted (it would show as a line where it
    // meets the outer surface). Real ends and reveals keep theirs. groups: [start, count, material] in face order.
    const indices=[],groups=[];
    for (let f=0;f<6;f++) { if ((f===0&&rect.seamEnd)||(f===1&&rect.seamStart)) continue; groups.push([indices.length,6,f]); indices.push(...m.indices.slice(f*6,f*6+6)); }
    return {positions,normals,uvs:m.uvs,indices,groups,plan:true};
  }
  // OP-07 · S3b: the CANONICAL RING of a room. A room is stored as its polygon of wall faces; where an edge lies on the
  // face of a curved wall (it was drawn against the wall's chord), the ring follows that face instead: the mitred offset
  // of the wall's facets from the single core (centreline + offsetMiter), cut where the stored edge starts and ends.
  // Nothing new is stored: the plan, the 3D floor, the floor area, the perimeter and the room's wall faces all derive
  // from this ring, so they cannot contradict each other. `faces` names, per curved wall and side, the facets the ring
  // follows and the fraction of each (the partial facets at both ends); `edgeWalls[i]` names the curved wall that ring
  // edge i belongs to. A room without curved walls keeps its polygon (the same array: v1 figures are byte-identical).
  const RING_TOLERANCE_MM = 3, RING_PARALLEL_SIN = 1e-3;
  function roomRing(project, room) {
    const polygon = room?.polygon, curved = (project?.walls || []).filter(w => w.status !== 'demolished' && Walls.isCurved(w));
    if (!curved.length || !Array.isArray(polygon) || polygon.length < 3) return {points: polygon, faces: [], edgeWalls: []};
    const points = [], faces = [], edgeWalls = [];
    for (let i = 0; i < polygon.length; i++) {
      const a = polygon[i], b = polygon[(i + 1) % polygon.length];
      points.push(a);
      for (const w of curved) {
        const L = Math.hypot(w.end.x - w.start.x, w.end.y - w.start.y), u = {x:(w.end.x - w.start.x) / L, y:(w.end.y - w.start.y) / L}, n = {x:-u.y, y:u.x};
        const dot = (p, v) => (p.x - w.start.x) * v.x + (p.y - w.start.y) * v.y, da = dot(a, n), db = dot(b, n), el = Math.hypot(b.x - a.x, b.y - a.y);
        if (!(el > 0) || Math.abs(da - db) > RING_TOLERANCE_MM * 2 || Math.abs(Math.abs((da + db) / 2) - w.thicknessMm / 2) > RING_TOLERANCE_MM) continue;
        if (Math.abs(((b.x - a.x) * u.y - (b.y - a.y) * u.x) / el) > RING_PARALLEL_SIN) continue;
        const side = (da + db) / 2 >= 0 ? 1 : -1, sa = dot(a, u), sb = dot(b, u), lo = Math.max(0, Math.min(sa, sb)), hi = Math.min(L, Math.max(sa, sb));
        if (hi - lo <= 1) continue;
        // The face of the curved wall on the room's side, and where each of its points falls along the chord.
        const face = Walls.offsetMiter(Walls.centreline(w, WALL_PATH), side * w.thicknessMm / 2), s = face.map(p => dot(p, u));
        const at = x => { for (let j = 0; j + 1 < face.length; j++) if ((s[j] - x) * (s[j + 1] - x) <= 0 && s[j] !== s[j + 1]) { const t = (x - s[j]) / (s[j + 1] - s[j]); return {j, t, p:{x:face[j].x + (face[j + 1].x - face[j].x) * t, y:face[j].y + (face[j + 1].y - face[j].y) * t}}; } return null; };
        // The face of a curved wall ends where the facets end (it leans in or out at the ends): clamp to it.
        const A = at(Math.max(lo, Math.min(...s))), B = at(Math.min(hi, Math.max(...s)));
        if (!A || !B) continue;
        const facets = [], run = [A.p];
        for (let j = A.j; j <= B.j; j++) {
          const from = j === A.j ? A.t : 0, to = j === B.j ? B.t : 1;
          if (to - from > 1e-9) facets.push({index:j, fraction:to - from});
          if (j > A.j) run.splice(run.length, 0, face[j]);
        }
        run.push(B.p);
        // Every edge from `a` to `b` now belongs to this wall's face (the short junction pieces at both ends included).
        for (let k = points.length - 1; k < points.length + run.length; k++) edgeWalls[k] = w.id;
        points.push(...(sa <= sb ? run : run.reverse()));
        faces.push({wallId:w.id, side, facets});
        break;
      }
    }
    return {points, faces, edgeWalls};
  }
  // Footprint rectangles of a whole wall: [wallRect(w).poly] for a straight wall; one per facet for a curved one.
  function wallFootprints(w) {
    if (!shapedWall(w) || !Walls.isCurved(w)) return [wallRect(w).poly];
    return Walls.pathProfile(w,WALL_PATH).spans.filter(s=>s.length>0).map(s=>wallRect({...w,start:s.start,end:s.end}).poly);
  }
  function geometry(p) {
    const walls=[],windows=[],doors=[],slides=[],voids=[],wallInfills=[];
    for (const w of p.walls) {
      const length=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),shaped=shapedWall(w);
      const openings=p.openings.filter(o=>o.wallId===w.id).sort((a,b)=>a.offsetMm-b.offsetMm);
      if (shaped) walls.push(...shapedPieces(w,openings,wallInfills));
      // Merge overlapping intervals for the solid portions; opening visuals retain their IDs.
      let at=0;
      for (const o of openings) {
        if (!shaped && o.offsetMm>at) walls.push(wallRect(w,at,o.offsetMm-at));
        at=Math.max(at,o.offsetMm+o.widthMm);
        const {host,offset}=shaped?openingHost(w,o):{host:w,offset:o.offsetMm};
        const rect=shaped?wallRect(host,offset,Math.hypot(host.end.x-host.start.x,host.end.y-host.start.y)):wallRect(w,o.offsetMm,o.widthMm),u=[Math.cos(rect.angle),Math.sin(rect.angle)];
        Object.assign(rect,{openingId:o.id,sill:o.sillHeightMm/1000,head:(o.sillHeightMm+o.heightMm)/1000});
        // OP-07 · S4: on a curved or sloped wall the infill above the head follows the wall top at both edges of the opening.
        // On a curved wall its infill is drawn per facet (wallInfills); on a straight sloped wall the opening's own piece follows the slope.
        if(shaped){const path=Walls.pathProfile(w,WALL_PATH),hs=path.sample(o.offsetMm).height/1000,he=path.sample(o.offsetMm+o.widthMm).height/1000;Object.assign(rect,{shaped:true,heightStart:hs,heightEnd:he,height:Math.max(hs,he),alongMm:o.offsetMm+o.widthMm/2,ends:{start:jointAt(path,o.offsetMm),end:jointAt(path,o.offsetMm+o.widthMm)},curvedHost:Walls.isCurved(w)});}
        if(w.status==='demolished') continue;
        if(o.kind==='window') windows.push(rect);
        else if(o.kind==='door') {
          const end=o.swing?.hinge==='end',left=o.swing?.side!=='right',span=shaped?rect.spanMm:o.widthMm;
          const normal=left?[u[1],-u[0]]:[-u[1],u[0]],c=end?[-u[0],-u[1]]:u;
          const base=[host.start.x+u[0]*(offset+(end?span:0)),host.start.y+u[1]*(offset+(end?span:0))];
          doors.push({id:o.id,rect,h:[base[0]+normal[0]*w.thicknessMm/2,base[1]+normal[1]*w.thicknessMm/2],c,o:normal,len:shaped?span:o.widthMm,entry:o.isEntrance,height:o.heightMm/1000});
        } else if(o.kind==='sliding-door') slides.push({id:o.id,rect,v:Math.abs(u[1])>Math.abs(u[0]),height:o.heightMm/1000});
        else voids.push(rect);
      }
      if(!shaped && at<length) walls.push(wallRect(w,at,length-at));
    }
    const rooms=p.rooms.map(r=>({id:r.id,name:r.name,family:roomFamily(r),poly:roomRing(p,r).points.map(v=>[v.x,v.y]),mat:r.floorMaterialId,counted:r.countsTowardArea,at:r.labelAt?[r.labelAt.x,r.labelAt.y]:undefined}));
    const imagePoints=(p.sourceImages||[]).filter(i=>i.placement).flatMap(i=>{const a=i.placement.rotationDeg*Math.PI/180,s=i.placement.mmPerPixel,o=i.placement.originMm;return [[0,0],[i.widthPx,0],[i.widthPx,i.heightPx],[0,i.heightPx]].map(([x,y])=>({x:o.x+s*(x*Math.cos(a)-y*Math.sin(a)),y:o.y+s*(x*Math.sin(a)+y*Math.cos(a))}));});
    const points=[...imagePoints,...p.rooms.flatMap(r=>roomRing(p,r).points),...p.walls.flatMap(w=>wallOutline(w).map(([x,y])=>({x,y})))];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const v of points){minX=Math.min(minX,v.x);minY=Math.min(minY,v.y);maxX=Math.max(maxX,v.x);maxY=Math.max(maxY,v.y);}
    const envelope=points.length?{x:minX,y:minY,w:maxX-minX,h:maxY-minY}:{x:0,y:0,w:6000,h:4000};
    return {source:p,walls,windows,doors,slides,voids,...(wallInfills.length?{wallInfills}:{}),rooms,envelope,bounds:{x:envelope.x-1600,y:envelope.y-1500,w:Math.max(1000,envelope.w)+3200,h:Math.max(1000,envelope.h)+3000},center:{x:envelope.x+envelope.w/2,y:envelope.y+envelope.h/2}};
  }
  // Declared wall type (contract 1.5.0): what a person states about a wall and where that statement comes from. It is
  // never deduced from thickness, position or drawing, and it is not a structural verification. Declaring raises only
  // older versions to 1.5.0; the rest of the project is untouched.
  const WALL_STRUCTURES=['unknown','partition','load-bearing','other'],STRUCTURE_SOURCES=['professional','imported','pending-review'];
  function declareWallStructure(project,wallId,structure,source='professional'){
    if(!WALL_STRUCTURES.includes(structure))throw Error('Tipo de muro no admitido.');
    if(!STRUCTURE_SOURCES.includes(source))throw Error('Procedencia no admitida.');
    const next=clone(project),wall=next.walls.find(w=>w.id===wallId);if(!wall)throw Error('Muro no encontrado.');
    wall.structure=structure;wall.structureSource=source;
    raiseVersion(next,'1.5.0');
    validate(next);return next;
  }
  function setSite(project,site){const next=clone(project);if(site===undefined)delete next.site;else next.site=clone(site);raiseVersion(next,site?.buildingPlacement!==undefined?'1.12.0':site?.terrain!==undefined?'1.11.0':site?.orthophoto!==undefined?'1.10.0':site?.parcel!==undefined?'1.9.0':'1.7.0');validate(next);return next;}
  // OP-07 · S5: wall edits as pure operations with the editor's own result shape ({ok, project, explanation, intent}), so
  // the editor applies them through its single path (FloorPlanApp.applyExtension: validation, undo/redo, save) — no second
  // editor. A refused edit returns the same project untouched (atomic) and says why; it never drops an opening.
  const refuse = (code, explanation, extra = {}) => ({ok:false, code, explanation:[explanation], ...extra});
  function wallEdit(project, wallId, change, intent = {}) {
    const next = clone(project), w = next.walls.find(x => x.id === wallId);
    if (!w) return refuse('wall-not-found', `No existe el muro ${wallId}.`);
    change(w, next);
    if (shapedWall(w)) raiseVersion(next, '2.0.0');
    try { validate(next); } catch (e) { return refuse('invalid', e.message); }
    const gate = guardSave(project, next, {intent});
    if (!gate.ok) return refuse('guard', gate.issues.map(i => i.code + (i.message ? ': ' + i.message : '')).join('; '), {issues: gate.issues});
    return {ok:true, project:next, intent};
  }
  // Curve: control point in mm (rounded as every plan point), or null to straighten it (explicit intent).
  const setWallCurve = (project, wallId, control) => control
    ? wallEdit(project, wallId, w => { w.curve = {control: point(control)}; })
    : wallEdit(project, wallId, w => { delete w.curve; }, {straightened: [wallId]});
  // End height in mm, or null to make the wall level again at its start height (explicit intent).
  const setWallEndHeight = (project, wallId, heightEndMm) => heightEndMm === null || heightEndMm === undefined
    ? wallEdit(project, wallId, w => { delete w.heightEndMm; }, {leveled: [wallId]})
    : wallEdit(project, wallId, w => { w.heightEndMm = Math.round(heightEndMm); });
  // Split at a physical distance along the wall (mm): exact Bézier split of the single core, points rounded to whole mm
  // once (the pieces stay joined), heights and openings carried over by the parameter of their centre. An opening the
  // cut would cross refuses the split and is named: openings never disappear.
  function splitWall(project, wallId, distanceMm, {newId = id('wal')} = {}) {
    const w = project.walls.find(x => x.id === wallId);
    if (!w) return refuse('wall-not-found', `No existe el muro ${wallId}.`);
    const length = wallLength(w);
    if (!(distanceMm >= 1 && distanceMm <= length - 1)) return refuse('cut-outside', `El corte debe quedar dentro del muro (1–${Math.floor(length - 1)} mm).`);
    const own = project.openings.filter(o => o.wallId === wallId), r = Walls.splitAt(w, distanceMm, own, {...WALL_PATH, roundMm:true, newId});
    if (r.blocked.length) return refuse('opening-straddles-cut', `El corte atraviesa ${r.blocked.length === 1 ? 'una abertura' : r.blocked.length + ' aberturas'}: muévelo o mueve la abertura.`, {openings: r.blocked});
    const next = clone(project), at = next.walls.findIndex(x => x.id === wallId);
    next.walls.splice(at, 1, r.first, r.second);
    const moved = new Map(r.openings.map(o => [o.id, o]));
    next.openings = next.openings.map(o => moved.has(o.id) ? (({part, driftMm, ...rest}) => ({...rest, offsetMm: Math.round(rest.offsetMm)}))(moved.get(o.id)) : o);
    if (shapedWall(r.first) || shapedWall(r.second)) raiseVersion(next, '2.0.0');
    const intent = {split: {[wallId]: [r.first.id, r.second.id]}};
    try { validate(next); } catch (e) { return refuse('invalid', e.message); }
    const gate = guardSave(project, next, {intent});
    if (!gate.ok) return refuse('guard', gate.issues.map(i => i.code).join('; '), {issues: gate.issues});
    return {ok:true, project:next, intent, maxDriftMm: r.maxDriftMm};
  }
  function setRoofParapet(project,parapet){const next=clone(project);if(parapet===undefined)delete next.roofParapet;else next.roofParapet=clone(parapet);if(parapet!==undefined)raiseVersion(next,'1.8.0');validate(next);return next;}
  const validateSite=site=>{check(site,schema.$defs.site,'/site');Geo.validateSite(site);Territory.validate(site);if(site.parcel!==undefined)ParcelSite.fromSiteParcel(site.parcel);if(site.orthophoto!==undefined)OrthophotoSite.fromSiteOrthophoto(site.orthophoto,site.parcel);if(site.terrain!==undefined)TerrainSite.fromSiteTerrain(site.terrain,site.parcel);};
  const api={clone,id,point,validate,validateSite,setSite,setRoofParapet,initial,migrate,prepare,load,importInto,decorate,object,editing,geometry,wallRect,declareWallStructure,WALL_STRUCTURES,STRUCTURE_SOURCES,roomFamilies,roomFamily,roomName};
  if (typeof module!=='undefined') module.exports=api; else root.FloorPlanCore=api;
  // OP-07 · curved and sloped walls (contract 2.0): the same exported object, extended per cut.
  Object.assign(api,{parseVersion,versionAtLeast,raiseVersion,WALL_PATH,WALL_FEATURES,shapedWall,wallLength,featuresOf:Walls.featuresOf,guardSave});   // OP-07 S1
  Object.assign(api,{wallOutline});   // OP-07 S2
  Object.assign(api,{wallFootprints});   // OP-07 S6
  Object.assign(api,{pieceMesh});   // OP-07 S4
  Object.assign(api,{setWallCurve,setWallEndHeight,splitWall});   // OP-07 S5
  Object.assign(api,{roomRing});   // OP-07 S3b
  Object.assign(api,{jointAt});   // OP-07 S4b
})(globalThis);
