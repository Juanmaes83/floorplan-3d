'use strict';
/* BP-DP · candidata de producto (Blueprint 3D y Despiece 3D) sobre RUBIK master.
 * Demos de la Home, conexión con Entregar (tarjeta → experiencia → salida → retorno exacto al origen), descargas reales
 * validadas con ffprobe/ffmpeg, vigencia con el proyecto abierto, firma con el almacén de marca de RUBIK, ausencia de
 * solapes de texto y coste/liberación del contexto WebGL. Chromium (SwiftShader en CI; la GPU física se registra aparte).
 * Evidencias en $BPDP_EVIDENCE (por defecto, un directorio temporal). */
const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { createServer } = require('node:http');
const fs = require('node:fs'), fsp = require('node:fs/promises'), os = require('node:os'), path = require('node:path'), crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const { chromium } = require('playwright');
const root = path.resolve(__dirname, '..');
const OUT = process.env.BPDP_EVIDENCE || fs.mkdtempSync(path.join(os.tmpdir(), 'bpdp-')); fs.mkdirSync(OUT, { recursive: true });
const TYPES = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.html': 'text/html', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.svg': 'image/svg+xml', '.wasm': 'application/wasm', '.glb': 'model/gltf-binary', '.bin': 'application/octet-stream' };
let server, browser, url; const metrics = {};
const LOG = []; const note = (k, v) => { metrics[k] = v; };

before(async () => {
  server = createServer(async (req, res) => { try {
    let p = new URL(req.url, 'http://local').pathname; if (p.endsWith('/')) p += 'index.html';
    const file = path.resolve(root, '.' + p); if (!file.startsWith(root + path.sep)) throw Error('path');
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream'); res.end(await fsp.readFile(file));
  } catch { res.statusCode = 404; res.end(); } });
  await new Promise(r => server.listen(0, '127.0.0.1', r)); url = `http://127.0.0.1:${server.address().port}/`;
  browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--js-flags=--expose-gc'] });
});
after(async () => { await browser?.close(); await new Promise(r => server?.close(r)); fs.writeFileSync(path.join(OUT, 'bpdp-candidate-metrics.json'), JSON.stringify({ date: new Date().toISOString(), browser: browser?.version?.() || 'chromium', gpu: 'SwiftShader (no hay GPU física en este entorno)', firefox: 'NOT_RUN (no instalado)', webkit: 'NOT_RUN (no instalado)', metrics }, null, 1)); });

// Guardia de solapes (la misma regla que la suite del laboratorio): ninguna línea de texto visible pisa a otra.
const overlaps = page => page.evaluate(() => {
  const vis = el => el.checkVisibility ? el.checkVisibility({ opacityProperty: true, visibilityProperty: true }) : true, out = [];
  const host = document.querySelector('dialog.bpdp-host[open]') || document.getElementById('app') || document.body, modal = host.querySelector('.modal'), rootEl = modal || host;
  const w = document.createTreeWalker(rootEl, NodeFilter.SHOW_TEXT, { acceptNode: n => n.nodeValue.trim() ? 1 : 2 });
  for (let n; (n = w.nextNode());) { const el = n.parentElement; if (!el || !vis(el) || el.closest('option,select,script,style,[aria-hidden="true"]')) continue;
    let clip = { l: 0, t: 0, r: innerWidth, b: innerHeight }; for (let p = el; p && p !== document.body; p = p.parentElement) { const cs = getComputedStyle(p); if (/(auto|scroll|hidden|clip)/.test(cs.overflowX + cs.overflowY)) { const q = p.getBoundingClientRect(); clip = { l: Math.max(clip.l, q.left), t: Math.max(clip.t, q.top), r: Math.min(clip.r, q.right), b: Math.min(clip.b, q.bottom) }; } }
    const range = document.createRange(); range.selectNodeContents(n);
    for (const r0 of range.getClientRects()) { const l = Math.max(r0.left, clip.l), t = Math.max(r0.top, clip.t), wd = Math.min(r0.right, clip.r) - l, ht = Math.min(r0.bottom, clip.b) - t; if (wd > 1 && ht > 1) out.push({ text: n.nodeValue.trim().slice(0, 30), x: l, y: t, w: wd, h: ht, el }); } }
  for (const b of (window.BPDP?.app?.heroBoxes || [])) out.push({ ...b, text: 'HERO:' + b.text, el: null });
  const hits = []; for (let i = 0; i < out.length; i++) for (let j = i + 1; j < out.length; j++) { const a = out[i], b = out[j]; if (a.el && a.el === b.el) continue;
    const ix = Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x), iy = Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y); if (ix > 2 && iy > 2 && ix * iy > 12) hits.push(`${a.text} × ${b.text}`); }
  return hits; });
const frames = (page, n = 3) => page.evaluate(k => new Promise(r => { let i = 0; const f = () => (++i >= k ? r() : requestAnimationFrame(f)); requestAnimationFrame(f); }), n);
const sha256 = f => crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex');
function ffprobe(file) {
  const j = JSON.parse(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'stream=codec_name,width,height,r_frame_rate,nb_frames:format=duration,format_name', '-of', 'json', file]).toString());
  let decodeOk = true; try { execFileSync('ffmpeg', ['-v', 'error', '-i', file, '-f', 'null', '-'], { stdio: ['ignore', 'ignore', 'pipe'] }); } catch { decodeOk = false; }
  return { ...j.streams[0], duration: +j.format.duration, container: j.format.format_name, decodeOk };
}

// ── DEMOS DE LA HOME ──
for (const vp of [{ width: 1440, height: 900, tag: 'desktop' }, { width: 390, height: 844, tag: 'mobile', isMobile: true, hasTouch: true }]) {
  test(`demo Blueprint · vista representativa y acción comprobada · ${vp.tag}`, { timeout: 300000 }, async t => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch, reducedMotion: 'reduce' }); t.after(() => ctx.close());
    const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(240000);
    await page.goto(url + 'bpdp/?demo=blueprint'); await page.waitForFunction(() => !!(window.BPDP?.app && document.getElementById('bpdpDemoAction'))); await frames(page, 4);
    const s = await page.evaluate(() => ({ view: BPDP.app.state.view, intent: BPDP.app.state.intent, ann: BPDP.app.state.annotations, ortho: !!BPDP.studio.camera.isOrthographicCamera, tag: document.querySelector('.demo-tag').innerText, scenario: BPDP.scenario, home: document.getElementById('bpdpDemoHome').href }));
    assert.equal(s.view, 'plan'); assert.equal(s.intent, 'measure'); assert.ok(s.ortho && s.ann > 0, 'planta ortográfica con cotas'); assert.match(s.tag, /vivienda de ejemplo/); assert.equal(s.scenario, 'rubik-real'); assert.equal(s.home, url);
    await page.screenshot({ path: path.join(OUT, `demo-blueprint-${vp.tag}.png`) });
    assert.deepEqual(await overlaps(page), [], 'sin solapes de texto');
    await (vp.hasTouch ? page.tap('#bpdpDemoAction') : page.click('#bpdpDemoAction')); await page.waitForTimeout(1500);
    const f = await page.evaluate(() => BPDP.app.state); assert.equal(f.intent, 'present'); assert.ok(f.film && f.film.t > 0, 'la presentación se reproduce');
    // Secciones y alzados del mismo proyecto.
    await page.evaluate(() => { BPDP.app.setIntent('clean'); BPDP.app.setView('section'); }); await frames(page, 3); assert.equal(await page.evaluate(() => BPDP.studio.state.poche), true);
    await page.evaluate(() => BPDP.app.setView('elev')); await frames(page, 2);
    // Volver desde el primer paso: a la Home de RUBIK.
    await page.evaluate(() => BPDP.app.setIntent('clean')); await page.keyboard.press('Escape'); await page.waitForURL(url, { timeout: 60000 });
    assert.deepEqual(errors, []);
  });
  test(`demo Despiece · escena sintética identificada, separar y montar · ${vp.tag}`, { timeout: 300000 }, async t => {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, isMobile: !!vp.isMobile, hasTouch: !!vp.hasTouch }); t.after(() => ctx.close());
    const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(240000);
    await page.goto(url + 'bpdp/?demo=despiece'); await page.waitForFunction(() => !!(window.BPDP?.app && document.getElementById('bpdpDemoAction'))); await frames(page, 4);
    const s = await page.evaluate(() => ({ A: BPDP.app.state.A, tag: document.querySelector('.demo-tag').innerText, badge: document.querySelector('.top .badge').innerText, scenario: BPDP.scenario }));
    assert.equal(s.A, 1); assert.match(s.tag, /SINTÉTICA/); assert.match(s.badge, /SINTÉTICA/); assert.equal(s.scenario, 'synthetic');
    await page.screenshot({ path: path.join(OUT, `demo-despiece-${vp.tag}.png`) }); assert.deepEqual(await overlaps(page), []);
    const sig0 = await page.evaluate(() => JSON.stringify(BPDP.studio.transformSignature()));
    await (vp.hasTouch ? page.tap('#bpdpDemoAction') : page.click('#bpdpDemoAction'));
    await page.waitForFunction(() => BPDP.app.state.A === 0, null, { timeout: 120000 }); await page.screenshot({ path: path.join(OUT, `demo-despiece-separada-${vp.tag}.png`) });
    await page.waitForFunction(() => BPDP.app.state.A === 1 && !BPDP.app.state.playing, null, { timeout: 120000 });
    assert.equal(await page.evaluate(() => JSON.stringify(BPDP.studio.transformSignature())), sig0, 'vuelve EXACTAMENTE al montaje');
    await page.click('#bpdpDemoScene'); await page.waitForFunction(() => window.BPDP?.scenario === 'rubik-real' && document.getElementById('bpdpDemoAction'));
    assert.match(await page.evaluate(() => document.querySelector('.demo-tag').innerText), /vivienda de ejemplo/);
    assert.deepEqual(errors, []);
  });
}

// ── ENTREGAR ──
async function entregar(page, flag = 'blueprint,despiece') {
  await page.goto(url + '?bpdp=' + flag); await page.waitForFunction(() => window.FloorPlanApp && document.getElementById('welcomeExample') && window.BpdpEntregar);
  await page.evaluate(() => document.getElementById('welcomeExample').click()); await page.waitForFunction(() => !document.querySelector('#welcomeDialog[open]'));
  await page.evaluate(() => document.querySelector('button[data-view="3d"]').click());
  await page.waitForFunction(() => { const m = View3D.lifecycleMetrics; return document.getElementById('stage')?.classList.contains('is3d') && m && !m.animating && !m.flying && !m.pendingAssets; }, null, { timeout: 240000 });
  await page.evaluate(() => FloorPlanProfessionalUI.open('deliver')); await page.waitForSelector('#professionalWorkspace [data-group="experience"]');
}
const projectHash = page => page.evaluate(async () => { const s = v => Array.isArray(v) ? v.map(s) : v && typeof v === 'object' ? Object.fromEntries(Object.keys(v).sort().map(k => [k, s(v[k])])) : v;
  return [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(JSON.stringify(s(FloorPlanApp.project)))))].map(b => b.toString(16).padStart(2, '0')).join(''); });
// Mismo origen: área, foco, desplazamiento y diálogo idénticos; posición en pantalla del control con ±1 px (redondeo subpíxel).
const mismoOrigen = (a, b, msg) => { const { top: ta, ...ra } = a, { top: tb, ...rb } = b; assert.deepEqual(ra, rb, msg); assert.ok(Math.abs(ta - tb) <= 1, `${msg}: posición ${tb} → ${ta}`); };
const origin = page => page.evaluate(() => { const ws = document.getElementById('professionalWorkspace'); const sc = [...ws.querySelectorAll('*')].filter(n => n.scrollHeight > n.clientHeight + 1).map(n => n.scrollTop);
  return { area: FloorPlanProfessionalUI.area, focus: document.activeElement?.id, top: Math.round(document.activeElement?.getBoundingClientRect().top ?? -1), scroll: [document.scrollingElement.scrollTop, ws.scrollTop, ...sc], open: !!document.querySelector('dialog.bpdp-host') }; });

test('Entregar · ambos visores en la ruta normal y diagnóstico por módulo', { timeout: 300000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); t.after(() => ctx.close()); const page = await ctx.newPage(); page.setDefaultTimeout(240000);
  await page.goto(url); await page.waitForFunction(() => window.BpdpEntregar && window.FloorPlanApp); await page.evaluate(() => FloorPlanProfessionalUI.open('deliver')); await page.waitForSelector('#professionalWorkspace [data-group="experience"]');
  await page.waitForFunction(() => document.querySelectorAll('.bpdp-card').length === 2);
  await entregar(page, 'despiece'); assert.equal(await page.locator('#bpdpCard-despiece').count(), 1); assert.equal(await page.locator('#bpdpCard-blueprint').count(), 0, 'cada módulo se activa por separado');
});

for (const mod of ['blueprint', 'despiece']) {
  test(`Entregar · ${mod}: tarjeta → lámina real → retorno exacto a la tarjeta; Escape por pasos; proyecto intacto`, { timeout: 900000 }, async t => {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' }); t.after(() => ctx.close());
    const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(600000);
    await entregar(page); const card = page.locator(`#bpdpCard-${mod}`); await card.scrollIntoViewIfNeeded();
    const state = await card.locator('.professional-state').innerText(); assert.match(state, /Lámina PNG A3/); assert.match(state, /Vídeo MP4/); assert.match(state, /Firma:/);
    await page.screenshot({ path: path.join(OUT, `entregar-tarjeta-${mod}.png`) });
    const h0 = await projectHash(page); await page.focus(`#bpdpSheet-${mod}`); const o0 = await origin(page);
    // Previsualizar lámina → descarga real → cerrar → vuelve a la tarjeta y al paso de origen.
    await page.click(`#bpdpSheet-${mod}`); await page.waitForSelector('dialog.bpdp-host .modal img'); await page.waitForFunction(() => document.querySelector('dialog.bpdp-host .modal')?.dataset.vigente === 'true');
    const meta = await page.evaluate(() => ({ sub: document.querySelector('dialog.bpdp-host .modal .sub').innerText, vig: document.querySelector('dialog.bpdp-host .modal .vigencia').innerText }));
    assert.match(meta.sub, /A3/); assert.match(meta.vig, /Vigente · revisión/);
    await page.screenshot({ path: path.join(OUT, `entregar-lamina-${mod}.png`) }); assert.deepEqual(await overlaps(page), []);
    const [dl] = await Promise.all([page.waitForEvent('download'), page.click('dialog.bpdp-host .modal [data-a="dl"]')]); const f = path.join(OUT, `entregar-lamina-${mod}.png`.replace('.png', '-descargada.png')); await dl.saveAs(f);
    const buf = fs.readFileSync(f); assert.equal(buf.slice(1, 4).toString(), 'PNG'); assert.equal(buf.readUInt32BE(16), 3307); assert.equal(buf.readUInt32BE(20), 2339);
    await page.click('dialog.bpdp-host .modal [data-a="close"]'); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host'));
    const o1 = await origin(page); mismoOrigen(o1, o0, 'retorno exacto: área, foco, desplazamiento');
    // Abrir la experiencia y salir con Escape: un paso atrás cada vez hasta volver a la tarjeta.
    await page.focus(`#bpdpOpen-${mod}`); const o2 = await origin(page); await page.click(`#bpdpOpen-${mod}`); await page.waitForFunction(() => !!window.BPDP?.studio);
    if (mod === 'blueprint') { await page.evaluate(() => BPDP.app.setIntent('measure')); await page.keyboard.press('Escape'); assert.equal(await page.evaluate(() => BPDP.app.state.intent), 'clean', 'Escape sale primero de la intención'); }
    await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host'));
    mismoOrigen(await origin(page), o2, 'Escape devuelve a la tarjeta de origen');
    assert.equal(await projectHash(page), h0, 'el proyecto no cambia'); assert.deepEqual(errors, []);
  });
}

test('Entregar · vídeo real con firma de «Mi estudio», reproducido y descargado (ffprobe) y cancelar vuelve a la tarjeta', { timeout: 1800000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' }); t.after(() => ctx.close());
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(1500000);
  await entregar(page);
  // Perfil real de «Mi estudio» en el almacén de marca de RUBIK y entrega del proyecto abierto (autorizada a mostrar la web).
  await page.evaluate(() => { const s = FloorPlanBrandUI.store, p = FloorPlanBrand.saveProfile(s, { name: 'Estudio Prueba BP-DP', tagline: 'Arquitectura clara', cta: 'Pide cita', web: 'https://estudio-prueba.es' });
    FloorPlanBrand.setDelivery(s, FloorPlanApp.entryId, { profileId: p.id, title: 'Vivienda de ejemplo', hero: { cliente: 'Cliente sin autorizar', clienteAutorizado: false, cierre: '', estilo: 'cine', incluirWeb: true } }); });
  // Cancelar durante la preparación del vídeo de Blueprint: vuelve a la tarjeta, sin salida.
  await page.focus('#bpdpVideo-blueprint'); const o0 = await origin(page);
  await page.click('#bpdpVideo-blueprint'); await page.waitForSelector('dialog.bpdp-host .modal [data-a="cancel"]'); await page.waitForTimeout(1500); await page.click('dialog.bpdp-host .modal [data-a="cancel"]');
  await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host')); { const o1 = await origin(page);
    // La firma cambió mientras Entregar estaba abierto: lo que se exige es volver a la MISMA tarjeta, en la misma posición de pantalla.
    assert.deepEqual({ area: o1.area, focus: o1.focus, open: o1.open }, { area: o0.area, focus: o0.focus, open: o0.open }, 'cancelar vuelve a la tarjeta');
    assert.ok(Math.abs(o1.top - o0.top) <= 1, `misma posición en pantalla (±1 px de redondeo subpíxel): ${o0.top} → ${o1.top}`); }
  // Vídeo completo de Despiece.
  await page.click('#bpdpVideo-despiece'); await page.waitForSelector('dialog.bpdp-host .modal video', { timeout: 1500000 });
  const r = await page.evaluate(async () => { const m = document.querySelector('dialog.bpdp-host .modal'), v = m.querySelector('video'); await new Promise(res => v.readyState >= 1 ? res() : (v.onloadedmetadata = res)); v.muted = true; await v.play(); await new Promise(res => setTimeout(res, 800)); v.pause();
    const played = [...new Uint8Array(await crypto.subtle.digest('SHA-256', await (await fetch(v.src)).arrayBuffer()))].map(x => x.toString(16).padStart(2, '0')).join('');
    return { played, playedTo: v.currentTime, duration: v.duration, meta: m.querySelector('.meta').innerText, vig: m.querySelector('.vigencia').innerText, firma: window.__bpdpLastVideo.firma, revision: window.__bpdpLastVideo.revision }; });
  assert.match(r.meta, /MP4/); assert.match(r.meta, /Estudio Prueba BP-DP/); assert.match(r.vig, /Vigente/); assert.ok(r.playedTo > 0);
  const fin = await page.evaluate(() => ({ estudio: BPDP.app.firma?.estudio, para: BPDP.app.firma?.para, web: BPDP.app.firma?.web }));
  assert.deepEqual(fin, { estudio: 'Estudio Prueba BP-DP', para: null, web: 'estudio-prueba.es' }, 'cliente sin autorización no aparece; web autorizada sí');
  await page.screenshot({ path: path.join(OUT, 'entregar-video-despiece.png') });
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click('dialog.bpdp-host .modal [data-a="dl"]')]); const file = path.join(OUT, 'entregar-video-despiece.mp4'); await dl.saveAs(file);
  const p = ffprobe(file); note('video-despiece', { ...p, sha256: sha256(file), playedSha: r.played, revision: r.revision, firma: r.firma });
  assert.equal(sha256(file), r.played, 'el archivo descargado es el reproducido'); assert.equal(p.codec_name, 'h264'); assert.equal(p.width, 1920); assert.equal(p.height, 1080); assert.equal(p.r_frame_rate, '30/1'); assert.ok(p.decodeOk);
  assert.ok(Math.abs(p.duration - r.duration) < .05);
  // Extraer el último fotograma (firma) para revisión.
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-sseof', '-0.3', '-i', file, '-frames:v', '1', '-q:v', '2', path.join(OUT, 'entregar-video-despiece-firma.jpg')]);
  await page.click('dialog.bpdp-host .modal [data-a="close"]'); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host'));
  assert.equal(await page.evaluate(() => document.activeElement?.id), 'bpdpVideo-despiece'); assert.deepEqual(errors, []);
});

test('Vigencia con el proyecto abierto: cambio de revisión, salida obsoleta bloqueada, vuelta a vigente', { timeout: 900000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true, reducedMotion: 'reduce' }); t.after(() => ctx.close());
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(600000);
  await entregar(page); const name0 = await page.evaluate(() => FloorPlanApp.project.name);
  await page.click('#bpdpOpen-blueprint'); await page.waitForFunction(() => !!window.BPDP?.studio);
  // El proyecto cambia en RUBIK mientras la experiencia está abierta.
  await page.evaluate(() => { FloorPlanApp.project.name = FloorPlanApp.project.name + ' · cambio'; });
  await page.evaluate(() => BPDP.app.makeSheet()); await page.waitForSelector('dialog.bpdp-host .modal img'); await page.waitForFunction(() => document.querySelector('dialog.bpdp-host .modal')?.dataset.vigente !== undefined);
  const v1 = await page.evaluate(() => ({ vig: document.querySelector('dialog.bpdp-host .modal').dataset.vigente, dl: document.querySelector('dialog.bpdp-host .modal [data-a="dl"]').disabled, text: document.querySelector('dialog.bpdp-host .modal .vigencia').innerText }));
  assert.equal(v1.vig, 'false'); assert.equal(v1.dl, true); assert.match(v1.text, /Obsoleta/);
  await page.screenshot({ path: path.join(OUT, 'vigencia-obsoleta.png') });
  let got = false; page.once('download', () => { got = true; }); await page.click('dialog.bpdp-host .modal [data-a="dl"]', { force: true }); await page.waitForTimeout(1200); assert.equal(got, false, 'no se descarga una salida obsoleta');
  await page.keyboard.press('Escape');
  // Preparar el vídeo con el paquete obsoleto: se rechaza.
  await page.evaluate(() => BPDP.app.makeVideo({ fresh: true })); await page.waitForFunction(() => /ha cambiado/.test(document.querySelector('dialog.bpdp-host .modal .status')?.innerText || ''));
  await page.keyboard.press('Escape');
  // El proyecto vuelve a su revisión: la lámina vuelve a ser vigente.
  await page.evaluate(n => { FloorPlanApp.project.name = n; }, name0);
  await page.evaluate(() => BPDP.app.makeSheet()); await page.waitForFunction(() => document.querySelector('dialog.bpdp-host .modal')?.dataset.vigente === 'true');
  await page.keyboard.press('Escape'); await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host'));
  assert.deepEqual(errors, []);
});

test('Firma con el almacén de marca de RUBIK: borrador, Escape, Aplicar y foco', { timeout: 600000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' }); t.after(() => ctx.close());
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(300000);
  await entregar(page);
  const pid = await page.evaluate(() => FloorPlanBrand.saveProfile(FloorPlanBrandUI.store, { name: 'Estudio Marca RUBIK', web: 'https://marca-rubik.es', cta: 'Hablemos' }).id);
  const d0 = await page.evaluate(() => JSON.stringify(FloorPlanBrand.delivery(FloorPlanBrandUI.store, FloorPlanApp.entryId)));
  await page.click('#bpdpOpen-despiece'); await page.waitForFunction(() => !!window.BPDP?.studio);
  await page.click('dialog.bpdp-host [data-a="firma"]'); await page.waitForSelector('dialog.bpdp-host .modal .firma-prev');
  assert.equal(await page.locator('dialog.bpdp-host .modal [data-a="ejemplo"]').count(), 0, 'en RUBIK no se ofrece la firma de ejemplo');
  await page.selectOption('dialog.bpdp-host .modal [data-f="perfil"]', pid); await page.fill('dialog.bpdp-host .modal [data-f="titulo"]', 'Borrador que no se guarda');
  for (let i = 0; i < 12; i++) { await page.keyboard.press('Shift+Tab'); assert.ok(await page.evaluate(() => document.querySelector('dialog.bpdp-host .modal').contains(document.activeElement))); }
  await page.keyboard.press('Escape');
  assert.equal(await page.evaluate(() => JSON.stringify(FloorPlanBrand.delivery(FloorPlanBrandUI.store, FloorPlanApp.entryId))), d0, 'Escape descarta el borrador');
  assert.equal(await page.evaluate(() => document.activeElement?.dataset?.a), 'firma');
  await page.click('dialog.bpdp-host [data-a="firma"]'); await page.selectOption('dialog.bpdp-host .modal [data-f="perfil"]', pid); await page.fill('dialog.bpdp-host .modal [data-f="titulo"]', 'Vivienda firmada');
  await page.fill('dialog.bpdp-host .modal [data-f="cliente"]', 'Cliente X'); await page.uncheck('dialog.bpdp-host .modal [data-f="autorizado"]'); await page.uncheck('dialog.bpdp-host .modal [data-f="web"]');
  await page.click('dialog.bpdp-host .modal [data-a="apply"]');
  const d1 = await page.evaluate(() => FloorPlanBrand.delivery(FloorPlanBrandUI.store, FloorPlanApp.entryId));
  assert.equal(d1.profileId, pid); assert.equal(d1.title, 'Vivienda firmada'); assert.equal(d1.hero.clienteAutorizado, false); assert.equal(d1.hero.incluirWeb, false);
  const f = await page.evaluate(() => ({ estudio: BPDP.app.firma.estudio, para: BPDP.app.firma.para, web: BPDP.app.firma.web, titulo: BPDP.app.firma.titulo, focus: document.activeElement?.dataset?.a }));
  assert.deepEqual(f, { estudio: 'Estudio Marca RUBIK', para: null, web: null, titulo: 'Vivienda firmada', focus: 'firma' });
  await page.keyboard.press('Escape'); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host')); assert.deepEqual(errors, []);
});

test('Recursos: coste del contexto WebGL adicional, fluidez y liberación (3 ciclos)', { timeout: 900000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } }); t.after(() => ctx.close());
  const page = await ctx.newPage(); page.setDefaultTimeout(300000); await entregar(page);
  // Montón JS medido con CDP tras forzar la recolección (performance.memory está cuantizado y no sirve para fugas).
  const cdp = await ctx.newCDPSession(page); await cdp.send('HeapProfiler.enable');
  const probe = async () => { for (let i = 0; i < 3; i++) await cdp.send('HeapProfiler.collectGarbage'); const u = await cdp.send('Runtime.getHeapUsage');
    const d = await page.evaluate(() => ({ canvases: document.querySelectorAll('canvas').length, bpdpCanvases: document.querySelectorAll('dialog.bpdp-host canvas.studio-canvas').length, rubikGeom: View3D.sceneGeometries ?? null }));
    return { heapMB: +(u.usedSize / 1048576).toFixed(1), ...d }; };
  const base = await probe(), cycles = [];
  for (let i = 0; i < 3; i++) for (const mod of ['blueprint', 'despiece']) {
    const t0 = Date.now(); await page.click(`#bpdpOpen-${mod}`); await page.waitForFunction(() => !!window.BPDP?.studio); const firstFrame = Date.now() - t0;
    const during = await probe();
    const fps = await page.evaluate(async m => { const S = BPDP.studio, n0 = S.stats().frames, t0 = performance.now();
      if (m === 'despiece') { BPDP.app.animateTo(0); await new Promise(r => { const f = () => BPDP.app.state.playing ? requestAnimationFrame(f) : r(); requestAnimationFrame(f); }); }
      else { BPDP.app.setIntent('present'); await new Promise(r => setTimeout(r, 3000)); BPDP.app.setIntent('clean'); }
      const ms = performance.now() - t0, n = S.stats().frames - n0, ft = S.stats().frameTimes.slice(-Math.max(1, n)).sort((a, b) => a - b);
      return { renders: n, fps: +(n / (ms / 1000)).toFixed(1), p50: ft[Math.floor(ft.length * .5)], p95: ft[Math.floor(ft.length * .95)], gl: S.stats().drawCalls }; }, mod);
    await page.evaluate(() => BPDP.close()); await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host'));
    const afterC = await probe(); cycles.push({ cycle: i + 1, mod, firstFrameMs: firstFrame, openedMs: null, during, fps, after: afterC });
  }
  const last = cycles[cycles.length - 1].after;
  note('recursos', { entorno: 'Chromium + SwiftShader (CPU)', base, cycles, heapDeltaMB: base.heapMB != null ? +(last.heapMB - base.heapMB).toFixed(1) : null });
  for (const c of cycles) { assert.equal(c.during.bpdpCanvases, 1, 'un único contexto WebGL adicional mientras está abierto'); assert.equal(c.after.canvases, base.canvases, 'al cerrar se libera el lienzo'); }
  assert.ok(last.heapMB - base.heapMB < 8, `memoria estable tras 6 aperturas (Δ ${(last.heapMB - base.heapMB).toFixed(1)} MB)`);
});

test('Catálogo de Entregar · preparar sin abrir el visor: láminas y vídeo reales, cancelar sin residuos, obsoleta rechazada', { timeout: 1800000 }, async t => {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, acceptDownloads: true }); t.after(() => ctx.close());
  const page = await ctx.newPage(), errors = []; page.on('pageerror', e => errors.push(e.message)); page.setDefaultTimeout(1500000);
  await entregar(page); await page.locator('#bpdpCard-despiece').scrollIntoViewIfNeeded(); await page.focus('#bpdpSheet-despiece');
  const o0 = await origin(page), h0 = await projectHash(page), c0 = await page.evaluate(() => document.querySelectorAll('canvas').length);
  // Las dos láminas por el catálogo.
  for (const mod of ['blueprint', 'despiece']) {
    const r = await page.evaluate(async m => { const s = await BpdpEntregar.preparar(m, 'lamina'); const u = new Uint8Array(await s.blob.arrayBuffer()); let b = ''; for (let i = 0; i < u.length; i += 32768) b += String.fromCharCode(...u.subarray(i, i + 32768));
      return { b64: btoa(b), formato: s.formato, revision: s.revision, vigente: s.vigente, sha256: s.sha256, nombre: s.nombre }; }, mod);
    const buf = Buffer.from(r.b64, 'base64'), f = path.join(OUT, `catalogo-${r.nombre}`); fs.writeFileSync(f, buf);
    let i = 8, phys = null; while (i < buf.length) { const len = buf.readUInt32BE(i), ty = buf.toString('ascii', i + 4, i + 8); if (ty === 'pHYs') phys = buf.readUInt32BE(i + 8); if (ty === 'IDAT') break; i += 12 + len; }
    assert.equal(r.revision, h0, 'revisión activa'); assert.equal(r.vigente, true); assert.match(r.formato, /A3 apaisado 420 × 297 mm/);
    assert.equal(sha256(f), r.sha256); assert.equal(phys, 7874, '200 ppp declarados'); assert.ok(Math.abs(buf.readUInt32BE(16) / phys * 1000 - 420) < .2);
    note(`catalogo-lamina-${mod}`, { sha256: r.sha256, revision: r.revision });
  }
  // Descarga real por el contrato (solo si sigue vigente).
  const [dl] = await Promise.all([page.waitForEvent('download'), page.evaluate(async () => { const s = await BpdpEntregar.preparar('blueprint', 'lamina'); window.__s = s; return BpdpEntregar.descargar(s); })]);
  const fdl = path.join(OUT, 'catalogo-descarga-' + dl.suggestedFilename()); await dl.saveAs(fdl); assert.equal(sha256(fdl), await page.evaluate(() => window.__s.sha256));
  // Cancelar un vídeo: rechaza con CANCELLED, sin anfitrión oculto ni lienzos de más, y sin salida registrada.
  const cancel = await page.evaluate(async () => { const ac = new AbortController(); setTimeout(() => ac.abort(), 1500);
    try { await BpdpEntregar.preparar('blueprint', 'video', { signal: ac.signal }); return 'no-cancelado'; } catch (e) { return e.code; } });
  assert.equal(cancel, 'CANCELLED'); assert.equal(await page.locator('.bpdp-host').count(), 0); assert.equal(await page.evaluate(() => document.querySelectorAll('canvas').length), c0);
  assert.equal(await page.evaluate(() => BpdpEntregar.estado('blueprint', 'video')), null, 'cancelar no deja salida');
  // Vídeo completo de Blueprint por el catálogo, validado fuera del navegador.
  const v = await page.evaluate(async () => { const s = await BpdpEntregar.preparar('blueprint', 'video', { onProgress: () => { } }); window.__v = s; const u = new Uint8Array(await s.blob.arrayBuffer()); let b = ''; for (let i = 0; i < u.length; i += 32768) b += String.fromCharCode(...u.subarray(i, i + 32768)); return { b64: btoa(b), sha256: s.sha256, firma: s.firma, revision: s.revision, nombre: s.nombre }; });
  const fv = path.join(OUT, 'catalogo-' + v.nombre); fs.writeFileSync(fv, Buffer.from(v.b64, 'base64')); const pv = ffprobe(fv);
  assert.equal(sha256(fv), v.sha256); assert.equal(pv.codec_name, 'h264'); assert.equal(pv.width, 1920); assert.ok(pv.decodeOk); assert.ok(Math.abs(pv.duration - 19.03) < .1);
  note('catalogo-video-blueprint', { ...pv, sha256: v.sha256, revision: v.revision, firma: v.firma });
  // El proyecto cambia: la salida guardada pasa a obsoleta y descargar() la rechaza.
  const stale = await page.evaluate(async () => { FloorPlanApp.project.name += ' · cambio'; const e = await BpdpEntregar.estado('blueprint', 'video'); let code = null; try { await BpdpEntregar.descargar(window.__v); } catch (x) { code = x.code; } FloorPlanApp.project.name = FloorPlanApp.project.name.replace(' · cambio', ''); return { vigente: e.vigente, code }; });
  assert.deepEqual(stale, { vigente: false, code: 'STALE' });
  // Entregar no se ha movido: mismo origen y mismo proyecto.
  mismoOrigen(await origin(page), o0, 'Entregar no se ha movido'); assert.equal(await projectHash(page), h0); assert.deepEqual(errors, []);
});
