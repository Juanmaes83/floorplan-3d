'use strict';
/* UX-07 + ENT-04 · núcleos puros de comparación antes/después y dossier, con las fixtures sintéticas. */
const test=require('node:test'),assert=require('node:assert/strict');
const F=require('../labs/ux07-ent04/fixtures.js'),R=require('../js/revision-compare-core.js'),D=require('../js/before-after-dossier-core.js'),Core=require('../js/project-core.js');
const pair=()=>{const before=F.before(),after=F.after();return {before,after,c:R.compare(before,after)};};
const NOW='2026-11-12T10:00:00.000Z';

test('compara dos revisiones del mismo proyecto: cada cambio conocido, con su evidencia, y nada más',()=>{
  const {c}=pair();assert.equal(c.relation,'same-project');assert.deepEqual(c.counts,{added:2,removed:1,modified:4,total:7});
  const key=c.changes.map(x=>`${x.entity}:${x.entityId}:${x.change}`).sort();
  assert.deepEqual(key,['object:obj_template-032:modified','object:obj_template-036:removed','opening:opn_ux07-window:added','room:rom_kitchen:modified','wall:wal_ref-w32:modified','wall:wal_ref-w34:modified','wall:wal_ux07-new:added'].sort());
  assert.ok(c.changes.every(x=>x.nature==='real'&&x.evidence==='project-data'));
  const sofa=c.changes.find(x=>x.entityId==='obj_template-032');assert.equal(sofa.fields[0].distanceMm,400);
  assert.equal(c.changes.find(x=>x.entityId==='wal_ref-w32').fields[0].after,'demolished');
  assert.deepEqual(c.metrics.delta,{netAreaM2:0,walls:1,openings:1,rooms:0,objects:-1});
  assert.equal(c.perspective.sharedFrame,true);assert.equal(c.perspective.viewBox.length,4);
});
test('materiales: solo los declarados por el proyecto, con nombre y color de su propia tabla',()=>{
  const {c}=pair();assert.equal(c.materials.length,2);
  const k=c.materials.find(m=>m.entityId==='rom_kitchen');assert.deepEqual([k.before.name,k.after.name],['Baldosa 60×60','Terrazo']);
  const w=c.materials.find(m=>m.entityId==='wal_ref-w34');assert.equal(w.before,null,'antes no había acabado declarado: no se inventa');assert.equal(w.after.name,'Pintura blanca mate');
});
test('lo ilustrativo se separa de lo real (muros sin acabado, colores de resaltado, aspecto de muebles)',()=>{
  const {c}=pair();const what=c.illustrative.map(i=>i.what);
  assert.ok(what.includes('Color de los muros sin acabado declarado'));assert.ok(what.includes('Colores de resaltado (verde, rojo, ámbar)'));
});
test('revisiones iguales: cero cambios y lo dice',()=>{const b=F.before();const c=R.compare(b,Core.clone(b));assert.equal(c.identical,true);assert.equal(c.counts.total,0);});
test('proyectos distintos: exige declarar la relación; «mismo proyecto» no se puede fingir',()=>{
  const b=F.before(),a=F.after();a.id='prj_otro-proyecto';
  assert.throws(()=>R.compare(b,a),{code:'relation-required'});
  assert.throws(()=>R.compare(b,a,{relation:'same-project'}),{code:'relation-invalid'});
  assert.throws(()=>R.compare(b,a,{relation:'cualquiera'}),{code:'relation-invalid'});
  const c=R.compare(b,a,{relation:'declared'});assert.equal(c.relation,'declared');assert.ok(c.limits.some(l=>/declara el profesional/.test(l)));
});
test('redibujar con otro identificador se ve como quitado + añadido, y el límite lo explica',()=>{
  const b=F.before(),a=Core.clone(b);const w=a.walls.find(x=>x.id==='wal_ref-w34');w.id='wal_redibujado';
  const c=R.compare(b,a);assert.deepEqual(c.changes.map(x=>x.change).sort(),['added','removed']);assert.ok(c.limits[0].includes('por identificador'));
});
test('un material que cambia de definición con el mismo ID es un cambio real; un ID sin definición se marca',()=>{
  const b=F.before(),a=Core.clone(b);a.materials.find(m=>m.id==='mat_wood').appearance.color='#000000';
  const c=R.compare(b,a);assert.equal(c.changes[0].entity,'material');
  const a2=Core.clone(b);a2.rooms[0].floorMaterialId='mat_no-existe';assert.throws(()=>R.compare(b,a2),'el contrato ya rechaza un material inexistente');
});
test('entradas no válidas se rechazan con el validador canónico',()=>{assert.throws(()=>R.compare({},F.after()));assert.throws(()=>R.compare(F.before(),null));});
test('planta SVG: mismo viewBox en las dos, rellenos con el color del material declarado y cambios resaltados',()=>{
  const {before,after,c}=pair();const sb=R.planSvg(c,'before',before),sa=R.planSvg(c,'after',after);
  const vb=s=>s.match(/viewBox="([^"]+)"/)[1];assert.equal(vb(sb),vb(sa));
  assert.match(sa,/data-id="rom_kitchen"[^>]*/);assert.ok(sa.includes('fill="#e6dfd3"'),'cocina con el color del terrazo');assert.ok(sb.includes('fill="#dfe3e1"'));
  assert.match(sa,/class="w st-new add" d="[^"]+" data-id="wal_ux07-new"/);assert.match(sa,/class="w st-demolished del" d="[^"]+" data-id="wal_ref-w32"/);assert.match(sb,/class="w st-existing mod" d="[^"]+" data-id="wal_ref-w32"/);
  assert.match(sa,/class="d k-window add" d="[^"]+" data-id="opn_ux07-window"/);assert.ok(!sb.includes('opn_ux07-window'));
  assert.match(sb,/class="o del" d="[^"]+" data-id="obj_template-036"/);assert.ok(!sa.includes('obj_template-036'));
  assert.ok(!/<script|https?:\/\/(?!www\.w3\.org)/.test(sa+sb));
});
test('dossier sin presupuesto: no muestra importes y lo dice',async()=>{
  const {before,after,c}=pair();const v=D.view(c,{beforeProject:before,afterProject:after,now:NOW});
  assert.equal(v.budget,null);assert.match(v.budgetAbsent,/no muestra importes/);
  const {html}=await D.exportDossier(v,{beforeProject:before,afterProject:after,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  assert.ok(!/€/.test(html),'ningún importe');assert.match(html,/Borrador interno · no enviado al cliente/);
});
test('presupuesto completo: rótulo «Presupuesto completo» con neto, IVA y total del informe C2 y cantidades que coinciden',()=>{
  const {before,after,c}=pair();const b=F.budget('complete');const v=D.view(c,{beforeProject:before,afterProject:after,budget:b,now:NOW});
  assert.equal(v.budget.label,'Presupuesto completo');assert.equal(v.budget.net.amount,15319.94);assert.ok(v.budget.gross.amount>v.budget.net.amount);
  assert.equal(v.budget.quantities,'match');assert.deepEqual(v.budget.priceSources,['Precio de prueba ficticio (laboratorio)']);
});
test('presupuesto parcial: rótulo «Presupuesto parcial», importe conocido y nunca un total',async()=>{
  const {before,after,c}=pair();const b=F.budget('partial');const v=D.view(c,{beforeProject:before,afterProject:after,budget:b,now:NOW});
  assert.equal(v.budget.label,'Presupuesto parcial');assert.equal(v.budget.unpriced,2);assert.equal(v.budget.gross,null);assert.equal(v.budget.tax,null);
  const {html}=await D.exportDossier(v,{beforeProject:before,afterProject:after,budget:b,comparison:c,beforeSvg:'<svg/>',afterSvg:'<svg/>'});
  assert.match(html,/Importe conocido sin IVA:.*No es el coste total/s);assert.ok(!/<th>Total<\/th>/.test(html));
});
test('presupuesto hecho sobre «antes»: se adjunta pero se avisa de que las cantidades no coinciden',()=>{
  const {before,after,c}=pair();const v=D.view(c,{beforeProject:before,afterProject:after,budget:F.budget('complete',before),now:NOW});
  assert.equal(v.budget.quantities,'differ');assert.ok(v.budget.quantityDifferences.length>0);
});
test('presupuesto de otro proyecto o vacío: no se adjunta',()=>{
  const {before,after,c}=pair();const other=F.budget('complete');other.subject={type:'project',id:'prj_ajeno'};
  assert.throws(()=>D.view(c,{beforeProject:before,afterProject:after,budget:other}),{code:'budget-subject-mismatch'});
  const empty=F.budget('complete');empty.items=[];empty.chapters=[];assert.throws(()=>D.view(c,{beforeProject:before,afterProject:after,budget:empty}),{code:'budget-empty'});
});
test('exportación verificable: el manifiesto comprueba HTML, revisiones y presupuesto; cualquier alteración se detecta',async()=>{
  const {before,after,c}=pair();const b=F.budget('partial');const v=D.view(c,{beforeProject:before,afterProject:after,budget:b,now:NOW});
  const out=await D.exportDossier(v,{beforeProject:before,afterProject:after,budget:b,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  assert.equal(out.manifest.publication,'none');assert.equal(out.manifest.budget.label,'Presupuesto parcial');
  let r=await D.verify(out.html,out.manifest,{beforeProject:before,afterProject:after,budget:b});assert.equal(r.ok,true,JSON.stringify(r.checks));
  r=await D.verify(out.html.replace('Presupuesto parcial','Presupuesto completo'),out.manifest);assert.equal(r.ok,false);
  r=await D.verify(out.html.replace('</main>','<script src="https://x.example/a.js"></script></main>'),out.manifest);assert.equal(r.checks.find(x=>x.name.startsWith('sin scripts')).ok,false);
  const changed=Core.clone(after);changed.name='otro';r=await D.verify(out.html,out.manifest,{afterProject:changed});assert.equal(r.ok,false);
  const priced=F.budget('complete');r=await D.verify(out.html,out.manifest,{budget:priced});assert.equal(r.ok,false);
  // Determinista: mismas entradas → mismo HTML y misma huella.
  const again=await D.exportDossier(D.view(c,{beforeProject:before,afterProject:after,budget:b,now:NOW}),{beforeProject:before,afterProject:after,budget:b,comparison:c,beforeSvg:R.planSvg(c,'before',before),afterSvg:R.planSvg(c,'after',after)});
  assert.equal(again.manifest.html.sha256,out.manifest.html.sha256);
});
test('el dossier escapa los nombres del proyecto (sin inyección de HTML)',async()=>{
  const b=F.before(),a=F.after();a.name='<img src=x onerror=alert(1)>';b.name=a.name;const c=R.compare(b,a);
  const v=D.view(c,{beforeProject:b,afterProject:a,now:NOW});const {html}=await D.exportDossier(v,{beforeProject:b,afterProject:a,comparison:c,beforeSvg:R.planSvg(c,'before',b),afterSvg:R.planSvg(c,'after',a)});
  assert.ok(!html.includes('<img src=x'));assert.ok(html.includes('&lt;img src=x'));
});
