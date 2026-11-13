'use strict';
/* Genera tests/fixtures/ux07-dossier-1.0.0/ con la implementación ORIGINAL 1.0.0 de #209 (no con el código actual).
   Auditoría ChatGPT #212: la compatibilidad 1.0.0 debe probarse con un artefacto auténtico, no reetiquetando uno 1.1.0.
   Uso: node tests/ux07/build-dossier-1.0.0-fixture.cjs <checkout de lab/ux07-ent04-before-after@8a3cce8>
   Escribe dossier.html, manifest.json y origen.json (SHA del commit, versión, entradas). Datos SINTÉTICOS y precios
   FICTICIOS de las fixtures del laboratorio. */
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const SRC=path.resolve(process.argv[2]||'');if(!fs.existsSync(path.join(SRC,'js/before-after-dossier-core.js')))throw Error('Falta el checkout de #209');
const sha=execFileSync('git',['-C',SRC,'rev-parse','HEAD']).toString().trim();
const D=require(path.join(SRC,'js/before-after-dossier-core.js')),R=require(path.join(SRC,'js/revision-compare-core.js')),F=require(path.join(SRC,'labs/ux07-ent04/fixtures.js'));
if(D.VERSION!=='1.0.0')throw Error('El checkout no es la implementación 1.0.0 ('+D.VERSION+')');
const OUT=path.join(__dirname,'..','fixtures','ux07-dossier-1.0.0');
(async()=>{const before=F.before(),after=F.after(),budget=F.budget('complete'),c=R.compare(before,after);
  const v=D.view(c,{beforeProject:before,afterProject:after,budget,now:'2026-11-12T12:00:00.000Z'});
  const out=await D.exportDossier(v,{beforeProject:before,afterProject:after,budget,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,'dossier.html'),out.html);fs.writeFileSync(path.join(OUT,'manifest.json'),JSON.stringify(out.manifest,null,1));
  fs.writeFileSync(path.join(OUT,'origen.json'),JSON.stringify({generadoCon:'lab/ux07-ent04-before-after (#209)',commit:sha,version:D.VERSION,fecha:'2026-11-12T12:00:00.000Z',
    entradas:{antes:'UX07Fixtures.before()',despues:'UX07Fixtures.after()',presupuesto:"UX07Fixtures.budget('complete') — precios FICTICIOS"},nota:'No regenerar con el código actual: perdería su valor de prueba de compatibilidad.'},null,1));
  console.log(sha,D.VERSION,out.manifest.html.bytes,'bytes',out.manifest.html.sha256);
})().catch(e=>{console.error(e);process.exit(1);});
