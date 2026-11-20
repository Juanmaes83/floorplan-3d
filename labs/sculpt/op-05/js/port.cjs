'use strict';
/* OP-05 P1 · Port JS reproducible de las dependencias localGLB del donante (openPlan3D@771c9e1, MIT).
   Transformación ÚNICA y mecánica: node:module.stripTypeScriptTypes (modo strip, conserva posiciones) + especificadores
   relativos a `.mjs`. Ninguna lógica se reescribe a mano. Uso: node js/port.cjs [--check] */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{stripTypeScriptTypes}=require('node:module');
const SRC=path.join(__dirname,'../upstream/src/lib/utils'),OUT=__dirname,MODULES=['localGLBGeometry','localGLBAccessors','localGLBScene','localGLBResources','rasterHeader'];
const check=process.argv.includes('--check');let drift=0;
for(const m of MODULES){
 const src=fs.readFileSync(path.join(SRC,m+'.ts'),'utf8'),sha=crypto.createHash('sha256').update(src).digest('hex');
 let js=stripTypeScriptTypes(src,{mode:'strip'});
 js=js.replace(/from '\.\/([A-Za-z0-9]+)'/g,(all,name)=>MODULES.includes(name)?`from './${name}.mjs'`:all);
 const header=`// PORT JS · openPlan3D@771c9e1ad30bd1c3cc7584d6eca74deb2e14943d src/lib/utils/${m}.ts (MIT, ver ../upstream/LICENSE)\n// SHA-256 del original: ${sha}. Generado por js/port.cjs (stripTypeScriptTypes); no editar a mano.\n`;
 const out=header+js,file=path.join(OUT,m+'.mjs');
 if(check){if(!fs.existsSync(file)||fs.readFileSync(file,'utf8')!==out){drift++;console.error('DIFIERE',m);}}else fs.writeFileSync(file,out);
}
if(check){if(drift)process.exit(1);console.log('port idéntico a la transformación de los originales');}
