// «Tu marca profesional», pure part: validation, several profiles, per-project delivery, frozen snapshots, removal
// and old or damaged local data. Uses an in-memory Storage.
const {test}=require('node:test'),assert=require('node:assert/strict');
const Brand=require('../js/brand-core.js');
const store=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),dump:()=>Object.fromEntries(m)};};
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';

test('validates and normalises a profile; rejects unsafe links, SVG/active logos and empty names',()=>{
 const p=Brand.normalizeProfile({name:'  Estudio  Norte ',person:'Ana Ruiz',phone:'+34 600 11 22 33',email:'ana@estudionorte.es',web:'estudionorte.es/',tagline:'Arquitectura\ninterior',logo:PNG});
 assert.equal(p.name,'Estudio Norte');assert.equal(p.web,'https://estudionorte.es');assert.equal(p.tagline,'Arquitectura interior');assert.equal(p.logo,PNG);
 assert.throws(()=>Brand.normalizeProfile({name:''}),/nombre comercial/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',web:'javascript:alert(1)'}),/http:\/\/ o https:\/\//);
 assert.throws(()=>Brand.normalizeProfile({name:'A',web:'https://user:pw@x.es'}),/usuario ni contraseña/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',web:'https://localhost'}),/dominio/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',email:'ana@'}),/correo/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',phone:'llámame'}),/teléfono/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',logo:'data:image/svg+xml;base64,PHN2Zz4='}),/PNG convertida/);
 assert.throws(()=>Brand.normalizeProfile({name:'A',logo:'data:image/png;base64,'+'A'.repeat(500*1024)}),/300 KB/);
 assert.equal(Brand.normalizeProfile({name:'x'.repeat(200)}).name.length,Brand.LIMITS.name);
});

test('several profiles, per-project choice, frozen snapshot and removal',()=>{
 const s=store(),a=Brand.saveProfile(s,{name:'Inmobiliaria Sol',phone:'910 000 000'},'2026-10-20T10:00:00.000Z'),b=Brand.saveProfile(s,{name:'Estudio Norte',email:'hola@norte.es'});
 assert.match(a.id,/^brd_/);assert.notEqual(a.id,b.id);assert.equal(Brand.readProfiles(s).profiles.length,2);
 assert.equal(Brand.snapshot(s,'ent_1','Piso Centro'),null,'no brand until a project chooses one');
 Brand.setDelivery(s,'ent_1',{profileId:a.id,title:'Ático en Chamberí',intro:'Propuesta de distribución.'});Brand.setDelivery(s,'ent_2',{profileId:b.id});
 const snap=Brand.snapshot(s,'ent_1','Piso Centro','2026-10-20T11:00:00.000Z');
 assert.equal(snap.profile.name,'Inmobiliaria Sol');assert.equal(snap.title,'Ático en Chamberí');assert.equal(snap.takenAt,'2026-10-20T11:00:00.000Z');assert.ok(Object.isFrozen(snap)&&Object.isFrozen(snap.profile));
 assert.equal(Brand.snapshot(s,'ent_2','Casa Norte').title,'Casa Norte','the project name when no title is given');
 // Editing the profile later does not change an existing snapshot.
 Brand.saveProfile(s,{...a,name:'Inmobiliaria Sol y Mar'});assert.equal(snap.profile.name,'Inmobiliaria Sol');assert.equal(Brand.snapshot(s,'ent_1','x').profile.name,'Inmobiliaria Sol y Mar');
 assert.throws(()=>Brand.setDelivery(s,'ent_1',{profileId:'brd_missing00'}),/ya no existe/);
 // Removing a profile leaves its projects without a brand (complete deliverable as before).
 Brand.removeProfile(s,a.id);assert.equal(Brand.snapshot(s,'ent_1','x'),null);assert.equal(Brand.delivery(s,'ent_1').profileId,null);assert.equal(Brand.delivery(s,'ent_1').title,'Ático en Chamberí');
 assert.equal(Brand.contactLine({person:'Ana',phone:'1',email:'a@b.es',web:'https://b.es'}),'Ana · 1 · a@b.es · b.es');
 assert.equal(Brand.credit({name:'Estudio Norte'}),'Preparado por Estudio Norte con Rubik Sota');
});

test('old, damaged or foreign local data never breaks the editor',()=>{
 const s=store();s.setItem(Brand.PROFILES_KEY,'{not json');s.setItem(Brand.DELIVERY_KEY,'[]');
 assert.deepEqual(Brand.readProfiles(s),{version:1,profiles:[]});assert.equal(Brand.snapshot(s,'ent_1','x'),null);
 s.setItem(Brand.PROFILES_KEY,JSON.stringify({version:1,profiles:[{id:'brd_good0001',name:'Bien'},{id:'mal',name:'Sin prefijo'},{id:'brd_bad00001',name:'',web:'x'},{id:'brd_js000001',name:'J',web:'javascript:1'}]}));
 assert.deepEqual(Brand.readProfiles(s).profiles.map(p=>p.name),['Bien'],'invalid stored profiles are skipped, not trusted');
 s.setItem(Brand.PROFILES_KEY,JSON.stringify({version:2,profiles:[{id:'brd_good0001',name:'Futuro'}]}));assert.equal(Brand.readProfiles(s).profiles.length,0,'unknown future version is not misread');
 const many=store();for(let i=0;i<Brand.MAX_PROFILES;i++)Brand.saveProfile(many,{name:'M'+i});assert.throws(()=>Brand.saveProfile(many,{name:'Otra'}),/hasta 12/);
});
