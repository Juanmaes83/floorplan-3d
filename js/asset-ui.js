/* Static authorized catalog, never project/image data. No asset data in projects. */
(function(){
 const api=window.FloorPlanAssetUI={entries:[],ready:false,error:null};
 async function readManifest(path){
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{const response=await fetch(path,{credentials:'omit',cache:'no-cache',redirect:'error',signal:controller.signal});if(!response.ok)throw Error('Catálogo local no disponible');
   const reader=response.body.getReader(),chunks=[];let length=0;try{for(;;){const {done,value}=await reader.read();if(done)break;length+=value.length;if(length>65536)throw Error('Catálogo fuera de límite');chunks.push(value);}}finally{await reader.cancel();}
   const bytes=new Uint8Array(length);let at=0;for(const chunk of chunks){bytes.set(chunk,at);at+=chunk.length;}
   const revision=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('').slice(0,40);
   return {data:JSON.parse(new TextDecoder().decode(bytes)),revision};
  }finally{clearTimeout(timer);}
 }
 api.prepare=(async()=>{try{
  const sources=await Promise.allSettled([readManifest('assets/f3/catalog.manifest.json'),readManifest('assets/f3/external.manifest.json')]);
  api.excluded=[];
  for(let i=0;i<sources.length;i++){const source=sources[i];if(source.status!=='fulfilled'){api.error='Un catálogo no está disponible: se conserva el mueble genérico.';continue;}
   try{const {data,revision}=source.value,result=i===0?FloorPlanAssets.adapt(data,{catalog:'rubik-sota-local',revision}):FloorPlanAssets.adapt(data.source,{catalog:'immersphere-asset-lab',revision:data.catalogRevision,evidence:data.evidence});
    api.entries.push(...result.entries);api.excluded.push(...result.excluded);
   }catch{api.error='Un catálogo no es válido: se conserva el mueble genérico.';}
  }
 }catch{api.error='Catálogo no disponible: se conserva el mueble genérico.';}finally{api.ready=true;renderPanel();window.View3D?.refreshAssets();}})();
 function update(){const el=document.querySelector('#fAssetStatus');if(!el||ui.sel?.kind!=='furn')return;const f=getF(ui.sel.id),status=window.View3D?.assetStatus(f.id);
  el.textContent=!f.assetRef?'Mueble genérico.':status?.state==='ready'?'Modelo cargado. '+status.attribution+' Medidas de catálogo: '+Object.values(FloorPlanAssets.resolve(api.entries,f.assetRef)?.dimensionsMm||status.normalizedDimensionsMm).map(v=>Math.round(v)).join(' × ')+' mm. Se adapta a las medidas del objeto, sin cambiarlas.':status?.state==='error'?'Modelo no disponible: se muestra el genérico.':status?.state==='loading'?'Cargando modelo; el genérico sigue visible.':'Modelo pendiente de abrir 3D; el genérico sigue visible.';
 }
 api.update=update;addEventListener('floorplan-asset-status',update);
})();
