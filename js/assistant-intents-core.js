/* RUBIK · Asistente IA V2 · AG-1/AG-2: interpretación DETERMINISTA de la consulta y redacción de la respuesta.
   No es un modelo de lenguaje: reconoce un conjunto CERRADO de intenciones en español, inglés y chino y extrae solo
   entidades que EXISTEN en el proyecto (estancias, muebles y materiales, por sus nombres visibles). Lo que no encaja se
   responde como «no lo sé hacer» con ejemplos: nunca se improvisa una acción.
   El texto del usuario, y los nombres que trae el proyecto, son DATOS: ninguna palabra puede invocar una herramienta
   fuera de la lista, ni cambiar el proyecto, ni llamar a la red. Una frase que intenta dar órdenes de sistema («ignora
   las instrucciones…», código, URL) se rechaza como `unsupported`.
   `compose` redacta la respuesta SOLO con cifras de los resultados de herramientas (AssistantToolResultV1): una prueba
   comprueba que cada número visible está en esos resultados.
   UMD: window.RubikAssistantIntents / module.exports. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.RubikAssistantIntents=api;})(typeof self!=='undefined'?self:this,function(){
 'use strict';
 const INTENTS=Object.freeze(['rooms_count','room_area','missing_data','layout_review','budget','set_floor_material','move_object','render','photo_reform','catalog','placed_products','product_cost','budget_detail','visual_refs','advanced','help','unsupported','ambiguous']);
 const norm=s=>String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/\s+/g,' ').trim();
 const has=(t,list)=>list.some(w=>t.includes(w));
 const W={
  injection:['ignora','ignore previous','ignore all','olvida las instrucciones','system prompt','prompt del sistema','<script','javascript:','fetch(','eval(','require(','rm -rf','sudo ','http://','https://','api/','token','contrasena','password','忽略','系统提示'],
  count:['cuantas','cuantos','numero de','how many','number of','多少','几个','几间','几层'],
  rooms:['estancia','habitacion','cuarto','pieza','room','房间','房'],
  levels:['planta','plantas','nivel','niveles','floor','floors','level','levels','楼层','层'],
  area:['superficie','area','m2','m²','metros cuadrados','square','面积','平方'],
  missing:['falta','faltan','que datos','datos incompletos','missing','incomplete','what data','缺少','缺什么','不完整'],
  review:['conflicto','conflictos','choque','choques','solape','solapes','revision','revisa la distribucion','conflict','overlap','clash','冲突','重叠','检查布局'],
  budget:['cuanto cuesta','cuanto vale','presupuesto','coste','costo','precio','importe','how much','cost','budget','price','预算','多少钱','费用','价格'],
  floor:['suelo','pavimento','acabado','solado','floor','flooring','地面','地板','地砖'],
  change:['cambia','cambiar','prueba','probar','pon','poner','usa','usar','change','try','set','use','switch','换成','改成','换','改'],
  move:['mueve','mover','desplaza','desplazar','move','shift','移动','挪'],
  rotate:['gira','girar','rota','rotar','rotate','turn','旋转','转'],
  render:['render','renders','imagen fotorrealista','fotorrealista','photoreal','效果图','渲染'],
  photo:['foto reformada','reforma desde foto','reformar desde fotografia','desde una foto','from a photo','photo reform','照片改造','照片'],
  catalog:['catalogo','producto','productos','sku','catalog','product','产品','目录'],
  // CAT-04 (closed lists, ES/EN/ZH): products placed, units, inclusion, unpriced items, provenance, sheet changes, visual references.
  placed:['he colocado','colocado','colocados','coloque','placed','have i placed','已放置','放置了','放置'],
  units:['cuantas unidades','cuantos unidades','unidades','how many units','units of','几件','多少件'],
  included:['incluido','incluida','esta en el presupuesto','included','in the budget','包含在预算','包含'],
  unpriced:['sin precio','no tienen precio','siguen sin precio','without a price','no price','still have no price','unpriced','没有价格','无价格','还没有价格'],
  incomplete:['incompleto','incompleta','incomplete','不完整'],
  verified:['procede de mi catalogo','cuando se verifico','verifico','verificado','verified','comes from my catalogue','核实'],
  changed:['ha cambiado la ficha','cambiado la ficha','la ficha ha cambiado','cambio la ficha','sheet changed','has the product sheet changed','has the sheet changed','资料变','资料是否变','资料变了'],
  visual:['estudio de imagenes','referencias visuales','referencia visual','resultado visual','image studio','visual reference','visual result','图像工作室','视觉参考','视觉结果'],
  simulation:['simulacion','imagen real','simulation','real image','模拟','真实图像'],
  search:['busca','buscar','encuentra','search for','search','find','查找','搜索','找'],
  advanced:['optimiza','optimizar','genera una distribucion','generar distribucion','distribucion automatica','foto a mueble','mueble 3d desde','optimize','generate a layout','generate layout','photo to furniture','生成布局','优化布局'],
  help:['ayuda','que puedes hacer','que sabes hacer','help','what can you do','帮助','你能做什么'],
  here:['esta estancia','este cuarto','esta habitacion','la seleccionada','la estancia seleccionada','this room','selected room','这个房间','当前房间'],
  thisObj:['este mueble','el seleccionado','this item','selected item','这个家具']
 };
 const DIRS=[['izquierda',-1,0],['left',-1,0],['向左',-1,0],['左',-1,0],['derecha',1,0],['right',1,0],['向右',1,0],['右',1,0],['arriba',0,-1],['up',0,-1],['向上',0,-1],['上',0,-1],['abajo',0,1],['down',0,1],['向下',0,1],['下',0,1]];
 const UNIT=[['mm',1],['毫米',1],['cm',10],['厘米',10],['m',1000],['米',1000],['metro',1000],['metros',1000]];
 // Best entity for the text: a whole visible label scores above a single distinctive word of it («roble» in «Parqué de
 // roble»). A tie between different entities is ambiguous: the assistant asks instead of guessing.
 const SEARCH_STOP=new Set(['el','la','los','las','un','una','de','del','en','mi','mis','me','por','favor','the','a','an','my','for','me','please','catalogo','catalog','catalogue','producto','product','的','我的']);
 const STOP=new Set(['de','del','la','el','los','las','con','y','en','the','of','and','with','for','room','estancia','parque','baldosa']);
 function match(t,entities){
  const words=new Set(t.split(/[^\p{L}\p{N}]+/u).filter(Boolean));const hits=[];
  for(const e of entities||[])for(const l of e.labels||[]){const n=norm(l);if(n.length<1)continue;
   if(n.length>=2&&t.includes(n)){hits.push({id:e.id,score:1000+n.length});continue;}
   if(/[\u4e00-\u9fff]/.test(n)&&n.length>=2&&t.includes(n)){hits.push({id:e.id,score:1000+n.length});continue;}
   for(const w of n.split(/[^\p{L}\p{N}]+/u))if(w.length>=4&&!STOP.has(w)&&words.has(w))hits.push({id:e.id,score:w.length});}
  if(!hits.length)return {kind:'none'};
  const max=Math.max(...hits.map(h=>h.score)),best=[...new Set(hits.filter(h=>h.score===max).map(h=>h.id))];
  return best.length===1?{kind:'one',id:best[0]}:{kind:'many',ids:best};
 }
 function distance(t){
  const m=/(-?\d+(?:[.,]\d+)?)\s*(mm|毫米|cm|厘米|metros|metro|m|米)?/.exec(t);if(!m)return null;
  const n=Number(m[1].replace(',','.')),f=(UNIT.find(u=>u[0]===m[2])||['cm',10])[1];
  const mm=Math.round(n*f);return Number.isFinite(mm)&&Math.abs(mm)<=20000&&mm!==0?mm:null;
 }
 // ctx: {rooms:[{id,labels}], objects:[{id,labels}], materials:[{id,labels}], selection:{kind,id}|null}
 function parse(text,ctx={}){
  if(typeof text!=='string'||!text.trim())return {intent:'help'};
  if(text.length>500)return {intent:'unsupported',reason:'too_long'};
  const t=norm(text);
  if(has(t,W.injection))return {intent:'unsupported',reason:'not_an_instruction'};
  const sel=ctx.selection||null;
  const room=()=>{if(has(t,W.here)&&sel?.kind==='room')return {kind:'one',id:sel.id};return match(t,ctx.rooms);};
  const obj=()=>{const m=match(t,ctx.objects);if(m.kind==='many'&&sel?.kind==='furn'&&m.ids.includes(sel.id))return {kind:'one',id:sel.id};if(m.kind==='none'&&has(t,W.thisObj)&&sel?.kind==='furn')return {kind:'one',id:sel.id};return m;};
  if(has(t,W.advanced))return {intent:'advanced'};
  // CAT-04 routing, before photo/render (an «estudio de imágenes» question is not a photo reform request).
  if(has(t,W.visual)||(has(t,W.simulation)&&has(t,['resultado','imagen','image','result','图像','结果'])))return {intent:'visual_refs',focus:has(t,W.simulation)?'kind':'list'};
  // A named product wins; otherwise the selected object's product only when the question points at one («este/ese
  // producto», «this/that product», «它/这个») or asks about a single product (cost, inclusion). Listing questions never narrow.
  const words=new Set(t.split(/[^\p{L}\p{N}]+/u).filter(Boolean)),deictic=['este','ese','esta','esa','this','that','it'].some(w=>words.has(w))||['它','这个','该','那个'].some(w=>t.includes(w));
  const product=useSel=>{const m=match(t,ctx.products);if(m.kind!=='none')return m;const sid=useSel&&sel?.kind==='furn'?ctx.objectProduct?.[sel.id]:null;return sid?{kind:'one',id:sid}:m;};
  const productIntent=(intent,focus,useSel)=>{const m=product(useSel);if(m.kind==='many')return {intent:'ambiguous',need:'product',candidates:m.ids,then:intent};return {intent,focus,productKey:m.kind==='one'?m.id:null};};
  if(has(t,W.unpriced)||(has(t,W.incomplete)&&has(t,W.budget)))return {intent:'budget_detail',focus:has(t,W.unpriced)?'unpriced':'incomplete'};
  const cat=has(t,W.catalog);
  if((cat||has(t,W.units))&&(has(t,W.placed)||has(t,W.units)||has(t,W.changed))){const f=has(t,W.changed)?'changed':has(t,W.units)?'units':'list';return productIntent('placed_products',f,f!=='list'&&(deictic||f==='units'));}
  if(has(t,W.changed))return productIntent('placed_products','changed',deictic);
  if((cat&&(has(t,W.budget)||has(t,W.verified)))||has(t,W.included)){const f=has(t,W.verified)?'provenance':has(t,W.included)?'included':'cost';return productIntent('product_cost',f,f!=='provenance');}
  if(has(t,W.budget)&&match(t,ctx.products).kind!=='none')return productIntent('product_cost','cost',false);
  if(has(t,W.search)&&!has(t,W.move)){const q=t.replace(/[^\p{L}\p{N}\s-]+/gu,' ').split(/\s+/).filter(w=>w&&!W.search.some(v=>v===w)&&!SEARCH_STOP.has(w)).join(' ').slice(0,80);return {intent:'catalog',query:q||null};}
  if(has(t,W.photo))return {intent:'photo_reform'};
  if(has(t,W.render))return {intent:'render'};
  if(has(t,W.catalog))return {intent:'catalog',query:null};
  if(has(t,W.move)||has(t,W.rotate)){
   const o=obj();if(o.kind==='none')return {intent:'ambiguous',need:'object',reason:'no_object'};if(o.kind==='many')return {intent:'ambiguous',need:'object',candidates:o.ids};
   let rot=null;if(has(t,W.rotate)){const m=/(\d{1,3})\s*(°|º|grados|degrees|deg|度)?/.exec(t);const a=m?Number(m[1]):90;if(!(a>0&&a<360))return {intent:'ambiguous',need:'angle'};rot=a;}
   let dx=0,dy=0;if(has(t,W.move)){const d=DIRS.find(x=>t.includes(x[0]));const mm=distance(t);if(!d||!mm)return {intent:'ambiguous',need:'direction',objectId:o.id};dx=d[1]*Math.abs(mm);dy=d[2]*Math.abs(mm);}
   return {intent:'move_object',params:{objectId:o.id,dxMm:dx,dyMm:dy,...(rot!==null?{rotateBy:rot}:{})}};
  }
  if(has(t,W.floor)&&(has(t,W.change)||match(t,ctx.materials).kind!=='none')){
   const r=room(),m=match(t,ctx.materials);
   if(r.kind!=='one')return {intent:'ambiguous',need:'room',candidates:r.ids||[]};
   if(m.kind!=='one')return {intent:'ambiguous',need:'material',roomId:r.id,candidates:m.ids||[]};
   return {intent:'set_floor_material',params:{roomId:r.id,materialId:m.id}};
  }
  if(has(t,W.budget))return {intent:'budget'};
  if(has(t,W.review))return {intent:'layout_review'};
  if(has(t,W.missing))return {intent:'missing_data'};
  if(has(t,W.area)){const r=room();if(r.kind==='one')return {intent:'room_area',roomId:r.id};if(r.kind==='many')return {intent:'ambiguous',need:'room',candidates:r.ids};return {intent:'room_area',roomId:null};}
  if(has(t,W.count)&&(has(t,W.rooms)||has(t,W.levels)))return {intent:'rooms_count'};
  if(has(t,W.help))return {intent:'help'};
  const r=room();if(r.kind==='one'&&has(t,['cuanto mide','tamano','size','多大']))return {intent:'room_area',roomId:r.id};
  return {intent:'unsupported',reason:'unknown'};
 }
 // ----- Answer composition: numbers only from tool results. -----
 const L=lang=>['es','en','zh'].includes(lang)?lang:'es';
 const tx=(lang,es,en,zh)=>({es,en,zh})[L(lang)];
 const fmt=(n,lang,d=2)=>n===null||n===undefined||!Number.isFinite(n)?null:Number(n.toFixed(d)).toLocaleString(L(lang)==='zh'?'zh-CN':L(lang)==='en'?'en-GB':'es-ES',{maximumFractionDigits:d});
 const ST=(s,lang)=>({measured:tx(lang,'medido','measured','实测'),estimated:tx(lang,'estimado','estimated','估算'),unavailable:tx(lang,'no disponible','unavailable','不可用'),mixed:tx(lang,'mixto','mixed','混合'),not_applicable:'—'})[s]||s;
 function compose(intent,results,{lang='es',labels={}}={}){
  const lab=id=>labels[id]||id,out={text:'',figures:[],provenance:[],limitations:[]};
  const take=r=>{if(r?.ok){out.provenance.push(r.provenance);for(const l of r.limitations||[])if(!out.limitations.includes(l))out.limitations.push(l);}return r?.ok?r.data:null;};
  const fig=(value,unit,status,source,label)=>{out.figures.push({value,unit,status,source,label});return value;};
  const firstError=(results||[]).find(r=>r&&!r.ok);
  if(intent.intent==='rooms_count'){const s=take(results[0]);if(!s)return err(firstError,lang);
   fig(s.counts.rooms,'rooms','not_applicable','FloorPlanProjectV1',tx(lang,'estancias','rooms','房间'));fig(s.counts.levels,'levels','not_applicable','FloorPlanProjectV1',tx(lang,'plantas','levels','楼层'));
   out.text=tx(lang,`Hay ${s.counts.rooms} estancias en ${s.counts.levels} planta${s.counts.levels===1?'':'s'}.`,`There are ${s.counts.rooms} rooms on ${s.counts.levels} level${s.counts.levels===1?'':'s'}.`,`共有 ${s.counts.rooms} 个房间，${s.counts.levels} 层。`);return out;}
  if(intent.intent==='room_area'){
   if(!intent.roomId){const s=take(results[0]);if(!s)return err(firstError,lang);const a=fmt(s.area.countedM2,lang);fig(s.area.countedM2,'m2',s.area.status,'FloorPlanQuantities.home',tx(lang,'superficie computada','counted area','计入面积'));
    out.text=a===null?tx(lang,'La superficie total no está disponible con los datos actuales.','The total area is not available with the current data.','根据现有数据无法得到总面积。'):tx(lang,`La superficie computada de la planta es ${a} m² (${ST(s.area.status,lang)}).`,`The counted area of the level is ${a} m² (${ST(s.area.status,lang)}).`,`该层计入面积为 ${a} m²（${ST(s.area.status,lang)}）。`);return out;}
   const r=take(results[0]);if(!r)return err(firstError,lang);const a=fmt(r.floor.areaM2,lang);fig(r.floor.areaM2,'m2',r.floor.status,'FloorPlanQuantities.room',lab(r.id));
   out.text=a===null?tx(lang,`La superficie de ${lab(r.id)} no está disponible.`,`The area of ${lab(r.id)} is not available.`,`${lab(r.id)} 的面积不可用。`):tx(lang,`${lab(r.id)} mide ${a} m² de suelo (${ST(r.floor.status,lang)}).`,`${lab(r.id)} has ${a} m² of floor (${ST(r.floor.status,lang)}).`,`${lab(r.id)} 地面面积 ${a} m²（${ST(r.floor.status,lang)}）。`);
   if(r.counted===false)out.text+=' '+tx(lang,'No cuenta en la superficie computada.','It is not included in the counted area.','不计入面积。');return out;}
  if(intent.intent==='missing_data'){const s=take(results[0]);if(!s)return err(firstError,lang);
   const M={scale_not_measured:tx(lang,'la escala no está calibrada con una medida real','the scale is not calibrated with a real measurement','比例尺未用实测尺寸校准'),rooms_without_name:tx(lang,'estancias sin nombre','rooms without a name','未命名的房间'),rooms_without_floor_material:tx(lang,'estancias sin acabado de suelo','rooms without a floor finish','没有地面材料的房间'),areas_not_measured:tx(lang,'superficies no medidas (estimadas)','areas not measured (estimated)','面积未实测（估算）'),wall_faces_incomplete:tx(lang,'caras de muro incompletas','incomplete wall faces','墙面不完整')};
   if(!s.gaps.length){out.text=tx(lang,'No falta ningún dato de los que se comprueban.','None of the checked data is missing.','检查的数据都不缺。');return out;}
   for(const g of s.gaps)if(g.ids)fig(g.ids.length,'rooms','not_applicable','FloorPlanProjectV1',M[g.code]);
   out.text=tx(lang,'Faltan o están incompletos: ','Missing or incomplete: ','缺少或不完整：')+s.gaps.map(g=>M[g.code]+(g.ids?` (${g.ids.length})`:'')).join('; ')+'.';return out;}
  if(intent.intent==='layout_review'){const r=take(results[0]);if(!r)return err(firstError,lang);
   fig(r.findings.length,'findings','not_applicable','FloorPlanLayoutReview.review',tx(lang,'hallazgos','findings','问题'));
   out.text=r.findings.length?tx(lang,`La revisión encuentra ${r.findings.length} conflicto${r.findings.length===1?'':'s'}: `,`The review finds ${r.findings.length} conflict${r.findings.length===1?'':'s'}: `,`检查发现 ${r.findings.length} 个冲突：`)+r.findings.slice(0,5).map(f=>f.message).join(' · '):tx(lang,'La revisión no encuentra solapes ni contactos con puertas.','The review finds no overlaps or door contacts.','检查未发现重叠或与门的冲突。');
   out.findings=r.findings.slice(0,20);return out;}
  // F1 (cross-audit #237): the REAL causes of an incomplete total, each with its count (never «0 unpriced»).
  const P_=(n,es1,esN,en1,enN,zh)=>tx(lang,`${n} ${n===1?es1:esN}`,`${n} ${n===1?en1:enN}`,`${n} ${zh}`);
  const causes=(inc,items,src)=>{if(!inc)return [];const out=[];
   if(inc.unpriced){fig(inc.unpriced,'items','not_applicable',src,tx(lang,'sin precio','unpriced','无价格'));out.push(items?tx(lang,`${inc.unpriced} de ${items} partidas sin precio (un precio desconocido no es cero)`,`${inc.unpriced} of ${items} items without a price (an unknown price is not zero)`,`${items} 个条目中有 ${inc.unpriced} 个没有价格（未知价格不等于零）`)
    :P_(inc.unpriced,'partida sin precio','partidas sin precio','item without a price','items without a price','个条目无价格'));}
   if(inc.quantityPending){fig(inc.quantityPending,'items','not_applicable',src,tx(lang,'cantidad pendiente','quantity pending','数量待测量'));
    out.push(P_(inc.quantityPending,'partida con la cantidad pendiente de medición','partidas con la cantidad pendiente de medición','item with the quantity pending measurement','items with the quantity pending measurement','个条目数量待测量')+tx(lang,' (una cantidad desconocida no es cero)',' (an unknown quantity is not zero)','（未知数量不等于零）'));}
   if(inc.taxPending)out.push(tx(lang,'IVA sin definir: no se pueden calcular los impuestos','VAT not set: tax cannot be computed','增值税未设定：无法计算税额'));
   return out;};
  const pendingNames=inc=>(inc?.quantityPendingItems||[]).slice(0,8).map(i=>`${i.description}${i.kind==='commercial'?tx(lang,' (cantidad comercial)',' (commercial quantity)','（商业数量）'):tx(lang,' (medición del plano)',' (plan measurement)','（图纸测量）')}`).join('; ');
  if(intent.intent==='budget'){const b=take(results[0]);if(!b)return err(firstError,lang);
   const st=b.reviewComplete?'measured':'estimated',src='FloorPlanBudget.calculateBudget',un=b.unpricedItemIds.length,ur=b.unreviewedPriceItemIds.length,cur=b.currency;
   fig(b.counts.items,'items','not_applicable',src,tx(lang,'partidas','items','条目'));
   if(b.gross.complete){fig(b.net.amount,cur,st,src,tx(lang,'base','net','不含税'));fig(b.gross.amount,cur,st,src,tx(lang,'total','total','合计'));
    out.text=tx(lang,`Presupuesto previsto: ${fmt(b.net.amount,lang)} ${cur} de base y ${fmt(b.gross.amount,lang)} ${cur} con impuestos, en ${b.counts.items} partidas.`,`Planned budget: ${fmt(b.net.amount,lang)} ${cur} net and ${fmt(b.gross.amount,lang)} ${cur} with tax, over ${b.counts.items} items.`,`预计预算：不含税 ${fmt(b.net.amount,lang)} ${cur}，含税 ${fmt(b.gross.amount,lang)} ${cur}，共 ${b.counts.items} 个条目。`);}
   else if(b.net.complete){fig(b.net.amount,cur,st,src,tx(lang,'base','net','不含税'));const cs=causes(b.incomplete,b.counts.items,src);
    out.text=tx(lang,`Base del presupuesto: ${fmt(b.net.amount,lang)} ${cur} en ${b.counts.items} partidas. El total con impuestos no se puede dar: `,`Budget net: ${fmt(b.net.amount,lang)} ${cur} over ${b.counts.items} items. The total with tax cannot be given: `,`预算不含税：${fmt(b.net.amount,lang)} ${cur}，共 ${b.counts.items} 个条目。无法给出含税合计：`)+(cs.join('; ')||tx(lang,'faltan datos de impuestos','tax data missing','缺少税务数据'))+'.';}
   else{const cs=causes(b.incomplete,b.counts.items,src);
    out.text=tx(lang,'El total no se puede dar: ','The total cannot be given: ','无法给出合计：')+(cs.join('; ')||tx(lang,'faltan datos','data missing','缺少数据'))+'.';
    if(b.incomplete?.quantityPending)out.text+=' '+tx(lang,'Pendiente de medición: ','Pending measurement: ','待测量：')+pendingNames(b.incomplete)+'.';
    if(b.net.partialAmount){fig(b.net.partialAmount,cur,'estimated',src,tx(lang,'suma parcial','partial sum','部分合计'));out.text+=' '+tx(lang,`Las partidas con precio suman ${fmt(b.net.partialAmount,lang)} ${cur} de base (parcial).`,`The priced items add up to ${fmt(b.net.partialAmount,lang)} ${cur} net (partial).`,`有价格的条目不含税合计 ${fmt(b.net.partialAmount,lang)} ${cur}（部分）。`);}}
   if(ur){fig(ur,'items','not_applicable',src,tx(lang,'precio sin revisar','unreviewed price','价格未审核'));out.text+=' '+tx(lang,`${ur} precio${ur===1?'':'s'} sin revisar.`,`${ur} unreviewed price${ur===1?'':'s'}.`,`${ur} 个价格未审核。`);}
   out.text+=' '+(b.reviewComplete?tx(lang,'Revisión completa.','Review complete.','审核完成。'):tx(lang,'No es un presupuesto aprobado.','It is not an approved budget.','这不是已批准的预算。'))
    +(b.saved?'':' '+tx(lang,'Borrador generado desde el proyecto: aún no se ha guardado en Presupuestar.','Draft generated from the project: not yet saved in Budget.','根据项目生成的草稿：尚未在预算中保存。'));return out;}
  // ----- CAT-04: catalogue, placed products, product cost, unpriced items, visual references (figures from tools only) -----
  const money=(v,cur='EUR')=>v===null||v===undefined?tx(lang,'no disponible','not available','不可用'):`${fmt(v,lang)} ${cur}`;
  const STATE={'sheet-price-available':tx(lang,'precio de ficha disponible como referencia, sin aplicar','sheet price available as a reference, not applied','资料价格可作参考，未应用'),'reference-kept':tx(lang,'referencia de ficha guardada, sin aplicar','sheet reference kept, not applied','已保存资料参考，未应用'),
   'applied-unreviewed':tx(lang,'precio de ficha aplicado, pendiente de revisión','sheet price applied, pending review','已应用资料价格，待审核'),reviewed:tx(lang,'precio revisado','reviewed price','价格已审核'),stale:tx(lang,'la ficha ha cambiado y tu precio no se ha sustituido','the sheet changed and your price was not replaced','资料已变更，您的价格未被替换'),
   'unknown-price':tx(lang,'la ficha no tiene precio','the sheet has no price','资料无价格'),'sheet-unavailable':tx(lang,'ficha no disponible','sheet not available','资料不可用'),'other-studio':tx(lang,'ficha de otro estudio','sheet of another studio','其他工作室的资料'),ambiguous:tx(lang,'SKU ambiguo','ambiguous SKU','SKU 不明确'),
   'other-price':tx(lang,'precio propio o de otra fuente','own price or another source','自有或其他来源价格'),'unit-conflict':tx(lang,'conflicto de unidad: la ficha se vende ahora por otra unidad; tu precio se conserva con su unidad y sin importe','unit conflict: the sheet is now sold in another unit; your price is kept with its unit and no amount','单位冲突：资料现按其他单位销售；保留您的价格及其单位，无金额'),missing:tx(lang,'no está en el presupuesto','not in the budget','不在预算中')};
  const pick=(list,key)=>key?list.filter(x=>x.itemId===key||x.key===key):list;
  if(intent.intent==='catalog'){const c=take(results[0]);if(!c)return err(firstError,lang);
   const nCat=c.catalogs.length,nProd=c.catalogs.reduce((a,x)=>a+x.products,0);fig(nCat,'catalogs','not_applicable','CatalogCapabilitiesForAssistantV1',tx(lang,'catálogos','catalogues','目录'));fig(nProd,'products','not_applicable','CatalogCapabilitiesForAssistantV1',tx(lang,'productos','products','产品'));
   if(!nCat){out.text=tx(lang,'No tienes catálogos en «Mis catálogos» para este estudio. Puedes importarlos desde Mi estudio → Mis catálogos.','You have no catalogues in «My catalogues» for this studio. Import them from My studio → My catalogues.','此工作室在“我的目录”中没有目录。可在“我的工作室 → 我的目录”中导入。');return out;}
   const shown=c.matches.slice(0,8).map(m=>`${m.sku} · ${m.displayName}${m.sheetPrice&&m.sheetPrice.unitPrice!==null?` · ${tx(lang,'ficha','sheet','资料')} ${money(m.sheetPrice.unitPrice)}/${m.sheetPrice.unit}`:` · ${tx(lang,'sin precio en la ficha','no price on the sheet','资料无价格')}`}${m.synthetic?tx(lang,' (sintético QA)',' (synthetic QA)','（合成测试）'):''}`);
   out.items=c.matches.slice(0,20);
   if(c.query){out.text=c.total?tx(lang,`Encuentro ${c.total} producto${c.total===1?'':'s'} para «${c.query}»: `,`I find ${c.total} product${c.total===1?'':'s'} for «${c.query}»: `,`找到 ${c.total} 个“${c.query}”相关产品：`)+shown.join(' · ')+(c.total>1?' '+tx(lang,'Dime cuál (SKU) si quieres más detalle.','Tell me which one (SKU) for more detail.','请告诉我是哪一个（SKU）。'):''):tx(lang,`No encuentro productos para «${c.query}» en tus catálogos.`,`I find no products for «${c.query}» in your catalogues.`,`在您的目录中找不到“${c.query}”。`);return out;}
   out.text=tx(lang,`Tienes ${nCat} catálogo${nCat===1?'':'s'} con ${nProd} producto${nProd===1?'':'s'}: `,`You have ${nCat} catalogue${nCat===1?'':'s'} with ${nProd} product${nProd===1?'':'s'}: `,`您有 ${nCat} 个目录，共 ${nProd} 个产品：`)+c.catalogs.map(x=>`${x.name||x.catalogId} (rev ${x.revision})`).join(', ')+'. '+shown.join(' · ')+'.';return out;}
  if(intent.intent==='placed_products'){const r=take(results[0]);if(!r)return err(firstError,lang);const list=pick(r.products,intent.productKey).filter(x=>!x.retired);
   if(!list.length){out.text=intent.productKey?tx(lang,'Ese producto no está colocado en este proyecto.','That product is not placed in this project.','该产品未放入此项目。'):tx(lang,'No hay productos de tus catálogos colocados en este proyecto.','No products from your catalogues are placed in this project.','此项目中没有放置您目录中的产品。');return out;}
   if(intent.focus==='changed'){const ch=list.filter(x=>x.versionChanged||x.state==='stale');fig(ch.length,'products','not_applicable','RubikCatalogBudget',tx(lang,'fichas cambiadas','changed sheets','已变更资料'));
    out.text=ch.length?tx(lang,'La ficha ha cambiado desde que colocaste: ','The sheet changed since you placed: ','放置后资料已变更：')+ch.map(x=>`${x.sku}${x.sheetPrice&&x.sheetPrice.unitPrice!==null?` (${tx(lang,'ficha actual','current sheet','当前资料')} ${money(x.sheetPrice.unitPrice)} · ${x.sheetPrice.edition})`:''}`).join(', ')+'. '+tx(lang,'Ningún precio aceptado se sustituye sin tu confirmación.','No accepted price is replaced without your confirmation.','未经确认不会替换已接受的价格。'):tx(lang,'Las fichas no han cambiado desde que colocaste los productos.','The sheets have not changed since you placed the products.','放置后资料未变更。');return out;}
   // F2: the economic quantity and unit are the budget item's; the object count is said apart when it is not that quantity.
   for(const x of list){if(x.quantity!==null)fig(x.quantity,x.unit==='unit'?'units':x.unit,'measured','FloorPlanBudget',x.sku);if(x.objectCount!==undefined)fig(x.objectCount,'objects','measured','RubikCatalogBudget',x.sku);}
   const objs=x=>x.objectCount===undefined?'':' · '+tx(lang,`${x.objectCount} objeto${x.objectCount===1?'':'s'} colocado${x.objectCount===1?'':'s'}`,`${x.objectCount} object${x.objectCount===1?'':'s'} placed`,`已放置 ${x.objectCount} 个对象`);
   out.text=(intent.focus==='units'&&list.length===1?'':tx(lang,'Productos colocados en este proyecto: ','Products placed in this project: ','此项目中放置的产品：'))+list.map(x=>x.quantity===null?`${x.sku} · ${x.displayName}: ${tx(lang,`cantidad pendiente de medición (precio por ${x.unitLabel||'—'})`,`quantity pending measurement (priced per ${x.unitLabel||'—'})`,`数量待测量（按 ${x.unitLabel||'—'} 计价）`)}${objs(x)}`
    :x.unit!=='unit'?`${x.sku} · ${x.displayName}: ${x.quantity} ${x.unitLabel}${objs(x)}`
    :tx(lang,`${x.sku} · ${x.displayName}: ${x.quantity} ${x.quantity===1?'unidad':'unidades'}`,`${x.sku} · ${x.displayName}: ${x.quantity} unit${x.quantity===1?'':'s'}`,`${x.sku} · ${x.displayName}：${x.quantity} 件`)).join('; ')+'. '+tx(lang,'Cantidad de la partida del presupuesto; el recuento de objetos vinculados se indica aparte y no es una medición.','Quantity of the budget item; the count of linked objects is given apart and is not a measurement.','数量取自预算条目；已关联对象的计数另行列出，非测量。');return out;}
  if(intent.intent==='product_cost'){const r=take(results[0]);if(!r)return err(firstError,lang);const list=pick(r.products,intent.productKey),cur=r.currency;
   if(!list.length){out.text=intent.productKey?tx(lang,'Ese producto no está colocado en este proyecto, así que no está en el presupuesto. El precio de una ficha solo cuenta cuando el producto está colocado y aplicas su precio en Presupuestar.','That product is not placed in this project, so it is not in the budget. A sheet price only counts once the product is placed and you apply its price in Budget.','该产品未放入此项目，因此不在预算中。'):tx(lang,'No hay productos de tus catálogos en el presupuesto de este proyecto.','There are no products from your catalogues in this project budget.','此项目预算中没有您目录中的产品。');return out;}
   const one=x=>{const parts=[`${x.sku} · ${x.displayName}: ${STATE[x.state]||x.state}`];
    if(x.sheetPrice&&x.sheetPrice.unitPrice!==null){fig(x.sheetPrice.unitPrice,cur,'estimated','CatalogProductV1',tx(lang,'precio de ficha','sheet price','资料价格'));parts.push(`${tx(lang,'ficha','sheet','资料')} ${money(x.sheetPrice.unitPrice,cur)}/${x.sheetPrice.unit} (${x.sheetPrice.label}, ${tx(lang,'verificado','verified','核实于')} ${x.sheetPrice.asOf}, ${x.sheetPrice.edition})`);}
    else parts.push(tx(lang,'precio de ficha no disponible','sheet price not available','资料价格不可用'));
    if(x.reference&&x.reference.unitPrice!==null&&(!x.sheetPrice||x.reference.unitPrice!==x.sheetPrice.unitPrice||x.reference.edition!==x.sheetPrice.edition)){fig(x.reference.unitPrice,cur,'estimated','FloorPlanBudget',tx(lang,'referencia guardada','kept reference','已存参考'));parts.push(`${tx(lang,'referencia guardada','kept reference','已存参考')} ${money(x.reference.unitPrice,cur)} (${x.reference.edition||x.reference.label})`);}
    if(x.activeUnitPrice!==null){fig(x.activeUnitPrice,cur,x.reviewed?'measured':'estimated','FloorPlanBudget',tx(lang,'precio activo','active price','有效价格'));
     // F2: the price always with ITS unit (the budget item's) and its origin; never converted, never «/ud» by default.
     const pu=x.price?.unitLabel||x.unitLabel,st=x.price?.source?.type,origin=st==='manual'?tx(lang,'precio propio','own price','自有价格'):st==='provider-reference'?tx(lang,'precio de ficha aplicado','applied sheet price','已应用资料价格'):st||null;
     parts.push(`${tx(lang,'precio activo en el presupuesto','active price in the budget','预算中的有效价格')} ${money(x.activeUnitPrice,cur)}${pu?'/'+pu:''}${x.reviewed?'':' '+tx(lang,'(sin revisar)','(not reviewed)','（未审核）')}`);
     if(origin)parts.push(`${tx(lang,'origen del precio','price origin','价格来源')}: ${origin}`);}
    else parts.push(tx(lang,'sin precio activo en el presupuesto','no active price in the budget','预算中无有效价格'));
    if(x.unitConflict){const su=x.unitConflict.sheetUnit==='unit'?'ud':x.unitConflict.sheetUnit,bu=x.unitConflict.budgetUnit==='unit'?'ud':x.unitConflict.budgetUnit;
     parts.push(tx(lang,`conflicto de unidad: unidad de la ficha (${su}) distinta de la del precio (${bu}); no se convierte ningún precio y la cantidad queda pendiente`,`unit conflict: sheet unit (${su}) differs from the price unit (${bu}); no price is converted and the quantity stays pending`,`单位冲突：资料单位（${su}）与价格单位（${bu}）不同；不换算价格，数量待定`));}
    if(x.objectCount!==undefined&&(x.quantity===null||x.unit!=='unit'))parts.push(tx(lang,`${x.objectCount} objeto${x.objectCount===1?'':'s'} colocado${x.objectCount===1?'':'s'} (recuento, no cantidad económica)`,`${x.objectCount} object${x.objectCount===1?'':'s'} placed (count, not the economic quantity)`,`已放置 ${x.objectCount} 个对象（计数，非经济数量）`));
    if(x.subtotalNet!==null){fig(x.subtotalNet,cur,x.reviewed?'measured':'estimated','FloorPlanBudget.calculateBudget',tx(lang,'importe de la partida','item amount','条目金额'));parts.push(`${tx(lang,'importe de la partida','item amount','条目金额')} ${money(x.subtotalNet,cur)} ${tx(lang,'sin IVA','excl. VAT','不含税')}`);}
    else parts.push(tx(lang,'importe de la partida no disponible','item amount not available','条目金额不可用'));
    parts.push(x.inBudget?tx(lang,'incluido en el presupuesto como partida','included in the budget as an item','已作为条目计入预算'):tx(lang,'no incluido en el presupuesto','not included in the budget','未计入预算'));return parts.join('; ');};
   out.text=list.slice(0,6).map(one).join(' — ')+'. ';
   const tot=r.total.gross;if(tot.complete){fig(tot.amount,cur,'estimated','FloorPlanBudget.calculateBudget',tx(lang,'total con IVA','total incl. VAT','含税合计'));out.text+=tx(lang,`Total del presupuesto con IVA: ${money(tot.amount,cur)}.`,`Budget total incl. VAT: ${money(tot.amount,cur)}.`,`预算含税合计：${money(tot.amount,cur)}。`);}
   else{const n=r.total.unpricedItemIds.length,inc=r.total.incomplete;
    if(n||!inc){fig(n,'items','not_applicable','FloorPlanBudget.calculateBudget',tx(lang,'partidas sin precio','unpriced items','无价格条目'));out.text+=tx(lang,`El presupuesto no tiene total completo: ${n} partida${n===1?'':'s'} sin precio (un precio desconocido no es cero).`,`The budget has no complete total: ${n} item${n===1?'':'s'} without a price (an unknown price is not zero).`,`预算没有完整合计：${n} 个条目无价格（未知价格不等于零）。`);}
    const other=causes({...inc,unpriced:0},null,'FloorPlanBudget.calculateBudget');if(other.length)out.text+=(n?' ':tx(lang,'El presupuesto no tiene total completo: ','The budget has no complete total: ','预算没有完整合计：'))+other.join('; ')+'.';}
   return out;}
  if(intent.intent==='budget_detail'){const b=take(results[0]);if(!b)return err(firstError,lang);const r=results[1]?.ok?take(results[1]):null,n=b.unpricedItemIds.length,inc=b.incomplete;
   fig(n,'items','not_applicable','FloorPlanBudget.calculateBudget',tx(lang,'partidas sin precio','unpriced items','无价格条目'));
   if(!n&&!b.gross.complete){const cs=causes({...inc,unpriced:0},null,'FloorPlanBudget.calculateBudget');
    out.text=tx(lang,'El presupuesto está incompleto, pero no por precios (todas las partidas tienen precio): ','The budget is incomplete, but not because of prices (every item has a price): ','预算不完整，但不是价格原因（所有条目均有价格）：')+(cs.join('; ')||tx(lang,'faltan datos','data missing','缺少数据'))+'.'
     +(inc?.quantityPending?' '+tx(lang,'Pendiente de medición: ','Pending measurement: ','待测量：')+pendingNames(inc)+'.':'');
    if(b.unreviewedPriceItemIds.length)out.text+=' '+tx(lang,`${b.unreviewedPriceItemIds.length} precio${b.unreviewedPriceItemIds.length===1?'':'s'} sin revisar.`,`${b.unreviewedPriceItemIds.length} unreviewed price${b.unreviewedPriceItemIds.length===1?'':'s'}.`,`${b.unreviewedPriceItemIds.length} 个价格未审核。`);return out;}
   if(!n&&b.gross.complete){out.text=tx(lang,'Todas las partidas tienen precio.','Every item has a price.','所有条目都有价格。')+(b.unreviewedPriceItemIds.length?' '+tx(lang,`${b.unreviewedPriceItemIds.length} precio${b.unreviewedPriceItemIds.length===1?'':'s'} sin revisar.`,`${b.unreviewedPriceItemIds.length} unreviewed price${b.unreviewedPriceItemIds.length===1?'':'s'}.`,`${b.unreviewedPriceItemIds.length} 个价格未审核。`):'');return out;}
   const cat=new Map((r?.products||[]).map(x=>[x.itemId,x]));
   const names=(b.unpricedItems||[]).slice().sort((x,y)=>(cat.has(y.id)?1:0)-(cat.has(x.id)?1:0)).slice(0,10).map(i=>{const x=cat.get(i.id);return x?`${i.description} (${STATE[x.state]||x.state})`:i.description;});
   out.text=tx(lang,`El presupuesto está incompleto porque ${n} partida${n===1?'':'s'} no tiene${n===1?'':'n'} precio: `,`The budget is incomplete because ${n} item${n===1?' has':'s have'} no price: `,`预算不完整，因为 ${n} 个条目没有价格：`)+names.join('; ')+'. '+tx(lang,'Un precio desconocido no es cero; un precio de ficha solo cuenta cuando lo aplicas y lo revisas en Presupuestar.','An unknown price is not zero; a sheet price only counts once you apply and review it in Budget.','未知价格不等于零；资料价格需在预算中应用并审核后才计入。');
   const other=causes({...inc,unpriced:0},null,'FloorPlanBudget.calculateBudget');if(other.length)out.text+=' '+tx(lang,'Además: ','Also: ','此外：')+other.join('; ')+'.'+(inc?.quantityPending?' '+tx(lang,'Pendiente de medición: ','Pending measurement: ','待测量：')+pendingNames(inc)+'.':'');
   if(b.unreviewedPriceItemIds.length)out.text+=' '+tx(lang,`${b.unreviewedPriceItemIds.length} precio${b.unreviewedPriceItemIds.length===1?'':'s'} sin revisar.`,`${b.unreviewedPriceItemIds.length} unreviewed price${b.unreviewedPriceItemIds.length===1?'':'s'}.`,`${b.unreviewedPriceItemIds.length} 个价格未审核。`);return out;}
  if(intent.intent==='visual_refs'){const v=take(results[0]);if(!v)return err(firstError,lang);fig(v.count,'references','not_applicable','RubikVisualReferences',tx(lang,'referencias visuales','visual references','视觉参考'));
   const kind=tx(lang,'Los resultados del Estudio de imágenes son una SIMULACIÓN local rotulada: no son imágenes generadas por IA ni imágenes reales, no se entregan, no certifican un SKU ni crean importes. La generación real está bloqueada (STOP_GASTO).','Image studio results are a labelled local SIMULATION: they are not AI-generated or real images, they are not delivered, they certify no SKU and create no amounts. Real generation is blocked (STOP_GASTO).','图像工作室的结果是标注的本地模拟：不是 AI 生成或真实图像，不交付，不认证 SKU，也不产生金额。真实生成已锁定。');
   if(!v.count){out.text=tx(lang,'No hay referencias visuales vinculadas a este proyecto. Puedes crear una en Entregar → Estudio de imágenes y pulsar «Vincular al proyecto». ','No visual references are linked to this project. Create one in Deliver → Image studio and press «Link to the project». ','此项目没有关联的视觉参考。可在“交付 → 图像工作室”中创建并点击“关联到项目”。')+kind;return out;}
   const CS={current:tx(lang,'ficha comercial vigente','current commercial sheet','商业资料有效'),'older-revision':tx(lang,'revisión anterior del catálogo','older catalogue revision','目录旧版本'),'other-studio':tx(lang,'ficha de otro estudio (no se comprueba aquí)','sheet of another studio (not checked here)','其他工作室的资料（此处不核对）'),'studio-unknown':tx(lang,'estudio desconocido (ficha no comprobada)','unknown studio (sheet not checked)','工作室未知（未核对资料）'),'catalog-missing':tx(lang,'ficha comercial no disponible','commercial sheet not available','商业资料不可用'),'sheet-missing':tx(lang,'ficha comercial no disponible','commercial sheet not available','商业资料不可用')};
   const D={accepted:tx(lang,'aceptada','accepted','已接受'),rejected:tx(lang,'rechazada','rejected','已拒绝'),discarded:tx(lang,'descartada','discarded','已丢弃')},S={verified:tx(lang,'verificada','verified','已验证'),unverifiable:tx(lang,'no verificable','unverifiable','无法验证'),'other-project':tx(lang,'de otro proyecto','from another project','属于其他项目')};
   out.text=(intent.focus==='kind'?kind+' ':'')+tx(lang,`Hay ${v.count} referencia${v.count===1?'':'s'} visual${v.count===1?'':'es'} vinculada${v.count===1?'':'s'}: `,`There ${v.count===1?'is':'are'} ${v.count} linked visual reference${v.count===1?'':'s'}: `,`共有 ${v.count} 个已关联的视觉参考：`)
    +v.references.slice(0,5).map(r=>`${r.simulated?tx(lang,'simulación','simulation','模拟'):r.resultKind} ${D[r.decision]||'—'} (${S[r.status]||r.status})${r.references.length?' · '+r.references.map(x=>`${x.sku} ${x.placed?tx(lang,'colocado','placed','已放置'):x.placedStatus==='ambiguous'?tx(lang,'colocación no verificable (sin estudio)','placement not verifiable (no studio)','无法验证放置（无工作室）'):tx(lang,'no colocado: no se presupuesta','not placed: not budgeted','未放置：不计入预算')}${CS[x.catalogStatus]?' · '+CS[x.catalogStatus]:''}`).join(', '):''}`).join('; ')+'.'+(intent.focus==='kind'?'':' '+tx(lang,'Son evidencia visual sin importe. «Verificada» se refiere solo a la huella visual, no al producto ni a la ficha comercial.','They are visual evidence with no amount. «Verified» refers only to the visual fingerprint, not to the product or the commercial sheet.','仅为视觉证据，无金额。“已验证”仅指视觉指纹，不代表产品或商业资料。'));return out;}
  return err(firstError,lang);
 }
 function err(r,lang){
  const code=r?.error?.code||'unsupported_intent';
  const M={not_available:tx(lang,'Ese dato no está disponible ahora.','That data is not available right now.','该数据暂不可用。'),not_found:tx(lang,'No encuentro ese elemento en el proyecto.','I cannot find that element in the project.','在项目中找不到该元素。'),not_authorized:tx(lang,'No tengo acceso a eso.','I do not have access to that.','我无权访问。'),revision_mismatch:tx(lang,'El proyecto ha cambiado: vuelve a preguntar.','The project has changed: ask again.','项目已更改：请重新提问。')};
  return {text:M[code]||tx(lang,'No puedo responder a eso.','I cannot answer that.','我无法回答。'),figures:[],provenance:[],limitations:[],error:code};
 }
 return Object.freeze({INTENTS,parse,compose,norm});
});
