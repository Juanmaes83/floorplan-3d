/* GOV-08 S3 / ENT-02 · Expiry of client links. Pure module: no DOM, network, storage or clock of its own (every
   function takes `now` in milliseconds). Shared by the server (api/share.js, api/view.js, api/delivery.js,
   api/publications.js) and the browser («Mis publicaciones»). UMD: window.FloorPlanShareExpiry / module.exports.

   Policy (owner proposal of 17/11/2026, pending approval): 30 days by default, 7, 30 or 90 to choose, early
   withdrawal always possible (S2), and NO new link without an expiry date.

   Where the date lives. Only the server names what it stores in Blob, so the expiry is written into the stored file
   name when it is uploaded:
     rubik-share/<slug>--<publication id: 24 hex>--x<YYYYMMDDHHMM UTC>[-<provider suffix>].<html|mp4|webm|delivery.json>
   The page, its tour video and its 3D visit share the publication id and the date. A file under rubik-share/ that
   does not follow this pattern was published before S3: it is a LEGACY file with no expiry date. It is never expired
   or deleted retroactively by this module; it is only identified.

   Three different things (see docs/security/gov08-s3-caducidad.md):
   - viewer expiry: /api/view and /api/delivery stop serving the link at the date (410), immediately;
   - direct Blob access: the files stay public in the Blob CDN until they are deleted, whatever the viewer says;
   - effective deletion: only /api/unshare (S2) or the purge of expired files (/api/publications) removes them. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanShareExpiry=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const DAY=86400000,MINUTE=60000;
 const TTL_DAYS=Object.freeze([7,30,90]),DEFAULT_TTL=30,MAX_TTL=90;
 // Clock skew accepted between the uploads of one publication (video, 3D visit, page): never beyond MAX_TTL + this.
 const SKEW=10*MINUTE;
 const NAME=/^\/?rubik-share\/([\w-]+?)--([0-9a-f]{24})--x(\d{12})(?:-[A-Za-z0-9]+)?\.(html|mp4|webm|delivery\.json)$/;
 const ANY=/^\/?rubik-share\/[\w-]+\.(html|mp4|webm|delivery\.json)$/;
 const pad=n=>String(n).padStart(2,'0');
 // YYYYMMDDHHMM in UTC, rounded UP to the minute so a link never lasts less than what was chosen.
 function stamp(ms){const d=new Date(Math.ceil(ms/MINUTE)*MINUTE);return `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}`;}
 function fromStamp(s){
  const m=/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})$/.exec(String(s));if(!m)return null;
  const [y,mo,d,h,mi]=m.slice(1).map(Number),ms=Date.UTC(y,mo-1,d,h,mi);const back=new Date(ms);
  // Reject impossible dates (2026-02-31 → March) instead of silently shifting them.
  return back.getUTCFullYear()===y&&back.getUTCMonth()===mo-1&&back.getUTCDate()===d&&back.getUTCHours()===h&&back.getUTCMinutes()===mi?ms:null;
 }
 // The TTL a request asks for: absent → the default (never unlimited); anything else than 7, 30 or 90 → null (refused).
 function ttl(raw){if(raw===undefined||raw===null||raw==='')return DEFAULT_TTL;const n=Number(raw);return TTL_DAYS.includes(n)&&String(raw)===String(n)?n:null;}
 const expiresFrom=(now,days)=>Math.ceil((now+days*DAY)/MINUTE)*MINUTE;
 // «<id>.x<stamp>»: the publication a later upload belongs to. Accepted only if it expires in the future and no later
 // than the longest TTL from now (plus skew): an authorised client cannot make a link last longer than 90 days.
 function publication(raw,now){
  const m=/^([0-9a-f]{24})\.x(\d{12})$/.exec(String(raw||''));if(!m)return null;
  const exp=fromStamp(m[2]);if(exp===null||exp<=now||exp>now+MAX_TTL*DAY+SKEW)return null;
  return {id:m[1],expiresAt:exp,stamp:m[2]};
 }
 const header=p=>`${p.id}.x${stamp(p.expiresAt)}`;
 // The stored path for one file of a publication. `slug` is already reduced to [a-z0-9_-] without «--».
 function pathname(slug,p,ext){return `rubik-share/${String(slug).replace(/-{2,}/g,'-')}--${p.id}--x${stamp(p.expiresAt)}.${ext}`;}
 // What a stored path (or its https URL) says about expiry. null → not a file /api/share writes.
 function parse(raw){
  let p=String(raw||'');try{if(/^https:\/\//.test(p))p=new URL(p).pathname;}catch{return null;}
  const m=NAME.exec(p);if(m){const exp=fromStamp(m[3]);return exp===null?null:{legacy:false,publicationId:m[2],expiresAt:exp,ext:m[4]};}
  return ANY.test(p)?{legacy:true,publicationId:null,expiresAt:null,ext:p.slice(p.indexOf('.')+1)}:null;
 }
 // 'legacy' (published before S3, no date), 'active' or 'expired' (at the exact minute it expires, the link is closed).
 function state(info,now){if(!info)return null;if(info.legacy||info.expiresAt==null)return 'legacy';return now>=info.expiresAt?'expired':'active';}
 const isExpired=(raw,now)=>state(parse(raw),now)==='expired';
 return Object.freeze({DAY,TTL_DAYS,DEFAULT_TTL,MAX_TTL,SKEW,stamp,fromStamp,ttl,expiresFrom,publication,header,pathname,parse,state,isExpired});
});
