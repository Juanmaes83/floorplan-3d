/* FT3D-6 F6-05/22/29/35/39: render resolver truth inside the existing Presentation dialog.
   The controller owns only ephemeral configuration. Domain descriptors and real plans are supplied by the host. */
(function(){
 'use strict';
 const Core=window.FloorPlanPresentationTemplates;
 const text=values=>FloorPlanGuide.text(values,LANG);
 const names={
  'real-estate':['Inmobiliaria','Real estate','房地产'],'developer':['Promotora','Developer','房地产开发'],
  'architecture':['Arquitectura','Architecture','建筑设计'],'renovation':['Reformas','Renovation','翻新'],'interior-design':['Interiorismo','Interior design','室内设计'],
  plan:['Plano','Plan','平面图'],overview:['Vista general','Overview','总览'],section:['Sección dinámica','Dynamic section','动态剖面'],elevation:['Fachada','Façade','立面'],
  'room-tour':['Recorrido por estancias','Room tour','房间导览'],axon:['Vista axonométrica','Axonometric view','轴测图'],'exploded-levels':['Despiece por plantas','Breakdown by levels','分层拆解'],
  solar:['Solar orientativo','Indicative sunlight','日照示意'],'site-context':['Contexto exterior','Site context','场地环境'],
  materials:['Materiales asignados','Assigned materials','已分配材质'],moodboard:['Moodboard','Moodboard','材质板'],'budget-summary':['Resumen de presupuesto','Budget summary','预算摘要'],
  dossier:['Dossier','Dossier','项目资料'],'site-data':['Datos del entorno','Site data','场地数据'],closing:['Cierre','Closing','结束'],video:['Vídeo','Video','视频'],share:['Compartir','Share','分享']
 };
 const policies={required:['Obligatoria','Required','必需'],preferred:['Preferida','Preferred','优先'],optional:['Opcional','Optional','可选'],excluded:['Excluida','Excluded','不包含'],implicit:['Disponible','Available','可用']};
 const states={supported:['Disponible','Available','可用'],partial:['Parcial','Partial','部分可用'],unsupported:['No disponible','Unavailable','不可用'],
  'temporarily-unavailable':['No disponible ahora','Currently unavailable','暂不可用'],'pending-implementation':['Aún sin implementar','Not implemented yet','尚未实现'],'user-disabled':['Desactivada','Disabled','已关闭']};
 const reasons={
  'single-level':['Requiere al menos dos plantas.','Needs at least two levels.','至少需要两个楼层。'],
  'insufficient-valid-levels':['Requiere dos plantas con muros y contorno válidos.','Needs two levels with valid walls and outline.','需要两个具有有效墙体和轮廓的楼层。'],
  'no-levels':['No hay plantas disponibles.','No levels available.','没有可用楼层。'],
  'invalid-level-geometry':['Faltan muros o un contorno válido.','Walls or a valid outline are missing.','缺少墙体或有效轮廓。'],
  'degenerate-building-envelope':['El contorno del edificio no permite esta vista.','The building envelope cannot support this view.','建筑轮廓不支持此视图。'],
  'no-bounds':['No hay un contorno válido para cortar.','No valid bounds for a section.','没有可供剖切的有效轮廓。'],
  'no-crossing':['Ningún plano de corte atraviesa el modelo.','No section plane crosses the model.','没有剖切面穿过模型。'],
  'no-facade-walls':['No hay muros exteriores derivables.','No derivable exterior walls.','无法推导外墙。'],
  'invalid-geometry':['La geometría no permite esta vista.','The geometry cannot support this view.','几何数据不支持此视图。'],
  'no-oriented-facade-walls':['No se puede derivar una fachada válida.','No valid façade can be derived.','无法推导有效立面。'],
  'degenerate-facade':['La fachada no tiene un contorno válido.','The façade has no valid bounds.','立面轮廓无效。'],
  'rooms-none':['No hay estancias válidas seleccionadas.','No valid rooms selected.','未选择有效房间。'],
  'minimum-unmet':['Falta contenido necesario para esta historia.','Required story content is missing.','缺少故事所需内容。'],
  'presentation-plan-unavailable':['El plano de presentación necesita al menos una estancia válida.','The presentation plan needs at least one valid room.','展示方案至少需要一个有效房间。'],
  'no-eligible-overview':['No existe una vista general compatible en esta presentación.','This presentation has no compatible overview.','此展示没有兼容的总览。'],
  'solar-unavailable':['Configura norte, ubicación y hora en Orientación y solar.','Set north, location and time in Orientation and solar.','请在朝向与日照中设置北向、位置和时间。'],
  'resource-unavailable':['Sin datos disponibles para este recurso.','No data available for this resource.','此资源暂无数据。'],
  'site-data-unavailable':['No hay datos del entorno cargados.','No site data loaded.','未载入场地数据。'],
  excluded:['Este contenido no forma parte de la plantilla V1.','This content is excluded by this V1 template.','此 V1 模板不包含该内容。']
 };
 const warningCopy={
  'minimum-unmet':['No se puede iniciar esta historia: falta contenido necesario.','This story cannot start: required content is missing.','无法开始：缺少必需内容。'],
  'presentation-plan-unavailable':['Contenido válido, pero no hay un plano de presentación ejecutable.','Valid content, but no executable presentation plan.','内容有效，但没有可执行的展示方案。'],
  'rooms-none':['Selecciona al menos una estancia válida.','Select at least one valid room.','请选择至少一个有效房间。'],
  'rooms-unclassified':['Hay estancias sin familia: se ordenan por área, sin deducir su uso del nombre.','Unclassified rooms are ordered by area; their names do not determine their use.','未分类房间按面积排序，不根据名称推断用途。'],
  'rooms-trimmed':['La selección automática se ha reducido por diversidad y duración recomendada.','Automatic selection was reduced for diversity and the recommended length.','自动选择已按多样性和建议时长精简。'],
  'room-budget-exceeded':['Se conserva tu selección completa; supera las 6 estancias recomendadas.','Your full selection is kept; it exceeds the recommended 6 rooms.','保留全部选择，已超过建议的 6 个房间。'],
  'room-missing':['Una estancia elegida ya no existe. Revisa la selección propuesta antes de iniciar.','A chosen room no longer exists. Review the proposed selection before starting.','所选房间已不存在。开始前请检查建议选择。'],
  'facade-stale':['La fachada elegida ya no existe. Se propone Automática; revísala antes de iniciar.','The chosen façade no longer exists. Automatic is proposed; review it before starting.','所选立面已不存在，现建议自动选择。开始前请检查。'],
  'north-unavailable':['Sin norte configurado: la fachada usa una etiqueta neutral.','North is not configured: the façade uses a neutral label.','未配置北向，立面使用中性名称。'],
  'required-disabled':['Contenido obligatorio desactivado; el mínimo sigue siendo válido.','Required content disabled; the minimum remains valid.','必需内容已关闭，但仍满足最低要求。'],
  'capability-disabled':['Contenido preferido desactivado para esta sesión.','Preferred content disabled for this session.','本次展示已关闭优先内容。'],
  'override-rejected':['La opción solicitada no se puede aplicar; se conserva una combinación válida.','The requested option cannot be applied; a valid combination is retained.','无法应用所选选项，已保留有效组合。'],
  'solar-unavailable':['Solar no disponible; la fachada continúa sin él.','Sunlight is unavailable; the façade continues without it.','日照示意不可用，立面仍可展示。'],
  'solar-no-host':['Solar necesita una fachada incluida.','Sunlight needs an included façade.','日照示意需要包含立面。'],
  'site-context-no-host':['El contexto exterior sólo acompaña a la fachada.','Site context accompanies only the façade.','场地环境仅随立面展示。'],
  'adapter-anchor-unavailable':['Se omite una vista: falta su vista general de entrada.','A view is omitted: its entry overview is missing.','已省略一个视图：缺少起始总览。'],
  'adapter-runtime-failure':['No se pudo mostrar esta vista. Se restaura el estado y se revisa el mínimo de la historia.','This view could not be shown. State is restored and the story minimum is checked.','无法显示此视图。恢复状态并检查故事最低要求。']
 };
 const name=id=>text(names[id]||[id,id,id]);
 const reason=code=>code?text(reasons[code]||['No disponible','Unavailable','不可用'])+(reasons[code]?'':` (${code})`):'';
 function warningText(w,snapshot){
  const partial=w.code.endsWith('-partial'),unsupported=w.code.endsWith('-unsupported');
  const base=warningCopy[w.code]||(partial?['Cobertura parcial: se omiten datos no válidos.','Partial coverage: invalid data is omitted.','部分覆盖：省略无效数据。']:unsupported?['Este contenido no está disponible y se omite.','This content is unavailable and omitted.','此内容不可用，已省略。']:['Aviso de presentación.','Presentation notice.','展示提示。']);
  const parts=[text(base)];if(w.capability)parts.push(name(w.capability));if(w.params?.reason)parts.push(reason(w.params.reason));
  if(w.params?.excluded?.length)parts.push(w.params.excluded.map(x=>snapshot?.levels.find(l=>l.levelId===x.levelId)?.name||String(x.levelId??'')).join(', '));
  return parts.filter(Boolean).join(' · ');
 }
 const el=(tag,value,parent,cls)=>{const n=document.createElement(tag);if(value!==undefined)n.textContent=value;if(cls)n.className=cls;parent?.append(n);return n;};
 function create({parent,snapshot,getRuntime,getPlan,onChange,isLocked=()=>false}){
  const panel=el('section',undefined,null,'presentation-template');panel.id='presentationTemplates';
  parent.insertBefore(panel,parent.children[1]||null);
  const label=el('label',undefined,panel,'presentation-template-picker');el('span',text(['Plantilla profesional','Professional template','专业模板']),label);
  const select=el('select',undefined,label);select.id='presentationTemplate';
  const none=el('option',text(['Sin plantilla','No template','不使用模板']),select);none.value='';
  for(const t of Core.catalog.templates){const op=el('option',name(t.id),select);op.value=t.id;}
  const hint=el('p',text(['Sólo para esta presentación. Sin plantilla conserva tus opciones manuales.','For this presentation only. No template keeps your manual options.','仅用于本次展示。不使用模板会保留手动选项。']),panel,'presentation-template-hint');hint.id='presentationTemplateHint';select.setAttribute('aria-describedby',hint.id);
  const body=el('div',undefined,panel);body.id='presentationTemplateBody';body.hidden=true;
  let session=Core.defaultSession(),resolved=null,materialized=null;
  const run=options=>{const runtime=getRuntime(),first=Core.resolveTemplate({template:options.templateId,capabilitySnapshot:snapshot,runtime,sessionOptions:options});if(!first)return {resolved:null,materialized:null};
   const plan=getPlan(first.selectedRooms),result=Core.resolveTemplate({template:options.templateId,capabilitySnapshot:snapshot,runtime:{...runtime,presentationPlanAvailable:!!plan},sessionOptions:options});
   const materialized=Core.materialize(result,plan);
   if(materialized.warnings.length){result.warnings.push(...materialized.warnings);if(result.status==='ready')result.status='degraded';}
   return {resolved:result,materialized};};
  function update(options,{renderRooms=true}={}){
   if(isLocked())return;const focus=panel.contains(document.activeElement)?document.activeElement.id:null,expanded=[...body.querySelectorAll('details')].map(n=>n.open);
   session=options;const result=run(session);resolved=result.resolved;materialized=result.materialized;
   if(resolved)session=resolved.sessionOptions;select.value=session.templateId||'';draw();body.querySelectorAll('details').forEach((n,i)=>{n.open=!!expanded[i];});onChange(resolved,{renderRooms,materialized});
   if(focus)panel.querySelector('#'+CSS.escape(focus))?.focus({preventScroll:true});
  }
  const set=(patch,flags)=>update({...session,...patch,toggles:{...session.toggles,...(patch.toggles||{})}},flags);
  function draw(){
   body.replaceChildren();body.hidden=!resolved;if(!resolved)return;panel.dataset.state=resolved.status;
   const status=el('p',text(resolved.status==='ready'?['Lista para presentar','Ready to present','可以展示']:resolved.status==='degraded'?['Lista con avisos','Ready with notices','可展示，请注意提示']:['No disponible para este proyecto','Unavailable for this project','此项目暂不可用']),body,'presentation-template-state');status.id='presentationTemplateStatus';status.setAttribute('role','status');
   el('p',text(['La historia usa los datos y vistas disponibles. Una entrada animada por planta; el resto de estancias son paradas.','The story uses available data and views. One animated room entry per level; other rooms are stops.','故事使用现有数据和视图。每层一次房间进入动画，其余房间使用停靠视图。']),body,'presentation-template-hint');
   if(resolved.warnings.length){const warnings=el('ul',undefined,body,'presentation-template-warnings');warnings.id='presentationTemplateWarnings';for(const w of resolved.warnings){const li=el('li',warningText(w,snapshot),warnings);li.dataset.code=w.code;}}
   const details=el('details',undefined,body,'presentation-template-options');el('summary',text(['Contenido y opciones','Content and options','内容与选项']),details);
   for(const id of Core.catalog.sessionToggleIds){const c=resolved.decisions.find(c=>c.id===id);if(c.policy==='excluded')continue;
    const row=el('div',undefined,details,'presentation-template-capability'),lab=el('label',undefined,row),input=el('input',undefined,lab);input.type='checkbox';input.id='presentationTemplate-'+id;input.checked=c.included;
    const trial=run({...session,toggles:{...session.toggles,[id]:!c.included}}).resolved;
    input.disabled=!['supported','partial'].includes(c.availability)||(c.included&&trial.rejectedOverrides.includes('toggles.'+id));
    el('span',name(id)+' · '+text(policies[c.policy]),lab);
    const description=el('p',text(states[c.availability])+(c.reason?' · '+reason(c.reason):'')+(input.disabled&&c.included?' · '+text(['Necesaria para el mínimo de esta historia.','Needed for this story minimum.','此故事最低要求所需。']):''),row,'presentation-template-hint');description.id=input.id+'-reason';input.setAttribute('aria-describedby',description.id);
    input.onchange=()=>set({toggles:{[id]:input.checked}});
   }
   const axon=resolved.decisions.find(c=>c.id==='axon'),exploded=resolved.decisions.find(c=>c.id==='exploded-levels');
   if(axon.policy!=='excluded'||exploded.policy!=='excluded'){
    const lab=el('label',undefined,details,'presentation-template-picker');el('span',text(['Lectura del edificio','Reading of the building','建筑解读']),lab);const pick=el('select',undefined,lab);pick.id='presentationTemplateBuildingReading';
    const labels={automatic:['Automática','Automatic','自动'],compact:names.axon,exploded:names['exploded-levels'],off:['Sin lectura del edificio','No building reading','不使用建筑解读']};
    for(const value of ['automatic','compact','exploded','off']){const option=el('option',text(labels[value]),pick);option.value=value;const trial=run({...session,buildingReading:value}).resolved;option.disabled=value!=='automatic'&&trial.rejectedOverrides.includes('buildingReading');}
    pick.value=session.buildingReading;pick.onchange=()=>set({buildingReading:pick.value});
    const description=el('p',[text(['Aplicada','Applied','当前使用'])+': '+(resolved.buildingReading?name(resolved.buildingReading):text(labels.off)),
     name('axon')+' · '+text(policies[axon.policy])+' · '+text(states[axon.availability])+(axon.reason?' · '+reason(axon.reason):''),
     name('exploded-levels')+' · '+text(policies[exploded.policy])+' · '+text(states[exploded.availability])+(exploded.reason?' · '+reason(exploded.reason):''),
     text(['Despiece espacial, no secuencia constructiva.','Spatial breakdown, not a construction sequence.','空间拆解，不代表施工顺序。'])].join(' — '),details,'presentation-template-hint');description.id='presentationTemplateBuildingReason';pick.setAttribute('aria-describedby',description.id);
   }
   const elevation=resolved.decisions.find(c=>c.id==='elevation');
   if(elevation.included){const lab=el('label',undefined,details,'presentation-template-picker');el('span',name('elevation'),lab);const pick=el('select',undefined,lab);pick.id='presentationTemplateFacade';
    const auto=el('option',text(['Automática','Automatic','自动']),pick);auto.value='automatic';for(const c of elevation.details.candidates){const op=el('option',c.label.replace('Fachada',text(['Fachada','Façade','立面'])),pick);op.value=c.id;}
    pick.value=session.facade;pick.onchange=()=>set({facade:pick.value});
   }
   const solar=resolved.decisions.find(c=>c.id==='solar');if(solar.policy!=='excluded'){
    const lab=el('label',undefined,details,'presentation-template-capability'),input=el('input',undefined,lab);input.type='checkbox';input.id='presentationTemplateSolar';input.checked=solar.included;input.disabled=solar.availability!=='supported'||!elevation.included;el('span',name('solar')+' · '+text(policies.optional),lab);
    const note=el('p',input.disabled?reason(solar.reason||'solar-no-host'):text(['Usa el resultado solar orientativo actual; no es un estudio ni una certificación.','Uses the current indicative sunlight result; not a study or certification.','使用当前日照示意结果，不构成研究或认证。']),details,'presentation-template-hint');note.id='presentationTemplateSolarReason';input.setAttribute('aria-describedby',note.id);input.onchange=()=>set({solar:input.checked});
   }
   const resourceDetails=el('details',undefined,body,'presentation-template-options');el('summary',text(['Recursos y salidas recomendadas','Resources and recommended outputs','资源与建议输出']),resourceDetails);
   const resources=el('ul',undefined,resourceDetails);for(const c of resolved.resources)el('li',name(c.id)+' · '+text(states[c.availability]),resources);
   el('p',text(['Salidas recomendadas','Recommended outputs','建议输出'])+': '+resolved.recommendations.outputs.map(name).join(' · '),resourceDetails,'presentation-template-hint');
   const reset=el('button',text(['Restaurar opciones de la plantilla','Reset template options','重置模板选项']),body,'btn');reset.type='button';reset.id='presentationTemplateReset';reset.onclick=()=>update(Core.resetSession(session));
  }
  select.onchange=()=>update(Core.defaultSession(select.value||null));
  return {get selected(){return !!session.templateId;},get resolved(){return resolved;},get materialized(){return materialized;},get session(){return {...session,toggles:{...session.toggles}};},
   changeRooms(rooms){if(session.templateId)set({rooms},{renderRooms:false});},recompute(){update(session,{renderRooms:false});},dispose(){panel.remove();}};
 }
 window.FloorPlanPresentationTemplatesUI={create,name,warningText};
})();
