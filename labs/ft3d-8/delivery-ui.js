/* FT3D-8 lab · «Entrega al cliente»: brand (FloorPlanBrand), evolution video (MediaRecorder, format from
   FloorPlanTourRecorder.pickType), read-only client presentation (FloorPlanConstructionDelivery.clientDocument) and an
   optional link through the EXISTING /api/share + /api/view. Everything uses the project, plan and budget selected in
   the lab (window.__ft3dFidelity). Nothing is published without explicit consent; the editable project never leaves.
   Brand profiles of this browser are only READ; the lab test brand lives in memory and is lost on reload. */
const B=window.FloorPlanBrand,D=window.FloorPlanConstructionDelivery,P=window.FloorPlanConstructionLabPresenter,Rec=window.FloorPlanTourRecorder,Fid=()=>window.__ft3dFidelity;
const $=id=>document.getElementById(id);
const esc=s=>String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const W=1280,H=720,FPS=30,BITRATE=1_400_000,EMBED_LIMIT=12*1024*1024;
const C={dark:'#2b3034',action:'#1f5a66',surface:'#eceeee',ink:'#1f2326',muted:'#5b6266',soft:'#e3ecee',warn:'#7a5200',warnSoft:'#fff4dc'};
const memory=()=>{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};};
const state={labStore:memory(),labProfileId:null,copies:{},source:'none',title:'',intro:'',include:new Set(),costMode:'summary',
  video:null,manifest:null,doc:null,published:null,recording:null,lastError:null,
  // Read-only history of what was actually produced: never cleared when the project or dossier changes.
  history:[]};
const api=window.__ft3dDelivery={state};
const browserProfiles=()=>{try{return B.readProfiles(window.localStorage).profiles;}catch{return [];}};
const entryKey=()=>'ft3d8:'+(Fid().ctx?.model.subject.id||'none');
const sizeText=b=>b>=1048576?(b/1048576).toFixed(2).replace('.',',')+' MB':Math.max(1,Math.round(b/1024))+' KB';
const secs=ms=>(Math.round(ms/100)/10).toString().replace('.',',')+' s';
async function sha256(blob){const buf=await blob.arrayBuffer();return [...new Uint8Array(await crypto.subtle.digest('SHA-256',buf))].map(n=>n.toString(16).padStart(2,'0')).join('');}

/* ---------- brand ---------- */
// The snapshot always comes from FloorPlanBrand.snapshot over the lab's memory storage (never the user's profiles).
// S1: the brand of the dossier is the FloorPlanBrand snapshot associated with THIS subject (never another project's).
const dossierBrand=()=>{const ctx=Fid().ctx;return ctx?.dossier?.authorities.brand.status==='snapshot'?ctx.dossierInput?.brand?.snapshot||null:null;};
const dossierBlock=()=>{const d=Fid().ctx?.dossier;if(!d||d.usable.delivery)return null;
  const errs=d.issues.filter(i=>i.severity==='error').map(i=>i.message);return errs.length?'El expediente tiene incompatibilidades: '+errs.join(' · '):null;};
function snapshot(){
  const ctx=Fid().ctx;if(!ctx||state.source==='none')return null;
  if(state.source==='dossier'){const b=dossierBrand();return b?Object.freeze({...b,title:state.title||b.title,intro:state.intro||b.intro}):null;}
  let profileId=state.labProfileId;
  // A browser profile is COPIED (read-only source) into the lab memory store, once per source profile.
  if(state.source.startsWith('browser:')){const srcId=state.source.slice(8),p=browserProfiles().find(x=>x.id===srcId);if(!p)return null;profileId=B.saveProfile(state.labStore,{...p,id:state.copies[srcId]}).id;state.copies[srcId]=profileId;}
  if(!profileId)return null;
  B.setDelivery(state.labStore,entryKey(),{profileId,title:state.title,intro:state.intro});
  return B.snapshot(state.labStore,entryKey(),ctx.model.subject.name);
}
const currentBrand=()=>D.brandFor(snapshot(),{include:[...state.include]});
function renderBrand(){
  const sel=$('brandSel'),cur=state.source,profiles=browserProfiles();
  const db=dossierBrand();
  sel.innerHTML=`<option value="none">Sin marca (atribución RUBIK)</option>`+(db?`<option value="dossier">Marca del expediente: ${esc(db.profile.name)}</option>`:'')+profiles.map(p=>`<option value="browser:${esc(p.id)}">Mi estudio: ${esc(p.name)} (este navegador)</option>`).join('')+
    `<option value="lab">Marca de prueba de este laboratorio${state.labProfileId?'':' (crear)'}</option>`;
  sel.value=[...sel.options].some(o=>o.value===cur)?cur:'none';
  $('brandBrowserNote').textContent=profiles.length?`${profiles.length} marca(s) guardada(s) en este navegador para este dominio (solo lectura).`
    :'Este dominio no tiene marcas guardadas. Las marcas de Mi estudio se guardan por dominio: una Preview de Vercel no ve las de producción. Usa la marca de prueba del laboratorio.';
  $('labBrandForm').hidden=sel.value!=='lab';
  const b=currentBrand();
  $('brandPreview').innerHTML=b.present?`<div class="bp-head">${b.logo?`<img src="${esc(b.logo)}" alt="">`:''}<div><strong>${esc(b.name)}</strong>${b.tagline?`<small>${esc(b.tagline)}</small>`:''}</div></div>
    <p class="bp-title">${esc(b.title||'—')}</p>${b.intro?`<p>${esc(b.intro)}</p>`:''}<p class="bp-contact">${b.contact?esc(b.contact):'<em>Sin datos de contacto incluidos</em>'}</p><p class="bp-credit">${esc(b.credit)}</p>`
    :`<p><strong>Sin marca.</strong> Se mostrará «${esc(b.credit)}».</p>`;
  $('brandWhere').textContent=b.present?'Aparecerá en la apertura y el cierre del vídeo y en la cabecera y el pie de la presentación. Los materiales de la vivienda no cambian.':'Sin marca: el vídeo y la presentación llevan solo la atribución RUBIK.';
  $('clientHeader').innerHTML=`${b.present&&b.logo?`<img src="${esc(b.logo)}" alt="">`:''}<strong>${esc(b.present?b.name:'RUBIK SOTA')}</strong><span>${esc(b.title||Fid().ctx?.model.subject.name||'')}</span>`;
}
async function readLogo(file){
  // Same rule as FloorPlanBrandUI: PNG/JPEG/WebP re-encoded to PNG (max 600x240), validated by FloorPlanBrand.logo.
  if(!file)return null;if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Object.assign(Error('El logo debe ser PNG, JPG o WebP (no SVG).'),{field:'logo'});
  const bmp=await createImageBitmap(file),k=Math.min(1,600/bmp.width,240/bmp.height),c=document.createElement('canvas');c.width=Math.max(1,Math.round(bmp.width*k));c.height=Math.max(1,Math.round(bmp.height*k));
  c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);return B.logo(c.toDataURL('image/png'));
}
async function saveLabBrand(){
  $('labBrandError').textContent='';
  try{const f=$('labLogo').files[0],logo=f?await readLogo(f):(state.labProfileId?B.readProfiles(state.labStore).profiles.find(p=>p.id===state.labProfileId)?.logo:null);
    const p=B.saveProfile(state.labStore,{id:state.labProfileId||undefined,name:$('labName').value,person:$('labPerson').value,phone:$('labPhone').value,email:$('labEmail').value,web:$('labWeb').value,tagline:$('labTagline').value,logo});
    state.labProfileId=p.id;state.source='lab';invalidate();renderBrand();return p;}
  catch(e){$('labBrandError').textContent=(e.field?e.field+': ':'')+e.message;throw e;}
}

/* ---------- steps 1-2 ---------- */
function renderReview(){
  const ctx=Fid().ctx;if(!ctx)return;const m=ctx.model,c=m.coverage;
  $('stepProject').innerHTML=`<p><strong>${esc(m.subject.name)}</strong> · ${esc(m.subject.type)} <code>${esc(m.subject.id)}</code> · revisión <code>${esc(m.fingerprints.project.slice(0,12))}</code></p>
    <p>${c.geometry.representable}/${c.geometry.total} elementos representables desde el modelo RUBIK · ${esc(m.delivery.scopeNotice)}</p>`;
  const pol=policy();
  $('stepPlan').innerHTML=`<p>Plan: ${m.planning.status==='available'?`<strong>${esc(ctx.schedule.id)}</strong> (${esc(m.planning.evidence)})`:`<strong class="bad">${esc(m.planning.message)}</strong>`}</p>
    <p>Presupuesto: ${m.costs.status==='available'?`<strong>${esc(m.costs.report.budgetId)}</strong> · ${c.budget.allocatedPercentOfKnown} % de las partidas cargadas asignadas (no equivale a la obra presupuestada)`:`<span class="bad">${esc(m.costs.message||m.costs.reason||'no disponible')}</span>`}</p>
    <p>Nivel: <strong>${esc(m.delivery.label)}</strong></p>${pol.allowed?'':`<p class="bad">Costes no incluibles en la entrega: ${esc(pol.reasons.join('; '))}</p>`}`;
  const block=dossierBlock(),can=m.planning.status==='available'&&!block;
  $('videoGo').disabled=!can||!!state.recording;$('docPrepare').disabled=!can;
  $('videoBlocked').textContent=block||(can?'':'Sin un plan válido de este proyecto no se puede generar la evolución de obra.');
  $('costMode').querySelectorAll('option').forEach(o=>{o.disabled=o.value!=='none'&&!pol.allowed;});if(!pol.allowed)$('costMode').value='none',state.costMode='none';
}
const policy=()=>{const ctx=Fid()?.ctx;if(!ctx)return {allowed:false,mode:'none',reasons:['sin proyecto'],rows:[],summary:null,warnings:[]};return D.costPolicy(ctx.model,{mode:state.costMode,schedule:ctx.schedule});};
// A new project/plan/budget/brand selection invalidates generated files: they showed another selection.
function invalidate(){if(state.video?.url)URL.revokeObjectURL(state.video.url);state.video=null;state.manifest=null;state.doc=null;state.published=null;renderVideo();renderShare();}

/* ---------- video ---------- */
function renderVideo(message=''){
  const type=state.encoder?'video/mp4':Rec?.pickType?.()||null;
  $('videoFormat').textContent=!type?'Este navegador no puede grabar vídeo.':state.encoder?'Formato: MP4 (H.264) indexado, 1280×720 a 25 fps: duración real, se puede avanzar y retroceder; se abre en cualquier móvil u ordenador.'
    :type.startsWith('video/mp4')?'Formato: MP4 (H.264) grabado en tiempo real (MediaRecorder): algunos reproductores no permiten saltar a un punto.'
    :'Formato: WebM (este navegador no puede crear MP4). WebM se abre en Chrome, Edge, Firefox y Android; en iPhone/Safari antiguos o algunas apps de mensajería puede no reproducirse. No se renombra a .mp4.';
  $('videoFormat').classList.toggle('warn',!!type&&!state.encoder);
  const v=state.video,rec=!!state.recording;
  $('videoCancel').hidden=!rec;$('videoGo').textContent=v?'Grabar de nuevo':'Generar vídeo';$('videoGo').disabled=rec||!type||Fid().ctx?.model.planning.status!=='available';
  $('videoDownload').hidden=!v;$('videoPreview').hidden=!v;
  if(v){if($('videoPreview').src!==v.url)$('videoPreview').src=v.url;
    $('videoMeta').textContent=`${v.ext.toUpperCase()}${v.seekable?' indexado':''} · ${v.width}×${v.height} · ${secs(v.durationMs)}${v.fps?` · ${v.fps} fps · ${v.keyframes} fotogramas clave`:''} · ${sizeText(v.bytes)} · SHA-256 ${v.sha256.slice(0,12)} · entrega ${state.manifest?.id||'—'}`;}
  else{$('videoPreview').removeAttribute('src');$('videoMeta').textContent='';}
  if(message!==null)$('videoStatus').textContent=message;
}
const images=new Map();
const img=src=>{if(!src)return null;if(!images.has(src)){const i=new Image();i.src=src;images.set(src,i);}return images.get(src);};
function fit(x,s,max){if(x.measureText(s).width<=max)return s;while(s.length>1&&x.measureText(s+'…').width>max)s=s.slice(0,-1);return s+'…';}
function drawFrame(x,f,{sb,model,schedule,brand,pol,manifestInfo}){
  const src=Fid().scene.canvas;x.fillStyle='#000';x.fillRect(0,0,W,H);
  if(src.width&&src.height){const k=Math.max(W/src.width,H/src.height),w=W/k,h=H/k;x.drawImage(src,(src.width-w)/2,(src.height-h)/2,w,h,0,0,W,H);}
  x.textBaseline='alphabetic';const font=(w,s)=>`${w} ${s}px Inter, "Helvetica Neue", Arial, sans-serif`;
  const brandChip=(y=28)=>{x.fillStyle='rgba(255,255,255,.92)';x.fillRect(28,y,420,56);let left=40;const lg=img(brand.logo);
    if(lg&&lg.complete&&lg.naturalWidth){const lh=36,lw=Math.min(108,lg.naturalWidth*lh/lg.naturalHeight);x.drawImage(lg,left,y+10,lw,lh);left+=lw+12;}
    x.fillStyle=C.ink;x.font=font(700,20);x.fillText(fit(x,brand.present?brand.name:'RUBIK SOTA',360-left+40),left,y+25);x.fillStyle=C.muted;x.font=font(500,15);x.fillText(fit(x,manifestInfo.title,360-left+40),left,y+45);};
  if(f.segment==='opening'||f.segment==='closing'){
    if(f.segment==='opening'){x.fillStyle='rgba(43,48,52,.88)';x.fillRect(0,0,W,H);}
    else{const g=x.createLinearGradient(0,0,W*.78,0);g.addColorStop(0,'rgba(43,48,52,.94)');g.addColorStop(.62,'rgba(43,48,52,.78)');g.addColorStop(1,'rgba(43,48,52,0)');x.fillStyle=g;x.fillRect(0,0,W,H);}
    const lg=img(brand.logo);let y=170;if(lg&&lg.complete&&lg.naturalWidth){const lh=80,lw=Math.min(260,lg.naturalWidth*lh/lg.naturalHeight);x.fillStyle='#fff';x.fillRect(96,y-8,lw+16,lh+16);x.drawImage(lg,104,y,lw,lh);y+=lh+40;}
    x.fillStyle='#fff';x.font=font(800,26);x.fillText(fit(x,brand.present?brand.name:'RUBIK SOTA',W-200),96,y);y+=64;
    if(f.segment==='opening'){
      x.font=font(800,54);x.fillText(fit(x,manifestInfo.title,W-200),96,y);y+=48;x.font=font(500,24);x.fillStyle='#d9e5e8';
      x.fillText(fit(x,'Proyecto '+model.subject.name,W-200),96,y);y+=40;x.fillText(P.dateLabel(sb.startDate)+'  →  '+P.dateLabel(sb.endDate),96,y);y+=56;
      x.fillStyle='#ffd8a8';x.font=font(700,22);x.fillText('Simulación planificada de la evolución de obra · no muestra obra ejecutada',96,y);
    }else{
      x.font=font(800,44);x.fillText('Plan completado según la planificación',96,y);y+=50;x.font=font(500,22);x.fillStyle='#d9e5e8';
      if(brand.contact){x.fillText(fit(x,brand.contact,W-200),96,y);y+=36;}
      x.fillText(fit(x,brand.credit,W-200),96,y);y+=46;x.font=font(500,18);
      x.fillText(fit(x,`Proyecto ${model.subject.id} · rev ${model.fingerprints.project.slice(0,12)} · plan ${schedule.id} · rev ${(model.fingerprints.schedule||'').slice(0,12)}`,W-200),96,y);y+=40;
      x.fillStyle='#ffd8a8';x.font=font(700,20);x.fillText('La simulación no certifica obra ejecutada, pagada ni terminada.',96,y);
    }
    return;
  }
  // timeline
  const o=D.overlay(model,schedule,f.date,pol);brandChip();
  x.fillStyle='rgba(31,90,102,.92)';x.fillRect(W-430,28,402,40);x.fillStyle='#fff';x.font=font(700,15);x.fillText('SIMULACIÓN PLANIFICADA · movimiento ilustrativo',W-416,54);
  const by=H-176;x.fillStyle='rgba(255,255,255,.94)';x.fillRect(0,by,W,176);x.fillStyle=C.action;x.fillRect(0,by,6,176);
  x.fillStyle=C.ink;x.font=font(800,30);x.fillText(o.week,28,by+42);x.fillStyle=C.muted;x.font=font(600,18);x.fillText(o.dateText,28,by+70);
  x.fillStyle=C.ink;x.font=font(700,24);x.fillText(fit(x,o.headline,W-360),300,by+40);
  x.font=font(500,17);x.fillStyle=o.cost[0]&&/no incluidos/.test(o.cost[0])?C.warn:C.ink;o.cost.slice(0,2).forEach((t,i)=>x.fillText(fit(x,t,W-360),300,by+68+i*24));
  // mini Gantt of the real plan
  const gx=28,gw=W-56,gy=by+120,rows=o.bars.length,rh=Math.max(3,Math.min(7,40/Math.max(1,rows))),d0=Date.parse(sb.preStartDate),span=Date.parse(sb.completionDate)-d0+86400000;
  o.bars.forEach((b,i)=>{const a=(Date.parse(b.start)-d0)/span,e=(Date.parse(b.end)+86400000-d0)/span;x.fillStyle=b.phase==='completed'?C.dark:b.phase==='in-progress'?C.action:'#c9cfd1';x.fillRect(gx+a*gw,gy+i*rh,(e-a)*gw,Math.max(2,rh-1));});
  const cx=gx+((Date.parse(f.date)+86400000-d0)/span)*gw;x.fillStyle='#e8622c';x.fillRect(cx-1,gy-6,3,rows*rh+10);
  x.fillStyle=C.muted;x.font=font(500,13);x.fillText('Cronograma del plan · costes: '+(pol.allowed&&pol.mode!=='none'?'importes presupuestados, no gasto ejecutado':'no incluidos'),gx,H-10);
}
async function verifyPlayable(url){
  // The preview element plays the same Blob URL that is downloaded; WebM from MediaRecorder may report Infinity first.
  const v=document.createElement('video');v.muted=true;v.preload='auto';v.src=url;
  await new Promise((res,rej)=>{v.onloadedmetadata=res;v.onerror=()=>rej(Error('El navegador no puede abrir el vídeo generado.'));setTimeout(()=>rej(Error('El vídeo no se pudo leer a tiempo.')),15000);});
  if(!Number.isFinite(v.duration)){v.currentTime=1e7;await new Promise(r=>{v.ontimeupdate=()=>{v.ontimeupdate=null;r();};setTimeout(r,4000);});}
  const out={durationMs:Math.round(v.duration*1000),width:v.videoWidth,height:v.videoHeight};v.removeAttribute('src');v.load();return out;
}
// Encoder: WebCodecs H.264 (frame by frame, exact timestamps, keyframe every second) muxed into an indexed MP4 by
// FloorPlanConstructionMp4; otherwise MediaRecorder (real time, container from FloorPlanTourRecorder.pickType).
const H264=['avc1.42001f','avc1.4d001f','avc1.640028'];
async function encoderConfig(){
  if(typeof VideoEncoder==='undefined'||!window.FloorPlanConstructionMp4)return null;
  for(const codec of H264){const cfg={codec,width:W,height:H,bitrate:BITRATE,framerate:FPS_OFFLINE,avc:{format:'avc'}};
    try{if((await VideoEncoder.isConfigSupported(cfg)).supported)return cfg;}catch{}}
  return null;
}
api.encoderConfig=encoderConfig;
const FPS_OFFLINE=25;
async function record(){
  const fid=Fid(),ctx=fid.ctx;if(!ctx||ctx.model.planning.status!=='available')throw Error('Se necesita un plan válido de este proyecto.');
  if(dossierBlock())throw Error(dossierBlock());
  if(state.recording)throw Error('Ya hay una grabación en curso.');
  const cfg=await encoderConfig(),type=cfg?'video/mp4':Rec.pickType();if(!type)throw Error('Este navegador no puede grabar vídeo.');
  invalidate();const controller=new AbortController();state.recording={controller,progress:0};renderVideo('Preparando la grabación…');
  const brand=currentBrand(),pol=policy(),sb=D.storyboard(ctx.schedule),model=ctx.model,schedule=ctx.schedule,inv=model.inventory;
  img(brand.logo);await new Promise(r=>setTimeout(r,50));
  const title=brand.present?brand.title:(state.title||model.subject.name),info={title};
  const backPose=fid.pose,backPos=fid.pos,roof=fid.scene.roofVisible;
  const canvas=document.createElement('canvas');canvas.width=W;canvas.height=H;const x=canvas.getContext('2d');
  const frame=t=>{const f=sb.at(t);fid.setPos(f.segment==='opening'?0:f.pos);
    fid.setPose(fid.scene.orbitPose(inv,-.55+1.1*(t/sb.totalMs),{scale:.74,lift:.5}));fid.scene.renderNow();drawFrame(x,f,{sb,model,schedule,brand,pol,manifestInfo:info});};
  const progress=k=>{state.recording.progress=k;$('videoStatus').textContent=`Grabando… ${Math.round(k*100)} %`;};
  let blob,frames=0,declaredMs,container;
  try{
    fid.scene.setRenderSize(W,H);fid.scene.setSuspended(!!cfg);
    if(cfg){
      // Offline: every frame is rendered at its exact time, so the file lasts exactly the storyboard, whatever the GPU.
      const total=Math.round(sb.totalMs*FPS_OFFLINE/1000),samples=[];let avcC=null,failure=null;
      const enc=new VideoEncoder({output:(chunk,meta)=>{if(meta?.decoderConfig?.description&&!avcC)avcC=new Uint8Array(meta.decoderConfig.description);
        const data=new Uint8Array(chunk.byteLength);chunk.copyTo(data);samples.push({data,key:chunk.type==='key',ts:chunk.timestamp});},error:e=>{failure=e;}});
      enc.configure(cfg);
      for(let i=0;i<total;i++){
        if(controller.signal.aborted)throw new DOMException('Grabación cancelada','AbortError');if(failure)throw failure;
        frame(i*1000/FPS_OFFLINE);
        const vf=new VideoFrame(canvas,{timestamp:Math.round(i*1e6/FPS_OFFLINE),duration:Math.round(1e6/FPS_OFFLINE)});
        enc.encode(vf,{keyFrame:i%FPS_OFFLINE===0});vf.close();frames++;
        while(enc.encodeQueueSize>6)await new Promise(r=>setTimeout(r,5));
        if(i%5===0){progress(i/total);await new Promise(r=>setTimeout(r,0));}
      }
      await enc.flush();enc.close();if(failure)throw failure;
      if(!avcC||samples.length!==total)throw Error('El codificador no devolvió todos los fotogramas: no se ha guardado nada.');
      samples.sort((a,b)=>a.ts-b.ts);
      blob=new Blob([FloorPlanConstructionMp4.mux({width:W,height:H,fps:FPS_OFFLINE,samples,avcC})],{type:'video/mp4'});
      declaredMs=Math.round(total*1000/FPS_OFFLINE);container='mp4-indexed';
    }else{
      // Fallback (no WebCodecs H.264): real-time MediaRecorder. Its files may not be seekable; this is said plainly.
      const stream=canvas.captureStream(30),recorder=new MediaRecorder(stream,{mimeType:type,videoBitsPerSecond:BITRATE}),chunks=[];
      recorder.ondataavailable=e=>{if(e.data.size)chunks.push(e.data);};frame(0);recorder.start(250);const started=performance.now();let raf=0;
      try{await new Promise((res,rej)=>{const tick=()=>{if(controller.signal.aborted)return rej(new DOMException('Grabación cancelada','AbortError'));
        const t=performance.now()-started;frame(Math.min(t,sb.totalMs));frames++;progress(Math.min(1,t/sb.totalMs));if(t>=sb.totalMs+300)return res();raf=requestAnimationFrame(tick);};raf=requestAnimationFrame(tick);});}
      finally{cancelAnimationFrame(raf);if(recorder.state!=='inactive'){const done=new Promise(r=>recorder.addEventListener('stop',r,{once:true}));try{recorder.stop();}catch{}await Promise.race([done,new Promise(r=>setTimeout(r,4000))]);}stream.getTracks().forEach(t=>t.stop());}
      blob=new Blob(chunks,{type:type.split(';')[0]});declaredMs=null;container='mediarecorder';
    }
  }finally{fid.scene.setSuspended(false);fid.scene.releaseRenderSize();fid.setRoof(roof);fid.setPos(backPos);if(backPose)fid.setPose(backPose);state.recording=null;}
  if(!blob.size)throw Error('El navegador no generó ningún fotograma: no se ha guardado nada.');
  const url=URL.createObjectURL(blob),ext=blob.type==='video/mp4'?'mp4':'webm';
  let check;try{check=await verifyPlayable(url);}catch(e){URL.revokeObjectURL(url);throw e;}
  const file=container==='mp4-indexed'?FloorPlanConstructionMp4.inspect(new Uint8Array(await blob.arrayBuffer())):null;
  // Declared duration = file duration = player duration (one frame of tolerance), or the file is not offered.
  const tol=1000/FPS_OFFLINE+1;
  if(check.width!==W||check.height!==H||!(check.durationMs>1000)||(declaredMs&&(Math.abs(check.durationMs-declaredMs)>tol||Math.abs(file.movieDurationSec*1000-declaredMs)>tol))){
    URL.revokeObjectURL(url);throw Error(`Vídeo no válido (${check.width}×${check.height}, ${check.durationMs} ms frente a ${declaredMs} ms declarados): no se ofrece para descargar.`);}
  const hash=await sha256(blob),durationMs=declaredMs??check.durationMs;
  const meta={type:blob.type,ext,bytes:blob.size,width:check.width,height:check.height,durationMs,playerDurationMs:check.durationMs,sha256:hash,frames,container,
    seekable:container==='mp4-indexed',keyframes:file?file.keyframes.length:null,fps:container==='mp4-indexed'?FPS_OFFLINE:null};
  const manifest=await D.createManifest({model,schedule,budget:ctx.input.budget,brand,costPolicy:pol,title,intro:brand.present?brand.intro:state.intro,binding:ctx.input.binding,dossier:ctx.dossier||null,
    video:{filename:'',type:blob.type,bytes:blob.size,width:check.width,height:check.height,durationMs,sha256:hash}});
  const filename=D.videoFilename(manifest,ext);
  state.video={...meta,blob,url,filename};state.manifest=manifest;state.doc=null;
  remember('vídeo',manifest,{filename,sha256:hash,bytes:blob.size});
  renderVideo(meta.seekable?'Revisa el vídeo antes de descargarlo: es exactamente el archivo que se descarga.':'Revisa el vídeo antes de descargarlo. Este navegador no dispone de codificación H.264 por fotogramas: el archivo (MediaRecorder) puede no permitir saltar a un punto en algunos reproductores.');renderShare();
  return {...meta,filename,manifestId:manifest.id};
}
function download(blob,filename){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),60000);}

/* ---------- client presentation & link ---------- */
const blobToData=blob=>new Promise((res,rej)=>{const r=new FileReader();r.onload=()=>res(r.result);r.onerror=()=>rej(r.error);r.readAsDataURL(blob);});
async function prepareDocument(){
  const ctx=Fid().ctx;if(!ctx||ctx.model.planning.status!=='available')throw Error('Se necesita un plan válido de este proyecto.');
  if(dossierBlock())throw Error(dossierBlock());
  const brand=currentBrand(),pol=policy();
  // With a video, its frozen manifest is the delivery; without one, a manifest is frozen now.
  const manifest=state.manifest||await D.createManifest({model:ctx.model,schedule:ctx.schedule,budget:ctx.input.budget,brand,costPolicy:pol,
    title:brand.present?brand.title:(state.title||ctx.model.subject.name),intro:brand.present?brand.intro:state.intro,binding:ctx.input.binding,dossier:ctx.dossier||null});
  const embed=state.video&&state.video.bytes<=EMBED_LIMIT?{src:await blobToData(state.video.blob),type:state.video.type}:null;
  const html=D.clientDocument(manifest,{video:embed});
  state.manifest=manifest;state.doc={html,bytes:new Blob([html]).size,embedded:!!embed,manifest};
  remember('presentación',manifest,{bytes:state.doc.bytes,embedded:!!embed});
  $('clientPreview').srcdoc=html;$('clientPreview').hidden=false;renderShare();return state.doc;
}
function remember(kind,manifest,extra){
  if(state.history.some(h=>h.kind===kind&&h.deliveryId===manifest.id))return;
  state.history.push(Object.freeze({kind,deliveryId:manifest.id,dossierId:manifest.dossier?.id||null,subjectId:manifest.project.id,projectName:manifest.project.name,at:manifest.generatedAt,...extra}));
}
function renderHistory(){
  $('deliveryHistory').innerHTML=state.history.map(h=>`<li>${esc(h.kind)} · entrega <code>${esc(h.deliveryId)}</code> · expediente <code>${esc(h.dossierId||'—')}</code> · ${esc(h.projectName)}${h.sha256?` · SHA-256 <code>${esc(h.sha256.slice(0,12))}</code>`:''}</li>`).join('');
}
function renderShare(message=null){
  const v=state.video,d=state.doc;renderHistory();
  $('docDownload').hidden=!d;$('manifestDownload').hidden=!state.manifest;
  $('docMeta').textContent=d?`Documento ${sizeText(d.bytes)} · ${d.embedded?'vídeo incluido dentro del archivo':'sin vídeo dentro del archivo'} · entrega ${d.manifest.id}`:'';
  if(!d)$('clientPreview').hidden=true;
  const vOk=v&&v.bytes<=D.SHARE_LIMIT_BYTES;
  $('publishVideo').disabled=!vOk;$('publishVideo').checked=!!vOk&&$('publishVideo').checked;
  $('publishVideoNote').textContent=!v?'Sin vídeo generado: se publicaría solo la presentación.':vOk?`Incluir el vídeo (${v.ext.toUpperCase()}, ${sizeText(v.bytes)}).`:`El vídeo ocupa ${sizeText(v.bytes)} y supera el límite de 4 MB del servicio: descárgalo y envíalo aparte (no se divide ni se degrada).`;
  $('publishWhat').innerHTML=`Se publicará: título, ${state.include.size?'contacto ('+[...state.include].join(', ')+')':'sin datos de contacto'}, marca ${currentBrand().present?'«'+esc(currentBrand().name)+'»':'(ninguna)'}, fases y fechas del plan, costes: <strong>${esc(({none:'no',summary:'resumen',tasks:'por fase'})[policy().allowed?state.costMode:'none'])}</strong>${$('publishVideo').checked?', vídeo':''}. No se envía el proyecto editable ni planos de origen.`;
  if(state.published){$('publishResult').hidden=false;$('publishUrl').value=state.published.link;$('publishOpen').href=state.published.link;}else $('publishResult').hidden=true;
  if(message!==null)$('publishStatus').textContent=message;
}
async function upload(kind,body,code,name){
  let r;try{r=await fetch(D.ENDPOINTS.share,{method:'POST',headers:{'Content-Type':kind==='html'?'text/html; charset=utf-8':'application/octet-stream','x-rubik-render-token':code,'x-rubik-share-kind':kind,'x-rubik-share-name':encodeURIComponent(name).slice(0,120)},body});}
  catch{throw Error(D.PUBLISH_ERRORS['storage-unreachable']);}
  const out=await r.json().catch(()=>null);
  if(!r.ok||typeof out?.url!=='string'||!out.url.startsWith('https://'))throw Object.assign(Error(D.publishError(r.status,out?.error)),{status:r.status});
  return out.url;
}
async function publish({code,agree,withVideo}){
  if(!agree)throw Error('Confirma que entiendes que cualquiera con el enlace podrá verlo.');
  if(!code)throw Error('Introduce el código de acceso del servidor (el mismo que para Render IA).');
  if(!state.doc)await prepareDocument();
  const m=state.manifest,v=withVideo?state.video:null;
  if(v&&v.bytes>D.SHARE_LIMIT_BYTES)throw Error(D.PUBLISH_ERRORS.size);
  let video=null;
  if(v){const url=await upload(v.ext,v.blob,code,m.project.name);video={src:url,type:v.type};}
  const html=D.clientDocument(m,{video});const bytes=new Blob([html]).size;
  if(bytes>D.SHARE_LIMIT_BYTES)throw Error(D.PUBLISH_ERRORS.size+(video?' (el vídeo ya subido queda en el almacén Blob; puedes borrarlo desde su panel)':''));
  let page;try{page=await upload('html',new Blob([html],{type:'text/html'}),code,m.project.name);}
  catch(e){if(video)e.message+=' El vídeo sí se subió y queda en el almacén Blob: bórralo desde su panel si no lo vas a usar.';throw e;}
  const link=new URL(D.ENDPOINTS.view+'?f='+encodeURIComponent(page),location.origin).href;
  state.published={link,page,video:video?.src||null,manifestId:m.id,bytes};renderShare('Enlace publicado. Ábrelo y compruébalo antes de enviarlo. Si cambias el proyecto, genera una entrega nueva: este enlace no se actualiza.');
  return state.published;
}

/* ---------- wiring ---------- */
function refresh(){renderBrand();renderReview();renderVideo(null);renderShare(null);}
window.addEventListener('ft3d8-selection',()=>{
  // A new dossier: its own matched brand is used; the brand of the previous dossier never carries over.
  if(dossierBrand())state.source='dossier';else if(state.source==='dossier')state.source='none';
  invalidate();refresh();});
$('brandSel').onchange=()=>{state.source=$('brandSel').value;if(state.source==='lab'&&state.labProfileId===null){renderBrand();return;}invalidate();renderBrand();};
$('labBrandSave').onclick=()=>saveLabBrand().catch(()=>{});
$('brandTitle').oninput=()=>{state.title=$('brandTitle').value.slice(0,B.LIMITS.title);invalidate();renderBrand();};
$('brandIntro').oninput=()=>{state.intro=$('brandIntro').value.slice(0,B.LIMITS.intro);invalidate();renderBrand();};
for(const f of D.CONTACT_FIELDS)$('inc-'+f).onchange=e=>{e.target.checked?state.include.add(f):state.include.delete(f);invalidate();renderBrand();renderShare(null);};
$('costMode').onchange=()=>{state.costMode=$('costMode').value;invalidate();renderReview();renderShare(null);};
$('videoGo').onclick=()=>record().catch(e=>{state.lastError=e.message;renderVideo(e.name==='AbortError'?'Grabación cancelada. No se ha guardado nada.':e.message);});
$('videoCancel').onclick=()=>state.recording?.controller.abort();
$('videoDownload').onclick=()=>state.video&&download(state.video.blob,state.video.filename);
$('docPrepare').onclick=()=>prepareDocument().catch(e=>renderShare(e.message));
$('docDownload').onclick=()=>state.doc&&download(new Blob([state.doc.html],{type:'text/html'}),D.documentFilename(state.doc.manifest));
$('manifestDownload').onclick=()=>state.manifest&&download(new Blob([JSON.stringify(state.manifest,null,1)],{type:'application/json'}),'entrega-'+state.manifest.id+'.json');
$('publishVideo').onchange=()=>renderShare(null);
$('publishGo').onclick=async()=>{$('publishGo').disabled=true;renderShare('Publicando…');
  try{await publish({code:$('publishToken').value.trim(),agree:$('publishAgree').checked,withVideo:$('publishVideo').checked});}
  catch(e){state.published=null;renderShare('No publicado: '+e.message);}finally{$('publishGo').disabled=false;}};
$('publishCopy').onclick=async()=>{try{await navigator.clipboard.writeText(state.published.link);renderShare('Enlace copiado.');}catch{$('publishUrl').select();renderShare('Selecciona el enlace y cópialo.');}};
for(const b of document.querySelectorAll('[data-mode]'))b.onclick=()=>{document.body.dataset.mode=b.dataset.mode;document.querySelectorAll('[data-mode]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));requestAnimationFrame(()=>window.dispatchEvent(new Event('resize')));};
Object.assign(api,{get history(){return state.history.map(h=>({...h}));},record,cancel:()=>state.recording?.controller.abort(),prepareDocument,publish,saveLabBrand,snapshot:()=>currentBrand(),refresh,
  select(source){state.source=source;invalidate();renderBrand();},setInclude(list){state.include=new Set(list);D.CONTACT_FIELDS.forEach(f=>$('inc-'+f).checked=state.include.has(f));invalidate();renderBrand();},
  setCostMode(m){$('costMode').value=m;state.costMode=m;invalidate();renderReview();}});
encoderConfig().then(c=>{state.encoder=c;renderVideo(null);});
refresh();
