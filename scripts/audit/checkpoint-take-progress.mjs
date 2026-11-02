import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Mirror partial non-video evidence in Git. Preserve all originals in RAW.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id=process.argv.find(a=>a.startsWith('--take='))?.slice(7);
if(!id)throw Error('Use --take=<canonical-id>');
const inventory=JSON.parse(await readFile(path.join(evidence,'raw-inventory.json'),'utf8'));
const runState=JSON.parse(await readFile(path.join(evidence,'audit-run-state.json'),'utf8'));
if(!runState.takes[id])throw Error(`Unknown take: ${id}`);
const files=inventory.files.filter(f=>f.path.startsWith(`${id}/`));
const dest=path.join(evidence,'takes',id,'partial-raw');
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
let copied=0,bytes=0;
for(const f of files){
  if(f.path.endsWith('.webm'))continue;
  const rel=f.path.slice(id.length+1);
  const target=path.join(dest,rel);
  await mkdir(path.dirname(target),{recursive:true});
  await copyFile(path.join(inventory.rawRoot,f.path),target);
  if(await hash(target)!==f.sha256)throw Error(`Copy hash mismatch: ${f.path}`);
  copied++;bytes+=f.bytes;
}
const index={
  schemaVersion:'rubik-donor-runtime-audit.partial-evidence-index.v1',
  take:id,status:runState.takes[id].validationStatus==='COMPLETE'?'VALIDATED_NONVIDEO_MIRROR':'PARTIAL / IN_PROGRESS',
  lastSuccessfulStage:runState.takes[id].lastSuccessfulStage,
  inventoryContentSha256:inventory.packageContentSha256,
  rawRoot:inventory.rawRoot,rawFileCount:files.length,rawBytes:files.reduce((a,f)=>a+f.bytes,0),
  copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,
  videosRawOnly:files.filter(f=>f.path.endsWith('.webm')).map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256})),
  copiedFiles:files.filter(f=>!f.path.endsWith('.webm')).map(f=>({rawPath:f.path,gitPath:`docs/product/evidence/donor-runtime-audit-2026-11-02/takes/${id}/partial-raw/${f.path.slice(id.length+1)}`,bytes:f.bytes,sha256:f.sha256}))
};
await mkdir(path.join(evidence,'takes',id),{recursive:true});
await writeFile(path.join(evidence,'takes',id,'partial-evidence-index.json'),JSON.stringify(index,null,2)+'\n');
await writeFile(path.join(evidence,'hashes',`${id}-partial.sha256`),files.map(f=>`${f.sha256}  ${f.bytes}  ${f.path}`).join('\n')+'\n');
console.log(JSON.stringify({take:id,status:index.status,rawFiles:files.length,copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,videosRawOnly:index.videosRawOnly.length},null,2));
