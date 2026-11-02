import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Recoverable 05-c partial checkpoint. Does not validate the take or edit RAW.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='05-c-site-camera';
const inventory=JSON.parse(await readFile(path.join(evidence,'raw-inventory.json'),'utf8'));
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
  take:id,status:'PARTIAL / IN_PROGRESS',
  inventoryContentSha256:inventory.packageContentSha256,
  rawRoot:inventory.rawRoot,rawFileCount:files.length,rawBytes:files.reduce((a,f)=>a+f.bytes,0),
  copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,
  videosRawOnly:files.filter(f=>f.path.endsWith('.webm')).map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256})),
  validCurrentEvidence:{
    discovery:{desktop:'discovery-correction-1 at 5fps',portrait:'original at 5fps',landscape:'original at 5fps'},
    semantic:{desktop:'semantic-correction-1 at 5fps: M01-M16',portrait:'original at 5fps: M01-M16',landscape:'original at 5fps: M01-M16'},
    reason:'The first desktop Discovery prelude failed at 10fps with agent-browser encoder backpressure; the original remains in RAW. The first desktop semantic run reached WK14 but failed an incorrect B-only terminal text gate; the original remains in RAW. Fresh correction-1 runs passed at 5fps. Current selected runs require visual/source/Cut/Rubik reconciliation and individual validation.'
  },
  copiedFiles:files.filter(f=>!f.path.endsWith('.webm')).map(f=>({rawPath:f.path,gitPath:`docs/product/evidence/donor-runtime-audit-2026-11-02/takes/${id}/partial-raw/${f.path.slice(id.length+1)}`,bytes:f.bytes,sha256:f.sha256}))
};
await writeFile(path.join(evidence,'takes',id,'partial-evidence-index.json'),JSON.stringify(index,null,2)+'\n');
await writeFile(path.join(evidence,'hashes',`${id}-partial.sha256`),files.map(f=>`${f.sha256}  ${f.bytes}  ${f.path}`).join('\n')+'\n');
console.log(JSON.stringify({take:id,status:index.status,rawFiles:files.length,copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,videosRawOnly:index.videosRawOnly.length},null,2));
