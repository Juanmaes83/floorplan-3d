'use strict';
/* UX-07 + ENT-04 · laboratorio en navegador: elegir revisiones, comparar con el mismo encuadre (cortina y lado a lado),
   materiales, lo ilustrativo, dossier con presupuesto rotulado, descarga y verificación real de los archivos,
   biblioteca en solo lectura, archivos JSON y móvil. Datos sintéticos; sin peticiones externas. */
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),Core=require('../js/project-core.js');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'ux07-'));
const compare=async page=>{await page.getByRole('button',{name:'Comparar'}).click();await page.waitForSelector('#cmpCard:not([hidden])');};
const text=(page,sel,re)=>page.waitForFunction(([s,r])=>new RegExp(r,'s').test(document.querySelector(s).textContent),[sel,re.source]);
const srcdoc=page=>page.locator('#preview').getAttribute('srcdoc');
const build=async(page,value)=>{await page.selectOption('#budgetSel',value);await page.getByRole('button',{name:'Preparar dossier'}).click();await page.waitForSelector('#dosOut:not([hidden])');};

test('fixture: siete cambios reales, materiales declarados, mismo encuadre en cortina y lado a lado',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openLab(env);try{
    await compare(page);
    assert.equal(await page.locator('#changes li').count(),7);assert.match(await page.locator('#chgTitle').textContent(),/Cambios reales \(7\)/);
    assert.equal(await page.locator('#materials tbody tr').count(),2);assert.match(await page.locator('#materials').textContent(),/Baldosa 60×60.*Terrazo/s);
    assert.match(await page.locator('#illustrative').textContent(),/Color de los muros sin acabado declarado/);
    const vb=await page.$$eval('#curtain svg',s=>s.map(x=>x.getAttribute('viewBox')));assert.equal(vb.length,2);assert.equal(vb[0],vb[1],'mismo encuadre');
    // Cortina con teclado: el lado «después» se recorta según el control.
    await page.locator('#slider').focus();for(let i=0;i<10;i++)await page.keyboard.press('ArrowLeft');
    assert.equal(await page.locator('#layerAfter').evaluate(e=>e.style.clipPath),'inset(0px 0px 0px 40%)');
    assert.match(await page.locator('#slider').getAttribute('aria-valuetext'),/60 % de «Después»/);
    await page.getByRole('button',{name:'Lado a lado'}).click();assert.equal(await page.locator('#side').isVisible(),true);assert.equal(await page.locator('#curtain').isVisible(),false);
    const vb2=await page.$$eval('#side svg',s=>s.map(x=>x.getAttribute('viewBox')));assert.equal(vb2[0],vb2[1]);assert.equal(vb2[0],vb[0]);
    assert.equal(await page.locator('#sideAfter [data-id="opn_ux07-window"].add').count(),1);assert.equal(await page.locator('#sideBefore [data-id="obj_template-036"].del').count(),1);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('dossier: sin presupuesto no hay importes; completo, parcial y hecho sobre «antes» se rotulan como lo que son',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openLab(env);try{
    await compare(page);
    await build(page,'none');let h=await srcdoc(page);assert.ok(!h.includes('€'));assert.match(h,/no muestra importes/);assert.match(h,/Borrador interno · no enviado al cliente/);
    await build(page,'test-complete');h=await srcdoc(page);assert.match(h,/<h2>Presupuesto completo<\/h2>/);assert.match(h,/<th>Total<\/th>/);assert.match(await page.locator('#dosStatus').textContent(),/cantidades comprobadas/);
    await build(page,'test-partial');h=await srcdoc(page);assert.match(h,/<h2>Presupuesto parcial<\/h2>/);assert.match(h,/Importe conocido sin IVA/);assert.ok(!h.includes('<th>Total</th>'));
    await build(page,'test-before');assert.match(await page.locator('#dosStatus').textContent(),/NO coinciden/);
    // Nada de publicar ni enviar en la página.
    assert.equal(await page.getByRole('button',{name:/publicar|enviar|compartir/i}).count(),0);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('exportación verificable: descargar HTML y manifiesto, verificarlos y detectar una alteración',{timeout:120000},async()=>{
  const {context,page,watch}=await K.openLab(env);try{
    await compare(page);await build(page,'test-partial');
    await page.getByRole('button',{name:'Verificar ahora'}).click();await text(page,'#verifyOut',/Dossier verificado/);
    const [d1]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar HTML'}).click()]);
    const [d2]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar manifiesto'}).click()]);
    const hp=path.join(tmp,d1.suggestedFilename()),mp=path.join(tmp,d2.suggestedFilename());await d1.saveAs(hp);await d2.saveAs(mp);
    assert.match(d1.suggestedFilename(),/\.html$/);assert.match(d2.suggestedFilename(),/\.manifest\.json$/);
    const manifest=JSON.parse(fs.readFileSync(mp,'utf8'));assert.equal(manifest.publication,'none');assert.equal(manifest.budget.label,'Presupuesto parcial');
    await page.locator('details.verifyFiles summary').click();await page.setInputFiles('#vHtml',hp);await page.setInputFiles('#vManifest',mp);
    await page.getByRole('button',{name:'Verificar archivos'}).click();await text(page,'#verifyFilesOut',/Dossier verificado/);
    const bad=path.join(tmp,'alterado.html');fs.writeFileSync(bad,fs.readFileSync(hp,'utf8').replace('Presupuesto parcial','Presupuesto completo'));
    await page.setInputFiles('#vHtml',bad);await page.getByRole('button',{name:'Verificar archivos'}).click();
    await text(page,'#verifyFilesOut',/NO coincide/);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('biblioteca: variante enlazada se compara sola; proyectos sin relación exigen declararla; nada se escribe',{timeout:120000},async()=>{
  const before=F.before(),variant=F.after();variant.id='prj_ux07-variante';const other=Core.clone(before);other.id='prj_ux07-otro';
  const lib={version:1,activeId:'ent_a',entries:[{id:'ent_a',name:'Original',project:before},{id:'ent_b',name:'Reforma',variantOf:'ent_a',project:variant},{id:'ent_c',name:'Otro proyecto',project:other}]};
  const storage={'rubik-sota-project-library-v1':JSON.stringify(lib),'rubik-budget-v1':JSON.stringify({'prj_ux07-variante':(()=>{const b=F.budget('complete');b.subject.id='prj_ux07-variante';return b;})()})};
  const {context,page,watch}=await K.openLab(env,{storage});try{
    const snapshot=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
    await page.check('input[name=src][value=library]');await page.selectOption('#libBefore','ent_a');await page.selectOption('#libAfter','ent_b');await compare(page);
    assert.match(await page.locator('#relation').textContent(),/Original y variante/);assert.equal(await page.locator('#changes li').count(),7);
    // El presupuesto guardado es de la variante («después»): se ofrece.
    assert.ok(await page.locator('#budgetSel option[value=saved]').count());await build(page,'saved');assert.match(await srcdoc(page),/Presupuesto/);
    await page.selectOption('#libAfter','ent_c');await page.getByRole('button',{name:'Comparar'}).click();
    await text(page,'#srcError',/indica si uno es variante.*Marca la casilla/);
    await page.check('#declare');await compare(page);assert.match(await page.locator('#relation').textContent(),/declarados por ti/);
    assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))),snapshot,'la biblioteca no cambia');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

test('archivos JSON: dos revisiones del mismo proyecto; un archivo no válido se rechaza con un mensaje claro',{timeout:120000},async()=>{
  const a=path.join(tmp,'antes.json'),b=path.join(tmp,'despues.json'),bad=path.join(tmp,'malo.json');
  fs.writeFileSync(a,JSON.stringify(F.before()));fs.writeFileSync(b,JSON.stringify(F.after()));fs.writeFileSync(bad,'{"schema":"otra cosa"}');
  const {context,page,watch}=await K.openLab(env);try{
    await page.check('input[name=src][value=files]');await page.setInputFiles('#fileBefore',a);await page.setInputFiles('#fileAfter',b);await compare(page);
    assert.match(await page.locator('#relation').textContent(),/mismo proyecto/);assert.equal(await page.locator('#changes li').count(),7);
    await page.setInputFiles('#fileAfter',bad);await page.getByRole('button',{name:'Comparar'}).click();
    await text(page,'#srcError',/\S/);assert.equal(await page.locator('#cmpCard').isVisible(),false);
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});

for(const vp of [{width:390,height:844},{width:844,height:390}])test(`móvil ${vp.width}×${vp.height}: sin scroll horizontal, cortina táctil y dossier`,{timeout:120000},async()=>{
  const {context,page,watch}=await K.openLab(env,{viewport:vp,isMobile:true,hasTouch:true,deviceScaleFactor:2});try{
    await page.getByRole('button',{name:'Comparar'}).tap();await page.waitForSelector('#cmpCard:not([hidden])');
    const box=await page.locator('#slider').boundingBox();assert.ok(box.height>=44);
    assert.equal(await page.locator('#side').isVisible(),false,'en cortina no se ve «lado a lado»');
    await page.locator('#slider').fill('20');assert.equal(await page.locator('#layerAfter').evaluate(e=>e.style.clipPath),'inset(0px 0px 0px 20%)');
    await page.selectOption('#budgetSel','test-partial');await page.getByRole('button',{name:'Preparar dossier'}).tap();await page.waitForSelector('#dosOut:not([hidden])');
    assert.ok(await page.evaluate(()=>document.scrollingElement.scrollWidth<=innerWidth+1),'sin scroll horizontal');
    for(const b of await page.locator('button:visible').all()){const r=await b.boundingBox();assert.ok(r.height>=44,'botón ≥ 44 px');}
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});
