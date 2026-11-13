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
 // The landscape column starts where the header really ends: the header has one row with touch and wraps to three
 // rows in a narrow window with a mouse, so a fixed offset would cover its right-hand controls.
 // If the landscape column has no room for its four 40 px buttons (a short window with a mouse: three-row header and
 // the work-area bar), it becomes a 2×2 block (body.dock-2col, design-system.css) instead of drawing one button over
 // another. Measured from the column's real top (it may start under the work-area bar, professional-workspace.css).
 const dockFit=()=>{const top=parseFloat(getComputedStyle(dock).top);
  document.body.classList.toggle('dock-2col',innerWidth<=1100&&innerHeight<=500&&Number.isFinite(top)&&innerHeight-top-36<4*40+3*4+6);};
 const headerEnd=()=>{document.documentElement.style.setProperty('--shell-header-bottom',`${Math.round(header.getBoundingClientRect().bottom)}px`);dockFit();};
 if(typeof ResizeObserver==='function')new ResizeObserver(headerEnd).observe(header);
 // The work-area bar publishes its bottom in --professional-nav-bottom (inline style of <html>): re-check the column then.
 if(typeof MutationObserver==='function')new MutationObserver(dockFit).observe(document.documentElement,{attributes:true,attributeFilter:['style']});
 header.addEventListener('scroll',edge,{passive:true});addEventListener('resize',()=>{edge();headerEnd();});headerEnd();
 // Top of the selection bar, for the temporary message to sit above it on phones (design-system.css).
 const fab=document.getElementById('fab');
 const fabTop=()=>{if(!fab)return;const r=fab.getBoundingClientRect(),on=fab.classList.contains('show'),s=document.documentElement.style;s.setProperty('--fab-top',`${Math.round(on?r.top:innerHeight)}px`);s.setProperty('--fab-h',`${Math.round(on?r.height:0)}px`);};
 if(fab&&typeof ResizeObserver==='function'){new ResizeObserver(fabTop).observe(fab);new MutationObserver(fabTop).observe(fab,{attributes:true,attributeFilter:['class']});}
 addEventListener('resize',fabTop);fabTop();
 update();edge();
 window.FloorPlanAppShell={update(){update();edge();}};
})();
