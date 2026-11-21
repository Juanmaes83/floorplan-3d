/* Coordinate-based interactions and snapshots must follow actual pane layout. */
module.exports=async function settleLayout(page){
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(()=>requestAnimationFrame(resolve))));
 await page.waitForFunction(()=>document.querySelector('.app').getAnimations({subtree:true}).every(animation=>{
  if(animation.playState!=='running')return true;
  const target=animation.effect?.target;
  const details=target?.closest('details:not([open])');
  // Gecko can retain a pending animation for the hidden body of a closed details.
  // Its visible summary and the rest of the editor must still settle.
  const summary=details?.querySelector(':scope > summary');
  return !!details&&target!==details&&!!summary&&!summary.contains(target);
 }));
 await page.evaluate(()=>new Promise(resolve=>requestAnimationFrame(resolve)));
};
