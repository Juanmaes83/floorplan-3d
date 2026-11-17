const test=require('node:test'),assert=require('node:assert/strict'),{compare}=require('./compare.cjs');
const sha='a'.repeat(40),plan={headSha:sha,workflows:['.github/workflows/a.yml','.github/workflows/b.yml']};
const measurement=(records)=>({sha,runs:records.map(record=>({sha,...record}))});
test('an absent planned suite is exposed even when another workflow is green',()=>{
 const result=compare(plan,measurement([{runId:1,path:'.github/workflows/a.yml',status:'completed',conclusion:'success'}]));
 assert.deepEqual(result.missingPlannedWorkflows,['.github/workflows/b.yml']);
 assert.equal(result.coverageCertified,false);
 assert.equal(result.measuredSavedRunnerMinutes,0);
});
test('failed, pending, cancelled and skipped runs remain distinguishable',()=>{
 const result=compare(plan,measurement([
  {runId:1,status:'completed',conclusion:'failure'},
  {runId:2,status:'queued',conclusion:null},
  {runId:3,status:'completed',conclusion:'cancelled'},
  {runId:4,status:'completed',conclusion:'timed_out'},
  {runId:5,status:'completed',conclusion:'skipped'}
 ]));
 assert.deepEqual(result.failedRuns,[1,4]);
 assert.deepEqual(result.pendingRuns,[2]);
 assert.deepEqual(result.cancelledRuns,[3]);
 assert.deepEqual(result.otherNonSuccessRuns,[5]);
 assert.equal(result.coverageCertified,false);
});
test('plan and runs must all identify the measured candidate',()=>{
 assert.throws(()=>compare({...plan,headSha:'b'.repeat(40)},measurement([])),/same exact candidate SHA/);
 assert.throws(()=>compare(plan,measurement([{sha:'b'.repeat(40)}])),/another candidate/);
});
