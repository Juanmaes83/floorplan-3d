'use strict';
/* ENT-04 fase 2 · laboratorio en navegador: presupuestos de las dos revisiones comparados (completa, parcial, no válida),
   dossier 1.1.0 verificado, presupuesto guardado único de un mismo proyecto (biblioteca en solo lectura) y móvil sin
   desbordar. Datos sintéticos y precios ficticios; ninguna petición externa. */
const test=require('node:test'),assert=require('node:assert/strict');
const K=require('./ux07/kit.cjs'),F=require('../labs/ux07-ent04/fixtures.js'),P=require('../js/budget-presentation.js');
let env;test.before(async()=>{env=await K.start();});test.after(async()=>{await env?.stop();});
// Espacios normalizados en los dos lados: Node y Chromium no usan el mismo espacio de no separación antes de «€».
const sp=t=>String(t).replace(/[\s\u00a0\u202f]+/g,' ');
const eur=v=>sp(new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v));
const prepare=async(page,after,before)=>{await page.selectOption('#budgetSel',after);await page.selectOption('#budgetBeforeSel',before);
  await page.getByRole('button',{name:'Preparar dossier'}).click();await page.waitForSelector('#dosOut:not([hidden])');};
const bc=page=>page.evaluate(()=>({status:document.getElementById('bcOut').dataset.status,hidden:document.getElementById('bcOut').hidden,summary:document.getElementById('bcSummary').textContent,
  rows:[...document.querySelectorAll('#bcTable tbody tr')].map(r=>({item:r.dataset.item,status:r.dataset.status,cells:[...r.cells].map(c=>c.textContent)})),notes:document.getElementById('bcNotes').textContent}));
const noHScroll=page=>page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1);

for(const [label,opts] of [['escritorio 1440×900',{}],['móvil 390×844',{viewport:{width:390,height:844},isMobile:true,hasTouch:true}]]){
  test(`${label}: completa, parcial y no válida; el dossier 1.1.0 se verifica con los dos presupuestos`,{timeout:180000},async()=>{
    const {context,page,watch}=await K.openLab(env,opts);try{
      await page.getByRole('button',{name:'Comparar'}).click();await page.waitForSelector('#dosCard:not([hidden])');
      // Completa: la diferencia es la de los dos informes C2 (calculada aquí con la autoridad existente, no con el laboratorio).
      await prepare(page,'test-complete','test-complete');let s=await bc(page);
      const nb=P.buildReport(F.budget('complete',F.before())).totals.net.amount,na=P.buildReport(F.budget('complete',F.after())).totals.net.amount;
      assert.equal(s.status,'complete');assert.ok(sp(s.summary).includes(eur(nb))&&sp(s.summary).includes(eur(na)),s.summary);
      assert.ok(sp(s.summary).includes('+'+eur(Math.round((na-nb)*100)/100)),s.summary);
      assert.deepEqual(s.rows.map(r=>r.item).sort(),['demolition','floor:mat_terrazzo','floor:mat_tile600','opening:window','paint','partition-new']);
      assert.ok(s.rows.every(r=>r.status==='exact'&&!/ninguno/.test(r.cells[5])),'cada partida cambiada depende de un cambio del proyecto');
      const frame=page.frameLocator('#preview');assert.match(await frame.locator('section.budget-compare').innerText(),/Comparación completa/);
      if(opts.isMobile){
        // Cada partida es una ficha: la diferencia y su dependencia caben en la pantalla (antes quedaban fuera, sin aviso).
        const out=await page.$$eval('#bcTable tbody td[data-label="Diferencia"],#bcTable tbody td[data-label="Depende de"]',t=>t.filter(x=>{const r=x.getBoundingClientRect();return r.right>window.innerWidth+1||r.width<1;}).length);
        assert.equal(out,0,'ninguna celda de diferencia fuera de la pantalla');
        // El dossier descargado, abierto solo en el móvil, no desborda.
        const html=await page.evaluate(()=>window.__ux07.dossier.html),p2=await context.newPage();await p2.setContent(html);
        assert.equal(await p2.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth+1),true,'el dossier descargado no desborda en 390 px');
        assert.equal(await p2.$$eval('table.lines td[data-label="Diferencia"]',t=>t.every(x=>x.getBoundingClientRect().right<=window.innerWidth+1)),true);await p2.close();}
      await page.getByRole('button',{name:'Verificar ahora'}).click();await page.waitForFunction(()=>/Dossier verificado/.test(document.getElementById('verifyOut').textContent));
      assert.match(await page.locator('#verifyOut').textContent(),/presupuesto de «antes» sin cambios/);
      assert.equal(await page.evaluate(()=>window.__ux07.dossier.manifest.version),'1.1.0');
      // Parcial: importes conocidos y partidas comparables; nunca un total.
      await prepare(page,'test-partial','test-complete');s=await bc(page);
      assert.equal(s.status,'partial');assert.match(s.summary,/No es la diferencia de coste total/);assert.doesNotMatch(s.summary,/Con IVA/);
      assert.deepEqual(s.rows.filter(r=>r.status==='partial').map(r=>r.item).sort(),['opening:window','paint']);
      assert.ok(s.rows.filter(r=>r.status==='partial').every(r=>/no comparable/.test(r.cells[4])&&/sin precio/.test(r.cells[3])));
      // No válida: el de «antes» está hecho sobre «después».
      await prepare(page,'test-complete','test-after');s=await bc(page);
      assert.equal(s.status,'incoherent');assert.match(s.summary,/no se calcula ninguna diferencia/);assert.deepEqual(s.rows,[]);
      assert.match(s.summary,/El presupuesto de «Antes» tiene las cantidades de «Después» \(\d+ diferencia\(s\)\)/,'dice cuál falla y por qué');
      assert.match(await frame.locator('section.budget-compare').innerText(),/Comparación no válida/);
      // Sin presupuesto de «antes»: no hay sección de comparación (dossier como en la fase 1).
      await prepare(page,'test-complete','none');assert.equal((await bc(page)).hidden,true);
      assert.equal(await frame.locator('section.budget-compare').count(),0);
      assert.equal(await noHScroll(page),true,'sin desplazamiento horizontal de la página');
      assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
    }finally{await context.close();}
  });
}

test('biblioteca (original y variante): cada presupuesto guardado es el de su proyecto; comparación parcial honesta; nada se escribe',{timeout:180000},async()=>{
  const before=F.before(),variant=F.after();variant.id='prj_ux07-variante';variant.name='Reforma (variante)';
  const lib={version:1,activeId:'ent_a',entries:[{id:'ent_a',name:'Original',project:before},{id:'ent_b',name:'Reforma',variantOf:'ent_a',project:variant}]};
  const storage={'rubik-sota-project-library-v1':JSON.stringify(lib),'rubik-budget-v1':JSON.stringify({[before.id]:F.budget('complete',before),[variant.id]:F.budget('partial',variant)})};
  const {context,page,watch}=await K.openLab(env,{storage});try{
    const snapshot=await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)]))));
    await page.check('input[name=src][value=library]');await page.selectOption('#libBefore','ent_a');await page.selectOption('#libAfter','ent_b');
    await page.getByRole('button',{name:'Comparar'}).click();await page.waitForSelector('#dosCard:not([hidden])');
    assert.match(await page.locator('#relation').textContent(),/Original y variante/);
    await prepare(page,'saved','saved');const s=await bc(page);
    assert.equal(s.status,'partial',s.summary);assert.match(s.summary,/No es la diferencia de coste total/);
    assert.deepEqual(s.rows.filter(r=>r.status==='partial').map(r=>r.item).sort(),['opening:window','paint']);
    await page.getByRole('button',{name:'Verificar ahora'}).click();await page.waitForFunction(()=>/Dossier verificado/.test(document.getElementById('verifyOut').textContent));
    assert.equal(await page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).map(k=>[k,localStorage.getItem(k)])))),snapshot,'la biblioteca y los presupuestos no cambian ni un byte');
    assert.deepEqual(watch.errors,[]);assert.deepEqual(watch.external,[]);
  }finally{await context.close();}
});
