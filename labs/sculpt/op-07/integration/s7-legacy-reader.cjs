'use strict';
/* OP-07 S7 · Un lector v1 (master SIN OP-07) ante un documento 2.0 escrito con la serie: lo rechaza al cargar y su editor
   no arranca sobre él, así que nunca lo sobrescribe como recto. Se ejecuta con el código de master tal cual (git show).
   Uso: node labs/sculpt/op-07/integration/s7-legacy-reader.cjs [ref-v1=origin/master] [ruta-serie=/home/user/op07v3] */
const {execFileSync}=require('node:child_process'),fs=require('node:fs'),os=require('node:os'),path=require('node:path'),assert=require('node:assert/strict');
const ref=process.argv[2]||'origin/master',serie=process.argv[3]||'/home/user/op07v3',repo=path.resolve(__dirname,'../../../..');
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'op07-v1-'));
for(const f of execFileSync('git',['-C',repo,'ls-tree','-r','--name-only',ref,'js/'],{encoding:'utf8'}).trim().split('\n').concat(['docs/contracts/FloorPlanProjectV1.schema.json'])){
 const out=path.join(tmp,f);fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,execFileSync('git',['-C',repo,'show',`${ref}:${f}`]));}
const V1=require(path.join(tmp,'js/project-core.js')),LibV1=require(path.join(tmp,'js/project-library.js'));
const V2=require(path.join(serie,'js/project-core.js')),F=require(path.join(serie,'tests/op07/fixtures.cjs'));
const {project}=F.curved(F.base());V2.validate(project);
const r=[];
assert.throws(()=>V1.validate(project));r.push('validate() v1 rechaza el 2.0');
const store=new Map([['rubik-sota-project-library-v1',JSON.stringify({version:1,activeId:'ent_a',entries:[{id:'ent_a',name:'Curvo',project}]})]]);
const storage={getItem:k=>store.has(k)?store.get(k):null,setItem:(k,v)=>store.set(k,v),removeItem:k=>store.delete(k)},before=store.get('rubik-sota-project-library-v1');
let threw=false;try{LibV1.load(storage,V1.initial());}catch{threw=true;}
assert.ok(threw,'la biblioteca v1 no carga una colección con un 2.0');r.push('FloorPlanLibrary.load v1 lanza: persistence-editor aborta el arranque («No se pudo leer el proyecto guardado»)');
assert.equal(store.get('rubik-sota-project-library-v1'),before);r.push('la colección guardada queda byte a byte igual');
const single=V1.load({getItem:()=>JSON.stringify(project),setItem(){throw Error('no debe escribir');}},'rubik-sota-floorplan-project-v1');
assert.equal(single.saved,false);r.push('Core.load v1 del proyecto suelto: saved=false, no escribe');
console.log(`Lector v1 = ${ref} (${execFileSync('git',['-C',repo,'rev-parse','--short',ref],{encoding:'utf8'}).trim()})\n- `+r.join('\n- '));
fs.rmSync(tmp,{recursive:true,force:true});
