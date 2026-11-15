// CAT-04 · Gate 3 (pure): an Image-studio result sheet linked to the project as a VISUAL reference — metadata and
// hashes only, re-verified on read, never an amount, never a certified SKU, a simulation is never deliverable.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const VR=require('../js/visual-reference-core.js'),V=require('../js/visual-reform-core.js'),C=require('../js/catalog-product-core.js'),P=require('../js/catalog-placement-core.js'),Core=require('../js/project-core.js');
const CB=require('../js/catalog-budget-core.js'),D=require('../js/budget-draft-core.js'),B=require('../js/budget-core.js');
const SHA='a'.repeat(64),SHA2='b'.repeat(64);
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const cat=()=>C.importCollection(C.createCatalog({catalogId:'piloto-sintetico-qa',studioId:'local'}),PILOT,{today:'2026-11-14'}).catalog;
const req={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:SHA}]};
const ref={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:SHA,license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
const ok=V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}});
const bad=V.review({ratios:{inside:.4,outside:.2},intensity:'faithful',human:{openingsIntact:false,geometryIntact:true}});
const sheet=(o={})=>V.resultSheet({source:{kind:'photo',sha256:SHA2,width:1200,height:900},request:req,references:[ref],result:{kind:'simulated'},review:ok,decision:'accepted',at:'2026-11-15T09:00:00Z',...o});
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique',demolition:'Demolición',door:'Puerta',slidingDoor:'Corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'P',walls:'W',partitions:'T',carpentry:'C'}};

test('link: verified sheet stored as metadata + hash in project.extensions, idempotent; read back as a SIMULATION, not deliverable, no amount, SKU not certified',()=>{
 const p=Core.initial(),s=sheet();VR.link(p,s,{at:'2026-11-15T09:05:00Z'});VR.link(p,s,{at:'2026-11-15T09:06:00Z'});
 assert.deepEqual(Object.keys(p.extensions[VR.EXT].refs),[s.hash]);assert.equal(p.extensions[VR.EXT].refs[s.hash].projectId,p.id);
 assert.doesNotThrow(()=>Core.validate(p),'the project stays valid (x- extension)');
 const [r]=VR.list(p,{catalogs:[cat()]});assert.equal(r.status,'verified');assert.equal(r.simulated,true);assert.equal(r.deliverable,false);assert.equal(r.monetary,false);assert.equal(r.skuCertified,false);
 assert.equal(r.decision,'accepted');assert.match(r.label,/SIMULACIÓN · no generada por IA/);assert.equal(r.recipe.id,'kitchen-catalog-faithful');
 assert.deepEqual(r.references.map(x=>[x.sku,x.placed,x.catalogStatus]),[['QA-H60-INOX',false,'current']]);
 assert.ok(!JSON.stringify(p.extensions[VR.EXT]).match(/data:|base64|exif/i),'no pixels or EXIF are kept');
});

test('the visual reference never creates a budget item; placing the product is what creates it (two distinct relations)',()=>{
 const c=cat(),p=Core.initial();VR.link(p,sheet());
 const r1=CB.reconcile(p,[c],{studioId:'local'});assert.equal(r1.lines.length,0,'referenced but not placed → not budgeted');
 const b1=D.draft(p,{labels,extraLines:r1.lines}).budget;assert.equal(b1.items.some(i=>CB.isCatalogItem(i.id)),false);
 P.attach(p,'obj_template-023',P.linkOf(c,C.findProduct(c,'horno-h60','inox'),{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
 assert.equal(VR.list(p,{catalogs:[c]})[0].references[0].placed,true);const r2=CB.reconcile(p,[c],{studioId:'local'});assert.equal(r2.lines.length,1);assert.equal(r2.lines[0].key,'cat:local:piloto-sintetico-qa:horno-h60:inox');
});

test('negatives: tampered sheet → unverifiable; rejected simulation shown as rejected; foreign project; sheet with pixels/EXIF refused; older catalogue revision and missing sheet flagged',()=>{
 const p=Core.initial(),s=sheet();VR.link(p,s);
 const t=JSON.parse(JSON.stringify(p));t.extensions[VR.EXT].refs[s.hash].sheet.decision='rejected';assert.equal(VR.list(t)[0].status,'unverifiable');assert.equal(VR.list(t)[0].decision,null,'nothing read from a sheet that does not verify');
 const rej=sheet({review:bad,decision:'rejected'});const p2=Core.initial();VR.link(p2,rej);assert.equal(VR.list(p2)[0].decision,'rejected');assert.equal(VR.list(p2)[0].review.status,'RECHAZADA');
 const moved={...JSON.parse(JSON.stringify(p)),id:'prj_other'};assert.equal(VR.list(moved)[0].status,'other-project');
 const leak=JSON.parse(JSON.stringify(s));leak.source.exif={gps:'40.4,-3.7'};assert.throws(()=>VR.link(Core.initial(),leak),/metadata|binary|hash/);
 const img=JSON.parse(JSON.stringify(s));img.references[0].displayName='data:image/png;base64,AAAA';assert.equal(VR.verify(img).ok,false);
 assert.throws(()=>VR.link(Core.initial(),{schema:'x'}),/not-a-visual-sheet/);
 const c2=C.importCollection(cat(),[{...JSON.parse(JSON.stringify(PILOT.products[2])),description:'cambio'}],{today:'2026-11-15'}).catalog;assert.equal(VR.list(p,{catalogs:[c2]})[0].references[0].catalogStatus,'older-revision');
 assert.equal(VR.list(p,{catalogs:[]})[0].references[0].catalogStatus,'catalog-missing');
 assert.deepEqual(VR.unlink(p,s.hash),{changed:true});assert.deepEqual(VR.list(p),[]);assert.deepEqual(VR.unlink(p,s.hash),{changed:false});
});
