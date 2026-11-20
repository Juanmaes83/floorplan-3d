// E3 · Genera e3/recetas-catalogo.js desde tools/recetas.cjs (fuente única del catálogo RP01–RP21). No edita recetas.cjs.
// El archivo generado lleva la huella del catálogo de origen; e3-qa.cjs comprueba que coincide byte a byte.
// Uso: node tools/e3-catalogo.cjs [--check]
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto');
const RC=require('./recetas.cjs');
const OUT=path.resolve(__dirname,'../e3/recetas-catalogo.js');
const pick=r=>({key:r.key,version:r.version,es:r.es,en:r.en,nivel:r.nivel,corte:r.corte,fases:r.fases,perfiles:r.perfiles,familia:r.familia,tipo:r.tipo,
 requeridas:r.requeridas,completas:r.completas,opcionales:r.opcionales,economia:r.economia,autoridad:r.autoridad,contrato:r.contrato||null,
 sel:r.sel?{tipo:r.sel.tipo,capitulos:r.sel.capitulos||null,documentos:r.sel.documentos||null}:null});
const fuentes=Object.fromEntries(Object.entries(RC.FUENTES).map(([k,f])=>[k,{es:f.es,en:f.en||null}]));
const data={catalogo:RC.VERSION,perfiles:RC.PERFILES,fases:RC.FASES,familias:RC.FAMILIAS,fuentes,recetas:RC.RECETAS.map(pick)};
const json=JSON.stringify(data);
const sha=crypto.createHash('sha256').update(json).digest('hex');
const text=`/* GENERADO por tools/e3-catalogo.cjs desde tools/recetas.cjs (${RC.VERSION}). No editar a mano. sha256(datos)=${sha} */\n`+
 `(function(root){const d=${json};d.sha256='${sha}';if(typeof module==='object'&&module.exports)module.exports=d;else root.RubikStudioE3Catalogo=d;})(typeof globalThis!=='undefined'?globalThis:this);\n`;
if(process.argv.includes('--check')){const cur=fs.existsSync(OUT)?fs.readFileSync(OUT,'utf8'):'';console.log(JSON.stringify({igual:cur===text,sha256:sha}));process.exit(cur===text?0:2);}
fs.writeFileSync(OUT,text);console.log(JSON.stringify({escrito:path.relative(process.cwd(),OUT),sha256:sha,recetas:data.recetas.length,fuentes:Object.keys(fuentes).length}));
