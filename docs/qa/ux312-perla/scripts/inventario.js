async page => {
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.goto('http://127.0.0.1:43984/#inicio'); await page.evaluate(() => localStorage.clear()); await page.reload();
  await page.locator('#welcomeExample').click(); await page.waitForTimeout(1500);
  return JSON.stringify(await page.evaluate(() => {
    const name = el => (el.getAttribute('aria-label') || el.innerText || el.textContent || el.title || '').replace(/\s+/g, ' ').trim().slice(0, 60);
    const app = document.querySelector('.app');
    return [...app.querySelectorAll('button, summary, select, input[type=range], input[type=file]')].map(el => ({ id: el.id || null, tag: el.tagName.toLowerCase(), key: el.id || el.dataset.tool && 'tool:' + el.dataset.tool || el.dataset.layer && 'layer:' + el.dataset.layer || el.dataset.view && 'view:' + el.dataset.view || el.dataset.mode && 'mode:' + el.dataset.mode || el.dataset.cut && 'cut:' + el.dataset.cut || el.dataset.t && 't:' + el.dataset.t || el.dataset.intent && 'intent:' + el.dataset.intent || null, name: name(el), disabled: !!el.disabled }));
  }));
}
