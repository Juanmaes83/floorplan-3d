const {test} = require('node:test');
const assert = require('node:assert/strict');
const {plan, fingerprint} = require('./impact-plan.cjs');

function fixture(changes, overrides = {}) {
 return {changes, baseSha:'a'.repeat(40), headSha:'b'.repeat(40),
  tests:['tests/a.test.cjs','tests/b.test.cjs','tests/other.test.cjs'],
  dependencies:{'tests/a.test.cjs':['js/leaf.js'],'tests/b.test.cjs':['js/adapter.js'],
   'js/adapter.js':['js/leaf.js'],'js/leaf.js':[],
   'tests/other.test.cjs':['js/other.js'],'js/other.js':[]},
  ownership:{'tests/a.test.cjs':['a.yml'],'tests/b.test.cjs':['b.yml'],
   'tests/other.test.cjs':['other.yml']},
  contents:{'tests/a.test.cjs':'a','tests/b.test.cjs':'b','tests/other.test.cjs':'other',
   'js/leaf.js':'leaf','js/adapter.js':'adapter','js/other.js':'unrelated'},
  informationalDocuments:['docs/product/status.md','docs/notes.md'],
  environment:{node:'22.13.0',playwright:'1.62.1'}, ...overrides};
}

test('ordinary documentation requires fast checks and labels every functional test as not required',()=>{
 const p=plan(fixture(['docs/product/status.md']));
 assert.equal(p.level,1);assert.deepEqual(p.tests,[]);assert.equal(p.notRequired.length,3);
 assert.ok(p.evidenceStatus.includes('no current test execution claimed'));
});
test('direct and indirect consumers are selected together',()=>{
 const p=plan(fixture(['js/leaf.js']));
 assert.equal(p.level,2);assert.deepEqual(p.tests,['tests/a.test.cjs','tests/b.test.cjs']);
 assert.deepEqual(p.workflows,['a.yml','b.yml']);
 assert.equal(p.notRequired[0].test,'tests/other.test.cjs');
});
test('documentation consumed by a test cannot bypass that dependency',()=>{
 const f=fixture(['docs/product/status.md']);
 f.dependencies['docs/product/status.md']=[];
 f.dependencies['tests/a.test.cjs'].push('docs/product/status.md');
 const p=plan(f);assert.equal(p.level,2);assert.deepEqual(p.tests,['tests/a.test.cjs']);
});
test('unknown documentation is conservative despite its extension and path',()=>{
 assert.equal(plan(fixture(['docs/product/new-contract.md'])).level,3);
});
test('shared dependencies reach every consumer and are never treated as a leaf-only change',()=>{
 const f=fixture(['js/shared.js']);
 f.dependencies['js/shared.js']=[];
 f.dependencies['js/leaf.js']=['js/shared.js'];f.dependencies['js/other.js']=['js/shared.js'];
 assert.equal(plan(f).tests.length,3);
});
test('deleted and renamed dependencies use the union of old and current graphs',()=>{
 const f=fixture(['js/old.js','js/leaf.js'],{previousDependencies:{'tests/other.test.cjs':['js/old.js'],'js/old.js':[]}});
 assert.equal(plan(f).tests.length,3);
});
for(const file of ['api/publications.js','index.html','vendor/three/build/three.module.js',
 '.github/workflows/project-first.yml','docs/contracts/project.md','docs/security/publications.md',
 'tests/helpers/render-budget.cjs']) {
 test('full regression for shared or security authority '+file,()=>assert.equal(plan(fixture([file])).level,3));
}
test('a fundamental domain authority forces full validation',()=>{
 assert.equal(plan(fixture(['js/leaf.js'],{criticalFiles:['js/leaf.js']})).level,3);
});
test('unknown changed files force full regression',()=>assert.equal(plan(fixture(['js/new.js'])).level,3));
test('dynamic dependencies in an affected closure force full regression',()=>{
 assert.equal(plan(fixture(['js/leaf.js'],{uncertainFiles:['js/adapter.js']})).level,3);
});
test('missing ownership cannot silently omit a selected test',()=>{
 assert.equal(plan(fixture(['js/leaf.js'],{ownership:{}})).level,3);
});
test('missing content hashes cannot certify an unexecuted closure',()=>{
 assert.equal(plan(fixture(['js/leaf.js'],{contents:{}})).level,3);
});
test('environment changes invalidate evidence fingerprints',()=>{
 assert.notEqual(fingerprint(['a'],{a:'content'},{node:22}),fingerprint(['a'],{a:'content'},{node:24}));
});
test('changed dependency bytes invalidate evidence fingerprints',()=>{
 assert.notEqual(fingerprint(['a'],{a:'old'},{}),fingerprint(['a'],{a:'new'},{}));
});
test('periodic full validation overrides documentation selection',()=>{
 assert.equal(plan(fixture(['docs/notes.md'],{forceFull:true})).level,3);
});
test('invalid source identity and path traversal fail conservatively',()=>{
 assert.equal(plan(fixture(['js/leaf.js'],{baseSha:'unknown'})).level,3);
 assert.equal(plan(fixture(['../secret'])).level,3);
});
