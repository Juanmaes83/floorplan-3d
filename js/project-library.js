/* Local project collection. Canonical project validation stays in FloorPlanCore. */
(function(root){
  const Core=typeof module==='object'?require('./project-core.js'):root.FloorPlanCore;
  const Building=typeof module==='object'?require('./building-core.js'):root.FloorPlanBuilding;
  // A building entry {kind:'building',building,activeLevelId} stores the whole building as one unit. The editor always
  // works on the active level's 1.x project; project()/save() address that level and never the container.
  const KEY='rubik-sota-project-library-v1';
  // Phase C (D-C1): an entry may carry `variantOf` = id of another *library entry* (never a project/entity id).
  // It is local collection metadata only: it is not part of FloorPlanProjectV1 and never travels in exported JSON.
  const MAX_VARIANTS=2,NAME_MAX=120;
  /* IDENTITY CONTRACT (consolidation, P1): one project.id per independent project of the collection — single entries
     and every level of every building. The documents that hang from a project are keyed by that id (the budget
     rubik-budget-v1[project.id], the Assistant log…), so two stored projects with one id would read and write the
     same budget. Three cases are told apart:
     - INTERNAL COPY (duplicate, variant, single project → building): new id, and the budget is FORKED — an
       independent copy of the saved FloorPlanBudgetV1 (prices, own VAT, units, reviews, references) addressed to the
       new id (`subject.id`, `id`). Original and copy never share an economic write again.
     - EXTERNAL IMPORT (a project or building file): the file's id is kept when it is free (portability: its budget
       file still matches) and replaced when it is taken. Nothing is copied from the local project that happened to
       have that id. The file's id is remembered as local metadata `origin.projectId` (never exported), so a review
       by file still answers to the project the file came from.
     - MIGRATION (collections written before this contract): on load, later entries that share an id are
       re-identified and the budget they were already sharing is forked to them (nothing is deleted or invented).
       It runs once: afterwards there is nothing to migrate. If it cannot be written, nothing changes.
     Geometry ids (walls, rooms, objects, levels) are never regenerated here. The budget copy is a storage-level copy
     of the saved document: no amount is computed (that stays in FloorPlanBudget.calculateBudget). */
  const BUDGETS='rubik-budget-v1';
  const projectsIn=e=>e.kind==='building'?e.building.levels.map(l=>l.project):[e.project];
  function load(storage,seed){
    let data;const raw=storage.getItem(KEY);
    if(raw!==null){
      data=JSON.parse(raw);
      if(data.version!==1||!Array.isArray(data.entries)||!data.entries.length)throw Error('Invalid local project collection');
      const ids=new Set();for(const e of data.entries){if(typeof e.id!=='string'||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.variantOf!==undefined&&typeof e.variantOf!=='string')throw Error('Invalid local project entry');ids.add(e.id);
        if(e.kind==='building'){Building.validate(e.building);if(!e.building.levels.some(l=>l.id===e.activeLevelId))throw Error('Invalid active level');}else Core.validate(e.project);}
      if(!ids.has(data.activeId))throw Error('Invalid active project');
    }else{const id=Core.id('prj');data={version:1,activeId:id,entries:[{id,name:'Proyecto inicial',project:Core.clone(seed)}]};}
    const idsOf=n=>new Set(n.entries.flatMap(e=>projectsIn(e).map(p=>p.id)));
    // Copies budget[from] → budget[to] for each pair (never over an existing one). Returns the previous raw value when
    // it wrote, so a failed collection write can put it back; throws if the budgets cannot be written.
    function forkBudgets(pairs){if(!pairs.length)return undefined;const raw=storage.getItem(BUDGETS);if(raw===null)return undefined;let all;try{all=JSON.parse(raw);}catch{return undefined;}
      if(!all||typeof all!=='object'||Array.isArray(all))return undefined;let n=0;
      for(const {from,to} of pairs){const src=all[from];if(!src||typeof src!=='object'||Array.isArray(src)||Object.prototype.hasOwnProperty.call(all,to))continue;
        const b=Core.clone(src);if(b.id===`bud_${from}`)b.id=`bud_${to}`;if(b.subject&&b.subject.type==='project'&&b.subject.id===from)b.subject={...b.subject,id:to};all[to]=b;n++;}
      if(!n)return undefined;storage.setItem(BUDGETS,JSON.stringify(all));return raw;}
    // One write of the collection, preceded by the budget forks it needs. Either both are stored or neither is.
    function commit(next,forks){const before=forkBudgets(forks);try{storage.setItem(KEY,JSON.stringify(next));}catch(e){if(before!==undefined){try{storage.setItem(BUDGETS,before);}catch{}}throw e;}}
    // External file: keep its id if free, otherwise a new one (returns the id it came with, or null).
    const reidentify=(n,p)=>{if(!idsOf(n).has(p.id))return null;const from=p.id;p.id=Core.id('prj');return from;};
    let migration={reidentified:[],failed:false};
    if(raw!==null){const seen=new Set();let clash=false;for(const e of data.entries)for(const p of projectsIn(e)){if(seen.has(p.id))clash=true;seen.add(p.id);}
      if(clash){const next=Core.clone(data),taken=new Set(),forks=[];
        for(const e of next.entries)for(const p of projectsIn(e)){if(taken.has(p.id)){const from=p.id;p.id=Core.id('prj');forks.push({from,to:p.id,entryId:e.id});if(e.kind!=='building'&&!e.origin)e.origin={projectId:from};}taken.add(p.id);}
        try{commit(next,forks);data=next;migration={reidentified:forks,failed:false};}catch{migration={reidentified:[],failed:true};}}}
    const current=()=>data.entries.find(e=>e.id===data.activeId);
    const levelOf=e=>e.building.levels.find(l=>l.id===e.activeLevelId);
    const projectOf=e=>e.kind==='building'?levelOf(e).project:e.project;
    const view=e=>e.kind==='building'?{...e,project:projectOf(e)}:e;
    // A link counts only if it points to an existing, non-variant entry other than itself; stale links (e.g. written
    // by another version) are ignored at read time, never presented as working and never destructively rewritten on load.
    const rootOf=(n,e)=>{const o=e.variantOf&&e.variantOf!==e.id&&n.entries.find(x=>x.id===e.variantOf);return o&&!(o.variantOf&&n.entries.some(x=>x.id===o.variantOf))?o.id:null;};
    const variantsOf=(n,id)=>n.entries.filter(e=>rootOf(n,e)===id);
    function change(fn){const next=Core.clone(data),forks=[];fn(next,forks);commit(next,forks);data=next;return Core.clone(projectOf(current()));}
    function name(value){if(typeof value!=='string'||!value.trim()||value.trim().length>120)throw Error('El nombre debe tener entre 1 y 120 caracteres');return value.trim();}
    // Stores the editor's 1.x project into an entry: the active level for buildings, the project otherwise.
    function store(e,project){if(e.kind==='building')e.building=Building.setProject(e.building,e.activeLevelId,project);else e.project=Core.clone(project);}
    function entry(next,id){const e=next.entries.find(e=>e.id===id);if(!e)throw Error('Proyecto no encontrado');return e;}
    return {
      // Building entries also expose `project` (their active level) for read-only callers such as the guide.
      all:()=>Core.clone(data.entries.map(view)),
      // Every 1.x project stored in the collection, including all levels of every building (image cleanup uses it).
      projects:()=>Core.clone(data.entries.flatMap(e=>e.kind==='building'?e.building.levels.map(l=>l.project):[e.project])),
      list:()=>data.entries.map(e=>{const root=rootOf(data,e),x={id:e.id,name:e.name};if(root)x.variantOf=root;if(e.kind==='building'){x.kind='building';x.levels=e.building.levels.length;}return x;}),activeId:()=>data.activeId,project:()=>Core.clone(projectOf(current())),
      isBuilding:()=>current().kind==='building',building:()=>current().kind==='building'?Core.clone(current().building):null,activeLevelId:()=>current().activeLevelId??null,
      setActiveLevel(levelId){return change(n=>{const e=entry(n,n.activeId);if(e.kind!=='building'||!e.building.levels.some(l=>l.id===levelId))throw Error('Planta no encontrada');e.activeLevelId=levelId;});},
      // `visible` (optional) is stored into the active level first, so unsaved edits on screen are kept.
      saveBuilding(building,{activeLevelId,visible}={}){Building.validate(building);return change(n=>{const e=entry(n,n.activeId);if(e.kind!=='building')throw Error('El proyecto abierto no es un edificio');let b=Core.clone(building);const level=activeLevelId||e.activeLevelId;
        if(visible){Core.validate(visible);b=Building.setProject(b,e.activeLevelId,visible);}e.building=b;e.activeLevelId=b.levels.some(l=>l.id===level)?level:b.levels[0].id;e.name=b.name;});},
      // Creates a new building entry; the 1.x entry it may come from is left untouched.
      // Internal derivation (a single project becomes a building, its entry stays): a level whose project id is
      // already stored gets a new one and its budget is forked.
      addBuilding(building,{activeLevelId}={}){Building.validate(building);return change((n,forks)=>{const id=Core.id('prj'),b=Core.clone(building);for(const l of b.levels){const from=reidentify(n,l.project);if(from)forks.push({from,to:l.project.id});}
        Building.validate(b);n.entries.push({id,name:b.name,kind:'building',building:b,activeLevelId:activeLevelId||b.levels[0].id});n.activeId=id;});},
      importBuilding(visible,building,value){Core.validate(visible);Building.validate(building);const title=name(value);return change(n=>{const active=entry(n,n.activeId);if(active.kind==='building')active.building=Building.setProject(active.building,active.activeLevelId,visible);else active.project=Core.clone(visible);const id=Core.id('prj'),b=Core.clone(building);b.name=title;for(const l of b.levels)reidentify(n,l.project);Building.validate(b);n.entries.push({id,name:title,kind:'building',building:b,activeLevelId:b.levels[0].id});n.activeId=id;});},
      add(project,value){Core.validate(project);const title=name(value);return change(n=>{const id=Core.id('prj'),p=Core.clone(project);reidentify(n,p);n.entries.push({id,name:title,project:p});n.activeId=id;});},
      // File imports preserve the visible original and create a separate entry in one atomic write.
      // External import: see the identity contract above (no budget is copied from the project that had the id).
      // `originProjectId` (optional): the id the file had when the caller already gave the project a new one (the
      // expediente restore decides ids before writing, js/expediente-core.js); kept as the same local `origin` metadata.
      importProject(visible,project,value,{originProjectId}={}){Core.validate(visible);Core.validate(project);const title=name(value);return change(n=>{store(entry(n,n.activeId),visible);const id=Core.id('prj'),p=Core.clone(project),from=reidentify(n,p)||(typeof originProjectId==='string'&&originProjectId!==p.id?originProjectId:null);
        n.entries.push({id,name:title,project:p,...(from?{origin:{projectId:from}}:{})});n.activeId=id;});},
      // Id of the project file the open entry was imported from, when it had to be re-identified here (else null).
      origin:()=>{const o=current().origin;return o&&typeof o.projectId==='string'?o.projectId:null;},
      // What the load-time migration did: {reidentified:[{from,to,entryId}],failed}.
      migration:()=>Core.clone(migration),
      save(project){Core.validate(project);return change(n=>{store(entry(n,n.activeId),project);});},
      open(id){return change(n=>{entry(n,id);n.activeId=id;});},
      rename(id,value){const title=name(value);return change(n=>{const e=entry(n,id);e.name=title;if(e.kind==='building'){e.building.name=title;Building.validate(e.building);}else e.project.name=title;});},
      create(value){const title=name(value);return change(n=>{const id=Core.id('prj'),project=Core.initial();project.id=Core.id('prj');n.entries.push({id,name:title,project});n.activeId=id;});},
      duplicate(id,value){const title=name(value);return change((n,forks)=>{const source=entry(n,id),newId=Core.id('prj');if(source.kind==='building'){const b=Building.duplicate(source.building,title),order=levelOf(source).order;source.building.levels.forEach((l,i)=>forks.push({from:l.project.id,to:b.levels[i].project.id}));n.entries.push({id:newId,name:title,kind:'building',building:b,activeLevelId:b.levels[order].id});}else{const project=Core.clone(source.project);project.id=Core.id('prj');forks.push({from:source.project.id,to:project.id});n.entries.push({id:newId,name:title,project});}n.activeId=newId;});},
      // Removing an original keeps its variants as independent projects (link dropped, so nothing points to a missing
      // entry). Removing the active variant reopens its original.
      remove(id){return change(n=>{const e=entry(n,id),root=rootOf(n,e);if(n.entries.length===1)throw Error('Conserva al menos un proyecto');for(const v of variantsOf(n,id))delete v.variantOf;n.entries=n.entries.filter(x=>x.id!==id);if(n.activeId===id)n.activeId=root||n.entries[0].id;});},
      // Distributions comparable with `id`: its original first, then up to MAX_VARIANTS variants (local links only).
      // For buildings each card compares the level with the same order as the requested entry's active level.
      group(id){const e=data.entries.find(x=>x.id===id);if(!e)throw Error('Proyecto no encontrado');const root=rootOf(data,e)||e.id,order=e.kind==='building'?levelOf(e).order:0;return [root,...variantsOf(data,root).map(v=>v.id)].map(x=>{const y=data.entries.find(z=>z.id===x),level=y.kind==='building'?(y.building.levels[order]||y.building.levels[0]):null;return {id:y.id,name:y.name,variantOf:x===root?undefined:root,project:Core.clone(level?level.project:y.project),...(level?{levelName:level.name,building:Core.clone(y.building)}:{})};});},
      variantName(id){const e=data.entries.find(x=>x.id===id);if(!e)throw Error('Proyecto no encontrado');const root=data.entries.find(x=>x.id===(rootOf(data,e)||e.id)),names=new Set(data.entries.map(x=>x.name));
        for(let i=1;;i++){const suffix=` · Variante ${i}`,candidate=root.name.slice(0,NAME_MAX-suffix.length).trimEnd()+suffix;if(!names.has(candidate))return candidate;}},
      // Creates a variant from the project the person is seeing (`visible`), which may be ahead of the stored copy.
      // One storage write: the active entry stores `visible` and the new variant entry is added and opened. On any
      // failure (e.g. QuotaExceededError) nothing is written and the in-memory collection is unchanged.
      variant(visible,value){Core.validate(visible);return change((n,forks)=>{const active=entry(n,n.activeId),root=rootOf(n,active)||active.id;
        if(variantsOf(n,root).length>=MAX_VARIANTS)throw Error(`Cada distribución admite hasta ${MAX_VARIANTS} variantes (${MAX_VARIANTS+1} distribuciones para comparar).`);
        const title=name(value===undefined?this.variantName(n.activeId):value);if(n.entries.some(x=>x.name===title))throw Error('Ya existe un proyecto con ese nombre');
        store(active,visible);const id=Core.id('prj');
        if(active.kind==='building'){const b=Building.duplicate(active.building,title),order=levelOf(active).order;active.building.levels.forEach((l,i)=>forks.push({from:l.project.id,to:b.levels[i].project.id}));n.entries.push({id,name:title,kind:'building',building:b,activeLevelId:b.levels[order].id,variantOf:root});}
        else{const project=Core.clone(visible);project.id=Core.id('prj');project.name=title;Core.validate(project);forks.push({from:visible.id,to:project.id});n.entries.push({id,name:title,project,variantOf:root});}n.activeId=id;});}
    };
  }
  const api={load,KEY,MAX_VARIANTS};if(typeof module==='object')module.exports=api;else root.FloorPlanLibrary=api;
})(typeof globalThis==='object'?globalThis:this);
