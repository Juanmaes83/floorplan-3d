// SCULPT-R02-A · CeilingLayoutEvidenceV1, donor parity and guards. Synthetic scenarios only; nothing is written to a project.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {execFileSync}=require('node:child_process');
const LAB=path.join(__dirname,'..','labs','sculpt','r02-ceiling');
const E=require(path.join(LAB,'ceiling-layout-evidence-core.js'));
const C=require(path.join(LAB,'ceiling-compare-core.js'));
const F=require(path.join(LAB,'fixtures','ceiling-scenarios.js'));
const X=require(path.join(LAB,'extract-donor.cjs'));
const D=require(path.join(LAB,'workshop','donor-ceiling-extracts.js'));
const ROOT=path.join(__dirname,'..');
const RULE=fs.readFileSync(path.join(LAB,'workshop','donor-rules-reference.txt'),'utf8').match(/==== EXTRACT D[^\n]*\n([\s\S]*?)\n==== END D/)[1].trim();
const run=(name,over={})=>{const s=F.scenario(name);const r=s.building?E.propose({building:s.building,levelId:over.levelId||'lvl_g',requests:s.requests,...over}):E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests,...over});assert.ok(r.ok,JSON.stringify(r));assert.deepEqual(E.validate(r.evidence),[]);return r.evidence;};
const P=(ev,id)=>ev.proposals.find(p=>p.id===id);

test('provenance: extracts are verbatim (self-consistent here, against the donor in the source-exact job); no third-party image',()=>{
  assert.deepEqual(X.verifyWorkshop(null),[]);
  const lines=fs.readFileSync(path.join(LAB,'SOURCE-EXACT.sha256'),'utf8').trim().split('\n');
  assert.equal(lines.length,41);
  assert.match(lines.find(l=>l.endsWith('tests/fixtures/user-floorplan.png')),/^6206fcc8/);
  const files=execFileSync('git',['ls-files','labs/sculpt/r02-ceiling'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n');
  assert.ok(!files.some(f=>/\.(png|jpe?g|webp)$/i.test(f)),'no images from the donor');
  assert.ok(!files.some(f=>/recognition|ai-client|ai-config|ai-layout|furniture-(ui|catalog|model)/.test(f)),'no R01 recognition, paid-AI or furniture subsystems copied');
  assert.match(fs.readFileSync(path.join(ROOT,'.vercelignore'),'utf8'),/^labs\/$/m);
});

test('donor baseline in the workshop: the donor unit test passes unchanged against extract A',()=>{
  const env={...process.env};delete env.NODE_TEST_CONTEXT;
  const out=execFileSync(process.execPath,['--test',path.join(LAB,'workshop','donor-placement.test.cjs')],{encoding:'utf8',env});
  assert.match(out,/# pass 1/);assert.match(out,/# fail 0/);
});

test('scenario: rectangular room, centred ceiling light',()=>{
  const ev=run('rect-ceiling-light'),p=P(ev,'light-1');
  assert.deepEqual(ev.vertical.status,'declared');
  assert.deepEqual({top:p.mount.topMm,bottom:p.mount.bottomMm,fits:p.mount.fitsClearHeight},{top:2600,bottom:2500,fits:true});
  assert.equal(p.plan.suggestion.status,'in-place');assert.equal(p.roomId,'rom_a');assert.equal(p.review,'unreviewed');assert.equal(p.status,'proposed-not-applied');
});

test('scenario: pendant with explicit drop; C1 layers: a ceiling item never touches the floor layer and reports clearance',()=>{
  const s=F.scenario('pendant-over-bed'),before=JSON.stringify(s.project);
  const ev=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence,p=P(ev,'pendant-1');
  assert.equal(JSON.stringify(s.project),before,'project untouched');
  assert.deepEqual([p.mount.topMm,p.mount.bottomMm],[2600,2000]);
  assert.deepEqual(p.floorClearance,[{objectId:'obj_bed',objectTopMm:500,clearanceMm:1500,status:'clear'}]);
  // RUBIK today treats the same item as floor furniture: it would be blocked by the bed.
  assert.deepEqual(C.compare(F.scenario('pendant-over-bed'),{ruleText:RULE}).rows[0].rubikToday.problems,['furniture:obj_bed']);
});

test('scenario: curtain track with drop length; C2 heights: exceeding the clear height is reported, never clipped',()=>{
  const p=P(run('curtain-track'),'track-1');
  assert.deepEqual([p.mount.topMm,p.mount.bottomMm,p.mount.curtainLengthMm,p.mount.lowestPointMm,p.mount.fitsClearHeight],[2600,2520,2400,120,true]);
  const s=F.scenario('curtain-track');s.requests[0].curtainLengthMm=2600;
  const q=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence.proposals[0];
  assert.equal(q.mount.fitsClearHeight,false);assert.equal(q.mount.lowestPointMm,-80);assert.ok(q.warnings.includes('exceeds-clear-height'));
});

test('scenario: high wall AC with referenced height (RUBIK today draws it at a fixed 2.2 m)',()=>{
  const ev=run('wall-ac'),p=P(ev,'ac-1');
  assert.deepEqual([p.mount.dropMm,p.mount.topMm,p.mount.bottomMm,p.mount.reference],[200,2400,2100,'finished-floor']);
  assert.equal(p.plan.wallContact,'clear','touching the wall face is allowed, as in the donor');
  assert.equal(C.compare(F.scenario('wall-ac'),{ruleText:RULE}).rows[0].rubikToday.drawnAtMm,2200);
});

test('scenario: item that does not fit a small room; C3a the donor relocation leaving the room is flagged',()=>{
  const p=P(run('too-small-room'),'track-1');
  assert.equal(p.plan.wallContact,'overlaps');
  assert.equal(p.plan.suggestion.status,'moved');assert.equal(p.plan.suggestion.donorMessage,'这里放不下啦');
  assert.equal(p.plan.suggestion.roomId,null);assert.ok(p.warnings.includes('suggestion-leaves-room'));
});

test('scenario: rotated item near a wall; C3b rotated footprint and integer-mm suggestion re-checked against walls',()=>{
  const p=P(run('rotated-near-wall'),'heater-1');
  assert.equal(p.plan.wallContact,'overlaps','the rotated footprint, not its box, touches the wall');
  assert.equal(p.plan.suggestion.status,'moved');
  assert.ok(!Number.isInteger(p.plan.suggestion.donorPosition.x),'donor returns real numbers');
  assert.ok(Number.isInteger(p.plan.suggestion.position.x)&&Number.isInteger(p.plan.suggestion.position.y));
  const s=F.scenario('rotated-near-wall'),walls=s.project.walls.map(w=>E.wallShape(w)).map(w=>[...w.rect,'n',w.id]);
  assert.ok(D.furniturePlacement({cx:p.plan.suggestion.position.x,cy:p.plan.suggestion.position.y,w:600,d:300,rot:45},{walls}).ok);
});

test('scenario: irregular (L) room: inside vs outside the polygon',()=>{
  const ev=run('l-shaped-room');
  assert.equal(P(ev,'light-in').roomId,'rom_l');
  assert.equal(P(ev,'light-out').roomId,null);assert.ok(P(ev,'light-out').warnings.includes('outside-rooms'));
});

test('scenario: two items; plan overlap is not 3D collision',()=>{
  const ev=run('two-interfering');
  assert.deepEqual(P(ev,'pendant-1').interferences,[{with:'light-1',kind:'overlap-3d'}]);
  assert.deepEqual(P(ev,'pendant-2').interferences,[{with:'heater-1',kind:'plan-overlap-vertically-clear'}]);
  assert.ok(ev.warnings.includes('proposals-interfere'));
});

test('scenario: two levels with different heights; derived vs unknown, never a plausible guess',()=>{
  const g=run('two-levels'),u=run('two-levels',{levelId:'lvl_u'});
  assert.equal(g.vertical.status,'derived');assert.equal(g.vertical.clearHeightMm,2750);assert.equal(g.vertical.reference,'level-floor');
  assert.equal(P(g,'light-1').mount.topMm,2750);
  assert.equal(u.vertical.status,'unknown');assert.equal(P(u,'light-1').mount.status,'unknown');
  const s=F.scenario('two-levels'),d=E.propose({building:s.building,levelId:'lvl_u',requests:s.requests,ceiling:F.declared(2400)}).evidence;
  assert.equal(d.vertical.status,'declared');assert.equal(P(d,'light-1').mount.topMm,2400);
  const c=E.propose({building:s.building,levelId:'lvl_g',requests:s.requests,ceiling:F.declared(2600)}).evidence;
  assert.equal(c.vertical.status,'contradictory','declared 2600 vs derived 2750');assert.equal(P(c,'light-1').mount.status,'unknown');
});

test('scenario: unknown height; wall heights are context only; donor defaults are opt-in and labelled',()=>{
  const ev=run('unknown-ceiling'),p=P(ev,'light-1');
  assert.equal(ev.vertical.status,'unknown');assert.deepEqual(ev.vertical.wallHeightsMm.min,2600);
  assert.deepEqual([p.mount.status,p.mount.topMm,p.mount.fitsClearHeight],['unknown',null,null]);
  const s=F.scenario('wall-ac');delete s.requests[0].dropMm;
  const no=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence.proposals[0];
  assert.equal(no.mount.status,'unknown');assert.ok(no.warnings.includes('drop-unknown'));
  const yes=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests,options:{useDonorDefaults:true}}).evidence.proposals[0];
  assert.deepEqual([yes.mount.dropMm,yes.mount.dropSource],[200,'donor-default']);
  const c=F.scenario('curtain-track');delete c.requests[0].curtainLengthMm;
  const cur=E.propose({project:c.project,ceiling:c.ceiling,requests:c.requests,options:{useDonorDefaults:true}}).evidence.proposals[0];
  assert.deepEqual([cur.mount.curtainLengthMm,cur.mount.curtainSource],[2600-80-20,'donor-default'],'donor rule E: clear − h − 20');
});

test('scenario: floor layer with furniture: clash, clear and unknown height; floor objects never modified',()=>{
  const s=F.scenario('floor-layer'),before=JSON.stringify(s.project.objects);
  const ev=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence;
  assert.deepEqual(P(ev,'pendant-w').floorClearance,[{objectId:'obj_wardrobe',objectTopMm:2200,clearanceMm:-200,status:'clash'}]);
  assert.deepEqual(P(ev,'pendant-t').floorClearance,[{objectId:'obj_table',objectTopMm:null,status:'object-height-unknown'}]);
  assert.deepEqual(P(ev,'light-free').floorClearance,[]);
  assert.equal(JSON.stringify(s.project.objects),before);assert.equal(ev.floorLayer.readOnly,true);
});

test('C5/C6: serialisation round trip, deterministic, preview diff only — no apply function, nothing written',()=>{
  const a=run('two-interfering'),b=run('two-interfering');
  assert.equal(E.serialize(a),E.serialize(b),'same input, same evidence');
  const back=E.parse(E.serialize(a));assert.ok(back.ok);assert.deepEqual(back.evidence,a);
  // Closing audit 11/11: two of the four interfere in 3D → blocked (op 'none'); the other two remain reviewable candidates.
  const diff=E.previewDiff(a);assert.equal(diff.length,4);assert.ok(diff.every(d=>d.status==='not-applied'));
  assert.deepEqual(diff.map(d=>[d.id,d.op,d.state]),[['pendant-1','none','blocked'],['light-1','none','blocked'],['pendant-2','would-add','candidate-reviewable'],['heater-1','would-add','candidate-reviewable']]);
  assert.ok(!('apply' in E)&&!('cancel' in E),'no apply or cancellation API is claimed');
  const tampered=JSON.parse(E.serialize(a));tampered.proposals[0].mount.topMm+=1;
  assert.equal(E.parse(JSON.stringify(tampered)).error.code,'invalid-evidence');
  assert.equal(E.parse('{').error.code,'invalid-json');
  const bad=JSON.parse(E.serialize(a));bad.applied=true;assert.ok(E.validate(bad).includes('applied-must-be-false'));
  const conf=JSON.parse(E.serialize(a));conf.proposals[0].confidence=.9;assert.ok(E.validate(conf).some(e=>e.startsWith('forbidden-field')));
  const lux=JSON.parse(E.serialize(a));lux.proposals[0].lux=300;assert.ok(E.validate(lux).some(e=>e.startsWith('forbidden-field')));
});

test('C7 parity with the donor: vertical formula (F) and verbatim clear-height rule (D) agree on every computed proposal',()=>{
  let n=0;
  for(const name of F.NAMES){const r=C.compare(F.scenario(name),{ruleText:RULE});for(const row of r.rows)if(row.parity){n++;assert.deepEqual(row.parity,{vertical:true,rule:true},name+'/'+row.id);}}
  assert.ok(n>=15);
  const s=F.scenario('curtain-track');s.requests[0].curtainLengthMm=2600;
  const row=C.compare(s,{ruleText:RULE}).rows[0];assert.equal(row.donor.rule,false);assert.equal(row.adapter.fits,false);
});

test('diagonal wall: overlap detected, the donor relocation (axis-aligned only) is not pretended',()=>{
  const p=P(run('diagonal-wall'),'light-1');
  assert.equal(p.plan.wallContact,'overlaps');assert.equal(p.plan.suggestion.status,'unsupported-wall-orientation');assert.equal(p.plan.suggestion.position,null);
});

test('negative inputs are refused with a code',()=>{
  const s=F.scenario('rect-ceiling-light'),go=(req,extra={})=>E.propose({project:s.project,ceiling:s.ceiling,requests:req,...extra});
  const base={id:'x',type:'ceilinglight',position:{x:1000,y:1000},dropMm:0};
  const code=r=>r.ok?'ok':r.error.code;
  assert.equal(code(go([{...base,position:{x:NaN,y:1}}])),'invalid-number');
  assert.equal(code(go([{...base,dropMm:Infinity}])),'invalid-number');
  assert.equal(code(go([{...base,size:{widthMm:-1,depthMm:100,heightMm:100}}])),'invalid-size');
  assert.equal(code(go([base,{...base}])),'duplicate-request-id');
  assert.equal(code(go([{...base,position:{x:2e6,y:0}}])),'position-out-of-range');
  assert.equal(code(go([{...base,type:'sprinkler'}])),'unknown-type');
  assert.equal(code(go([{...base,dropMm:-5}])),'invalid-drop');
  assert.equal(code(go([{...base,curtainLengthMm:1000}])),'invalid-curtain-length','a ceiling light has no curtain');
  assert.equal(code(go([{...base,id:'bad id!'}])),'request-id-invalid');
  assert.equal(code(go([base],{ceiling:{clearHeightMm:2600,reference:'structural-slab',source:'x'}})),'ceiling-declaration-invalid','incompatible vertical reference');
  assert.equal(code(go([base],{ceiling:{clearHeightMm:2600.5,reference:'finished-floor',source:'x'}})),'ceiling-declaration-invalid');
  const t=F.scenario('two-levels');assert.equal(code(E.propose({building:t.building,levelId:'lvl_x',requests:[base]})),'level-not-found');
  assert.equal(code(E.propose({project:{},requests:[]})),'project-invalid');
});

test('guards: no paid-AI client, no R01 recognition code, no product file loads the lab',()=>{
  const lab=execFileSync('git',['ls-files','labs/sculpt/r02-ceiling'],{cwd:ROOT,encoding:'utf8'}).trim().split('\n').filter(f=>/\.(js|cjs|html)$/.test(f));
  for(const f of lab){const t=fs.readFileSync(path.join(ROOT,f),'utf8');assert.ok(!/api\.openai\.com|deepseek|dashscope|generativelanguage|Authorization:\s*'Bearer/.test(t),f+' has no AI provider');assert.ok(!/recognition-core|FloorplanRecognition/.test(t),f+' has no R01 code');}
  let out='';try{out=execFileSync('git',['grep','-l','-e','labs/sculpt','-e','RubikCeilingLayoutEvidence','--','js','api','css','index.html','evolucion'],{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim();}catch(e){assert.equal(e.status,1);}
  assert.equal(out,'');
});

// ---- Closing audit 11/11 (adjustment 1): validate() checks every vertical relation and never throws ------------------------
const has=(errs,code)=>errs.some(e=>e===code||e.startsWith(code+':'));
const tamper=(ev,f)=>{const x=JSON.parse(E.serialize(ev));f(x);return x;};
const safeValidate=x=>{let errs;assert.doesNotThrow(()=>{errs=E.validate(x);});return errs;};

test('validate: manipulated vertical relations and fit status are rejected with identifiable codes',()=>{
  const ok=run('rect-ceiling-light');                       // fits = true
  const curt=(()=>{const s=F.scenario('curtain-track');s.requests[0].curtainLengthMm=2600;return E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence;})(); // fits = false
  assert.deepEqual(E.validate(curt),[]);assert.equal(curt.proposals[0].mount.fitsClearHeight,false);
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.fitsClearHeight=false)),'mount-fits'),'true → false');
  assert.ok(has(safeValidate(tamper(curt,x=>x.proposals[0].mount.fitsClearHeight=true)),'mount-fits'),'false → true');
  assert.ok(has(safeValidate(tamper(curt,x=>x.proposals[0].mount.lowestPointMm+=100)),'mount-lowest'));
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.lowestPointMm=1)),'mount-lowest'),'a non-curtain item: lowest = bottom');
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.topMm-=10)),'mount-top'));
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.bottomMm+=10)),'mount-bottom'));
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.reference='level-floor')),'mount-reference-mismatch'));
});

test('validate: non-finite and missing values are distinguished (JSON turns NaN/Infinity into null)',()=>{
  const ok=run('rect-ceiling-light');
  const mem=E.clone(ok);mem.proposals[0].mount.topMm=NaN;
  assert.ok(has(safeValidate(mem),'mount-non-finite:topMm'),'in memory: NaN');
  const inf=E.clone(ok);inf.proposals[0].mount.dropMm=Infinity;
  assert.ok(has(safeValidate(inf),'mount-non-finite:dropMm'),'in memory: Infinity');
  const viaJson=JSON.parse(JSON.stringify((()=>{const x=E.clone(ok);x.proposals[0].mount.bottomMm=NaN;return x;})()));
  assert.equal(viaJson.proposals[0].mount.bottomMm,null);
  assert.ok(has(safeValidate(viaJson),'mount-missing-value:bottomMm'),'after JSON: null');
  assert.ok(has(safeValidate(tamper(ok,x=>{delete x.proposals[0].mount.dropMm;})),'mount-missing-value:dropMm'));
});

test('validate: incomplete evidence never throws (size, mount, vertical, plan, suggestion, proposal itself)',()=>{
  const ok=run('two-interfering');
  assert.ok(has(safeValidate(tamper(ok,x=>{delete x.proposals[0].size;})),'proposal-size-missing'));
  assert.ok(has(safeValidate(tamper(ok,x=>{delete x.proposals[0].mount;})),'mount-missing'));
  const noV=safeValidate(tamper(ok,x=>{delete x.vertical;}));
  assert.ok(has(noV,'vertical-missing'));assert.ok(has(noV,'mount-without-ceiling'),'computed heights need a known ceiling');
  assert.ok(has(safeValidate(tamper(ok,x=>{delete x.proposals[0].plan;})),'plan-missing'));
  assert.ok(has(safeValidate(tamper(ok,x=>{delete x.proposals[0].plan.suggestion;})),'plan-suggestion-missing'));
  assert.ok(has(safeValidate(tamper(ok,x=>{x.proposals[1]=null;})),'proposal-not-object'));
  assert.ok(has(safeValidate(tamper(ok,x=>{x.proposals[0].size={widthMm:500,depthMm:500};})),'proposal-geometry'));
});

test('validate: curtain length incompatible with the item type, and unknown heights presented as computed',()=>{
  const ok=run('rect-ceiling-light'),cur=run('curtain-track'),unk=run('unknown-ceiling');
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.curtainLengthMm=500)),'mount-curtain-incompatible'),'a ceiling light has no curtain');
  assert.ok(has(safeValidate(tamper(cur,x=>x.proposals[0].mount.curtainLengthMm=null)),'mount-missing-value:curtainLengthMm'));
  assert.ok(has(safeValidate(tamper(cur,x=>x.proposals[0].mount.curtainLengthMm=50)),'mount-curtain-incompatible'),'below the contract minimum');
  const fake=tamper(unk,x=>{Object.assign(x.proposals[0].mount,{status:'computed',reference:'finished-floor',dropMm:0,dropSource:'request',topMm:2600,bottomMm:2500,lowestPointMm:2500,fitsClearHeight:true});});
  assert.ok(has(safeValidate(fake),'mount-without-ceiling'),'heights cannot be computed against an unknown ceiling');
  assert.ok(has(safeValidate(tamper(ok,x=>x.proposals[0].mount.dropSource=null)),'mount-source'),'computed heights need a declared origin for the drop');
  assert.ok(has(safeValidate(tamper(unk,x=>x.proposals[0].mount.topMm=2600)),'mount-unknown-with-values'));
});

// ---- Closing audit 11/11 (adjustment 2): previewDiff() separates reviewable, pending and blocked ---------------------------
const diffOf=(ev,id)=>E.previewDiff(ev).find(d=>d.id===id);

test('previewDiff: reviewable candidate, pending and blocked states; blocked items never produce would-add',()=>{
  const c=diffOf(run('rect-ceiling-light'),'light-1');
  assert.equal(c.state,'candidate-reviewable');assert.equal(c.op,'would-add');assert.equal(c.status,'not-applied');assert.equal(c.review,'human-required');
  assert.ok(c.notEvaluated.includes('rotated-footprint-containment-in-room'),'full containment is not claimed');
  const small=diffOf(run('too-small-room'),'track-1');
  assert.equal(small.state,'blocked');assert.notEqual(small.op,'would-add');assert.ok(small.reasons.includes('suggestion-leaves-room'));
  assert.deepEqual(small.originalPosition,{x:500,y:400});assert.deepEqual(small.suggestedPosition,{x:500,y:-170});
  const s=F.scenario('curtain-track');s.requests[0].curtainLengthMm=2600;
  const tall=diffOf(E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence,'track-1');
  assert.equal(tall.state,'blocked');assert.ok(tall.reasons.includes('exceeds-clear-height'));
  const two=run('two-interfering');
  for(const id of ['pendant-1','light-1']){const d=diffOf(two,id);assert.equal(d.state,'blocked',id);assert.ok(d.reasons.some(r=>r.startsWith('overlap-3d')),id);}
  for(const id of ['pendant-2','heater-1'])assert.equal(diffOf(two,id).state,'candidate-reviewable',id+': plan-only overlap is not a block');
  const fl=run('floor-layer');
  assert.equal(diffOf(fl,'pendant-w').state,'blocked');assert.ok(diffOf(fl,'pendant-w').reasons.includes('clash-with-floor-object:obj_wardrobe'));
  assert.equal(diffOf(fl,'pendant-t').state,'pending');assert.ok(diffOf(fl,'pendant-t').reasons.includes('floor-object-height-unknown:obj_table'));
  assert.equal(diffOf(fl,'light-free').state,'candidate-reviewable');
  const unk=diffOf(run('unknown-ceiling'),'light-1');assert.equal(unk.state,'pending');assert.notEqual(unk.op,'would-add');assert.ok(unk.reasons.includes('mount-unknown'));
  const diag=diffOf(run('diagonal-wall'),'light-1');assert.equal(diag.state,'blocked');assert.ok(diag.reasons.includes('unsupported-wall-orientation'));assert.equal(diag.suggestedPosition,null);
  const out=diffOf(run('l-shaped-room'),'light-out');assert.equal(out.state,'blocked');assert.ok(out.reasons.includes('outside-rooms'));
});

test('previewDiff: a failed relocation is never replaced by the original position',()=>{
  const ev=run('rect-ceiling-light');
  for(const status of ['no-fit','no-integer-pose']){
    const x=E.clone(ev);x.proposals[0].plan.wallContact='overlaps';x.proposals[0].plan.suggestion={status,position:null,donorMessage:'这里放不下啦'};
    const d=E.previewDiff(x)[0];
    assert.equal(d.state,'blocked',status);assert.notEqual(d.op,'would-add');assert.equal(d.suggestedPosition,null);assert.ok(!('position' in d),'no applicable position at all');
  }
});

test('previewDiff: deterministic, serialisable, read-only on the evidence and the project',()=>{
  const s=F.scenario('floor-layer'),before=JSON.stringify(s.project);
  const ev=E.propose({project:s.project,ceiling:s.ceiling,requests:s.requests}).evidence,evBefore=E.serialize(ev);
  const a=E.previewDiff(ev),b=E.previewDiff(E.parse(E.serialize(ev)).evidence);
  assert.deepEqual(a,b);assert.deepEqual(JSON.parse(JSON.stringify(a)),a);
  assert.equal(E.serialize(ev),evBefore);assert.equal(JSON.stringify(s.project),before);
  assert.ok(a.every(d=>d.status==='not-applied'));assert.ok(!('apply' in E));
  assert.doesNotThrow(()=>E.previewDiff({proposals:[null,{id:'x'}]}));
});
