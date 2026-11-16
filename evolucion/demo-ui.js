/* HOM-04 (provisional) · demo «Descubre cómo evoluciona una obra» (?demo=obra): the closing card of the guided demo.
   When the example plan reaches its end it offers «Volver a ver», «Cómo hacerlo con mi proyecto», «Volver al inicio»
   and «Explorar la obra». It only uses the page's own player (window.__ft3dFidelity); outside the demo it does nothing. */
(function(){
 'use strict';
 if(window.__ft3dSource?.mode!=='demo')return;
 const el=(tag,cls,parent,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;parent?.append(n);return n;};
 let card=null,dismissed=false;
 function show(title,lines,actions){
  if(!card){card=el('div','demo-end',null);card.id='demoEnd';card.setAttribute('role','dialog');card.setAttribute('aria-labelledby','demoEndTitle');document.getElementById('stage')?.closest('.stagewrap')?.append(card);}
  card.replaceChildren();el('h2',null,card,title).id='demoEndTitle';for(const l of lines)el('p',null,card,l);
  const row=el('div','demo-end-actions',card);
  for(const [label,fn,primary,id] of actions){const b=el('button','btn'+(primary?' primary':''),row,label);b.type='button';b.onclick=fn;if(id)b.id=id;}
  card.hidden=false;row.querySelector('.primary')?.focus({preventScroll:true});
 }
 const close=()=>{if(card)card.hidden=true;dismissed=true;};
 const F=()=>window.__ft3dFidelity;
 function end(){
  show('Así avanza una obra en RUBIK',['La vivienda de ejemplo, de la implantación a la retirada del andamio, con su plan de obra semana a semana.'],[
   ['Volver a ver',()=>{close();dismissed=false;F().setPos(0);F().play();},true,'demoReplay'],
   ['Cómo hacerlo con mi proyecto',()=>howTo(),false,'demoHowTo'],
   ['Volver al inicio',()=>{location.href='../';},false,'demoHome'],
   ['Explorar la obra',()=>close(),false,'demoExplore']]);
 }
 function howTo(){
  show('Hazlo con tu proyecto',['1. Abre o crea tu proyecto en RUBIK.','2. Presupuestar → Plan de obra: crea las tareas con sus fechas y vincúlalas a tus muros, huecos y estancias.','3. Pulsa «Ver evolución»: verás tu vivienda construirse según tu plan, con tus importes si los has presupuestado.'],[
   ['Volver al inicio',()=>{location.href='../';},true],['Volver',()=>end()]]);
 }
 // The end of the plan (stage «final») after playing or stepping there: offer the closing card once per arrival.
 window.addEventListener('ft3d8-moment',e=>{const fin=e.detail?.stage==='final';
  if(!fin){dismissed=false;if(card&&!card.hidden)card.hidden=true;return;}
  // The player pauses right after its last frame: check once it has stopped.
  if(!dismissed&&(!card||card.hidden))setTimeout(()=>{if(!dismissed&&!F()?.playing&&F()?.last?.stage==='final'&&(!card||card.hidden))end();},400);});
 window.__ft3dDemo={end,howTo,close};
})();
