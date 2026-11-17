// B3 · measured pagination in the browser (ADR 06), v1.2 (A04). A page holding a <table class="flow"> is split until nothing
// passes the footer: the last rows move to a clone of the page, repeatedly. The clone keeps the header row (thead) and the
// layout; [data-flow-first] stays on the first page only, [data-flow-last] on the last only, [data-flow-cont] shows on
// continuations, [data-flow-part] says «Parte k de n». A chapter row is never left alone at the bottom. Pages are renumbered.
// Invariant returned to QA, checked on the FINAL DOM (after the repeated room labels are written):
//  · every body row exists exactly once and in its original order, identified by its index (data-k) and its canonical
//    fields (every cell that is not a repeated label);
//  · a repeated-label cell (td[data-repeat]) is either empty or exactly its label: a label, never duplicated data;
//  · a row taller than a whole page is NOT split and NOT clipped: it is reported (oversized) and the document is refused.
// rowText (the longest canonical cell of each row) lets the composer compare the rows with the text of the printed PDF.
function paginateFlow(){
 const rowsOf=()=>[...document.querySelectorAll('table.flow tbody tr')];
 const canon=tr=>[...tr.cells].filter(td=>!td.hasAttribute('data-repeat')).map(td=>td.textContent.replace(/\s+/g,' ').trim()).join(' | ');
 rowsOf().forEach((tr,i)=>{tr.dataset.k=String(i);});const before=rowsOf().map(t=>t.dataset.k+'#'+canon(t));
 // rowText: per row, its most distinctive canonical cell (fewest repetitions across rows; longest on ties)
 const cellsOf=t=>[...t.cells].filter(td=>!td.hasAttribute('data-repeat')).map(td=>td.textContent.replace(/\s+/g,' ').trim()).filter(x=>x.length>2);
 const freq=new Map();rowsOf().forEach(t=>cellsOf(t).forEach(c=>freq.set(c,(freq.get(c)||0)+1)));
 const rowText=rowsOf().map(t=>cellsOf(t).sort((a,b)=>freq.get(a)-freq.get(b)||b.length-a.length)[0]||'');
 const bottomOf=sec=>{let m=0;for(const el of sec.querySelectorAll(':scope > :not(.foot) *')){const r=el.getBoundingClientRect();if(r.height&&r.bottom>m)m=r.bottom;}return m;};
 const limitOf=sec=>{const f=sec.querySelector(':scope > .foot');const b=sec.getBoundingClientRect();return (f?f.getBoundingClientRect().top:b.bottom-48)-4;};
 const chains=[];let unsplittable=0;const oversized=[];
 for(const first of [...document.querySelectorAll('section.page')].filter(s=>s.querySelector('table.flow'))){const chain=[first];let sec=first;
  while(true){const tb=sec.querySelector('table.flow tbody');const moved=[];
   while(bottomOf(sec)>limitOf(sec)&&tb.rows.length>1){moved.unshift(tb.rows[tb.rows.length-1]);tb.rows[tb.rows.length-1].remove();}
   while(moved.length&&tb.rows.length>1&&tb.rows[tb.rows.length-1].classList.contains('chap')){const r=tb.rows[tb.rows.length-1];r.remove();moved.unshift(r);}
   if(bottomOf(sec)>limitOf(sec)){unsplittable++;if(tb.rows.length===1)oversized.push({k:tb.rows[0].dataset.k,text:canon(tb.rows[0]).slice(0,80),page:[...document.querySelectorAll('section.page')].indexOf(sec)+1});}
   if(!moved.length)break;
   const next=sec.cloneNode(true);sec.querySelectorAll('[data-flow-last]').forEach(e=>e.remove());
   next.querySelectorAll('[data-flow-first]').forEach(e=>e.remove());next.querySelectorAll('[data-flow-cont]').forEach(e=>e.hidden=false);
   const ntb=next.querySelector('table.flow tbody');ntb.replaceChildren(...moved);sec.after(next);chain.push(next);sec=next;}
  chains.push(chain);}
 for(const chain of chains)chain.forEach((s,i)=>s.querySelectorAll('[data-flow-part]').forEach(e=>{e.textContent=chain.length>1?`Parte ${i+1} de ${chain.length}`:'';e.hidden=chain.length<2;}));
 const pages=[...document.querySelectorAll('section.page')];pages.forEach((s,i)=>{s.dataset.page=String(i+1);const pg=s.querySelector('.foot .pg');if(pg)pg.textContent=`${i+1} / ${pages.length}`;});
 for(const chain of chains)chain.slice(1).forEach(s=>{const r=s.querySelector('table.flow tbody tr');r&&r.querySelectorAll('td[data-repeat]').forEach(td=>{if(!td.textContent.trim())td.textContent=td.dataset.repeat;});});
 // invariant on the final DOM
 const after=rowsOf().map(t=>t.dataset.k+'#'+canon(t));
 let labelErrors=0;for(const td of document.querySelectorAll('table.flow td[data-repeat]')){const t=td.textContent.trim();if(t&&t!==td.dataset.repeat.trim())labelErrors++;}
 const same=before.length===after.length&&before.every((v,i)=>v===after[i]);
 return {tables:chains.length,rows:before.length,pagesAdded:chains.reduce((s,c)=>s+c.length-1,0),unsplittable,oversized,labelErrors,ok:same&&!unsplittable&&!labelErrors,rowText};}
