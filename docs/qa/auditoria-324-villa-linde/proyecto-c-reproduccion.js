async page => {
 const frame=page.frameLocator('#evolutionFrame');
 const iframe=await page.locator('#evolutionFrame').elementHandle();
 const f=await iframe.contentFrame();
 const view=frame.locator('#deliverSeeEvolution');
 if(await view.isVisible()) await view.click();
 await f.waitForFunction(()=>Boolean(window.__ft3dFidelity?.ctx));
 const before=await f.evaluate(()=>({pos:__ft3dFidelity.pos,date:__ft3dFidelity.last.date}));
 await frame.locator('#play').click();
 await f.waitForFunction(start=>__ft3dFidelity.pos>start+.1,before.pos);
 if(await f.evaluate(()=>__ft3dFidelity.playing)) await frame.locator('#play').click();
 const paused=await f.evaluate(()=>({pos:__ft3dFidelity.pos,date:__ft3dFidelity.last.date,playing:__ft3dFidelity.playing}));
 await frame.locator('#end').click();
 const end=await f.evaluate(()=>({date:__ft3dFidelity.last.date,tasks:__ft3dFidelity.ctx.canon.tasks.map(t=>t.title)}));
 await page.screenshot({path:'AUDIT_WORKSPACE/output/auditoria-324/proyecto-c-evolucion-final.png'});
 await page.locator('#evolutionBack').click();
 return {before,paused,end,returnToDeliver:await page.getByRole('heading',{name:'Entregar al cliente'}).isVisible(),sameBuilding:await page.evaluate(()=>FloorPlanApp.levelContext.buildingName)};
}
