/* «Tu marca profesional» (premium UX cut C, docs/product/premium-ux-design-2026-10-20.md §5), pure part.
   Professional profiles and the per-project delivery choice are local browser data, like the variant link of
   decision D-C1: they are never written into FloorPlanProjectV1, FloorPlanBuildingV1 or their JSON/ZIP packages.
   A deliverable (sheet, presentation views) receives a frozen snapshot of the profile at the moment it is made, so
   editing a profile later never changes files already delivered. Validation keeps text short and plain, links to
   http(s), and the logo to a raster PNG data URL produced by re-encoding (no SVG or active content).
   UMD: window.FloorPlanBrand in the browser, module.exports in Node tests. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanBrand=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const PROFILES_KEY='rubik-sota-brand-profiles-v1',DELIVERY_KEY='rubik-sota-brand-delivery-v1',MAX_PROFILES=12,LOGO_MAX_BYTES=300*1024;
 const LIMITS={name:80,person:80,phone:30,email:120,web:200,tagline:120,title:120,intro:400};
 const clean=(v,max)=>String(v??'').replace(/[\u0000-\u001f\u007f]/g,' ').replace(/\s+/g,' ').trim().slice(0,max);
 const fail=(field,message)=>{const e=Error(message);e.field=field;throw e;};
 function web(value){
  const v=clean(value,LIMITS.web);if(!v)return '';
  let u;try{u=new URL(/^[a-z][a-z0-9+.-]*:/i.test(v)?v:`https://${v}`);}catch{fail('web','La web no es una dirección válida.');}
  if(!['http:','https:'].includes(u.protocol))fail('web','La web debe empezar por http:// o https://.');
  if(u.username||u.password)fail('web','La web no puede llevar usuario ni contraseña.');
  if(!/\./.test(u.hostname))fail('web','La web debe incluir un dominio, por ejemplo estudio.es.');
  return u.href.replace(/\/$/,'');
 }
 function email(value){const v=clean(value,LIMITS.email);if(v&&!/^[^\s@<>"]+@[^\s@<>".]+(\.[^\s@<>".]+)+$/.test(v))fail('email','El correo no es válido.');return v;}
 function phone(value){const v=clean(value,LIMITS.phone);if(v&&!/^\+?[0-9][0-9 ().-]{5,}$/.test(v))fail('phone','El teléfono sólo admite cifras, espacios, «+», «-», «.» y paréntesis.');return v;}
 function logo(value){
  if(value==null||value==='')return null;
  const v=String(value);if(!/^data:image\/png;base64,[A-Za-z0-9+/]+=*$/.test(v))fail('logo','El logo debe ser una imagen PNG convertida por Rubik.');
  const bytes=Math.floor((v.length-'data:image/png;base64,'.length)*3/4);if(bytes>LOGO_MAX_BYTES)fail('logo','El logo supera 300 KB después de ajustarlo.');
  return v;
 }
 function normalizeProfile(input,{id}={}){
  const p=input||{},name=clean(p.name,LIMITS.name);if(!name)fail('name','Escribe el nombre comercial.');
  return {id:String(id||p.id||''),name,person:clean(p.person,LIMITS.person),phone:phone(p.phone),email:email(p.email),web:web(p.web),tagline:clean(p.tagline,LIMITS.tagline),logo:logo(p.logo),updatedAt:p.updatedAt||null};
 }
 function newId(){return 'brd_'+Math.random().toString(36).slice(2,10)+Date.now().toString(36).slice(-4);}
 function readProfiles(storage){
  try{const raw=JSON.parse(storage.getItem(PROFILES_KEY)||'null');if(!raw||raw.version!==1||!Array.isArray(raw.profiles))return {version:1,profiles:[]};
   const profiles=[];for(const p of raw.profiles.slice(0,MAX_PROFILES)){try{if(/^brd_[a-z0-9]{6,20}$/.test(p.id))profiles.push(normalizeProfile(p));}catch{}}return {version:1,profiles};}
  catch{return {version:1,profiles:[]};}
 }
 function writeProfiles(storage,library){storage.setItem(PROFILES_KEY,JSON.stringify({version:1,profiles:library.profiles}));}
 function saveProfile(storage,input,now=new Date().toISOString()){
  const lib=readProfiles(storage),existing=input?.id&&lib.profiles.find(p=>p.id===input.id);
  if(!existing&&lib.profiles.length>=MAX_PROFILES)fail('name',`Puedes guardar hasta ${MAX_PROFILES} marcas.`);
  const profile={...normalizeProfile(input,{id:existing?existing.id:newId()}),updatedAt:now};
  lib.profiles=existing?lib.profiles.map(p=>p.id===profile.id?profile:p):[...lib.profiles,profile];writeProfiles(storage,lib);return profile;
 }
 function removeProfile(storage,id){const lib=readProfiles(storage);lib.profiles=lib.profiles.filter(p=>p.id!==id);writeProfiles(storage,lib);
  const d=readDeliveries(storage);for(const e of Object.values(d.entries))if(e.profileId===id)e.profileId=null;writeDeliveries(storage,d);}
 function readDeliveries(storage){try{const raw=JSON.parse(storage.getItem(DELIVERY_KEY)||'null');return raw&&raw.version===1&&raw.entries&&typeof raw.entries==='object'?raw:{version:1,entries:{}};}catch{return {version:1,entries:{}};}}
 function writeDeliveries(storage,d){storage.setItem(DELIVERY_KEY,JSON.stringify(d));}
 // Delivery data of one project (library entry): chosen profile (or none), title and introduction for the client.
 function delivery(storage,entryId){
  const e=readDeliveries(storage).entries[entryId]||{},lib=readProfiles(storage);
  const profileId=lib.profiles.some(p=>p.id===e.profileId)?e.profileId:null;
  return {profileId,title:clean(e.title,LIMITS.title),intro:clean(e.intro,LIMITS.intro)};
 }
 function setDelivery(storage,entryId,change){
  if(!entryId)fail('entry','No hay un proyecto activo.');
  const d=readDeliveries(storage),cur=d.entries[entryId]||{},lib=readProfiles(storage),next={...cur,...change};
  if(next.profileId&&!lib.profiles.some(p=>p.id===next.profileId))fail('profileId','Esa marca ya no existe.');
  d.entries[entryId]={profileId:next.profileId||null,title:clean(next.title,LIMITS.title),intro:clean(next.intro,LIMITS.intro)};writeDeliveries(storage,d);return delivery(storage,entryId);
 }
 // Frozen copy used by a deliverable: profile fields, project title and intro, and when it was taken.
 function snapshot(storage,entryId,projectName,now=new Date().toISOString()){
  const d=delivery(storage,entryId),profile=d.profileId?readProfiles(storage).profiles.find(p=>p.id===d.profileId):null;
  if(!profile)return null;
  return Object.freeze({profile:Object.freeze({...profile}),title:d.title||clean(projectName,LIMITS.title),intro:d.intro,takenAt:now});
 }
 const contactLine=p=>[p.person,p.phone,p.email,p.web&&p.web.replace(/^https?:\/\//,'')].filter(Boolean).join(' · ');
 // Credit line: the professional prepared the delivery with Rubik Sota; platform authorship is never replaced.
 const credit=p=>`Preparado por ${p.name} con Rubik Sota`;
 return {PROFILES_KEY,DELIVERY_KEY,MAX_PROFILES,LOGO_MAX_BYTES,LIMITS,normalizeProfile,readProfiles,saveProfile,removeProfile,delivery,setDelivery,snapshot,contactLine,credit,web,email,phone,logo};
});
