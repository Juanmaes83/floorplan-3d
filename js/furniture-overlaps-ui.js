/* Furniture that overlaps other furniture in the open plan (one level, or the active level of a building). A chip over
   the plan says so and «Ver» selects the overlapping items one by one, in 2D and 3D. Nothing is moved: an existing or
   imported layout is the professional's data and the person decides how to fix it. Same rule as the layout review
   (FloorPlanLayoutReview): stacking by design — a hob or sink set into a worktop, rugs, wall-hung units — is not an
   overlap. Adding and duplicating already avoid overlaps (placeFurniture); a manual drag stays the person's decision
   and shows up here. Classic script: shares the app's globals (project, select, nm, LANG). */
(function(){
 const stage=document.querySelector('#stage');if(!stage)return;
 const es=()=>typeof LANG==='undefined'||LANG==='es';
 const chip=document.createElement('div');chip.id='furnitureOverlaps';chip.className='furniture-overlaps';chip.setAttribute('role','status');chip.setAttribute('aria-live','polite');chip.hidden=true;
 const text=document.createElement('span'),see=document.createElement('button');see.type='button';see.className='btn';see.id='furnitureOverlapsNext';
 chip.append(text,' ',see);stage.append(chip);
 let ids=[],next=0,shown='';
 const name=id=>{const o=(project.objects||[]).find(x=>x.id===id);return o?(typeof nm==='function'?nm(o.name||o.type):o.name||o.type):id;};
 function overlaps(){try{return FloorPlanLayoutReview.review(project).findings.filter(f=>f.code==='solape').map(f=>f.objects);}catch{return [];}}
 function render(){
  const pairs=overlaps();ids=[...new Set(pairs.flat())];chip.hidden=!pairs.length;
  const key=pairs.map(p=>p.join('+')).join('|');if(key!==shown){next=0;shown=key;}
  if(!pairs.length)return;
  text.textContent=pairs.length===1
   ?(es()?`⚠ «${name(pairs[0][0])}» y «${name(pairs[0][1])}» se solapan`:`⚠ "${name(pairs[0][0])}" and "${name(pairs[0][1])}" overlap`)
   :(es()?`⚠ ${ids.length} muebles se solapan`:`⚠ ${ids.length} items overlap`);
  see.textContent=ids.length>1?(es()?`Ver (${next%ids.length+1}/${ids.length})`:`Show (${next%ids.length+1}/${ids.length})`):(es()?'Ver':'Show');
  see.title=es()?'Selecciona el mueble en el plano. No se mueve nada.':'Selects the item on the plan. Nothing is moved.';
 }
 see.onclick=()=>{if(!ids.length)return;const id=ids[next%ids.length];next++;select({kind:'furn',id});render();};
 window.FloorPlanFurnitureOverlaps={render,get ids(){return [...ids];},overlaps};
})();
