const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
test('real Git inventory resolves indirect/extensionless imports, docs consumers, browser roots and unknown owners',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'rubik-ci-inventory-'));
 const write=(p,v)=>{fs.mkdirSync(path.dirname(path.join(dir,p)),{recursive:true});fs.writeFileSync(path.join(dir,p),v);};
 try{write('.github/workflows/a.yml','name: A\non:\n  pull_request:\n  workflow_dispatch:\njobs:\n  t:\n    runs-on: ubuntu-latest\n    steps:\n      - run: node --test tests/a.test.cjs tests/browser.test.cjs\n');
 write('tests/a.test.cjs',"require('../js/adapter'); const fs=require('fs');fs.readFileSync('docs/'+name);");
 write('tests/browser.test.cjs',"require('playwright');");write('tests/unowned.test.cjs','');
 write('js/adapter.js',"require('./leaf');");write('js/leaf.js','');write('docs/product/note.md','note');write('css/main.css','');
 const git=(...a)=>cp.execFileSync('git',a,{cwd:dir,stdio:'pipe'});git('init');git('add','.');git('-c','user.name=CI','-c','user.email=ci@example.invalid','commit','-m','fixture');
 const j=JSON.parse(cp.execFileSync('python',[path.join(__dirname,'inventory.py'),'HEAD'],{cwd:dir,encoding:'utf8'}));
 assert.ok(j.dependencies['tests/a.test.cjs'].includes('js/adapter.js'));assert.ok(j.dependencies['js/adapter.js'].includes('js/leaf.js'));
 assert.ok(j.dependencies['tests/a.test.cjs'].includes('docs/product/note.md'));assert.ok(j.uncertainFiles.includes('tests/a.test.cjs'));
 assert.ok(j.dependencies['tests/browser.test.cjs'].includes('css/main.css'));assert.deepEqual(j.unresolvedOwnership,['tests/unowned.test.cjs']);
 }finally{assert.ok(path.resolve(dir).startsWith(path.resolve(os.tmpdir())+path.sep));fs.rmSync(dir,{recursive:true,force:true});}
});
