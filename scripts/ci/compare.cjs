const fs=require('fs');
function compare(plan,measurement){
 const expected=new Set(plan.workflows||[]),runs=measurement.runs||[],launched=new Set(runs.map(r=>r.path?.split('@')[0]).filter(Boolean));
 const pending=runs.filter(r=>r.status!=='completed').map(r=>r.runId),failed=runs.filter(r=>r.conclusion==='failure').map(r=>r.runId);
 return {sha:measurement.sha,mode:'observe',omissionEnabled:false,missingPlannedWorkflows:[...expected].filter(p=>!launched.has(p)),pendingRuns:pending,failedRuns:failed,coverageCertified:false,reason:'Static plan compared with actual workflow starts. Workflow success alone does not certify every test or matrix variant. No omission enabled; retain original checks.',measuredAvoidedJobs:0,measuredSavedRunnerMinutes:0};
}
if(require.main===module){const [p,m,o]=process.argv.slice(2);fs.writeFileSync(o,JSON.stringify(compare(JSON.parse(fs.readFileSync(p)),JSON.parse(fs.readFileSync(m))),null,2)+'\n');}
module.exports={compare};
