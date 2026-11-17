// Prueba de correspondencia: ¿el expediente de obra de la demo FT3D-8 (?demo=obra) es el MISMO proyecto que el snapshot
// de los entregables (prj_reference-home)? Compara elemento a elemento (id y cada campo común) la geometría del snapshot
// con FloorPlanCore.initial() (el ejemplo canónico) y con FloorPlanConstructionDemo.project() (la demo). Solo lee.
const path=require('path'),fs=require('fs'),crypto=require('crypto');
const ROOT=path.resolve(__dirname,'../../..'),LAB=path.resolve(__dirname,'..');
const S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));
const Core=require(path.join(ROOT,'js/project-core.js')),Demo=require(path.join(ROOT,'js/construction-demo-core.js'));
const canon=Core.initial(),demo=Demo.project();
const r2=v=>typeof v==='number'?Math.round(v*1000)/1000:v;
const norm=v=>Array.isArray(v)?v.map(norm):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,norm(v[k])])):r2(v);
function compare(label,snapList,projList){const byId=new Map(projList.map(x=>[x.id,x]));const diffs=[];let fieldsCompared=0;
 for(const s of snapList){const p=byId.get(s.id);if(!p){diffs.push({id:s.id,missing:'en el proyecto'});continue;}
  for(const k of Object.keys(s)){if(!(k in p))continue;fieldsCompared++;const a=JSON.stringify(norm(s[k])),b=JSON.stringify(norm(p[k]));if(a!==b)diffs.push({id:s.id,field:k,snapshot:norm(s[k]),proyecto:norm(p[k])});}}
 const extra=projList.filter(p=>!snapList.some(s=>s.id===p.id)).map(p=>p.id);
 return {label,snapshot:snapList.length,proyecto:projList.length,fieldsCompared,extra,diffs};}
const sha=o=>crypto.createHash('sha256').update(JSON.stringify(norm(o))).digest('hex').slice(0,16);
const geo=p=>({walls:p.walls.map(w=>({id:w.id,start:w.start,end:w.end,thicknessMm:w.thicknessMm,structure:w.structure})),
 openings:p.openings.map(o=>{const {source,...r}=o;return r;}),rooms:p.rooms.map(r=>({id:r.id,polygon:r.polygon,floorMaterialId:r.floorMaterialId}))});
const out={generated:new Date().toISOString(),snapshot:{project:S.project,takenAt:S.takenAt,sourceSha:S.source.sha},
 sets:{}};
for(const [name,p] of [['canonico',canon],['demo-obra',demo]]){out.sets[name]={id:p.id,name:p.name,counts:{rooms:p.rooms.length,walls:p.walls.length,openings:p.openings.length,objects:p.objects.length},
 comparisons:['walls','openings','rooms','objects'].map(k=>{const c=compare(k,S.geometry[k],p[k]);return {...c,diffCount:c.diffs.length,diffs:c.diffs.slice(0,6),diffFields:[...new Set(c.diffs.map(d=>d.field||'missing'))]};})};}
fs.writeFileSync(path.join(LAB,'evidence/correspondencia/correspondencia.json'),JSON.stringify(out,null,1));
for(const [n,s] of Object.entries(out.sets))console.log(n,s.id,JSON.stringify(s.counts),s.comparisons.map(c=>`${c.label}:${c.fieldsCompared} campos, ${c.diffCount} dif ${c.diffFields.join('/')}`).join(' | '));
