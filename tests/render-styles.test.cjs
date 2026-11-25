// Render IA · catálogo canónico (js/render-styles.js) y dimensiones 2K/4K (js/render-resolution.js). Encargo 121ad35a §3.
'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const C=require('../js/render-styles.js'),R=require('../js/render-resolution.js'),api=require('../api/render.js');
test('un catálogo para Home, cliente y API; Nórdico y Escandinavo son una sola opción visible',()=>{
 assert.deepEqual(C.ids,['natural','warm','scandinavian','industrial','mediterranean','premium']);
 assert.deepEqual(Object.keys(api.STYLES),C.ids,'la API usa el mismo catálogo');
 assert.equal(C.STYLES.filter(s=>/Nórdico|Escandinavo/.test(s.es)).length,1);assert.equal(C.label('scandinavian'),'Nórdico');
 for(const s of C.STYLES)assert.doesNotMatch(s.prompt,/[áéíóúñ]/i,'texto al generador en inglés');});
test('compatibilidad: ids aceptados y alias de proyectos previos; rechaza los desconocidos',()=>{
 for(const id of ['natural','warm','scandinavian','premium'])assert.equal(C.canonical(id),id);
 for(const a of ['nordic','Nórdico','escandinavo'])assert.equal(C.canonical(a),'scandinavian');
 assert.equal(C.canonical('mediterráneo'),'mediterranean');
 for(const bad of ['cyberpunk','__proto__','constructor','',null,7])assert.equal(C.canonical(bad),null);});
test('2K/4K: 16:9 → 2560×1440 y 3840×2160; otras proporciones conservan el encuadre; nativo solo si ya tiene ese tamaño',()=>{
 assert.deepEqual(R.options(1920,1080).map(o=>[o.width,o.height,o.native]),[[2560,1440,false],[3840,2160,false]]);
 assert.deepEqual(R.options(1536,1024).map(o=>[o.width,o.height]),[[2560,1707],[3840,2560]]);
 assert.deepEqual(R.options(1024,1536).map(o=>[o.width,o.height]),[[1707,2560],[2560,3840]]);
 assert.deepEqual(R.options(3840,2160).map(o=>o.label),['2K nativo · 2560 × 1440','4K nativo · 3840 × 2160']);
 assert.equal(R.options(1536,1024)[1].label,'4K reescalado desde 1536 × 1024 · 3840 × 2560');});
