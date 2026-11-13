/* Shared millimetre geometry and cabinet data. No DOM or Three.js dependencies. */
(function (root) {
  'use strict';
  const cabinetTypes = new Set(['wardrobe', 'tallcab', 'cabinet', 'shoecab']);
  const isCabinet = f => cabinetTypes.has(f.type);
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const finite = (v, fallback) => Number.isFinite(v) ? v : fallback;
  const defaults = () => ({eyeHeight:1600, horizontalFov:80, bodyWidth:440, ceilingHeight:2400, heading:270});
  function viewSettings(v = {}) {
    const d = defaults(), s = {};
    for (const [key, lo, hi] of [['eyeHeight',800,2000], ['horizontalFov',55,100], ['bodyWidth',300,700], ['ceilingHeight',2100,4000], ['heading',0,359]])
      s[key] = clamp(finite(v[key], d[key]), lo, hi);
    return s;
  }
  const verticalFov = (horizontal, aspect) => 2*Math.atan(Math.tan(horizontal*Math.PI/360)/aspect)*180/Math.PI;
  function cavity(f, c) {
    return {width:f.w - (c.columns.length + 1)*c.thickness, height:c.height - c.plinth - 2*c.thickness,
      depth:f.d - c.back - c.frontGap, bottom:c.plinth + c.thickness};
  }
  function presetColumn(kind, width, height) {
    const c = {width, kind, shelves:[], rod:null, drawers:0, drawerHeight:180};
    if (kind === 'long' || kind === 'short') {
      c.shelves = [Math.round(height - 320)];
      c.rod = Math.round(height - 400);
      if (kind === 'short') { c.drawers = 2; c.drawerHeight = 180; }
    } else if (kind === 'drawers') {
      c.drawers = Math.min(4, Math.floor((height - 200)/200)); c.drawerHeight = 200;
      c.shelves = [Math.round(Math.max(c.drawers*200 + 40, height*.75))];
    } else {
      c.kind = 'shelves';
      const n = Math.max(1, Math.min(5, Math.floor(height/350)));
      c.shelves = Array.from({length:n}, (_, i) => Math.round(height*(i+1)/(n+1)));
    }
    return c;
  }
  function defaultCabinet(f) {
    const height = f.type === 'tallcab' ? 2395 : f.type === 'wardrobe' ? 2200 : f.type === 'shoecab' ? 1000 : 850;
    const n = Math.max(1, Math.min(6, Math.floor(f.w/600)));
    const c = {height, thickness:18, back:9, frontGap:20, plinth:80, locked:true, front:'closed', doorCount:Math.max(1,Math.min(12,Math.round(f.w/(f.type==='shoecab'?450:500)))), columns:Array(n).fill(null)};
    const inner = cavity(f, c);
    c.columns = Array.from({length:n}, (_, i) => presetColumn(height > 1800 && f.d >= 500 ? (i === 0 ? 'long' : 'short') : 'shelves', inner.width/n, inner.height));
    // Default layouts keep drawer travel clear of the existing exterior hinges.
    for (const bay of drawerDoorConflicts({...f,cabinet:c})) {
      c.columns[bay-1].drawers=0; c.columns[bay-1].kind='long';
    }
    return c;
  }
  function validateCabinet(f, c) {
    if (!c || !Array.isArray(c.columns) || c.columns.length < 1 || c.columns.length > 8) throw Error('柜体需要 1–8 个分区 / Use 1–8 bays');
    for (const [k, lo, hi] of [['height',400,4000],['thickness',12,30],['back',5,25],['frontGap',18,80],['plinth',0,250]])
      if (!Number.isFinite(c[k]) || c[k] < lo || c[k] > hi) throw Error('柜体尺寸超出范围 / Invalid cabinet dimensions');
    if (!['closed','hidden','open'].includes(c.front) || typeof c.locked !== 'boolean') throw Error('柜体状态无效 / Invalid cabinet state');
    if (!Number.isInteger(c.doorCount) || c.doorCount<1 || c.doorCount>12) throw Error('柜门数量须为 1–12 / Use 1–12 doors');
    const inner = cavity(f, c);
    if (inner.height < 250 || inner.depth < 180 || inner.width < 150*c.columns.length) throw Error('柜体净尺寸不足 / Cabinet cavity is too small');
    if (Math.abs(c.columns.reduce((s, col) => s + col.width, 0) - inner.width) > .1) throw Error('分区宽度之和必须等于可用净宽 / Bay widths must fill the cabinet');
    for (const col of c.columns) {
      if (!Number.isFinite(col.width) || col.width < 150 || !['long','short','shelves','drawers'].includes(col.kind)) throw Error('分区净宽至少 150 mm / Minimum bay width: 150 mm');
      if (!Number.isInteger(col.drawers) || col.drawers < 0 || col.drawers > 6 || !Number.isFinite(col.drawerHeight) || col.drawerHeight < 80 || col.drawerHeight > 400) throw Error('抽屉尺寸无效 / Invalid drawer dimensions');
      if (col.drawers*col.drawerHeight > inner.height - 80) throw Error('抽屉超出分区净高 / Drawers exceed bay height');
      if (!Array.isArray(col.shelves) || col.shelves.length > 12) throw Error('每区最多 12 块层板 / Maximum 12 shelves per bay');
      let bottom = col.drawers*col.drawerHeight;
      for (const y of col.shelves) {
        if (!Number.isFinite(y) || y < bottom + 60 || y + c.thickness > inner.height - 60) throw Error('层板之间及抽屉上方需留至少 60 mm / Leave 60 mm clear between boards and drawers');
        bottom = y + c.thickness;
      }
      if (col.rod !== null && (!Number.isFinite(col.rod) || col.rod < col.drawers*col.drawerHeight + 100 || col.rod > inner.height - 50 || col.shelves.some(y => col.rod >= y - 30 && col.rod <= y + c.thickness + 30))) throw Error('挂衣杆与层板或抽屉冲突 / Hanging rail conflicts with a shelf or drawer');
    }
    return c;
  }
  function cabinet(f) { return f.cabinet || defaultCabinet(f); }
  function resizeCabinet(f, c, oldHeight) {
    const inner = cavity(f, c), total = c.columns.reduce((s, col) => s + col.width, 0);
    for (const col of c.columns) {
      col.width *= inner.width/total;
      if (oldHeight && oldHeight !== inner.height) {
        const scale = inner.height/oldHeight;
        col.shelves = col.shelves.map(y => Math.round(y*scale));
        if (col.rod !== null) col.rod = Math.round(col.rod*scale);
      }
    }
    return validateCabinet(f, c);
  }
  function bayWidths(f, c, index, width) {
    const available = cavity(f, c).width, rest = available - c.columns[index].width;
    if (c.columns.length === 1) {
      if (Math.abs(width - available) > .1) throw Error('单分区使用全部净宽 / A single bay uses all available width');
    } else {
      c.columns.forEach((col, i) => { col.width = i === index ? width : col.width*(available-width)/rest; });
    }
    return validateCabinet(f, c);
  }
  function bays(f) {
    const c = cabinet(f), inner = cavity(f, c); let x = -f.w/2 + c.thickness;
    return c.columns.map((col, index) => { const bay = {...col, index, x, ...{height:inner.height, depth:inner.depth, bottom:inner.bottom}}; x += col.width + c.thickness; return bay; });
  }
  function openings(f, col) {
    const c = cabinet(f), inner = cavity(f, c), result = []; let base = col.drawers*col.drawerHeight;
    for (const y of col.shelves) { result.push({bottom:base, height:y-base}); base = y + c.thickness; }
    result.push({bottom:base, height:inner.height-base}); return result;
  }
  function drawerSize(f, col) {
    const depth = cavity(f, cabinet(f)).depth;
    // 13 mm slide allowance on each side; 12 mm sides; 18/9 mm front/back; 12 mm bottom.
    return {width:col.width - 26 - 24, depth:depth - 20 - 27, height:col.drawerHeight - 40 - 12,
      outerWidth:col.width - 26, outerDepth:depth - 20, travel:Math.min(450, (depth - 20)*.8)};
  }
  function fronts(f) {
    const c=cabinet(f), inner=cavity(f,c), width=(f.w-2*c.thickness)/c.doorCount;
    // Keep the approved exterior independent of the internal partitions.
    return Array.from({length:c.doorCount},(_,i)=>({x:-f.w/2+c.thickness+width*i,width,right:i%2===1,bottom:inner.bottom,height:inner.height}));
  }
  function drawerDoorConflicts(f) {
    const hinges=fronts(f).map(door=>door.x+(door.right?door.width:0));
    return bays(f).filter(b=>b.drawers && hinges.some(x=>x>b.x+30 && x<b.x+b.width-30)).map(b=>b.index+1);
  }
  function toLocal(x, y, f) {
    const a = f.rot*Math.PI/180, dx = x-f.cx, dy = y-f.cy;
    return {x:dx*Math.cos(a)+dy*Math.sin(a), y:-dx*Math.sin(a)+dy*Math.cos(a)};
  }
  function localRect(f, x, y, w, d) {
    const a = f.rot*Math.PI/180;
    return {cx:f.cx+x*Math.cos(a)-y*Math.sin(a), cy:f.cy+x*Math.sin(a)+y*Math.cos(a), w, d, rot:f.rot};
  }
  function furnitureObstacles(f) {
    if (['rug','baycushion','waterheater','acwall','tv'].includes(f.type)) return [];
    const rects = [{cx:f.cx,cy:f.cy,w:f.w,d:f.d,rot:f.rot}];
    if (isCabinet(f) && cabinet(f).front === 'open') {
      for (const door of fronts(f)) rects.push(localRect(f, door.x + (door.right ? door.width+9 : -9), f.d/2-18+door.width/2, 18, door.width-5));
      for (const col of bays(f)) if (col.drawers) {
        const size = drawerSize(f, col), extension = size.travel-cabinet(f).frontGap-20;
        if(extension>0) rects.push(localRect(f,col.x+col.width/2,f.d/2+extension/2,size.outerWidth,extension));
        rects.push(localRect(f,col.x+col.width/2,f.d/2+extension+9,col.width-6,18));
      }
    }
    return rects;
  }
  function circleRect(x, y, r, rect) {
    const p = toLocal(x, y, rect), dx = Math.max(0, Math.abs(p.x)-rect.w/2), dy = Math.max(0, Math.abs(p.y)-rect.d/2);
    return dx*dx+dy*dy <= r*r;
  }
  function rayRect(x, y, dx, dy, rect) {
    const p = toLocal(x,y,rect), a = rect.rot*Math.PI/180;
    const vx = dx*Math.cos(a)+dy*Math.sin(a), vy = -dx*Math.sin(a)+dy*Math.cos(a);
    let lo = 0, hi = Infinity;
    for (const [origin, velocity, half] of [[p.x,vx,rect.w/2],[p.y,vy,rect.d/2]]) {
      if (Math.abs(velocity) < 1e-9) { if (Math.abs(origin)>half) return Infinity; continue; }
      const t1 = (-half-origin)/velocity, t2 = (half-origin)/velocity;
      lo = Math.max(lo,Math.min(t1,t2)); hi = Math.min(hi,Math.max(t1,t2));
    }
    return hi >= lo ? lo : Infinity;
  }
  const api = {defaults, viewSettings, verticalFov, isCabinet, defaultCabinet, cabinet, cavity, validateCabinet, resizeCabinet, presetColumn, bayWidths, bays, openings, drawerSize, fronts, drawerDoorConflicts, toLocal, furnitureObstacles, circleRect, rayRect};
  root.HomeDesign = api;
  if (typeof module !== 'undefined') module.exports = api;
})(globalThis);
