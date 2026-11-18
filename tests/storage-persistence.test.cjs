'use strict';
/* F0.3 · storage-persistence (SCULPT de openPlan3D@771c9e1). Casos portados de tests/storage-persistence.test.ts del
   donante (los propios del módulo); los que prueban su canal de guardado (guardado fallido, copia, restauración, guía)
   se convertirán en pruebas de conexión cuando F0.2b llame al módulo tras un commit() confirmado. */
const test=require('node:test'),assert=require('node:assert/strict');
const SP=require('../js/storage-persistence.js');
const mem=()=>{const m=new Map();return {m,getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v))};};
const spy=impl=>{const f=async(...a)=>{f.calls++;return impl(...a);};f.calls=0;return f;};
const env=(storage,{active=true,ls=mem()}={})=>({navigator:{storage,userActivation:{hasBeenActive:active}},localStorage:ls});
test('pide una vez tras la primera acción, lo recuerda en esta página y en las siguientes cargas',async()=>{
  const persisted=spy(async()=>false),persist=spy(async()=>true),ls=mem();
  const a=SP.create(env({persisted,persist},{ls}));assert.equal(await a.requestPersistentStorage(),true);assert.equal(a.state,true);
  assert.equal(persist.calls,1);assert.equal(ls.m.get(SP.PERSIST_REQUESTED_KEY),'true');
  assert.equal(await a.requestPersistentStorage(),undefined);assert.equal(persist.calls,1);
  const b=SP.create(env({persisted,persist},{ls}));assert.equal(await b.requestPersistentStorage(),undefined,'otra carga de página');
  assert.equal(persist.calls,1);assert.equal(persisted.calls,1);});
test('acepta una negativa sin volver a preguntar',async()=>{const persist=spy(async()=>false),ls=mem();
  const a=SP.create(env({persisted:async()=>false,persist},{ls}));assert.equal(await a.requestPersistentStorage(),false);assert.equal(a.state,false);
  await a.requestPersistentStorage();await SP.create(env({persisted:async()=>false,persist},{ls})).requestPersistentStorage();assert.equal(persist.calls,1);});
test('no pregunta si ya es persistente',async()=>{const persist=spy(async()=>true),ls=mem();const a=SP.create(env({persisted:async()=>true,persist},{ls}));
  assert.equal(await a.requestPersistentStorage(),true);assert.equal(persist.calls,0);assert.equal(ls.m.has(SP.PERSIST_REQUESTED_KEY),false);});
test('una petición rechazada cuenta como preguntada y nunca rechaza',async()=>{const persist=spy(async()=>{throw new Error('denied');});
  const a=SP.create(env({persisted:async()=>false,persist}));assert.equal(await a.requestPersistentStorage(),null);assert.equal(await a.requestPersistentStorage(),undefined);assert.equal(persist.calls,1);});
test('espera a una acción de la persona: un guardado durante la carga no pregunta',async()=>{const persist=spy(async()=>true);
  const a=SP.create(env({persisted:async()=>false,persist},{active:false}));assert.equal(await a.requestPersistentStorage(),undefined);assert.equal(persist.calls,0);});
test('varias acciones a la vez: pregunta una sola vez',async()=>{const persist=spy(async()=>true);const a=SP.create(env({persisted:async()=>false,persist}));
  await Promise.all([a.requestPersistentStorage(),a.requestPersistentStorage(),a.requestPersistentStorage()]);assert.equal(persist.calls,1);});
test('sin API de persistencia: null, sin preguntar',async()=>{const a=SP.create(env({}));assert.equal(await a.requestPersistentStorage(),null);});
test('si localStorage no puede recordar, pregunta como mucho una vez por página',async()=>{const persist=spy(async()=>true);
  const ls={getItem(){throw new Error('SecurityError');},setItem(){throw new Error('QuotaExceededError');}};
  const a=SP.create(env({persisted:async()=>false,persist},{ls}));assert.equal(await a.requestPersistentStorage(),true);assert.equal(await a.requestPersistentStorage(),undefined);assert.equal(persist.calls,1);});
test('aviso de copia: se muestra si no es persistente o no se sabe, con proyectos a la vista y sin descartar',()=>{
  const a=SP.create(env({}));for(const [p,d,act,shown] of [[false,false,true,true],[null,false,true,true],[true,false,true,false],[undefined,false,true,false],[false,true,true,false],[null,false,false,false]])
   assert.equal(a.showStorageNote(p,d,act),shown,JSON.stringify([p,d,act]));});
test('comprueba sin preguntar: concedido, sin garantía, sin API, error',async()=>{
  for(const [st,exp] of [[{persisted:async()=>true},true],[{persisted:async()=>false},false],[{},null],[{persisted:async()=>{throw new Error('insecure');}},null]]){
   const persist=spy(async()=>true);const a=SP.create(env({...st,persist}));assert.equal(await a.checkStoragePersistence(),exp);assert.equal(a.state,exp);assert.equal(persist.calls,0);}});
test('una concesión hecha durante una comprobación anterior no se deshace',async()=>{let answer;let first=true;
  const persisted=()=>first?(first=false,new Promise(r=>{answer=r;})):Promise.resolve(false);
  const a=SP.create(env({persisted,persist:async()=>true}));const check=a.checkStoragePersistence();assert.equal(await a.requestPersistentStorage(),true);answer(false);await check;assert.equal(a.state,true);});
test('el descarte del aviso se recuerda en el navegador y funciona en memoria si el almacenamiento está bloqueado',()=>{
  const ls=mem();const a=SP.create(env({},{ls}));assert.equal(a.storageNoteDismissed(),false);a.dismissStorageNote();assert.equal(SP.create(env({},{ls})).storageNoteDismissed(),true);
  const blocked={getItem(){throw new Error('x');},setItem(){throw new Error('x');}};const b=SP.create(env({},{ls:blocked}));b.dismissStorageNote();assert.equal(b.storageNoteDismissed(),true);});
test('estimate(): uso y cuota del navegador, o null si no los da',async()=>{
  assert.deepEqual(await SP.create(env({estimate:async()=>({usage:10,quota:100})})).estimate(),{usage:10,quota:100});
  assert.equal(await SP.create(env({})).estimate(),null);assert.equal(await SP.create(env({estimate:async()=>{throw new Error('x');}})).estimate(),null);});
test('los oyentes reciben cada cambio de estado',async()=>{const a=SP.create(env({persisted:async()=>false,persist:async()=>true}));const seen=[];const off=a.subscribe(v=>seen.push(v));
  await a.requestPersistentStorage();off();await a.checkStoragePersistence();assert.deepEqual(seen,[true]);});
