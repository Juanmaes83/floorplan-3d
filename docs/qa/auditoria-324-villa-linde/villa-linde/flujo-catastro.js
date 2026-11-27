async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 const work='AUDIT_WORKSPACE/rubik-audit-villa-5a061725/';
 await page.keyboard.press('Escape');
 await page.getByRole('button',{name:'Analizar',exact:true}).click();
 await page.getByRole('button',{name:'Configurar emplazamiento',exact:true}).click();
 const d=page.locator('#territoryDialog[open]');
 const choice=d.locator('#territoryProvider');
 const options=await choice.locator('option').evaluateAll(o=>o.map(x=>({value:x.value,label:x.textContent})));
 const ref=options.find(o=>/referencia/i.test(o.label));
 const responses=[];
 await choice.selectOption(ref.value);
 page.on('response',r=>{if(/catastro/i.test(r.url()))responses.push(r.status())});
 await d.locator('#territoryLookupReference').fill('8899801YH1489H');
 await d.locator('#territoryLookup').click();
 await d.locator('#territoryLookup:enabled').waitFor({timeout:40000});
 const wfs={status:await d.locator('#territoryStatus').innerText(),card:await d.locator('#territoryCard').isVisible(),responses};
 await page.screenshot({path:out+'Catastro-WFS.png'});
 await choice.selectOption(options.find(o=>/INSPIRE CP/i.test(o.label)).value);
 await d.locator('#territoryFile').setInputFiles(work+'tests/fixtures/catastro-cp-synthetic.gml');
 await d.locator('#territoryImport').click();
 await d.locator('#territorySave:enabled').waitFor({timeout:10000});
 const gml={status:await d.locator('#territoryStatus').innerText(),card:await d.locator('#territoryCard').isVisible()};
 await page.screenshot({path:out+'Catastro-GML-sintetico.png'});
 return {options,wfs,gml};
}
