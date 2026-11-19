'use strict';
/* K9 · Registro ÚNICO de capacidades (js/capability-registry.js). Prueba pura de coherencia:
   · cada estado que ven la Home y el Asistente se deriva del nivel y su evidencia; nada se anuncia sin ella;
   · no hay declaraciones duplicadas ni contradictorias (Render IA es una sola capacidad; el Asistente no decide estados);
   · los desarrollos pendientes (K4, cadena F0) están registrados y nunca se anuncian;
   · cada entrada es compatible con su fila de docs/product/MATRIZ-TRAZABILIDAD-v1.12.md, y los bloqueos de los servicios
     IA se conservan. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const R=require('../js/capability-registry.js'),RT=require('../js/assistant-runtime-core.js'),root=path.resolve(__dirname,'..');

const MATRIX=(()=>{const rows={};for(const l of fs.readFileSync(path.join(root,'docs/product/MATRIZ-TRAZABILIDAD-v1.12.md'),'utf8').split('\n')){
  const c=l.split('|').map(x=>x.trim());if(c.length>5&&/^[A-Z0-9]+-[0-9A-Za-z]+$/.test(c[1])&&/^`[A-Z]{2}`$/.test(c[4]))rows[c[1]]=c[4].slice(1,3);}return rows;})();
// Qué códigos de la matriz son compatibles con cada nivel del registro (la matriz manda en lo documental; el registro no
// puede anunciar más que ella).
const COMPATIBLE={production:['RV','RL'],validated:['RV','RL','PV'],integrated:['RV','RL','PV','PA'],pilot:['EX','RL','PA'],simulation:['SI'],
  developed:['PI','IR','ND','PA','EX'],planned:['ND','IR','PA','DX','SI','DE']};

test('el estado de cada consumidor se DERIVA del nivel: ninguna entrada puede contradecirlo',()=>{
  assert.deepEqual([...R.LEVELS],['planned','developed','integrated','validated','pilot','simulation','production']);
  for(const c of R.CAPABILITIES)assert.equal(c.state,R.homeState(c.level),c.id);
  for(const s of R.AI_SERVICES)assert.equal(s.state,R.aiState(s.level),s.id);
  for(const p of R.PENDING)assert.equal(p.level,'developed',p.id);
  assert.equal(R.all().length,new Set(R.all().map(e=>e.id)).size,'un identificador, una entrada');
  // «Disponible» solo con nivel production; un piloto, una simulación o algo planificado nunca lo son.
  for(const e of R.all())assert.equal(e.state==='available',e.level==='production',e.id);
});

test('nada se anuncia sin evidencia: assertEntry rechaza cada forma de anunciar de más',()=>{
  const ok={id:'x',level:'pilot',modules:['js/a.js'],tests:['tests/a.test.cjs'],limits:['l','l','l'],production:null};
  assert.doesNotThrow(()=>R.assertEntry(ok));
  const bad=[[{...ok,level:'production'},/sin evidencia de Production/],
    [{...ok,level:'production',production:{deployment:'dpl_x',sha:'0'.repeat(40),checkedAt:'2026-11-19',check:'comprobación real'},id:'photo-reform'},/lo bloquean GOV-05/],
    [{...ok,production:{deployment:'dpl_x'}},/sin estar en Production/],
    [{...ok,level:'developed'},/exige la PR y el SHA/],
    [{...ok,level:'pilot',limits:null},/declarar sus límites/],
    [{...ok,level:'simulation',limits:null},/declarar sus límites/],
    [{...ok,level:'integrated',tests:[]},/sin módulos o pruebas/],
    [{...ok,level:'validated'},/exige la validación con su SHA/],
    [{...ok,level:'available'},/nivel desconocido/]];
  for(const [e,re] of bad)assert.throws(()=>R.assertEntry(e),re,JSON.stringify(e).slice(0,80));
  for(const e of R.all())assert.doesNotThrow(()=>R.assertEntry(e),e.id);
});

test('Production: solo con despliegue, SHA y comprobación; y sus módulos y pruebas estaban en ese árbol',t=>{
  const prod=R.all().filter(e=>e.level==='production');
  assert.deepEqual(R.AI_SERVICES.filter(s=>s.level==='production').map(s=>s.id),['render-ai'],'el único servicio IA activo sigue siendo Render IA');
  for(const e of prod){assert.equal(e.production.deployment,R.DEPLOYMENT.deployment,e.id);assert.equal(e.production.sha,R.DEPLOYMENT.sha,e.id);}
  let have=true;try{execFileSync('git',['cat-file','-e',R.DEPLOYMENT.sha+'^{commit}'],{cwd:root,stdio:'ignore'});}catch{have=false;}
  if(!have)return t.skip('el clon no contiene '+R.DEPLOYMENT.sha.slice(0,8)+' (clon superficial): no se puede comprobar el árbol desplegado');
  for(const e of prod)for(const f of [...e.modules,...e.tests]){
    let present=true;try{execFileSync('git',['cat-file','-e',`${R.DEPLOYMENT.sha}:${f}`],{cwd:root,stdio:'ignore'});}catch{present=false;}
    assert.ok(present,`${e.id}: ${f} no estaba en el árbol de Production ${R.DEPLOYMENT.sha.slice(0,8)}`);}
});

test('sin duplicados: Render IA es UNA capacidad compartida por la Home y por «Nuevos servicios IA»',()=>{
  const card=R.byId('render-ai'),svc=R.AI_SERVICES.find(s=>s.id==='render-ai');
  assert.equal(svc.level,card.level);assert.equal(svc.production,card.production,'la misma evidencia, no una copia');
  for(const f of card.modules)assert.ok(svc.modules.includes(f),f);for(const f of card.tests)assert.ok(svc.tests.includes(f),f);
  const src=fs.readFileSync(path.join(root,'js/capability-registry.js'),'utf8');
  assert.equal((src.match(/dpl_GHMoRKmGrvnST5NmCoALfRuYsvFs/g)||[]).length,1,'el despliegue se declara una sola vez');
});

test('el Asistente no decide estados: los lee del registro (y del del producto si no se le pasa ninguno)',()=>{
  const op=(caps,id)=>caps.operations.find(o=>o.id===id);
  // Por defecto: el registro del producto (catálogos en piloto → lectura disponible si el módulo está cargado).
  assert.equal(op(RT.capabilities({modules:{catalog:true}}),'catalog_products').state,'available');
  // Si el registro baja «Mis catálogos» a planificado, el Asistente lo bloquea aunque el módulo esté en la página.
  const fake=lv=>({byId:id=>R.byId(id),levelOf:id=>lv[id]??R.levelOf(id)});
  const down=RT.capabilities({registry:fake({catalogs:'planned'}),modules:{catalog:true}});
  for(const id of ['catalog_products','list_catalog_products','get_placed_products','get_visual_references'])assert.equal(op(down,id).state,'blocked',id);
  // FOT-01 solo sería «available» si el registro lo acreditara en Production; hoy es una simulación.
  assert.equal(op(RT.capabilities({modules:{photoReform:true}}),'photo_reform').state,'blocked');
  assert.equal(op(RT.capabilities({registry:fake({'photo-reform':'production'}),modules:{photoReform:true}}),'photo_reform').state,'available');
  // Ningún archivo del producto, salvo el registro, declara niveles de capacidad por su cuenta.
  for(const f of fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')&&f!=='capability-registry.js'))
    assert.doesNotMatch(fs.readFileSync(path.join(root,'js',f),'utf8'),/level:'(planned|developed|integrated|validated|pilot|simulation|production)'/,f);
});

test('desarrollos pendientes (K4, F0): registrados con PR y SHA y NUNCA anunciados',()=>{
  assert.deepEqual(R.PENDING.map(p=>[p.id,p.pr]),[['room-type',280],['persistence-v2',279]]);
  const shown=new Set([...['general','architecture','real-estate','developer','renovation','interior','construction'].flatMap(a=>R.forAudience(a).map(c=>c.id)),...R.aiServices('general').map(s=>s.id)]);
  for(const p of R.PENDING){assert.ok(!shown.has(p.id),p.id+' no aparece en la Home ni en los servicios IA');assert.match(p.headSha,/^[0-9a-f]{40}$/);
    assert.equal(R.levelOf(p.id),'developed');
    // Cuando su corte se integre, sus pruebas estarán en el árbol: entonces esta entrada DEBE subir de nivel con evidencia.
    const integrated=p.tests.every(f=>fs.existsSync(path.join(root,f)));
    assert.equal(integrated,false,`${p.id}: sus pruebas ya están en master; súbela de nivel (integrated/validated/production) con su evidencia`);}
});

test('matriz v1.12: cada entrada es compatible con su fila y los bloqueos de los servicios IA se conservan',()=>{
  assert.ok(Object.keys(MATRIX).length>=98,'la matriz se lee entera');
  for(const e of R.all())for(const id of e.matrix){
    assert.ok(MATRIX[id],`${e.id}: ${id} existe en la matriz`);
    assert.ok(COMPATIBLE[e.level].includes(MATRIX[id]),`${e.id} (${e.level}) contradice ${id} = ${MATRIX[id]}`);}
  for(const [id,blocks] of Object.entries(R.BLOCKED_BY)){for(const b of blocks)assert.ok(MATRIX[b],`${id}: bloqueo ${b} existe en la matriz`);
    assert.notEqual(R.levelOf(id),'production',id+' sigue bloqueado');}
  // Lo que la matriz da por simulado no se anuncia como real; lo que no está desarrollado no se anuncia en absoluto.
  for(const e of R.all())for(const id of e.matrix){if(MATRIX[id]==='SI')assert.ok(['simulation','planned'].includes(e.level),e.id);
    if(['ND','IR'].includes(MATRIX[id]))assert.ok(['planned','developed'].includes(e.level),e.id);}
  assert.equal(MATRIX['GOV-03'],'PA','K9 no se acredita en la matriz hasta integrarse');
});
