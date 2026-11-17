'use strict';
const cp=require('child_process'),fs=require('fs');
const api=p=>JSON.parse(cp.execFileSync('gh',['api',p],{encoding:'utf8',maxBuffer:20000000}));
const ms=(a,b)=>a&&b?Math.max(0,Date.parse(b)-Date.parse(a)):null;
const [repo,sha,out]=process.argv.slice(2);
if(!/^[\w.-]+\/[\w.-]+$/.test(repo)||!/^[a-f0-9]{40}$/.test(sha||''))throw Error('invalid repository or SHA');
// One exact SHA, paginated explicitly. Do not add results from different candidates.
function pages(endpoint,key){let out=[];for(let page=1;;page++){let j=api(endpoint+(endpoint.includes('?')?'&':'?')+'per_page=100&page='+page),a=j[key];if(!Array.isArray(a))throw Error('bad API page');out.push(...a);if(a.length<100)return out;}}
const runs=pages(`repos/${repo}/actions/runs?head_sha=${sha}`,'workflow_runs');
const measurements=runs.map(r=>{const jobs=pages(`repos/${repo}/actions/runs/${r.id}/jobs`,'jobs');return {runId:r.id,name:r.name,sha:r.head_sha,status:r.status,conclusion:r.conclusion,createdAt:r.created_at,startedAt:r.run_started_at,updatedAt:r.updated_at,queueMs:ms(r.created_at,r.run_started_at),wallMs:r.status==='completed'?ms(r.created_at,r.updated_at):null,jobs:jobs.map(j=>({id:j.id,name:j.name,status:j.status,conclusion:j.conclusion,startedAt:j.started_at,completedAt:j.completed_at,queueMs:ms(j.created_at,j.started_at),runnerMs:ms(j.started_at,j.completed_at)}))};});
const result={sha,queriedAt:new Date().toISOString(),mode:'observe',omissionEnabled:false,runs:measurements,totalJobs:measurements.reduce((n,r)=>n+r.jobs.length,0),completedJobRunnerMinutes:measurements.flatMap(r=>r.jobs).reduce((n,j)=>n+(j.runnerMs||0),0)/60000,measuredAvoidedJobs:0,measuredSavedRunnerMinutes:0,billedCost:null,limitations:'API elapsed job durations are not billed minutes. Pending runs incomplete; no claim of before/after equivalence or reduction in observation mode. Workflow durations overlap; their sum is not PR wall time.'};
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({sha,runs:runs.length,jobs:result.totalJobs,completedJobRunnerMinutes:result.completedJobRunnerMinutes,saved:0}));
