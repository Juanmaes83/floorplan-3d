/* Coordinate-based interactions and snapshots must follow actual pane layout. */
module.exports=async function settleLayout(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 // Only animations of elements that are actually drawn: Firefox keeps the CSS animation of content inside a closed
 // <details> (e.g. .menu-pop) «running» at time 0 forever, because nothing renders it; Chromium does not create it.
 await page.waitForFunction(()=>document.querySelector('.app').getAnimations({subtree:true}).every(a=>a.playState!=='running'||!a.effect?.target?.getClientRects?.().length));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
};
