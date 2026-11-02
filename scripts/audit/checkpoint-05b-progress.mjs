import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

// Recoverable partial checkpoint only. This does not validate the take or edit RAW.
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const evidence=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='05-b-1-1-site-sheet';
const inventory=JSON.parse(await readFile(path.join(evidence,'raw-inventory.json'),'utf8'));
const files=inventory.files.filter(f=>f.path.startsWith(`${id}/`));
const dest=path.join(evidence,'takes',id,'partial-raw');
const hash=async p=>createHash('sha256').update(await readFile(p)).digest('hex');
let copied=0,bytes=0;
for(const f of files){
  if(f.path.endsWith('.webm'))continue;
  const rel=f.path.slice(id.length+1);
  const src=path.join(inventory.rawRoot,f.path),target=path.join(dest,rel);
  await mkdir(path.dirname(target),{recursive:true});
  await copyFile(src,target);
  if(await hash(target)!==f.sha256)throw Error(`Copy hash mismatch: ${f.path}`);
  copied++;bytes+=f.bytes;
}
const index={
  schemaVersion:'rubik-donor-runtime-audit.partial-evidence-index.v1',
  take:id,status:'PARTIAL / IN_PROGRESS',
  inventoryContentSha256:inventory.packageContentSha256,
  rawRoot:inventory.rawRoot,
  rawFileCount:files.length,rawBytes:files.reduce((a,f)=>a+f.bytes,0),
  copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,
  videosRawOnly:files.filter(f=>f.path.endsWith('.webm')).map(f=>({path:f.path,bytes:f.bytes,sha256:f.sha256})),
  validCurrentEvidence:{
    discovery:{desktop:'original',portrait:'original',landscape:'original'},
    semantic:{desktop:'semantic-correction-1: M01-M12 at exact WK14',portrait:'semantic-correction-2: inspect semantic-capture.json for exact WK14; original and correction-1 retained',landscape:'original: M01-M12 at exact WK14'},
    reason:'Desktop original and portrait original terminal frames stopped just below week 14. Landscape original reached exact week 14. Portrait correction-1 failed because an End key on an already-maxed range input emitted no input event; correction-2 uses ArrowLeft then End on the donor visible slider after the wheel traversal. All attempts remain in RAW; only completed semantic-capture.json records are valid evidence.'
  },
  copiedFiles:files.filter(f=>!f.path.endsWith('.webm')).map(f=>({rawPath:f.path,gitPath:`docs/product/evidence/donor-runtime-audit-2026-11-02/takes/${id}/partial-raw/${f.path.slice(id.length+1)}`,bytes:f.bytes,sha256:f.sha256}))
};
await writeFile(path.join(evidence,'takes',id,'partial-evidence-index.json'),JSON.stringify(index,null,2)+'\n');
await writeFile(path.join(evidence,'hashes',`${id}-partial.sha256`),files.map(f=>`${f.sha256}  ${f.bytes}  ${f.path}`).join('\n')+'\n');
console.log(JSON.stringify({take:id,status:index.status,rawFiles:files.length,copiedNonVideoFiles:copied,copiedNonVideoBytes:bytes,videosRawOnly:index.videosRawOnly.length},null,2));
