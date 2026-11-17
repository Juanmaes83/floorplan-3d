'use strict';
// Only verify an explicitly supplied, trusted original artifact. No discovery or automatic cache acceptance.
function verify(original,candidate){
 const fields=['dependencyFingerprint','environmentFingerprint','command','browser','configurationFingerprint'];
 if(!/^[a-f0-9]{40}$/.test(candidate?.sha||''))return {status:'UNKNOWN',reason:'candidate identity missing'};
 if(!original||original.status!=='EXECUTED_PASS'||!/^[a-f0-9]{40}$/.test(original.sha||'')||!original.artifactUrl||!original.completedAt)return {status:'UNKNOWN',reason:'original executed evidence incomplete'};
 if(fields.some(k=>typeof original[k]!=='string'||!original[k]||original[k]!==candidate?.[k]))return {status:'PENDING',reason:'files, dependencies, command, browser, environment or configuration differ'};
 return {status:'REUSED_VERIFIED',sourceSha:original.sha,candidateSha:candidate.sha,artifactUrl:original.artifactUrl,completedAt:original.completedAt,reason:'explicit evidence matches every execution authority; not executed on candidate'};
}
module.exports={verify};
