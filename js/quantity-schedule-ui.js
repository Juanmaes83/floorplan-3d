/* Phase C1: «Cantidades del proyecto» in Presupuestar. Shows FloorPlanQuantitySchedule tables (rooms, floor finishes,
   walls, openings, furniture) with each figure's status, and exports them as one CSV for a Spanish spreadsheet.
   Read-only: nothing here changes the project. Unavailable figures read «—», never 0. */
(function(){
 'use strict';
 const app=window.FloorPlanApp,S=window.FloorPlanQuantitySchedule;if(!app||!S)return;
 const tx=(es,en,zh)=>({es,en,zh})[typeof LANG==='string'?LANG:'es']||es;
 const el=(tag,text,parent,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;parent?.append(n);return n;};
 const btn=(text,parent,cls='btn')=>{const b=el('button',text,parent,cls);b.type='button';return b;};
 const local=v=>typeof nm==='function'?nm(v):v;
 const num=(v,d=2)=>v===null||v===undefined?'—':v.toLocaleString(typeof LANG==='string'&&LANG==='en'?'en-GB':'es-ES',{minimumFractionDigits:d,maximumFractionDigits:d});
 const STATUS=()=>({measured:tx('Medido','Measured','已测量'),estimated:tx('Estimado','Estimated','估算'),unavailable:tx('No disponible','Unavailable','不可用')});
 const KIND=()=>({door:tx('Puerta','Door','门'),'sliding-door':tx('Puerta corredera','Sliding door','推拉门'),window:tx('Ventana','Window','窗'),opening:tx('Hueco de paso','Opening','开口')});
 const LIFE=()=>({existing:tx('Muros existentes','Existing walls','现有墙'),new:tx('Muros nuevos','New walls','新墙'),demolished:tx('Muros a demoler','Walls to demolish','拆除墙')});
 const labels=()=>({section:tx('Apartado','Section','部分'),item:tx('Elemento','Item','项目'),quantity:tx('Cantidad','Quantity','数量'),unit:tx('Unidad','Unit','单位'),detail:tx('Detalle','Detail','详情'),status:tx('Estado','Status','状态'),
  rooms:tx('Estancias','Rooms','房间'),floors:tx('Pavimentos','Floor finishes','地面'),walls:tx('Muros','Walls','墙体'),openings:tx('Carpinterías','Doors and windows','门窗'),furniture:tx('Mobiliario','Furniture','家具'),
  perimeter:tx('perímetro','perimeter','周长'),wallNet:tx('paredes netas','net walls','净墙面'),excluded:tx('fuera del cómputo','excluded from total','不计入'),segments:tx('tramos','segments','段'),faceNet:tx('cara neta','net face','净面'),
  statusText:s=>STATUS()[s]||'',wallStatus:s=>LIFE()[s]||s,kind:k=>KIND()[k]||k});
 const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';
 const schedule=()=>S.build(app.project,{name:local});
 const dialog=el('dialog',undefined,document.body,'ai-render-dialog quantity-dialog');dialog.id='quantityDialog';dialog.setAttribute('aria-labelledby','quantityTitle');
 let returnFocus=null;dialog.addEventListener('close',()=>returnFocus?.focus?.({preventScroll:true}));
 function table(parent,caption,head,rows,id){const wrap=el('div',undefined,parent,'quantity-table-wrap');const t=el('table',undefined,wrap,'quantity-table');t.id=id;el('caption',caption,t);const tr=el('tr',undefined,el('thead',undefined,t));for(const h of head)el('th',h,tr).scope='col';const tb=el('tbody',undefined,t);for(const r of rows){const row=el('tr',undefined,tb);r.forEach((c,i)=>{const td=el(i===0?'th':'td',c,row);if(i===0)td.scope='row';else if(/^[\d—]/.test(c))td.className='is-num';});}return t;}
 function open(){
  returnFocus=document.activeElement;const s=schedule(),st=STATUS(),L=labels();dialog.replaceChildren();
  const head=el('div',undefined,dialog,'ai-render-head');el('h2',tx('Cantidades del proyecto','Project quantities','项目工程量'),head).id='quantityTitle';
  const close=btn(tx('Cerrar','Close','关闭'),head);close.id='quantityClose';close.onclick=()=>dialog.close();
  const note=el('p',undefined,dialog,'ai-render-note');note.id='quantityNote';
  note.textContent=tx(`Cantidades calculadas desde la geometría del proyecto (${st[s.totals.floorStatus].toLowerCase()}: ${s.totals.floorStatus==='measured'?'escala calibrada':'escala sin calibrar con una medida conocida'}). Son la base de las partidas; los precios van aparte. «—» = no se puede calcular con la geometría actual.`,`Quantities calculated from the project geometry (${st[s.totals.floorStatus].toLowerCase()}). They are the base of budget items; prices are separate. «—» = cannot be calculated with the current geometry.`,'根据项目几何计算的工程量。');
  if(app.levelContext)el('p',tx('Edificio de varias plantas: las cantidades son de la planta activa.','Multi-level building: quantities are for the active level.','多层建筑：工程量为当前楼层。'),dialog,'quantity-level');
  const sum=el('dl',undefined,dialog,'quantity-summary');sum.id='quantitySummary';const fact=(k,v)=>{const g=el('div',undefined,sum);el('dt',k,g);el('dd',v,g);};
  fact(tx('Superficie útil','Usable area','使用面积'),`${num(s.totals.floorM2)} m²`);fact(tx('Muros','Walls','墙体'),`${num(s.totals.walls.lengthM)} m`);fact(tx('Paredes netas (caras)','Net wall faces','净墙面'),`${num(s.totals.walls.surfaceNetM2)} m²`);fact(tx('Carpinterías','Doors and windows','门窗'),`${s.totals.openings} ud`);fact(tx('Mobiliario','Furniture','家具'),`${s.totals.furniture} ud`);
  const row=el('div',undefined,dialog,'tour-video-actions');const dl=btn(tx('Descargar cantidades (CSV)','Download quantities (CSV)','下载工程量 (CSV)'),row,'btn primary');dl.id='quantityDownload';
  dl.onclick=()=>{const blob=new Blob([S.csv(schedule(),labels())],{type:'text/csv;charset=utf-8'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`rubik-sota-cantidades-${slug(local(app.project.name))}.csv`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),4000);};
  table(dialog,L.rooms,[tx('Estancia','Room','房间'),tx('Suelo m²','Floor m²','地面 m²'),tx('Perímetro m','Perimeter m','周长 m'),tx('Paredes netas m²','Net walls m²','净墙面 m²'),tx('Pavimento','Floor finish','地面材料'),L.status],
   s.rooms.map(r=>[r.name+(r.counted?'':' *'),num(r.floorM2),num(r.perimeterM),num(r.wallNetM2)+(r.wallNetM2!==null&&!r.wallComplete?' ⚠':''),r.floorMaterial||'—',st[r.status]]),'quantityRooms');
  el('p',tx('* Fuera del cómputo de superficie útil. ⚠ Paredes parciales: parte del contorno no coincide con un muro.','* Excluded from usable area. ⚠ Partial walls: part of the outline does not match a wall.','* 不计入面积。⚠ 部分墙体。'),dialog,'quantity-foot');
  table(dialog,L.floors,[tx('Pavimento','Floor finish','地面材料'),'m²',L.rooms,L.status],s.floors.map(f=>[f.name||'—',num(f.areaM2),f.rooms.join(', '),st[f.status]]),'quantityFloors');
  table(dialog,L.walls,[tx('Tipo','Type','类型'),tx('Longitud m','Length m','长度 m'),tx('Tramos','Segments','段'),tx('Cara neta m²','Net face m²','净面 m²'),L.status],s.walls.map(w=>[L.wallStatus(w.lifecycle),num(w.lengthM),String(w.count),num(w.faceNetM2),st[w.status]]),'quantityWalls');
  table(dialog,L.openings,[tx('Tipo','Type','类型'),tx('Ancho × alto','Width × height','宽 × 高'),tx('Unidades','Units','数量')],s.openings.map(o=>[L.kind(o.kind),`${o.widthCm} × ${o.heightCm} cm`,String(o.count)]),'quantityOpenings');
  table(dialog,L.furniture,[tx('Elemento','Item','项目'),tx('Unidades','Units','数量')],s.furniture.map(f=>[f.name,String(f.count)]),'quantityFurniture');
  dialog.showModal();dl.focus();
 }
 window.FloorPlanQuantityUI={open,schedule};
})();
