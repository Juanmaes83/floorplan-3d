'use strict';
// Second pilot case, declared SYNTHETIC: the example dwelling rotated about its centre so no wall is axis-aligned
// (it keeps its concave dining room and hall). Integer millimetres; openings that overflow their rounded wall are trimmed.
const Core=require('../../js/project-core.js'),reference=require('../../js/reference-project.js');
function rotated(deg=30,base=reference){
 const p=Core.clone(base),c=Core.geometry(p).center,a=deg*Math.PI/180,cos=Math.cos(a),sin=Math.sin(a);
 const r=v=>({...v,x:Math.round(c.x+(v.x-c.x)*cos-(v.y-c.y)*sin),y:Math.round(c.y+(v.x-c.x)*sin+(v.y-c.y)*cos)});
 p.id=base.id+'-rot'+deg+'-synthetic';p.name=base.name+' (synthetic rotated '+deg+'°)';
 for(const w of p.walls){w.start=r(w.start);w.end=r(w.end);}
 for(const room of p.rooms){room.polygon=room.polygon.map(r);if(room.labelAt)room.labelAt=r(room.labelAt);}
 for(const o of p.objects){o.position=r(o.position);o.rotationDeg=((o.rotationDeg||0)+deg)%360;}
 for(const m of p.measurements||[])for(const k of Object.keys(m))if(m[k]&&typeof m[k]==='object'&&'x' in m[k]&&'y' in m[k])m[k]=r(m[k]);
 const trimmed=[];for(const o of p.openings){const w=p.walls.find(w=>w.id===o.wallId),len=Math.floor(Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y));if(o.offsetMm+o.widthMm>len){trimmed.push({id:o.id,fromMm:o.widthMm,toMm:len-o.offsetMm});o.widthMm=len-o.offsetMm;}}
 const warnings=Core.validate(p);return {project:p,trimmed,warnings};
}
module.exports={rotated};
if(require.main===module){const fs=require('node:fs'),[out,deg='30']=process.argv.slice(2);if(!out){console.error('Usage: node irregular-fixture.cjs NEW.json [degrees]');process.exit(1);}
 const {project,trimmed,warnings}=rotated(Number(deg));fs.writeFileSync(out,JSON.stringify(project)+'\n',{flag:'wx'});console.log(JSON.stringify({id:project.id,trimmed,warnings:warnings?.length??0}));}
