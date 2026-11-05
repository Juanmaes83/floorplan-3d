export function mountFacadePreview(api){
 if(!new URLSearchParams(location.search).has('facadeF03'))return;
 const panel=document.createElement('aside');panel.id='facadeFidelityPreview';panel.setAttribute('aria-label','Prueba visual de materiales F03');panel.style.cssText='position:fixed;z-index:10000;top:12px;right:12px;padding:10px;background:#fff;border:1px solid #aaa;border-radius:8px;max-width:320px';
 const label=document.createElement('div');label.textContent='F03 · visual-only; no guarda cambios';panel.append(label);const status=document.createElement('output');status.setAttribute('aria-live','polite');
 for(const [name,materialId]of [['Original',null],['Estuco PBR','white_stucco'],['Revoco experimental','white_rough_plaster'],['Revoco 03 experimental','rough_plaster_03']]){
  const button=document.createElement('button');button.type='button';button.textContent=name;button.style.cssText='padding:7px;margin:4px';
  button.addEventListener('click',async()=>{try{status.textContent='Cargando…';const enabled=!!materialId,result=await api.setFacadeFidelity({enabled,projectId:enabled?api.source.id:null,materialId:materialId||'white_stucco',allowExperimentalVariant:enabled&&materialId!=='white_stucco',mode:innerWidth<1000?'mobile':'capture'});if(enabled&&!result.active.length)throw Error('Sin muros compatibles; revisa exclusiones F03');status.textContent=`${name}: ${result.active.length} muros`;for(const item of panel.querySelectorAll('button'))item.setAttribute('aria-pressed',String(item===button));}catch(error){status.textContent=error.message;}});button.setAttribute('aria-pressed',String(!materialId));panel.append(button);
 }
 panel.append(status);document.body.append(panel);return()=>panel.remove();
}
