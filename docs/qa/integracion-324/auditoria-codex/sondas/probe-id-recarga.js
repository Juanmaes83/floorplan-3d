async page => {
 const id=()=>page.evaluate(()=>({id:window.FloorPlanApp?.project?.id,name:window.FloorPlanApp?.project?.name}));
 await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 const a=await id(); await page.waitForTimeout(2500);
 await page.reload();await page.waitForTimeout(4000);
 const ready=await page.evaluate(()=>document.documentElement.dataset.editorReady);
 const b=await id();
 let c=null; if(await page.locator('#welcomeExample').isVisible().catch(()=>false)){await page.locator('#welcomeExample').click();await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');c=await id();}
 const ls=await page.evaluate(()=>Object.keys(localStorage).filter(k=>/project|rubik/i.test(k)));
 return {first:a,afterReload:b,readyAfterReload:ready,exampleAgain:c,ls};
}
