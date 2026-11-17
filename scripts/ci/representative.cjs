const fs=require('fs'),{observe}=require('./observe.cjs');
const [b,h,out]=process.argv.slice(2),base=JSON.parse(fs.readFileSync(b)),head=JSON.parse(fs.readFileSync(h));
const samples={documentation:['docs/product/ESTADO-MAESTRO-RUBIK-SOTA.md'],styles:['css/nav3d.css'],module:['js/budget-ui.js'],shared:['js/project-core.js'],security:['api/share.js'],contracts:['docs/contracts/assistant-v1/AssistantRunAuditV1.schema.json'],unknown:['unknown/new-module.js'],simultaneous:['css/nav3d.css','api/share.js'],rename:['js/old-module.js','js/new-module.js'],selector:['scripts/ci/observe.cjs'],workflow:['.github/workflows/ci-impact.yml']};
const result=Object.entries(samples).map(([name,changes])=>{const p=observe(base,head,changes);return {name,changes,level:p.level,reason:p.reason,tests:p.tests,workflows:p.workflows,omissionEnabled:p.omissionEnabled};});
fs.writeFileSync(out,JSON.stringify(result,null,2)+'\n');
