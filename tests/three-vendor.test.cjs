const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
test('offline Three runtime is the pinned 0.160.0 dependency closure with intact bytes and license',()=>{
 const root=path.resolve(__dirname,'../vendor/three'),manifest=require('../vendor/three/manifest.json');assert.equal(manifest.version,'0.160.0');assert.equal(Object.keys(manifest.files).length,10);
 for(const [file,sha]of Object.entries(manifest.files)){const resolved=path.resolve(root,file);assert.ok(resolved.startsWith(root+path.sep));const bytes=fs.readFileSync(resolved);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),sha,file);}
 const core=fs.readFileSync(path.join(root,'build/three.module.js'),'utf8');assert.match(core,/const REVISION = '160'/);assert.match(fs.readFileSync(path.join(root,'LICENSE'),'utf8'),/MIT License/);
 const index=fs.readFileSync(path.resolve(__dirname,'../index.html'),'utf8'),map=JSON.parse(index.match(/<script type="importmap">\s*([\s\S]*?)<\/script>/)[1]);assert.equal(map.imports.three,'./vendor/three/build/three.module.js');assert.equal(map.imports['three/addons/'],'./vendor/three/examples/jsm/');
});
