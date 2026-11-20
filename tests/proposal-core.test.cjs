'use strict';
/* K13 · ProposalV1 (js/proposal-core.js): contrato común de propuesta y vigencia sobre los TRES motores existentes, sin
   duplicarlos. Prueba pura de compatibilidad, propuestas obsoletas, cambios concurrentes y reversión, con los motores
   reales (Asistente AG-2/AG-3, MCP propose_layout) y la vigencia de E2. Las pruebas existentes de cada familia siguen sin
   cambiar sus aserciones. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const V=require('../js/proposal-core.js'),A=require('../js/assistant-proposals-core.js'),K=require('../js/assistant-contracts.js'),T=require('../js/assistant-domain-tools-core.js');
const Core=require('../js/project-core.js'),MCP=require('../tools/rubik-mcp/src/proposal.cjs'),{scenario}=require('../tools/rubik-mcp/fixtures/proposal-projects.cjs');
const root=path.resolve(__dirname,'..'),sha=s=>crypto.createHash('sha256').update(s).digest('hex');
const project=()=>Core.clone(Core.initial());
const floorTarget=p=>{const room=p.rooms[0],mat=p.materials.find(m=>m.category==='floor'&&m.id!==room.floorMaterialId);return {roomId:room.id,materialId:mat.id};};
const snap=p=>{const bytes=JSON.stringify(p);return {project:JSON.parse(bytes),snapshot:{sha256:sha(bytes)}};};

test('contrato: tres tipos de base con su formato real, una sola comprobación de vigencia y alias de compatibilidad',()=>{
  const p=project(),rev=T.revision(p);
  assert.match(rev,V.BASE_KINDS.revision,'la revisión del Asistente encaja con su tipo de base');
  assert.deepEqual(V.checkFresh(V.base('revision',rev),rev),{ok:true,kind:'revision'});
  const f=V.checkFresh(V.base('file-sha256','a'.repeat(64)),'b'.repeat(64));
  assert.equal(f.ok,false);assert.equal(f.code,'stale_base');assert.equal(f.legacyCode,'stale-source');
  assert.equal(V.checkFresh(V.base('stored-sha256','c'.repeat(64)),null).legacyCode,'stale');
  assert.equal(V.checkFresh({kind:'revision',value:'rv1-probe'},'rv1-probe').ok,false,'una base mal formada nunca es vigente');
  assert.equal(V.checkFresh({kind:'otra',value:'x'},'x').ok,false);
  assert.throws(()=>V.base('file-sha256','corto'),/no válida/);
  assert.deepEqual({...V.LEGACY},{revision:'revision_mismatch','file-sha256':'stale-source','stored-sha256':'stale'});
});

test('compatibilidad · Asistente: AssistantProposalV1 intacto y su vista ProposalV1 exige confirmación y deshacer',()=>{
  const p=project(),r=A.plan(p,'set_room_floor_material',floorTarget(p));assert.ok(r.ok);
  assert.ok(K.proposal(r.proposal).ok,'el contrato público del Asistente no cambia');
  assert.deepEqual(Object.keys(r.proposal).sort(),['alternatives','baseRevision','conflicts','createdAt','diff','id','operation','params','projectId','state','version','warnings'].sort());
  const v=A.toProposalV1(r.proposal);
  assert.ok(V.validate(v).ok);assert.equal(v.kind,'assistant-change');assert.deepEqual(v.base,{kind:'revision',value:r.proposal.baseRevision});
  assert.deepEqual(v.requires,{confirmation:'per-action',undo:true});assert.equal(v.applicable,true);assert.equal(v.applied,false);
  assert.deepEqual(v.changes.map(c=>c.path),r.proposal.diff.map(d=>d.path));
  assert.ok(Object.isFrozen(v)&&Object.isFrozen(v.changes),'la vista no se puede alterar');
  assert.deepEqual(V.validate({...v,requires:{confirmation:'none',undo:false}}).error.code,'invalid_proposal','sin confirmación ni deshacer no es válida');
});

test('compatibilidad · MCP: RubikLayoutProposalV1 intacto; su vista nunca es aplicable ni aplicada',()=>{
  const {project:p,snapshot}=snap(scenario('overlap'));
  const objectId=p.objects[0].id,res=MCP.propose(p,snapshot,{objectId,goal:'resolve-placement-conflict',expectedSha256:snapshot.sha256});
  assert.equal(res.applied,false);assert.equal(res.proposalVersion,'RubikLayoutProposalV1');
  const v=MCP.toProposalV1(res);
  assert.ok(V.validate(v).ok,JSON.stringify(V.validate(v)));assert.equal(v.kind,'layout-candidate');assert.equal(v.applicable,false);assert.equal(v.applied,false);
  assert.deepEqual(v.base,{kind:'file-sha256',value:snapshot.sha256});
  assert.equal(res.status,'candidate-reviewable');assert.equal(v.state,'proposed');assert.ok(v.changes.length>=1&&/^objects\[.+\]\.position$/.test(v.changes[0].path),'la posición sugerida se expresa como cambio');
  assert.equal(V.canApply(v,snapshot.sha256).error.code,'not_applicable','MCP nunca aplica, aunque su base esté vigente');
  for(const forged of [{...v,applicable:true},{...v,applied:true},{...v,state:'applied'},{...v,state:'confirmed'}])assert.equal(V.validate(forged).ok,false,'una candidata nunca se presenta como aplicable o aplicada');
});

test('propuestas obsoletas: los tres motores rechazan una base cambiada con su código de siempre',()=>{
  // Asistente
  const p=project(),r=A.plan(p,'set_room_floor_material',floorTarget(p));const changed=Core.clone(p);changed.rooms[0].name='Cambiada en otra pestaña';
  const a=A.apply(changed,r.proposal);assert.equal(a.ok,false);assert.equal(a.error.code,'revision_mismatch');
  assert.equal(V.canApply(A.toProposalV1(r.proposal),T.revision(changed)).error.code,'revision_mismatch');
  // MCP
  const {project:q,snapshot}=snap(scenario('overlap'));
  const stale=MCP.propose(q,snapshot,{objectId:q.objects[0].id,goal:'resolve-placement-conflict',expectedSha256:'0'.repeat(64)});
  assert.equal(stale.status,'blocked');assert.equal(stale.blockingReasons[0].code,'stale-source');assert.equal(stale.applied,false);
  assert.equal(MCP.toProposalV1(stale).state,'stale');
  // E2: solo vigencia, sin propuesta.
  const e2=V.checkFresh(V.base('stored-sha256',sha('guardado A')),sha('guardado B'));assert.equal(e2.ok,false);assert.equal(e2.legacyCode,'stale');
});

test('cambios concurrentes: dos propuestas sobre la misma base; aplicar una deja obsoleta la otra (sin sobrescribir en silencio)',()=>{
  const p=project(),t=floorTarget(p),r1=A.plan(p,'set_room_floor_material',t);
  const other=p.rooms[1]?{roomId:p.rooms[1].id,materialId:p.materials.find(m=>m.category==='floor'&&m.id!==p.rooms[1].floorMaterialId).id}:t;
  const r2=A.plan(p,'set_room_floor_material',other);
  assert.equal(r1.proposal.baseRevision,r2.proposal.baseRevision,'misma base');
  const first=A.apply(p,r1.proposal);assert.ok(first.ok);
  const second=A.apply(first.project,r2.proposal);assert.equal(second.ok,false);assert.equal(second.error.code,'revision_mismatch','la segunda no pisa la primera');
  // MCP: la candidata calculada sobre unos bytes no vale para otros, aunque el proyecto sea «parecido».
  const {project:q,snapshot}=snap(scenario('overlap'));const q2=Core.clone(q);q2.name=(q2.name||'')+' ·';
  const s2=snap(q2).snapshot;
  assert.equal(MCP.propose(q2,s2,{objectId:q.objects[0].id,goal:'resolve-placement-conflict',expectedSha256:snapshot.sha256}).blockingReasons[0].code,'stale-source');
});

test('reversión: aplicar no muta la entrada, deshacer devuelve la misma revisión y la propuesta se puede repetir',()=>{
  const p=project(),before=JSON.stringify(p),rev=T.revision(p),r=A.plan(p,'set_room_floor_material',floorTarget(p));
  const applied=A.apply(p,r.proposal);assert.ok(applied.ok);
  assert.equal(JSON.stringify(p),before,'el proyecto de entrada no cambia (deshacer = volver a él)');
  assert.notEqual(T.revision(applied.project),rev);
  const undone=JSON.parse(before);assert.equal(T.revision(undone),rev,'tras deshacer, la base vuelve a ser la misma');
  assert.ok(A.apply(undone,r.proposal).ok,'y la propuesta vuelve a ser aplicable sobre el estado deshecho');
  assert.equal(A.apply(applied.project,r.proposal).error.code,'revision_mismatch','sobre el estado ya aplicado no se aplica dos veces');
});

test('garantías: los algoritmos de huella no cambian, MCP no escribe, E2 no modifica y el núcleo es puro',()=>{
  // FNV-1a de 64 bits del Asistente: mismo resultado que la implementación de referencia.
  const ref=x=>{const {updatedAt,...rest}=x;const s=JSON.stringify(rest);let a=0x811c9dc5,b=0x01000193^0x5bd1e995;
    for(let i=0;i<s.length;i++){const c=s.charCodeAt(i);a=Math.imul(a^c,0x01000193)>>>0;b=Math.imul(b^(c+i&0xffff),0x01000193)>>>0;}
    return 'rv1-'+a.toString(16).padStart(8,'0')+b.toString(16).padStart(8,'0');};
  const p=project();assert.equal(T.revision(p),ref(p));
  const src=f=>fs.readFileSync(path.join(root,f),'utf8');
  const mcp=src('tools/rubik-mcp/src/proposal.cjs');assert.match(mcp,/applied: false/);assert.doesNotMatch(mcp,/writeFile|fs\./,'el MCP no escribe');
  const e2=src('comparar/comparar.js');
  assert.match(e2,/const x=storedSlice\([^;]*\);return x===null\?null:D\.sha256\(x\);/,'la huella de E2 se calcula igual (SHA-256 de lo guardado)');
  assert.match(e2,/setItem\(\)\{throw Error\('Comparador de solo lectura'\);\}/,'E2 sigue siendo de solo lectura');
  assert.doesNotMatch(e2,/fromAssistant|fromLayout|canApply/,'E2 solo usa la vigencia, no propuestas');
  const core=src('js/proposal-core.js');
  for(const m of ['child_process','worker_threads','fetch(','XMLHttpRequest','localStorage','indexedDB','document.'])assert.ok(!core.includes(m),'proposal-core puro: '+m);
  assert.deepEqual(Object.keys(V).filter(k=>/apply|commit|write|save/i.test(k)&&k!=='canApply'),[],'el contrato no aplica nada');
  const html=src('index.html');assert.ok(html.indexOf('js/proposal-core.js')>0&&html.indexOf('js/proposal-core.js')<html.indexOf('js/assistant-proposals-core.js'));
  const cmp=src('comparar/index.html');assert.ok(cmp.indexOf('../js/proposal-core.js')<cmp.indexOf('comparar.js'));
});
