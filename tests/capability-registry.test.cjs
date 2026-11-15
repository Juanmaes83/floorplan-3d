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

// HOM-03 · «Nuevos servicios IA»: four states verified on code, tests and effective configuration. A service is only
// «available» with Production evidence; a simulation says so; the assistant never passes for a language model; work
// that is not approved (CAT-04) stays behind its gate and is never returned to the Home.
test('AI services: valid state, existing modules and tests, verification SHA and es/en/zh texts',()=>{
 const ids=new Set();
 assert.deepEqual([...R.AI_GROUPS],['available','pilot','simulation','preparation']);
 for(const s of R.AI_SERVICES){
  assert.ok(!ids.has(s.id),'unique '+s.id);ids.add(s.id);
  assert.ok(R.AI_GROUPS.includes(s.state),s.id+' state');assert.match(s.verifiedAt,/^[0-9a-f]{40}$/);
  assert.ok(s.modules.length&&s.tests.length,s.id+' modules and tests');
  for(const f of [...s.modules,...s.tests])assert.ok(fs.existsSync(path.join(root,f)),`${s.id}: ${f} exists`);
  for(const t of [s.name,s.what,s.isNot,s.limits])assert.equal(t.length,3,s.id+' es/en/zh');
  assert.ok(s.professions.length,s.id+' professions');
 }
});

test('AI services: «available» needs Production evidence; pilots and simulations open a real place; preparation has no access',()=>{
 for(const s of R.AI_SERVICES){
  if(s.state==='available'){assert.match(s.production.deployment,/^dpl_\w+$/,s.id);assert.match(s.production.sha,/^[0-9a-f]{40}$/,s.id);assert.match(s.production.checkedAt,/^\d{4}-\d{2}-\d{2}$/,s.id);assert.ok(s.production.check.length>10,s.id);}
  else assert.equal(s.production,null,s.id+' claims no Production evidence');
  if(s.state==='preparation')assert.equal(s.access,null,s.id+' no access while in preparation');
  else assert.match(s.access,/^(render-band|assistant|catalogs|visual-studio|photo-reform)$/,s.id+' existing entry');
 }
 assert.deepEqual(R.AI_SERVICES.filter(s=>s.state==='available').map(s=>s.id),['render-ai'],'only Render IA is active in Production');
});

test('AI services: no simulation passes for real generation, and the assistant never passes for a language model',()=>{
 for(const s of R.AI_SERVICES.filter(s=>s.state==='simulation')){assert.match(s.isNot[0],/^Simulación/);assert.match(s.isNot[1],/^Simulation/);assert.match(s.isNot[0],/no /);}
 const a=R.AI_SERVICES.find(s=>s.id==='assistant');assert.equal(a.state,'pilot');assert.match(a.isNot[0],/ningún modelo de lenguaje/);assert.match(a.isNot[1],/no language model/);
 const text=JSON.stringify(R.AI_SERVICES).toLowerCase();
 for(const banned of ['garantiza','en tiempo real','exclusiv','certificad','gpt','openai'])assert.ok(!text.includes(banned),banned);
});

test('AI services: CAT-04 stays behind its gate, groups keep their order and the profession only reorders within a group',()=>{
 const gated=R.AI_SERVICES.filter(s=>s.gate);assert.deepEqual(gated.map(s=>s.gate),['CAT-04','CAT-04']);
 for(const p of [...PROFESSIONS,'general',undefined,'unknown']){
  const list=R.aiServices(p);assert.ok(!list.some(s=>s.gate),'gated never returned');
  assert.equal(list.length,R.AI_SERVICES.length-gated.length);
  const order=list.map(s=>R.AI_GROUPS.indexOf(s.state));assert.deepEqual(order,[...order].sort((a,b)=>a-b),'grouped by state');}
 const ren=R.aiServices('renovation').filter(s=>s.state==='simulation').map(s=>s.id);assert.deepEqual(ren,['visual-studio','photo-reform']);
 const cons=R.aiServices('construction').filter(s=>s.state==='pilot').map(s=>s.id);assert.equal(cons[0],'assistant','relevant first');
});
