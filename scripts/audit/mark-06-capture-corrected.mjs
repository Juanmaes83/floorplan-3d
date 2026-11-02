import {readFile,writeFile,stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const file=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/audit-run-state.json');
const state=JSON.parse(await readFile(file,'utf8'));
const take=state.takes['06-demo-card-model'];
for(const viewport of ['desktop','portrait','landscape']){
  for(const [stage,run,fileName] of [['DISCOVERY','discovery-correction-1','discovery-summary.json'],['SEMANTIC','semantic-correction-1','semantic-capture.json']]){
    const attempt=take.attempts.find(a=>a.viewport===viewport&&a.stage===stage&&a.run===run);
    if(attempt?.status!=='COMPLETE')throw Error(`Incomplete ${viewport} ${stage}`);
    const p=path.join(state.rawFolder,'06-demo-card-model',viewport,run,fileName);
    if((await stat(p)).size===0)throw Error(`Empty ${p}`);
  }
}
take.blockingUnresolved=take.blockingUnresolved.filter(x=>x.question!=='Stable A0 correction required');
take.captureStatus='COMPLETE';take.lastSuccessfulStage='CORRECTED_DISCOVERY_AND_SEMANTIC_CAPTURE_COMPLETE';
take.timestamps.updatedAt=new Date().toISOString();state.updatedAt=take.timestamps.updatedAt;
await writeFile(file,JSON.stringify(state,null,2)+'\n');
console.log('06 corrected capture complete; reconciliation and validation pending');
