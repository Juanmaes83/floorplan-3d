// B2 · robustness variants of the canonical snapshot. Each variant is a copy of snapshot/ with ONE kind of stress,
// written to <outRoot>/<name>/ (snapshot.json + the same assets). Nothing is invented: a variant only REMOVES data
// (empty project, no budget, no views, no brand) or makes names LONG, or adds a synthetic, labelled test logo.
const fs=require('node:fs'),path=require('node:path');
const [src,outRoot]=process.argv.slice(2);const S0=JSON.parse(fs.readFileSync(path.join(src,'snapshot.json'),'utf8'));
const clone=o=>JSON.parse(JSON.stringify(o));
const write=(name,S)=>{const d=path.join(outRoot,name);fs.mkdirSync(path.join(d,'assets'),{recursive:true});
 for(const f of fs.readdirSync(path.join(src,'assets')))fs.copyFileSync(path.join(src,'assets',f),path.join(d,'assets',f));
 S.variant=name;fs.writeFileSync(path.join(d,'snapshot.json'),JSON.stringify(S));console.log(name);};
// 1. Empty project: no geometry, objects, materials, views, budget or brand profile.
{const S=clone(S0);S.project={...S.project,rooms:0,walls:0,openings:0,objects:0};S.geometry={walls:[],openings:[],rooms:[],objects:[]};S.objects=[];S.materials=[];
 S.board={floors:[],walls:[],palette:[],furniture:0,empty:true};S.views=[];S.budget=null;S.brand={profile:null,title:null,intro:null,takenAt:S0.brand.takenAt};
 S.summary={areaM2:null,roomsCounted:0,complete:false,status:'unavailable',scale:'unknown'};S.surfaces={areaM2:null,status:'unavailable',levels:[]};write('empty',S);}
// 2. Real geometry, but no budget, no 3D views and no brand profile.
// B3: a long budget (lines repeated ×8 with «PRUEBA n» in the description, prices unchanged, totals recomputed by summing) to
// exercise the measured pagination of the proposal and budget tables. Test data for the engine, never a budget.
{const S=clone(S0);let n=0;for(const k of ['professional','client']){const V=S.budget.test.view[k];if(!V)continue;n=0;for(const c of V.chapters){const base=c.lines;c.lines=[];for(let r=0;r<8;r++)for(const l of base)c.lines.push({...l,description:`${l.description} (PRUEBA ${++n})`});}
  const net=V.chapters.reduce((s,c)=>s+c.lines.reduce((t,l)=>t+l.subtotalNet,0),0),rate=V.summary.tax.ratePercent;V.summary={...V.summary,items:n,unreviewed:n,net:{...V.summary.net,amount:Math.round(net*100)/100},tax:{...V.summary.tax,amount:Math.round(net*rate)/100},gross:{...V.summary.gross,amount:Math.round(net*(100+rate))/100}};}
 S.budget.test.label='DATOS DE PRUEBA DEL MOTOR DE PAGINACIÓN (B3): partidas repetidas ×8, no es un presupuesto.';write('long-budget',S);}
{const S=clone(S0);S.views=[];S.budget=null;S.brand={profile:null,title:S0.brand.title,intro:null,takenAt:S0.brand.takenAt};write('no-budget-views-brand',S);}
// 3. Long names everywhere a person can type one (project, studio, rooms, objects, materials).
{const S=clone(S0);const L=' con vestidor, zona de lectura y salida a la terraza orientada al patio interior de manzana';
 S.brand.title='Rehabilitación integral de vivienda en edificio protegido con conservación de la carpintería original';
 S.brand.profile={...S.brand.profile,name:'Estudio de Arquitectura, Interiorismo y Gestión de Proyectos Sostenibles Ejemplo',person:'Profesional de prueba con un nombre compuesto y dos apellidos largos',tagline:'Arquitectura, interiorismo, rehabilitación energética y dirección de obra'};
 const rn={};for(const r of S.geometry.rooms){const n=r.name+(r.areaM2>9?L:' de servicio con almacenamiento');rn[r.name]=n;r.name=n;}
 for(const o of S.objects){o.room=rn[o.room]||o.room;o.name=o.name+' de fabricación a medida con acabado lacado mate';}
 for(const m of S.materials)m.name=m.name+' rectificado de gran formato colocado a junta mínima';
 for(const f of S.board.floors){f.name=S.materials.find(m=>m.id===f.materialId)?.name||f.name;f.rooms=f.rooms.map(n=>rn[n]||n);}
 for(const v of S.views)if(v.kind==='room')v.label=rn[v.label]||v.label;write('long-names',S);}
// 4. A synthetic test logo (clearly labelled as such), to check it is shown as given and never restyled.
{const S=clone(S0);const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect width="240" height="80" fill="#1d3a8a"/><circle cx="40" cy="40" r="24" fill="#f2b705"/><text x="76" y="36" font-family="Arial" font-size="18" fill="#ffffff">LOGOTIPO</text><text x="76" y="58" font-family="Arial" font-size="13" fill="#ffffff">DE PRUEBA</text></svg>`;
 S.brand.profile={...S.brand.profile,logo:{dataUrl:'data:image/svg+xml;base64,'+Buffer.from(svg).toString('base64'),label:'Logotipo sintético de prueba (laboratorio), no es una marca real',widthPx:240,heightPx:80}};write('logo',S);}
