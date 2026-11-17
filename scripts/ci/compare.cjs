const fs=require('fs');
function compare(plan,measurement){
 if(!/^[a-f0-9]{40}$/.test(measurement.sha||'')||plan.headSha!==measurement.sha)throw Error('plan and measurement must have the same exact candidate SHA');
 const expected=new Set(plan.workflows||[]),runs=measurement.runs||[],launched=new Set(runs.map(r=>r.path?.split('@')[0]).filter(Boolean));
 if(runs.some(r=>r.sha!==measurement.sha))throw Error('measurement contains a run for another candidate');
 const pending=runs.filter(r=>r.status!=='completed').map(r=>r.runId);
 const failed=runs.filter(r=>r.status==='completed'&&['failure','timed_out','action_required','startup_failure','stale'].includes(r.conclusion)).map(r=>r.runId);
 const cancelled=runs.filter(r=>r.status==='completed'&&r.conclusion==='cancelled').map(r=>r.runId);
 const otherNonSuccess=runs.filter(r=>r.status==='completed'&&r.conclusion!=='success'&&!failed.includes(r.runId)&&!cancelled.includes(r.runId)).map(r=>r.runId);
 return {sha:measurement.sha,mode:'observe',omissionEnabled:false,missingPlannedWorkflows:[...expected].filter(p=>!launched.has(p)),pendingRuns:pending,failedRuns:failed,cancelledRuns:cancelled,otherNonSuccessRuns:otherNonSuccess,coverageCertified:false,reason:'Static plan compared with actual workflow starts. Workflow success alone does not certify every test or matrix variant. No omission enabled; retain original checks.',measuredAvoidedJobs:0,measuredSavedRunnerMinutes:0};
}
if(require.main===module){const [p,m,o]=process.argv.slice(2);fs.writeFileSync(o,JSON.stringify(compare(JSON.parse(fs.readFileSync(p)),JSON.parse(fs.readFileSync(m))),null,2)+'\n');}
module.exports={compare};
