async page=>{
 const out='AUDIT_WORKSPACE/output/auditoria-324/villa-linde/';
 await page.locator('#presentationVideo').click({timeout:15000});
 const modes=await page.locator('#tourVideoMode input').evaluateAll(inputs=>inputs.map(i=>[i.value,!i.disabled]));
 const cine=modes.some(([name,enabled])=>name==='cine'&&enabled);
 const mode=cine?'cine':'paradas';
 if(modes.length) await page.locator('input[name="tourVideoMode"][value="'+mode+'"]').check();
 const brand=await page.evaluate(()=>FloorPlanBrandUI.snapshot());
 await page.screenshot({path:out+'P1-modo-video.png'});
 await page.locator('#tourVideoGo').click();
 try{
  const dl=page.locator('#tourVideoDownload');
  await dl.waitFor({timeout:180000});
  const [file]=await Promise.all([page.waitForEvent('download'),dl.click()]);
  await file.saveAs(out+'P1-'+file.suggestedFilename());
  return {modes,mode,brand:brand.profile?.name,hero:brand.hero,filename:file.suggestedFilename(),meta:await page.locator('#tourVideoMeta').innerText()};
 }catch(error){
  await page.screenshot({path:out+'P1-video-estado.png'});
  return {modes,mode,error:error.message,status:await page.locator('#tourVideoStatus').innerText()};
 }
}
