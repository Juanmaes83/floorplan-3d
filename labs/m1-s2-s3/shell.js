/* FT3D-8 · M1 lab · shell: accessible tabs (click + arrow keys + ?tab=) and small DOM helpers. */
(function(){
 'use strict';
 const $=id=>document.getElementById(id);
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const eur=v=>v===null||v===undefined?'Desconocido':new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR'}).format(v);
 const unitLabel={m2:'m²',m:'m',unit:'ud'};
 const tabs=[...document.querySelectorAll('[role=tab]')];
 function go(tab){
  document.body.dataset.tab=tab;
  for(const t of tabs){const on=t.dataset.tab===tab;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1;$('panel-'+t.dataset.tab).hidden=!on;}
 }
 for(const t of tabs){t.onclick=()=>go(t.dataset.tab);
  t.onkeydown=e=>{const i=tabs.indexOf(t),n={ArrowRight:1,ArrowLeft:-1}[e.key];if(!n)return;e.preventDefault();const next=tabs[(i+n+tabs.length)%tabs.length];go(next.dataset.tab);next.focus();};}
 const q=new URLSearchParams(location.search);go(q.get('tab')==='parcela'?'parcela':'precios');
 window.M1UI=Object.freeze({$,esc,eur,unitLabel,go});
})();
