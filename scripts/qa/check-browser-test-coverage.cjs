#!/usr/bin/env node
'use strict';
/* Fails when a tests/**\/*.browser.test.cjs is run by no CI workflow: not named in .github/workflows/*.yml and not
   listed in tests/regression-partitions.json (which consolidation-regression.yml runs). Also fails on entries of the
   manifest that no longer exist or are listed twice. `--list <group>` prints the files of one partition. */
const fs=require('node:fs'),path=require('node:path'),ROOT=path.resolve(__dirname,'..','..');
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)]);
const manifest=JSON.parse(fs.readFileSync(path.join(ROOT,'tests/regression-partitions.json'),'utf8'));
const groups={blocking:manifest.blocking,...manifest.historical};
if(process.argv[2]==='--list'){const g=groups[process.argv[3]];if(!g){console.error('unknown partition '+process.argv[3]);process.exit(2);}console.log(g.join(' '));process.exit(0);}
if(process.argv[2]==='--matrix'){console.log(JSON.stringify(Object.keys(manifest.historical)));process.exit(0);}
const tests=walk(path.join(ROOT,'tests')).filter(f=>f.endsWith('.browser.test.cjs')).map(f=>path.relative(ROOT,f).split(path.sep).join('/')).sort();
const workflows=fs.readdirSync(path.join(ROOT,'.github/workflows')).filter(f=>/\.ya?ml$/.test(f)).map(f=>fs.readFileSync(path.join(ROOT,'.github/workflows',f),'utf8')).join('\n');
const listed=Object.values(groups).flat(),problems=[];
for(const f of listed){if(!tests.includes(f))problems.push('listed but missing: '+f);if(listed.filter(x=>x===f).length>1)problems.push('listed twice: '+f);}
for(const f of Object.keys(manifest.classification||{}))if(!tests.includes(f))problems.push('classified but missing: '+f);
const uncovered=tests.filter(f=>!listed.includes(f)&&!workflows.includes(path.basename(f)));
for(const f of uncovered)problems.push('no workflow runs it: '+f+' — add it to a workflow or to tests/regression-partitions.json');
console.log(`${tests.length} browser test files · ${listed.length} in the regression manifest (${manifest.blocking.length} blocking) · ${uncovered.length} uncovered`);
if(problems.length){console.error([...new Set(problems)].join('\n'));process.exit(1);}
