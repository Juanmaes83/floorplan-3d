/* Legacy editor suites deliberately enter the full editor; welcome is covered by guide.browser. */
module.exports=async function enterFullEditor(page){
 if(await page.locator('#welcomeDialog').evaluate(d=>d.open))await page.locator('#welcomeActionInput').press('Escape');
 await page.locator('#guideDetails').click();await page.locator('#guideAllTools').click();
 if(await page.evaluate(()=>matchMedia('(max-width:1100px)').matches&&document.querySelector('aside.right').classList.contains('open')))await page.locator('#tgPanel').click();
 // Wait for the real pane transition and ResizeObserver before taking snapshots.
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>document.querySelector('.app').getAnimations({subtree:true}).every(a=>a.playState!=='running'));
};
