/* GOV-07 · Calidad y continuidad de la vista 3D. Núcleo puro: sin DOM, sin WebGL, sin reloj propio (el tiempo entra
   como argumento), así que se prueba en Node con tiempos sintéticos.

   1) createGovernor: DPR adaptativo. Parte de min(DPR del dispositivo, tope) y, con la mediana de los cuadros de una
      ventana, baja por escalones de 0,5 si el dispositivo no llega al presupuesto; sube solo si el coste estimado del
      escalón superior (proporcional al número de píxeles, ratio²) cabe con margen. Nunca baja de minRatio (1 por
      defecto: la nitidez de una pantalla normal) ni sube del tope (2). Con DPR 1 no hay nada que decidir.
   2) createContextMonitor: estados de la pérdida del contexto WebGL. ok → lost → (restored → ok) | (sin respuesta en
      restoreTimeoutMs → failed). Si se pierde repeatLimit veces en repeatWindowMs, pide degradar (menos píxeles y
      sin sombras) para que no vuelva a pasar.

   No mide nada por sí mismo ni promete rendimiento en un dispositivo concreto: decide con lo que se le mide. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanGlQuality=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const GOVERNOR_DEFAULTS=Object.freeze({cap:2,minRatio:1,step:.5,budgetMs:34,headroom:.75,windowFrames:60,warmupFrames:30,cooldownFrames:90,goodWindowsToRaise:2,ignoreAboveMs:500});
  const round=x=>Math.round(x*100)/100;
  const median=a=>{const s=[...a].sort((x,y)=>x-y),m=s.length>>1;return s.length%2?s[m]:(s[m-1]+s[m])/2;};

  function levelsFor(deviceRatio,{cap,minRatio,step}){
    const max=round(Math.max(minRatio,Math.min(cap,Number(deviceRatio)||1)));const out=[max];
    for(let r=round(max-step);r>minRatio+1e-9;r=round(r-step))out.push(r);
    if(out[out.length-1]!==minRatio)out.push(minRatio);
    return out;
  }

  function createGovernor({deviceRatio=1,...options}={}){
    const o={...GOVERNOR_DEFAULTS,...options};
    if(!(o.minRatio>0)||!(o.cap>=o.minRatio)||!(o.step>0)||!(o.budgetMs>0))throw new TypeError('gl-quality: opciones del gobernador no válidas');
    let levels=levelsFor(deviceRatio,o),i=0,win=[],warm=o.warmupFrames,cool=0,good=0,pinned=false;const history=[];
    const state=()=>({ratio:levels[i],max:levels[0],min:levels[levels.length-1],levels:[...levels],pinned,history:history.map(h=>({...h}))});
    function move(to,reason,medianMs){const from=levels[i];i=to;win=[];cool=o.cooldownFrames;good=0;const ev={from,to:levels[i],reason,medianMs:round(medianMs)};history.push(ev);return ev;}
    return {
      get ratio(){return levels[i];},get max(){return levels[0];},get adaptive(){return levels.length>1&&!pinned;},state,
      /* Un cuadro medido (ms entre dos cuadros pintados). Devuelve el cambio decidido o null. Los cuadros fuera de rango
         (pestaña oculta, pausa del depurador) no cuentan. */
      sample(ms){
        if(!(ms>0)||ms>o.ignoreAboveMs||levels.length<2||pinned)return null;
        if(warm>0){warm--;return null;}if(cool>0){cool--;return null;}
        win.push(ms);if(win.length<o.windowFrames)return null;
        const m=median(win);win=[];
        if(m>o.budgetMs&&i<levels.length-1)return move(i+1,'slow',m);
        if(i>0&&m*(levels[i-1]/levels[i])**2<o.budgetMs*o.headroom){good++;if(good>=o.goodWindowsToRaise)return move(i-1,'fast',m);return null;}
        good=0;return null;
      },
      /* Degradación controlada pedida desde fuera (p. ej. pérdidas de contexto repetidas): el mínimo, y fijo. */
      forceMin(reason='forced'){if(pinned)return null;const from=levels[i];i=levels.length-1;pinned=true;win=[];const ev={from,to:levels[i],reason,medianMs:null};history.push(ev);return ev;},
      /* Las capturas a tamaño fijo usan su propia resolución: al volver, se mide de nuevo desde el nivel vigente. */
      resetWindow(){win=[];warm=o.warmupFrames;good=0;},
    };
  }

  const MONITOR_DEFAULTS=Object.freeze({restoreTimeoutMs:6000,repeatWindowMs:120000,repeatLimit:2});
  function createContextMonitor(options={}){
    const o={...MONITOR_DEFAULTS,...options};let state='ok',lostAt=null,losses=[],restores=0,degraded=false;const log=[];
    const snap=()=>({state,losses:losses.length,restores,degraded,lostAt,log:log.map(e=>({...e}))});
    return {
      get state(){return state;},get degraded(){return degraded;},snapshot:snap,
      lost(t){if(state==='lost')return {changed:false,...snap()};state='lost';lostAt=t;losses.push(t);log.push({t,event:'lost'});
        return {changed:true,...snap()};},
      /* Al volver el contexto: si se ha perdido repeatLimit veces en la ventana, degrade=true (una sola vez). */
      restored(t){if(state==='ok')return {changed:false,degrade:false,...snap()};const was=state;state='ok';lostAt=null;restores++;log.push({t,event:'restored',after:was});
        const recent=losses.filter(x=>t-x<=o.repeatWindowMs).length;const degrade=!degraded&&recent>=o.repeatLimit;if(degrade)degraded=true;return {changed:true,degrade,...snap()};},
      /* Llamar con el reloj: si el navegador no devuelve el contexto a tiempo, el estado pasa a failed (y se dice). */
      tick(t){if(state==='lost'&&t-lostAt>=o.restoreTimeoutMs){state='failed';log.push({t,event:'failed'});return {changed:true,...snap()};}return {changed:false,...snap()};},
    };
  }
  return Object.freeze({GOVERNOR_DEFAULTS,MONITOR_DEFAULTS,levelsFor:(r,opt={})=>levelsFor(r,{...GOVERNOR_DEFAULTS,...opt}),createGovernor,createContextMonitor});
});
