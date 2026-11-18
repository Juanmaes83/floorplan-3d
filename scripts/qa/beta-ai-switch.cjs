'use strict';
const Ledger=require('../../api/_spend-ledger.js'),Beta=require('../../api/_beta-controls.js');
async function main(env,args){
 const [action]=args;
 if(args.length!==1||!['off','on','status'].includes(action))throw Error('Uso: node scripts/qa/beta-ai-switch.cjs off|on|status');
 if(!/^[a-z0-9][a-z0-9-]{2,47}$/.test(env.RUBIK_BETA_LEDGER_NAMESPACE||''))throw Error('Falta el namespace de la beta privada');
 const store=Ledger.storeFromEnv(env);
 if(!store)throw Error('Falta la configuración del almacén de beta');
 if(action==='off')await store.set(Beta.SWITCH,true);
 if(action==='on')await store.remove(Beta.SWITCH);
 console.log(await Beta.enabled(store)?'Interruptor del almacén: abierto':'Interruptor del almacén: cerrado');
}
main(process.env,process.argv.slice(2)).catch(error=>{
 console.error(error.code==='store_error'?'Almacén no disponible':error.message);
 process.exitCode=1;
});
