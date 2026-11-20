'use strict';
// OP-07 S8 · Estado de activación explícito para las pruebas de navegador (solo un origen de pruebas lo admite).
// withState(env,'active') inyecta RUBIK_OP07_STATE antes de cargar la página. A0 (FloorPlanSchemaEpoch) TODAVÍA NO está en
// master: para probar el estado activo, la prueba declara un sustituto mínimo y etiquetado (`a0:'stand-in'`). La
// convivencia real con A0 se acredita al integrar A0; sin este sustituto la activación falla cerrada (prueba S8).
function withState(env,state,{a0='stand-in'}={}){const b=env.browser;
 const browser=new Proxy(b,{get:(t,k)=>k==='newContext'?async(...a)=>{const c=await t.newContext(...a);
  await c.addInitScript(([s,stand])=>{globalThis.RUBIK_OP07_STATE=s;if(stand&&!globalThis.FloorPlanSchemaEpoch)globalThis.FloorPlanSchemaEpoch=Object.freeze({op07StandIn:true});},[state,a0==='stand-in']);return c;}
  :(typeof t[k]==='function'?t[k].bind(t):t[k])});
 return {...env,browser};}
module.exports={withState};
