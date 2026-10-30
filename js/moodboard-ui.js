/* Phase B7: «Material board» in Entregar. Composes one 1600×1100 image from FloorPlanMoodboard.derive: the real 3D
   overview when it is prepared, the floor finishes (real catalog samples, or the material colour) with m² and rooms,
   the wall finishes and the furniture palette. Preview and download are the same canvas. Colours are orientative. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,M=window.FloorPlanMoodboard;if(!app||!M)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const local=v=>typeof nm==='function'?nm(v):v;
 const W=1600,H=1100,INK='#2d332f',MUTED='#6b6a5f',PAPER='#fbf8f2',RULE='#d8d0c2',ACCENT='#875936';
 const num=(n,d=1)=>n.toLocaleString(typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES',{maximumFractionDigits:d});
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
 const loadImage=src=>new Promise(res=>{const i=new Image();i.onload=()=>res(i);i.onerror=()=>res(null);i.src=src;});
 const data=()=>M.derive(app.project,{catalog:window.FloorPlanSurfaces,name:local});
 function fit(ctx,text,max){if(ctx.measureText(text).width<=max)return text;let t=text;while(t.length>1&&ctx.measureText(t+'…').width>max)t=t.slice(0,-1);return t+'…';}
 // A swatch: the real sample tiled, or the colour with a light pattern that says what kind of finish it is.
 function tile(ctx,x,y,s,sw,img){
  ctx.save();ctx.beginPath();ctx.rect(x,y,s,s);ctx.clip();ctx.fillStyle=sw.color;ctx.fillRect(x,y,s,s);
  if(img){const p=ctx.createPattern(img,'repeat');ctx.fillStyle=p;ctx.translate(x,y);ctx.fillRect(0,0,s,s);ctx.translate(-x,-y);}
  else{ctx.strokeStyle='rgba(0,0,0,.08)';ctx.lineWidth=2;const k=String(sw.preset||'');
   if(/wood|walnut|oak/.test(k))for(let i=0;i<s;i+=s/7){ctx.beginPath();ctx.moveTo(x,y+i);ctx.lineTo(x+s,y+i);ctx.stroke();}
   else if(/tile|ceramic/.test(k)){const n=/800/.test(k)?2:/600/.test(k)?3:5;for(let i=1;i<n;i++){ctx.beginPath();ctx.moveTo(x+i*s/n,y);ctx.lineTo(x+i*s/n,y+s);ctx.moveTo(x,y+i*s/n);ctx.lineTo(x+s,y+i*s/n);ctx.stroke();}}
   else if(/terrazzo/.test(k)){ctx.fillStyle='rgba(0,0,0,.12)';for(let i=0;i<70;i++){const a=(i*97)%s,b=(i*53)%s;ctx.fillRect(x+a,y+b,5,4);}}
   else if(/marble/.test(k)){ctx.strokeStyle='rgba(90,90,90,.18)';for(let i=0;i<4;i++){ctx.beginPath();ctx.moveTo(x,y+s*(.2+i*.2));ctx.bezierCurveTo(x+s*.3,y+s*(.1+i*.2),x+s*.6,y+s*(.35+i*.2),x+s,y+s*(.15+i*.2));ctx.stroke();}}}
  ctx.restore();ctx.strokeStyle=RULE;ctx.lineWidth=2;ctx.strokeRect(x,y,s,s);
 }
 async function compose(){
  const d=data(),c=document.createElement('canvas');c.width=W;c.height=H;const ctx=c.getContext('2d');
  ctx.fillStyle=PAPER;ctx.fillRect(0,0,W,H);
  const snap=window.FloorPlanBrandUI?.snapshot?.(),brand=snap?.profile?.name||'',title=snap?.title||local(app.project.name);
  ctx.fillStyle=ACCENT;ctx.font='600 20px system-ui,sans-serif';ctx.fillText(tx('MATERIAL BOARD','MATERIAL BOARD','材料板'),64,74);
  ctx.fillStyle=INK;ctx.font='400 46px Georgia,serif';ctx.fillText(fit(ctx,title,900),64,128);
  if(brand){ctx.font='600 22px system-ui,sans-serif';ctx.textAlign='right';ctx.fillText(fit(ctx,brand,500),W-64,74);ctx.textAlign='left';}
  ctx.fillStyle=RULE;ctx.fillRect(64,154,W-128,2);
  // Right column: the real 3D overview when prepared (so the board shows the home, not only swatches).
  const overview=(window.FloorPlanProjectViews?.current()||[]).find(v=>v.kind==='overview');let left=W-128;
  if(overview){const img=await loadImage(overview.dataUrl);if(img){const w=620,h=Math.round(w*img.naturalHeight/img.naturalWidth);ctx.drawImage(img,W-64-w,186,w,Math.min(h,520));ctx.strokeStyle=RULE;ctx.strokeRect(W-64-w,186,w,Math.min(h,520));ctx.fillStyle=MUTED;ctx.font='15px system-ui,sans-serif';ctx.fillText(tx('Vista 3D real del proyecto','Real 3D view of the project','项目真实三维视图'),W-64-w,186+Math.min(h,520)+24);left=W-128-w-48;}}
  let y=200;const S=176,G=28;
  const section=(label)=>{ctx.fillStyle=ACCENT;ctx.font='600 18px system-ui,sans-serif';ctx.fillText(label.toUpperCase(),64,y);y+=18;};
  async function swatches(list,detail){let x=64;for(const sw of list){if(x+S>64+left){x=64;y+=S+92;}const img=sw.sample?await loadImage(sw.sample):null;tile(ctx,x,y,S,sw,img);
    ctx.fillStyle=INK;ctx.font='600 18px system-ui,sans-serif';ctx.fillText(fit(ctx,sw.name,S),x,y+S+26);ctx.fillStyle=MUTED;ctx.font='15px system-ui,sans-serif';const [a,b]=detail(sw);ctx.fillText(fit(ctx,a,S),x,y+S+48);if(b)ctx.fillText(fit(ctx,b,S),x,y+S+68);x+=S+G;}y+=S+104;}
  section(tx('Suelos','Floors','地面'));
  if(d.floors.length)await swatches(d.floors.slice(0,8),f=>[`${num(f.areaM2)} m² · ${f.rooms.length} ${f.rooms.length===1?tx('estancia','room','个房间'):tx('estancias','rooms','个房间')}`,f.rooms.join(', ')]);
  else{ctx.fillStyle=MUTED;ctx.font='17px system-ui,sans-serif';ctx.fillText(tx('Sin acabados de suelo asignados.','No floor finishes assigned.','未分配地面材料。'),64,y+24);y+=60;}
  section(tx('Paredes','Walls','墙面'));
  if(d.walls.length)await swatches(d.walls.slice(0,6),w=>[`${num(w.lengthM)} m ${tx('de pared','of wall','墙长')}`,`${w.count} ${w.count===1?tx('tramo','segment','段'):tx('tramos','segments','段')}`]);
  else{ctx.fillStyle=MUTED;ctx.font='17px system-ui,sans-serif';ctx.fillText(tx('Acabado de pared predeterminado (sin asignar).','Default wall finish (not assigned).','默认墙面（未分配）。'),64,y+24);y+=60;}
  // Furniture palette, weighted by footprint.
  section(tx('Mobiliario · paleta','Furniture · palette','家具 · 配色'));
  let x=64;ctx.font='15px system-ui,sans-serif';
  for(const p of d.palette){ctx.fillStyle=p.color;ctx.beginPath();ctx.arc(x+34,y+40,34,0,Math.PI*2);ctx.fill();ctx.strokeStyle=RULE;ctx.lineWidth=2;ctx.stroke();ctx.fillStyle=INK;ctx.fillText(fit(ctx,p.names.join(', '),150),x,y+100);ctx.fillStyle=MUTED;ctx.fillText(p.color.toUpperCase(),x,y+120);x+=168;if(x>W-200)break;}
  if(!d.palette.length){ctx.fillStyle=MUTED;ctx.fillText(tx('Sin mobiliario.','No furniture.','无家具。'),64,y+24);}
  ctx.fillStyle=RULE;ctx.fillRect(64,H-74,W-128,2);ctx.fillStyle=MUTED;ctx.font='15px system-ui,sans-serif';
  ctx.fillText(tx('Generado con Rubik Sota a partir de los materiales y el mobiliario del proyecto. Colores y texturas orientativos.','Generated with Rubik Sota from the project materials and furniture. Colours and textures are orientative.','由 Rubik Sota 根据项目材料和家具生成。颜色与纹理仅供参考。'),64,H-42);
  return {canvas:c,data:d};
 }
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog moodboard-dialog');dialog.id='moodboardDialog';dialog.setAttribute('aria-labelledby','moodboardTitle');
 let returnFocus=null,last=null;dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 async function open(){returnFocus=document.activeElement;dialog.replaceChildren();const head=el('div',undefined,dialog,'ai-render-head');el('h2',tx('Material board','Material board','材料板'),head).id='moodboardTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='moodboardClose';close.onclick=()=>dialog.close();
  el('p',tx('Composición con los acabados y el mobiliario que ya tiene el proyecto: nada se inventa. Si cambias materiales, vuelve a abrirla.','A composition of the finishes and furniture the project already has: nothing is invented. If you change materials, open it again.','用项目现有的材料和家具组成，不会虚构。'),dialog,'ai-render-note').id='moodboardNote';
  const status=el('p',tx('Preparando…','Preparing…','正在准备…'),dialog,'ai-render-status');status.id='moodboardStatus';status.setAttribute('role','status');
  dialog.showModal();
  try{last=await compose();const img=el('img',undefined,dialog,'moodboard-preview');img.id='moodboardPreview';img.alt=tx('Material board del proyecto','Project material board','项目材料板');img.src=last.canvas.toDataURL('image/png');
   const d=last.data;status.textContent=d.empty?tx('El proyecto no tiene acabados ni mobiliario con color todavía.','The project has no finishes or coloured furniture yet.','项目尚无材料或带颜色的家具。'):tx(`${d.floors.length} suelos · ${d.walls.length} acabados de pared · ${d.palette.length} colores de mobiliario`,`${d.floors.length} floors · ${d.walls.length} wall finishes · ${d.palette.length} furniture colours`,`${d.floors.length} 种地面 · ${d.walls.length} 种墙面 · ${d.palette.length} 种家具颜色`);
   const row=el('div',undefined,dialog,'tour-video-actions');const dl=btn(tx('Descargar material board (PNG)','Download material board (PNG)','下载材料板 (PNG)'),row,'btn primary');dl.id='moodboardDownload';dl.onclick=download;dl.focus();}
  catch(e){status.textContent=e.message||String(e);}
 }
 function download(){if(!last)return;const a=document.createElement('a');a.href=last.canvas.toDataURL('image/png');a.download=`rubik-sota-material-board-${slug(local(app.project.name))}.png`;document.body.append(a);a.click();a.remove();}
 window.FloorPlanMoodboardUI={open,compose};
})();
