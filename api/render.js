/* Phase B2: AI render of a real Rubik view (Vercel Node function, POST /api/render).
   The browser sends ONE prepared 3D view (JPEG/PNG data URL) and a style key; this function forwards it to OpenAI's
   image edit endpoint with a fixed, server-side prompt that keeps the view's geometry, and returns the image.
   - OPENAI_API_KEY never reaches the browser (Vercel environment secret).
   - RUBIK_RENDER_TOKEN: shared access token the professional enters once in Rubik; without it the endpoint refuses,
     so nobody can spend the owner's OpenAI credit through the public URL.
   - Only the image and a style are sent: no project data, location or contact. Nothing is stored here.
   The Rubik geometry stays the authority: the AI only changes the presentation of one image. */
'use strict';
const {timingSafeEqual}=require('node:crypto');
const same=(a,b)=>{const x=Buffer.from(String(a)),y=Buffer.from(String(b));return x.length===y.length&&timingSafeEqual(x,y);};
const MODEL=process.env.RUBIK_RENDER_MODEL||'gpt-image-1';
const MAX_BYTES=3.5*1024*1024;
const STYLES={
 natural:'natural daylight, soft realistic shadows, neutral contemporary finishes',
 warm:'warm evening light, cosy atmosphere, warm wood and textile tones',
 scandinavian:'Scandinavian style, light oak, white walls, soft textiles, bright diffuse daylight',
 premium:'premium real-estate photography look, refined materials, balanced high-end lighting'};
function prompt(style){
 return 'Turn this 3D view of a home into a photorealistic architectural visualization. '
  +'Keep EXACTLY the same camera angle, walls, wall positions, doors, windows, room layout, proportions and furniture placement. '
  +'Do not add or remove rooms, walls, openings or large furniture. Do not add text, logos or people. '
  +`Style: ${STYLES[style]}.`;
}
function send(res,status,body){res.statusCode=status;res.setHeader('Content-Type','application/json; charset=utf-8');res.setHeader('Cache-Control','no-store');res.end(JSON.stringify(body));}
function parseImage(dataUrl){
 const m=/^data:(image\/(?:png|jpeg));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl||''));
 if(!m)return null;const bytes=Buffer.from(m[2],'base64');
 if(!bytes.length||bytes.length>MAX_BYTES)return null;return {type:m[1],bytes};
}
async function handler(req,res,{fetchImpl=globalThis.fetch,env=process.env}={}){
 if(req.method!=='POST')return send(res,405,{error:'method'});
 if(!env.OPENAI_API_KEY||!env.RUBIK_RENDER_TOKEN)return send(res,503,{error:'not-configured'});
 const token=req.headers['x-rubik-render-token'];
 if(typeof token!=='string'||token.length>200||!same(token,env.RUBIK_RENDER_TOKEN))return send(res,401,{error:'token'});
 let body=req.body;if(typeof body==='string'){try{body=JSON.parse(body);}catch{return send(res,400,{error:'json'});}}
 const style=body?.style;if(!Object.hasOwn(STYLES,style))return send(res,400,{error:'style'});
 const image=parseImage(body?.image);if(!image)return send(res,400,{error:'image'});
 const form=new FormData();form.append('model',MODEL);form.append('prompt',prompt(style));form.append('n','1');form.append('size','1536x1024');
 form.append('image',new Blob([image.bytes],{type:image.type}),image.type==='image/png'?'view.png':'view.jpg');
 let r;try{r=await fetchImpl('https://api.openai.com/v1/images/edits',{method:'POST',headers:{Authorization:`Bearer ${env.OPENAI_API_KEY}`},body:form});}
 catch{return send(res,502,{error:'provider-unreachable'});}
 const out=await r.json().catch(()=>null);
 if(!r.ok){const code=r.status===429?'provider-rate-limit':r.status===400?'provider-rejected':'provider-error';return send(res,502,{error:code});}
 const b64=out?.data?.[0]?.b64_json;if(!b64)return send(res,502,{error:'provider-empty'});
 return send(res,200,{image:`data:image/png;base64,${b64}`,model:MODEL,style,generatedAt:new Date().toISOString()});
}
module.exports=(req,res)=>handler(req,res);
module.exports.handler=handler;module.exports.STYLES=STYLES;module.exports.prompt=prompt;
