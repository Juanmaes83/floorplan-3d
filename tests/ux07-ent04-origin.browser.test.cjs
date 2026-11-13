'use strict';
/* UX-07 · auditoría del propietario (#212, 13/11/2026): al cambiar el origen de los proyectos (o lo elegido en él), la
   comparación y el dossier anteriores se retiran y nunca se atribuyen al origen nuevo hasta pulsar «Comparar» con él.
   Escenario de la auditoría: fixture comparada → «Dos archivos JSON» sin archivos → nada anterior a la vista; «Comparar» →
   error claro y sin dossier; volver a la fixture → resultado normal. También biblioteca y archivos. Datos sintéticos. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ux07-origin-'));
const view=page=>page.evaluate(()=>({cmp:!document.getElementById('cmpCard').hidden,dos:!document.getElementById('dosCard').hidden,state:{comparison:!!window.__ux07.comparison,dossier:!!window.__ux07.dossier,before:!!window.__ux07.before},
  visibleText:[...document.querySelectorAll('main section')].filter(s=>!s.hidden&&s.offsetParent).map(s=>s.innerText).join(' '),status:document.getElementById('srcStatus').textContent,error:document.getElementById('srcError').textContent,
  source:document.getElementById('cmpSource').textContent}));
const compare=page=>page.getByRole('button',{name:'Comparar'}).click();
const prepare=async page=>{await page.selectOption('#budgetSel','test-complete');await page.selectOption('#budgetBeforeSel','test-complete');await page.getByRole('button',{name:'Preparar dossier'}).click();await page.waitForSelector('#dosOut:not([hidden])');};
const retired=v=>!v.cmp&&!v.dos&&!v.state.comparison&&!v.state.dossier&&!v.state.before&&!/Vivienda de referencia/.test(v.visibleText);

for(const [label,opts] of [['escritorio',{}],['móvil 390×844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]])
test(`${label}: fixture → JSON sin archivos retira lo anterior; «Comparar» da error sin dossier; volver a la fixture funciona`,{timeout:180000},async()=>{
  const {context,page,watch}=await K.openLab(env,opts);try{
    await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');await prepare(page);
    let v=await view(page);assert.equal(v.source,'Origen: proyecto de prueba (sintético)');assert.ok(v.state.dossier);
    await page.check('input[name=src][value=files]');v=await view(page);
    assert.ok(retired(v),'nada de la fixture queda a la vista ni en el estado');assert.match(v.status,/Origen cambiado a dos archivos JSON.*se han retirado/);
    await compare(page);await page.waitForTimeout(300);v=await view(page);
    assert.match(v.error,/Elige los dos archivos/);assert.ok(retired(v),'tras el error no reaparece nada anterior');
    await page.check('input[name=src][value=fixture]');await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');v=await view(page);
    assert.equal(v.source,'Origen: proyecto de prueba (sintético)');assert.equal(await page.locator('#changes li').count(),7);assert.equal(v.state.dossier,false,'el dossier anterior no vuelve solo');
    assert.ok(await page.evaluate(W=>document.documentElement.scrollWidth<=W+1,opts.viewport?.width??1440),'sin desbordar');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('biblioteca: pasar de la fixture a la biblioteca retira lo anterior; cambiar una entrada elegida también',{timeout:180000},async()=>{
  const before=F.before(),variant=F.after();variant.id='prj_ux07-variante';
  const lib={version:1,activeId:'ent_a',entries:[{id:'ent_a',name:'Original',project:before},{id:'ent_b',name:'Reforma',variantOf:'ent_a',project:variant},{id:'ent_c',name:'Otra reforma',variantOf:'ent_a',project:{...F.after(),id:'prj_ux07-v2'}}]};
  const {context,page,watch}=await K.openLab(env,{storage:{'rubik-sota-project-library-v1':JSON.stringify(lib)}});try{
    await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');
    await page.check('input[name=src][value=library]');let v=await view(page);assert.ok(retired(v));assert.match(v.status,/biblioteca de este navegador/);
    await page.selectOption('#libBefore','ent_a');await page.selectOption('#libAfter','ent_b');await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');
    v=await view(page);assert.equal(v.source,'Origen: biblioteca de este navegador');assert.match(await page.locator('#relation').textContent(),/Original y variante/);
    await page.selectOption('#libAfter','ent_c');v=await view(page);assert.ok(!v.cmp&&!v.state.comparison,'cambiar la entrada elegida retira la comparación anterior');
    assert.match(v.status,/Has cambiado lo elegido en el origen/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});

test('archivos: comparar dos JSON y después cambiar uno de ellos retira la comparación anterior',{timeout:180000},async()=>{
  const a=path.join(tmp,'antes.json'),b=path.join(tmp,'despues.json');fs.writeFileSync(a,JSON.stringify(F.before()));fs.writeFileSync(b,JSON.stringify(F.after()));
  const {context,page,watch}=await K.openLab(env);try{
    await page.check('input[name=src][value=files]');await page.setInputFiles('#fileBefore',a);await page.setInputFiles('#fileAfter',b);
    await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');let v=await view(page);assert.equal(v.source,'Origen: dos archivos JSON');
    await page.setInputFiles('#fileAfter',a);v=await view(page);assert.ok(!v.cmp&&!v.state.comparison);
    // Con los archivos nuevos (el mismo JSON dos veces), «Comparar» crea SU comparación: revisiones iguales, nada de la anterior.
    await compare(page);await page.waitForSelector('#cmpCard:not([hidden])');v=await view(page);
    assert.equal(v.source,'Origen: dos archivos JSON');assert.match(await page.locator('#changes').innerText(),/Las dos revisiones son iguales/);
    assert.deepEqual(watch.errors,[]);
  }finally{await context.close();}
});
