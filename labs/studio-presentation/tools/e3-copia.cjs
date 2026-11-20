'use strict';
// E3 · Copia AISLADA de master (enlaces duros, solo lectura del pin) + enganche mínimo de «Preparar entrega» en Entregar.
// Los dos archivos que cambian se desenlazan antes de escribir: el pin no se modifica nunca.
// Genera también el parche mínimo propuesto a Codex: e3/rubik-<sha7>-e3.patch (diff unificado; NO se aplica a master).
// Uso: node tools/e3-copia.cjs <pinDir> <destino> <sha>
const fs=require('fs'),path=require('path'),{spawnSync}=require('child_process');
const [pin,dest,sha]=process.argv.slice(2);if(!pin||!dest||!sha){console.error('Uso: node tools/e3-copia.cjs <pinDir> <destino> <sha>');process.exit(1);}
const LAB=path.resolve(__dirname,'..'),P=path.resolve(pin),D=path.resolve(dest);
if(fs.existsSync(D)){console.error('El destino ya existe; no se toca: '+D);process.exit(1);}
const r=spawnSync('cp',['-al',P,D]);if(r.status!==0){console.error(String(r.stderr));process.exit(1);}
const HOOK_AT="   window.FloorPlanDeliveryPreview?.card(grid.querySelector('[data-group=\"experience\"] .professional-group-items'));\n";
const HOOK=HOOK_AT+"   // E3 · K10 / ENT-03 (propuesta de laboratorio): «Preparar entrega» con recetas profesionales sobre la revisión confirmada. Solo lectura.\n   window.RubikStudioE3UI?.card(grid.querySelector('[data-group=\"documentation\"] .professional-group-items'));\n";
const TAG_AT='<script src="js/delivery-preview-ui.js"></script>\n';
// js/expediente-core.js (autoridad existente de contentId, F0.1) no se carga hoy en index.html: se añade sin copiarla.
const TAG=TAG_AT+'<script src="js/expediente-core.js"></script><script src="e3/recetas-catalogo.js"></script><script src="e3/e3-core.js"></script><script src="e3/e3-ui.js"></script>\n';
function edit(rel,from,to){const f=path.join(D,rel),src=fs.readFileSync(f,'utf8');if(src.split(from).length!==2)throw new Error(`Ancla no única en ${rel}`);fs.unlinkSync(f);fs.writeFileSync(f,src.replace(from,to));}
edit('index.html',TAG_AT,TAG);edit('js/professional-workspace-ui.js',HOOK_AT,HOOK);
fs.mkdirSync(path.join(D,'e3'));for(const f of ['recetas-catalogo.js','e3-core.js','e3-ui.js','e3.css'])fs.copyFileSync(path.join(LAB,'e3',f),path.join(D,'e3',f));
// Parche para Codex: solo los dos enganches (los archivos e3/ viajan aparte, en el laboratorio).
let patch='';for(const rel of ['index.html','js/professional-workspace-ui.js']){const d=spawnSync('diff',['-u','--label','a/'+rel,'--label','b/'+rel,path.join(P,rel),path.join(D,rel)],{encoding:'utf8'});patch+=d.stdout;}
const out=path.join(LAB,'e3',`rubik-${sha.slice(0,7)}-e3.patch`);fs.writeFileSync(out,patch);
// Comprobación: el pin sigue intacto en los dos archivos editados.
for(const rel of ['index.html','js/professional-workspace-ui.js'])if(fs.readFileSync(path.join(P,rel),'utf8').includes('RubikStudioE3'))throw new Error('El pin cambió: '+rel);
console.log(JSON.stringify({copia:D,parche:path.relative(LAB,out),lineas:patch.split('\n').length}));
