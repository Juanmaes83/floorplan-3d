// v1.3 · §2.1 (A08/A19) · Identidad de la fixture comprobada con las FUNCIONES CANÓNICAS del producto, cada una con su
// algoritmo: la revisión «rv1-…» con RubikAssistantDomainTools.revision y la huella FT3D-8 con
// FloorPlanConstructionProject.fingerprint, ambas sobre el proyecto de ejemplo cargado por el propio producto
// («Probar el ejemplo»). No se comparan cadenas de contratos distintos entre sí. Solo lectura; sin red.
// Uso: node diagnostico/identidad-fixture.cjs <worktreeProducto> → evidence/e2/identidad-fixture.json
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),{execFileSync}=require('child_process'),serve=require('../tools/serve.cjs');
const M=path.resolve(process.argv[2]),LAB=path.resolve(__dirname,'..');const S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));
const ftf=fs.readdirSync(path.join(LAB,'assets/ft3d8')).find(f=>f.endsWith('.json'));const FT=JSON.parse(fs.readFileSync(path.join(LAB,'assets/ft3d8',ftf),'utf8'));
(async()=>{const srv=await serve(M),b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const ctx=await b.newContext();const ext=[];ctx.on('request',r=>{if(!r.url().startsWith(srv.url)&&!/^(data|blob|about):/.test(r.url()))ext.push(r.url());});
 const pg=await ctx.newPage();pg.setDefaultTimeout(60000);await pg.goto(srv.url);await pg.locator('#welcomeExample').click();await pg.waitForFunction(()=>window.FloorPlanApp?.project&&window.RubikAssistantDomainTools);
 const got=await pg.evaluate(async()=>{const p=FloorPlanApp.project;return {id:p.id,name:p.name,revision:RubikAssistantDomainTools.revision(p),fingerprint:window.FloorPlanConstructionProject?.fingerprint?await FloorPlanConstructionProject.fingerprint(p):null,rooms:p.rooms.length,walls:p.walls.length,openings:p.openings.length,objects:p.objects.length};});
 await b.close();
 const out={schema:'rubik-lab-identidad-fixture/1',producto:execFileSync('git',['-C',M,'rev-parse','HEAD']).toString().trim(),fecha:new Date().toISOString(),
  revision:{funcion:'RubikAssistantDomainTools.revision',snapshot:S.project.revision,producto:got.revision,coincide:got.revision===S.project.revision},
  huellaFT3D8:{funcion:'FloorPlanConstructionProject.fingerprint',manifiesto:FT.project.fingerprint,producto:got.fingerprint,coincide:got.fingerprint===FT.project.fingerprint},
  proyecto:{id:got.id,coincideId:got.id===S.project.id&&got.id===FT.project.id,conteos:{snapshot:[S.project.rooms,S.project.walls,S.project.openings,S.project.objects],producto:[got.rooms,got.walls,got.openings,got.objects]}},externas:ext.length,
  alcance:'Coincidencia con el proyecto de ejemplo del producto en este SHA. Si no coincide, la fixture se tomó de otra versión del ejemplo o tras cambios: se declara, no se rehace la huella.'};
 fs.mkdirSync(path.join(LAB,'evidence/e2'),{recursive:true});fs.writeFileSync(path.join(LAB,'evidence/e2/identidad-fixture.json'),JSON.stringify(out,null,1));console.log(JSON.stringify(out,null,1));process.exit(0);})().catch(e=>{console.error(e);process.exit(1);});
