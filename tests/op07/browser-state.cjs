'use strict';
// OP-07 S8 · Estado de activación explícito para las pruebas de navegador (solo un origen de pruebas lo admite).
// withState(env,'active') inyecta RUBIK_OP07_STATE antes de cargar la página. Con A0 integrado (js/schema-epoch.js en
// index.html), las pruebas corren con el A0 REAL: el sustituto etiquetado (`a0:'stand-in'`) solo actúa si A0 no se carga
// y el script real lo reemplaza. `a0:'none'` retira A0 de verdad (la petición de schema-epoch.js se sirve vacía) para el
// control que falla cerrado sin la barrera de escritores.
function withState(env,state,{a0='stand-in'}={}){const b=env.browser;
 const browser=new Proxy(b,{get:(t,k)=>k==='newContext'?async(...a)=>{const c=await t.newContext(...a);
  await c.addInitScript(([s,stand])=>{globalThis.RUBIK_OP07_STATE=s;if(stand&&!globalThis.FloorPlanSchemaEpoch)globalThis.FloorPlanSchemaEpoch=Object.freeze({op07StandIn:true});},[state,a0==='stand-in']);
  if(a0==='none')await c.route(/\/js\/schema-epoch\.js(\?|$)/,r=>r.fulfill({status:200,contentType:'application/javascript',body:'/* control de prueba: A0 retirado */'}));return c;}
  :(typeof t[k]==='function'?t[k].bind(t):t[k])});
 return {...env,browser};}
module.exports={withState};
