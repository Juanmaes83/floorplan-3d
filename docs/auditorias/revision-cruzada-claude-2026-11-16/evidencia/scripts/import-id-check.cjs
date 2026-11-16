// Demonstration on master@46174d6 (pure, no browser): which library operations keep project.id, the key of the budget.
const path=require('path'),R=process.argv[2];
const Core=require(path.join(R,'js/project-core.js')),L=require(path.join(R,'js/project-library.js'));
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const lib=L.load(mem(),Core.initial());
const A=lib.project();const exported=JSON.stringify(A);                      // «Exportar proyecto» (project.json)
const visible=lib.project();
lib.importProject(visible,Core.prepare(exported).project,'Importado 1');    // same path as index.html adoptImported → library.importProject
lib.importProject(lib.project(),Core.prepare(exported).project,'Importado 2');
const ids=lib.projects().map(p=>p.id);
lib.duplicate(lib.activeId(),'Duplicado');const dupId=lib.project().id;
const v=lib.variant(lib.project());
console.log(JSON.stringify({entries:lib.list().map(e=>e.name),projectIds:lib.projects().map(p=>p.id),originalId:A.id,
 importKeepsId:ids.filter(i=>i===A.id).length,duplicateNewId:dupId!==A.id,variantNewId:v.id!==dupId},null,1));
