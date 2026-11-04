/* Rubik Visual Families: derived decisions, never Project data. */
export const BASE_SHA='894607b38fa43a5e89a9f5296a41cdbcc989d5ce';
const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
export const registry=freeze({F02:{label:'Carpinterias y huecos',recipes:{'window-assembly':{
 version:2,target:'existing-window',roles:['HERO'],sourceIds:[],enabled:false,
 defaults:{'frame.finish':'graphite','frame.system':'recessed-sash','glazing.optics':'clear-low-iron','facade.grain':'mineral-fine'},
 tokens:{'frame.finish':['graphite','chalk'],'frame.system':['recessed-sash'],'glazing.optics':['clear-low-iron'],'facade.grain':['mineral-fine']},
 resources:['Rubik.MeshStandardMaterial','Rubik.MeshPhysicalMaterial','Rubik.BoxGeometry','Rubik.DataTexture'],
 provenance:{author:'Rubik',method:'original adapter; VECINIA granularMaps/addWindow/addResidentialWindow mechanisms; Rubik correlated plaster fields',externalAssets:[]},
 renderBudget:{instances:64,textures:3,geometries:1,materials:6,drawCalls:640,triangles:160000,gpuBytes:1600000},
 qualityPolicy:{editor:'balanced',presentation:'detail',walk:'balanced',capture:'detail',mobile:'balanced'},
 compatibility:{minWidthMm:600,maxWidthMm:3600,minHeightMm:500,maxHeightMm:2400,minThicknessMm:60,fullHeightOnly:true},
 fallback:'original Rubik window and facade',visualGate:'VISUAL_PENDING_HUMAN'
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
 const {projectId=null,familyId='F02',recipeId='window-assembly',recipeVersion=2,enabled=false,role='HERO',sourceIds=[],seed=0,mode='presentation',profile,session={},overrides={}}=input;
 if(enabled&&(typeof projectId!=='string'||!projectId||projectId.length>160))throw Error('Explicit source Project ID required');
 const recipe=registry[familyId]?.recipes[recipeId];if(!recipe||recipeVersion!==recipe.version)throw Error('Unsupported recipe/version');
 if(typeof enabled!=='boolean'||!recipe.roles.includes(role)||!Number.isSafeInteger(seed)||seed<0)throw Error('Invalid enabled/role/seed');
 if(!Array.isArray(sourceIds)||sourceIds.length>recipe.renderBudget.instances||sourceIds.some(id=>typeof id!=='string'||!id||id.length>160)||new Set(sourceIds).size!==sourceIds.length)throw Error('Explicit unique source IDs required within recipe budget');
 if(!Object.hasOwn(recipe.qualityPolicy,mode))throw Error('Unknown visual mode');
 const quality=profile??recipe.qualityPolicy[mode];if(!['balanced','detail'].includes(quality))throw Error('Unknown quality profile');
 const tokens={...recipe.defaults};
 for(const layer of [session,overrides]){if(!plain(layer))throw Error('Invalid token layer');for(const [key,value]of Object.entries(layer)){
  if(!Object.hasOwn(recipe.tokens,key)||!recipe.tokens[key].includes(value))throw Error('Unknown token/value: '+key);tokens[key]=value;
 }}
 return freeze({projectId,familyId,recipeId,recipeVersion,enabled,role,sourceIds:[...sourceIds].sort(),seed,mode,profile:quality,tokens,target:recipe.target,authority:'VISUAL_ONLY',visualGate:recipe.visualGate});
}
export function compatibleWindow(source,decision){
 const c=registry[decision.familyId]?.recipes[decision.recipeId]?.compatibility;
 return !!(c&&decision.enabled&&source.projectId===decision.projectId&&decision.role==='HERO'&&decision.sourceIds.includes(source.id)&&source.kind==='window'&&source.fullHeight===true&&
  Number.isFinite(source.widthMm)&&source.widthMm>=c.minWidthMm&&source.widthMm<=c.maxWidthMm&&
  Number.isFinite(source.heightMm)&&source.heightMm>=c.minHeightMm&&source.heightMm<=c.maxHeightMm&&Number.isFinite(source.thicknessMm)&&source.thicknessMm>=c.minThicknessMm);
}
export function windowAssembly(source,decision){
 if(!compatibleWindow(source,decision))return null;
 const w=source.widthMm/1000,h=source.heightMm/1000,wall=source.thicknessMm/1000,n=Math.max(1,Math.round(w/.95));
 const outer=.048,sash=.032,frameDepth=Math.min(.072,wall*.36),boxes=[],glass=[];
 const add=(material,x,y,z,sx,sy,sz)=>boxes.push({material,position:[x,y,z],size:[sx,sy,sz]});
 const ring=(material,x,y,width,height,b,z,d)=>{
  add(material,x-width/2+b/2,y,z,b,height,d);add(material,x+width/2-b/2,y,z,b,height,d);
  add(material,x,y-height/2+b/2,z,width-2*b,b,d);add(material,x,y+height/2-b/2,z,width-2*b,b,d);
 };
 for(const x of [-1,1])add('reveal',x*(w/2-.007),h/2,0,.014,h,Math.max(.01,wall-.006));
 for(const y of [.007,h-.007])add('reveal',0,y,0,w-.028,.014,Math.max(.01,wall-.006));
 for(const side of [-1,1]){
  const face=side*(wall/2+.002),frameZ=side*(wall/2-frameDepth/2+.004);
  ring('seal',0,h/2,w+.008,h+.008,.005,face,.005);
  ring('frame',0,h/2,w,h,outer,frameZ,frameDepth);
  for(let k=0;k<n;k++){
   const bw=w/n,x=-w/2+(k+.5)*bw,sw=bw-outer*.55,sh=h-outer*1.25,sashZ=side*(wall/2-frameDepth-.014);
   ring('frame',x,h/2,sw,sh,sash,sashZ,.038);
   ring('seal',x,h/2,sw-sash*1.35,sh-sash*1.35,.004,side*(wall/2-frameDepth-.035),.005);
   if(decision.profile==='detail')ring('frame',x,h/2,sw-sash*1.65,sh-sash*1.65,.008,side*(wall/2-frameDepth-.039),.009);
   if(side===1)glass.push({position:[x,h/2,0],size:[sw-2*sash-.012,sh-2*sash-.012,.012]});
  }
  add('sill',0,-.022,side*(wall/2+.044),w+.12,.036,.16);
  add('sill',0,-.047,side*(wall/2+.105),w+.14,.018,.038);
 }
 const finish=decision.tokens['frame.finish'];
 return {boxes,glass,finish,sourceId:source.id,materials:{
  frame:finish==='chalk'?{color:'#d7d4cc',roughness:.42,metalness:.08}:{color:'#384144',roughness:.30,metalness:.62},
  seal:{color:'#151b1c',roughness:.88,metalness:0},reveal:{color:'#c8c1b5',roughness:.82,metalness:0},sill:{color:'#b7ab98',roughness:.86,metalness:0}
 },glazing:{color:'#dcebf0',roughness:.065,metalness:0,transparent:true,opacity:.30,transmission:.32,thickness:.012,ior:1.5,clearcoat:1,clearcoatRoughness:.08,specularIntensity:1,envMapIntensity:1.15,depthWrite:false},facade:{family:'plaster',mean:[217,203,187],repeatMm:{x:1000,y:1000}},triangles:(boxes.length+glass.length)*12,gpuBytes:(boxes.length+glass.length)*64};
}
