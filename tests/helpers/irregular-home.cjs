/* Synthetic variant of the reference home: concave main bedroom and the whole plan rotated 30° clockwise.
   Only geometry changes; IDs, materials and objects are kept so presentation checks can compare rooms. */
module.exports=function irregularHome(reference,{angleDeg=30,id='prj_irregular-rotated'}={}){
 const p=structuredClone(reference),a=angleDeg*Math.PI/180,c=Math.cos(a),s=Math.sin(a),cx=5925,cy=5280;
 p.id=id;
 const master=p.rooms.find(r=>r.id==='rom_master');
 if(master){master.polygon=[{x:6600,y:0},{x:10270,y:0},{x:10270,y:3370},{x:8700,y:3370},{x:8700,y:1900},{x:6600,y:1900}];delete master.labelAt;}
 const turn=q=>{const dx=q.x-cx,dy=q.y-cy;return {x:Math.round(cx+dx*c-dy*s),y:Math.round(cy+dx*s+dy*c)};};
 for(const w of p.walls){w.start=turn(w.start);w.end=turn(w.end);}
 for(const r of p.rooms){r.polygon=r.polygon.map(turn);if(r.labelAt)r.labelAt=turn(r.labelAt);}
 for(const o of p.objects){o.position=turn(o.position);o.rotationDeg=((o.rotationDeg||0)+angleDeg)%360;}
 // Integer rounding can shorten a wall by a millimetre or two; trim only openings that would overflow it.
 for(const o of p.openings||[]){const w=p.walls.find(x=>x.id===o.wallId);if(!w)continue;const L=Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),over=(o.offsetMm||0)+o.widthMm-Math.floor(L);if(over>0)o.widthMm-=over;}
 p.measurements=[];
 return p;
};
