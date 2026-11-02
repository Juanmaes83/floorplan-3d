/* FT3D-6 (F6-02/07/09/11/18/19/22/29/35/46): professional composition over Rubik authorities.
   Data in, serializable decisions out. Adapters refer to the existing player; no view or domain edits. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanPresentationTemplates=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const copy=value=>value===undefined?null:JSON.parse(JSON.stringify(value));
 const freeze=value=>{if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;};
 const supported=value=>['supported','partial'].includes(value?.availability);
 const pair=room=>JSON.stringify([room.levelId??null,room.roomId]);
 const scopes=['project','building','level','facade','room','room-collection'];
 const coverages=['any','level','all-presented-levels','building'];
 const families=['atomic-scene','composite','anchor','enhancement','resource','story-structure'];
 const policies=['required','preferred','optional','excluded'];
 const availability=['supported','partial','unsupported','temporarily-unavailable','user-disabled','pending-implementation'];
 const controlled=['plan','section','elevation','room-tour'];
 const resourceIds=['materials','moodboard','budget-summary','dossier','site-data'];
 const adapters=[
  ['plan-reveal','level','start-held'],['section-open','level','holds'],['elevation-open','building','holds'],
  ['room-descent','room-collection','start-held'],['axon-open','building','holds'],['exploded-levels-open','building','holds']
 ].map(([id,scope,reducedMotionSupport])=>({id,scope,reducedMotionSupport}));
 function capability(id,family,scope,coverage,adapterId=null,reducedMotionSupport='holds'){
  return {id,family,version:1,availability:'unsupported',reason:'capability-unavailable',scope,coverages:coverage,targets:[],
   repeatable:scope==='level'||scope==='room-collection',maxOccurrences:scope==='level'||scope==='room-collection'?null:1,repeatScope:scope,
   startAnchor:adapterId?(id==='plan'?'plan(level)':'overview(level)'):null,
   endAnchor:adapterId?(id==='room-tour'?'room(level,roomId)':'overview(level)'):null,
   requires:[],compatibleHosts:[],reducedMotionSupport,adapterId,details:{}};
 }
 const capabilities=[
  capability('plan','anchor','level',['any','level','all-presented-levels'],'plan-reveal','start-held'),
  capability('overview','anchor','level',['any','level','all-presented-levels']),
  capability('section','atomic-scene','level',['any','level','all-presented-levels'],'section-open'),
  capability('elevation','atomic-scene','building',['any','building'],'elevation-open'),
  capability('room-tour','composite','room-collection',['any','level','all-presented-levels'],'room-descent','start-held'),
  capability('axon','atomic-scene','building',['any','building'],'axon-open'),
  capability('exploded-levels','atomic-scene','building',['any','building'],'exploded-levels-open'),
  capability('solar','enhancement','facade',['any']),capability('site-context','enhancement','building',['any']),
  ...resourceIds.map(id=>capability(id,'resource','project',['any'])),capability('closing','story-structure','project',['any'])
 ];
 for(const c of capabilities){
  if(c.id==='axon')c.details.variant='compact-building';
  if(c.id==='exploded-levels')c.details.variant='vertical-levels';
  if(c.id==='solar'){c.requires=['elevation'];c.compatibleHosts=['elevation'];}
  if(c.id==='site-context'){c.requires=['elevation','site-data'];c.compatibleHosts=['elevation'];}
 }
 const atom=(capability,coverage)=>({capability,...(coverage?{coverage}:{})});
 const any=(...items)=>({oneOf:items.map(x=>typeof x==='string'?atom(x):x)});
 const all=(...items)=>({allOf:items.map(x=>typeof x==='string'?atom(x):x)});
 const profileRows=[
  ['real-estate',['preferred','optional','preferred','required','excluded','excluded','excluded'],all(any('plan','overview','axon'),'room-tour'),['living','kitchen','bedroom','bathroom'],[],['video','share']],
  ['developer',['preferred','optional','preferred','preferred','preferred','preferred','optional'],any(atom('overview','building'),atom('plan','all-presented-levels'),atom('elevation','building'),atom('axon','building'),atom('exploded-levels','building')),['living','kitchen','bedroom'],['exploded-levels','axon'],['dossier','share','video']],
  ['architecture',['required','preferred','preferred','preferred','preferred','optional','optional'],all('plan',any('section','elevation','axon','exploded-levels')),['living','kitchen','bedroom','office'],['axon'],['dossier','share']],
  ['renovation',['required','preferred','optional','preferred','excluded','excluded','excluded'],all('plan',any('room-tour','section')),['kitchen','bathroom','living','bedroom'],[],['dossier','budget-summary']],
  ['interior-design',['preferred','optional','excluded','required','excluded','excluded','excluded'],all(any('overview','plan','axon'),'room-tour'),['living','bedroom','dining','office'],[],['moodboard','share']]
 ];
 const policyIds=['plan','section','elevation','room-tour','axon','exploded-levels','solar'];
 const templates=profileRows.map(([id,row,minimumStory,roomFamilies,buildingReading,outputs])=>({id,version:1,
  policies:{...Object.fromEntries(policyIds.map((key,i)=>[key,row[i]])),closing:'required'},minimumStory,roomFamilies,
  roomBudget:6,buildingReading,outputs}));
 const catalog=freeze({version:1,families,scopes,coverages,capabilities,adapters,templates,sessionToggleIds:controlled});
 const findTemplate=value=>typeof value==='string'?templates.find(t=>t.id===value):value;
 const defaultSession=(templateId=null)=>({templateId,toggles:{},facade:'automatic',rooms:null,solar:false,buildingReading:'automatic'});
 const resetSession=options=>defaultSession(options?.templateId??null);
 const audienceTemplateId=value=>value==='interior'?'interior-design':templates.some(t=>t.id===value)?value:null;
 const keyOf=({entryId,levels=[]})=>({entryId,revisions:levels.map(l=>({levelId:l.levelId??null,projectId:l.projectId??l.project?.id??null,revision:l.revision??null}))});
 const sameKey=(a,b)=>JSON.stringify(a)===JSON.stringify(b);

 function validateCatalog(input=catalog){
  const errors=[],error=(code,path)=>errors.push({code,path});
  if(!input||!Array.isArray(input.capabilities)||!Array.isArray(input.templates)||!Array.isArray(input.adapters))return [{code:'invalid-catalog',path:'catalog'}];
  const caps=new Map(),ads=new Map(),ids=new Set();
  for(const a of input.adapters){if(!a?.id||ads.has(a.id))error('duplicate-adapter','adapters');else ads.set(a.id,a);
   if(!scopes.includes(a?.scope))error('invalid-scope','adapters.'+a?.id);
   if(!['holds','start-held'].includes(a?.reducedMotionSupport))error('invalid-reduced-motion','adapters.'+a?.id);}
  for(const c of input.capabilities){const p='capabilities.'+c?.id;
   if(!c?.id||caps.has(c.id))error('duplicate-capability',p);else caps.set(c.id,c);
   if(!capabilities.some(x=>x.id===c?.id))error('unknown-capability',p);
   if(!families.includes(c?.family))error('unknown-family',p);
   if(!scopes.includes(c?.scope)||!scopes.includes(c?.repeatScope))error('invalid-scope',p);
   if(!Array.isArray(c?.coverages)||c.coverages.some(x=>!coverages.includes(x)))error('invalid-coverage',p);
   if(!availability.includes(c?.availability))error('invalid-availability',p);
   if(!['holds','start-held'].includes(c?.reducedMotionSupport))error('invalid-reduced-motion',p);
   if((['atomic-scene','composite'].includes(c?.family)||c?.id==='plan')&&!c?.adapterId)error('bad-adapter',p);
   if(c?.adapterId&&(!ads.has(c.adapterId)||ads.get(c.adapterId).scope!==c.scope||ads.get(c.adapterId).reducedMotionSupport!==c.reducedMotionSupport))error('bad-adapter',p);
   if(!Array.isArray(c?.requires)||!Array.isArray(c?.compatibleHosts)||!Array.isArray(c?.targets))error('invalid-dependencies',p);
   for(const target of Array.isArray(c?.targets)?c.targets:[])if(!scopes.includes(target?.scope)||!['supported','partial'].includes(c.availability)||(target.scope!==c.scope&&!(c.id==='room-tour'&&target.scope==='room')))error('impossible-target',p);
   if(['axon','exploded-levels'].includes(c?.id)){
    const expected=c.id==='axon'?'compact-building':'vertical-levels';
    if(c.scope!=='building'||c.repeatScope!=='building'||c.repeatable!==false||c.maxOccurrences!==1||c.reducedMotionSupport!=='holds'||c.adapterId!==(c.id==='axon'?'axon-open':'exploded-levels-open')||JSON.stringify(c.coverages)!==JSON.stringify(['any','building'])||c.details?.variant!==expected)error('invalid-building-reading',p);
    if(c.reason==='ft3d5-pending'||c.availability==='pending-implementation')error('ft3d5-pending',p);
   }
   if(c?.id==='site-context'&&JSON.stringify(c.compatibleHosts)!==JSON.stringify(['elevation']))error('invalid-host',p);
  }
  const visiting=new Set(),visited=new Set();
  function visit(id){if(visiting.has(id)){error('cyclic-dependency','capabilities.'+id);return;}if(visited.has(id))return;visiting.add(id);
   for(const next of Array.isArray(caps.get(id)?.requires)?caps.get(id).requires:[]){if(!caps.has(next))error('invalid-requires','capabilities.'+id);else visit(next);}visiting.delete(id);visited.add(id);}
  for(const c of input.capabilities){if(!c?.id)continue;visit(c.id);for(const host of Array.isArray(c.compatibleHosts)?c.compatibleHosts:[])if(!caps.has(host))error('invalid-host','capabilities.'+c.id);}
  function expression(expr,path,seen=new Set()){
   if(!expr||typeof expr!=='object'||seen.has(expr)){error('invalid-minimum',path);return;}const branch=new Set(seen);branch.add(expr);
   if(expr.capability){const c=caps.get(expr.capability),coverage=expr.coverage||'any';
    if(!c)error('unknown-capability',path);
    else if(!coverages.includes(coverage)||(!(Array.isArray(c.coverages)&&c.coverages.includes(coverage))&&!(coverage==='building'&&['plan','overview'].includes(c.id))))error('impossible-coverage',path);
    if(Object.keys(expr).some(k=>!['capability','coverage'].includes(k)))error('invalid-minimum',path);return;}
   const keys=Object.keys(expr),kind=keys[0];if(keys.length!==1||!['allOf','oneOf','atLeast'].includes(kind)){error('invalid-minimum',path);return;}
   const items=kind==='atLeast'?expr.atLeast?.of:expr[kind];
   if(!Array.isArray(items)||!items.length){error('invalid-minimum',path);return;}
   if(kind==='atLeast'&&(!Number.isInteger(expr.atLeast.count)||expr.atLeast.count<1||expr.atLeast.count>items.length))error('invalid-minimum',path);
   items.forEach((item,i)=>expression(item,path+'.'+kind+'.'+i,branch));
  }
  for(const t of input.templates){const p='templates.'+t?.id;
   if(!t?.id||ids.has(t.id))error('duplicate-template',p);ids.add(t?.id);
   if(!t?.policies||typeof t.policies!=='object'){error('invalid-policy',p);continue;}
   for(const [id,policy] of Object.entries(t.policies)){if(!caps.has(id))error('unknown-capability',p+'.'+id);if(!policies.includes(policy))error('invalid-policy',p+'.'+id);}
   expression(t.minimumStory,p+'.minimumStory');
  }
  if(!Array.isArray(input.sessionToggleIds)||input.sessionToggleIds.some(id=>!controlled.includes(id)))error('independent-building-toggle','sessionToggleIds');
  return errors;
 }

 const state=(ok,reason=null,partial=false,details={})=>({availability:ok?(partial?'partial':'supported'):'unsupported',reason:ok?null:reason,details:copy(details)});
 function buildSnapshot(input){
  const levels=(input.levels||[]).map((l,i)=>({levelId:l.levelId??null,name:l.name||'',order:Number.isFinite(l.order)?l.order:i,
   projectId:l.projectId??l.project?.id??null,revision:l.revision??null,hasPlan:!!l.hasPlan,roomCount:(l.rooms||[]).length}));
  const plan=input.plan,overviews=plan?.stops?.filter(s=>s.kind==='overview')||[];
  const sections=levels.map(l=>{const d=(input.sections||[]).find(s=>(s.levelId??null)===l.levelId)?.descriptor;return {levelId:l.levelId,...state(!!d?.supported,d?.reason||'no-bounds')};});
  const elevation=input.elevation,axon=input.axon;
  const reading=id=>{const exploded=id==='explodedLevels',variant=axon?.variants?.[exploded?'exploded':'axon'];
   return {...state(!!axon?.supported&&!!variant?.supported,axon?.supported?variant?.reason:axon?.reason||'no-levels',!!axon?.partial,
    {levelIds:(axon?.levels||[]).map(l=>l.levelId??null),excluded:axon?.excluded||[]}),scope:'building',coverages:['any','building'],variant:exploded?'vertical-levels':'compact-building'};};
  return freeze({version:1,key:keyOf(input),levels,structural:{
   plan:{...state(levels.some(l=>l.hasPlan),'plan-unavailable',levels.some(l=>!l.hasPlan)),targets:levels.filter(l=>l.hasPlan).map(l=>({scope:'level',levelId:l.levelId}))},
   overview:{byLevel:levels.map(l=>({levelId:l.levelId,...state(overviews.some(s=>(s.levelId??null)===l.levelId),'overview-unavailable')})),building:{availability:'unsupported',reason:'overview-building-unavailable'}},
   section:{byLevel:sections},elevation:{...state(!!elevation?.supported,elevation?.reason||'invalid-geometry',!!elevation?.partial,
    {excluded:elevation?.excluded||[],unoriented:!!elevation?.unoriented,candidates:(elevation?.candidates||[]).map(c=>({id:c.id,label:c.label,cardinal:c.cardinal??null})),defaultId:elevation?.defaultId??null})},
   roomTour:{rooms:(input.levels||[]).flatMap((l,li)=>(l.rooms||[]).map((r,ri)=>({levelId:l.levelId??null,roomId:r.roomId??r.id,family:r.family??null,areaM2:Number(r.areaM2)||0,sourceOrder:ri,levelOrder:Number.isFinite(l.order)?l.order:li}))),historicalRooms:copy(input.historicalRooms),missingRooms:input.missingRooms||0},
   axon:reading('axon'),explodedLevels:reading('explodedLevels')},execution:{presentationPlan:{available:!!plan,reason:plan?null:'presentation-plan-unavailable'}},resources:copy(input.resources||{})});
 }
 const reuseSnapshot=(previous,input)=>previous&&sameKey(previous.key,keyOf(input))?previous:buildSnapshot(input);
 function selectRooms(snapshot,template,session){
  const source=snapshot.structural.roomTour.rooms,explicit=session.rooms!==null?session.rooms:snapshot.structural.roomTour.historicalRooms;
  const warnings=[];let selected=[];const warning=(code,params)=>warnings.push({type:'missing-data',code,severity:'info',capability:'room-tour',params});
  if(explicit!==null&&explicit!==undefined){const seen=new Set();let missing=0;
   for(const r of explicit){const key=pair(r),found=source.find(x=>pair(x)===key);if(!found){missing++;continue;}if(!seen.has(key)){seen.add(key);selected.push(found);}}
   if(missing){warning('room-missing',{count:missing});if(!selected.length&&source.length)selected=[source[0]];}
   selected.sort((a,b)=>a.levelOrder-b.levelOrder);
   if(selected.length>template.roomBudget)warning('room-budget-exceeded',{count:selected.length,budget:template.roomBudget});
  }else{
   const useful=r=>!!r.family&&!['unspecified','other'].includes(r.family),rank=r=>{const i=template.roomFamilies.indexOf(r.family);return i>=0?i:template.roomFamilies.length;};
   const sorted=[...source].sort((a,b)=>Number(useful(b))-Number(useful(a))||(useful(a)?rank(a)-rank(b):b.areaM2-a.areaM2)||a.levelOrder-b.levelOrder||a.sourceOrder-b.sourceOrder||(a.roomId<b.roomId?-1:a.roomId>b.roomId?1:0));
   const used=new Set(),first=[],repeat=[];
   for(const r of sorted){if(!useful(r)){repeat.push(r);continue;}if(!used.has(r.family)){first.push(r);used.add(r.family);}else if(!['bedroom','bathroom'].includes(r.family))repeat.push(r);}
   selected=[...first,...repeat].slice(0,template.roomBudget).sort((a,b)=>a.levelOrder-b.levelOrder);
   if(source.length>selected.length)warning('rooms-trimmed',{count:source.length-selected.length,budget:template.roomBudget});
  }
  if(snapshot.structural.roomTour.missingRooms)warning('room-missing',{count:snapshot.structural.roomTour.missingRooms});
  const unclassified=selected.filter(r=>!r.family||['unspecified','other'].includes(r.family)).length;
  if(unclassified)warning('rooms-unclassified',{count:unclassified});
  return {rooms:selected.map(r=>({levelId:r.levelId,roomId:r.roomId})),warnings};
 }

 function normalizeCapabilities(snapshot,runtime={},rooms=[]){
  const s=snapshot.structural,buildingTarget={scope:'building',entryId:snapshot.key.entryId};
  return capabilities.map(base=>{const c=copy(base);let data=null;
   if(c.id==='plan')data=s.plan;
   if(c.id==='overview'){const available=s.overview.byLevel.filter(supported);data={...state(available.length>0,'overview-unavailable',available.length<s.overview.byLevel.length),targets:available.map(l=>({scope:'level',levelId:l.levelId})),details:{building:s.overview.building}};}
   if(c.id==='section'){const available=s.section.byLevel.filter(supported);data={...state(available.length>0,s.section.byLevel[0]?.reason||'no-bounds',available.length<s.section.byLevel.length,{excluded:s.section.byLevel.filter(l=>!supported(l)).map(l=>({levelId:l.levelId,reason:l.reason}))}),targets:available.map(l=>({scope:'level',levelId:l.levelId}))};}
   if(c.id==='elevation')data={...s.elevation,targets:supported(s.elevation)?[buildingTarget]:[]};
   if(c.id==='axon'||c.id==='exploded-levels'){const v=s[c.id==='axon'?'axon':'explodedLevels'];data={...v,details:{...v.details,variant:v.variant},targets:supported(v)?[buildingTarget]:[]};}
   if(c.id==='room-tour')data={...state(rooms.length>0,'rooms-none'),targets:rooms.map(r=>({scope:'room',...r}))};
   if(resourceIds.includes(c.id)){data=snapshot.resources[c.id]||state(false,'resource-unavailable');data={...data,targets:supported(data)?[{scope:'project',entryId:snapshot.key.entryId}]:[]};}
   if(c.id==='closing')data={...state(true),targets:[{scope:'project',entryId:snapshot.key.entryId}]};
   if(c.id==='solar')data={availability:runtime.solarAvailable?'supported':'temporarily-unavailable',reason:runtime.solarAvailable?null:'solar-unavailable',targets:runtime.solarAvailable?s.elevation.details.candidates.map(c=>({scope:'facade',candidateId:c.id})):[]};
   if(c.id==='site-context'){const site=snapshot.resources['site-data'];data={...state(supported(site),'site-data-unavailable'),targets:supported(site)?[buildingTarget]:[]};}
   if(data){c.availability=data.availability;c.reason=data.reason??null;c.targets=copy(data.targets||[]);c.details={...c.details,...copy(data.details||{})};}
   return c;
  });
 }
 function covers(capability,coverage,levels){
  if(!capability?.included||!supported(capability)||!capability.targets.length)return false;
  if(coverage&&!capability.coverages.includes(coverage)&&!(coverage==='building'&&['plan','overview'].includes(capability.id)))return false;
  if(coverage==='any'||!coverage)return true;
  if(coverage==='building')return capability.targets.some(t=>t.scope==='building')||(['plan','overview'].includes(capability.id)&&levels.length===1&&capability.targets.some(t=>t.scope==='level'&&t.levelId===levels[0].levelId));
  if(coverage==='level')return capability.targets.some(t=>t.levelId!==undefined);
  if(coverage==='all-presented-levels')return levels.length>0&&levels.every(l=>capability.targets.some(t=>t.levelId===l.levelId));
  return false;
 }
 function evaluateMinimum(expr,decisions,levels){
  const byId=new Map(decisions.map(c=>[c.id,c]));
  const evaluate=node=>{if(node.capability)return covers(byId.get(node.capability),node.coverage||'any',levels);
   if(node.allOf)return node.allOf.every(evaluate);if(node.oneOf)return node.oneOf.some(evaluate);
   if(node.atLeast)return node.atLeast.of.filter(evaluate).length>=node.atLeast.count;return false;};
  return evaluate(expr);
 }

 function resolveTemplate({template,capabilitySnapshot:snapshot,runtime={},sessionOptions={}}){
  const t=findTemplate(template||sessionOptions.templateId);if(!t)return null;
  const options={...defaultSession(t.id),...copy(sessionOptions),templateId:t.id,toggles:{...(sessionOptions.toggles||{})}};
  const warnings=[],rejectedOverrides=[];
  const warn=(code,capability,type='degradation',severity='warning',params={})=>warnings.push({type,code,severity,...(capability?{capability}:{}),params});
  const reject=(option,reason,capability)=>{rejectedOverrides.push(option);warn('override-rejected',capability,'user-choice','info',{option,reason});};
  for(const id of Object.keys(options.toggles))if(!controlled.includes(id)){delete options.toggles[id];reject('toggles.'+id,'not-a-session-toggle',id);}
  const selection=selectRooms(snapshot,t,options),decisions=normalizeCapabilities(snapshot,runtime,selection.rooms);
  const byId=new Map(decisions.map(c=>[c.id,c]));
  for(const c of decisions){c.policy=t.policies[c.id]||'implicit';c.included=supported(c)&&(c.policy==='required'||c.policy==='preferred'||['overview','closing'].includes(c.id)||c.family==='resource');
   if(controlled.includes(c.id)&&Object.hasOwn(options.toggles,c.id)){
    if(typeof options.toggles[c.id]!=='boolean'||c.policy==='excluded'||(!supported(c)&&options.toggles[c.id])){delete options.toggles[c.id];reject('toggles.'+c.id,c.reason||'excluded',c.id);}
    else c.included=options.toggles[c.id]&&supported(c);
   }
  }
  const chooseAutomatic=()=>t.buildingReading.find(id=>supported(byId.get(id)))||null;
  const modeIds={compact:'axon',exploded:'exploded-levels'};let reading=null;
  if(!['automatic','compact','exploded','off'].includes(options.buildingReading)){options.buildingReading='automatic';reject('buildingReading','invalid-value');}
  if(modeIds[options.buildingReading]){const id=modeIds[options.buildingReading],c=byId.get(id);
   if(c.policy==='excluded'||!supported(c)){reject('buildingReading',c.reason||'excluded',id);options.buildingReading='automatic';}else reading=id;}
  if(options.buildingReading==='automatic')reading=chooseAutomatic();
  const applyReading=()=>{byId.get('axon').included=reading==='axon';byId.get('exploded-levels').included=reading==='exploded-levels';};applyReading();
  let minimum=evaluateMinimum(t.minimumStory,decisions,snapshot.levels);
  if(!minimum&&options.buildingReading==='off'){reject('buildingReading','minimum-unmet');options.buildingReading='automatic';reading=chooseAutomatic();applyReading();minimum=evaluateMinimum(t.minimumStory,decisions,snapshot.levels);}
  for(const c of decisions)if(c.policy==='required'&&options.toggles[c.id]===false&&!minimum){delete options.toggles[c.id];c.included=supported(c);reject('toggles.'+c.id,'minimum-unmet',c.id);minimum=evaluateMinimum(t.minimumStory,decisions,snapshot.levels);}
  const elevation=byId.get('elevation');let facade=null;
  if(elevation.included){const details=elevation.details;
   if(options.facade!=='automatic'&&!details.candidates.some(c=>c.id===options.facade)){options.facade='automatic';warn('facade-stale','elevation','missing-data','warning');}
   facade=options.facade==='automatic'?details.defaultId:options.facade;
   if(details.unoriented)warn('north-unavailable','elevation','missing-data','info');
  }
  const solar=byId.get('solar');solar.included=!!options.solar&&solar.policy!=='excluded'&&supported(solar)&&elevation.included;
  if(options.solar&&!solar.included){warn(elevation.included?'solar-unavailable':'solar-no-host','solar','runtime-unavailable');options.solar=false;}
  const context=byId.get('site-context');context.included=supported(context)&&elevation.included;
  if(supported(context)&&!elevation.included)warn('site-context-no-host','site-context','missing-data','info');
  if(byId.get('room-tour').included)warnings.push(...selection.warnings);
  else if(!selection.rooms.length&&t.policies['room-tour']!=='excluded')warn('rooms-none','room-tour','missing-data','info');
  let degraded=false;
  for(const c of decisions){
   const buildingAlternative=['axon','exploded-levels'].includes(c.id)&&reading!==null;
   if(c.included&&c.availability==='partial'){degraded=true;warn(c.id+'-partial',c.id,'partial','info',{excluded:c.details.excluded||[]});}
   if(['required','preferred'].includes(c.policy)&&!c.included&&!buildingAlternative){degraded=true;
    if(options.toggles[c.id]===false)warn(c.policy==='required'?'required-disabled':'capability-disabled',c.id,'user-choice','info');
    else warn(c.id+'-unsupported',c.id,'degradation','warning',{reason:c.reason});}
  }
  if(t.buildingReading[0]==='exploded-levels'&&!supported(byId.get('exploded-levels')))warn('exploded-levels-unsupported','exploded-levels','missing-data','info',{reason:byId.get('exploded-levels').reason});
  if(!minimum)warn('minimum-unmet',null,'blocking','error');
  const planAvailable=!!snapshot.execution.presentationPlan.available&&runtime.presentationPlanAvailable!==false;
  if(minimum&&!planAvailable)warn('presentation-plan-unavailable',null,'blocking','error');
  let execution={available:minimum&&planAvailable,reason:!minimum?'minimum-unmet':!planAvailable?'presentation-plan-unavailable':null};
  const sequence=[];let facadeUsed=false,readingUsed=false;
  if(execution.available){
   const scene=(id,levelId,roomId=null)=>{const c=byId.get(id),target={levelId,...(roomId?{roomId}:{})};sequence.push({type:'scene',capability:id,adapterId:c.adapterId,target,startAnchor:{kind:id==='plan'?'plan':'overview',levelId},endAnchor:{kind:id==='room-tour'?'room':'overview',levelId,...(roomId?{roomId}:{})}});};
   for(const level of [...snapshot.levels].sort((a,b)=>a.order-b.order)){
    const levelId=level.levelId,overview=snapshot.structural.overview.byLevel.some(l=>l.levelId===levelId&&supported(l));if(!overview)continue;
    if(byId.get('plan').included&&byId.get('plan').targets.some(x=>x.levelId===levelId))scene('plan',levelId);
    if(byId.get('section').included&&byId.get('section').targets.some(x=>x.levelId===levelId))scene('section',levelId);
    if(elevation.included&&!facadeUsed){scene('elevation',levelId);facadeUsed=true;}
    if(reading&&!readingUsed&&byId.get(reading).details.levelIds.includes(levelId)){scene(reading,levelId);readingUsed=true;}
    if(byId.get('room-tour').included){const rooms=selection.rooms.filter(r=>r.levelId===levelId);rooms.forEach((r,i)=>{if(!i)scene('room-tour',levelId,r.roomId);else sequence.push({type:'stop',capability:'room-tour',target:{...r}});});}
   }
   if(reading&&!readingUsed){degraded=true;warn('adapter-anchor-unavailable',reading,'runtime-unavailable','warning',{reason:'no-eligible-overview'});}
   for(const id of ['plan','section','elevation'])if(byId.get(id).included&&!sequence.some(s=>s.capability===id)){degraded=true;warn('adapter-anchor-unavailable',id,'runtime-unavailable','warning',{reason:'no-eligible-overview'});}
   sequence.push({type:'terminal',capability:'closing'});
  }
  return {version:1,templateId:t.id,profile:t.id,snapshotKey:copy(snapshot.key),levels:copy(snapshot.levels),status:!execution.available?'unavailable':degraded?'degraded':'ready',
   decisions,minimumStory:{satisfied:minimum,expression:copy(t.minimumStory)},execution,buildingReading:reading,facade,selectedRooms:selection.rooms,
   sessionOptions:options,rejectedOverrides,sequence,resources:decisions.filter(c=>c.family==='resource'),recommendations:{outputs:[...t.outputs]},warnings};
 }

 // Resolve semantic targets to real stop indices. A missing stop never falls back to stop 0.
 // Additional rooms remain the existing navigation stops; they do not acquire an invented narrative or route.
 function materialize(resolved,sourcePlan){
  if(!resolved||!sourcePlan||!resolved.execution.available)return {plan:null,scenes:[],warnings:[],available:false,reason:resolved?.execution.reason||'presentation-plan-unavailable'};
  const tour=resolved.decisions.find(c=>c.id==='room-tour')?.included;
  const plan=copy(sourcePlan);if(!tour)plan.stops=plan.stops.filter(s=>s.kind==='overview');
  const scenes=[],warnings=[];
  const overview=levelId=>plan.stops.findIndex(s=>s.kind==='overview'&&(s.levelId??null)===levelId);
  for(const item of resolved.sequence){if(item.type!=='scene')continue;
   const home=overview(item.target.levelId),stop=item.capability==='room-tour'?plan.stops.findIndex(s=>s.kind==='room'&&(s.levelId??null)===item.target.levelId&&s.roomId===item.target.roomId):home;
   if(home<0||stop<0){warnings.push({type:'runtime-unavailable',code:'adapter-anchor-unavailable',severity:'warning',capability:item.capability,target:copy(item.target),params:{reason:'no-eligible-overview'}});continue;}
   scenes.push({kind:item.adapterId,stop,...(item.capability==='room-tour'?{from:home}:{}),capability:item.capability,target:copy(item.target)});
  }
  return {plan,scenes,warnings,available:plan.stops.length>0,reason:plan.stops.length?null:'adapter-anchor-unavailable'};
 }
 function runtimeFailure(resolved,failures){
  const decisions=copy(resolved.decisions),warnings=[];
  for(const failure of failures){const c=decisions.find(c=>c.id===failure.capability);if(!c)continue;
   if(c.scope!=='building'&&failure.target?.levelId!==undefined)c.targets=c.targets.filter(t=>t.levelId!==failure.target.levelId);else c.included=false;
   if(!c.targets.length)c.included=false;
   warnings.push({type:'runtime-unavailable',code:'adapter-runtime-failure',severity:'warning',capability:c.id,target:copy(failure.target),params:{reason:failure.reason||'adapter-failed'}});
  }
  const t=findTemplate(resolved.templateId);
  const valid=evaluateMinimum(t.minimumStory,decisions,resolved.levels);
  return {action:valid?'skip':'close',status:valid?'degraded':'unavailable',warnings};
 }
 const freezeResolved=resolved=>freeze(copy(resolved));
 return {catalog,validateCatalog,buildSnapshot,reuseSnapshot,keyOf,sameKey,normalizeCapabilities,resolveTemplate,evaluateMinimum,materialize,runtimeFailure,defaultSession,resetSession,audienceTemplateId,freezeResolved};
});
