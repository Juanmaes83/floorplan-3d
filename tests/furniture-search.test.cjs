const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),crypto=require('node:crypto');
const S=require('../js/furniture-search.js'),G=require('../js/generic-catalog.js'),A=require('../js/asset-catalog.js');
const text=fs.readFileSync('index.html','utf8'),labels=vm.runInNewContext('('+text.match(/const NAMES_ES = (\{[\s\S]*?\n\});/)[1]+')'),label=s=>labels[s]||s;
const own=fs.readFileSync('assets/f3/catalog.manifest.json'),external=JSON.parse(fs.readFileSync('assets/f3/external.manifest.json'));
const accepted=[...A.adapt(JSON.parse(own),{catalog:'rubik-sota-local',revision:crypto.createHash('sha256').update(own).digest('hex').slice(0,40)}).entries,...A.adapt(external.source,{catalog:'immersphere-asset-lab',revision:external.catalogRevision,evidence:external.evidence}).entries];
const rows=S.build(G.groups,accepted,label);
test('search derives unique entries and dimensions without duplicating catalog',()=>{
 assert.equal(rows.length,63);assert.equal(new Set(rows.map(r=>r.id)).size,63);
 for(const r of rows){assert.ok(r.terms.trim());assert.ok(S.families[r.family]);if(r.kind==='generic')assert.equal(r.item,G.groups[Number(r.room)].items[Number(r.id.split(':')[1])]);else assert.equal(r.dimensions,r.entry.dimensionsMm);}
 for(const [type,[family,terms]]of Object.entries(S.specs)){assert.ok(S.families[family]);assert.ok(terms.trim());assert.ok(rows.some(r=>r.type===type));}
 assert.throws(()=>S.build([...G.groups,{cat:'bad',items:[['unknown','unknown',1,1,'#fff',1]]}],[],label),/ambiguous/);
 assert.throws(()=>S.build(G.groups,[accepted[0],accepted[0]],label),/Duplicate/);
 const unknown={...accepted[0],id:'unknown'};assert.equal(S.build(G.groups,[unknown],label).length,60);
});
test('exact partial accent case redundant spaces synonym and stored type search',()=>{
 assert.ok(S.filter(rows,{query:'Cama doble 1,8 m'}).some(r=>r.id==='0:0'));
 assert.ok(S.filter(rows,{query:'cama'}).length>1);
 assert.deepEqual(S.filter(rows,{query:'  SOFÁ  '}).map(r=>r.id),S.filter(rows,{query:'sofa'}).map(r=>r.id));
 assert.deepEqual(S.filter(rows,{query:'mesa   de CENTRO'}).map(r=>r.id),S.filter(rows,{query:'mesa de centro'}).map(r=>r.id));
 assert.ok(S.filter(rows,{query:'nevera'}).some(r=>r.type==='fridge'));assert.ok(S.filter(rows,{query:'floorlamp'}).every(r=>r.type==='floorlamp'));
});
test('combined query room family reset and empty preserve separation',()=>{
 const result=S.filter(rows,{query:'silla',room:'2',family:'asientos'});assert.equal(result.length,1);assert.equal(result[0].id,'2:3');
 assert.equal(S.filter(rows,{query:'zzzz'}).length,0);assert.equal(S.filter(rows,{}).length,63);
 assert.equal(S.filter(rows,{query:'songesand'})[0].kind,'asset');assert.equal(S.filter(rows,{query:'cama'})[0].kind,'generic');
 assert.equal(S.build(G.groups,[],label).length,60);
});
