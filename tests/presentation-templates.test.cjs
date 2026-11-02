/* FT3D-6 canonical §48 QA1–41 and semantic/adapter gates (F6-02…F6-48). Browser lifecycle is separate. */
const {test}=require('node:test'),assert=require('node:assert/strict');
const T=require('../js/presentation-templates-core.js'),P=require('../js/project-core.js'),C=require('../js/presentation-core.js');
const A=require('../js/presentation-axon-core.js'),S=require('../js/presentation-section-core.js'),E=require('../js/presentation-elevation-core.js'),Story=require('../js/presentation-story-core.js');
const clone=structuredClone,deepFreeze=x=>{if(x&&typeof x==='object'){Object.values(x).forEach(deepFreeze);Object.freeze(x);}return x;};
const cap=(r,id)=>r.decisions.find(c=>c.id===id),codes=r=>r.warnings.map(w=>w.code);
function input(count=2){
 const levels=Array.from({length:count},(_,i)=>{const project=P.initial();project.id='project-'+i;const geometry=P.geometry(project);
  return {levelId:count===1?null:'L'+i,order:i,name:'Level '+i,project,projectId:project.id,revision:'r'+i,geometry,elevationMm:i*3000,offsetMm:{x:i*500,y:0},hasPlan:true,
   rooms:geometry.rooms.filter(r=>r.poly.length>=3&&C.area(r.poly)>0).map((r,n)=>({roomId:r.id,family:['living','kitchen','bedroom','bathroom','dining','office','other','unspecified'][n%8],areaM2:C.area(r.poly)}))};});
 const selection=levels.flatMap(l=>l.rooms.map(r=>({levelId:l.levelId,roomId:r.roomId})));
 const plan=count===1?C.create(levels[0].project,levels[0].geometry,'entry','r0',selection.map(r=>r.roomId)):
  count===2?C.createBuilding({id:'building'},levels,'entry',selection):null;
 return {entryId:'entry',levels,plan,sections:levels.map(l=>({levelId:l.levelId,descriptor:S.derive(l,{levelId:l.levelId})})),
  elevation:E.derive({levels}),axon:A.derive({levels}),resources:{},historicalRooms:null};
}
function resolve(id='developer',data=input(),options={},runtime={}){return T.resolveTemplate({template:id,capabilitySnapshot:T.buildSnapshot(data),sessionOptions:options,runtime});}

test('catalog: exactly five immutable V1 profiles, six families, policies and no-template/audience namespaces',()=>{
 assert.deepEqual(T.validateCatalog(),[]);assert.equal(T.catalog.families.length,6);
 assert.deepEqual(T.catalog.templates.map(t=>t.id),['real-estate','developer','architecture','renovation','interior-design']);
 assert.ok(T.catalog.templates.every(t=>t.version===1&&t.roomBudget===6&&t.policies.closing==='required'));
 assert.ok(Object.isFrozen(T.catalog)&&Object.isFrozen(T.catalog.templates[0].policies));
 assert.equal(T.defaultSession().templateId,null);assert.equal(T.audienceTemplateId('interior'),'interior-design');assert.equal(T.audienceTemplateId('unknown'),null);
 assert.equal(T.resolveTemplate({capabilitySnapshot:T.buildSnapshot(input())}),null,'Sin plantilla does not become a sixth template');
 const rows=T.catalog.templates.map(t=>['plan','section','elevation','room-tour','axon','exploded-levels','solar'].map(id=>t.policies[id][0]).join(''));
 assert.deepEqual(rows,['popreee','poppppo','rppppoo','rpop eee'.replaceAll(' ',''),'poereee']);
});

const invalidCatalogs=[
 ['duplicate-template',c=>c.templates.push(clone(c.templates[0]))],
 ['duplicate-capability',c=>c.capabilities.push(clone(c.capabilities[0]))],
 ['unknown-capability',c=>c.templates[0].policies.fake='preferred'],
 ['unknown-family',c=>c.capabilities[0].family='donor-family'],
 ['invalid-policy',c=>c.templates[0].policies.plan='maybe'],
 ['invalid-scope',c=>c.capabilities[0].scope='continent'],
 ['invalid-coverage',c=>c.capabilities[0].coverages=['everything']],
 ['invalid-minimum',c=>c.templates[0].minimumStory={atLeast:{count:2,of:[{capability:'plan'}]}}],
 ['impossible-coverage',c=>c.templates[0].minimumStory={capability:'section',coverage:'building'}],
 ['bad-adapter',c=>c.capabilities.find(c=>c.id==='section').adapterId=null],
 ['bad-adapter',c=>c.capabilities.find(c=>c.id==='section').adapterId='fake'],
 ['invalid-requires',c=>c.capabilities[0].requires=['unknown']],
 ['cyclic-dependency',c=>{c.capabilities[0].requires=['section'];c.capabilities.find(c=>c.id==='section').requires=['plan'];}],
 ['invalid-reduced-motion',c=>c.adapters[0].reducedMotionSupport='none'],
 ['impossible-target',c=>{c.capabilities[0].availability='supported';c.capabilities[0].targets=[{scope:'facade'}];}],
 ['independent-building-toggle',c=>c.sessionToggleIds.push('axon')],
 ['ft3d5-pending',c=>c.capabilities.find(c=>c.id==='axon').reason='ft3d5-pending'],
 ['invalid-building-reading',c=>c.capabilities.find(c=>c.id==='exploded-levels').maxOccurrences=2],
 ['invalid-host',c=>c.capabilities.find(c=>c.id==='site-context').compatibleHosts.push('axon')]
];
for(const [code,mutate] of invalidCatalogs)test('validator rejects '+code+' / '+invalidCatalogs.findIndex(x=>x[1]===mutate),()=>{
 const c=clone(T.catalog);mutate(c);const before=JSON.stringify(c);assert.ok(T.validateCatalog(c).some(e=>e.code===code),JSON.stringify(T.validateCatalog(c)));assert.equal(JSON.stringify(c),before);
});

test('QA1,6,9,10,21: real one-level descriptor normalizes compact and single-level breakdown honestly',()=>{
 const data=input(1),s=T.buildSnapshot(data);assert.equal(s.structural.axon.availability,'supported');assert.equal(s.structural.explodedLevels.availability,'unsupported');assert.equal(s.structural.explodedLevels.reason,'single-level');
 for(const c of [s.structural.axon,s.structural.explodedLevels]){assert.equal(c.scope,'building');assert.deepEqual(c.coverages,['any','building']);assert.ok(!('partial' in c));assert.notEqual(c.reason,'ft3d5-pending');}
 const r=resolve('developer',data);assert.equal(r.buildingReading,'axon');assert.equal(r.minimumStory.satisfied,true);assert.equal(r.execution.available,true);
 assert.ok(r.sequence.some(s=>s.adapterId==='axon-open'));assert.ok(!r.sequence.some(s=>s.adapterId==='exploded-levels-open'));
});
test('QA2,7,8: partial descriptor and exact excluded reasons; two-source/one-valid cannot explode',()=>{
 const data=input();for(const w of data.levels[1].project.walls)w.status='demolished';data.levels[1].geometry=P.geometry(data.levels[1].project);data.axon=A.derive({levels:data.levels});
 const s=T.buildSnapshot(data);assert.equal(s.structural.axon.availability,'partial');assert.equal(s.structural.explodedLevels.reason,'insufficient-valid-levels');
 assert.deepEqual(s.structural.axon.details.excluded,[{levelId:'L1',reason:'invalid-level-geometry'}]);
 const r=resolve('developer',data);assert.equal(r.buildingReading,'axon');assert.ok(codes(r).includes('axon-partial'));
 assert.deepEqual(r.warnings.find(w=>w.code==='axon-partial').params.excluded,s.structural.axon.details.excluded);
 const descriptor=clone(input().axon);descriptor.partial=true;descriptor.excluded=[{levelId:'invalid',reason:'invalid-level-geometry'}];data.axon=descriptor;
 assert.equal(T.buildSnapshot(data).structural.explodedLevels.availability,'partial');
});
for(const reason of ['no-levels','invalid-level-geometry','degenerate-building-envelope'])test('QA3–5: '+reason+' remains the FT3D-5 reason',()=>{
 const data=input();data.axon={supported:false,reason,levels:[],excluded:[],variants:{}};const s=T.buildSnapshot(data);
 assert.equal(s.structural.axon.reason,reason);assert.equal(s.structural.explodedLevels.reason,reason);
 const r=resolve('developer',data);assert.ok(r.warnings.some(w=>w.code==='axon-unsupported'&&w.params.reason===reason));
});
test('QA11–17,20,22,23,35–37: adapter order, a single slot, nominal timings supplied by existing Story',()=>{
 const data=input(),dev=resolve('developer',data),arch=resolve('architecture',data),explicit=resolve('architecture',data,{buildingReading:'exploded'});
 assert.equal(dev.buildingReading,'exploded-levels');assert.equal(arch.buildingReading,'axon');assert.equal(explicit.buildingReading,'exploded-levels');assert.equal(explicit.minimumStory.satisfied,true);
 for(const r of [dev,arch,explicit]){const compiled=T.materialize(r,data.plan),building=compiled.scenes.filter(s=>['axon-open','exploded-levels-open'].includes(s.kind));
  assert.equal(building.length,1);assert.equal(building[0].stop,0);assert.equal(r.sequence.at(-1).capability,'closing');assert.equal(r.sequence.filter(s=>s.capability==='closing').length,1);
  assert.equal(compiled.scenes.filter(s=>s.kind==='elevation-open').length,1);assert.ok(compiled.scenes.every(s=>Story.NARRATIVES.includes(s.kind)));
  const perLevel=new Map();for(const s of compiled.scenes){if(!perLevel.has(s.target.levelId))perLevel.set(s.target.levelId,[]);perLevel.get(s.target.levelId).push(s.kind);}
  assert.equal(perLevel.get('L0')[0],'plan-reveal');assert.equal(perLevel.get('L0').at(-1),'room-descent');
  assert.ok(compiled.scenes.filter(s=>s.kind==='room-descent').length<=2);
 }
 assert.equal(Story.SCENE_MS['axon-open'],7000);assert.equal(Story.SCENE_MS['exploded-levels-open'],10000);
 assert.equal(Story.AXON_OPEN.reducedHold,.5);assert.equal(Story.EXPLODED_LEVELS_OPEN.reducedCompact,.22);assert.equal(Story.EXPLODED_LEVELS_OPEN.reducedExploded,.645);
});
test('QA13,14,40: choose the first real eligible overview, never substitute a different stop or invent an anchor',()=>{
 const data=input();data.axon.levels=data.axon.levels.filter(l=>l.levelId==='L1');const r=resolve('developer',data);
 const reading=r.sequence.find(s=>s.adapterId==='exploded-levels-open');assert.equal(reading.target.levelId,'L1');
 const compiled=T.materialize(r,data.plan);assert.equal(compiled.scenes.find(s=>s.kind==='exploded-levels-open').stop,data.plan.stops.findIndex(s=>s.kind==='overview'&&s.levelId==='L1'));
 data.plan.stops=data.plan.stops.filter(s=>s.levelId!=='L1');const missing=resolve('developer',data);
 assert.ok(codes(missing).includes('adapter-anchor-unavailable'));assert.ok(!missing.sequence.some(s=>s.capability==='axon'||s.capability==='exploded-levels'));
 assert.equal(missing.minimumStory.satisfied,true,'missing execution anchor does not erase semantic support');
});
test('QA24–26: unsupported explicit variants and independent toggles are rejected; off must preserve minimum',()=>{
 const r=resolve('architecture',input(1),{buildingReading:'exploded',toggles:{axon:false,'exploded-levels':true}});
 assert.equal(r.buildingReading,'axon');assert.ok(r.rejectedOverrides.includes('buildingReading'));assert.ok(!('axon' in r.sessionOptions.toggles));assert.ok(!('exploded-levels' in r.sessionOptions.toggles));
 const data=input();data.sections=[];data.elevation={supported:false,reason:'no-facade-walls'};
 const guarded=resolve('architecture',data,{buildingReading:'off'});assert.equal(guarded.minimumStory.satisfied,true);assert.equal(guarded.buildingReading,'axon');assert.ok(guarded.rejectedOverrides.includes('buildingReading'));
 const allowed=resolve('architecture',input(),{buildingReading:'off'});assert.equal(allowed.buildingReading,null);assert.ok(!allowed.rejectedOverrides.includes('buildingReading'));assert.equal(allowed.minimumStory.satisfied,true);
});
test('required disable and closing; optional overrides cannot activate an excluded capability',()=>{
 const r=resolve('architecture',input(),{toggles:{plan:false,closing:false}});assert.equal(cap(r,'plan').included,true);assert.equal(cap(r,'closing').included,true);assert.ok(r.rejectedOverrides.includes('toggles.plan'));
 const interior=resolve('interior-design',input(),{toggles:{elevation:true}});assert.equal(cap(interior,'elevation').included,false);assert.ok(interior.rejectedOverrides.includes('toggles.elevation'));
 const custom=clone(T.catalog.templates.find(t=>t.id==='architecture'));custom.minimumStory={oneOf:[{capability:'plan'},{capability:'overview'}]};
 const relaxed=T.resolveTemplate({template:custom,capabilitySnapshot:T.buildSnapshot(input()),sessionOptions:{toggles:{plan:false}}});assert.equal(relaxed.minimumStory.satisfied,true);assert.equal(relaxed.status,'degraded');assert.ok(codes(relaxed).includes('required-disabled'));
});
test('QA38–41 / P11: minimum before execution, no roomless anchor and no overview(building)',()=>{
 const data=input();data.plan=null;for(const l of data.levels)l.rooms=[];
 const s=T.buildSnapshot(data),r=resolve('developer',data);assert.equal(r.minimumStory.satisfied,true);assert.equal(r.execution.available,false);assert.equal(r.execution.reason,'presentation-plan-unavailable');
 assert.ok(codes(r).includes('presentation-plan-unavailable'));assert.ok(!codes(r).includes('minimum-unmet'));assert.deepEqual(r.sequence,[]);
 assert.deepEqual(s.structural.overview.building,{availability:'unsupported',reason:'overview-building-unavailable'});
 assert.equal(resolve('real-estate',data).execution.reason,'minimum-unmet');
 const one=T.buildSnapshot(input(1)),base=T.normalizeCapabilities(one,{},one.structural.roomTour.rooms);base.forEach(c=>c.included=true);
 assert.equal(T.evaluateMinimum({capability:'overview',coverage:'building'},base,one.levels),true);
 assert.equal(T.evaluateMinimum({capability:'section',coverage:'building'},base,one.levels),false);
 const two=T.buildSnapshot(input());assert.equal(T.evaluateMinimum({capability:'overview',coverage:'building'},base,two.levels),false);assert.equal(one.structural.overview.building.availability,'unsupported');
});
test('coverage and grammar: all levels are required for all-presented-levels, atLeast and partial truth',()=>{
 const s=T.buildSnapshot(input()),d=T.normalizeCapabilities(s,{},s.structural.roomTour.rooms);d.forEach(c=>c.included=true);
 assert.equal(T.evaluateMinimum({capability:'plan',coverage:'all-presented-levels'},d,s.levels),true);d.find(c=>c.id==='plan').targets.pop();
 assert.equal(T.evaluateMinimum({capability:'plan',coverage:'all-presented-levels'},d,s.levels),false);
 assert.equal(T.evaluateMinimum({atLeast:{count:2,of:[{capability:'plan'},{capability:'section'},{capability:'solar'}]}},d,s.levels),true);
});
test('room selection: family priority, diversity, area-only unclassified fallback, six-room recommendation',()=>{
 const data=input(1);data.levels[0].rooms=[['b2','bedroom',40],['b1','bedroom',50],['u1',null,9],['u2','other',25],['k','kitchen',4],['l','living',3],['ba','bathroom',5],['o','office',7],['d','dining',6]].map(([roomId,family,areaM2])=>({roomId,family,areaM2}));
 const real=resolve('real-estate',data);assert.deepEqual(real.selectedRooms.slice(0,4).map(r=>r.roomId),['l','k','b2','ba']);assert.ok(!real.selectedRooms.some(r=>r.roomId==='b1'));assert.equal(real.selectedRooms.length,6);assert.ok(codes(real).includes('rooms-trimmed'));
 const renovation=resolve('renovation',data);assert.deepEqual(renovation.selectedRooms.slice(0,2).map(r=>r.roomId),['k','ba']);
 data.levels[0].rooms=[{roomId:'name-kitchen',family:null,areaM2:2,name:'Kitchen'},{roomId:'neutral',family:'other',areaM2:20},{roomId:'equal',family:null,areaM2:20}];
 assert.deepEqual(resolve('interior-design',data).selectedRooms.map(r=>r.roomId),['neutral','equal','name-kitchen']);
 assert.ok(codes(resolve('interior-design',data)).includes('rooms-unclassified'));
});
test('explicit and historical rooms: preserve >6, compound identity, stale IDs, reset and switch without persistence',()=>{
 const data=input(),all=data.levels.flatMap(l=>l.rooms.map(r=>({levelId:l.levelId,roomId:r.roomId}))),explicit=all.slice(0,8).reverse();
 const r=resolve('real-estate',data,{rooms:explicit});assert.equal(r.selectedRooms.length,8);assert.ok(codes(r).includes('room-budget-exceeded'));assert.ok(!codes(r).includes('rooms-trimmed'));
 data.historicalRooms=[all.at(-1)];assert.deepEqual(resolve('real-estate',data).selectedRooms,[all.at(-1)]);
 const reset=T.resetSession({...r.sessionOptions,buildingReading:'off',facade:'fake',solar:true});assert.equal(reset.rooms,null);assert.equal(reset.buildingReading,'automatic');assert.equal(reset.facade,'automatic');assert.equal(reset.solar,false);assert.deepEqual(resolve('real-estate',data,reset).selectedRooms,[all.at(-1)]);
 const stale=resolve('real-estate',data,{rooms:[{levelId:'deleted',roomId:'deleted'}]});assert.ok(codes(stale).includes('room-missing'));assert.equal(stale.selectedRooms.length,1);assert.notEqual(stale.selectedRooms[0].roomId,'deleted');
 const switched=resolve('interior-design',data,{...r.sessionOptions,buildingReading:'exploded',toggles:{elevation:true},solar:true});assert.equal(switched.buildingReading,null);assert.equal(cap(switched,'elevation').included,false);assert.equal(switched.sessionOptions.solar,false);
});
test('QA30,33,34: structural levels independent of selected rooms; context stays elevation-only',()=>{
 const data=input(),oneRoom=[{levelId:'L0',roomId:data.levels[0].rooms[0].roomId}];data.resources['site-data']={availability:'supported',reason:null};
 const r=resolve('developer',data,{rooms:oneRoom});assert.deepEqual(cap(r,'exploded-levels').details.levelIds,['L0','L1']);assert.deepEqual(cap(r,'site-context').compatibleHosts,['elevation']);
 const noFacade=resolve('developer',data,{rooms:oneRoom,toggles:{elevation:false}});assert.equal(cap(noFacade,'site-context').included,false);assert.equal(noFacade.buildingReading,'exploded-levels');assert.ok(codes(noFacade).includes('site-context-no-host'));
});
test('Section/Elevation partial, neutral north, Solar/no host/facade stale, resources are never chapters',()=>{
 const data=input();data.sections[1].descriptor={supported:false,reason:'no-crossing'};data.elevation.partial=true;data.elevation.excluded=[{levelId:'L1',reason:'invalid-geometry'}];
 for(const id of ['materials','moodboard','budget-summary','dossier','site-data'])data.resources[id]={availability:'supported',reason:null};
 const r=resolve('architecture',data,{solar:true,facade:'deleted-candidate'});assert.equal(cap(r,'section').availability,'partial');assert.ok(codes(r).includes('section-partial'));assert.ok(codes(r).includes('elevation-partial'));assert.ok(codes(r).includes('facade-stale'));assert.ok(codes(r).includes('solar-unavailable'));
 assert.equal(r.sessionOptions.facade,'automatic');assert.equal(r.facade,data.elevation.defaultId);assert.ok(cap(r,'elevation').included);assert.ok(r.resources.every(c=>c.adapterId===null));assert.ok(!r.sequence.some(s=>r.resources.some(c=>c.id===s.capability)));
 assert.deepEqual(r.recommendations.outputs,['dossier','share']);
 const sun=resolve('architecture',data,{solar:true},{solarAvailable:true});assert.equal(cap(sun,'solar').included,true);assert.ok(cap(sun,'solar').targets.every(t=>t.scope==='facade'));
});
test('snapshot lifetime: once per key; entry/revision/level invalidate, options and viewport do not derive again',()=>{
 const data=input(),s=T.buildSnapshot(data);assert.strictEqual(T.reuseSnapshot(s,data),s);
 const changed=clone(data);changed.levels[0].revision='new';assert.notStrictEqual(T.reuseSnapshot(s,changed),s);
 changed.entryId='other';assert.notDeepEqual(T.keyOf(changed),s.key);changed.levels.pop();assert.notDeepEqual(T.keyOf(changed),s.key);
 for(const id of T.catalog.templates.map(t=>t.id))T.resolveTemplate({template:id,capabilitySnapshot:s});assert.deepEqual(s,T.buildSnapshot(data));
});
test('QA29,31: deterministic, serializable, frozen inputs, no browser/network/storage or motion/language authority',()=>{
 const data=deepFreeze(input()),snapshot=T.buildSnapshot(data),before=JSON.stringify(data);
 const args={template:'architecture',capabilitySnapshot:snapshot,sessionOptions:{buildingReading:'exploded'}};
 const originalFetch=global.fetch;global.fetch=()=>{throw Error('unexpected network');};
 try{const a=T.resolveTemplate(args),b=T.resolveTemplate({...args,runtime:{locale:'zh',viewport:[390,844],reducedMotion:true,levelView:'all'}});assert.deepEqual(a,b);assert.deepEqual(a,JSON.parse(JSON.stringify(a)));assert.deepEqual(a,T.resolveTemplate(args));assert.equal(JSON.stringify(data),before);}finally{global.fetch=originalFetch;}
});
test('runtime failure uses remaining minimum, restores/skip or close; frozen semantic story is not rebuilt',()=>{
 const r=resolve('architecture'),before=JSON.stringify(r),optional=T.runtimeFailure(r,[{capability:'elevation',target:{levelId:'L0'},reason:'injected'}]);assert.equal(optional.action,'skip');assert.equal(optional.status,'degraded');assert.equal(optional.warnings[0].code,'adapter-runtime-failure');
 const real=resolve('real-estate',input(1)),required=T.runtimeFailure(real,[{capability:'room-tour',target:{levelId:null},reason:'injected'}]);assert.equal(required.action,'close');assert.equal(JSON.stringify(r),before);
});
test('freeze boundary detaches session data; null catalog entries produce diagnostics instead of crashing',()=>{
 const r=resolve('architecture'),frozen=T.freezeResolved(r),before=JSON.stringify(frozen);r.selectedRooms.length=0;r.sessionOptions.buildingReading='off';
 assert.equal(JSON.stringify(frozen),before);assert.ok(Object.isFrozen(frozen));assert.ok(Object.isFrozen(frozen.sessionOptions));
 assert.throws(()=>{frozen.sequence.push({});},TypeError);
 const invalid=clone(T.catalog);invalid.capabilities.push(null);invalid.adapters.push(null);invalid.templates.push(null);assert.ok(T.validateCatalog(invalid).length>0);
});
