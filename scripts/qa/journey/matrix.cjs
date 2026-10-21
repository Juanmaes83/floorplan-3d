/* Journey matrix from one or more audit.json files (scripts/qa/journey/audit.cjs): one row per journey and viewport
   with the initial state, the user's intention, the next action the screen offered, the actions really performed, the
   block (if any), the evidence (captures and video) and the design decision for that journey. With two inputs
   (before/after) both columns are shown side by side. Usage:
   node scripts/qa/journey/matrix.cjs <decisions.json> <before/audit.json> [<after/audit.json>] > matrix.md */
const fs=require('node:fs'),path=require('node:path');
const [decisionsFile,...inputs]=process.argv.slice(2);
const decisions=JSON.parse(fs.readFileSync(decisionsFile,'utf8'));
const reports=inputs.map(f=>({file:f,dir:path.dirname(f),...JSON.parse(fs.readFileSync(f,'utf8'))}));
const cell=s=>String(s??'—').replace(/\|/g,'\\|').replace(/\n/g,' ');
const offer=s=>{if(!s)return '—';const parts=[];if(s.empty)parts.push(`Plano vacío: «${s.empty.slice(0,60)}»`);if(s.guide.shown)parts.push(`Guía: «${s.guide.title}» → «${s.guide.primary||'sin botón'}»`);else parts.push('Guía oculta');return parts.join(' · ');};
const initial=s=>{if(!s)return '—';const p=s.project;return `${s.dialogs.length?s.dialogs.map(d=>d.split(':')[0]).join(', ')+' · ':''}${p?`${p.rooms} est., ${p.objects} muebles, ${p.openings} huecos`:''}${s.status&&s.status.state!=='clear'?` · ${s.status.headline}`:''}`;};
const summary=j=>{if(!j)return {offered:'no ejecutado',did:'—',block:'—',findings:'—'};const first=j.steps[0],last=j.steps.at(-1);
 const findings=[...new Set(j.steps.flatMap(s=>s.coherence||[]))].concat(j.hidden.map(h=>`Oculto en modo guiado: ${h.why}`)).concat(j.notes||[]).concat(j.download?[`ZIP: ${j.download.entries.join(', ')}`]:[]);
 return {initial:initial(first),offered:offer(first),after:offer(last),did:j.steps.map(s=>s.did).filter(Boolean).join(' → '),
  block:j.blocked.length?j.blocked.map(b=>`${b.step}: ${b.reason}`).join('; ')+(j.notRun?.length?` · no ejecutado: ${j.notRun.join(', ')}`:''):'ninguno',completed:j.completed!==false&&!j.blocked.length,findings:findings.join(' · ')||'—',
  evidence:`${j.steps.length} capturas + vídeo (${j.viewport}/${j.id}/)`};};
const ids=[...new Set(reports.flatMap(r=>r.journeys.map(j=>j.id)))].sort();
const vps=[...new Set(reports.flatMap(r=>r.journeys.map(j=>j.viewport)))];
const out=[];
out.push(`Commits auditados: ${reports.map(r=>`\`${r.commit.slice(0,7)}\``).join(' → ')} · ${reports[0].browser} · renderer: ${reports[0].renderer} · emulación de teléfono en Chromium (no es un teléfono físico).`,'');
for(const id of ids){const d=decisions[id]||{};const title=reports.flatMap(r=>r.journeys).find(j=>j.id===id)?.title;
 out.push(`### ${id}. ${title}`,'',`**Intención:** ${d.intent||'—'}`,'',`**Decisión de diseño:** ${d.decision||'—'}`,'');
 const head=reports.length>1?'| Tamaño | Estado inicial | Siguiente acción ofrecida (antes) | Ofrecida (después) | Acción ejecutada | Bloqueo antes | Bloqueo después | Hallazgos (antes) | Hallazgos (después) |':'| Tamaño | Estado inicial | Siguiente acción ofrecida | Al final del recorrido | Acción ejecutada | Bloqueo | Completo | Hallazgos | Evidencia |';
 out.push(head,'|'+' --- |'.repeat(head.split('|').length-2));
 for(const vp of vps){const js=reports.map(r=>r.journeys.find(j=>j.id===id&&j.viewport===vp));if(!js.some(Boolean))continue;const [a,b]=js.map(summary);
  if(reports.length>1)out.push(`| ${vp} | ${cell(a.initial)} | ${cell(a.offered)} | ${cell(b.offered)} | ${cell(b.did||a.did)} | ${cell(a.block)} | ${cell(b.block)} | ${cell(a.findings)} | ${cell(b.findings)} |`);
  else out.push(`| ${vp} | ${cell(a.initial)} | ${cell(a.offered)} | ${cell(a.after)} | ${cell(a.did)} | ${cell(a.block)} | ${a.completed?'sí':'**no**'} | ${cell(a.findings)} | ${cell(a.evidence)} |`);}
 out.push('');}
process.stdout.write(out.join('\n'));
