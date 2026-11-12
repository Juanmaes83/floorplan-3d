'use strict';
/* OBR-01 · genera review-obr01/obra.js: los datos SINTÉTICOS de la Preview de revisión (los mismos de las pruebas),
   para que la Evolución se pueda abrir en la Preview sin publicar labs/. Uso: node tests/obr01/build-review-fixture.cjs */
const fs=require('node:fs'),path=require('node:path');
const FX=require('./obra-fixture.cjs'),TERR=require('../fixtures/territorial-integration.cjs');
(async()=>{
  const vivienda=await FX.build();
  const T=TERR.build();
  const edificio=await FX.build({building:T.building,entryId:'ent_obr01-territorio',tasks:[{id:'T01',wbs:'01',titulo:'Muros',inicio:'2027-03-01',fin:'2027-03-20',deps:[],elementos:{tipo:'wall',rol:'build',n:6}}]});
  const cases={
    vivienda:{title:'Vivienda del examen FT3D-8 (EX-05.3 y movimiento reducido)',storage:vivienda.storage,url:vivienda.url},
    territorio:{title:'Edificio con ortofoto PNOA y terreno MDT05 solo como metadatos (EX-09.10)',storage:edificio.storage,url:edificio.url},
  };
  const out=path.join(__dirname,'..','..','review-obr01','obra.js');
  fs.writeFileSync(out,'/* GENERADO por tests/obr01/build-review-fixture.cjs — datos SINTÉTICOS de prueba, no de clientes. */\nwindow.OBR01_REVIEW='+JSON.stringify({generated:'2026-11-12',cases})+';\n');
  console.log(out,fs.statSync(out).size,'bytes');
})().catch(e=>{console.error(e);process.exit(1);});
