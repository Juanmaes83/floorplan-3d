/* Copy the exact existing Three 0.160.0 runtime dependency closure for offline startup. No transformation. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const source=path.resolve(process.argv[2]||''),destination=path.resolve(__dirname,'../vendor/three');
const pkg=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8'));if(pkg.name!=='three'||pkg.version!=='0.160.0')throw Error('Expected official three@0.160.0 package');
const pending=['build/three.module.js','examples/jsm/controls/OrbitControls.js','examples/jsm/controls/PointerLockControls.js','examples/jsm/geometries/RoundedBoxGeometry.js','examples/jsm/environments/RoomEnvironment.js','examples/jsm/loaders/RGBELoader.js','examples/jsm/renderers/CSS2DRenderer.js','examples/jsm/loaders/GLTFLoader.js','LICENSE'],files={};
while(pending.length){const relative=pending.shift();if(files[relative])continue;const file=path.resolve(source,relative);if(!file.startsWith(source+path.sep))throw Error('Import escapes source');const bytes=fs.readFileSync(file),target=path.resolve(destination,relative);if(!target.startsWith(destination+path.sep))throw Error('Import escapes destination');fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);files[relative]=crypto.createHash('sha256').update(bytes).digest('hex');
 if(relative.endsWith('.js'))for(const match of bytes.toString('utf8').matchAll(/(?:from\s*|import\s*)['"](\.[^'"]+)['"]/g)){const resolved=path.relative(source,path.resolve(path.dirname(file),match[1])).replaceAll('\\','/');pending.push(resolved);}
}
fs.writeFileSync(path.join(destination,'manifest.json'),JSON.stringify({package:'three',version:pkg.version,source:'https://registry.npmjs.org/three/-/three-0.160.0.tgz',license:'MIT',files},null,2)+'\n');
console.log(JSON.stringify({version:pkg.version,files:Object.keys(files).length,bytes:Object.keys(files).reduce((n,p)=>n+fs.statSync(path.join(destination,p)).size,0)}));
