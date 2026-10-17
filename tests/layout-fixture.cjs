/* Coordinate-based interactions and snapshots must follow actual pane layout. */
module.exports=async function settleLayout(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>document.querySelector('.app').getAnimations({subtree:true}).every(a=>a.playState!=='running'));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
};
