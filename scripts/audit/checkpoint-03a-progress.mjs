import {readFile,copyFile,mkdir,stat,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const id='03-a-open-the-lens';
const inventory=JSON.parse(await readFile(path.join(ev,'raw-inventory.json'),'utf8'));
const byPath=new Map(inventory.files.map(x=>[x.path,x]));
const selected={
  'desktop/discovery-correction-1':['desktop-start.png','desktop-end.png','desktop-restored-start.png','desktop-forward-discovery-p015.png','desktop-forward-discovery-p050.png','desktop-forward-discovery-p085.png','desktop-forward-discovery.telemetry.ndjson','desktop-reverse-discovery.telemetry.ndjson','calibration.json','discovery-summary.json','start-state.json','end-state.json','reverse-state.json'],
  'portrait/discovery-correction-1':['portrait-start.png','portrait-end.png','portrait-restored-start.png','portrait-forward-discovery-p015.png','portrait-forward-discovery-p050.png','portrait-forward-discovery-p080.png','portrait-forward-discovery.telemetry.ndjson','portrait-reverse-discovery.telemetry.ndjson','calibration.json','discovery-summary.json','start-state.json','end-state.json','reverse-state.json'],
  'portrait/semantic-correction-1':['portrait-forward-m08-material-section-returns.png','portrait-forward-m08r-material-section-right-half.png','portrait-forward-m09-studio-service-copy.png','semantic-capture.json'],
  'landscape/semantic-correction-1':['landscape-forward-m05-bedroom-patio.png','landscape-forward-m08-material-section-returns.png','landscape-forward-m09-studio-service-copy.png','semantic-capture.json']
};
const records=[];
for(const [folder,names] of Object.entries(selected))for(const name of names){
  const rel=`${id}/${folder}/${name}`,entry=byPath.get(rel);
  if(!entry)throw Error(`Not in verified RAW inventory: ${rel}`);
  const from=path.join(inventory.rawRoot,...rel.split('/'));
  const to=path.join(ev,'takes',id,'corrections',folder,name);
  await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);
  if((await stat(to)).size!==entry.bytes)throw Error(`Size mismatch ${rel}`);
  if(createHash('sha256').update(await readFile(to)).digest('hex')!==entry.sha256)throw Error(`SHA256 mismatch ${rel}`);
  records.push({path:path.relative(root,to).replaceAll('\\','/'),rawPath:rel,bytes:entry.bytes,sha256:entry.sha256});
}
const index={schemaVersion:'rubik-donor-runtime-audit.partial-corrections.v1',status:'IN_PROGRESS',validation:'NOT_RUN',rawPackageContentSha256:inventory.packageContentSha256,records,note:'Corrected Discovery in desktop/portrait and semantic cue corrections in portrait/landscape. Landscape stable-start Discovery and all final semantic passes remain outstanding. Original attempts remain in RAW.'};
await writeFile(path.join(ev,'takes',id,'corrections','index.json'),JSON.stringify(index,null,2)+'\n');
console.log(JSON.stringify({status:index.status,records:records.length,rawPackageContentSha256:index.rawPackageContentSha256},null,2));
