'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const {createHash} = require('node:crypto');
const {objectRows} = require('./ffe.cjs');

const lab = path.resolve(__dirname, '..');
const source = JSON.parse(fs.readFileSync(path.join(lab, 'snapshot/snapshot.json')));
const doc = 'materials-furniture-book-v3';
const destination = path.resolve(process.argv[2] || path.join(lab, 'evidence/ffe/ffe-qa.json'));
const work = fs.mkdtempSync(path.join(os.tmpdir(), 'rubik-ffe-'));
const inventory = snapshot => objectRows(snapshot, String);
const result = {casos: [], paginas: []};
const test = (id, check) => {
 check();
 result.casos.push(id);
 console.log('PASS', id);
};
function fixture(n) {
 const s = structuredClone(source);
 s.variant = 'fixture-ffe-' + n;
 s.project.objects = n;
 s.brand.title = 'Fixture de laboratorio FF&E · ' + n;
 s.views = [];
 s.budget = null;
 const original = source.objects[0], geo = source.geometry.objects[0];
 s.objects = Array.from({length:n}, (_, i) => {
  const index = String(i + 1).padStart(3, '0');
  return {...original, id:'fixture-object-'+index, name:'Fixture FF&E '+index};
 });
 s.geometry.objects = s.objects.map(o => ({...geo, id:o.id}));
 return s;
}
test('46 instancias en 40 fichas', () => {
 const rows = inventory(source);
 assert.equal(rows.length, 40);
 assert.deepEqual(rows.flatMap(r => r.instanceIds).sort(), source.objects.map(o => o.id).sort());
 assert.equal(rows.reduce((sum,r) => sum + r.qty, 0), 46);
 assert(rows.every(r => r.authority === 'generic' && r.price === null && r.installed === null));
 const reversed = {...source, objects:[...source.objects].reverse()};
 assert.deepEqual(inventory(reversed), rows);
});
test('SKU coincidente con distinto acabado o variante conserva fichas separadas', () => {
 const s=fixture(3);
 for(const o of s.objects) Object.assign(o,{name:'Fixture FF&E',catalogRef:{sku:'PRUEBA',productId:'demo',variantId:'a'}});
 s.objects[1].materialId='acabado-fixture';
 s.objects[2].catalogRef.variantId='b';
 assert.equal(inventory(s).length,3);
 assert(inventory(s).every(r=>r.authority==='reference'&&r.price===null&&r.qty===1));
});
for(const [id, edit] of [
 ['cantidad cero',s=>{s.objects[0].quantity=0;}],
 ['proyecto ajeno',s=>{s.objects[0].projectId='otro-proyecto';}],
 ['revisión ajena',s=>{s.objects[0].revision='otra-revision';}],
 ['ID repetido',s=>{s.objects[1].id=s.objects[0].id;}]
])test(id,()=>{const s=fixture(2);edit(s);assert.throws(()=>inventory(s),/FF&E:/);});

function verifyPdf(pdf, qa, rows, firstPage) {
 const pdfText = execFileSync('pdftotext',['-f',String(firstPage),'-tsv',pdf,'-'],{encoding:'utf8',maxBuffer:32*1024*1024});
 const found = pdfText.split('\n').map(line=>line.split('\t'))
  .filter(fields=>fields[0]==='5'&&Number(fields[6])>180&&/^M-\d+$/.test(fields[11]))
  .map(fields=>fields[11]);
 assert.deepEqual(found.sort(), rows.map(r=>r.tag).sort());
 assert.equal(qa.overflowCount+qa.textOverlapCount+qa.spillCount+qa.svgClipCount,0);
 assert.deepEqual(qa.lint.red,[]);
 return {paginas:qa.pages,fichas:found.length,sha256:createHash('sha256').update(fs.readFileSync(pdf)).digest('hex')};
}
for(const n of [1,50,200,500])test(`PDF con ${n} fichas`,()=>{
 const s=fixture(n),dir=path.join(work,String(n)),out=path.join(dir,'out');
 fs.mkdirSync(dir);
 fs.writeFileSync(path.join(dir,'snapshot.json'),JSON.stringify(s));
 const rows=inventory(s);
 execFileSync(process.execPath,[path.join(__dirname,'compose.cjs'),dir,out],{
  env:{...process.env,STUDIO_FIXTURE_DOC:doc}, maxBuffer:16*1024*1024
 });
 const qa=JSON.parse(fs.readFileSync(path.join(out,'qa.json')));
 assert.equal(qa.meta[doc].instancias,n);
 result.paginas.push({fixture:n,...verifyPdf(path.join(out,doc+'.pdf'),qa.docs[doc],rows,3)});
});
if(process.argv[3]){
 const out=path.resolve(process.argv[3]),qa=JSON.parse(fs.readFileSync(path.join(out,'qa.json')));
 for(const suffix of ['', '.en'])test('PDF canónico '+(suffix||'ES'),()=>{
  const name=doc+suffix;
  result.paginas.push({candidato:suffix?'en':'es',...verifyPdf(path.join(out,name+'.pdf'),qa.docs[name],inventory(source),3)});
 });
}
fs.mkdirSync(path.dirname(destination),{recursive:true});
fs.writeFileSync(destination,JSON.stringify(result,null,2)+'\n');
