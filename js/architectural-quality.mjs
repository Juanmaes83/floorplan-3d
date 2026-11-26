// One session-local control for visual quality. No access to the project store.
// F03 V2: «Fachadas ▾» junto a «Detalle arquitectónico» (sólo visible con el detalle activo). Activación voluntaria,
// reversible y por sesión; explica qué acabados asignados son elegibles y por qué los demás se conservan.
const F03_NAMES={
 white_stucco:['Estuco blanco (F03 V1)','White stucco (F03 V1)','白色灰泥（F03 V1）'],
 rough_plaster_03:['Revoco rugoso (muestra aprobada)','Rough plaster (approved sample)','粗抹灰（已批准样本）'],
 painted_plaster_wall:['Revoco pintado','Painted render','涂装抹灰'],
 patterned_clay_plaster:['Revoco de arcilla texturado','Textured clay render','纹理黏土抹灰'],
 brushed_concrete_03:['Hormigón visto','Exposed concrete','清水混凝土'],
 wood_planks_grey:['Revestimiento de madera','Timber cladding','木饰面']
};
const V2_IDS=new Set(['painted_plaster_wall','patterned_clay_plaster','brushed_concrete_03','wood_planks_grey']);
const REASONS={
 'material-unassigned':['Sin acabado asignado','No finish assigned','未指定饰面'],
 'material-no-facade-source':['Sin material de fachada fiel: se conserva','No faithful facade material: kept as is','无可靠立面材质：保持原样'],
 'material-category-excluded':['Acabado no mural','Not a wall finish','非墙面饰面'],
 'f02-owned-surface':['Superficie de carpintería','Window surface','门窗表面'],
 budget:['Fuera del presupuesto de memoria: se conserva','Outside the memory budget: kept as is','超出内存预算：保持原样']
};
export function mountArchitecturalQuality(view){
 const group=document.createElement('div');
 group.className='grp only3d';
 const button=document.createElement('button');
 button.id='architecturalQuality';
 button.className='btn';
 button.type='button';
 const output=document.createElement('output');
 output.className='sr-only';
 // Keep the live region within the viewport when the mobile header scrolls.
 output.style.insetInlineStart='0';
 output.setAttribute('aria-live','polite');
 // F03 V2 · botón de despliegue + panel. El panel vive en <body> con posición fija: la cabecera crea su propio contexto
 // de apilamiento y recortaba el menú bajo la barra de pestañas.
 const menu=document.createElement('button');menu.id='facadeV2Menu';menu.type='button';menu.className='btn facade-v2-menu';menu.hidden=true;
 menu.setAttribute('aria-expanded','false');menu.setAttribute('aria-controls','facadeV2Pop');
 const summary=menu;
 const pop=document.createElement('div');pop.className='layers-pop facade-v2-pop';pop.id='facadeV2Pop';pop.setAttribute('role','group');pop.hidden=true;
 const switchLabel=document.createElement('label');switchLabel.className='facade-v2-switch';
 const toggle=document.createElement('input');toggle.type='checkbox';toggle.id='facadeV2Toggle';toggle.setAttribute('role','switch');
 const switchText=document.createElement('span');const switchTitle=document.createElement('b');const switchHelp=document.createElement('small');
 switchText.append(switchTitle,switchHelp);switchLabel.append(toggle,switchText);
 const status=document.createElement('p');status.id='facadeV2Status';status.className='facade-v2-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
 const list=document.createElement('ul');list.id='facadeV2List';list.className='facade-v2-list';
 pop.append(switchLabel,status,list);
 group.append(button,menu,output);document.body.append(pop);
 pop.setAttribute('aria-labelledby','facadeV2Menu');
 // §5.1 · Se abre hacia donde cabe (hacia arriba desde la barra inferior) y nunca sale de la ventana.
 const place=()=>{const r=menu.getBoundingClientRect(),w=Math.min(380,innerWidth-24);pop.style.left=Math.max(12,Math.min(r.left,innerWidth-w-12))+'px';pop.style.width=w+'px';
  const below=innerHeight-r.bottom-18,above=r.top-18;pop.style.maxHeight='none';const need=pop.scrollHeight;
  if(need<=below||below>=above){pop.style.bottom='auto';pop.style.top=(r.bottom+6)+'px';pop.style.maxHeight=Math.max(120,below)+'px';}
  else{pop.style.top='auto';pop.style.bottom=(innerHeight-r.top+6)+'px';pop.style.maxHeight=Math.max(120,above)+'px';}};
 const setOpen=open=>{pop.hidden=!open;menu.setAttribute('aria-expanded',String(open));if(open){place();update();}};
 menu.addEventListener('click',()=>setOpen(pop.hidden));
 pop.addEventListener('keydown',e=>{if(e.key==='Escape'){e.stopPropagation();setOpen(false);menu.focus();}});
 menu.addEventListener('keydown',e=>{if(e.key==='Escape'&&!pop.hidden){e.stopPropagation();setOpen(false);}});
 document.addEventListener('pointerdown',e=>{if(!pop.hidden&&!pop.contains(e.target)&&!menu.contains(e.target))setOpen(false);});
 addEventListener('resize',()=>{if(!pop.hidden)place();});
 document.getElementById('roofGroup').after(group);
 const style=document.createElement('style');
 style.textContent='.facade-v2-pop{position:fixed!important;z-index:80!important;min-width:0;max-height:min(70vh,calc(100dvh - 120px));overflow:auto;padding:10px;gap:8px}.facade-v2-pop[hidden]{display:none!important}'+
  '.facade-v2-switch{display:flex;gap:10px;align-items:flex-start;cursor:pointer;min-height:44px}.facade-v2-switch input{width:22px;height:22px;margin-top:2px;flex:none}'+
  '.facade-v2-switch span{display:flex;flex-direction:column;gap:2px}.facade-v2-switch small,.facade-v2-status,.facade-v2-list{font-size:12px;color:var(--ink-muted,#5c544a)}'+
  '.facade-v2-status{margin:0}.facade-v2-list{margin:0;padding:0;list-style:none;display:grid;gap:4px}.facade-v2-list li{display:flex;justify-content:space-between;gap:10px;border-top:1px solid var(--line,#e3ddd3);padding-top:4px}'+
  '.facade-v2-list li b{font-weight:600;color:var(--ink,#2b2620)}.facade-v2-list li[data-eligible="false"] b{font-weight:500}'+
  // Jerarquía visual: lo que se aplica (muestra real + etiqueta de resolución) frente a lo que se conserva (atenuado).
  '.facade-v2-list li{align-items:center;justify-content:flex-start;padding:6px 0 4px}.facade-v2-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}'+
  '.facade-v2-text b{font-size:13px}.facade-v2-swatch{flex:none;width:30px;height:30px;border-radius:6px;background-size:cover;background-position:center;box-shadow:inset 0 0 0 1px rgba(0,0,0,.12)}'+
  '.facade-v2-list li[data-eligible="false"]{opacity:.72}.facade-v2-list li[data-eligible="false"] .facade-v2-swatch{width:22px;height:22px;margin:0 4px;background-image:repeating-linear-gradient(135deg,rgba(0,0,0,.10) 0 2px,transparent 2px 6px)!important}'+
  '.facade-v2-tag{flex:none;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;letter-spacing:.02em;background:var(--surface-sunken,#efe9de);color:var(--ink-muted,#5c544a)}'+
  '.facade-v2-tag[data-tier="hero"]{background:var(--action,#1f5a66);color:#fff}.facade-v2-list li[data-warn="true"] .facade-v2-text span{color:#8a5a10}'+
  '.facade-v2-status{font-size:13px;font-weight:600;color:var(--ink,#2b2620)}';
 document.head.append(style);

 // RUBIK marca el chino como «zh-CN»: se usa el prefijo del idioma (en master el control salía en español en ZH).
 const localized=(es,en,zh)=>({en,zh}[(document.documentElement.lang||'es').slice(0,2)]||es);
 const L=t=>localized(...t);
 const surfaceName=preset=>globalThis.FloorPlanSurfaces?.get?.(preset)?.name||preset||'—';
 function renderList(facade){
  list.replaceChildren();
  const rows=new Map();
  for(const c of facade.candidates||[]){
   if(c.reason==='interior-wall'||c.reason==='exterior-unavailable'||c.reason==='project-mismatch')continue;
   const key=c.eligible?'ok:'+c.materialId:(c.reason==='material-no-facade-source'?'no:'+c.preset:'no:'+c.reason);
   const row=rows.get(key)||{eligible:c.eligible,materialId:c.materialId,preset:c.preset,reason:c.reason,walls:new Set()};row.walls.add(c.wallId);rows.set(key,row);
  }
  const plan=new Map((facade.materials||[]).map(m=>[m.materialId,m]));
  for(const row of [...rows.values()].sort((a,b)=>Number(b.eligible)-Number(a.eligible)||b.walls.size-a.walls.size)){
   const li=document.createElement('li');li.dataset.eligible=String(row.eligible);const name=document.createElement('b'),detail=document.createElement('span');
   // Jerarquía: muestra del acabado (textura real V2 o color del catálogo), nombre + detalle, y la resolución como etiqueta.
   const sw=document.createElement('span');sw.className='facade-v2-swatch';sw.setAttribute('aria-hidden','true');
   const color=globalThis.FloorPlanSurfaces?.get?.(row.preset)?.color;if(color)sw.style.backgroundColor=color;
   if(row.eligible&&V2_IDS.has(row.materialId))sw.style.backgroundImage=`url("assets/materials/f03/v2/${row.materialId}/balanced/albedo.webp")`;
   const text=document.createElement('span');text.className='facade-v2-text';const tag=document.createElement('span');tag.className='facade-v2-tag';
   const n=row.walls.size,walls=localized(`${n} ${n===1?'muro':'muros'}`,`${n} ${n===1?'wall':'walls'}`,`${n} 面墙`);
   if(row.eligible){
    const m=plan.get(row.materialId);name.textContent=F03_NAMES[row.materialId]?L(F03_NAMES[row.materialId]):row.materialId;
    const state=!facade.decision?.enabled?localized('elegible','eligible','可用'):m?.state==='budget'?L(REASONS.budget):m?.state==='fallback'?localized('fallo de carga: se conserva','load failed: kept as is','加载失败：保持原样'):m?.state==='loading'?localized('cargando','loading','加载中'):m?.profile==='hero'?'HERO 1024':m?.profile?localized('equilibrado 512','balanced 512','均衡 512'):'';
    detail.textContent=[walls,state].filter(Boolean).join(' · ');
   }else{
    name.textContent=row.reason==='material-no-facade-source'?surfaceName(row.preset):L(REASONS[row.reason]||[row.reason,row.reason,row.reason]);
    detail.textContent=row.reason==='material-no-facade-source'?walls+' · '+L(REASONS[row.reason]):walls;
   }
   // La resolución (HERO/equilibrado) sale del propio texto de estado: se muestra como etiqueta y no se repite.
   const tier=/HERO \d+|equilibrado \d+|balanced \d+|平衡 \d+/.exec(detail.textContent);
   if(tier){tag.textContent=tier[0];tag.dataset.tier=/HERO/.test(tier[0])?'hero':'balanced';detail.textContent=detail.textContent.replace(' · '+tier[0],'');}
   if(row.eligible&&/fallo|failed|失败|presupuesto|budget|预算/.test(detail.textContent))li.dataset.warn='true';
   text.append(name,detail);li.append(sw,text);if(tag.textContent)li.append(tag);list.append(li);
  }
 }
 const update=()=>{
  const {enabled,windows,facade,error,facadeV2}=view.architecturalQuality();
  button.textContent=localized('Detalle arquitectónico','Architectural detail','建筑细节');
  button.setAttribute('aria-pressed',String(enabled));
  summary.textContent=localized('Fachadas ▾','Facades ▾','立面 ▾');
  switchTitle.textContent=localized('Materiales de fachada fieles · experimental','Faithful facade materials · experimental','可靠立面材质 · 实验');
  switchHelp.textContent=localized('Usa la versión PBR completa del acabado asignado a cada muro exterior. Sólo en esta sesión: no cambia el proyecto.','Uses the full PBR version of the finish assigned to each exterior wall. This session only: the project is not changed.','为每面外墙使用所指定饰面的完整 PBR 版本。仅限本次会话：不修改项目。');
  menu.hidden=!enabled;if(!enabled&&!pop.hidden){pop.hidden=true;menu.setAttribute('aria-expanded','false');}
  toggle.checked=!!facadeV2;
  if(!enabled){output.textContent='';status.textContent='';list.replaceChildren();return;}
  output.textContent=facade.status==='loading'
   ?localized('Cargando detalle de fachada','Loading facade detail','正在加载立面细节')
   :localized(
    `Carpinterías: ${windows}. Fachadas: ${facade.active.length}.`,
    `Windows: ${windows}. Facades: ${facade.active.length}.`,
    `窗户：${windows}。立面：${facade.active.length}。`);
  if(error||facade.status==='fallback'){
   output.textContent+=' '+localized('Se conservan los acabados de respaldo.','Fallback finishes preserved.','已保留备用饰面。');
  }
  const walls=new Set(facade.active).size,v2=facade.version===2;
  status.textContent=!facadeV2?localized('Desactivado: se ve el detalle arquitectónico de siempre.','Off: the usual architectural detail is shown.','已关闭：显示常规建筑细节。')
   :facade.status==='loading'?localized('Cargando materiales de fachada…','Loading facade materials…','正在加载立面材质…')
   :facade.status==='unavailable'?localized('Ningún muro exterior tiene un acabado con material de fachada fiel.','No exterior wall has a finish with a faithful facade material.','没有外墙使用具备可靠立面材质的饰面。')
   :facade.status==='fallback'?localized('No se pudieron cargar: se conservan los acabados.','Could not load: finishes kept as is.','无法加载：保持原有饰面。')
   :localized(`Activo en ${walls} ${walls===1?'muro':'muros'}${facade.status==='partial'?' (parcial)':''}.`,`Active on ${walls} ${walls===1?'wall':'walls'}${facade.status==='partial'?' (partial)':''}.`,`已应用于 ${walls} 面墙${facade.status==='partial'?'（部分）':''}。`);
  if(v2||!facadeV2)renderList(v2?facade:{...facade,candidates:previewCandidates(),materials:[],decision:{enabled:false}});
 };
 // Con V2 apagado, la lista se calcula sobre la misma clasificación del adaptador, sin cargar nada.
 function previewCandidates(){try{return view.facadeFidelityV2Preview?.()||[];}catch{return [];}}
 button.addEventListener('click',()=>{
  try{view.setArchitecturalQuality(!view.architecturalQuality().enabled);update();}
  catch{output.textContent=localized('Detalle no disponible en esta vista.','Detail unavailable in this view.','此视图无法显示细节。');}
 });
 toggle.addEventListener('change',()=>{
  try{const done=view.setFacadeFidelityV2(toggle.checked);update();done?.then?.(update);}
  catch(e){toggle.checked=!toggle.checked;status.textContent=e.message;}
  toggle.focus();
 });
 addEventListener('architectural-quality-status',update);
 addEventListener('facade-fidelity-status',update);
 new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
}
