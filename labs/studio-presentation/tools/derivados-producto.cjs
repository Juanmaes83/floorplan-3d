// v1.3 · A21 · DERIVADOS DEL PRODUCTO para el Architecture Book: la sección dinámica (FT3D-3, FloorPlanPresentationSection)
// y las fachadas candidatas (FT3D-4, FloorPlanPresentationElevation) calculadas POR EL PRODUCTO sobre el mismo proyecto de
// la fixture, tras comprobar que su revisión canónica es la del snapshot. El laboratorio solo los dibuja; no los recalcula.
// Solo lectura, sin red. Uso: node tools/derivados-producto.cjs <worktreeProducto> → snapshot/derivados/*.json
'use strict';
const {chromium}=require('playwright'),fs=require('fs'),path=require('path'),crypto=require('crypto'),{execFileSync}=require('child_process'),serve=require('./serve.cjs');
const M=path.resolve(process.argv[2]),LAB=path.resolve(__dirname,'..'),S=JSON.parse(fs.readFileSync(path.join(LAB,'snapshot/snapshot.json'),'utf8'));
const head=execFileSync('git',['-C',M,'rev-parse','HEAD']).toString().trim();
(async()=>{const srv=await serve(M),b=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader']});const pg=await b.newPage();pg.setDefaultTimeout(60000);
 await pg.goto(srv.url);await pg.locator('#welcomeExample').click();await pg.waitForFunction(()=>window.FloorPlanApp?.project&&window.FloorPlanPresentationSection&&window.FloorPlanPresentationElevation&&window.RubikAssistantDomainTools);
 const r=await pg.evaluate(()=>{const p=FloorPlanApp.project;const opts={overviewDirection:[0,0,1]};
  return {revision:RubikAssistantDomainTools.revision(p),section:FloorPlanPresentationSection.derive(p,opts),sectionOptions:opts,
   elevation:FloorPlanPresentationElevation.derive({levels:[{project:p,levelId:null,offset:{x:0,y:0},elevationMm:0}],northOffsetDeg:p.site?.northOffsetDeg}),
   rooms:p.rooms.map(r=>({id:r.id,name:r.name})),defaults:p.defaults||null};});
 await b.close();
 if(r.revision!==S.project.revision){console.error(`La revisión del producto (${r.revision}) no es la del snapshot (${S.project.revision}): no se escriben derivados.`);process.exit(2);}
 const prov={producto:head,proyecto:S.project.id,revision:r.revision,generado:'derivado por el producto en el navegador (sin red)',nota:'Descriptores de tiempo de ejecución de la Presentación 3D; el producto no los guarda. El laboratorio solo los dibuja.'};
 const d=path.join(LAB,'snapshot/derivados');fs.mkdirSync(d,{recursive:true});
 fs.writeFileSync(path.join(d,'ft3d3-seccion.json'),JSON.stringify({schema:'rubik-lab-derivado/1',funcion:'FloorPlanPresentationSection.derive',opciones:r.sectionOptions,...prov,rooms:r.rooms,defaults:r.defaults,resultado:r.section},null,1));
 fs.writeFileSync(path.join(d,'ft3d4-fachadas.json'),JSON.stringify({schema:'rubik-lab-derivado/1',funcion:'FloorPlanPresentationElevation.derive',...prov,resultado:r.elevation},null,1));
 console.log(JSON.stringify({seccion:{supported:r.section.supported,axis:r.section.axis,muros:r.section.intersections?.walls?.length,estancias:r.section.intersections?.rooms?.length,motivo:r.section.reason},
  fachadas:{supported:r.elevation.supported,partial:r.elevation.partial,candidatas:r.elevation.candidates?.length,defaultId:r.elevation.defaultId,unoriented:r.elevation.unoriented?.length,cardinales:r.elevation.northOffsetDeg!=null}},null,1));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
