// v1.3 · Perfiles de marca. Compone la entrega COMPLETA (documentos ES/EN, web ES/EN, Preparar entrega) con cuatro perfiles de
// estudio distintos sobre el mismo snapshot y resume el QA de cada uno. No son variantes de B2 (que no construyen la entrega):
// se escriben como snapshots completos en un directorio de trabajo. Los logotipos son SINTÉTICOS y lo dicen en su rótulo.
// Uso: node perfiles-marca.cjs <dirTrabajo> <dirEvidencias>
const fs=require('fs'),path=require('path'),{execFileSync,spawnSync}=require('child_process');
const LAB=path.resolve(__dirname,'..');const [work,ev]=process.argv.slice(2).map(x=>path.resolve(x));fs.mkdirSync(work,{recursive:true});fs.mkdirSync(ev,{recursive:true});
const S0=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));const clone=o=>JSON.parse(JSON.stringify(o));
const svg64=s=>'data:image/svg+xml;base64,'+Buffer.from(s).toString('base64');
const LOGO=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><rect width="240" height="80" fill="#1d3a8a"/><circle cx="40" cy="40" r="24" fill="#f2b705"/><text x="76" y="36" font-family="Arial" font-size="18" fill="#ffffff">LOGOTIPO</text><text x="76" y="58" font-family="Arial" font-size="13" fill="#ffffff">DE PRUEBA</text></svg>`;
const PALE=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 80"><circle cx="40" cy="40" r="24" fill="#eee9df"/><text x="76" y="46" font-family="Arial" font-size="20" fill="#e9e3d8">LOGO PÁLIDO</text></svg>`;
const P={
 'sin-marca':S=>{S.brand.profile=null;},
 'logo':S=>{S.brand.profile={...S.brand.profile,logo:{dataUrl:svg64(LOGO),label:'Logotipo sintético de prueba (laboratorio), no es una marca real',widthPx:240,heightPx:80}};},
 'nombres-largos':S=>{S.brand.profile={...S.brand.profile,name:'Estudio de Arquitectura, Interiorismo y Paisajismo Contemporáneo del Mediterráneo Occidental',person:'María de los Ángeles Fernández-Villaverde y Sánchez de la Concepción',tagline:'Proyectos de reforma integral, rehabilitación energética y diseño de interiores para vivienda'};},
 'logo-poco-contraste':S=>{S.brand.profile={...S.brand.profile,logo:{dataUrl:svg64(PALE),label:'Logotipo sintético de prueba con poco contraste (laboratorio)',widthPx:240,heightPx:80}};}};
const summary={generated:new Date().toISOString(),perfiles:{}};
for(const [name,fn] of Object.entries(P)){const snap=path.join(work,'snap-'+name),out=path.join(work,'out-'+name);fs.rmSync(snap,{recursive:true,force:true});fs.rmSync(out,{recursive:true,force:true});
 fs.cpSync(path.join(LAB,'snapshot'),snap,{recursive:true});const S=clone(S0);fn(S);fs.writeFileSync(path.join(snap,'snapshot.json'),JSON.stringify(S));
 const r=spawnSync('node',[path.join(__dirname,'compose.cjs'),snap,out],{encoding:'utf8',env:process.env,maxBuffer:1<<26});
 const qa=fs.existsSync(path.join(out,'qa.json'))?JSON.parse(fs.readFileSync(path.join(out,'qa.json'),'utf8')):null;
 const reg=fs.existsSync(path.join(out,'entrega/entrega.json'))?JSON.parse(fs.readFileSync(path.join(out,'entrega/entrega.json'),'utf8')):null;
 const bad=qa?Object.entries(qa.docs).filter(([,v])=>v.overflowCount||v.textOverlapCount||v.spillCount||v.svgClipCount||v.tagOverlaps||v.external.length||v.errors.length||(v.lint?.red||[]).length).map(([k,v])=>({doc:k,overflow:v.overflowCount,overlaps:v.textOverlapCount,spill:v.spillCount,red:v.lint?.red})):null;
 const prep=fs.existsSync(path.join(out,'profesional/preparar-entrega.html'))?fs.readFileSync(path.join(out,'profesional/preparar-entrega.html'),'utf8'):'';
 const checks=[...prep.matchAll(/<span class="pill (\w+)">[^<]*<\/span><div><b>([^<]+)<\/b>/g)].map(m=>({estado:m[1],que:m[2]}));
 // portada de la presentación integral y del libro de interiorismo, en ES y EN
 for(const d of ['entrega-integral','interior-book-v3','entrega-integral.en'])if(fs.existsSync(path.join(out,d+'.pdf')))execFileSync('pdftoppm',['-r','45','-f','1','-l','1','-png','-singlefile',path.join(out,d+'.pdf'),path.join(ev,`${name}-${d}`)]);
 summary.perfiles[name]={exit:r.status,docs:qa?Object.keys(qa.docs).length:0,pages:qa?Object.values(qa.docs).reduce((s,v)=>s+v.pages,0):0,qaProblemas:bad,bloqueados:qa?.blocked||null,ingles:{bloqueados:qa?.en?.blocked||null,idiomas:reg?.idiomas||null},
  entregaPublicada:!!reg,comprobaciones:checks,stderr:r.status?r.stderr.slice(-600):undefined};
 console.log(name,'exit',r.status,'docs',summary.perfiles[name].docs,'pages',summary.perfiles[name].pages,'problemas',JSON.stringify(bad),'idiomas',JSON.stringify(reg?.idiomas),'avisos',checks.filter(c=>c.estado!=='ok').map(c=>c.que).join(' | '));}
fs.writeFileSync(path.join(ev,'perfiles-marca.json'),JSON.stringify(summary,null,1));
