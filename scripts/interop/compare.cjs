'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),E=require('./export.cjs');
const [a,b,report]=process.argv.slice(2);
if(!a||!b||!report)throw Error('Usage: node scripts/interop/compare.cjs package-a package-b NEW-report.json');
if(fs.existsSync(report))throw Error('Refusing report overwrite');
const rows=[];for(const name of ['source-project.json','scene.glb','semantic.json','package.json']){const x=fs.readFileSync(path.join(a,name)),y=fs.readFileSync(path.join(b,name));assert.deepEqual(x,y,name+' binary determinism');rows.push({path:name,bytes:x.length,sha256:E.sha(x),binaryEqual:true});}
assert.equal(E.canonical(JSON.parse(fs.readFileSync(path.join(a,'semantic.json')))),E.canonical(JSON.parse(fs.readFileSync(path.join(b,'semantic.json')))),'semantic equality');
fs.writeFileSync(report,JSON.stringify({status:'PASS',binary:'byte-for-byte all four package files',semantic:'all fields after canonical JSON, including entities/transforms/dimensions/materials/references/losses',files:rows,blendComparison:'Not included: Blender is an inspected downstream scene, not a deterministic serialized package'},null,2)+'\n',{flag:'wx'});console.log('PASS: binary and semantic repeat-export equality');
