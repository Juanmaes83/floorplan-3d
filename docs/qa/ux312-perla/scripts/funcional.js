async page => {
  // UX-312 · PERLA · destino y efecto real de cada acción del editor (escritorio 1536×1024).
  const R = []; const ok = (req, ctl, pass, detail = '') => R.push({ req, ctl, pass: !!pass, detail: String(detail).slice(0, 140) });
  const errs = []; page.on('pageerror', e => errs.push(String(e)));
  const ev = (f, a) => page.evaluate(f, a);
  const vis = s => ev(s => { const n = document.querySelector(s); return !!n && n.getClientRects().length > 0 && getComputedStyle(n).visibility !== 'hidden'; }, s);
  const closeDialogs = async () => { for (let i = 0; i < 4; i++) { if (!(await ev(() => !!document.querySelector('dialog[open]')))) break; await page.keyboard.press('Escape'); await page.waitForTimeout(200); } };
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto('http://127.0.0.1:43984/#inicio'); await ev(() => localStorage.clear()); await page.reload();
  await page.locator('#welcomeExample').click(); await page.waitForTimeout(1800);

  // Jerarquía y colores
  const st = await ev(() => { const c = s => { const n = document.querySelector(s); return n ? getComputedStyle(n) : null; };
    return { prim: c('#perlaPrimary')?.backgroundColor, primShadow: c('#perlaPrimary')?.boxShadow, sec: c('#presentationBtn')?.borderColor, secInk: c('#presentationBtn')?.color, lib: c('aside.lib')?.backgroundColor, right: c('aside.right')?.backgroundColor, stage: c('#stage')?.backgroundColor,
      areasCenter: (() => { const a = document.querySelector('.perla-areas').getBoundingClientRect(); return Math.round(a.x + a.width / 2); })(), areaFont: c('#workArea-design')?.fontSize + '/' + c('#workArea-design')?.fontWeight, utilFont: c('#actionSearchBtn')?.fontSize }; });
  ok('Jerarquía', 'Acción principal vino #783B4B con sombra', st.prim === 'rgb(120, 59, 75)' && st.primShadow !== 'none', st.prim + ' ' + st.primShadow);
  ok('Jerarquía', 'Segundo nivel verde petróleo #1F5A66', /31, 90, 102/.test(st.sec) && /31, 90, 102/.test(st.secInk), st.sec);
  ok('Jerarquía', 'Laterales #FAF7F8', st.lib === 'rgb(250, 247, 248)' && st.right === 'rgb(250, 247, 248)', st.lib + ' ' + st.right);
  ok('Jerarquía', 'Lienzo neutro', /238, 240, 240/.test(st.stage), st.stage);
  ok('Jerarquía', 'Áreas centradas y con más peso', Math.abs(st.areasCenter - 768) < 60 && /15px\/600/.test(st.areaFont), `centro ${st.areasCenter} · ${st.areaFont} · utilidades ${st.utilFont}`);
  await page.locator('#perlaPrimary').focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab');
  const ring = await ev(() => { const s = getComputedStyle(document.activeElement); return document.activeElement.id + ' ' + s.outlineColor + ' ' + s.boxShadow; });
  ok('Jerarquía', 'Foco de la primaria: anillo vino + halo #F4E8EC', /perlaPrimary/.test(ring) && /244, 232, 236/.test(ring), ring);

  // Fila 1
  const proj = await ev(() => document.querySelector('#projectsBtn').dataset.perlaName);
  ok('Fila 1', 'Proyecto: nombre visible', /Proyecto de ejemplo/.test(proj), proj);
  await page.locator('#projectsBtn').click(); await page.waitForTimeout(400);
  ok('Fila 1', 'Proyecto → biblioteca local (projectsBtn)', await ev(() => !!document.querySelector('dialog[open]')), await ev(() => document.querySelector('dialog[open]')?.id)); await closeDialogs();
  for (const k of ['analyze', 'budget', 'deliver', 'design']) {
    await page.locator('#workArea-' + k).click(); await page.waitForTimeout(400);
    const s = await ev(k => ({ cur: document.querySelector('#workArea-' + k)?.getAttribute('aria-current'), ws: (() => { const w = document.querySelector('#professionalWorkspace'); return !!w && w.getClientRects().length > 0; })(), area: document.body.classList.contains('professional-area') }), k);
    ok('Fila 1', 'Área ' + k, s.cur === 'page' && (k === 'design' ? !s.area : s.ws), JSON.stringify(s));
  }
  await page.locator('#actionSearchBtn').click(); await page.waitForTimeout(300);
  ok('Fila 1', 'Buscar acción → buscador', await ev(() => !!document.querySelector('dialog[open]')), await ev(() => document.querySelector('dialog[open]')?.id)); await closeDialogs();
  await page.locator('#workArea-studio').click(); await page.waitForTimeout(400);
  ok('Fila 1', 'Mi estudio → espacio Mi estudio', await ev(() => document.querySelector('#workArea-studio')?.getAttribute('aria-current') === 'page' || !!document.querySelector('dialog[open]')), await ev(() => document.querySelector('#professionalWorkspace h2,dialog[open] h2')?.textContent));
  await closeDialogs(); await page.locator('#workArea-design').click(); await page.waitForTimeout(300);
  await page.locator('#perlaHelp').click(); await page.waitForTimeout(300);
  ok('Fila 1', 'Ayuda → atajos del Informe', await ev(() => window.FloorPlanPerla.tab === 'informe' && !!document.querySelector('#panel [data-group="keys"]') && document.querySelector('#panel [data-group="keys"]').getClientRects().length > 0), await ev(() => window.FloorPlanPerla.tab));
  await page.locator('#perlaTab-estancias').click();
  await page.locator('#perlaMore > summary').click(); await page.waitForTimeout(200);
  ok('Fila 1', 'Más → Pantalla completa, Legal', await vis('#perlaMore #fullscreen') && await vis('#perlaLegal'));
  await page.locator('#perlaLegal').click(); await page.waitForTimeout(300);
  ok('Fila 1', 'Legal y uso → diálogo legal', await ev(() => document.querySelector('#legalDialog')?.open), ''); await closeDialogs();

  // Fila 2
  await page.locator('#perlaImport > summary').click(); await page.waitForTimeout(200);
  // Desde 7e813b6b «Importar proyecto JSON» está en «Archivo», junto a «Guardar» (las demás importaciones siguen en «Subir plano ▾»).
  const imp = await ev(() => ['roomPlanJoinQuick', 'newProjectBtn', 'importImage', 'joinRoomPlan'].filter(id => { const n = document.getElementById(id); return n && n.checkVisibility(); }));
  ok('Fila 2', 'Subir plano a la vista · ▾: RoomPlan, nuevo, imagen, unir', imp.length === 4 && await vis('#uploadPlanBtn'), imp.join(','));
  await ev(() => { document.querySelector('#perlaImport').open = false; });
  await page.locator('#perlaFile > summary').click(); await page.waitForTimeout(200);
  ok('Fila 2', 'Archivo ▾ incluye «Importar proyecto JSON»', await ev(() => document.querySelector('#importJson')?.checkVisibility()), '');
  await ev(() => { window.__fileClicks = []; const o = HTMLInputElement.prototype.click; window.__origClick = o; HTMLInputElement.prototype.click = function () { if (this.type === 'file') { window.__fileClicks.push(this.id || this.accept); return; } return o.call(this); }; });
  await page.locator('#importJson').click(); await page.waitForTimeout(300);
  const fc = await ev(() => { const r = window.__fileClicks.slice(); HTMLInputElement.prototype.click = window.__origClick; return r; });
  ok('Fila 2', 'Importar JSON → selector de archivo (input file)', fc.length > 0, fc.join(',')); await closeDialogs();
  await ev(() => { document.querySelector('#perlaImport').open = false; });
  await page.locator('#perlaFile > summary').click(); await page.waitForTimeout(200);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.locator('#exportJson').click()]);
  ok('Fila 2', 'Archivo → Guardar JSON descarga', !!dl, dl?.suggestedFilename()); if (dl) await dl.saveAs('/home/user/pwcli/output/salidas/' + dl.suggestedFilename());
  await closeDialogs(); await page.locator('#perlaFile > summary').click().catch(() => {}); await page.waitForTimeout(150);
  const [dl2] = await Promise.all([page.waitForEvent('download', { timeout: 8000 }).catch(() => null), page.locator('#exportPng').click()]);
  ok('Fila 2', 'Archivo → PNG del plano descarga', !!dl2, dl2?.suggestedFilename()); if (dl2) await dl2.saveAs('/home/user/pwcli/output/salidas/' + dl2.suggestedFilename());
  await closeDialogs(); await ev(() => { const f = document.querySelector('#perlaFile'); if (f) f.open = false; });
  const prog = await ev(() => document.querySelector('#perlaProgress').textContent.replace(/\s+/g, ' '));
  const gj = await ev(() => document.querySelector('#guideBar .guide-journey-label')?.textContent);
  ok('Fila 2', 'Resumen de paso = guía real', /Paso 4 de 5/.test(prog) && /2\/3/.test(prog) && /Paso 4 de 5/.test(gj), prog);
  await page.locator('#perlaTasks').click(); await page.waitForTimeout(300);
  const gOpen = await vis('#guideBar'); const exp = await ev(() => document.querySelector('#perlaTasks').getAttribute('aria-expanded'));
  await page.keyboard.press('Escape'); await page.waitForTimeout(200);
  ok('Fila 2', 'Tareas del proyecto abre la guía; Escape cierra y devuelve el foco', gOpen && exp === 'true' && !(await vis('#guideBar')) && await ev(() => document.activeElement.id === 'perlaTasks'), `abierta ${gOpen} · foco ${await ev(() => document.activeElement.id)}`);
  const pt = await ev(() => [document.querySelector('#perlaPrimary').textContent, document.querySelector('#guidePrimary').textContent]);
  ok('Fila 2', 'Acción principal = acción de la tarea', pt[0] === pt[1] && pt[0].length > 0, pt.join(' = '));
  await page.locator('#perlaPrimary').click(); await page.waitForTimeout(1500);
  const is3d = await ev(() => document.body.classList.contains('m3d') && getComputedStyle(document.querySelector('#view3d')).display !== 'none');
  ok('Fila 2', '«' + pt[0] + '» → escena 3D', is3d, is3d);
  await page.locator('#viewSeg [data-view="2d"]').click(); await page.waitForTimeout(800);
  ok('Fila 2', 'Vista Plano 2D', await ev(() => !document.body.classList.contains('m3d')));
  await page.locator('#presentationBtn').click(); await page.waitForTimeout(500);
  ok('Fila 2', 'Presentar vivienda → configuración de presentación', await ev(() => !!document.querySelector('#presentationConfig[open]')), ''); await closeDialogs();

  // Lienzo
  const vb0 = await ev(() => document.querySelector('#plan').getAttribute('viewBox'));
  await page.locator('#zoomIn').click(); await page.waitForTimeout(250); const vb1 = await ev(() => document.querySelector('#plan').getAttribute('viewBox'));
  await page.locator('#zoomOut').click(); await page.waitForTimeout(250);
  await page.locator('#fit').click(); await page.waitForTimeout(250);
  ok('Lienzo', 'Ampliar / Reducir / Ajustar', vb0 !== vb1, vb0 + ' → ' + vb1);
  await page.locator('.perla-scales > summary').click(); await page.locator('#s100').click(); await page.waitForTimeout(300);
  const sc = await ev(() => document.querySelector('footer')?.textContent.match(/1:\d+/)?.[0]);
  ok('Lienzo', 'Escala 1:100', sc === '1:100', sc); await page.locator('#fit').click();
  for (const k of ['dims', 'labels', 'furn']) {
    const b = page.locator(`.perla-canvas-top [data-layer="${k}"]`); const a0 = await b.getAttribute('class'); await b.click(); await page.waitForTimeout(150); const a1 = await b.getAttribute('class'); await b.click();
    ok('Lienzo', 'Capa ' + k, a0 !== a1, a0 + ' → ' + a1);
  }
  await page.locator('#layersMenu > summary').click(); await page.waitForTimeout(150);
  ok('Lienzo', 'Mostrar ▾: rejilla, muros de carga, ajuste', await vis('#layersMenu [data-layer="grid"]') && await vis('#layersMenu [data-layer="bearing"]') && await vis('#layersMenu [data-layer="wallSnap"]'));
  await ev(() => { document.querySelector('#layersMenu').open = false; });
  ok('Lienzo', 'Norte sin configurar visible', await vis('#solarNorth'));
  await page.locator('#tgLib').click(); await page.waitForTimeout(300); const libHidden = await ev(() => document.querySelector('aside.lib').getBoundingClientRect().width < 10 || document.querySelector('.app').classList.contains('noLib') || getComputedStyle(document.querySelector('aside.lib')).display === 'none');
  await page.locator('#tgLib').click(); await page.waitForTimeout(300);
  ok('Lienzo', 'Plegar/abrir Construir', libHidden, libHidden);

  // Inspector
  await page.locator('#perlaTab-informe').click(); await page.waitForTimeout(200);
  ok('Inspector', 'Informe: estimación sin lista de estancias', await ev(() => { const v = g => { const n = document.querySelector(`#panel [data-group="${g}"]`); return n && n.getClientRects().length > 0; }; return !v('areas') && (v('estimate') || v('stats')); }));
  await page.locator('#perlaTab-propiedades').click(); await page.waitForTimeout(200);
  ok('Inspector', 'Propiedades sin selección: indicación', await vis('.perla-props-hint'));
  await page.locator('#perlaTab-estancias').click(); await page.waitForTimeout(200);
  const room = page.locator('#plan polygon.room').nth(2);
  await room.click().catch(() => {}); await page.waitForTimeout(400);
  const t = await ev(() => ({ tab: window.FloorPlanPerla.tab, back: !!document.querySelector('#back') }));
  ok('Inspector', 'Seleccionar estancia → Propiedades', t.tab === 'propiedades' && t.back, JSON.stringify(t));
  await page.locator('#perlaTab-estancias').click(); await page.waitForTimeout(300);
  ok('Inspector', 'Volver a Estancias deselecciona', await ev(() => !!document.querySelector('#panel [data-group="areas"]')));
  await page.locator('#assistantOpen').click(); await page.waitForTimeout(400);
  ok('Inspector', 'Asistente (pie del Inspector) abre el panel', await ev(() => !document.querySelector('#assistantPanel')?.hidden), await ev(() => document.querySelector('#assistantOpen').parentElement.className));
  await page.locator('#assistantOpen').click().catch(() => {}); await closeDialogs();
  const demo = await ev(() => [...document.querySelectorAll('#paletteBuild button')].find(b => /Retirar tabique/.test(b.textContent))?.dataset.tool || null);
  ok('Construir', '«Retirar tabique» = herramienta demolish', !!demo, demo);

  // Copia del ejemplo
  await page.locator('#guideCopyExample').click(); await page.waitForTimeout(800); await closeDialogs();
  const cp = await ev(() => ({ hidden: document.querySelector('#guideCopyExample').hidden, name: document.querySelector('#projectsBtn').textContent }));
  ok('Fila 1', 'Crear copia → proyecto propio (botón se oculta)', cp.hidden && !/ejemplo/i.test(cp.name), JSON.stringify(cp));

  // Idiomas
  for (const [lang, word] of [['en', 'Design'], ['zh', '设计'], ['es', 'Diseñar']]) {
    for (let i = 0; i < 3 && (await ev(() => typeof LANG === 'string' ? LANG : '')) !== lang; i++) { await page.locator('#langBtn').click(); await page.waitForTimeout(400); }
    const s = await ev(() => ({ r: document.querySelector('.perla-r1').innerText + ' ' + document.querySelector('.perla-r2').innerText + ' ' + document.querySelector('.perla-inspector-head').innerText, l: LANG }));
    const cjk = /[㐀-鿿]/.test(s.r);
    ok('Idioma', lang.toUpperCase(), s.l === lang && s.r.includes(word) && (lang === 'zh' || !cjk), s.r.replace(/\s+/g, ' '));
  }
  ok('Consola', 'Sin errores de página', errs.length === 0, errs.join(' | '));
  return JSON.stringify(R);
}
