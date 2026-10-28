/* Point 8C-A: offline runtime GeoProvider contract. Site remains the durable authority. */
(function(root){
 'use strict';
 const CONTRACT_VERSION='1.1.0';
 const Parcel=typeof module==='object'&&module.exports?require('./parcel-core.js'):root.FloorPlanParcelCore;
 const PARCEL_INPUT_MODES=Object.freeze(['document','reference']);
 const PARCEL_REASONS=Object.freeze(['invalid-parcel-input','invalid-parcel-reference','invalid-source-document','multiple-parcels-require-selection','parcel-not-found','invalid-source-geometry','inconsistent-source-crs','unsupported-source-crs','network-unavailable','cancelled']);
 const CAPABILITIES=Object.freeze(['search','parcel','geometry','coordinates','sourceMetadata','orthophoto','elevation','terrain']);
 const NETWORK_MODES=Object.freeze(['none','optional','required']);
 const PROVIDER_KINDS=Object.freeze(['manual','official','commercial','other']);
 const LICENSE_STATUSES=Object.freeze(['not-applicable','unknown','verified','restricted']);
 const RESULT_STATUSES=Object.freeze(['available','not-found','unavailable','invalid','unsupported','cancelled']);
 const SOURCE_TYPES=Object.freeze(['user-entered','official-source','derived','unknown']);
 const SOURCE_FIELDS=Object.freeze({sourceName:200,sourceUrl:500,sourceId:200,retrievedAt:100,version:100,derivedFrom:200});
 const clone=value=>JSON.parse(JSON.stringify(value));
 const fail=message=>{throw new TypeError(`FloorPlanGeoProvider: ${message}`);};
 const object=(value,label)=>{if(!value||typeof value!=='object'||Array.isArray(value))fail(`${label} must be an object`);};
 const text=(value,label,max)=>{if(typeof value!=='string'||!value.trim()||value.length>max)fail(`${label} must be non-empty text of at most ${max} characters`);return value;};
 const optionalText=(value,label,max)=>{if(value===undefined)return undefined;return text(value,label,max);};
 const httpUrl=(value,label)=>{const raw=optionalText(value,label,500);if(raw===undefined)return undefined;let parsed;try{parsed=new URL(raw);}catch{fail(`${label} must be an http(s) URL`);}if(!['http:','https:'].includes(parsed.protocol))fail(`${label} must be an http(s) URL`);return raw;};
 const zoneValid=value=>{try{if(typeof value!=='string'||!value||value.length>100||/^[+-]|^UTC[+-]/i.test(value))return false;new Intl.DateTimeFormat('en',{timeZone:value}).format(0);return true;}catch{return false;}};
 function validateLocation(value){
  if(!value||typeof value!=='object'||!Number.isFinite(value.latitude)||Math.abs(value.latitude)>90||!Number.isFinite(value.longitude)||Math.abs(value.longitude)>180)throw Error('coordinates');
  if(!zoneValid(value.timeZone))throw Error('timeZone');
  return value;
 }
 function validateSite(value){
  if(value.northOffsetDeg!==undefined&&(!Number.isFinite(value.northOffsetDeg)||value.northOffsetDeg<0||value.northOffsetDeg>=360))throw Error('northOffsetDeg');
  if(value.location!==undefined)validateLocation(value.location);
  return value;
 }
 function normalizeSource(value,providerId){
  object(value,'source');
  for(const key of Object.keys(value))if(!['providerId','type',...Object.keys(SOURCE_FIELDS)].includes(key))fail(`source.${key} is unsupported`);
  const id=text(value.providerId,'source.providerId',80);
  if(providerId!==undefined&&id!==providerId)fail('source.providerId must match provider.id');
  if(!SOURCE_TYPES.includes(value.type))fail('source.type is invalid');
  const out={providerId:id,type:value.type};
  for(const [key,max] of Object.entries(SOURCE_FIELDS))if(value[key]!==undefined){
   if(typeof value[key]!=='string'||value[key].length>max)fail(`source.${key} is invalid`);
   if(key==='retrievedAt'){
    const match=/^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d):(\d\d)(?:\.\d+)?(Z|[+-](\d\d):(\d\d))$/.exec(value[key]);
    const year=Number(match?.[1]),month=Number(match?.[2]),day=Number(match?.[3]);
    const calendar=new Date(0);calendar.setUTCFullYear(year,month-1,day);
    if(!match||year<1||calendar.getUTCFullYear()!==year||calendar.getUTCMonth()+1!==month||calendar.getUTCDate()!==day||Number(match[4])>23||Number(match[5])>59||Number(match[6])>59||(match[8]!==undefined&&(Number(match[8])>23||Number(match[9])>59)))fail('source.retrievedAt is invalid');
   }
   out[key]=value[key];
  }
  return out;
 }
 function normalizeLicense(value){
  object(value,'license');
  for(const key of Object.keys(value))if(!['status','name','url','note'].includes(key))fail(`license.${key} is unsupported`);
  if(!LICENSE_STATUSES.includes(value.status))fail('license.status is invalid');
  const out={status:value.status};
  for(const key of ['name','note']){const v=optionalText(value[key],`license.${key}`,500);if(v!==undefined)out[key]=v;}
  const url=httpUrl(value.url,'license.url');if(url!==undefined)out.url=url;
  return out;
 }
 function normalizeParcelSource(value,providerId){
  object(value,'parcel source');
  const base={};for(const key of ['providerId','type',...Object.keys(SOURCE_FIELDS)])if(value[key]!==undefined)base[key]=value[key];
  const out=normalizeSource(base,providerId);
  for(const key of Object.keys(value))if(![...Object.keys(base),'edition','attribution','license'].includes(key))fail(`parcel source.${key} is unsupported`);
  for(const [key,max] of Object.entries({edition:100,attribution:500})){const v=optionalText(value[key],`parcel source.${key}`,max);if(v!==undefined)out[key]=v;}
  if(value.license!==undefined)out.license=normalizeLicense(value.license);
  return out;
 }
 function normalizeMetadata(value,id){
  object(value,'provider metadata');
  const allowed=['providerId','label','kind','network','sourceName','sourceUrl','version','edition','region','coverage','attribution','license','parcelInputModes'];
  for(const key of Object.keys(value))if(!allowed.includes(key))fail(`provider metadata.${key} is unsupported`);
  if(text(value.providerId,'provider metadata.providerId',80)!==id)fail('provider metadata.providerId must match provider.id');
  const out={providerId:id,label:text(value.label,'provider metadata.label',200)};
  if(!PROVIDER_KINDS.includes(value.kind))fail('provider metadata.kind is invalid');out.kind=value.kind;
  if(!NETWORK_MODES.includes(value.network))fail('provider metadata.network is invalid');out.network=value.network;
  for(const [key,max] of Object.entries({sourceName:200,version:100,edition:100,region:200,coverage:200,attribution:500})){
   const v=optionalText(value[key],`provider metadata.${key}`,max);if(v!==undefined)out[key]=v;
  }
  const url=httpUrl(value.sourceUrl,'provider metadata.sourceUrl');if(url!==undefined)out.sourceUrl=url;
  out.license=normalizeLicense(value.license);
  if(value.parcelInputModes!==undefined){
   if(!Array.isArray(value.parcelInputModes)||!value.parcelInputModes.length||new Set(value.parcelInputModes).size!==value.parcelInputModes.length||value.parcelInputModes.some(m=>!PARCEL_INPUT_MODES.includes(m)))fail('provider metadata.parcelInputModes is invalid');
   out.parcelInputModes=[...value.parcelInputModes].sort((a,b)=>PARCEL_INPUT_MODES.indexOf(a)-PARCEL_INPUT_MODES.indexOf(b));
  }
  return out;
 }
 function inspectProvider(provider){
  object(provider,'provider');
  const id=text(provider.id,'provider.id',80);
  if(!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(id))fail('provider.id has invalid characters');
  if(provider.contractVersion!==undefined&&!['1.0.0',CONTRACT_VERSION].includes(provider.contractVersion))fail('provider.contractVersion is unsupported');
  if(typeof provider.getCapabilities!=='function')fail('provider.getCapabilities() is required');
  if(typeof provider.getProviderMetadata!=='function')fail('provider.getProviderMetadata() is required');
  const declared=provider.getCapabilities();object(declared,'capabilities');
  for(const key of Object.keys(declared))if(!CAPABILITIES.includes(key))fail(`capabilities.${key} is unsupported`);
  const capabilities={};for(const key of CAPABILITIES){if(typeof declared[key]!=='boolean')fail(`capabilities.${key} must be boolean`);capabilities[key]=declared[key];}
  const metadata=normalizeMetadata(provider.getProviderMetadata(),id);
  if(capabilities.coordinates&&typeof provider.getCoordinates!=='function')fail('provider.getCoordinates() is required');
  if(capabilities.parcel){
   if(typeof provider.getParcel!=='function')fail('provider.getParcel() is required');
   if(!metadata.parcelInputModes)fail('provider metadata.parcelInputModes is required');
  }else if(metadata.parcelInputModes!==undefined)fail('provider metadata.parcelInputModes requires parcel capability');
  if(capabilities.sourceMetadata){
   if(typeof provider.getSourceMetadata!=='function')fail('provider.getSourceMetadata() is required');
   normalizeSource(provider.getSourceMetadata(),id);
  }
  return {providerId:id,contractVersion:CONTRACT_VERSION,...metadata,capabilities};
 }
 const result=(status,providerId,reason)=>({status,providerId,reason});
 function normalizeCoordinates(raw,id){
  object(raw,'coordinates result');
  if(raw.status!=='available'){
   if(raw.status==='cancelled')return result('cancelled',id,'cancelled');
   if(raw.status==='not-found')return result('not-found',id,'coordinates-not-found');
   return result('unavailable',id,'provider-error');
  }
  if(raw.providerId!==undefined&&raw.providerId!==id)fail('coordinates result.providerId must match provider.id');
  object(raw.location,'coordinates result.location');validateLocation(raw.location);
  if(raw.provenance!==undefined&&raw.location.source!==undefined&&JSON.stringify(raw.provenance)!==JSON.stringify(raw.location.source))fail('coordinates result has conflicting provenance');
  const provenance=normalizeSource(raw.provenance??raw.location.source,id);
  return {status:'available',providerId:id,location:{latitude:raw.location.latitude,longitude:raw.location.longitude,timeZone:raw.location.timeZone},provenance};
 }
 function normalizeParcelResult(raw,id){
  object(raw,'parcel result');
  if(raw.status!=='available'){
   if(!RESULT_STATUSES.includes(raw.status)||raw.status==='available'||!PARCEL_REASONS.includes(raw.reason))return result('unavailable',id,'provider-error');
   return result(raw.status,id,raw.reason);
  }
  if(raw.providerId!==undefined&&raw.providerId!==id)fail('parcel result.providerId must match provider.id');
  const parcel=Parcel.normalizeParcel(raw.parcel),provenance=normalizeParcelSource(raw.provenance,id);
  return {status:'available',providerId:id,parcel,provenance};
 }
 function createRegistry(initialProviders=[]){
  if(!Array.isArray(initialProviders))fail('initialProviders must be an array');
  const entries=new Map();
  const register=provider=>{const descriptor=inspectProvider(provider),id=descriptor.providerId;if(entries.has(id))fail(`provider ${id} is already registered`);entries.set(id,{provider,descriptor:clone(descriptor)});return clone(descriptor);};
  const unregister=id=>entries.delete(id);
  const has=id=>entries.has(id);
  const get=id=>entries.get(id)?.provider??null;
  const inspect=id=>entries.has(id)?clone(entries.get(id).descriptor):null;
  const list=(options={})=>{object(options,'list options');const capability=options.capability;if(capability!==undefined&&!CAPABILITIES.includes(capability))fail('unknown capability');return [...entries.values()].filter(e=>capability===undefined||e.descriptor.capabilities[capability]).map(e=>clone(e.descriptor)).sort((a,b)=>a.providerId.localeCompare(b.providerId,'en'));};
  async function getCoordinates(providerId,input,context={}){
   if(typeof providerId!=='string'||!providerId.trim())return result('invalid',providerId??null,'invalid-provider-id');
   const entry=entries.get(providerId);if(!entry)return result('not-found',providerId,'provider-not-registered');
   if(!entry.descriptor.capabilities.coordinates)return result('unsupported',providerId,'capability-disabled');
   if(context?.signal?.aborted)return result('cancelled',providerId,'cancelled');
   const query={latitude:input?.latitude,longitude:input?.longitude,timeZone:input?.timeZone};
   try{validateLocation(query);}catch(error){return result('invalid',providerId,error.message==='timeZone'?'timeZone':'coordinates');}
   try{
    const raw=await entry.provider.getCoordinates(Object.freeze(query),Object.freeze(context?.signal?{signal:context.signal}:{}));
    if(context?.signal?.aborted)return result('cancelled',providerId,'cancelled');
    return normalizeCoordinates(raw,providerId);
   }catch{return result('unavailable',providerId,'provider-error');}
  }
  async function getParcel(providerId,input,context={}){
   if(typeof providerId!=='string'||!providerId.trim())return result('invalid',providerId??null,'invalid-provider-id');
   const entry=entries.get(providerId);if(!entry)return result('not-found',providerId,'provider-not-registered');
   if(!entry.descriptor.capabilities.parcel)return result('unsupported',providerId,'capability-disabled');
   if(context?.signal?.aborted)return result('cancelled',providerId,'cancelled');
   if(!input||typeof input!=='object'||!entry.descriptor.parcelInputModes.includes(input.mode))return result('unsupported',providerId,'parcel-input-mode-disabled');
   let query;
   try{
    if(input.mode==='document'){
     if(typeof input.text!=='string'||!input.text.trim()||new TextEncoder().encode(input.text).length>Parcel.LIMITS.documentBytes)fail('invalid-parcel-input');
     query={mode:'document',text:input.text};
     if(input.reference!==undefined)query.reference=Parcel.normalizeReference(input.reference);
    }else query={mode:'reference',reference:Parcel.normalizeReference(input.reference)};
   }catch(error){return result('invalid',providerId,error.reason==='invalid-parcel-reference'?'invalid-parcel-reference':'invalid-parcel-input');}
   try{
    const raw=await entry.provider.getParcel(Object.freeze(query),Object.freeze(context?.signal?{signal:context.signal}:{}));
    if(context?.signal?.aborted)return result('cancelled',providerId,'cancelled');
    return normalizeParcelResult(raw,providerId);
   }catch{return result('unavailable',providerId,'provider-error');}
  }
  for(const provider of initialProviders)register(provider);
  return Object.freeze({register,unregister,has,get,inspect,list,getCoordinates,getParcel});
 }
 const MANUAL_CAPABILITIES=Object.freeze({search:false,parcel:false,geometry:false,coordinates:true,sourceMetadata:true,orthophoto:false,elevation:false,terrain:false});
 const Manual=Object.freeze({id:'manual',contractVersion:CONTRACT_VERSION,capabilities:MANUAL_CAPABILITIES,
  getCapabilities(){return MANUAL_CAPABILITIES;},
  getProviderMetadata(){return {providerId:'manual',label:'Manual',kind:'manual',network:'none',license:{status:'not-applicable'}};},
  getCoordinates(input){
   try{validateLocation(input);return {status:'available',location:{latitude:input.latitude,longitude:input.longitude,timeZone:input.timeZone,source:{providerId:'manual',type:'user-entered'}}};}
   catch(error){return {status:'unavailable',reason:error.message};}
  },
  getSourceMetadata(){return {providerId:'manual',type:'user-entered'};}
 });
 const createDefaultRegistry=()=>{
  const catastro=typeof module==='object'&&module.exports?require('./catastro-parcel-provider.js').provider:root.FloorPlanCatastroParcel?.provider;
  return createRegistry(catastro?[Manual,catastro]:[Manual]);
 };
 const api={CONTRACT_VERSION,CAPABILITIES,PARCEL_INPUT_MODES,NETWORK_MODES,PROVIDER_KINDS,LICENSE_STATUSES,RESULT_STATUSES,Manual,zoneValid,validateLocation,validateSite,normalizeSource,normalizeParcelSource,inspectProvider,createRegistry,createDefaultRegistry};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanGeoProvider=api;
})(globalThis);
