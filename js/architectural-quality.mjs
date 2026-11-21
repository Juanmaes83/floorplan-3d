// One session-local control for visual quality. No access to the project store.
export function mountArchitecturalQuality(view){
 const group=document.createElement('div');
 group.className='grp only3d';
 const button=document.createElement('button');
 button.id='architecturalQuality';
 button.className='btn';
 button.type='button';
 const output=document.createElement('output');
 output.className='sr-only';
 // Keep the live region within the viewport when the mobile header scrolls.
 output.style.insetInlineStart='0';
 output.setAttribute('aria-live','polite');
 group.append(button,output);
 document.getElementById('roofGroup').after(group);

 const localized=(es,en,zh)=>({en,zh}[document.documentElement.lang]||es);
 const update=()=>{
  const {enabled,windows,facade,error}=view.architecturalQuality();
  button.textContent=localized('Detalle arquitectónico','Architectural detail','建筑细节');
  button.setAttribute('aria-pressed',String(enabled));
  if(!enabled){output.textContent='';return;}
  output.textContent=facade.status==='loading'
   ?localized('Cargando detalle de fachada','Loading facade detail','正在加载立面细节')
   :localized(
    `Carpinterías: ${windows}. Fachadas: ${facade.active.length}.`,
    `Windows: ${windows}. Facades: ${facade.active.length}.`,
    `窗户：${windows}。立面：${facade.active.length}。`);
  if(error||facade.status==='fallback'){
   output.textContent+=' '+localized('Se conservan los acabados de respaldo.','Fallback finishes preserved.','已保留备用饰面。');
  }
 };
 button.addEventListener('click',()=>{
  try{view.setArchitecturalQuality(!view.architecturalQuality().enabled);update();}
  catch{output.textContent=localized('Detalle no disponible en esta vista.','Detail unavailable in this view.','此视图无法显示细节。');}
 });
 addEventListener('architectural-quality-status',update);
 addEventListener('facade-fidelity-status',update);
 new MutationObserver(update).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 update();
}
