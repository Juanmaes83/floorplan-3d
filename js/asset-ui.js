/* Static authorized catalog, never project/image data. No asset data in projects. */
(function(){
 const api=window.FloorPlanAssetUI={entries:[],ready:false,error:null};
 api.prepare=(async()=>{try{
  const response=await fetch('assets/f3/catalog.manifest.json',{credentials:'omit',cache:'no-cache'});if(!response.ok)throw Error('Catálogo local no disponible');
  const text=await response.text();if(text.length>65536)throw Error('Catálogo fuera de límite');
  const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(text))),b=>b.toString(16).padStart(2,'0')).join('');
  const result=FloorPlanAssets.adapt(JSON.parse(text),{catalog:'rubik-sota-local',revision:hash.slice(0,40)});api.entries=result.entries;api.ready=true;
 }catch{api.error='Catálogo no disponible: se conserva el mueble genérico.';}finally{api.ready=true;renderPanel();window.View3D?.refreshAssets();}})();
 function update(){const el=document.querySelector('#fAssetStatus');if(!el||ui.sel?.kind!=='furn')return;const f=getF(ui.sel.id),status=window.View3D?.assetStatus(f.id);
  el.textContent=!f.assetRef?'Mueble genérico.':status?.state==='ready'?'Modelo cargado. '+status.attribution:status?.state==='error'?'Modelo no disponible: se muestra el genérico.':status?.state==='loading'?'Cargando modelo; el genérico sigue visible.':'Modelo pendiente de abrir 3D; el genérico sigue visible.';
 }
 api.update=update;addEventListener('floorplan-asset-status',update);
})();
