/* FT3D-8 delivery core: cost policy, storyboard, brand snapshot, frozen manifest, client document, publish errors.
   Uses only FIXTURE projects and a FIXTURE brand kept in an in-memory storage (never the user's profiles). */
const test=require('node:test');
const assert=require('node:assert/strict');
const D=require('../js/construction-delivery-core.js');
const A=require('../js/construction-project-adapter.js');
const Brand=require('../js/brand-core.js');
const Share=require('../api/share.js');
const View=require('../api/view.js');
const F=require('../labs/ft3d-8/fidelity-fixtures.js');

const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
function fixtureBrand(store=memory(),over={}){
  const p=Brand.saveProfile(store,{name:'FIXTURE Estudio de Prueba',person:'Persona Ficticia',phone:'+34 600 000 000',email:'estudio@example.com',web:'example.com',tagline:'FIXTURE lema',logo:PNG,...over});
  Brand.setDelivery(store,'lab-A',{profileId:p.id,title:'FIXTURE Tu vivienda',intro:'FIXTURE introduccion para el cliente'});
  return {store,profile:p,snapshot:Brand.snapshot(store,'lab-A','FIXTURE A',' 2026-11-05T10:00:00Z'.trim())};
}
const ctxA=async()=>{const c=await F.build('A');return {c,m:await A.evaluate(c)};};

test('cost policy: costs only when project, plan and budget agree; null stays unknown; never "spent"',async()=>{
  const {c,m}=await ctxA();
  const p=D.costPolicy(m,{mode:'tasks',schedule:c.schedule});
  assert.equal(p.allowed,true);assert.equal(p.rows.length,7);
  assert.equal(p.rows.find(r=>r.taskId==='cubierta').totalText,'desconocido');
  assert.equal(p.rows.find(r=>r.taskId==='cubierta').status,'sin-partidas');
  assert.ok(p.warnings[0]===D.COSTS_NOTICE&&/no son gasto ejecutado/.test(D.COSTS_NOTICE));
  assert.ok(p.warnings.some(w=>/no equivale a la obra completa/.test(w)));
  assert.ok(p.warnings.some(w=>/no verificable por C1-C4/.test(w)));
  assert.equal(D.costPolicy(m,{mode:'summary',schedule:c.schedule}).rows.length,0);
  assert.equal(D.costPolicy(m,{mode:'none',schedule:c.schedule}).mode,'none');
  assert.throws(()=>D.costPolicy(m,{mode:'all'}),/none, summary or tasks/);
  // Partial costs: unknown items listed, total unknown kept as such.
  const cc=await F.build('C'),mc=await A.evaluate(cc),pc=D.costPolicy(mc,{mode:'tasks',schedule:cc.schedule});
  assert.ok(pc.warnings.some(w=>/Partidas sin precio/.test(w))&&pc.warnings.some(w=>/Repartos pendientes: opening:door 50 %/.test(w)));
  assert.equal(pc.rows.find(r=>r.taskId==='suelos').totalText,'desconocido');
  assert.equal(pc.summary.complete,false);
});
test('cost policy blocks a foreign plan, a foreign budget, a building and double counting',async()=>{
  const {c,m}=await ctxA(),cC=await F.build('C');
  const foreign=await A.evaluate({...c,schedule:cC.schedule});
  const pf=D.costPolicy(foreign,{mode:'tasks',schedule:cC.schedule});
  assert.equal(pf.allowed,false);assert.match(pf.warnings[0],/Costes no incluidos: plan de otro proyecto/);
  assert.equal(D.costPolicy(await A.evaluate({...c,budget:cC.budget}),{mode:'summary',schedule:c.schedule}).allowed,false);
  const b=await F.build('B');assert.equal(D.costPolicy(await A.evaluate(b),{mode:'summary',schedule:b.schedule}).allowed,false);
  const tampered=structuredClone(m);tampered.costs.report.scheduleTotals.allocatedKnownNet=m.costs.report.budgetTotals.amount+1;
  assert.match(D.costPolicy(tampered,{mode:'summary',schedule:c.schedule}).reasons.join(),/superior al presupuesto conocido/);
});
test('storyboard: opening, timeline over whole plan days, closing; deterministic and bounded',async()=>{
  const {c}=await ctxA(),sb=D.storyboard(c.schedule);
  assert.equal(sb.at(0).segment,'opening');assert.equal(sb.at(sb.openingMs+1).segment,'timeline');assert.equal(sb.at(sb.totalMs).segment,'closing');
  assert.equal(sb.at(sb.totalMs).date,sb.completionDate);assert.equal(sb.at(sb.openingMs).date,sb.preStartDate);
  assert.ok(sb.timelineMs>=9000&&sb.timelineMs<=16000);
  assert.deepEqual(sb.at(7777),D.storyboard(c.schedule).at(7777));
  for(let t=sb.openingMs;t<sb.openingMs+sb.timelineMs;t+=500)assert.match(sb.at(t).date,/^\d{4}-\d\d-\d\d$/);
  assert.throws(()=>D.storyboard(require('../js/construction-schedule-core.js').create({id:'e',projectRef:{type:'project',id:'p',revision:'r'}})),/schedule with tasks/);
});
test('overlay texts come from the plan and the cost policy',async()=>{
  const {c,m}=await ctxA();
  const o=D.overlay(m,c.schedule,'2027-10-14',D.costPolicy(m,{mode:'tasks',schedule:c.schedule}));
  assert.equal(o.week,'SEM 06 / 12');assert.deepEqual(o.active.map(a=>a.id),['tabiques','cubierta']);
  assert.ok(o.cost.some(x=>/Fase en curso «Tabiqueria interior» \(sin IVA\): \d/.test(x))&&o.cost.some(x=>/Fase en curso «Cubierta .*\(sin IVA\): desconocido/.test(x)));
  assert.match(o.cost.at(-1),/^Total presupuestado asignado al plan \(sin IVA\): 19\.717,64 €$/,'plan total kept apart from the phase cost');
  const sum=D.overlay(m,c.schedule,'2027-10-14',D.costPolicy(m,{mode:'summary',schedule:c.schedule}));
  assert.deepEqual(sum.cost,['Total presupuestado asignado al plan (sin IVA): 19.717,64 € · no es el coste de la fase en curso']);
  assert.match(D.overlay(m,c.schedule,'2027-10-14',D.costPolicy(m,{mode:'none',schedule:c.schedule})).cost[0],/eleccion del profesional/);
  assert.match(D.overlay(m,c.schedule,'2027-11-27',null).headline,/Plan completado/);
});
test('brand: FloorPlanBrand snapshot, re-validated, contact filtered to the fields explicitly included',()=>{
  const {snapshot}=fixtureBrand();
  const b=D.brandFor(snapshot,{include:['email']});
  assert.equal(b.name,'FIXTURE Estudio de Prueba');assert.equal(b.contact,'estudio@example.com');assert.deepEqual(b.fields,['email']);
  assert.equal(b.credit,'Preparado por FIXTURE Estudio de Prueba con Rubik Sota');assert.equal(b.logo,PNG);
  assert.equal(D.brandFor(snapshot,{include:[]}).contact,'');
  assert.equal(D.brandFor(null).credit,'Generado con RUBIK SOTA');
  assert.throws(()=>D.brandFor({profile:{name:'x'}}),/FloorPlanBrand.snapshot/);
  assert.throws(()=>D.brandFor({...snapshot,profile:{...snapshot.profile,logo:'data:image/svg+xml;base64,AAAA'}}),/PNG/);
});
test('manifest is frozen; later brand or project changes never alter an existing delivery',async()=>{
  const {c,m}=await ctxA(),{store,profile,snapshot}=fixtureBrand();
  const policy=D.costPolicy(m,{mode:'summary',schedule:c.schedule});
  const make=(brand,model=m)=>D.createManifest({model,schedule:c.schedule,budget:c.budget,brand,costPolicy:policy,generatedAt:'2026-11-05T10:00:00Z',binding:c.binding});
  const first=await make(D.brandFor(snapshot,{include:['phone']}));
  assert.ok(Object.isFrozen(first)&&Object.isFrozen(first.brand)&&Object.isFrozen(first.plan.phases[0]));
  assert.throws(()=>{'use strict';first.title='x';});
  assert.match(first.id,/^dlv_[0-9a-f]{16}$/);assert.match(first.fingerprint,/^[0-9a-f]{64}$/);
  assert.equal(first.project.fingerprint,m.fingerprints.project);assert.equal(first.plan.fingerprint,m.fingerprints.schedule);assert.equal(first.budget.fingerprint,m.fingerprints.budget);
  const before=JSON.stringify(first);
  Brand.saveProfile(store,{...profile,name:'FIXTURE Estudio Renombrado'});
  const later=await make(D.brandFor(Brand.snapshot(store,'lab-A','FIXTURE A','2026-11-06T10:00:00Z'),{include:['phone']}));
  assert.equal(JSON.stringify(first),before,'existing delivery unchanged');
  assert.notEqual(later.fingerprint,first.fingerprint);assert.equal(later.brand.name,'FIXTURE Estudio Renombrado');
  const edited=structuredClone(c.source);edited.walls[0].heightMm=2800;
  const m2=await A.evaluate({...c,source:edited});
  assert.notEqual((await make(D.brandFor(snapshot),m2)).project.fingerprint,first.project.fingerprint,'new revision = new delivery');
  // No delivery without a valid plan of this project.
  await assert.rejects(D.createManifest({model:await A.evaluate({...c,schedule:(await F.build('C')).schedule}),schedule:(await F.build('C')).schedule}),/valid plan of this project/);
});
test('client document: read-only, api/view-compatible, no editable project, honest notices',async()=>{
  const {c,m}=await ctxA(),{snapshot}=fixtureBrand();
  const man=await D.createManifest({model:m,schedule:c.schedule,budget:c.budget,brand:D.brandFor(snapshot,{include:['email']}),
    costPolicy:D.costPolicy(m,{mode:'tasks',schedule:c.schedule}),generatedAt:'2026-11-05T10:00:00Z',
    video:{filename:'v.webm',type:'video/webm',bytes:1000,width:1280,height:720,durationMs:19600,sha256:'a'.repeat(64)}});
  const html=D.clientDocument(man,{video:{src:'https://abc.public.blob.vercel-storage.com/rubik-share/v-x.webm',type:'video/webm'}});
  assert.ok(html.slice(0,200).toLowerCase().startsWith('<!doctype html>'),'api/share accepts only documents starting with <!doctype html>');
  assert.match(html,/Content-Security-Policy" content="default-src 'none'; img-src data:; media-src https:\/\/abc\.public\.blob\.vercel-storage\.com;/);
  assert.equal((html.match(/<script/g)||[]).length,1);assert.match(html,/<script type="application\/json" id="ft3d8-manifest">/);
  for(const leak of ['"walls"','"openings"','"rooms"','sourceImages','BLOB_READ_WRITE_TOKEN','RUBIK_RENDER_TOKEN'])assert.ok(!html.includes(leak),leak);
  for(const must of ['FIXTURE Estudio de Prueba','estudio@example.com','Evolución de obra planificada','no son gasto ejecutado','Alcance parcial','identidad no verificada',man.id])assert.ok(html.includes(must),must);
  assert.ok(!html.includes('+34 600 000 000'),'contact field not included stays out');
  assert.throws(()=>D.clientDocument(man,{video:{src:'http://insecure/x.webm'}}),/https URL/);
  const local=D.clientDocument(man,{video:null});assert.match(local,/media-src 'none'/);assert.match(local,/se entrega como archivo aparte/);
  // The existing api/share accepts it (mocked storage, no real upload).
  const calls=[];const res={headers:{},setHeader(k,v){this.headers[k]=v;},end(b){this.body=b;}};
  await Share.handler({method:'POST',headers:{'x-rubik-render-token':'code','x-rubik-share-kind':'html','x-rubik-share-name':'x'},body:Buffer.from(html)},res,
    {env:{BLOB_READ_WRITE_TOKEN:'vercel_blob_rw_abc_secret',RUBIK_RENDER_TOKEN:'code'},fetchImpl:async(url,o)=>{calls.push({url,o});return {ok:true,json:async()=>({url:'https://abc.public.blob.vercel-storage.com/rubik-share/x-r.html'})};}});
  assert.equal(res.statusCode,200);assert.match(calls[0].url,/rubik-share\/x\.html$/);
  assert.match(View.csp('abc.public.blob.vercel-storage.com'),/media-src https:\/\/abc\.public\.blob\.vercel-storage\.com/);
});
test('publish errors map the real api/share responses; endpoints are absolute',()=>{
  assert.deepEqual(D.ENDPOINTS,{share:'/api/share',view:'/api/view'});
  assert.match(D.publishError(503,'not-configured'),/BLOB_READ_WRITE_TOKEN/);
  assert.equal(D.publishError(401,'token'),D.PUBLISH_ERRORS.token);
  assert.match(D.publishError(413,'size'),/4 MB/);
  assert.match(D.publishError(404,null),/no existe aquí/);
  assert.match(D.publishError(502,'storage-error'),/No se ha publicado nada/);
  assert.equal(D.SHARE_LIMIT_BYTES,Share.LIMIT);
});

test('MP4 muxer writes an indexed file whose declared duration equals its sample table',()=>{
  const M=require('../js/construction-mp4-muxer.js'),avcC=Uint8Array.from([1,66,0,31,255,225,0,4,103,66,0,31,1,0,4,104,206,60,128]);
  const samples=Array.from({length:491},(_,i)=>({data:Uint8Array.from([0,0,0,2,i%25?1:5,i&255]),key:i%25===0}));
  const f=M.mux({width:1280,height:720,fps:25,samples,avcC}),r=M.inspect(f);
  assert.deepEqual(r.boxes,['ftyp','mdat','moov']);assert.equal(r.codec,'avc1');assert.equal(r.width,1280);assert.equal(r.height,720);
  assert.equal(r.sampleCount,491);assert.equal(r.sampleCountStsz,491);assert.equal(r.mediaDurationSec,491/25);assert.ok(Math.abs(r.movieDurationSec-19.64)<0.001);
  assert.equal(r.keyframes.length,20);assert.equal(r.keyframes[1],26);
  assert.throws(()=>M.mux({width:1280,height:720,fps:25,samples:[{data:new Uint8Array(4),key:false}],avcC}),/first sample must be a keyframe/);
  assert.throws(()=>M.mux({width:1280,height:720,fps:7,samples,avcC}),/divide the timescale/);
  assert.equal(M.inspect(Uint8Array.from([0,0,0,8,...Buffer.from('ftyp')])).valid,false);
});
test('S1 manifest 0.2.0: carries the dossier identity and only the territory text its export policy allows',async()=>{
  const Dos=require('../js/construction-dossier-core.js'),X=require('../labs/ft3d-8/dossier-fixtures.js');
  const c=await X.dossier('A'),parcelDocument=await Dos.readParcelDocument(c.gml.text,{provider:X.stubProvider,associatedWith:c.gml.associatedWith});
  const e=await Dos.evaluate({...c,parcelDocument}),m=e.model,{snapshot}=fixtureBrand();
  const manifest=await D.createManifest({model:m,schedule:c.schedule,budget:c.budgets[0],brand:D.brandFor(snapshot),costPolicy:D.costPolicy(m,{mode:'summary',schedule:c.schedule}),
    title:'FIXTURE',intro:'',binding:c.binding,dossier:e,generatedAt:'2026-11-05T10:00:00Z'});
  assert.equal(manifest.schemaVersion,'0.2.0');
  assert.equal(manifest.dossier.id,e.dossier.id);assert.deepEqual(manifest.dossier.budgetIds,['bud_prj_fx-house-a']);
  assert.deepEqual({reference:manifest.territory.reference,geometryIncluded:manifest.territory.geometryIncluded},{reference:'FX00A00001AA01',geometryIncluded:false});
  const html=D.clientDocument(manifest);
  assert.ok(html.includes(e.dossier.id)&&html.includes('FX00A00001AA01')&&html.includes('Dirección General del Catastro'));
  // Restricted geometry never reaches the client file: no source coordinates of the parcel ring.
  for(const v of ['500030','4500020','500015','4500010'])assert.ok(!html.includes(v),'parcel coordinate '+v+' leaked');
  // A dossier with incompatibilities cannot be delivered; nor one of another subject.
  const bad=await Dos.evaluate({...c,budgets:[(await X.dossier('C')).budgets[0]]});
  await assert.rejects(D.createManifest({model:bad.model,schedule:c.schedule,brand:D.brandFor(null),costPolicy:null,title:'x',dossier:bad}),/incompatibilities/);
  const other=await Dos.evaluate(await X.dossier('C'));
  await assert.rejects(D.createManifest({model:m,schedule:c.schedule,brand:D.brandFor(null),costPolicy:null,title:'x',dossier:other}),/do not match/);
  // 0.1.0 manifests (no dossier) remain readable by the client document.
  const legacy={...manifest,schemaVersion:'0.1.0',dossier:undefined,territory:undefined};assert.match(D.clientDocument(legacy),/<!doctype html>/i);
});
test('every amount shown to the client says «sin IVA» (allocations are net C1-C4 amounts)',async()=>{
  const {c,m}=await ctxA(),{snapshot}=fixtureBrand();
  const pol=D.costPolicy(m,{mode:'tasks',schedule:c.schedule});
  const o=D.overlay(m,c.schedule,'2027-10-12',pol);assert.ok(o.cost.every(x=>/sin IVA/.test(x)),o.cost.join(' | '));
  assert.match(D.COSTS_NOTICE,/sin IVA/);
  const man=await D.createManifest({model:m,schedule:c.schedule,budget:c.budget,brand:D.brandFor(snapshot),costPolicy:pol,title:'FIXTURE',intro:'',binding:c.binding,generatedAt:'2026-11-05T10:00:00Z'});
  const html=D.clientDocument(man);assert.match(html,/<th>Importe sin IVA<\/th>/);assert.match(html,/asignado a las fases del plan, sin IVA/);
});
