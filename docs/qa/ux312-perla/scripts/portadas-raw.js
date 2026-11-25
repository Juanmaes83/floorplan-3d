async page => {
  // UX-312 · Home · capturas AUTÉNTICAS de RUBIK para las seis portadas nuevas (vivienda de ejemplo).
  const D = '/home/user/pwcli/output/portadas/raw/'; const log = []; const fs = { ok: true };
  const browser = page.context().browser(); const U = 'http://127.0.0.1:43984/';
  const ex = async (p, touch) => { await p.goto(U + '#inicio'); await p.evaluate(() => localStorage.clear()); await p.reload(); await (touch ? p.locator('#welcomeExample').tap() : p.locator('#welcomeExample').click()); await p.waitForFunction(() => window.View3D && window.FloorPlanApp); await p.waitForTimeout(1200); };
  const to3d = async p => { await p.evaluate(() => window.setView('3d')); await p.waitForFunction(() => document.body.classList.contains('m3d')); await p.waitForTimeout(1500); };
  // 1 · Recorrido táctil a la altura de los ojos: joystick y minimapa (teléfono en horizontal)
  try {
    const ctx = await browser.newContext({ viewport: { width: 844, height: 390 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await ex(p, true); await to3d(p);
    if (await p.locator('#nav3dToggle').getAttribute('aria-expanded') === 'false') await p.locator('#nav3dToggle').tap();
    const opt = await p.evaluate(() => [...document.querySelectorAll('#nav3dRoom option')].find(o => /Salón|Salon/.test(o.textContent))?.value); if (opt) await p.selectOption('#nav3dRoom', opt);
    await p.waitForTimeout(1200);
    await p.locator('#nav3dMode-walk').tap(); await p.waitForFunction(() => View3D.walking() && !View3D.navState.busy, null, { timeout: 60000 });
    await p.locator('#walkStart').tap(); await p.locator('#joy').waitFor({ state: 'visible' });
    await p.waitForFunction(() => !document.querySelector('#nav3dMap').hidden && RubikNav3D.marker.state === 'ok', null, { timeout: 30000 });
    // Un poco hacia delante con el dedo en el joystick, para que se vea el recorrido en curso
    const j = await p.locator('#joy').boundingBox(), cx = j.x + j.width / 2, cy = j.y + j.height / 2, cdp = await ctx.newCDPSession(p);
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: cx, y: cy, id: 1 }] });
    for (let i = 1; i <= 4; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: cx, y: cy - i * 8, id: 1 }] });
    await p.waitForTimeout(1600); await p.screenshot({ path: D + 'recorrido-joystick.png' });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] }); await p.waitForTimeout(600);
    await p.screenshot({ path: D + 'recorrido-quieto.png' });
    log.push('recorrido ok'); await ctx.close();
  } catch (e) { log.push('recorrido: ' + String(e.message).split('\n')[0]); }
  // 2 · Asistente: consulta guiada auténtica con respuesta y fuente
  try {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await ex(p, false); await p.locator('#assistantOpen').click(); await p.waitForTimeout(500);
    const chip = p.locator('#assistantPanel button', { hasText: /¿Cuántas estancias hay\?/ }).first(); await chip.click(); await p.waitForTimeout(1500);
    await p.locator('#assistantPanel').screenshot({ path: D + 'asistente-panel.png' });
    log.push('asistente ok: ' + (await p.locator('#assistantPanel').innerText()).replace(/\s+/g, ' ').slice(0, 220)); await ctx.close();
  } catch (e) { log.push('asistente: ' + String(e.message).split('\n')[0]); }
  // 3 · Entrega con firma de demostración: lámina, dossier y presentación de la misma vivienda
  try {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true }); const p = await ctx.newPage();
    await ex(p, false);
    // Firma de demostración en Mi estudio (identificable como tal)
    await p.evaluate(() => { const s = window.FloorPlanBrandUI?.store || window.FloorPlanBrand; return !!s; });
    await p.locator('#workArea-studio').click(); await p.waitForTimeout(800);
    log.push('estudio: ' + (await p.locator('#professionalWorkspace').innerText()).replace(/\s+/g, ' ').slice(0, 300));
    await ctx.close();
  } catch (e) { log.push('entrega: ' + String(e.message).split('\n')[0]); }
  return JSON.stringify(log);
}
