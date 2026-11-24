/* UX-312 PERLA · U11 «Botón hecho»: un botón de acción concreta pasa del imperativo a la acción completada
   («Guardar proyecto JSON» → «✓ Proyecto JSON guardado») con cambio de color, para que la persona vea que lo hizo.
   Reglas honestas: solo se marca como hecho con una señal REAL (estado del producto o la acción ejecutada) y vuelve a su
   forma de acción cuando el resultado deja de reflejar el proyecto (el proyecto cambia después).
   Accesibilidad: el nombre accesible contiene el texto visible y la acción original («Proyecto JSON guardado. Guardar
   proyecto JSON de nuevo»): el lector de pantalla oye ambas cosas y nada se busca por un nombre que ya no existe.
   Componente común: cada regla es {match, done, label}; añadir una acción nueva es añadir una regla. */
(()=>{'use strict';
 const lang=()=>{const l=document.documentElement.lang||'es';return l.startsWith('en')?1:l.startsWith('zh')?2:0;};
 const L=a=>a[lang()];
 const AGAIN=['de nuevo','again','再次'];
 // Revisión por CONTENIDO (la misma del Asistente: sin updatedAt). Solo se calcula si hay alguna acción «por clic» hecha.
 const rev=()=>{try{const p=window.FloorPlanApp?.project;return p?(window.RubikAssistantDomainTools?.revision?.(p)??JSON.stringify(p).length):null;}catch{return null;}};
 let clickDone=0;
 // Acciones por clic: hechas mientras el proyecto no cambie (el archivo o la descarga refleja el estado actual).
 const site=()=>window.FloorPlanBuildingUI?.site||window.FloorPlanApp?.project?.site||{};
 const clicked=new WeakMap();
 const byClick=el=>{const r=clicked.get(el);return !!r&&r===String(rev());};
 const RULES=[
  {match:el=>el.id==='exportJsonQuick',done:byClick,label:['Proyecto JSON guardado','Project JSON saved','项目 JSON 已保存'],onClick:true},
  {match:el=>/^(Descargar archivo para el cliente|Download client file)$/.test(orig(el)),done:byClick,label:['Archivo para el cliente descargado','Client file downloaded','客户文件已下载'],onClick:true},
  {match:el=>/^e3-descargar-/.test(el.dataset.route||''),done:byClick,label:['Descargado','Downloaded','已下载'],onClick:true},
  // Estado real del producto.
  {match:el=>el.dataset.route==='prepare-views',done:()=>window.FloorPlanProjectViews?.status?.()==='ready',label:['Vistas preparadas','Views prepared','视图已准备']},
  // U12 · Territorio: la configuración de ortofoto y de terreno está guardada cuando el proyecto la tiene y no hay cambios pendientes.
  {match:el=>el.id==='territoryOrthophotoSave',done:el=>el.disabled&&!!site().orthophoto,label:['Configuración guardada','Configuration saved','配置已保存']},
  {match:el=>el.id==='territoryTerrainSave',done:el=>el.disabled&&!!site().terrain,label:['Configuración guardada','Configuration saved','配置已保存']},
  // La parcela ya cambia su texto sola («Parcela guardada»): aquí solo se le da el color y el ✓ del patrón común.
  {match:el=>el.id==='territorySave',done:el=>/^(✓ )?(Parcela guardada|Parcel saved|地块已保存)$/.test(el.textContent.trim()),label:null},
 ];
 function orig(el){return el.dataset.perlaOrig||el.textContent.trim();}
 function apply(el,rule){const isDone=!!rule.done(el);
  if(isDone){
   if(rule.label){if(!el.dataset.perlaOrig)el.dataset.perlaOrig=el.textContent.trim();const t='✓ '+L(rule.label);if(el.textContent!==t)el.textContent=t;
    const name=`${L(rule.label)}. ${el.dataset.perlaOrig} ${L(AGAIN)}`;if(el.getAttribute('aria-label')!==name)el.setAttribute('aria-label',name);}
   // Sin etiqueta propia (el producto ya escribe el texto hecho): solo color y ✓ visual por CSS; el texto no se toca.
   if(el.dataset.perlaDone!=='1')el.dataset.perlaDone='1';}
  else if(el.dataset.perlaDone){delete el.dataset.perlaDone;
   if(el.dataset.perlaOrig){el.textContent=el.dataset.perlaOrig;delete el.dataset.perlaOrig;el.removeAttribute('aria-label');}
}}
 function scan(){for(const el of document.querySelectorAll('button')){const r=RULES.find(r=>r.match(el));if(r)apply(el,r);}}
 // Clic en una acción «por clic»: se anota la revisión vigente (la descarga se inicia en el mismo gesto).
 document.addEventListener('click',e=>{const el=e.target.closest?.('button');if(!el)return;const r=RULES.find(r=>r.onClick&&r.match(el));if(!r)return;
  // Tras el gesto: el exportador corre en este mismo clic; se marca en el siguiente fotograma.
  requestAnimationFrame(()=>{clicked.set(el,String(rev()));clickDone++;schedule();});},true);
 let q=0;const schedule=()=>{if(!q)q=requestAnimationFrame(()=>{q=0;scan();});};
 function start(){new MutationObserver(m=>{if(m.some(x=>x.type==='childList'||x.target.nodeType===1))schedule();}).observe(document.body,{childList:true,subtree:true});
  // El proyecto cambia sin tocar el DOM de los botones: comprobación ligera periódica.
  let last=null;setInterval(()=>{if(!clickDone&&!document.querySelector('[data-perla-done]'))return;const r=rev();if(r!==last){last=r;scan();}},700);
  document.addEventListener('rubik:languagechange',()=>setTimeout(()=>{for(const el of document.querySelectorAll('[data-perla-done]')){delete el.dataset.perlaDone;if(el.dataset.perlaOrig){delete el.dataset.perlaOrig;el.removeAttribute('aria-label');}}scan();},0));
  scan();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 window.FloorPlanPerlaDone={scan,rules:RULES.length};
})();
