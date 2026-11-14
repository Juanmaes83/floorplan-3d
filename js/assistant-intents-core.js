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
 const INTENTS=Object.freeze(['rooms_count','room_area','missing_data','layout_review','budget','set_floor_material','move_object','render','photo_reform','catalog','advanced','help','unsupported','ambiguous']);
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
  advanced:['optimiza','optimizar','genera una distribucion','generar distribucion','distribucion automatica','foto a mueble','mueble 3d desde','optimize','generate a layout','generate layout','photo to furniture','生成布局','优化布局'],
  help:['ayuda','que puedes hacer','que sabes hacer','help','what can you do','帮助','你能做什么'],
  here:['esta estancia','este cuarto','esta habitacion','la seleccionada','la estancia seleccionada','this room','selected room','这个房间','当前房间'],
  thisObj:['este mueble','el seleccionado','this item','selected item','这个家具']
 };
 const DIRS=[['izquierda',-1,0],['left',-1,0],['向左',-1,0],['左',-1,0],['derecha',1,0],['right',1,0],['向右',1,0],['右',1,0],['arriba',0,-1],['up',0,-1],['向上',0,-1],['上',0,-1],['abajo',0,1],['down',0,1],['向下',0,1],['下',0,1]];
 const UNIT=[['mm',1],['毫米',1],['cm',10],['厘米',10],['m',1000],['米',1000],['metro',1000],['metros',1000]];
 // Best entity for the text: a whole visible label scores above a single distinctive word of it («roble» in «Parqué de
 // roble»). A tie between different entities is ambiguous: the assistant asks instead of guessing.
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
  if(has(t,W.photo))return {intent:'photo_reform'};
  if(has(t,W.render))return {intent:'render'};
  if(has(t,W.catalog))return {intent:'catalog'};
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
  if(intent.intent==='budget'){const b=take(results[0]);if(!b)return err(firstError,lang);
   const st=b.reviewComplete?'measured':'estimated',src='FloorPlanBudget.calculateBudget',un=b.unpricedItemIds.length,ur=b.unreviewedPriceItemIds.length,cur=b.currency;
   fig(b.counts.items,'items','not_applicable',src,tx(lang,'partidas','items','条目'));
   if(b.gross.complete){fig(b.net.amount,cur,st,src,tx(lang,'base','net','不含税'));fig(b.gross.amount,cur,st,src,tx(lang,'total','total','合计'));
    out.text=tx(lang,`Presupuesto previsto: ${fmt(b.net.amount,lang)} ${cur} de base y ${fmt(b.gross.amount,lang)} ${cur} con impuestos, en ${b.counts.items} partidas.`,`Planned budget: ${fmt(b.net.amount,lang)} ${cur} net and ${fmt(b.gross.amount,lang)} ${cur} with tax, over ${b.counts.items} items.`,`预计预算：不含税 ${fmt(b.net.amount,lang)} ${cur}，含税 ${fmt(b.gross.amount,lang)} ${cur}，共 ${b.counts.items} 个条目。`);}
   else{fig(un,'items','not_applicable',src,tx(lang,'sin precio','unpriced','无价格'));
    out.text=tx(lang,`El total no se puede dar: ${un} de ${b.counts.items} partidas sin precio (un precio desconocido no es cero).`,`The total cannot be given: ${un} of ${b.counts.items} items without a price (an unknown price is not zero).`,`无法给出合计：${b.counts.items} 个条目中有 ${un} 个没有价格（未知价格不等于零）。`);
    if(b.net.partialAmount){fig(b.net.partialAmount,cur,'estimated',src,tx(lang,'suma parcial','partial sum','部分合计'));out.text+=' '+tx(lang,`Las partidas con precio suman ${fmt(b.net.partialAmount,lang)} ${cur} de base (parcial).`,`The priced items add up to ${fmt(b.net.partialAmount,lang)} ${cur} net (partial).`,`有价格的条目不含税合计 ${fmt(b.net.partialAmount,lang)} ${cur}（部分）。`);}}
   if(ur){fig(ur,'items','not_applicable',src,tx(lang,'precio sin revisar','unreviewed price','价格未审核'));out.text+=' '+tx(lang,`${ur} precio${ur===1?'':'s'} sin revisar.`,`${ur} unreviewed price${ur===1?'':'s'}.`,`${ur} 个价格未审核。`);}
   out.text+=' '+(b.reviewComplete?tx(lang,'Revisión completa.','Review complete.','审核完成。'):tx(lang,'No es un presupuesto aprobado.','It is not an approved budget.','这不是已批准的预算。'))
    +(b.saved?'':' '+tx(lang,'Borrador generado desde el proyecto: aún no se ha guardado en Presupuestar.','Draft generated from the project: not yet saved in Budget.','根据项目生成的草稿：尚未在预算中保存。'));return out;}
  return err(firstError,lang);
 }
 function err(r,lang){
  const code=r?.error?.code||'unsupported_intent';
  const M={not_available:tx(lang,'Ese dato no está disponible ahora.','That data is not available right now.','该数据暂不可用。'),not_found:tx(lang,'No encuentro ese elemento en el proyecto.','I cannot find that element in the project.','在项目中找不到该元素。'),not_authorized:tx(lang,'No tengo acceso a eso.','I do not have access to that.','我无权访问。'),revision_mismatch:tx(lang,'El proyecto ha cambiado: vuelve a preguntar.','The project has changed: ask again.','项目已更改：请重新提问。')};
  return {text:M[code]||tx(lang,'No puedo responder a eso.','I cannot answer that.','我无法回答。'),figures:[],provenance:[],limitations:[],error:code};
 }
 return Object.freeze({INTENTS,parse,compose,norm});
});
