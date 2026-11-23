#!/usr/bin/env node
'use strict';
/* M13 · Verificación de interoperabilidad de la exportación MSPDI (herramienta de QA, no se carga en la app).
 *  1. Exporta los planes de prueba (fixtures sintéticos + casos límite) con js/construction-schedule-mspdi.js.
 *  2. Valida cada XML con el esquema oficial MSPDI de Microsoft Project 2007 (mspdi_pj12.xsd), si se indica, con xmllint.
 *     El esquema publicado usa el espacio de nombres versionado; Microsoft Project escribe y lee el no versionado, así que
 *     se valida con una copia del esquema con el espacio de nombres normalizado (contenido idéntico).
 *  3. Relee cada XML con MPXJ 13.12.0 (lector de GanttProject 3.4) y compara campo a campo con el plan de RUBIK:
 *     nombre, inicio, fin, duración en días, hito, dependencias (tipo y desfase), fecha anclada, identidad RUBIK, avance 0.
 * Uso:
 *   node scripts/interop/mspdi/verify.cjs DESTINO-NUEVO [--xsd ruta/mspdi_pj12.xsd] [--mpxj-classpath "out:lib/*"]
 * Sin --xsd o sin --mpxj-classpath se omite esa parte y el informe lo declara (no se da por superada). */
const fs = require('node:fs'), path = require('node:path'), { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '../../..');
const S = require(path.join(root, 'js/construction-schedule-core.js')), X = require(path.join(root, 'js/construction-schedule-mspdi.js'));
const F = require(path.join(root, 'tests/fixtures/construction-schedule-fixtures.cjs'));
const { cases } = require(path.join(root, 'tests/fixtures/mspdi-cases.cjs'));
const args = process.argv.slice(2), opt = n => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : null; };
const dest = args[0], xsd = opt('--xsd'), cp = opt('--mpxj-classpath');
if (!dest || fs.existsSync(dest)) { console.error('Usage: verify.cjs NEW-DEST [--xsd mspdi_pj12.xsd] [--mpxj-classpath CP]'); process.exit(1); }
fs.mkdirSync(dest, { recursive: true });
const DAY = 86400000, addDays = (d, n) => new Date(Date.parse(d + 'T00:00:00Z') + n * DAY).toISOString().slice(0, 10);
const plans = { ...Object.fromEntries(['simpleHouse', 'kitchenReform', 'incompletePlan'].map(k => [k, (F[k]().schedule || F[k]())])), ...cases() };
let nsXsd = null;
if (xsd) { nsXsd = path.join(dest, 'mspdi_pj12.ns.xsd'); fs.writeFileSync(nsXsd, fs.readFileSync(xsd, 'utf8').replace(/http:\/\/schemas\.microsoft\.com\/project\/2007/g, 'http://schemas.microsoft.com/project')); }
const report = { tool: 'scripts/interop/mspdi/verify.cjs', exporter: X.VERSION, xsd: xsd ? path.basename(xsd) : 'NOT RUN', mpxj: cp ? 'MPXJ (classpath given)' : 'NOT RUN', plans: [] };
for (const [name, plan] of Object.entries(plans)) {
  const canon = S.canonical(plan), { xml, report: rep } = X.toMSPDI(plan, { projectName: 'RUBIK · ' + name });
  const file = path.join(dest, name + '.xml'); fs.writeFileSync(file, xml);
  const row = { plan: name, tasks: rep.tasks, milestones: rep.milestones, links: rep.links, schema: null, readback: null, mismatches: [] };
  if (nsXsd) { try { execFileSync('xmllint', ['--noout', '--schema', nsXsd, file], { stdio: 'pipe' }); row.schema = 'valid'; } catch (e) { row.schema = 'INVALID: ' + String(e.stderr).split('\n')[0]; } }
  if (cp) {
    const out = execFileSync('java', ['-Dstdout.encoding=UTF-8', '-cp', cp, 'ReadMspdi', file], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    const back = JSON.parse(out.trim().split('\n').pop()), byId = new Map(back.tasks.map(t => [t.text1, t])), uidToId = new Map(back.tasks.map(t => [t.uid, t.text1]));
    const miss = (m) => row.mismatches.push(m);
    if (back.tasks.length !== canon.tasks.length) miss(`task count ${back.tasks.length} ≠ ${canon.tasks.length}`);
    for (const t of canon.tasks) {
      const b = byId.get(t.id); if (!b) { miss('missing task ' + t.id); continue; }
      const ms = X.isMilestone(t), days = Math.round((Date.parse(t.endDate) - Date.parse(t.startDate)) / DAY) + 1;
      if (b.name !== t.title) miss(`${t.id} name`);
      if (b.start !== t.startDate + 'T08:00') miss(`${t.id} start ${b.start}`);
      if (b.finish !== (ms ? t.startDate + 'T08:00' : t.endDate + 'T17:00')) miss(`${t.id} finish ${b.finish}`);
      if (b.duration !== (ms ? '0.0d' : days.toFixed(1) + 'd')) miss(`${t.id} duration ${b.duration}`);
      if (b.milestone !== ms) miss(`${t.id} milestone ${b.milestone}`);
      if (b.wbs !== t.wbs) miss(`${t.id} wbs ${b.wbs}`);
      if (b.constraint !== 'START_NO_EARLIER_THAN' || b.constraintDate !== t.startDate + 'T08:00') miss(`${t.id} anchor ${b.constraint} ${b.constraintDate}`);
      if (b.percent !== '0' || b.actualStart !== null) miss(`${t.id} progress invented`);
      if (b.text3 !== (canon.review.status === 'reviewed' ? 'plan-approved' : 'plan-estimated')) miss(`${t.id} evidence ${b.text3}`);
      const got = b.preds.map(p => `${uidToId.get(p.from)}|${p.type}|${p.lag}`).sort(), want = t.dependsOn.map(d => `${d.taskId}|${d.type}|${d.lagDays.toFixed(1)}d`).sort();
      if (JSON.stringify(got) !== JSON.stringify(want)) miss(`${t.id} links ${got} ≠ ${want}`);
    }
    row.readback = row.mismatches.length ? 'MISMATCH' : 'identical';
  }
  report.plans.push(row); console.log(JSON.stringify(row));
}
report.ok = report.plans.every(p => (!nsXsd || p.schema === 'valid') && (!cp || p.readback === 'identical'));
fs.writeFileSync(path.join(dest, 'verify-report.json'), JSON.stringify(report, null, 1) + '\n');
console.log('ok=' + report.ok);
process.exitCode = report.ok ? 0 : 1;
