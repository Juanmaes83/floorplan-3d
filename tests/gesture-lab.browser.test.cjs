'use strict';
// Gesture Labs §6 · «Presentación con gestos» (en ensayo) en la app real (?gesture-lab=1).
// Gestos SINTÉTICOS (RubikGestureCore.syntheticHand) inyectados por el gancho del laboratorio: reproducen el recorrido sin
// cámara física. La cámara se sustituye por una pista de canvas (permiso concedido) o por un rechazo NotAllowedError.
// Criterios del propietario (27/11): plano enrollado → desplegado y legible → 3D de la MISMA revisión reconociendo la estancia;
// funciona con UNA revisión; «antes y después» solo al elegirlo; presencia en Home y ficha propia en Entregar.
const test = require('node:test'), assert = require('node:assert/strict'), path = require('node:path'), fs = require('node:fs');
const K = require('./ux07/kit.cjs'), { accion } = require('./helpers-perla-entregar.cjs');
let env; test.before(async () => { env = await K.start({ authority: true }); }); test.after(async () => { await env?.stop(); });
const REC = process.env.GL_REC, SHOTS = process.env.GL_SHOTS;
const CJK = /[㐀-鿿]/;
async function boot(vp, camera, { variant = false, welcome = false } = {}) {
  const ctx = await env.browser.newContext({ viewport: { width: vp.width, height: vp.height }, ...(vp.touch ? { isMobile: true, hasTouch: true } : {}), ...(REC ? { recordVideo: { dir: REC, size: { width: vp.width, height: vp.height } } } : {}) });
  await ctx.addInitScript(cam => { window.__glNoModel = true; const md = navigator.mediaDevices || (navigator.mediaDevices = {});
    md.getUserMedia = async () => { if (cam === 'denied') { const e = new Error('Permission denied'); e.name = 'NotAllowedError'; throw e; } const c = document.createElement('canvas'); c.width = 64; c.height = 48; c.getContext('2d').fillRect(0, 0, 64, 48); const s = c.captureStream(5); window.__glTracks = s.getTracks(); return s; }; }, camera);
  const page = await ctx.newPage(); const errors = []; page.on('pageerror', e => errors.push(e.message));
  await page.goto(env.base + '?gesture-lab=1'); await page.waitForFunction(() => document.documentElement.dataset.editorReady === 'true' && !!window.RubikGestureLab);
  if (!welcome && await page.locator('#welcomeDialog').evaluate(d => d.open).catch(() => false)) await page.keyboard.press('Escape');
  if (variant) {
    await page.evaluate(async () => { await FloorPlanApp.createVariant(); });
    const n0 = await page.evaluate(() => FloorPlanApp.project.objects.length);
    await page.evaluate(() => { const f = FloorPlanApp.project.objects[0]; select({ kind: 'furn', id: f.id }); deleteSel(); });
    await page.waitForFunction(n => FloorPlanApp.project.objects.length === n - 1, n0); await page.evaluate(() => FloorPlanApp.persistence.requireSaved());
    await page.waitForFunction(() => (FloorPlanApp.storyTargets().pairs || []).length > 0);
  }
  return { ctx, page, errors };
}
const pause = (p, ms = 900) => REC ? p.waitForTimeout(ms) : null;
// Fotogramas sintéticos con RELOJ VIRTUAL (33 ms por fotograma, como una cámara a 30 fps): el resultado no depende de la
// carga de la máquina. El detector solo usa el tiempo que recibe; sus umbrales no cambian.
const hold = async (page, kind, ms, x = 0.5, dx = 0) => page.evaluate(async ([k, ms, x, dx]) => { const t0 = Math.max(performance.now(), (window.__glT || 0) + 33), n = Math.max(1, Math.round(ms / 33)); for (let i = 0; i < n; i++) { RubikGestureLab.feed(RubikGestureLab.synthetic(k, x + dx * i, 0.5), window.__glT = t0 + i * 33); if (i % 6 === 5) await new Promise(r => setTimeout(r, 0)); } }, [kind, ms, x, dx]);
const save = async (ctx, page, name) => { const v = REC && page.video(); await ctx.close(); if (v) fs.renameSync(await v.path(), path.join(REC, name)); };
const shot = (page, n) => SHOTS ? page.screenshot({ path: path.join(SHOTS, n) }) : null;

for (const vp of [{ width: 1440, height: 900, tag: 'escritorio' }, { width: 390, height: 844, tag: 'movil', touch: true }]) {
  test('una revisión · Entregar → P11 → plano enrollado → desplegado → 3D de la misma vivienda → salida · ' + vp.tag, { timeout: 240000 }, async () => {
    const { ctx, page, errors } = await boot(vp, 'granted');
    const hit = l => vp.touch ? l.tap() : l.click();
    const entry0 = await page.evaluate(() => FloorPlanApp.entryId);
    // Qué encuentra el profesional: ficha propia en Entregar, con estado «en ensayo», requisitos y qué verá el cliente.
    await hit(page.locator('#workArea-deliver')); await page.waitForSelector('#professionalWorkspace [data-entrega-code="P11"]', { state: 'attached' });
    const card = page.locator('#professionalWorkspace [data-entrega-code="P11"]'); await card.scrollIntoViewIfNeeded(); await pause(page, 1500);
    assert.match(await card.innerText(), /Presentación con gestos/); await shot(page, `gl-entregar-p11-${vp.tag}.png`);
    await hit(await accion(page, '#professionalWorkspace [data-route="gesture-presentation"]')); await page.waitForSelector('#gestureLab[open]'); await pause(page, 1600);
    assert.equal(await page.evaluate(() => RubikGestureLab.origin), 'P11');
    const intro = await page.locator('#glIntro').innerText();
    assert.match(intro, /Proyecto: «/); assert.match(intro, /Revisión que verá tu cliente: «.+»/); assert.match(intro, /«Antes y después»: opcional; necesita una variante/);
    assert.match(intro, /Con botones: sin requisitos/); assert.match(intro, /Con cámara \(opcional\): permiso de cámara, HTTPS/);
    await shot(page, `gl-0-inicio-${vp.tag}.png`);
    await hit(page.locator('#glStartCam')); await page.waitForFunction(() => RubikGestureLab.camera.state === 'on'); assert.deepEqual(await page.evaluate(() => RubikGestureLab.camera.tracks), ['live']);
    // 1 · plano enrollado; el gesto de este paso se enseña aquí.
    assert.equal(await page.evaluate(() => RubikGestureLab.step), 'rolled'); assert.equal(await page.locator('#glRoll').getAttribute('data-state'), 'rolled');
    assert.match(await page.locator('#glTeach').innerText(), /Gesto para desplegar: mano abierta/); assert.equal(await page.locator('#glNext').innerText(), 'Desplegar el plano');
    await pause(page, 1500); await shot(page, `gl-1-enrollado-${vp.tag}.png`);
    // Gesto 1: mano abierta sostenida → se despliega y se puede leer (estancia resaltada).
    await hold(page, 'open', 1200); await page.waitForFunction(() => RubikGestureLab.step === 'plan'); await page.waitForFunction(() => document.querySelector('#glRoll')?.dataset.state === 'open');
    assert.match(await page.locator('#glAck').innerText(), /✓ Gesto detectado: mano abierta → plano desplegado/);
    const room = await page.evaluate(() => RubikGestureLab.room); assert.ok(room, 'estancia identificada');
    assert.match(await page.locator('#glKind').innerText(), new RegExp('Plano desplegado · revisión «.+».* · estancia resaltada: ' + room));
    assert.ok(await page.locator('#glStage .gl-mark').count() >= 1, 'la estancia está marcada en planta');
    await pause(page, 2600); await shot(page, `gl-2-desplegado-${vp.tag}.png`);
    // Gesto intencional → 3D de ESA misma revisión, en la estancia vista en planta (miniatura que la marca).
    await hold(page, 'fist', 200); await hold(page, 'open', 1200);  await page.waitForFunction(() => RubikGestureLab.step === '3d'); await page.waitForFunction(() => FloorPlanApp.viewMode === '3d', null, { timeout: 30000 });
    assert.match(await page.locator('#glKind').innerText(), new RegExp('Visor 3D interactivo de la misma revisión «.+».* · encuadre: ' + room));
    assert.match(await page.locator('#glInset figcaption').innerText(), new RegExp(room + ' · la estancia que viste en planta')); assert.ok(await page.locator('#glInset .gl-mark').count() >= 1);
    await pause(page, 2800); await shot(page, `gl-3-3d-${vp.tag}.png`);
    // Ensayo «palma que se desplaza despacio» (guía c532877a): la maqueta gira y la estancia sigue en el encuadre; un barrido
    // rápido no gira; moverse no cuenta como «mano quieta» (sigue en 3D).
    assert.match(await page.locator('#glVin').innerText(), /Mano abierta moviéndose DESPACIO a un lado/);
    await hold(page, 'fist', 200); const az0 = await page.evaluate(() => RubikGestureLab.orbits);
    await hold(page, 'open', 1800, 0.65, -0.004); const az1 = await page.evaluate(() => RubikGestureLab.orbits);
    assert.ok(az1 - az0 >= 20, 'giro continuo con la palma lenta: ' + (az1 - az0)); assert.equal(await page.evaluate(() => RubikGestureLab.step), '3d', 'girar no avanza');
    await hold(page, 'fist', 200); await hold(page, 'open', 460, 0.8, -0.03); assert.equal(await page.evaluate(() => RubikGestureLab.orbits), az1, 'el barrido rápido no gira');
    await pause(page, 1600); await shot(page, `gl-3b-giro-${vp.tag}.png`);
    // Perder la mano: pausa sin acción; el punto se conserva y se sigue con botones.
    await page.evaluate(() => { RubikGestureLab.feed(null, Math.max(performance.now(), window.__glT || 0) + 800); }); assert.equal(await page.evaluate(() => RubikGestureLab.camera.state), 'lost'); assert.equal(await page.evaluate(() => RubikGestureLab.step), '3d');
    assert.match(await page.locator('#glCamText').innerText(), /Mano perdida · gestos en pausa, no se ha cambiado nada/); await pause(page, 1600);
    // Con una sola revisión el recorrido termina en el 3D; «Antes y después» se pide al elegirlo.
    assert.equal(await page.locator('#glNext').isVisible(), false); await hit(page.locator('#glCompare'));
    assert.match(await page.locator('#glNeed').innerText(), /hace falta una variante guardada/); assert.equal(await page.locator('#glToP10').isVisible(), true);
    assert.equal(await page.evaluate(() => RubikGestureLab.step), '3d', 'el punto se conserva'); await pause(page, 1800);
    await hit(page.locator('#glPrev')); await page.waitForFunction(() => RubikGestureLab.step === 'plan'); await pause(page, 1200);
    assert.ok(!CJK.test(await page.locator('#gestureLab').innerText()), 'sin chino visible en la presentación');
    // Salir: la cámara se apaga y se vuelve a Entregar con el proyecto activo de antes.
    assert.equal(await page.locator('#glExit').innerText(), 'Volver a Entregar'); await hit(page.locator('#glExit')); await page.waitForFunction(() => !document.querySelector('#gestureLab').open);
    assert.deepEqual(await page.evaluate(() => window.__glTracks.map(t => t.readyState)), ['ended']);
    await page.waitForFunction(() => !document.body.classList.contains('gl-active')); assert.equal(await card.isVisible(), true, 'de vuelta en Entregar');
    assert.equal(await page.evaluate(() => FloorPlanApp.entryId), entry0); await pause(page, 1800);
    const srcs = await page.evaluate(() => RubikGestureLab.log.filter(e => e.type === 'step').map(e => e.source)); for (const s of ['gesture', 'button']) assert.ok(srcs.includes(s), 'paso por ' + s);
    assert.deepEqual(errors, []); await save(ctx, page, `gl-recorrido-${vp.tag}.webm`);
  });
}
test('antes y después (opcional) desde P1 con una variante guardada: deslizar, teclado y botón', { timeout: 180000 }, async () => {
  const { ctx, page, errors } = await boot({ width: 1440, height: 900 }, 'granted', { variant: true });
  await page.locator('#workArea-deliver').click(); await page.waitForSelector('#professionalWorkspace [data-entrega-code="P1"] #glFromP1', { state: 'attached' });
  await (await accion(page, '#glFromP1')).click(); await page.waitForSelector('#gestureLab[open]'); assert.equal(await page.evaluate(() => RubikGestureLab.origin), 'P1');
  assert.match(await page.locator('#glIntro').innerText(), /«Antes y después» disponible: «.+».* → «.+».*\(\d+ cambios?\)/);
  await page.locator('#glStartButtons').click(); await page.locator('#glNext').click(); await page.locator('#glNext').click(); await page.waitForFunction(() => RubikGestureLab.step === '3d');
  await page.locator('#glCompare').click(); await page.waitForFunction(() => RubikGestureLab.step === 'compare'); await page.waitForFunction(() => /Superficie útil/.test(document.querySelector('#glCalls').textContent));
  const calls = await page.locator('#glCalls').innerText(); assert.match(calls, /Piezas de mobiliario: \d+ → \d+ ud\./); assert.match(calls, /fuente: RUBIK/);
  await page.locator('#glCam').click(); await page.waitForFunction(() => RubikGestureLab.camera.state === 'on');
  await hold(page, 'fist', 300, 0.7); await hold(page, 'fist', 320, 0.7, -0.05); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'after'); assert.match(await page.locator('#glAck').innerText(), /deslizar → después/);
  await page.keyboard.press('a'); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'before'); await page.locator('#glSide').click(); assert.equal(await page.evaluate(() => RubikGestureLab.side), 'after');
  assert.equal(await page.locator('#glExit').innerText(), 'Volver a P1'); await page.locator('#glExit').click(); assert.deepEqual(await page.evaluate(() => window.__glTracks.map(t => t.readyState)), ['ended']);
  assert.ok(!CJK.test(await page.locator('body').innerText())); assert.deepEqual(errors, []); await ctx.close();
});
test('permiso de cámara denegado: aviso y la presentación sigue con botones y teclado', { timeout: 120000 }, async () => {
  const { ctx, page, errors } = await boot({ width: 1440, height: 900 }, 'denied');
  await page.locator('#gestureLabOpen').click(); await page.locator('#glStartCam').click();
  await page.waitForFunction(() => RubikGestureLab.camera.state === 'denied'); assert.match(await page.locator('#glCamText').innerText(), /denegado · sigue con los botones/);
  assert.match(await page.locator('#glTeach').innerText(), /Sin cámara: sigue con los botones o el teclado, desde este mismo punto/);
  await page.keyboard.press('ArrowRight'); await page.waitForFunction(() => RubikGestureLab.step === 'plan'); assert.deepEqual(errors, []); await ctx.close();
});
test('Home · «Presentación con gestos» en «Módulos para tu trabajo», con estado y demo de la vivienda de ejemplo', { timeout: 120000 }, async () => {
  const { ctx, page, errors } = await boot({ width: 390, height: 844, touch: true }, 'granted', { welcome: true });
  await page.waitForSelector('#welcomeModules [data-service="gesture-presentation"]', { state: 'attached' });
  const li = page.locator('#welcomeModules [data-service="gesture-presentation"]'); await li.scrollIntoViewIfNeeded(); await page.waitForTimeout(400);
  const t = await li.evaluate(n => n.textContent); assert.match(t, /En ensayo · para revisión/); assert.match(await li.innerText(), /Ver la demo con la vivienda de ejemplo/); assert.match(t, /Presentación con gestos/); assert.match(t, /plano enrollado, lo despliega con un gesto y pasa al 3D/);
  await shot(page, 'gl-home-movil.png');
  await li.locator('#welcomeAI-gesture-presentation').tap(); await page.waitForSelector('#gestureLab[open]'); assert.equal(await page.evaluate(() => RubikGestureLab.origin), 'home');
  assert.match(await page.locator('#glIntro').innerText(), /Proyecto: «/); assert.ok(!CJK.test(await page.locator('#gestureLab').innerText())); assert.deepEqual(errors, []); await ctx.close();
});

test('viñetas por paso y salida mientras se carga el modelo de manos: la cámara se apaga y nada se reactiva', { timeout: 120000 }, async () => {
  const { ctx, page, errors } = await boot({ width: 390, height: 844, touch: true }, 'granted');
  // El modelo de manos (CDN) tarda: la petición queda colgada hasta que la persona ya ha salido.
  let release; const held = new Promise(r => { release = r; });
  await page.route('https://cdn.jsdelivr.net/**', async r => { await held; await r.abort(); });
  await page.evaluate(() => { window.__glNoModel = false; RubikGestureLab.open({ origin: 'launcher' }); });
  await page.locator('#glStartButtons').tap();
  for (const [step, re] of [['rolled', /Mano abierta, palma a la cámara, quieta 1 segundo → se despliega el plano/], ['plan', /pasas al 3D de esta estancia/]]) {
    await page.waitForFunction(s => RubikGestureLab.step === s, step); assert.match(await page.locator('#glVin').innerText(), re);
    assert.match(await page.locator('#glVin').innerText(), /Sin cámara: botón/); assert.equal(await page.locator('#glVin svg').count(), 1, 'dibujo de la mano');
    if (step === 'rolled') await page.locator('#glNext').tap(); }
  await page.locator('#glCam').tap(); await page.waitForFunction(() => RubikGestureLab.camera.state === 'starting');
  assert.match(await page.locator('#glCamText').innerText(), /cargando el modelo de manos… puedes salir/);
  await page.locator('#glExit').tap(); await page.waitForFunction(() => !document.querySelector('#gestureLab').open);
  assert.deepEqual(await page.evaluate(() => window.__glTracks.map(t => t.readyState)), ['ended'], 'la cámara se apaga al salir aunque el modelo siga cargando');
  release(); await page.waitForTimeout(800);
  assert.notEqual(await page.evaluate(() => RubikGestureLab.camera.state), 'on', 'nada se reactiva cuando el modelo responde tarde');
  assert.deepEqual(await page.evaluate(() => RubikGestureLab.camera.tracks), []); assert.deepEqual(errors, []); await ctx.close();
});
