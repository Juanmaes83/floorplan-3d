/* UX-312 PERLA · U9 Navegación coherente: «Volver» devuelve a donde estabas.
   1) Pila de retorno: si una acción de un área (Entregar, Presupuestar, Analizar, Mi estudio) te lleva al editor o a otra
      área, se recuerda el origen (área, ficha abierta y posición). Un único «← Volver a <área>» aparece en el sitio de
      siempre (el «← Volver» de la cabecera del área o, en el editor, al principio de la segunda fila) y te devuelve allí.
   2) Historial: cada cambio de área es una entrada del historial; «Atrás» del navegador o del teléfono vuelve a la
      pantalla anterior y nunca saca de la aplicación ni lleva al inicio sin pedirlo.
   Capa de presentación: no cambia ninguna ruta ni ningún diálogo; usa FloorPlanProfessionalUI.open/close. */
(()=>{'use strict';
 const $=s=>document.querySelector(s),tx=(es,en,zh)=>{const l=document.documentElement.lang||'es';return l.startsWith('en')?en:l.startsWith('zh')?zh:es;};
 const PW=()=>window.FloorPlanProfessionalUI,section=()=>$('#professionalWorkspace');
 const areaNow=()=>{const s=section();return s&&!s.hidden?(PW()?.area||'design'):'design';};
 const label=a=>($('#workArea-'+a)?.textContent||'').trim()||a;
 // Diálogos abiertos: Chromium cierra un diálogo modal en el mismo paso que «Atrás» (quita «open» antes de avisar con
 // «close»), así que se lleva la cuenta propia: un diálogo sigue en la lista hasta que llega su evento «close».
 const openDialogs=new Set();
 // Un diálogo retirado del documento (p. ej. el visor Blueprint/Despiece, que se cierra y se elimina en el mismo paso)
 // recibe «close» ya desconectado y el aviso no llega a document: se descarta aquí para no retener su lienzo WebGL.
 const prune=()=>{for(const d of openDialogs)if(!d.isConnected)openDialogs.delete(d);};
 for(const m of ['showModal','show']){const f=HTMLDialogElement.prototype[m];HTMLDialogElement.prototype[m]=function(...a){const r=f.apply(this,a);prune();openDialogs.add(this);this.addEventListener('close',()=>openDialogs.delete(this),{once:true});return r;};}
 document.addEventListener('close',e=>openDialogs.delete(e.target),true);
 let origin=null,pending=null,fromPop=false,last=null,btn=null;

 // 1 · Recordar el origen al pulsar una acción de un área.
 document.addEventListener('click',e=>{const b=e.target.closest?.('#professionalWorkspace [data-route],#professionalWorkspace [data-perla-mirror]');if(!b)return;
  const a=areaNow();if(a==='design')return;const s=section();
  const card=b.closest('[data-entrega-code]')||document.querySelector('#professionalWorkspace .perla-panel-open')&&$('#professionalWorkspace .perla-ref.perla-selected,#professionalWorkspace .perla-ref[aria-pressed="true"]');
  const code=b.closest('[data-entrega-code]')?.dataset.entregaCode||$('#professionalWorkspace .perla-panel-open .perla-panel-code')?.textContent||card?.dataset?.entregaCode||null;
  const route=b.dataset.route||b.dataset.perlaMirror||null;
  origin={area:a,code,route,top:b.getBoundingClientRect().top,y:s?.scrollTop||0,t:Date.now()};},true);
 // Navegación explícita (pestañas de área, inicio, proyectos): la persona elige otro sitio; se olvida el retorno.
 document.addEventListener('click',e=>{if(e.target.closest?.('[id^="workArea-"],#welcomeBtn,#perlaHome,.perla-home'))pending=null;},true);

 // 2 · Botón único de retorno.
 function ensureBtn(){if(btn?.isConnected)return btn;btn=document.createElement('button');btn.type='button';btn.id='perlaReturn';btn.className='btn perla-return';btn.hidden=true;btn.onclick=goBack;return btn;}
 // U9: dos acciones distintas no comparten nombre accesible (Blueprint 3D y Despiece 3D abren visores diferentes).
 function names(){for(const [m,es,en,zh] of [['blueprint','Abrir la vista 3D de Blueprint 3D','Open the Blueprint 3D view','打开 Blueprint 3D 视图'],['despiece','Abrir la vista 3D de Despiece 3D','Open the Exploded 3D view','打开分解 3D 视图']]){const b=document.getElementById('bpdpOpen3d-'+m);if(b&&b.getAttribute('aria-label')!==tx(es,en,zh))b.setAttribute('aria-label',tx(es,en,zh));}}
 function paint(){names();const a=areaNow();
  // En un área: su «← Volver» de cabecera pasa a «← Volver a <origen>» cuando hay un retorno pendiente a otra área.
  const head=$('#professionalWorkspace .professional-head>button');
  if(head){if(pending&&pending.area!==a){head.textContent='← '+tx('Volver a ','Back to ','返回 ')+label(pending.area);head.dataset.perlaReturn=pending.area;}else if(head.dataset.perlaReturn){delete head.dataset.perlaReturn;head.textContent=tx('← Volver a Diseñar','← Return to Design','← 返回设计');}}
  // En el editor: «← Volver a <origen>» al principio de la segunda fila.
  const r2=$('.perla-r2'),b=ensureBtn();
  if(a==='design'&&pending&&r2){if(b.parentElement!==r2)r2.prepend(b);b.textContent='← '+tx('Volver a ','Back to ','返回 ')+label(pending.area);b.hidden=false;}
  else b.hidden=true;}
 function goBack(){const p=pending;if(!p)return;pending=null;origin=null;// volver no crea un retorno nuevo (evita el vaivén entre dos áreas)
 PW()?.open(p.area);
  requestAnimationFrame(()=>requestAnimationFrame(()=>{const s=section();if(s){s.scrollTop=p.y;
    // Misma posición en pantalla: la acción pulsada vuelve a quedar donde estaba.
    const el=p.route&&[...s.querySelectorAll(`[data-route="${p.route}"]`)].find(e=>e.checkVisibility());if(el)s.scrollTop+=el.getBoundingClientRect().top-p.top;}
   if(p.code){const sel=$(`#professionalWorkspace [data-entrega-code="${p.code}"] .perla-card-selector`);if(sel&&!$('#professionalWorkspace .perla-panel-open'))sel.click();}
   const t=$('#professionalTitle');t?.focus?.({preventScroll:true});paint();}));}
 // El «← Volver» de la cabecera del área obedece al retorno pendiente.
 document.addEventListener('click',e=>{const h=e.target.closest?.('#professionalWorkspace .professional-head>button[data-perla-return]');if(!h)return;e.preventDefault();e.stopImmediatePropagation();goBack();},true);

 // 3 · Cambios de área: activar el retorno y escribir el historial.
 function onArea(){const a=areaNow();if(a===last)return;const prev=last;last=a;
  if(origin&&prev===origin.area&&a!==origin.area&&Date.now()-origin.t<4000)pending=origin;
  if(pending&&a===pending.area)pending=null;origin=null;
  if(!fromPop&&prev!==null&&history.state?.perlaArea!==a)history.pushState({...history.state,perlaArea:a},'',location.href);
  fromPop=false;paint();}
 // Atrás/Adelante: si la entrada es de un área, se abre esa área; si se sale de las áreas, se vuelve al editor.
 // Se adelanta (captura) al manejo de pantallas de la guía para que «Atrás» desde un área no abra el inicio.
 addEventListener('popstate',e=>{const st=e.state||{},a=areaNow();
  // La presentación gestiona su propia entrada (#presentacion): no se toca nada mientras está activa o saliendo.
  if(window.FloorPlanPresentation?.active||st.rubikPresentation||document.body.classList.contains('presenting')||document.body.classList.contains('presentation-exiting'))return;
  if(st.perlaArea&&st.perlaArea===a)return;
  // Con un diálogo abierto en un área, «Atrás» cierra el diálogo y deja a la persona en su área.
  // (Chromium cierra él mismo un diálogo modal al ir Atrás, justo antes de este evento: también cuenta.)
  prune();const dlg=[...document.querySelectorAll('dialog[open]')].pop(),justClosed=[...openDialogs].some(d=>!d.open);
  if(a!=='design'&&(dlg||justClosed)){e.stopImmediatePropagation();if(dlg){const c=new Event('cancel',{cancelable:true});if(dlg.dispatchEvent(c))dlg.close();}history.pushState({...history.state,perlaArea:a},'',location.href);return;}
  if(st.perlaArea&&(st.perlaArea!=='design'||a!=='design')){e.stopImmediatePropagation();fromPop=true;if(st.perlaArea==='design')PW()?.close?.();else PW()?.open(st.perlaArea);if(areaNow()===a)fromPop=false;return;}
  if(a!=='design'){e.stopImmediatePropagation();fromPop=true;PW()?.close?.();if(areaNow()===a)fromPop=false;}},true);

 // U9 sin duplicados en el móvil: la barra fija de Entregar repite la acción principal de la cabecera; solo se muestra
 // cuando esa acción de la cabecera ha salido de la vista. Siempre hay una, nunca dos a la vez.
 let heroIO=null,heroEl=null;
 function watchHero(){const s=section(),cta=s?.querySelector('.hero-ent .acciones');if(cta===heroEl)return;heroIO?.disconnect();heroEl=cta;
  if(!cta){s?.classList.remove('perla-hero-cta-in-view');return;}
  heroIO=new IntersectionObserver(es=>{for(const e of es)s.classList.toggle('perla-hero-cta-in-view',e.isIntersecting);},{root:null,threshold:0.01});heroIO.observe(cta);}
 function start(){const nav=document.querySelectorAll('[id^="workArea-"]');if(!nav.length||!PW()){setTimeout(start,200);return;}
  last=areaNow();
  const mo=new MutationObserver(()=>onArea());for(const b of nav)mo.observe(b,{attributes:true,attributeFilter:['aria-current']});
  const s=section();if(s){new MutationObserver(()=>{onArea();paint();watchHero();}).observe(s,{childList:true,attributes:true,attributeFilter:['hidden']});
   // Los visores Blueprint/Despiece se pintan más tarde y más adentro: se nombran al aparecer.
   let q=0;new MutationObserver(()=>{if(!q)q=requestAnimationFrame(()=>{q=0;names();});}).observe(s,{childList:true,subtree:true});}
  document.addEventListener('rubik:languagechange',()=>queueMicrotask(paint));}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',start);else start();
 window.FloorPlanPerlaReturn={get pending(){return pending&&{...pending};},back:goBack};
})();
