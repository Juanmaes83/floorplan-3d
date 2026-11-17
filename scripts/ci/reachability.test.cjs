const test=require('node:test'),assert=require('node:assert/strict'),{plan}=require('./impact-plan.cjs');
test('reverse impact agrees with an independent recursive oracle on cyclic base/candidate graphs',()=>{
 for(let seed=1;seed<=50;seed++){
  let n=seed;const rnd=()=>((n=(n*1664525+1013904223)>>>0)/2**32);
  const tests=['tests/a.test.cjs','tests/b.test.cjs','tests/c.test.cjs'],files=[...tests,...Array.from({length:8},(_,i)=>'modules/m'+i+'.js')],base={},head={},contents={},ownership={};
  for(const f of files){base[f]=files.filter(()=>rnd()<.12);head[f]=files.filter(()=>rnd()<.12);contents[f]='source';}for(const t of tests)ownership[t]=[t+'.yml'];
  const changed=[files[Math.floor(rnd()*files.length)]];
  function reaches(f,seen=new Set()){if(changed.includes(f))return true;if(seen.has(f))return false;seen.add(f);return [...base[f],...head[f]].some(d=>reaches(d,seen));}
  const expected=tests.filter(t=>reaches(t));
  const result=plan({changes:changed,baseSha:'a'.repeat(40),headSha:'b'.repeat(40),tests,dependencies:head,previousDependencies:base,ownership,contents,environment:{}});
  assert.deepEqual(result.tests,expected.length?expected:tests,'seed '+seed);
 }
});
