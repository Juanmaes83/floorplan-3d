/* Static authorized catalog, never project/image data. No asset data in projects. */
(function(){
 // Own local catalogue (rubik-sota-local): bench + CAT-03 synthetic fixtures (separate file, SAME rules); external lab last.
 const paths=['assets/f3/catalog.manifest.json','assets/f3/external.manifest.json','assets/f3/cat-ia.manifest.json','assets/f3/op11-lote-01.manifest.json'];
 const api=window.FloorPlanAssetUI={entries:[],ready:false,error:null,diagnostics:paths.map(path=>({path,state:'loading',phase:'network'}))};
 async function readManifest(path,diagnostic){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const absolute=new URL(path,location.href);
   if(absolute.origin!==location.origin||absolute.search||absolute.hash)throw Error('Ruta de catálogo fuera del origen permitido');
   // Protected previews require the existing same-origin session, like script tags.
   // Never send it to a provider; origins and redirects remain restricted.
   const response=await fetch(absolute,{credentials:'same-origin',cache:'no-cache',redirect:'error',signal:controller.signal});
   diagnostic.httpStatus=response.status;diagnostic.contentType=response.headers.get('content-type')||'no declarado';
   if(!response.ok)throw Error(`HTTP ${response.status}${response.status===401?' — sesión de preview requerida':''}`);
   diagnostic.phase='body';if(!response.body)throw Error('Respuesta sin cuerpo legible');
   const reader=response.body.getReader(),chunks=[];let length=0;
   try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>65536)throw Error('Catálogo fuera de límite: máximo 65536 bytes');chunks.push(value);}}finally{await reader.cancel();}
   diagnostic.bytes=length;const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
   diagnostic.phase='json';let data;try{data=JSON.parse(new TextDecoder().decode(bytes));}catch{throw Error('JSON inválido; Content-Type: '+diagnostic.contentType);}
   diagnostic.phase='sha256';if(!crypto.subtle)throw Error('SHA-256 no disponible; requiere contexto seguro');
   const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
   return {data,revision};
  }catch(error){
   diagnostic.state='error';diagnostic.reason=controller.signal.aborted?'Timeout de catálogo (8 s)':diagnostic.phase==='network'&&!diagnostic.httpStatus?'Red o redirección bloqueada: '+error.message:error.message;
   throw error;
  }finally{clearTimeout(timer);}
 }
 api.prepare=(async()=>{
  api.excluded=[];
  try{
   const sources=await Promise.allSettled(paths.map((path,i)=>readManifest(path,api.diagnostics[i])));
   for(let i=0;i<sources.length;i++){
    const source=sources[i],diagnostic=api.diagnostics[i];if(source.status!=='fulfilled')continue;
    try{
     diagnostic.phase='adapt';const {data,revision}=source.value;
     const result=i!==1?FloorPlanAssets.adapt(data,{catalog:'rubik-sota-local',revision}):FloorPlanAssets.adapt(data.source,{catalog:'immersphere-asset-lab',revision:data.catalogRevision,evidence:data.evidence});
     api.entries.push(...result.entries);api.excluded.push(...result.excluded);
     diagnostic.accepted=result.entries.length;diagnostic.excluded=result.excluded;
     diagnostic.state=result.excluded.length||!result.entries.length?'warning':'ready';
     if(diagnostic.state==='warning')diagnostic.reason=result.excluded.length?result.excluded.map(e=>(e.id||'entrada sin ID')+': '+e.reason).join('; '):'Catálogo sin modelos aceptados';
    }catch(error){diagnostic.state='error';diagnostic.reason='Adaptación: '+error.message;}
   }
  }catch(error){api.error='Carga de catálogos: '+error.message;}
  finally{
   const issues=api.diagnostics.filter(d=>d.state==='error'||d.state==='warning');
   if(issues.length)api.error=issues.map(d=>d.path+' ['+d.phase+']: '+d.reason).join(' | ')+'. Se conserva el mueble genérico.';
   for(const d of issues)console.warn('F3 catálogo QA',d.path,d.phase,d.httpStatus??'',d.reason);
   api.ready=true;dispatchEvent(new Event('floorplan-catalog-ready'));renderPanel();window.View3D?.refreshAssets();
  }
 })();
 function update(){const el=document.querySelector('#fAssetStatus');if(!el||ui.sel?.kind!=='furn')return;const f=getF(ui.sel.id),status=window.View3D?.assetStatus(f.id);
  const entry=FloorPlanAssets.resolve(api.entries,f.assetRef);
  const tx=(es,en,zh)=>{const l=typeof LANG==='string'?LANG:'es';return l==='en'?en:l==='zh'?zh:es;};
  // The attribution line is catalogue data; its fixed Spanish clause is presented in the language of the session.
  const credit=t=>tx(t,String(t??'').replace('; Asset Lab. Uso autorizado por Juanma para Rubik Sota; sin afiliación.','; Asset Lab. Use authorised by Juanma for Rubik Sota; no affiliation.'),String(t??'').replace('; Asset Lab. Uso autorizado por Juanma para Rubik Sota; sin afiliación.','；Asset Lab。已获 Juanma 授权用于 Rubik Sota；无隶属关系。'));
  const dims=()=>Object.values(entry?.dimensionsMm||status?.normalizedDimensionsMm||{}).map(v=>Math.round(v)).join(' × ');
  el.textContent=!f.assetRef?tx('Mueble genérico.','Generic furniture.','通用家具。'):status?.state==='ready'?tx('Modelo cargado. ','Model loaded. ','模型已加载。')+credit(status.attribution)+' '+(entry?.dimensionsKind==='model-geometry'?tx('Medidas de la malla (escala física no verificada): ','Mesh dimensions (physical scale not verified): ','网格尺寸（物理比例未验证）：'):tx('Medidas de catálogo: ','Catalogue dimensions: ','目录尺寸：'))+dims()+tx(' mm. Se adapta a las medidas del objeto, sin cambiarlas.',' mm. It adapts to the dimensions of the object without changing them.',' mm。会适应对象的尺寸，但不会改变它们。'):status?.state==='error'?tx('Modelo no disponible: se muestra el genérico. Motivo: ','Model not available: the generic one is shown. Reason: ','模型不可用：显示通用模型。原因：')+status.reason:status?.state==='loading'?tx('Cargando modelo; el genérico sigue visible.','Loading the model; the generic one stays visible.','正在加载模型；通用模型仍然可见。'):tx('Modelo pendiente de abrir 3D; el genérico sigue visible.','Model pending until 3D is opened; the generic one stays visible.','模型待打开 3D 后加载；通用模型仍然可见。');
 }
 api.update=update;addEventListener('floorplan-asset-status',update);
})();
