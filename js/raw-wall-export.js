/* Explicit, local raw-session export. No DOM, storage, network or project model. */
(function(root){
 'use strict';
 // Anchor is the last commit changing the detector source, verified from Git.
 const DETECTOR=Object.freeze({commit:'9e35908e9206738a34c3b9ac1d8bad3d1b3b2b61',sourceSha256:'3a5cb242556dc2aa404b1182f8306ac0268de8a36a793d7afd20c85d31db19db'});
 function exact(value,keys){if(!value||typeof value!=='object'||Array.isArray(value)||Object.keys(value).sort().join(',')!==[...keys].sort().join(','))throw Error('Campos de exportación incompletos o no admitidos.');}
 const finite=value=>typeof value==='number'&&Number.isFinite(value);
 const opaque=(value,pattern)=>typeof value==='string'&&pattern.test(value);
 function freeze(value){if(value&&typeof value==='object'){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
 function validateSession(s){
  exact(s,['units','coordinate_frame','scale_applied','detector_commit','detector_source_sha256','predictions']);
  if(s.units!=='mm'||s.coordinate_frame!=='image-aligned-mm')throw Error('Falta unidad mm o marco alineado con la imagen.');
  if(s.detector_commit!==DETECTOR.commit||s.detector_source_sha256!==DETECTOR.sourceSha256)throw Error('La versión del detector no es verificable.');
  exact(s.scale_applied,['method','mm_per_pixel','confidence']);
  if(s.scale_applied.method!=='known-dimension'||!finite(s.scale_applied.mm_per_pixel)||s.scale_applied.mm_per_pixel<=0||s.scale_applied.mm_per_pixel>1000||!['estimated','real'].includes(s.scale_applied.confidence))throw Error('Falta una escala de calibración verificable.');
  if(!Array.isArray(s.predictions)||!s.predictions.length||s.predictions.length>40)throw Error('No hay sugerencias crudas exportables.');
  const ids=new Set();for(const segment of s.predictions){exact(segment,['id','start','end']);if(!opaque(segment.id,/^seg_[0-9]{3}$/)||ids.has(segment.id))throw Error('IDs anónimos de segmento inválidos.');ids.add(segment.id);
   for(const point of [segment.start,segment.end]){exact(point,['x','y']);if(!Object.values(point).every(v=>Number.isSafeInteger(v)&&Math.abs(v)<=1000000))throw Error('Coordenadas fuera del límite de ±1000000 mm.');}
   if(segment.start.x===segment.end.x&&segment.start.y===segment.end.y)throw Error('Una sugerencia queda sin longitud al redondear a mm.');
  }
 }
 function capture(raw,image,sampledWidth,sampledHeight,scale){
  const c=scale?.calibration;
  if(!image?.placement||!c||c.sourceImageId!==image.id||scale.method!=='known-dimension'||!['estimated','real'].includes(scale.confidence)||!finite(c.mmPerPixel)||c.mmPerPixel!==image.placement.mmPerPixel)throw Error('Calibra la imagen seleccionada antes de analizar para exportar; su escala debe coincidir con placement.');
  if(![image.widthPx,image.heightPx,sampledWidth,sampledHeight].every(v=>Number.isInteger(v)&&v>0)||Math.max(sampledWidth,sampledHeight)>512||Math.max(image.widthPx,image.heightPx)>8000)throw Error('Dimensiones de análisis no verificables.');
  if(!Array.isArray(raw)||!raw.length||raw.length>40)throw Error('No hay sugerencias crudas exportables.');
  const point=p=>{if(!p||!finite(p.x)||!finite(p.y)||p.x<0||p.x>sampledWidth||p.y<0||p.y>sampledHeight)throw Error('Extremos fuera del raster analizado.');return {x:Math.round(p.x*image.widthPx/sampledWidth*c.mmPerPixel),y:Math.round(p.y*image.heightPx/sampledHeight*c.mmPerPixel)};};
  const session={units:'mm',coordinate_frame:'image-aligned-mm',scale_applied:{method:'known-dimension',mm_per_pixel:c.mmPerPixel,confidence:scale.confidence},detector_commit:DETECTOR.commit,detector_source_sha256:DETECTOR.sourceSha256,predictions:raw.map((candidate,n)=>({id:`seg_${String(n).padStart(3,'0')}`,start:point(candidate.start),end:point(candidate.end)}))};
  validateSession(session);return freeze(session);
 }
 function build(session,metadata){
  validateSession(session);exact(metadata,['dataset_id','case_id','type','data_kind']);
  if(!opaque(metadata.dataset_id,/^eval_[0-9]{3}$/)||!opaque(metadata.case_id,/^case_[0-9]{3}$/)||!['digital','scan','photo'].includes(metadata.type)||!['synthetic','real'].includes(metadata.data_kind))throw Error('Completa IDs opacos eval_NNN/case_NNN, tipo de plano y origen de datos.');
  // Construct a whitelist only. Never serialize the source image, project or history.
  return {export_format:'rubik-sota.raw-wall-predictions',export_version:1,scale_applied:{...session.scale_applied},detector_source_sha256:session.detector_source_sha256,evaluation_record:{record_version:1,dataset_id:metadata.dataset_id,detector_commit:session.detector_commit,units:session.units,coordinate_frame:session.coordinate_frame,data_kind:metadata.data_kind,cases:[{id:metadata.case_id,type:metadata.type,analysis_status:'ok',reference_status:'missing',predictions:session.predictions.map(s=>({id:s.id,start:{...s.start},end:{...s.end}})),references:null}]}};
 }
 const api={DETECTOR,capture,build};if(typeof module==='object')module.exports=api;else root.FloorPlanRawWallExport=api;
})(globalThis);
