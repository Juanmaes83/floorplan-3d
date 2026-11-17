'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {createHash} = require('node:crypto');
const {execFileSync} = require('node:child_process');

const pin = '8525025a1470d48d52d8e365070e5a0acf116134';
const repo = path.resolve(process.argv[2]);
const output = path.resolve(process.argv[3]);
const lab = path.resolve(__dirname,'..');
const work = fs.mkdtempSync(path.join(os.tmpdir(),'rubik-economic-'));
const provisional = path.join(work,'product');
fs.mkdirSync(provisional);
const archive=path.join(work,'product.tar');
const git=(...args)=>execFileSync('git',['-C',repo,...args],{maxBuffer:64*1024*1024});
git('archive','--format=tar','-o',archive,pin,'js','labs/ux07-ent04/fixtures.js');
execFileSync('tar',['-xf',archive,'-C',provisional]);
const read = p => fs.readFileSync(p);
const sha = bytes => createHash('sha256').update(bytes).digest('hex');
const econ = require(path.join(provisional,'js/revision-budget-core.js'));
const compare = require(path.join(provisional,'js/revision-compare-core.js'));
const fixtures = require(path.join(provisional,'labs/ux07-ent04/fixtures.js'));
const sourceFiles = Object.keys(require.cache).filter(p=>p.startsWith(provisional+path.sep)).sort()
 .map(p=>{
  const rel=path.relative(provisional,p).split(path.sep).join('/');
  const bytes=read(p);
  assert.equal(sha(bytes),sha(git('show',pin+':'+rel)));
  return {archivo:rel,sha256:sha(bytes),gitBlob:git('rev-parse',pin+':'+rel).toString().trim()};
 });
const before=fixtures.before(),after=fixtures.after();
const comparison=compare.compare(before,after,{relation:'same-project',beforeLabel:'Original',afterLabel:'Reforma'});
const B=fixtures.budget('complete',before),A=fixtures.budget('complete',after);
const s=JSON.parse(read(path.join(lab,'snapshot/snapshot.json')));
const result={schema:'rubik-lab-economia-qa/1',producto:pin,fuentes:sourceFiles,
 licencia:'No consta licencia en el repositorio de origen; se verifica y usa localmente el pin de producto.',
 casos:[]};
const amounts=text=>[...text.matchAll(/(-?\d[\d.]*,\d\d)\s*€/g)]
 .map(match=>Number(match[1].replaceAll('.','').replace(',','.'))).sort((a,b)=>a-b);
const cases=[
 ['complete','complete',B,A],['partial','partial',B,fixtures.budget('partial',after)],
 ['incoherent','incoherent',B,B],['before','one-sided',B,null],
 ['after','one-sided',null,A],['none','none',null,null]
];
for(const [id,status,beforeBudget,afterBudget] of cases){
 const canonical=econ.compareBudgets({comparison,beforeProject:before,afterProject:after,beforeBudget,afterBudget});
 assert.equal(canonical.status,status,id);
 const folder=path.join(work,id);
 fs.mkdirSync(folder);fs.mkdirSync(path.join(folder,'inputs'));
 const s0={...s,variant:'fixture-economia-'+id,brand:{...s.brand,title:'Fixture de laboratorio económica'},
  project:{...s.project,id:comparison.after.projectId,name:comparison.after.name,revision:null},
  views:[],budget:null,economiaComparada:canonical};
 fs.writeFileSync(path.join(folder,'inputs/snapshot.json'),JSON.stringify(s0));
 const expected=[];
 if(status==='complete'||status==='one-sided') {
  for(const a of [canonical.before,canonical.after])if(a?.matchesRevision)expected.push(a.net,a.tax,a.gross);
  if(status==='complete')expected.push(canonical.totals.gross.delta);
 }
 if(status==='partial')expected.push(canonical.totals.knownNet.before,canonical.totals.knownNet.after,canonical.totals.comparable.grossDelta);
 const documents=[];
 for(const doc of ['commercial-proposal-client-v3','real-estate-sheet-v3']){
  const dest=path.join(folder,doc);
  execFileSync(process.execPath,[path.join(lab,'tools/compose.cjs'),path.join(folder,'inputs'),dest],{
   env:{...process.env,STUDIO_FIXTURE_DOC:doc},maxBuffer:16*1024*1024
  });
  const pdf=path.join(dest,doc+'.pdf');
  const html=read(path.join(dest,doc+'.html'));
  const text=execFileSync('pdftotext',['-layout',pdf,'-'],{encoding:'utf8'});
  for(const phrase of ['Datos sintéticos','Honorarios: no aportados','Compra del inmueble','Impuestos de compra'])assert(text.includes(phrase),phrase);
  const amountsExpected=expected.filter(Number.isFinite).sort((a,b)=>a-b);
  assert.deepEqual(amounts(html.toString('utf8')),amountsExpected,id+': importes HTML');
  assert.deepEqual(amounts(text),amountsExpected,id+': importes PDF');
  if(!expected.length)assert(!text.includes('€'),id);
  if(id==='partial')assert(text.replace(/\s+/g,' ').includes('No es la diferencia de coste total.'));
  if(id==='before'||id==='after')assert(!text.includes('Diferencia con IVA'));
  const docQa=JSON.parse(read(path.join(dest,'qa.json'))).docs[doc];
  assert.equal(docQa.overflowCount+docQa.textOverlapCount+docQa.spillCount+docQa.svgClipCount,0,id);
  assert.deepEqual(docQa.lint.red,[]);
  documents.push({archivo:doc+'.pdf',sha256:sha(read(pdf)),htmlSha256:sha(html),paginas:docQa.pages});
 }
 result.casos.push({id,status,importeVerificado:expected,documentos:documents});
 console.log('PASS',id,'propuesta e inmobiliaria');
}
fs.mkdirSync(path.dirname(output),{recursive:true});
fs.writeFileSync(output,JSON.stringify(result,null,2)+'\n');
