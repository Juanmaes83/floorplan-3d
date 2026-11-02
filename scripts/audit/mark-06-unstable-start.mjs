import {readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../..');
const file=path.join(root,'docs/product/evidence/donor-runtime-audit-2026-11-02/audit-run-state.json');
const state=JSON.parse(await readFile(file,'utf8'));
const take=state.takes['06-demo-card-model'];
for(const attempt of take.attempts){
  if(attempt.run==='original'&&['DISCOVERY','SEMANTIC'].includes(attempt.stage)){
    attempt.evidenceValidity='SUPERSEDED_UNSTABLE_A0';
    attempt.validityReason='Autonomous hero assembly and copy were incomplete at A0; raw capture remains preserved but cannot prove stable-start restore.';
  }
}
take.blockingUnresolved=[{question:'Stable A0 correction required',detail:'Repeat Discovery and semantic in all three viewports after the autonomous card assembly and hero copy have settled; compare corrected A0/A1.'}];
take.captureStatus='IN_PROGRESS';take.reconciliationStatus='NOT_STARTED';take.validationStatus='NOT_STARTED';
take.lastSuccessfulStage='ORIGINAL_SEMANTIC_CAPTURED_SUPERSEDED_UNSTABLE_A0';
take.timestamps.updatedAt=new Date().toISOString();state.updatedAt=take.timestamps.updatedAt;
await writeFile(file,JSON.stringify(state,null,2)+'\n');
console.log('06 original attempts preserved and superseded for unstable A0');
