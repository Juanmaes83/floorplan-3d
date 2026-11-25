/* Asesor RUBIK en vivo · LABORATORIO SIMULADO · interfaz. Une el adaptador simulado con RUBIK real (iframe). */
(function(){'use strict';
 const $=s=>document.querySelector(s),frame=$('#rubik');let sim=null,rubik=null,lastFail='',textMode=false;
 const log=(t,cls='')=>{const li=document.createElement('li');li.textContent=t;if(cls)li.className=cls;$('#log').prepend(li);};
 const setLive=on=>{for(const e of [$('#say'),$('#sayBtn'),...document.querySelectorAll('#chips .chip')])e.disabled=!on;$('#close').disabled=!on&&sim?.state!=='connecting';$('#start').disabled=on||sim?.state==='connecting';};
 const isLive=()=>$('#transport').value==='live';
 const STATE={get connecting(){return isLive()?'Conectando con el servicio de voz…':'Conectando… (simulado)';},get live(){return isLive()?'En conversación · conexión real (Preview privado)':'En conversación · sesión simulada';},ended:'Conversación terminada',error:'No se pudo continuar',idle:'Listo para empezar'};
 function showResults(name,r){const box=$('#results');box.replaceChildren();
  if(!r.ok){const p=document.createElement('p');p.className='denied';p.dataset.denied=r.error;p.textContent='✕ Rechazado: '+(r.motivo||r.error);box.append(p);return;}
  if(name==='consultar_superficies'){const t=document.createElement('table');t.innerHTML='<caption>Superficie útil por estancia</caption><thead><tr><th>Estancia</th><th>m²</th><th>Estado</th></tr></thead>';const tb=document.createElement('tbody');
   for(const e of r.data.estancias){const tr=document.createElement('tr');for(const v of [e.nombre,Number.isFinite(e.m2)?e.m2.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—',e.estado==='measured'?'Medida':e.estado==='estimated'?'Estimada':'Sin dato'])tr.append(Object.assign(document.createElement('td'),{textContent:v}));tb.append(tr);}
   t.append(tb);const f=document.createElement('tfoot');f.innerHTML=`<tr><th>Total</th><th>${r.data.totalM2.toLocaleString('es-ES',{minimumFractionDigits:2})}</th><th></th></tr>`;t.append(f);box.append(t);
   const s=document.createElement('p');s.className='muted';s.textContent='Fuente: '+r.fuente+' (motor de RUBIK sobre el proyecto activo).';box.append(s);return;}
  const p=document.createElement('p');p.className='ok';p.textContent=name==='enfocar_estancia'?`✓ ${r.data.estancia} seleccionada en el plano.`:name==='continuar_por_texto'?'✓ Asistente de texto abierto en RUBIK.':'✓ Hecho.';box.append(p);}
 function onEvent(e){
  if(e.type==='session'){log('Conversación creada por el servidor · tope '+e.maxSessionSeconds+' s · herramientas: '+(e.tools||[]).join(', '));}
  if(e.type==='provider_event')log('Evento: '+e.name);
  if(e.type==='speaking'||e.type==='state'){const v=$('#avatarVideo');v.hidden=!v.srcObject;}
  if(e.type==='state'){$('#state').textContent=STATE[e.state]||e.state;setLive(e.state==='live');if(e.state!=='live')$('#avatar').classList.remove('speaking');log('Estado: '+(STATE[e.state]||e.state));}
  if(e.type==='speaking')$('#avatar').classList.toggle('speaking',!!e.on);
  if(e.type==='subtitle')$('#subtitle').textContent=e.text;
  if(e.type==='user')log('Tú: '+e.text,'user');
  if(e.type==='tool_call')log('Herramienta: '+e.name,'tool');
  if(e.type==='tool_result'){showResults(e.name,e.result);log(e.result.ok?'Resultado correcto':'Rechazada: '+e.result.error,e.result.ok?'ok':'denied');}
  if(e.type==='error'){$('#state').textContent=STATE.error;setLive(false);$('#start').disabled=false;$('#error').hidden=false;$('#errorMsg').textContent=e.message+(e.status?` (${e.status})`:'');$('#errorMsg').dataset.code=e.code;$('#retry').hidden=!e.retry;$('#retry').textContent=e.afterS?`Reintentar (espera ${e.afterS} s)`:'Reintentar';log('Error simulado: '+e.code,'denied');$('#errToText').focus();}
  if(e.type==='unbound'){$('#state').textContent=e.message;setLive(false);$('#start').disabled=false;log(e.message,'denied');}
  if(e.type==='blocked')log('Inicio bloqueado: hace falta que lo pulses tú.','denied');}
 function ready(){const w=frame.contentWindow;return !!(w&&w.FloorPlanApp?.project&&w.RubikAssistantDomainTools&&w.RubikAssistantUI&&typeof w.select==='function');}
 // Vivienda de ejemplo en el visor (la misma que abre «Ver ejemplo» en la Home).
 frame.addEventListener('load',()=>{const w=frame.contentWindow;const t=setInterval(()=>{const b=w.document.querySelector('#welcomeExample');if(b&&w.FloorPlanApp){clearInterval(t);b.click();setTimeout(()=>{rubik=AsesorSim.rubikBridge(w);rubik.advisorText=()=>setTimeout(()=>{if(sim&&sim.state!=='ended')sim.close();textMode=true;$('#say').disabled=false;$('#sayBtn').disabled=false;for(const c of document.querySelectorAll('#chips .chip'))c.disabled=false;$('#state').textContent='Por texto con el asesor (mismas consultas del modo cliente)';$('#say').focus();},0);document.body.dataset.ready='1';log('Visor listo: vivienda de ejemplo');},600);}},150);});
 $('#start').addEventListener('click',e=>{if(!ready()){log('El visor aún no está listo.','denied');return;}
  $('#error').hidden=true;sim?.close();lastFail=$('#failSel').value;
  const mode=document.querySelector('input[name=mode]:checked').value,profile=$('#profile').value;
  if($('#transport').value==='live'){
   // Conexión real: solo modo cliente; el servidor decide si está habilitada (cerrada por defecto).
   if(mode!=='cliente'){log('La conexión real solo admite el modo cliente en este piloto.','denied');return;}
   sim=new AsesorNuance.NuanceLiveAdapter({rubik,profile,mode,onEvent,operatorCode:$('#opCode').value,allowMock:new URLSearchParams(location.search).get('mock-provider')==='1',
    avatar:{video:$('#avatarVideo'),audio:$('#avatarAudio')}});
  }else sim=new AsesorSim.SimAdapter({rubik,profile,mode,onEvent,failWith:lastFail||null});
  sim.start(e);});
 $('#transport').addEventListener('change',()=>{const live=$('#transport').value==='live';$('#opRow').hidden=!live;$('#badgeSim').textContent=live?'Conexión real (Preview privado)':'Sesión simulada';$('#badgeOff').hidden=live;
  document.querySelector('.status .note').textContent=live?'El asesor solo empieza cuando tú lo pulsas. Usa tu micrófono (con cancelación de eco), nunca tu cámara. La sesión tiene un tope de tiempo fijado por el servidor.':'El asesor solo empieza cuando tú lo pulsas. No usa cámara ni micrófono en este laboratorio.';sim?.close();});
 $('#close').addEventListener('click',()=>{sim?.close();$('#subtitle').textContent='';$('#start').focus();});
 $('#retry').addEventListener('click',e=>{$('#error').hidden=true;if(!sim?.retry(e)){$('#retry').hidden=true;}});
 const toText=()=>{sim?.close();if(!ready())return;const mode=document.querySelector('input[name=mode]:checked').value;
  if(mode==='cliente'){rubik.advisorText();log('Continuar por texto: con el asesor, mismas consultas del modo cliente (sin costes internos ni edición).','ok');}
  else{rubik.openTextAssistant(null);log('Continuar por texto: Asistente de texto de RUBIK abierto (sin traspasar conversación).','ok');}};
 $('#toText').addEventListener('click',toText);$('#errToText').addEventListener('click',()=>{$('#error').hidden=true;toText();});
 $('#dropConn').addEventListener('click',()=>sim?.simulate('connection_lost'));
 const say=t=>{if(sim&&sim.state==='live')return sim.hear(t);if(textMode&&rubik){const s=new AsesorSim.SimAdapter({rubik,profile:$('#profile').value,mode:'cliente',onEvent});s.state='live';s.projectId=rubik.project()?.id;s._say=()=>{};return s.hear(t);}};
 $('#talk').addEventListener('submit',e=>{e.preventDefault();const t=$('#say').value.trim();if(!t)return;$('#say').value='';say(t);});
 for(const c of document.querySelectorAll('#chips .chip'))c.addEventListener('click',()=>say(c.dataset.say));
 for(const r of document.querySelectorAll('input[name=mode]'))r.addEventListener('change',()=>{if(sim&&sim.state==='live'){sim.close();log('Modo cambiado: la conversación se cerró; vuelve a iniciarla.');}});
 // Cambio de proyecto en el visor → desvincular la conversación.
 setInterval(()=>{if(sim&&sim.state==='live'&&rubik&&rubik.project()?.id!==sim.projectId)sim.unbind();},500);
 // ---- Asesoría guiada (skills socráticos) ----
 let mentor=null;const M=()=>{const mode=document.querySelector('input[name=mode]:checked').value;if(!mentor||mentor.mode!==mode){const keep=mentor?.memoria;mentor=new AsesorSkills.Mentor({rubik,mode});if(keep)mentor.memoria=keep;}return mentor;};
 const paintMem=()=>{const m=M().memoria;$('#memView').textContent=[m.nombre&&'Nombre: '+m.nombre,m.tarea&&'Tarea: '+m.tarea,m.mision&&'Misión: '+m.mision].filter(Boolean).join(' · ')||'Aún no recuerdo nada.';
  const w=$('#mentorWarn');w.replaceChildren();for(const a of M().avisos){const li=document.createElement('li');li.textContent=a;w.append(li);}};
 const show=r=>{$('#mentorQ').textContent=r.texto;$('#mentorQ').dataset.tipo=r.tipo;$('#mentorForm').hidden=!(r.tipo==='pregunta'||r.tipo==='aviso');$('#mentorConfirm').hidden=r.tipo!=='confirmar';
  if(r.legal&&!M().avisos.includes(r.legal))M().avisos.push(r.legal);if(r.tipo==='propuesta'){$('#mentorOut').textContent=r.texto;$('#mentorQ').textContent='';}
  paintMem();if(!$('#mentorForm').hidden)$('#mentorA').focus();else if(!$('#mentorConfirm').hidden)$('#mentorYes').focus();};
 $('#memSave').addEventListener('click',()=>{if(!rubik)return;for(const [k,id] of [['nombre','#memNombre'],['tarea','#memTarea'],['mision','#memMision']]){const v=$(id).value;if(v.trim())M().recuerda(k,v);$(id).value='';}paintMem();});
 $('#memForget').addEventListener('click',()=>{M().olvida();M().avisos.length=0;$('#mentorOut').textContent='';$('#mentorQ').textContent='';$('#mentorForm').hidden=true;$('#mentorConfirm').hidden=true;paintMem();});
 for(const c of document.querySelectorAll('#skillChips .chip'))c.addEventListener('click',()=>{if(!rubik)return;$('#mentorOut').textContent='';show(M().empieza(c.dataset.skill));});
 $('#mentorForm').addEventListener('submit',e=>{e.preventDefault();const v=$('#mentorA').value;$('#mentorA').value='';if(v.trim())show(M().responde(v));});
 $('#mentorYes').addEventListener('click',()=>show(M().confirma(true)));$('#mentorNo').addEventListener('click',()=>show(M().confirma(false)));
 window.AsesorLab={get sim(){return sim;},get rubik(){return rubik;},get mentor(){return mentor;}};
})();
