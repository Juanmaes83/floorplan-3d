// Delivery 3D V1: the client delivery is a versioned, read-only snapshot, not a copy of the editable project. These
// tests pin the allow-list, the validity of what is kept (the app's own validators), the presentation decision, the
// versioning and the strict validation of anything received from the network.
const test=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/project-core.js'),B=require('../js/building-core.js'),D=require('../js/delivery-core.js');
const F=require('./fixtures/building-fixture.cjs');
const F1B=require('../docs/contracts/examples/floorplan-project-v1.f1b.example.json');
const clone=v=>JSON.parse(JSON.stringify(v));
const seeded=()=>{let i=0;return ()=>((i++*7919)%997)/997;};
const NOW=new Date('2026-11-04T10:00:00.000Z');

// A project carrying everything a delivery must NOT publish.
function loaded(){
 const p=clone(F1B);
 p.measurements=p.measurements||[];p.measurements.push({id:'mea_private',note:'medida privada'});
 p.app={name:'Rubik',commit:'abc123'};p.extensions={'x-studio':{client:'Nombre Cliente',phone:'600000000'}};
 p.sourceImages[0].originalFileName='Calle Mayor 12, 3ºB - plano.png';
 p.schemaVersion='1.7.0';p.site={northOffsetDeg:12,location:{lat:40.4,lon:-3.7,address:'Calle Mayor 12'},parcel:{ref:'1234567VK4713S0001AB'},orthophoto:{url:'https://example.com/o.png'},terrain:{x:1},placement:{x:1}};
 return p;
}

test('keeps exactly what the 3D view renders and drops everything else',()=>{
 const p=loaded(),out=D.sanitizeProject(p),text=JSON.stringify(out);
 for(const k of Object.keys(out))assert.ok(D.PROJECT_KEEP.includes(k)||k==='site'||k==='sourceImages',k);
 for(const k of ['measurements','app','extensions'])assert.equal(out[k],undefined,k);
 assert.deepEqual(out.site,{northOffsetDeg:12},'only the north survives from the site');
 for(const secret of ['Calle Mayor','1234567VK4713S0001AB','example.com','Nombre Cliente','600000000','medida privada','abc123','images/img_synthetic.png',F1B.sourceImages[0].sha256])
  assert.ok(!text.includes(secret),'leaked: '+secret);
 assert.deepEqual(out.walls,p.walls);assert.deepEqual(out.openings,p.openings);assert.deepEqual(out.rooms,p.rooms);assert.deepEqual(out.objects,p.objects);
 assert.deepEqual(D.excluded(p).sort(),['app','extensions','measurements','site.location/parcel/orthophoto/terrain','sourceImages'].sort());
});

test('a «real» scale stays verifiable with a bare image reference, never the image or its name',()=>{
 const out=D.sanitizeProject(loaded());
 assert.deepEqual(out.scale,F1B.scale,'scale unchanged: the client is told the truth about dimensions');
 assert.deepEqual(out.sourceImages,[{id:'img_synthetic',mediaType:'image/png',widthPx:480,heightPx:320,storage:{kind:'local-browser'},visible:false}]);
 const p=clone(F1B);p.scale={confidence:'estimated',method:'template'};p.sourceImages=[...p.sourceImages];
 assert.equal(D.sanitizeProject(p).sourceImages,undefined,'no reference when the scale names no image');
});

test('what is kept passes the app\'s own validators (project, F1B with real scale, two-level building)',()=>{
 C.validate(D.sanitizeProject(loaded()));
 const b=F.build().building;
 for(const l of b.levels)C.validate(D.sanitizeProject(l.project));
 const sb=D.sanitizeBuilding(b);B.validate(sb);
 assert.deepEqual(sb.levels.map(l=>l.id),b.levels.map(l=>l.id));assert.deepEqual(sb.stairs,b.stairs);
 assert.ok(!JSON.stringify(sb).includes('sha256'),'no image hashes');
});

test('snapshot: versioned, presentation decision filtered to real rooms, capabilities from the model',()=>{
 const p=loaded(),rooms=p.rooms.map(r=>r.id);
 const s=D.buildSnapshot({project:p,presentation:{sidecars:[{projectId:p.id,roomIds:[rooms[0],'rom_ghost',rooms[0]]},{projectId:'prj_other',roomIds:[rooms[0]]}]},revision:'r1+r2',versionCode:'e33407d8',title:'Casa\u0000 Serra',lang:'zh',studio:{name:'Estudio',logo:'data:image/svg+xml;base64,AAA'},hero:'https://example.com/x.jpg',now:NOW,rand:seeded()});
 assert.equal(s.schema,'rubik-sota.client-delivery');assert.equal(s.version,1);assert.match(s.deliveryId,/^dlv_[a-z0-9]{16}$/);
 assert.equal(s.createdAt,NOW.toISOString());assert.deepEqual(s.source,{kind:'project',id:p.id,revision:'r1+r2',versionCode:'e33407d8'});
 assert.equal(s.title,'Casa  Serra','control characters removed');assert.equal(s.lang,'zh');
 assert.equal(s.studio.logo,null,'only PNG logos');assert.equal(s.hero,null,'only data-URL JPEG/PNG heroes: never a remote URL');
 assert.deepEqual(s.presentation.sidecars,[{projectId:p.id,levelId:null,roomIds:[rooms[0]]}],'unknown rooms, duplicates and other projects dropped');
 assert.deepEqual(s.capabilities,{walk:true,guided:true});assert.equal(s.provenance.context,'none');
 assert.equal(D.validate(s),s);
 const none=D.buildSnapshot({project:p,presentation:{sidecars:[{projectId:p.id,roomIds:['rom_ghost']}]}});assert.equal(none.capabilities.guided,false,'no prepared presentation: walk only');
 const empty=clone(p);empty.walls=[];empty.rooms=[];empty.openings=[];empty.objects=[];
 assert.deepEqual(D.buildSnapshot({project:empty}).capabilities,{walk:false,guided:false},'no 3D capability claimed without walls and rooms');
 assert.notEqual(D.buildSnapshot({project:p}).deliveryId,D.buildSnapshot({project:p}).deliveryId,'each delivery has its own id');
});

test('building snapshot: one sidecar per level, levels in order',()=>{
 const b=F.build().building,[g,u]=b.levels;
 const s=D.buildSnapshot({building:b,presentation:{scope:'building',sidecars:[{projectId:g.project.id,levelId:g.id,roomIds:g.project.rooms.map(r=>r.id)},{projectId:u.project.id,roomIds:[u.project.rooms[0].id]}]},now:NOW});
 assert.equal(s.source.kind,'building');assert.equal(s.presentation.scope,'building');
 assert.deepEqual(s.presentation.sidecars.map(x=>x.levelId),[g.id,u.id]);
 assert.deepEqual(s.presentation.levels.map(l=>l.levelId),[g.id,u.id]);
 assert.ok(s.content.building&&!s.content.project);D.validate(s);
});

test('validate refuses anything outside the contract',()=>{
 const good=D.buildSnapshot({project:loaded(),now:NOW});
 const bad=(mut,msg)=>{const s=clone(good);mut(s);assert.throws(()=>D.validate(s),msg);};
 bad(s=>s.schema='rubik-sota.floorplan-project',/schema/);
 bad(s=>s.version=2,/version/);
 bad(s=>s.deliveryId='../../x',/id/);
 bad(s=>s.createdAt='ayer',/date/);
 bad(s=>s.capabilities={walk:'yes',guided:false},/capabilities/);
 bad(s=>s.hero='https://evil.example/x.png',/hero/);
 bad(s=>s.hero='data:image/svg+xml;base64,PHN2Zz4=',/hero/);
 bad(s=>s.hero='data:image/jpeg;base64,'+'A'.repeat(D.MAX_HERO),/hero/);
 bad(s=>s.studio.logo='data:image/jpeg;base64,AAAA',/logo/);
 bad(s=>s.content.building={levels:[]},/content/);
 bad(s=>s.content.project.measurements=[],/field measurements/);
 bad(s=>s.content.project.extensions={},/field extensions/);
 bad(s=>s.content.project.site.location={lat:1},/site/);
 bad(s=>s.content.project.sourceImages[0].originalFileName='Calle Mayor.png',/sourceImages/);
 bad(s=>s.content.project.sourceImages[0].storage={kind:'remote',ref:'https://x'},/sourceImages/);
 bad(s=>s.content.project.sourceImages[0].visible=true,/sourceImages/);
 bad(s=>s.presentation.sidecars=[{projectId:1,roomIds:[]}],/sidecar/);
 bad(s=>delete s.presentation,/presentation/);
 assert.throws(()=>D.validate(good,{bytes:D.MAX_BYTES+1}),/too large/);
 assert.throws(()=>D.validate(null),/schema/);
});
