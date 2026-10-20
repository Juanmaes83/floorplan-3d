/* «Tu marca profesional» (premium UX cut C), interface. Profiles are managed in a dialog opened from «Archivo» and
   from the presentation and sheet settings; each project chooses «Firmar con» a profile or «Sin marca». What the
   client receives gets a snapshot (FloorPlanBrand.snapshot): the sheet title band and credit, the presentation card
   (brand, introduction on the overview, contact as the next step on the last view) and a strip on every PNG view of
   the presentation batch. Without a brand every deliverable stays as before. Platform authorship and the
   «orientativas» notices are never removed. All text goes through textContent; the logo is a re-encoded PNG. */
(function(){
 'use strict';
 const B=window.FloorPlanBrand,app=window.FloorPlanApp;if(!B||!app)return;
 const store=(()=>{try{localStorage.setItem('rubik-sota-brand-probe','1');localStorage.removeItem('rubik-sota-brand-probe');return localStorage;}catch{const m=new Map();return {getItem:k=>m.has(k)?m.get(k):null,setItem:(k,v)=>m.set(k,String(v)),removeItem:k=>m.delete(k)};}})();
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined&&text!==null)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const button=(text,parent,fn,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';b.onclick=fn;return b;};
 const say=(m,ms=4000)=>typeof toast==='function'?toast(m,ms):null;
 const listeners=new Set(),changed=()=>listeners.forEach(fn=>{try{fn();}catch{}});

 // Logo: PNG, JPEG or WebP decoded as an image and re-encoded as PNG, at most 600×240 px. SVG and other types are
 // refused, so no active content can reach a deliverable.
 async function readLogo(file){
  if(!file)return null;
  if(!['image/png','image/jpeg','image/webp'].includes(file.type))throw Object.assign(Error('El logo debe ser PNG, JPG o WebP (no SVG).'),{field:'logo'});
  if(file.size>4*1024*1024)throw Object.assign(Error('El archivo del logo supera 4 MB.'),{field:'logo'});
  let bitmap;try{bitmap=await createImageBitmap(file);}catch{throw Object.assign(Error('No se pudo leer la imagen del logo.'),{field:'logo'});}
  const k=Math.min(1,600/bitmap.width,240/bitmap.height),w=Math.max(1,Math.round(bitmap.width*k)),h=Math.max(1,Math.round(bitmap.height*k));
  const c=document.createElement('canvas');c.width=w;c.height=h;c.getContext('2d').drawImage(bitmap,0,0,w,h);bitmap.close?.();
  return B.logo(c.toDataURL('image/png'));
 }

 // Management dialog: list of profiles (edit, delete) and a form with a live preview of the delivery footer.
 const dialog=el('dialog',undefined,document.body,'brand-dialog');dialog.id='brandDialog';dialog.setAttribute('aria-labelledby','brandTitle');
 let editing=null,pendingLogo=undefined,returnTo=null;
 function field(form,label,name,type='text',max){const wrap=el('label',undefined,form,'brand-field');el('span',label,wrap);const input=el(type==='textarea'?'textarea':'input',undefined,wrap);if(type!=='textarea')input.type=type;input.name=name;input.id='brand-'+name;if(max)input.maxLength=max;const err=el('small',undefined,wrap,'brand-error');err.id='brand-'+name+'-error';input.setAttribute('aria-describedby',err.id);return input;}
 function render(){
  dialog.replaceChildren();
  const head=el('div',undefined,dialog,'brand-head');const h=el('h2','Tu marca profesional',head);h.id='brandTitle';h.tabIndex=-1;button('Cerrar',head,()=>dialog.close()).id='brandClose';
  el('p','Firma tus entregas (lámina y presentación) con tu identidad. Se guarda sólo en este navegador; el proyecto exportado no la incluye.',dialog,'brand-lead');
  const list=el('ul',undefined,dialog,'brand-list');list.setAttribute('aria-label','Marcas guardadas');
  const profiles=B.readProfiles(store).profiles;
  if(!profiles.length)el('li','Aún no hay ninguna marca guardada.',list,'brand-empty');
  for(const p of profiles){const li=el('li',undefined,list,'brand-item');if(p.logo){const img=el('img',undefined,li);img.src=p.logo;img.alt='';}
   const t=el('span',undefined,li,'brand-item-text');el('strong',p.name,t);el('small',B.contactLine(p)||'Sin datos de contacto',t);
   button('Editar',li,()=>edit(p)).setAttribute('aria-label',`Editar «${p.name}»`);
   const del=button('Borrar',li,()=>{if(!confirm(`¿Borrar la marca «${p.name}»? Los proyectos que la usaban quedarán sin marca; las entregas ya descargadas no cambian.`))return;B.removeProfile(store,p.id);if(editing?.id===p.id)editing=null;render();changed();},'btn danger');del.setAttribute('aria-label',`Borrar «${p.name}»`);}
  const form=el('form',undefined,dialog,'brand-form');form.noValidate=true;form.setAttribute('aria-label',editing?.id?`Editar «${editing.name}»`:'Nueva marca');
  el('h3',editing?.id?`Editar «${editing.name}»`:'Nueva marca',form);
  const f={name:field(form,'Nombre comercial *','name','text',B.LIMITS.name),person:field(form,'Persona responsable','person','text',B.LIMITS.person),phone:field(form,'Teléfono','phone','tel',B.LIMITS.phone),email:field(form,'Correo','email','email',B.LIMITS.email),web:field(form,'Web','web','url',B.LIMITS.web),tagline:field(form,'Lema breve','tagline','text',B.LIMITS.tagline)};
  for(const [k,input] of Object.entries(f))input.value=editing?.[k]||'';
  const logoWrap=el('div',undefined,form,'brand-field brand-logo');el('span','Logo (PNG, JPG o WebP; se ajusta a 600×240 px)',logoWrap);
  // The native file control shows the browser's own language; a Spanish button opens it and a line names the file.
  const file=el('input',undefined,logoWrap,'sr-only');file.type='file';file.accept='image/png,image/jpeg,image/webp';file.id='brand-logo';file.setAttribute('aria-label','Elegir logo');file.tabIndex=-1;
  const pick=button('Elegir logo…',logoWrap,()=>file.click());pick.id='brandLogoPick';const fileName=el('small','',logoWrap,'brand-file');fileName.id='brandLogoFile';
  const logoErr=el('small',undefined,logoWrap,'brand-error');logoErr.id='brand-logo-error';file.setAttribute('aria-describedby',logoErr.id);
  const logoImg=el('img',undefined,logoWrap,'brand-logo-preview');logoImg.alt='Vista previa del logo';
  const removeLogo=button('Quitar logo',logoWrap,()=>{pendingLogo=null;showLogo();});removeLogo.id='brandLogoRemove';
  const showLogo=()=>{const src=pendingLogo===undefined?editing?.logo:pendingLogo;logoImg.hidden=!src;removeLogo.hidden=!src;if(src)logoImg.src=src;else logoImg.removeAttribute('src');preview();};
  file.onchange=async()=>{logoErr.textContent='';fileName.textContent=file.files[0]?.name||'';try{pendingLogo=await readLogo(file.files[0]);showLogo();}catch(e){logoErr.textContent=e.message;file.value='';fileName.textContent='';}};
  const prev=el('div',undefined,form,'brand-preview');prev.setAttribute('aria-label','Vista previa del pie de entrega');
  const preview=()=>{prev.replaceChildren();el('span','Así firmará tus entregas:',prev,'brand-preview-label');const band=el('div',undefined,prev,'brand-band');const src=pendingLogo===undefined?editing?.logo:pendingLogo;if(src){const i=el('img',undefined,band);i.src=src;i.alt='';}
   const t=el('div',undefined,band);el('strong',f.name.value.trim()||'Nombre comercial',t);el('small',B.contactLine({person:f.person.value,phone:f.phone.value,email:f.email.value,web:f.web.value})||'Contacto',t);
   el('p',`${B.credit({name:f.name.value.trim()||'…'})} · Cotas y superficies orientativas; verifica medidas in situ.`,prev,'brand-credit');};
  for(const input of Object.values(f))input.addEventListener('input',preview);
  const row=el('div',undefined,form,'brand-actions');const save=el('button',editing?.id?'Guardar cambios':'Guardar marca',row,'btn primary');save.type='submit';save.id='brandSave';
  button('Nueva marca',row,()=>edit(null)).id='brandNew';
  const status=el('p',undefined,form,'brand-status');status.setAttribute('role','status');
  form.onsubmit=e=>{e.preventDefault();for(const s of form.querySelectorAll('.brand-error'))s.textContent='';
   const input={id:editing?.id,...Object.fromEntries(Object.entries(f).map(([k,i])=>[k,i.value])),logo:pendingLogo===undefined?editing?.logo:pendingLogo};
   try{const p=B.saveProfile(store,input);editing=p;pendingLogo=undefined;status.textContent=`Marca «${p.name}» guardada.`;render();changed();dialog.querySelector('.brand-status').textContent=`Marca «${p.name}» guardada.`;}
   catch(err){const target=form.querySelector(`#brand-${err.field||'name'}-error`)||status;target.textContent=err.message;(f[err.field]||file).focus?.();}};
  showLogo();
 }
 function edit(p){editing=p?{...p}:null;pendingLogo=undefined;render();dialog.querySelector('#brand-name')?.focus();}
 function open(profile){returnTo=document.activeElement;editing=profile||null;pendingLogo=undefined;render();dialog.showModal();dialog.querySelector('#brandTitle').focus();}
 dialog.addEventListener('close',()=>{returnTo?.focus?.({preventScroll:true});});

 // «Archivo → Tu marca profesional…»
 const entry=document.createElement('button');entry.type='button';entry.className='btn';entry.id='brandManage';entry.textContent='Tu marca profesional…';
 (document.querySelector('#openSheet')||document.querySelector('#exportPng'))?.after(entry);
 entry.onclick=()=>{entry.closest('details')?.removeAttribute('open');open();};

 // «Firmar con»: a select bound to the active project, used by the presentation settings and the sheet.
 function profileSelect(onChange){
  const wrap=el('label',undefined,undefined,'brand-sign');el('span','Firmar con',wrap);const sel=el('select',undefined,wrap);sel.className='brand-select';
  const fill=()=>{const d=B.delivery(store,app.entryId);sel.replaceChildren();const none=el('option','Sin marca',sel);none.value='';for(const p of B.readProfiles(store).profiles){const o=el('option',p.name,sel);o.value=p.id;}sel.value=d.profileId||'';};
  fill();sel.onchange=()=>{try{B.setDelivery(store,app.entryId,{profileId:sel.value||null});onChange?.();}catch(e){say(e.message,5000);fill();}};
  listeners.add(fill);return {element:wrap,select:sel,refresh:fill};
 }
 // Presentation settings: brand, title and introduction for the client (per project).
 function configFields(parent){
  const box=el('fieldset',undefined,parent,'brand-config');el('legend','Entrega al cliente',box);
  const sign=profileSelect(()=>title.placeholder=app.project.name||'');box.append(sign.element);
  const manage=button('Gestionar marcas…',box,()=>open());manage.id='brandConfigManage';
  const d=B.delivery(store,app.entryId);
  const tl=el('label',undefined,box,'brand-field');el('span','Título para el cliente',tl);const title=el('input',undefined,tl);title.id='brandDeliveryTitle';title.maxLength=B.LIMITS.title;title.value=d.title;title.placeholder=typeof nm==='function'?nm(app.project.name||''):app.project.name||'';
  const il=el('label',undefined,box,'brand-field');el('span','Introducción (aparece en la vista general)',il);const intro=el('textarea',undefined,il);intro.id='brandDeliveryIntro';intro.maxLength=B.LIMITS.intro;intro.rows=2;intro.value=d.intro;
  const persist=()=>{try{B.setDelivery(store,app.entryId,{title:title.value,intro:intro.value});}catch(e){say(e.message,5000);}};title.onchange=persist;intro.onchange=persist;
  el('small','Sin marca, la presentación queda como hasta ahora. La marca se guarda en este navegador y no viaja en el proyecto exportado.',box,'brand-help');
  return box;
 }
 function snapshot(){return B.snapshot(store,app.entryId,typeof nm==='function'?nm(app.project?.name||''):app.project?.name||'');}
 // Presentation card: brand on every view, introduction on the overview and the contact as the next step on the last view.
 function decorate(card,snap,{index,count,kind}={}){
  card.querySelectorAll('.presentation-brand,.presentation-intro,.presentation-next').forEach(n=>n.remove());if(!snap)return;
  const p=snap.profile,top=el('div',undefined,undefined,'presentation-brand');if(p.logo){const i=el('img',undefined,top);i.src=p.logo;i.alt='';}
  const t=el('div',undefined,top);el('strong',p.name,t);el('small',snap.title,t);card.prepend(top);
  if(kind==='overview'&&snap.intro)top.after(Object.assign(el('p',snap.intro,undefined,'presentation-intro')));
  if(index===count-1){const next=el('p',undefined,undefined,'presentation-next');el('strong','Siguiente paso: ',next);next.append(`contacta con ${p.name}`+(B.contactLine(p)?` · ${B.contactLine(p)}`:''));card.querySelector('.presentation-controls')?.before(next);}
 }
 // PNG view with a bottom strip: logo, business name, project title and the view label. Same size as the input.
 async function stamp(dataUrl,snap,label){
  if(!snap)return dataUrl;
  const img=new Image();img.src=dataUrl;await img.decode();const w=img.width,h=img.height,c=document.createElement('canvas');c.width=w;c.height=h;const x=c.getContext('2d');x.drawImage(img,0,0);
  const band=Math.max(44,Math.round(h*.075)),pad=Math.round(band*.22),y=h-band;
  x.fillStyle='rgba(255,255,255,.9)';x.fillRect(0,y,w,band);x.fillStyle='#d5d9db';x.fillRect(0,y,w,1);
  let left=pad;if(snap.profile.logo){const logo=new Image();logo.src=snap.profile.logo;await logo.decode();const lh=band-pad*2,lw=Math.min(lh*3,logo.width*lh/logo.height);x.drawImage(logo,left,y+pad,lw,lh);left+=lw+pad;}
  const f1=Math.round(band*.34),f2=Math.round(band*.26);x.textBaseline='middle';x.fillStyle='#1f2326';x.font=`600 ${f1}px Inter, Arial, sans-serif`;
  const fit=(s,max,font)=>{x.font=font;if(x.measureText(s).width<=max)return s;while(s.length>1&&x.measureText(s+'…').width>max)s=s.slice(0,-1);return s+'…';};
  const right=label?fit(label,w*.35,`500 ${f2}px Inter, Arial, sans-serif`):'';x.font=`500 ${f2}px Inter, Arial, sans-serif`;const rw=right?x.measureText(right).width:0;
  const avail=w-left-pad*2-rw;x.fillText(fit(snap.profile.name,avail,`600 ${f1}px Inter, Arial, sans-serif`),left,y+band*.36);
  x.fillStyle='#5b6266';x.fillText(fit(snap.title,avail,`500 ${f2}px Inter, Arial, sans-serif`),left,y+band*.72);
  if(right){x.textAlign='right';x.fillText(right,w-pad,y+band/2);x.textAlign='left';}
  return c.toDataURL('image/png');
 }
 window.FloorPlanBrandUI={open,profileSelect,configFields,snapshot,decorate,stamp,onChange(fn){listeners.add(fn);},get store(){return store;}};
})();
