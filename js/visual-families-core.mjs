/* Rubik Visual Families V1: derived decisions, never Project data. */
export const BASE_SHA='894607b38fa43a5e89a9f5296a41cdbcc989d5ce';
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
export const registry=freeze({F02:{label:'Carpinterias y huecos',recipes:{'window-profile':{
 version:1,target:'existing-window',roles:['HERO'],sourceIds:[],enabled:false,
 defaults:{'frame.finish':'graphite','frame.profile':'stepped'},
 tokens:{'frame.finish':['graphite','chalk'],'frame.profile':['stepped']},
 resources:['Rubik.MeshStandardMaterial','Rubik.BoxGeometry'],
 provenance:{author:'Rubik',method:'original adapter; VECINIA profile layering concept only',externalAssets:[]},
 renderBudget:{instances:3,textures:0,geometries:1,materials:2,drawCalls:6,triangles:3000,gpuBytes:32768},
 qualityPolicy:{editor:'balanced',presentation:'detail',walk:'balanced',capture:'detail',mobile:'balanced'},
 compatibility:{minWidthMm:600,maxWidthMm:3600,minHeightMm:500,maxHeightMm:2400,minThicknessMm:60,fullHeightOnly:true},
 fallback:'original Rubik window',visualGate:'VISUAL_PENDING_HUMAN'
}}}});
export function stableJSON(value){
 const sort=v=>Array.isArray(v)?v.map(sort):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,sort(v[k])])):v;
 return JSON.stringify(sort(value));
}
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
export function resolveVisual(input={}){
 if(!plain(input))throw Error('Visual decision must be an object');
 const allowed=['projectId','familyId','recipeId','recipeVersion','enabled','role','sourceIds','seed','mode','profile','session','overrides'];
 for(const k of Object.keys(input))if(!allowed.includes(k))throw Error('Unknown visual key: '+k);
 const {projectId=null,familyId='F02',recipeId='window-profile',recipeVersion=1,enabled=false,role='HERO',sourceIds=[],seed=0,mode='presentation',profile,session={},overrides={}}=input;
 if(enabled&&(typeof projectId!=='string'||!projectId||projectId.length>160))throw Error('Explicit source Project ID required');
 const recipe=registry[familyId]?.recipes[recipeId];if(!recipe||recipeVersion!==recipe.version)throw Error('Unsupported recipe/version');
 if(typeof enabled!=='boolean'||!recipe.roles.includes(role)||!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid enabled/role/seed');
 if(!Array.isArray(sourceIds)||sourceIds.length>recipe.renderBudget.instances||sourceIds.some(id=>typeof id!=='string'||!id||id.length>160)||new Set(sourceIds).size!==sourceIds.length)throw Error('Explicit unique source IDs required, maximum three');
 if(!Object.hasOwn(recipe.qualityPolicy,mode))throw Error('Unknown visual mode');
 const quality=profile??recipe.qualityPolicy[mode];if(!['balanced','detail'].includes(quality))throw Error('Unknown quality profile');
 const tokens={...recipe.defaults};
 // Rubik scopes only: versioned recipe defaults < session preview < selected element override.
 for(const layer of [session,overrides]){if(!plain(layer))throw Error('Invalid token layer');for(const [key,value]of Object.entries(layer)){
  if(!Object.hasOwn(recipe.tokens,key)||!recipe.tokens[key].includes(value))throw Error('Unknown token/value: '+key);tokens[key]=value;
 }}
 return freeze({projectId,familyId,recipeId,recipeVersion,enabled,role,sourceIds:[...sourceIds].sort(),seed,mode,profile:quality,tokens,target:recipe.target,authority:'VISUAL_ONLY',visualGate:recipe.visualGate});
}
export function compatibleWindow(source,decision){
 const c=registry.F02.recipes['window-profile'].compatibility;
 return !!(decision.enabled&&source.projectId===decision.projectId&&decision.role==='HERO'&&decision.sourceIds.includes(source.id)&&source.kind==='window'&&source.fullHeight===true&&
  Number.isFinite(source.widthMm)&&source.widthMm>=c.minWidthMm&&source.widthMm<=c.maxWidthMm&&
  Number.isFinite(source.heightMm)&&source.heightMm>=c.minHeightMm&&source.heightMm<=c.maxHeightMm&&Number.isFinite(source.thicknessMm)&&source.thicknessMm>=c.minThicknessMm);
}
// Metres; visual stock profiles stay inside the existing aperture envelope. No wall/collider mutation.
export function windowProfile(source,decision){
 if(!compatibleWindow(source,decision))return null;
 const w=source.widthMm/1000,h=source.heightMm/1000,n=Math.max(1,Math.round(w/.9)),depth=Math.min(.08,source.thicknessMm/1000*.7),stock=.055,boxes=[];
 const add=(material,x,y,z,sx,sy,sz)=>boxes.push({material,position:[x,y,z],size:[sx,sy,sz]});
 const ring=(material,x,y,width,height,b,z,d)=>{
  add(material,x-width/2+b/2,y,z,b,height,d);add(material,x+width/2-b/2,y,z,b,height,d);
  add(material,x,y-height/2+b/2,z,width-2*b,b,d);add(material,x,y+height/2-b/2,z,width-2*b,b,d);
 };
 ring('frame',0,h/2,w,h,stock,0,depth);
 for(let k=1;k<n;k++)add('frame',-w/2+k*w/n,h/2,0,stock,h-2*stock,depth);
 for(let k=0;k<n;k++){
  const width=w/n-stock*(k===0||k===n-1?1.5:1),x=-w/2+(k+.5)*w/n+(k===0?stock/4:k===n-1?-stock/4:0);
  for(const sign of [-1,1]){
   ring('seal',x,h/2,width,h-2*stock,.006,sign*(depth/2+.002),.004);
   if(decision.profile==='detail')ring('frame',x,h/2,width+.014,h-2*stock+.014,.012,sign*(depth/2-.009),.018);
  }
 }
 const finish=decision.tokens['frame.finish'];
 return {boxes,finish,sourceId:source.id,materials:{frame:finish==='chalk'?{color:'#dedbd2',roughness:.54,metalness:0}:{color:'#40474b',roughness:.42,metalness:.45},seal:{color:'#242729',roughness:.93,metalness:0}},triangles:boxes.length*12,gpuBytes:boxes.length*64};
}
