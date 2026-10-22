const {test}=require('node:test'),assert=require('node:assert/strict');
const D=require('../js/delivery-image.js');
const sq=(x,y,w,h)=>[[x,y],[x+w,y],[x+w,y+h],[x,y+h]];
test('the image says only what the project has: rooms, approximate surface, view; never a location',()=>{
 const c=D.content({title:'Piso Calle Luna',view:'Vista general',rooms:[{poly:sq(0,0,4000,3000)},{poly:sq(4000,0,3000,3000)},{poly:sq(0,3000,2000,2000),counted:false}]});
 assert.equal(c.title,'Piso Calle Luna');assert.equal(c.view,'Vista general');
 assert.deepEqual(c.facts,['2 estancias','Superficie útil aprox. 21 m²']);
 assert.equal(c.brand,null);assert.match(c.note,/Rubik Sota · medidas aproximadas/);
 assert.ok(!/ubicaci|direcci|calle mayor/i.test(JSON.stringify({...c,title:''})),'no location field');
});
test('missing data is omitted, not replaced by placeholders',()=>{
 const c=D.content({title:'  ',view:'',rooms:[]});
 assert.equal(c.title,null);assert.equal(c.view,null);assert.deepEqual(c.facts,[]);assert.equal(c.brand,null);
 const noName=D.content({title:'Casa',brand:{name:'  ',logo:'data:x'}});assert.equal(noName.brand,null,'a brand without a name is not shown');
});
test('brand and contact only when given; long texts are bounded; level joins the view',()=>{
 const long='Promoción Residencial Las Terrazas del Mediterráneo, bloque B, escalera 2, vivienda tipo C con terraza y vistas';
 const c=D.content({title:long,view:'Salón',level:'Planta 1',rooms:[{poly:sq(0,0,5000,4000)}],brand:{name:'Estudio Norte',logo:null,contact:''}});
 assert.ok(c.title.length<=90);assert.equal(c.view,'Planta 1 · Salón');assert.deepEqual(c.facts,['1 estancia','Superficie útil aprox. 20 m²']);
 assert.deepEqual(c.brand,{name:'Estudio Norte',logo:null,contact:null});assert.equal(c.note,'Imagen orientativa · medidas aproximadas');
 const withContact=D.content({title:'Casa',brand:{name:'Estudio Norte',contact:'600 000 000 · hola@norte.es'}});assert.equal(withContact.brand.contact,'600 000 000 · hola@norte.es');
});
test('control characters are cleaned and tiny areas are not reported',()=>{
 const c=D.content({title:'Casa\u0000\nNueva',rooms:[{poly:sq(0,0,500,500)}]});
 assert.equal(c.title,'Casa Nueva');assert.deepEqual(c.facts,['1 estancia']);
});
