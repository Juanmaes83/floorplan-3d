// CAT-02 · CatalogProductV1 (pure part): schema, five synthetic sheets, unknown values, duplicate SKU, contradictory
// variants, brand honesty, licences, versioning, search/filters, frozen selection, exportable sheet, local pilot
// storage scoped by studio and the read-only CatalogCapabilitiesForAssistantV1 interface.
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const C=require('../js/catalog-product-core.js');
const ROOT=path.join(__dirname,'..'),PILOT=JSON.parse(fs.readFileSync(path.join(ROOT,'assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const TODAY='2026-11-14',AT='2026-11-14T14:00:00.000Z';
const store=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),map:m};};
const clone=v=>JSON.parse(JSON.stringify(v));
const base=()=>clone(PILOT.products[0]);
const codes=r=>r.ok?[]:r.errors.map(e=>e.code);
const pilot=()=>C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'estudio-norte',name:'Piloto',at:AT}),PILOT,{today:TODAY,at:AT});

test('own SHA-256 matches node:crypto (empty, ASCII, UTF-8 and multi-block)',()=>{
 for(const s of ['','abc','Ático en Chamberí · 设计','x'.repeat(1000)])assert.equal(C.sha256(s),crypto.createHash('sha256').update(s,'utf8').digest('hex'));
 assert.equal(C.canonical({b:1,a:[{d:2,c:null}]}),'{"a":[{"c":null,"d":2}],"b":1}');
});

test('the five pilot sheets are valid, their images exist with the declared SHA-256 and the pilot covers the required cases',()=>{
 assert.equal(PILOT.products.length,5);
 for(const p of PILOT.products){const r=C.validateProduct(p,{today:TODAY});assert.ok(r.ok,p.sku+': '+JSON.stringify(r.errors));
  for(const im of p.imageRefs){const bytes=fs.readFileSync(path.join(ROOT,im.path));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),im.sha256,im.path);assert.deepEqual([...bytes.subarray(0,4)],[0x89,0x50,0x4e,0x47]);}}
 const v=PILOT.products.map(p=>C.validateProduct(p,{today:TODAY}).product);
 assert.ok(v.some(p=>p.kind==='furniture')&&v.some(p=>p.kind==='appliance')&&v.some(p=>p.kind==='material'));
 assert.equal(v.filter(p=>p.productId==='aparador-lumen').length,2,'one product with two variants');
 assert.ok(v.some(p=>p.dimensionsStatus==='unknown'),'one sheet with unknown dimensions');
 assert.ok(v.some(p=>p.commercial.netUnitPrice===null&&p.commercial.priceStatus==='unknown'),'one sheet with unknown price');
 assert.ok(v.every(p=>p.availability.status==='unknown'),'availability is unknown by default');
 assert.ok(v.every(p=>p.brandKind==='synthetic'&&p.affiliation==='none'&&!C.markIn(p.brand,p.manufacturer,p.displayName)));
});

test('unknown is a value: null dimensions/price stay null; zero, negative, guesses and swapped units are rejected',()=>{
 const p=base();p.dimensionsMm={width:null,height:780,depth:null};let r=C.validateProduct(p,{today:TODAY});assert.ok(r.ok);assert.equal(r.product.dimensionsStatus,'partial');assert.equal(r.product.dimensionsMm.width,null);
 for(const bad of [0,-5,'600',NaN,Infinity,30000]){const q=base();q.dimensionsMm.width=bad;assert.deepEqual(codes(C.validateProduct(q,{today:TODAY})),['dimension-invalid'],String(bad));}
 const metres=base();metres.dimensionsMm={width:1.6,height:0.78,depth:0.45};assert.ok(codes(C.validateProduct(metres,{today:TODAY})).every(c=>c==='dimension-implausible'));
 const tall=clone(PILOT.products[2]);tall.dimensionsMm.height=5950;assert.deepEqual(codes(C.validateProduct(tall,{today:TODAY})),['dimension-implausible'],'appliance width/height incongruent');
 const noProv=base();noProv.dimensionsProvenance=null;assert.deepEqual(codes(C.validateProduct(noProv,{today:TODAY})),['dimensions-without-provenance']);
 const zero=base();zero.commercial.netUnitPrice=0;assert.deepEqual(codes(C.validateProduct(zero,{today:TODAY})),['price-invalid'],'never a fictitious 0');
 const noDate=base();noDate.commercial.verifiedAt=null;assert.deepEqual(codes(C.validateProduct(noDate,{today:TODAY})),['price-without-date']);
 const noSrc=base();noSrc.commercial.priceSource='';assert.deepEqual(codes(C.validateProduct(noSrc,{today:TODAY})),['price-without-source']);
 const future=base();future.commercial.verifiedAt='2027-01-01';assert.ok(codes(C.validateProduct(future,{today:TODAY})).includes('date-invalid'));
 const vat=base();vat.commercial.vatRate=21;assert.deepEqual(codes(C.validateProduct(vat,{today:TODAY})),['vat-invalid']);
 const stock=base();stock.availability={status:'in-stock'};assert.deepEqual(codes(C.validateProduct(stock,{today:TODAY})),['availability-unverified'],'no «in stock» without a dated source');
 stock.availability={status:'in-stock',source:'Llamada al distribuidor (sintética)',verifiedAt:TODAY};assert.ok(C.validateProduct(stock,{today:TODAY}).ok);
});

test('brand honesty: false/misattributed marks, third-party without source, affiliation without proof',()=>{
 const fake=base();fake.brand='IKEA';assert.ok(codes(C.validateProduct(fake,{today:TODAY})).includes('brand-misattributed'));
 const hidden=base();hidden.displayName='Horno estilo Bosch';assert.ok(codes(C.validateProduct(hidden,{today:TODAY})).includes('brand-misattributed'),'mark hidden in the name');
 assert.equal(C.markIn('Bosquejo nórdico'),null,'no false positives on substrings');
 const third=base();Object.assign(third,{brand:'Siemens',manufacturer:'Siemens',brandKind:'third-party',source:{kind:'retailer',ref:null}});
 assert.ok(codes(C.validateProduct(third,{today:TODAY})).includes('brand-without-source'));
 third.source.ref='Tarifa del distribuidor aportada por el estudio (2026-11)';assert.ok(C.validateProduct(third,{today:TODAY}).ok,'documented third-party brand, no affiliation');
 third.affiliation='official';assert.ok(codes(C.validateProduct(third,{today:TODAY})).includes('affiliation-without-proof'));
 Object.assign(third.source,{kind:'authorized-brand',proofRef:'contrato-marca-2026.pdf'});assert.ok(C.validateProduct(third,{today:TODAY}).ok);
 const synth=base();synth.source={kind:'client',ref:'x'};assert.ok(codes(C.validateProduct(synth,{today:TODAY})).includes('invalid-enum'),'synthetic brand only for synthetic fixtures');
});

test('images and licences: without permission, wrong scope, expired, bad path/type/hash are rejected',()=>{
 const noPerm=base();noPerm.imageRefs[0].license={scope:['qa'],proofRef:'x'};assert.deepEqual(codes(C.validateProduct(noPerm,{today:TODAY})),['image-permission']);
 const noProof=base();noProof.imageRefs[0].license.proofRef='';assert.deepEqual(codes(C.validateProduct(noProof,{today:TODAY})),['image-permission']);
 const rights=base();rights.imageRefs[0].usageRights='unknown';assert.deepEqual(codes(C.validateProduct(rights,{today:TODAY})),['image-permission']);
 const expired=base();expired.imageRefs[0].license.expiresAt='2026-11-01';assert.deepEqual(codes(C.validateProduct(expired,{today:TODAY})),['license-expired']);
 const sheetExpired=base();sheetExpired.license.expiresAt='2025-01-01';assert.deepEqual(codes(C.validateProduct(sheetExpired,{today:TODAY})),['license-expired']);
 for(const mut of [im=>im.path='https://example.com/a.png',im=>im.path='assets/cat-ia/fixtures/../../x.png',im=>im.mediaType='image/jpeg',im=>im.sha256='abc',im=>im.path='assets/cat-ia/fixtures/a.svg']){const q=base();mut(q.imageRefs[0]);assert.deepEqual(codes(C.validateProduct(q,{today:TODAY})),['image-invalid']);}
 const many=base();many.imageRefs=[0,1,2,3].map(()=>clone(base().imageRefs[0]));assert.ok(codes(C.validateProduct(many,{today:TODAY})).includes('too-many'));
 const link=base();link.technicalSheet={url:'javascript:alert(1)'};assert.deepEqual(codes(C.validateProduct(link,{today:TODAY})),['url-invalid']);
 link.technicalSheet={url:'https://u:p@example.com/x.pdf'};assert.deepEqual(codes(C.validateProduct(link,{today:TODAY})),['url-invalid']);
 const model=base();model.model3dRef={catalog:'rubik-sota-local',assetId:'x'};assert.deepEqual(codes(C.validateProduct(model,{today:TODAY})),['model-ref-invalid']);
});

test('text is cleaned (control chars, whitespace), long text is limited at validation, never silently cut later',()=>{
 const p=base();p.displayName='  Aparador\u0000 <b>Lumen</b>\n  160 ';p.description='d'.repeat(900);const r=C.validateProduct(p,{today:TODAY});
 assert.ok(r.ok);assert.equal(r.product.displayName,'Aparador <b>Lumen</b> 160');assert.equal(r.product.description.length,C.LIMITS.description);
 assert.ok(!C.validateProduct(null).ok);assert.ok(!C.validateProduct([]).ok);assert.deepEqual(codes(C.validateProduct({...base(),sku:'qa lower'},{today:TODAY})),['invalid-sku']);
 assert.deepEqual(codes(C.validateProduct({...base(),productId:'Bad Id'},{today:TODAY})),['invalid-id']);
});

test('import: five sheets enter revision 1; duplicate SKU and contradictory variants are rejected with reasons',()=>{
 const r=pilot();assert.equal(r.accepted.length,5);assert.equal(r.rejected.length,0);assert.equal(r.catalog.revision,1);assert.match(r.catalog.revisionHash,/^[0-9a-f]{64}$/);
 assert.equal(r.catalog.history.length,1);assert.equal(r.catalog.products.every(p=>p.productVersion===1),true);
 const dupe=clone(PILOT.products[2]);dupe.productId='horno-h60-bis';const d=C.importCollection(r.catalog,[dupe],{today:TODAY,at:AT});
 assert.equal(d.changed,false);assert.equal(d.catalog.revision,1);assert.deepEqual(d.rejected[0].errors.map(e=>e.code),['sku-duplicate']);
 const contra=clone(PILOT.products[0]);Object.assign(contra,{variantId:'blanco',sku:'QA-LUMEN-160-BL',family:'dormitorios'});
 assert.deepEqual(C.importCollection(r.catalog,[contra],{today:TODAY}).rejected[0].errors.map(e=>e.code),['variant-contradictory']);
 const batchDupe=[clone(PILOT.products[4]),Object.assign(clone(PILOT.products[4]),{variantId:'blanco'})];
 const b=C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'estudio-norte'}),batchDupe,{today:TODAY});assert.equal(b.accepted.length,1);assert.equal(b.rejected[0].errors[0].code,'sku-duplicate','duplicate inside the same batch');
 const other=clone(PILOT.products[0]);other.catalogId='otro-catalogo';assert.ok(C.importCollection(r.catalog,[other],{today:TODAY}).rejected[0].errors.some(e=>e.code==='catalog-mismatch'));
 assert.throws(()=>C.importCollection(r.catalog,{schema:'otra/1',products:[]}),/invalid collection/);
});

test('versioning: an edit makes productVersion 2 and revision 2; re-importing the same content changes nothing',()=>{
 const r1=pilot().catalog;const same=C.importCollection(r1,PILOT,{today:TODAY,at:'2026-11-14T15:00:00.000Z'});assert.equal(same.changed,false);assert.equal(same.unchanged.length,5);assert.equal(same.catalog.revisionHash,r1.revisionHash);
 const edit=clone(PILOT.products[0]);edit.commercial.netUnitPrice=710;const r2=C.importCollection(r1,[edit],{today:TODAY,at:'2026-11-14T16:00:00.000Z'});
 assert.equal(r2.catalog.revision,2);assert.notEqual(r2.catalog.revisionHash,r1.revisionHash);assert.deepEqual(r2.updated,['aparador-lumen@roble']);
 assert.equal(C.findProduct(r2.catalog,'aparador-lumen','roble').productVersion,2);assert.equal(C.findProduct(r2.catalog,'aparador-lumen','nogal').productVersion,1);
 assert.equal(C.findProduct(r1,'aparador-lumen','roble').commercial.netUnitPrice,690,'the previous revision object is not mutated');
 assert.deepEqual(r2.catalog.history.map(h=>h.revision),[1,2]);
});

test('search and filters: text (diacritics), family, kind, price/dimensions known or unknown, review',()=>{
 const c=pilot().catalog,ids=l=>l.map(C.keyOf).sort();
 assert.deepEqual(ids(C.search(c,{q:'lumen'})),['aparador-lumen@nogal','aparador-lumen@roble']);
 assert.deepEqual(ids(C.search(c,{q:'LÁMPARA'})),['lampara-orbe@ambar']);
 assert.deepEqual(ids(C.search(c,{q:'qa-h60'})),['horno-h60@inox']);
 assert.deepEqual(ids(C.search(c,{family:'electrodomesticos'})),['horno-h60@inox']);
 assert.deepEqual(ids(C.search(c,{price:'unknown'})),['horno-h60@inox']);
 assert.deepEqual(ids(C.search(c,{dims:'unknown'})),['encimera-basalto@-']);
 assert.equal(C.search(c,{kind:'furniture',price:'known'}).length,2);assert.equal(C.search(c,{review:'APPROVED'}).length,0);
 const res=C.search(c,{q:'lumen'});res[0].sku='MUTATED';assert.notEqual(C.search(c,{q:'lumen'})[0].sku,'MUTATED','results are copies');
});

test('frozen selection: later catalogue edits do not change a delivered selection',()=>{
 const r1=pilot().catalog,sel=C.freezeSelection(r1,[{productId:'aparador-lumen',variantId:'roble',quantity:2},{productId:'horno-h60',variantId:'inox'}],{at:AT,projectId:'prj-qa'});
 assert.ok(Object.isFrozen(sel)&&Object.isFrozen(sel.items[0].product.commercial));assert.equal(sel.catalogRevision,1);assert.match(sel.hash,/^[0-9a-f]{64}$/);
 const edit=clone(PILOT.products[0]);edit.commercial.netUnitPrice=999;const r2=C.importCollection(r1,[edit],{today:TODAY}).catalog;
 assert.equal(sel.items[0].product.commercial.netUnitPrice,690);assert.equal(C.findProduct(r2,'aparador-lumen','roble').commercial.netUnitPrice,999);
 const{hash,...body}=sel;assert.equal(C.hashOf(body),hash,'hash verifiable');
 assert.throws(()=>C.freezeSelection(r1,[{productId:'no-existe'}]),/unknown product/);assert.throws(()=>C.freezeSelection(r1,[{productId:'horno-h60',variantId:'inox',quantity:0}]),/quantity/);
});

test('exportable sheet: ES/EN/ZH, unknown values marked, notices (AI-free, no affiliation, synthetic), escaped HTML, nothing truncated',()=>{
 const c=pilot().catalog;
 const oven=C.sheet(c,'horno-h60','inox',{lang:'es',brand:{name:'Estudio <Norte>',email:'hola@norte.es'},at:AT});
 const row=k=>oven.rows.find(r=>r[0]===k);assert.equal(row('price')[2],'Desconocido');assert.equal(row('price')[3],'unknown');assert.equal(row('width')[2],'595 mm');
 assert.ok(oven.notices.some(n=>/Sin afiliación/.test(n))&&oven.notices.some(n=>/Fixture sintético/.test(n))&&oven.notices.some(n=>/Precio desconocido/.test(n)));
 const top=C.sheet(c,'encimera-basalto',null,{lang:'en',at:AT});assert.equal(top.rows.find(r=>r[0]==='width')[2],'Not verified');assert.ok(top.notices.some(n=>/Incomplete dimensions/.test(n)));
 const zh=C.sheet(c,'lampara-orbe','ambar',{lang:'zh',at:AT});assert.ok(zh.notices.some(n=>/合成/.test(n)));
 const html=C.sheetHtml(oven,{imageData:{'assets/cat-ia/fixtures/horno-h60.png':'data:image/png;base64,iVBORw0KGgo='}});
 assert.match(html,/Content-Security-Policy" content="default-src 'none'/);assert.doesNotMatch(html,/<script/i);assert.match(html,/Estudio &lt;Norte&gt;/);assert.match(html,/<img src="data:image\/png/);
 assert.ok(html.includes(oven.product.description),'full description present');assert.ok(html.includes(oven.hash));
 const evil=clone(PILOT.products[4]);evil.displayName='<img src=x onerror=alert(1)>';const ce=C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'estudio-norte'}),[evil],{today:TODAY}).catalog;
 const eh=C.sheetHtml(C.sheet(ce,'lampara-orbe','ambar'),{imageData:{'assets/cat-ia/fixtures/lampara-orbe.png':'javascript:alert(1)'}});assert.doesNotMatch(eh,/<img src=x/);assert.doesNotMatch(eh,/javascript:/);
 assert.ok(Object.isFrozen(oven)&&Object.isFrozen(oven.rows));const{hash,...body}=oven;assert.equal(C.hashOf(body),hash);
});

test('local pilot storage: scoped by studio, damaged or tampered data is dropped, no cross-studio read',()=>{
 const s=store(),c=pilot().catalog;C.saveCatalog(s,c);
 assert.equal(C.getCatalog(s,'estudio-norte','piloto-sintetico-qa').revisionHash,c.revisionHash);
 assert.equal(C.getCatalog(s,'estudio-sur','piloto-sintetico-qa'),null,'another studio does not see it');
 assert.deepEqual([...s.map.keys()],[C.STORAGE_PREFIX+'estudio-norte']);
 // A record copied under another studio's key is ignored (studioId mismatch).
 s.setItem(C.STORAGE_PREFIX+'estudio-sur',s.getItem(C.STORAGE_PREFIX+'estudio-norte'));assert.deepEqual(C.loadCatalogs(s,'estudio-sur'),[]);
 // Tampering with a stored price breaks the revision hash: the catalogue is not loaded.
 const raw=JSON.parse(s.getItem(C.STORAGE_PREFIX+'estudio-norte'));raw.catalogs[0].products[0].commercial.netUnitPrice=1;s.setItem(C.STORAGE_PREFIX+'estudio-norte',JSON.stringify(raw));
 assert.deepEqual(C.loadCatalogs(s,'estudio-norte'),[]);
 s.setItem(C.STORAGE_PREFIX+'estudio-norte','{no json');assert.deepEqual(C.loadCatalogs(s,'estudio-norte'),[]);
 assert.throws(()=>C.loadCatalogs(s,'../x'),/studioId/);
});

test('CatalogCapabilitiesForAssistantV1: versioned, read-only, copies, no write method',()=>{
 let c=pilot().catalog;const cap=C.assistantCapabilities(()=>[c]);
 assert.equal(cap.version,'CatalogCapabilitiesForAssistantV1');assert.equal(cap.readOnly,true);assert.ok(Object.isFrozen(cap));
 assert.deepEqual(Object.keys(cap).sort(),['limits','listCatalogs','readOnly','search','sheet','version']);
 assert.equal(cap.listCatalogs()[0].products,5);assert.equal(cap.search('piloto-sintetico-qa',{price:'unknown'})[0].sku,'QA-H60-INOX');
 const found=cap.search('piloto-sintetico-qa',{q:'orbe'});found[0].displayName='x';assert.notEqual(c.products.find(p=>p.productId==='lampara-orbe').displayName,'x');
 assert.equal(cap.sheet('piloto-sintetico-qa','horno-h60','inox',{lang:'en'}).rows.find(r=>r[0]==='price')[2],'Unknown');
 assert.deepEqual(cap.search('no-existe',{}),[]);assert.equal(cap.sheet('no-existe','a'),null);
});
