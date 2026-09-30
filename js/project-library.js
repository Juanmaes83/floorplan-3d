/* Local project collection. Canonical project validation stays in FloorPlanCore. */
(function(root){
  const Core=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
  const KEY='rubik-sota-project-library-v1';
  function load(storage,seed){
    let data;const raw=storage.getItem(KEY);
    if(raw!==null){
      data=JSON.parse(raw);
      if(data.version!==1||!Array.isArray(data.entries)||!data.entries.length)throw Error('Invalid local project collection');
      const ids=new Set();for(const e of data.entries){if(typeof e.id!=='string'||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim())throw Error('Invalid local project entry');ids.add(e.id);Core.validate(e.project);}
      if(!ids.has(data.activeId))throw Error('Invalid active project');
    }else{const id=Core.id('prj');data={version:1,activeId:id,entries:[{id,name:'Proyecto inicial',project:Core.clone(seed)}]};}
    const current=()=>data.entries.find(e=>e.id===data.activeId);
    function change(fn){const next=Core.clone(data);fn(next);storage.setItem(KEY,JSON.stringify(next));data=next;return Core.clone(current().project);}
    function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>120)throw Error('El nombre debe tener entre 1 y 120 caracteres');return value.trim();}
    function entry(next,id){const e=next.entries.find(e=>e.id===id);if(!e)throw Error('Proyecto no encontrado');return e;}
    return {
      list:()=>data.entries.map(({id,name})=>({id,name})),activeId:()=>data.activeId,project:()=>Core.clone(current().project),
      save(project){Core.validate(project);return change(n=>{entry(n,n.activeId).project=Core.clone(project);});},
      open(id){return change(n=>{entry(n,id);n.activeId=id;});},
      rename(id,value){const title=name(value);return change(n=>{entry(n,id).name=title;});},
      create(value){const title=name(value);return change(n=>{const id=Core.id('prj'),project=Core.initial();project.id=Core.id('prj');n.entries.push({id,name:title,project});n.activeId=id;});},
      duplicate(id,value){const title=name(value);return change(n=>{const source=entry(n,id),newId=Core.id('prj'),project=Core.clone(source.project);project.id=Core.id('prj');n.entries.push({id:newId,name:title,project});n.activeId=newId;});},
      remove(id){return change(n=>{entry(n,id);if(n.entries.length===1)throw Error('Conserva al menos un proyecto');n.entries=n.entries.filter(e=>e.id!==id);if(n.activeId===id)n.activeId=n.entries[0].id;});}
    };
  }
  const api={load,KEY};if(typeof module==='object')module.exports=api;else root.FloorPlanLibrary=api;
})(typeof globalThis==='object'?globalThis:this);
