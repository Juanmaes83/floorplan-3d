'use strict';
// OP-07 · S1 Contrato: dos campos en el muro canónico (curve, heightEndMm) solo en documentos 2.x (D-OP07-4, opción B),
// con una autoridad única de versiones; validados por el
// núcleo geométrico único; proyectos antiguos idénticos; guardado protegido frente a lectores y escritores antiguos.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const Core=require('../js/project-core.js'),Building=require('../js/building-core.js'),Walls=require('../js/wall-geometry-core.js');
const F=require('./op07/fixtures.cjs'),root=path.resolve(__dirname,'..');
const rejects=(p,re)=>assert.throws(()=>Core.validate(p),re);

test('S1 · proyectos antiguos: sin los campos nuevos todo valida y migra exactamente igual que antes',()=>{
 const p=Core.clone(Core.initial());assert.equal(Core.validate(p).warnings.length>=0,true);
 assert.deepEqual(Core.featuresOf(p),[]);assert.ok(p.walls.every(w=>!Core.shapedWall(w)));
 for(const w of p.walls)assert.equal(Core.wallLength(w),Math.hypot(w.end.x-w.start.x,w.end.y-w.start.y),'longitud de un muro recto: la de siempre');
 // Todos los proyectos de prueba del repositorio con forma de FloorPlanProjectV1 siguen validando igual.
 const files=['tests/fixtures/smart-furnishing-demo.json','tests/fixtures/blender-asymmetric.synthetic.json'].filter(f=>fs.existsSync(path.join(root,f)));
 for(const f of files){const x=JSON.parse(fs.readFileSync(path.join(root,f),'utf8'));const doc=x.project||x;if(doc.schema!=='rubik-sota.floorplan-project')continue;Core.validate(doc);assert.deepEqual(Core.featuresOf(doc),[],f);}
 // Un guardado de un proyecto antiguo pasa la puerta incluso con un escritor que no conoce OP-07.
 assert.deepEqual(Core.guardSave(p,Core.clone(p),{writerFeatures:[]}),{ok:true,issues:[]});
});

test('S1 · contrato 2.0: curva y pendiente válidas en 2.x; en cualquier 1.x se rechazan',()=>{
 const {project:c}=F.curved(),{project:s}=F.sloped();Core.validate(c);Core.validate(s);
 assert.deepEqual(Core.featuresOf(c),['wall.curve']);assert.deepEqual(Core.featuresOf(s),['wall.heightEnd']);
 for(const p of [c,s])for(const v of ['1.0.0','1.12.0','1.13.0']){const old=F.clone(p);old.schemaVersion=v;rejects(old,/require project 2\.0\.0/);}
 // Esquema: campos cerrados, sin extras dentro de curve, heightEndMm con el mismo rango que heightMm.
 // Un 1.x posterior a 1.0.0 conserva campos desconocidos (contrato §3); el modo estricto (edificios) los rechaza.
 const bad=F.clone(c);bad.walls.find(w=>w.curve).curve.extra=1;assert.throws(()=>Core.validate(bad,{strict:true}),/unknown field/);
 const low=F.clone(s);low.walls.find(w=>w.heightEndMm).heightEndMm=50;rejects(low,/minimum 100/);
});

test('S1 · reglas de muro del núcleo único: curva demasiado cerrada, curva que se pliega y altura final',()=>{
 Core.validate(F.lone({control:{x:2000,y:1500}}));
 rejects(F.lone({control:{x:2000,y:30000},thicknessMm:1500}),/curve too tight for wall thickness/);
 rejects(F.lone({start:{x:0,y:0},end:{x:4000,y:0},control:{x:8000,y:0}}),/curve folds back|curve too tight/);
 Core.validate(F.lone({heightEndMm:1200}));
});

test('S1 · aberturas: longitud de trayectoria y altura del borde más bajo, sin recortes silenciosos',()=>{
 // Curva: una abertura más allá de la cuerda pero dentro de la trayectoria es válida.
 const p=F.lone({control:{x:2000,y:2000}}),w=p.walls[0],chord=4000,len=Core.wallLength(w);assert.ok(len>chord+300);
 p.openings=[{id:'opn_op07a',wallId:w.id,kind:'window',offsetMm:chord-200,widthMm:400,heightMm:1200,sillHeightMm:900}];Core.validate(p);
 p.openings[0].offsetMm=Math.ceil(len);rejects(p,/opening extends beyond wall/);
 // Pendiente: el hueco debe caber bajo el borde más bajo de los dos.
 const q=F.lone({heightMm:2800,heightEndMm:2000});q.openings=[{id:'opn_op07b',wallId:q.walls[0].id,kind:'door',offsetMm:3000,widthMm:900,heightMm:2100,sillHeightMm:0}];
 rejects(q,/opening exceeds wall height/);q.openings[0].offsetMm=200;Core.validate(q);
});

test('S1 · edificios: una planta 2.0.0 con muros curvos se valida en el contenedor estricto',()=>{
 assert.ok(Building.PROJECT_VERSIONS.includes('2.0.0')&&!Building.PROJECT_VERSIONS.includes('1.13.0'));
 const {project}=F.curved();Core.validate(project,{strict:true});
});

test('S1 · guardado protegido: lector o escritor antiguo, vista degradada y pérdidas sin intención',()=>{
 const {project:prev,wall}=F.curved(F.base(),{heightEndMm:2400});
 // Escritor que no conoce OP-07: no puede escribir un proyecto que usa sus campos.
 assert.deepEqual(Core.guardSave(prev,F.clone(prev),{writerFeatures:[]}).issues.map(i=>i.feature).sort(),['wall.curve','wall.heightEnd']);
 assert.equal(Core.guardSave(prev,F.clone(prev)).ok,true,'el escritor de este producto sí');
 // Lector antiguo: lo que vería (vista degradada) nunca se guarda.
 const view=Walls.legacyView(wall);assert.ok(view.loss.length===2);
 const degraded=F.clone(prev);degraded.walls=degraded.walls.map(w=>w.id===wall.id?view.wall:w);
 assert.ok(Core.guardSave(prev,degraded).issues.some(i=>i.code==='degraded-view'));
 // Y aunque la marca se pierda al serializar, la pérdida de curva y pendiente se detecta por contenido.
 const json=JSON.parse(JSON.stringify(degraded));const codes=Core.guardSave(prev,json).issues.map(i=>i.code);
 assert.ok(codes.includes('curve-lost')&&codes.includes('slope-lost'));
 // Una abertura no desaparece sin intención; con intención explícita, sí.
 const gone=F.clone(prev);const lost=gone.openings.find(o=>o.wallId===wall.id);gone.openings=gone.openings.filter(o=>o!==lost);
 assert.ok(Core.guardSave(prev,gone).issues.some(i=>i.code==='opening-lost'&&i.openingId===lost.id));
 assert.equal(Core.guardSave(prev,gone,{intent:{removedOpenings:[lost.id]}}).ok,true);
});

test('S1 · el núcleo promovido es el del laboratorio (sin un segundo motor geométrico)',()=>{
 // Huella del cuerpo del núcleo del laboratorio (labs/sculpt/op-07/wall-geometry-core.js @ f48614f2, 34 pruebas):
 // el promovido es el mismo código; solo cambian la cabecera y el nombre global.
 const prod=fs.readFileSync(path.join(root,'js/wall-geometry-core.js'),'utf8'),body=prod.slice(prod.indexOf('(function(root){'),prod.lastIndexOf('if(typeof module'));
 assert.equal(require('node:crypto').createHash('sha256').update(body).digest('hex'),'9ba8364840282ceaf2b479c0706d9386a58eb5ed234aa08ccc1ad358cd0791de');
 for(const f of ['index.html','comparar/index.html','evolucion/index.html']){const h=fs.readFileSync(path.join(root,f),'utf8');assert.ok(h.indexOf('wall-geometry-core.js')>0&&h.indexOf('wall-geometry-core.js')<h.indexOf('project-core.js'),f);}
 assert.equal(Core.WALL_PATH.toleranceMm,1,'tolerancia única propuesta (pendiente de decisión de producto)');
});

test('S1 · autoridad única de versiones: comparar y elevar sin bajar nunca y sin convertir un v1 en v2',()=>{
 const at=Core.versionAtLeast,up=(v,t)=>Core.raiseVersion({schemaVersion:v},t).schemaVersion;
 assert.equal(at('1.6.0','1.6.0'),true);assert.equal(at('1.5.3','1.6.0'),false);assert.equal(at('2.0.0','1.12.0'),true,'2.0 contiene todo 1.x hasta 1.12');
 assert.equal(at('2.0.0','1.13.0'),false);assert.equal(at('2.1.0','1.13.0'),true);assert.equal(at('1.12.0','2.0.0'),false,'un 1.x nunca alcanza 2');
 assert.equal(up('1.3.0','1.6.0'),'1.6.0');assert.equal(up('1.9.0','1.6.0'),'1.9.0','no baja');assert.equal(up('2.0.0','1.6.0'),'2.0.0','un 2.x no vuelve a 1');
 assert.equal(up('1.12.0','2.0.0'),'2.0.0');assert.equal(up('1.4.0','2.0.0'),'2.0.0');assert.equal(up('2.0.0','1.13.0'),'2.1.0','una mejora 1.13 futura es 2.1');
 assert.throws(()=>Core.raiseVersion({schemaVersion:'3.0.0'},'1.6.0'),/cannot raise/);assert.equal(Core.parseVersion('3.0.0'),null);
});

test('S1 · ningún v1 se migra: los escritores existentes mantienen la major 1 y conservan los datos',()=>{
 const p=Core.clone(Core.initial()),w=p.walls[0];
 const a=Core.declareWallStructure(p,w.id,'partition','professional'),b=Core.setRoofParapet(p,{enabled:false});
 for(const x of [a,b]){assert.match(x.schemaVersion,/^1\./);assert.deepEqual(Core.featuresOf(x),[]);}
 assert.deepEqual(Core.clone(Core.initial()),Core.initial(),'el ejemplo v1 no cambia');
});

test('S1 · una sola autoridad: ningún módulo eleva ni compara versiones de proyecto por su cuenta',()=>{
 const files=['index.html',...fs.readdirSync(path.join(root,'js')).filter(f=>f.endsWith('.js')).map(f=>'js/'+f)];
 // Solo se crean documentos nuevos en una versión fija (plantillas en blanco); building-core gestiona su propia versión.
 const creators=/blank\(|PROJECT_VERSIONS|building/;
 for(const f of files){const src=fs.readFileSync(path.join(root,f),'utf8');
  if(f==='js/building-core.js')continue;
  for(const line of src.split('\n')){
   assert.ok(!/schemaVersion\.split\(/.test(line),`${f}: compara la versión fuera de la autoridad: ${line.trim().slice(0,90)}`);
   if(/schemaVersion\s*=\s*'1\./.test(line))assert.ok(creators.test(line),`${f}: eleva la versión fuera de la autoridad: ${line.trim().slice(0,90)}`);}}
});
