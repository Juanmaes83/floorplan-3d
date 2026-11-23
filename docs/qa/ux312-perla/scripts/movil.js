async page => {
  // UX-312 · PERLA · móvil vertical y horizontal con toque, zoom 200 % y teclado.
  const R = []; const ok = (req, ctl, pass, detail = '') => R.push({ req, ctl, pass: !!pass, detail: String(detail).slice(0, 160) });
  const out = '/home/user/pwcli/output/playwright/';
  const browser = page.context().browser();
  const overflowX = p => p.evaluate(() => document.documentElement.scrollWidth - innerWidth);
  const visible = (p, s) => p.evaluate(s => { const n = document.querySelector(s); if (!n) return false; const r = n.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.right > 0 && r.top < innerHeight && r.left < innerWidth && getComputedStyle(n).visibility !== 'hidden'; }, s);
  const inView = (p, s) => p.evaluate(s => [...document.querySelectorAll(s)].filter(n => n.getClientRects().length).map(n => { const r = n.getBoundingClientRect(); return { id: n.id || n.className, in: r.left >= -1 && r.right <= innerWidth + 1 && r.top >= -1 && r.bottom <= innerHeight + 1, h: Math.round(r.height), w: Math.round(r.width) }; }), s);
  const start = async p => { const touch = await p.evaluate(() => matchMedia('(pointer:coarse)').matches || navigator.maxTouchPoints > 0); await p.goto('http://127.0.0.1:43984/#inicio'); await p.evaluate(() => localStorage.clear()); await p.reload(); await (touch ? p.locator('#welcomeExample').tap() : p.locator('#welcomeExample').click()); await p.waitForTimeout(1800); };
  const closeAll = async p => { for (let i = 0; i < 4; i++) { if (!(await p.evaluate(() => !!document.querySelector('dialog[open]')))) break; await p.keyboard.press('Escape'); await p.waitForTimeout(200); } };

  for (const [w, h, tag] of [[390, 844, 'vertical'], [844, 390, 'horizontal']]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
    const p = await ctx.newPage(); const errs = []; p.on('pageerror', e => errs.push(String(e)));
    await start(p);
    await p.screenshot({ path: out + `perla-movil-${tag}.png` });
    ok(tag, 'Sin desplazamiento horizontal de la página', (await overflowX(p)) <= 0, await overflowX(p));
    const key = await inView(p, '#welcomeBtn,#projectsBtn,#actionSearchBtn,#langBtn,#perlaMore>summary,#workArea-design,#workArea-analyze,#workArea-budget,#workArea-deliver,#perlaImport>summary,#perlaFile>summary,#viewSeg [data-view="2d"],#viewSeg [data-view="3d"],#perlaTasks,#presentationBtn,#perlaPrimary,#tgLib,#tgPanel,#assistantOpen');
    ok(tag, 'Controles clave dentro de pantalla', key.every(k => k.in), key.filter(k => !k.in).map(k => k.id).join(',') || key.length + ' controles');
    const small = key.filter(k => k.h < 36 || k.w < 36);
    ok(tag, 'Objetivos táctiles ≥ 36 px', small.length === 0, small.map(k => k.id + ' ' + k.w + '×' + k.h).join(', ') || 'todos ≥ 36');
    // Toque: dock
    await p.locator('#tgLib').tap(); await p.waitForTimeout(400);
    ok(tag, 'Construir (toque) abre la paleta', await visible(p, '#paletteBuild'));
    await p.locator('#tgLib').tap(); await p.waitForTimeout(400);
    await p.locator('#tgPanel').tap(); await p.waitForTimeout(400);
    ok(tag, 'Inspector (toque) abre el Inspector con pestañas', await visible(p, '.perla-tabs') && await visible(p, '#panel'));
    await p.locator('#perlaTab-informe').tap(); await p.waitForTimeout(200);
    ok(tag, 'Pestaña Informe (toque)', await p.evaluate(() => window.FloorPlanPerla.tab === 'informe'));
    await p.locator('#perlaTab-estancias').tap(); await p.locator('#tgPanel').tap(); await p.waitForTimeout(400);
    await p.locator('#assistantOpen').tap(); await p.waitForTimeout(400);
    ok(tag, 'Asistente (toque) abre el panel', await p.evaluate(() => !document.querySelector('#assistantPanel')?.hidden));
    await p.locator('#assistantOpen').tap().catch(() => {}); await p.keyboard.press('Escape'); await p.waitForTimeout(300);
    await p.evaluate(() => { const a = document.querySelector('#assistantPanel'); if (a && !a.hidden) document.querySelector('#assistantClose,.assistant-close')?.click(); });
    // Menús
    await p.locator('#perlaImport > summary').tap(); await p.waitForTimeout(250);
    ok(tag, 'Importar ▾ (toque): opciones dentro de pantalla', (await inView(p, '#perlaImport .perla-pop > button')).every(k => k.in), JSON.stringify(await inView(p, '#perlaImport .perla-pop > button')).slice(0, 120));
    await p.locator('#perlaImport > summary').tap(); await p.waitForTimeout(150);
    await p.locator('#perlaMore > summary').tap(); await p.waitForTimeout(250);
    ok(tag, 'Más ▾ (toque): Pantalla completa, Legal', await visible(p, '#perlaMore #fullscreen') && await visible(p, '#perlaLegal'));
    await p.locator('#perlaMore > summary').tap(); await p.waitForTimeout(150);
    await p.locator('#perlaTasks').tap(); await p.waitForTimeout(400);
    ok(tag, 'Tareas del proyecto (toque) abre la guía dentro de pantalla', (await inView(p, '#guideBar')).every(k => k.in) && await visible(p, '#guideBar'));
    await p.locator('#perlaTasks').tap(); await p.waitForTimeout(300);
    ok(tag, 'Tareas del proyecto (toque) la cierra', !(await visible(p, '#guideBar')));
    await p.locator('#workArea-budget').tap(); await p.waitForTimeout(500);
    ok(tag, 'Área Presupuestar (toque) y vuelta a Diseñar', await p.evaluate(() => document.body.classList.contains('professional-area')) && await visible(p, '#workArea-design'));
    await p.screenshot({ path: out + `perla-movil-${tag}-area.png` });
    await p.locator('#workArea-design').tap(); await p.waitForTimeout(400);
    await p.locator('#perlaPrimary').tap(); await p.waitForTimeout(1500);
    ok(tag, '«Abrir 3D» (toque) → escena 3D', await p.evaluate(() => document.body.classList.contains('m3d')));
    await p.screenshot({ path: out + `perla-movil-${tag}-3d.png` });
    ok(tag, 'Sin errores de página', errs.length === 0, errs.join(' | '));
    await ctx.close();
  }

  // Zoom 200 % (escritorio 1536×1024 al 200 % = 768×512 CSS)
  {
    const ctx = await browser.newContext({ viewport: { width: 768, height: 512 }, deviceScaleFactor: 2 }); const p = await ctx.newPage();
    await start(p); await p.screenshot({ path: out + 'perla-zoom200.png' });
    ok('Zoom 200 %', 'Sin desplazamiento horizontal', (await overflowX(p)) <= 0, await overflowX(p));
    const key = await inView(p, '#welcomeBtn,#projectsBtn,#workArea-design,#workArea-deliver,#perlaImport>summary,#perlaFile>summary,#perlaTasks,#perlaPrimary,#langBtn,#perlaMore>summary');
    ok('Zoom 200 %', 'Controles clave dentro de pantalla', key.every(k => k.in), key.filter(k => !k.in).map(k => k.id).join(',') || key.length + ' controles');
    await ctx.close();
  }

  // Teclado: recorrido con Tab por la cabecera; foco visible en cada parada
  {
    const ctx = await browser.newContext({ viewport: { width: 1536, height: 1024 } }); const p = await ctx.newPage();
    await start(p); await p.locator('#welcomeBtn').focus();
    const stops = [];
    for (let i = 0; i < 40; i++) {
      const s = await p.evaluate(() => { const a = document.activeElement; const st = getComputedStyle(a); return { id: a.id || (a.tagName === 'SUMMARY' ? a.parentElement.id + '>summary' : a.className), inHeader: !!a.closest('header'), ring: st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2 }; });
      if (!s.inHeader) break; stops.push(s); await p.keyboard.press('Tab');
    }
    const ids = stops.map(s => s.id);
    const need = ['welcomeBtn', 'projectsBtn', 'guideCopyExample', 'workArea-design', 'workArea-analyze', 'workArea-budget', 'workArea-deliver', 'actionSearchBtn', 'workArea-studio', 'perlaHelp', 'langBtn', 'perlaMore>summary', 'uploadPlanBtn', 'perlaImport>summary', 'perlaFile>summary', 'perlaTasks', 'presentationBtn', 'perlaPrimary'];
    const order = need.map(n => ids.indexOf(n));
    ok('Teclado', 'Orden de Tab: fila 1 (izq→centro→der) y fila 2', order.every(i => i >= 0) && order.every((v, i) => i === 0 || v > order[i - 1]), ids.join(' → '));
    await p.locator('#projectsBtn').focus(); await p.keyboard.press('Tab'); await p.keyboard.press('Shift+Tab'); await p.keyboard.press('Shift+Tab');
    const first = await p.evaluate(() => { const a = document.activeElement, st = getComputedStyle(a); return { id: a.id, ring: st.outlineStyle !== 'none' && parseFloat(st.outlineWidth) >= 2 }; });
    const all = [first, ...stops.slice(1)];
    ok('Teclado', 'Foco visible (≥ 2 px) en todas las paradas', first.id === 'welcomeBtn' && all.every(s => s.ring), all.filter(s => !s.ring).map(s => s.id).join(',') || all.length + ' paradas con anillo');
    await p.locator('#perlaImport > summary').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(200);
    ok('Teclado', 'Enter abre Importar ▾', await p.evaluate(() => document.querySelector('#perlaImport').open));
    await p.keyboard.press('Escape'); await p.evaluate(() => { document.querySelector('#perlaImport').open = false; }); await p.locator('#perlaTab-estancias').focus(); await p.keyboard.press('ArrowRight'); await p.waitForTimeout(150);
    ok('Teclado', 'Flechas entre pestañas del Inspector', await p.evaluate(() => window.FloorPlanPerla.tab === 'propiedades' && document.activeElement.id === 'perlaTab-propiedades'));
    await p.locator('#perlaPrimary').focus(); await p.keyboard.press('Enter'); await p.waitForTimeout(1500);
    ok('Teclado', 'Enter en la acción principal = «Abrir 3D»', await p.evaluate(() => document.body.classList.contains('m3d')));
    await ctx.close();
  }
  return JSON.stringify(R);
}
