// Build the curated Rubik catalog from reviewed pipeline results. Existing pilot records stay intact.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const repo=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const read=p=>JSON.parse(fs.readFileSync(path.join(repo,p),'utf8'));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(repo,p))).digest('hex');
const nextCohort=process.argv[2]==='--next';
const result=read(nextCohort?'docs/technical/F3-pipeline-next-results.json':'docs/technical/F3-pipeline-results.json');
const inventory=read('docs/technical/F3-pipeline-inventory.json');
const dest='assets/f3/external.manifest.json',catalog=read(dest);
const permissionPath=nextCohort?'assets/f3/ASSET-LAB-NEXT-PROVENANCE.txt':'assets/f3/ASSET-LAB-PIPELINE-PROVENANCE.txt',permissionSha256=hash(permissionPath);
const initialChoices={
 'ikea-solvinden-solar-floor-lamp-outdoor-beige':['IKEA SOLVINDEN · lámpara de pie solar','floorlamp',1],
 'ikea-brimnes-estructura-de-cama-con-almacenaje-blancoluroy-demo':['IKEA BRIMNES · cama con almacenaje','bed',0],
 'ikea-malm-comoda-6-cajones-blanco-demo':['IKEA MALM · cómoda de seis cajones','dresser',0],
 'ikea-lisabo-mesa-chapa-fresno-demo':['IKEA LISABO · mesa de fresno','table',2],
 'ikea-lisabo-silla-negrotallmyra-negro-gris-demo':['IKEA LISABO · silla negro y gris','chair',2],
 'ikea-nammaro-garden-table-light-brown':['IKEA NÄMMARÖ · mesa de jardín','table',5],
 'ikea-frotorp-coffee-table-white-chrome-white-glass-demo':['IKEA FRÖTORP · mesa de centro','coffeetable',1],
 'ikea-morum-indoor-outdoor-rug-beige':['IKEA MORUM · alfombra beige','rug',1],
 'ikea-hemnes-tv-unit-white-light-brown-stain-demo':['IKEA HEMNES · mueble de TV','tvstand',1],
 'ikea-lauters-floor-lamp-brown-ash-demo':['IKEA LAUTERS · lámpara de pie','floorlamp',1],
 'ikea-vasman-armchair-outdoor-brown':['IKEA VÄSMAN · sillón exterior','armchair',1],
 'ikea-nammaro-2-seat-outdoor-sofa-light-brown-beige-grey':['IKEA NÄMMARÖ · sofá exterior de dos plazas','sofa',1]
};
const nextChoices={
 'ikea-glostad-2-seat-sofa-knisa-dark-grey-demo':['IKEA GLOSTAD · sofá de dos plazas gris oscuro','sofa',1],
 'ikea-strandmon-wing-chair-tommaboda-deep-beige-demo':['IKEA STRANDMON · sillón orejero beige','armchair',1],
 'ikea-skogsta-mesa-acacia-demo':['IKEA SKOGSTA · mesa de acacia','table',2],
 'ikea-knoxhult-armario-bajo-con-puertas-y-cajon-blanco-demo':['IKEA KNOXHULT · armario bajo blanco','cabinet',2],
 'ikea-stockholm-2025-aparador-chapa-roble-demo':['IKEA STOCKHOLM 2025 · aparador de roble','cabinet',1],
 'ikea-nordli-comoda-de-5-cajones-blanco-demo':['IKEA NORDLI · cómoda blanca de cinco cajones','dresser',0]
};
const choices=nextCohort?nextChoices:initialChoices;
if(result.revision!==catalog.catalogRevision||result.outputs.length!==Object.keys(choices).length)throw Error('Review cohort or source revision changed');
for(const o of result.outputs){const [name,type,room]=choices[o.id]||[];if(!name)throw Error('Unexpected model '+o.id);if(nextCohort&&catalog.source.some(x=>x.id===o.id)&&catalog.evidence[o.id]?.modelSha256!==o.outputSha256)throw Error('Existing model has different hash '+o.id);if(hash(o.outputPath)!==o.outputSha256)throw Error('Model changed '+o.id);
 const original=inventory.rows.find(x=>x.id===o.id);if(inventory.revision!==result.revision||!original?.exists||original.modelPath!==o.sourcePath||original.sha256!==o.sourceSha256||original.licenseType!=='authorized-commercial-demo'||original.redistributionAllowed!==false||original.qaStatus!=='pending'||original.permissionDocumentRef!=='permissions/README.md')throw Error('Source evidence changed or incomplete: '+o.id);
 const item={id:o.id,brand:'IKEA',productName:name,category:type,room,modelPath:o.outputPath,format:'glb',dimensions:{...o.modelDimensionsMm,unit:'mm'},qaStatus:'approved',permissionDocumentRef:permissionPath};
 const evidence={modelSha256:o.outputSha256,bytes:o.outputBytes,permissionSha256,source:{repository:'Juanmaes83/immersphere-asset-lab',revision:result.revision,path:o.sourcePath,sha256:o.sourceSha256,sourceMethod:'Asset Lab manifest and tracked GLB',redistributionAllowed:false,permissionDocumentRef:'permissions/README.md',qaStatus:'pending'},permission:{authorizationKind:'owner-confirmed-project-use',authorizedBy:'Juanma',project:'Juanmaes83/floorplan-3d',scope:'local-app-git-and-review-preview',brand:'third-party-identification-no-affiliation',attribution:`IKEA — ${name}; Asset Lab. Uso autorizado por Juanma para Rubik Sota; sin afiliación.`,expires:null},dimensionsSource:'Normalized GLB geometry bounds only; physical product scale not independently verified',dimensionsKind:'model-geometry',normalization:{unitToMeter:1,rotationDeg:[0,0,0],provenance:'glTF metre coordinates, original scene node transforms retained; X width, Y height, Z depth; no scaling correction.'},extensionsRequired:[],pipeline:{tool:'glTF Transform',version:'4.3.0',inputSha256:o.sourceSha256,outputSha256:o.outputSha256,steps:result.steps,geometryBoundsMm:o.modelDimensionsMm}};
 const i=catalog.source.findIndex(x=>x.id===o.id);if(i>=0)catalog.source[i]=item;else catalog.source.push(item);catalog.evidence[o.id]=evidence;
}
fs.writeFileSync(path.join(repo,dest),JSON.stringify(catalog,null,2)+'\n');
console.log('Integrated',result.outputs.length,'new models; total',catalog.source.length);
