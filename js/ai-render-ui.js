/* Phase B2: AI render from a real Rubik view. The professional picks one prepared view (FloorPlanProjectViews) and a
   style; the image alone goes to this deployment's /api/render, which calls OpenAI with a fixed prompt that keeps the
   view's geometry. The result is shown next to the real view and labelled as AI-generated everywhere. The project is
   never sent and never changed: Rubik's geometry stays the authority, the AI only changes one picture. Results live
   in memory for this session. Access token: stored only in this browser (it matches RUBIK_RENDER_TOKEN in Vercel). */
(function(){
 'use strict';
 const app=window.FloorPlanApp;if(!app||!window.FloorPlanProjectViews)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const TOKEN_KEY='rubik-render-token',ENDPOINT='api/render';
 const STYLES=()=>[['natural',tx('Luz natural','Natural light','自然光')],['warm',tx('Cálido','Warm','温暖')],['scandinavian',tx('Escandinavo','Scandinavian','北欧')],['premium',tx('Premium inmobiliario','Premium real estate','高端房产')]];
 const ERRORS=()=>({'not-configured':tx('El Render IA no está configurado en este servidor. Añade OPENAI_API_KEY y RUBIK_RENDER_TOKEN en las variables de entorno de Vercel.','AI render is not configured on this server. Add OPENAI_API_KEY and RUBIK_RENDER_TOKEN to the Vercel environment variables.','此服务器未配置 AI 渲染。'),token:tx('El código de acceso no es correcto.','The access code is not correct.','访问码不正确。'),style:tx('Estilo no válido.','Invalid style.','风格无效。'),image:tx('La imagen de la vista no es válida.','The view image is not valid.','视图图片无效。'),'provider-rate-limit':tx('OpenAI ha limitado las peticiones. Espera un momento y vuelve a intentarlo.','OpenAI rate-limited the request. Wait a moment and try again.','OpenAI 限流，请稍后重试。'),'provider-rejected':tx('OpenAI ha rechazado esta imagen.','OpenAI rejected this image.','OpenAI 拒绝了此图片。'),'provider-unreachable':tx('No se pudo contactar con OpenAI.','OpenAI could not be reached.','无法连接 OpenAI。'),'provider-error':tx('OpenAI no pudo generar la imagen.','OpenAI could not generate the image.','OpenAI 无法生成图片。'),'provider-empty':tx('OpenAI no devolvió ninguna imagen.','OpenAI returned no image.','OpenAI 未返回图片。'),unavailable:tx('El Render IA no está disponible en este servidor (la función /api/render no existe aquí).','AI render is not available on this server (/api/render does not exist here).','此服务器不提供 AI 渲染。')});
 const results=new Map();let consent=false;
 const token=()=>{try{return localStorage.getItem(TOKEN_KEY)||'';}catch{return '';}};
 const setToken=v=>{try{v?localStorage.setItem(TOKEN_KEY,v):localStorage.removeItem(TOKEN_KEY);}catch{}};
 const key=(viewId,style)=>[app.entryId,app.project.id,FloorPlanGuide.revision(app.project),viewId,style].join('|');
 async function jpeg(src){const img=new Image();img.src=src;await img.decode();const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.drawImage(img,0,0);return c.toDataURL('image/jpeg',.9);}
 // Only the image of the view and the style key leave the browser.
 async function render(view,style){
  const k=key(view.id,style);if(results.has(k))return results.get(k);
  let r;try{r=await fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json','x-rubik-render-token':token()},body:JSON.stringify({style,image:await jpeg(view.dataUrl)})});}
  catch{throw Error(ERRORS()['provider-unreachable']);}
  if(r.status===404)throw Error(ERRORS().unavailable);
  const out=await r.json().catch(()=>null);
  if(!r.ok||!out?.image?.startsWith('data:image/'))throw Error(ERRORS()[out?.error]||ERRORS()['provider-error']);
  const result={viewId:view.id,label:view.label,style,image:out.image,original:view.dataUrl,model:out.model||null,generatedAt:out.generatedAt||new Date().toISOString()};results.set(k,result);return result;
 }
 // Download: the AI image in the delivery format, saying in its own band that it is AI-generated and orientative.
 async function download(result){
  const snap=window.FloorPlanBrandUI?.snapshot()||null,p=snap?.profile;
  const data=FloorPlanDeliveryImage.content({title:snap?.title||(typeof nm==='function'?nm(app.project.name):app.project.name),view:tx('Render IA · ','AI render · ','AI 渲染 · ')+result.label,rooms:[],brand:p&&p.name?{name:p.name,logo:p.logo,contact:''}:null});
  data.note=tx('Imagen generada por IA a partir de la vista real del proyecto · orientativa, puede alterar detalles','AI-generated image from the project\'s real view · orientative, details may differ','根据项目真实视图生成的 AI 图片 · 仅供参考');
  const out=await FloorPlanDeliveryImage.compose({image:result.image,format:'landscape',layout:'band',data});
  const a=document.createElement('a');a.href=out.dataUrl;a.download=`rubik-sota-render-ia-${String(result.label).normalize('NFD').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase()||'vista'}.png`;a.click();return out;
 }
 // Dialog: what is sent and where, the access code, the style, then real view vs AI render side by side.
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog');dialog.id='aiRenderDialog';dialog.setAttribute('aria-labelledby','aiRenderTitle');let current=null,returnFocus=null;
 function open(view){current=view;returnFocus=document.activeElement;draw();dialog.showModal();dialog.querySelector('select,input,button')?.focus();}
 function draw(result=null,error=''){
  dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');const h=el('h2',tx('Render IA · ','AI render · ','AI 渲染 · ')+current.label,head);h.id='aiRenderTitle';
  const close=el('button',tx('Cerrar','Close','关闭'),head,'btn');close.type='button';close.id='aiRenderClose';close.onclick=()=>dialog.close();
  const note=el('p',undefined,dialog,'ai-render-note');note.id='aiRenderConsent';note.textContent=tx('Se envía sólo la imagen de esta vista a OpenAI a través del servidor de Rubik para generar una versión fotorrealista. No se envían el proyecto, la ubicación ni tus datos. El coste se carga en la cuenta de OpenAI configurada. El resultado es orientativo y puede alterar detalles: la geometría válida es la del proyecto.','Only this view\'s image is sent to OpenAI through Rubik\'s server to create a photorealistic version. The project, location and your details are not sent. The cost is charged to the configured OpenAI account. The result is orientative and may alter details: the valid geometry is the project\'s.','仅将此视图图片经 Rubik 服务器发送给 OpenAI 生成写实版本，不发送项目、位置或您的数据。费用计入已配置的 OpenAI 账户。结果仅供参考。');
  const form=el('div',undefined,dialog,'ai-render-form');
  const tl=el('label',undefined,form);el('span',tx('Código de acceso','Access code','访问码'),tl);const ti=el('input',undefined,tl);ti.type='password';ti.id='aiRenderToken';ti.autocomplete='off';ti.value=token();ti.placeholder=tx('El valor de RUBIK_RENDER_TOKEN','The RUBIK_RENDER_TOKEN value','RUBIK_RENDER_TOKEN 的值');
  const sl=el('label',undefined,form);el('span',tx('Estilo','Style','风格'),sl);const ss=el('select',undefined,sl);ss.id='aiRenderStyle';for(const [k,l] of STYLES()){const o=el('option',l,ss);o.value=k;}if(result)ss.value=result.style;
  const ok=el('label',undefined,form,'ai-render-consent');const cb=el('input',undefined,ok);cb.type='checkbox';cb.id='aiRenderAgree';cb.checked=consent;el('span',tx('Entiendo qué se envía y que el resultado es una imagen IA orientativa.','I understand what is sent and that the result is an orientative AI image.','我了解发送内容，且结果为参考性 AI 图片。'),ok);
  const go=el('button',tx('Generar render IA','Generate AI render','生成 AI 渲染'),form,'btn primary');go.type='button';go.id='aiRenderGo';
  const status=el('p',error,dialog,'ai-render-status');status.id='aiRenderStatus';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
  const compare=el('div',undefined,dialog,'ai-render-compare');
  const fig=(src,cap,cls)=>{const f=el('figure',undefined,compare,cls);const i=el('img',undefined,f);i.src=src;i.alt=cap;el('figcaption',cap,f);return f;};
  fig(current.dataUrl,tx('Vista real del proyecto','Real project view','项目真实视图'),'is-real');
  if(result){fig(result.image,tx('Render IA (orientativo)','AI render (orientative)','AI 渲染（参考）'),'is-ai');const dl=el('button',tx('Descargar render IA','Download AI render','下载 AI 渲染'),dialog,'btn');dl.type='button';dl.id='aiRenderDownload';dl.onclick=()=>download(result);}
  go.onclick=async()=>{if(!cb.checked){status.textContent=tx('Confirma que entiendes qué se envía.','Confirm that you understand what is sent.','请确认您了解发送内容。');cb.focus();return;}
   if(!ti.value.trim()){status.textContent=tx('Introduce el código de acceso.','Enter the access code.','请输入访问码。');ti.focus();return;}
   consent=true;setToken(ti.value.trim());go.disabled=true;status.textContent=tx('Generando… puede tardar hasta un minuto.','Generating… it can take up to a minute.','正在生成…最多约一分钟。');
   try{const r=await render(current,ss.value);draw(r,tx('Render IA listo. Compáralo con la vista real antes de usarlo.','AI render ready. Compare it with the real view before using it.','AI 渲染完成，请先与真实视图比较。'));dialog.querySelector('#aiRenderDownload')?.focus();}
   catch(e){draw(null,e.message);if(/código de acceso|access code/i.test(e.message))setToken('');}};
 }
 dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 window.FloorPlanAIRender={open,render,download,get results(){return [...results.entries()].filter(([k,r])=>k===key(r.viewId,r.style)).map(([,r])=>r);},STYLES:()=>STYLES().map(s=>s[0])};
})();
