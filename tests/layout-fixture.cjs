/* Coordinate-based interactions and snapshots must follow actual pane layout. */
module.exports=async function settleLayout(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 // Only animations of elements that are actually drawn. Content of a closed <details> (e.g. .menu-pop, «fadeIn» .2s)
 // is not rendered: Firefox keeps its CSS animation «running» at time 0 forever and may still report a box for it
 // (#273), Chromium does not create it. Not drawn = disconnected, inside a closed <details> (other than its <summary>),
 // hidden for checkVisibility() (display:none, content-visibility:hidden, as ::details-content uses) or without a box.
 // Every other running animation is still waited for: the fixture never hides real motion.
 await page.waitForFunction(()=>{
  const drawn=t=>{if(!t?.isConnected)return false;
   for(let d=t.closest('details:not([open])');d;d=d.parentElement?.closest('details:not([open])')){const s=d.querySelector(':scope>summary');if(!(s&&s.contains(t)))return false;}
   if(typeof t.checkVisibility==='function'&&!t.checkVisibility())return false;
   return t.getClientRects().length>0;};
  return document.querySelector('.app').getAnimations({subtree:true}).every(a=>a.playState!=='running'||!drawn(a.effect?.target));});
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
};
