async page => {
  // UX-312 · PERLA · Entregar: catálogo, fichas compactas, salidas reales y vuelta al origen.
  const R = []; const ok = (req, ctl, pass, detail = '') => R.push({ req, ctl, pass: !!pass, detail: String(detail).slice(0, 180) });
  const out = '/home/user/pwcli/output/'; const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const ev = (f, a) => page.evaluate(f, a);
  const closeAll = async () => { for (let i = 0; i < 5; i++) { if (!(await ev(() => !!document.querySelector('dialog[open]')))) break; await page.keyboard.press('Escape'); await page.waitForTimeout(250); } };
  try {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto('http://127.0.0.1:43984/#inicio'); await ev(() => localStorage.clear()); await page.reload();
  await page.locator('#welcomeExample').click(); await page.waitForTimeout(1500);
  // Vista 3D para que las salidas BP-DP queden disponibles (su requisito), y Entregar
  await page.locator('#viewSeg [data-view="3d"]').click(); await page.waitForTimeout(1500);
  await page.locator('#workArea-deliver').click(); await page.waitForTimeout(1800);
  await page.screenshot({ path: out + 'playwright/perla-entregar-indice.png' });

  // Fichas del índice según la maqueta aprobada (c96888ac): una sola acción principal a la vista; el selector de la ficha
  // abre su panel de detalle con todas las acciones. (Sustituye a las «fichas compactas con Ver detalles» de la V4.)
  const idx = await ev(() => [...document.querySelectorAll('#professionalWorkspace [data-entrega-code].perla-ref')].map(c => ({ code: c.dataset.entregaCode, go: [...c.querySelectorAll('.perla-go')].filter(b => b.checkVisibility()).length, sel: !!c.querySelector('.perla-card-selector') })));
  ok('Índice', 'Fichas: una acción principal a la vista y selector de detalle', idx.length >= 16 && idx.every(c => c.go === 1 && c.sel), `${idx.length} fichas · fuera de regla: ${idx.filter(c => !(c.go === 1 && c.sel)).map(c => c.code + ':' + c.go + (c.sel ? '' : ' sin-selector')).join(', ') || 'ninguna'}`);
  const card = page.locator('#professionalWorkspace [data-entrega-code="D1"]');
  const sib = page.locator('#professionalWorkspace [data-entrega-code="D2"]');
  const pos = () => sib.evaluate(n => { const g = n.closest('.professional-grid') || n.offsetParent; const a = n.getBoundingClientRect(), b = g.getBoundingClientRect(); return { x: a.x - b.x, y: a.y - b.y }; });
  const before = await pos();
  await card.locator('.perla-card-selector').focus(); await page.keyboard.press('Enter'); await page.waitForTimeout(250);
  const opened = await ev(() => document.querySelector('#professionalWorkspace .perla-panel-open .perla-panel-code')?.textContent === 'D1');
  const after = await pos();
  await page.screenshot({ path: out + 'playwright/perla-entregar-detalle.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  const closed = await ev(() => !document.querySelector('#professionalWorkspace .perla-panel-open') && !!document.activeElement?.closest('[data-entrega-code="D1"]'));
  ok('Índice', 'Detalle con teclado: abre el panel, Escape lo cierra y devuelve el foco a la ficha', opened && closed, `abierto ${opened} · cerrado y foco ${closed}`);
  ok('Índice', 'La cuadrícula no se mueve al abrir el detalle', Math.abs(before.y - after.y) < 1 && Math.abs(before.x - after.x) < 1, `${before.x},${before.y} → ${after.x},${after.y}`);
  // Maqueta: el formato y la descripción completa están en el panel de la ficha; en el índice, la descripción corta.
  await page.locator('#professionalWorkspace [data-entrega-code="D2"] .perla-card-selector').click(); await page.waitForTimeout(250);
  const fmtD2 = await ev(() => document.querySelector('#professionalWorkspace .perla-panel-open')?.textContent || '');
  ok('Índice', 'D2 Lámina: formato real SVG en el detalle', /SVG/.test(fmtD2) && !/PDF · PNG/.test(fmtD2), (fmtD2.match(/[^.]*SVG[^.]*/) || [''])[0].slice(0, 120));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('Índice', 'Descripción corta visible en cada ficha', await ev(() => [...document.querySelectorAll('#professionalWorkspace [data-entrega-code].perla-ref')].every(c => c.querySelector('.perla-desc')?.checkVisibility() && c.querySelector('.perla-desc').textContent.trim().length > 10)), '');
  await page.mouse.move(5, 5);
  ok('Índice', 'Visores Blueprint 3D y Despiece 3D junto a Presentación 3D', await ev(() => { const g = document.querySelector('[data-group="experience"] .professional-group-items'); return !!g?.querySelector('#bpdpCard-blueprint') && !!g?.querySelector('#bpdpCard-despiece'); }));

  // Catálogo
  await page.locator('#perlaCatToggle').click(); await page.waitForTimeout(300);
  const cat = await ev(() => ({ n: document.querySelectorAll('.perla-cat-item').length, salidas: document.querySelectorAll('.perla-cat-item[data-kind="salida"]').length, count: document.querySelector('.perla-cat-count')?.textContent, groups: [...document.querySelectorAll('.perla-cat-group h4')].map(h => h.textContent) }));
  ok('Catálogo', '«Ver todos los documentos y entregables» abre el catálogo', cat.n > 20, `${cat.count} · ${cat.groups.join(' | ')}`);
  await page.locator('#perlaCatalog').screenshot({ path: out + 'playwright/perla-entregar-catalogo.png' });
  const items = await ev(() => [...document.querySelectorAll('.perla-cat-item')].map(i => ({ id: i.dataset.catId, kind: i.dataset.kind, name: i.querySelector('h5').textContent, state: i.querySelector('.professional-state').textContent, format: i.querySelector('.perla-cat-format').textContent, action: i.querySelector('.perla-cat-action').textContent, disabled: i.querySelector('.perla-cat-action').disabled, req: i.querySelector('.perla-cat-req')?.textContent || '' })));
  R.push({ req: 'Inventario', ctl: 'catálogo', pass: true, detail: '', items });

  // Cada salida: qué se abre / qué se descarga; Escape o Cerrar → foco de vuelta a su ficha y catálogo abierto
  const runs = {
    superficies: { dialog: true }, lamina: { dialog: true, download: /\.svg$/, inDialog: 'button:text-matches("Descargar|SVG","i")' }, dossier: { dialog: true }, orientacion: { dialog: true },
    'plano-png': { download: /\.png$/ }, moodboard: { dialog: true }, presentacion: { any: true }, proyecto: { download: /\.json$/ }, dxf: { download: /\.dxf$/ }, 'archivo-cliente': { download: /\.html$/ },
    enlace: { dialog: true }, 'render-ia': { dialog: true }, video: { any: true }, blender: { dialog: true }, e3: { dialog: true }, observaciones: { dialog: true }, 'revision-render': { dialog: true }, comparar: { dialog: true },
    'bp-lamina': { dialog: true, bpdp: true }, 'dp-lamina': { dialog: true, bpdp: true }, 'bp-visor': { dialog: true, bpdp: true }, 'dp-visor': { dialog: true, bpdp: true }
  };
  for (const [id, exp] of Object.entries(runs)) {
    try {
    if (await ev(() => document.querySelector('#professionalWorkspace')?.dataset.area !== 'deliver' || document.querySelector('#professionalWorkspace')?.hidden)) { await page.locator('#workArea-deliver').click(); await page.waitForTimeout(1200); }
    if (await ev(() => document.querySelector('#perlaCatToggle')?.getAttribute('aria-expanded') !== 'true')) { await page.locator('#perlaCatToggle').click(); await page.waitForTimeout(300); }
    const btn = page.locator(`[data-perla-action="${id}"]`);
    if (!(await btn.count())) { ok('Salida', id, false, 'sin ficha'); continue; }
    if (await btn.isDisabled()) { const req = await ev(id => document.querySelector(`[data-cat-id="${id}"] .perla-cat-req`)?.textContent, id); ok('Salida', id + ' (requisito)', !!req, 'desactivada · ' + req); continue; }
    const dlP = exp.download ? page.waitForEvent('download', { timeout: id === 'plano-png' ? 60000 : 15000 }).catch(() => null) : null;
    try { await btn.scrollIntoViewIfNeeded({ timeout: 5000 }); await btn.click({ timeout: 5000 }); } catch (e) { if (!/not attached|detached/.test(e.message)) throw e; await page.waitForTimeout(300); await btn.click({ timeout: 5000 }); }
    if (exp.bpdp) await page.waitForFunction(() => !!document.querySelector('dialog.bpdp-host[open]'), null, { timeout: 25000 }).catch(() => {});
    await page.waitForTimeout(exp.bpdp ? 2500 : 900);
    let dl = dlP ? await dlP : null;
    const what = await ev(() => { const d = [...document.querySelectorAll('dialog[open]')].pop(); return d ? (d.id || d.className) + ' · ' + (d.querySelector('h1,h2,h3')?.textContent || d.getAttribute('aria-label') || '').trim().slice(0, 50) : (document.body.classList.contains('presenting') ? 'presentación' : document.activeElement?.id || ''); });
    if (!dl && exp.inDialog) { const b = page.locator('dialog[open] ' + exp.inDialog).first(); if (await b.count()) { const p2 = page.waitForEvent('download', { timeout: 10000 }).catch(() => null); await b.click(); dl = await p2; } }
    if (dl) { await dl.saveAs(out + 'salidas/' + dl.suggestedFilename()); }
    const opened = exp.download ? (!!dl && exp.download.test(dl.suggestedFilename())) : (what && what !== `perlaAction-${id}`);
    // Volver
    if (await ev(() => document.body.classList.contains('presenting'))) { await page.keyboard.press('Escape'); await page.waitForTimeout(800); }
    await closeAll(); if (exp.bpdp) await page.waitForFunction(() => !document.querySelector('dialog.bpdp-host[open]'), null, { timeout: 15000 }).catch(() => {}); await page.waitForTimeout(exp.bpdp ? 1500 : 400);
    const back = await ev(id => ({ focus: document.activeElement?.dataset?.perlaAction, catOpen: !!document.querySelector('#perlaCatalog:not([hidden])'), area: document.querySelector('#professionalWorkspace')?.dataset.area }), id);
    ok('Salida', id, opened && back.focus === id && back.catOpen && back.area === 'deliver', `${dl ? 'descarga ' + dl.suggestedFilename() : 'abre ' + what} · vuelta: foco ${back.focus} · catálogo ${back.catOpen} · área ${back.area}`);
    } catch (e) { ok('Salida', id, false, 'error: ' + String(e.message).split('\n')[0]); await closeAll(); }
  }
  // Requisito satisfecho: preparar las vistas desbloquea Render IA, que abre su diálogo sin generar ni gastar
  try {
    if (await ev(() => document.querySelector('#perlaCatToggle')?.getAttribute('aria-expanded') !== 'true')) { await page.locator('#perlaCatToggle').click(); await page.waitForTimeout(300); }
    const before = await page.locator('[data-perla-action="render-ia"]').isDisabled();
    await page.locator('[data-perla-action="vistas"]').click();
    await page.waitForFunction(() => (window.FloorPlanProjectViews?.current?.() || []).length > 0, null, { timeout: 240000 });
    await closeAll(); await page.waitForTimeout(800);
    if (await ev(() => document.querySelector('#professionalWorkspace')?.dataset.area !== 'deliver')) { await page.locator('#workArea-deliver').click(); await page.waitForTimeout(1200); }
    if (await ev(() => document.querySelector('#perlaCatToggle')?.getAttribute('aria-expanded') !== 'true')) { await page.locator('#perlaCatToggle').click(); await page.waitForTimeout(300); }
    await page.waitForFunction(() => !document.querySelector('[data-perla-action="render-ia"]')?.disabled, null, { timeout: 20000 });
    await page.locator('[data-perla-action="render-ia"]').click(); await page.waitForTimeout(800);
    const d = await ev(() => { const x = [...document.querySelectorAll('dialog[open]')].pop(); return x ? (x.id || x.className) + ' · ' + (x.querySelector('h2,h3')?.textContent || '') : ''; });
    await closeAll(); await page.waitForTimeout(400);
    const back = await ev(() => document.activeElement?.dataset?.perlaAction);
    ok('Requisito', 'Vistas preparadas → Render IA se desbloquea y abre sin generar', before && !!d && back === 'render-ia', `antes bloqueado ${before} · abre ${d} · foco ${back} · vistas ${await ev(() => FloorPlanProjectViews.current().length)}`);
  } catch (e) { ok('Requisito', 'Vistas → Render IA', false, String(e.message).split('\n')[0]); }
  // Detalle en una ficha del catálogo, con toque simulado por clic
  const it = page.locator('[data-cat-id="economico"]');
  await it.locator('.perla-more-btn').click(); await page.waitForTimeout(150);
  const det = await it.evaluate(i => i.querySelector('.perla-detail').textContent);
  ok('Catálogo', 'Dossier económico: formatos en el detalle', /CSV/.test(det) && /BC3/.test(det) && /JSON/.test(det) && /PDF/.test(det), det);
  await it.locator('.perla-more-btn').click();
  // Idiomas sin chino visible en ES/EN
  for (const lang of ['en', 'es']) {
    for (let i = 0; i < 3 && (await ev(() => LANG)) !== lang; i++) { await page.locator('#langBtn').click(); await page.waitForTimeout(500); }
    const t = await ev(() => document.querySelector('#perlaCatalog')?.innerText + document.querySelector('#perlaCatToggle')?.innerText);
    ok('Idioma', 'Catálogo ' + lang.toUpperCase() + ' sin chino', !/[㐀-鿿]/.test(t) && (lang === 'en' ? /outputs/.test(t) : /salidas/.test(t)), t.slice(0, 100));
  }
  } catch (e) { ok('Script', 'interrumpido', false, String(e.message).split('\n')[0] + ' · diálogos: ' + await ev(() => [...document.querySelectorAll('dialog[open]')].map(d => d.className + ':' + (d.getAttribute('aria-label') || '')).join(','))); }
  ok('Consola', 'Sin errores de página', errs.length === 0, errs.join(' | '));
  return JSON.stringify(R);
}
