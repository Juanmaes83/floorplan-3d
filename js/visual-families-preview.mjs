// Explicit demo entry only; no design selection is saved or sent to Delivery.
export function mountVisualPreview(api){
 if(!new URLSearchParams(location.search).has('visualFamilies'))return;
 const panel=document.createElement('aside');panel.id='visualFamilyPreview';panel.setAttribute('aria-label','Prueba visual de carpinterias');
 panel.style.cssText='position:fixed;z-index:10000;top:12px;left:50%;transform:translateX(-50%);padding:10px;background:#fff;border:1px solid #aaa;border-radius:8px;max-width:90vw';
 const label=document.createElement('div');label.textContent='Prueba visual: no guarda cambios de proyecto';panel.append(label);
 const status=document.createElement('output');status.setAttribute('aria-live','polite');
 for(const [name,finish]of [['Original',null],['Grafito','graphite'],['Claro','chalk']]){
  const button=document.createElement('button');button.textContent=name;button.type='button';button.style.cssText='padding:8px;margin:4px';button.dataset.finish=finish||'OFF';
  button.addEventListener('click',()=>{try{
   const current=api.visualFamilies,ids=current.bindings.filter(b=>['opn_window-7','opn_window-10','opn_window-1'].includes(b.id)).map(b=>b.id);
   if(finish&&!ids.length)throw Error('No hay ventanas compatibles de la vivienda de prueba');
   api.setVisualFamilies({projectId:current.bindings[0]?.projectId,enabled:!!finish,sourceIds:ids,mode:innerWidth<1000?'mobile':'presentation',overrides:finish?{'frame.finish':finish}:{}});
   for(const b of panel.querySelectorAll('button'))b.setAttribute('aria-pressed',String(b===button));status.textContent=name;
  }catch(error){status.textContent=error.message;}});button.setAttribute('aria-pressed',String(!finish));panel.append(button);
 }
 panel.append(status);document.body.append(panel);return()=>panel.remove();
}
