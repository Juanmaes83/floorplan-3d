// Writes the synthetic two-level fixture as a building ZIP (building.json, manifest.json and both level images),
// ready to import with «Subir plano» on a phone or a GPU PC. Usage: node scripts/qa/multilevel/fixture-zip.cjs out.zip
const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..','..','..');
const B=require(path.join(root,'js/building-core.js')),P=require(path.join(root,'js/project-package.js')),T=require(path.join(root,'js/tracing-core.js')),F=require(path.join(root,'tests/fixtures/building-fixture.cjs'));
(async()=>{const out=process.argv[2];if(!out)throw Error('Usage: node scripts/qa/multilevel/fixture-zip.cjs out.zip');
 const fx=F.build(),{entries,building}=await B.packageEntries(fx.building,im=>fx.bytesFor(im.id),T.imageInfo);
 fs.writeFileSync(out,Buffer.from(await P.zip(entries,{check:B.packagePath}).arrayBuffer()));
 console.log(JSON.stringify({output:out,building:building.id,levels:building.levels.length,stairs:building.stairs.length,entries:[...entries.keys()]}));
})().catch(e=>{console.error(e.message);process.exitCode=1;});
