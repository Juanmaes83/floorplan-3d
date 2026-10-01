/* FloorPlanProjectV1: validation, migration and shared renderer projection. No DOM/network. */
(function (root) {
  'use strict';
  const schema = typeof module !== 'undefined' ? require('./project-schema.js') : root.FloorPlanSchema;
  const reference = typeof module !== 'undefined' ? require('./reference-project.js') : root.FloorPlanReference;
  const clone = value => JSON.parse(JSON.stringify(value));
  const fail = (path, message) => { throw new Error(`${path}: ${message}`); };
  const id = prefix => `${prefix}_${globalThis.crypto.randomUUID().replaceAll('-', '')}`;
  const point = p => ({x: Math.round(p.x), y: Math.round(p.y)});
  const lists = ['walls', 'openings', 'rooms', 'materials', 'objects', 'measurements', 'sourceImages'];
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
  function validate(project) {
    const version = project?.schemaVersion;
    if (typeof version !== 'string' || !/^1\.(0|[1-9][0-9]*)\.(0|[1-9][0-9]*)$/.test(version)) fail('/schemaVersion', 'unsupported version');
    const future = version !== '1.0.0';
    check(project, schema, '/', future);
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
    for (const w of project.walls) if (Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y) < 1) fail(`/walls/${w.id}`, 'zero-length wall');
    for (const o of project.openings) {
      ref(o.wallId, 'walls', `/openings/${o.id}/wallId`);
      const w = walls.get(o.wallId), length = Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
      if (o.offsetMm+o.widthMm > length+1e-7) fail(`/openings/${o.id}`, 'opening extends beyond wall');
      if (o.sillHeightMm+o.heightMm > w.heightMm) fail(`/openings/${o.id}`, 'opening exceeds wall height');
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
      get rooms(){return Object.fromEntries(getProject().rooms.map(r=>[r.id,{get name(){return r.name;},set name(v){r.name=v;},get mat(){return r.floorMaterialId;},set mat(v){r.floorMaterialId=v;}}]));},
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
    Object.assign(rect,{id:w.id,poly,center:[(a[0]+b[0])/2,(a[1]+b[1])/2],angle:Math.atan2(u[1],u[0]),spanMm:length,thickness:w.thicknessMm,height:w.heightMm/1000,status:w.status});
    return rect;
  }
  function geometry(p) {
    const walls=[],windows=[],doors=[],slides=[],voids=[];
    for (const w of p.walls) {
      const length=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y);
      const openings=p.openings.filter(o=>o.wallId===w.id).sort((a,b)=>a.offsetMm-b.offsetMm);
      // Merge overlapping intervals for the solid portions; opening visuals retain their IDs.
      let at=0;
      for (const o of openings) {
        if (o.offsetMm>at) walls.push(wallRect(w,at,o.offsetMm-at));
        at=Math.max(at,o.offsetMm+o.widthMm);
        const rect=wallRect(w,o.offsetMm,o.widthMm),u=[Math.cos(rect.angle),Math.sin(rect.angle)];
        Object.assign(rect,{openingId:o.id,sill:o.sillHeightMm/1000,head:(o.sillHeightMm+o.heightMm)/1000});
        if(w.status==='demolished') continue;
        if(o.kind==='window') windows.push(rect);
        else if(o.kind==='door') {
          const end=o.swing?.hinge==='end',left=o.swing?.side!=='right';
          const normal=left?[u[1],-u[0]]:[-u[1],u[0]],c=end?[-u[0],-u[1]]:u;
          const base=[w.start.x+u[0]*(o.offsetMm+(end?o.widthMm:0)),w.start.y+u[1]*(o.offsetMm+(end?o.widthMm:0))];
          doors.push({id:o.id,rect,h:[base[0]+normal[0]*w.thicknessMm/2,base[1]+normal[1]*w.thicknessMm/2],c,o:normal,len:o.widthMm,entry:o.isEntrance,height:o.heightMm/1000});
        } else if(o.kind==='sliding-door') slides.push({id:o.id,rect,v:Math.abs(u[1])>Math.abs(u[0]),height:o.heightMm/1000});
        else voids.push(rect);
      }
      if(at<length) walls.push(wallRect(w,at,length-at));
    }
    const rooms=p.rooms.map(r=>({id:r.id,name:r.name,poly:r.polygon.map(v=>[v.x,v.y]),mat:r.floorMaterialId,counted:r.countsTowardArea,at:r.labelAt?[r.labelAt.x,r.labelAt.y]:undefined}));
    const imagePoints=(p.sourceImages||[]).filter(i=>i.placement).flatMap(i=>{const a=i.placement.rotationDeg*Math.PI/180,s=i.placement.mmPerPixel,o=i.placement.originMm;return [[0,0],[i.widthPx,0],[i.widthPx,i.heightPx],[0,i.heightPx]].map(([x,y])=>({x:o.x+s*(x*Math.cos(a)-y*Math.sin(a)),y:o.y+s*(x*Math.sin(a)+y*Math.cos(a))}));});
    const points=[...imagePoints,...p.rooms.flatMap(r=>r.polygon),...p.walls.flatMap(w=>wallRect(w).poly.map(([x,y])=>({x,y})))];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(const v of points){minX=Math.min(minX,v.x);minY=Math.min(minY,v.y);maxX=Math.max(maxX,v.x);maxY=Math.max(maxY,v.y);}
    const envelope=points.length?{x:minX,y:minY,w:maxX-minX,h:maxY-minY}:{x:0,y:0,w:6000,h:4000};
    return {source:p,walls,windows,doors,slides,voids,rooms,envelope,bounds:{x:envelope.x-1600,y:envelope.y-1500,w:Math.max(1000,envelope.w)+3200,h:Math.max(1000,envelope.h)+3000},center:{x:envelope.x+envelope.w/2,y:envelope.y+envelope.h/2}};
  }
  const api={clone,id,point,validate,initial,migrate,prepare,load,importInto,decorate,object,editing,geometry,wallRect};
  if (typeof module!=='undefined') module.exports=api; else root.FloorPlanCore=api;
})(globalThis);
