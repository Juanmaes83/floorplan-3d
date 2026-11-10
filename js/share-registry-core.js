/* GOV-08 / ENT-02 S2: the local register of «Mis publicaciones». Pure data over a Storage-like object; no network.
   IMPORTANT: it lives only in THIS browser. It is a convenience to find and withdraw what was published from here,
   not an authoritative record: another computer or browser does not see it, and clearing site data empties it.
   It stores only what is needed to show and withdraw a link: never a code, a token or project content (fields are
   whitelisted and URLs must be https). UMD: window.FloorPlanShareRegistry / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanShareRegistry=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const KEY='rubik-share-publications-v1',MAX=50,STATES=Object.freeze(['active','withdrawn','partial']);
 const https=u=>{try{const x=new URL(String(u));return x.protocol==='https:'&&!x.username&&!x.password?x.href:null;}catch{return null;}};
 const text=(v,n=120)=>typeof v==='string'?v.slice(0,n):'';
 const iso=v=>{const d=new Date(v);return Number.isFinite(d.getTime())?d.toISOString():null;};
 // Only whitelisted fields survive: anything else (a code, a token, project data) is dropped.
 function clean(e){
  if(!e||typeof e!=='object')return null;
  const page=https(e.page),publishedAt=iso(e.publishedAt);if(!page||!publishedAt)return null;
  const link=typeof e.link==='string'&&/^https?:\/\//.test(e.link)?e.link.slice(0,2048):null;
  const files=(Array.isArray(e.files)?e.files:[page,e.video]).map(https).filter(Boolean);
  const state=STATES.includes(e.state)?e.state:'active';
  return {id:page,page,video:https(e.video),link,files:[...new Set(files)].slice(0,8),kind:['html+video','orphan-video'].includes(e.kind)?e.kind:'html',
   project:text(e.project),versionCode:text(e.versionCode,40),publishedAt,state,withdrawnAt:iso(e.withdrawnAt),pending:(Array.isArray(e.pending)?e.pending:[]).map(https).filter(Boolean)};
 }
 function load(storage){try{const raw=JSON.parse(storage?.getItem(KEY)||'[]');return Array.isArray(raw)?raw.map(clean).filter(Boolean).slice(0,MAX):[];}catch{return [];}}
 function save(storage,list){try{storage?.setItem(KEY,JSON.stringify(list.map(clean).filter(Boolean).slice(0,MAX)));return true;}catch{return false;}}
 // A new publication goes first; the oldest are dropped beyond MAX.
 function add(list,p,now=new Date()){
  const e=clean({page:p.page,video:p.video||null,link:p.link,files:[p.page,p.video].filter(Boolean),kind:p.video?'html+video':'html',project:p.project,versionCode:p.versionCode,publishedAt:now,state:'active'});
  return e?[e,...list.filter(x=>x.id!==e.id)].slice(0,MAX):list;
 }
 // A tour video uploaded for a publication whose page then failed and could not be cleaned up automatically: kept so
 // it can be withdrawn later from «Mis publicaciones». Only that video URL is recorded — nothing else is ever named.
 function addOrphan(list,{video,project},now=new Date()){
  const e=clean({page:video,video,link:null,files:[video],kind:'orphan-video',project,publishedAt:now,state:'partial',pending:[video]});
  return e?[e,...list.filter(x=>x.id!==e.id)].slice(0,MAX):list;
 }
 // «Borrar historial»: forgets the local list only. It never deletes any file and never withdraws any link.
 function clear(storage){try{storage?.removeItem(KEY);return true;}catch{return false;}}
 // After /api/unshare: every file removed → withdrawn; some failed → partial, keeping the files still to remove.
 function applyWithdrawal(list,id,{removed=[],failed=[]}={},now=new Date()){
  return list.map(e=>{if(e.id!==id)return e;const left=failed.map(f=>f?.url||f).filter(Boolean);
   return left.length?{...e,state:'partial',pending:left}:{...e,state:'withdrawn',withdrawnAt:iso(now),pending:[]};});
 }
 const toRemove=e=>e.state==='partial'&&e.pending.length?e.pending:e.files;
 return Object.freeze({KEY,MAX,STATES,clean,load,save,add,addOrphan,applyWithdrawal,toRemove,clear});
});
