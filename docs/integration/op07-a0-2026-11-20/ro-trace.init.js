/* A0 · trazador de ResizeObserver para reproducir el residual de WebKit (#273). Se inyecta ANTES de cargar la página:
     await context.addInitScript({path:'labs/sculpt/op-07/a0/ro-trace.init.js'});
   y al terminar (o al fallar) se lee:  const t=await page.evaluate(()=>window.__roTrace.dump());
   No filtra ni silencia nada: no llama a preventDefault, no envuelve en try/catch los callbacks y deja pasar los errores. */
(()=>{
 if(window.__roTrace)return;
 const T0=performance.now(),log=[],errors=[],MAX=4000;let frame=0,inRaf=false,seq=0;
 const now=()=>+(performance.now()-T0).toFixed(2);
 const push=e=>{e.seq=++seq;e.t=now();e.frame=frame;e.inRaf=inRaf;if(log.length<MAX)log.push(e);};
 const desc=el=>{if(!el||!el.tagName)return String(el);const c=typeof el.className==='string'&&el.className.trim()?'.'+el.className.trim().split(/\s+/).slice(0,3).join('.'):'';return el.tagName.toLowerCase()+(el.id?'#'+el.id:'')+c;};
 const box=el=>{try{const r=el.getBoundingClientRect();return [+r.width.toFixed(2),+r.height.toFixed(2)];}catch{return null;}};
 // Contador de fotogramas y fase: ¿el callback de RO corre dentro de un callback de rAF?
 const raf=window.requestAnimationFrame.bind(window);
 const tick=()=>{frame++;raf(tick);};raf(tick);
 window.requestAnimationFrame=cb=>raf(ts=>{const prev=inRaf;inRaf=true;try{return cb(ts);}finally{inRaf=prev;}});
 // Escrituras de estilo: atributo style de cualquier elemento y variables en <html> (headerEnd, fabTop…).
 const watchStyles=()=>new MutationObserver(ms=>{for(const m of ms)push({kind:'style',target:desc(m.target),old:(m.oldValue||'').slice(0,160),now:(m.target.getAttribute('style')||'').slice(0,160)});})
  .observe(document.documentElement,{attributes:true,attributeFilter:['style','class'],attributeOldValue:true,subtree:true});
 if(document.documentElement)watchStyles();else addEventListener('DOMContentLoaded',watchStyles,{once:true});
 const RO=window.ResizeObserver;let obsId=0;
 window.ResizeObserver=class extends RO{
  constructor(cb){const id=++obsId,src=cb.toString().replace(/\s+/g,' ').slice(0,140),targets=new Set();
   super((entries,o)=>{
    const before=[...targets].map(t=>[desc(t),box(t)]);
    push({kind:'ro-enter',obs:id,src,entries:entries.map(e=>({target:desc(e.target),content:[+e.contentRect.width.toFixed(2),+e.contentRect.height.toFixed(2)],border:e.borderBoxSize?.[0]?[+e.borderBoxSize[0].inlineSize.toFixed(2),+e.borderBoxSize[0].blockSize.toFixed(2)]:null}))});
    const r=cb(entries,o);
    const after=[...targets].map(t=>[desc(t),box(t)]);
    const changed=after.filter((a,i)=>JSON.stringify(a)!==JSON.stringify(before[i]));
    push({kind:'ro-exit',obs:id,changedSync:changed.map((a,i)=>({target:a[0],after:a[1]}))});
    return r;});
   this.__id=id;this.__targets=targets;push({kind:'ro-new',obs:id,src});}
  observe(t,...x){this.__targets.add(t);push({kind:'observe',obs:this.__id,target:desc(t),box:box(t)});return super.observe(t,...x);}
  unobserve(t){this.__targets.delete(t);push({kind:'unobserve',obs:this.__id,target:desc(t)});return super.unobserve(t);}
  disconnect(){push({kind:'disconnect',obs:this.__id});return super.disconnect();}};
 // Errores tal cual llegan (WebKit: «ResizeObserver loop completed with undelivered notifications»).
 addEventListener('error',e=>{const ctx=log.slice(-40);errors.push({t:now(),frame,message:e.message,filename:e.filename,lineno:e.lineno,colno:e.colno,stack:e.error?.stack||null,context:ctx});push({kind:'error',message:e.message});});
 addEventListener('resize',()=>push({kind:'viewport',size:[innerWidth,innerHeight],dpr:devicePixelRatio}));
 document.addEventListener('visibilitychange',()=>push({kind:'visibility',state:document.visibilityState}));
 window.__roTrace={
  mark:label=>push({kind:'mark',label}),
  dump:()=>({ua:navigator.userAgent,viewport:[innerWidth,innerHeight],dpr:devicePixelRatio,frames:frame,
   f02b:!!window.FloorPlanPersistenceEditor?.session,a0:document.getElementById('a0Banner')?.dataset.state||null,
   errors,log})};
})();
