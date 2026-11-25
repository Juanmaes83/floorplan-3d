/* Asesor RUBIK en vivo · ADAPTADOR NUANCE LIVE (transporte directo documentado: eventos por long-poll + sala LiveKit).
   Misma interfaz que SimAdapter (start/hear/close/retry/unbind, eventos onEvent) para que el laboratorio use uno u otro.
   - Inicio SOLO por gesto (isTrusted). El navegador NO crea conversaciones: pide a /api/advisor-session que el servidor
     reserve cuota, cree la conversación con max_session_seconds y le devuelva {conversationId, sessionToken (gastado)}.
   - Eventos: GET {api}/conversation/{id}/events?after=<cursor> con el token, siempre una petición abierta hasta «ended»;
     reintento con el mismo cursor tras fallo (máx. 6 fallos seguidos antes de «admitted»).
   - «admitted» → unirse a la sala (livekit_url + token). Micrófono con echoCancellation/noiseSuppression/autoGainControl;
     cámara del usuario NUNCA (además el token se emite con video.input.camera:false).
   - Topic «nuance_live»: subtítulos (session.output_transcript.delta), fin de habla (session.output_audio.done),
     herramientas (response.event → response.output_item.done function_call) → AsesorTools.run con la autorización del
     modo cliente → response.item.create {function_call_output} + response.create. session.closed → cierre.
   - Cancelar durante la conexión → /api/advisor-session {action:'abandon'}; cerrar en vivo → session.close + {action:'end'}.
     Pistas, bucles y temporizadores se liberan aunque falle la confirmación remota.
   Transporte de sala: LiveKit real (livekit-client, versión fijada) o, SOLO con ?mock-provider=1 y una URL mock://, la sala
   simulada de las pruebas. Este archivo no contiene ninguna clave. */
(function(root){'use strict';
 const LIVEKIT_URL='https://cdn.jsdelivr.net/npm/livekit-client@2.5.7/dist/livekit-client.esm.mjs';
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 // ---- Sala simulada (pruebas): mismo formato de eventos del topic, por HTTP al simulador local --------------------
 class MockRoom{constructor(base,id,token){Object.assign(this,{base,id,token,after:-1,open:true,handlers:[]});}
  async join(){await fetch(`${this.base}/mock-room/${this.id}/join`,{method:'POST',headers:{Authorization:'Bearer '+this.token}});this._loop();
   // Pistas del avatar simuladas: vídeo (lienzo animado) y audio (oscilador silencioso) — como avatar.videoTrack/audioTrack.
   const cv=document.createElement('canvas');cv.width=320;cv.height=240;cv.style.cssText='position:fixed;left:-9999px;top:0;width:1px;height:1px';document.body.append(cv);this._cv=cv;const g=cv.getContext('2d');let f=0;
   this._anim=setInterval(()=>{g.fillStyle=`hsl(${(f++*7)%360} 40% 40%)`;g.fillRect(0,0,320,240);g.fillStyle='#fff';g.font='28px sans-serif';g.fillText('Avatar IA (simulado)',20,130);},100);
   g.fillStyle='#7a2e45';g.fillRect(0,0,320,240);this.videoStream=cv.captureStream(10);const ac=new AudioContext();const o=ac.createOscillator(),gain=ac.createGain();gain.gain.value=0.0001;const d=ac.createMediaStreamDestination();o.connect(gain).connect(d);o.start();
   this._ac=ac;this.audioStream=d.stream;}
  on(h){this.handlers.push(h);}
  async _loop(){while(this.open){try{const r=await fetch(`${this.base}/mock-room/${this.id}/recv?after=${this.after}`,{headers:{Authorization:'Bearer '+this.token}});const j=await r.json();
    for(const ev of j.events||[]){this.after=Number(ev.event_id.slice(4));for(const h of this.handlers)h(ev);}}catch{await sleep(300);}}}
  async send(ev){await fetch(`${this.base}/mock-room/${this.id}/send`,{method:'POST',headers:{Authorization:'Bearer '+this.token,'Content-Type':'application/json'},body:JSON.stringify(ev)});}
  async publishMic(track){this.micTrack=track;}
  async leave(){this.open=false;clearInterval(this._anim);this._cv?.remove();try{this._ac?.close();}catch{}for(const t of [...(this.videoStream?.getTracks()||[]),...(this.audioStream?.getTracks()||[])])t.stop();
   try{await fetch(`${this.base}/mock-room/${this.id}/leave`,{method:'POST',headers:{Authorization:'Bearer '+this.token}});}catch{}}}
 // ---- Sala LiveKit real -------------------------------------------------------------------------------------------
 class LiveKitRoom{constructor(url,token){Object.assign(this,{url,token,handlers:[]});}
  async join(){const LK=await import(LIVEKIT_URL);this.LK=LK;this.room=new LK.Room({adaptiveStream:true});
   this.room.on(LK.RoomEvent.DataReceived,(payload,participant,kind,topic)=>{if(topic!=='nuance_live')return;try{const ev=JSON.parse(new TextDecoder().decode(payload));for(const h of this.handlers)h(ev);}catch{}});
   this.room.on(LK.RoomEvent.TrackSubscribed,track=>{const ms=new MediaStream([track.mediaStreamTrack]);if(track.kind==='video')this.videoStream=ms;else this.audioStream=ms;for(const h of this.handlers)h({type:'_tracks'});});
   await this.room.connect(this.url,this.token,{autoSubscribe:true});}
  on(h){this.handlers.push(h);}
  async send(ev){await this.room.localParticipant.publishData(new TextEncoder().encode(JSON.stringify(ev)),{reliable:true,topic:'nuance_live'});}
  async publishMic(track){await this.room.localParticipant.publishTrack(track,{source:this.LK.Track.Source.Microphone});}
  async leave(){try{await this.room?.disconnect();}catch{}}}

 const ERR={invalid_credential:'La credencial del servicio de voz no es válida. Sigue por texto.',forbidden:'Tu cuenta no tiene acceso al modo de voz. Sigue por texto.',
  concurrency_limit:'Ya hay otra conversación de voz abierta. Ciérrala o sigue por texto.',active_session:'Ya tienes una conversación de voz abierta. Ciérrala o sigue por texto.',
  credits_spent:'Se agotó el saldo del servicio de voz. Sigue por texto.',quota:'Se alcanzó el tope de conversaciones de voz de hoy. Sigue por texto.',
  start_limit:'Se alcanzó el límite de inicios. Espera un momento o sigue por texto.',capacity_unavailable:'El servicio de voz no tiene capacidad ahora. Prueba más tarde o sigue por texto.',
  unavailable:'El servicio de voz no está disponible. Sigue por texto.',code:'El código de operador no es válido.',mic_denied:'No hay permiso para usar el micrófono. Puedes seguir por texto.',
  connection_lost:'Se perdió la conexión con el asesor. Sigue por texto o vuelve a intentarlo.'};
 const RETRY=new Set(['concurrency_limit','active_session','start_limit','capacity_unavailable','unavailable','connection_lost']);

 class NuanceLiveAdapter{
  constructor({rubik,profile,mode,onEvent,operatorCode,endpoint='/api/advisor-session',allowMock=false,avatar}){
   Object.assign(this,{rubik,profile,mode,onEvent,operatorCode,endpoint,allowMock,avatar});this.state='idle';this.retries=0;this.resources=0;this.timers=new Set();this.projectId=null;this.after=0;this.calls=new Set();}
  _emit(type,d={}){this.onEvent?.({type,...d});}
  async _post(body){const r=await fetch(this.endpoint,{method:'POST',headers:{'Content-Type':'application/json','x-rubik-advisor-code':this.operatorCode||''},body:JSON.stringify(body)});let j=null;try{j=await r.json();}catch{}return {status:r.status,body:j};}
  start(evt){if(!evt||evt.isTrusted!==true){this._emit('blocked',{reason:'user_gesture_required'});return false;}
   if(!['idle','ended','error'].includes(this.state))return false;this.state='connecting';this.projectId=this.rubik.project()?.id||null;this._emit('state',{state:'connecting'});
   this._run().catch(e=>this._fail('unavailable',e));return true;}
  async _run(){
   // 1) micrófono con cancelación de eco y sin cámara (antes de reservar nada: si se deniega, no se gasta).
   try{this.mic=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:true,noiseSuppression:true,autoGainControl:true},video:false});this.resources++;}
   catch{return this._fail('mic_denied');}
   if(this.state!=='connecting')return this._release();
   // 2) el servidor reserva cuota y crea la conversación con su tope.
   const r=await this._post({action:'start',mode:this.mode,persona:'sam'});
   if(r.status!==201)return this._fail(r.body?.error||'unavailable',null,r.body?.retryAfterSeconds);
   Object.assign(this,{conv:r.body.conversationId,token:r.body.sessionToken,api:r.body.api,maxSeconds:r.body.maxSessionSeconds});this._emit('session',{conversationId:this.conv,maxSessionSeconds:this.maxSeconds,tools:r.body.tools});
   if(this.state!=='connecting'){await this._post({action:'abandon',conversationId:this.conv});return this._release();}
   this._follow();}
  async _follow(){let fails=0;
   while(this.conv&&this.state!=='ended'&&this.state!=='error'){
    try{const res=await fetch(`${this.api}/conversation/${this.conv}/events?after=${this.after}`,{headers:{Authorization:'Bearer '+this.token}});
     if(!res.ok)throw Error('http '+res.status);const j=await res.json();fails=0;
     for(const ev of j.events||[]){this.after=ev.id;await this._event(ev);}}
    catch{if(this.state==='ended'||this.state==='error')return;fails++;if(this.state==='connecting'&&fails>=6)return this._fail('connection_lost');await sleep(1500);}}}
  async _event(ev){this._emit('provider_event',{name:ev.type});
   if(ev.type==='admitted'&&this.state==='connecting'){
    const mock=/^mock:\/\//.test(ev.livekit_url);if(mock&&!this.allowMock)return this._fail('unavailable');
    this.room=mock?new MockRoom(this.api,this.conv,ev.token):new LiveKitRoom(ev.livekit_url,ev.token);this.resources++;
    this.room.on(e=>this._room(e));await this.room.join();if(this.state!=='connecting'){return this.close();}
    await this.room.publishMic(this.mic.getAudioTracks()[0]);this._attach();}
   if(ev.type==='started'){this.state='live';this._emit('state',{state:'live',secondsRemaining:ev.seconds_remaining??null});}
   if(ev.type==='ended'){if(this.state!=='ended'){this.state='ended';this._release();this._emit('state',{state:'ended',reason:ev.reason});}}}
  _attach(){if(!this.avatar)return;if(this.room.videoStream){this.avatar.video.srcObject=this.room.videoStream;this.avatar.video.play?.().catch(()=>{});}if(this.room.audioStream){this.avatar.audio.srcObject=this.room.audioStream;this.avatar.audio.play?.().catch(()=>{});}}
  async _room(e){
   if(e.type==='_tracks')return this._attach();
   if(e.type==='session.output_transcript.delta'){this._sub=(this._sub||'')+e.delta;this._emit('speaking',{on:true});this._emit('subtitle',{text:this._sub});}
   if(e.type==='session.output_audio.done'){this._emit('speaking',{on:false});this._sub='';}
   if(e.type==='session.input_transcript.done'&&e.transcript)this._emit('user',{text:e.transcript});
   if(e.type==='response.event'&&e.event?.type==='response.output_item.done'&&e.event.item?.type==='function_call'){
    const room=this.room;const it=e.event.item;if(this.calls.has(it.call_id))return;this.calls.add(it.call_id);let args={};try{args=JSON.parse(it.arguments||'{}');}catch{}
    this._emit('tool_call',{name:it.name,args});
    const session={state:this.state,profile:this.profile,mode:this.mode,projectId:this.projectId,rubik:this.rubik};
    const r=root.AsesorTools.run(session,it.name,args);this._emit('tool_result',{name:it.name,result:r});
    // Resultado mínimo: solo lo necesario (sin ids internos ni datos de contacto).
    const out=r.ok?JSON.stringify(r.data):JSON.stringify({error:{message:r.motivo||r.error}});
    // Si la herramienta cerró la voz (p. ej. pasar a texto), la sala ya no existe: no se envía nada más.
    if(!room||this.room!==room){return;}
    await room.send({type:'response.item.create',item:{type:'function_call_output',call_id:it.call_id,output:out.slice(0,24000)}});
    await room.send({type:'response.create'});}
   if(e.type==='error')this._emit('provider_error',{code:e.error?.code});
   if(e.type==='session.closed'&&this.state!=='ended'){this.state='ended';this._release();this._emit('state',{state:'ended',reason:e.reason});}}
  // Texto escrito durante la conversación real: mensaje de la persona en el topic (no es el canal de voz).
  hear(text){if(this.state!=='live'||!this.room)return null;if(this.rubik.project()?.id!==this.projectId){this.unbind();return {ok:false,error:'project_changed'};}
   this._emit('user',{text});this.room.send({type:'response.item.create',item:{type:'message',role:'user',content:[{type:'input_text',text:String(text).slice(0,2000)}]}});this.room.send({type:'response.create'});return {ok:true};}
  _fail(code,err,retryAfter){const was=this.state;this.state='error';const conv=this.conv;this._release();
   if(conv&&was==='connecting')this._post({action:'abandon',conversationId:conv}).catch(()=>{});
   this._emit('error',{code,status:null,message:ERR[code]||ERR.unavailable,retry:RETRY.has(code)&&this.retries<2,afterS:retryAfter||0});}
  simulate(){return false;}
  retry(evt){if(this.state!=='error'||this.retries>=2)return false;this.retries++;this.conv=null;this.after=0;return this.start(evt);}
  unbind(){if(this.state==='live'||this.state==='connecting'){this.close();this._emit('unbound',{message:'El proyecto activo cambió. La conversación se cerró para no mezclar datos.'});}}
  close(){const was=this.state,conv=this.conv;this.state='ended';
   if(this.room)this.room.send({type:'session.close'}).catch(()=>{});
   if(conv)this._post({action:was==='connecting'?'abandon':'end',conversationId:conv}).catch(()=>{});
   this._release();this._emit('state',{state:'ended',from:was});}
  _release(){for(const t of this.timers)clearTimeout(t);this.timers.clear();for(const t of this.mic?.getTracks()||[])t.stop();this.mic=null;
   const room=this.room;this.room=null;room?.leave();if(this.avatar){this.avatar.video.srcObject=null;this.avatar.audio.srcObject=null;}
   this.resources=0;this._emit('speaking',{on:false});}
 }
 root.AsesorNuance=Object.freeze({NuanceLiveAdapter,LIVEKIT_URL});
})(typeof self!=='undefined'?self:globalThis);
