/* Asesor RUBIK en vivo · LABORATORIO SIMULADO · interfaz. Une el adaptador simulado con RUBIK real (iframe). */
(function(){'use strict';
 const $=s=>document.querySelector(s),frame=$('#rubik');let sim=null,rubik=null,lastFail='';
 const log=(t,cls='')=>{const li=document.createElement('li');li.textContent=t;if(cls)li.className=cls;$('#log').prepend(li);};
 const setLive=on=>{for(const e of [$('#say'),$('#sayBtn'),...document.querySelectorAll('#chips .chip')])e.disabled=!on;$('#close').disabled=!on&&sim?.state!=='connecting';$('#start').disabled=on||sim?.state==='connecting';};
 const STATE={connecting:'Conectando… (simulado)',live:'En conversación · sesión simulada',ended:'Conversación terminada',error:'No se pudo continuar',idle:'Listo para empezar'};
 function showResults(name,r){const box=$('#results');box.replaceChildren();
  if(!r.ok){const p=document.createElement('p');p.className='denied';p.dataset.denied=r.error;p.textContent='✕ Rechazado: '+(r.motivo||r.error);box.append(p);return;}
  if(name==='consultar_superficies'){const t=document.createElement('table');t.innerHTML='<caption>Superficie útil por estancia</caption><thead><tr><th>Estancia</th><th>m²</th><th>Estado</th></tr></thead>';const tb=document.createElement('tbody');
   for(const e of r.data.estancias){const tr=document.createElement('tr');for(const v of [e.nombre,Number.isFinite(e.m2)?e.m2.toLocaleString('es-ES',{minimumFractionDigits:2,maximumFractionDigits:2}):'—',e.estado==='measured'?'Medida':e.estado==='estimated'?'Estimada':'Sin dato'])tr.append(Object.assign(document.createElement('td'),{textContent:v}));tb.append(tr);}
   t.append(tb);const f=document.createElement('tfoot');f.innerHTML=`<tr><th>Total</th><th>${r.data.totalM2.toLocaleString('es-ES',{minimumFractionDigits:2})}</th><th></th></tr>`;t.append(f);box.append(t);
   const s=document.createElement('p');s.className='muted';s.textContent='Fuente: '+r.fuente+' (motor de RUBIK sobre el proyecto activo).';box.append(s);return;}
  const p=document.createElement('p');p.className='ok';p.textContent=name==='enfocar_estancia'?`✓ ${r.data.estancia} seleccionada en el plano.`:name==='continuar_por_texto'?'✓ Asistente de texto abierto en RUBIK.':'✓ Hecho.';box.append(p);}
 function onEvent(e){
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
 frame.addEventListener('load',()=>{const w=frame.contentWindow;const t=setInterval(()=>{const b=w.document.querySelector('#welcomeExample');if(b&&w.FloorPlanApp){clearInterval(t);b.click();setTimeout(()=>{rubik=AsesorSim.rubikBridge(w);document.body.dataset.ready='1';log('Visor listo: vivienda de ejemplo');},600);}},150);});
 $('#start').addEventListener('click',e=>{if(!ready()){log('El visor aún no está listo.','denied');return;}
  $('#error').hidden=true;sim?.close();lastFail=$('#failSel').value;
  sim=new AsesorSim.SimAdapter({rubik,profile:$('#profile').value,mode:document.querySelector('input[name=mode]:checked').value,onEvent,failWith:lastFail||null});
  sim.start(e);});
 $('#close').addEventListener('click',()=>{sim?.close();$('#subtitle').textContent='';$('#start').focus();});
 $('#retry').addEventListener('click',e=>{$('#error').hidden=true;if(!sim?.retry(e)){$('#retry').hidden=true;}});
 const toText=()=>{sim?.close();if(!ready())return;rubik.openTextAssistant(null);log('Continuar por texto: Asistente de texto de RUBIK abierto (sin traspasar conversación).','ok');};
 $('#toText').addEventListener('click',toText);$('#errToText').addEventListener('click',()=>{$('#error').hidden=true;toText();});
 $('#dropConn').addEventListener('click',()=>sim?.simulate('connection_lost'));
 $('#talk').addEventListener('submit',e=>{e.preventDefault();const t=$('#say').value.trim();if(!t)return;$('#say').value='';sim?.hear(t);});
 for(const c of document.querySelectorAll('#chips .chip'))c.addEventListener('click',()=>sim?.hear(c.dataset.say));
 for(const r of document.querySelectorAll('input[name=mode]'))r.addEventListener('change',()=>{if(sim&&sim.state==='live'){sim.close();log('Modo cambiado: la conversación se cerró; vuelve a iniciarla.');}});
 // Cambio de proyecto en el visor → desvincular la conversación.
 setInterval(()=>{if(sim&&sim.state==='live'&&rubik&&rubik.project()?.id!==sim.projectId)sim.unbind();},500);
 window.AsesorLab={get sim(){return sim;},get rubik(){return rubik;}};
})();
