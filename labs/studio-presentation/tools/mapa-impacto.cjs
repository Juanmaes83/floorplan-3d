'use strict';

const fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const {createHash}=require('node:crypto');
const {execFileSync}=require('node:child_process');
const CAT=require('./catalogo-entrega.cjs'),RC=require('./recetas.cjs');
const lab=path.resolve(__dirname,'..'),src=path.join(lab,'out/v3/entrega');
const read=rel=>fs.readFileSync(path.join(lab,rel));
const parse=rel=>JSON.parse(read(rel));
const hash=(bytes,algorithm='sha256')=>createHash(algorithm).update(bytes).digest('hex');
const command=(bin,...args)=>{
 try{return execFileSync(bin,args,{cwd:lab,encoding:'utf8',stdio:['ignore','pipe','pipe']}).trim().split('\n')[0];}
 catch{return null;}
};
const context=RC.contexto(lab,src),registry=context.REG;
const regHash=hash(read('out/v3/entrega/entrega.json'));
const evidence=parse('evidence/recetas/recetas-qa.json');
const recipeExports=parse('evidence/recetas/salidas.json');
const modules={
 '01':{fuentes:['marca','geometria','vistas3d'],gates:['RP-Q03','RP-Q09']},
 '02':{fuentes:['concepto','alcanceServicios'],gates:['RP-Q03']},
 '03':{fuentes:['revisionAnterior','fotosAportadas','superficies'],gates:['RP-Q03','RP-Q08']},
 '04':{fuentes:['geometria','superficies','dimensionesHuecos','norte','variantesGuardadas','seccionFachadas'],gates:['RP-Q03','RP-Q04']},
 '05':{fuentes:['geometria','dibujoVivo','vistas3d','evidenciaEjecutada'],gates:['RP-Q03','RP-Q08']},
 '06':{fuentes:['vistas3d','imagenesIA','recorrido','evidenciaEjecutada'],gates:['RP-Q03','RP-Q09']},
 '07':{fuentes:['materiales','objetos','catalogoProductos','preciosVerificados','referenciasMoodboard','especificacionValidada'],gates:['RP-Q05','RP-Q09']},
 '08':{fuentes:['presupuesto','presupuestoRevisado','honorarios','precioInmueble','impuestosCompra','ofertasIndependientes','costeLiquidado'],gates:['RP-Q06','RP-Q08']},
 '09':{fuentes:['planObra','vinculoPlanPresupuesto','observacionesObra','certificadosObra','punchList'],gates:['RP-Q03','RP-Q08']},
 '10':{fuentes:['marca','motivoCambio','validezOferta','archivoPropietario','actasEntrega','manualesGarantias'],gates:['RP-Q07','RP-Q09','RP-Q10']}
};
const gates={
 'RP-Q01':['tools/recetas-qa.cjs'],'RP-Q02':['tools/recetas-qa.cjs'],'RP-Q03':['tools/recetas-qa.cjs','tools/exportar-qa.cjs'],
 'RP-Q04':['tools/architecture-pdf-qa.py'],'RP-Q05':['tools/ffe-qa.cjs'],'RP-Q06':['tools/economia-qa.cjs','tools/recetas-qa.cjs'],
 'RP-Q07':['tools/estado-qa.cjs'],'RP-Q08':['tools/recetas-qa.cjs','evidence/e2/diagnostico.json'],
 'RP-Q09':['tools/consumidor-qa.cjs','evidence/revision-visual/index.html'],'RP-Q10':['tools/exportar-qa.cjs','tools/inspeccionar-paquete.py','tools/reconstruir.sh'],
 'RP-Q11':['tools/mapa-impacto.cjs'],'RP-Q12':['tools/motor-qa.cjs','tools/reconstruir.sh']
};
const dependencies=['tools','system','i18n','snapshot','vendor','assets','evidence/render-ia'];
const walk=(root)=>fs.readdirSync(path.join(lab,root),{withFileTypes:true}).flatMap(ent=>{
 if(ent.name==='node_modules'||ent.name==='__pycache__')return [];
 const rel=root+'/'+ent.name;
 return ent.isDirectory()?walk(rel):ent.isFile()?[rel]:[];
});
const code=Object.fromEntries(dependencies.flatMap(walk).sort().map(rel=>{
 const bytes=read(rel);
 return [rel,{sha256:hash(bytes),gitBlob:hash(Buffer.concat([Buffer.from(`blob ${bytes.length}\0`),bytes]),'sha1'),bytes:bytes.length}];
}));
const recipeEntries=RC.RECETAS.map(r=>{
 const sourceIds=[...new Set([...r.requeridas,...r.completas,...r.opcionales])];
 const es=RC.resolver(r.key,context,'es'),en=RC.resolver(r.key,context,'en');
 const ids=r.modulos.flatMap(m=>[...modules[m].fuentes]);
 const commonGates=['RP-Q01','RP-Q02','RP-Q03','RP-Q10','RP-Q11','RP-Q12'];
 const tests=[...new Set([...commonGates,...r.modulos.flatMap(m=>modules[m].gates)])];
 const parts=Object.fromEntries([es,en].map((candidate,i)=>{
  const lang=i?'en':'es', files=recipeExports[`${r.key.toLowerCase()}-${lang}`];
  const run=evidence.registroSha256===regHash&&files?.registroSha256===regHash;
  return [lang,{estado:candidate.estado,seleccion:candidate.seleccion||null,
   artefacto:run?{zipSha256:files.zipSha256,archivos:files.files}:null,
   evidencia:run?'ejecutada y ligada al registro':candidate.emitible?'pendiente de verificar':'contrato sin artefacto de cliente'}];
 }));
 return {receta:r.key,nivel:r.nivel,modulos:r.modulos.map(n=>({id:n,
  capitulos:CAT.MODULOS.find(m=>m.n===n).capitulos,fuentes:modules[n].fuentes.filter(f=>sourceIds.includes(f))})),
  fuentes:Object.fromEntries(sourceIds.map(f=>[f,{...es.fuentes[f],vinculo:ids.includes(f)?'relación declarada':'dependencia indirecta de la receta'}])),
  salida:parts,gates:tests};
});
const graph={schema:'rubik-lab-impacto/1',identidad:{proyecto:registry.project.id,revision:registry.project.revision,
 snapshotSha256:registry.snapshot.sha256,registroSha256:regHash},
 entorno:{node:process.version,plataforma:process.platform,arquitectura:process.arch,kernel:os.release(),playwright:require('playwright/package.json').version,
  poppler:command('sh','-c','pdftotext -v 2>&1'),ffmpeg:command('ffmpeg','-version'),python:command('python3','--version'),
  tz:process.env.TZ||Intl.DateTimeFormat().resolvedOptions().timeZone},
 dependenciasComunes:code,recetas:recipeEntries,
 gates:Object.fromEntries(Object.entries(gates).map(([id,pruebas])=>[id,{pruebas,
  humano:id==='RP-Q09',reutilizacion:'Solo con identidad verificada de fuentes, entorno y artefacto.'}]))};
const output=path.resolve(process.argv[2]||path.join(lab,'evidence/impacto/mapa.json'));
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(graph,null,2)+'\n');
console.log(`${recipeEntries.length} recetas, ${Object.keys(code).length} archivos con huellas, ${Object.keys(gates).length} gates`);
