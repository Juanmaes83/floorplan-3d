// Phase B5: the «Envíanos tu plano» request. Validates contact and files, keeps only safe file names, never states a
// price, and writes the same request in the e-mail and in solicitud.txt.
const test=require('node:test'),assert=require('node:assert/strict');
const S=require('../js/plan-service-ui.js');
const file=(name,size=1000,type='application/pdf')=>({name,size,type});
const base={name:'Ana Pérez',email:'ana@example.com',phone:'600 000 000',city:'Valencia',needs:['plan','3d','hack'],notes:'Piso de 3 dormitorios',files:[file('plano planta.pdf'),file('../../etc/passwd',10,'')],date:new Date('2026-10-30T09:00:00Z')};
test('validates contact and files with plain messages',()=>{
 assert.throws(()=>S.request({...base,name:' '}),/Indica tu nombre/);
 assert.throws(()=>S.request({...base,email:'ana@'}),/email válido/);
 assert.throws(()=>S.request({...base,files:[]}),/al menos un plano/);
 assert.throws(()=>S.request({...base,files:Array.from({length:S.MAX_FILES+1},(_,i)=>file(i+'.pdf'))}),/Máximo 5 archivos/);
 assert.throws(()=>S.request({...base,files:[file('a.pdf',S.MAX_BYTES+1)]}),/el máximo es 20,0 MB/);
});
test('builds a safe request, text and e-mail link without price',()=>{
 const r=S.request(base);
 assert.equal(r.id,'20261030-ana-perez');assert.deepEqual(r.needs,['plan','3d']);assert.deepEqual(r.files.map(f=>f.name),['plano_planta.pdf','passwd']);
 const t=S.text(r);assert.match(t,/Referencia: 20261030-ana-perez[\s\S]*Email: ana@example.com[\s\S]*Necesito: Plano 2D editable, Vivienda en 3D[\s\S]*Archivos \(2\): plano_planta\.pdf/);
 assert.doesNotMatch(t,/€|precio/i);
 const m=S.mailto(r,'x.zip');assert.ok(m.startsWith('mailto:juanmaes83@gmail.com?subject='));assert.match(decodeURIComponent(m),/Adjunto el archivo x\.zip/);
});
