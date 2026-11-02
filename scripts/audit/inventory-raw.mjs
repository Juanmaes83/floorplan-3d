import {createReadStream} from 'node:fs';
import {readdir,readFile,stat,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const rawRoot=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const output=path.join(evidence,'raw-inventory.json');
const hashOutput=path.join(evidence,'hashes/raw-inventory.sha256');
const verify=process.argv.includes('--verify');
async function sha256(file){const h=createHash('sha256');for await(const chunk of createReadStream(file))h.update(chunk);return h.digest('hex')}
async function walk(dir,rel=''){
  const found=[];
  for(const entry of (await readdir(dir,{withFileTypes:true})).sort((a,b)=>a.name.localeCompare(b.name,'en'))){
    const child=path.join(dir,entry.name),r=path.posix.join(rel,entry.name);
    if(entry.isDirectory())found.push(...await walk(child,r));
    else if(entry.isFile()){const s=await stat(child);found.push({path:r,bytes:s.size,sha256:await sha256(child)})}
    else throw Error(`Unsupported RAW entry: ${child}`);
  }
  return found;
}
const files=await walk(rawRoot);
const content=files.map(x=>`${x.sha256}  ${x.bytes}  ${x.path}\n`).join('');
const packageContentSha256=createHash('sha256').update(content).digest('hex');
const totalBytes=files.reduce((a,x)=>a+x.bytes,0);
if(verify){
  const old=JSON.parse(await readFile(output,'utf8'));
  if(JSON.stringify(old.files)!==JSON.stringify(files)||old.packageContentSha256!==packageContentSha256||old.totalBytes!==totalBytes)throw Error('RAW inventory verification failed');
  const actual=await sha256(output);
  const expected=(await readFile(hashOutput,'utf8')).trim().split(/\s+/)[0];
  if(actual!==expected)throw Error('RAW manifest hash verification failed');
  console.log(`PASS RAW INVENTORY: ${files.length} files, ${totalBytes} bytes, packageContentSha256 ${packageContentSha256}, manifestSha256 ${actual}`);
}else{
  const manifest={schemaVersion:'rubik-donor-runtime-audit.raw-inventory.v1',status:'DIRECTORY_UNPACKAGED',rawRoot,generatedAt:new Date().toISOString(),fileCount:files.length,totalBytes,packageContentSha256,hashDefinition:'SHA256 over UTF-8 sorted lines: <file-sha256><two spaces><bytes><two spaces><relative POSIX path><LF>; not a ZIP hash',files};
  await writeFile(output,JSON.stringify(manifest,null,2)+'\n');
  const manifestSha256=await sha256(output);
  await writeFile(hashOutput,`${manifestSha256}  docs/product/evidence/donor-runtime-audit-2026-11-02/raw-inventory.json\n`);
  console.log(`RAW INVENTORY: ${files.length} files, ${totalBytes} bytes, packageContentSha256 ${packageContentSha256}, manifestSha256 ${manifestSha256}`);
}
