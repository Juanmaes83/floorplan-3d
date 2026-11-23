async page => {
  // U1 · capturas «antes» (base 86d14fec = #321 + candidata BP-DP, servida en 43985) y «después» (HEAD, 43984).
  const out = '/home/user/pwcli/output/playwright/'; const browser = page.context().browser(); const log = [];
  for (const [port, tag] of [[43985, 'antes'], [43984, 'despues']]) {
    for (const [w, h, dev, touch] of [[1440, 900, 'escritorio', false], [390, 844, 'movil', true]]) {
      const ctx = await browser.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: 1, hasTouch: touch, isMobile: touch }); const p = await ctx.newPage();
      try {
        await p.goto(`http://127.0.0.1:${port}/#inicio`); await p.evaluate(() => localStorage.clear()); await p.reload(); await p.locator('#welcomeInAction').waitFor();
        for (const img of await p.locator('#welcomeDialog img').all()) await img.scrollIntoViewIfNeeded().catch(() => {});
        await p.locator('#welcomeInAction').scrollIntoViewIfNeeded(); await p.waitForTimeout(600);
        await p.screenshot({ path: out + `${tag}-home-en-accion-${dev}.png` });
        const a = p.locator('#welcomeAudience-construction'); await a.scrollIntoViewIfNeeded(); touch ? await a.tap() : await a.click(); await p.waitForTimeout(400);
        await p.screenshot({ path: out + `${tag}-home-profesion-${dev}.png` });
        await p.locator('#welcomeExample').scrollIntoViewIfNeeded(); touch ? await p.locator('#welcomeExample').tap() : await p.locator('#welcomeExample').click(); await p.waitForTimeout(1500);
        await p.screenshot({ path: out + `${tag}-editor-${dev}.png` });
        const d = p.locator('#workArea-deliver'); touch ? await d.tap() : await d.click(); await p.waitForTimeout(1800);
        await p.screenshot({ path: out + `${tag}-entregar-${dev}.png` });
        log.push(`${tag} ${dev} ok`);
      } catch (e) { log.push(`${tag} ${dev}: ` + String(e.message).split('\n')[0]); }
      await ctx.close();
    }
  }
  return JSON.stringify(log);
}
