/* UX-312 PERLA · U9 Aviso «Guardado»: la persona sabe siempre si su trabajo quedó guardado.
   Fuente real: la escritura del proyecto en el almacenamiento del navegador (clave del proyecto activo). Cada intento de
   guardar actualiza el aviso: «✓ Guardado · HH:MM» (verde) o «Cambios sin guardar» (rojo) si el navegador lo rechaza.
   Mismo sitio en todas las pantallas: junto al proyecto en el editor y junto a «Volver» en las áreas. Es un estado
   (role=status), no un botón: no añade otra navegación. */
(()=>{'use strict';
 // El proyecto activo se guarda en la colección local (rubik-sota-project-library-v1) o, sin colección, en su clave propia.
 const KEYS=new Set(['rubik-sota-floorplan-project-v1','rubik-sota-project-library-v1']);
 const tx=(es,en,zh)=>{const l=document.documentElement.lang||'es';return l.startsWith('en')?en:l.startsWith('zh')?zh:es;};
 let state=null,at=null;const chips=new Set();
 const set=Storage.prototype.setItem;
 Storage.prototype.setItem=function(k,v){if(!KEYS.has(k))return set.call(this,k,v);
  try{const r=set.call(this,k,v);state='saved';at=new Date();paint();return r;}catch(e){state='error';paint();throw e;}};
 function text(){if(state==='error')return tx('Cambios sin guardar','Unsaved changes','未保存的更改');
  if(state==='saved'&&!at)return tx('✓ Guardado','✓ Saved','✓ 已保存');
  if(state==='saved'){const hh=String(at.getHours()).padStart(2,'0'),mm=String(at.getMinutes()).padStart(2,'0');return tx(`✓ Guardado · ${hh}:${mm}`,`✓ Saved · ${hh}:${mm}`,`✓ 已保存 · ${hh}:${mm}`);}
  return '';}
 function chip(){const c=document.createElement('span');c.className='perla-saved';c.setAttribute('role','status');c.setAttribute('aria-live','polite');chips.add(c);return c;}
 function paint(){const t=text(),title=tx('Se guarda solo en este navegador al hacer cada cambio.','Saved automatically in this browser with every change.','每次更改都会自动保存在此浏览器中。');
  for(const c of chips){if(!c.isConnected){chips.delete(c);continue;}c.textContent=t;c.dataset.state=state||'';c.hidden=!t;c.title=title;}}
 let editorChip=null;
 function place(){
  const left=document.querySelector('.perla-left'),proj=document.querySelector('.perla-project');
  if(left&&proj){if(!editorChip)editorChip=chip();editorChip.id='perlaSaved';if(editorChip.previousElementSibling!==proj)proj.after(editorChip);}
  const head=document.querySelector('#professionalWorkspace .professional-head');
  // En las áreas: junto al nombre del proyecto, encima del título (mismo bloque en escritorio y móvil).
  if(head&&!head.querySelector('.perla-saved')){const c=chip();const ctx=head.querySelector(':scope>div');const small=ctx?.querySelector('small');if(small)small.after(c);else ctx?.prepend(c);}
  paint();}
 function start(){place();const s=document.querySelector('#professionalWorkspace');if(s)new MutationObserver(place).observe(s,{childList:true});
  document.addEventListener('rubik:languagechange',()=>queueMicrotask(paint));
  // Estado inicial: si ya hay un proyecto guardado, se dice (sin hora: no consta cuándo).
  try{if([...KEYS].some(k=>localStorage.getItem(k)!==null)&&!state){state='saved';at=null;}}catch{}paint();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(start,0));else setTimeout(start,0);
 window.FloorPlanPerlaSaved={get state(){return state;},get at(){return at;}};
})();
