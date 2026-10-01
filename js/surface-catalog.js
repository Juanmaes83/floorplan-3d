/* Local surface library. Metadata only; map bytes are loaded by the 3D renderer. */
(function(root){
 'use strict';
 const families={wood:'Madera',ceramic:'Cerámica y porcelánico',stone:'Piedra y mármol',mineral:'Cemento, microcemento y terrazo',wall:'Yeso y acabados murales'};
 const normalize=s=>String(s).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
 const path=/^assets\/materials\/[a-z0-9-]+(?:-sample)?\.webp$/;
 function validate(c){
  if(c.version!==1||!['complete','partial'].includes(c.status)||c.targetCount!==50||!Array.isArray(c.entries)||c.entries.length>50)throw Error('Catálogo de superficies inválido');
  const ids=new Set(),hashes=new Set();
  for(const e of c.entries){
   if(!/^surface-[a-z0-9-]{1,31}$/.test(e.id)||ids.has(e.id)||!families[e.family]||typeof e.name!=='string'||e.name.length>100)throw Error('Identidad de superficie inválida');
   ids.add(e.id);
   if(!Array.isArray(e.applications)||!e.applications.length||e.applications.some(x=>!['floor','wall'].includes(x)))throw Error('Aplicación de superficie inválida');
   if(!/^#[a-f0-9]{6}$/i.test(e.color)||!Number.isFinite(e.roughness)||e.roughness<0||e.roughness>1)throw Error('Fallback de superficie inválido');
   if(e.source?.license!=='CC0-1.0'||!/^https:\/\/polyhaven\.com\/a\/[a-z0-9_]+$/.test(e.source?.url||'')||!e.source.author||!/^https:\/\/github\.com\/Poly-Haven\/polyhaven\.com\/blob\/[a-f0-9]{40}\/public\/locales\/en\/license\.json$/.test(e.source.licenseUrl||'')||!e.source.distributionUrl||!e.source.distributionLicenseUrl||!e.source.rightsEvidence||!e.scaleEvidence)throw Error('Procedencia/licencia de superficie ausente');
   for(const f of [e.maps?.baseColor,e.sample])if(!f||!path.test(f.path)||f.format!=='image/webp'||!Number.isInteger(f.bytes)||f.bytes<1||f.bytes>512*1024||!Number.isInteger(f.width)||!Number.isInteger(f.height)||Math.min(f.width,f.height)<1||Math.max(f.width,f.height)>512||!/^([a-f0-9]{64})$/.test(f.sha256))throw Error('Mapa de superficie inválido');
   if(hashes.has(e.maps.baseColor.sha256))throw Error('Textura repetida');hashes.add(e.maps.baseColor.sha256);
   repeat(e.repeatMm);
  }
  if(c.status==='complete'&&(c.entries.length!==50||Object.keys(families).some(f=>c.entries.filter(e=>e.family===f).length!==10)))throw Error('Biblioteca incompleta: se requieren diez acabados por familia');
  return c;
 }
 function repeat(v){if(!v||!Number.isInteger(v.x)||!Number.isInteger(v.y)||v.x<100||v.y<100||v.x>10000||v.y>10000)throw Error('Repetición: usa entre 100 y 10000 mm por eje');return v;}
 function search(entries,{family='',query='',application='floor'}={}){const terms=normalize(query).trim().split(/\s+/).filter(Boolean);return entries.filter(e=>(!family||e.family===family)&&e.applications.includes(application)&&terms.every(t=>normalize([e.name,e.id,families[e.family],...(e.tags||[])].join(' ')).includes(t)));}
 function apply(project,entry,{kind,id,repeatMm=entry.repeatMm}){
  const C=typeof module!=='undefined'?require('./project-core.js'):root.FloorPlanCore;
  if(!['floor','wall'].includes(kind)||!entry.applications.includes(kind))throw Error('Acabado incompatible con la superficie');repeat(repeatMm);
  const next=C.clone(project),target=(kind==='floor'?next.rooms:next.walls).find(x=>x.id===id);if(!target||target.status==='demolished')throw Error('Superficie no disponible');
  const mid='mat_'+entry.id+'-'+kind,material={id:mid,name:entry.name,category:kind,appearance:{color:entry.color,preset:entry.id,repeatMm:{...repeatMm}}};
  const existing=next.materials.findIndex(m=>m.id===mid);
  // Each assignment carries its own scale: editing one room must not alter another.
  if(existing>=0&&JSON.stringify(next.materials[existing])!==JSON.stringify(material))material.id=C.id('mat');
  if(!next.materials.some(m=>m.id===material.id))next.materials.push(material);
  target[kind==='floor'?'floorMaterialId':'surfaceMaterialId']=material.id;
  if(Number(next.schemaVersion.split('.')[1])<4)next.schemaVersion='1.4.0';C.validate(next);return next;
 }
 const api={partial:true,families,validate,repeat,search,apply,entries:[],status:new Map(),get(id){return this.entries.find(e=>e.id===id);},notify(id,message){this.status.set(id,message);if(typeof dispatchEvent==='function')dispatchEvent(new Event('surface-status'));}};
 if(typeof module!=='undefined')module.exports=api;
 else{root.FloorPlanSurfaces=api;api.ready=fetch('assets/materials/catalog.json').then(r=>{if(!r.ok)throw Error(`Catálogo de superficies: HTTP ${r.status}`);return r.json();}).then(validate).then(c=>{api.entries=c.entries;api.partial=c.status==='partial';return c;}).catch(e=>{api.notify('catalog',e.message+'; se conservan los materiales anteriores.');return null;});}
})(globalThis);
