/* FT3D-8 delivery core (FloorPlanConstructionDelivery): pure rules for the professional's deliverable.
   - Cost policy (C6): costs are shown only when project, plan and C1-C4 budget agree; null stays unknown; a budgeted
     amount is never presented as spent or certified.
   - Video storyboard: opening (brand, project, "simulacion planificada"), timeline over the plan's day frames, closing
     (final state, contact, revisions, disclaimer). Between two day frames the motion is illustrative.
   - Brand: FloorPlanBrand.snapshot output, filtered to the contact fields the professional explicitly included.
   - Manifest (D7): frozen identifiers + SHA-256 of project, plan, budget, brand and video. A new revision = a new delivery.
   - Client document: self-contained read-only HTML, compatible with api/view's CSP (no scripts, images as data:).
   No DOM, no network, no storage. */
(function(root,factory){
  const req=typeof module==='object'&&module.exports;
  const deps=req?{Schedule:require('./construction-schedule-core.js'),Visual:require('./construction-visual-state.js'),
    Presenter:require('./construction-lab-presenter.js'),Project:require('./construction-project-adapter.js'),Brand:require('./brand-core.js')}
    :{Schedule:root.FloorPlanConstructionSchedule,Visual:root.FloorPlanConstructionVisualState,Presenter:root.FloorPlanConstructionLabPresenter,
      Project:root.FloorPlanConstructionProject,Brand:root.FloorPlanBrand};
  const api=factory(deps);
  if(req)module.exports=api;else root.FloorPlanConstructionDelivery=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(deps){
  'use strict';
  const {Schedule,Visual,Presenter,Project,Brand}=deps;
  for(const [n,v] of Object.entries(deps))if(!v)throw new TypeError('FloorPlanConstructionDelivery requires '+n);
  const MANIFEST_SCHEMA='rubik-sota.construction-delivery',MANIFEST_VERSION='0.2.0';
  // Same limit as api/share.js (Vercel function body ~4.5 MB).
  const SHARE_LIMIT_BYTES=4*1024*1024;
  const ENDPOINTS=Object.freeze({share:'/api/share',view:'/api/view'}); // absolute: the lab lives under /labs/ft3d-8/
  const COST_MODES=Object.freeze(['none','summary','tasks']);
  const CONTACT_FIELDS=Object.freeze(['person','phone','email','web']);
  const SIMULATION='Simulacion planificada e ilustrativa de la evolucion de obra: no muestra obra ejecutada ni certificada';
  const COSTS_NOTICE='Importes presupuestados (C1-C4) sin IVA: no son gasto ejecutado, pagado ni certificado';
  const err=s=>{throw new TypeError('FloorPlanConstructionDelivery: '+s);};
  const DAY=86400000,ms=d=>Date.parse(d+'T00:00:00Z'),iso=x=>new Date(x).toISOString().slice(0,10);
  const deepFreeze=o=>{if(o&&typeof o==='object'&&!Object.isFrozen(o)){Object.freeze(o);for(const v of Object.values(o))deepFreeze(v);}return o;};
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const slug=s=>String(s||'').normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^\w]+/g,'-').replace(/^-|-$/g,'').toLowerCase().slice(0,50)||'proyecto';

  /* ---------- C6 cost policy ---------- */
  function costPolicy(model,{mode='summary',schedule=null}={}){
    if(!COST_MODES.includes(mode))err('cost mode must be none, summary or tasks');
    const reasons=[],report=model.costs&&model.costs.report;
    if(model.planning.status!=='available')reasons.push(model.planning.status==='rejected'?'plan de otro proyecto o no valido':'sin plan');
    if(model.costs.status!=='available'||!report)reasons.push(model.costs.message||('costes no disponibles ('+(model.costs.reason||'sin presupuesto')+')'));
    const blocking=model.issues.filter(i=>i.severity==='error').map(i=>i.code);
    if(blocking.length)reasons.push('errores de coherencia: '+blocking.join(', '));
    if(report){
      // No double counting: the sum allocated to tasks never exceeds the known budget amount.
      const allocated=Math.round(report.scheduleTotals.allocatedKnownNet*100),known=Math.round((report.budgetTotals.amount||0)*100);
      if(allocated>known)reasons.push('suma asignada superior al presupuesto conocido');
    }
    const allowed=reasons.length===0;
    if(mode==='none'||!allowed)return deepFreeze({mode:'none',requested:mode,allowed,reasons,rows:[],summary:null,warnings:allowed?[]:['Costes no incluidos: '+reasons.join('; ')]});
    if(!schedule)err('the plan is required to name the phases of the costs');
    const views=report.byTask.map(t=>({t,v:Presenter.costView(t,report)}));
    const titles=new Map(Schedule.canonical(schedule).tasks.map(t=>[t.id,t]));
    const rows=views.map(({t,v})=>({taskId:t.taskId,title:titles.get(t.taskId)?.title||t.taskId,wbs:titles.get(t.taskId)?.wbs||'',status:v.status,label:v.label,
      total:v.total,totalText:v.totalText,known:v.known,knownText:v.knownText,notes:[...v.notes]}));
    const warnings=[COSTS_NOTICE];
    const unknown=report.budgetTotals.missingItemIds,pending=report.pendingAllocations,unassigned=report.unassignedBudgetItemIds;
    if(unknown.length)warnings.push('Partidas sin precio (importe desconocido): '+unknown.join(', '));
    if(pending.length)warnings.push('Repartos pendientes: '+pending.map(p=>p.itemId+' '+p.pendingPercent+' %').join(', '));
    if(unassigned.length)warnings.push('Partidas sin asignar a ninguna tarea: '+unassigned.join(', '));
    if(rows.some(r=>r.status==='no-verificado'))warnings.push('Hay importes conocidos pero no verificados (precio sin revisar o reparto pendiente)');
    if(report.projectRevision.check!=='match')warnings.push('Correspondencia proyecto-presupuesto no verificable por C1-C4');
    if(model.coverage.scope)warnings.push('Cobertura: '+model.coverage.budget.allocatedPercentOfKnown+' % de las partidas cargadas asignadas; no equivale a la obra completa (no modelado: '+model.coverage.scope.notModeled.join(', ')+')');
    const summary={knownNet:report.scheduleTotals.allocatedKnownNet,knownText:Presenter.euro(report.scheduleTotals.allocatedKnownNet),
      complete:report.scheduleTotals.complete,unknownItems:unknown.length,currency:'EUR'};
    return deepFreeze({mode,requested:mode,allowed,reasons:[],rows:mode==='tasks'?rows:[],summary,warnings});
  }

  /* ---------- storyboard ---------- */
  function storyboard(schedule,{openingMs=3500,closingMs=4500,msPerDay=null,minTimelineMs=9000,maxTimelineMs=16000}={}){
    const tl=Visual.timeline(schedule);if(!tl.positions)err('a schedule with tasks is required for a video');
    const days=tl.positions-1,timelineMs=msPerDay?days*msPerDay:Math.max(minTimelineMs,Math.min(maxTimelineMs,days*140));
    const total=openingMs+timelineMs+closingMs;
    const at=tMs=>{
      const t=Math.max(0,Math.min(total,tMs));
      if(t<openingMs)return {segment:'opening',progress:t/openingMs,pos:0,date:tl.preStartDate};
      if(t<openingMs+timelineMs){const k=(t-openingMs)/timelineMs,pos=k*days;return {segment:'timeline',progress:k,pos,date:iso(ms(tl.preStartDate)+Math.floor(pos+1e-9)*DAY)};}
      return {segment:'closing',progress:(t-openingMs-timelineMs)/closingMs,pos:days,date:tl.completionDate};
    };
    return deepFreeze({totalMs:total,openingMs,timelineMs,closingMs,positions:tl.positions,startDate:tl.startDate,endDate:tl.endDate,
      preStartDate:tl.preStartDate,completionDate:tl.completionDate,at});
  }
  // ONE wording of «what is happening on day `date`», shared by the on-screen card and the video frame (parity, Gate D).
  const clean=t=>String(t||'').replace(/^FIXTURE /,'');
  function moment(schedule,date,st=Schedule.stateAt(schedule,date)){
    const active=st.tasks.filter(t=>t.plannedPhase==='in-progress');
    const done=st.tasks.length>0&&st.tasks.every(t=>t.plannedPhase==='completed'),started=st.tasks.some(t=>t.plannedPhase!=='not-started');
    const idle=started&&!done&&!active.length,stage=done?'final':started?'en-obra':'inicio';
    return {stage,stageText:done?'FINAL · PLAN COMPLETADO':started?'EN OBRA (SEGÚN PLAN)':'INICIO · ESTADO PREVIO',idle,done,concurrent:active.length,
      headline:done?'Plan completado: todas las tareas planificadas terminadas':active.length?active.map(t=>clean(t.title)).join(' · '):idle?'No hay trabajos programados durante este periodo':'Antes del comienzo de la obra',
      concurrentText:active.length>1?'Hay '+active.length+' trabajos previstos a la vez':''};
  }
  // Texts painted over a video frame at plan date `date` (authoritative day state).
  function overlay(model,schedule,date,policy){
    const st=Schedule.stateAt(schedule,date),week=Presenter.weekOf(schedule,date),active=st.tasks.filter(t=>t.plannedPhase==='in-progress');
    const mo=moment(schedule,date,st);
    // The plan total and the active phase cost are two different figures and are always labelled as such.
    // Allocations come from the NET amounts of C1-C4: always labelled «sin IVA» (never read as a VAT-inclusive total).
    const total='Total presupuestado asignado al plan (sin IVA): '+(policy?.summary?.knownText||'—')+(policy?.summary&&!policy.summary.complete?' (incompleto)':'');
    let cost;
    if(!policy||!policy.allowed||policy.mode==='none')cost=[policy&&!policy.allowed?'Costes no incluidos en este vídeo':'Costes no incluidos (elección del profesional)'];
    else if(policy.mode==='summary')cost=[total+' · no es el coste de la fase en curso'];
    else{const lines=active.map(t=>{const r=policy.rows.find(x=>x.taskId===t.id);return r?'Fase en curso «'+t.title.replace(/^FIXTURE /,'')+'» (sin IVA): '+r.totalText+(r.status!=='revisado'?' ('+r.label.toLowerCase()+')':''):null;}).filter(Boolean);
      cost=[...(lines.length?lines:['Sin fase en curso']),total];}
    return {date,dateText:Presenter.dateLabel(date),week:week.label,weeks:week.total,stage:mo.stage,stageText:mo.stageText,concurrentText:mo.concurrentText,idle:mo.idle,
      headline:mo.headline,
      active:active.map(t=>({id:t.id,wbs:t.wbs,title:t.title.replace(/^FIXTURE /,''),plannedPercent:Math.round(t.visualProgress*100)})),
      bars:st.tasks.map(t=>({id:t.id,start:t.startDate,end:t.endDate,phase:t.plannedPhase})),cost,evidence:st.evidence};
  }

  /* ---------- brand (FloorPlanBrand snapshot, filtered) ---------- */
  function brandFor(snapshot,{include=[]}={}){
    if(!snapshot)return deepFreeze({present:false,name:null,credit:'Generado con RUBIK SOTA',contact:'',fields:[]});
    if(!snapshot.profile||!snapshot.takenAt)err('brand must be a FloorPlanBrand.snapshot');
    const p=Brand.normalizeProfile(snapshot.profile,{id:snapshot.profile.id}); // re-validated by the brand core
    const fields=CONTACT_FIELDS.filter(f=>include.includes(f)&&p[f]);
    const shown={...Object.fromEntries(CONTACT_FIELDS.map(f=>[f,''])),...Object.fromEntries(fields.map(f=>[f,p[f]]))};
    return deepFreeze({present:true,profileId:p.id,name:p.name,tagline:p.tagline,logo:p.logo,title:snapshot.title,intro:snapshot.intro,takenAt:snapshot.takenAt,
      contact:Brand.contactLine(shown),fields,credit:Brand.credit(p)});
  }

  /* ---------- manifest (D7) ---------- */
  // 0.2.0 (S1): optional `dossier` = the FloorPlanConstructionDossier evaluation the delivery comes from. The manifest then
  // records the dossier identity and, for the territory, ONLY what its export policy allows (reference text + attribution;
  // never restricted geometry). A dossier with incompatibilities cannot be delivered. 0.1.0 manifests stay readable.
  async function createManifest({model,schedule,budget=null,brand,costPolicy:policy,title,intro,generatedAt=new Date().toISOString(),video=null,binding=null,dossier=null}){
    if(!model||!model.subject)err('presentation model required');
    if(model.planning.status!=='available'||!schedule)err('a valid plan of this project is required to deliver its evolution');
    if(dossier&&!dossier.usable?.delivery)err('the dossier has incompatibilities and cannot be delivered: '+(dossier.usable?.reasons||[]).join(', '));
    if(dossier&&(dossier.subject.type!==model.subject.type||dossier.subject.id!==model.subject.id))err('dossier and project do not match');
    const s=Schedule.validate(schedule);
    if(s.projectRef.id!==model.subject.id)err('plan and project do not match');
    const b=brand||brandFor(null),fp=Project.fingerprint;
    const body={schema:MANIFEST_SCHEMA,schemaVersion:MANIFEST_VERSION,generatedAt,
      title:String(title||b.title||model.subject.name).slice(0,120),intro:String(intro??b.intro??'').slice(0,400),
      project:{type:model.subject.type,id:model.subject.id,name:model.subject.name,updatedAt:model.subject.updatedAt,fingerprint:model.fingerprints.project},
      plan:{id:s.id,fingerprint:model.fingerprints.schedule,evidence:model.planning.evidence,startDate:Schedule.bounds(s).startDate,endDate:Schedule.bounds(s).endDate,
        phases:s.tasks.map(t=>({id:t.id,wbs:t.wbs,title:t.title,startDate:t.startDate,endDate:t.endDate}))},
      budget:budget&&model.costs.report?{id:budget.id,fingerprint:model.fingerprints.budget,revisionCheck:model.costs.report.projectRevision.check}:null,
      binding:binding?{id:binding.id,review:binding.review.status,declaredBy:binding.review.by||null}:null,
      delivery:{level:model.delivery.level,label:model.delivery.label,approval:model.delivery.assurances.approval,scopeNotice:model.delivery.scopeNotice},
      costs:policy?{mode:policy.mode,allowed:policy.allowed,summary:policy.summary,rows:policy.rows,warnings:policy.warnings,reasons:policy.reasons}:{mode:'none',allowed:false,rows:[],warnings:[]},
      brand:{present:b.present,name:b.name,tagline:b.tagline||'',logo:b.logo||null,contact:b.contact,fields:[...b.fields],credit:b.credit,takenAt:b.takenAt||null},
      warnings:[SIMULATION,model.delivery.scopeNotice,'Aprobacion: '+model.delivery.assurances.approval,
        ...model.issues.filter(i=>i.severity!=='info').map(i=>i.code+': '+i.message)],
      dossier:dossier?{id:dossier.dossier.id,fingerprint:dossier.dossier.fingerprint,integrity:dossier.dossier.integrity,route:dossier.dossier.route,
        budgetScope:dossier.authorities.budget.scope,budgetIds:dossier.authorities.budget.selected.map(x=>x.budgetId)}:null,
      territory:dossier?.authorities.territory.parcel&&dossier.exportPolicy.html.parcelReferenceText?{reference:dossier.authorities.territory.parcel.reference,
        attribution:dossier.authorities.territory.parcel.attribution,geometryIncluded:!!dossier.exportPolicy.html.parcelGeometry,
        note:dossier.exportPolicy.html.parcelGeometry?null:'Geometría de la parcela no incluida: su licencia no permite redistribuirla'}:null,
      video:video?{filename:video.filename,type:video.type,bytes:video.bytes,width:video.width,height:video.height,durationMs:video.durationMs,sha256:video.sha256}:null};
    body.brand.fingerprint=b.present?await fp({name:b.name,logo:b.logo,contact:b.contact,takenAt:b.takenAt}):null;
    const fingerprint=await fp(body);
    return deepFreeze({...body,id:'dlv_'+fingerprint.slice(0,16),fingerprint});
  }
  const videoFilename=(manifest,ext)=>`rubik-sota-evolucion-${slug(manifest.project.name)}-${manifest.project.fingerprint.slice(0,8)}.${ext}`;
  const documentFilename=manifest=>`rubik-sota-evolucion-${slug(manifest.project.name)}-${manifest.project.fingerprint.slice(0,8)}.html`;

  /* ---------- client document ---------- */
  // video: {src:'https://…'|'data:…', type} or null. Published pages get media from the Blob host (api/view CSP).
  function clientDocument(manifest,{video=null}={}){
    if(!manifest||manifest.schema!==MANIFEST_SCHEMA)err('a delivery manifest is required');
    const m=manifest,b=m.brand,media=video?(video.src.startsWith('data:')?'data:':new URL(video.src).origin):"'none'";
    if(video&&!/^(https:|data:video\/)/.test(video.src))err('video must be an https URL or a data:video URL');
    const csp=`default-src 'none'; img-src data:; media-src ${media}; style-src 'unsafe-inline'; form-action 'none'; base-uri 'none'`;
    const phases=m.plan.phases.map(p=>`<tr><td>${esc(p.wbs)}</td><td>${esc(p.title.replace(/^FIXTURE /,''))}</td><td>${esc(Presenter.dateLabel(p.startDate))}</td><td>${esc(Presenter.dateLabel(p.endDate))}</td></tr>`).join('');
    const costs=!m.costs.allowed||m.costs.mode==='none'
      ?`<p class="muted">${m.costs.allowed?'El profesional no ha incluido importes en esta presentación.':'Importes no incluidos: '+esc(m.costs.reasons.join('; ')||'no disponibles')}</p>`
      :`<p><strong>Presupuesto asignado a las fases del plan, sin IVA (importe conocido): ${esc(m.costs.summary.knownText)}</strong>${m.costs.summary.complete?'':' · <em>incompleto</em>'}</p>`+
       (m.costs.mode==='tasks'?`<table><thead><tr><th>Fase</th><th>Importe sin IVA</th><th>Estado</th></tr></thead><tbody>${m.costs.rows.map(r=>`<tr><td>${esc(r.wbs)} ${esc(r.title.replace(/^FIXTURE /,''))}</td><td>${esc(r.totalText)}</td><td>${esc(r.label)}</td></tr>`).join('')}</tbody></table>`:'');
    const warn=[...m.warnings.slice(0,3),...m.costs.warnings].map(w=>`<li>${esc(w)}</li>`).join('');
    const json=JSON.stringify(m).replace(/</g,'\\u003c');
    return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Security-Policy" content="${csp}"><meta name="referrer" content="no-referrer">
<title>${esc(m.title)}</title>
<style>:root{--surface:#eceeee;--panel:#fff;--ink:#1f2326;--muted:#5b6266;--action:#1f5a66;--select:#2b3034;--warn:#7a5200;--warn-soft:#fff4dc}
*{box-sizing:border-box}body{margin:0;background:var(--surface);color:var(--ink);font:16px/1.5 Inter,"Helvetica Neue",Arial,sans-serif}
main{max-width:980px;margin:0 auto;padding:24px 16px 40px}header.brand{display:flex;gap:14px;align-items:center;margin-bottom:12px}header.brand img{max-height:56px;max-width:180px}
h1{font-size:clamp(26px,4vw,40px);line-height:1.1;margin:8px 0}.muted{color:var(--muted)}.card{background:var(--panel);border-radius:10px;padding:18px;margin:14px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
video{width:100%;border-radius:8px;background:#000}table{width:100%;border-collapse:collapse;font-size:14px}td,th{text-align:left;padding:6px 8px;border-bottom:1px solid #e3e6e7}
.notice{background:var(--warn-soft);color:var(--warn);border-radius:8px;padding:12px 14px}.notice ul{margin:6px 0 0;padding-left:18px}
footer{font-size:13px;color:var(--muted);margin-top:24px}code{font-size:12px}.tag{display:inline-block;background:var(--select);color:#fff;border-radius:4px;padding:2px 8px;font-size:12px}</style></head>
<body><main>
<header class="brand">${b.present&&b.logo?`<img src="${esc(b.logo)}" alt="">`:''}<div><strong>${esc(b.present?b.name:'RUBIK SOTA')}</strong>${b.present&&b.tagline?`<br><span class="muted">${esc(b.tagline)}</span>`:''}</div></header>
<span class="tag">Evolución de obra planificada</span>
<h1>${esc(m.title)}</h1>${m.intro?`<p>${esc(m.intro)}</p>`:''}
<p class="muted">Proyecto ${esc(m.project.name)} · revisión <code>${esc(m.project.fingerprint.slice(0,12))}</code> · plan <code>${esc(m.plan.id)}</code> (${esc(m.plan.evidence)}) · ${esc(Presenter.dateLabel(m.plan.startDate))} → ${esc(Presenter.dateLabel(m.plan.endDate))}</p>
<section class="card" id="video">${video?`<video controls playsinline preload="metadata" src="${esc(video.src)}" aria-label="Vídeo de la evolución de obra"></video>`:`<p class="muted">Vídeo de la evolución de obra: ${m.video?`se entrega como archivo aparte (<code>${esc(m.video.filename)}</code>)`:'no incluido'}.</p>`}</section>
<section class="card"><h2>Fases del plan</h2><table><thead><tr><th>WBS</th><th>Fase</th><th>Inicio</th><th>Fin</th></tr></thead><tbody>${phases}</tbody></table></section>
<section class="card"><h2>Presupuesto</h2>${costs}</section>
<section class="notice" role="note"><strong>Importante</strong><ul>${warn}</ul></section>
<section class="card"><h2>Estado de la información</h2><p>${esc(m.delivery.label)}</p><p class="muted">${esc(m.delivery.scopeNotice)}</p>${m.dossier?`<p class="muted">Expediente <code>${esc(m.dossier.id)}</code> · ${m.dossier.integrity==='verified'?'paquete verificado':'documentos cargados localmente'}</p>`:''}${m.territory?`<p class="muted">Parcela catastral ${esc(m.territory.reference)}${m.territory.attribution?` · Fuente: ${esc(m.territory.attribution)}`:''}${m.territory.note?` · ${esc(m.territory.note)}`:''}</p>`:''}</section>
<footer>${esc(b.credit)}${b.present&&b.contact?` · ${esc(b.contact)}`:''}<br>Generado el ${esc(m.generatedAt)} · entrega <code>${esc(m.id)}</code> · huella <code>${esc(m.fingerprint.slice(0,16))}</code>. Documento de solo lectura: no contiene el proyecto editable. Si el proyecto cambia, el profesional genera una entrega nueva.</footer>
</main><script type="application/json" id="ft3d8-manifest">${json}</script></body></html>`;
  }
  // Publication messages for the existing api/share responses (no new service).
  const PUBLISH_ERRORS=Object.freeze({
    'not-configured':'Los enlaces no están configurados en este servidor (faltan BLOB_READ_WRITE_TOKEN y/o RUBIK_RENDER_TOKEN en el proyecto Vercel). El vídeo y la presentación siguen disponibles para descargar.',
    token:'El código de acceso no es correcto.',size:'El archivo supera 4 MB y no se puede publicar. Descárgalo y envíalo directamente.',
    'storage-unreachable':'No se pudo contactar con el almacenamiento. Vuelve a intentarlo.','storage-error':'El almacenamiento rechazó el archivo. No se ha publicado nada.',
    unavailable:'Publicar enlaces no está disponible en este servidor (/api/share no existe aquí). Descarga los archivos y envíalos.',
    kind:'Tipo de archivo no admitido por el servicio.',file:'El documento no tiene el formato esperado.',method:'Método no permitido.'});
  function publishError(status,code){if(status===404)return PUBLISH_ERRORS.unavailable;return PUBLISH_ERRORS[code]||(status===401?PUBLISH_ERRORS.token:status===413?PUBLISH_ERRORS.size:status===503?PUBLISH_ERRORS['not-configured']:PUBLISH_ERRORS['storage-error']);}
  return Object.freeze({MANIFEST_SCHEMA,MANIFEST_VERSION,SHARE_LIMIT_BYTES,ENDPOINTS,COST_MODES,CONTACT_FIELDS,SIMULATION,COSTS_NOTICE,PUBLISH_ERRORS,
    costPolicy,storyboard,moment,overlay,brandFor,createManifest,clientDocument,videoFilename,documentFilename,publishError,slug});
});
