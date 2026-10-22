const {test}=require('node:test'),assert=require('node:assert/strict');
const P=require('../js/provenance-core.js'),C=require('../js/project-core.js');

test('summarize counts only recorded origins and never changes the project',()=>{
 const p={scale:{confidence:'real',method:'known-dimension',calibration:{knownLengthMm:4200}},sourceImages:[{id:'img_a',mediaType:'image/png',widthPx:800,heightPx:600,originalFileName:'Calle Mayor 3.png'}],
  walls:[{source:{method:'imported',review:'unreviewed'}},{source:{method:'manual',review:'confirmed'}},{source:{method:'suggested',review:'confirmed'}}],
  openings:[{source:{method:'manual',review:'unreviewed'}},{}],rooms:[{floorMaterialId:'mat_a',source:{method:'imported',review:'confirmed'}},{floorMaterialId:'mat_a'}],objects:[{},{},{}],materials:[]};
 const before=JSON.stringify(p),s=P.summarize(p);assert.equal(JSON.stringify(p),before);
 assert.equal(s.source,'image');assert.equal(s.fromPlan,2);assert.equal(s.drawn,2);assert.equal(s.suggested,1);assert.equal(s.unreviewed,2);assert.equal(s.furniture,3);assert.equal(s.floorFinishes,1);
 assert.equal(s.elements.openings.by.unrecorded,1);assert.equal(s.elements.rooms.by.unrecorded,1);
 assert.ok(!JSON.stringify(s).includes('Calle Mayor'),'no file name (personal data, D-08)');
 const l=P.lines(s);
 assert.deepEqual(l,['Partimos de una imagen del plano','Escala comprobada con una medida conocida de 4200 mm','Elementos que vienen del plano importado: 2','Muros, huecos o estancias dibujados a mano en Rubik: 2','Muros propuestos por la ayuda automática: 1','Sin revisar por una persona: 2','Sin procedencia registrada (proyectos anteriores): 2','Muebles: 3 · acabados de suelo: 1. Rubik no registra quién los eligió (el profesional, la distribución automática o la plantilla)']);
 assert.equal(P.lines(s,'en')[0],'We start from an image of the plan');
});
test('no plan and pending scale are said plainly',()=>{
 const s=P.summarize({scale:{confidence:'pending',method:'none'},walls:[],openings:[],rooms:[],objects:[]});
 assert.deepEqual(P.lines(s).slice(0,2),['Sin plano de partida: la distribución se dibujó en Rubik','Escala sin calibrar: las medidas no son reales']);
 assert.throws(()=>P.summarize(null));
});
test('a template is named as a template, not as a plan',()=>{
 const s=P.summarize({scale:{confidence:'estimated',method:'template'},walls:[{source:{method:'template',review:'unreviewed'}}],openings:[],rooms:[],objects:[]});
 assert.equal(P.lines(s)[0],'Partimos de una plantilla de vivienda, no de un plano real');assert.equal(P.lines(s)[2],'Elementos de la plantilla: 1');
});
test('furniture and finishes are counted, never attributed to Rubik or to the professional',()=>{
 const l=P.lines(P.summarize({scale:{confidence:'pending',method:'none'},walls:[],openings:[],rooms:[{floorMaterialId:'m'}],objects:[{}]}));
 assert.ok(!l.some(x=>/Propuesta de Rubik|propuesta/i.test(x)));assert.match(l.at(-1),/no registra quién los eligió/);
});
