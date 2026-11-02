import {readFile,writeFile,copyFile,mkdir,stat} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const id='03-a-open-the-lens';
const ev=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02');
const takeDir=path.join(ev,'takes',id);
const raw=path.resolve(root,'../donor-runtime-audit-RAW-2026-11-02',id);
const rawInventory=JSON.parse(await readFile(path.join(ev,'raw-inventory.json'),'utf8'));
const state=JSON.parse(await readFile(path.join(ev,'audit-run-state.json'),'utf8'));
const picks={
  desktop:['desktop-start.png','desktop-forward-discovery-p015.png','desktop-forward-discovery-p040.png','desktop-forward-discovery-p065.png','desktop-forward-discovery-p085.png','desktop-end.png','desktop-restored-start.png'],
  portrait:['portrait-start.png','portrait-forward-discovery-p015.png','portrait-forward-discovery-p050.png','portrait-forward-discovery-p070.png','portrait-end.png','portrait-restored-start.png'],
  landscape:['landscape-start.png','landscape-forward-discovery-p015.png','landscape-forward-discovery-p050.png','landscape-forward-discovery-p070.png','landscape-end.png','landscape-restored-start.png']
};
const rawFiles=new Map(rawInventory.files.map(x=>[x.path,x]));
const records=[];
for(const vp of Object.keys(picks)){
  const source=path.join(raw,vp);
  const names=[...picks[vp],'discovery-summary.json','start-state.json','end-state.json','reverse-state.json',`${vp}-forward-discovery.telemetry.ndjson`,`${vp}-reverse-discovery.telemetry.ndjson`];
  for(const name of names){
    const kind=name.endsWith('.png')?'DISCOVERY_SAMPLE_OR_ENDPOINT':name.endsWith('.ndjson')?'TELEMETRY':'METADATA';
    const folder=kind==='DISCOVERY_SAMPLE_OR_ENDPOINT'?'keyframes':kind==='TELEMETRY'?'telemetry':'discovery-metadata';
    const from=path.join(source,name),to=path.join(takeDir,folder,vp,name);
    await mkdir(path.dirname(to),{recursive:true});await copyFile(from,to);
    const bytes=(await stat(to)).size,sha256=createHash('sha256').update(await readFile(to)).digest('hex');
    const original=rawFiles.get(`${id}/${vp}/${name}`);
    if(!original||original.sha256!==sha256||original.bytes!==bytes)throw Error(`RAW/copy mismatch ${vp}/${name}`);
    records.push({path:path.relative(root,to).replaceAll('\\','/'),bytes,sha256,kind,viewport:vp,rawPath:`${id}/${vp}/${name}`});
  }
}
const videos=[];
for(const vp of Object.keys(picks))for(const name of [`${vp}-forward-discovery.webm`,`${vp}-reverse-discovery.webm`]){
  const x=rawFiles.get(`${id}/${vp}/${name}`);if(!x||x.bytes<=0)throw Error(`Missing RAW video ${vp}/${name}`);videos.push({...x,viewport:vp});
}
const snapshot={schemaVersion:'rubik-donor-runtime-audit.partial-checkpoint.v1',status:'IN_PROGRESS',validation:'NOT_RUN',takeId:id,baselineSha:'0f9c6ead9732901681498efec326d1ca92e42ffe',lastSuccessfulStage:state.takes[id].lastSuccessfulStage,stages:{desktop:'DISCOVERY_COMPLETE',portrait:'DISCOVERY_COMPLETE',landscape:'DISCOVERY_COMPLETE',semantic:'NOT_STARTED',reconciliation:'NOT_STARTED',individualValidator:'NOT_RUN'},attempts:state.takes[id].attempts,rawRoot:raw,rawPackageContentSha256:rawInventory.packageContentSha256,rawVideos:videos,gitCopies:records,warning:'Discovery samples are not semantic milestones. A second fresh semantic pass and reconciliation are required before a take manifest or validation.'};
await writeFile(path.join(takeDir,'partial-evidence.json'),JSON.stringify(snapshot,null,2)+'\n');
await writeFile(path.join(ev,'hashes',`${id}-partial.sha256`),records.map(x=>`${x.sha256}  ${x.path}`).join('\n')+'\n');
console.log(JSON.stringify({status:snapshot.status,copies:records.length,rawVideos:videos.length,sha256Verified:true},null,2));
