/* Reuses existing scene lights. Presentation values are re-applied by the renderer before this override. */
(function(root){
 'use strict';
 function apply({sun,hemi,renderer},result){
  if(result?.status!=='available-orientative')return false;
  const d=result.sceneDirection;
  sun.position.set(d.x*25,d.y*25,d.z*25);sun.target.position.set(0,0,0);
  sun.color.set(0xfff4df);sun.intensity=result.aboveHorizon?2.5:0;
  hemi.intensity=result.aboveHorizon?.7:.16;
  renderer.toneMappingExposure=1.05;
  return true;
 }
 root.FloorPlanSolarRenderer={apply};
})(globalThis);
