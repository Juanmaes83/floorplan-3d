// HOM-01 · GOV-03 (minimum): the Home can only describe capabilities that exist. Every registry entry must point to
// modules and tests that are in the repository, carry a valid state and the verification SHA, and each profession
// shows 3–4 of them. Pure: reads the file system only.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const R=require('../js/capability-registry.js'),root=path.resolve(__dirname,'..');
const PROFESSIONS=['architecture','real-estate','developer','renovation','interior','construction'];

test('every capability names existing modules and tests, a valid state and the verification SHA',()=>{
 const ids=new Set();
 for(const c of R.CAPABILITIES){
  assert.ok(!ids.has(c.id),'unique id '+c.id);ids.add(c.id);
  assert.ok(R.STATES.includes(c.state),c.id+' state');
  assert.match(c.verifiedAt,/^[0-9a-f]{40}$/);
  assert.ok(c.modules.length&&c.tests.length,c.id+' has modules and tests');
  for(const f of [...c.modules,...c.tests])assert.ok(fs.existsSync(path.join(root,f)),`${c.id}: ${f} exists`);
  assert.match(c.access,/^(upload|walk|area:(design|analyze|budget|deliver|studio))$/,c.id+' access is an existing entry point');
  for(const t of [c.name,c.benefit,...(c.limits?[c.limits]:[])])assert.equal(t.length,3,c.id+' es/en/zh');
 }
});

test('each profession and the neutral Home show 3 or 4 known capabilities',()=>{
 for(const p of [...PROFESSIONS,'general']){const list=R.forAudience(p);assert.ok(list.length>=3&&list.length<=4,p);assert.equal(new Set(list.map(c=>c.id)).size,list.length,p+' no repeats');}
 assert.deepEqual(R.forAudience('unknown').map(c=>c.id),R.ORDER.general,'unknown profession falls back to the neutral set');
});

test('Render IA is visible where it adds value and always states its limits honestly',()=>{
 const ai=R.byId('render-ai');
 assert.equal(ai.state,'available');assert.equal(ai.access,'area:deliver','reached through Deliver → project views, never a shortcut');
 for(const p of ['interior','renovation','real-estate','developer','general'])assert.ok(R.forAudience(p).some(c=>c.id==='render-ai'),p);
 assert.match(ai.limits[0],/orientativa/);assert.match(ai.limits[0],/código de acceso/);assert.match(ai.limits[0],/créditos/);assert.match(ai.limits[0],/geometría/);
});

test('no promise of capabilities that do not exist',()=>{
 const text=JSON.stringify(R.CAPABILITIES).toLowerCase();
 for(const banned of ['certificad','garantiza','automático de obra','sensor','en tiempo real','exclusiv'])
  assert.ok(!new RegExp(banned.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')).test(text.replace(/no es un estudio solar ni topográfico certificado/,'')),banned);
});
