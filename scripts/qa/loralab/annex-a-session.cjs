// Guided evidence session for annex A of docs/technical/loralab-study-gate-2026-10-17.md.
// Runs on the operator's own PC. It opens LoRA LAB in an isolated Chrome context and records video, a trace,
// console errors and the exported JSON. It does NOT click inside the 3D canvas or guess selectors: the operator
// performs each step in the window while it records, then classifies the result in this terminal.
// Usage (repo root, PowerShell): $env:CHROME="C:\...\chrome.exe"; node scripts/qa/loralab/annex-a-session.cjs [outDir]
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto'), readline = require('node:readline');
const {chromium} = require('playwright');

const URL0 = process.env.LORA_URL || 'https://fun.loralab.top/tool/c9ae6fe7-55ca-4fde-bae4-f8484c49bfc6?lang=zh-CN';
const VIEWPORT = {width: 1440, height: 900};
const RESULTS = {'1': 'ejecutado y funciona', '2': 'ejecutado y falla', '3': 'solo control visible', '4': 'no comprobado'};
const STEPS = [
 {id: 'A', title: 'Exportar el JSON de «Villa moderna»', ask: 'Abre la plantilla Villa moderna y usa su exportación JSON. La descarga se guarda sola como villa-original.json.', wantsDownload: true},
 {id: 'B', title: 'Proyecto de prueba con una segunda planta', ask: 'Crea un proyecto nuevo, sin datos reales, y añade una segunda planta. Captura antes y después (tecla s). Anota cómo se fijan altura, escala y alineación.'},
 {id: 'C', title: 'Escalera entre ambas plantas', ask: 'Coloca una escalera entre las dos plantas. Captura la planta baja, la alta y el 3D (tecla s en cada una). Anota si aparece hueco en la planta superior.'},
 {id: 'D', title: 'Subir la escalera en el recorrido libre', ask: 'Entra en el recorrido libre e intenta subir esa escalera caminando. Anota el nivel de inicio y el de final, aunque falle.'},
 {id: 'E1', title: 'Guardar y recargar', ask: 'Haz un cambio, guarda si existe esa opción y recarga con F5. Anota si el cambio persiste.'},
 {id: 'E2', title: 'Importar el JSON exportado', ask: 'Importa villa-original.json desde la carpeta de salida. Anota si se recupera igual.'},
 {id: 'E3', title: 'Editar exterior', ask: 'Cambia el material de fachada o de cubierta, o añade un elemento exterior.'},
 {id: 'E4', title: 'Día y noche, norte y latitud', ask: 'Cambia la hora a noche y, si existen, el norte y la latitud. Anota si la sombra cambia de dirección.'},
 {id: 'E5', title: 'Altura de ojos 1,70 y 1,05 m', ask: 'En el recorrido, cambia la altura de ojos.'},
 {id: 'E6', title: 'Puertas, ventanas, cortinas y luces', ask: 'En el recorrido, prueba E sobre una puerta, una ventana y una cortina, y L para las luces. Anota qué responde.'},
];

const out = path.resolve(process.argv[2] || `loralab-evidence-${new Date().toISOString().replace(/[:.]/g, '-')}`);
fs.mkdirSync(out, {recursive: true});
const sha = b => crypto.createHash('sha256').update(b).digest('hex');
// Line queue instead of rl.question: piped or fast input is not lost, and end of input stops the session cleanly.
const rl = readline.createInterface({input: process.stdin}), lines = [], waiting = [];
let ended = false;
rl.on('line', l => waiting.length ? waiting.shift()(l) : lines.push(l));
rl.on('close', () => { ended = true; while (waiting.length) waiting.shift()(null); });
const ask = q => { process.stdout.write(q); return lines.length ? Promise.resolve(lines.shift()) : ended ? Promise.resolve(null) : new Promise(r => waiting.push(r)); };

(async () => {
 const browser = await chromium.launch({headless: process.env.HEADLESS === '1', ...(process.env.CHROME ? {executablePath: process.env.CHROME} : {channel: 'chrome'})});
 const context = await browser.newContext({viewport: VIEWPORT, acceptDownloads: true, recordVideo: {dir: out, size: VIEWPORT}});
 await context.tracing.start({screenshots: true, snapshots: true});
 const page = await context.newPage(), t0 = Date.now(), at = () => +((Date.now() - t0) / 1000).toFixed(1);
 const log = {consoleErrors: [], pageErrors: [], navigation: null}, shots = [], results = [], downloads = [];
 page.on('console', m => { if (m.type() === 'error') log.consoleErrors.push({atSec: at(), text: m.text().slice(0, 500)}); });
 page.on('pageerror', e => log.pageErrors.push({atSec: at(), text: String(e.message).slice(0, 500)}));
 page.on('download', async d => {
  const name = downloads.length ? `download-${downloads.length + 1}-${d.suggestedFilename().replace(/[^\w.-]/g, '_')}` : 'villa-original.json';
  const file = path.join(out, name); await d.saveAs(file); const bytes = fs.readFileSync(file);
  downloads.push({file: name, suggestedFilename: d.suggestedFilename(), bytes: bytes.length, sha256: sha(bytes), atSec: at()});
  console.log(`\n  Descarga guardada: ${name} (${bytes.length} bytes, sha256 ${sha(bytes)})`);
 });
 let n = 0;
 const shot = async label => { const file = `${String(++n).padStart(2, '0')}-${label}.png`; await page.screenshot({path: path.join(out, file)}); shots.push({file, atSec: at(), url: page.url()}); console.log(`  Captura ${file}`); return file; };
 try {
  const response = await page.goto(URL0, {waitUntil: 'domcontentloaded', timeout: 60000});
  log.navigation = {status: response?.status() ?? null, finalUrl: page.url()};
 } catch (e) { log.navigation = {error: e.message.split('\n')[0]}; console.error('No se pudo abrir la URL: ' + log.navigation.error); }
 await shot('inicio');
 if (!log.navigation.error) for (const step of STEPS) {
  console.log(`\n[${step.id}] ${step.title}\n  ${step.ask}\n  Enter: captura y resultado · s: captura adicional · x: saltar el paso`);
  const startSec = at(), stepShots = [];
  for (;;) {
   const raw = await ask('  > ');
   if (raw === null) { results.push({id: step.id, title: step.title, result: RESULTS['4'], startSec, endSec: at(), shots: stepShots, note: 'sesión terminada antes de este paso'}); break; }
   const key = raw.trim().toLowerCase();
   if (key === 's') { stepShots.push(await shot(`${step.id}-extra`)); continue; }
   if (key === 'x') { results.push({id: step.id, title: step.title, result: RESULTS['4'], startSec, endSec: at(), shots: stepShots, note: 'paso saltado'}); break; }
   if (step.wantsDownload && !downloads.length && String(await ask('  Aún no hay descarga. ¿Seguir sin ella? (s/n) ')).trim().toLowerCase() !== 's') continue;
   stepShots.push(await shot(`${step.id}-resultado`));
   let r; do { r = await ask('  Resultado 1 funciona · 2 falla · 3 solo control visible · 4 no comprobado: '); r = r === null ? '4' : r.trim(); } while (!RESULTS[r]);
   const note = String(await ask('  Nota breve (altura, escala, nivel inicial y final...): ') ?? '').trim();
   results.push({id: step.id, title: step.title, result: RESULTS[r], startSec, endSec: at(), shots: stepShots, note});
   break;
  }
 }
 const browserVersion = browser.version(), finalUrl = page.url(), video = page.video();
 await context.tracing.stop({path: path.join(out, 'trace.zip')});
 await context.close();
 const videoFile = video ? path.basename(await video.path()) : null;
 if (videoFile) fs.renameSync(path.join(out, videoFile), path.join(out, 'session.webm'));
 // Check that the video plays (file URL; videos can be large) and that screenshots are not blank (data URL, so the
 // canvas is not tainted by a file:// origin), with the same browser and no extra dependencies.
 const checkFile = path.join(out, '_check.html'); fs.writeFileSync(checkFile, '<!doctype html><title>check</title>');
 const check = await browser.newPage(); await check.goto(require('node:url').pathToFileURL(checkFile).href, {waitUntil: 'load'});
 const playable = await check.evaluate(async src => new Promise(res => { const v = document.createElement('video'); v.muted = true; v.onloadedmetadata = () => res({ok: true, readyState: v.readyState}); v.onerror = () => res({ok: false}); v.src = src; setTimeout(() => res({ok: false, timeout: true}), 15000); }), 'session.webm').catch(e => ({ok: false, error: e.message}));
 for (const s of shots) s.std = await check.evaluate(async src => new Promise(res => { const i = new Image(); i.onload = () => { const c = document.createElement('canvas'); c.width = 160; c.height = 100; const g = c.getContext('2d'); g.drawImage(i, 0, 0, 160, 100); const d = g.getImageData(0, 0, 160, 100).data; let m = 0, q = 0; for (let k = 0; k < d.length; k += 4) { const y = (d[k] + d[k + 1] + d[k + 2]) / 3; m += y; q += y * y; } const N = d.length / 4; res(+Math.sqrt(q / N - (m / N) ** 2).toFixed(1)); }; i.src = src; }), 'data:image/png;base64,' + fs.readFileSync(path.join(out, s.file)).toString('base64'));
 fs.rmSync(checkFile); await browser.close(); rl.close();
 const file = f => { const b = fs.readFileSync(path.join(out, f)); return {file: f, bytes: b.length, sha256: sha(b)}; };
 const manifest = {
  createdAt: new Date(t0).toISOString(), url: URL0, finalUrl, navigation: log.navigation, browser: browserVersion, viewport: VIEWPORT,
  os: `${process.platform} ${require('node:os').release()}`, video: {...file('session.webm'), playable}, trace: file('trace.zip'),
  downloads, screenshots: shots.map(s => ({...s, ...file(s.file), blank: s.std < 2})), results,
  consoleErrors: log.consoleErrors, pageErrors: log.pageErrors,
 };
 fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(manifest, null, 1));
 const mmss = s => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, '0')}`;
 fs.writeFileSync(path.join(out, 'report.md'), [
  `# Prueba LoRA LAB, anexo A — ${manifest.createdAt}`, '',
  `Navegador ${browserVersion}, ${VIEWPORT.width}×${VIEWPORT.height}, ${manifest.os}. URL final: ${finalUrl}.`,
  log.navigation.error ? `**No se pudo abrir la herramienta:** \`${log.navigation.error}\`. Ninguna prueba se ejecutó.` : `Navegación: HTTP ${log.navigation.status ?? "sin respuesta"}.`,
  `Vídeo \`session.webm\` (${manifest.video.bytes} bytes, reproducible: ${playable.ok ? 'sí' : 'no'}). Errores de consola: ${log.consoleErrors.length}; pageerror: ${log.pageErrors.length}.`,
  downloads.length ? `JSON: \`${downloads[0].file}\`, ${downloads[0].bytes} bytes, SHA-256 \`${downloads[0].sha256}\`.` : 'JSON: no se descargó.', '',
  '| Prueba | Resultado | Vídeo | Capturas | Nota |', '| --- | --- | --- | --- | --- |',
  ...results.map(r => `| ${r.id} ${r.title} | ${r.result} | ${mmss(r.startSec)}–${mmss(r.endSec)} | ${r.shots.join(', ') || '—'} | ${r.note.replace(/\|/g, '/') || '—'} |`),
  '', `Capturas en blanco o casi uniformes: ${manifest.screenshots.filter(s => s.blank).map(s => s.file).join(', ') || 'ninguna'}.`, '',
 ].join('\n'));
 console.log(`\nEvidencia en ${out}: session.webm, trace.zip, capturas, manifest.json y report.md.`);
})().catch(e => { console.error(e); process.exitCode = 1; });
