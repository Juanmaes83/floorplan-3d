/* «Del plano a la vivienda» (result 2, docs/product/professional-client-experience-2026-10-21.md): what came from
   the plan, what was drawn or adjusted in Rubik and what the presentation will show, read only from fields the
   project already stores (`source.method`/`source.review` of walls, openings and rooms; `scale`; `sourceImages`;
   `objects`; `materials`). It never infers an origin that is not recorded and never changes the project. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanProvenance=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const KINDS=['walls','openings','rooms'],METHODS=['imported','manual','suggested','template'];
 function count(list){
  const by={imported:0,manual:0,suggested:0,template:0,unrecorded:0},reviewed={confirmed:0,unreviewed:0};
  for(const e of list||[]){const m=e?.source?.method;if(METHODS.includes(m))by[m]++;else by.unrecorded++;if(e?.source?.review==='confirmed')reviewed.confirmed++;else if(e?.source)reviewed.unreviewed++;}
  return {total:(list||[]).length,by,reviewed};
 }
 // One level (a project). `options.levelName` labels a level of a building.
 function summarize(project,options={}){
  if(!project||typeof project!=='object')throw Error('Proyecto no válido');
  const scale=project.scale||{},cal=scale.calibration;
  const images=(project.sourceImages||[]).map(i=>({mediaType:i.mediaType,widthPx:i.widthPx,heightPx:i.heightPx}));
  const elements={};for(const k of KINDS)elements[k]=count(project[k]);
  const fromPlan=KINDS.reduce((n,k)=>n+elements[k].by.imported,0),drawn=KINDS.reduce((n,k)=>n+elements[k].by.manual,0),suggested=KINDS.reduce((n,k)=>n+elements[k].by.suggested,0);
  const floors=new Set((project.rooms||[]).map(r=>r.floorMaterialId).filter(Boolean));
  return {
   levelName:options.levelName||null,
   source:images.length?'image':fromPlan?'imported':KINDS.some(k=>elements[k].by.template)?'template':'none',images,
   scale:{confidence:scale.confidence||'pending',method:scale.method||'none',knownLengthMm:cal?.knownLengthMm??null},
   elements,fromPlan,drawn,suggested,
   unreviewed:KINDS.reduce((n,k)=>n+elements[k].reviewed.unreviewed,0),
   furniture:(project.objects||[]).length,floorFinishes:floors.size
  };
 }
 const fmt=n=>Number(n).toLocaleString('es-ES');
 const T={
  title:['Del plano a la vivienda','From plan to home','从平面图到住宅'],
  sourceImage:['Partimos de una imagen del plano','We start from an image of the plan','以平面图图片为起点'],
  sourceImported:['Partimos de un plano importado','We start from an imported plan','以导入的平面图为起点'],
  sourceTemplate:['Partimos de una plantilla de vivienda, no de un plano real','We start from a home template, not a real plan','以住宅模板为起点，而不是真实平面图'],
  sourceNone:['Sin plano de partida: la distribución se dibujó en Rubik','No source plan: the layout was drawn in Rubik','没有原始平面图：布局在 Rubik 中绘制'],
  scaleReal:mm=>[`Escala comprobada con una medida conocida de ${fmt(mm)} mm`,`Scale checked against a known length of ${fmt(mm)} mm`,`比例已用 ${fmt(mm)} 毫米的已知尺寸核对`],
  scaleEstimated:['Escala estimada, sin comprobar con una medida conocida','Estimated scale, not checked against a known length','比例为估算，未用已知尺寸核对'],
  scalePending:['Escala sin calibrar: las medidas no son reales','Uncalibrated scale: dimensions are not real','比例未校准：尺寸不真实'],
  fromPlan:n=>[`Elementos que vienen del plano importado: ${n}`,`${n} elements come from the imported plan`,`${n} 个元素来自导入的平面图`],
  drawn:n=>[`Muros, huecos o estancias dibujados en Rubik: ${n}`,`${n} walls, openings or rooms were drawn in Rubik`,`${n} 个墙体、门窗或房间在 Rubik 中绘制`],
  template:n=>[`Elementos de la plantilla: ${n}`,`${n} elements come from a template`,`${n} 个元素来自模板`],
  suggested:n=>[`Muros propuestos por la ayuda automática: ${n}`,`${n} walls proposed by the automatic assistance`,`${n} 面墙由自动辅助建议`],
  unreviewed:n=>[`Sin revisar por una persona: ${n}`,`${n} not reviewed by a person`,`${n} 个未经人工复核`],
  unrecorded:n=>[`Sin procedencia registrada (proyectos anteriores): ${n}`,`${n} with no recorded origin (earlier projects or example)`,`${n} 个未记录来源（旧项目或示例）`],
  added:(f,m)=>[`Propuesta de Rubik · muebles: ${f} · acabados de suelo: ${m}`,`Rubik proposal · furniture: ${f} · floor finishes: ${m}`,`Rubik 方案 · 家具：${f} · 地面材料：${m}`],
  experience:['Tu cliente verá esta misma vivienda en 3D: vista general y las estancias que elijas. Las medidas son orientativas.','Your client will see this same home in 3D: overview and the rooms you choose. Dimensions are indicative.','客户将在 3D 中看到同一住宅：总览和你选择的房间。尺寸仅供参考。']
 };
 // Plain lines for the interface, in order; `lang` is es/en/zh.
 function lines(summary,lang='es'){
  const i={es:0,en:1,zh:2}[lang]??0,pick=v=>v[i],out=[];
  out.push(pick(summary.source==='image'?T.sourceImage:summary.source==='imported'?T.sourceImported:summary.source==='template'?T.sourceTemplate:T.sourceNone));
  out.push(pick(summary.scale.confidence==='real'&&summary.scale.knownLengthMm?T.scaleReal(summary.scale.knownLengthMm):summary.scale.confidence==='pending'?T.scalePending:T.scaleEstimated));
  if(summary.fromPlan)out.push(pick(T.fromPlan(summary.fromPlan)));
  if(summary.drawn)out.push(pick(T.drawn(summary.drawn)));
  const template=KINDS.reduce((n,k)=>n+summary.elements[k].by.template,0);if(template)out.push(pick(T.template(template)));
  if(summary.suggested)out.push(pick(T.suggested(summary.suggested)));
  if(summary.unreviewed)out.push(pick(T.unreviewed(summary.unreviewed)));
  const unrecorded=KINDS.reduce((n,k)=>n+summary.elements[k].by.unrecorded,0);if(unrecorded)out.push(pick(T.unrecorded(unrecorded)));
  out.push(pick(T.added(summary.furniture,summary.floorFinishes)));
  return out;
 }
 return {summarize,lines,T};
});
