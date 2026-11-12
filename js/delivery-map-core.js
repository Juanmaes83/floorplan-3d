/* Delivery 3D — client walk mini-map, pure part (no DOM). The map itself is FloorPlanPresentationCore.minimap() (the
   presentation's orientation map: viewBox and room polygons in plan millimetres); this adds what a free walk needs:
   - roomAt(): the room the visitor stands in (point in polygon; the smallest room wins where polygons overlap);
   - marker(): the «you are here» dot and a view cone pointing where the visitor looks, sized to the map.
   Plan coordinates: millimetres, y down the plan — the same frame as the room polygons. UMD. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanDeliveryMap=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const inside=(x,y,P)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const a=P[i],b=P[j];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])c=!c;}return c;};
 const area=P=>Math.abs(P.reduce((s,p,i)=>{const q=P[(i+1)%P.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2);
 function roomAt(rooms,x,y){
  if(!Number.isFinite(x)||!Number.isFinite(y))return null;
  let best=null,bestArea=Infinity;
  for(const r of rooms||[]){if(!r?.poly||r.poly.length<3||!inside(x,y,r.poly))continue;const a=area(r.poly);if(a<bestArea){best=r;bestArea=a;}}
  return best;
 }
 // size: the map's larger side in mm (viewBox), so the marker reads the same on any home.
 function marker(pose,size){
  if(!pose||![pose.x,pose.y,pose.dx,pose.dy].every(Number.isFinite))return null;
  const l=Math.hypot(pose.dx,pose.dy);if(l<1e-9)return null;
  const dx=pose.dx/l,dy=pose.dy/l,r=Math.max(140,size*.026),len=r*4.2,spread=.5;
  const ax=Math.cos(spread),ay=Math.sin(spread);
  const left=[pose.x+(dx*ax-dy*ay)*len,pose.y+(dy*ax+dx*ay)*len],right=[pose.x+(dx*ax+dy*ay)*len,pose.y+(dy*ax-dx*ay)*len];
  const f=v=>Math.round(v);
  return {x:f(pose.x),y:f(pose.y),r:f(r),cone:`M ${f(pose.x)} ${f(pose.y)} L ${f(left[0])} ${f(left[1])} A ${f(len)} ${f(len)} 0 0 1 ${f(right[0])} ${f(right[1])} Z`,angleDeg:Math.round(Math.atan2(dy,dx)*180/Math.PI)};
 }
 return {roomAt,marker,inside};
});
