/* Point 8B-B: pure exterior reading of a FloorPlanRoof result. No source geometry is rebuilt or persisted. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FloorPlanExteriorVolumes=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const fail=(status,reason)=>({status,reason});
  const cross=(a,b)=>a.x*b.y-a.y*b.x;
  const sub=(a,b)=>({x:a.x-b.x,y:a.y-b.y});
  const dot=(a,b)=>a.x*b.x+a.y*b.y;
  function boundaryPortion(a,b,c,d,EPS){
    const u=sub(b,a),v=sub(d,c),length2=dot(u,u);
    if(length2<=EPS.lengthMm*EPS.lengthMm||Math.abs(cross(u,sub(c,a)))>EPS.crossMm2||Math.abs(cross(u,sub(d,a)))>EPS.crossMm2)return null;
    const t0=Math.max(0,Math.min(dot(sub(c,a),u)/length2,dot(sub(d,a),u)/length2));
    const t1=Math.min(1,Math.max(dot(sub(c,a),u)/length2,dot(sub(d,a),u)/length2));
    if((t1-t0)*Math.sqrt(length2)<=EPS.lengthMm)return null;
    return {start:{x:a.x+u.x*t0,y:a.y+u.y*t0},end:{x:a.x+u.x*t1,y:a.y+u.y*t1}};
  }
  function read(roof,configs,EPS){
    if(roof.status!=='available')return roof;
    const levels=roof.levels||[{levelId:null,polygon:roof.footprint.polygon,elevationMm:roof.footprint.topMm,offsetMm:{x:0,y:0}}];
    const volumes=[];
    for(const level of levels){
      const base=level.levelId===null?0:configs.find(c=>c.levelId===level.levelId)?.elevationMm;
      if(!Number.isFinite(base)||!Number.isFinite(level.elevationMm)||level.elevationMm-base<=EPS.heightMm)return fail('unavailable','unproven-volume-elevations');
      volumes.push({levelId:level.levelId,footprint:level.polygon,zBottomMm:base,zTopMm:level.elevationMm});
    }
    if(volumes.length===2&&volumes[1].zBottomMm<volumes[0].zTopMm-EPS.heightMm)return fail('unavailable','overlapping-level-heights');
    const parapets=[];
    for(const surface of roof.surfaces){
      const config=configs.find(c=>c.levelId===surface.levelId)?.parapet;
      if(!config||config.enabled===false)continue;
      if(config.enabled!==true||!Number.isSafeInteger(config.heightMm)||config.heightMm<100||config.heightMm>3000)return fail('invalid','invalid-parapet-height');
      const source=configs.find(c=>c.levelId===surface.levelId)?.project;
      if(config.materialId&&!source?.materials?.some(m=>m.id===config.materialId&&m.category==='wall'))return fail('invalid','invalid-parapet-material');
      const level=levels.find(l=>l.levelId===surface.levelId);
      if(!level)return fail('unavailable','missing-roof-level');
      for(let i=0;i<surface.polygon.length;i++){
        const a=surface.polygon[i],b=surface.polygon[(i+1)%surface.polygon.length];
        // The top roof has its complete outer boundary. For exposed lower cells, keep only
        // portions on the proven outer footprint; cell seams and upper-body edges are excluded.
        const portions=surface.kind==='top-roof'?[{start:a,end:b}]:level.polygon.flatMap((c,j)=>{
          const hit=boundaryPortion(a,b,c,level.polygon[(j+1)%level.polygon.length],EPS);
          return hit?[hit]:[];
        });
        for(const p of portions)parapets.push({levelId:surface.levelId,surfaceKind:surface.kind,start:p.start,end:p.end,zBottomMm:surface.elevationMm,zTopMm:surface.elevationMm+config.heightMm,heightMm:config.heightMm,materialId:config.materialId||null});
      }
    }
    return {status:'available',roof,volumes,parapets};
  }
  function deriveProject(project,Roof,Exterior){
    return fromProjectRoof(Roof.deriveProject(project,Exterior),project,Roof.EPS);
  }
  function deriveBuilding(building,Roof,Exterior,Building){
    return fromBuildingRoof(Roof.deriveBuilding(building,Exterior,Building),building,Roof.EPS);
  }
  function fromProjectRoof(roof,project,EPS){return read(roof,[{levelId:null,elevationMm:0,project,parapet:project.roofParapet}],EPS);}
  function fromBuildingRoof(roof,building,EPS){return read(roof,building.levels.map(l=>({levelId:l.id,elevationMm:l.elevationMm,project:l.project,parapet:l.project.roofParapet})),EPS);}
  return {deriveProject,deriveBuilding,fromProjectRoof,fromBuildingRoof};
});
