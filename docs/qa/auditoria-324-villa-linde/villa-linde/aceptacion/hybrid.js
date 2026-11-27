async page => {
 const path='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/aceptacion/';
 const report={};
 for(const tab of ['Analizar','Presupuestar']){
  await page.getByRole('button',{name:tab,exact:true}).first().click();
  report[tab]=(await page.locator('#professionalWorkspace').innerText()).split('\n').filter(l=>/m²|planta|coste|BC3|BCCA/i.test(l)).slice(0,22);
 }
 await page.getByRole('button',{name:'Diseñar',exact:true}).first().click();
 await page.locator('#presentationBtn').click();
 await page.locator('#presentationConfig[open]').waitFor();
 report.config=await page.locator('#presentationLevelNote').innerText();
 for(const group of await page.locator('.presentation-level-group').all()){
  const salones=group.getByText(/^Salón /);
  for(const salon of await salones.all()) await salon.click();
 }
 await page.locator('#presentationLivingDrawing').check();
 await page.screenshot({path:path+'03-hybrid-config.png'});
 await page.getByRole('button',{name:'Iniciar presentación'}).click();
 const story=()=>page.evaluate(()=>({kind:FloorPlanPresentation.story?.kind,level:FloorPlanBuildingUI.context?.levelId,live:View3D.presentationLivingDrawingInfo?.active,phase:View3D.presentationStoryInfo?.phase,rooms:View3D.presentationStoryInfo?.living?.rooms?.length,title:document.querySelector('.presentation-card h2')?.textContent}));
 try{
  await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing',null,{timeout:30000});
  report.start=await story();
  await page.screenshot({path:path+'04-hybrid-inicio.png'});
  await page.waitForFunction(()=>!FloorPlanPresentation.story||FloorPlanPresentation.story.p>0.33,null,{timeout:120000});
  report.mid=await story();
  await page.screenshot({path:path+'05-hybrid-transicion.png'});
  await page.waitForFunction(()=>!FloorPlanPresentation.story,null,{timeout:180000});
  report.end=await story();
  await page.screenshot({path:path+'06-hybrid-fin.png'});
  const upper=page.getByRole('button',{name:'Vista general · Planta primera',exact:true});
  await upper.click();
  await page.waitForFunction(()=>FloorPlanBuildingUI.context?.levelId==='lvl_linde-aprobada-p'&&document.querySelector('#presentationOverlay').dataset.moving==='false',null,{timeout:60000});
  report.upper=await story();
  await page.locator('#presentationLivingPlay').click({timeout:10000});
  await page.waitForFunction(()=>FloorPlanPresentation.story?.kind==='living-drawing');
  report.upperStart=await story();
  await page.waitForFunction(()=>!FloorPlanPresentation.story,null,{timeout:180000});
  report.upperEnd=await story();
  await page.screenshot({path:path+'07-planta-primera.png'});
 } catch(error){report.error=error.message;await page.screenshot({path:path+'error-hybrid.png'});}
 return report;
}

