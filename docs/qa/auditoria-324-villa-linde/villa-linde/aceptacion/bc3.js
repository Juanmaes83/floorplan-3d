async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Presupuestar',exact:true}).click();
 await page.locator('#professionalWorkspace [data-route="reference-prices"]').first().click();
 const d=page.locator('#pricesDialog[open]');
 const item=d.locator('#pricesItems [data-item="floor:mat_wood"]');
 await item.click();
 const initial=await item.innerText();
 const managed=await d.locator('#pricesManaged').getAttribute('data-enabled');
 await d.locator('#pricesBc3').setInputFiles(out+'tarifa-sintetica.bc3');
 await d.locator('[data-col]').selectOption({index:1});
 async function search(code){
  await d.locator('#pricesQuery').fill(code);
  await d.getByRole('button',{name:'Buscar',exact:true}).click();
  await d.locator('#pricesSearchStatus').filter({hasText:/referencia/}).waitFor();
 }
 await search('MORTERO');
 const filtered=(await d.locator('#pricesResults [data-quote]').count())===0;
 await search('PAV-ROBLE');
 await d.locator('#pricesResults [data-quote="PAV-ROBLE"]').click();
 const unchangedOnQuote=(await item.innerText())===initial;
 await d.getByRole('button',{name:'Procedencia y decisión',exact:true}).click();
 await d.locator('#pricesAsPrice').click();
 const unchangedBeforeConfirm=(await item.innerText())===initial;
 await d.locator('#pricesConfirm').click();
 await d.locator('#pricesStatus').filter({hasText:'Cambio aplicado'}).waitFor();
 await page.screenshot({path:out+'BC3-precio-confirmado.png'});
 return {managed,initial,filtered,unchangedOnQuote,unchangedBeforeConfirm,after:await item.innerText()};
}

