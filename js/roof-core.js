/* Point 8B-A: pure, conservative upper-envelope geometry. Nothing is persisted. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FloorPlanRoof = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const EPS = Object.freeze({pointMm:0.001, lengthMm:0.001, crossMm2:0.001, areaMm2:0.001, heightMm:0.001, miterFactor:4});
  const cross = (a,b) => a.x*b.y-a.y*b.x;
  const sub = (a,b) => ({x:a.x-b.x,y:a.y-b.y});
  const distance = (a,b) => Math.hypot(a.x-b.x,a.y-b.y);
  const compare = (a,b) => a.x-b.x || a.y-b.y;
  const area = p => p.reduce((s,a,i)=>s+cross(a,p[(i+1)%p.length]),0)/2;
  const fail = (status,reason) => ({status,reason});
  function intersection(a,b,c,d) {
    const u=sub(b,a),v=sub(d,c),den=cross(u,v);
    if(Math.abs(den)<=EPS.crossMm2)return null;
    const t=cross(sub(c,a),v)/den;
    return {x:a.x+t*u.x,y:a.y+t*u.y};
  }
  function onSegment(p,a,b) {
    return Math.abs(cross(sub(b,a),sub(p,a)))<=EPS.crossMm2 && p.x>=Math.min(a.x,b.x)-EPS.pointMm && p.x<=Math.max(a.x,b.x)+EPS.pointMm && p.y>=Math.min(a.y,b.y)-EPS.pointMm && p.y<=Math.max(a.y,b.y)+EPS.pointMm;
  }
  function segmentsIntersect(a,b,c,d) {
    const o1=cross(sub(b,a),sub(c,a)),o2=cross(sub(b,a),sub(d,a)),o3=cross(sub(d,c),sub(a,c)),o4=cross(sub(d,c),sub(b,c));
    if((o1>EPS.crossMm2&&o2< -EPS.crossMm2||o1< -EPS.crossMm2&&o2>EPS.crossMm2) && (o3>EPS.crossMm2&&o4< -EPS.crossMm2||o3< -EPS.crossMm2&&o4>EPS.crossMm2))return true;
    return Math.abs(o1)<=EPS.crossMm2&&onSegment(c,a,b)||Math.abs(o2)<=EPS.crossMm2&&onSegment(d,a,b)||Math.abs(o3)<=EPS.crossMm2&&onSegment(a,c,d)||Math.abs(o4)<=EPS.crossMm2&&onSegment(b,c,d);
  }
  function canonical(points) {
    if(!Array.isArray(points))return fail('invalid','polygon');
    let p=points.map(v=>({x:v.x,y:v.y}));
    if(p.some(v=>!Number.isFinite(v.x)||!Number.isFinite(v.y)))return fail('invalid','non-finite-point');
    p=p.map(v=>({x:Math.round(v.x/EPS.pointMm)*EPS.pointMm,y:Math.round(v.y/EPS.pointMm)*EPS.pointMm}));
    if(p.length>1&&distance(p[0],p.at(-1))<=EPS.pointMm)p.pop();
    p=p.filter((v,i)=>i===0||distance(v,p[i-1])>EPS.pointMm);
    let changed=true;
    while(changed&&p.length>=3){changed=false;for(let i=0;i<p.length;i++){
      const a=p[(i+p.length-1)%p.length],b=p[i],c=p[(i+1)%p.length];
      const incoming=sub(b,a),outgoing=sub(c,b);
      if(distance(a,b)<=EPS.lengthMm||distance(b,c)<=EPS.lengthMm||Math.abs(cross(incoming,outgoing))<=EPS.crossMm2&&incoming.x*outgoing.x+incoming.y*outgoing.y>=0){p.splice(i,1);changed=true;break;}
    }}
    if(p.length<3)return fail('invalid','degenerate-polygon');
    if(p.some((v,i)=>distance(v,p[(i+1)%p.length])<=EPS.lengthMm))return fail('invalid','short-edge');
    for(let i=0;i<p.length;i++)for(let j=i+1;j<p.length;j++){
      if(j===i+1||i===0&&j===p.length-1)continue;
      if(segmentsIntersect(p[i],p[(i+1)%p.length],p[j],p[(j+1)%p.length]))return fail('invalid','self-intersection');
    }
    const signed=area(p);if(Math.abs(signed)<=EPS.areaMm2)return fail('invalid','zero-area');
    if(signed<0)p.reverse();
    let start=0;for(let i=1;i<p.length;i++)if(compare(p[i],p[start])<0)start=i;
    p=p.slice(start).concat(p.slice(0,start));
    return {status:'available',polygon:p,areaMm2:Math.abs(signed)};
  }
  function footprint(project, Exterior) {
    const classification=Exterior.derive(project),ids=new Set(classification.walls.filter(w=>w.status==='facade').map(w=>w.wallId));
    if(classification.status!=='available')return fail('unavailable','incomplete-facade-classification');
    const walls=(project.walls||[]).filter(w=>ids.has(w.id));
    if(walls.length<3)return fail('unavailable','no-closed-facade');
    const key=p=>`${p.x},${p.y}`,nodes=new Map();
    for(const w of walls){
      if(distance(w.start,w.end)<=EPS.lengthMm)return fail('invalid','short-facade-edge');
      for(const p of [w.start,w.end]){const k=key(p);if(!nodes.has(k))nodes.set(k,{point:p,walls:[]});nodes.get(k).walls.push(w);}
    }
    if([...nodes.values()].some(n=>n.walls.length!==2))return fail('unavailable','open-or-branched-facade');
    const start=[...nodes.values()].sort((a,b)=>compare(a.point,b.point))[0].point;
    const ordered=[],used=new Set();let current=start;
    while(true){
      const candidates=nodes.get(key(current)).walls.filter(w=>!used.has(w.id));
      if(!candidates.length)break;
      candidates.sort((a,b)=>compare(key(a.start)===key(current)?a.end:a.start,key(b.start)===key(current)?b.end:b.start));
      const w=candidates[0],next=key(w.start)===key(current)?w.end:w.start;
      ordered.push({a:{...current},b:{...next},thicknessMm:w.thicknessMm,wallId:w.id});used.add(w.id);current=next;
      if(key(current)===key(start))break;
      if(ordered.length>walls.length)return fail('invalid','cycle-overrun');
    }
    if(key(current)!==key(start)||used.size!==walls.length)return fail('unavailable','multiple-facade-cycles');
    let center=ordered.map(e=>e.a),signed=area(center);
    if(Math.abs(signed)<=EPS.areaMm2)return fail('invalid','zero-area');
    if(signed<0){ordered.reverse();for(const e of ordered)[e.a,e.b]=[e.b,e.a];center=ordered.map(e=>e.a);}
    const validated=canonical(center);if(validated.status!=='available')return validated;
    const shifted=[];
    for(let i=0;i<ordered.length;i++){
      const prev=ordered[(i+ordered.length-1)%ordered.length],curr=ordered[i],v=curr.a;
      const d1=sub(prev.b,prev.a),d2=sub(curr.b,curr.a),l1=Math.hypot(d1.x,d1.y),l2=Math.hypot(d2.x,d2.y);
      const n1={x:d1.y/l1,y:-d1.x/l1},n2={x:d2.y/l2,y:-d2.x/l2};
      const a={x:v.x+n1.x*prev.thicknessMm/2,y:v.y+n1.y*prev.thicknessMm/2};
      const b={x:v.x+n2.x*curr.thicknessMm/2,y:v.y+n2.y*curr.thicknessMm/2};
      const corner=intersection(a,{x:a.x+d1.x,y:a.y+d1.y},b,{x:b.x+d2.x,y:b.y+d2.y});
      if(!corner){if(distance(a,b)>EPS.pointMm)return fail('unavailable','collinear-thickness-step');shifted.push(a);continue;}
      if(distance(corner,v)>EPS.miterFactor*Math.max(prev.thicknessMm,curr.thicknessMm)/2)return fail('unavailable','miter-limit');
      shifted.push(corner);
    }
    const outer=canonical(shifted);if(outer.status!=='available')return fail('unavailable','invalid-exterior-offset');
    const heights=walls.map(w=>w.heightMm);
    if(heights.some(h=>!Number.isFinite(h)||h<=0))return fail('unavailable','invalid-facade-height');
    if(heights.some(h=>Math.abs(h-heights[0])>EPS.heightMm))return fail('unavailable','heterogeneous-top-elevation');
    return {status:'available',polygon:outer.polygon,areaMm2:outer.areaMm2,topMm:heights[0],wallIds:ordered.map(e=>e.wallId)};
  }
  function contains(poly,x,y) {
    let hit=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){
      const a=poly[i],b=poly[j];if((a.y>y)!==(b.y>y)&&x<(b.x-a.x)*(y-a.y)/(b.y-a.y)+a.x)hit=!hit;
    }return hit;
  }
  function orthogonal(poly){return poly.every((p,i)=>{const q=poly[(i+1)%poly.length];return Math.abs(p.x-q.x)<=EPS.pointMm||Math.abs(p.y-q.y)<=EPS.pointMm;});}
  function unique(values){return values.sort((a,b)=>a-b).filter((v,i,a)=>i===0||v-a[i-1]>EPS.pointMm);}
  function difference(lower,upper){
    if(JSON.stringify(lower)===JSON.stringify(upper))return {status:'available',exposed:[],overlapMm2:area(lower),overhangMm2:0};
    if(!orthogonal(lower)||!orthogonal(upper))return fail('unavailable','non-orthogonal-setback');
    const xs=unique([...lower,...upper].map(p=>p.x)),ys=unique([...lower,...upper].map(p=>p.y));
    const exposed=[],overlap=[];let overhangMm2=0;
    for(let yi=0;yi<ys.length-1;yi++)for(let xi=0;xi<xs.length-1;xi++){
      const x0=xs[xi],x1=xs[xi+1],y0=ys[yi],y1=ys[yi+1];
      if(x1-x0<=EPS.lengthMm||y1-y0<=EPS.lengthMm)continue;
      const lo=contains(lower,(x0+x1)/2,(y0+y1)/2),up=contains(upper,(x0+x1)/2,(y0+y1)/2);
      if(lo&&!up)exposed.push([{x:x0,y:y0},{x:x1,y:y0},{x:x1,y:y1},{x:x0,y:y1}]);
      if(lo&&up)overlap.push((x1-x0)*(y1-y0));
      if(up&&!lo)overhangMm2+=(x1-x0)*(y1-y0);
    }
    return {status:'available',exposed,overlapMm2:overlap.reduce((a,b)=>a+b,0),overhangMm2};
  }
  function deriveProject(project,Exterior){
    const f=footprint(project,Exterior);if(f.status!=='available')return f;
    return {status:'available',surfaces:[{kind:'top-roof',levelId:null,elevationMm:f.topMm,polygon:f.polygon}],footprint:f};
  }
  function deriveBuilding(building,Exterior,Building){
    if(!building?.levels?.length||building.levels.length>2)return fail('invalid','level-count');
    const levels=[];for(const l of building.levels){
      const f=footprint(l.project,Exterior);if(f.status!=='available')return {...f,levelId:l.id};
      const translated=canonical(Building.toBuilding(f.polygon,l));if(translated.status!=='available')return translated;
      levels.push({levelId:l.id,polygon:translated.polygon,areaMm2:translated.areaMm2,elevationMm:l.elevationMm+f.topMm,offsetMm:{...l.offsetMm}});
    }
    const surfaces=[];let relation=null;
    if(levels.length===2){
      relation=difference(levels[0].polygon,levels[1].polygon);if(relation.status!=='available')return relation;
      for(const polygon of relation.exposed)surfaces.push({kind:'exposed-roof',levelId:levels[0].levelId,elevationMm:levels[0].elevationMm,polygon});
    } else surfaces.push({kind:'top-roof',levelId:levels[0].levelId,elevationMm:levels[0].elevationMm,polygon:levels[0].polygon});
    if(levels.length===2)surfaces.push({kind:'top-roof',levelId:levels[1].levelId,elevationMm:levels[1].elevationMm,polygon:levels[1].polygon});
    return {status:'available',levels,surfaces,relation};
  }
  return {EPS,canonical,area,footprint,difference,deriveProject,deriveBuilding};
});
