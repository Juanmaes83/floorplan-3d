'use strict';
// AST-01 · la acción «levels» de la guía: existe en tres idiomas, se ofrece sin buscar, la búsqueda la encuentra en
// es/en/zh, «planta» decorativa no se confunde con una planta del edificio y la guía no genera nada.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const G=require('../js/guide-core.js'),ids=q=>G.resolve(q).map(a=>a.id+(a.targetType?':'+a.targetType:'')+(a.ambiguous?'?':''));
test('AST-01: tarjeta «Añadir una planta» en la guía, ligada a la capacidad building',()=>{
 const a=G.actions.levels;assert.equal(a.capability,'building');for(const k of ['title','description','next'])assert.equal(a[k].length,3,k+' en es/en/zh');
 assert.equal(a.title[0],'Añadir una planta');assert.match(a.description[0],/se conserva sin cambios/);
 assert.equal(G.resolve('').map(x=>x.id).indexOf('levels'),2,'se ofrece sin buscar, tras subir plano y crear desde cero');
});
test('AST-01: búsqueda en tres idiomas y sin confundir la planta decorativa',()=>{
 for(const q of ['edificio','nivel','segunda planta','planta baja y primera planta','duplex','escalera','add a level','levels','building','楼层','楼梯'])assert.deepEqual(ids(q),['levels'],q);
 assert.deepEqual(ids('añadir planta'),['levels?','furniture:plant?'],'ambigua: dos opciones, nada se adivina');
 for(const q of ['poner una planta','añadir una planta decorativa','add a plant'])assert.deepEqual(ids(q),['furniture:plant'],q);
 assert.deepEqual(ids('cambiar la altura del muro'),['walls'],'la altura de un muro no son plantas');
 assert.deepEqual(ids('subir el plano de mi piso'),['upload']);
});
test('AST-01: la guía orienta y no genera; reutiliza building-ui sin duplicarlo',()=>{
 const ui=fs.readFileSync(path.join(__dirname,'..','js','guide-ui.js'),'utf8');
 const fn=ui.slice(ui.indexOf('function openLevels'),ui.indexOf('function openSearch'));
 assert.match(fn,/window\.FloorPlanBuildingUI\.open\(\)/,'abre el panel existente');
 assert.doesNotMatch(fn,/addLevel|createBuilding|addEmpty|library\./,'no crea plantas ni edificios por su cuenta');
 assert.match(ui,/byId\?\.\('building'\)/,'consulta el registro único de capacidades');
});
