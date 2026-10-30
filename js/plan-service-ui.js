/* Phase B5: «Envíanos tu plano y lo convertimos» — the human-assisted service, first version without a server.
   The person chooses their plan files and leaves a contact; Rubik prepares ONE request package (a ZIP with the files,
   solicitud.json and solicitud.txt), downloads it, and opens an e-mail to the service address with the request
   written in. E-mail links cannot attach files, so the dialog says plainly to attach the downloaded ZIP. Nothing is
   uploaded by Rubik. No price is shown: the service answers with a quote and a delivery time. */
(function(){
 'use strict';
 const SERVICE_EMAIL='juanmaes83@gmail.com';
 const MAX_FILES=5,MAX_BYTES=20*1024*1024,ACCEPT='.pdf,.png,.jpg,.jpeg,.webp,.heic,.dxf,.dwg,.ifc,.json,.zip';
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const mb=b=>(b/1048576).toFixed(1).replace('.',',')+' MB';
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,40)||'solicitud';
 const NEEDS=()=>[['plan',tx('Plano 2D editable','Editable 2D plan','可编辑二维平面图')],['3d',tx('Vivienda en 3D','Home in 3D','三维住宅')],['furnish',tx('Amueblado','Furnished','布置家具')],['present',tx('Presentación para cliente','Client presentation','客户展示')]];
 const safeName=n=>String(n).split(/[\\/]/).pop().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w.-]+/g,'_').replace(/^\.+/,'').slice(-80)||'plano';
 // The request as data (also what the e-mail and the text file say). Pure: tested from Node.
 function request({name,email,phone,city,needs,notes,files,date=new Date()}){
  const clean=v=>String(v||'').trim().slice(0,500);
  if(!clean(name))throw Error(tx('Indica tu nombre.','Enter your name.','请输入姓名。'));
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean(email)))throw Error(tx('Indica un email válido para responderte.','Enter a valid e-mail so we can reply.','请输入有效邮箱。'));
  if(!files?.length)throw Error(tx('Añade al menos un plano.','Add at least one plan.','请至少添加一个平面图。'));
  if(files.length>MAX_FILES)throw Error(tx(`Máximo ${MAX_FILES} archivos.`,`At most ${MAX_FILES} files.`,`最多 ${MAX_FILES} 个文件。`));
  const total=files.reduce((n,f)=>n+f.size,0);if(total>MAX_BYTES)throw Error(tx(`Los archivos suman ${mb(total)}; el máximo es ${mb(MAX_BYTES)}.`,`Files add up to ${mb(total)}; the maximum is ${mb(MAX_BYTES)}.`,`文件共 ${mb(total)}，上限 ${mb(MAX_BYTES)}。`));
  const id=`${date.toISOString().slice(0,10).replace(/-/g,'')}-${slug(clean(name))}`;
  return {kind:'rubik-plan-service-request',version:1,id,createdAt:date.toISOString(),contact:{name:clean(name),email:clean(email),phone:clean(phone)},city:clean(city),needs:[...new Set(needs||[])].filter(k=>NEEDS().some(n=>n[0]===k)),notes:clean(notes),files:files.map(f=>({name:safeName(f.name),bytes:f.size,type:f.type||''}))};
 }
 function text(r){const labels=new Map(NEEDS());return [tx('Solicitud «Envíanos tu plano» · Rubik Sota','«Send us your plan» request · Rubik Sota','“发送平面图”请求 · Rubik Sota'),'',
  `${tx('Referencia','Reference','编号')}: ${r.id}`,`${tx('Nombre','Name','姓名')}: ${r.contact.name}`,`Email: ${r.contact.email}`,r.contact.phone?`${tx('Teléfono','Phone','电话')}: ${r.contact.phone}`:'',r.city?`${tx('Ubicación','Location','位置')}: ${r.city}`:'',
  `${tx('Necesito','I need','需要')}: ${r.needs.length?r.needs.map(k=>labels.get(k)).join(', '):tx('Plano 2D editable','Editable 2D plan','可编辑二维平面图')}`,
  r.notes?`${tx('Notas','Notes','备注')}: ${r.notes}`:'','',`${tx('Archivos','Files','文件')} (${r.files.length}): ${r.files.map(f=>`${f.name} (${mb(f.bytes)})`).join(', ')}`].filter((l,i,a)=>l!==''||a[i-1]!=='').join('\n');}
 function mailto(r,zipName){
  const body=text(r)+'\n\n'+tx(`Adjunto el archivo ${zipName} con los planos.`,`I attach ${zipName} with the plans.`,`附上 ${zipName}。`);
  return `mailto:${SERVICE_EMAIL}?subject=${encodeURIComponent(tx('Envíanos tu plano','Send us your plan','发送平面图')+' · '+r.id)}&body=${encodeURIComponent(body)}`;
 }
 async function pack(r,files){
  const enc=new TextEncoder(),entries=new Map(),used=new Set();
  for(let i=0;i<files.length;i++){let n='planos/'+r.files[i].name;while(used.has(n))n=n.replace(/(\.[^.]*)?$/,`-${i+1}$1`);used.add(n);entries.set(n,new Uint8Array(await files[i].arrayBuffer()));}
  entries.set('solicitud.json',enc.encode(JSON.stringify(r,null,2)));entries.set('solicitud.txt',enc.encode(text(r)+'\n'));
  return FloorPlanPackage.zip(entries,{check:n=>{if(!/^(solicitud\.(json|txt)|planos\/[\w.-]+)$/.test(n))throw Error('Ruta no permitida: '+n);return n;}});
 }
 const api={request,text,mailto,SERVICE_EMAIL,MAX_FILES,MAX_BYTES};
 if(typeof module==='object'){module.exports=api;return;}
 if(!window.FloorPlanPackage)return;

 const dialog=el('dialog',undefined,document.body,'ai-render-dialog plan-service-dialog');dialog.id='planServiceDialog';dialog.setAttribute('aria-labelledby','planServiceTitle');
 let files=[],returnFocus=null,sent=null,fromWelcome=null;
 // Opened from the welcome: closing without sending goes back to it, so the person can still choose another way in.
 dialog.addEventListener('close',()=>{const w=fromWelcome;fromWelcome=null;if(w&&!sent&&!w.open)w.showModal();returnFocus?.focus?.({preventScroll:true});});
 function open(){returnFocus=document.activeElement;const w=document.querySelector('#welcomeDialog[open]');if(w){fromWelcome=w;w.close();}draw();dialog.showModal();dialog.querySelector('#planServiceFiles')?.focus();}
 function field(form,label,id,type='text',wide=false){const l=el('label',undefined,form,wide?'is-wide':'');el('span',label,l);const i=el(type==='textarea'?'textarea':'input',undefined,l);i.id=id;if(type!=='textarea')i.type=type;else i.rows=3;i.maxLength=500;return i;}
 function draw(message=''){
  const keep={};dialog.querySelectorAll('input:not([type=file]):not([type=checkbox]),textarea').forEach(i=>keep[i.id]=i.value);const checks={};dialog.querySelectorAll('input[type=checkbox]').forEach(i=>checks[i.id]=i.checked);
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');el('h2',tx('Envíanos tu plano','Send us your plan','发送平面图'),head).id='planServiceTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='planServiceClose';close.onclick=()=>dialog.close();
  el('p',tx('Te preparamos el proyecto Rubik a partir de tu plano: lo revisa una persona y te lo devolvemos listo para abrir. Te respondemos con presupuesto y plazo antes de empezar; no pagas nada por enviarlo.','We prepare the Rubik project from your plan: a person reviews it and we send it back ready to open. We reply with a quote and delivery time before starting; sending it is free.','我们根据您的平面图准备 Rubik 项目，由人工审核后返还。开始前我们会回复报价和工期；发送免费。'),dialog,'ai-render-note').id='planServiceNote';
  if(sent){const done=el('div',undefined,dialog,'plan-service-done');done.id='planServiceDone';
   el('p',tx(`Se ha descargado ${sent.zipName} y se ha abierto tu correo con la solicitud escrita. Adjunta ese archivo al correo y envíalo a ${SERVICE_EMAIL}.`,`${sent.zipName} was downloaded and your e-mail opened with the request written. Attach that file and send it to ${SERVICE_EMAIL}.`,`已下载 ${sent.zipName} 并打开邮件。请附上该文件并发送至 ${SERVICE_EMAIL}。`),done);
   el('p',tx('¿No se abrió el correo? Escribe a esa dirección y adjunta el archivo; el texto de la solicitud va dentro (solicitud.txt).','E-mail did not open? Write to that address and attach the file; the request text is inside (solicitud.txt).','邮件未打开？请写信至该地址并附上文件。'),done,'plan-service-hint');
   const row=el('div',undefined,done,'tour-video-actions');const copy=btn(tx('Copiar dirección','Copy address','复制地址'),row,'btn primary');copy.id='planServiceCopy';copy.onclick=async()=>{try{await navigator.clipboard.writeText(SERVICE_EMAIL);status.textContent=tx('Dirección copiada.','Address copied.','地址已复制。');}catch{status.textContent=SERVICE_EMAIL;}};
   const again=btn(tx('Descargar de nuevo','Download again','重新下载'),row);again.id='planServiceAgain';again.onclick=()=>download(sent.blob,sent.zipName);
   const status=el('p',message,dialog,'ai-render-status');status.id='planServiceStatus';status.setAttribute('role','status');return;}
  const form=el('div',undefined,dialog,'ai-render-form plan-service-form');
  const fl=el('label',undefined,form,'is-wide');el('span',tx(`Planos (hasta ${MAX_FILES} archivos, ${mb(MAX_BYTES)} en total): PDF, imagen, DXF, DWG, IFC…`,`Plans (up to ${MAX_FILES} files, ${mb(MAX_BYTES)} in total): PDF, image, DXF, DWG, IFC…`,`平面图（最多 ${MAX_FILES} 个文件）`),fl);
  const fi=el('input',undefined,fl);fi.type='file';fi.id='planServiceFiles';fi.multiple=true;fi.accept=ACCEPT;
  const list=el('ul',undefined,form,'plan-service-files is-wide');list.id='planServiceList';
  for(const [i,f] of files.entries()){const li=el('li',`${f.name} · ${mb(f.size)}`,list);const rm=btn(tx('Quitar','Remove','删除'),li,'btn');rm.setAttribute('aria-label',tx(`Quitar ${f.name}`,`Remove ${f.name}`,`删除 ${f.name}`));rm.onclick=()=>{files.splice(i,1);draw();dialog.querySelector('#planServiceFiles').focus();};}
  fi.onchange=()=>{files=[...files,...fi.files];draw();dialog.querySelector('#planServiceFiles').focus();};
  const n=field(form,tx('Nombre','Name','姓名'),'planServiceName'),m=field(form,tx('Email para responderte','E-mail to reply to','回复邮箱'),'planServiceEmail','email'),p=field(form,tx('Teléfono (opcional)','Phone (optional)','电话（可选）'),'planServicePhone','tel'),c=field(form,tx('Ciudad o dirección (opcional)','City or address (optional)','城市或地址（可选）'),'planServiceCity');
  n.autocomplete='name';m.autocomplete='email';p.autocomplete='tel';
  const needs=el('fieldset',undefined,form,'plan-service-needs is-wide');el('legend',tx('¿Qué necesitas?','What do you need?','您需要什么？'),needs);
  for(const [k,label] of NEEDS()){const l=el('label',undefined,needs);const cb=el('input',undefined,l);cb.type='checkbox';cb.id='planServiceNeed-'+k;cb.value=k;cb.checked=checks[cb.id]??k==='plan';el('span',label,l);}
  field(form,tx('Notas (qué es, qué quieres cambiar, plazos…)','Notes (what it is, what to change, deadlines…)','备注'),'planServiceNotes','textarea',true);
  const ok=el('label',undefined,form,'ai-render-consent');const cb=el('input',undefined,ok);cb.type='checkbox';cb.id='planServiceAgree';cb.checked=!!checks.planServiceAgree;el('span',tx('Acepto que usen mis datos y mis planos sólo para preparar mi proyecto y responderme.','I agree that my details and plans are used only to prepare my project and reply to me.','我同意仅为准备项目和回复我而使用我的资料和平面图。'),ok);
  for(const [id,v] of Object.entries(keep)){const x=dialog.querySelector('#'+id);if(x)x.value=v;}
  const go=btn(tx('Preparar envío','Prepare request','准备发送'),form,'btn primary');go.id='planServiceGo';
  const status=el('p',message,dialog,'ai-render-status');status.id='planServiceStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  go.onclick=async()=>{
   if(!cb.checked){status.textContent=tx('Acepta el uso de tus datos para poder enviarlo.','Accept the use of your details to send it.','请同意使用您的资料。');cb.focus();return;}
   let r;try{r=request({name:n.value,email:m.value,phone:p.value,city:c.value,needs:[...dialog.querySelectorAll('.plan-service-needs input:checked')].map(i=>i.value),notes:dialog.querySelector('#planServiceNotes').value,files});}
   catch(e){status.textContent=e.message;return;}
   go.disabled=true;status.textContent=tx('Preparando el paquete…','Preparing the package…','正在准备…');
   try{const blob=await pack(r,files),zipName=`rubik-envianos-tu-plano-${r.id}.zip`;download(blob,zipName);sent={blob,zipName,request:r,mailto:mailto(r,zipName)};draw();
    const a=document.createElement('a');a.href=sent.mailto;a.rel='noopener';document.body.append(a);a.click();a.remove();dialog.querySelector('#planServiceCopy')?.focus();}
   catch(e){go.disabled=false;status.textContent=e.message||String(e);}
  };
 }
 function download(blob,name){const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);}
 window.FloorPlanPlanService={...api,open,get sent(){return sent;},reset(){sent=null;files=[];}};
})();
