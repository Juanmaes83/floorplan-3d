/* GOV-07 · Guarda de la vista 3D de la Evolución. Se engancha a la escena ya creada (createProjectScene) sin cambiarla:
   usa su renderer, su canvas y su resize(). Hace tres cosas:

   1) Pérdida del contexto WebGL: antes, la vista desaparecía sin aviso. Ahora se dice qué ha pasado y que el plan sigue
      funcionando; si el navegador devuelve el contexto, Three vuelve a subir la escena y el aviso se retira; si no lo
      devuelve a tiempo, se ofrece recargar la vista (el proyecto está guardado en la biblioteca: no se pierde nada).
   2) Pérdidas repetidas: degradación controlada y dicha (DPR 1 y sin sombras) para que no vuelva a pasar.
   3) DPR adaptativo en pantallas de alta densidad: baja la resolución interna si el dispositivo no llega y la sube si
      sobra. Nunca por debajo de 1. Con DPR 1 no hace nada. Cede el control a quien fije otro tamaño (grabación de vídeo).

   Las decisiones son del núcleo puro js/gl-quality-core.js. Aquí solo hay DOM y medición. */
import '../js/gl-quality-core.js';

const COPY={
  lost:'<strong>Vista 3D interrumpida.</strong> El navegador ha liberado la tarjeta gráfica (otra pestaña o aplicación, falta de memoria o el dispositivo en reposo). Intentando recuperarla… El plan, las fechas y la ficha siguen funcionando.',
  failed:'<strong>No se ha podido recuperar la vista 3D en este dispositivo.</strong> El plan de obra y la ficha siguen disponibles. El proyecto está guardado: recargar no pierde nada.',
  degraded:'Calidad 3D reducida para mantener la vista estable',
  unavailable:'<strong>Este navegador no puede mostrar la vista 3D</strong> (WebGL desactivado, bloqueado o no disponible en este dispositivo). El plan de obra, las fechas, la ficha de cada trabajo y los importes siguen disponibles.',
};

/* Sin WebGL, la Evolución se quedaba en «Cargando…» para siempre y el plan no se podía consultar. Ahora se crea una
   escena nula con la misma API (no dibuja nada) y el resto de la página funciona; el aviso lo pone attachGlGuard. */
export function createSceneSafely(create,canvas){
  try{return create(canvas);}catch(error){return createUnavailableScene(canvas,error);}
}
export function createUnavailableScene(canvas,error=null){
  const pose={position:[12,9,12],target:[0,0,0],fov:45,offset:null};const noop=()=>{};
  return {unavailable:true,reason:String(error?.message||error||'WebGL no disponible'),canvas,renderer:null,
    get userMoved(){return false;},screenBounds:()=>null,set onResize(fn){},get size(){return [canvas.clientWidth,canvas.clientHeight];},
    load:noop,setState:noop,highlight:noop,pick:()=>null,hitsAt:()=>[],presentationPose:()=>({...pose}),setFootprint:noop,get footprintVisible(){return false;},
    setPose:noop,frameEnvelope:()=>({...pose}),resize:noop,inspect:()=>[],setRenderSize:noop,releaseRenderSize:noop,orbitPose:()=>({...pose}),renderNow:noop,
    setSuspended:noop,setAuto:noop,setRoofVisible:noop,get roofVisible(){return true;},get pose(){return {...pose};},get visiblePieces(){return 0;},get objectCount(){return 0;},dispose:noop};
}

export function attachGlGuard(scene,{host=scene.canvas.parentElement,core=globalThis.FloorPlanGlQuality,restoreTimeoutMs,governorOptions={},now=()=>performance.now(),reload=()=>location.reload()}={}){
  if(scene?.unavailable)return unavailableNotice(scene,host);
  const {renderer,canvas}=scene;if(!renderer||!canvas||!core)return null;
  const governor=core.createGovernor({...governorOptions,deviceRatio:window.devicePixelRatio||1});
  const monitor=core.createContextMonitor(restoreTimeoutMs?{restoreTimeoutMs}:{});
  let applied=renderer.getPixelRatio(),lastFrame=0,timer=0,raf=0;
  // Every listener of this guard goes with it: dispose() removes them all (no duplicated callbacks if re-attached).
  const ac=new AbortController(),on={signal:ac.signal};
  const events=[];const note=(type,extra={})=>{events.push({t:Math.round(now()),type,...extra});if(events.length>50)events.shift();};

  // Aviso accesible dentro del escenario. No tapa los controles: el plan de debajo sigue usable.
  const box=document.createElement('div');box.className='gl-guard';box.setAttribute('role','status');box.setAttribute('aria-live','polite');box.hidden=true;
  // Velo sobre la escena (sin capturar el puntero: lo de fuera del escenario sigue usable) y el mensaje centrado.
  const veil=document.createElement('div');veil.className='gl-guard-veil';veil.hidden=true;
  Object.assign(veil.style,{position:'absolute',inset:'0',background:'rgba(231,230,226,.92)',zIndex:'6',pointerEvents:'none'});
  Object.assign(box.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(440px,calc(100% - 32px))',boxSizing:'border-box',padding:'14px 16px',background:'#fff',color:'#1d2124',border:'1px solid #c9c6bf',borderLeft:'4px solid #a8621c',borderRadius:'6px',font:'14px/1.45 system-ui,sans-serif',zIndex:'7',boxShadow:'0 6px 24px rgba(0,0,0,.12)'});
  const text=document.createElement('p');text.style.margin='0';box.append(text);
  const btn=document.createElement('button');btn.type='button';btn.className='btn';btn.textContent='Recargar la vista';btn.hidden=true;Object.assign(btn.style,{marginTop:'10px',minHeight:'44px',padding:'0 16px',cursor:'pointer'});
  btn.addEventListener('click',()=>reload());box.append(btn);
  const chip=document.createElement('div');chip.className='gl-guard-chip';chip.setAttribute('role','status');chip.hidden=true;
  // En pantallas estrechas se ve «Calidad 3D reducida»; el resto de la frase sigue ahí para los lectores de pantalla.
  const chipHead=document.createElement('span'),chipRest=document.createElement('span');chipHead.textContent='Calidad 3D reducida';chipRest.textContent=COPY.degraded.slice('Calidad 3D reducida'.length);chip.append(chipHead,chipRest);
  const SR={position:'absolute',width:'1px',height:'1px',overflow:'hidden',clip:'rect(0 0 0 0)',whiteSpace:'nowrap'},NOSR={position:'',width:'',height:'',overflow:'',clip:'',whiteSpace:''};
  Object.assign(chip.style,{position:'absolute',left:'50%',top:'12px',transform:'translateX(-50%)',maxWidth:'calc(100% - 32px)',padding:'4px 10px',background:'#fff7ec',color:'#5c3a12',border:'1px solid #e5c79f',borderRadius:'999px',font:'12px/1.4 system-ui,sans-serif',zIndex:'5',pointerEvents:'none',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'});
  if(host&&getComputedStyle(host).position==='static')host.style.position='relative';
  host?.append(veil,box,chip);
  /* El aviso de calidad reducida no debe tapar el título, sus etiquetas ni los botones de la vista (en el móvil tapaba
     «FIXTURE A»). Se prueban varias posiciones y se usa la primera que no se cruza con ningún texto o control visible
     del visor; si ninguna está libre, la que menos tapa. Se recoloca cuando el visor cambia de tamaño. */
  const SPOTS=[{top:'12px',left:'50%',transform:'translateX(-50%)'},{top:'12px',right:'12px'},{bottom:'12px',left:'50%',transform:'translateX(-50%)'},{bottom:'12px',left:'12px'},{top:'12px',left:'12px'}];
  const mine=new Set([canvas,veil,box,chip]);
  const obstacles=()=>[...(host?.querySelectorAll('*')||[])].filter(el=>{if(mine.has(el)||[...mine].some(m=>m.contains(el)))return false;
    const r=el.getBoundingClientRect();if(r.width<2||r.height<2)return false;const cs=getComputedStyle(el);if(cs.visibility==='hidden'||cs.display==='none'||Number(cs.opacity)===0)return false;
    return el.matches('button,select,input,[role=button]')||el.children.length===0||[...el.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());}).map(el=>el.getBoundingClientRect());
  const overlap=(a,b)=>Math.max(0,Math.min(a.right,b.right)-Math.max(a.left,b.left)+2)*Math.max(0,Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)+2);
  function placeChip(){if(chip.hidden||!host)return;const narrow=host.getBoundingClientRect().width<600;Object.assign(chipRest.style,narrow?SR:NOSR);
    Object.assign(chip.style,narrow?{font:'11px/1.4 system-ui,sans-serif',padding:'3px 8px'}:{font:'12px/1.4 system-ui,sans-serif',padding:'4px 10px'});const obs=obstacles();let best=null;
    // Además de las esquinas y los bordes: justo debajo de lo que ocupa la parte alta del visor (en el móvil, el título).
    const hr=host.getBoundingClientRect(),under=obs.filter(o=>o.top<hr.top+hr.height*.45).reduce((y,o)=>Math.max(y,o.bottom),hr.top);
    const spots=[...SPOTS,{top:Math.round(under-hr.top+8)+'px',left:'50%',transform:'translateX(-50%)'}];
    for(const spot of spots){Object.assign(chip.style,{top:'auto',bottom:'auto',left:'auto',right:'auto',transform:'none'},spot);
      const r=chip.getBoundingClientRect(),hit=obs.reduce((a,o)=>a+overlap(r,o),0);if(!best||hit<best.hit)best={spot,hit};if(hit===0)break;}
    Object.assign(chip.style,{top:'auto',bottom:'auto',left:'auto',right:'auto',transform:'none'},best.spot);chip.dataset.spot=String(spots.indexOf(best.spot));}

  const show=kind=>{text.innerHTML=COPY[kind];btn.hidden=kind!=='failed';box.hidden=false;veil.hidden=false;box.dataset.state=kind;canvas.setAttribute('aria-describedby','glGuardMsg');box.id='glGuardMsg';};
  const hide=()=>{box.hidden=true;veil.hidden=true;delete box.dataset.state;canvas.removeAttribute('aria-describedby');};

  function setRatio(r){applied=r;renderer.setPixelRatio(r);scene.resize();}
  // La Evolución no expone su THREE.Scene: se observa la que Three recibe en cada render (solo para recompilar los
  // materiales al quitar las sombras). Se deshace en dispose().
  let lastScene=null;const render0=renderer.render;renderer.render=function(s,c){lastScene=s;return render0.call(this,s,c);};
  function degrade(reason){
    const ev=governor.forceMin(reason);if(ev&&ev.to!==applied)setRatio(ev.to);
    if(renderer.shadowMap.enabled){renderer.shadowMap.enabled=false;
      // Las sombras forman parte del programa de cada material: hay que recompilarlos.
      const seen=new Set();lastScene?.traverse(o=>{const m=o.material;for(const x of Array.isArray(m)?m:m?[m]:[])if(!seen.has(x)){seen.add(x);x.needsUpdate=true;}});}
    chip.hidden=false;placeChip();note('degraded',{reason,ratio:applied});
  }

  canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();const r=monitor.lost(now());if(!r.changed)return;show('lost');note('lost');
    clearTimeout(timer);const wait=()=>{const t=monitor.tick(now());if(t.changed&&t.state==='failed'){show('failed');note('failed');}else if(monitor.state==='lost')timer=setTimeout(wait,250);};timer=setTimeout(wait,250);},on);
  canvas.addEventListener('webglcontextrestored',()=>{clearTimeout(timer);const r=monitor.restored(now());if(!r.changed)return;hide();note('restored');
    // Three ya ha reiniciado su estado GL; la escena se vuelve a subir en el siguiente render. Mismo tamaño y ratio.
    renderer.setPixelRatio(applied);scene.resize();governor.resetWindow();if(r.degrade)degrade('repeated-context-loss');},on);

  // Medición: solo cuadros reales de la vista visible, con el contexto vivo y con el tamaño que gobierna esta guarda.
  const owned=()=>{const cur=renderer.getPixelRatio();if(cur!==applied){
      // Otro dueño (setRenderSize fija 1 para grabar). Al soltarlo, releaseRenderSize vuelve al DPR por defecto: se
      // reaplica el nivel vigente.
      if(cur===governor.max&&canvas.clientWidth>0&&Math.abs(canvas.width-Math.floor(canvas.clientWidth*cur))<=2){if(governor.ratio!==cur)setRatio(governor.ratio);else applied=cur;governor.resetWindow();return true;}
      return false;}
    return canvas.clientWidth>0&&Math.abs(canvas.width-Math.floor(canvas.clientWidth*cur))<=2;};
  const loop=t=>{raf=requestAnimationFrame(loop);const dt=lastFrame?t-lastFrame:0;lastFrame=t;
    // Primero se recupera el control del tamaño (también degradado: al soltar una grabación se vuelve al nivel fijado).
    if(document.hidden||monitor.state!=='ok'||!owned()||!governor.adaptive)return;
    const ev=governor.sample(dt);if(ev){setRatio(ev.to);note('ratio',ev);}};
  raf=requestAnimationFrame(loop);
  document.addEventListener('visibilitychange',()=>{lastFrame=0;governor.resetWindow();},on);
  let placeT=0;const ro=typeof ResizeObserver!=='undefined'&&host?new ResizeObserver(()=>{clearTimeout(placeT);placeT=setTimeout(placeChip,150);}):null;ro?.observe(host);

  const api={
    get state(){return monitor.state;},get degraded(){return monitor.degraded;},get pixelRatio(){return renderer.getPixelRatio();},get shadows(){return renderer.shadowMap.enabled;},
    get governor(){return governor.state();},get monitor(){return monitor.snapshot();},get events(){return events.map(e=>({...e}));},
    get message(){return box.hidden?null:{state:box.dataset.state,text:text.textContent,action:btn.hidden?null:btn.textContent};},
    get chip(){return chip.hidden?null:chip.textContent;},get chipSpot(){return chip.hidden?null:Number(chip.dataset.spot);},
    dispose(){ac.abort();ro?.disconnect();clearTimeout(placeT);cancelAnimationFrame(raf);clearTimeout(timer);renderer.render=render0;box.remove();veil.remove();chip.remove();},
  };
  return api;
}

function unavailableNotice(scene,host){
  const box=document.createElement('div');box.className='gl-guard';box.id='glGuardMsg';box.setAttribute('role','status');box.dataset.state='unavailable';
  Object.assign(box.style,{position:'absolute',left:'50%',top:'50%',transform:'translate(-50%,-50%)',width:'min(440px,calc(100% - 32px))',boxSizing:'border-box',padding:'14px 16px',background:'#fff',color:'#1d2124',border:'1px solid #c9c6bf',borderLeft:'4px solid #a8621c',borderRadius:'6px',font:'14px/1.45 system-ui,sans-serif',zIndex:'7'});
  const p=document.createElement('p');p.style.margin='0';p.innerHTML=COPY.unavailable;box.append(p);
  if(host&&getComputedStyle(host).position==='static')host.style.position='relative';host?.append(box);
  scene.canvas.setAttribute('aria-describedby','glGuardMsg');
  return {state:'unavailable',degraded:true,pixelRatio:null,shadows:false,governor:null,monitor:null,events:[{type:'unavailable',reason:scene.reason}],
    get message(){return {state:'unavailable',text:p.textContent,action:null};},chip:null,dispose(){box.remove();}};
}
