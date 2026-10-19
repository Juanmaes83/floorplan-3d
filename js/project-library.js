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
  function load(storage,seed){
    let data;const raw=storage.getItem(KEY);
    if(raw!==null){
      data=JSON.parse(raw);
      if(data.version!==1||!Array.isArray(data.entries)||!data.entries.length)throw Error('Invalid local project collection');
      const ids=new Set();for(const e of data.entries){if(typeof e.id!=='string'||ids.has(e.id)||typeof e.name!=='string'||!e.name.trim()||e.variantOf!==undefined&&typeof e.variantOf!=='string')throw Error('Invalid local project entry');ids.add(e.id);
        if(e.kind==='building'){Building.validate(e.building);if(!e.building.levels.some(l=>l.id===e.activeLevelId))throw Error('Invalid active level');}else Core.validate(e.project);}
      if(!ids.has(data.activeId))throw Error('Invalid active project');
    }else{const id=Core.id('prj');data={version:1,activeId:id,entries:[{id,name:'Proyecto inicial',project:Core.clone(seed)}]};}
    const current=()=>data.entries.find(e=>e.id===data.activeId);
    const levelOf=e=>e.building.levels.find(l=>l.id===e.activeLevelId);
    const projectOf=e=>e.kind==='building'?levelOf(e).project:e.project;
    const view=e=>e.kind==='building'?{...e,project:projectOf(e)}:e;
    // A link counts only if it points to an existing, non-variant entry other than itself; stale links (e.g. written
    // by another version) are ignored at read time, never presented as working and never destructively rewritten on load.
    const rootOf=(n,e)=>{const o=e.variantOf&&e.variantOf!==e.id&&n.entries.find(x=>x.id===e.variantOf);return o&&!(o.variantOf&&n.entries.some(x=>x.id===o.variantOf))?o.id:null;};
    const variantsOf=(n,id)=>n.entries.filter(e=>rootOf(n,e)===id);
    function change(fn){const next=Core.clone(data);fn(next);storage.setItem(KEY,JSON.stringify(next));data=next;return Core.clone(projectOf(current()));}
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
      addBuilding(building,{activeLevelId}={}){Building.validate(building);return change(n=>{const id=Core.id('prj');n.entries.push({id,name:building.name,kind:'building',building:Core.clone(building),activeLevelId:activeLevelId||building.levels[0].id});n.activeId=id;});},
      importBuilding(visible,building,value){Core.validate(visible);Building.validate(building);const title=name(value);return change(n=>{const active=entry(n,n.activeId);if(active.kind==='building')active.building=Building.setProject(active.building,active.activeLevelId,visible);else active.project=Core.clone(visible);const id=Core.id('prj'),b=Core.clone(building);b.name=title;n.entries.push({id,name:title,kind:'building',building:b,activeLevelId:b.levels[0].id});n.activeId=id;});},
      add(project,value){Core.validate(project);const title=name(value);return change(n=>{const id=Core.id('prj');n.entries.push({id,name:title,project:Core.clone(project)});n.activeId=id;});},
      // File imports preserve the visible original and create a separate entry in one atomic write.
      importProject(visible,project,value){Core.validate(visible);Core.validate(project);const title=name(value);return change(n=>{store(entry(n,n.activeId),visible);const id=Core.id('prj');n.entries.push({id,name:title,project:Core.clone(project)});n.activeId=id;});},
      save(project){Core.validate(project);return change(n=>{store(entry(n,n.activeId),project);});},
      open(id){return change(n=>{entry(n,id);n.activeId=id;});},
      rename(id,value){const title=name(value);return change(n=>{const e=entry(n,id);e.name=title;if(e.kind==='building'){e.building.name=title;Building.validate(e.building);}else e.project.name=title;});},
      create(value){const title=name(value);return change(n=>{const id=Core.id('prj'),project=Core.initial();project.id=Core.id('prj');n.entries.push({id,name:title,project});n.activeId=id;});},
      duplicate(id,value){const title=name(value);return change(n=>{const source=entry(n,id),newId=Core.id('prj');if(source.kind==='building'){const b=Building.duplicate(source.building,title),order=levelOf(source).order;n.entries.push({id:newId,name:title,kind:'building',building:b,activeLevelId:b.levels[order].id});}else{const project=Core.clone(source.project);project.id=Core.id('prj');n.entries.push({id:newId,name:title,project});}n.activeId=newId;});},
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
      variant(visible,value){Core.validate(visible);return change(n=>{const active=entry(n,n.activeId),root=rootOf(n,active)||active.id;
        if(variantsOf(n,root).length>=MAX_VARIANTS)throw Error(`Cada distribución admite hasta ${MAX_VARIANTS} variantes (${MAX_VARIANTS+1} distribuciones para comparar).`);
        const title=name(value===undefined?this.variantName(n.activeId):value);if(n.entries.some(x=>x.name===title))throw Error('Ya existe un proyecto con ese nombre');
        store(active,visible);const id=Core.id('prj');
        if(active.kind==='building'){const b=Building.duplicate(active.building,title),order=levelOf(active).order;n.entries.push({id,name:title,kind:'building',building:b,activeLevelId:b.levels[order].id,variantOf:root});}
        else{const project=Core.clone(visible);project.id=Core.id('prj');project.name=title;Core.validate(project);n.entries.push({id,name:title,project,variantOf:root});}n.activeId=id;});}
    };
  }
  const api={load,KEY,MAX_VARIANTS};if(typeof module==='object')module.exports=api;else root.FloorPlanLibrary=api;
})(typeof globalThis==='object'?globalThis:this);
