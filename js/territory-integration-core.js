/* One pure chain: source CRS -> parcel-local mm -> explicit placement -> model mm. */
(function(root){
 'use strict';
 const EPS=Object.freeze({mm:0.001,m:0.000001});
 const clone=v=>JSON.parse(JSON.stringify(v));
 const fail=m=>{throw new TypeError('Territory placement: '+m);};
 const point=p=>p&&Number.isFinite(p.x)&&Number.isFinite(p.y)&&Object.keys(p).every(k=>['x','y'].includes(k));
 function validate(site){const p=site?.buildingPlacement;if(p===undefined)return;
  if(!site.parcel||!Number.isFinite(site.northOffsetDeg)||site.northOffsetDeg<0||site.northOffsetDeg>=360)fail('requires parcel and configured north');
  if(!p||Object.keys(p).some(k=>!['horizontal','vertical'].includes(k))||!p.horizontal)fail('horizontal required');
  const h=p.horizontal;if(Object.keys(h).some(k=>!['modelAnchorMm','parcelLocalAnchorMm','source'].includes(k))||!point(h.modelAnchorMm)||!point(h.parcelLocalAnchorMm)||h.source?.type!=='user-entered'||Object.keys(h.source).some(k=>k!=='type'))fail('invalid horizontal');
  if(p.vertical!==undefined){const v=p.vertical,s=v?.source;if(!v||Object.keys(v).some(k=>!['modelZeroElevationM','verticalReference','source'].includes(k))||!Number.isFinite(v.modelZeroElevationM)||v.verticalReference!=='orthometric'||!s||!['user-entered','derived'].includes(s.type)||Object.keys(s).some(k=>!['type','derivedFrom','retrievedAt','sourceId'].includes(k)))fail('invalid vertical');if(s.type==='derived'&&(s.derivedFrom!=='site.terrain'||typeof s.sourceId!=='string'||!s.sourceId||typeof s.retrievedAt!=='string'||!Number.isFinite(Date.parse(s.retrievedAt))))fail('terrain snapshot provenance required');}
 }
 function rotate(p,degrees){const t=degrees*Math.PI/180,c=Math.cos(t),s=Math.sin(t);return {x:c*p.x-s*p.y,y:s*p.x+c*p.y};}
 function transform(site,p,inverse){validate(site);if(!site?.buildingPlacement||!point(p))fail('placement and point required');const h=site.buildingPlacement.horizontal,a=inverse?h.parcelLocalAnchorMm:h.modelAnchorMm,b=inverse?h.modelAnchorMm:h.parcelLocalAnchorMm,r=rotate({x:p.x-a.x,y:p.y-a.y},(inverse?1:-1)*site.northOffsetDeg);return {x:b.x+r.x,y:b.y+r.y};}
 const modelToParcel=(site,p)=>transform(site,p,false),parcelToModel=(site,p)=>transform(site,p,true);
 const sourceToLocal=(frame,x,y)=>({x:(x-frame.originX)*1000,y:(frame.originY-y)*1000});
 const localToSource=(frame,p)=>({x:frame.originX+p.x/1000,y:frame.originY-p.y/1000});
 function elevationToModel(site,elevationM){validate(site);if(!site.buildingPlacement?.vertical||!Number.isFinite(elevationM))fail('vertical placement required');return elevationM-site.buildingPlacement.vertical.modelZeroElevationM;}
 function rebaseForLevel(site,level){if(!site?.buildingPlacement)return clone(site);const out=clone(site),p=out.buildingPlacement;p.horizontal.modelAnchorMm.x-=level.offsetMm.x;p.horizontal.modelAnchorMm.y-=level.offsetMm.y;if(p.vertical)p.vertical.modelZeroElevationM+=level.elevationMm/1000;validate(out);return out;}
 function uv(extent,x,y){return {u:(x-extent.minX)/(extent.maxX-extent.minX),v:(extent.maxY-y)/(extent.maxY-extent.minY)};}
 const uvInside=p=>p.u>=0&&p.u<=1&&p.v>=0&&p.v<=1;
 const api={EPS,validate,rotate,modelToParcel,parcelToModel,sourceToLocal,localToSource,elevationToModel,rebaseForLevel,uv,uvInside};
 if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanTerritoryIntegration=api;
})(globalThis);
