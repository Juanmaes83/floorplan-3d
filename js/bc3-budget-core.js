/* Phase C3: BC3 (FIEBDC-3) for the budget. Pure, over the existing codec (FloorPlanFIEBDC3, Point 7C-D).
   - Reference prices from a BC3 the professional supplies (their own tariff or a price base they obtained): Rubik
     reads it locally, never uploads, hosts or redistributes it, and records the licence as «unknown» (the
     professional answers for its use). Prices of several columns (zones) are kept apart; the professional picks one.
   - Units are only normalised in notation (ud/u → unit, m²/m2 → m2, ml → m); a different unit is never converted:
     an item only accepts a reference with its own unit.
   - Export: the budget as a BC3 (chapters, items with price and the measured quantity), checked by re-reading it. */
(function(root,factory){const api=factory(typeof module==='object'?require('./fiebdc3-codec.js'):root.FloorPlanFIEBDC3,typeof module==='object'?require('./budget-core.js'):root.FloorPlanBudget);if(typeof module==='object'&&module.exports)module.exports=api;else root.FloorPlanBc3Budget=api;})(typeof self!=='undefined'?self:this,function(F,B){
 'use strict';
 if(!F||!B)throw Error('FloorPlanBc3Budget requires FloorPlanFIEBDC3 and FloorPlanBudget.');
 const PROVIDER='user-bc3';
 const UNIT_ALIASES={unit:['ud','u','un','und','ud.','u.'],m2:['m2','m²'],m:['m','ml','m.l.']};
 function normUnit(raw){const u=String(raw||'').trim().toLowerCase();for(const [k,list] of Object.entries(UNIT_ALIASES))if(list.includes(u))return k;return null;}
 const fold=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').toLowerCase();
 const bc3Date=d=>/^\d{8}$/.test(d||'')?`${d.slice(4)}-${d.slice(2,4)}-${d.slice(0,2)}`:/^\d{6}$/.test(d||'')?`20${d.slice(4)}-${d.slice(2,4)}-${d.slice(0,2)}`:null;
 // bytes: Uint8Array of the .bc3 file. Throws a readable error when the file cannot be used.
 function load(bytes,fileName='base.bc3'){
  let model;try{model=F.parse(bytes);}catch(e){throw Error('El archivo no es un BC3 (FIEBDC-3) válido: '+(e.code||e.message));}
  const texts=new Map(model.texts.map(t=>[t.code,t.text]));
  const items=[];
  for(const c of model.concepts){const unit=normUnit(c.unit);if(!unit)continue;const description=(c.summary||texts.get(c.code)||'').trim();if(!description)continue;
   const prices=(c.prices||[]).filter(p=>Number.isFinite(p.value)&&p.value>=0).map(p=>({index:p.index,label:p.label,value:p.value,date:bc3Date(p.date)}));if(!prices.length)continue;
   items.push({code:c.code,description,unit,rawUnit:c.unit,prices,longText:texts.get(c.code)||null});}
  if(!items.length)throw Error('El BC3 no tiene partidas con unidad y precio utilizables.');
  const labels=model.version?.labels?.length?model.version.labels:['Precio'];
  return {fileName:String(fileName).slice(0,120),owner:model.version?.owner||null,labels,items,count:items.length};
 }
 function search(base,{text='',unit=null,limit=30}={}){
  const words=fold(text).split(/\s+/).filter(w=>w.length>2);
  const scored=[];for(const it of base.items){if(unit&&it.unit!==unit)continue;const hay=fold(it.code+' '+it.description);let score=fold(it.code)===fold(text)?100:0;for(const w of words)if(hay.includes(w))score+=1;if(score>0||!words.length)scored.push({score,it});}
  return scored.sort((a,b)=>b.score-a.score||a.it.code.localeCompare(b.it.code)).slice(0,limit).map(x=>x.it);
 }
 // A normalised reference quote (Point 7C contract) for the budget bridge.
 function quote(base,code,priceIndex=0){
  const it=base.items.find(i=>i.code===code);if(!it)throw Error('Partida no encontrada en el BC3.');
  const p=it.prices.find(x=>x.index===priceIndex)||it.prices[0];
  return {providerId:PROVIDER,itemId:it.code,code:it.code,description:it.description,unit:it.unit,unitPrice:p.value,currency:'EUR',priceKind:'reference',
   source:{label:`BC3 ${base.owner||base.fileName}${base.labels.length>1&&p.label?' · '+p.label:''}`,asOf:p.date,retrievedAt:null,edition:null,region:p.label||null,sourceUrl:null,attribution:null,licenseStatus:'unknown',licenseName:null,licenseUrl:null}};
 }
 // Export: FIEBDC-3/2016 with root, chapters, items (price) and ~D quantities; ANSI (Windows-1252) like most programs.
 const BC3_UNIT={m2:'m2',m:'m',unit:'ud'};
 const clean=s=>String(s??'').replace(/[|~\\\r\n\x1a]/g,' ').replace(/[^\x20-\x7e\u00a0-\u00ff\u20ac]/g,'?').replace(/\s+/g,' ').trim().slice(0,250);
 const amount=n=>Number.isFinite(n)?String(Math.round(n*1000)/1000):'';
 function exportBudget(budget,{title='Presupuesto',program='Rubik Sota',date=new Date()}={}){
  const c=B.calculateBudget(budget),dd=String(date.getDate()).padStart(2,'0')+String(date.getMonth()+1).padStart(2,'0')+date.getFullYear();
  const code=(i,prefix)=>clean(prefix+String(i+1).padStart(3,'0'));
  const records=[{type:'V',fields:['',`FIEBDC-3/2016\\${dd}`,program,'','ANSI','','2','','','','','']},{type:'C',fields:['RUBIK##','',clean(title),'',dd,'0']}];
  const chapters=c.chapters.length?c.chapters:[{id:'all',title:'Partidas',itemIds:c.lines.map(l=>l.id)}];
  const rootLines=[];
  chapters.forEach((ch,ci)=>{const cc=code(ci,'C')+'#';rootLines.push(cc,'1','1');records.push({type:'C',fields:[cc,'',clean(ch.title),'',dd,'0']});
   const lines=(ch.itemIds||ch.items?.map(x=>x.id)||[]).map(id=>c.lines.find(l=>l.id===id)).filter(Boolean),dec=[];
   lines.forEach((l,li)=>{const ic=code(ci*100+li,'P');records.push({type:'C',fields:[ic,BC3_UNIT[l.quantity.unit],clean(l.description),l.unitPrice===null?'':amount(l.unitPrice),dd,'0']});dec.push(ic,'1',amount(l.budgetQuantity));});
   records.push({type:'D',fields:[cc,dec.join('\\')+'\\']});});
  records.splice(2,0,{type:'D',fields:['RUBIK##',rootLines.join('\\')+'\\']});
  const model={records,encoding:'ANSI'};const bytes=F.encodeModel(model);
  return {bytes,check:F.parse(bytes)};
 }
 return {PROVIDER,normUnit,load,search,quote,exportBudget};
});
