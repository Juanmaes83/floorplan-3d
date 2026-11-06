/* FT3D-8 · M1 lab · S3 «Parcela». Lookup by cadastral reference through the official DGC WFS (FloorPlanCatastroWfs),
   GML fallback through the EXISTING Catastro provider, association to ONE project (FloorPlanParcelAssociation),
   explicit placement (FloorPlanTerritoryIntegration) and the export policy per channel. Each project's saved parcel
   lives under its own browser key; a failed lookup never touches it. Demonstration mode uses its own provider
   («demo-parcel», marked as test data) so an invented parcel never claims the official source. */
(function(){
 'use strict';
 const {$,esc}=window.M1UI,Geo=window.FloorPlanGeoProvider,W=window.FloorPlanCatastroWfs,Parcel=window.FloorPlanParcelCore,Catastro=window.FloorPlanCatastroParcel;
 const A=window.FloorPlanParcelAssociation,Territory=window.FloorPlanTerritoryIntegration,X=window.FloorPlanM1Fixtures;
 const KEY='rubik-m1-lab:v1:';
 const store={get(id){try{return JSON.parse(localStorage.getItem(KEY+id)||'null');}catch{return null;}},set(id,v){try{localStorage.setItem(KEY+id,JSON.stringify(v));return true;}catch{return false;}}};
 const state={projectId:X.projects[0].id,library:{},result:null,plan:null,controller:null,draft:null,lastProvider:null};
 for(const p of X.projects){const saved=store.get(p.id);state.library[p.id]={revision:p.revision,site:saved?.site||{},association:saved?.association||null};}
 const project=()=>X.projects.find(p=>p.id===state.projectId),entry=()=>state.library[state.projectId];
 const subject=()=>({type:project().type,id:project().id,revision:project().revision});
 const api=window.__m1s3={state};

 /* ---------- providers ---------- */
 const official=W.create({timeoutMs:20000});
 // Demonstration provider: invented answers, network none, clearly not the official source.
 const demo={id:'demo-parcel',contractVersion:Geo.CONTRACT_VERSION,capabilities:{search:false,parcel:true,geometry:false,coordinates:false,sourceMetadata:true,orthophoto:false,elevation:false,terrain:false},
  getCapabilities(){return this.capabilities;},
  getProviderMetadata(){return {providerId:'demo-parcel',label:'Demostración · datos de prueba',kind:'other',network:'none',parcelInputModes:['reference'],sourceName:'DATOS DE PRUEBA — parcela inventada con estructura INSPIRE',license:{status:'restricted',name:'Datos de prueba tratados como Catastro (licencia restringida)'}};},
  getSourceMetadata(){return {providerId:'demo-parcel',type:'derived',sourceName:'DATOS DE PRUEBA — parcela inventada'};},
  async getParcel(input,{signal}={}){
   await new Promise((res,rej)=>{const t=setTimeout(res,api.demoDelayMs??600);signal?.addEventListener('abort',()=>{clearTimeout(t);rej(Object.assign(new Error('aborted'),{name:'AbortError'}));},{once:true});}).catch(()=>null);
   if(signal?.aborted)return {status:'cancelled',reason:'cancelled'};
   const opt=X.demoReferences[input.reference];if(!opt)return {status:'not-found',reason:'parcel-not-found'};
   try{const parcel=Catastro.parseDocument(X.wfsAnswer(input.reference,opt),input.reference);
    return {status:'available',providerId:'demo-parcel',parcel,provenance:{providerId:'demo-parcel',type:'derived',sourceName:'DATOS DE PRUEBA — parcela inventada',sourceId:input.reference,retrievedAt:new Date().toISOString(),attribution:'Datos de prueba',license:{status:'restricted',name:'Datos de prueba tratados como Catastro'}}};}
   catch(e){return {status:e.reason==='unsupported-source-crs'?'unsupported':'unavailable',reason:e.reason==='unsupported-source-crs'?'unsupported-source-crs':'invalid-source-geometry'};}
  }};
 const registry=Geo.createRegistry([official,demo,Catastro.provider]);
 $('zone').innerHTML=W.ZONES.map(z=>`<option value="${z.crs}">${esc(z.label)}</option>`).join('');
 $('serviceInfo').innerHTML=`Servicio oficial: WFS INSPIRE de parcela catastral de la Dirección General del Catastro. Cobertura: territorio de la DGC (no incluye País Vasco ni Navarra). Su licencia permite el uso propio: la geometría se muestra aquí, pero no se comparte en vídeos ni presentaciones.`;

 /* ---------- saved state ---------- */
 const VERIFY={match:['Coincide con este proyecto y su revisión','ok'],obsolete:['Guardada en otra revisión del proyecto: revísala','warn'],mismatch:['No corresponde a este proyecto','bad'],unverifiable:['Asociada sin revisión comprobable','warn'],absent:['Sin parcela','']};
 function renderSaved(){
  const e=entry(),site=e.site,v=A.verify(e.association,subject(),site),[t,tone]=VERIFY[v];
  $('saved').innerHTML=site.parcel?`<p><b>Parcela guardada:</b> ${esc(site.parcel.reference)} · ${esc(site.parcel.source.sourceName||site.parcel.source.providerId)}</p><p><span class="chip ${tone}">${esc(t)}</span></p>
   <p>${site.buildingPlacement?`Vivienda colocada (norte ${esc(site.northOffsetDeg)}°).`:'La vivienda todavía no está colocada.'}</p>`:'<p>Este proyecto no tiene parcela asociada. Puedes trabajar sin ella; asóciala cuando la necesites.</p>';
  const has=!!site.parcel;$('placeCard').hidden=!has;$('exportCard').hidden=!has;$('contextCard').hidden=!has;
  if(has){renderPlacement();renderExport();renderContext();}
 }
 $('project').innerHTML=X.projects.map(p=>`<option value="${p.id}">${esc(p.name)}</option>`).join('');
 $('project').onchange=()=>{state.projectId=$('project').value;state.result=null;state.plan=null;state.draft=null;$('parcelCard').hidden=true;$('lookupStatus').textContent='';renderSaved();};

 /* ---------- lookup ---------- */
 const MESSAGES={
  'parcel-not-found':'No existe ninguna parcela con esa referencia en la fuente consultada.',
  'invalid-parcel-reference':'La referencia catastral no es válida. Debe tener 14 o 20 caracteres (letras y números).',
  'unsupported-source-crs':'La parcela usa un sistema de coordenadas que RUBIK todavía no admite. Prueba con otro huso o con el archivo GML.',
  'multiple-parcels-require-selection':'El archivo contiene varias parcelas: escribe la referencia que quieres usar y vuelve a abrirlo.',
  'invalid-source-document':'La respuesta o el archivo no es un GML de parcela catastral válido.',
  'invalid-source-geometry':'La geometría recibida no es válida.','inconsistent-source-crs':'La geometría mezcla sistemas de coordenadas.',
  cancelled:'Consulta cancelada. No ha cambiado nada.'};
 const DIAG={'service-rejected':'el servicio de Catastro ha rechazado la consulta','network':'no hay conexión con el servicio de Catastro','timeout':'el servicio de Catastro no ha respondido a tiempo','service-exception':'el servicio de Catastro ha devuelto un error'};
 const mode=()=>document.querySelector('input[name=lookupMode]:checked').value;
 function busy(on){$('lookup').disabled=on;$('cancelLookup').hidden=!on;}
 async function lookup(e){
  e?.preventDefault();
  let ref;try{ref=Parcel.normalizeReference($('rc').value);}catch{$('lookupStatus').textContent=MESSAGES['invalid-parcel-reference'];return;}
  const providerId=mode()==='demo'?'demo-parcel':W.ID;if(providerId===W.ID)official.setZone($('zone').value);
  state.controller?.abort();const ctrl=state.controller=new AbortController();busy(true);
  $('lookupStatus').textContent=providerId===W.ID?'Consultando el servicio oficial de Catastro…':'Consultando datos de demostración…';
  const r=await registry.getParcel(providerId,{mode:'reference',reference:ref},{signal:ctrl.signal});
  if(state.controller!==ctrl)return;busy(false);state.controller=null;state.lastProvider=providerId;
  handle(r,providerId==='demo-parcel'?'Demostración (datos de prueba)':'Servicio oficial de Catastro',providerId===W.ID?official.lastDiagnostic():null);
 }
 function handle(r,originLabel,diag){
  if(r.status==='available'){state.result={...r,originLabel};state.plan=A.plan(entry().site,subject(),r);$('lookupStatus').textContent=`Parcela ${r.parcel.reference} encontrada. Revisa los datos antes de asociarla.`;renderResult();return;}
  state.result=null;state.plan=null;$('parcelCard').hidden=true;
  const keep=entry().site.parcel?' Tu parcela guardada no cambia.':'';
  if(r.reason==='network-unavailable'){$('lookupStatus').textContent=`No se ha podido completar la consulta: ${DIAG[diag?.kind]||'el servicio no está disponible'}.${keep} Puedes abrir el GML de la parcela.`;$('gmlFallback').classList.add('suggest');$('gmlFile').closest('label').focus?.();return;}
  const zoneLabel=W.ZONES.find(z=>z.crs===diag?.zone)?.label;
  if(r.reason==='parcel-not-found'&&diag?.kind==='not-found-in-zone'){$('lookupStatus').textContent=`Catastro no encuentra esa parcela en el huso elegido (${zoneLabel||diag.zone}). Comprueba la referencia o elige el huso donde está la parcela.${keep}`;return;}
  $('lookupStatus').textContent=(MESSAGES[r.reason]||'No se ha podido obtener la parcela.')+keep;
 }
 $('lookupForm').onsubmit=lookup;
 $('cancelLookup').onclick=()=>{state.controller?.abort();};
 $('gmlFile').onchange=async e=>{const f=e.target.files[0];e.target.value='';if(!f)return;
  if(f.size>Parcel.LIMITS.documentBytes){$('lookupStatus').textContent='El archivo supera el tamaño admitido.';return;}
  const text=await f.text();let ref;try{ref=$('rc').value.trim()?Parcel.normalizeReference($('rc').value):undefined;}catch{ref=undefined;}
  const r=await registry.getParcel(Catastro.provider.id,{mode:'document',text,...(ref?{reference:ref}:{})});
  state.lastProvider=Catastro.provider.id;handle(r,`Archivo GML · ${f.name}`,null);};

 /* ---------- result and association ---------- */
 function svgOf(parcel,{foot=null,anchor=null,id=''}={}){
  const local=Parcel.toLocalGeometry(parcel),pts=local.polygons.flatMap(p=>p.rings.flat()),xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
  const x=Math.min(...xs),y=Math.min(...ys),w=Math.max(...xs)-x,h=Math.max(...ys)-y,pad=Math.max(w,h)*.08||1000;
  const shapes=local.polygons.map(p=>`<path class="shape" fill-rule="evenodd" d="${p.rings.map(r=>'M '+r.map(v=>v.join(' ')).join(' L ')+' Z').join(' ')}"/>`).join('');
  return `<svg ${id?`id="${id}"`:''} viewBox="${x-pad} ${y-pad} ${w+2*pad} ${h+2*pad}" role="img" aria-label="Forma de la parcela ${esc(parcel.reference)}">${shapes}${foot?`<path class="foot" data-building-footprint="true" d="M ${foot.map(p=>p.x+' '+p.y).join(' L ')} Z"/>`:''}${anchor?`<circle class="anchor" cx="${anchor.x}" cy="${anchor.y}" r="${Math.max(w,h)*.015}"/>`:''}</svg>`;
 }
 const areaM2=parcel=>{const g=Parcel.toLocalGeometry(parcel);let a=0;for(const p of g.polygons)p.rings.forEach((r,i)=>{let s=0;for(let k=0;k<r.length;k++){const q=r[(k+1)%r.length];s+=r[k][0]*q[1]-q[0]*r[k][1];}a+=(i===0?1:-1)*Math.abs(s)/2;});return a/1e6;};
 function renderResult(){
  const r=state.result,p=state.plan,parcel=r.parcel,src=r.provenance,zone=W.ZONES.find(z=>z.crs===parcel.sourceCrs);
  $('parcelCard').hidden=false;
  $('parcelView').innerHTML=svgOf(parcel)+`<dl class="prov" id="parcelFacts"><dt>Referencia</dt><dd>${esc(parcel.reference)}</dd><dt>Origen</dt><dd>${esc(r.originLabel)}</dd>
   <dt>Fuente</dt><dd>${esc(src.sourceName||src.providerId)}</dd><dt>Sistema de coordenadas</dt><dd>${esc(parcel.sourceCrs)}${zone?' · '+esc(zone.label):''}</dd>
   <dt>Superficie del polígono</dt><dd>${areaM2(parcel).toLocaleString('es-ES',{maximumFractionDigits:1})} m² (calculada sobre la geometría; no es la superficie oficial)</dd>
   ${src.retrievedAt?`<dt>Consultada</dt><dd>${new Date(src.retrievedAt).toLocaleString('es-ES')}</dd>`:''}<dt>Licencia</dt><dd>${esc(src.license?.name||'no indicada')}${src.license?.status==='restricted'?' · no se comparte la geometría':''}</dd></dl>`;
  $('planView').innerHTML=!p.ok?`<p class="err">${esc(p.message)}</p>`:`<div class="banner ${p.needsConfirmation?'warn':'info'}">${esc(p.message)}</div>
   ${p.needsConfirmation?`<label class="check confirm"><input type="checkbox" id="confirmReplace"> Sustituir la parcela ${esc(p.previousReference)} por ${esc(p.reference)}${p.dropped.length?' y quitar la colocación guardada':''}</label>`:''}
   <div class="actions"><button type="button" class="btn primary" id="associate" ${p.action==='same'?'disabled':''}>Asociar a ${esc(project().name)}</button></div><p class="err" id="associateError" role="alert"></p>`;
  if(p.ok&&p.action!=='same')$('associate').onclick=()=>{try{state.library=A.apply(state.library,p,{confirmed:!!$('confirmReplace')?.checked});
    const e=entry();store.set(state.projectId,{site:e.site,association:e.association});state.plan=A.plan(e.site,subject(),state.result);
    $('lookupStatus').textContent=`Parcela ${p.reference} asociada a ${project().name}.`;renderResult();renderSaved();}
   catch(err){$('associateError').textContent=/confirmation/.test(err.message)?'Marca la casilla para confirmar la sustitución.':/revision/.test(err.message)?'El proyecto cambió de revisión: vuelve a consultar.':err.message;}};
 }

 /* ---------- placement ---------- */
 // Point-in-polygon on the outer rings of the parcel (local mm): a warning aid, never an automatic correction.
 function inside(parcel,pts){const rings=Parcel.toLocalGeometry(parcel).polygons.map(p=>p.rings[0]);
  const inRing=(r,x,y)=>{let c=false;for(let i=0,j=r.length-1;i<r.length;j=i++){const [xi,yi]=r[i],[xj,yj]=r[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};
  return pts.every(p=>rings.some(r=>inRing(r,p.x,p.y)));}
 const footprint=()=>{const f=project().footprint;return [{x:0,y:0},{x:f.w,y:0},{x:f.w,y:f.h},{x:0,y:f.h},{x:0,y:0}];};
 const modelAnchor=()=>({x:project().footprint.w/2,y:project().footprint.h/2});
 function renderPlacement(){
  const site=entry().site,saved=site.buildingPlacement,draft=state.draft;
  if(saved&&!draft)$('north').value=site.northOffsetDeg??0;
  const test=draft?{...site,northOffsetDeg:Number($('north').value)||0,buildingPlacement:{horizontal:{modelAnchorMm:modelAnchor(),parcelLocalAnchorMm:draft,source:{type:'user-entered'}}}}:saved?site:null;
  let foot=null,anchor=null;try{if(test){foot=footprint().map(p=>Territory.modelToParcel(test,p));anchor=test.buildingPlacement.horizontal.parcelLocalAnchorMm;}}catch{}
  $('placeView').innerHTML=svgOf(site.parcel,{foot,anchor,id:'placeSvg'})+(foot&&!inside(site.parcel,foot)?'<p class="warnline" id="outsideWarn">Parte de la huella queda fuera de la parcela. Revisa la posición o el norte; RUBIK no la corrige por ti.</p>':'');
  $('savePlacement').disabled=!draft;$('clearPlacement').disabled=!saved;
  $('placeSvg').onclick=e=>{const svg=$('placeSvg'),pt=svg.createSVGPoint();pt.x=e.clientX;pt.y=e.clientY;const q=pt.matrixTransform(svg.getScreenCTM().inverse());state.draft={x:Math.round(q.x),y:Math.round(q.y)};
   $('placeStatus').textContent='Posición elegida. Guarda para conservarla.';renderPlacement();};
 }
 $('north').oninput=()=>{if(state.draft||entry().site.buildingPlacement){if(!state.draft)state.draft=entry().site.buildingPlacement.horizontal.parcelLocalAnchorMm;renderPlacement();}};
 $('savePlacement').onclick=()=>{try{const north=Number($('north').value);if(!Number.isFinite(north)||north<0||north>=360)throw Error('El norte debe estar entre 0 y 360 grados.');
   const site=A.place(entry().site,{modelAnchorMm:modelAnchor(),parcelLocalAnchorMm:state.draft,northOffsetDeg:north}),rt=A.roundTrip(site,footprint());
   state.library={...state.library,[state.projectId]:{...entry(),site}};store.set(state.projectId,{site,association:entry().association});state.draft=null;
   const err=rt.maxErrorMm<1e-6?'menos de 0,000001 mm':rt.maxErrorMm.toLocaleString('es-ES',{maximumSignificantDigits:3})+' mm';
   $('placeStatus').textContent=`Colocación guardada. Comprobación de ida y vuelta: error máximo ${err} (${rt.withinTolerance?'dentro':'fuera'} de la tolerancia de 0,001 mm).`;renderSaved();}
  catch(err){$('placeStatus').textContent=err.message;}};
 $('clearPlacement').onclick=()=>{const site={...entry().site};delete site.buildingPlacement;state.library={...state.library,[state.projectId]:{...entry(),site}};store.set(state.projectId,{site,association:entry().association});state.draft=null;$('placeStatus').textContent='Colocación quitada. La parcela se mantiene.';renderSaved();};

 /* ---------- export and context ---------- */
 const CH={screen:'Pantalla de trabajo',video:'Vídeo de evolución',html:'Presentación HTML',snapshot:'Instantánea de entrega'};
 function renderExport(){const site=entry().site;
  $('exportView').innerHTML=`<div class="scroll"><table id="exportTable"><thead><tr><th>Canal</th><th>Geometría de la parcela</th><th>Texto que se incluye</th></tr></thead><tbody>${A.CHANNELS.map(c=>{const v=A.exportView(site,c);
   return `<tr data-channel="${c}"><td>${esc(CH[c])}</td><td>${v.includeGeometry?'<span class="chip ok">Sí</span>':'<span class="chip bad">No</span>'}${c==='screen'?' <small>solo para trabajar</small>':''}</td><td>${esc(v.text||'—')}</td></tr>`;}).join('')}</tbody></table></div>
   <p class="hint">La licencia de Catastro permite el uso propio y prohíbe difundir la información original sin transformar: la geometría no sale de RUBIK; la referencia y la fuente sí, como texto.</p>`;}
 function renderContext(){const rows=A.contextLayers(entry().site,Geo.createDefaultRegistry());
  $('contextView').innerHTML=`<ul class="rows">${rows.map(r=>`<li><span class="chip">${r.key==='orthophoto'?'Ortofoto PNOA':'Terreno MDT05'}</span><span>${r.status==='saved'?'Guardado en el proyecto':r.status==='not-requested'?'No cargado (opcional)':'No disponible'} · requiere conexión · licencia ${esc(r.license)}</span><span></span><span></span></li>`).join('')}</ul>
   <p class="hint">${esc(rows[0]?.note||'')} RUBIK no los carga automáticamente.</p>`;}

 renderSaved();
 Object.assign(api,{registry,official,demo,lookup,renderSaved,store});
})();
