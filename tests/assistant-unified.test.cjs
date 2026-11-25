// §2.1 Asistente unificado: matriz 6 profesiones × 3 canales, permisos por modo (no por profesión), memoria local consentida.
const test=require('node:test'),assert=require('node:assert/strict');
require('../js/assistant-unified.js');const U=globalThis.RubikAssistantUnified;
require('../labs/asesor-rubik/profiles.js');
const mem=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k),key:i=>[...m.keys()][i],get length(){return m.size;},_m:m};};
test('matriz única: 6 × 3 canales × 2 modos, criterios comunes idénticos y skills comunes + específicas',()=>{
 const M=U.matrix();assert.equal(M.length,36);
 for(const c of M){assert.deepEqual(c.criterios,U.COMMON);for(const s of U.COMMON_SKILLS)assert.ok(c.skills.includes(s));assert.ok(c.skills.length>U.COMMON_SKILLS.length);}
 for(const id of U.ids){const t=U.config(id,'texto','cliente'),v=U.config(id,'voz-simulada','cliente'),a=U.config(id,'avatar-simulado','cliente');
  for(const k of ['saludo','tono','enfoque'])assert.ok(t[k]===v[k]&&v[k]===a[k]);}
 assert.equal(globalThis.AsesorProfiles.get('interior').saludo,U.profile('interior').saludo);});
test('la profesión no concede permisos; modo profesional exige identidad verificada',()=>{
 for(const id of U.ids)assert.deepEqual(U.config(id,'texto','cliente').acciones,U.ACTIONS.cliente);
 for(const a of U.FORBIDDEN_CLIENT){assert.equal(U.allowed('cliente',a),false);assert.equal(U.allowed('profesional',a,{verified:false}),false);assert.equal(U.allowed('profesional',a,{verified:true}),true);assert.ok(U.limitText(a).length>20);}});
test('sin consentimiento no se guarda ni se lee nada; sin owner no hay memoria',()=>{
 const s=mem(),m=U.createMemory({storage:s,owner:'persona-a'});assert.equal(m.set('nota','x').reason,'sin-consentimiento');assert.equal(m.view(),null);assert.equal(s.length,0);
 assert.equal(U.createMemory({storage:s}).available(),false);});
test('consultar, editar y borrar; datos sensibles rechazados (DNI, NIE, IBAN, credenciales, tarjeta)',()=>{
 const s=mem(),m=U.createMemory({storage:s,owner:'persona-a'});m.grant();
 assert.ok(m.set('nombrePreferido','Ana').ok);assert.ok(m.set('proyectos',['p1','p2']).ok);assert.deepEqual(m.view(),{nombrePreferido:'Ana',proyectos:['p1','p2']});
 for(const bad of ['12345678Z','X1234567L','ES91 2100 0418 4502 0005 1332','password: hunter2','4111 1111 1111 1111'])assert.equal(m.set('nota','mi dato '+bad).reason,'dato-sensible');
 m.remove('nombrePreferido');assert.deepEqual(Object.keys(m.view()),['proyectos']);
 assert.ok(!JSON.stringify([...s._m.values()]).match(/12345678Z|ES91|hunter2/));});
test('traspaso entre canales: solo lo autorizado; revocar impide; olvido borra todo, también el contexto de proyecto',()=>{
 const s=mem(),m=U.createMemory({storage:s,owner:'persona-a'});m.grant();m.set('nombrePreferido','Ana');m.set('nota','prefiere tonos cálidos');
 assert.equal(m.handoff({resumen:'r'}).reason,'no-autorizado');
 m.authorizeHandoff(['resumen','nombrePreferido']);const h=m.handoff({resumen:'Revisamos la cocina',projectId:'p1'});
 assert.deepEqual(h.entrega,{campos:['resumen','nombrePreferido'],resumen:'Revisamos la cocina',nombrePreferido:'Ana',projectId:'p1'});assert.ok(!('nota' in h.entrega));
 m.revokeHandoff();assert.equal(m.handoff({resumen:'x'}).reason,'no-autorizado');
 m.project('p1').set('estilo','nórdico');assert.equal(m.project('p1').get().estilo,'nórdico');assert.deepEqual(m.project('p2').get(),{});
 m.forget();assert.equal(s.length,0);assert.equal(m.consent(),false);});
test('separación por titular local (comodidad, no seguridad)',()=>{
 const s=mem(),a=U.createMemory({storage:s,owner:'persona-a'}),b=U.createMemory({storage:s,owner:'persona-b'});a.grant();a.set('nota','solo de A');
 assert.equal(b.view(),null);b.grant();assert.deepEqual(b.view(),{});b.forget();assert.deepEqual(a.view(),{nota:'solo de A'});});
