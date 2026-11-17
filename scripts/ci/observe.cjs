'use strict';
const fs=require('fs'),cp=require('child_process'),path=require('path');
const {plan,fingerprint}=require('./impact-plan.cjs');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
function observe(base,head,changes,{forceFull=false}={}){
 const environment={node:process.version,platform:process.platform,arch:process.arch,mode:'observe',config:head.workflows,browser:'workflow-specific; not interchangeable'};
 const unknownOwnership=head.unresolvedOwnership.length||base.unresolvedOwnership.length;
 const tests=[...new Set([...base.tests,...head.tests])].sort();
 const docs=head.files.filter(p=>p.startsWith('docs/')&&p.endsWith('.md')&&!p.startsWith('docs/security/')&&!p.startsWith('docs/contracts/'));
 const result=plan({changes,baseSha:base.sha,headSha:head.sha,tests,dependencies:head.dependencies,previousDependencies:base.dependencies,
  ownership:head.ownership,contents:head.texts,environment,informationalDocuments:docs,uncertainFiles:head.uncertainFiles,
  forceFull:forceFull||!!unknownOwnership});
 result.mode='observe';result.omissionEnabled=false;
 result.unknownOwnership={base:base.unresolvedOwnership,head:head.unresolvedOwnership};
 result.coverage=tests.map(test=>({test,workflows:head.ownership[test]||base.ownership[test]||[],decision:result.tests.includes(test)?'PENDING':'NOT_APPLICABLE',reason:result.tests.includes(test)?'current execution required':'not selected by conservative closure; no PASS claimed',fingerprint:fingerprint(new Set([test,...(head.dependencies[test]||[])]),head.texts,environment)}));
 result.workflowCount=Object.keys(head.workflows).length;
 result.environment={node:process.version,platform:process.platform,arch:process.arch};
 return result;
}
if(require.main===module){const [bp,hp,baseSha,headSha,out,force]=process.argv.slice(2);
 const status=cp.execFileSync('git',['diff','--name-status','-z','--find-renames',baseSha,headSha]);
 const tokens=status.toString().split('\0').filter(Boolean),changes=[];
 for(let i=0;i<tokens.length;){const kind=tokens[i++];changes.push(tokens[i++]);if(/^[RC]/.test(kind))changes.push(tokens[i++]);}
 const result=observe(read(bp),read(hp),[...new Set(changes)],{forceFull:force==='full'});
 fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
 console.log(JSON.stringify({sha:result.headSha,mode:result.mode,level:result.level,reason:result.reason,tests:result.tests.length,workflows:result.workflowCount,omissionEnabled:false}));
}
module.exports={observe};
