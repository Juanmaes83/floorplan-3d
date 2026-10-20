/* Application shell of the premium UX cut A (docs/product/premium-ux-design-2026-10-20.md §2, §6):
   - phones: the library/palette, 2D/3D and properties buttons move from the horizontally scrolling header into a
     bottom bar (#mobileDock). On wide screens the bar is `display:contents`, so the same buttons keep their place
     and order in the header. No control is removed or duplicated; ids and handlers are unchanged;
   - body.has-rooms and body.distribution-pending drive the single dominant action of the state (CSS): «Nueva
     estancia» while the project is empty, «Presentar mi vivienda» when there is something to present, and a
     visible «pendiente» on the presentation entry while the building distribution blocks it;
   - the header fades at its right edge while more controls are hidden to the right (phones).
   Classic script, loaded after the guide (it must not be marked as an advanced control of the guided header). */
(function(){
 const header=document.querySelector('header');if(!header)return;
 const dock=document.createElement('nav');dock.id='mobileDock';dock.setAttribute('aria-label','Accesos principales');
 for(const id of ['paneBtns','viewSeg']){const n=document.getElementById(id);if(n)dock.append(n);}
 header.append(dock);
 function update(){
  const p=typeof project==='object'?project:null,st=window.FloorPlanBuildingUI?.status?.();
  document.body.classList.toggle('has-rooms',!!p?.rooms?.length);
  const pending=!!st&&st.state!=='clear';document.body.classList.toggle('distribution-pending',pending);
  const entry=document.getElementById('presentationBtn');
  if(entry){if(pending)entry.setAttribute('aria-description',`Presentación bloqueada: ${st.headline}. Pulsa para ver qué resolver.`);else entry.removeAttribute('aria-description');}
 }
 function edge(){header.classList.toggle('can-scroll-end',header.scrollWidth-header.clientWidth-header.scrollLeft>4);}
 header.addEventListener('scroll',edge,{passive:true});addEventListener('resize',edge);
 update();edge();
 window.FloorPlanAppShell={update(){update();edge();}};
})();
