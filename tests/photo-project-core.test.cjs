'use strict';
/* De fotografía a proyecto V1 · núcleos puros de MUE-01 (js/own-furniture-core.js) y FOT-01 (js/photo-reform-core.js). */
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../js/own-furniture-core.js'),F=require('../js/photo-reform-core.js');
const Core=require('../js/project-core.js');
const JPEG=[0xff,0xd8,0xff,0xe0,0,16,74,70,73,70,0,1],PNG=[0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a,0,0,0,13],WEBP=[...Buffer.from('RIFF'),0,0,0,0,...Buffer.from('WEBP')];
const sha='a'.repeat(64),photo=(o={})=>({imageKey:'mue01/'+sha,sha256:sha,mediaType:'image/jpeg',widthPx:1200,heightPx:900,bytes:30000,addedAt:'2026-11-14T10:00:00.000Z',...o});
const project=()=>{const p=Core.initial();p.objects.push({id:'obj_own-sofa-1',type:'sofa',name:'Sofá propio',position:{x:5000,y:5000},rotationDeg:0,size:{widthMm:2140,depthMm:920,heightMm:830}});return p;};

test('MUE-01 · medidas: obligatorias, enteras en mm, dentro de rango; categoría de la lista; rotación 0–359', () => {
  const ok=M.validateSpec({name:' Sofá de la abuela ',type:'sofa',widthMm:'2140',depthMm:920,heightMm:'830',rotationDeg:'90'});
  assert.deepEqual(ok,{ok:true,spec:{type:'sofa',name:'Sofá de la abuela',w:2140,d:920,h:830,rot:90}});
  const bad=M.validateSpec({name:'',type:'wardrobe',widthMm:'',depthMm:'92.5',heightMm:'99999',rotationDeg:'400'});
  assert.equal(bad.ok,false);assert.deepEqual(Object.keys(bad.errors).sort(),['depthMm','heightMm','name','rotationDeg','type','widthMm']);
  assert.match(bad.errors.depthMm,/enteros/);assert.match(bad.errors.heightMm,/entre 50 y 3000/);assert.match(bad.errors.type,/categoría/);
  assert.equal(M.validateSpec({name:'x',type:'sofa',widthMm:'abc',depthMm:500,heightMm:500}).errors.widthMm,'Anchura: escribe un número en milímetros.');
  assert.ok(!M.CATEGORIES.some(c=>c.type==='wardrobe'),'el armario paramétrico es de R03');
});

test('MUE-01 · foto: formato real por los bytes, tamaño máximo, archivo vacío; copia sin ampliar', () => {
  assert.equal(M.sniff(JPEG),'image/jpeg');assert.equal(M.sniff(PNG),'image/png');assert.equal(M.sniff(WEBP),'image/webp');
  assert.equal(M.sniff([...Buffer.from('GIF89a')]),null);assert.equal(M.sniff([...Buffer.from('<svg')]),null);
  assert.equal(M.checkPhoto({size:1000,head:new Uint8Array(JPEG)}).mediaType,'image/jpeg');
  assert.equal(M.checkPhoto({size:13*1024*1024,head:new Uint8Array(JPEG)}).reason,'too-large');
  assert.equal(M.checkPhoto({size:0,head:new Uint8Array()}).reason,'empty');
  assert.equal(M.checkPhoto({size:500,head:new Uint8Array([...Buffer.from('%PDF-1.7')])}).reason,'format');
  assert.deepEqual(M.fitSize(4000,3000),{w:1600,h:1200});assert.deepEqual(M.fitSize(800,600),{w:800,h:600});assert.equal(M.fitSize(0,10),null);
});

test('MUE-01 · extensión: el volumen va en el objeto canónico y la foto solo como referencia estricta en x-; el proyecto sigue siendo válido', () => {
  const p=project();
  M.attach(p,'obj_own-sofa-1',photo());Core.validate(p);
  assert.deepEqual(p.extensions['x-mue01-furniture-photo'],{version:1,items:[{objectId:'obj_own-sofa-1',photo:photo()}]});
  assert.deepEqual(p.objects.find(o=>o.id==='obj_own-sofa-1'),{id:'obj_own-sofa-1',type:'sofa',name:'Sofá propio',position:{x:5000,y:5000},rotationDeg:0,size:{widthMm:2140,depthMm:920,heightMm:830}},'el objeto canónico no lleva la foto');
  assert.ok(!JSON.stringify(p).includes('IMG_'),'nunca el nombre del archivo');
  // Sin foto conservada: sigue siendo «mi mueble», con aviso.
  M.attach(p,'obj_own-sofa-1',null);assert.equal(M.photoStatus(p,'obj_own-sofa-1',false).state,'not-stored');
  M.attach(p,'obj_own-sofa-1',photo());
  assert.equal(M.photoStatus(p,'obj_own-sofa-1',true).state,'ok');
  assert.equal(M.photoStatus(p,'obj_own-sofa-1',false).state,'missing','foto ausente en este navegador: aviso, el volumen sigue');
  assert.equal(M.photoStatus(p,'obj_otro',true).state,'none');
  // Borrar el mueble: la referencia huérfana se retira en la siguiente escritura; sin entradas, la extensión desaparece.
  p.objects=p.objects.filter(o=>o.id!=='obj_own-sofa-1');M.prune(p);assert.equal(p.extensions,undefined);Core.validate(p);
});

test('MUE-01 · datos dañados o de una versión futura: solo lectura, nunca se reescriben ni rompen el mueble', () => {
  for(const raw of [{version:2,items:[]},{version:1,items:'x'},{version:1,items:[{objectId:'obj_own-sofa-1',photo:photo({mediaType:'image/png'})}]},
    {version:1,items:[{objectId:'obj_own-sofa-1',photo:photo({imageKey:'otra/'+sha})}]},{version:1,items:[{objectId:'obj_own-sofa-1',photo:{...photo(),fileName:'IMG_1.jpg'}}]},'texto',null]){
    const p=project();p.extensions={'x-mue01-furniture-photo':raw};const before=JSON.stringify(p);
    const st=M.photoStatus(p,'obj_own-sofa-1',true);assert.equal(st.state,'unsupported',JSON.stringify(raw));
    assert.throws(()=>M.attach(p,'obj_own-sofa-1',photo()),/otra versión o está dañada/);M.prune(p);assert.equal(JSON.stringify(p),before,'intacto');
  }
  assert.throws(()=>M.attach(project(),'obj_inexistente',photo()),/no existe/);
  assert.throws(()=>M.attach(project(),'obj_own-sofa-1',photo({bytes:0})),/no válidos/);
});

test('FOT-01 · archivo y dimensiones: formato real, tamaño, foto dañada, demasiado pequeña o grande', () => {
  assert.equal(F.checkFile({size:1000,head:new Uint8Array(PNG)}).mediaType,'image/png');
  assert.equal(F.checkFile({size:11*1024*1024,head:new Uint8Array(JPEG)}).reason,'too-large');
  assert.equal(F.checkFile({size:900,head:new Uint8Array([...Buffer.from('GIF89a')])}).reason,'format');
  assert.equal(F.checkDimensions(undefined,undefined).reason,'corrupt');assert.equal(F.checkDimensions(300,200).reason,'too-small');
  assert.equal(F.checkDimensions(9000,4000).reason,'too-big');assert.deepEqual(F.checkDimensions(3200,2400).work,{w:1600,h:1200});
});

test('FOT-01 · solicitud: solo la imagen recomprimida y claves cerradas; nunca el proyecto, el nombre del archivo, los metadatos ni texto libre', () => {
  const img={mediaType:'image/jpeg',width:1200,height:900,bytes:120000};
  const r=F.request({image:img,intent:'floor',finish:'walnut',alternatives:'3'});
  assert.equal(r.ok,true);assert.deepEqual(r.request,{version:1,image:{...img,metadata:'eliminados'},intent:'floor',finish:'walnut',alternatives:3});
  assert.ok(!('project' in r.request)&&!('fileName' in r.request.image)&&!('text' in r.request));
  assert.ok(r.summary.never.some(t=>/proyecto/.test(t))&&r.summary.never.some(t=>/nombre del archivo/.test(t))&&r.summary.never.some(t=>/EXIF/.test(t)));
  assert.equal(F.request({image:img,intent:'floor',finish:'mármol de carrara',alternatives:1}).ok,false,'solo acabados de la lista');
  assert.equal(F.request({image:img,intent:'derribar tabique',alternatives:1}).ok,false,'solo intenciones de la lista');
  assert.equal(F.request({image:img,intent:'light',alternatives:4}).ok,false);assert.equal(F.request({image:null,intent:'light',alternatives:1}).ok,false);
});

test('FOT-01 · puerta: el proveedor real está bloqueado en este despliegue; la simulación exige consentimiento', () => {
  const real=F.gate({mode:'real',consent:true,provider:{configured:false,authorized:false},governance:{gov05:false,img04:false}});
  assert.equal(real.allowed,false);assert.equal(real.reasons.length,4);assert.ok(real.reasons.some(r=>/GOV-05/.test(r))&&real.reasons.some(r=>/IMG-04/.test(r)));
  assert.equal(F.gate({mode:'real',consent:true,provider:{configured:true,authorized:false},governance:{gov05:true,img04:true}}).allowed,false,'sin autorización del propietario, no');
  assert.deepEqual(F.gate({mode:'simulated',consent:false}).reasons,['Falta tu consentimiento para procesar esta foto.']);
  assert.equal(F.gate({mode:'simulated',consent:true}).allowed,true);
});

test('FOT-01 · alternativas: inicio, avance, error, cancelación; cada resultado simulado se rotula y no tiene coste inventado', () => {
  let s=F.start(F.run(3));assert.equal(s.status,'running');assert.deepEqual(s.items.map(i=>i.status),['running','pending','pending']);
  s=F.itemDone(s,0,{kind:'simulated'});assert.equal(s.items[0].result.badge,'SIMULACIÓN · no generada por IA');assert.equal(s.items[0].result.cost,null);assert.equal(s.items[0].result.downloadable,false);
  const c=F.cancel(s);assert.equal(c.status,'cancelled');assert.deepEqual(c.items.map(i=>i.status),['done','cancelled','cancelled']);
  const e=F.itemError(s,1,'El proveedor (simulado) ha devuelto un error');assert.equal(e.status,'error');assert.deepEqual(e.items.map(i=>i.status),['done','error','skipped']);
  s=F.itemDone(F.itemDone(s,1,{}),2,{});assert.equal(s.status,'done');
  assert.equal(F.label({kind:'generated'}).costText,'Coste: desconocido (el proveedor no lo ha informado).','sin cifra si el proveedor no la da');
  assert.equal(F.label({kind:'generated',cost:0.04}).cost,0.04);assert.match(F.label({kind:'generated'}).badge,/ilustrativa, no medible/);
});
