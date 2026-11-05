const freeze=o=>{Object.values(o).forEach(v=>{if(v&&typeof v==='object')freeze(v);});return Object.freeze(o);};
const facadeMaterialV1={
 version:1,target:'existing-exterior-wall-finish',roles:['HERO'],enabled:false,
 materials:['white_stucco','white_rough_plaster','rough_plaster_03'],defaultMaterial:'white_stucco',
 profiles:{editor:'balanced',presentation:'hero',walk:'balanced',capture:'hero',mobile:'balanced'},
 compatibility:{white_stucco:'surface-white-plaster-02',white_rough_plaster:'surface-white-plaster-02',rough_plaster_03:'surface-plastered-wall-03'},
 resources:['Rubik.MeshStandardMaterial','Rubik.WebGLTexture','Rubik.BufferGeometry'],
 provenance:{author:'Rubik',method:'PBR derivado de fuentes Poly Haven; adaptación visual modular',externalAssets:['white_stucco','white_rough_plaster','rough_plaster_03']},
 renderBudget:{instances:256,textures:3,materials:1,geometries:256,gpuBytes:14000000},
 visualGate:'VISUAL_PENDING_HUMAN',authority:'VISUAL_ONLY'
};
export const registry=freeze({F03:{label:'Materialidad de fachadas',recipes:{
 'facade-material':facadeMaterialV1,
 'facade-material-v2':{...facadeMaterialV1,version:2,renderBudget:{...facadeMaterialV1.renderBudget,gpuBytes:17000000},provenance:{...facadeMaterialV1.provenance,method:'F03 V1 preservado; cobertura compatible y presupuesto GPU efectivo'}}
}}});
export function facadeRecipe(decision){const recipe=registry[decision.familyId]?.recipes[decision.recipeId];return recipe?.version===decision.recipeVersion?recipe:null;}
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
