// ENT-01 · rubik-sota.client-delivery v1: the read-only 3D snapshot for the client. Synthetic fixtures only (the
// contract examples of docs/contracts plus fields added here to prove they are removed). No network, no storage.
const test=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/client-delivery-core.js'),Core=require('../js/project-core.js');
const EX=require('../docs/contracts/examples/floorplan-project-v1.example.json'),BEX=require('../docs/contracts/examples/floorplan-building-v1.example.json');
const clone=v=>JSON.parse(JSON.stringify(v));
const NOW=new Date('2026-11-10T10:00:00Z'),RAND=()=>0.42;
// A project carrying everything a delivery must NOT carry: location/parcel, provenance, measurements, app data, file
// names and hashes of the source plan, free notes. The nested values are synthetic.
function rich(){
 const p=clone(EX);p.schemaVersion='1.12.0';
 p.site={northOffsetDeg:15,location:{label:'Calle Ficticia 1, Ciudad Ejemplo',lat:40.1,lon:-3.7},parcel:{reference:'0000000XX0000X0001XX'}};
 p.scale.note='Medida tomada por Persona Ficticia el lunes';
 p.walls[0].source={method:'manual',review:'confirmed'};p.walls[0].structureSource='professional';p.rooms[0].source={method:'manual',review:'confirmed'};
 p.extensions={};return p;
}
const build=(extra={})=>D.buildSnapshot({project:rich(),now:NOW,rand:RAND,revision:'rev-abc',versionCode:'v3',title:'Casa de prueba',studio:{name:'Estudio Ficticio'},...extra});

test('ENT-01 contract: a valid snapshot keeps the geometry and passes the strict canonical validator',()=>{
 const s=build();
 assert.equal(s.schema,'rubik-sota.client-delivery');assert.equal(s.version,1);assert.match(s.deliveryId,/^dlv_[a-z0-9]{16}$/);
 const p=s.content.project;
 for(const k of ['walls','openings','rooms','materials','objects'])assert.deepEqual(p[k].length,EX[k].length,k+' kept');
 assert.deepEqual(p.walls.map(w=>[w.id,w.start,w.end,w.thicknessMm,w.heightMm]),EX.walls.map(w=>[w.id,w.start,w.end,w.thicknessMm,w.heightMm]),'wall geometry identical');
 assert.deepEqual(p.rooms.map(r=>[r.id,r.polygon]),EX.rooms.map(r=>[r.id,r.polygon]),'room polygons identical');
 assert.doesNotThrow(()=>Core.validate(p,{strict:true}));
 assert.deepEqual(s.source,{kind:'project',id:EX.id,revision:'rev-abc',versionCode:'v3'},'revision identity kept');
 assert.deepEqual(s.capabilities,{walk:true,guided:false});
 assert.equal(D.validate(clone(s)).deliveryId,s.deliveryId,'round trip');
});

test('ENT-01 contract: excluded data is really absent, the source project is untouched',()=>{
 const src=rich(),before=JSON.stringify(src);const s=D.buildSnapshot({project:src,now:NOW,rand:RAND});
 assert.equal(JSON.stringify(src),before,'buildSnapshot never modifies the professional project');
 const text=JSON.stringify(s);
 for(const leak of ['Calle Ficticia','0000000XX0000X0001XX','Persona Ficticia','originalFileName','sha256','"measurements"','"app"','"extensions"','"placement"','"bytes"','"structureSource"'])assert.ok(!text.includes(leak),leak);
 const p=s.content.project;
 assert.deepEqual(p.site,{northOffsetDeg:15},'only the north survives');
 assert.equal(p.walls[0].source,undefined);assert.equal(p.rooms[0].source,undefined);assert.equal(p.scale.note,undefined);
 assert.deepEqual(p.sourceImages,[{id:EX.sourceImages[0].id,mediaType:EX.sourceImages[0].mediaType,widthPx:EX.sourceImages[0].widthPx,heightPx:EX.sourceImages[0].heightPx,storage:{kind:'local-browser'},visible:false}],'bare reference only, for the calibrated scale');
 assert.deepEqual(D.excluded(src).sort(),['app','extensions','measurements','rooms[].source','scale.note','site.location/parcel','sourceImages','walls[].source','walls[].structureSource'].sort());
});

test('ENT-01 contract: unknown schema, other version, too large, unknown or smuggled fields are refused',()=>{
 const ok=build();
 const bad=(mut,re)=>{const s=clone(ok);mut(s);assert.throws(()=>D.validate(s),re);};
 bad(s=>{s.schema='other';},/schema/);bad(s=>{s.version=2;},/version/);bad(s=>{s.extra=1;},/field extra/);
 assert.throws(()=>D.validate(clone(ok),{bytes:D.MAX_BYTES+1}),/too large/);
 bad(s=>{s.hero='data:image/png;base64,'+'A'.repeat(D.MAX_BYTES);},/too large|hero/);
 // Nested: a field the minimisation removes, put back by hand, is refused even when the canonical schema allows it.
 bad(s=>{s.content.project.measurements=[];},/fields outside the delivery contract/);
 bad(s=>{s.content.project.walls[0].source={method:'manual',review:'confirmed'};},/fields outside the delivery contract/);
 bad(s=>{s.content.project.site.location={label:'x',lat:1,lon:1};},/project|fields outside/);
 bad(s=>{s.content.project.sourceImages[0].originalFileName='plano.pdf';},/project|fields outside/);
 // A field the canonical schema does not know is refused by the strict validator.
 bad(s=>{s.content.project.walls[0].secretNote='x';},/project/);
 bad(s=>{s.content.project.rooms[0].polygon=[{x:0,y:0}];},/project/);
 bad(s=>{s.source.id='other';},/source mismatch/);
 bad(s=>{s.capabilities.guided=true;},/capabilities/);
 bad(s=>{s.deliveryId='dlv_../../x';},/id/);bad(s=>{s.createdAt='yesterday';},/date/);
});

test('ENT-01 contract: no URL, script scheme or credential-like value can travel in a delivery',()=>{
 const ok=build();
 const bad=(mut,re)=>{const s=clone(ok);mut(s);assert.throws(()=>D.validate(s),re);};
 bad(s=>{s.content.project.objects[0].name='https://tracker.example/pixel.png';},/url at \/content\/project\/objects\/0\/name/);
 bad(s=>{s.title='javascript:alert(1)';},/url/);bad(s=>{s.content.project.rooms[0].name='//evil.example/x';},/url/);
 bad(s=>{s.studio.name='vercel_blob_rw_abc_123';},/secret-like/);bad(s=>{s.content.project.name='sk-'+'a'.repeat(30);},/secret-like/);
 bad(s=>{s.hero='data:image/svg+xml;base64,PHN2Zz4=';},/hero/);bad(s=>{s.studio.logo='data:image/jpeg;base64,AAAA';},/logo/);
 bad(s=>{s.hero='data:image/png;base64,AAA<script>';},/hero/);
 // Control characters in free text are flattened at build time.
 assert.equal(build({title:'Casa\u0000\u0007 de prueba'}).title,'Casa   de prueba');
 // The professional's codes are never part of the input contract: an unknown input field does not reach the snapshot.
 const s=D.buildSnapshot({project:rich(),now:NOW,rand:RAND,code:'share-fixture-code-0123456789abcdef',token:'render-fixture'});
 assert.ok(!JSON.stringify(s).includes('fixture'));
});

test('ENT-01 contract: guided presentation only with rooms that exist; multi-level buildings; revision identity',()=>{
 const p=rich(),rooms=p.rooms.map(r=>r.id);
 const g=D.buildSnapshot({project:p,now:NOW,rand:RAND,presentation:{sidecars:[{projectId:p.id,roomIds:[rooms[0],'rom_does-not-exist',rooms[0]]}]}});
 assert.deepEqual(g.presentation.sidecars,[{projectId:p.id,levelId:null,roomIds:[rooms[0]]}],'unknown rooms dropped, duplicates removed');
 assert.equal(g.capabilities.guided,true);
 const bad=clone(g);bad.presentation.sidecars[0].roomIds.push('rom_invented');assert.throws(()=>D.validate(bad),/sidecar room/);
 const none=D.buildSnapshot({project:p,now:NOW,rand:RAND,presentation:{sidecars:[{projectId:p.id,roomIds:['rom_invented']}]}});
 assert.equal(none.capabilities.guided,false,'Rubik never invents a selection');
 const b=D.buildSnapshot({building:clone(BEX),now:NOW,rand:RAND,versionCode:'b1'});
 assert.equal(b.source.kind,'building');assert.equal(b.content.building.levels.length,BEX.levels.length);
 assert.deepEqual(b.presentation.levels.map(l=>l.levelId),BEX.levels.map(l=>l.id));
 assert.equal(D.validate(clone(b)).source.versionCode,'b1');
 const bb=clone(b);bb.content.building.levels[0].project.measurements=[];assert.throws(()=>D.validate(bb),/fields outside the delivery contract/);
 // Two snapshots of the same revision differ only by id/date: the content is deterministic.
 const a1=build(),a2=D.buildSnapshot({project:rich(),now:new Date('2026-11-11T10:00:00Z'),rand:()=>0.1,revision:'rev-abc',versionCode:'v3',title:'Casa de prueba',studio:{name:'Estudio Ficticio'}});
 assert.deepEqual(a1.content,a2.content);assert.notEqual(a1.deliveryId,a2.deliveryId);
});

test('ENT-01 contract: a project without rooms or walls is delivered without the walk capability',()=>{
 const p=rich();p.rooms=[];p.objects=p.objects.map(o=>{const x=clone(o);delete x.roomId;return x;});
 const s=D.buildSnapshot({project:p,now:NOW,rand:RAND});assert.equal(s.capabilities.walk,false);assert.equal(s.capabilities.guided,false);
});

// Review 10/11: these snapshots were ACCEPTED by e43061d (or, for the reordered one, wrongly REFUSED). Each must now fail
// (or pass) for the stated reason.
test('ENT-01 contract: no unauthorised field at ANY level of the envelope, numbers and nested objects included',()=>{
 const ok=build();
 const bad=(name,mut,re)=>{const s=clone(ok);mut(s);assert.throws(()=>D.validate(s),re,name);};
 bad('content',s=>{s.content.trackingId=12345;},/content\.trackingId/);
 bad('presentation',s=>{s.presentation.gps={lat:40.4,lon:-3.7};},/presentation\.gps/);
 bad('presentation.levels',s=>{s.presentation.levels[0].clientId=987;},/presentation\.levels\.clientId/);
 bad('presentation.levels nested',s=>{s.presentation.levels[0].meta={visits:3};},/presentation\.levels\.meta/);
 bad('presentation.scope',s=>{s.presentation.scope='elsewhere';},/presentation/);
 bad('presentation.levels count',s=>{s.presentation.levels.push({levelId:null,name:'',order:1});},/presentation/);
 bad('presentation.levels order',s=>{s.presentation.levels[0].order=1.5;},/presentation\.levels/);
 bad('sidecar',s=>{s.presentation.sidecars=[{projectId:s.content.project.id,levelId:null,roomIds:[s.content.project.rooms[0].id],note:{a:1}}];s.capabilities.guided=true;},/presentation\.sidecars\.note/);
 bad('provenance extra',s=>{s.provenance.sessionId=42;},/provenance\.sessionId/);
 bad('provenance value',s=>{s.provenance.geometry={tracked:true};},/provenance/);
 bad('capabilities extra',s=>{s.capabilities.analytics=1;},/capabilities\.analytics/);
 bad('studio extra',s=>{s.studio.taxId=12345678;},/studio/);
 bad('source extra',s=>{s.source.userId=7;},/source/);
});

test('ENT-01 contract: field order does not matter (structural comparison, not JSON text)',()=>{
 const s=clone(build());
 const rev=o=>Object.fromEntries(Object.entries(o).reverse());
 s.content.project=rev(s.content.project);s.content.project.walls=s.content.project.walls.map(rev);s.content.project.scale=rev(s.content.project.scale);
 s.presentation=rev(s.presentation);s.provenance=rev(s.provenance);
 assert.doesNotThrow(()=>D.validate(s),'same fields in another order are valid');
 const b=clone(D.buildSnapshot({building:clone(BEX),now:NOW,rand:RAND}));b.content.building=rev(b.content.building);b.content.building.levels=b.content.building.levels.map(rev);
 assert.doesNotThrow(()=>D.validate(b));
});

test('ENT-01 contract: URL detection inside texts — what is detected and what is documented as not detected',()=>{
 const ok=build();
 const bad=(text,where)=>{const s=clone(ok);where(s,text);assert.throws(()=>D.validate(s),/url/,text);};
 const name=(s,t)=>{s.content.project.rooms[0].name=t;};
 for(const t of ['Ver https://tracker.example/x','salón (http://a.b)','foto ftp://host/f','enlace //cdn.example/x','visita www.example.com','x javascript:alert(1)','img data:image/png;base64,AA','JAVASCRIPT :void(0)'])bad(t,name);
 bad('Ver https://x.example',(s,t)=>{s.title=t;});
 // Not URLs: ordinary room names and measurements are accepted.
 for(const t of ['Salón 1/2','Dormitorio: principal','Baño 2,5 m²','Terraza (sur)']){const s=clone(ok);name(s,t);assert.doesNotThrow(()=>D.validate(s),t);}
 // Documented limitation: a bare domain without scheme or www is not detected (texts are shown as text, never fetched).
 {const s=clone(ok);name(s,'ejemplo.com/x');assert.doesNotThrow(()=>D.validate(s));}
});
