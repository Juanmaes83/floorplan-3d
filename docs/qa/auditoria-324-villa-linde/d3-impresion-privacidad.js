async page => {
 await page.goto('http://127.0.0.1:18765/#editor'); await page.reload();
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar dossier',exact:true}).click();
 await page.locator('#dossierStyle').selectOption('client');
 await page.locator('#dc-name').fill('Contacto Visible QA');
 await page.locator('[data-dc-flag="show:name"]').check();
 await page.locator('#dcNext').click();
 await page.locator('#dc-internal').fill('MARCADOR-PRIVADO-QA-324');
 await page.locator('#dc-note').fill('Nota Publica QA');
 await page.locator('#dcNext').click();
 const document=page.locator('#dossierDocument');
 const screen=await document.innerText();
 await page.evaluate(()=>{const open=window.open; window.open=(...args)=>{const w=open.apply(window,args); if(w)w.print=()=>{};return w;};});
 const [popup]=await Promise.all([page.context().waitForEvent('page'),page.locator('#dossierPrint').click()]);
 await popup.locator('#dossierDocument .dossier-for').waitFor();
 const printed=await popup.locator('#dossierDocument').innerText();
 const result=t=>({name:t.includes('Contacto Visible QA'),note:t.includes('Nota Publica QA'),privateNote:t.includes('MARCADOR-PRIVADO-QA-324'),area:t.match(/87,18\s*m²/)?.[0]||null});
 await popup.close();
 return {onScreen:result(screen),print:result(printed)};
}
