/* Legacy editor suites deliberately enter the full editor; welcome is covered by guide.browser. */
module.exports=async function enterFullEditor(page,{keepPalette=false}={}){
 await page.waitForFunction(()=>document.documentElement.dataset.editorReady==='true');
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 // UX-312 PERLA: la guía es un panel a demanda («Tareas del proyecto», V4); se abre como lo haría la persona.
 if(!(await page.locator('#guideDetails').isVisible())&&await page.locator('#perlaTasks').isVisible())await page.locator('#perlaTasks').click();
 if(await page.locator('#guideDetails').isVisible()){
  await page.locator('#guideDetails').click();await page.locator('#guideAllTools').click();
 }
 if(await page.evaluate(()=>matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right').classList.contains('open')))await page.locator('#tgPanel').click();
 // These suites edit furniture in the furnished example, which on master opened the palette on «Amueblar». Since O6
 // (docs/product/journey-orientation-2026-10-21.md) the palette starts on «Construir» without a stored choice, so the
 // fixture is a person whose last choice was «Amueblar» (the choice is stored, as a click on the tab would).
 // Suites that test the initial tab itself (build-palette) pass {keepPalette:true}.
 if(!keepPalette)await page.evaluate(()=>window.FloorPlanBuildPalette?.select('furnish'));
 // Wait for the real pane transition and ResizeObserver before taking snapshots.
 await require('./layout-fixture.cjs')(page);
};
