const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
export const registry=freeze({F03:{label:'Materialidad de fachadas',recipes:{'facade-material':{
 version:1,target:'existing-exterior-wall-finish',roles:['HERO'],enabled:false,
 materials:['white_stucco','white_rough_plaster','rough_plaster_03'],defaultMaterial:'white_stucco',
 profiles:{editor:'balanced',presentation:'hero',walk:'balanced',capture:'hero',mobile:'balanced'},
 compatibility:{white_stucco:'surface-white-plaster-02',white_rough_plaster:'surface-white-plaster-02',rough_plaster_03:'surface-plastered-wall-03'},
 resources:['Rubik.MeshStandardMaterial','Rubik.WebGLTexture','Rubik.BufferGeometry'],
 provenance:{author:'Rubik',method:'PBR derivado de fuentes Poly Haven; adaptación visual modular',externalAssets:['white_stucco','white_rough_plaster','rough_plaster_03']},
 renderBudget:{instances:256,textures:3,materials:1,geometries:256,gpuBytes:14000000},
 visualGate:'VISUAL_PENDING_HUMAN',authority:'VISUAL_ONLY'
}}}});
const plain=o=>o&&typeof o==='object'&&!Array.isArray(o)&&[Object.prototype,null].includes(Object.getPrototypeOf(o));
export function resolveFacade(input={}){
 if(!plain(input))throw Error('Facade decision must be an object');
 const allowed=['projectId','familyId','recipeId','recipeVersion','enabled','role','mode','profile','materialId','repeatMm','normalStrength','allowExperimentalVariant'];
 for(const key of Object.keys(input))if(!allowed.includes(key))throw Error('Unknown facade key: '+key);
 const {projectId=null,familyId='F03',recipeId='facade-material',recipeVersion=1,enabled=false,role='HERO',mode='presentation',profile,materialId='white_stucco',repeatMm=2000,normalStrength=.65,allowExperimentalVariant=false}=input;
 const recipe=registry[familyId]?.recipes[recipeId];if(!recipe||recipeVersion!==recipe.version)throw Error('Unsupported facade recipe/version');
 if(enabled&&(typeof projectId!=='string'||!projectId||projectId.length>160))throw Error('Explicit source Project ID required');
 if(typeof enabled!=='boolean'||!recipe.roles.includes(role)||!Object.hasOwn(recipe.profiles,mode))throw Error('Invalid facade enabled/role/mode');
 if(!recipe.materials.includes(materialId))throw Error('Unknown facade material');
 if(materialId!=='white_stucco'&&enabled&&!allowExperimentalVariant)throw Error('Experimental facade variant requires explicit opt-in');
 const selected=profile??recipe.profiles[mode];if(!['hero','balanced'].includes(selected))throw Error('Unknown facade profile');
 if(!Number.isFinite(repeatMm)||repeatMm<250||repeatMm>10000||!Number.isFinite(normalStrength)||normalStrength<0||normalStrength>2||typeof allowExperimentalVariant!=='boolean')throw Error('Invalid facade calibration');
 return freeze({projectId,familyId,recipeId,recipeVersion,enabled,role,mode,profile:selected,materialId,repeatMm,normalStrength,allowExperimentalVariant,target:recipe.target,authority:recipe.authority,visualGate:recipe.visualGate});
}
export function facadeEligibility(source,decision){
 const recipe=registry[decision.familyId]?.recipes[decision.recipeId];
 const reject=reason=>({eligible:false,reason});
 if(!recipe)return reject('unsupported-recipe');
 if(source.projectId!==decision.projectId)return reject('project-mismatch');
 if(source.exterior!=='facade')return reject(source.exterior==='interior'?'interior-wall':'exterior-unavailable');
 if(source.reserved)return reject('f02-owned-surface');
 if(!source.materialId)return reject('material-unassigned');
 if(source.category!=='wall')return reject('material-category-excluded');
 const expected=recipe.compatibility[decision.materialId];
 if(source.preset!==expected)return reject('material-semantic-mismatch');
 return {eligible:true,reason:null,preset:source.preset,materialId:source.materialId};
}
export function compatibleFacade(source,decision){return !!decision.enabled&&facadeEligibility(source,decision).eligible;}


// ───────────────────────────────────────────────────────────────── F03 V2 · fidelidad profesional de fachadas
// V1 (arriba) queda intacta: un material por decisión. V2 resuelve el material MURO A MURO a partir del acabado que el
// profesional asignó con el catálogo de RUBIK (appearance.preset = id del catálogo). Sólo se mejora un muro cuando
// existe un material F03 de la MISMA identidad; si no, se conserva su acabado y se dice por qué. Nunca se escribe en el
// proyecto: VISUAL_ONLY, OFF por defecto y activación voluntaria por sesión.
const V2_MATERIALS={
 // Conservados de V1 (aprobación humana V1/muestra): equivalencia histórica declarada, no del mismo activo.
 white_stucco:{manifest:'v1',identity:'plaster',sameAsset:false,approval:'VISUAL_APPROVED_HUMAN_F03_V1'},
 rough_plaster_03:{manifest:'v1',identity:'plaster',sameAsset:false,approval:'VISUAL_APPROVED_HUMAN_SAMPLE'},
 // Nuevos V2: derivados del MISMO activo Poly Haven que la entrada del catálogo (identidad material garantizada).
 painted_plaster_wall:{manifest:'v2',identity:'plaster',sameAsset:true,approval:'VISUAL_PENDING_HUMAN'},
 patterned_clay_plaster:{manifest:'v2',identity:'plaster',sameAsset:true,approval:'VISUAL_PENDING_HUMAN'},
 brushed_concrete_03:{manifest:'v2',identity:'mineral',sameAsset:true,approval:'VISUAL_PENDING_HUMAN'},
 wood_planks_grey:{manifest:'v2',identity:'wood',sameAsset:true,approval:'VISUAL_PENDING_HUMAN'}
};
const V2_PRESETS={
 'surface-white-plaster-02':'white_stucco',
 'surface-plastered-wall-03':'rough_plaster_03',
 'surface-painted-plaster-wall':'painted_plaster_wall',
 'surface-patterned-clay-plaster':'patterned_clay_plaster',
 'surface-brushed-concrete-03':'brushed_concrete_03',
 'surface-wood-planks-grey':'wood_planks_grey'
};
// Bytes GPU ESTIMADOS por material (3 mapas RGBA8 con mipmaps): no es una medida del driver.
export const V2_GPU_BYTES={hero:3*Math.ceil(1024*1024*4*4/3),balanced:3*Math.ceil(512*512*4*4/3)};
export const v2Recipe=freeze({
 version:2,target:'existing-exterior-wall-finish',roles:['HERO'],enabled:false,
 presets:V2_PRESETS,materials:V2_MATERIALS,
 profiles:{editor:'hero',presentation:'hero',walk:'balanced',capture:'hero',mobile:'balanced'},
 normalStrength:.65,maxAnisotropy:8,
 // Presupuesto de sesión (estimado): escritorio ≈ 2 materiales HERO + 2 equilibrados; móvil sólo equilibrados.
 renderBudget:{instances:256,geometries:256,materials:6,textures:18,gpuBytes:{hero:42000000,balanced:17000000}},
 provenance:{author:'Rubik',method:'Método F03 V1 (área, normales unitarias, rugosidad lineal, UV métrica) + escala física de la fuente + calibración contra el mismo activo del catálogo',externalAssets:Object.keys(V2_MATERIALS)},
 visualGate:'VISUAL_PENDING_HUMAN',authority:'VISUAL_ONLY'
});
const V2_KEYS=['projectId','familyId','recipeId','recipeVersion','enabled','role','mode','profile'];
/** Decisión V2: sin material único; el material sale del acabado asignado a cada muro. */
export function resolveFacadeV2(input={}){
 if(!plain(input))throw Error('Facade decision must be an object');
 for(const key of Object.keys(input))if(!V2_KEYS.includes(key))throw Error('Unknown facade key: '+key);
 const {projectId=null,familyId='F03',recipeId='facade-material',recipeVersion=2,enabled=false,role='HERO',mode='editor',profile}=input;
 if(familyId!=='F03'||recipeId!=='facade-material'||recipeVersion!==2)throw Error('Unsupported facade recipe/version');
 if(typeof enabled!=='boolean'||!v2Recipe.roles.includes(role)||!Object.hasOwn(v2Recipe.profiles,mode))throw Error('Invalid facade enabled/role/mode');
 if(enabled&&(typeof projectId!=='string'||!projectId||projectId.length>160))throw Error('Explicit source Project ID required');
 const selected=profile??v2Recipe.profiles[mode];if(!['hero','balanced'].includes(selected))throw Error('Unknown facade profile');
 return freeze({projectId,familyId,recipeId,recipeVersion,enabled,role,mode,profile:selected,target:v2Recipe.target,authority:v2Recipe.authority,visualGate:v2Recipe.visualGate});
}
/** Elegibilidad V2 muro a muro. Motivos estables para la interfaz y las pruebas. */
export function facadeEligibilityV2(source,decision){
 const reject=reason=>({eligible:false,reason,materialId:null,preset:source.preset||null});
 if(decision.recipeVersion!==2)return reject('unsupported-recipe');
 if(source.projectId!==decision.projectId)return reject('project-mismatch');
 if(source.exterior!=='facade')return reject(source.exterior==='interior'?'interior-wall':'exterior-unavailable');
 if(source.reserved)return reject('f02-owned-surface');
 if(!source.materialId)return reject('material-unassigned');
 if(source.category!=='wall')return reject('material-category-excluded');
 const materialId=Object.hasOwn(V2_PRESETS,source.preset)?V2_PRESETS[source.preset]:null;
 if(!materialId)return reject('material-no-facade-source');
 return {eligible:true,reason:null,materialId,preset:source.preset};
}
/** Plan de presupuesto (puro): el material con más superficie de fachada recibe la mejor resolución que quepa; el resto
 *  baja a equilibrado y, si ni así cabe, se conserva su acabado base ('budget'). Nunca supera el presupuesto. */
export function planFacadeBudget(groups,profile,budget=v2Recipe.renderBudget){
 if(!Array.isArray(groups))throw Error('Facade groups must be an array');
 const cap=budget.gpuBytes[profile==='hero'?'hero':'balanced'],order=[...groups].sort((a,b)=>b.areaM2-a.areaM2||a.materialId.localeCompare(b.materialId));
 let used=0;const plan=[];
 for(const g of order){
  const tiers=profile==='hero'?['hero','balanced']:['balanced'];let chosen=null;
  if(plan.filter(p=>p.profile).length<budget.materials)for(const t of tiers)if(used+V2_GPU_BYTES[t]<=cap){chosen=t;break;}
  if(chosen)used+=V2_GPU_BYTES[chosen];
  plan.push({materialId:g.materialId,areaM2:g.areaM2,walls:g.walls,profile:chosen,gpuBytes:chosen?V2_GPU_BYTES[chosen]:0,reason:chosen?null:'budget'});
 }
 return freeze({cap,used,plan});
}