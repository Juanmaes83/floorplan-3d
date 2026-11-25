/* §2.1 · Panel de memoria consentida (comodidad del dispositivo). Usa RubikAssistantUnified.createMemory. */
(function(){'use strict';
 const U=window.RubikAssistantUnified,$=id=>document.getElementById(id);
 let store=null;try{store=window.localStorage;}catch{}
 const m=U.createMemory({storage:store,owner:document.body.dataset.memoryOwner||'este-dispositivo'});
 const status=t=>{$('memStatus').textContent=t;};
 const render=()=>{const on=m.consent();$('memConsent').checked=on;$('memFields').disabled=!on;const v=m.view()||{};
  $('memPref').value=v.nombrePreferido||'';$('memNote').value=v.nota||'';$('memHandoff').checked=m.handoff({}).ok;
  if(!m.available())status('Este navegador no permite guardar datos: el asesor no recordará nada.');};
 $('memConsent').addEventListener('change',e=>{if(e.target.checked){m.grant();status('Memoria activada en este dispositivo.');}else{m.forget();status('Memoria desactivada y borrada.');}render();});
 $('memKeep').addEventListener('click',()=>{const r=[['nombrePreferido',$('memPref').value],['nota',$('memNote').value]].map(([k,v])=>v?m.set(k,v):(m.remove(k),{ok:true}));
  const bad=r.find(x=>!x.ok);status(bad?(bad.reason==='dato-sensible'?'No se guardó: parece un dato sensible (DNI, IBAN, contraseña o tarjeta).':'No se guardó.'):'Guardado en este dispositivo.');if(!bad)render();});
 $('memErase').addEventListener('click',()=>{m.forget();status('Todo borrado.');render();});
 $('memHandoff').addEventListener('change',e=>{e.target.checked?m.authorizeHandoff(['resumen','nombrePreferido']):m.revokeHandoff();status(e.target.checked?'Al pasar a texto se entregará solo: resumen y nombre preferido.':'Traspaso revocado: no se entregará nada.');});
 window.AsesorMemory={memory:m,handoff:resumen=>m.handoff({resumen})};render();
})();
