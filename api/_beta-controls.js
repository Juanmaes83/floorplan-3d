'use strict';
const {createHash,timingSafeEqual}=require('node:crypto');

function settings(env){
 if(env.VERCEL_ENV!=='preview'||env.RUBIK_BETA_AI_ENABLED!=='1')return null;
 const cap=Number(env.RUBIK_BETA_SPEND_CAP_USD);
 const perUserImages=Number(env.RUBIK_BETA_IMAGES_PER_TESTER);
 const perUserTurns=Number(env.RUBIK_BETA_TURNS_PER_TESTER_PER_MINUTE);
 if(!Number.isFinite(cap)||cap<=0||!Number.isSafeInteger(perUserImages)||perUserImages<1||
    !Number.isSafeInteger(perUserTurns)||perUserTurns<1||perUserTurns>60)return null;
 if(!/^[a-z0-9][a-z0-9-]{2,47}$/.test(env.RUBIK_BETA_LEDGER_NAMESPACE||''))return null;
 let roster;
 try{roster=JSON.parse(env.RUBIK_BETA_TESTERS||'null');}catch{return null;}
 if(!roster||Array.isArray(roster)||typeof roster!=='object')return null;
 const testers=Object.entries(roster);
 if(!testers.length||testers.length>100||testers.some(([id,digest])=>!(/^[a-z0-9][a-z0-9-]{0,31}$/).test(id)||!(/^[0-9a-f]{64}$/).test(digest))||
    new Set(testers.map(([,digest])=>digest)).size!==testers.length)return null;
 return {cap,perUserImages,perUserTurns,testers};
}
function identity(beta,code){
 if(typeof code!=='string'||code.length<32||code.length>200)return null;
 const digest=createHash('sha256').update(code).digest();
 let match=null;
 for(const [id,expected]of beta.testers){
  if(timingSafeEqual(digest,Buffer.from(expected,'hex')))match=id;
 }
 return match;
}
const SWITCH='private-beta:disabled';
async function enabled(store){return !!store&&!(await store.get(SWITCH));}
module.exports={settings,identity,enabled,SWITCH};
