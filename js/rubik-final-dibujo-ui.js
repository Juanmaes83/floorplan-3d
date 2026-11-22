/* HERO FINAL universal · consumidor C · capa de títulos del epílogo del «Dibujo vivo» (navegador).
 * Un lienzo 2D sobre la vista 3D pinta los títulos de cierre con el contrato común (RubikFinalTitulos.pintar), la misma
 * composición que la previsualización de STUDIO y el vídeo de la Evolución. Identidad: STUDIO / FloorPlanBrand (una sola
 * autoridad; web solo con consentimiento, OP-05). Nombre del proyecto: el título autorizado o nm()/textoVisible (sin chino
 * en ES/EN). No toca el proyecto ni la escena: solo dibuja encima y se retira al terminar. */
(function(){
 'use strict';
 const C=window.RubikFinalCore,T=window.RubikFinalTitulos;if(!C||!T)return;
 const L=()=>{const l=typeof LANG==='string'?LANG:'es';return ['es','en','zh'].includes(l)?l:'es';};
 let cv=null,img=null,ultimo=null,controles=false,boton=null;
 // Interfaz técnica que se retira durante el HERO (sigue en el DOM; vuelve intacta): tarjeta, plano, capas y barra de la demo.
 const UI=['#presentationOverlay .presentation-card','#presentationMinimap','#homeDemoBar','#territoryLayers','#presentationOverlay .presentation-route-status'];
 function interfaz(k){for(const sel of UI)for(const n of document.querySelectorAll(sel)){if(k>=1){n.style.opacity='';n.style.pointerEvents='';}else{n.style.opacity=String(k);n.style.pointerEvents=k<.5?'none':'';}}
  if(k<1&&!boton){const stage=document.getElementById('stage');if(stage){boton=document.createElement('button');boton.type='button';boton.id='rfDibujoControles';boton.className='btn';
   boton.textContent=L()==='en'?'Show controls':L()==='zh'?'显示控制':'Ver controles';Object.assign(boton.style,{position:'absolute',top:'16px',left:'16px',zIndex:'14',minHeight:'44px',padding:'8px 16px',borderRadius:'999px',border:'1px solid rgba(43,40,36,.35)',background:'rgba(251,248,243,.9)',color:'#24211d',font:'600 13px Inter,"Helvetica Neue",Arial,sans-serif',cursor:'pointer'});
   boton.onclick=()=>{controles=true;const play=document.getElementById('presentationStoryPlay');if(window.FloorPlanPresentation?.story?.playing)play?.click();interfaz(1);boton?.remove();boton=null;};stage.append(boton);}}
  if(k>=1){boton?.remove();boton=null;}}
 const logo=src=>{if(!src)return null;if(img?.src!==src){img=new Image();img.src=src;img.onload=()=>ultimo&&estado(ultimo);}return img;};
 function capa(){const stage=document.getElementById('stage');if(!stage)return null;
  if(!cv||!cv.isConnected){cv=document.createElement('canvas');cv.id='rfDibujoTitulos';cv.setAttribute('aria-hidden','true');
   Object.assign(cv.style,{position:'absolute',inset:'0',width:'100%',height:'100%',pointerEvents:'none',zIndex:'4'});
   if(getComputedStyle(stage).position==='static')stage.style.position='relative';stage.append(cv);}
  const r=stage.getBoundingClientRect(),k=Math.min(2,devicePixelRatio||1),W=Math.max(1,Math.round(r.width*k)),H=Math.max(1,Math.round(r.height*k));
  if(cv.width!==W||cv.height!==H){cv.width=W;cv.height=H;}return cv;}
 function firma(){const S=window.RubikStudioHero,st=S?.leer?.(),nombre=window.FloorPlanApp?.project?.name||'';
  return C.firma({marca:S&&st?S.marca(st):null,proyecto:st?.titulo||C.textoVisible(nombre,L()),lang:L(),contexto:'dibujo'});}
 /** Estado de la narrativa (presentationStoryApply): pinta los títulos en su fase de firma; fuera de ella, nada. */
 // La interfaz técnica se retira solo MIENTRAS el epílogo se reproduce; en el final sostenido vuelve entera (barra de la demo,
 // «Volver al inicio», «Continuar presentación»): sobre un final en reposo nada queda tapado ni sin poder pulsarse.
 function estado(st){ultimo=st;const h=st?.hero,quieto=!!h?.fin;interfaz(!h||controles||quieto?1:h.interfaz);if(!h||h.firma<=0){if(cv)cv.getContext('2d').clearRect(0,0,cv.width,cv.height);if(cv)cv.dataset.firma='0';return;}
  const c=capa();if(!c)return;const x=c.getContext('2d');x.clearRect(0,0,c.width,c.height);const f=firma();
  T.pintar(x,c.width,c.height,f,{progreso:h.firma,estilo:f.estilo,logo:logo(f.logo)});c.dataset.firma=String(h.firma);c.dataset.fase=h.fase;}
 function fin(){ultimo=null;controles=false;interfaz(1);cv?.remove();cv=null;}
 window.RubikFinalDibujoUI={estado,fin,get lienzo(){return cv;},get ultimo(){return ultimo;}};
})();
