// B3 · measured pagination in the browser (ADR 06). A page holding a <table class="flow"> is split until nothing passes the
// footer: the last rows move to a clone of the page, repeatedly. The clone keeps the header row (thead) and the layout;
// [data-flow-first] stays on the first page only, [data-flow-last] on the last only, [data-flow-cont] shows on continuations,
// [data-flow-part] says «Parte k de n». A chapter row is never left alone at the bottom. Pages and «i / N» are renumbered.
// Invariant returned to QA: every body row exists exactly once, in its original order (no loss, no duplication).
function paginateFlow(){
 const rowsOf=()=>[...document.querySelectorAll('table.flow tbody tr')];
 rowsOf().forEach((tr,i)=>tr.dataset.k=String(i));const before=rowsOf().map(t=>t.dataset.k+'|'+t.textContent.trim());
 const bottomOf=sec=>{let m=0;for(const el of sec.querySelectorAll(':scope > :not(.foot) *')){const r=el.getBoundingClientRect();if(r.height&&r.bottom>m)m=r.bottom;}return m;};
 const limitOf=sec=>{const f=sec.querySelector(':scope > .foot');const b=sec.getBoundingClientRect();return (f?f.getBoundingClientRect().top:b.bottom-48)-4;};
 const chains=[];let unsplittable=0;
 for(const first of [...document.querySelectorAll('section.page')].filter(s=>s.querySelector('table.flow'))){const chain=[first];let sec=first;
  while(true){const tb=sec.querySelector('table.flow tbody');const moved=[];
   while(bottomOf(sec)>limitOf(sec)&&tb.rows.length>1){moved.unshift(tb.rows[tb.rows.length-1]);tb.rows[tb.rows.length-1].remove();}
   while(moved.length&&tb.rows.length>1&&tb.rows[tb.rows.length-1].classList.contains('chap')){const r=tb.rows[tb.rows.length-1];r.remove();moved.unshift(r);}
   if(bottomOf(sec)>limitOf(sec))unsplittable++;
   if(!moved.length)break;
   const next=sec.cloneNode(true);sec.querySelectorAll('[data-flow-last]').forEach(e=>e.remove());
   next.querySelectorAll('[data-flow-first]').forEach(e=>e.remove());next.querySelectorAll('[data-flow-cont]').forEach(e=>e.hidden=false);
   const ntb=next.querySelector('table.flow tbody');ntb.replaceChildren(...moved);sec.after(next);chain.push(next);sec=next;}
  chains.push(chain);}
 for(const chain of chains)chain.forEach((s,i)=>s.querySelectorAll('[data-flow-part]').forEach(e=>{e.textContent=chain.length>1?`Parte ${i+1} de ${chain.length}`:'';e.hidden=chain.length<2;}));
 const pages=[...document.querySelectorAll('section.page')];pages.forEach((s,i)=>{s.dataset.page=String(i+1);const pg=s.querySelector('.foot .pg');if(pg)pg.textContent=`${i+1} / ${pages.length}`;});
 const after=rowsOf().map(t=>t.dataset.k+'|'+t.textContent.trim());
 for(const chain of chains)chain.slice(1).forEach(s=>{const r=s.querySelector('table.flow tbody tr');r&&r.querySelectorAll('td[data-repeat]').forEach(td=>{if(!td.textContent.trim())td.textContent=td.dataset.repeat;});});
 return {tables:chains.length,rows:before.length,pagesAdded:chains.reduce((s,c)=>s+c.length-1,0),unsplittable,ok:before.length===after.length&&before.every((v,i)=>v===after[i])};}
