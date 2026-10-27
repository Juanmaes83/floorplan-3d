/* Reuses existing scene lights. Presentation values are re-applied by the renderer before this override. */
(function(root){
 'use strict';
 function apply({sun,hemi,renderer,lamps,materials,ground,scene},result){
  if(result?.status!=='available-orientative')return false;
  const d=result.sceneDirection;
  sun.position.set(d.x*25,d.y*25,d.z*25);sun.target.position.set(0,0,0);
  sun.color.set(0xfff4df);sun.intensity=result.aboveHorizon?2.5:0;
  hemi.intensity=result.aboveHorizon?.7:.16;
  renderer.toneMappingExposure=1.05;
  // Solar is independent of the retained artistic night toggle; applyLight restores these values on exit.
  for(const group of lamps)for(const item of group.children){if(item.isPointLight)item.intensity=0;else item.material.emissiveIntensity=result.aboveHorizon?.3:0;}
  materials.forEach(material=>{if(material.userData.env)material.envMapIntensity=material.userData.env*(result.aboveHorizon?.75:.08);});
  ground.material.emissiveIntensity=0;
  if(!result.aboveHorizon)scene.background.set(0x313a44);
  return true;
 }
 root.FloorPlanSolarRenderer={apply};
})(globalThis);
