/* Entrada desde Home («Hablar con el Asesor» junto al retrato): ?perfil=<id>&desde=home.
   Preselecciona la profesión, pinta su saludo y sus preguntas y ofrece volver a Home («Sesión simulada» ya lo marca #badgeSim).
   No inicia nada: la conversación empieza solo cuando la persona pulsa «Empezar». */
(function(){'use strict';
 const q=new URLSearchParams(location.search),sel=document.getElementById('profile'),P=window.AsesorProfiles;
 const perfil=q.get('perfil');if(perfil&&P.valid(perfil))sel.value=perfil;
 const head=document.getElementById('advTitle');
 const box=document.createElement('div');box.id='advProfile';box.className='profile-intro';box.setAttribute('aria-live','polite');head.after(box);
 const chips=document.getElementById('chips');
 function paint(){const p=P.get(sel.value);box.replaceChildren();if(!p)return;
  const h=document.createElement('p');h.className='profile-greeting';h.textContent=p.saludo;const t=document.createElement('p');t.className='muted profile-tone';t.textContent=p.tono;box.append(h,t);
  for(const c of chips.querySelectorAll('.chip[data-profile-example]'))c.remove();
  for(const [i,e] of [...p.ejemplos.entries()].reverse()){const b=document.createElement('button');b.type='button';b.className='chip';b.dataset.say=e;b.dataset.profileExample=String(i);b.textContent=e;b.disabled=document.getElementById('say').disabled;chips.prepend(b);}}
 sel.addEventListener('change',paint);paint();
 if(q.get('desde')==='home'){const a=document.createElement('a');a.id='advBackHome';a.className='back-home';a.href='../../#inicio';a.textContent='← Volver a la Home';head.before(a);}
})();
