async page => {
 const level=await page.evaluate(()=>FloorPlanApp.levelContext?.levelName);
 if(level!=='Planta baja') throw new Error('Esperada Planta baja; vista: '+level);
 if(await page.locator('#budgetClose').isVisible()) await page.locator('#budgetClose').click();
 await page.getByRole('button',{name:'Entregar',exact:true}).click();
 await page.getByRole('button',{name:'Preparar dossier económico',exact:true}).click();
 const d=page.locator('#economicDossierDialog');
 await d.locator('#econVariantClient').click();
 const paper=d.locator('#economicDossierPaper');
 const summarize=async loc=>{const t=await loc.innerText();return t.split('\n').filter(s=>/28.125|Total|planta|no certif/i.test(s)).slice(0,16);};
 const screen=await summarize(paper);
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-d4-cliente.png'});
 await page.evaluate(()=>{const open=window.open;window.open=(...args)=>{const w=open.apply(window,args);if(w)w.print=()=>{};return w;};});
 const [print]=await Promise.all([page.context().waitForEvent('page'),d.locator('#econPrint').click()]);
 const printed=await summarize(print.locator('.econ-paper'));
 await print.locator('.econ-paper').screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/edificio-d4-impresion.png'});
 await print.close();
 return {level,screen,printed};
}
