async page => {
  // UX-312 · Home: diez tarjetas, muestras reales, demos por URL, retrato por profesión y módulos compactos.
  const R = []; const ok = (req, ctl, pass, detail = '') => R.push({ req, ctl, pass: !!pass, detail: String(detail).slice(0, 200) });
  const out = '/home/user/pwcli/output/playwright/'; const U = 'http://127.0.0.1:43984/'; const browser = page.context().browser();
  try {
    for (const [w, h, tag, touch] of [[1440, 900, 'escritorio', false], [390, 844, 'movil', true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
      const errs = []; p.on('pageerror', e => errs.push(String(e)));
      await p.goto(U + '#inicio'); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.locator('#welcomeInAction').waitFor();
      const cards = await p.evaluate(() => [...document.querySelectorAll('#welcomeInAction .demo-card')].map(c => ({ id: c.dataset.demo, img: c.querySelector('img')?.getAttribute('src') || c.querySelector('img')?.currentSrc })));
      await p.locator('#welcomeInAction').scrollIntoViewIfNeeded();
      // Cargar todas las imágenes perezosas
      for (const c of cards) await p.locator(`.demo-card[data-demo="${c.id}"] img`).scrollIntoViewIfNeeded();
      await p.waitForTimeout(800);
      const loaded = await p.evaluate(() => [...document.querySelectorAll('#welcomeInAction .demo-card img')].map(i => i.complete && i.naturalWidth > 0));
      const srcs = await p.evaluate(() => [...document.querySelectorAll('#welcomeInAction .demo-card img')].map(i => i.currentSrc || i.src)); cards.forEach((c, i) => c.img = srcs[i]);
      const cols = await p.evaluate(() => getComputedStyle(document.querySelector('#welcomeInAction .demo-cards')).gridTemplateColumns.split(' ').length);
      ok(tag, 'Diez tarjetas con portada propia cargada', cards.length === 10 && loaded.every(Boolean) && new Set(cards.map(c => c.img)).size === 10, cards.map((c, i) => c.id + (loaded[i] ? '' : ' (sin cargar)') + ' ' + String(c.img).split('/').pop()).join(', ') + ' · columnas ' + cols);
      ok(tag, tag === 'movil' ? 'Una columna en móvil' : 'Dos columnas en escritorio', tag === 'movil' ? cols === 1 : cols === 2, 'columnas ' + cols);
      await p.locator('#welcomeInAction').screenshot({ path: out + `home-en-accion-${tag}.png` });
      // Muestras con archivos reales; vuelta del foco
      for (const id of ['video', 'comparativa', 'estilos', 'entrega']) {
        const b = p.locator('#welcomeDemo-' + id); await b.scrollIntoViewIfNeeded(); touch ? await b.tap() : await b.click(); await p.waitForTimeout(500); await p.waitForFunction(() => [...document.querySelectorAll('#homeMuestra img')].every(x => x.complete && x.naturalWidth > 0), null, { timeout: 8000 }).catch(() => {});
        const m = await p.evaluate(() => { const d = document.querySelector('#homeMuestra'); const media = [...d.querySelectorAll('img,video')]; return { open: d.open, n: media.length, src: media.map(x => x.getAttribute('src')).join(' '), ok: media.every(x => x.tagName === 'VIDEO' || (x.complete && x.naturalWidth > 0)) }; });
        if (id === 'video') { const v = await p.evaluate(async () => { const v = document.querySelector('#homeMuestra video'); if (v.readyState < 1) await new Promise((a, b) => { v.onloadedmetadata = a; v.onerror = () => b(Error('video')); setTimeout(a, 8000); }); return [v.videoWidth, v.videoHeight, Math.round(v.duration * 10) / 10]; }); m.video = v.join('×'); m.ok = m.ok && v[0] === 1280; }
        if (tag === 'escritorio') await p.screenshot({ path: out + `home-muestra-${id}.png` });
        await p.keyboard.press('Escape'); await p.waitForTimeout(250);
        const back = await p.evaluate(() => document.activeElement?.id);
        ok(tag, 'Muestra ' + id, m.open && m.n > 0 && m.ok && back === 'welcomeDemo-' + id, `${m.src}${m.video ? ' · ' + m.video : ''} · foco ${back}`);
      }
      // Profesiones: retrato, resumen y soluciones coordinados
      const seen = [];
      for (const id of ['architecture', 'real-estate', 'developer', 'renovation', 'interior', 'construction']) {
        const b = p.locator('#welcomeAudience-' + id); await b.scrollIntoViewIfNeeded(); touch ? await b.tap() : await b.click(); await p.waitForTimeout(250);
        seen.push(await p.evaluate(() => { const pu = document.querySelector('#welcomeAudiencePurpose'); const i = pu.querySelector('img'); return { a: pu.dataset.audience, img: i?.getAttribute('src'), ok: !!i && i.complete && i.naturalWidth > 0, txt: pu.querySelector('p')?.textContent.slice(0, 40), start: !!pu.querySelector('#welcomeAudienceStart') }; }));
        if (id === 'construction') await p.locator('#welcomeAudience').screenshot({ path: out + `home-profesion-constructora-${tag}.png` });
      }
      ok(tag, 'Seis profesiones: retrato y resumen cambian juntos; acción de inicio a mano', seen.every(s => s.ok && s.start) && new Set(seen.map(s => s.img)).size === 6 && new Set(seen.map(s => s.txt)).size === 6, seen.map(s => s.a + ':' + s.img.split('/').pop()).join(' '));
      // Módulos compactos
      const mods = await p.evaluate(() => [...document.querySelectorAll('.welcome-modules-grid > li.ai-service')].map(li => ({ c: li.classList.contains('perla-compact'), st: !!li.querySelector('.capability-state'), hid: !li.querySelector('.ai-service-what')?.getClientRects().length })));
      ok(tag, 'Módulos: estado, título y acción; descripción en el detalle', mods.length > 0 && mods.every(m => m.c && m.st && m.hid), `${mods.length} módulos`);
      const li = p.locator('.welcome-modules-grid > li.ai-service').first(), t = li.locator('.perla-more-btn');
      await t.scrollIntoViewIfNeeded(); const nb = p.locator('.welcome-modules-grid > li.ai-service').nth(1); const y0 = (await nb.boundingBox()).y;
      if (touch) await t.tap(); else { await t.focus(); await p.keyboard.press('Enter'); }
      await p.waitForTimeout(200); const opened = await li.evaluate(l => !l.querySelector('.perla-detail').hidden && /\S/.test(l.querySelector('.perla-detail').textContent)); const y1 = (await nb.boundingBox()).y;
      if (tag === 'escritorio') await p.locator('.welcome-modules-grid').screenshot({ path: out + 'home-modulos-detalle.png' });
      if (touch) await t.tap(); else await p.keyboard.press('Escape'); await p.waitForTimeout(150);
      const closed = await li.evaluate(l => l.querySelector('.perla-detail').hidden);
      ok(tag, '«Ver detalles» en módulos (' + (touch ? 'toque' : 'teclado') + '), sin mover la rejilla', opened && closed && Math.abs(y0 - y1) < 1, `y ${y0} → ${y1}`);
      // Idioma: sin chino en EN
      if (tag === 'escritorio') { await p.locator('#langBtn').first().click().catch(() => {}); await p.waitForTimeout(400);
        const t2 = await p.evaluate(() => (typeof LANG === 'string' ? LANG : '') + ' ' + document.querySelector('#welcomeInAction').innerText + document.querySelector('#welcomeAudience').innerText);
        ok(tag, 'Home en ' + t2.slice(0, 2).toUpperCase() + ' sin chino', t2.startsWith('en') ? !/[㐀-鿿]/.test(t2) : true, t2.slice(0, 80)); }
      ok(tag, 'Sin errores de página', errs.length === 0, errs.join(' | '));
      await ctx.close();
    }
    // Demos por URL
    for (const id of ['asistente', 'recorrido']) {
      const touch = id === 'recorrido'; const ctx = await browser.newContext({ viewport: touch ? { width: 844, height: 390 } : { width: 1440, height: 900 }, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
      await p.goto(U + '#inicio'); await p.evaluate(() => localStorage.clear()); await p.goto(U + '?demo=' + id);
      await p.waitForFunction(() => window.RubikHomeEnAccion?.demo?.ready || window.RubikHomeEnAccion?.demo?.error, null, { timeout: 180000 }).catch(() => {});
      const st = await p.evaluate(() => ({ demo: window.RubikHomeEnAccion?.demo, walking: !!window.View3D?.walking?.(), joy: !!document.querySelector('#joy')?.getClientRects().length, map: !document.querySelector('#nav3dMap')?.hidden, answer: document.querySelector('#assistantPanel')?.innerText.match(/Hay \d+ estancias[\s\S]{0,60}?Fuente[^\n]*/)?.[0] || '' }));
      await p.waitForTimeout(1200); await p.screenshot({ path: out + `home-demo-${id}.png` });
      ok('Demo', id, st.demo?.ready && (id === 'recorrido' ? st.walking && st.joy && st.map : /Fuente/.test(st.answer)), JSON.stringify({ ready: st.demo?.ready, err: st.demo?.error, walking: st.walking, joy: st.joy, map: st.map, answer: st.answer.replace(/\n/g, ' ') }));
      await p.locator('#homeEnAccionHome').click(); await p.waitForURL(u => !String(u).includes('demo='), { timeout: 30000 }).catch(() => {});
      ok('Demo', id + ' · «Volver al inicio»', !p.url().includes('demo='), p.url());
      await ctx.close();
    }
  } catch (e) { ok('Script', 'interrumpido', false, String(e.message).split('\n')[0]); }
  return JSON.stringify(R);
}
