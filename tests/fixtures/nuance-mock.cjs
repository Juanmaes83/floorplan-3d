// Simulador LOCAL del protocolo Nuance Live (docs.nuancelabs.ai: connect, session-tokens, conversation, events, end,
// abandon, usage, errors, server-events, delegation). Solo para pruebas: no habla con el proveedor.
// WebRTC/LiveKit no se reproduce: el «admitted» entrega livekit_url = mock://… y la sala se imita por HTTP
// (/mock-room/{id}/recv|send) con el MISMO formato de eventos del topic «nuance_live».
'use strict';
const {createServer}=require('node:http');const {randomUUID}=require('node:crypto');
function start({key='nk_test_key',credits=100,concurrency=1,secondsScale=1}={}){
 const S={tokens:new Map(),convs:new Map(),log:[],fail:{},credits,concurrency,calls:[]};
 const cors={'Access-Control-Allow-Origin':'*','Access-Control-Allow-Headers':'Authorization, Content-Type','Access-Control-Allow-Methods':'GET, POST, OPTIONS'};
 const json=(res,st,body,h={})=>{res.writeHead(st,{'Content-Type':'application/json',...cors,...h});res.end(body===undefined?'':JSON.stringify(body));};
 const readBody=req=>new Promise(r=>{let d='';req.on('data',c=>d+=c);req.on('end',()=>{try{r(d?JSON.parse(d):null);}catch{r(undefined);}});});
 const bearer=req=>(req.headers.authorization||'').replace(/^Bearer /,'');
 const push=(c,ev)=>{ev.id=Date.now()*1000+(c.seq++);c.events.push(ev);for(const w of c.waiters.splice(0))w();};
 const roomPush=(c,ev)=>{ev.event_id='evt_'+(c.rseq++);c.toClient.push(ev);for(const w of c.rwaiters.splice(0))w();};
 const active=()=>[...S.convs.values()].filter(c=>!['ended','failed','expired'].includes(c.status)).length;
 function end(c,reason){if(c.status==='ended')return;c.status='ended';clearTimeout(c.timer);roomPush(c,{type:'session.closed',reason:reason==='expired'?'expired':'close_requested'});push(c,{type:'ended',reason});}
 const server=createServer(async(req,res)=>{
  if(req.method==='OPTIONS')return json(res,204);
  const u=new URL(req.url,'http://l'),p=u.pathname;S.calls.push(req.method+' '+p);
  const f=S.fail[p.replace(/[0-9a-f-]{36}/,'{id}')];if(f){if(!f.persist)delete S.fail[p.replace(/[0-9a-f-]{36}/,'{id}')];return json(res,f.status,{detail:'simulado',code:f.code,retry_after_seconds:f.retry},f.retry?{'Retry-After':String(f.retry)}:{});}
  if(p==='/usage'&&req.method==='GET'){if(bearer(req)!==key)return json(res,401,{code:'not_authenticated'});return json(res,200,{limits:{concurrent_sessions:S.concurrency,daily_credits:100,api_keys:1,hourly_conversations:10},credits:{used:100-S.credits,remaining:S.credits,renews_at:'2026-11-26T00:00:00Z'},credit_balance:0,available_credits:S.credits,active_sessions:active()});}
  if(p==='/session-tokens'&&req.method==='POST'){if(bearer(req)!==key)return json(res,401,{code:'not_authenticated'});const b=await readBody(req);
   if(!b?.end_user_id||!/^[A-Za-z0-9_.:\-]{1,128}$/.test(b.end_user_id))return json(res,422,{code:'end_user_id'});
   const tools=b?.interface_setup?.delegation?.responses?.tools||[];if(tools.length>16)return json(res,422,{code:'interface_setup'});
   const t='st_'+randomUUID().replace(/-/g,'');S.tokens.set(t,{spent:false,setup:b,created:Date.now()});S.log.push({mint:b});return json(res,201,{token:t,expires_at:new Date(Date.now()+60000).toISOString(),warnings:[]});}
  if(p==='/conversation'&&req.method==='POST'){const t=S.tokens.get(bearer(req));if(!t||t.spent)return json(res,401,{code:'not_authenticated'});
   if(active()>=S.concurrency)return json(res,409,{code:'concurrency_limit',active:active(),limit:S.concurrency});
   if(S.credits<=0)return json(res,429,{code:'credits_spent',renews_at:'2026-11-26T00:00:00Z'});
   const b=await readBody(req)||{};t.spent=true;const id=randomUUID();
   const c={id,token:bearer(req),setup:t.setup,max:b.max_session_seconds||null,status:'created',events:[],seq:0,waiters:[],toClient:[],rseq:0,rwaiters:[],fromClient:[],pendingCall:null,created:Date.now()};
   S.convs.set(id,c);t.conv=id;S.credits--;
   setTimeout(()=>{if(c.status!=='created')return;push(c,{type:'preparing'});},50);
   setTimeout(()=>{if(c.status!=='created')return;c.status='admitted';push(c,{type:'admitted',livekit_url:'mock://room/'+id,token:'lk_'+id});},150);
   return json(res,201,{id,status:'created',created_at:new Date().toISOString(),updated_at:new Date().toISOString()});}
  let m=p.match(/^\/conversation\/([0-9a-f-]{36})\/(events|end|abandon)$/);
  if(m){const c=S.convs.get(m[1]);if(!c)return json(res,404,{code:'not_found'});
   if(m[2]==='events'){if(bearer(req)!==c.token)return json(res,401,{code:'not_authenticated'});const after=Number(u.searchParams.get('after')||0);
    const pick=()=>c.events.filter(e=>e.id>after);if(!pick().length)await new Promise(r=>{c.waiters.push(r);setTimeout(r,1500);});return json(res,200,{events:pick()});}
   if(req.headers['content-length']!=='0')return json(res,411,{code:'length_required'});
   if(m[2]==='end'){if(bearer(req)!==key)return json(res,403,{code:'api_key_required'});end(c,'ended_by_server');return json(res,200,{id:c.id,status:c.status,created_at:'',started_at:c.started||null});}
   if(m[2]==='abandon'){if(bearer(req)!==key&&bearer(req)!==c.token)return json(res,401,{code:'not_authenticated'});end(c,'abandoned');return json(res,200,{});}}
  // Sala simulada (canal de datos nuance_live).
  m=p.match(/^\/mock-room\/([0-9a-f-]{36})\/(join|recv|send|leave)$/);
  if(m){const c=S.convs.get(m[1]);if(!c)return json(res,404,{});if(bearer(req)!=='lk_'+c.id)return json(res,401,{});
   if(m[2]==='join'){c.status='connected';c.started=new Date().toISOString();push(c,{type:'started',seconds_remaining:c.max});
    if(c.max)c.timer=setTimeout(()=>end(c,'expired'),c.max*1000/secondsScale);
    roomPush(c,{type:'session.started',session:{id:'live_'+c.id,expires_at:Math.floor(Date.now()/1000)+(c.max||600),delegation:c.setup?.interface_setup?.delegation?.type||'client'}});
    roomPush(c,{type:'session.output_transcript.delta',delta:'Hola, soy el asesor de RUBIK, una IA. ',start_ms:0,end_ms:900});
    roomPush(c,{type:'session.output_audio.done',reason:'completed',start_ms:0,end_ms:900});return json(res,200,{ok:true});}
   if(m[2]==='recv'){const after=Number(u.searchParams.get('after')||-1);const pick=()=>c.toClient.filter(e=>Number(e.event_id.slice(4))>after);
    if(!pick().length)await new Promise(r=>{c.rwaiters.push(r);setTimeout(r,1000);});return json(res,200,{events:pick()});}
   if(m[2]==='leave'){return json(res,200,{});}
   if(m[2]==='send'){const ev=await readBody(req);c.fromClient.push(ev);
    if(ev?.type==='response.item.create'&&ev.item?.type==='function_call_output'){
     if(!c.pendingCall||ev.item.call_id!==c.pendingCall.call_id){roomPush(c,{type:'error',error:{type:'invalid_request_error',code:'invalid_value',message:'call_id'}});return json(res,200,{});}
     c.pendingCall.output=ev.item.output;}
    if(ev?.type==='response.create'&&c.pendingCall?.output!==undefined){const o=c.pendingCall.output;c.pendingCall=null;
     roomPush(c,{type:'session.output_transcript.delta',delta:'Hecho. '+String(o).slice(0,60),start_ms:0,end_ms:500});roomPush(c,{type:'session.output_audio.done',reason:'completed',start_ms:0,end_ms:500});}
    if(ev?.type==='session.close')end(c,'closed_by_client');
    return json(res,200,{});}}
  // Control de prueba: la «persona» decide llamar a una herramienta (como haría el backend de delegación).
  m=p.match(/^\/mock-control\/([0-9a-f-]{36})\/tool$/);
  if(m){const c=S.convs.get(m[1]);const b=await readBody(req);const call_id='call_'+randomUUID().slice(0,8);c.pendingCall={call_id,name:b.name};
   const del='del_'+call_id;roomPush(c,{type:'session.input_transcript.done',transcript:b.said||'',start_ms:0,end_ms:600});
   roomPush(c,{type:'session.delegation.created',offset_ms:0,delegation:{id:del,type:'delegation',target:'responses',response_id:'resp_1'}});
   roomPush(c,{type:'response.event',delegation_id:del,event:{type:'response.output_item.done',item:{type:'function_call',call_id,name:b.name,arguments:JSON.stringify(b.arguments||{})}}});
   return json(res,200,{call_id});}
  return json(res,404,{code:'not_found'});});
 return new Promise(r=>server.listen(0,'127.0.0.1',()=>r({S,url:`http://127.0.0.1:${server.address().port}`,key,close:()=>new Promise(q=>{for(const c of S.convs.values())clearTimeout(c.timer);server.closeAllConnections?.();server.close(q);})})));
}
// Almacén en memoria con la MISMA semántica que los scripts Lua de api/advisor-session.js (reserva y liberación).
function memoryStore(){const kv=new Map();const get=k=>{const v=kv.get(k);if(v&&v.exp&&v.exp<Date.now()){kv.delete(k);return null;}return v?v.val:null;};
 return async(cmd)=>{const [op]=cmd;
  if(op==='EVAL'){const script=cmd[1],nk=Number(cmd[2]),keys=cmd.slice(3,3+nk),args=cmd.slice(3+nk);
   if(/SET',KEYS\[2\]/.test(script)){const n=Number(get(keys[0])||0);if(n>=Number(args[0]))return 0;if(get(keys[1])!==null)return -1;kv.set(keys[1],{val:args[1],exp:Date.now()+Number(args[2])*1000});kv.set(keys[0],{val:String(n+1)});return 1;}
   if(/DEL/.test(script)){if(get(keys[0])===args[0]){kv.delete(keys[0]);return 1;}return 0;}}
  if(op==='SET'&&cmd.includes('XX')){if(get(cmd[1])===null)return null;kv.set(cmd[1],{val:cmd[2],exp:Date.now()+Number(cmd[cmd.indexOf('EX')+1])*1000});return 'OK';}
  throw Error('op');};}
module.exports={start,memoryStore};
