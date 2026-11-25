async page => {
  // UX-312 · Home · capturas auténticas (2): entrega firmada con firma de DEMOSTRACIÓN y vídeo real del recorrido.
  const D = '/home/user/pwcli/output/portadas/raw/'; const log = [];
  const browser = page.context().browser(); const U = 'http://127.0.0.1:43984/';
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, acceptDownloads: true }); const p = await ctx.newPage();
  const closeAll = async () => { for (let i = 0; i < 4; i++) { if (!(await p.evaluate(() => !!document.querySelector('dialog[open]')))) break; await p.keyboard.press('Escape'); await p.waitForTimeout(300); } };
  try {
    await p.goto(U + '#inicio'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.locator('#welcomeExample').click();
    await p.waitForFunction(() => window.View3D && window.FloorPlanApp && window.FloorPlanBrandUI); await p.waitForTimeout(1200);
    // Firma de demostración: identificable como tal (nombre de estudio ficticio, sin datos personales)
    await p.evaluate(() => FloorPlanBrandUI.open()); await p.locator('#brand-name').waitFor();
    await p.fill('#brand-name', 'Estudio Demo · firma de ejemplo'); await p.locator('#brandSave').click(); await p.waitForTimeout(600); await closeAll();
    log.push('marca: ' + JSON.stringify(await p.evaluate(() => FloorPlanBrandUI.snapshot?.()?.profile?.name || null)));
    // Lámina con la firma
    await p.evaluate(() => FloorPlanSheet.open()); await p.waitForTimeout(1200);
    const sign = p.locator('#sheetDialog select').first(); if (await sign.count()) { const opts = await sign.locator('option').allTextContents(); const i = opts.findIndex(o => /Estudio Demo/.test(o)); if (i >= 0) await sign.selectOption({ index: i }); await p.waitForTimeout(800); }
    await p.locator('#sheetDialog').screenshot({ path: D + 'entrega-lamina.png' }); log.push('lámina ok'); await closeAll();
    // Dossier
    await p.evaluate(() => FloorPlanDossier.open()); await p.waitForTimeout(1500);
    await p.locator('#dossierDialog').screenshot({ path: D + 'entrega-dossier.png' }); log.push('dossier ok'); await closeAll();
    // Presentación guiada (dos estancias) y vídeo real del recorrido
    await p.locator('#workArea-deliver').click(); await p.waitForTimeout(800);
    await p.locator('#professionalWorkspace').getByRole('button', { name: 'Preparar presentación' }).click();
    const rows = p.locator('#presentationConfig .presentation-room-row input'); const n = await rows.count(); for (let i = 2; i < n; i++) await rows.nth(i).uncheck();
    await p.locator('#presentationConfig').getByRole('button', { name: 'Iniciar presentación', exact: true }).click();
    await p.waitForFunction(() => FloorPlanPresentation.active && document.querySelector('#presentationOverlay').dataset.moving === 'false', null, { timeout: 180000 });
    await p.screenshot({ path: D + 'entrega-presentacion.png' }); log.push('presentación ok');
    await p.locator('#presentationVideo').click({ timeout: 60000 }); await p.locator('#tourVideoDialog').waitFor();
    log.push('formato: ' + await p.locator('#tourVideoFormat').innerText());
    await p.locator('#tourVideoGo').click(); await p.locator('#tourVideoPreview').waitFor({ timeout: 420000 });
    log.push('meta: ' + await p.locator('#tourVideoMeta').innerText());
    log.push('descarga: ' + await p.locator('#tourVideoDownload').evaluate(b => b.tagName + ' ' + (b.getAttribute('href') || '') + ' ' + b.disabled));
    const [d] = await Promise.all([p.waitForEvent('download', { timeout: 90000 }), p.locator('#tourVideoDownload').evaluate(b => b.click())]);
    await d.saveAs(D + d.suggestedFilename()); log.push('vídeo: ' + d.suggestedFilename());
  } catch (e) { log.push('error: ' + String(e.message).split('\n')[0]); await p.screenshot({ path: D + 'error.png' }).catch(() => {}); }
  await ctx.close(); return JSON.stringify(log);
}
