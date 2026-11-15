'use strict';
// CAT-04 · revisión cruzada #237: pruebas adversariales PROPUESTAS por la auditoría (RUBIK_CAT04_CROSS_REVIEW_ADVERSARIAL_TESTS_PROPOSED.cjs),
// incorporadas sin rebajar sus garantías. Complementan tests/cat04-xr.test.cjs (más estricto: XR-02 exige rechazo explícito).
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const CB=require('../js/catalog-budget-core.js');
const P=require('../js/catalog-placement-core.js');
const C=require('../js/catalog-product-core.js');
const D=require('../js/budget-draft-core.js');
const B=require('../js/budget-core.js');
const Core=require('../js/project-core.js');
const VR=require('../js/visual-reference-core.js');
const V=require('../js/visual-reform-core.js');
const PILOT=JSON.parse(fs.readFileSync(path.join(__dirname,'../assets/cat-ia/fixtures/pilot-collection.json'),'utf8'));
const labels={title:'Presupuesto',floor:'Pavimento',skirting:'Rodapié',paint:'Pintura',newWalls:'Tabique nuevo',demolition:'Demolición',door:'Puerta de paso',slidingDoor:'Corredera',window:'Ventana',tariff:'Tarifa',chapters:{floors:'Pavimentos',walls:'Paredes',partitions:'Tabiquería',carpentry:'Carpintería'}};
function reconDraft(project,catalogs,previous=null){
  const rec=CB.reconcile(project,catalogs,{studioId:'local',previous,lang:'es'});
  return D.draft(project,{labels,previous,extraLines:rec.lines,extraChapters:rec.lines.length?[{id:CB.CHAPTER,title:'Productos de mi estudio'}]:[]}).budget;
}

test('CAT04-XR-01: catálogo ausente no convierte una tarifa manual por metro en subtotal por objeto',()=>{
  const product=JSON.parse(JSON.stringify(PILOT.products[4]));
  product.commercial.unit='ml';
  const cat=C.importCollection(C.createCatalog({catalogId:'xr-ml',studioId:'local'}),[{...product,catalogId:'xr-ml'}],{today:'2026-11-14'}).catalog;
  assert.equal(cat.products.length,1,'fixture ml válida');
  const project=Core.initial();
  P.attach(project,'obj_template-029',P.linkOf(cat,cat.products[0],{representation:'generic-volume',fallbackReason:'no-model',asset:null}));
  const id=P.itemIdOf({...cat.products[0],catalogId:cat.catalogId,studioId:'local'});
  let budget=reconDraft(project,[cat]);
  let item=budget.items.find(x=>x.id===id);
  assert.deepEqual([item.quantity.value,item.quantity.unit,item.quantity.status],[null,'m','unavailable'],'con ficha: pendiente de medir');
  budget=B.validateBudget({...budget,items:budget.items.map(x=>x.id===id?
    B.markReviewed(B.setManualPrice(x,{unitPrice:45,label:'QA: precio manual por metro'}),{reviewedAt:'2026-11-15T19:00:00.000Z'}):x)});
  assert.equal(B.calculateBudget(budget).lines.find(x=>x.id===id).subtotalNet,null,'con ficha: sin medición, sin subtotal');
  // Se pierde el catálogo (por error, importación, borrado o datos no disponibles).
  const next=reconDraft(project,[],B.parseBudget(B.serializeBudget(budget)));
  item=next.items.find(x=>x.id===id);
  assert.ok(item,'se conserva la partida y su procedencia histórica');
  assert.equal(item.quantity.unit,'m','no reetiquetar metros a unidades solo porque falte la ficha');
  assert.equal(item.quantity.value,null,'sin fuente no se inventa una medición');
  assert.equal(B.calculateBudget(next).lines.find(x=>x.id===id).subtotalNet,null,'no inventar 1 × 45 euros para un precio por metro');
});

test('CAT04-XR-02: un hash visual idéntico no reatribuye silenciosamente el estudio',()=>{
  const SHA='a'.repeat(64),SOURCE='b'.repeat(64);
  const request={version:1,mode:'catalog',recipeId:'kitchen-catalog-faithful',recipeVersion:'1.0.0',zone:'appliance',intensity:'faithful',alternatives:1,preserve:['furniture-layout'],mask:[[0.55,0.4,0.2,0.3]],references:[{family:'electrodomesticos',kind:'appliance',sha256:SHA}]};
  const product={catalogId:'piloto-sintetico-qa',catalogRevision:1,productId:'horno-h60',variantId:'inox',sku:'QA-H60-INOX',displayName:'Horno integrable H60 inox',family:'electrodomesticos',imageSha256:SHA,license:{scope:['reference-image'],proofRef:'LICENSE.txt'}};
  const review=V.review({ratios:{inside:.4,outside:0},intensity:'faithful',human:{openingsIntact:true,geometryIntact:true}});
  const sheet=V.resultSheet({source:{kind:'photo',sha256:SOURCE,width:1200,height:900},request,references:[product],result:{kind:'simulated'},review,decision:'accepted',at:'2026-11-15T19:00:00.000Z'});
  const project=Core.initial();
  VR.link(project,sheet,{studioId:'local',at:'2026-11-15T19:00:00.000Z'});
  const before=VR.list(project);
  assert.equal(before[0].references[0].studioId,'local');
  try{
    VR.link(project,sheet,{studioId:'brd-estudio-b',at:'2026-11-15T19:05:00.000Z'});
  }catch(error){
    // Rechazar expresamente otro estudio es una resolución válida.
    assert.ok(error.code||error.message);
  }
  const after=VR.list(project);
  assert.ok(after.some(e=>e.references.some(x=>x.studioId==='local')),
    'no sobrescribir el vínculo previo de A: o mantener A y B, o rechazar B');
});
